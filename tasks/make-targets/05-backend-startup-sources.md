# Task 05: 빈 DB 첫 수집 백그라운드화와 소스 저장 대체 경로, T7·T8

Feature: make-targets · Plan: docs/features/make-targets/plan.md 작업 순서 5
Status: done
Session: main (implementer D)
Agent: aa92bf5398361c596
Updated: 2026-11-08

## 한 일
- 단계 1 판정(EBUSY 가 (c)·(d) 둘 다 재현)에 따라 소스 저장 대체 경로와 T8 까지 진행했다.
- (a) T7 `backend/tests/test_startup_seed.py`: `app.main` 의 `start_scheduler`·`stop_scheduler`·`ensure_db_schema`·`AsyncSessionLocal`·`engine` 을 바꿔 넣고, `tmp_path` 의 별도 SQLite(0건 / 1건)로 lifespan 을 시험한다. 빈 DB: 오래 걸리는 `collect_all` 흉내(30초 sleep, 취소 기록) → `asyncio.timeout(1.0)` 안에 lifespan 진입, `/health` 200·`running` True, 빠져나온 뒤 취소됨·`is_running` False. 기사 있음: `collect_all` `AsyncMock` 이 불리지 않음. `collector_manager.is_running` 은 monkeypatch 로 원복된다.
- (b) T8 `backend/tests/test_sources_write_fallback.py`: `pathlib.Path.replace` 를 EBUSY `OSError` 로 바꾼 경우 `save_sources` True·파일 내용 = 넘긴 값·`sources.tmp` 없음. 감시 함수로 바꾼 일반 경우 rename 1회·같은 결과. 세션 사본(`llm_isolation`)에 쓴다.
- 실패 확인 후 테스트만 커밋 (`49e6b1a`).
- (c) `backend/app/main.py`: 개수만 세고 세션을 닫은 뒤 0건이면 `[AgentLens] Initial database seed collection (백그라운드로)...` 출력과 `asyncio.create_task(collector_manager.collect_all())` (session 인자 없음). `add_done_callback` 으로 취소 아닌 예외를 한 줄 출력. `yield` 뒤 끝나지 않은 태스크를 `cancel()` 하고 `CancelledError` 를 삼켜 기다린 다음 기존대로 `stop_scheduler()`, `engine.dispose()`. `/health` 는 그대로.
- (d) `backend/app/services/sources_service.py`: `save_sources` 의 `temp_path.replace(p)` 를 `try` 로 감싸 `OSError` 면 한국어 `logger.warning` 한 줄, 임시 파일 내용을 대상 파일에 `open(p, "w")` 로 제자리 쓰기, `temp_path.unlink(missing_ok=True)`. 거울 쓰기·반환값 규칙은 그대로. `toggle_source` 반환값 결함은 고치지 않았다.
- 코드 커밋 (`0a2e714`).

## 바꾼 파일
- `backend/tests/test_startup_seed.py` (새)
- `backend/tests/test_sources_write_fallback.py` (새)
- `backend/app/main.py`
- `backend/app/services/sources_service.py`

## 검사 결과
### 고치기 전 (테스트만 있을 때)
`cd backend && ../.venv/bin/pytest -v tests/test_startup_seed.py tests/test_sources_write_fallback.py`
```
E               TimeoutError
/Library/Frameworks/Python.framework/Versions/3.11/lib/python3.11/asyncio/timeouts.py:115: TimeoutError
----------------------------- Captured stdout call -----------------------------
[AgentLens] Initial database seed collection...
...
>       assert sources_service.save_sources(data) is True
E       AssertionError: assert False is True
...
ERROR    agentlens.sources:sources_service.py:122 Failed to write sources to /private/var/folders/.../settings_files0/sources.json: [Errno 16] Device or resource busy
=========================== short test summary info ============================
FAILED tests/test_startup_seed.py::test_empty_db_seed_runs_in_background_and_is_cancelled_on_shutdown
FAILED tests/test_sources_write_fallback.py::test_save_sources_falls_back_to_in_place_write_on_ebusy
========================= 2 failed, 2 passed in 1.30s ==========================
```
- 실패 이유가 기대한 결함과 같다: 빈 DB 는 lifespan 이 `collect_all` 을 await 해서 1초 안에 못 들어감(`TimeoutError`), EBUSY 는 `save_sources` 가 예외를 잡고 False. 기사 있음·일반 rename 경우는 고치기 전에도 통과 (회귀 보호).

