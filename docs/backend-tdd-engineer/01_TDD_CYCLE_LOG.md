# AgentLens 백엔드 TDD 사이클 실행 기록서 (Backend TDD Log)

- **작성일자**: 2026-11-09
- **Updated**: 2026-11-09
- **기준**: v0.4.1 (main)
- **작성자**: 백엔드 TDD 엔지니어 (`backend-tdd-engineer`)
- **문서 버전**: v1.0 (as-built: 지금 `backend/tests/` 를 그대로 기록한다)
- **상태**: Draft

이 문서는 지금 저장소의 backend 테스트(`backend/tests/`)를 코드에서 읽어 정리한 기록이다. 새 기능 설계가 아니다. 테스트 목록·대상 코드·외부 의존·커버리지 공백·알려진 위험, 테스트 격리 구성, 그리고 git 이력에서 확인되는 테스트 우선(Red → Green) 사이클을 적는다. 코드 근거는 `path:line` 으로 적고, 2026-11-09 지금 코드와 대조했다.

frontend 테스트(vitest, `frontend/src/tests/**`)와 화면 측정(`frontend/scripts/ui-audit.mjs`)은 이 문서 범위가 아니다 (`docs/frontend-tdd-engineer/` 몫).

---

## 1. TDD 개발 대상 단위 기능 및 엔드포인트

### 1.1 규모 (2026-11-09 실행으로 확인)

| 구분 | 파일 수 | 테스트 수 |
|---|---|---|
| backend (`backend/tests/test_*.py`) | 22 (+ `conftest.py`, 흉내 도움 모듈 `llm_fakes.py`) | 244 (정의된 `test_` 함수 220개, `parametrize` 펼친 수 244). Cycle 6 에서 `test_code_review_fixes.py` 18개, Cycle 7 에서 같은 파일에 9개를 더했다. 아래 2.7·3.1~3.23 은 Cycle 6 이전 217개 기준이다 |

- 그중 Makefile·스크립트·시작 동작 회귀 테스트는 4개 파일 43개다: `test_make_targets.py` 34, `test_collect_script.py` 5, `test_startup_seed.py` 2, `test_sources_write_fallback.py` 2.
- 개수 확인: `python3 .claude/skills/backend-tdd-workflow/scripts/run_backend_tdd.py --phase green` 출력의 파일별 PASSED 줄 수 (아래 2.7).

### 1.2 대응 기능 (도메인 코드 ↔ 테스트 파일)

단위 기능 ID(`FUNC-<코드>-NNN`)는 FSD 가 정한다. 여기서는 도메인과 FSD 파일까지만 대응시킨다.

| 도메인 | 코드 | FSD | 테스트 파일 |
|---|---|---|---|
| 뉴스 피드 | NEWS | `docs/spec-writer/fsd/01_NEWS_FEED_SPECIFICATION.md` | `test_api.py` (news·stats·rss·ask), `test_reset_and_delete.py` (`DELETE /api/news/all`), `test_trends_and_webhook.py` (트렌드 레이더) |
| AI 챗 | CHAT | `docs/spec-writer/fsd/02_AI_CHAT_SPECIFICATION.md` | `test_code_review_fixes.py` (BUG-02·02R·06·07·08), `test_chat.py`, `test_chat_sessions.py`, `test_agentic_workflow.py`, `test_anthropic_provider.py`, `test_dynamic_rag_retrieval.py`, `test_scoped_chat_grounding.py`, `test_llm_provider_isolation.py`, `test_llm_processor.py` (챗 e2e 부분) |
| 수집·분류·요약 | COLL | `docs/spec-writer/fsd/03_COLLECTION_SPECIFICATION.md` | `test_collectors.py`, `test_llm_processor.py`, `test_scheduler.py`, `test_reset_and_delete.py` (`reset-and-collect`), `test_startup_seed.py`, `test_collect_script.py`, `test_config_and_live_llm.py` |
| 브리핑·공유 | BRF | `docs/spec-writer/fsd/04_BRIEFING_AND_SHARING_SPECIFICATION.md` | `test_briefing_notion_email.py`, `test_api.py::test_daily_briefing_endpoint`, `test_trends_and_webhook.py` (웹훅) |
| 소스·딥 리서치 | SRC | `docs/spec-writer/fsd/05_SOURCES_AND_RESEARCH_SPECIFICATION.md` | `test_code_review_fixes.py` (BUG-03·04·05), `test_sources_and_research.py`, `test_deep_researcher.py`, `test_sources_write_fallback.py` |
| MCP 서버 | MCP | `docs/spec-writer/fsd/06_MCP_SERVER_SPECIFICATION.md` | `test_api.py::test_mcp_info` |
| (운영) Makefile·compose | — | — | `test_make_targets.py` |

### 1.3 대상 파일

- 라우터: `backend/app/main.py`(`/health`, lifespan), `backend/app/api/{news,chat,schedule,stats,mcp,briefing,research,sources,trends,webhook}.py`
- 서비스: `backend/app/services/{chat_service,chat_session_service,retriever,scraper,agentic_search,llm_processor,briefing_service,notion_service,email_service,webhook_service,trend_service,sources_service,source_researcher,deep_researcher}.py`, `backend/app/services/llm_providers/{anthropic_provider,base}.py`
- 수집: `backend/app/collectors/categorizer.py`, `backend/app/collectors/manager.py`(`collect_all` 은 흉내로만), `backend/app/scheduler.py`(상수만)
- 설정·DB: `backend/app/config.py`, `backend/app/database.py`, `backend/app/models`, `backend/app/schemas/chat.py`
- 저장소 루트: `Makefile`, `docker-compose.yml`, `scripts/collect.py`, `scripts/dev.sh`

### 1.4 검사 명령과 pytest 구성

- 전체: `make check` (backend pytest 다음 frontend `pnpm test && pnpm lint && pnpm exec tsc --noEmit`. 하나라도 실패하면 0 이 아닌 값으로 끝난다, `Makefile:98-101`). `make test` 는 `check` 를 전제 조건으로 둔 빈 대상이다 (`Makefile:44`).
- backend: `cd backend && ../.venv/bin/pytest -v tests/`
- TDD 단계 스크립트: `python3 .claude/skills/backend-tdd-workflow/scripts/run_backend_tdd.py --phase red|green|check [-- pytest 인자]`. `backend/` 에서 `../.venv/bin/pytest -v`(없으면 `python -m pytest -v`)를 돌린다. 인자가 없으면 `tests/` 전체. `red` 는 pytest 종료 1(단언 실패)일 때만 성공이고 종료 0(통과)·그 밖의 코드(수집·사용법 오류)는 실패로 본다. `green` 은 종료 0 일 때만 성공.
- `backend/pytest.ini`: `pythonpath = .`, `asyncio_mode = auto`, `asyncio_default_fixture_loop_scope = function`.
- backend 용 lint·typecheck 명령은 없다 (미정).
- 마커: `skip`·`xfail` 마커가 없다. `make check` 는 마커 구분 없이 `pytest -v tests/` 를 돈다. 라이브 호출 테스트를 따로 고르는 마커·설정이 없다 (`Makefile` check, `backend/pytest.ini`). 실행 중 건너뛰기는 `test_make_targets.py::test_t4_compose_config_is_valid` 의 `pytest.skip`(docker CLI 가 없을 때) 하나다.
- 라인 커버리지 도구(`pytest-cov`, `coverage`)는 `.venv` 에 설치돼 있지 않다 (`import pytest_cov`, `import coverage` 모두 `ModuleNotFoundError`, 2026-11-09).

---

## 2. Red-Green-Refactor 사이클 실행 기록

### 2.0 이력에서 확인한 것과 확인하지 못한 것

- `main` 의 `git log --oneline -- backend/tests/` 는 10개 커밋이다. `test:` 로 시작하는 커밋이 없다. v0.1.0~v0.3.1 커밋은 테스트와 코드를 같은 커밋에 넣었다:

| 커밋 | 날짜 | 제목 (요지) | test 파일 수 / `def test_` 수 | 테스트 우선 순서 |
|---|---|---|---|---|
| `18f46fc` (v0.1.0) | 2026-09-16 | 첫 커밋 | 10 / 51 | 확인하지 못함 (코드·테스트 한 커밋) |
| `44507de` | 2026-10-19 | Claude 3-Tier 라우팅, anti-gemini | 14 / 141 | 확인하지 못함 (`test_agentic_workflow.py`·`test_anthropic_provider.py`·`test_chat.py`·`test_chat_sessions.py`·`test_llm_processor.py` 와 `api/chat.py`·서비스가 한 커밋) |
| `1046945` (v0.2.0) | 2026-10-19 | Claude 5.5 모델 ID | 14 / 142 | 확인하지 못함 |
| `d86c541` (v0.2.1) | 2026-10-19 | scoped 그라운딩, mock 프로바이더 제거 | 15 / 147 | 확인하지 못함 (`test_scoped_chat_grounding.py` 추가) |
| `b46b6e7` (v0.2.2) | 2026-10-19 | 동적 RAG, Gemini 복원 | 16 / 154 | 확인하지 못함 (`test_dynamic_rag_retrieval.py` 추가) |
| `20eec54` (v0.3.0) | 2026-10-19 | ReAct 챗, scoped 단일 기사 | 16 / 159 | 확인하지 못함 |
| `017b076` (v0.3.1) | 2026-10-19 | 비동기 ReAct planner, 인용 필터 | 16 / 160 | 확인하지 못함 |
| `c605577` | 2026-10-20 | 산출물 정리 | 16 / 160 | 해당 없음 |
| `94fdf8e` | 2026-11-09 | UI 재설계, LLM 테스트 격리, make 대상 정상화 (squash) | 21 / 196 | squash 전 커밋에서 확인 (2.1~2.5) |
| `3973ae9` (v0.4.0) | 2026-11-09 | 릴리스 (버전 단언 0.4.0) | 21 / 196 | 해당 없음 |

- v0.3.1 기록서(옛 하네스 산출물)는 Cycle 8~15 의 Red·Green 출력을 적었지만, 위처럼 git 에서는 테스트와 코드가 같은 커밋이라 순서를 확인할 수 없다. 그 기록의 일부 내용은 지금 코드와 다르다: `MockLLMProvider` 폴백(Zero 503)은 v0.2.1 에서 지워졌고(`test_mock_llm_provider_removed_from_app_services`, `test_mock_llm_provider_removed_from_production` 이 import 실패를 단언), Gemini 호출 `_call_gemini` 은 v0.2.2 에서 복원됐다(`test_gemini_call_restored_and_invokes_specified_model`). 그 기록의 라인 커버리지 수치(`pytest --cov`)는 지금 `.venv` 에 `pytest-cov` 가 없어 다시 잴 수 없다.
- v0.4.0 작업(2026-11-08~09)은 `refactoring` 브랜치에서 기능별로 테스트 커밋 → 코드 커밋 순서로 진행한 뒤 `94fdf8e` 로 squash 됐다. squash 전 커밋은 reflog 에 남아 있다 (`git log --reflog -- backend/tests/`). 아래 사이클은 그 커밋들과, 그때 커밋된 task 기록(`b439370^:tasks/<기능>/*.md`)·verify 기록(`9e0c9e5^:docs/features/<기능>/verify.md`)을 근거로 한다.

| 순서 | 커밋 (reflog) | 시각 (+0900) | 종류 |
|---|---|---|---|
| 1 | `89dc2ad` | 2026-11-08 00:13 | test(backend-llm-test-isolation): LLM 흉내 도구와 실패하는 회귀 테스트 |
| 2 | `a59273b` | 2026-11-08 00:15 | test(backend-llm-test-isolation): autouse 격리 하네스와 sources 거울 경로 속성 |
| 3 | `fefa8db` | 2026-11-08 00:20 | fix(backend-llm-test-isolation): LLM 설정 해석 함수와 Ollama 설정 모델 판정 |
| 4 | `49e6b1a` | 2026-11-08 23:45 | test(make-targets): T7 빈 DB 첫 수집, T8 EBUSY 대체 경로 |
| 5 | `39f2f68` | 2026-11-08 23:45 | test(make-targets): Makefile·compose T1~T5 (고치기 전 실패 확인) |
| 6 | `0a2e714` | 2026-11-08 23:46 | fix(make-targets): 빈 DB 첫 수집 백그라운드, sources.json 제자리 쓰기 대체 |
| 7 | `bc0f699` | 2026-11-08 23:46 | test(make-targets): T6 `scripts/collect.py` (스크립트 없어 실패) |
| 8 | `acd35b0` | 2026-11-08 23:46 | feat(make-targets): `scripts/collect.py` 추가 |
| 9 | `c949816` | 2026-11-08 23:48 | fix(make-targets): Makefile 대상 12개 정리, compose `config.json` 쓰기 허용 |
| 10 | `106098a` | 2026-11-08 23:50 | fix(make-targets): `scripts/dev.sh` 추가 |
| 11 | `517c226` | 2026-11-09 00:16 | test(make-targets): docker-logs 종료 130 회귀 테스트 (고치기 전 실패 확인) |
| 12 | `f9394fd` | 2026-11-09 00:17 | fix(make-targets): docker-logs 가 종료 130 을 정상 종료로 처리 |

### [Cycle 1] LLM 프로바이더 판정과 테스트 격리 (backend-llm-test-isolation)

#### 1. RED Phase
- **작성된 테스트** (`89dc2ad`): `backend/tests/llm_fakes.py`(흉내 전송 계층), `backend/tests/conftest.py` 의 `fake_llm`·`llm_sources`(이때는 autouse 아님), `backend/tests/test_llm_provider_isolation.py` 14개 (T1~T8, T5 두 경우, 탐침 1회·1.0초, API 503 두 개, 가드). 모든 행 테스트는 fixture `gemini_spy` 로 `_call_gemini` 호출 0회를 단언한다.
- **실행 결과 (실패 확인)** — `cd backend && ../.venv/bin/pytest tests/test_llm_provider_isolation.py -q -rf --tb=line`:
```
FAILED tests/test_llm_provider_isolation.py::test_t4_missing_ollama_model_is_unavailable
FAILED tests/test_llm_provider_isolation.py::test_t5_installed_ollama_model_used[config_model]
FAILED tests/test_llm_provider_isolation.py::test_t7_ollama_url_from_config_json_when_settings_empty
FAILED tests/test_llm_provider_isolation.py::test_t7b_empty_overrides_disable_openai_and_ollama
FAILED tests/test_llm_provider_isolation.py::test_api_chat_stream_503_when_ollama_model_missing
FAILED tests/test_llm_provider_isolation.py::test_api_chat_query_503_when_ollama_model_missing
6 failed, 8 passed in 0.96s
```
- **실패 이유 (코드 결함, 기대와 같음)**: T4 `has_live_provider()` 가 `/api/tags` 200 만 보고 True (`assert True is False`). T5 `[config_model]` `_call_ollama` 가 `settings.OLLAMA_MODEL` 만 봐 흉내 404 → `LLMUpstreamException`. T7 `_call_ollama` 가 `settings` 다음에 `self.ollama_url`(None) 을 봐 주소 없음. T7b 덮어쓰기보다 `settings` 의 OpenAI 키가 앞섬. API stream 은 plan 예상(502)과 달리 `assert 200 == 503`: 사전 판정이 True 라 스트림이 열리고 스트림 안에서 SSE 오류가 났다 (`chat_service.py:760` `Mid-stream LLM exception`). 단언(503)은 바꾸지 않았다. API query 는 `assert 502 == 503`.
- 같은 시점 전체 실행(하네스 전): `8 failed, 166 passed in 105.03s` — 위 6개와 `test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer`, `test_anti_gemini_isolation_in_stream_tokens`. 실행 뒤 `sources.json`·`backend/app/config/sources.json` 이 바뀌어 `git checkout` 으로 되돌렸다 (하네스 전이라 예상대로).
- **하네스 단계** (`a59273b`, 여전히 Red): autouse `llm_isolation`, 세션 사본 `settings_file_copies`, `SourcesService._mirror_path` 속성. 관문 G1: 환경 조건 C1~C6(그대로 / `OLLAMA_BASE_URL=http://127.0.0.1:9` / `OLLAMA_MODEL=gpt-oss:20b` / 키 비우고 Ollama 끔 / 키 비우고 다른 모델 / OpenAI 키만) 모두 `6 failed, 168 passed` (6.28~7.24s), 실패 목록은 위 6개와 같고 설정 파일 `git status` 출력은 여섯 번 모두 비었다. 실행 시간은 하네스 전 105.03s → 6~7s.

