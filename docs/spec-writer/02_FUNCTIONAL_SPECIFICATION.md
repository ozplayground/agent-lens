# AgentLens 전체 기능정의서 인덱스 (Functional Specification Index)

- **작성일자**: 2026-09-15
- **작성자**: 기획 명세 작성가 (`spec-writer`)
- **문서 버전**: v2.0
- **상태**: Approved

---

## 1. 기능 계층 구조도 (Feature Hierarchy Tree)

```
[1Depth: 도메인]
  ├── [1Depth: 피드 & 큐레이션 (FEED)]
  │     ├── [2Depth: 피드 브라우징 (FEED-BROWSE)]
  │     │     ├── [3Depth: 카테고리/출처/고신호 필터링] (FUNC-FEED-001)
  │     │     └── [3Depth: 키워드 및 태그 검색] (FUNC-FEED-002)
  │     ├── [2Depth: 아티클 상세 & 질의 (FEED-DETAIL)]
  │     │     ├── [3Depth: 3줄 요약/시사점/기술스택 상세 모달] (FUNC-FEED-003)
  │     │     └── [3Depth: 아티클 대화형 Ask AI 질의응답] (FUNC-FEED-004)
  │     └── [2Depth: 개인화 보관 (FEED-BOOKMARK)]
  │           └── [3Depth: 로컬 북마크 토글 및 보관함 열람] (FUNC-FEED-005)
  │
  ├── [1Depth: 일일 브리핑 & 연동 (BRIEFING)]
  │     ├── [2Depth: 브리핑 열람 (BRIEF-VIEW)]
  │     │     ├── [3Depth: 오늘의 AI 브리핑 배너 & 모달 열람] (FUNC-BRIEF-001)
  │     │     └── [3Depth: 브리핑 마크다운 리포트 복사/다운로드] (FUNC-BRIEF-002)
  │     └── [2Depth: 외부 채널 익스포트 (BRIEF-EXPORT)]
  │           ├── [3Depth: Notion 페이지 1-클릭 생성 및 동기화] (FUNC-BRIEF-003)
  │           └── [3Depth: SMTP 이메일 수동 발송 및 자동 발송] (FUNC-BRIEF-004)
  │
  ├── [1Depth: 수집원 관리 & 리서처 (SOURCES)]
  │     ├── [2Depth: 수집 소스 설정 (SRC-CONFIG)]
  │     │     ├── [3Depth: RSS 피드 및 GitHub 레포지토리 관리] (FUNC-SRC-001)
  │     │     └── [3Depth: 소스별 수집 활성화/비활성화 토글] (FUNC-SRC-002)
  │     └── [2Depth: 자율 리서처 (SRC-RESEARCH)]
  │           └── [3Depth: AI Deep Researcher 기반 피드 자동 채택] (FUNC-SRC-003)
  │
  └── [1Depth: 시스템 운영 & 에이전트 연동 (SYSTEM)]
        ├── [2Depth: 스케줄 및 온디맨드 수집 (SYS-SCHEDULE)]
        │     ├── [3Depth: 크론 스케줄 현황 조회 및 즉시 수동 수집] (FUNC-SYS-001)
        │     └── [3Depth: 슬랙/디스코드 웹훅 알림 설정] (FUNC-SYS-002)
        └── [2Depth: FastMCP 에이전트 인터페이스 (SYS-MCP)]
              └── [3Depth: FastMCP 서버 도구(Tools) 및 리소스 제공] (FUNC-SYS-003)
```

---

## 2. 전체 단위 기능 목록 요약 (Function Index)

모든 단위 기능은 도메인별 상세기능정의서(`docs/spec-writer/fsd/*.md`)에 7대 상세 명세 및 8대 UI 표준 데이터 명세가 완비되어 있습니다.

