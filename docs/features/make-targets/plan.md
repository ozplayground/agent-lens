# Plan: Makefile 대상 12개 전부 정상화

Spec: ./spec.md
Status: approved
Approved-by: 자동 승인 (Claude) (2026-11-08)
Type: bugfix

## 시작 전 기준선 (2026-11-08, 브랜치 `refactoring`, HEAD `0f2b83b`, 이 plan 작성 때 측정)
- `cd backend && ../.venv/bin/pytest --collect-only -q tests/` → `174 tests collected` (테스트 파일 17개).
- `git status --porcelain` → `?? frontend/AGENTS.md`, `?? frontend/CLAUDE.md`, `?? reports/` (`reports/` 는 이 기능과 무관하다. 건드리지 않는다).
- `scripts/` 없음. Makefile 은 `.PHONY` 에 5개만 있고 `|| true`·`config.json:ro` 가 있다 (spec E1·E17).
- Docker: context `desktop-linux`, `agentlens` 이미지 없음, volume `agentlens-data` 있음, `agentlens` 컨테이너 없음.
- 데이터 파일: `agentlens.db` (약 11MB), `backend/agentlens.db` (약 12.6MB). `-wal`·`-shm` 없음.
- 루트 `.env` 에 `DATABASE_URL=`, `NEXT_PUBLIC_API_URL=`, `FRONTEND_PORT=` 줄이 있다 (값은 읽지 않았다). `FRONTEND_PORT` 가 비어 있지 않으면 compose 의 frontend 공개 포트가 3001 이 아니다 → Docker 확인은 `docker compose port` 로 실제 포트를 찾는다.
- 설치판: GNU Make 3.81, `/bin/bash` 3.2.57, Python 3.11.9 (`.venv`), `pytest-asyncio 1.4.0` (`asyncio_mode = auto`), Next 의 `NextConfig` 타입에 `agentRules?: boolean` 이 있다 (`frontend/node_modules/next/dist/server/config-shared.d.ts:1574`). 터미널 없이 띄운 bash 에서 `set -m` 이 자식을 따로 프로세스 그룹으로 만드는 것을 확인했다 (자식 pid = pgid, 오류 출력 없음).

### spec 을 읽다가 찾은 사실 (범위는 바꾸지 않는다)
- **소스 토글은 저장에 실패해도 200 이다.** `sources_service.toggle_source` 는 `save_sources` 의 반환값을 버리고 `modified` 를 돌려준다 (`backend/app/services/sources_service.py:182-184`). 그래서 Docker 에서 `PATCH /api/sources/rss/<id>/toggle` 은 저장이 실패해도 200 이고, 실패는 backend 로그 `Failed to write sources to /app/sources.json: …` 와 파일 내용이 그대로인 것으로만 보인다. spec V7 의 '소스 토글 200' 은 이 결함을 가르지 못하므로, 이 plan 의 재현(단계 1)과 증명(V7)은 **파일 내용 변화와 로그**로 판정한다. `toggle_source` 의 반환값 결함 자체는 spec 범위 밖이라 고치지 않는다 (verify 에 적고 known-issues 후보로 넘긴다).
- `POST /api/briefing/settings` 는 `save_json_config` 가 False 를 돌려주면 500 이다 (spec 1.9). 이것은 응답 코드로 판정할 수 있다.

## 변경 파일
경로 게이트 대상 (`backend/app/**`, implementer 만 고친다):
- `backend/app/main.py` — lifespan: 기사 0건이면 `collector_manager.collect_all()` 을 `asyncio.create_task` 로 띄우고 바로 `yield`, 종료 때 끝나지 않은 태스크를 `cancel()` 하고 기다림. `session=s` 인자 제거, 시작 로그에 "백그라운드로" (spec 1.9, R10)
- `backend/app/services/sources_service.py` — `save_sources`: `temp_path.replace(p)` 가 `OSError` 를 내면 대상 파일에 제자리로 쓰고 임시 파일을 지운다 (spec 1.9, 우려 9). **단계 1 에서 EBUSY 가 재현되지 않으면 이 줄과 `test_sources_write_fallback.py` 를 빼고 plan 을 고쳐 재승인받는다**

새 회귀 테스트 (게이트 밖, 범위를 밝힌다. spec 2절 T1~T8):
- `backend/tests/test_make_targets.py` — T1~T5 (대상 집합 = `.PHONY`, `SHELL`, 위험 줄 부재 뒤 `make -n` 12개, `test` = `check`, 참조 파일, `|| true`·`config.json:ro` 부재, `docker compose config -q`, `reset` URL 변수)
- `backend/tests/test_collect_script.py` — T6 (`scripts/collect.py` 모드 선택과 완료 판정, 스텁 HTTP 서버)
- `backend/tests/test_startup_seed.py` — T7 (lifespan 이 빈 DB 에서 막히지 않음, 종료 때 취소)
- `backend/tests/test_sources_write_fallback.py` — T8 (`replace()` 가 `EBUSY` 일 때 제자리 쓰기)

make·스크립트·설정 (게이트 밖):
- `Makefile` — `SHELL := /bin/bash`, 변수 5개(`?=`)와 `export`, `.PHONY` 12개, `setup`·`dev`·`test`·`clean`·`collect`·`reset`·`docker-up`·`docker-logs` 레시피 (spec 0·1절). `build`·`check`·`docker-build`·`docker-down` 레시피는 그대로
- `scripts/dev.sh` — 새 파일, 실행 권한 (spec 1.2)
- `scripts/collect.py` — 새 파일 (spec 1.6)
- `docker-compose.yml` — `./config.json:/app/config.json:ro` → `:rw` (spec 1.9). 그 밖은 그대로
- `frontend/next.config.ts` — `agentRules: false` 한 줄 (spec 1.2 R14)
- `frontend/AGENTS.md` — git 이 추적하지 않는 생성 파일 삭제 (git 변경 없음)
- `frontend/CLAUDE.md` — git 이 추적하지 않는 생성 파일 삭제 (git 변경 없음)

문서 (마지막 단계, spec 7·8·10절):
- `docs/tech-spec.md` — '시스템 구성'(Makefile·`scripts/dev.sh`·`scripts/collect.py`, Docker `--wait`), '데이터'(`config.json` `:rw`, 소스 저장 제자리 쓰기), '공통 규칙' 스케줄 항목(빈 DB 첫 수집 백그라운드), '기술 선택과 근거' 3행, '변경 이력' `make-targets` 행
- `docs/operations.md` — 'Makefile 타깃' 표 12행, `make dev` 안내, 시작 순서, compose 볼륨 표, '파괴적 작업', '자주 생길 문제', '알려진 불일치·위험' (spec 10절)
- `docs/test-strategy.md` — '검사 명령' 의 깨짐 줄 삭제와 `make test` = `make check`, '테스트 종류' 에 Makefile·스크립트 회귀 행과 테스트 수, '릴리스 전 통합' 의 `make docker-up` (healthy 까지 기다림)
- `docs/known-issues.md` — spec 8절의 5행 삭제 (남길 행은 남김)
- `docs/data-model.md` — DB 경로 표의 `make collect` 행(모드별 DB), 파괴 표의 `reset` 행
- `docs/api.md` — lifespan 서술(`:775` 부근), 설정 저장 오류의 `:ro` 서술(`:480` 부근)
- `docs/functional-spec/03-collection.md` — COLL-20 처리 규칙(`:272` 부근), 시작 지연(`:367` 부근), `make collect` 진입점
- `docs/functional-spec/04-briefing-and-sharing.md` — `:217` 부근 `:ro` 서술
- `docs/test-cases.md` — 새 테스트 T1~T8 행, `:1244` 부근 lifespan '없음' 행
- `CLAUDE.md` — 루트. '명령' 절과 'SDLC' 파괴적 명령 목록 (spec 10절). **메인 세션이 고친다** (단계 7)

바꾸지 않는 것: `backend/Dockerfile`, `frontend/Dockerfile`, `.claude/**` (특히 `.claude/hooks/sdlc-config.json` 의 `deploy_patterns`), `docs/product.md`, 기존 테스트 파일 17개와 `conftest.py`·`llm_fakes.py`, `backend/app/**` 의 위 두 파일 밖 전부, `frontend/src/**` 전부, 계약(`schemas`·`types`·`mocks`). 이 plan 에 `.claude/` 아래 설정을 바꾸는 단계는 없다 (사람 승인 필요 단계 없음).

## 작업 순서
단계마다 `tasks/make-targets/NN-<slug>.md` 진행 기록이 하나씩 생긴다 (괄호 안이 파일 이름). 담당 이름은 implementer 서브에이전트 인스턴스를 가른다.

```
1 (A) ──┬── 2 (A) Makefile·compose·T1~T5 ──┐
        ├── 3 (B) dev.sh·next.config ───────┤
        ├── 4 (C) collect.py·T6 ────────────┼── 6 (A) 통합 실행 확인 ── 7 (A + 메인) 통합 문서 반영
        └── 5 (D) main.py·sources·T7·T8 ────┘
```
- 단계 2~5 는 서로 다른 파일만 고치므로 병렬로 돌릴 수 있다. implementer 를 하나만 쓰면 2 → 4 → 5 → 3 순서로 한다 (3 의 V4(d) 가 5 를 기대므로).
- 단계 1 은 2~5 보다 먼저 끝나야 한다 (단계 5 의 소스 저장 변경이 단계 1 의 재현 결과에 달려 있다. spec 우려 9).
- 단계 6 은 2~5 가 모두 끝난 뒤, 단계 7 은 6 뒤.

