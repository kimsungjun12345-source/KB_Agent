// ──────────────────────────────────────────────
// 1. 금지 표현 필터 (판매 권유 / 추측성 / 의료 판단)
// ──────────────────────────────────────────────

const SALES_REPLACEMENTS: [RegExp, string][] = [
  // 추천 계열
  [/추천드립니다/g, '안내드립니다'],
  [/추천합니다/g, '안내합니다'],
  [/추천해\s?드립니다/g, '안내해 드립니다'],
  [/추천해\s?드릴게요/g, '안내해 드릴게요'],
  [/추천드려요/g, '안내드려요'],
  [/강력히 추천/g, '참고로 안내'],
  [/적극 추천/g, '참고로 안내'],
  // 가입 권유 계열
  [/가입하세요/g, '검토해 보시기 바랍니다'],
  [/가입을 권해드립니다/g, '검토를 안내드립니다'],
  [/가입하시는 것이 좋습니다/g, '검토해 보시는 것이 좋겠습니다'],
  [/가입하시는 걸 추천/g, '검토해 보시는 것을 안내'],
  [/꼭 가입/g, '검토'],
  [/반드시 가입/g, '검토를'],
  [/서둘러 가입/g, '검토해 보시기를'],
  [/지금 바로 가입/g, '검토해 보시기를'],
  [/빨리 가입/g, '검토해 보시기를'],
  [/꼭 들으세요/g, '검토해 보시기 바랍니다'],
  [/꼭 드세요/g, '검토해 보시기 바랍니다'],
  [/필수입니다/g, '검토 대상입니다'],
  [/놓치지 마세요/g, '참고하시기 바랍니다'],
  [/놓치면 안 됩니다/g, '참고하시기 바랍니다'],
  // 최적·최고 계열
  [/최적입니다/g, '적합할 수 있습니다'],
  [/최적의 상품입니다/g, '적합한 상품일 수 있습니다'],
  [/최적의 선택/g, '적합한 선택'],
  [/최고의 상품/g, '적합한 상품'],
  [/완벽한 상품/g, '적합한 상품'],
  [/딱 맞는 상품입니다/g, '적합할 수 있는 상품입니다'],
  // 확정적 판단 계열
  [/무조건 좋습니다/g, '검토해 볼 만합니다'],
  [/손해 볼 일이 없습니다/g, '보장 내용을 꼼꼼히 확인하시기 바랍니다'],
  [/절대 후회 안/g, '충분히 검토 후 판단하시기'],
];

const SPECULATION_REPLACEMENTS: [RegExp, string][] = [
  [/~일 것 같습니다/g, '에 대해 보험사에 확인이 필요합니다'],
  [/아마도\s/g, ''],
  [/추측하건대\s?/g, ''],
  [/아마\s/g, ''],
  [/~일 수도 있고/g, '에 대해서는 정확한 확인이 필요하며'],
  [/정확하지는 않지만/g, '정확한 내용은 보험사 확인이 필요하지만'],
  [/제 생각에는\s?/g, '공시 데이터에 따르면 '],
];

const MEDICAL_REPLACEMENTS: [RegExp, string][] = [
  [/~병이 의심됩니다/g, '에 대해서는 의료 전문가와 상담하시기 바랍니다'],
  [/~일 확률이 높습니다/g, '에 대해서는 통계적 위험도를 참고하시기 바랍니다'],
  [/진단을 받으셔야/g, '에 대해 의료기관 방문을 고려해 보시기 바랍니다'],
  [/치료를 받으셔야/g, '에 대해 의료기관 방문을 고려해 보시기 바랍니다'],
  [/~에 걸릴 가능성이/g, '에 대한 통계적 위험도는'],
];

export function filterProhibitedExpressions(text: string): string {
  let filtered = text;
  const allReplacements = [
    ...SALES_REPLACEMENTS,
    ...SPECULATION_REPLACEMENTS,
    ...MEDICAL_REPLACEMENTS,
  ];
  for (const [pattern, replacement] of allReplacements) {
    filtered = filtered.replace(pattern, replacement);
  }
  return filtered;
}

// ──────────────────────────────────────────────
// 2. 범위 밖 요청 감지
// ──────────────────────────────────────────────

interface ScopeCheckResult {
  outOfScope: boolean;
  category?: 'medical' | 'investment' | 'legal' | 'other_company' | 'irrelevant';
  message?: string;
}

