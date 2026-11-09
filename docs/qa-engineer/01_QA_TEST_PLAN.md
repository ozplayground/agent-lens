# [AgentLens] 통합 QA 테스트 계획서 (QA Test Plan)

- **Updated**: 2026-11-09
- **기준**: v0.4.1 (main)
- **작성일자**: 2026-11-09
- **작성자**: 품질 보증 엔지니어 (`qa-engineer`)
- **문서 버전**: v0.4.1 as-built (지금 코드를 그대로 검증하는 계획. 새 기능 설계가 아니다). v0.4.0 계획에 리뷰 수정(v0.4.1) 회귀 케이스를 더하고 바뀐 동작의 기대 결과를 고쳤다
- **상태**: Review
- **기준 문서**:
  - 상세 기능 정의서(FSD): `docs/spec-writer/fsd/01_NEWS_FEED_SPECIFICATION.md`(NEWS), `02_AI_CHAT_SPECIFICATION.md`(CHAT), `03_COLLECTION_SPECIFICATION.md`(COLL), `04_BRIEFING_AND_SHARING_SPECIFICATION.md`(BRF), `05_SOURCES_AND_RESEARCH_SPECIFICATION.md`(SRC), `06_MCP_SERVER_SPECIFICATION.md`(MCP), `07_UI_COMMON_SPECIFICATION.md`(UI)
  - 시스템 설계·API: `docs/system-designer/01_SYSTEM_DESIGN.md`, `docs/system-designer/02_OPENAPI_SPEC.yaml`
  - 계약·MSW: `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md`
  - 컴포넌트·디자인 시스템(`ui-audit` 판정 규격 8절): `docs/ui-system-designer/01_COMPONENT_SPEC.md`, `docs/ui-system-designer/02_DESIGN_SYSTEM.md`
  - 배포·실행: `docs/devops-engineer/01_DEPLOYMENT_SPEC.md`
  - 자동 테스트 파일별 상세(테스트 이름·단언): `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md`, `docs/frontend-tdd-engineer/01_TDD_CYCLE_LOG.md`
  - 결과 보고서: `docs/qa-engineer/02_QA_TEST_REPORT.md`

이 문서는 세 부분으로 되어 있다. 1~3절은 실행 중인 앱에서 하는 통합 QA 계획(시나리오 매트릭스, 실행 지침, 판정 기준), 4절은 저장소의 자동 테스트 전략(검사 명령, 테스트 종류, 격리, `ui-audit`, 외부 호출 정책, 통과 기준, 릴리스 전 검증), 5~8절은 자동 테스트의 현황 요약·기능 영역별 공백·외부 호출 판정·테스트의 알려진 불일치다.

---

## 1. 테스트 범위 및 환경 (Test Scope & Environment)

### 1.1 테스트 대상
FSD 7개 도메인의 인수 기준 가운데 실행 중인 앱에서 데이터를 지우거나 밖으로 보내지 않고 확인할 수 있는 것 전부. 시나리오는 정상 경로, 경계·잘못된 입력, 외부 의존 실패(LLM 없음 → 503, 네트워크 단절, 수집 소스 오류), 빈 데이터, 동시 실행(수집 중 재요청 → `already_running`)으로 나눈다.

### 1.2 테스트 환경
| 항목 | 값 |
|---|---|
| backend (Docker) | `BACKEND_PORT=18000 make docker-up` → `http://localhost:18000` (컨테이너 안 8000). 호스트 8000 은 다른 세션의 `make dev` 가 쓰고 있어 건드리지 않는다. DB 는 이름 있는 볼륨 `agentlens-data` 의 `/app/data/agentlens.db` (`docker-compose.yml`) |
| frontend (Docker) | `http://localhost:3001` (Next.js standalone 프로덕션 빌드, `INTERNAL_API_URL=http://backend:8000` 으로 `/api/*` 를 rewrite, `frontend/next.config.ts:23-31`) |
| LLM 없는 backend | 로컬 `.venv` uvicorn `127.0.0.1:18001`. 환경 변수 `ANTHROPIC_API_KEY=`·`OPENAI_API_KEY=`·`GEMINI_API_KEY=` 를 비우고 `OLLAMA_BASE_URL=http://127.0.0.1:9`(닿지 않는 주소), `DATABASE_URL` 은 Docker DB 의 백업 사본(스크래치 폴더). 사본에 기사가 있어 lifespan 의 빈 DB 첫 수집(`backend/app/main.py:30-34`)이 돌지 않는다 |
| 데이터를 지우는 시나리오 | DB 사본으로 띄운 backend 에서만 한다: `sqlite3 backend/agentlens.db ".backup /tmp/qa.db"` 후 `DATABASE_URL=sqlite+aiosqlite:////tmp/qa.db make dev DEV_BACKEND_PORT=18000 DEV_FRONTEND_PORT=13000`. 이번 계획에서는 실행하지 않는다 (1.3) |
| 브라우저 | Playwright MCP (Chromium), `ui-audit.mjs` 는 로컬 Chrome(puppeteer-core) |
| 폭 | 360x780, 390x844, 768x1024, 1024x768, 1440x900 (수동 시나리오는 390x844·1440x900, 나머지 폭은 `ui-audit`) |
| 테마 | 라이트, 다크 (`agentlens_theme` localStorage) |

### 1.3 이번 QA 에서 실행하지 않는 동작
데이터를 지우거나 외부로 보내거나 추적 파일을 바꾸는 동작은 실행하지 않고 코드로만 확인한다.
- 초기화·삭제: `POST /api/schedule/reset-and-collect`, `DELETE /api/news/all`, 소스 삭제
- 수집: `POST /api/schedule/trigger`, `POST /api/research/run-deep`, MCP `trigger_agentlens_crawl`
- 발송: `POST /api/briefing/export/notion`·`/send/email`·`/test/notion`·`/test/email`, `POST /api/webhook/test`(유효 URL), `/api/webhook/send-briefing`
- 설정 저장: `POST /api/briefing/settings`, 소스 추가·토글 (Docker 에서는 루트 `config.json`·`sources.json` 이 rw 마운트라 저장하면 추적 파일이 바뀐다, `docker-compose.yml` backend volumes)
- 실제 LLM 호출이 나가는 챗 질의(정상 경로)는 비용·외부 호출이라 수동 시나리오에서 보내지 않는다. 입력 검증·오류 분기처럼 LLM 호출 전에 끝나는 경로만 부른다.

### 1.4 검사 범위 밖 (수용된 위험)
제품 오너 결정 (2026-11-09): 아래 다섯 가지는 이 프로젝트에서 검사하지 않는다. 수용된 위험이며 출시 판정의 Blocker·Critical 에 세지 않는다. 사실과 근거는 결과 보고서 `docs/qa-engineer/02_QA_TEST_REPORT.md` 3.8절에 그대로 남긴다.

| ID | 항목 | 관련 시나리오 | 보고서 결함 |
| :--- | :--- | :--- | :--- |
| OOS-1 | 인증 없음과 CORS 전체 허용(모든 origin, credentials 허용) | `TC-SEC-001` | D-01 |
| OOS-2 | SSRF (웹훅 테스트·발송, `inspect-url`, `test/email` 이 호출자가 준 URL·호스트로 요청) | 시나리오 없음 (외부 호출이라 1.3 에 따라 실행하지 않음) | D-02 |
| OOS-3 | 비밀값 평문 저장 (Notion 토큰·SMTP 비밀번호·웹훅 URL 을 git 이 추적하는 `config.json` 에) | 시나리오 없음 (설정 저장은 1.3 에 따라 실행하지 않음) | D-03 |
| OOS-4 | 설정 조회로 비밀값 노출 (`GET /api/briefing/settings` 의 웹훅 URL 원문, Notion 토큰 앞뒤 4자) | `TC-BRF-002` 의 해당 부분 | D-04 |
| OOS-5 | 설정 재적용 누락 (저장 뒤 `settings.reload()` 가 Notion·SMTP 값을 다시 읽지 않음) | `TC-BRF-006` | D-08 |

- 매트릭스에서 이 항목만 보는 케이스는 구분을 **범위 밖** 으로 두고 Pass/Fail 을 매기지 않는다. 실행했으면 관찰 결과만 기록한다.
- 같은 범주가 아닌 보안 관련 결함(예외 문자열·서버 경로 노출 `TC-SEC-002`, 이메일 HTML 이스케이프)은 범위 안이다.

---

## 2. 테스트 시나리오 매트릭스 (Test Matrix)

구분: E2E 정상 / 경계 / 잘못된 입력 / 외부 의존 실패 / 빈 데이터 / 동시 실행 / 보안 / UI / 접근성 / 반응형 / 범위 밖(1.4). 방법: `runner` = `qa_runner.py`, `curl` = 시나리오별 HTTP 호출, `UI` = Playwright, `audit` = `ui-audit.mjs`, `code` = 실행하지 않고 코드로 확인 (1.3).

