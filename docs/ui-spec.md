# 화면 명세: AgentLens

Updated: 2026-11-06

## 개요
frontend 는 Next.js 16 App Router 앱이다 (`frontend/`, React 19, Tailwind 4, `output: "standalone"`, 포트 3001). 화면 라우트는 뉴스 피드 `/` 와 AI 챗 `/chat` 두 개이고, 프론트 자체 API 라우트는 헬스체크 `/api/health` 하나다. 그 밖의 `/api/*` 요청은 rewrite 로 backend 에 넘긴다. 모든 화면은 클라이언트 컴포넌트(`'use client'`)가 데이터를 읽는다. 서버 컴포넌트에서 데이터를 읽는 곳은 없다.

공통 UI 규칙(헤더, 테마, 단축키, 커맨드 팔레트, 모달 규칙, 반응형, 로딩·오류 표시, 마크다운)은 [functional-spec/07-ui-common.md](functional-spec/07-ui-common.md) 에 있다.

## 라우트
| 경로 | 종류 | 파일 | 제목(`<title>`) | 설명 |
|---|---|---|---|---|
| `/` | 페이지 (클라이언트) | `frontend/src/app/page.tsx` | `AgentLens \| AI Agent, Harness & MCP Global News` (루트 레이아웃 메타데이터) | 뉴스 피드, 일일 브리핑, Tech Radar, 모달 6종 |
| `/chat` | 페이지 (서버 컴포넌트 껍데기 + 클라이언트 `ChatWorkspace`) | `frontend/src/app/chat/page.tsx` | `AI 챗 워크스페이스 \| AgentLens` | AI 챗 워크스페이스 |
| `/api/health` | Route Handler (`GET`, `dynamic = 'force-dynamic'`) | `frontend/src/app/api/health/route.ts` | — | 프론트 헬스체크 |

- 루트 레이아웃 (`frontend/src/app/layout.tsx`): `<html lang="ko" suppressHydrationWarning>`, Geist·Geist Mono 폰트 CSS 변수(`--font-geist-sans`, `--font-geist-mono`), `<body>` 에 `min-h-full flex flex-col`, 라이트 `bg-slate-50` / 다크 `#0d1117` 배경, `overflow-x-hidden`. 자식을 `ThemeProvider` 로 감싼다. 메타 설명은 `전세계 AI 뉴스, 최신 Agent 기술, 하네스(Harness) 방법론 및 벤치마크, MCP(Model Context Protocol) 및 스킬 플러그인 큐레이션 플랫폼`.
- viewport: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, interactive-widget=resizes-content` (`layout.tsx:9-15`).
- `/chat` 쿼리 파라미터 (`ChatWorkspace.tsx:502-565`):
  | 파라미터 | 동작 |
  |---|---|
  | `session_id` | 저장된 대화를 불러온다. 있으면 다른 파라미터는 보지 않는다 |
  | `sourceId` | 정수 기사 id. `GET /api/chat/sources/{id}` 로 기사를 읽어 Scoped 모드로 시작한다. 못 찾으면 경고 토스트 후 Global 모드 |
  | `q` | 시작하자마자 이 질문을 보낸다 (`sourceId` 와 함께면 그 기사 범위로) |
- `/api/health` 응답: `{"status":"healthy","service":"agentlens-frontend","version":"0.3.1","timestamp":<ISO>}`. Docker `HEALTHCHECK` 와 compose healthcheck 가 `http://127.0.0.1:3001/api/health` 를 부른다 (`frontend/Dockerfile`, `docker-compose.yml`). rewrite 규칙 `/api/:path*` 와 경로가 겹치지만 Route Handler 로 응답한다는 전제로 healthcheck 가 짜여 있다 (실제 우선순위는 실행해서 확인하지 않았다).
- 이 밖의 페이지(404 커스텀, `loading.tsx`, `error.tsx`)는 없다.

## 화면: 뉴스 피드 (`/`)
기능 상세: 뉴스 피드 [functional-spec/01-news-feed.md](functional-spec/01-news-feed.md), 브리핑·공유 [functional-spec/04-briefing-and-sharing.md](functional-spec/04-briefing-and-sharing.md), 소스·리서치 [functional-spec/05-sources-and-research.md](functional-spec/05-sources-and-research.md), MCP [functional-spec/06-mcp-server.md](functional-spec/06-mcp-server.md), 헤더·단축키·팔레트·테마 [functional-spec/07-ui-common.md](functional-spec/07-ui-common.md).

