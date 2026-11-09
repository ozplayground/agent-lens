# Task 01: 실패 회귀 테스트와 흉내 도구

Feature: backend-llm-test-isolation · Plan: docs/features/backend-llm-test-isolation/plan.md 작업 순서 01
Status: done
Session: main
Agent: aa1bf34d8feb5e21c (implementer)
Updated: 2026-11-08

## 한 일
- `backend/tests/llm_fakes.py` 새로 만듦: `FakeLLM` (흉내 Claude 기본 등록, `register_openai`, `register_ollama(url, state, models)`, `requests(provider, path)`, `assert_no_unmocked`, `take_unmocked`) 와 `install(fake, monkeypatch)`.
  - `httpx.HTTPTransport.handle_request`·`httpx.AsyncHTTPTransport.handle_async_request` 를 감싼다. openai 3.14.0 SDK 는 `httpx` 가 아니라 `httpx2` (2.12.0, openai 의 기존 의존성) 의 `AsyncHTTPTransport` 를 쓴다는 것을 확인해 (`type(openai.AsyncOpenAI(api_key='x')._client._transport)` → `httpx2.AsyncHTTPTransport`), plan '위험' 의 지시대로 `httpx2` 의 두 전송도 같은 방식으로 감쌌다 (`openai.AsyncOpenAI` 는 patch 하지 않음). 응답·`ConnectError` 는 요청이 온 모듈(httpx/httpx2)의 클래스로 만든다.
  - 흉내 Claude: 비스트림 `content[0].text`·`model`(요청 값)·`usage`, 스트림 `message_start`·`content_block_delta`(text_delta 3개)·`message_delta`·`message_stop` SSE.
  - 흉내 OpenAI: 비스트림 `choices[0].message.content`, 스트림 `chat.completion.chunk` SSE 뒤 `data: [DONE]`.
  - 흉내 Ollama: `down` 은 `ConnectError`, `up` 은 `/api/tags` 설치 목록, `/api/generate` 는 `:latest` 정규화 비교 뒤 200(비스트림 JSON, 스트림 NDJSON) 또는 404 `{"error":"model '<model>' not found"}`.
  - 고정 답: `FAKE_CLAUDE_ANSWER` = `### 흉내 Claude 답변` + 한국어 문장 2개 (중괄호 없음). 기존 단언을 보고 고르지 않았다.
- `backend/tests/conftest.py` 에 autouse 가 아닌 도구 추가 (기존 `init_db`·`DATABASE_URL` 은 그대로): `blank_llm_config`, `clear_llm_sources(monkeypatch)` (단계 2 autouse 와 같이 쓸 함수), `LLMSources` 조절 객체, fixture `fake_llm`, `llm_sources`.
  - `LLMSources` 메서드 (단계 2·3 에서 테스트 파일을 고치지 않도록 확정): `anthropic(key)`, `gemini(key)`, `openai(key, source="settings"|"env"|"config")`, `ollama_url(url, source="settings"|"config")`, `ollama_model(model, source="settings"|"config")`, `override(openai_key=…, ollama_url=…)`, `set_config_llm`, `read_config`.
  - `llm_sources` 는 `app.config.load_json_config()` 로 읽은 내용에서 LLM 키 세 개와 `ollama_base_url` 을 비워 `tmp_path/config.json` 에 쓰고 `app.config.find_config_json` 을 그 경로로 돌린다 (원본은 읽기만).
- `backend/tests/test_llm_provider_isolation.py` 새로 만듦: plan 표의 14개 (T1, T2, T3, T4, T5 `[settings_model]`·`[config_model]`, T6, T7, T7b, T8, 탐침 1회·1.0초, API 503 두 개, 가드). 모든 행 테스트는 `gemini_spy` fixture 로 Gemini 키를 settings 에 두고 `_call_gemini` `call_count == 0` 을 단언한다. 흉내 Ollama 주소 `http://fake-ollama.test:11434`.

## 바꾼 파일
- `backend/tests/conftest.py` (M)
- `backend/tests/llm_fakes.py` (A)
- `backend/tests/test_llm_provider_isolation.py` (A)

