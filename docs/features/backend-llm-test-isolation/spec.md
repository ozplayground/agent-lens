# Spec: backend LLM 호출 정상화와 실행 환경에 의존하지 않는 `make check`

Intent: ./intent.md
Status: approved
Approved-by: 자동 승인 (Claude) (2026-11-07)
Policies: 프로젝트 정책 스킬 없음 (`.claude/skills/` 에 보안·컴플라이언스·UX·브랜드 정책 스킬이 없다). 코드 정책 POL-LLM-005 (Gemini 는 기본 체인에서 쓰지 않음, `llm_processor.py:399`, `anthropic_provider.py:98`) 는 제약으로 그대로 지킨다.

## 요구사항
결정 기준: 변경을 최소로 하고, 사용자가 쓰는 Claude 경로의 동작은 바꾸지 않는다 (근거 E1).

| ID | 요구 | intent 연결 | 확인 기준 (측정 가능) |
|---|---|---|---|
| R1 | OpenAI 키·OpenAI 모델·Ollama 주소·Ollama 모델은 `LLMProcessor` 안의 해석 함수에서만 읽는다. 해석 함수는 지금 코드의 원천 순서를 그대로 지킨다: OpenAI 키 `settings` → `config.json` → `os.environ`, Ollama 주소 `settings` → `config.json`, Ollama 모델 `settings` → `config.json` → `llama3.2:latest`, OpenAI 모델 `settings` → `config.json` → `gpt-4o-mini`. 실행 중 `config.json` 보충은 남는다. 바뀌는 것은 생성 시점 싱글턴 값뿐이다: `openai_key`·`ollama_url` 은 '명시 덮어쓰기' 자리가 되어, `None` 이면 위 순서를 따르고, 문자열(빈 값 포함)이면 그 값만 쓴다 | 원인 1, 열린 질문 1·2 | (a) `grep -nE "OPENAI_API_KEY\|OPENAI_MODEL\|OLLAMA_BASE_URL\|OLLAMA_MODEL\|openai_api_key\|openai_model\|ollama_base_url\|ollama_model\|self\.(openai_key\|ollama_url)" backend/app/services/llm_processor.py` 결과가 `__init__` 과 해석 함수 안에만 있다. (b) 회귀 테스트: `settings` 가 비고 `config.json` 에 Ollama 주소가 있으면 그 주소를 쓴다 (지금 동작 유지). 덮어쓰기 `""` 는 `settings`·`config.json`·`os.environ` 에 값이 있어도 그 갈래를 끈다 |
| R2 | Ollama 를 '쓸 수 있음' 으로 판정하는 조건: `GET {주소}/api/tags` 한 번(타임아웃 1.0초)이 200 이고, 응답 `models[]` 가운데 `name` 또는 `model` 이 설정 모델과 같은 항목이 있다. 설정 모델에 태그가 없으면 `:latest` 를 붙여 비교한다. 연결 실패·200 이 아닌 응답·JSON 해석 실패·모델 없음은 모두 '쓸 수 없음' 이다 | 원인 2, 기대 결과 2, 열린 질문 3 | 회귀 테스트: Ollama '연결 안 됨'·'떠 있고 설정 모델 없음' 에서 False, '떠 있고 설정 모델 있음' 에서 True, 설정 `llama3.2` 와 설치 `llama3.2:latest` 에서 True. 코드에서 탐침 타임아웃이 1.0 이고 판정 한 번에 HTTP 요청이 한 번이다 (흉내 전송 계층의 요청 수 = 1) |
| R3 | Ollama 생성 모델은 해석 함수 하나로 정한다: `settings.OLLAMA_MODEL` → `config.json` `llm.ollama_model` → `llama3.2:latest`. 판정(R2), `_call_ollama`, `stream_tokens` 가 같은 해석 함수를 쓴다 | 원인 2 마지막 줄, 열린 질문 6 | (a) `grep -n "qwen2.5" backend/app/services/llm_processor.py` 결과 0건. (b) 회귀 테스트: 판정에 쓴 모델 이름과 `/api/generate` 요청 본문의 `model` 이 같다 (생성·스트리밍 둘 다) |
| R4 | 쓸 수 있는 프로바이더가 없으면 지금처럼 `LLMProviderUnavailableException` → HTTP 503 `ERR_LLM_PROVIDER_UNAVAILABLE`. 응답 본문(`error_code`, `message`, `details`)은 바꾸지 않는다. 판정 이유(Anthropic 키 없음, OpenAI 키 없음, Ollama 주소 없음·연결 실패·설정 모델 미설치)는 서버 로그에만 남긴다 | 기대 결과 2, 열린 질문 7 | 회귀 테스트: Anthropic·OpenAI 키 없음 + Ollama '떠 있고 설정 모델 없음' 에서 `POST /api/chat/stream`·`POST /api/chat/query` 가 503, `error_code == "ERR_LLM_PROVIDER_UNAVAILABLE"` (지금은 502 `ERR_LLM_UPSTREAM_FAILED`). `caplog` 에 '설정 모델 미설치' 이유가 있다 |
| R5 | Claude 경로는 바꾸지 않는다: `anthropic_provider.py` 전체, `generate_live_answer`·`stream_tokens`·`stream_question_answer` 의 Anthropic 블록, 프로바이더 우선순위(Anthropic → OpenAI → Ollama), Gemini 명시 경로 | 기대 결과 1, 제약 | (a) `git diff main -- backend/app/services/llm_providers/anthropic_provider.py` 가 비어 있다. (b) diff 에서 `llm_processor.py` 의 Anthropic 블록(`if self.anthropic_provider.is_available():` 로 시작하는 세 블록) 줄이 바뀌지 않았다. (c) `test_anthropic_provider.py` 의 기존 테스트 전부 통과 |
| R6 | backend 테스트는 실행 환경의 LLM 설정 원천과 외부 LLM 을 쓰지 않는다. `backend/tests/conftest.py` 의 autouse fixture 가 테스트마다 (1) LLM 환경 변수 제거, (2) `settings` 의 LLM 필드를 정해진 기본 상태로 고정, (3) `config.json`·`sources.json` 을 임시 사본으로 돌림 (`config.json` 사본은 LLM 키·Ollama 주소를 비워, 해석 함수의 `config.json` 보충 원천도 실행 환경과 끊는다), (4) LLM 호스트로 가는 HTTP 를 전송 계층에서 가로채 흉내 응답을 준다. 흉내가 없는 LLM 요청은 실제로 나가지 않고, 그 테스트를 실패시킨다 (설계 2절) | 원인 1, 기대 결과 3·4, 열린 질문 1·4 | (a) 회귀 테스트: 흉내를 등록하지 않은 LLM 호스트 요청이 가드에 잡혀 기록된다 (가드 자체 시험). (b) R7 의 모든 조건에서 실패 0 |
| R7 | backend 전체 테스트가 아래 실행 환경 조건 모두에서 같은 결과(실패 0, 같은 통과 수)로 끝난다. 조건은 Ollama 를 끄거나, 모델을 설치·삭제하거나, `.env` 를 고치지 않고 만든다 (명령 줄 환경 변수만 쓴다. 설계 5절) | 기대 결과 3·4 | C1~C6 각각 `cd backend && ../.venv/bin/pytest tests/` 종료 0, 통과 수가 모두 같다 (지금 160 + 새 회귀 테스트 수). C1 에서 `make check` 종료 0 (아래 '범위 밖' 참고) |
| R8 | 기존 테스트 코드와 단언은 바꾸지 않는다. 특히 `test_anti_gemini_isolation_in_generate_live_answer`·`test_anti_gemini_isolation_in_stream_tokens` 는 `LLMProviderUnavailableException` 과 `_call_gemini` 미호출을, `test_stream_tokens_fails_fast_without_mock_fallback` 은 `LLMUpstreamException` 을 그대로 단언한다 | 기대 결과 5, 제약 | `git diff main --stat -- backend/tests/` 에서 바뀐 기존 파일이 `conftest.py` 하나뿐이다 (새 파일 추가는 허용). 위 세 테스트가 C1~C6 에서 통과 |
| R9 | 테스트가 git 이 추적하는 설정 파일을 고치지 않는다 | 기대 결과 6, 열린 질문 5 | C1~C6 각 실행 뒤 `git status --porcelain -- config.json sources.json backend/app/config/sources.json` 출력이 비어 있다 |
| R10 | 회귀 테스트를 더한다: 프로바이더 조건 조합별 가용성 판정과 예외 종류 (설계 4절 표) | 기대 결과 7 | 새 테스트 파일의 표 행마다 테스트가 있고 모두 통과 |
| R11 | Claude 키가 설정된 실제 환경에서 Claude 호출이 지금처럼 성공한다. `make check` 밖에서 확인한다 | 기대 결과 1 | verify 단계에서 실제 키로 (a) `llm_processor.generate_live_answer("Reply with exactly: OK", model_tier="haiku")` 가 빈 값이 아닌 답과 `claude-haiku-` 로 시작하는 모델 이름, (b) `stream_tokens` 같은 결과, (c) `uvicorn app.main:app` 임시 포트 기동 후 `GET /health` 200. 확인 뒤 서버를 내린다 |
| R12 | 가용성 판정은 요청 경로를 지금보다 오래 막지 않는다 | 제약 | R2 의 (탐침 1회, 타임아웃 1.0초). Anthropic 키가 있으면 지금처럼 탐침 없이 True (R5) |

