# 운영 가이드: AgentLens
Updated: 2026-11-06

코드와 설정 파일에서 역으로 정리한 운영 가이드다. 근거는 `path:line` 으로 단다. 명령을 실행해 보지 않고 코드로만 확인했다. 데이터 구조는 `docs/data-model.md` 를 본다.

## 구성 한눈에 보기
| 구성 요소 | 포트 | 실행 | 상태 확인 |
|---|---|---|---|
| backend (FastAPI + APScheduler + SQLite) | 8000 | `uvicorn app.main:app --host 0.0.0.0 --port 8000` (`backend/Dockerfile:35`) | `GET /health` (`backend/app/main.py:54-56`) |
| frontend (Next.js 16 standalone) | Docker 3001, `next dev` 은 포트 미지정 | `node server.js` (`frontend/Dockerfile:60`), 개발은 `pnpm dev` (`frontend/package.json:6`) | `GET /api/health` (`frontend/src/app/api/health/route.ts`) |
| MCP 서버 (FastMCP, stdio) | 없음 | `python -m app.mcp.server` (cwd `backend/`) (`backend/app/mcp/server.py:55-56`, `backend/app/api/mcp.py:19-24`) | 없음 |

## 로컬 실행

### Makefile 타깃
| 타깃 | 하는 일 | 상태 | 근거 |
|---|---|---|---|
| `make setup` | `.venv` 생성(`uv venv`, 실패 시 `python3 -m venv`), `backend/requirements.txt` 설치, `frontend` 에서 `pnpm install` | 동작 | `Makefile:3-7` |
| `make build` | `cd frontend && pnpm build` | 동작 | `Makefile:15-16` |
| `make check` | `cd backend && ../.venv/bin/pytest -v tests/` 후 `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` | 동작 | `Makefile:45-49` |
| `make collect` | `cd backend` 에서 `collector_manager.collect_all()` 을 한 번 실행 (서버 없이 직접 DB 에 씀) | 동작 | `Makefile:21-23` |
| `make reset` | `curl -X POST http://localhost:8000/api/schedule/reset-and-collect` — **데이터 삭제** | 동작 (backend 가 :8000 에 떠 있어야 함) | `Makefile:25-27` |
| `make clean` | `.venv`, `backend/__pycache__`, `frontend/.next`, `frontend/node_modules` 삭제 | 동작 | `Makefile:18-19` |
| `make docker-build` | `docker compose build` | 동작 | `Makefile:29-31` |
| `make docker-up` | `docker compose up -d` | 동작 | `Makefile:33-35` |
| `make docker-down` | `docker compose down` (named volume 은 지우지 않음) | 동작 | `Makefile:37-39` |
| `make docker-logs` | `docker compose logs -f` | 동작 | `Makefile:41-42` |
| `make dev` | `./scripts/dev.sh` | **깨짐** — `scripts/` 디렉터리가 없다 | `Makefile:9-10` |
| `make test` | `./scripts/test.sh` | **깨짐** — 같은 이유. 대신 `make check` | `Makefile:12-13` |

`make check` 의 pytest 는 `.env` 와 루트 `config.json` 의 LLM 키를 읽으므로 외부 LLM 을 호출할 수 있고, 루트 `config.json` 을 다시 쓴다 ('알려진 불일치·위험').

### backend 단독 실행
저장소에 로컬 실행 스크립트는 없다(`make dev` 깨짐). `app` 패키지가 `backend/` 아래에 있고(`backend/pytest.ini:2` 의 `pythonpath = .`), Docker 의 실행 명령이 `uvicorn app.main:app` 이므로 `backend/` 에서 실행한다.

```bash
make setup
cd backend
../.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- cwd 가 `backend/` 이면 DB 는 `backend/agentlens.db`, config 는 `../config.json`(루트), sources 는 `../sources.json`(루트), `.env` 는 `backend/.env` 가 먼저 읽힌다 (아래 '설정 우선순위').
- 시작 순서 (`backend/app/main.py:13-26`): `ensure_db_schema()` → `start_scheduler()` → `news_items` 가 0건이면 `collect_all()` 을 **끝날 때까지 기다린 뒤** 요청을 받기 시작한다. 종료 시 스케줄러를 멈추고 엔진을 dispose 한다.
- API 문서: `http://localhost:8000/docs` (`main.py:52`).

