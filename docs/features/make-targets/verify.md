# Verify: make 대상 12개가 오류 없이 동작

Plan: ./plan.md
Status: approved
Approved-by: 자동 승인 (Claude) (2026-11-09)
Commit: 00e2c0a

## 검사 명령
- `make check` → 종료 코드 0 (V8 의 `make clean` → `make setup` 뒤 실행, `V8-check.log`. 결과 줄: `217 passed in 16.10s`, `Test Files  52 passed (52)`, `Tests  649 passed (649)`)
```
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
eslint 경고 41개는 기존 테스트 파일의 미사용 변수이고 이 기능과 무관하다. 실행 앞뒤 `git status --porcelain` 이 같다 (`?? reports/` 하나).

## 증명 항목 (verifier 판정)
2026-11-09 21:10~21:17 KST, HEAD 00e2c0a. 로그 폴더: `/private/tmp/claude-501/-Users-wonyoung-workspace-ozplayground-agentlens/d9f16211-c83a-42a0-ad74-fe86247a152d/scratchpad/verify/logs/`

| 증명 항목 | 결과 | 근거 (명령, 출력) |
|---|---|---|
| 증명 1 (make check, R13) | 통과 | `make check` 종료 0. backend `217 passed` (= 174 + 새 테스트 43, `pytest --collect-only` 로 확인), frontend `52 passed` 파일·`649 passed` 테스트, eslint `0 errors, 41 warnings`, tsc 통과. 앞뒤 `git status --porcelain` diff 없음. O 규칙 0건 (`V2-check.log`) |
| 증명 2 (테스트 먼저) | 통과 | 테스트 커밋이 코드 커밋보다 앞선다: `39f2f68` → `c949816`, `bc0f699` → `acd35b0`, `49e6b1a` → `0a2e714`, `517c226`(T5b) → `f9394fd`. 테스트 커밋 뒤 단언 변경 없음 (`test_make_targets.py` 는 `-` 줄 0개, T5b 추가만). task 02 `10 failed, 20 passed`, 04 `5 errors` FileNotFoundError, 05 `TimeoutError`·`assert False is True` 기록 |
| 증명 3 (기존 테스트·범위) | 부분 실패 | `git diff --name-status 0f2b83b -- backend/tests/` 는 `A` 4줄뿐 (통과). '변경 파일' 밖 경로: `docs/functional-spec/02-ai-chat.md`, `05-sources-and-research.md`, `06-mcp-server.md`, `07-ui-common.md`, `docs/ui-spec.md` (모두 00e2c0a, 22+/22-, `Updated:` 와 줄 번호 참조 정정. 05 SRC-01 7번은 EBUSY 제자리 쓰기 문장 추가). 코드·테스트 범위 밖 변경은 없다 |
| 증명 4 (문서 grep, R15) | 통과 | `git grep -nE 'scripts/test\.sh\|지워진 .scripts/.\|make[ ]reset-and-collect\|config\.json:ro\|격리는 미정\|\*\*깨짐\*\*' -- CLAUDE.md docs ':!docs/features'` 출력 없음, `grep_exit=1` |
| V0 | 통과 | 포트 8000·3000·3001·13000·18000 LISTEN 0, `agentlens` 컨테이너 없음, sha256 6개가 단계 1 값과 같다. 참고: 두 DB 옆 `-wal`·`-shm` (0바이트, gitignore, 잡은 프로세스 없음) |
| V9 | 통과 | 12개 `make -n` 모두 `exit=0`, O 규칙 0건 (`V9.log`) |
| V1 | 통과 | `make setup` 두 번 종료 0, 둘째 `==> .venv 이미 있음 (Python 3.11.9)`, `pyvenv.cfg` sha256 세 시점 같음. `.venv` 를 옮긴 뒤 셋째: `==> uv 로 .venv 를 Python 3.11 로 만든다`, 3.11.9, `uv = 0.11.25`. 원래 `.venv` 복구 (`V1-1.log`~`V1-3.log`) |
| V2 | 통과 | `make check`·`make test` 둘 다 종료 0, `217 passed`·`649 passed`, 각각 앞뒤 git status 차이 없음 (`V2-check.log`, `V2-test.log`) |
| V3 | 통과 | `make build` 종료 0, O 규칙 0건 (`V3.log`) |
| V4 (a)(b) make dev | 통과 (우려 3 기록) | `ready True after_sec 1.3`, 세 URL 200. SIGINT 뒤 `returncode -2 stop_sec 0.2`, `[dev] 중지했다`, `Interrupt` 줄 없음, 남은 것 없음 (`V4a.log`) |
| V4 dev.sh 직접 | 통과 | `returncode 0 stop_sec 0.2` (`V4a-script.log`) |
| V4 SIGTERM | 통과 | `returncode -15 stop_sec 0.2`, `[dev] 중지했다` (`V4a-term.log`) |
| V4 (c) | 통과 (합의한 판정) | make 종료 2, `[dev] 포트 8000 사용 중 (Docker 가 떠 있으면 make docker-down)` + `make: *** [dev] Error 1`. `./scripts/dev.sh` 직접 종료 1 (`V4c.log`, `V4c-script.log`) |
| V4 (d) 빈 DB | 통과 | `ready True after_sec 1.0`, body `"running":true`, `[AgentLens] Initial database seed collection (백그라운드로)...`, SIGINT 뒤 남은 것 없음, `frontend/AGENTS.md`·`CLAUDE.md` 없음 (R14) (`V4d.log`) |
| V5 (a)(b) | 통과 (다시 돌리지 않음, 단계 6 근거) | `git diff --stat 2a0cf81 HEAD -- scripts/collect.py backend/app Makefile` → Makefile 의 `docker-logs` 레시피 7줄만 바뀜, `collect` 대상 영향 없음. 단계 6 로그: (a) `직접 모드: …/step6/collect.db`, `수집 완료: 수집 250건, 저장 107건`. (b) `API 모드: http://127.0.0.1:18000`, `during_exit 0`, status 최근 로그 id 115 `success` 250/108 |
| V5 (c) | 통과 (합의한 판정) | make 종료 2, `make collect: http://127.0.0.1:9 에 backend 가 없다` + `make: *** [collect] Error 1`. 스크립트 직접 종료 1 (`V5c.log`) |
| V5 (d) | 통과 | DB sha256 두 개가 V0 과 같다 |
| V6 | 미실행 (게이트), 정적 확인만 | `make -n reset AGENTLENS_API_URL=http://127.0.0.1:9` 종료 0, 출력에 `127.0.0.1:9`, `localhost:8000` 없음, `/health` 사전 확인·실패 메시지·`-X POST …/api/schedule/reset-and-collect`·JSON 아님/`status != started` 종료 1 경로 있음. `test_t5_reset_uses_api_url_variable PASSED` |
| V7 build | 통과 | `make docker-build` 종료 0, `docker image inspect` 종료 0 (`V7-build.log`) |
| V7 up | 통과 | 종료 0 (11초), 두 서비스 `(healthy)`, `/health`·frontend `/api/health` healthy (`V7-up.log`) |
| V7 설정 저장 | 통과 | GET 그대로 POST → `200`, `git diff --stat config.json` 비어 있음 |
| V7 소스 저장 | 통과 (합의한 판정) | 토글 두 번 모두 `200`. 첫 토글 `"enabled": true` → `false`, 둘째 뒤 diff 는 `updated_at` 한 줄. `Failed to write sources` 없음, 대체 경로 경고 `[Errno 16] Device or resource busy` 2줄, `/app/sources.tmp` 없음 |
| V7 되돌리기 | 통과 | `git checkout -- config.json sources.json` 뒤 `?? reports/` 만 |
| V7 logs 20 | 통과 | 종료 0, 20줄, O 규칙 0건 |
| V7 logs -f SIGINT | 실패 (make 종료 기준) | 그룹 SIGINT: `returncode -2 stop_sec 0.0`, 끝 줄 `==> 로그 보기를 멈췄다`, `Error 130`·`Interrupt` 없음, O 규칙 0건 (`V7-logsf.log`). 자식에게만 SIGINT: make `returncode 0`, 같은 끝 줄 (`V7-logsf-childonly.log`) |
| V7 down | 통과 | 두 번 모두 종료 0, 컨테이너 없음, volume `agentlens-data` 있음 |
| V8 | 통과 | `make clean` 종료 0, 지울 목록 7개 모두 없음, `__pycache__` 0, 남길 목록 sha256 diff 없음. 이어서 `make setup` 종료 0 (새 .venv 3.11.9) → `make check` 종료 0. git status 기준선과 같음 (`V8.log`, `V8-setup.log`, `V8-check.log`) |

