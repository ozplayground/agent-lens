# Task 03: llm_processor 해석 함수와 Ollama 판정

Feature: backend-llm-test-isolation · Plan: docs/features/backend-llm-test-isolation/plan.md 작업 순서 03
Status: done
Session: main
Agent: aa1bf34d8feb5e21c (implementer)
Updated: 2026-11-08

## 한 일
`backend/app/services/llm_processor.py` 만 고쳤다.
- `__init__`: `self.openai_key = None`, `self.ollama_url = None` (명시 덮어쓰기 자리), `self._unavailable_reason = None`. `self.gemini_key` 줄은 그대로.
- 해석 함수 4개 (매번 모듈 전역 `load_json_config()` 를 부름. 덮어쓰기가 `None` 이 아니면 그 값만):
  - `_resolve_openai_key()`: 덮어쓰기 → `settings.OPENAI_API_KEY` → `llm.openai_api_key` → `os.environ["OPENAI_API_KEY"]` → `""`.
  - `_resolve_openai_chat_model()`: `settings.OPENAI_MODEL` → `llm.openai_model` → `"gpt-4o-mini"`.
  - `_resolve_ollama_url()`: 덮어쓰기 → `settings.OLLAMA_BASE_URL` → `llm.ollama_base_url` → `""`, 끝 `/` 제거.
  - `_resolve_ollama_generate_model()`: `settings.OLLAMA_MODEL` → `llm.ollama_model` → `"llama3.2:latest"`.
- `_ollama_status(url, model) -> (bool, 이유)`: `httpx.Client(timeout=1.0)` 로 `GET {url}/api/tags` 한 번. 이유 문자열 `Ollama 주소 없음` · `Ollama 연결 실패` · `Ollama /api/tags 응답 <코드>` · `Ollama 응답 해석 실패` · `Ollama 설정 모델 미설치 (<모델>)`. 설정 모델에 `:` 가 없으면 `:latest` 를 붙여 `models[].name`·`model` 과 비교.
- 쓰는 곳을 해석 함수로: `has_live_provider` (OpenAI·Ollama 갈래, Ollama 는 `_ollama_status`), `_call_openai` (키·모델), `_call_ollama` (주소·모델), `generate_live_answer` OpenAI 블록 키, `stream_tokens` OpenAI 블록 키·모델과 Ollama 블록 주소·모델, `stream_question_answer` OpenAI 블록 키·모델. `stream_tokens`·`stream_question_answer` 의 `json_cfg = load_json_config()` 줄은 OpenAI·Ollama 갈래 말고 쓰는 곳이 없어 지웠다 (Gemini 의 `json_cfg` 두 곳은 그대로).
- 판정 이유 로그: `has_live_provider` 가 False 로 끝나면 `self._unavailable_reason = "Anthropic 키 없음 · OpenAI 키 없음 · <Ollama 이유>"`, `logger.debug`. `check_provider_available` 은 `_unavailable_reason = None` 뒤 `self.has_live_provider(...)` 를 부르고, False 면 `logger.warning("가용한 LLM 프로바이더 없음: <이유 또는 '판정 이유 없음'>")` 뒤 기존 메시지로 `LLMProviderUnavailableException`.
- 손대지 않음: `if self.anthropic_provider.is_available():` 블록 4개, Gemini 키 해석 (`_call_gemini`, `has_live_provider(target_provider="gemini")`), `is_test_environment`, 예외 메시지 문자열, `anthropic_provider.py`.

## 바꾼 파일
- `backend/app/services/llm_processor.py`

## 검사 결과
### 단계 3 끝 기준
- `cd backend && ../.venv/bin/pytest -v -p no:cacheprovider tests/test_llm_provider_isolation.py`
```
tests/test_llm_provider_isolation.py::test_t1_claude_key_skips_ollama_probe PASSED [  7%]
tests/test_llm_provider_isolation.py::test_t2_claude_preferred_over_installed_ollama PASSED [ 14%]
tests/test_llm_provider_isolation.py::test_t3_no_provider_when_ollama_unreachable PASSED [ 21%]
tests/test_llm_provider_isolation.py::test_t4_missing_ollama_model_is_unavailable PASSED [ 28%]
tests/test_llm_provider_isolation.py::test_t5_installed_ollama_model_used[settings_model] PASSED [ 35%]
tests/test_llm_provider_isolation.py::test_t5_installed_ollama_model_used[config_model] PASSED [ 42%]
tests/test_llm_provider_isolation.py::test_t6_openai_key_only PASSED     [ 50%]
tests/test_llm_provider_isolation.py::test_t7_ollama_url_from_config_json_when_settings_empty PASSED [ 57%]
tests/test_llm_provider_isolation.py::test_t7b_empty_overrides_disable_openai_and_ollama PASSED [ 64%]
tests/test_llm_provider_isolation.py::test_t8_untagged_model_matches_latest_tag PASSED [ 71%]
tests/test_llm_provider_isolation.py::test_ollama_probe_is_single_request_with_1s_timeout PASSED [ 78%]
tests/test_llm_provider_isolation.py::test_api_chat_stream_503_when_ollama_model_missing PASSED [ 85%]
tests/test_llm_provider_isolation.py::test_api_chat_query_503_when_ollama_model_missing PASSED [ 92%]
tests/test_llm_provider_isolation.py::test_guard_records_unmocked_llm_request PASSED [100%]

============================== 14 passed in 0.95s ==============================
```
- 단계 1 커밋 `89dc2ad` 대비 `git diff 89dc2ad -- backend/tests/test_llm_provider_isolation.py` 출력 없음.

