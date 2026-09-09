<div align="center">

# 🔭 AgentLens

**AI 및 에이전트(Agent) 기술 소식을 주기적으로 모아보고 관리하는 웹 애플리케이션**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](LICENSE)

</div>

---

## 📌 소개

**AgentLens**는 빠르게 쏟아지는 AI 및 자율 에이전트 관련 소식, 기술 블로그, 깃허브 릴리즈, 논문 등을 주기적으로 수집하여 한곳에서 읽기 편하게 정리해 주는 큐레이션 웹 애플리케이션입니다.

- **백엔드**: Python FastAPI + SQLite (비동기 처리 및 정기 수집 크론)
- **프론트엔드**: Next.js (App Router) + Tailwind CSS 대시보드

---

## 🛠️ 주요 기능

- **주기적 소식 수집**: 매일 4회(0, 6, 12, 18시 UTC) 또는 상단 '즉시 수집' 버튼을 통해 RSS 피드, 커뮤니티(GeekNews, HackerNews, Reddit), 논문(arXiv), GitHub 릴리즈 소식을 자동 수집합니다.
- **AI 3줄 요약 & 인사이트**: LLM(Gemini / OpenAI / Ollama 또는 기본 로컬 분석기)을 사용해 글의 핵심 내용 3줄 요약과 개발자를 위한 시사점을 제공합니다.
- **카테고리 & 소스 필터링**: 에이전트 기술, 하네스/벤치마크, MCP(Model Context Protocol), 일반 AI 소식 등 4개 카테고리 및 출처별로 모아볼 수 있습니다.
- **수집원(Sources) 관리**: 상단 '수집원' 버튼을 통해 수집 대상 피드를 켜고 끄거나 새 소스를 추가할 수 있습니다.
- **MCP(Model Context Protocol) 지원**: Claude Desktop 등 AI 에이전트에서 최신 소식을 직접 검색할 수 있도록 로컬 MCP 서버 기능을 제공합니다.
- **오늘의 브리핑**: 하루 동안 수집된 주요 소식을 정리한 일일 브리핑 모달을 지원합니다.

---

## 🚀 빠른 시작 (Quick Start)

### 1. 사전 요구사항
- Node.js 20+ 및 `pnpm`
- Python 3.11+

### 2. 설치 및 실행

```bash
# 1. 의존성 설치 (Python 가상환경 및 Node 패키지)
make setup

# 2. 백엔드(:8000) 및 프론트엔드(:3000/:3001) 동시 실행
make dev
```

브라우저에서 아래 주소로 접속합니다:
- **웹 대시보드**: [http://localhost:3001](http://localhost:3001) (또는 3000)
- **API 문서 (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. 테스트 및 데이터 수집

```bash
# 전체 테스트 실행 (Pytest + TypeScript 검증)
make test

# 수동으로 즉시 소식 수집 실행
make collect
```

---

## ⚙️ 설정 안내

- **`config.json`**: 포트 설정, 수집 주기, 사용할 LLM(Gemini / OpenAI / Ollama) API 키 등을 설정합니다.
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
├── AGENTS.md            # 개발 가이드 및 하네스 규약
├── Makefile             # 실행 및 테스트 명령어 모음
├── README.md            # 프로젝트 안내 문서
├── config.json          # 포트 및 LLM 설정
├── sources.json         # 수집 대상 목록
├── backend/             # Python FastAPI 백엔드 (수집기, DB, API, MCP)
├── frontend/            # Next.js 프론트엔드 대시보드
├── docs/                # 기획 및 아키텍처 문서
└── scripts/             # 실행 및 테스트 보조 스크립트
```

---

## 📄 라이선스

이 프로젝트는 [Apache License 2.0](LICENSE) 라이선스를 따릅니다.
