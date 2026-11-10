# [Backend v0.4.0 as-built 전체 감사 → v0.4.2 재리뷰] 5-Pillar 코드 품질 감사 및 리뷰 보고서 (Code Review Report)

Updated: 2026-11-10
기준: v0.4.2 (main)

- **검토일자**: 2026-11-09 (최초 감사, 재리뷰 1·2차), 2026-11-10 (v0.4.2 재리뷰)
- **검토자**: 시니어 백엔드 코드 리뷰어 (`backend-code-reviewer`)
- **검토 대상 PR / 브랜치**: 최초 감사는 `main` (`3973ae9` release v0.4.0 위 `9e0c9e5`) 의 backend 전체. v0.4.2 재리뷰는 `main` (`4944a5e` release v0.4.1) 위 작업 트리(커밋 전) `git diff HEAD -- backend` 와 새 파일 13개 (`backend/app/api/errors.py`, `backend/app/services/news_service.py`, `backend/tests/test_*.py` 11개), 함께 바뀐 `config.json`·`.env.example`·`backend/.env.example`·`docker-compose.yml`·`.gitignore` (11절)
  - `backend/app/**` (라우터 10개, 서비스 15개, 수집기, 모델, 스키마, 설정, 스케줄러, MCP 서버)
  - `backend/tests/**` (v0.4.2: 33개 파일, 384개 테스트)
  - `scripts/*.py` (`scripts/collect.py`)
- **대조한 산출물**: `docs/system-designer/01_SYSTEM_DESIGN.md` (특히 1.3, 4.2~4.5, 13), `docs/fullstack-architect/01_ARCHITECTURE_ADR.md`, `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` (v1.3), `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md` ([Cycle v0.4.2-A/B/C]), `docs/qa-engineer/02_QA_TEST_REPORT.md` 3절, 오케스트레이터 변경 요약(스크래치 `v042-changes.md`), 옛 `docs/known-issues.md` 의 backend 행 (대응표는 6절)
- **최종 판정**: **APPROVED** (v0.4.2 4차 재리뷰 2026-11-10 기준. 머지 전 필수 0건, 권장 0건. 11.13절)
- **재리뷰**: 2026-11-09, 1차는 backend-tdd-engineer Cycle 6 수정분(작업 트리, 커밋 전, `git diff -- backend/`)과 frontend FE-02 (10.1~10.7), 2차는 BUG-02R 수정분(계약 8.1) (10.8). 2026-11-10 v0.4.2 재리뷰는 남은 권장 50건 수정분 (11절). 판정 이력: 최초 REQUEST_CHANGES → 1차 REQUEST_CHANGES(BUG-02R) → 2차 APPROVED → v0.4.2 APPROVED → v0.4.2 2차 REQUEST_CHANGES(M003-01) → v0.4.2 3차 APPROVED → v0.4.2 4차 APPROVED. 11.11절은 v0.4.2 2차 수정분, 11.12절은 M003-01 수정분, 11.13절은 4차 수정 5건이다. 1~8절은 최초 감사(수정 전 코드) 기준 기록이고, 줄 번호도 수정 전 파일 기준이다. 10절은 v0.4.1 작업 트리 기준, 11절은 v0.4.2 작업 트리 기준이다.
- **검사 범위 결정**: 제품 오너 결정(2026-11-09, 오케스트레이터 전달)에 따라 인증 없음·CORS 전체 허용, SSRF, 비밀값 평문 저장, 설정 조회로 비밀값 노출, 설정 재적용 누락은 검사하지 않는다. 이 범주에서 찾은 6건(SEC-01, SEC-02, SEC-04, SEC-05, SEC-06, BUG-01)은 9절 '검사 범위 밖 (수용된 위험)' 에 사실과 근거 `path:line` 만 남기고 판정 근거로 쓰지 않는다.

검토 방법
- 코드는 모두 직접 읽고 `path:line` 을 지금 파일과 대조했다.
- 결함 9건은 스크래치 스크립트로 직접 재현했다 (임시 DB, `httpx.ASGITransport`, lifespan 없음, 저장소 파일을 쓰지 않음). 출력은 5절.
- `make check` 를 직접 돌렸다 (4절). 종료 0, 실행 전후 `git status --short` 같음.
- 심각도: **머지 전 필수** = 출시 전에 고쳐야 할 버그·보안·계약 불일치·테스트 누락. **권장** = 품질·운영 개선. **범위 밖 (수용된 위험)** = 위 결정으로 검사하지 않는 범주, 판정에 넣지 않음. 린트·타입 오류(`make check` 가 잡는 것)는 지적하지 않았다.
- "코드상 판단" 은 코드를 읽고 추론했고 실행하지 않은 것이다. 실행으로 확인한 것은 "재현" 으로 적었다.

---

## 1. 5-Pillar 코드 품질 감사 매트릭스 (5-Pillar Audit)

v0.4.2 기준 매트릭스는 11.1절에 있다. 아래 표는 최초 감사(v0.4.0 코드) 기준 기록이다.

| 감사 필라 (Pillar) | 세부 검토 기준 | 평가 점수 (1~5) | 검토 소견 및 발견 사항 |
| :--- | :--- | :---: | :--- |
| **Pillar 1: 아키텍처 정합성** | 계층 분리(Router/Service/Model), 설계 문서 일치도 | 3 / 5 | 설계서(`01_SYSTEM_DESIGN.md`)가 지금 코드를 그대로 적어 문서-코드 차이는 작다. 다만 설계서 1.3 이 적은 규약 위반이 그대로 남아 있다: 라우터의 모델 직접 쿼리·삭제(ARCH-01), services ↔ collectors 양방향 의존(ARCH-02), 요청 중간 커밋으로 흩어진 트랜잭션 경계(ARCH-03), 별도 프로세스(MCP·직접 수집)의 중복 방지·스키마 생성 우회(ARCH-04), 운영 코드가 pytest 존재 여부로 분기(ARCH-05) |
| **Pillar 2: 클린코드 & SOLID** | 단일 책임 원칙, 중복 코드 부재, 변수/함수 네이밍 가독성 | 2 / 5 | `api/chat.py` 의 오류 응답 블록 반복(CC-01), 쓰이지 않는 서비스·엔드포인트·설정(CC-02), FTS 생성 SQL 두 벌(CC-03), 중복 인덱스(CC-04), 같은 함수의 두 엔드포인트(CC-05), 예외를 삼키는 스키마 보정(CC-06), 동작과 다른 이름·문서 문자열(CC-07). `config.py` 의 클래스 정의 시점 기본값 평가가 BUG-01(수용된 위험, 9절)의 원인이다 |
| **Pillar 3: 보안 & 데이터 무결성**| SQL Injection 방어, 입력값 Sanitization, 권한 검증, 환경변수 유출 방지 | 2 / 5 | 검사 범위 안: SQL 은 모두 바인드 파라미터다 (`retriever.py:282-301`, ORM). 예외 문자열(SQL 문과 사용자 메시지 내용 포함, 재현)·절대 경로 노출(SEC-03), 이메일 HTML 비이스케이프(SEC-07). 무결성: 챗 메시지 이중 저장과 PK 충돌 500(BUG-02, 재현), 검증 실패 500(BUG-06, 재현), 딥 리서치 플래그 고착(BUG-03), 스트림 답 섞임·잘린 답 완료 처리(BUG-07·08). 점수는 범위 안 지적으로만 매겼다. 인증·CORS(SEC-01, 재현), 저장 SMTP 비밀번호의 외부 호스트 전송(SEC-02), 설정 조회 비밀값 노출(SEC-04), SSRF(SEC-05), 비밀값 평문(SEC-06), 설정 재적용 누락(BUG-01, 재현)은 수용된 위험으로 9절에 둔다 |
| **Pillar 4: 성능 & 리소스 최적화**| 불필요한 리렌더 방지, N+1 쿼리 부재, 비동기 논블로킹 준수 | 3 / 5 | N+1 은 FIFO 삭제 루프(`chat_session_service.py:454-457`) 외에 없다. 이벤트 루프 블로킹(동기 Ollama 판정이 수집 항목마다, 본문 추출·피드 파싱, PERF-01·03), 수집 배치가 LLM 대기 동안 SQLite 쓰기 잠금 보유(PERF-02), 무한 증가 캐시(PERF-05), 매 호출 설정 파일 재읽기(PERF-04), GET 의 FTS 검사·쓰기(PERF-06), 비용 엔드포인트 속도 제한·길이 제한 없음(PERF-07, 재현) |
| **Pillar 5: 테스트 품질 & 커버리지**| Red-Green TDD 준수 여부, 엣지/에러 케이스 커버리지 | 2 / 5 | 217개 모두 통과(4절). 그러나 이 보고서의 필수 결함 7건(BUG-02~08) 중 어느 것도 회귀 테스트가 없다(TEST-01). 여러 상태를 허용하는 약한 단언(TEST-02), 실네트워크 호출·테스트 뒤에도 도는 백그라운드 태스크(TEST-03), 실행 사이에 남는 테스트 DB(TEST-04), 커버리지 도구 없음(TEST-06). v0.1.0~v0.3.1 은 테스트와 코드가 한 커밋이라 Red→Green 순서를 확인할 수 없고, v0.4.0 작업은 reflog 로 테스트 먼저 커밋이 확인된다(TEST-05, `01_TDD_CYCLE_LOG.md` 2.0) |

### 1.1 지적 요약

최초 감사 기준 개수다. 재리뷰 뒤 상태는 10.4절(1차), 10.8.5절(2차: 필수 0, 해결 8, 권장 50, 범위 밖 6), 11.9절(v0.4.2: 필수 0, 권장 9, 범위 밖 6)에 있다.

| 심각도 | 개수 | ID |
|---|---|---|
| 머지 전 필수 | 8 | BUG-02, BUG-03, BUG-04, BUG-05, BUG-06, BUG-07, BUG-08, TEST-01 |
| 권장 | 43 | SEC-03, SEC-07, BUG-09~21, CFG-01~04, ARCH-01~05, CC-01~07, PERF-01~07, TEST-02~06 |
| 범위 밖 (수용된 위험) | 6 | SEC-01, SEC-02, SEC-04, SEC-05, SEC-06, BUG-01 (9절, 판정에 넣지 않음) |
| 합계 | 57 | |

| ID | 심각도 | 필라 | 위치 | 요지 | 확인 |
|---|---|---|---|---|---|
| SEC-01 | 범위 밖 (수용된 위험) | 3 | `backend/app/main.py:50-56` | 인증 없음 + CORS 임의 origin 반사·credentials + 0.0.0.0 바인드. 파괴·설정 엔드포인트가 열려 있다 | 재현 |
| SEC-02 | 범위 밖 (수용된 위험) | 3 | `backend/app/services/email_service.py:190-193` | `test/email` 이 저장된 SMTP 비밀번호를 호출자가 준 호스트로 보낸다 | 코드상 판단 |
| SEC-03 | 권장 | 3 | `backend/app/main.py:64-67`, `backend/app/api/chat.py:120`, `:272`, `:438`, `:468`, `:491`, `:520`, `:558` | 예외 문자열(SQL 문·파라미터 포함)과 절대 경로 응답 | 재현 |
| SEC-04 | 범위 밖 (수용된 위험) | 3 | `backend/app/api/briefing.py:125-158` | 웹훅 URL 비마스킹, Notion 토큰 앞뒤 4자 노출 | 재현 |
| SEC-05 | 범위 밖 (수용된 위험) | 3 | `backend/app/services/webhook_service.py:22-26`, `backend/app/services/source_researcher.py:205`, `backend/app/api/briefing.py:102-114` | 호출자 지정 URL·SMTP 로 요청 (SSRF), 응답 본문 일부 반사 | 코드상 판단 |
| SEC-06 | 범위 밖 (수용된 위험) | 3 | `backend/app/config.py:161-173`, `backend/app/api/briefing.py:173-207` | 비밀값을 git 추적 `config.json` 에 평문 저장 | 코드 + `git ls-files` |
| SEC-07 | 권장 | 3 | `backend/app/services/email_service.py:35-82` | 이메일 HTML 에 수집 문자열을 이스케이프 없이 삽입 | 코드상 판단 |
| BUG-01 | 범위 밖 (수용된 위험) | 3 | `backend/app/config.py:153-157` | `settings.reload()` 가 Notion·SMTP·웹훅 값을 다시 읽지 않는다 | 재현 |
| BUG-02 | 머지 전 필수 | 3 | `backend/app/services/chat_session_service.py:299-369`, `backend/app/services/chat_service.py:806-822` | 챗 턴 이중 저장, 다음 동기화부터 PK 충돌 500 | 재현 |
| BUG-03 | 머지 전 필수 | 3 | `backend/app/services/deep_researcher.py:385-489` | 예외 시 `is_running` 고착 | 코드상 판단 |
| BUG-04 | 머지 전 필수 | 1 | `backend/app/services/deep_researcher.py:395-412` | 시드 14개가 컷(6·8) 앞에 있어 발굴 후보가 평가되지 않는다 | 코드 + 시드 수 계산 |
| BUG-05 | 머지 전 필수 | 3 | `backend/app/api/sources.py:77`, `:85` | `owner/repo` 저장소 토글·삭제가 라우팅 404 | 재현 |
| BUG-06 | 머지 전 필수 | 3 | `backend/app/api/chat.py:279-406` | 잘못된 `model_tier`·dict 아닌 본문이 500 (계약은 400) | 재현 |
| BUG-07 | 머지 전 필수 | 3 | `backend/app/services/llm_processor.py:900-972` | 기사 Ask AI 스트림 중 실패하면 부분 답 뒤에 다른 답을 이어 붙이고 캐시한다 | 코드상 판단 |
| BUG-08 | 머지 전 필수 | 3 | `backend/app/services/llm_providers/anthropic_provider.py:287-319` | Anthropic 스트림의 `error` 이벤트·`stop_reason` 무시. 잘린 답이 `done` 으로 끝난다 | 코드상 판단 |
| BUG-09 | 권장 | 3 | `backend/app/services/llm_processor.py:122-127`, `:371`, `:433`; `backend/app/services/chat_service.py:558`, `:791` | `last_usage` 싱글턴 공유 | 코드상 판단 |
| BUG-10 | 권장 | 3 | `backend/app/services/llm_processor.py:595-615`, `:676`, `:708` | 평가 캐시가 폴백 거부까지 영구 저장, 초기화 후에도 남음 | 코드상 판단 |
| BUG-11 | 권장 | 3 | `backend/app/collectors/manager.py:224-234`, `:171-174`, `:210-213` | 크롤 로그가 항상 `success`, `error_message` 미기록 | 코드상 판단 |
| BUG-12 | 권장 | 3 | `backend/app/api/news.py:169-197` | RSS: NULL `summary`·`published_at` 이면 500, 채널 링크 3000 고정 | 재현 (NULL summary) |
| BUG-13 | 권장 | 3 | `backend/app/services/chat_service.py:685-707` | 챗 스트림의 계획·검색 단계 예외가 `error` 이벤트 없이 스트림을 끊는다 | 코드상 판단 |
| BUG-14 | 권장 | 3 | `backend/app/schemas/chat.py:30`, `backend/app/services/llm_processor.py:369`, `:428` | `model` 기본값이 채워져 `model_tier` 만 보낸 요청의 티어가 무시된다 | 코드상 판단 |
| BUG-15 | 권장 | 2 | `backend/app/services/briefing_service.py:86-88`, `:101-102` | 브리핑 헤드라인·분야 요약을 글자 수로 잘라 단어 중간에서 끊는다 | 코드상 판단 |
| BUG-16 | 권장 | 2 | `backend/app/services/briefing_service.py:16-38`, `backend/app/services/notion_service.py:79`, `backend/app/services/email_service.py:120`, `backend/app/services/chat_service.py:614`, `:635`, `:678`, `:693`, `:715`, `:734` | backend 문자열의 분야 이름·이모지가 프론트 라벨과 다르다 | 코드상 판단 |
| BUG-17 | 권장 | 3 | `backend/app/services/llm_processor.py:84-89`, `:741-748` | LLM 시사점이 없으면 카테고리 고정 문장을 저장해 여러 기사에 반복 | 코드상 판단 |
| BUG-18 | 권장 | 3 | `backend/app/collectors/sources/rss.py:75`, `arxiv.py:48`, `huggingface.py:33`, `github.py:61-70`, `backend/app/collectors/categorizer.py:147` | `raw_score` 합성 값, 인기 점수 포화 | 코드 + 옛 문서 DB 측정 |
| BUG-19 | 권장 | 3 | `backend/app/api/news.py:96-102` | `DELETE /api/news/all` 은 수집 중 검사가 없다 | 코드상 판단 |
| BUG-20 | 권장 | 3 | `backend/app/api/sources.py:54-91`, `backend/app/services/sources_service.py:169-262` | `save_sources` 실패를 무시하고 성공 응답, RSS `id` 충돌 | 코드상 판단 |
| BUG-21 | 권장 | 3 | `backend/app/api/briefing.py:163`, `backend/app/config.py:166-168` | 설정 저장이 얕은 복사로 메모리 상태를 먼저 바꾸고, 파일을 제자리 쓰기 | 코드상 판단 |
| CFG-01 | 권장 | 1 | `backend/app/scheduler.py:9`, `:39`, `:47`, `:55` | 스케줄 시각이 코드 고정, 설정 값은 표시에만 쓰인다 | 코드상 판단 |
| CFG-02 | 권장 | 2 | `backend/app/config.py:45`, `:49`, `:52`, `:68-71`, `backend/app/api/briefing.py:156-157` | 읽는 코드가 없는 설정 | grep |
| CFG-03 | 권장 | 3 | `backend/app/config.py:65`, `config.json`, `backend/app/services/llm_processor.py:568`, `:661` | 하이시그널 임계값 7.8 vs 7.0 | 코드상 판단 |
| CFG-04 | 권장 | 2 | `backend/app/api/research.py:81`, `backend/app/services/deep_researcher.py:335`, `backend/app/services/llm_processor.py:711-752` | "LLM 평가"·"요약" 이라 부르는 경로가 규칙 기반 | 코드상 판단 |
| ARCH-01 | 권장 | 1 | `backend/app/api/news.py:58-102`, `backend/app/api/stats.py:13-15`, `backend/app/api/schedule.py:20`, `:80-89`, `backend/app/api/chat.py:335-336` | 라우터가 모델을 직접 쿼리·삭제, 수집기 내부 상태를 직접 수정 | 코드 |
| ARCH-02 | 권장 | 1 | `backend/app/collectors/manager.py:12`, `backend/app/services/llm_processor.py:10` | services ↔ collectors 양방향 | 코드 |
| ARCH-03 | 권장 | 1 | `backend/app/services/chat_session_service.py:253`, `:366`, `:458`, `backend/app/services/scraper.py:157-167`, `backend/app/services/retriever.py:62-120` | 요청 중간 커밋, 세션 업서트 3트랜잭션 | 코드 |
| ARCH-04 | 권장 | 1 | `backend/app/mcp/server.py:44-46`, `backend/app/collectors/manager.py:176-180`, `backend/app/config.py:42` | 별도 프로세스가 중복 방지·스키마 생성을 우회, DB 경로 cwd 상대 | 코드 |
| ARCH-05 | 권장 | 1·5 | `backend/app/services/llm_processor.py:288-299`, `backend/app/services/chat_service.py:381`, `:549-550`, `:751-752` | 운영 코드가 pytest·CI 여부와 테스트 대역 시그니처에 맞춰 분기 | 코드 |
| CC-01 | 권장 | 2 | `backend/app/api/chat.py:56-561` | 오류 `JSONResponse` 블록 반복 (약 30개) | 코드 |
| CC-02 | 권장 | 2 | `backend/app/services/chat_service.py:36`, `:83`, `backend/app/services/llm_providers/anthropic_provider.py:321` 외 | 쓰이지 않는 코드·엔드포인트 | grep |
| CC-03 | 권장 | 2 | `backend/app/database.py:73-112`, `backend/app/services/retriever.py:62-120` | FTS 테이블·트리거 생성 SQL 두 벌 | 코드 |
| CC-04 | 권장 | 4 | `backend/app/models/chat_session.py:21`, `:32`, `backend/app/models/news.py:8` | 중복 인덱스 | 코드 |
| CC-05 | 권장 | 2 | `backend/app/api/briefing.py:25-53` | `/today` 와 `/generate` 가 같은 함수 | 코드 |
| CC-06 | 권장 | 2·3 | `backend/app/database.py:49-71` | 스키마 보정 예외를 로그 없이 삼킨다, 마이그레이션 도구 없음 | 코드 |
| CC-07 | 권장 | 2 | `backend/app/models/news.py:62`, `backend/app/scheduler.py:12` | 주석·로그 문구가 실제 값과 다르다 | 코드 |
| PERF-01 | 권장 | 4 | `backend/app/services/llm_processor.py:171-194`, `:319`, `:619` | 동기 `httpx.Client` Ollama 판정이 이벤트 루프를 최대 1초 막는다 (수집 항목마다) | 코드상 판단 |
| PERF-02 | 권장 | 4 | `backend/app/collectors/manager.py:77-168` | 배치가 `_db_lock`·쓰기 트랜잭션을 쥔 채 LLM 평가를 기다린다 | 코드상 판단 |
| PERF-03 | 권장 | 4 | `backend/app/services/scraper.py:93-117`, `backend/app/collectors/sources/rss.py:39`, `backend/app/services/source_researcher.py:281`, `backend/app/services/deep_researcher.py:278` | CPU 파싱을 이벤트 루프에서 | 코드상 판단 |
| PERF-04 | 권장 | 4 | `backend/app/services/llm_processor.py:133`, `:143`, `:154`, `:164`, `:200`, `:304`, `backend/app/services/sources_service.py:137-167` | 호출마다 설정 파일 재읽기 | 코드 |
| PERF-05 | 권장 | 4 | `backend/app/services/llm_processor.py:119-120`, `backend/app/services/scraper.py:37-48` | 크기 제한 없는 캐시·잠금 dict | 코드 |
| PERF-06 | 권장 | 4 | `backend/app/services/retriever.py:57`, `:62-120`, `:117`, `:541` | `_fts_initialized` 를 읽지 않아 검색마다 count 2회, GET 이 rebuild·커밋 | 코드 |
| PERF-07 | 권장 | 3·4 | `backend/app/schemas/news.py:39-40`, `backend/app/api/research.py:68`, `:78`, `backend/app/api/research.py:14` | 비용 엔드포인트 길이·범위·속도 제한 없음 | 재현 (10만 자 질문 200) |
| TEST-01 | 머지 전 필수 | 5 | `backend/tests/` | 필수 결함 7건(BUG-02~08)의 회귀 테스트 없음 | grep |
| TEST-02 | 권장 | 5 | `backend/tests/test_config_and_live_llm.py:11` 외 | 여러 결과를 허용하는 약한 단언 | 코드 |
| TEST-03 | 권장 | 5 | `backend/tests/test_deep_researcher.py:10-14`, `:36-49`, `:69-72` | 실네트워크, 테스트 뒤에도 도는 백그라운드 태스크 | 코드 |
| TEST-04 | 권장 | 5 | `backend/tests/conftest.py:6-7`, `:13-44` | 테스트 DB 가 실행 사이에 남는다 | 코드 |
| TEST-05 | 권장 (기록) | 5 | `git log -- backend/tests/` | v0.1.0~v0.3.1 Red→Green 순서 확인 불가 | `01_TDD_CYCLE_LOG.md` 2.0 |
| TEST-06 | 권장 | 5 | `.venv` | 커버리지 도구 없음, 라이브 planner 경로 미검증 | `01_TDD_CYCLE_LOG.md` 1.4 |

---

## 2. 세부 피드백 및 코드 개선 제안 (Action Items)

### 2.1 Pillar 3 — 보안

검사 범위 밖(수용된 위험)인 SEC-01, SEC-02, SEC-04, SEC-05, SEC-06 은 9절에 있다. 이 절에는 범위 안 지적만 둔다.

#### [권장] SEC-03 예외 문자열·SQL·절대 경로가 응답에 나간다
- **위치**: `backend/app/main.py:64-67`(`"error": str(exc)`), `backend/app/api/chat.py:120`, `:272`(`details.error`), `:438`, `:468`, `:491`, `:520`, `:558`(`message` 에 `str(e)`); 절대 경로 `backend/app/api/sources.py:33`(`sources_file`), `backend/app/api/mcp.py:21-23`(`command`·`cwd`)
- **근거**: 재현 R2 — 두 번째 세션 동기화가 500 `ERR_SESSION_CREATE_FAILED` 로 끝나며 `message` 에 `(sqlite3.IntegrityError) UNIQUE constraint failed: chat_messages.id [SQL: INSERT INTO chat_messages ...] [parameters: [(... 'q1' ...)]]`, 즉 SQL 문과 사용자 대화 내용이 들어갔다. 재현 R3·R4 — 전역 처리기가 `"error": "1 validation error for ChatStreamRequest ..."`, `"'list' object has no attribute 'get'"` 를 돌려줬다. 재현 R5 — `sources_file: /Users/wonyoung/.../agentlens/sources.json`, MCP `cwd: /Users/wonyoung/.../agentlens/backend`. (CORS 설정상 다른 origin 도 이 응답을 읽을 수 있다. CORS 자체는 수용된 위험, 9절 SEC-01.)
- **개선 제안 (Diff)**:
```diff
--- a/backend/app/main.py
-        content={"detail": "Internal server error occurred. Please check server logs.", "error": str(exc)},
+        content={"detail": "Internal server error occurred. Please check server logs."},
--- a/backend/app/api/chat.py
-    except Exception as e:
-        return JSONResponse(status_code=500, content={"error_code": "ERR_SESSION_CREATE_FAILED",
-            "message": f"데이터베이스 세션 트랜잭션 커밋에 실패했습니다: {str(e)}", "details": None})
+    except Exception:
+        logger.exception("chat session upsert failed")
+        return error_response(500, "ERR_SESSION_CREATE_FAILED", "데이터베이스 세션 저장에 실패했습니다.")
```
  (`error_response` 는 CC-01 의 도움 함수.) `sources_file` 은 파일 이름만, MCP `cwd` 는 화면 복사에 필요한 경우에만 준다.

#### [권장] SEC-07 이메일 HTML 에 수집 문자열을 이스케이프 없이 넣는다
- **위치**: `backend/app/services/email_service.py:35-39`(제목·URL·시사점·요약·소스), `:59`, `:70`(분야 이름), `:72`(분야 요약), `:82`(액션 아이템), `:120`(헤드라인)
- **근거**: 파일에 `html.escape` 호출이 없다 (`grep escape` 결과 없음). 수집한 제목에 `<`, `"` 가 있으면 메일 본문 구조가 깨지고, `url` 에 `javascript:` 가 오면 링크가 된다.
- **개선 제안 (Diff)**:
```diff
+from html import escape
 ...
-                title = it.get("title", "소식")
-                url = it.get("url") or "#"
+                title = escape(it.get("title", "소식"))
+                raw_url = it.get("url") or "#"
+                url = escape(raw_url if raw_url.startswith(("http://", "https://")) else "#", quote=True)
```
  `why`, `summary`, `source`, `cat_name`, `cat_summary`, `act`, `headline`, `overview` 도 같은 방식으로 감싼다.

### 2.2 Pillar 3 — 데이터 무결성·동작 결함

설정 재적용 누락(BUG-01)은 검사 범위 밖(수용된 위험)이라 9절에 있다.

#### [머지 전 필수] BUG-02 챗 턴을 서버와 프론트가 둘 다 저장해 중복되고, 두 번째 동기화부터 500 이 난다
- **위치**: 서버 저장 `backend/app/services/chat_service.py:806-822`(`persist_turn`, 새 UUID), 프론트 저장 `frontend/src/components/chat/useChatSessions.ts:234`(전체 메시지를 클라이언트 id 로 `POST /api/chat/sessions`), 삽입 `backend/app/services/chat_session_service.py:299-369`(id 중복 검사 없음), 업서트 `:211-278`
- **근거**: 재현 R2 (같은 순서를 스크립트로 흉내: `persist_turn` → 세션 POST → `persist_turn` → 세션 POST).
```
sync1 201 messages 2
sync2 500 ERR_SESSION_CREATE_FAILED 데이터베이스 세션 트랜잭션 커밋에 실패했습니다: (sqlite3.IntegrityError) UNIQUE constraint failed: chat_messages.id
detail 200 title t2 messages 6
```
  두 턴(실제 메시지 4개)인데 DB 에 6개가 남고, 두 번째 동기화는 PK 충돌 500 이다. 실패했는데도 세션 제목은 `t2` 로 바뀌었다 (세션 행은 `:253` 에서 먼저 커밋, ARCH-03). 첫 동기화 응답의 `messages` 는 2개인데 DB 에는 4개가 있었다: `create_or_upsert_session` 이 `selectinload` 로 읽은 관계 컬렉션이 identity map 에 남아 `get_session_detail`(`:100-108`)이 갱신 전 컬렉션을 돌려준다. 프론트는 응답 상태를 보지 않는다(`useChatSessions.ts:234-245` `catch {}`). `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` CT-008 은 이것을 "실행 확인하지 않음" 으로 적었는데 이번에 backend 쪽 재현으로 확인했다 (uvicorn·브라우저 전체 경로는 실행하지 않았다).
- **개선 제안 (Diff)**: 스트리밍 턴의 저장 주체를 서버 하나로 정하고, 업서트는 이미 있는 id 를 건너뛰게 한다.
```diff
--- a/backend/app/services/chat_session_service.py  (append_messages_batch)
+        incoming_ids = [m["id"] for m in messages if m.get("id")]
+        existing_ids = set()
+        if incoming_ids:
+            existing_ids = set((await self.session.execute(
+                select(ChatMessageModel.id).where(ChatMessageModel.id.in_(incoming_ids))
+            )).scalars())
         created_models: List[ChatMessageModel] = []
         for m in messages:
+            if m.get("id") in existing_ids:
+                continue
--- a/backend/app/services/chat_session_service.py  (get_session_detail)
         stmt = (
             select(ChatSessionModel)
             .options(selectinload(ChatSessionModel.messages))
             .where(ChatSessionModel.id == session_id)
+            .execution_options(populate_existing=True)
         )
--- a/backend/app/services/chat_service.py  (stream_chat)
-        yield f"event: done\ndata: {done_payload}\n\n"
-        # Auto-persist turn ...
-        try:
-            await self.session_service.persist_turn(...)
+        user_msg, assistant_msg = await self.session_service.persist_turn(...)  # done 전에 저장
+        done["user_message_id"], done["assistant_message_id"] = user_msg.id, assistant_msg.id
+        yield f"event: done\ndata: {json.dumps(done, ensure_ascii=False)}\n\n"
```
  `done` 에 메시지 id 를 싣는 것은 계약 변경이다. 프론트는 그 id 를 자기 메시지 id 로 쓰고(그러면 업서트가 건너뛴다), 또는 세션 POST 에서 `messages` 를 빼고 메타데이터만 보낸다. contract-integrator·frontend 작업과 함께 한다.

