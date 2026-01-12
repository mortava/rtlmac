// Test Fannie Mae ROPC Authentication
// Run: node test-fanniemae-ropc.js

// Developer Portal credentials
const APP_ID = '54f26e96-cc2d-4329-8c0f-6cc50009a285';
const APP_PASSWORD = '9yRj_BFL5kjJ0HY.OoL2mFEEHiOtLv6S9aMPiMv0BF~KpxC8zCzA1RF4QKxGWRwM';

// Token URLs to try
const TOKEN_URLS = [
  'https://fmssoapi.fanniemae.com/as/token.oauth2',
  'https://fmsso-api.fanniemae.com/as/token.oauth2',
];

async function testAuth() {
  console.log('=== Fannie Mae ROPC Auth Test ===\n');
  console.log('Testing with ROPC (password) grant type...\n');

  for (const tokenUrl of TOKEN_URLS) {
    console.log(`Testing URL: ${tokenUrl}`);

    // Test 1: ROPC grant (password)
    console.log('  1. Testing grant_type=password...');
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: APP_ID,
          password: APP_PASSWORD,
        }),
      });
      console.log(`     Status: ${response.status}`);
      const data = await response.text();
      console.log(`     Response: ${data.substring(0, 300)}...`);

      if (response.ok) {
        console.log('     ✅ SUCCESS!\n');
        const parsed = JSON.parse(data);
        return parsed.access_token;
      }
    } catch (error) {
      console.log(`     ❌ Error: ${error.message}`);
    }

    // Test 2: Client credentials (original method)
    console.log('  2. Testing grant_type=client_credentials...');
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: APP_ID,
          client_secret: APP_PASSWORD,
        }),
      });
      console.log(`     Status: ${response.status}`);
      const data = await response.text();
      console.log(`     Response: ${data.substring(0, 300)}...`);

      if (response.ok) {
        console.log('     ✅ SUCCESS!\n');
        const parsed = JSON.parse(data);
        return parsed.access_token;
      }
    } catch (error) {
      console.log(`     ❌ Error: ${error.message}`);
    }

    // Test 3: Basic Auth header
    console.log('  3. Testing with Basic Auth header...');
    try {
      const basicAuth = Buffer.from(`${APP_ID}:${APP_PASSWORD}`).toString('base64');
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
        }),
      });
      console.log(`     Status: ${response.status}`);
      const data = await response.text();
      console.log(`     Response: ${data.substring(0, 300)}...`);

      if (response.ok) {
        console.log('     ✅ SUCCESS!\n');
        const parsed = JSON.parse(data);
        return parsed.access_token;
      }
    } catch (error) {
      console.log(`     ❌ Error: ${error.message}`);
    }

    console.log('');
  }

  console.log('\n❌ All authentication methods failed.\n');
  console.log('Possible issues:');
  console.log('1. App not yet approved in Developer Portal');
  console.log('2. Credentials expired or incorrect');
  console.log('3. App needs specific grant types enabled');
  console.log('4. Network/VPN access required');
  return null;
}

testAuth();