### 2.1 NEWS (뉴스 피드, `docs/spec-writer/fsd/01_NEWS_FEED_SPECIFICATION.md`)
| 케이스 ID | 구분 | 검증 시나리오 | 사전 조건 및 입력 | 기대 결과 | 방법 | FSD |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TC-NEWS-001` | E2E 정상 | 목록 기본 조회 | `GET /api/news` | 200, `items`·`total`·`page`·`size`·`total_pages` | curl, runner | FUNC-NEWS-001 |
| `TC-NEWS-002` | E2E 정상 | 카테고리 필터 | `?category=harness` | 200, 해당 카테고리만 | curl | FUNC-NEWS-002 |
| `TC-NEWS-003` | E2E 정상 | Must-Read 필터 | `?high_signal_only=true` | 200 | curl | FUNC-NEWS-004 |
| `TC-NEWS-004` | E2E 정상 | 키워드 검색 | `?search=agent` | 200 | curl | FUNC-NEWS-005 |
| `TC-NEWS-005` | E2E 정상 | 정렬 | `?sort=hotness` | 200 | curl | FUNC-NEWS-006 |
| `TC-NEWS-006` | 경계 | 페이지 하한 | `?page=0` | 422 (`page` ge=1, `backend/app/api/news.py:54`) | curl | FUNC-NEWS-001 |
| `TC-NEWS-007` | 경계 | 크기 상한 | `?size=101` | 422 (`size` le=100, `news.py:55`) | curl | FUNC-NEWS-001 |
| `TC-NEWS-008` | 잘못된 입력 | 숫자가 아닌 페이지 | `?page=abc` | 422 | curl | FUNC-NEWS-001 |
| `TC-NEWS-009` | 빈 데이터 | 범위 밖 페이지 | `?page=999` | 200, `items: []` | curl | FUNC-NEWS-001 |
| `TC-NEWS-010` | 빈 데이터 | 없는 카테고리 | `?category=nope` | 200, `total: 0` | curl | FUNC-NEWS-002 |
| `TC-NEWS-011` | E2E 정상 | 단건 조회 | `GET /api/news/{있는 id}` | 200 | curl | FUNC-NEWS-012 |
| `TC-NEWS-012` | 잘못된 입력 | 없는 기사 | `GET /api/news/999999999` | 404 | curl, runner | FUNC-NEWS-012 |
| `TC-NEWS-013` | 잘못된 입력 | 숫자가 아닌 id | `GET /api/news/abc` | 422 | curl | FUNC-NEWS-012 |
| `TC-NEWS-014` | E2E 정상 | RSS 출력 | `GET /api/news/feed/rss.xml`, `?category=harness` | 200, `<rss` | curl, runner | FUNC-NEWS-013 |
| `TC-NEWS-015` | 잘못된 입력 | 없는 기사에 질문 | `POST /api/news/999999999/ask` | 404 | curl | FUNC-NEWS-011 |
| `TC-NEWS-016` | E2E 정상 | 통계·트렌드 레이더 | `GET /api/stats`, `GET /api/trends/radar` | 200 | curl, runner | FUNC-NEWS-014, 015 |
| `TC-NEWS-017` | 외부 의존 실패 | LLM 없을 때 기사 질문 | LLM 없는 backend, `POST /api/news/{id}/ask`·`/ask/stream` | 503 이 아니라 휴리스틱 대체 답(`model_used: "AgentLens Heuristic Engine"`, `backend/app/services/llm_processor.py:846-853`)으로 200 | curl | FUNC-NEWS-010, 011 |
| `TC-NEWS-018` | 외부 의존 실패 | LLM 없어도 목록은 정상 | LLM 없는 backend, `GET /api/news` | 200 | curl | FUNC-NEWS-001 |
| `TC-NEWS-019` | UI | 피드 표시 | `/` 1440x900·390x844 | 카드 그리드, 요약 바, 검색, 카테고리·소스 칩, 정렬, 가로 스크롤 없음 | UI | FUNC-NEWS-001, 008 |
| `TC-NEWS-020` | UI | 카테고리 칩 필터 | 칩 `하네스 & 벤치마크` 선택 | 해당 건수만 표시, 머리줄 `총 N건 (전체 M건)`, 칩 `aria-pressed` | UI | FUNC-NEWS-002 |
| `TC-NEWS-021` | 빈 데이터 | 0건 카테고리 | 칩 `MCP & 생태계`(0건) | `조건에 일치하는 소식이 없습니다` | UI | FUNC-NEWS-002 |
| `TC-NEWS-022` | 접근성 | 기사 상세 대화상자 | 카드 제목 클릭 → Tab 반복 → Escape | `role=dialog`·`aria-modal=true`·제목 `aria-labelledby`, 포커스가 대화상자 안에 갇힘, 본문 스크롤 잠금, Escape 로 닫히고 포커스가 카드 제목으로 돌아감 | UI | FUNC-NEWS-009 |
| `TC-NEWS-023` | 경계 | 검색 입력 디바운스와 1페이지 | 피드에서 검색어를 150ms 간격으로 입력 | 입력이 300ms(`SEARCH_DEBOUNCE_MS`, `frontend/src/hooks/useNewsFeed.ts:9`) 멈춘 뒤 요청 1번, 요청에 `page=1`. 빈 값·Enter 는 바로 요청. 2페이지 이상에서의 1페이지 복귀는 `feed/FeedSearch.test.tsx` 가 검증(데이터 21건 이상 필요) | UI (fetch 기록), 단위 테스트 | FUNC-NEWS-005 |
| `TC-NEWS-024` | 외부 의존 실패 | `BACKEND_PORT` 를 바꾼 Docker 에서 기사 질문 스트림 | 브라우저가 `{host}:8000` 으로 직접 연결 (`frontend/src/lib/api.ts:12-23`, `:97-108`) | 바뀐 포트의 backend 로 간다 (알려진 문제) | code | FUNC-NEWS-010 |

### 2.2 CHAT (AI 챗, `docs/spec-writer/fsd/02_AI_CHAT_SPECIFICATION.md`)
| 케이스 ID | 구분 | 검증 시나리오 | 사전 조건 및 입력 | 기대 결과 | 방법 | FSD |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TC-CHAT-001` | 잘못된 입력 | 빈 질문 | `POST /api/chat/stream` `{"question":" "}` | 400 `ERR_CHAT_PAYLOAD_EMPTY` (`backend/app/api/chat.py:291-300`) | curl | FUNC-CHAT-008 |
| `TC-CHAT-002` | 경계 | 2001자 질문 | `"가"×2001` | 400 `ERR_CHAT_PAYLOAD_TOO_LARGE` (`chat.py:302-310`) | curl | FUNC-CHAT-008 |
| `TC-CHAT-003` | 잘못된 입력 | 잘못된 scope | `scope:"all"` | 400 `ERR_INVALID_SCOPE_PARAM` (`chat.py:312-321`) | curl | FUNC-CHAT-017 |
| `TC-CHAT-004` | 잘못된 입력 | scoped 없는 기사 | `scope:"scoped", source_id:999999999` | 404 `ERR_HANDOVER_SOURCE_NOT_FOUND` (`chat.py:334-343`) | curl | FUNC-CHAT-013 |
| `TC-CHAT-005` | 잘못된 입력 | scoped 인데 source_id 없음 | `scope:"scoped"` | 404 (`chat.py:325-333`) | curl | FUNC-CHAT-013 |
| `TC-CHAT-006` | 잘못된 입력 | JSON 이 아닌 본문 | `not-json` | 400 `ERR_INVALID_PAYLOAD` (`chat.py:279-289`) | curl | FUNC-CHAT-008 |
| `TC-CHAT-007` | 잘못된 입력 | 잘못된 모델 티어 | `POST /api/chat/stream` `model_tier:"ultra"` (scoped 없는 기사와 함께 보내도) | 400 `ERR_INVALID_MODEL_TIER`, `details: null`. 검증이 scoped 기사 확인·LLM 가용성 확인보다 먼저 (`backend/app/api/chat.py:338`). `/api/chat/query` 는 여전히 500 (알려진 문제) | curl | FUNC-CHAT-015 |
| `TC-CHAT-008` | 잘못된 입력 | 동기 질의 빈 질문 | `POST /api/chat/query` `{"question":""}` | 4xx | curl | FUNC-CHAT-023 |
| `TC-CHAT-009` | E2E 정상 | 세션 목록 | `GET /api/chat/sessions` | 200 | curl, runner | FUNC-CHAT-001 |
| `TC-CHAT-010` | 잘못된 입력 | 없는 세션 | `GET /api/chat/sessions/no-such-session` | 404 | curl | FUNC-CHAT-003 |
| `TC-CHAT-011` | E2E 정상 | 출처 상세·없는 출처 | `GET /api/chat/sources/{id}`, `/999999999` | 200, 404 | curl | FUNC-CHAT-014, 018 |
| `TC-CHAT-012` | E2E 정상 | 코퍼스 검색 API | `GET /api/chat/search?q=agent` | 200 | curl | FUNC-CHAT-012 |
| `TC-CHAT-013` | 외부 의존 실패 | LLM 없음 스트림 | LLM 없는 backend, `POST /api/chat/stream` | 503 `ERR_LLM_PROVIDER_UNAVAILABLE` (`chat.py:376-384`) | curl | FUNC-CHAT-022 |
| `TC-CHAT-014` | 외부 의존 실패 | LLM 없음 동기 질의 | LLM 없는 backend, `POST /api/chat/query` | 503 | curl | FUNC-CHAT-022, 023 |
| `TC-CHAT-015` | UI | 챗 화면 기본 | `/chat` 1440x900·390x844 | 헤더 첫 조작 요소 `피드로 돌아가기`, `단일 기사`·`전체 소식` 모드, 추천 질문 4개, 입력창 아래 모델 선택 버튼 1개, 빈 기록 안내, 가로 스크롤 없음, 768px 미만 44px 미만 조작 요소 없음 | UI | FUNC-CHAT-007, 015, 017, 025 |
| `TC-CHAT-016` | 빈 데이터 | 없는 기사로 핸드오버 | `/chat?sourceId=999999999` | `요청하신 기사를 찾을 수 없어 전체 소식 모드로 시작합니다.` 알림, `전체 소식` 선택 | UI | FUNC-CHAT-018 |
| `TC-CHAT-017` | 외부 의존 실패 | 스트림 중 네트워크 단절 | 브라우저 오프라인 전환 | 오류 표시·재시도 | code (Playwright MCP 에 네트워크 차단 도구가 없어 실행하지 않음) | FUNC-CHAT-020 |
| `TC-CHAT-018` | 동시 실행 | 모델을 바꾼 직후 전송 | 티어 변경 → 바로 전송 | 바꾼 티어로 요청 (`handleSendMessage` 의존성에 `selectedTier`, `frontend/src/components/chat/ChatWorkspace.tsx:470`) | 단위 테스트 (`chat/ChatStreamTurn.test.tsx` FE-01. 실제 LLM 호출이 나가 앱에서는 보내지 않음) | FUNC-CHAT-015 |
| `TC-CHAT-019` | UI | 챗 답 내보내기 도구줄 | 완료된 답이 있는 세션 | `마크다운 복사`·`.md 다운로드` 두 버튼만, `Notion 동기화` 버튼 없음 (FE-22) | UI (임시 세션을 API 로 만들어 열고 끝나면 삭제) | FUNC-CHAT-019 |
| `TC-CHAT-020` | 잘못된 입력 | 스트림 본문 형식 | `POST /api/chat/stream` 본문 `[1,2]`, 같은 `user_message_id`·`assistant_message_id`, 37자 id | 400 `ERR_INVALID_PAYLOAD`, `details: null` | curl | FUNC-CHAT-008 |
| `TC-CHAT-021` | 외부 의존 실패 | 끊긴·오류 스트림과 한 턴 저장 | `done` 없이 끝난 스트림, `error` 이벤트, Anthropic `stop_reason: max_tokens`, 사용자 중단 | 부분 답 아래 `응답이 중간에 끊겼습니다. 다시 시도해 주세요.`·`답변 다시 시도`, 끊김·오류는 저장 안 함, 중단은 한 번 저장, 한 턴 = 메시지 2개(클라이언트 id 공유), backend 는 `event: error`(`ERR_LLM_STREAM_FAILED`)로 끝내고 `done` 없음 | 단위 테스트 (`backend/tests/test_code_review_fixes.py`, `frontend/src/tests/chat/ChatStreamTurn.test.tsx`. 실제 LLM 호출이 나가 앱에서는 보내지 않음) | FUNC-CHAT-006, 009, 020, 021 |

### 2.3 COLL (수집·분류·요약, `docs/spec-writer/fsd/03_COLLECTION_SPECIFICATION.md`)
| 케이스 ID | 구분 | 검증 시나리오 | 사전 조건 및 입력 | 기대 결과 | 방법 | FSD |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TC-COLL-001` | E2E 정상 | 스케줄 상태 | `GET /api/schedule/status` | 200, `schedule_hours`·`next_run`·`is_running` | curl, runner | FUNC-COLL-017, 018 |
| `TC-COLL-002` | E2E 정상 | 진행률 | `GET /api/schedule/progress` | 200, `is_running`·`step_message`·`total_sources` | curl, runner | FUNC-COLL-017 |
| `TC-COLL-003` | 동시 실행 | 수집 중 재요청 | 수집 중 `POST /api/schedule/trigger` | `already_running` (`backend/app/collectors/manager.py:177-180`) | code (수집을 실제로 돌려야 해 1.3 에 따라 실행하지 않음. 프론트 처리는 `hooks/useCollector.test.ts` 가 검증) | FUNC-COLL-001, 019 |
| `TC-COLL-004` | 외부 의존 실패 | 수집 소스 오류 | 소스 하나 실패 | 다른 소스 계속, 크롤 로그 기록 (알려진 문제: 크롤 로그가 항상 `success`) | code | FUNC-COLL-001, 017 |
| `TC-COLL-005` | 빈 데이터 | 빈 DB 로 시작 | 빈 볼륨으로 backend 시작 | 백그라운드 첫 수집, healthcheck 막지 않음 (`backend/app/main.py:30-34`) | code (외부 수집이 나가 실행하지 않음. `test_startup_seed.py` 가 검증) | FUNC-COLL-021 |
| `TC-COLL-006` | UI | 헤더 수집 상태 | `/` | `다음 수집 Nh Nm 후` 버튼, `즉시 수집` 버튼 존재 (누르지 않음) | UI, audit | FUNC-COLL-017, FUNC-UI-001 |

### 2.4 BRF (브리핑·공유, `docs/spec-writer/fsd/04_BRIEFING_AND_SHARING_SPECIFICATION.md`)
| 케이스 ID | 구분 | 검증 시나리오 | 사전 조건 및 입력 | 기대 결과 | 방법 | FSD |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TC-BRF-001` | E2E 정상 | 오늘 브리핑 | `GET /api/briefing/today` | 200 | curl | FUNC-BRF-001 |
| `TC-BRF-002` | E2E 정상 | 연동 설정 조회 | `GET /api/briefing/settings` | 200, 비밀번호 `***`, Notion 키 앞뒤 4자 (`backend/app/api/briefing.py:124-130`). 웹훅 URL·키 일부 노출은 판정하지 않는다 (1.4 의 OOS-4) | curl, runner | FUNC-BRF-011 |
| `TC-BRF-003` | 잘못된 입력 | 웹훅 테스트 잘못된 URL | `POST /api/webhook/test` `{"webhook_url":"not-a-url"}` | 400 `유효한 HTTP/HTTPS 웹훅 URL을 입력해주세요.` (외부 전송 없음) | curl | FUNC-BRF-009 |
| `TC-BRF-004` | 잘못된 입력 | Notion 발행 잘못된 본문 | `POST /api/briefing/export/notion` 본문 `{` | 422 (발행 안 함) | curl | FUNC-BRF-004 |
| `TC-BRF-005` | UI | 브리핑 대화상자 | 요약 바 `오늘의 브리핑` 클릭 → `마크다운 전문` 탭 → Escape | 탭 2개, 분야 머리글 긴 라벨 4개, Escape 로 닫힘 (알려진 문제: 헤드라인 40자 자름, 마크다운 전문의 backend 이모지) | UI | FUNC-BRF-002, 003 |
| `TC-BRF-006` | **범위 밖** | 설정 저장 뒤 발송 값 | 설정 저장 → 발송 | 판정하지 않음 (1.4 의 OOS-5). 관찰만 기록: 재시작 전까지 옛 값 | code (관찰) | FUNC-BRF-011 |

### 2.5 SRC (소스·딥 리서치, `docs/spec-writer/fsd/05_SOURCES_AND_RESEARCH_SPECIFICATION.md`)
| 케이스 ID | 구분 | 검증 시나리오 | 사전 조건 및 입력 | 기대 결과 | 방법 | FSD |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TC-SRC-001` | E2E 정상 | 소스 목록 | `GET /api/sources` | 200 | curl, runner | FUNC-SRC-003 |
| `TC-SRC-002` | E2E 정상 | 딥 리서치 상태·감사 일지 | `GET /api/research/status`, `/audit-logs` | 200 | curl, runner | FUNC-SRC-013, 014 |
| `TC-SRC-003` | E2E 정상 | 카탈로그 후보 탐색 | `POST /api/research/discover` `{}` | 200 (메모리 카탈로그, 네트워크 없음) | curl | FUNC-SRC-009 |
| `TC-SRC-004` | 잘못된 입력 | 없는 소스 유형 토글 | `PATCH /api/sources/nope/xyz/toggle` | 4xx | curl | FUNC-SRC-006 |
| `TC-SRC-005` | 경계 | GitHub 저장소 `owner/repo` 토글 | `PATCH /api/sources/github_repo/modelcontextprotocol/servers/toggle` 두 번, 없는 저장소 `github_repo/no/such` | 200 두 번으로 원상 복구(경로 `{item_id:path}`, `backend/app/api/sources.py:77`, `:85`), 없는 저장소 404. 끝나면 루트 `sources.json` 이 바뀌므로(`updated_at`) 그 파일만 `git checkout -- sources.json` | curl | FUNC-SRC-006, 007 |
| `TC-SRC-006` | 동시 실행 | 딥 리서치 예외 뒤 재실행 | 실행 중 예외 | 다음 실행 가능 (알려진 문제: `is_running` 이 남아 거부) | code | FUNC-SRC-011 |

### 2.6 MCP (MCP 서버, `docs/spec-writer/fsd/06_MCP_SERVER_SPECIFICATION.md`)
| 케이스 ID | 구분 | 검증 시나리오 | 사전 조건 및 입력 | 기대 결과 | 방법 | FSD |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TC-MCP-001` | E2E 정상 | MCP 정보 | `GET /api/mcp/info` | 200, `tools` | curl, runner | FUNC-MCP-006 |
| `TC-MCP-002` | UI | MCP 연동 대화상자 | `더보기` → `MCP 연동` | 대화상자 접근성 속성·Escape | audit | FUNC-MCP-007 |
| `TC-MCP-003` | 동시 실행 | MCP 수집과 웹 수집 동시 | MCP `trigger_agentlens_crawl` 중 웹 수집 | 하나만 실행 (알려진 문제: 플래그가 프로세스 메모리에만 있어 공유 안 됨) | code | FUNC-MCP-005 |

