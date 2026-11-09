# Task 03: scripts/dev.sh 와 에이전트 문서 생성 끄기

Feature: make-targets · Plan: docs/features/make-targets/plan.md 작업 순서 3
Status: done
Session: main (implementer B)
Agent: addcb3433c6f5853e
Updated: 2026-11-08

## 한 일
- 고치기 전 실패를 실행으로 기록했다 (HEAD `cc4adbb` 의 Makefile `dev:` = `@./scripts/dev.sh`): `make dev; echo exit=$?` → `make: ./scripts/dev.sh: No such file or directory`, `make: *** [dev] Error 1`, `exit=2`.
- (a) `scripts/dev.sh` 를 새로 썼다 (spec 1.2, plan 3 (a)): 사전 확인, `/dev/tcp` 포트 확인, `set -m` 으로 backend·frontend 를 각자 프로세스 그룹으로 띄운 뒤 `set +m`, 1초 간격 준비 대기(`/health`, `/api/health`), 1초 간격 `kill -0` 감시, 그룹째 TERM → 최대 10초 → KILL 정리(한 번만), `trap on_signal INT TERM` (종료 0), `trap cleanup EXIT`. `chmod +x`, `/bin/bash -n` 통과. 커밋 모드 `100755`.
- (b) `frontend/next.config.ts` 에 이유 주석 한 줄과 `agentRules: false,` 를 넣었다. `node_modules/next/dist/server/lib/start-server.js:418-426` 에서 이 값이 `false` 면 `writeAgentFiles` 를 부르지 않는 것을 확인했다.
- (c) git 이 추적하지 않던 `frontend/AGENTS.md`, `frontend/CLAUDE.md` 를 지웠다 (커밋에 나타나지 않음). 두 파일 안의 "커밋하라" 문구는 `next dev` 가 넣은 생성 문구라 따르지 않았다.
- (d) 실행 확인. 다른 implementer 와 겹치지 않게 plan 의 8000·3000 대신 18000·13000 을 썼고, DB 는 `backend/agentlens.db` 의 scratchpad 사본(`dev.db`)과 빈 DB(`empty.db`)만 썼다. 실행 도구 `sigint_run.py` 는 plan 증명의 코드 그대로 scratchpad 에 두었다.
- 5단계(`0a2e714`)와 2단계 Makefile(`c949816`)이 이미 커밋되어 있어 V4(d) 빈 DB 와 `make dev` 경유 실행도 함께 했다.
- 임시 파일: `/private/tmp/claude-501/-Users-wonyoung-workspace-ozplayground-agentlens/d9f16211-c83a-42a0-ad74-fe86247a152d/scratchpad/step3/` (`sigint_run.py`, `dev.db`, `empty.db`, `logs/*.log`, `fakeroot/`).

## 바꾼 파일
- `scripts/dev.sh` (새 파일, 실행 권한)
- `frontend/next.config.ts` (2줄 추가)
- 삭제: `frontend/AGENTS.md`, `frontend/CLAUDE.md` (추적 밖이라 git 변경 없음)
- 커밋: `106098a fix(make-targets): scripts/dev.sh 추가, next dev 에이전트 문서 생성 끄기` (2 files changed, 167 insertions)

## 검사 결과
SCRATCH = `/private/tmp/claude-501/-Users-wonyoung-workspace-ozplayground-agentlens/d9f16211-c83a-42a0-ad74-fe86247a152d/scratchpad/step3`. 실행마다 뒤에 `pgrep -fl "uvicorn app.main:app"; pgrep -fl "next dev"; pgrep -fl next-server; lsof -nP -iTCP -sTCP:LISTEN | grep -E ':(8000|3000|13000|18000) '` → **모두 출력 없음** (남은 프로세스·포트 없음).