#### [머지 전 필수] BUG-03 딥 리서치가 예외 뒤 `is_running` 을 되돌리지 않는다
- **위치**: `backend/app/services/deep_researcher.py:385-489`(`try/finally` 없음), `backend/app/api/research.py:83-87`(`create_task` 결과를 보관하지 않음)
- **근거**: `:388` 에서 `True` 로 두고 `:486` 에서만 `False` 로 되돌린다. 사이의 `mine_reference_domains_from_articles`(`:403`), `probe_and_discover_feed`(`:423`), `add_rss_source`(`:442`, 파일 I/O), `session.commit()`(`:477`) 중 하나라도 예외가 나면 재시작 전까지 `run-deep`·스케줄(`scheduler.py:15-18`) 모두 `already_running` 이다. `asyncio.create_task` 참조를 버려 태스크 예외도 관찰되지 않는다.
- **개선 제안 (Diff)**:
```diff
         self.is_running = True
-        started_at = datetime.now(timezone.utc)
-        ...
-        self.is_running = False
-        logger.info(...)
-        return self.last_run_summary
+        try:
+            return await self._run_cycle(max_candidates)   # 기존 본문을 옮긴다
+        except Exception as e:
+            logger.exception("[Deep Researcher] cycle failed")
+            self.last_run_summary = {"status": "error", "error": type(e).__name__,
+                                     "completed_at": datetime.now(timezone.utc).isoformat()}
+            return self.last_run_summary
+        finally:
+            self.is_running = False
--- a/backend/app/api/research.py
+_background_tasks: set = set()
 ...
-    asyncio.create_task(deep_researcher.run_deep_research(max_candidates=max_candidates))
+    task = asyncio.create_task(deep_researcher.run_deep_research(max_candidates=max_candidates))
+    _background_tasks.add(task)
+    task.add_done_callback(_background_tasks.discard)
```

#### [머지 전 필수] BUG-04 딥 리서치가 발굴한 후보를 평가하지 않는다
- **위치**: `backend/app/services/deep_researcher.py:395-412`, 시드 `:21-` (`SEED_EXPLORATION_TARGETS`), 컷 기본값 `:376`(8), `backend/app/api/research.py:78`(6), `backend/app/scheduler.py:18`(기본값 8)
- **근거**: `SEED_EXPLORATION_TARGETS` 의 `"url"` 은 14개다 (파일을 파싱해 셈). 후보 목록은 시드 14개 → 발굴 URL 순서이고 `candidates_pool[:max_candidates]` 로 앞 6·8개만 평가하므로 발굴 후보는 한 번도 평가되지 않는다. 매 사이클이 같은 시드 6~8개를 다시 평가한다 (이미 등록된 소스를 건너뛰는 거름도 없다). 기능 설명("인용 도메인 마이닝", `research.py:81`)이 동작하지 않는다.
- **개선 제안 (Diff)**:
```diff
-        eval_queue = candidates_pool[:max_candidates]
+        monitored = {f.get("url", "").rstrip("/") for f in sources_service.get_all_sources().get("rss_feeds", [])}
+        mined = [c for c in candidates_pool[len(SEED_EXPLORATION_TARGETS):]]
+        seeds = [c for c in candidates_pool[:len(SEED_EXPLORATION_TARGETS)]]
+        # 발굴 후보를 먼저, 시드는 남는 칸에. 이미 모니터링 중인 주소는 뺀다
+        ordered = [c for c in mined + seeds if c["target_url"].rstrip("/") not in monitored]
+        eval_queue = ordered[:max_candidates]
--- a/backend/app/api/research.py
-async def trigger_deep_research(max_candidates: int = 6):
+async def trigger_deep_research(max_candidates: int = Query(6, ge=1, le=20)):
```

#### [머지 전 필수] BUG-05 GitHub 저장소(`owner/repo`) 토글·삭제가 라우팅되지 않는다
- **위치**: `backend/app/api/sources.py:77`, `:85`, 호출부 `frontend/src/lib/api.ts:369`, `:399`(`encodeURIComponent`)
- **근거**: 재현 R6. `PATCH /api/sources/github_repo/no-such-owner%2Fno-such-repo/toggle` → `404 {"detail":"Not Found"}`(라우트 불일치), 한 구간 id `no-such-repo` → `404 {"detail":"Source not found or invalid type"}`(라우트 일치). ASGI 서버가 `%2F` 를 `/` 로 풀어 `scope.path` 에 넣으므로 `{item_id}` 한 구간에 맞지 않는다. URL 을 id 로 쓰는 RSS 피드(`sources_service.py:175`, `:250` 의 `f.get("url") == item_id`)도 같다. 화면의 저장소 토글·삭제가 404 로 실패한다 (CT-001 과 같은 결함).
- **개선 제안 (Diff)**: 경로 변환기를 쓴다. 스크래치 FastAPI 앱으로 `jlowin%2Ffastmcp` → `item_id='jlowin/fastmcp'`, `https%3A%2F%2Fe.com%2Ffeed` → `'https://e.com/feed'` 가 잡히는 것을 확인했다 (R7).
```diff
-@router.patch("/{source_type}/{item_id}/toggle")
+@router.patch("/{source_type}/{item_id:path}/toggle")
 async def toggle_source(source_type: str, item_id: str):
 ...
-@router.delete("/{source_type}/{item_id}")
+@router.delete("/{source_type}/{item_id:path}")
 async def delete_source(source_type: str, item_id: str):
```

#### [머지 전 필수] BUG-06 `POST /api/chat/stream` 의 검증 실패가 500 이 된다 (계약은 400)
- **위치**: `backend/app/api/chat.py:406`(`ChatStreamRequest(**body)` 가 try 밖), `:291`, `:312`, `:323`(`body.get` 이 dict 가정)
- **근거**: 재현 R3·R4.
```
bad tier 500 {"detail":"Internal server error occurred. ...","error":"1 validation error for ChatStreamRequest\nmodel_tier\n  Input should be 'haiku', 'sonnet' or 'opus' ...
list body 500 {"detail":"Internal server error occurred. ...","error":"'list' object has no attribute 'get'"}
```
  계약 문서는 이것을 CT-015 로 적고 MSW 는 400 을 돌려준다. 프론트가 오류 형식 `error_code` 를 기대하는데 전역 처리기의 `detail` 형식이 온다. `/api/chat/query`(`:172-175` → `ERR_SERVER_INTERNAL` 500), `/api/chat/search`(`:89-95` 필터 리터럴 오류 → `ERR_RETRIEVER_INDEX_ERROR` 500)도 같다.
- **개선 제안 (Diff)**:
```diff
+from pydantic import ValidationError
 ...
     try:
         body = await request.json()
     except Exception:
         return error_response(400, "ERR_INVALID_PAYLOAD", "요청 본문 형식이 올바르지 않습니다.")
+    if not isinstance(body, dict):
+        return error_response(400, "ERR_INVALID_PAYLOAD", "요청 본문은 JSON 객체여야 합니다.")
+    try:
+        req = ChatStreamRequest(**body)
+    except ValidationError as e:
+        field = e.errors()[0]["loc"][0] if e.errors() else None
+        code = "ERR_INVALID_MODEL_TIER" if field == "model_tier" else "ERR_INVALID_PAYLOAD"
+        return error_response(400, code, "요청 필드가 올바르지 않습니다.")
 ...
-    service = ChatService(db)
-    req = ChatStreamRequest(**body)
+    service = ChatService(db)
```
  `ERR_INVALID_MODEL_TIER` 는 zod `LlmErrorCodeSchema` 에 이미 있고(CT-007), `ERR_INVALID_PAYLOAD` 는 zod 에 없으므로 zod 쪽에 추가한다 (contract-integrator).

#### [머지 전 필수] BUG-07 기사 Ask AI 스트림이 도중 실패하면 부분 답 뒤에 다른 엔진의 답을 이어 붙이고 캐시한다
- **위치**: `backend/app/services/llm_processor.py:900-916`(Anthropic 예외를 잡고 계속), `:921-946`(OpenAI 가 같은 `full_text` 에 이어 쓴다), `:949-968`(폴백 답을 이어 보낸다), `:970-971`(섞인 답을 `_qa_cache` 에 저장)
- **근거**: Anthropic 이 토큰 일부를 보낸 뒤 예외가 나면 `stream_succeeded` 가 `False` 로 남아 OpenAI 또는 규칙 기반 답이 새 `meta` 와 함께 이어서 스트리밍된다. 클라이언트는 이미 받은 부분 답 뒤에 두 번째 답을 붙여 그린다. 캐시 키(`:864`)로 같은 질문은 이후에도 섞인 답을 돌려준다. 챗 스트림은 같은 상황에서 `LLMStreamFailedException` 으로 끊는다(`:439-441`)라 두 경로의 정책이 다르다.
- **개선 제안 (Diff)**:
```diff
             try:
                 first_chunk = True
                 async for chunk, m_name in self.anthropic_provider.stream_chat(prompt=prompt):
 ...
                 if full_text.strip():
                     stream_succeeded = True
             except Exception as e:
                 logger.warning(f"Anthropic streaming failed in stream_question_answer: {e}")
+                if full_text:
+                    # 이미 토큰을 보냈으면 다른 엔진으로 이어 쓰지 않고 오류로 끝낸다. 캐시하지 않는다
+                    yield {"event": "error", "message": "답변 생성 중 오류가 발생했습니다.", "retryable": True}
+                    return
```
  OpenAI 경로(`:938-946`)에도 같은 처리를 둔다. 프론트 `askQuestionAboutNewsStream` 이 `error` 이벤트를 처리하는지 frontend 쪽 확인이 필요하다 (contract-integrator).

#### [머지 전 필수] BUG-08 Anthropic 스트림의 `error` 이벤트와 `stop_reason` 을 보지 않아 잘린 답이 완료로 끝난다
- **위치**: `backend/app/services/llm_providers/anthropic_provider.py:287-319`
- **근거**: 처리하는 이벤트 종류는 `message_start`·`content_block_delta`·`message_delta`(usage 만) 셋이다. 스트림 중간의 `error` 이벤트(예: 과부하)는 무시되고 루프가 끝나 정상 종료처럼 `last_usage` 를 쓰고 끝난다. `message_delta.delta.stop_reason` 이 `max_tokens` 여도 구분하지 않는다. 그 결과 `chat_service.stream_chat` 은 잘린 답에 `done` 을 보내고(`:804`) `persist_turn` 으로 `completed` 상태로 저장한다(`:808-820`).
- **개선 제안 (Diff)**:
```diff
+        stop_reason = None
 ...
                         elif event_type == "message_delta":
                             u = event_data.get("usage", {})
                             if "output_tokens" in u:
                                 accumulated_usage["output_tokens"] = u["output_tokens"]
+                            stop_reason = event_data.get("delta", {}).get("stop_reason") or stop_reason
+                        elif event_type == "error":
+                            err = event_data.get("error", {})
+                            if err.get("type") == "overloaded_error":
+                                raise AnthropicOverloadedException(err.get("message", "overloaded"))
+                            raise LLMStreamFailedException(err.get("message", "Anthropic stream error"))
                     except json.JSONDecodeError:
                         continue
 
         self.last_usage = self._extract_usage(accumulated_usage)
+        self.last_stop_reason = stop_reason
```
  `chat_service` 는 `stop_reason == "max_tokens"` 이면 `done` payload 에 `truncated: true` 를 싣고 메시지 `status` 를 그에 맞게 저장한다 (계약 변경, contract-integrator). 프론트가 `done` 없이 끊긴 스트림을 완료로 그리는 문제는 frontend-code-reviewer 범위다.

#### [권장] BUG-09 토큰 사용량을 프로세스 전역 하나로 공유한다
- **위치**: `backend/app/services/llm_processor.py:122-127`, `:371`, `:433`; 읽는 곳 `backend/app/services/chat_service.py:558`, `:791`
- **근거**: 동시에 두 요청이 돌면 `done.usage`·`/query` 응답의 `usage` 가 다른 요청 값일 수 있다. OpenAI·Ollama 경로는 갱신하지 않아 이전 요청 값이 남는다. ReAct planner 호출(`chat_service.py:395`)도 `generate_live_answer` 로 같은 값을 덮는다.
- **개선 제안 (Diff)**: 사용량을 반환값으로 흘린다.
```diff
-    async def stream_tokens(self, prompt, model=None, model_tier=None) -> AsyncGenerator[Tuple[str, str], None]:
+    async def stream_tokens(self, prompt, model=None, model_tier=None, usage_out: Optional[dict] = None):
 ...
-                if token_yielded:
-                    self.last_usage = self.anthropic_provider.last_usage
+                if token_yielded:
+                    if usage_out is not None:
+                        usage_out.update(self.anthropic_provider.last_usage)
```
  provider 쪽 `last_usage` 도 인스턴스 속성 대신 스트림 지역 변수로 바꾼다.

#### [권장] BUG-10 평가 캐시가 일시적 폴백 거부까지 영구히 기억한다
- **위치**: `backend/app/services/llm_processor.py:595-597`, `:614`, `:676`, `:708`, 초기화 `backend/app/api/schedule.py:84-89`(캐시를 비우지 않음)
- **근거**: 캐시 키는 `제목::소스`, 만료와 크기 제한이 없다. LLM 이 잠깐 안 될 때의 규칙 기반 거부(`:685-695`)도 저장돼, 재시작 전까지 같은 제목은 LLM 평가를 다시 받지 않는다. `reset-and-collect` 뒤에도 남는다.
- **개선 제안 (Diff)**:
```diff
-        self._eval_cache[cache_key] = result
+        if result["evaluated_by"] not in ("heuristic_fallback",):
+            self._eval_cache[cache_key] = result   # 폴백 결과는 캐시하지 않는다
```
  캐시는 `cachetools.TTLCache(maxsize=5000, ttl=86400)` 같은 한도 있는 자료구조로 바꾸고(PERF-05), `reset-and-collect` 에서 `llm_processor._eval_cache.clear()` 를 부른다.

#### [권장] BUG-11 크롤 로그가 항상 `success` 이고 소스별 실패를 남기지 않는다
- **위치**: `backend/app/collectors/manager.py:224-234`(`status="success"` 고정, `error_message` 미기록), `:171-174`(배치 예외 → 0 반환), `:210-213`(소스 예외는 `source_results` 에만)
- **근거**: `crawl_logs.status` 의 실패 값과 `error_message` 를 쓰는 코드가 없다 (설계서 13.6). `/api/schedule/status` 의 `recent_logs` 로는 소스 실패를 볼 수 없다.
- **개선 제안 (Diff)**:
```diff
+            failed = {n: r["error"] for n, r in source_results.items() if r.get("error")}
                 log = CrawlLog(
                     source="all_sources_stream_ingestion",
                     items_crawled=self.items_collected,
                     items_saved=self.items_saved,
-                    status="success",
+                    status="partial_failure" if failed else "success",
+                    error_message=json.dumps(failed, ensure_ascii=False) if failed else None,
```
  `_process_and_save_batch` 의 배치 롤백도 `source_results[name]["error"]` 에 남긴다.

#### [권장] BUG-12 RSS 피드가 NULL 열에서 500, 채널 링크가 3000 포트 고정
- **위치**: `backend/app/api/news.py:182`(`saxutils.escape(it.summary)`), `:184`(`it.published_at.strftime`), `:183`(`category` 미이스케이프), `:192`(`http://localhost:3000`)
- **근거**: 재현 R8 — `UPDATE news_items SET summary = NULL` 뒤 `GET /api/news/feed/rss.xml` → `500 {"error":"'NoneType' object has no attribute 'replace'"}`. 지금 수집기는 `summary` 를 `""` 로 넣으므로(`manager.py:83`) 새 데이터로는 드물고, 옛 데이터·수동 삽입에서 난다. 프론트 기본 포트는 3000 이 아닌 경우가 있다 (옛 문서 기록: 3001).
- **개선 제안 (Diff)**:
```diff
-            <description>{saxutils.escape(it.summary)}</description>
-            <category>{it.category}</category>
-            <pubDate>{it.published_at.strftime("%a, %d %b %Y %H:%M:%S GMT")}</pubDate>
+            <description>{saxutils.escape(it.summary or "")}</description>
+            <category>{saxutils.escape(it.category or "")}</category>
+            <pubDate>{(it.published_at or it.created_at).strftime("%a, %d %b %Y %H:%M:%S GMT")}</pubDate>
 ...
-        <link>http://localhost:3000</link>
+        <link>{saxutils.escape(settings.PUBLIC_WEB_URL)}</link>
```

#### [권장] BUG-13 챗 스트림 앞 단계 예외가 `error` 이벤트 없이 스트림을 끊는다
- **위치**: `backend/app/services/chat_service.py:685-707`(`_plan_react_action`, `_resolve_sources` 가 try 밖), `:626`(scoped 스크래핑은 잡는다), try 시작 `:746`
- **근거**: 응답 헤더를 보낸 뒤 생성기에서 예외가 나면 클라이언트는 `error` 이벤트 없이 연결 끊김을 받는다. 계약(`StreamErrorPayload`)은 단계별 `step` 을 가진 `error` 이벤트를 정의한다.
- **개선 제안 (Diff)**:
```diff
-            plan = await self._plan_react_action(
-                req.question, req.scope, req.history, req.model, req.model_tier
-            )
+            try:
+                plan = await self._plan_react_action(
+                    req.question, req.scope, req.history, req.model, req.model_tier
+                )
+            except Exception:
+                logger.exception("ReAct planner failed")
+                yield self._sse_error("ERR_LLM_UPSTREAM_FAILED", "질문 분석 중 오류가 발생했습니다.", step="thinking")
+                return
```
  `_resolve_sources` 도 `step="tool_calling"`, `ERR_RETRIEVER_INDEX_ERROR` 로 같은 처리를 한다.

#### [권장] BUG-14 `model_tier` 만 보낸 요청의 티어가 무시된다
- **위치**: `backend/app/schemas/chat.py:30`, `:41`(`model` 에 `default_factory=get_default_chat_model`), `backend/app/services/llm_processor.py:369`, `:428`(`model or model_tier`), `backend/app/services/chat_service.py:557`, `:790`
- **근거**: `model` 이 항상 기본 모델(`claude-sonnet-5-5`)로 채워지므로 `model or model_tier` 는 언제나 `model` 이다. `{"model_tier": "opus"}` 만 보내면 Sonnet 으로 간다. 지금 화면은 `model` 과 `model_tier` 를 함께 보내므로(`frontend/src/components/chat/ChatWorkspace.tsx:320-321`) 화면 영향은 없고, API 를 직접 쓰는 호출자에게만 드러난다.
- **개선 제안 (Diff)**:
```diff
-    model: Optional[str] = Field(default_factory=get_default_chat_model)
+    model: Optional[str] = None
 ...
-                    model=model or model_tier,
+                    model=model_tier if (model_tier and not model) else (model or get_default_chat_model()),
```
  우선순위(명시 `model` > `model_tier` > 기본값)를 한 함수로 모은다. 기본값 변경은 계약(CT-017)에 적는다.

#### [권장] BUG-15 브리핑 문장을 글자 수로 잘라 단어 중간에서 끊는다
- **위치**: `backend/app/services/briefing_service.py:86`(제목 45자), `:88`(요약 90자), `:101-102`(헤드라인 40자)
- **근거**: 잘린 문자열에 `...` 를 붙인다 (예: `…persistent p...`). 요약 바, 브리핑 대화상자 설명·분야 요약·마크다운 전문, Notion·이메일 본문에 그대로 나온다. 프론트는 받은 글자를 자르지 않는다.
- **개선 제안 (Diff)**:
```diff
+def _clip(text: str, limit: int) -> str:
+    if len(text) <= limit:
+        return text
+    cut = text[:limit].rsplit(" ", 1)[0]
+    return (cut if len(cut) >= limit * 0.6 else text[:limit]).rstrip() + "…"
 ...
-            return f"'{top.title[:45]}...' 등이 주목받으며, {top.why_it_matters}"
+            return f"'{_clip(top.title, 45)}' 등이 주목받으며, {top.why_it_matters}"
```

#### [권장] BUG-16 backend 문자열의 분야 이름·이모지가 프론트 라벨과 다르다
- **위치**: `backend/app/services/briefing_service.py:16-38`(`CATEGORY_DEFS` 이름·`icon` 이모지), `backend/app/services/notion_service.py:79`·`backend/app/services/email_service.py:120`(`📌`), 챗 진행 라벨 `backend/app/services/chat_service.py:614`, `:635`, `:678`, `:693`, `:715`, `:734`
- **근거**: 프론트 긴 라벨(`frontend/src/lib/labels.ts`)과 다르고, 대화상자의 카테고리 탭은 바꿔 그리지만 마크다운 전문·Notion·이메일에는 backend 이름과 이모지가 남는다. 챗 진행 표시(`WorkflowStepTracker`)에는 라벨 이모지가 그대로 보인다 (UI 원칙은 lucide 아이콘).
- **개선 제안 (Diff)**:
```diff
-        "name": "하네스 & 벤치마크",
-        "icon": "🎯",
+        "name": "<labels.ts 의 harness 긴 라벨과 같은 문구>",
+        "icon": "harness",            # 아이콘 키. 그리기는 프론트(lucide)가 한다
 ...
-                "label": "📄 지정된 단일 뉴스 기사 컨텍스트 로드 중...",
+                "label": "지정된 기사 내용을 불러오는 중",
```

#### [권장] BUG-17 LLM 시사점이 없으면 카테고리 고정 문장을 저장한다
- **위치**: `backend/app/services/llm_processor.py:84-89`(`CATEGORY_INSIGHTS`), `:741-748`(기술 이름이 있으면 `{기술} 기반 구현에서 ` 를 앞에 붙임)
- **근거**: 같은 문장이 여러 기사의 `why_it_matters` 로 저장돼 카드·상세·챗 출처·브리핑에 반복된다. 피드 카드만 프론트에서 완화한다.
- **개선 제안 (Diff)**:
```diff
-        else:
-            why_it_matters = base_insight
+        else:
+            why_it_matters = ""   # 근거 없는 고정 문장은 저장하지 않는다. 화면은 빈 값이면 요약을 보인다
```
  `elif tech_entities:` 분기도 같은 이유로 빈 값으로 둔다. 브리핑(`briefing_service.py:85-86`)은 이미 `why_it_matters` 가 비면 요약으로 넘어간다.

#### [권장] BUG-18 `raw_score` 에 원천 지표가 아닌 값이 들어가고 인기 점수가 포화한다
- **위치**: `backend/app/collectors/sources/rss.py:75`(KR 180·그 밖 150 고정), `backend/app/collectors/sources/arxiv.py:48`(120 고정), `backend/app/collectors/sources/huggingface.py:33`(`numComments + 40`), `backend/app/collectors/sources/github.py:61-70`(폴백 `stars_hint` 기본 5000, 포크 `int(stars × 0.12)`), `backend/app/collectors/categorizer.py:147`(`min(100, hotness × 8)`)
- **근거**: 옛 `docs/known-issues.md` 의 측정(2026-11-07 DB 4734건 중 1034건이 100, `rss_kr` 459건 중 373건이 100)을 옮긴다. 이번 감사에서 다시 재지 않았다. `추천순`(`raw_score`)·`인기순`(`hotness_score`) 정렬이 합성 값에 좌우된다. 카드는 지표 소스(`github`·`hackernews`·`reddit`)만 점수를 그려 숨기지만 폴백 `stars_hint`·합성 포크는 실제 값과 구별되지 않는다. 첫 화면 카드 상대 시간이 모두 같은 값으로 보이는 현상은 원인을 확인하지 못했다 (옛 문서 '의심').
- **개선 제안 (Diff)**:
```diff
-                        "raw_score": 180 if feed_info.get("country") == "KR" else 150,
+                        "raw_score": None,          # 원천 지표가 없으면 비운다
--- a/backend/app/collectors/categorizer.py
-    return min(100, hotness * 8)
+    return round(100 * (1 - math.exp(-hotness / 12)), 1)   # 포화 대신 완만한 상한 (계수는 실데이터로 정한다)
```
  `raw_score` 를 NULL 허용으로 바꾸면 `news_items.raw_score`·`NewsItemResponse`·zod 를 함께 고친다.

#### [권장] BUG-19 `DELETE /api/news/all` 은 수집 중에도 지운다
- **위치**: `backend/app/api/news.py:96-102` (비교: `backend/app/api/schedule.py:72-77` 은 `is_running` 이면 거부)
- **개선 제안 (Diff)**:
```diff
 async def delete_all_news(db: AsyncSession = Depends(get_db)):
+    if collector_manager.is_running:
+        raise HTTPException(status_code=409, detail="수집이 진행 중이라 삭제할 수 없습니다.")
     res = await db.execute(delete(NewsItem))
-    await db.commit()
```
  (`get_db` 가 커밋하므로 라우터 커밋은 뺀다, ARCH-03.)

#### [권장] BUG-20 소스 저장 실패를 무시하고 성공을 돌려준다, RSS id 가 겹친다
- **위치**: `backend/app/services/sources_service.py:192`, `:203`, `:219`, `:230`, `:242`, `:261`(반환값 무시), `backend/app/api/sources.py:54-91`, `backend/app/services/deep_researcher.py:442`; id 생성 `:206`, 삭제 `:250`
- **근거**: `save_sources` 는 실패 시 `False` 를 돌려주지만 아무도 보지 않는다. RSS `id` 는 이름에서 영숫자 외를 `_` 로 바꿔 만들어(`:206`) 한글 이름 둘이 같은 id(예: `____`)가 될 수 있고, 삭제는 같은 id 를 모두 지운다(`:250`). URL·저장소 형식, `category_hint`·`country` 값 검증이 없다 (`sources.py:8-20`).
- **개선 제안 (Diff)**:
```diff
-        self.save_sources(sources)
-        return new_feed
+        if not self.save_sources(sources):
+            raise SourcesWriteError(str(self.get_file_path().name))
+        return new_feed
 ...
-        item_id = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower()) if name else f"feed_{int(datetime.now().timestamp())}"
+        item_id = f"rss_{hashlib.sha1(url.rstrip('/').encode()).hexdigest()[:10]}"
--- a/backend/app/api/sources.py
-    category_hint: Optional[str] = Field("ai_news", ...)
-    country: Optional[str] = Field("GLOBAL", ...)
+    category_hint: Literal["harness", "mcp_plugins_skills", "agent_tech", "ai_news"] = "ai_news"
+    country: Literal["KR", "GLOBAL"] = "GLOBAL"
+    url: HttpUrl
```
  라우터는 `SourcesWriteError` 를 500 으로 바꾼다. id 규칙 변경은 기존 `sources.json` 항목과 호환을 정해야 한다.

#### [권장] BUG-21 설정 저장이 메모리 상태를 먼저 바꾸고 파일을 제자리로 쓴다
- **위치**: `backend/app/api/briefing.py:163`(`dict(...)` 얕은 복사 → 중첩 dict 가 `_json_data` 와 같은 객체), `backend/app/config.py:166-168`(임시 파일 교체 없음)
- **근거**: `raw["briefing"]["notion"]["api_key"] = ...` 가 `_json_data` 를 바로 바꾼다. 저장이 실패해도 GET 설정은 새 값을 보인다. 쓰기 도중 실패하면 깨진 `config.json` 이 남고 다음 시작 때 `load_json_config` 가 `{}` 를 돌려 모든 설정이 기본값이 된다 (`config.py:33-35`).
- **개선 제안 (Diff)**:
```diff
-    raw = dict(settings.raw_json_config)
+    raw = copy.deepcopy(settings.raw_json_config)
--- a/backend/app/config.py
-        with open(p, "w", encoding="utf-8") as f:
-            json.dump(data, f, indent=2, ensure_ascii=False)
+        tmp = p.with_suffix(".tmp")
+        tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
+        try:
+            tmp.replace(p)
+        except OSError:   # Docker 단일 파일 bind mount (sources_service 와 같은 대체)
+            p.write_text(tmp.read_text(encoding="utf-8"), encoding="utf-8")
+            tmp.unlink(missing_ok=True)
```

### 2.3 설정과 코드 불일치 (Pillar 1·2)

#### [권장] CFG-01 스케줄 시각이 코드에 고정돼 있다
- **위치**: `backend/app/scheduler.py:39`(`hour="0,6,12,18"`), `:47`(`"3,15"`), `:55`(`hour="0", minute="15"`), 모두 `timezone="UTC"`. 설정 값은 `:9`(`SCHEDULED_HOURS`)와 `backend/app/api/schedule.py:33-34`(표시)에만 쓰인다.
- **근거**: `scheduler.crawl_hours`·`timezone`·`briefing.auto_dispatch_hour`·`auto_briefing_hour` 를 바꿔도 실행 시각은 그대로이고, `/api/schedule/status` 의 `schedule_hours`·`timezone` 만 바뀌어 화면과 실제가 어긋난다.
- **개선 제안 (Diff)**:
```diff
-        trigger = CronTrigger(hour="0,6,12,18", minute="0", timezone="UTC")
+        trigger = CronTrigger(hour=settings.CRAWL_SCHEDULE_HOURS, minute="0", timezone=settings.CRAWL_TIMEZONE)
 ...
-        briefing_trigger = CronTrigger(hour="0", minute="15", timezone="UTC")
+        briefing_trigger = CronTrigger(hour=str(settings.BRIEFING_AUTO_DISPATCH_HOUR), minute="15",
+                                       timezone=settings.CRAWL_TIMEZONE)
```

#### [권장] CFG-02 읽는 코드가 없는 설정
- **위치**: `backend/app/config.py:45`(`CORS_ORIGINS`), `:49`(`LLM_PROVIDER`), `:52`(`ANTHROPIC_COLLECTION_MODEL`), `:68-70`(`CHAT_SESSION_MAX_LIMIT`·`CHAT_HISTORY_MAX_TURNS`·`CHAT_HISTORY_MAX_TOKENS`), `:71`(`SCRAPER_TIMEOUT_SECONDS`), `:46`(`USER_AGENT`, `crawler.*`), `config.json` 의 `scheduler.enabled`, `webhooks.auto_alert_high_signal`·`auto_dispatch_daily_briefing`(GET 응답에만 나온다 `backend/app/api/briefing.py:156-157`; 발송은 URL 만 보고 한다 `backend/app/services/briefing_service.py:252-255`), 요청 필드 `category_hint`(수집 평가에 넘기지만 `evaluate_content_with_llm` 이 쓰지 않는다)
- **근거**: 옛 `docs/known-issues.md` 의 `CHAT_*` 5개는 지금 `config.py` 에 `CHAT_SESSION_MAX_LIMIT`·`CHAT_HISTORY_MAX_TURNS`·`CHAT_HISTORY_MAX_TOKENS` 3개와 `SCRAPER_TIMEOUT_SECONDS`·`AGENTIC_SEARCH_MAX_QUERIES` 로 있다. 세션 한도는 코드에 30 이 고정이다 (`backend/app/services/chat_session_service.py:277`, `:368`, `:437`). 스크래퍼 타임아웃은 5.0 고정(`backend/app/services/scraper.py:74`).
- **개선 제안 (Diff)**:
```diff
-        await self.enforce_fifo_retention(max_limit=30)
+        await self.enforce_fifo_retention(max_limit=settings.CHAT_SESSION_MAX_LIMIT)
 ...
-            async with httpx.AsyncClient(timeout=5.0, follow_redirects=True, headers=headers) as client:
+            async with httpx.AsyncClient(timeout=settings.SCRAPER_TIMEOUT_SECONDS, follow_redirects=True, headers=headers) as client:
--- a/backend/app/services/briefing_service.py
-            if settings.SLACK_WEBHOOK_URL:
+            auto = settings.get_custom_json_value("webhooks", "auto_dispatch_daily_briefing", True)
+            if auto and settings.SLACK_WEBHOOK_URL:
```
  쓰지 않을 설정(`LLM_PROVIDER`, `ANTHROPIC_COLLECTION_MODEL`, `scheduler.enabled` 등)은 `config.py`·`config.json`·`.env.example` 에서 지운다.

