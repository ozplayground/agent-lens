<div align="center">

# 🔭 AgentLens

**AI Agent · Harness · MCP 기술 소식 수집, 요약 및 전용 AI 챗 워크스페이스**

[![Version](https://img.shields.io/badge/Version-v0.3.0-blue?style=flat-square)](https://github.com/ozplayground/agent-lens/releases)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](LICENSE)

</div>

---

## 📌 소개

**AgentLens**는 AI 에이전트(Autonomous Agents), 하네스(Harness) 및 벤치마크, MCP(Model Context Protocol) 관련 기술 소식을 주기적으로 수집하고, LLM을 통해 노이즈를 걸러내어 3줄 요약과 실무 시사점을 제공하는 개발자용 풀스택 기술 인텔리전스 플랫폼입니다.

- **백엔드**: Python FastAPI 0.141+ + SQLite (WAL 모드, 비동기 크롤러, ReAct 자율 에이전틱 챗 루프, Claude 5.5 & Gemini LLM 프로세서, ArticleScraperService, FastMCP 서버)
- **프론트엔드**: Next.js 16 (App Router) + Tailwind CSS (라이트/다크 테마 지원, `/chat` 전용 AI 워크스페이스, 글로벌 단축키 & Command Palette `Cmd+K`)

---

## 🛠️ 주요 기능

- **전용 AI 챗 워크스페이스 (`/chat` — v0.3.0 ReAct 아키텍처 & 단일 기사 고정 모드)**:
  - **Global 모드 ReAct 에이전틱 챗 루프 (`thinking` ➔ `tool_calling` ➔ `observing`)**:
    - 질문 의도를 먼저 추론(`thinking`)하여 일상 인사말이나 일반 대화일 경우 불필요한 DB 검색 도구 호출을 자율 생략하고(`event: sources` 미방출, `primary_count=0`), 기술 질의일 때만 `search_news_corpus` 도구를 호출(`tool_calling` ➔ `observing`)하여 연관 소스를 정밀 인출합니다.
    - 어시스턴트 답변의 첫 스트리밍 토큰이 도착한 이후에만 실제 인출된 소스 개수에 맞춰 `원문 N건` 뱃지를 노출하여 UI 정직성을 보장합니다.
  - **Scoped 모드 단일 기사 고정 그라운딩 (Fixed Single-Article Scoped Mode)**:
    - 특정 뉴스를 포커스하여 질문할 때 불필요한 충분성 평가(`evaluating_sufficiency`)나 외부 보충 검색(`agentic_searching`)으로 다른 기사가 섞이는 현상을 원천 배제하고, 지정된 단일 기사(`primary_count=1, supplementary_count=0`)의 원문(`full_content`)과 메타데이터에만 100% 집중하여 심층 기술 분석을 수행합니다.
  - **공식 Claude 5.5 3-Tier & Google Gemini 멀티 모델 선택**:
    - ⚡ **Claude Haiku 5.5 (`claude-haiku-5-5`)**: 초저지연 기술 탐색 및 즉각적인 질의응답
    - 🎯 **Claude Sonnet 5.5 (`claude-sonnet-5-5`)** *(기본 권장)*: 아키텍처 심층 분석, 실무 코드 구현 가이드 및 종합 테크 리포트 합성
    - 🧠 **Claude Opus 5.5 (`claude-opus-5-5`)**: 고난도 복합 추론 및 대규모 시스템 아키텍처 비교 분석
    - ✨ **Google Gemini (`gemini-3.5-flash-lite`)**: 빠르고 경량화된 멀티 프로바이더 대안 모델
  - **Senior Staff Architect 4단 기술 리포트**: 단순 요약 앵무새 답변(Parrot Summary)을 배제하고, 실무 엔지니어링 표준 4대 섹션으로 구조화된 마크다운 리포트를 실시간 SSE 스트리밍으로 제공합니다.
    1. `핵심 아키텍처 및 동작 원리 (Core Architecture & Mechanics)`
    2. `주요 기능 및 코드 구현 예시 (Features & Code Snippets)`
    3. `기존 기술 대비 차별점 및 벤치마크 (Comparison & Benchmarks)`
    4. `실무 도입 시 고려사항 및 튜닝 파라미터 (Production Considerations)`
  - **소식 포커스 핸드오버 (News Focus Handover)**: 대시보드 기사 카드 및 상세 모달에서 클릭 한 번으로 챗 워크스페이스로 원문 컨텍스트를 즉시 인계하여, 기사 원문(`full_content`) 기반의 할루시네이션 없는 정밀 기술 질의응답을 지원합니다.
- **자동 소식 수집 및 노이즈 필터링**: RSS 피드, 커뮤니티(GeekNews, HackerNews, Reddit), 논문(arXiv), GitHub 릴리즈 소식을 정기 수집합니다. 긱뉴스나 일반 피드의 비(非) AI 글은 사전 키워드 필터와 LLM 평가를 통해 자동으로 걸러냅니다.
- **AI 3줄 요약 및 개발자 시사점 (Why It Matters)**: Claude 5.5 및 멀티 LLM 기반의 기사 핵심 3줄 요약과 엔지니어링 관점에서의 실무 시사점을 자동 생성합니다.
- **기사 질의응답 (Ask AI) & 일일 브리핑**: 기사 상세 모달 질의응답, 분야별 소식 종합 브리핑, 마크다운 복사/다운로드, Notion 연동 및 이메일/웹훅 발송을 지원합니다.
- **로컬 FastMCP 서버 내장**: Claude Desktop 등 로컬 AI 도구에서 수집된 소식을 실시간 검색/참조할 수 있도록 Model Context Protocol 규격을 완벽 지원합니다.

---

## 🚀 빠른 시작

### 1. Docker Compose로 원클릭 배포

Docker Compose를 사용하여 백엔드와 프론트엔드를 한 번에 빌드하고 프로덕션 모드로 실행할 수 있습니다.

```bash
# 컨테이너 빌드 및 백그라운드 실행
docker compose up -d --build

# 또는 Makefile 단축 명령어 사용
make docker-up

# 실시간 컨테이너 로그 확인
make docker-logs

# 서비스 정상 종료
docker compose down
# 또는 make docker-down
```

접속 주소:
- **웹 대시보드**: [http://localhost:3001](http://localhost:3001)
- **AI 챗 워크스페이스**: [http://localhost:3001/chat](http://localhost:3001/chat)
- **API 문서 (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **백엔드 헬스체크**: [http://localhost:8000/health](http://localhost:8000/health)

---

### 2. 로컬 개발 환경에서 직접 실행

#### 요구사항
- Python 3.11+
- Node.js 20+ 및 `pnpm`

#### 설치 및 개발 서버 실행

```bash
# 1. 의존성 설치 (가상환경 생성, 백엔드/프론트엔드 패키지 설치)
make setup

# 2. 개발 서버 동시 실행 (백엔드 :8000, 프론트엔드 :3001)
make dev
```

#### 전체 테스트 및 품질 검증

백엔드 Pytest (비동기 SQLite, LLM 서비스 검증) 및 프론트엔드 타입체크/컴포넌트 검증을 일괄 수행합니다:

```bash
make test
```

---

## ⚙️ 설정 안내

AgentLens는 다중 LLM 프로바이더 연동과 유연한 수집/알림 설정을 지원합니다.

### 1. 환경변수 설정 (`backend/.env`)

루트 디렉토리 또는 `backend/.env` 파일에서 API 키와 서비스 환경을 구성합니다 (`backend/.env.example` 참조):

#### Anthropic Claude 5.5 설정 (기본 권장)
기본 소식 요약 파이프라인과 `/chat` 워크스페이스는 Anthropic Claude 5.5를 코어 엔진으로 사용합니다:
```bash
ANTHROPIC_API_KEY="your-anthropic-api-key"
ANTHROPIC_MODEL="claude-sonnet-5-5"
ANTHROPIC_COLLECTION_MODEL="claude-sonnet-5-5"
ANTHROPIC_DEFAULT_CHAT_MODEL="claude-sonnet-5-5"
```
> - **프롬프트 캐싱 (Prompt Caching)**: 반복적인 시스템 지침 및 가이드라인에 Ephemeral 캐싱을 적용하여 토큰 비용을 최대 90% 절감합니다.
> - **Zero-Mock 프로덕션 원칙**: 프로덕션 모드에서 API 키 누락 시 가짜 목(Mock) 답변을 생성하지 않고, 즉시 503 안내를 반환하여 데이터 무결성을 보장합니다.

#### 멀티 프로바이더 설정 (대체 및 선택 옵션)
요구사항이나 환경에 따라 Google Gemini, OpenAI, 로컬 오픈소스 LLM을 함께 구성하거나 대체 프로바이더로 지정할 수 있습니다:
```bash
# Google Gemini 연동
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.5-flash-lite"

# OpenAI 연동
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="gpt-4o-mini"

# 로컬 Ollama / vLLM 연동
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2:latest"
```

#### 알림 및 브리핑 연동 (선택 사항)
```bash
# Slack / Discord 웹훅
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."

# Notion 일일 브리핑 자동 발행
NOTION_API_KEY="secret_..."
NOTION_PAGE_ID="..."
```

---

### 2. 설정 파일 (`config.json` & `sources.json`)

- **`config.json`**: 포트 설정, 수집 주기 스케줄, LLM 모델 선택 및 품질 컷오프 임계치, 세션 히스토리 보관 한도(최대 30개 FIFO) 등을 관리합니다. 웹 대시보드의 설정 모달에서도 실시간 수정이 가능합니다.
- **`sources.json`**: 수집 대상 RSS 피드 및 사이트 목록을 JSON 형식으로 관리합니다.

---

## 🔌 MCP 연동 (Claude Desktop)

Claude Desktop 설정 파일(`claude_desktop_config.json`)에 아래 설정을 추가하여 로컬 도구로 연동할 수 있습니다:

```json
{
  "mcpServers": {
    "agentlens": {
      "command": "python",
      "args": ["-m", "app.mcp.server"],
      "cwd": "/절대경로/agentlens/backend"
    }
  }
}
```

---

## 📂 프로젝트 구조

```
agentlens/
├── docker-compose.yml          # 프로덕션 Docker Compose 명세
├── Makefile                    # dev, test, setup, docker-up/down 단축 명령
├── README.md                   # 프로젝트 문서
├── config.json                 # 애플리케이션 공통 설정
├── sources.json                # 소식 수집 피드 소스 목록
├── backend/                    # FastAPI 0.141+ 백엔드
│   ├── app/
│   │   ├── api/                # REST 엔드포인트 (/news, /chat, /briefing, /mcp)
│   │   ├── collectors/         # 비동기 뉴스 피드 수집기 & 키워드 필터
│   │   ├── models/             # SQLAlchemy ORM 모델 (NewsItem, ChatSession, ChatMessage)
│   │   ├── schemas/            # Pydantic v2 데이터 스키마
│   │   ├── services/           # Claude 5.5 LLM 프로세서, ArticleScraper, AgenticSearch
│   │   └── mcp/                # FastMCP 서버 구현체
│   ├── tests/                  # Pytest 백엔드 단위/통합 테스트 스위트
│   └── Dockerfile              # 백엔드 프로덕션 멀티스테이지 Dockerfile
├── frontend/                   # Next.js 16 (App Router) 프론트엔드
│   ├── src/
│   │   ├── app/                # App Router 페이지 (/, /chat, /api/health)
│   │   ├── components/         # 대시보드, ChatWorkspace, ChatSidebar, 테마 토글
│   │   ├── hooks/              # SSE 스트리밍, 세션 캐시, 글로벌 핫키 훅
│   │   ├── types/              # TypeScript 인터페이스 & Zod 스키마
│   │   └── tests/              # Vitest + RTL 컴포넌트 테스트 스위트
│   └── Dockerfile              # 프론트엔드 Standalone 경량화 Dockerfile
└── docs/                       # 기획, 아키텍처 ADR, FSD, 배포 검증 산출물
```

---

## 📄 라이선스

이 프로젝트는 [Apache License 2.0](LICENSE) 라이선스를 따릅니다.
