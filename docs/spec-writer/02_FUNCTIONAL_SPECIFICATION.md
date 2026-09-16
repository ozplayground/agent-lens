# AgentLens 전체 기능정의서 인덱스 (Functional Specification Index)

- **작성일자**: 2026-09-16
- **작성자**: 기획 명세 작성가 (`spec-writer`)
- **문서 버전**: v2.1
- **상태**: Approved

---

## 1. 기능 계층 구조도 (Feature Hierarchy Tree)

```
[1Depth: AgentLens]
  ├── [1Depth: 피드 & 큐레이션 및 트렌드 (FEED)]
  │     ├── [2Depth: 피드 브라우징 (FEED-BROWSE)]
  │     │     ├── [3Depth: 카테고리/출처/고신호 필터링 및 다중 정렬] (FUNC-FEED-001)
  │     │     └── [3Depth: 실시간 키워드 및 기술 태그 검색] (FUNC-FEED-002)
  │     ├── [2Depth: 아티클 상세 & 질의 (FEED-DETAIL)]
  │     │     ├── [3Depth: 3줄 요약/시사점/기술스택 상세 모달] (FUNC-FEED-003)
  │     │     └── [3Depth: 아티클 대화형 Ask AI 질의응답] (FUNC-FEED-004)
  │     ├── [2Depth: 개인화 보관 (FEED-BOOKMARK)]
  │     │     └── [3Depth: 로컬 북마크 토글 및 보관함 열람] (FUNC-FEED-005)
  │     └── [2Depth: 에이전트 Tech Radar (FEED-RADAR)]
  │           └── [3Depth: 급상승 기술 스택·카테고리 점유율·태그 클라우드] (FUNC-FEED-006)
  │
  ├── [1Depth: 일일 브리핑 & 지식 공유 (BRIEFING)]
  │     ├── [2Depth: 브리핑 열람 (BRIEF-VIEW)]
  │     │     └── [3Depth: 오늘의 AI 종합 브리핑 배너/모달 열람 & 마크다운 다운로드] (FUNC-BRIEF-001)
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
  └── [1Depth: 시스템 운영, 알림 & 에이전트 연동 (SYSTEM)]
        ├── [2Depth: 스케줄 및 온디맨드 수집 (SYS-SCHEDULE)]
        │     ├── [3Depth: 크론 스케줄 현황 모니터링 및 즉시 수동 수집 트리거] (FUNC-SYS-001)
        │     └── [3Depth: 수집 데이터 전체 초기화 및 클린 재수집 (Reset & Recollect)] (FUNC-SYS-002)
        ├── [2Depth: 웹훅 알림 (SYS-WEBHOOK)]
        │     └── [3Depth: 슬랙 및 디스코드 웹훅 연동 및 실시간 알림] (FUNC-SYS-003)
        └── [2Depth: FastMCP 에이전트 인터페이스 (SYS-MCP)]
              └── [3Depth: FastMCP 에이전트 도구 및 리소스 제공] (FUNC-SYS-004)
```

---

## 2. 전체 단위 기능 목록 요약 (Function Index)

모든 단위 기능은 도메인별 상세기능정의서(`docs/spec-writer/fsd/*.md`)에 **7대 상세 명세** 및 **8대 UI 표준 데이터 명세**가 완비되어 있습니다.

