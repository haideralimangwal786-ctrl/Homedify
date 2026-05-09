const fs = require('fs');
const file = 'e:/Homedify/frontend/src/pages/AdminDashboard.jsx';
const content = fs.readFileSync(file, 'utf8');

let braces = [];
let parens = [];
let brackets = [];

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        if (line[j] === '{') braces.push(i + 1);
        if (line[j] === '}') {
            if (braces.length === 0) console.log('Extra } at line', i + 1);
            else braces.pop();
        }
        if (line[j] === '(') parens.push(i + 1);
        if (line[j] === ')') {
            if (parens.length === 0) console.log('Extra ) at line', i + 1);
            else parens.pop();
        }
        if (line[j] === '[') brackets.push(i + 1);
        if (line[j] === ']') {
            if (brackets.length === 0) console.log('Extra ] at line', i + 1);
            else brackets.pop();
        }
    }
}

if (braces.length > 0) console.log('Unclosed { at lines', braces);
if (parens.length > 0) console.log('Unclosed ( at lines', parens);
if (brackets.length > 0) console.log('Unclosed [ at lines', brackets);
