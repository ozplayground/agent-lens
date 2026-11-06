# 제품 개요: AgentLens

Updated: 2026-11-06

## 한 줄 설명
AI 에이전트·하네스·MCP 기술 소식을 모아 요약하고, AI 챗 질의응답·일일 브리핑·외부 채널 공유·MCP 서버를 제공한다. 누구를 위한 제품인지는 아직 문서로 정하지 않았다.

## 사용자
코드에서 확인한 접점만 적는다. 사용자 유형별 문제는 아직 정하지 않았다.
- 웹 UI 사용자: 뉴스 피드(`/`)와 AI 챗(`/chat`)을 쓴다 (`frontend/src/app/`)
- MCP 클라이언트: stdio 로 `python -m app.mcp.server` 를 띄워 도구 4개를 부른다 (`backend/app/mcp/server.py`, 설정 예시는 `GET /api/mcp/info`)
- 브리핑 수신자: Notion 페이지, 이메일(SMTP), Slack/Discord 웹훅으로 일일 브리핑을 받는다 (`backend/app/services/`)

## 범위
- 한다 (코드에 있는 것):
  - 수집: arXiv, GitHub, HackerNews, HuggingFace, Reddit, RSS 에서 소식을 모은다 (`backend/app/collectors/sources/`). 스케줄은 매일 0, 6, 12, 18시 UTC (`backend/app/scheduler.py`). 수동 실행 `POST /api/schedule/trigger`, `make collect`
  - 분류·요약: 카테고리 4개(harness, mcp_plugins_skills, agent_tech, ai_news)로 나눈다. 관련성·품질 점수는 LLM 평가가 되면 LLM 으로, 안 되면 휴리스틱으로 매긴다. 3줄 요약·시사점·기술 스택은 규칙으로 만든다 (`backend/app/collectors/categorizer.py`, `backend/app/services/llm_processor.py`)
  - 뉴스 피드: 카테고리·소스 필터, 검색, 북마크(브라우저 localStorage), 상세 보기, 기사 단위 AI 질문(스트리밍 포함), RSS 출력 `GET /api/news/feed/rss.xml`
  - AI 챗: 세션 저장·삭제, SSE 스트리밍 답변, 인용 출처, 모델 선택, 단일 기사 범위 질문 (`backend/app/api/chat.py`, `frontend/src/components/chat/`)
  - 일일 브리핑: 생성, Notion 내보내기, 이메일 발송, 웹훅 발송. 자동 발송은 매일 0:15 UTC
  - 트렌드 레이더: `GET /api/trends/radar`, `frontend/src/components/TechRadar.tsx`
  - 소스 관리와 딥 리서치: `sources.json` 의 RSS·GitHub 소스 추가·끄기·삭제, 새 소스 후보 발굴(매일 3, 15시 UTC 자동 실행)
  - MCP 서버: 도구 `get_latest_harness_methods`, `get_mcp_and_skills_ecosystem`, `search_agent_news`, `trigger_agentlens_crawl`
  - UI: 테마(light, dark, system), 단축키, 커맨드 팔레트
- 하지 않는다: 명시적으로 정한 것은 없다. 코드에 없는 것은 사용자 인증·계정, 원격 프로덕션 배포(로컬 Docker Compose 만 있음)다.

## 제품 원칙과 제약
- 아직 정하지 않았다.

## 기능 목록
기능별 상세 동작은 [기능명세 색인](functional-spec/README.md) 에 있다. 아래 영역은 지금 코드에 있는 기능 묶음이다.

| 기능 id | 한 줄 설명 |
|---|---|
| news-feed | 뉴스 피드: 필터·검색·정렬, 북마크, 상세, 기사 단위 AI 질문, RSS, 트렌드 레이더 ([NEWS](functional-spec/01-news-feed.md)) |
| ai-chat | AI 챗: 세션, SSE 스트리밍, RAG·ReAct 검색, 인용, 모델 선택, 포커스 필터, 핸드오버 ([CHAT](functional-spec/02-ai-chat.md)) |
| collection | 수집·분류·요약 파이프라인과 스케줄 ([COLL](functional-spec/03-collection.md)) |
| briefing-sharing | 일일 브리핑과 Notion·이메일·웹훅 공유 ([BRF](functional-spec/04-briefing-and-sharing.md)) |
| sources-research | 수집 소스 관리와 자율 딥 리서치 ([SRC](functional-spec/05-sources-and-research.md)) |
| mcp-server | 외부 MCP 클라이언트용 도구 4개 ([MCP](functional-spec/06-mcp-server.md)) |
| ui-common | 헤더, 테마, 단축키, 커맨드 팔레트, 반응형, 공통 상태 표시 ([UI](functional-spec/07-ui-common.md)) |

## 근거
- 아직 없다.
