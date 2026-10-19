# [AgentLens] ReAct 아키텍처 전환(Global 자율 도구 호출), Scoped 단일 기사 고정 및 스트리밍 뱃지 정직성 (v0.3.0) 통합 QA 테스트 계획서 (QA Test Plan)

- **작성일자**: 2026-10-19
- **작성자**: 품질 보증 엔지니어 (`qa-engineer`)
- **문서 버전**: v0.3.0 (Global 모드 ReAct 아키텍처 전환 [`thinking` $\rightarrow$ `tool_calling` $\rightarrow$ `observing`], 일상 인사말 검색 도구 생략 및 `sources` 미방출, Scoped 모드 단일 기사 고정 [`primary_count=1, supplementary_count=0`, `evaluating_sufficiency` / `agentic_searching` 배제], 프론트엔드 토큰 스트리밍 개시 전 조기 `원문 N건` 뱃지 노출 차단 및 0건 `null` 반환, 백엔드 159건 & 프론트엔드 238건 총 397건 자동화 테스트 전수 검증)
- **상태**: Approved
- **선행 산출물 및 기준 문서**:
  - 제품 요구사항 명세서: [`01_PRD.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/01_PRD.md) (v0.3.0: ReAct 자율 도구 호출, Scoped 단일 기사 그라운딩, `REQ-CHAT-011`, `REQ-CHAT-012`, `REQ-LLM-002`, `REQ-UI-008`, `REQ-CLAUDE-001`)
  - 비즈니스 정책 및 엣지 케이스: [`03_POLICIES_AND_EDGES.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/03_POLICIES_AND_EDGES.md) (`POL-LLM-006`: Production Zero-Mock Fail-Fast Policy, `POL-RAG-001`: Dynamic Keyword Relevance Ranking, `POL-REACT-001`: ReAct Autonomous Tool Execution & Scoped Single-Article Lock)
  - 상세 기능 정의서:
    - [`05_AI_CHAT_SPECIFICATION.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/fsd/05_AI_CHAT_SPECIFICATION.md) (`FUNC-CHAT-001`: 글로벌 ReAct 자율 지식 검색 챗, `FUNC-CHAT-002`: Scoped 포커스 단일 기사 질의, `FUNC-CHAT-013`: Claude 3-Tier 멀티모델 선택기, `FUNC-CHAT-014`: 듀얼 모델 셀렉터)
  - 시스템 설계서 & OpenAPI: [`01_SYSTEM_DESIGN.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/system-designer/01_SYSTEM_DESIGN.md) (v0.3.0), [`02_OPENAPI_SPEC.yaml`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/system-designer/02_OPENAPI_SPEC.yaml)
  - 데이터 계약 및 MSW 명세서: [`01_CONTRACT_AND_MSW_SPEC.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md) (v0.3.0 Contract Lock)
  - 5-Pillar 코드 품질 감사 보고서:
    - 백엔드: [`docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md) (v0.3.0 APPROVED)
    - 프론트엔드: [`docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md) (v0.3.0 APPROVED)

---

## 1. 테스트 범위 및 환경 (Test Scope & Environment)

### 1.1 테스트 대상 (Test Scope)
기획 요구사항(`01_PRD.md`), 상세 기능정의서(FSD 01~06), 그리고 v0.3.0 ReAct 아키텍처 전환 및 Scoped 단일 기사 고정 규약에 따른 핵심 검증 항목:

1. **Global 모드 ReAct 자율 도구 호출 아키텍처 전환 (`ChatService._plan_react_action`, `stream_chat`, `query_chat`)**:
   - **시나리오 1 (Global 일상 인사말)**: `scope="global", question="안녕"` (또는 `"안녕하세요"`, `"반가워"` 등) 입력 시 `thinking` 상태 후 불필요한 `tool_calling` 및 `observing` 단계와 `event: sources`를 완전히 생략하고, `primary_count=0, supplementary_count=0`으로 즉시 답변 토큰(`event: token`)을 스트리밍하는지 검증.
   - **시나리오 2 (Global 기술 질문)**: `scope="global", question="Claude 3.7 Sonnet"` 입력 시 `thinking` (25%) $\rightarrow$ `tool_calling` (`search_news_corpus('Claude 3.7 Sonnet')`, 55%) $\rightarrow$ `observing` (80%) $\rightarrow$ `event: sources` 방출 $\rightarrow$ `event: token` $\rightarrow$ `event: done` 전체 ReAct 라이프사이클이 정확히 동작하는지 검증.
2. **Scoped 모드 단일 기사 고정 및 불필요한 외부 검색 배제 (`FUNC-CHAT-002`, 시나리오 3)**:
   - **시나리오 3 (Scoped 특정 뉴스 질문)**: `scope="scoped", source_id=<유효ID>` 질의 시 기존의 `evaluating_sufficiency` 및 `agentic_searching` 단계 없이 `extracting_source` (30%) $\rightarrow$ `synthesizing` (85%) 단계만 실행되며, 지정된 1개 기사만 `primary_count=1, supplementary_count=0`으로 엄격히 고정 반환되는지 검증.
3. **프론트엔드 스트리밍 뱃지 정직성 및 Zero-DOM 가드 (`ChatMessageItem.tsx`, `types/chat.ts`)**:
   - ReAct 탐색 단계(`status` / 조기 `sources` 수신) 중 실제 답변 텍스트(`message.content.trim().length > 0`) 스트리밍이 개시되기 전에는 `원문 N건` 뱃지가 조기 노출되지 않도록 차단하는지 검증.
   - `primaryCount === 0 && supplementaryCount === 0`일 때 `null`을 반환하여 일상 인사말 등에서 불필요한 빈 출처 뱃지 컨테이너가 렌더링되지 않는지 검증.
   - `ChatStatusStep` (`thinking`, `tool_calling`, `observing` 포함) 및 `ChatStatusPayload` (`query`, `sources_found`) 계약 동기화 검증.
4. **질문별 동적 기사 검색 및 한국어 불용어 정제 보존 (v0.2.2 회귀 방어)**:
   - `SqliteFtsRetriever.extract_keywords` 기반 한국어 조사/불용어 분리 및 FTS5/SQL LIKE 가중치 랭킹 무결성 유지.
   - Google Gemini `_call_gemini` 정직 라우팅 및 사일런트 폴백 배제(Fail-Fast), 프로덕션 Zero-Mock 거버넌스 유지.
5. **전체 자동화 회귀 테스트 전원 Green 통과**:
   - 백엔드 pytest 159건 및 프론트엔드 vitest 238건 (총 397건) 100% Green 통과 및 `npx tsc --noEmit` 0 에러 검증.

### 1.2 테스트 환경 (Test Environment)
- **API 서버**: FastAPI `ASGITransport` 및 로컬 인스턴스 (`http://localhost:8000`), Python 3.11.9, FastAPI 0.115.6, SQLite 3.43+ WAL (`PRAGMA foreign_keys = ON;`)
- **웹 클라이언트**: Next.js 16.3.4 (App Router, Turbopack, React 19.2.8), Tailwind CSS v4, MSW v2.15.0
- **검증 뷰포트**: 모바일(375px/390px), 태블릿(768px), 데스크톱(1280px/1440px)

---

## 2. 테스트 시나리오 매트릭스 (Test Matrix)

| 케이스 ID | 테스트 구분 | 검증 시나리오 | 사전 조건 및 입력 데이터 | 기대 결과 (Pass Criteria) |
| :--- | :---: | :--- | :--- | :--- |
| `TC-REACT-001` | E2E/ReAct | **[시나리오 1] Global 일상 인사말 검색 도구 생략 및 무출처 직답** | `POST /api/chat/stream`<br>`scope="global", question="안녕"` | • `status: thinking` 방출 후 `tool_calling` 및 `observing` 미방출<br>• `event: sources` 미방출<br>• `done` 이벤트 내 `primary_count: 0, supplementary_count: 0` 확인 |
| `TC-REACT-002` | E2E/ReAct | **[시나리오 2] Global 기술 질문 ReAct 자율 도구 호출 라이프사이클** | `POST /api/chat/stream`<br>`scope="global", question="Claude 3.7 Sonnet"` | • `thinking`(25%) $\rightarrow$ `tool_calling`(`search_news_corpus`, 55%) $\rightarrow$ `observing`(80%) 순차 방출<br>• `event: sources` 정상 방출 및 관련 뉴스 매칭 확인 |
| `TC-SCOPED-003` | E2E/Scoped | **[시나리오 3] Scoped 특정 뉴스 질문 단일 기사 고정 반환** | `POST /api/chat/stream`<br>`scope="scoped", source_id=<유효ID>` | • `evaluating_sufficiency` / `agentic_searching` 미방출 (`extracting_source` $\rightarrow$ `synthesizing`만 수행)<br>• 지정된 단일 기사 1건만 `primary_count: 1, supplementary_count: 0`으로 고정 반환 |
| `TC-FE-REACT-001`| UI/스트리밍 | **토큰 스트리밍 개시 전 조기 `원문 N건` 뱃지 노출 차단 및 0건 `null` 반환** | `ChatMessageItem` 스트리밍 상태 (`content === ""`) 및 0건 소스 | • `message.content.trim().length > 0` 전까지 `원문 N건` 뱃지 미노출<br>• `primaryCount === 0 && supplementaryCount === 0` 시 `null` 반환 (빈 DOM 0건) |
| `TC-DYN-RAG-001`| E2E/데이터 | **질문별 동적 기사 검색 및 고정 5개 슬라이스 배제** | 질문: `'Claude'`, `'MCP'`, `'Benchmark'` 각각 질의 | • 각 질문별로 상위 1순위 소스 기사 ID가 서로 다른 고유 기사로 동적 인출됨 |
| `TC-DYN-RAG-002`| 알고리즘 | **대화형 한국어 불용어/조사 분리 및 키워드 추출** | 입력: `"최신 Claude 관련 소식 알려줘"` | • 조사/종결어미 정제 후 핵심어(`Claude`) 추출 및 FTS5/LIKE 연동 |
| `TC-GEMINI-001` | API/라우팅 | **`_call_gemini` 메소드 복원 및 사일런트 다운그레이드 배제** | `_call_gemini` 호출 및 실패 시나리오 | • 지정 모델 정직 호출 및 실패 시 사일런트 폴백 없이 HTTP 502 Fail-Fast |
| `TC-SCOPED-001` | E2E 정상 | **포커스 기사 핸드오버 컨텍스트 인계 및 클로저 래그 해결** | 기사 카드에서 [Ask AI] 클릭 (`/chat?sourceId=102&q=...`) | • `activeSource` 및 `source_id: 102`, `scope: "scoped"` 누락 없이 즉시 전송 |
| `TC-PRODMOCK-001`| 아키텍처/보안| **프로덕션 `mock_provider.py` 영구 퇴역 및 Zero-Mock 거버넌스** | 프로덕션 코드 임포트 및 라이브 키 부재 상태 질의 | • 프로덕션 임포트 시 `ImportError`, 가용 키 부재 시 HTTP 503 fail-fast |
| `TC-REG-BE-001` | 통합 회귀 | **백엔드 전체 테스트 159건 전원 Green 통과** | `../.venv/bin/pytest -v` 전체 스위트 실행 | • 16개 테스트 파일, 159건 100% 통과 (0 Failed, 0 Error) |
| `TC-REG-FE-001` | 통합 회귀 | **프론트엔드 전체 테스트 238건 전원 Green 통과** | `npx vitest run` 전체 스위트 실행 | • 24개 테스트 파일, 238건 100% 통과 (0 Failed, 0 Flaky) |
| `TC-REG-TYPE-001`| 정적 검증 | **프론트엔드 TypeScript 정적 타입 검증** | `npx tsc --noEmit` 실행 | • 타입 에러 0건, Exit Code 0 |

---

## 3. 테스트 실행 지침 및 하드 게이트 (Execution Guidelines & Quality Gates)

1. **자동화 검증 스위트 실행 파이프라인**:
   - 백엔드 pytest 전체 회귀 스위트: `cd backend && ../.venv/bin/pytest -v` (**159개 테스트 전원 Green**)
   - 프론트엔드 vitest 전체 회귀 스위트: `cd frontend && npx vitest run` (**238개 테스트 전원 Green**)
   - 프론트엔드 정적 타입 검증: `cd frontend && npx tsc --noEmit` (**0 에러, Exit Code 0**)
   - FastAPI `ASGITransport` 기반 3대 ReAct & Scoped 실증 검증: `../.venv/bin/python scratch/verify_qa_v030.py` (**3대 시나리오 전원 PASS**)
2. **하드 퀄리티 게이트 통과 기준 (Hard Quality Gate Criteria)**:
   - 자동화 테스트 통과율: **100% (Pass Rate = 100%, 397/397건)**
   - Global 일상 인사말 도구 오호출 / `sources` 오방출: **0건 (`primary_count=0, supplementary_count=0`)**
   - Global 기술 질문 ReAct (`thinking` $\rightarrow$ `tool_calling` $\rightarrow$ `observing` $\rightarrow$ `sources`) 정합성: **100%**
   - Scoped 모드 단일 기사 고정 (`primary_count=1, supplementary_count=0`, 외부 보충 검색 0건): **100%**
   - 스트리밍 토큰 수신 전 조기 출처 뱃지 노출: **0건**
   - Blocker / Critical / 회귀 결함 수: **0건**
3. **최종 보고서 연계**:
   - 본 테스트 계획서에 따른 전수 검증 결과는 [`docs/qa-engineer/02_QA_TEST_REPORT.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/qa-engineer/02_QA_TEST_REPORT.md)에 투명하게 기록하고 최종 출시 승인(`RELEASE_APPROVED`)을 판정합니다.
