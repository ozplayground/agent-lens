# 화면 명세: AgentLens

Updated: 2026-11-09

## 개요
frontend 는 Next.js 16 App Router 앱이다 (`frontend/`, React 19, Tailwind 4, `output: "standalone"`, 포트 3001). 화면 라우트는 뉴스 피드 `/` 와 AI 챗 `/chat` 두 개이고, 프론트 자체 API 라우트는 헬스체크 `/api/health` 하나다. 그 밖의 `/api/*` 요청은 rewrite 로 backend 에 넘긴다. 모든 화면은 클라이언트 컴포넌트(`'use client'`)가 데이터를 읽는다. 서버 컴포넌트에서 데이터를 읽는 곳은 없다.

공통 UI 규칙(헤더, 테마, 단축키, 커맨드 팔레트, 대화상자 규칙, 반응형, 로딩·오류 표시, 마크다운)은 [functional-spec/07-ui-common.md](functional-spec/07-ui-common.md) 에 있다. 색·글꼴·간격·부품 같은 디자인 규칙의 상세는 [design-system.md](design-system.md) 에 있다.

## 라우트
| 경로 | 종류 | 파일 | 제목(`<title>`) | 설명 |
|---|---|---|---|---|
| `/` | 페이지 (클라이언트) | `frontend/src/app/page.tsx` | `AgentLens \| AI Agent, Harness & MCP Global News` (루트 레이아웃 메타데이터) | 뉴스 피드, 일일 브리핑, 트렌드 레이더, 대화상자 6종 |
| `/chat` | 페이지 (서버 컴포넌트 껍데기 + 클라이언트 `ChatWorkspace`) | `frontend/src/app/chat/page.tsx` | `AI 챗 워크스페이스 \| AgentLens` | AI 챗 워크스페이스 |
| `/api/health` | Route Handler (`GET`, `dynamic = 'force-dynamic'`) | `frontend/src/app/api/health/route.ts` | — | 프론트 헬스체크 |

- 루트 레이아웃 (`frontend/src/app/layout.tsx:28-44`): `<html lang="ko" suppressHydrationWarning>`. `<head>` 의 인라인 스크립트가 첫 그리기 전에 `localStorage['agentlens_theme']` 와 OS 설정으로 `<html>` 의 `dark`/`light` 클래스, `data-theme`, `style.colorScheme` 을 정한다 (`layout.tsx:22-26`, `:32`). `<body className="min-h-dvh bg-canvas text-fg overflow-x-hidden">` 안에 `ThemeProvider` → `<div id="app-shell" className="flex min-h-dvh flex-col">{children}</div>` 와 알림 영역 `ToastRegion` 을 둔다. 웹 글꼴은 읽지 않는다 (시스템 글꼴, '스타일 체계'). 메타 설명은 `전세계 AI 뉴스, 최신 Agent 기술, 하네스(Harness) 방법론 및 벤치마크, MCP(Model Context Protocol) 및 스킬 플러그인 큐레이션 플랫폼`.
- viewport: `width=device-width, initial-scale=1, interactive-widget=resizes-content`, `color-scheme: light dark`, `theme-color` 라이트 `#f8fafc` / 다크 `#0e1013` (`layout.tsx:6-15`). 확대를 막지 않는다.
- `/chat` 쿼리 파라미터 (`ChatWorkspace.tsx:511-578`):
  | 파라미터 | 동작 |
  |---|---|
  | `session_id` | 저장된 대화를 불러온다. 있으면 다른 파라미터는 보지 않는다 |
  | `sourceId` | 정수 기사 id. `GET /api/chat/sources/{id}` 로 기사를 읽어 `단일 기사` 범위(scoped)로 시작한다. 못 찾으면 경고 토스트(`요청하신 기사를 찾을 수 없어 전체 소식 모드로 시작합니다.`) 후 `전체 소식` 범위(global) |
  | `q` | 시작하자마자 이 질문을 보낸다 (`sourceId` 와 함께면 그 기사 범위로) |
- `/api/health` 응답: `{"status":"healthy","service":"agentlens-frontend","version":"0.3.1","timestamp":<ISO>}`. Docker `HEALTHCHECK` 와 compose healthcheck 가 `http://127.0.0.1:3001/api/health` 를 부른다 (`frontend/Dockerfile`, `docker-compose.yml`). rewrite 규칙 `/api/:path*` 와 경로가 겹치지만 Route Handler 로 응답한다는 전제로 healthcheck 가 짜여 있다 (실제 우선순위는 실행해서 확인하지 않았다).
- 이 밖의 페이지(404 커스텀, `loading.tsx`, `error.tsx`)는 없다.

## 화면: 뉴스 피드 (`/`)
기능 상세: 뉴스 피드 [functional-spec/01-news-feed.md](functional-spec/01-news-feed.md), 브리핑·공유 [functional-spec/04-briefing-and-sharing.md](functional-spec/04-briefing-and-sharing.md), 소스·리서치 [functional-spec/05-sources-and-research.md](functional-spec/05-sources-and-research.md), MCP [functional-spec/06-mcp-server.md](functional-spec/06-mcp-server.md), 헤더·단축키·팔레트·테마 [functional-spec/07-ui-common.md](functional-spec/07-ui-common.md).

### 와이어프레임: 데스크톱 (1024px 이상)
```
┌─ Header (sticky top-0, z-30, h-14, 한 줄) ──────────────────────────────────────────────────┐
│ [>_] AgentLens [v0.3.1]  [피드] [🤖 AI 챗]   [🕘 다음 수집 5h 14m 후] [⟳ 즉시 수집] [⌘ 검색·명령 ⌘K] [☀▾] [⋯] │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
 수집 진행 줄 (메시지 있을 때만, h-9): ⟳ 실시간 소식 수집 중...                 피드 실시간 반영 중
 main#main (max-w-7xl, 가운데)
 ┌─ InsightsBar (h-12) ──────────────────────────────────────────────────────────────────────┐
 │ ✦ 오늘의 브리핑 · 날짜 · 헤드라인…            급상승 [태그] [태그] [태그]   [∿ 트렌드 ▾]  │
 └───────────────────────────────────────────────────────────────────────────────────────────┘
   (트렌드를 펼치면 12px 아래 TrendRadarPanel: 급상승 6, 카테고리 분포(한국어 라벨, 4열), 전체 기술 태그, 필터 초기화)
 [🔍 키워드 검색                                                                             ]   ← 검색 영역: 콘텐츠 전체 폭 입력 36px, 고정하지 않음
 ┌─ 필터 영역 (sticky top-14, z-10) — 1280px 이상 ──────────────────────────────────────────┐
 │ [전체 소식 n][하네스 & 벤치마크 n][MCP & 생태계 n][에이전트 아키텍처 n][최신 AI 동향 n] (칩 아이콘 있음)         │
 │ [전체 n][국내 테크 n][GitHub n][HackerNews n]…[Global Blogs n][🔖 북마크 n]                    [☆ Must-Read] │
 └───────────────────────────────────────────────────────────────────────────────────────────┘
   1024~1279px 도 같은 두 줄(카테고리 칩 아이콘 숨김). 줄이 넘치면 넘친 쪽 24px 흐림 + 줄 밖 [‹]·[›] 스크롤 버튼
   [☆ Must-Read] 는 소스 줄 밖, 소스 줄 오른쪽 끝의 고정 토글이라 소스 줄을 밀어도 늘 보인다
 총 N건 (전체 M건) [북마크 보기] [Must-Read]                         페이지 p / T  [인기순 ▾]   ← 목록 머리줄: 상태 + 정렬(w-32)
   검색 입력·카테고리 줄·소스 줄 + 토글·목록 머리줄의 왼쪽·오른쪽 끝이 콘텐츠 상자 끝과 같다
 ┌ NewsCard ─────────────────────────────┐ ┌ NewsCard ┐ ┌ NewsCard ┐   ← 3열, 간격 20px, 같은 줄은 같은 높이
 │ 하네스 · 국내 테크 · 18일 전        [🔖] │ │          │ │          │   ← ① 머리줄 (배지 없음, 넘치면 말줄임)
 │ 제목 1줄째                              │ │          │ │          │   ← ② 제목 2줄 고정
 │ 제목 2줄째…                             │      또는 같은 틀의 스켈레톤 6장 / 오류 / 빈 상태
 │ ▎시사점 … (2줄 고정, 반복이면 요약)      │                                 ← ③ 본문 2줄 고정
 │ [☆ Must-Read] [기술] [기술] [기술…]      │                                 ← ④ 배지 줄 (있을 때만, 최대 4, 한 줄. 기술 배지는 자리가 모자라면 48~128px 사이로 줄고 말줄임)
 │ ─────────────────────────────────────── │
 │ ★ n ⑂ n 🔥 n                            │                              ← ⑤ 바닥 (원천 지표·인기 점수는 지표 소스만, 영역 구성 6)
 │             [✦ AI 챗에서 분석] [원문 ↗]  │                              ← 한 줄에 다 들지 않으면 버튼 묶음이 다음 줄 오른쪽 끝. 글자는 모든 폭에서 보인다
 └───────────────────────────────────────┘
                     [← 이전]  p / T  [다음 →]          ← 전체 페이지 2 이상일 때
 footer: AgentLens © 2026 · AI 에이전트 · 하네스 · MCP 생태계 소식
```

