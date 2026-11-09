# Plan: backend LLM 호출 정상화와 실행 환경에 의존하지 않는 `make check`

Spec: ./spec.md
Status: approved
Approved-by: 자동 승인 (Claude) (2026-11-08)
Type: bugfix

## 시작 전 기준선 (2026-11-08, HEAD a6526b4, 이 plan 작성 때 측정)
- `cd backend && ../.venv/bin/pytest --collect-only -q tests/`: 160 tests collected (파일 16개).
- `git diff --stat main -- backend/` 출력 없음. 이 브랜치(`feat/ui-redesign`)는 지금 backend 를 바꾸지 않았다. 그래서 spec 의 `git diff main …` 확인과 이 기능 시작 커밋 `a6526b4` 기준 확인은 결과가 같다. 아래 확인 명령은 spec 대로 `main` 을 쓴다.
- `git status --porcelain -- config.json sources.json backend/app/config/sources.json` 출력 없음.
- 루트 `config.json` 의 `llm` 절에서 키 네 개(`anthropic_api_key`·`openai_api_key`·`gemini_api_key`)는 빈 값이고, `ollama_base_url` 은 `http://localhost:11434`, `ollama_model` 은 `llama3.2:latest` 다.
- 패키지: `httpx 0.28.1`, `openai 3.14.0`, `pydantic_settings 2.15.0`, `pytest 9.1.1`. 새 의존성은 더하지 않는다.
- C1 의 지금 결과 (intent, 2026-11-07): `2 failed, 158 passed` (`test_anti_gemini_isolation_in_generate_live_answer`, `test_anti_gemini_isolation_in_stream_tokens`).

## 변경 파일
backend 코드 (역할 게이트 경로, implementer 만 고친다):
- `backend/app/services/llm_processor.py` — OpenAI 키·OpenAI 모델·Ollama 주소·Ollama 모델 해석 함수 4개와 덮어쓰기 규칙, Ollama 가용성 판정(`/api/tags` + 설정 모델 설치 확인, 판정 이유 로그), 쓰는 곳 전부를 해석 함수로 바꿈 (spec 설계 1·2절, R1~R5·R12)
- `backend/app/services/sources_service.py` — `save_sources` 의 거울 경로를 `SourcesService` 인스턴스 속성으로 (기본값은 지금 고정 경로 그대로) (spec 설계 3절, R9)

테스트 (게이트 경로 밖이지만 범위를 밝힌다):
- `backend/tests/conftest.py` — LLM 격리 하네스: 흉내 LLM fixture, 조건 조절 fixture, autouse 기본 상태, 설정 파일 임시 사본, 가드 (spec 설계 4절, R6·R9). 기존 `init_db` fixture 와 `DATABASE_URL` 설정은 그대로 둔다
- `backend/tests/llm_fakes.py` — 새 파일. 흉내 전송 계층과 흉내 Claude·OpenAI·Ollama 응답, 요청 기록, 가드 (spec 설계 4절 '흉내 도움 모듈')
- `backend/tests/test_llm_provider_isolation.py` — 새 파일. 회귀 테스트 T1~T8, T7b, Ollama 탐침 1회·1.0초, API 503 두 개, 가드 자체 시험 (spec 설계 5절, R2~R4·R6·R10)

문서 (마지막 단계, spec 설계 7절):
- `docs/tech-spec.md` — '공통 규칙' 의 '외부 연동' (Ollama 가용 기준 = `/api/tags` 200 + 설정 모델 설치), '변경 이력'. '설정' 문장은 바꾸지 않는다
- `docs/operations.md` — '설정 우선순위' 의 호출 시점 `config.json` 재읽기 문장 근거 줄 번호를 해석 함수로, Settings 필드 표의 `OPENAI_API_KEY`·`OPENAI_MODEL`·`OLLAMA_*` 사용 위치, 외부 의존 표의 Ollama 행, 문제 해결 표의 503 행 (설정 모델 미설치, 확인 명령 `curl $OLLAMA_BASE_URL/api/tags`)
- `docs/functional-spec/02-ai-chat.md` — `:381` 근처 사전 가용성 서술
- `docs/functional-spec/03-collection.md` — 평가 가용성 서술 (`:136` 'Ollama `/api/tags` 1초 내 200'), `:292` 근처 Ollama 모델 서술
- `docs/api.md` — `:271`, `:292` 의 503 설명에 Ollama 설정 모델 미설치 포함
- `docs/test-strategy.md` — '외부 호출과 파일 부작용' 절 (LLM 호출은 흉내, 설정 파일은 임시 사본, 남은 외부 호출), 테스트 수, 'DB 격리' 옆에 LLM·설정 파일 격리
- `docs/test-cases.md` — 새 테스트 14행, `test_anti_gemini_isolation_in_*` 두 행의 '로컬 Ollama 탐침 가능' 비고 삭제, 외부 호출 판정 표에서 LLM 호출 판정이 바뀐 행 (`:213`, `:1233` 등)
- `docs/known-issues.md` — '테스트·운영' 의 행 삭제: spec 이 정한 두 행(`:67` 설정 파일 수정, `:69` pytest 중 실제 LLM 호출)과, 이 기능이 고치는 문제 자체인 `:75` 행(backend 테스트 8개가 실행 환경에 따라 바뀜. CLAUDE.md 문서 지도 '고친 문제 행 삭제'). 그리고 `:36` 부근 행 'Ollama 가용성 판정(`has_live_provider`)이 `/api/tags` 200 만 보고 설정 모델(`OLLAMA_MODEL`)이 설치돼 있는지는 보지 않는다' 삭제 (이번에 고친 원인 2, 2026-11-08 보충)
- `docs/data-model.md` — (2026-11-08 보충) `:294` 부근 '테스트는 실제 루트 `config.json` 과 `.env` 를 읽는다', `:436` 부근 '테스트 DB 비격리 … 테스트가 루트 config.json·`.env` 를 그대로 읽는다', `:437` 부근 '테스트가 루트 config.json 을 덮어쓴다' 서술을 지금 동작(하네스가 LLM 환경 변수·`settings` 를 고정하고 `config.json`·`sources.json` 은 세션 임시 사본을 쓰며 `.env` 재읽기를 끔, 테스트 DB 비격리는 그대로)으로 고친다. `llm_processor.py`·`sources_service.py` 근거 줄 번호 22곳을 지금 코드에 맞춘다
- `docs/functional-spec/01-news-feed.md` — (2026-11-08 보충) `llm_processor.py`·`sources_service.py` 근거 줄 번호 6곳을 지금 코드에 맞춘다
- `docs/functional-spec/05-sources-and-research.md` — (2026-11-08 보충) `llm_processor.py`·`sources_service.py` 근거 줄 번호 13곳을 지금 코드에 맞춘다
- 루트 `CLAUDE.md` '명령' 절 — 메인 세션이 고친다 (spec 설계 7절). implementer 는 고치지 않는다