#### 2. GREEN Phase
- **구현 내용 요약** (`fefa8db`, `backend/app/services/llm_processor.py` 만): 덮어쓰기 자리 `openai_key`·`ollama_url`(None), 해석 함수 4개 `_resolve_openai_key`·`_resolve_openai_chat_model`·`_resolve_ollama_url`·`_resolve_ollama_generate_model` (`llm_processor.py:129-169`), `_ollama_status(url, model)` 가 `httpx.Client(timeout=1.0)` 로 `/api/tags` 한 번 보고 설정 모델 설치 여부까지 판정 (`llm_processor.py:171-194`, `:177`), `has_live_provider` 가 False 면 판정 이유를 남기고 `check_provider_available` 이 WARNING 로그 뒤 `LLMProviderUnavailableException`.
- **실행 결과** — `cd backend && ../.venv/bin/pytest -v -p no:cacheprovider tests/test_llm_provider_isolation.py`: `14 passed in 0.95s`. 단계 1 테스트 파일은 `89dc2ad` 뒤 diff 0줄.
- 관문 G2: C1~C6 모두 `174 passed` (6.36~9.48s), 설정 파일 `git status` 출력 없음. C1 `make check` 종료 0 (backend `174 passed in 5.99s`, frontend `649 passed`, eslint `0 errors, 41 warnings`).

#### 3. REFACTOR Phase
- 해석 함수 이름을 plan 의 `_resolve_openai_model`·`_resolve_ollama_model` 에서 `_resolve_openai_chat_model`·`_resolve_ollama_generate_model` 로 바꿨다 (plan 증명 grep 패턴에 호출부가 걸려서. 동작·원천 순서는 같다).
- `stream_tokens`·`stream_question_answer` 에서 쓰는 곳이 없어진 `json_cfg = load_json_config()` 줄을 지웠다.
- 회귀 검증: verify 기록에서 `make check` 종료 0 (backend `174 passed in 7.22s`). 고치기 전(HEAD `a6526b4`) `make check` 는 종료 2 였다 (`2 failed, 158 passed`, anti-gemini 두 테스트 `LLMUpstreamException`). `make check` 밖에서 손으로 돌린 실제 Claude 스모크: `generate_live_answer`·`stream_tokens` 모두 `'OK' claude-haiku-5-5`.

### [Cycle 2] 빈 DB 첫 수집 백그라운드화와 sources.json 저장 대체 경로 (make-targets T7·T8)

#### 1. RED Phase
- **작성된 테스트** (`49e6b1a`): `backend/tests/test_startup_seed.py` (T7, 2개), `backend/tests/test_sources_write_fallback.py` (T8, 2개).
- **실행 결과 (실패 확인)** — `cd backend && ../.venv/bin/pytest -v tests/test_startup_seed.py tests/test_sources_write_fallback.py`:
```
E               TimeoutError
...
>       assert sources_service.save_sources(data) is True
E       AssertionError: assert False is True
...
ERROR    agentlens.sources:sources_service.py:122 Failed to write sources to /private/var/folders/.../settings_files0/sources.json: [Errno 16] Device or resource busy
FAILED tests/test_startup_seed.py::test_empty_db_seed_runs_in_background_and_is_cancelled_on_shutdown
FAILED tests/test_sources_write_fallback.py::test_save_sources_falls_back_to_in_place_write_on_ebusy
========================= 2 failed, 2 passed in 1.30s ==========================
```
- 실패 이유가 기대한 결함과 같다: 빈 DB 면 lifespan 이 `collect_all` 을 await 해서 1초 안에 들어가지 못함, EBUSY 면 `save_sources` 가 예외를 잡고 False. 기사 있음·평소 rename 경우는 고치기 전에도 통과 (회귀 보호).

#### 2. GREEN Phase
- **구현 내용 요약** (`0a2e714`): `backend/app/main.py` 가 개수만 세고 0건이면 `asyncio.create_task(collector_manager.collect_all())` 로 백그라운드 수집, 종료 때 끝나지 않은 태스크를 취소 (`main.py:23-47`). `sources_service.save_sources` 가 `replace` 의 `OSError` 에 경고 로그 후 제자리 쓰기 (`sources_service.py:102-132`).
- **실행 결과**: `test_startup_seed.py`·`test_sources_write_fallback.py`·`test_reset_and_delete.py`·`test_sources_and_research.py` `12 passed in 0.88s`, `test_api.py` `9 passed in 0.24s`.

#### 3. REFACTOR Phase
- 별도 리팩터 없음. 첫 수집 태스크 예외는 기존 시작 로그와 같은 `print` 형식으로 남겼다 (`main.py` 에 logger 가 없음).

### [Cycle 3] Makefile·docker-compose 회귀 (make-targets T1~T5)

#### 1. RED Phase
- **작성된 테스트** (`39f2f68`): `backend/tests/test_make_targets.py` (이때 30개).
- **실행 결과** — `cd backend && ../.venv/bin/pytest -v tests/test_make_targets.py` → 종료 1, `10 failed, 20 passed in 0.29s`. 커밋 메시지 요약: `.PHONY` 누락, `SHELL` 없음, `test` 가 없는 `scripts/test.sh` 를 부름, `scripts/*` 없음, `|| true`, `config.json:ro`, `reset` 대상 URL 하드코딩.
- 실패 10개: `test_t1_phony_targets_match_list`, `test_t1_shell_is_bash`, `test_t2_test_target_equals_check`, `test_t3_referenced_file_exists[scripts/dev.sh]`, `[scripts/collect.py]`, `test_t3_dev_script_is_executable_and_parses`, `test_t3_collect_script_compiles`, `test_t4_makefile_has_no_or_true`, `test_t4_compose_config_json_is_writable`, `test_t5_reset_uses_api_url_variable`.

#### 2. GREEN Phase
- **구현** (`c949816` Makefile 대상 12개·compose `:rw`, `acd35b0` `scripts/collect.py`, `106098a` `scripts/dev.sh`).
- **실행 결과**: `30 passed in 0.27s`.

#### 3. REFACTOR Phase
- 해당 없음. `make -n` 을 부르는 도움 함수가 부르기 전마다 Makefile 안전 단언(`$(MAKE)`·`$(shell`·`+` 접두 없음)을 하도록 했다 (테스트 쪽 결정).

### [Cycle 4] `scripts/collect.py` (make-targets T6)

#### 1. RED Phase
- **작성된 테스트** (`bc0f699`): `backend/tests/test_collect_script.py` 5개.
- **실행 결과**: `5 errors in 0.06s`. 다섯 개 모두 fixture `mod` 에서 `FileNotFoundError: .../scripts/collect.py` (스크립트 없음, 기대한 이유). 이 실패는 단언 실패(종료 1)가 아니라 fixture 오류라, 지금 `run_backend_tdd.py --phase red` 기준으로는 Red 로 인정되지 않는 형태다.
- 테스트를 커밋하기 전에 초안 스크립트로 5개가 통과하는지 먼저 확인했다 (테스트 자체 오류를 거르려고). 커밋 순서는 테스트(`bc0f699`) → 코드(`acd35b0`).

#### 2. GREEN Phase
- **구현** (`acd35b0`): `scripts/collect.py` `main(env=None) -> int`, 모드 `auto`/`api`/`direct`, `reset-and-collect` 는 부르지 않음.
- **실행 결과**: `5 passed in 2.77s`.

#### 3. REFACTOR Phase
- 해당 없음.

### [Cycle 5] `make docker-logs` 사용자 중지(종료 130) (make-targets T5b)

#### 1. RED Phase
- **작성된 테스트** (`517c226`): `test_t5b_docker_logs_user_stop_is_success` (docker 종료 0→0, 130→0, 1→1, 2→2. 가짜 `docker` 를 PATH 앞에 둔다).
- **실행 결과**: 종료 1, `1 failed, 33 passed`. 실패는 `test_t5b_docker_logs_user_stop_is_success[130-0]` 하나, `assert 130 == 0` (레시피가 `docker compose logs -f --tail=200` 뿐이라 130 을 그대로 전달).

#### 2. GREEN Phase
- **구현** (`f9394fd`): `trap ':' INT` 를 건 셸에서 `docker compose logs $(DOCKER_LOGS_ARGS)` 를 돌리고 130 이면 종료 0, 그 밖에는 docker 종료 코드를 그대로 (`Makefile:90-96`).
- **실행 결과**: `34 passed in 0.96s`.

#### 3. REFACTOR Phase
- 해당 없음.

### [Cycle 6] 코드 리뷰 '머지 전 필수' 결함 BUG-02~08 회귀 테스트와 수정 (TEST-01)

근거: `docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md` 2.2절(BUG-02~08), 2.7절(TEST-01). 테스트 파일 `backend/tests/test_code_review_fixes.py` 하나에 결함별 테스트를 두고, 흉내 Claude(`backend/tests/llm_fakes.py`)에 스트림 끝 모양 두 가지를 더했다: `claude_stream_stop_reason`(기본 `end_turn`), `claude_stream_error`(설정하면 첫 `content_block_delta` 뒤에 SSE `error` 이벤트를 보내고 끝낸다). 요청·응답 필드(계약)는 바꾸지 않았다. 커밋하지 않았다 (Red·Green 을 같은 작업 트리에서 실행으로 확인).

#### 1. RED Phase
- **작성된 테스트** (18개, `backend/tests/test_code_review_fixes.py`):

| 결함 | 테스트 | 단언 |
|---|---|---|
| BUG-02 | `test_session_upsert_with_existing_message_ids_is_idempotent` | 같은 세션에 메시지 2개 POST → 이전 2개 id 를 포함한 4개 POST 가 201, 응답 `messages` id 4개(갱신 뒤 상태)·`title` 갱신, 같은 요청 반복도 201·4개, 상세 조회와 DB 행 4개 |
| BUG-03 | `test_deep_research_resets_running_flag_on_error` | `probe_and_discover_feed` 가 예외 → 예외는 그대로 올라오고 `is_running is False`, 다음 실행이 `already_running` 이 아니다 |
| BUG-04 | `test_deep_research_evaluates_mined_candidates` | 발굴 URL 2개 흉내, `max_candidates=6` → 탐침 목록에 발굴 URL 2개 포함, 탐침 6개(컷 유지) |
| BUG-05 | `test_toggle_and_delete_github_repo_with_slash`, `test_toggle_rss_feed_by_url_id`, `test_toggle_unknown_repo_still_404` | `owner%2Frepo` 토글·삭제 200 과 `sources.json` 사본 반영, URL id(`https%3A%2F%2F…`) RSS 토글 200, 없는 저장소는 서비스의 404 `{"detail":"Source not found or invalid type"}` |
| BUG-06 | `test_chat_stream_invalid_model_tier_returns_400`, `test_chat_stream_non_object_body_returns_400`, `test_chat_stream_invalid_field_returns_400` | 400 과 챗 오류 형식 `{error_code, message, details}`: 잘못된 `model_tier` 는 `ERR_INVALID_MODEL_TIER`, 본문 `["x"]`·`top_k: 99` 는 `ERR_INVALID_PAYLOAD` |
| BUG-07 | `test_ask_stream_partial_failure_does_not_append_fallback`, `test_ask_stream_openai_partial_failure_does_not_append_fallback`, `test_ask_stream_failure_before_tokens_still_falls_back` | Anthropic(또는 OpenAI)이 토큰 뒤 예외 → `meta` 1개, 토큰은 보낸 부분만, `done` 없음, `_qa_cache` 비어 있음. 토큰 전 실패는 지금처럼 휴리스틱 답과 `done`·캐시 1개 (회귀 방지, Red 에서도 통과) |
| BUG-08 | `test_anthropic_stream_overloaded_error_event_raises`, `test_anthropic_stream_error_event_raises`, `test_anthropic_stream_max_tokens_raises_truncated`, `test_chat_stream_truncated_answer_ends_with_error_not_done`, `test_chat_stream_anthropic_error_event_ends_with_error_not_done`, `test_chat_stream_end_turn_still_completes` | 공급자: `overloaded_error` 이벤트 → `AnthropicOverloadedException`, 그 밖의 `error` 이벤트와 `stop_reason=max_tokens` → `AnthropicStreamError` (앞서 받은 토큰은 그대로 yield). `POST /api/chat/stream`(흉내 Claude): 잘린 답·`error` 이벤트는 마지막이 `event: error`(`ERR_LLM_STREAM_FAILED`), `done` 없음, 메시지 저장 0개. `end_turn` 은 지금처럼 `done`·저장 2개 (회귀 방지, Red 에서도 통과) |

- **실행 결과**: `python3 .claude/skills/backend-tdd-workflow/scripts/run_backend_tdd.py --phase red -- tests/test_code_review_fixes.py` → pytest 종료 1, `16 failed, 2 passed in 1.77s`, `✅ RED 확인`. 실패 이유(요지):
```
BUG-02  sqlalchemy.exc.PendingRollbackError ... (sqlite3.IntegrityError) UNIQUE constraint failed: chat_messages.id
BUG-03  assert True is False  (… AutonomousDeepResearcher … .is_running)
BUG-04  assert {'https://min...-two.example'} <= {'https://dee...-us/research'}  Extra items in the left set: 'https://mined-one.example', 'https://mined-two.example'
BUG-05  AssertionError: {"detail":"Not Found"}  assert 404 == 200   (토글·URL id 토글)
        {'detail': 'Not Found'} != {'detail': 'Source not found or invalid type'}   (라우트 불일치)
BUG-06  pydantic_core._pydantic_core.ValidationError: 1 validation error for ChatStreamRequest  model_tier  Input should be 'haiku', 'sonnet' or 'opus'
        AttributeError: 'list' object has no attribute 'get'
        ValidationError … top_k  Input should be less than or equal to 10
BUG-07  Left contains one more item: {'event': 'meta', 'model': 'AgentLens Heuristic Engine'}
        assert 2 == 1  (len([{'event': 'meta', 'model': 'OpenAI gpt-4o-mini'}, {'event': 'meta', 'model': 'AgentLens Heuristic Engine'}]))
BUG-08  Failed: DID NOT RAISE AnthropicOverloadedException / DID NOT RAISE Exception (×2)
        assert 'done' not in ['status', 'status', 'token', 'token', 'token', 'done']   (max_tokens)
        assert 'done' not in ['status', 'status', 'token', 'done']                     (error 이벤트)
```
  BUG-06 의 예외는 ASGI 테스트 클라이언트가 앱 예외를 다시 던진 것이다 (서버에서는 전역 처리기의 500). 모두 결함 자체를 드러내는 실패이고 import·수집 오류는 없다.

#### 2. GREEN Phase
- **구현**:
  - BUG-02 `backend/app/services/chat_session_service.py`: `append_messages_batch` 가 받은 id 중 이미 DB 에 있는 것(과 같은 요청 안에서 앞서 넣은 것)은 건너뛴다. `get_session_detail` 의 select 에 `execution_options(populate_existing=True)` 를 달아 같은 요청에서 먼저 읽은 `messages` 컬렉션 대신 DB 의 지금 상태를 돌려준다.
  - BUG-03 `backend/app/services/deep_researcher.py`: `run_deep_research` 가 본문을 `_run_cycle` 로 옮겨 `try/finally` 로 부르고 `finally` 에서 `is_running = False`. 예외는 그대로 올라간다.
  - BUG-04 같은 파일: 후보 목록을 발굴 URL → 시드 순서로 만든다 (컷 `max_candidates` 와 그 밖의 동작은 그대로).
  - BUG-05 `backend/app/api/sources.py`: `PATCH /{source_type}/{item_id:path}/toggle`, `DELETE /{source_type}/{item_id:path}`.
  - BUG-06 `backend/app/api/chat.py` (`POST /api/chat/stream` 만): 본문이 dict 가 아니면 400 `ERR_INVALID_PAYLOAD`. 기존 질문·스코프 검사 뒤 `ChatStreamRequest(**body)` 를 `try` 로 감싸 `ValidationError` 를 400 으로 (`model_tier` 오류는 `ERR_INVALID_MODEL_TIER`, 그 밖은 `ERR_INVALID_PAYLOAD`, `details: null`). 검증이 scoped 기사 확인·LLM 가용성 확인보다 앞으로 왔다.
  - BUG-07 `backend/app/services/llm_processor.py` `stream_question_answer`: Anthropic·OpenAI 단계의 `except` 에서 이미 보낸 토큰(`full_text`)이 있으면 바로 끝낸다 (다음 엔진·휴리스틱·`done`·`_qa_cache` 없음). 토큰 전 실패는 지금처럼 다음 엔진으로.
  - BUG-08 `backend/app/services/llm_providers/anthropic_provider.py`: 새 예외 `AnthropicStreamError`. 스트림의 `error` 이벤트는 `overloaded_error` 면 `AnthropicOverloadedException`, 그 밖은 `AnthropicStreamError`. `message_delta.delta.stop_reason` 을 기억해 스트림이 끝난 뒤 `max_tokens` 면 `AnthropicStreamError`. 호출부는 바꾸지 않았다: `stream_tokens` 가 토큰 뒤 예외를 `LLMStreamFailedException` 으로 바꾸고(`llm_processor.py:439-441`) `chat_service.stream_chat` 이 기존 `event: error`(`ERR_LLM_STREAM_FAILED`)를 보내고 저장하지 않는다. 토큰 전 `overloaded_error` 는 HTTP 529 와 같이 그대로 올라가고, 토큰 전 그 밖의 `error` 는 지금처럼 다음 프로바이더로 넘어간다. Ask AI 스트림에서는 BUG-07 경로로 끝난다.