범위 밖 (intent 와 같음):
- frontend 에 이미 있는 실패. C1 의 `make check` 가 frontend 단계에서 이 기능과 무관한 이유로 실패하면 verify 는 backend 단계 통과와 frontend 실패 내용을 따로 적는다.
- LLM 이 아닌 외부 호출(github.com·example.com 스크래퍼, api.notion.com, SMTP). 네트워크 상태에 따른 영향은 그대로 남는다 (우려 4).
- `backend/tests/test_agentlens.db` 데이터 누적.

## 설계

### 1. 코드 변경: 설정 해석을 한 함수로, 원천 순서는 그대로 (R1, R3, R5)
바꾸는 파일: `backend/app/services/llm_processor.py`.

- `LLMProcessor.__init__`: `self.openai_key = None`, `self.ollama_url = None` (덮어쓰기 없음). `self.gemini_key` 는 그대로 둔다 (Gemini 경로는 바꾸지 않음).
- 해석 함수를 더한다 (이름·개수는 plan 에서 정한다). 덮어쓰기가 `None` 이 아니면 그 값만 쓰고, `None` 이면 지금 코드의 원천 순서를 따른다. `config.json` 은 호출 때마다 `load_json_config()` 로 읽는다 (지금과 같음):
  - OpenAI 키: `settings.OPENAI_API_KEY` → `config.json` `llm.openai_api_key` → `os.environ["OPENAI_API_KEY"]` (지금 `llm_processor.py:181-186` 순서에서 마지막 `self.openai_key` 만 덮어쓰기 자리로 옮김).
  - OpenAI 모델: `settings.OPENAI_MODEL` → `config.json` `llm.openai_model` → `gpt-4o-mini` (지금 `:189-193`, `:413` 과 같음).
  - Ollama 주소: `settings.OLLAMA_BASE_URL` → `config.json` `llm.ollama_base_url` (지금 `has_live_provider`·`stream_tokens` 순서, `:267`, `:437`). 끝의 `/` 는 뗀다.
  - Ollama 모델: `settings.OLLAMA_MODEL` → `config.json` `llm.ollama_model` → `llama3.2:latest` (R3, 근거 E10).
  - 덮어쓰기 규칙은 `AnthropicLLMProvider._explicit_key` (`None` 이면 설정, 값이면 그 값) 와 같은 모양이다 (근거 E4).
