# Task 02: 테스트 하네스와 sources 거울 경로

Feature: backend-llm-test-isolation · Plan: docs/features/backend-llm-test-isolation/plan.md 작업 순서 02
Status: done
Session: main
Agent: aa1bf34d8feb5e21c (implementer)
Updated: 2026-11-08

## 한 일
- `backend/app/services/sources_service.py`: `SourcesService.__init__` 에 `self._mirror_path = Path(__file__).resolve().parent.parent / "config" / "sources.json"` (기존 `fallback` 과 같은 값), `save_sources` 는 `fallback = self._mirror_path`. 나머지 줄(`if fallback != p`, 예외 무시)은 그대로. 실제 실행 동작은 같다.
- `backend/tests/conftest.py`:
  - 세션 fixture `settings_file_copies`: 세션 임시 폴더에 루트 `config.json` 사본(`llm` 절의 `anthropic_api_key`·`openai_api_key`·`gemini_api_key`·`ollama_base_url` 빈 값)과 `find_sources_file()` 이 찾은 루트 `sources.json` 사본. 원본은 읽기만 한다.
  - autouse fixture `llm_isolation` (기존 `init_db` 와 별개): `clear_llm_sources` (단계 1 과 같은 함수) → `settings.ANTHROPIC_API_KEY = "sk-ant-test-fake"`, `app.config.find_config_json` → 세션 사본, `app.config._json_data` → 세션 사본 내용, `Settings.model_config["env_file"]` → `None` (`monkeypatch.setitem`), `sources_service._file_path`·`_mirror_path` → 세션 사본 `sources.json`, `fake_llm` 설치, 정리 단계에서 `fake_llm.assert_no_unmocked()`.
  - `llm_sources` 는 `llm_isolation` 위에서 시작하게 의존을 바꿨다 (세션 사본에서 테스트별 `config.json` 사본을 만들고, `clear_llm_sources` 로 Anthropic 키까지 비움). 테스트 파일은 고치지 않았다.

## 바꾼 파일
- `backend/app/services/sources_service.py`
- `backend/tests/conftest.py`

## 검사 결과
관문 G1. `backend/` 에서 각 조건으로 `../.venv/bin/pytest tests/ -q -p no:cacheprovider`, 각 실행 뒤 루트에서 `git status --porcelain -- config.json sources.json backend/app/config/sources.json`. `<설치된 모델>` 은 실행 전 `curl -s localhost:11434/api/tags` 로 확인한 `gpt-oss:20b`.

