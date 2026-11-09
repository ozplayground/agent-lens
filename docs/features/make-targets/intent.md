# Intent: Makefile 대상 12개 전부 정상화

Author: wonyoung choi (요청), Claude (triage 정리)
Status: accepted
Approved-by: 자동 승인 (Claude) (2026-11-08)
Source: 실패한 빌드 — 로컬 `make dev` 종료 2 (`make: ./scripts/dev.sh: No such file or directory`), `make test` 종료 2 (`make: ./scripts/test.sh: No such file or directory`). 2026-11-08, 브랜치 `feat/ui-redesign`, HEAD `e3804da`. 원인 커밋 `0aab1bb` (`chore: frontend 에이전트 문서와 scripts 제거`, 2026-11-02)

## 문제
원작성자의 말:
- "make 모든 기능이 다 되어야 한다고"
- "수정하라고 내가 어제 시킨게 이건데 왜 아직 그대로냐고". 어제(2026-11-07) "수정해" 라고 했는데, 메인 세션은 `make check` 하나만 고쳤다 (기능 `backend-llm-test-isolation`).
- "수정해"
- "야 다고쳐. 완벽하게. 뭔 make 고치는게 이틀이나 걸릴일이냐"
- "다수정하라고 그럼 계획을 고쳐야 할거 아냐?"

### 이미 알려진 문제였다
- 루트 `CLAUDE.md` '명령' 절: "`make test`, `make dev` 는 지워진 `scripts/` 를 가리켜 지금 동작하지 않는다."
- `docs/known-issues.md` '테스트·운영': "`make dev`, `make test` 가 지워진 `scripts/` 를 가리킨다"
- `docs/operations.md` 'Makefile 타깃' 표(`make dev`·`make test` **깨짐**), '알려진 불일치·위험' 의 "깨진 make 타깃" (`.PHONY` 에 `collect`, `reset`, `docker-*` 누락 포함), "로컬 실행 경로 미정의"
- `docs/test-strategy.md:10`: "`make test`, `make dev` 는 지워진 `scripts/` 를 가리켜 동작하지 않는다."

문서에 적어 두기만 하고 고치지 않았다.

### 대상별 상태 (2026-11-08)
'실행' 은 메인 세션이 2026-11-08 에 돌린 결과다. 나머지는 실행하지 않고 `make -n`·코드·설정 읽기와 읽기 전용 `docker` 조회로 봤다.