### 와이어프레임 (1024px 이상)
```
┌─ Header (sticky top, z-40) ──────────────────────────────────────────────────────┐
│ [▣] AgentLens [v0.1.0] ●Live │ AI Agent · 하네스(Harness) · MCP 기술 큐레이션     │
│        [AI 챗] [소스 & 리서처] [MCP] [RSS] [공유 & 알림] [⏱ 다음 수집 Xh Ym 후]   │
│        [🗑 초기화 & 재수집] [⟳ 즉시 수집] [⌘ ⌘K] [☀/☾/💻]                          │
├─ 진행 상태 바 (메시지 있을 때만) ──────────────────────────────────────────────────┤
│ ⟳ 실시간 소식 수집 중...                       스트리밍 파이프라인: 피드 실시간 반영 중 │
└──────────────────────────────────────────────────────────────────────────────────┘
 main (max-w-7xl, 가운데)
 ┌─ DailyBriefingBanner (브리핑 있을 때) ─────────────────────────────────────────┐
 │ [✦] 오늘의 AI 브리핑 │ 날짜   헤드라인 ...                         브리핑 보기 → │
 └───────────────────────────────────────────────────────────────────────────────┘
 ┌─ 개요 카드 ────────────────────────────────────────────────────────────────────┐
 │ agentlens / feed (Live Stream)                              [전체 N건] [★Must-Read]│
 │ 글로벌 AI 소식 · Agent 아키텍처 · ... 3줄 핵심 요약과 개발자 시사점을 추출합니다.   │
 └───────────────────────────────────────────────────────────────────────────────┘
 ┌─ TechRadar (접기/자세히) ──────────────────────────────────────────────────────┐
 │ 최근 24시간 급상승 (Surging) 기술 스택: [태그] [태그] ...                        │
 └───────────────────────────────────────────────────────────────────────────────┘
 [전체 소식] [하네스 & 벤치마크] [MCP & 생태계] [에이전트 아키텍처] [최신 AI 동향]   ← CategoryFilter
 ┌─ 툴바 카드 ────────────────────────────────────────────────────────────────────┐
 │ SourceFilter: [전체][국내 테크][GitHub][HackerNews][arXiv][HuggingFace][Reddit] │
 │               [Global Blogs][북마크 n]                         [Must-Read 토글] │
 │ ────────────────────────────────────────────────────────────────────────────  │
 │ [🔍 키워드 검색 (SWE-bench, MCP, ...)        (검색)]   [인기순|품질순|최신순|추천순] │
 └───────────────────────────────────────────────────────────────────────────────┘
 총 N건의 소식 (북마크)(Must-Read 필터링)                              페이지 p / T
 ┌ NewsCard ┐ ┌ NewsCard ┐ ┌ NewsCard ┐      ← 1열(<768) / 2열(≥768) / 3열(≥1024)
 └──────────┘ └──────────┘ └──────────┘      또는 로딩 / 오류 / 빈 상태 박스
              [← 이전]  p / T  [다음 →]       ← 전체 페이지 2 이상일 때
 footer: AgentLens © 2026. AI Agent · 하네스(Harness) · MCP 생태계 인텔리전스 대시보드.
```

### 영역 구성
| 순서 | 영역 | 컴포넌트 | 내용 | 기능 상세 |
|---|---|---|---|---|
| 0 | 전역 단축키 | `HotkeyListener` | 화면에 그리지 않음. window keydown | 07 UI-05, UI-06 |
| 1 | 헤더 | `Header` | 브랜드, 이동·모달 버튼, 수집, 팔레트, 테마, 진행 상태 바, 초기화 확인 창, 커맨드 팔레트 | 07 UI-01, UI-02, UI-07 |
| 2 | 일일 브리핑 배너 | `DailyBriefingBanner` | 날짜, 헤드라인, `브리핑 보기`. 클릭하면 일일 브리핑 모달. 브리핑이 없으면 숨김 | 04 |
| 3 | 개요 카드 | `page.tsx` 인라인 | 경로 표시 `agentlens / feed`, 서비스 설명, 전체 건수(`stats.total_news` 없으면 `total`), Must-Read 배지(표시용) | 01 |
| 4 | Tech Radar | `TechRadar` | 급상승 기술 태그. 태그를 고르면 검색어로 들어간다 | 01 |
| 5 | 카테고리 필터 | `CategoryFilter` | 5개 카테고리와 건수. 고르면 소스를 `all` 로, 페이지를 1로 | 01 |
| 6 | 툴바 | `SourceFilter` + 검색 폼 + 정렬 버튼 | 소스 9개(북마크 포함), Must-Read 토글, 키워드 검색(`/` 로 포커스), 정렬 4종 | 01 |
| 7 | 상태 줄 | `page.tsx` 인라인 | 총 건수, 북마크·Must-Read 표시, 현재 페이지 | 01 |
| 8 | 카드 그리드 | `NewsCard` × n | 카드 클릭 → 뉴스 상세 모달. 북마크, `전용 챗에서 분석`(→ `/chat?sourceId=`), 원문 링크. j/k 포커스 링 | 01, 02 |
| 9 | 로딩·오류·빈 상태 | `page.tsx` 인라인 | 스피너 / 오류 + 다시 시도 / 빈 상태 + 필터 전체 초기화 | 07 UI-11 |
| 10 | 페이지네이션 | `page.tsx` 인라인 | 이전·다음, `p / T`. 한 페이지 18건 (`useNewsFeed.ts:86`) | 01 |
| 11 | 푸터 | `page.tsx` 인라인 | 저작권 문구 | — |
| 12 | 모달 6종 | 아래 '모달' 절 | — | — |

## 화면: AI 챗 (`/chat`)
기능 상세: [functional-spec/02-ai-chat.md](functional-spec/02-ai-chat.md). 반응형·모바일 규칙은 [functional-spec/07-ui-common.md](functional-spec/07-ui-common.md) UI-09, UI-10.

`/chat` 에는 홈 헤더, 전역 단축키, 커맨드 팔레트, 테마 전환 버튼이 없다. 테마는 홈에서 고른 값(localStorage)을 그대로 쓴다.