```
=== C1:
exit=1
=========================== short test summary info ============================
FAILED tests/test_llm_provider_isolation.py::test_t4_missing_ollama_model_is_unavailable
FAILED tests/test_llm_provider_isolation.py::test_t5_installed_ollama_model_used[config_model]
FAILED tests/test_llm_provider_isolation.py::test_t7_ollama_url_from_config_json_when_settings_empty
FAILED tests/test_llm_provider_isolation.py::test_t7b_empty_overrides_disable_openai_and_ollama
FAILED tests/test_llm_provider_isolation.py::test_api_chat_stream_503_when_ollama_model_missing
FAILED tests/test_llm_provider_isolation.py::test_api_chat_query_503_when_ollama_model_missing
6 failed, 168 passed in 6.62s
git status:[]
=== C2: OLLAMA_BASE_URL=http://127.0.0.1:9
exit=1
=========================== short test summary info ============================
FAILED tests/test_llm_provider_isolation.py::test_t4_missing_ollama_model_is_unavailable
FAILED tests/test_llm_provider_isolation.py::test_t5_installed_ollama_model_used[config_model]
FAILED tests/test_llm_provider_isolation.py::test_t7_ollama_url_from_config_json_when_settings_empty
FAILED tests/test_llm_provider_isolation.py::test_t7b_empty_overrides_disable_openai_and_ollama
FAILED tests/test_llm_provider_isolation.py::test_api_chat_stream_503_when_ollama_model_missing
FAILED tests/test_llm_provider_isolation.py::test_api_chat_query_503_when_ollama_model_missing
6 failed, 168 passed in 6.35s
git status:[]
=== C3: OLLAMA_MODEL=gpt-oss:20b
exit=1
=========================== short test summary info ============================
FAILED tests/test_llm_provider_isolation.py::test_t4_missing_ollama_model_is_unavailable
FAILED tests/test_llm_provider_isolation.py::test_t5_installed_ollama_model_used[config_model]
FAILED tests/test_llm_provider_isolation.py::test_t7_ollama_url_from_config_json_when_settings_empty
FAILED tests/test_llm_provider_isolation.py::test_t7b_empty_overrides_disable_openai_and_ollama
FAILED tests/test_llm_provider_isolation.py::test_api_chat_stream_503_when_ollama_model_missing
FAILED tests/test_llm_provider_isolation.py::test_api_chat_query_503_when_ollama_model_missing
6 failed, 168 passed in 6.30s
git status:[]
=== C4: ANTHROPIC_API_KEY= OPENAI_API_KEY= OLLAMA_BASE_URL=http://127.0.0.1:9
exit=1
=========================== short test summary info ============================
FAILED tests/test_llm_provider_isolation.py::test_t4_missing_ollama_model_is_unavailable
FAILED tests/test_llm_provider_isolation.py::test_t5_installed_ollama_model_used[config_model]
FAILED tests/test_llm_provider_isolation.py::test_t7_ollama_url_from_config_json_when_settings_empty
FAILED tests/test_llm_provider_isolation.py::test_t7b_empty_overrides_disable_openai_and_ollama
FAILED tests/test_llm_provider_isolation.py::test_api_chat_stream_503_when_ollama_model_missing
FAILED tests/test_llm_provider_isolation.py::test_api_chat_query_503_when_ollama_model_missing
6 failed, 168 passed in 7.24s
git status:[]
=== C5: ANTHROPIC_API_KEY= OPENAI_API_KEY= OLLAMA_MODEL=gpt-oss:20b
exit=1
=========================== short test summary info ============================
FAILED tests/test_llm_provider_isolation.py::test_t4_missing_ollama_model_is_unavailable
FAILED tests/test_llm_provider_isolation.py::test_t5_installed_ollama_model_used[config_model]
FAILED tests/test_llm_provider_isolation.py::test_t7_ollama_url_from_config_json_when_settings_empty
FAILED tests/test_llm_provider_isolation.py::test_t7b_empty_overrides_disable_openai_and_ollama
FAILED tests/test_llm_provider_isolation.py::test_api_chat_stream_503_when_ollama_model_missing
FAILED tests/test_llm_provider_isolation.py::test_api_chat_query_503_when_ollama_model_missing
6 failed, 168 passed in 6.35s
git status:[]
=== C6: ANTHROPIC_API_KEY= OPENAI_API_KEY=sk-test-dummy
exit=1
=========================== short test summary info ============================
FAILED tests/test_llm_provider_isolation.py::test_t4_missing_ollama_model_is_unavailable
FAILED tests/test_llm_provider_isolation.py::test_t5_installed_ollama_model_used[config_model]
FAILED tests/test_llm_provider_isolation.py::test_t7_ollama_url_from_config_json_when_settings_empty
FAILED tests/test_llm_provider_isolation.py::test_t7b_empty_overrides_disable_openai_and_ollama
FAILED tests/test_llm_provider_isolation.py::test_api_chat_stream_503_when_ollama_model_missing
FAILED tests/test_llm_provider_isolation.py::test_api_chat_query_503_when_ollama_model_missing
6 failed, 168 passed in 6.28s
git status:[]
```
- 여섯 조건 모두 실패 6개가 단계 1 목록과 같다 (각 로그에서 `FAILED` 줄 6개를 확인, `test_llm_provider_isolation.py` 밖의 `FAILED`·`ERROR` 0). 기존 160개는 모든 조건에서 통과: 두 anti-gemini 테스트와 `test_stream_tokens_fails_fast_without_mock_fallback` 포함 (하네스로 통과하는 경로).
- 설정 파일 세 개 `git status` 출력이 여섯 번 모두 비어 있다. 되돌린 적 없음.
- 가드(teardown `assert_no_unmocked`)로 실패·오류가 난 기존 테스트 없음. 하네스에 흉내 등록을 더할 필요가 없었다.
- 실행 시간: 하네스 전 105.03s → 6~7s (실제 LLM·Ollama 호출이 흉내로 바뀜).

## 결정
- 세션 `sources.json` 사본의 원본은 `find_sources_file()` 이 찾은 파일 (backend 에서 돌리면 루트 `sources.json`).
- `_json_data` 는 매 테스트 시작 때 세션 사본을 다시 읽은 값으로 둔다. 앞 테스트가 `save_json_config` 로 사본을 고쳤으면 그 내용이 이어진다 (지금 실제 파일로 이어지던 것과 같은 모양).

## 막힌 점
- 없음.

## 다음
- 단계 3 (`03-llm-processor.md`): `llm_processor.py` 해석 함수 4개, Ollama 판정 함수, 판정 이유 로그. 끝에 G2 (증명 1~6).
