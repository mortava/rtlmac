// Core Types for RTLMAC - Comprehensive Fannie Mae API Integration

// ============================================
// CORE APPLICATION TYPES
// ============================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
  apiType?: APICategory;
  isLoading?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  shared?: boolean;
  shareId?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  apiType: APICategory;
  results: any;
  createdAt: Date;
  tags?: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultState?: string;
  defaultCounty?: string;
  notifications: boolean;
  autoSave: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  apiType?: APICategory;
  timestamp?: string;
}

// ============================================
// API CATEGORIES & QUERY TYPES
// ============================================

export type APICategory =
  // Originating & Underwriting
  | 'loan_lookup'
  | 'ami_homeready'
  | 'property_data'
  | 'appraisal_file'
  | 'appraisal_findings'
  | 'du_messages'
  // Pricing & Execution
  | 'loan_pricing'
  | 'mission_score'
  | 'srp_pricing'
  | 'srp_calculator'
  | 'buy_up_buy_down'
  // Servicing
  | 'expense_claims'
  | 'property_valuation'
  | 'master_servicing'
  | 'mi_termination'
  | 'pre_foreclosure'
  | 'hilo_eligibility'
  | 'servicing_events'
  // Insights & Reporting
  | 'loan_draft_notifications'
  | 'tech_invoices'
  | 'whole_loan_sellers'
  | 'whole_loan_servicers'
  | 'committing_fees'
  // Public APIs (The Exchange)
  | 'loan_limits'
  | 'housing_pulse'
  | 'manufactured_housing'
  | 'opportunity_zones'
  | 'investor_tools'
  // General
  | 'general';

// ============================================
// LOAN LOOKUP API
// ============================================

export interface LoanLookupRequest {
  referenceIdentifier: string;
  borrowerLastName: string;
  borrowerFirstName?: string;
  propertyStreetAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZipCode: string;
  ssnLastFour?: string;
}

export interface LoanLookupResponse {
  referenceIdentifier: string;
  ownedByFannieMae: boolean;
  fannieMaeLoanNumber?: string;
  servicerName?: string;
  servicerLoanNumber?: string;
  currentUPB?: number;
  noteRate?: number;
  loanPurpose?: string;
  occupancyType?: string;
  propertyType?: string;
  eligibleForRefi?: boolean;
  eligibleForAppraisalWaiver?: boolean;
  eligibleForDUWaiver?: boolean;
  message?: string;
}

export interface LoanLookupBatchRequest {
  loans: LoanLookupRequest[];
}

export interface LoanLookupBatchResponse {
  results: LoanLookupResponse[];
  totalSubmitted: number;
  totalFound: number;
  processingTime: string;
}

// ============================================
// AMI LOOKUP & HOMEREADY EVALUATION API
// ============================================

export interface AMILookupRequest {
  referenceIdentifier: string;
  propertyState: string;
  propertyCounty: string;
  propertyCensusTract?: string;
  borrowerIncome: number;
  numberOfBorrowers?: number;
  householdSize?: number;
}

export interface AMILookupResponse {
  referenceIdentifier: string;
  areaMedianIncome: number;
  amiPercentage: number;
  homeReadyEligible: boolean;
  homePossibleEligible: boolean;
  hcaDesignation?: string;
  hcaType?: string;
  eligibilityMessages: string[];
  eligiblePrograms: EligibleProgram[];
  incomeLimit80AMI: number;
  incomeLimit100AMI: number;
}

export interface EligibleProgram {
  programName: string;
  eligible: boolean;
  requirements?: string[];
  benefits?: string[];
}

// ============================================
// PROPERTY DATA API (UPD)
// ============================================

export interface PropertyDataRequest {
  referenceIdentifier: string;
  propertyAddress: PropertyAddress;
  propertyDetails: PropertyDetails;
  appraisalInfo?: AppraisalInfo;
  updVersion: 'UPD_1_0_SF' | 'UPD_1_0_CONDO' | 'UPD_1_1_SF' | 'UPD_1_1_CONDO';
}

export interface PropertyAddress {
  streetAddress: string;
  unitNumber?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
}

export interface PropertyDetails {
  propertyType: PropertyType;
  occupancyType: OccupancyType;
  numberOfUnits: number;
  yearBuilt: number;
  livingAreaSqFt: number;
  lotSizeSqFt?: number;
  bedrooms: number;
  bathrooms: number;
  stories?: number;
  basement?: BasementType;
  garageType?: GarageType;
  garageSpaces?: number;
  poolPresent?: boolean;
  condition?: PropertyCondition;
  quality?: PropertyQuality;
}