- 쓰는 곳을 모두 해석 함수로 바꾼다: `has_live_provider`(OpenAI·Ollama 갈래), `_call_openai`, `_call_ollama`, `generate_live_answer` 의 OpenAI 블록, `stream_tokens` 의 OpenAI·Ollama 블록, `stream_question_answer` 의 OpenAI 블록.
- 실행 중 동작: 설정 우선순위와 실행 중 `config.json` 보충은 지금과 같다 (우려 3 의 메인 세션 결정). 실제로 달라지는 곳은 둘이다. (1) `_call_ollama` 는 `settings` 가 빈 값일 때 생성 시점 복사본 대신 `config.json` 을 본다 (`has_live_provider`·`stream_tokens` 와 같은 순서로 맞춤). (2) `stream_tokens` 의 Ollama 모델 마지막 기본값이 `qwen2.5:latest` 에서 `llama3.2:latest` 로 바뀐다. 둘 다 `settings` 가 빈 값일 때만 나타난다.
- 바꾸지 않는 것: `anthropic_provider.py` 전체(키 해석 `_get_api_key` 포함), Anthropic 블록, Gemini 키 해석(`_call_gemini`, `has_live_provider(target_provider="gemini")`), `is_test_environment`, `check_provider_available` 의 예외 메시지.

기존 테스트가 통과하는 경로 (근거 E2, E3, E11):
- `test_anti_gemini_isolation_in_generate_live_answer`, `test_anti_gemini_isolation_in_stream_tokens`: 테스트는 `settings.OPENAI_API_KEY`·`settings.OLLAMA_BASE_URL` 을 빈 값으로, `anthropic_provider.is_available` 을 False 로 둔다. 해석 함수는 `settings` 다음에 `config.json` 과 `os.environ` 을 보는데, 하네스(설계 4절)가 (a) `OPENAI_API_KEY`·`OLLAMA_BASE_URL` 환경 변수를 지우고 (b) `config.json` 을 LLM 키·`ollama_base_url` 을 비운 임시 사본으로 돌린다. 그래서 OpenAI·Ollama 갈래 모두 원천이 비어 Ollama 탐침 없이 `has_live_provider()` 가 False 가 되고, `LLMProviderUnavailableException` 이 나며 `_call_gemini` 는 불리지 않는다. 이 통과는 하네스가 주는 사본 내용과 환경 변수 제거에 달려 있다. R2 모델 확인은 이 두 테스트의 통과 경로가 아니다: 하네스 안에서는 Ollama 주소가 비어 탐침까지 가지 않는다. R2 는 실제 실행의 원인 2 와 회귀 테스트 T4·T5 를 위한 것이다. 사본이 Ollama 주소를 비우지 않으면 탐침이 `localhost:11434` 로 가 가드에 잡히고 테스트가 실패하므로, 사본을 비우는 것은 이 설계에서 빠질 수 없다.
- `test_stream_tokens_fails_fast_without_mock_fallback`: `openai_key`·`ollama_url` 을 `""` 로 덮어쓴다. 덮어쓰기가 있으면 그 값만 쓰므로 `settings`·`config.json`·환경 변수와 관계없이 두 갈래가 꺼지고, 실제 스트림 없이 `LLMUpstreamException` 이 난다. 이 테스트는 코드 변경(덮어쓰기 규칙)만으로 환경과 무관해진다.
- `test_anti_gemini_has_live_provider_ignores_gemini_key`: `patch.object(llm_processor, "openai_key"/"ollama_url", "")` 는 속성이 남아 있어 그대로 동작하고, 덮어쓰기 `""` 로 두 갈래가 꺼진다. `llm_processor` 모듈의 `load_json_config` patch 도 해석 함수가 같은 이름을 부르므로 그대로 효과가 있다.
- R8 확인: 위 경로 어디에도 기존 테스트 파일 수정이나 단언 변경이 없다. 고치는 테스트 쪽 파일은 `conftest.py` 와 새 파일뿐이다. 다만 앞의 두 테스트가 하네스에 기대어 통과한다는 점은 우려 2 에 적는다.

### 2. 코드 변경: Ollama 가용성 판정 (R2, R4, R12)
같은 파일 `has_live_provider` 의 Ollama 갈래.
- 주소가 비어 있으면 False.
- `httpx.Client(timeout=1.0)` 로 `GET {주소}/api/tags` 한 번. 200 이 아니거나 예외면 False.
- 응답 JSON 의 `models` 배열에서 `name` 또는 `model` 이 설정 모델과 같으면 True. 설정 모델에 `:` 가 없으면 `:latest` 를 붙여 비교한다 (Ollama API 문서: 태그를 생략하면 `latest`, `/api/tags` 항목은 `name`·`model` 을 가진다. 근거 E5).
- False 로 끝나면 이유를 `logger` 에 남긴다. 레벨은 수집 평가가 항목마다 판정을 부르므로 같은 이유가 반복될 때 로그가 넘치지 않게 plan 에서 정한다 (예: `check_provider_available` 이 예외를 낼 때만 WARNING, 그 밖은 DEBUG).
- `check_provider_available` 의 예외 메시지와 `api/chat.py` 의 503 본문은 그대로다. 앱 간 계약(`backend/app/schemas/` ↔ `frontend/src/types/` ↔ `frontend/src/mocks/`)은 바뀌지 않는다. 바뀌는 것은 '어떤 환경에서 503 이 나는가' 뿐이다: Ollama 만 떠 있고 설정 모델이 없으면 502 `ERR_LLM_UPSTREAM_FAILED` 대신 503 `ERR_LLM_PROVIDER_UNAVAILABLE`.
- 수집 평가(`llm_processor.py:580`) 는 같은 환경에서 판정이 False 가 되어 실패하는 생성 호출 없이 바로 휴리스틱으로 간다. 탐침 1초는 지금처럼 항목마다 남는다 (탐침 결과 캐시는 범위 밖).