| 기능 ID | 1Depth (도메인) | 2Depth (화면/모듈) | 3Depth (단위기능명) | 우선순위 | 대응 요구사항 ID | 상세 명세 문서 링크 |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `FUNC-FEED-001` | 뉴스 피드 | 메인 피드 | 다차원 카테고리/출처/고신호 필터링 및 카드 목록 조회 | Must | `REQ-FEED-001` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-FEED-002` | 뉴스 피드 | 상단 검색바 | 실시간 키워드 및 기술 태그 검색 | Must | `REQ-FEED-001` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-FEED-003` | 뉴스 피드 | 아티클 상세 모달 | 3-Bullet TL;DR 및 Why It Matters 상세 조회 | Must | `REQ-FEED-002` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-FEED-004` | 뉴스 피드 | 상세 모달 질의 패널 | 특정 아티클 대상 대화형 Ask AI 질의응답 | Must | `REQ-FEED-003` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-FEED-005` | 뉴스 피드 | 북마크 탭 | 브라우저 로컬 저장소 기반 개인 북마크 보관 및 열람 | Should | `REQ-FEED-004` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-FEED-006` | 뉴스 피드 | Tech Radar 아코디언 | 급상승 기술 스택·카테고리 점유율·태그 클라우드 조회 | Must | `REQ-RADAR-001` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-BRIEF-001`| 일일 브리핑 | 브리핑 배너/모달 | 오늘의 AI 종합 브리핑 열람 및 마크다운 다운로드 | Must | `REQ-BRIEF-001` | [`fsd/02_BRIEFING_SPECIFICATION.md`](./fsd/02_BRIEFING_SPECIFICATION.md) |
| `FUNC-BRIEF-002`| 일일 브리핑 | 브리핑 설정 모달 | Notion 1-클릭 페이지 생성 및 동기화 | Must | `REQ-BRIEF-002` | [`fsd/02_BRIEFING_SPECIFICATION.md`](./fsd/02_BRIEFING_SPECIFICATION.md) |
| `FUNC-BRIEF-003`| 일일 브리핑 | 브리핑 설정 모달 | SMTP 이메일 수동 발송 및 자동 예약 발송 | Must | `REQ-BRIEF-002` | [`fsd/02_BRIEFING_SPECIFICATION.md`](./fsd/02_BRIEFING_SPECIFICATION.md) |
| `FUNC-SRC-001`  | 수집원 관리 | 소스 관리 모달 | 신규 RSS 피드 및 GitHub 레포지토리 등록 | Must | `REQ-SRC-001` | [`fsd/03_SOURCES_SPECIFICATION.md`](./fsd/03_SOURCES_SPECIFICATION.md) |
| `FUNC-SRC-002`  | 수집원 관리 | 소스 관리 모달 | 소스 항목별 수집 On/Off 토글 및 영구 삭제 | Must | `REQ-SRC-001` | [`fsd/03_SOURCES_SPECIFICATION.md`](./fsd/03_SOURCES_SPECIFICATION.md) |
| `FUNC-SRC-003`  | 수집원 관리 | 딥 리서처 탭 | AI Deep Researcher 자율 소스 분석 및 자동 채택 | Should | `REQ-SRC-002` | [`fsd/03_SOURCES_SPECIFICATION.md`](./fsd/03_SOURCES_SPECIFICATION.md) |
| `FUNC-SYS-001`  | 시스템 운영 | 스케줄 모달 | 정기 크론 스케줄 모니터링 및 즉시 수동 수집 트리거 | Must | `REQ-SETT-001` | [`fsd/04_SETTINGS_SPECIFICATION.md`](./fsd/04_SETTINGS_SPECIFICATION.md) |
| `FUNC-SYS-002`  | 시스템 운영 | 초기화 확인 모달 | 수집 데이터 전체 초기화 및 클린 재수집 (Reset & Recollect) | Must | `REQ-RESET-001` | [`fsd/04_SETTINGS_SPECIFICATION.md`](./fsd/04_SETTINGS_SPECIFICATION.md) |
| `FUNC-SYS-003`  | 시스템 운영 | 웹훅 모달 | 슬랙 및 디스코드 웹훅 연동 및 실시간 알림 | Should | `REQ-SETT-002` | [`fsd/04_SETTINGS_SPECIFICATION.md`](./fsd/04_SETTINGS_SPECIFICATION.md) |
| `FUNC-SYS-004`  | 시스템 운영 | FastMCP 모달 | FastMCP 에이전트 인터페이스 및 도구 제공 | Must | `REQ-MCP-001` | [`fsd/04_SETTINGS_SPECIFICATION.md`](./fsd/04_SETTINGS_SPECIFICATION.md) |

---

## 3. 도메인별 분할 명세서 맵 (Modular FSD Map)

- [01. 뉴스 피드, 큐레이션 및 Tech Radar 상세기능정의서](./fsd/01_NEWS_FEED_SPECIFICATION.md)
- [02. 일일 브리핑 및 외부 지식 공유 상세기능정의서](./fsd/02_BRIEFING_SPECIFICATION.md)
- [03. 수집원 관리 및 딥 리서처 상세기능정의서](./fsd/03_SOURCES_SPECIFICATION.md)
- [04. 시스템 운영, 리셋, 웹훅 및 FastMCP 상세기능정의서](./fsd/04_SETTINGS_SPECIFICATION.md)