export type PropertyType =
  | 'SINGLE_FAMILY'
  | 'CONDO'
  | 'TOWNHOUSE'
  | 'PUD'
  | 'COOP'
  | 'MANUFACTURED'
  | 'MULTI_FAMILY_2_4';

export type OccupancyType =
  | 'PRIMARY_RESIDENCE'
  | 'SECOND_HOME'
  | 'INVESTMENT';

export type BasementType =
  | 'NONE'
  | 'PARTIAL'
  | 'FULL'
  | 'FINISHED'
  | 'UNFINISHED';

export type GarageType =
  | 'NONE'
  | 'ATTACHED'
  | 'DETACHED'
  | 'BUILT_IN'
  | 'CARPORT';

export type PropertyCondition =
  | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';

export type PropertyQuality =
  | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5' | 'Q6';

export interface AppraisalInfo {
  appraisedValue: number;
  appraisalDate: string;
  appraisalType: string;
  appraiserLicenseNumber?: string;
}

export interface PropertyDataResponse {
  referenceIdentifier: string;
  submissionStatus: 'ACCEPTED' | 'REJECTED' | 'PENDING';
  documentFileId?: string;
  warnings?: string[];
  errors?: string[];
  propertyValuation?: PropertyValuation;
}

export interface PropertyValuation {
  estimatedValue: number;
  confidenceScore: number;
  valuationDate: string;
  comparables?: ComparableProperty[];
}

export interface ComparableProperty {
  address: string;
  salePrice: number;
  saleDate: string;
  distance: number;
  adjustedValue: number;
}

// ============================================
// APPRAISAL APIs
// ============================================

export interface AppraisalFileRequest {
  documentFileId: string;
  lenderLoanNumber?: string;
}

export interface AppraisalFileResponse {
  documentFileId: string;
  appraisalXML: string;
  formType: string;
  effectiveDate: string;
  submissionDate: string;
}

export interface AppraisalFindingsRequest {
  documentFileId: string;
}

export interface AppraisalFindingsResponse {
  documentFileId: string;
  overallStatus: 'ACCEPTABLE' | 'UNACCEPTABLE' | 'CONDITIONAL';
  cuRiskScore: number;
  cuRiskFlags: string[];
  findings: AppraisalFinding[];
  messages: AppraisalMessage[];
}

export interface AppraisalFinding {
  findingCode: string;
  category: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  fieldName?: string;
  reportedValue?: string;
  expectedValue?: string;
}

export interface AppraisalMessage {
  messageCode: string;
  messageType: 'ERROR' | 'WARNING' | 'INFO';
  messageText: string;
}

// ============================================
// DU MESSAGES API
// ============================================

export interface DUMessagesRequest {
  casefileId: string;
  includeAllMessages?: boolean;
}

export interface DUMessagesResponse {
  casefileId: string;
  duVersion: string;
  submissionDateTime: string;
  recommendation: DURecommendation;
  messages: DUMessage[];
  riskAssessment: DURiskAssessment;
}

export type DURecommendation =
  | 'APPROVE_ELIGIBLE'
  | 'APPROVE_INELIGIBLE'
  | 'REFER_ELIGIBLE'
  | 'REFER_INELIGIBLE'
  | 'OUT_OF_SCOPE';

export interface DUMessage {
  messageId: string;
  category: string;
  messageType: 'CONDITION' | 'FINDING' | 'INFORMATION';
  messageText: string;
  fieldReference?: string;
}

export interface DURiskAssessment {
  creditRiskClass: string;
  collateralRiskClass: string;
  capacityRiskClass: string;
  overallRiskAssessment: string;
}

// ============================================
// LOAN PRICING API
// ============================================

export interface LoanPricingRequest {
  referenceIdentifier: string;
  loanAmount: number;
  noteRate: number;
  loanTerm: number;
  loanPurpose: LoanPurpose;
  occupancyType: OccupancyType;
  propertyType: PropertyType;
  propertyState: string;
  propertyCounty: string;
  ltv: number;
  cltv: number;
  creditScore: number;
  dti?: number;
  subordinateFinancing?: boolean;
  cashOutAmount?: number;
  firstTimeHomeBuyer?: boolean;
  numberOfUnits?: number;
  loanProduct?: string;
  deliveryType: 'CASH' | 'MBS';
  commitmentType?: string;
  commitmentPeriod?: number;
  pricingDate?: string;
}