### 와이어프레임 (1024px 이상)
```
┌─ ChatSidebar (w-72, 열림 기본) ─┬─ 메인 열 ──────────────────────────────────────────┐
│ ChatSidebarHeader               │ [⚠ 요청하신 기사를 찾을 수 없어 ... ✕] (토스트, 조건부)│
│  [+ 새 대화]          [접기]     ├─ ChatHeader (sticky, z-30) ─────────────────────────┤
│  [🔍 대화 검색        ✕]         │ [← ] │ [🤖] AgentLens AI 챗                          │
│ SessionList                     │ [🎯 단일 기사 (Scoped) | 🌐 전체 코퍼스 (Global)]       │
│  ┌ SessionItemCard ───────[🗑]┐ │ [ActiveSourceChip ✕]   [모델 칩▾] [🕘] [+ 새 대화]*  │
│  │ 제목 · 시간 · 모드          │ ├─────────────────────────────────────────────────────┤
│  └────────────────────────────┘ │ ChatMessageList (role=log)                          │
│  ...                            │   메시지 없으면: 웰컴 + 추천 질문 4개 (2열)            │
│  (로딩: 스켈레톤 5줄)            │   있으면: ChatMessageItem / ModelChangeDivider 시간순 │
│  (오류: 다시 시도)               │     답변: WorkflowStepTracker, 마크다운, CitationBadge│
│  (빈 상태)                       │           ModelTierBadge, ExportToolbar, 복사/재시도  │
│                                 ├─ 하단 컴포저 (max-w-4xl) ───────────────────────────┤
│                                 │ (FocusCapsule: 필터 요약 · 초기화)                   │
│                                 │ ┌ ChatPromptInput ───────────────────────────────┐ │
│                                 │ │ textarea (최대 180px, 2000자)                  │ │
│                                 │ │ [모델 칩] 🌐 Global RAG • Enter: 전송 …  n/2000 [↑]│ │
│                                 │ └────────────────────────────────────────────────┘ │
└─────────────────────────────────┴─────────────────────────────────────────────────────┘
 * '새 대화' 헤더 버튼은 사이드바가 닫혀 있을 때만 보인다.
 1024px 미만: 사이드바 대신 🕘 버튼이 왼쪽 슬라이드 드로어(ChatHistoryDrawer)를 연다.
```

### 영역 구성
| 영역 | 컴포넌트 | 내용 |
|---|---|---|
| 대화 기록 사이드바 (1024px 이상) | `ChatSidebar` → `ChatSidebarHeader`, `SessionList` | 새 대화, 접기, 제목 검색, 세션 카드 목록(삭제 확인 팝오버) |
| 경고 토스트 | `ChatWorkspace` 인라인 | `sourceId` 기사를 못 찾았을 때 |
| 챗 헤더 | `ChatHeader` → `ActiveSourceChip`, `ChatModelSelector`(header-chip) | 피드로 돌아가기(`/`), 스코프 전환(Scoped/Global), 선택 기사 칩(해제), 모델 선택, 기록 버튼, 새 대화 |
| 메시지 목록 | `ChatMessageList` → `ChatMessageItem`(`CitationBadge`→`CitationPopover`, `WorkflowStepTracker`, `ExportToolbar`, `ModelTierBadge`, `CodeBlock`), `ModelChangeDivider` | 웰컴/추천 질문, 메시지·모델 변경 구분선 시간순, 새 항목마다 맨 아래로 부드럽게 스크롤 |
| 포커스 캡슐 | `FocusCapsule` | 현재 필터 요약, 클릭하면 포커스 필터 바텀시트, 초기화 |
| 입력창 | `ChatPromptInput` → `ChatModelSelector`(inline-chip) | 질문 입력(Enter 전송, Shift+Enter 줄바꿈), 글자 수 `n / 2000`, 전송 / 생성 중 `중단` |
| 기록 드로어 (1024px 미만) | `ChatHistoryDrawer` → `ChatSidebarHeader`, `SessionList` | 사이드바와 같은 내용, 세션 선택·새 대화 시 닫힘 |
| 포커스 필터 | `FocusBottomSheet` | 카테고리 5, 기간 4, 정렬 3, Must-Read 스위치, 초기화·적용 |

## 모달·드로어·바텀시트·팝오버
닫기 수단(Escape, 배경 클릭 등)의 공통 규칙과 컴포넌트별 차이는 [functional-spec/07-ui-common.md](functional-spec/07-ui-common.md) UI-08 에 있다.

