# [AgentLens] 통합 QA 테스트 계획서 (QA Test Plan)

- **Updated**: 2026-11-10
- **기준**: v0.4.2 (main)
- **작성일자**: 2026-11-10 (v0.4.0 최초 작성 2026-11-09)
- **작성자**: 품질 보증 엔지니어 (`qa-engineer`)
- **문서 버전**: v0.4.2 as-built (지금 코드를 그대로 검증하는 계획. 새 기능 설계가 아니다). v0.4.1 계획에서 지운 엔드포인트 11개의 케이스를 404 확인으로 바꾸고, 오류 형식 통일(422 없음)·응답 시각 오프셋·수집 잠금·모바일 챗 스크롤·대화상자 오류 상태 케이스를 더했다. 자동 테스트 격리(외부 네트워크 가드, 목 없는 MSW 요청 실패, 임시 테스트 DB)를 4절에 반영했다
- **상태**: Review
- **기준 문서**:
  - 상세 기능 정의서(FSD): `docs/spec-writer/fsd/01_NEWS_FEED_SPECIFICATION.md`(NEWS), `02_AI_CHAT_SPECIFICATION.md`(CHAT), `03_COLLECTION_SPECIFICATION.md`(COLL), `04_BRIEFING_AND_SHARING_SPECIFICATION.md`(BRF), `05_SOURCES_AND_RESEARCH_SPECIFICATION.md`(SRC), `06_MCP_SERVER_SPECIFICATION.md`(MCP), `07_UI_COMMON_SPECIFICATION.md`(UI)
  - 시스템 설계·API: `docs/system-designer/01_SYSTEM_DESIGN.md`, `docs/system-designer/02_OPENAPI_SPEC.yaml`
  - 계약·MSW: `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` (v1.4)
  - 컴포넌트·디자인 시스템(`ui-audit` 판정 규격 8절): `docs/ui-system-designer/01_COMPONENT_SPEC.md`, `docs/ui-system-designer/02_DESIGN_SYSTEM.md`
  - 배포·실행: `docs/devops-engineer/01_DEPLOYMENT_SPEC.md`
  - 자동 테스트 파일별 상세(테스트 이름·단언): `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md`, `docs/frontend-tdd-engineer/01_TDD_CYCLE_LOG.md`
  - 결과 보고서: `docs/qa-engineer/02_QA_TEST_REPORT.md`

이 문서는 세 부분이다. 1~3절은 실행 중인 앱에서 하는 통합 QA 계획(시나리오 매트릭스, 실행 지침, 판정 기준), 4절은 저장소의 자동 테스트 전략(검사 명령, 테스트 종류, 격리, `ui-audit`, 외부 호출 정책, 통과 기준, 릴리스 전 검증), 5~8절은 자동 테스트의 현황 요약·기능 영역별 공백·외부 호출 판정·알려진 불일치다.

---

## 1. 테스트 범위 및 환경 (Test Scope & Environment)

### 1.1 테스트 대상
FSD 7개 도메인의 인수 기준 가운데 실행 중인 앱에서 사용자 데이터를 지우거나 밖으로 보내지 않고 확인할 수 있는 것 전부. 시나리오는 정상 경로, 경계·잘못된 입력, 외부 의존 실패(LLM 없음 → 503, 스트림 끊김, 요청 실패), 빈 데이터, 동시 실행(다른 프로세스가 수집 잠금을 쥔 동안 재요청 → `already_running`)으로 나눈다.

### 1.2 테스트 환경
| 항목 | 값 |
|---|---|
| 포트 | 사용자 `make dev` 의 3000·8000, Docker 기본 3001, 지난 QA 의 18000 은 쓰지 않는다. 이번 계획은 backend `28000`, frontend `23001` |
| DB | 사용자 `backend/agentlens.db` 를 `sqlite3 backend/agentlens.db ".backup <스크래치>/qa.db"` 로 떠서 `DATABASE_URL=sqlite+aiosqlite:///<스크래치>/qa.db` 로 쓴다. 수집 잠금 파일은 DB 옆 `qa.db.crawl.lock` 이라 사용자 DB 잠금과 섞이지 않는다 |
| backend | `cd backend && env ANTHROPIC_API_KEY= OPENAI_API_KEY= GEMINI_API_KEY= OLLAMA_BASE_URL=http://127.0.0.1:9 SLACK_WEBHOOK_URL= DISCORD_WEBHOOK_URL= NOTION_API_KEY= SMTP_HOST= SMTP_USER= SMTP_PASSWORD= SCHEDULER_ENABLED=false PUBLIC_WEB_URL=http://localhost:23001 DATABASE_URL=… ../.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 28000`. 로컬 `.env` 에 LLM 키가 있으므로 환경 변수로 빈 값을 덮어 실제 LLM 호출을 막는다 (`backend/app/config.py` 는 `load_dotenv(override=False)` 와 pydantic 의 환경 변수 우선 규칙을 쓴다). `SCHEDULER_ENABLED=false` 로 정시 수집·딥 리서치·브리핑 자동 발송을 막는다 |
| frontend | 작업 트리 `frontend/` 를 스크래치에 복사(`rsync`, `.next`·`.env.local` 제외)하고 `env -u NEXT_PUBLIC_API_URL INTERNAL_API_URL=http://127.0.0.1:28000 next build` → `next start -p 23001 -H 127.0.0.1`. 사용자 `next dev` 가 쓰는 `frontend/.next` 를 건드리지 않으려고 사본에서 빌드한다. `ui-audit` 는 프로덕션 빌드만 대상이다 |
| 브라우저 | Playwright (Chromium) 스크립트와 Playwright MCP, `ui-audit.mjs` 는 로컬 Chrome(puppeteer-core) |
| 폭 | 360x780, 375x667, 390x844, 768x1024, 1024x768, 1280x800, 1440x900 (모바일 챗 스크롤은 375·390·360 모바일 에뮬레이션 + 1280, 화면 규칙은 `ui-audit` 의 5개 폭) |
| 테마 | 라이트, 다크 (`ui-audit` 가 둘 다) |
| Docker | 이 계획의 회귀 QA 는 Docker 를 쓰지 않는다. 컨테이너·환경 변수·헬스체크 검증은 `devops-engineer` 가 한다 |

### 1.3 실행하지 않는 동작
- 실제 수집(외부 스크래핑): `POST /api/schedule/trigger`·`reset-and-collect`·`make collect` 는 **다른 프로세스가 사본의 수집 잠금을 쥐고 있는 동안에만** 부른다(잠금을 쥔 것을 따로 확인한 뒤). 잠금이 없으면 실제 수집이 시작되므로 부르지 않는다. `POST /api/research/run-deep` 는 범위 검증(400)만 부른다
- 발송: Notion 발행·연결 테스트, 메일 발송·연결 테스트, 웹훅 테스트(유효 URL). 잘못된 입력(400)만 부른다
- 설정·소스 저장: `POST /api/briefing/settings`, 소스 추가(유효 입력)·토글(`all`·있는 id)·삭제. 추적 파일 `config.json`·`sources.json` 이 바뀐다. 검증 위반(400)·없는 대상(404)만 부른다
- 실제 LLM 호출. 챗·Ask AI 의 정상 스트림은 화면에서 `fetch`·`page.route` 흉내로 보고, backend 쪽은 단위 테스트로 근거를 단다
- 화면에서 쓰기 요청이 나갈 수 있는 시나리오는 `page.route` 로 그 요청을 막는다 (`trigger`, `reset-and-collect`, `run-deep`, `inspect-url`, 브리핑 발송·설정 저장, 웹훅, 소스 추가)