- **실행 결과**: 결함마다 `--phase green -- tests/test_code_review_fixes.py -k <결함>` 로 확인했다 (BUG-02 `1 passed`, BUG-03 `1 passed`, BUG-03+04 `2 passed`, BUG-05 `3 passed`, BUG-06 `3 passed`, BUG-07 `3 passed`, BUG-08 `6 passed`). 파일 전체:
```
============================== 18 passed in 0.81s ==============================
✅ GREEN 확인: 테스트가 모두 통과했다.
```

#### 3. REFACTOR Phase
- BUG-06 의 `ValidationError` 분기를 `any(err["loc"][:1] == ("model_tier",) …)` 한 줄로 줄이고 `details` 를 다른 챗 오류와 같이 `null` 로 맞췄다. `existing_ids` 에 타입 힌트(`set[str]`).
- **회귀 검증**: `--phase green` 전체 `235 passed in 12.87s`. `make check` 종료 0: backend `235 passed in 10.13s`, frontend `Test Files 54 passed (54)`·`Tests 654 passed (654)`, eslint `✖ 40 problems (0 errors, 40 warnings)`, `tsc --noEmit` 출력 없음. 실행 뒤 `git status` 에 `config.json`·`sources.json`·`backend/app/config/sources.json` 변경 없음.
- **남은 것**: 리뷰 보고서가 함께 제안한 것 중 계약 변경이거나 이번 범위 밖인 것은 하지 않았다: `done` 에 메시지 id 싣기·`truncated` 필드(BUG-02·08), Ask AI 스트림의 `error` 이벤트(BUG-07, 지금은 `done` 없이 끝낸다), `research.py` 의 `create_task` 참조 보관과 `max_candidates` 범위 검사(BUG-03·04), 이미 모니터링 중인 주소 거르기(BUG-04), `/api/chat/query`·`/api/chat/search` 의 같은 검증 500(BUG-06 근거에 적힌 것). 서버 `persist_turn` 과 프론트 세션 POST 가 같은 턴을 서로 다른 id 로 저장하는 이중 저장은 backend 업서트만으로는 막을 수 없다 (frontend 가 한 턴에 POST 1번으로 고치는 중).

### [Cycle 7] BUG-02R 스트림 서버 저장과 프론트 세션 POST 의 같은 턴 이중 저장 (클라이언트 메시지 id)

근거: `docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md` 10.2절(BUG-02R, 재현 R10: 두 턴에 메시지 8개), 계약 `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` 8.1절(v1.1, `ChatStreamRequest` 에 `user_message_id`·`assistant_message_id`). frontend zod·MSW·계약 테스트는 contract-integrator 가 먼저 반영했다. 커밋하지 않았다.

#### 1. RED Phase
- **작성된 테스트** (`backend/tests/test_code_review_fixes.py` 끝에 9개, parametrize 펼친 수):

| 테스트 | 단언 |
|---|---|
| `test_stream_with_client_ids_then_session_post_saves_each_turn_once` | 턴마다 클라이언트 id(`msg-user-…`, `msg-asst-…`)로 `POST /api/chat/stream` → 그 턴까지의 전체 메시지를 같은 id 로 `POST /api/chat/sessions`, 두 턴 반복 → 상세 메시지 id 가 클라이언트 id 4개, 목록 `message_count` 4, DB 행 4 |
| `test_stream_after_session_post_with_same_ids_does_not_duplicate` | 세션 POST 가 먼저 같은 id 로 저장 → 스트림이 `done` 으로 끝나고 행 2 |
| `test_persist_turn_with_existing_ids_returns_without_index_error` | `persist_turn(user_message_id=…, assistant_message_id=…)` 이 그 id 로 저장, 같은 id 로 다시 부르면 `IndexError` 없이 `(None, None)`, 행 2 |
| `test_stream_persists_turn_before_done_event` | `ChatService.stream_chat` 이 `event: done` 을 내놓는 순간 DB 에 이미 2행 |
| `test_chat_stream_invalid_message_ids_return_400` ×4 | 두 id 같음, `""`, 37자, 정수 → 400 `ERR_INVALID_PAYLOAD`, `details: null` |
| `test_chat_stream_message_ids_null_or_36_chars_are_accepted` | 36자 user id 와 `assistant_message_id: null` → 200·`done`, user 는 그 id, assistant 는 uuid4 |

- **실행 결과**: `run_backend_tdd.py --phase red -- tests/test_code_review_fixes.py -k "client_ids or same_ids or existing_ids_returns or before_done or message_ids"` → pytest 종료 1, `9 failed, 1 passed, 17 deselected in 0.65s`, `✅ RED 확인` (통과 1개는 `-k` 에 함께 걸린 Cycle 6 의 BUG-02 테스트). 실패 이유:
```
client_ids…          At index 0 diff: '3d90f0c3-ad4a-…' != 'msg-asst-aaaa111'  Left contains 4 more items   (메시지 8개)
same_ids…            assert 4 == 2
existing_ids_returns TypeError: ChatSessionService.persist_turn() got an unexpected keyword argument 'user_message_id'
before_done          assert 0 == 2          (done 시점에 아직 저장 전)
invalid ×4           assert 200 == 400      (모르는 필드를 Pydantic 이 무시)
null_or_36           assert 'c4c40fec-6c3…' == 'uuuu…'   (서버 UUID 로 저장)
```

#### 2. GREEN Phase
- **구현**:
  - `backend/app/schemas/chat.py` `ChatStreamRequest`: `user_message_id`·`assistant_message_id`(`Optional[str]`, 1~36자)와 `model_validator(mode="after")` "둘 다 있으면 서로 달라야 함". 검증 실패는 Cycle 6 의 `chat.py` `ValidationError` 분기로 400 `ERR_INVALID_PAYLOAD` (`loc` 가 `model_tier` 가 아니므로).
  - `backend/app/services/chat_session_service.py` `persist_turn`: 두 id 인자를 받아 메시지 dict 의 `"id"` 로 넣는다 (None 이면 지금처럼 uuid4). 반환은 역할별로 만든 메시지, 이미 있어 건너뛴 자리는 `None` (`Tuple[Optional[…], Optional[…]]`). `created[0], created[1]` 의 `IndexError` 가 없어졌다.
  - `backend/app/services/chat_service.py` `stream_chat`: 두 id 를 `persist_turn` 에 넘기고, 저장을 `event: done` 앞으로 옮겼다. 저장 실패는 지금처럼 로그만 남기고 `done` 을 보낸다. `done` payload 는 그대로다.
- **실행 결과**: 같은 `-k` 로 `--phase green` → `10 passed, 17 deselected in 0.42s`, `✅ GREEN 확인`.

#### 3. REFACTOR Phase
- 없음.
- **회귀 검증**: `make check` 종료 0: backend `244 passed in 14.11s`, frontend `Test Files 54 passed (54)`·`Tests 664 passed (664)`, eslint `✖ 40 problems (0 errors, 40 warnings)`, `tsc --noEmit` 출력 없음. 실행 뒤 `git status` 에 `config.json`·`sources.json` 변경 없음.
- **남은 것**: 클라이언트 id 가 다른 세션에 이미 있으면 이 세션에는 저장되지 않는다 (계약 8.1절이 오류로 다루지 않기로 함). `done` 이 저장 시간만큼 늦어진다 (측정하지 않음).

### 2.7 지금 실행 증거 (2026-11-09, Cycle 6 이전)

- `python3 .claude/skills/backend-tdd-workflow/scripts/run_backend_tdd.py --phase green` (전체 `tests/`):
```
[backend TDD] /Users/wonyoung/workspace/ozplayground/agentlens/backend: /Users/wonyoung/workspace/ozplayground/agentlens/.venv/bin/pytest -v tests/
platform darwin -- Python 3.11.9, pytest-9.2.0, pluggy-1.7.0
...
tests/test_trends_and_webhook.py::test_trends_radar_endpoint PASSED      [ 99%]
tests/test_trends_and_webhook.py::test_webhook_invalid_url PASSED        [100%]

============================= 217 passed in 14.30s =============================

✅ GREEN 확인: 테스트가 모두 통과했다.
```
  벽시계 14.772s. FAILED·ERROR·SKIPPED 0 (`test_t4_compose_config_is_valid` 는 docker CLI 가 있어 PASSED).
- 파일별 PASSED 수: `test_agentic_workflow.py` 16, `test_anthropic_provider.py` 16, `test_api.py` 9, `test_briefing_notion_email.py` 9, `test_chat.py` 34, `test_chat_sessions.py` 18, `test_collect_script.py` 5, `test_collectors.py` 8, `test_config_and_live_llm.py` 3, `test_deep_researcher.py` 4, `test_dynamic_rag_retrieval.py` 10, `test_llm_processor.py` 13, `test_llm_provider_isolation.py` 14, `test_make_targets.py` 34, `test_reset_and_delete.py` 2, `test_scheduler.py` 1, `test_scoped_chat_grounding.py` 6, `test_sources_and_research.py` 6, `test_sources_write_fallback.py` 2, `test_startup_seed.py` 2, `test_trends_and_webhook.py` 5.
- 같은 날 `make check`: 종료 0, backend `217 passed in 14.25s`, frontend `Test Files 52 passed (52)`·`Tests 649 passed (649)`, eslint `✖ 41 problems (0 errors, 41 warnings)`. 실행 뒤 `git status --short` 는 실행 전과 같다 (`?? reports/` 만).
- 이 실행은 스크래퍼·Notion·SMTP 실호출이 있는 네트워크 연결 상태에서 했다 (6절).

---

## 3. 예외 및 엣지 케이스 테스트 커버리지

결과: 아래 217개 모두 2.7 의 2026-11-09 실행에서 PASS.

표기:
- **ASGI**: `httpx.AsyncClient(transport=ASGITransport(app=app))` 로 FastAPI 앱을 같은 프로세스 안에서 부른다. 이 호출 자체는 네트워크를 쓰지 않는다. `ASGITransport` 는 lifespan 이벤트를 보내지 않으므로 `backend/app/main.py:23-47` 의 lifespan(초기 수집, 스케줄러 시작)은 이 호출로는 돌지 않는다. lifespan 은 `test_startup_seed.py` 가 `app.router.lifespan_context` 로 따로 돌린다.
- **실호출**: mock 없이 외부 네트워크로 나가는 경로가 있다. 근거는 6절. LLM 호스트(Anthropic, OpenAI, Gemini, 포트 11434)로 가는 요청은 여기에 들지 않는다: `conftest.py` 의 하네스가 모든 테스트에서 흉내로 답하거나 막는다.
- **흉내 Claude**: 테스트 코드에 LLM mock 이 없어 코드가 Anthropic 을 부르는 경로다. 하네스가 `settings.ANTHROPIC_API_KEY` 를 가짜 값으로 두고 `api.anthropic.com/v1/messages` 요청에 흉내 Claude 가 고정 한국어 마크다운 답(비스트림 JSON 또는 SSE)을 준다. `.env` 의 키, 로컬 Ollama 와 상관없다.

### 3.1 `backend/tests/conftest.py` (fixture)
| 이름 | 종류 | 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|---|
| (모듈 수준 코드) | import 시점 | `os.environ["DATABASE_URL"]` 을 `sqlite+aiosqlite:///<conftest 폴더 절대 경로>/test_agentlens.db` (= `backend/tests/test_agentlens.db`)로 바꾼 뒤 `app.database` 를 import 한다 (`conftest.py:6-9`). `TESTING`, `CI` 는 설정하지 않는다. LLM 키는 아래 `llm_isolation` 이 테스트마다 지운다 | `app/config.py`, `app/database.py` | 없음 |
| `init_db` | autouse async fixture, 함수 범위 | 테스트마다 `ensure_db_schema()` 를 부르고(`create_all` 이라 없는 테이블만 만든다), id=1 `NewsItem`(LangGraph Harness, quality 8.5, URL `https://github.com/example/langgraph-harness`) 이 없으면 넣는다 (`conftest.py:13-44`). teardown 이 없어 데이터는 테스트·실행 사이에 남는다 | `app/database.py:45` `ensure_db_schema`, `app/models` | 없음 |
| `settings_file_copies` | 세션 fixture | 세션 임시 폴더에 루트 `config.json` 사본(`llm` 절의 `anthropic_api_key`·`openai_api_key`·`gemini_api_key`·`ollama_base_url` 을 빈 값으로)과 `find_sources_file()` 이 찾은 `sources.json` 사본을 만든다. 원본은 읽기만 한다 (`conftest.py:162-180`) | `app/config.py` `load_json_config`, `app/services/sources_service.py` `find_sources_file` | 없음 |
| `llm_isolation` | autouse fixture, 함수 범위 | LLM 환경 변수 다섯 개(`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`)를 지우고, `settings` 의 같은 필드를 비우고(`OLLAMA_MODEL` 은 `llama3.2:latest`), `llm_processor.openai_key`·`ollama_url` 을 `None`, `gemini_key` 를 빈 값으로 둔 뒤(`clear_llm_sources`, `conftest.py:70-84`) `settings.ANTHROPIC_API_KEY = "sk-ant-test-fake"`. `app.config.find_config_json`·`_json_data` 와 `sources_service._file_path`·`_mirror_path` 를 세션 사본으로, `Settings.model_config["env_file"]` 을 `None` 으로 바꾼다. `fake_llm` 을 설치하고 정리 단계에서 `assert_no_unmocked()` 로 흉내 없는 LLM 요청이 있었으면 테스트를 실패시킨다 (`conftest.py:183-213`) | `app/config.py`, `app/services/llm_processor.py`, `app/services/sources_service.py` | `monkeypatch`, 흉내 LLM |
| `fake_llm` | fixture, 함수 범위 | `llm_fakes.install` 로 `httpx`·`httpx2` 의 `HTTPTransport.handle_request`·`AsyncHTTPTransport.handle_async_request` 를 감싼 흉내 객체(`llm_fakes.FakeLLM`)를 돌려준다 (`conftest.py:154-159`). 흉내 Claude 는 기본 등록, `register_openai()`, `register_ollama(url, state="up"\|"down", models=[…])` 로 더 등록한다. `requests(provider, path)` 로 받은 요청(method, url, JSON 본문, timeout)을 조회하고, 등록되지 않은 LLM 호스트 요청은 `ConnectError` 를 내며 `unmocked` 에 남긴다 (`assert_no_unmocked`, `take_unmocked`) | `backend/tests/llm_fakes.py` | 흉내 LLM |
| `llm_sources` | fixture, 함수 범위 | 기본 상태 위에서 Anthropic 키까지 비우고, 세션 사본에서 테스트별 `config.json` 사본을 만들어 `find_config_json` 을 돌린다 (`conftest.py:216-230`). 메서드: `anthropic(key)`, `gemini(key)`, `openai(key, source="settings"\|"env"\|"config")`, `ollama_url(url, source="settings"\|"config")`, `ollama_model(model, source=…)`, `override(openai_key=…, ollama_url=…)`, `read_config`, `set_config_llm` | `backend/tests/conftest.py` `LLMSources` (`:87-151`) | `monkeypatch` |

`backend/tests/llm_fakes.py` 의 흉내 응답 (`llm_fakes.py:28-39`, `:189-280`):
- 흉내 Claude: 비스트림 `content[0].text`·`model`(요청 값)·`usage`, 스트림 `message_start`·`content_block_delta`(text_delta 3개)·`message_delta`·`message_stop` SSE. 스트림 끝은 `claude_stream_stop_reason`(기본 `end_turn`)과 `claude_stream_error`(설정하면 첫 조각 뒤 `error` 이벤트로 끝)로 바꾼다 (Cycle 6). 고정 답 `FAKE_CLAUDE_ANSWER` 는 `### 흉내 Claude 답변` + 한국어 문장 2개 (중괄호 없음).
- 흉내 OpenAI: 비스트림 `choices[0].message.content`, 스트림 `chat.completion.chunk` SSE 뒤 `data: [DONE]`.
- 흉내 Ollama: `down` 은 `ConnectError`, `up` 은 `/api/tags` 설치 목록, `/api/generate` 는 `:latest` 정규화 비교 뒤 200(비스트림 JSON, 스트림 NDJSON) 또는 404 `{"error":"model '<model>' not found"}`. `down` 요청도 `requests("ollama")` 에 기록한다.
- openai SDK 는 `httpx` 가 아니라 `httpx2` 의 전송을 쓴다. `httpx2` 가 있으면 같은 방식으로 감싸고, 없으면 건너뛴다 (`llm_fakes.py:21-24`).

