# Intent: backend LLM 호출 정상화와 실행 환경에 의존하지 않는 `make check`

Author: wonyoung choi (요청), Claude (triage 정리)
Status: accepted
Approved-by: 자동 승인 (Claude) (2026-11-07)
Source: 실패한 빌드 — 로컬 `make check` 종료 2 (2026-11-07, 브랜치 `feat/ui-redesign`, HEAD `d3ae074`). 실패 테스트 `backend/tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer`, `::test_anti_gemini_isolation_in_stream_tokens`

## 문제
원작성자의 말:
- "기능을 개 좆같이 해놨으면 수정을 해놔야 할거 아냐", "수정해"
- 목표: backend 가 실행되고 LLM 호출이 제대로 되게 고친다. `make check` 는 실행 환경(로컬 Ollama 실행 여부, 설치된 모델, .env 키)과 관계없이 통과해야 한다.
- 이 앱은 Claude 를 쓴다. Ollama·Gemini 는 문제의 중심이 아니다.
- 'Ollama 를 끄고 확인' 은 해결책이 아니다.

### 증상
`make check` 가 종료 2 로 끝난다. backend pytest 에서 2개가 실패하고, make 가 거기서 멈춰 frontend 검사(vitest·eslint·`tsc`)까지 가지 못한다.
```
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
================== 2 failed, 158 passed in 105.00s (0:01:45) ===================
```
두 테스트만 따로 돌려도 같다 (2026-11-07 재현): `2 failed in 0.35s`, 둘 다 `LLMUpstreamException: 외부 LLM 업스트림 통신 실패 / API 장애` (`backend/app/services/llm_processor.py:347`, `:460`).

### 실제 실행의 Claude 경로는 지금 동작한다
2026-11-07 이 맥에서 앱 코드 그대로 확인했다.
- `.env`·`backend/.env` 에 `ANTHROPIC_API_KEY` 가 있고, `anthropic_provider.is_available()` 이 True 다.
- `llm_processor.generate_live_answer("Reply with exactly: OK", model_tier="haiku")` → `'OK'`, `claude-haiku-5-5`, 1.1초, usage `input_tokens 18 / output_tokens 4`.
- `llm_processor.stream_tokens(…)` → `'OK'`, `claude-haiku-5-5`, 0.8초.
- `uvicorn app.main:app` 을 임시 포트로 띄우면 기동이 끝나고 `GET /health` → 200 `{"status":"healthy","version":"0.3.1","running":false}` 다. 확인 뒤 바로 내렸다.

지금 Claude 호출이 실패해서 생긴 증상은 없다. 실패는 테스트가 실행 환경을 읽어서 생긴다. 다만 Claude 를 쓸 수 없는 환경(키 없음·만료)에서 대체 경로가 잘못 판정하는 제품 결함이 함께 있다 (원인 2).

### 원인 1 — 테스트가 실행 환경의 설정 원천을 읽는다
- 두 테스트는 '쓸 수 있는 LLM 이 없으면 `LLMProviderUnavailableException`, Gemini 는 부르지 않는다' 를 단언한다. Anthropic 은 `is_available` 을 False 로 막고, `settings` 의 키·URL 을 빈 값으로 바꾼다.
- 코드는 프로바이더 설정을 `settings` 말고도 다른 곳에서 다시 채운다. 테스트는 그 원천을 막지 않는다.
  - Ollama 주소: `has_live_provider` (`llm_processor.py:267`) 와 `stream_tokens` (`:437`) 는 git 이 추적하는 루트 `config.json` 의 `llm.ollama_base_url` 을, `_call_ollama` (`:213`) 는 싱글턴 생성 때 저장한 `self.ollama_url` (`:116`) 을 쓴다.
  - 키: `has_live_provider`·`_call_openai`·`AnthropicLLMProvider._get_api_key` 는 `os.environ` 과 `config.json` 도 읽는다 (`llm_processor.py:254-260`, `:181-186`, `anthropic_provider.py:152-159`). `backend/app/config.py:8-10` 이 import 때 `.env` 를 `os.environ` 에 올린다.
