# Task 04: scripts/collect.py 와 회귀 테스트 T6

Feature: make-targets · Plan: docs/features/make-targets/plan.md 작업 순서 4
Status: done
Session: main (implementer C)
Agent: acac307fe284db908
Updated: 2026-11-08

## 한 일
- (a) 테스트 먼저: `backend/tests/test_collect_script.py` 에 T6 (a)~(e) 5개를 썼다. 스크립트는 `importlib.util.spec_from_file_location` 으로 불러오고, `main()` 은 `ThreadPoolExecutor(1)` 작업 스레드에서 돌린다. 스텁 서버는 `ThreadingHTTPServer(("127.0.0.1", 0))` 데몬 스레드이고 `/health`, `GET /api/schedule/progress`, `POST /api/schedule/trigger` 외에는 404 를 내며 받은 경로를 남긴다. 스텁을 쓰는 세 경우 (a)(b)(c) 는 받은 경로에 `reset-and-collect` 가 없음을 단언한다.
- 실패 확인 (스크립트 없음): `cd backend && ../.venv/bin/pytest -v tests/test_collect_script.py` → `5 errors in 0.06s`. 다섯 개 모두 fixture `mod` 에서 `FileNotFoundError: /Users/wonyoung/workspace/ozplayground/agentlens/scripts/collect.py` (기대한 이유).
  - ERROR `test_auto_api_mode_success`, `test_api_mode_error_finish`, `test_api_mode_timeout`, `test_auto_direct_mode`, `test_api_mode_without_backend`
- 테스트만 커밋: `bc0f699`.
- (b) `scripts/collect.py` 를 plan 의 인터페이스대로 썼다: `main(env=None) -> int`, `POLL_INTERVAL = 2.0`, `HEALTH_TIMEOUT = 2.0`, urllib 만 사용, 모드 선택 (`auto`/`api`/`direct`, 그 밖은 메시지와 1), 첫 줄 `API 모드: <URL>` / `직접 모드: <DB 절대 경로>`, API 모드의 `last_crawl_time` 판정·타임아웃·HTTP 오류 1, 직접 모드의 `database.ensure_db_schema()` → `manager.collector_manager.collect_all()` (모듈 속성 호출, `asyncio.run`), 소스별 줄과 "실패한 소스: …", 모든 소스 실패 시 "모든 소스가 실패했다 (네트워크 확인)" 와 1. `reset-and-collect` 는 부르지 않는다.
- 코드 커밋: `acd35b0`. 테스트 커밋 뒤 `git diff bc0f699 -- backend/tests/test_collect_script.py` 출력 0줄 (단언 불변).
- (c) 실행 확인 (실제 수집·서버 실행 없음).

## 바꾼 파일
- `backend/tests/test_collect_script.py` (새, 커밋 `bc0f699`)
- `scripts/collect.py` (새, 커밋 `acd35b0`)

## 검사 결과
- `cd backend && ../.venv/bin/pytest -v tests/test_collect_script.py`
  ```
  tests/test_collect_script.py::test_auto_api_mode_success PASSED          [ 20%]
  tests/test_collect_script.py::test_api_mode_error_finish PASSED          [ 40%]
  tests/test_collect_script.py::test_api_mode_timeout PASSED               [ 60%]
  tests/test_collect_script.py::test_auto_direct_mode PASSED               [ 80%]
  tests/test_collect_script.py::test_api_mode_without_backend PASSED       [100%]

  ============================== 5 passed in 2.77s ===============================
  ```
- `cd backend && COLLECT_MODE=api AGENTLENS_API_URL=http://127.0.0.1:9 PYTHONPATH=. ../.venv/bin/python ../scripts/collect.py; echo exit=$?`
  ```
  make collect: http://127.0.0.1:9 에 backend 가 없다
  exit=1
  ```
- 추가 확인: `COLLECT_MODE=bogus` → "COLLECT_MODE 는 auto, api, direct 중 하나여야 한다: bogus", exit=1. `COLLECT_TIMEOUT=abc` → "COLLECT_TIMEOUT 은 정수 초여야 한다: abc", exit=1. `python -m py_compile scripts/collect.py` 종료 0 (T3 가 기대). `DATABASE_URL=sqlite+aiosqlite:///./x.db` 로 `_db_path_text()` → `/Users/wonyoung/workspace/ozplayground/agentlens/backend/x.db` (cwd 기준 절대 경로, 파일은 만들어지지 않음).
- pytest 뒤 `git status --porcelain`: `config.json`, `sources.json`, `backend/app/config/sources.json` 변경 없음. 보인 변경은 다른 단계(2·3·5)의 파일뿐. `py_compile` 이 만든 `scripts/__pycache__` (gitignore 대상)는 지웠다.

## 결정
- 테스트를 커밋하기 전에 초안 스크립트로 5개가 통과하는지 먼저 확인했다 (커밋한 단언을 뒤에서 바꿀 수 없어서 테스트 자체의 오류를 미리 거르려고). 실패 확인은 스크립트가 없을 때 했고, 커밋 순서는 테스트(`bc0f699`) → 코드(`acd35b0`).
- API 모드에서 폴링 요청 한 번의 제한 시간은 `REQUEST_TIMEOUT = 10.0` (모듈 상수). 폴링 대기는 `min(POLL_INTERVAL, 남은 시간)` 이라 `COLLECT_TIMEOUT` 을 넘기지 않는다.
- trigger 가 `already_running` 이면 "이미 진행 중인 수집이 있다…" 한 줄을 내고 같은 방식으로 기다린다.
- 직접 모드에서 `source_results` 가 비어 있으면 "모든 소스가 실패했다" 와 같이 1 로 끝낸다 (돈 소스가 없으면 성공으로 볼 수 없다). 성공이면 `total_collected`·`total_saved` 를 한 줄 더 낸다.
- `COLLECT_TIMEOUT` 이 0 이하면 메시지와 1 (plan 에 없는 입력 검사, 인터페이스는 그대로).
- backend 의 `step_message` 에는 이모지가 들어 있다 (`manager.py` 의 "⚡️ … 수집 중" 등). 스크립트 자신의 문구에는 이모지를 쓰지 않았고, backend 가 준 `step_message` 는 그대로 옮겨 출력한다 (데이터를 바꾸지 않음).
- 알려진 한계 (spec 판정 규칙 그대로 둠): trigger 뒤 첫 폴링 전에 수집이 오류로 끝나 `is_running == true` 를 한 번도 보지 못하면 `COLLECT_TIMEOUT` 까지 기다린 뒤 1 로 끝난다.

## 막힌 점
- 없음.

## 다음
- 단계 6 (통합 실행 확인, V5) 에서 실제 `make collect` 의 직접·API 모드를 DB 사본으로 확인한다. 이 단계의 남은 일 없음.