| 대상 | 상태 | 증거 |
|---|---|---|
| `setup` | 종료 0, 오류 출력 있음 | 실행: 종료 0. `.venv` 가 있으면 `uv venv .venv` 가 `A virtual environment already exists … Use the --clear flag` 를 내고 `\|\| python3 -m venv .venv` 로 넘어간다 (uv 0.11.25, `Makefile:5`). 그 결과 `.venv/pyvenv.cfg` 의 `command` 가 `…/3.11/bin/python3 -m venv …/.venv` 로 남아 있다. 지금은 PATH 의 `python3` 가 3.11.9 라 같은 인터프리터지만, 폴백은 PATH 의 `python3` 판을 그대로 쓴다 |
| `dev` | 깨짐 | 실행: 종료 2, `make: ./scripts/dev.sh: No such file or directory` (`Makefile:9-10`). `scripts/` 가 없다 (`ls scripts` → `No such file or directory`) |
| `test` | 깨짐 | 실행: 종료 2, `make: ./scripts/test.sh: No such file or directory` (`Makefile:12-13`) |
| `build` | 동작 | 실행: 종료 0 (`cd frontend && pnpm build`) |
| `clean` | 실행 안 함. 일부만 지움 | `make -n clean` → `rm -rf .venv backend/__pycache__ frontend/.next frontend/node_modules` (`Makefile:18-19`). `backend/__pycache__` 는 없고(`ls` → 없음), 실제 캐시는 `backend/app/__pycache__`, `backend/app/*/__pycache__`, `backend/tests/__pycache__` 에 있어 지워지지 않는다 |
| `collect` | 실행 안 함. 명령 경로는 있음 | `make -n collect` → `cd backend && ../.venv/bin/python -c "… collector_manager.collect_all() …"` (`Makefile:21-23`). `DATABASE_URL` 기본값이 cwd 기준 `sqlite+aiosqlite:///./agentlens.db` (`backend/app/config.py:42`, `.env` 같음)라 `backend/agentlens.db` 에 쓴다. Docker 의 DB(volume `agentlens-data`)와는 별개다. `.PHONY` 에 없다 (`Makefile:1`) |
| `reset` | 실행 안 함. 실패를 숨김 | `make -n reset` → `curl -s -X POST http://localhost:8000/api/schedule/reset-and-collect \| python3 -m json.tool \|\| true` (`Makefile:25-27`). 엔드포인트는 있다 (`backend/app/api/schedule.py:69-70`). backend 가 떠 있지 않으면 `curl` 이 실패하고 `json.tool` 이 빈 입력에 실패해도 `\|\| true` 로 종료 0 이다 (operations.md '데이터 삭제' 표에 적혀 있음). `.PHONY` 에 없다. 게이트: `.claude/hooks/sdlc-config.json` `deploy_patterns` 의 `*make reset*` |
| `docker-build` | 동작 (메인 세션 결과). 이미지가 지금 없음 | 실행: 종료 0. 다만 2026-11-08 14:01 UTC 에 현재 docker context(`desktop-linux`)에서 `docker image ls --filter 'reference=*agentlens*'` 결과가 비어 있다. `docker compose config --images` 는 `agentlens-backend`, `agentlens-frontend` 를 기대한다. volume `agentlens-data` 는 2026-11-08T13:50:03Z 에 만들어졌다. 이미지가 어디로 갔는지는 확인하지 않았다 |
| `docker-up` | 미확인 (실행 거부됨) | `make -n` → `docker compose up -d`. `docker compose config -q` 종료 0. 포트 8000·3000·3001 에 LISTEN 중인 프로세스 없음, agentlens 컨테이너 없음. 코드로 본 위험: (1) DB 가 비면 lifespan 이 첫 수집을 끝낼 때까지 요청을 받지 않는다 (`backend/app/main.py:18-22`). backend healthcheck 는 `start_period 10s`, `interval 10s`, `retries 5` 이고 frontend 는 `condition: service_healthy` 로 기다린다 (`docker-compose.yml:42-47, 64-66`). 수집이 그보다 길면 frontend 가 뜨지 않을 수 있다 (operations.md '문제 해결' 에 적혀 있음, 소요 시간 미측정). (2) `config.json` 이 `:ro` 마운트라 설정 저장이 500 (`docker-compose.yml:38`, known-issues 에 있음). (3) 위 `docker-build` 이미지가 없으면 `up` 이 다시 빌드한다 |
| `docker-down` | 실행 안 함 | `make -n` → `docker compose down` (`Makefile:37-39`). volume 은 지우지 않는다. `.PHONY` 에 없다 |
| `docker-logs` | 실행 안 함 | `make -n` → `docker compose logs -f` (`Makefile:41-42`). `-f` 라 Ctrl-C 전까지 끝나지 않는다. `.PHONY` 에 없다 |
| `check` | 동작 | 실행: 종료 0 (`Makefile:45-49`, `backend-llm-test-isolation` 에서 고침) |

### 지워진 스크립트 (`git show 0aab1bb^:scripts/<파일>`)
- `scripts/dev.sh` (42줄): `.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` 을 `backend/` 에서 백그라운드로 띄우고, 3000 이 쓰이면 3001 로 `pnpm dev --port <포트>` 를 띄운 뒤 `wait`. SIGINT·SIGTERM·EXIT 에 `kill $(jobs -p)`.
- `scripts/test.sh` (19줄): `backend/` 에서 `.venv/bin/pytest -v tests/`, `frontend/` 에서 `pnpm tsc --noEmit`. 지금 `make check` 는 여기에 vitest·eslint 를 더한 것이다.
- 같은 커밋에서 브라우저 e2e 스크립트 5개도 지워졌다: `test_ask_ai_e2e.mjs`, `test_briefing_e2e.mjs`, `test_headless_browser.mjs`, `test_modal_reset_e2e.mjs`, `test_theme_toggle.mjs` (합 859줄). Makefile 은 이것들을 부르지 않았다.
- Makefile 은 그 뒤로 바뀌지 않았다 (`git log -- Makefile`: `e7863a1`, `18f46fc`).

### 문서와 make 불일치 (이번 진단에서 찾음)
- 루트 `CLAUDE.md:9` 는 "`make check` 는 `.env` 의 LLM 키로 외부 호출을 하고, backend 테스트가 git 이 추적하는 루트 `config.json`·`sources.json` 을 고친다 (격리는 미정…)" 라고 적는다. `docs/operations.md:31` 은 `backend-llm-test-isolation` 뒤로 LLM 호출을 흉내 내고 설정 파일을 임시 사본에 쓴다고 적는다. 둘이 다르다.
- 루트 `CLAUDE.md:31` 의 파괴적 명령 목록에 `make reset-and-collect` 가 있는데 Makefile 에 그런 대상은 없다. 게이트 패턴 `*make reset*` 이 우연히 같이 잡는다.