const SCOPE_PATTERNS: { category: ScopeCheckResult['category']; patterns: RegExp[]; message: string }[] = [
  {
    category: 'medical',
    patterns: [
      /제\s?증상이?\s?(뭔가요|뭘까요|어떤 건가요)/,
      /저\s?(암인가요|당뇨인가요|병인가요)/,
      /어떤\s?약을?\s?먹어야/,
      /처방(해|좀)/,
      /진료\s?받아야\s?(하나요|할까요)/,
      /병원\s?가야\s?(하나요|할까요|되나요)/,
      /어떤\s?치료를?\s?(받아야|해야)/,
      /건강\s?검진\s?결과.*해석/,
    ],
    message: '죄송합니다. 저는 보험 설계 AI 에이전트로, 의료 상담이나 진단은 제공할 수 없습니다. 건강 관련 궁금하신 사항은 의료 전문가와 상담하시기 바랍니다.\n\n보험 관련 질문이 있으시면 도와드리겠습니다.',
  },
  {
    category: 'investment',
    patterns: [
      /주식.*추천/,
      /펀드.*추천/,
      /투자\s?(어디|뭐|어떻게)/,
      /코인.*사야/,
      /부동산.*투자/,
      /수익률이?\s?(높은|좋은)\s?(상품|펀드)/,
      /재테크\s?(방법|전략)/,
    ],
    message: '죄송합니다. 저는 보험 설계 전문 AI 에이전트로, 투자 상담은 제공할 수 없습니다. 투자 관련 상담은 금융투자 전문가에게 문의하시기 바랍니다.\n\n보험 관련 질문이 있으시면 도와드리겠습니다.',
  },
  {
    category: 'legal',
    patterns: [
      /소송\s?(방법|절차|해야)/,
      /변호사\s?추천/,
      /법적\s?(조치|대응|방법)/,
      /고소\s?(할까요|하려면|방법)/,
    ],
    message: '죄송합니다. 저는 보험 설계 AI 에이전트로, 법률 자문은 제공할 수 없습니다. 법률 관련 상담은 법률 전문가에게 문의하시기 바랍니다.\n\n보험 관련 질문이 있으시면 도와드리겠습니다.',
  },
  {
    category: 'other_company',
    patterns: [
      /삼성생명|한화생명|교보생명|신한라이프|미래에셋생명|동양생명|흥국생명|DB생명|ABL생명|라이나생명|메트라이프|AIA생명|푸본현대|처브라이프/,
    ],
    message: '죄송합니다. 저는 KB라이프 전용 보험 설계 에이전트입니다. 타사 상품에 대한 정보는 제공하기 어렵습니다.\n\nKB라이프 상품에 대해 궁금하신 점이 있으시면 도와드리겠습니다.',
  },
];

export function checkScope(userMessage: string): ScopeCheckResult {
  for (const { category, patterns, message } of SCOPE_PATTERNS) {
    if (patterns.some(p => p.test(userMessage))) {
      return { outOfScope: true, category, message };
    }
  }
  return { outOfScope: false };
}

// ──────────────────────────────────────────────
// 3. Stage 1~3 상품명 마스킹
// ──────────────────────────────────────────────

const PRODUCT_NAMES = [
  'KB 착한암보험 무배당',
  'KB 착한암보험',
  'KB 딱좋은 e-건강보험 무배당',
  'KB 딱좋은 e-건강보험',
  'e-건강보험',
  'KB 착한정기보험II 무배당',
  'KB 착한정기보험',
  '착한정기보험',
  'KB 딱좋은변액유니버셜연금보험',
  'KB 하이파이브평생연금보험 무배당',
  'KB 하이파이브평생연금보험',
  '하이파이브평생연금보험',
  'KB 골든라이프 딱좋은 간병보험 무배당',
  'KB 골든라이프 딱좋은 간병보험',
  '골든라이프 간병보험',
  'KB 금쪽같은 자녀보험Plus',
  'KB 금쪽같은 자녀보험',
  '금쪽같은 자녀보험',
  '착한암보험',
  '간병보험',
  '자녀보험Plus',
];

// 긴 이름부터 매칭 (부분 매칭 방지)
const SORTED_PRODUCT_NAMES = [...PRODUCT_NAMES].sort((a, b) => b.length - a.length);

export function maskProductNames(text: string, stage: number): string {
  if (stage >= 4) return text; // Stage 4 이상은 상품명 허용

  let masked = text;
  for (const name of SORTED_PRODUCT_NAMES) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    masked = masked.replace(new RegExp(escaped, 'g'), '해당 보장 상품');
  }

  // 상품 ID도 마스킹
  masked = masked.replace(/ON_PD_[A-Z]{2}_\d{2}/g, '상품');
  masked = masked.replace(/[A-Z]{2}_\d{2}/g, '상품');

  return masked;
}

// ──────────────────────────────────────────────
// 4. 환각 방지 — 숫자/조건 검증
// ──────────────────────────────────────────────

interface HallucinationCheckResult {
  hasIssue: boolean;
  warnings: string[];
  filtered: string;
}