### 모든 단계 공통 규칙
- **테스트를 먼저.** 테스트가 있는 단계(2·4·5)는: 테스트 파일을 쓴다 → 그 파일만 돌려 실패를 확인하고 실패한 테스트 이름과 이유를 task 기록에 적는다 → 테스트만 커밋한다 → 코드를 고친다 → 통과를 확인하고 커밋한다. 실패 이유가 '기대한 결함' 이 아니면(import 오류, 오타, 없는 fixture) 테스트를 고쳐 기대한 이유로 실패하게 만든 뒤 커밋한다. **커밋한 테스트의 단언은 뒤에서 바꾸지 않는다.** 바꿔야 한다고 판단되면 그 단계를 blocked 로 두고 이유를 적는다 (plan 고침·재승인).
- 기존 테스트 파일(`backend/tests/` 의 17개 `test_*.py`, `conftest.py`, `llm_fakes.py`)은 읽기만 한다.
- **게이트에 걸리는 명령 문자열을 쓰지 않는다.** hook 은 Bash 명령 문자열 전체를 `*make reset*`, `*curl*reset-and-collect*` 로 본다 (`.claude/hooks/sdlc_hook.py:247-249`). 그래서 `RELEASE_APPROVAL` 없는 세션에서는 다음이 막힌다: `make reset …` 실행, `make reset` 이 들어간 커밋 메시지·heredoc, `curl` 과 `reset-and-collect` 가 한 명령에 함께 있는 grep. 피하는 법: 커밋 메시지에는 "reset 대상" 처럼 쓴다. 문서 검색은 `grep -n 'make[ ]reset' …` 처럼 글자 사이에 `[ ]` 를 넣는다. `make -n reset …` 은 걸리지 않는다 ("make reset" 이 붙어 있지 않음). 파일 내용은 Write·Edit 도구로 쓰므로 걸리지 않는다.
- **병렬 커밋.** 같은 작업 트리에서 여러 implementer 가 커밋하므로, 자기 파일만 `git add <경로…>` 한 뒤 `git commit -m "<메시지>" -- <경로…>` 로 커밋한다 (`git add -A`, `git commit -a` 금지). `index.lock` 오류가 나면 몇 초 뒤 다시 한다. 커밋 메시지 끝에 저장소 규칙의 Co-Authored-By 줄을 붙인다.
- **pytest 는 자기 테스트 파일만** 돌린다 (`cd backend && ../.venv/bin/pytest -v tests/<자기 파일>`). 전체 `make check` 는 단계 6 에서 한다. 다른 단계가 아직 끝나지 않아 실패하는 테스트(아래 단계 2 의 T3 매개변수)는 실패로 남겨 두고 task 기록에 적는다.
- pytest 를 돌린 뒤 매번 `git status --porcelain` 을 보고, 이 단계가 고친 파일 밖의 변경(특히 `config.json`, `sources.json`, `backend/app/config/sources.json`)이 있으면 기록하고 `git checkout -- <그 파일>` 로 되돌린다. LLM·설정 파일은 이미 격리되어 있어(`backend-llm-test-isolation`) 정상이면 변경이 없다. 변경이 생기면 결함이므로 task 기록 '막힌 점' 에 적는다.
- 임시 파일, DB 사본, 실행 로그는 세션 scratchpad 에 둔다. Bash 호출 사이에 변수가 유지되지 않으므로 명령마다 `SCRATCH=<자기 세션 scratchpad 절대 경로>` 를 앞에 둔다. 아래 명령의 `$SCRATCH`, `$ROOT`(= `/Users/wonyoung/workspace/ozplayground/agentlens`)는 그 뜻이다.
- 실제 데이터 `agentlens.db`, `backend/agentlens.db` 는 쓰지 않는다. DB 가 필요한 실행은 `sqlite3 "$ROOT/backend/agentlens.db" ".backup $SCRATCH/<이름>.db"` 로 만든 사본을 `DATABASE_URL=sqlite+aiosqlite:///$SCRATCH/<이름>.db` 로 넘긴다. 환경 변수가 `.env`·`config.json` 보다 앞선다.
- 출력 문구는 한국어, 그림 이모지를 쓰지 않는다 (`scripts/*`, Makefile `echo`).

---

### 1. **[implementer A] 기준선과 Docker 재현, 고치기 전** (`01-baseline-docker-repro`)
저장소 파일을 고치지 않는다. 결과만 task 기록에 남긴다. 이 단계의 결과가 단계 5 의 범위를 정한다.

(a) 기준선 (spec V0): 포트 8000·3000·3001·13000·18000 LISTEN 없음(`lsof -nP -iTCP:<포트> -sTCP:LISTEN`), `docker ps -a --filter name=agentlens` 비어 있음, `docker image ls`·`docker volume ls` 출력, `shasum -a 256 agentlens.db backend/agentlens.db config.json sources.json backend/app/config/sources.json .env` 출력, `git status --porcelain`. 이 sha256 값이 단계 6·verify 의 비교 기준이다.

(b) `docker-build` 뒤 이미지가 남는가 (spec 1.8, R9): 지금 레시피 그대로 `make docker-build` → 종료 코드 → 바로 `docker image inspect agentlens-backend agentlens-frontend --format '{{.Id}} {{.Created}}'`. 둘 다 있으면 intent 의 '이미지 없음' 은 그 사이 다른 정리 때문으로 보고 기록만 한다. **없으면** `docker context show`, `docker buildx ls`, `docker compose config --images` 를 기록하고 단계를 blocked 로 둔다 (원인에 따라 plan 을 고친다).

(c) bind mount 위 rename 의 메커니즘 재현:
```
SCRATCH=…; mkdir -p "$SCRATCH/m" && echo '{}' > "$SCRATCH/m/s.json"
docker run --rm -v "$SCRATCH/m/s.json:/x/s.json" agentlens-backend \
  python -c "import os; open('/x/s.tmp','w').write('1'); os.replace('/x/s.tmp','/x/s.json'); print('replace ok')"
```
기대: `OSError: [Errno 16] Device or resource busy`. 결과(종료 코드, 마지막 줄)를 그대로 적는다.

(d) 앱 경로 재현 (고치기 전 이미지, 실데이터·저장소 파일을 쓰지 않음):
```
SCRATCH=…; mkdir -p "$SCRATCH/repro/data"
sqlite3 "$ROOT/backend/agentlens.db" ".backup $SCRATCH/repro/data/repro.db"
cp "$ROOT/config.json" "$SCRATCH/repro/config.json"; cp "$ROOT/sources.json" "$SCRATCH/repro/sources.json"
docker run -d --name agentlens-repro -p 18001:8000 \
  -e DATABASE_URL=sqlite+aiosqlite:////data/repro.db \
  -v "$SCRATCH/repro/data:/data" \
  -v "$SCRATCH/repro/config.json:/app/config.json:ro" \
  -v "$SCRATCH/repro/sources.json:/app/sources.json:rw" agentlens-backend
```
`curl -fsS http://127.0.0.1:18001/health` 가 200 이 될 때까지 기다린다 (기사가 있는 사본이라 첫 수집이 돌지 않는다. LLM 키는 넘기지 않는다).
- 설정 저장: `curl -s http://127.0.0.1:18001/api/briefing/settings > $SCRATCH/repro/settings.json` 뒤 `curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' --data @$SCRATCH/repro/settings.json http://127.0.0.1:18001/api/briefing/settings`. 기대 500.
- 소스 저장: `shasum -a 256 $SCRATCH/repro/sources.json` → `curl -s -w ' %{http_code}' -X PATCH http://127.0.0.1:18001/api/sources/rss/geeknews/toggle` → 다시 sha256 → `docker logs agentlens-repro 2>&1 | grep -n 'Failed to write sources'` → `docker exec agentlens-repro ls -la /app/sources.tmp`. 기대: 응답 200(위 '찾은 사실'), sha256 같음, 로그에 `[Errno 16] Device or resource busy`, `/app/sources.tmp` 남음.
- 정리: `docker rm -f agentlens-repro`. 이미지는 남긴다.

판정과 다음:
- (c) 또는 (d) 에서 `EBUSY` 가 재현되면 단계 5 의 소스 저장 변경을 진행한다.
- 둘 다 재현되지 않으면(`replace ok`, sha256 바뀜): 단계 5 의 (b) 와 `test_sources_write_fallback.py` 를 하지 않는다. task 기록을 blocked 로 두고 메인 세션에 알린다. 메인 세션은 plan 의 '변경 파일'·단계 5·증명에서 그 몫을 빼고 재승인받는다.
- 끝 기준: task 기록에 (a)~(d) 의 명령·종료 코드·핵심 출력과 판정이 있다. `git status --porcelain` 이 기준선과 같다.

---

