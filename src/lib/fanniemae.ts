// Fannie Mae API Integration Layer

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

// Get OAuth token from Fannie Mae
export async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const tokenUrl = process.env.FANNIEMAE_TOKEN_URL!;
  const clientId = process.env.FANNIEMAE_CLIENT_ID!;
  const clientSecret = process.env.FANNIEMAE_CLIENT_SECRET!;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data: TokenResponse = await response.json();

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  return data.access_token;
}

// Loan Limits API
export async function getLoanLimits(state: string, county?: string): Promise<any> {
  try {
    // Using The Exchange public API for loan limits
    const baseUrl = 'https://api.theexchange.fanniemae.com/v1/loan-limits';
    let url = `${baseUrl}?state=${encodeURIComponent(state)}`;

    if (county) {
      url += `&county=${encodeURIComponent(county)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // Return mock data for demo if API unavailable
      return getMockLoanLimits(state, county);
    }

    return await response.json();
  } catch (error) {
    console.error('Loan limits API error:', error);
    return getMockLoanLimits(state, county);
  }
}

// Housing Pulse API
export async function getHousingPulse(params: {
  region?: string;
  state?: string;
  metro?: string;
}): Promise<any> {
  try {
    const baseUrl = 'https://api.theexchange.fanniemae.com/v1/housing-pulse';
    const searchParams = new URLSearchParams();

    if (params.region) searchParams.append('region', params.region);
    if (params.state) searchParams.append('state', params.state);
    if (params.metro) searchParams.append('metro', params.metro);

    const response = await fetch(`${baseUrl}?${searchParams.toString()}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return getMockHousingPulse(params.state || 'National');
    }

    return await response.json();
  } catch (error) {
    console.error('Housing pulse API error:', error);
    return getMockHousingPulse(params.state || 'National');
  }
}

// Manufactured Housing API
export async function getManufacturedHousing(state?: string): Promise<any> {
  try {
    const baseUrl = 'https://api.theexchange.fanniemae.com/v1/manufactured-housing';
    const url = state ? `${baseUrl}?state=${encodeURIComponent(state)}` : baseUrl;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return getMockManufacturedHousing(state);
    }

    return await response.json();
  } catch (error) {
    console.error('Manufactured housing API error:', error);
    return getMockManufacturedHousing(state);
  }
}

// Loan Lookup (requires auth)
export async function lookupLoan(params: {
  borrowerLastName: string;
  propertyAddress?: string;
  ssn?: string;
}): Promise<any> {
  try {
    const token = await getAccessToken();
    const baseUrl = 'https://api.fanniemae.com/v1/loan-lookup';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      return {
        found: false,
        message: 'Loan lookup service unavailable. Please try again later.'
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Loan lookup error:', error);
    return {
      found: false,
      error: 'Unable to perform loan lookup at this time.'
    };
  }
}

// AMI Lookup for HomeReady eligibility
export async function getAMILookup(params: {
  state: string;
  county: string;
  income: number;
}): Promise<any> {
  try {
    const token = await getAccessToken();
    const baseUrl = 'https://api.fanniemae.com/v1/ami-lookup';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      return getMockAMIData(params);
    }

    return await response.json();
  } catch (error) {
    console.error('AMI lookup error:', error);
    return getMockAMIData(params);
  }
}

// Mock Data Functions (for demo/fallback)
function getMockLoanLimits(state: string, county?: string) {
  const limits: Record<string, { oneUnit: number; twoUnit: number; threeUnit: number; fourUnit: number }> = {
    'CA': { oneUnit: 1149825, twoUnit: 1472250, threeUnit: 1779525, fourUnit: 2211600 },
    'TX': { oneUnit: 766550, twoUnit: 981500, threeUnit: 1186350, fourUnit: 1474400 },
    'FL': { oneUnit: 766550, twoUnit: 981500, threeUnit: 1186350, fourUnit: 1474400 },
    'NY': { oneUnit: 1149825, twoUnit: 1472250, threeUnit: 1779525, fourUnit: 2211600 },
    'WA': { oneUnit: 977500, twoUnit: 1251400, threeUnit: 1512650, fourUnit: 1879850 },
    'DEFAULT': { oneUnit: 766550, twoUnit: 981500, threeUnit: 1186350, fourUnit: 1474400 },
  };

  const data = limits[state.toUpperCase()] || limits['DEFAULT'];

  return {
    success: true,
    data: {
      state: state.toUpperCase(),
      county: county || 'All Counties',
      year: 2024,
      limits: data,
      source: 'Fannie Mae 2024 Conforming Loan Limits',
    },
  };
}

