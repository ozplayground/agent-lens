# 기능명세: MCP 서버

Updated: 2026-11-06

## 개요
AgentLens 는 Model Context Protocol(MCP) 서버를 함께 제공해 Claude Desktop, Cursor 같은 MCP 클라이언트가 수집된 뉴스를 도구 호출로 조회하고 수집을 실행할 수 있게 한다. 서버는 `backend/app/mcp/server.py` 의 FastMCP 앱이며, 클라이언트가 `python -m app.mcp.server` 를 자식 프로세스로 띄워 stdio 로 통신한다. 웹 API 서버와는 별개 프로세스지만 같은 백엔드 코드·설정·SQLite DB 를 쓴다. 도구는 4개(하네스 소식, MCP·스킬 생태계 소식, 키워드 검색, 즉시 수집)다. 웹 화면에서는 헤더 "MCP" 버튼으로 여는 `McpModal` 이 도구 목록과 클라이언트 설정 예시를 보여 주고, `GET /api/mcp/info` 는 실행 중인 서버 기준의 설정 예시를 JSON 으로 돌려준다.

## 기능 목록
| ID | 기능 | 설명 | 진입점 (화면 / API) |
|---|---|---|---|
| MCP-01 | MCP 서버 실행 | FastMCP 앱을 stdio 로 실행한다 | `python -m app.mcp.server` (cwd `backend/`) |
| MCP-02 | get_latest_harness_methods | `harness` 카테고리 뉴스를 hotness 순으로 돌려준다 | MCP 도구 |
| MCP-03 | get_mcp_and_skills_ecosystem | `mcp_plugins_skills` 카테고리 뉴스를 hotness 순으로 돌려준다 | MCP 도구 |
| MCP-04 | search_agent_news | 제목·요약 부분 일치 검색, 카테고리 필터 | MCP 도구 |
| MCP-05 | trigger_agentlens_crawl | 전체 소스 수집을 즉시 실행하고 결과를 돌려준다 | MCP 도구 |
| MCP-06 | MCP 정보 API | 도구 목록과 Claude Desktop 설정 예시(실행 중인 Python 경로·backend 절대 경로)를 돌려준다 | `GET /api/mcp/info` |
| MCP-07 | MCP 연동 모달 | 도구 4개 설명과 고정된 `claude_desktop_config.json` 예시, 복사 버튼 | 헤더 "MCP", ⌘K "FastMCP 도구 설정 열기" → `McpModal` |

## MCP-01 MCP 서버 실행
- 진입점: `backend/` 를 cwd 로 두고 `python -m app.mcp.server`. MCP 클라이언트 설정의 `command`/`args`/`cwd` 로 띄운다 (예시는 MCP-06, MCP-07).
- 입력: 없음. 설정은 웹 서버와 같은 경로에서 읽는다.
- 처리 규칙:
  1. `FastMCP("AgentLens-MCP-Server")` 인스턴스를 만들고 `@mcp.tool()` 로 도구 4개를 등록한다. 도구의 입력 스키마와 설명은 함수 시그니처(타입 힌트·기본값)와 docstring 에서 만들어진다.
  2. `__main__` 으로 실행될 때 `mcp.run()` 을 인자 없이 부른다. 전송 방식은 FastMCP 기본값인 stdio 다. HTTP/SSE 로 띄우는 코드는 없다.
  3. 모듈을 import 하면서 `app.config`(설정), `app.database`(엔진·세션), `app.models.news`, `app.collectors.manager`(수집기 전체)를 함께 불러온다.
  4. 설정: `config.json` 을 cwd, cwd 의 부모, 저장소 루트, `backend/app/config/config.json` 순으로 찾고 `.env` 들을 읽는다 (웹 서버와 같은 `Settings`). cwd 가 `backend/` 면 루트 `config.json` 이 쓰인다.
  5. DB: `DATABASE_URL`(기본 `sqlite+aiosqlite:///./agentlens.db`)은 cwd 기준 상대 경로라, cwd 가 `backend/` 면 `backend/agentlens.db` 를 연다.
  6. 시작할 때 `ensure_db_schema()`(테이블 생성·열 보강)를 부르지 않는다. 스케줄러도 띄우지 않는다.
  7. 모든 도구는 문자열(JSON 텍스트)을 돌려준다.