### 3. 코드 변경: `sources.json` 거울 경로를 바꿀 수 있게 (R9)
바꾸는 파일: `backend/app/services/sources_service.py`.
- `save_sources` 는 찾은 파일(`p`)에 쓰고, 코드에 고정된 `backend/app/config/sources.json` 에도 함께 쓴다 (`:110-118`). 테스트가 `p` 를 임시 경로로 돌려도 거울 쓰기는 실제 파일로 간다.
- `SourcesService.__init__` 에서 거울 경로를 인스턴스 속성으로 정하고 (기본값은 지금 고정 경로 그대로), `save_sources` 는 그 속성을 쓴다. 실제 실행 동작은 같다.
- `config.json` 은 코드 변경 없이 `app.config.find_config_json` 을 fixture 가 바꿔 돌린다. `load_json_config`·`save_json_config` 가 호출 때마다 이 모듈 전역 함수를 찾으므로 (`config.py:27-35, 161-173`) 한 곳만 바꾸면 된다 (근거 E6).

### 4. 테스트 하네스: `backend/tests/conftest.py` (R6, R9)
새 fixture (이름·분리 파일은 plan 에서 정한다. 흉내 구현은 `backend/tests/` 아래 도움 모듈로 둘 수 있다. 새 의존성은 더하지 않는다: `unittest.mock`·`pytest` `monkeypatch`·`httpx` 만 쓴다).

- 세션 fixture: 세션 임시 폴더에 루트 `config.json` 사본과 루트 `sources.json` 사본을 만든다. `config.json` 사본은 `llm` 절의 `anthropic_api_key`·`openai_api_key`·`gemini_api_key`·`ollama_base_url` 을 빈 값으로 바꾼다. 해석 함수와 `_get_api_key` 가 실행 중 `config.json` 을 보충 원천으로 읽으므로, 이 비우기가 '`settings` 를 비우면 그 프로바이더는 없다' 는 테스트 전제를 만든다 (설계 1절). 세션 동안 같은 사본을 써서 테스트 사이 상태가 지금처럼 이어진다 (지금은 실제 파일로 이어진다).
- autouse 함수 fixture (기본 상태):
  1. `monkeypatch.delenv` 로 `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL` 을 지운다.
  2. `app.config.find_config_json` → 사본 `config.json`. `sources_service` 의 파일 경로와 거울 경로 → 사본 `sources.json`.
  3. `settings`: `ANTHROPIC_API_KEY = "sk-ant-test-fake"` (흉내 Claude 사용 가능), `OPENAI_API_KEY = ""`, `GEMINI_API_KEY = ""`, `OLLAMA_BASE_URL = ""`, `OLLAMA_MODEL = "llama3.2:latest"`. `llm_processor.openai_key = None`, `llm_processor.ollama_url = None`.
  4. 흉내 LLM 전송 계층: `httpx.HTTPTransport.handle_request`·`httpx.AsyncHTTPTransport.handle_async_request` 를 감싸, 요청 호스트가 LLM 호스트면 흉내 응답을 돌려주고 그 밖은 원래 전송으로 넘긴다. LLM 호스트는 `api.anthropic.com`, `api.openai.com`, `generativelanguage.googleapis.com`, 그리고 포트 11434 인 모든 호스트와 테스트가 등록한 흉내 Ollama 주소다. `ASGITransport`(테스트가 앱을 부르는 경로)와 `httpx.AsyncClient.post`·`.stream` 을 직접 patch 하는 기존 테스트는 이 계층을 거치지 않아 영향이 없다.
  5. 흉내 Claude (`POST https://api.anthropic.com/v1/messages`): 비스트림이면 `{"content":[{"type":"text","text":<고정 답>}],"model":<요청 model>,"usage":{"input_tokens":..,"output_tokens":..}}` 200. `stream: true` 면 `message_start`·`content_block_delta`(`text_delta` 여러 개)·`message_delta`(`usage.output_tokens`)·`message_stop` SSE. 형식은 `test_anthropic_provider.py` 의 기존 흉내 응답과 같다 (근거 E7). 고정 답은 한국어 마크다운 문장으로 하고 중괄호를 넣지 않는다: JSON 을 기대하는 수집 평가는 지금의 '파싱 실패 → 휴리스틱' 처리로 간다.
  6. 가드: 흉내가 등록되지 않은 LLM 호스트 요청(기본 상태의 OpenAI·Gemini·Ollama)은 실제로 보내지 않고 `httpx.ConnectError` 를 내며 요청을 기록한다. fixture 정리 단계에서 기록이 있으면 그 테스트를 실패시킨다 (코드가 예외를 삼켜도 드러나게). 회귀 테스트가 일부러 '연결 안 됨' 을 만드는 경우는 등록된 흉내로 처리해 기록되지 않는다.