## 검사 결과
`cd backend && ../.venv/bin/pytest tests/test_llm_provider_isolation.py -q -rf --tb=line`
```
E   assert True is False
     +  where True = has_live_provider()
     +    where has_live_provider = <app.services.llm_processor.LLMProcessor object at 0x104124a90>.has_live_provider
/Users/wonyoung/workspace/ozplayground/agentlens/backend/tests/test_llm_provider_isolation.py:185: assert True is False
E   assert 200 == 503
     +  where 200 = <Response [200 OK]>.status_code
------------------------------ Captured log call -------------------------------
ERROR    agentlens.chat:chat_service.py:760 Mid-stream LLM exception: 외부 LLM 업스트림 통신 실패 / API 장애
/Users/wonyoung/workspace/ozplayground/agentlens/backend/tests/test_llm_provider_isolation.py:232: assert 200 == 503
E   assert 502 == 503
     +  where 502 = <Response [502 Bad Gateway]>.status_code
/Users/wonyoung/workspace/ozplayground/agentlens/backend/tests/test_llm_provider_isolation.py:244: assert 502 == 503
=========================== short test summary info ============================
FAILED tests/test_llm_provider_isolation.py::test_t4_missing_ollama_model_is_unavailable
FAILED tests/test_llm_provider_isolation.py::test_t5_installed_ollama_model_used[config_model]
FAILED tests/test_llm_provider_isolation.py::test_t7_ollama_url_from_config_json_when_settings_empty
FAILED tests/test_llm_provider_isolation.py::test_t7b_empty_overrides_disable_openai_and_ollama
FAILED tests/test_llm_provider_isolation.py::test_api_chat_stream_503_when_ollama_model_missing
FAILED tests/test_llm_provider_isolation.py::test_api_chat_query_503_when_ollama_model_missing
6 failed, 8 passed in 0.96s
```
실패 6개와 이유 (지금 코드의 결함):
- T4: `has_live_provider()` 가 True (`/api/tags` 200 만 봄) — `assert True is False`.
- T5 `[config_model]`: `_call_ollama` 가 `settings.OLLAMA_MODEL`("") 만 봐 흉내 404 → `LLMUpstreamException`.
- T7: `_call_ollama` 가 `settings` 다음에 `self.ollama_url`(None) 을 봐 주소 없음 → `LLMUpstreamException`.
- T7b: 덮어쓰기보다 `settings` 의 OpenAI 키가 앞서 `has_live_provider()` True.
- API stream: **plan 의 예상(502)과 다르게 200**. 사전 판정이 True 라 `StreamingResponse` 가 열리고, 스트림 안에서 `LLMUpstreamException` 이 SSE 오류로 바뀐다 (`chat_service.py:760` 'Mid-stream LLM exception'). 결함(판정이 설정 모델 미설치를 보지 않음)은 같고, 테스트 단언(503)도 그대로다.
- API query: 502 `ERR_LLM_UPSTREAM_FAILED`, 판정 이유 로그 없음.
- 통과 8개: T1, T2, T3, T5 `[settings_model]`, T6 (OpenAI 생성·SDK 스트림 모두 흉내로 잡힘), T8, 탐침, 가드.

전체 (C1, 하네스 전): `cd backend && ../.venv/bin/pytest tests/ -q -p no:cacheprovider`
```
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
FAILED tests/test_llm_provider_isolation.py::test_t4_missing_ollama_model_is_unavailable
FAILED tests/test_llm_provider_isolation.py::test_t5_installed_ollama_model_used[config_model]
FAILED tests/test_llm_provider_isolation.py::test_t7_ollama_url_from_config_json_when_settings_empty
FAILED tests/test_llm_provider_isolation.py::test_t7b_empty_overrides_disable_openai_and_ollama
FAILED tests/test_llm_provider_isolation.py::test_api_chat_stream_503_when_ollama_model_missing
FAILED tests/test_llm_provider_isolation.py::test_api_chat_query_503_when_ollama_model_missing
8 failed, 166 passed in 105.03s (0:01:45)
```
- 실행 뒤 `git status --porcelain -- config.json sources.json backend/app/config/sources.json` → ` M backend/app/config/sources.json`, ` M sources.json` (기존 테스트가 고침, 하네스 전이라 예상대로). `git checkout -- config.json sources.json backend/app/config/sources.json` 으로 되돌렸고 다시 본 출력은 비어 있음.
- `git diff --name-status main -- backend/tests/` → `M	backend/tests/conftest.py` 만 (새 두 파일은 커밋 전 untracked).

## 결정
- openai SDK 전송은 `httpx2` 라 흉내 계층이 `httpx2` 도 감싼다 (plan '위험' 의 openai SDK 전송 항목의 처리). `httpx2` 는 openai 의 기존 의존성이라 새 의존성이 아니다. 없으면 건너뛴다 (`try: import httpx2`).
- 흉내 Ollama `down` 요청도 `requests("ollama")` 에 기록한다 (T1 의 'Ollama 요청 0회' 가 탐침 시도 자체를 세도록). 가드에 걸린 요청은 `requests()` 가 아니라 `unmocked` 에만 남긴다.
- 테스트 이름은 plan 의 제안 그대로.

## 막힌 점
- 없음. plan 과 다른 점은 API stream 테스트의 지금 실패 모습(502 아님, 200) 하나이고 위에 적었다.

## 다음
- 단계 2 (`02-harness.md`): `sources_service.py` 거울 경로 속성, conftest autouse `llm_isolation` (세션 사본, `_json_data`·`env_file` 고정, `fake_llm` 설치·가드 정리), `llm_sources` 를 세션 사본 기반으로.
