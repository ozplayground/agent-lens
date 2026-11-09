# AgentLens 전체 기능정의서 인덱스 (Functional Specification Index)

Updated: 2026-11-10
기준: v0.4.1 (main)

- **작성일자**: 2026-11-09
- **작성자**: 기획 명세 작성가 (`spec-writer`)
- **문서 버전**: v1.0 (as-built. v0.3.1 인덱스를 대체한다)
- **상태**: Draft
- **선행 산출물**: PRD `docs/spec-writer/01_PRD.md`
- **함께 보는 문서**: 전역 정책 `docs/spec-writer/03_POLICIES_AND_EDGES.md`

지금 코드가 하는 일을 기능 단위로 적은 문서의 색인이다. 요구사항 문서가 없어서 코드에서 거꾸로 만들었고(2026-11-06 역분석, 2026-11-09 재작성), 요구사항 ID 는 PRD 가 이 기능들을 묶어 새로 정했다. 각 도메인 FSD 의 '알려진 불일치·위험' 절에 코드에서 찾은 문제를 근거 위치와 함께 적었다. 여러 도메인에 걸친 문제와 정책은 `docs/spec-writer/03_POLICIES_AND_EDGES.md` 에 모았다.

---

## 0. 도메인 FSD 요약

| 문서 | ID 접두사 | 단위 기능 수 | Must / Should / Could / Won't | 다루는 것 |
|---|---|---|---|---|
| [fsd/01_NEWS_FEED_SPECIFICATION.md](./fsd/01_NEWS_FEED_SPECIFICATION.md) | NEWS | 19 | 9 / 7 / 3 / 0 | 피드 목록·필터·검색·정렬, 북마크, 카드, 상세 대화상자, 기사 단위 AI 질문, RSS, 트렌드 레이더, 통계, 피드 단축키, 삭제·초기화, 요약 바 브리핑, 챗 핸드오버 |
| [fsd/02_AI_CHAT_SPECIFICATION.md](./fsd/02_AI_CHAT_SPECIFICATION.md) | CHAT | 25 | 11 / 12 / 1 / 1 | 세션 관리, 입력·SSE 스트리밍, ReAct 검색 계획, RAG 검색, 단일 기사 모드, 인용, 모델 선택, 포커스 필터, 핸드오버, 내보내기, 오류·중단, 공급자 폴백, 폭별 화면 |
| [fsd/03_COLLECTION_SPECIFICATION.md](./fsd/03_COLLECTION_SPECIFICATION.md) | COLL | 25 | 18 / 7 / 0 / 0 | 수집기 6종, 관련성·품질 게이트, 분류·태그, hotness, 요약 합성, 중복 제거·저장, 크롤 로그, 스케줄·수동 트리거·초기화, `make collect`, LLM 공급자 선택, 스크래퍼 |
| [fsd/04_BRIEFING_AND_SHARING_SPECIFICATION.md](./fsd/04_BRIEFING_AND_SHARING_SPECIFICATION.md) | BRF | 13 | 6 / 6 / 0 / 1 | 일일 브리핑 생성·요약 바·대화상자, Notion, 이메일(SMTP), Slack/Discord 웹훅, 연동 설정, 자동 발송 |
| [fsd/05_SOURCES_AND_RESEARCH_SPECIFICATION.md](./fsd/05_SOURCES_AND_RESEARCH_SPECIFICATION.md) | SRC | 14 | 6 / 5 / 3 / 0 | `sources.json`, 소스 목록·추가·켜기/끄기·삭제, URL 검사, 자율 딥 리서치와 판정 규칙, 감사 일지 |
| [fsd/06_MCP_SERVER_SPECIFICATION.md](./fsd/06_MCP_SERVER_SPECIFICATION.md) | MCP | 7 | 4 / 2 / 1 / 0 | stdio MCP 서버와 도구 4개, MCP 정보 API, 연동 대화상자 |
| [fsd/07_UI_COMMON_SPECIFICATION.md](./fsd/07_UI_COMMON_SPECIFICATION.md) | UI | 14 | 6 / 8 / 0 / 0 | 헤더, 수집 진행 줄, 테마, 단축키, 피드 키보드 탐색, 커맨드 팔레트, 모달 규칙, 반응형, 모바일 뷰포트, 로딩·오류·빈 상태, 마크다운, 복사, 접근성. 라우트·대화상자 목록·화면 상태·localStorage |
| **합계** | | **117** | **60 / 47 / 8 / 2** | |

- v0.4.1 리뷰 수정은 단위 기능의 수·ID·우선순위·화면 코드를 바꾸지 않았다. 바뀐 동작은 FUNC-NEWS-005·010, FUNC-CHAT-002·006·008·009·015·019·020·021·022, FUNC-COLL-023, FUNC-SRC-006·007·011·012, FUNC-UI-014(접근 이름) 에 반영했다. 해결된 문제 목록은 `docs/spec-writer/03_POLICIES_AND_EDGES.md` 4.8절.
- 옛 색인(`docs/functional-spec/README.md`)은 COLL 을 24개로 적었다. 이번 재작성에서 `make collect`(CLI)를 옛 COLL-01 에서 떼어 `FUNC-COLL-002` 로 세웠으므로 25개다.
- 우선순위는 as-built 역할로 spec-writer 가 분류한 값이다 (PRD 열린 질문 Q2). 같은 기능을 두 FSD 가 함께 적은 곳은 우선순위를 맞췄다: `FUNC-NEWS-018` ↔ `FUNC-BRF-002`(Must), `FUNC-NEWS-019` ↔ `FUNC-CHAT-018`(Must).

---

## 1. 기능 계층 구조도 (Feature Hierarchy Tree)

