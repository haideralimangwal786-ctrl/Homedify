const fs = require('fs');
const path = 'e:\\Homedify\\frontend\\src\\pages\\AdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// Looking for the specific broken transition
// We match line 1464 and 1465
const brokenPart = /\)\s+\{\s+title: 'Payout Account'/;
const fixedPart = '),\n                                       },\n                                       {\n                                          title: \'Payout Account\'';

if (content.includes("title: 'Payout Account'")) {
    // Try a simpler replace first if regex is tricky
    content = content.replace("                                          ) \n                                                                          { \n                                           title: 'Payout Account'", 
                              "                                          ) \n                                       },\n                                       { \n                                          title: 'Payout Account'");
    fs.writeFileSync(path, content);
    console.log('File updated successfully');
} else {
    console.log('Pattern not found');
}
