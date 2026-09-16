# AgentLens UI 컴포넌트 계층 및 디자인 명세서 (Component & Design Spec)

- **작성일자**: 2026-09-16
- **작성자**: UI 시스템 디자이너 (`ui-system-designer`)
- **문서 버전**: v2.1
- **상태**: Approved
- **적용 프레임워크**: Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide React

---

## 1. 컴포넌트 계층 트리 구조도 (Component Hierarchy Tree)

Next.js App Router 아키텍처 기반의 전체 컴포넌트 계층 구조입니다.
최근 리팩토링을 통해 메인 페이지(`page.tsx`)의 비즈니스 로직은 커스텀 훅(`useNewsFeed`, `useBookmarks`)으로 분리되었으며, 비대해진 모달 내부 뷰는 독립된 서브 컴포넌트(`AskAiPanel`, `DeepResearcherTab`, `SourcesListTab`)로 캡슐화되었습니다.

```
src/app/layout.tsx (RSC: 전역 레이아웃, 메타데이터, 폰트 주입, Pure Light Mode 루트 컨텍스트)
└── src/app/page.tsx (RCC: 대시보드 오케스트레이터 - useNewsFeed, useBookmarks 훅 주입)
      │
      ├── [Global Nav] src/components/Header.tsx (RCC)
      │     ├── Brand & Version Live Badge
      │     ├── Global Action Buttons (소스&리서처, MCP, RSS, 공유&알림, 스케줄 카운트다운)
      │     ├── Danger Modal: Reset & Recollect Confirmation Modal
      │     └── Live Crawl Streaming Progress Bar
      │
      ├── [Intelligence Banner] src/components/DailyBriefingBanner.tsx (RCC)
      │
      ├── [System Metrics Bar] Overview & Signal Counters
      │
      ├── [Tech Radar Drawer] src/components/TechRadar.tsx (RCC)
      │     ├── Collapsed Quick Preview (Surging Tags)
      │     └── Expanded Drawer (Surging Metrics, Category Distribution, Full Tag Cloud)
      │
      ├── [Category Tabs] src/components/CategoryFilter.tsx (RCC: 5대 카테고리 탭 및 건수 뱃지)
      │
      ├── [Toolbar Area]
      │     ├── src/components/SourceFilter.tsx (RCC: 출처별 필터 칩 + Must-Read 토글)
      │     ├── Search Input Form (RCC: 디바운스/Enter 키워드 검색창)
      │     └── Sort Button Group (RCC: 인기순 / 품질순 / 최신순 / 추천순)
      │
      ├── [Status & Counter Bar] Total Count / Page Indicator
      │
      ├── [News Grid Container]
      │     ├── Loading State (Loader2 Spinner)
      │     ├── Error State (Alert Banner & Retry Button)
      │     ├── Empty State (Zero-Result Callout & Filter Reset Button)
      │     └── NewsCard Grid (Responsive 1/2/3 Columns)
      │           └── src/components/NewsCard.tsx (RCC)
      │                 ├── Category & Source Badges
      │                 ├── Must-Read (High Signal) Badge & Hotness Score
      │                 ├── Bookmark Toggle Button (stopPropagation)
      │                 ├── 2-Line Clamped Title
      │                 ├── Why It Matters (Developer Insight Callout)
      │                 ├── Tech Stack Pills
      │                 └── Metadata & Original Source Link
      │
      ├── [Pagination Bar] Prev / Page Indicator / Next
      │
      ├── [Global Footer] Static Copyright & System Spec
      │
      └── [Dialog / Modal System] (조건부 렌더링 & 포털 오버레이)
            ├── src/components/NewsDetailModal.tsx (RCC: 탭 네비게이션 & 메타 헤더)
            │     ├── Tab 1: AI 요약 & 시사점 본문
            │     │     ├── Executive TL;DR Bullets
            │     │     ├── Tech Stack Badges
            │     │     └── src/components/MarkdownViewer.tsx (RCC: react-markdown)
            │     └── Tab 2: src/components/news-detail/AskAiPanel.tsx (RCC)
            │           ├── Quick Prompt Suggestion Pills
            │           ├── Chat Message Stream (User Bubble / AI Response Bubble)
            │           │     └── Live Token Streaming Indicator & Code Copy
            │           └── Chat Input Form (Enter/Submit)
            │
            ├── src/components/DailyBriefingModal.tsx (RCC: 오늘의 브리핑 뷰어)
            │     ├── Action Toolbar (Notion 발행, 이메일 전송 팝오버, 마크다운 복사/다운로드)
            │     ├── Tab 1: 카테고리별 요약 (4대 도메인 카드 + Action Items)
            │     └── Tab 2: src/components/MarkdownViewer.tsx (마크다운 전문 뷰어)
            │
            ├── src/components/SourcesModal.tsx (RCC: 수집 소스 및 자율 리서처 모달)
            │     ├── Tab 1: src/components/sources/DeepResearcherTab.tsx (RCC)
            │     │     ├── Autonomous Discovery Engine Overview & Immediate Trigger
            │     │     ├── Status Metric Cards (채택 건수, 품질 기준, 스케줄)
            │     │     ├── Audit Trail List (AUTO_ADOPTED, WATCHLIST, REJECTED 뱃지 및 판정 사유)
            │     │     └── Quick Single URL Inspector & Prober
            │     └── Tab 2: src/components/sources/SourcesListTab.tsx (RCC)
            │           ├── Summary Stats Cards (활성 RSS, 모니터링 GitHub 등)
            │           ├── Manual RSS Feed Registration Form (Add Source)
            │           ├── RSS Feed List with ON/OFF Toggle & Delete
            │           └── Monitored GitHub Repos Section with ON/OFF Toggle
            │
            ├── src/components/BriefingSettingsModal.tsx (RCC: Notion, 이메일 SMTP, 웹훅 설정 탭 모달)
            ├── src/components/ScheduleModal.tsx (RCC: UTC 크론 스케줄 및 잔여 시간 확인)
            └── src/components/McpModal.tsx (RCC: FastMCP Claude Desktop JSON 설정 가이드)
```