```
[AgentLens]
  ├── [1Depth: 뉴스 피드 (NEWS)]
  │     ├── [2Depth: 피드 화면 SCR-NEWS-001]
  │     │     ├── [3Depth: 피드 목록 조회·페이지네이션] (FUNC-NEWS-001)
  │     │     ├── [3Depth: 카테고리 필터] (FUNC-NEWS-002)
  │     │     ├── [3Depth: 소스 필터] (FUNC-NEWS-003)
  │     │     ├── [3Depth: Must-Read 필터] (FUNC-NEWS-004)
  │     │     ├── [3Depth: 키워드 검색] (FUNC-NEWS-005)
  │     │     ├── [3Depth: 정렬] (FUNC-NEWS-006)
  │     │     ├── [3Depth: 북마크] (FUNC-NEWS-007)
  │     │     ├── [3Depth: 기사 카드] (FUNC-NEWS-008)
  │     │     ├── [3Depth: 통계] (FUNC-NEWS-015)
  │     │     ├── [3Depth: 피드 키보드 단축키] (FUNC-NEWS-016)
  │     │     ├── [3Depth: 일일 브리핑 바로가기] (FUNC-NEWS-018)
  │     │     └── [3Depth: AI 챗 핸드오버] (FUNC-NEWS-019)
  │     ├── [2Depth: 트렌드 레이더 SCR-NEWS-003]
  │     │     └── [3Depth: 트렌드 레이더] (FUNC-NEWS-014)
  │     ├── [2Depth: 기사 상세 SCR-NEWS-002]
  │     │     ├── [3Depth: 기사 상세 대화상자] (FUNC-NEWS-009)
  │     │     └── [3Depth: 기사 단위 AI 질문 (스트리밍)] (FUNC-NEWS-010)
  │     ├── [2Depth: 데이터 관리 SCR-COLL-003]
  │     │     └── [3Depth: 데이터 전체 삭제·초기화] (FUNC-NEWS-017)
  │     └── [2Depth: API 전용 (화면 없음)]
  │           ├── [3Depth: 기사 단위 AI 질문 (일괄 응답)] (FUNC-NEWS-011)
  │           ├── [3Depth: 기사 단건 조회] (FUNC-NEWS-012)
  │           └── [3Depth: RSS 출력] (FUNC-NEWS-013)
  │
  ├── [1Depth: AI 챗 (CHAT)]
  │     ├── [2Depth: 대화 세션 SCR-CHAT-002]
  │     │     ├── [3Depth: 세션 목록 조회·검색] (FUNC-CHAT-001)
  │     │     ├── [3Depth: 새 대화] (FUNC-CHAT-002)
  │     │     ├── [3Depth: 세션 선택·복원] (FUNC-CHAT-003)
  │     │     ├── [3Depth: 세션 제목(이름)] (FUNC-CHAT-004)
  │     │     ├── [3Depth: 세션 삭제] (FUNC-CHAT-005)
  │     │     ├── [3Depth: 세션 저장·동기화] (FUNC-CHAT-006)
  │     │     └── [3Depth: 히스토리 사이드바·드로어] (FUNC-CHAT-007)
  │     ├── [2Depth: 질의응답 SCR-CHAT-001]
  │     │     ├── [3Depth: 메시지 입력·전송] (FUNC-CHAT-008)
  │     │     ├── [3Depth: SSE 스트리밍 수신] (FUNC-CHAT-009)
  │     │     ├── [3Depth: ReAct 검색 계획 (global)] (FUNC-CHAT-010)
  │     │     ├── [3Depth: 워크플로 단계 표시] (FUNC-CHAT-011)
  │     │     ├── [3Depth: RAG 코퍼스 검색] (FUNC-CHAT-012)
  │     │     ├── [3Depth: 단일 기사(scoped) 질의] (FUNC-CHAT-013)
  │     │     └── [3Depth: 인용 출처] (FUNC-CHAT-014)
  │     ├── [2Depth: 모델·공급자 SCR-CHAT-004, 백엔드]
  │     │     ├── [3Depth: 모델 선택] (FUNC-CHAT-015)
  │     │     ├── [3Depth: 토큰 한도·출력 완료] (FUNC-CHAT-021)
  │     │     └── [3Depth: LLM 공급자 선택 순서·가용성 판정·폴백] (FUNC-CHAT-022)
  │     ├── [2Depth: 검색 범위 SCR-CHAT-001, SCR-CHAT-005]
  │     │     ├── [3Depth: 포커스 필터] (FUNC-CHAT-016)
  │     │     ├── [3Depth: 스코프 전환·기사 칩] (FUNC-CHAT-017)
  │     │     └── [3Depth: 핸드오버 (뉴스 기사 → 챗)] (FUNC-CHAT-018)
  │     ├── [2Depth: 답변 활용·복구]
  │     │     ├── [3Depth: 내보내기] (FUNC-CHAT-019)
  │     │     └── [3Depth: 오류·중단·재시도] (FUNC-CHAT-020)
  │     ├── [2Depth: API·미연결 코드]
  │     │     ├── [3Depth: 동기 단건 질의 API] (FUNC-CHAT-023)
  │     │     └── [3Depth: 보충 웹 검색 엔진 (미연결)] (FUNC-CHAT-024)
  │     └── [2Depth: 화면 공통]
  │           └── [3Depth: 반응형·모바일] (FUNC-CHAT-025)
  │
  ├── [1Depth: 수집·분류·요약 (COLL)]
  │     ├── [2Depth: 수집 실행 (화면 없음)]
  │     │     ├── [3Depth: 수집 실행 오케스트레이션] (FUNC-COLL-001)
  │     │     ├── [3Depth: make collect (CLI)] (FUNC-COLL-002)
  │     │     └── [3Depth: 소스 설정 로딩] (FUNC-COLL-003)
  │     ├── [2Depth: 소스 수집기 (화면 없음)]
  │     │     ├── [3Depth: RSS 수집기] (FUNC-COLL-004)
  │     │     ├── [3Depth: HackerNews 수집기] (FUNC-COLL-005)
  │     │     ├── [3Depth: GitHub 수집기] (FUNC-COLL-006)
  │     │     ├── [3Depth: arXiv 수집기] (FUNC-COLL-007)
  │     │     ├── [3Depth: Hugging Face 수집기] (FUNC-COLL-008)
  │     │     └── [3Depth: Reddit 수집기] (FUNC-COLL-009)
  │     ├── [2Depth: 평가·분류·저장 (화면 없음)]
  │     │     ├── [3Depth: 관련성·품질 게이트] (FUNC-COLL-010)
  │     │     ├── [3Depth: 휴리스틱 품질 점수] (FUNC-COLL-011)
  │     │     ├── [3Depth: AI 도메인 판정·카테고리 분류·태그] (FUNC-COLL-012)
  │     │     ├── [3Depth: 인기도(hotness) 점수] (FUNC-COLL-013)
  │     │     ├── [3Depth: 핵심 요약·시사점·기술 스택 합성] (FUNC-COLL-014)
  │     │     ├── [3Depth: 중복 제거·저장·갱신] (FUNC-COLL-015)
  │     │     └── [3Depth: 시드 데이터] (FUNC-COLL-016)
  │     ├── [2Depth: 수집 상태와 트리거 SCR-UI-001, SCR-COLL-002, SCR-COLL-003]
  │     │     ├── [3Depth: 진행 상태·크롤 로그·스케줄 상태] (FUNC-COLL-017)
  │     │     ├── [3Depth: 정기 스케줄] (FUNC-COLL-018)
  │     │     ├── [3Depth: 수동 트리거 (즉시 수집)] (FUNC-COLL-019)
  │     │     ├── [3Depth: 초기화 후 재수집 (make reset 포함)] (FUNC-COLL-020)
  │     │     ├── [3Depth: 시작 시 초기 수집] (FUNC-COLL-021)
  │     │     └── [3Depth: MCP 수집 트리거] (FUNC-COLL-022)
  │     └── [2Depth: LLM·보조 모듈 (화면 없음)]
  │           ├── [3Depth: LLM 프로바이더 선택·폴백] (FUNC-COLL-023)
  │           ├── [3Depth: 테스트 환경 판정] (FUNC-COLL-024)
  │           └── [3Depth: 기사 본문 스크래퍼] (FUNC-COLL-025)
  │
  ├── [1Depth: 브리핑·공유 (BRF)]
  │     ├── [2Depth: 브리핑 엔진 (서버)]
  │     │     └── [3Depth: 브리핑 생성] (FUNC-BRF-001)
  │     ├── [2Depth: 메인 요약 바 SCR-BRF-001]
  │     │     └── [3Depth: 브리핑 바로가기] (FUNC-BRF-002)
  │     ├── [2Depth: 브리핑 대화상자 SCR-BRF-002]
  │     │     ├── [3Depth: 브리핑 대화상자] (FUNC-BRF-003)
  │     │     ├── [3Depth: Notion 발행 (수동)] (FUNC-BRF-004)
  │     │     └── [3Depth: 이메일 발송 (수동)] (FUNC-BRF-006)
  │     ├── [2Depth: 공유 & 알림 설정 대화상자 SCR-BRF-003]
  │     │     ├── [3Depth: Notion 연결 테스트] (FUNC-BRF-005)
  │     │     ├── [3Depth: SMTP 연결 테스트] (FUNC-BRF-007)
  │     │     ├── [3Depth: 웹훅 테스트 전송] (FUNC-BRF-009)
  │     │     └── [3Depth: 연동 설정 조회·저장] (FUNC-BRF-011)
  │     ├── [2Depth: 외부 채널 발송 (서버)]
  │     │     ├── [3Depth: 이메일 템플릿] (FUNC-BRF-008)
  │     │     └── [3Depth: 웹훅 브리핑 발송] (FUNC-BRF-010)
  │     ├── [2Depth: 스케줄러 (서버)]
  │     │     └── [3Depth: 자동 발송 스케줄] (FUNC-BRF-013)
  │     └── [2Depth: 미사용 컴포넌트 SCR-BRF-004]
  │           └── [3Depth: 웹훅 설정 모달 (미사용)] (FUNC-BRF-012)
  │
  ├── [1Depth: 소스·딥 리서치 (SRC)]
  │     ├── [2Depth: 소스 설정 파일 (화면 없음)]
  │     │     └── [3Depth: sources.json 구조와 저장] (FUNC-SRC-001)
  │     ├── [2Depth: 소스 & 리서처 대화상자 SCR-SRC-001]
  │     │     └── [3Depth: 소스 관리 대화상자] (FUNC-SRC-002)
  │     ├── [2Depth: 등록된 수집원 탭 SCR-SRC-003, 삭제 확인 창 SCR-SRC-004]
  │     │     ├── [3Depth: 소스 목록 조회] (FUNC-SRC-003)
  │     │     ├── [3Depth: RSS 피드 추가] (FUNC-SRC-004)
  │     │     ├── [3Depth: GitHub 저장소 추가 (API 전용)] (FUNC-SRC-005)
  │     │     ├── [3Depth: 소스 켜기/끄기] (FUNC-SRC-006)
  │     │     └── [3Depth: 소스 삭제] (FUNC-SRC-007)
  │     └── [2Depth: AI 딥 리서처 탭 SCR-SRC-002]
  │           ├── [3Depth: 단일 URL 검사] (FUNC-SRC-008)
  │           ├── [3Depth: 카탈로그 후보 탐색 (API 전용)] (FUNC-SRC-009)
  │           ├── [3Depth: 후보 등록 (API 전용)] (FUNC-SRC-010)
  │           ├── [3Depth: 자율 딥 리서치 실행] (FUNC-SRC-011)
  │           ├── [3Depth: 후보 평가·판정 규칙 (내부 모듈)] (FUNC-SRC-012)
  │           ├── [3Depth: 딥 리서치 상태 조회] (FUNC-SRC-013)
  │           └── [3Depth: 감사 일지] (FUNC-SRC-014)
  │
  ├── [1Depth: MCP 서버 (MCP)]
  │     ├── [2Depth: MCP 서버 프로세스 (stdio, 화면 없음)]
  │     │     ├── [3Depth: MCP 서버 실행] (FUNC-MCP-001)
  │     │     ├── [3Depth: 도구 get_latest_harness_methods] (FUNC-MCP-002)
  │     │     ├── [3Depth: 도구 get_mcp_and_skills_ecosystem] (FUNC-MCP-003)
  │     │     ├── [3Depth: 도구 search_agent_news] (FUNC-MCP-004)
  │     │     └── [3Depth: 도구 trigger_agentlens_crawl] (FUNC-MCP-005)
  │     ├── [2Depth: 웹 API (화면 없음)]
  │     │     └── [3Depth: MCP 정보 API GET /api/mcp/info] (FUNC-MCP-006)
  │     └── [2Depth: MCP 연동 대화상자 SCR-MCP-001]
  │           └── [3Depth: MCP 연동 대화상자] (FUNC-MCP-007)
  │
  └── [1Depth: UI 공통 (UI)]
        ├── [2Depth: 헤더 SCR-UI-001]
        │     ├── [3Depth: 피드 헤더] (FUNC-UI-001)
        │     └── [3Depth: 수집 진행 줄과 초기화 확인 창] (FUNC-UI-002)
        ├── [2Depth: 테마 SCR-UI-000, SCR-UI-003]
        │     ├── [3Depth: 테마 시스템] (FUNC-UI-003)
        │     └── [3Depth: 테마 선택 메뉴] (FUNC-UI-004)
        ├── [2Depth: 키보드 SCR-UI-000]
        │     ├── [3Depth: 전역 단축키] (FUNC-UI-005)
        │     └── [3Depth: 피드 키보드 탐색] (FUNC-UI-006)
        ├── [2Depth: 팔레트 SCR-UI-002]
        │     └── [3Depth: 커맨드 팔레트] (FUNC-UI-007)
        ├── [2Depth: 오버레이 SCR-UI-004]
        │     └── [3Depth: 대화상자·오버레이 공통 규칙] (FUNC-UI-008)
        ├── [2Depth: 배치 SCR-UI-000]
        │     ├── [3Depth: 반응형 레이아웃] (FUNC-UI-009)
        │     └── [3Depth: 모바일 뷰포트·가상 키보드 대응] (FUNC-UI-010)
        └── [2Depth: 표시 SCR-UI-000]
              ├── [3Depth: 로딩·오류·빈 상태 표시] (FUNC-UI-011)
              ├── [3Depth: 마크다운 렌더링] (FUNC-UI-012)
              ├── [3Depth: 복사 피드백] (FUNC-UI-013)
              └── [3Depth: 접근성 속성] (FUNC-UI-014)
```