### 메인 세션 기록: V7 logs -f SIGINT 판정
verifier 의 '실패' 는 메인 세션이 넘긴 기준 "make 종료 0" 에 대한 판정이다. 그 기준은 잘못 넘긴 것이다. 터미널 Ctrl-C 는 make 자신에게도 SIGINT 를 보내 make 가 시그널로 끝나며(GNU Make 3.81), 이는 Makefile 로 바꿀 수 없다. `docs/operations.md:45` 도 "레시피는 0 으로 끝나고 make 는 `Error` 줄을 내지 않는다. 셸이 보는 make 의 종료 상태는 SIGINT 종료(130)다" 로 적고 있다. f9394fd 가 고치려던 것(레시피 실패로 보고되는 `make: *** [docker-logs] Error 130` 줄)은 없어졌고, 레시피는 자식 SIGINT 에서 0 을 낸다. 같은 동작인 `make dev`(V4 `returncode -2`, 통과)와 같은 기준으로 받아들인다.

### 증명 6: spec 우려 기록
- 우려 1 (V6 을 누가 돌렸나): 아무도 돌리지 않았다. 메인·단계 6·verifier 세션 모두 `RELEASE_APPROVAL` 이 없어 hook 이 막는다. 실제 (a) started 종료 0, (b) already_running 종료 1, (c) backend 없음 종료 1 경로는 확인되지 않았다.
- 우려 3 (SIGINT 출력): `make dev` 는 make 종료 -2, `Interrupt` 줄 없음, `[dev] 중지했다`. `make docker-logs -f` 는 make 종료 -2, `==> 로그 보기를 멈췄다`, `Error 130`·`Interrupt` 줄 없음.
- 우려 6·7 (외부 호출, volume): V4 (d) 빈 DB 첫 수집이 백그라운드로 시작돼 약 1초 뒤 취소됐다 (외부 요청이 나갔을 수 있다). V5 (a)(b) 는 단계 6 에서 실제 외부 수집을 두 번 했고 이번에는 돌리지 않았다. V7 은 volume 에 기사가 있어 첫 수집이 돌지 않았고, 떠 있던 동안 스케줄 수집·Deep Research 로그가 없다. `make check` 3회는 스크래퍼·Notion·SMTP 를 실제로 부른다. volume `agentlens-data` 는 남아 있다.
- 우려 9 (EBUSY): 고친 이미지에서도 bind mount 위 rename 은 `[Errno 16] Device or resource busy` 를 내고, 제자리 쓰기 대체 경로가 저장을 성공시킨다 (경고 한 줄, `.tmp` 없음).

