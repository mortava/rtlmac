import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, getExchangeToken, hasExchangeCredentials } from '@/lib/fanniemae';

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),

    // Developer Portal Config (Business Partner APIs)
    developerPortal: {
      hasClientId: !!process.env.FANNIEMAE_CLIENT_ID,
      hasClientSecret: !!process.env.FANNIEMAE_CLIENT_SECRET,
      tokenUrl: process.env.FANNIEMAE_TOKEN_URL,
      apiBase: process.env.FANNIEMAE_API_BASE,
    },

    // The Exchange Config (Public APIs - FREE)
    theExchange: {
      hasUsername: !!process.env.EXCHANGE_USERNAME,
      hasPassword: !!process.env.EXCHANGE_PASSWORD,
      hasCognitoClientId: !!process.env.EXCHANGE_COGNITO_CLIENT_ID,
      apiUrl: process.env.EXCHANGE_API_URL || 'https://api.theexchange.fanniemae.com',
      cognitoRegion: process.env.COGNITO_REGION || 'us-east-1',
      credentialsConfigured: hasExchangeCredentials(),
    },

    tests: {},
  };

  // Test 1: Developer Portal OAuth Token
  console.log('[TEST] Testing Developer Portal OAuth...');
  try {
    const token = await getAccessToken();
    results.tests.developerPortalOAuth = {
      success: true,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    };
  } catch (error) {
    results.tests.developerPortalOAuth = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      note: 'Business Partner APIs require approved seller/servicer status',
    };
  }

  // Test 2: The Exchange Cognito Auth
  console.log('[TEST] Testing Exchange Cognito Auth...');
  if (hasExchangeCredentials()) {
    try {
      const token = await getExchangeToken();
      results.tests.exchangeCognitoAuth = {
        success: true,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
      };
    } catch (error) {
      results.tests.exchangeCognitoAuth = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  } else {
    results.tests.exchangeCognitoAuth = {
      success: false,
      error: 'Exchange credentials not configured',
      setup: {
        step1: 'Register free at https://theexchange.fanniemae.com',
        step2: 'Set EXCHANGE_USERNAME in .env.local',
        step3: 'Set EXCHANGE_PASSWORD in .env.local',
        step4: 'Set EXCHANGE_COGNITO_CLIENT_ID in .env.local',
      },
    };
  }

  // Test 3: Exchange Public API (direct call without auth to test connectivity)
  console.log('[TEST] Testing Exchange API connectivity...');
  try {
    const exchangeUrl = process.env.EXCHANGE_API_URL || 'https://api.theexchange.fanniemae.com';
    const response = await fetch(
      `${exchangeUrl}/v1/loan-limits?state=CA`,
      {
        headers: { Accept: 'application/json' },
        // Short timeout for connectivity test
        signal: AbortSignal.timeout(10000),
      }
    );
    const status = response.status;
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
    results.tests.exchangeApiConnectivity = {
      success: response.ok,
      status,
      statusText: response.ok ? 'Connected' : `HTTP ${status}`,
      dataPreview: typeof data === 'object' ? JSON.stringify(data).substring(0, 300) : String(data).substring(0, 300),
      note: response.ok ? 'Exchange API is reachable!' : 'API responded but may require authentication',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.tests.exchangeApiConnectivity = {
      success: false,
      error: errorMessage,
      note: errorMessage.includes('fetch failed') || errorMessage.includes('ENOTFOUND')
        ? 'Cannot reach Exchange API - may require VPN or network access'
        : 'API connection failed',
    };
  }

  // Test 4: Authenticated Developer Portal API (if OAuth succeeded)
  if (results.tests.developerPortalOAuth?.success) {
    console.log('[TEST] Testing authenticated Developer Portal API...');
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${process.env.FANNIEMAE_API_BASE}/v1/construction-spending/section?section=Total`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const status = response.status;
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }
      results.tests.developerPortalApi = {
        success: response.ok,
        status,
        dataPreview: typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : String(data).substring(0, 200),
      };
    } catch (error) {
      results.tests.developerPortalApi = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Summary
  results.summary = {
    developerPortalWorking: results.tests.developerPortalOAuth?.success || false,
    exchangeAuthWorking: results.tests.exchangeCognitoAuth?.success || false,
    exchangeReachable: results.tests.exchangeApiConnectivity?.success || false,
    recommendation: !hasExchangeCredentials()
      ? 'Register for free at https://theexchange.fanniemae.com to access public APIs'
      : results.tests.exchangeCognitoAuth?.success
        ? 'Exchange APIs ready!'
        : 'Check Exchange credentials',
  };

  return NextResponse.json(results, { status: 200 });
}