### frontend 단독 실행
```bash
cd frontend
pnpm install
pnpm dev          # next dev (포트 지정 없음)
# 프로덕션 번들: pnpm build 후 .next/standalone/server.js 실행 (output: "standalone", next.config.ts:4)
```
- `/api/:path*` 는 `INTERNAL_API_URL`(없으면 `http://127.0.0.1:8000`) 로 rewrite 된다 (`frontend/next.config.ts:13-21`).
- `allowedDevOrigins` 에 `localhost`, `127.0.0.1`, `*.ts.net`, 특정 Tailscale 호스트, `192.168.1.109` 가 하드코딩되어 있다 (`next.config.ts:6-12`).
- 프론트 env 파일은 `frontend/` 기준으로 읽힌다. `frontend/.env.example` 은 `frontend/.gitignore:34` 의 `.env*` 에 걸려 git 에 없다.

## Docker

### docker-compose.yml
| 항목 | backend | frontend |
|---|---|---|
| 빌드 | `./backend`, `Dockerfile` | `./frontend`, `Dockerfile` |
| 컨테이너 | `agentlens-backend` | `agentlens-frontend` |
| 재시작 | `unless-stopped` | `unless-stopped` |
| 포트 | `${BACKEND_PORT:-8000}:8000` | `${FRONTEND_PORT:-3001}:3001` |
| 볼륨 | `agentlens-data:/app/data`, `./config.json:/app/config.json:ro`, `./sources.json:/app/sources.json:rw` | 없음 |
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
- 별도로, LLM 호출 코드는 호출 때마다 `load_json_config()` 로 config.json 을 다시 읽어 Settings 값이 비었을 때 쓴다 (`llm_processor.py:131-137, 180-186`, `anthropic_provider.py:152-159`).
- `settings.reload()` (설정 API 저장 후 호출)는 config.json 을 다시 읽지만, 반영 범위가 제한된다 ('알려진 불일치·위험').

### Settings 필드 전체
env 이름은 필드 이름과 같다. "사용" 열이 "없음"이면 그 필드를 읽는 코드가 `backend/app` 에 없다.

| 필드 | 코드 기본값 | config.json 키 | 사용 |
|---|---|---|---|
| PROJECT_NAME | `AgentLens` | `app.project_name` | `main.py:28` |
| VERSION | `0.3.1` | `app.version` | `main.py:28, 52, 56` |
| DATABASE_URL | `sqlite+aiosqlite:///./agentlens.db` | `app.database_url` | `database.py:7-17` |
| CRAWL_SCHEDULE_HOURS | `0,6,12,18` | `scheduler.crawl_hours` (배열 → 쉼표 문자열) | `scheduler.py:9` (다음 실행 계산 폴백·상태 표시만) |
| CRAWL_TIMEZONE | `UTC` | `scheduler.timezone` | `api/schedule.py:34` (표시만) |
| CORS_ORIGINS | `["*"]` | — | 없음 (`main.py:31` 이 `["*"]` 하드코딩) |
| USER_AGENT | `AgentLens-Collector/1.0` | `crawler.user_agent` | 없음 |
| LLM_PROVIDER | `auto` | `llm.provider` | 없음 |
| ANTHROPIC_API_KEY | `""` | `llm.anthropic_api_key` | `anthropic_provider.py:155` |
| ANTHROPIC_MODEL | `claude-sonnet-5-5` | `llm.anthropic_model` | `anthropic_provider.py:40, 46`, `llm_processor.py:99` |
| ANTHROPIC_COLLECTION_MODEL | `claude-sonnet-5-5` | `llm.anthropic_collection_model` | `anthropic_provider.py:345` |
| ANTHROPIC_DEFAULT_CHAT_MODEL | `claude-sonnet-5-5` | `llm.anthropic_default_chat_model` | `anthropic_provider.py:44, 86`, `schemas/chat.py:7`, `llm_processor.py:99` |
| ANTHROPIC_HAIKU_MODEL | `claude-haiku-5-5` | `llm.anthropic_haiku_model` | `anthropic_provider.py:32`, `chat_service.py:397` |
| ANTHROPIC_SONNET_MODEL | `claude-sonnet-5-5` | `llm.anthropic_sonnet_model` | `anthropic_provider.py:37` |
| ANTHROPIC_OPUS_MODEL | `claude-opus-5-5` | `llm.anthropic_opus_model` | `anthropic_provider.py:34` |
| GEMINI_API_KEY | `""` | `llm.gemini_api_key` | `llm_processor.py:114, 133, 247` |
| GEMINI_MODEL | `gemini-3.5-flash-lite` | `llm.gemini_model` | `llm_processor.py:143` |
| OPENAI_API_KEY | `""` | `llm.openai_api_key` | `llm_processor.py:115, 182, 259, 332, 404` |
| OPENAI_MODEL | `gpt-4o-mini` | `llm.openai_model` | `llm_processor.py:190, 413` |
| OLLAMA_BASE_URL | `http://localhost:11434` | `llm.ollama_base_url` | `llm_processor.py:116, 213, 267, 437` |
| OLLAMA_MODEL | `llama3.2:latest` | `llm.ollama_model` | `llm_processor.py:216, 439` |
| TESTING | `False` | — | `llm_processor.py:232` |
| QUALITY_CUTOFF_SCORE | `5.0` | `llm.quality_cutoff_score` | `llm_processor.py:528, 621` |
| HIGH_SIGNAL_THRESHOLD | `7.8` | `llm.high_signal_threshold` | `llm_processor.py:529, 622` |
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
| `INTERNAL_API_URL` | `next.config.ts:14` (rewrite 대상), `src/lib/api.ts:9, 22` (서버 쪽 fetch) | backend 주소. 기본 `http://127.0.0.1:8000` |
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
- DB 의 `news_items` 가 0건이면 lifespan 안에서 즉시 수집을 한 번 한다 (`main.py:18-22`).
- `GET /api/schedule/status` 의 `next_run` 은 `daily_crawl` job 의 다음 실행 시각이다. job 이 없을 때만 `CRAWL_SCHEDULE_HOURS` 로 계산한다 (`scheduler.py:25-35`).