### 3.2 `backend/tests/test_agentic_workflow.py` (16)
fixture: `db_session`(AsyncSessionLocal 세션), `sample_article_scoped`(고유 URL `https://example.com/langgraph-v03-guide-<uid>`, `full_content=None` 인 NewsItem 을 만들고 teardown 에서 지운다).

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_article_scraper_l1_l2_cache_and_db_persistence | 첫 호출은 HTTP 로 500자 이상 본문을 추출해 DB(`full_content`, `scraped_at`)에 저장하고, 같은 인스턴스·새 인스턴스의 재호출은 추가 HTTP 없이 같은 본문을 돌려준다 | `services/scraper.py` `get_article_content` | `httpx.AsyncClient.get` patch |
| test_article_scraper_graceful_fallback_on_403_and_timeout | 403 은 `ScrapeBlockedException`, 타임아웃은 `ScrapeTimeoutException` 을 던진다 | `scraper.fetch_and_parse` | `httpx.AsyncClient.get` patch |
| test_article_scraper_single_flight_lock | 같은 URL 동시 5회 요청이 HTTP 1회로 합쳐진다 | `get_article_content` (URL 락) | `httpx.AsyncClient.get` patch (지연 응답) |
| test_agentic_search_sufficiency_and_anchoring | 설치 명령이 없는 본문이면 `is_sufficient=False`, 하위 질의 1~2개, 첫 질의에 "LangGraph" 가 들어간다 | `services/agentic_search.py` `evaluate_sufficiency` | 없음 |
| test_agentic_search_relevance_filtering | 관련도 0.60 미만 후보를 버리고 나머지를 S1, S2 보조 출처로 만든다 | `search_supplementary` | `_search_web_candidates` patch |
| test_chat_scoped_sse_agentic_lifecycle | scoped 스트림이 status(extracting_source, synthesizing) → sources(primary 1개) → token → done 을 내고, 보조 검색 단계와 S1 이 없다 | `services/chat_service.py` `stream_chat` | `get_article_content`, `evaluate_and_search`, `check_provider_available`, `stream_tokens` patch |
| test_chat_scoped_graceful_degradation_when_scrape_fails | 스크랩이 `ScrapeBlockedException` 이어도 error 없이 status·sources·done 을 낸다 | `stream_chat` | 위와 같은 patch (스크랩은 예외) |
| test_article_scraper_readability_fallback_when_trafilatura_fails | trafilatura 가 None 이면 readability+BeautifulSoup 으로 500자 이상을 추출한다 | `fetch_and_parse` | `httpx.AsyncClient.get`, `trafilatura.extract` patch |
| test_article_scraper_empty_content_exception | 두 추출기 모두 500자 미만이면 `ScrapeEmptyContentException` 을 던진다 | `fetch_and_parse` | `httpx.AsyncClient.get` patch |
| test_agentic_search_sufficiency_true_when_content_already_answers | 본문에 설치 명령이 있으면 `is_sufficient=True`, 질의 0개 | `evaluate_sufficiency` | 없음 |
| test_chat_query_scoped_with_agentic_workflow_success | scoped `query_chat` 이 primary 1개, supplementary 0, 보조 검색 미호출, LLM 답을 그대로 돌려준다 | `ChatService.query_chat` | `get_article_content`, `evaluate_and_search`, `generate_live_answer` patch |
| test_agentic_search_comparison_and_patch_triggers | "vs" 질문은 `comparison_benchmarks`, 릴리즈·패치 질문은 `patch_changelog` 누락으로 판정한다 | `evaluate_sufficiency` | 없음 |
| test_agentic_search_web_candidates_and_relevance | `_calculate_relevance` 가 0.60 기준으로 관련/무관을 가르고, DuckDuckGo 응답을 후보로 파싱한다 | `_calculate_relevance`, `_search_web_candidates` | `httpx.AsyncClient.get` patch |
| test_chat_global_react_search_tool_lifecycle | 기술 질문은 thinking → tool_calling(search_news_corpus) → synthesizing → token → sources → done 순서이고 observing 이 없으며 sources 가 token 뒤에 온다 | `stream_chat` (global), `_plan_react_action` | `stream_tokens` patch |
| test_chat_global_react_casual_greeting_skips_search_tool | 인사·잡담 4개는 tool_calling·sources 없이 "직접 답변 생성" 으로 가고 sources_count 0 | `stream_chat` | `stream_tokens` patch |
| test_chat_global_react_llm_planner_and_citation_filtering | scoped 는 바로 none, 라이브 planner 의 JSON 응답으로 none/search 를 정하고, 인용된 [2] 만 남기는 출처 필터 | `_plan_react_action`, `_filter_cited_sources` | `is_test_environment`(False), `has_live_provider`, `generate_live_answer` patch |

### 3.3 `backend/tests/test_anthropic_provider.py` (16)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_anthropic_provider_interface_and_model_resolution | 키 유무로 `is_available`, haiku/sonnet/opus 별칭·ID·None 의 모델 해석 | `llm_providers/anthropic_provider.py` `AnthropicLLMProvider`, `resolve_model_and_tier` | 없음 |
| test_anthropic_generate_text_mocked_http | 응답 텍스트와 usage(캐시 토큰 포함)를 추출하고 `x-api-key`, `anthropic-version`, `anthropic-beta` 헤더를 보낸다 | `generate_text_with_usage` | `httpx.AsyncClient.post` patch |
| test_anthropic_stream_chat_mocked_sse | SSE `content_block_delta` 를 토큰으로 내고 모델명에 haiku 가 들어간다 | `stream_chat` | `httpx.AsyncClient.stream` patch |
| test_anthropic_prompt_caching_ephemeral_structure | system 블록에 `cache_control: ephemeral` 이 붙는다 | `build_cached_system_block` | 없음 |
| test_anthropic_generate_structured_summary_with_caching | JSON 응답을 파싱해 category·점수·usage 를 돌려준다 | `generate_structured_summary` | `httpx.AsyncClient.post` patch |
| test_anthropic_error_mapping | HTTP 401/429/529 를 각각 KeyMissing/QuotaExceeded/Overloaded 예외로 바꾼다 | `_check_error_status` (`generate_text` 경유) | `httpx.AsyncClient.post` patch |
| test_llm_processor_anthropic_priority_and_routing | Anthropic 이 가용하면 `generate_live_answer` 가 먼저 쓴다 | `services/llm_processor.py` `generate_live_answer` | `anthropic_provider` 를 MagicMock 으로 교체 |
| test_chat_stream_3tier_model_routing | `POST /api/chat/stream` 의 done 이벤트에 `model_tier: haiku` 와 usage 가 있다 | `api/chat.py` `chat_stream`, `ChatService.stream_chat` | ASGI, 흉내 Claude (하네스, 실제 호출 없음) |
| test_chat_query_3tier_model_routing | `POST /api/chat/query` 가 `model_tier: opus`, model 에 opus, usage 를 돌려준다 | `chat_query`, `query_chat` | ASGI, 흉내 Claude (하네스, 실제 호출 없음) |
| test_chat_session_persistence_with_model_tier_and_usage | `persist_turn` 이 model_tier·usage 를 저장하고 상세 조회로 복원한다 | `services/chat_session_service.py` | 없음 (테스트 DB) |
| test_anti_gemini_has_live_provider_ignores_gemini_key | Gemini 키만 있으면 `has_live_provider()` 가 False | `has_live_provider` | settings·environ·`load_json_config`·`is_available` patch |
| test_anti_gemini_model_sanitization | 과거 모델명(Gemini 등)을 그대로 두고 빈 값은 `claude-sonnet-5-5` | `sanitize_model_identifier` | 없음 |
| test_anthropic_config_and_schema_defaults | `DEFAULT_MODEL`, 설정, 채팅 스키마 기본 모델이 `claude-sonnet-5-5` | `anthropic_provider.DEFAULT_MODEL`, `config.py`, `schemas/chat.py` | 없음 (`.env` 의 모델 값에 영향받는다) |
| test_anti_gemini_isolation_in_generate_live_answer | 가용 프로바이더가 없으면 `LLMProviderUnavailableException`, `_call_gemini` 미호출 | `generate_live_answer` | settings·`is_available`·`_call_gemini` patch |
| test_anti_gemini_isolation_in_stream_tokens | 같은 조건에서 `stream_tokens` 가 예외를 던진다 | `stream_tokens` | settings·`is_available` patch |
| test_anti_gemini_stream_question_answer_never_yields_gemini | meta 이벤트 모델명에 "Google"/"gemini" 가 없다 | `stream_question_answer` | settings·environ·`is_available` patch, 휴리스틱 답이 `_qa_cache` 에 남는다 |

### 3.4 `backend/tests/test_api.py` (9)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_health | `GET /health` 200, `status: healthy` | `main.py` `health` | ASGI |
| test_schedule | `GET /api/schedule/status` 의 `schedule_hours` 가 [0,6,12,18] | `api/schedule.py` | ASGI |
| test_news | `GET /api/news` 200, `items` 키 | `api/news.py` `get_news_feed` | ASGI |
| test_stats | `GET /api/stats` 200 | `api/stats.py` | ASGI |
| test_mcp_info | `GET /api/mcp/info` 의 tools 가 4개 이상 | `api/mcp.py` | ASGI |
| test_rss | `GET /api/news/feed/rss.xml` content-type 에 xml | `news.py` `get_rss_feed` | ASGI |
| test_daily_briefing_endpoint | `GET /api/briefing/today` 에 headline, markdown_report | `api/briefing.py`, `services/briefing_service.py` | ASGI |
| test_ask_ai_endpoint | `POST /api/news/{id}/ask` 200, answer 키 (뉴스 항목이 있을 때만 단언) | `news.py:111-135`, `llm_processor.answer_question_with_meta` | ASGI, 흉내 Claude (하네스, 실제 호출 없음) |
| test_ask_ai_stream_endpoint | `POST /api/news/{id}/ask/stream` 이 text/event-stream, `data: ` 포함 | `news.py:137-167`, `stream_question_answer` | ASGI, 흉내 Claude (하네스, 실제 호출 없음) |

### 3.5 `backend/tests/test_briefing_notion_email.py` (9)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_today_briefing_structure | title "오늘의 AI 브리핑", 카테고리 4개(harness, mcp_plugins_skills, agent_tech, ai_news), action_items 1개 이상 | `api/briefing.py`, `briefing_service.generate_daily_briefing` | ASGI |
| test_notion_clean_id | Notion URL 의 32자 ID 를 UUID 형식으로 바꾸고, UUID 는 그대로 둔다 | `services/notion_service.py` `clean_id` | 없음 |
| test_notion_test_connection_mock | `/users/me` 200 이면 성공과 봇 이름을 돌려준다 | `notion_service.test_connection` | `httpx.AsyncClient.get` patch |
| test_notion_export_page_mock | 브리핑 페이지 생성 성공과 notion.so URL | `notion_service.create_briefing_page`, `briefing_service` | `httpx.AsyncClient.post` patch, **실호출** (`GET /v1/databases/{id}` 는 patch 안 됨) |
| test_notion_api_endpoints | `POST /api/briefing/test/notion` 빈 키 400, `POST /api/briefing/export/notion` 이 url 을 돌려준다 | `api/briefing.py` | `create_briefing_page` patch (export 만), test/notion 은 조건부 실호출 |
| test_email_service_html_generation | HTML 에 DOCTYPE, 제목, AgentLens 가 들어간다 | `services/email_service.py` `_build_html` | 없음 |
| test_email_test_connection_mock | SMTP 테스트 성공 메시지 | `email_service.test_connection` | `smtplib.SMTP` patch |
| test_email_api_endpoints | `POST /api/briefing/test/email` 빈 호스트 400, `POST /api/briefing/send/email` success | `api/briefing.py` | `send_briefing_email` patch (send 만), test/email 은 **실호출 가능** (config.json 의 SMTP 값 사용) |
| test_briefing_settings_get_and_post | 설정 조회에 title/notion/email/webhooks, 갱신 응답 success | `briefing.py` `get/update_briefing_settings`, `config.save_json_config` | 없음, 세션 사본 `config.json` 에 쓴다 (루트 파일은 바뀌지 않음) |

### 3.6 `backend/tests/test_chat.py` (34)
fixture `seed_chat_test_data`(autouse): id 101(FastMCP, 9.3), 102(LangGraph, 9.1), 103(스팸, 2.1)을 넣거나 덮어쓴다. teardown 없음.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_sqlite_fts_retriever_search_and_ranking | "FastMCP Python" 상위 결과가 101, index 1, rag_score 0~1, bm25 존재 | `services/retriever.py` `SqliteFtsRetriever.retrieve` | 없음 |
| test_sqlite_fts_retriever_quality_pruning | min_quality 5.0 이면 103 이 빠진다 | `retrieve` | 없음 |
| test_sqlite_fts_retriever_query_sanitization | 특수문자 질의가 SQL 오류 없이 리스트를 돌려준다 | `retrieve` | 없음 |
| test_knowledge_retriever_facade | facade 가 "LangGraph" 로 102 를 돌려준다 | `KnowledgeRetrieverFacade.search_knowledge` | 없음 |
| test_get_chat_source_success | `GET /api/chat/sources/101` 이 메타데이터(리스트형 tldr/tech_stack/tags)를 돌려준다 | `api/chat.py` `get_chat_source`, `ChatService.get_source_detail` | ASGI |
| test_get_chat_source_not_found | 없는 id 는 404 `ERR_HANDOVER_SOURCE_NOT_FOUND` | 같음 | ASGI |
| test_chat_search_success | `GET /api/chat/search` 가 chunks, bm25/rag 점수, latency_ms 를 돌려준다 | `search_chat_corpus` | ASGI |
| test_chat_search_query_too_short | q 1자면 400 `ERR_SEARCH_QUERY_TOO_SHORT` | 같음 | ASGI |
| test_chat_search_filters | category·min_quality 필터를 지킨다 | 같음 | ASGI |
| test_chat_query_global_mode_success | global query 가 답, 출처 1개 이상, session_id, model 을 돌려준다 | `chat_query`, `query_chat` | ASGI, `generate_live_answer` patch |
| test_chat_query_scoped_mode_success | scoped query 출처가 101 하나다 | `query_chat` (scoped) | ASGI, `generate_live_answer`·`evaluate_and_search` patch, **실호출** (스크래퍼가 `https://github.com/jlowin/fastmcp` GET) |
| test_chat_query_empty_question_validation | 빈/공백 질문 400 `ERR_CHAT_PAYLOAD_EMPTY` | `chat_query` | ASGI |
| test_chat_query_too_large_question_validation | 2001자 질문 400 `ERR_CHAT_PAYLOAD_TOO_LARGE` | `chat_query` | ASGI |
| test_chat_query_scoped_source_not_found | 없는 source_id 404 | `query_chat` | ASGI |
| test_chat_query_invalid_scope | 잘못된 scope 400 `ERR_INVALID_SCOPE_PARAM` | `chat_query` | ASGI |
| test_chat_stream_global_sse_success | sources/token/done 이벤트가 있고 done.session_id 가 요청과 같다 | `chat_stream`, `stream_chat` | ASGI, `check_provider_available`·`stream_tokens` patch |
| test_chat_stream_scoped_sse_success | scoped 스트림에 sources, "FastMCP", done | 같음 | ASGI, 같은 patch, **실호출** (101 URL 스크랩, 프로세스 첫 회) |
| test_chat_stream_empty_question_validation | 공백 질문 400 | `chat_stream` | ASGI |
| test_chat_stream_scoped_source_not_found | 없는 source_id 404 | `chat_stream` | ASGI |
| test_sqlite_fts_retriever_focus_filter_category | category 필터 결과만 나오고 is_relaxed False | `retrieve_with_meta` | 없음 |
| test_sqlite_fts_retriever_focus_filter_high_signal | high_signal_only 결과에 103 이 없다 | `retrieve_with_meta` | 없음 |
| test_sqlite_fts_retriever_adaptive_tau_and_time_range | `get_tau_seconds` 의 24h/7d/30d/all 값 | `get_tau_seconds` | 없음 |
| test_sqlite_fts_retriever_focus_filter_sort_modes | latest/quality 정렬 순서 (결과 2개 이상일 때만 단언) | `retrieve_with_meta` | 없음 |
| test_sqlite_fts_retriever_auto_relaxation_on_zero_matches | 24h 에 0건이면 all 로 완화하고 is_relaxed True | `retrieve_with_meta` | 없음 (item 201 을 넣고 지우지 않는다) |
| test_chat_search_with_focus_filters | `/api/chat/search` 가 category·time_range·sort·high_signal_only 를 바인딩한다 | `search_chat_corpus` | ASGI |
| test_chat_query_with_focus_filters_and_relaxation | query 응답의 applied_filters.time_range 가 all, is_relaxed True | `query_chat` | ASGI, `generate_live_answer` patch (item 201 필요) |
| test_chat_stream_sources_event_includes_focus_filter_metadata | sources 이벤트에 applied_filters·is_relaxed | `stream_chat` | ASGI, `check_provider_available`·`stream_tokens` patch |
| test_chat_service_fallback_function_completely_removed | `ChatService` 에 `_generate_fallback_answer` 가 없다 | `ChatService` | 없음 |
| test_chat_stream_llm_provider_unavailable_returns_503 | 503 `ERR_LLM_PROVIDER_UNAVAILABLE` | `api/chat.py:349,377` | ASGI, `check_provider_available` patch (예외) |
| test_chat_stream_llm_upstream_failed_returns_502 | 502 `ERR_LLM_UPSTREAM_FAILED` | `api/chat.py:386` | 같음 |
| test_chat_stream_llm_quota_exceeded_returns_429 | 429 `ERR_LLM_QUOTA_EXCEEDED` | `api/chat.py:395` | 같음 |
| test_chat_stream_midstream_failure_yields_sse_error_event | 토큰 뒤 예외면 `event: error` `ERR_LLM_STREAM_FAILED`, sources·done 없음 | `chat_service.py:759-769` | ASGI, `check_provider_available`·`stream_tokens` patch |
| test_chat_query_llm_provider_unavailable_returns_503 | query 에서 503 | `api/chat.py:239` | ASGI, `generate_live_answer` patch (예외) |
| test_chat_query_llm_upstream_failed_returns_502 | query 에서 502 | `api/chat.py:248` | 같음 |