바꾸지 않는 것: `backend/app/services/llm_providers/anthropic_provider.py`, `backend/app/config.py`, `backend/app/api/chat.py`, `backend/app/schemas/**`, `conftest.py` 밖의 기존 테스트 파일 15개, `frontend/**`, 루트 `config.json`·`sources.json`·`backend/app/config/sources.json`, `docs/product.md`, `.claude/**` (사람 승인이 필요한 단계 없음).

## 작업 순서
단계마다 `tasks/backend-llm-test-isolation/NN-<slug>.md` 진행 기록이 하나씩 생긴다. 모든 단계를 implementer 한 명(**implementer A**)이 순서대로 한다. 단계 2·3 이 단계 1 의 fixture 와 같은 `conftest.py` 를 이어 쓰고, 단계 3 의 통과 판정이 단계 1 의 테스트에 달려 있어 병렬로 나누지 않는다.

### 모든 단계 공통 규칙
- 테스트를 고쳐 통과시키지 않는다. 코드를 고친다. 단계 1 에서 커밋한 `test_llm_provider_isolation.py` 의 단언은 뒤 단계에서 바꾸지 않는다. 바꿔야 한다고 판단되면 그 단계를 blocked 로 두고 이유를 적는다 (plan 고침·재승인).
- 기존 테스트 파일 15개(`conftest.py` 제외)는 열어 읽기만 한다 (R8).
- 흉내 응답 내용은 기존 단언을 겨냥해 고르지 않는다 (spec 우려 2). 흉내 Claude 고정 답은 한국어 마크다운 문장 한두 개(중괄호 없음)로 한 번 정하고, 기존 테스트가 그 내용 때문에 실패하면 흉내를 바꾸지 말고 막힘으로 기록한다.
- pytest 를 돌린 뒤 매번 `git status --porcelain -- config.json sources.json backend/app/config/sources.json` 을 본다. 단계 1 까지는 기존 테스트가 이 파일들을 고치므로 `git checkout -- config.json sources.json backend/app/config/sources.json` 으로 되돌린다 (이 세 파일만). 단계 2 부터는 출력이 없어야 한다.
- 각 단계는 끝에 커밋한다 (단계 1 은 실패 테스트가 있는 채로 커밋한다).

### 1. **[implementer A] 실패하는 회귀 테스트와 흉내 도구** (`01-failing-tests`)
spec 설계 5절 표를 테스트로 옮기고, 그 테스트가 쓰는 흉내 도구를 먼저 만든다. 흉내 도구가 없으면 테스트가 '없는 fixture' 로 오류가 나, 실패 이유가 코드 결함이 아니게 되기 때문이다.

(a) `backend/tests/llm_fakes.py` — 흉내 전송 계층
- `httpx.HTTPTransport.handle_request` 와 `httpx.AsyncHTTPTransport.handle_async_request` 를 감싼다. 요청이 LLM 호스트로 가면 등록된 흉내가 응답하고, 그 밖의 호스트는 원래 메서드로 넘긴다. `ASGITransport` 와 기존 테스트의 `httpx.AsyncClient.post`·`.stream` patch 는 이 계층을 거치지 않는다.
- LLM 호스트: `api.anthropic.com`, `api.openai.com`, `generativelanguage.googleapis.com`, 포트가 11434 인 모든 호스트, 테스트가 등록한 흉내 Ollama 주소 (예: `http://fake-ollama.test:11434`).
- 흉내 Claude (`POST https://api.anthropic.com/v1/messages`, 기본 등록): 비스트림은 `{"content":[{"type":"text","text":<고정 답>}],"model":<요청 model>,"usage":{"input_tokens":…,"output_tokens":…}}` 200. `stream: true` 면 `message_start`·`content_block_delta`(`text_delta` 여러 개)·`message_delta`(`usage.output_tokens`)·`message_stop` SSE. 형식은 `test_anthropic_provider.py` 의 기존 흉내와 같게 한다.
- 흉내 OpenAI (등록할 때만): `POST https://api.openai.com/v1/chat/completions` 비스트림은 `choices[0].message.content`, `stream: true` 면 `chat.completion.chunk` SSE(`choices[0].delta.content`) 뒤 `data: [DONE]`. `stream_tokens` 의 OpenAI 갈래는 `openai.AsyncOpenAI` SDK 를 쓰는데, SDK 가 기본 `httpx.AsyncHTTPTransport` 를 거쳐 이 흉내에 잡힌다 (spec 설계 5절 T6 의 'OpenAI 스트림 흉내는 plan 에서 정함' 을 이것으로 정한다).
- 흉내 Ollama (주소마다 등록): 상태 `down`(모든 요청에 `httpx.ConnectError`), `up`(설치 모델 목록). `GET /api/tags` → `{"models":[{"name":…,"model":…}]}` 200. `POST /api/generate` → 요청 `model` 을 태그 없으면 `:latest` 붙여 설치 목록과 비교해, 있으면 200 (비스트림 `{"response":…}`, 스트림 NDJSON 여러 줄 뒤 `"done": true`), 없으면 404 `{"error":"model '<model>' not found"}`.
- 요청 기록: 흉내가 받은 요청마다 (method, url, JSON 본문, `request.extensions["timeout"]`) 를 남기고 조회하는 메서드를 둔다 (예: `fake_llm.requests("ollama", path="/api/tags")`).
- 가드: 흉내가 등록되지 않은 LLM 호스트 요청은 실제로 보내지 않고 `httpx.ConnectError("blocked by LLM test guard: …")` 를 내며 `unmocked` 목록에 남긴다. `assert_no_unmocked()` (목록이 비어 있지 않으면 `AssertionError`), `take_unmocked()` (목록을 돌려주고 비움) 를 둔다.