### 2.7 UI (UI 공통, `docs/spec-writer/fsd/07_UI_COMMON_SPECIFICATION.md`)
| 케이스 ID | 구분 | 검증 시나리오 | 사전 조건 및 입력 | 기대 결과 | 방법 | FSD |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TC-UI-001` | E2E 정상 | frontend 헬스·페이지 | `GET /api/health`, `/`, `/chat` (3001) | 200 | curl, runner | 07 '화면·라우트' 절 (단위 기능 ID 없음) |
| `TC-UI-002` | E2E 정상 | frontend 프록시 | `GET http://localhost:3001/api/stats` | 200 (rewrite → backend) | curl | 07 '화면·라우트' 절 (단위 기능 ID 없음) |
| `TC-UI-003` | 잘못된 입력 | 없는 경로 | `GET /no-such-page` (3001) | 404 | curl | 07 '화면·라우트' 절 (404 커스텀 페이지 없음) |
| `TC-UI-004` | UI | 테마 전환 | `테마 선택` → `다크` → 다른 페이지로 이동 | `html.dark`·`data-theme=dark`, `agentlens_theme=dark`, 이동 뒤에도 유지 | UI | FUNC-UI-003, 004 |
| `TC-UI-005` | 반응형 | 390x844 피드·상세·챗 | 폭 390 | 가로 스크롤 없음, 헤더 56px 한 줄, 44px 미만 조작 요소 없음(건너뛰기 링크 제외), viewport 확대 허용 | UI | FUNC-UI-009, 010 |
| `TC-UI-006` | 반응형·접근성 | 폭·테마별 화면 규칙 21종 | `/`·`/chat` × 라이트·다크 × 5개 폭 + 대화상자·추가 상태 | `ui-audit.mjs` 종료 0 | audit | FUNC-UI-008, 009, 014 |
| `TC-UI-007` | 접근성 | 키보드 포커스 표시 | 대화상자 안 Tab | `:focus-visible` 2px 윤곽선 | UI | FUNC-UI-008, 014 |
| `TC-SEC-001` | **범위 밖** | 임의 origin 의 CORS preflight | `OPTIONS /api/news/all`, `Origin: https://evil.example`, `Access-Control-Request-Method: DELETE` | 판정하지 않음 (1.4 의 OOS-1). 관찰만 기록: 허용 + credentials | curl (관찰) | — |
| `TC-SEC-002` | 보안 | 500 응답 본문 | `TC-CHAT-007` 의 500 | 내부 예외 문자열 없음 (기대). 알려진 문제: `error` 에 예외 문자열 | curl | — (backend 오류 형식, `docs/system-designer/01_SYSTEM_DESIGN.md`) |

---

## 3. 테스트 실행 지침 및 판정 기준 (Execution Guidelines & Quality Gates)

1. 환경: `BACKEND_PORT=18000 make docker-up` (두 컨테이너 healthy 까지 기다림, 기본 180초). Docker 이미지는 `make docker-up` 이 다시 빌드하지 않으므로, 이미지 안 `/app/app` 과 작업 트리 `backend/app` 을 `diff -rq` 로 비교해 지금 코드인지 확인한다.
2. 스모크: `python3 .claude/skills/fullstack-qa-testing/scripts/qa_runner.py --base-url http://localhost:18000 --frontend-url http://localhost:3001` (GET 17개, 데이터 변경 없음, 종료 0 이 통과).
3. 시나리오: 2절의 `curl` 케이스를 스크립트로 부르고 상태 코드·응답 시간·본문을 기록한다. LLM 없음 케이스는 1.2 의 LLM 없는 backend(:18001)에 보낸다.
4. UI: Playwright 로 `/`, `/chat` 을 390x844·1440x900 에서 열어 2절 UI 케이스(피드 표시, 필터, 기사 상세 열고 Escape, 챗 화면, 테마 전환, 브리핑 대화상자)를 실행한다. 데이터 삭제·수집·발송·설정 저장 버튼은 누르지 않는다.
5. 화면 규칙: `cd frontend && node scripts/ui-audit.mjs --base http://localhost:3001 --screenshots none` (결과 `docs/qa-engineer/ui-audit/report.json`). 로컬 Chrome 이 없으면 건너뛰고 이유를 적는다.
6. 정리: `make docker-down`, LLM 없는 backend 종료, 시작 전과 끝난 뒤 `git status --porcelain` 비교. 추적 파일이 바뀌었으면 원인을 기록하고 `git checkout --` 으로 되돌린다.
7. 결함 심각도:
   - `Blocker`: 핵심 흐름(피드 표시, 챗 질의, 수집)이 막히거나 데이터가 손상·유실된다.
   - `Critical`: 보안·데이터 정확성에 실제 피해가 나거나 기능이 틀린 결과를 정상처럼 보인다.
   - `Minor`: 화면 표기·문구·계약 불일치·쓰이지 않는 코드·운영 편의 문제처럼 사용 흐름을 막지 않는 것.
8. 판정: Blocker·Critical 이 0 이면 `RELEASE_APPROVED`, 아니면 `RELEASE_BLOCKED`. 옛 알려진 문제 목록에서 옮긴 결함(`02_QA_TEST_REPORT.md` 3절)도 미해결 결함으로 센다. 1.4 의 범위 밖 항목은 심각도를 매기지 않고 판정에 세지 않는다.

---

## 4. 자동 테스트 전략

저장소의 자동 검사(`make check`)와 화면 측정(`ui-audit.mjs`)의 명령, 종류, 격리, 외부 호출 정책, 통과 기준이다. 실행 중인 앱 QA(1~3절)와 따로 매 변경에 돈다.