### 3.7 `backend/tests/test_chat_sessions.py` (18)
fixture `cleanup_chat_sessions`(autouse): 테스트 전 `chat_messages`, `chat_sessions` 를 모두 지운다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_get_sessions_empty | 세션이 없으면 빈 리스트 200 | `api/chat.py` `list_chat_sessions` | ASGI |
| test_get_sessions_list_and_ordering | updated_at 내림차순 정렬과 limit/offset | 같음 | ASGI |
| test_create_session_defaults | 기본 제목 "새 대화", global, UUID, 빈 messages, 201 | `create_or_upsert_chat_session` | ASGI |
| test_create_session_explicit_uuid_and_fields | 지정한 UUID·제목·scope·source 로 만든다 | 같음 | ASGI |
| test_create_session_invalid_uuid | 잘못된 UUID 400 | 같음 | ASGI |
| test_upsert_existing_session | 같은 ID 면 메타데이터를 갱신한다 | 같음 | ASGI |
| test_get_session_detail_success | 상세에 active_source 가 채워지고 messages 리스트가 있다 | `get_chat_session_detail` | ASGI |
| test_get_session_detail_not_found | 404 `ERR_SESSION_NOT_FOUND` | 같음 | ASGI |
| test_delete_session_and_cascade_messages | 세션 삭제 시 메시지도 지운다 | `delete_chat_session` | ASGI |
| test_delete_session_not_found | 404 `ERR_SESSION_NOT_FOUND` | 같음 | ASGI |
| test_fifo_30_retention_eviction | 31번째 생성 시 가장 오래된 세션을 지우고 30개를 유지한다 | `ChatSessionService` FIFO | ASGI |
| test_chat_stream_auto_persists_turn_and_auto_titles | 스트림 완료 후 user/assistant 메시지를 저장하고 질문 앞 30자로 자동 제목을 붙인다 | `chat_stream`, `persist_turn` | ASGI, `check_provider_available`·`stream_tokens` patch, **실호출** (item 1 URL 스크랩) |
| test_generate_auto_title_rules | 마크다운·HTML 제거, 공백은 "새 대화", 30자 초과는 "..." | `chat_session_service.generate_auto_title` | 없음 |
| test_create_session_with_initial_messages | 요청 본문의 초기 메시지를 저장한다 | `create_or_upsert_chat_session` | ASGI |
| test_chat_session_service_append_single_message | `append_message_and_update_session` 단위 동작 | `ChatSessionService` | 없음 |
| test_api_session_error_handling_branches | 서비스 예외 시 500 응답 | `api/chat.py` 세션 엔드포인트 | ASGI, `ChatSessionService` 메서드 patch (예외) |
| test_chat_session_service_direct_unit | create/list/detail/delete/fifo 직접 호출 | `ChatSessionService` | 없음 |
| test_chat_session_service_json_fallbacks_and_upsert_branches | 깨진 JSON 은 None 으로 대체, 전체 필드 upsert, `enforce_fifo_retention(max_limit=0)` | `ChatSessionService` | 없음 |

### 3.8 `backend/tests/test_collect_script.py` (5)
`scripts/collect.py` 를 경로로 불러와(`importlib`) `main(env)` 를 작업 스레드에서 돌린다 (`asyncio.run` 이 pytest-asyncio 루프와 섞이지 않게). API 모드는 같은 파일 안 `http.server` 스텁(`/health`, `GET /api/schedule/progress`, `POST /api/schedule/trigger` 만 응답)에 붙는다. 모든 스텁 경우에서 받은 경로에 `reset-and-collect` 가 없음을 단언한다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_auto_api_mode_success | `auto` + healthy 스텁: 첫 줄 `API 모드: <URL>`, trigger 를 보내고 `last_crawl_time` 이 바뀌면 수집·저장 건수를 내고 종료 0 | `scripts/collect.py` `main`, `run_api` | 스텁 HTTP 서버, `POLL_INTERVAL` 0.05 |
| test_api_mode_error_finish | running 뒤 `last_crawl_time` 그대로 끝나면 종료 1, 마지막 `step_message` 를 낸다 | `run_api` | 스텁 HTTP 서버 |
| test_api_mode_timeout | `COLLECT_TIMEOUT=1` 과 계속 running 이면 종료 1, 5초 안에 끝난다 | `run_api` | 스텁 HTTP 서버 |
| test_auto_direct_mode | 응답 없는 URL + `auto`: 첫 줄 `직접 모드:`, `ensure_db_schema`·`collect_all` 이 한 번씩 불리고 종료 0, `실패한 소스: B` 줄 | `run_direct` | `app.database.ensure_db_schema`·`collector_manager.collect_all` AsyncMock |
| test_api_mode_without_backend | `COLLECT_MODE=api` + 응답 없는 URL: 종료 1, "backend 가 없다", `collect_all` 이 불리지 않음 | `main` | `collect_all` AsyncMock |

### 3.9 `backend/tests/test_collectors.py` (8)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_harness_classification | SWE-bench 제목을 harness 로 분류하고 점수 > 0 | `collectors/categorizer.py` `classify_and_tag` | 없음 |
| test_mcp_classification | MCP 제목을 mcp_plugins_skills 로 분류 | `classify_and_tag` | 없음 |
| test_agent_tech_classification | LangGraph 제목을 agent_tech 로 분류 | `classify_and_tag` | 없음 |
| test_ai_news_classification | DeepSeek-R1 제목을 ai_news 로 분류 | `classify_and_tag` | 없음 |
| test_dedup_hash_stability | utm 파라미터가 달라도 같은 dedup 해시 | `compute_dedup_hash` | 없음 |
| test_hotness_decay | 1시간 전 글이 48시간 전 글보다 hotness 가 높다 | `calculate_hotness` | 없음 |
| test_unrelated_noise_rejection | GeekNews 비 AI 제목 5개가 unrelated, 점수 0 | `is_strictly_ai_related`, `classify_and_tag` | 없음 |
| test_evaluate_content_with_llm_strict_gate | 비 AI 글은 pre-filter 로 거절, AI 글은 통과(quality ≥ 7.0) | `llm_processor.evaluate_content_with_llm` | 흉내 Claude (하네스, 실제 호출 없음): 두 번째 호출의 흉내 답은 JSON 이 아니라 휴리스틱 폴백으로 판정된다 |

### 3.10 `backend/tests/test_config_and_live_llm.py` (3)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_config_json_found_and_loaded | config.json 을 찾고 PROJECT_NAME, VERSION(허용 목록 `("0.4.1", "0.4.0", "0.3.1", "0.3.0", "0.2.2", "0.2.1", "0.2.0", "0.1.0", "1.0.0")`), 스케줄, 품질 임계값(5.0, 7.0)을 읽는다 | `config.py` `find_config_json`, `Settings` | 없음 |
| test_get_custom_json_value | 임의 섹션 값 조회와 기본값 | `Settings.get_custom_json_value` | 없음 |
| test_llm_processor_fallback_and_answer | `answer_question` 이 20자 넘는 문자열을 돌려준다 | `llm_processor.answer_question` | 흉내 Claude (하네스, 실제 호출 없음), 캐시 상태에 따라 다름 |

### 3.11 `backend/tests/test_deep_researcher.py` (4)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_probe_and_discover_feed_github | GitHub 저장소 URL 에서 releases.atom 피드를 찾아 항목을 읽는다 | `services/deep_researcher.py` `probe_and_discover_feed` | **실호출** (github.com) |
| test_evaluate_and_decide_scoring | 하네스 관련 피드를 AUTO_ADOPTED 또는 WATCHLIST, 점수 ≥ 7.5 로 판정한다 | `evaluate_and_decide` | 없음 (sources.json 읽기, 휴리스틱) |
| test_deep_research_run_and_audit | 후보 2개를 평가하고 `SourceResearchLog` 감사 로그를 남긴다 | `run_deep_research` | **실호출** (시드 사이트 2곳), 세션 사본 sources.json 쓰기 가능 |
| test_deep_research_api_endpoints | `/api/research/status`, `/audit-logs`, `POST /run-deep` 응답 형식 | `api/research.py` | ASGI, run-deep 는 백그라운드 태스크로 실호출 시작 |

### 3.12 `backend/tests/test_dynamic_rag_retrieval.py` (10)
fixture `seed_distinct_rag_articles`(autouse): id 9001~9005(Claude, MCP 스펙, SWE-bench, WinDbg MCP, 일반 아키텍처)를 넣거나 덮어쓴다. teardown 없음.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_dynamic_rag_retrieval_returns_distinct_articles_by_query | Claude/MCP/Benchmark 질의의 상위 결과가 서로 다르고 주제어를 포함한다 | `SqliteFtsRetriever.retrieve`, `_ensure_fts_table` | 없음 |
| test_conversational_queries_extract_keywords_and_return_distinct_articles | 한국어 불용어가 섞인 질의도 주제별로 다른 결과를 준다 | `retrieve` | 없음 |
| test_ensure_fts_table_creates_table_and_indexes_items | `news_fts` 가상 테이블이 있고 건수가 news_items 이상이다 | `_ensure_fts_table` | 없음 |
| test_sql_like_fallback_ranks_by_relevance_when_fts_fails | FTS 질의가 실패하면 LIKE 대체 검색이 주제별 결과를 준다 | `retrieve` | `_sanitize_fts_query` patch |
| test_gemini_call_restored_and_invokes_specified_model | `_call_gemini` 가 지정 모델 URL·키로 POST 하고 응답을 파싱한다 | `llm_processor._call_gemini` | `httpx.AsyncClient` 클래스 patch |
| test_generate_live_answer_honestly_routes_to_gemini_when_requested | gemini 모델 요청이면 `_call_gemini` 를 1회 부른다 | `generate_live_answer` | `settings.GEMINI_API_KEY`, `_call_gemini` patch |
| test_version_0_2_2_consistency | `settings.VERSION` 과 config.json `app.version` 이 0.4.1 (`test_dynamic_rag_retrieval.py:258-264`) | `config.py` | 없음 |
| test_dynamic_retrieval_returns_only_relevant_articles_without_stuffing_top_k | "WinDbg MCP 서버" 는 9004 한 건만 돌려준다 | `retrieve` | 없음 |
| test_dynamic_retrieval_returns_empty_when_no_relevant_articles_exist | 무관한 질의는 0건 | `retrieve` | 없음 |
| test_chat_service_global_rag_returns_dynamic_source_count | `_resolve_sources` 가 1건/0건을 그대로 돌려준다 | `ChatService._resolve_sources` | 없음 |

### 3.13 `backend/tests/test_llm_processor.py` (13)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_extract_tech_stack | 텍스트에서 Claude 3.7, DeepSeek-R1, SWE-bench, LangGraph, FastMCP 를 뽑는다 | `extract_tech_stack` | 없음 |
| test_evaluate_quality_and_signal | 하네스 글은 quality ≥ 7.0 통과, 스팸은 5.0 미만 거절 | `evaluate_quality_and_signal` | 없음 |
| test_generate_synthesis | TL;DR 2개 이상, why_it_matters, tech_stack 에 MCP | `generate_synthesis` | 없음 |
| test_answer_question | `answer_question` 이 20자 넘는 문자열 | `answer_question` | 흉내 Claude (하네스, 실제 호출 없음) |
| test_base_llm_provider_interface | `BaseLLMProvider` 가 추상이고 4개 추상 메서드를 가진다 | `llm_providers/base.py` | 없음 |
| test_unit_test_mock_provider | 테스트 안에 정의한 mock 프로바이더가 동작한다 (제품 코드 검증 아님) | 테스트 파일 내부 클래스 | 없음 |
| test_check_provider_available_production_gate | 프로바이더가 없으면 `LLMProviderUnavailableException` | `check_provider_available` | `has_live_provider` patch |
| test_generate_live_answer_fails_fast_without_mock_fallback | 모든 프로바이더 실패 시 `LLMUpstreamException` | `generate_live_answer` | `has_live_provider`·`is_available`·`_call_openai`·`_call_ollama` patch |
| test_stream_tokens_fails_fast_without_mock_fallback | 모든 프로바이더 실패 시 `stream_tokens` 가 `LLMUpstreamException` | `stream_tokens` | `has_live_provider`·`is_available`·`openai_key`·`ollama_url` patch (빈 값 덮어쓰기로 OpenAI·Ollama 갈래가 꺼진다) |
| test_chat_stream_end_to_end_with_mocked_llm | `/api/chat/stream` 이 sources·token·done 과 모델명을 낸다 | `chat_stream` | ASGI, `stream_tokens` patch, `check_provider_available` 은 실제 (하네스의 가짜 Anthropic 키로 True) |
| test_chat_query_end_to_end_with_mocked_llm | `/api/chat/query` 가 mock 답과 모델명을 돌려준다 | `chat_query` | ASGI, `generate_live_answer` patch |
| test_scoped_chat_stream_end_to_end_with_mocked_llm | scoped 스트림이 status·sources·token·done 을 내고 mock fallback 문구가 없다 (item 999 를 만들고 finally 에서 지운다) | `chat_stream` (scoped) | ASGI, `stream_tokens` patch, **실호출** (`https://example.com/isolated-scoped-benchmark` 스크랩) |
| test_mock_llm_provider_removed_from_app_services | `llm_providers.mock_provider` import 가 실패한다 | 모듈 존재 여부 | 없음 |

### 3.14 `backend/tests/test_llm_provider_isolation.py` (14)
모든 테스트가 `llm_sources`(Anthropic 키까지 비운 시작 상태)와 `fake_llm` 을 쓴다. 행 테스트(가드 제외)는 fixture `gemini_spy` 로 `settings.GEMINI_API_KEY` 를 두고 `_call_gemini` 를 `AsyncMock` 으로 감싸 `call_count == 0` 을 단언한다. 흉내 Ollama 주소는 `http://fake-ollama.test:11434`, 설치 모델은 `llama3.2:latest`.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_t1_claude_key_skips_ollama_probe | Anthropic 키 있음, Ollama 연결 안 됨: `has_live_provider()` True, Ollama 요청 0회, 생성·스트림이 흉내 Claude 답과 `claude-` 모델 | `has_live_provider`, `generate_live_answer`, `stream_tokens` | 흉내 Claude·Ollama(`down`) |
| test_t2_claude_preferred_over_installed_ollama | Anthropic 키 있음, Ollama 설정 모델 설치: True, `/api/tags`·`/api/generate` 0회, 생성·스트림 Claude 답 | 같음 | 흉내 Claude·Ollama(`up`) |
| test_t3_no_provider_when_ollama_unreachable | 키 없음, Ollama 연결 안 됨: False, 생성·스트림 `LLMProviderUnavailableException` | 같음 | 흉내 Ollama(`down`) |
| test_t4_missing_ollama_model_is_unavailable | 키 없음, Ollama 는 떠 있고 다른 모델(`gpt-oss:20b`)만: False, 생성·스트림 `LLMProviderUnavailableException`, `/api/generate` 0회 | `_ollama_status` | 흉내 Ollama(`up`) |
| test_t5_installed_ollama_model_used[settings_model] | 키 없음, 설정 모델 설치(`settings.OLLAMA_MODEL`): True, 생성·스트림 흉내 Ollama 답, `/api/generate` 요청 `model` 두 번 모두 `llama3.2:latest` | `_resolve_ollama_generate_model`, `_call_ollama`, `stream_tokens` | 흉내 Ollama(`up`) |
| test_t5_installed_ollama_model_used[config_model] | 같은 조건에서 `settings.OLLAMA_MODEL` 이 비고 테스트별 `config.json` 의 `llm.ollama_model` 이 모델을 줄 때 생성·스트림이 같은 모델을 쓴다 | 같음 | 흉내 Ollama(`up`) |
| test_t6_openai_key_only | OpenAI 키만(`settings`): True, 생성은 흉내 OpenAI 답, 스트림(openai SDK)은 흉내 SSE 조각을 이은 답, OpenAI 요청 2회 | `_call_openai`, `stream_tokens` OpenAI 갈래 | 흉내 OpenAI(`httpx`·`httpx2`), Ollama(`down`) |
| test_t7_ollama_url_from_config_json_when_settings_empty | `settings.OLLAMA_BASE_URL` 이 비고 테스트별 `config.json` 의 `llm.ollama_base_url` 만 있을 때 판정·생성·스트림이 그 주소를 쓴다 | `_resolve_ollama_url` | 흉내 Ollama(`up`) |
| test_t7b_empty_overrides_disable_openai_and_ollama | OpenAI 키(settings·환경 변수·config)와 Ollama 주소(settings·config)가 있어도 덮어쓰기 `openai_key = ""`·`ollama_url = ""` 면 False, 생성·스트림 `LLMProviderUnavailableException`, OpenAI·Ollama 요청 0회 | `_resolve_openai_key`, `_resolve_ollama_url` | 흉내 OpenAI·Ollama(`up`) |
| test_t8_untagged_model_matches_latest_tag | 설정 모델 `llama3.2` 가 설치된 `llama3.2:latest` 와 맞아 True, 생성이 흉내 Ollama 답 | `_ollama_status` | 흉내 Ollama(`up`) |
| test_ollama_probe_is_single_request_with_1s_timeout | `has_live_provider()` 한 번에 `/api/tags` 요청 1회, 요청 timeout 값이 모두 1.0 | `_ollama_status` (`llm_processor.py:177`) | 흉내 Ollama(`up`) |
| test_api_chat_stream_503_when_ollama_model_missing | T4 조건에서 `POST /api/chat/stream` 이 스트림을 열기 전 503 `ERR_LLM_PROVIDER_UNAVAILABLE` | `api/chat.py` `chat_stream`, `check_provider_available` | ASGI, 흉내 Ollama(`up`) |
| test_api_chat_query_503_when_ollama_model_missing | T4 조건에서 `POST /api/chat/query` 503 `ERR_LLM_PROVIDER_UNAVAILABLE`, WARNING 로그에 `설정 모델 미설치` | `chat_query`, `check_provider_available` | ASGI, 흉내 Ollama(`up`), `caplog` |
| test_guard_records_unmocked_llm_request | 흉내 Ollama 등록 없이 `httpx.Client().get("http://localhost:11434/api/tags")` 가 `ConnectError`, `assert_no_unmocked()` 가 `AssertionError`, `take_unmocked()` 로 기록을 비운다 | `llm_fakes.FakeLLM` 가드 | 흉내 LLM 가드 |