---

## 2. Server Component (RSC) vs Client Component (RCC) 분리 전략

Next.js 15 App Router 환경에서 불필요한 JS 클라이언트 번들 증가를 억제하고, 사용자 상호작용과 브라우저 API가 필수적인 영역만을 명확하게 RCC(`'use client'`)로 한정합니다.

| 컴포넌트명 | 구분 | 선정 사유 및 담당 책임 |
| :--- | :---: | :--- |
| `app/layout.tsx` | **RSC** | HTML 메타데이터 주입, Geist 폰트 최적화 로딩, 기본 HTML/Body 태그 렌더링. SSR 단계에서 불변하는 정적 골격 제공 |
| `app/page.tsx` | **RCC** | 대시보드 뷰 컨트롤러. `useNewsFeed`, `useBookmarks` 훅을 소비하며 모달 오픈 상태 관리 및 하위 컴포넌트 이벤트 라우팅 |
| `Header.tsx` | **RCC** | 실시간 크롤러 진행 상태 폴링(`setInterval`), 즉시 수집 트리거, 데이터 초기화 확인 모달 및 전역 모달 오픈 이벤트 핸들링 |
| `DailyBriefingBanner.tsx` | **RCC** | 브리핑 데이터 수신 후 호버 모션 인터랙션 및 모달 트리거 바인딩 |
| `TechRadar.tsx` | **RCC** | 드로어 확장/축소 로컬 상태(`isOpen`), 급상승 태그 클릭 시 상위 피드 검색 쿼리 연동 |
| `CategoryFilter.tsx` | **RCC** | 선택된 카테고리 탭 하이라이트 및 클릭 시 피드 필터링 및 1페이지 리셋 |
| `SourceFilter.tsx` | **RCC** | 출처 칩 토글, 북마크 전용 뷰 전환, Must-Read(High-Signal) 토글 제어 |
| `NewsCard.tsx` | **RCC** | 북마크 토글 시 이벤트 버블링 차단(`e.stopPropagation()`), 상세 모달 오픈, 상대 시간 계산 클라이언트 렌더링 |
| `NewsDetailModal.tsx` | **RCC** | ESC 키 및 오버레이 클릭 시 닫기 핸들링, 탭 전환(`summary` ↔ `ask_ai`), 질의응답 SSE 스트리밍 통신 제어 (`AbortController`) |
| `AskAiPanel.tsx` | **RCC** | 추천 질문 클릭 주입, 실시간 타이핑 커서 애니메이션, 채팅창 자동 스크롤(`scrollIntoView`), 답변 텍스트 클립보드 복사 |
| `DailyBriefingModal.tsx`| **RCC** | 마크다운 다운로드(Blob 생성), 클립보드 복사, Notion API 비동기 발행, 이메일 전송 팝오버 상태 제어 |
| `SourcesModal.tsx` | **RCC** | 탭 전환(`deep_research` ↔ `sources`), Toast 알림 제어, 소스 갱신 시 전역 피드 재조회 콜백 호출 |
| `DeepResearcherTab.tsx` | **RCC** | 자율 딥 리서치 비동기 트리거, 감사 로그 새로고침, 단일 URL 프로빙 폼 입력 상태 관리 |
| `SourcesListTab.tsx` | **RCC** | RSS 피드 등록 폼 토글, 활성/비활성 즉시 토글(`onToggle`), 피드 삭제 확인창(`window.confirm`) |
| `BriefingSettingsModal.tsx` | **RCC** | Notion/이메일/웹훅 연동 설정 입력 폼 제어, API 연결 테스트 호출, 로컬 저장 |
| `ScheduleModal.tsx` | **RCC** | 수집 스케줄 현황 API 조회 및 로컬 시간대 변환 표시 |
| `McpModal.tsx` | **RCC** | Claude Desktop 설정 JSON 클립보드 복사 |
| `MarkdownViewer.tsx` | **RCC** | `react-markdown` 구문 파싱, 커스텀 코드 블록 복사 버튼(`CodeBlock`) 렌더링 |

