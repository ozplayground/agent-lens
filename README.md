<div align="center">

# 🔭 AgentLens

**AI 및 자율 에이전트(Agent) 기술 소식을 주기적으로 수집·선별하고 인텔리전스를 제공하는 웹 애플리케이션**

[![Version](https://img.shields.io/badge/Version-v1.5.0-blue?style=flat-square)](https://github.com/ozplayground/agent-lens/releases)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-Supported-2496ED?style=flat-square&logo=docker&logoColor=white)](docker-compose.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](LICENSE)

</div>

---

## 📌 소개

**AgentLens**는 빠르게 쏟아지는 글로벌 AI, 자율 에이전트, 하네스/벤치마크, MCP(Model Context Protocol) 관련 최신 소식을 자동 수집하고, LLM을 통해 노이즈를 제거하여 실질적인 기술 인사이트를 제공하는 전문 큐레이션 인텔리전스 플랫폼입니다.

- **백엔드**: Python FastAPI + SQLite WAL (비동기 처리, 정기 크론 수집기, FastMCP 서버)
- **프론트엔드**: Next.js 16 (App Router) + Tailwind CSS 반응형 대시보드

---

## 🛠️ 주요 기능

- **자동 소식 수집 파이프라인**: 매일 4회(0, 6, 12, 18시 UTC) 또는 상단 '즉시 수집' 버튼을 통해 RSS 피드, 커뮤니티(GeekNews, HackerNews, Reddit), 최신 논문(arXiv), GitHub 릴리즈 소식을 자동 수집합니다.
- **LLM 품질 게이트 & 큐레이션**: 기술 깊이, 참신성, 실용성을 종합 평가하여 마케팅/홍보성 글을 자동 컷오프(5.0점 미만 필터링)하고, 7.8점 이상의 고신호 소식에 `⭐️ Must-Read` 배지를 부여합니다.
- **AI 3줄 요약 & 개발자 시사점**: 기사 핵심 내용 3줄 요약(3-Bullet TL;DR)과 엔지니어 관점의 시사점(Why It Matters), 추출된 기술 스택 태그를 제공합니다.
- **아티클 대화형 질의응답 (Ask AI)**: 특정 기술 기사나 논문에 대해 대화형 질문창을 통해 아키텍처 도입 방안, 타 기술과의 차별점 등을 자유롭게 질의응답할 수 있습니다.
- **오늘의 AI 종합 브리핑**: 4대 카테고리(하네스, MCP, 에이전트, 최신 AI)별 일일 요약 리포트를 자동 합성하며, 마크다운 복사/다운로드, Notion 페이지 즉시 생성 및 SMTP 이메일 자동 발송을 지원합니다.
- **카테고리 & 소스 다차원 필터링**: 에이전트 기술, 하네스/벤치마크, MCP, 일반 AI 소식 등 카테고리별 및 출처별(국내/해외) 실시간 필터링을 지원합니다.
- **북마크 및 개인 보관함**: 브라우저 로컬 환경에 유용한 소식을 저장하고 보관함 탭에서 언제든 다시 열람할 수 있습니다.
- **수집원(Sources) 관리 & 자율 딥 리서처**: 등록된 RSS 피드 및 GitHub 모니터링 저장소를 켜고 끄거나 새 소스를 추가할 수 있으며, AI Deep Researcher를 통해 고품질 소스를 자율 발굴·채택합니다.
- **MCP(Model Context Protocol) 지원**: Claude Desktop 등 로컬 AI 에이전트에서 최신 에이전트 소식을 직접 검색할 수 있도록 로컬 FastMCP 서버(`app.mcp.server`)를 기본 내장하고 있습니다.
- **Docker Compose 원클릭 배포**: 컨테이너 환경에서 프론트엔드와 백엔드를 즉시 띄워 운영할 수 있습니다.

---

## 🚀 빠른 시작 (Quick Start)

### 방법 1. Docker Compose로 실행 (권장)

```bash
# 컨테이너 빌드 및 실행
docker compose up -d --build

# 중지
docker compose down
```

접속 주소:
- **웹 대시보드**: [http://localhost:3001](http://localhost:3001)
- **API 문서 (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 방법 2. 로컬 환경에서 직접 실행

#### 1. 사전 요구사항
- Node.js 20+ 및 `pnpm`
- Python 3.11+

#### 2. 설치 및 실행

```bash
# 1. 의존성 설치 (Python 가상환경 및 Node 패키지)
make setup

# 2. 백엔드(:8000) 및 프론트엔드(:3001) 동시 실행
make dev
```

브라우저에서 아래 주소로 접속합니다:
- **웹 대시보드**: [http://localhost:3001](http://localhost:3001)
- **API 문서 (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 3. 테스트 및 데이터 수집

```bash
# 전체 테스트 실행 (Pytest 49개 + Vitest 컴포넌트 7개)
make test

# 수동으로 즉시 소식 수집 실행
make collect
```

---

## ⚙️ 설정 안내

- **`config.json`**: 포트 설정, 수집 주기, 사용할 LLM(Gemini / OpenAI / Ollama) API 키, Notion 연동 및 이메일(SMTP), 슬랙/디스코드 웹훅 설정을 관리합니다.
- **`sources.json`**: 수집할 RSS 피드 및 사이트 목록입니다. 웹 UI에서 직접 편집하거나 파일에서 수정할 수 있습니다.

---

## 🔌 MCP 연동 (Claude Desktop 등)

Claude Desktop 등에서 AgentLens의 소식을 조회하려면 설정 파일(`claude_desktop_config.json`)에 아래 내용을 추가합니다:

```json
{
  "mcpServers": {
    "agentlens": {
      "command": "python",
      "args": ["-m", "app.mcp.server"],
      "cwd": "/path/to/agentlens/backend"
    }
  }
}
```

---

## 📂 프로젝트 구조

```
agentlens/
├── AGENTS.md            # 풀스택 개발팀 하네스 엔지니어링 규약
├── docker-compose.yml   # Docker Compose 설정
├── Makefile             # 실행, 테스트, 도커 관리 명령어
├── README.md            # 프로젝트 안내 문서
├── config.json          # 포트, 스케줄 및 LLM 설정
├── sources.json         # 수집 대상 피드 목록
├── backend/             # Python FastAPI 백엔드 (수집기, DB, API, FastMCP, Dockerfile)
├── frontend/            # Next.js 프론트엔드 대시보드 (컴포넌트, 훅, Dockerfile)
├── docs/                # 12인 전문 서브에이전트 규격 산출물 및 QA 보고서
└── scripts/             # 실행 및 테스트 보조 스크립트
```

---

## 📄 라이선스

이 프로젝트는 [Apache License 2.0](LICENSE) 라이선스를 따릅니다.
