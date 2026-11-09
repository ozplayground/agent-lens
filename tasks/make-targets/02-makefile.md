# Task 02: Makefile·docker-compose 와 회귀 테스트 T1~T5

Feature: make-targets · Plan: docs/features/make-targets/plan.md 작업 순서 2
Status: done
Session: main (implementer A)
Agent: a590bd40f0795003d
Updated: 2026-11-08

## 한 일
- (a) 테스트 먼저: `backend/tests/test_make_targets.py` (T1~T5, 30개) 를 쓰고 고치기 전 Makefile·compose 로 돌려 실패를 확인했다. 테스트만 커밋 `39f2f68`.
- (b) `Makefile` 을 plan 2단계 (b) 대로 고쳤다: `SHELL := /bin/bash`, `.PHONY` 한 줄 12개, 변수 5개(`?=`)와 `export`, `setup`·`test`·`clean`·`collect`·`reset`·`docker-up`·`docker-logs` 레시피. `dev`·`build`·`check`·`docker-build`·`docker-down` 레시피는 그대로 (`check` 위 중복 `.PHONY: check` 줄만 머리의 한 줄로 합침).
- (c) `docker-compose.yml` 38행 `./config.json:/app/config.json:ro` → `:rw`. 다른 줄은 그대로.
- `make setup` 을 한 번 돌려 "이미 있음" 줄과 종료 0 을 확인했다.
- `reset` 레시피는 실행하지 않았다 (게이트, V6 은 사람 몫). 대신 레시피의 JSON 처리 부분을 scratchpad 스크립트(`step2/json_part.sh`)로 떼어 응답 네 가지로 흉내 실행했다 (아래).
## 바꾼 파일
- `backend/tests/test_make_targets.py` (새)
- `Makefile`
- `docker-compose.yml`
## 검사 결과
### 테스트 먼저 (고치기 전 Makefile·compose)
`cd backend && ../.venv/bin/pytest -v tests/test_make_targets.py` → 종료 1, `10 failed, 20 passed in 0.29s` (전체 로그: scratchpad `step2/pytest-red.log`).

실패 10개와 이유 (모두 기대한 결함):
- `test_t1_phony_targets_match_list` — `.PHONY` 가 `setup dev test build clean` + `check` 6개뿐 (spec E1).
- `test_t1_shell_is_bash` — `SHELL := /bin/bash` 줄 없음.
- `test_t2_test_target_equals_check` — `make -n test` stdout 이 `./scripts/test.sh` (없는 파일), `check` 와 다름.
- `test_t3_referenced_file_exists[scripts/dev.sh]`, `test_t3_referenced_file_exists[scripts/collect.py]`, `test_t3_dev_script_is_executable_and_parses`, `test_t3_collect_script_compiles` — `scripts/` 없음 (단계 3·4 몫).
- `test_t4_makefile_has_no_or_true` — `reset` 레시피의 `|| true`.
- `test_t4_compose_config_json_is_writable` — `./config.json:/app/config.json:ro`.
- `test_t5_reset_uses_api_url_variable` — `make -n reset AGENTLENS_API_URL=http://127.0.0.1:9` 출력이 `curl -s -X POST http://localhost:8000/api/schedule/reset-and-collect | python3 -m json.tool || true` (URL 하드코딩).

통과 20개: `test_t1_defined_targets_match_list` (12개 대상은 이미 정의돼 있고 `.PHONY` 만 빠짐), `test_t2_dry_run_executes_nothing`, `test_t2_make_dry_run_succeeds[*]` 12개 (spec E17 대로 지금도 종료 0), `test_t3_referenced_file_exists` 의 나머지 5개, `test_t4_compose_config_is_valid`.

`git status --porcelain` 뒤: 이 단계 밖 추적 파일 변경 없음 (`config.json`·`sources.json` 그대로).

