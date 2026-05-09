const fs = require('fs');
const path = 'e:/Homedify/frontend/src/pages/AdminDashboard.jsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Restore the imports
if (!content.includes("import { useSettings }")) {
    const importMarker = "import AdminReviewModeration from './AdminReviewModeration'";
    const newImports = `import AdminReviewModeration from './AdminReviewModeration'
import { useSettings } from '../context/SettingsContext'
import { calculatePayout } from '../utils/financialUtils'`;
    content = content.replace(importMarker, newImports);
}

// 2. Add Settings and Payout logic
if (!content.includes("useSettings()")) {
    const stateMarker = "const { token, user, logout } = useContext(AuthContext)";
    const newState = `const { token, user, logout } = useContext(AuthContext)
  const { commissionRate, updateGlobalSettings } = useSettings()
  const [newCommission, setNewCommission] = useState(commissionRate)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)`;
    content = content.replace(stateMarker, newState);
}

// 3. Add to menuItems
if (!content.includes("system_financials")) {
    const financeMarker = "{ key: 'finance', icon: <Wallet size={20} />, label:";
    const newMenuItem = `{ key: 'system_financials', icon: <Landmark size={20} />, label: 'System Financials' },
    { key: 'finance', icon: <Wallet size={20} />, label:`;
    content = content.replace(financeMarker, newMenuItem);
}

// 4. Implement the tab content logic
// This goes inside the main content area.
if (!content.includes("activeTab === 'system_financials'")) {
    const tabEndMarker = "{activeTab === 'finance' && (";
    const newTabContent = `{activeTab === 'system_financials' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>
                      <Card 
                        title={<span className="text-lg font-black text-gray-900 uppercase">Global Financial Control</span>}
                        className="border-none shadow-sm"
                      >
                        <div className="space-y-8 py-4">
                          <div>
                            <Text className="text-[10px] font-black text-coral uppercase tracking-[0.2em] block mb-4">Commission Configuration</Text>
                            <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100">
                               <div className="flex justify-between items-center mb-4">
                                  <Text className="font-bold text-gray-700">Platform Commission (%)</Text>
                                  <Text className="font-black text-coral text-lg">{newCommission}%</Text>
                               </div>
                               <Input 
                                  type="range" 
                                  min="0" 
                                  max="50" 
                                  step="1"
                                  value={newCommission}
                                  onChange={(e) => setNewCommission(Number(e.target.value))}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-coral mb-6"
                               />
                               <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  <span>0%</span>
                                  <span>25%</span>
                                  <span>50%</span>
                               </div>
                            </div>
                          </div>

                          <div className="bg-coral/5 p-6 rounded-[24px] border border-dashed border-coral/20">
                             <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-coral text-white rounded-xl flex items-center justify-center shrink-0">
                                   <Zap size={20} />
                                </div>
                                <div>
                                   <Text className="font-black text-gray-900 block mb-1">Global Sync Enabled</Text>
                                   <Text className="text-xs text-gray-500 leading-relaxed">
                                      Updating this rate will immediately affect all <span className="font-bold">Pending Payouts</span>, 
                                      <span className="font-bold">Checkout Totals</span>, and <span className="font-bold">Seller Earnings</span> views across the entire platform.
                                   </Text>
                                </div>
                             </div>
                          </div>

                          <Button 
                            type="primary"
                            block
                            className="bg-gray-900 hover:bg-black border-none h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:scale-[1.01] active:scale-95 transition-all"
                            onClick={async () => {
                               setIsUpdatingSettings(true);
                               const result = await updateGlobalSettings(newCommission);
                               if (result.success) {
                                  toast.success('System Financials Updated & Synced Globally!');
                               } else {
                                  toast.error(result.error);
                               }
                               setIsUpdatingSettings(false);
                            }}
                            loading={isUpdatingSettings}
                          >
                            Update & Sync Globally
                          </Button>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                      <Card 
                        title={<span className="text-lg font-black text-gray-900 uppercase">Payout Preview</span>}
                        className="border-none shadow-sm h-full"
                      >
                        <div className="space-y-6 py-4">
                           <div className="p-6 rounded-[24px] bg-gray-50 border border-gray-100">
                              <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-6">Example: Rs. 10,000 Item</Text>
                              
                              <div className="space-y-4">
                                 {[
                                    { label: 'Item Price', value: 10000, color: 'text-gray-900' },
                                    { label: \`Commission (\${newCommission}%)\`, value: 10000 * (newCommission/100), color: 'text-red-500' },
                                 ].map((row, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                       <Text className="font-bold text-gray-500">{row.label}</Text>
                                       <Text className={\`font-black \${row.color}\`}>Rs. {row.value.toLocaleString()}</Text>
                                    </div>
                                 ))}
                                 <Divider className="my-4 border-gray-200" />
                                 <div className="flex justify-between items-center">
                                    <Text className="font-black text-gray-900 uppercase tracking-wider">Net Seller Payout</Text>
                                    <Text className="font-black text-coral text-xl italic">Rs. {(10000 * (1 - newCommission/100)).toLocaleString()}</Text>
                                 </div>
                              </div>
                           </div>

                           <div className="bg-blue-50 p-6 rounded-[24px] border border-blue-100 flex gap-4">
                              <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0">
                                 <InfoIcon size={20} />
                              </div>
                              <Text className="text-xs text-blue-700 font-medium leading-relaxed">
                                 The UK-standard alignment (Amounts Right, Labels Left) ensures professional readability for financial audit logs.
                              </Text>
                           </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}

              `;
    content = content.replace(tabEndMarker, newTabContent + tabEndMarker);
}

fs.writeFileSync(path, content, 'utf8');
console.log('AdminDashboard System Financials Tab integrated.');
