import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 60;
import { readFileSync } from 'fs';
import { join } from 'path';
import { SYSTEM_PROMPT } from '@/lib/system-prompt';
import { searchRelevantChunks, formatRagContext, extractMentionedProductIds } from '@/lib/rag';
import { calculateRiskScores, RiskInput, getDeathCausesByAge } from '@/lib/riskCalculator';
import { calculateGapAnalysis, GapInput } from '@/lib/gapCalculator';
import { applyGuardrails, checkScope, checkSuitability } from '@/lib/complianceFilter';
import { validateStage1Completeness } from '@/lib/validateChecklist';

const RISK_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'calculate_risk_scores',
    description: 'STAGE 1 정보수집이 완료되면 반드시 이 툴을 호출하여 리스크 점수를 계산합니다. 직접 계산하지 마세요.',
    parameters: {
      type: 'object',
      properties: {
        age:              { type: 'number', description: '나이 (숫자)' },
        gender:           { type: 'string', enum: ['male', 'female'] },
        job:              { type: 'string', description: '직업 키워드 (예: IT_개발, 사무직, 자영업_카페, 건설업)' },
        employment_type:  { type: 'string', enum: ['정규직', '비정규직', '자영업', '프리랜서'] },
        family_structure: { type: 'string', description: 'dependency_factors 키값 (예: 미혼_무부양, 기혼_자녀2명)' },
        monthly_income:   { type: 'string', enum: ['200만원_미만', '200~500만원', '500~800만원', '800만원_이상'] },
        family_history:   { type: 'array', items: { type: 'string' }, description: '가족력 목록 (예: ["암", "당뇨", "심혈관"])' },
        current_condition:{ type: 'string', enum: ['없음', '경증', '중증', '암_이력'] },
        pension_status:   { type: 'string', enum: ['없음', '국민연금만', '국민연금_퇴직연금', '3가지_이상'] },
      },
      required: ['age', 'gender', 'job', 'employment_type', 'family_structure', 'monthly_income', 'family_history', 'current_condition', 'pension_status'],
    },
  },
};

const GAP_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'calculate_gap_analysis',
    description: 'STAGE 2에서 리스크 점수가 산출된 후, STAGE 3 갭 분석 시 반드시 이 툴을 호출하여 보장 갭을 계산합니다. 직접 계산하지 마세요.',
    parameters: {
      type: 'object',
      properties: {
        risk_scores: {
          type: 'object',
          description: 'STAGE 2에서 산출된 리스크 점수',
          properties: {
            사망:     { type: 'number' },
            질병:     { type: 'number' },
            상해:     { type: 'number' },
            소득중단: { type: 'number' },
            노후:     { type: 'number' },
          },
          required: ['사망', '질병', '상해', '소득중단', '노후'],
        },
        existing_insurances: {
          type: 'array',
          description: '고객이 현재 보유한 보험 목록',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['종신보험', '정기보험', '암보험', '종합건강보험', '실손', '상해보험', '연금보험', '개인연금', '단체보험', '간병보험', '자녀보험'],
              },
              coverage_amount: {
                type: 'string',
                enum: ['1억미만', '1억~3억', '3억이상'],
              },
            },
            required: ['type', 'coverage_amount'],
          },
        },
      },
      required: ['risk_scores', 'existing_insurances'],
    },
  },
};

// OPENROUTER_API_KEY 또는 ANTHROPIC_API_KEY 중 하나를 사용
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY;
const DEMO_MODE = !OPENROUTER_KEY;

const client = DEMO_MODE ? null : new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_KEY,
});

let dataCache: { products: any; statistics: any } | null = null;
function loadData() {
  if (!dataCache) {
    const productsPath = join(process.cwd(), 'data', 'products.json');
    const statisticsPath = join(process.cwd(), 'data', 'statistics.json');
    dataCache = {
      products: JSON.parse(readFileSync(productsPath, 'utf-8')),
      statistics: JSON.parse(readFileSync(statisticsPath, 'utf-8')),
    };
  }
  return dataCache;
}