- 같은 파일의 `test_anti_gemini_has_live_provider_ignores_gemini_key` (`:388`) 는 `load_json_config`·`ollama_url`·`os.environ` 까지 막아서 통과한다. 실패하는 두 테스트만 이 격리가 빠졌다.
- 원천을 하나씩 막아 본 결과 (테스트와 같은 patch 를 건 진단 스크립트, 외부 호출 없음):

  | 조건 | `has_live_provider()` | `generate_live_answer` 결과 |
  |---|---|---|
  | 테스트와 같은 patch | True | `LLMUpstreamException` |
  | + OpenAI 원천(`os.environ`, `openai_key`) 제거 | True | `LLMUpstreamException` |
  | + Ollama 원천(`ollama_url`, `load_json_config`) 제거 | False | `LLMProviderUnavailableException` (기대값) |

  이 맥은 OpenAI 키가 비어 있어서 True 를 만드는 것이 Ollama 갈래뿐이다. 다른 맥에서 OpenAI 키가 `.env` 에 있으면 같은 방식으로 OpenAI 갈래가 True 를 만든다.
- 로컬 Ollama 상태 (2026-11-07): `GET http://localhost:11434/api/tags` → 200, 설치 모델 `['gpt-oss:20b']`. 앱은 2026-11-02 22:40 부터 떠 있다.
- 테스트와 폴백 코드는 둘 다 커밋 44507de (2026-10-19) 에 함께 들어왔다.

### 원인 2 — 대체 프로바이더 가용성 판정이 실제 호출 가능 여부와 다르다 (제품 결함)
- `has_live_provider` 는 Ollama `/api/tags` 가 200 이면 True 를 돌려준다 (`llm_processor.py:268-273`). 설정 모델이 설치돼 있는지는 보지 않는다.
- 생성은 `OLLAMA_MODEL` (`llama3.2:latest`, `.env`·`config.json` 둘 다) 로 간다. 이 맥에서 직접 호출한 결과:
  ```
  POST /api/generate {"model":"llama3.2:latest",...}
  → 404 {"error":"model 'llama3.2:latest' not found"}
  ```
- `_call_ollama` 는 200 이 아니면 `(None, None)` 을 돌려주고 (`:219-226`), `generate_live_answer` 는 `LLMUpstreamException` 을 낸다. API 는 이것을 502 `ERR_LLM_UPSTREAM_FAILED` 로 돌려준다 (`backend/app/api/chat.py:248-256`, `:386`).
- 사용자 영향: Claude 키가 없거나 쓸 수 없는 환경에서 Ollama 만 떠 있고 설정 모델이 없으면, 챗은 '설정이 필요하다'는 503 `ERR_LLM_PROVIDER_UNAVAILABLE` 대신 원인을 알 수 없는 502 를 받는다. 수집 평가(`:580`)는 항목마다 1초 동기 탐침과 실패하는 생성 호출을 거친 뒤 휴리스틱으로 떨어진다 (`:639-640`).
- 생성 모델 기본값도 `_call_ollama` 는 `llama3.2:latest` (`:216`), `stream_tokens` 는 `qwen2.5:latest` (`:439`) 로 다르다.

### 원인 2 만 고치면 원인 1 이 남는다
설정 모델이 설치된 맥에서는 모델 확인을 넣어도 판정이 True 이고 생성도 성공한다. 그러면 두 테스트는 예외가 나지 않아 여전히 실패한다. 테스트 결과가 개발자 맥의 상태에 달린 구조는 원인 1 을 없애야 사라진다.

### 환경에 따라 결과가 바뀌는 테스트
backend 전체를 환경 조건만 바꿔 돌렸다. Ollama 는 끄지 않고, pytest 플러그인으로 `localhost:11434` 요청만 가로채 응답을 흉내 냈다 (그 밖의 요청은 그대로 나간다). 키는 실행 때 환경 변수를 빈 값으로 줘서 뺐다.

| `.env` LLM 키 | Ollama 상태 | 결과 |
|---|---|---|
| 있음 (Anthropic) | 실제: 떠 있음, 설정 모델 없음 (메인 세션 측정) | 2 failed, 158 passed |
| 있음 | 흉내: 연결 안 됨 | 160 passed |
| 있음 | 흉내: 떠 있고 설정 모델 있음 | 3 failed, 157 passed |
| 없음 | 흉내: 연결 안 됨 | 4 failed, 156 passed |
| 없음 | 흉내: 떠 있고 설정 모델 있음 | 5 failed, 155 passed |

