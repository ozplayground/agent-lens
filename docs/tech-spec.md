# 기술 스펙: AgentLens

Updated: 2026-11-09

## 시스템 구성
| 앱/서비스 | 책임 | 스택 | 위치 |
|---|---|---|---|
| backend | REST API, 수집·분류·요약, 스케줄 작업, 챗, 브리핑 발송 | Python 3.11, FastAPI, SQLAlchemy async + aiosqlite, APScheduler, pydantic-settings | `backend/` (`uvicorn app.main:app`, :8000, `backend/Dockerfile`) |
| frontend | 웹 UI (뉴스 피드 `/`, AI 챗 `/chat`), `/api` 프록시 | Node 20, Next.js 16 (standalone), React 19, Tailwind 4, zod 4, pnpm | `frontend/` (:3001, `frontend/Dockerfile`) |
| MCP 서버 | 외부 MCP 클라이언트에 뉴스 조회·수집 도구 제공 | FastMCP (stdio) | `backend/app/mcp/server.py` (`python -m app.mcp.server`, backend 코드와 DB 를 같이 씀. 별도 배포 단위 아님) |

- 두 앱은 루트 `docker-compose.yml` 로 함께 띄운다. frontend 는 backend 의 healthcheck(`/health`)가 통과한 뒤 뜬다. `make docker-up` 은 `docker compose up -d --wait` 로 두 컨테이너가 healthy 가 될 때까지 기다린다 (기본 180초, 넘기면 실패).
- 워크스페이스 도구는 없다. 루트 `Makefile`(bash, 대상 12개)이 두 앱의 명령을 묶는다. 셸 한 줄로 쓰기 어려운 두 가지만 스크립트로 둔다: `scripts/dev.sh`(`make dev`, backend `uvicorn --reload` 와 frontend `next dev` 를 각자 프로세스 그룹으로 띄우고 준비 대기·한쪽 종료 감지·Ctrl-C 정리), `scripts/collect.py`(`make collect`, backend 가 떠 있으면 그 API 로 수집시키고 끝날 때까지 기다리고, 없으면 로컬 DB 에 직접 수집). 검사는 `make check`(= `make test`).

## 앱 사이 인터페이스
- REST: backend 의 모든 API 는 `/api` 아래에 있다 (`backend/app/api/router.py`). 라우터: news, schedule, stats, mcp, briefing, trends, webhook, sources, research, chat. 그 밖에 `/`, `/health`. OpenAPI 는 런타임 `/docs` 에서 나온다. 정적 OpenAPI 파일은 없다.
- 프록시: `frontend/next.config.ts` 의 rewrites 가 `/api/:path*` 를 `INTERNAL_API_URL`(기본 `http://127.0.0.1:8000`)로 넘긴다.
- SSE 2개: `POST /api/chat/stream`, `POST /api/news/{id}/ask/stream`. 챗 스트림은 상대 경로로 불러 rewrite 프록시를 거친다 (`frontend/src/components/chat/ChatWorkspace.tsx`). 기사 Ask AI 스트림만 backend 에 직접 붙는다 (`frontend/src/lib/api.ts` 의 `getDirectApiBase`: `NEXT_PUBLIC_API_URL`, 없으면 브라우저 호스트의 :8000). 이벤트 형식은 `api.md` 의 'SSE 스트림'.
- 계약 위치 (자동 생성 없음, 손으로 맞춘다):
  - backend: `backend/app/schemas/chat.py`, `backend/app/schemas/news.py` (Pydantic)
  - frontend: `frontend/src/types/chat.ts`, `news.ts`, `trends.ts` (TS + zod)
  - 목: `frontend/src/mocks/handlers.ts`, `frontend/src/mocks/handlers/chat.ts`, `frontend/src/mocks/fixtures/chat.ts` (MSW)
  - 계약 테스트: `frontend/src/tests/chat/ContractAndMsw.test.ts`
  - 변경 규칙: 계약을 바꾸면 위 세 곳과 계약 테스트를 함께 바꾼다. 하위 호환·버전 규칙은 아직 정하지 않았다.
- MCP 도구: `get_latest_harness_methods`, `get_mcp_and_skills_ecosystem`, `search_agent_news`, `trigger_agentlens_crawl`.

