export interface ParsedResponse {
  cleanText: string;
  stage?: number;
  visualizations?: Array<{
    type: 'risk_map' | 'gap_analysis' | 'product_match' | 'final_report';
    data: any;
  }>;
}

function inferStageFromText(text: string, vizType?: string): number | undefined {
  if (vizType === 'risk_map') return 2;
  if (vizType === 'gap_analysis') return 3;
  if (vizType === 'product_match') return 5;
  if (vizType === 'final_report') return 8;
  if (text.includes('가입 절차') || text.includes('Final Call')) return 9;
  if (text.includes('최종 설계안') || text.includes('설계안을 확정')) return 8;
  if (text.includes('설계를 조정') || text.includes('조정해드릴')) return 7;
  if (text.includes('추가로 궁금') || text.includes('질문이 있으시')) return 6;
  if (text.includes('고지의무')) return 4;
  if (text.includes('보장 갭') || text.includes('갭 분석')) return 3;
  if (text.includes('리스크 점수') || text.includes('리스크 지도')) return 2;
  return undefined;
}

export function parseResponse(response: string): ParsedResponse {
  // ── 1. STAGE 마커 정규화 ──
  // 다양한 LLM 출력 패턴을 모두 처리:
  //   ###STAGE:4###  /  ### STAGE:4 ###  /  ###STAGE:4  /  (###STAGE:4###)
  let normalized = response
    // 괄호로 감싼 경우 제거: (###STAGE:4###) → ###STAGE:4###
    .replace(/\(?\s*#{2,}\s*STAGE\s*:\s*(\d)\s*#{0,}\s*\)?\s*/g, '###STAGE:$1### ');

  const stageMatch = normalized.match(/###STAGE:(\d)###/);
  const markerStage = stageMatch ? parseInt(stageMatch[1]) : undefined;
  let cleaned = normalized.replace(/###STAGE:\d###\s*/g, '').trim();

  // ── 2. VISUALIZATION 마커 정규화 ──
  // HTML 태그로 감싼 경우 벗겨냄: <details><summary>...</summary> ###VIZ...### </details>
  cleaned = cleaned.replace(/<details[^>]*>[\s\S]*?<\/summary>\s*/gi, '');
  cleaned = cleaned.replace(/<\/details>/gi, '');

  // 다양한 마커 포맷 정규화
  cleaned = cleaned
    .replace(/#{2,}\s*VISUALIZATION\s*#{2,}/g, '###VISUALIZATION###')
    .replace(/#{2,}\s*END_VISUALIZATION\s*#{2,}/g, '###END_VISUALIZATION###')
    .replace(/#{2,}\s*END\s+VISUALIZATION\s*#{2,}/g, '###END_VISUALIZATION###');

  // 코드블록으로 감싼 경우 벗겨냄
  cleaned = cleaned.replace(/```(?:json)?\s*(###VISUALIZATION###[\s\S]*?###END_VISUALIZATION###)\s*```/g, '$1');

  // 마커 사이 공백/줄바꿈/### 잔여물 정리
  cleaned = cleaned.replace(/###VISUALIZATION###\s*/g, '###VISUALIZATION###');
  cleaned = cleaned.replace(/\s*###END_VISUALIZATION###/g, '###END_VISUALIZATION###');

  // JSON 끝과 END_VISUALIZATION 사이에 끼인 잡문자 제거
  cleaned = cleaned.replace(/(\}[\s\]]*\})#+\s*###END_VISUALIZATION###/g, '$1###END_VISUALIZATION###');

  // END_VISUALIZATION 없이 ###만으로 끝나는 경우: ...}]}### → ...}]}###END_VISUALIZATION###
  cleaned = cleaned.replace(/(###VISUALIZATION###[\s\S]*?\}[\s\]]*\})#{2,}(?!\w)/g, '$1###END_VISUALIZATION###');

  // ── 3. 시각화 JSON 추출 ──
  const visualizationMatch = cleaned.match(/###VISUALIZATION###([\s\S]*?)###END_VISUALIZATION###/);

  if (visualizationMatch) {
    let parsed;
    try {
      let jsonStr = visualizationMatch[1].trim();
      // 끝에 붙은 잡문자(#, 공백) 제거
      jsonStr = jsonStr.replace(/[\s#]+$/, '');
      // 닫는 괄호가 빠진 경우 보정
      const openBraces = (jsonStr.match(/\{/g) || []).length;
      const closeBraces = (jsonStr.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        jsonStr += '}'.repeat(openBraces - closeBraces);
      }
      const openBrackets = (jsonStr.match(/\[/g) || []).length;
      const closeBrackets = (jsonStr.match(/\]/g) || []).length;
      if (openBrackets > closeBrackets) {
        jsonStr += ']'.repeat(openBrackets - closeBrackets);
      }
      parsed = JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to parse visualization data:', error);
      return { text: response };
    }

    const type = parsed.type as 'risk_map' | 'gap_analysis' | 'product_match' | 'final_report';
    const rawData = parsed.data;
    const textWithoutVisualization = cleaned.replace(/###VISUALIZATION###[\s\S]*?###END_VISUALIZATION###/, '').trim();

    let data = rawData;

    if (type === 'risk_map') {
      const industryAvg: Record<string, number> = { 사망: 40, 질병: 50, 상해: 30, 소득중단: 45, 노후: 55 };
      data = Object.entries(rawData).map(([category, score]) => ({
        category,
        risk_level: (score as number) * 10,
        industry_avg: industryAvg[category] ?? 40,
      }));
    } else if (type === 'gap_analysis') {
      data = Object.entries(rawData).map(([category, val]: [string, any]) => {
        const recommended = val.risk * 1000;
        const current = val.covered * 1000;
        return {
          category,
          current_coverage: current,
          recommended_coverage: recommended,
          gap: Math.max(0, recommended - current),
          over_coverage: Math.max(0, current - recommended),
        };
      });
    } else if (type === 'product_match') {
      data = (rawData as any[]).map((item: any) => ({
        product_name: item.product_name,
        match_score: item.gap_before > 0
          ? Math.round(((item.gap_before - item.gap_after) / item.gap_before) * 100)
          : 80,
        monthly_premium: item.premium_monthly,
        key_benefits: [item.covers_risk + ' 리스크 보장', item.reason].filter(Boolean),
      }));
    }

    const stage = markerStage ?? inferStageFromText(textWithoutVisualization, type);
    return {
      cleanText: textWithoutVisualization,
      stage,
      visualizations: [{ type, data }]
    };
  }

  const stage = markerStage ?? inferStageFromText(cleaned);
  return { cleanText: cleaned, stage };
}