export type LoanPurpose =
  | 'PURCHASE'
  | 'RATE_TERM_REFI'
  | 'CASH_OUT_REFI'
  | 'CONSTRUCTION_PERM';

export interface LoanPricingResponse {
  referenceIdentifier: string;
  pricingDate: string;
  basePrice: number;
  adjustedPrice: number;
  srpPrice: number;
  netPrice: number;
  llpaDetails: LLPADetail[];
  srpDetails: SRPDetail[];
  additionalAdjustments: PricingAdjustment[];
  commitmentDetails?: CommitmentDetails;
  eligibilityStatus: 'ELIGIBLE' | 'INELIGIBLE';
  eligibilityMessages?: string[];
}

export interface LLPADetail {
  adjustmentType: string;
  adjustmentName: string;
  adjustmentValue: number;
  riskFactor: string;
  description: string;
}

export interface SRPDetail {
  srpType: string;
  srpValue: number;
  effectiveDate: string;
}

export interface PricingAdjustment {
  adjustmentName: string;
  adjustmentValue: number;
  adjustmentReason: string;
}

export interface CommitmentDetails {
  commitmentType: string;
  commitmentPeriod: number;
  commitmentFee: number;
  expirationDate: string;
}

// ============================================
// MISSION SCORE API
// ============================================

export interface MissionScoreRequest {
  referenceIdentifier: string;
  loanAmount: number;
  propertyState: string;
  propertyCounty: string;
  propertyCensusTract?: string;
  propertyZipCode: string;
  borrowerIncome?: number;
  creditScore?: number;
  ltv?: number;
  firstTimeHomeBuyer?: boolean;
  occupancyType?: OccupancyType;
  propertyType?: PropertyType;
  numberOfUnits?: number;
  loanPurpose?: LoanPurpose;
  minorityCensusTract?: boolean;
}

export interface MissionScoreResponse {
  referenceIdentifier: string;
  missionScore: 0 | 1 | 2 | 3;
  missionCriteriaShare: number;
  missionDensityScore: number;
  componentScores: MissionComponentScore[];
  eligibleForIncentives: boolean;
  incentiveDetails?: MissionIncentive[];
  scoringDetails: MissionScoringDetail[];
}

export interface MissionComponentScore {
  dimension: 'AFFORDABLE' | 'SUSTAINABLE' | 'EQUITABLE';
  score: number;
  criteriaMetCount: number;
  totalCriteria: number;
  criteriaMet: string[];
}

export interface MissionIncentive {
  incentiveType: string;
  incentiveValue: number;
  description: string;
  requirements: string[];
}

export interface MissionScoringDetail {
  criteriaName: string;
  criteriaCategory: string;
  isMet: boolean;
  inputValue?: string;
  threshold?: string;
}

// ============================================
// SRP PRICING API
// ============================================

export interface SRPPricingRequest {
  referenceIdentifier: string;
  loanAmount: number;
  noteRate: number;
  loanTerm: number;
  loanPurpose: LoanPurpose;
  propertyType: PropertyType;
  occupancyType: OccupancyType;
  ltv: number;
  creditScore: number;
  servicingRetained: boolean;
}

export interface SRPPricingResponse {
  referenceIdentifier: string;
  srpIndicativePrice: number;
  srpPriceDate: string;
  priceBreakdown: SRPBreakdown[];
  servicingValue: number;
  commitmentOptions: SRPCommitmentOption[];
}

export interface SRPBreakdown {
  component: string;
  value: number;
  description: string;
}

export interface SRPCommitmentOption {
  commitmentPeriod: number;
  price: number;
  expirationDate: string;
}

// ============================================
// MI TERMINATION API
// ============================================

export interface MITerminationRequest {
  referenceIdentifier: string;
  fannieMaeLoanNumber?: string;
  servicerLoanNumber: string;
  currentUPB: number;
  originalLoanAmount: number;
  originalPropertyValue: number;
  currentPropertyValue?: number;
  loanOriginationDate: string;
  firstPaymentDate: string;
  paymentHistory: PaymentHistoryStatus;
}

export type PaymentHistoryStatus =
  | 'CURRENT'
  | 'LATE_30_DAYS'
  | 'LATE_60_DAYS'
  | 'LATE_90_PLUS_DAYS';