수동 실행:
| 작업 | 방법 |
|---|---|
| 수집 | `POST /api/schedule/trigger` (백그라운드, 진행 중이면 `already_running`, `api/schedule.py:48-67`), `make collect`, MCP 도구 `trigger_agentlens_crawl` |
| 진행 상황 | `GET /api/schedule/progress` (`api/schedule.py:43-46`) |
| 딥 리서치 | `POST /api/research/run-deep?max_candidates=6` (`api/research.py:77-86`), 상태 `GET /api/research/status` |
| 브리핑 | `GET /api/briefing/today`, `POST /api/briefing/generate`, `POST /api/briefing/export/notion`, `POST /api/briefing/send/email`, `POST /api/webhook/send-briefing` |

## 외부 의존
| 대상 | 필요한 설정 | 쓰는 곳 | 설정이 없을 때 |
|---|---|---|---|
| Anthropic API | `ANTHROPIC_API_KEY` (또는 `llm.anthropic_api_key`) | 챗·질문 답변 1순위, 수집 평가(`anthropic_provider.py:152-162`, `llm_processor.py:313-327`) | 다음 프로바이더로 넘어간다 |
| OpenAI API | `OPENAI_API_KEY` | 2순위 (`llm_processor.py:329-346, 401-434`) | 다음으로 넘어간다 |
| Ollama | `OLLAMA_BASE_URL` (기본 `http://localhost:11434`, Docker `http://host.docker.internal:11434`) | 3순위. 가용성 판단 때 `/api/tags` 를 1초 타임아웃으로 동기 호출 (`llm_processor.py:267-275`) | 연결 실패 시 가용 프로바이더 없음 |
| Google Gemini | `GEMINI_API_KEY` | 요청 모델 이름에 `gemini` 가 있을 때만 (`llm_processor.py:295-301, 365-372`). 기본 체인에는 없다 | 그 요청은 503 |
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
| 수집 평가·분류 | 휴리스틱 점수와 키워드 분류로 저장 (`evaluated_by: heuristic_fallback`) | `llm_processor.py:642-670` |
| 소식 질문 (`/api/news/{id}/ask`, `/ask/stream`) | 휴리스틱 답변 | `llm_processor.py:748-753, 915-925` |
| AI 챗 (`/api/chat/query`, `/api/chat/stream`) | HTTP 503 `ERR_LLM_PROVIDER_UNAVAILABLE` | `llm_processor.py:278-286`, `api/chat.py:239-247` |

테스트 환경 판단(`TESTING`, `CI`, 또는 `pytest` import 여부)은 `is_test_environment()` 에 있다 (`llm_processor.py:229-240`).