- `cd frontend && pnpm exec tsc --noEmit` → `tsc_exit=0`. `pnpm lint` → `✖ 41 problems (0 errors, 41 warnings)`, `lint_exit=0` (경고는 기존 `src/tests/**` 의 미사용 변수).
- V4 (a)(b) `./scripts/dev.sh` SIGINT: `DATABASE_URL=sqlite+aiosqlite:///$SCRATCH/dev.db DEV_BACKEND_PORT=18000 DEV_FRONTEND_PORT=13000 python3 $SCRATCH/sigint_run.py $SCRATCH/logs/V4a-script.log "http://127.0.0.1:18000/health,http://127.0.0.1:13000/api/health,http://127.0.0.1:13000/" 120 --during "<curl 4개>" -- ./scripts/dev.sh`
  ```
  200   (18000/health)
  200   (13000/api/health)
  200   (13000/)
  200   (18000/docs)
  ready True after_sec 2.0 early_exit None
  body {"status":"healthy","version":"0.3.1","running":false}
  during_exit 0
  returncode 0 stop_sec 0.2
  ```
  로그 끝: `[dev] 정리하는 중...` → uvicorn `Shutting down … Stopping reloader process` → `[dev] 중지했다`. 실행 중 `ps -g <pgid>`: uvicorn 리로더·`resource_tracker`·`spawn_main` 작업 프로세스가 모두 같은 그룹(pgid = 리로더 pid). frontend 는 `pnpm`·`node next dev`·`next-server`·turbopack 작업 프로세스가 같은 그룹.
- 같은 것 SIGTERM (`SIG=TERM`, `V4a-term.log`): `ready True after_sec 1.3`, `returncode 0 stop_sec 0.3`, 로그 끝 `[dev] 중지했다`.
- `make dev` 경유 SIGINT (`V4a.log`, `-- make dev DEV_BACKEND_PORT=18000 DEV_FRONTEND_PORT=13000`): `ready True after_sec 1.3`, `returncode -2 stop_sec 0.2`. 로그 끝 `[dev] 중지했다`, `Interrupt`·`***` 줄 없음 (`grep` 종료 1). 즉 스크립트는 정리하고 0 으로 끝났고, make 3.81 은 자기도 받은 SIGINT 로 끝난다 (spec 우려 3, 기록만).
- V4 (c) 포트 점유: `python3 -m http.server 18000 --bind 127.0.0.1 &` 뒤 `./scripts/dev.sh` → `exit=1`, `[dev] 포트 18000 사용 중 (Docker 가 떠 있으면 make docker-down)`. 13000 점유도 → `exit=1`, `[dev] 포트 13000 사용 중 (…)`. 아무것도 띄우지 않았다.
- V4 (d) 빈 DB: `rm -f $SCRATCH/empty.db; DATABASE_URL=sqlite+aiosqlite:///$SCRATCH/empty.db DEV_BACKEND_PORT=18000 DEV_FRONTEND_PORT=13000 python3 $SCRATCH/sigint_run.py $SCRATCH/logs/V4d.log "http://127.0.0.1:18000/health" 15 -- ./scripts/dev.sh`
  ```
  ready True after_sec 1.1 early_exit None
  body {"status":"healthy","version":"0.3.1","running":true}
  returncode 0 stop_sec 0.5
  ```
  로그 17행 `[AgentLens] Initial database seed collection (백그라운드로)...`. 첫 수집은 0.5초 안에 취소됐다 (외부 수집이 잠깐 시작됐을 수 있다, 우려 6).