export interface MITerminationResponse {
  referenceIdentifier: string;
  eligibleForTermination: boolean;
  terminationType?: 'AUTOMATIC' | 'BORROWER_REQUESTED' | 'FINAL';
  currentLTV: number;
  targetLTV: number;
  eligibilityDate?: string;
  eligibilityMessages: string[];
  requirements: MIRequirement[];
}

export interface MIRequirement {
  requirementType: string;
  requirementMet: boolean;
  description: string;
  action?: string;
}

// ============================================
// HIGH LTV (HILO) API
// ============================================

export interface HiLoEligibilityRequest {
  referenceIdentifier: string;
  fannieMaeLoanNumber?: string;
  borrowerLastName: string;
  propertyAddress: string;
  propertyState: string;
  propertyZipCode: string;
  currentLTV: number;
  creditScore: number;
  paymentHistory: PaymentHistoryStatus;
}

export interface HiLoEligibilityResponse {
  referenceIdentifier: string;
  eligibleForHighLTVRefi: boolean;
  currentLTV: number;
  maxAllowedLTV: number;
  eligibilityMessages: string[];
  programDetails?: HiLoProgram;
}

export interface HiLoProgram {
  programName: string;
  maxLTV: number;
  maxCLTV: number;
  benefits: string[];
  requirements: string[];
}

// ============================================
// EXPENSE CLAIMS API
// ============================================

export interface ExpenseClaimRequest {
  claimType: ExpenseClaimType;
  fannieMaeLoanNumber: string;
  servicerLoanNumber: string;
  claimAmount: number;
  expenseDate: string;
  expenseDescription: string;
  supportingDocuments?: string[];
}

export type ExpenseClaimType =
  | 'PROPERTY_PRESERVATION'
  | 'FORECLOSURE'
  | 'BANKRUPTCY'
  | 'LOSS_MITIGATION'
  | 'OTHER';

export interface ExpenseClaimResponse {
  claimId: string;
  claimStatus: 'SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'DENIED' | 'PAID';
  submissionDate: string;
  approvedAmount?: number;
  denialReason?: string;
  paymentDate?: string;
  messages: string[];
}

// ============================================
// LOAN LIMITS API (PUBLIC)
// ============================================

export interface LoanLimitsRequest {
  state: string;
  county?: string;
  year?: number;
}

export interface LoanLimitsResponse {
  state: string;
  county: string;
  year: number;
  limits: UnitLimits;
  highCostArea: boolean;
  superConformingArea: boolean;
  effectiveDate: string;
  source: string;
}

export interface UnitLimits {
  oneUnit: number;
  twoUnit: number;
  threeUnit: number;
  fourUnit: number;
}

// ============================================
// HOUSING PULSE API (PUBLIC)
// ============================================

export interface HousingPulseRequest {
  region?: string;
  state?: string;
  metro?: string;
  startDate?: string;
  endDate?: string;
  metrics?: HousingMetricType[];
}

export type HousingMetricType =
  | 'HOME_PRICE'
  | 'HOME_PRICE_CHANGE'
  | 'INVENTORY'
  | 'DAYS_ON_MARKET'
  | 'MORTGAGE_RATE'
  | 'AFFORDABILITY'
  | 'NEW_LISTINGS'
  | 'PENDING_SALES'
  | 'CLOSED_SALES';

export interface HousingPulseResponse {
  region: string;
  dataDate: string;
  metrics: HousingMetrics;
  trends: HousingTrends;
  historicalData?: HousingHistoricalPoint[];
  source: string;
}

export interface HousingMetrics {
  medianHomePrice: number;
  homePriceYoY: number;
  inventoryMonths: number;
  daysOnMarket: number;
  mortgageRate30Yr: number;
  mortgageRate15Yr: number;
  affordabilityIndex: number;
  newListings: number;
  pendingSales: number;
  closedSales: number;
}

export interface HousingTrends {
  priceDirection: 'INCREASING' | 'STABLE' | 'DECREASING';
  inventoryDirection: 'INCREASING' | 'STABLE' | 'DECREASING';
  demandLevel: 'HIGH' | 'MODERATE' | 'LOW';
  marketTemperature: 'HOT' | 'WARM' | 'NEUTRAL' | 'COOL' | 'COLD';
}

export interface HousingHistoricalPoint {
  date: string;
  medianPrice: number;
  inventory: number;
  daysOnMarket: number;
}