## plan 범위 밖 변경
- `docs/functional-spec/02-ai-chat.md`, `docs/functional-spec/05-sources-and-research.md`, `docs/functional-spec/06-mcp-server.md`, `docs/functional-spec/07-ui-common.md`, `docs/ui-spec.md` (00e2c0a): 이 기능의 코드 변경(`main.py`, `sources_service.py`, `next.config.ts`)으로 밀린 줄 번호 참조와 `Updated:` 를 고쳤고, 05 에는 EBUSY 제자리 쓰기 동작 한 문장, `ui-spec.md` 에는 `agentRules: false` 설정을 더했다. 상세 문서 반영 규칙(코드가 바뀌면 해당 상세 문서를 지금 코드대로 고친다)에 따른 문서 변경이고, 코드·테스트는 범위 밖 변경이 없다.

## 남은 위험
- V6 (reset 대상 실제 실행) 미검증. `RELEASE_APPROVAL` 세션이나 사람이 plan V6 명령으로 확인해야 한다.
- `make dev`·`make docker-logs` 를 Ctrl-C 로 멈추면 셸이 보는 make 종료 상태는 SIGINT 종료다 (오류 출력은 없음).
- 레시피 실패 때 make 자체 종료 코드는 2 다 (스크립트는 1 과 원인 메시지).
- Docker 에서 `config.json` 이 `:rw` 라 인증 없는 API 로 설정 파일을 바꿀 수 있다 (기존 known-issues: 인증 없음·CORS `*`, spec 우려 4).
- `toggle_source` 는 저장에 실패해도 200 을 돌려준다 (범위 밖, known-issues 후보).
- API 모드 `make collect` 는 수집 시작 전 backend 오류 때 `COLLECT_TIMEOUT` 까지 기다린다. backend `step_message` 를 그대로 출력해 이모지(`🎉 수집 완료!`)가 나온다.