### 4.1 검사 명령
- 전체: `make check` (아래 둘을 차례로 돈다. 하나라도 실패하면 0 이 아닌 값으로 끝난다)
- backend: `cd backend && ../.venv/bin/pytest -v tests/` (`backend/pytest.ini`: `asyncio_mode = auto`, `pythonpath = .`)
- frontend: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` (vitest run, eslint, 타입 검사)
- backend 용 lint·typecheck 명령은 없다 (미정).
- `make test` 는 `make check` 와 같다 (`check` 를 전제 조건으로 둔 빈 대상).

### 4.2 테스트 종류
| 종류 | 대상 | 위치 | 언제 돈다 |
|---|---|---|---|
| 단위 | backend API·서비스·수집기 | `backend/tests/test_*.py` (파일 21개, 테스트 217개 — 아래 Makefile·스크립트 회귀 4개 파일 43개 포함, `conftest.py` 와 흉내 도움 모듈 `llm_fakes.py` 별도) | 매 변경 |
| Makefile·스크립트 회귀 | Makefile 대상 집합·`.PHONY`·`SHELL`, 12개 대상 `make -n` 종료 0·stderr 없음, `test` = `check`, 레시피가 부르는 파일, `\|\| true`·`config.json` 읽기 전용 마운트 없음, `docker compose config -q`, `reset` 의 URL 변수, `docker-logs` 의 종료 130 처리(`test_make_targets.py`). `scripts/collect.py` 모드 선택·완료 판정(스텁 HTTP 서버, `test_collect_script.py`). 빈 DB 첫 수집 백그라운드·종료 때 취소(`test_startup_seed.py`). `sources.json` 저장의 `EBUSY` 대체 경로(`test_sources_write_fallback.py`). make 는 `-n` 으로만 부르고 대상을 실제로 실행하지 않는다 | `backend/tests/test_make_targets.py`, `test_collect_script.py`, `test_startup_seed.py`, `test_sources_write_fallback.py` | 매 변경 (`make check` 에 포함) |
| 단위 | frontend 컴포넌트·훅·공통 부품 (vitest, jsdom, MSW) | `frontend/src/tests/**/*.test.ts(x)` (파일 52개, 테스트 649개, 설정 `frontend/src/tests/setup.ts`). 공통 부품은 `ui/`, 피드 화면 부품은 `feed/`, 대화상자는 `modals/`, 훅은 `hooks/` | 매 변경 |
| 정적 검사 | 디자인 토큰 규칙. `TokenGuard` 는 `frontend/src/**/*.tsx` 에 hex 색 클래스·Tailwind 기본 팔레트 색 유틸리티·옛 애니메이션 클래스가, `globals.css` 에 `!important`·옛 테마 덮어쓰기 선택자가 없는지 본다. `TokenContrast` 는 `globals.css` 의 라이트·다크 토큰으로 WCAG 대비(글자 4.5:1, 경계·포커스 링 3:1)를 계산한다. 아이콘 규칙: `IconGuard` 는 `frontend/src/components/**`·`frontend/src/app/**` 의 `.ts`·`.tsx` 글자에 그림 이모지(`/\p{Emoji_Presentation}\|\p{Extended_Pictographic}\u{FE0F}/gu`, 텍스트 표현 기호 `©`·`↔` 등은 제외)가 없는지 본다 (허용 목록 없음) | `frontend/src/tests/design/TokenGuard.test.ts`, `TokenContrast.test.ts`, `frontend/src/tests/ui/IconGuard.test.ts` (vitest 로 돈다) | 매 변경 (`make check` 에 포함) |
| 화면 측정 | 폭별 화면 규칙: 문서 가로 스크롤, 헤더 높이·한 줄, 첫 화면 카드, 768px 미만 44px 터치 영역, 대화상자 접근성 속성과 Escape, viewport 확대 허용, 폭별 기능 진입점. 그리고 측정 상태마다 판정 21종(아래 표). `/`·`/chat` × 라이트·다크 × 360·390·768·1024·1440px, `/` 의 대화상자·레이더 펼침, `/chat` 의 기사 맥락·없는 기사·포커스 필터 열림 상태 포함 (모두 160조합). 브리핑 데이터가 없으면 일일 브리핑 상태의 판정은 `skipped`(미검증) | `frontend/scripts/ui-audit.mjs` (puppeteer-core), 판정 검증용 `frontend/scripts/ui-audit-fixtures/*.html` | 화면을 바꿨을 때 수동, 프로덕션 빌드 대상 (`make check` 밖) |
| 계약 | zod 스키마 ↔ MSW 핸들러 | `frontend/src/tests/chat/ContractAndMsw.test.ts` | 계약 변경 시 (`make check` 에 포함) |
| 통합·회귀 | 두 앱을 함께 | 없음 | 릴리스 전 (아래 미정) |

- DB 격리: `backend/tests/conftest.py` 가 `DATABASE_URL` 을 `backend/tests/test_agentlens.db` 로 바꾸고 스키마를 만든다. 데이터는 지우지 않아 실행할 때마다 쌓인다. 개발 DB `agentlens.db` 는 쓰지 않는다.
- LLM 격리: `conftest.py` 의 autouse fixture `llm_isolation` 이 모든 테스트에서 LLM 설정 원천을 비운다 (환경 변수 `ANTHROPIC_API_KEY`·`OPENAI_API_KEY`·`GEMINI_API_KEY`·`OLLAMA_BASE_URL`·`OLLAMA_MODEL` 제거, `settings` 의 같은 필드, `llm_processor.openai_key`·`ollama_url` 을 `None`). 그 위에 `settings.ANTHROPIC_API_KEY = "sk-ant-test-fake"` 를 둬 흉내 Claude 를 쓰는 상태가 기본이다. `Settings.model_config["env_file"]` 을 `None` 으로 둬 `settings.reload()` 가 `.env` 를 다시 읽지 않는다. 그래서 `.env` 의 키, 로컬 Ollama 상태, 설치된 모델과 상관없이 결과가 같다.
- LLM 흉내: `backend/tests/llm_fakes.py` 가 `httpx`·`httpx2`(openai SDK 가 쓰는 전송)의 기본 전송 `handle_request`·`handle_async_request` 를 감싼다. `api.anthropic.com`, `api.openai.com`, `generativelanguage.googleapis.com`, 포트 11434 인 모든 호스트, 테스트가 등록한 흉내 Ollama 주소로 가는 요청은 흉내가 답한다 (흉내 Claude 는 늘 등록, OpenAI·Ollama 는 테스트가 등록). 흉내가 등록되지 않은 LLM 호스트 요청은 보내지 않고 `ConnectError` 를 내며 기록하고, fixture 정리 단계에서 그 테스트를 실패시킨다 (가드). 그 밖의 호스트는 실제로 나간다. `ASGITransport` 와 `httpx.AsyncClient.post`·`.stream` 을 직접 patch 한 테스트는 이 계층을 거치지 않는다.
- 프로바이더 조건 조절: fixture `llm_sources` 가 Anthropic 키까지 비운 뒤 테스트가 원천(`settings`·환경 변수·테스트별 `config.json` 사본)과 덮어쓰기를 하나씩 켠다. `fake_llm` 은 흉내 객체(등록, 요청 기록 `requests(provider, path)`, `assert_no_unmocked`, `take_unmocked`)다.
- 설정 파일 격리: 세션 fixture 가 루트 `config.json`(LLM 키 세 개와 `ollama_base_url` 을 비운 것)과 루트 `sources.json` 의 사본을 세션 임시 폴더에 만든다. autouse fixture 가 `app.config.find_config_json`·`app.config._json_data`, `sources_service._file_path`·`_mirror_path` 를 이 사본으로 돌린다. 원본은 읽기만 하고, 테스트 사이 상태는 세션 동안 사본으로 이어진다.
- 테스트 개수 요약과 영역별 커버리지는 이 문서 5~6절, 파일별 테스트 목록은 `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md`·`docs/frontend-tdd-engineer/01_TDD_CYCLE_LOG.md`.
- frontend 는 `frontend/src/mocks/server.ts` 의 MSW 로 backend 를 대신한다. `setup.ts` 는 jsdom 에 없는 `window.matchMedia` 를 폭 1280px 데스크톱으로 가정한 mock 으로 채운다. 폭별 동작을 보는 테스트는 이 mock 을 바꿔 쓴다.
- jsdom 은 레이아웃을 계산하지 않는다. 크기·위치·넘침은 vitest 로 확인하지 않고 `ui-audit.mjs` 로 잰다.
- `ui-audit.mjs` 실행: 프로덕션 빌드 앱을 띄운 뒤(`make docker-up` 또는 `cd frontend && pnpm build && pnpm start`, 기본 주소 `http://localhost:3001`, 바꾸려면 `--base`) `cd frontend && node scripts/ui-audit.mjs`. 개발 서버(`next dev`)는 대상이 아니다: 페이지에 개발 표시기(`nextjs-portal`)가 있으면 환경 오류로 종료 2 다. 로컬 Chrome 이 필요하다 (`CHROME_PATH`, 없으면 흔한 설치 경로를 찾는다). 결과는 `--out` 폴더의 `report.json`(측정 상태마다 `checks.<판정>` = 통과 여부·대상 수·실패 목록, `environment.commit`·`devIndicator`)과 PNG(`--screenshots key` 기본: `/`·`/chat` × 5개 폭 × 라이트·다크 20장 + 뉴스 상세·일일 브리핑 × 390x844·1440x900 라이트 4장)다. 종료 코드는 0 통과, 1 실패 하나 이상, 2 사용법·환경 오류다. 수집된 기사·브리핑이 없으면 첫 화면 카드·뉴스 상세 등 해당 항목은 `skipped` 로 남고 실패로 치지 않지만, `rowAlign`·`vRhythm`·`chatAlign`·`toast`·`feedAreas`·`chatHeader`·`briefing`·`cardFooter` 는 측정 상태에 대상이 없으면 `대상 없음` 실패다 (`frontend/scripts/ui-audit.mjs:1-222`).
- `ui-audit.mjs --self-test`: 앱 없이 판정 자체를 검증한다. `scripts/ui-audit-fixtures/` 의 `defects.html`(`data-expect` 요소마다 그 판정이 실패해야 함), `clean.html`(모든 판정이 대상이 있고 통과해야 함), `dev-indicator.html`(개발 서버 환경 오류로 판정해야 함)이 모두 맞으면 종료 0, 하나라도 틀리면 1. fixture 는 1440 폭으로 한 번 열고, 768px 미만 판정을 보려고 `[data-self-test-narrow]`·`[data-self-test-both]` 영역만 360 폭으로 한 번 더 연다 (`clip`·`scrollRow`·`occluded`. `toolbarLayout`·`chatScope` 는 360 폭의 `[data-self-test-narrow]` 영역에서만, `feedAreas` 는 1440 에서 그 영역 밖과 360 에서 그 영역 안 둘 다 돈다). `defects.html` 에는 21종 판정마다 `data-expect` 가 하나 이상 있어야 한다. `data-expect` 는 어느 폭에서든 잡히면 맞지만 `[data-self-test-both]` 안의 것은 두 폭 모두에서 잡혀야 맞고, `data-expect-reason` 이 있으면 실패 이유에 그 글자가 있어야 맞다. `clean.html` 은 두 폭 모두 실패 0. fixture 에는 잘린 스크롤 영역(세로·가로), 잘린 배지 줄, 알파 0 배경 감싸개, 선택 칩이 줄 밖·흐림에 겹친 줄, 왼쪽 표시 없는 줄, 줄을 덮는 표시, 소스 줄 안에 숨은 `Must-Read` 토글(두 폭), 스크롤바를 숨기지 않은 가로 스크롤 영역에 잘린 버튼(360 `clip`), 소스 줄·토글·정렬이 한 줄인 좁은 필터 영역과 토글·정렬이 아래 줄로 내려간 필터 영역(360), 칩 줄 안·칩 줄 사이 검색과 칩 줄 안 정렬(1440·360), 요약 바 아래 간격 30px, 원천 지표가 없는 카드의 점수·인기 점수, 이관 버튼 글자가 숨거나 카드 밖으로 넘친 바닥 줄, 360 에서 넘친 모드 탭, 영어 범위 용어·옛 이관 용어, 기록 버튼이 앞인 챗 헤더, 그림 이모지 라벨, 설정 두 곳·헤드라인 두 번·다른 분야 이름의 브리핑, 두 번 나온 모델 선택, 피드와 다른 포커스 필터 라벨 같은 고정 결함과 그 고친 형태가 짝으로 있다 (fixture 규격은 `docs/ui-system-designer/02_DESIGN_SYSTEM.md` 8.4절). 판정 코드를 고쳤으면 먼저 돌린다.
- `ui-audit.mjs` 판정 (측정 상태마다 `clip`·`placeholder`·`occluded`·`scrollRow`·`ariaControls`·`keepAll` 을 돌리고, 나머지는 해당 상태에서만):

| 판정 | 실패 조건 | 대상 |
|---|---|---|
| `clip` | 조작 요소·글자 요소가 부모 clip 상자 밖이나 화면 밖으로 1px 넘게 나감, 말줄임 없는 글자 넘침, 스크롤 영역 상자 자체가 같은 축의 바깥 clip 상자에 1px 넘게 잘림(`스크롤 영역이 부모 상자 밖으로 세로/가로 잘림`, 스크롤 영역에 한 번만 남김). 가로 잘림 가운데 `data-scroll-row` 줄 안의 것과, 768px 이상에서 스크롤바를 CSS 로 숨기지 않은 가로 스크롤 영역 안의 것은 `scrollRow` 몫이다 (768px 미만은 오버레이 스크롤바라 두 번째 면제가 없다) | 모든 상태 |
| `placeholder` | 빈 입력의 자리표시 글자 폭이 입력 내용 폭보다 1px 넘게 김 | 모든 상태 |
| `occluded` | 조작 요소의 가운데와 네 모서리 안쪽(4px) 다섯 점 중 하나가 다른 요소에 가려짐 | 모든 상태 |
| `scrollRow` | 넘친 스크롤 줄에 `data-overflow`·넘친 쪽 흐림이 없음, 768px 이상에서 넘친 쪽 스크롤 버튼이 없음, 1440px 에서 피드 `카테고리`·`소스` 그룹이 넘침, 줄의 `scroll-padding` 좌우가 24px 가 아님, 처음 상태의 선택 칩(`data-selected-selector`)이 넘친 쪽 흐림 24px 를 뺀 보이는 범위 밖, 768px 미만에서 넘친 쪽에 표시(`data-overflow-hint="start\|end"`)가 없거나 넘치지 않은 쪽에 있거나 표시가 줄과 겹침. 처음 상태의 피드 필터 영역(`[data-feed-toolbar]`)마다 `toolbar` 에 `{ viewport, mustReadVisible, mustReadRect }` 를 남기고, `Must-Read` 토글(`[data-must-read-toggle]`)이 하나가 아니거나 `소스` 그룹 안이거나 화면·툴바 상자 밖이거나 가운데 점이 가려졌거나 768px 미만에서 44×44 보다 작으면 `mustReadVisible: false` 로 실패 | 모든 상태 |
| `ariaControls` | `aria-controls` 가 문서에 없는 id 를 가리킴 | 모든 상태 |
| `keepAll` | 두 줄 이상 한국어 글자의 `word-break` 가 `keep-all` 이 아님 (`.markdown-viewer` 밖) | 모든 상태 |
| `rowAlign` | 같은 줄 뉴스 카드의 제목 top·카드 높이 차가 1px 넘음, 카드 머리줄 줄바꿈 | `/`, 768px 이상 |
| `vRhythm` | 요약 바 → 검색 영역, 검색 영역 → 필터 영역 첫 칩 줄, 필터 영역 마지막 칩 줄 → 목록 머리줄 세 간격 중 하나라도 12~16px 밖. 영역이 없으면 '대상 없음' 실패 | `/` |
| `chatAlign` | 챗 사이드바 머리 영역과 맥락 줄의 아래 경계가 다름, 맥락 줄·메시지 열·입력 영역 왼쪽 끝이 1px 넘게 다름 (맥락 줄 첫 조작 요소가 칠해진 위젯 상자 안이면 그 상자의 왼쪽 끝. 배경색은 `transparent`·`rgba(…, 0)`·`color(… / 0)`·`oklab(… / 0)`·`#rrggbb00` 등 표기와 상관없이 알파가 0 이면 칠하지 않은 것으로 본다) | `/chat`, 1024px 이상 |
| `toast` | 챗 경고 알림이 입력 영역 바로 위(16px 이내)가 아니거나, 768px 이상에서 메시지 열 좌우 밖 | `/chat?sourceId=999999999` |
| `toolbarLayout` | 768px 미만에서 피드 `소스` 줄의 보이는 폭이 `innerWidth − 85`(페이지 여백 16, 간격 8, 토글 44, 넘침 표시 16, 허용 1) 보다 좁음, 흐림 밖에 다 보이는 소스 칩이 2개 미만, `Must-Read` 토글이 없거나 소스 줄과 다른 줄이거나 오른쪽 끝이 콘텐츠 오른쪽 끝과 1px 넘게 다름, 필터 영역 안에 선택 상자·검색 입력이 있음. 768px 이상은 판정 없이 줄마다 폭·다 보이는 칩 수만 기록 | `/` 처음 상태 |
| `cardMetric` | 카드 통계에 종류 없는 `점수` 라벨, `github`·`hackernews`·`reddit` 밖 소스에 점수 통계, 소스와 지표 라벨이 다름(`github` 스타, `hackernews` 포인트, `reddit` 추천), `github` 개수가 `포크` 가 아님, `github`·`hackernews`·`reddit` 밖 소스에 인기 점수 통계. 소스별 카드 수·점수 표시 수·인기 점수 표시 수를 `summary` 에 기록. 보이면 안 되는 점수만 실패로 낸다: 지표가 있는 소스의 점수가 사라지는 경우는 이 검사가 잡지 않고 `NewsCard.test.tsx`·`FormControls.test.tsx`(지표 표) 단위 테스트가 잡는다 | `/` 처음 상태 |
| `chatScope` | 그룹 `검색 스코프 모드` 의 두 탭이 화면 밖이거나 맥락 줄 보이는 범위(흐림 24px 제외) 밖, 기사 칩이 없는데 맥락 줄이 넘침(`data-overflow` 가 `none` 이 아님) | `/chat` 기본·기사 칩·경고 알림 |
| `terms` | 보이는 글자가 `Scoped`·`Global` 이거나 `(Scoped)`·`(Global)` 포함, `Focus:` 로 시작, `코퍼스` 포함, global 탭 접근 이름이 `전체 소식` 이 아님, 보이는 버튼·링크·탭의 접근 이름이나 글자에 금지 용어(`Ask AI` 와 옛 이관 용어, 스크립트 상수 `EXPECT9.bannedTerms`)가 있음 (사용자 글 제외). 고정 목록만 보므로 새로 생기는 다른 영어 라벨은 잡지 않는다. 금지 용어는 `button`·`a`·`[role="tab"]` 의 접근 이름과 글자만 보고, 제목·본문 글자와 `title` 속성은 보지 않는다 (`frontend/scripts/ui-audit.mjs:1465-1472`) | `/chat` 모든 상태, `/` 처음 상태, 뉴스 상세 두 탭 |
| `modelPicker` | 보이는 `Claude 모델 선택` 버튼이 정확히 1개가 아니거나 질문 입력창 위에 있음 | `/chat` 기본 |
| `focusLabels` | 포커스 필터 창 그룹 `도메인 카테고리` 의 칩 글자가 `전체 소식`, `하네스 & 벤치마크`, `MCP & 생태계`, `에이전트 아키텍처`, `최신 AI 동향` 순서와 다름 | `/chat` 포커스 필터 열림 |
| `feedAreas` | 피드 검색 영역(`[data-feed-search]`)·목록 머리줄(`[data-feed-list-header]`)이 하나가 아님, 검색 입력·정렬이 제 영역 밖이거나 필터 영역 안에 검색 입력·선택 상자가 있음, 검색 → 필터 칩 줄 → 목록 머리줄 순서가 아니거나 검색 입력이 칩 줄과 겹침, 검색 입력·정렬 높이가 44(768px 미만)/36 이 아니거나 `Must-Read` 토글 높이가 같은 줄 소스 칩과 다름, 검색 입력 양 끝·목록 머리줄 왼쪽 끝·정렬과 토글 오른쪽 끝(768px 이상은 카테고리 줄 왼쪽 끝도)이 콘텐츠 상자 끝과 1px 넘게 다름, 목록 머리줄이 정렬보다 1px 넘게 높음(두 줄). 5개 폭의 rect 를 `layout` 에 기록 | `/` 처음 상태 |
| `chatHeader` | 챗 헤더의 보이는 첫 조작 요소가 `피드로 돌아가기` 링크가 아니거나, 그 링크가 다른 조작 요소보다 1px 넘게 오른쪽 | `/chat` 기본 |
| `pictograph` | 보이는 버튼·링크·탭·메뉴 항목·라디오·라벨·`h1`~`h3` 글자에 그림 이모지(`IconGuard` 와 같은 식). 마크다운 본문, 새 탭 외부 기사 링크, 사용자 글은 뺀다. 대상 선택자는 `button, a, [role="tab"], [role="menuitem"], [role="radio"], label, h1, h2, h3` 이라, 이 요소들 밖에 있는 `p`·`span`·`div` 글자(예: 본문 문단, 배지, 알림 문구)는 보지 않는다 (`ui-audit.mjs:1625`). 피드 `/` 기본 상태의 검사 목록에는 없어 그 상태에서는 돌지 않는다 (`:2146-2157`. 도는 상태는 `:1848-1849`, `:1862`, `:1901`, `:2157`) | `/chat` 기본·포커스 필터 열림, 뉴스 상세 두 탭, 일일 브리핑 |
| `briefing` | 일일 브리핑 대화상자에서 알림 밖 설정 버튼이 1개가 아님, 대화상자 설명(헤드라인)과 같은 글자가 다른 곳에 또 보임, `카테고리별 요약` 분야 머리글이 긴 라벨 4개 밖 | 일일 브리핑 |
| `cardFooter` | 카드 바닥 이관 버튼의 보이는 글자에 `AI 챗에서 분석` 이 없음(`sr-only` 는 안 보이는 것으로 봄), 버튼 묶음이 카드 안쪽 상자 밖으로 1px 넘게 나감, 통계 묶음과 버튼 묶음이 겹침 | `/` 처음 상태 |
- `pictograph` 와 `terms` 금지 용어 검사는 위 범위(조작 요소·라벨·제목 글자, 피드 `/` 기본 상태 제외)만 본다. 그 밖의 UI 글자는 정적 검사 `IconGuard`(`frontend/src/tests/ui/IconGuard.test.ts`)가 소스 수준에서 보완한다: `frontend/src/components/**`·`frontend/src/app/**` 의 `.ts`·`.tsx` 파일 글자 전체에서 그림 이모지를 찾는다 (`IconGuard.test.ts:15`). `frontend/src/lib/**`·`hooks/**`·`context/**` 는 대상이 아니다. 금지 용어는 `IconGuard` 가 보지 않는다 (그림 이모지만 본다).
- E2E 테스트는 없다. `ui-audit.mjs` 는 화면 규칙만 재고 기능 흐름을 검증하지 않는다.

### 4.3 외부 호출과 파일 부작용
`make check` 의 backend 테스트는 LLM 을 실제로 부르지 않고 git 이 추적하는 설정 파일을 고치지 않는다 (위 'LLM 격리'·'설정 파일 격리').
- LLM 호출(Anthropic, OpenAI, Ollama, Gemini)은 흉내가 답하거나 가드가 막는다. 실제 Claude 응답 확인은 `make check` 에 없다.
- `llm_processor.is_test_environment()` 는 pytest 중 True 지만, 막는 호출은 챗 ReAct 플래너 하나뿐이다. 답변 생성·스트리밍·수집 평가는 하네스의 흉내 Claude 를 쓴다.
- 남은 외부 호출 (네트워크 상태에 따라 결과가 바뀔 수 있다): scoped 챗 4개(스크래퍼가 github.com·example.com GET), `test_probe_and_discover_feed_github`·`test_source_researcher_inspect_url`·`test_deep_research_run_and_audit`(github.com 등), `test_notion_export_page_mock`(api.notion.com), `test_email_api_endpoints`(`config.json` 의 SMTP 호스트 연결 시도).
- 설정 파일을 쓰는 테스트(`test_briefing_settings_get_and_post` 의 `config.json`, `test_sources_toggle_and_crud`·`test_deep_research_run_and_audit` 의 `sources.json`)는 세션 사본에 쓴다. `make check` 뒤 `git status` 에 `config.json`·`sources.json`·`backend/app/config/sources.json` 변경이 없다.

### 4.4 통과 기준
- `make check` 종료 코드 0
- 버그 수정은 먼저 실패하던 테스트가 통과한다
- 계약을 바꿨으면 `ContractAndMsw.test.ts` 가 바뀐 계약으로 통과한다

### 4.5 고위험 영역의 추가 검사
- 지정한 고위험 영역이 없다.

### 4.6 릴리스 전 통합·회귀 검증
- `make check` 가 통과한다.
- 버전 문자열이 모두 새 버전인지 확인한다: `git grep -n '<새 버전>'` 로 `docs/releases.md` 의 '버전 문자열 위치' 를 대조한다.
- 두 앱을 함께 띄우는 통합 검사는 정하지 않았다. 하려면 `make docker-up` 을 쓴다: 두 컨테이너가 healthy 가 될 때까지 기다리고(기본 180초, `DOCKER_WAIT_TIMEOUT`) 아니면 실패로 끝난다. 이어서 `curl -f http://127.0.0.1:8000/health` 와 `curl -f http://127.0.0.1:3001/api/health` 로 확인하고 `make docker-down` 으로 내린다. Docker 에서 설정·소스를 저장하면 루트 `config.json`·`sources.json` 이 바뀌므로 끝나면 `git status` 를 본다. 로컬 개발 서버로는 `make dev` (준비되면 주소를 내고 Ctrl-C 로 둘 다 내린다).

### 4.7 실행 중인 앱 QA (이 문서 1~3절)
- 위 4.6 의 "두 앱을 함께 띄우는 통합 검사는 정하지 않았다" 를 보완해, 릴리스 전 QA 는 1~3절대로 `make docker-up`(이번에는 `BACKEND_PORT=18000`) → `qa_runner.py` → 시나리오 `curl` → Playwright UI → `ui-audit.mjs` → `make docker-down` → `git status` 순서로 한다. 결과는 `docs/qa-engineer/02_QA_TEST_REPORT.md`.

---

## 5. 자동 테스트 현황 요약

저장소의 테스트 코드를 읽어 정리한 현황이다. backend 개수는 `cd backend && ../.venv/bin/pytest --collect-only -q tests/` (수집만 함)로 확인했다 (2026-11-09, 21개 파일, 217개. 같은 날 `make check` 로 모두 통과). frontend 개수는 `cd frontend && pnpm test` 를 실행해 확인했다 (2026-11-07, 52개 파일, 649개 모두 통과). `pnpm exec vitest list` 는 `it.each` 를 한 줄로 세어 576개를 보인다 (`design/TokenContrast.test.ts` 가 3개, `modals/DeepResearcherTab.test.tsx` 가 2개, `feed/FeedToolbar.test.tsx` 가 20개, `NewsCard.test.tsx` 가 32개로 나온다).

| 구분 | 파일 수 | 테스트 수 |
|---|---|---|
| backend (`backend/tests/test_*.py`) | 21 (+ `conftest.py`, 흉내 도움 모듈 `llm_fakes.py`) | 217 |
| frontend (`frontend/src/tests/**/*.test.ts(x)`) | 52 (+ `setup.ts`) | 649 |

표기:
- **ASGI**: `httpx.AsyncClient(transport=ASGITransport(app=app))` 로 FastAPI 앱을 같은 프로세스 안에서 부른다. 이 호출 자체는 네트워크를 쓰지 않는다. `ASGITransport` 는 lifespan 이벤트를 보내지 않으므로 `backend/app/main.py:23-47` 의 lifespan(초기 수집, 스케줄러 시작)은 이 호출로는 돌지 않는다. lifespan 은 `test_startup_seed.py` 가 `app.router.lifespan_context` 로 따로 돌린다.
- **실호출**: mock 없이 외부 네트워크로 나가는 경로가 있다. 자세한 근거는 7절에 둔다. LLM 호스트(Anthropic, OpenAI, Gemini, 포트 11434)로 가는 요청은 여기에 들지 않는다: `conftest.py` 의 하네스가 모든 테스트에서 흉내로 답하거나 막는다.
- **흉내 Claude**: 테스트 코드에 LLM mock 이 없어 코드가 Anthropic 을 부르는 경로다. 하네스가 `settings.ANTHROPIC_API_KEY` 를 가짜 값으로 두고 `api.anthropic.com/v1/messages` 요청에 흉내 Claude 가 고정 한국어 마크다운 답(비스트림 JSON 또는 SSE)을 준다. `.env` 의 키, 로컬 Ollama 와 상관없다.

- v0.4.1 회귀 QA(2026-11-09 23:50)에서 `pytest --collect-only -q tests/` 로 backend 244개·파일 22개(`test_code_review_fixes.py` 27개 추가), frontend 테스트 파일 54개(`chat/ChatStreamTurn.test.tsx`, `feed/FeedSearch.test.tsx` 추가)를 다시 셌다. 바뀐 동작의 테스트(`test_code_review_fixes.py` 27개 통과, `ChatStreamTurn`·`FeedSearch`·`ExportToolbar`·`ContractAndMsw` 4개 파일 94개 통과)만 돌렸고 전체 `make check` 는 이번 QA 에서 돌리지 않았다. frontend 전체 664개는 변경 요약(코디네이터 전달)의 수치이고 이번 QA 에서 세지 않았다. 위 표는 v0.4.0 기준이다.
- 파일별 테스트 이름과 단언은 TDD 로그로 옮겼다: backend `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md`, frontend `docs/frontend-tdd-engineer/01_TDD_CYCLE_LOG.md`.

---

## 6. 기능 영역별 커버리지
"있음" 은 테스트가 검증하는 동작, "없음" 은 코드에 있지만 이를 직접 부르거나 단언하는 테스트를 찾지 못한 동작이다.

### 6.1 뉴스 피드 (NEWS)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 뉴스 목록 기본 조회, `size=1` 조회 | `test_api.py::test_news`, `test_ask_ai_endpoint` |
| 있음 | 통계, RSS 피드, 전체 삭제 | `test_api.py::test_stats`, `test_rss`, `test_reset_and_delete.py::test_delete_all_news_endpoint` |
| 있음 | 뉴스 카드 렌더링·북마크·선택·포커스, 고정 틀(머리줄 한 줄, 짧은 카테고리 라벨, 배지 줄과 기술 배지 줄어듦·말줄임·`title`, 머리줄 카테고리 `title` 긴 라벨, 바닥 인기 점수(원천 지표 소스만), 소스별 원천 지표(스타·포인트·추천)와 합성 점수·합성 인기 점수 숨김, GitHub 포크, `data-source`·`data-card-stat`·`data-metric`, 바닥 줄 줄바꿈과 모든 폭의 `AI 챗에서 분석` 글자, `시사점`, 반복이면 요약), 카드·상세 모달의 `AI 챗에서 분석` 이동 버튼 | `NewsCard.test.tsx`, `ui/Primitives.test.tsx`, `HandoverIntegration.test.tsx` |
| 있음 | 반복 시사점 판정(공백 정리, 끝 40자, 20자 미만 제외) | `feed/FeedInsights.test.ts` |
| 있음 | 뉴스 목록 MSW 핸들러와 `NewsItemSchema` 계약 | `ContractAndMsw.test.ts` (MSW News 절) |
| 있음 | 검색 영역·필터 영역(검색 영역 `[data-feed-search]` 전체 폭·`scroll-mt-20`, 필터 영역 안 검색 입력·선택 상자 없음, 카테고리·소스 칩과 건수, 소스 줄 오른쪽 끝 `Must-Read` 토글(위치·폭별 모양·같은 노드), 검색 제출·지우기, 고르면 1페이지, 줄 배치, 자리표시 `키워드 검색`, 768px 미만 소스 줄 왼쪽만 bleed·토글 같은 줄, 768px 이상 줄 B 그대로, 양쪽 넘침 표시(오른쪽은 토글 앞), 폭이 바뀌어도 같은 노드·포커스·값, 세 폭의 DOM 순서 `검색 → 카테고리 → 소스 → Must-Read`, 소스 줄 선택 칩) | `feed/FeedToolbar.test.tsx` |
| 있음 | 목록 머리줄(정렬 select 4개 선택지와 콜백·1페이지, 정렬이 상태 live 영역 밖·뒤, 상태 `aria-live`·페이지 글자, 한 줄 배치·위쪽 맞춤·상태 최소 높이, 폭이 바뀌어도 같은 정렬 노드) | `feed/FeedStatusBar.test.tsx` |
| 있음 | 요약 바(브리핑 버튼, 트렌드 레이더 펼침, 태그 선택·초기화, 폭별 표시, 다시 읽기 중 스켈레톤 없음, 레이더 카테고리 분포 배치·한국어 라벨) | `feed/InsightsBar.test.tsx`, `feed/TrendRadarPanel.test.tsx` |
| 있음 | 피드 훅의 다시 읽기(같은 조건이면 목록 유지·로딩 없음, 통계 실패해도 브리핑·레이더 반영, 실패 신호와 오류 구분) | `hooks/useNewsFeed.test.tsx` |
| 있음 | 기사 상세 대화상자(제목 이름, 탭과 화살표 키, 한국어 절 제목, `대화 초기화` 확인 창, 닫기, 바닥 출처 라벨, `AI 질의응답` 탭 입력 중 Escape, 답변 복사 실패 표시)와 질의응답 패널(자리표시, 빠른 질문 스크롤 줄, 빠른 질문 앞 lucide 아이콘) | `modals/NewsDetailModal.test.tsx`, `AskAiPanel.test.tsx` |
| 있음 | 피드 단축키의 오버레이 차단, Enter/Space 조건, 한글 자판 `e.code` 판정 | `HotkeyGating.test.tsx` |
| 없음 | 목록 필터·정렬·검색·페이지(`category`, `source`, `search`, `sort`, `high_signal_only`, `page`) | `backend/app/api/news.py:47-95` |
| 없음 | 단건 조회 `GET /api/news/{id}`, ask 의 404 | `backend/app/api/news.py:104-119` |
| 없음 | RSS 의 `category` 파라미터 | `backend/app/api/news.py:169-197` |
| 없음 | 피드 메인 화면 조립(`/` 단축키의 검색 영역 스크롤 포함), 피드 훅의 다시 읽기 밖 동작(필터 조합, 북마크 보기), 북마크 훅, 목록 머리줄 상태의 필터·북마크 배지 글자, 페이지 이동 | `frontend/src/app/page.tsx`, `frontend/src/hooks/useNewsFeed.ts`, `frontend/src/hooks/useBookmarks.ts`, `frontend/src/components/feed/FeedStatusBar.tsx`, `feed/FeedPagination.tsx` |
| 없음 | 프론트 API 클라이언트 함수(타임아웃, ask 스트림의 직접 연결·대체 경로) | `frontend/src/lib/api.ts:25-169` |

### 6.2 수집·분류·요약 (COLL)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 키워드 분류, dedup 해시, hotness 감쇠, 비 AI 잡음 거절 | `test_collectors.py` |
| 있음 | 품질 점수, 기술 스택 추출, TL;DR 합성 | `test_llm_processor.py` |
| 있음 | LLM 평가의 pre-filter 거절과 통과 | `test_collectors.py::test_evaluate_content_with_llm_strict_gate` (라이브 응답 의존) |
| 있음 | Anthropic 구조화 요약 파싱 | `test_anthropic_provider.py::test_anthropic_generate_structured_summary_with_caching` |
| 있음 | 기사 본문 스크랩(캐시, 단일 비행, 403/타임아웃, readability 대체, 빈 본문) | `test_agentic_workflow.py` 스크래퍼 테스트 5개 |
| 있음 | 초기화 후 재수집 엔드포인트 (수집은 mock) | `test_reset_and_delete.py::test_reset_and_collect_endpoint` |
| 없음 | 수집 오케스트레이션과 배치 저장(LLM 평가 → 합성 → 저장) | `backend/app/collectors/manager.py:72-259` |
| 없음 | 소스별 수집기 전부 | `backend/app/collectors/sources/arxiv.py`, `github.py`, `hackernews.py`, `huggingface.py`, `reddit.py`, `rss.py` |
| 없음 | 수동 수집 시작·진행률 엔드포인트 | `backend/app/api/schedule.py:43-67` |
| 없음 | 스케줄러 시작·중지와 예약 작업(수집, 딥 리서치, 브리핑 발송) | `backend/app/scheduler.py:11-68` (상수 `SCHEDULED_HOURS` 만 테스트) |
| 있음 | 헤더 수집 상태 버튼·즉시 수집(모바일 더보기)·초기화 확인 창과 창 안 오류, 수집 중 팔레트 초기화 비활성, 스케줄 대화상자의 즉시 수집·위험 영역 (API 는 mock) | `Header.test.tsx`, `modals/ScheduleModal.test.tsx` |
| 있음 | 수집 상태 복원(마운트 때 `is_running` 이면 수집 중·진행 폴링), `already_running` 응답 처리(수동 수집은 합류, 초기화는 거부), 이전 회차 진행 응답 무시, 오래된 스케줄 상태 응답 버리기(진행 폴링이 끝난 뒤 도착한 30초 재조회 응답, 더 나중 응답보다 늦게 온 응답)와 `수집 완료` 한 번 | `hooks/useCollector.test.ts`, `Header.test.tsx` |
| 없음 | 진행 줄 문구의 단계별 변화 | `frontend/src/hooks/useCollector.ts` |

### 6.3 AI 챗 (CHAT)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | global/scoped query·stream, 입력 검증(빈 값, 2000자 초과, 잘못된 scope, 없는 출처) | `test_chat.py` |
| 있음 | v0.4.1 리뷰 수정: 세션 메시지 id 중복 건너뛰기, 딥 리서치 `is_running` 복구·발굴 후보 우선, `owner/repo`·URL id 토글·삭제, `/stream` 의 본문·`model_tier`·메시지 id 검증 400, 기사 Ask AI 부분 실패 뒤 폴백 안 붙임, Anthropic 스트림 `error`·`max_tokens` 를 오류로, 챗 스트림 `event: error` 로 끝냄, 클라이언트 id 로 한 턴 한 번 저장, `done` 앞 저장 | `backend/tests/test_code_review_fixes.py` (27) |
| 있음 | v0.4.1 프론트: 바꾼 티어로 전송, 한 턴 세션 저장 POST 1번(StrictMode 포함), 끊긴 스트림 오류 표시·저장 안 함, 클라이언트 메시지 id, 재시도 새 id, 부분 답 아래 끊김 오류, 중단 처리 / 검색 디바운스·1페이지·Enter | `chat/ChatStreamTurn.test.tsx` (8), `feed/FeedSearch.test.tsx` (2) |
| 있음 | ReAct 흐름(검색 도구, 잡담 생략, LLM planner, 인용 필터) | `test_agentic_workflow.py` |
| 있음 | 503/502/429 오류 매핑(stream 사전 검사, query), 스트림 중간 오류 이벤트 | `test_chat.py` 7개 |
| 있음 | FTS 검색, 품질 컷, 포커스 필터, 시간 완화, 동적 출처 수, LIKE 대체 | `test_chat.py`, `test_dynamic_rag_retrieval.py` |
| 있음 | 세션 CRUD, FIFO 30, 자동 제목, 스트림 자동 저장, 오류 분기 | `test_chat_sessions.py` |
| 있음 | 3-tier 모델 해석·라우팅, Anthropic HTTP·SSE·오류 매핑, 모델명 보존 | `test_anthropic_provider.py`, `test_scoped_chat_grounding.py` |
| 있음 | 챗 화면 전체(스트림, 중지, 재시도, 필터, 모델 변경, 입력창 아래 모델 선택 하나, 세션 복원·삭제)와 하위 컴포넌트, 검색 범위 용어(`단일 기사`·`전체 소식`: 탭 접근 이름, 세션 배지·접근 이름, 없는 기사 알림, 캡슐 `포커스:`), 포커스 필터 창 카테고리 칩 긴 라벨 순서, 모델 티어 lucide 아이콘(`data-tier-icon`), 카드·배너 이관 버튼 이름 `AI 챗에서 분석` | `frontend/src/tests/chat/*.test.tsx` |
| 있음 | 프론트 채팅 계약(zod)과 MSW 핸들러 | `ContractAndMsw.test.ts` |
| 없음 | API 수준 401(키 누락)·529(과부하) 응답 | `backend/app/api/chat.py:212-237`, `350-375` (프론트 MSW 트리거만 있음) |
| 없음 | 대화 history 를 담은 요청이 프롬프트에 반영되는지 | `backend/app/services/chat_service.py:222` `_build_grounding_prompt` (backend 테스트 중 history 를 보내는 것이 없다) |
| 없음 | 보조 웹 검색 전체 흐름 `evaluate_and_search` | `backend/app/services/agentic_search.py:221-246` (단위 함수만 테스트, 서비스 호출처 없음) |
| 없음 | 뉴스 상세 질의응답 탭의 답 스트림 처리·오류 분기 | `frontend/src/components/NewsDetailModal.tsx`, `frontend/src/lib/api.ts:70-169` (`modals/NewsDetailModal.test.tsx` 는 빠른 질문 전송과 대화 추가까지만 단언한다) |

### 6.4 브리핑·공유 (BRF)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 오늘 브리핑 구조(제목, 4개 카테고리, action_items) | `test_briefing_notion_email.py::test_today_briefing_structure`, `test_api.py::test_daily_briefing_endpoint` |
| 있음 | Notion ID 정리, 연결 테스트, 페이지 생성(POST mock), 엔드포인트 | `test_briefing_notion_email.py` |
| 있음 | 이메일 HTML, SMTP 연결 테스트(mock), 엔드포인트 | `test_briefing_notion_email.py` |
| 있음 | 브리핑 설정 조회·저장 | `test_briefing_notion_email.py::test_briefing_settings_get_and_post` |
| 있음 | 웹훅 제공자 판별, payload 생성, 잘못된 URL 400 | `test_trends_and_webhook.py` |
| 있음 | 챗 답변 내보내기(마크다운 복사, .md 다운로드. v0.4.1 에서 가짜 `Notion 동기화` 버튼·`onNotionSuccess`·`messageId` 제거) | `ExportToolbar.test.tsx` (4) |
| 없음 | 브리핑 재생성 `POST /api/briefing/generate` | `backend/app/api/briefing.py:40-53` |
| 없음 | 자동 발송(Notion/이메일/웹훅) | `backend/app/services/briefing_service.py:210-259` |
| 없음 | 웹훅 실제 전송과 브리핑 웹훅 엔드포인트 | `backend/app/services/webhook_service.py:17-32`, `154-162`, `backend/app/api/webhook.py:28-43` |
| 없음 | 이메일 브리핑 발송 본체 | `backend/app/services/email_service.py:226-266` |
| 있음 | 공유 & 알림 설정 대화상자(탭 3개, 비밀값 보기 토글, 바닥 `연결 테스트`·`저장`·`닫기`, 저장 결과 안내, 배경 클릭으로 안 닫힘) | `modals/BriefingSettingsModal.test.tsx` |
| 있음 | 요약 바의 브리핑 버튼 | `feed/InsightsBar.test.tsx` |
| 있음 | 일일 브리핑 대화상자의 `이메일 발송` `aria-controls`(주소 입력 줄이 열렸을 때만), 설정 진입 한 곳(`브리핑 작업` 메뉴에 없음), 헤드라인 한 번, 분야 머리글 긴 라벨·lucide 아이콘, 개요 분야 이름 바꾸기, 시사점 아이콘 | `modals/DailyBriefingModal.test.tsx` |
| 없음 | 일일 브리핑 대화상자의 나머지 동작(Notion 발행, 이메일 발송 요청, 복사·다운로드, 탭), 설정 대화상자의 `연결 테스트` 요청, 웹훅 설정 모달 | `frontend/src/components/DailyBriefingModal.tsx`, `BriefingSettingsModal.tsx:230` 이하, `WebhookSettingsModal.tsx` |

### 6.5 소스·리서치 (SRC)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | sources 읽기, 활성 피드, RSS 추가·토글·삭제(서비스) | `test_sources_and_research.py` |
| 있음 | 후보 탐색(카탈로그), URL 검사(GitHub), 후보 등록 | `test_sources_and_research.py` |
| 있음 | 딥 리서치 피드 탐지·평가·실행·감사 로그·API | `test_deep_researcher.py` |
| 있음 | 소스 목록 계약(`SourceConfigSchema`) | `ContractAndMsw.test.ts` |
| 없음 | 소스 관리 API(RSS 추가, GitHub 저장소 추가, 토글, 삭제) | `backend/app/api/sources.py:49-91` |
| 없음 | GitHub 저장소 추가 서비스 | `backend/app/services/sources_service.py:222-243` |
| 없음 | `POST /api/research/inspect-url` | `backend/app/api/research.py:24-33` |
| 없음 | 일반 웹사이트(HTML link 태그, 표준 경로 탐침) 피드 탐지 | `backend/app/services/source_researcher.py:204-268`, `deep_researcher.py:223-265` (테스트는 GitHub 분기만 지난다) |
| 있음 | 소스 대화상자(첫 탭, 소스별 `Switch`·삭제 버튼, 삭제 `ConfirmDialog`, Escape 는 확인 창만, 배경 클릭으로 안 닫힘, `새 피드 직접 등록` 의 `aria-controls`, 카테고리 선택지 긴 라벨) | `modals/SourcesModal.test.tsx` |
| 있음 | 딥 리서처 탭 지표 값의 줄바꿈(말줄임 없음) | `modals/DeepResearcherTab.test.tsx` |
| 없음 | `Switch` 를 눌렀을 때의 토글 요청, RSS 추가 폼 제출, 딥 리서처 실행·감사 일지 동작 | `frontend/src/components/SourcesModal.tsx:107`, `sources/SourcesListTab.tsx:66`, `sources/DeepResearcherTab.tsx` |

### 6.6 MCP 서버 (MCP)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | `/api/mcp/info` 응답의 tools 개수 (정적 목록) | `test_api.py::test_mcp_info` |
| 없음 | MCP 도구 4개의 실제 동작 | `backend/app/mcp/server.py:10-50` |
| 없음 | MCP 안내 모달 | `frontend/src/components/McpModal.tsx` |

### 6.7 UI 공통 (UI)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 테마 시스템, 단축키, 커맨드 팔레트(자리표시 `명령어 검색 또는 바로가기` 포함) | `ThemeSystem.test.tsx`, `HotkeyListener.test.tsx`, `CommandPalette.test.tsx` |
| 있음 | 가로 넘침 방지 클래스, 모바일 viewport(확대 허용)·가상 키보드 | `ResponsiveLayout.test.tsx`, `MobileViewport.test.tsx` |
| 있음 | 헤더(빌드 버전 배지와 값이 없을 때, `주 메뉴` 의 "AI 챗" 링크, 폭별 더보기 항목, ⌘K, 팔레트 추가 명령) | `Header.test.tsx`, `HandoverIntegration.test.tsx` |
| 있음 | 디자인 토큰 규칙(`.tsx` 의 hex·팔레트 색 클래스, `globals.css` 의 `!important` 없음)과 라이트·다크 토큰 대비 | `design/TokenGuard.test.ts`, `design/TokenContrast.test.ts` |
| 있음 | UI 글자의 그림 이모지 금지(`components/**`·`app/**` 정적 검사, 텍스트 표현 기호 허용) | `ui/IconGuard.test.ts` |
| 있음 | 공통 부품(대화상자·드로어·확인 창과 처리 중 포커스, 메뉴·팝오버·테마 메뉴, 탭과 `aria-controls`·스크롤 줄, 토스트와 `composer`·전역 영역 고르기·한 번만 알리기, 입력·표시 부품과 `Badge shrink`, 긴·짧은·레이더 라벨, 카드 지표 표·검색 범위 라벨), 가로 스크롤 줄(`ScrollRow`: 넘침 상태, 흐림, 768px 이상 버튼과 사라질 때 포커스 유지, 768px 미만 넘친 쪽마다 표시·보이지 않는 자리, 상태별 `bleed`, `scroll-px-6`·`data-selected-selector`, 선택·포커스 항목 보이기와 크기 변화 뒤 다시 보이기, 입력 신호 뒤 `scroll` 만 사용자 스크롤로 보는 판정과 가로 의도 휠만 입력 신호로 세기, 스냅 위치 고르기), 오버레이 스택(Escape 맨 위만, `inert`, 같은 렌더 부모·자식 순서), 복사 훅, `useMediaQuery` | `ui/*.test.tsx` |
| 있음 | 챗 헤더의 폭별 "새 대화" 표시 조건, 헤더에 모델 선택 없음, `피드로 돌아가기` 가 헤더 첫 조작 요소(기록 버튼 앞), 기록 버튼 `aria-controls`(열렸을 때만), 추천 질문 왼쪽 정렬·앞 lucide 아이콘·이모지 없이 보내기, 기사 칩 짧은 카테고리 라벨 | `chat/ChatHeader.test.tsx`, `chat/ChatMessageList.test.tsx`, `chat/ActiveSourceChip.test.tsx` |
| 있음 | 트렌드 태그 분류와 레이더 응답 형식 | `test_trends_and_webhook.py` |
| 없음 | 트렌드 레이더 집계 로직의 값 | `backend/app/services/trend_service.py:40-139` (키 존재만 단언) |
| 없음 | 폭별 화면 규칙(문서 가로 스크롤, 헤더 높이·한 줄, 첫 화면 카드, 44px 터치 영역, 잘림·자리표시 길이·가림, 카드 줄 맞춤, 세로 간격, 피드 세 영역 배치·끝 맞춤, 카드 바닥 글자, 챗 열 맞춤, 챗 알림 위치). jsdom 은 레이아웃을 계산하지 않는다. `frontend/scripts/ui-audit.mjs` 가 실행 중인 앱에서 따로 잰다 (`make check` 밖) | `frontend/src/app/page.tsx`, `frontend/src/components/chat/ChatWorkspace.tsx` |
| 없음 | 첫 그리기 전 테마 적용 인라인 스크립트 | `frontend/src/app/layout.tsx:23-32` |
| 없음 | 프론트 헬스 라우트, 챗 페이지 래퍼 | `frontend/src/app/api/health/route.ts`, `frontend/src/app/chat/page.tsx` |

### 6.8 설정·DB
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | config.json 탐색·로드, 임의 값 조회, 버전, 기본 모델 | `test_config_and_live_llm.py`, `test_dynamic_rag_retrieval.py::test_version_0_2_2_consistency`, `test_anthropic_provider.py::test_anthropic_config_and_schema_defaults` |
| 있음 | 설정 저장(`save_json_config`) 성공 경로 | `test_briefing_settings_get_and_post` |
| 있음 | 스키마 생성(fixture), FTS 테이블 동기화, 채팅 저장 컬럼(model_tier, usage) | `conftest.py`, `test_dynamic_rag_retrieval.py::test_ensure_fts_table_creates_table_and_indexes_items`, `test_anthropic_provider.py::test_chat_session_persistence_with_model_tier_and_usage` |
| 없음 | production 모드 SECRET_KEY 길이 검사 | `backend/app/config.py:140-141` |
| 없음 | 설정 저장 실패 경로(500) | `backend/app/config.py:171-173`, `backend/app/api/briefing.py:208-209` |
| 없음 | 옛 DB 의 컬럼 추가(ALTER) 분기 | `backend/app/database.py:49-70` |
| 있음 | 앱 lifespan 의 빈 DB 첫 수집(백그라운드, 종료 때 취소)과 기사가 있을 때 건너뜀 (스케줄러·스키마는 흉내) | `test_startup_seed.py` |
| 있음 | `sources.json` 저장의 `replace` 실패(`EBUSY`) 대체 경로와 평소 원자적 교체 | `test_sources_write_fallback.py` |
| 있음 | Makefile 대상 집합·`.PHONY`·`SHELL`, 12개 대상 `make -n`, `test` = `check`, 레시피가 부르는 파일, `\|\| true`·`config.json` 읽기 전용 마운트 부재, compose 파일 유효성, `reset` URL 변수, `docker-logs` 종료 130 처리 | `test_make_targets.py` |
| 없음 | 앱 lifespan 의 스케줄러 시작·중지와 실제 스키마 생성 | `backend/app/main.py:25-26, 46-47` |
| 없음 | 프론트 환경변수 검증 | `frontend/src/lib/env.ts` |

## 7. 외부 호출 판정
판정 기준: "외부 호출함" 은 mock 없이 인터넷 호스트로 요청을 보내는 경로가 테스트에서 항상 실행된다는 뜻이다. "조건부" 는 키·설정·캐시·로컬 서비스 상태에 따라 갈린다. 로컬호스트(Ollama, jsdom origin) 요청은 판정 칸에 "로컬" 로 따로 적는다.

### 7.1 예전에 미확정이던 외부 호출 가능성 항목
| 항목 | 판정 | 근거 `path:line` |
|---|---|---|
| `config.py` 가 `.env`, `backend/.env` 를 읽는가 | import 때 읽지만 테스트에는 반영되지 않는다 | `backend/app/config.py:8-10` 이 import 시 `cwd/.env`, `cwd/backend/.env`, `cwd.parent/.env`, `backend/.env` 를 `load_dotenv(override=False)` 로 읽고, `config.py:102-105` 의 pydantic `env_file` 도 같은 파일을 읽는다. `make check` 는 `backend/` 에서 pytest 를 돌리므로 `backend/.env` 와 루트 `.env` 가 모두 읽힌다. 테스트마다 `llm_isolation` 이 LLM 환경 변수를 지우고 `settings` 의 LLM 필드를 고정하며 `env_file` 을 `None` 으로 둬 `settings.reload()` 도 `.env` 를 다시 읽지 않는다 (`backend/tests/conftest.py`) |
| `is_test_environment()` 가 라이브 호출을 막는가 | 막지 않는다 (ReAct planner 1곳만 막는다) | 조건: `settings.TESTING` 이 참, 환경변수 `TESTING` 또는 `CI` 가 true/1/yes, 또는 `"pytest" in sys.modules` (`backend/app/services/llm_processor.py:288-299`). pytest 실행 중에는 마지막 조건으로 항상 True 다. 호출처는 `backend/app/services/chat_service.py:381` 한 곳뿐이고, global 챗의 planner LLM 호출만 건너뛴다. `generate_live_answer`(`llm_processor.py:340`), `stream_tokens`(`:404`), `evaluate_content_with_llm`(`:619`), `answer_question_with_meta`(`:787`), `stream_question_answer`(`:901`), `has_live_provider` 의 Ollama 탐침(`:171-194`)은 이 판정을 보지 않는다. 테스트 중 실제 LLM 호출은 하네스가 막는다 |
| `conftest.py` 의 환경변수 설정 | `DATABASE_URL` 을 바꾸고, 테스트마다 LLM 환경 변수 다섯 개를 지운다 | `backend/tests/conftest.py:6-7`, `llm_isolation`. `TESTING`, `CI` 는 설정하지 않는다. `config.py:131-132` 는 `TESTING` 환경변수가 있을 때만 `settings.TESTING` 에 반영한다 |
| `test_config_and_live_llm.py::test_config_json_found_and_loaded`, `test_get_custom_json_value` | 안 함 | 설정 파일 읽기만 한다 (`config.py:14-35`) |
| `test_config_and_live_llm.py::test_llm_processor_fallback_and_answer` | 안 함 (흉내 Claude) | `answer_question` → `answer_question_with_meta` (`llm_processor.py:974-977`, `756-792`) → `_generate_live_answer` → `generate_live_answer` → `httpx.AsyncClient.post("https://api.anthropic.com/v1/messages")` (`anthropic_provider.py:233-234`) 를 하네스의 흉내 Claude 가 받는다. 예외: 같은 프로세스에서 `test_anthropic_provider.py::test_anti_gemini_stream_question_answer_never_yields_gemini` 가 먼저 돌면 같은 캐시 키(제목+질문)로 휴리스틱 답이 `_qa_cache` 에 들어가고(`llm_processor.py:971`), 이 테스트는 캐시를 돌려받아 호출하지 않는다(`llm_processor.py:765-768`). 파일 이름순 실행에서는 그 테스트가 먼저 돈다 |
| `test_deep_researcher.py::test_probe_and_discover_feed_github` | 외부 호출함 | GitHub 분기(`deep_researcher.py:216-221`) → `_fetch_and_parse_feed` 가 `https://github.com/All-Hands-AI/OpenHands/releases.atom` 을 httpx GET 하고 `feedparser.parse(resp.text)` 로 로컬 파싱한다(`deep_researcher.py:267-278`). 네트워크가 없으면 status 가 success 가 아니어서 실패한다 |
| `test_deep_researcher.py::test_evaluate_and_decide_scoring` | 안 함 | `evaluate_and_decide` 는 sources.json 읽기와 휴리스틱 점수만 쓴다 (`deep_researcher.py:304-374`, `llm_processor.py:516-580`) |
| `test_deep_researcher.py::test_deep_research_run_and_audit` | 외부 호출함 (파일 쓰기 가능) | `run_deep_research(max_candidates=2)` 가 시드 앞 2개(`https://lilianweng.github.io`, `https://eugeneyan.com`, `deep_researcher.py:23-31`, `395-412`)를 probe 한다: 페이지 GET, 표준 경로 HEAD 탐침, 피드 GET (`deep_researcher.py:223-263`, `269-271`). 점수 8.2 이상이면 `sources_service.add_rss_source` 로 sources.json 에 추가하고(`deep_researcher.py:441-449`) 테스트는 지우지 않는다. 네트워크가 실패해도 REJECTED 로그가 남아 테스트는 통과한다 |
| `test_deep_researcher.py::test_deep_research_api_endpoints` | 조건부 | `/status`, `/audit-logs` 는 호출 없음. `POST /run-deep?max_candidates=1` 은 `asyncio.create_task(run_deep_research(...))` 로 시드 1개 probe 를 시작한다(`backend/app/api/research.py:87`). 테스트는 응답만 확인하고 끝나므로, 테스트 이벤트 루프가 닫히기 전까지 태스크가 어디까지 진행되는지는 확인하지 못했다 |
| `test_sources_and_research.py::test_sources_service_load`, `test_sources_service_active_feeds` | 안 함 | sources.json 읽기 (`sources_service.py:36-45`, `134-139`) |
| `test_sources_and_research.py::test_sources_toggle_and_crud` | 안 함 (파일 수정함) | `add_rss_source`·`toggle_source`·`delete_source` 가 매번 `save_sources` 로 파일을 쓴다 (`sources_service.py:169-220`, `245-262`, `102-132`) |
| `test_sources_and_research.py::test_source_researcher_discover` | 안 함 | `discover_sources` 는 메모리 상수 `CURATED_ECOSYSTEM_CATALOG` 만 거른다 (`source_researcher.py:331-383`). docstring 의 "live feed probing" 과 달리 네트워크 호출이 없다 |
| `test_sources_and_research.py::test_source_researcher_inspect_url` | 외부 호출함 | GitHub 분기(`source_researcher.py:193-198`) → `https://github.com/princeton-nlp/SWE-bench/releases.atom` httpx GET 후 feedparser 파싱 (`source_researcher.py:270-281`). 실패하면 status 가 found 가 아니어서 실패한다 |
| `test_sources_and_research.py::test_sources_and_research_api_endpoints` | 안 함 (파일 수정함) | `GET /api/sources` 는 파일 읽기, `POST /api/research/discover` 는 메모리 카탈로그, `register-candidate` 는 `add_rss_source` 로 파일을 쓰고(`source_researcher.py:397-404`) 테스트 끝에서 `delete_source` 로 지운다 (finally 블록이 아니다) |
| `test_sources_toggle_and_crud` 가 고치는 sources.json | 세션 임시 사본 (저장소 루트 `sources.json` 은 바뀌지 않음) | `find_sources_file` 후보 순서: `cwd/sources.json` → `cwd.parent/sources.json` → `<저장소 루트>/sources.json` → `backend/app/config/sources.json` (`sources_service.py:11-24`). `make check` 는 `cd backend && pytest` 라 `backend/sources.json`(없음) 다음의 `../sources.json` = 루트 파일이 잡힌다. 루트에서 pytest 를 돌려도 `cwd/sources.json` 이 같은 루트 파일이다. `backend/app/config/sources.json` 은 루트 파일이 없을 때만 쓰인다. 테스트에서는 `llm_isolation` 이 `sources_service._file_path` 와 거울 경로 `_mirror_path` 를 세션 사본으로 바꿔, 이 탐색 결과와 고정 거울 경로 대신 사본에 쓴다. 쓰기는 `.tmp` 에 쓴 뒤 `replace` 한다. 교체가 `OSError` 면 대상 파일에 제자리로 쓴다 (`sources_service.py:102-118`) |

### 7.2 그 밖에 찾은 외부 호출 테스트
| 항목 | 판정 | 근거 `path:line` |
|---|---|---|
| `test_anthropic_provider.py::test_chat_stream_3tier_model_routing` | 안 함 (흉내 Claude) | LLM mock 이 없다. `api/chat.py:349` `check_provider_available` → `chat_service.py:748` `stream_tokens(model="claude-haiku-5-5")` → Anthropic SSE (`anthropic_provider.py:246` 이하) 를 흉내 Claude 가 받는다 |
| `test_anthropic_provider.py::test_chat_query_3tier_model_routing` | 안 함 (흉내 Claude) | `chat_service.py:546` `generate_live_answer(model="claude-opus-5-5")` → Anthropic POST 를 흉내 Claude 가 받는다 |
| `test_api.py::test_ask_ai_endpoint` | 안 함 (흉내 Claude) | `api/news.py:122` → `answer_question_with_meta` → `generate_live_answer` |
| `test_api.py::test_ask_ai_stream_endpoint` | 안 함 (흉내 Claude) | `api/news.py:150` → `stream_question_answer` → `anthropic_provider.stream_chat` (`llm_processor.py:901-904`) 를 흉내 Claude 가 받는다 |
| `test_llm_processor.py::test_answer_question` | 안 함 (흉내 Claude) | `test_llm_processor_fallback_and_answer` 와 같은 경로, 다른 캐시 키 |
| `test_collectors.py::test_evaluate_content_with_llm_strict_gate` | 안 함 (흉내 Claude) | 첫 호출은 pre-filter 로 끝난다(`llm_processor.py:603-615`). 두 번째(AI 글)는 `has_live_provider()` 가 참(가짜 Anthropic 키)이라 `_generate_live_answer` 를 부르고(`llm_processor.py:619-649`), 흉내 답에 JSON 이 없어 휴리스틱 폴백으로 판정된다 |
| `test_llm_processor.py::test_chat_stream_end_to_end_with_mocked_llm` | 안 함 | `stream_tokens` 만 mock 이고 `check_provider_available` 은 실제다(`api/chat.py:349`). 하네스의 가짜 Anthropic 키로 네트워크 없이 True(`llm_processor.py:313-314`) |
| `test_llm_processor.py::test_scoped_chat_stream_end_to_end_with_mocked_llm` | 외부 호출함 | 위 조건에 더해 item 999 (`https://example.com/isolated-scoped-benchmark`, `full_content` 없음)를 스크래퍼가 GET 한다 (`chat_service.py:622-629` → `scraper.py:74-75`). 실패는 잡혀서 진행된다 |
| `test_chat.py::test_chat_query_scoped_mode_success`, `test_chat_stream_scoped_sse_success` | 외부 호출함 (URL 별 프로세스 첫 회) | scoped 경로가 스크래퍼를 mock 없이 부른다 (`chat_service.py:495-502`, `622-629` → `scraper.py:126-174`). 대상은 item 101 `https://github.com/jlowin/fastmcp`. L1 캐시가 클래스 속성(`scraper.py:35`)이라 같은 URL 은 프로세스에서 한 번만 요청한다. 성공하면 본문이 테스트 DB 에 저장된다(`scraper.py:157-165`). 이 테스트들이 patch 하는 `AgenticSearchService.evaluate_and_search` 는 서비스에 호출처가 없다 |
| `test_chat_sessions.py::test_chat_stream_auto_persists_turn_and_auto_titles` | 외부 호출함 | scoped `source_id=1` 의 URL `https://github.com/example/langgraph-harness` (`conftest.py:25`)를 스크래퍼가 GET 한다. 실패는 잡혀서 진행된다 |
| `test_briefing_notion_email.py::test_notion_export_page_mock` | 외부 호출함 | `httpx.AsyncClient.post` 만 patch 한다. `create_briefing_page` 의 `GET https://api.notion.com/v1/databases/{id}` (`notion_service.py:238-239`)는 patch 되지 않아 가짜 키 `secret_test123` 으로 실제 요청을 보낸다. 예외·비 200 은 무시된다(`:240-246`) |
| `test_briefing_notion_email.py::test_email_api_endpoints` (`/test/email` 부분) | 조건부 (현재 config.json 으로는 외부 호출함) | 요청의 `smtp_host` 가 "" 이라 `settings.SMTP_HOST` 를 쓴다(`email_service.py:190`). 커밋된 루트 `config.json` 의 `briefing.email.smtp_host` 는 "smtp.gmail.com", `smtp_to` 는 "team@example.com" 이라 수신자가 생기고(`:200-202`), `smtplib.SMTP("smtp.gmail.com", 587)` 연결과 STARTTLS 를 시도한다(`:158-164`). `config.json` 의 smtp_user/smtp_password 값은 확인하지 못했다. 값이 있으면 로그인과 발송까지 간다(`:166-169`). 실패하면 400 이 나와 테스트는 통과한다 |
| `test_briefing_notion_email.py::test_notion_api_endpoints` (`/test/notion` 부분) | 조건부 | 요청 키가 "" 이라 `settings.NOTION_API_KEY` 를 쓴다(`notion_service.py:35`). 이 값이 비어 있으면 호출 없이 400, 값이 있으면 `GET https://api.notion.com/v1/users/me` 를 보낸다(`:41-43`). config.json 의 Notion 키 값은 확인하지 못했다 |
| `test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer`, `test_anti_gemini_isolation_in_stream_tokens` | 안 함 | `settings.OLLAMA_BASE_URL` 을 "" 로 patch 한다. `_resolve_ollama_url` 은 다음으로 `config.json` 의 `ollama_base_url` 을 보지만 하네스의 세션 사본에서는 빈 값이고 환경 변수도 지워져 있어, Ollama 탐침 없이 판정이 False 가 된다 (`llm_processor.py:150-160, 319`) |
| `test_llm_processor.py::test_stream_tokens_fails_fast_without_mock_fallback` | 안 함 | `llm_processor.openai_key`·`ollama_url` 을 "" 로 patch 한다. 덮어쓰기가 `None` 이 아니면 그 값만 쓰므로 OpenAI·Ollama 갈래가 꺼진다 (`llm_processor.py:131-132, 152-153, 476`) |
| 키가 없을 때 `has_live_provider()` 를 지나는 테스트 | 안 함 | Anthropic·OpenAI 키가 없고 Ollama 주소가 있으면 `httpx.Client.get(f"{ollama_url}/api/tags")` 를 보낸다 (`llm_processor.py:171-194`). 하네스 기본 상태에는 가짜 Anthropic 키가 있고, 키를 비우는 테스트도 Ollama 주소가 비어 있거나 흉내 Ollama 로 간다. 흉내 없는 포트 11434 요청은 가드가 막고 테스트를 실패시킨다 |
| frontend `HandoverIntegration.test.tsx` 의 Header 테스트 | 조건부 (로컬) | Header 가 `useCollector` 로 마운트 시 `fetchScheduleStatus()` 를 불러 `/api/schedule/status` 를 요청한다(`frontend/src/components/Header.tsx:62`, `frontend/src/hooks/useCollector.ts:82-90`, `frontend/src/lib/api.ts:171-173`). MSW 핸들러에 schedule 경로가 없고 `onUnhandledRequest: 'bypass'` (`frontend/src/tests/setup.ts:70`)라 jsdom 문서 origin 으로 실제 fetch 가 나간다. 실패는 `.catch(() => {})` 로 무시된다(`useCollector.ts:89`). `Header.test.tsx`, `modals/ScheduleModal.test.tsx` 는 `vi.mock('@/lib/api')` 로 이 요청을 막는다 |
| 그 밖의 frontend 테스트 | 안 함 | 채팅·뉴스 요청은 상대 경로이고 MSW `*/api/...` 핸들러가 받는다 (`frontend/src/mocks/handlers.ts:218-480`, `mocks/handlers/chat.ts:243-1098`) |

## 8. 테스트의 알려진 불일치·위험

### 8.1 테스트가 쓰는 설정 파일
- `test_briefing_notion_email.py::test_briefing_settings_get_and_post` 는 `POST /api/briefing/settings` 로 `save_json_config` 를 불러(`backend/app/api/briefing.py:207`, `backend/app/config.py:161-169`) `config.json` 을 덮어쓰고 `settings.reload()` 한다. 테스트에서는 세션 사본에 쓰고 루트 `config.json` 은 바뀌지 않는다. 커밋된 루트 `config.json` 에는 예전 실행이 남긴 이 테스트의 값(`notion.page_id: "test_notion_parent_page"`, `email.smtp_host: "smtp.gmail.com"`, `email.smtp_to: "team@example.com"`, `test_briefing_notion_email.py:145-150`)이 들어 있고, 세션 사본이 이 값을 그대로 가져간다.
- 위 값 때문에 `test_email_api_endpoints` 의 `/test/email` 이 실제 SMTP 연결을 시도한다 (7절 참조).
- `test_sources_toggle_and_crud`, `test_sources_and_research_api_endpoints`, `test_deep_research_run_and_audit` 가 `sources.json` 을 쓴다. 세션 사본이라 루트 `sources.json`·`backend/app/config/sources.json` 은 바뀌지 않지만, 같은 세션의 뒤 테스트는 바뀐 사본을 본다. 앞의 둘은 추가 후 지우지만 try/finally 가 없어 중간 단언이 실패하면 항목(`test_feed_discovery`, `test_autogen_blog`)이 사본에 남는다. 딥 리서치는 AUTO_ADOPTED 소스를 지우지 않는다.

### 8.2 테스트 DB
- `backend/tests/test_agentlens.db`, `-shm`, `-wal` 은 로컬에 있지만(2026-11-02 수정, WAL 약 4.2MB) git 에 커밋돼 있지 않다. `git ls-files backend/tests` 에 없고 `.gitignore` 가 `backend/tests/test_agentlens.db`, `*.db-shm`, `*.db-wal` 을 무시한다.
- conftest 는 `create_all` 로 없는 테이블만 만들고 데이터를 지우지 않는다(`backend/app/database.py:45-48`, `conftest.py:13-44`). 예전 테스트 전략 문서의 "테스트마다 스키마를 만든다" 는 기존 테이블·행을 유지한다는 점에서 코드와 다르다. 고정 id 시드(1, 101~103, 201, 9001~9005), 스크래퍼가 저장한 `full_content`, 자동 저장된 채팅이 실행 사이에 남는다.
- 개발 DB 격리는 지켜진다: conftest 가 `DATABASE_URL` 을 먼저 설정하고, `load_dotenv(override=False)` 와 pydantic 의 "환경변수 우선" 규칙 때문에 `.env` 의 `DATABASE_URL` 이 덮지 못한다 (`config.py:8-10`, `conftest.py:6-7`).

### 8.3 순서 의존
- `_qa_cache` 공유: `test_anthropic_provider.py::test_anti_gemini_stream_question_answer_never_yields_gemini` 가 남긴 휴리스틱 답을 `test_config_and_live_llm.py::test_llm_processor_fallback_and_answer` 가 같은 키로 받는다 (`llm_processor.py:765-768`, `938`). 단독 실행 때와 전체 실행 때 경로가 다르다.
- item 201 은 `test_chat.py::test_sqlite_fts_retriever_auto_relaxation_on_zero_matches` 만 넣는다. 같은 파일 뒤쪽 `test_chat_query_with_focus_filters_and_relaxation` 은 완화 결과가 있어야 `is_relaxed` 가 True 가 되는데(`retriever.py:569-586`), 201 이 없을 때(예: 이전 실행의 초기화 테스트로 DB 가 비워진 뒤 단독 실행)의 결과는 확인하지 못했다.
- `test_reset_and_delete.py` 두 테스트가 테스트 DB 의 뉴스(와 크롤 로그)를 모두 지운다. 다음 테스트는 fixture 가 다시 시드한다.
- 스크래퍼 L1 캐시가 클래스 속성이라(`scraper.py:35`) 프로세스 전체에서 공유된다. scoped 테스트의 외부 요청 여부가 앞선 테스트에 따라 달라진다.
- `POST /api/research/run-deep` 가 띄운 백그라운드 태스크(`research.py:87`)가 테스트 종료 후에도 남아 있을 수 있다. `deep_researcher.is_running` 이 남으면 같은 프로세스의 다음 실행이 `already_running` 을 받는다(`deep_researcher.py:385-386`). 실제 진행 범위는 확인하지 못했다.

### 8.4 실행 환경에 따라 실패할 수 있는 테스트
- 네트워크가 없으면 실패: `test_probe_and_discover_feed_github`, `test_source_researcher_inspect_url`.
- LLM 키·로컬 Ollama 상태·설치 모델에 따라서는 결과가 바뀌지 않는다 (하네스). 2026-11-08 키 있음/없음, OpenAI 키만, Ollama 연결 안 됨/설정 모델 없음/있음 여섯 조건에서 174개 모두 통과했다.
- `.env` 값이 settings 를 덮는다: `VERSION`, `ANTHROPIC_*_MODEL` 이 바뀌면 `test_version_*`, `test_anthropic_config_and_schema_defaults` 가 실패한다. `test_config_json_found_and_loaded` 는 `HIGH_SIGNAL_THRESHOLD == 7.0` 을 단언하는데 이는 config.json 값이고 코드 기본값은 7.8 이다(`config.py:65`).

### 8.5 효과가 없는 patch
- `AgenticSearchService.evaluate_and_search` patch (`test_chat.py:258`, `test_agentic_workflow.py:267, 323, 435`): 서비스 코드에 호출처가 없다 (호출은 `agentic_search.py:242` 내부뿐). `test_chat_scoped_graceful_degradation_when_scrape_fails` 는 이 mock 에 보조 출처를 넣지만 단언하지 않는다.
- `llm_processor.check_provider_available` patch (`test_agentic_workflow.py:268, 324`): 테스트가 `ChatService.stream_chat` 을 직접 부르는데 서비스는 이 함수를 부르지 않는다 (호출은 `api/chat.py:349`).

### 8.6 이름·설명과 실제 단언의 불일치
- `test_version_0_2_2_consistency`, `test_version_is_0_2_2` 는 0.4.1 을 단언한다. `test_config_json_found_and_loaded` 는 허용 버전 튜플을 하드코딩한다. 버전을 바꾸면 이 세 곳을 함께 고쳐야 한다.
- `test_article_scraper_l1_l2_cache_and_db_persistence` 의 세 번째 단계는 "새 인스턴스는 L2(DB)에서 읽는다" 고 설명하지만 L1 캐시가 클래스 속성이라 새 인스턴스도 L1 에서 읽는다 (`scraper.py:35`, `136-138`). 단언(HTTP 1회)은 L1/L2 를 구분하지 못한다.
- `test_chat_query_scoped_with_agentic_workflow_success` 의 docstring 은 "dual sources, supplementary_count>=1" 이지만 단언은 `supplementary_count == 0` 이다.
- `test_unit_test_mock_provider` 는 테스트 파일 안에 정의한 클래스만 검증한다.
- `feed/FeedToolbar.test.tsx` 의 `⑤ places the fixed Must-Read toggle after the source group and before sort at %ipx (R34)` 는 이름에 'before sort' 가 남아 있지만 정렬은 `FeedToolbar` 에 없고, 단언은 토글이 소스 그룹 뒤이고 그 줄의 마지막 자식인지만 본다.

### 8.7 건너뛰는 테스트·계약
- `skip`, `xfail`, `.only`, `.todo` 마커는 backend·frontend 어디에도 없다. 실행 중 건너뛰기는 하나다: `test_make_targets.py::test_t4_compose_config_is_valid` 가 docker CLI 가 없으면 `pytest.skip`. frontend 649개는 2026-11-09 모두 통과했다. backend 217개는 2026-11-09 모두 통과했다.
- `make check` 는 `pytest -v tests/` 를 마커 구분 없이 돌린다. 라이브 호출 테스트를 따로 고르는 마커나 설정이 없다 (`Makefile` check, `backend/pytest.ini`).
- MSW 에만 있는 엔드포인트: `GET /api/chat/stream` (`frontend/src/mocks/handlers.ts:480`)을 `ContractAndMsw.test.ts` 두 테스트가 검증하지만 backend 에는 `POST /api/chat/stream` 만 있다 (`backend/app/api/chat.py:276`).
- `ContractAndMsw.test.ts` 의 MSW 테스트는 mock 핸들러의 동작을 검증하며 backend 와의 일치를 확인하지 않는다. backend 응답 형식과 frontend zod 스키마를 함께 대조하는 테스트는 없다.