- 출력: stdio 위의 MCP 세션.
- 예외·엣지:
  - DB 파일이나 `news_items` 테이블이 없으면 조회 도구가 예외로 실패한다 (서버 코드에 예외 처리가 없다). 저장소에는 `agentlens.db` 가 루트와 `backend/` 두 곳에 있어, 웹 서버와 MCP 서버의 cwd 가 다르면 서로 다른 DB 를 본다.
  - 인증·권한 확인이 없다. 로컬 자식 프로세스로 띄우는 것을 전제로 한다.
  - 표준 출력은 MCP 프로토콜 채널이다. 수집기·설정 코드 중 import 시점에 표준 출력에 쓰는 코드는 확인하지 못했다 (`config.py` 의 저장 실패 `print` 는 저장 경로에서만 실행된다).
- 관련 코드: `backend/app/mcp/server.py:1-8`, `:49-50`, `backend/app/config.py:7-35`, `:42`, `backend/app/database.py:1-28`, `:45-48`, `backend/requirements.txt:15`(`mcp>=1.0.0`)

## MCP-02 get_latest_harness_methods
- 진입점: MCP 도구 `get_latest_harness_methods`. 설명(docstring): "Retrieve the latest agent harness methodologies, benchmarks (SWE-bench, GAIA), testbeds, and eval frameworks."
- 입력: `limit: int = 10`. 범위 검사가 없다 (0 이면 빈 목록, 음수의 SQLite 동작은 확인하지 못했다).
- 처리 규칙:
  1. 새 DB 세션을 열어 `news_items` 에서 `category == "harness"` 인 행을 `hotness_score` 내림차순으로 `limit` 개 읽는다.
  2. 이름에 "latest" 가 있지만 발행일·수집일로 정렬하거나 거르지 않는다. 품질 점수·고신호 여부로도 거르지 않는다.
  3. 각 행을 `{"title", "url", "summary", "hotness"}`(`hotness` = `hotness_score`)로 바꾼다.
- 출력: 위 객체 배열의 JSON 문자열 (`ensure_ascii=False`, `indent=2`). 결과가 없으면 `"[]"`.
- 예외·엣지: DB 오류는 잡지 않고 MCP 도구 오류로 전달된다.
- 관련 코드: `backend/app/mcp/server.py:10-17`

## MCP-03 get_mcp_and_skills_ecosystem
- 진입점: MCP 도구 `get_mcp_and_skills_ecosystem`. 설명: "Retrieve trending Model Context Protocol (MCP) servers, tools, skills, and plugins."
- 입력: `limit: int = 10`. 범위 검사 없음.
- 처리 규칙:
  1. `category == "mcp_plugins_skills"` 인 행을 `hotness_score` 내림차순으로 `limit` 개 읽는다.
  2. 각 행을 `{"title", "url", "summary", "hotness"}` 로 바꾼다.
- 출력: JSON 배열 문자열 (`ensure_ascii=False`, `indent=2`).
- 예외·엣지: MCP-02 와 같다.
- 관련 코드: `backend/app/mcp/server.py:19-26`

## MCP-04 search_agent_news
- 진입점: MCP 도구 `search_agent_news`. 설명: "Search global AI news, agent tech, harness methods, and MCP tools."
- 입력:
  - `query: str` (필수, 기본값 없음).
  - `category: str = "all"`. `"all"` 이 아니면 그 값과 정확히 같은 카테고리만 본다. 사용 가능한 값은 DB 의 카테고리(`harness`, `mcp_plugins_skills`, `agent_tech`, `ai_news`)이며 값 검사는 하지 않는다.
  - `limit: int = 10`. 범위 검사 없음.