### 와이어프레임: 태블릿 (768~1023px)
```
┌─ Header (h-14) ────────────────────────────────────────────────────┐
│ [>_] AgentLens  [피드] [🤖 AI 챗]        [🕘 5h 14m] [⟳] [⌘] [☀▾] [⋯] │
└────────────────────────────────────────────────────────────────────┘
 ┌─ InsightsBar ──────────────────────────────────────────────────────┐
 │ ✦ 오늘의 브리핑 · 날짜 · 헤드라인…                     [∿ 트렌드 ▾] │   ← 급상승 칩은 1024px 이상
 └────────────────────────────────────────────────────────────────────┘
 [🔍 키워드 검색                                                     ]   ← 검색 영역: 전체 폭
 ┌─ 필터 영역 (sticky top-14) ────────────────────────────────────────┐
 │ [전체 소식 n][하네스 & 벤치마크 n][MCP & 생태계 n][에이전트 …   [›] │   ← 칩 아이콘 숨김
 │ [전체 n][국내 테크 n][GitHub n] …               [›] [☆ Must-Read] │   ← Must-Read 토글(별 + 글자)
 └────────────────────────────────────────────────────────────────────┘
 총 N건                                       페이지 p / T  [인기순 ▾]   ← 목록 머리줄, 정렬 w-28
 ┌ NewsCard ┐ ┌ NewsCard ┐       ← 2열, 간격 16px
```

### 와이어프레임: 모바일 (768px 미만, 390×844 기준)
```
┌─ Header (h-14) ──────────────────────┐
│ [>_] AgentLens          [🤖] [⌘] [⋯] │   ← 더보기: 소스 & 리서처, 공유 & 알림, MCP 연동, RSS 피드,
└──────────────────────────────────────┘     수집 스케줄, 즉시 수집, 테마(라디오 3), 초기화 & 재수집…
 ┌──────────────────────────────────────┐
 │ ✦ 오늘의 브리핑 · 헤드라인… [∿ 트렌드 ▾] │   ← 날짜 숨김
 └──────────────────────────────────────┘
 [🔍 키워드 검색                       ]   ← 검색 영역: 전체 폭 입력 44px
[전체 소식 n][하네스 & 벤치마크 n][MCP …  ›]  ← 필터 줄 1: 카테고리, 화면 좌우 끝까지. 필터 영역은 고정하지 않는다
[전체 n][국내 테크 n][Git… ›]        [☆]  ← 필터 줄 2: 소스 줄은 왼쪽만 화면 끝까지, 오른쪽 끝에 Must-Read 토글.
                                           넘친 쪽마다 ‹·› 표시(오른쪽 › 는 토글 앞). 처음에는 첫 칩 [전체] 부터 보인다 (스크롤 0).
                                           [☆] 는 Must-Read 토글: 별 아이콘만, 44×44, 접근 이름 Must-Read
 총 N건         페이지 p / T  [인기순 ▾]   ← 목록 머리줄: 상태 + 정렬(w-28, 44px). 상태가 길어 줄바꿈해도 정렬은 첫 줄 오른쪽
 ┌ NewsCard ────────────────────────────┐   ← 1열
 └──────────────────────────────────────┘
 [←   이전   ]  p / T  [   다음   →]        ← 두 버튼이 반씩 차지 (44px)
```

### 영역 구성
| 순서 | 영역 | 컴포넌트 | 내용 | 기능 상세 |
|---|---|---|---|---|
| 0 | 전역 단축키 | `HotkeyListener` | 화면에 그리지 않음. window keydown. 오버레이가 열려 있으면 단일 키를 막는다 (`blockSingleKeys`) | 07 UI-05, UI-06 |
| 1 | 헤더 | `Header` | 건너뛰기 링크, 브랜드(`/` 링크, lg 이상 버전 배지), 주 내비(`피드`·`AI 챗`), 수집 상태, 즉시 수집, 커맨드 팔레트, 테마 메뉴, 더보기 메뉴. 커맨드 팔레트와 초기화 확인 창을 가진다 | 07 UI-01, UI-04, UI-07 |
| 2 | 수집 진행 줄 | `CollectorStatusLine` (`Header.tsx:226-250`) | 헤더 바로 아래, 메시지가 있을 때만 보인다. `role="status"`. 수집 중에 화면을 떠났다 오면 다시 붙는다 | 07 UI-02 |
| 3 | 요약 바 | `InsightsBar` → `TrendRadarPanel` | `오늘의 브리핑 · 날짜 · 헤드라인` 버튼(→ 일일 브리핑, 768px 미만 날짜 숨김, 남는 폭을 모두 쓰는 한 줄 말줄임), 1024px 이상 급상승 태그 칩 3개(가로 스크롤 줄), `트렌드` 펼침 버튼. 첫 읽기가 끝나기 전이고 보여 줄 것이 없을 때만 48px 스켈레톤이고, 다시 읽는 동안에는 이전 내용을 그린다. 브리핑·레이더 둘 다 없으면 그리지 않는다. 펼친 패널의 카테고리 분포 라벨은 한국어(`하네스 & 벤치마크` 등), 640px 미만 1열·이상 2열·1024px 이상 4열 | 01 NEWS-14, NEWS-18, 04 |
| 4 | 검색 영역·필터 영역 | `FeedToolbar` | 형제 두 영역을 그린다. ① 검색 영역(`data-feed-search`): 키워드 검색 입력 하나(자리표시 `키워드 검색`, `/` 로 포커스), 모든 폭에서 콘텐츠 전체 폭, 높이 768px 미만 44px·이상 36px, 고정하지 않는다. ② 필터 영역(`data-feed-toolbar`, 768px 이상 헤더 아래에 고정): 줄 1 카테고리 칩 5개(건수, 1280px 이상 아이콘), 줄 2 소스 칩(`전체`, 건수가 있는 소스, `북마크 n`)과 그 오른쪽 끝 `Must-Read` 토글(소스 줄 밖 고정, `aria-pressed`, 768px 미만 별 아이콘만·44×44, 이상 별 + 글자, 접근 이름은 늘 `Must-Read`). 두 줄은 각각 독립된 가로 배치(`data-toolbar-row`)이고 줄 사이 8px. 필터 영역 안에는 입력·선택 상자가 없다 (검색은 검색 영역, 정렬은 목록 머리줄). 768px 미만은 카테고리 줄이 화면 좌우 끝까지, 소스 줄이 왼쪽 화면 끝까지 늘어나고 토글은 같은 줄 오른쪽 끝에 남는다. 모든 폭에서 같은 DOM 트리 하나를 그리고 폭별 배치는 CSS 클래스로만 바꾼다. DOM 순서 = 화면 순서 = Tab 순서 `검색 → 카테고리 → 소스 → Must-Read` 이고, 폭이 바뀌어도 검색 입력·칩 줄·토글이 다시 마운트되지 않아 포커스·입력값이 남는다. 칩 줄 스크롤 위치는 사용자가 직접 민 줄만 남고, 그렇지 않은 줄은 줄 폭이 바뀌면 선택 칩이 보이게 다시 맞춘다 (07 UI-09, 표는 01 NEWS-02). 칩 줄은 가로 스크롤 줄(넘친 쪽 흐림, 768px 이상 스크롤 버튼, 768px 미만 넘친 쪽마다 `‹`·`›` 표시). 소스 줄은 선택된 소스 칩이 보이게 민다 (`Must-Read` 를 켜고 꺼도 소스 줄은 움직이지 않는다). 필터를 바꾸면 1페이지로, 카테고리를 바꾸면 소스 `all` | 01 NEWS-02~06 |
| 5 | 목록 머리줄 | `FeedStatusBar` | `data-feed-list-header`. 왼쪽 상태(`총 N건`, 필터가 걸려 있으면 `(전체 M건)`, `북마크 보기`·`Must-Read` 배지, 오른쪽 끝 `페이지 p / T`, `role="status"`)와 그 뒤 형제 정렬 `Select`(인기순·품질순·최신순·추천순, 숨긴 라벨 `정렬`, 폭 `w-28`, 1280px 이상 `w-32`, 높이 768px 미만 44px·이상 36px). 정렬은 상태 live 영역 밖이라 값을 바꿔도 상태 문장으로 읽히지 않는다. 정렬을 바꾸면 1페이지로. 머리줄은 위쪽 맞춤이고 상태의 최소 높이가 정렬 높이와 같아, 한 줄일 때 상태 글자와 정렬의 세로 가운데가 같고 상태가 줄바꿈되어도 정렬은 첫 줄 오른쪽에 남는다 | 01 NEWS-02, NEWS-05 |
| 6 | 카드 그리드 | `NewsCard` × n | 고정 틀: 머리줄(짧은 카테고리 라벨 · 소스 · 시간, 북마크) / 제목 2줄 / 시사점 또는 요약 2줄(목록에서 반복되는 시사점이면 요약) / 배지 줄(Must-Read + 기술 스택 3, 있을 때만, 한 줄. 기술 배지는 자리가 모자라면 각 48~128px 사이로 줄고 글자는 말줄임, `title` 에 전체 이름. Must-Read 는 줄지 않음) / 바닥(원천 지표·개수·인기 점수, `AI 챗에서 분석`, `원문`. 한 줄에 다 들지 않으면 버튼 묶음이 다음 줄 오른쪽 끝으로 내려가고, 이관 버튼 글자는 모든 폭에서 보인다). 머리줄의 짧은 카테고리 라벨은 `title` 에 긴 라벨(예: `에이전트` → `에이전트 아키텍처`). 원천 지표(`raw_score`)는 실제 지표를 주는 소스만 그린다: `github` 스타(`Star`, `title` `GitHub 스타`), `hackernews` 포인트·`reddit` 추천(`ArrowBigUp`). 그 밖 소스(국내 테크·RSS·arXiv·HuggingFace, 모르는 소스)는 `raw_score` 가 0 보다 커도 그리지 않는다. 개수(`comments_count`, 0 이면 숨김)는 `github` 포크(`GitFork`, `title` `GitHub 포크`), 그 밖 댓글(`MessageSquare`). 인기 점수(`Flame`)는 원천 지표가 있는 소스(`github`·`hackernews`·`reddit`)이고 25 초과일 때만 그린다 (인기 점수는 `raw_score` 에서 계산되므로 그 밖 소스에서는 합성 값이다). 지표 종류와 라벨은 `lib/labels.ts` 의 `scoreMetric`·`countMetric` 에서 나오고, `scoreMetric` 이 원천 지표와 인기 점수 둘 다의 표시 조건이다. DOM 속성: 카드 `data-source`, 통계마다 `data-card-stat`(`score`·`count`·`hotness`)과 `data-metric`(인기 제외). 같은 줄 카드는 같은 높이. 카드(또는 제목 버튼) 클릭 → 뉴스 상세. 북마크(`보관하기`), `AI 챗에서 분석`(접근 이름 = 보이는 글자, → `/chat?sourceId=`), `원문`. j/k 포커스 링 | 01 NEWS-08, 02 |
| 7 | 로딩·오류·빈 상태 | `NewsCardSkeleton` × 6 / `ErrorState` / `EmptyState` | 스켈레톤(카드와 같은 틀, 지금 조건의 목록이 아직 없을 때만) / 오류 + `다시 시도` / 빈 상태 + `필터 전체 초기화`. 같은 조건을 다시 읽는 동안은 이전 카드를 그리고, 그 다시 읽기가 실패하면 `danger` 알림 | 07 UI-11 |
| 8 | 페이지 이동 | `FeedPagination` | 이전·다음, `p / T`. 바꾸면 목록 머리줄의 상태로 스크롤·포커스. 한 페이지 18건 (`useNewsFeed.ts:81`) | 01 |
| 9 | 푸터 | `page.tsx:271-273` | 저작권 한 줄 | — |