// ============================================
// MANUFACTURED HOUSING API (PUBLIC)
// ============================================

export interface ManufacturedHousingRequest {
  state?: string;
  county?: string;
  includeNationalTotals?: boolean;
}

export interface ManufacturedHousingResponse {
  state?: string;
  county?: string;
  communityCount: number;
  unitCount: number;
  avgUnitsPerCommunity: number;
  nationalTotals?: NationalMHData;
  stateBreakdown?: StateMHData[];
  source: string;
}

export interface NationalMHData {
  totalCommunities: number;
  totalUnits: number;
  statesReporting: number;
}

export interface StateMHData {
  state: string;
  communities: number;
  units: number;
  avgUnitsPerCommunity: number;
}

// ============================================
// OPPORTUNITY ZONES API
// ============================================

export interface OpportunityZonesRequest {
  state?: string;
  county?: string;
  censusTract?: string;
  zipCode?: string;
}

export interface OpportunityZonesResponse {
  zones: OpportunityZone[];
  totalZones: number;
  stateCount: number;
}

export interface OpportunityZone {
  tractId: string;
  state: string;
  county: string;
  designation: 'LOW_INCOME' | 'CONTIGUOUS';
  designationDate: string;
  population: number;
  povertyRate: number;
  medianFamilyIncome: number;
  investmentOpportunities: string[];
}

// ============================================
// INVESTOR TOOLS APIs
// ============================================

export interface InvestorDataRequest {
  dataType: InvestorDataType;
  securityType?: SecurityType;
  poolNumber?: string;
  cusip?: string;
  startDate?: string;
  endDate?: string;
}

export type InvestorDataType =
  | 'POOL_DATA'
  | 'SECURITY_DATA'
  | 'LOAN_LEVEL'
  | 'DISCLOSURE'
  | 'HISTORICAL';

export type SecurityType =
  | 'MBS'
  | 'MEGA'
  | 'REMIC'
  | 'CRT';

export interface InvestorDataResponse {
  dataType: InvestorDataType;
  records: InvestorRecord[];
  totalRecords: number;
  asOfDate: string;
}

export interface InvestorRecord {
  poolNumber?: string;
  cusip?: string;
  securityType: string;
  issueDate: string;
  maturityDate: string;
  originalBalance: number;
  currentBalance: number;
  couponRate: number;
  factor: number;
  wac: number;
  wam: number;
  loanCount: number;
}

// ============================================
// DRAFT NOTIFICATIONS API
// ============================================

export interface DraftNotificationsRequest {
  reportType: DraftReportType;
  startDate: string;
  endDate: string;
  fannieMaeLoanNumber?: string;
  servicerNumber?: string;
}

export type DraftReportType =
  | 'P_AND_I'
  | 'ESCROW'
  | 'BUYDOWN'
  | 'REIMBURSEMENT'
  | 'ADJUSTMENT';

export interface DraftNotificationsResponse {
  reportType: DraftReportType;
  reportDate: string;
  notifications: DraftNotification[];
  totalAmount: number;
  recordCount: number;
}

export interface DraftNotification {
  fannieMaeLoanNumber: string;
  servicerLoanNumber: string;
  notificationType: string;
  amount: number;
  effectiveDate: string;
  description: string;
}

// ============================================
// API ENDPOINT CONFIGURATION
// ============================================

export interface APIEndpoint {
  category: APICategory;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  requiresAuth: boolean;
  isPublic: boolean;
  requestSchema?: string;
  responseSchema?: string;
  rateLimit?: number;
  batchSupported?: boolean;
  maxBatchSize?: number;
}