### 1.4 검사 범위 밖 (수용된 위험)
제품 오너 결정 (2026-11-09): 아래 다섯 가지는 검사하지 않는다. 수용된 위험이며 출시 판정의 Blocker·Critical 에 세지 않는다. 사실은 결과 보고서 3.8절에 남긴다.

| ID | 항목 | 관련 시나리오 | 보고서 결함 |
| :--- | :--- | :--- | :--- |
| OOS-1 | 인증 없음과 CORS 전체 허용(모든 origin, credentials 허용) | `TC-SEC-001` | D-01 |
| OOS-2 | SSRF (웹훅 테스트, `inspect-url`, `test/email` 이 호출자가 준 URL·호스트로 요청) | 시나리오 없음 (1.3) | D-02 |
| OOS-3 | 비밀값 평문 저장 (`config.json`) | 시나리오 없음 (1.3) | D-03 |
| OOS-4 | 설정 조회로 비밀값 노출 | `TC-BRF-002` 의 해당 부분 | D-04 |
| OOS-5 | 설정 재적용 누락 | `TC-BRF-006` | D-08 |

- 이 항목만 보는 케이스는 구분을 **범위 밖** 으로 두고 Pass/Fail 을 매기지 않는다.
- 같은 범주가 아닌 보안 관련 결함(예외 문자열·서버 경로 노출, 입력값 echo, 이메일 HTML 이스케이프)은 범위 안이다.

---

## 2. 테스트 시나리오 매트릭스 (Test Matrix)

구분: E2E 정상 / 경계 / 잘못된 입력 / 외부 의존 실패 / 빈 데이터 / 동시 실행 / 보안 / UI / 접근성 / 반응형 / 범위 밖. 방법: `runner` = `qa_runner.py`, `curl` = 시나리오 스크립트의 HTTP 호출, `UI` = Playwright, `audit` = `ui-audit.mjs`, `unit` = `make check` 안의 테스트, `code` = 코드로 확인. 오류 응답은 모두 `{"error_code","message","details"}` 이다 (`backend/app/api/errors.py`). 요청 검증 실패는 400 `ERR_INVALID_PAYLOAD`(details `[{loc,msg}]`, 입력값 echo 없음)이고 422 는 없다.

### 2.0 오류 형식·지운 엔드포인트·시각
| 케이스 ID | 구분 | 검증 시나리오 | 사전 조건 및 입력 | 기대 결과 | 방법 | FSD |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TC-ERR-001` | 잘못된 입력 | 없는 경로 | `GET /api/news/123456789` | 404 `ERR_NOT_FOUND` `요청한 대상을 찾을 수 없습니다.` | curl | 시스템 설계 오류 형식 |
| `TC-ERR-002` | 잘못된 입력 | 허용 안 된 방식 | `PUT /api/news` | 405 `ERR_METHOD_NOT_ALLOWED` | curl | 〃 |
| `TC-ERR-003` | 잘못된 입력 | 없는 API 경로 | `GET /api/does-not-exist` | 404 `ERR_NOT_FOUND` | curl | 〃 |
| `TC-RM-001`~`011` | 잘못된 입력 | v0.4.2 에서 지운 엔드포인트 11개 | `GET /api/chat/search`, `POST /api/chat/query`, `GET /api/news/{id}`, `POST /api/news/{id}/ask`, `DELETE /api/news/all`, `POST /api/research/discover`, `POST /api/research/register-candidate`, `POST /api/sources/github`, `GET /api/mcp/info`, `POST /api/briefing/generate`, `POST /api/webhook/send-briefing` | 각 404 `ERR_NOT_FOUND`, 리다이렉트(307) 없음 (`backend/app/main.py` `redirect_slashes=False`). 부르기 전에 앱 라우트 목록에 없는지 먼저 본다(남아 있으면 삭제·발송이 일어날 수 있다) | curl | 각 FSD v0.4.2 변경 이력 |
| `TC-RM-012` | 잘못된 입력 | 끝 슬래시 경로 | `POST`·`PATCH /api/sources/github/`, `GET /api/news/`·`/api/sources/`·`/api/chat/sessions/` | 405 / 404, 307 없음, 오류 형식 통일 | curl | 시스템 설계 오류 형식 |
| `TC-API-001` | 계약 | 런타임 OpenAPI | `GET /openapi.json` | `"422"` 없음, `ErrorResponse` 있음, `HTTPValidationError` 없음 | curl | ADR Q13 |
| `TC-TIME-001` | 계약 | 뉴스 시각 오프셋 | `GET /api/news?size=100` | 모든 ISO 시각에 `Z` 또는 `±hh:mm` | curl | FUNC-NEWS-001 |
| `TC-TIME-002` | 데이터 | 미래 시각 없음 | `sort=latest&size=100` | `published_at` 이 지금보다 뒤인 항목 0 (m003) | curl | FUNC-COLL (N-11) |
| `TC-TIME-003` | 계약 | 다른 응답 시각 오프셋 | 세션 목록·상세·POST, 출처 상세, 스케줄 상태, 감사 일지, 브리핑, 통계, 레이더, 소스 | 오프셋 없는 ISO 시각 0 | curl | 계약 v1.4 `IsoDateTimeSchema` |

### 2.1 NEWS (뉴스 피드, `docs/spec-writer/fsd/01_NEWS_FEED_SPECIFICATION.md`)
| 케이스 ID | 구분 | 검증 시나리오 | 사전 조건 및 입력 | 기대 결과 | 방법 | FSD |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TC-NEWS-001` | E2E 정상 | 목록 기본 조회 | `GET /api/news` | 200, `items`·`total`·`page`·`size`·`total_pages` | curl, runner | FUNC-NEWS-001 |
| `TC-NEWS-002` | E2E 정상 | 카테고리 필터 | `?category=harness` | 200 | curl | FUNC-NEWS-002 |
| `TC-NEWS-003` | E2E 정상 | Must-Read 필터 | `?high_signal_only=true` | 200 | curl | FUNC-NEWS-004 |
| `TC-NEWS-004` | E2E 정상 | 키워드 검색 | `?search=MCP` | 200 | curl | FUNC-NEWS-005 |
| `TC-NEWS-005` | E2E 정상 | 정렬 | `sort=hot·latest·score·hotness` | 200 ×4 | curl | FUNC-NEWS-006 |
| `TC-NEWS-006` | 경계 | 페이지 하한 | `?page=0` | 400 `ERR_INVALID_PAYLOAD`, details `[{loc:["query","page"],msg}]` | curl | FUNC-NEWS-001 |
| `TC-NEWS-007` | 경계 | 크기 상한 | `?size=101` | 400 `ERR_INVALID_PAYLOAD` | curl | FUNC-NEWS-001 |
| `TC-NEWS-008` | 잘못된 입력 | 숫자가 아닌 페이지 | `?page=abc` | 400, 입력값 echo 없음 | curl | FUNC-NEWS-001 |
| `TC-NEWS-009` | 빈 데이터 | 범위 밖 페이지 | `?page=9999` | 200 `items: []` | curl | FUNC-NEWS-001 |
| `TC-NEWS-010` | 빈 데이터 | 없는 카테고리 | `?category=nope` | 200 `total: 0` | curl | FUNC-NEWS-002 |
| `TC-NEWS-014` | E2E 정상 | RSS 출력 | `GET /api/news/feed/rss.xml` | 200, XML 파싱 성공, 채널 `<link>` = `PUBLIC_WEB_URL` | curl, runner | FUNC-NEWS-013 |
| `TC-NEWS-014b` | 경계 | RSS 카테고리·특수문자 | `?category=` 4종 + `a&b<c>` | 200, 모두 XML 유효 | curl | FUNC-NEWS-013 |
| `TC-NEWS-029` | 데이터 | RSS `pubDate` 미래 시각 | 위 응답 | 0건 | curl | FUNC-NEWS-013 |
| `TC-NEWS-015` | 잘못된 입력 | 없는 기사에 질문 | `POST /api/news/999999999/ask/stream` | 404 `ERR_NOT_FOUND` | curl | FUNC-NEWS-010 |
| `TC-NEWS-016` | E2E 정상 | 통계·트렌드 레이더 | `GET /api/stats`, `/api/trends/radar` | 200 | curl, runner | FUNC-NEWS-014, 015 |
| `TC-NEWS-017` | 외부 의존 실패 | LLM 없을 때 Ask AI | `POST /api/news/{id}/ask/stream` | 200 `text/event-stream`, `Cache-Control: no-cache, no-transform`, `meta`(`AgentLens Heuristic Engine`) → `token`(필드 `text`)… → `done` | curl | FUNC-NEWS-010 |
| `TC-NEWS-025` | UI 문자열 | 휴리스틱 답 이모지 | 위 답 | 그림 이모지 0, 머리 `### 기술 맥락 및 실무 분석` | curl | FUNC-NEWS-010 |
| `TC-NEWS-026`·`027` | 경계 | Ask AI 질문 길이 | 0자, 2001자 | 400 `ERR_INVALID_PAYLOAD` | curl | BR-NEWS-010-1 |
| `TC-NEWS-028` | 경계 | Ask AI 공백만 질문 | `"   "` | 200 (FSD 가 막지 않는다고 정함, 관찰) | curl | BR-NEWS-010-1 |
| `TC-NEWS-032` | 외부 의존 실패 | Ask AI 연결 실패 | `page.route` 연결 거부 | `서버에 연결하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.` + `다시 시도` | UI | FUNC-NEWS-010 |
| `TC-NEWS-033` | 외부 의존 실패 | Ask AI 첫 응답 시간 제한 | 응답을 붙잡아 둠 | 30초 뒤 `응답이 늦어 요청을 멈췄습니다. 다시 시도해 주세요.` (연결 실패 문구와 다름) | UI | FUNC-NEWS-010 |
| `TC-NEWS-019`~`021` | UI | 피드 표시·칩 필터·0건 카테고리 | `/` 1440·390 | 카드 그리드, 칩 `aria-pressed`, 빈 안내 | UI, audit | FUNC-NEWS-001, 002 |
| `TC-NEWS-022` | 접근성 | 기사 상세 키보드 | 카드 제목 Enter → Tab 반복 → Escape | 포커스가 대화상자 안에 갇힘, `:focus-visible` 2px, Escape 로 닫히고 카드 제목으로 복귀 | UI | FUNC-NEWS-009 |
| `TC-NEWS-023` | 경계 | 검색 디바운스·대기 중 페이지 변경 | 검색 입력 중 페이지·필터 변경 | 요청 1번, 기다리던 검색어 먼저 반영, 페이지 유지 | unit (`feed/FeedSearch.test.tsx`) | FUNC-NEWS-005 |
| `TC-NEWS-024` | 외부 의존 | Ask AI 연결 주소 | 프로덕션 번들 | 번들에 `:8000` 없음, 같은 출처(`/api/...` → Next rewrite)로 감 | code, UI | FUNC-NEWS-010 |
| `TC-NEWS-030` | UI | Ask AI 실제 backend·배지 | 1440·390, `AI 질의응답` 탭에서 질문 | 질문 전 배지 `실시간 스트리밍`, 답 뒤 `응답 엔진: {meta 모델}`, 답 표시, 390 가로 스크롤 없음 | UI | FUNC-NEWS-010 |
| `TC-NEWS-031` | 외부 의존 실패 | Ask AI 끊김 | `page.route` 로 ① 토큰 뒤 `error`(`ERR_LLM_STREAM_FAILED`) ② `done` 없이 끝 | 부분 답 유지 + 알림 `답변 생성이 중간에 끊겼습니다. 다시 시도해 주세요.` + `답변 다시 시도`, 끊긴 답 `복사` 비활성, 다시 시도하면 새 답 | UI | FUNC-NEWS-010 |

