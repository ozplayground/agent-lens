# AgentLens UI 컴포넌트 계층 및 디자인 명세서 (Component & Design Spec)

- **작성일자**: 2026-10-20
- **작성자**: UI 시스템 디자이너 (`ui-system-designer`)
- **문서 버전**: v1.0
- **상태**: Approved

---

## 1. 컴포넌트 계층 트리 구조도 (Component Hierarchy Tree)

```
[RootLayout: src/app/layout.tsx] (RSC)
  └── [ThemeProvider: src/context/ThemeContext.tsx] (RCC - 'use client')
        ├── [HotkeyListener: src/components/HotkeyListener.tsx] (RCC)
        ├── [CommandPalette: src/components/CommandPalette.tsx] (RCC)
        │
        ├── [Page: src/app/page.tsx] (RCC - 메인 뉴스 피드 대시보드)
        │     ├── [Header: src/components/Header.tsx] (RCC)
        │     │     ├── [ThemeToggle: src/components/ThemeToggle.tsx] (RCC)
        │     │     └── [CommandPaletteTriggerButton] (RCC)
        │     ├── [Banner: src/components/DailyBriefingBanner.tsx] (RCC)
        │     ├── [TechRadar: src/components/TechRadar.tsx] (RCC)
        │     ├── [CategoryFilter: src/components/CategoryFilter.tsx] (RCC)
        │     ├── [SourceFilter: src/components/SourceFilter.tsx] (RCC)
        │     ├── [NewsGrid: NewsCard[]] (RCC)
        │     │     ├── [HandoverCtaButton: src/components/chat/HandoverCtaButton.tsx] (RCC - variant='card-compact')
        │     │     └── [BookmarkButton / ExternalLink] (RCC)
        │     ├── [Modal: src/components/NewsDetailModal.tsx] (RCC)
        │     │     ├── [HandoverCtaButton: src/components/chat/HandoverCtaButton.tsx] (RCC - variant='modal-banner')
        │     │     ├── [MarkdownViewer: src/components/MarkdownViewer.tsx] (RCC)
        │     │     └── [AskAiPanel: src/components/news-detail/AskAiPanel.tsx] (RCC)
        │     ├── [DailyBriefingModal: src/components/DailyBriefingModal.tsx] (RCC)
        │     ├── [ScheduleModal: src/components/ScheduleModal.tsx] (RCC)
        │     ├── [McpModal: src/components/McpModal.tsx] (RCC)
        │     ├── [BriefingSettingsModal: src/components/BriefingSettingsModal.tsx] (RCC)
        │     ├── [SourcesModal: src/components/SourcesModal.tsx] (RCC)
        │     └── [Footer: src/components/ShortcutHintFooter.tsx] (RCC)
        │
        └── [Page: src/app/chat/page.tsx] (RSC - 전용 AI 챗 라우트 & Suspense 경계)
              └── [Feature: src/components/chat/ChatWorkspace.tsx] (RCC - 'use client')
                    ├── [Navigation: src/components/chat/ChatSidebar.tsx] (RCC - 데스크톱 >= 1024px 세션 히스토리)
                    │     ├── [ChatSidebarHeader: src/components/chat/ChatSidebarHeader.tsx] (RCC)
                    │     └── [SessionList: src/components/chat/SessionList.tsx] (RCC)
                    │           ├── [SessionItemCard: src/components/chat/SessionItemCard.tsx] (RCC)
                    │           ├── [DeleteConfirmPopover: src/components/chat/DeleteConfirmPopover.tsx] (RCC)
                    │           ├── [SessionEmptyState: src/components/chat/SessionEmptyState.tsx] (RCC)
                    │           └── [SessionListSkeleton: src/components/chat/SessionListSkeleton.tsx] (RCC)
                    ├── [MobileDrawer: src/components/chat/ChatHistoryDrawer.tsx] (RCC - 모바일/태블릿 < 1024px 슬라이드오버)
                    │     ├── [DrawerBackdrop: Dim Overlay] (RCC)
                    │     ├── [ChatSidebarHeader: src/components/chat/ChatSidebarHeader.tsx] (RCC)
                    │     └── [SessionList: src/components/chat/SessionList.tsx] (RCC)
                    └── [MainArea: ChatMainContainer] (RCC)
                          ├── [WarningToast: AlertCircle Toast Banner] (RCC)
                          ├── [Header: src/components/chat/ChatHeader.tsx] (RCC)
                          │     ├── [BackToFeedLink: Next.js Link] (RCC)
                          │     ├── [ScopeToggleGroup: Scoped vs Global] (RCC)
                          │     ├── [ActiveSourceChip: src/components/chat/ActiveSourceChip.tsx] (RCC)
                          │     ├── [DualSelector #1: src/components/chat/ChatModelSelector.tsx] (RCC - variant='header-chip')
                          │     ├── [HistoryDrawerTrigger: History Icon Button] (RCC)
                          │     └── [NewChatButton: Plus Icon Button] (RCC)
                          ├── [MessageList: src/components/chat/ChatMessageList.tsx] (RCC - role='log')
                          │     ├── [EmptyWelcomeState: Prompt Suggestion Grid] (RCC - 세션 초기 진입)
                          │     ├── [ModelChangeDivider: src/components/chat/ModelChangeDivider.tsx] (RCC - 모델 전환 구분선)
                          │     └── [Item: src/components/chat/ChatMessageItem.tsx] (RCC - 메시지 버블)
                          │           ├── [WorkflowStepTracker: src/components/chat/WorkflowStepTracker.tsx] (RCC)
                          │           │     ├── [LiveProgressBar: 0~100% Gradient Bar] (RCC - 스트리밍 진행 중)
                          │           │     └── [SlimAccordion: 28px 완료 상태 접이식 아코디언] (RCC - 완료 시)
                          │           ├── [RelaxationNoticeBanner: Focus Filter Auto-relaxation Badge] (RCC)
                          │           ├── [MarkdownViewer: ReactMarkdown + remarkGfm] (RCC)
                          │           │     ├── [CitationBadge: src/components/chat/CitationBadge.tsx] (RCC - [1] 원본 vs [S1] 보충)
                          │           │     │     └── [CitationPopover: src/components/chat/CitationPopover.tsx] (RCC - 팝오버 프리뷰)
                          │           │     └── [CodeBlock: src/components/MarkdownViewer.tsx] (RCC - 언어별 신택스 & 복사)
                          │           ├── [ModelTierBadge: src/components/chat/ModelTierBadge.tsx] (RCC - variant='footer')
                          │           └── [ExportToolbar: src/components/chat/ExportToolbar.tsx] (RCC - 4단 리포트 익스포트)
                          └── [ComposerBar: Pinned Bottom Container] (RCC)
                                ├── [FocusCapsule: src/components/chat/FocusCapsule.tsx] (RCC - 검색 타깃팅 요약 칩)
                                └── [Input: src/components/chat/ChatPromptInput.tsx] (RCC)
                                      ├── [AutoResizeTextarea: Dynamic Height 180px Max] (RCC)
                                      ├── [DualSelector #2: src/components/chat/ChatModelSelector.tsx] (RCC - variant='inline-chip')
                                      ├── [CharCounter: 2,000자 카운터] (RCC)
                                      └── [SendOrStopButton: Submit / Abort Stream Action] (RCC)
                                └── [FocusBottomSheet: src/components/chat/FocusBottomSheet.tsx] (RCC - 모달 바텀시트)
```

