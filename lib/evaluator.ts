export interface EvalIssue {
  severity: 'critical' | 'warning' | 'info';
  rule: string;
  message: string;
  messageIndex?: number;
}

export interface SessionEval {
  sessionId: string;
  savedAt: string;
  finalStage: number;
  messageCount: number;
  score: number; // 0~100
  issues: EvalIssue[];
}

interface LogMessage {
  index: number;
  role: string;
  content: string;
  has_visualization: boolean;
  visualization_type: string | null;
}

interface SessionLog {
  session_id: string;
  saved_at: string;
  final_stage: number;
  message_count: number;
  conversation: LogMessage[];
}

const PROHIBITED_PATTERNS = [
  /추천드립니다/, /추천합니다/, /추천해\s?드립니다/,
  /가입하세요/, /가입을 권해/, /가입하시는 것이 좋/,
  /최적입니다/, /최적의 상품/, /꼭 가입/, /반드시 가입/,
];

const REQUIRED_FIELDS = [
  { label: '나이', patterns: [/\d{2,3}\s*세/, /\d{2,3}\s*살/] },
  { label: '성별', patterns: [/남성|여성|남자|여자/] },
  { label: '직업', patterns: [/개발|사무|영업|자영|건설|운송|제조|서비스|프리랜서|IT|마케팅|스타트업/] },
  { label: '고용형태', patterns: [/정규직|비정규직|자영업|프리랜서|계약직/] },
  { label: '가족구성', patterns: [/미혼|기혼|결혼|자녀|독신/] },
  { label: '월소득', patterns: [/소득|월급|수입|연봉|\d+만\s*원/] },
  { label: '가족력', patterns: [/가족력|부모.*질환|암|당뇨|고혈압|심혈관|가족.*병/] },
  { label: '건강상태', patterns: [/현재.*질환|고혈압|당뇨|건강|질환.*없/] },
  { label: '연금준비', patterns: [/연금|퇴직|노후|저축/] },
  { label: '보험료예산', patterns: [/예산|보험료.*만원|월.*만원.*보험/] },
];

