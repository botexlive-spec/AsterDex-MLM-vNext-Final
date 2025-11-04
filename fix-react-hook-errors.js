import fs from 'fs';

console.log('🔧 Fixing React Hook Errors...\n');

const packagePath = 'package.json';
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

// Add overrides to force all packages to use same React version
if (!pkg.overrides) {
  pkg.overrides = {};
}

// Force React 18.3.1 for all packages
pkg.overrides.react = "18.3.1";
pkg.overrides["react-dom"] = "18.3.1";

console.log('✅ Added React overrides to package.json');
console.log('   • react: 18.3.1');
console.log('   • react-dom: 18.3.1');

// Write updated package.json
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2), 'utf-8');

console.log('\n📊 Next steps:');
console.log('   1. Run: npm install');
console.log('   2. Restart dev server');
console.log('   3. Hard refresh browser (Ctrl+F5)');
console.log('\n✅ Fix applied successfully!');