---

## 2. Server Component (RSC) vs Client Component (RCC) 분격 정의

| 컴포넌트명 | 구분 | 위치 (Path) | 선정 사유 및 담당 책임 |
| :--- | :---: | :--- | :--- |
| `RootLayout` | **RSC** | `src/app/layout.tsx` | 전역 HTML 뼈대, Geist 폰트 최적화, `viewport`(`interactiveWidget: 'resizes-content'`) 메타데이터 주입, 최상위 `overflow-x-hidden` 선언 및 제로 JS 번들 오버헤드 보장 |
| `ChatPage` | **RSC** | `src/app/chat/page.tsx` | `/chat` 라우트 SEO 메타데이터(`Metadata`) 생성 및 워크스페이스 클라이언트 진입을 위한 `React.Suspense` 경계 래핑 |
| `ThemeProvider` / `ThemeToggle` | **RCC** | `src/context/ThemeContext.tsx`<br>`src/components/ThemeToggle.tsx` | `next-themes` 기반 SSR 무깜빡임(Zero-Flicker) 라이트/다크 시스템 테마 상태 관리 및 `localStorage` 동기화 |
| `HotkeyListener` / `CommandPalette` | **RCC** | `src/components/HotkeyListener.tsx`<br>`src/components/CommandPalette.tsx` | 전역 키보드 단축키(`j/k`, `/`, `b`, `c`, `t`, `Cmd+K`, `Escape`) 이벤트 수신 및 입력 필드 포커스 시 단축키 자동 격리(Input Isolation) |
| `HomePage` | **RCC** | `src/app/page.tsx` | 뉴스 피드 실시간 필터링(카테고리/소스/검색/정렬/북마크), 테크 레이더 인터랙션, 모달 다이얼로그 오버레이 제어 |
| `ChatWorkspace` | **RCC** | `src/components/chat/ChatWorkspace.tsx` | SSE 실시간 스트리밍 제어(`POST /api/chat/stream`), Dual-Layer 세션 영속화(SQLite API + `localStorage`), 모바일 `visualViewport` 가상 키보드 인셋 동기화, 상단 헤더 & 하단 입력창 듀얼 모델 셀렉터 단일 상태(SSOT) 총괄 |
| `ChatHeader` | **RCC** | `src/components/chat/ChatHeader.tsx` | 글로벌 헤더 내 피드 뒤로가기, 스코프 모드(Scoped vs Global) 토글, 활성 기사 칩(`ActiveSourceChip`), 듀얼 모델 셀렉터 #1(`variant="header-chip"`), 히스토리 토글 및 새 대화 트리거 |
| `ChatPromptInput` | **RCC** | `src/components/chat/ChatPromptInput.tsx` | 멀티라인 자동 리사이징 텍스트에어리어(`max-h-[180px]`), CJK 한글 IME 조합(`isComposing`) 보호, 2,000자 제한 카운터, 듀얼 모델 셀렉터 #2(`variant="inline-chip"`), 스트리밍 중단(`Square`) 및 전송(`ArrowUp`) 액션 |
| `ChatModelSelector` | **RCC** | `src/components/chat/ChatModelSelector.tsx` | 3-Tier 멀티 모델(`haiku`, `sonnet`, `opus`) 선택 팝오버 및 바텀시트, WAI-ARIA `role="radiogroup"` 키보드 탐색, 스트리밍 잠금(`disabled`) 툴팁 제어 |
| `ModelTierBadge` | **RCC** | `src/components/chat/ModelTierBadge.tsx` | 3-Tier 및 멀티 프로바이더(Anthropic Claude, Google Gemini, OpenAI GPT, Ollama/vLLM) 모델 식별자 뱃지 포맷팅, 레이턴시(`ms`), 상대 비용(`$`, `$$`, `$$$`) 표시 |
| `ModelChangeDivider` | **RCC** | `src/components/chat/ModelChangeDivider.tsx` | 멀티턴 대화 중 모델 전환 시 타임라인 구분선 삽입, 무손실 컨텍스트 보존 안내 문구(`role="separator"`) 렌더링 |
| `WorkflowStepTracker` | **RCC** | `src/components/chat/WorkflowStepTracker.tsx` | 실시간 스트리밍 에이전틱 리서치 7단계(추론, 도구호출, 본문추출, 충실도평가, 보충검색, 리포트종합) 진행 바(0~100%) 및 완료 시 28px 슬림 접이식 아코디언 축소 |
| `ChatMessageList` | **RCC** | `src/components/chat/ChatMessageList.tsx` | 스크롤 오토포커스(`scrollIntoView`), 타임라인 복합 아이템(메시지 + 모델 전환 이벤트) 매핑, 빈 세션 시 추천 질문 칩 그리드 렌더링 (`role="log"`) |
| `ChatMessageItem` | **RCC** | `src/components/chat/ChatMessageItem.tsx` | 유저/어시스턴트 버블 렌더링, 인라인 인용 뱃지 치환(`renderTextWithBadges`), 코드/테이블 국소 스크롤 격리, 재시도(`RotateCcw`) 및 원클릭 복사 |
| `CitationBadge` / `CitationPopover` | **RCC** | `src/components/chat/CitationBadge.tsx`<br>`src/components/chat/CitationPopover.tsx` | 원본 기사(`[1]`) 및 보충 웹 검색(`[S1]`) 시각적 이원화 뱃지, 유령 인용(Phantom Citation) 안전 폴백, 팝오버 프리뷰 및 기사 상세 모달 연동 |
| `ExportToolbar` | **RCC** | `src/components/chat/ExportToolbar.tsx` | 4단 구조화 리포트 마크다운 복사, `.md` 파일 다운로드, Notion 워크스페이스 연동 액션 툴바 |
| `FocusCapsule` / `FocusBottomSheet` | **RCC** | `src/components/chat/FocusCapsule.tsx`<br>`src/components/chat/FocusBottomSheet.tsx` | 지식 검색 타깃팅 필터(카테고리, 기간, 정렬, Must-Read) 요약 칩 표시, 모바일 스와이프 다운 닫기 바텀시트 |
| `ChatSidebar` / `ChatHistoryDrawer` | **RCC** | `src/components/chat/ChatSidebar.tsx`<br>`src/components/chat/ChatHistoryDrawer.tsx` | 데스크톱 고정 좌측 사이드바(`w-64 lg:w-72`) 및 모바일 슬라이드오버 드로어(`< 1024px`), 세션 검색 및 멀티턴 복원 |
| `SessionList` / `SessionItemCard` / `DeleteConfirmPopover` | **RCC** | `src/components/chat/SessionList.tsx`<br>`src/components/chat/SessionItemCard.tsx`<br>`src/components/chat/DeleteConfirmPopover.tsx` | 세션 목록 가상화/정렬, 상대 시간 포맷팅(`방금 전`, `N시간 전`), 영구 삭제 2단계 확인 포커스 트랩 팝오버 |
| `HandoverCtaButton` | **RCC** | `src/components/chat/HandoverCtaButton.tsx` | 메인 피드 뉴스 카드 및 기사 상세 모달에서 전용 AI 챗 워크스페이스(`/chat?sourceId=xxx`)로 원클릭 핸드오버 |

