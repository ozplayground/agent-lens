# 제품 개요: AgentLens

Updated: 2026-11-02
갱신: 기능 intent 가 accepted 되면 `/write-spec` 이 이 문서에 반영한다. 사람이 직접 고쳐도 된다.

이 문서의 첫 내용은 현재 코드(브랜치 `chore/sdlc-harness`)만 보고 썼다. 예전 PRD·FSD 는 쓰지 않았다.

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
  - 분류·요약: 카테고리 4개(harness, mcp_plugins_skills, agent_tech, ai_news)로 나누고 LLM 으로 요약·품질 점수·핵심 요약을 만든다 (`backend/app/collectors/categorizer.py`, `backend/app/services/llm_processor.py`)
  - 뉴스 피드: 카테고리·소스 필터, 검색, 북마크(브라우저 localStorage), 상세 보기, 기사 단위 AI 질문(스트리밍 포함), RSS 출력 `GET /api/news/feed/rss.xml`
  - AI 챗: 세션 저장·삭제, SSE 스트리밍 답변, 인용 출처, 모델 선택, 단일 기사 범위 질문 (`backend/app/api/chat.py`, `frontend/src/components/chat/`)
  - 일일 브리핑: 생성, Notion 내보내기, 이메일 발송, 웹훅 발송. 자동 발송은 매일 0:15 UTC
  - 트렌드 레이더: `GET /api/trends/radar`, `frontend/src/components/TechRadar.tsx`
  - 소스 관리와 딥 리서치: `sources.json` 의 RSS·GitHub 소스 추가·끄기·삭제, 새 소스 후보 발굴(매일 3, 15시 UTC 자동 실행)
  - MCP 서버: 도구 `get_latest_harness_methods`, `get_mcp_and_skills_ecosystem`, `search_agent_news`, `trigger_agentlens_crawl`
  - UI: 테마(light, dark, system), 단축키, 커맨드 팔레트
- 하지 않는다: 명시적으로 정한 것은 없다. 코드에 없는 것은 사용자 인증·계정, 원격 프로덕션 배포(로컬 Docker Compose 만 있음)다.

## 제품 원칙과 제약
- 아직 정하지 않았다. 정해지면 intent 를 거쳐 `/write-spec` 이 여기에 적는다.

## 기능 목록
| 기능 id | 한 줄 설명 | intent |
|---|---|---|

## 근거
- 제품 조사: `docs/research/product.md` (없으면 아직 조사하지 않음)