---

## 3. 핵심 컴포넌트 Props 인터페이스 명세 (Props Contracts)

### 3.1. 피드 및 카드 컴포넌트

#### `NewsCardProps`
```typescript
import { NewsItem } from '@/types/news';

export interface NewsCardProps {
  item: NewsItem;
  onSelect: (item: NewsItem) => void;
  isBookmarked: boolean;
  onToggleBookmark: (item: NewsItem, e: React.MouseEvent) => void;
}
```

#### `CategoryFilterProps`
```typescript
import { CategoryType } from '@/types/news';

export interface CategoryFilterProps {
  currentCategory: CategoryType; // 'all' | 'harness' | 'mcp_plugins_skills' | 'agent_tech' | 'ai_news'
  onSelectCategory: (cat: CategoryType) => void;
  counts?: Record<string, number>;
}
```

#### `SourceFilterProps`
```typescript
export interface SourceFilterProps {
  currentSource: string;
  onSelectSource: (source: string) => void;
  sourceCounts?: Record<string, number>;
  bookmarkCount?: number;
  highSignalOnly?: boolean;
  onToggleHighSignal?: () => void;
}
```

#### `TechRadarProps`
```typescript
import { TechRadarData } from '@/types/trends';

export interface TechRadarProps {
  data: TechRadarData | null;
  activeTag: string | null;
  onSelectTag: (tag: string) => void;
  isLoading?: boolean;
}
```

---

### 3.2. 상세 모달 및 Ask AI 패널 컴포넌트

#### `NewsDetailModalProps`
```typescript
import { NewsItem } from '@/types/news';

export interface NewsDetailModalProps {
  item: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (item: NewsItem) => void;
}
```