export function evaluateSession(log: SessionLog): SessionEval {
  const issues: EvalIssue[] = [];
  const msgs = log.conversation;
  const allText = msgs.map(m => m.content).join('\n');
  const assistantMsgs = msgs.filter(m => m.role === 'assistant');

  // ── Rule 1: 에러 응답 발생 ──
  for (const msg of assistantMsgs) {
    if (msg.content.includes('일시적인 오류가 발생했습니다')) {
      issues.push({
        severity: 'critical',
        rule: 'api_error',
        message: 'API 오류 발생',
        messageIndex: msg.index,
      });
    }
  }

  // ── Rule 2: 금지 표현 사용 ──
  for (const msg of assistantMsgs) {
    for (const pattern of PROHIBITED_PATTERNS) {
      if (pattern.test(msg.content)) {
        issues.push({
          severity: 'critical',
          rule: 'prohibited_expression',
          message: `금지 표현 감지: "${msg.content.match(pattern)?.[0]}"`,
          messageIndex: msg.index,
        });
      }
    }
  }

  // ── Rule 3: Stage 1~3에서 상품명 언급 ──
  const productNames = ['착한암보험', '정기보험', '건강보험', '연금보험', '하이파이브', 'KB 착한', 'KB 딱좋은', '간병보험', '골든라이프', '자녀보험', '금쪽같은', 'KB 골든', 'KB 금쪽'];
  let currentStage = 1;
  for (const msg of msgs) {
    // 간이 stage 추적
    if (msg.role === 'assistant') {
      if (msg.visualization_type === 'risk_map') currentStage = Math.max(currentStage, 2);
      if (msg.visualization_type === 'gap_analysis') currentStage = Math.max(currentStage, 3);
      if (msg.content.includes('고지의무')) currentStage = Math.max(currentStage, 4);
      if (msg.visualization_type === 'product_match') currentStage = Math.max(currentStage, 5);
    }
    if (msg.role === 'assistant' && currentStage <= 3) {
      for (const name of productNames) {
        if (msg.content.includes(name)) {
          issues.push({
            severity: 'critical',
            rule: 'premature_product_mention',
            message: `Stage ${currentStage}에서 상품명 "${name}" 언급`,
            messageIndex: msg.index,
          });
          break;
        }
      }
    }
  }

  // ── Rule 4: 정보 수집 완료 전 Stage 2 진입 ──
  // Stage 2 진입 시점 이전의 텍스트에서 필수 필드 확인
  const riskMapIdx = msgs.findIndex(m => m.visualization_type === 'risk_map');
  if (riskMapIdx > 0) {
    const preRiskText = msgs.slice(0, riskMapIdx).map(m => m.content).join('\n');
    const missing: string[] = [];
    for (const field of REQUIRED_FIELDS) {
      if (!field.patterns.some(p => p.test(preRiskText))) {
        missing.push(field.label);
      }
    }
    if (missing.length > 0) {
      issues.push({
        severity: 'warning',
        rule: 'incomplete_info_collection',
        message: `리스크 진단 전 미수집 필드: ${missing.join(', ')}`,
        messageIndex: riskMapIdx,
      });
    }
  }

  // ── Rule 5: 시각화 렌더링 실패 (코드블록으로 감싸진 마커) ──
  for (const msg of assistantMsgs) {
    if (msg.content.includes('###VISUALIZATION###') && !msg.has_visualization) {
      issues.push({
        severity: 'critical',
        rule: 'visualization_parse_fail',
        message: '시각화 마커가 있으나 렌더링 실패 (코드블록 감싸짐 등)',
        messageIndex: msg.index,
      });
    }
    // ```json 안에 VISUALIZATION이 있는 경우
    if (/```(?:json)?\s*###VISUALIZATION###/.test(msg.content)) {
      issues.push({
        severity: 'warning',
        rule: 'visualization_in_codeblock',
        message: '시각화 마커가 코드블록 안에 출력됨',
        messageIndex: msg.index,
      });
    }
  }

  // ── Rule 6: 시각화 중복 출력 ──
  let lastVizType: string | null = null;
  for (const msg of assistantMsgs) {
    if (msg.visualization_type) {
      if (msg.visualization_type === lastVizType) {
        issues.push({
          severity: 'warning',
          rule: 'duplicate_visualization',
          message: `"${msg.visualization_type}" 시각화 중복 출력`,
          messageIndex: msg.index,
        });
      }
      lastVizType = msg.visualization_type;
    }
  }

  // ── Rule 7: Stage 4 고지의무 안내 누락 ──
  if (log.final_stage >= 5) {
    const hasNotice = assistantMsgs.some(m =>
      m.content.includes('고지의무') && m.content.includes('청약철회')
    );
    if (!hasNotice) {
      issues.push({
        severity: 'critical',
        rule: 'missing_disclosure',
        message: '상품 매칭 전 고지의무/청약철회 안내 누락',
      });
    }
  }

  // ── Rule 8: 전체 흐름 완성도 ──
  if (log.final_stage < 5) {
    issues.push({
      severity: 'info',
      rule: 'incomplete_flow',
      message: `Stage ${log.final_stage}에서 대화 종료 (상품 매칭 미도달)`,
    });
  }

  // ── Rule 9: Tool 호출 확인 (risk_map 시각화 없이 Stage 2 넘어감) ──
  if (log.final_stage >= 2) {
    const hasRiskMap = assistantMsgs.some(m => m.visualization_type === 'risk_map');
    if (!hasRiskMap) {
      issues.push({
        severity: 'critical',
        rule: 'missing_risk_tool',
        message: 'Stage 2 이상이나 리스크맵 시각화 없음 (Tool 미호출 가능성)',
      });
    }
  }
  if (log.final_stage >= 3) {
    const hasGapAnalysis = assistantMsgs.some(m => m.visualization_type === 'gap_analysis');
    if (!hasGapAnalysis) {
      issues.push({
        severity: 'critical',
        rule: 'missing_gap_tool',
        message: 'Stage 3 이상이나 갭 분석 시각화 없음 (Tool 미호출 가능성)',
      });
    }
  }

  // ── Rule 10: 보험료 보간 감지 ──
  // LLM이 20/30/40/50/60세가 아닌 나이의 보험료를 언급하면 플래그
  const KNOWN_AGES = new Set([20, 30, 40, 50, 60]);
  for (const msg of assistantMsgs) {
    // "32세 기준 월 보험료 약 7,500원" 같은 패턴 감지
    const premiumWithAge = msg.content.matchAll(/(\d{2,3})\s*세[^\n]*?(?:보험료|월납|월\s*보험)[^\n]*?[\d,]+\s*원/g);
    for (const m of premiumWithAge) {
      const age = parseInt(m[1]);
      if (!KNOWN_AGES.has(age)) {
        issues.push({
          severity: 'critical',
          rule: 'premium_interpolation',
          message: `${age}세 보험료를 보간/추정하여 언급 (허용 나이: 20/30/40/50/60세만)`,
          messageIndex: msg.index,
        });
        break;
      }
    }
  }

  // ── Rule 11: 반복 루프 감지 ──
  // 연속 assistant 응답이 80% 이상 유사하면 플래그
  for (let i = 1; i < assistantMsgs.length; i++) {
    const prev = assistantMsgs[i - 1].content;
    const curr = assistantMsgs[i].content;
    if (prev.length > 50 && curr.length > 50) {
      // 간단한 유사도: 공통 bigram 비율
      const bigrams = (s: string) => {
        const set = new Set<string>();
        for (let j = 0; j < s.length - 1; j++) set.add(s.slice(j, j + 2));
        return set;
      };
      const a = bigrams(prev);
      const b = bigrams(curr);
      let overlap = 0;
      for (const bg of a) if (b.has(bg)) overlap++;
      const similarity = overlap / Math.max(a.size, b.size);
      if (similarity > 0.8) {
        issues.push({
          severity: 'warning',
          rule: 'response_loop',
          message: `연속 응답 유사도 ${(similarity * 100).toFixed(0)}% — 루프 가능성`,
          messageIndex: assistantMsgs[i].index,
        });
      }
    }
  }

  // ── Rule 12: 빈 응답 감지 ──
  for (const msg of assistantMsgs) {
    if (msg.content.trim() === '') {
      issues.push({
        severity: 'critical',
        rule: 'empty_response',
        message: '빈 응답 감지',
        messageIndex: msg.index,
      });
    }
  }

  // ── 점수 계산 ──
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const score = Math.max(0, 100 - criticalCount * 20 - warningCount * 5);

  return {
    sessionId: log.session_id,
    savedAt: log.saved_at,
    finalStage: log.final_stage,
    messageCount: log.message_count,
    score,
    issues,
  };
}