### 2. **[implementer A] Makefile·docker-compose 와 회귀 테스트 T1~T5** (`02-makefile`)
바꾸는 파일: `backend/tests/test_make_targets.py`(새), `Makefile`, `docker-compose.yml`.

(a) 테스트 먼저 — `backend/tests/test_make_targets.py`
- `ROOT = Path(__file__).resolve().parents[2]`. `TARGETS = ["setup","dev","test","build","clean","collect","reset","docker-build","docker-up","docker-down","docker-logs","check"]`.
- `make` 를 부르는 도움 함수 하나: `subprocess.run(["make", "-n", *args], cwd=ROOT, env=<os.environ 사본에서 MAKEFLAGS·MFLAGS·MAKELEVEL·AGENTLENS_API_URL·COLLECT_MODE·COLLECT_TIMEOUT·DOCKER_WAIT_TIMEOUT·DOCKER_LOGS_ARGS 를 뺀 것>, capture_output=True, text=True, timeout=30)`. `make check` 안에서 pytest 가 돌면 `MAKELEVEL` 등이 넘어와 하위 make 처럼 동작하므로 뺀다. **`-n` 없는 `make` 호출을 쓰지 않는다.**
- T1: Makefile 을 읽어 `^([A-Za-z0-9_.-]+):(?!=)` 로 대상 이름을 모으고(`.PHONY` 줄 제외) 집합이 `TARGETS` 와 같다. 모든 `.PHONY:` 줄의 이름 합집합도 `TARGETS` 와 같다. `^SHELL := /bin/bash$` 줄이 있다.
- T2: 먼저 Makefile 전체에 `$(MAKE)`, `${MAKE}`, `$(shell`, `${shell` 문자열이 없고, 탭으로 시작하는 레시피 줄 가운데 앞의 `@`·`-` 를 걷어낸 뒤 `+` 로 시작하는 줄이 없음을 단언한다 (`$(shell …)` 은 변수 대입에 있어도 `-n` 에서 실행된다). 이 단언이 실패하면 아래 `make -n` 테스트를 돌리지 않는다 (같은 테스트 함수 안에서 먼저 단언하거나, 모듈 fixture 로 막는다). 그다음 `TARGETS` 마다 `make -n <대상>` 종료 0, stderr 빈 문자열 (`pytest.mark.parametrize`). 별도 테스트로 `make -n test` stdout == `make -n check` stdout.
- T3: `parametrize` 로 파일마다 하나씩: `scripts/dev.sh`, `scripts/collect.py`, `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `backend/requirements.txt`, `frontend/pnpm-lock.yaml` 가 있다. 따로: `scripts/dev.sh` 실행 권한(`os.access(…, os.X_OK)`)과 `bash -n scripts/dev.sh` 종료 0, `py_compile.compile("scripts/collect.py", doraise=True)`.
- T4: Makefile 에 `|| true` 가 없다. `docker-compose.yml` 에 `config.json:ro` 가 없고 `./config.json:/app/config.json:rw` 가 있다. `shutil.which("docker")` 가 있으면 `docker compose config -q` 종료 0, 없으면 `pytest.skip("docker CLI 없음: compose 파일 검사를 건너뛴다")`.
- T5: `make -n reset AGENTLENS_API_URL=http://127.0.0.1:9` 의 stdout 에 `127.0.0.1:9` 가 있고 `localhost:8000` 이 없으며 `curl` 과 `reset-and-collect` 가 있다.
- 실패 확인 (지금 Makefile): T1 실패(`.PHONY` 5개+check, `SHELL` 없음), T2 의 `test`=`check` 실패(`./scripts/test.sh`), T3 의 `scripts/*` 실패, T4 실패(`|| true`, `:ro`), T5 실패(URL 하드코딩). T2 의 `make -n` 12개 종료 0 은 지금도 통과한다 (E17). 이 결과를 적고 테스트만 커밋한다.

(b) 코드 — `Makefile` (spec 0·1절. 아래는 반드시 지킬 형태이고 셸 세부는 implementer 가 정한다)
- 머리: `SHELL := /bin/bash`, `.PHONY:` 한 줄에 12개. 변수 `AGENTLENS_API_URL ?= http://localhost:8000`, `COLLECT_MODE ?= auto`, `COLLECT_TIMEOUT ?= 1800`, `DOCKER_WAIT_TIMEOUT ?= 180`, `DOCKER_LOGS_ARGS ?= -f --tail=200`. `export AGENTLENS_API_URL COLLECT_MODE COLLECT_TIMEOUT DEV_BACKEND_PORT DEV_FRONTEND_PORT DEV_HOST DEV_READY_TIMEOUT` (DEV_* 의 기본값은 `scripts/dev.sh` 가 `${VAR:-기본}` 으로 갖는다. Makefile 에 두지 않는다).
- 금지: `|| true`, 다른 도구로 넘어가는 `A || B` 폴백, `$(MAKE)`, `$(shell …)`, `+` 접두, `.ONESHELL`, `.SHELLFLAGS`. 오류 처리는 `if ! …; then echo "…" >&2; exit 1; fi` 형태로 쓴다. 파이프 실패가 필요한 줄만 줄 안에서 `set -o pipefail;`.
- `setup` (spec 1.1): ① `.venv/bin/python` 이 실행 가능하고 `sys.version_info[:2] == (3, 11)` 이면 "==> .venv 이미 있음 (Python 3.11.x)" 한 줄. ② 아니면 `command -v uv` 면 `uv venv --clear --python 3.11 .venv`, 아니고 `command -v python3.11` 이면 `python3.11 -m venv --clear .venv`, 둘 다 없으면 "make setup: uv 나 python3.11 이 필요하다" 와 종료 1. ③ 의존성: `command -v uv` 면 `uv pip install --python .venv/bin/python -r backend/requirements.txt`, 아니면 `.venv/bin/python -m ensurepip --upgrade` 뒤 `.venv/bin/python -m pip install -r backend/requirements.txt`. ④ `pnpm` 이 없으면 메시지와 종료 1, 있으면 `cd frontend && pnpm install --frozen-lockfile`.
- `dev`: `@./scripts/dev.sh` (지금과 같음).
- `test: check` — 레시피 없음.
- `clean` (spec 1.5): `rm -rf .venv frontend/node_modules frontend/.next frontend/tsconfig.tsbuildinfo .pytest_cache backend/.pytest_cache backend/tests/test_agentlens.db backend/tests/test_agentlens.db-wal backend/tests/test_agentlens.db-shm` 와 `find . -name __pycache__ -type d -prune -not -path './.git/*' -exec rm -rf {} +`. DB(`agentlens.db*`, `backend/agentlens.db*`), 설정 파일, `frontend/next-env.d.ts`, Docker 는 건드리지 않는다.
- `collect` (spec 1.6): `cd backend && PYTHONPATH=. ../.venv/bin/python ../scripts/collect.py`.
- `reset` (spec 1.7): 레시피 안에서 `$(AGENTLENS_API_URL)` 을 **make 변수로** 펼친다 (`-n` 출력에 URL 이 보여야 T5 가 통과한다). 순서: 안내 한 줄("==> make 의 reset 대상: $(AGENTLENS_API_URL) 의 수집 데이터 전체 삭제 후 재수집" 같은 문장) → `if ! curl -fsS --max-time 5 -o /dev/null "$(AGENTLENS_API_URL)/health"; then echo "make reset: $(AGENTLENS_API_URL) 에 backend 가 없다. make dev 또는 make docker-up 으로 먼저 띄운다" >&2; exit 1; fi` → 같은 레시피 줄(백슬래시 이음)에서 `resp="$$(curl -fsS --max-time 30 -X POST "$(AGENTLENS_API_URL)/api/schedule/reset-and-collect")" || exit 1` → `python3` 표준 라이브러리로 JSON 해석: JSON 이 아니면 "make reset: 응답이 JSON 이 아니다: <응답>" stderr·종료 1, 맞으면 들여쓰기해 출력(`python3 -m json.tool --no-ensure-ascii`), `status != "started"` 면 `message` 를 stderr 에 내고 종료 1. `curl` 과 `reset-and-collect` 문자열은 Makefile 레시피에 그대로 둔다 (게이트 진입점 유지, 스크립트로 옮기지 않는다).
- `docker-build`, `docker-down`, `build`, `check`: 레시피 그대로.
- `docker-up`: `docker compose up -d --wait --wait-timeout $(DOCKER_WAIT_TIMEOUT)` 뒤 주소 출력 (backend `http://localhost:8000`, frontend `http://localhost:3001`, `.env` 의 `BACKEND_PORT`·`FRONTEND_PORT` 로 바꿨으면 그 포트라는 안내 한 줄).
- `docker-logs`: `docker compose logs $(DOCKER_LOGS_ARGS)`.

(c) 코드 — `docker-compose.yml` 38행 `./config.json:/app/config.json:ro` → `./config.json:/app/config.json:rw`. 다른 줄은 바꾸지 않는다.