---

## 3. 핵심 컴포넌트 Props 인터페이스 명세 (Props Contracts)

### 3.1 상단 헤더 & 입력창 듀얼 멀티 모델 셀렉터 서브시스템

```typescript
import { NewsItem } from '@/types/news';
import {
  ScopeMode,
  ModelTier,
  ChatSourceDetailResponse,
  PrimaryArticleCitation,
  ChatTimelineItem,
  ChatMessage,
  ChatStatusPayload,
  ChatSourceType,
  SourceReference,
  FocusFilters,
  ChatSessionMeta,
} from '@/types/chat';

/**
 * 1) ChatHeader: 상단 글로벌 헤더 (듀얼 모델 셀렉터 #1 바인딩)
 */
export interface ChatHeaderProps {
  scopeMode: ScopeMode;
  onScopeChange: (nextScope: ScopeMode) => void;
  activeSource: NewsItem | ChatSourceDetailResponse | null;
  onRemoveSource: () => void;
  onNewChat: () => void;
  onToggleHistoryDrawer?: () => void;
  isHistoryOpen?: boolean;
  isStreaming: boolean;
  showNewChatButton?: boolean;
  selectedTier?: ModelTier;
  onSelectTier?: (tier: ModelTier) => void;
  // 하위 호환 별칭 필드
  activeSessionId?: string | null;
  onToggleScope?: (mode: ScopeMode) => void;
  onClearSource?: () => void;
  onToggleHistory?: () => void;
  className?: string;
}

/**
 * 2) ChatPromptInput: 하단 프롬프트 입력창 (듀얼 모델 셀렉터 #2 바인딩)
 */
export interface ChatPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (prompt: string) => void;
  onStopGenerating: () => void;
  isStreaming: boolean;
  scopeMode: ScopeMode;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  selectedTier?: ModelTier;
  onSelectTier?: (tier: ModelTier) => void;
  // 단축 편의 콜백 별칭
  onSendMessage?: (content: string, tier?: ModelTier) => void;
  onAbortStream?: () => void;
  className?: string;
}

/**
 * 3) ChatModelSelector: 듀얼 마운트 모델 셀렉터 공통 컴포넌트
 */
export interface ChatModelSelectorProps {
  /** 현재 활성화된 모델 티어 ('haiku' | 'sonnet' | 'opus') */
  selectedTier: ModelTier;
  /** 사용자 모델 선택 콜백 */
  onSelectTier: (tier: ModelTier) => void;
  /** 답변 스트리밍 진행 여부 (true 시 상호작용 잠금 및 안내 툴팁 노출) */
  isStreaming: boolean;
  /** 렌더링 형태: 'header-chip' (헤더 우측) | 'inline-chip' (입력창 좌하단) | 'header-compact' */
  variant?: 'inline-chip' | 'header-compact' | 'header-chip';
  /** 키보드 포커스 트랩 및 드롭다운 강제 오픈 제어 옵션 */
  forceOpen?: boolean;
  /** 추가 Tailwind 클래스 */
  className?: string;
}

/**
 * 4) ModelTierBadge: 모델 식별자, 레이턴시, 상대 토큰 비용 표시 뱃지
 */
export interface ModelTierBadgeProps {
  /** 렌더링 대상 모델 티어 또는 과거 프로바이더 모델명 (Claude, Gemini, GPT, Ollama 등) */
  tier: ModelTier | string;
  /** 뱃지 렌더링 스타일 변형 */
  variant?: 'chip' | 'footer' | 'pill' | 'pipeline';
  /** 실제 SSE 스트리밍 측정 소요 시간 (ms 단위) */
  latencyMs?: number | null;
  /** 상대 토큰 비용($, $$, $$$) 표시 여부 */
  showCost?: boolean;
  /** 티어 아이콘(⚡, 🎯, 🧠, ✨, 🤖) 노출 여부 (기본값: true) */
  showIcon?: boolean;
  /** 권장 라벨('[추천]') 노출 여부 */
  showRecommended?: boolean;
  /** 추가 Tailwind 클래스 */
  className?: string;
}

/**
 * 5) ModelChangeDivider: 대화 도중 모델 전환 타임라인 구분선
 */
export interface ModelChangeDividerProps {
  /** 변경 전 모델 티어 (옵셔널) */
  previousTier?: ModelTier;
  /** 새롭게 활성화된 모델 티어 */
  newTier: ModelTier;
  /** 모델 전환 발생 시각 (ISO 8601) */
  timestamp?: string;
  /** 무손실 컨텍스트 보존 안내 문구 커스텀 */
  contextNotice?: string;
  /** 추가 클래스 */
  className?: string;
}
```