(b) `backend/tests/conftest.py` — 이 단계에서는 autouse 가 아닌 fixture 만 더한다
- `fake_llm`: 위 전송 계층을 `monkeypatch` 로 설치하고 흉내 객체를 돌려준다. 같은 테스트 안에서 한 번만 설치된다 (단계 2 의 autouse 가 이 fixture 를 써도 같은 객체).
- `llm_sources`: 테스트 한 개 동안 LLM 설정 원천을 모두 '없음' 으로 둔 뒤 테스트가 원천을 하나씩 켜게 하는 조절 객체. 하는 일: `ANTHROPIC_API_KEY`·`OPENAI_API_KEY`·`GEMINI_API_KEY`·`OLLAMA_BASE_URL`·`OLLAMA_MODEL` 환경 변수 제거, `settings` 의 같은 필드를 빈 값으로(`OLLAMA_MODEL` 은 `llama3.2:latest`), `llm_processor.openai_key = None`·`llm_processor.ollama_url = None`·`llm_processor.gemini_key = ""`, 테스트별 임시 `config.json` 사본(루트 `config.json` 을 읽어 `llm` 절의 키 세 개와 `ollama_base_url` 을 비운 것)을 `app.config.find_config_json` 이 돌려주게 함. 켜는 메서드: Anthropic 키, OpenAI 키(원천 `settings`·`env`·`config` 선택), Ollama 주소·모델(원천 `settings`·`config` 선택), 덮어쓰기(`openai_key`·`ollama_url` 에 값 넣기), Gemini 키(`settings`).
- 이름과 메서드 모양은 implementer 가 정하되, 단계 2·3 에서 테스트 파일을 고치지 않아도 되게 이 단계에서 확정한다.

(c) `backend/tests/test_llm_provider_isolation.py` — 테스트 14개
모든 행 테스트는 Gemini 키를 `settings` 에 두고 `_call_gemini` 를 `AsyncMock` 으로 감싸 `call_count == 0` 을 단언한다. 흉내 Ollama 주소는 `http://fake-ollama.test:11434` 처럼 실제 호스트가 아닌 이름을 쓴다.

| # | 테스트 이름 (제안) | 조건 | 단언 |
|---|---|---|---|
| 1 | `test_t1_claude_key_skips_ollama_probe` | Anthropic 있음, OpenAI 없음, Ollama `down` | `has_live_provider()` True, Ollama 요청 0회, `generate_live_answer` 흉내 Claude 답·모델 `claude-` 로 시작, `stream_tokens` 같음 |
| 2 | `test_t2_claude_preferred_over_installed_ollama` | Anthropic 있음, Ollama `up` 설정 모델 설치 | True, `/api/tags` 0회, 생성·스트림 Claude 답, `/api/generate` 0회 |
| 3 | `test_t3_no_provider_when_ollama_unreachable` | 모두 없음, Ollama `down` | False, 생성·스트림 `LLMProviderUnavailableException` |
| 4 | `test_t4_missing_ollama_model_is_unavailable` | 모두 없음, Ollama `up` 다른 모델만(`gpt-oss:20b`) | False, 생성·스트림 `LLMProviderUnavailableException` (지금은 `LLMUpstreamException`), `/api/generate` 0회 |
| 5·6 | `test_t5_installed_ollama_model_used[settings_model]`, `[config_model]` | 모두 없음, Ollama `up` `llama3.2:latest` 설치. `settings_model`: `settings.OLLAMA_MODEL = "llama3.2:latest"`. `config_model`: `settings.OLLAMA_MODEL = ""`, 사본 `config.json` `ollama_model = "llama3.2:latest"` | True, 생성·스트림 Ollama 답, `/api/generate` 요청 본문 `model` 이 생성·스트림 모두 `llama3.2:latest` (R3 b) |
| 7 | `test_t6_openai_key_only` | OpenAI 키만(`settings`), 흉내 OpenAI 등록, Ollama `down` | True, 생성은 흉내 OpenAI 답, 스트림은 흉내 OpenAI SSE 조각을 이은 답 |
| 8 | `test_t7_ollama_url_from_config_json_when_settings_empty` | 모두 없음, `settings.OLLAMA_BASE_URL = ""`, 사본 `config.json` `ollama_base_url` = 흉내 주소(`up`, 모델 설치) | True, 생성·스트림 Ollama 답, `/api/generate` 요청이 그 주소로 감 (R1 b, `config.json` 보충 유지) |
| 9 | `test_t7b_empty_overrides_disable_openai_and_ollama` | OpenAI 키를 `settings`·환경 변수·사본 `config.json` 모두에 둠, Ollama 흉내 주소(`up`, 모델 설치)를 `settings`·사본 `config.json` 에 둠, 덮어쓰기 `openai_key = ""`·`ollama_url = ""` | False, 생성·스트림 `LLMProviderUnavailableException`, OpenAI·Ollama 요청 0회 (R1 b) |
| 10 | `test_t8_untagged_model_matches_latest_tag` | 모두 없음, `settings.OLLAMA_MODEL = "llama3.2"`, 설치 `llama3.2:latest` | True, `generate_live_answer` Ollama 답 |
| 11 | `test_ollama_probe_is_single_request_with_1s_timeout` | 모두 없음, Ollama `up` 모델 설치 | `has_live_provider()` 한 번에 `/api/tags` 요청 1회, 그 요청의 timeout 값이 모두 1.0 (R2, R12) |
| 12 | `test_api_chat_stream_503_when_ollama_model_missing` | T4 조건 | `POST /api/chat/stream` (`{"question": …, "scope": "global"}`) → 503, `error_code == "ERR_LLM_PROVIDER_UNAVAILABLE"` (R4. 지금 502) |
| 13 | `test_api_chat_query_503_when_ollama_model_missing` | T4 조건 | `POST /api/chat/query` → 503, 같은 `error_code`, `caplog` WARNING 에 `설정 모델 미설치` 가 있음 (R4) |
| 14 | `test_guard_records_unmocked_llm_request` | `fake_llm` 기본 (Ollama 등록 없음) | `httpx.Client().get("http://localhost:11434/api/tags")` 가 `httpx.ConnectError`, `assert_no_unmocked()` 가 `AssertionError`, 끝에 `take_unmocked()` 로 비움 (R6 a) |

