const fs = require('fs');
const path = 'e:/Homedify/frontend/src/pages/AdminDashboard.jsx';

let lines = fs.readFileSync(path, 'utf8').split('\n');

// We want to delete from line 1316 to line 1510 (1-indexed).
// In 0-indexed array, that's indices 1315 to 1509.
// But wait, the file might have changed since the last view.
// Let's use the content to find the range.

const firstFinanceStart = lines.findIndex((l, i) => i >= 1300 && l.includes("activeTab === 'finance'"));
const secondFinanceStart = lines.findIndex((l, i) => i > firstFinanceStart && l.includes("activeTab === 'finance'"));

if (firstFinanceStart !== -1 && secondFinanceStart !== -1) {
    console.log(`Removing lines from ${firstFinanceStart + 1} to ${secondFinanceStart}`);
    lines.splice(firstFinanceStart, secondFinanceStart - firstFinanceStart);
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
    console.log('SUCCESS: Redundant block removed.');
} else {
    console.log('Could not find both finance tab occurrences.');
    console.log('firstFinanceStart:', firstFinanceStart);
    console.log('secondFinanceStart:', secondFinanceStart);
}
