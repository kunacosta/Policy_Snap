export type CoverageCategory =
  | 'medical_card'
  | 'critical_illness'
  | 'early_critical_illness'
  | 'premium_waiver'
  | 'hospital_cash'
  | 'personal_accident'
  | 'death_benefit'
  | 'tpd'
  | 'disability_income'
  | 'savings_endowment'
  | 'juvenile_child'
  | 'takaful_specific'
  | 'other';

export interface CoverageItem {
  name: string;
  limit: string;
  note?: string;
  category?: CoverageCategory;
  explain?: string | null;
}

export interface PolicyData {
  // Core identity
  policyNumber: string | null;
  insuredName: string | null;
  insurerName: string | null;
  policyType: string | null;

  // Financial
  sumAssured: string | null;
  annualPremium: string | null;

  // Dates
  effectiveDate: string | null;
  expiryDate: string | null;

  // Coverage
  coverageItems: CoverageItem[];
  deductible?: string | null;

  // Benefits & exclusions
  keyBenefits: string[];
  exclusions: string[];

  // Claims
  waitingPeriod: string | null;
  claimsContact: string | null;

  // Editable claim instructions (defaults shown if absent)
  claimStep1?: string | null;
  claimStep2?: string | null;
  claimStep3?: string | null;

  // Extraction metadata
  extractionNotes?: string | null;
}

export interface ExtractResponse {
  success: boolean;
  data?: PolicyData;
  error?: string;
}

export function validatePolicyData(obj: unknown): obj is PolicyData {
  if (!obj || typeof obj !== 'object') return false;
  const d = obj as Record<string, unknown>;
  if (!Array.isArray(d.coverageItems)) return false;
  if (!Array.isArray(d.keyBenefits)) return false;
  if (!Array.isArray(d.exclusions)) return false;
  // Require at least 3 known fields to be present (guards against totally wrong JSON)
  const known = ['policyNumber','insuredName','insurerName','policyType',
                 'sumAssured','annualPremium','effectiveDate','expiryDate'];
  return known.filter(f => f in d).length >= 3;
}

export interface ComparisonData {
  policyA: PolicyData;
  policyB: PolicyData;
}

export function validateComparisonData(obj: unknown): obj is ComparisonData {
  if (!obj || typeof obj !== 'object') return false;
  const d = obj as Record<string, unknown>;
  return validatePolicyData(d.policyA) && validatePolicyData(d.policyB);
}
