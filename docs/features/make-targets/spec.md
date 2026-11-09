# Spec: Makefile 대상 12개 전부 정상화

Intent: ./intent.md
Status: approved
Approved-by: 자동 승인 (Claude) (2026-11-08)
Policies: 프로젝트 정책 스킬 없음 (`.claude/skills/` 에 보안·컴플라이언스·UX·브랜드 정책 스킬이 없다). 적용한 저장소 규칙: 루트 `CLAUDE.md` 'SDLC' 절 (파괴적 명령 `RELEASE_APPROVAL` 게이트, 승인된 plan 의 '변경 파일' 게이트, 테스트를 고쳐 통과시키지 않음), `.claude/rules/contracts.md` (계약 변경 없음, 설계 9절).

## 요구사항
결정 기준: 12개 대상(`setup`, `dev`, `test`, `build`, `clean`, `collect`, `reset`, `docker-build`, `docker-up`, `docker-down`, `docker-logs`, `check`)이 모두 실제 실행으로 동작하고 '오류 출력 없음' 기준(아래 O 규칙)을 지킨다. 일부를 문서로만 남기지 않는다 (intent '제약').

**O 규칙 (오류 출력 없음)**: 대상을 실행한 출력 가운데 make, 셸, `scripts/*`, uv, pnpm, docker compose 가 낸 줄에 대소문자 무시 정규식 `\b(error|err!|traceback|exception|no such file|not found|command not found|failed|fatal|denied|already exists)\b` 에 걸리는 줄이 없어야 한다. 예외는 셋뿐이고 verify 에 줄을 그대로 적고 분류한다: (a) 실행 중인 앱 프로세스의 런타임 로그(uvicorn·next dev·컨테이너 로그, 수집기의 소스별 실패 로그), (b) `check`·`test` 의 테스트 이름 줄, (c) 우려 3 의 make `Interrupt` 줄. 의도한 실패 경로(예: backend 가 없을 때 `reset`)는 이 규칙이 아니라 요구사항의 종료 코드와 메시지로 판정한다.

| ID | 요구 | intent 연결 | 확인 기준 (측정 가능) |
|---|---|---|---|
| R1 | Makefile 의 대상은 위 12개이고 모두 `.PHONY` 에 있다. 레시피 셸은 `/bin/bash` 다. 실패를 숨기는 `\|\| true` 와 다른 도구로 조용히 넘어가는 `A \|\| B` 폴백이 없다. 레시피에 `$(MAKE)`, `$(shell …)`, `+` 접두 줄이 없다 (`make -n` 이 아무것도 실행하지 않게) | 기대 결과 1·2 ('.PHONY 누락', 'reset 이 실패를 숨김') | T1·T2·T4 통과 |
| R2 | `make setup` 은 몇 번 돌려도 같은 결과로 끝난다. `.venv` 가 Python 3.11 이면 다시 만들지 않는다. 없거나 3.11 이 아니면 3.11 로 새로 만든다. PATH 의 `python3` 판에 기대지 않는다 | 대상별 상태 `setup`, 열린 질문 5 | V1: 두 번 연속 종료 0, 두 번째 출력이 O 규칙을 지키고 `.venv/pyvenv.cfg` 가 첫 실행 뒤와 같다. `.venv/bin/python --version` 이 3.11.x |
| R3 | `make dev` 가 backend(`--reload`)와 frontend(`next dev`)를 함께 띄우고, 둘이 준비되면 주소를 출력한다. Ctrl-C 나 SIGTERM 에 두 프로세스와 자식이 모두 내려가고 종료 0 이다. 둘 중 하나가 죽거나 준비 시간 안에 뜨지 않으면 나머지를 내리고 종료 1 이다. 포트가 이미 쓰이면 아무것도 띄우지 않고 종료 1 과 원인 메시지 | 대상별 상태 `dev`, 열린 질문 2 | V4 의 (a)~(d) |
| R4 | `make test` 는 `make check` 와 같은 검사를 돈다 | 대상별 상태 `test`, 열린 질문 1 | `make -n test` 출력이 `make -n check` 와 같다 (T2). V2 에서 `make test` 종료 0 |
| R5 | `make build` 는 지금처럼 `cd frontend && pnpm build` 다 | 대상별 상태 `build` | V3 종료 0, O 규칙 |
| R6 | `make clean` 은 설치물·빌드 산출물·캐시를 모두 지우고 데이터는 남긴다 (지울 것과 남길 것은 설계 1.5) | 대상별 상태 `clean`, 열린 질문 6 | V8: 지울 목록이 모두 없고 `find . -name __pycache__ -not -path './.git/*'` 결과 0건. 남길 목록의 sha256 이 실행 전과 같다 |
| R7 | `make collect` 는 실행 중인 backend 가 있으면 그 backend 에 수집을 시키고(그 backend 의 DB, Docker 면 volume DB) 끝날 때까지 기다린다. 없으면 `backend/` 에서 로컬 DB 에 직접 수집한다. 어느 쪽인지와 대상 DB 또는 URL 을 첫 줄에 출력한다. 수집이 끝나지 않거나 오류로 끝나면 종료 1 | 대상별 상태 `collect`, 열린 질문 8 | V5 의 (a)~(d), T6 |
| R8 | `make reset` 은 backend 가 응답하지 않으면 종료 1 과 원인 메시지, 응답이 `status: "started"` 가 아니면(예: `already_running`) 종료 1 과 응답 메시지, 성공하면 응답 JSON 을 출력하고 종료 0 이다. 대상 URL 은 `AGENTLENS_API_URL` 로 바꿀 수 있다. `RELEASE_APPROVAL` 게이트는 그대로다 | 대상별 상태 `reset`, 열린 질문 7, 제약 | T5, V6 (사람 또는 `RELEASE_APPROVAL` 세션이 실행, 우려 1) |
| R9 | `make docker-build` 뒤 같은 docker context 에 이미지 `agentlens-backend`, `agentlens-frontend` 가 있다 | 대상별 상태 `docker-build` | V7: `docker image inspect agentlens-backend agentlens-frontend` 종료 0 |
| R10 | `make docker-up` 은 두 컨테이너가 healthy 가 될 때까지 기다리고 종료 0 이다. 빈 DB 에서도 backend 가 첫 수집을 기다리지 않고 바로 요청을 받는다. Docker 에서 브리핑 설정 저장과 소스 저장이 성공한다 | 대상별 상태 `docker-up` 위험 (1)(2)(3), 열린 질문 9 | V7: 종료 0, `docker compose ps` 두 서비스 `healthy`, `POST /api/briefing/settings` 200, 소스 토글 200. T7·T8 통과 |
| R11 | `make docker-down` 은 컨테이너와 네트워크를 내리고 volume `agentlens-data` 는 남긴다. 떠 있는 것이 없어도 종료 0 | 대상별 상태 `docker-down` | V7: 종료 0, `docker ps -a --filter name=agentlens` 결과 없음, `docker volume ls` 에 `agentlens-data` 있음. 두 번째 실행도 종료 0, O 규칙 |
| R12 | `make docker-logs` 는 기본으로 따라가기(`-f`)를 유지하고 마지막 200줄부터 보인다. 인자는 `DOCKER_LOGS_ARGS` 로 바꿀 수 있다 | 대상별 상태 `docker-logs`, 열린 질문 10 | V7: `make docker-logs DOCKER_LOGS_ARGS=--tail=20` 종료 0. 기본 실행을 SIGINT 로 멈췄을 때 출력 기록 |
| R13 | `make check` 는 레시피를 바꾸지 않고, 새 회귀 테스트(T1~T8)를 포함해 통과한다 | 대상별 상태 `check`, 제약 | V2 종료 0. 실행 뒤 `git status --porcelain` 이 실행 전과 같다 |
| R14 | `make dev` 가 저장소에 추적되지 않은 파일을 만들지 않는다 | 기대 결과 1 (오류·부작용 없는 동작) | V4: `make dev` 전후 `git status --porcelain` 이 같다 (`frontend/AGENTS.md`, `frontend/CLAUDE.md` 가 생기지 않음) |
| R15 | 문서가 고친 make 와 맞는다: 루트 `CLAUDE.md` '명령'·'SDLC' 절, `docs/operations.md`, `docs/test-strategy.md`, `docs/known-issues.md`(고친 행 삭제), 그리고 같은 사실을 적은 `docs/data-model.md`, `docs/api.md`, `docs/functional-spec/03-collection.md`, `docs/functional-spec/04-briefing-and-sharing.md`, `docs/test-cases.md`, `docs/tech-spec.md` | 기대 결과 3, '문서와 make 불일치' | `git grep -nE 'scripts/test\.sh|지워진 .scripts/.|make reset-and-collect|config\.json:ro|격리는 미정|\*\*깨짐\*\*' -- CLAUDE.md docs ':!docs/features'` 결과 0건, 설계 10절 표의 행마다 고친 문서가 있다 |