- 본문(`main`) 영역 사이 세로 간격은 768px 미만 12px, 이상 16px 하나다: 요약 바 → 검색 영역 → 필터 영역 → 목록 머리줄 → 카드 그리드가 모두 이 간격이다. 필터 영역의 sticky 배경용 위아래 여백은 음수 마진으로 상쇄한다 (`page.tsx:170`, `feed/FeedToolbar.tsx:218-221`).
| 10 | 대화상자 6종 | 아래 '대화상자·드로어·시트·팝오버' 절 | — | — |

## 화면: AI 챗 (`/chat`)
기능 상세: [functional-spec/02-ai-chat.md](functional-spec/02-ai-chat.md). 반응형·모바일 규칙은 [functional-spec/07-ui-common.md](functional-spec/07-ui-common.md) UI-09, UI-10.

`/chat` 에는 피드의 헤더(`Header`)와 단일 키 단축키가 없다. 챗 헤더(`ChatHeader`)가 ⌘K 커맨드 팔레트와 더보기 메뉴(테마 라디오 3개)를 가진다.

### 와이어프레임: 데스크톱 (1024px 이상)
```
┌─ ChatSidebar (w-72, 열림 기본, z-20) ─┬─ ChatHeader (sticky, z-30, h-14) ─────────────────────────────────┐
│ [+ 새 대화]               [⇤ 접기]     │ [← 피드] [🕘] AI 챗                           [+]* [⌘] [⋯]          │ ← 56px
│                                       ├─ ChatContextBar (h-11, 가로 스크롤 줄) ───────────────────────────┤
│ [🔍 대화 검색...           ✕]           │     [◎ 단일 기사 | 🌐 전체 소식] [기사 칩 ✕]                      │ ← 44px
├───────────────────────────────────────┼───────────────────────────────────────────────────────────────────┤ ← 두 쪽 아래 경계 100px
│ SessionList                           │ ChatMessageList (role=log)                                        │
│  ┌ SessionItemCard ─────────[🗑]┐     │   메시지 없으면: 웰컴 + 추천 질문 4개 (2열, 아이콘 + 글자 왼쪽 정렬)  │
│  │ 제목 · [단일 기사/전체 소식] · 날짜 │     │   있으면: ChatMessageItem / ModelChangeDivider 시간순               │
│  └──────────────────────────────┘     │     답변: WorkflowStepTracker, 마크다운, 인용 배지, ModelTierBadge, │
│  ...                                  │           답변 복사·다시 시도, ExportToolbar                        │
│  (로딩: 스켈레톤 5줄)                  │     ┌ 알림 (입력 영역 바로 위 8px, 메시지 열 폭) ──────────┐        │
│  (오류: ErrorState + 다시 시도)        │     └──────────────────────────────────────────────────┘        │
│  (빈 상태)                             ├─ 하단 입력 영역 (bg-surface, border-t) ───────────────────────────┤
│                                       │ [◎ 포커스: 전체 소식 ▾] [✕]                                       │
│                                       │ ┌ textarea (최대 180px, 2000자) ────────────────────────────────┐ │
│                                       │ └──────────────────────────────────────────────────────────────┘ │
│                                       │ [모델 칩 ▾] Enter: 전송, Shift+Enter: 줄바꿈        n / 2000 [↑]  │
└───────────────────────────────────────┴───────────────────────────────────────────────────────────────────┘
 * 모델 칩은 모든 폭에서 입력창 아래 한 곳에만 있다 (헤더에는 없다).
 * 새 대화 버튼은 사이드바를 접었을 때만 보인다. 더보기: 테마(라이트·다크·시스템), 뉴스 피드로 이동.
 * 열 맞춤: 맥락 줄 스크롤 영역, 메시지 열, 입력 영역은 모두 바깥 `px-4 md:px-6`, 안쪽 `mx-auto w-full max-w-3xl` 이라 왼쪽 끝이 맞는다.
 * 사이드바 머리 영역은 두 줄이다: 1줄 56px(`+ 새 대화`, 접기) = 챗 헤더 높이, 2줄 44px(`대화 검색`) = 맥락 줄 높이.
```