| 이름 | 종류 | 여는 곳 | 담는 내용 | 컴포넌트 파일 | 기능 상세 |
|---|---|---|---|---|---|
| 뉴스 상세 | 모달 (`max-w-4xl`) | 뉴스 카드 클릭, 포커스 카드에서 Enter/스페이스 | 머리줄(카테고리, Must-Read, 제목, 북마크, X), 탭 `AI 요약 & 시사점`(Why It Matters, 전용 AI 챗 이동 배너, 3-Bullet TL;DR, 기술 스택, 상세 본문 요약 마크다운) / `Ask AI 질의응답`(빠른 질문, 스트리밍 답변, 복사, 대화 초기화), 바닥(출처, 작성자, `원문 링크 방문`) | `frontend/src/components/NewsDetailModal.tsx`, `frontend/src/components/news-detail/AskAiPanel.tsx` | 01, 02 |
| 일일 브리핑 | 모달 (`max-w-4xl`) | 일일 브리핑 배너 클릭 | 날짜·헤드라인, 도구줄(Notion 내보내기 / Notion에서 열기, 이메일 발송 입력, 복사, `.md` 다운로드, 설정), 결과 알림, 탭 `카테고리별 요약` / `마크다운 전문`, 바닥 `연동 설정 관리`·`닫기` | `frontend/src/components/DailyBriefingModal.tsx` | 04 |
| 브리핑 공유 및 연동 설정 | 모달 (`max-w-xl`) | 헤더 `공유 & 알림`, 일일 브리핑 모달의 설정 버튼들 | 탭 `Notion 연동` / `이메일 (SMTP)` / `웹훅 (Slack/Discord)`, 각 탭의 입력·연결 테스트·저장 | `frontend/src/components/BriefingSettingsModal.tsx` | 04 |
| 자동 글로벌 수집 스케줄러 | 모달 (`max-w-xl`, 항상 어두운 색) | 헤더 `다음 수집 … 후` (640px 이상) | 수집 주기(UTC 00·06·12·18시, KST 환산), 다음 예정 수집(분, 시각) | `frontend/src/components/ScheduleModal.tsx` | 01 |
| AgentLens MCP 연동 | 모달 (`max-w-2xl`) | 헤더 `MCP`, 커맨드 팔레트 | MCP 도구 4개 설명, `claude_desktop_config.json` 예시(고정 문자열), `설정 복사` | `frontend/src/components/McpModal.tsx` | 06 |
| 수집 소스 관리 및 자율 리서처 | 모달 (`max-w-4xl`) | 헤더 `소스 & 리서처`, 커맨드 팔레트 | 탭 `AI Deep Researcher (자율 발굴/채택)`(기본 탭, 딥 리서치 실행, 감사 일지, 단일 URL 프로빙) / `등록된 수집원 목록`(RSS 목록·토글·삭제·새 피드 등록, GitHub 저장소 토글), 토스트, 바닥 `sources.json` 표시 | `frontend/src/components/SourcesModal.tsx`, `frontend/src/components/sources/DeepResearcherTab.tsx`, `frontend/src/components/sources/SourcesListTab.tsx` | 05 |
| 수집 데이터 전체 삭제 및 재수집 | 확인 창 (`max-w-md`, `Header` 안 인라인) | 헤더 `초기화 & 재수집` | 영구 삭제 경고, `취소`, `전체 삭제 후 다시 수집` | `frontend/src/components/Header.tsx:258-287` | 07 UI-02, 01 |
| 커맨드 팔레트 | 대화상자 (`max-w-xl`, 위쪽) | ⌘K / Ctrl+K, 헤더 ⌘ 버튼 | 검색 입력, 명령 5개, 키 안내 | `frontend/src/components/CommandPalette.tsx` | 07 UI-07 |
| 대화 기록 드로어 | 왼쪽 슬라이드 드로어 (`w-72`/`w-80`) | 챗 헤더 기록 버튼 (1024px 미만) | 대화 기록 제목, 새 대화, 검색, 세션 목록 | `frontend/src/components/chat/ChatHistoryDrawer.tsx` | 02 |
| 수집 소식 포커스 필터 | 바텀시트 (640px 미만) / 가운데 모달 (640px 이상), `max-w-lg` | 포커스 캡슐 클릭 | 카테고리, 기간, 정렬, Must-Read, 대상 건수, 초기화·적용 | `frontend/src/components/chat/FocusBottomSheet.tsx` | 02 |
| 모델 선택 | 팝오버 (radiogroup) | 챗 헤더 모델 칩, 입력창 모델 칩 | haiku / sonnet / opus 3단계 | `frontend/src/components/chat/ChatModelSelector.tsx` | 02 |
| 인용 출처 프리뷰 | 팝오버 (`w-80`) | 답변 안 인용 배지 클릭 | 출처 기사 요약 | `frontend/src/components/chat/CitationPopover.tsx` (`CitationBadge.tsx` 가 연다) | 02 |
| 세션 삭제 확인 | 팝오버 (`w-64`) | 세션 카드 삭제 버튼 | 삭제 확인·취소 | `frontend/src/components/chat/DeleteConfirmPopover.tsx` | 02 |
| 브라우저 기본 대화상자 | `window.confirm` / `alert` | 소스 삭제, Ask AI 대화 초기화, 초기화 실패 | — | `SourcesModal.tsx:78`, `NewsDetailModal.tsx:193-197`, `Header.tsx:104` | — |

- 어디서도 렌더하지 않는 모달: `frontend/src/components/WebhookSettingsModal.tsx`(웹훅 URL 하나를 localStorage 에 저장하고 테스트·브리핑 전송). import 하는 곳이 없다.

## 컴포넌트 트리
```
RootLayout (app/layout.tsx)
└─ ThemeProvider (context/ThemeContext.tsx)
   ├─ HomePage "/" (app/page.tsx)  ── 훅: useBookmarks, useNewsFeed, useTheme, useRouter
   │  ├─ HotkeyListener
   │  ├─ Header
   │  │  ├─ ThemeToggle
   │  │  ├─ (초기화 확인 창, 인라인)
   │  │  └─ CommandPalette            ── useTheme, useRouter
   │  ├─ main
   │  │  ├─ DailyBriefingBanner
   │  │  ├─ TechRadar
   │  │  ├─ CategoryFilter
   │  │  ├─ SourceFilter
   │  │  ├─ (검색 폼, 정렬 버튼, 상태 줄, 로딩/오류/빈 상태, 페이지네이션: 인라인)
   │  │  └─ NewsCard × n
   │  │     └─ HandoverCtaButton (card-compact)
   │  ├─ footer
   │  ├─ NewsDetailModal
   │  │  ├─ HandoverCtaButton (modal-banner)
   │  │  ├─ MarkdownViewer
   │  │  └─ AskAiPanel
   │  │     └─ MarkdownViewer
   │  ├─ DailyBriefingModal
   │  │  └─ MarkdownViewer
   │  ├─ ScheduleModal
   │  ├─ McpModal
   │  ├─ BriefingSettingsModal
   │  └─ SourcesModal
   │     ├─ DeepResearcherTab
   │     └─ SourcesListTab
   └─ ChatPage "/chat" (app/chat/page.tsx)
      └─ Suspense (fallback: "워크스페이스 환경을 초기화하는 중...")
         └─ ChatWorkspace          ── 훅: useChatSessions, useSearchParams
            ├─ ChatSidebar (hidden lg:flex)
            │  ├─ ChatSidebarHeader
            │  └─ SessionList
            │     ├─ SessionListSkeleton | SessionEmptyState
            │     └─ SessionItemCard × n
            │        └─ DeleteConfirmPopover
            ├─ (경고 토스트, 인라인)
            ├─ ChatHeader
            │  ├─ ActiveSourceChip
            │  └─ ChatModelSelector (header-chip)
            ├─ ChatMessageList
            │  ├─ ChatMessageItem × n
            │  │  ├─ WorkflowStepTracker
            │  │  ├─ ReactMarkdown + CodeBlock (MarkdownViewer.tsx 에서 가져옴)
            │  │  ├─ CitationBadge → CitationPopover
            │  │  ├─ ModelTierBadge
            │  │  └─ ExportToolbar
            │  └─ ModelChangeDivider × n
            ├─ FocusCapsule
            ├─ ChatPromptInput
            │  └─ ChatModelSelector (inline-chip)
            ├─ ChatHistoryDrawer
            │  ├─ ChatSidebarHeader
            │  └─ SessionList (위와 같음)
            └─ FocusBottomSheet
```