범위 밖:
- 지워진 브라우저 e2e 스크립트 5개 (열린 질문 4).
- 루트·`backend/` 두 `agentlens.db` 가 생기는 원인(`DATABASE_URL` 이 cwd 상대, `config.py:42`). `make dev`·`make collect`(직접 모드)가 모두 `backend/` 에서 돌아 같은 `backend/agentlens.db` 를 쓰게 맞추는 데서 멈춘다 (known-issues '테스트·운영' 의 DB 경로 행은 남긴다).
- `frontend/Dockerfile` 의 `corepack prepare pnpm@latest` 고정 (우려 8).
- `NEXT_PUBLIC_API_URL` 빌드 인자 (known-issues 행 유지. `docker-build`·`docker-up` 의 성공 여부와 무관).

## 설계

### 0. 구조
- 명령은 Makefile 에 둔다. 셸 한 줄로 쓰기 어려운 두 가지만 `scripts/` 에 둔다: 프로세스 두 개를 관리하는 `scripts/dev.sh`, 모드 선택과 완료 대기가 있는 `scripts/collect.py`. `scripts/test.sh` 는 되살리지 않는다 (열린 질문 3, 근거 E2·E3·E5).
- Makefile 머리: `SHELL := /bin/bash`. 이 머신의 make 는 GNU Make 3.81 이라 `.SHELLFLAGS`·`.ONESHELL` 을 쓰지 않는다. 파이프 실패가 필요한 레시피만 줄 안에서 `set -o pipefail` 을 쓴다 (근거 E5).
- Makefile 변수 (모두 `?=`, 명령 줄이나 환경 변수로 바꿀 수 있다):

| 변수 | 기본값 | 쓰는 대상 |
|---|---|---|
| `AGENTLENS_API_URL` | `http://localhost:8000` | `collect`, `reset` |
| `COLLECT_MODE` | `auto` (`auto`, `api`, `direct`) | `collect` |
| `COLLECT_TIMEOUT` | `1800` (초) | `collect` (API 모드 대기 한도) |
| `DOCKER_WAIT_TIMEOUT` | `180` (초) | `docker-up` |
| `DOCKER_LOGS_ARGS` | `-f --tail=200` | `docker-logs` |

- `make dev` 의 포트·준비 시간은 `scripts/dev.sh` 가 환경 변수 `DEV_BACKEND_PORT`(기본 8000), `DEV_FRONTEND_PORT`(기본 3000), `DEV_HOST`(기본 `0.0.0.0`), `DEV_READY_TIMEOUT`(기본 120초)로 받는다. Makefile 이 이 네 이름을 `export` 해서 `make dev DEV_BACKEND_PORT=18000` 과 환경 변수 형식이 모두 동작한다. compose 가 쓰는 `BACKEND_PORT`·`FRONTEND_PORT`(루트 `.env` 에 있을 수 있음)와 이름을 나눈다 (근거 E14).

### 1. 대상별 설계

#### 1.1 `setup` (R2, 열린 질문 5)
1. `.venv/bin/python` 이 있고 3.11 이면 "이미 있음" 한 줄을 내고 만들지 않는다.
2. 아니면 `uv` 가 있으면 `uv venv --clear --python 3.11 .venv`, 없으면 `python3.11` 이 있으면 `python3.11 -m venv --clear .venv`, 둘 다 없으면 종료 1 과 "uv 나 python3.11 이 필요하다" 메시지. PATH 의 `python3` 로 폴백하지 않는다.
3. 의존성: `uv` 가 있으면 `uv pip install --python .venv/bin/python -r backend/requirements.txt`, 없으면 `.venv/bin/python -m ensurepip --upgrade` 뒤 `.venv/bin/python -m pip install -r backend/requirements.txt`. 도구를 먼저 정하고 그 도구만 쓴다 (`A || B` 폴백 없음. uv 로 만든 venv 에는 pip 가 없어 지금의 `|| .venv/bin/pip` 폴백은 실패한다).
4. `pnpm` 이 없으면 종료 1 과 메시지. 있으면 `cd frontend && pnpm install --frozen-lockfile` (Docker 빌드 `frontend/Dockerfile:14` 와 같은 고정).
- 지금 `.venv` 는 `python3 -m venv` 로 만든 3.11.9 라 1 에서 건너뛴다 (근거 E6·E7·E23).

#### 1.2 `dev` (R3, R14, 열린 질문 2)
`dev:` 레시피는 `./scripts/dev.sh` 하나. `scripts/dev.sh` (bash, 실행 권한, `set -euo pipefail`):
1. 사전 확인: `.venv/bin/uvicorn` 과 `frontend/node_modules` 가 없으면 "make setup 을 먼저" 메시지와 종료 1.
2. 포트 확인: `DEV_BACKEND_PORT`, `DEV_FRONTEND_PORT` 에 bash `/dev/tcp/127.0.0.1/<포트>` 연결이 되면 이미 쓰이는 것이다. 아무것도 띄우지 않고 "포트 N 사용 중 (Docker 가 떠 있으면 make docker-down)" 메시지와 종료 1. `lsof` 에 기대지 않는다. 자동으로 다른 포트를 고르지 않는다 (지운 `dev.sh` 의 3000→3001 자동 선택 제거. 3001 은 Docker frontend 포트라 Docker 와 섞이고, 조용히 다른 주소로 뜨면 사용자가 모른다).
3. `set -m` 으로 두 프로세스를 각자 프로세스 그룹으로 띄운다.
   - backend: `backend/` 에서 `../.venv/bin/uvicorn app.main:app --reload --reload-dir app --host "$DEV_HOST" --port "$DEV_BACKEND_PORT"`. `--reload` 를 쓴다 (개발용, 지운 `dev.sh` 와 같음). `--reload-dir app` 으로 테스트 DB·테스트 파일 변경에 다시 뜨지 않게 한다.
   - frontend: `frontend/` 에서 `INTERNAL_API_URL=http://127.0.0.1:$DEV_BACKEND_PORT pnpm dev --port "$DEV_FRONTEND_PORT"`. `DEV_BACKEND_PORT` 가 8000 이 아니고 `NEXT_PUBLIC_API_URL` 이 비어 있으면 `NEXT_PUBLIC_API_URL=http://localhost:$DEV_BACKEND_PORT` 를 넘긴다 (기사 Ask AI 스트림이 `{브라우저 호스트}:8000` 에 직접 붙기 때문, `operations.md:292`).
4. 준비 대기: `DEV_READY_TIMEOUT` 안에 `curl -fsS http://127.0.0.1:$DEV_BACKEND_PORT/health` 와 `curl -fsS http://127.0.0.1:$DEV_FRONTEND_PORT/api/health` 가 모두 성공하면 frontend·backend·API 문서 주소를 출력한다. 시간을 넘기면 정리하고 종료 1.
5. 감시: 두 PID 가 모두 살아 있는 동안 1초 간격으로 확인한다 (`wait -n` 은 bash 4.3 부터라 macOS `/bin/bash` 3.2 에 없다). 하나가 죽으면 "<이름> 이 종료 코드 N 으로 끝났다" 를 내고 정리, 종료 1.
6. 정리: `trap` 을 `INT`, `TERM` 에 건다. 두 프로세스 그룹에 `kill -TERM -- -<pgid>` 를 보내고 최대 10초 기다린 뒤 남아 있으면 `KILL`. 사용자가 멈춘 경우(INT/TERM)는 종료 0 (make 가 `Error 130` 줄을 내지 않게). `EXIT` trap 은 비정상 종료 때도 자식 그룹을 정리한다.
7. 출력 문구는 한국어, 그림 이모지를 쓰지 않는다 (지운 `dev.sh` 의 이모지 제거).
- 부작용 제거 (R14): `next dev` 는 AI 에이전트가 감지되면 `frontend/AGENTS.md`·`frontend/CLAUDE.md` 를 만든다. `frontend/next.config.ts` 에 `agentRules: false` 를 넣어 끈다. 원작성자가 `0aab1bb` 에서 두 파일을 일부러 지웠으므로, 지금 추적되지 않은 채 남은 두 파일도 지운다 (근거 E4·E15). `frontend/next.config.ts` 는 `frontend/src/**` 밖이라 경로 게이트 대상이 아니지만 plan '변경 파일' 에 넣는다.