### 3.15 `backend/tests/test_make_targets.py` (34)
Makefile·`docker-compose.yml` 회귀 검사. `make` 는 `-n` 으로만 부르고(대상을 실제로 실행하지 않는다), 부르기 전마다 Makefile 에 `$(MAKE)`·`${MAKE}`·`$(shell`·`${shell`·`+` 접두 레시피 줄이 없음을 단언한다. 환경에서 `MAKEFLAGS`·`MFLAGS`·`MAKELEVEL` 과 Makefile 변수 5개를 지운다. 대상 목록은 `TARGETS` (`test_make_targets.py:20`).

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_t1_defined_targets_match_list | Makefile 에 정의된 대상이 12개 목록과 같다 | `Makefile` | 없음 (파일 읽기) |
| test_t1_phony_targets_match_list | `.PHONY` 이름 합집합이 12개 목록과 같다 | `Makefile:3` | 없음 |
| test_t1_shell_is_bash | `SHELL := /bin/bash` 줄 | `Makefile:1` | 없음 |
| test_t2_dry_run_executes_nothing | `make -n` 이 실제로 실행하는 구문이 없다 | `Makefile` | 없음 |
| test_t2_make_dry_run_succeeds (12, 대상별) | `make -n <대상>` 종료 0, stderr 빈 값 | `Makefile` | `make -n` 하위 프로세스 |
| test_t2_test_target_equals_check | `make -n test` 출력 == `make -n check` 출력 | `Makefile:44, 98-101` | `make -n` |
| test_t3_referenced_file_exists (7, 파일별) | `scripts/dev.sh`, `scripts/collect.py`, `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `backend/requirements.txt`, `frontend/pnpm-lock.yaml` 가 있다 | 레시피가 부르는 파일 | 없음 |
| test_t3_dev_script_is_executable_and_parses | `scripts/dev.sh` 실행 권한, `bash -n` 종료 0 | `scripts/dev.sh` | `bash -n` |
| test_t3_collect_script_compiles | `scripts/collect.py` 가 `py_compile` 된다 (바이트코드는 `tmp_path`) | `scripts/collect.py` | 없음 |
| test_t4_makefile_has_no_or_true | Makefile 에 `\|\| true` 가 없다 | `Makefile` | 없음 |
| test_t4_compose_config_json_is_writable | compose 에 `config.json` 읽기 전용 마운트가 없고 `./config.json:/app/config.json:rw` 가 있다 | `docker-compose.yml:38` | 없음 |
| test_t4_compose_config_is_valid | `docker compose config -q` 종료 0 (docker CLI 가 없으면 skip) | `docker-compose.yml` | docker CLI (daemon 불필요) |
| test_t5_reset_uses_api_url_variable | `make -n reset AGENTLENS_API_URL=http://127.0.0.1:9` 출력에 그 URL·`curl`·`reset-and-collect` 가 있고 `localhost:8000` 이 없다 | `Makefile:57-73` | `make -n` |
| test_t5b_docker_logs_user_stop_is_success (4, 종료 코드별) | `make -n docker-logs` 레시피를 가짜 `docker` 가 앞선 PATH 에서 bash 로 돌려 docker 종료 0→0, 130→0, 1→1, 2→2 | `Makefile:90-96` | 가짜 `docker` 스크립트 |

### 3.16 `backend/tests/test_reset_and_delete.py` (2)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_reset_and_collect_endpoint | `POST /api/schedule/reset-and-collect` 가 started/already_running 과 deleted_count 를 돌려준다 (테스트 DB 의 뉴스·크롤 로그를 모두 지운다) | `api/schedule.py:69-99` | ASGI, `collector_manager.collect_all` monkeypatch |
| test_delete_all_news_endpoint | `DELETE /api/news/all` 이 success 와 deleted_count | `api/news.py:96` | ASGI |

### 3.17 `backend/tests/test_scheduler.py` (1)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_scheduled_hours | `SCHEDULED_HOURS == [0, 6, 12, 18]` | `app/scheduler.py` 상수 | 없음 |

### 3.18 `backend/tests/test_scoped_chat_grounding.py` (6)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_version_is_0_2_2 | `settings.VERSION == "0.4.1"` (`test_scoped_chat_grounding.py:10`) | `config.py` | 없음 |
| test_mock_llm_provider_removed_from_production | `mock_provider` import 실패 | 모듈 존재 여부 | 없음 |
| test_anthropic_payload_omits_temperature | Anthropic 요청 payload 에 temperature 가 없다 (동기 테스트 안에서 `asyncio.run`) | `generate_text_with_usage` | `httpx.AsyncClient.post` patch |
| test_scoped_chat_prompt_injects_focused_article_and_no_mock_fallback | scoped 프롬프트에 기사 제목·요약·본문·질문이 들어가고 응답에 mock 문구가 없다 | `ChatService.stream_chat`, `_build_grounding_prompt` | DB 세션 AsyncMock, `get_article_content`·`persist_turn`·`stream_tokens` mock |
| test_sanitize_model_identifier_preserves_historical_models | Gemini/OpenAI/Claude 모델명 보존, 빈 값은 기본 모델 | `sanitize_model_identifier` | 없음 |
| test_no_mock_fallback_on_provider_absence | 프로바이더가 없으면 check/generate/stream 모두 `LLMProviderUnavailableException` | `check_provider_available`, `generate_live_answer`, `stream_tokens` | `has_live_provider` patch |

### 3.19 `backend/tests/test_sources_and_research.py` (6)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_sources_service_load | sources 에 rss_feeds, github_sources, reddit_sources 가 있고 RSS 가 10개 이상 | `services/sources_service.py` `get_all_sources` | 없음 (파일 읽기) |
| test_sources_service_active_feeds | 활성 피드는 모두 enabled | `get_active_rss_feeds` | 없음 |
| test_sources_toggle_and_crud | RSS 추가 → 토글(비활성) → 삭제 | `add_rss_source`, `toggle_source`, `delete_source` | 없음, 세션 사본 sources.json 에 쓴다 |
| test_source_researcher_discover | "harness" 질의로 후보를 찾고 첫 후보 점수 ≥ 7.0 | `services/source_researcher.py` `discover_sources` | 없음 (메모리 카탈로그) |
| test_source_researcher_inspect_url | GitHub 저장소 URL 에서 releases.atom 피드를 찾는다 | `inspect_url` | **실호출** (github.com) |
| test_sources_and_research_api_endpoints | `GET /api/sources` 통계, `POST /api/research/discover`, `POST /api/research/register-candidate` 성공 후 정리 | `api/sources.py`, `api/research.py` | ASGI, 세션 사본 sources.json 에 쓰고 지운다 |

### 3.20 `backend/tests/test_sources_write_fallback.py` (2)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_save_sources_falls_back_to_in_place_write_on_ebusy | `Path.replace` 가 `OSError(EBUSY)` 를 내도 `save_sources` 가 True, 파일 내용이 새 값(갱신된 `updated_at` 포함), `sources.tmp` 가 남지 않는다 | `services/sources_service.py:102-132` | `pathlib.Path.replace` monkeypatch, 세션 사본 sources.json 에 쓴다 |
| test_save_sources_uses_atomic_replace_normally | 평소에는 `replace` 가 한 번 불리고 내용이 같고 `.tmp` 가 없다 | `save_sources` | `Path.replace` 감시 함수, 세션 사본 |

### 3.21 `backend/tests/test_startup_seed.py` (2)
`app.main` 의 `AsyncSessionLocal`·`engine` 을 `tmp_path` 의 SQLite 로, `ensure_db_schema` 를 AsyncMock 으로, `start_scheduler`·`stop_scheduler` 를 빈 함수로 바꿔 lifespan 을 직접 돌린다 (공용 테스트 DB 의 기사를 지우지 않는다).

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_empty_db_seed_runs_in_background_and_is_cancelled_on_shutdown | 빈 DB: lifespan 진입이 1초 안, 안에서 `GET /health` 200 과 `running: true`, 빠져나올 때 수집 태스크가 취소되고 `is_running` 이 false | `main.py:23-47` | 오래 걸리는 `collect_all` 흉내, ASGI |
| test_db_with_items_does_not_seed | 기사 1건 DB: lifespan 출입 뒤 `collect_all` 을 부르지 않는다 | `main.py:28-36` | `collect_all` AsyncMock |

### 3.22 `backend/tests/test_trends_and_webhook.py` (5)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_classify_tag_category | 태그 4개를 레이더 카테고리로 분류 | `services/trend_service.py` `classify_tag_category` | 없음 |
| test_webhook_provider_detection | URL 로 slack/discord/generic 판별 | `services/webhook_service.py` `detect_provider` | 없음 |
| test_webhook_payload_generation | slack 은 blocks, discord 는 embeds, 브리핑 slack payload 에 blocks | `build_test_payload`, `build_briefing_payload` | 없음 |
| test_trends_radar_endpoint | `GET /api/trends/radar` 에 total_analyzed, surging_tags, categories, tags | `api/trends.py`, `trend_service.get_tech_radar` | ASGI |
| test_webhook_invalid_url | http 로 시작하지 않는 URL 은 400 | `api/webhook.py:20-22` | ASGI |

### 3.23 기능 영역별 커버리지 (backend)
"있음" 은 테스트가 검증하는 동작, "없음" 은 코드에 있지만 이를 직접 부르거나 단언하는 테스트를 찾지 못한 동작이다.

#### 뉴스 피드 (NEWS)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 뉴스 목록 기본 조회, `size=1` 조회 | `test_api.py::test_news`, `test_ask_ai_endpoint` |
| 있음 | 통계, RSS 피드, 전체 삭제 | `test_api.py::test_stats`, `test_rss`, `test_reset_and_delete.py::test_delete_all_news_endpoint` |
| 있음 | 트렌드 태그 분류와 레이더 응답 형식 | `test_trends_and_webhook.py` |
| 없음 | 목록 필터·정렬·검색·페이지(`category`, `source`, `search`, `sort`, `high_signal_only`, `page`) | `backend/app/api/news.py:47-95` |
| 없음 | 단건 조회 `GET /api/news/{id}`, ask 의 404 | `backend/app/api/news.py:104-119` |
| 없음 | RSS 의 `category` 파라미터 | `backend/app/api/news.py:169-197` |
| 없음 | 트렌드 레이더 집계 로직의 값 | `backend/app/services/trend_service.py:40-139` (키 존재만 단언) |

#### 수집·분류·요약 (COLL)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 키워드 분류, dedup 해시, hotness 감쇠, 비 AI 잡음 거절 | `test_collectors.py` |
| 있음 | 품질 점수, 기술 스택 추출, TL;DR 합성 | `test_llm_processor.py` |
| 있음 | LLM 평가의 pre-filter 거절과 통과 | `test_collectors.py::test_evaluate_content_with_llm_strict_gate` (흉내 Claude 답은 JSON 이 아니어서 휴리스틱 폴백으로 판정) |
| 있음 | Anthropic 구조화 요약 파싱 | `test_anthropic_provider.py::test_anthropic_generate_structured_summary_with_caching` |
| 있음 | 기사 본문 스크랩(캐시, 단일 비행, 403/타임아웃, readability 대체, 빈 본문) | `test_agentic_workflow.py` 스크래퍼 테스트 5개 |
| 있음 | 초기화 후 재수집 엔드포인트 (수집은 mock) | `test_reset_and_delete.py::test_reset_and_collect_endpoint` |
| 있음 | 앱 lifespan 의 빈 DB 첫 수집(백그라운드, 종료 때 취소)과 기사가 있을 때 건너뜀 (스케줄러·스키마는 흉내) | `test_startup_seed.py` |
| 있음 | `make collect` 진입점 `scripts/collect.py` 의 모드 선택·완료 판정 | `test_collect_script.py` |
| 없음 | 수집 오케스트레이션과 배치 저장(LLM 평가 → 합성 → 저장) | `backend/app/collectors/manager.py:72-259` |
| 없음 | 소스별 수집기 전부 | `backend/app/collectors/sources/arxiv.py`, `github.py`, `hackernews.py`, `huggingface.py`, `reddit.py`, `rss.py` |
| 없음 | 수동 수집 시작·진행률 엔드포인트 | `backend/app/api/schedule.py:43-67` |
| 없음 | 스케줄러 시작·중지와 예약 작업(수집, 딥 리서치, 브리핑 발송) | `backend/app/scheduler.py:11-68` (상수 `SCHEDULED_HOURS` 만 테스트) |
| 없음 | 앱 lifespan 의 스케줄러 시작·중지와 실제 스키마 생성 | `backend/app/main.py:25-26, 46-47` |

#### AI 챗 (CHAT)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | global/scoped query·stream, 입력 검증(빈 값, 2000자 초과, 잘못된 scope, 없는 출처) | `test_chat.py` |
| 있음 | ReAct 흐름(검색 도구, 잡담 생략, LLM planner, 인용 필터) | `test_agentic_workflow.py` |
| 있음 | 503/502/429 오류 매핑(stream 사전 검사, query), 스트림 중간 오류 이벤트 | `test_chat.py` 7개 |
| 있음 | LLM 가용 판정(Claude 우선, Ollama 설정 모델 설치 확인, 주소·모델·OpenAI 키 해석 원천, 빈 덮어쓰기, 탐침 1회·1.0초)과 그 503 | `test_llm_provider_isolation.py` |
| 있음 | FTS 검색, 품질 컷, 포커스 필터, 시간 완화, 동적 출처 수, LIKE 대체 | `test_chat.py`, `test_dynamic_rag_retrieval.py` |
| 있음 | 세션 CRUD, FIFO 30, 자동 제목, 스트림 자동 저장, 오류 분기 | `test_chat_sessions.py` |
| 있음 | 3-tier 모델 해석·라우팅, Anthropic HTTP·SSE·오류 매핑, 모델명 보존 | `test_anthropic_provider.py`, `test_scoped_chat_grounding.py` |
| 없음 | API 수준 401(키 누락)·529(과부하) 응답 | `backend/app/api/chat.py:212-237`, `350-375` (프론트 MSW 트리거만 있음) |
| 없음 | 대화 history 를 담은 요청이 프롬프트에 반영되는지 | `backend/app/services/chat_service.py:222` `_build_grounding_prompt` (backend 테스트 중 history 를 보내는 것이 없다) |
| 없음 | 보조 웹 검색 전체 흐름 `evaluate_and_search` | `backend/app/services/agentic_search.py:221-246` (단위 함수만 테스트, 서비스 호출처 없음) |

