/**
 * Test Impersonation API
 */

const http = require('http');

const userId = '51dbb484-a52a-445f-b129-803a638c4c6f';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsImVtYWlsIjoiYWRtaW5AZmluYXN0ZXIuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYzMDIyOTg0LCJleHAiOjE3NjM2Mjc3ODR9.vVCize_cNcf47G0sxukIBMhxFTIDpMfuYmyWEuIVsic';

const data = JSON.stringify({
  reason: 'Testing impersonation feature from script'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: `/api/impersonate/${userId}`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`\nStatus: ${res.statusCode}`);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));

  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse:');
    try {
      const json = JSON.parse(responseData);
      console.log(JSON.stringify(json, null, 2));

      if (json.token) {
        console.log('\n✅ Impersonation token generated successfully!');
        console.log('User:', json.user);
        console.log('Expires in:', json.expiresIn, 'seconds');
      } else {
        console.log('\n❌ Failed to get impersonation token');
      }
    } catch (e) {
      console.log(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