끝 기준: `cd backend && ../.venv/bin/pytest -v tests/test_make_targets.py` 에서 T3 의 `scripts/dev.sh`·`scripts/collect.py` 관련 테스트(단계 3·4 몫)를 뺀 전부 통과. 그 테스트가 실패로 남으면 이름을 task 기록에 적는다 (단계 6 에서 확인). `make -n setup clean collect docker-up docker-logs` 출력을 task 기록에 붙인다. 이 단계에서 `make setup`(현재 `.venv` 가 3.11 이라 건너뜀만 확인)을 한 번 돌려 "이미 있음" 줄과 종료 0 을 확인한다. 테스트 커밋 1개 + 코드 커밋 1개.

---

### 3. **[implementer B] `scripts/dev.sh` 와 에이전트 문서 생성 끄기** (`03-dev-script`)
바꾸는 파일: `scripts/dev.sh`(새, `chmod +x`), `frontend/next.config.ts`, 삭제 `frontend/AGENTS.md`·`frontend/CLAUDE.md`(추적되지 않음).
이 단계에는 pytest 로 쓸 실패 테스트가 없다 (T3 의 `dev.sh` 존재·`bash -n` 은 단계 2 파일에 있다). 대신 **고치기 전 실패를 실행으로 기록**한다: `make dev; echo exit=$?` → 종료 2, `No such file or directory`.

(a) `scripts/dev.sh` (spec 1.2. bash 3.2 에서 돌아야 한다: `wait -n`, 연관 배열, `${var,,}` 금지)
- `#!/usr/bin/env bash`, `set -euo pipefail`, 저장소 루트로 `cd "$(dirname "${BASH_SOURCE[0]}")/.."`.
- 변수: `DEV_BACKEND_PORT="${DEV_BACKEND_PORT:-8000}"`, `DEV_FRONTEND_PORT="${DEV_FRONTEND_PORT:-3000}"`, `DEV_HOST="${DEV_HOST:-0.0.0.0}"`, `DEV_READY_TIMEOUT="${DEV_READY_TIMEOUT:-120}"`.
- 사전 확인: `.venv/bin/uvicorn` 실행 가능, `frontend/node_modules` 디렉터리 있음, 아니면 "make setup 을 먼저 실행한다" 와 종료 1.
- 포트 확인: 두 포트에 `(exec 3<>/dev/tcp/127.0.0.1/$port) 2>/dev/null` 가 성공하면 "포트 N 사용 중 (Docker 가 떠 있으면 make docker-down)" 과 종료 1. 아무것도 띄우지 않는다. 자동으로 다른 포트를 고르지 않는다. `lsof` 를 쓰지 않는다.
- `set -m` 뒤 두 프로세스를 띄운다. 각각 `( cd backend && exec ../.venv/bin/uvicorn app.main:app --reload --reload-dir app --host "$DEV_HOST" --port "$DEV_BACKEND_PORT" ) &` 와 `( cd frontend && exec env INTERNAL_API_URL="http://127.0.0.1:$DEV_BACKEND_PORT" [NEXT_PUBLIC_API_URL=…] pnpm dev --port "$DEV_FRONTEND_PORT" ) &`. `$!` 가 곧 프로세스 그룹 id 다. `NEXT_PUBLIC_API_URL` 은 `DEV_BACKEND_PORT` 가 8000 이 아니고 환경의 `NEXT_PUBLIC_API_URL` 이 비어 있을 때만 `http://localhost:$DEV_BACKEND_PORT` 로 넘긴다.
- 준비 대기: 1초 간격으로 `curl -fsS -o /dev/null http://127.0.0.1:$DEV_BACKEND_PORT/health` 와 `curl -fsS -o /dev/null http://127.0.0.1:$DEV_FRONTEND_PORT/api/health` 를 확인한다 (대기 중 실패 출력은 `2>/dev/null` 로 숨긴다. 대기 중 연결 거부는 오류가 아니다). 둘 다 성공하면 frontend·backend·API 문서(`/docs`) 주소와 "Ctrl-C 로 둘 다 내린다" 를 출력한다. 기다리는 동안 둘 중 하나가 죽으면 바로 실패로 간다. `DEV_READY_TIMEOUT` 을 넘기면 "N초 안에 준비되지 않았다" 와 정리 뒤 종료 1.
- 감시: 두 PID 가 살아 있는지 1초마다 `kill -0` 으로 본다. 하나가 죽으면 `wait <pid>` 로 종료 코드를 얻어 "<backend|frontend> 가 종료 코드 N 으로 끝났다" 를 내고 정리, 종료 1.
- 정리 함수: 두 그룹에 `kill -TERM -- -<pgid>` (이미 없으면 조용히 넘어간다: `2>/dev/null` 은 허용, `|| true` 는 Makefile 이 아니므로 R1 대상이 아니지만 쓰지 말고 `if kill -0 …` 으로 가른다), 최대 10초 기다린 뒤 남은 그룹에 `kill -KILL`. 정리는 한 번만 돈다(플래그). `trap on_signal INT TERM` → 정리 뒤 "중지했다" 와 `exit 0`. `trap cleanup EXIT` → 비정상 종료 때도 정리.
- 출력은 한국어, 이모지 없음.

(b) `frontend/next.config.ts`: `nextConfig` 객체에 `agentRules: false,` 한 줄과 그 위에 이유 주석 한 줄("next dev 가 frontend/AGENTS.md·CLAUDE.md 를 만들지 않게 한다"). 다른 줄은 바꾸지 않는다.

(c) `frontend/AGENTS.md`, `frontend/CLAUDE.md` 삭제 (둘 다 git 추적 밖이라 커밋에 나타나지 않는다. 지운 사실을 task 기록에 적는다).

(d) 실행 확인 (spec V4 (a)~(c), 증명의 `sigint_run.py` 를 쓴다. 단계 5 가 끝나지 않았어도 할 수 있다):
- (a)(b) DB 사본으로 `make dev` 를 띄워 준비 → `curl -f` 세 개 → SIGINT → 10초 안에 종료, 포트·프로세스 없음.
- 같은 것을 `./scripts/dev.sh` 로 직접 띄워 스크립트 종료 코드가 0 인지 따로 본다 (make 의 `Interrupt` 줄과 종료 코드는 spec 우려 3. 둘을 나눠 기록한다).
- SIGTERM 도 한 번: `sigint_run.py` 에 `SIG=TERM` 을 주어 같은 판정.
- (c) 8000 점유 → `make dev` 종료 1, 원인 메시지, 남은 자식 없음.
- 전후 `git status --porcelain` 같음, `frontend/AGENTS.md`·`frontend/CLAUDE.md` 가 다시 생기지 않음 (R14).
- `cd frontend && pnpm exec tsc --noEmit && pnpm lint` 종료 0 (`next.config.ts` 변경 확인).

끝 기준: 위 결과가 task 기록에 있다. 커밋 1개 (`scripts/dev.sh`, `frontend/next.config.ts`). V4(d)(빈 DB)는 단계 6 에서 한다.

---

### 4. **[implementer C] `scripts/collect.py` 와 회귀 테스트 T6** (`04-collect-script`)
바꾸는 파일: `backend/tests/test_collect_script.py`(새), `scripts/collect.py`(새).

`scripts/collect.py` 의 인터페이스 (테스트가 기대는 것. 이름을 바꾸지 않는다):
- `main(env=None) -> int`: `env` 가 None 이면 `os.environ`. 읽는 이름: `AGENTLENS_API_URL`(기본 `http://localhost:8000`, 끝 `/` 제거), `COLLECT_MODE`(`auto`|`api`|`direct`, 기본 `auto`, 그 밖이면 메시지와 1), `COLLECT_TIMEOUT`(정수 초, 기본 1800). `if __name__ == "__main__": sys.exit(main())`.
- 모듈 상수 `POLL_INTERVAL = 2.0`, `HEALTH_TIMEOUT = 2.0` (테스트가 `monkeypatch.setattr` 로 줄인다).
- HTTP 는 표준 라이브러리 `urllib.request` 만 쓴다 (httpx 를 쓰지 않는 이유: 테스트 하네스가 httpx 전송 계층을 감싸고 있어 동작이 섞인다. 스크립트에 새 의존성을 만들지 않는다).
- 모드 선택: `GET {URL}/health` 를 `HEALTH_TIMEOUT` 으로 불러 200 이고 JSON `status == "healthy"` 면 backend 있음. `auto` → 있으면 API, 없으면 직접. `api` → 없으면 "make collect: <URL> 에 backend 가 없다" stderr·1. `direct` → 직접 모드, backend 가 있으면 두 번째 줄에 경고 한 줄.
- **첫 줄**: `API 모드: <URL>` 또는 `직접 모드: <DB 절대 경로>` (`sqlalchemy.engine.make_url(settings.DATABASE_URL).database` 를 `Path(...).resolve()`).
- API 모드: `GET /api/schedule/progress` 의 `last_crawl_time` 을 기억 → `POST /api/schedule/trigger`, `status` 가 `started`·`already_running` 이 아니면 1 → `POLL_INTERVAL` 마다 progress 를 보며 `step_message` 가 바뀌면 출력. `is_running` 이 한 번이라도 true 였는지 기억. `is_running == false` 이고 `last_crawl_time` 이 시작 전과 다르면 `items_collected`·`items_saved` 를 출력하고 0. `is_running == false`, `last_crawl_time` 그대로, true 를 본 적 있음 → 마지막 `step_message` 와 1. `COLLECT_TIMEOUT` 을 넘기면 1. 폴링 중 HTTP 오류·연결 실패 → 1. `reset-and-collect` 는 부르지 않는다.
- 직접 모드: 함수 안에서 `from app import database` 와 `from app.collectors import manager` 를 import 하고, 호출할 때 `await database.ensure_db_schema()` → `await manager.collector_manager.collect_all()` 처럼 **모듈 속성으로** 부른다 (테스트가 `app.database.ensure_db_schema`, `collector_manager.collect_all` 을 바꿔 넣는다). `asyncio.run` 으로 돌린다. 반환 `status != "success"` 면 1. `source_results` 를 소스마다 한 줄(`<이름>: N건` 또는 `<이름>: 실패 - <error>`) 출력, 실패한 소스가 있으면 "실패한 소스: a, b" 한 줄. 모든 소스가 `error` 면 "모든 소스가 실패했다 (네트워크 확인)" 와 1.