### 3.2 실시간 스트리밍 워크플로우 진행 상태 트래커 서브시스템

```typescript
/**
 * 6) WorkflowStepTracker: 에이전틱 리서치 실시간 진행 상태 트래커
 */
export interface WorkflowStepTrackerProps {
  /** 현재 수신된 실시간 단계 페이로드 */
  currentStatus: ChatStatusPayload | null;
  /** 완료된 단계들의 누적 히스토리 목록 */
  stepHistory?: ChatStatusPayload[];
  /** 실시간 스트리밍 진행 중 여부 */
  isStreaming: boolean;
  /** 스트리밍 완료 여부 (true 시 28px 슬림 아코디언으로 자동 축소) */
  isDone: boolean;
  /** 아코디언 확장 상태 제어 (옵셔널) */
  isExpanded?: boolean;
  /** 아코디언 펼침/접힘 토글 콜백 */
  onToggleExpand?: () => void;
  /** 조건 완화 또는 대체 경로 안내 문구 */
  fallbackNotice?: string | null;
  /** 추가 클래스 */
  className?: string;
}

export type ChatStatusStep =
  | 'thinking'               // 🧠 에이전트 추론 및 계획 수립
  | 'tool_calling'           // 🔍 자율 검색 도구 호출 중
  | 'observing'              // ✅ 검색 결과 관찰 및 컨텍스트 병합
  | 'extracting_source'      // 🌐 원본 URL 실시간 전문 비동기 스크래핑
  | 'evaluating_sufficiency' // 🧠 본문 정보 충실도 자체 평가
  | 'agentic_searching'      // 🔍 보충 기술 문서 자율 검색 중
  | 'synthesizing';          // 📝 Senior Staff Architect 4단 엔지니어링 리포트 프롬프트 조립

export interface ChatStatusPayload {
  step: ChatStatusStep;
  label: string;
  timestamp: string;
  progress?: number;         // 0 ~ 100 퍼센트 수치
  query?: string | null;     // 현재 실행 중인 검색 쿼리
  queries?: string[] | null;
  sources_found?: number | null;
}
```

