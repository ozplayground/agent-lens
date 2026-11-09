# AgentLens

AI 에이전트·하네스·MCP 기술 소식을 모아 요약하고, AI 챗 질의응답·일일 브리핑·외부 채널 공유·MCP 서버를 제공한다.

- `backend/`: FastAPI (Python 3.11), APScheduler, SQLite
- `frontend/`: Next.js 16, React 19, pnpm
- 두 앱은 REST `/api/*`(SSE 포함)로 통신한다.

## 주요 기능

| 기능 | 설명 |
|---|---|
| 뉴스 피드 | 카테고리·소스 필터, 검색·정렬, 북마크, 상세 보기, 기사 단위 AI 질문, RSS 출력, 트렌드 레이더 |
| AI 챗 | 세션 저장, SSE 스트리밍 답변, 수집 기사 기반 검색(RAG)과 인용, 모델 선택 |
| 수집·요약 | arXiv, GitHub, HackerNews, Hugging Face, Reddit, RSS 에서 수집해 4개 카테고리로 분류하고 요약. 매일 0·6·12·18시(UTC) 자동 실행 |
| 일일 브리핑 | 브리핑 생성, Notion 내보내기, 이메일(SMTP)·Slack·Discord 웹훅 발송 |
| 소스 관리·딥 리서치 | RSS·GitHub 소스 추가·끄기·삭제, 새 소스 후보 발굴 |
| MCP 서버 | 외부 MCP 클라이언트용 도구 4개 (stdio, `python -m app.mcp.server`) |
| UI | 디자인시스템 기반 반응형 화면(모바일·태블릿·PC), 라이트·다크 테마, 단축키, 커맨드 팔레트 |

기능별 상세 동작은 [기능 인덱스](docs/spec-writer/02_FUNCTIONAL_SPECIFICATION.md) 와 도메인별 [FSD](docs/spec-writer/fsd/) 에 있다.

## 빠른 시작

### 준비물
- Python 3.11 (`uv` 가 있으면 `make setup` 이 이것으로 `.venv` 를 만든다)
- Node.js 20 이상, pnpm
- (선택) Docker Desktop: 컨테이너로 실행할 때

### 로컬 실행
```bash
cp .env.example .env        # 필요한 키를 채운다 (아래 '설정')
make setup                  # .venv(Python 3.11)와 frontend 의존성 설치. 다시 돌려도 된다
make dev                    # backend :8000 (--reload) + frontend :3000 을 함께 띄운다. Ctrl-C 로 둘 다 내린다
```
- 웹: http://localhost:3000
- API: http://localhost:8000 (상태 확인 `GET /health`)

DB 가 비어 있으면 backend 가 뜨자마자 첫 수집을 백그라운드로 시작한다. 바로 수집하려면 `make collect` 를 쓴다.

### Docker 실행
```bash
make docker-build           # 이미지 agentlens-backend, agentlens-frontend
make docker-up              # 두 컨테이너가 healthy 가 될 때까지 기다린다
make docker-logs            # 로그 따라가기 (Ctrl-C 로 멈춘다)
make docker-down            # 내린다 (데이터 volume agentlens-data 는 남는다)
```
- 웹: http://localhost:3001
- API: http://localhost:8000

포트는 루트 `.env` 의 `BACKEND_PORT`, `FRONTEND_PORT` 로 바꾼다.

## make 명령

| 명령 | 하는 일 |
|---|---|
| `make setup` | 개발 환경 준비. `.venv` 가 Python 3.11 이면 다시 만들지 않는다 |
| `make dev` | backend 와 frontend 를 함께 실행. 포트가 쓰이고 있으면 띄우지 않고 실패한다 |
| `make check` | 전체 검사: backend pytest, frontend vitest·eslint·`tsc --noEmit` |
| `make test` | `make check` 와 같다 |
| `make build` | frontend 프로덕션 빌드 |
| `make collect` | 수집 실행. backend 가 떠 있으면 그 backend 에 시키고, 없으면 `backend/agentlens.db` 에 직접 수집한다 |
| `make reset` | **수집 데이터를 모두 지우고** 다시 수집한다. 대상은 `AGENTLENS_API_URL`(기본 `http://localhost:8000`) |
| `make clean` | 설치물·빌드 산출물·캐시 삭제. DB 와 설정 파일은 남긴다 |
| `make docker-build` / `docker-up` / `docker-down` / `docker-logs` | Docker Compose 빌드·실행·종료·로그 |