- 처리 규칙:
  1. `category != "all"` 이면 `category ==` 조건을 건다.
  2. `query` 가 빈 문자열이 아니면 `%{query}%` 로 `title ILIKE` 또는 `summary ILIKE` 조건을 건다. 형태소 분석·태그·전문 검색·벡터 검색은 하지 않는다. `query` 의 `%`, `_` 는 이스케이프하지 않아 와일드카드로 동작한다.
  3. `query` 가 빈 문자열이면 검색 조건 없이 (카테고리 조건만) 조회한다.
  4. `hotness_score` 내림차순으로 `limit` 개를 읽는다.
  5. 각 행을 `{"title", "url", "category", "summary", "hotness"}` 로 바꾼다.
- 출력: JSON 배열 문자열 (`ensure_ascii=False`, `indent=2`).
- 예외·엣지: 맞는 항목이 없으면 `"[]"`. 잘못된 카테고리도 오류 없이 빈 배열이 된다.
- 관련 코드: `backend/app/mcp/server.py:28-41`

## MCP-05 trigger_agentlens_crawl
- 진입점: MCP 도구 `trigger_agentlens_crawl`. 설명: "Trigger an immediate global crawl across all sources."
- 입력: 없음.
- 처리 규칙:
  1. MCP 서버 프로세스 안에서 `collector_manager.collect_all()` 을 기다린다 (백그라운드로 넘기지 않는다). 수집이 끝날 때까지 도구 호출이 반환되지 않는다.
  2. `collect_all` 은 RSS, HackerNews, GitHub, arXiv, Hugging Face, Reddit 6개 소스를 동시에 수집하고, 소스별로 품질 평가·요약(LLM 호출 포함)을 거쳐 저장하며, 끝에 `crawl_logs` 에 한 줄을 남긴다. 아무것도 모이지 않으면 내장 시드 항목을 넣는다. 세부 규칙은 수집 영역 문서의 대상이다.
  3. 같은 프로세스에서 이미 수집 중이면 바로 `{"status": "already_running", "message": "Collector is currently running"}` 를 돌려준다.
- 출력: `collect_all` 반환값의 JSON 문자열 (`ensure_ascii=False`, `indent=2`).
  - 성공: `{"status": "success", "total_collected", "total_saved", "total_filtered_low_quality", "source_results": {<소스명>: {"count"} 또는 {"error", "count": 0}}}`.
  - 전체 오류: `{"status": "error", "error": "<메시지>"}`.
- 예외·엣지:
  - "수집 중" 플래그(`is_running`)는 프로세스 메모리 값이라, 웹 서버의 스케줄 수집·수동 수집과 MCP 서버의 수집이 동시에 돌 수 있다. 두 프로세스가 같은 SQLite 파일에 동시에 쓴다 (WAL, busy_timeout 30000ms).
  - `.env`/`config.json` 의 LLM 키로 외부 LLM 을 호출하며 비용이 든다. MCP 클라이언트가 도구를 부를 때마다 실행된다.
  - 수집 진행 상황은 MCP 서버 프로세스 메모리에만 있어, 웹 화면의 수집 진행 표시(`GET /api/schedule/progress`)에는 나타나지 않는다.
- 관련 코드: `backend/app/mcp/server.py:43-47`, `backend/app/collectors/manager.py:176-258`, `backend/app/database.py:17-26`

## MCP-06 MCP 정보 API
- 진입점: `GET /api/mcp/info`. 이 API 를 부르는 프론트 코드는 없다.
- 입력: 없음.
- 처리 규칙:
  1. `name` 은 "AgentLens MCP Server", `description` 은 "Model Context Protocol server exposing tools for AI Agent, Harness, and MCP news." 로 고정이다.
  2. `tools` 는 이름과 설명을 코드에 직접 적은 4개 목록이다 (FastMCP 등록 정보를 읽지 않는다): `get_latest_harness_methods` "Retrieve SWE-bench, test harnesses, and eval methods", `get_mcp_and_skills_ecosystem` "Retrieve trending MCP servers, skills, and tools", `search_agent_news` "Search global AI news and agent tech", `trigger_agentlens_crawl` "Trigger an immediate global crawl".
  3. `claude_desktop_config.mcpServers.agentlens` 를 만든다: `command` = 웹 서버를 실행 중인 Python 의 절대 경로(`sys.executable`), `args` = `["-m", "app.mcp.server"]`, `cwd` = 이 파일 기준 두 단계 위(`backend/`)의 절대 경로.
