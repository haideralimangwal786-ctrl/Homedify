const fs = require('fs');
const path = 'e:\\Homedify\\frontend\\src\\pages\\AdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// Use a regex that is more flexible with whitespace and line endings
const regex = /\)\s*\n\s*\{\s*title: 'Payout Account'/;
const replacement = '),\n                                       },\n                                       {\n                                          title: \'Payout Account\'';

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content);
    console.log('File updated successfully using regex');
} else {
    console.log('Pattern not found with regex. Current content around that area:');
    const index = content.indexOf("title: 'Payout Account'");
    if (index !== -1) {
        console.log(content.substring(index - 100, index + 100));
    } else {
        console.log('Could not find Payout Account at all');
    }
}