// 공시 데이터에 있는 알려진 보험료 (products.json 기반)
const KNOWN_PREMIUMS: Record<string, Record<string, Record<string, number>>> = {
  'ON_PD_KC_01': {
    male: { '20': 4820, '30': 6740, '40': 12740, '50': 17840, '60': 24730 },
    female: { '20': 3060, '30': 4200, '40': 6980, '50': 8790, '60': 11290 },
  },
  'ON_PD_YG_01': {
    male: { '20': 12000, '30': 15200, '40': 23800, '50': 38900, '60': 65200 },
    female: { '20': 10500, '30': 13200, '40': 18600, '50': 28400, '60': 47800 },
  },
  'ON_PD_YT_01': {
    male: { '20': 13500, '30': 17000, '40': 26500, '50': 43200, '60': 72000 },
    female: { '20': 12000, '30': 14800, '40': 20800, '50': 31600, '60': 53000 },
  },
  'ON_PD_SR_01': {
    male: { '20': 8900, '30': 10800, '40': 18400, '50': 38200, '60': 89600 },
    female: { '20': 6200, '30': 7400, '40': 11200, '50': 19800, '60': 42800 },
  },
  'ON_PD_NP_01': {
    male: { '20': 50000, '30': 72000, '40': 105000, '50': 165000, '60': 280000 },
    female: { '20': 50000, '30': 72000, '40': 105000, '50': 165000, '60': 280000 },
  },
};

const KNOWN_FACTS: { pattern: RegExp; validate: (match: RegExpMatchArray) => boolean; warning: string }[] = [
  {
    // 면책기간은 90일이어야 함
    pattern: /면책기간[은는이가]?\s*(\d+)\s*일/,
    validate: (m) => parseInt(m[1]) === 90,
    warning: '면책기간 정보가 부정확할 수 있습니다. 암보험 면책기간은 90일입니다.',
  },
  {
    // 청약철회는 15일/30일
    pattern: /청약철회[는은]?\s*(\d+)\s*일/,
    validate: (m) => [15, 30].includes(parseInt(m[1])),
    warning: '청약철회 기간 정보가 부정확할 수 있습니다. 보험증권 수령 후 15일, 청약일로부터 30일 이내입니다.',
  },
  {
    // 가입나이 범위 검증 — 비현실적 나이 차단
    pattern: /만?\s*(\d+)\s*세[부~\-–까].*가입/,
    validate: (m) => {
      const age = parseInt(m[1]);
      return age >= 0 && age <= 80;
    },
    warning: '가입 나이 정보가 비현실적입니다. 공시 데이터를 확인해 주세요.',
  },
];

const VALID_PREMIUM_AGES = new Set([20, 30, 40, 50, 60]);

export function checkHallucination(text: string): HallucinationCheckResult {
  const warnings: string[] = [];
  let filtered = text;

  for (const { pattern, validate, warning } of KNOWN_FACTS) {
    const match = text.match(pattern);
    if (match && !validate(match)) {
      warnings.push(warning);
    }
  }

  // 보험료 금액이 언급되면, 알려진 범위 내인지 대략 검증
  // 월 보험료로 보이는 숫자가 100만원을 초과하면 경고 추가
  const premiumMentions = text.matchAll(/월\s*보험료[는은이가]?\s*(?:약\s*)?(\d[\d,]+)\s*원/g);
  for (const m of premiumMentions) {
    const amount = parseInt(m[1].replace(/,/g, ''));
    if (amount > 1_000_000) {
      warnings.push(`월 보험료 ${m[1]}원은 통상적 범위를 초과합니다. 정확한 금액은 보험사에 확인하시기 바랍니다.`);
    }
  }

  // 보험료 + 나이 조합 검증: 유효 나이(20/30/40/50/60)가 아닌 나이로 보험료를 언급하면 면책 추가
  const ageWithPremium = text.matchAll(/(\d{2,3})\s*세[^\n]*?(?:보험료|월납|월\s*보험)[^\n]*?([\d,]+)\s*원/g);
  let hasNonStandardAge = false;
  for (const m of ageWithPremium) {
    const age = parseInt(m[1]);
    if (!VALID_PREMIUM_AGES.has(age)) {
      hasNonStandardAge = true;
      break;
    }
    // 유효 나이면 KNOWN_PREMIUMS와 금액 대조 — 어떤 상품에도 맞지 않을 때만 경고
    const amount = parseInt(m[2].replace(/,/g, ''));
    const ageStr = age.toString();
    let matchedAny = false;
    for (const [, genderData] of Object.entries(KNOWN_PREMIUMS)) {
      for (const [, ageData] of Object.entries(genderData)) {
        const known = ageData[ageStr];
        if (known && Math.abs(amount - known) / known <= 0.05) {
          matchedAny = true;
        }
      }
    }
    if (!matchedAny) {
      warnings.push(`${age}세 보험료 ${m[2]}원이 공시 데이터와 차이가 있을 수 있습니다.`);
    }
  }

  if (hasNonStandardAge) {
    // 비표준 나이의 보험료를 언급한 경우 면책 문구 강제 추가
    if (!filtered.includes('정확한 보험료는') && !filtered.includes('KB라이프에 확인')) {
      filtered += '\n\n> **[보험료 안내]** 보험료 데이터는 20/30/40/50/60세 기준만 제공됩니다. 정확한 보험료는 KB라이프(1588-9922)에 확인하시기 바랍니다.';
    }
  }

  // 경고가 있으면 응답 끝에 면책 문구 추가 (중복 제거, 최대 1문장)
  const uniqueWarnings = [...new Set(warnings)];
  if (uniqueWarnings.length > 0) {
    filtered += '\n\n> **[정확성 안내]** ' + uniqueWarnings[0] + ' 정확한 내용은 KB라이프(1588-9922)에 확인하시기 바랍니다.';
  }

  return { hasIssue: warnings.length > 0 || hasNonStandardAge, warnings, filtered };
}