### 3.3 사후 인용 출처 렌더링 & 4단 리포트 익스포트 서브시스템

```typescript
/**
 * 7) CitationBadge: 본문 내 인라인 인용 출처 뱃지 ([1] 원본 vs [S1] 보충)
 */
export interface CitationBadgeProps {
  /** 출처 식별 인덱스 (1, 2 또는 'S1', 'S2') */
  index: number | string;
  /** 출처 분류: 'primary' (기사 원본) | 'supplementary' (보충 웹 검색) */
  type?: ChatSourceType;
  /** 해당 출처 상세 참조 객체 (부재 시 유령 인용 비활성 텍스트로 안전 렌더링) */
  source?: SourceReference;
  /** 기사 상세 모달 오픈 콜백 */
  onOpenSourceDetail?: (sourceId: number) => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 8) CitationPopover: 인용 뱃지 클릭 시 노출되는 플로팅 프리뷰 팝오버
 */
export interface CitationPopoverProps {
  /** 출처 메타데이터 */
  source: SourceReference;
  /** 팝오버 오픈 여부 */
  isOpen: boolean;
  /** 팝오버 닫기 콜백 */
  onClose: () => void;
  /** 앵커 위치 사각형 (옵셔널) */
  anchorRect?: DOMRect | null;
  /** 기사 상세 모달 호출 콜백 */
  onOpenSourceDetail?: (sourceId: number) => void;
}

/**
 * 9) ChatMessageItem: 개별 대화 메시지 버블
 */
export interface ChatMessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onRetry?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onOpenSourceDetail?: (sourceId: number) => void;
}

/**
 * 10) ExportToolbar: 어시스턴트 메시지 푸터 4단 리포트 익스포트 툴바
 */
export interface ExportToolbarProps {
  /** 어시스턴트 메시지 고유 식별자 */
  messageId: string;
  /** 4단 구조화 리포트 마크다운 전문 */
  markdownContent: string;
  /** 분석 대상 기사 제목 (파일명 생성용) */
  sourceTitle?: string;
  /** 스트리밍 진행 중 여부 (진행 중일 때는 툴바 비활성화) */
  isStreaming?: boolean;
  /** 원클릭 마크다운 복사 완료 콜백 */
  onCopySuccess?: () => void;
  /** Notion 연동 성공 콜백 (생성된 페이지 URL 반환) */
  onNotionSuccess?: (pageUrl: string) => void;
  /** 추가 클래스 */
  className?: string;
}
```

