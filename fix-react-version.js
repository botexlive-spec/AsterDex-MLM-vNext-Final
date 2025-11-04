import fs from 'fs';

console.log('🔧 Fixing React Version Conflicts...\n');

const packagePath = 'package.json';
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

// Remove overrides (didn't work)
delete pkg.overrides;

// Update React to 18.3.1 in dependencies
if (pkg.dependencies) {
  pkg.dependencies.react = "18.3.1";
  pkg.dependencies["react-dom"] = "18.3.1";
}

// Add resolutions for yarn/pnpm compatibility
pkg.resolutions = {
  "react": "18.3.1",
  "react-dom": "18.3.1"
};

console.log('✅ Updated React versions:');
console.log('   • dependencies.react: 18.3.1');
console.log('   • dependencies.react-dom: 18.3.1');
console.log('   • Added resolutions for peer deps');

// Write updated package.json
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2), 'utf-8');

console.log('\n✅ Fix applied successfully!');
console.log('\n📊 React version conflicts should be resolved.');