- 출력:
  ```
  {"name", "description", "tools": [{"name", "description"} x4],
   "claude_desktop_config": {"mcpServers": {"agentlens": {"command", "args", "cwd"}}}}
  ```
- 예외·엣지: 경로는 웹 서버가 도는 환경 기준이다. Docker 로 띄우면 컨테이너 안의 Python 경로와 `/app` 이 나오므로 호스트의 MCP 클라이언트 설정에 그대로 쓸 수 없다. 서버 이름이 FastMCP 인스턴스 이름(`AgentLens-MCP-Server`)과 다르다.
- 관련 코드: `backend/app/api/mcp.py:1-27`, `backend/app/api/router.py:17`

## MCP-07 MCP 연동 모달
- 진입점: 헤더 "MCP" 버튼, 명령 팔레트(⌘K) "FastMCP 도구 설정 열기"(부제 "Claude Desktop 및 에이전트 연동 가이드"). 닫기: X, "닫기", Esc.
- 입력: 없음. 서버를 호출하지 않는다.
- 처리 규칙:
  1. 제목 "AgentLens MCP 연동", 부제 "Claude Desktop, Cursor 등에서 하네스 및 MCP 소식을 직접 호출할 수 있습니다."
  2. "제공되는 MCP Tools" 카드 4개: `get_latest_harness_methods`(SWE-bench 및 에이전트 테스트 하네스 소식), `get_mcp_and_skills_ecosystem`(최신 MCP 서버, 스킬 플러그인 생태계), `search_agent_news`(키워드 및 카테고리별 글로벌 AI 소식 검색), `trigger_agentlens_crawl`(전세계 소스 실시간 크롤링 실행).
  3. "Claude Desktop 설정 (`claude_desktop_config.json`)" 영역에 고정 문자열을 보여 준다: `mcpServers.agentlens` = `command: "python"`, `args: ["-m", "app.mcp.server"]`, `cwd: "/path/to/agentlens/backend"`(자리표시자).
  4. "설정 복사" 버튼은 위 문자열을 클립보드에 쓰고 2000ms 동안 "복사됨!" 으로 바꾼다.
- 출력: 모달 화면.
- 예외·엣지: `/api/mcp/info` 의 실제 경로를 쓰지 않으므로 사용자가 `cwd` 와 Python 경로를 직접 고쳐야 한다. `command: "python"` 은 백엔드 의존성이 설치된 가상환경 Python 이 아닐 수 있다.
- 관련 코드: `frontend/src/components/McpModal.tsx:6-85`, `frontend/src/components/Header.tsx:158-164`, `frontend/src/components/CommandPalette.tsx:87-96`, `frontend/src/app/page.tsx:416`