### 3.4 지식 검색 타깃팅 포커스 필터 & 세션 히스토리 서브시스템

```typescript
/**
 * 11) FocusCapsule: 하단 작문 바 상단 검색 조건 요약 캡슐
 */
export interface FocusCapsuleProps {
  filters: FocusFilters;
  scopedSource?: NewsItem | ChatSourceDetailResponse | null;
  onClick: () => void;
  onReset: () => void;
  isOpen: boolean;
  matchedCount?: number;
  className?: string;
}

/**
 * 12) FocusBottomSheet: 모바일 스와이프 및 데스크톱 바텀시트 모달
 */
export interface FocusBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FocusFilters;
  onApplyFilters: (nextFilters: FocusFilters) => void;
  onResetFilters: () => void;
  targetCount?: number;
  totalCount?: number;
}

/**
 * 13) ChatSidebar: 데스크톱 고정 좌측 대화 히스토리 사이드바 (>= 1024px)
 */
export interface ChatSidebarProps {
  sessions: ChatSessionMeta[];
  activeSessionId: string | null;
  isOpen: boolean;
  isLoading?: boolean;
  error?: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onToggleCollapse: () => void;
  onRetryLoad?: () => void;
  isStreaming?: boolean;
  className?: string;
}

/**
 * 14) ChatHistoryDrawer: 모바일/태블릿 슬라이드오버 대화 히스토리 드로어 (< 1024px)
 */
export interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSessionMeta[];
  activeSessionId: string | null;
  isLoading?: boolean;
  error?: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onRetryLoad?: () => void;
  isStreaming?: boolean;
}

/**
 * 15) SessionItemCard: 개별 대화 세션 카드 아이템
 */
export interface SessionItemCardProps {
  session: ChatSessionMeta;
  isActive: boolean;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => Promise<void>;
}

/**
 * 16) DeleteConfirmPopover: 세션 영구 삭제 2단계 확인 팝오버
 */
export interface DeleteConfirmPopoverProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  anchorRect?: DOMRect | null;
}

/**
 * 17) HandoverCtaButton: 기사 상세 및 카드에서의 전용 챗 핸드오버 버튼
 */
export interface HandoverCtaButtonProps {
  item: NewsItem;
  variant?: 'card-compact' | 'modal-banner' | 'modal-icon';
  draftQuestion?: string;
  className?: string;
  onHandoverComplete?: () => void;
}
```

---

## 4. UI 5대 상태 Variants (State Handling Specification)

