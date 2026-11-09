# 기능명세 색인: AgentLens

Updated: 2026-11-06

지금 코드가 하는 일을 기능 단위로 적은 문서다. 요구사항 문서가 없어서 코드에서 거꾸로 만들었다. 각 문서의 '알려진 불일치·위험' 절에 코드에서 찾은 문제를 근거 위치와 함께 적었다. 여러 영역에 걸친 문제는 `../known-issues.md` 에 모았다.

| 문서 | ID 접두사 | 기능 수 | 다루는 것 |
|---|---|---|---|
| [01-news-feed.md](01-news-feed.md) | NEWS | 19 | 피드 목록·필터·검색·정렬, 북마크, 카드, 상세 대화상자, 기사 단위 AI 질문, RSS, 트렌드 레이더, 통계, 피드 단축키, 삭제·초기화, 요약 바 브리핑, 챗 핸드오버 |
| [02-ai-chat.md](02-ai-chat.md) | CHAT | 25 | 세션 관리, 입력·SSE 스트리밍, ReAct 검색 계획, RAG 검색, 단일 기사 모드, 인용, 모델 선택, 포커스 필터, 핸드오버, 내보내기, 오류·중단, 프로바이더 폴백, 폭별 화면 |
| [03-collection.md](03-collection.md) | COLL | 24 | 수집기 6종, 관련성·품질 게이트, 분류·태그, hotness, 요약 합성, 중복 제거·저장, 크롤 로그, 스케줄·수동 트리거·초기화, LLM 프로바이더 선택, 스크래퍼 |
| [04-briefing-and-sharing.md](04-briefing-and-sharing.md) | BRF | 13 | 일일 브리핑 생성·요약 바·대화상자, Notion, 이메일(SMTP), Slack/Discord 웹훅, 연동 설정, 자동 발송 |
| [05-sources-and-research.md](05-sources-and-research.md) | SRC | 14 | sources.json, 소스 목록·추가·켜기/끄기·삭제, URL 검사, 자율 딥 리서치와 판정 규칙, 감사 일지 |
| [06-mcp-server.md](06-mcp-server.md) | MCP | 7 | stdio MCP 서버와 도구 4개, MCP 정보 API, 연동 대화상자 |
| [07-ui-common.md](07-ui-common.md) | UI | 14 | 헤더, 수집 진행 바, 테마, 단축키, 피드 키보드 탐색, 커맨드 팔레트, 모달 규칙, 반응형, 모바일 뷰포트, 로딩·오류·빈 상태, 마크다운, 복사, 접근성 |

## 함께 보는 문서
| 문서 | 내용 |
|---|---|
| [../product.md](../product.md) | 제품 개요, 범위, 기능 목록 |
| [../tech-spec.md](../tech-spec.md) | 시스템 구성, 앱 사이 인터페이스, 공통 규칙 |
| [../ui-spec.md](../ui-spec.md) | 화면 명세: 라우트, 영역 구성, 모달 목록, 컴포넌트 트리, 상태·localStorage, 프론트 API 호출 |
| [../design-system.md](../design-system.md) | 디자인 토큰, 공통 부품, 오버레이·단축키 규칙, 하지 말 것, 검사 방법 |
| [../api.md](../api.md) | REST API 명세 (엔드포인트 44개, SSE, 스키마 사전, 계약 대조) |
| [../data-model.md](../data-model.md) | DB 테이블·ERD, FTS5, config.json·sources.json 구조, 데이터 생명주기 |
| [../operations.md](../operations.md) | 실행·Docker·환경 변수·스케줄·외부 의존·파괴적 작업·문제 해결 |
| [../test-strategy.md](../test-strategy.md) | 검사 명령, 테스트 종류, 통과 기준 |
| [../test-cases.md](../test-cases.md) | 테스트 목록, 영역별 커버리지, 외부 호출 판정 |
| [../known-issues.md](../known-issues.md) | 영역을 넘나드는 알려진 문제 모음 |