#### 1.3 `test` (R4, 열린 질문 1)
`test: check` (레시피 없음, `check` 를 전제 조건으로). 지운 `test.sh` 는 `check` 의 부분 집합(pytest + `tsc --noEmit`)이었고 지금 저장소 규칙이 검사를 `make check` 로 정했으므로 범위가 다른 두 검사를 두지 않는다. e2e 는 넣지 않는다 (근거 E2·E22).

#### 1.4 `build` (R5)
바꾸지 않는다.

#### 1.5 `clean` (R6, 열린 질문 6)
| 지움 | 이유 |
|---|---|
| `.venv`, `frontend/node_modules` | 설치물 (지금과 같음) |
| `frontend/.next`, `frontend/tsconfig.tsbuildinfo` | 빌드·타입 검사 산출물 (`frontend/.gitignore:40`) |
| 저장소 안 모든 `__pycache__` (`.git` 제외. `find . -name __pycache__ -type d -prune -not -path './.git/*' -exec rm -rf {} +`) | 지금 지우는 `backend/__pycache__` 는 없고 실제 캐시는 `backend/app/**`, `backend/tests`, `.claude/hooks` 에 있다 |
| `.pytest_cache`, `backend/.pytest_cache` | 테스트 캐시 |
| `backend/tests/test_agentlens.db`, `-wal`, `-shm` | 테스트가 실행마다 쌓는 테스트 DB. `conftest.py` 가 다음 실행 때 스키마를 다시 만든다 |

| 남김 | 이유 |
|---|---|
| `agentlens.db*`, `backend/agentlens.db*` | 수집 데이터 |
| `.env*`, `config.json`, `sources.json`, `backend/app/config/sources.json` | 설정 |
| `frontend/next-env.d.ts` | `tsconfig` 가 포함하는 생성 파일. 지우면 `next` 를 돌리기 전까지 타입 검사가 달라질 수 있다 |
| Docker 이미지·컨테이너·volume | `docker-down` 의 몫. `clean` 은 Docker 를 건드리지 않는다 |

근거 E8·E21.

#### 1.6 `collect` (R7, 열린 질문 8)
레시피: `cd backend && PYTHONPATH=. ../.venv/bin/python ../scripts/collect.py`. `scripts/collect.py` 가 `AGENTLENS_API_URL`, `COLLECT_MODE`, `COLLECT_TIMEOUT` 을 환경에서 읽는다 (Makefile 이 export).
- 모드 선택: `auto` 는 `GET {URL}/health` (2초 제한)가 200 이고 `status == "healthy"` 면 API 모드, 아니면 직접 모드. `api` 는 backend 가 없으면 종료 1. `direct` 는 backend 가 떠 있어도 직접 모드 (경고 한 줄).
- 첫 줄 출력: `API 모드: <URL>` 또는 `직접 모드: <DB 절대 경로>` (DB 경로는 `settings.DATABASE_URL` 을 cwd 기준으로 푼 값).
- API 모드: 시작 전 `GET /api/schedule/progress` 의 `last_crawl_time` 을 기억하고 `POST /api/schedule/trigger` 를 보낸다 (`started` 또는 `already_running` 이면 그 수집을 기다린다). 2초 간격으로 `progress` 를 보며 `step_message` 가 바뀌면 출력한다. `is_running == false` 이고 `last_crawl_time` 이 시작 전 값과 다르면 성공(종료 0, `items_collected`·`items_saved` 출력). `is_running == false` 인데 `last_crawl_time` 이 그대로이고 한 번 이상 `is_running == true` 를 봤다면 오류로 끝난 것(종료 1, 마지막 `step_message`). `COLLECT_TIMEOUT` 을 넘기면 종료 1. 수집 성공 때만 `last_crawl_time` 이 바뀌므로 이 판정이 맞다 (근거 E10).
- 직접 모드: `ensure_db_schema()` 를 먼저 부른다 (지금 레시피는 빈 DB 에서 테이블이 없어 저장이 실패해도 종료 0). 그다음 `collector_manager.collect_all()`. 반환 `status` 가 `success` 가 아니면 종료 1. 소스별 결과(`source_results`)를 한 줄씩 출력하고 오류가 난 소스를 "실패한 소스" 로 묶어 보여 준다. 모든 소스가 실패해 시드만 저장했으면 종료 1 (네트워크 없음).
- 이렇게 Docker 를 띄운 상태에서 `make collect` 는 Docker volume DB 를 채우고, `make dev` 상태에서는 dev backend 의 DB(`backend/agentlens.db`)를 채운다. backend 가 떠 있을 때 두 번째 프로세스가 같은 SQLite 에 동시에 수집하는 경우(`operations.md:295-296`)가 기본 경로에서 없어진다 (근거 E19).
- 외부 소스·LLM 호출은 그대로 일어난다 (우려 6).

#### 1.7 `reset` (R8, 열린 질문 7·13)
레시피 (동작만 정한다. 정확한 셸은 plan):
1. 안내 한 줄: 대상 URL 과 "수집 데이터 전체 삭제 후 재수집".
2. `curl -fsS --max-time 5 -o /dev/null "$AGENTLENS_API_URL/health"` 가 실패하면 stderr 에 "make reset: <URL> 에 backend 가 없다. make dev 또는 make docker-up 으로 먼저 띄운다" 와 종료 1.
3. `curl -fsS --max-time 30 -X POST "$AGENTLENS_API_URL/api/schedule/reset-and-collect"` 응답을 변수에 받는다. curl 이 실패하면(HTTP 4xx·5xx 포함) 종료 1.
4. `python3` 표준 라이브러리로 JSON 을 해석해 보기 좋게 출력한다. `status != "started"` 면 `message` 를 stderr 에 내고 종료 1. JSON 이 아니면 종료 1 과 "응답이 JSON 이 아니다".
- `|| true` 를 없앤다. curl 을 레시피 안에 그대로 두어 `deploy_patterns` 의 `*make reset*` 이 지금처럼 진입점을 잡는다. 새 스크립트로 옮기지 않는다: 스크립트 경로는 지금 패턴에 걸리지 않아 게이트를 우회하는 진입점이 생긴다 (근거 E13).
- 루트 `CLAUDE.md:31` 의 없는 대상 `make reset-and-collect` 는 목록에서 뺀다. 그런 대상을 만들지 않는다 (`reset` 과 같은 일을 하는 두 번째 이름이 생길 뿐이다). `deploy_patterns` 는 바꾸지 않는다 (우려 2).

#### 1.8 `docker-build` (R9)
레시피는 그대로 `docker compose build`. intent 가 본 '빌드 성공 뒤 이미지 없음' 은 verify V7 에서 같은 context(`desktop-linux`)로 `make docker-build` 직후 `docker image inspect` 를 돌려 확인한다. 이미지가 없으면 그 원인(다른 context, 정리 명령 등)을 plan 단계에서 찾아 고친다 (근거 E9·E16).

