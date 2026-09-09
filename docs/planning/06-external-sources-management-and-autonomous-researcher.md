# [기획서] 06. 스크래핑 대상 정보 별도 파일 분리 관리 및 자율 소스 리서치/자동 발굴 엔진 구축

## 1. 기획 배경 및 요구사항

### 1.1 사용자 피드백
> 1. *"스크래핑 대상 정보는 별도의 파일로 관리 할 수 있게 해줘."*
> 2. *"그리고 정보등을 가져올 수 있는 사이트나 rss 같은 것들을 조사하고 스크래핑 대상에 넣는 기능도 만들어줘 리서치 기능이 매우 중요한거야."*

### 1.2 문제점 진단
1. **수집 대상 소스의 하드코딩 및 분산 관리 문제**:
   - 현재 RSS 피드 일부만 `backend/app/config/sources.json`에 정의되어 있고, GitHub 레포(`QUERIES`, `CURATED_REPOS`), Reddit 서브레딧(`SUBREDDITS`), HackerNews 검색어(`QUERIES`), arXiv 쿼리 등 핵심 수집 대상들이 각각의 파이썬 코드 내부에 하드코딩되어 분산되어 있음.
   - 사용자가 새로운 에이전트 프로젝트 레포나 새로운 기술 블로그를 추가/제외하려면 코드를 직접 수정해야 하며, 관리 편의성이 떨어짐.
2. **지능형 소스 리서치 및 자동 발굴 메커니즘 부재**:
   - AI 에이전트, 하네스, MCP 생태계는 전세계적으로 매주 수십 개의 새로운 연구소, 프레임워크, 엔지니어링 블로그가 등장함.
   - 현재 시스템은 사전에 등록된 몇 가지 소스만 정적으로 순회할 뿐, 최신 에이전트 동향을 리서치하여 새로운 양질의 소스를 스스로 찾아내고 검증하여 수집 파이프라인에 편입하는 "리서치 기능"이 전무함.

---

## 2. 세부 설계 및 개선 스펙

### F-01. 스크래핑 대상 전용 통합 파일 분리 (`sources.json`)

1. **파일 위치 및 관리 원칙**:
   - 파일 위치: 프로젝트 최상위 루트 `sources.json` (개발자 및 사용자가 바로 열어보고 편집할 수 있도록 최상위에 배치하며, `backend/app/config/sources.json`와 자동 동기화/폴백).
   - 모든 크롤러(`rss.py`, `github.py`, `reddit.py`, `hackernews.py`, `arxiv.py`, `huggingface.py`)는 실행 시 하드코딩된 변수 대신 `sources.json`을 단일 진실 공급원(Single Source of Truth)으로 참조함.
2. **`sources.json` 스키마 구조**:
   - `rss_feeds`:
     - `id`: 고유 식별자 (예: `geeknews`, `simonwillison`)
     - `name`: 소스 표시명
     - `url`: RSS/Atom 피드 URL
     - `site_url`: 웹사이트 홈 URL
     - `category_hint`: 기본 카테고리 (`harness`, `mcp_plugins_skills`, `agent_tech`, `ai_news`)
     - `country`: `KR` 또는 `GLOBAL`
     - `enabled`: 활성화 여부 (`true` / `false`)
     - `description`: 소스 설명
   - `github_sources`:
     - `enabled`: 활성화 여부
     - `search_queries`: GitHub Search API 질의어 배열
     - `monitored_repos`: 지속 모니터링할 레포지토리 객체 목록 (`repo`, `category`, `enabled`, `description`, `stars_hint`)
   - `reddit_sources`:
     - `enabled`: 활성화 여부
     - `subreddits`: 모니터링할 서브레딧 배열 (`LocalLLaMA`, `MachineLearning` 등)
     - `keywords`: 필터 키워드
   - `hackernews_sources`:
     - `enabled`: 활성화 여부
     - `queries`: Algolia 검색 키워드 배열
   - `arxiv_sources`:
     - `enabled`: 활성화 여부
     - `queries`: arXiv API 검색 질의 배열

---

### F-02. 자율 소스 리서처 & 피드 자동 발굴 엔진 (Autonomous Source Researcher)

`app/services/source_researcher.py`에 지능형 리서치 모듈 신설:

1. **URL 기반 피드 자동 감지 (Auto-Feed Detector)**:
   - 사용자가 임의의 블로그나 사이트 URL(예: `https://lilianweng.github.io/posts/`, `https://github.com/langchain-ai/langgraph`)을 입력하면:
     - HTML 문서 내 `<link rel="alternate" type="application/rss+xml">` 및 `<link rel="alternate" type="application/atom+xml">` 자동 파싱.
     - 일반적인 피드 경로(`/feed`, `/rss`, `/rss.xml`, `/atom.xml`, `/feed.xml`, `/index.xml`) 휴리스틱 자동 프로빙.
     - GitHub URL인 경우 `/releases.atom` 자동 매핑.
     - 탐지 성공 시 최신 3개 글의 제목, 발행일, 요약을 즉각 추출하여 유효성(HTTP 200) 검증.