#### [권장] CFG-03 하이시그널 임계값 기본값이 7.8 과 7.0 으로 다르다
- **위치**: `backend/app/config.py:65`(7.8), 루트 `config.json`(`llm.high_signal_threshold` 7.0), `backend/app/services/llm_processor.py:568`, `:661`(`getattr(..., 7.0)`)
- **근거**: `config.json` 이 있으면 7.0, 없으면 7.8 이 된다. `getattr` 폴백 7.0 은 `settings` 에 항상 필드가 있어 쓰이지 않는 값이다.
- **개선 제안 (Diff)**:
```diff
-    HIGH_SIGNAL_THRESHOLD: float = float(_json_data.get("llm", {}).get("high_signal_threshold", 7.8))
+    HIGH_SIGNAL_THRESHOLD: float = float(_json_data.get("llm", {}).get("high_signal_threshold", 7.0))
--- a/backend/app/services/llm_processor.py
-        high_thresh = getattr(settings, "HIGH_SIGNAL_THRESHOLD", 7.0)
+        high_thresh = settings.HIGH_SIGNAL_THRESHOLD
```

#### [권장] CFG-04 "LLM 평가"·"요약" 이라 부르는 경로가 규칙 기반이다
- **위치**: 딥 리서치 `backend/app/api/research.py:81`("LLM 4축 평가") ↔ `backend/app/services/deep_researcher.py:335`(`evaluate_quality_and_signal`, 키워드 점수 `backend/app/services/llm_processor.py:516-575`); 3줄 요약 `backend/app/services/llm_processor.py:711-752`(`generate_synthesis`, 규칙 기반 문장 조립)
- **근거**: 이름·문서 문자열·화면 문구가 실제 방식과 다르다. 사용자에게 보이는 문구는 frontend 범위다 (Ask AI 의 "Gemini" 표기, 챗 Notion 동기화 모의 동작은 frontend-code-reviewer 로 넘김, 7절).
- **개선 제안 (Diff)**:
```diff
-    인용 도메인 마이닝, 피드 실증, LLM 4축 평가를 거쳐 고신호 소스를 sources.json에 자동 채택합니다.
+    인용 도메인 마이닝, 피드 실증, 키워드 규칙 점수로 고신호 소스를 sources.json 에 자동 채택합니다.
```

### 2.4 Pillar 1 — 아키텍처

#### [권장] ARCH-01 라우터가 모델을 직접 다루고 수집기 내부 상태를 고친다
- **위치**: `backend/app/api/news.py:58-102`, `:106`, `:117`, `:143`, `:171-174`, `backend/app/api/stats.py:13-15`, `backend/app/api/schedule.py:20`, `:80-82`, `:85-89`(`collector_manager.items_* = 0` 직접 대입), `backend/app/api/chat.py:335-336`
- **근거**: 설계서 1.3 의 목표 규약(Router → Service → Model)과 다르다. `format_news_item`(`news.py:17-45`)과 `ChatService.get_source_detail`(`chat_service.py:86-125`), `chat_session_service.py:160-187` 이 같은 변환(태그 split, `tldr_bullets` JSON)을 세 번 한다.
- **개선 제안 (Diff)**:
```diff
+# app/services/news_service.py
+class NewsService:
+    def __init__(self, session: AsyncSession): self.session = session
+    async def list_feed(self, filters: NewsFeedQuery) -> NewsListResponse: ...
+    async def delete_all(self) -> int: ...
--- a/backend/app/api/schedule.py
-    collector_manager.items_collected = 0
-    collector_manager.items_saved = 0
-    collector_manager.items_filtered = 0
-    collector_manager.current_source = ""
-    collector_manager.step_message = "🧹 기존 데이터 삭제 완료. 실시간 재수집을 시작합니다."
+    collector_manager.reset_progress("기존 데이터 삭제 완료. 재수집을 시작합니다.")
```

#### [권장] ARCH-02 services 와 collectors 가 서로를 import 한다
- **위치**: `backend/app/collectors/manager.py:12` → `services.llm_processor`, `backend/app/collectors/sources/*` → `services.sources_service`, 반대로 `backend/app/services/llm_processor.py:10`·`deep_researcher.py`·`source_researcher.py` → `collectors.categorizer`
- **개선 제안 (Diff)**: 순수 함수인 분류기를 공용 모듈로 내린다.
```diff
-from app.collectors.categorizer import classify_and_tag, is_strictly_ai_related
+from app.domain.classification import classify_and_tag, is_strictly_ai_related
```

#### [권장] ARCH-03 요청 하나가 여러 트랜잭션으로 흩어진다
- **위치**: `backend/app/services/chat_session_service.py:253`, `:366`, `:458`(업서트 = 세 커밋), `backend/app/api/news.py:100`, `backend/app/api/schedule.py:82`(라우터 커밋 후 `get_db` 가 다시 커밋, `backend/app/database.py:31-40`), `backend/app/services/scraper.py:157-167`(스트림 도중 요청 세션 커밋), `backend/app/services/retriever.py:62-120`(GET 이 FTS 생성·rebuild 커밋, 실패하면 요청 세션 롤백 `:120`)
- **근거**: BUG-02 재현에서 메시지 INSERT 가 실패했는데 세션 제목은 바뀌어 남았다. 트랜잭션 경계가 서비스 메서드가 아니라 메서드 안 여러 곳이다.
- **개선 제안 (Diff)**:
```diff
-        await self.session.commit()
-
-        if req.messages:
+        if req.messages:
             ...
-            await self.append_messages_batch(...)
+            await self.append_messages_batch(..., commit=False)
+        await self.enforce_fifo_retention(max_limit=settings.CHAT_SESSION_MAX_LIMIT, commit=False)
+        await self.session.commit()   # 업서트 전체를 한 트랜잭션으로
```

#### [권장] ARCH-04 별도 프로세스가 중복 실행 방지·스키마 생성을 우회하고, DB 경로가 cwd 상대다
- **위치**: `backend/app/mcp/server.py:44-46`(자기 프로세스의 `collector_manager.collect_all()`), `:4`(스키마 생성 호출 없음), `backend/app/collectors/manager.py:176-180`(메모리 플래그), `scripts/collect.py:137-139`(직접 모드는 `ensure_db_schema` 를 부르지만 플래그는 따로), `backend/app/config.py:42`(`sqlite+aiosqlite:///./agentlens.db`)
- **근거**: backend·MCP·직접 수집이 같은 DB 에 동시에 수집하면 같은 `dedup_hash` INSERT 가 UNIQUE 위반으로 배치 전체를 롤백(0건)할 수 있다 (`manager.py:171-174`, 코드상 판단). 실행 위치에 따라 루트와 `backend/` 에 `agentlens.db` 가 따로 생긴다. MCP 를 빈 DB 에 붙이면 테이블이 없다.
- **개선 제안 (Diff)**:
```diff
--- a/backend/app/config.py
-    DATABASE_URL: str = _json_data.get("app", {}).get("database_url", "sqlite+aiosqlite:///./agentlens.db")
+    DATABASE_URL: str = _json_data.get("app", {}).get(
+        "database_url", f"sqlite+aiosqlite:///{Path(__file__).resolve().parent.parent / 'agentlens.db'}")
--- a/backend/app/mcp/server.py
 async def trigger_agentlens_crawl() -> str:
-    res = await collector_manager.collect_all()
+    # backend 가 떠 있으면 그 backend 에 위임한다 (scripts/collect.py 의 run_api 와 같은 방식)
+    res = await _trigger_via_backend_or_local()
```
  프로세스 사이 잠금은 DB 의 `crawl_locks` 행(만료 시각 포함)이나 파일 잠금으로 둔다.

#### [권장] ARCH-05 운영 코드가 테스트 환경을 감지하거나 테스트 대역 시그니처에 맞춰 분기한다
- **위치**: `backend/app/services/llm_processor.py:288-299`(`"pytest" in sys.modules`, `CI`, `TESTING`), `backend/app/services/chat_service.py:381`(테스트에서는 LLM planner 를 건너뜀), `:549-550`, `:751-752`(`except TypeError:` 로 인자 없이 다시 호출)
- **근거**: 테스트가 돌리는 경로와 운영 경로가 다르다. 라이브 planner(`:381-` JSON 파싱)는 테스트에서 실행되지 않는다(TEST-06). `CI=true` 가 설정된 컨테이너에서는 운영에서도 planner 가 꺼진다. `except TypeError` 는 `stream_tokens` 안의 진짜 `TypeError` 도 삼키고 모델 선택을 버린 채 다시 호출한다.
- **개선 제안 (Diff)**:
```diff
-        if not llm_processor.is_test_environment() and llm_processor.has_live_provider():
+        if settings.REACT_LLM_PLANNER_ENABLED and llm_processor.has_live_provider():
 ...
-        try:
-            answer, model_name = await llm_processor.generate_live_answer(
-                prompt, model=req.model, model_tier=req.model_tier
-            )
-        except TypeError:
-            answer, model_name = await llm_processor.generate_live_answer(prompt)
+        answer, model_name = await llm_processor.generate_live_answer(
+            prompt, model=req.model, model_tier=req.model_tier
+        )
```
  테스트 대역(`backend/tests/llm_fakes.py`)이 같은 시그니처를 받게 맞춘다. 테스트에서 planner 를 끄려면 fixture 가 설정을 `False` 로 둔다.

### 2.5 Pillar 2 — 클린코드

#### [권장] CC-01 오류 응답 블록이 약 30번 반복된다
- **위치**: `backend/app/api/chat.py:56-63`, `:79-122`, `:130-274`, `:282-403`, `:434-560`
- **근거**: 같은 `JSONResponse(status_code=..., content={"error_code", "message", "details"})` 와 같은 예외→상태 매핑(`:212-265` 와 `:350-403`)이 두 번 있다.
- **개선 제안 (Diff)**:
```diff
+def error_response(status: int, code: str, message: str, details: dict | None = None) -> JSONResponse:
+    return JSONResponse(status_code=status, content={"error_code": code, "message": message, "details": details})
+
+LLM_ERROR_MAP = {
+    AnthropicKeyMissingException: (401, "ERR_CLAUDE_API_KEY_MISSING"),
+    AnthropicQuotaExceededException: (429, "ERR_CLAUDE_QUOTA_EXCEEDED"),
+    AnthropicOverloadedException: (529, "ERR_CLAUDE_OVERLOADED"),
+    LLMProviderUnavailableException: (503, "ERR_LLM_PROVIDER_UNAVAILABLE"),
+    LLMUpstreamException: (502, "ERR_LLM_UPSTREAM_FAILED"),
+    LLMQuotaExceededException: (429, "ERR_LLM_QUOTA_EXCEEDED"),
+}
```
  라우터마다 다른 오류 형식 4가지(`detail`, 422, `error_code`, 전역 500)를 하나로 모으는 것은 계약 변경이다 (CT-014, contract-integrator).

#### [권장] CC-02 쓰이지 않는 코드와 화면이 부르지 않는 엔드포인트
- **위치**: `AgenticSearchService` (`backend/app/services/chat_service.py:36`, `:83` 에서 만들기만 함, 다른 사용처 없음 — `grep` 결과), `generate_structured_summary` (`backend/app/services/llm_providers/anthropic_provider.py:321`, 호출처 없음), `append_message_and_update_session` (`backend/app/services/chat_session_service.py:407`). 화면이 부르지 않는 API: `/api/chat/query`, `/api/chat/search`, `/api/research/discover`, `/api/research/register-candidate`, `POST /api/sources/github`, `/api/mcp/info`, `/api/webhook/send-briefing`, `/api/briefing/generate`, `GET /api/news/{id}`, `POST /api/news/{id}/ask`, `DELETE /api/news/all` (옛 `docs/known-issues.md` '쓰이지 않는 코드', 이번에 frontend 호출부를 다시 세지 않았다)
- **근거**: 유지 비용과 노출 엔드포인트 수를 늘린다. 클래스 docstring(`chat_service.py:73`)은 쓰이지 않는 `AgenticSearchService` 를 핵심 기능으로 적는다.
- **개선 제안 (Diff)**:
```diff
-from app.services.agentic_search import AgenticSearchService
 ...
-        self.agentic_search = AgenticSearchService()
```
  엔드포인트는 MCP·외부 사용 계획이 없으면 지운다.

#### [권장] CC-03 FTS 생성 SQL 이 두 곳에 있다
- **위치**: `backend/app/database.py:73-112`, `backend/app/services/retriever.py:62-120`
- **개선 제안 (Diff)**:
```diff
-    async def _ensure_fts_table(self):
-        ... (CREATE VIRTUAL TABLE / TRIGGER 3개 / rebuild)
+    async def _ensure_fts_table(self):
+        return  # 스키마는 ensure_db_schema 가 시작 때 만든다. MCP·직접 수집도 ensure_db_schema 를 부른다 (ARCH-04)
```

#### [권장] CC-04 중복 인덱스
- **위치**: `backend/app/models/chat_session.py:21`(`index=True` → `ix_chat_sessions_updated_at`)와 `:32`(`idx_chat_sessions_updated_at`), `backend/app/models/news.py:8`(PK 에 `index=True`)
- **개선 제안 (Diff)**:
```diff
-        nullable=False,
-        index=True
+        nullable=False,
 ...
-    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
+    id = Column(Integer, primary_key=True, autoincrement=True)
```
  기존 DB 의 인덱스는 `create_all` 이 지우지 않으므로 `DROP INDEX IF EXISTS` 를 스키마 보정에 넣는다.

#### [권장] CC-05 `GET /api/briefing/today` 와 `POST /api/briefing/generate` 가 같은 함수다
- **위치**: `backend/app/api/briefing.py:25-38`, `:40-53`
- **개선 제안 (Diff)**:
```diff
-@router.post("/generate", response_model=DailyBriefingResponse)
-async def regenerate_briefing(db: AsyncSession = Depends(get_db)):
-    data = await briefing_service.generate_daily_briefing(session=db)
-    return DailyBriefingResponse(...)
+@router.post("/generate", response_model=DailyBriefingResponse)
+async def regenerate_briefing(db: AsyncSession = Depends(get_db)):
+    return await get_today_briefing(db)   # 캐시가 생기면 여기서 무효화한다
```

#### [권장] CC-06 스키마 보정 예외를 로그 없이 삼키고, 마이그레이션 도구가 없다
- **위치**: `backend/app/database.py:49-71`(`except Exception: pass` 두 곳), FTS 단계 `:73-112`
- **근거**: `create_all` 은 기존 테이블을 바꾸지 않고 수동 `ALTER` 는 열 4개뿐이다. 실패하면 이후 쿼리가 "no such column" 으로 500 이 되는데 원인 로그가 없다.
- **개선 제안 (Diff)**:
```diff
-            except Exception:
-                pass
+            except Exception:
+                logger.exception("news_items 스키마 보정 실패")
+                raise
```
  다음 스키마 변경부터는 Alembic(`render_as_batch=True`, SQLite)을 들인다 (fullstack-architect 결정).

#### [권장] CC-07 주석·로그가 실제 값과 다르다
- **위치**: `backend/app/models/news.py:62`(`verdict` 주석에 `ALREADY_MONITORED` 없음, 실제 값 `backend/app/services/deep_researcher.py:319`), `backend/app/scheduler.py:12`(로그가 "0,6,12,18" 고정, CFG-01 을 고치면 틀린다), `backend/app/services/llm_processor.py:592`(docstring "Gemini/OpenAI" — 실제 우선순위는 Anthropic → OpenAI → Ollama, `:301-325`)
- **개선 제안 (Diff)**:
```diff
-    verdict = Column(String(30), nullable=False) # AUTO_ADOPTED, WATCHLIST, REJECTED
+    verdict = Column(String(30), nullable=False) # AUTO_ADOPTED, WATCHLIST, REJECTED, ALREADY_MONITORED
```

### 2.6 Pillar 4 — 성능·리소스

#### [권장] PERF-01 동기 Ollama 판정이 이벤트 루프를 막는다
- **위치**: `backend/app/services/llm_processor.py:171-194`(`httpx.Client(timeout=1.0)` 동기 GET), 호출 `:319`(`has_live_provider`), 호출처 `backend/app/api/chat.py:349`, `llm_processor.py:362`, `:419`, `backend/app/services/chat_service.py:381`, 수집 항목마다 `llm_processor.py:619`
- **근거**: Anthropic·OpenAI 키가 없을 때 판정마다 최대 1초 루프가 멈춘다. 수집 배치에서는 항목 수만큼 반복된다 (코드상 판단, 측정하지 않음).
- **개선 제안 (Diff)**:
```diff
-    def _ollama_status(self, url: str, model: str) -> Tuple[bool, str]:
+    async def _ollama_status(self, url: str, model: str) -> Tuple[bool, str]:
 ...
-            with httpx.Client(timeout=1.0) as client:
-                resp = client.get(f"{url}/api/tags")
+            async with httpx.AsyncClient(timeout=1.0) as client:
+                resp = await client.get(f"{url}/api/tags")
```
  판정 결과를 30초 정도 캐시해 항목마다 부르지 않게 한다. `has_live_provider` 를 async 로 바꾸면 호출처를 함께 고친다.

#### [권장] PERF-02 수집 배치가 잠금과 쓰기 트랜잭션을 쥔 채 LLM 을 기다린다
- **위치**: `backend/app/collectors/manager.py:77`(`_db_lock`), `:78`(세션), `:92-97`(항목마다 `await evaluate_content_with_llm`), `:130-133`(autoflush 로 첫 INSERT 뒤 쓰기 트랜잭션 시작)
- **근거**: 소스 6개를 `gather` 로 동시에 돌리지만 배치 저장은 잠금으로 직렬화되고, 잠금 안에서 LLM 왕복을 기다린다. 첫 INSERT 이후로 SQLite 쓰기 잠금이 배치 끝까지 열려, 그동안 챗 저장·스크래핑 UPDATE·세션 API 가 `busy_timeout` 30초까지 기다리다 `database is locked` 가 날 수 있다 (설계서 4.3, 측정하지 않음).
- **개선 제안 (Diff)**:
```diff
-        async with self._db_lock:
-            async with AsyncSessionLocal() as session:
-                try:
-                    for raw in raw_items:
-                        ... eval_result = await llm_processor.evaluate_content_with_llm(...)
-                        ... session.add(new_item)
+        evaluated = await asyncio.gather(*(self._evaluate(raw) for raw in raw_items))  # 잠금 밖에서 평가
+        rows = [r for r in evaluated if r is not None]
+        async with self._db_lock:
+            async with AsyncSessionLocal() as session:
+                await self._upsert_rows(session, rows)   # INSERT ... ON CONFLICT(dedup_hash) DO UPDATE
+                await session.commit()
```
  `ON CONFLICT` 업서트는 ARCH-04 의 동시 수집 UNIQUE 위반 롤백도 막는다. LLM 동시 호출 수는 `asyncio.Semaphore` 로 제한한다.

#### [권장] PERF-03 CPU 파싱을 이벤트 루프에서 한다
- **위치**: `backend/app/services/scraper.py:93-117`(trafilatura·readability·BeautifulSoup), `backend/app/collectors/sources/rss.py:39`, `backend/app/services/source_researcher.py:281`, `backend/app/services/deep_researcher.py:278`(`feedparser.parse`)
- **개선 제안 (Diff)**:
```diff
-            content = trafilatura.extract(html, url=url, include_links=True, include_formatting=True, favor_precision=True)
+            content = await asyncio.to_thread(
+                trafilatura.extract, html, url=url, include_links=True, include_formatting=True, favor_precision=True)
 ...
-        parsed = feedparser.parse(resp.text)
+        parsed = await asyncio.to_thread(feedparser.parse, resp.text)
```

#### [권장] PERF-04 호출마다 설정 파일을 다시 연다
- **위치**: `backend/app/services/llm_processor.py:133`, `:143`, `:154`, `:164`, `:200`, `:304`(`load_json_config()`), `backend/app/services/sources_service.py:36-45`, `:137-167`(수집기·API 마다 `load_sources()`)
- **근거**: `settings` 가 이미 같은 값을 갖고 있고(단 지금은 저장 뒤 재적용이 안 된다, 9절 BUG-01), 디스크 읽기를 async 경로에서 동기로 한다.
- **개선 제안 (Diff)**:
```diff
-        llm_cfg = load_json_config().get("llm", {})
-        return (
-            getattr(settings, "OPENAI_API_KEY", "")
-            or llm_cfg.get("openai_api_key", "")
-            or os.environ.get("OPENAI_API_KEY", "")
-            or ""
-        )
+        return settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY", "")
```
  `sources.json` 은 파일 mtime 을 보고 바뀐 때만 다시 읽는다.

#### [권장] PERF-05 크기 제한 없는 캐시와 잠금 dict
- **위치**: `backend/app/services/llm_processor.py:119-120`(`_qa_cache`, `_eval_cache`), `backend/app/services/scraper.py:37`, `:44-48`(`_url_locks` 를 지우지 않음). 비교: L1 캐시는 500개 LRU (`:35-36`).
- **개선 제안 (Diff)**:
```diff
-        self._qa_cache: Dict[str, Tuple[str, str]] = {}
-        self._eval_cache: Dict[str, Dict[str, Any]] = {}
+        self._qa_cache: TTLCache = TTLCache(maxsize=1000, ttl=6 * 3600)
+        self._eval_cache: TTLCache = TTLCache(maxsize=5000, ttl=24 * 3600)
--- a/backend/app/services/scraper.py
-    _url_locks: Dict[str, asyncio.Lock] = {}
+    _url_locks: "weakref.WeakValueDictionary[str, asyncio.Lock]" = weakref.WeakValueDictionary()
```

#### [권장] PERF-06 검색마다 FTS 상태를 다시 확인하고 GET 이 쓴다
- **위치**: `backend/app/services/retriever.py:57`(`_fts_initialized` 선언), `:117`(설정만 함, 읽는 곳 없음), `:541`(검색마다 `_ensure_fts_table`), `:105-116`(rebuild·커밋)
- **근거**: 검색 한 번에 `sqlite_master` 조회와 `count(*)` 2번이 붙는다. `GET /api/chat/search` 가 테이블 생성·rebuild·커밋을 할 수 있다.
- **개선 제안 (Diff)**:
```diff
     async def _ensure_fts_table(self):
+        if SqliteFtsRetriever._fts_initialized:
+            return
```
  CC-03 을 하면 이 메서드 자체가 필요 없다.

#### [권장] PERF-07 비용이 드는 엔드포인트에 길이·범위·속도 제한이 없다
- **위치**: `backend/app/schemas/news.py:39-40`(`AskQuestionRequest.question: str`, 길이 제한 없음), `backend/app/api/research.py:68`(`limit: int = 30`, 범위 없음), `:78`(`max_candidates: int = 6`, 범위 없음), `:14`(`DiscoverRequest.limit`), 속도 제한 없음: `/api/chat/query`, `/api/chat/stream`, `/api/news/{id}/ask(*)`, `/api/schedule/trigger`
- **근거**: 재현 R9 — `POST /api/news/1/ask` 에 10만 자 질문 → `200`. 챗은 2000자 제한이 있다(`backend/app/schemas/chat.py:29`). SQLite 에서 `LIMIT -1` 은 무제한이다.
- **개선 제안 (Diff)**:
```diff
 class AskQuestionRequest(BaseModel):
-    question: str
+    question: str = Field(..., min_length=1, max_length=2000)
--- a/backend/app/api/research.py
-async def get_research_audit_logs(limit: int = 30):
+async def get_research_audit_logs(limit: int = Query(30, ge=1, le=200)):
```

### 2.7 Pillar 5 — 테스트

#### [머지 전 필수] TEST-01 필수 결함 7건(BUG-02~08)에 회귀 테스트가 없다
- **위치**: `backend/tests/`
- **근거**: 217개 테스트가 모두 통과하는 상태에서 아래 결함이 재현됐다. 각각을 실패로 드러내는 테스트가 없다. 고칠 때 먼저 실패하는 테스트를 쓰고(`run_backend_tdd.py --phase red`) 고친 뒤 통과를 확인한다 (`backend-tdd-workflow`).

| 결함 | 추가할 테스트 (이름 예) | 단언 |
|---|---|---|
| BUG-02 | `test_stream_persist_then_frontend_sync_does_not_duplicate` | 재현 R2 순서 뒤 메시지 4개, 두 번째 동기화 2xx, 응답 `messages` 가 DB 와 같음 |
| BUG-03 | `test_deep_research_resets_running_flag_on_error` | `probe_and_discover_feed` 가 예외 → `is_running is False` |
| BUG-04 | `test_deep_research_evaluates_mined_candidates` | 발굴 URL 2개 흉내, `max_candidates=6` 평가 목록에 발굴 URL 포함 |
| BUG-05 | `test_toggle_github_repo_with_slash` | `owner%2Frepo` 토글 200 |
| BUG-06 | `test_chat_stream_invalid_model_tier_returns_400`, `test_chat_stream_non_object_body_returns_400` | 400, `error_code` 형식 |
| BUG-07 | `test_ask_stream_partial_failure_does_not_append_fallback` | 흉내 Claude 가 토큰 2개 뒤 끊김 → `error` 이벤트, 폴백 `meta` 없음, 캐시 없음 |
| BUG-08 | `test_anthropic_stream_error_event_raises`, `test_anthropic_stream_max_tokens_marks_truncated` | `error` 이벤트 → 예외, `stop_reason=max_tokens` 전달 |

  흉내 Claude(`backend/tests/llm_fakes.py`)가 SSE `error` 이벤트와 `stop_reason` 을 보낼 수 있게 확장해야 BUG-07·08 을 테스트할 수 있다.

#### [권장] TEST-02 여러 결과를 허용하는 약한 단언
- **위치와 근거**:
  - `backend/tests/test_config_and_live_llm.py:11` — `settings.VERSION in ("0.4.0", "0.3.1", "0.3.0", "0.2.2", "0.2.1", "0.2.0", "0.1.0", "1.0.0")`. 버전이 0.1.0 으로 되돌아가도 통과한다. `01_TDD_CYCLE_LOG.md` 2.0 은 `3973ae9` 를 "버전 단언 0.4.0" 으로 적지만 이 단언은 8개 값을 허용한다.
  - `backend/tests/test_reset_and_delete.py:15-16` — `status in ["started", "already_running"]`, `"deleted_count" in data`. 실제로 행이 지워졌는지 보지 않는다 (`collect_all` 을 흉내 내므로 `already_running` 이 나올 이유가 없다). `:22-25` 도 삭제 뒤 개수를 보지 않는다.
  - `backend/tests/test_chat_sessions.py:155` — `in (200, 201)`. 코드는 201 만 돌려준다 (`backend/app/api/chat.py:476`).
  - `backend/tests/test_deep_researcher.py:31`, `:48`, `:72` — 판정·상태 목록 허용.
- **개선 제안 (Diff)**:
```diff
-    assert settings.VERSION in ("0.4.0", "0.3.1", "0.3.0", "0.2.2", "0.2.1", "0.2.0", "0.1.0", "1.0.0")
+    assert settings.VERSION == json.loads((ROOT / "config.json").read_text())["app"]["version"]
--- a/backend/tests/test_reset_and_delete.py
-    assert data["status"] in ["started", "already_running"]
-    assert "deleted_count" in data
+    assert data["status"] == "started"
+    async with AsyncSessionLocal() as s:
+        assert (await s.execute(select(func.count(NewsItem.id)))).scalar_one() == 0
--- a/backend/tests/test_chat_sessions.py
-        assert res2.status_code in (200, 201)
+        assert res2.status_code == 201
```
  버전 문자열 위치는 `docs/releases.md` '버전 문자열 위치' 를 따른다.

#### [권장] TEST-03 실네트워크 호출과 테스트 뒤에도 도는 백그라운드 태스크
- **위치**: `backend/tests/test_deep_researcher.py:10-14`(GitHub 실호출 `probe_and_discover_feed`), `:36-49`(`run_deep_research(max_candidates=2)` 가 시드 2개를 실제로 탐침), `:69-72`(`POST /api/research/run-deep` 가 `asyncio.create_task` 로 실제 사이클을 띄우고 기다리지 않음), 그 밖의 실호출(스크래퍼·Notion·SMTP)은 `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md` 6절
- **근거**: 오프라인·상대 서버 장애 시 실패한다. `run-deep` 태스크는 테스트가 끝난 뒤에도 같은 이벤트 루프·DB 를 쓸 수 있다. `run_deep_research` 가 `add_rss_source` 를 부르면 세션 사본 `sources.json` 이 바뀐다.
- **개선 제안 (Diff)**:
```diff
 @pytest.mark.asyncio
-async def test_probe_and_discover_feed_github():
-    res = await deep_researcher.probe_and_discover_feed("https://github.com/All-Hands-AI/OpenHands")
+async def test_probe_and_discover_feed_github(respx_mock):
+    respx_mock.get("https://github.com/All-Hands-AI/OpenHands/releases.atom").respond(200, text=ATOM_FIXTURE)
+    res = await deep_researcher.probe_and_discover_feed("https://github.com/All-Hands-AI/OpenHands")
 ...
-        t_res = await ac.post("/api/research/run-deep?max_candidates=1")
+        monkeypatch.setattr(deep_researcher, "run_deep_research", AsyncMock(return_value={}))
+        t_res = await ac.post("/api/research/run-deep?max_candidates=1")
```
  실호출을 꼭 남기려면 `@pytest.mark.live` 로 표시하고 `make check` 에서 뺀다 (`docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md` 1.4: 지금은 마커가 없다).

#### [권장] TEST-04 테스트 DB 가 실행 사이에 남는다
- **위치**: `backend/tests/conftest.py:6-7`(`test_agentlens.db` 고정 경로), `:13-44`(id=1 만 넣고 지우지 않음)
- **근거**: 앞 실행이 남긴 세션·메시지·감사 로그가 다음 실행 결과(FIFO 30, 검색 결과 순위)에 섞일 수 있다. `test_deep_research_run_and_audit` 의 `items[-1]` 은 앞 실행 행일 수 있다.
- **개선 제안 (Diff)**:
```diff
-TEST_DB_FILE = Path(__file__).resolve().parent / "test_agentlens.db"
+import tempfile
+TEST_DB_FILE = Path(tempfile.mkdtemp(prefix="agentlens-test-")) / "test_agentlens.db"
```

#### [권장 (기록)] TEST-05 v0.1.0~v0.3.1 은 Red→Green 순서를 확인할 수 없다
- **근거**: `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md` 2.0 — `main` 의 `backend/tests/` 이력 10개 커밋에 `test:` 커밋이 없고, 그 시기 테스트와 코드가 한 커밋이다. v0.4.0 작업(`89dc2ad`~`f9394fd`, reflog)은 테스트 커밋이 코드 커밋보다 앞선다. 지난 이력은 고칠 수 없으므로 조치 없음. 이후 작업은 `test:` 커밋 → `fix:`/`feat:` 커밋 순서를 squash 뒤에도 PR 설명이나 tasks 기록에 남긴다.

#### [권장] TEST-06 커버리지 도구가 없고 라이브 planner 경로가 검증되지 않는다
- **근거**: `.venv` 에 `pytest-cov`·`coverage` 가 없다 (`01_TDD_CYCLE_LOG.md` 1.4). ARCH-05 때문에 `chat_service.py:381-` 의 LLM planner JSON·`ACTION:` 파싱 분기는 테스트에서 실행되지 않는다.
- **개선 제안 (Diff)**:
```diff
--- a/backend/requirements-dev.txt
+pytest-cov
--- a/Makefile (check)
-	cd backend && ../.venv/bin/pytest -v tests/
+	cd backend && ../.venv/bin/pytest -v --cov=app --cov-report=term-missing tests/
```
  planner 는 흉내 Claude 가 `{"action": "search_news_corpus", ...}`·`ACTION: NONE`·잘못된 JSON 을 돌려주는 세 경우를 테스트한다.

---

## 3. 최종 리뷰 판정 및 출시 승인

