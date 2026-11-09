# 운영 가이드: AgentLens
Updated: 2026-11-09

코드와 설정 파일에서 역으로 정리한 운영 가이드다. 근거는 `path:line` 으로 단다. 대부분 코드로만 확인했다. `make` 대상과 Docker 실행 동작은 2026-11-09 에 실제로 돌려 확인했다. 데이터 구조는 `docs/data-model.md` 를 본다.

## 구성 한눈에 보기
| 구성 요소 | 포트 | 실행 | 상태 확인 |
|---|---|---|---|
| backend (FastAPI + APScheduler + SQLite) | 8000 | `uvicorn app.main:app --host 0.0.0.0 --port 8000` (`backend/Dockerfile:35`) | `GET /health` (`backend/app/main.py:75-77`) |
| frontend (Next.js 16 standalone) | Docker 3001, `next dev` 은 포트 미지정 | `node server.js` (`frontend/Dockerfile:60`), 개발은 `pnpm dev` (`frontend/package.json:6`) | `GET /api/health` (`frontend/src/app/api/health/route.ts`) |
| MCP 서버 (FastMCP, stdio) | 없음 | `python -m app.mcp.server` (cwd `backend/`) (`backend/app/mcp/server.py:55-56`, `backend/app/api/mcp.py:19-24`) | 없음 |

## 로컬 실행

### Makefile 타깃
레시피 셸은 `/bin/bash` 다 (`Makefile:1`). 대상 12개가 모두 `.PHONY` 에 있다 (`Makefile:3`). 실패를 숨기는 `|| true` 가 없어서, 레시피가 실패하면 make 는 `make: *** [<대상>] Error N` 줄을 내고 종료 2 로 끝난다 (GNU Make 동작). 스크립트(`scripts/dev.sh`, `scripts/collect.py`)의 실패 종료 코드는 1 이다.

| 타깃 | 하는 일 | 상태 | 근거 |
|---|---|---|---|
| `make setup` | `.venv/bin/python` 이 3.11 이면 "`.venv` 이미 있음" 만 내고 다시 만들지 않는다. 아니면 `uv venv --clear --python 3.11 .venv`, uv 가 없으면 `python3.11 -m venv --clear .venv`, 둘 다 없으면 종료 1. 의존성은 uv 가 있으면 `uv pip install --python .venv/bin/python -r backend/requirements.txt`, 없으면 `ensurepip` 뒤 `pip install`. pnpm 이 없으면 종료 1, 있으면 `cd frontend && pnpm install --frozen-lockfile`. 몇 번 돌려도 결과가 같다 | 동작 | `Makefile:15-39` |
| `make dev` | `./scripts/dev.sh` — backend(`uvicorn --reload`)와 frontend(`next dev`)를 함께 띄운다 (아래 '로컬 동시 실행') | 동작 | `Makefile:41-42`, `scripts/dev.sh` |
| `make test` | `make check` 와 같다 (`check` 를 전제 조건으로 둔 빈 대상) | 동작 | `Makefile:44` |
| `make build` | `cd frontend && pnpm build` | 동작 | `Makefile:46-47` |
| `make check` | `cd backend && ../.venv/bin/pytest -v tests/` 후 `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` | 동작 | `Makefile:98-101` |
| `make collect` | `cd backend && PYTHONPATH=. ../.venv/bin/python ../scripts/collect.py`. backend 가 떠 있으면 그 backend 에 수집을 시키고 끝날 때까지 기다린다(API 모드), 없으면 `backend/` 에서 로컬 DB 에 직접 수집한다(직접 모드). 첫 줄에 `API 모드: <URL>` 또는 `직접 모드: <DB 절대 경로>` 를 낸다 (아래 '수집 실행') | 동작 | `Makefile:54-55`, `scripts/collect.py` |
| `make reset` | `AGENTLENS_API_URL`(기본 `http://localhost:8000`)의 `/health` 를 확인한 뒤 `POST /api/schedule/reset-and-collect` — **데이터 삭제**. backend 가 없으면 "backend 가 없다" 와 실패, 응답이 `status: "started"` 가 아니면(예: `already_running`) 응답 메시지와 실패, 성공하면 응답 JSON 을 내고 종료 0 | 동작 | `Makefile:57-73` |
| `make clean` | `.venv`, `frontend/node_modules`, `frontend/.next`, `frontend/tsconfig.tsbuildinfo`, `.pytest_cache`, `backend/.pytest_cache`, 테스트 DB `backend/tests/test_agentlens.db`(`-wal`, `-shm`), `.git` 밖 모든 `__pycache__` 삭제. 데이터(`agentlens.db*`, `backend/agentlens.db*`), `.env*`, `config.json`, `sources.json`, `frontend/next-env.d.ts`, Docker 는 남긴다 | 동작 | `Makefile:49-52` |
| `make docker-build` | `docker compose build` | 동작 | `Makefile:75-77` |
| `make docker-up` | `docker compose up -d --wait --wait-timeout $(DOCKER_WAIT_TIMEOUT)` — 두 컨테이너가 healthy 가 될 때까지 기다린다(기본 180초, 넘기면 실패). 뒤에 접속 주소를 낸다 | 동작 | `Makefile:79-84` |
| `make docker-down` | `docker compose down` (named volume 은 지우지 않음). 떠 있는 것이 없어도 종료 0 | 동작 | `Makefile:86-88` |
| `make docker-logs` | `docker compose logs $(DOCKER_LOGS_ARGS)`, 기본 `-f --tail=200`. Ctrl-C 로 멈추면(`docker compose logs` 종료 130) "로그 보기를 멈췄다" 를 내고 레시피는 0 으로 끝난다. 그 밖의 실패 코드는 그대로 전달한다 | 동작 | `Makefile:90-96` |

변수 (`?=`, 명령 줄 `make collect COLLECT_MODE=api` 나 환경 변수로 바꾼다, `Makefile:5-13`):
| 변수 | 기본값 | 쓰는 대상 |
|---|---|---|
| `AGENTLENS_API_URL` | `http://localhost:8000` | `collect`, `reset` |
| `COLLECT_MODE` | `auto` (`auto`, `api`, `direct`) | `collect` |
| `COLLECT_TIMEOUT` | `1800` (초) | `collect` (API 모드 대기 한도) |
| `DOCKER_WAIT_TIMEOUT` | `180` (초) | `docker-up` |
| `DOCKER_LOGS_ARGS` | `-f --tail=200` | `docker-logs` |
| `DEV_BACKEND_PORT`, `DEV_FRONTEND_PORT`, `DEV_HOST`, `DEV_READY_TIMEOUT` | `8000`, `3000`, `0.0.0.0`, `120` (기본값은 `scripts/dev.sh:9-12`) | `dev` |