### 2.2 CHAT (AI 챗, `docs/spec-writer/fsd/02_AI_CHAT_SPECIFICATION.md`)
| 케이스 ID | 구분 | 검증 시나리오 | 사전 조건 및 입력 | 기대 결과 | 방법 | FSD |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TC-CHAT-001` | 잘못된 입력 | 빈 질문 | `POST /api/chat/stream` `{"question":""}` | 400 `ERR_CHAT_PAYLOAD_EMPTY` | curl | FUNC-CHAT-008 |
| `TC-CHAT-002` | 경계 | 2001자 | | 400 `ERR_CHAT_PAYLOAD_TOO_LARGE` | curl | FUNC-CHAT-008 |
| `TC-CHAT-003` | 잘못된 입력 | 잘못된 scope | `scope:"bad"` | 400 `ERR_INVALID_SCOPE_PARAM` | curl | FUNC-CHAT-017 |
| `TC-CHAT-004`·`005` | 잘못된 입력 | scoped 없는 기사·source_id 없음 | | 404 `ERR_HANDOVER_SOURCE_NOT_FOUND` | curl | FUNC-CHAT-013 |
| `TC-CHAT-006` | 잘못된 입력 | JSON 이 아닌 본문 | `{not json` | 400 `ERR_INVALID_PAYLOAD` | curl | FUNC-CHAT-008 |
| `TC-CHAT-007` | 잘못된 입력 | 잘못된 모델 티어 | `model_tier:"ultra"` | 400 `ERR_INVALID_MODEL_TIER` | curl | FUNC-CHAT-015 |
| `TC-CHAT-020` | 잘못된 입력 | 배열 본문 | `[1,2]` | 400 `ERR_INVALID_PAYLOAD` | curl | FUNC-CHAT-008 |
| `TC-CHAT-022` | 보안·입력 | 스트림 `session_id` UUID 아님 | `"not-a-uuid-<script>"` | 400 `ERR_SESSION_INVALID_UUID`, 입력값 echo 없음 | curl | CT-028 |
| `TC-CHAT-023` | 경계 | 메시지 id 37자 | `user_message_id` 37자 | 400 `ERR_INVALID_PAYLOAD` | curl | 계약 8.1 |
| `TC-CHAT-024` | 경계 | `session_id: null` | | 검증 통과 (LLM 없으면 503) | curl | CT-028 |
| `TC-CHAT-013` | 외부 의존 실패 | LLM 없음 스트림 | | 503 `ERR_LLM_PROVIDER_UNAVAILABLE` | curl | FUNC-CHAT-022 |
| `TC-CHAT-009` | E2E 정상 | 세션 목록 | `GET /api/chat/sessions` | 200, 시각 오프셋 | curl, runner | FUNC-CHAT-001 |
| `TC-CHAT-025` | 경계 | 세션 `limit=0` | | 400 `ERR_INVALID_PAYLOAD` | curl | FUNC-CHAT-001 |
| `TC-CHAT-026` | 잘못된 입력 | 세션 상세 id 형식 | `GET /api/chat/sessions/not-uuid` | 404 `ERR_SESSION_NOT_FOUND` (형식 검증 없음, OpenAPI) | curl | FUNC-CHAT-003 |
| `TC-CHAT-010` | 잘못된 입력 | 없는 세션 | 새 UUID | 404 `ERR_SESSION_NOT_FOUND` | curl | FUNC-CHAT-003 |
| `TC-CHAT-011` | E2E 정상 | 출처 상세·없는 출처 | `GET /api/chat/sources/{id}`, `/999999999` | 200(오프셋), 404 `ERR_HANDOVER_SOURCE_NOT_FOUND` | curl | FUNC-CHAT-014 |
| `TC-CHAT-027`·`028` | E2E 정상 | 세션 POST 저장·상세 | 임시 UUID 세션, `created_at` 없는 메시지 2개, assistant `model_tier`·`usage` | 201, 서버 시각(오프셋), `model_tier`·`usage` 반환 | curl | FUNC-CHAT-012 (CT-004) |
| `TC-CHAT-029`·`029b` | 잘못된 입력 | 다른 세션의 메시지 id | 다른 세션 id 로 같은 메시지 id | 400 `ERR_INVALID_PAYLOAD` `details.message_ids`, 그 세션은 만들어지지 않음 | curl | FUNC-CHAT-012 |
| `TC-CHAT-030`·`031` | 잘못된 입력 | 세션 POST 깨진 JSON·UUID 아님 | | 400 `ERR_INVALID_PAYLOAD` / `ERR_SESSION_INVALID_UUID` | curl | CT-016 |
| `TC-CHAT-032` | E2E 정상 | 임시 세션 삭제 | DELETE | 200, 다시 GET 404 | curl | FUNC-CHAT-004 |
| `TC-CHAT-033` | 반응형 | 모바일 챗 긴 답 스크롤 (FE-36) | 375x667·390x844·360x780 모바일, 1280x800. `fetch` 흉내로 90문단 스트림 | 입력창 top 고정, 문서·조상 스크롤 0, 목록만 스크롤, 맨 아래 24px 안일 때만 따라감, 새 질문은 맨 아래, 완료 sr-only `답변이 완료되었습니다.` | UI | FUNC-CHAT-006 |
| `TC-CHAT-034` | 접근성 | 인용 팝오버 키보드 (FE-37) | 같은 폭, 배지 Enter → Tab → Escape | 열면 포커스 `팝오버 닫기`(팝오버 안, body portal), Tab → `원문 보기`, Escape → 닫히고 배지로 복귀, 닫기 버튼 모바일 44px | UI | FUNC-CHAT-014 |
| `TC-CHAT-035` | 반응형 | 가상 키보드 흉내 | 스트림 중 뷰포트 높이 844 → 500 | 입력창이 화면 안, 문서 스크롤 0 | UI | FUNC-CHAT-006 |
| `TC-CHAT-036` | 외부 의존 실패 | 실제 backend LLM 없음 화면 | 390 `/chat` 질문 | 답 자리에 503 `message` + `다시 시도`, 요청 1번 | UI | FUNC-CHAT-022 |
| `TC-CHAT-016`·`037` | 빈 데이터·실패 | 이관 기사 없음·조회 실패·성공 (FE-41) | `/chat?sourceId=999999999`, 출처 조회 500 흉내, 실제 조회 | `요청하신 기사를 찾을 수 없어…` / `기사 정보를 불러오지 못해 전체 소식 모드로 시작합니다. 연결 상태를 확인해 주세요.` / 기사 칩 | UI | FUNC-CHAT-018 |
| `TC-CHAT-038` | UI | 포커스 필터 라벨 | `/chat` 포커스 필터 열기 (390·1440) | `Must-Read 고신호만`, `7.8` 없음 | UI | FUNC-CHAT-016 |
| `TC-CHAT-039` | 외부 의존 실패 | 챗 연결 실패 | `/api/chat/stream` 연결 거부 | 답 자리 `서버에 연결하지 못했습니다. …` + `다시 시도` | UI | FUNC-CHAT-020 |
| `TC-CHAT-018`·`021` | 동시 실행·외부 의존 | 모델 변경 직후 전송, 끊긴 스트림·한 턴 저장, 재시도 history | | 단위 테스트 통과 | unit (`chat/ChatStreamTurn.test.tsx`, `backend/tests/test_code_review_fixes.py`, `test_v042_llm_chat.py`) | FUNC-CHAT-006, 009, 020 |

### 2.3 COLL (수집, `docs/spec-writer/fsd/03_COLLECTION_SPECIFICATION.md`)
| 케이스 ID | 구분 | 검증 시나리오 | 사전 조건 및 입력 | 기대 결과 | 방법 | FSD |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TC-COLL-001` | E2E 정상 | 스케줄 상태 | `GET /api/schedule/status` | 200, `schedule_hours`·`timezone`·`next_run`·`recent_logs`, 시각 오프셋 | curl, runner | FUNC-COLL-017, 018 |
| `TC-COLL-002` | E2E 정상 | 진행률 | `GET /api/schedule/progress` | 200, 문구 이모지 없음 | curl, runner | FUNC-COLL-017 |
| `TC-COLL-007` | 계약 | 크롤 로그 상태 | `recent_logs[].status` | `success`·`partial_failure`·`failed` 중 하나 | curl | FUNC-COLL-017 |
| `TC-COLL-003` | 동시 실행 | 다른 프로세스 수집 중 `trigger` | 별도 프로세스가 `<db>.crawl.lock` 을 `flock(LOCK_EX\|LOCK_NB)` 로 쥠(쥔 것 확인 후) | 200 `already_running`, `other_process: true`, 수집 시작 안 함 | curl | FUNC-COLL-019 |
| `TC-COLL-008` | 동시 실행 | 다른 프로세스 수집 중 초기화 | 위와 같음, `POST /api/schedule/reset-and-collect` | `already_running`, `deleted_count: 0`, 기사 수 그대로 | curl | FUNC-COLL-020 |
| `TC-COLL-009` | 동시 실행 | 다른 프로세스 수집 중 `make collect` | `AGENTLENS_API_URL=http://localhost:28000 COLLECT_MODE=api make collect` | stderr 안내, 스크립트 종료 1, 기다리지 않음 | curl (make) | FUNC-COLL-019 (N-12) |
| `TC-COLL-012` | 동시 실행 | 직접 모드 `make collect` | 다른 프로세스가 사본 잠금을 쥔 동안 `DATABASE_URL=<사본> AGENTLENS_API_URL=http://localhost:28000 COLLECT_MODE=direct make collect` | backend 가 떠 있다는 경고, `already_running` 으로 종료 1, 수집·저장 없음 | curl (make) | FUNC-COLL-019 |
| `TC-COLL-010` | 외부 의존 실패 | 스케줄 대화상자 오류 (FE-39) | `/api/schedule/status` 503 흉내 → `다시 시도` | `스케줄 정보를 불러오지 못했습니다. …` + `다시 시도` → 수집 주기 표시, Escape 로 닫히고 포커스 복귀 | UI | FUNC-COLL-017 |
| `TC-COLL-011` | 빈 데이터 | 수집 시각 없음 | `schedule_hours: []` 흉내 | `정해진 수집 시각이 없습니다` | UI | FUNC-COLL-017 |
| `TC-COLL-006` | UI | 헤더 수집 상태 | `/` | `수집 스케줄 · 다음 수집 …` 버튼, `즉시 수집` (누르지 않음) | UI, audit | FUNC-UI-001 |
| `TC-COLL-004`·`005` | 외부 의존·빈 데이터 | 소스 실패 기록, 빈 DB 첫 수집 | | 단위 테스트 통과 (외부 수집이라 실행하지 않음) | unit (`test_b_collection.py`, `test_startup_seed.py`) | FUNC-COLL-001, 021 |

### 2.4 BRF (브리핑·공유)
| 케이스 ID | 구분 | 검증 시나리오 | 사전 조건 및 입력 | 기대 결과 | 방법 | FSD |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TC-BRF-001` | E2E 정상 | 오늘 브리핑 | `GET /api/briefing/today` | 200 | curl | FUNC-BRF-001 |
| `TC-BRF-007` | UI 문자열 | 브리핑 이모지 | 위 응답 | backend 고정 문자열에 그림 이모지 없음 (수집 원문 제외) | curl, code | FUNC-BRF-001 |
| `TC-BRF-008` | 계약 | 분야 이름·아이콘 | 위 응답 | 이름 = 프론트 긴 라벨 4개, `icon` = 분야 id | curl | FUNC-BRF-001 |
| `TC-BRF-009` | 경계 | 헤드라인·요약 자르기 | 위 응답 | 공백 경계에서 자르고 `…` | curl | FUNC-BRF-001 |
| `TC-BRF-002` | E2E 정상 | 연동 설정 조회 | `GET /api/briefing/settings` | 200, `auto_alert_high_signal` 없음. 비밀값 노출은 판정 안 함(OOS-4) | curl, runner | FUNC-BRF-011 |
| `TC-BRF-003` | 잘못된 입력 | 웹훅 테스트 잘못된 URL | `{"webhook_url":"not-a-url"}` | 400 `ERR_INVALID_PAYLOAD` (전송 없음) | curl | FUNC-BRF-009 |
| `TC-BRF-004` | 잘못된 입력 | Notion 발행 잘못된 본문 | `{"page_id":123}` | 400 `ERR_INVALID_PAYLOAD` (발행 없음) | curl | FUNC-BRF-004 |
| `TC-BRF-005` | UI | 브리핑 대화상자 | | 탭 2개, 긴 라벨 4개, Escape | audit (`briefing`·`pictograph`) | FUNC-BRF-002 |
| `TC-BRF-006` | **범위 밖** | 설정 저장 뒤 발송 값 | | 판정 안 함 (OOS-5) | code | FUNC-BRF-011 |

### 2.5 SRC (소스·딥 리서치)
| 케이스 ID | 구분 | 검증 시나리오 | 사전 조건 및 입력 | 기대 결과 | 방법 | FSD |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TC-SRC-001` | E2E 정상 | 소스 목록 | `GET /api/sources` | 200, `sources_file` 은 파일 이름만 | curl, runner | FUNC-SRC-003 |
| `TC-SRC-007`~`011` | 잘못된 입력 | RSS 추가 검증 | `ftp://` url, 빈 이름, 201자 이름, `category_hint` 4종 밖, `country` KR/GLOBAL 밖 | 400 `ERR_INVALID_PAYLOAD`, 해당 `loc`, 추적 파일 그대로 | curl | FUNC-SRC-004 |
| `TC-SRC-004`·`012`·`013` | 잘못된 입력 | 없는 대상 토글 | `nosuch/all`, `github/owner/repo`, `reddit/xyz` | 404 (유형 토글은 `item_id=all` 만) | curl | FUNC-SRC-006 |
| `TC-SRC-002`·`014` | E2E 정상 | 딥 리서치 상태·감사 일지 | `limit=200` | 200, 시각 오프셋 | curl, runner | FUNC-SRC-013, 014 |
| `TC-SRC-015`~`018` | 경계 | 범위 검증 | `audit-logs limit` 0·201, `run-deep max_candidates` 0·21 | 400 `ERR_INVALID_PAYLOAD` (실행 안 함) | curl | FUNC-SRC-011, 014 |
| `TC-SRC-019` | 외부 의존 실패 | 소스 대화상자 오류 (FE-30) | `/api/sources` 500 흉내 | `소스 정보를 불러오지 못했습니다. …` + `다시 시도` | UI | FUNC-SRC-003 |
| `TC-SRC-020` | 빈 데이터 | 받기 전·빈 목록·실행 기록 없음 | 응답 지연·빈 목록 흉내 | `불러오는 중...` → `등록된 RSS 피드가 없습니다.`·`모니터링 중인 GitHub 저장소가 없습니다.`, 딥 리서처 `실행 기록 없음` | UI | FUNC-SRC-003, 013 |
| `TC-SRC-021` | 보안·입력 | `inspect-url` 예외 원문 숨김 | 닫힌 루프백 포트 `http://127.0.0.1:9/feed` (외부 호스트 금지) | `status: error`, 고정 문장 `URL 에 접속하지 못했습니다. …`, 예외 문자열 없음 | curl | FUNC-SRC-008 |
| `TC-SRC-022` | UI | 감사 일지 라벨 | 딥 리서처 탭 | `판정 사유:`, `AI 판정 사유` 없음 | UI | FUNC-SRC-014 |
| `TC-SRC-005`·`006` | 경계·동시 실행 | `owner/repo` 토글, 딥 리서치 예외 뒤 재실행 | | 단위 테스트 통과 (추적 파일이 바뀌어 실행하지 않음) | unit | FUNC-SRC-006, 011 |

### 2.6 MCP
| 케이스 ID | 구분 | 검증 시나리오 | 사전 조건 및 입력 | 기대 결과 | 방법 | FSD |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TC-MCP-001` | E2E 정상 | MCP 서버 import | `python -c "import app.mcp.server"` (임시 DB) | 설치된 `mcp` 버전에서 import 성공, 서버 객체 `MCPServer`(2.x) 또는 FastMCP(1.x) | code | FUNC-MCP-001 |
| `TC-MCP-002` | UI | MCP 연동 대화상자 | `더보기` → `MCP 연동` | 대화상자 접근성 속성·Escape | audit | FUNC-MCP-007 |
| `TC-MCP-003` | 동시 실행 | MCP 수집과 웹 수집 | | 같은 잠금 파일을 쓴다 → `TC-COLL-003` 으로 대신 확인 | curl, code | FUNC-MCP-005 |

### 2.7 UI 공통
| 케이스 ID | 구분 | 검증 시나리오 | 사전 조건 및 입력 | 기대 결과 | 방법 | FSD |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TC-UI-001` | E2E 정상 | frontend 헬스·페이지 | `/api/health`, `/`, `/chat` | 200, `version` = 앱 버전 | runner | 07 화면·라우트 |
| `TC-UI-002` | E2E 정상 | frontend 프록시 | `GET :23001/api/stats` | 200 | curl | 07 화면·라우트 |
| `TC-UI-003` | 잘못된 입력 | 없는 경로 | `/no-such-page` | 404 | curl | 07 화면·라우트 |
| `TC-UI-006` | 반응형·접근성 | 폭·테마별 화면 규칙 21종 | `ui-audit.mjs --base http://localhost:23001 --screenshots none` | 종료 0. 사용자 데이터 때문에 실패하면 원인을 데이터에서 확인하고, 그 데이터만 사본에서 지운 다시 실행으로 코드 결과를 따로 적는다 | audit | FUNC-UI-008, 009, 014 |
| `TC-UI-007` | 접근성 | 키보드 포커스 표시 | `TC-NEWS-022` | `:focus-visible` 2px | UI | FUNC-UI-014 |
| `TC-UI-008` | 외부 의존 실패 | 깨진 저장값 | `agentlens_bookmarks`·`agentlens_chat_sessions_index` 에 배열이 아닌 값 | 피드·챗이 그려지고 오류 경계 없음 | UI | FUNC-NEWS-007, FUNC-CHAT-001 |
| `TC-SEC-001` | **범위 밖** | 임의 origin CORS | | 판정 안 함 (OOS-1) | — | — |

---

## 3. 테스트 실행 지침 및 판정 기준 (Execution Guidelines & Quality Gates)

1. 시작 전 기록: `git status --porcelain`, `sources.json`·`backend/app/config/sources.json`·`config.json` md5, `lsof` 로 사용자 포트(3000·8000) 상태.
2. 환경: 1.2 대로 DB 사본을 뜨고 backend(28000)·frontend(23001)를 띄운다. `/health` 의 `version`, 시작 로그의 스케줄러 꺼짐, 번들의 `:8000` 없음을 확인한다.
3. `make check` 를 따로(백그라운드로) 돌린다. 테스트는 임시 DB 와 네트워크 가드를 쓰므로 실행 중인 앱과 겹치지 않는다 (4.2).
4. 스모크: `python3 .claude/skills/fullstack-qa-testing/scripts/qa_runner.py --base-url http://localhost:28000 --frontend-url http://localhost:23001` (GET 16개, 데이터 변경 없음, 종료 0).
5. 시나리오: 2절의 `curl` 케이스를 스크립트로 부르고 상태 코드·응답 시간·본문을 남긴다. 지운 엔드포인트는 앱 라우트 목록에 없음을 먼저 확인하고 부른다. 수집 잠금 케이스는 1.3 의 조건에서만 부른다.
6. UI: Playwright 스크립트로 2절 UI 케이스를 돈다. 쓰기 요청은 `page.route` 로 막고, LLM 이 필요한 챗 스트림은 `fetch` 흉내로 그린다.
7. 화면 규칙: `cd frontend && node scripts/ui-audit.mjs --base http://localhost:23001 --screenshots none` (결과 `docs/qa-engineer/ui-audit/report.json`).
8. 정리: 띄운 서버를 모두 내리고(`lsof` 로 확인), 시작 전과 `git status --porcelain`·md5 를 비교한다. 사용자·버전 변경(`sources.json`·`config.json`)은 되돌리지 않는다. QA 가 바꾼 추적 파일이 있으면 그 파일만 원인과 함께 기록한다.
9. 결함 심각도:
   - `Blocker`: 핵심 흐름(피드 표시, 챗 질의, 수집)이 막히거나 데이터가 손상·유실된다.
   - `Critical`: 보안·데이터 정확성에 실제 피해가 나거나 기능이 틀린 결과를 정상처럼 보인다.
   - `Minor`: 표기·문구·계약·명세 불일치, 쓰이지 않는 코드, 운영 편의 문제처럼 사용 흐름을 막지 않는 것.
10. 판정: Blocker·Critical 이 0 이면 `RELEASE_APPROVED`, 아니면 `RELEASE_BLOCKED`. 1.4 의 범위 밖 항목은 판정에 세지 않는다. 사용자 DB 의 데이터 조건(옛 행, 수집 원문)은 결함과 따로 '관찰' 로 적는다.

---

## 4. 자동 테스트 전략

저장소의 자동 검사(`make check`)와 화면 측정(`ui-audit.mjs`)의 명령, 종류, 격리, 외부 호출 정책, 통과 기준이다.

### 4.1 검사 명령
- 전체: `make check` (backend 다음 frontend. 하나라도 실패하면 0 이 아닌 값)
- backend: `cd backend && ../.venv/bin/pytest -v tests/` (`backend/pytest.ini`: `asyncio_mode = auto`, `pythonpath = .`). 커버리지는 `pytest-cov` 가 `backend/requirements-dev.txt` 에 있고(`make setup` 이 설치) `make check` 는 `--cov` 를 쓰지 않는다
- frontend: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit`
- `make test` 는 `make check` 와 같다.

### 4.2 테스트 종류와 격리
| 종류 | 대상 | 위치 | 언제 돈다 |
|---|---|---|---|
| 단위·API | backend API·서비스·수집기·마이그레이션·오류 형식·네트워크 가드 | `backend/tests/test_*.py` (36개 파일, 418개) | 매 변경 |
| Makefile·스크립트 회귀 | Makefile 대상·`make -n`, `scripts/collect.py` 모드·`other_process`, 빈 DB 첫 수집, `sources.json` 저장 대체 경로 | `test_make_targets.py`, `test_collect_script.py`, `test_startup_seed.py`, `test_sources_write_fallback.py` | 매 변경 |
| 단위 | frontend 컴포넌트·훅·lib (vitest, jsdom, MSW) | `frontend/src/tests/**/*.test.ts(x)` (70개 파일, 833개) | 매 변경 |
| 정적 검사 | 디자인 토큰·대비, 그림 이모지, `'use client'` 경계 | `design/TokenGuard.test.ts`, `TokenContrast.test.ts`, `ThemeColor.test.ts`, `ui/IconGuard.test.ts`, `ui/ClientBoundaryGuard.test.ts` | 매 변경 |
| 계약 | zod ↔ MSW ↔ backend 응답 모양 | `chat/ContractAndMsw.test.ts`, `lib/chatSsePayload.test.ts`, `lib/newsAskSsePayload.test.ts` | 매 변경 |
| 화면 측정 | 폭·테마별 화면 규칙 21종 (4.4) | `frontend/scripts/ui-audit.mjs` | 화면을 바꿨을 때와 릴리스 QA, 프로덕션 빌드 대상 (`make check` 밖) |
| 통합 E2E | 두 앱을 함께 | 자동화 없음. 1~3절의 수동·스크립트 QA 로 대신한다 | 릴리스 전 |

**backend 격리** (`backend/tests/conftest.py`, `backend/tests/llm_fakes.py`)
- **테스트 DB 는 임시 폴더다**: `conftest.py:8` 이 실행마다 `tempfile.mkdtemp(prefix="agentlens-test-")` 안의 `test_agentlens.db` 를 `DATABASE_URL` 로 둔다. 앞 실행의 행이 섞이지 않고 동시에 돌린 pytest 끼리도 부딪히지 않는다. 세션이 끝나면 `pytest_sessionfinish`(`conftest.py:12-15`)가 그 폴더를 지운다. 개발 DB `backend/agentlens.db` 는 쓰지 않는다.
- **외부 네트워크를 흉내 내고 막는다**: `llm_fakes.py` 가 `httpx`·`httpx2` 의 기본 전송을 감싼다. LLM 호스트(`api.anthropic.com`, `api.openai.com`, `generativelanguage.googleapis.com`, 포트 11434, 등록한 Ollama 주소)는 흉내가 답하고, 흉내가 없으면 보내지 않고 `ConnectError` 를 낸다. LLM 이 아닌 외부 호스트(스크래퍼·Notion·웹훅·피드 탐침)는 `register_web` 으로 등록한 URL 만 흉내가 답하고, 등록하지 않은 요청은 보내지 않고 `ConnectError` 를 내며 기록한다. 루프백(127.0.0.1, localhost, ::1)만 실제로 나간다. autouse `llm_isolation` 이 테스트 끝에 `assert_no_unmocked()`·`assert_no_blocked_external()` 로 그 테스트를 실패시킨다 (`conftest.py:191-233`, `test_network_guard.py` 8개).
- **SMTP 흉내**: autouse `fake_smtp` 가 `smtplib.SMTP`·`SMTP_SSL` 을 기록만 하는 흉내로 바꾼다. 메일은 나가지 않는다.
- **남은 백그라운드 태스크**: autouse `cancel_leftover_tasks` 가 테스트가 띄우고 기다리지 않은 태스크(예: `run-deep` 의 `create_task`)를 테스트 끝에 취소한다.
- **LLM 원천 격리**: `llm_isolation` 이 LLM 환경 변수·설정을 비우고 가짜 Anthropic 키로 흉내 Claude 를 쓰는 상태를 기본으로 둔다. 캐시(`clear_caches`)를 테스트마다 비운다. `Settings.model_config["env_file"]` 을 `None` 으로 둬 `.env` 를 다시 읽지 않는다.
- **설정 파일 격리**: 세션 fixture 가 루트 `config.json`(LLM 키·Ollama 주소 비움)과 `sources.json` 을 세션 임시 폴더에 복사하고 `find_config_json`·`_json_data`·`sources_service._file_path`·`_mirror_path` 를 사본으로 돌린다. `make check` 뒤 추적 파일은 바뀌지 않는다.

**frontend 격리** (`frontend/src/tests/setup.ts`, `frontend/src/mocks/`)
- **목 없는 MSW 요청은 실패한다**: `server.listen({ onUnhandledRequest: recordUnhandledRequest })`(`setup.ts:75`). `recordUnhandledRequest`(`mocks/server.ts:13-20`)가 요청을 기록하고 던져서 실제 네트워크(사용자 `make dev` 등)로 나가지 않게 한다. `afterEach`(`setup.ts:76-82`)가 기록이 있으면 그 테스트를 실패시킨다 (앱 코드가 fetch 오류를 삼켜도 드러난다). 화면이 부르는 운영 엔드포인트의 기본 핸들러는 `mocks/handlers/ops.ts` 에 있다. `lib/MswIsolation.test.ts` 가 이 동작을 검증한다.
- jsdom 은 레이아웃을 계산하지 않는다. 크기·위치·넘침은 `ui-audit.mjs` 와 Playwright 로 잰다.

### 4.3 외부 호출과 파일 부작용
- `make check` 는 실제 LLM·스크래퍼·Notion·웹훅·SMTP 로 나가지 않는다 (4.2 의 가드와 흉내). 예전에 외부로 나가던 테스트(scoped 챗 스크래퍼, GitHub 피드 탐침, Notion GET, SMTP 연결)는 `register_web`·`fake_smtp` 로 흉내 내거나 가드에 막혀 실패하도록 바뀌었다. 네트워크가 없어도 결과가 같다.
- 루프백 요청은 실제로 나간다 (예: `test_collect_script.py` 의 스텁 HTTP 서버).
- 설정 파일을 쓰는 테스트는 세션 사본에 쓴다. `make check` 뒤 `git status` 에 `config.json`·`sources.json`·`backend/app/config/sources.json` 변경이 없어야 한다.
- 실제 Claude 응답 품질 확인은 `make check` 에 없다.

### 4.4 화면 측정 (`ui-audit.mjs`)
- 실행: 프로덕션 빌드 앱을 띄운 뒤 `cd frontend && node scripts/ui-audit.mjs --base <주소> [--screenshots none] [--out <폴더>]`. 개발 서버(`nextjs-portal` 표시기)는 환경 오류 종료 2. 로컬 Chrome 이 필요하다 (`CHROME_PATH`).
- 대상: `/`·`/chat` × 라이트·다크 × 360·390·768·1024·1440px, `/` 의 대화상자 9개(뉴스 상세 탭 2개), 레이더 펼침, `/chat` 의 기사 맥락·없는 기사·포커스 필터 열림 = 160조합.
- 판정 21종: `clip`, `placeholder`, `occluded`, `scrollRow`, `ariaControls`, `keepAll`(모든 상태), `rowAlign`, `vRhythm`, `chatAlign`, `toast`, `toolbarLayout`, `cardMetric`, `chatScope`, `terms`, `modelPicker`, `focusLabels`, `feedAreas`, `chatHeader`, `pictograph`, `briefing`, `cardFooter`. 실패 조건과 대상 상태는 `docs/ui-system-designer/02_DESIGN_SYSTEM.md` 8절과 `frontend/scripts/ui-audit.mjs` 도움말이 기준이다.
- `pictograph` 는 조작 요소·라벨·제목 글자의 그림 이모지를 보므로 사용자 데이터(세션 제목 등)의 이모지도 잡는다. 그 경우는 결함이 아니라 데이터 조건으로 적는다 (3절 10).
- `--self-test`: 앱 없이 fixture(`scripts/ui-audit-fixtures/`)로 판정 자체를 검증한다. 판정 코드를 고쳤으면 먼저 돌린다.
- 결과: `report.json`(측정 상태마다 판정 결과, `environment.commit`·`devIndicator`), 종료 0 통과·1 실패·2 환경 오류.

### 4.5 통과 기준
- `make check` 종료 0 (pytest 실패 0, vitest 실패 0, eslint 오류·경고 0, `tsc --noEmit` 오류 0)
- 버그 수정은 먼저 실패하던 테스트가 통과한다
- 계약을 바꿨으면 `ContractAndMsw.test.ts` 가 바뀐 계약으로 통과한다
- 화면을 바꿨으면 `ui-audit.mjs` 가 코드 기준으로 실패 0 이다

### 4.6 릴리스 전 통합·회귀 검증
- `make check` 통과, 버전 문자열(`docs/releases.md` '버전 문자열 위치')이 모두 새 버전.
- 이 문서 1~3절의 실행 중인 앱 QA → `02_QA_TEST_REPORT.md`.
- Docker 빌드·헬스체크는 `devops-engineer` 가 `make docker-build`·`make docker-up` 으로 확인한다. Docker 는 루트 `config.json`·`sources.json` 을 rw 마운트하므로 설정·소스를 저장하면 추적 파일이 바뀐다.

---

## 5. 자동 테스트 현황 요약

2026-11-10 15:00 `make check`(마지막 수정 뒤 이 QA 가 직접 실행, 종료 0) 기준. 같은 날 1차 회귀 실행은 backend 410·frontend 823 이었다.

| 구분 | 파일 수 | 테스트 수 | 결과 |
|---|---|---|---|
| backend (`backend/tests/test_*.py`) | 36 (+ `conftest.py`, `llm_fakes.py`) | 418 | `418 passed in 12.88s` |
| frontend (`frontend/src/tests/**/*.test.ts(x)`) | 70 (+ `setup.ts`) | 833 | `Test Files 70 passed (70)`, `Tests 833 passed (833)` |
| eslint / `tsc --noEmit` | — | — | 출력 없음 |

- v0.4.2 에서 더한 backend 파일: `test_b_collection.py`, `test_b_config_schedule_db.py`, `test_b_news_api.py`, `test_b_round2.py`, `test_b_sources_research.py`, `test_briefing_output.py`, `test_error_format.py`, `test_input_limits.py`, `test_llm_provider_isolation.py`, `test_network_guard.py`, `test_news_service.py`, `test_scheduler.py`, `test_transactions.py`, `test_v042_a_round2.py`, `test_v042_llm_chat.py`, `test_b_round4.py`(마지막 수정: 지운 경로 리다이렉트 없음, `category_hint`, `inspect-url` 예외 숨김, 채택 저장 실패 감사, 직접 모드 경고).
- v0.4.2 에서 더한 frontend 파일: `app/ErrorBoundary.test.tsx`, `app/EnvAndHealth.test.ts`, `ui/ClientBoundaryGuard.test.ts`, `design/ThemeColor.test.ts`, `chat/ChatSessionParam.test.tsx`, `chat/ChatUnusedApi.test.tsx`, `chat/useChatSessions.test.tsx`, `hooks/useBookmarks.test.tsx`, `lib/chatApi.test.ts`, `lib/askStream.test.ts`, `lib/chatSsePayload.test.ts`, `lib/newsAskSsePayload.test.ts`, `lib/MswIsolation.test.ts`, `feed/HomePage.test.tsx` 등.
- 파일별 테스트 이름과 단언은 TDD 로그(`docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md`, `docs/frontend-tdd-engineer/01_TDD_CYCLE_LOG.md`)에 있다.

---

## 6. 기능 영역별 커버리지

"있음" 은 테스트가 검증하는 동작, "없음" 은 자동 테스트가 직접 단언하지 않아 1~3절의 실행 QA 로 보완하는 동작이다. 세부 근거는 TDD 로그.

| 영역 | 있음 (대표 파일) | 없음 (QA 로 보완) |
|---|---|---|
| NEWS | 목록·필터·검색·정렬·페이지(`test_b_news_api.py`, `test_news_service.py`), RSS NULL·이스케이프·채널 링크, Ask AI 스트림 `error` 이벤트·캐시 안 함·질문 길이(`test_v042_llm_chat.py`, `test_input_limits.py`), 카드·상세·Ask AI 패널·검색 디바운스·북마크 저장값(`NewsCard`, `AskAiPanel`, `feed/*`, `hooks/useBookmarks`) | 실제 브라우저 레이아웃(`ui-audit`), 실제 backend 와 함께 도는 Ask AI 화면(`TC-NEWS-030`·`031`) |
| CHAT | 입력 검증·오류 코드·`session_id` UUID, 세션 업서트·rollback·다른 세션 id, 시각 오프셋, 스트림 단계·출처 순서·끊김(`test_chat.py`, `test_chat_sessions.py`, `test_transactions.py`, `test_v042_a_round2.py`, `test_code_review_fixes.py`), 화면 스트림·재시도·세션 전환·이관·인용 팝오버·모바일 스크롤(`chat/*`) | 실제 Claude 응답, 실제 기기 가상 키보드(Playwright 뷰포트 축소로 흉내, `TC-CHAT-035`) |
| COLL | 수집기별 원천 지표, 잠금(`other_process`), 크롤 로그 상태, 스케줄 cron·`scheduler.enabled`, m003(`test_b_collection.py`, `test_b_config_schedule_db.py`, `test_scheduler.py`, `test_b_round2.py`), 헤더·스케줄 대화상자·수집 훅(`Header`, `modals/ScheduleModal`, `hooks/useCollector`) | 실제 외부 소스 수집 (실행하지 않음) |
| BRF | 브리핑 문자열·자르기·분야 이름, 메일 이스케이프·링크, 자동 발송 스위치, 설정 저장 원자성(`test_briefing_output.py`, `test_briefing_notion_email.py`), 대화상자(`modals/DailyBriefingModal`, `BriefingSettingsModal`) | 실제 Notion·메일·웹훅 발송 (실행하지 않음) |
| SRC | RSS 추가 검증·저장 실패 500·id 슬러그, 토글 `all`, 딥 리서치 실패 요약·후보(`test_b_sources_research.py`, `test_deep_researcher.py`, `test_sources_and_research.py`), 소스 대화상자 Error·Empty(`modals/SourcesModal`, `DeepResearcherTab`) | 유효 입력의 실제 저장 (추적 파일이 바뀌어 실행하지 않음) |
| MCP | 도구 첫 호출 때 스키마, 잠금 공유(`test_b_collection.py`) | MCP 클라이언트로 도구 실제 호출 |
| UI | 테마·단축키·팔레트·오류 경계·환경 변수·헬스 버전·토큰·이모지·`'use client'`(`ThemeSystem`, `HotkeyListener`, `app/*`, `design/*`, `ui/*`) | 폭별 화면 규칙(`ui-audit`) |
| 설정·DB | 상대 DB 경로, 마이그레이션 `user_version`·실패 raise, FTS DDL 한 곳, 설정 캐시(`test_b_config_schedule_db.py`) | 실제 사용자 DB 에 대한 마이그레이션 (QA 가 사본으로 확인, 보고서 N-11) |

---

## 7. 외부 호출 판정

판정 기준: "외부 호출함" 은 mock 없이 인터넷 호스트로 요청을 보내는 경로가 테스트에서 실행된다는 뜻이다.

| 항목 | 판정 | 근거 |
|---|---|---|
| backend 테스트 전체 | 안 함 | `httpx`·`httpx2` 전송을 감싼 가드가 LLM·외부 호스트 요청을 흉내 내거나 막고, 막힌 요청이 있으면 그 테스트를 실패시킨다 (`backend/tests/llm_fakes.py:1-15`, `:165-186`, `conftest.py:231-233`). `make check` 418개가 가드 실패 없이 통과했다 |
| SMTP | 안 함 | autouse `fake_smtp` (`conftest.py:269-279`) |
| `feedparser` | 안 함 | 앱 코드는 `httpx` 로 받은 본문을 `feedparser.parse(resp.text)` 로만 파싱한다 (`collectors/sources/rss.py:56`, `services/source_researcher.py:133`, `services/deep_researcher.py:280`). URL 을 직접 열지 않으므로 가드 밖으로 새지 않는다 |
| 루프백 | 로컬 | 가드가 그대로 보낸다. `test_collect_script.py` 스텁 서버 |
| frontend 테스트 전체 | 안 함 | 목 없는 요청은 MSW 가 던져서 막고 테스트를 실패시킨다 (`mocks/server.ts:13-20`, `tests/setup.ts:75-82`). 예전에 목 없는 `/api/trends/radar`·`/api/schedule/status` 가 사용자 `make dev`(:3000)로 나가던 경로는 `mocks/handlers/ops.ts` 기본 핸들러로 막혔다 |
| `.env` 읽기 | 반영 안 됨 | `config.py` 가 import 때 `.env` 를 읽지만 `llm_isolation` 이 LLM 값을 지우고 `env_file` 을 `None` 으로 둔다. `DATABASE_URL` 은 `conftest.py:9` 가 먼저 정해 `.env` 가 덮지 못한다 |

---

## 8. 테스트의 알려진 불일치·위험

### 8.1 테스트가 쓰는 설정 파일
- 설정·소스를 쓰는 테스트는 세션 사본에 쓴다. 같은 세션의 뒤 테스트는 바뀐 사본을 본다.
- 커밋된 루트 `config.json` 에는 예전 실행이 남긴 값(`notion.page_id: "test_notion_parent_page"`, `email.smtp_host: "smtp.gmail.com"`, `email.smtp_to: "team@example.com"`)이 있다. SMTP 는 흉내라 연결하지 않는다.

### 8.2 테스트 DB
- 실행마다 새 임시 폴더, 끝나면 삭제 (4.2). 실행 사이에 행이 남지 않는다. 예전 위치 `backend/tests/test_agentlens.db` 는 더 쓰지 않고 `make clean` 이 지운다.

### 8.3 순서 의존
- 프로세스 전역 상태(LLM 캐시)는 `llm_isolation` 이 테스트마다 `clear_caches()` 로 비운다. 스크래퍼 L1 캐시는 클래스 속성이라 프로세스 전체에서 공유된다 (외부 요청은 가드가 막으므로 결과는 흉내 등록 여부로만 갈린다).
- 남은 백그라운드 태스크는 `cancel_leftover_tasks` 가 취소한다.

### 8.4 실행 환경에 따라 실패할 수 있는 테스트
- 네트워크 유무로 결과가 바뀌는 테스트는 없다 (가드).
- `.env` 의 `VERSION`·`ANTHROPIC_*_MODEL` 이 바뀌면 버전·기본 모델 테스트가 영향을 받을 수 있다 (`docs/releases.md` 버전 위치를 함께 고친다).
- `test_make_targets.py::test_t4_compose_config_is_valid` 는 docker CLI 가 없으면 `pytest.skip`.

### 8.5 실행 QA 와 자동 테스트의 차이
- 챗·Ask AI 의 정상 스트림은 자동 테스트와 화면 흉내로만 확인한다. 실제 LLM 품질·지연은 QA 범위가 아니다.
- 수집 잠금은 실행 QA 에서 "다른 프로세스가 쥔 상태" 만 확인한다. 이 프로세스가 수집 중인 상태는 실제 수집이 필요해 단위 테스트(`test_collect_all_refuses_when_other_process_holds_lock`, `test_trigger_reports_already_running_when_other_process_collects`)로 본다.

### 8.6 건너뛰는 테스트
- `skip`·`xfail`·`.only`·`.todo` 마커는 없다. 실행 중 건너뛰기는 8.4 의 docker CLI 조건 하나다.