#### `AskAiPanelProps` 및 `ChatMessage`
```typescript
import { NewsItem } from '@/types/news';

export interface ChatMessage {
  q: string;
  a: string;
  model?: string;
  time: string;
  isStreaming?: boolean;
}

export interface AskAiPanelProps {
  item: NewsItem;
  question: string;
  setQuestion: (q: string) => void;
  asking: boolean;
  chatHistory: ChatMessage[];
  copiedIndex: number | null;
  onAsk: (queryToAsk?: string) => void;
  onCopy: (text: string, index: number) => void;
  onClearChat: () => void;
}
```

---

### 3.3. 수집원 및 자율 리서처 모달 컴포넌트

#### `SourcesModalProps`
```typescript
export interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSourcesUpdated?: () => void;
}
```

#### `SourcesListTabProps`
```typescript
import { SourcesResponse } from '@/lib/api';

export interface SourcesListTabProps {
  sourcesData: SourcesResponse | null;
  onRefresh: () => void;
  onToggle: (sourceType: string, id: string) => Promise<void>;
  onDelete: (sourceType: string, id: string) => Promise<void>;
  showToast: (type: 'success' | 'error', text: string) => void;
  onSourcesUpdated?: () => void;
}
```

#### `DeepResearcherTabProps`
```typescript
import { ResearchStatus, ResearchAuditLog } from '@/lib/api';

export interface DeepResearcherTabProps {
  researchStatus: ResearchStatus | null;
  auditLogs: ResearchAuditLog[];
  loading: boolean;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', text: string) => void;
  onSourcesUpdated?: () => void;
}
```

---

### 3.4. 헤더 및 브리핑 컴포넌트

#### `HeaderProps`
```typescript
export interface HeaderProps {
  onRefresh: () => void;
  onOpenSchedule: () => void;
  onOpenMcp: () => void;
  onOpenWebhook?: () => void;
  onOpenSources?: () => void;
}
```

#### `DailyBriefingBannerProps` & `DailyBriefingModalProps`
```typescript
import { DailyBriefing } from '@/types/news';

export interface DailyBriefingBannerProps {
  briefing: DailyBriefing | null;
  onOpen: () => void;
}

export interface DailyBriefingModalProps {
  briefing: DailyBriefing | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}
```

#### `BriefingSettingsModalProps`
```typescript
export interface BriefingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'notion' | 'email' | 'webhook';
}
```

---

### 3.5. 비즈니스 로직 분리 커스텀 훅 (Hook Contracts)

#### `useBookmarks`
```typescript
export function useBookmarks(): {
  bookmarkedIds: number[];
  bookmarkedItems: NewsItem[];
  toggleBookmark: (item: NewsItem, e?: React.MouseEvent) => void;
};
```

#### `useNewsFeed`
```typescript
export interface UseNewsFeedProps {
  bookmarkedItems: NewsItem[];
}

export function useNewsFeed(props: UseNewsFeedProps): {
  category: CategoryType;
  setCategory: (c: CategoryType) => void;
  source: string;
  setSource: (s: string) => void;
  search: string;
  setSearch: (s: string) => void;
  sort: string;
  setSort: (s: string) => void;
  highSignalOnly: boolean;
  setHighSignalOnly: (h: boolean) => void;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  selectedTag: string | null;
  handleSelectTag: (tag: string) => void;
  news: NewsItem[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  setError: (e: string | null) => void;
  stats: StatsResponse | null;
  briefing: DailyBriefing | null;
  techRadar: TechRadarData | null;
  loadingRadar: boolean;
  loadNews: () => Promise<void>;
  loadStatsAndBriefing: () => Promise<void>;
  resetFilters: () => void;
};
```

---

## 4. UI 5대 상태 Variants (State Handling Specification)

AgentLens의 모든 주요 뷰는 다음 5가지 표준 UI 상태를 일관되게 처리하도록 설계되었습니다.