#### 1.9 `docker-up` (R10, 열린 질문 9)
- 레시피: `docker compose up -d --wait --wait-timeout $(DOCKER_WAIT_TIMEOUT)` 뒤 주소 출력. compose v5.5.0 에 `--wait`, `--wait-timeout` 이 있다. 컨테이너가 시간 안에 healthy 가 안 되면 compose 가 0 이 아닌 값으로 끝나고 make 도 실패한다 (지금은 `-d` 만이라 healthcheck 실패와 상관없이 종료 0). 이미지가 없으면 `up` 이 빌드하는 것은 compose 기본 동작이라 그대로 둔다 (근거 E9).
- 첫 수집을 비동기로 (**`backend/app/main.py` 변경, 경로 게이트 대상**): lifespan 에서 `news_items` 가 0건이면 `collector_manager.collect_all()` 을 `asyncio.create_task` 로 띄우고 바로 `yield` 한다. 태스크 참조를 lifespan 지역 변수로 들고 있다가, 종료 때 끝나지 않았으면 `cancel()` 하고 `CancelledError` 를 삼켜 기다린다 (`collect_all` 의 `finally` 가 `is_running` 을 되돌린다). `session=s` 인자는 넘기지 않는다 (`collect_all` 이 쓰지 않는 인자, `manager.py:176-257`). 시작 로그 `[AgentLens] Initial database seed collection...` 은 "백그라운드로" 를 붙여 남긴다. 이 동작은 `reset-and-collect`·`trigger` 가 이미 쓰는 '비우고 백그라운드 수집' 상태와 같다 (`schedule.py:60, 92`). healthcheck 시간을 늘리는 방법은 쓰지 않는다: 첫 수집 시간은 측정된 적이 없고 네트워크·LLM 상태에 따라 달라 어느 값도 근거가 없다 (근거 E10·E11). 이 변경으로 `make dev` 의 준비 대기도 빈 DB 에서 막히지 않는다.
- `docker-compose.yml:38` 의 `./config.json:/app/config.json:ro` 를 `:rw` 로 바꾼다. `save_json_config` 는 파일을 제자리에서 연다(`open(p, "w")`, `config.py:161-173`)라 단일 파일 bind mount 에 쓸 수 있다. 결과로 Docker 에서 설정을 저장하면 git 이 추적하는 루트 `config.json` 이 바뀐다 (로컬 실행과 같은 동작, 우려 4).
- 소스 저장 (**`backend/app/services/sources_service.py` 변경, 경로 게이트 대상**): `save_sources` 는 `sources.tmp` 에 쓰고 `replace()` 로 바꾼다 (`sources_service.py:105-109`). `/app/sources.json` 은 단일 파일 bind mount 라 그 위로 rename 하면 Linux 가 `EBUSY` 를 낼 것으로 본다 (`operations.md:301` 는 '실행해 확인하지 않았다'). plan 의 첫 Docker 단계에서 고치기 전 상태로 재현해 기록한 뒤, `replace()` 가 `OSError` 를 내면 대상 파일에 제자리로 쓰고 임시 파일을 지우는 대체 경로를 더한다. 로컬(일반 파일)에서는 지금처럼 원자적 교체를 쓴다. intent 의 `docker-up` 위험 목록 밖이지만 (2) 와 같은 종류(Docker 에서 설정 파일 저장 실패)라 '다 고쳐' 범위로 넣는다 (우려 9).
- Dockerfile 두 개는 바꾸지 않는다.

#### 1.10 `docker-down` (R11)
그대로 `docker compose down`. volume 은 지우지 않는다 (`-v` 없음). 떠 있는 것이 없을 때의 출력은 V7 에서 O 규칙으로 확인한다.

#### 1.11 `docker-logs` (R12, 열린 질문 10)
`docker compose logs $(DOCKER_LOGS_ARGS)`, 기본 `-f --tail=200`. 따라가기를 기본으로 두는 것은 지금 동작이고 `operations.md:283` 의 로그 확인 방법이다. `--tail=200` 은 오래 떠 있던 컨테이너에서 전체 로그를 쏟아 내지 않게 한다. 끝나는 실행이 필요하면 `DOCKER_LOGS_ARGS=--tail=50`.

#### 1.12 `check` (R13)
레시피를 바꾸지 않는다. 새 테스트는 `backend/tests/` 에 두어 기존 pytest 단계가 돌린다 (2절).

### 2. 회귀 검사 (열린 질문 12)
위치: `backend/tests/` 의 새 파일. `make check` 의 기존 pytest 단계가 그대로 돌리므로 검사 명령·레시피가 늘지 않는다. Makefile 테스트는 저장소 루트를 `Path(__file__).resolve().parents[2]` 로 잡고 `subprocess` 로 `make -n` 만 부른다. **`make` 를 `-n` 없이 부르지 않는다** (특히 `reset`).

| ID | 파일 (이름은 plan 에서 확정) | 확인 |
|---|---|---|
| T1 | `test_make_targets.py` | Makefile 에 정의된 대상 집합 = 12개 목록 = `.PHONY` 집합. `SHELL := /bin/bash` 가 있다 |
| T2 | 같음 | 먼저 Makefile 에 `$(MAKE)`, `${MAKE}`, `$(shell`, `+` 로 시작하는 레시피 줄이 없음을 단언한다 (있으면 `make -n` 이 실제로 실행하므로 다음 단계로 가지 않고 실패). 그다음 12개 대상마다 `make -n <대상>` 종료 0, stderr 빈 값. `make -n test` 출력 == `make -n check` 출력 |
| T3 | 같음 | 레시피가 부르는 파일이 있다: `scripts/dev.sh`(실행 권한, `bash -n` 종료 0), `scripts/collect.py`(`py_compile` 성공), `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `backend/requirements.txt`, `frontend/pnpm-lock.yaml` |
| T4 | 같음 | Makefile 에 `\|\| true` 가 없다. `docker-compose.yml` 에 `config.json:ro` 가 없다. `docker` 가 있으면 `docker compose config -q` 종료 0 (없으면 skip, 이유 문자열 남김) |
| T5 | 같음 | `make -n reset AGENTLENS_API_URL=http://127.0.0.1:9` 출력에 `127.0.0.1:9` 가 있고 `localhost:8000` 이 없다. 출력에 `curl` 과 `reset-and-collect` 가 있다 (게이트 패턴이 기대는 형태) |
| T6 | `test_collect_script.py` | `scripts/collect.py` 를 경로로 불러 (a) `auto` + 스텁 HTTP 서버(같은 테스트 안 `http.server` 스레드, `/health`·`/api/schedule/progress`·`/api/schedule/trigger` 만 흉내)가 healthy → API 모드, `last_crawl_time` 이 바뀌면 종료 0, (b) 스텁이 끝내 `last_crawl_time` 을 바꾸지 않고 `is_running` 이 true→false → 종료 1, (c) `COLLECT_TIMEOUT=1` 과 계속 `is_running` → 종료 1, (d) 응답 없는 URL + `auto` → 직접 모드 (`collect_all`·`ensure_db_schema` 흉내), (e) `api` + 응답 없는 URL → 종료 1. 스텁은 `reset-and-collect` 경로를 두지 않는다 |
| T7 | `test_startup_seed.py` | lifespan: 기사 0건(카운트 쿼리를 흉내 내거나 빈 테스트 DB 엔진)에서 `collect_all` 을 오래 걸리는 흉내로 바꾸고 `app.router.lifespan_context(app)` 에 들어가는 시간이 1초 안이다. 안에서 `/health` 가 200 이고 `running` 이 흉내의 상태를 따른다. 빠져나올 때 태스크가 취소된다. 기사가 있으면 `collect_all` 을 부르지 않는다. `start_scheduler`·`stop_scheduler` 는 흉내. `conftest.py` 의 autouse `init_db` 가 기사 1건을 넣으므로(`conftest.py:13-44`) 0건 조건은 테스트 안에서 만든다 |
| T8 | `test_sources_write_fallback.py` | `Path.replace` 가 `OSError(errno.EBUSY)` 를 내도록 바꾼 상태에서 `save_sources` 가 True 를 돌려주고 대상 파일 내용이 새 값이며 `.tmp` 가 남지 않는다. 바꾸지 않은 상태에서는 지금처럼 교체한다. 세션 임시 사본(`conftest.py` 설정 파일 격리)에 쓴다 |