- 조건 조절 fixture (회귀 테스트용): Anthropic 키 있음/없음(없음이면 `settings`·환경 변수·사본 `config.json` 모두 빈 값), OpenAI 키 있음/없음(있음이면 흉내 OpenAI 등록), Ollama '연결 안 됨'(`ConnectError`)·'떠 있고 설정 모델 없음'(`/api/tags` 에 다른 모델, `/api/generate` 404 `{"error":"model '…' not found"}`)·'떠 있고 설정 모델 있음'(`/api/tags` 에 설정 모델, `/api/generate` 200, 스트림은 NDJSON).

이 기본 상태는 '이 앱은 Claude 를 쓴다' 는 정상 상태를 흉내 낸다. 그래서 키가 있어야 통과하던 테스트(3-tier 챗 2개, 챗 e2e 2개, `test_answer_question`)가 파일을 고치지 않고 모든 환경에서 같은 결과를 낸다 (근거 E3).

### 5. 회귀 테스트 (R10)
새 파일 `backend/tests/test_llm_provider_isolation.py` (이름은 plan 에서 정한다). Gemini 는 모든 행에서 키를 두고 `_call_gemini` 미호출을 단언한다.

| # | Anthropic 키 | OpenAI 키 | Ollama | `has_live_provider()` | `generate_live_answer` | `stream_tokens` |
|---|---|---|---|---|---|---|
| T1 | 있음 | 없음 | 연결 안 됨 | True, Ollama 탐침 0회 | 흉내 Claude 답, 모델 `claude-` | 같음 |
| T2 | 있음 | 없음 | 떠 있고 모델 있음 | True, 탐침 0회 | 흉내 Claude 답 (Ollama 생성 0회) | 같음 |
| T3 | 없음 | 없음 | 연결 안 됨 | False | `LLMProviderUnavailableException` | 같음 |
| T4 | 없음 | 없음 | 떠 있고 설정 모델 없음 | False | `LLMProviderUnavailableException` (지금은 `LLMUpstreamException`) | 같음 |
| T5 | 없음 | 없음 | 떠 있고 설정 모델 있음 | True | Ollama 답, 요청 `model` = 설정 모델 | 같음 |
| T6 | 없음 | 있음 | 연결 안 됨 | True | 흉내 OpenAI 답 | (OpenAI 스트림 흉내는 plan 에서 정함) |
| T7 | 없음 | 없음 (`settings`·환경 변수·사본 `config.json` 모두 빈 값) | `settings` 주소는 빈 값, 사본 `config.json` 의 `ollama_base_url` 에 흉내 Ollama 주소, 떠 있고 모델 있음 | True (`config.json` 보충 유지, R1) | Ollama 답, 요청이 `config.json` 주소로 감 | 같음 |
| T7b | 없음 | 덮어쓰기 `openai_key = ""` (`settings`·환경 변수·사본 `config.json` 에는 OpenAI 키 있음) | 덮어쓰기 `ollama_url = ""` (`settings`·사본 `config.json` 에 흉내 Ollama 주소, 모델 있음) | False | `LLMProviderUnavailableException` | 같음 |
| T8 | 없음 | 없음 | 설정 `llama3.2`, 설치 `llama3.2:latest` | True | Ollama 답 | — |

API 수준:
- T4 조건에서 `POST /api/chat/stream`, `POST /api/chat/query` → 503, `error_code` `ERR_LLM_PROVIDER_UNAVAILABLE` (R4).
- 덮어쓰기: `llm_processor.ollama_url = ""` 이면 `settings`·`config.json` 에 주소가 있어도 Ollama 갈래를 쓰지 않는다. `None` 이면 `settings` → `config.json` 순서를 따른다 (T7·T7b).
- 가드: 기본 상태에서 `httpx` 로 `http://localhost:11434/api/tags` 를 부르면 실제 요청 없이 기록된다.

### 6. 확인 조건 (R7, R9)
backend 전체를 다음 조건으로 각각 돌린다. 모두 명령 줄 환경 변수만 바꾼다. 빈 값으로 준 환경 변수는 `load_dotenv(override=False)` 와 pydantic-settings 가 `.env` 보다 앞세우므로 '키 없음' 이 된다 (근거 E8). '연결 안 됨' 은 닫힌 포트를 가리키게 하고, '모델 있음' 은 이 맥에 이미 설치된 모델 이름(`curl -s localhost:11434/api/tags` 로 확인, 2026-11-07 기준 `gpt-oss:20b`)을 설정 모델로 준다. Ollama 를 끄거나 모델을 설치·삭제하거나 `.env` 를 고치지 않는다.

| 조건 | LLM 키 | Ollama | 명령 (backend 폴더) |
|---|---|---|---|
| C1 | 있음 (`.env` 그대로) | 실제: 떠 있음, 설정 모델 없음 | `../.venv/bin/pytest tests/` 그리고 루트에서 `make check` |
| C2 | 있음 | 연결 안 됨 | `OLLAMA_BASE_URL=http://127.0.0.1:9 ../.venv/bin/pytest tests/` |
| C3 | 있음 | 떠 있고 설정 모델 있음 | `OLLAMA_MODEL=<설치된 모델> ../.venv/bin/pytest tests/` |
| C4 | 없음 | 연결 안 됨 | `ANTHROPIC_API_KEY= OPENAI_API_KEY= OLLAMA_BASE_URL=http://127.0.0.1:9 ../.venv/bin/pytest tests/` |
| C5 | 없음 | 떠 있고 설정 모델 있음 | `ANTHROPIC_API_KEY= OPENAI_API_KEY= OLLAMA_MODEL=<설치된 모델> ../.venv/bin/pytest tests/` |
| C6 | OpenAI 키만 있음 (다른 맥 상황) | 실제 | `ANTHROPIC_API_KEY= OPENAI_API_KEY=sk-test-dummy ../.venv/bin/pytest tests/` |