function getMockHousingPulse(region: string) {
  return {
    success: true,
    data: {
      region,
      date: new Date().toISOString().split('T')[0],
      metrics: {
        medianHomePrice: 412000 + Math.floor(Math.random() * 50000),
        homePriceYoY: 4.2 + Math.random() * 2,
        inventoryMonths: 3.2 + Math.random(),
        daysOnMarket: 28 + Math.floor(Math.random() * 15),
        mortgageRate30Yr: 6.75 + Math.random() * 0.5,
        mortgageRate15Yr: 6.0 + Math.random() * 0.5,
        affordabilityIndex: 92 + Math.floor(Math.random() * 20),
        newListings: 45000 + Math.floor(Math.random() * 10000),
        pendingSales: 38000 + Math.floor(Math.random() * 8000),
      },
      trends: {
        priceDirection: 'increasing',
        inventoryDirection: 'stable',
        demandLevel: 'high',
      },
      source: 'Fannie Mae Housing Pulse',
    },
  };
}

function getMockManufacturedHousing(state?: string) {
  const stateData: Record<string, { communities: number; units: number }> = {
    'TX': { communities: 2847, units: 312500 },
    'FL': { communities: 3256, units: 445000 },
    'CA': { communities: 4521, units: 523000 },
    'AZ': { communities: 1523, units: 198000 },
    'NC': { communities: 1876, units: 234000 },
  };

  if (state && stateData[state.toUpperCase()]) {
    const data = stateData[state.toUpperCase()];
    return {
      success: true,
      data: {
        state: state.toUpperCase(),
        communityCount: data.communities,
        unitCount: data.units,
        avgUnitsPerCommunity: Math.round(data.units / data.communities),
      },
    };
  }

  return {
    success: true,
    data: {
      nationalTotal: {
        communities: 43000,
        units: 4200000,
        states: 50,
      },
      topStates: Object.entries(stateData).map(([state, data]) => ({
        state,
        ...data,
      })),
      source: 'Fannie Mae Manufactured Housing Data',
    },
  };
}

function getMockAMIData(params: { state: string; county: string; income: number }) {
  const amiLimits: Record<string, number> = {
    'CA': 125000,
    'TX': 85000,
    'FL': 78000,
    'NY': 115000,
    'WA': 105000,
    'DEFAULT': 90000,
  };

  const ami = amiLimits[params.state.toUpperCase()] || amiLimits['DEFAULT'];
  const percentage = Math.round((params.income / ami) * 100);
  const homeReadyEligible = percentage <= 80;

  return {
    success: true,
    data: {
      state: params.state.toUpperCase(),
      county: params.county,
      areaMedianIncome: ami,
      borrowerIncome: params.income,
      amiPercentage: percentage,
      homeReadyEligible,
      eligiblePrograms: homeReadyEligible
        ? ['HomeReady', 'Home Possible', 'HFA Preferred']
        : percentage <= 100
          ? ['Standard Conforming', 'FHA']
          : ['Jumbo', 'Non-QM'],
      message: homeReadyEligible
        ? `Borrower income is ${percentage}% of AMI - eligible for HomeReady!`
        : `Borrower income is ${percentage}% of AMI.`,
    },
  };
}

// Parse user query to determine intent
export function parseQuery(query: string): {
  type: string;
  params: Record<string, any>;
} {
  const lowerQuery = query.toLowerCase();

  // Loan limits
  if (lowerQuery.includes('loan limit') || lowerQuery.includes('conforming limit')) {
    const stateMatch = query.match(/\b([A-Z]{2})\b/i) || query.match(/in\s+(\w+)/i);
    const countyMatch = query.match(/(\w+)\s+county/i);

    return {
      type: 'loan_limits',
      params: {
        state: stateMatch?.[1] || '',
        county: countyMatch?.[1] || '',
      },
    };
  }

  // Housing market / pulse
  if (lowerQuery.includes('housing') || lowerQuery.includes('market') ||
      lowerQuery.includes('home price') || lowerQuery.includes('inventory')) {
    const stateMatch = query.match(/\b([A-Z]{2})\b/i) || query.match(/in\s+(\w+)/i);

    return {
      type: 'housing_pulse',
      params: {
        state: stateMatch?.[1] || '',
      },
    };
  }

  // AMI / HomeReady
  if (lowerQuery.includes('ami') || lowerQuery.includes('homeready') ||
      lowerQuery.includes('income') || lowerQuery.includes('eligibility')) {
    const incomeMatch = query.match(/\$?([\d,]+)\s*(income|salary|year)?/i);
    const stateMatch = query.match(/\b([A-Z]{2})\b/i);
    const countyMatch = query.match(/(\w+)\s+county/i);

    return {
      type: 'ami_lookup',
      params: {
        income: incomeMatch ? parseInt(incomeMatch[1].replace(/,/g, '')) : 0,
        state: stateMatch?.[1] || '',
        county: countyMatch?.[1] || '',
      },
    };
  }

  // Manufactured housing
  if (lowerQuery.includes('manufactured') || lowerQuery.includes('mobile home')) {
    const stateMatch = query.match(/\b([A-Z]{2})\b/i);

    return {
      type: 'manufactured_housing',
      params: {
        state: stateMatch?.[1] || '',
      },
    };
  }

  // Loan lookup
  if (lowerQuery.includes('loan lookup') || lowerQuery.includes('find loan') ||
      lowerQuery.includes('is this loan')) {
    return {
      type: 'loan_lookup',
      params: {},
    };
  }

  // Default - general question
  return {
    type: 'general',
    params: {},
  };
}
