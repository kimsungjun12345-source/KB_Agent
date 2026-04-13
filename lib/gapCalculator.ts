export type CoverageAmount = '1억미만' | '1억~3억' | '3억이상';

export interface ExistingInsurance {
  type: string;
  coverage_amount: CoverageAmount;
}

export interface GapInput {
  risk_scores: {
    사망: number;
    질병: number;
    상해: number;
    소득중단: number;
    노후: number;
  };
  existing_insurances: ExistingInsurance[];
}

export interface GapResult {
  사망: { risk: number; covered: number; gap: number };
  질병: { risk: number; covered: number; gap: number };
  상해: { risk: number; covered: number; gap: number };
  소득중단: { risk: number; covered: number; gap: number };
  노후: { risk: number; covered: number; gap: number };
}

const COVERAGE_TABLE: Record<string, Record<string, number>> = {
  '종신보험':     { 사망: 6, 질병: 0, 상해: 0, 소득중단: 0, 노후: 0 },
  '정기보험':     { 사망: 5, 질병: 0, 상해: 0, 소득중단: 0, 노후: 0 },
  '암보험':       { 사망: 0, 질병: 4, 상해: 0, 소득중단: 0, 노후: 0 },
  '종합건강보험': { 사망: 0, 질병: 3, 상해: 3, 소득중단: 0, 노후: 0 },
  '실손':         { 사망: 0, 질병: 3, 상해: 3, 소득중단: 0, 노후: 0 },
  '상해보험':     { 사망: 0, 질병: 0, 상해: 5, 소득중단: 0, 노후: 0 },
  '연금보험':     { 사망: 0, 질병: 0, 상해: 0, 소득중단: 0, 노후: 4 },
  '개인연금':     { 사망: 0, 질병: 0, 상해: 0, 소득중단: 0, 노후: 4 },
  '국민연금':     { 사망: 0, 질병: 0, 상해: 0, 소득중단: 0, 노후: 2 },
  '단체보험':     { 사망: 1, 질병: 2, 상해: 2, 소득중단: 0, 노후: 0 },
  '간병보험':     { 사망: 1, 질병: 3, 상해: 0, 소득중단: 0, 노후: 3 },
  '자녀보험':     { 사망: 0, 질병: 3, 상해: 3, 소득중단: 0, 노후: 0 },
};

const RISK_CATEGORIES = ['사망', '질병', '상해', '소득중단', '노후'] as const;

export function calculateGapAnalysis(input: GapInput): GapResult {
  const covered: Record<string, number> = { 사망: 0, 질병: 0, 상해: 0, 소득중단: 0, 노후: 0 };

  for (const insurance of input.existing_insurances) {
    const baseScores = COVERAGE_TABLE[insurance.type] ?? {};
    const amountAdj = insurance.coverage_amount === '1억미만' ? -1
      : insurance.coverage_amount === '3억이상' ? 1 : 0;

    for (const cat of RISK_CATEGORIES) {
      const base = baseScores[cat] ?? 0;
      if (base === 0) continue;
      covered[cat] += Math.max(0, base + amountAdj);
    }
  }

  const result = {} as GapResult;
  for (const cat of RISK_CATEGORIES) {
    const risk = input.risk_scores[cat];
    const cov = Math.min(covered[cat], risk);
    result[cat] = { risk, covered: cov, gap: Math.max(0, risk - cov) };
  }
  return result;
}