각 실행 뒤 `git status --porcelain -- config.json sources.json backend/app/config/sources.json` 가 비어 있어야 한다. 실행 전에 이 세 파일에 이미 변경이 있으면 verify 는 먼저 그 사실을 적고 되돌린 뒤 시작한다.

### 7. 바뀌는 통합·상세 문서 (구현 뒤 `/implement-plan` 이 반영)
- `docs/tech-spec.md` '공통 규칙' 의 '외부 연동' (Ollama 가용 기준 = `/api/tags` 200 + 설정 모델 설치), '변경 이력'. '설정' 문장은 바뀌지 않는다 (원천 순서 유지).
- `docs/operations.md` '설정 우선순위' 의 호출 시점 `config.json` 재읽기 문장(`:131`)은 동작이 그대로이고 근거 줄 번호만 해석 함수로 바꾼다. Settings 필드 표의 `OPENAI_API_KEY`·`OPENAI_MODEL`·`OLLAMA_*` 사용 위치, 외부 의존 표의 Ollama 행, 문제 해결 표의 503 행 (설정 모델 미설치 추가, 확인 명령 `curl $OLLAMA_BASE_URL/api/tags` 에서 모델 이름 확인).
- `docs/functional-spec/02-ai-chat.md:381` 의 사전 가용성 서술, `03-collection.md` 의 평가 가용성 서술.
- `docs/api.md:271, 292` 의 503 설명 ('쓸 수 있는 LLM 키·Ollama 가 없음' → Ollama 설정 모델 미설치 포함).
- `docs/test-strategy.md` '외부 호출과 파일 부작용' (LLM 호출은 흉내, 설정 파일은 임시 사본, 남은 외부 호출), 테스트 수, 'DB 격리' 옆에 LLM·설정 파일 격리.
- `docs/test-cases.md` 새 테스트 행, `test_anti_gemini_isolation_in_generate_live_answer` 행의 '로컬 Ollama 탐침 가능' 비고 삭제.
- `docs/known-issues.md` '테스트·운영' 의 두 행 삭제: '테스트가 git 이 추적하는 … `config.json`, `sources.json` 과 `backend/app/config/sources.json` 을 고친다', '수집 게이트와 Ask AI 는 테스트 환경 판정을 보지 않아, 키가 있으면 pytest 중에도 실제 LLM 을 부른다' (pytest 중 LLM 호출은 하네스가 흉내로 막는다. 제품 코드의 `is_test_environment` 분기는 늘리지 않는다).
- 루트 `CLAUDE.md` '명령' 절의 "`make check` 는 `.env` 의 LLM 키로 외부 호출을 하고, backend 테스트가 … 고친다" 문장은 구현 뒤 사실과 달라진다. 이 파일은 메인 세션이 고친다.
- `docs/product.md` 는 바꾸지 않는다: 제품 범위·사용자·원칙·기능 목록이 바뀌지 않는다 (대체 프로바이더 유지, 오류 계약 유지).

### 8. 바뀌는 파일 요약 (planner 용)
- 고침: `backend/app/services/llm_processor.py`, `backend/app/services/sources_service.py`, `backend/tests/conftest.py`
- 새로 만듦: `backend/tests/test_llm_provider_isolation.py` (와 필요하면 `backend/tests/` 아래 흉내 도움 모듈)
- 바꾸지 않음: `backend/app/services/llm_providers/anthropic_provider.py`, `backend/app/config.py`, `backend/app/api/chat.py`, `backend/app/schemas/**`, 기존 테스트 파일, `frontend/**`, 루트 `config.json`·`sources.json`·`backend/app/config/sources.json`