- **판정 결과 (v0.4.2 4차 재리뷰, 2026-11-10)**: **APPROVED**
- **v0.4.2 4차 재리뷰 코멘트**: 4차 수정 5건(Slack 테스트 문구, `make collect` 직접 모드 경고·잠금 실패 종료 1, 피드 `category_hint` 기본 카테고리, 탐침 예외 원문 숨김, 자동 채택 저장 실패 처리)과 D-54(`redirect_slashes=False`, 저장소 안에 끝 슬래시로 API 를 부르는 곳이 없음을 확인)가 맞다. `category_hint` 는 관련성 평가를 통과한 항목에만 적용된다(재현). 외부·LLM 호출을 모두 막고 재현했다. 머지 전 필수 0, 권장 0. `make check` 종료 0 (backend `418 passed`, frontend `70 files / 831 tests`). 상세는 11.13절.

이하 v0.4.2 3차 재리뷰 판정:

- **판정 결과 (v0.4.2 3차 재리뷰, 2026-11-10)**: **APPROVED**
- **v0.4.2 3차 재리뷰 코멘트**: M003-01 이 고쳐졌다. m003 의 GitHub 규칙이 감시 저장소 폴백 행(URL·`stars_hint`·포크 비율이 모두 같은 행)만 0 으로 만들고, 옛 DB 사본에서 0 처리 행이 404 → 8(모두 합성)이 됐다. 옛 규칙을 되살리는 변이를 테스트가 잡는다. 사용자 실제 DB 의 GitHub 지표 복구도 읽기 조회로 확인했다. 머지 전 필수 0, 권장 0. `make check` 종료 0 (backend `410 passed`, frontend `70 files / 823 tests`). 상세는 11.12절.

이하 v0.4.2 2차 재리뷰 판정:

- **판정 결과 (v0.4.2 2차 재리뷰, 2026-11-10)**: **REQUEST_CHANGES**
- **v0.4.2 2차 재리뷰 코멘트**: 11절 권장 9건은 모두 해결됐고(재현·변이로 확인), ADR Q4·Q11·Q12·Q13, 스트림 `session_id` 검증, `ChatStatusStep` 4값, `ManualCollectResponse` 도 맞다. 그러나 새 마이그레이션 m003 의 GitHub 합성 지표 판정 규칙이 실제 GitHub 검색 결과의 별·포크도 0 으로 지운다(M003-01, 머지 전 필수). 옛 DB 사본에서 404행 중 396행이 실제 값이었고, 사용자 실제 DB 도 이미 적용돼 수백 행이 지워졌을 가능성이 높다(통계 근거, 11.11.3). 되돌릴 수 없는 데이터 손실이라 출시 전에 규칙을 고쳐야 한다. `make check` 종료 0 (backend `410 passed`, frontend `69 files / 820 tests`). 상세는 11.11절.

이하 v0.4.2 1차 재리뷰 판정:

- **판정 결과 (v0.4.2 재리뷰, 2026-11-10)**: **APPROVED**
- **v0.4.2 재리뷰 코멘트**: 지난 권장 50건 중 47건 해결, 2건 일부 해결(ARCH-03 → ARCH-03R, CFG-02 → CFG-02R), 1건 기록(TEST-05). 머지 전 필수는 0건이다. 새로 찾은 권장 9건(ARCH-03R, CFG-02R, N-08~N-12, TEST-07, TEST-08)은 모두 재현 또는 변이(mutation) 실행으로 확인했고, 각각 권장으로 둔 이유를 11.7절에 적었다. 이번 지시가 "남은 결함 0" 이므로 오케스트레이터가 이 9건을 다시 고치게 하는 것을 권한다. `make check` 종료 0 (backend `384 passed`, frontend `67 files / 783 tests`, eslint 출력 없음, `tsc --noEmit` 출력 없음), 실행 전후 `git status --porcelain`·`git diff HEAD` 해시·`sources.json` 두 벌·`config.json` md5 같음 (11.2절). 수용된 위험 6건(9절)은 이번에도 판정 근거로 쓰지 않았다.

이하 재리뷰 2차 판정 (v0.4.1 기준):

- **판정 결과 (재리뷰 2차, 2026-11-09)**: **APPROVED**
- **재리뷰 2차 코멘트**: BUG-02R 이 계약 8.1 대로 고쳐졌다. 클라이언트 id 를 싣는 재현(R11)에서 두 턴 = 메시지 4개·`message_count` 4, 역순 저장도 한 벌, id 없는 요청은 서버 UUID 로 하위 호환. 회귀 테스트 9개 추가, `make check` 종료 0 (backend 244, frontend 664). 최초 필수 8건 모두 해결. 남은 것은 권장 50건(새 N-06·N-07 포함)과 수용된 위험 6건이다. 상세는 10.8절.

이하 재리뷰 1차 판정 (BUG-02R 수정 전):

- **판정 결과 (재리뷰 1차)**: **REQUEST_CHANGES**
- **재리뷰 1차 코멘트**: 머지 전 필수 8건 중 BUG-03·04·05·06·07·08 과 TEST-01 은 해결됐다. BUG-02 는 PK 충돌 500 과 오래된 응답은 해결됐지만, 같은 턴을 서버(`persist_turn`, 서버 UUID)와 프론트(세션 POST, 클라이언트 id)가 다른 id 로 한 번씩 저장하는 이중 저장이 남는다. 재현으로 두 턴 뒤 세션 상세가 `['q1','a1','q1','a1','q2','a2','q2','a2']`, `message_count` 8 이다. 화면은 세션을 열 때 서버 상세를 먼저 읽으므로 사용자에게 대화가 두 번씩 보인다. 그래서 머지 전 필수(BUG-02R)로 판단한다. 수정 방향과 근거는 10.2절. `make check` 는 종료 0 (10.5절).

이하 최초 감사 판정 (수정 전 코드 기준):

- **판정 결과**: **REQUEST_CHANGES**
- **판정 코멘트**: SQL 은 안전하게 바인딩돼 있고 217개 테스트가 통과하지만, 지금 코드는 출시 품질이 아니다. 검사 범위 안에 머지 전 필수 8건이 남아 있다. 이 판정은 9절의 수용된 위험 6건을 근거로 쓰지 않았다. 그 6건을 빼도 판정은 같다.
  - 동작·계약 결함 7건: 챗 메시지 이중 저장·PK 충돌 500(BUG-02, 재현), 딥 리서치 플래그 고착(BUG-03)과 발굴 후보 미평가(BUG-04), 저장소 토글·삭제 404(BUG-05, 재현), 검증 실패 500(BUG-06, 재현), 스트림 답 섞임(BUG-07)과 잘린 답의 완료 처리(BUG-08).
  - 테스트 1건: 위 결함들의 회귀 테스트 없음(TEST-01).
- **다음 단계**: 필수 항목마다 실패하는 테스트를 먼저 쓰고(backend-tdd-engineer) 고친 뒤 다시 리뷰를 요청한다. BUG-02·06·07·08 은 계약이 바뀌므로 contract-integrator 가 `frontend/src/types`·MSW·계약 테스트를 같은 작업에서 맞춘다.

---

## 4. `make check` 결과 (최초 감사)

재리뷰 때 실행 결과는 10.5절.

- 실행: 2026-11-09, 저장소 루트에서 `make check` (이 검토자가 직접 실행). 종료 코드 **0**.
- backend: `cd backend && ../.venv/bin/pytest -v tests/` → `217 passed in 12.95s` (Python 3.11.9, pytest 9.2.0).
- frontend: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` → `Test Files  52 passed (52)`, `Tests  649 passed (649)`, eslint `✖ 41 problems (0 errors, 41 warnings)`, `tsc` 출력 없음(통과).
- 실행 전후 `git status --short` 가 같다 (추적 파일 변경 없음). 이 시점 작업 트리에는 다른 작업이 만든 `.claude/**`, `CLAUDE.md`, `README.md` 변경과 `docs/*/` 새 폴더가 있었고, `make check` 는 그 상태를 바꾸지 않았다.
- 발췌:
```
cd backend && ../.venv/bin/pytest -v tests/
platform darwin -- Python 3.11.9, pytest-9.2.0, pluggy-1.7.0 -- /Users/wonyoung/workspace/ozplayground/agentlens/.venv/bin/python
...
tests/test_trends_and_webhook.py::test_webhook_invalid_url PASSED        [100%]

============================= 217 passed in 12.95s =============================
cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit
...
 Test Files  52 passed (52)
      Tests  649 passed (649)
...
✖ 41 problems (0 errors, 41 warnings)
```
- eslint 경고 중 `ChatWorkspace.tsx:508` `react-hooks/exhaustive-deps`(`selectedTier`)는 옛 `docs/known-issues.md` 의 "모델을 바꾼 직후 이전 티어로 요청" 과 같은 곳이다. frontend 범위라 이 보고서는 지적하지 않고 7절로 넘긴다.

---

## 5. 재현 실행 기록

모두 2026-11-09, `backend/` 에서 `../.venv/bin/python -I` 로 스크래치 스크립트를 실행했다. 환경: `DATABASE_URL` 을 스크래치 디렉터리의 임시 SQLite 로, `TESTING=1`, `httpx.ASGITransport(app=app, raise_app_exceptions=False)` (lifespan 을 돌리지 않아 스케줄러·첫 수집이 시작되지 않는다). 저장소 추적 파일에 쓰지 않았다 (설정 저장 재현은 스크래치 디렉터리의 `config.json` 을 cwd 로 썼다). 스크립트는 세션 스크래치 디렉터리에 있고 저장소에 넣지 않았다.

| ID | 대상 | 절차 | 결과 |
|---|---|---|---|
| R1 | BUG-01 | 스크래치 cwd 의 `config.json`(Notion `old-key`, SMTP `old.host`)으로 import → `save_json_config` 로 새 값 저장 | 파일·`raw_json_config` 는 새 값, `settings.NOTION_API_KEY`·`SMTP_HOST` 는 `old-key old.host` |
| R2 | BUG-02, SEC-03 | `persist_turn(q1,a1)` → `POST /api/chat/sessions`(같은 턴, 클라이언트 id) → `persist_turn(q2,a2)` → `POST`(전체 4개) → `GET` | `sync1 201 messages 2`, `sync2 500 ERR_SESSION_CREATE_FAILED ... UNIQUE constraint failed: chat_messages.id [SQL: INSERT ...] [parameters: ...'q1'...]`, `detail 200 title t2 messages 6` |
| R3 | BUG-06, SEC-03 | `POST /api/chat/stream {"question":"hello","model_tier":"ultra"}` | `500 {"detail":"Internal server error occurred. ...","error":"1 validation error for ChatStreamRequest ..."}` |
| R4 | BUG-06 | `POST /api/chat/stream` 본문 `["x"]` | `500 {"detail":...,"error":"'list' object has no attribute 'get'"}` |
| R5 | SEC-01, SEC-03, SEC-04 | `OPTIONS /api/news/all` (`Origin: https://evil.example`, `Access-Control-Request-Method: DELETE`), `GET /api/briefing/settings` 같은 Origin, `GET /api/sources`, `GET /api/mcp/info` | 프리플라이트 `200`, `access-control-allow-origin: https://evil.example`, `access-control-allow-credentials: true`. 설정 응답에 같은 헤더와 `webhooks.slack_webhook_url` 키. `sources_file` 과 MCP `command`·`cwd` 에 절대 경로 |
| R6 | BUG-05 | `PATCH /api/sources/github_repo/no-such-owner%2Fno-such-repo/toggle`, `PATCH /api/sources/github_repo/no-such-repo/toggle` | `404 {"detail":"Not Found"}`(라우트 불일치), `404 {"detail":"Source not found or invalid type"}`(라우트 일치, 쓰기 없음) |
| R7 | BUG-05 수정 확인 | 별도 FastAPI 앱에 `/{source_type}/{item_id:path}/toggle`, `/{source_type}/{item_id:path}` | `jlowin%2Ffastmcp` → `jlowin/fastmcp`, `https%3A%2F%2Fe.com%2Ffeed` → `https://e.com/feed` |
| R8 | BUG-12 | 임시 DB 에서 `UPDATE news_items SET summary = NULL` → `GET /api/news/feed/rss.xml` | `500 {"error":"'NoneType' object has no attribute 'replace'"}`. ORM 으로 `summary=None` 을 넣으면 열 기본값 `""` 이 들어가 200 이었다 |
| R9 | PERF-07 | `POST /api/news/1/ask {"question": "x"*100000}` | `200` |

`BUG-04` 의 시드 수는 `deep_researcher.py` 의 `SEED_EXPLORATION_TARGETS` 블록에서 `"url"` 개수를 세어 14 로 확인했다.

---

## 6. 옛 `docs/known-issues.md` backend 행 대응표

옛 문서가 지워져도 backend 결함이 남도록 모든 backend 행을 이 보고서의 지적에 대응시켰다. frontend·계약 전용 행은 7절로 넘겼다.

| 옛 행 (절) | 이 보고서 | 비고 |
|---|---|---|
| 인증 없음, CORS 모든 origin + credentials (보안) | SEC-01 (9절, 수용된 위험) | 재현으로 확인. 0.0.0.0 바인드를 추가로 확인 |
| 호출자가 준 URL·SMTP 호스트로 요청 (보안) | SEC-05, SEC-02 (9절, 수용된 위험) | 저장 비밀번호 재사용(SEC-02)은 새로 찾음 |
| 비밀값을 git 추적 `config.json` 에 평문 (보안) | SEC-06 (9절, 수용된 위험) | 지금 커밋된 값은 비어 있음 |
| `GET /api/briefing/settings` 웹훅 URL·Notion 토큰 4자 (보안) | SEC-04 (9절, 수용된 위험) | |
| 예외 문자열·서버 절대 경로 노출 (보안) | SEC-03 | SQL·대화 내용 노출을 재현 |
| 이메일 HTML 비이스케이프 (보안) | SEC-07 | |
| 챗 턴 이중 저장·PK 충돌 500, 의심 (데이터) | BUG-02 | 의심 → backend 재현으로 확인. 업서트 응답의 오래된 `messages` 를 추가로 확인 |
| `settings.reload()` 가 Notion·SMTP 미반영 (데이터) | BUG-01 (9절, 수용된 위험) | 재현으로 확인. 웹훅 URL 도 같은 원인 |
| 딥 리서치 예외 뒤 `is_running` (데이터) | BUG-03 | `create_task` 참조 미보관 추가 |
| 딥 리서치 후보 컷 6~8 vs 시드 14 (데이터) | BUG-04 | |
| 스트림이 `done` 없이 끊겨도 완료, backend 가 `stop_reason` 무시 (데이터) | BUG-08 (backend 부분) | 프론트 부분은 7절. `error` 이벤트 무시를 추가로 확인 |
| 스트림 중 Anthropic 실패 시 부분 답 + 대체 답 (데이터) | BUG-07 | 섞인 답 캐시를 추가로 확인 |
| GitHub 저장소 id 경로 한 구간, 의심 (데이터) | BUG-05 | 의심 → 재현으로 확인 |
| `last_usage` 공유 (데이터) | BUG-09 | |
| 평가 캐시 만료 없음·초기화 후 잔존 (데이터) | BUG-10 | |
| 크롤 로그 항상 `success` (데이터) | BUG-11 | |
| `CATEGORY_INSIGHTS` 고정 시사점 (데이터) | BUG-17 | 줄 번호 `:84-89`, `:741-748` (옛 문서 `:703-709` 는 지금 `:741-748`) |
| `raw_score` 합성 값·인기 점수 포화 (데이터) | BUG-18 | 측정 수치는 옛 문서 값을 옮김 |
| 브리핑 헤드라인·분야 요약 글자 수 자르기 (데이터) | BUG-15 | |
| 스케줄 시각 코드 고정 (설정) | CFG-01 | |
| 읽는 코드가 없는 설정 (설정) | CFG-02 | |
| 하이시그널 임계값 7.8 vs 7.0 (설정) | CFG-03 | |
| 화면 문구와 실제 동작 (설정) | CFG-04 (backend 부분) | Ask AI "Gemini" 표기·챗 Notion 동기화는 7절 |
| RSS 채널 링크 3000 고정 (설정) | BUG-12 | NULL 열 500 을 재현으로 추가 |
| 오류 형식 4가지 (계약) | CC-01, BUG-06 | 통일은 contract-integrator (CT-014) |
| backend 오류 코드가 zod 에 없음, `ERR_CLAUDE_API_KEY_MISSING` 401 (계약) | BUG-06 diff 의 zod 추가, 7절 | backend 는 401 을 유지하고 zod 주석을 고친다 (CT-007) |
| 잘못된 `model_tier` 500 (계약) | BUG-06 | 재현 |
| backend 분야 이름·이모지 (UI) | BUG-16 | |
| 챗 진행 라벨 이모지 (UI) | BUG-16 | |
| 마이그레이션 도구 없음, `ALTER` 실패 삼킴 (운영) | CC-06 | |
| DB 경로 cwd 기준, MCP 서버 스키마 미생성 (운영) | ARCH-04 | |
| 수집 중복 방지 플래그가 프로세스 메모리에만 (운영) | ARCH-04 | |
| 쓰이지 않는 backend 코드·API (쓰이지 않는 코드) | CC-02 | |

---

## 7. 이 보고서 범위 밖으로 넘기는 것

| 대상 | 내용 | 넘길 곳 |
|---|---|---|
| frontend | `handleSendMessage` 의존성에 `selectedTier` 없음 (`ChatWorkspace.tsx:508` eslint 경고), 스트림이 `done` 없이 끊겨도 완료 표시, 검색어마다 피드 재요청·페이지 1 미복귀, Ask AI "Gemini" 표기(`api.ts:132`, CT-012), 챗 Notion 동기화 모의 동작, `ChatModelSelector` 남은 변형·prop, 쓰이지 않는 프론트 코드, `NEXT_PUBLIC_API_URL` Docker 빌드 미전달 | frontend-code-reviewer (`docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md`), devops-engineer |
| 계약 | MSW 전용 `GET /api/chat/stream`·단계·보충 출처, global `sources` 순서, zod 에 없는 필드, `publisher: null` 거부 등 CT-001~CT-026 | contract-integrator (`docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` 7절) |
| 배포 | 0.0.0.0 바인드·Docker 포트 공개 범위(9절 SEC-01, 수용된 위험), `config.json`·`sources.json` `:rw` 마운트 | devops-engineer (`docs/devops-engineer/01_DEPLOYMENT_SPEC.md`) |
| 결정 | 인증·CORS 정책은 제품 오너가 수용된 위험으로 정했다 (2026-11-09). ADR D27 은 아직 '가정, 결정 기록 없음' 이라 결정 기록으로 옮겨야 한다. 마이그레이션 도구 도입 | fullstack-architect (`docs/fullstack-architect/01_ARCHITECTURE_ADR.md`) |

---

## 8. 입력 문서와 다르거나 새로 확인한 것

| 항목 | 입력 문서 | 이번 감사 |
|---|---|---|
| 챗 메시지 이중 저장·PK 충돌 | 설계서 13.5 와 CT-008 "실행 확인 안 함", 옛 known-issues "의심" | backend 쪽 순서를 재현해 확인 (R2). 업서트 응답이 갱신 전 `messages` 를 돌려주는 것도 새로 확인 |
| GitHub 저장소 경로 | 옛 known-issues "의심", CT-001 은 TestClient 로 확인 | 이번 앱 경로로 다시 확인 (R6) |
| `settings.reload()` | 옛 문서: Notion·SMTP 미반영 | 재현으로 확인 (R1). 웹훅 URL(`SLACK_WEBHOOK_URL` 등)도 "빈 값일 때만" 다시 읽어 바뀐 값이 반영되지 않는다 (`config.py:133-137`) |
| SMTP 저장 비밀번호 | 문서에 없음 | 새로 찾음 (SEC-02, 코드상 판단) |
| CORS | 문서: "CORS 가 모든 출처 허용" | 실제로는 `*` 가 아니라 요청 Origin 을 그대로 반사하고 credentials 를 허용한다 (R5) |
| 바인드 주소 | 문서에 없음 | `backend/Dockerfile:35`, `scripts/dev.sh:11` 모두 `0.0.0.0` |
| Anthropic 스트림 `error` 이벤트 | 문서: `stop_reason` 무시만 | `error` 이벤트도 무시 (BUG-08) |
| Ask AI 스트림 | 문서: 부분 답 + 대체 답 | 섞인 답을 `_qa_cache` 에 저장해 반복 (BUG-07) |
| `CATEGORY_INSIGHTS` 줄 번호 | 옛 known-issues `llm_processor.py:84-89,703-709` | 사용처는 지금 `:741-748` |
| `CHAT_*` 설정 5개 | 옛 known-issues | 지금 `CHAT_` 접두 필드는 3개 (`config.py:68-70`), 나머지는 `SCRAPER_TIMEOUT_SECONDS`·`AGENTIC_SEARCH_MAX_QUERIES` (`:71-72`) |
| 버전 단언 | TDD 기록 2.0: `3973ae9` "버전 단언 0.4.0" | `test_config_and_live_llm.py:11` 은 8개 버전을 허용 (TEST-02) |
| RSS NULL 500 | 설계서 13.5: `summary`·`published_at` NULL 이면 500 | `summary` NULL 은 재현(R8). 지금 수집기는 `summary` 를 `""` 로 넣어 새 데이터로는 드물다 |

---

## 9. 검사 범위 밖 (수용된 위험)

제품 오너 결정(2026-11-09, 오케스트레이터 전달): 이 프로젝트는 인증 없음과 CORS 전체 허용, SSRF, 비밀값 평문 저장, 설정 조회로 비밀값 노출, 설정 재적용 누락을 검사하지 않는다. 아래 6건은 이 범주에서 찾은 사실과 근거 `path:line` 을 남기려고 둔다. 3절 판정의 근거로 쓰지 않았고 1.1 의 필수·권장 개수에도 넣지 않았다. 수정 제안(diff)은 결정이 바뀔 때를 위한 참고다.

| ID | 범주 | 요지 | 확인 |
|---|---|---|---|
| SEC-01 | 인증 없음·CORS 전체 허용 | 요청 Origin 을 그대로 반사하고 credentials 를 허용한다. 0.0.0.0 바인드. 파괴·설정 엔드포인트에 인증이 없다 | 재현 R5 |
| SEC-02 | SSRF (+ 비밀값 노출) | `test/email` 이 비밀번호를 비워 보내면 저장된 SMTP 비밀번호로 호출자가 고른 호스트에 로그인한다 | 코드상 판단 |
| SEC-04 | 설정 조회로 비밀값 노출 | `GET /api/briefing/settings` 가 웹훅 URL 원문과 Notion 토큰 앞뒤 4자를 돌려준다 | 재현 R5 (키만 확인, 값은 비어 있음) |
| SEC-05 | SSRF | 웹훅 테스트·발송, `inspect-url`, `test/email` 이 호출자 지정 주소로 요청한다 | 코드상 판단 |
| SEC-06 | 비밀값 평문 저장 | 비밀값을 git 추적 `config.json` 에 평문으로 쓴다 | 코드 + `git ls-files` |
| BUG-01 | 설정 재적용 누락 | `settings.reload()` 가 Notion·SMTP·웹훅 값을 다시 읽지 않아 재시작 전까지 옛 값으로 발송한다 | 재현 R1 |

검토자 의견 (판정과 무관): SEC-02 는 SSRF 범주에 들지만 결과가 '저장된 SMTP 비밀번호가 외부 서버로 나가는 것' 이라 다른 SSRF 항목보다 영향이 크다. SEC-01 의 Origin 반사와 겹치면 사용자가 연 아무 웹 페이지가 이 요청을 보낼 수 있다 (코드상 판단). 수용 범위에 이 결과까지 포함하는지 제품 오너가 따로 확인하기를 권한다. BUG-01 은 화면(설정 조회)과 실제 발송 값이 달라지는 사용자 눈에 보이는 동작 결함이기도 하다.

### [범위 밖 (수용된 위험)] SEC-01 인증 없는 파괴·설정 엔드포인트가 임의 origin 에 열려 있다
- **위치**: `backend/app/main.py:50-56`, 바인드 `backend/Dockerfile:35`(`--host 0.0.0.0`), `scripts/dev.sh:11`(`DEV_HOST` 기본 `0.0.0.0`), `docker-compose.yml:15`(`"${BACKEND_PORT:-8000}:8000"`)
- **근거**:
  - 인증 의존성이 어떤 라우터에도 없다 (`backend/app/api/*.py`). ADR 도 "인증 없음, CORS `*` + credentials. 단일 사용자 로컬 도구 전제로 보인다. 결정 기록 없음" 이라 적는다 (`docs/fullstack-architect/01_ARCHITECTURE_ADR.md:91`, D27 '가정').
  - 재현 (5절 R5): `Origin: https://evil.example` 로 `OPTIONS /api/news/all` 프리플라이트를 보내면 `200`, `access-control-allow-origin: https://evil.example`, `access-control-allow-credentials: true`, `access-control-allow-methods: DELETE, GET, ...`. `GET /api/briefing/settings` 응답에도 같은 헤더가 붙는다. 즉 사용자가 연 아무 웹 페이지의 스크립트가 `http://localhost:8000` 의 아래 엔드포인트를 호출하고 응답을 읽을 수 있다.
  - 열린 엔드포인트: `DELETE /api/news/all`(`news.py:96`), `POST /api/schedule/reset-and-collect`(`schedule.py:69`), `POST /api/schedule/trigger`(외부 수집 + 항목마다 LLM 비용), `PATCH|DELETE /api/sources/...`(`sources.py:77`, `:85`), `POST /api/sources/rss|github`, `POST /api/research/register-candidate`·`run-deep`, `POST /api/briefing/settings`(config.json 전체 재작성), `DELETE /api/chat/sessions/{id}`, `POST /api/briefing/test/email`(SEC-02).
  - 0.0.0.0 바인드라 같은 LAN 의 다른 기기도 직접 호출할 수 있다.
- **현재 코드**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
- **개선 제안 (Diff)**: CORS 를 설정 값으로 좁히고(이미 있는 `settings.CORS_ORIGINS` 를 실제로 읽는다, CFG-02), 상태를 바꾸는 엔드포인트에 관리 토큰 의존성을 건다. 브라우저 요청은 Next `rewrites` 같은 origin 프록시를 지나므로(ADR D08) CORS 를 좁혀도 화면은 깨지지 않는다. 예외인 기사 Ask AI SSE 직결(`:8000`)을 위해 프론트 origin 만 허용한다. 새 설정은 `config.py` 와 `.env.example`·`backend/.env.example` 에 함께 넣는다 (`.claude/rules/environment-standards.md`).
```diff
--- a/backend/app/config.py
-    CORS_ORIGINS: Any = ["*"]
+    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
+    ADMIN_TOKEN: str = ""  # 비면 쓰기 엔드포인트를 127.0.0.1 요청에만 허용한다
--- a/backend/app/main.py
 app.add_middleware(
     CORSMiddleware,
-    allow_origins=["*"],
-    allow_credentials=True,
-    allow_methods=["*"],
-    allow_headers=["*"],
+    allow_origins=settings.CORS_ORIGINS,
+    allow_credentials=False,
+    allow_methods=["GET", "POST", "PATCH", "DELETE"],
+    allow_headers=["Content-Type", "X-AgentLens-Token"],
 )
+++ b/backend/app/api/deps.py
+import secrets
+from fastapi import Header, HTTPException, Request
+from app.config import settings
+
+async def require_admin(request: Request, x_agentlens_token: str | None = Header(default=None)):
+    if settings.ADMIN_TOKEN:
+        if not x_agentlens_token or not secrets.compare_digest(x_agentlens_token, settings.ADMIN_TOKEN):
+            raise HTTPException(status_code=401, detail="관리 토큰이 필요합니다.")
+    elif request.client is None or request.client.host not in ("127.0.0.1", "::1"):
+        raise HTTPException(status_code=403, detail="로컬에서만 허용됩니다.")
--- a/backend/app/api/news.py
-@router.delete("/all")
+@router.delete("/all", dependencies=[Depends(require_admin)])
```
  같은 `dependencies=[Depends(require_admin)]` 를 `schedule.py` 의 `trigger`·`reset-and-collect`, `sources.py` 의 쓰기 4개, `research.py` 의 `register-candidate`·`run-deep`, `briefing.py` 의 `settings` POST·`test/*`·`export/notion`·`send/email`, `webhook.py` 2개에 단다. 기본 바인드는 `127.0.0.1` 로 바꾸고 LAN 공개는 명시 옵트인으로 한다 (`scripts/dev.sh`, Docker 는 `ports: "127.0.0.1:8000:8000"`; devops-engineer 범위). Docker 에서는 프론트 컨테이너가 다른 IP 로 들어오므로 `ADMIN_TOKEN` 을 프록시 헤더로 넘기는 방식이 필요하다 (contract-integrator 와 frontend 변경 동반).

### [범위 밖 (수용된 위험)] SEC-02 `POST /api/briefing/test/email` 이 저장된 SMTP 비밀번호를 호출자가 고른 서버로 보낸다
- **위치**: `backend/app/services/email_service.py:190-195`, `:166-167`; `backend/app/api/briefing.py:102-114`
- **근거**: 호스트·계정은 요청 값이고 비밀번호는 비어 있으면 저장 값으로 채운다. 이어서 `_send_sync` 가 그 호스트에 `server.login(user, password)` 를 한다. `use_tls=False` 를 주면 평문 AUTH 다. SEC-01 과 겹치면 아무 웹 페이지가 `{"smtp_host": "attacker.example", "smtp_user": "x", "use_tls": false, "to_email": "a@b.c"}` 만 보내 저장된 SMTP 비밀번호를 가져갈 수 있다 (코드상 판단, 외부 서버로 실행하지 않았다).
- **현재 코드**:
```python
h = (host or settings.SMTP_HOST).strip()
p = port or settings.SMTP_PORT
u = (user or settings.SMTP_USER).strip()
pw = (password or settings.SMTP_PASSWORD).strip()
```
- **개선 제안 (Diff)**: 저장 비밀번호는 저장된 호스트·포트·계정과 같을 때만 쓴다. 화면이 비밀번호를 비워 보내는 흐름(`frontend/src/lib/api.ts:553-557`)은 그대로 동작한다.
```diff
         h = (host or settings.SMTP_HOST).strip()
         p = port or settings.SMTP_PORT
         u = (user or settings.SMTP_USER).strip()
-        pw = (password or settings.SMTP_PASSWORD).strip()
+        same_target = (
+            h == settings.SMTP_HOST.strip()
+            and p == settings.SMTP_PORT
+            and u == settings.SMTP_USER.strip()
+        )
+        pw = (password or (settings.SMTP_PASSWORD if same_target else "")).strip()
```

### [범위 밖 (수용된 위험)] SEC-04 `GET /api/briefing/settings` 가 웹훅 URL 을 그대로, Notion 토큰 앞뒤 4자를 돌려준다
- **위치**: `backend/app/api/briefing.py:125-128`, `:153-155`
- **근거**: Slack/Discord 웹훅 URL 은 URL 자체가 쓰기 권한이다. 재현 R5 에서 다른 origin 응답에 `webhooks.slack_webhook_url` 키가 그대로 실렸다 (값은 비어 있는 상태로 확인). Notion 토큰은 `k[:4] + "..." + k[-4:]` 로 8자를 드러낸다.
- **개선 제안 (Diff)**:
```diff
-        masked_notion_key = k[:4] + "..." + k[-4:] if len(k) > 8 else "***"
+        masked_notion_key = "***"
 ...
-            "slack_webhook_url": webhooks.get("slack_webhook_url", ""),
-            "discord_webhook_url": webhooks.get("discord_webhook_url", ""),
+            "has_slack_webhook": bool(webhooks.get("slack_webhook_url")),
+            "has_discord_webhook": bool(webhooks.get("discord_webhook_url")),
```
  응답 필드가 바뀌므로 `frontend/src/lib/api.ts`·MSW·계약 테스트를 같은 작업에서 맞춘다 (`.claude/rules/contract-sync.md`).