`DEV_*` 는 compose 가 쓰는 `BACKEND_PORT`·`FRONTEND_PORT` 와 이름이 다르다. 루트 `.env` 의 compose 포트가 `make dev` 에 섞이지 않는다.

Ctrl-C 와 make: `make dev`·`make docker-logs` 를 Ctrl-C 로 멈추면 레시피(`dev.sh`, `docker-logs` 레시피)는 정리하고 0 으로 끝나며 make 는 `Error` 줄을 내지 않는다. 다만 make 자신도 같은 프로세스 그룹에서 SIGINT 를 받으므로 셸이 보는 make 의 종료 상태는 SIGINT 종료(130)다.

`make check` 의 pytest 는 `.env`·환경 변수·루트 `config.json` 의 LLM 설정을 쓰지 않는다. LLM 호출은 `backend/tests/conftest.py` 의 흉내가 답하고, `config.json`·`sources.json` 은 세션 임시 사본에 쓴다. 그래서 키·로컬 Ollama 상태와 상관없이 결과가 같고 git 이 추적하는 설정 파일을 고치지 않는다. 스크래퍼(github.com 등)·api.notion.com·SMTP 호출은 실제로 나간다 (`test-strategy.md` '외부 호출과 파일 부작용').

### 로컬 동시 실행 (`make dev`)
```bash
make setup
make dev                                          # backend :8000, frontend :3000
make dev DEV_BACKEND_PORT=18000 DEV_FRONTEND_PORT=13000
```
`scripts/dev.sh` (bash 3.2 에서 돈다) 가 하는 일:
1. `.venv/bin/uvicorn` 과 `frontend/node_modules` 가 없으면 "make setup 을 먼저 실행한다" 와 종료 1.
2. 두 포트에 bash `/dev/tcp` 로 연결해 보고, 이미 쓰이면 아무것도 띄우지 않고 "포트 N 사용 중 (Docker 가 떠 있으면 make docker-down)" 과 종료 1. 다른 포트를 자동으로 고르지 않는다.
3. `set -m` 으로 두 프로세스를 각자 프로세스 그룹으로 띄운다. backend: `backend/` 에서 `../.venv/bin/uvicorn app.main:app --reload --reload-dir app --host $DEV_HOST --port $DEV_BACKEND_PORT`. frontend: `frontend/` 에서 `INTERNAL_API_URL=http://127.0.0.1:$DEV_BACKEND_PORT pnpm dev --port $DEV_FRONTEND_PORT`. `DEV_BACKEND_PORT` 가 8000 이 아니고 `NEXT_PUBLIC_API_URL` 이 비어 있으면 `NEXT_PUBLIC_API_URL=http://localhost:$DEV_BACKEND_PORT` 를 넘긴다.
4. `DEV_READY_TIMEOUT` 안에 backend `/health` 와 frontend `/api/health` 가 응답하면 frontend·backend·API 문서 주소를 낸다. 시간을 넘기거나 기다리는 중 하나가 죽으면 정리하고 종료 1.
5. 1초마다 두 프로세스를 본다. 하나가 끝나면 "<이름> 가 종료 코드 N 으로 끝났다" 를 내고 나머지를 내린 뒤 종료 1.
6. Ctrl-C·SIGTERM: 두 프로세스 그룹에 TERM, 10초 안에 안 내려가면 KILL, "중지했다" 와 종료 0. 비정상 종료 때도 `EXIT` trap 이 그룹을 정리한다.

- DB 는 `backend/` 기준 `DATABASE_URL`(기본 `backend/agentlens.db`) 을 쓴다. 다른 DB 는 `DATABASE_URL=sqlite+aiosqlite:///<경로> make dev`.
- `next dev` 가 `frontend/AGENTS.md`·`frontend/CLAUDE.md` 를 만들지 않게 `next.config.ts` 에 `agentRules: false` 가 있다 (`frontend/next.config.ts:11-12`).
- backend 는 `0.0.0.0` 에 뜬다 (LAN·Tailscale 접속용). 좁히려면 `DEV_HOST=127.0.0.1`.

### backend 단독 실행
`app` 패키지가 `backend/` 아래에 있고(`backend/pytest.ini:2` 의 `pythonpath = .`), Docker 의 실행 명령이 `uvicorn app.main:app` 이므로 `backend/` 에서 실행한다.

```bash
make setup
cd backend
../.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- cwd 가 `backend/` 이면 DB 는 `backend/agentlens.db`, config 는 `../config.json`(루트), sources 는 `../sources.json`(루트), `.env` 는 `backend/.env` 가 먼저 읽힌다 (아래 '설정 우선순위').
- 시작 순서 (`backend/app/main.py:23-47`): `ensure_db_schema()` → `start_scheduler()` → `news_items` 개수를 센다 → 0건이면 `[AgentLens] Initial database seed collection (백그라운드로)...` 를 내고 `collect_all()` 을 **백그라운드 태스크로** 띄운 뒤 바로 요청을 받기 시작한다 (`/health` 의 `running` 이 `true`). 종료 시 끝나지 않은 첫 수집 태스크를 취소하고 기다린 뒤, 스케줄러를 멈추고 엔진을 dispose 한다. 첫 수집 태스크가 취소가 아닌 예외로 끝나면 `[AgentLens] 첫 수집 백그라운드 태스크 오류: …` 한 줄을 낸다 (`main.py:15-20`).
- API 문서: `http://localhost:8000/docs` (`main.py:73`).

### frontend 단독 실행
```bash
cd frontend
pnpm install
pnpm dev          # next dev (포트 지정 없음)
# 프로덕션 번들: pnpm build 후 .next/standalone/server.js 실행 (output: "standalone", next.config.ts:9)
```
- `/api/:path*` 는 `INTERNAL_API_URL`(없으면 `http://127.0.0.1:8000`) 로 rewrite 된다 (`frontend/next.config.ts:23-31`).
- `allowedDevOrigins` 에 `localhost`, `127.0.0.1`, `*.ts.net`, 특정 Tailscale 호스트, `192.168.1.109` 가 하드코딩되어 있다 (`next.config.ts:16-22`).
- 프론트 env 파일은 `frontend/` 기준으로 읽힌다. `frontend/.env.example` 은 `frontend/.gitignore:34` 의 `.env*` 에 걸려 git 에 없다.

## Docker

### docker-compose.yml
| 항목 | backend | frontend |
|---|---|---|
| 빌드 | `./backend`, `Dockerfile` | `./frontend`, `Dockerfile` |
| 컨테이너 | `agentlens-backend` | `agentlens-frontend` |
| 재시작 | `unless-stopped` | `unless-stopped` |
| 포트 | `${BACKEND_PORT:-8000}:8000` | `${FRONTEND_PORT:-3001}:3001` |
| 볼륨 | `agentlens-data:/app/data`, `./config.json:/app/config.json:rw`, `./sources.json:/app/sources.json:rw` (두 설정 파일은 단일 파일 bind mount. Docker 에서 설정·소스를 저장하면 git 이 추적하는 루트 파일이 바뀐다) | 없음 |
| healthcheck | `curl -f http://127.0.0.1:8000/health`, interval 10s, timeout 5s, retries 5, start_period 10s | `wget -qO- http://127.0.0.1:3001/api/health`, interval 10s, timeout 5s, retries 3, start_period 10s |
| 의존 | — | `backend: condition: service_healthy` |
| 기타 | `extra_hosts: host.docker.internal:host-gateway` | — |
| 네트워크 | `agentlens-network` (bridge) | 같음 |

