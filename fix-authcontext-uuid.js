import fs from 'fs';

const filePath = 'app/context/AuthContext.tsx';
const content = fs.readFileSync(filePath, 'utf-8');

// Find and replace the user ID mapping
const oldCode = `      const isAdmin = email.includes('admin');
      const mockUser: User = {
        id: (email === 'admin@asterdex.com' ? 'e1973e19-ec82-4149-bd6e-1cb19336d502' : email === 'user@asterdex.com' ? '1a78f252-4059-4e10-afcf-238254359eb8' : crypto.randomUUID()),`;

const newCode = `      const isAdmin = email.includes('admin');

      // Map emails to real database UUIDs
      let userId: string;
      if (email === 'admin@asterdex.com' || email === 'admin@finaster.com') {
        userId = 'e1973e19-ec82-4149-bd6e-1cb19336d502';
      } else if (email === 'user@asterdex.com') {
        userId = '1a78f252-4059-4e10-afcf-238254359eb8';
      } else if (email === 'user@finaster.com') {
        userId = '4a6ee960-ddf0-4daf-a029-e2e5a13d8f87'; // Real UUID from database
      } else {
        userId = crypto.randomUUID();
      }

      const mockUser: User = {
        id: userId,`;

const newContent = content.replace(oldCode, newCode);

if (newContent !== content) {
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log('✅ Successfully fixed AuthContext UUID mapping');
  console.log('\n📊 Changes:');
  console.log('   • Added user@finaster.com → 4a6ee960-ddf0-4daf-a029-e2e5a13d8f87');
  console.log('   • Added admin@finaster.com support');
  console.log('   • Improved code readability');
} else {
  console.error('❌ Could not find the code to replace');
  console.log('The code might have already been updated or changed.');
}
