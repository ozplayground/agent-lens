# 기술 스펙: AgentLens

Updated: 2026-11-02
갱신: 기능 구현이 끝나면 `/implement-plan` 의 마지막 단계에서 그 기능 spec 의 설계를 반영한다. 지금 동작하는 시스템만 적는다. 계획은 기능 spec 에 둔다.

이 문서의 첫 내용은 현재 코드(브랜치 `chore/sdlc-harness`)만 보고 썼다.

## 시스템 구성
| 앱/서비스 | 책임 | 스택 | 위치 |
|---|---|---|---|
| backend | REST API, 수집·분류·요약, 스케줄 작업, 챗, 브리핑 발송 | Python 3.11, FastAPI, SQLAlchemy async + aiosqlite, APScheduler, pydantic-settings | `backend/` (`uvicorn app.main:app`, :8000, `backend/Dockerfile`) |
| frontend | 웹 UI (뉴스 피드 `/`, AI 챗 `/chat`), `/api` 프록시 | Node 20, Next.js 16 (standalone), React 19, Tailwind 4, zod 4, pnpm | `frontend/` (:3001, `frontend/Dockerfile`) |
| MCP 서버 | 외부 MCP 클라이언트에 뉴스 조회·수집 도구 제공 | FastMCP (stdio) | `backend/app/mcp/server.py` (`python -m app.mcp.server`, backend 코드와 DB 를 같이 씀. 별도 배포 단위 아님) |

- 두 앱은 루트 `docker-compose.yml` 로 함께 띄운다. frontend 는 backend 의 healthcheck(`/health`)가 통과한 뒤 뜬다.
- 워크스페이스 도구는 없다. 루트 `Makefile` 이 두 앱의 명령을 묶는다.

## 앱 사이 인터페이스
- REST: backend 의 모든 API 는 `/api` 아래에 있다 (`backend/app/api/router.py`). 라우터: news, schedule, stats, mcp, briefing, trends, webhook, sources, research, chat. 그 밖에 `/`, `/health`. OpenAPI 는 런타임 `/docs` 에서 나온다. 정적 OpenAPI 파일은 없다.
- 프록시: `frontend/next.config.ts` 의 rewrites 가 `/api/:path*` 를 `INTERNAL_API_URL`(기본 `http://127.0.0.1:8000`)로 넘긴다.
- SSE 2개: `POST /api/chat/stream`, `POST /api/news/{id}/ask/stream`. 프론트는 이 둘을 rewrite 를 거치지 않고 backend 에 직접 붙인다 (`frontend/src/lib/api.ts` 의 `getDirectApiBase`: `NEXT_PUBLIC_API_URL`, 없으면 브라우저 호스트의 :8000).
- 계약 위치 (자동 생성 없음, 손으로 맞춘다):
  - backend: `backend/app/schemas/chat.py`, `backend/app/schemas/news.py` (Pydantic)
  - frontend: `frontend/src/types/chat.ts`, `news.ts`, `trends.ts` (TS + zod)
  - 목: `frontend/src/mocks/handlers.ts`, `frontend/src/mocks/handlers/chat.ts`, `frontend/src/mocks/fixtures/chat.ts` (MSW)
  - 계약 테스트: `frontend/src/tests/chat/ContractAndMsw.test.ts`
  - 변경 규칙: `.claude/rules/contracts.md`. 하위 호환·버전 규칙은 아직 정하지 않았다.
- MCP 도구: `get_latest_harness_methods`, `get_mcp_and_skills_ecosystem`, `search_agent_news`, `trigger_agentlens_crawl`.

## 데이터
- 저장소: SQLite (`sqlite+aiosqlite`, WAL). 기본 경로 `./agentlens.db`(`config.json` 의 `app.database_url`), Docker 에서는 volume `agentlens-data` 의 `/app/data/agentlens.db`. 소유 앱은 backend.
- 테이블: `news_items`, `crawl_logs`, `source_research_logs` (`backend/app/models/news.py`), `chat_sessions`, `chat_messages` (`backend/app/models/chat_session.py`).
- 스키마 변경: 마이그레이션 도구가 없다. 시작할 때 `ensure_db_schema()` 가 `create_all` 과 빠진 열 `ALTER TABLE` 을 한다 (`backend/app/database.py`).
- 수집 소스 목록: `sources.json`. 루트 파일과 `backend/app/config/sources.json` 두 곳이 있고, `backend/app/services/sources_service.py` 가 cwd, 부모, 저장소 루트 순으로 찾는다. 정본은 미정이다.

## 공통 규칙
- 인증: 없다. CORS 는 모든 origin 을 허용한다 (`backend/app/main.py`).
- 오류 형식: 처리하지 않은 예외는 500 과 `{"detail": ..., "error": ...}` 로 돌려준다 (`backend/app/main.py`).
- 로깅: `print` 로 표준 출력에 쓴다. 로깅 라이브러리 설정은 없다.
- 설정: backend 는 `backend/app/config.py` 의 pydantic-settings `Settings`. 루트 `config.json`(cwd, 부모, 저장소 루트 순으로 찾음)을 기본값으로 읽고 `.env`, `backend/.env` 를 함께 읽는다. frontend 는 `frontend/src/lib/env.ts` 의 zod 스키마(`NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL`, `NODE_ENV`, `PORT`).
- 스케줄 (APScheduler, UTC): 수집 0·6·12·18시, 딥 리서치 3·15시, 브리핑 자동 발송 0:15 (`backend/app/scheduler.py`). DB 가 비어 있으면 시작할 때 한 번 수집한다.
- 외부 연동: LLM 은 Anthropic(`backend/app/services/llm_providers/anthropic_provider.py`), Gemini·OpenAI·Ollama(`backend/app/services/llm_processor.py`). Notion, SMTP, Slack/Discord 웹훅.

## 기술 선택과 근거
| 선택 | 대안 | 근거 | 결정한 기능 |
|---|---|---|---|

근거 칸에는 `docs/research/tech.md #번호` 나 기능 spec 의 '근거' 를 적는다. 근거가 없으면 "가정" 으로 적는다.

## 변경 이력
| 날짜 | 기능 id | 바뀐 절 |
|---|---|---|