근거: `docker-compose.yml:7-84`. volume `agentlens-data` 는 `name: agentlens-data`, `driver: local` 이다.

compose 가 컨테이너에 넣는 환경 변수 (`${VAR:-기본}` 은 루트 `.env` 또는 셸 환경에서 치환된다):
| 서비스 | 변수 | 값 |
|---|---|---|
| backend | `PROJECT_NAME` | `AgentLens` |
| backend | `VERSION` | `${VERSION:-0.3.1}` |
| backend | `HOST`, `PORT` | `0.0.0.0`, `8000` (backend 코드는 읽지 않는다. 포트는 Dockerfile CMD 고정) |
| backend | `DATABASE_URL` | `sqlite+aiosqlite:///./data/agentlens.db` (고정) |
| backend | `SECRET_KEY` | `${SECRET_KEY:-agentlens-default-secret-key-32chars-minimum-safe-value}` |
| backend | `CRAWL_SCHEDULE_HOURS`, `CRAWL_TIMEZONE` | `${…:-0,6,12,18}`, `${…:-UTC}` |
| backend | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_COLLECTION_MODEL`, `ANTHROPIC_DEFAULT_CHAT_MODEL` | 키는 빈 값 기본, 모델은 `claude-sonnet-5-5` |
| backend | `GEMINI_API_KEY`, `GEMINI_MODEL` | 빈 값, `gemini-3.5-flash-lite` |
| backend | `OPENAI_API_KEY`, `OPENAI_MODEL` | 빈 값, `gpt-4o-mini` |
| backend | `OLLAMA_BASE_URL` | `${OLLAMA_BASE_URL:-http://host.docker.internal:11434}` |
| backend | `SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL` | 빈 값 |
| frontend | `NODE_ENV`, `PORT` | `production`, `3001` |
| frontend | `INTERNAL_API_URL` | `http://backend:8000` |
| frontend | `NEXT_PUBLIC_API_URL` | `${NEXT_PUBLIC_API_URL:-}` |

compose 가 넘기지 않는 Settings 필드(`ENVIRONMENT`, `ANTHROPIC_HAIKU/SONNET/OPUS_MODEL`, `OLLAMA_MODEL`, `NOTION_*`, `SMTP_*`, `EMAIL_AUTO_SEND` 등)는 마운트된 `config.json` 값 또는 코드 기본값을 쓴다. backend 이미지는 `.env` 를 포함하지 않는다 (`backend/.dockerignore`).

### backend/Dockerfile
| 단계 | 내용 | 근거 |
|---|---|---|
| 베이스 | `python:3.11-slim` (단일 단계 `runner`) | `backend/Dockerfile:6` |
| 환경 | `PYTHONUNBUFFERED=1`, `PYTHONDONTWRITEBYTECODE=1`, `PYTHONPATH=/app`, `WORKDIR /app` | `:8-12` |
| 시스템 패키지 | `curl` (healthcheck 용) | `:15-17` |
| 의존성 | `pip install --no-cache-dir -r requirements.txt` | `:20-21` |
| 소스 | `COPY app/ ./app/` (tests 는 `.dockerignore` 로 제외) | `:24` |
| 데이터 | `mkdir -p /app/data` | `:27` |
| 노출·헬스 | `EXPOSE 8000`, `HEALTHCHECK` 15s/5s/start 10s/retries 3 (compose 설정이 덮어씀) | `:29-33` |
| 실행 | `uvicorn app.main:app --host 0.0.0.0 --port 8000` | `:35` |

### frontend/Dockerfile
| 단계 | 내용 | 근거 |
|---|---|---|
| 1. `deps` (`node:20-alpine`) | `libc6-compat`, `corepack prepare pnpm@latest`, `pnpm install --frozen-lockfile` | `frontend/Dockerfile:7-14` |
| 2. `builder` | node_modules 복사, 소스 복사, `NEXT_TELEMETRY_DISABLED=1`, `NODE_ENV=production`, `INTERNAL_API_URL=http://backend:8000`, `pnpm build` | `:17-31` |
| 3. `runner` | `PORT=3001`, `HOSTNAME=0.0.0.0`, `INTERNAL_API_URL=http://backend:8000`, uid 1001 `nextjs` 사용자, `public`·`.next/standalone`·`.next/static` 복사, `EXPOSE 3001`, `HEALTHCHECK`, `node server.js` | `:34-60` |

- `corepack prepare pnpm@latest` 는 버전을 고정하지 않는다. `package.json` 의 `packageManager` 는 `pnpm@12.3.4` 다 (`frontend/package.json:40`).
- builder 단계에 `NEXT_PUBLIC_API_URL` 을 넘기는 `ARG`/`ENV` 가 없다.

## 설정과 환경 변수

### 설정 우선순위 (backend)
`backend/app/config.py` 의 `Settings`(pydantic-settings)가 다음 순서로 값을 정한다. 위가 이긴다.

1. 프로세스 환경 변수.
2. `.env` 파일 — import 시 `load_dotenv(override=False)` 로 아래 순서에서 **먼저 찾은 파일의 값이 이긴다** (`config.py:8-10`): `cwd/.env` → `cwd/backend/.env` → `cwd/../.env` → `backend/.env`(파일 위치 기준). 이어서 `env_file=(".env", "backend/.env", "../.env")`(cwd 기준)도 지정되어 있다 (`config.py:102-106`).
3. 루트 `config.json` 값 — 필드 기본값으로 들어간다 (`config.py:37-100`).
4. 코드에 적힌 기본값.

예외와 보정 (`merge_json_and_env`, `config.py:108-142`):
- LLM 키·모델 필드가 빈 문자열이면 config.json → `os.environ` → 하드코딩 순으로 다시 채운다.
- `GEMINI_MODEL` 이 빈 값이거나 `gemini-2.0-flash`, `gemini-flash-latest` 면 config.json 값 또는 `gemini-3.5-flash-lite` 로 바꾼다 (`config.py:127-128`).
- `TESTING` 환경 변수가 있으면 `true/1/yes` 여부로 정한다 (`config.py:131-132`).
- `ENVIRONMENT=production` 인데 `SECRET_KEY` 가 32자 미만이면 import 시 `ValueError` 로 앱이 뜨지 않는다 (`config.py:140-141`).
- 별도로, LLM 호출 코드는 호출 때마다 `load_json_config()` 로 config.json 을 다시 읽어 Settings 값이 비었을 때 쓴다. OpenAI 키·모델과 Ollama 주소·모델은 `LLMProcessor` 의 해석 함수 `_resolve_openai_key`, `_resolve_openai_chat_model`, `_resolve_ollama_url`, `_resolve_ollama_generate_model` 이 정한다 (`llm_processor.py:129-169`). 순서는 OpenAI 키 `settings` → `llm.openai_api_key` → `os.environ`, OpenAI 모델 `settings` → `llm.openai_model` → `gpt-4o-mini`, Ollama 주소 `settings` → `llm.ollama_base_url` (끝 `/` 제거), Ollama 모델 `settings` → `llm.ollama_model` → `llama3.2:latest` 다. 싱글턴의 `llm_processor.openai_key`·`ollama_url` 은 명시 덮어쓰기 자리라 `None` 이면 위 순서를 따르고 문자열(빈 값 포함)이면 그 값만 쓴다. Gemini 키는 `llm_processor.py:200-206`, Anthropic 키는 `anthropic_provider.py:152-159`.
- `settings.reload()` (설정 API 저장 후 호출)는 config.json 을 다시 읽지만, 반영 범위가 제한된다 ('알려진 불일치·위험').

### Settings 필드 전체
env 이름은 필드 이름과 같다. "사용" 열이 "없음"이면 그 필드를 읽는 코드가 `backend/app` 에 없다.

| 필드 | 코드 기본값 | config.json 키 | 사용 |
|---|---|---|---|
| PROJECT_NAME | `AgentLens` | `app.project_name` | `main.py:49` |
| VERSION | `0.3.1` | `app.version` | `main.py:49, 73, 77` |
| DATABASE_URL | `sqlite+aiosqlite:///./agentlens.db` | `app.database_url` | `database.py:7-17` |
| CRAWL_SCHEDULE_HOURS | `0,6,12,18` | `scheduler.crawl_hours` (배열 → 쉼표 문자열) | `scheduler.py:9` (다음 실행 계산 폴백·상태 표시만) |
| CRAWL_TIMEZONE | `UTC` | `scheduler.timezone` | `api/schedule.py:34` (표시만) |
| CORS_ORIGINS | `["*"]` | — | 없음 (`main.py:52` 이 `["*"]` 하드코딩) |
| USER_AGENT | `AgentLens-Collector/1.0` | `crawler.user_agent` | 없음 |
| LLM_PROVIDER | `auto` | `llm.provider` | 없음 |
| ANTHROPIC_API_KEY | `""` | `llm.anthropic_api_key` | `anthropic_provider.py:155` |
| ANTHROPIC_MODEL | `claude-sonnet-5-5` | `llm.anthropic_model` | `anthropic_provider.py:40, 46`, `llm_processor.py:99` |
| ANTHROPIC_COLLECTION_MODEL | `claude-sonnet-5-5` | `llm.anthropic_collection_model` | `anthropic_provider.py:345` |
| ANTHROPIC_DEFAULT_CHAT_MODEL | `claude-sonnet-5-5` | `llm.anthropic_default_chat_model` | `anthropic_provider.py:44, 86`, `schemas/chat.py:7`, `llm_processor.py:99` |
| ANTHROPIC_HAIKU_MODEL | `claude-haiku-5-5` | `llm.anthropic_haiku_model` | `anthropic_provider.py:32`, `chat_service.py:397` |
| ANTHROPIC_SONNET_MODEL | `claude-sonnet-5-5` | `llm.anthropic_sonnet_model` | `anthropic_provider.py:37` |
| ANTHROPIC_OPUS_MODEL | `claude-opus-5-5` | `llm.anthropic_opus_model` | `anthropic_provider.py:34` |
| GEMINI_API_KEY | `""` | `llm.gemini_api_key` | `llm_processor.py:114, 202, 306` |
| GEMINI_MODEL | `gemini-3.5-flash-lite` | `llm.gemini_model` | `llm_processor.py:212` |
| OPENAI_API_KEY | `""` | `llm.openai_api_key` | `llm_processor.py:135` (`_resolve_openai_key`, 쓰는 곳 `:249, 316, 381, 447, 922`) |
| OPENAI_MODEL | `gpt-4o-mini` | `llm.openai_model` | `llm_processor.py:145` (`_resolve_openai_chat_model`, 쓰는 곳 `:252, 452, 927`) |
| OLLAMA_BASE_URL | `http://localhost:11434` | `llm.ollama_base_url` | `llm_processor.py:156` (`_resolve_ollama_url`, 쓰는 곳 `:272, 319, 476`) |
| OLLAMA_MODEL | `llama3.2:latest` | `llm.ollama_model` | `llm_processor.py:166` (`_resolve_ollama_generate_model`, 쓰는 곳 `:275, 319, 478`). 가용 판정과 생성이 같은 모델을 본다 |
| TESTING | `False` | — | `llm_processor.py:291` |
| QUALITY_CUTOFF_SCORE | `5.0` | `llm.quality_cutoff_score` | `llm_processor.py:567, 660` |
| HIGH_SIGNAL_THRESHOLD | `7.8` | `llm.high_signal_threshold` | `llm_processor.py:568, 661` |
| CHAT_SESSION_MAX_LIMIT | `30` | `chat.max_session_limit` | 없음 (30 하드코딩, `chat_session_service.py:277, 368`) |
| CHAT_HISTORY_MAX_TURNS | `10` | `chat.max_history_turns` | 없음 |
| CHAT_HISTORY_MAX_TOKENS | `3000` | `chat.max_history_tokens` | 없음 |
| SCRAPER_TIMEOUT_SECONDS | `5.0` | `scraper.timeout_seconds` | 없음 |
| AGENTIC_SEARCH_MAX_QUERIES | `2` | `search.max_queries` | 없음 |
| BRIEFING_TITLE | `오늘의 AI 브리핑` | `briefing.title` | 없음 |
| BRIEFING_AUTO_DISPATCH_HOUR | `0` | `briefing.auto_dispatch_hour` | 없음 (발송 시각은 cron 하드코딩) |
| NOTION_API_KEY | `""` | `briefing.notion.api_key` | `notion_service.py:35, 218`, `briefing_service.py:216` |
| NOTION_PAGE_ID | `""` | `briefing.notion.page_id` | `notion_service.py:51, 219` |
| NOTION_AUTO_EXPORT | `False` | `briefing.notion.auto_export` | `briefing_service.py:216` |
| SMTP_HOST | `""` | `briefing.email.smtp_host` | `email_service.py:190, 233`, `briefing_service.py:228` |
| SMTP_PORT | `587` | `briefing.email.smtp_port` | `email_service.py:191, 234` |
| SMTP_USER | `""` | `briefing.email.smtp_user` | `email_service.py:192, 235` |
| SMTP_PASSWORD | `""` | `briefing.email.smtp_password` | `email_service.py:193, 236` |
| SMTP_FROM | `""` | `briefing.email.smtp_from` | `email_service.py:204, 238` |
| SMTP_TO | `""` | `briefing.email.smtp_to` | `email_service.py:195, 240`, `briefing_service.py:228` |
| SMTP_USE_TLS | `True` | `briefing.email.use_tls` | `email_service.py:194, 237` |
| EMAIL_AUTO_SEND | `False` | `briefing.email.auto_send` | `briefing_service.py:228` |
| SECRET_KEY | `agentlens-default-secret-key-32chars-minimum-safe-value` | `security.secret_key` | production 길이 검사만 (`config.py:140-141`) |
| ENVIRONMENT | `development` | — | `config.py:140` |
| SLACK_WEBHOOK_URL | `""` | `webhooks.slack_webhook_url` | `briefing_service.py:252-253` |
| DISCORD_WEBHOOK_URL | `""` | `webhooks.discord_webhook_url` | `briefing_service.py:254-255` |

`model_config` 가 `extra="allow"` 라 `.env` 의 다른 키(`HOST`, `PORT`, `NEXT_PUBLIC_API_URL` 등)도 오류 없이 무시된다 (`config.py:102-106`).

### env 예시 파일
| 파일 | git | 내용 |
|---|---|---|
| `.env.example` (루트) | 추적 | backend 변수 + `NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL`, `FRONTEND_PORT` |
| `backend/.env.example` | 추적 | backend 변수 |
| `frontend/.env.example` | 미추적 (`frontend/.gitignore:34`) | `NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL`, `PORT`, `NODE_ENV` |
| `.env`, `backend/.env`, `frontend/.env.local` | 미추적 (`.gitignore:6-9`) | 로컬 값 |

### frontend 환경 변수
| 변수 | 읽는 곳 | 의미 |
|---|---|---|
| `INTERNAL_API_URL` | `next.config.ts:24` (rewrite 대상), `src/lib/api.ts:9, 22` (서버 쪽 fetch) | backend 주소. 기본 `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_API_URL` | `src/lib/api.ts:13-14` (`getDirectApiBase`), `api.ts:9` | SSE 직접 연결 주소. 없으면 브라우저 호스트의 `:8000` |
| `NODE_ENV`, `PORT` | `src/lib/env.ts:15-16`, Docker runner | |

`src/lib/env.ts` 는 zod 스키마(`NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL` 은 URL 또는 빈 문자열, `NODE_ENV`, `PORT`)를 정의하지만 `src/` 안에서 import 하는 파일이 없다.

## 스케줄 작업
`AsyncIOScheduler` 기본 설정(메모리 job store)이다. 모든 cron 은 **UTC 로 하드코딩**되어 있고 config 값의 영향을 받지 않는다 (`backend/app/scheduler.py:37-64`).

| job id | 이름 | 시각 (UTC) | 함수 | 하는 일 |
|---|---|---|---|---|
| `daily_crawl` | Daily 0,6,12,18 Global Crawl | 0·6·12·18시 0분 | `scheduled_crawl_job` (`scheduler.py:11-13`) | `collector_manager.collect_all()` |
| `deep_research` | Autonomous Deep Research Cycle | 3·15시 0분 | `scheduled_deep_research_job` (`scheduler.py:15-18`) | `deep_researcher.run_deep_research()` — 후보 소스 탐색, `source_research_logs` 기록, 점수 8.2 이상이면 `sources.json` 에 자동 추가 |
| `daily_briefing_dispatch` | Daily Briefing Auto Dispatch | 0시 15분 | `scheduled_briefing_dispatch_job` (`scheduler.py:20-23`) | `briefing_service.auto_dispatch_all()` — 조건이 맞는 Notion·이메일·웹훅으로 발송 |

시작 시 동작:
- `start_scheduler()` 가 위 3개 job 을 `replace_existing=True` 로 등록하고 시작한다 (`scheduler.py:37-64`). config.json 의 `scheduler.enabled` 는 읽지 않으므로 끌 수 없다.
- DB 의 `news_items` 가 0건이면 lifespan 이 수집을 백그라운드 태스크로 한 번 띄우고 바로 요청을 받는다. 서버를 내릴 때 끝나지 않았으면 취소한다 (`main.py:28-45`).
- `GET /api/schedule/status` 의 `next_run` 은 `daily_crawl` job 의 다음 실행 시각이다. job 이 없을 때만 `CRAWL_SCHEDULE_HOURS` 로 계산한다 (`scheduler.py:25-35`).

수동 실행:
| 작업 | 방법 |
|---|---|
| 수집 | `POST /api/schedule/trigger` (백그라운드, 진행 중이면 `already_running`, `api/schedule.py:48-67`), `make collect`, MCP 도구 `trigger_agentlens_crawl` |
| 진행 상황 | `GET /api/schedule/progress` (`api/schedule.py:43-46`) |
| 딥 리서치 | `POST /api/research/run-deep?max_candidates=6` (`api/research.py:77-86`), 상태 `GET /api/research/status` |
| 브리핑 | `GET /api/briefing/today`, `POST /api/briefing/generate`, `POST /api/briefing/export/notion`, `POST /api/briefing/send/email`, `POST /api/webhook/send-briefing` |

### 수집 실행 (`make collect`)
`scripts/collect.py` 가 `AGENTLENS_API_URL`, `COLLECT_MODE`, `COLLECT_TIMEOUT` 을 환경에서 읽는다 (Makefile 이 export).
- 모드 선택: `GET {URL}/health` (2초 제한)가 200 이고 `status == "healthy"` 면 backend 가 있다고 본다. `auto` 는 있으면 API 모드, 없으면 직접 모드. `api` 는 없으면 `make collect: <URL> 에 backend 가 없다` 와 종료 1. `direct` 는 backend 가 있어도 직접 모드 (같은 DB 일 수 있다는 경고 한 줄).
- API 모드: `GET /api/schedule/progress` 의 `last_crawl_time` 을 기억하고 `POST /api/schedule/trigger` 를 보낸다 (`already_running` 이면 그 수집을 기다린다). 2초마다 progress 를 보며 바뀐 `step_message` 를 낸다. `is_running` 이 false 가 되고 `last_crawl_time` 이 바뀌었으면 `수집 완료: 수집 N건, 저장 M건` 과 종료 0. `last_crawl_time` 이 그대로면 수집이 오류로 끝난 것으로 보고 종료 1. `COLLECT_TIMEOUT` 을 넘기거나 요청이 실패하면 종료 1. Docker 를 띄운 상태면 volume DB, `make dev` 상태면 dev backend 의 DB 를 채운다.
- 직접 모드: `ensure_db_schema()` 뒤 `collect_all()` 을 이 프로세스에서 돈다. 소스마다 `<이름>: N건` 또는 `<이름>: 실패 - <오류>` 를 내고, 실패한 소스가 있으면 `실패한 소스: …` 한 줄. 반환 `status` 가 `success` 가 아니거나 모든 소스가 실패하면 종료 1. DB 는 `backend/` 기준 `DATABASE_URL`.
- 외부 소스·LLM 호출이 실제로 일어난다. 2026-11-09 실측(두 모드를 동시에 돌림): 각각 수집 250건, 약 13분.

## 외부 의존
| 대상 | 필요한 설정 | 쓰는 곳 | 설정이 없을 때 |
|---|---|---|---|
| Anthropic API | `ANTHROPIC_API_KEY` (또는 `llm.anthropic_api_key`) | 챗·질문 답변 1순위, 수집 평가(`anthropic_provider.py:152-162`, `llm_processor.py:364-378`) | 다음 프로바이더로 넘어간다 |
| OpenAI API | `OPENAI_API_KEY` (또는 `llm.openai_api_key`, 환경 변수) | 2순위 (`llm_processor.py:380-391, 446-473`). 키가 있으면 쓸 수 있다고 본다 (키 유효성은 보지 않음) | 다음으로 넘어간다 |
| Ollama | `OLLAMA_BASE_URL` (기본 `http://localhost:11434`, Docker `http://host.docker.internal:11434`), `OLLAMA_MODEL` (기본 `llama3.2:latest`) | 3순위. 가용성 판단 때 `GET {주소}/api/tags` 를 1초 타임아웃으로 한 번 동기 호출하고, 200 이며 `models[].name` 또는 `model` 에 설정 모델(태그를 생략하면 `:latest` 를 붙여 비교)이 있어야 쓸 수 있다 (`_ollama_status`, `llm_processor.py:171-194`) | 주소 없음·연결 실패·200 아님·응답 해석 실패·설정 모델 미설치면 가용 프로바이더 없음 |
| Google Gemini | `GEMINI_API_KEY` | 요청 모델 이름에 `gemini` 가 있을 때만 (`llm_processor.py:346-352, 410-417`). 기본 체인에는 없다 | 그 요청은 503 |
| Notion API | `NOTION_API_KEY`, `NOTION_PAGE_ID`, 자동 발송은 `NOTION_AUTO_EXPORT` | `notion_service.py`, `briefing_service.py:216` | 자동 발송 건너뜀, 수동 내보내기는 오류 메시지 |
| SMTP | `SMTP_HOST`, `SMTP_TO`(+ `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_PORT`, `SMTP_USE_TLS`, `SMTP_FROM`), 자동 발송은 `EMAIL_AUTO_SEND` | `email_service.py`, `briefing_service.py:228` | 자동 발송 건너뜀, 수동 발송은 "SMTP 설정이 완료되지 않았습니다" |
| Slack / Discord 웹훅 | `SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL` | 자동 발송 (`briefing_service.py:252-255`), 수동 `POST /api/webhook/test`, `/send-briefing` 은 요청 본문의 URL 사용 | 자동 발송 건너뜀 |
| HackerNews (Algolia) | 없음 | `hn.algolia.com/api/v1/search_by_date` (`collectors/sources/hackernews.py:7`) | — |
| GitHub | 없음 (토큰 헤더를 보내지 않음) | `api.github.com/search/repositories` (`collectors/sources/github.py:7, 19`) | — |
| Reddit | 없음 | `www.reddit.com/r/<sub>/hot.json` (`collectors/sources/reddit.py:20`) | — |
| arXiv | 없음 | `http://export.arxiv.org/api/query` (`collectors/sources/arxiv.py:8`) | — |
| Hugging Face | 없음 | `huggingface.co/api/daily_papers` (`collectors/sources/huggingface.py:7`) | — |
| RSS/Atom 피드 | `sources.json` 의 `rss_feeds` | `collectors/sources/rss.py` (피드당 6초, 동시 6개) | `rss_feeds` 가 비면 내장 5개 피드 사용 (`rss.py:12-22`) |

LLM 이 하나도 없을 때:
| 기능 | 동작 | 근거 |
|---|---|---|
| 수집 평가·분류 | 휴리스틱 점수와 키워드 분류로 저장 (`evaluated_by: heuristic_fallback`) | `llm_processor.py:681-709` |
| 소식 질문 (`/api/news/{id}/ask`, `/ask/stream`) | 휴리스틱 답변 | `llm_processor.py:787-792, 948-958` |
| AI 챗 (`/api/chat/query`, `/api/chat/stream`) | HTTP 503 `ERR_LLM_PROVIDER_UNAVAILABLE` | `llm_processor.py:327-337`, `api/chat.py:239-247` |

테스트 환경 판단(`TESTING`, `CI`, 또는 `pytest` import 여부)은 `is_test_environment()` 에 있다 (`llm_processor.py:288-299`).

## 파괴적 작업
| 작업 | 지우는 것 | 안전장치 | 근거 |
|---|---|---|---|
| `POST /api/schedule/reset-and-collect` | `news_items` 전체, `crawl_logs` 전체. 이어서 백그라운드 재수집 | 수집 중이면 거부 | `api/schedule.py:69-99` |
| `make reset` | 위 엔드포인트를 `AGENTLENS_API_URL`(기본 `http://localhost:8000`) 에 호출 | 위와 같음. backend 가 없거나 응답이 `started` 가 아니면 실패로 끝난다. 이 대상은 `RELEASE_APPROVAL` 이 있는 세션에서만 실행된다 (파괴적 명령 게이트) | `Makefile:57-73` |
| `DELETE /api/news/all` | `news_items` 전체 | 없음 (수집 중 검사 없음) | `api/news.py:96-102` |
| `DELETE /api/chat/sessions/{id}` | 세션과 메시지 | — | `chat_session_service.py:280-297` |
| `DELETE /api/sources/{type}/{id}` | `sources.json` 항목 | — | `api/sources.py:85`, `sources_service.py:245-262` |
| `POST /api/briefing/settings` | `config.json` 전체를 다시 씀 | `"***"` 값은 비밀번호·키를 유지 | `api/briefing.py:161-211` |
| `make clean` | `.venv`, `frontend/node_modules`, `frontend/.next`, `frontend/tsconfig.tsbuildinfo`, pytest 캐시, 테스트 DB, `__pycache__` (데이터·설정 아님) | 수집 DB·`.env`·설정 파일·Docker 는 남긴다 | `Makefile:49-52` |
| `docker compose down -v` | named volume `agentlens-data` (DB) | Makefile 에는 `-v` 가 없다 | `Makefile:88` |

주의:
- 인증이 없다. 모든 API 가 열려 있고 CORS 는 모든 origin 을 허용한다 (`main.py:50-56`). 네트워크에 노출하면 누구나 위 작업을 호출할 수 있다.
- 리셋은 `chat_sessions.active_source_id` 를 NULL 로 만들고(FK `ON DELETE SET NULL`), `source_research_logs`, 챗 기록, 프론트 localStorage 북마크는 남긴다.
- 리셋 뒤 DB 가 비어도 재시작 시 자동 시드 수집이 백그라운드로 돈다 (`main.py:28-36`).

## 헬스체크·로그·버전
| 확인 | 방법 | 응답 |
|---|---|---|
| backend 헬스 | `curl http://localhost:8000/health` | `{"status": "healthy", "version": <VERSION>, "running": <수집 중 여부>}` (`main.py:75-77`) |
| backend 정보 | `curl http://localhost:8000/` | `{"service": "AgentLens API", "version", "docs": "/docs"}` (`main.py:71-73`) |
| frontend 헬스 | `curl http://localhost:3001/api/health` | `{"status": "healthy", "service": "agentlens-frontend", "version": "0.3.1"(하드코딩), "timestamp"}` |
| 수집 상태 | `GET /api/schedule/status`, `GET /api/schedule/progress` | 다음 실행, 최근 `crawl_logs` 5개, 진행 단계 |
| 소스 파일 위치 | `GET /api/sources` 의 `sources_file` | 실제로 읽는 sources.json 경로 (`api/sources.py:32`) |
| MCP 연결 정보 | `GET /api/mcp/info` | Claude Desktop 설정 예 (python 경로, cwd) |
| 버전 | 위 헬스 응답, `git describe --tags`, `frontend/package.json` `version` | |
| 컨테이너 상태 | `docker compose ps` (healthcheck 결과 포함) | |

로그:
- Docker: `make docker-logs` (= `docker compose logs -f --tail=200`, Ctrl-C 로 멈춤). 끝나는 실행은 `make docker-logs DOCKER_LOGS_ARGS=--tail=50`.
- backend 는 `print` 와 `logging.getLogger("agentlens.*")` 를 섞어 쓴다. 로깅 설정 코드(`basicConfig`, `dictConfig`)가 없다 (`grep` 결과 없음). 처리하지 않은 예외는 경로와 traceback 을 `print` 한다 (`main.py:58-67`).
- 주요 `print` 메시지: `[Scheduler] Started for Crawl …`(`scheduler.py:64`), `[Scheduler] … triggered at …`(`scheduler.py:12, 16, 21`), `[AgentLens] Initial database seed collection (백그라운드로)...`(`main.py:34`), `[AgentLens] 첫 수집 백그라운드 태스크 오류: …`(`main.py:20`), `[AgentLens ERROR] Unhandled exception on …`(`main.py:61`), `[Config] Error saving config.json`(`config.py:172`).

## 자주 생길 문제
| 증상 | 원인 (코드 근거) | 확인 방법 |
|---|---|---|
| 빈 DB 로 띄웠는데 소식이 한동안 비어 있다 | 첫 수집이 백그라운드로 돈다 (`main.py:28-36`). 서버는 바로 요청을 받지만 수집이 끝나야 소식이 쌓인다 (실측 약 13분, 네트워크·LLM 상태에 따라 다름) | `/health` 의 `running`, `GET /api/schedule/progress` |
| `make docker-up` 이 실패한다 | `--wait` 가 `DOCKER_WAIT_TIMEOUT`(기본 180초) 안에 두 컨테이너가 healthy 가 되지 않으면 실패로 끝난다 (`Makefile:79-84`). 포트 충돌이면 compose 가 바인딩 실패로 끝난다 | `docker compose ps`, `make docker-logs DOCKER_LOGS_ARGS=--tail=50` |
| `make dev` 가 "포트 N 사용 중" 으로 끝난다 | 8000·3000 을 이미 누가 쓴다. Docker backend 도 8000 을 쓴다 (`scripts/dev.sh` 포트 확인) | `make docker-down` 또는 `make dev DEV_BACKEND_PORT=18000 DEV_FRONTEND_PORT=13000` |
| 포트 충돌 | backend 8000, frontend 3001 고정 노출 (`BACKEND_PORT`, `FRONTEND_PORT` 로 호스트 쪽만 변경 가능) | `lsof -i :8000`, `lsof -i :3001` |
| 소식 AI 질문 스트리밍이 끊기거나 느리게 폴백된다 | 브라우저가 `NEXT_PUBLIC_API_URL` 또는 `<현재 호스트>:8000` 으로 직접 연결한다 (`src/lib/api.ts:12-23, 97-117`). `BACKEND_PORT` 를 바꿨거나 8000 이 방화벽에 막히면 직접 연결이 실패하고, 예외가 날 때만 상대 경로(`/api/...`, rewrite)로 다시 시도한다 | 브라우저 개발자 도구 네트워크 탭에서 `:8000/api/news/<id>/ask/stream` 요청 확인 |
| AI 챗이 503 `ERR_LLM_PROVIDER_UNAVAILABLE` | Anthropic·OpenAI 키가 없고 Ollama 도 쓸 수 없다: 주소 없음, 연결 실패, `/api/tags` 가 200 아님, 또는 설정 모델(`OLLAMA_MODEL`) 미설치 (`llm_processor.py:171-194, 301-337`). 판정 이유는 backend 로그의 WARNING `가용한 LLM 프로바이더 없음: …` 에 남는다 | 키 설정 확인. Ollama 는 `curl $OLLAMA_BASE_URL/api/tags` 로 응답과 `models[].name` 에 설정 모델 이름이 있는지 확인 (태그를 생략한 설정은 `:latest` 로 비교) |
| 챗 401/429/529/502 | Anthropic 키 누락(401 `ERR_CLAUDE_API_KEY_MISSING`), 한도 초과(429 `ERR_CLAUDE_QUOTA_EXCEEDED`), 과부하(529 `ERR_CLAUDE_OVERLOADED`), 업스트림 실패(502) (`api/chat.py:212-255`) | backend 로그의 경고 |
| `database is locked` 류 오류 | SQLite 단일 파일을 여러 프로세스(backend, `make collect`, MCP 서버)가 함께 쓸 수 있다. `busy_timeout`·`timeout` 은 30초다 (`database.py:8, 24`). 수집기의 쓰기 직렬화 락은 프로세스 안에서만 유효하다 (`collectors/manager.py:57, 77`) | 동시에 도는 프로세스 확인 (`ps`), 같은 DB 경로를 쓰는지 확인 |
| 수집이 이중으로 돈다 | `is_running` 플래그가 프로세스 메모리에만 있다 (`manager.py:47, 177-180`). API 서버와 MCP 서버·`make collect` 는 서로의 수집을 모른다 | `GET /api/schedule/progress` 와 다른 프로세스 로그 |
| 다른 DB 를 보고 있다 (데이터가 없거나 다름) | `DATABASE_URL` 기본값이 cwd 상대 경로다 (`config.py:42`). 루트에서 띄우면 `./agentlens.db`, `backend/` 에서 띄우면 `backend/agentlens.db` | 실행한 cwd 와 `DATABASE_URL` 확인 |
| 브리핑 설정 저장이 500 | `save_json_config` 가 `config.json` 쓰기에 실패하면 500 "설정 파일(config.json) 저장에 실패했습니다" (`api/briefing.py:207-209`). Docker 는 `config.json` 을 `:rw` 로 마운트하고(`docker-compose.yml:38`) `save_json_config` 가 제자리 쓰기라 bind mount 에서도 저장된다. 그래도 실패하면 호스트 파일 권한을 본다 | 로그의 `[Config] Error saving config.json` |
| 브리핑 설정을 저장했는데 Notion·SMTP 동작이 그대로다 | `settings.reload()` 가 필드 기본값을 다시 계산하지 않는다고 코드상 판단한다 ('알려진 불일치·위험'). 실행으로 확인하지 않았다 | backend 재시작 후 다시 시도 |
| config.json 의 수집 시각·시간대를 바꿔도 반영되지 않는다 | cron 이 `0,6,12,18`/`3,15`/`0:15` UTC 로 하드코딩 (`scheduler.py:39, 47, 55`) | `GET /api/schedule/status` 의 `next_run` |
| Docker 로그에 `sources.json 원자적 교체 실패, 제자리 쓰기로 저장한다 … [Errno 16] Device or resource busy` 경고 | 저장은 `.tmp` 에 쓰고 `replace()` 로 교체한다. `/app/sources.json` 은 단일 파일 bind mount 라 그 위로 rename 하면 `EBUSY` 가 난다 (2026-11-08 재현). 이때 대상 파일에 제자리로 쓰고 `.tmp` 를 지운다 (`sources_service.py:105-118`). 저장은 성공하므로 정상이다 | 저장 뒤 루트 `sources.json` 내용, 로그에 `Failed to write sources to …` 가 없으면 정상 |
| 소스 토글이 200 인데 파일이 안 바뀐다 | `toggle_source` 가 `save_sources` 의 반환값을 버리고 성공을 돌려준다 (`sources_service.py:191-193`). 저장 실패는 로그로만 보인다 | backend 로그의 `Failed to write sources to …` |
| 프로덕션 모드에서 시작 실패 | `ENVIRONMENT=production` + 32자 미만 `SECRET_KEY` → `ValueError` (`config.py:140-141`) | 시작 로그 |
| INFO 로그가 안 보인다 | 로깅 설정이 없어 `agentlens.*` 로거의 INFO 메시지가 출력되지 않는다(Python 기본 동작) | 경고 이상과 `print` 만 보인다 |

## 알려진 불일치·위험
- **설정이 코드에 반영되지 않음**: `CORS_ORIGINS`, `USER_AGENT`, `LLM_PROVIDER`, `BRIEFING_TITLE`, `BRIEFING_AUTO_DISPATCH_HOUR`, `CHAT_*`, `SCRAPER_TIMEOUT_SECONDS`, `AGENTIC_SEARCH_MAX_QUERIES` 필드와 config.json 의 `app.host/port/frontend_port`, `scheduler.enabled/auto_briefing_hour`, `crawler.*`(user_agent 제외), `webhooks.auto_*` 를 읽는 코드가 없다. `CRAWL_SCHEDULE_HOURS`, `CRAWL_TIMEZONE` 은 표시용이고 실제 cron 과 따로 논다 (`scheduler.py:9, 39`).
- **`HIGH_SIGNAL_THRESHOLD` 기본값 불일치**: 7.8 (`config.py:65`) / 7.0 (`config.json:26`, `llm_processor.py:568`).
- **비밀값 평문**: LLM 키, Notion 토큰, SMTP 비밀번호, 웹훅 URL 을 git 추적 대상인 `config.json` 에 평문으로 저장할 수 있다. `GET /api/briefing/settings` 는 웹훅 URL 을 가리지 않는다 (`api/briefing.py:153-155`). Gemini 키는 요청 URL 의 쿼리 문자열로 보낸다 (`llm_processor.py:217`).
- **인증 없음 + 모든 origin 허용 + `allow_credentials=True`** (`main.py:50-56`). 파괴적 엔드포인트도 열려 있다. `make dev` 의 backend 도 기본 `0.0.0.0` 에 뜬다.
- **Docker 설정 저장이 git 추적 파일을 바꾼다**: `config.json`·`sources.json` 이 `:rw` 단일 파일 bind mount 라 Docker 에서 설정·소스를 저장하면 루트 파일이 바뀐다 (`docker-compose.yml:38-39`). 비밀값을 넣으면 평문으로 남는다 (아래 '비밀값 평문').
- **sources.json 이중 관리**: Docker 에서 동기화 사본(`/app/app/config/sources.json`)은 컨테이너 레이어에 남아 재생성 시 사라진다 (`sources_service.py:120-128`).
- **첫 수집 취소**: 빈 DB 의 첫 수집 도중 서버를 내리면 태스크가 취소되고 그때까지의 배치 저장은 롤백될 수 있다 (`main.py:40-45`).
- **프로세스 로컬 상태**: 수집·딥 리서치 실행 플래그, LLM 캐시, 스케줄러 job 이 메모리에만 있다. uvicorn 을 여러 worker 로 띄우면 스케줄 작업이 worker 수만큼 중복된다고 코드상 판단한다 (worker 옵션은 현재 CMD 에 없음).
- **동기 네트워크 호출**: `has_live_provider()` 가 Anthropic·OpenAI 키가 없고 Ollama 주소가 있으면 async 경로에서 `httpx.Client` 로 Ollama 를 최대 1초 동기 호출한다 (`llm_processor.py:176-178, 319`). 수집 평가에서 항목마다 불릴 수 있다 (`llm_processor.py:619`).
- **frontend 버전 하드코딩**: `/api/health` 의 `version` 이 `"0.3.1"` 문자열이다 (`frontend/src/app/api/health/route.ts:9`).
- **`src/lib/env.ts` 미사용**: 정의만 있고 import 하는 곳이 없어 env 검증이 실행되지 않는다.
- **`NEXT_PUBLIC_API_URL` 빌드 시점**: frontend Docker builder 에 이 값을 넘기는 `ARG` 가 없다 (`frontend/Dockerfile:17-31`). Next.js 는 `NEXT_PUBLIC_*` 를 빌드 때 번들에 넣으므로 compose 의 런타임 값(`docker-compose.yml:63`)은 브라우저 코드에 반영되지 않는다(프레임워크 동작, 실행 확인 안 함).
- **RSS 링크 하드코딩**: `/api/news/feed/rss.xml` 의 채널 링크가 `http://localhost:3000` 이다 (`api/news.py:192`).