(a) 테스트 먼저 — `backend/tests/test_collect_script.py`
- `importlib.util.spec_from_file_location("collect_script", ROOT / "scripts" / "collect.py")` 로 불러온다 (fixture. 파일이 없으면 여기서 실패 = 기대한 실패).
- `main()` 은 직접 모드에서 `asyncio.run` 을 부르므로 **작업 스레드에서** 돌린다: `concurrent.futures.ThreadPoolExecutor(1).submit(mod.main, env).result(timeout=30)`. pytest-asyncio 가 쓰는 주 스레드 이벤트 루프 상태를 건드리지 않기 위해서다. 출력은 `capsys` 로 읽는다.
- 스텁 HTTP 서버: 같은 파일 안 `http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)` 를 데몬 스레드로 띄우는 fixture. `/health`, `GET /api/schedule/progress`, `POST /api/schedule/trigger` 만 응답하고 그 밖은 404. 받은 경로를 목록에 남긴다. 시나리오는 progress 응답 순서 목록으로 준다. `monkeypatch.setattr(mod, "POLL_INTERVAL", 0.05)`.
- 경우 (spec T6):
  - (a) `auto` + healthy 스텁, trigger 뒤 progress 가 running → (running false, `last_crawl_time` 새 값) → 0, 첫 줄 `API 모드: http://127.0.0.1:<포트>`.
  - (b) trigger 뒤 running → (running false, `last_crawl_time` 그대로) → 1, 마지막 `step_message` 가 stderr 또는 stdout 에 있다.
  - (c) `COLLECT_TIMEOUT=1`, progress 가 계속 running → 1, 걸린 시간 5초 미만.
  - (d) `AGENTLENS_API_URL=http://127.0.0.1:9`, `auto` → 첫 줄 `직접 모드:`, `ensure_db_schema`·`collect_all` 흉내(`AsyncMock`, `collect_all` 은 `{"status": "success", "source_results": {"A": {"count": 3}, "B": {"error": "x", "count": 0}}}`)가 한 번씩 불렸고 0, "실패한 소스: B" 줄이 있다. 흉내는 `monkeypatch.setattr("app.database.ensure_db_schema", …)`, `monkeypatch.setattr(collector_manager, "collect_all", …)`.
  - (e) `COLLECT_MODE=api`, `http://127.0.0.1:9` → 1, `collect_all` 흉내가 불리지 않음.
  - 모든 스텁 경우에서 받은 경로에 `reset-and-collect` 가 없다.
- 실패 확인: 파일이 없어 fixture 에서 `FileNotFoundError` 로 모두 실패. 기록 후 테스트만 커밋.

(b) 코드: 위 인터페이스대로 `scripts/collect.py`.

(c) 실행 확인 (가벼운 것만, 실제 수집은 단계 6): `cd backend && COLLECT_MODE=api AGENTLENS_API_URL=http://127.0.0.1:9 PYTHONPATH=. ../.venv/bin/python ../scripts/collect.py; echo exit=$?` → 1 과 메시지.

끝 기준: `cd backend && ../.venv/bin/pytest -v tests/test_collect_script.py` 전부 통과. 테스트 커밋 1개 + 코드 커밋 1개.

---

### 5. **[implementer D] 빈 DB 첫 수집 백그라운드화와 소스 저장 대체 경로, T7·T8** (`05-backend-startup-sources`)
바꾸는 파일: `backend/tests/test_startup_seed.py`(새), `backend/tests/test_sources_write_fallback.py`(새, 단계 1 에서 EBUSY 재현 시), `backend/app/main.py`, `backend/app/services/sources_service.py`(단계 1 에서 EBUSY 재현 시).

(a) 테스트 먼저 — `backend/tests/test_startup_seed.py` (T7)
- 지금 `main.py` 에 있는 이름만 바꿔 넣는다 (새 도움 함수를 전제하면 지금 코드에서 `AttributeError` 로 실패해 '기대한 실패' 가 아니게 된다): `monkeypatch.setattr(app.main, "start_scheduler", lambda: None)`, `stop_scheduler` 같음, `ensure_db_schema` → `AsyncMock()`, `AsyncSessionLocal`·`engine` → `tmp_path` 의 빈 SQLite 엔진(`create_async_engine(f"sqlite+aiosqlite:///{tmp_path}/empty.db")` 에 `Base.metadata.create_all`)과 그 `async_sessionmaker`. 이렇게 하면 `conftest.py` 의 `init_db` 가 넣은 기사(공용 테스트 DB)를 지우지 않고 0건을 만든다. 끝에 그 엔진을 `dispose` 한다.
- 빈 DB 경우: `collect_all` 을 오래 걸리는 흉내로 바꾼다 — 불리면 `collector_manager.is_running = True`, `started` 이벤트 set, `await asyncio.sleep(30)`, `CancelledError` 를 받으면 `cancelled = True` 기록 뒤 다시 raise, `finally` 에서 `is_running = False`. `async with asyncio.timeout(1.0): ctx = app.router.lifespan_context(app); await ctx.__aenter__()` (또는 `AsyncExitStack`) 로 들어가는 시간이 1초 안이어야 한다. 안에서 `await asyncio.wait_for(started.wait(), 1)` 뒤 `httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test")` 로 `GET /health` → 200, `running` 이 True. `__aexit__` 뒤 `cancelled` 가 True, `collector_manager.is_running` 이 False.
- 기사 있음 경우: 같은 바꿔 넣기에 `AsyncSessionLocal`·`engine` 은 기사 1건을 넣은 별도 `tmp_path` DB, `collect_all` 은 `AsyncMock` → lifespan 출입 뒤 `assert_not_called()`.
- 실패 확인: 지금 코드는 lifespan 안에서 `collect_all` 을 await 하므로 빈 DB 경우가 `TimeoutError` 로 실패한다. 기사 있음 경우는 지금도 통과한다 (회귀 보호). 기록.

(b) 테스트 먼저 — `backend/tests/test_sources_write_fallback.py` (T8, 단계 1 에서 재현됐을 때만)
- `sources_service` 는 autouse `llm_isolation` 이 세션 사본(`_file_path` = `_mirror_path`)을 가리키게 해 두었다. 그 사본에 쓴다.
- 대체 경로: `data = copy.deepcopy(sources_service.load_sources())`, `monkeypatch.setattr(pathlib.Path, "replace", <OSError(errno.EBUSY, "Device or resource busy") 를 내는 함수>)` → `sources_service.save_sources(data)` 가 True, 파일 JSON 이 `data`(갱신된 `updated_at` 포함)와 같고, 같은 폴더에 `sources.tmp` 가 없다.
- 일반 경로: `Path.replace` 를 원래 함수를 부르는 감시 함수로 바꿔 → True, 감시 함수가 한 번 불림, 내용이 같음, `.tmp` 없음.
- 실패 확인: 대체 경로 테스트가 지금 `False` 로 실패한다 (예외를 잡아 `logger.error` 후 False). 일반 경로는 통과. 기록 후 (a)(b) 테스트를 함께 커밋.

(c) 코드 — `backend/app/main.py` (spec 1.9)
- lifespan: `ensure_db_schema()`, `start_scheduler()` 뒤 `async with AsyncSessionLocal() as s:` 안에서 개수만 센다. 세션을 닫은 뒤 0건이면 `print("[AgentLens] Initial database seed collection (백그라운드로)...")` 와 `seed_task = asyncio.create_task(collector_manager.collect_all())` (`session=` 인자 없음). 태스크 참조는 lifespan 지역 변수.
- (선택, 권장) `seed_task.add_done_callback` 으로 취소가 아닌 예외를 한 줄 로그로 남겨 "Task exception was never retrieved" 경고를 막는다.
- `yield` 뒤: `seed_task` 가 있고 끝나지 않았으면 `cancel()` 하고 `try: await seed_task except asyncio.CancelledError: pass`. 그다음 지금처럼 `stop_scheduler()`, `await engine.dispose()`.
- `/health` 응답 형식과 다른 줄은 바꾸지 않는다.