- 기존 테스트 파일과 단언은 바꾸지 않는다. `test_reset_and_delete.py` 의 `collect_all` 흉내(`AsyncMock`)는 그대로 통과해야 한다.
- 실제 실행(서버·컨테이너·데이터 변경)은 `make check` 에 넣지 않는다: 외부 수집·LLM 호출과 수 분 단위 시간이 들고 Docker 가 없는 환경에서 돌 수 없다. 실제 실행은 3절의 verify 절차가 맡는다.

### 3. 실행 검증 절차 (열린 질문 11)
verify 단계가 이 머신(docker context `desktop-linux`, uv, pnpm)에서 이 순서로 돌린다. 모든 실행의 명령, 종료 코드, 전체 출력(긴 것은 파일로)과 O 규칙 판정을 verify.md 에 남긴다. 임시 파일은 세션 scratchpad 에 둔다. 시작 전과 끝에 `git status --porcelain` 을 남기고 같아야 한다 (V7 의 설정 저장 확인은 끝에 되돌린다).

| ID | 대상 | 절차와 판정 |
|---|---|---|
| V0 | 사전 | 포트 8000·3000·3001·18000 LISTEN 없음, `docker ps -a --filter name=agentlens` 없음, `docker image ls`·`docker volume ls` 기록. 데이터 파일 `agentlens.db`, `backend/agentlens.db` 의 sha256 기록 |
| V1 | `setup` | `make setup` 두 번. 둘 다 종료 0, 두 번째가 O 규칙과 R2 기준. 별도로 `.venv` 를 scratchpad 로 옮겨 두고(`mv`) 없는 상태의 `make setup` 이 3.11 로 만드는지 확인한 뒤 결과를 비교한다 |
| V2 | `check`, `test` | 각각 종료 0, 통과 수가 같다. 실행 뒤 `git status --porcelain` 변화 없음 |
| V3 | `build` | 종료 0, O 규칙 |
| V4 | `dev` | scratchpad 의 실행 도구(Python `subprocess.Popen(start_new_session=True)`)로 `make dev` 를 띄우고 프로세스 그룹에 SIGINT 를 보내 Ctrl-C 를 흉내 낸다 (비대화 셸의 백그라운드 작업은 SIGINT 를 무시하므로 `&` 로 띄우지 않는다). DB 는 `DATABASE_URL=sqlite+aiosqlite:///<scratchpad>/dev.db` 로 `backend/agentlens.db` 사본을 쓴다 (기사가 있어 첫 수집이 돌지 않음). (a) 준비 메시지 뒤 `curl -f :8000/health`, `curl -f :3000/api/health`, `curl -f :3000/` 200. (b) SIGINT 뒤 10초 안에 make 종료 0(또는 우려 3 의 줄만 남음), 8000·3000 LISTEN 없음, `pgrep -f "uvicorn app.main:app"`·`pgrep -f "next dev"` 결과 없음. (c) 8000 을 `python3 -m http.server 8000` 으로 점유하고 `make dev` → 종료 1, 원인 메시지, 남은 자식 없음. (d) 빈 DB 파일로 `make dev` → 15초 안에 `/health` 200 과 `running: true`, 그다음 SIGINT 로 내려가며 수집 태스크가 취소된다. 전후 `git status --porcelain` 같음 (R14) |
| V5 | `collect` | (a) backend 없음 + `DATABASE_URL` scratchpad 사본 → 첫 줄 `직접 모드`, 종료 0. (b) `make dev DEV_BACKEND_PORT=18000 DEV_FRONTEND_PORT=13000`(scratchpad DB)을 띄운 채 `make collect AGENTLENS_API_URL=http://127.0.0.1:18000` → 첫 줄 `API 모드`, 끝날 때까지 기다려 종료 0, `GET /api/schedule/status` 의 최근 로그에 새 항목. (c) `make collect COLLECT_MODE=api AGENTLENS_API_URL=http://127.0.0.1:9` → 종료 1. (d) 실행 뒤 `backend/agentlens.db` sha256 이 V0 과 같다 (사본만 썼음) |
| V6 | `reset` | 게이트 때문에 사람이 `!` 로, 또는 `RELEASE_APPROVAL` 이 있는 세션이 실행한다 (우려 1). V5(b) 의 18000 backend(scratchpad DB)에 대해 (a) `make reset AGENTLENS_API_URL=http://127.0.0.1:18000` → 종료 0, `status: started`. (b) 곧바로 같은 명령 → 수집 중이라 `already_running`, 종료 1, 메시지. (c) backend 를 내린 뒤 같은 명령 → 종료 1, "backend 가 없다". `localhost:8000` 의 실제 데이터에는 보내지 않는다 |
| V7 | `docker-*` | `make docker-build` → 종료 0, 바로 `docker image inspect agentlens-backend agentlens-frontend` 종료 0. `make docker-up` → `DOCKER_WAIT_TIMEOUT` 안에 종료 0, `docker compose ps` 두 서비스 healthy, `curl -f :8000/health`, `curl -f :3001/api/health`. 설정 저장: `GET /api/briefing/settings` 응답을 그대로 `POST` → 200 (지금은 500), 이어서 `git diff config.json` 을 기록하고 `git checkout -- config.json` 으로 되돌린다. 소스 저장: 고치기 전 이미지로 소스 하나를 토글해 실패를 재현·기록하고, 고친 뒤 같은 소스를 두 번 토글 → 둘 다 200, `git checkout -- sources.json` 으로 되돌린다. `make docker-logs DOCKER_LOGS_ARGS=--tail=20` 종료 0. 기본 `make docker-logs` 를 V4 와 같은 도구로 띄우고 SIGINT, 출력 기록. `make docker-down` → 종료 0, 컨테이너 없음, volume 있음. `make docker-down` 다시 → 종료 0, O 규칙 |
| V8 | `clean` | 맨 마지막에. `make clean` → 종료 0, 1.5 의 지울 목록이 모두 없고 `__pycache__` 0건, 남길 목록 sha256 이 V0 과 같다. 이어서 `make setup` → `make check` 종료 0 (되돌릴 수 있음 확인) |
| V9 | 전체 | 12개 대상 `make -n` 종료 0 (T2 와 같지만 사람이 읽을 출력으로 남긴다) |

- V4~V7 은 외부 소스 수집과 `.env` 의 LLM 키를 쓸 수 있다 (우려 6). V7 은 기존 volume `agentlens-data` 를 쓴다 (우려 7).

### 4. `make docker-up` 과 `make dev` 의 동시 실행
둘 다 8000 을 쓴다. `dev.sh` 가 포트를 먼저 확인해 종료 1 과 "make docker-down" 안내를 내므로 충돌이 조용히 나지 않는다. `docker-up` 쪽은 compose 가 포트 바인딩 실패로 0 이 아닌 값으로 끝난다 (compose 기본 동작, V7 전 V0 에서 포트가 비었음을 확인).

### 5. 바꾸지 않는 것
- `build`, `check`, `docker-build`, `docker-down` 의 레시피 (변수·`.PHONY`·`SHELL` 만 공통으로 바뀐다).
- `backend/Dockerfile`, `frontend/Dockerfile`, `.claude/hooks/sdlc-config.json`, `docs/product.md`.
- `/health` 응답 형식, 모든 REST 응답 형식.

### 6. 바꿀 파일
| 파일 | 변경 | 경로 게이트 |
|---|---|---|
| `Makefile` | 1절 전체, `SHELL`, 변수, `.PHONY` 12개 | 아님 |
| `scripts/dev.sh` (새 파일, 실행 권한) | 1.2 | 아님 |
| `scripts/collect.py` (새 파일) | 1.6 | 아님 |
| `docker-compose.yml` | `config.json` 마운트 `:rw` | 아님 |
| `backend/app/main.py` | 첫 수집 백그라운드 태스크와 종료 시 취소 | **`backend/app/**`** |
| `backend/app/services/sources_service.py` | `replace()` 실패 시 제자리 쓰기 | **`backend/app/**`** |
| `frontend/next.config.ts` | `agentRules: false` | 아님 (`frontend/src/**` 밖) |
| `frontend/AGENTS.md`, `frontend/CLAUDE.md` | 추적되지 않은 파일 삭제 (git 변경 없음) | 아님 |
| `backend/tests/` 새 파일 3~4개 (T1~T8) | 2절 | 아님 |
| 루트 `CLAUDE.md` | 10절 | 아님 (메인 세션) |
| `docs/operations.md`, `docs/test-strategy.md`, `docs/known-issues.md`, `docs/data-model.md`, `docs/api.md`, `docs/functional-spec/03-collection.md`, `docs/functional-spec/04-briefing-and-sharing.md`, `docs/test-cases.md`, `docs/tech-spec.md` | 10절, 7절 | 아님 |