끝 기준:
- `cd backend && ../.venv/bin/pytest tests/test_llm_provider_isolation.py` 를 돌려 실패가 **정확히** 아래 6개이고, 실패 이유가 아래와 같다 (지금 코드의 결함). 나머지 8개는 통과한다.
  - #4 T4: `has_live_provider()` 가 True (`/api/tags` 200 만 봄), 생성은 `LLMUpstreamException`.
  - #6 T5`[config_model]`: `_call_ollama` 가 `settings.OLLAMA_MODEL` 만 봐 요청 `model` 이 빈 값 → 흉내 404 → `LLMUpstreamException`.
  - #8 T7: `_call_ollama` 가 `settings` 다음에 `self.ollama_url`(None) 을 봐 주소가 없음 → `LLMUpstreamException`.
  - #9 T7b: 덮어쓰기보다 `settings` 가 앞서 `has_live_provider()` 가 True.
  - #12, #13: 502 `ERR_LLM_UPSTREAM_FAILED`, 판정 이유 로그 없음.
- 예상과 다르게 통과하거나 실패하는 테스트가 있으면, 테스트를 고쳐 맞추지 말고 원인을 task 기록에 적는다 (흉내 도구 결함이면 `llm_fakes.py`·`conftest.py` 를 고친다).
- `git diff --name-status main -- backend/tests/` 에 `M backend/tests/conftest.py` 만 있다 (새 파일은 untracked → 커밋 뒤 `A`).
- 커밋 (실패 테스트 포함).

### 2. **[implementer A] 하네스: autouse 격리와 설정 파일 임시 사본** (`02-harness`)
spec 설계 4절의 기본 상태를 모든 테스트에 건다. `sources.json` 거울 경로를 바꿀 수 있어야 사본으로 돌릴 수 있으므로, spec 설계 3절의 `sources_service.py` 변경을 이 단계에서 한다 (하네스를 성립시키는 코드 쪽 짝이고 LLM 경로와 무관).

(a) `backend/app/services/sources_service.py`
- `SourcesService.__init__` 에서 `self._mirror_path = Path(__file__).resolve().parent.parent / "config" / "sources.json"` (지금 `save_sources` 안의 `fallback` 과 같은 값). `save_sources` 는 `fallback` 대신 `self._mirror_path` 를 쓴다. 나머지 줄(`if fallback != p`, 예외 무시)은 그대로다. 실제 실행 동작은 같다.

(b) `backend/tests/conftest.py`
- 세션 fixture: `tmp_path_factory` 폴더에 루트 `config.json` 사본(`llm` 절의 `anthropic_api_key`·`openai_api_key`·`gemini_api_key`·`ollama_base_url` 을 빈 값으로)과 루트 `sources.json` 사본을 만든다. 원본은 읽기만 한다. 세션 동안 같은 사본을 쓴다 (테스트 사이 상태가 지금처럼 이어짐).
- autouse 함수 fixture (기존 `init_db` 와 별개, 이름 예: `llm_isolation`). 모든 테스트에서:
  1. 단계 1 `llm_sources` 와 같은 원천 비우기 (환경 변수 다섯 개 제거, `settings` LLM 필드, `llm_processor.openai_key = None`·`ollama_url = None`·`gemini_key = ""`). 같은 코드를 두 번 쓰지 않게 함수 하나로 묶어 둘 다 부른다.
  2. 기본 상태: `settings.ANTHROPIC_API_KEY = "sk-ant-test-fake"`, `OPENAI_API_KEY = ""`, `GEMINI_API_KEY = ""`, `OLLAMA_BASE_URL = ""`, `OLLAMA_MODEL = "llama3.2:latest"`.
  3. `app.config.find_config_json` → 세션 사본 `config.json`. `app.config._json_data` → 세션 사본 내용 (`settings.raw_json_config` 를 쓰는 `POST /api/briefing/settings` 가 실제 `config.json` 내용, 특히 `ollama_base_url`, 을 사본에 다시 써 넣지 않게).
  4. `Settings.model_config["env_file"]` → `None` (`monkeypatch.setitem`). `save_json_config` 가 부르는 `settings.reload()` 가 `.env` 를 다시 읽어 실제 키·주소를 `settings` 에 되살리지 않게.
  5. `sources_service._file_path` 와 `sources_service._mirror_path` → 세션 사본 `sources.json`.
  6. `fake_llm` 설치 (흉내 Claude 기본 등록). 정리 단계에서 `fake_llm.assert_no_unmocked()` 를 불러, 흉내 없는 LLM 요청이 있었으면 그 테스트를 실패시킨다 (코드가 `ConnectError` 를 삼켜도 드러남).