변수: `AGENTLENS_API_URL`, `COLLECT_MODE`(`auto`·`api`·`direct`), `COLLECT_TIMEOUT`, `DOCKER_WAIT_TIMEOUT`, `DOCKER_LOGS_ARGS`, `DEV_BACKEND_PORT`, `DEV_FRONTEND_PORT`. 예: `make dev DEV_BACKEND_PORT=18000 DEV_FRONTEND_PORT=13000`

## 설정

| 파일 | 내용 |
|---|---|
| `.env` (`.env.example` 복사) | LLM 키(`ANTHROPIC_API_KEY` 등), DB 경로, CORS, 수집 스케줄, 웹훅 URL |
| `config.json` | 앱 설정, 브리핑·공유 설정 (UI 에서 저장하면 바뀐다) |
| `sources.json` | 수집 소스 목록 (UI 에서 추가·끄기·삭제) |

- LLM 은 Claude(Anthropic)를 기본으로 쓴다.
- 키가 없으면 OpenAI 키, 그다음 로컬 Ollama(설정한 모델이 설치돼 있을 때)를 쓴다. 셋 다 없으면 관련성·품질 점수는 휴리스틱으로 매기고, AI 챗·질문은 503 으로 응답한다.
- 설정 우선순위와 전체 항목은 [배포 명세](docs/devops-engineer/01_DEPLOYMENT_SPEC.md) 에 있다.

## 프로젝트 구조

```
backend/            FastAPI 앱 (app/), 테스트 (tests/)
frontend/           Next.js 앱 (src/app, src/components, src/tests)
scripts/            dev.sh (make dev), collect.py (make collect)
docs/               제품·기술·운영 문서, 산출물 템플릿 (docs/templates/), 서브에이전트 산출물 (docs/<서브에이전트>/)
.claude/            Claude Code 하네스: 서브에이전트 (agents/), 스킬 (skills/), 규칙 (rules/)
docker-compose.yml  backend + frontend 컨테이너
Makefile            개발·검사·실행 명령
```

## 문서

| 문서 | 내용 |
|---|---|
| [PRD](docs/spec-writer/01_PRD.md) | 제품 범위, 사용자, 원칙, 요구사항 |
| [기능 인덱스](docs/spec-writer/02_FUNCTIONAL_SPECIFICATION.md), [FSD](docs/spec-writer/fsd/), [정책](docs/spec-writer/03_POLICIES_AND_EDGES.md) | 기능 동작, 전역 정책·엣지 케이스 |
| [아키텍처 ADR](docs/fullstack-architect/01_ARCHITECTURE_ADR.md) | 시스템 구조와 기술 결정 |
| [시스템 설계](docs/system-designer/01_SYSTEM_DESIGN.md), [OpenAPI](docs/system-designer/02_OPENAPI_SPEC.yaml) | backend 계층, DB, REST·SSE API |
| [컴포넌트 명세](docs/ui-system-designer/01_COMPONENT_SPEC.md), [디자인시스템](docs/ui-system-designer/02_DESIGN_SYSTEM.md) | 화면과 디자인시스템 |
| [계약](docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md) | backend ↔ frontend 계약, MSW |
| [backend TDD](docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md), [frontend TDD](docs/frontend-tdd-engineer/01_TDD_CYCLE_LOG.md) | 테스트 목록과 이력 |
| [backend 리뷰](docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md), [frontend 리뷰](docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md) | 코드 감사 |
| [QA 계획](docs/qa-engineer/01_QA_TEST_PLAN.md), [QA 결과](docs/qa-engineer/02_QA_TEST_REPORT.md) | 검사 전략, 결과, 알려진 결함 |
| [배포 명세](docs/devops-engineer/01_DEPLOYMENT_SPEC.md) | 실행, 설정, 스케줄, 외부 의존, 문제 해결 |
| [시장 벤치마크](docs/market-analyst/01_MARKET_BENCHMARK.md) | 경쟁·유사 서비스 |
| [docs/releases.md](docs/releases.md) | 릴리스 이력 |

## 개발 하네스
Claude Code 로 개발한다. 기획 → 설계·계약 → 병렬 TDD → 리뷰 → QA·배포의 5단계를 서브에이전트 12개가 나눠 맡는다. 구성과 규칙은 [CLAUDE.md](CLAUDE.md) 에 있다.

## 알아 둘 점
- 사용자 인증이 없고 CORS 가 열려 있다. 로컬이나 신뢰할 수 있는 네트워크에서만 띄운다.
- `make check` 의 pytest 는 LLM 호출을 흉내 내지만, 스크래퍼·Notion·SMTP 호출은 실제로 나간다.

## 라이선스
[Apache License 2.0](LICENSE)