### 와이어프레임: 태블릿 (768~1023px)
```
┌─ ChatHeader (h-14) ──────────────────────────────────────────┐
│ [← 피드] [🕘] AI 챗                             [+] [⌘] [⋯]     │   ← 🕘 는 왼쪽 드로어(ChatHistoryDrawer)를 연다
├─ ChatContextBar ─────────────────────────────────────────────┤
│ [◎ 단일 기사 | 🌐 전체 소식] [기사 칩 ✕]                        │
├──────────────────────────────────────────────────────────────┤
│ 메시지 열 (max-w-3xl)                                         │
├─ 입력 영역 ──────────────────────────────────────────────────┤
│ [◎ 포커스: …] / textarea / [모델 칩 ▾]           n / 2000 [↑] │   ← Enter 안내 숨김
└──────────────────────────────────────────────────────────────┘
```

### 와이어프레임: 모바일 (768px 미만, 390×844 기준)
```
┌─ ChatHeader (h-14) ────────────────┐
│ [←] [🕘] AI 챗            [+] [⋯]   │   ← 커맨드 팔레트는 더보기 안
├─ ChatContextBar (min-h-11) ────────┤
│ [◎ 단일 기사 | 🌐 전체 소식]        │   ← 기사 칩이 없으면 넘치지 않는다. 넘치면 넘친 쪽마다 ‹·› 표시
├────────────────────────────────────┤
│ 웰컴 + 추천 질문 4개 (1열)           │
├─ 입력 영역 (safe-area 여백) ────────┤
│ [◎ 포커스: 전체 소식 ▾]             │
│ [textarea (16px 글자)            ]  │
│ [모델 칩 ▾]          0 / 2000 [↑]   │
└────────────────────────────────────┘
```

### 영역 구성
| 영역 | 컴포넌트 | 내용 |
|---|---|---|
| 대화 기록 사이드바 (1024px 이상) | `ChatSidebar` (`id="chat-history-sidebar"`) → `ChatSidebarHeader`, `SessionList` | 머리 영역 두 줄(1줄 56px `+ 새 대화`·접기, 2줄 44px 제목 검색), 세션 카드 목록(제목, 범위 배지 `단일 기사`·`전체 소식`, 시간. 접근 이름 `대화: <제목>, <시간>, 단일 기사 모드`/`… 전체 소식 모드`. 삭제 확인 팝오버). 접으면 그리지 않는다 |
| 챗 헤더 | `ChatHeader` → `MenuButton` | 왼쪽부터 피드로 돌아가기(`/`, 모든 폭에서 맨 왼쪽), 기록 버튼(1024px 이상은 사이드바 접기·펴기, 미만은 드로어. 기록이 열렸을 때만 `aria-controls`), 제목 `AI 챗`, 새 대화, 커맨드 팔레트(md 이상), 더보기(테마 라디오, `뉴스 피드로 이동`, md 미만 `커맨드 팔레트`) |
| 맥락 줄 | `ChatContextBar` → `ui/ScrollRow`, `SegmentedControl`, `ActiveSourceChip` | 검색 스코프 전환(그룹 이름 `검색 스코프 모드`, 탭 `단일 기사`(scoped)·`전체 소식`(global), 라벨은 `lib/labels.ts` 의 `SCOPE_LABELS`), 선택 기사 칩(짧은 카테고리 라벨, 해제). 가로 스크롤 줄이고 안쪽 폭은 메시지 열과 같다 |
| 메시지 목록 | `ChatMessageList` → `ChatMessageItem`(`CitationBadge`→`CitationPopover`, `WorkflowStepTracker`, `ExportToolbar`, `ModelTierBadge`, `ui/CodeBlock`), `ModelChangeDivider` | 웰컴/추천 질문(카드마다 앞에 lucide 아이콘 `Server`·`GitBranch`·`ChartColumn`·`TrendingUp`, 글자 왼쪽 정렬, 누르면 아이콘 없는 글자 그대로 보냄), 메시지·모델 변경 구분선 시간순, 답변의 모델 배지(`ModelTierBadge`)는 티어 lucide 아이콘(haiku `Zap`, sonnet `Target`, opus `Brain`, Claude 밖 gemini `Sparkles`·gpt `Bot`·그 밖 `Target`) + 이름, 새 항목마다 맨 아래로 부드럽게 스크롤 |
| 포커스 캡슐 | `FocusCapsule` | 현재 필터 요약 버튼(앞말 `포커스:`, 필터가 없으면 `포커스: 전체 소식`, → 포커스 필터), 필터가 걸려 있으면 초기화 버튼 |
| 입력창 | `ChatPromptInput` → `ui/Textarea`, `ChatModelSelector`(inline-chip) | 질문 입력(Enter 전송, Shift+Enter 줄바꿈), 모델 칩(모든 폭에서 화면의 유일한 모델 선택, 앞에 티어 lucide 아이콘, 팝오버는 위로 열림, 생성 중 비활성), 글자 수 `n / 2000`, `질문 전송` / 생성 중 `답변 생성 중단` |
| 기록 드로어 (1024px 미만) | `ChatHistoryDrawer` (`ui/Drawer`, `id="chat-history-drawer"`) → `ChatSidebarHeader`, `SessionList` | 사이드바와 같은 내용, 세션 선택·새 대화 때 닫힘 |
| 포커스 필터 | `FocusBottomSheet` (`ui/Dialog size="sm" mobile="sheet"`) | 카테고리(그룹 `도메인 카테고리`: `전체 소식`, `하네스 & 벤치마크`, `MCP & 생태계`, `에이전트 아키텍처`, `최신 AI 동향` — 피드 카테고리 칩과 같은 긴 라벨), 기간, 정렬, Must-Read 스위치, 대상 건수, `초기화`·`적용하기` |
| 커맨드 팔레트 | `CommandPalette commands=…` | `뉴스 피드로 이동`, 테마 순환, `새 대화 시작`, `대화 기록 열기` |
| 알림 영역 (입력 영역 위) | `ui/ToastRegion placement="composer"` (`useToast`) | 입력 영역을 감싼 `relative` 감싸개 안에서 입력 영역 바로 위(8px 띄움)에 그린다. 안쪽 폭은 메시지 열과 같은 `max-w-3xl`. 대화상자가 열려 있으면 전역 알림 영역이 대신 그린다. 영역이 바뀌어 다시 그려진 알림은 화면 읽기 프로그램에 다시 알리지 않는다 (처음 그려진 한 번만 `role`·`aria-live`). 예: `sourceId` 기사를 못 찾았을 때 `warning` `요청하신 기사를 찾을 수 없어 전체 소식 모드로 시작합니다.` |

## 대화상자·드로어·시트·팝오버
공통 규칙(포털, 오버레이 스택, 포커스, 배경 `inert`, 스크롤 잠금, 폭별 배치)과 닫기 수단은 [functional-spec/07-ui-common.md](functional-spec/07-ui-common.md) UI-08 에 있다. 대화상자 크기 `sm` 420px · `md` 560px · `lg` 720px · `xl` 896px 는 768px 이상의 너비다. 768px 미만에서 `전체 화면` 은 화면 전체(`h-dvh`), `바텀시트` 는 아래에서 올라오는 시트(최대 `90dvh`)다.