function buildDataContext(stage: number, customerAge?: number, customerGender?: 'male' | 'female'): string {
  const { products, statistics } = loadData();

  let context = '';

  // STAGE 1: 통계 불필요 (정보 수집 단계)
  // STAGE 2-3: 리스크 관련 통계만
  // STAGE 4+: 통계 + 상품 데이터
  if (stage >= 2) {
    context += `\n## 실제 통계 데이터 (리스크 산출 시 이 데이터를 사용하세요)\n`;
    context += `### 연령별 질병 사망률 (인구 10만명당)\n`;
    context += JSON.stringify(statistics.disease_mortality.data, null, 2);
    context += `\n### 생명표 (사망확률/기대여명)\n`;
    context += JSON.stringify(statistics.life_table.data, null, 2);

    // 고객 나이가 있으면 해당 5년 구간의 상위 5개 사망 원인 추가
    if (customerAge && customerGender) {
      const topCauses = getDeathCausesByAge(customerAge, customerGender).slice(0, 5);
      if (topCauses.length > 0) {
        context += `\n### 고객(${customerAge}세 ${customerGender === 'male' ? '남' : '여'}) 연령대 주요 사망원인 TOP 5\n`;
        topCauses.forEach((c, i) => {
          context += `${i + 1}. ${c.icdCategory}: ${c.rate}/10만명 (${c.cause})\n`;
        });
      }
    }
    context += `\n### 직업별 상해 위험도\n`;
    context += JSON.stringify(statistics.occupational_risks.data, null, 2);
    context += `\n### 가족력 리스크 가중치\n`;
    context += JSON.stringify(statistics.family_risk_factors.data, null, 2);
    context += `\n### 부양가족 사망리스크 가중치\n`;
    context += JSON.stringify(statistics.dependency_factors.data, null, 2);
    context += `\n### 고용형태별 안정성\n`;
    context += JSON.stringify(statistics.employment_stability.data, null, 2);
    context += `\n### 노후준비 현황\n`;
    context += JSON.stringify(statistics.retirement_readiness.data, null, 2);
  }

  if (stage >= 4) {
    context += `\n\n## 실제 상품 데이터 (상품 추천 시 이 데이터를 사용하세요)\n`;
    for (const product of products.products) {
      context += `\n### ${product.name} (${product.id})\n`;
      context += `- 카테고리: ${product.category}\n`;
      context += `- 보장 리스크: ${product.risk_coverage.join(', ')}\n`;
      context += `- 가입 조건: ${JSON.stringify(product.enrollment_conditions)}\n`;
      context += `- 보장 내용: ${JSON.stringify(product.coverage_details)}\n`;
      if (product.premiums.sample_male) {
        context += `- 샘플 보험료(남/월): ${JSON.stringify(product.premiums.sample_male)}\n`;
      }
      if (product.premiums.sample_female) {
        context += `- 샘플 보험료(여/월): ${JSON.stringify(product.premiums.sample_female)}\n`;
      }
      context += `- ⚠ 위 보험료는 20/30/40/50/60세 기준에만 유효합니다. 중간 나이의 보험료를 보간/추정하지 마세요.\n`;
      if (product.premiums.note) {
        context += `- 보험료 참고: ${product.premiums.note}\n`;
      }
      context += `- 특징: ${product.key_features.join(', ')}\n`;
    }
    context += `\n### 리스크-상품 매핑\n`;
    context += JSON.stringify(products.risk_product_mapping, null, 2);
  }

  return context;
}

