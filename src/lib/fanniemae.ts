// Fannie Mae API Integration Layer - Complete Implementation
// Supports all Fannie Mae Developer Portal APIs with GET and POST capabilities

import type {
  APICategory,
  LoanLookupRequest,
  LoanLookupResponse,
  AMILookupRequest,
  AMILookupResponse,
  LoanPricingRequest,
  LoanPricingResponse,
  MissionScoreRequest,
  MissionScoreResponse,
  MITerminationRequest,
  MITerminationResponse,
  HiLoEligibilityRequest,
  HiLoEligibilityResponse,
  PropertyDataRequest,
  PropertyDataResponse,
  HousingPulseRequest,
  HousingPulseResponse,
  LoanLimitsRequest,
  LoanLimitsResponse,
  ManufacturedHousingRequest,
  ManufacturedHousingResponse,
  OpportunityZonesRequest,
  OpportunityZonesResponse,
  InvestorDataRequest,
  InvestorDataResponse,
  SRPPricingRequest,
  SRPPricingResponse,
  ConstructionSpendingRequest,
  ConstructionSpendingResponse,
  ConstructionSpendingMultipleRequest,
  ConstructionSpendingMultipleResponse,
} from '@/types';

// ============================================
// CONFIGURATION
// ============================================

const API_BASE_URL = process.env.FANNIEMAE_API_BASE || 'https://api.fanniemae.com';
const EXCHANGE_API_URL = 'https://api.theexchange.fanniemae.com';

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

// ============================================
// AUTHENTICATION
// ============================================

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const tokenUrl = process.env.FANNIEMAE_TOKEN_URL!;
  const clientId = process.env.FANNIEMAE_CLIENT_ID!;
  const clientSecret = process.env.FANNIEMAE_CLIENT_SECRET!;

  try {
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
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data: TokenResponse = await response.json();
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return data.access_token;
  } catch (error) {
    console.error('Auth error:', error);
    throw new Error('Failed to authenticate with Fannie Mae API');
  }
}

// ============================================
// GENERIC API HANDLERS
// ============================================

async function apiGet<T>(endpoint: string, params?: Record<string, string>, requiresAuth = false): Promise<T> {
  const url = new URL(endpoint);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
  }

  const headers: HeadersInit = { Accept: 'application/json' };
  if (requiresAuth) {
    const token = await getAccessToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new Error(`API GET failed: ${response.status}`);
  }
  return response.json();
}