### [범위 밖 (수용된 위험)] SEC-05 호출자가 정한 주소로 서버가 요청한다 (SSRF)
- **위치**: `backend/app/api/webhook.py:19-43` → `backend/app/services/webhook_service.py:22-26`(임의 http(s) URL 로 POST, 실패 시 응답 본문 100자 반사), `backend/app/api/research.py:24-33` → `backend/app/services/source_researcher.py:179`, `:205`(임의 URL GET, 리다이렉트 따라감), `backend/app/api/briefing.py:102-114`(임의 SMTP 호스트·포트 접속)
- **근거**: URL 검사는 `startswith("http")` 뿐이다 (`webhook.py:21`, `:30`). 사설·루프백·링크로컬 주소(예: 클라우드 메타데이터 `169.254.169.254`)를 막지 않는다.
- **개선 제안 (Diff)**: 공용 검사 함수를 만들어 세 경로에서 쓴다.
```python
# app/services/url_guard.py
import ipaddress, socket
from urllib.parse import urlparse

def assert_public_http_url(url: str) -> None:
    u = urlparse(url)
    if u.scheme not in ("http", "https") or not u.hostname:
        raise ValueError("http(s) URL 만 허용합니다.")
    for info in socket.getaddrinfo(u.hostname, u.port or (443 if u.scheme == "https" else 80)):
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise ValueError("내부 주소로는 요청하지 않습니다.")
```
```diff
--- a/backend/app/services/webhook_service.py
-                return False, f"서버 응답 오류 (HTTP {res.status_code}): {res.text[:100]}"
+                return False, f"서버 응답 오류 (HTTP {res.status_code})"
```
  리다이렉트를 따라가는 클라이언트는 각 hop 마다 다시 검사한다 (`follow_redirects=False` 로 두고 직접 따라간다).

### [범위 밖 (수용된 위험)] SEC-06 비밀값을 git 이 추적하는 `config.json` 에 평문으로 쓴다
- **위치**: `backend/app/config.py:50`, `:57`, `:59`, `:80`, `:88`, `:99-100`(읽기), `:161-173`(쓰기), `backend/app/api/briefing.py:173-207`
- **근거**: `git ls-files config.json` 이 `config.json` 을 돌려준다. 지금 커밋된 파일의 키·비밀번호·웹훅 칸은 모두 비어 있다 (2026-11-09 확인). 화면에서 Notion 토큰·SMTP 비밀번호·웹훅 URL 을 저장하면 이 파일에 평문으로 들어가 다음 커밋에 섞일 수 있다. Docker 도 같은 루트 파일을 `:rw` 로 마운트한다 (ADR 3.2-3 결과).
- **개선 제안 (Diff)**: 비밀값은 git 제외 파일로 분리한다.
```diff
--- a/backend/app/config.py
+def find_secrets_json() -> Path:
+    return (find_config_json() or Path.cwd() / "config.json").with_name("config.secrets.json")
 ...
-def save_json_config(data: Dict[str, Any]) -> bool:
+SECRET_PATHS = [("briefing", "notion", "api_key"), ("briefing", "email", "smtp_password"),
+                ("webhooks", "slack_webhook_url"), ("webhooks", "discord_webhook_url"),
+                ("llm", "anthropic_api_key"), ("llm", "openai_api_key"), ("llm", "gemini_api_key")]
+def save_json_config(data: Dict[str, Any]) -> bool:
+    public, secrets = split_secrets(data, SECRET_PATHS)  # 비밀 경로 값을 public 에서 빼서 secrets 로
+    write_atomic(find_secrets_json(), secrets)            # BUG-21 의 원자적 쓰기
+    write_atomic(find_config_json() or Path.cwd() / "config.json", public)
--- a/.gitignore
+config.secrets.json
```

### [범위 밖 (수용된 위험)] BUG-01 브리핑 설정을 저장해도 재시작 전까지 옛 Notion·SMTP·웹훅 값으로 발송한다
- **위치**: `backend/app/config.py:153-157`, 원인 `:39-100`(기본값이 클래스 정의 때 한 번 평가됨), 소비처 `backend/app/services/notion_service.py:35`, `:218-219`, `backend/app/services/email_service.py:190-195`, `:233-240`, `backend/app/services/briefing_service.py:216`, `:228`, `:252-255`
- **근거**: 재현 R1. 임시 디렉터리의 `config.json` 으로 띄운 뒤 `save_json_config` 로 Notion 키·SMTP 호스트를 바꿨다.
```
before old-key old.host
save True
file {'briefing': {'notion': {'api_key': 'new-key'}, 'email': {'smtp_host': 'new.host'}}}
after old-key old.host {'notion': {'api_key': 'new-key'}, 'email': {'smtp_host': 'new.host'}}
```
  파일과 `raw_json_config` 는 새 값인데 `settings.NOTION_API_KEY`·`SMTP_HOST` 는 옛 값이다. `self.__init__()` 은 클래스 필드 기본값(import 때 평가한 `_json_data.get(...)` 결과)을 다시 쓴다. `merge_json_and_env` 는 LLM 키(빈 값일 때만)와 웹훅(빈 값일 때만)만 다시 읽는다 (`:108-142`). 그래서 GET 설정 화면은 새 값을 보여주고(`raw_json_config`) 실제 발송은 옛 값을 쓴다.
- **개선 제안 (Diff)**: JSON 경로 표를 하나 두고 기본값 계산과 reload 를 같은 표로 한다. 환경 변수 우선순위(env > json)는 유지한다.
```diff
+_JSON_FIELDS: Dict[str, tuple] = {
+    "NOTION_API_KEY": ("briefing", "notion", "api_key"),
+    "NOTION_PAGE_ID": ("briefing", "notion", "page_id"),
+    "NOTION_AUTO_EXPORT": ("briefing", "notion", "auto_export"),
+    "SMTP_HOST": ("briefing", "email", "smtp_host"),
+    "SMTP_PORT": ("briefing", "email", "smtp_port"),
+    "SMTP_USER": ("briefing", "email", "smtp_user"),
+    "SMTP_PASSWORD": ("briefing", "email", "smtp_password"),
+    "SMTP_FROM": ("briefing", "email", "smtp_from"),
+    "SMTP_TO": ("briefing", "email", "smtp_to"),
+    "SMTP_USE_TLS": ("briefing", "email", "use_tls"),
+    "EMAIL_AUTO_SEND": ("briefing", "email", "auto_send"),
+    "SLACK_WEBHOOK_URL": ("webhooks", "slack_webhook_url"),
+    "DISCORD_WEBHOOK_URL": ("webhooks", "discord_webhook_url"),
+    # ... 나머지 필드도 같은 표로 옮긴다
+}
+
+def _dig(data, path):
+    for key in path:
+        if not isinstance(data, dict) or key not in data:
+            return None
+        data = data[key]
+    return data
 ...
     def reload(self):
         """Reloads settings from disk."""
         global _json_data
         _json_data = load_json_config()
-        self.__init__()
+        for field, path in _JSON_FIELDS.items():
+            if field in os.environ:  # 환경 변수가 이긴다
+                continue
+            value = _dig(_json_data, path)
+            if value is not None:
+                current = getattr(self, field)
+                setattr(self, field, type(current)(value) if current is not None else value)
```
  고치기로 하면 회귀 테스트: 세션 사본 `config.json` 에 저장 → `settings.SMTP_HOST`·`NOTION_API_KEY` 가 새 값인지 단언 (지금은 범위 밖이라 TEST-01 에 넣지 않았다).

---

## 10. 재리뷰 (2026-11-09, Cycle 6 수정분)

- **대상**: 작업 트리(커밋 전) `git diff -- backend/` 의 `backend/app/api/chat.py`, `backend/app/api/sources.py`, `backend/app/services/chat_session_service.py`, `backend/app/services/deep_researcher.py`, `backend/app/services/llm_processor.py`, `backend/app/services/llm_providers/anthropic_provider.py`, `backend/tests/llm_fakes.py`, 새 `backend/tests/test_code_review_fixes.py`(18개). BUG-02 판단을 위해 frontend FE-02 변경(`frontend/src/components/chat/ChatWorkspace.tsx`)과 `frontend/src/components/chat/useChatSessions.ts`, `frontend/src/lib/api.ts` 를 읽었다 (frontend 리뷰는 frontend-code-reviewer 범위).
- **방법**: diff 를 줄 단위로 읽고, 남은 쟁점은 스크래치 스크립트로 재현했다 (R10, 임시 DB, 저장소 파일을 쓰지 않음). `make check` 를 직접 돌렸다. 작업 트리 전체를 바꾸는 git 명령(stash·checkout·reset)은 쓰지 않았다.
- **Red→Green**: `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md` Cycle 6 에 `--phase red -- tests/test_code_review_fixes.py` → `16 failed, 2 passed`, 결함별 `--phase green` 기록이 있다. 먼저 통과한 2개는 기존 동작을 지키는 가드 테스트(`test_toggle_unknown_repo_still_404`, `test_ask_stream_failure_before_tokens_still_falls_back`)로 보인다 (이름과 내용으로 판단).
- 줄 번호는 이 절에서는 지금 작업 트리 기준이다.

### 10.1 건별 확인 결과

| ID | 결과 | 근거 |
|---|---|---|
| BUG-02 | **일부 해결** | 해결: `append_messages_batch` 가 이미 있는 id 를 건너뛴다 (`backend/app/services/chat_session_service.py:328-337`, `:376`). `get_session_detail` 이 `populate_existing=True` 로 DB 의 지금 상태를 읽는다 (`:107`). 테스트 `test_session_upsert_with_existing_message_ids_is_idempotent` 가 같은 id 재동기화 3회 → 201·메시지 4개·응답이 DB 와 같음을 단언한다. 미해결: 서버와 프론트가 같은 턴을 **다른 id** 로 저장하는 이중 저장 (10.2, BUG-02R) |
| BUG-03 | 해결 | `run_deep_research` 가 `try/finally` 로 `is_running` 을 되돌린다 (`backend/app/services/deep_researcher.py:388-393`, 본문은 `_run_cycle` `:395-`). `test_deep_research_resets_running_flag_on_error` 가 예외 뒤 `is_running is False` 와 다음 실행 성공을 단언한다. 남은 것: N-02 |
| BUG-04 | 해결 | 발굴 후보를 시드보다 앞에 둔다 (`deep_researcher.py:403-419`). `test_deep_research_evaluates_mined_candidates` 가 발굴 URL 2개가 평가 목록에 들고 컷 6 이 유지됨을 단언한다. 남은 것: N-04 |
| BUG-05 | 해결 | `{item_id:path}` (`backend/app/api/sources.py:77`, `:85`). 테스트 3개: `owner%2Frepo` 토글·삭제 200, URL id RSS 토글 200, 없는 저장소는 라우트 일치 404 `{"detail":"Source not found or invalid type"}`. 이 테스트들은 `sources.json` 에 쓰는데, `make check` 전후 루트 `sources.json`·`backend/app/config/sources.json`·`config.json` md5 가 같았다 (세션 사본에 쓴다) |
| BUG-06 | 해결 (`/api/chat/stream`) | dict 아닌 본문 → 400 `ERR_INVALID_PAYLOAD` (`backend/app/api/chat.py:292-300`), `ChatStreamRequest` 검증을 스트림 전에 하고 `model_tier` 오류 → 400 `ERR_INVALID_MODEL_TIER`, 그 밖 → 400 `ERR_INVALID_PAYLOAD` (`:334-344`). 테스트 3개. 같은 결함이 `/api/chat/query`·`/api/chat/search` 에는 남는다: N-03 |
| BUG-07 | 해결 | Anthropic·OpenAI 스트림이 토큰을 보낸 뒤 실패하면 다음 엔진으로 넘어가지 않고 `done`·캐시 없이 끝낸다 (`backend/app/services/llm_processor.py:917-919`, `:950-951`). 테스트 3개 (Anthropic 부분 실패, OpenAI 부분 실패, 토큰 전 실패는 기존처럼 폴백). 남은 것: N-01 (끝을 알리는 `error` 이벤트가 없다) |
| BUG-08 | 해결 (스트림) | `message_delta.delta.stop_reason` 을 모으고(`backend/app/services/llm_providers/anthropic_provider.py:322`), `error` 이벤트는 `overloaded_error` → `AnthropicOverloadedException`, 그 밖 → `AnthropicStreamError` (`:323-328`), `stop_reason == "max_tokens"` 면 스트림 끝에 `AnthropicStreamError` (`:333-334`). 챗 스트림에서는 `stream_tokens` 의 `token_yielded` 분기가 `LLMStreamFailedException` 으로 바꾸고 `chat_service.stream_chat` 이 `error` 이벤트 `ERR_LLM_STREAM_FAILED` 를 보낸 뒤 저장하지 않는다. 테스트 6개 (provider 3, 챗 스트림 e2e 3: max_tokens·error 이벤트 → `error` 로 끝·저장 0건, end_turn → `done`·저장 2건). 비스트림 경로는 N-05 |
| TEST-01 | 해결 (BUG-02R 제외) | 위 7건 회귀 테스트 18개가 있다. 흉내 Claude 에 `claude_stream_stop_reason`·`claude_stream_error` 를 더했다 (`backend/tests/llm_fakes.py` diff). 단언이 구체적이다 (상태 코드·`error_code`·이벤트 순서·저장 건수·캐시 비움). BUG-02R(서버 저장 + 프론트 저장) 시나리오 테스트는 없다 |

### 10.2 [머지 전 필수 → 2차에서 해결, 10.8.1] BUG-02R 서버와 프론트가 같은 턴을 다른 id 로 한 번씩 저장한다

- **위치**: 서버 저장 `backend/app/services/chat_service.py:804`(`done` 을 보낸 뒤) `:806-822`(`persist_turn`, `append_messages_batch` 가 `id` 없는 메시지에 `uuid4()`), 프론트 저장 `frontend/src/components/chat/ChatWorkspace.tsx:309-318`(`saveTurn`, 턴마다 1번), `:445`, `:449`(완료·중단 때), 클라이언트 id `:264-265`(`msg-user-…`, `msg-asst-…`), 스트림 요청 본문 `:341-350`(메시지 id 를 보내지 않음), 세션 열기 `frontend/src/components/chat/useChatSessions.ts:136-146`(서버 상세를 먼저 읽고 로컬 캐시를 덮어쓴다)
- **근거**: 재현 R10 — 지금 작업 트리 코드로, 턴마다 `persist_turn`(스트림 저장) → 그 턴까지의 전체 메시지를 클라이언트 id 로 `POST /api/chat/sessions`(FE-02 의 `saveTurn`)를 두 턴 반복했다.
```
turn1 sync 201 messages 4
turn2 sync 201 messages 8
detail 200 ['q1', 'a1', 'q1', 'a1', 'q2', 'a2', 'q2', 'a2']
summary message_count [8]
```
  BUG-02 수정으로 500 은 사라졌지만 id 가 서로 달라 중복 건너뛰기에 걸리지 않는다. 사용자가 사이드바에서 세션을 열면 서버 상세를 읽으므로(`useChatSessions.ts:136`) 모든 질문·답이 두 번씩 보이고, 목록의 메시지 수도 두 배다. 같은 `created_at` 끼리의 순서도 보장되지 않는다(`chat_session_service.py` 가 한 배치에 같은 `now` 를 쓴다).
- **필수 판단 이유**: 주 기능(AI 챗)의 저장 데이터가 매 턴 틀리고 화면에 그대로 보인다. 데이터가 계속 쌓이므로 출시 뒤 정리 비용도 생긴다. 최초 감사의 BUG-02 지적("챗 턴 이중 저장")의 남은 절반이다.
- **가장 단순한 수정 방향 (권고)**: 프론트가 이미 만드는 메시지 id 를 스트림 요청에 실어 보내고, 서버 `persist_turn` 이 그 id 로 저장한다. 그러면 서버 저장과 프론트 POST 가 같은 id 를 쓰고, 이번에 넣은 "이미 있는 id 건너뛰기"(`chat_session_service.py:328-337`)가 둘째 쓰기를 무시한다. 순서가 어느 쪽이든, 동시에 와도 PK 가 한 벌만 남게 보장한다. 저장 주체를 둘 다 유지하므로 기존 테스트(`test_chat_stream_end_turn_still_completes` 의 저장 2건)와 중단 턴 저장(FE-02) 동작이 바뀌지 않는다.
```diff
--- a/backend/app/schemas/chat.py   (ChatStreamRequest)
     session_id: Optional[str] = None
+    user_message_id: Optional[str] = Field(None, min_length=1, max_length=36)
+    assistant_message_id: Optional[str] = Field(None, min_length=1, max_length=36)
--- a/backend/app/services/chat_session_service.py   (persist_turn)
     async def persist_turn(
         self,
         session_id: str,
         user_content: str,
         assistant_content: str,
+        user_message_id: Optional[str] = None,
+        assistant_message_id: Optional[str] = None,
 ...
-                {"role": "user", "content": user_content, "status": "completed"},
+                {"id": user_message_id, "role": "user", "content": user_content, "status": "completed"},
                 {
+                    "id": assistant_message_id,
                     "role": "assistant",
--- a/backend/app/services/chat_service.py   (stream_chat)
-        yield f"event: done\ndata: {done_payload}\n\n"
-
-        # Auto-persist turn (user question + assistant response) to DB
-        try:
-            await self.session_service.persist_turn(
-                session_id=session_id,
+        # done 을 보내기 전에 저장해 프론트의 세션 POST 와 경합하지 않게 한다
+        try:
+            await self.session_service.persist_turn(
+                session_id=session_id,
+                user_message_id=req.user_message_id,
+                assistant_message_id=req.assistant_message_id,
 ...
         except Exception as pe:
             logger.error(f"Failed to auto-persist turn to DB for session {session_id}: {pe}")
+        yield f"event: done\ndata: {done_payload}\n\n"
--- a/frontend/src/components/chat/ChatWorkspace.tsx   (스트림 요청 본문)
             session_id: sessionId,
+            user_message_id: userMsgId,
+            assistant_message_id: assistantMsgId,
```
  - 계약 변경(요청 필드 2개 추가, 선택 필드라 하위 호환)이므로 contract-integrator 가 zod `ChatStreamRequestSchema`·MSW 핸들러·계약 테스트·`docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` 를 같은 작업에서 맞춘다.
  - 회귀 테스트: 스트림을 `user_message_id`·`assistant_message_id` 와 함께 보낸 뒤 같은 id 로 세션 POST → 세션 상세 메시지 2개, `message_count` 2. 두 번째 턴까지 반복해 4개.
  - `done` 앞으로 저장을 옮기면 저장 시간만큼 `done` 이 늦어진다 (SQLite INSERT 2건 + FIFO 검사, 측정하지 않음).
- **대안 (줄 수는 더 적지만 권하지 않음)**: 스트림의 서버 저장(`chat_service.py:806-822`)을 지우고 프론트 POST 하나만 저장 주체로 둔다. 계약 변경이 없지만 (1) 방금 추가된 테스트 `test_chat_stream_end_turn_still_completes` 의 "저장 2건" 기대를 바꿔야 하고, (2) 세션 POST 경로는 `model_tier`·`usage` 를 저장하지 않으며(`chat_session_service.py` `create_or_upsert_session` 의 `msg_dicts`, CT-004), (3) 프론트 POST 가 실패하면(`useChatSessions.ts:234-245` 가 `catch {}`) 턴이 서버에 남지 않는다.

### 10.3 새로 생긴 문제·남은 문제 (모두 권장)

#### [권장] N-01 기사 Ask AI 스트림이 도중 실패·`max_tokens` 때 아무 신호 없이 끝나, 프론트가 잘린 답을 완료로 보인다
- **위치**: `backend/app/services/llm_processor.py:917-919`, `:950-951`(`return` 만 함), `backend/app/services/llm_providers/anthropic_provider.py:333-334`(`max_tokens` 도 같은 경로), 프론트 `frontend/src/lib/api.ts:135-167`(`done` 을 받지 않아도 반복이 끝나면 받은 글자를 답으로 돌려준다)
- **근거**: 섞임·캐시 문제는 고쳐졌다(BUG-07). 하지만 끝을 알리는 이벤트가 없어, 부분 답이 정상 답처럼 화면에 남는다. 챗 스트림은 같은 상황에서 `error` 이벤트를 보낸다(BUG-08 해결 경로). 최초 감사의 BUG-07 수정 제안은 `error` 이벤트를 보내는 것이었다.
- **개선 제안 (Diff)**:
```diff
                 if full_text:
-                    # 이미 토큰을 보냈으면 다른 엔진 답을 이어 붙이지 않고, done·캐시 없이 끝낸다
-                    return
+                    yield {"event": "error", "message": "답변 생성이 중간에 끊겼습니다. 다시 시도해 주세요.", "retryable": True}
+                    return
--- a/frontend/src/lib/api.ts   (askQuestionAboutNewsStream)
+          } else if (payload.event === 'error') {
+            throw new Error(payload.message || '답변 생성이 중간에 끊겼습니다.');
```
  `/ask/stream` 이벤트 계약에 `error` 를 더하는 것이므로 contract-integrator 와 frontend 가 함께 고친다.

#### [권장] N-02 딥 리서치 예외가 이제 호출자로 올라가는데 `run-deep` 태스크 참조를 보관하지 않는다
- **위치**: `backend/app/services/deep_researcher.py:388-393`(예외를 다시 던진다, 테스트도 이를 단언), `backend/app/api/research.py:87`(`asyncio.create_task(...)` 결과를 버린다), `backend/app/scheduler.py:15-18`
- **근거**: 플래그 고착은 해결됐다. 남은 것은 최초 감사 BUG-03 diff 의 둘째 부분이다. 태스크 예외는 "Task exception was never retrieved" 로만 남고, `last_run_summary` 에 실패가 기록되지 않아 `GET /api/research/status` 로 볼 수 없다. 참조 없는 태스크는 실행 중 GC 될 수 있다 (Python `asyncio.create_task` 문서의 주의 사항).
- **개선 제안 (Diff)**:
```diff
+_background_tasks: set = set()
 ...
-    asyncio.create_task(deep_researcher.run_deep_research(max_candidates=max_candidates))
+    task = asyncio.create_task(deep_researcher.run_deep_research(max_candidates=max_candidates))
+    _background_tasks.add(task)
+    task.add_done_callback(_background_tasks.discard)
--- a/backend/app/services/deep_researcher.py
         try:
             return await self._run_cycle(max_candidates)
+        except Exception as e:
+            self.last_run_summary = {"status": "error", "error": type(e).__name__,
+                                     "completed_at": datetime.now(timezone.utc).isoformat()}
+            raise
         finally:
```

#### [권장] N-03 `/api/chat/query`·`/api/chat/search` 는 검증 실패가 여전히 500 이다
- **위치**: `backend/app/api/chat.py:129-174`(`/query`: dict 검사 없음, `ChatQueryRequest(**body)` 실패가 `ERR_SERVER_INTERNAL` 500), `:89-95`(`/search`: `ChatFocusFilter` 리터럴 오류가 `ERR_RETRIEVER_INDEX_ERROR` 500)
- **근거**: 재현 R10 — `POST /api/chat/query` 본문 `["x"]` → 500, `{"question":"hi","model_tier":"ultra"}` → 500 `ERR_SERVER_INTERNAL`. 최초 감사 BUG-06 근거에 함께 적었던 경로다. 화면은 두 경로를 부르지 않으므로(CC-02) 권장으로 둔다.
- **개선 제안 (Diff)**: `/stream` 에 넣은 검사(`chat.py:292-300`, `:334-344`)를 함수로 빼서 `/query` 에도 쓴다.
```diff
+def _parse_chat_request(body, model):
+    if not isinstance(body, dict):
+        return None, error_response(400, "ERR_INVALID_PAYLOAD", "요청 본문은 JSON 객체여야 합니다.")
+    try:
+        return model(**body), None
+    except ValidationError as e:
+        code = "ERR_INVALID_MODEL_TIER" if any(err["loc"][:1] == ("model_tier",) for err in e.errors()) else "ERR_INVALID_PAYLOAD"
+        return None, error_response(400, code, "요청 필드 형식이 올바르지 않습니다.")
```

#### [권장] N-04 딥 리서치 후보 순서: 발굴 후보가 많으면 시드가 평가되지 않고, 이미 등록된 소스·컷 범위를 거르지 않는다
- **위치**: `backend/app/services/deep_researcher.py:403-419`, `backend/app/api/research.py:78`(`max_candidates: int = 6`, 범위 없음)
- **근거**: 순서를 뒤집어 BUG-04 는 해결됐지만, 발굴 URL 이 컷보다 많으면 이번에는 시드가 영영 평가되지 않는다. 이미 `sources.json` 에 있는 주소도 다시 탐침한다. 최초 감사 BUG-04 diff 의 거름(`monitored`)과 `Query(6, ge=1, le=20)` 은 반영되지 않았다.
- **개선 제안 (Diff)**:
```diff
-        eval_queue = candidates_pool[:max_candidates]
+        monitored = {f.get("url", "").rstrip("/") for f in sources_service.get_all_sources().get("rss_feeds", [])}
+        pool = [c for c in candidates_pool if c["target_url"].rstrip("/") not in monitored]
+        mined, seeds = pool[:len(mined_urls)], pool[len(mined_urls):]
+        # 발굴과 시드를 번갈아 채워 어느 쪽도 굶지 않게 한다
+        eval_queue = [c for pair in itertools.zip_longest(mined, seeds) for c in pair if c][:max_candidates]
```

#### [권장] N-05 비스트림 Anthropic 경로는 `stop_reason` 을 여전히 보지 않는다
- **위치**: `backend/app/services/llm_providers/anthropic_provider.py:213-249`(`generate_text_with_usage`), 사용처 `backend/app/services/llm_processor.py:367-372`(`/api/chat/query`, ReAct planner, 수집 평가)
- **근거**: BUG-08 은 스트림을 대상으로 했고 스트림은 고쳐졌다. 비스트림 응답이 `max_tokens` 로 잘리면 `/query` 답이 잘린 채 성공으로 나가고, 수집 평가 JSON 이 잘리면 파싱 실패로 규칙 폴백(BUG-10 의 캐시)으로 간다.
- **개선 제안 (Diff)**:
```diff
             data = res.json()
+            if data.get("stop_reason") == "max_tokens":
+                logger.warning("Anthropic non-stream response truncated (max_tokens)")
+                raise AnthropicStreamError("Anthropic 답이 max_tokens 에서 잘렸습니다 (비스트림).")
```

### 10.4 재리뷰 뒤 지적 수

| 심각도 | 개수 | ID |
|---|---|---|
| 머지 전 필수 | 1 | BUG-02R (회귀 테스트 포함) |
| 해결 | 7 | BUG-03, BUG-04, BUG-05, BUG-06(`/stream`), BUG-07, BUG-08(스트림), TEST-01(BUG-02R 제외). BUG-02 는 일부 해결 → BUG-02R 로 이어짐 |
| 권장 | 48 | 최초 43건 + 새 N-01~N-05 |
| 범위 밖 (수용된 위험) | 6 | SEC-01, SEC-02, SEC-04, SEC-05, SEC-06, BUG-01 (9절, 이번 diff 로 바뀌지 않음) |

### 10.5 `make check` (재리뷰)

- 실행: 2026-11-09, 저장소 루트, 이 검토자가 직접 실행. 종료 코드 **0**.
- backend: `235 passed in 12.65s` (Cycle 6 의 18개 포함, `test_code_review_fixes.py` PASSED 18줄 확인).
- frontend: `Test Files  54 passed (54)`, `Tests  654 passed (654)`, eslint `✖ 40 problems (0 errors, 40 warnings)`, `tsc --noEmit` 출력 없음(통과).
- 실행 전후 `git status --short` 같음. 루트 `sources.json`, `backend/app/config/sources.json`, `config.json` md5 가 실행 전후 같다 (BUG-05 테스트의 쓰기는 세션 사본으로 간다).

### 10.6 재현 R10

2026-11-09, 지금 작업 트리 코드, `backend/` 에서 `../.venv/bin/python -I` + 스크래치 스크립트, 임시 SQLite, `httpx.ASGITransport` (lifespan 없음).

| 절차 | 결과 |
|---|---|
| 턴마다 `ChatSessionService.persist_turn(qN, aN)` → 그 턴까지의 전체 메시지를 새 클라이언트 id 로 `POST /api/chat/sessions`, 두 턴 반복 → `GET /api/chat/sessions/{id}`, `GET /api/chat/sessions` | `turn1 sync 201 messages 4`, `turn2 sync 201 messages 8`, 상세 `['q1','a1','q1','a1','q2','a2','q2','a2']`, `message_count` 8 |
| `POST /api/chat/query` 본문 `["x"]` | 500 (전역 처리기) |
| `POST /api/chat/query {"question":"hi","model_tier":"ultra"}` | 500 `ERR_SERVER_INTERNAL` |

### 10.7 재리뷰 1차 판정 (2차에서 갱신, 10.8.6)

- **판정 결과**: **REQUEST_CHANGES**
- **근거**: 필수 결함 7건과 TEST-01 은 테스트와 함께 해결됐고 새 회귀는 찾지 못했다. 남은 필수는 BUG-02R 하나다. 이중 저장은 매 턴 쌓이고, 세션을 열면 사용자에게 보인다(재현). 10.2 의 방향(클라이언트 메시지 id 를 스트림 요청에 싣고 서버가 그 id 로 저장, 저장을 `done` 앞으로)으로 고치고 회귀 테스트를 더하면 APPROVED 로 바꿀 수 있다. N-01~N-05 는 권장이다. N-01 은 BUG-02R 와 같은 계약 작업에 묶으면 비용이 적다.
- 수용된 위험 6건(9절)은 이번에도 판정 근거로 쓰지 않았다.

### 10.8 재리뷰 2차 (2026-11-09, BUG-02R 수정분)

- **대상**: 작업 트리(커밋 전). backend `backend/app/schemas/chat.py`(`ChatStreamRequest` 에 `user_message_id`·`assistant_message_id`), `backend/app/services/chat_service.py`(저장을 `done` 앞으로), `backend/app/services/chat_session_service.py`(`persist_turn` 이 받은 id 로 저장), `backend/tests/test_code_review_fixes.py`(+9, 27개). frontend `frontend/src/components/chat/ChatWorkspace.tsx`(스트림 요청에 두 id). 계약 `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` 8.1. 변경 요약은 오케스트레이터가 준 스크래치 문서 `code-changes-v041.md`.
- **방법**: diff 를 읽고, 1차 재현 스크립트(R10)를 클라이언트 id 를 싣는 방식으로 바꿔 다시 돌렸다(R11). `make check` 를 직접 돌렸다. 코드는 고치지 않았고 stash·checkout·reset 은 쓰지 않았다.

#### 10.8.1 BUG-02R 확인: 해결