| 이름 | 종류·크기 (768px 미만) | 여는 곳 | 담는 내용 | 닫기 | 컴포넌트 파일 | 기능 상세 |
|---|---|---|---|---|---|---|
| 뉴스 상세 | `Dialog xl` (전체 화면) | 카드·제목 버튼 클릭, 포커스 카드 Enter/Space | 머리줄(카테고리 긴 라벨·Must-Read 배지, 기사 제목 2줄, 북마크, 닫기, 탭 `AI 요약 & 시사점` / `AI 질의응답`+대화 수), 요약 탭(`개발자 시사점`, `AI 챗에서 분석` 배너(보조 문구 `이 기사를 단일 기사 모드로 열어 질의응답`, → `/chat?sourceId=`), 핵심 요약, 기술 스택, `상세 본문 요약` 마크다운), 질의응답 탭(빠른 질문 4개 가로 스크롤 줄, 버튼마다 lucide 아이콘 + 글자, 스트리밍 답변, 복사(실패하면 2초 `복사 실패`), 대화 초기화 → 확인 창, 질문 입력 자리표시 `이 기사에 대해 질문하세요`), 바닥(출처, 작성자, `원문 링크 방문`) | Escape(질의응답 탭 질문 입력창 안에서는 닫지 않고 탭 패널로 포커스), 배경막, 머리줄 X. 닫으면 스트림 중단·상태 초기화 | `frontend/src/components/NewsDetailModal.tsx`, `frontend/src/components/news-detail/AskAiPanel.tsx` | 01, 02 |
| 일일 브리핑 | `Dialog xl` (전체 화면) | 요약 바의 `오늘의 브리핑` | 제목 `오늘의 AI 브리핑` + 날짜, 설명 = 헤드라인 (헤드라인은 여기 한 번만 보인다), 도구줄(`Notion 내보내기`/`Notion에서 열기`, `이메일 발송`→주소 입력 줄, 복사, `.md 다운로드`. 768px 미만은 주 버튼 + `브리핑 작업` 메뉴(이메일 발송·복사·`.md 다운로드`)), 결과 `InlineAlert`(실패하면 `Notion 설정 열기`·`이메일 설정 열기`), 탭 `카테고리별 요약` / `마크다운 전문`. 요약 탭: `오늘의 핵심 요약` 칸(개요가 있을 때만, 개요 줄의 분야 이름은 긴 라벨로), 분야별 칸(머리글 = 피드 카테고리 칩과 같은 lucide 아이콘 + 긴 라벨, 표에 없는 분야는 아이콘 없이 backend 이름, 기사마다 `Lightbulb` 아이콘 + `시사점:`). 바닥 `연동 설정`(설정 진입은 이 한 곳)·`닫기` | Escape, 배경막, X, `닫기` | `frontend/src/components/DailyBriefingModal.tsx` | 04 |
| 공유 & 알림 설정 | `Dialog md` (전체 화면) | 더보기 `공유 & 알림`, 팔레트, 일일 브리핑 바닥 `연동 설정`·실패 알림의 `Notion 설정 열기`·`이메일 설정 열기` (브리핑 위에 쌓인다) | 탭 `Notion 연동` / `이메일 (SMTP)` / `웹훅 (Slack/Discord)`, 입력 필드, 결과 `InlineAlert`, 바닥 `닫기`·`연결 테스트`(현재 탭)·`저장` | Escape, X, `닫기` (배경막으로 닫히지 않음) | `frontend/src/components/BriefingSettingsModal.tsx` | 04 |
| 자동 수집 스케줄 | `Dialog md` (전체 화면) | 헤더 수집 상태 버튼(md 이상), 더보기 `수집 스케줄`(md 미만), 팔레트 | 설명 `매일 4회(0, 6, 12, 18시 UTC) …`, 수집 주기(UTC·KST), 다음 예정(분, 시각), '위험 영역' `초기화 & 재수집…`, 바닥 `즉시 수집` | Escape, 배경막, X | `frontend/src/components/ScheduleModal.tsx` | 01 |
| AgentLens MCP 연동 | `Dialog lg` (전체 화면) | 더보기 `MCP 연동`, 팔레트 | MCP 도구 4개(정의 목록), `claude_desktop_config.json` 예시 `CodeBlock`(복사), 바닥 `닫기` | Escape, 배경막, X, `닫기` | `frontend/src/components/McpModal.tsx` | 06 |
| 소스 & 리서처 | `Dialog xl` (전체 화면) | 더보기 `소스 & 리서처`, 팔레트 | 탭 `AI 딥 리서처`(기본, 지표 카드 4개 2열·768px 이상 4열, 값은 말줄임 없이 줄을 바꿔 전부 보인다) / `등록된 수집원`, 결과 안내(`aria-live`), 바닥 `sources.json` 표시·`닫기`. 수집원 삭제는 확인 창 | Escape, X, `닫기` (배경막으로 닫히지 않음) | `frontend/src/components/SourcesModal.tsx`, `frontend/src/components/sources/DeepResearcherTab.tsx`, `frontend/src/components/sources/SourcesListTab.tsx` | 05 |
| 수집 데이터 전체 삭제 및 재수집 | `ConfirmDialog` (`alertdialog`, `sm`, 바텀시트) | 더보기 `초기화 & 재수집…`, 스케줄 대화상자 '위험 영역', 팔레트 | 영구 삭제 경고, `취소`(처음 포커스) / `전체 삭제 후 다시 수집`(진행 중 `초기화 중...`), 실패 시 창 안 오류 | Escape, 배경막, `취소`, 머리줄 X (진행 중에는 모두 무시) | `frontend/src/components/ResetConfirmDialog.tsx` | 07 UI-02, 01 |
| 확인 창 (대화 초기화, 소스 삭제) | `ConfirmDialog` (`sm`, 바텀시트) | 뉴스 상세 질의응답 탭 `대화 초기화`, 수집원 삭제 버튼 | `AI 대화 내역을 모두 초기화하시겠습니까?` / `이 소스를 목록에서 삭제하시겠습니까?` | Escape, 배경막, `취소`, 머리줄 X | `NewsDetailModal.tsx:402-411`, `SourcesModal.tsx:236-246` | 02, 05 |
| 커맨드 팔레트 | `Dialog md placement="top"` (전체 화면, 768px 이상은 위에서 `12dvh`, 560px) | ⌘K / Ctrl+K, 헤더 팔레트 버튼, 챗 더보기 `커맨드 팔레트` | 검색 입력(combobox), 명령 목록(listbox), 키 안내(640px 이상) | Escape, 배경막, X, ⌘K | `frontend/src/components/CommandPalette.tsx` | 07 UI-07 |
| 대화 기록 드로어 | `Drawer side="left"` (`min(320px, 85vw)`, 높이 전체) | 챗 헤더 기록 버튼 (1024px 미만), 챗 팔레트 `대화 기록 열기` | 제목 `대화 기록`, 새 대화, 검색, 세션 목록 | Escape, 배경막, `대화 기록 드로어 닫기`, 세션 선택·새 대화 | `frontend/src/components/chat/ChatHistoryDrawer.tsx` | 02 |
| 수집 소식 타깃팅 포커스 필터 | `Dialog sm mobile="sheet"` (바텀시트, 768px 이상 가운데 420px) | 포커스 캡슐 | 카테고리, 기간, 정렬, Must-Read, 대상 건수, `초기화`·`적용하기` | Escape, 배경막, `필터 닫기`, 아래로 100px 스와이프, `적용하기` | `frontend/src/components/chat/FocusBottomSheet.tsx` | 02 |
| 모델 선택 | `Popover role="radiogroup"` (`w-80`) | 입력창 모델 칩(위로) | haiku / sonnet / opus 3단계 | Escape, 바깥 pointerdown, 선택 | `frontend/src/components/chat/ChatModelSelector.tsx` | 02 |
| 인용 출처 프리뷰 | `Popover role="dialog"` | 답변 안 인용 배지 클릭 | 출처 기사 요약 | Escape, 바깥 pointerdown, `팝오버 닫기` | `frontend/src/components/chat/CitationPopover.tsx` (`CitationBadge.tsx` 가 연다) | 02 |
| 세션 삭제 확인 | `Popover role="dialog"` (`min(18rem, 100vw-2rem)`) | 세션 카드 삭제 버튼 | `이 대화를 삭제하시겠습니까?`, `취소`(처음 포커스)·`삭제` | Escape, 바깥 pointerdown, `취소` | `frontend/src/components/chat/DeleteConfirmPopover.tsx` | 02 |
| 메뉴 | `MenuButton` (`min(280px, 100vw-32px)`) | 피드 헤더 `더보기`·`테마 선택`, 챗 헤더 `더보기`, 브리핑 `브리핑 작업` | 메뉴 항목·라디오·구분선 | Escape(트리거로 포커스), 바깥 pointerdown, Tab, 항목 실행 | `frontend/src/components/ui/Menu.tsx`, `frontend/src/components/ui/ThemeMenu.tsx` | 07 UI-04 |

- 브라우저 기본 대화상자(`window.confirm`, `alert`)는 쓰지 않는다.
- 어디서도 렌더하지 않는 모달: `frontend/src/components/WebhookSettingsModal.tsx`(웹훅 URL 하나를 localStorage 에 저장하고 테스트·브리핑 전송). import 하는 곳이 없다.