## 파괴적 작업
| 작업 | 지우는 것 | 안전장치 | 근거 |
|---|---|---|---|
| `POST /api/schedule/reset-and-collect` | `news_items` 전체, `crawl_logs` 전체. 이어서 백그라운드 재수집 | 수집 중이면 거부 | `api/schedule.py:69-99` |
| `make reset` | 위 엔드포인트를 `localhost:8000` 에 호출 | 위와 같음. 실패해도 `|| true` 로 성공 종료 | `Makefile:25-27` |
| `DELETE /api/news/all` | `news_items` 전체 | 없음 (수집 중 검사 없음) | `api/news.py:96-102` |
| `DELETE /api/chat/sessions/{id}` | 세션과 메시지 | — | `chat_session_service.py:280-297` |
| `DELETE /api/sources/{type}/{id}` | `sources.json` 항목 | — | `api/sources.py:85`, `sources_service.py:235-252` |
| `POST /api/briefing/settings` | `config.json` 전체를 다시 씀 | `"***"` 값은 비밀번호·키를 유지 | `api/briefing.py:161-211` |
| `make clean` | `.venv`, `node_modules`, `.next` (데이터 아님) | — | `Makefile:18-19` |
| `docker compose down -v` | named volume `agentlens-data` (DB) | Makefile 에는 `-v` 가 없다 | `Makefile:39` |

주의:
- 인증이 없다. 모든 API 가 열려 있고 CORS 는 모든 origin 을 허용한다 (`main.py:29-35`). 네트워크에 노출하면 누구나 위 작업을 호출할 수 있다.
- 리셋은 `chat_sessions.active_source_id` 를 NULL 로 만들고(FK `ON DELETE SET NULL`), `source_research_logs`, 챗 기록, 프론트 localStorage 북마크는 남긴다.
- 리셋 뒤 DB 가 비어도 재시작 시 자동 시드 수집이 돈다 (`main.py:18-22`).

## 헬스체크·로그·버전
| 확인 | 방법 | 응답 |
|---|---|---|
| backend 헬스 | `curl http://localhost:8000/health` | `{"status": "healthy", "version": <VERSION>, "running": <수집 중 여부>}` (`main.py:54-56`) |
| backend 정보 | `curl http://localhost:8000/` | `{"service": "AgentLens API", "version", "docs": "/docs"}` (`main.py:50-52`) |
| frontend 헬스 | `curl http://localhost:3001/api/health` | `{"status": "healthy", "service": "agentlens-frontend", "version": "0.3.1"(하드코딩), "timestamp"}` |
| 수집 상태 | `GET /api/schedule/status`, `GET /api/schedule/progress` | 다음 실행, 최근 `crawl_logs` 5개, 진행 단계 |
| 소스 파일 위치 | `GET /api/sources` 의 `sources_file` | 실제로 읽는 sources.json 경로 (`api/sources.py:32`) |
| MCP 연결 정보 | `GET /api/mcp/info` | Claude Desktop 설정 예 (python 경로, cwd) |
| 버전 | 위 헬스 응답, `git describe --tags`, `frontend/package.json` `version` | |
| 컨테이너 상태 | `docker compose ps` (healthcheck 결과 포함) | |

로그:
- Docker: `make docker-logs` (= `docker compose logs -f`).
- backend 는 `print` 와 `logging.getLogger("agentlens.*")` 를 섞어 쓴다. 로깅 설정 코드(`basicConfig`, `dictConfig`)가 없다 (`grep` 결과 없음). 처리하지 않은 예외는 경로와 traceback 을 `print` 한다 (`main.py:37-46`).
- 주요 `print` 메시지: `[Scheduler] Started for Crawl …`(`scheduler.py:64`), `[Scheduler] … triggered at …`(`scheduler.py:12, 16, 21`), `[AgentLens] Initial database seed collection...`(`main.py:21`), `[AgentLens ERROR] Unhandled exception on …`(`main.py:40`), `[Config] Error saving config.json`(`config.py:172`).