## 상태 관리
- 전역 상태 라이브러리(Redux, Zustand 등)나 데이터 패칭 라이브러리(SWR, React Query)는 없다 (`frontend/package.json`). React `useState`/`useEffect`, Context 하나, 커스텀 훅으로 관리한다.

| 범위 | 위치 | 가진 상태 |
|---|---|---|
| 앱 전체 | `ThemeContext` (`context/ThemeContext.tsx`) | `theme`, `resolvedTheme`, `toggleTheme`, `setTheme` |
| 홈 피드 데이터·필터 | `useNewsFeed` (`hooks/useNewsFeed.ts`) | `category`(기본 `all`), `source`(`all`), `search`(''), `sort`(`hot`), `highSignalOnly`(false), `page`(1), `selectedTag`, `news`, `total`, `totalPages`, `loading`(true), `error`, `stats`, `briefing`, `techRadar`, `loadingRadar`. 필터가 바뀌면 `loadNews` 가 다시 만들어져 자동 재조회한다. 통계·브리핑·레이더는 마운트 때 한 번(그리고 헤더 새로고침 때) 읽는다 |
| 북마크 | `useBookmarks` (`hooks/useBookmarks.ts`) | `bookmarkedIds`, `bookmarkedItems`, `toggleBookmark`. localStorage 와 동기화 |
| 홈 모달·포커스 | `HomePage` (`app/page.tsx:28`, `:62-68`) | `focusedIndex`, `selectedItem`, 모달 열림 6개 |
| 헤더 | `Header` | 스케줄 상태, 수집 중 여부, 진행 메시지, 초기화 창, 팔레트 열림 |
| 챗 세션 목록 | `useChatSessions` (`components/chat/useChatSessions.ts`) | `sessions`, `isLoading`, `error`, `searchQuery`. 서버와 localStorage 이중 저장, 최대 30개 |
| 챗 작업 상태 | `ChatWorkspace` | `sessionId`(UUID), `messages`, `inputPrompt`, `scopeMode`(`global`), `activeSource`, `focusFilters`, `selectedTier`(`sonnet`), `modelSwitchEvents`, `isSidebarOpen`(true), `isDrawerOpen`, `isBottomSheetOpen`, `isStreaming`, `streamingMessageId`, `toastMessage`, `viewportHeight` |
| URL | `/chat?session_id=&sourceId=&q=` | 챗 초기 진입 상태 (위 '라우트' 절) |

### localStorage 키 (전체)
| 키 | 값 | 쓰는 곳 | 비고 |
|---|---|---|---|
| `agentlens_theme` | `light` \| `dark` \| `system` | `context/ThemeContext.tsx:46`, `:111`, `:126` | 토글·설정 때 저장 |
| `agentlens_bookmarks` | `NewsItem[]` JSON (최근 추가가 앞) | `hooks/useBookmarks.ts:6`, `:14`, `:36` | 북마크 보기는 서버 대신 이 목록을 거른다 |
| `agentlens_chat_sessions_index` | `ChatSessionMeta[]` JSON, 최대 30개 | `components/chat/useChatSessions.ts:19` | 서버 목록 조회 성공 때 덮어쓰고, 실패 때 대체로 쓴다 |
| `agentlens_chat_session_{sessionId}` | `ChatSessionDetail` JSON | `components/chat/useChatSessions.ts:20` | 세션 상세 L1 캐시. 서버가 404 이거나 네트워크 오류면 이것을 쓴다 |
| `agentlens_webhook_url` | 웹훅 URL 문자열 | `components/WebhookSettingsModal.tsx:23`, `:33` | 렌더되지 않는 컴포넌트라 지금은 쓰이지 않는다 |

- `sessionStorage`, 쿠키, IndexedDB 는 쓰지 않는다.

## 프론트가 부르는 API
### 호출 경로 두 가지
1. **rewrite 프록시 (기본)**: `src/lib/api.ts` 의 `getApiBase()` 는 브라우저에서 `''` 를 돌려줘 상대 경로 `/api/...` 로 부른다. Next 서버가 `next.config.ts` rewrites 로 `${INTERNAL_API_URL || 'http://127.0.0.1:8000'}/api/:path*` 에 넘긴다 (`lib/api.ts:3-10`, `next.config.ts:13-21`). 브라우저가 아닌 곳에서는 `INTERNAL_API_URL || NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'` 를 쓰지만, 모든 호출자가 클라이언트 컴포넌트라 실제로는 브라우저 경로만 쓰인다.
2. **backend 직접 연결**: `getDirectApiBase()` 는 `NEXT_PUBLIC_API_URL` 이 있으면 그 값, 없으면 브라우저의 `{protocol}//{hostname}:8000` 을 돌려준다 (`lib/api.ts:12-23`). 이 경로를 쓰는 곳은 `askQuestionAboutNewsStream` 하나다. 직접 연결이 네트워크 오류로 실패하면(중단 제외) 상대 경로로 한 번 더 시도한다 (`lib/api.ts:97-118`).