## 컴포넌트 트리
```
RootLayout (app/layout.tsx)  ── <head> 테마 인라인 스크립트
└─ ThemeProvider (context/ThemeContext.tsx → lib/theme-store.ts)
   ├─ div#app-shell
   │  ├─ HomePage "/" (app/page.tsx)  ── 훅: useBookmarks, useNewsFeed, useTheme, useRouter, useOverlayOpen
   │  │  ├─ HotkeyListener (blockSingleKeys)
   │  │  ├─ Header                          ── useCollector, useHotkey('mod+k'), useMediaQuery
   │  │  │  ├─ ui/Badge (버전), ui/Button, ui/IconButton, ui/Kbd, ui/Spinner
   │  │  │  ├─ ui/ThemeMenu → ui/Menu       (md 이상)
   │  │  │  ├─ ui/Menu "더보기"
   │  │  │  ├─ CommandPalette → ui/Dialog
   │  │  │  └─ ResetConfirmDialog → ui/ConfirmDialog
   │  │  ├─ CollectorStatusLine             ── useCollector
   │  │  ├─ main#main
   │  │  │  ├─ InsightsBar → ui/Card, ui/ScrollRow, ui/Chip, ui/Skeleton, TrendRadarPanel
   │  │  │  ├─ FeedToolbar → ui/SearchField(검색 영역), ui/ChipGroup(→ ui/ScrollRow)·Chip(필터 영역)   ── 트리 하나, 폭별 배치는 CSS (ScrollRow 가 useMediaQuery 로 스크롤 버튼·표시를 고른다)
   │  │  │  ├─ FeedStatusBar → ui/Badge, ui/Select(정렬)   ── 목록 머리줄
   │  │  │  ├─ NewsCardSkeleton × 6 | ui/ErrorState | ui/EmptyState
   │  │  │  ├─ NewsCard × n → ui/Card, ui/Badge, ui/IconButton   ── preferSummary (lib/feed-insights)
   │  │  │  │  └─ HandoverCtaButton (card-compact, 글자 `AI 챗에서 분석` 모든 폭)
   │  │  │  └─ FeedPagination → ui/Button
   │  │  ├─ footer
   │  │  ├─ NewsDetailModal → ui/Dialog, ui/Tabs·TabPanel, ui/ConfirmDialog
   │  │  │  ├─ HandoverCtaButton (modal-banner)
   │  │  │  ├─ MarkdownViewer → ui/CodeBlock
   │  │  │  └─ AskAiPanel → ui/ChipGroup(빠른 질문), MarkdownViewer
   │  │  ├─ DailyBriefingModal → ui/Dialog, ui/Tabs, ui/Menu, ui/InlineAlert, ui/TextField, MarkdownViewer
   │  │  ├─ ScheduleModal → ui/Dialog, ResetConfirmDialog   ── useCollector
   │  │  ├─ McpModal → ui/Dialog, ui/CodeBlock
   │  │  ├─ BriefingSettingsModal → ui/Dialog, ui/Tabs, ui/TextField, ui/InlineAlert
   │  │  └─ SourcesModal → ui/Dialog, ui/Tabs, ui/ConfirmDialog
   │  │     ├─ DeepResearcherTab
   │  │     └─ SourcesListTab → ui/Switch, ui/IconButton, ui/TextField
   │  └─ ChatPage "/chat" (app/chat/page.tsx)
   │     └─ Suspense (fallback: "워크스페이스 환경을 초기화하는 중...")
   │        └─ ChatWorkspace          ── 훅: useChatSessions, useSearchParams, useMediaQuery, useToast, useTheme
   │           ├─ ChatSidebar (hidden lg:flex)
   │           │  ├─ ChatSidebarHeader
   │           │  └─ SessionList
   │           │     ├─ SessionListSkeleton | ui/ErrorState | SessionEmptyState
   │           │     └─ SessionItemCard × n
   │           │        └─ DeleteConfirmPopover → ui/Popover
   │           ├─ ChatHeader          ── useHotkey('mod+k'), useMediaQuery
   │           │  ├─ ui/Menu "더보기"
   │           │  └─ ChatContextBar → ui/ScrollRow, ui/SegmentedControl, ActiveSourceChip
   │           ├─ ChatMessageList
   │           │  ├─ ChatMessageItem × n
   │           │  │  ├─ WorkflowStepTracker
   │           │  │  ├─ ReactMarkdown + MarkdownCode → ui/CodeBlock (MarkdownViewer.tsx 에서 가져옴)
   │           │  │  ├─ CitationBadge → CitationPopover → ui/Popover
   │           │  │  ├─ ModelTierBadge
   │           │  │  └─ ExportToolbar
   │           │  └─ ModelChangeDivider × n
   │           ├─ div.relative (입력 영역 감싸개)
   │           │  ├─ ui/ToastRegion placement="composer" (입력 영역 바로 위, 모달이 없을 때 이 영역이 그린다)
   │           │  ├─ FocusCapsule
   │           │  └─ ChatPromptInput → ui/Textarea, ChatModelSelector (inline-chip) → ui/Popover
   │           ├─ ChatHistoryDrawer → ui/Drawer
   │           │  ├─ ChatSidebarHeader
   │           │  └─ SessionList (위와 같음)
   │           ├─ FocusBottomSheet → ui/Dialog, ui/ChipGroup·Chip, ui/Switch
   │           └─ CommandPalette (commands) → ui/Dialog
   └─ ui/ToastRegion (global)   ── 포털로 body 에 그린다 (#app-shell 밖). 모달이 열렸거나 composer 영역이 없을 때 그린다
```
- 대화상자·드로어·확인 창은 `createPortal(…, document.body)` 로 `#app-shell` 밖에 그린다. 팝오버·메뉴는 포털 없이 트리거 옆 `absolute` 로 그린다.

## 상태 관리
- 전역 상태 라이브러리(Redux, Zustand 등)나 데이터 패칭 라이브러리(SWR, React Query)는 없다 (`frontend/package.json`). React `useState`/`useEffect`, Context 하나, 커스텀 훅, 그리고 `useSyncExternalStore` 로 읽는 모듈 단위 외부 저장소로 관리한다.

| 범위 | 위치 | 가진 상태 |
|---|---|---|
| 앱 전체 테마 | `ThemeContext` (`context/ThemeContext.tsx`) + `lib/theme-store.ts` | `theme`, `resolvedTheme`, `toggleTheme`, `setTheme`. 값의 원천은 `localStorage` 와 `matchMedia` 이고 스냅샷마다 새로 읽는다. 같은 탭은 `agentlens:theme-change` 이벤트, 다른 탭은 `storage` 이벤트로 동기화한다 |
| 오버레이 스택 | `lib/overlay-stack.ts` (모듈 저장소) | 열린 대화상자·드로어·메뉴·팝오버 레이어 목록. 레이어는 열릴 때 받은 순서 번호(`order`) 오름차순이라 같은 렌더에서 부모·자식이 함께 열려도 자식이 맨 위다. Escape 처리(기본 동작이 막힌 Escape 는 무시), `#app-shell`·아래 모달의 `inert`, `useOverlayOpen()`(하나라도 열려 있는지), `useTopOverlayId()` |
| 수집 상태 | `useCollector` (`hooks/useCollector.ts`, 모듈 저장소) | 스케줄 상태, `isCollecting`, 진행 줄 `message`. 헤더·진행 줄·스케줄 대화상자·초기화 확인 창이 같은 값을 본다. 구독자가 하나 이상일 때만 30초 재조회·진행 폴링을 돌리고, 마지막 구독자가 빠지면 모두 정리하고 처음 상태로 되돌린다. 스케줄 상태가 수집 중(`is_running`)이면 진행 폴링을 다시 붙이고, 즉시 수집 응답이 `already_running` 이면 새로 요청하지 않고 폴링을 붙인다 |
| 알림 | `components/ui/Toast.tsx` (모듈 저장소) | 알림 목록과 등록된 `ToastRegion` 목록. 그리는 영역은 하나다: 모달이 없고 `composer` 영역(챗 입력 영역 위)이 있으면 가장 나중에 등록된 `composer`, 아니면 처음 등록된 `global`. 알림마다 처음 알린 영역을 `announcedBy` 에 기록해, 다른 영역이 그린 뒤에는 live 속성 없이 그린다 (알림이 닫히면 기록을 지운다) |
| 화면 너비 | `useMediaQuery` (`hooks/useMediaQuery.ts`) | `matchMedia` 구독. 서버·하이드레이션 첫 렌더는 false |
| 홈 피드 데이터·필터 | `useNewsFeed` (`hooks/useNewsFeed.ts`) | `category`(기본 `all`), `source`(`all`), `search`(''), `sort`(`hot`), `highSignalOnly`(false), `page`(1), `selectedTag`, `news`, `total`, `totalPages`, `loading`, `error`, `reloadError`, `stats`, `briefing`, `techRadar`, `loadingRadar`. 필터가 바뀌면 자동 재조회한다. 응답은 목록 키와 함께 두고, `loading` 은 지금 목록 키의 응답이 없을 때만 true 다 (같은 키 다시 읽기 중에는 이전 목록 유지, 그 실패는 `reloadError` → `danger` 알림). 통계·브리핑·레이더는 마운트 때 한 번(그리고 새로고침 때) `Promise.allSettled` 로 읽고, `loadingRadar` 는 첫 읽기가 끝나기 전에만 true 다 |
| 반복 시사점 | `HomePage` (`app/page.tsx:72`) | `findRepeatedInsights(news)` 로 고른 기사 id 집합. 카드 `preferSummary` 로 넘긴다 |
| 북마크 | `useBookmarks` (`hooks/useBookmarks.ts`) | `bookmarkedIds`, `bookmarkedItems`, `toggleBookmark`. `localStorage` 를 외부 저장소로 읽는다 |
| 홈 대화상자·포커스 | `HomePage` (`app/page.tsx:36`, `:83-89`, `:94-100`) | `focusedIndex`(목록이 바뀌면 -1), `selectedItem`, 대화상자 열림 6개 |
| 헤더 | `Header` (`Header.tsx:65-66`) | 팔레트 열림, 초기화 확인 창 열림 |
| 챗 세션 목록 | `useChatSessions` (`components/chat/useChatSessions.ts`) | `sessions`, `isLoading`, `error`, `searchQuery`. 서버와 localStorage 이중 저장, 최대 30개 |
| 챗 작업 상태 | `ChatWorkspace` (`ChatWorkspace.tsx:80-96`) | `sessionId`(UUID), `messages`, `inputPrompt`, `scopeMode`(`global`), `activeSource`, `focusFilters`, `selectedTier`(`sonnet`), `modelSwitchEvents`, `isSidebarOpen`(true), `isDrawerOpen`, `isBottomSheetOpen`, `isPaletteOpen`, `isStreaming`, `streamingMessageId`, `viewportHeight` |
| URL | `/chat?session_id=&sourceId=&q=` | 챗 초기 진입 상태 (위 '라우트' 절) |