(d) 코드 — `backend/app/services/sources_service.py` (단계 1 에서 재현됐을 때만)
- `save_sources` 의 `temp_path.replace(p)` 를 `try` 로 감싼다. `OSError` 면 `logger.warning` 한 줄(원인 포함, 한국어)을 남기고, 임시 파일 내용을 대상 파일에 제자리로 쓴 뒤(`open(p, "w")`) 임시 파일을 지운다 (`missing_ok=True`). 거울 쓰기와 반환값 규칙은 지금 그대로. `toggle_source` 의 반환값 결함(위 '찾은 사실')은 고치지 않는다.

끝 기준: `cd backend && ../.venv/bin/pytest -v tests/test_startup_seed.py tests/test_sources_write_fallback.py tests/test_reset_and_delete.py tests/test_sources_and_research.py` 전부 통과 (기존 두 파일은 같은 코드를 쓰는 회귀 확인). 테스트 커밋 1개 + 코드 커밋 1개.

---

### 6. **[implementer A] 통합 실행 확인** (`06-integration-run`)
저장소 파일을 고치지 않는다 (고칠 것이 나오면 해당 단계 담당에게 돌려보내고 이 단계를 blocked 로 둔다). 증명의 명령으로 아래를 돌리고 명령·종료 코드·출력 파일 경로·O 규칙 판정을 task 기록에 남긴다.
- `make check` 전후 `git status --porcelain` 절차 (증명 1). 테스트 수가 `174 + 새 테스트 수` 와 맞는다.
- V9 → V1 → V2 → V3 → V4 (a)~(d) → V5 (a)~(c) → V7 (고친 뒤 이미지로 다시 빌드). V6(reset 실제 실행)은 하지 않는다 (게이트). V8(clean)은 verify 가 맨 마지막에 한다.
- 끝 기준: V1·V2·V3·V4·V5·V7·V9 가 증명의 판정을 만족하거나, 만족하지 못한 항목과 원인이 기록되어 해당 단계로 돌아갔다. 실행 뒤 `git status --porcelain` 이 기준선 + 이 기능 커밋과 같고(추적 파일 변경 없음), 데이터 파일 sha256 이 단계 1 (a) 와 같다.

---

### 7. **[implementer A + 메인 세션] 통합 문서 반영** (`07-docs`)
- implementer A: '변경 파일' 의 `docs/` 9개를 구현 결과대로 고친다 (spec 7·8·10절). 근거 줄 번호는 단계 2~5 뒤 코드로 다시 잰다.
  - `docs/tech-spec.md`: spec 7절 다섯 항목. '기술 선택과 근거' 3행의 대안은 (1) Makefile 한 줄·`concurrently` 같은 npm 도구, (2) healthcheck `start_period` 늘림, (3) `up -d` 만.
  - `docs/test-strategy.md`: '검사 명령' 의 `make test`·`make dev` 깨짐 줄을 지우고 "`make test` 는 `make check` 와 같다" 를 넣는다. '테스트 종류' 표에 Makefile·스크립트 회귀(`test_make_targets.py`, `test_collect_script.py`, `test_startup_seed.py`, `test_sources_write_fallback.py`, `make -n` 만 부르고 실제 실행은 하지 않음) 행과 단위 행의 파일 수·테스트 수를 실제 수집 수(`pytest --collect-only -q`)로. '릴리스 전 통합' 에 `make docker-up` 이 healthy 까지 기다림.
  - `docs/known-issues.md`: spec 8절의 5행만 지운다. DB 경로 cwd 기준, 수집 중복 실행 플래그, `NEXT_PUBLIC_API_URL`, 보안(비밀값 평문·인증 없음) 행은 남긴다. 단계 1 에서 찾은 '소스 토글이 저장 실패에도 200' 은 새 행으로 **넣지 않는다** (`/triage-signal` 몫. task 기록 '다음' 에 메인 세션 몫으로 적는다).
  - 나머지 문서는 spec 10절 표대로.
- 메인 세션: 루트 `CLAUDE.md` '명령' 절 (`make test`·`make dev` 깨짐 줄 삭제, `make dev`(로컬 동시 실행, Ctrl-C 로 종료)·`make test`(= `make check`) 추가, `make check` 서술을 `docs/operations.md:31` 과 같게: LLM 은 흉내, 설정 파일은 임시 사본, 스크래퍼 등은 실제 호출, 돌린 뒤 `git status` 확인), 'SDLC' 파괴적 명령 목록에서 없는 대상 이름 삭제. implementer 는 바꿀 문장을 task 기록 '다음' 에 적어 넘긴다.
- 끝 기준: 증명 4 의 grep 0건, spec 10절 표의 행마다 고친 문서가 커밋에 있다, 문서만 바뀐 커밋 (implementer 1개, 메인 세션 1개).

## 위험
- **가장 위험한 단계는 3 (`dev.sh`).** 프로세스 그룹 정리가 틀리면 uvicorn `--reload` 의 감시·작업 프로세스나 `next dev` 의 node 자식이 고아로 남아 8000·3000 을 붙잡고, 다음 `make dev`·`make docker-up` 이 포트 충돌로 실패한다. 대책: `set -m` 으로 그룹을 나누고 그룹째 TERM→KILL, 확인은 `pgrep -f`·`lsof` 로 남은 프로세스 0 을 본다 (V4 (b)(c)). 고아가 남으면 `pkill -f "uvicorn app.main:app"`, `pkill -f "next dev"` 로 치우고 결함으로 기록한다. make 3.81 이 SIGINT 를 받으면 dev.sh 의 정리를 기다린 뒤 스스로 `Interrupt` 줄과 시그널 종료를 낼 수 있다 (spec 우려 3, 승인자 판단). 그래서 V4 는 `make dev` 와 `./scripts/dev.sh` 를 따로 재서 스크립트 자체의 종료 0 을 증명한다.
- **단계 5 lifespan.** 백그라운드 수집이 도는 중에 서버가 내려가면 SQLite 쓰기 도중 취소된다 (`collect_all` 의 `finally` 가 `is_running` 을 되돌리지만 배치 저장은 롤백). 스케줄러가 같은 때 수집을 띄우면 `is_running` 가드가 막는다. T7 은 `app.main` 의 기존 이름(`AsyncSessionLocal`, `engine`, `ensure_db_schema`, `start_scheduler`, `stop_scheduler`)을 바꿔 넣는다 — 구현에서 이 이름을 없애거나 다른 경로로 DB 를 열면 T7 이 깨진다. 이름을 유지한다.
- **Docker 단계(1, 6·verify 의 V7).** compose 가 volume·컨테이너 이름을 고정해 기존 `agentlens-data`(내용 미확인)를 쓴다. 비어 있으면 첫 수집이 외부 소스·LLM 을 실제로 부른다 (spec 우려 6·7). `config.json` 이 `:rw` 가 되어 V7 의 설정 저장이 git 추적 파일 `config.json` 에 비밀값을 평문으로 쓸 수 있다 (우려 4) → V7 은 `GET` 응답을 그대로 `POST` 하고(마스킹된 `***` 는 저장하지 않는 코드) 끝나면 `git diff config.json` 기록 뒤 `git checkout -- config.json sources.json` 으로 되돌린다.
- **게이트 문자열.** `make reset` 이 들어간 명령·커밋 메시지는 `RELEASE_APPROVAL` 없는 세션에서 막힌다. spec R15 의 확인 grep 원문(`make reset-and-collect` 포함)도 그대로 치면 막히므로 증명 4 에 `make[ ]reset` 형태로 바꿔 적었다. 같은 이유로 V6 은 사람이 돌린다.
- **같은 작업 트리의 병렬 implementer.** 파일은 겹치지 않지만 git 색인·공용 테스트 DB(`backend/tests/test_agentlens.db`)·포트를 함께 쓴다. 커밋은 경로 지정, pytest 는 자기 파일만, 실제 서버 실행(단계 3 의 V4)은 한 번에 한 implementer 만 한다 (단계 3 은 8000·3000, 다른 단계는 서버를 띄우지 않는다. 단계 1 의 재현 컨테이너는 18001).
- **pytest 안의 `make -n`.** `make check` 아래에서 pytest 가 돌면 `MAKEFLAGS`·`MAKELEVEL` 이 넘어온다. 테스트 도움 함수가 이 변수를 지운다. 지우지 않으면 하위 make 의 `Entering directory` 줄로 `test`=`check` 비교는 같아도 stderr·출력 판정이 흔들릴 수 있다.
- **T6 의 `asyncio.run`.** pytest-asyncio 의 주 스레드 루프와 섞이지 않게 작업 스레드에서 `main()` 을 돌린다. 섞이면 뒤 테스트가 이벤트 루프 오류로 실패할 수 있다.
- **EBUSY 미재현 (우려 9).** 단계 1 에서 재현되지 않으면 `sources_service.py` 변경과 T8 을 빼고 plan 을 고친다. 재현 없이 고치지 않는다.
- **`docker compose up --wait` 와 `.env` 의 `FRONTEND_PORT`.** 공개 포트가 3001 이 아닐 수 있다. V7 은 `docker compose port frontend 3001`, `docker compose port backend 8000` 으로 실제 포트를 찾아 쓴다.
- **버린 대안.**
  1. `reset` 을 `scripts/` 로 옮기기: 게이트 패턴이 스크립트 경로를 잡지 않아 우회 진입점이 생긴다 (spec 1.7).
  2. healthcheck `start_period` 늘리기: 첫 수집 시간이 측정된 적이 없어 근거 있는 값이 없다 (spec 1.9).
  3. `concurrently` 같은 npm 도구나 Makefile 한 줄로 `dev`: 프로세스 그룹 정리·한쪽 사망 감지·준비 대기를 할 수 없고 새 의존성이 생긴다 (spec E3·E5).
  4. pytest 안에서 make 대상을 실제로 실행: `reset` 이 실데이터를 지울 수 있고 게이트를 hook 밖에서 우회한다 (spec 우려 1). `make -n` 만 쓴다.
  5. T7 을 위해 `main.py` 에 새 도움 함수(예: 개수 세기 함수)를 만들고 그것을 흉내 내기: 지금 코드에서 `AttributeError` 로 실패해 '기대한 이유로 실패하는 테스트' 가 되지 않는다. 기존 이름을 바꿔 넣는다.
  6. T7 의 0건 조건을 공용 테스트 DB 의 기사를 지워 만들기: 다른 테스트가 쓰는 데이터를 지운다. `tmp_path` 빈 DB 를 쓴다.
  7. `collect.py` 에서 httpx 사용: 하네스의 httpx 흉내 계층과 섞인다. `urllib` 를 쓴다.
  8. 병렬 implementer 마다 git worktree: 병합 단계가 늘고 `.venv`·`node_modules`·`.env` 를 worktree 마다 준비해야 한다. 파일이 겹치지 않으므로 같은 트리에서 경로 지정 커밋으로 충분하다.
  9. `toggle_source` 반환값 결함까지 고치기: spec 범위 밖이고 응답 계약(404/200)이 바뀐다. 기록만 한다.

