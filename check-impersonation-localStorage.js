// This script checks the impersonation data in localStorage
// To use: Open browser console (F12) and paste this script

console.log('%c🔍 IMPERSONATION DEBUG CHECK', 'background: #00C7D1; color: #000; font-size: 20px; padding: 10px; font-weight: bold;');
console.log('═'.repeat(80));

const impersonationData = localStorage.getItem('impersonation');

if (!impersonationData) {
  console.log('%c❌ NOT IMPERSONATING', 'color: #f59e0b; font-size: 16px; font-weight: bold;');
  console.log('No impersonation data found in localStorage');
} else {
  try {
    const data = JSON.parse(impersonationData);
    console.log('%c✅ IMPERSONATING', 'color: #10b981; font-size: 16px; font-weight: bold;');
    console.log('\n📋 Impersonation Details:');
    console.log('─'.repeat(80));
    console.table({
      'Admin ID': data.adminId,
      'Admin Email': data.adminEmail,
      'Target User ID': data.targetUserId,
      'Target Email': data.targetUserEmail,
      'Started At': new Date(data.timestamp).toLocaleString()
    });

    console.log('\n🔑 Target User ID (IMPORTANT):');
    console.log('%c' + data.targetUserId, 'background: #1e293b; color: #00C7D1; font-size: 14px; padding: 5px; font-family: monospace;');

    console.log('\n📧 Target Email:');
    console.log('%c' + data.targetUserEmail, 'background: #1e293b; color: #00C7D1; font-size: 14px; padding: 5px; font-family: monospace;');

    console.log('\n📝 Raw JSON:');
    console.log(JSON.stringify(data, null, 2));

  } catch (e) {
    console.log('%c❌ ERROR', 'color: #ef4444; font-size: 16px; font-weight: bold;');
    console.log('Invalid impersonation data:', impersonationData);
  }
}

console.log('\n' + '═'.repeat(80));
console.log('%c💡 TIP: If the Target User ID stays the same when impersonating different users, there\'s a bug!', 'color: #f59e0b; font-style: italic;');
console.log('═'.repeat(80));

// Also check which user the AuthContext thinks is logged in
console.log('\n🔍 Checking all localStorage keys...');
const allKeys = Object.keys(localStorage);
console.log('Total keys in localStorage:', allKeys.length);
console.log('Keys:', allKeys.join(', '));