### localStorage 키 (전체)
| 키 | 값 | 쓰는 곳 | 비고 |
|---|---|---|---|
| `agentlens_theme` | `light` \| `dark` \| `system` | `lib/theme-store.ts:72`, `:87`, `app/layout.tsx:23` (첫 그리기 전 읽기) | 테마 선택·순환 때 저장 |
| `agentlens_bookmarks` | `NewsItem[]` JSON (최근 추가가 앞) | `hooks/useBookmarks.ts:6`, `:34`, `:58` | 북마크 보기는 서버 대신 이 목록을 거른다 |
| `agentlens_chat_sessions_index` | `ChatSessionMeta[]` JSON, 최대 30개 | `components/chat/useChatSessions.ts:19` | 서버 목록 조회 성공 때 덮어쓰고, 실패 때 대체로 쓴다 |
| `agentlens_chat_session_{sessionId}` | `ChatSessionDetail` JSON | `components/chat/useChatSessions.ts:20` | 세션 상세 L1 캐시. 서버가 404 이거나 네트워크 오류면 이것을 쓴다 |
| `agentlens_webhook_url` | 웹훅 URL 문자열 | `components/WebhookSettingsModal.tsx:30`, `:40` | 렌더되지 않는 컴포넌트라 지금은 쓰이지 않는다 |

- `sessionStorage`, 쿠키, IndexedDB 는 쓰지 않는다.

## 프론트가 부르는 API
### 호출 경로 두 가지
1. **rewrite 프록시 (기본)**: `src/lib/api.ts` 의 `getApiBase()` 는 브라우저에서 `''` 를 돌려줘 상대 경로 `/api/...` 로 부른다. Next 서버가 `next.config.ts` rewrites 로 `${INTERNAL_API_URL || 'http://127.0.0.1:8000'}/api/:path*` 에 넘긴다 (`lib/api.ts:3-10`, `next.config.ts:23-31`). 브라우저가 아닌 곳에서는 `INTERNAL_API_URL || NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'` 를 쓰지만, 모든 호출자가 클라이언트 컴포넌트라 실제로는 브라우저 경로만 쓰인다.
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
| `fetchScheduleStatus` | `GET /api/schedule/status` | 프록시 | | `useCollector`(구독 중 30초 주기. 헤더·스케줄 대화상자가 함께 본다) |
| `fetchCrawlProgress` | `GET /api/schedule/progress` | 프록시 | | `useCollector`(수집 중 1.2초 폴링) |
| `triggerManualCollect` | `POST /api/schedule/trigger` | 프록시 | | `useCollector` (헤더, 더보기 메뉴, 스케줄 대화상자, 커맨드 팔레트) |
| `resetAndRecollect` | `POST /api/schedule/reset-and-collect` | 프록시 | | `useCollector` (`ResetConfirmDialog`) |
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
| `components/chat/useChatSessions.ts:67` | `GET /api/chat/sessions?limit=30` | 프록시 (상대 경로 `fetch`) | 없음 |
| `components/chat/useChatSessions.ts:136` | `GET /api/chat/sessions/{id}` | 프록시 | 없음 |
| `components/chat/useChatSessions.ts:234` | `POST /api/chat/sessions` (세션 저장, 실패 무시) | 프록시 | 없음 |
| `components/chat/useChatSessions.ts:265` | `DELETE /api/chat/sessions/{id}` | 프록시 | 없음 |
| `components/chat/ChatWorkspace.tsx:310` | `POST /api/chat/stream` (SSE, `status`/`sources`/`token`/`done`/`error`) | 프록시 (상대 경로) | 없음 (중단 버튼) |
| `components/chat/ChatWorkspace.tsx:530` | `GET /api/chat/sources/{id}` | 프록시 | 없음 |
| `components/Header.tsx:37` (더보기 `RSS 피드`, 팔레트 `RSS 피드 열기`) | `/api/news/feed/rss.xml` (링크, 새 탭) | 프록시 | — |

## 환경 변수
| 변수 | 쓰는 곳 | 기본값 | 설명 |
|---|---|---|---|
| `INTERNAL_API_URL` | `next.config.ts:24` (rewrite 대상), `lib/api.ts:9`, `:22` (브라우저 밖 기본 주소) | `http://127.0.0.1:8000` | Next 서버가 backend 에 붙는 주소. Dockerfile 의 빌드·실행 단계와 compose 모두 `http://backend:8000` |
| `NEXT_PUBLIC_API_URL` | `lib/api.ts:13-14` (직접 연결 주소), `:9` | 없음 → 브라우저 호스트의 `:8000` | 브라우저가 SSE 를 backend 에 직접 붙일 주소. compose 는 `${NEXT_PUBLIC_API_URL:-}` 를 실행 환경으로 넘긴다 |
| `NODE_ENV` | Next.js | Dockerfile `production` | |
| `PORT` | Next standalone 서버 | Dockerfile·compose `3001` | |
| `HOSTNAME` | Next standalone 서버 | Dockerfile `0.0.0.0` | |
| `NEXT_TELEMETRY_DISABLED` | Next.js | Dockerfile `1` | |

- `src/lib/env.ts` 는 zod 스키마 두 개를 정의한다. `clientEnvSchema`: `NEXT_PUBLIC_API_URL`(URL 또는 '' , 선택). `serverEnvSchema`: 여기에 `NODE_ENV`(`development`·`test`·`production`, 기본 `development`), `PORT`(선택 문자열), `INTERNAL_API_URL`(URL 또는 '', 선택). 모듈을 읽을 때 `serverEnvSchema.parse(process.env…)` 를 실행해 `env` 로 내보낸다. 그러나 이 모듈을 import 하는 파일이 없어 검증은 실행되지 않는다.
- `next.config.ts` 의 그 밖의 설정: `output: "standalone"`, `productionBrowserSourceMaps: false`, `agentRules: false`(`next dev` 가 `frontend/AGENTS.md`·`frontend/CLAUDE.md` 를 만들지 않게 함), `allowedDevOrigins: ["macbookpro.tail304081.ts.net", "*.ts.net", "localhost", "127.0.0.1", "192.168.1.109"]`.

## 스타일 체계
요약만 적는다. 토큰 값, 부품 API, 사용 규칙은 [design-system.md](design-system.md) 가 기준이다.

