const fs = require('fs');
const file = 'e:/Homedify/frontend/src/pages/AdminDashboard.jsx';
const content = fs.readFileSync(file, 'utf8');

let braces = 0;
let parens = 0;
let brackets = 0;

for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') braces++;
    if (content[i] === '}') braces--;
    if (content[i] === '(') parens++;
    if (content[i] === ')') parens--;
    if (content[i] === '[') brackets++;
    if (content[i] === ']') brackets--;
}

console.log('Braces:', braces);
console.log('Parens:', parens);
console.log('Brackets:', brackets);