### 7. 바뀌는 `docs/tech-spec.md` 절 (구현 뒤 `/implement-plan` 이 반영)
- '시스템 구성' 아래 목록: "루트 `Makefile` 이 두 앱의 명령을 묶는다" 에 `scripts/dev.sh`(로컬 동시 실행), `scripts/collect.py`(수집 진입점)를 더하고 Docker 실행이 `--wait` 로 healthy 까지 기다린다는 점.
- '공통 규칙' 의 스케줄 항목: "DB 가 비어 있으면 시작할 때 수집이 끝날 때까지 기다린다" → "DB 가 비어 있으면 시작할 때 수집을 백그라운드로 띄우고 바로 요청을 받는다".
- '데이터': Docker 에서 `config.json` 이 읽기·쓰기로 마운트되고 소스 저장이 bind mount 에서 제자리 쓰기로 바뀌는 점.
- '기술 선택과 근거': 행 셋 — (1) 로컬 동시 실행을 bash 스크립트로(대안: Makefile 한 줄, `concurrently` 같은 npm 도구. 근거 E3·E5), (2) 첫 수집 백그라운드화(대안: healthcheck `start_period` 늘림. 근거 E10), (3) `docker compose up --wait`(대안: `-d` 만. 근거 E9).
- '변경 이력': `make-targets` 행.

### 8. known-issues 처리
지우는 행 (모두 이 기능이 고침): '데이터·동작 오류' 의 "Docker 가 `config.json` 을 읽기 전용(`:ro`)으로 마운트한다", '테스트·운영' 의 "`make dev`, `make test` 가 지워진 `scripts/`", "`make setup` 을 다시 돌리면 …", "`make clean` 이 없는 `backend/__pycache__` 만 …", "루트 `CLAUDE.md:9` 의 `make check` 서술 … `make reset-and-collect`". 남기는 행: DB 경로 cwd 기준(범위 밖), 수집 중복 실행 플래그(MCP 서버와는 여전히 공유되지 않음), `NEXT_PUBLIC_API_URL`.

### 9. 앱 간 계약
바뀌지 않는다. `/health` 와 REST 응답 형식, SSE, `backend/app/schemas/`·`frontend/src/types/`·`frontend/src/mocks/` 모두 그대로다. 바뀌는 것은 빈 DB 에서 서버가 요청을 받기 시작하는 시점과 Docker 에서 설정·소스 저장의 성공 여부다.

### 10. 문서 반영 표 (R15)
| 문서 | 고칠 곳 |
|---|---|
| 루트 `CLAUDE.md` | '명령': `make test`·`make dev` 깨짐 줄 삭제, `make dev`(로컬 동시 실행, Ctrl-C 로 종료)·`make test`(= `make check`) 추가, `make check` 서술을 `operations.md:31` 과 같게(LLM 은 흉내, 설정 파일은 임시 사본, 스크래퍼 등은 실제 호출). 'SDLC' 의 파괴적 명령 목록에서 `make reset-and-collect` 삭제 |
| `docs/operations.md` | 'Makefile 타깃' 표 12행(상태 열 모두 동작, `collect` 모드, `reset` 종료 코드), 'backend 단독 실행'·'frontend 단독 실행' 앞에 `make dev`, 시작 순서(백그라운드 첫 수집), docker-compose 표 볼륨 `:rw`, '파괴적 작업' 의 `make reset`·`make clean` 행, '자주 생길 문제' 의 첫 수집·Docker 설정 저장·소스 저장 행, '알려진 불일치·위험' 의 깨진 make·로컬 실행 경로 미정의·Docker 설정 저장 불가·시작 차단 항목 |
| `docs/test-strategy.md` | '검사 명령' 10행 삭제와 `make test` = `make check`, '테스트 종류' 에 Makefile 회귀(T1~T5) 행, '릴리스 전 통합' 의 `make docker-up`(이제 healthy 까지 기다림) |
| `docs/known-issues.md` | 8절 |
| `docs/data-model.md` | DB 경로 표의 `make collect` 행(모드별 DB), 파괴 표의 `make reset` 행 |
| `docs/api.md` | lifespan 서술(`:775`), 설정 저장 오류의 `:ro` 서술(`:480`) |
| `docs/functional-spec/03-collection.md` | COLL-20 처리 규칙(`:272`), 시작 지연(`:367`), `make collect` 진입점 |
| `docs/functional-spec/04-briefing-and-sharing.md` | `:217` 의 `:ro` 서술 |
| `docs/test-cases.md` | 새 테스트 T1~T8, `:1244` 의 lifespan '없음' 행 |

## 우려 사항
| 우려 | 관련 정책 | 정책 소유자 | 해결 |
|---|---|---|---|
| 1. `make reset` 을 실제로 실행해 확인해야 하는데(V6, 기대 결과 4) `deploy_patterns` 의 `*make reset*` 이 `RELEASE_APPROVAL` 없는 세션의 실행을 모두 막는다. 버리는 DB 를 쓰는 테스트 backend 에 보내도 문자열 패턴이라 구별하지 못한다. 자동 검사(`make check`)에서는 `make -n reset` 만 돌린다: `-n` 없이 돌리는 테스트는 URL 변수 처리에 버그가 있으면 `localhost:8000` 의 실제 데이터를 지울 수 있고, 테스트 안에서 실행하는 것은 게이트를 hook 밖으로 우회하는 것이기도 하다 | 루트 `CLAUDE.md` 'SDLC' 파괴적 명령 게이트, `.claude/hooks/sdlc-config.json` `deploy_patterns` | 릴리스 관리자 (본인) | 미해결. 제안: V6 은 사람이 프롬프트에서 `! make reset AGENTLENS_API_URL=http://127.0.0.1:18000` 로 실행하고 출력을 verify 에 붙이거나, `RELEASE_APPROVAL` 을 설정한 세션에서 verifier 가 실행한다. 어느 쪽인지 승인자가 정한다 |
| 2. 게이트 패턴은 명령 문자열 `*make reset*` 만 본다. `make AGENTLENS_API_URL=… reset`, `make -C . reset`, `make --no-print-directory reset` 처럼 대상 앞에 다른 글자가 오면 걸리지 않는다. 이 spec 이 URL 변수를 더해 앞의 형태를 쓸 여지가 커진다. 반대로 `*make *reset*` 로 넓히면 커밋 메시지 등 이 기능 작업 중의 일반 명령도 막힌다 | 같음 | 릴리스 관리자 (본인) | 미해결. 이 spec 은 패턴을 바꾸지 않고, 문서에는 게이트에 걸리는 형태(`make reset AGENTLENS_API_URL=…`)만 적는다 |
| 3. `make dev`·`make docker-logs` 를 Ctrl-C 로 멈추면 GNU make 가 `make: *** [dev] Interrupt` 류의 줄을 낼 수 있다. make 자신이 SIGINT 를 받아 내는 것이라 Makefile·스크립트로 막을 수 없다. O 규칙('오류 출력 없음', 원작성자 요구 "완벽하게")과 부딪힌다 | intent 기대 결과 1 | 제품 오너 (본인) | 미해결. V4·V7 에서 실제 출력을 기록한다. 그 줄이 나오면 O 규칙 예외 (c) 로 둘지 승인자가 정한다 |
| 4. `config.json` 을 `:rw` 로 바꾸면 Docker 에서 설정 저장이 git 이 추적하는 루트 `config.json` 에 Notion 토큰·SMTP 비밀번호·웹훅 URL 을 평문으로 쓸 수 있다 (로컬 실행은 이미 그렇다) | known-issues '보안' 의 비밀값 평문 저장 | 서비스 오너 (본인) | 미해결. 이 기능은 저장 실패(500)만 고치고 비밀값 보관 방식은 바꾸지 않는다. known-issues 보안 행은 남긴다 |
| 5. `make dev` 의 backend 가 지운 `dev.sh` 처럼 `0.0.0.0` 에 뜬다 (`allowedDevOrigins` 의 Tailscale·LAN 주소 접속을 위해). 인증이 없어 같은 네트워크의 누구나 `reset-and-collect`·`DELETE /api/news/all` 을 부를 수 있다 | known-issues '보안' 의 인증 없음 | 서비스 오너 (본인) | 미해결. `DEV_HOST=127.0.0.1` 로 좁힐 수 있게 하고 기본값은 지금 동작을 유지한다 |
| 6. 실행 검증(V4(d), V5, V7)과 `make collect` 자체가 외부 소스 수집과 `.env` 의 LLM 키(Docker 는 compose 가 넘기는 키)로 실제 호출을 한다. 비용이 들고, 결과(수집 건수, 소스별 실패)가 네트워크 상태에 따라 다르다 | 없음 (비용) | 제품 오너 (본인) | 미해결. V4(a)~(c)·V6 은 기사가 있는 DB 사본으로 첫 수집을 피한다. V5 는 피할 수 없다 |
| 7. compose 가 volume 이름(`agentlens-data`)과 컨테이너 이름을 고정해 V7 을 별도 project 로 격리할 수 없다. V7 은 2026-11-08T13:50:03Z 에 만들어진 기존 volume 을 쓴다 (내용 미확인). `docker-down` 이 volume 을 지우지 않아 데이터는 남지만, volume 이 비었으면 V7 이 첫 수집을 일으킨다 | 없음 | 서비스 오너 (본인) | 미해결 |
| 8. `frontend/Dockerfile:11,21` 의 `corepack prepare pnpm@latest` 가 `package.json` 의 `pnpm@12.3.4` 와 달리 고정되지 않아, 나중에 `make docker-build` 가 다른 pnpm 판으로 깨질 수 있다. 고정하려면 `node:20` 에서 pnpm 12.3.4 가 도는지 확인해야 하는데 근거가 없다 (로컬은 node v24.11.1) | 없음 | 엔지니어 (본인) | 미해결. 지금 `docker-build` 는 성공하므로 이 spec 은 바꾸지 않는다. 고치려면 `/research-tech make-targets "pnpm 12.3.4 의 Node 20 지원"` 뒤 별도 결정 |
| 9. 소스 저장 대체 경로(`sources_service.py`)는 intent 의 `docker-up` 위험 목록 밖이다. '다 고쳐' 범위로 넣었지만 `backend/app/**` 변경이 하나 늘고, 원인(bind mount 위 rename 의 `EBUSY`)은 아직 재현하지 않았다 | intent '제약' (`backend/app/**` 는 plan 의 변경 파일에 있어야 함) | 제품 오너 (본인) | 미해결. plan 은 V7 의 '고치기 전 재현' 을 이 변경보다 먼저 둔다. 재현되지 않으면 이 변경을 빼고 plan 을 고친다 |

