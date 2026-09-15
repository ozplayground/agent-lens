# AgentLens UI 컴포넌트 계층 및 디자인 명세서 (Component Spec)

- **작성일자**: 2026-09-15
- **작성자**: UI 시스템 디자이너 (`ui-system-designer`)
- **문서 버전**: v2.0
- **상태**: Approved

---

## 1. 컴포넌트 계층도 및 트리 구조 (Component Hierarchy Tree)

```
app/layout.tsx (RSC: 전역 레이아웃, 메타데이터, 다크 테마 컨텍스트)
└── app/page.tsx (RCC: 메인 대시보드 오케스트레이터)
      ├── Header.tsx (RCC: 헤더 로고, 핫니스 정렬, 통계 뱃지, 글로벌 모달 트리거)
      ├── DailyBriefingBanner.tsx (RCC: 상단 오늘의 AI 브리핑 요약 배너)
      ├── CategoryFilter.tsx (RCC: 4대 카테고리 탭 버튼 그룹)
      ├── SourceFilter.tsx (RCC: 출처별 필터 및 북마크 탭 칩 목록)
      ├── TechRadar.tsx (RCC: 카테고리별 핵심 기술 스택 레이더 차트)
      ├── NewsFeedGrid (카드 렌더링 그리드)
      │     └── NewsCard.tsx (RCC: 3-Bullet TL;DR, Why It Matters, 북마크, ⭐️ Must Read 뱃지)
      ├── Pagination.tsx (RCC: 18개 단위 페이지네이션)
      └── Modals (지연 마운트 모달 시스템)
            ├── NewsDetailModal.tsx (RCC: 상세 요약 + Ask AI 대화형 질문창)
            ├── DailyBriefingModal.tsx (RCC: 브리핑 전문 마크다운 뷰어, 복사/다운로드)
            ├── BriefingSettingsModal.tsx (RCC: Notion & SMTP 이메일 연동 설정)
            ├── SourcesModal.tsx (RCC: RSS/GitHub 등록 및 Autonomous Deep Researcher)
            ├── ScheduleModal.tsx (RCC: 크론 상태 확인 및 온디맨드 즉시 수집)
            ├── WebhookSettingsModal.tsx (RCC: Slack/Discord 웹훅 설정 및 테스트)
            └── McpModal.tsx (RCC: FastMCP Claude Desktop 연동 가이드)
```

---

## 2. Server Component (RSC) vs Client Component (RCC) 분리 전략

| 컴포넌트명 | 구분 | 사유 및 역할 |
| :--- | :---: | :--- |
| `layout.tsx` | **RSC** | HTML 메타데이터 주입, 기본 폰트 로딩, SSR 정적 골격 제공 |
| `page.tsx` | **RCC** | 필터 상태(`category`, `source`, `sort`), 검색어, 모달 온/오프 등 상호작용 제어 |
| `NewsCard.tsx` | **RCC** | 북마크 클릭 이벤트 전파 차단(`stopPropagation`), 카드 클릭 시 모달 오픈 |
| `NewsDetailModal.tsx`| **RCC** | Ask AI 입력 및 로컬 상태 관리, 외부 클릭/ESC 키 이벤트 리스너 바인딩 |
| `DailyBriefingModal.tsx`| **RCC** | 클립보드 복사 API(`navigator.clipboard`), 동적 파일 다운로드 링크 트리거 |
| `MarkdownViewer.tsx`| **RCC** | `react-markdown` 구문 파싱 및 코드 하이라이트 렌더링 |

---

## 3. 디자인 토큰 및 테마 명세 (Design Tokens & Dark Mode)

- **배경색 (Background)**:
  - 라이트 모드: `bg-slate-50` / `bg-white`
  - 다크 모드 (기본): `bg-slate-950` / `bg-slate-900` / `border-slate-800`
- **강조 색상 (Accent Colors)**:
  - 에이전트/하네스: `indigo-500` / `indigo-600`
  - MCP & 스킬: `emerald-500` / `emerald-600`
  - ⭐️ Must Read (하이 시그널): `amber-400` / `amber-500`
  - 화제성(Hot): `rose-500` / `orange-500`
- **반응형 브레이크포인트 (Breakpoints)**:
  - Mobile (`< 640px`): 1열 카드 레이아웃, 모달 전체 화면(Full screen Sheet) 적용
  - Tablet (`640px ~ 1024px`): 2열 카드 그리드
  - Desktop (`>= 1024px`): 3열 카드 그리드, 모달 중앙 고정 오버레이 (최대 폭 `max-w-4xl`)