### 고친 뒤
`cd backend && ../.venv/bin/pytest -v tests/test_make_targets.py` → 종료 0 (로그: scratchpad `step2/pytest-green.log`). 마지막 줄:
```
tests/test_make_targets.py::test_t3_referenced_file_exists[scripts/dev.sh] PASSED [ 60%]
tests/test_make_targets.py::test_t3_referenced_file_exists[scripts/collect.py] PASSED [ 63%]
tests/test_make_targets.py::test_t3_referenced_file_exists[docker-compose.yml] PASSED [ 66%]
tests/test_make_targets.py::test_t3_referenced_file_exists[backend/Dockerfile] PASSED [ 70%]
tests/test_make_targets.py::test_t3_referenced_file_exists[frontend/Dockerfile] PASSED [ 73%]
tests/test_make_targets.py::test_t3_referenced_file_exists[backend/requirements.txt] PASSED [ 76%]
tests/test_make_targets.py::test_t3_referenced_file_exists[frontend/pnpm-lock.yaml] PASSED [ 80%]
tests/test_make_targets.py::test_t3_dev_script_is_executable_and_parses PASSED [ 83%]
tests/test_make_targets.py::test_t3_collect_script_compiles PASSED       [ 86%]
tests/test_make_targets.py::test_t4_makefile_has_no_or_true PASSED       [ 90%]
tests/test_make_targets.py::test_t4_compose_config_json_is_writable PASSED [ 93%]
tests/test_make_targets.py::test_t4_compose_config_is_valid PASSED       [ 96%]
tests/test_make_targets.py::test_t5_reset_uses_api_url_variable PASSED   [100%]

============================== 30 passed in 0.27s ==============================
```
- T3 의 `scripts/*` 4개도 통과했다: 실행 시점에 단계 4 의 `scripts/collect.py` 는 커밋돼 있었고(`acd35b0`), 단계 3 의 `scripts/dev.sh` 는 작업 트리에 있었으나 아직 커밋 전이었다 (추적 안 됨, 실행 권한 있음). 단계 6 에서 커밋된 상태로 다시 확인한다.
- `git status --porcelain` 뒤: 이 단계 밖 추적 파일 변경 없음. 보인 다른 변경(`frontend/next.config.ts`, `scripts/dev.sh`, `tasks/…03·04·05`)은 병렬 단계 3·4·5 의 것이다.

### `make -n setup clean collect docker-up docker-logs` (종료 0, `step2/make-n.log`)
```
if [ -x .venv/bin/python ] && .venv/bin/python -c 'import sys; sys.exit(0 if sys.version_info[:2] == (3, 11) else 1)' 2>/dev/null; then \
		echo "==> .venv 이미 있음 (Python $(.venv/bin/python -c 'import platform; print(platform.python_version())'))"; \
	elif command -v uv >/dev/null 2>&1; then \
		echo "==> uv 로 .venv 를 Python 3.11 로 만든다"; \
		uv venv --clear --python 3.11 .venv; \
	elif command -v python3.11 >/dev/null 2>&1; then \
		echo "==> python3.11 로 .venv 를 만든다"; \
		python3.11 -m venv --clear .venv; \
	else \
		echo "make setup: uv 나 python3.11 이 필요하다" >&2; \
		exit 1; \
	fi
if command -v uv >/dev/null 2>&1; then \
		echo "==> backend 의존성 설치 (uv)"; \
		uv pip install --python .venv/bin/python -r backend/requirements.txt; \
	else \
		echo "==> backend 의존성 설치 (pip)"; \
		.venv/bin/python -m ensurepip --upgrade && .venv/bin/python -m pip install -r backend/requirements.txt; \
	fi
if ! command -v pnpm >/dev/null 2>&1; then \
		echo "make setup: pnpm 이 필요하다 (corepack enable 로 켠다)" >&2; \
		exit 1; \
	fi
cd frontend && pnpm install --frozen-lockfile
rm -rf .venv frontend/node_modules frontend/.next frontend/tsconfig.tsbuildinfo .pytest_cache backend/.pytest_cache backend/tests/test_agentlens.db backend/tests/test_agentlens.db-wal backend/tests/test_agentlens.db-shm
find . -name __pycache__ -type d -prune -not -path './.git/*' -exec rm -rf {} +
cd backend && PYTHONPATH=. ../.venv/bin/python ../scripts/collect.py
echo "==> Docker Compose 로 서비스를 띄우고 healthy 가 될 때까지 기다린다 (최대 180초)"
docker compose up -d --wait --wait-timeout 180
echo "==> backend:  http://localhost:8000"
echo "==> frontend: http://localhost:3001"
echo "==> .env 의 BACKEND_PORT·FRONTEND_PORT 로 포트를 바꿨으면 그 포트로 접속한다"
docker compose logs -f --tail=200
```
- `make -n docker-logs DOCKER_LOGS_ARGS=--tail=20` → `docker compose logs --tail=20`.
- `make -n reset AGENTLENS_API_URL=http://127.0.0.1:9` → 종료 0, 출력의 모든 URL 이 `http://127.0.0.1:9` (`/health`, `/api/schedule/reset-and-collect`).