## 근거
- E1 — intent.md '대상별 상태' 표(27-40행)와 '기대 결과'(53-56행). 12개 대상의 현재 상태와 '종료 0 이어도 오류 출력이면 고칠 대상'.
- E2 — `git show 0aab1bb^:scripts/test.sh`: backend `pytest -v tests/` 와 frontend `pnpm tsc --noEmit` 만 한다. `Makefile:45-49` 의 `check` 는 여기에 vitest·eslint 를 더한 상위 집합 → `test: check` (1.3).
- E3 — `git show 0aab1bb^:scripts/dev.sh`: `trap cleanup SIGINT SIGTERM EXIT` + `kill $(jobs -p)`, 3000 이 쓰이면 3001 로 자동 선택(`lsof`), `wait`, 이모지 출력. 자식 프로세스 그룹을 따로 정리하지 않고, 한쪽이 죽어도 `wait` 가 다른 쪽을 기다린다 → 1.2 의 프로세스 그룹·감시·포트 고정.
- E4 — `git show --stat 0aab1bb` (`chore: frontend 에이전트 문서와 scripts 제거`, 2026-11-02): `frontend/AGENTS.md`, `frontend/CLAUDE.md`, `frontend/README.md`, `scripts/` 7개 파일을 함께 지웠다 → 에이전트 문서 재생성을 끈다 (1.2).
- E5 — 이 머신: `make --version` → GNU Make 3.81, `/bin/bash`·`/bin/sh` → GNU bash 3.2.57. `.SHELLFLAGS`·`.ONESHELL` 은 make 3.82, `wait -n` 은 bash 4.3 에서 생긴 기능이라 쓰지 않는다 (판 번호는 각 프로젝트 NEWS 기준의 기억이며 이번에 조회하지 않음, 가정. 설계는 그 기능을 쓰지 않으므로 가정이 틀려도 동작은 같다).
- E6 — `uv venv --help` (uv 0.11.25): `-c, --clear`, `--allow-existing`, `-p, --python` 이 있다. intent 29행: 기존 `.venv` 에서 `uv venv .venv` 가 `A virtual environment already exists … Use the --clear flag` 를 낸다 → 3.11 확인 후 건너뛰기, 필요할 때만 `--clear` (1.1).
- E7 — `.venv/pyvenv.cfg`: `version = 3.11.9`, `command = …/3.11/bin/python3 -m venv …`. `.venv/bin` 에 `pip` 가 있다 (venv 모듈로 만들었기 때문). uv 로 만든 venv 는 pip 를 넣지 않으므로(`--seed` 옵션이 따로 있음, `uv venv --help` 11행) 지금의 `|| .venv/bin/pip` 폴백은 uv venv 에서 동작하지 않는다.
- E8 — `find . -name __pycache__ -not -path './.venv/*' -not -path '*/node_modules/*'` 결과 10개(`backend/app/**` 8개, `backend/tests`, `.claude/hooks`), `backend/__pycache__` 없음. `.pytest_cache`, `backend/.pytest_cache`, `frontend/tsconfig.tsbuildinfo`, `backend/tests/test_agentlens.db{,-wal,-shm}` 가 있다. `frontend/.gitignore:40-41` 이 `*.tsbuildinfo`, `next-env.d.ts` 를 제외한다.
- E9 — `docker context show` → `desktop-linux`. `docker compose version` → v5.5.0. `docker compose up --help` 에 `--wait`(61행), `--wait-timeout`(63행).
- E10 — `backend/app/main.py:18-22` 가 lifespan 안에서 `collect_all` 을 await. `backend/app/api/schedule.py:60, 92` 는 같은 수집을 `BackgroundTasks` 로 띄운다. `backend/app/collectors/manager.py:176-257`: `session` 인자를 쓰지 않고, `finally` 에서 `is_running = False`, `last_crawl_time` 은 성공 경로(236행)에서만 바뀐다. `manager.py:59-70` 의 `get_progress` 필드. `operations.md:290` 과 intent 37행: 첫 수집 시간은 측정하지 않았다.
- E11 — `docs/test-cases.md:12`: `ASGITransport` 는 lifespan 을 돌리지 않는다. `test-cases.md:1244`: lifespan 테스트 없음. `backend/tests/conftest.py:13-44`: autouse `init_db` 가 기사 id 1 을 넣는다. `grep` 결과 `backend/tests` 에서 `collect_all` 을 쓰는 곳은 `test_reset_and_delete.py:10` 의 `AsyncMock` 하나.
- E12 — `docker-compose.yml:38` `:ro`. `backend/app/config.py:161-173` `save_json_config` 는 `open(p, "w")` 제자리 쓰기. `backend/app/services/sources_service.py:102-123` 은 `.tmp` 에 쓰고 `replace()`. bind mount 지점 위 rename 이 `EBUSY` 라는 것은 Linux `rename(2)` 동작에 대한 기억이며 조회하지 않았다 (가정, V7 에서 먼저 재현. 우려 9).
- E13 — `.claude/hooks/sdlc_hook.py:247-249`: Bash 명령 문자열 전체를 `fnmatch` 로 `deploy_patterns` 와 비교하고 `RELEASE_APPROVAL` 이 없으면 막는다. `.claude/hooks/sdlc-config.json:10-16` 패턴. 루트 `CLAUDE.md:27` 은 승인 명령을 사람이 `!` 로 실행하게 하고 같은 hook 이 Claude 의 승인 명령을 막으므로, `!` 명령은 이 hook 을 거치지 않는다고 본다 (가정, 우려 1 의 제안이 기대는 점).
- E14 — `frontend/next.config.ts:21-28`: rewrite 대상 `INTERNAL_API_URL`, 기본 `http://127.0.0.1:8000`. `operations.md:292`: 기사 Ask AI 스트림은 `NEXT_PUBLIC_API_URL` 또는 `{브라우저 호스트}:8000` 에 직접 붙는다. `frontend/node_modules/next/dist/cli/next-dev.js:212` 주석 "If neither --port nor PORT were specified, it's okay to retry new ports" → `--port` 를 주면 다른 포트로 옮기지 않는다. `docker-compose.yml:15, 58` 의 `BACKEND_PORT`·`FRONTEND_PORT` 는 compose 가 루트 `.env` 에서 읽는 이름.
- E15 — `frontend/node_modules/next/dist/server/lib/start-server.js:416-429`: `next dev` 가 `agentRules !== false` 이면 에이전트 문서를 만들고 "Set `agentRules: false` in next.config to disable" 을 낸다. `generate-agent-files.js:90-118`: 두 파일이 없으면 `AGENTS.md`·`CLAUDE.md` 를 만든다. `git status`: `frontend/AGENTS.md`, `frontend/CLAUDE.md` 가 추적되지 않은 채 있다.
- E16 — 2026-11-08 읽기 전용 조회: 8000·3000·3001 LISTEN 없음, `agentlens` 컨테이너 없음, `agentlens` 이미지 없음, volume `agentlens-data` 있음.
- E17 — 12개 대상 `make -n` 이 모두 종료 0. 지금 Makefile 에 `+` 접두, `$(shell …)`, `$(MAKE)` 줄이 없다 (grep 종료 1) → T2 의 전제 단언.
- E18 — 지운 e2e 스크립트(`git show 0aab1bb^:scripts/test_theme_toggle.mjs` 앞부분): Chrome 경로, `BASE_URL = 'http://localhost:3001'`, 스크린숏 폴더 `/Users/wonyoung/.gemini/antigravity-cli/brain/…/scratch` 가 하드코딩되어 있다. Makefile 은 이 스크립트를 부르지 않았다 (intent 45행). `test-strategy.md:18, 58`: 화면 규칙은 `ui-audit.mjs`, E2E 테스트는 없다. 2026-11-06~07 `ui-redesign` 이 화면을 바꿨으므로 선택자가 맞지 않을 것으로 본다 (확인하지 않음, 가정).
- E19 — `docs/data-model.md:282-291`: DB 경로가 cwd 상대이고 `make collect`·로컬 backend·MCP 가 `backend/agentlens.db`, Docker 가 volume. `operations.md:295-296`: 여러 프로세스가 같은 SQLite 에 쓰고 `is_running` 이 프로세스 메모리에만 있다.
- E20 — `frontend/Dockerfile:11, 21` `corepack prepare pnpm@latest`, `frontend/package.json:40` `pnpm@12.3.4`, 베이스 `node:20-alpine`, 로컬 `node v24.11.1`, `pnpm 12.3.4`, lockfile `9.0`.
- E21 — `.gitignore:11-21` 이 모든 DB 파일을, `:24`, `:54` 가 `__pycache__/`, `.pytest_cache/` 를 제외한다. `test-strategy.md:22`: 테스트 DB 는 지우지 않아 쌓인다.
- E22 — 루트 `CLAUDE.md:6-9, 31` 과 `operations.md:31` 의 `make check` 서술 차이, 없는 `make reset-and-collect` (intent '문서와 make 불일치').
- E23 — PATH 의 `python3` 는 `/Library/Frameworks/Python.framework/Versions/3.11/bin/python3` (3.11.9), `python3.11` 있음, `uv python find 3.11` 이 `.venv/bin/python3` 를 찾는다.

