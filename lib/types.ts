// 금융급 보험 설계 시스템 - 타입 정의
export type InsuranceStage = 'personal_info' | 'risk_assessment' | 'gap_analysis' | 'product_matching' | 'final_report';

export interface StageProgress {
  current: InsuranceStage;
  completed: InsuranceStage[];
  percentage: number;
  stageDetails: {
    [key in InsuranceStage]: {
      title: string;
      description: string;
      status: 'pending' | 'in_progress' | 'completed';
    };
  };
}

export interface PersonalInfo {
  age: number;
  gender: 'male' | 'female';
  occupation: string;
  income: number;
  familySize: number;
  dependents: number;
  existingInsurance: {
    death: number;
    disease: number;
    accident: number;
  };
}

export interface RiskAssessment {
  사망: { score: number; factors: RiskFactor[]; confidence: number };
  질병: { score: number; factors: RiskFactor[]; confidence: number };
  상해: { score: number; factors: RiskFactor[]; confidence: number };
  소득중단: { score: number; factors: RiskFactor[]; confidence: number };
  노후: { score: number; factors: RiskFactor[]; confidence: number };
  dataSource: string;
  calculatedAt: Date;
}

export interface RiskFactor {
  name: string;
  impact: number;
  weight: number;
  explanation: string;
}

export interface GapAnalysis {
  categories: Array<{
    name: string;
    current: number;
    required: number;
    gap: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    reasoning: string;
  }>;
  totalGap: number;
  priorityActions: string[];
}

export interface ProductMatch {
  matches: Array<{
    productId: string;
    productName: string;
    company: string;
    matchScore: number;
    monthlyPremium: number;
    coverage: {
      death: number;
      disease: number;
      accident: number;
    };
    pros: string[];
    considerations: string[];
    suitabilityReason: string;
  }>;
  recommendedCombination: string[];
}

export interface FinalReport {
  selectedProducts: Array<{
    name: string;
    monthlyPremium: number;
    annualPremium: number;
    coverage: {
      death: number;
      disease: number;
      accident: number;
    };
  }>;
  totalPremium: {
    monthly: number;
    annual: number;
  };
  projectedPayments: Array<{
    year: number;
    cumulativePremium: number;
    expectedBenefit: number;
  }>;
  riskCoverage: {
    [key: string]: { covered: number; total: number };
  };
  summary: {
    totalCoverage: number;
    coverageRatio: number;
    recommendation: string;
    nextSteps: string[];
  };
}

export interface SystemState {
  stage: StageProgress;
  personalInfo: PersonalInfo | null;
  riskAssessment: RiskAssessment | null;
  gapAnalysis: GapAnalysis | null;
  productMatch: ProductMatch | null;
  finalReport: FinalReport | null;
  chatMessages: Message[];
  isProcessing: boolean;
  lastCalculatedAt: Date | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  stage: InsuranceStage;
  data?: any;
}

export interface TrustIndicators {
  dataSource: {
    name: string;
    lastUpdated: string;
    reliability: 'high' | 'medium' | 'low';
  };
  compliance: {
    financialAuthority: string;
    regulationCompliant: boolean;
    disclaimers: string[];
  };
  calculation: {
    methodology: string;
    confidence: number;
    factors: string[];
  };
}