- `fetchWithTimeout` 은 `AbortController` 로 기본 8,000ms 뒤 요청을 끊는다 (`lib/api.ts:25-37`). 아래 표의 '시간 제한' 열이 비어 있으면 8,000ms 다.
- 인증 헤더는 보내지 않는다.

### `src/lib/api.ts` 함수
| 함수 | 메서드·경로 | 경로 종류 | 시간 제한 | 쓰는 곳 |
|---|---|---|---|---|
| `fetchNewsFeed` | `GET /api/news?category&source&search&sort&high_signal_only&page&size` (`all` 이면 category/source 생략, `high_signal_only` 는 true 일 때만) | 프록시 | | `useNewsFeed` |
| `fetchDailyBriefing` | `GET /api/briefing/today` | 프록시 | | `useNewsFeed` |
| `askQuestionAboutNews` | `POST /api/news/{id}/ask` `{question}` | 프록시 | 30,000ms | 쓰는 곳 없음 |
| `askQuestionAboutNewsStream` | `POST /api/news/{id}/ask/stream` `{question}` (SSE, `meta`/`token`/`done`) | 직접 → 실패 시 프록시 | 없음 (중단 신호만) | `NewsDetailModal` |
| `fetchScheduleStatus` | `GET /api/schedule/status` | 프록시 | | `Header`(30초 주기), `ScheduleModal` |
| `fetchCrawlProgress` | `GET /api/schedule/progress` | 프록시 | | `Header`(1.2초 폴링) |
| `triggerManualCollect` | `POST /api/schedule/trigger` | 프록시 | | `Header`, 커맨드 팔레트 |
| `resetAndRecollect` | `POST /api/schedule/reset-and-collect` | 프록시 | | `Header` |
| `fetchStats` | `GET /api/stats` | 프록시 | | `useNewsFeed` |
| `fetchTechRadar` | `GET /api/trends/radar` | 프록시 | | `useNewsFeed` |
| `deleteAllNews` | `DELETE /api/news/all` | 프록시 | | 쓰는 곳 없음 |
| `testWebhook` | `POST /api/webhook/test` `{webhook_url}` | 프록시 | | `BriefingSettingsModal`, `WebhookSettingsModal`(미사용) |
| `sendBriefingToWebhook` | `POST /api/webhook/send-briefing` `{webhook_url}` | 프록시 | | `WebhookSettingsModal`(미사용) |
| `fetchSources` | `GET /api/sources` | 프록시 | | `SourcesModal` |
| `toggleSource` | `PATCH /api/sources/{type}/{id}/toggle` | 프록시 | | `SourcesModal` |
| `addRssSource` | `POST /api/sources/rss` | 프록시 | | `SourcesListTab` |
| `deleteSource` | `DELETE /api/sources/{type}/{id}` | 프록시 | | `SourcesModal` |
| `inspectUrl` | `POST /api/research/inspect-url` `{url}` | 프록시 | 12,000ms | `DeepResearcherTab` |
| `discoverSources` | `POST /api/research/discover` `{query, category, limit}` | 프록시 | 12,000ms | 쓰는 곳 없음 |
| `registerCandidate` | `POST /api/research/register-candidate` | 프록시 | | 쓰는 곳 없음 |
| `fetchDeepResearchStatus` | `GET /api/research/status` | 프록시 | | `SourcesModal` |
| `fetchResearchAuditLogs` | `GET /api/research/audit-logs?limit={n}` (모달은 30) | 프록시 | | `SourcesModal` |
| `triggerDeepResearch` | `POST /api/research/run-deep?max_candidates={n}` (기본 6) | 프록시 | | `DeepResearcherTab` |
| `exportBriefingToNotion` | `POST /api/briefing/export/notion` `{api_key?, page_id?}` | 프록시 | 20,000ms | `DailyBriefingModal` |
| `sendBriefingByEmail` | `POST /api/briefing/send/email` `{to_email?, subject?}` | 프록시 | 20,000ms | `DailyBriefingModal` |
| `testNotionConnection` | `POST /api/briefing/test/notion` | 프록시 | 12,000ms | `BriefingSettingsModal` |
| `testEmailConnection` | `POST /api/briefing/test/email` | 프록시 | 15,000ms | `BriefingSettingsModal` |
| `fetchBriefingSettings` | `GET /api/briefing/settings` | 프록시 | | `BriefingSettingsModal` |
| `updateBriefingSettings` | `POST /api/briefing/settings` | 프록시 | 10,000ms | `BriefingSettingsModal` |

### `api.ts` 밖에서 직접 부르는 API
| 위치 | 메서드·경로 | 경로 종류 | 시간 제한 |
|---|---|---|---|
| `components/chat/useChatSessions.ts:68` | `GET /api/chat/sessions?limit=30` | 프록시 (상대 경로 `fetch`) | 없음 |
| `components/chat/useChatSessions.ts:127` | `GET /api/chat/sessions/{id}` | 프록시 | 없음 |
| `components/chat/useChatSessions.ts:225` | `POST /api/chat/sessions` (세션 저장, 실패 무시) | 프록시 | 없음 |
| `components/chat/useChatSessions.ts:256` | `DELETE /api/chat/sessions/{id}` | 프록시 | 없음 |
| `components/chat/ChatWorkspace.tsx:300` | `POST /api/chat/stream` (SSE, `status`/`sources`/`token`/`done`/`error`) | 프록시 (상대 경로) | 없음 (중단 버튼) |
| `components/chat/ChatWorkspace.tsx:520` | `GET /api/chat/sources/{id}` | 프록시 | 없음 |
| `components/Header.tsx:167` | `/api/news/feed/rss.xml` (링크, 새 탭) | 프록시 | — |