## 넘겨받은 열린 질문
- `make test` 는 무엇을 하는가 → `make check` 와 같다 (`test: check`). 지운 `test.sh` 범위·e2e 를 넣지 않는다 (1.3, E2).
- `make dev` 구현 → `scripts/dev.sh` 를 새로 쓴다. backend `--reload --reload-dir app`, frontend 포트 3000 고정(바꾸려면 `DEV_FRONTEND_PORT`), 쓰이고 있으면 종료 1. 두 프로세스를 각자 프로세스 그룹으로 띄워 INT/TERM 에 그룹째 내리고, 한쪽이 죽으면 다른 쪽도 내린다 (1.2, E3·E5·E14).
- `scripts/` 를 되살리는가 → 디렉터리는 되살리되 `dev.sh`(새로 씀)와 `collect.py`(새 파일) 둘만 둔다. 나머지 명령은 Makefile 에 둔다. `reset` 은 게이트 때문에 Makefile 에 남긴다 (0절, 1.7, E13).
- 지운 e2e 스크립트 5개 → 되살리지 않는다. 다른 도구의 개인 폴더·Chrome 경로가 하드코딩되어 있고, Makefile 이 부르지 않았으며, 화면 검사는 `ui-audit.mjs` 가 맡는다 (E18).
- `make setup` 재실행과 인터프리터 → `.venv` 가 3.11 이면 건너뛰고, 아니면 `uv venv --clear --python 3.11` 또는 `python3.11 -m venv --clear`. PATH 의 `python3` 폴백을 없앤다 (1.1, E6·E7·E23).
- `make clean` 범위 → `.venv`, `node_modules`, `.next`, `tsconfig.tsbuildinfo`, 모든 `__pycache__`, 두 `.pytest_cache`, 테스트 DB. 두 `agentlens.db` 와 설정 파일, Docker 는 남긴다 (1.5, E8·E21).
- `make reset` 이 backend 가 없을 때 → 종료 1 과 "backend 가 없다, make dev 또는 make docker-up" 메시지. `already_running`·HTTP 오류·JSON 아님도 종료 1 (1.7).
- `make collect` 와 Docker DB → 이번에 다룬다. 실행 중인 backend 가 있으면 그 backend 에 API 로 수집시켜 그 DB(Docker 면 volume)를 채우고, 없으면 `backend/agentlens.db` 에 직접. 첫 줄에 모드와 대상을 출력하고 `COLLECT_MODE` 로 고정할 수 있다 (1.6, E19).
- `make docker-up` 첫 수집 대기와 `config.json :ro` → 첫 수집을 lifespan 백그라운드 태스크로 바꾸고(`backend/app/main.py`), `up -d --wait --wait-timeout` 으로 healthy 까지 기다린다. `config.json` 은 `:rw` 로 바꾸고, 소스 저장의 bind mount rename 문제도 고친다 (1.9, E9·E10·E12, 우려 4·9).
- `make docker-logs` 의 `-f` → 유지한다. 기본 `--tail=200` 을 더하고 `DOCKER_LOGS_ARGS` 로 바꿀 수 있다 (1.11).
- 데이터·설치물·컨테이너를 바꾸는 대상의 실행 확인 → 3절 V0~V9. 실데이터를 지키려고 scratchpad DB 사본·다른 포트(18000)를 쓰고 sha256 으로 데이터 파일이 그대로인지 본다. `reset` 은 사람 또는 `RELEASE_APPROVAL` 세션이 실행한다 (우려 1).
- 회귀 검사 위치와 내용 → `backend/tests/` 새 파일로 `make check` 안에 둔다. 대상 집합 = `.PHONY`, `make -n` 12개 성공(실행 위험 줄 부재를 먼저 단언), 참조 파일 존재·문법, `|| true` 부재, `reset` URL 변수 반영, `collect.py` 모드·완료 판정, lifespan 비동기, 소스 저장 대체 경로 (2절 T1~T8).
- 루트 `CLAUDE.md:31` 의 `make reset-and-collect` → 목록에서 뺀다. 그런 대상을 만들지 않는다 (1.7, E22).