| 상태 (State) | 영역 / 컴포넌트 | 시각적 표현 및 컴포넌트 동작 | 사용자 안내 문구 및 액션 |
| :--- | :--- | :--- | :--- |
| **Idle (기본)** | 메인 피드 그리드 | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`의 화이트 카드 레이아웃, `border-slate-200`, 호버 시 `hover:border-blue-400 hover:shadow-md` | 개별 카드 클릭 시 상세 모달 오픈, 북마크 클릭 시 즉각 토글 |
| | Ask AI 대화창 | 상단 추천 질문 칩(`QUICK_PROMPTS`) 4종 노출, 대화 기록 스크롤 뷰, 하단 질문 입력 인풋 활성화 | "이 기술에 대해 무엇이든 질문해보세요..." |
| | 소스 관리 목록 | 활성/비활성 ON/OFF 버튼(`bg-emerald-50 text-emerald-700` vs `bg-slate-100`), 삭제 아이콘 노출 | 피드 ON/OFF 및 삭제 가능 |
| **Loading / Pending** | 메인 피드 그리드 | 중앙 정렬 `Loader2` 스피너 (`w-7 h-7 text-blue-600 animate-spin`) | "소식을 불러오는 중..." |
| | Header 즉시 수집 | 헤더 수집 버튼 스피너 회전 및 비활성화, 상단 진행 바 스트리밍 메시지 노출 | "실시간 소식 수집 중..." / 파이프라인 단계 메시지 |
| | Ask AI 스트리밍 | 전송 버튼 비활성화, 답변 블록에 `Loader2` 및 텍스트 끝단 깜빡이는 블루 커서(`bg-blue-600 animate-pulse`) | "AI가 실시간 스트리밍 답변을 생성하는 중입니다..." |
| | Tech Radar 로딩 | 높이 4의 스켈레톤 펄스 바 (`animate-pulse bg-slate-100`) | 로딩 인디케이터 |
| | Notion / 이메일 발송 | 버튼 내부 텍스트 앞에 회전하는 미니 `Loader2` 아이콘 표시 및 중복 클릭 방지 | "발행 중..." / "발송 중..." |
| **Error (오류)** | 메인 피드 로딩 실패 | `bg-red-50/50 border-dashed border-red-300` 경고 박스 및 빨간색 `AlertCircle` 아이콘 | "데이터를 불러오지 못했습니다." / [다시 시도] 버튼 제공 |
| | Ask AI 통신 오류 | AI 말풍선 내 경고 텍스트 및 에러 뱃지 표기 | "⚠️ AI 응답 생성 실패: 네트워크 상태를 확인해주세요." |
| | 모달 설정/발행 실패 | 모달 상단 `bg-red-50 text-red-700 border-red-200` 슬라이드 토스트 배너 | 에러 메시지 표기 및 "설정 열기" 링크 제공 |
| | 소스 등록 실패 | 모달 내부 상단 경고 토스트 (3.5초 후 자동 소멸) | "피드 추가에 실패했습니다. 유효한 RSS URL인지 확인하세요." |
| **Empty (데이터 없음)**| 검색/필터 결과 0건 | `border-dashed border-slate-300 bg-white` 박스, 돋보기 아이콘, 원클릭 초기화 CTA 버튼 | "조건에 일치하는 소식이 없습니다." / [필터 전체 초기화] |
| | 북마크 탭 비어있음 | 북마크 출처 선택 시 저장된 소식이 없으면 Empty State 안내 노출 | "보관된 소식이 없습니다. 피드에서 북마크 아이콘을 눌러보세요." |
| | 리서처 감사 로그 0건 | 연한 회색 배경(`bg-slate-50`)의 안내 문구 노출 | "아직 기록된 딥 리서치 이력이 없습니다. [자율 딥 리서치 지금 실행] 버튼을 눌러보세요." |
| | Ask AI 첫 진입 | 안내 아이콘(`Bot`) 및 소개 문구, 하단 추천 질문 칩 그리드 노출 | "이 기술에 대해 무엇이든 질문해보세요" |
| **Success (완료)** | 헤더 수집 완료 | 헤더 하단 상태 바 `CheckCircle2` 에메랄드 아이콘 및 신규 반영 건수 안내 | "수집 완료 (+N건 신규 반영)" (4초 후 자동 닫힘) |
| | 클립보드 복사 완료 | 복사 버튼의 아이콘이 `Check`로 전환되며 초록색(`text-emerald-600`) 전환 | "복사됨" (2초 후 원복) |
| | Notion 발행 성공 | 초록색 알림 배너 및 발행된 노션 페이지 바로가기 링크 버튼 생성 | "Notion 페이지 생성 완료! [Notion에서 열기 ↗]" |
| | 소스 상태 변경/추가 | 상단 에메랄드 토스트 배너 노출 | "'{피드명}' 피드가 성공적으로 추가되었습니다." |
| | 설정 저장 완료 | `bg-emerald-50 text-emerald-800` 피드백 배너 | "설정이 안전하게 저장되었습니다." |

---

## 5. Pure Light Mode 디자인 토큰 및 반응형 & 접근성 (Design Tokens, Responsive & a11y)

### 5.1. Pure Light Mode 테마 원칙 및 디자인 토큰

AgentLens는 다크 모드 토글로 인한 레이아웃 깜빡임 및 유지보수 복잡도를 제거하고, **KISS (Keep It Simple, Stupid)** 원칙에 따라 최고 수준의 가독성과 대비를 보장하는 **순수 라이트 모드 (Pure Light Mode)** 단일 테마로 확정되었습니다.

```css
/* 기본 테마 토큰 팔레트 (Tailwind CSS v4 & slate 시스템) */
:root {
  --background: #f8fafc;  /* slate-50 */
  --foreground: #0f172a;  /* slate-900 */
  color-scheme: light;
}
```

| 구분 (Category) | Tailwind 클래스 | Hex 코드 | 적용 영역 및 사용 목적 |
| :--- | :--- | :--- | :--- |
| **Page Background** | `bg-slate-50` | `#f8fafc` | 전체 페이지 본문 배경 |
| **Card / Surface** | `bg-white` | `#ffffff` | 뉴스 카드, 모달 컨테이너, 헤더, 인풋 배경 |
| **Sub Surface** | `bg-slate-100` | `#f1f5f9` | 뱃지, 코드 블록, 비활성 탭, 보조 버튼 배경 |
| **Border (Default)** | `border-slate-200`| `#e2e8f0` | 카드 외곽선, 구분선, 모달 테두리 |
| **Border (Input/Sub)**| `border-slate-300`| `#cbd5e1` | 텍스트 입력창, 버튼 외곽선 |
| **Text (Primary)** | `text-slate-900` | `#0f172a` | 카드 제목, 모달 타이틀, 강조 본문 텍스트 |
| **Text (Secondary)** | `text-slate-700` | `#334155` | 일반 요약 본문, 버튼 텍스트, 필터 라벨 |
| **Text (Muted)** | `text-slate-500` | `#64748b` | 날짜, 메타 정보, 부가 설명, 플레이스홀더 |
| **Primary Accent** | `bg-blue-600` / `text-blue-600` | `#2563eb` | 주요 CTA 버튼, 활성 탭, 검색 포커스 링, 링크 |
| **Primary Hover** | `bg-blue-700` / `hover:border-blue-400` | `#1d4ed8` | 버튼 호버, 카드 마우스오버 테두리 |
| **Accent Tint** | `bg-blue-50` / `border-blue-200` | `#eff6ff` | 브리핑 배너, 인사이트 하이라이트 박스 배경 |
| **Must-Read (Signal)**| `bg-amber-50` / `text-amber-800` / `fill-amber-500` | `#fffbeb` / `#92400e` | 하이 시그널 ⭐️ Must-Read 뱃지 및 북마크 활성 |
| **Hotness (Trend)** | `text-orange-600`| `#ea580c` | Hot 점수 텍스트, 급상승 태그 지표 |
| **Success / Live** | `bg-emerald-50` / `text-emerald-700` | `#ecfdf5` / `#047857` | 수집 완료 토스트, 스트리밍 Live 뱃지, 자동 채택 뱃지 |
| **Danger / Reset** | `bg-red-50` / `text-red-600` / `border-red-200` | `#fef2f2` / `#dc2626` | 초기화 위험 버튼, 오류 알림 배너 |
| **Backdrop Blur** | `bg-black/40 backdrop-blur-xs` | `rgba(15, 23, 42, 0.4)` | 모달 팝업 오버레이 딤(Dim) 처리 |

