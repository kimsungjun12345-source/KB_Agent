interface ValidationResult {
  complete: boolean;
  missingFields: string[];
}

const FIELD_CHECKS: { field: string; label: string; patterns: RegExp[] }[] = [
  { field: 'age', label: '나이', patterns: [/\d{2,3}\s*세/, /\d{2,3}\s*살/, /나이.*\d/] },
  { field: 'gender', label: '성별', patterns: [/남성|여성|남자|여자/] },
  { field: 'job', label: '직업', patterns: [/직업|일하|개발|사무|영업|자영|건설|운송|제조|서비스|프리랜서|IT|마케팅|교사|의사|간호|공무원|스타트업/] },
  { field: 'employment_type', label: '고용형태', patterns: [/정규직|비정규직|자영업|프리랜서|계약직/] },
  { field: 'family_structure', label: '가족구성', patterns: [/미혼|기혼|결혼|자녀|아이|부양|독신|싱글/] },
  { field: 'monthly_income', label: '월 소득', patterns: [/소득|월급|수입|연봉|\d+만\s*원/] },
  { field: 'family_history', label: '가족력', patterns: [/가족력|부모.*질환|아버지|어머니|가족.*병|암|당뇨|고혈압|심장|심혈관|뇌혈관|가족.*없음|가족.*없어|가족력.*없/] },
  { field: 'current_condition', label: '현재 건강상태', patterns: [/현재.*질환|앓고|건강.*상태|건강.*이상|이상.*없|질환.*없|건강합니다|건강해|건강함|특이.*없|이상없|건강.*없음|고혈압|당뇨|심혈관|암.*이력/] },
  { field: 'pension_status', label: '연금/노후 준비', patterns: [/연금|퇴직연금|노후|저축|준비.*없|없음/] },
  { field: 'monthly_budget', label: '월 보험료 예산', patterns: [/예산|보험료.*만원|월.*만원.*보험|보험.*\d+만|\d+만.*예산/] },
];

export function validateStage1Completeness(messages: any[]): ValidationResult {
  // 사용자 메시지만 검사 (AI 메시지 제외)
  const userText = messages
    .filter((m: any) => m.role === 'user')
    .map((m: any) => (m.content ?? ''))
    .join('\n');

  const missingFields: string[] = [];

  for (const check of FIELD_CHECKS) {
    const found = check.patterns.some(p => p.test(userText));
    if (!found) {
      missingFields.push(check.label);
    }
  }

  // 핵심 필드(나이·성별·직업·소득)가 있으면 진행 허용 — 나머지는 LLM이 보완
  const criticalFields = ['나이', '성별', '직업', '월 소득'];
  const missingCritical = missingFields.filter(f => criticalFields.includes(f));
  return { complete: missingCritical.length === 0, missingFields };
}
