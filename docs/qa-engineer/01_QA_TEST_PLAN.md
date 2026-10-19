# [AgentLens] AI 챗 동적 뉴스 검색 연동, Gemini 정직한 복원 및 고정 5개 슬라이스 제거 (v0.2.2) 통합 QA 테스트 계획서 (QA Test Plan)

- **작성일자**: 2026-10-19
- **작성자**: 품질 보증 엔지니어 (`qa-engineer`)
- **문서 버전**: v0.2.2 (AI 챗 동적 뉴스 검색 결함 해결 [BUG-RAG-002], SQLite FTS5 및 SQL LIKE 가중치 랭킹 고도화, 한국어 대화형 불용어 분리, 고정 5개 기사 슬라이스 제거, Google Gemini 연동 로직 `_call_gemini` 복원 및 사일런트 폴백 없는 정직한 라우팅, 백엔드 154건 & 프론트엔드 234건 총 388건 자동화 테스트 전수 검증)
- **상태**: Approved
- **선행 산출물 및 기준 문서**:
  - 제품 요구사항 명세서: [`01_PRD.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/01_PRD.md) (v0.2.0, v0.2.1 & v0.2.2: `REQ-CHAT-011`, `REQ-CHAT-012`, `REQ-LLM-002`, `REQ-UI-008`, `REQ-CLAUDE-001`)
  - 비즈니스 정책 및 엣지 케이스: [`03_POLICIES_AND_EDGES.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/03_POLICIES_AND_EDGES.md) (`POL-LLM-006`: Production Zero-Mock Fail-Fast Policy, `POL-RAG-001`: Dynamic Keyword Relevance Ranking)
  - 상세 기능 정의서:
    - [`05_AI_CHAT_SPECIFICATION.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/fsd/05_AI_CHAT_SPECIFICATION.md) (`FUNC-CHAT-001`: 글로벌 자율 지식 검색 챗, `FUNC-CHAT-002`: Scoped 포커스 기사 질의, `FUNC-CHAT-013`: Claude 3-Tier 멀티모델 선택기, `FUNC-CHAT-014`: 듀얼 모델 셀렉터)
  - 시스템 설계서 & OpenAPI: [`01_SYSTEM_DESIGN.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/system-designer/01_SYSTEM_DESIGN.md) (v0.2.0), [`02_OPENAPI_SPEC.yaml`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/system-designer/02_OPENAPI_SPEC.yaml) (OpenAPI 3.1.0 v4.0.0)
  - 데이터 계약 및 MSW 명세서: [`01_CONTRACT_AND_MSW_SPEC.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md) (v0.2.2 Contract Lock)
  - 5-Pillar 코드 품질 감사 보고서:
    - 백엔드: [`docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md) (v0.2.2 APPROVED)
    - 프론트엔드: [`docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md) (v0.2.2 APPROVED)

---

## 1. 테스트 범위 및 환경 (Test Scope & Environment)

### 1.1 테스트 대상 (Test Scope)
기획 요구사항(`01_PRD.md`), 상세 기능정의서(FSD 01~06), 그리고 v0.2.2 버그 픽스 및 아키텍처 거버넌스 규약에 따른 핵심 검증 항목:

1. **질문별 동적 기사 검색 및 고정 5개 슬라이스 제거 (`[BUG-RAG-002]`, `FUNC-CHAT-001`)**:
   - 기존의 고정된 상위 5개 기사 슬라이스(`items[:5]`, `mockSearchChunks.slice(0, 5)`) 반환 결함을 근본적으로 제거
   - 질문 주제('Claude', 'MCP', 'Benchmark' 등)에 따라 실시간으로 서로 다른 고유 기사들이 상위 소스로 동적 인출되는지 확인
   - 백엔드 `SqliteFtsRetriever`와 프론트엔드 MSW `filterChunksByQuestion` 양방향에서 동적 매칭 일관성 검증
2. **자연어 대화형 불용어/조사 분리 및 정밀 키워드 추출 (`SqliteFtsRetriever.extract_keywords`)**:
   - 한국어 23종 조사/접속사(`에서`, `으로`, `까지`, `에게`, `부터`, `보다` 등)의 어간 분리 로직 적용
   - 대화형 질문 종결어미(`알려줘`, `설명해줘`, `비교해줘`, `요약해줘` 등) 및 검색 노이즈성 단어 50여 개와 영어 불용어 35종 필터링
   - 대화형 질문("최신 Claude 관련 소식 알려줘") 입력 시 핵심 키워드('Claude')만 정밀 추출되어 FTS5/SQL LIKE 쿼리에 전달되는지 검증
3. **SQLite FTS5 가상 테이블 및 SQL LIKE 관련도 랭킹 가중치 (Pseudo-BM25)**:
   - `sqlite_master` 검사를 통해 `news_fts` 및 C/U/D 트리거(`news_items_ai`, `news_items_ad`, `news_items_au`) 자동 생성 및 `rebuild` 인덱스 무결성 검증
   - FTS5 매칭 실패 또는 우회 시 SQL LIKE 검색에서 제목(+5.0), 기술스택(+3.0), 요약(+2.0), 태그(+1.0) 가중치를 부여하여 관련도 순 정렬 인출 검증
4. **Google Gemini 연동 로직(`_call_gemini`) 정직한 복원 및 사일런트 폴백 배제 (Honest Routing & Fail-Fast)**:
   - Google GenAI REST API 비동기 httpx 클라이언트 구현 복원
   - 명시적으로 `gemini-` 모델 요청 시 정직하게 Gemini 엔드포인트 호출 검증
   - 은밀한 사일런트 다운그레이드(Claude나 Mock으로 몰래 전환) 없이 명확한 `LLMUpstreamException` (HTTP 502) 반환 검증
   - Claude 요청 시 Gemini로 사일런트 폴백되지 않는 독립 라우팅 검증
5. **UI 동적 소스 칩 및 인라인 인용 뱃지 연동 (`ChatWorkspace.tsx`, `ChatMessageItem.tsx`)**:
   - SSE `sources` 이벤트로 인입된 `primary_count`에 따라 "원문 1건", "보충 n건" 등 동적 카운트 뱃지 정상 표출
   - 마크다운 인라인 인용 `[1]` 클릭 시 매칭된 대상 기사(예: LangGraph v0.2 등) 메타데이터 및 하이라이트 정상 연동
6. **Scoped 모드 기사 포커스 그라운딩 보존 (`[BUG-CHAT-001]`, `FUNC-CHAT-002`)**:
   - URL 파라미터(`?sourceId=...&q=...`) 핸드오버 시 `scope: "scoped"` 및 `source_id` 누락 없는 직렬화 전송
   - 기사 제목, 요약, 전문([1]) 프롬프트 온전 주입 및 앵무새 시스템 소개 출력 차단 보존
7. **프로덕션 제로-목(Zero-Mock) 거버넌스 유지 (`POL-LLM-006`)**:
   - 프로덕션 코드에서 mock fixture import 100% 배제 및 라이브 프로바이더 부재 시 HTTP 503 Fail-Fast 거버넌스 지속
8. **Claude 5.5 연동, `temperature` 제외 및 과거 모델명 보존**:
   - Anthropic 요청 시 `temperature` 제외 지속
   - 과거 `gemini-2.0-flash`, `gpt-4o` 대화 이력의 원본 보존 및 안전한 렌더링 지속
9. **프로젝트 버전 v0.2.2 전역 동기화 (SSOT)**:
   - `backend/app/config.py`, `config.json`, `.env`, `frontend/package.json`, `frontend/src/app/api/health/route.ts` 전역 `0.2.2` 일치
10. **전체 자동화 회귀 테스트 전원 Green 통과**:
    - 백엔드 pytest 154건 및 프론트엔드 vitest 234건 (총 388건) 100% Green 통과

### 1.2 테스트 환경 (Test Environment)
- **API 서버**: 로컬 라이브 인스턴스 (`http://localhost:8000`), Python 3.11.9, FastAPI 0.115.6, SQLite 3.43+ WAL (`PRAGMA foreign_keys = ON;`)
- **웹 클라이언트**: Next.js 16.3.4 (App Router, Turbopack, React 19.2.8), Tailwind CSS v4, MSW v2.15.0
- **검증 뷰포트**:
  - 모바일: 375px (iPhone SE) / 390px (iPhone 15 Pro)
  - 태블릿: 768px (iPad Mini)
  - 데스크톱: 1440px / 1280px (MacBook Pro / Desktop Wide)
- **타깃 브라우저 엔진**: Chromium (Chrome, Edge), Gecko (Firefox), WebKit (Safari)

---

## 2. 테스트 시나리오 매트릭스 (Test Matrix)

| 케이스 ID | 테스트 구분 | 검증 시나리오 | 사전 조건 및 입력 데이터 | 기대 결과 (Pass Criteria) |
| :--- | :---: | :--- | :--- | :--- |
| `TC-DYN-RAG-001`| E2E/데이터 | **질문별 동적 기사 검색 및 고정 5개 슬라이스 배제** | 질문: `'Claude'`, `'MCP'`, `'Benchmark'` 각각 질의 | • 각 질문별로 상위 1순위 소스 기사 ID가 서로 다른 고유 기사로 동적 인출됨<br>• 고정 5개 슬라이스 반환 결함 0건 입증 |
| `TC-DYN-RAG-002`| 알고리즘 | **대화형 한국어 불용어/조사 분리 및 키워드 추출** | 입력: `"최신 Claude 관련 소식 알려줘"`, `"최신 MCP 관련 소식 알려줘"` | • 조사(`관련`, `소식`, `알려줘` 등) 정제 후 순수 핵심어(`Claude`, `MCP`) 추출<br>• 핵심 키워드 기반으로 정확한 고유 기사 1순위 인출 |
| `TC-DYN-RAG-003`| 데이터/성능 | **SQLite FTS5 테이블 자동 복원 및 인덱스 동기화** | `_ensure_fts_table()` 호출 및 FTS5 레코드 수 검증 | • `news_fts` 가상 테이블 및 C/U/D 트리거 정상 동작<br>• `news_fts` 레코드 수 $\ge$ `news_items` 레코드 수 무결성 충족 |
| `TC-DYN-RAG-004`| 알고리즘/엣지 | **FTS5 실패 시 SQL LIKE 관련도 가중치 랭킹 폴백** | FTS5 우회 상태에서 "최신 Claude 관련 소식 알려줘" 질의 | • 제목(+5.0), 기술스택(+3.0), 요약(+2.0), 태그(+1.0) 가중치 점수 부여<br>• 무작위 반환 없이 관련도 높은 기사 순 정렬 인출 |
| `TC-GEMINI-001` | API/라우팅 | **`_call_gemini` 메소드 복원 및 명시적 모델 호출** | `_call_gemini(prompt, model="gemini-3.5-flash-lite")` 호출 | • Google GenAI REST 엔드포인트 정확 호출<br>• 요청된 지정 모델(`gemini-3.5-flash-lite`)로 정직한 라우팅 확인 |
| `TC-GEMINI-002` | 아키텍처/보안| **Gemini 장애 시 은밀한 사일런트 다운그레이드 배제** | Gemini API 실패 상황 모의 (`generate_live_answer(model="gemini-...")`) | • Claude나 Mock으로 몰래 다운그레이드하지 않고 즉시 `LLMUpstreamException` (502) 발생 (Fail-Fast) |
| `TC-FE-DYN-001` | MSW/프론트 | **MSW 핸들러 고정 5개 슬라이스 제거 및 키워드 필터링** | MSW 모의 환경에서 LangGraph, AutoGen 글로벌 챗 질의 | • `mockSearchChunks.slice(0, 5)` 제거 확인<br>• LangGraph 질의 시 id 102 매칭, AutoGen 질의 시 id 104 매칭 (`primary_count: 1`) |
| `TC-FE-UI-001`  | UI/UX | **ChatWorkspace 동적 소스 칩 및 인라인 인용 표출** | 글로벌 모드에서 LangGraph 질문 전송 | • 어시스턴트 메시지 헤더에 "원문 1건" 동적 소스 칩 렌더링<br>• 본문 인라인 인용 `[1]` 클릭 시 대상 기사 하이라이트 정상 연동 |
| `TC-VER-001`    | 형상관리 | **프로젝트 버전 v0.2.2 전역 일관 동기화 (SSOT)** | 설정 파일, 환경변수, package.json 전수 점검 | • `config.py`, `config.json`, `.env`, `package.json`, health API 모두 `0.2.2` 일치 |
| `TC-SCOPED-001` | E2E 정상 | **포커스 기사 핸드오버 컨텍스트 인계 및 클로저 래그 해결** | 기사 카드에서 [Ask AI] 클릭 (`/chat?sourceId=102&q=...`) | • `activeSource` 및 `source_id: 102`, `scope: "scoped"` 누락 없이 즉시 전송 |
| `TC-SCOPED-002` | E2E/데이터 | **Scoped 모드 기사 프롬프트 온전 주입 및 앵무새 답변 차단** | `source_id=777` 포커스 상태에서 기술 분석 질의 전송 | • 기사 제목/요약/전문 온전 주입 및 기사와 무관한 플랫폼 소개 앵무새 반복 차단 |
| `TC-PRODMOCK-001`| 아키텍처/보안| **프로덕션 `mock_provider.py` 영구 퇴역 및 Zero-Mock 거버넌스** | 프로덕션 코드 임포트 및 라이브 키 부재 상태 질의 | • 프로덕션 임포트 시 `ImportError`, 가용 키 부재 시 HTTP 503 fail-fast |
| `TC-ANTHROPIC-TEMP`| 정합성/API | **Claude 5.5 API 호출 시 `temperature` deprecated 에러 차단** | `AnthropicLLMProvider`를 통해 5.5 스트리밍 호출 | • REST JSON 페이로드에서 `temperature` 완전 제외, HTTP 400 방어 |
| `TC-HIST-001`   | 데이터 무결성 | **과거 Gemini/GPT 대화 이력 모델명 무결 보존 및 렌더링** | DB에 과거 `gemini-2.0-flash`, `gpt-4o` 기록 세션 조회 | • 식별자 원본 보존, 브랜드 레이블(`Gemini 2.5 Flash`, `GPT-4o`) 및 범용 폴백 뱃지 렌더링 |
| `TC-REG-BE-001` | 통합 회귀 | **백엔드 전체 테스트 154건 전원 Green 통과** | `pytest -v` 전체 스위트 실행 | • 16개 테스트 파일, 154건 100% 통과 (0 Failed, 0 Error) |
| `TC-REG-FE-001` | 통합 회귀 | **프론트엔드 전체 테스트 234건 전원 Green 통과** | `pnpm test:run` 전체 스위트 실행 | • 24개 테스트 파일, 234건 100% 통과 (0 Failed, 0 Flaky) |
| `TC-REG-TYPE-001`| 정적 검증 | **프론트엔드 TypeScript 정적 타입 검증** | `pnpm tsc --noEmit` 실행 | • 타입 에러 0건, Exit Code 0 |

---

## 3. 테스트 실행 지침 및 하드 게이트 (Execution Guidelines & Quality Gates)

1. **자동화 검증 스위트 실행 파이프라인**:
   - 백엔드 pytest 전체 회귀 스위트: `cd backend && ../.venv/bin/pytest -v` (**154개 테스트 전원 Green**)
   - 프론트엔드 vitest 전체 회귀 스위트: `cd frontend && pnpm test:run` (**234개 테스트 전원 Green**)
   - 프론트엔드 정적 타입 검증: `cd frontend && pnpm tsc --noEmit` (**0 에러, Exit Code 0**)
   - Python 실전 DB 동적 RAG 및 Gemini 라우팅 검증: `../.venv/bin/python scratch/verify_qa_v022.py` (**전원 PASS**)
2. **하드 퀄리티 게이트 통과 기준 (Hard Quality Gate Criteria)**:
   - 자동화 테스트 통과율: **100% (Pass Rate = 100%, 388/388건)**
   - 고정 5개 슬라이스 결함 재발: **0건 (Zero Fixed 5 Slice Leak)**
   - 질문별 고유 기사 동적 인출 정확도: **100% (Distinct Top-1 Articles)**
   - 대화형 한국어 불용어 처리 성공률: **100%**
   - Gemini 사일런트 다운그레이드 유출: **0건 (Zero Silent Fallback)**
   - 프로덕션 코드 내 목 객체 및 분기 잔존: **0건 (Zero-Mock Rule Compliance)**
   - Blocker 결함 수: **0건**
   - Critical 결함 수: **0건**
   - 회귀 결함: **0건**
3. **최종 보고서 연계**:
   - 본 테스트 계획서에 따른 전수 검증 결과는 `docs/qa-engineer/02_QA_TEST_REPORT.md`에 투명하게 기록하고 최종 출시 승인(RELEASE_APPROVED)을 판정합니다.