## 자주 생길 문제
| 증상 | 원인 (코드 근거) | 확인 방법 |
|---|---|---|
| backend 가 떴는데 한동안 응답이 없거나 Docker 에서 frontend 가 안 뜬다 | DB 가 비어 있으면 lifespan 이 첫 수집을 끝까지 기다린 뒤에야 요청을 받는다 (`main.py:18-22`). 그 사이 healthcheck(10s 간격, 5회)가 실패하면 frontend 의 `service_healthy` 조건이 충족되지 않는다 (`docker-compose.yml:42-47, 64-66`). 수집 소요 시간은 측정하지 않았다 | `docker compose ps`, 로그의 `Initial database seed collection` 이후 메시지 |
| 포트 충돌 | backend 8000, frontend 3001 고정 노출 (`BACKEND_PORT`, `FRONTEND_PORT` 로 호스트 쪽만 변경 가능) | `lsof -i :8000`, `lsof -i :3001` |
| 소식 AI 질문 스트리밍이 끊기거나 느리게 폴백된다 | 브라우저가 `NEXT_PUBLIC_API_URL` 또는 `<현재 호스트>:8000` 으로 직접 연결한다 (`src/lib/api.ts:12-23, 97-117`). `BACKEND_PORT` 를 바꿨거나 8000 이 방화벽에 막히면 직접 연결이 실패하고, 예외가 날 때만 상대 경로(`/api/...`, rewrite)로 다시 시도한다 | 브라우저 개발자 도구 네트워크 탭에서 `:8000/api/news/<id>/ask/stream` 요청 확인 |
| AI 챗이 503 `ERR_LLM_PROVIDER_UNAVAILABLE` | Anthropic·OpenAI 키가 없고 Ollama 도 응답하지 않는다 (`llm_processor.py:242-286`) | 키 설정 확인, Ollama 는 `curl $OLLAMA_BASE_URL/api/tags` |
| 챗 401/429/529/502 | Anthropic 키 누락(401 `ERR_CLAUDE_API_KEY_MISSING`), 한도 초과(429 `ERR_CLAUDE_QUOTA_EXCEEDED`), 과부하(529 `ERR_CLAUDE_OVERLOADED`), 업스트림 실패(502) (`api/chat.py:212-255`) | backend 로그의 경고 |
| `database is locked` 류 오류 | SQLite 단일 파일을 여러 프로세스(backend, `make collect`, MCP 서버)가 함께 쓸 수 있다. `busy_timeout`·`timeout` 은 30초다 (`database.py:8, 24`). 수집기의 쓰기 직렬화 락은 프로세스 안에서만 유효하다 (`collectors/manager.py:57, 77`) | 동시에 도는 프로세스 확인 (`ps`), 같은 DB 경로를 쓰는지 확인 |
| 수집이 이중으로 돈다 | `is_running` 플래그가 프로세스 메모리에만 있다 (`manager.py:47, 177-180`). API 서버와 MCP 서버·`make collect` 는 서로의 수집을 모른다 | `GET /api/schedule/progress` 와 다른 프로세스 로그 |
| 다른 DB 를 보고 있다 (데이터가 없거나 다름) | `DATABASE_URL` 기본값이 cwd 상대 경로다 (`config.py:42`). 루트에서 띄우면 `./agentlens.db`, `backend/` 에서 띄우면 `backend/agentlens.db` | 실행한 cwd 와 `DATABASE_URL` 확인 |
| Docker 에서 브리핑 설정 저장이 500 | `config.json` 이 `:ro` 로 마운트된다 (`docker-compose.yml:38`). `save_json_config` 가 쓰기에 실패하면 500 "설정 파일(config.json) 저장에 실패했습니다" (`api/briefing.py:207-209`) | 로그의 `[Config] Error saving config.json` |
| 브리핑 설정을 저장했는데 Notion·SMTP 동작이 그대로다 | `settings.reload()` 가 필드 기본값을 다시 계산하지 않는다고 코드상 판단한다 ('알려진 불일치·위험'). 실행으로 확인하지 않았다 | backend 재시작 후 다시 시도 |
| config.json 의 수집 시각·시간대를 바꿔도 반영되지 않는다 | cron 이 `0,6,12,18`/`3,15`/`0:15` UTC 로 하드코딩 (`scheduler.py:39, 47, 55`) | `GET /api/schedule/status` 의 `next_run` |
| Docker 에서 소스 추가·토글이 실패한다 | 저장이 `.tmp` 파일에 쓰고 `replace()` 로 교체하는 방식이다 (`sources_service.py:104-108`). `/app/sources.json` 은 단일 파일 bind mount 다. 실행해 확인하지 않았다 | backend 로그의 `Failed to write sources to …` |
| 프로덕션 모드에서 시작 실패 | `ENVIRONMENT=production` + 32자 미만 `SECRET_KEY` → `ValueError` (`config.py:140-141`) | 시작 로그 |
| INFO 로그가 안 보인다 | 로깅 설정이 없어 `agentlens.*` 로거의 INFO 메시지가 출력되지 않는다(Python 기본 동작) | 경고 이상과 `print` 만 보인다 |