2. **키워드/주제 기반 AI 딥 리서치 (Topic & Ecosystem Researcher)**:
   - 사용자가 탐색 키워드(예: *"Agent Harness"*, *"Model Context Protocol"*, *"AI Coding Benchmark"*, *"LLM Sandbox"*)를 입력하거나 원클릭 AI 발굴을 요청하면:
     - 에이전트/하네스 생태계 전문 사이트, 리서치 기관, 주요 기업 엔지니어링 블로그 풀(Curated Knowledge Base) 및 웹 검색을 활용하여 미등록 소스 후보군 발굴.
     - 후보 피드의 최신 글들을 파싱하여 신호 적합도(Signal Score: 1.0 ~ 10.0) 산정.
     - 최적 카테고리(`harness`, `mcp_plugins_skills`, `agent_tech`, `ai_news`) 자동 분류 및 추천 사유(Reason) 생성.
3. **원클릭 스크래핑 대상 편입 (One-Click Target Registration)**:
   - 발굴된 후보 목록에서 `[스크래핑 대상에 추가]` 버튼을 누르면 즉각 `sources.json`의 해당 섹션에 정규화되어 추가 저장됨.
   - 다음 수집 주기 또는 즉시 수집 시 해당 소스가 자동으로 크롤링 파이프라인에 참여함.

---

### F-03. 소스 관리 & 리서처 REST API 스펙

- `GET /api/sources`: 현재 등록된 전체 수집 대상(RSS, GitHub, Reddit, HN, arXiv 등) 목록 및 통계 반환.
- `POST /api/sources`: 신규 소스 수동 등록 (URL 유효성 검사 후 `sources.json` 영속 저장).
- `PATCH /api/sources/{source_id}/toggle`: 특정 소스 활성/비활성 토글.
- `DELETE /api/sources/{source_id}`: 등록된 소스 삭제.
- `POST /api/research/inspect-url`: 입력된 웹사이트 URL에서 RSS/피드를 자동 감지하고 최신 기사 프리뷰 반환.
- `POST /api/research/discover`: 키워드 기반 AI 소스 발굴 실행 (후보 소스 목록, 신호 점수, 카테고리, 추천 사유 반환).
- `POST /api/research/register-candidate`: 발굴된 후보를 `sources.json`에 원클릭 등록.

---

### F-04. 프론트엔드 UI/UX: 소스 관리 & AI 리서처 대시보드

GitHub 다크 테마(`#0d1117`, `#161b22`, `#30363d`) 스타일에 맞추어 상단 헤더에 `[소스 리서치 & 관리]` 버튼 및 대화형 모달/뷰 구현:

1. **탭 1: 수집 대상 관리 (Active Targets)**:
   - 카테고리별/타입별(RSS, GitHub, Reddit 등) 카드 그리드.
   - 소스 이름, URL, 카테고리 뱃지, 상태 토글 스위치(ON/OFF), 삭제 버튼.
   - `[+ 새 소스 직접 등록]` 간편 입력 폼.
2. **탭 2: AI 소스 리서처 (Source Researcher)**:
   - **빠른 키워드 발굴**: 에이전트 하네스/MCP 관련 추천 태그 칩 클릭 또는 키워드 입력 후 `[AI 소스 발굴 실행]`.
   - **URL 다이렉트 프로빙**: 관심 있는 사이트 URL 입력 시 즉시 피드 링크 추출 및 최근 글 3개 프리뷰.
   - **발굴 결과 카드**:
     - 신호 적합도 뱃지 (예: `신호 강도 9.2점 / Must-Read 추천`), 추천 카테고리, 추천 이유.
     - `[+ 스크래핑 대상에 추가]` 녹색 버튼 제공. 클릭 시 실시간으로 소스 등록 완료 토스트 노출.

---

## 3. 검증 하네스 및 테스트 계획

1. **단위 및 통합 테스트 (`backend/tests/`)**:
   - `test_sources_config.py`: `sources.json` 로드, 읽기, 쓰기, 토글, 삭제 테스트.
   - `test_source_researcher.py`: URL 피드 자동 감지(RSS, Atom, GitHub releases), 키워드 리서치, 신호 점수 산출 테스트.
   - `test_sources_api.py`: `/api/sources` 및 `/api/research/*` 엔드포인트 동작 검증.
2. **E2E 헤드리스 브라우저 테스트 (`scripts/test_headless_browser.mjs`)**:
   - 소스 관리 모달 열기 -> 소스 토글 -> 새 소스 리서치 검색 -> 발굴 결과 확인 -> 원클릭 추가 동작 검증.
3. **무결성 검사**:
   - `./scripts/test.sh` (Pytest + TypeScript) 100% 통과 보장.