| 확인 항목 | 결과 | 근거 |
|---|---|---|
| 요청 계약 | 맞음 | `ChatStreamRequest` 에만 두 선택 필드, 1~36자, 둘 다 있으면 달라야 함 (`backend/app/schemas/chat.py:39-45`). 계약 8.1 의 정의와 같다. 위반은 1차에서 고친 `/stream` 검증 경로(`backend/app/api/chat.py:334-344`)를 타서 400 `ERR_INVALID_PAYLOAD`. `ChatQueryRequest` 는 바뀌지 않았다 (계약 8.1 과 같음) |
| 서버 저장 id | 맞음 | `persist_turn` 이 받은 id 를 메시지 dict 의 `id` 로 넘기고 없으면 `append_messages_batch` 가 `uuid4()` (`backend/app/services/chat_session_service.py:384-425`, `:407`, `:409`). 이미 있는 id 를 건너뛴 자리는 `None` 으로 돌려준다 (`:424-425`, 1차의 `created[1]` IndexError 가능성 제거) |
| 저장 시점 | 맞음 | `persist_turn` (`backend/app/services/chat_service.py:807`) 이 `event: done` (`:825`) 보다 먼저. 저장이 실패해도 로그만 남기고 `done` 을 보낸다. 프론트 POST 는 `done` 을 받은 뒤라 서버 저장과 겹치지 않는다 |
| 프론트 | 맞음 | 스트림 요청 본문에 `user_message_id: userMsgId`, `assistant_message_id: assistantMsgId` (`frontend/src/components/chat/ChatWorkspace.tsx:352-353`), `saveTurn`(`:309-`)도 같은 id 의 메시지를 보낸다 |
| 재현 R11 (정상 순서, 두 턴) | 한 벌 | `A turn1 sync 201 messages 2`, `A turn2 sync 201 messages 4`, 상세 `['q1','a1','q2','a2']`, `message_count` 4. 1차 R10 은 같은 절차로 8개였다 |
| 재현 R11 (역순: 프론트 POST 먼저) | 한 벌 | 서버 `persist_turn` 이 `(None, None)` 을 돌려주고 상세 `['q1','a1']` |
| 재현 R11 (id 없는 옛 클라이언트) | 하위 호환 | 서버 UUID(36자) 2개로 저장. 옛 클라이언트가 세션 POST 도 따로 보내면 여전히 두 벌이 되지만, 지금 프론트는 id 를 보내므로 해당 없음 |
| 회귀 테스트 | 있음 | 9개: 스트림+세션 POST 두 턴 = 메시지 4·`message_count` 4, 역순 POST 먼저 → `done`·2개, `persist_turn` 재호출 `(None, None)`, `done` 시점에 이미 2개 저장, 잘못된 id 4가지 → 400 `ERR_INVALID_PAYLOAD`·`details` null, null·36자 경계 허용. e2e 테스트는 실제 `/api/chat/stream` 을 흉내 Claude 로 돌린다 |

#### 10.8.2 새로 확인한 문제 (권장)

##### [권장] N-06 다른 세션에 이미 있는 메시지 id 를 받으면 그 메시지를 말없이 버린다
- **위치**: `backend/app/services/chat_session_service.py:328-337` (`ChatMessageModel.id.in_(incoming_ids)` 를 세션 구분 없이 조회)
- **근거**: 재현 R11-D — 세션 A 에 저장된 user 메시지 id 를 세션 B 의 스트림 저장에 쓰면 `persist_turn` 의 user 자리가 `None` 이고 세션 B 상세에는 `['a-other']` 만 남는다 (질문이 빠짐). 오류도 로그도 없다. 지금 프론트 id 는 접두 + 무작위 7자(36^7 가지, `ChatWorkspace.tsx:264-265`)라 우연한 충돌 가능성은 매우 낮다. 그러나 id 를 클라이언트가 정하게 된 이상, 다른 세션 id 와 겹치는 요청은 거부하거나 기록해야 데이터가 조용히 사라지지 않는다. 변경 요약 문서도 이것을 알려진 문제로 적었다.
- **개선 제안 (Diff)**:
```diff
-            existing_ids = set((await self.session.execute(
-                select(ChatMessageModel.id).where(ChatMessageModel.id.in_(incoming_ids))
-            )).scalars())
+            rows = (await self.session.execute(
+                select(ChatMessageModel.id, ChatMessageModel.session_id).where(ChatMessageModel.id.in_(incoming_ids))
+            )).all()
+            foreign = [mid for mid, owner in rows if owner != session_id]
+            if foreign:
+                logger.warning(f"message ids already used by another session: {foreign}")
+                raise InvalidSessionUUIDException("다른 세션에서 이미 쓰는 메시지 id 입니다.")
+            existing_ids = {mid for mid, _ in rows}
```
  스트림 저장 경로에서는 예외를 로그로만 남기므로(`chat_service.py` 의 `persist_turn` try), 프론트 id 를 `crypto.randomUUID()` 로 바꾸는 것(frontend)이 더 근본적이다.

##### [권장] N-07 한 턴의 질문과 답이 같은 `created_at` 이라 순서가 정렬로 보장되지 않는다
- **위치**: `backend/app/services/chat_session_service.py` `append_messages_batch` 의 `now`(배치 전체에 하나), 관계 정렬 `backend/app/models/chat_session.py:28`(`order_by="ChatMessageModel.created_at.asc()"`)
- **근거**: 1차부터 있던 동작이다. id 를 클라이언트가 정해도 정렬 키는 `created_at` 하나라, 같은 값끼리의 순서는 SQLite 정렬이 보장하지 않는다. 재현에서는 질문 → 답 순서로 나왔다 (보장 아님, 코드상 판단).
- **개선 제안 (Diff)**:
```diff
-        for m in messages:
+        for offset, m in enumerate(messages):
 ...
-                created_at=now,
+                created_at=now + timedelta(microseconds=offset),
```

#### 10.8.3 `make check` (재리뷰 2차)

- 실행: 2026-11-09, 저장소 루트, 이 검토자가 직접 실행. 종료 코드 **0**.
- backend: `244 passed in 13.91s` (`test_code_review_fixes.py` PASSED 27줄 확인).
- frontend: `Test Files  54 passed (54)`, `Tests  664 passed (664)`, eslint `✖ 40 problems (0 errors, 40 warnings)`, `tsc --noEmit` 출력 없음(통과).
- 실행 전후 `git status --short` 같음. 루트 `sources.json`, `backend/app/config/sources.json`, `config.json` md5 가 실행 전후 같다.

#### 10.8.4 재현 R11

2026-11-09, 지금 작업 트리 코드, `backend/` 에서 `../.venv/bin/python -I` + 스크래치 스크립트(`repro/dup3.py`), 임시 SQLite, `httpx.ASGITransport` (lifespan 없음). 서버 저장은 `ChatStreamRequest` 로 id 를 검증한 뒤 `ChatSessionService.persist_turn(..., user_message_id, assistant_message_id)` 를 불러 흉내 냈다 (`/api/chat/stream` 은 테스트 밖에서 LLM 키가 없어 503 이므로. 실제 스트림 경로는 위 e2e 테스트가 덮는다). 클라이언트 id 는 `msg-user-`/`msg-asst-` + 무작위 7자.

| ID | 절차 | 결과 |
|---|---|---|
| R11-A | 턴마다 서버 저장(클라이언트 id) → 같은 id 로 그 턴까지의 전체 메시지 세션 POST, 두 턴 | `turn1 201 messages 2`, `turn2 201 messages 4`, 상세 `['q1','a1','q2','a2']`, `message_count` 4 |
| R11-B | 세션 POST 먼저 → 같은 id 로 서버 저장 | 서버 저장 `(None, None)`, 상세 `['q1','a1']` |
| R11-C | id 없이 서버 저장 | 메시지 2개, id 길이 36 (uuid4) |
| R11-D | 세션 A 의 user 메시지 id 로 세션 B 서버 저장 | user 자리 `None`, 세션 B 상세 `['a-other']` (N-06) |

#### 10.8.5 재리뷰 2차 지적 수

| 심각도 | 개수 | ID |
|---|---|---|
| 머지 전 필수 | 0 | — |
| 해결 | 8 | BUG-02(BUG-02R 포함), BUG-03, BUG-04, BUG-05, BUG-06(`/stream`), BUG-07, BUG-08(스트림), TEST-01 |
| 권장 | 50 | 최초 43건 + N-01~N-07 |
| 범위 밖 (수용된 위험) | 6 | SEC-01, SEC-02, SEC-04, SEC-05, SEC-06, BUG-01 (9절, 바뀌지 않음) |

#### 10.8.6 재리뷰 2차 판정

- **판정 결과**: **APPROVED**
- **근거**: 머지 전 필수였던 BUG-02R 이 계약(8.1)대로 고쳐졌고, 정상 순서·역순·옛 클라이언트 세 경우를 재현으로 확인했다. 회귀 테스트 9개가 실제 스트림 경로와 경계값을 덮는다. 최초 감사의 필수 8건이 모두 해결됐다. 새로 찾은 N-06(다른 세션 id 재사용 시 조용한 누락)·N-07(같은 시각 정렬)은 지금 프론트 id 생성 방식에서 실제로 일어날 가능성이 낮아 권장으로 둔다. N-01~N-05 와 함께 다음 작업에서 다룬다. 수용된 위험 6건(9절)은 판정 근거로 쓰지 않았다.

## 11. v0.4.2 재리뷰 (2026-11-10)

- **대상**: `main` (`4944a5e`) 위 작업 트리(커밋 전). `git diff HEAD -- backend` (60개 파일, +1435/−2908), 새 파일 `backend/app/api/errors.py`, `backend/app/services/news_service.py`, `backend/tests/test_b_collection.py`, `test_b_config_schedule_db.py`, `test_b_news_api.py`, `test_b_sources_research.py`, `test_briefing_output.py`, `test_error_format.py`, `test_input_limits.py`, `test_network_guard.py`, `test_news_service.py`, `test_transactions.py`, `test_v042_llm_chat.py`. 함께 바뀐 `config.json`, `.env.example`, `backend/.env.example`, `docker-compose.yml`, `.gitignore`, `scripts/collect.py`(바뀌지 않음, 새 잠금과의 상호작용만 봤다).
- **방법**: diff 를 파일별로 읽었다. 쟁점은 스크래치 스크립트로 재현했다(R12~R15, 임시 SQLite, `httpx.ASGITransport` 또는 임시 포트의 uvicorn, 저장소 파일을 쓰지 않음). B 조 TDD 순서 5건은 저장소 밖 사본(`backend/app`·`tests` 복사)에서 코드를 되돌리는 변이(mutation)를 넣고 해당 테스트를 돌렸다(11.4절). 마이그레이션은 루트의 옛 `agentlens.db`(2026-10-19, 지금은 쓰지 않는 파일)를 스크래치로 복사해 돌렸다. 사용자 DB `backend/agentlens.db` 는 `sqlite3 -readonly` 조회만 했다. 코드·사용자 파일은 고치지 않았고 stash·checkout·reset 은 쓰지 않았다.
- 줄 번호는 이 절에서는 지금 작업 트리 기준이다.

### 11.1 5-Pillar 매트릭스 (v0.4.2)

| 감사 필라 (Pillar) | 세부 검토 기준 | 평가 점수 (1~5) | 검토 소견 및 발견 사항 |
| :--- | :--- | :---: | :--- |
| **Pillar 1: 아키텍처 정합성** | 계층 분리(Router/Service/Model), 설계 문서 일치도 | 4 / 5 | 라우터가 모델을 직접 쿼리하지 않는다 (`backend/app/api/` 에 `select(`·`db.get(`·`.execute(` 0건, grep). `NewsService` 로 변환 세 벌을 하나로(`backend/app/services/news_service.py:14-50`). services → collectors import 0건(categorizer 이동). 별도 프로세스 수집 잠금·스키마 생성(`backend/app/collectors/manager.py:49-75`, `backend/app/mcp/server.py:19-23`). 남은 것: 세션 업서트 실패 시 `get_db` 가 부분 변경을 커밋한다(ARCH-03R), `make collect` 와 새 잠금이 맞물리지 않는다(N-12). `docs/system-designer/01_SYSTEM_DESIGN.md` 는 아직 지운 엔드포인트·옛 DB 경로를 적는다(11.6절, 문서 단계에서 고칠 것) |
| **Pillar 2: 클린코드 & SOLID** | 단일 책임 원칙, 중복 코드 부재, 변수/함수 네이밍 가독성 | 4 / 5 | 오류 응답 하나로(`backend/app/api/errors.py`), 예외→상태 표 `LLM_ERROR_MAP`(`backend/app/api/chat.py:50-57`), 지운 코드·엔드포인트 11개·서비스 1개, FTS DDL 한 곳(`backend/app/database.py:79-109`), 버전 붙은 마이그레이션(`:77`, `:112-123`). 남은 것: ARCH-05 로 읽는 곳이 사라진 `TESTING` 설정(CFG-02R), 이메일의 고정 대시보드 주소(N-10) |
| **Pillar 3: 보안 & 데이터 무결성**| SQL Injection 방어, 입력값 Sanitization, 권한 검증, 환경변수 유출 방지 | 4 / 5 | 500 은 고정 문장만(재현 R12-C), 검증 실패는 400 `ERR_INVALID_PAYLOAD`·입력 echo 없음, 메일 HTML 이스케이프·http(s) 링크만(`backend/app/services/email_service.py:12-15`, `:27-46`), 입력 한도(질문 1~2000자, 후보 1~20, 로그 1~200). 설정·소스 파일 원자적 교체. 남은 것: 세션 업서트 부분 커밋(ARCH-03R), 기존 DB 의 KST 행이 업그레이드 뒤 9시간 어긋나 보인다(N-11). 수용된 위험 6건은 판정에 넣지 않았다 |
| **Pillar 4: 성능 & 리소스 최적화**| 불필요한 리렌더 방지, N+1 쿼리 부재, 비동기 논블로킹 준수 | 5 / 5 | Ollama 판정 async + 30초 기억, LLM 평가는 DB 잠금 밖(`manager.py:186-223`), feedparser·본문 추출 `to_thread`, 크기·만료 있는 캐시, 설정·소스 파일 (mtime,size) 캐시, 검색 경로의 FTS 검사·커밋 제거. 새 성능 결함은 찾지 못했다 |
| **Pillar 5: 테스트 품질 & 커버리지**| Red-Green TDD 준수 여부, 엣지/에러 케이스 커버리지 | 4 / 5 | 새 테스트 167개, 384 passed. A·C 조는 Red 출력과 함께 기록했다. B 조가 순서를 못 지킨 5건은 변이로 확인했고 4건은 동작을 잡는다(11.4절). 외부 네트워크 가드(루프백만), SMTP 흉내, 남은 태스크 취소, pytest-cov. 남은 것: 소스 문자열만 보는 테스트 2건이 동작 회귀를 놓친다(TEST-07, 변이로 확인), 세션 업서트 트랜잭션 테스트가 라우터 경로를 보지 않는다(ARCH-03R), 실행마다 임시 DB 폴더가 남는다(TEST-08) |

### 11.2 `make check` (v0.4.2 재리뷰)

- 실행: 2026-11-10 13:35~13:36 KST, 저장소 루트, 이 검토자가 직접 실행. 종료 코드 **0**.
```
cd backend && ../.venv/bin/pytest -v tests/
platform darwin -- Python 3.11.9, pytest-9.2.0, pluggy-1.7.0
plugins: cov-7.1.0, anyio-4.16.0, asyncio-1.4.1.post1
...
tests/test_v042_llm_chat.py::test_cc02_non_stream_ask_helpers_are_removed PASSED [100%]
============================= 384 passed in 8.76s ==============================
cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit
 Test Files  67 passed (67)
      Tests  783 passed (783)
$ eslint
EXIT=0
```
  eslint 는 경고·오류 출력이 없고, `tsc --noEmit` 도 출력 없이 끝났다.
- 실행 전후: `git status --porcelain` 같음(`diff` 출력 없음), `git diff HEAD | shasum` 같음(`69bf963f…`), 루트 `sources.json`·`backend/app/config/sources.json` md5 `32ed0854…` (사용자 변경 Evil Martians 그대로), `config.json` md5 `5b2bf3b6…` 같음. 테스트 DB 는 `$TMPDIR/agentlens-test-*` 에 생겼다 (TEST-08).

### 11.3 지난 지적 건별 확인 (권장 50건)

| ID | 결과 | 근거 (코드·테스트) |
|---|---|---|
| SEC-03 | 해결 | 전역 처리기 3개: HTTPException → 같은 상태·`error_code`, 검증 → 400 `ERR_INVALID_PAYLOAD`·`details [{loc,msg}]`, 그 밖 → 500 고정 문장·`logger.exception` (`backend/app/api/errors.py:51-83`). 챗 세션 500 은 고정 문장(`backend/app/api/chat.py:144-146`, `:175-177`, `:191-193`, `:207-209`). `sources_file` 은 파일 이름만(`backend/app/api/sources.py:37`). `/api/mcp/info` 삭제. 재현 R12-C: 예외 문장에 `SELECT … /Users/abs/path` 를 넣어도 500 본문은 `{"error_code":"ERR_SERVER_INTERNAL","message":"서버 내부 처리 중 오류가 발생했습니다.","details":null}`. 테스트 `test_error_format.py` 21개 |
| SEC-07 | 해결 | `html.escape` 와 `_safe_href`(http(s) 만, 그 밖 `#`) (`backend/app/services/email_service.py:12-15`, `:27-46`, `:89`). `test_email_html_escapes_collected_strings_and_blocks_non_http_links` |
| BUG-09 | 해결 | `last_usage` 싱글턴 삭제, `usage_out` 로 호출마다 (`backend/app/services/llm_processor.py:390-430`, `:462-499`, `backend/app/services/llm_providers/anthropic_provider.py:331-332`, `backend/app/services/chat_service.py:620-624`). `test_bug09_*` 3개 |
| BUG-10 | 해결 | 휴리스틱 폴백 평가는 캐시하지 않는다 (`llm_processor.py:773`), `reset-and-collect` 가 `clear_caches()` (`backend/app/api/schedule.py:77`). `test_bug10_*` 2개. 같은 문제의 기사 질문 쪽은 N-08 (새 지적) |
| BUG-11 | 해결 | 소스·배치 실패를 `source_results[name].error` 에, `status` success/partial_failure/failed, `error_message` JSON (`backend/app/collectors/manager.py:262-297`). 배치는 롤백 뒤 다시 올린다(`:218-221`). `test_crawl_log_records_*` |
| BUG-12 | 해결 | NULL summary·published_at·category 이스케이프·`PUBLIC_WEB_URL` (`backend/app/api/news.py:73-88`). `test_rss_feed_survives_null_columns_and_escapes`. 같은 종류의 고정 주소가 메일에 남는다: N-10 |
| BUG-13 | 해결 | planner·검색 예외 → `event: error` (`chat_service.py:549-556`, `:569-581`), 예외 문자열 없음 (`_sse_error` `:428-439`). `test_bug13_*` 2개 |
| BUG-14 | 해결 | `ChatStreamRequest.model` 기본 `None` (`backend/app/schemas/chat.py:31`). `test_bug14_*` 2개 |
| BUG-15 | 해결 | `clip_words` 공백 경계 + `…` (`backend/app/services/briefing_service.py:47-58`, 사용 `:103`, `:105`, `:116`). `test_clip_words_*` 3개 외 2개 |
| BUG-16 | 해결 | 분야 이름 = 프론트 긴 라벨, `icon` = 분야 id, 마크다운·Notion·메일·웹훅·챗 진행 라벨 이모지 삭제. `test_briefing_output.py`, `test_d35_*` |
| BUG-17 | 해결 | LLM 시사점이 없으면 `why_it_matters = ""` (`llm_processor.py:810-812`). `test_bug17_*` 2개 |
| BUG-18 | 해결 (데이터 제외) | RSS·arXiv `raw_score` 0, HF 실제 upvotes, GitHub 감시 저장소는 API 실제 값 또는 건너뜀(`backend/app/collectors/sources/github.py:50-78`), 인기 점수 `20·log10(1+h)`, 저장 UTC(`manager.py:151-155`, `backend/app/collectors/sources/rss.py:27-40`), 응답 `Z`(`backend/app/schemas/news.py:32-36`). 테스트 8개. 이미 저장된 행은 보정하지 않았다: N-11 |
| BUG-19 | 해결 | `DELETE /api/news/all` 삭제 (재현 R12-D 404) |
| BUG-20 | 해결 | `SourcesWriteError` → 500 (`backend/app/services/sources_service.py:156`, `backend/app/api/sources.py:19-24`), RSS id 슬러그 + 겹치면 `_<sha1[:8]>` (`sources_service.py:35-41`), 입력 검증(`sources.py:9-16`). 테스트 11개 |
| BUG-21 | 해결 | 깊은 사본(`backend/app/api/briefing.py:139`), 임시 파일 → `replace`, 실패 시 제자리 쓰기, 임시 파일 항상 삭제 (`backend/app/config.py:181-202`). `test_settings_save_failure_keeps_memory_and_file`, `test_save_json_config_writes_via_temp_file_and_keeps_original_on_failure` |
| CFG-01 | 해결 | `add_jobs` 가 `crawl_hours`·`timezone`·`briefing.auto_dispatch_hour` 로 cron (`backend/app/scheduler.py:47-70`), `SCHEDULER_ENABLED` (`:72-75`). 테스트 4개 |
| CFG-02 | 일부 해결 | 지운 설정 9개, 연결 4개 (`config.py:62-121`, `test_dead_settings_are_removed` 외 6개). 이번 ARCH-05 수정으로 `TESTING` 이 새로 읽는 곳 없는 설정이 됐다: CFG-02R |
| CFG-03 | 해결 (테스트 약함) | 기본 7.0 하나 (`config.py:89`), `getattr` 폴백 삭제 (`llm_processor.py:634`, `:726`). 테스트가 소스 문자열만 본다: TEST-07 |
| CFG-04 | 해결 | `run-deep` 설명 '키워드 규칙 점수'(`backend/app/api/research.py:45`), docstring 3곳. `test_cfg04_*` |
| ARCH-01 | 해결 | 뉴스·통계·스케줄 라우터가 `NewsService` 만 부른다, `collector_manager.reset_progress` (`manager.py:91-97`). `test_news_service.py` 8개 |
| ARCH-02 | 해결 | `app/services/categorizer.py` 로 이동, services → collectors import 0건(grep). `test_categorizer_lives_in_services_not_collectors` |
| ARCH-03 | 일부 해결 | 세션 업서트 = flush·`commit=False`·커밋 한 번(`backend/app/services/chat_session_service.py:230-304`), 스크래퍼는 자기 세션(`backend/app/services/scraper.py:170-182`), 삭제는 서비스 한 커밋. 그러나 라우터가 예외를 잡아 정상 반환하면 `get_db` 가 부분 변경을 커밋한다: ARCH-03R (재현 R12-B) |
| ARCH-04 | 해결 | DB 경로 `backend/` 기준(`config.py:49-58`, `:159`), 비차단 `flock`(`manager.py:49-75`, `:225-231`, `:319-321`), MCP 도구 첫 호출 때 `ensure_db_schema`. 재현 R12-G·R14. `make collect` 와의 상호작용은 N-12 |
| ARCH-05 | 해결 | `is_test_environment` 삭제, planner 는 라이브 공급자 여부로만(`chat_service.py:333-334`), `except TypeError` 재호출 삭제. `test_arch05_*` 3개 |
| CC-01 | 해결 | `error_response`·`ApiError`·`LLM_ERROR_MAP`, `api/chat.py` 에 `"error_code":` 리터럴 0건. `test_chat_router_has_no_model_query_and_no_repeated_error_blocks` |
| CC-02 | 해결 | 엔드포인트 11개·`AgenticSearchService`·`generate_structured_summary`·`answer_question(_with_meta)`·`add_github_repo`·`discover_sources`·`register_candidate` 삭제. 재현 R12-D: 11개 모두 404 `ERR_NOT_FOUND` (단 `POST /api/sources/github` 은 307 → `/api/sources/github/` 로 슬래시 리다이렉트된다. `{item_id:path}` 가 빈 값과 맞기 때문이며 해당 경로에 POST 처리기는 없다). 프론트·`.claude`·`scripts`·`Makefile` 에 남은 호출 0건(grep) |
| CC-03 | 해결 | FTS DDL `database.FTS_DDL` 한 곳, 검색은 만들거나 커밋하지 않음 (`backend/app/services/retriever.py:478-480`). `test_retriever_does_not_create_fts_or_commit` |
| CC-04 | 해결 | 모델 `index=True` 삭제, `_m002_drop_duplicate_indexes` (`database.py:68-72`). 재현 R13: 옛 DB 사본에서 5개 인덱스가 지워짐 |
| CC-05 | 해결 | `POST /api/briefing/generate` 삭제 |
| CC-06 | 해결 | `MIGRATIONS` + `PRAGMA user_version`, 실패는 로그 후 raise (`database.py:75-134`). 재현 R13 |
| CC-07 | 해결 | verdict 주석(`backend/app/models/news.py:62`), 스케줄 로그가 설정값(`scheduler.py:18-20`), docstring 우선순위 |
| PERF-01 | 해결 | `_ollama_status` async + `_ollama_cache` 30초 (`llm_processor.py:174`, `:225-250`), `has_live_provider`·`check_provider_available` async. `test_perf01_*` |
| PERF-02 | 해결 | `_prepare_row` 는 잠금 밖, 저장만 잠금 안 한 트랜잭션 (`manager.py:122-223`). `test_llm_evaluation_runs_outside_db_lock` |
| PERF-03 | 해결 | feedparser·본문 추출 `asyncio.to_thread` 4곳. 변이로 4곳 모두 테스트가 잡음 (11.4절) |
| PERF-04 | 해결 | `load_json_config`·`load_sources` 가 (mtime_ns,size) 같으면 깊은 사본만 (`config.py:28-47`, `sources_service.py:55-68`). 변이로 확인 (11.4절) |
| PERF-05 | 해결 | `TTLCache` 평가 5000/24h·질문 1000/6h·Ollama 8/30s (`llm_processor.py:93-132`, `:172-174`), 스크래퍼 잠금 `WeakValueDictionary`(`scraper.py:77`, `:83-90`, 지역 변수가 강한 참조를 쥐므로 사용 중 사라지지 않는다). `test_perf05_*` 2개 |
| PERF-06 | 해결 | 검색 경로의 `_ensure_fts_table` 삭제. rebuild 판정은 시작 때 `news_fts_docsize` 로 (`database.py:101-109`) |
| PERF-07 | 해결 (속도 제한 제외) | 질문 1~2000자(`schemas/news.py`), `max_candidates` 1~20·`limit` 1~200 (`research.py:32`, `:42`). 재현 R12-C 400. 속도 제한은 넣지 않았다. 근거(인증 없는 단일 사용자 로컬 앱, 요청당 비용은 길이·범위로 묶임, 수집·딥 리서치는 동시에 하나)를 받아들인다 |
| TEST-02 | 해결 | 버전 = 루트 `config.json` `app.version`, reset 은 `started`·삭제 행 수·삭제 뒤 0·수집 1회, 업서트 `== 201`, 딥 리서치 판정 점수 구간 |
| TEST-03 | 해결 | 전송 계층 가드가 루프백 밖 요청을 막고 teardown 에서 실패시킴, `register_web`, autouse `fake_smtp`·`cancel_leftover_tasks`. `test_network_guard.py` 8개. 이번 `make check` 는 외부 호출 없이 통과했다 |
| TEST-04 | 해결 | `tempfile.mkdtemp` (`backend/tests/conftest.py:8`). 폴더를 지우지 않아 쌓인다: TEST-08 |
| TEST-05 | 기록 (조치 없음) | 지난 이력. 이번 작업은 A·C 조 Red 출력 기록, B 조는 5건 순서 위반을 스스로 적었다 (11.4절) |
| TEST-06 | 해결 | `pytest-cov>=5.0.0` (`backend/requirements.txt`), planner JSON·`ACTION:`·잘못된 JSON 테스트 4개 |
| N-01 | 해결 | 토큰 뒤 실패·`max_tokens` → `{"event":"error","error_code":"ERR_LLM_STREAM_FAILED",…,"retryable":true}`, done·캐시 없음 (`llm_processor.py:136-142`, `:945`, `:978`). `test_n01_*` 2개 |
| N-02 | 해결 | `last_run_summary {status:"error",…}` 후 raise (`backend/app/services/deep_researcher.py:392-401`), `_background_tasks` (`research.py:24`, `:51-53`). 테스트 2개 |
| N-03 | 해결 | `/api/chat/query`·`/api/chat/search` 삭제 |
| N-04 | 해결 | 등록 url·site_url 제외, 발굴·시드 번갈아 (`deep_researcher.py:410-431`), `max_candidates` 1~20. `test_deep_research_interleaves_seeds_and_skips_monitored` |
| N-05 | 해결 | 비스트림 `stop_reason == "max_tokens"` → `AnthropicStreamError` (`anthropic_provider.py:236-238`). `test_n05_*` |
| N-06 | 해결 | 다른 세션 id → `MessageIdConflictException`, 업서트는 아무것도 바꾸기 전에 검사(`chat_session_service.py:240-241`, `:412-422`), 세션 POST 400 `details.message_ids` (`chat.py:173-174`). `test_n06_*` |
| N-07 | 해결 | 받은 `created_at` 또는 서버 시각 + 순서 µs (`chat_session_service.py:397`). `test_n07_*` |

### 11.4 B 조가 TDD 순서를 지키지 못한 5건: 테스트가 동작을 잡는가

저장소 밖 사본(`scratchpad/mut/`)에서 구현을 되돌리는 변이를 하나씩 넣고 해당 테스트만 돌렸다. 실패하면 테스트가 그 회귀를 잡는다는 뜻이다.

| 항목 | 테스트 | 변이 | 결과 | 판단 |
|---|---|---|---|---|
| CFG-03 | `test_high_signal_threshold_has_single_default` (`test_b_config_schedule_db.py:157-161`) | 기본값 7.0 → 7.8 | `1 failed` | 잡는다 |
| | 같은 테스트 | 문자열 `"high_signal_threshold", 7.0)` 는 남기고 키가 없을 때 7.8 이 되게 식을 바꿈 | `1 passed` | **동작이 아니라 소스 문자열을 본다** (TEST-07) |
| ARCH-04 (DB 경로) | `test_relative_sqlite_path_resolves_against_backend_dir` (`:168-179`) | `merge_json_and_env` 의 `resolve_database_url` 호출 삭제 | `1 failed` | 잡는다 (`Settings(DATABASE_URL=…)` 동작 단언) |
| PERF-04 (config) | `test_load_json_config_rereads_only_when_file_changes` (`:182-197`) | 캐시 조건을 `if True:` 로 | `1 failed` | 잡는다 (`json.load` 횟수) |
| PERF-04 (sources) | `test_sources_file_rereads_only_when_file_changes` (`:200-218`) | 캐시 조건 `if True:` / 깊은 사본 대신 원본 반환 | `1 failed` / `1 failed` | 잡는다 (횟수와 사본 둘 다) |
| PERF-03 | `test_rss_feed_is_parsed_off_the_event_loop`, `test_scraper_extraction_runs_off_the_event_loop`, `test_research_feed_parsing_runs_off_the_event_loop` ×2 | 네 곳의 `to_thread` 를 직접 호출로 | 네 경우 모두 해당 테스트 `1 failed` | 잡는다 (메인 스레드 여부) |
| CFG-02 단언 | `test_collection_evaluation_has_no_unused_category_hint` (`test_b_collection.py:344-348`) | `category_hint` 인자 되살림 | `1 failed` | 잡는다 (시그니처) |
| (참고) CFG-02 | `test_chat_session_retention_uses_configured_limit` (`test_b_config_schedule_db.py:116-119`) | 문자열은 남기고 `max_limit=settings.CHAT_SESSION_MAX_LIMIT and 30` (늘 30) | `1 passed` | **소스 문자열만 본다** (TEST-07) |

결론: 5건 중 ARCH-04·PERF-04·PERF-03·CFG-02 단언은 실제 동작을 잡는다. CFG-03 은 지금 코드를 되돌리면 실패하지만 소스 문자열 검사라 동작 회귀를 놓칠 수 있다(TEST-07).

### 11.5 중점 확인 항목