같은 사용자 동작을 두 도메인이 각자 관점에서 적은 단위 기능이 있다. 각 FSD 는 자기 관점의 사실을 적고 서로를 가리킨다.

| 동작 | 단위 기능 (관점) |
|---|---|
| 초기화 & 재수집 | FUNC-NEWS-017 (피드 후속 동작, 기사 전체 삭제 API), FUNC-COLL-020 (서버 처리, `make reset`), FUNC-UI-002 (확인 창·진행 줄) |
| 즉시 수집·진행 표시 | FUNC-COLL-019 (서버·폴링), FUNC-UI-002 (진행 줄 공유 저장소) |
| 브리핑 바로가기 | FUNC-NEWS-018 (요약 바 안의 배치·갱신), FUNC-BRF-002 (브리핑 값 표시) |
| 챗 핸드오버 | FUNC-NEWS-019 (피드 쪽 진입점), FUNC-CHAT-018 (챗 쪽 URL 처리) |
| 피드 키보드 | FUNC-NEWS-016 (키별 동작), FUNC-UI-005 (전역 판정 순서), FUNC-UI-006 (포커스 이동) |
| LLM 공급자 선택 | FUNC-COLL-023 (모듈 전체·수집 게이트), FUNC-CHAT-022 (챗 스트림·사전 검사) |
| MCP 수집 | FUNC-MCP-005 (도구 입출력), FUNC-COLL-022 (수집 실행·상태 분리) |
| 소스 설정 읽기 | FUNC-SRC-001 (파일 구조·저장의 정본), FUNC-COLL-003 (수집기가 읽는 방식) |

---

## 2. 전체 단위 기능 목록 요약 (Function Index)

모든 단위 기능은 도메인별 상세기능정의서(`docs/spec-writer/fsd/*.md`)에 7대 상세 명세(기본 정보, 사전 조건, 흐름과 `flowchart TD`, UI 데이터 항목 8대 컬럼 표, 비즈니스 규칙, 예외·엣지 케이스, 에러 코드 매핑)가 있다. '대상 화면 코드' 의 `없음` 은 화면이 없는 서버·모듈·API 기능이다.

### 2.1 뉴스 피드 (NEWS)

