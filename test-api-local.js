// Run this locally: node test-api-local.js
// This tests if APIs work from your machine (which may have VPN/network access)

const CLIENT_ID = '58323228-ed49-4861-bade-9b91e4270bb7';
const CLIENT_SECRET = 'bWpvBJkUs3xiW5XJVaTs11IiutuZ6zcwot92gZAApP9yN7~IpQag6Li_auFNVhNz';
const TOKEN_URL = 'https://fmsso-api.fanniemae.com/as/token.oauth2';
const API_BASE = 'https://api.fanniemae.com';

async function testConnection() {
  console.log('=== Fannie Mae API Connection Test ===\n');

  // Test 1: OAuth Token
  console.log('1. Testing OAuth Token...');
  try {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    console.log(`   Status: ${tokenResponse.status}`);
    const tokenData = await tokenResponse.text();
    console.log(`   Response: ${tokenData.substring(0, 200)}...`);

    if (tokenResponse.ok) {
      const parsed = JSON.parse(tokenData);
      console.log('   ✅ OAuth SUCCESS - Token obtained\n');

      // Test 2: Authenticated API
      console.log('2. Testing Authenticated API (Construction Spending)...');
      const apiResponse = await fetch(
        `${API_BASE}/v1/construction-spending/section?section=Total`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${parsed.access_token}`,
          },
        }
      );
      console.log(`   Status: ${apiResponse.status}`);
      const apiData = await apiResponse.text();
      console.log(`   Response: ${apiData.substring(0, 300)}...`);
    } else {
      console.log('   ❌ OAuth FAILED\n');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 3: Public API (no auth)
  console.log('3. Testing Public API (The Exchange - Loan Limits)...');
  try {
    const publicResponse = await fetch(
      'https://api.theexchange.fanniemae.com/v1/loan-limits?state=CA',
      { headers: { Accept: 'application/json' } }
    );
    console.log(`   Status: ${publicResponse.status}`);
    const publicData = await publicResponse.text();
    console.log(`   Response: ${publicData.substring(0, 300)}...`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

testConnection();
