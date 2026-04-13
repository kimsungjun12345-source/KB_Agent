import { readFileSync } from 'fs';
import { join } from 'path';

let statsCache: any = null;
function getStats() {
  if (!statsCache) {
    statsCache = JSON.parse(readFileSync(join(process.cwd(), 'data', 'statistics.json'), 'utf-8'));
  }
  return statsCache;
}

let deadRiskCache: any[] | null = null;
function getDeadRisk(): any[] {
  if (!deadRiskCache) {
    deadRiskCache = JSON.parse(readFileSync(join(process.cwd(), 'data', 'dead_risk.json'), 'utf-8'));
  }
  return deadRiskCache!;
}

let deadReasonCache: any[] | null = null;
function getDeadReason(): any[] {
  if (!deadReasonCache) {
    deadReasonCache = JSON.parse(readFileSync(join(process.cwd(), 'data', 'dead_reason.json'), 'utf-8'));
  }
  return deadReasonCache!;
}

let economyCache: any[] | null = null;
function getEconomy(): any[] {
  if (!economyCache) {
    economyCache = JSON.parse(readFileSync(join(process.cwd(), 'data', 'economy.json'), 'utf-8'));
  }
  return economyCache!;
}

// dead_risk.json에서 정확한 나이의 사망확률 조회
function getExactDeathProb(age: number, gender: 'male' | 'female'): { prob: number; lifeExpectancy: number } {
  const data = getDeadRisk();
  const entry = data.find(d => d['연령별'] === `${age}세`);
  if (!entry) {
    // fallback: 가장 가까운 나이
    const closest = data.reduce((prev: any, curr: any) => {
      const prevAge = parseInt(prev['연령별']);
      const currAge = parseInt(curr['연령별']);
      return Math.abs(currAge - age) < Math.abs(prevAge - age) ? curr : prev;
    });
    const gKey = gender === 'male' ? '남자' : '여자';
    return {
      prob: parseFloat(closest[`사망확률(${gKey})`] || '0.001'),
      lifeExpectancy: parseFloat(closest[`기대여명(${gKey}) (년)`] || '80'),
    };
  }
  const gKey = gender === 'male' ? '남자' : '여자';
  return {
    prob: parseFloat(entry[`사망확률(${gKey})`] || '0.001'),
    lifeExpectancy: parseFloat(entry[`기대여명(${gKey}) (년)`] || '80'),
  };
}

// dead_reason.json에서 5년 구간 사망원인별 사망률 조회
function getAgeBracket5(age: number): string {
  if (age < 1) return '0세';
  if (age < 5) return '1 - 4세';
  const lower = Math.floor(age / 5) * 5;
  const upper = lower + 4;
  if (lower >= 90) return '90세이상';
  if (lower >= 80) return `80 - 84세`; // 80-84, 85-89 exist
  return `${lower} - ${upper}세`;
}

// ICD 카테고리를 보험 리스크 카테고리로 매핑
const ICD_TO_RISK: Record<string, string> = {
  '신생물': '암',
  '순환계통 질환': '심혈관+뇌혈관',
  '호흡계통의 질환': '호흡기',
  '내분비, 영양 및 대사 질환': '대사질환(당뇨 등)',
  '신경계통의 질환': '신경계',
  '질병이환 및 사망의 외인': '사고/외인사',
};

export function getDeathCausesByAge(age: number, gender: 'male' | 'female'): { cause: string; rate: number; icdCategory: string }[] {
  const data = getDeadReason();
  const bracket = getAgeBracket5(age);
  const genderStr = gender === 'male' ? '남자' : '여자';

  const entries = data.filter(d =>
    d['연령(5세)별'] === bracket &&
    d['성별'] === genderStr &&
    d['사망원인별(104항목)'] !== '계'
  );

  return entries
    .map(d => {
      const cause = d['사망원인별(104항목)'] as string;
      const rate = parseFloat(d['사망률 (십만명당)'] || '0');
      // ICD 코드에서 카테고리 추출
      const shortName = Object.keys(ICD_TO_RISK).find(k => cause.includes(k));
      return {
        cause,
        rate,
        icdCategory: shortName ? ICD_TO_RISK[shortName] : cause.split('(')[0].trim(),
      };
    })
    .filter(d => d.rate > 0)
    .sort((a, b) => b.rate - a.rate);
}