#### 브리핑·공유 (BRF)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 오늘 브리핑 구조(제목, 4개 카테고리, action_items) | `test_briefing_notion_email.py::test_today_briefing_structure`, `test_api.py::test_daily_briefing_endpoint` |
| 있음 | Notion ID 정리, 연결 테스트, 페이지 생성(POST mock), 엔드포인트 | `test_briefing_notion_email.py` |
| 있음 | 이메일 HTML, SMTP 연결 테스트(mock), 엔드포인트 | `test_briefing_notion_email.py` |
| 있음 | 브리핑 설정 조회·저장 | `test_briefing_notion_email.py::test_briefing_settings_get_and_post` |
| 있음 | 웹훅 제공자 판별, payload 생성, 잘못된 URL 400 | `test_trends_and_webhook.py` |
| 없음 | 브리핑 재생성 `POST /api/briefing/generate` | `backend/app/api/briefing.py:40-53` |
| 없음 | 자동 발송(Notion/이메일/웹훅) | `backend/app/services/briefing_service.py:210-259` |
| 없음 | 웹훅 실제 전송과 브리핑 웹훅 엔드포인트 | `backend/app/services/webhook_service.py:17-32`, `154-162`, `backend/app/api/webhook.py:28-43` |
| 없음 | 이메일 브리핑 발송 본체 | `backend/app/services/email_service.py:226-266` |

#### 소스·딥 리서치 (SRC)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | sources 읽기, 활성 피드, RSS 추가·토글·삭제(서비스) | `test_sources_and_research.py` |
| 있음 | 후보 탐색(카탈로그), URL 검사(GitHub), 후보 등록 | `test_sources_and_research.py` |
| 있음 | 딥 리서치 피드 탐지·평가·실행·감사 로그·API | `test_deep_researcher.py` |
| 있음 | `sources.json` 저장의 `replace` 실패(`EBUSY`) 대체 경로와 평소 원자적 교체 | `test_sources_write_fallback.py` |
| 없음 | 소스 관리 API(RSS 추가, GitHub 저장소 추가, 토글, 삭제) | `backend/app/api/sources.py:49-91` |
| 없음 | GitHub 저장소 추가 서비스 | `backend/app/services/sources_service.py:222-243` |
| 없음 | `POST /api/research/inspect-url` | `backend/app/api/research.py:24-33` |
| 없음 | 일반 웹사이트(HTML link 태그, 표준 경로 탐침) 피드 탐지 | `backend/app/services/source_researcher.py:204-268`, `deep_researcher.py:223-265` (테스트는 GitHub 분기만 지난다) |

#### MCP 서버 (MCP)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | `/api/mcp/info` 응답의 tools 개수 (정적 목록) | `test_api.py::test_mcp_info` |
| 없음 | MCP 도구 4개의 실제 동작 | `backend/app/mcp/server.py:10-50` |

#### 설정·DB·운영
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | config.json 탐색·로드, 임의 값 조회, 버전, 기본 모델 | `test_config_and_live_llm.py`, `test_dynamic_rag_retrieval.py::test_version_0_2_2_consistency`, `test_anthropic_provider.py::test_anthropic_config_and_schema_defaults` |
| 있음 | 설정 저장(`save_json_config`) 성공 경로 | `test_briefing_settings_get_and_post` |
| 있음 | 스키마 생성(fixture), FTS 테이블 동기화, 채팅 저장 컬럼(model_tier, usage) | `conftest.py`, `test_dynamic_rag_retrieval.py::test_ensure_fts_table_creates_table_and_indexes_items`, `test_anthropic_provider.py::test_chat_session_persistence_with_model_tier_and_usage` |
| 있음 | Makefile 대상 집합·`.PHONY`·`SHELL`, 12개 대상 `make -n`, `test` = `check`, 레시피가 부르는 파일, `\|\| true`·`config.json` 읽기 전용 마운트 부재, compose 파일 유효성, `reset` URL 변수, `docker-logs` 종료 130 처리 | `test_make_targets.py` |
| 없음 | production 모드 SECRET_KEY 길이 검사 | `backend/app/config.py:140-141` |
| 없음 | 설정 저장 실패 경로(500) | `backend/app/config.py:171-173`, `backend/app/api/briefing.py:208-209` |
| 없음 | 옛 DB 의 컬럼 추가(ALTER) 분기 | `backend/app/database.py:49-70` |

### 3.24 `backend/tests/test_code_review_fixes.py` (27, Cycle 6·7)
결과: 27개 모두 PASS (Cycle 6·7 GREEN). fixture `chat_session_id`(새 세션 UUID, teardown 에서 그 세션의 메시지·세션 행을 지운다).

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_session_upsert_with_existing_message_ids_is_idempotent | 이미 있는 메시지 id 를 다시 보낸 세션 업서트가 201·중복 없음·갱신 뒤 상태 응답 | `services/chat_session_service.py` `append_messages_batch`, `get_session_detail` | ASGI |
| test_deep_research_resets_running_flag_on_error | 사이클 예외 뒤 `is_running` False, 다음 실행 가능 | `services/deep_researcher.py` `run_deep_research` | `monkeypatch`(발굴·탐침) |
| test_deep_research_evaluates_mined_candidates | 발굴 후보가 `max_candidates` 안에서 평가된다 | `deep_researcher.py` `_run_cycle` | `monkeypatch`(발굴·탐침) |
| test_toggle_and_delete_github_repo_with_slash | `owner%2Frepo` 토글·삭제 200 | `api/sources.py` | ASGI, `sources.json` 세션 사본 |
| test_toggle_rss_feed_by_url_id | URL id RSS 토글 200 | `api/sources.py`, `sources_service.toggle_source` | ASGI, 세션 사본 |
| test_toggle_unknown_repo_still_404 | 없는 저장소는 서비스의 404 | `api/sources.py` | ASGI |
| test_chat_stream_invalid_model_tier_returns_400 | 400 `ERR_INVALID_MODEL_TIER` | `api/chat.py` `chat_stream` | ASGI |
| test_chat_stream_non_object_body_returns_400 | 본문 배열 → 400 `ERR_INVALID_PAYLOAD` | 같음 | ASGI |
| test_chat_stream_invalid_field_returns_400 | `top_k: 99` → 400 `ERR_INVALID_PAYLOAD` | 같음 | ASGI |
| test_ask_stream_partial_failure_does_not_append_fallback | Anthropic 토큰 뒤 실패 → 폴백·`done`·캐시 없음 | `services/llm_processor.py` `stream_question_answer` | `monkeypatch`(`anthropic_provider.stream_chat`) |
| test_ask_stream_openai_partial_failure_does_not_append_fallback | OpenAI 토큰 뒤 실패 → 같음 | 같음 | `monkeypatch`(`openai.AsyncOpenAI`) |
| test_ask_stream_failure_before_tokens_still_falls_back | 토큰 전 실패는 휴리스틱 답·`done`·캐시 | 같음 | `monkeypatch` |
| test_anthropic_stream_overloaded_error_event_raises | `overloaded_error` 이벤트 → `AnthropicOverloadedException` | `llm_providers/anthropic_provider.py` `stream_chat` | `patch("httpx.AsyncClient.stream")` |
| test_anthropic_stream_error_event_raises | 그 밖의 `error` 이벤트 → `AnthropicStreamError` | 같음 | 같음 |
| test_anthropic_stream_max_tokens_raises_truncated | `stop_reason=max_tokens` → `AnthropicStreamError` | 같음 | 같음 |
| test_chat_stream_truncated_answer_ends_with_error_not_done | 잘린 답 → `event: error`, `done`·저장 없음 | `chat_service.stream_chat`, `stream_tokens`, `anthropic_provider` | ASGI, 흉내 Claude(`claude_stream_stop_reason`) |
| test_chat_stream_anthropic_error_event_ends_with_error_not_done | 스트림 `error` 이벤트 → `event: error`, `done`·저장 없음 | 같음 | ASGI, 흉내 Claude(`claude_stream_error`) |
| test_chat_stream_end_turn_still_completes | 정상 종료는 `done`·저장 2개 | 같음 | ASGI, 흉내 Claude |
| test_stream_with_client_ids_then_session_post_saves_each_turn_once | 클라이언트 id 로 스트림 저장 + 같은 id 세션 POST, 두 턴 → 메시지 4개 (BUG-02R) | `chat_service.stream_chat`, `chat_session_service.persist_turn`, `append_messages_batch` | ASGI, 흉내 Claude |
| test_stream_after_session_post_with_same_ids_does_not_duplicate | 세션 POST 가 먼저 저장해도 스트림 `done`, 행 2 | 같음 | ASGI, 흉내 Claude |
| test_persist_turn_with_existing_ids_returns_without_index_error | 지정 id 로 저장, 재호출은 `(None, None)` | `chat_session_service.persist_turn` | 없음 |
| test_stream_persists_turn_before_done_event | `done` 시점에 이미 저장됨 | `chat_service.stream_chat` | 흉내 Claude |
| test_chat_stream_invalid_message_ids_return_400 (4) | 같은 id·빈 값·37자·정수 → 400 `ERR_INVALID_PAYLOAD` | `schemas/chat.py` `ChatStreamRequest`, `api/chat.py` | ASGI |
| test_chat_stream_message_ids_null_or_36_chars_are_accepted | 36자·null 허용, null 은 uuid4 | 같음 + `persist_turn` | ASGI, 흉내 Claude |

---

## 4. 최종 테스트 커버리지 리포트

- **전체 라인 커버리지**: 측정하지 않음. `pytest-cov`·`coverage` 가 `.venv` 에 없고 `backend/requirements.txt` 에도 없다. 목표치(85%)는 지금 검사 대상이 아니다.
- **실행 명령어**: `python3 .claude/skills/backend-tdd-workflow/scripts/run_backend_tdd.py --phase green` (= `cd backend && ../.venv/bin/pytest -v tests/`)
- **결과**: 244 passed in 14.11s (2026-11-09 Cycle 7 뒤 `make check`, FAILED·ERROR·SKIPPED 0). Cycle 6 뒤는 235 passed in 12.87s. Cycle 6 이전은 217 passed in 14.30s. 커버리지 판단은 3.23 의 '있음/없음' 표로 대신한다.

---

## 5. 테스트 격리와 실행 환경

`make check` 의 backend 테스트는 LLM 을 실제로 부르지 않고 git 이 추적하는 설정 파일을 고치지 않는다.

- **DB 격리**: `backend/tests/conftest.py` 가 `DATABASE_URL` 을 `backend/tests/test_agentlens.db` 로 바꾸고(`conftest.py:6-7`) 테스트마다 스키마를 보장한다(`init_db`). 데이터는 지우지 않아 실행할 때마다 쌓인다. 개발 DB `agentlens.db` 는 쓰지 않는다. conftest 가 `DATABASE_URL` 을 먼저 설정하고, `load_dotenv(override=False)` 와 pydantic 의 "환경변수 우선" 규칙 때문에 `.env` 의 `DATABASE_URL` 이 덮지 못한다 (`backend/app/config.py:8-10`).
- **LLM 격리**: autouse `llm_isolation` 이 모든 테스트에서 LLM 설정 원천을 비운다 (환경 변수 `ANTHROPIC_API_KEY`·`OPENAI_API_KEY`·`GEMINI_API_KEY`·`OLLAMA_BASE_URL`·`OLLAMA_MODEL` 제거, `settings` 의 같은 필드, `llm_processor.openai_key`·`ollama_url` 을 `None`). 그 위에 `settings.ANTHROPIC_API_KEY = "sk-ant-test-fake"` 를 둬 흉내 Claude 를 쓰는 상태가 기본이다. `Settings.model_config["env_file"]` 을 `None` 으로 둬 `settings.reload()` 가 `.env` 를 다시 읽지 않는다. 그래서 `.env` 의 키, 로컬 Ollama 상태, 설치된 모델과 상관없이 결과가 같다.
- **LLM 흉내**: `backend/tests/llm_fakes.py` 가 `httpx`·`httpx2`(openai SDK 가 쓰는 전송)의 기본 전송 `handle_request`·`handle_async_request` 를 감싼다. `api.anthropic.com`, `api.openai.com`, `generativelanguage.googleapis.com`, 포트 11434 인 모든 호스트, 테스트가 등록한 흉내 Ollama 주소로 가는 요청은 흉내가 답한다 (흉내 Claude 는 늘 등록, OpenAI·Ollama 는 테스트가 등록). 흉내가 등록되지 않은 LLM 호스트 요청은 보내지 않고 `ConnectError` 를 내며 기록하고, fixture 정리 단계에서 그 테스트를 실패시킨다 (가드). 그 밖의 호스트는 실제로 나간다. `ASGITransport` 와 `httpx.AsyncClient.post`·`.stream` 을 직접 patch 한 테스트는 이 계층을 거치지 않는다.
- **프로바이더 조건 조절**: fixture `llm_sources` 가 Anthropic 키까지 비운 뒤 테스트가 원천(`settings`·환경 변수·테스트별 `config.json` 사본)과 덮어쓰기를 하나씩 켠다. `fake_llm` 은 흉내 객체(등록, 요청 기록 `requests(provider, path)`, `assert_no_unmocked`, `take_unmocked`)다.
- **설정 파일 격리**: 세션 fixture 가 루트 `config.json`(LLM 키 세 개와 `ollama_base_url` 을 비운 것)과 루트 `sources.json` 의 사본을 세션 임시 폴더에 만든다. autouse fixture 가 `app.config.find_config_json`·`app.config._json_data`, `sources_service._file_path`·`_mirror_path` 를 이 사본으로 돌린다. 원본은 읽기만 하고, 테스트 사이 상태는 세션 동안 사본으로 이어진다. `_json_data` 는 매 테스트 시작 때 세션 사본을 다시 읽은 값이다.
- **Makefile·스크립트 회귀**: Makefile 대상 집합·`.PHONY`·`SHELL`, 12개 대상 `make -n` 종료 0·stderr 없음, `test` = `check`, 레시피가 부르는 파일, `|| true`·`config.json` 읽기 전용 마운트 없음, `docker compose config -q`, `reset` 의 URL 변수, `docker-logs` 의 종료 130 처리 (`test_make_targets.py`). `scripts/collect.py` 모드 선택·완료 판정(스텁 HTTP 서버, `test_collect_script.py`). 빈 DB 첫 수집 백그라운드·종료 때 취소(`test_startup_seed.py`). `sources.json` 저장의 `EBUSY` 대체 경로(`test_sources_write_fallback.py`). make 는 `-n` 으로만 부르고 대상을 실제로 실행하지 않는다. 모두 `make check` 에 포함된다.
- **`.env` 읽기**: `backend/app/config.py:8-10` 이 import 때 `cwd/.env`, `cwd/backend/.env`, `cwd.parent/.env`, `backend/.env` 를 `load_dotenv(override=False)` 로 읽고, `config.py:102-105` 의 pydantic `env_file` 도 같은 파일을 읽는다. `make check` 는 `backend/` 에서 pytest 를 돌리므로 `backend/.env` 와 루트 `.env` 가 모두 읽힌다. LLM 필드는 위 LLM 격리가 테스트마다 덮는다. LLM 밖의 값(`VERSION`, `ANTHROPIC_*_MODEL` 등)은 덮지 않는다 (7.4).
- **`is_test_environment()`**: 조건은 `settings.TESTING` 이 참, 환경변수 `TESTING` 또는 `CI` 가 true/1/yes, 또는 `"pytest" in sys.modules` (`backend/app/services/llm_processor.py:288-299`). pytest 실행 중에는 마지막 조건으로 항상 True 다. 호출처는 `backend/app/services/chat_service.py:381` 한 곳뿐이고 global 챗의 planner LLM 호출만 건너뛴다. `generate_live_answer`(`llm_processor.py:340`), `stream_tokens`(`:404`), `evaluate_content_with_llm`(`:619`), `answer_question_with_meta`(`:787`), `stream_question_answer`(`:901`), `has_live_provider` 의 Ollama 탐침(`:171-194`)은 이 판정을 보지 않는다. 테스트 중 실제 LLM 호출은 하네스가 막는다. conftest 는 `TESTING`, `CI` 를 설정하지 않고, `config.py:131-132` 는 `TESTING` 환경변수가 있을 때만 `settings.TESTING` 에 반영한다.
- 실제 Claude 응답 확인은 `make check` 에 없다. API 형식 변경·키 만료는 손으로 돌리는 스모크로만 잡힌다 (Cycle 1 의 R11 스모크).

### 5.1 통과 기준
- `make check` 종료 코드 0.
- 버그 수정은 먼저 실패하던 테스트가 통과한다 (`run_backend_tdd.py --phase red` → `--phase green`).
- `make check` 뒤 `git status` 에 `config.json`·`sources.json`·`backend/app/config/sources.json` 변경이 없다.
- 지정한 고위험 영역은 없다.

---

## 6. 외부 호출 판정

판정 기준: "외부 호출함" 은 mock 없이 인터넷 호스트로 요청을 보내는 경로가 테스트에서 항상 실행된다는 뜻이다. "조건부" 는 키·설정·캐시·로컬 서비스 상태에 따라 갈린다.

