@AGENTS.md

# TrackB 프로젝트 현황 (2026-04-06)

## 프로젝트 개요

KB라이프 보험 상품 데이터를 수집·구조화하여 RAG 기반 AI 보험 상담 Agent를 만드는 프로젝트.

**API 키**: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` 환경변수에 설정

## 완료된 작업

### 데이터 파이프라인
- KB라이프 상품 약관 스크래핑 완료
- 약관 벡터 임베딩: OpenAI text-embedding-3-small, 4,479개 청크
- 통계청 데이터 JSON 변환 완료

### Next.js 에이전트 앱
- 9단계 대화 흐름 구현
- LLM: google/gemini-2.0-flash-001 (OpenRouter 경유)
- 시각화 컴포넌트 4개 (RiskMap, GapAnalysis, ProductMatch, FinalReport)
- JSON 데이터 RAG (products.json + statistics.json)
- 약관 RAG (chunks_text.json + embeddings.bin, 코사인 유사도)
- Vercel 배포: https://insurance-agent-final.vercel.app
