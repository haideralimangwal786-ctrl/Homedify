const fs = require('fs');
const path = 'e:/Homedify/frontend/src/pages/AdminDashboard.jsx';

let content = fs.readFileSync(path, 'utf8');

// Find the segment between 'Net Payout (90%)' and '{financeSubTab === "refund"'
// and replace it with a clean version of both columns.

const startMarker = "Net Payout (90%)</span>";
const endMarker = "{financeSubTab === 'refund'";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    // Find the end of the current column
    const columnEndIndex = content.indexOf('}', startIndex);
    const nextBrace = content.indexOf('}', columnEndIndex + 1);
    const tableEndBrace = content.indexOf(']', nextBrace);
    
    const cleanSegment = `</span>
                                             </div>
                                           )
                                         }
                                       },
                                       { 
                                          title: 'Actions', width: 100, 
                                          align: 'right',
                                          render: (_, record) => (
                                             <Button 
                                                type="primary"
                                                className="bg-gray-900 hover:bg-black border-none font-black text-[10px] uppercase tracking-widest rounded-xl h-10 px-6 shadow-lg shadow-black/5 hover:scale-[1.02] active:scale-95 transition-all"
                                                onClick={() => {
                                                  setSelectedFinanceOrder(record);
                                                  setPayoutModalVisible(true);
                                                }}
                                             >
                                                <ArrowRightCircle size={18} />
                                             </Button>
                                          )
                                       }
                                    ]}
                                 />
                              </Card>
                           )}\n\n                          `;
    
    content = content.slice(0, startIndex + startMarker.length) + cleanSegment + content.slice(endIndex);
    fs.writeFileSync(path, content, 'utf8');
    console.log('SUCCESS: Payout table final fix applied.');
} else {
    console.log('Markers not found.');
}
