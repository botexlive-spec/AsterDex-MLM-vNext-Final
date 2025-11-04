import fs from 'fs';

console.log('🔧 Fixing charAt() errors in TeamNew.tsx...\n');

const filePath = 'app/pages/user/TeamNew.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Fix 1: Line ~334 - node.name.charAt(0)
content = content.replace(
  /\{node\.name\.charAt\(0\)\}/g,
  '{node.name?.charAt(0) || \'?\'}'
);

// Fix 2: Line ~694 - row.name.charAt(0)
content = content.replace(
  /\{row\.name\.charAt\(0\)\}/g,
  '{row.name?.charAt(0) || \'?\'}'
);

// Fix 3: Line ~725 - value.charAt(0)
content = content.replace(
  /value\.charAt\(0\)\.toUpperCase\(\) \+ value\.slice\(1\)/g,
  '(value?.charAt(0).toUpperCase() || \'\') + (value?.slice(1) || \'\')'
);

// Save the fixed file
fs.writeFileSync(filePath, content, 'utf-8');

console.log('✅ Fixed all charAt() errors:');
console.log('   • node.name.charAt(0) → node.name?.charAt(0) || \'?\'');
console.log('   • row.name.charAt(0) → row.name?.charAt(0) || \'?\'');
console.log('   • value.charAt(0) → value?.charAt(0) (with null checks)');
console.log('\n✅ TeamNew.tsx updated successfully!');
console.log('💡 Page should auto-reload and work now.');