| 기능 ID | 1Depth (도메인) | 2Depth (화면/모듈) | 3Depth (단위기능명) | 우선순위 | 화면 코드 | 대응 요구사항 ID | 상세 명세 문서 링크 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| `FUNC-NEWS-001` | 뉴스 피드 | 피드 화면 | 피드 목록 조회·페이지네이션 | Must | SCR-NEWS-001 | `REQ-NEWS-001` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-NEWS-002` | 뉴스 피드 | 피드 화면 | 카테고리 필터 | Must | SCR-NEWS-001 | `REQ-NEWS-001` | 같음 |
| `FUNC-NEWS-003` | 뉴스 피드 | 피드 화면 | 소스 필터 | Should | SCR-NEWS-001 | `REQ-NEWS-002` | 같음 |
| `FUNC-NEWS-004` | 뉴스 피드 | 피드 화면 | Must-Read 필터 | Should | SCR-NEWS-001 | `REQ-NEWS-002` | 같음 |
| `FUNC-NEWS-005` | 뉴스 피드 | 피드 화면 | 키워드 검색 | Must | SCR-NEWS-001 | `REQ-NEWS-001` | 같음 |
| `FUNC-NEWS-006` | 뉴스 피드 | 피드 화면 | 정렬 | Must | SCR-NEWS-001 | `REQ-NEWS-001` | 같음 |
| `FUNC-NEWS-007` | 뉴스 피드 | 피드 화면 | 북마크 | Should | SCR-NEWS-001, SCR-NEWS-002 | `REQ-NEWS-005` | 같음 |
| `FUNC-NEWS-008` | 뉴스 피드 | 피드 화면 | 기사 카드 | Must | SCR-NEWS-001 | `REQ-NEWS-003` | 같음 |
| `FUNC-NEWS-009` | 뉴스 피드 | 기사 상세 | 기사 상세 대화상자 | Must | SCR-NEWS-002 | `REQ-NEWS-003` | 같음 |
| `FUNC-NEWS-010` | 뉴스 피드 | 기사 상세 | 기사 단위 AI 질문 (스트리밍) | Must | SCR-NEWS-002 | `REQ-NEWS-004` | 같음 |
| `FUNC-NEWS-011` | 뉴스 피드 | API 전용 | 기사 단위 AI 질문 (일괄 응답) | Could | 없음 | `REQ-NEWS-007` | 같음 |
| `FUNC-NEWS-012` | 뉴스 피드 | API 전용 | 기사 단건 조회 | Could | 없음 | `REQ-NEWS-007` | 같음 |
| `FUNC-NEWS-013` | 뉴스 피드 | API 전용 | RSS 출력 | Could | 없음 (새 탭 XML) | `REQ-NEWS-007` | 같음 |
| `FUNC-NEWS-014` | 뉴스 피드 | 트렌드 레이더 | 트렌드 레이더 | Should | SCR-NEWS-001, SCR-NEWS-003 | `REQ-NEWS-006` | 같음 |
| `FUNC-NEWS-015` | 뉴스 피드 | 피드 화면 | 통계 | Should | SCR-NEWS-001 | `REQ-NEWS-006` | 같음 |
| `FUNC-NEWS-016` | 뉴스 피드 | 피드 화면 | 피드 키보드 단축키 | Should | SCR-NEWS-001 | `REQ-UI-004` | 같음 |
| `FUNC-NEWS-017` | 뉴스 피드 | 데이터 관리 | 데이터 전체 삭제·초기화 | Should | SCR-COLL-003 | `REQ-COLL-007` | 같음 |
| `FUNC-NEWS-018` | 뉴스 피드 | 피드 화면 | 일일 브리핑 바로가기 | Must | SCR-NEWS-001, SCR-BRF-001 | `REQ-BRF-002` | 같음 |
| `FUNC-NEWS-019` | 뉴스 피드 | 피드 화면 | AI 챗 핸드오버 | Must | SCR-NEWS-001, SCR-NEWS-002 | `REQ-CHAT-006` | 같음 |

### 2.2 AI 챗 (CHAT)

| 기능 ID | 1Depth (도메인) | 2Depth (화면/모듈) | 3Depth (단위기능명) | 우선순위 | 화면 코드 | 대응 요구사항 ID | 상세 명세 문서 링크 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| `FUNC-CHAT-001` | AI 챗 | 대화 세션 | 세션 목록 조회·검색 | Should | SCR-CHAT-002 | `REQ-CHAT-007` | [`fsd/02_AI_CHAT_SPECIFICATION.md`](./fsd/02_AI_CHAT_SPECIFICATION.md) |
| `FUNC-CHAT-002` | AI 챗 | 대화 세션 | 새 대화 | Should | SCR-CHAT-001, SCR-CHAT-002, SCR-UI-002 | `REQ-CHAT-007` | 같음 |
| `FUNC-CHAT-003` | AI 챗 | 대화 세션 | 세션 선택·복원 | Should | SCR-CHAT-002, SCR-CHAT-001 | `REQ-CHAT-007` | 같음 |
| `FUNC-CHAT-004` | AI 챗 | 대화 세션 | 세션 제목(이름) | Should | SCR-CHAT-002 | `REQ-CHAT-007` | 같음 |
| `FUNC-CHAT-005` | AI 챗 | 대화 세션 | 세션 삭제 | Should | SCR-CHAT-002, SCR-CHAT-003 | `REQ-CHAT-007` | 같음 |
| `FUNC-CHAT-006` | AI 챗 | 대화 세션 | 세션 저장·동기화 | Should | SCR-CHAT-002, 없음(API) | `REQ-CHAT-007` | 같음 |
| `FUNC-CHAT-007` | AI 챗 | 대화 세션 | 히스토리 사이드바·드로어 | Should | SCR-CHAT-002 | `REQ-CHAT-007` | 같음 |
| `FUNC-CHAT-008` | AI 챗 | 질의응답 | 메시지 입력·전송 | Must | SCR-CHAT-001 | `REQ-CHAT-001` | 같음 |
| `FUNC-CHAT-009` | AI 챗 | 질의응답 | SSE 스트리밍 수신 | Must | SCR-CHAT-001 | `REQ-CHAT-001` | 같음 |
| `FUNC-CHAT-010` | AI 챗 | 질의응답 | ReAct 검색 계획 (global) | Must | 없음(API), 결과는 SCR-CHAT-001 | `REQ-CHAT-001` | 같음 |
| `FUNC-CHAT-011` | AI 챗 | 질의응답 | 워크플로 단계 표시 | Should | SCR-CHAT-001 | `REQ-CHAT-009` | 같음 |
| `FUNC-CHAT-012` | AI 챗 | 질의응답 | RAG 코퍼스 검색 | Must | 없음(API) | `REQ-CHAT-001` | 같음 |
| `FUNC-CHAT-013` | AI 챗 | 질의응답 | 단일 기사(scoped) 질의 | Must | SCR-CHAT-001 | `REQ-CHAT-002` | 같음 |
| `FUNC-CHAT-014` | AI 챗 | 질의응답 | 인용 출처 | Must | SCR-CHAT-001, SCR-CHAT-006 | `REQ-CHAT-003` | 같음 |
| `FUNC-CHAT-015` | AI 챗 | 모델·공급자 | 모델 선택 | Must | SCR-CHAT-001, SCR-CHAT-004 | `REQ-CHAT-004` | 같음 |
| `FUNC-CHAT-016` | AI 챗 | 검색 범위 | 포커스 필터 | Should | SCR-CHAT-001, SCR-CHAT-005 | `REQ-CHAT-008` | 같음 |
| `FUNC-CHAT-017` | AI 챗 | 검색 범위 | 스코프 전환·기사 칩 | Should | SCR-CHAT-001 | `REQ-CHAT-008` | 같음 |
| `FUNC-CHAT-018` | AI 챗 | 검색 범위 | 핸드오버 (뉴스 기사 → 챗) | Must | SCR-NEWS-001, SCR-NEWS-002, SCR-CHAT-001 | `REQ-CHAT-006` | 같음 |
| `FUNC-CHAT-019` | AI 챗 | 답변 활용·복구 | 내보내기 | Should | SCR-CHAT-001 | `REQ-CHAT-010` | 같음 |
| `FUNC-CHAT-020` | AI 챗 | 답변 활용·복구 | 오류·중단·재시도 | Must | SCR-CHAT-001 | `REQ-CHAT-005` | 같음 |
| `FUNC-CHAT-021` | AI 챗 | 모델·공급자 | 토큰 한도·출력 완료 | Must | 없음(API), SCR-CHAT-001 | `REQ-CHAT-004` | 같음 |
| `FUNC-CHAT-022` | AI 챗 | 모델·공급자 | LLM 공급자 선택 순서·가용성 판정·폴백 | Must | 없음(API) | `REQ-COLL-005` | 같음 |
| `FUNC-CHAT-023` | AI 챗 | API·미연결 코드 | 동기 단건 질의 API | Could | 없음(API) | `REQ-CHAT-011` | 같음 |
| `FUNC-CHAT-024` | AI 챗 | API·미연결 코드 | 보충 웹 검색 엔진 (미연결) | Won't | 없음(API) | `REQ-CHAT-012` | 같음 |
| `FUNC-CHAT-025` | AI 챗 | 화면 공통 | 반응형·모바일 | Should | SCR-CHAT-001, SCR-UI-002 | `REQ-UI-007` | 같음 |

### 2.3 수집·분류·요약 (COLL)

| 기능 ID | 1Depth (도메인) | 2Depth (화면/모듈) | 3Depth (단위기능명) | 우선순위 | 화면 코드 | 대응 요구사항 ID | 상세 명세 문서 링크 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| `FUNC-COLL-001` | 수집 | 수집 실행 | 수집 실행 오케스트레이션 | Must | 없음 (진행 상태는 SCR-UI-001) | `REQ-COLL-001` | [`fsd/03_COLLECTION_SPECIFICATION.md`](./fsd/03_COLLECTION_SPECIFICATION.md) |
| `FUNC-COLL-002` | 수집 | 수집 실행 | `make collect` (CLI) | Should | 없음 (터미널) | `REQ-COLL-006` | 같음 |
| `FUNC-COLL-003` | 수집 | 수집 실행 | 소스 설정 로딩 | Must | 없음 | `REQ-COLL-001` | 같음 |
| `FUNC-COLL-004` | 수집 | 소스 수집기 | RSS 수집기 | Must | 없음 | `REQ-COLL-001` | 같음 |
| `FUNC-COLL-005` | 수집 | 소스 수집기 | HackerNews 수집기 | Must | 없음 | `REQ-COLL-001` | 같음 |
| `FUNC-COLL-006` | 수집 | 소스 수집기 | GitHub 수집기 | Must | 없음 | `REQ-COLL-001` | 같음 |
| `FUNC-COLL-007` | 수집 | 소스 수집기 | arXiv 수집기 | Must | 없음 | `REQ-COLL-001` | 같음 |
| `FUNC-COLL-008` | 수집 | 소스 수집기 | Hugging Face 수집기 | Must | 없음 | `REQ-COLL-001` | 같음 |
| `FUNC-COLL-009` | 수집 | 소스 수집기 | Reddit 수집기 | Must | 없음 | `REQ-COLL-001` | 같음 |
| `FUNC-COLL-010` | 수집 | 평가·분류·저장 | 관련성·품질 게이트 | Must | 없음 | `REQ-COLL-002` | 같음 |
| `FUNC-COLL-011` | 수집 | 평가·분류·저장 | 휴리스틱 품질 점수 | Must | 없음 | `REQ-COLL-002` | 같음 |
| `FUNC-COLL-012` | 수집 | 평가·분류·저장 | AI 도메인 판정·카테고리 분류·태그 | Must | 없음 | `REQ-COLL-002` | 같음 |
| `FUNC-COLL-013` | 수집 | 평가·분류·저장 | 인기도(hotness) 점수 | Must | 없음 | `REQ-COLL-003` | 같음 |
| `FUNC-COLL-014` | 수집 | 평가·분류·저장 | 핵심 요약·시사점·기술 스택 합성 | Must | 없음 | `REQ-COLL-003` | 같음 |
| `FUNC-COLL-015` | 수집 | 평가·분류·저장 | 중복 제거·저장·갱신 | Must | 없음 | `REQ-COLL-003` | 같음 |
| `FUNC-COLL-016` | 수집 | 평가·분류·저장 | 시드 데이터 | Should | 없음 | `REQ-COLL-006` | 같음 |
| `FUNC-COLL-017` | 수집 | 수집 상태와 트리거 | 진행 상태·크롤 로그·스케줄 상태 | Must | SCR-UI-001, SCR-COLL-002 | `REQ-COLL-004` | 같음 |
| `FUNC-COLL-018` | 수집 | 수집 상태와 트리거 | 정기 스케줄 | Must | 없음 | `REQ-COLL-004` | 같음 |
| `FUNC-COLL-019` | 수집 | 수집 상태와 트리거 | 수동 트리거 (즉시 수집) | Must | SCR-UI-001, SCR-COLL-002 | `REQ-COLL-004` | 같음 |
| `FUNC-COLL-020` | 수집 | 수집 상태와 트리거 | 초기화 후 재수집 (`make reset` 포함) | Should | SCR-UI-001, SCR-COLL-002, SCR-COLL-003 | `REQ-COLL-007` | 같음 |
| `FUNC-COLL-021` | 수집 | 수집 상태와 트리거 | 시작 시 초기 수집 | Should | 없음 | `REQ-COLL-006` | 같음 |
| `FUNC-COLL-022` | 수집 | 수집 상태와 트리거 | MCP 수집 트리거 | Should | 없음 (MCP stdio) | `REQ-MCP-002` | 같음 |
| `FUNC-COLL-023` | 수집 | LLM·보조 모듈 | LLM 프로바이더 선택·폴백 | Must | 없음 | `REQ-COLL-005` | 같음 |
| `FUNC-COLL-024` | 수집 | LLM·보조 모듈 | 테스트 환경 판정 | Should | 없음 | `REQ-COLL-006` | 같음 |
| `FUNC-COLL-025` | 수집 | LLM·보조 모듈 | 기사 본문 스크래퍼 | Should | 없음 | `REQ-CHAT-002` | 같음 |

### 2.4 브리핑·공유 (BRF)

| 기능 ID | 1Depth (도메인) | 2Depth (화면/모듈) | 3Depth (단위기능명) | 우선순위 | 화면 코드 | 대응 요구사항 ID | 상세 명세 문서 링크 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| `FUNC-BRF-001` | 브리핑 | 브리핑 엔진 | 브리핑 생성 | Must | 없음 (결과는 SCR-BRF-001, SCR-BRF-002) | `REQ-BRF-001` | [`fsd/04_BRIEFING_AND_SHARING_SPECIFICATION.md`](./fsd/04_BRIEFING_AND_SHARING_SPECIFICATION.md) |
| `FUNC-BRF-002` | 브리핑 | 메인 요약 바 | 브리핑 바로가기 | Must | SCR-BRF-001 | `REQ-BRF-002` | 같음 |
| `FUNC-BRF-003` | 브리핑 | 브리핑 대화상자 | 브리핑 대화상자 | Must | SCR-BRF-002 | `REQ-BRF-002` | 같음 |
| `FUNC-BRF-004` | 브리핑 | 브리핑 대화상자 | Notion 발행 (수동) | Must | SCR-BRF-002 | `REQ-BRF-003` | 같음 |
| `FUNC-BRF-005` | 브리핑 | 설정 대화상자 | Notion 연결 테스트 | Should | SCR-BRF-003 | `REQ-BRF-005` | 같음 |
| `FUNC-BRF-006` | 브리핑 | 브리핑 대화상자 | 이메일 발송 (수동) | Must | SCR-BRF-002 | `REQ-BRF-004` | 같음 |
| `FUNC-BRF-007` | 브리핑 | 설정 대화상자 | SMTP 연결 테스트 | Should | SCR-BRF-003 | `REQ-BRF-005` | 같음 |
| `FUNC-BRF-008` | 브리핑 | 외부 채널 발송 | 이메일 템플릿 | Should | 없음 (메일 본문) | `REQ-BRF-004` | 같음 |
| `FUNC-BRF-009` | 브리핑 | 설정 대화상자 | 웹훅 테스트 전송 | Should | SCR-BRF-003 | `REQ-BRF-005` | 같음 |
| `FUNC-BRF-010` | 브리핑 | 외부 채널 발송 | 웹훅 브리핑 발송 | Should | 없음 | `REQ-BRF-006` | 같음 |
| `FUNC-BRF-011` | 브리핑 | 설정 대화상자 | 연동 설정 조회·저장 | Must | SCR-BRF-003 | `REQ-BRF-005` | 같음 |
| `FUNC-BRF-012` | 브리핑 | 미사용 컴포넌트 | 웹훅 설정 모달 (미사용) | Won't | SCR-BRF-004 | `REQ-BRF-008` | 같음 |
| `FUNC-BRF-013` | 브리핑 | 스케줄러 | 자동 발송 스케줄 | Should | 없음 | `REQ-BRF-007` | 같음 |

### 2.5 소스·딥 리서치 (SRC)

| 기능 ID | 1Depth (도메인) | 2Depth (화면/모듈) | 3Depth (단위기능명) | 우선순위 | 화면 코드 | 대응 요구사항 ID | 상세 명세 문서 링크 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| `FUNC-SRC-001` | 소스 | 소스 설정 파일 | sources.json 구조와 저장 | Must | 없음 | `REQ-SRC-001` | [`fsd/05_SOURCES_AND_RESEARCH_SPECIFICATION.md`](./fsd/05_SOURCES_AND_RESEARCH_SPECIFICATION.md) |
| `FUNC-SRC-002` | 소스 | 소스 & 리서처 대화상자 | 소스 관리 대화상자 | Must | SCR-SRC-001 | `REQ-SRC-001` | 같음 |
| `FUNC-SRC-003` | 소스 | 등록된 수집원 탭 | 소스 목록 조회 | Must | SCR-SRC-003 | `REQ-SRC-001` | 같음 |
| `FUNC-SRC-004` | 소스 | 등록된 수집원 탭 | RSS 피드 추가 | Must | SCR-SRC-003 | `REQ-SRC-002` | 같음 |
| `FUNC-SRC-005` | 소스 | API 전용 | GitHub 저장소 추가 | Could | 없음 | `REQ-SRC-005` | 같음 |
| `FUNC-SRC-006` | 소스 | 등록된 수집원 탭 | 소스 켜기/끄기 | Must | SCR-SRC-003 | `REQ-SRC-002` | 같음 |
| `FUNC-SRC-007` | 소스 | 등록된 수집원 탭 | 소스 삭제 | Must | SCR-SRC-003, SCR-SRC-004 | `REQ-SRC-002` | 같음 |
| `FUNC-SRC-008` | 소스 | AI 딥 리서처 탭 | 단일 URL 검사 | Should | SCR-SRC-002 | `REQ-SRC-004` | 같음 |
| `FUNC-SRC-009` | 소스 | API 전용 | 카탈로그 후보 탐색 | Could | 없음 | `REQ-SRC-005` | 같음 |
| `FUNC-SRC-010` | 소스 | API 전용 | 후보 등록 | Could | 없음 | `REQ-SRC-005` | 같음 |
| `FUNC-SRC-011` | 소스 | AI 딥 리서처 탭 | 자율 딥 리서치 실행 | Should | SCR-SRC-002 (스케줄은 화면 없음) | `REQ-SRC-003` | 같음 |
| `FUNC-SRC-012` | 소스 | 내부 모듈 | 후보 평가·판정 규칙 | Should | 없음 | `REQ-SRC-003` | 같음 |
| `FUNC-SRC-013` | 소스 | AI 딥 리서처 탭 | 딥 리서치 상태 조회 | Should | SCR-SRC-002 | `REQ-SRC-003` | 같음 |
| `FUNC-SRC-014` | 소스 | AI 딥 리서처 탭 | 감사 일지 | Should | SCR-SRC-002 | `REQ-SRC-003` | 같음 |

### 2.6 MCP 서버 (MCP)

| 기능 ID | 1Depth (도메인) | 2Depth (화면/모듈) | 3Depth (단위기능명) | 우선순위 | 화면 코드 | 대응 요구사항 ID | 상세 명세 문서 링크 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| `FUNC-MCP-001` | MCP | MCP 서버 프로세스 | MCP 서버 실행 | Must | 없음 (stdio 자식 프로세스) | `REQ-MCP-001` | [`fsd/06_MCP_SERVER_SPECIFICATION.md`](./fsd/06_MCP_SERVER_SPECIFICATION.md) |
| `FUNC-MCP-002` | MCP | MCP 서버 프로세스 | 도구 `get_latest_harness_methods` | Must | 없음 | `REQ-MCP-001` | 같음 |
| `FUNC-MCP-003` | MCP | MCP 서버 프로세스 | 도구 `get_mcp_and_skills_ecosystem` | Must | 없음 | `REQ-MCP-001` | 같음 |
| `FUNC-MCP-004` | MCP | MCP 서버 프로세스 | 도구 `search_agent_news` | Must | 없음 | `REQ-MCP-001` | 같음 |
| `FUNC-MCP-005` | MCP | MCP 서버 프로세스 | 도구 `trigger_agentlens_crawl` | Should | 없음 | `REQ-MCP-002` | 같음 |
| `FUNC-MCP-006` | MCP | 웹 API | MCP 정보 API `GET /api/mcp/info` | Could | 없음 | `REQ-MCP-004` | 같음 |
| `FUNC-MCP-007` | MCP | MCP 연동 대화상자 | MCP 연동 대화상자 | Should | SCR-MCP-001 | `REQ-MCP-003` | 같음 |

### 2.7 UI 공통 (UI)

| 기능 ID | 1Depth (도메인) | 2Depth (화면/모듈) | 3Depth (단위기능명) | 우선순위 | 화면 코드 | 대응 요구사항 ID | 상세 명세 문서 링크 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| `FUNC-UI-001` | UI 공통 | 헤더 | 피드 헤더 | Must | SCR-UI-001 | `REQ-UI-001` | [`fsd/07_UI_COMMON_SPECIFICATION.md`](./fsd/07_UI_COMMON_SPECIFICATION.md) |
| `FUNC-UI-002` | UI 공통 | 헤더 | 수집 진행 줄과 초기화 확인 창 | Should | SCR-UI-001, SCR-COLL-003 | `REQ-COLL-004`, `REQ-COLL-007` | 같음 |
| `FUNC-UI-003` | UI 공통 | 테마 | 테마 시스템 | Should | SCR-UI-000 | `REQ-UI-005` | 같음 |
| `FUNC-UI-004` | UI 공통 | 테마 | 테마 선택 메뉴 | Should | SCR-UI-003 | `REQ-UI-005` | 같음 |
| `FUNC-UI-005` | UI 공통 | 키보드 | 전역 단축키 | Should | SCR-UI-000 | `REQ-UI-004` | 같음 |
| `FUNC-UI-006` | UI 공통 | 키보드 | 피드 키보드 탐색 | Should | SCR-NEWS-001 | `REQ-UI-004` | 같음 |
| `FUNC-UI-007` | UI 공통 | 팔레트 | 커맨드 팔레트 | Should | SCR-UI-002 | `REQ-UI-004` | 같음 |
| `FUNC-UI-008` | UI 공통 | 오버레이 | 대화상자·오버레이 공통 규칙 | Must | SCR-UI-004 | `REQ-UI-006` | 같음 |
| `FUNC-UI-009` | UI 공통 | 배치 | 반응형 레이아웃 | Must | SCR-UI-000 | `REQ-UI-002` | 같음 |
| `FUNC-UI-010` | UI 공통 | 배치 | 모바일 뷰포트·가상 키보드 대응 | Should | SCR-UI-000 | `REQ-UI-007` | 같음 |
| `FUNC-UI-011` | UI 공통 | 표시 | 로딩·오류·빈 상태 표시 | Must | SCR-UI-000 | `REQ-UI-006` | 같음 |
| `FUNC-UI-012` | UI 공통 | 표시 | 마크다운 렌더링 | Must | SCR-UI-000 | `REQ-UI-006` | 같음 |
| `FUNC-UI-013` | UI 공통 | 표시 | 복사 피드백 | Should | SCR-UI-000 | `REQ-UI-008` | 같음 |
| `FUNC-UI-014` | UI 공통 | 표시 | 접근성 속성 | Must | SCR-UI-000 | `REQ-UI-003` | 같음 |

### 2.8 요구사항 → 단위 기능 역추적

| 요구사항 ID | 우선순위 | 단위 기능 |
|---|---|---|
| `REQ-NEWS-001` | Must | FUNC-NEWS-001, 002, 005, 006 |
| `REQ-NEWS-002` | Should | FUNC-NEWS-003, 004 |
| `REQ-NEWS-003` | Must | FUNC-NEWS-008, 009 |
| `REQ-NEWS-004` | Must | FUNC-NEWS-010 |
| `REQ-NEWS-005` | Should | FUNC-NEWS-007 |
| `REQ-NEWS-006` | Should | FUNC-NEWS-014, 015 |
| `REQ-NEWS-007` | Could | FUNC-NEWS-011, 012, 013 |
| `REQ-CHAT-001` | Must | FUNC-CHAT-008, 009, 010, 012 |
| `REQ-CHAT-002` | Must | FUNC-CHAT-013, FUNC-COLL-025 |
| `REQ-CHAT-003` | Must | FUNC-CHAT-014 |
| `REQ-CHAT-004` | Must | FUNC-CHAT-015, 021 |
| `REQ-CHAT-005` | Must | FUNC-CHAT-020 |
| `REQ-CHAT-006` | Must | FUNC-CHAT-018, FUNC-NEWS-019 |
| `REQ-CHAT-007` | Should | FUNC-CHAT-001~007 |
| `REQ-CHAT-008` | Should | FUNC-CHAT-016, 017 |
| `REQ-CHAT-009` | Should | FUNC-CHAT-011 |
| `REQ-CHAT-010` | Should | FUNC-CHAT-019 |
| `REQ-CHAT-011` | Could | FUNC-CHAT-023 |
| `REQ-CHAT-012` | Won't | FUNC-CHAT-024 |
| `REQ-COLL-001` | Must | FUNC-COLL-001, 003~009 |
| `REQ-COLL-002` | Must | FUNC-COLL-010, 011, 012 |
| `REQ-COLL-003` | Must | FUNC-COLL-013, 014, 015 |
| `REQ-COLL-004` | Must | FUNC-COLL-017, 018, 019, FUNC-UI-002 |
| `REQ-COLL-005` | Must | FUNC-COLL-023, FUNC-CHAT-022 |
| `REQ-COLL-006` | Should | FUNC-COLL-002, 016, 021, 024 |
| `REQ-COLL-007` | Should | FUNC-COLL-020, FUNC-NEWS-017, FUNC-UI-002 |
| `REQ-BRF-001` | Must | FUNC-BRF-001 |
| `REQ-BRF-002` | Must | FUNC-BRF-002, 003, FUNC-NEWS-018 |
| `REQ-BRF-003` | Must | FUNC-BRF-004 |
| `REQ-BRF-004` | Must | FUNC-BRF-006, 008 |
| `REQ-BRF-005` | Must | FUNC-BRF-005, 007, 009, 011 |
| `REQ-BRF-006` | Should | FUNC-BRF-010 |
| `REQ-BRF-007` | Should | FUNC-BRF-013 |
| `REQ-BRF-008` | Won't | FUNC-BRF-012 |
| `REQ-SRC-001` | Must | FUNC-SRC-001, 002, 003 |
| `REQ-SRC-002` | Must | FUNC-SRC-004, 006, 007 |
| `REQ-SRC-003` | Should | FUNC-SRC-011, 012, 013, 014 |
| `REQ-SRC-004` | Should | FUNC-SRC-008 |
| `REQ-SRC-005` | Could | FUNC-SRC-005, 009, 010 |
| `REQ-MCP-001` | Must | FUNC-MCP-001~004 |
| `REQ-MCP-002` | Should | FUNC-MCP-005, FUNC-COLL-022 |
| `REQ-MCP-003` | Should | FUNC-MCP-007 |
| `REQ-MCP-004` | Could | FUNC-MCP-006 |
| `REQ-UI-001` | Must | FUNC-UI-001 |
| `REQ-UI-002` | Must | FUNC-UI-009 |
| `REQ-UI-003` | Must | FUNC-UI-014 |
| `REQ-UI-004` | Should | FUNC-UI-005, 006, 007, FUNC-NEWS-016 |
| `REQ-UI-005` | Should | FUNC-UI-003, 004 |
| `REQ-UI-006` | Must | FUNC-UI-008, 011, 012 |
| `REQ-UI-007` | Should | FUNC-UI-010, FUNC-CHAT-025 |
| `REQ-UI-008` | Should | FUNC-UI-013 |

Won't(후속 후보) 요구사항 `REQ-COLL-008`, `REQ-COLL-009`, `REQ-CHAT-013`, `REQ-NEWS-008`, `REQ-BRF-009`~`011`, `REQ-UI-009`, `REQ-UI-010` 에는 대응 단위 기능이 없다 (코드에 없거나 수정 과제다, PRD 3.2절).

---

## 3. 화면 코드 목록 (SCR-*)

화면 코드는 도메인 FSD 가 정했고 이 표가 정본이다. 한 화면에 코드 하나만 쓴다. 이번에 합친 코드: 챗 FSD 초안의 `SCR-CHAT-007`(챗 커맨드 팔레트) → `SCR-UI-002`, 수집 FSD 초안의 `SCR-COLL-001`(헤더 수집 컨트롤) → `SCR-UI-001`, 뉴스 피드 FSD 초안의 `SCR-NEWS-004`(초기화 확인 창) → `SCR-COLL-003`.

| 화면 코드 | 화면·영역 | 종류 | 컴포넌트 (근거) | 정의 FSD | 쓰는 단위 기능 |
|---|---|---|---|---|---|
| `SCR-UI-000` | 전역 (테마 적용, 반응형, 뷰포트, 로딩 표시, 마크다운, 복사, 접근성) | 모든 화면 | 루트 레이아웃 `frontend/src/app/layout.tsx` 외 | UI | FUNC-UI-003, 005, 009~014 |
| `SCR-UI-001` | 피드 헤더 + 수집 진행 줄 (수집 상태 버튼, 즉시 수집, 더보기 메뉴의 수집 항목 포함) | `/` 상단 | `frontend/src/components/Header.tsx` (`Header`, `CollectorStatusLine`), `frontend/src/hooks/useCollector.ts` | UI | FUNC-UI-001, 002, FUNC-COLL-001, 017, 019, 020 |
| `SCR-UI-002` | 커맨드 팔레트 (피드 9개 명령, 챗 4개 명령) | 대화상자 `md`, 768px 미만 전체 화면 | `frontend/src/components/CommandPalette.tsx` | UI | FUNC-UI-007, FUNC-CHAT-002, 025 |
| `SCR-UI-003` | 메뉴 (테마 선택, 더보기) | 메뉴 | 피드 헤더, 챗 헤더 (`frontend/src/components/ui/Menu.tsx`) | UI | FUNC-UI-004 |
| `SCR-UI-004` | 공통 오버레이 (대화상자·드로어·바텀시트·확인 창·메뉴·팝오버) | 모든 화면 | `frontend/src/components/ui/Dialog.tsx`, `frontend/src/lib/overlay-stack.ts` | UI | FUNC-UI-008 |
| `SCR-NEWS-001` | 뉴스 피드 화면 `/` (요약 바, 검색 영역, 필터 영역, 목록 머리줄, 카드 그리드, 페이지 이동) | 페이지 | `frontend/src/app/page.tsx` | NEWS | FUNC-NEWS-001~008, 014~016, 018, 019, FUNC-UI-006, FUNC-CHAT-018 |
| `SCR-NEWS-002` | 기사 상세 대화상자 (탭 `AI 요약 & 시사점`, `AI 질의응답`) | 대화상자 `xl` | `frontend/src/components/NewsDetailModal.tsx` | NEWS | FUNC-NEWS-007, 009, 010, 019, FUNC-CHAT-018 |
| `SCR-NEWS-003` | 트렌드 레이더 패널 (요약 바 아래 펼침) | 펼침 패널 | `frontend/src/components/feed/TrendRadarPanel.tsx` | NEWS | FUNC-NEWS-014 |
| `SCR-CHAT-001` | AI 챗 워크스페이스 `/chat` (헤더, 맥락 줄, 메시지 타임라인, 포커스 캡슐, 입력창) | 페이지 | `frontend/src/components/chat/ChatWorkspace.tsx` | CHAT | FUNC-CHAT-002, 003, 008~011, 013~021, 025 |
| `SCR-CHAT-002` | 대화 기록 사이드바(1024px 이상)·드로어(1024px 미만) | 사이드바·드로어 | `ChatSidebar`, `ChatHistoryDrawer` | CHAT | FUNC-CHAT-001~007 |
| `SCR-CHAT-003` | 세션 삭제 확인 팝오버 | 팝오버 | `DeleteConfirmPopover` | CHAT | FUNC-CHAT-005 |
| `SCR-CHAT-004` | 모델 선택 드롭다운 | 팝오버 (`radiogroup`) | `ChatModelSelector` | CHAT | FUNC-CHAT-015 |
| `SCR-CHAT-005` | 포커스 필터 대화상자(768px 이상)·바텀시트(768px 미만) | 대화상자 `sm` | `FocusBottomSheet` | CHAT | FUNC-CHAT-016 |
| `SCR-CHAT-006` | 인용 출처 팝오버 | 팝오버 | `CitationBadge`, `CitationPopover` | CHAT | FUNC-CHAT-014 |
| `SCR-COLL-002` | 자동 수집 스케줄 대화상자 | 대화상자 `md` | `frontend/src/components/ScheduleModal.tsx` | COLL | FUNC-COLL-017, 019, 020 |
| `SCR-COLL-003` | 수집 데이터 전체 삭제 및 재수집 확인 창 | 확인 창 `alertdialog` `sm` | `frontend/src/components/ResetConfirmDialog.tsx` | COLL | FUNC-COLL-020, FUNC-NEWS-017, FUNC-UI-002 |
| `SCR-BRF-001` | 요약 바의 브리핑 버튼 (`SCR-NEWS-001` 요약 바 안의 영역) | 버튼 | `frontend/src/components/feed/InsightsBar.tsx` | BRF | FUNC-BRF-002, FUNC-NEWS-018 |
| `SCR-BRF-002` | 일일 브리핑 대화상자 | 대화상자 `xl` | `frontend/src/components/DailyBriefingModal.tsx` | BRF | FUNC-BRF-003, 004, 006 |
| `SCR-BRF-003` | 공유 & 알림 설정 대화상자 | 대화상자 `md` | `frontend/src/components/BriefingSettingsModal.tsx` | BRF | FUNC-BRF-005, 007, 009, 011 |
| `SCR-BRF-004` | 웹훅 알림 설정 모달 (어디서도 렌더하지 않음) | 대화상자 | `frontend/src/components/WebhookSettingsModal.tsx` | BRF | FUNC-BRF-012 |
| `SCR-SRC-001` | 소스 & 리서처 대화상자 | 대화상자 `xl` | `frontend/src/components/SourcesModal.tsx` | SRC | FUNC-SRC-002 |
| `SCR-SRC-002` | AI 딥 리서처 탭 | 탭 | `frontend/src/components/sources/DeepResearcherTab.tsx` | SRC | FUNC-SRC-008, 011, 013, 014 |
| `SCR-SRC-003` | 등록된 수집원 탭 | 탭 | `frontend/src/components/sources/SourcesListTab.tsx` | SRC | FUNC-SRC-003, 004, 006, 007 |
| `SCR-SRC-004` | 소스 삭제 확인 창 | 확인 창 `sm` | `SourcesModal.tsx` 안의 `ConfirmDialog` | SRC | FUNC-SRC-007 |
| `SCR-MCP-001` | AgentLens MCP 연동 대화상자 | 대화상자 `lg` | `frontend/src/components/McpModal.tsx` | MCP | FUNC-MCP-007 |

- 라우트: `/`(피드), `/chat`(챗), `/api/health`(프론트 헬스체크). 404·로딩·오류 커스텀 페이지는 없다 (`docs/spec-writer/fsd/07_UI_COMMON_SPECIFICATION.md` '화면·라우트').
- 코드를 따로 두지 않은 작은 층: 뉴스 상세 질의응답 탭의 `대화 초기화` 확인 창(`SCR-NEWS-002` 안), 챗 알림 영역(`SCR-CHAT-001` 안). 전체 대화상자 목록은 UI 공통 FSD '대화상자·드로어·시트·팝오버' 표.

---

## 4. 도메인별 분할 명세서 맵 (Modular FSD Map)

- [01. 뉴스 피드 상세기능정의서](./fsd/01_NEWS_FEED_SPECIFICATION.md)
- [02. AI 챗 상세기능정의서](./fsd/02_AI_CHAT_SPECIFICATION.md)
- [03. 수집·분류·요약 상세기능정의서](./fsd/03_COLLECTION_SPECIFICATION.md)
- [04. 브리핑·공유 상세기능정의서](./fsd/04_BRIEFING_AND_SHARING_SPECIFICATION.md)
- [05. 소스 관리와 딥 리서치 상세기능정의서](./fsd/05_SOURCES_AND_RESEARCH_SPECIFICATION.md)
- [06. MCP 서버 상세기능정의서](./fsd/06_MCP_SERVER_SPECIFICATION.md)
- [07. UI 공통 상세기능정의서](./fsd/07_UI_COMMON_SPECIFICATION.md)

---

## 5. 함께 보는 문서 (옛 색인 '함께 보는 문서' 대응)

| 옛 문서 | 지금 읽을 곳 |
|---|---|
| `docs/product.md` (제품 개요, 범위, 기능 목록) | `docs/spec-writer/01_PRD.md` |
| `docs/functional-spec/*.md` (영역별 기능명세) | `docs/spec-writer/fsd/*.md` (옛 ID 대응표는 각 FSD 끝) |
| `docs/ui-spec.md` (라우트, 영역, 모달 목록, 상태·localStorage) | `docs/spec-writer/fsd/07_UI_COMMON_SPECIFICATION.md` '화면·라우트' 절과 3절 화면 코드 목록. 컴포넌트 트리는 UI 시스템 산출물 `docs/ui-system-designer/01_COMPONENT_SPEC.md` |
| `docs/design-system.md` (토큰, 공통 부품, 하지 말 것) | `docs/ui-system-designer/02_DESIGN_SYSTEM.md` |
| `docs/tech-spec.md`, `docs/api.md`, `docs/data-model.md` | 엔지니어링 산출물 `docs/system-designer/01_SYSTEM_DESIGN.md`, `docs/fullstack-architect/01_ARCHITECTURE_ADR.md`, 계약 `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` (내용 배치는 각 문서를 따른다) |
| `docs/operations.md` | `docs/devops-engineer/01_DEPLOYMENT_SPEC.md` |
| `docs/test-strategy.md`, `docs/test-cases.md` | `docs/qa-engineer/01_QA_TEST_PLAN.md` |
| `docs/known-issues.md` (영역을 넘나드는 문제) | 각 FSD '알려진 불일치·위험' 과 `docs/spec-writer/03_POLICIES_AND_EDGES.md` 4절 |