## 환경 변수
| 변수 | 쓰는 곳 | 기본값 | 설명 |
|---|---|---|---|
| `INTERNAL_API_URL` | `next.config.ts:14` (rewrite 대상), `lib/api.ts:9`, `:22` (브라우저 밖 기본 주소) | `http://127.0.0.1:8000` | Next 서버가 backend 에 붙는 주소. Dockerfile 의 빌드·실행 단계와 compose 모두 `http://backend:8000` |
| `NEXT_PUBLIC_API_URL` | `lib/api.ts:13-14` (직접 연결 주소), `:9` | 없음 → 브라우저 호스트의 `:8000` | 브라우저가 SSE 를 backend 에 직접 붙일 주소. compose 는 `${NEXT_PUBLIC_API_URL:-}` 를 실행 환경으로 넘긴다 |
| `NODE_ENV` | Next.js | Dockerfile `production` | |
| `PORT` | Next standalone 서버 | Dockerfile·compose `3001` | |
| `HOSTNAME` | Next standalone 서버 | Dockerfile `0.0.0.0` | |
| `NEXT_TELEMETRY_DISABLED` | Next.js | Dockerfile `1` | |

- `src/lib/env.ts` 는 zod 스키마 두 개를 정의한다. `clientEnvSchema`: `NEXT_PUBLIC_API_URL`(URL 또는 '' , 선택). `serverEnvSchema`: 여기에 `NODE_ENV`(`development`·`test`·`production`, 기본 `development`), `PORT`(선택 문자열), `INTERNAL_API_URL`(URL 또는 '', 선택). 모듈을 읽을 때 `serverEnvSchema.parse(process.env…)` 를 실행해 `env` 로 내보낸다. 그러나 이 모듈을 import 하는 파일이 없어 검증은 실행되지 않는다.
- `next.config.ts` 의 그 밖의 설정: `output: "standalone"`, `productionBrowserSourceMaps: false`, `allowedDevOrigins: ["macbookpro.tail304081.ts.net", "*.ts.net", "localhost", "127.0.0.1", "192.168.1.109"]`.

## 스타일 체계
- **도구**: Tailwind CSS 4 (`tailwindcss` 4.x, PostCSS 플러그인 `@tailwindcss/postcss`, `frontend/postcss.config.mjs`). `tailwind.config.*` 파일은 없고, `globals.css` 첫 줄이 `@import "tailwindcss";` 다. `@theme`, `@custom-variant` 재정의가 없어 브레이크포인트·색 팔레트·`dark:` 변형 모두 Tailwind 기본값이다.
- **아이콘**: `lucide-react`. **마크다운**: `react-markdown` + `remark-gfm`.
- **글꼴**: 루트 레이아웃이 Geist, Geist Mono 를 `next/font/google` 로 읽어 CSS 변수를 `<html>` 에 단다. 그러나 `globals.css` 의 `body` 가 `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", Helvetica, Arial, sans-serif` 를 지정하고, 변수를 Tailwind 글꼴 토큰에 연결하는 `@theme` 도 없어 Geist 변수를 쓰는 곳을 찾지 못했다. `font-mono` 는 Tailwind 기본 monospace 스택이다.
- **CSS 변수 토큰** (`globals.css:3-13`): `--background`(라이트 `#f8fafc`, 다크 `#0d1117`), `--foreground`(라이트 `#0f172a`, 다크 `#f0f6fc`), `color-scheme` light/dark. `body` 배경·글자에 쓴다.
- **테마 클래스**: `<html>` 의 `dark`/`light` 클래스와 `data-theme` 속성 (`ThemeContext`). 스타일은 두 방식이 섞여 있다.
  1. 라이트 기본 클래스(`bg-white`, `bg-slate-50/100`, `text-slate-500~900`, `border-slate-200`)를 쓰고, `html.dark` 선택자가 `!important` 로 GitHub 다크 계열 색으로 덮어쓴다 (`globals.css:150-208`).
  2. GitHub 다크 계열 hex 임의값 클래스(`bg-[#0d1117]` 등)를 쓰고, `html:not(.dark)` 선택자가 라이트 색으로 덮어쓴다 (`globals.css:22-144`).
  3. 일부 컴포넌트는 Tailwind `dark:` 변형을 직접 쓴다. 기본 `dark:` 는 OS `prefers-color-scheme` 기준이다 ('알려진 불일치·위험' 1).
- **색 매핑** (`globals.css`):
  | 용도 | 다크 값 | 라이트 값 |
  |---|---|---|
  | 페이지 배경 | `#0d1117` | `#f8fafc` |
  | 표면(카드·모달·헤더) | `#161b22` | `#ffffff` |
  | 보조 표면 / hover | `#21262d` | `#f1f5f9` |
  | 강한 보조 표면 | `#30363d` | `#e2e8f0` |
  | 테두리 | `#30363d` | `#e2e8f0` (`#21262d` 는 `#cbd5e1`) |
  | 본문 글자 | `#f0f6fc` | `#0f172a` |
  | 보조 글자 | `#c9d1d9` / `#e6edf3` | `#334155` |
  | 흐린 글자 | `#8b949e` | `#64748b` |
  | 강조 파랑 | `#58a6ff` | `#2563eb` (hover `#1d4ed8`, 테두리 `#93c5fd`, 옅은 배경 `#eff6ff`) |
  | 입력창 배경·테두리 | `#0d1117` / `#30363d` | `#ffffff` / `#cbd5e1` |
  | 자리표시 글자 | `#6e7681` | `#94a3b8` |
  | `pre`, `code` | `#161b22` 배경 | `#f1f5f9` 배경 |
  | 스크롤바 썸 / 트랙 | `#30363d` / `#0d1117` | `#cbd5e1` / `#f8fafc` |