다섯 조건 모두에서 통과한 테스트는 152개다. 나머지 8개는 환경에 따라 결과가 바뀐다 (아래 목록).

'떠 있고 설정 모델 있음' 에서 실패한 테스트:
- `test_anti_gemini_isolation_in_generate_live_answer`, `test_anti_gemini_isolation_in_stream_tokens`: Ollama 생성이 성공해 예외가 나지 않는다.
- `tests/test_llm_processor.py::test_stream_tokens_fails_fast_without_mock_fallback` (새로 찾음): `ollama_url` 은 비우지만 `settings.OLLAMA_BASE_URL` 은 그대로 둔다. 그래서 `stream_tokens` (`:437`) 가 `.env` 의 `http://localhost:11434` 로 실제 스트림을 연다. 지금 이 맥에서는 모델이 없어 404 가 나고, 기대한 `LLMUpstreamException` 이 나와 우연히 통과한다.

키가 없을 때 실패한 테스트 (Claude 경로가 실제 키에 달려 있다는 증거):
- `test_anthropic_provider.py::test_chat_stream_3tier_model_routing`, `::test_chat_query_3tier_model_routing`: 실제 `/api/chat/stream`·`/api/chat/query` 를 부르고 200 과 Claude 티어 모델명을 단언한다. 키가 있으면 실제 Claude API 를 부르고, 없으면 `assert 503 == 200` 으로 실패한다. 키 없이 Ollama 가 응답하면 `assert 'opus' in 'Ollama llama3.2:latest'` 로 실패한다.
- `test_llm_processor.py::test_chat_stream_end_to_end_with_mocked_llm`, `::test_scoped_chat_stream_end_to_end_with_mocked_llm`: `stream_tokens` 는 흉내 내지만 앞 단계 `check_provider_available` (`backend/app/api/chat.py:349`) 은 실제 판정이다. 키도 Ollama 도 없으면 `assert 503 == 200`.
- `test_llm_processor.py::test_answer_question`: 실제 프로바이더 답의 길이를 단언한다 (`len(ans) > 20`). 키 없이 Ollama 흉내 답(17자)이 오면 실패한다. 이 실패는 흉내 응답 길이에 따른 것이지만, 테스트 결과가 어떤 프로바이더가 답하는지에 달려 있다는 점은 같다.

키가 있으면 일부 테스트가 실제 Anthropic API 를 부른다 (`docs/test-strategy.md` '외부 호출과 파일 부작용': 3-tier 챗 2개와 `/ask`·`/ask/stream`). 이 결과는 키 유효성·네트워크·요금 한도에 따라 바뀔 수 있다.

### 테스트가 git 추적 설정 파일을 고친다
- 흉내 실행마다 `git status` 에 루트 `sources.json` 과 `backend/app/config/sources.json` 이 바뀌어 있었다 (`updated_at` 한 줄씩, 예: `2026-10-19T10:33:23…` → `2026-11-07T14:31:04…`). 매번 `git checkout --` 로 되돌렸다. `docs/test-strategy.md` 는 루트 `sources.json` 만 적고 `backend/app/config/sources.json` 은 적지 않았다.
- `test_briefing_settings_get_and_post` 는 루트 `config.json` 을 다시 쓴다 (`docs/test-strategy.md:62`).
- 위 원인 1 과 같은 뿌리다. 테스트가 실제 `.env`·`config.json`·`sources.json` 을 설정 원천으로 읽고 쓴다.

## 기대 결과
- backend 가 실행되고, Claude 키가 설정된 환경에서 챗·스트리밍·수집 평가의 LLM 호출이 Claude 로 성공한다 (지금 상태를 유지).
- 쓸 수 있는 프로바이더가 없으면 503 `ERR_LLM_PROVIDER_UNAVAILABLE` 을 돌려준다. 대체 프로바이더가 응답은 하지만 실제 호출이 불가능한 경우(예: Ollama 는 떠 있으나 설정 모델 미설치)도 '쓸 수 없음' 으로 판정한다.
- `make check` 가 다음 조건 모두에서 같은 결과로 통과하고 frontend 검사까지 진행한다 (frontend 에 이미 있는 실패는 이 기능 범위 밖이다).
  - 로컬 Ollama: 연결 안 됨 / 떠 있고 설정 모델 없음 / 떠 있고 설정 모델 있음
  - `.env`·`config.json` 의 LLM 키: 있음 / 없음