## 상수·설정값
| 이름 | 값 | 위치 | 의미 |
|---|---|---|---|
| FastMCP 서버 이름 | `AgentLens-MCP-Server` | `backend/app/mcp/server.py:8` | MCP 서버 식별명 |
| 실행 모듈 | `app.mcp.server` (`python -m`) | `server.py:49-50`, `backend/app/api/mcp.py:22` | 실행 방법 |
| 전송 방식 | stdio (`mcp.run()` 기본값) | `server.py:50` | 클라이언트 통신 |
| 도구 기본 `limit` | 10 | `server.py:11`, `:20`, `:29` | 조회 도구 결과 수 |
| `search_agent_news` 기본 카테고리 | `"all"` | `server.py:29` | 카테고리 필터 없음 |
| 조회 정렬 | `hotness_score` 내림차순 | `server.py:14`, `:23`, `:38` | 모든 조회 도구 |
| JSON 직렬화 | `ensure_ascii=False`, `indent=2` | `server.py:17`, `:26`, `:41`, `:47` | 반환 문자열 형식 |
| 정보 API 서버 이름 | `AgentLens MCP Server` | `backend/app/api/mcp.py:10` | `/api/mcp/info` 의 `name` |
| 설정 예시 `cwd` (API) | `backend/` 절대 경로 | `backend/app/api/mcp.py:23` | 실행 중인 서버 기준 |
| 설정 예시 (모달) | `command: "python"`, `cwd: "/path/to/agentlens/backend"` | `frontend/src/components/McpModal.tsx:8-16` | 고정 자리표시자 |
| DB 기본 URL | `sqlite+aiosqlite:///./agentlens.db` | `backend/app/config.py:42`, `config.json:8` | cwd 기준 상대 경로 |
| 복사 표시 시간 | 2000ms | `McpModal.tsx:65` | "복사됨!" 유지 |

## 알려진 불일치·위험
- 설정 예시 불일치: 모달은 `python` 과 자리표시자 경로를 보여 주고, `/api/mcp/info` 는 실제 경로를 계산하지만 화면에서 쓰지 않는다. 근거: `frontend/src/components/McpModal.tsx:8-16`, `backend/app/api/mcp.py:6-27`.
- 도구 설명 세 벌: FastMCP docstring, `/api/mcp/info` 의 하드코딩 목록, 모달의 한국어 설명이 따로 관리된다. 도구를 바꾸면 세 곳을 함께 고쳐야 한다. 근거: `backend/app/mcp/server.py:12`, `:21`, `:30`, `:45`, `backend/app/api/mcp.py:12-17`, `McpModal.tsx:41-58`.
- DB 경로 의존: `./agentlens.db` 가 cwd 기준이라 MCP 서버(cwd `backend/`)와 웹 서버의 cwd 가 다르면 서로 다른 DB 를 본다. 현재 루트와 `backend/` 에 `agentlens.db` 가 각각 있다. Docker 의 웹 서버는 volume 의 `/app/data/agentlens.db` 를 쓰므로 호스트에서 띄운 MCP 서버와 데이터를 공유하지 않는다. 근거: `backend/app/config.py:42`, `docker-compose.yml:21`, `:37`.
- 스키마 보장 없음: MCP 서버는 `ensure_db_schema()` 를 부르지 않아, 웹 서버를 한 번도 띄우지 않은 DB 에서는 도구가 실패한다. 근거: `backend/app/mcp/server.py`(호출 없음), `backend/app/main.py:15`.
- 수집 중복 실행: `trigger_agentlens_crawl` 의 중복 방지 플래그가 프로세스별이라 웹 서버 수집과 겹칠 수 있고, 호출마다 LLM 비용이 든다. 인증이 없어 MCP 클라이언트(또는 그 안의 에이전트)가 제한 없이 부를 수 있다. 근거: `backend/app/collectors/manager.py:177-180`, `server.py:43-47`.
- 이름과 동작 차이: `get_latest_harness_methods` 는 최신순이 아니라 hotness 순이다. `search_agent_news` 의 `query` 는 필수 인자지만 빈 문자열이면 검색 조건 없이 동작하고, LIKE 와일드카드를 이스케이프하지 않는다. 근거: `server.py:14`, `:35-37`.
- 입력 검증 없음: `limit` 상한이 없어 큰 값을 주면 해당 카테고리 전체를 한 번에 직렬화한다. `category` 값도 검사하지 않는다. 근거: `server.py:11-41`.
- 예외 처리 없음: 도구 함수 안에 try/except 가 없어 DB·수집 예외는 MCP 도구 오류로 그대로 전달된다. 근거: `server.py:10-47`.
