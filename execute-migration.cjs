const fs = require('fs');

console.log('\n🔧 DATABASE MIGRATION - READY TO EXECUTE\n');
console.log('='.repeat(60));

const sqlFile = 'database/FIX_USER_PACKAGES_SCHEMA.sql';

if (!fs.existsSync(sqlFile)) {
  console.error('❌ Migration file not found!');
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, 'utf8');

console.log('\n📋 COPY THE SQL BELOW AND RUN IN SUPABASE:\n');
console.log('='.repeat(60));
console.log(sql);
console.log('='.repeat(60));

console.log('\n📖 HOW TO EXECUTE:\n');
console.log('1. Go to: https://supabase.com/dashboard/project/dsgtyrwtlpnckvcozfbc');
console.log('2. Click: "SQL Editor" in left sidebar');
console.log('3. Click: "New query" button');
console.log('4. Copy everything between the lines above');
console.log('5. Paste into the SQL editor');
console.log('6. Click: "RUN" (or press Ctrl+Enter)');
console.log('7. Wait for "Success" message\n');

console.log('✅ After success, verify with:');
console.log('   node verify-user-packages-schema.js\n');