## 증명
판정 공통: 각 실행의 명령, 종료 코드, 전체 출력(길면 `$SCRATCH/logs/<ID>.log`)과 O 규칙 판정을 남긴다. O 규칙 검사 명령 (로그 파일마다):
```
python3 -c "import re,sys; [print(i+1, l.rstrip()) for i,l in enumerate(open(sys.argv[1], errors='replace')) if re.search(r'\b(error|err!|traceback|exception|no such file|not found|command not found|failed|fatal|denied|already exists)\b', l, re.I)]" "$SCRATCH/logs/<ID>.log"
```
걸린 줄은 spec 의 예외 (a) 런타임 로그 (b) 테스트 이름 (c) make `Interrupt` 가운데 어디에 드는지 줄마다 적는다. 어디에도 들지 않으면 실패.

`sigint_run.py` — V4·V5·V7 에서 오래 도는 대상을 띄우고 SIGINT 를 보내는 도구. 저장소 밖 `$SCRATCH/sigint_run.py` 에 둔다:
```python
# 사용: python3 sigint_run.py LOG "URL1,URL2" READY_TIMEOUT [--during "셸 명령"] -- 명령...
# 환경 SIG=TERM 이면 SIGTERM 을 보낸다. 준비되면 URL1 응답 본문을 출력한다.
import os, signal, subprocess, sys, time, urllib.request
a = sys.argv; i = a.index("--"); cmd = a[i+1:]
log, urls, tmo = a[1], [u for u in a[2].split(",") if u], float(a[3])
during = a[a.index("--during")+1] if "--during" in a[:i] else None
root = "/Users/wonyoung/workspace/ozplayground/agentlens"
sig = signal.SIGTERM if os.environ.get("SIG") == "TERM" else signal.SIGINT
def ok(u):
    try: return urllib.request.urlopen(u, timeout=2).read().decode(errors="replace")
    except Exception: return None
with open(log, "wb") as f:
    p = subprocess.Popen(cmd, cwd=root, stdout=f, stderr=subprocess.STDOUT, start_new_session=True)
    t0 = time.time(); ready = not urls
    while not ready and p.poll() is None and time.time() - t0 < tmo:
        ready = all(ok(u) is not None for u in urls)
        if not ready: time.sleep(1)
    print("ready", ready, "after_sec", round(time.time() - t0, 1), "early_exit", p.poll())
    if ready and urls: print("body", ok(urls[0]))
    if ready and during: print("during_exit", subprocess.run(during, shell=True, cwd=root).returncode)
    if p.poll() is None:
        os.killpg(p.pid, sig); t1 = time.time()
        try: p.wait(timeout=15)
        except subprocess.TimeoutExpired:
            print("NOT_EXITED_15S"); os.killpg(p.pid, signal.SIGKILL); p.wait()
        print("returncode", p.returncode, "stop_sec", round(time.time() - t1, 1))
    else:
        print("returncode", p.returncode)
```
남은 프로세스·포트 확인 (각 실행 뒤): `pgrep -fl "uvicorn app.main:app"; pgrep -fl "next dev"; lsof -nP -iTCP -sTCP:LISTEN | grep -E ':(8000|3000|13000|18000) '` → 모두 출력 없음.

1. **`make check` (R13) 와 추적 파일 확인.** 루트에서:
   ```
   git status --porcelain > "$SCRATCH/status_before.txt"
   make check > "$SCRATCH/logs/V2-check.log" 2>&1; echo exit=$?
   git status --porcelain > "$SCRATCH/status_after.txt"; diff "$SCRATCH/status_before.txt" "$SCRATCH/status_after.txt"
   ```
   종료 0, `diff` 출력 없음. 출력이 있으면 바뀐 파일을 기록하고 `git checkout -- <그 파일>` 로 되돌린 뒤 결함으로 보고한다 (설정 파일이면 격리 회귀). backend 결과 줄이 `<174 + 새 테스트 수> passed` 이고 실패·오류 0.