---

### 5.2. 반응형 브레이크포인트 레이아웃 규칙

| 뷰포트 (Viewport) | 너비 기준 | 레이아웃 동작 및 규칙 |
| :--- | :--- | :--- |
| **Mobile** | `< 640px` (`sm` 미만) | • 1열 카드 피드 레이아웃 (`grid-cols-1`)<br>• 헤더 로고 및 액션 버튼 가로 스크롤 또는 최소 버튼만 노출<br>• 모달 폭 전체 화면에 가깝게 확장 (`max-h-[92vh]`, 패딩 `p-2`)<br>• 필터 탭 가로 스크롤(`scrollbar-none`) 적용<br>• 브리핑 배너 및 상단 바 세로 배치 정렬 |
| **Tablet** | `640px ~ 1024px` (`sm ~ lg`) | • 2열 카드 그리드 레이아웃 (`md:grid-cols-2`)<br>• 헤더 보조 설명 및 스케줄 버튼 노출<br>• 모달 중앙 정렬 (`max-w-2xl` ~ `max-w-4xl`)<br>• 툴바의 검색창과 정렬 버튼 그룹 1열로 조화롭게 배치 |
| **Desktop** | `≥ 1024px` (`lg` 이상) | • 3열 카드 그리드 레이아웃 (`lg:grid-cols-3`, `max-w-7xl` 중앙 정렬)<br>• 헤더 풀 액션 바 노출 (소스&리서처, MCP, RSS, 공유&알림, 스케줄 잔여시간, 초기화, 즉시 수집)<br>• Tech Radar 요약 인라인 뷰 노출 및 드로어 확장 가능<br>• 모달 중앙 고정 오버레이 (최대 폭 `max-w-4xl`, 고정 최대 높이 `88vh`) |