- 단계 1 의 `llm_sources` 는 이 기본 상태 위에서 Anthropic 키까지 비우고 시작하게 맞춘다 (테스트별 `config.json` 사본은 세션 사본에서 만든다). 테스트 파일은 고치지 않는다.
- 범위: 흉내 Claude 를 기본으로 두는 것은 '이 앱은 Claude 를 쓴다' 는 정상 상태 흉내다 (spec 설계 4절). 기존 테스트 파일은 고치지 않는다.

**관문 G1** (단계 2 끝):
- C1~C6 (아래 '증명' 의 명령) 각각 `cd backend && … pytest tests/` 결과가 `6 failed, 168 passed` 이고, 실패 6개가 단계 1 의 목록과 같다 (기존 160 개는 모든 조건에서 통과. 두 anti-gemini 테스트와 `test_stream_tokens_fails_fast_without_mock_fallback` 이 이 단계에서 통과하는 것은 spec 설계 1절의 '하네스로 통과' 경로다).
- 각 실행 뒤 `git status --porcelain -- config.json sources.json backend/app/config/sources.json` 출력 없음.
- 가드 기록으로 실패한 기존 테스트가 있으면 (흉내 없는 LLM 요청), 어느 코드 경로인지 task 기록에 적고 멈춘다. 그 경로가 LLM 호스트를 새로 부르는 것이면 흉내 등록을 하네스에 더하는 것은 허용하지만, 그 테스트 파일은 고치지 않는다.
- 결과를 `tasks/backend-llm-test-isolation/02-harness.md` 에 적고 커밋.

### 3. **[implementer A] 코드: 설정 해석 함수와 Ollama 가용성 판정** (`03-llm-processor`)
`backend/app/services/llm_processor.py` 만 고친다 (spec 설계 1·2절).

(a) 생성자와 해석 함수
- `__init__`: `self.openai_key = None`, `self.ollama_url = None`. `self.gemini_key` 줄은 그대로.
- 메서드 4개를 더한다. 각 함수가 호출 때마다 `load_json_config()` (모듈 전역 이름, 기존 테스트의 patch 가 먹게) 를 부른다:
  - `_resolve_openai_key()`: `self.openai_key` 가 `None` 이 아니면 그 값. 아니면 `settings.OPENAI_API_KEY` → `config.json` `llm.openai_api_key` → `os.environ["OPENAI_API_KEY"]` → `""`.
  - `_resolve_openai_model()`: `settings.OPENAI_MODEL` → `llm.openai_model` → `"gpt-4o-mini"`.
  - `_resolve_ollama_url()`: `self.ollama_url` 가 `None` 이 아니면 그 값. 아니면 `settings.OLLAMA_BASE_URL` → `llm.ollama_base_url` → `""`. 돌려줄 때 끝의 `/` 를 뗀다.
  - `_resolve_ollama_model()`: `settings.OLLAMA_MODEL` → `llm.ollama_model` → `"llama3.2:latest"`.
- 쓰는 곳을 바꾼다: `has_live_provider` 의 OpenAI·Ollama 갈래, `_call_openai` (키·모델), `_call_ollama` (주소·모델), `generate_live_answer` 의 OpenAI 블록 키, `stream_tokens` 의 OpenAI 블록(키·모델)·Ollama 블록(주소·모델), `stream_question_answer` 의 OpenAI 블록(키·모델). `stream_tokens`·`stream_question_answer` 에서 OpenAI 갈래 말고도 `json_cfg` 를 쓰는 줄이 남으면 그 줄은 그대로 둔다.
- 손대지 않는다: `if self.anthropic_provider.is_available():` 로 시작하는 블록 4개(`has_live_provider` 의 조기 True 와 생성·스트림·`stream_question_answer` 세 블록), Gemini 키 해석(`_call_gemini`, `has_live_provider(target_provider="gemini")`), `is_test_environment`, `check_provider_available` 의 예외 메시지 문자열.

(b) Ollama 가용성 판정 (R2, R12)
- 판정 함수 (예: `_ollama_status(url, model) -> Tuple[bool, str]`): `httpx.Client(timeout=1.0)` 로 `GET {url}/api/tags` 한 번. 연결 실패·200 아님·JSON 해석 실패 → False. `models[]` 의 `name` 또는 `model` 이 설정 모델(태그가 없으면 `:latest` 를 붙인 값)과 같으면 True, 아니면 False. 두 번째 값은 이유 문자열이다: `Ollama 주소 없음`, `Ollama 연결 실패`, `Ollama /api/tags 응답 <코드>`, `Ollama 응답 해석 실패`, `Ollama 설정 모델 미설치 (<모델>)`.
- `has_live_provider` 의 Ollama 갈래가 판정 함수를 쓴다. 주소가 비면 탐침 없이 False.

(c) 판정 이유 로그 (R4, spec 설계 2절 '로그 레벨은 plan 에서 정한다')
- `has_live_provider` 가 False 로 끝날 때 이유를 `self._unavailable_reason` 에 남기고 `logger.debug` 로 적는다 (Anthropic 키 없음 · OpenAI 키 없음 · Ollama 이유를 이어 붙인 한 줄). 수집 평가(`:580` 근처)는 `has_live_provider` 를 직접 불러 항목마다 판정하므로 DEBUG 라 로그가 넘치지 않는다.
- `check_provider_available` 은 `self._unavailable_reason = None` 으로 비운 뒤 지금처럼 `self.has_live_provider(...)` 를 부르고 (기존 테스트가 `has_live_provider` 를 patch 한다), False 면 `logger.warning` 으로 이유(없으면 `판정 이유 없음`)를 적은 뒤 지금과 같은 메시지로 `LLMProviderUnavailableException` 을 낸다.

