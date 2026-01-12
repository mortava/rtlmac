// Test The Exchange Cognito Authentication
// Run: node test-exchange.js

const COGNITO_REGION = 'us-east-1';
const COGNITO_CLIENT_ID = '380diitmsba7d6220h8lsq1bqo';
const COGNITO_CLIENT_SECRET = 'ttvbi5cl4ego790tm95d6p4g4acqocqqdkdf4ev7emoirm4rcvt';
const USERNAME = 'mymortava@gmail.com';
const PASSWORD = 'faPlantshop25$';

async function testExchangeAuth() {
  console.log('=== The Exchange Cognito Auth Test ===\n');

  // Test 1: AWS Cognito Authentication
  console.log('1. Testing AWS Cognito Authentication...');
  console.log(`   Username: ${USERNAME}`);
  console.log(`   Client ID: ${COGNITO_CLIENT_ID}`);
  console.log(`   Region: ${COGNITO_REGION}\n`);

  const cognitoUrl = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

  try {
    const response = await fetch(cognitoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      },
      body: JSON.stringify({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: USERNAME,
          PASSWORD: PASSWORD,
        },
      }),
    });

    console.log(`   Status: ${response.status}`);
    const data = await response.text();
    console.log(`   Response: ${data.substring(0, 500)}...`);

    if (response.ok) {
      const parsed = JSON.parse(data);
      console.log('\n   ✅ COGNITO AUTH SUCCESS!\n');

      const token = parsed.AuthenticationResult?.AccessToken;
      if (token) {
        console.log(`   Token preview: ${token.substring(0, 50)}...`);

        // Test 2: Call Exchange API with token
        console.log('\n2. Testing Exchange API with token...');
        const apiResponse = await fetch(
          'https://api.theexchange.fanniemae.com/v1/loan-limits?state=CA',
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log(`   API Status: ${apiResponse.status}`);
        const apiData = await apiResponse.text();
        console.log(`   API Response: ${apiData.substring(0, 500)}...`);
      }
    } else {
      console.log('\n   ❌ COGNITO AUTH FAILED');
      try {
        const errorData = JSON.parse(data);
        console.log(`   Error Type: ${errorData.__type}`);
        console.log(`   Error Message: ${errorData.message}`);
      } catch {}
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

testExchangeAuth();