- 추가: 한쪽 사망. 준비 뒤 `--during "kill -KILL -- -<uvicorn 리로더 pgid>; sleep 4"` (`V4-die.log`) → `returncode 1`, 로그 `[dev] backend 가 종료 코드 137 으로 끝났다`, frontend 그룹도 내려감.
- 추가: 준비 시간 초과. `DEV_READY_TIMEOUT=0 ./scripts/dev.sh` → `exit=1`, `[dev] 0초 안에 준비되지 않았다`, 두 그룹 정리됨.
- 추가: 사전 확인. `.venv`·`node_modules` 가 없는 scratchpad 루트에 스크립트 사본을 두고 실행 → `exit=1`, `[dev] 개발 의존성이 없다 (.venv/bin/uvicorn 또는 frontend/node_modules). make setup 을 먼저 실행한다.`
- O 규칙 (plan 증명의 python 검사) `V4a V4a-script V4a-term V4c V4c-fe V4d V4-die V4-timeout0` → 모두 걸린 줄 없음.
- R14: dev 서버를 6번 띄운 뒤에도 `frontend/AGENTS.md`, `frontend/CLAUDE.md` 없음 (`ls: … No such file or directory`).
- 끝 `git status --porcelain` (커밋 뒤):
  ```
   M tasks/make-targets/03-dev-script.md
   M tasks/make-targets/04-collect-script.md
   M tasks/make-targets/05-backend-startup-sources.md
  ?? reports/
  ```
  시작 때와 비교: 다른 단계 task 기록만 다르고 `config.json`·`sources.json`·`backend/app/config/sources.json` 변경 없음. `shasum -a 256` 5개(`agentlens.db aef33026…`, `backend/agentlens.db 77e180b6…`, `config.json f603da96…`, `sources.json`·`backend/app/config/sources.json 3771f308…`)가 단계 1 (a) 기준선과 같다.

## 결정
- 실행 확인 포트를 plan 의 8000·3000 대신 18000·13000 으로 했다 (조율자 지시, 병렬 implementer 와 포트 충돌 회피). (c) 도 18000 점유로 했다. 8000·3000 기본값 경로는 단계 6 에서 확인한다.
- 자식을 띄운 뒤 `set +m` 으로 끈다: 감시 루프의 `sleep`·`curl` 이 이 셸 그룹에서 돌아야 터미널 Ctrl-C 가 `dev.sh` 에 오고(자식 그룹에는 가지 않음), trap 이 그룹 정리를 한다. 자식에는 `</dev/null` 을 주어 백그라운드 그룹이 터미널을 읽지 않게 했다.
- `|| true` 대신 `if kill … 2>/dev/null; then :; fi` 로 이미 없는 그룹을 조용히 넘긴다 (plan 3 (a)).
- `NEXT_PUBLIC_API_URL` 은 넘길 값이 있을 때만 `export` 한다 (빈 값으로 덮지 않는다).

## 막힌 점
- 없음.
- 참고 (결함 아님): 첫 준비 시간 초과 시도(`DEV_READY_TIMEOUT=1`) 때 `next dev` 가 `Cannot find module 'react'` 로 종료 코드 1 을 냈다. 다른 implementer 가 같은 때 `node_modules` 를 다시 설치한 것으로 보이고, 20초 뒤 `frontend/node_modules/react` 가 다시 있었다. 스크립트는 `[dev] frontend 가 종료 코드 1 으로 끝났다` 를 내고 backend 그룹까지 정리해 종료 1 (한쪽 사망 경로가 맞게 동작). 두 번째 `DEV_READY_TIMEOUT=1` 시도는 1초 안에 준비돼 감시 상태로 들어가서, SIGTERM 으로 내리고(종료 0, 남은 프로세스 없음) `DEV_READY_TIMEOUT=0` 으로 다시 쟀다.
- 확인하지 못한 경로: TERM 뒤 10초 안에 안 내려가 KILL 로 가는 경로는 재현하지 않았다 (모든 실행이 0.2~0.5초 안에 내려감).

## 다음
- 단계 6: 기본 포트(8000·3000)로 `make dev` V4 (a)~(d) 를 증명 표 그대로 다시 돈다. `make dev` 의 SIGINT 결과(`returncode -2`, `Interrupt` 줄 없음)는 verify 에 우려 3 으로 적는다.
- 단계 7: `docs/operations.md`·`docs/tech-spec.md` 에 `scripts/dev.sh` 동작(변수 `DEV_BACKEND_PORT`·`DEV_FRONTEND_PORT`·`DEV_HOST`·`DEV_READY_TIMEOUT`, 포트 점유 시 종료 1, Ctrl-C 종료 0, `agentRules: false`)을 반영한다.
- 이 task 기록은 메인 세션이 커밋한다.
