export interface ParsedResponse {
  cleanText: string;
  stage?: number;
  visualizations?: Array<{
    type: 'risk_map' | 'gap_analysis' | 'product_match' | 'final_report';
    data: any;
  }>;
}

const VIZ_TYPES = ['risk_map', 'gap_analysis', 'product_match', 'final_report'] as const;
type VizType = typeof VIZ_TYPES[number];

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

/** 마커 없이 인라인으로 출력된 시각화 JSON을 괄호 균형으로 추출 */
function extractInlineVisualization(text: string): { jsonStr: string; remainder: string } | null {
  const typePattern = new RegExp(`"type"\\s*:\\s*"(${VIZ_TYPES.join('|')})"`)

  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '{') continue;

    let depth = 0;
    let inString = false;
    let escaped = false;
    let j = i;

    while (j < text.length) {
      const ch = text[j];
      if (escaped)         { escaped = false; j++; continue; }
      if (ch === '\\' && inString) { escaped = true; j++; continue; }
      if (ch === '"')      { inString = !inString; j++; continue; }
      if (inString)        { j++; continue; }
      if (ch === '{')      depth++;
      else if (ch === '}') { depth--; if (depth === 0) break; }
      j++;
    }

    if (depth !== 0) continue; // 괄호 불균형 → 건너뜀

    const candidate = text.slice(i, j + 1);
    if (typePattern.test(candidate)) {
      const remainder = (text.slice(0, i) + text.slice(j + 1))
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      return { jsonStr: candidate, remainder };
    }
  }
  return null;
}

/** 코드블록(```json ... ```)으로 감싼 JSON도 처리 */
function extractCodeBlockVisualization(text: string): { jsonStr: string; remainder: string } | null {
  const typePattern = new RegExp(`"type"\\s*:\\s*"(${VIZ_TYPES.join('|')})"`)
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch && typePattern.test(codeBlockMatch[1])) {
    return {
      jsonStr: codeBlockMatch[1],
      remainder: text.replace(codeBlockMatch[0], '').replace(/\n{3,}/g, '\n\n').trim(),
    };
  }
  return null;
}

function transformData(type: VizType, rawData: any): any {
  if (type === 'risk_map') {
    const industryAvg: Record<string, number> = { 사망: 40, 질병: 50, 상해: 30, 소득중단: 45, 노후: 55 };
    return Object.entries(rawData).map(([category, score]) => ({
      category,
      risk_level: (score as number) * 10,
      industry_avg: industryAvg[category] ?? 40,
    }));
  }
  if (type === 'gap_analysis') {
    return Object.entries(rawData).map(([category, val]: [string, any]) => {
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
  }
  if (type === 'product_match') {
    return (rawData as any[]).map((item: any) => ({
      product_name: item.product_name,
      match_score: item.gap_before > 0
        ? Math.round(((item.gap_before - item.gap_after) / item.gap_before) * 100)
        : 80,
      monthly_premium: item.premium_monthly,
      key_benefits: [item.covers_risk + ' 리스크 보장', item.reason].filter(Boolean),
    }));
  }
  return rawData;
}

export function parseResponse(response: string): ParsedResponse {
  // ── 1. STAGE 마커 정규화 ──
  let normalized = response
    .replace(/\(?\s*#{2,}\s*STAGE\s*:\s*(\d)\s*#{0,}\s*\)?\s*/g, '###STAGE:$1### ');

  const stageMatch = normalized.match(/###STAGE:(\d)###/);
  const markerStage = stageMatch ? parseInt(stageMatch[1]) : undefined;
  let cleaned = normalized.replace(/###STAGE:\d###\s*/g, '').trim();

  // 잔여 마커 파편 제거
  cleaned = cleaned.replace(/#+\s*END_VISUALIZATION\s*#+/g, '');
  cleaned = cleaned.replace(/#+\s*VISUALIZATION\s*#+/g, '');
  cleaned = cleaned.replace(/#END_VISUALIZATION[#]*/g, '');
  cleaned = cleaned.replace(/[#]+END_VISUALIZATION/g, '');

  // ── 2. VISUALIZATION 마커 정규화 ──
  cleaned = cleaned.replace(/<details[^>]*>[\s\S]*?<\/summary>\s*/gi, '');
  cleaned = cleaned.replace(/<\/details>/gi, '');

  cleaned = cleaned
    .replace(/#+\s*VISUALIZATION\s*#+/g, '###VISUALIZATION###')
    .replace(/#+\s*END_VISUALIZATION\s*#+/g, '###END_VISUALIZATION###')
    .replace(/#+\s*END\s+VISUALIZATION\s*#+/g, '###END_VISUALIZATION###');

  cleaned = cleaned.replace(/```(?:json)?\s*(###VISUALIZATION###[\s\S]*?###END_VISUALIZATION###)\s*```/g, '$1');
  cleaned = cleaned.replace(/###VISUALIZATION###\s*/g, '###VISUALIZATION###');
  cleaned = cleaned.replace(/\s*###END_VISUALIZATION###/g, '###END_VISUALIZATION###');
  cleaned = cleaned.replace(/(\}[\s\]]*\})#+\s*###END_VISUALIZATION###/g, '$1###END_VISUALIZATION###');
  cleaned = cleaned.replace(/(###VISUALIZATION###[\s\S]*?\}[\s\]]*\})#{2,}(?!\w)/g, '$1###END_VISUALIZATION###');

  // ── 3. 마커 기반 추출 ──
  const markerMatch = cleaned.match(/###VISUALIZATION###([\s\S]*?)###END_VISUALIZATION###/);

  function tryParseAndBuild(jsonStr: string, textWithout: string): ParsedResponse | null {
    try {
      let s = jsonStr.trim().replace(/[\s#]+$/, '');
      const ob = (s.match(/\{/g) || []).length;
      const cb = (s.match(/\}/g) || []).length;
      if (ob > cb) s += '}'.repeat(ob - cb);
      const obr = (s.match(/\[/g) || []).length;
      const cbr = (s.match(/\]/g) || []).length;
      if (obr > cbr) s += ']'.repeat(obr - cbr);

      const parsed = JSON.parse(s);
      const type = parsed.type as VizType;
      if (!VIZ_TYPES.includes(type)) return null;

      const data = transformData(type, parsed.data);
      const stage = markerStage ?? inferStageFromText(textWithout, type);
      return { cleanText: textWithout, stage, visualizations: [{ type, data }] };
    } catch {
      return null;
    }
  }

  if (markerMatch) {
    const textWithout = cleaned.replace(/###VISUALIZATION###[\s\S]*?###END_VISUALIZATION###/, '').trim();
    const result = tryParseAndBuild(markerMatch[1], textWithout);
    if (result) return result;
  }

  // ── 4. 폴백: 코드블록 JSON 감지 ──
  const codeResult = extractCodeBlockVisualization(cleaned);
  if (codeResult) {
    const result = tryParseAndBuild(codeResult.jsonStr, codeResult.remainder);
    if (result) return result;
  }

  // ── 5. 폴백: 인라인 bare JSON 감지 ──
  const inlineResult = extractInlineVisualization(cleaned);
  if (inlineResult) {
    const result = tryParseAndBuild(inlineResult.jsonStr, inlineResult.remainder);
    if (result) return result;
  }

  // ── 6. 시각화 없음 ──
  const stage = markerStage ?? inferStageFromText(cleaned);
  return { cleanText: cleaned, stage };
}