// ──────────────────────────────────────────────
// 5. 적합성 원칙 검증
// ──────────────────────────────────────────────

interface SuitabilityInput {
  age?: number;
  monthlyIncome?: string;
  monthlyBudget?: number;
  currentCondition?: string;
}

interface SuitabilityResult {
  suitable: boolean;
  warnings: string[];
}

const INCOME_MAX_MAP: Record<string, number> = {
  '200만원_미만': 200_000 * 0.3,     // 60,000
  '200~500만원': 500_000 * 0.3,      // 150,000
  '500~800만원': 800_000 * 0.3,      // 240,000
  '800만원_이상': 1_500_000,          // 상한 없음에 가까움
};

export function checkSuitability(input: SuitabilityInput): SuitabilityResult {
  const warnings: string[] = [];

  // 소득 대비 보험료 비율 체크 (월 소득의 10% 초과 시 경고)
  if (input.monthlyIncome && input.monthlyBudget) {
    const incomeEstimate: Record<string, number> = {
      '200만원_미만': 150,
      '200~500만원': 350,
      '500~800만원': 650,
      '800만원_이상': 1000,
    };
    const est = incomeEstimate[input.monthlyIncome];
    if (est) {
      const ratio = input.monthlyBudget / (est * 10000);
      if (ratio > 0.15) {
        warnings.push(
          `고객의 월 보험료 예산(${input.monthlyBudget.toLocaleString()}원)이 추정 월 소득 대비 ${(ratio * 100).toFixed(0)}%로, 과도할 수 있습니다. 적정 비율(10~15%)을 고려하여 설계하세요.`
        );
      }
    }
  }

  // 고령자 고액 보험 경고
  if (input.age && input.age >= 60 && input.monthlyBudget && input.monthlyBudget > 200_000) {
    warnings.push(
      '60세 이상 고객의 고액 보험료 설계입니다. 갱신 시 보험료 인상 가능성과 납입 부담을 충분히 안내하세요.'
    );
  }

  // 유병력자 일반심사형 상품 경고 (route.ts에서 상품 매칭 시 활용)
  if (input.currentCondition && ['중증', '암_이력'].includes(input.currentCondition)) {
    warnings.push(
      '중증 질환 또는 암 이력이 있는 고객입니다. 일반심사형 상품은 가입이 제한될 수 있으며, 간편심사형 상품을 우선 검토하세요.'
    );
  }

  return { suitable: warnings.length === 0, warnings };
}

// ──────────────────────────────────────────────
// 통합 가드레일 적용 함수
// ──────────────────────────────────────────────

export interface GuardrailResult {
  text: string;
  blocked: boolean;
  blockMessage?: string;
  warnings: string[];
}

export function applyGuardrails(
  text: string,
  stage: number,
  userMessage?: string,
): GuardrailResult {
  const warnings: string[] = [];

  // ① 범위 밖 요청 체크 (사용자 메시지 기준)
  if (userMessage) {
    const scopeCheck = checkScope(userMessage);
    if (scopeCheck.outOfScope) {
      return {
        text: scopeCheck.message!,
        blocked: true,
        blockMessage: scopeCheck.message,
        warnings: [`범위 밖 요청 차단: ${scopeCheck.category}`],
      };
    }
  }

  // ② 금지 표현 치환
  let filtered = filterProhibitedExpressions(text);

  // ③ 상품명 마스킹 (Stage 1~3)
  filtered = maskProductNames(filtered, stage);

  // ④ 환각 검증
  const hallucinationCheck = checkHallucination(filtered);
  filtered = hallucinationCheck.filtered;
  warnings.push(...hallucinationCheck.warnings);

  return { text: filtered, blocked: false, warnings };
}