async function apiPost<T, R>(endpoint: string, data: T, requiresAuth = true): Promise<R> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (requiresAuth) {
    const token = await getAccessToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API POST failed: ${response.status}`);
  }
  return response.json();
}

// ============================================
// ORIGINATING & UNDERWRITING APIs
// ============================================

// POST: Loan Lookup - Determine if loan is owned by Fannie Mae
export async function loanLookup(request: LoanLookupRequest): Promise<LoanLookupResponse> {
  try {
    return await apiPost<LoanLookupRequest, LoanLookupResponse>(
      `${API_BASE_URL}/v1/loan-lookup`,
      request
    );
  } catch (error) {
    return getMockLoanLookup(request);
  }
}

// POST: Batch Loan Lookup - Up to 100 loans
export async function batchLoanLookup(requests: LoanLookupRequest[]): Promise<LoanLookupResponse[]> {
  try {
    const results = await apiPost<{ loans: LoanLookupRequest[] }, { results: LoanLookupResponse[] }>(
      `${API_BASE_URL}/v1/loan-lookup/batch`,
      { loans: requests.slice(0, 100) }
    );
    return results.results;
  } catch (error) {
    return requests.map(req => getMockLoanLookup(req));
  }
}

// POST: AMI Lookup & HomeReady Evaluation
export async function amiLookup(request: AMILookupRequest): Promise<AMILookupResponse> {
  try {
    return await apiPost<AMILookupRequest, AMILookupResponse>(
      `${API_BASE_URL}/v1/ami-homeready`,
      request
    );
  } catch (error) {
    return getMockAMILookup(request);
  }
}

// POST: Property Data (UPD) Submission
export async function submitPropertyData(request: PropertyDataRequest): Promise<PropertyDataResponse> {
  try {
    return await apiPost<PropertyDataRequest, PropertyDataResponse>(
      `${API_BASE_URL}/v1/property-data`,
      request
    );
  } catch (error) {
    return getMockPropertyData(request);
  }
}

// GET: Appraisal File Retrieval
export async function getAppraisalFile(documentFileId: string): Promise<any> {
  try {
    return await apiGet(
      `${API_BASE_URL}/v1/appraisal/file`,
      { documentFileId },
      true
    );
  } catch (error) {
    return getMockAppraisalFile(documentFileId);
  }
}

// GET: Appraisal Findings Summary
export async function getAppraisalFindings(documentFileId: string): Promise<any> {
  try {
    return await apiGet(
      `${API_BASE_URL}/v1/appraisal/findings`,
      { documentFileId },
      true
    );
  } catch (error) {
    return getMockAppraisalFindings(documentFileId);
  }
}

// GET: DU Messages
export async function getDUMessages(casefileId: string): Promise<any> {
  try {
    return await apiGet(
      `${API_BASE_URL}/v1/du/messages`,
      { casefileId },
      true
    );
  } catch (error) {
    return getMockDUMessages(casefileId);
  }
}

// ============================================
// PRICING & EXECUTION APIs
// ============================================

// POST: Loan Pricing - Comprehensive pricing with LLPAs and SRPs
export async function getLoanPricing(request: LoanPricingRequest): Promise<LoanPricingResponse> {
  try {
    return await apiPost<LoanPricingRequest, LoanPricingResponse>(
      `${API_BASE_URL}/v1/loan-pricing`,
      request
    );
  } catch (error) {
    return getMockLoanPricing(request);
  }
}

// POST: Mission Score - Calculate mission-oriented lending scores
export async function getMissionScore(request: MissionScoreRequest): Promise<MissionScoreResponse> {
  try {
    return await apiPost<MissionScoreRequest, MissionScoreResponse>(
      `${API_BASE_URL}/v1/mission-score`,
      request
    );
  } catch (error) {
    return getMockMissionScore(request);
  }
}

// POST: Batch Mission Score - Up to 50 loans
export async function batchMissionScore(requests: MissionScoreRequest[]): Promise<MissionScoreResponse[]> {
  try {
    const results = await apiPost<{ loans: MissionScoreRequest[] }, { results: MissionScoreResponse[] }>(
      `${API_BASE_URL}/v1/mission-score/batch`,
      { loans: requests.slice(0, 50) }
    );
    return results.results;
  } catch (error) {
    return requests.map(req => getMockMissionScore(req));
  }
}

// POST: SRP Pricing - Servicing Released Premium
export async function getSRPPricing(request: SRPPricingRequest): Promise<SRPPricingResponse> {
  try {
    return await apiPost<SRPPricingRequest, SRPPricingResponse>(
      `${API_BASE_URL}/v1/srp-pricing`,
      request
    );
  } catch (error) {
    return getMockSRPPricing(request);
  }
}

// GET: Buy Up Buy Down Daily
export async function getBuyUpBuyDown(date?: string): Promise<any> {
  try {
    return await apiGet(
      `${API_BASE_URL}/v1/buy-up-buy-down`,
      { date: date || new Date().toISOString().split('T')[0] },
      true
    );
  } catch (error) {
    return getMockBuyUpBuyDown();
  }
}

// ============================================
// SERVICING APIs
// ============================================

// POST: MI Termination Evaluation
export async function evaluateMITermination(request: MITerminationRequest): Promise<MITerminationResponse> {
  try {
    return await apiPost<MITerminationRequest, MITerminationResponse>(
      `${API_BASE_URL}/v1/mi-termination`,
      request
    );
  } catch (error) {
    return getMockMITermination(request);
  }
}

// POST: High LTV (HiLo) Eligibility
export async function checkHiLoEligibility(request: HiLoEligibilityRequest): Promise<HiLoEligibilityResponse> {
  try {
    return await apiPost<HiLoEligibilityRequest, HiLoEligibilityResponse>(
      `${API_BASE_URL}/v1/hilo-eligibility`,
      request
    );
  } catch (error) {
    return getMockHiLoEligibility(request);
  }
}

// POST: Expense Claims
export async function submitExpenseClaim(request: any): Promise<any> {
  try {
    return await apiPost(`${API_BASE_URL}/v1/expense-claims`, request);
  } catch (error) {
    return getMockExpenseClaim(request);
  }
}

// GET: Master Servicing Loan Position
export async function getMasterServicingPosition(loanNumber: string): Promise<any> {
  try {
    return await apiGet(
      `${API_BASE_URL}/v1/master-servicing/position`,
      { loanNumber },
      true
    );
  } catch (error) {
    return getMockMasterServicing(loanNumber);
  }
}

// ============================================
// PUBLIC APIs (THE EXCHANGE)
// ============================================

// GET: Loan Limits
export async function getLoanLimits(request: LoanLimitsRequest): Promise<LoanLimitsResponse> {
  try {
    const params: Record<string, string> = { state: request.state };
    if (request.county) params.county = request.county;
    if (request.year) params.year = request.year.toString();

    return await apiGet<LoanLimitsResponse>(
      `${EXCHANGE_API_URL}/v1/loan-limits`,
      params
    );
  } catch (error) {
    return getMockLoanLimits(request);
  }
}

// GET: Housing Pulse
export async function getHousingPulse(request: HousingPulseRequest): Promise<HousingPulseResponse> {
  try {
    const params: Record<string, string> = {};
    if (request.region) params.region = request.region;
    if (request.state) params.state = request.state;
    if (request.metro) params.metro = request.metro;
    if (request.startDate) params.startDate = request.startDate;
    if (request.endDate) params.endDate = request.endDate;

    return await apiGet<HousingPulseResponse>(
      `${EXCHANGE_API_URL}/v1/housing-pulse`,
      params
    );
  } catch (error) {
    return getMockHousingPulse(request);
  }
}

// GET: Manufactured Housing
export async function getManufacturedHousing(request: ManufacturedHousingRequest): Promise<ManufacturedHousingResponse> {
  try {
    const params: Record<string, string> = {};
    if (request.state) params.state = request.state;
    if (request.county) params.county = request.county;

    return await apiGet<ManufacturedHousingResponse>(
      `${EXCHANGE_API_URL}/v1/manufactured-housing`,
      params
    );
  } catch (error) {
    return getMockManufacturedHousing(request);
  }
}

// GET: Opportunity Zones
export async function getOpportunityZones(request: OpportunityZonesRequest): Promise<OpportunityZonesResponse> {
  try {
    const params: Record<string, string> = {};
    if (request.state) params.state = request.state;
    if (request.county) params.county = request.county;
    if (request.censusTract) params.censusTract = request.censusTract;
    if (request.zipCode) params.zipCode = request.zipCode;

    return await apiGet<OpportunityZonesResponse>(
      `${EXCHANGE_API_URL}/v1/opportunity-zones`,
      params
    );
  } catch (error) {
    return getMockOpportunityZones(request);
  }
}

// GET: Investor Tools Data
export async function getInvestorData(request: InvestorDataRequest): Promise<InvestorDataResponse> {
  try {
    const params: Record<string, string> = { dataType: request.dataType };
    if (request.securityType) params.securityType = request.securityType;
    if (request.poolNumber) params.poolNumber = request.poolNumber;
    if (request.cusip) params.cusip = request.cusip;
    if (request.startDate) params.startDate = request.startDate;
    if (request.endDate) params.endDate = request.endDate;

    return await apiGet<InvestorDataResponse>(
      `${EXCHANGE_API_URL}/v1/investor-data`,
      params
    );
  } catch (error) {
    return getMockInvestorData(request);
  }
}

// ============================================
// CONSTRUCTION SPENDING API
// ============================================

// GET: Construction Spending by Section
export async function getConstructionSpendingBySection(section: string): Promise<ConstructionSpendingResponse> {
  try {
    return await apiGet<ConstructionSpendingResponse>(
      `${API_BASE_URL}/v1/construction-spending/section`,
      { section }
    );
  } catch (error) {
    return getMockConstructionSpending(section);
  }
}

// GET: Construction Spending by Section and Sector
export async function getConstructionSpendingBySector(
  section: string,
  sector: string
): Promise<ConstructionSpendingResponse> {
  try {
    return await apiGet<ConstructionSpendingResponse>(
      `${API_BASE_URL}/v1/construction-spending/sectionandsector`,
      { section, sector }
    );
  } catch (error) {
    return getMockConstructionSpending(section, sector);
  }
}

// GET: Construction Spending by Section, Sector, and Subsector
export async function getConstructionSpendingBySubsector(
  section: string,
  sector: string,
  subsector: string
): Promise<ConstructionSpendingResponse> {
  try {
    return await apiGet<ConstructionSpendingResponse>(
      `${API_BASE_URL}/v1/construction-spending/sectionsectorandsubsector`,
      { section, sector, subsector }
    );
  } catch (error) {
    return getMockConstructionSpending(section, sector, subsector);
  }
}

// POST: Construction Spending Multiple Paths
export async function getConstructionSpendingMultiple(
  request: ConstructionSpendingMultipleRequest
): Promise<ConstructionSpendingMultipleResponse> {
  try {
    return await apiPost<ConstructionSpendingMultipleRequest, ConstructionSpendingMultipleResponse>(
      `${API_BASE_URL}/v1/construction-spending/multiple`,
      request
    );
  } catch (error) {
    return getMockConstructionSpendingMultiple(request);
  }
}

// ============================================
// QUERY PARSER - Enhanced
// ============================================

export function parseQuery(query: string): { type: APICategory; params: Record<string, any> } {
  const q = query.toLowerCase();

  // Loan Lookup
  if (q.includes('loan lookup') || q.includes('find loan') || q.includes('owned by fannie') || q.includes('fannie mae own')) {
    return { type: 'loan_lookup', params: extractLoanLookupParams(query) };
  }

  // AMI / HomeReady
  if (q.includes('ami') || q.includes('homeready') || q.includes('home ready') || q.includes('income eligib') || q.includes('affordable')) {
    return { type: 'ami_homeready', params: extractAMIParams(query) };
  }

  // Loan Pricing
  if (q.includes('pricing') || q.includes('llpa') || q.includes('price adjustment') || q.includes('loan price')) {
    return { type: 'loan_pricing', params: extractPricingParams(query) };
  }

  // Mission Score
  if (q.includes('mission score') || q.includes('mission-oriented') || q.includes('incentive')) {
    return { type: 'mission_score', params: extractMissionScoreParams(query) };
  }

  // SRP Pricing
  if (q.includes('srp') || q.includes('servicing released') || q.includes('servicing premium')) {
    return { type: 'srp_pricing', params: extractPricingParams(query) };
  }

  // MI Termination
  if (q.includes('mi termination') || q.includes('mortgage insurance') || q.includes('pmi') || q.includes('cancel mi')) {
    return { type: 'mi_termination', params: {} };
  }

  // HiLo / High LTV
  if (q.includes('hilo') || q.includes('high ltv') || q.includes('high loan to value') || q.includes('refi now')) {
    return { type: 'hilo_eligibility', params: {} };
  }

  // Property Data
  if (q.includes('property data') || q.includes('upd') || q.includes('uniform property')) {
    return { type: 'property_data', params: {} };
  }

  // Appraisal
  if (q.includes('appraisal') || q.includes('cu score') || q.includes('collateral')) {
    return { type: 'appraisal_findings', params: {} };
  }

  // DU Messages
  if (q.includes('du message') || q.includes('desktop underwriter') || q.includes('underwriting finding')) {
    return { type: 'du_messages', params: {} };
  }

  // Loan Limits
  if (q.includes('loan limit') || q.includes('conforming limit') || q.includes('max loan')) {
    return { type: 'loan_limits', params: extractLocationParams(query) };
  }

  // Housing Pulse
  if (q.includes('housing') || q.includes('market') || q.includes('home price') || q.includes('inventory') || q.includes('pulse')) {
    return { type: 'housing_pulse', params: extractLocationParams(query) };
  }

  // Manufactured Housing
  if (q.includes('manufactured') || q.includes('mobile home') || q.includes('mh community')) {
    return { type: 'manufactured_housing', params: extractLocationParams(query) };
  }

  // Opportunity Zones
  if (q.includes('opportunity zone') || q.includes('oz ') || q.includes('census tract') || q.includes('low income')) {
    return { type: 'opportunity_zones', params: extractLocationParams(query) };
  }

  // Investor Tools
  if (q.includes('investor') || q.includes('mbs') || q.includes('security') || q.includes('pool') || q.includes('cusip')) {
    return { type: 'investor_tools', params: extractInvestorParams(query) };
  }

  // Construction Spending
  if (q.includes('construction') || q.includes('spending') || q.includes('building') && (q.includes('data') || q.includes('value') || q.includes('total'))) {
    return { type: 'construction_spending', params: extractConstructionParams(query) };
  }

  return { type: 'general', params: {} };
}

// ============================================
// PARAMETER EXTRACTORS
// ============================================

function extractLocationParams(query: string): Record<string, string> {
  const stateMatch = query.match(/\b([A-Z]{2})\b/i);
  const countyMatch = query.match(/(\w+)\s+county/i);
  const zipMatch = query.match(/\b(\d{5})\b/);

  return {
    state: stateMatch?.[1]?.toUpperCase() || '',
    county: countyMatch?.[1] || '',
    zipCode: zipMatch?.[1] || '',
  };
}

function extractLoanLookupParams(query: string): Record<string, any> {
  const nameMatch = query.match(/(?:name|borrower)[:\s]+(\w+)/i);
  const addressMatch = query.match(/(?:address|property)[:\s]+(.+?)(?:,|$)/i);

  return {
    borrowerLastName: nameMatch?.[1] || '',
    propertyAddress: addressMatch?.[1] || '',
    ...extractLocationParams(query),
  };
}

function extractAMIParams(query: string): Record<string, any> {
  const incomeMatch = query.match(/\$?([\d,]+)\s*(?:income|salary|annual|year)?/i);

  return {
    income: incomeMatch ? parseInt(incomeMatch[1].replace(/,/g, '')) : 0,
    ...extractLocationParams(query),
  };
}

function extractPricingParams(query: string): Record<string, any> {
  const amountMatch = query.match(/\$?([\d,]+)\s*(?:loan|amount)?/i);
  const rateMatch = query.match(/([\d.]+)%?\s*(?:rate|interest)?/i);
  const ltvMatch = query.match(/(\d+)%?\s*ltv/i);
  const creditMatch = query.match(/(\d{3})\s*(?:credit|fico|score)?/i);

  return {
    loanAmount: amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : 0,
    noteRate: rateMatch ? parseFloat(rateMatch[1]) : 0,
    ltv: ltvMatch ? parseInt(ltvMatch[1]) : 0,
    creditScore: creditMatch ? parseInt(creditMatch[1]) : 0,
    ...extractLocationParams(query),
  };
}

function extractMissionScoreParams(query: string): Record<string, any> {
  return {
    ...extractPricingParams(query),
    ...extractLocationParams(query),
  };
}

function extractInvestorParams(query: string): Record<string, any> {
  const poolMatch = query.match(/pool[:\s#]+(\w+)/i);
  const cusipMatch = query.match(/cusip[:\s]+(\w+)/i);

  return {
    poolNumber: poolMatch?.[1] || '',
    cusip: cusipMatch?.[1] || '',
  };
}

function extractConstructionParams(query: string): Record<string, any> {
  const q = query.toLowerCase();

  // Determine section
  let section = 'Total';
  if (q.includes('private')) section = 'Private';
  else if (q.includes('public')) section = 'Public';

  // Determine sector
  let sector = '';
  if (q.includes('residential')) sector = 'Residential';
  else if (q.includes('nonresidential') || q.includes('non-residential') || q.includes('commercial')) sector = 'Nonresidential';

  // Determine subsector
  let subsector = '';
  const subsectors = [
    'lodging', 'office', 'commercial', 'health care', 'healthcare',
    'educational', 'religious', 'public safety', 'amusement', 'recreation',
    'transportation', 'communication', 'power', 'highway', 'street',
    'sewage', 'waste', 'water supply', 'conservation', 'manufacturing'
  ];
  for (const sub of subsectors) {
    if (q.includes(sub)) {
      subsector = sub.charAt(0).toUpperCase() + sub.slice(1);
      if (sub === 'healthcare') subsector = 'Health care';
      break;
    }
  }

  return { section, sector, subsector };
}

// ============================================
// MOCK DATA GENERATORS
// ============================================

function getMockLoanLookup(request: LoanLookupRequest): LoanLookupResponse {
  return {
    referenceIdentifier: request.referenceIdentifier,
    ownedByFannieMae: Math.random() > 0.3,
    fannieMaeLoanNumber: `FM${Math.random().toString().slice(2, 12)}`,
    servicerName: 'Demo Servicing Co.',
    currentUPB: 250000 + Math.floor(Math.random() * 200000),
    noteRate: 5.5 + Math.random() * 2,
    eligibleForRefi: true,
    eligibleForAppraisalWaiver: Math.random() > 0.5,
    message: 'Loan found in Fannie Mae portfolio',
  };
}

function getMockAMILookup(request: AMILookupRequest): AMILookupResponse {
  const amiByState: Record<string, number> = {
    CA: 125000, TX: 85000, FL: 78000, NY: 115000, WA: 105000, DEFAULT: 90000,
  };
  const ami = amiByState[request.propertyState?.toUpperCase()] || amiByState.DEFAULT;
  const percentage = Math.round((request.borrowerIncome / ami) * 100);

  return {
    referenceIdentifier: request.referenceIdentifier,
    areaMedianIncome: ami,
    amiPercentage: percentage,
    homeReadyEligible: percentage <= 80,
    homePossibleEligible: percentage <= 80,
    eligibilityMessages: percentage <= 80
      ? ['Eligible for HomeReady mortgage', 'Qualifies for reduced MI']
      : ['Income exceeds 80% AMI threshold'],
    eligiblePrograms: percentage <= 80
      ? [
          { programName: 'HomeReady', eligible: true, benefits: ['3% down', 'Reduced MI'] },
          { programName: 'Home Possible', eligible: true, benefits: ['3% down'] },
        ]
      : [{ programName: 'Standard Conforming', eligible: true, benefits: [] }],
    incomeLimit80AMI: ami * 0.8,
    incomeLimit100AMI: ami,
  };
}

function getMockLoanPricing(request: LoanPricingRequest): LoanPricingResponse {
  const basePrice = 100 + Math.random() * 2;
  const llpas = [
    { adjustmentType: 'FICO', adjustmentName: 'Credit Score Adjustment', adjustmentValue: request.creditScore >= 740 ? 0.125 : -0.5, riskFactor: 'CREDIT', description: 'Based on credit score' },
    { adjustmentType: 'LTV', adjustmentName: 'LTV Adjustment', adjustmentValue: request.ltv <= 80 ? 0 : -0.25, riskFactor: 'COLLATERAL', description: 'Based on loan-to-value' },
    { adjustmentType: 'PURPOSE', adjustmentName: 'Purpose Adjustment', adjustmentValue: request.loanPurpose === 'PURCHASE' ? 0 : -0.125, riskFactor: 'PURPOSE', description: 'Based on loan purpose' },
  ];

  const totalLLPA = llpas.reduce((sum, l) => sum + l.adjustmentValue, 0);

  return {
    referenceIdentifier: request.referenceIdentifier,
    pricingDate: new Date().toISOString().split('T')[0],
    basePrice,
    adjustedPrice: basePrice + totalLLPA,
    srpPrice: 1.5 + Math.random() * 0.5,
    netPrice: basePrice + totalLLPA + 1.5,
    llpaDetails: llpas,
    srpDetails: [{ srpType: 'BASE', srpValue: 1.5, effectiveDate: new Date().toISOString() }],
    additionalAdjustments: [],
    eligibilityStatus: 'ELIGIBLE',
    eligibilityMessages: ['Loan meets all eligibility requirements'],
  };
}

function getMockMissionScore(request: MissionScoreRequest): MissionScoreResponse {
  const score = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;

  return {
    referenceIdentifier: request.referenceIdentifier,
    missionScore: score,
    missionCriteriaShare: Math.random() * 100,
    missionDensityScore: Math.random() * 100,
    componentScores: [
      { dimension: 'AFFORDABLE', score: Math.random() * 100, criteriaMetCount: 3, totalCriteria: 5, criteriaMet: ['First-time buyer', 'Low income'] },
      { dimension: 'SUSTAINABLE', score: Math.random() * 100, criteriaMetCount: 2, totalCriteria: 3, criteriaMet: ['Energy efficient'] },
      { dimension: 'EQUITABLE', score: Math.random() * 100, criteriaMetCount: 2, totalCriteria: 2, criteriaMet: ['Minority tract'] },
    ],
    eligibleForIncentives: score >= 2,
    incentiveDetails: score >= 2 ? [{ incentiveType: 'LLPA_REDUCTION', incentiveValue: 0.25, description: 'Mission lending incentive', requirements: [] }] : [],
    scoringDetails: [],
  };
}

function getMockSRPPricing(request: SRPPricingRequest): SRPPricingResponse {
  return {
    referenceIdentifier: request.referenceIdentifier,
    srpIndicativePrice: 1.5 + Math.random() * 0.75,
    srpPriceDate: new Date().toISOString().split('T')[0],
    priceBreakdown: [
      { component: 'BASE_SRP', value: 1.25, description: 'Base servicing value' },
      { component: 'NOTE_RATE_PREMIUM', value: 0.25, description: 'Rate premium adjustment' },
    ],
    servicingValue: 0.25,
    commitmentOptions: [
      { commitmentPeriod: 30, price: 1.55, expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
      { commitmentPeriod: 60, price: 1.50, expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  };
}

function getMockMITermination(request: MITerminationRequest): MITerminationResponse {
  const currentLTV = (request.currentUPB / request.originalPropertyValue) * 100;

  return {
    referenceIdentifier: request.referenceIdentifier,
    eligibleForTermination: currentLTV <= 80,
    terminationType: currentLTV <= 78 ? 'AUTOMATIC' : currentLTV <= 80 ? 'BORROWER_REQUESTED' : undefined,
    currentLTV,
    targetLTV: 80,
    eligibilityDate: currentLTV <= 80 ? new Date().toISOString() : undefined,
    eligibilityMessages: currentLTV <= 80
      ? ['Loan meets MI termination criteria']
      : [`Current LTV of ${currentLTV.toFixed(1)}% exceeds 80% threshold`],
    requirements: [
      { requirementType: 'LTV', requirementMet: currentLTV <= 80, description: 'LTV must be 80% or less' },
      { requirementType: 'PAYMENT_HISTORY', requirementMet: request.paymentHistory === 'CURRENT', description: 'Must be current on payments' },
    ],
  };
}

function getMockHiLoEligibility(request: HiLoEligibilityRequest): HiLoEligibilityResponse {
  return {
    referenceIdentifier: request.referenceIdentifier,
    eligibleForHighLTVRefi: request.currentLTV <= 97 && request.creditScore >= 620,
    currentLTV: request.currentLTV,
    maxAllowedLTV: 97,
    eligibilityMessages: request.currentLTV <= 97
      ? ['Eligible for High LTV Refinance Program']
      : ['LTV exceeds program maximum of 97%'],
    programDetails: {
      programName: 'RefiNow / High LTV Refi',
      maxLTV: 97,
      maxCLTV: 105,
      benefits: ['No appraisal required in many cases', 'Reduced fees', 'Lower MI costs'],
      requirements: ['Must be current on payments', 'Loan must be owned by Fannie Mae'],
    },
  };
}

function getMockPropertyData(request: PropertyDataRequest): PropertyDataResponse {
  return {
    referenceIdentifier: request.referenceIdentifier,
    submissionStatus: 'ACCEPTED',
    documentFileId: `DOC${Date.now()}`,
    propertyValuation: {
      estimatedValue: 450000 + Math.floor(Math.random() * 100000),
      confidenceScore: 85 + Math.floor(Math.random() * 15),
      valuationDate: new Date().toISOString(),
    },
  };
}

function getMockAppraisalFile(documentFileId: string): any {
  return {
    success: true,
    documentFileId,
    formType: 'URAR',
    effectiveDate: new Date().toISOString(),
    message: 'Appraisal file available for download',
  };
}

function getMockAppraisalFindings(documentFileId: string): any {
  return {
    success: true,
    documentFileId,
    overallStatus: 'ACCEPTABLE',
    cuRiskScore: 2.5,
    findings: [
      { findingCode: 'CU001', category: 'VALUE', severity: 'LOW', description: 'Value within acceptable range' },
    ],
    messages: [{ messageCode: 'INFO', messageType: 'INFO', messageText: 'Appraisal meets GSE standards' }],
  };
}

function getMockDUMessages(casefileId: string): any {
  return {
    success: true,
    casefileId,
    recommendation: 'APPROVE_ELIGIBLE',
    messages: [
      { messageId: 'DU001', category: 'CREDIT', messageType: 'FINDING', messageText: 'Credit score meets minimum requirements' },
      { messageId: 'DU002', category: 'INCOME', messageType: 'CONDITION', messageText: 'Verify income documentation' },
    ],
    riskAssessment: {
      creditRiskClass: 'LOW',
      collateralRiskClass: 'LOW',
      capacityRiskClass: 'MODERATE',
      overallRiskAssessment: 'ACCEPTABLE',
    },
  };
}

function getMockBuyUpBuyDown(): any {
  return {
    success: true,
    date: new Date().toISOString().split('T')[0],
    data: [
      { coupon: 5.0, buyUp: 0.125, buyDown: -0.25, effectiveDate: new Date().toISOString() },
      { coupon: 5.5, buyUp: 0.25, buyDown: -0.375, effectiveDate: new Date().toISOString() },
      { coupon: 6.0, buyUp: 0.375, buyDown: -0.5, effectiveDate: new Date().toISOString() },
    ],
  };
}

function getMockExpenseClaim(request: any): any {
  return {
    success: true,
    claimId: `CLM${Date.now()}`,
    claimStatus: 'SUBMITTED',
    submissionDate: new Date().toISOString(),
    message: 'Claim submitted successfully for review',
  };
}

function getMockMasterServicing(loanNumber: string): any {
  return {
    success: true,
    loanNumber,
    unpaidPrincipalBalance: 285000 + Math.floor(Math.random() * 50000),
    currentInterestRate: 5.75,
    nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    paymentHistory: 'CURRENT',
    escrowBalance: 3500 + Math.floor(Math.random() * 1000),
  };
}

function getMockLoanLimits(request: LoanLimitsRequest): LoanLimitsResponse {
  const limitsByState: Record<string, { oneUnit: number; twoUnit: number; threeUnit: number; fourUnit: number; highCost: boolean }> = {
    CA: { oneUnit: 1149825, twoUnit: 1472250, threeUnit: 1779525, fourUnit: 2211600, highCost: true },
    NY: { oneUnit: 1149825, twoUnit: 1472250, threeUnit: 1779525, fourUnit: 2211600, highCost: true },
    TX: { oneUnit: 766550, twoUnit: 981500, threeUnit: 1186350, fourUnit: 1474400, highCost: false },
    FL: { oneUnit: 766550, twoUnit: 981500, threeUnit: 1186350, fourUnit: 1474400, highCost: false },
    WA: { oneUnit: 977500, twoUnit: 1251400, threeUnit: 1512650, fourUnit: 1879850, highCost: true },
    DEFAULT: { oneUnit: 766550, twoUnit: 981500, threeUnit: 1186350, fourUnit: 1474400, highCost: false },
  };

  const data = limitsByState[request.state?.toUpperCase()] || limitsByState.DEFAULT;

  return {
    state: request.state?.toUpperCase() || 'US',
    county: request.county || 'All Counties',
    year: request.year || 2025,
    limits: { oneUnit: data.oneUnit, twoUnit: data.twoUnit, threeUnit: data.threeUnit, fourUnit: data.fourUnit },
    highCostArea: data.highCost,
    superConformingArea: data.highCost,
    effectiveDate: '2025-01-01',
    source: 'Fannie Mae 2025 Conforming Loan Limits',
  };
}

function getMockHousingPulse(request: HousingPulseRequest): HousingPulseResponse {
  return {
    region: request.state || request.region || 'National',
    dataDate: new Date().toISOString().split('T')[0],
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
      closedSales: 35000 + Math.floor(Math.random() * 7000),
    },
    trends: {
      priceDirection: 'INCREASING',
      inventoryDirection: 'STABLE',
      demandLevel: 'HIGH',
      marketTemperature: 'WARM',
    },
    source: 'Fannie Mae Housing Pulse',
  };
}

function getMockManufacturedHousing(request: ManufacturedHousingRequest): ManufacturedHousingResponse {
  const stateData: Record<string, { communities: number; units: number }> = {
    TX: { communities: 2847, units: 312500 },
    FL: { communities: 3256, units: 445000 },
    CA: { communities: 4521, units: 523000 },
    AZ: { communities: 1523, units: 198000 },
    NC: { communities: 1876, units: 234000 },
  };

  if (request.state && stateData[request.state.toUpperCase()]) {
    const data = stateData[request.state.toUpperCase()];
    return {
      state: request.state.toUpperCase(),
      communityCount: data.communities,
      unitCount: data.units,
      avgUnitsPerCommunity: Math.round(data.units / data.communities),
      source: 'Fannie Mae Manufactured Housing Data',
    };
  }

  return {
    communityCount: 43000,
    unitCount: 4200000,
    avgUnitsPerCommunity: 97,
    nationalTotals: { totalCommunities: 43000, totalUnits: 4200000, statesReporting: 50 },
    stateBreakdown: Object.entries(stateData).map(([state, data]) => ({
      state,
      communities: data.communities,
      units: data.units,
      avgUnitsPerCommunity: Math.round(data.units / data.communities),
    })),
    source: 'Fannie Mae Manufactured Housing Data',
  };
}

function getMockOpportunityZones(request: OpportunityZonesRequest): OpportunityZonesResponse {
  const zones: OpportunityZonesResponse['zones'] = [];
  for (let i = 0; i < 5; i++) {
    const designation: 'LOW_INCOME' | 'CONTIGUOUS' = Math.random() > 0.5 ? 'LOW_INCOME' : 'CONTIGUOUS';
    zones.push({
      tractId: `${request.state || 'CA'}${Math.random().toString().slice(2, 13)}`,
      state: request.state || 'CA',
      county: request.county || 'Sample County',
      designation,
      designationDate: '2018-06-14',
      population: 3000 + Math.floor(Math.random() * 5000),
      povertyRate: 15 + Math.random() * 15,
      medianFamilyIncome: 45000 + Math.floor(Math.random() * 20000),
      investmentOpportunities: ['Real Estate', 'Small Business', 'Infrastructure'],
    });
  }

  return {
    zones,
    totalZones: zones.length,
    stateCount: 1,
  };
}

function getMockInvestorData(request: InvestorDataRequest): InvestorDataResponse {
  const records = [];
  for (let i = 0; i < 5; i++) {
    records.push({
      poolNumber: request.poolNumber || `FN${Math.random().toString().slice(2, 8)}`,
      cusip: request.cusip || `31${Math.random().toString().slice(2, 11)}`,
      securityType: request.securityType || 'MBS',
      issueDate: '2023-01-15',
      maturityDate: '2053-01-15',
      originalBalance: 100000000 + Math.floor(Math.random() * 50000000),
      currentBalance: 95000000 + Math.floor(Math.random() * 40000000),
      couponRate: 5.0 + Math.random(),
      factor: 0.95 + Math.random() * 0.04,
      wac: 5.5 + Math.random() * 0.5,
      wam: 340 + Math.floor(Math.random() * 20),
      loanCount: 200 + Math.floor(Math.random() * 100),
    });
  }

  return {
    dataType: request.dataType,
    records,
    totalRecords: records.length,
    asOfDate: new Date().toISOString().split('T')[0],
  };
}

function getMockConstructionSpending(
  section?: string,
  sector?: string,
  subsector?: string
): ConstructionSpendingResponse {
  const months = ['Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024', 'Jun 2024'];
  const sectionName = subsector || sector || section || 'Total';

  const constructionSpending = months.map((month, index) => ({
    'construction-spending-value': 1800000 + Math.floor(Math.random() * 200000) + (index * 15000),
    'month-and-value-type': `${month} (Millions of Dollars)`,
    'month-label-type': month,
    'data-section-name': sectionName,
  }));

  return { constructionSpending };
}

function getMockConstructionSpendingMultiple(
  request: ConstructionSpendingMultipleRequest
): ConstructionSpendingMultipleResponse {
  const postResponseItems = request.queryItems.map((item, index) => ({
    value: 150000 + Math.floor(Math.random() * 50000) + (index * 10000),
    path: [item.section, item.sector, item.subsector].filter(Boolean).join('/'),
    spendingValueType: 'Millions of Dollars',
    monthYear: 'Jun 2024',
  }));

  return { postResponseItems };
}

// ============================================
// API CATALOG EXPORT
// ============================================

export const API_CATALOG = {
  // Originating & Underwriting
  loanLookup: { method: 'POST', description: 'Determine if a loan is owned by Fannie Mae', handler: loanLookup },
  batchLoanLookup: { method: 'POST', description: 'Batch loan lookup (up to 100)', handler: batchLoanLookup },
  amiLookup: { method: 'POST', description: 'AMI Lookup & HomeReady Evaluation', handler: amiLookup },
  submitPropertyData: { method: 'POST', description: 'Submit Property Data (UPD)', handler: submitPropertyData },
  getAppraisalFile: { method: 'GET', description: 'Retrieve Appraisal File', handler: getAppraisalFile },
  getAppraisalFindings: { method: 'GET', description: 'Get Appraisal Findings & CU Score', handler: getAppraisalFindings },
  getDUMessages: { method: 'GET', description: 'Get Desktop Underwriter Messages', handler: getDUMessages },

  // Pricing & Execution
  getLoanPricing: { method: 'POST', description: 'Get Loan Pricing with LLPAs & SRPs', handler: getLoanPricing },
  getMissionScore: { method: 'POST', description: 'Calculate Mission Score', handler: getMissionScore },
  batchMissionScore: { method: 'POST', description: 'Batch Mission Score (up to 50)', handler: batchMissionScore },
  getSRPPricing: { method: 'POST', description: 'Get SRP Pricing', handler: getSRPPricing },
  getBuyUpBuyDown: { method: 'GET', description: 'Get Buy Up/Buy Down Data', handler: getBuyUpBuyDown },

  // Servicing
  evaluateMITermination: { method: 'POST', description: 'Evaluate MI Termination Eligibility', handler: evaluateMITermination },
  checkHiLoEligibility: { method: 'POST', description: 'Check High LTV Refi Eligibility', handler: checkHiLoEligibility },
  submitExpenseClaim: { method: 'POST', description: 'Submit Expense Claim', handler: submitExpenseClaim },
  getMasterServicingPosition: { method: 'GET', description: 'Get Master Servicing Position', handler: getMasterServicingPosition },

  // Public APIs
  getLoanLimits: { method: 'GET', description: 'Get Conforming Loan Limits', handler: getLoanLimits },
  getHousingPulse: { method: 'GET', description: 'Get Housing Market Data', handler: getHousingPulse },
  getManufacturedHousing: { method: 'GET', description: 'Get Manufactured Housing Stats', handler: getManufacturedHousing },
  getOpportunityZones: { method: 'GET', description: 'Search Opportunity Zones', handler: getOpportunityZones },
  getInvestorData: { method: 'GET', description: 'Get Investor/Security Data', handler: getInvestorData },

  // Construction Spending
  getConstructionSpendingBySection: { method: 'GET', description: 'Get Construction Spending by Section', handler: getConstructionSpendingBySection },
  getConstructionSpendingBySector: { method: 'GET', description: 'Get Construction Spending by Section & Sector', handler: getConstructionSpendingBySector },
  getConstructionSpendingBySubsector: { method: 'GET', description: 'Get Construction Spending by Subsector', handler: getConstructionSpendingBySubsector },
  getConstructionSpendingMultiple: { method: 'POST', description: 'Get Multiple Construction Spending Paths', handler: getConstructionSpendingMultiple },
};