| 기능 ID | 1Depth (도메인) | 2Depth (화면/모듈) | 3Depth (단위기능명) | 우선순위 | 대응 요구사항 ID | 상세 명세 문서 링크 |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `FUNC-FEED-001` | 뉴스 피드 | 메인 피드 | 카테고리/출처/고신호 필터링 및 다중 정렬 | Must | `REQ-FEED-001` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-FEED-002` | 뉴스 피드 | 상단 검색바 | 실시간 키워드 및 기술 태그 검색 | Must | `REQ-FEED-001` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-FEED-003` | 뉴스 피드 | 카드 및 상세 뷰 | 3-Bullet TL;DR 및 Why It Matters 조회 | Must | `REQ-FEED-002` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-FEED-004` | 뉴스 피드 | 상세 모달 | 특정 아티클 대상 대화형 Ask AI 질의 | Must | `REQ-FEED-003` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-FEED-005` | 뉴스 피드 | 북마크 탭 | 브라우저 로컬스토리지 기반 보관함 관리 | Should | `REQ-FEED-004` | [`fsd/01_NEWS_FEED_SPECIFICATION.md`](./fsd/01_NEWS_FEED_SPECIFICATION.md) |
| `FUNC-BRIEF-001`| 일일 브리핑 | 브리핑 배너/모달 | 4대 카테고리 종합 인텔리전스 리포트 열람 | Must | `REQ-BRIEF-001` | [`fsd/02_BRIEFING_SPECIFICATION.md`](./fsd/02_BRIEFING_SPECIFICATION.md) |
| `FUNC-BRIEF-002`| 일일 브리핑 | 브리핑 모달 | 브리핑 전문 마크다운 복사 및 다운로드 | Must | `REQ-BRIEF-001` | [`fsd/02_BRIEFING_SPECIFICATION.md`](./fsd/02_BRIEFING_SPECIFICATION.md) |
| `FUNC-BRIEF-003`| 일일 브리핑 | 브리핑 설정 모달 | Notion API 연동 및 1-클릭 페이지 내보내기 | Must | `REQ-BRIEF-002` | [`fsd/02_BRIEFING_SPECIFICATION.md`](./fsd/02_BRIEFING_SPECIFICATION.md) |
| `FUNC-BRIEF-004`| 일일 브리핑 | 브리핑 설정 모달 | SMTP 이메일 전송 및 자동 발송 예약 | Must | `REQ-BRIEF-002` | [`fsd/02_BRIEFING_SPECIFICATION.md`](./fsd/02_BRIEFING_SPECIFICATION.md) |
| `FUNC-SRC-001`  | 수집원 관리 | 소스 관리 모달 | 신규 RSS/Atom 피드 및 GitHub 레포지토리 등록 | Must | `REQ-SRC-001` | [`fsd/03_SOURCES_SPECIFICATION.md`](./fsd/03_SOURCES_SPECIFICATION.md) |
| `FUNC-SRC-002`  | 수집원 관리 | 소스 관리 모달 | 소스 항목별 수집 On/Off 토글 및 영구 삭제 | Must | `REQ-SRC-001` | [`fsd/03_SOURCES_SPECIFICATION.md`](./fsd/03_SOURCES_SPECIFICATION.md) |
| `FUNC-SRC-003`  | 수집원 관리 | 딥 리서처 탭 | AI Deep Researcher 자율 소스 분석 및 자동 채택 | Should | `REQ-SRC-002` | [`fsd/03_SOURCES_SPECIFICATION.md`](./fsd/03_SOURCES_SPECIFICATION.md) |
| `FUNC-SYS-001`  | 시스템 운영 | 스케줄 모달 | 정기 수집 현황 모니터링 및 즉시 수집 트리거 | Must | `REQ-SETT-001` | [`fsd/04_SETTINGS_SPECIFICATION.md`](./fsd/04_SETTINGS_SPECIFICATION.md) |
| `FUNC-SYS-002`  | 시스템 운영 | 웹훅 모달 | 슬랙 및 디스코드 웹훅 연동/테스트 전송 | Should | `REQ-SETT-002` | [`fsd/04_SETTINGS_SPECIFICATION.md`](./fsd/04_SETTINGS_SPECIFICATION.md) |
| `FUNC-SYS-003`  | 시스템 운영 | MCP 모달 | Claude Desktop config 연동 및 FastMCP 도구 제공 | Must | `REQ-MCP-001` | [`fsd/04_SETTINGS_SPECIFICATION.md`](./fsd/04_SETTINGS_SPECIFICATION.md) |

---

## 3. 도메인별 분할 명세서 맵 (Modular FSD Map)

- [01. 뉴스 피드 및 큐레이션 상세기능정의서](./fsd/01_NEWS_FEED_SPECIFICATION.md)
- [02. 일일 브리핑 및 외부 연동 상세기능정의서](./fsd/02_BRIEFING_SPECIFICATION.md)
- [03. 수집원 관리 및 딥 리서처 상세기능정의서](./fsd/03_SOURCES_SPECIFICATION.md)
- [04. 시스템 설정, 웹훅 및 MCP 상세기능정의서](./fsd/04_SETTINGS_SPECIFICATION.md)
