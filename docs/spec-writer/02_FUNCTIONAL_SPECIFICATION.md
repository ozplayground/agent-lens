# AgentLens 전체 기능정의서 인덱스 (Functional Specification Index)

- **작성일자**: 2026-10-20
- **작성자**: 기획 명세 작성가 (`spec-writer`)
- **문서 버전**: v1.0
- **상태**: Approved

---

## 1. 기능 계층 구조도 (Feature Hierarchy Tree)

```
[1Depth: AgentLens]
  ├── [1Depth: 피드 & 큐레이션 및 Tech Radar (FEED)]
  │     ├── [2Depth: 피드 브라우징 (FEED-BROWSE)]
  │     │     ├── [3Depth: 카테고리/출처/고신호 필터링 및 다중 정렬] (FUNC-FEED-001)
  │     │     └── [3Depth: 실시간 키워드 및 기술 태그 검색] (FUNC-FEED-002)
  │     ├── [2Depth: 아티클 상세 & 질의 (FEED-DETAIL)]
  │     │     ├── [3Depth: 3줄 요약/시사점 상세 모달 및 전용 챗 연동] (FUNC-FEED-003)
  │     │     └── [3Depth: 특정 아티클 대상 대화형 Ask AI 질의 및 전용 챗 핸드오버] (FUNC-FEED-004)
  │     ├── [2Depth: 개인화 보관 (FEED-BOOKMARK)]
  │     │     └── [3Depth: 브라우저 로컬 저장소 기반 개인 북마크 보관 및 열람] (FUNC-FEED-005)
  │     ├── [2Depth: 에이전트 Tech Radar (FEED-RADAR)]
  │     │     └── [3Depth: 급상승 기술 스택·카테고리 점유율·태그 클라우드 조회] (FUNC-FEED-006)
  │     └── [2Depth: 파워 유저 피드 탐색 (FEED-HOTKEYS)]
  │           └── [3Depth: 파워 유저 키보드 단축키(j/k 탐색, /, b, c) 및 피드 포커스 제어] (FUNC-FEED-007)
  │
  ├── [1Depth: 데이터 수집 & 정제 파이프라인 (COLLECTION)]
  │     └── [2Depth: 엔지니어링 인제스천 엔진 (COLL-PIPELINE)]
  │           └── [3Depth: 고신호 데이터 수집/정제/요약/태깅 파이프라인 (기본 모델 & 멀티 프로바이더 지원)] (FUNC-COLL-005)
  │
  ├── [1Depth: 전용 AI 챗 & 개인 지식 RAG (CHAT)]
  │     └── [2Depth: 전용 AI 챗 워크스페이스 (CHAT-WORKSPACE)]
  │           ├── [3Depth: 독립형 전용 AI 챗 워크스페이스 레이아웃 및 세션 관리] (FUNC-CHAT-001)
  │           ├── [3Depth: 뉴스 카드 및 상세 모달에서의 컨텍스트 핸드오버] (FUNC-CHAT-002)
  │           ├── [3Depth: 듀얼 스코프(Scoped vs Global) 지식 검색 및 스트리밍 질의응답] (FUNC-CHAT-003)
  │           ├── [3Depth: 클릭형 인라인 인용 배지([1], [2], [S1]) 및 출처 뉴스 프리뷰 연동] (FUNC-CHAT-004)
  │           ├── [3Depth: 개인용 경량 코퍼스 검색(FTS5/BM25 + Quality Score) 및 파사드] (FUNC-CHAT-005)
  │           ├── [3Depth: 수집 소식 타깃팅 포커스 캡슐 및 바텀 시트 필터 피커] (FUNC-CHAT-006)
  │           ├── [3Depth: 모바일 반응형 가상키보드 대응 및 뷰포트 안정성 제어] (FUNC-CHAT-007)
  │           ├── [3Depth: 원본 소스 실시간 전문 스크래핑 및 심층 엔지니어링 분석] (FUNC-CHAT-008)
  │           ├── [3Depth: 자율 보충 검색(Agentic Web Search) 및 실시간 워크플로우 진행 상태 UX] (FUNC-CHAT-009)
  │           ├── [3Depth: AI 챗 응답 자동 줄바꿈 및 코드/테이블 블록 국소 스크롤 격리 제어] (FUNC-CHAT-010)
  │           ├── [3Depth: 심층 엔지니어링 리포트 4단 구조화 템플릿 합성 및 원클릭 익스포트 제어] (FUNC-CHAT-011)
  │           ├── [3Depth: 대화 세션 히스토리 사이드바/드로어 및 멀티턴 대화 복원/지속 관리] (FUNC-CHAT-012)
  │           └── [3Depth: AI 챗 상단 헤더 & 입력창 듀얼 멀티 모델 셀렉터] (FUNC-CHAT-013)
  │
  ├── [1Depth: 일일 브리핑 & 외부 지식 공유 (BRIEFING)]
  │     ├── [2Depth: 브리핑 열람 (BRIEF-VIEW)]
  │     │     └── [3Depth: 오늘의 AI 종합 브리핑 열람 및 마크다운 다운로드] (FUNC-BRIEF-001)
  │     └── [2Depth: 외부 채널 연동 (BRIEF-EXPORT)]
  │           ├── [3Depth: Notion 1-클릭 페이지 생성 및 동기화] (FUNC-BRIEF-002)
  │           └── [3Depth: SMTP 이메일 수동 발송 및 자동 예약 발송] (FUNC-BRIEF-003)
  │
  ├── [1Depth: 수집원 관리 & 딥 리서처 (SOURCES)]
  │     ├── [2Depth: 수집 소스 설정 (SRC-CONFIG)]
  │     │     ├── [3Depth: 신규 RSS 피드 및 GitHub 레포지토리 등록] (FUNC-SRC-001)
  │     │     └── [3Depth: 소스 항목별 수집 On/Off 토글 및 영구 삭제] (FUNC-SRC-002)
  │     └── [2Depth: 자율 리서처 (SRC-RESEARCH)]
  │           └── [3Depth: AI Deep Researcher 자율 소스 분석 및 자동 채택] (FUNC-SRC-003)
  │
  ├── [1Depth: 시스템 운영, 복원력 & FastMCP (SYSTEM)]
  │     ├── [2Depth: 스케줄 및 온디맨드 수집 (SYS-SCHEDULE)]
  │     │     ├── [3Depth: 정기 크론 스케줄 모니터링 및 즉시 수동 수집 트리거] (FUNC-SYS-001)
  │     │     └── [3Depth: 수집 데이터 전체 초기화 및 클린 재수집 (Reset & Recollect)] (FUNC-SYS-002)
  │     ├── [2Depth: 웹훅 알림 (SYS-WEBHOOK)]
  │     │     └── [3Depth: 슬랙 및 디스코드 웹훅 연동 및 실시간 알림] (FUNC-SYS-003)
  │     ├── [2Depth: FastMCP 에이전트 인터페이스 (SYS-MCP)]
  │     │     └── [3Depth: FastMCP 에이전트 도구 및 리소스 제공] (FUNC-SYS-004)
  │     └── [2Depth: 멀티 프로바이더 LLM 가용성 & 장애 안내 (SYS-RESILIENCY)]
  │           └── [3Depth: 백엔드 멀티 프로바이더 LLM 가용성 검증 및 장애 안내] (FUNC-SYS-005)
  │
  └── [1Depth: 전역 UI 테마 및 파워 유저 내비게이션 (UI-THEME)]
        ├── [2Depth: 테마 시스템 (THEME-SYSTEM)]
        │     └── [3Depth: 전역 테마(다크/라이트/시스템) 스위칭 및 깜빡임 방지 테마 공급기] (FUNC-THEME-001)
        └── [2Depth: 커맨드 팔레트 (NAV-PALETTE)]
              └── [3Depth: 전역 커맨드 팔레트(Cmd+K) 및 파워 유저 키보드 단축키 오케스트레이션] (FUNC-NAV-001)
```

