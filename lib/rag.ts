import { readFileSync } from 'fs';
import { join } from 'path';
import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

interface ChunkMeta {
  text: string;
  product_id: string;
  product_name: string;
  doc_type: string;
}

let chunksCache: ChunkMeta[] | null = null;
let embeddingsCache: Float32Array | null = null;
const DIMS = 1536;

function loadData() {
  if (!chunksCache || !embeddingsCache) {
    const textPath = join(process.cwd(), 'data', 'chunks_text.json');
    const embPath = join(process.cwd(), 'data', 'embeddings.bin');
    chunksCache = JSON.parse(readFileSync(textPath, 'utf-8'));
    const buf = readFileSync(embPath);
    embeddingsCache = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
  }
  return { chunks: chunksCache!, embeddings: embeddingsCache! };
}

function cosineSimilarity(a: Float32Array, offset: number, b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < DIMS; i++) {
    const ai = a[offset + i];
    const bi = b[i];
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

export interface RagChunk {
  text: string;
  productName: string;
  docType: string;
  productId: string;
}

export async function searchRelevantChunks(
  query: string,
  productIds?: string[],
  topK: number = 4,
  docTypes?: string[]
): Promise<RagChunk[]> {
  try {
    const openai = getOpenAI();
    const { chunks, embeddings } = loadData();

    const resp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryVec = resp.data[0].embedding;

    const scores: { idx: number; score: number }[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (productIds && productIds.length > 0 && !productIds.includes(chunk.product_id)) continue;
      if (docTypes && docTypes.length > 0 && !docTypes.includes(chunk.doc_type)) continue;
      const score = cosineSimilarity(embeddings, i * DIMS, queryVec);
      scores.push({ idx: i, score });
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topK).map(({ idx }) => ({
      text: chunks[idx].text,
      productName: chunks[idx].product_name,
      docType: chunks[idx].doc_type,
      productId: chunks[idx].product_id,
    }));
  } catch (error) {
    console.error('RAG 검색 오류:', error);
    return [];
  }
}

export function formatRagContext(chunks: RagChunk[]): string {
  if (chunks.length === 0) return '';

  let context = '\n\n## 약관 검색 결과 (고객 질문과 관련된 실제 약관 내용)\n';
  context += '아래 약관 내용을 참고하여 정확하게 답변하세요. 약관에 없는 내용은 추측하지 마세요.\n\n';

  for (const chunk of chunks) {
    context += `### [${chunk.productName} - ${chunk.docType}]\n`;
    context += chunk.text + '\n\n';
  }
  return context;
}

export function extractMentionedProductIds(messages: any[]): string[] {
  const productMap: Record<string, string> = {
    '착한암보험': 'KC_01', '암보험': 'KC_01', 'KC_01': 'KC_01',
    'e-건강보험': 'YG_01', '건강보험': 'YG_01', '일반심사': 'YG_01', 'YG_01': 'YG_01',
    '간편심사': 'YT_01', 'YT_01': 'YT_01',
    '정기보험': 'SR_01', '착한정기': 'SR_01', 'SR_01': 'SR_01',
    '연금보험': 'NP_01', '하이파이브': 'NP_01', 'NP_01': 'NP_01',
    '간병보험': 'GB_01', '간병': 'GB_01', '치매': 'GB_01', '장기요양': 'GB_01', '골든라이프': 'GB_01', 'GB_01': 'GB_01',
    '자녀보험': 'CH_01', '금쪽같은': 'CH_01', '어린이보험': 'CH_01', '태아': 'CH_01', 'CH_01': 'CH_01',
  };

  const mentioned = new Set<string>();
  const allText = messages.map((m: any) => m.content).join(' ');
  for (const [keyword, id] of Object.entries(productMap)) {
    if (allText.includes(keyword)) mentioned.add(id);
  }
  return Array.from(mentioned);
}