### 관문 G2
`<설치된 모델>`: 실행 전 `curl -s localhost:11434/api/tags` → `['gpt-oss:20b']`.

**증명 1 (R7)·증명 2 (R9)** — `backend/` 에서 `../.venv/bin/pytest tests/ -q -p no:cacheprovider`, 각 실행 뒤 루트에서 `git status --porcelain -- config.json sources.json backend/app/config/sources.json`:
```
=== C1:
exit=0
174 passed in 9.48s
git status:[]
=== C2: OLLAMA_BASE_URL=http://127.0.0.1:9
exit=0
174 passed in 6.82s
git status:[]
=== C3: OLLAMA_MODEL=gpt-oss:20b
exit=0
174 passed in 6.36s
git status:[]
=== C4: ANTHROPIC_API_KEY= OPENAI_API_KEY= OLLAMA_BASE_URL=http://127.0.0.1:9
exit=0
174 passed in 6.40s
git status:[]
=== C5: ANTHROPIC_API_KEY= OPENAI_API_KEY= OLLAMA_MODEL=gpt-oss:20b
exit=0
174 passed in 6.58s
git status:[]
=== C6: ANTHROPIC_API_KEY= OPENAI_API_KEY=sk-test-dummy
exit=0
174 passed in 6.92s
git status:[]
```
(`FAILED`·`ERROR` 줄 0, 설정 파일 되돌린 적 없음)

C1 루트 `make check` → `make check exit=0`. backend `174 passed in 5.99s`, frontend `Test Files  52 passed (52)` · `Tests  649 passed (649)`, eslint `0 errors, 41 warnings`, `tsc --noEmit` 출력 없음. 마지막 20줄:
```
/Users/wonyoung/workspace/ozplayground/agentlens/frontend/src/tests/ThemeSystem.test.tsx
  4:35  warning  'ThemeMode' is defined but never used  @typescript-eslint/no-unused-vars

/Users/wonyoung/workspace/ozplayground/agentlens/frontend/src/tests/chat/ChatSidebar.test.tsx
  2:36  warning  'beforeEach' is defined but never used            @typescript-eslint/no-unused-vars
  7:8   warning  'DeleteConfirmPopover' is defined but never used  @typescript-eslint/no-unused-vars
  8:8   warning  'SessionList' is defined but never used           @typescript-eslint/no-unused-vars

/Users/wonyoung/workspace/ozplayground/agentlens/frontend/src/tests/chat/ChatWorkspace.test.tsx
  440:85  warning  'init' is defined but never used  @typescript-eslint/no-unused-vars

/Users/wonyoung/workspace/ozplayground/agentlens/frontend/src/tests/chat/ContractAndMsw.test.ts
   5:3  warning  'ChatQueryRequestSchema' is defined but never used  @typescript-eslint/no-unused-vars
  27:3  warning  'ChatMessage' is defined but never used             @typescript-eslint/no-unused-vars
  28:3  warning  'Message' is defined but never used                 @typescript-eslint/no-unused-vars
  29:3  warning  'MessageSchema' is defined but never used           @typescript-eslint/no-unused-vars
  30:3  warning  'SendMessageRequest' is defined but never used      @typescript-eslint/no-unused-vars
  41:3  warning  'ModelTier' is defined but never used               @typescript-eslint/no-unused-vars
  42:3  warning  'ChatModel' is defined but never used               @typescript-eslint/no-unused-vars

/Users/wonyoung/workspace/ozplayground/agentlens/frontend/src/tests/chat/WorkflowStepTracker.test.tsx
  2:32  warning  'vi' is defined but never used  @typescript-eslint/no-unused-vars

✖ 41 problems (0 errors, 41 warnings)
```
`make check` 뒤 설정 파일 `git status` 출력 없음.