---

## 2. 전체 단위 기능 목록 요약 (Function Index)

모든 단위 기능은 도메인별 상세기능정의서(`docs/spec-writer/fsd/*.md`)에 7대 상세 명세가 완비되어 있습니다.

| 기능 ID | 1Depth (도메인) | 2Depth (화면/모듈) | 3Depth (단위기능명) | 우선순위 | 대응 요구사항 ID | 상세 명세 문서 링크 |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `FUNC-FEED-001` | 뉴스 피드 | 메인 피드 | 다차원 카테고리/출처/고신호 필터링 및 피드 카드 목록 조회 | Must | `REQ-FEED-001` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-FEED-002` | 뉴스 피드 | 상단 검색바 | 실시간 키워드 및 기술 태그 검색 | Must | `REQ-FEED-001` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-FEED-003` | 뉴스 피드 | 아티클 상세 모달 | 3-Bullet TL;DR, Why It Matters 상세 모달 및 전용 챗 연동 | Must | `REQ-FEED-002` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-FEED-004` | 뉴스 피드 | 상세 모달 질의 패널 | 특정 아티클 대상 대화형 Ask AI 질의 및 전용 챗 핸드오버 | Must | `REQ-FEED-003` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-FEED-005` | 뉴스 피드 | 북마크 탭 | 브라우저 로컬 저장소 기반 개인 북마크 보관 및 열람 | Should | `REQ-FEED-004` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-FEED-006` | 뉴스 피드 | Tech Radar 아코디언 | 급상승 기술 스택·카테고리 점유율·태그 클라우드 조회 | Must | `REQ-RADAR-001` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-FEED-007` | 뉴스 피드 | 피드 포커스 제어 | 파워 유저 키보드 단축키(j/k 탐색, /, b, c) 및 피드 포커스 내비게이션 | Must | `REQ-SHORTCUT-001` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-BRIEF-001` | 일일 브리핑 | 브리핑 배너/모달 | 오늘의 AI 종합 브리핑 열람 및 마크다운 다운로드 | Must | `REQ-BRIEF-001` | [`fsd/02_BRIEFING_SPECIFICATION.md`](./fsd/02_BRIEFING_SPECIFICATION.md) |
| `FUNC-BRIEF-002` | 일일 브리핑 | 브리핑 설정 모달 | Notion 1-클릭 페이지 생성 및 동기화 | Must | `REQ-BRIEF-002` | [`fsd/02_BRIEFING_SPECIFICATION.md`](./fsd/02_BRIEFING_SPECIFICATION.md) |
| `FUNC-BRIEF-003` | 일일 브리핑 | 브리핑 설정 모달 | SMTP 이메일 수동 발송 및 자동 예약 발송 | Must | `REQ-BRIEF-002` | [`fsd/02_BRIEFING_SPECIFICATION.md`](./fsd/02_BRIEFING_SPECIFICATION.md) |
| `FUNC-SRC-001` | 수집원 관리 | 소스 관리 모달 | 신규 RSS 피드 및 GitHub 레포지토리 등록 | Must | `REQ-SRC-001` | [`fsd/03_SOURCES_SPECIFICATION.md`](./fsd/03_SOURCES_SPECIFICATION.md) |
| `FUNC-SRC-002` | 수집원 관리 | 소스 관리 모달 | 소스 항목별 수집 On/Off 토글 및 영구 삭제 | Must | `REQ-SRC-001` | [`fsd/03_SOURCES_SPECIFICATION.md`](./fsd/03_SOURCES_SPECIFICATION.md) |
| `FUNC-SRC-003` | 수집원 관리 | 딥 리서처 탭 | AI Deep Researcher 자율 소스 분석 및 자동 채택 | Should | `REQ-SRC-002` | [`fsd/03_SOURCES_SPECIFICATION.md`](./fsd/03_SOURCES_SPECIFICATION.md) |
| `FUNC-SYS-001` | 시스템 운영 | 스케줄 모달 | 정기 크론 스케줄 모니터링 및 즉시 수동 수집 트리거 | Must | `REQ-SETT-001` | [`fsd/04_SETTINGS_SPECIFICATION.md`](./fsd/04_SETTINGS_SPECIFICATION.md) |
| `FUNC-SYS-002` | 시스템 운영 | 초기화 확인 모달 | 수집 데이터 전체 초기화 및 클린 재수집 (Reset & Recollect) | Must | `REQ-RESET-001` | [`fsd/04_SETTINGS_SPECIFICATION.md`](./fsd/04_SETTINGS_SPECIFICATION.md) |
| `FUNC-SYS-003` | 시스템 운영 | 웹훅 모달 | 슬랙 및 디스코드 웹훅 연동 및 실시간 알림 | Should | `REQ-SETT-002` | [`fsd/04_SETTINGS_SPECIFICATION.md`](./fsd/04_SETTINGS_SPECIFICATION.md) |
| `FUNC-SYS-004` | 시스템 운영 | FastMCP 모달 | FastMCP 에이전트 인터페이스 및 도구 제공 | Must | `REQ-MCP-001` | [`fsd/04_SETTINGS_SPECIFICATION.md`](./fsd/04_SETTINGS_SPECIFICATION.md) |
| `FUNC-SYS-005` | 시스템 운영 | 서비스 레이어 | 백엔드 멀티 프로바이더 LLM 가용성 검증 및 장애 안내 | Must | `REQ-LLM-001` | [`fsd/04_SETTINGS_SPECIFICATION.md`](./fsd/04_SETTINGS_SPECIFICATION.md) |
| `FUNC-CHAT-001` | 전용 AI 챗 | 챗 워크스페이스 | 독립형 전용 AI 챗 워크스페이스 레이아웃 및 세션 관리 | Must | `REQ-CHAT-001` | [`fsd/05_AI_CHAT_SPECIFICATION.md`](./fsd/05_AI_CHAT_SPECIFICATION.md) |
| `FUNC-CHAT-002` | 전용 AI 챗 | 컨텍스트 연동 | 뉴스 카드 및 상세 모달에서의 컨텍스트 핸드오버 | Must | `REQ-CHAT-002` | [`fsd/05_AI_CHAT_SPECIFICATION.md`](./fsd/05_AI_CHAT_SPECIFICATION.md) |
| `FUNC-CHAT-003` | 전용 AI 챗 | 질의응답 엔진 | 듀얼 스코프(Scoped vs Global) 지식 검색 및 스트리밍 질의응답 | Must | `REQ-CHAT-003` | [`fsd/05_AI_CHAT_SPECIFICATION.md`](./fsd/05_AI_CHAT_SPECIFICATION.md) |
| `FUNC-CHAT-004` | 전용 AI 챗 | 인용 및 출처 | 클릭형 인라인 인용 배지(`[1]`, `[2]`, `[S1]`) 및 출처 뉴스 프리뷰 연동 | Must | `REQ-CHAT-004` | [`fsd/05_AI_CHAT_SPECIFICATION.md`](./fsd/05_AI_CHAT_SPECIFICATION.md) |
| `FUNC-CHAT-005` | 전용 AI 챗 | 경량 RAG 리트리버 | 개인용 경량 코퍼스 검색(FTS5/BM25 + Quality Score) 및 파사드 | Must | `REQ-CHAT-005` | [`fsd/05_AI_CHAT_SPECIFICATION.md`](./fsd/05_AI_CHAT_SPECIFICATION.md) |
| `FUNC-CHAT-006` | 전용 AI 챗 | 포커스 필터 피커 | 수집 소식 타깃팅 포커스 캡슐 및 바텀 시트 필터 피커 | Must | `REQ-CHAT-007` | [`fsd/05_AI_CHAT_SPECIFICATION.md`](./fsd/05_AI_CHAT_SPECIFICATION.md) |
| `FUNC-CHAT-007` | 전용 AI 챗 | 모바일 뷰포트 제어 | 모바일 반응형 가상키보드 대응 및 뷰포트 안정성 제어 | Must | `REQ-CHAT-008` | [`fsd/05_AI_CHAT_SPECIFICATION.md`](./fsd/05_AI_CHAT_SPECIFICATION.md) |
| `FUNC-CHAT-008` | 전용 AI 챗 | 원본 심층 분석 | 원본 소스 실시간 전문 수집 및 심층 엔지니어링 분석 | Must | `REQ-CHAT-009` | [`fsd/05_AI_CHAT_SPECIFICATION.md`](./fsd/05_AI_CHAT_SPECIFICATION.md) |
| `FUNC-CHAT-009` | 전용 AI 챗 | 에이전틱 리서치 | 자율 보충 검색(Agentic Web Search) 및 실시간 워크플로우 진행 상태 UX | Must | `REQ-CHAT-010` | [`fsd/05_AI_CHAT_SPECIFICATION.md`](./fsd/05_AI_CHAT_SPECIFICATION.md) |
| `FUNC-CHAT-010` | 전용 AI 챗 | 메시지 렌더러 | AI 챗 응답 자동 줄바꿈 및 코드/테이블 블록 국소 스크롤 격리 제어 | Must | `REQ-CHAT-011` | [`fsd/05_AI_CHAT_SPECIFICATION.md`](./fsd/05_AI_CHAT_SPECIFICATION.md) |
| `FUNC-CHAT-011` | 전용 AI 챗 | 리포트 익스포트 | 심층 엔지니어링 리포트 4단 구조화 템플릿 합성 및 원클릭 익스포트 제어 | Must | `REQ-EXPORT-001` | [`fsd/05_AI_CHAT_SPECIFICATION.md`](./fsd/05_AI_CHAT_SPECIFICATION.md) |
| `FUNC-CHAT-012` | 전용 AI 챗 | 세션 히스토리/복원 | 대화 세션 히스토리 사이드바/드로어 및 멀티턴 대화 복원/지속 관리 | Must | `REQ-CHAT-012` | [`fsd/05_AI_CHAT_SPECIFICATION.md`](./fsd/05_AI_CHAT_SPECIFICATION.md) |
| `FUNC-THEME-001` | UI 테마 | 전역 헤더 | 전역 테마(다크/라이트/시스템) 스위칭 및 깜빡임 방지 테마 공급기 | Must | `REQ-THEME-001` | [`fsd/06_UI_THEME_AND_HOTKEYS_SPECIFICATION.md`](./fsd/06_UI_THEME_AND_HOTKEYS_SPECIFICATION.md) |
| `FUNC-NAV-001` | UI 테마 | 전역 모달 | 전역 커맨드 팔레트(Cmd+K) 및 파워 유저 키보드 단축키 오케스트레이션 | Must | `REQ-SHORTCUT-001` | [`fsd/06_UI_THEME_AND_HOTKEYS_SPECIFICATION.md`](./fsd/06_UI_THEME_AND_HOTKEYS_SPECIFICATION.md) |
| `FUNC-COLL-005` | 데이터 수집 | 수집 배치 엔진 | 고신호 데이터 수집/정제/요약/태깅 파이프라인 (기본 모델 & 멀티 프로바이더 지원) | Must | `REQ-COLL-005` | [`fsd/07_LLM_INTEGRATION_AND_MODEL_SELECTOR_SPECIFICATION.md`](./fsd/07_LLM_INTEGRATION_AND_MODEL_SELECTOR_SPECIFICATION.md) |
| `FUNC-CHAT-013` | 전용 AI 챗 | 헤더 & 입력창 | AI 챗 상단 헤더 & 입력창 듀얼 멀티 모델 셀렉터 | Must | `REQ-CHAT-013` | [`fsd/07_LLM_INTEGRATION_AND_MODEL_SELECTOR_SPECIFICATION.md`](./fsd/07_LLM_INTEGRATION_AND_MODEL_SELECTOR_SPECIFICATION.md) |

---

## 3. 도메인별 분할 명세서 맵 (Modular FSD Map)

- [뉴스 피드, 큐레이션, Tech Radar 및 피드 단축키 상세기능정의서](./fsd/01_NEWS_FEED_SPECIFICATION.md)
- [일일 브리핑 및 외부 지식 공유 상세기능정의서](./fsd/02_BRIEFING_SPECIFICATION.md)
- [수집원 관리 및 딥 리서처 상세기능정의서](./fsd/03_SOURCES_SPECIFICATION.md)
- [시스템 운영, 리셋, 웹훅, FastMCP 및 멀티 LLM 가용성 검증 상세기능정의서](./fsd/04_SETTINGS_SPECIFICATION.md)
- [전용 AI 챗, RAG, 4단 리포트 익스포트 및 세션 영속화 상세기능정의서](./fsd/05_AI_CHAT_SPECIFICATION.md)
- [전역 UI 테마(다크모드) 및 파워 유저 커맨드 팔레트 상세기능정의서](./fsd/06_UI_THEME_AND_HOTKEYS_SPECIFICATION.md)
- [멀티 프로바이더 LLM 통합, 고신호 수집 파이프라인 및 듀얼 멀티 모델 셀렉터 상세기능정의서](./fsd/07_LLM_INTEGRATION_AND_MODEL_SELECTOR_SPECIFICATION.md)