### `make setup` (한 번, `step2/make-setup.log`) → 종료 0
```
==> .venv 이미 있음 (Python 3.11.9)
==> backend 의존성 설치 (uv)
Checked 19 packages in 18ms
cd frontend && pnpm install --frozen-lockfile
Update available! 12.3.4 → 12.18.0.
...
Lockfile is up to date, resolution step is skipped
...
Done in 4.5s using pnpm v12.3.4
```
- pnpm 이 `Packages: +599`, `added 599` 를 내며 store 에서 다시 링크했다 (downloaded 0). 두 번째 실행부터의 출력은 V1 에서 본다. O 규칙에 걸리는 줄 없음 (pnpm 업데이트 안내 줄의 `curl … | sh` 는 정규식에 걸리지 않음).

### reset 의 JSON 처리 흉내 (`step2/json_part.sh`, 레시피의 curl 뒤 부분과 같은 셸·python)
| 응답 | 출력 | 종료 |
|---|---|---|
| `{"status":"started",…}` | 들여쓴 JSON | 0 |
| `{"status":"already_running","message":"현재 수집이 진행 중",…}` | 들여쓴 JSON + stderr `현재 수집이 진행 중` | 1 |
| `not json` | stderr `응답이 JSON 이 아니다: not json` | 1 |
| `[1,2]` | 들여쓴 JSON + stderr `[1, 2]` | 1 |
## 결정
- T2 의 '안전 단언 실패 시 `make -n` 을 돌리지 않음' 은 `make -n` 을 부르는 도움 함수 `_make_dry_run` 이 부르기 전에 매번 `_assert_dry_run_is_safe` 를 단언하는 방식으로 했다 (별도 테스트 `test_t2_dry_run_executes_nothing` 도 둠).
- T3 의 `py_compile` 은 `cfile=tmp_path/collect.pyc` 로 바이트코드를 저장소 밖에 쓴다 (`scripts/__pycache__` 를 만들지 않으려고. 검사 내용은 같음).
- `reset` 의 JSON 출력은 `python3 -m json.tool --no-ensure-ascii` (기본 들여쓰기 4) 로 하고, 상태 판정·메시지 출력은 별도 `python3 -c` 두 줄로 했다. try/except 를 한 줄 `-c` 에 넣지 않으려고 '해석 가능 여부' 를 `json.tool` 의 종료 코드로 가른다 (해석 실패 시 `json.tool` 의 stderr 는 `2>/dev/null` 로 숨기고 우리 메시지만 낸다).
- `reset` 의 `resp="$$(curl …)" || exit 1` 은 plan 이 정한 형태다. 다른 도구로 넘어가는 폴백이 아니라 실패 종료라 R1 의 `A || B` 금지에 들지 않는다.
- `export DEV_BACKEND_PORT …` 는 make 에서 정의되지 않은 변수도 빈 값으로 export 한다 (GNU Make 3.81 에서 scratchpad 의 작은 Makefile 로 확인). `scripts/dev.sh` 가 `${VAR:-기본}` 을 쓰므로 빈 값이면 기본값이 된다 (단계 3 담당이 이 형태를 지켜야 한다. `${VAR-기본}` 이면 빈 값이 그대로 쓰인다).
- 원래 Makefile 의 `.PHONY: check` 둘째 줄은 머리의 `.PHONY` 한 줄로 합쳤다 (plan '`.PHONY:` 한 줄에 12개'). `check` 레시피와 그 위 주석은 그대로.
- `setup` 의 pnpm 없음 안내 문구는 "corepack enable 로 켠다" 로 했다 (`frontend/Dockerfile` 이 corepack 으로 pnpm 을 켬).
## 막힌 점
- 없음.
## 다음
- 단계 6: 커밋된 `scripts/dev.sh` 로 `test_make_targets.py` 를 다시 돌려 T3 4개를 확인하고, V1(`make setup` 두 번·`.venv` 새로 만들기), V7(`docker-up --wait`, `config.json :rw` 설정 저장 200), V9 를 실행 검증한다.