### 고친 뒤 (plan 끝 기준 명령)
`cd backend && ../.venv/bin/pytest -v tests/test_startup_seed.py tests/test_sources_write_fallback.py tests/test_reset_and_delete.py tests/test_sources_and_research.py`
```
tests/test_startup_seed.py::test_empty_db_seed_runs_in_background_and_is_cancelled_on_shutdown PASSED [  8%]
tests/test_startup_seed.py::test_db_with_items_does_not_seed PASSED      [ 16%]
tests/test_sources_write_fallback.py::test_save_sources_falls_back_to_in_place_write_on_ebusy PASSED [ 25%]
tests/test_sources_write_fallback.py::test_save_sources_uses_atomic_replace_normally PASSED [ 33%]
tests/test_reset_and_delete.py::test_reset_and_collect_endpoint PASSED   [ 41%]
tests/test_reset_and_delete.py::test_delete_all_news_endpoint PASSED     [ 50%]
tests/test_sources_and_research.py::test_sources_service_load PASSED     [ 58%]
tests/test_sources_and_research.py::test_sources_service_active_feeds PASSED [ 66%]
tests/test_sources_and_research.py::test_sources_toggle_and_crud PASSED  [ 75%]
tests/test_sources_and_research.py::test_source_researcher_discover PASSED [ 83%]
tests/test_sources_and_research.py::test_source_researcher_inspect_url PASSED [ 91%]
tests/test_sources_and_research.py::test_sources_and_research_api_endpoints PASSED [100%]

============================== 12 passed in 0.88s ==============================
```
- 추가 회귀: `../.venv/bin/pytest -q tests/test_api.py` → `9 passed in 0.24s`. 기존 테스트 중 lifespan 에 들어가는 것(`with TestClient`, `lifespan`)은 없다 (grep 결과 없음).
- `git status --porcelain` (pytest 뒤): 이 단계 파일과 다른 단계 파일(`tasks/…`, `backend/tests/test_make_targets.py`·`test_collect_script.py`)·기존 untracked 만. `config.json`, `sources.json`, `backend/app/config/sources.json` 변경 없음.
- 전체 `make check` 는 plan 대로 단계 6 에서 돌린다.

## 결정
- T7 은 plan 대로 `app.main` 의 기존 이름만 바꿔 넣었다 (새 도움 함수 없음). 고치기 전 코드의 `collect_all(session=s)` 호출에서 `TypeError` 가 나지 않게 흉내는 `*args, **kwargs` 를 받는다 → 실패 이유가 `TimeoutError` 로 나온다.
- 첫 수집 태스크 예외 로그는 기존 시작 로그와 같은 `print` 형식으로 남겼다 (main.py 에 logger 가 없음).
- 제자리 쓰기가 다시 실패하면 바깥 `except` 가 지금처럼 `logger.error` 후 False 를 돌려준다 (반환값 규칙 유지).

## 막힌 점
- 없음.

## 다음
- 단계 6 (통합 실행 확인): Docker 에서 소스 토글 뒤 `/app/sources.json` 내용 변화와 경고 로그(`sources.json 원자적 교체 실패, 제자리 쓰기로 저장한다`), `/app/sources.tmp` 부재를 확인한다. 빈 DB 볼륨에서 `docker-up` 이 첫 수집을 기다리지 않고 healthy 가 되는지 확인한다.
- 단계 7: `docs/tech-spec.md` '데이터'(소스 저장 제자리 쓰기)·'공통 규칙'(빈 DB 첫 수집 백그라운드), `docs/test-cases.md` 에 T7·T8 추가.
- 이 task 기록은 메인 세션이 커밋한다.