export const API_ENDPOINTS: APIEndpoint[] = [
  // Originating & Underwriting
  {
    category: 'loan_lookup',
    name: 'Loan Lookup',
    description: 'Determine if a loan is owned by Fannie Mae',
    method: 'POST',
    path: '/v1/loan-lookup',
    requiresAuth: true,
    isPublic: false,
    batchSupported: true,
    maxBatchSize: 100,
  },
  {
    category: 'ami_homeready',
    name: 'AMI Lookup & HomeReady Evaluation',
    description: 'Check AMI and HomeReady eligibility',
    method: 'POST',
    path: '/v1/ami-homeready',
    requiresAuth: true,
    isPublic: false,
  },
  {
    category: 'property_data',
    name: 'Property Data (UPD)',
    description: 'Submit Uniform Property Dataset',
    method: 'POST',
    path: '/v1/property-data',
    requiresAuth: true,
    isPublic: false,
  },
  {
    category: 'appraisal_file',
    name: 'Appraisal File Retrieval',
    description: 'Retrieve full appraisal data in XML',
    method: 'GET',
    path: '/v1/appraisal/file',
    requiresAuth: true,
    isPublic: false,
  },
  {
    category: 'appraisal_findings',
    name: 'Appraisal Findings Summary',
    description: 'Get appraisal findings and CU risk scores',
    method: 'GET',
    path: '/v1/appraisal/findings',
    requiresAuth: true,
    isPublic: false,
  },
  {
    category: 'du_messages',
    name: 'DU Messages',
    description: 'Retrieve Desktop Underwriter findings',
    method: 'GET',
    path: '/v1/du/messages',
    requiresAuth: true,
    isPublic: false,
  },
  // Pricing & Execution
  {
    category: 'loan_pricing',
    name: 'Loan Pricing',
    description: 'Get comprehensive loan pricing with LLPAs and SRPs',
    method: 'POST',
    path: '/v1/loan-pricing',
    requiresAuth: true,
    isPublic: false,
  },
  {
    category: 'mission_score',
    name: 'Mission Score',
    description: 'Calculate mission-oriented lending scores',
    method: 'POST',
    path: '/v1/mission-score',
    requiresAuth: true,
    isPublic: false,
    batchSupported: true,
    maxBatchSize: 50,
  },
  {
    category: 'srp_pricing',
    name: 'SRP Pricing',
    description: 'Get Servicing Released Premium pricing',
    method: 'POST',
    path: '/v1/srp-pricing',
    requiresAuth: true,
    isPublic: false,
  },
  // Servicing
  {
    category: 'mi_termination',
    name: 'MI Termination Evaluation',
    description: 'Check mortgage insurance termination eligibility',
    method: 'POST',
    path: '/v1/mi-termination',
    requiresAuth: true,
    isPublic: false,
  },
  {
    category: 'hilo_eligibility',
    name: 'High LTV Refi Eligibility',
    description: 'Check HiLo program eligibility',
    method: 'POST',
    path: '/v1/hilo-eligibility',
    requiresAuth: true,
    isPublic: false,
  },
  {
    category: 'expense_claims',
    name: 'Expense Claims',
    description: 'Submit and track expense claims',
    method: 'POST',
    path: '/v1/expense-claims',
    requiresAuth: true,
    isPublic: false,
  },
  // Public APIs
  {
    category: 'loan_limits',
    name: 'Loan Limits',
    description: 'Get conforming loan limits by location',
    method: 'GET',
    path: '/v1/loan-limits',
    requiresAuth: false,
    isPublic: true,
  },
  {
    category: 'housing_pulse',
    name: 'Housing Pulse',
    description: 'Access housing market metrics and trends',
    method: 'GET',
    path: '/v1/housing-pulse',
    requiresAuth: false,
    isPublic: true,
  },
  {
    category: 'manufactured_housing',
    name: 'Manufactured Housing',
    description: 'Get manufactured housing statistics',
    method: 'GET',
    path: '/v1/manufactured-housing',
    requiresAuth: false,
    isPublic: true,
  },
  {
    category: 'opportunity_zones',
    name: 'Opportunity Zones',
    description: 'Search opportunity zone designations',
    method: 'GET',
    path: '/v1/opportunity-zones',
    requiresAuth: false,
    isPublic: true,
  },
  {
    category: 'investor_tools',
    name: 'Investor Tools',
    description: 'Access MBS and security data',
    method: 'GET',
    path: '/v1/investor-data',
    requiresAuth: false,
    isPublic: true,
  },
];

// ============================================
// SEARCH FILTER TYPES
// ============================================

export interface SearchFilters {
  apiCategory?: APICategory;
  state?: string;
  county?: string;
  zipCode?: string;
  loanAmount?: { min?: number; max?: number };
  creditScore?: { min?: number; max?: number };
  ltv?: { min?: number; max?: number };
  propertyType?: PropertyType;
  occupancyType?: OccupancyType;
  loanPurpose?: LoanPurpose;
  dateRange?: { start?: string; end?: string };
}

export interface SearchResult {
  id: string;
  apiCategory: APICategory;
  query: string;
  filters: SearchFilters;
  results: any;
  timestamp: Date;
  resultCount: number;
}