끝 기준:
- `cd backend && ../.venv/bin/pytest tests/test_llm_provider_isolation.py` 14 passed. 이 파일은 단계 1 커밋 뒤 바뀌지 않았다 (`git diff <단계 1 커밋> -- backend/tests/test_llm_provider_isolation.py` 출력 없음).
- `grep -n "qwen2.5" backend/app/services/llm_processor.py` 0건.
- R1 a grep 결과가 `__init__` 과 해석 함수 4개 안에만 있다 (증명 3).

**관문 G2** (단계 3 끝, 증명 1~6 전부):
- C1~C6 각각 `174 passed` (실패 0), C1 에서 루트 `make check` 종료 0, 각 실행 뒤 설정 파일 세 개 `git status` 출력 없음, R5·R8 확인 통과.
- 결과를 `tasks/backend-llm-test-isolation/03-llm-processor.md` 에 적고 커밋.

### 4. **[implementer A] 통합 문서 반영** (`04-docs`)
- '변경 파일' 의 문서 8개를 구현 결과대로 고친다 (spec 설계 7절. 2026-11-08 보충으로 3개가 더해져 모두 11개, 더한 몫은 아래 '후속'). 근거 줄 번호는 단계 3 뒤 코드로 다시 잰다. `docs/test-strategy.md` 의 테스트 수는 `파일 17개, 테스트 174개` (새 테스트 파일 1개, `llm_fakes.py` 는 테스트 파일이 아님) 로 실제 수집 수와 맞춘다. `docs/tech-spec.md` 의 '변경 이력' 에 이 기능 한 줄.
- '외부 호출과 파일 부작용' 절은 남은 외부 호출(github.com 등 스크래퍼, api.notion.com, SMTP. spec 우려 4)과 '설정 파일은 세션 임시 사본, 원본은 읽기만' 을 적고, '격리 방식은 정하지 않았다 … 되돌린다' 문장을 지운다.
- `docs/product.md` 는 바꾸지 않는다.
- 루트 `CLAUDE.md` '명령' 절의 "`make check` 는 `.env` 의 LLM 키로 외부 호출을 하고, backend 테스트가 … 고친다 (격리는 미정 …). 돌린 뒤 `git status` 로 확인하고 되돌린다." 문장은 이 단계 뒤 **메인 세션**이 고친다. implementer 는 task 기록 '다음' 에 그 문장과 바꿀 사실(LLM 호출은 흉내, 설정 파일은 임시 사본, 남은 외부 호출은 스크래퍼·Notion·SMTP)만 적는다.
- 끝 기준: `grep -n "로컬 Ollama 탐침 가능" docs/test-cases.md` 0건, `docs/known-issues.md` 에 삭제한 세 행의 문구가 없다, 문서만 바뀐 커밋.
- 후속 (2026-11-08 보충, 38536d1 뒤): 4단계에서 찾은, 이번 변경으로 사실이 아니게 된 서술을 고친다.
  - `docs/known-issues.md` `:36` 부근 'Ollama 가용성 판정(`has_live_provider`)이 `/api/tags` 200 만 보고 설정 모델 …을 보지 않는다' 행을 지운다 (원인 2 를 고침).
  - `docs/data-model.md` `:294`·`:436`·`:437` 부근의 '테스트가 루트 `config.json`·`.env` 를 읽는다/덮어쓴다' 서술을 지금 동작으로 고친다: 하네스(`backend/tests/conftest.py`)가 LLM 환경 변수를 지우고 `settings` LLM 필드를 고정하며, `config.json`·`sources.json` 은 세션 임시 사본을 쓰고(원본은 읽기만), `settings.reload()` 의 `.env` 재읽기를 끈다. 테스트 DB 를 실행 사이에 지우지 않는 것은 그대로 둔다. 근거 줄 번호는 지금 `conftest.py` 로 잰다.
  - `llm_processor.py`·`sources_service.py` 줄이 밀려 낡은 근거 줄 번호를 지금 코드(단계 3 뒤)에 맞춘다: `docs/data-model.md` 22곳, `docs/functional-spec/01-news-feed.md` 6곳, `docs/functional-spec/05-sources-and-research.md` 13곳. 각 곳이 가리키는 코드 줄을 열어 확인하고 고친다 (줄 번호만 바꾸고, 가리키는 동작 서술이 달라졌으면 서술도 고친다).
  - 후속 끝 기준: `grep -n "/api/tags\` 200 만 보고" docs/known-issues.md` 0건. `grep -nE "루트 config\.json·\`\.env\` 를 그대로 읽는다|테스트가 루트 config\.json 을 덮어쓴다|테스트는 실제 루트 \`config\.json\` 과 \`\.env\` 를 읽는다" docs/data-model.md` 0건. 세 문서의 `grep -nE "(llm_processor|sources_service)\.py:[0-9]"` 결과마다 가리키는 줄이 서술과 맞는다 (확인한 곳 수를 task 기록 `04-docs.md` 에 적는다). 문서만 바뀐 커밋.