## 우려 사항
| 우려 | 관련 정책 | 정책 소유자 | 해결 |
|---|---|---|---|
| 1. `make check` 가 실제 Claude API 를 부르지 않게 되어, 실제 API 형식 변경·키 만료·요금 한도 문제를 검사에서 잡지 못한다 | intent 기대 결과 1 (Claude 호출 성공 유지) 과 기대 결과 3 (실행 환경과 무관한 통과) 의 상충 | 코드 오너 (본인) | 부분 해결: R11 실제 키 스모크를 verify 에서 돌린다. 정기 실행 장치(마커, 별도 명령)는 두지 않는다 (최소 변경). 필요하면 별도 intent |
| 2. 흉내 Claude 의 고정 답이 기존 단언(예: `test_answer_question` 의 `len(ans) > 20`)을 만족하는지는 흉내 내용에 달려 있어, '테스트 환경을 고쳐 통과시킨다' 로 볼 여지가 있다 | 저장소 규칙 '테스트를 고쳐 통과시키지 않는다. 코드를 고친다' | 엔지니어·코드 오너 (본인) | 부분 해결: 우려 3 의 결정으로 실행 중 `config.json` 보충이 남아, 실패하던 두 anti-gemini 테스트도 코드 변경이 아니라 하네스(환경 변수 제거, LLM 키·Ollama 주소를 비운 `config.json` 사본)로 통과한다 (설계 1절). 코드 변경만으로 환경과 무관해지는 것은 `test_stream_tokens_fails_fast_without_mock_fallback`(덮어쓰기 규칙)과 원인 2(R2) 다. 테스트 파일과 단언은 바꾸지 않는다 (R8). 하네스는 '테스트는 실행 환경의 설정 원천을 읽지 않는다' 는 격리만 하고, 흉내 응답은 Anthropic 응답 형식을 따르며 단언을 겨냥한 값을 넣지 않는다. 리뷰에서 확인 |
| 3. (첫 초안) OpenAI·Ollama 설정을 `settings` 하나에서만 읽으면 '`settings` 가 빈 값일 때 호출 시점에 `config.json`·`os.environ` 을 다시 읽는' 경로가 사라진다. 실행 중 `config.json` 을 손으로 고친 값이 재시작 전까지 반영되지 않고, `OLLAMA_BASE_URL=""` 로 끈 Ollama 가 `config.json` 값으로 되살아나던 동작도 사라진다 | intent 제약 '설정 우선순위는 그대로' (`operations.md` '설정 우선순위') | 서비스 오너 (본인) | 해결 — 메인 세션 결정 (자동 승인자, 2026-11-07): 대안 채택. 이유: 사용자 목표는 LLM 호출이 제대로 되고 `make check` 가 환경과 무관하게 통과하는 것이고, 실행 중 설정 반영 동작을 바꾸는 것은 목표 밖의 동작 변경이다. 반영: 해석 함수가 지금 원천 순서(`settings` → `config.json` → …)를 그대로 지키고, 테스트는 하네스의 임시 `config.json` 사본에 기댄다 (R1, 설계 1·4절). 남는 동작 차이는 `settings` 가 빈 값일 때의 `_call_ollama` 주소 원천과 `stream_tokens` Ollama 모델 마지막 기본값 두 가지다 (설계 1절) |
| 4. LLM 이 아닌 외부 호출(github.com 등 스크래퍼, api.notion.com, SMTP)은 그대로라 `make check` 결과가 네트워크 상태에는 여전히 영향받을 수 있다 | intent 기대 결과 3 의 '실행 환경' 정의 (Ollama·모델·키) 밖 | 코드 오너 (본인) | 범위 밖. `docs/test-strategy.md` 에 남은 외부 호출로 적는다 |
| 5. 모든 프로바이더가 여러 원천(`settings`·`os.environ`·`config.json`)을 실행 중 읽는 구조는 그대로다. 해석 함수로 모으는 것은 OpenAI·Ollama 뿐이고, Anthropic 키(`_get_api_key`)와 Gemini 키 해석은 손대지 않는다. 그래서 테스트 격리는 하네스가 원천 세 곳(환경 변수, `settings`, `config.json` 사본)을 모두 비워야 성립한다. 하네스 밖에서 새 테스트가 원천 하나라도 놓치면 실행 환경이 다시 새어 들어온다 | 결정 기준 'Claude 경로 동작 불변', POL-LLM-005, 우려 3 의 결정 | 제품·코드 오너 (본인) | 수용: autouse fixture 라 모든 테스트에 걸리고, 가드(R6)가 흉내 없는 LLM 요청을 테스트 실패로 드러낸다 |
| 6. OpenAI 판정은 키가 있는지만 본다. 잘못된 OpenAI 키만 있는 환경은 여전히 502 `ERR_LLM_UPSTREAM_FAILED` 다 | intent 기대 결과 2 ('실제 호출이 불가능한 경우도 쓸 수 없음') | 제품 오너 (본인) | 미해결 (범위 밖): 키 유효성은 실제 호출 없이 알 수 없고, 판정마다 호출하면 R12 를 어긴다. intent 의 예시(Ollama 모델 미설치)만 고친다 |
| 7. Ollama 판정은 `/api/tags` 의 이름 비교라, 같은 모델을 다른 이름(별칭·digest)으로 설정하면 '쓸 수 없음' 으로 판정할 수 있다 | — | 엔지니어 (본인) | 수용: 이름 비교 규칙(태그 생략 시 `:latest`)을 operations.md 에 적는다 |

## 근거
- E1 결정 기준 '변경 최소, Claude 경로 동작 불변', 열린 질문 4·5·6 은 목표에 꼭 필요할 때만 범위에 넣음 — 이 spec 작성 지시 (2026-11-07, 사용자 목표의 원문 취지), intent '제약'.
- E2 실패 원인은 `has_live_provider`·`stream_tokens` 의 `config.json` 재읽기, `_call_ollama` 의 생성 시점 저장값, `os.environ` 재읽기 — intent '원인 1' (`llm_processor.py:181-186, 213, 254-267, 437`), intent 의 원천별 차단 실험 표.
- E3 환경에 따라 결과가 바뀌는 8개 테스트와 그 이유, 키가 있고 Ollama 가 연결 안 되면 160 통과 — intent '환경에 따라 결과가 바뀌는 테스트' 표. 기본 상태를 '흉내 Claude 사용 가능' 으로 고른 근거: 160 통과한 조건과 같은 상태라 기존 테스트 파일을 고치지 않아도 된다.
- E4 '`None` 이면 설정, 값이면 그 값' 덮어쓰기 규칙 — 기존 코드 `AnthropicLLMProvider.__init__`·`_get_api_key` (`anthropic_provider.py:139-159`).
- E5 Ollama 모델 이름 `model:tag`, 태그 생략 시 `latest`, `GET /api/tags` 응답의 `models[].name`·`model` — Ollama API 문서 `https://raw.githubusercontent.com/ollama/ollama/main/docs/api.md` (2026-11-07 조회). 설정 모델 미설치 시 `/api/generate` 404 `model '…' not found` — intent '원인 2' 의 직접 호출 결과.
- E6 `load_json_config`·`save_json_config` 가 모듈 전역 `find_config_json` 을 호출 때마다 찾는다, `save_sources` 의 고정 거울 경로 — `backend/app/config.py:14-35, 161-173`, `backend/app/services/sources_service.py:101-122`.
- E7 흉내 Claude 응답 형식 — `backend/tests/test_anthropic_provider.py:84-97, 135-148` 의 기존 흉내, `anthropic_provider.py:233-319` 의 파싱 코드.
- E8 빈 환경 변수가 `.env` 보다 앞선다 — `docs/operations.md` '설정 우선순위' 1·2 (`load_dotenv(override=False)`), `config.py:108-130` 의 보충은 `config.json` 과 `os.environ` 만 본다 (사본이 아닌 실제 실행에서는 루트 `config.json` 의 키가 비어 있음, 2026-11-07 확인).
- E9 기존 테스트가 `httpx.AsyncClient.post`·`.stream` 을 직접 patch 하고 앱은 `ASGITransport` 로 부른다 → 전송 계층 가로채기와 겹치지 않음 — `test_anthropic_provider.py:105, 165, 230`, `test_dynamic_rag_retrieval.py:198-237`. 실제 동작은 구현 때 확인한다 (가정).
- E10 Ollama 생성 모델 기본값을 `llama3.2:latest` 로 — `config.py:62`, 루트 `config.json` `llm.ollama_model`, `.env` 의 `OLLAMA_MODEL` 이 모두 이 값 (intent '원인 2'). `qwen2.5:latest` 는 `stream_tokens` 의 마지막 기본값에만 있다 (`llm_processor.py:439`).
- E11 실행 중 `config.json` 보충을 유지하고 테스트는 하네스 사본에 기댄다 — 메인 세션(자동 승인자) 결정 (2026-11-07, 우려 3). 지금 원천 순서 — `llm_processor.py:181-193, 213-216, 257-267, 330-336, 402-413, 437-439, 884-894`.