## 기대 결과
- Makefile 대상 12개(`setup`, `dev`, `test`, `build`, `clean`, `collect`, `reset`, `docker-build`, `docker-up`, `docker-down`, `docker-logs`, `check`)가 모두 깨지지 않고 오류 출력 없이 동작한다. 종료 코드가 0 이어도 오류를 출력하는 것(예: `setup` 재실행 때 `uv venv` 오류)도 고칠 대상이다.
- 위 '대상별 상태' 와 '문서와 make 불일치' 에서 찾은 문제를 모두 고친다 (`setup` 재실행, `clean` 이 남기는 캐시, `reset` 이 실패를 숨김, `.PHONY` 누락, `docker-up` 위험, 문서 불일치).
- 루트 `CLAUDE.md` '명령' 절, `docs/operations.md`, `docs/test-strategy.md`, `docs/known-issues.md` 가 고친 make 와 맞는다. 고친 문제의 known-issues 행은 지운다.
- 12개 대상이 모두 동작하는 것을 실행 결과로 확인한다. 확인 방법은 plan 의 '증명' 이 정한다.

## 영향받는 사용자와 시스템
- 개발자(본인): 로컬 실행(`make dev`)과 테스트(`make test`) 진입점이 없다. 문서는 대신 Docker 나 손으로 친 명령을 안내한다.
- SDLC 하네스: `/verify-change`·`/prepare-release` 가 `make check` 와 실행 절차를 읽는다. 게이트(`deploy_patterns`)가 `make reset` 을 잡는다.
- 시스템: `Makefile`, (선택에 따라) `scripts/`, `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `backend/app/main.py`(첫 수집 대기), `.claude/hooks/sdlc-config.json`, 루트 `CLAUDE.md`, `docs/operations.md`, `docs/test-strategy.md`, `docs/known-issues.md`.

## 제약
- 원작성자: "다 고쳐. 완벽하게". 12개 전부가 범위다. 일부만 고치고 나머지를 문서로 남기지 않는다.
- 저장소 규칙: 테스트를 고쳐 통과시키지 않는다. `make check` 는 지금 통과하므로 그대로 유지한다.
- 파괴적 명령(`make reset`, `curl … reset-and-collect`)의 `RELEASE_APPROVAL` 게이트는 유지한다.
- `backend/app/**`, `frontend/src/**` 를 고치게 되면 승인된 plan.md 의 '변경 파일' 에 있어야 한다.

## 열린 질문
원작성자는 "다 고쳐, 완벽하게" 로 답했다. 아래는 원작성자에게 다시 묻지 않고 spec 이 정할 설계 선택이다.
- `make test` 는 무엇을 하는가 (`make check` 와 같게 할지, 지워진 `test.sh` 범위로 할지, 지워진 e2e 스크립트까지 포함할지).
- `make dev` 를 어떻게 구현하는가 (지워진 `dev.sh` 를 되살릴지, Makefile 안에 명령을 둘지). backend `--reload` 여부, frontend 포트(3000/3001 자동 선택 또는 고정), 종료 때 두 프로세스를 함께 내리는 방법은.
- `scripts/` 디렉터리를 되살리는가, 모든 명령을 Makefile 에 두는가.
- 지워진 브라우저 e2e 스크립트 5개를 되살리는가, 범위 밖으로 두는가.
- `make setup` 재실행 때 기존 `.venv` 를 어떻게 다루는가 (있으면 건너뜀, 지우고 다시 만듦 등). 폴백 `python3 -m venv` 가 3.11 이 아닌 인터프리터를 쓰지 않게 할 것인가.
- `make clean` 이 지울 범위는 무엇인가 (`__pycache__` 전체, `.pytest_cache`, 두 `agentlens.db` 는 데이터라 제외하는지).
- `make reset` 이 backend 가 떠 있지 않을 때 어떤 종료 코드와 메시지를 내는가.
- `make collect` 가 쓰는 DB 와 Docker volume DB 가 다른 것을 이번에 다루는가, 안내만 하는가.
- `make docker-up` 이 첫 수집 대기 때문에 frontend 를 못 띄우는 경우를 어떻게 막는가 (healthcheck 시간, 첫 수집을 비동기로 돌림, `up` 의 `--wait` 등). `config.json` `:ro` 마운트를 이번에 바꾸는가.
- `make docker-logs` 는 `-f` 로 계속 따라가는 지금 동작을 유지하는가.
- `clean`·`reset`·`collect`·`docker-*` 처럼 데이터·설치물·컨테이너를 바꾸는 대상을 어떻게 실행해 확인하는가.
- 회귀 검사를 어디에 두는가 (`make check` 안, 별도 테스트), 무엇을 확인하는가 (참조 파일 존재, `make -n` 성공, `.PHONY` 목록).
- 루트 `CLAUDE.md:31` 의 없는 대상 `make reset-and-collect` 를 목록에서 뺄지, 그런 대상을 만들지.