2. **먼저 실패한 테스트 (테스트 우선 증거).** task 기록 02·04·05 에 테스트 커밋 시점의 실패 목록과 이유가 있다: `test_make_targets.py` (T1, T2 의 `test`=`check`, T3 의 `scripts/*`, T4, T5 — 지금 Makefile·compose 결함), `test_collect_script.py` (전부 — 스크립트 없음), `test_startup_seed.py` 빈 DB 경우 (`TimeoutError` — lifespan 이 수집을 await), `test_sources_write_fallback.py` 대체 경로 (`save_sources` 가 False). 그리고 `git log --oneline -- backend/tests/<파일>` 로 테스트 커밋이 코드 커밋보다 앞선다. `git diff <테스트 커밋> -- backend/tests/<파일>` 출력 없음 (단언 불변).
3. **기존 테스트·범위 불변.** `git diff --name-status 0f2b83b -- backend/tests/` 가 새 파일 4개의 `A` 줄뿐. `git diff --name-only 0f2b83b` 의 모든 경로가 '변경 파일' 목록 안 (`tasks/make-targets/*` 제외).
4. **문서 일치 (R15).** 루트에서 `git grep -nE 'scripts/test\.sh|지워진 .scripts/.|make[ ]reset-and-collect|config\.json:ro|격리는 미정|\*\*깨짐\*\*' -- CLAUDE.md docs ':!docs/features'` 출력 없음 (spec 원문의 `make reset-and-collect` 를 `make[ ]reset-and-collect` 로 바꿔 게이트에 걸리지 않게 한 같은 검사).
5. **실행 검증 V0~V9 (spec 3절).** 단계 6 이 V0·V1~V5·V7·V9 를, verify 가 V0~V9 전부를 이 순서로 돌린다. 시작과 끝의 `git status --porcelain` 이 같아야 한다.

   | ID | 명령 | 판정 |
   |---|---|---|
   | V0 | 단계 1 (a) 의 명령 | 포트 8000·3000·3001·13000·18000 LISTEN 없음, `agentlens` 컨테이너 없음. sha256 기록 |
   | V1 | `make setup > $SCRATCH/logs/V1-1.log 2>&1; echo exit=$?` 두 번 (`V1-2.log`), 그 사이 `shasum -a 256 .venv/pyvenv.cfg`. 그다음 `mv .venv "$SCRATCH/venv-orig"` → `make setup > $SCRATCH/logs/V1-3.log 2>&1` → `.venv/bin/python --version`, `cat .venv/pyvenv.cfg` → `rm -rf .venv && mv "$SCRATCH/venv-orig" .venv` (원래 `.venv` 복구) → `.venv/bin/python --version` | 셋 다 종료 0. 두 번째 실행 O 규칙 통과, "이미 있음" 줄, `pyvenv.cfg` sha256 이 첫 실행 뒤와 같다. 세 번째는 3.11.x 로 새로 만들었다 (`uv` 면 `pyvenv.cfg` 에 `uv =` 줄). 복구 뒤 3.11.9 |
   | V2 | 증명 1 의 `make check`, 같은 방식으로 `make test > $SCRATCH/logs/V2-test.log 2>&1` | 둘 다 종료 0, passed 수가 같다, 각각 뒤 `git status` 차이 없음 |
   | V3 | `make build > $SCRATCH/logs/V3.log 2>&1; echo exit=$?` | 종료 0, O 규칙 |
   | V4 | DB 사본 `sqlite3 backend/agentlens.db ".backup $SCRATCH/dev.db"`. (a)(b) `DATABASE_URL=sqlite+aiosqlite:///$SCRATCH/dev.db python3 $SCRATCH/sigint_run.py $SCRATCH/logs/V4a.log "http://127.0.0.1:8000/health,http://127.0.0.1:3000/api/health,http://127.0.0.1:3000/" 120 -- make dev`. 같은 것을 `-- ./scripts/dev.sh` 로 (`V4a-script.log`), `SIG=TERM` 으로 (`V4a-term.log`). (c) `python3 -m http.server 8000 --bind 127.0.0.1 > /dev/null 2>&1 & HP=$!; sleep 1; make dev > $SCRATCH/logs/V4c.log 2>&1; echo exit=$?; kill $HP`. (d) 빈 DB: `DATABASE_URL=sqlite+aiosqlite:///$SCRATCH/empty.db python3 $SCRATCH/sigint_run.py $SCRATCH/logs/V4d.log "http://127.0.0.1:8000/health" 15 -- make dev` (`empty.db` 는 없는 파일로 시작). 전후 `git status --porcelain` | (a) `ready True`, 세 URL 200. (b) `stop_sec` ≤ 10, `./scripts/dev.sh` 의 `returncode 0`, `make dev` 의 종료와 `Interrupt` 줄 유무를 그대로 기록(우려 3), SIGTERM 도 정리됨, 남은 프로세스·포트 없음. (c) 종료 1, 로그에 "포트 8000 사용 중", 남은 자식 없음. (d) `ready True`, `after_sec` ≤ 15, `body` 에 `"running":true`, SIGINT 뒤 남은 프로세스 없음, 로그에 첫 수집 백그라운드 줄. `git status` 같음, `frontend/AGENTS.md`·`frontend/CLAUDE.md` 없음 (R14) |
   | V5 | DB 사본 `sqlite3 backend/agentlens.db ".backup $SCRATCH/collect.db"`. (a) backend 없음 확인 뒤 `DATABASE_URL=sqlite+aiosqlite:///$SCRATCH/collect.db make collect > $SCRATCH/logs/V5a.log 2>&1; echo exit=$?`. (b) `sqlite3 backend/agentlens.db ".backup $SCRATCH/api.db"` 뒤 `DATABASE_URL=sqlite+aiosqlite:///$SCRATCH/api.db python3 $SCRATCH/sigint_run.py $SCRATCH/logs/V5b-dev.log "http://127.0.0.1:18000/health,http://127.0.0.1:13000/api/health" 120 --during "make collect AGENTLENS_API_URL=http://127.0.0.1:18000 > $SCRATCH/logs/V5b.log 2>&1; curl -s http://127.0.0.1:18000/api/schedule/status > $SCRATCH/logs/V5b-status.json" -- make dev DEV_BACKEND_PORT=18000 DEV_FRONTEND_PORT=13000`. (c) `make collect COLLECT_MODE=api AGENTLENS_API_URL=http://127.0.0.1:9 > $SCRATCH/logs/V5c.log 2>&1; echo exit=$?`. (d) `shasum -a 256 backend/agentlens.db agentlens.db` | (a) 첫 줄 `직접 모드: …/collect.db`, 종료 0. (b) `during_exit 0`, `V5b.log` 첫 줄 `API 모드: http://127.0.0.1:18000`, `V5b-status.json` 의 최근 로그에 새 항목. (c) 종료 1, "backend 가 없다". (d) V0 과 같다. 외부 수집·LLM 호출이 일어난다 (우려 6) |
   | V6 | **사람 또는 `RELEASE_APPROVAL` 이 설정된 세션만 실행한다** (hook 이 `*make reset*` 을 막는다. implementer·verifier 는 돌리지 않는다). 18000 backend 를 V5(b) 처럼 사본 DB 로 띄운 상태에서: `RELEASE_APPROVAL` 세션이면 `DATABASE_URL=sqlite+aiosqlite:///$SCRATCH/reset.db python3 $SCRATCH/sigint_run.py $SCRATCH/logs/V6-dev.log "http://127.0.0.1:18000/health" 120 --during "make reset AGENTLENS_API_URL=http://127.0.0.1:18000; echo a=\$?; make reset AGENTLENS_API_URL=http://127.0.0.1:18000; echo b=\$?" -- make dev DEV_BACKEND_PORT=18000 DEV_FRONTEND_PORT=13000` 뒤 `make reset AGENTLENS_API_URL=http://127.0.0.1:18000; echo c=$?`. 사람이면 터미널 하나에서 `DATABASE_URL=… make dev DEV_BACKEND_PORT=18000 DEV_FRONTEND_PORT=13000`, 프롬프트에서 `! make reset AGENTLENS_API_URL=http://127.0.0.1:18000` 을 두 번, dev 를 Ctrl-C 로 내린 뒤 한 번 더. `localhost:8000` 에는 보내지 않는다 | (a) 종료 0, 출력 JSON `"status": "started"`. (b) 종료 1, `already_running` 메시지. (c) 종료 1, "backend 가 없다". 출력을 verify 에 붙인다 |
   | V7 | `make docker-build > $SCRATCH/logs/V7-build.log 2>&1; echo exit=$?; docker image inspect agentlens-backend agentlens-frontend --format '{{.Id}}'`. `make docker-up > $SCRATCH/logs/V7-up.log 2>&1; echo exit=$?`, `docker compose ps`, `B=$(docker compose port backend 8000); F=$(docker compose port frontend 3001); curl -fsS http://$B/health; curl -fsS http://$F/api/health`. 설정 저장: `curl -s http://$B/api/briefing/settings > $SCRATCH/v7-settings.json; curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Content-Type: application/json' --data @$SCRATCH/v7-settings.json http://$B/api/briefing/settings; git diff --stat config.json`. 소스 저장: `shasum -a 256 sources.json; curl -s -w ' %{http_code}\n' -X PATCH http://$B/api/sources/rss/geeknews/toggle; shasum -a 256 sources.json; curl -s -w ' %{http_code}\n' -X PATCH http://$B/api/sources/rss/geeknews/toggle; docker compose logs backend 2>&1 \| grep -n 'Failed to write sources'; docker exec agentlens-backend ls /app/sources.tmp`. 되돌리기: `git diff config.json sources.json > $SCRATCH/logs/V7-config.diff; git checkout -- config.json sources.json`. `make docker-logs DOCKER_LOGS_ARGS=--tail=20 > $SCRATCH/logs/V7-logs20.log 2>&1; echo exit=$?`. `python3 $SCRATCH/sigint_run.py $SCRATCH/logs/V7-logsf.log "" 0 --during "sleep 5" -- make docker-logs` (URL 이 없으면 바로 준비로 보고 `--during` 의 5초 뒤 SIGINT). `make docker-down > $SCRATCH/logs/V7-down1.log 2>&1; echo exit=$?; docker ps -a --filter name=agentlens; docker volume ls \| grep agentlens-data; make docker-down > $SCRATCH/logs/V7-down2.log 2>&1; echo exit=$?` | build 종료 0 과 이미지 둘. up 종료 0, 두 서비스 `healthy`, 두 health 200. 설정 POST 200 (단계 1 에서는 500). 소스: 두 응답 200, 첫 토글 뒤 sha256 이 바뀌고 두 번째 뒤 처음 값으로 돌아옴, 로그에 `Failed to write sources` 없음, `/app/sources.tmp` 없음 (응답 코드만으로 판정하지 않는다: 위 '찾은 사실'). `config.json`·`sources.json` 되돌린 뒤 `git status` 기준선과 같음. logs 20줄 종료 0. `-f` 실행의 SIGINT 출력 기록 (우려 3). down 두 번 종료 0, 컨테이너 없음, volume 있음, 두 번째 O 규칙 |
   | V8 | (verify, 맨 마지막) `shasum -a 256 agentlens.db backend/agentlens.db config.json sources.json backend/app/config/sources.json .env frontend/next-env.d.ts > $SCRATCH/keep_before.txt` → `make clean > $SCRATCH/logs/V8.log 2>&1; echo exit=$?` → `ls -d .venv frontend/node_modules frontend/.next frontend/tsconfig.tsbuildinfo .pytest_cache backend/.pytest_cache backend/tests/test_agentlens.db* 2>&1`, `find . -name __pycache__ -not -path './.git/*' \| wc -l`, `shasum -a 256 … \| diff $SCRATCH/keep_before.txt -` → `make setup && make check` | clean 종료 0, 지울 목록 모두 없음, `__pycache__` 0, 남길 목록 sha256 같음, 이어지는 setup·check 종료 0 (그 뒤 증명 1 의 `git status` 절차) |
   | V9 | `for t in setup dev test build clean collect reset docker-build docker-up docker-down docker-logs check; do echo "== $t"; make -n $t; echo "exit=$?"; done > $SCRATCH/logs/V9.log 2>&1` | 12개 모두 `exit=0` |

6. **spec 우려 처리 기록.** verify 는 우려 1 (V6 을 누가 돌렸나), 우려 3 (`Interrupt` 줄 실제 출력), 우려 6·7 (외부 호출 여부, volume 상태), 단계 1 의 EBUSY 재현 결과(우려 9)를 각각 적는다.

## 승인
`! python3 "$(git rev-parse --show-toplevel)/.claude/hooks/sdlc_hook.py" approve docs/features/make-targets/plan.md`