## 넘겨받은 열린 질문
1. 테스트가 실행 환경 대신 쓸 설정 원천을 어떻게 주입하는가, 싱글턴 저장값은 어떻게 다루는가 — 하네스가 주입한다. `conftest.py` autouse fixture 가 환경 변수 제거, `settings` 고정, LLM 키·Ollama 주소를 비운 `config.json` 사본, LLM 전송 계층 흉내를 준다 (설계 4절). 코드의 원천 순서와 실행 중 `config.json` 보충은 그대로 둔다 (우려 3 의 메인 세션 결정, E11). 싱글턴의 `openai_key`·`ollama_url` 은 생성 시점 복사본이 아니라 '명시 덮어쓰기' 자리(`None` = 원천 순서를 따름, 문자열 = 그 값만)로 바꾼다 (설계 1절). 환경 변수로 주입하는 안은 `.env` 를 import 때 읽는 구조(`config.py:8-10`)라 테스트 중 바꾸기 어렵고, 설정 원천을 새 모듈로 모으는 안은 Claude 경로와 실행 중 설정 동작까지 바꿔 기준에 어긋나 고르지 않았다 (E1, E2).
2. 키·URL 해석을 한 함수로 모을 것인가 — OpenAI 키·OpenAI 모델·Ollama 주소·Ollama 모델만 `LLMProcessor` 의 해석 함수로 모으고, 원천 순서는 지금 코드 그대로 둔다. 모으는 이유는 같은 값을 여러 곳에서 다른 순서·기본값으로 읽던 차이(`_call_ollama` 의 생성 시점 복사본, `stream_tokens` 의 `qwen2.5:latest`)를 없애고 R2 판정과 생성이 같은 모델을 보게 하려는 것이다. Anthropic(`_get_api_key`)과 Gemini 는 그대로 둔다: Claude 경로 불변 기준, POL-LLM-005 경로 불변 (우려 5).
3. 대체 프로바이더 판정 기준, 대체 경로 유지 여부 — 대체 경로(OpenAI → Ollama)는 유지한다 (제품 범위를 바꾸지 않음). OpenAI 는 키가 있으면 쓸 수 있음 (지금과 같음, 원천만 `settings`). Ollama 는 `/api/tags` 200 이고 설정 모델이 설치돼 있으면 쓸 수 있음 (설계 2절, E5). 키 유효성 판정은 하지 않는다 (우려 6).
4. 키가 있을 때 실제 Claude API 를 부르는 테스트 — 테스트 파일은 그대로 두고, 하네스가 전송 계층에서 Claude 응답을 흉내 낸다. 별도 마커·명령은 만들지 않는다. 실제 Claude 확인은 verify 의 스모크(R11)로 한다. 목표('실행 환경과 무관한 통과')에 꼭 필요해서 넣었다: 이 테스트들은 키 유무에 따라 결과가 바뀐다 (E3). `docs/known-issues.md` 의 '수집 게이트와 Ask AI 는 … pytest 중에도 실제 LLM 을 부른다' 행은 같은 하네스로 해결되어 구현 뒤 지운다.
5. git 추적 설정 파일 수정 — 범위에 넣는다. intent 기대 결과와 이 작업의 확인 기준이 'make check 뒤 git status 에 설정 파일 변경 없음' 을 요구하고, `config.json` 은 LLM 설정 원천이라 원인 1 과 뿌리가 같다. 실행 중 `config.json` 보충을 남기기로 했으므로 (우려 3) `config.json` 사본은 LLM 격리에도 꼭 필요하다. 최소 변경: `config.json` 은 fixture 가 `find_config_json` 을 돌리고, `sources.json` 은 거울 경로를 인스턴스 속성으로 바꾸는 한 곳만 코드를 고친다 (설계 3절).
6. Ollama 생성 모델 기본값 — 해석 함수 하나(`settings.OLLAMA_MODEL` → `config.json` `llm.ollama_model` → `llama3.2:latest`)로 맞춘다 (E10). 판정과 생성이 같은 모델을 봐야 원인 2 를 고칠 수 있어 범위에 넣었다.
7. 503 메시지에 원인을 어디까지 보여줄 것인가 — 응답 본문은 바꾸지 않는다 (앱 간 계약과 프론트 표시 불변). 원인은 서버 로그에만 남긴다 (설계 2절). 설정 상세(주소·모델 이름)를 클라이언트에 노출하지 않는 효과도 있다.