- 이 조건은 Ollama 를 끄거나 모델·키를 바꾸지 않고 확인한다. 테스트 안에서 응답과 설정 원천을 흉내 내 각 조건을 만든다.
- 테스트 단언을 약하게 바꾸지 않는다. 앞의 두 테스트는 그대로 `LLMProviderUnavailableException` 과 `_call_gemini` 미호출을, `test_stream_tokens_fails_fast_without_mock_fallback` 은 그대로 `LLMUpstreamException` 을 단언한다.
- `make check` 를 돌린 뒤 `git status` 에 `config.json`, `sources.json`, `backend/app/config/sources.json` 변경이 없다.
- 회귀 테스트: 위 환경 조건 조합에서 가용성 판정과 예외 종류를 확인하는 테스트를 더한다.

## 영향받는 사용자와 시스템
- 개발자(본인): `make check` 가 로컬 상태에 따라 실패하고 frontend 검사까지 막힌다. 모든 기능의 Test 스테이지(`/verify-change`)가 이 검사를 쓴다.
- 챗 사용자: Claude 를 쓸 수 없는 환경에서 원인을 알 수 없는 502 를 받는다.
- 수집: 같은 환경에서 항목마다 헛된 탐침과 생성 호출을 한다.
- 시스템: `backend/app/services/llm_processor.py` (`has_live_provider`, `_call_ollama`, `_call_openai`, `stream_tokens`), `backend/app/services/llm_providers/anthropic_provider.py` (`_get_api_key`), `backend/app/config.py` (`.env` 선로드, `config.json` 원천), `backend/tests/conftest.py`, `backend/tests/test_anthropic_provider.py`, `backend/tests/test_llm_processor.py`, git 추적 `config.json`·`sources.json`·`backend/app/config/sources.json`.

## 제약
- 저장소 규칙: 테스트를 고쳐 통과시키지 않는다. 코드를 고친다. 단언을 약하게 만들지 않는다.
- 'Ollama 를 끄고 확인' 은 해결책이 아니다. 모델 설치·삭제나 `.env` 키 변경으로 통과시키지도 않는다.
- Claude 가 기본(1순위) 프로바이더다. Gemini 차단 정책(POL-LLM-005)은 바꾸지 않는다.
- 실제 실행의 설정 우선순위(`.env` → `config.json` → 코드 기본값, `docs/operations.md` '설정 우선순위')는 그대로 둔다.
- 가용성 판정은 지금처럼 요청 경로를 1초 넘게 막지 않는다.

## 열린 질문
spec 단계에서 정한다.
- 테스트가 실행 환경 대신 쓸 설정 원천을 어떻게 주입하는가 (conftest fixture, 설정 원천을 한 곳으로 모으는 코드 변경, 환경 변수 등). 싱글턴 `llm_processor` 가 생성 때 저장한 값(`openai_key`, `ollama_url`)을 어떻게 다루는가.
- 키·URL 을 `settings`·`os.environ`·`config.json`·생성 시점 값에서 따로 읽는 지금 구조를 한 함수로 모을 것인가.
- 대체 프로바이더(OpenAI·Ollama)의 '쓸 수 있음' 판정 기준을 무엇으로 할 것인가 (예: Ollama 설정 모델 설치 여부). 이 앱에서 대체 경로를 계속 둘 것인가.
- `make check` 가 키가 있을 때 실제 Claude API 를 부르는 테스트를 어떻게 다룰 것인가 (흉내로 바꿈, 별도 마커로 분리, 그대로 둠). `docs/known-issues.md` '수집 게이트와 Ask AI 는 테스트 환경 판정을 보지 않아…' 행과 범위가 겹친다.
- 테스트가 git 추적 `config.json`·`sources.json`·`backend/app/config/sources.json` 을 고치는 문제를 이번 범위에 넣을 것인가.
- Ollama 생성 모델 기본값(`llama3.2:latest` / `qwen2.5:latest`)을 하나로 맞출 것인가, 맞춘다면 무엇으로.
- 판정이 '쓸 수 없음' 일 때 503 메시지에 원인(키 없음, 모델 미설치 등)을 어디까지 보여줄 것인가.
