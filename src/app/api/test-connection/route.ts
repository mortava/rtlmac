import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/fanniemae';

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: {
      hasClientId: !!process.env.FANNIEMAE_CLIENT_ID,
      hasClientSecret: !!process.env.FANNIEMAE_CLIENT_SECRET,
      tokenUrl: process.env.FANNIEMAE_TOKEN_URL,
      apiBase: process.env.FANNIEMAE_API_BASE,
    },
    tests: {},
  };

  // Test 1: OAuth Token
  try {
    const token = await getAccessToken();
    results.tests.oauth = {
      success: true,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    };
  } catch (error) {
    results.tests.oauth = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test 2: Public API (Loan Limits - no auth required)
  try {
    const response = await fetch(
      'https://api.theexchange.fanniemae.com/v1/loan-limits?state=CA',
      { headers: { Accept: 'application/json' } }
    );
    const status = response.status;
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
    results.tests.publicApi = {
      success: response.ok,
      status,
      dataPreview: typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : data?.substring(0, 200),
    };
  } catch (error) {
    results.tests.publicApi = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test 3: Authenticated API (if token succeeded)
  if (results.tests.oauth?.success) {
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
      results.tests.authenticatedApi = {
        success: response.ok,
        status,
        dataPreview: typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : data?.substring(0, 200),
      };
    } catch (error) {
      results.tests.authenticatedApi = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
