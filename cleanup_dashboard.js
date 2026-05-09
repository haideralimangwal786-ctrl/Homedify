const fs = require('fs');
const path = 'e:/Homedify/frontend/src/pages/AdminDashboard.jsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Remove the redundant/corrupted tab block.
// This block starts with {activeTab === 'finance' && ( but it's the FIRST occurrence inside the tabs list.
// Actually, it's easier to find the block that contains the broken line 1466 (</Select.Option>).

const brokenMarker = '</Select.Option>\n                           </Select>';
const startTag = "{activeTab === 'finance' && (";
const endTag = '              )}';

// Find the occurrence of the broken marker
const brokenIdx = content.indexOf(brokenMarker);

if (brokenIdx !== -1) {
    // Search backwards for the start of the tab block
    const startIdx = content.lastIndexOf(startTag, brokenIdx);
    // Search forwards for the end of the tab block
    // We need to skip the finance, orders, categories, and reviews duplicates.
    // The last duplicate is 'reviews' which ends with )} at around 1509.
    
    // Let's find the 'activeTab === "finance"' that follows the reviews duplicate.
    const nextFinanceIdx = content.indexOf(startTag, brokenIdx + 100);
    
    if (startIdx !== -1 && nextFinanceIdx !== -1) {
        console.log('Found redundant block to remove.');
        content = content.slice(0, startIdx) + content.slice(nextFinanceIdx);
    }
}

// 2. Fix the broken table columns.
// Looking for the Courier column and replacing it and the broken space after it.

const courierMarker = "title: 'Courier', width: 100, \n                                         dataIndex: 'shippingReceipt',";

const newColumns = `                                      { 
                                         title: 'Courier', width: 100, 
                                         dataIndex: 'shippingReceipt', 
                                         align: 'center',
                                         render: (slip) => (
                                            <div className="flex justify-center">
                                               {slip ? (
                                                 <div className="group relative cursor-pointer hover:scale-110 transition-all duration-300 w-10 h-10">
                                                    <div className="absolute inset-0 z-20 opacity-0">
                                                      <AntImage 
                                                        src={getMediaUrl(slip)} 
                                                        width="100%"
                                                        height="100%"
                                                        fallback="https://files.catbox.moe/6z7x6v.png"
                                                        preview={{ mask: null }}
                                                      />
                                                    </div>
                                                    <div className="absolute inset-0 z-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-coral group-hover:text-white group-hover:border-coral group-hover:shadow-md group-hover:shadow-coral/20 transition-all duration-300 shadow-sm">
                                                      <ImageIcon size={14} className="group-hover:scale-125 transition-transform duration-300" />
                                                    </div>
                                                 </div>
                                               ) : (
                                                 <div className="w-10 h-10 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-200">
                                                   <FileText size={14} />
                                                 </div>
                                               )}
                                            </div>
                                         ),
                                       },
                                       {
                                          title: 'Payout Account', width: 220,
                                          render: (_, record) => {
                                            const accNum = record.sellerId?.bankDetails?.accountNumber;
                                            const bank   = record.sellerId?.bankDetails?.bankName || '';
                                            const store  = record.sellerId?.storeName || 'Artisan';
                                            const isEP   = bank.toLowerCase().includes('easypaisa');
                                            const isJC   = bank.toLowerCase().includes('jazzcash');

                                            if (!accNum) {
                                              return (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-dashed border-red-200">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                                  <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">Account Missing</span>
                                                </div>
                                              );
                                            }

                                            return (
                                              <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5">
                                                  {isEP && (
                                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-[#00B551] text-white shadow-sm">EasyPaisa</span>
                                                  )}
                                                  {isJC && (
                                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-[#ED1C24] text-white shadow-sm">JazzCash</span>
                                                  )}
                                                  {!isEP && !isJC && bank && (
                                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-gray-200 text-gray-600">{bank}</span>
                                                  )}
                                                </div>
                                                <Text copyable={{ text: accNum, tooltips: ['Copy number', 'Copied!'] }} className="font-mono font-bold text-[12px] text-gray-900 leading-none tracking-tighter">
                                                  {accNum}
                                                </Text>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">{store}</span>
                                              </div>
                                            );
                                          }
                                       },
                                       {
                                         title: 'Amount', width: 120, 
                                         align: 'right',
                                         render: (_, record) => {
                                           const gross = record.total || 0;
                                           const commission = gross * 0.1;
                                           const net = gross - commission;
                                           return (
                                             <div className="flex flex-col items-end">
                                               <span className="text-[12px] font-black text-coral italic tracking-tighter">Rs. {net.toLocaleString()}</span>
                                               <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-none">Net Payout (90%)</span>
                                             </div>
                                           )
                                         }
                                       },`;

// Find the broken columns block. It likely ends with '},      },' now or something similar.
const actionsMarker = "title: 'Actions', width: 100,";
const startOfBrokenBlock = content.lastIndexOf("title: 'Courier'", content.indexOf(actionsMarker));

if (startOfBrokenBlock !== -1) {
    const endOfBrokenBlock = content.lastIndexOf('{', content.indexOf(actionsMarker));
    console.log('Fixing columns block.');
    content = content.slice(0, startOfBrokenBlock) + newColumns + content.slice(endOfBrokenBlock);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Cleanup complete.');
