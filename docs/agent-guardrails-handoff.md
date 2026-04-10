# feature/agent-guardrails 브랜치 인수 가이드

## 머지 방법

```bash
git checkout master
git pull origin master
git merge feature/agent-guardrails
git push origin master
```

충돌 없이 Fast-forward 될 가능성 높음. 만약 UI 작업이 아래 파일을 건드렸다면 충돌 해결 필요.

## 변경 파일 (7개)

| 파일 | 충돌 가능성 | 변경 내용 |
|---|---|---|
| `app/api/chat/route.ts` | ⚠️ 높음 | buildDataContext에 나이/성별 파라미터 추가, 보험료 면책 문구, Stage 2→3 자동 승격 |
| `lib/parseResponse.ts` | ⚠️ 중간 | STAGE/VISUALIZATION 마커 정규화 강화 (공백, HTML 감싸기, 누락된 닫는 태그 처리) |
| `lib/complianceFilter.ts` | 낮음 | 보험료 나이 검증 (20/30/40/50/60세 외 보간 감지 + 면책 자동 추가) |
| `lib/evaluator.ts` | 낮음 | eval 규칙 3개 추가 (보험료 보간, 반복 루프, 빈 응답) |
| `lib/riskCalculator.ts` | 낮음 | dead_risk.json/dead_reason.json/economy.json 통합 |
| `lib/system-prompt.ts` | 낮음 | 보험료 보간 금지 제약사항 추가 |
| `scripts/run-eval.ts` | 없음 | 신규 파일 — CLI eval 러너 |

## 주요 변경 요약

### 1. 보험료 보간 방지
- LLM이 20/30/40/50/60세가 아닌 나이의 보험료를 추정하지 못하도록 차단
- 시스템 프롬프트 + 컴플라이언스 필터 + 데이터 컨텍스트 면책 3중 방어

### 2. 파서 강화 (parseResponse.ts)
- `### VISUALIZATION ###` (공백 포함) 처리
- `<details><summary>` HTML 감싸기 제거
- `###STAGE:5` (닫는 ### 누락) 처리
- JSON 괄호 자동 보정

### 3. 리스크 계산 정밀화
- dead_risk.json: 1세 단위 정확한 사망확률 (기존: 10년 단위 근사)
- dead_reason.json: 5년 단위 ICD 카테고리별 사망률
- economy.json: 고용형태별 실제 중위 임금

### 4. Stage 2→3 자동 전환
- route.ts에서 risk_map이 이미 있는데 stage=2로 요청 오면 자동으로 3으로 올려서 gap 분석 툴 강제 호출

## eval 실행

```bash
npx tsx scripts/run-eval.ts
```

data/logs/*.json 전체 세션을 평가하고 점수를 출력합니다.