---

### 5.3. 웹 접근성 (a11y - WCAG 2.1 AA) 명세

1. **포커스 제어 및 키보드 네비게이션**:
   - 모든 모달 팝업(`NewsDetailModal`, `DailyBriefingModal`, `SourcesModal`, `BriefingSettingsModal`, `ScheduleModal`, `McpModal`)은 `Escape` 키 입력 시 즉시 안전하게 닫히도록 `window.addEventListener('keydown')` 이벤트 리스너가 바인딩됩니다.
   - 모달 마운트 시 오버레이 바깥 영역 클릭으로 닫을 수 있도록 보이지 않는 배경 레이어(`aria-hidden="true"`)가 배치되어 있습니다.
   - 모든 버튼과 인터랙티브 요소는 `cursor-pointer` 및 명확한 포커스 링(`focus:outline-none focus:border-blue-500`)을 지원합니다.

2. **명도 대비율 (Color Contrast)**:
   - 본문 텍스트 `text-slate-900` (`#0f172a`) 및 `text-slate-700` (`#334155`)은 화이트 배경(`bg-white`) 기준 최소 7:1 이상의 고대비를 유지하여 WCAG AAA 수준을 달성합니다.
   - 보조 메타 텍스트 `text-slate-500` (`#64748b`) 또한 4.5:1 이상의 대비를 만족합니다.

3. **스크린 리더 및 시각적 안내**:
   - 북마크 버튼, 닫기 버튼 등 아이콘 단독 버튼에는 `title` 및 명시적인 툴팁 라벨이 지정되어 있습니다.
   - 외부 링크 이동 시 `target="_blank"`와 함께 보안을 위한 `rel="noopener noreferrer"`가 기본 적용되어 있습니다.
   - 클라이언트 사이드 날짜 렌더링에 의한 Hydration 불일치를 방지하기 위해 날짜 표시부에 `suppressHydrationWarning` 속성을 적용하였습니다.