| 상태 (State) | 시각적 표현 및 컴포넌트 동작 | 사용자 안내 문구 / 액션 |
| :--- | :--- | :--- |
| **Idle (기본 대기)** | • **피드 대시보드**: 1/2/3열 반응형 카드 그리드, 카테고리 탭, 인기/최신/품질 정렬 버튼 활성화.<br>• **챗 워크스페이스**: 상단 헤더 우측(`ChatHeader`) 및 하단 입력창 좌하단(`ChatPromptInput`)에 듀얼 모델 셀렉터 칩(`[🎯 Sonnet ▾]`) 상시 표시 및 0ms 양방향 동기화 유지.<br>• 프롬프트 입력창 자동 리사이징 활성화 및 포커스 유지. | "글로벌 AI 소식 및 에이전트 기술을 탐색하거나 질문을 입력하세요." |
| **Loading / Pending (로딩 및 스트리밍)** | • **피드/세션 로딩**: `SessionListSkeleton` 3단 스켈레톤 및 중앙 스피너 노출.<br>• **SSE 스트리밍 중**: 상/하단 듀얼 모델 셀렉터 동시 상호작용 비활성화(`disabled`), 전송 버튼이 빨간색 사각 중단 버튼(`[■ 중단]`)으로 전환.<br>• **에이전틱 트래커**: 0~100% 그라데이션 프로그레스 바 실시간 업데이트 및 단계별 펄스 아이콘(🧠, 🔍, 🌐, ⚖️, 📝), 실행 검색어 태그 표시. | "원본 소스 본문 추출 및 Senior Staff 엔지니어링 리포트 종합 중... [■ 중단]"<br>*(모델 셀렉터 호버 시: "답변 생성 중에는 모델을 변경할 수 없습니다")* |
| **Error (오류 및 장애)** | • **스트리밍 중단/네트워크 단절**: 어시스턴트 메시지 버블이 연한 레드 테두리(`bg-red-50/50 border-red-200`)로 전환되며 인라인 경고 아이콘(`AlertTriangle`) 및 `[다시 시도]` 버튼 노출.<br>• **API 쿼터(429)/서버 과부하(503/529)**: 서버 응답 에러 메시지 표출 및 인접 모델 티어(Haiku 또는 Opus)로의 전환 권장 배너 제공.<br>• **기사 핸드오버 실패**: 상단 토스트 배너 노출 후 전체 뉴스 모드로 안전 롤백. | "네트워크 지연으로 응답이 중단되었습니다. [다시 시도]"<br>"요청하신 기사를 찾을 수 없어 전체 뉴스 모드로 시작합니다." |
| **Empty (데이터 없음 및 신규 진입)** | • **피드 결과 0건**: 점선 박스, 돋보기 아이콘, `[필터 전체 초기화]` CTA 버튼 노출.<br>• **저장 세션 0건**: `SessionEmptyState` 대화 상자 일러스트 및 `[+ 새 대화 시작]` 버튼 표시.<br>• **세션 검색 결과 0건**: 검색어 초기화 텍스트 버튼 제공.<br>• **신규 대화 세션**: 로봇 아바타 웰컴 메시지 및 4대 추천 질문 프롬프트 칩(MCP, LangGraph, SWE-bench, 오픈소스 동향) 노출. | "조건에 일치하는 소식이 없습니다."<br>"저장된 대화 기록이 없습니다. 새로운 대화를 시작해보세요." |
| **Success (완료 및 성공)** | • **스트리밍 완료(`event: done`)**: 스텝 트래커가 28px 슬림 접이식 아코디언(`[✓] 심층 분석 과정 N단계 완료`)으로 자동 축소.<br>• **사후 인용 렌더링**: 마크다운 본문에 원본 기사(`[1]`) 및 보충 웹 검색(`[S1]`) 시각적 이원화 뱃지 적용, 호버/클릭 시 팝오버 프리뷰 제공.<br>• **메시지 푸터**: 실제 응답 모델 식별자, 처리 소요 시간(`latencyMs`), 4단 리포트 익스포트 툴바(마크다운 복사, .md 다운로드, Notion 동기화) 활성화.<br>• **대화 중 모델 전환**: 세션 맥락 100% 무손실 유지 상태에서 타임라인에 `ModelChangeDivider` 삽입 및 토스트 알림 노출. | "클립보드에 복사되었습니다."<br>"🔄 Claude Sonnet으로 모델 변경됨 (이전 대화 맥락 100% 유지)" |

---

## 5. 반응형 브레이크포인트 및 접근성 (Responsive & a11y)

### 5.1 반응형 브레이크포인트 레이아웃 규칙

AgentLens는 Tailwind CSS 4대 표준 브레이크포인트를 기반으로 디바이스별 완벽한 사용성을 보장합니다.

```
+-------------------------------------------------------------------------------+
| Breakpoint       | Range            | Layout Behaviors                        |
+-------------------------------------------------------------------------------+
| Mobile (xs/sm)   | < 640px          | • 단일 컬럼 뷰, 사이드바 숨김           |
|                  |                  | • 상단 히스토리 버튼 -> ChatHistoryDrawer|
|                  |                  | • 듀얼 모델 셀렉터: 터치 모바일 바텀시트 |
|                  |                  | • 폰트 최소 16px 강제 (iOS 줌인 방지)   |
|                  |                  | • visualViewport 가상 키보드 동기화     |
+-------------------------------------------------------------------------------+
| Tablet (md)      | 640px ~ 1024px   | • 피드 2열 그리드 (grid-cols-2)        |
|                  |                  | • 챗 워크스페이스 중앙 정렬             |
|                  |                  | • 좌측 슬라이드오버 히스토리 드로어 유지  |
|                  |                  | • 모델 셀렉터: 팝오버 드롭다운 전환     |
+-------------------------------------------------------------------------------+
| Desktop (lg/xl)  | >= 1024px        | • 피드 3열 그리드 (grid-cols-3)        |
|                  |                  | • 챗 고정 2컬럼 레이아웃                 |
|                  |                  |   (좌측 ChatSidebar w-72 + 우측 챗 영역)|
|                  |                  | • 듀얼 모델 셀렉터 #1 & #2 동시 노출     |
|                  |                  | • 하단 단축키 가이드 바 (Enter/Shift)   |
+-------------------------------------------------------------------------------+
```