## 데이터
- 저장소: SQLite (`sqlite+aiosqlite`, WAL). 기본 경로 `./agentlens.db`(`config.json` 의 `app.database_url`), Docker 에서는 volume `agentlens-data` 의 `/app/data/agentlens.db`. 소유 앱은 backend.
- 테이블: `news_items`, `crawl_logs`, `source_research_logs` (`backend/app/models/news.py`), `chat_sessions`, `chat_messages` (`backend/app/models/chat_session.py`).
- 스키마 변경: 마이그레이션 도구가 없다. 시작할 때 `ensure_db_schema()` 가 `create_all` 과 빠진 열 `ALTER TABLE` 을 한다 (`backend/app/database.py`).
- 수집 소스 목록: `sources.json`. 루트 파일과 `backend/app/config/sources.json` 두 곳이 있고, `backend/app/services/sources_service.py` 가 cwd, 부모, 저장소 루트 순으로 찾아 읽는다. 저장할 때는 두 곳에 함께 쓴다. 저장은 임시 파일을 쓴 뒤 `replace()` 로 교체하고, 교체가 `OSError` 면(Docker 의 단일 파일 bind mount 위 rename 은 `EBUSY`) 대상 파일에 제자리로 쓴다. 로컬에서는 루트 파일이 먼저 잡히고, Docker 에서는 마운트된 `/app/sources.json` 이 쓰인다.
- Docker 마운트: 루트 `config.json`·`sources.json` 을 읽기·쓰기(`:rw`) 단일 파일 bind mount 로 둔다. Docker 에서 설정·소스를 저장하면 git 이 추적하는 루트 파일이 바뀐다 (로컬 실행과 같다).
- 전문 검색: `news_items` 를 따라가는 FTS5 가상 테이블 `news_fts` 와 트리거 3개를 원시 SQL 로 만든다 (`backend/app/database.py`, `backend/app/services/retriever.py`).
- 챗 세션은 `updated_at` 기준 최근 30개만 남긴다 (코드 고정값). 테이블·열 상세는 `data-model.md`.

## 공통 규칙
- 인증: 없다. CORS 는 모든 origin 을 허용한다 (`backend/app/main.py`).
- 오류 형식: 처리하지 않은 예외는 500 과 `{"detail": ..., "error": ...}` 로 돌려준다 (`backend/app/main.py`).
- 로깅: `print` 로 표준 출력에 쓴다. 로깅 라이브러리 설정은 없다.
- 설정: backend 는 `backend/app/config.py` 의 pydantic-settings `Settings`. 루트 `config.json`(cwd, 부모, 저장소 루트 순으로 찾음)을 기본값으로 읽고 `.env`, `backend/.env` 를 함께 읽는다. frontend 는 `NEXT_PUBLIC_API_URL`(Ask AI 직접 연결), `INTERNAL_API_URL`(rewrite 대상)을 쓴다. `frontend/src/lib/env.ts` 의 zod 스키마는 어디서도 import 하지 않아 검증이 돌지 않는다. 설정 키 전체는 `operations.md`.
- 스케줄 (APScheduler, UTC): 수집 0·6·12·18시, 딥 리서치 3·15시, 브리핑 자동 발송 0:15 (`backend/app/scheduler.py`). 시각은 코드에 고정돼 있고 `config.json` 의 `crawl_hours`·`timezone`·`auto_dispatch_hour` 는 화면 표시에만 쓰인다. DB 가 비어 있으면 시작할 때 수집을 백그라운드로 띄우고 바로 요청을 받는다 (종료 때 끝나지 않은 첫 수집은 취소).
- UI: 토큰·공통 부품·오버레이 규칙은 `design-system.md`. 색은 `frontend/src/app/globals.css` 의 CSS 변수 토큰(`:root`·`.dark`)을 Tailwind `@theme inline` 으로 유틸리티에 잇고, 테마는 `<html>` 의 `dark`/`light` 클래스 하나로 정한다 (`@custom-variant dark`). 글꼴은 웹 글꼴 없이 시스템 글꼴 스택(`--font-sans`, `--font-mono`)을 쓴다. 공통 부품은 `frontend/src/components/ui/` 에 두고, 대화상자·드로어·팝오버·메뉴는 `frontend/src/lib/overlay-stack.ts` 에 등록해 Escape 로 맨 위 레이어만 닫는다.
- 외부 연동: LLM 은 Anthropic(`backend/app/services/llm_providers/anthropic_provider.py`), Gemini·OpenAI·Ollama(`backend/app/services/llm_processor.py`). 우선순위는 Anthropic → OpenAI → Ollama 이고 Gemini 는 모델을 명시했을 때만 쓴다. 가용 판정: Anthropic·OpenAI 는 키가 있으면 쓸 수 있다. Ollama 는 `GET {주소}/api/tags` 한 번(1초 제한)이 200 이고 응답의 `models[].name` 또는 `model` 에 설정 모델(태그를 생략하면 `:latest` 를 붙여 비교)이 있을 때만 쓸 수 있다. OpenAI 키·모델과 Ollama 주소·모델은 호출 때마다 `LLMProcessor` 의 해석 함수 4개(`_resolve_openai_key`, `_resolve_openai_chat_model`, `_resolve_ollama_url`, `_resolve_ollama_generate_model`)로 정한다. LLM 이 하나도 없으면 챗은 503 이고 판정 이유(키 없음, Ollama 연결 실패, 설정 모델 미설치 등)는 서버 로그 WARNING 에만 남는다. 수집과 기사 Ask AI 는 휴리스틱으로 대신한다. 그 밖에 Notion, SMTP, Slack/Discord 웹훅.

## 상세 문서
| 문서 | 내용 |
|---|---|
| `functional-spec/README.md` | 기능명세 색인 (영역 7개, 기능 116개) |
| `ui-spec.md` | 화면 명세 |
| `design-system.md` | 디자인시스템: 토큰, 공통 부품, 오버레이·단축키 규칙, 검사 방법 |
| `api.md` | REST API 명세 |
| `data-model.md` | 데이터 모델 |
| `operations.md` | 운영 가이드 |
| `test-cases.md` | 테스트 명세 |
| `known-issues.md` | 알려진 문제 모음 |