| 항목 | 결과 | 근거 |
|---|---|---|
| 오류 처리기·500 경로 | 맞음 | 재현 R12-C: 없는 경로 404 `ERR_NOT_FOUND`, 잘못된 메서드 405 `ERR_METHOD_NOT_ALLOWED`, 본문·쿼리 검증 400 `details [{loc,msg}]`(입력값 없음), 처리 못 한 예외 500 고정 문장. `HTTPStatus(exc.status_code)` 는 표준이 아닌 상태(529)에서 `ValueError` 를 내지만 529 는 `error_response` 로만 나가고 `HTTPException(529)` 를 던지는 곳은 없다(grep) |
| 삭제한 엔드포인트의 남은 참조 | 없음 (코드) | 11.3 CC-02. 문서는 남았다(11.6) |
| 수집 잠금(flock)·reset | 맞음 (backend 안), N-12 (`make collect`) | 재현 R12-G: 다른 프로세스가 `<db>.crawl.lock` 을 쥐면 `trigger` → `already_running`, `reset-and-collect` → `already_running`·`deleted_count 0`(지우지 않음). reset 은 잠금을 쥔 채 삭제·커밋 후 풀고 재수집을 띄운다(`schedule.py:72-86`). 해제와 재수집 시작 사이에 다른 프로세스가 잠금을 잡으면 재수집이 `already_running` 으로 끝나지만 그 프로세스가 수집하므로 데이터 문제는 없다. 재현 R14: `make collect`(API 모드)는 다른 프로세스가 잠금을 쥐면 끝날 때까지 기다리다 시간 초과로 실패한다(N-12) |
| DB 경로·마이그레이션 | 안전 | 재현 R13: 옛 `agentlens.db` 사본(`user_version` 0, 기사 4355건)에 `ensure_db_schema` 두 번 → `user_version` 2, 기사 4355·FTS 색인 4355, `PRAGMA integrity_check` ok, 중복 인덱스 5개 삭제, 두 번째 실행 무변경. 사용자 DB `backend/agentlens.db` 는 이미 `user_version` 2(읽기 조회). 로컬 `.env`·`backend/.env` 의 `DATABASE_URL=sqlite+aiosqlite:///./agentlens.db` 는 `backend/agentlens.db` 로 풀리고, 이전에도 `make dev`(cwd `backend/`)는 같은 파일을 썼다. Docker `./data/agentlens.db` 는 `/app/data/agentlens.db` 로 같다 |
| UTC 시각 저장·응답 | 뉴스는 맞음, 챗·로그 시각은 오프셋 없음(N-09), 옛 행(N-11) | 저장은 `astimezone(utc)`, 뉴스 응답 `Z`. 재현 R12-A: `GET /api/chat/sessions` 의 `updated_at` 이 `2026-11-10T04:40:35.198027`(오프셋 없음) → KST 브라우저에서 9시간 전으로 읽힘(R15) |
| TTLCache | 맞음 | 크기 초과 시 가장 오래 안 쓴 것부터, 만료는 `time.monotonic()`. 이벤트 루프 안에서만 쓴다. 기사 질문 캐시가 휴리스틱 폴백 답도 6시간 기억한다: N-08 |
| async Ollama 판정 | 맞음 | `httpx.AsyncClient(timeout=1.0)`, 결과 30초 기억(실패도 기억, 30초 뒤 다시 판정) |
| 설정 캐시(mtime)·원자적 쓰기 | 맞음 | 캐시는 깊은 사본을 돌려 호출자 변경이 새지 않는다(변이로 확인). 쓰기는 임시 파일 → `replace`, `OSError` 면 제자리 쓰기, `finally` 에서 임시 파일 삭제. 쓰기와 교체 사이에 `await` 가 없어 같은 프로세스의 동시 저장이 섞이지 않는다 |
| MCP 서버 mcp 2.x 호환 | 맞음 | 재현 R14-MCP: 설치된 `mcp` 2.x 에서 `python -m app.mcp.server` 를 stdio 클라이언트(`mcp.client.stdio`)로 띄워 `initialize` → 도구 4개 목록 → `search_agent_news` 호출 `[]`, 임시 DB 에 스키마 생성 확인. stdout 에 `print` 하는 경로는 수집·도구 경로에 없다(`app/` 의 `print` 는 `config.py:199`, `main.py:21`, `:35`, `scheduler.py` 뿐) |
| 테스트 네트워크 가드 | 맞음 | 루프백 밖 httpx 요청은 막히고 teardown 에서 실패. SMTP 는 autouse 흉내. 이번 `make check` 384 통과 |

### 11.6 준수 확인

| 항목 | 결과 |
|---|---|
| 계약 | `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` v1.3 이 오류 형식, News 날짜 오프셋(1.4절 `:102-103`), 지운 엔드포인트, `/ask/stream` `error` 이벤트를 적는다. 챗 시각은 "오프셋이 없을 수 있다" 로 적혀 있다(N-09 를 고치면 함께 고친다) |
| 설정 | 새 `PUBLIC_WEB_URL`·`SCHEDULER_ENABLED` 가 `config.py`·`.env.example`·`backend/.env.example`·`docker-compose.yml` 에 있다. 지운 설정은 세 파일에서 모두 빠졌다(`test_dead_settings_are_removed`) |
| 문서 | **아직 반영 안 됨**: `docs/system-designer/01_SYSTEM_DESIGN.md` 가 지운 엔드포인트(`:614`, `:620-621`, `:628`, `:646`), `GET /api/mcp/info`(`:175`), cwd 상대 DB 경로를 적는다. `docs/devops-engineer/01_DEPLOYMENT_SPEC.md` 가 `TESTING`·`is_test_environment`(`:155`, `:188`, `:512`)를 적는다. 오케스트레이터 변경 요약이 "문서 반영용" 이므로 문서 단계에서 고칠 것으로 보고 지적 수에 넣지 않았다. 출시 전에 반영돼야 한다 (`CLAUDE.md` '지금 시스템 문서') |
| 버전 | backend 코드에서 버전을 바꾸지 않았다(`config.py:64` 기본값 0.4.1, `config.json` 그대로). 릴리스 단계에서 `docs/releases.md` '버전 문자열 위치' 대로 바꾼다 |

### 11.7 새 지적 (모두 권장)

모두 머지를 막을 결함은 아니라고 판단했다(각 항목의 '권장 이유'). 이번 지시가 "남은 결함 0" 이므로 같은 릴리스에서 고치기를 권한다.

#### [권장] ARCH-03R 세션 업서트가 실패해도 라우터가 정상 반환해 `get_db` 가 부분 변경을 커밋한다
- **위치**: `backend/app/api/chat.py:168-177`(`except Exception` → `error_response(500)` 을 돌려줄 뿐 롤백하지 않음), `backend/app/database.py:31-35`(`get_db` 는 처리기가 정상 반환하면 커밋), `backend/app/services/chat_session_service.py:273`(세션 행 `flush`), 테스트 `backend/tests/test_transactions.py:84-86`(서비스를 직접 부르고 테스트가 `s.rollback()` 을 손으로 불러 라우터 경로를 보지 않음)
- **근거**: 재현 R12-B — 세션(제목 '원래 제목')을 만든 뒤 `append_messages_batch` 가 `RuntimeError` 를 내게 바꾸고 `POST /api/chat/sessions {"title":"바뀐 제목", messages:[…]}` → `500 ERR_SESSION_CREATE_FAILED`. 그런데 이어서 `GET /api/chat/sessions/{id}` 의 `title` 이 `바뀐 제목` 이다. 서비스 안 "한 트랜잭션" 은 맞지만 HTTP 경로에서는 실패 응답 뒤 부분 변경이 커밋된다. flush 자체가 DB 오류로 실패하면 세션이 비활성이 돼 `get_db` 의 커밋이 실패하고 롤백되므로, 남는 경우는 flush 뒤의 DB 밖 예외(직렬화·코드 오류 등)다. 삭제(`:203-209`)도 같은 모양이다.
- **권장 이유**: 지금 코드에서 flush 뒤 DB 밖 예외가 날 경로가 드물고, 남는 것은 세션 제목·필터 같은 메타 변경이다. ARCH-03 의 목표(실패하면 아무것도 남지 않음)를 HTTP 경로에서 지키려면 고친다.
- **개선 제안 (Diff)**:
```diff
--- a/backend/app/api/chat.py
     except InvalidSessionUUIDException as e:
+        await db.rollback()
         return error_response(400, "ERR_SESSION_INVALID_UUID", str(e))
     except MessageIdConflictException as e:
+        await db.rollback()
         return error_response(400, "ERR_INVALID_PAYLOAD", str(e), {"message_ids": e.message_ids})
     except Exception:
         logger.exception("chat session upsert failed")
+        await db.rollback()
         return error_response(500, "ERR_SESSION_CREATE_FAILED", "대화 세션을 저장하지 못했습니다.")
--- a/backend/tests/test_transactions.py
+async def test_session_upsert_failure_over_http_keeps_title(monkeypatch):
+    # POST 로 세션 생성 → append_messages_batch 가 RuntimeError → POST 500 → GET 상세 title == '원래 제목'
```
  삭제 경로의 `except Exception` 에도 `await db.rollback()` 을 넣는다.

#### [권장] CFG-02R ARCH-05 수정으로 `TESTING` 설정이 읽는 곳 없이 남았다
- **위치**: `backend/app/config.py:87`(`TESTING: bool = False`), `:150-151`(환경 변수 해석). 유일한 사용처였던 `is_test_environment()` 를 이번에 지웠다(`git diff HEAD -- backend/app/services/llm_processor.py`)
- **근거**: `grep -rn "TESTING" backend/app` → `config.py` 세 줄뿐. `docs/devops-engineer/01_DEPLOYMENT_SPEC.md:155`, `:188` 은 아직 이 설정이 동작을 바꾼다고 적는다.
- **권장 이유**: 동작 영향은 없고, CFG-02 가 지운 다른 설정과 같은 "읽지 않는 설정" 이다.
- **개선 제안 (Diff)**:
```diff
-    TESTING: bool = False
 ...
-        if "TESTING" in os.environ:
-            self.TESTING = os.environ.get("TESTING", "").lower() in ("true", "1", "yes")
--- a/backend/tests/test_b_config_schedule_db.py
-DEAD_FIELDS = ("CORS_ORIGINS", ..., "AGENTIC_SEARCH_MAX_QUERIES")
+DEAD_FIELDS = ("CORS_ORIGINS", ..., "AGENTIC_SEARCH_MAX_QUERIES", "TESTING")
```

#### [권장] N-08 기사 Ask AI 스트림이 휴리스틱 폴백 답도 6시간 캐시한다
- **위치**: `backend/app/services/llm_processor.py:1003-1005`(`if full_text:` 면 폴백 답도 `_qa_cache` 에 저장), 캐시 읽기 `:890-901`
- **근거**: 재현 R15-A — Anthropic·OpenAI 를 쓸 수 없게 한 뒤 질문 → `meta: AgentLens Heuristic Engine`. 이어서 Anthropic 을 되살리고(흉내 스트림) 같은 질문 → `meta: AgentLens Heuristic Engine (캐시됨)`. LLM 이 잠깐 안 될 때의 규칙 기반 답이 6시간(TTL) 동안 같은 기사·질문의 LLM 답을 막는다. BUG-10 이 평가 캐시에서 고친 것과 같은 문제다.
- **권장 이유**: TTL 로 6시간 뒤 풀리고(전에는 재시작까지), `reset-and-collect` 가 비운다. 사용자가 질문을 조금 바꾸면 피할 수 있다.
- **개선 제안 (Diff)**:
```diff
+        used_fallback = False
         if not stream_succeeded or not full_text.strip():
+            used_fallback = True
             fallback_ans, fallback_model = self._generate_heuristic_answer(
 ...
         if full_text:
-            self._qa_cache[cache_key] = (full_text, sanitize_model_identifier(model_used))
+            if not used_fallback:  # 폴백 답은 LLM 이 잠깐 안 될 때의 답일 수 있어 캐시하지 않는다 (BUG-10 과 같은 규칙)
+                self._qa_cache[cache_key] = (full_text, sanitize_model_identifier(model_used))
             yield {"event": "done", "total_text": full_text}
```
  테스트: 폴백 답 뒤 LLM 을 살리고 같은 질문 → `meta.model` 에 `(캐시됨)` 없음, LLM 토큰.

#### [권장] N-09 챗 세션·메시지 시각이 UTC 오프셋 없이 나가 KST 화면에서 9시간 전으로 보인다
- **위치**: `backend/app/services/chat_session_service.py:105-106`(목록 `created_at`·`updated_at`), `:158`(메시지 `created_at`), `:184`, `:215-216`(상세), `backend/app/services/chat_service.py` `get_source_detail` 의 `published_at`·`created_at`·`scraped_at` `isoformat()`, `backend/app/services/news_service.py:130-131`(수집 로그 시각), 소비처 `frontend/src/components/chat/SessionItemCard.tsx:20-22`(`new Date(문자열)`), `frontend/src/types/chat.ts:661`(`updatedAt: summary.updated_at`)
- **근거**: SQLite `DateTime` 열은 tz 를 저장하지 않아 읽으면 naive UTC 다. 재현 R12-A — 세션을 막 만든 뒤 `GET /api/chat/sessions` 의 `updated_at` 은 `2026-11-10T04:40:35.198027`. 재현 R15-B — `TZ=Asia/Seoul node` 에서 `new Date("2026-11-10T04:40:35.198027")` 는 `2026-11-09T19:40:35.198Z` 로 읽혀 지금과 9.0시간 차이다. 사이드바 세션 카드(`formatRelativeTime`)가 새로 고친 뒤 막 만든 세션을 '9시간 전' 으로 보인다. 이번 릴리스가 뉴스 응답에만 `Z` 를 붙였고(BUG-18), 계약 v1.3 은 챗 시각에 "오프셋이 없을 수 있다" 고 적었다(`01_CONTRACT_AND_MSW_SPEC.md:103`).
- **권장 이유**: v0.4.2 이전부터 있던 동작이라 회귀가 아니다. 대상 사용자(KST)에게 사이드바 상대 시각이 모두 틀리게 보이므로 이번 릴리스에서 같이 고치기를 강하게 권한다.
- **개선 제안 (Diff)**:
```diff
--- a/backend/app/services/news_service.py
+def iso_utc(dt) -> Optional[str]:
+    """DB 의 naive UTC → 오프셋 있는 ISO. tz 가 있으면 UTC 로 바꾼다."""
+    if dt is None:
+        return None
+    return (dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)).isoformat()
--- a/backend/app/services/chat_session_service.py
-            created_str = s.created_at.isoformat() if hasattr(s.created_at, "isoformat") else str(s.created_at)
-            updated_str = s.updated_at.isoformat() if hasattr(s.updated_at, "isoformat") else str(s.updated_at)
+            created_str = iso_utc(s.created_at)
+            updated_str = iso_utc(s.updated_at)
```
  메시지·소스 상세·수집 로그도 같은 함수를 쓴다. 계약 `:103` 을 "모든 시각은 UTC 오프셋 있음" 으로 고치고 zod 를 `z.iso.datetime({ offset: true })` 로 맞추는 것은 contract-integrator·frontend 가 함께 한다. 테스트: 세션 POST 뒤 목록·상세의 `updated_at`·메시지 `created_at` 이 `+00:00` 또는 `Z` 로 끝난다.

#### [권장] N-10 브리핑 메일의 '대시보드 바로가기' 링크가 `http://localhost:3001` 고정이다
- **위치**: `backend/app/services/email_service.py:144`
- **근거**: BUG-12 를 고치며 `PUBLIC_WEB_URL`(`backend/app/config.py:67`, 기본 `http://localhost:3000`)을 만들었는데 메일 본문은 쓰지 않는다. `make dev` 의 프론트는 :3000 이라 로컬 기본 설정에서 메일 링크가 열리지 않는다. `grep -rn localhost backend/app` 로 남은 고정 주소는 이것 하나다.
- **권장 이유**: 메일 본문의 보조 링크 하나이고 내용 전달에는 영향이 없다.
- **개선 제안 (Diff)**:
```diff
-                        <a href="http://localhost:3001" style="color: #0969da; text-decoration: none;">대시보드 바로가기</a>
+                        <a href="{_safe_href(settings.PUBLIC_WEB_URL)}" style="color: #0969da; text-decoration: none;">대시보드 바로가기</a>
```

#### [권장] N-11 기존 DB 의 KST 피드 행이 업그레이드 뒤 9시간 늦은 시각으로 보인다
- **위치**: 응답 `backend/app/schemas/news.py:32-36`(`Z` 를 붙임), 보정 없음 `backend/app/database.py:77`(`MIGRATIONS`), 기록 `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md` [Cycle v0.4.2-B] '남은 것'
- **근거**: 옛 수집기는 `+09:00` 피드 시각을 벽시계 그대로 저장했다. 사용자 DB 읽기 조회: `published_at > created_at` 인 행이 `rss_kr` 395건(전체 4899건). 이전에는 응답에 오프셋이 없어 KST 브라우저가 현지 시각으로 읽어 이 행들이 맞게 보였고, 이제는 `Z` 가 붙어 9시간 늦게(최근 행은 미래로) 보인다. 즉 이 릴리스로 기존 데이터의 표시가 바뀐다. TDD 기록은 "어느 행이 어긋났는지 다 가려낼 수 없어 보정하지 않았다, `make reset` 으로 다시 수집" 으로 적었다.
- **권장 이유**: `make reset` 으로 바로잡히고(재수집), 새로 수집한 행은 맞다. 다만 사용자가 모르면 피드 상대 시각이 틀려 보인다.
- **개선 제안**: 최소한 릴리스 노트와 `docs/devops-engineer/01_DEPLOYMENT_SPEC.md` 업그레이드 절에 "v0.4.2 로 올린 뒤 `make reset` 권장(국내 피드 시각 보정)" 을 적는다. 확실히 어긋난 행만 고치는 마이그레이션을 더할 수도 있다(발행 시각이 수집 시각보다 늦은 행은 KST 벽시계로 저장된 행이다):
```diff
+def _m003_fix_kst_wall_clock_rows(connection) -> None:
+    """옛 수집기가 +09:00 시각을 벽시계로 저장한 행 중 확실한 것(발행 > 수집)만 9시간 당긴다."""
+    connection.execute(text(
+        "UPDATE news_items SET published_at = datetime(published_at, '-9 hours') "
+        "WHERE source = 'rss_kr' AND published_at > created_at"))
+
-MIGRATIONS = [_m001_add_v24_columns, _m002_drop_duplicate_indexes]
+MIGRATIONS = [_m001_add_v24_columns, _m002_drop_duplicate_indexes, _m003_fix_kst_wall_clock_rows]
```
  (`datetime()` 은 소수 초를 버리므로 정렬에는 영향이 없다. 어느 쪽을 택할지는 오케스트레이터가 정한다.)

#### [권장] N-12 다른 프로세스가 수집 잠금을 쥐면 `make collect`(API 모드)가 시간 초과까지 기다리다 실패한다
- **위치**: `scripts/collect.py:73-74`(`already_running` 이면 "끝날 때까지 기다린다"), `:93-104`(이 backend 의 `is_running`·`last_crawl_time` 만 본다), `backend/app/api/schedule.py:43-50`(다른 프로세스가 쥐어도 `already_running`, 구분 정보 없음), `backend/app/collectors/manager.py:109-120`(`get_progress` 는 이 프로세스 상태만)
- **근거**: 재현 R14 — 임시 DB 로 uvicorn(:18765, `SCHEDULER_ENABLED=false`)을 띄우고 다른 프로세스가 `<db>.crawl.lock` 을 쥔 상태에서 `COLLECT_MODE=api COLLECT_TIMEOUT=8 python scripts/collect.py` → `이미 진행 중인 수집이 있다. 그 수집이 끝날 때까지 기다린다` → `대기 중` → `수집이 8초 안에 끝나지 않았다`, 종료 1, 8초. 기본 시간 초과는 1800초라 MCP 서버가 수집하는 동안 `make collect` 를 부르면 30분을 기다린 뒤 실패한다. 다른 프로세스의 수집이 끝나도 이 backend 의 `last_crawl_time` 은 바뀌지 않으므로 끝을 알아채지 못한다. 이번 D-40 수정(잠금)으로 생긴 상호작용이다(전에는 backend 가 따로 수집했다).
- **권장 이유**: MCP 수집과 `make collect` 를 동시에 쓰는 드문 경우에만 나고 데이터는 상하지 않는다.
- **개선 제안 (Diff)**: trigger 응답에 다른 프로세스 여부를 싣고 스크립트가 바로 알린다.
```diff
--- a/backend/app/api/schedule.py
-    if collector_manager.is_busy():
+    if collector_manager.is_busy():
+        other = not collector_manager.is_running
         return {
             "status": "already_running",
-            "message": "이미 수집이 진행 중입니다.",
+            "message": "다른 프로세스(MCP 서버·make collect)가 같은 DB 에 수집 중입니다." if other else "이미 수집이 진행 중입니다.",
+            "other_process": other,
--- a/scripts/collect.py
     if status == "already_running":
+        if trig.get("other_process"):
+            _err(f"{trig.get('message')} 끝난 뒤 다시 실행한다")
+            return 1
         _out("이미 진행 중인 수집이 있다. 그 수집이 끝날 때까지 기다린다")
```
  계약(`/api/schedule/trigger` 응답 필드 추가)과 `test_collect_script.py` 를 함께 고친다.

#### [권장] TEST-07 소스 문자열만 보는 테스트 2건이 동작 회귀를 놓친다
- **위치**: `backend/tests/test_b_config_schedule_db.py:157-161`(CFG-03: `'"high_signal_threshold", 7.0)' in cfg_src`), `:116-119`(CFG-02: `body.count("max_limit=settings.CHAT_SESSION_MAX_LIMIT") == 2`)
- **근거**: 11.4절 변이 — 문자열을 남긴 채 동작만 바꾸면(키가 없을 때 7.8, 한도를 늘 30) 두 테스트 모두 `1 passed`. 계층 규칙(라우터에 `select(` 없음 등)은 소스 검사가 맞지만, 값·동작은 동작으로 단언해야 한다.
- **권장 이유**: 지금 코드는 맞고, 이 테스트들은 지금 코드를 되돌리는 회귀는 잡는다.
- **개선 제안 (Diff)**:
```diff
-def test_high_signal_threshold_has_single_default():
-    cfg_src = (BACKEND_DIR / "app" / "config.py").read_text(encoding="utf-8")
-    assert '"high_signal_threshold", 7.0)' in cfg_src
+def test_high_signal_threshold_has_single_default(monkeypatch):
+    monkeypatch.setattr(app_config, "_json_data", {"llm": {}})
+    assert Settings().HIGH_SIGNAL_THRESHOLD == 7.0
+    # 평가 경로가 settings 값을 쓰는지: 임계값을 9.9 로 두면 8.0 점이 하이시그널이 아니다
 ...
-def test_chat_session_retention_uses_configured_limit():
-    body = (...).read_text(...)
-    assert body.count("max_limit=settings.CHAT_SESSION_MAX_LIMIT") == 2
+async def test_chat_session_retention_uses_configured_limit(monkeypatch):
+    monkeypatch.setattr(settings, "CHAT_SESSION_MAX_LIMIT", 2)
+    # 세션 3개 업서트 → 목록 2개, 가장 오래된 것이 지워짐
```

#### [권장] TEST-08 테스트 DB 임시 폴더를 지우지 않아 실행마다 쌓인다
- **위치**: `backend/tests/conftest.py:8`(`tempfile.mkdtemp(prefix="agentlens-test-")`, 정리 없음)
- **근거**: 2026-11-10 13:4x 기준 `$TMPDIR/agentlens-test-*` 폴더 157개, `du -sch` 합계 249M (이 날의 여러 에이전트 실행이 남긴 것, 이 검토자의 `make check` 1회 포함). TEST-04 를 고치며 생긴 부작용이다.
- **권장 이유**: OS 임시 폴더라 재부팅·정리 주기에 지워지고 결과에는 영향이 없다.
- **개선 제안 (Diff)**:
```diff
+import atexit, shutil
 TEST_DB_FILE = Path(tempfile.mkdtemp(prefix="agentlens-test-")) / "test_agentlens.db"
+atexit.register(shutil.rmtree, TEST_DB_FILE.parent, ignore_errors=True)
```

### 11.8 재현 R12~R15

2026-11-10, 지금 작업 트리 코드, `backend/` 에서 `../.venv/bin/python -I` + 스크래치 스크립트(`scratchpad/repro/r12.py`, `r12b.py`, `r13.py`, `mcp_probe.py`), `DATABASE_URL` 은 모두 임시 폴더. 저장소 파일을 쓰는 엔드포인트(소스 추가·설정 저장)는 부르지 않았다.

| ID | 절차 | 결과 |
|---|---|---|
| R12-A | 세션 POST → `GET /api/chat/sessions` | `updated_at` `2026-11-10T04:40:35.198027` (오프셋 없음, N-09) |
| R12-B | 세션 생성('원래 제목') → `append_messages_batch` 가 `RuntimeError` → 업서트 POST('바뀐 제목') → 상세 | POST `500 ERR_SESSION_CREATE_FAILED`, 상세 `title` `바뀐 제목` (ARCH-03R) |
| R12-C | `GET /api/nope`, `PUT /api/news`, `POST /api/news/1/ask/stream` `{}`·2001자, `GET /api/news?page=0`, `GET /api/research/audit-logs?limit=0`, `NewsService.stats` 가 경로·SQL 문장을 담은 예외 | 404 `ERR_NOT_FOUND`, 405 `ERR_METHOD_NOT_ALLOWED`, 400 `ERR_INVALID_PAYLOAD` `details [{loc:["body","question"],msg}]` ×2, 400 `[{loc:["query","page"]…}]`, 400 `[{loc:["query","limit"]…}]`, 500 `{"error_code":"ERR_SERVER_INTERNAL","message":"서버 내부 처리 중 오류가 발생했습니다.","details":null}` |
| R12-D | 지운 엔드포인트 11개 | 10개 404 `ERR_NOT_FOUND`, `POST /api/sources/github` 307 (`/api/sources/github/` 로 슬래시 리다이렉트, 처리기 없음) |
| R12-F | 수집 로그 1행 → `GET /api/schedule/status` | `current_time`·`next_run` `+00:00`, `last_crawl_time` 오프셋 없음 (N-09 범위, 화면은 이 값을 쓰지 않는다 grep) |
| R12-G | 다른 프로세스가 `<db>.crawl.lock` `LOCK_EX` → `POST /trigger`, `POST /reset-and-collect` | `already_running`, `{"status":"already_running",…,"deleted_count":0}` |
| R13 | 옛 루트 `agentlens.db` 사본에 `ensure_db_schema()` 두 번 | `user_version` 0→2, 기사 4355·FTS 4355, `integrity_check ok`, `ix_news_items_id`·`ix_crawl_logs_id`·`ix_source_research_logs_id`·`ix_chat_sessions_updated_at`·`ix_chat_messages_session_id` 삭제 |
| R14 | uvicorn(임시 DB, :18765) + 다른 프로세스 잠금 → `COLLECT_MODE=api COLLECT_TIMEOUT=8 scripts/collect.py` | `대기 중` → `수집이 8초 안에 끝나지 않았다`, 종료 1 (N-12) |
| R14-MCP | `python -m app.mcp.server` (mcp 2.x) 를 stdio 클라이언트로 | 도구 4개, `search_agent_news` → `[]`, 임시 DB 생성 |
| R15-A | 공급자 없음 → 질문, 공급자 복구 → 같은 질문 | `AgentLens Heuristic Engine` → `AgentLens Heuristic Engine (캐시됨)` (N-08) |
| R15-B | `TZ=Asia/Seoul node -e 'new Date("2026-11-10T04:40:35.198027")'` | `2026-11-09T19:40:35.198Z`, 9.0시간 차이 (N-09) |

### 11.9 v0.4.2 지적 수

| 심각도 | 개수 | ID |
|---|---|---|
| 머지 전 필수 | 0 | — |
| 해결 (지난 권장) | 47 | 11.3절 '해결' 행 |
| 일부 해결 → 새 지적으로 이어짐 | 2 | ARCH-03 → ARCH-03R, CFG-02 → CFG-02R |
| 기록 | 1 | TEST-05 |
| 권장 (새로) | 9 | ARCH-03R, CFG-02R, N-08, N-09, N-10, N-11, N-12, TEST-07, TEST-08 |
| 범위 밖 (수용된 위험) | 6 | SEC-01, SEC-02, SEC-04, SEC-05, SEC-06, BUG-01 (9절. 이번 diff 로 바뀐 것: SEC-04 응답에서 `auto_alert_high_signal` 만 빠짐, 판정에 넣지 않음) |

### 11.10 v0.4.2 재리뷰 판정

- **판정 결과**: **APPROVED**
- **근거**: 머지 전 필수 0건. 지난 권장 50건 중 47건이 테스트와 함께 해결됐고, 2건(ARCH-03, CFG-02)은 대부분 해결되고 남은 부분을 새 지적(ARCH-03R, CFG-02R)으로 넘겼다. 오류 형식·삭제 엔드포인트·수집 잠금·DB 경로와 마이그레이션·MCP 2.x·네트워크 가드를 재현으로 확인했고 회귀는 찾지 못했다. B 조의 순서 위반 5건 중 4건은 변이로 동작을 잡음을 확인했고, CFG-03 테스트는 소스 문자열 검사라 TEST-07 로 넘겼다. `make check` 종료 0, 실행 전후 추적 파일 변화 없음.
- **남긴 권장 9건과 이유**: 11.7절 각 항목의 '권장 이유'. 그중 N-09(챗 사이드바 상대 시각 9시간 차이)는 대상 사용자에게 바로 보이므로 이번 릴리스에서 고치기를 가장 먼저 권하고, N-11 은 최소한 릴리스 노트·배포 명세에 `make reset` 안내를 넣어야 한다. 시스템 설계서·배포 명세의 옛 내용(11.6절)은 문서 단계에서 고친다.
- 수용된 위험 6건(9절)은 판정 근거로 쓰지 않았다.

### 11.11 v0.4.2 2차 재리뷰 (2026-11-10, 11절 권장 9건과 ADR 열린 질문 수정분)

- **대상**: 작업 트리(커밋 전) backend 2차 수정분. 오케스트레이터 변경 요약 '2차 수정' 절, `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md` [Cycle v0.4.2-A] '4. 2차 사이클'·[Cycle v0.4.2-B] '2차 수정'. 새 파일 `backend/app/time_utils.py`, `backend/tests/test_v042_a_round2.py`(18개), `backend/tests/test_b_round2.py`(7개). 바뀐 곳 `backend/app/database.py`(m003), `backend/app/api/chat.py`, `backend/app/api/errors.py`, `backend/app/api/schedule.py`, `backend/app/collectors/manager.py`, `backend/app/services/*`(iso_utc), `backend/app/schemas/chat.py`·`news.py`, `backend/requirements.txt`, `scripts/collect.py`, `backend/tests/conftest.py`.
- **방법**: diff 를 읽고 재현 R16~R18 을 돌렸다(임시 SQLite, `httpx.ASGITransport`). m003 은 사본으로만 검증했다: 루트의 옛 `agentlens.db`(v0.4.0 이전 수집분, m003 미적용 진짜 값) 사본, 스크래치의 `agentlens-before.db`(TDD 가 실제 DB 에서 되짚어 만든 적용 전 사본) 사본, 실제 DB 지금 상태 사본. 실제 `backend/agentlens.db` 는 `sqlite3 -readonly` 조회만 했다. TEST-07 새 테스트는 저장소 밖 사본에서 11.4절과 같은 변이를 넣어 확인했다. 코드는 고치지 않았다.
- **주의 (이 검토자의 부작용)**: R16-C 에서 `POST /api/chat/stream` 을 UUID·생략 `session_id` 로 두 번 불렀는데, 로컬 `.env` 에 Anthropic 키가 있어 응답 본문을 읽는 동안 실제 Anthropic 호출이 일어났다(질문 "hi", planner + 답 생성, 2회). 저장은 임시 DB 에만 했다.