- **도구**: Tailwind CSS 4 (PostCSS 플러그인 `@tailwindcss/postcss`). `tailwind.config.*` 파일은 없고 설정은 모두 `frontend/src/app/globals.css` 에 있다. 아이콘 `lucide-react` (프론트가 정한 UI 글자에는 그림 이모지를 쓰지 않는다. `frontend/src/tests/ui/IconGuard.test.ts` 가 `src/components/**`·`src/app/**` 를 검사한다), 마크다운 `react-markdown` + `remark-gfm`.
- **테마 전환**: `@custom-variant dark (&:where(.dark, .dark *))` 로 `dark:` 변형이 `<html class="dark">` 를 따른다 (`globals.css:2`). 색은 CSS 변수 토큰 `--al-*` 를 `:root`(라이트)와 `.dark`(다크)에 두고 (`globals.css:9-67`), `@theme inline` 으로 Tailwind 색 이름에 잇는다 (`globals.css:69-97`). 그래서 컴포넌트는 `bg-canvas`, `bg-surface`, `bg-surface-muted`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `border-border`, `text-accent`, `bg-accent-solid`, `bg-accent-soft`, `text-success`·`warning`·`danger`(+`-soft`), `bg-scrim` 같은 토큰 유틸리티만 쓰고 `dark:` 를 따로 적지 않는다. 테마 덮어쓰기(`!important`) 규칙은 없다.
- **토큰 가드**: `frontend/src/tests/design/TokenGuard.test.ts` 가 `src/**/*.tsx` 의 Tailwind 기본 팔레트 색·hex 임의값 클래스와 옛 애니메이션 클래스, `globals.css` 의 `!important`·`html.dark` 덮어쓰기를 막고, `TokenContrast.test.ts` 가 토큰 색의 글자·포커스 링 대비를 확인한다.
- **글꼴**: 웹 글꼴 없이 시스템 글꼴만 쓴다. `--font-sans`: `-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Segoe UI", Roboto, …`, `--font-mono`: `ui-monospace, SFMono-Regular, …` (`globals.css:98-100`).
- **공통 부품**: `frontend/src/components/ui/` — `Button`, `IconButton`, `TextField`, `SearchField`, `Textarea`, `Select`, `Switch`, `Badge`, `Chip`/`ChipGroup`, `ScrollRow`(가로 스크롤 줄: 넘친 쪽 흐림, 768px 이상 스크롤 버튼, 768px 미만 넘친 쪽마다 `‹`·`›` 표시), `SegmentedControl`, `Tabs`/`TabPanel`, `Card`, `Dialog`, `Drawer`, `ConfirmDialog`, `Menu`(`MenuButton`), `Popover`, `Toast`(`ToastRegion`, `useToast`), `InlineAlert`, `Spinner`, `Skeleton`, `EmptyState`, `ErrorState`, `Kbd`, `CodeBlock`, `ThemeMenu`.
- **크기**: 조작 요소 높이 768px 미만 44px, 이상 36px (`h-11 md:h-9`). 반경 조작 요소 8px, 카드 12px, 대화상자 16px.
- **줄바꿈**: `body` 에 `word-break: keep-all; overflow-wrap: break-word;` 를 두어 한국어는 어절 단위로 줄을 바꾸고 긴 토큰은 넘칠 때만 끊는다. 마크다운·코드는 자체 클래스가 이긴다 (`globals.css:125-134`).
- **레이어**: 피드 필터 영역 `z-10`, 챗 사이드바 `z-20`, 헤더(`/`, `/chat`) `z-30`, 메뉴·팝오버 `z-40`, 대화상자·드로어·시트 `z-50`, 알림 `z-60`.
- **모션**: `ease-standard`(`cubic-bezier(0.2, 0, 0, 1)`), `animate-fade-in` 150ms, `animate-dialog-in` 200ms, `animate-sheet-in`·`animate-drawer-in` 240ms (`globals.css:101-123`). 모두 `motion-safe:` 로 쓴다. 반복 애니메이션은 스피너·스켈레톤뿐이다.
- **포커스·스크롤바**: `:focus-visible` 은 `accent` 2px 외곽선(간격 2px). 스크롤바는 얇게(`scrollbar-width: thin`, WebKit 6px), 색 `border-strong` (`globals.css:125-159`).
- **반응형 브레이크포인트**: Tailwind 기본 sm 640px, md 768px, lg 1024px, xl 1280px. 장치 구분은 모바일 768px 미만, 태블릿 768~1023px, 데스크톱 1024px 이상. 상세는 [functional-spec/07-ui-common.md](functional-spec/07-ui-common.md) UI-09.

## 테스트·목 (참고)
- 테스트 러너는 Vitest(jsdom) + Testing Library, 설정 `frontend/vitest.config.ts`, 준비 파일 `frontend/src/tests/setup.ts`.
- MSW 목 서버(`frontend/src/mocks/server.ts`, `msw/node`)는 테스트에서만 켠다 (`onUnhandledRequest: 'bypass'`). 브라우저용 MSW 워커는 없고 실행 중인 앱은 목을 쓰지 않는다.

## 알려진 불일치·위험
1. **`/api/chat/stream` 은 rewrite 프록시를 거친다.** `ChatWorkspace` 는 상대 경로 `fetch('/api/chat/stream')` 로 부른다 (`ChatWorkspace.tsx:310`). backend 직접 연결(`getDirectApiBase`)을 쓰는 SSE 는 뉴스 Ask AI 스트림(`/api/news/{id}/ask/stream`) 하나뿐이다. 두 SSE 를 모두 직접 연결한다고 적은 문서가 있다면 코드와 다르다. `getDirectApiBase` 의 주석은 직접 연결 이유를 'Next.js rewrites 의 청크 버퍼링 회피' 로 적고 있어, 챗 스트림은 그 버퍼링 영향을 받을 수 있다 (실행해서 확인하지 않았다).
2. **`NEXT_PUBLIC_API_URL` 을 compose 실행 환경으로만 넘긴다.** Next.js 는 `NEXT_PUBLIC_` 변수를 빌드 때 클라이언트 번들에 넣는다. Dockerfile 빌드 단계는 이 값을 설정하지 않으므로, compose 의 `NEXT_PUBLIC_API_URL` 은 브라우저 코드의 `getDirectApiBase` 에 반영되지 않고 `{hostname}:8000` 으로 붙을 가능성이 높다 (빌드 산출물로 확인하지 않았다). backend 8000 포트가 브라우저에서 닿지 않는 배포에서는 Ask AI 스트림이 프록시 경로로 다시 시도한다.
3. **`src/lib/env.ts` 를 아무도 import 하지 않는다.** 환경 변수 검증 스키마가 실행되지 않는다.
4. **쓰지 않는 코드가 있다.** `WebhookSettingsModal`(렌더되지 않음, `agentlens_webhook_url` 키 포함), `ThemeToggle`(헤더가 `ThemeMenu` 로 바뀌어 렌더하는 곳이 없음), `askQuestionAboutNews`, `deleteAllNews`, `discoverSources`, `registerCandidate`, `sendBriefingToWebhook`(미사용 모달에서만 사용).
5. **챗 API 호출에 시간 제한이 없다.** `api.ts` 밖의 챗 호출 6곳은 `fetchWithTimeout` 을 쓰지 않는다. 세션 목록·상세 조회가 멈추면 로딩 상태가 계속될 수 있다.
6. **챗 세션 상세 캐시가 쌓인다.** 세션 목록을 30개로 자를 때 밀려난 세션의 `agentlens_chat_session_{id}` 키는 지우지 않는다. `resetSessions` 도 목록 키만 지운다. localStorage 용량이 계속 늘 수 있다.
7. **`/api/health` 의 버전이 고정 문자열이다.** 헤더 배지는 빌드 때 `next.config.ts` 가 `package.json` 의 `version` 을 `NEXT_PUBLIC_APP_VERSION` 으로 넘긴 값을 그리지만 (`next.config.ts:6`, `:14`, `Header.tsx:66`, 값이 없으면 배지를 숨긴다), `/api/health` 의 `0.3.1` 은 `package.json` 을 읽지 않는 고정 문자열이다 (`app/api/health/route.ts:9`). 버전을 올릴 때 따로 고쳐야 한다.
8. **`/api/health` 와 rewrite 경로가 겹친다.** rewrites 는 배열로 반환되어 파일 시스템 라우트 뒤에 적용되는 방식이라 Route Handler 가 먼저 응답하는 것으로 보이지만, 실행해서 확인하지 않았다. 이 순서가 바뀌면 프론트 healthcheck 가 backend 로 넘어간다.
9. **스케줄 대화상자 문구에 수집 시각이 고정돼 있다.** `매일 4회(0, 6, 12, 18시 UTC)` 와 UTC·KST 시각을 문자열로 박아 두어, backend 스케줄이 바뀌면 화면이 따라가지 않는다 (`ScheduleModal.tsx:30`, `:47-48`).
10. **MCP 대화상자의 설정 예시가 고정 문자열이다.** `"cwd": "/path/to/agentlens/backend"` 자리표시를 그대로 복사하게 한다 (`McpModal.tsx:15-23`).