요약: LLM 호출(Anthropic, OpenAI, Ollama, Gemini)은 흉내가 답하거나 가드가 막는다. 남은 외부 호출(네트워크 상태에 따라 결과가 바뀔 수 있다)은 scoped 챗 4개(스크래퍼가 github.com·example.com GET), `test_probe_and_discover_feed_github`·`test_source_researcher_inspect_url`·`test_deep_research_run_and_audit`(github.com 등), `test_notion_export_page_mock`(api.notion.com), `test_email_api_endpoints`(`config.json` 의 SMTP 호스트 연결 시도)다.

### 6.1 설정·소스·딥 리서치 테스트
| 항목 | 판정 | 근거 `path:line` |
|---|---|---|
| `test_config_and_live_llm.py::test_config_json_found_and_loaded`, `test_get_custom_json_value` | 안 함 | 설정 파일 읽기만 한다 (`config.py:14-35`) |
| `test_config_and_live_llm.py::test_llm_processor_fallback_and_answer` | 안 함 (흉내 Claude) | `answer_question` → `answer_question_with_meta` (`llm_processor.py:974-977`, `756-792`) → `_generate_live_answer` → `generate_live_answer` → `httpx.AsyncClient.post("https://api.anthropic.com/v1/messages")` (`anthropic_provider.py:233-234`) 를 하네스의 흉내 Claude 가 받는다. 예외: 같은 프로세스에서 `test_anthropic_provider.py::test_anti_gemini_stream_question_answer_never_yields_gemini` 가 먼저 돌면 같은 캐시 키(제목+질문)로 휴리스틱 답이 `_qa_cache` 에 들어가고(`llm_processor.py:971`), 이 테스트는 캐시를 돌려받아 호출하지 않는다(`llm_processor.py:765-768`). 파일 이름순 실행에서는 그 테스트가 먼저 돈다 |
| `test_deep_researcher.py::test_probe_and_discover_feed_github` | 외부 호출함 | GitHub 분기(`deep_researcher.py:216-221`) → `_fetch_and_parse_feed` 가 `https://github.com/All-Hands-AI/OpenHands/releases.atom` 을 httpx GET 하고 `feedparser.parse(resp.text)` 로 로컬 파싱한다(`deep_researcher.py:267-278`). 네트워크가 없으면 status 가 success 가 아니어서 실패한다 |
| `test_deep_researcher.py::test_evaluate_and_decide_scoring` | 안 함 | `evaluate_and_decide` 는 sources.json 읽기와 휴리스틱 점수만 쓴다 (`deep_researcher.py:304-374`, `llm_processor.py:516-580`) |
| `test_deep_researcher.py::test_deep_research_run_and_audit` | 외부 호출함 (파일 쓰기 가능) | `run_deep_research(max_candidates=2)` 가 시드 앞 2개(`https://lilianweng.github.io`, `https://eugeneyan.com`, `deep_researcher.py:23-31`, `395-412`)를 probe 한다: 페이지 GET, 표준 경로 HEAD 탐침, 피드 GET (`deep_researcher.py:223-263`, `269-271`). 점수 8.2 이상이면 `sources_service.add_rss_source` 로 sources.json(세션 사본)에 추가하고(`deep_researcher.py:441-449`) 테스트는 지우지 않는다. 네트워크가 실패해도 REJECTED 로그가 남아 테스트는 통과한다 |
| `test_deep_researcher.py::test_deep_research_api_endpoints` | 조건부 | `/status`, `/audit-logs` 는 호출 없음. `POST /run-deep?max_candidates=1` 은 `asyncio.create_task(run_deep_research(...))` 로 시드 1개 probe 를 시작한다(`backend/app/api/research.py:87`). 테스트는 응답만 확인하고 끝나므로, 테스트 이벤트 루프가 닫히기 전까지 태스크가 어디까지 진행되는지는 확인하지 못했다 |
| `test_sources_and_research.py::test_sources_service_load`, `test_sources_service_active_feeds` | 안 함 | sources.json 읽기 (`sources_service.py:36-45`, `134-139`) |
| `test_sources_and_research.py::test_sources_toggle_and_crud` | 안 함 (세션 사본 수정) | `add_rss_source`·`toggle_source`·`delete_source` 가 매번 `save_sources` 로 파일을 쓴다 (`sources_service.py:169-220`, `245-262`, `102-132`) |
| `test_sources_and_research.py::test_source_researcher_discover` | 안 함 | `discover_sources` 는 메모리 상수 `CURATED_ECOSYSTEM_CATALOG` 만 거른다 (`source_researcher.py:331-383`). docstring 의 "live feed probing" 과 달리 네트워크 호출이 없다 |
| `test_sources_and_research.py::test_source_researcher_inspect_url` | 외부 호출함 | GitHub 분기(`source_researcher.py:193-198`) → `https://github.com/princeton-nlp/SWE-bench/releases.atom` httpx GET 후 feedparser 파싱 (`source_researcher.py:270-281`). 실패하면 status 가 found 가 아니어서 실패한다 |
| `test_sources_and_research.py::test_sources_and_research_api_endpoints` | 안 함 (세션 사본 수정) | `GET /api/sources` 는 파일 읽기, `POST /api/research/discover` 는 메모리 카탈로그, `register-candidate` 는 `add_rss_source` 로 파일을 쓰고(`source_researcher.py:397-404`) 테스트 끝에서 `delete_source` 로 지운다 (finally 블록이 아니다) |
| `test_sources_toggle_and_crud` 가 고치는 sources.json | 세션 임시 사본 (저장소 루트 `sources.json` 은 바뀌지 않음) | `find_sources_file` 후보 순서: `cwd/sources.json` → `cwd.parent/sources.json` → `<저장소 루트>/sources.json` → `backend/app/config/sources.json` (`sources_service.py:11-24`). `make check` 는 `cd backend && pytest` 라 `backend/sources.json`(없음) 다음의 `../sources.json` = 루트 파일이 잡힌다. 루트에서 pytest 를 돌려도 `cwd/sources.json` 이 같은 루트 파일이다. `backend/app/config/sources.json` 은 루트 파일이 없을 때만 쓰인다. 테스트에서는 `llm_isolation` 이 `sources_service._file_path` 와 거울 경로 `_mirror_path`(`sources_service.py:29`) 를 세션 사본으로 바꿔 사본에 쓴다. 쓰기는 `.tmp` 에 쓴 뒤 `replace` 한다. 교체가 `OSError` 면 대상 파일에 제자리로 쓴다 (`sources_service.py:102-118`) |

### 6.2 그 밖의 외부 호출 판정
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
| `test_briefing_notion_email.py::test_notion_export_page_mock` | 외부 호출함 | `httpx.AsyncClient.post` 만 patch 한다. `create_briefing_page` 의 `GET https://api.notion.com/v1/databases/{id}` (`notion_service.py:238-240`)는 patch 되지 않아 가짜 키 `secret_test123` 으로 실제 요청을 보낸다. 예외·비 200 은 무시된다(`:240-246`) |
| `test_briefing_notion_email.py::test_email_api_endpoints` (`/test/email` 부분) | 조건부 (현재 config.json 으로는 외부 호출함) | 요청의 `smtp_host` 가 "" 이라 `settings.SMTP_HOST` 를 쓴다(`email_service.py:190`). 커밋된 루트 `config.json` 의 `briefing.email.smtp_host` 는 "smtp.gmail.com", `smtp_to` 는 "team@example.com" 이라 수신자가 생기고(`:200-202`), `smtplib.SMTP("smtp.gmail.com", 587)` 연결과 STARTTLS 를 시도한다(`:158-164`). `config.json` 의 smtp_user/smtp_password 값은 확인하지 못했다. 값이 있으면 로그인과 발송까지 간다(`:166-169`). 실패하면 400 이 나와 테스트는 통과한다 |
| `test_briefing_notion_email.py::test_notion_api_endpoints` (`/test/notion` 부분) | 조건부 | 요청 키가 "" 이라 `settings.NOTION_API_KEY` 를 쓴다(`notion_service.py:35`). 이 값이 비어 있으면 호출 없이 400, 값이 있으면 `GET https://api.notion.com/v1/users/me` 를 보낸다(`:41-43`). config.json 의 Notion 키 값은 확인하지 못했다 |
| `test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer`, `test_anti_gemini_isolation_in_stream_tokens` | 안 함 | `settings.OLLAMA_BASE_URL` 을 "" 로 patch 한다. `_resolve_ollama_url` 은 다음으로 `config.json` 의 `ollama_base_url` 을 보지만 하네스의 세션 사본에서는 빈 값이고 환경 변수도 지워져 있어, Ollama 탐침 없이 판정이 False 가 된다 (`llm_processor.py:150-160, 319`) |
| `test_llm_processor.py::test_stream_tokens_fails_fast_without_mock_fallback` | 안 함 | `llm_processor.openai_key`·`ollama_url` 을 "" 로 patch 한다. 덮어쓰기가 `None` 이 아니면 그 값만 쓰므로 OpenAI·Ollama 갈래가 꺼진다 (`llm_processor.py:131-132, 152-153, 476`) |
| 키가 없을 때 `has_live_provider()` 를 지나는 테스트 | 안 함 | Anthropic·OpenAI 키가 없고 Ollama 주소가 있으면 `httpx.Client.get(f"{ollama_url}/api/tags")` 를 보낸다 (`llm_processor.py:171-194`). 하네스 기본 상태에는 가짜 Anthropic 키가 있고, 키를 비우는 테스트도 Ollama 주소가 비어 있거나 흉내 Ollama 로 간다. 흉내 없는 포트 11434 요청은 가드가 막고 테스트를 실패시킨다 |

---

## 7. 알려진 불일치·위험

### 7.1 테스트가 쓰는 설정 파일
- `test_briefing_notion_email.py::test_briefing_settings_get_and_post` 는 `POST /api/briefing/settings` 로 `save_json_config` 를 불러(`backend/app/api/briefing.py:207`, `backend/app/config.py:161-169`) `config.json` 을 덮어쓰고 `settings.reload()` 한다. 테스트에서는 세션 사본에 쓰고 루트 `config.json` 은 바뀌지 않는다. 커밋된 루트 `config.json` 에는 예전 실행이 남긴 이 테스트의 값(`notion.page_id: "test_notion_parent_page"`, `email.smtp_host: "smtp.gmail.com"`, `email.smtp_to: "team@example.com"`, `test_briefing_notion_email.py:145-150`)이 들어 있고, 세션 사본이 이 값을 그대로 가져간다.
- 위 값 때문에 `test_email_api_endpoints` 의 `/test/email` 이 실제 SMTP 연결을 시도한다 (6.2).
- `test_sources_toggle_and_crud`, `test_sources_and_research_api_endpoints`, `test_deep_research_run_and_audit` 가 `sources.json` 을 쓴다. 세션 사본이라 루트 `sources.json`·`backend/app/config/sources.json` 은 바뀌지 않지만, 같은 세션의 뒤 테스트는 바뀐 사본을 본다. 앞의 둘은 추가 후 지우지만 try/finally 가 없어 중간 단언이 실패하면 항목(`test_feed_discovery`, `test_autogen_blog`)이 사본에 남는다. 딥 리서치는 AUTO_ADOPTED 소스를 지우지 않는다.

### 7.2 테스트 DB
- `backend/tests/test_agentlens.db`, `-shm`, `-wal` 은 로컬에 있지만 git 에 커밋돼 있지 않다 (`.gitignore:21` `backend/tests/test_agentlens.db`, `.gitignore:14-15` `*.db-shm`·`*.db-wal`). 2026-11-09 실행 뒤 크기: db 176,128 B, shm 32,768 B, wal 4,181,832 B.
- conftest 는 `create_all` 로 없는 테이블만 만들고 데이터를 지우지 않는다(`backend/app/database.py:45-48`, `conftest.py:13-44`). 기존 테이블·행이 유지되므로 고정 id 시드(1, 101~103, 201, 9001~9005), 스크래퍼가 저장한 `full_content`, 자동 저장된 채팅이 실행 사이에 남는다.

### 7.3 순서 의존
- `_qa_cache` 공유: `test_anthropic_provider.py::test_anti_gemini_stream_question_answer_never_yields_gemini` 가 남긴 휴리스틱 답을 `test_config_and_live_llm.py::test_llm_processor_fallback_and_answer` 가 같은 키로 받는다 (조회 `llm_processor.py:765-768`, 저장 `:971`). 단독 실행 때와 전체 실행 때 경로가 다르다.
- item 201 은 `test_chat.py::test_sqlite_fts_retriever_auto_relaxation_on_zero_matches` 만 넣는다. 같은 파일 뒤쪽 `test_chat_query_with_focus_filters_and_relaxation` 은 완화 결과가 있어야 `is_relaxed` 가 True 가 되는데(`retriever.py:569-586`), 201 이 없을 때(예: 이전 실행의 초기화 테스트로 DB 가 비워진 뒤 단독 실행)의 결과는 확인하지 못했다.
- `test_reset_and_delete.py` 두 테스트가 테스트 DB 의 뉴스(와 크롤 로그)를 모두 지운다. 다음 테스트는 fixture 가 다시 시드한다.
- 스크래퍼 L1 캐시가 클래스 속성이라(`scraper.py:35`) 프로세스 전체에서 공유된다. scoped 테스트의 외부 요청 여부가 앞선 테스트에 따라 달라진다.
- `POST /api/research/run-deep` 가 띄운 백그라운드 태스크(`research.py:87`)가 테스트 종료 후에도 남아 있을 수 있다. `deep_researcher.is_running` 이 남으면 같은 프로세스의 다음 실행이 `already_running` 을 받는다(`deep_researcher.py:385-386`). 실제 진행 범위는 확인하지 못했다.

### 7.4 실행 환경에 따라 실패할 수 있는 테스트
- 네트워크가 없으면 실패: `test_probe_and_discover_feed_github`, `test_source_researcher_inspect_url`.
- LLM 키·로컬 Ollama 상태·설치 모델에 따라서는 결과가 바뀌지 않는다 (하네스). 2026-11-08 키 있음/없음, OpenAI 키만, Ollama 연결 안 됨/설정 모델 없음/있음 여섯 조건(C1~C6)에서 그때 174개 모두 통과했다 (Cycle 1 G2).
- `.env` 값이 settings 를 덮는다: `VERSION`, `ANTHROPIC_*_MODEL` 이 바뀌면 `test_version_*`, `test_anthropic_config_and_schema_defaults` 가 실패한다. `test_config_json_found_and_loaded` 는 `HIGH_SIGNAL_THRESHOLD == 7.0` 을 단언하는데 이는 config.json 값이고 코드 기본값은 7.8 이다(`config.py:65`).
- `test_t4_compose_config_is_valid` 는 docker CLI 가 없으면 skip 된다.

### 7.5 효과가 없는 patch
- `AgenticSearchService.evaluate_and_search` patch (`test_chat.py:258`, `test_agentic_workflow.py:267, 323, 435`): 서비스 코드에 호출처가 없다 (호출은 `agentic_search.py:242` 내부뿐). `test_chat_scoped_graceful_degradation_when_scrape_fails` 는 이 mock 에 보조 출처를 넣지만 단언하지 않는다.
- `llm_processor.check_provider_available` patch (`test_agentic_workflow.py:268, 324`): 테스트가 `ChatService.stream_chat` 을 직접 부르는데 서비스는 이 함수를 부르지 않는다 (호출은 `api/chat.py:349`).

### 7.6 이름·설명과 실제 단언의 불일치
- `test_version_0_2_2_consistency`, `test_version_is_0_2_2` 는 0.4.1 을 단언한다. `test_config_json_found_and_loaded` 는 허용 버전 튜플을 하드코딩한다 (`test_config_and_live_llm.py:11`). 버전을 바꾸면 이 세 곳을 함께 고쳐야 한다.
- `test_article_scraper_l1_l2_cache_and_db_persistence` 의 세 번째 단계는 "새 인스턴스는 L2(DB)에서 읽는다" 고 설명하지만 L1 캐시가 클래스 속성이라 새 인스턴스도 L1 에서 읽는다 (`scraper.py:35`, `136-138`). 단언(HTTP 1회)은 L1/L2 를 구분하지 못한다.
- `test_chat_query_scoped_with_agentic_workflow_success` 의 docstring 은 "dual sources, supplementary_count>=1" 이지만 단언은 `supplementary_count == 0` 이다.
- `test_unit_test_mock_provider` 는 테스트 파일 안에 정의한 클래스만 검증한다.
- `test_agentic_workflow.py:268, 324` 의 patch 반환값은 `(True, "mock-gemini")` 다 (위 7.5 처럼 효과는 없다).

### 7.7 건너뛰는 테스트·계약
- `skip`, `xfail` 마커는 backend 에 없다. 실행 중 건너뛰기는 `test_make_targets.py::test_t4_compose_config_is_valid` 하나다.
- MSW 에만 있는 엔드포인트: `GET /api/chat/stream` (`frontend/src/mocks/handlers.ts:480`)을 frontend 계약 테스트가 검증하지만 backend 에는 `POST /api/chat/stream` 만 있다 (`backend/app/api/chat.py:276`). backend 응답 형식과 frontend zod 스키마를 함께 대조하는 테스트는 없다.