// economy.json에서 고용형태별 중위 임금 조회
function getMedianWage(employmentType: string): number | null {
  const data = getEconomy();
  const typeMap: Record<string, string> = {
    '정규직': '정규근로자',
    '비정규직': '비정규근로자',
    '프리랜서': '비정규근로자',
    '자영업': '전체근로자',
  };
  const key = typeMap[employmentType] || '전체근로자';
  const entry = data.find(d => d['고용형태'] === key);
  if (!entry) return null;
  const wage = parseInt(entry['월임금총액 (천원)']);
  return isNaN(wage) ? null : wage;
}

export interface RiskInput {
  age: number;
  gender: 'male' | 'female';
  job: string;
  employment_type: '정규직' | '비정규직' | '자영업' | '프리랜서';
  family_structure: string;
  monthly_income: '200만원_미만' | '200~500만원' | '500~800만원' | '800만원_이상';
  family_history: string[];
  current_condition: '없음' | '경증' | '중증' | '암_이력';
  pension_status: '없음' | '국민연금만' | '국민연금_퇴직연금' | '3가지_이상';
}

export interface RiskScores {
  사망: number;
  질병: number;
  상해: number;
  소득중단: number;
  노후: number;
  계산근거: Record<string, string>;
}

export function calculateRiskScores(input: RiskInput): RiskScores {
  const stats = getStats();
  const reasoning: Record<string, string> = {};

  // ① 사망 리스크 — dead_risk.json 기반 1세 단위 정확한 사망확률
  const W = stats.dependency_factors.data[input.family_structure] ?? 1.0;
  const genderKey = input.gender === 'male' ? 'male' : 'female';
  const { prob: P, lifeExpectancy } = getExactDeathProb(input.age, input.gender);
  const IM_MAP: Record<string, number> = {
    '200만원_미만': 0.7, '200~500만원': 1.0, '500~800만원': 1.3, '800만원_이상': 1.6,
  };
  const IM = IM_MAP[input.monthly_income] ?? 1.0;
  const dep_score = W / 0.8;
  const age_addon = (P / 0.009) * 3;
  const 사망 = Math.round(Math.min(10, Math.max(1, (dep_score + age_addon) * IM)));
  reasoning['사망'] = `${input.age}세 정확한 사망확률 ${P}(기대여명 ${lifeExpectancy}년), 부양가족 가중치 ${W}, 소득배수 ${IM} → (${dep_score.toFixed(2)} + ${age_addon.toFixed(2)}) × ${IM} = ${사망}점`;

  // ② 질병 리스크 — dead_reason.json 기반 5년 단위 정밀 사망률
  const ageBracket = input.age < 30 ? '20대' : input.age < 40 ? '30대' : input.age < 50 ? '40대' : input.age < 60 ? '50대' : '60대';
  const ageBracket5 = getAgeBracket5(input.age);

  // dead_reason.json에서 5년 단위 상위 사망원인 조회
  const deathCauses = getDeathCausesByAge(input.age, input.gender);
  const topCauses = deathCauses.slice(0, 5);

  // 암(신생물) + 심혈관+뇌혈관(순환계통) 사망률 합산
  const cancerRate = deathCauses.find(d => d.icdCategory === '암')?.rate ?? 0;
  const cardioRate = deathCauses.find(d => d.icdCategory === '심혈관+뇌혈관')?.rate ?? 0;

  // fallback: 기존 statistics.json도 참조
  const mortality = stats.disease_mortality.data[genderKey]?.[ageBracket] ?? {};
  const M_old = (mortality['암'] ?? 0) + (mortality['심장질환'] ?? 0) + (mortality['뇌혈관질환'] ?? 0);
  const M = (cancerRate + cardioRate) > 0 ? (cancerRate + cardioRate) : M_old;
  const base = Math.log10(M + 1) * 2.5;

  const familyKeywordMap: Record<string, string> = {
    '암': '암', '대장암': '암', '위암': '암', '폐암': '암', '유방암': '암', '간암': '암', '췌장암': '암', '자궁암': '암',
    '심혈관': '심혈관질환', '심장': '심혈관질환', '협심증': '심혈관질환', '심근경색': '심혈관질환',
    '뇌혈관': '뇌혈관질환', '뇌졸중': '뇌혈관질환',
    '당뇨': '당뇨병', '고혈압': '심혈관질환',
  };
  // 질병별 부모 매칭 횟수를 센 뒤, 2명 이상이면 '부모_2명' 배수 적용
  const diseaseParentCount: Record<string, number> = {};
  for (const history of input.family_history) {
    for (const [keyword, diseaseKey] of Object.entries(familyKeywordMap)) {
      if (history.includes(keyword)) {
        diseaseParentCount[diseaseKey] = (diseaseParentCount[diseaseKey] ?? 0) + 1;
      }
    }
  }
  let FM = 1.0;
  let fmLabel = '가족력 없음';
  for (const [diseaseKey, count] of Object.entries(diseaseParentCount)) {
    const tier = count >= 2 ? '부모_2명' : '부모_1명';
    const mult = stats.family_risk_factors.data[diseaseKey]?.[tier] ?? 1.0;
    if (mult > FM) { FM = mult; fmLabel = `${diseaseKey}(${tier}) ×${mult}`; }
  }

  // 가족력 직접 가산점 — log스케일 base가 젊은 나이에서 낮아도 임상적 위험 반영
  const hasCancerHistory  = input.family_history.some(h => h.includes('암'));
  const hasDiabetesHistory = input.family_history.some(h => h.includes('당뇨'));
  const hasCardioHistory  = input.family_history.some(h =>
    h.includes('심혈관') || h.includes('심장') || h.includes('협심증') || h.includes('심근경색') ||
    h.includes('뇌혈관') || h.includes('뇌졸중'));
  const familyBonus = hasCancerHistory ? 2.5 : hasDiabetesHistory ? 1.5 : hasCardioHistory ? 1.0 : 0;

  const CD_MAP: Record<string, number> = { '없음': 0, '경증': 1, '중증': 2, '암_이력': 3 };
  const CD = CD_MAP[input.current_condition] ?? 0;
  const 질병 = Math.round(Math.min(10, base * FM + CD + familyBonus));
  const topCausesStr = topCauses.map(c => `${c.icdCategory} ${c.rate}/10만명`).join(', ');
  reasoning['질병'] = `${ageBracket5} ${genderKey === 'male' ? '남' : '여'} 주요 사망원인: ${topCausesStr}. 암+순환계 합산 ${M.toFixed(1)}/10만명, log스케일 base=${base.toFixed(2)}, 가족력 ×${FM}(${fmLabel}) +${familyBonus}점, 현재질환 +${CD} → ${질병}점`;

  // ③ 상해 리스크
  const occupationalData = stats.occupational_risks.data;
  let 상해 = 3;
  let jobMatchLabel = '기본값(서비스업 수준)';
  if (occupationalData[input.job]) {
    상해 = occupationalData[input.job].위험도;
    jobMatchLabel = input.job;
  } else {
    for (const [jobKey, jobData] of Object.entries(occupationalData)) {
      if (input.job.includes(jobKey) || jobKey.includes(input.job)) {
        상해 = (jobData as any).위험도;
        jobMatchLabel = `${jobKey}로 매핑`;
        break;
      }
    }
  }
  reasoning['상해'] = `직업 "${input.job}" → ${jobMatchLabel}, 산업재해통계 기반 위험도 ${상해}점`;

  // ④ 소득중단 리스크 — economy.json 기반 실제 중위 임금 참고
  const S = stats.employment_stability.data[input.employment_type]?.stability_score ?? 5;
  const 소득중단 = Math.max(1, 11 - S);
  const medianWage = getMedianWage(input.employment_type);
  const wageInfo = medianWage ? ` (${input.employment_type} 중위 월임금 ${medianWage}천원)` : '';
  reasoning['소득중단'] = `${input.employment_type} 고용안정성 점수 ${S}${wageInfo} → 11 - ${S} = ${소득중단}점`;

  // ⑤ 노후 리스크
  const BASE_MAP: Record<string, number> = { '20대': 4, '30대': 6, '40대': 8, '50대': 9, '60대': 6 };
  const nohuBase = BASE_MAP[ageBracket] ?? 6;
  const R_MAP: Record<string, number> = { '없음': 0, '국민연금만': 1, '국민연금_퇴직연금': 2, '3가지_이상': 3 };
  const R = R_MAP[input.pension_status] ?? 0;
  const 노후 = Math.max(1, nohuBase - R);
  reasoning['노후'] = `${ageBracket} 기본위험도 ${nohuBase}, 연금준비 감소분 -${R} → ${노후}점`;

  return { 사망, 질병, 상해, 소득중단, 노후, 계산근거: reasoning };
}