// 질문 유형에 따라 우선 검색할 doc_type 결정
// 면책·약관 세부 조건 → 약관 / 보험료·보장금액 → 상품요약서 / 나머지 → 제한 없음
function inferDocTypes(query: string): string[] | undefined {
  const clauseKeywords = ['면책', '면책기간', '제외', '약관', '특약', '지급 제한', '청약철회', '고지의무'];
  const summaryKeywords = ['보험료', '얼마', '월 납입', '보장 금액', '진단금', '사망보험금'];
  if (clauseKeywords.some(k => query.includes(k))) return ['약관', '사업방법서'];
  if (summaryKeywords.some(k => query.includes(k))) return ['상품요약서'];
  return undefined; // 필터 없이 전체 검색
}

export async function POST(request: NextRequest) {
  try {
    const { messages, stage = 1 } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // 가드레일 ①: 범위 밖 요청 사전 차단
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
    if (lastUserMsg) {
      const scopeCheck = checkScope(lastUserMsg.content);
      if (scopeCheck.outOfScope) {
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(scopeCheck.message!));
            controller.close();
          },
        });
        return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    }

    // Fix 2: 정보 수집 체크리스트 검증 — stage 2 이상 요청 시 필수 필드 확인
    let effectiveStage = stage;
    let checklistWarning = '';
    if (stage >= 2) {
      const validation = validateStage1Completeness(messages);
      if (!validation.complete) {
        effectiveStage = 1;
        checklistWarning = `\n\n## ⚠ 미수집 정보 경고\n다음 항목이 아직 수집되지 않았습니다: ${validation.missingFields.join(', ')}\nSTAGE 2로 넘어가기 전에 반드시 이 정보를 먼저 수집하세요. 현재 STAGE 1을 유지합니다.\n`;
      }
    }

    // 가드레일 ⑤: 적합성 원칙 검증 (Stage 5 상품 매칭 시)
    let suitabilityWarning = '';
    if (effectiveStage >= 5) {
      const allText = messages.map((m: any) => m.content ?? '').join('\n');
      // 대화에서 나이, 소득, 예산 추출
      const ageMatch = allText.match(/(\d{2,3})\s*(?:세|살)/);
      const budgetMatch = allText.match(/(?:예산|보험료)[^\d]*(\d+)\s*만\s*원/);
      const incomePatterns: [RegExp, string][] = [
        [/200만원?\s*미만/, '200만원_미만'],
        [/200\s*[~\-–]\s*500/, '200~500만원'],
        [/500\s*[~\-–]\s*800/, '500~800만원'],
        [/800만원?\s*이상/, '800만원_이상'],
      ];
      let monthlyIncome: string | undefined;
      for (const [p, v] of incomePatterns) {
        if (p.test(allText)) { monthlyIncome = v; break; }
      }
      const conditionMatch = allText.match(/현재.*?(없음|경증|중증|암[_\s]?이력)/);

      const suitability = checkSuitability({
        age: ageMatch ? parseInt(ageMatch[1]) : undefined,
        monthlyIncome,
        monthlyBudget: budgetMatch ? parseInt(budgetMatch[1]) * 10000 : undefined,
        currentCondition: conditionMatch?.[1]?.replace(/\s/g, '_'),
      });

      if (!suitability.suitable) {
        suitabilityWarning = `\n\n## 적합성 검토 결과\n${suitability.warnings.map(w => `- ${w}`).join('\n')}\n`;
      }
    }

    // 대화에서 나이/성별 추출하여 buildDataContext에 전달
    const allTextForContext = messages.map((m: any) => m.content ?? '').join('\n');
    const ageMatchCtx = allTextForContext.match(/(\d{2,3})\s*(?:세|살)/);
    const genderMatchCtx = allTextForContext.match(/남성|남자/) ? 'male' as const : allTextForContext.match(/여성|여자/) ? 'female' as const : undefined;
    const customerAge = ageMatchCtx ? parseInt(ageMatchCtx[1]) : undefined;

    const dataContext = buildDataContext(effectiveStage, customerAge, genderMatchCtx);

    // RAG: STAGE 5 이상 (상품 매칭, Q&A, 설계 조정) 에서만 약관 검색
    let ragContext = '';

    const isRealOpenAIKey = process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-or-');
    if (effectiveStage >= 5 && isRealOpenAIKey) {
      const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user');
      if (lastUserMessage) {
        const mentionedProductIds = extractMentionedProductIds(messages);
        const docTypes = inferDocTypes(lastUserMessage.content);
        const chunks = await searchRelevantChunks(
          lastUserMessage.content,
          mentionedProductIds,
          4,
          docTypes
        );
        ragContext = formatRagContext(chunks);
      }
    }

    const systemWithData = SYSTEM_PROMPT + '\n\n' + dataContext + ragContext + checklistWarning + suitabilityWarning;
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Fix 1: stage 2/3에서 tool_choice 강제 지정 (단, 이미 해당 Tool 결과가 대화에 있으면 강제하지 않음)
    const allMsgText = messages.map((m: any) => m.content ?? '').join('\n');
    const hasRiskMap = messages.some((m: any) => m.visualization?.type === 'risk_map') || allMsgText.includes('risk_map');
    const hasGapAnalysis = messages.some((m: any) => m.visualization?.type === 'gap_analysis') || allMsgText.includes('gap_analysis');

    // Stage 자동 승격: risk_map이 이미 있는데 stage=2이면 → 3으로 올림
    if (effectiveStage === 2 && hasRiskMap && !hasGapAnalysis) {
      effectiveStage = 3;
    }

    let toolChoice: any = 'auto';
    if (effectiveStage === 2 && !hasRiskMap) {
      toolChoice = { type: 'function', function: { name: 'calculate_risk_scores' } };
    } else if (effectiveStage === 3 && !hasGapAnalysis) {
      toolChoice = { type: 'function', function: { name: 'calculate_gap_analysis' } };
    }

    // 1차 호출: 툴 콜 감지 (non-streaming)
    const firstResponse = await client.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      max_tokens: 2000,
      stream: false,
      tools: [RISK_TOOL, GAP_TOOL],
      tool_choice: toolChoice,
      messages: [
        { role: 'system', content: systemWithData },
        ...formattedMessages,
      ],
    });

    const choice = firstResponse.choices[0];
    const encoder = new TextEncoder();

    // 툴 콜이 발생한 경우 (finish_reason이 모델마다 다를 수 있으므로 tool_calls 존재 여부로 판단)
    if (choice.message.tool_calls?.length) {
      const toolCall = choice.message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      let toolResult: object;
      if (toolCall.function.name === 'calculate_gap_analysis') {
        toolResult = calculateGapAnalysis(args as GapInput);
      } else {
        toolResult = calculateRiskScores(args as RiskInput);
      }

      // 2차 호출: 툴 결과 포함해서 응답
      const stream = await client.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        max_tokens: 2000,
        stream: true,
        messages: [
          { role: 'system', content: systemWithData },
          ...formattedMessages,
          choice.message,
          { role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(toolResult) },
        ],
      });

      // Fix 3: 전체 버퍼링 후 통합 가드레일 적용
      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk.choices[0]?.delta?.content ?? '';
      }
      const guardrailResult = applyGuardrails(fullContent, effectiveStage, lastUserMsg?.content);
      fullContent = guardrailResult.text;

      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(fullContent));
          controller.close();
        },
      });
      return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }

    // 툴 콜 없는 경우: 통합 가드레일 적용 후 반환
    const guardrailResult2 = applyGuardrails(choice.message.content ?? '', effectiveStage, lastUserMsg?.content);
    let content = guardrailResult2.text;
    if (!content.trim()) {
      content = '죄송합니다, 응답을 생성하지 못했습니다. 다시 한번 말씀해 주시겠어요?';
    }
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(content));
        controller.close();
      },
    });
    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (error: any) {
    console.error('Error in chat API:', error);

    if (error?.status === 401) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    if (error?.status === 429) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}