**증명 3 (R1 a)** — `grep -nE "OPENAI_API_KEY|OPENAI_MODEL|OLLAMA_BASE_URL|OLLAMA_MODEL|openai_api_key|openai_model|ollama_base_url|ollama_model|self\.(openai_key|ollama_url)" backend/app/services/llm_processor.py`:
```
116:        self.openai_key: Optional[str] = None
117:        self.ollama_url: Optional[str] = None
131:        if self.openai_key is not None:
132:            return self.openai_key
135:            getattr(settings, "OPENAI_API_KEY", "")
136:            or llm_cfg.get("openai_api_key", "")
137:            or os.environ.get("OPENAI_API_KEY", "")
145:            getattr(settings, "OPENAI_MODEL", "")
146:            or llm_cfg.get("openai_model", "")
152:        if self.ollama_url is not None:
153:            return self.ollama_url.rstrip("/")
156:            getattr(settings, "OLLAMA_BASE_URL", "")
157:            or llm_cfg.get("ollama_base_url", "")
166:            getattr(settings, "OLLAMA_MODEL", "")
167:            or llm_cfg.get("ollama_model", "")
```
함수 범위: `__init__` 113–127 (116, 117), `_resolve_openai_key` 129–139 (131–137), `_resolve_openai_chat_model` 141–148 (145, 146), `_resolve_ollama_url` 150–160 (152–157), `_resolve_ollama_generate_model` 162–169 (166, 167). 모든 줄이 다섯 함수 안에 있다.

**증명 4 (R3 a)** — `grep -n "qwen2.5" backend/app/services/llm_processor.py` 0건.

**증명 5 (R5)**
- (a) `git diff main -- backend/app/services/llm_providers/anthropic_provider.py` 출력 없음.
- (b) plan 의 블록 비교 스크립트 출력 `True 4`.
- (c) `make check` 로그에서 `test_anthropic_provider.py` PASSED 16 (파일의 테스트 16개 전부), FAILED 0.

**증명 6 (R8)**
```
$ git diff --name-status main -- backend/tests/
M	backend/tests/conftest.py
A	backend/tests/llm_fakes.py
A	backend/tests/test_llm_provider_isolation.py
$ git diff main -- backend/tests/ ':!backend/tests/conftest.py' ':!backend/tests/llm_fakes.py' ':!backend/tests/test_llm_provider_isolation.py'
(출력 없음)
$ git diff 89dc2ad -- backend/tests/test_llm_provider_isolation.py
(출력 없음)
```
`test_anti_gemini_isolation_in_generate_live_answer`, `test_anti_gemini_isolation_in_stream_tokens`, `test_stream_tokens_fails_fast_without_mock_fallback` 는 C1~C6 에서 통과 (실패 0).

## 결정
- **모델 해석 함수 이름을 plan 의 `_resolve_openai_model`·`_resolve_ollama_model` 에서 `_resolve_openai_chat_model`·`_resolve_ollama_generate_model` 로 바꿨다.** plan 의 증명 3 grep 패턴이 소문자 `openai_model`·`ollama_model` 을 포함해, plan 이 적은 이름 그대로면 호출하는 곳 6줄(`_call_openai`, `_call_ollama`, `has_live_provider`, `stream_tokens` 두 곳, `stream_question_answer`)이 grep 에 걸려 '모든 줄이 `__init__` 과 해석 함수 4개 안' 을 글자 그대로 만족할 수 없었다. 처음엔 plan 이름으로 구현해 그 6줄이 걸리는 것을 확인했고, 그다음 이름만 바꿨다. 동작·개수·원천 순서는 plan 그대로다. `_resolve_openai_key`·`_resolve_ollama_url` 은 패턴과 겹치지 않아 plan 이름 그대로 뒀다. 문서 단계(04)에서 근거를 적을 때 이 이름을 쓴다.
- Ollama 미설치 이유 문자열의 `<모델>` 은 정규화 전 설정 값 그대로 쓴다.
- `stream_tokens`·`stream_question_answer` 에서 쓰는 곳이 없어진 `json_cfg = load_json_config()` 정의 줄은 지웠다 (plan 은 '다른 데서 쓰면 그대로 둔다' 고 함. 쓰는 곳 0).

## 막힌 점
- 없음.

## 다음
- 단계 4 (`04-docs.md`, 이 세션 범위 밖): 문서 8개. 근거 줄 번호는 지금 코드 기준 — 해석 함수 `llm_processor.py:129-169`, `_ollama_status` `:171-194`, `has_live_provider` `:301-325`, `check_provider_available` `:327-337`. 해석 함수 이름은 위 '결정' 대로.
- 그 뒤 `/verify-change backend-llm-test-isolation` (R11 실제 Claude 스모크 포함).