#### 가로 스크롤(Horizontal Overflow) 0px 격리 표준
- **최상위 컨테이너 방어**: `html, body, main, #__next` 전역에 `overflow-x: hidden`, `width: 100%`, `max-width: 100vw`를 강제 적용합니다.
- **Flex 자식 수축 보장**: 모든 메시지 버블, 인풋 박스, 툴바의 Flex 자식 요소에 `min-w-0 max-w-full`을 선언하여 긴 URL이나 단어가 부모 컨테이너를 밀어내지 못하도록 방어합니다.
- **텍스트 줄바꿈 규칙**: 본문 타이포그래피에 `break-words [overflow-wrap:anywhere] [word-break:break-word]`를 적용하여 모바일 320px 최소 뷰포트에서도 가로 스크롤을 0px로 유지합니다.
- **국소 스크롤 격리 (Local Scroll Isolation)**: 마크다운 코드 블록(`pre > code`)과 표(`table`)는 `overflow-x-auto overscroll-x-contain`으로 래핑하여 해당 블록 내부에서만 수평 스크롤이 발생하도록 뷰포트와 격리합니다.
- **iOS Safari 가상 키보드 뷰포트 인셋**: `window.visualViewport.addEventListener('resize')`를 통해 키보드가 올라올 때 실제 가시 영역 높이(`visualViewport.height`)로 챗 컨테이너 높이를 동적 동기화하고, `meta viewport`에 `interactiveWidget: 'resizes-content'`를 명시합니다.

---

### 5.2 접근성 (a11y - WCAG 2.1 AA)

- **WAI-ARIA 라디오 그룹 및 키보드 조작 (`ChatModelSelector`)**:
  - 팝오버 컨테이너에 `role="radiogroup"`, `aria-label="Claude AI 모델 선택"`을 부여합니다.
  - 각 모델 옵션에 `role="radio"`, `aria-checked={isSelected}`, `tabIndex={isSelected ? 0 : -1}`를 부여합니다.
  - `ArrowUp` / `ArrowDown` (및 `ArrowLeft` / `ArrowRight`) 키로 포커스를 순환 이동하며, `Enter` 또는 `Space` 키로 모델을 확정 선택하고, `Escape` 입력 시 팝오버를 닫고 트리거 버튼으로 포커스를 복원합니다.
- **실시간 스크린 리더 Live Region**:
  - 메시지 리스트 컨테이너에 `role="log"`, `aria-live="polite"`, `aria-relevant="additions text"`를 적용하여 어시스턴트의 답변 청크 및 신규 메시지 추가를 보조 기술에 실시간 안내합니다.
  - 진행 상태 트래커에 `role="region"`, `aria-label="에이전틱 워크플로우 진행 상태"`, 내부 바에 `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` 속성을 적용합니다.
  - 모델 전환 구분선에 `role="separator"`, `aria-label="Claude Haiku에서 Sonnet으로 모델 변경됨 (이전 대화 맥락 유지)"`를 명시합니다.
- **모달 및 팝오버 Focus Trap**:
  - `CommandPalette`, `NewsDetailModal`, `ChatHistoryDrawer`, `FocusBottomSheet`, `DeleteConfirmPopover` 열림 시 포커스를 컨테이너 내부 첫 번째 상호작용 요소로 이동시키고, 모달 외부로 포커스가 이탈하지 않도록 격리합니다.
  - 세션 영구 삭제 팝오버(`DeleteConfirmPopover`)는 사고 방지를 위해 [취소] 버튼에 기본 포커스를 부여합니다.
- **명도 대비 및 시각 접근성**:
  - 라이트 모드(배경 `#ffffff` / `#f8fafc`) 및 다크 모드(배경 `#0d1117` / `#161b22`) 전역에서 텍스트와 배경 간 명도 대비율을 WCAG AA 기준인 **4.5:1 이상**(대형 텍스트 3:1 이상)으로 엄격히 유지합니다.
  - 색상 단독으로 상태를 전달하지 않고, 모델 티어별 고유 아이콘(⚡ Haiku, 🎯 Sonnet, 🧠 Opus) 및 상태 텍스트 라벨을 병행 표기합니다.
- **한글/CJK IME Composition 보호 & 단축키 격리 (Input Isolation)**:
  - 프롬프트 입력창(`ChatPromptInput`) 및 검색 인풋에서 한글 입력 중 Enter 키를 누를 때 중복 전송되는 현상을 방지하기 위해 `e.nativeEvent.isComposing` 상태를 검사하여 전송을 안전하게 차단합니다.
  - `textarea`나 `input`에 포커스가 머물러 있는 동안에는 전역 탐색 단축키(`j/k`, `/`, `b`, `c`, `t`)의 실행을 원천 차단하여 사용자 타이핑을 보호합니다.