## 위험
- **가장 위험한 단계는 2 (하네스).** 설정 원천이 네 곳(환경 변수, `settings`, `config.json`, 싱글턴 속성)이고 `settings.reload()` 는 `.env` 를 다시 읽으며, `POST /api/briefing/settings` 는 import 때 읽은 실제 `config.json` 내용(`settings.raw_json_config`)을 저장한다. 하나라도 놓치면 실행 환경이 다시 새어 들어오거나 사본에 `ollama_base_url` 이 되살아나 그 뒤 테스트가 가드에 걸린다. 그래서 `_json_data` 고정과 `env_file` 끄기를 단계 2 에 넣었다 (spec 설계 4절에 없는 두 항목. 둘 다 하네스 안의 격리이고 제품 코드는 바꾸지 않는다). 관문 G1 이 C1~C6 전부를 돌려 확인한다.
- **흉내 Claude 가 바꾸는 코드 경로.** 지금 키 없는 실행에서는 `has_live_provider()` 가 False 라 수집 평가·딥 리서치의 LLM 호출을 건너뛰지만, 하네스 기본 상태에서는 흉내 Claude 가 JSON 이 아닌 답을 돌려 '파싱 실패 → 휴리스틱' 경로를 탄다. 이 경로가 예외를 내는 제품 결함이 드러나면 흉내 답을 JSON 으로 바꿔 피하지 않는다. 막힘으로 기록하고 plan 을 고친다.
- **R8 (기존 단언 불변) 확인 방법.** `git diff --name-status main -- backend/tests/` 출력이 `M backend/tests/conftest.py`, `A backend/tests/llm_fakes.py`, `A backend/tests/test_llm_provider_isolation.py` 세 줄뿐이고, `git diff main -- backend/tests/ ':!backend/tests/conftest.py' ':!backend/tests/llm_fakes.py' ':!backend/tests/test_llm_provider_isolation.py'` 출력이 없다. 즉 `conftest.py` 밖의 기존 테스트 파일 변경 0. 세 테스트(`test_anti_gemini_isolation_in_generate_live_answer`, `test_anti_gemini_isolation_in_stream_tokens`, `test_stream_tokens_fails_fast_without_mock_fallback`)가 C1~C6 에서 통과한다.
- **하네스에 기대는 통과 (spec 우려 2).** 두 anti-gemini 테스트는 코드가 아니라 하네스(환경 변수 제거, LLM 키·Ollama 주소를 비운 `config.json` 사본)로 통과한다. 리뷰에서 흉내 응답이 기존 단언을 겨냥하지 않았는지 본다. 공통 규칙에 흉내 내용을 단언에 맞춰 바꾸지 않는다고 적었다.
- **동작이 바뀌는 곳 두 개 (spec 설계 1절).** `settings.OLLAMA_BASE_URL` 이 빈 값일 때 `_call_ollama` 가 `config.json` 주소를 쓰고, `stream_tokens` 의 Ollama 모델 마지막 기본값이 `qwen2.5:latest` → `llama3.2:latest` 다. 사용자 경로(Claude 키 있음)에는 영향이 없다. 수집 평가는 같은 환경(Ollama 만 있고 모델 없음)에서 이제 생성 호출 없이 휴리스틱으로 간다. 탐침 1초는 항목마다 남는다 (캐시는 범위 밖).
- **기존 테스트의 patch 대상.** `test_llm_processor.py`·`test_scoped_chat_grounding.py` 가 `has_live_provider` 를, `test_chat*.py`·`test_agentic_workflow.py` 가 `check_provider_available` 을 patch 한다. 그래서 `check_provider_available` 은 계속 `self.has_live_provider` 를 불러야 하고, 이유는 별도 속성으로 넘긴다 (단계 3 c). `test_anti_gemini_has_live_provider_ignores_gemini_key` 는 `llm_processor` 모듈의 `load_json_config` 를 patch 하므로 해석 함수가 같은 모듈 전역 이름을 불러야 한다.
- **openai SDK 전송.** `openai 3.14.0` 이 기본 `httpx.AsyncHTTPTransport` 를 쓰지 않으면 T6 스트림이 흉내에 잡히지 않고 가드에 걸린다. 단계 1 에서 T6 가 통과해야 하므로 그때 드러난다. 그러면 `openai.AsyncOpenAI` 를 patch 하지 말고(제품 코드 경로를 바꾸는 흉내) SDK 가 쓰는 전송 클래스를 흉내 계층에 더한다.
- **`make check` 의 frontend 쪽.** C1 의 `make check` 종료 0 은 frontend 검사(vitest·eslint·`tsc`)도 통과해야 한다. 이 브랜치의 frontend 상태가 이 기능과 무관하게 실패하면 G2 에서 그 사실과 출력을 적고 멈춘다 (frontend 는 이 plan 범위 밖).
- **남는 네트워크 의존 (spec 우려 4).** 스크래퍼(github.com 등)·api.notion.com·SMTP 호출은 그대로라 네트워크가 끊긴 맥에서는 `make check` 결과가 달라질 수 있다. 이번 '실행 환경' 정의(Ollama·모델·키) 밖이며 test-strategy.md 에 적는다.
- **버린 대안.** (1) `is_test_environment()` 분기를 생성·스트림·평가에 더하기: 제품 코드에 테스트 분기를 늘리고 Claude 경로 동작을 바꿔 버림 (spec known-issues 정리 문장). (2) 기존 anti-gemini 테스트에 patch 를 더하기: R8 위반. (3) OpenAI·Ollama 설정을 `settings` 하나에서만 읽기: 실행 중 `config.json` 보충이 사라짐 (spec 우려 3 의 메인 세션 결정). (4) 단계 2 에서 `sources_service.save_sources` 를 patch 하기: 검사 대상 코드를 흉내로 바꾸는 것이라 버리고, 거울 경로 속성(spec 설계 3절)을 택함. (5) 흉내를 `pytest-httpx` 같은 새 의존성으로: spec 이 새 의존성을 막음.

## 증명
조건 C1~C6 은 Ollama 를 끄거나, 모델을 설치·삭제하거나, `.env` 를 고치지 않고 명령 줄 환경 변수로만 만든다 (spec 설계 6절). 빈 값 환경 변수는 `load_dotenv(override=False)` 와 pydantic-settings 가 `.env` 보다 앞세우므로 '키 없음' 이 된다. `<설치된 모델>` 은 실행 전에 `curl -s localhost:11434/api/tags` 로 확인한 이름이다 (2026-11-07 기준 `gpt-oss:20b`). 실행 전에 설정 파일 세 개에 이미 변경이 있으면 그 사실을 적고 되돌린 뒤 시작한다.