#### 11.11.1 `make check` (2차 재리뷰)

- 실행: 2026-11-10 14:12~14:13 KST, 저장소 루트, 이 검토자가 직접 실행. 종료 코드 **0**.
```
cd backend && ../.venv/bin/pytest -v tests/
...
tests/test_v042_llm_chat.py::test_cc02_non_stream_ask_helpers_are_removed PASSED [100%]
============================= 410 passed in 11.67s =============================
cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit
 Test Files  69 passed (69)
      Tests  820 passed (820)
$ eslint
EXIT=0
```
  eslint 출력 없음, `tsc --noEmit` 출력 없음.
- 실행 전후: 이 실행 도중(14:12:22~35) 다른 에이전트가 버전 올리기로 `config.json`(`app.version` 0.4.2)·`frontend/package.json`·`docs/releases.md` 를 바꿔 `git status` 가 달라졌다. 그래서 backend pytest 를 다시 따로 돌려 전후를 비교했다: `410 passed in 11.01s`, `git status --porcelain` 같음, `git diff HEAD | shasum` 같음, `sources.json`·`backend/app/config/sources.json`(md5 `32ed0854…`, Evil Martians 사용자 변경 그대로)·`config.json` md5 같음. 테스트 DB 임시 폴더는 실행 뒤 지워졌다(TEST-08).

#### 11.11.2 11절 권장 9건과 추가 항목 확인

| ID | 결과 | 근거 |
|---|---|---|
| ARCH-03R | 해결 | 세션 POST 의 세 오류 분기와 DELETE 의 500 분기에서 `await db.rollback()` (`backend/app/api/chat.py:180`, `:183`, `:188`, `:221`). 재현 R16-B: 실패 업서트 POST 500 뒤 상세 `title` `원래 제목`. 테스트 `test_arch03r_failed_upsert_over_http_keeps_previous_title`, `…_failed_delete_over_http_keeps_session` (HTTP 경로) |
| CFG-02R | 해결 | `TESTING` 필드·해석 삭제 (`grep -rn TESTING backend/app` 0건). `test_cfg02r_testing_setting_is_removed` |
| N-08 | 해결 | `used_fallback` 이면 캐시하지 않음 (`backend/app/services/llm_processor.py:982-983`, `:1006`). `test_n08_heuristic_fallback_answer_is_not_cached` |
| N-09 (ADR Q11) | 해결 | `iso_utc` (`backend/app/time_utils.py:6-21`). `.isoformat()` 이 남은 곳은 모두 tz 있는 값(`datetime.now(timezone.utc)`, `last_run_time`, `last_crawl_time`)이라 `+00:00` 이 붙는다(grep 확인). `source_researcher.inspect_url` 의 `published` 는 외부 피드 원문 문자열이라 대상이 아니다. 재현 R16-A: 세션 POST·목록의 `created_at`·`updated_at`·`messages[].created_at`·`active_source.published_at`, `GET /api/chat/sources/1`, `GET /api/schedule/status` `last_crawl_time`·`recent_logs[].started_at`, `GET /api/research/audit-logs` `logs[].created_at` 모두 `+00:00`. 빠뜨린 응답 시각은 찾지 못했다 |
| N-10 | 해결 | `_safe_href(settings.PUBLIC_WEB_URL)` (`backend/app/services/email_service.py:144`). `test_email_dashboard_link_uses_public_web_url` |
| N-11 | 해결했으나 새 필수 결함 | m003 (`backend/app/database.py:94-144`). KST 시각 보정은 맞다(아래 11.11.3). 같은 마이그레이션의 GitHub 규칙이 실제 값을 지운다: M003-01 |
| N-12 | 해결 | trigger `already_running` 에 `other_process` (재현 R16-E: `{'status':'already_running','message':'다른 프로세스(MCP 서버·make collect)가 같은 DB 에 수집 중입니다.','other_process':True,…}`), `scripts/collect.py:73` 이 기다리지 않고 종료 1. `test_api_mode_other_process_running_exits_without_waiting` |
| TEST-07 | 해결 | 두 테스트가 동작을 단언한다. 11.4절의 변이(키가 없을 때 7.8, 한도 `… and 30`)를 사본에 넣으면 각각 `1 failed` |
| TEST-08 | 해결 | `pytest_sessionfinish` 가 폴더 삭제 (`backend/tests/conftest.py:12-15`). 이 검토자의 실행 두 번 뒤 새 폴더가 남지 않았다 |
| ADR Q4 | 해결 | `google-genai` 가 `backend/requirements.txt` 에서 빠졌고 import 0건(grep). Gemini 는 httpx REST |
| ADR Q12 (Windows 대체 잠금) | 맞음 | `fcntl` import 실패 시 `None` (`backend/app/collectors/manager.py:23-26`), `threading.Lock` 비차단 + 표지 객체(`:63-92`). 재현 R16-F (`fcntl=None` 흉내): 첫 획득 성공, 두 번째 `None`, 쥔 동안 `is_busy() True`, 해제 뒤 재획득 성공·`is_busy() False`. 다른 프로세스와는 공유되지 않음을 주석과 ADR 이 적는다. `test_manager_imports_without_fcntl` 이 하위 프로세스에서 `fcntl` 없이 import 를 확인한다 |
| ADR Q13 (런타임 OpenAPI 400 치환) | 맞음 | `_install_openapi` (`backend/app/api/errors.py:94-119`). 재현 R16-D: `/openapi.json` 응답 코드에 `422` 0개, `400` 19개, `HTTPValidationError`·`ValidationError` 컴포넌트 없음, `ErrorResponse` 는 `error_code`·`message` 필수·`details` 설명. 이미 400 이 있는 경로는 덮지 않는다(`setdefault`) |
| 스트림 `session_id` | 맞음 | `uuid.UUID()` 로 해석되지 않으면 400 `ERR_SESSION_INVALID_UUID`, 입력 echo 없음 (`backend/app/api/chat.py:101-106`). 재현 R16-C: `not-a-uuid` → 400, UUID·생략 → 스트림. 세션 POST 와 같은 규칙이라 `uuid.UUID` 가 받는 다른 표기(대시 없는 32자 hex 등)도 받는다. 프론트는 표준 UUID 만 보내므로 지적하지 않는다 |
| `ChatStatusStep` 4값 | 맞음 | `thinking`·`tool_calling`·`extracting_source`·`synthesizing` (`backend/app/schemas/chat.py:54-59`), `chat_service.py` 가 보내는 `step` 값과 같다(grep). `test_chat_stream_status_events_fit_status_payload` |
| `ManualCollectResponse` | 맞음 | `response_model=ManualCollectResponse, response_model_exclude_unset=True` (`backend/app/api/schedule.py:39`), `status` Literal, `other_process` 선택. started 응답에는 `other_process` 가 붙지 않는다(`test_trigger_response_bodies_are_unchanged`) |

#### 11.11.3 m003 판정 규칙과 안전성

| 확인 | 결과 | 근거 |
|---|---|---|
| KST 피드 시각 보정 | 맞음 | 실제 DB 의 m003 전 상태 사본(`agentlens-before.db`)에 돌리면 429행(AI타임스 241, GeekNews 188)이 9시간 당겨지고 `published_at > created_at` 0. 실제 DB 지금 상태도 0, `rss_kr` 피드별 미래 행 0. m003 뒤 수집(crawl 118, 05:01 UTC)의 GeekNews 2행은 발행이 수집보다 1.87·3.23시간 앞이라 두 번 당겨지지 않았다 |
| RSS 150·180, arXiv 120, HF `댓글+40`, 시드 | 맞음 | 옛 수집기는 이 소스의 모든 행에 이 값을 넣었다(`git show HEAD:backend/app/collectors/sources/*.py`). 사본에서 HF 612행 모두 `raw = comments + 40` |
| 트랜잭션·무결성 | 맞음 | `_apply_schema` 가 한 `engine.begin()` 안에서 단계와 `PRAGMA user_version` 을 함께 커밋한다. 옛 DB 사본 0→3: 기사 4355 유지, `integrity_check ok`. 같은 사본에 m003 을 한 번 더 돌려도 같은 해시 |
| hotness 재계산 | 맞음 | 기준 시각 `created_at`, 100 점 행 961 → 3 (옛 DB 사본) |
| 재실행 | 주의 | `user_version` 3 이라 다시 돌지 않는다. 다만 docstring 의 "다시 돌려도 결과가 같다" 는 업그레이드 전 데이터에서만 맞다. 실제 DB 지금 상태 사본에 `user_version=2` 로 되돌려 다시 돌리면 crawl 118 의 실제 GitHub 행 5개 `raw_score` 가 0 이 되고 hotness 82행이 바뀐다 (M003-01 과 같은 원인) |
| **GitHub 합성 지표 규칙** | **결함** | M003-01 |

##### [머지 전 필수] M003-01 m003 의 GitHub 규칙이 실제 검색 결과의 별·포크를 0 으로 지운다
- **위치**: `backend/app/database.py:124-128`
```sql
UPDATE news_items SET raw_score = 0, comments_count = 0 WHERE source = 'github' AND raw_score > 0
AND comments_count = CAST(raw_score * 0.12 AS INTEGER)
AND abs(julianday(created_at) - julianday(published_at)) < 1.0 / 24
```
  테스트 `backend/tests/test_b_round2.py:71-73` 은 "실제 검색 결과는 그대로" 를 별 321·포크 12·3시간 전으로만 본다. 이 값은 비율 조건부터 맞지 않아 규칙을 시험하지 않는다.
- **근거**:
  - 옛 GitHub 검색 수집기(`git show HEAD:backend/app/collectors/sources/github.py:22-45`)는 `sort=updated` 로 방금 갱신된 저장소를 받고 `published_at` = 저장소 `updated_at`, `raw_score` = 실제 별, `comments_count` = 실제 포크를 넣었다. 그래서 검색 결과 대부분이 발행·수집 1시간 안이다. 별이 1~8 이고 포크가 0 이면 `CAST(별 × 0.12)` = 0 = 포크라 비율 조건도 맞는다. 별 512·포크 61 처럼 우연히 맞는 큰 저장소도 있다.
  - 재현 R17 (임시 DB, `_m003_fix_legacy_news_rows` 직접 호출): 검색 결과 (별 3, 포크 0, 10분 전) → `(0, 0)`, (8, 0) → `(0, 0)`, (512, 61, 5분 전) → `(0, 0)`, 감시 저장소 폴백 (5000, 600) → `(0, 0)`, (3, 0, 90분 전) → `(3, 0)`.
  - 재현 R18-a: 루트의 옛 `agentlens.db` 사본(m003 미적용 진짜 값)에서 m003 이 지운 GitHub 행 404개 중 감시 저장소 별 힌트 값(18500·4200·7900·14300·36500·26000·3100·34000)인 합성 행은 8개뿐이고 396개는 실제 별 1~512 였다.
  - 재현 R18-b (사용자 실제 DB, 읽기 조회): 발행·수집 1시간 안 GitHub 행의 별 분포가 m003 전 수집분과 후 수집분에서 크게 다르다.

    | DB·구간 | 행 | 별 0·포크 0 | 별 1~8·포크 0 | 별 > 8 |
    |---|---|---|---|---|
    | 옛 루트 DB (m003 미적용) | 2074 | 812 | 368 | 694 |
    | 실제 DB, m003 전 수집분 (`created_at < 04:50 UTC`) | 2308 | 1366 | **1** | 721 |
    | 실제 DB, m003 뒤 수집분 (crawl 118) | 18 | 4 | 4 | 7 |

    m003 전 수집분에서만 '별 1~8·포크 0' 이 거의 없고 '별 0' 이 많다. 실제 DB 에서도 수백 행의 실제 별·포크가 0 으로 바뀌었을 가능성이 높다 (추정, 적용 전 원본이 없어 행 단위로 확정할 수 없다). TDD 기록의 "GitHub 폴백 8" 은 실제 DB 에서 되짚어 만든 적용 전 사본으로 셌는데, 그 사본은 지워진 실제 값을 복원할 수 없으므로 이 결함을 드러내지 못한다.
- **필수 판단 이유**: 마이그레이션은 한 번 돌고 되돌릴 수 없다. 원천 지표(별·포크)는 `추천순` 정렬과 인기 점수의 입력이고, 지워진 값은 같은 저장소가 다시 수집될 때만 돌아온다(`manager.py` 의 `max(existing, new)`). 이 릴리스를 받는 다른 설치(Docker `/app/data/agentlens.db` 등)에서 같은 손실이 난다.
- **수정 제안**: 규칙을 감시 저장소 폴백 행으로 좁힌다. 폴백 행은 URL 이 `https://github.com/{repo}`(감시 목록)이고 별이 그 저장소의 `stars_hint`(없으면 5000) 그대로다.
```diff
-    connection.execute(text(
-        "UPDATE news_items SET raw_score = 0, comments_count = 0 WHERE source = 'github' AND raw_score > 0 "
-        "AND comments_count = CAST(raw_score * 0.12 AS INTEGER) "
-        "AND abs(julianday(created_at) - julianday(published_at)) < 1.0 / 24"
-    ))
+    from app.services.sources_service import sources_service
+    for repo in sources_service.get_github_config().get("monitored_repos", []):
+        name = repo.get("repo")
+        if not name:
+            continue
+        stars = int(repo.get("stars_hint", 5000) or 5000)
+        # 옛 폴백이 만든 값과 정확히 같은 행만 (별 = stars_hint, 포크 = int(별 × 0.12))
+        connection.execute(text(
+            "UPDATE news_items SET raw_score = 0, comments_count = 0 WHERE source = 'github' "
+            "AND url = :u AND raw_score = :s AND comments_count = :f"
+        ), {"u": f"https://github.com/{name}", "s": stars, "f": int(stars * 0.12)})
```
  `sources.json` 을 읽고 싶지 않으면 최소한 `AND raw_score >= 1000` 을 더한다(합성 값은 3100 이상, 위 표의 오탐 396행은 모두 512 이하). 회귀 테스트에 (별 3, 포크 0, 10분 전)·(별 512, 포크 61, 5분 전) 검색 결과가 그대로 남는 경우를 더한다.
  - 사용자 실제 DB 는 이미 `user_version` 3 이고 KST·HF·RSS 보정은 맞으므로, m003 을 같은 번호로 고쳐도 그 DB 에는 다시 돌지 않는다(m004 불필요). 그 DB 의 지워진 GitHub 지표를 되살리려면 `make reset` 으로 다시 수집하는 수밖에 없다. 할지는 사용자가 정한다.

#### 11.11.4 재현 R16~R18

2026-11-10, 지금 작업 트리 코드, `backend/` 에서 `../.venv/bin/python -I` + 스크래치 스크립트(`scratchpad/repro/r16.py`, `scratchpad/m003/`), `DATABASE_URL` 은 임시 폴더.

| ID | 절차 | 결과 |
|---|---|---|
| R16-A | 세션 POST(`active_source_id` 1, 메시지 1) → 목록, `GET /api/chat/sources/1`, `/api/schedule/status`, `/api/research/audit-logs` | 모든 시각 `+00:00` (예 `2026-11-10T05:16:22.451154+00:00`, 받은 `created_at` `Z` → `2026-11-10T00:00:00+00:00`) |
| R16-B | `append_messages_batch` 가 `RuntimeError` → 업서트 POST('바뀐 제목') → 상세 | 500, `title` `원래 제목` |
| R16-C | 스트림 `session_id` `not-a-uuid` / 대시 없는 32자 hex / 생략 | 400 `ERR_SESSION_INVALID_UUID` / 200 / 200 (뒤 둘은 실제 Anthropic 호출이 일어났다, 위 '주의') |
| R16-D | `GET /openapi.json` | `422` 0개, `400` 19개, `HTTPValidationError`·`ValidationError` 없음 |
| R16-E | 다른 프로세스 `flock` → `POST /api/schedule/trigger` | `already_running`, `other_process: True`, 다른 문장 |
| R16-F | `manager.fcntl = None` 흉내 → 획득·재획득·`is_busy` | 성공 / `None` / `True` / 해제 뒤 성공·`False` |
| R17 | 임시 DB 에 GitHub 행 5개 → `_m003_fix_legacy_news_rows` | 검색 결과 (3,0)·(8,0)·(512,61) 와 폴백 (5000,600) 이 `(0,0)`, 90분 전 (3,0) 만 그대로 |
| R18-a | 옛 루트 DB 사본 0→3 | GitHub 404행 0 처리 중 합성 8, 실제 396 |
| R18-b | 실제 DB 읽기 조회 (위 표) | m003 전 수집분의 '별 1~8·포크 0' 1행 (옛 DB 368, m003 뒤 수집분 4/18) |
| R18-c | 실제 DB 지금 상태 사본에 `user_version=2` 로 m003 재실행 | `raw_score` 5행·hotness 82행 바뀜 (crawl 118 의 실제 GitHub 행 포함) |

#### 11.11.5 2차 재리뷰 지적 수

| 심각도 | 개수 | ID |
|---|---|---|
| 머지 전 필수 | 1 | M003-01 |
| 해결 (11절 권장) | 9 | ARCH-03R, CFG-02R, N-08, N-09, N-10, N-11(KST 보정), N-12, TEST-07, TEST-08 |
| 해결 (추가 항목) | 6 | ADR Q4·Q12·Q13, 스트림 `session_id`, `ChatStatusStep`, `ManualCollectResponse` (Q11 은 N-09 와 같다) |
| 권장 | 0 | — |
| 범위 밖 (수용된 위험) | 6 | 9절, 바뀌지 않음 |

#### 11.11.6 2차 재리뷰 판정

- **판정 결과**: **REQUEST_CHANGES**
- **근거**: 11절 권장 9건과 ADR 열린 질문·계약 정리 항목은 모두 해결됐고 회귀는 없다(`make check` 종료 0, 410 + 820). 남은 것은 M003-01 하나다. 업그레이드 마이그레이션이 실제 GitHub 별·포크를 되돌릴 수 없게 지운다(옛 DB 사본에서 404행 중 396행 오탐, 실제 DB 도 영향 추정). `backend/app/database.py:124-128` 의 규칙을 감시 저장소 폴백 행으로 좁히고 오탐 회귀 테스트를 더하면 APPROVED 로 바꿀 수 있다. 사용자 실제 DB 의 지표 복구(`make reset`)는 사용자 결정이다.
- 수용된 위험 6건(9절)은 판정 근거로 쓰지 않았다.

### 11.12 v0.4.2 3차 재리뷰 (2026-11-10, M003-01 수정분)

- **대상**: `backend/app/database.py` `_m003_fix_legacy_news_rows`(GitHub 규칙), `backend/tests/test_b_round2.py`, 사용자 실제 DB 의 GitHub 지표 복구 결과(B 조 `scratchpad/m003fix/restore_github_metrics.py`, 원본 `scratchpad/m003fix/pre_m003_copy.db`). 코드는 고치지 않았다. 실제 DB 는 `sqlite3 -readonly … ".backup"` 으로 떠서 사본만 조회했다. 재현에서는 LLM 을 부르지 않았다(마이그레이션 함수 직접 호출, `ANTHROPIC_API_KEY` 를 지운 환경).

| 확인 | 결과 | 근거 |
|---|---|---|
| 규칙 | 맞음 | `sources.json` 감시 저장소마다 `url = https://github.com/{repo}`, `raw_score = stars_hint`(없으면 5000), `comments_count = int(별 × 0.12)` 가 모두 같은 행만 0 (`backend/app/database.py` m003 의 GitHub 블록). 옛 폴백 코드(`git show HEAD:backend/app/collectors/sources/github.py:49-70`)가 만든 값과 정확히 같은 조건이다 |
| 재현 R19 (임시 DB, 함수 직접 호출) | 맞음 | 검색 결과 (3,0)·(8,0)·(512,61)·감시 목록 밖 (5000,600) 은 그대로, `modelcontextprotocol/servers` (18500,2220)·`jlowin/fastmcp` (3100,372) 는 `(0,0)`, `jlowin/fastmcp` (3101,372) 는 그대로 |
| 옛 루트 DB 사본 0→3 | 맞음 | GitHub 0 처리 404행 → 8행(모두 별 힌트 값 ≥ 3100), `integrity_check ok` |
| 테스트가 결함을 잡는가 | 잡는다 | 사본에 옛 비율 규칙을 다시 더하면 `tests/test_b_round2.py` `1 failed, 6 passed` (원래 `7 passed`). 테스트에 (3,0)·(8,0)·(512,61)·(900,108) 오탐 행과 `stars_hint` 있는/없는 폴백 (1234,148)·(5000,600) 이 있다 |
| 실제 DB 복구 | 맞음 | 원본 사본(`pre_m003_copy.db`)은 `user_version` 2, GitHub 2510행 중 별 1~8·포크 0 이 438행이라 m003 전 진짜 값으로 보인다. 지금 실제 DB(백업 사본)에서 원본에 값이 있었는데 0 인 GitHub 행은 8개(id 3476~3483, 감시 저장소 별 힌트 값 18500·4200·7900·14300·36500·26000·3100·34000)뿐이다. 원본과 별·포크가 다른 그 밖의 5행(id 335, 381, 517, 1917, 3433)은 모두 원본보다 큰 값이라 원본 뒤 재수집(`max(기존, 새 값)`)으로 보인다. 발행·수집 1시간 안 GitHub 행 분포가 '별 0' 918 / '별 1~8·포크 0' 416 / '별 > 8' 754 로 옛 DB(812/368/694)와 같은 모양이 됐다(2차 때는 1366/1/721). `PRAGMA integrity_check ok`, `user_version` 3 |
| hotness | 맞음 | m003 전 수집 GitHub 2510행 중 2503행이 복구된 지표·`created_at` 기준 새 식과 같다. 다른 7행(id 27, 381, 573, 574, 1276, 4927, 4998)은 원본 뒤 재수집 때 수집기가 그 시각 기준으로 다시 계산한 값으로 보인다(381 은 위 재수집 행) |

- **`make check`**: 2026-11-10 14:2x KST, 이 검토자가 직접 실행, 종료 **0**.
```
============================= 410 passed in 10.85s =============================
 Test Files  70 passed (70)
      Tests  823 passed (823)
$ eslint
EXIT=0
```
  eslint·`tsc --noEmit` 출력 없음. 실행 전후 `git status --porcelain`·`sources.json` 두 곳(Evil Martians 그대로)·`config.json` md5 같음. `git diff HEAD` 해시만 달라졌는데 다른 에이전트가 같은 시각에 파일을 고치고 있었다. 그래서 backend pytest 를 다시 따로 돌려(`410 passed in 10.73s`) 바뀐 파일 전부의 md5 를 전후 비교했고 같았다.
- **지적 수**: 머지 전 필수 0, 권장 0 (M003-01 해결). 범위 밖 6건(9절)은 판정에 넣지 않았다.
- **판정 결과**: **APPROVED**

### 11.13 v0.4.2 4차 재리뷰 (2026-11-10, spec-writer 지적 5건 + D-54)

- **대상**: `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md` [Cycle v0.4.2-B] '4차 수정', `backend/tests/test_b_round4.py`, D-54 (`backend/app/main.py` `redirect_slashes=False`), `backend/app/services/webhook_service.py`, `scripts/collect.py`, `backend/app/collectors/manager.py`, `backend/app/collectors/sources/rss.py`, `backend/app/services/source_researcher.py`, `backend/app/services/deep_researcher.py`. 코드는 고치지 않았다.
- **재현 R20** (`scratchpad/repro/r20.py`): 임시 SQLite. `httpx` 동기·비동기 전송을 모두 예외(`secret-detail …`)로 바꿔 외부 요청이 나갈 수 없게 했고, LLM 키 환경 변수를 지웠다. 평가 함수와 채택 저장(`add_rss_source`)은 흉내로 바꿔 `sources.json` 을 쓰지 않았다.

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | Slack 테스트 문구 | 맞음 | `build_test_payload("slack")` 에 `Must Read` 없음. 대신 일일 브리핑 자동 발송(`auto_dispatch_daily_briefing`) 안내만 있다(`backend/app/services/webhook_service.py:44-50`). 화면 메뉴 이름 '공유 & 알림'(`frontend/src/components/Header.tsx:88`)과 같다 |
| 2 | `make collect` 직접 모드 | 맞음 | 경고가 잠금 동작을 설명한다(`scripts/collect.py:139-140`). 잠금을 못 쥐면 `collect_all` 이 `already_running` 을 돌려주고, 기존 분기(`status != "success"`)가 `수집 실패: status=already_running …` 를 stderr 로 내고 종료 1. `test_collect_script.py::test_direct_mode_with_backend_up_reports_lock` |
| 3 | `category_hint` 기본 카테고리 | 맞음, 평가 통과 항목에만 | 적용 위치가 평가 탈락 `return None` 뒤다(`backend/app/collectors/manager.py:150-165`). 평가가 통과하는데 범주가 `unrelated` 인 경우는 LLM 평가가 통과를 줬지만 범주 이름이 4종 밖일 때뿐이다(휴리스틱 폴백은 범주가 `unrelated` 면 탈락, 사전 필터도 탈락. `llm_processor.py` 평가 함수). 재현 R20-3 (분류기 `unrelated` 인 제목): 평가 탈락 + hint → 저장 안 함, 평가 통과·LLM 범주 무효 + hint `agent_tech` → `agent_tech`, 평가 통과·LLM 범주 `harness` + hint → `harness`(hint 무시), hint 가 4종 밖 → 저장 안 함. RSS 항목에 피드 `category_hint` 를 싣는다(`rss.py:80`). 다른 수집기 항목에는 hint 가 없어 동작이 같다. 참고: 테스트(`test_b_round4.py:33-51`)는 통과 경우만 보고 '평가 탈락 + hint → 걸러짐' 단언은 없다. 코드 순서로 보장되고 재현으로 확인해 지적하지 않는다 |
| 4 | 접속 예외 원문 숨김 | 맞음 | `inspect-url` 은 `URL 에 접속하지 못했습니다. 주소와 네트워크를 확인해주세요.`·`피드를 내려받지 못했습니다.`(`source_researcher.py:62-65`, `:130-131`), 딥 리서치 탐침은 `연결 실패`·`피드 다운로드 실패`(`deep_researcher.py:229-230`, `:276-277`). 원문은 `logger.warning` 에만 있다. 재현 R20-4: 응답에 `secret-detail` 없음, 로그에만 있음. 감사 기록 사유는 `기술 실증 실패: {message}` 라 고정 문장만 들어간다. 두 파일에 응답으로 가는 `{e}`·`str(e)` 0건(grep, 남은 두 곳은 로그) |
| 5 | 자동 채택 저장 실패 | 맞음 | `SourcesWriteError` → `verdict = "WATCHLIST"`, 사유 '채택 기준을 넘었으나(점수 …) sources.json 저장에 실패해 등록하지 못했습니다.', `adopt_failed += 1`, 다음 후보 계속(`deep_researcher.py:466-483`), 요약에 `adopt_failed`(`:512-518`). 재현 R20-5: 요약 `{'evaluated_total': 1, 'auto_adopted': 0, 'adopt_failed': 1}`, 결과·감사 기록 `WATCHLIST`·위 사유, `auto_adopted_count` 0 그대로. 저장 실패 시 `load_sources` 캐시는 파일이 그대로라 바뀌지 않는다 |
| 6 | D-54 `redirect_slashes=False` | 맞음, 깨지는 호출처 없음 | `FastAPI(..., redirect_slashes=False)` (`backend/app/main.py:52`). 런타임 OpenAPI 경로 30개 중 끝이 `/` 인 것은 루트 `/` 하나뿐이다. 재현 R21 (`follow_redirects=False`): `GET /api/news` 200, `GET /api/news/`·`/api/sources/`·`/api/stats/`·`/health/` 404(전에는 307 → 슬래시 없는 경로), `POST /api/sources/github` 404(전에는 307). 호출처 확인(grep): `frontend/src`(테스트·목 제외)의 API URL 템플릿 34개가 모두 슬래시 없이 경로와 정확히 같다(`lib/api.ts`, `lib/chatApi.ts` 등). 빈 `itemId` 로 `/api/sources/{type}/` 가 되는 경우도 `{item_id:path}` 가 빈 값과 맞아 리다이렉트와 상관없다. `frontend/next.config.ts` 는 `trailingSlash` 를 두지 않아 Next 기본값(끝 슬래시 URL 을 슬래시 없는 URL 로 리다이렉트한 뒤 rewrite)이고, rewrite 는 `/api/:path*` → `${backendUrl}/api/:path*` 라 슬래시를 붙이지 않는다. `Makefile`·`scripts/collect.py`·Docker healthcheck 는 `/health`·`/api/schedule/{progress,trigger,reset-and-collect}` 만 부르고, `collect.py:186`·`qa_runner.py:59-61` 은 기준 URL 끝 슬래시를 지운다. `qa_runner.py` 점검 경로 13개도 슬래시 없음(`/api/news/999999999` 는 404 기대, 지금도 404). MCP 서버는 HTTP 를 부르지 않는다(DB 직접). 정적 명세 `docs/system-designer/02_OPENAPI_SPEC.yaml` 에도 끝 슬래시 API 경로가 없다. 그래서 저장소 안에서 리다이렉트에 기대던 호출은 없다. 저장소 밖 사용자 스크립트가 `/api/news/` 처럼 끝 슬래시로 부르던 경우만 404 로 바뀐다(동작 변경, `docs/devops-engineer/01_DEPLOYMENT_SPEC.md` 나 릴리스 노트에 한 줄 적기를 권하지만 지적 수에는 넣지 않는다). `test_deleted_endpoints_answer_404_or_405_without_redirect` 가 지운 11개 경로의 404·405 를 `follow_redirects=False` 로 확인한다 |

- **`make check`**: 이 검토자가 세 번 돌렸다.
  - 첫 실행(14:4x): backend `417 passed`, frontend `ContractAndMsw.test.ts` 2개 실패(`last_run_summary carries adopt_failed (v1.4)`) 로 종료 2. 그 시각에 다른 에이전트가 `frontend/src/tests/chat/ContractAndMsw.test.ts`(14:49:54), `frontend/src/types/news.ts`·`frontend/src/mocks/handlers/ops.ts`(14:50:24)를 고치고 있었다(계약 반영 진행 중). 끝난 뒤 그 파일만 다시 돌려 `136 passed`.
  - 둘째 실행(14:50:59~14:51:35): 종료 0, backend `417 passed`, frontend `70 files / 829 tests`. D-54(`main.py` 14:51:42, 테스트 14:51:35)는 이 실행 뒤에 들어왔다.
  - 셋째 실행(14:53:35~14:54:07, D-54 포함), 종료 **0**:
```
============================= 418 passed in 11.46s =============================
 Test Files  70 passed (70)
      Tests  831 passed (831)
EXIT=0
```
  eslint·`tsc --noEmit` 출력 없음. 셋째 실행 중 다른 에이전트가 `docs/spec-writer/01_PRD.md`·`02_FUNCTIONAL_SPECIFICATION.md`·`frontend/src/tests/modals/NewsDetailModal.test.tsx` 를 고쳤다. backend 파일은 전후 md5 가 같다. 앞서 backend pytest 단독 실행에서도 전후 파일 변화가 없었다(`418 passed in 11.87s`). `sources.json` 두 곳(md5 `32ed0854…`, Evil Martians 그대로)·`config.json`(`0654cac2…`, 버전 0.4.2) 은 이번 리뷰 동안 바뀌지 않았다.
- **지적 수**: 머지 전 필수 0, 권장 0. 범위 밖 6건(9절)은 판정에 넣지 않았다.
- **판정 결과**: **APPROVED**