- **의미 색** (Tailwind 기본 팔레트 직접 사용): 기본 동작 파랑(`blue-600`), 수집·성공 초록(`emerald-600`), 위험·오류 빨강(`red-600`, `rose`), Must-Read·인기 호박/주황(`amber-500`, `orange-500`), 챗 핸드오버·Scoped 남색(`indigo-600`), MCP 보라(`purple`).
- **공통 효과**: `shadow-2xl` 값 통일, `bg-black/60·70·75` 오버레이를 `rgba(15,23,42,0.6)` + `blur(4px)` 로 통일, 스크롤바 6px (`globals.css:210-251`).
- **반응형 브레이크포인트**: Tailwind 기본 sm 640px, md 768px, lg 1024px. 상세는 [functional-spec/07-ui-common.md](functional-spec/07-ui-common.md) UI-09.

## 테스트·목 (참고)
- 테스트 러너는 Vitest(jsdom) + Testing Library, 설정 `frontend/vitest.config.ts`, 준비 파일 `frontend/src/tests/setup.ts`.
- MSW 목 서버(`frontend/src/mocks/server.ts`, `msw/node`)는 테스트에서만 켠다 (`onUnhandledRequest: 'bypass'`). 브라우저용 MSW 워커는 없고 실행 중인 앱은 목을 쓰지 않는다.

## 알려진 불일치·위험
1. **`/api/chat/stream` 은 rewrite 프록시를 거친다.** `ChatWorkspace` 는 상대 경로 `fetch('/api/chat/stream')` 로 부른다 (`ChatWorkspace.tsx:300`). backend 직접 연결(`getDirectApiBase`)을 쓰는 SSE 는 뉴스 Ask AI 스트림(`/api/news/{id}/ask/stream`) 하나뿐이다. 두 SSE 를 모두 직접 연결한다고 적은 문서가 있다면 코드와 다르다. `getDirectApiBase` 의 주석은 직접 연결 이유를 'Next.js rewrites 의 청크 버퍼링 회피' 로 적고 있어, 챗 스트림은 그 버퍼링 영향을 받을 수 있다 (실행해서 확인하지 않았다).
2. **`NEXT_PUBLIC_API_URL` 을 compose 실행 환경으로만 넘긴다.** Next.js 는 `NEXT_PUBLIC_` 변수를 빌드 때 클라이언트 번들에 넣는다. Dockerfile 빌드 단계는 이 값을 설정하지 않으므로, compose 의 `NEXT_PUBLIC_API_URL` 은 브라우저 코드의 `getDirectApiBase` 에 반영되지 않고 `{hostname}:8000` 으로 붙을 가능성이 높다 (빌드 산출물로 확인하지 않았다). backend 8000 포트가 브라우저에서 닿지 않는 배포에서는 Ask AI 스트림이 프록시 경로로 다시 시도한다.
3. **`src/lib/env.ts` 를 아무도 import 하지 않는다.** 환경 변수 검증 스키마가 실행되지 않는다.
4. **쓰지 않는 코드가 있다.** `WebhookSettingsModal`(렌더되지 않음, `agentlens_webhook_url` 키 포함), `askQuestionAboutNews`, `deleteAllNews`, `discoverSources`, `registerCandidate`, `sendBriefingToWebhook`(미사용 모달에서만 사용).
5. **챗 API 호출에 시간 제한이 없다.** `api.ts` 밖의 챗 호출 6곳은 `fetchWithTimeout` 을 쓰지 않는다. 세션 목록·상세 조회가 멈추면 로딩 상태가 계속될 수 있다.
6. **챗 세션 상세 캐시가 쌓인다.** 세션 목록을 30개로 자를 때 밀려난 세션의 `agentlens_chat_session_{id}` 키는 지우지 않는다. `resetSessions` 도 목록 키만 지운다. localStorage 용량이 계속 늘 수 있다.
7. **버전 표시가 세 곳에서 다르다.** 헤더 `v0.1.0`, `package.json` 과 `/api/health` 의 `0.3.1`. `/api/health` 의 버전도 `package.json` 을 읽지 않는 고정 문자열이다.
8. **`/api/health` 와 rewrite 경로가 겹친다.** rewrites 는 배열로 반환되어 파일 시스템 라우트 뒤에 적용되는 방식이라 Route Handler 가 먼저 응답하는 것으로 보이지만, 실행해서 확인하지 않았다. 이 순서가 바뀌면 프론트 healthcheck 가 backend 로 넘어간다.
9. **테마 적용 방식이 세 가지로 섞여 있다** (스타일 체계 1~3). 특히 Tailwind `dark:` 변형이 OS 설정을 따라, 앱에서 고른 테마와 OS 설정이 다르면 `dark:` 를 쓴 컴포넌트(커맨드 팔레트, 테마 버튼, 뉴스 카드, 챗 메시지 등)만 다른 테마로 보일 수 있다. `!important` 덮어쓰기에 의존해 새 색 클래스를 추가할 때마다 `globals.css` 매핑도 늘려야 한다.
10. **Geist 글꼴을 읽지만 쓰지 않는 것으로 보인다** (스타일 체계 '글꼴'). 불필요한 글꼴 요청이 생긴다.
11. **스케줄 모달 문구에 수집 시각이 고정돼 있다.** `매일 4회(0, 6, 12, 18시 UTC)` 와 KST 환산을 문자열로 박아 두어, backend 스케줄이 바뀌면 화면이 따라가지 않는다 (`ScheduleModal.tsx:30`, `:39-40`).
12. **MCP 모달의 설정 예시가 고정 문자열이다.** `"cwd": "/path/to/agentlens/backend"` 자리표시를 그대로 복사하게 한다 (`McpModal.tsx:8-16`).
13. **`/chat` 에서는 테마를 바꿀 수 없다.** 테마 버튼·단축키·팔레트가 홈에만 있다.