1. **R7 — C1~C6 모두 같은 결과.** 각 명령이 종료 0, 출력 끝줄이 `174 passed` (기존 160 + 새 14). 실패·오류 0.

   | 조건 | LLM 키 | Ollama | 명령 (`backend/` 에서) |
   |---|---|---|---|
   | C1 | 있음 (`.env` 그대로) | 실제: 떠 있음, 설정 모델 없음 | `../.venv/bin/pytest tests/` 그리고 루트에서 `make check` (종료 0) |
   | C2 | 있음 | 연결 안 됨 | `OLLAMA_BASE_URL=http://127.0.0.1:9 ../.venv/bin/pytest tests/` |
   | C3 | 있음 | 떠 있고 설정 모델 있음 | `OLLAMA_MODEL=<설치된 모델> ../.venv/bin/pytest tests/` |
   | C4 | 없음 | 연결 안 됨 | `ANTHROPIC_API_KEY= OPENAI_API_KEY= OLLAMA_BASE_URL=http://127.0.0.1:9 ../.venv/bin/pytest tests/` |
   | C5 | 없음 | 떠 있고 설정 모델 있음 | `ANTHROPIC_API_KEY= OPENAI_API_KEY= OLLAMA_MODEL=<설치된 모델> ../.venv/bin/pytest tests/` |
   | C6 | OpenAI 키만 있음 | 실제 | `ANTHROPIC_API_KEY= OPENAI_API_KEY=sk-test-dummy ../.venv/bin/pytest tests/` |

2. **R9 — 설정 파일 불변.** C1~C6 각 실행 뒤(C1 은 `make check` 뒤에도) 루트에서 `git status --porcelain -- config.json sources.json backend/app/config/sources.json` 출력이 비어 있다.
3. **R1 a — 설정 읽는 곳.** `grep -nE "OPENAI_API_KEY|OPENAI_MODEL|OLLAMA_BASE_URL|OLLAMA_MODEL|openai_api_key|openai_model|ollama_base_url|ollama_model|self\.(openai_key|ollama_url)" backend/app/services/llm_processor.py` 의 모든 줄이 `__init__` 과 해석 함수 4개 안에 있다 (줄 번호를 함수 범위와 대조해 task 기록에 적는다).
4. **R3 a.** `grep -n "qwen2.5" backend/app/services/llm_processor.py` 0건.
5. **R5 — Claude 경로 불변.**
   - (a) `git diff main -- backend/app/services/llm_providers/anthropic_provider.py` 출력 없음.
   - (b) `if self.anthropic_provider.is_available():` 블록 4개(조기 True 1 + spec 의 세 블록)가 그대로인지 루트에서 확인 (출력 `True 4`):
     ```
     python3 - <<'EOF'
     import subprocess
     P = "backend/app/services/llm_processor.py"
     def blocks(src):
         ls, out, i = src.splitlines(), [], 0
         while i < len(ls):
             if ls[i].strip() == "if self.anthropic_provider.is_available():":
                 ind = len(ls[i]) - len(ls[i].lstrip()); b = [ls[i]]; i += 1
                 while i < len(ls) and (not ls[i].strip() or len(ls[i]) - len(ls[i].lstrip()) > ind):
                     b.append(ls[i]); i += 1
                 out.append("\n".join(b).rstrip())
             else:
                 i += 1
         return out
     old = subprocess.run(["git", "show", f"main:{P}"], capture_output=True, text=True).stdout
     new = open(P, encoding="utf-8").read()
     print(blocks(old) == blocks(new), len(blocks(new)))
     EOF
     ```
   - (c) `test_anthropic_provider.py` 의 기존 테스트 전부가 증명 1 에서 통과.
6. **R8 — 기존 테스트 불변.** '위험' 의 R8 확인 명령 두 개 (`conftest.py` 밖 기존 테스트 파일 변경 0). 그리고 `git diff <단계 1 커밋> -- backend/tests/test_llm_provider_isolation.py` 출력 없음 (새 테스트도 단계 1 뒤 그대로).
7. **R10·R2·R4·R6 — 회귀 테스트.** `cd backend && ../.venv/bin/pytest -v tests/test_llm_provider_isolation.py` 14 passed (T1~T8, T7b, T5 두 갈래, 탐침 1회·1.0초, API 503 두 개, 가드). 이 가운데 6개는 단계 1 커밋에서 실패했다 (먼저 실패하는 테스트: T4·T5`[config_model]`·T7·T7b·API 503 두 개, 이유는 단계 1 끝 기준).
8. **R11 — 실제 Claude 스모크 (verify 단계, `make check` 밖, 실제 키 사용).** `backend/` 에서:
   - (a) `../.venv/bin/python -c "import asyncio; from app.services.llm_processor import llm_processor as p; a, m = asyncio.run(p.generate_live_answer('Reply with exactly: OK', model_tier='haiku')); print(repr(a), m)"` → 빈 값이 아닌 답, 모델이 `claude-haiku-` 로 시작.
   - (b) `../.venv/bin/python -c "import asyncio; from app.services.llm_processor import llm_processor as p
async def f():
    parts, model = [], None
    async for t, m in p.stream_tokens('Reply with exactly: OK', model_tier='haiku'):
        parts.append(t); model = m
    print(repr(''.join(parts)), model)
asyncio.run(f())"` → (a) 와 같은 기준.
   - (c) `../.venv/bin/uvicorn app.main:app --port 18765` 을 백그라운드로 띄우고 기동 로그가 끝나면 `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:18765/health` → `200`. 확인 뒤 그 프로세스를 내린다.
   - 실행 뒤 증명 2 의 `git status` 확인을 한 번 더 한다.
9. **R12.** 증명 7 의 탐침 테스트(요청 1회, timeout 1.0)와 T1·T2 (Anthropic 키가 있으면 탐침 0회).
