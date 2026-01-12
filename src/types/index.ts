// Core Types for RTLMAC

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: PropertyData | LoanData | MarketData | any;
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

export interface PropertyData {
  type: 'property';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  propertyType?: string;
  value?: number;
  yearBuilt?: number;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: number;
  appraisalData?: AppraisalData;
}

export interface AppraisalData {
  appraisedValue?: number;
  appraisalDate?: string;
  appraiser?: string;
  riskScore?: number;
  findings?: string[];
}

export interface LoanData {
  type: 'loan';
  loanAmount?: number;
  loanType?: string;
  interestRate?: number;
  term?: number;
  ltv?: number;
  cltv?: number;
  dti?: number;
  creditScore?: number;
  loanLimits?: LoanLimits;
  pricing?: LoanPricing;
  eligibility?: LoanEligibility;
}

export interface LoanLimits {
  state: string;
  county: string;
  oneUnit: number;
  twoUnit: number;
  threeUnit: number;
  fourUnit: number;
  year: number;
}

export interface LoanPricing {
  basePrice?: number;
  llpas?: LLPA[];
  srp?: number;
  finalPrice?: number;
}

export interface LLPA {
  name: string;
  adjustment: number;
  reason?: string;
}

export interface LoanEligibility {
  eligible: boolean;
  homeReady?: boolean;
  missionScore?: number;
  amiPercentage?: number;
  reasons?: string[];
}

export interface MarketData {
  type: 'market';
  housingPulse?: HousingPulseData;
  opportunityZones?: OpportunityZone[];
  manufacturedHousing?: ManufacturedHousingData;
}

export interface HousingPulseData {
  region?: string;
  date?: string;
  homePrice?: number;
  homePriceChange?: number;
  inventory?: number;
  daysOnMarket?: number;
  mortgageRate?: number;
  affordabilityIndex?: number;
}

export interface OpportunityZone {
  tractId: string;
  state: string;
  county: string;
  designation: string;
  investmentOpportunity?: string;
}

export interface ManufacturedHousingData {
  state?: string;
  communityCount?: number;
  unitCount?: number;
  nationalTotal?: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
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
}

export type QueryType =
  | 'loan_limits'
  | 'loan_lookup'
  | 'property_data'
  | 'housing_pulse'
  | 'opportunity_zones'
  | 'loan_pricing'
  | 'ami_lookup'
  | 'manufactured_housing'
  | 'general';
