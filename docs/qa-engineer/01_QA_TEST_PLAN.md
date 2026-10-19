# [AgentLens] 비동기 LLM ReAct 플래너, 스트리밍 완료 후 인용 출처 확정 방출, Scoped 단일 기사 고정 및 완료 조건 가드 (v0.3.1) 통합 QA 테스트 계획서 (QA Test Plan)

- **작성일자**: 2026-10-19
- **작성자**: 품질 보증 엔지니어 (`qa-engineer`)
- **문서 버전**: v0.3.1 (비동기 LLM ReAct 플래너 `_plan_react_action`, 스트리밍 전 `"관련 뉴스 5건 관찰 완료"` 및 선행 `sources` 5건 방출 제거, 스트리밍 완료 후 실제 인용된 출처만 `_filter_cited_sources`로 확정 방출, Scoped 단일 기사 고정 [`primary_count=1, supplementary_count=0`], 프론트엔드 `message.status === 'completed'` 조건 강화, 백엔드 160건 & 프론트엔드 240건 총 400건 자동화 테스트 전수 검증)
- **상태**: Approved
- **선행 산출물 및 기준 문서**:
  - 제품 요구사항 명세서: [`01_PRD.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/01_PRD.md) (ReAct 자율 도구 호출, Scoped 단일 기사 그라운딩, `REQ-CHAT-011`, `REQ-CHAT-012`, `REQ-LLM-002`, `REQ-UI-008`, `REQ-CLAUDE-001`)
  - 비즈니스 정책 및 엣지 케이스: [`03_POLICIES_AND_EDGES.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/03_POLICIES_AND_EDGES.md) (`POL-LLM-006`: Production Zero-Mock Fail-Fast Policy, `POL-RAG-001`: Dynamic Keyword Relevance Ranking, `POL-REACT-001`: ReAct Autonomous Tool Execution & Post-Stream Cited Source Filtering)
  - 상세 기능 정의서:
    - [`05_AI_CHAT_SPECIFICATION.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/fsd/05_AI_CHAT_SPECIFICATION.md) (`FUNC-CHAT-001`: 글로벌 ReAct 자율 지식 검색 챗, `FUNC-CHAT-002`: Scoped 포커스 단일 기사 질의, `FUNC-CHAT-013`: Claude 3-Tier 멀티모델 선택기, `FUNC-CHAT-014`: 듀얼 모델 셀렉터)
  - 시스템 설계서 & OpenAPI: [`01_SYSTEM_DESIGN.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/system-designer/01_SYSTEM_DESIGN.md), [`02_OPENAPI_SPEC.yaml`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/system-designer/02_OPENAPI_SPEC.yaml)
  - 데이터 계약 및 MSW 명세서: [`01_CONTRACT_AND_MSW_SPEC.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md)
  - 5-Pillar 코드 품질 감사 보고서:
    - 백엔드: [`docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md) (APPROVED)
    - 프론트엔드: [`docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md) (APPROVED)

---

## 1. 테스트 범위 및 환경 (Test Scope & Environment)

### 1.1 테스트 대상 (Test Scope)
기획 요구사항(`01_PRD.md`), 상세 기능정의서(FSD 01~06), 그리고 이번 수정사항(비동기 LLM ReAct 플래너 `_plan_react_action`, 스트리밍 전 `"관련 뉴스 5건 관찰 완료"` 및 선행 `sources` 5건 방출 제거, 스트리밍 완료 후 실제 인용된 출처만 `_filter_cited_sources`로 확정 방출, Scoped 단일 기사 고정, 프론트엔드 `status === 'completed'` 조건 강화)에 따른 핵심 검증 항목:

1. **FastAPI `ASGITransport` 기반 4대 SSE 스트리밍 시나리오 실증 검증 (`ChatService._plan_react_action`, `_filter_cited_sources`, `stream_chat`, `query_chat`)**:
   - **시나리오 1 (Global 일상 인사/대화: `"안녕 반가워"`, `"오늘 날씨 어때"`)**: `thinking` $\rightarrow$ `synthesizing` (`"✍️ 도구 호출 없이 직접 답변 생성 중..."`) $\rightarrow$ `token` $\rightarrow$ `done` 순서로 방출되며, `event: sources`가 미방출되고 `sources_count=0, primary_count=0, supplementary_count=0`인지 검증.
   - **시나리오 2 (Global 메타 불만 질문: `"인사했는데 왜 뉴스 5개를 찾아?"`)**: 비동기 `_plan_react_action`에서 `action == "none"`으로 정확히 판정되어 검색 도구를 호출하지 않고 `event: sources` 미방출(`sources_count=0`)되는지 검증.
   - **시나리오 3 (Global 기술 질문: `"Claude 3.7 Sonnet"`)**: 스트리밍 도중에는 `"관련 뉴스 5건 관찰 완료"`(`observing`)나 선행 `event: sources` 5건이 먼저 방출되지 않고(`thinking` $\rightarrow$ `tool_calling` $\rightarrow$ `synthesizing` $\rightarrow$ `token`), `token` 스트리밍이 모두 완료된 후 실제 답변에 인용된 출처만 `_filter_cited_sources`로 필터링되어 `event: sources` $\rightarrow$ `event: done` 순서로 확정 방출되는지 검증.
   - **시나리오 4 (Scoped 특정 뉴스 질문: `scope="scoped", source_id=1`)**: 코퍼스 검색이나 외부 보충 검색(`evaluating_sufficiency`, `agentic_searching`) 없이 해당 뉴스 1건만 `extracting_source` $\rightarrow$ `synthesizing` $\rightarrow$ `sources` (`primary_count=1, supplementary_count=0`)로 고정 반환되는지 검증.
2. **프론트엔드 `status === 'completed'` 조건 강화 및 Zero-DOM 가드 (`ChatMessageItem.tsx`, `ChatWorkspace.tsx`)**:
   - `ChatMessageItem.tsx`에서 `message.status === 'completed' && Boolean(message.content && message.content.trim().length > 0) && message.sources && message.sources.length > 0` 조건을 통해 스트리밍 진행 중(`status === 'streaming'`)에는 `원문 N건` 뱃지가 절대 조기 노출되지 않고 스트리밍 완료 후에만 확정된 인용 출처 수로 표시되는지 검증.
   - `primaryCount === 0 && supplementaryCount === 0`일 때 `null`을 반환하여 불필요한 빈 출처 뱃지 컨테이너가 렌더링되지 않는지 검증.
3. **전체 자동화 회귀 테스트 전원 Green 통과**:
   - 백엔드 핵심 테스트(`tests/test_agentic_workflow.py`, `tests/test_chat.py` 50건) 및 전체 스위트(160건)와 프론트엔드 전체 테스트(`npx vitest run` 240건) 총 400건 100% 통과 및 `npx tsc --noEmit` 0 에러 검증.

### 1.2 테스트 환경 (Test Environment)
- **API 서버**: FastAPI `ASGITransport` 및 로컬 인스턴스 (`http://localhost:8000`), Python 3.11.9, FastAPI 0.115.6, SQLite 3.43+ WAL (`PRAGMA foreign_keys = ON;`)
- **웹 클라이언트**: Next.js 16.3.4 (App Router, Turbopack, React 19.2.8), Tailwind CSS v4, MSW v2.15.0
- **검증 뷰포트**: 모바일(375px/390px), 태블릿(768px), 데스크톱(1280px/1440px)

---

## 2. 테스트 시나리오 매트릭스 (Test Matrix)

| 케이스 ID | 테스트 구분 | 검증 시나리오 | 사전 조건 및 입력 데이터 | 기대 결과 (Pass Criteria) |
| :--- | :---: | :--- | :--- | :--- |
| `TC-REACT-001` | E2E/ReAct | **[시나리오 1] Global 일상 인사/대화 (`"안녕 반가워"`, `"오늘 날씨 어때"`) 도구 생략 및 무출처 직답** | `POST /api/chat/stream`<br>`scope="global", question="안녕 반가워"` / `"오늘 날씨 어때"` | • `thinking` $\rightarrow$ `synthesizing` (`"✍️ 도구 호출 없이 직접 답변 생성 중..."`) $\rightarrow$ `token` $\rightarrow$ `done`<br>• `event: sources` 미방출, `sources_count: 0, primary_count: 0, supplementary_count: 0` |
| `TC-REACT-002` | E2E/ReAct | **[시나리오 2] Global 메타 불만 질문 (`"인사했는데 왜 뉴스 5개를 찾아?"`) 검색 차단** | `POST /api/chat/stream`<br>`scope="global", question="인사했는데 왜 뉴스 5개를 찾아?"` | • `_plan_react_action`에서 `action == "none"` 판정<br>• `event: sources` 미방출 및 `sources_count: 0` 확인 |
| `TC-REACT-003` | E2E/ReAct | **[시나리오 3] Global 기술 질문 (`"Claude 3.7 Sonnet"`) 스트리밍 완료 후 인용 출처만 확정 방출** | `POST /api/chat/stream`<br>`scope="global", question="Claude 3.7 Sonnet"` | • 스트리밍 전 `"관련 뉴스 5건 관찰 완료"` 및 선행 `sources` 5건 미방출<br>• `thinking` $\rightarrow$ `tool_calling` $\rightarrow$ `synthesizing` $\rightarrow$ `token` 완료 후 `_filter_cited_sources`로 실제 인용된 출처만 `event: sources` $\rightarrow$ `done` 방출 |
| `TC-SCOPED-004` | E2E/Scoped | **[시나리오 4] Scoped 특정 뉴스 질문 (`scope="scoped", source_id=1`) 단일 기사 고정** | `POST /api/chat/stream`<br>`scope="scoped", source_id=1` | • 코퍼스/외부 검색 없이 `extracting_source` $\rightarrow$ `synthesizing`만 수행<br>• 해당 뉴스 1건만 `primary_count: 1, supplementary_count: 0`으로 고정 반환 |
| `TC-FE-REACT-001`| UI/스트리밍 | **프론트엔드 `status === 'completed'` 조건 강화 및 0건 `null` 반환** | `ChatMessageItem` (`status === 'streaming'` vs `'completed'`) | • `status === 'streaming'` 중에는 `sources`나 `content`가 있어도 `원문 N건` 뱃지 미노출<br>• `status === 'completed'` 완료 시점에만 인용 출처 뱃지 렌더링, 0건 시 `null` 반환 |
| `TC-DYN-RAG-001`| E2E/데이터 | **질문별 동적 기사 검색 및 고정 5개 슬라이스 배제** | 질문: `'Claude'`, `'MCP'`, `'Benchmark'` 각각 질의 | • 각 질문별로 상위 1순위 소스 기사 ID가 서로 다른 고유 기사로 동적 인출됨 |
| `TC-GEMINI-001` | API/라우팅 | **`_call_gemini` 메소드 복원 및 사일런트 다운그레이드 배제** | `_call_gemini` 호출 및 실패 시나리오 | • 지정 모델 정직 호출 및 실패 시 사일런트 폴백 없이 HTTP 502 Fail-Fast |
| `TC-PRODMOCK-001`| 아키텍처/보안| **프로덕션 `mock_provider.py` 영구 퇴역 및 Zero-Mock 거버넌스** | 프로덕션 코드 임포트 및 라이브 키 부재 상태 질의 | • 프로덕션 임포트 시 `ImportError`, 가용 키 부재 시 HTTP 503 fail-fast |
| `TC-REG-BE-001` | 통합 회귀 | **백엔드 핵심 테스트(50건) 및 전체 테스트(160건) 전원 Green 통과** | `../.venv/bin/pytest tests/test_agentic_workflow.py tests/test_chat.py` 및 전체 실행 | • 16개 테스트 파일, 160건 100% 통과 (0 Failed, 0 Error) |
| `TC-REG-FE-001` | 통합 회귀 | **프론트엔드 전체 테스트(240건) 전원 Green 통과** | `npx vitest run` 전체 스위트 실행 | • 24개 테스트 파일, 240건 100% 통과 (0 Failed, 0 Flaky) |
| `TC-REG-TYPE-001`| 정적 검증 | **프론트엔드 TypeScript 정적 타입 검증** | `npx tsc --noEmit` 실행 | • 타입 에러 0건, Exit Code 0 |

---

## 3. 테스트 실행 지침 및 하드 게이트 (Execution Guidelines & Quality Gates)

1. **자동화 검증 스위트 실행 파이프라인**:
   - 백엔드 타겟 스위트: `cd backend && ../.venv/bin/pytest tests/test_agentic_workflow.py tests/test_chat.py -v` (**50개 테스트 전원 Green**)
   - 백엔드 pytest 전체 회귀 스위트: `cd backend && ../.venv/bin/pytest -v` (**160개 테스트 전원 Green**)
   - 프론트엔드 vitest 전체 회귀 스위트: `cd frontend && npx vitest run` (**240개 테스트 전원 Green**)
   - 프론트엔드 정적 타입 검증: `cd frontend && npx tsc --noEmit` (**0 에러, Exit Code 0**)
   - FastAPI `ASGITransport` 기반 4대 SSE 스트리밍 실증 검증: `../.venv/bin/python scratch/verify_4_scenarios.py` (**4대 시나리오 전원 PASS**)
2. **하드 퀄리티 게이트 통과 기준 (Hard Quality Gate Criteria)**:
   - 자동화 테스트 통과율: **100% (Pass Rate = 100%, 400/400건)**
   - Global 일상 인사/대화 및 메타 불만 질문 도구 오호출 / `sources` 오방출: **0건 (`sources_count=0, primary_count=0, supplementary_count=0`)**
   - Global 기술 질문 스트리밍 전 `"관련 뉴스 5건 관찰 완료"` 및 선행 `sources` 방출: **0건 (반드시 `token` 스트리밍 종료 후 실제 인용된 출처만 `event: sources`로 방출)**
   - Scoped 모드 단일 기사 고정 (`primary_count=1, supplementary_count=0`, 외부 보충 검색 0건): **100%**
   - 프론트엔드 `status === 'completed'` 전 조기 출처 뱃지 노출: **0건**
   - Blocker / Critical / 회귀 결함 수: **0건**
3. **최종 보고서 연계**:
   - 본 테스트 계획서에 따른 전수 검증 결과는 [`docs/qa-engineer/02_QA_TEST_REPORT.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/qa-engineer/02_QA_TEST_REPORT.md)에 투명하게 기록하고 최종 출시 승인(`RELEASE_APPROVED`)을 판정합니다.
