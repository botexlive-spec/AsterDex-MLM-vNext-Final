import { readFileSync, writeFileSync } from 'fs';

const file = 'app/pages/user/TeamNew.tsx';
const replacementFile = 'team-table-replacement.txt';

const lines = readFileSync(file, 'utf8').split('\n');
const replacement = readFileSync(replacementFile, 'utf8');

// Find the line with "{/* Table */}"
const tableStartIndex = lines.findIndex(line => line.includes('{/* Table */}'));

if (tableStartIndex === -1) {
  console.log('❌ Could not find table start marker');
  process.exit(1);
}

// Find the closing of the table section (after the summary)
let tableEndIndex = -1;
for (let i = tableStartIndex; i < lines.length; i++) {
  if (lines[i].includes('{filteredMembers.length > 0 && (')) {
    // Find the closing of this block
    let braceCount = 0;
    let foundStart = false;
    for (let j = i; j < lines.length; j++) {
      const openBraces = (lines[j].match(/{/g) || []).length;
      const closeBraces = (lines[j].match(/}/g) || []).length;

      if (openBraces > 0) foundStart = true;
      braceCount += openBraces - closeBraces;

      if (foundStart && braceCount === 0 && lines[j].includes(')}')) {
        tableEndIndex = j;
        break;
      }
    }
    break;
  }
}

if (tableEndIndex === -1) {
  console.log('❌ Could not find table end');
  process.exit(1);
}

console.log(`Found table section from line ${tableStartIndex + 1} to ${tableEndIndex + 1}`);

// Replace the section
const before = lines.slice(0, tableStartIndex).join('\n');
const after = lines.slice(tableEndIndex + 1).join('\n');

const newContent = before + '\n' + replacement + '\n' + after;

writeFileSync(file, newContent);
console.log('✅ Successfully replaced table section with ResponsiveTable');