## 알려진 불일치·위험
- **깨진 make 타깃**: `make dev`, `make test` 는 없는 `scripts/dev.sh`, `scripts/test.sh` 를 호출한다 (`Makefile:9-13`). `.PHONY` 에 `collect`, `reset`, `docker-*` 가 빠져 있다 (`Makefile:1, 45`).
- **로컬 실행 경로 미정의**: 저장소에 backend·frontend 를 함께 띄우는 동작하는 명령이 없다. 위 '로컬 실행' 명령은 Dockerfile 과 Makefile 에서 유도한 것이다.
- **설정이 코드에 반영되지 않음**: `CORS_ORIGINS`, `USER_AGENT`, `LLM_PROVIDER`, `BRIEFING_TITLE`, `BRIEFING_AUTO_DISPATCH_HOUR`, `CHAT_*`, `SCRAPER_TIMEOUT_SECONDS`, `AGENTIC_SEARCH_MAX_QUERIES` 필드와 config.json 의 `app.host/port/frontend_port`, `scheduler.enabled/auto_briefing_hour`, `crawler.*`(user_agent 제외), `webhooks.auto_*` 를 읽는 코드가 없다. `CRAWL_SCHEDULE_HOURS`, `CRAWL_TIMEZONE` 은 표시용이고 실제 cron 과 따로 논다 (`scheduler.py:9, 39`).
- **`HIGH_SIGNAL_THRESHOLD` 기본값 불일치**: 7.8 (`config.py:65`) / 7.0 (`config.json:26`, `llm_processor.py:529`).
- **테스트가 운영 설정 파일을 쓴다**: `make check` 의 `test_briefing_settings_get_and_post` 가 루트 `config.json` 을 다시 쓴다 (`tests/test_briefing_notion_email.py:145-150`, `config.py:161-169`). 테스트는 실제 `.env`·config.json 의 LLM 키를 읽는다.
- **비밀값 평문**: LLM 키, Notion 토큰, SMTP 비밀번호, 웹훅 URL 을 git 추적 대상인 `config.json` 에 평문으로 저장할 수 있다. `GET /api/briefing/settings` 는 웹훅 URL 을 가리지 않는다 (`api/briefing.py:153-155`). Gemini 키는 요청 URL 의 쿼리 문자열로 보낸다 (`llm_processor.py:148`).
- **인증 없음 + 모든 origin 허용 + `allow_credentials=True`** (`main.py:29-35`). 파괴적 엔드포인트도 열려 있다.
- **Docker 설정 저장 불가**: `config.json` `:ro` 마운트와 `POST /api/briefing/settings` 가 충돌한다 (`docker-compose.yml:38`, `api/briefing.py:207`).
- **sources.json 이중 관리**: Docker 에서 동기화 사본(`/app/app/config/sources.json`)은 컨테이너 레이어에 남아 재생성 시 사라진다 (`sources_service.py:110-118`).
- **시작 차단**: 빈 DB 에서 첫 수집이 끝나야 서버가 요청을 받는다 (`main.py:18-24`).
- **프로세스 로컬 상태**: 수집·딥 리서치 실행 플래그, LLM 캐시, 스케줄러 job 이 메모리에만 있다. uvicorn 을 여러 worker 로 띄우면 스케줄 작업이 worker 수만큼 중복된다고 코드상 판단한다 (worker 옵션은 현재 CMD 에 없음).
- **동기 네트워크 호출**: `has_live_provider()` 가 async 경로에서 `httpx.Client` 로 Ollama 를 최대 1초 동기 호출한다 (`llm_processor.py:269-273`). 수집 평가에서 항목마다 불릴 수 있다 (`llm_processor.py:580`).
- **frontend 버전 하드코딩**: `/api/health` 의 `version` 이 `"0.3.1"` 문자열이다 (`frontend/src/app/api/health/route.ts:9`).
- **`src/lib/env.ts` 미사용**: 정의만 있고 import 하는 곳이 없어 env 검증이 실행되지 않는다.
- **`NEXT_PUBLIC_API_URL` 빌드 시점**: frontend Docker builder 에 이 값을 넘기는 `ARG` 가 없다 (`frontend/Dockerfile:17-31`). Next.js 는 `NEXT_PUBLIC_*` 를 빌드 때 번들에 넣으므로 compose 의 런타임 값(`docker-compose.yml:63`)은 브라우저 코드에 반영되지 않는다(프레임워크 동작, 실행 확인 안 함).
- **RSS 링크 하드코딩**: `/api/news/feed/rss.xml` 의 채널 링크가 `http://localhost:3000` 이다 (`api/news.py:192`).