## 기술 선택과 근거
| 선택 | 대안 | 근거 | 결정한 기능 |
|---|---|---|---|
| CSS 변수 토큰 + Tailwind `@theme inline`, `@custom-variant dark` | 하드코딩 hex + !important 덮어쓰기 | Tailwind CSS 문서 'Dark mode', 'Theme variables' (2026-11-06 조회), ui-redesign spec 근거 E1·E2 | ui-redesign |
| 자체 공통 부품, `div role="dialog"` + 자체 포커스 트랩 | 컴포넌트 킷(Radix 등), 네이티브 `<dialog>` | intent 제약(무거운 UI 라이브러리 금지), ui-redesign spec 근거 E6. 네이티브 `<dialog>` 의 jsdom 지원은 가정 | ui-redesign |
| 시스템 글꼴 | Geist(next/font) | intent 제약(외부 글꼴 런타임 의존 금지), Geist 를 읽지만 쓰지 않던 점, ui-redesign spec 근거 E5. 한글 글꼴 순서는 가정 | ui-redesign |
| 오버레이 스택(Escape 맨 위만), 첫 그리기 전 인라인 테마 스크립트 | 컴포넌트별 Escape 리스너, 하이드레이션 뒤 테마 적용 | WCAG 2.2 (제품 원칙), Next.js 16 로컬 문서 'preventing-flash-before-hydration', ui-redesign spec 근거 E3·E13·E15 | ui-redesign |
| 로컬 동시 실행을 bash 스크립트(`scripts/dev.sh`, 프로세스 그룹·준비 대기·정리)로 | Makefile 한 줄, `concurrently` 같은 npm 도구 | make-targets spec 근거 E3·E5 (지운 `dev.sh` 는 자식 프로세스 그룹을 정리하지 못하고 한쪽이 죽어도 기다렸다. make 3.81·bash 3.2 라 `.ONESHELL`·`wait -n` 이 없다. 새 의존성 없음) | make-targets |
| 빈 DB 첫 수집을 lifespan 백그라운드 태스크로 | healthcheck `start_period` 늘림 | make-targets spec 근거 E10 (첫 수집 시간 측정값이 없어 근거 있는 대기 시간이 없음) | make-targets |
| `docker compose up -d --wait --wait-timeout` | `up -d` 만 | make-targets spec 근거 E9 (compose 의 `--wait` 지원, healthcheck 실패가 종료 코드로 드러남) | make-targets |

## 변경 이력
| 날짜 | 기능 id | 바뀐 절 |
|---|---|---|
| 2026-11-06 | ui-redesign | 공통 규칙, 상세 문서, 기술 선택과 근거 |
| 2026-11-06 | ui-redesign (2차) | 변경 이력만 (화면·부품 규칙은 design-system.md) |
| 2026-11-06 | ui-redesign (리뷰 후속) | 변경 이력만 (화면·부품 규칙은 design-system.md) |
| 2026-11-07 | ui-redesign (툴바·카드 지표·챗 용어) | 변경 이력만 (768px 미만 피드 툴바 줄바꿈, 카드 원천 지표, 챗 검색 범위 용어·모델 선택 한 곳·포커스 필터 라벨, `ui-audit` 판정 6종과 측정 상태 '챗 포커스 필터 열림'. 화면·부품 규칙은 design-system.md·ui-spec.md) |
| 2026-11-07 | ui-redesign | 변경 이력만 (카드 인기 점수를 원천 지표 소스만 그림, `ui-audit` `cardMetric` 판정 추가. 화면·부품 규칙은 design-system.md·ui-spec.md) |
| 2026-11-07 | ui-redesign | 변경 이력만 (피드 검색 영역·필터 영역·목록 머리줄 분리와 정렬 위치, 카드 바닥 줄바꿈, 챗 헤더 순서, 그림 이모지 대신 lucide 아이콘과 `IconGuard` 정적 검사, 이관 용어 `AI 챗에서 분석`·`AI 질의응답`, 일일 브리핑 설정 한 곳·헤드라인 한 번·분야 긴 라벨, `ui-audit` 새 판정 5종과 바뀐 판정 3종. 화면·부품 규칙은 design-system.md·ui-spec.md) |
| 2026-11-08 | backend-llm-test-isolation | 공통 규칙 '외부 연동' (Ollama 가용 기준 = `/api/tags` 200 + 설정 모델 설치, OpenAI·Ollama 설정 해석 함수) |
| 2026-11-09 | make-targets | 시스템 구성 (Makefile 대상 12개, `scripts/dev.sh`·`scripts/collect.py`, `docker-up --wait`), 데이터 (Docker `config.json`·`sources.json` `:rw`, 소스 저장 제자리 쓰기 대체 경로), 공통 규칙 스케줄 (빈 DB 첫 수집 백그라운드), 기술 선택과 근거 3행 |
