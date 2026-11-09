# 디자인시스템: AgentLens
Updated: 2026-11-07

AgentLens 프론트엔드(`frontend/`)의 색·글꼴·간격 토큰, 공통 부품, 오버레이와 단축키 규칙을 적는다. 값은 지금 코드가 기준이다. 토큰 원본은 `frontend/src/app/globals.css`, 공통 부품은 `frontend/src/components/ui/` 에 있다.

## 1. 원칙

| 원칙 | 내용 |
|---|---|
| 중립 + 단일 강조 | 중립 회색(차가운 slate 계열) 위에 강조색은 파랑 하나만 쓴다. 범주별 색(카테고리·출처마다 다른 색)을 두지 않는다. |
| 의미 색은 셋 | 성공(`success`)·주의(`warning`)·위험(`danger`) 세 가지만 둔다. Must-Read·Hot 같은 강조는 `warning`, `단일 기사` 범위·핸드오버·선택 상태는 `accent`, 보충 웹 출처 `[S1]` 은 `success` 로 구분한다. |
| 토큰만 쓴다 | 화면 코드(`.tsx`)는 이 문서의 토큰 유틸리티(`bg-surface`, `text-fg-muted` …)만 쓴다. hex 값, Tailwind 기본 팔레트 색(`bg-slate-100`, `text-blue-600` …)을 쓰지 않는다. `TokenGuard` 테스트가 막는다 (9절). |
| 테마는 클래스 하나 | 색 토큰은 CSS 변수라 `<html>` 의 `dark` 클래스 하나로 라이트·다크가 바뀐다. 컴포넌트에 `dark:` 로 색을 따로 적지 않는다. |
| 공통 부품을 먼저 | 버튼·입력·대화상자·메뉴 같은 조작 요소는 `components/ui/` 부품을 쓴다. 같은 모양을 화면마다 새로 만들지 않는다. |
| 접근성 기준 | WCAG 2.2 AA. 글자 대비 4.5:1, UI 경계·포커스 링 3:1, 모바일(<768px) 주요 조작 요소 44×44px, 키보드로 모두 조작, 확대 허용. |
| 외부 런타임 의존 없음 | 웹 글꼴·CDN·UI 킷을 쓰지 않는다. 시스템 글꼴과 자체 부품만 쓴다. 아이콘은 `lucide-react`. |
| 아이콘은 lucide 하나 | 아이콘은 모두 `lucide-react` 컴포넌트로 그린다. 프론트가 정한 UI 글자(버튼·탭·라벨·제목·알림 문구·표 값)에 그림 이모지를 쓰지 않는다 (5.3절 '아이콘', `IconGuard` 9절). |

## 2. 색 토큰과 대비

토큰마다 CSS 변수 `--al-<이름>` 이 있고, Tailwind 색 이름 `<이름>` 으로 연결된다 (`bg-<이름>`, `text-<이름>`, `border-<이름>`, `ring-<이름>` …).

| 토큰 | 용도 | 라이트 | 다크 | 대비 (라이트 / 다크) |
|---|---|---|---|---|
| `canvas` | 페이지 배경 | `#f8fafc` | `#0e1013` | — |
| `surface` | 카드·헤더·대화상자·메뉴 | `#ffffff` | `#16191d` | — |
| `surface-muted` | hover, 눌린 칩, 코드·인용 배경, 보조 영역 | `#f1f5f9` | `#1f2329` | — |
| `fg` | 본문·제목 | `#0f172a` | `#e8eaed` | surface 17.9 / 14.6, surface-muted 16.3 / 13.1 |
| `fg-muted` | 보조 글자 (요약, 설명) | `#475569` | `#a9b0ba` | surface 7.6 / 8.1, surface-muted 6.9 / 7.2 |
| `fg-subtle` | 메타(시간·건수), 자리표시 | `#5c6b80` | `#858d98` | surface 5.4 / 5.3, canvas 5.2 / 5.7, surface-muted 5.0 / 4.7 |
| `border` | 구분선·카드 테두리 (장식) | `#e2e8f0` | `#2a2f36` | 장식용, 기준 없음 |
| `border-strong` | 입력창·스위치·체크 테두리 (UI 경계) | `#7b8798` | `#6b7480` | surface 3.6 / 3.7, canvas 3.5 / 4.0 (≥3) |
| `accent` | 링크·선택 표시·아이콘·포커스 링 | `#2563eb` | `#60a5fa` | surface 5.2 / 6.9, canvas 4.9 / 7.5, surface-muted 4.7 / 6.2 |
| `accent-solid` | 주 버튼 배경 | `#2563eb` | `#2563eb` | `on-accent` 글자 5.2 / 5.2 |
| `accent-solid-hover` | 주 버튼 hover | `#1d4ed8` | `#1d4ed8` | `on-accent` 6.7 / 6.7 |
| `on-accent` | 주·위험 버튼 글자 | `#ffffff` | `#ffffff` | — |
| `accent-soft` | 선택된 칩·세션·사용자 말풍선 배경 | `#eff6ff` | `#15233f` | — |
| `accent-soft-fg` | `accent-soft` 위 글자 | `#1d4ed8` | `#60a5fa` | 6.2 / 6.1 |
| `success` | 성공·수집 완료·보충 출처 글자 | `#047857` | `#34d399` | surface 5.5 / 9.2 |
| `success-soft` | 성공 배경 | `#ecfdf5` | `#0f2a20` | `success` 글자 5.2 / 8.0 |
| `warning` | Must-Read·Hot·주의 글자 | `#b45309` | `#fbbf24` | surface 5.0 / 10.6, canvas 4.8 / 11.4 |
| `warning-soft` | 주의 배경 | `#fffbeb` | `#2d2410` | `warning` 글자 4.8 / 9.2 |
| `danger` | 오류·위험 글자 | `#b91c1c` | `#f87171` | surface 6.5 / 6.4, surface-muted 5.9 / 5.7 |
| `danger-soft` | 오류 배경 | `#fef2f2` | `#2d1517` | `danger` 글자 5.9 / 6.2 |
| `danger-solid` | 위험 버튼 배경 | `#b91c1c` | `#b91c1c` | `on-accent` 6.5 / 6.5 |
| `danger-solid-hover` | 위험 버튼 hover | `#991b1b` | `#991b1b` | `on-accent` 8.3 / 8.3 |
| `scrim` | 모달 배경막 | `rgb(15 23 42 / 0.45)` | `rgb(0 0 0 / 0.6)` | — |

대비 값은 WCAG 2.x 상대 휘도 공식으로 `globals.css` 의 값에서 계산했다. `frontend/src/tests/design/TokenContrast.test.ts` 가 같은 공식으로 이 표의 조합을 매번 다시 확인한다.

색 사용 규칙:

| 규칙 | 내용 |
|---|---|
| 글자 대비 | 본문 크기 글자는 위 표에 적힌 조합(4.5:1 이상)만 쓴다. |
| `fg-subtle` | `surface-muted` 보다 어두운 배경(라이트 기준)에 쓰지 않는다. |
| 비활성 | `disabled:opacity-50` 로 표시한다 (대비 기준 예외, WCAG 1.4.3). |
| 포커스 링 | 전역 `:focus-visible { outline: 2px solid var(--al-accent); outline-offset: 2px }`. `accent` 는 canvas·surface·surface-muted 세 배경 모두에서 3:1 이상이다. 피드 카드의 j/k 포커스 표시는 `ring-2 ring-accent ring-offset-2 ring-offset-canvas`. |
| 불투명도 수정자 | `bg-surface/95`, `bg-accent/10` 처럼 쓸 수 있다 (Tailwind 4 `color-mix`). 글자 대비가 필요한 배경에는 쓰지 않고 표의 단색 토큰을 쓴다. |
| 스크롤바 | 전역 `scrollbar-width: thin; scrollbar-color: var(--al-border-strong) transparent`, WebKit 은 6px 둥근 `border-strong` 손잡이. |

## 3. Tailwind 구조와 새 토큰 추가 절차

### 3.1 `globals.css` 구조

Tailwind CSS 4 의 CSS 설정만 쓴다 (`tailwind.config.*` 없음). `frontend/src/app/globals.css` 는 아래 순서다.

| 블록 | 하는 일 |
|---|---|
| `@import "tailwindcss";` | Tailwind 불러오기 |
| `@custom-variant dark (&:where(.dark, .dark *));` | `dark:` 변형을 `.dark` 클래스에 묶는다 (미디어 쿼리가 아님) |
| `:root { … }` | 라이트(기본) 값. `color-scheme: light` + `--al-*` 색·그림자 변수 |
| `.dark { … }` | 다크 값. `color-scheme: dark` + 같은 이름의 `--al-*` 변수 |
| `@theme inline { … }` | `--color-<이름>: var(--al-<이름>)`, `--shadow-card`, `--shadow-overlay`. `inline` 이라 유틸리티가 변수를 직접 참조하고, 클래스 하나로 테마가 바뀐다 |
| `@theme { … }` | 테마와 무관한 값: `--font-sans`, `--font-mono`, `--ease-standard`, `--animate-*` 와 `@keyframes` |
| `@layer base { … }` | `body` 배경·글자·글꼴, `:focus-visible`, `::placeholder`, 스크롤바 |
| `::-webkit-scrollbar*` | `scrollbar-color` 를 모르는 브라우저용 스크롤바 |

Tailwind 기본 팔레트(`--color-slate-*` 등)는 지우지 않았다 (`bg-transparent`·`text-current` 가 남는지 확인하지 못했다). 팔레트 색 사용은 빌드가 아니라 `TokenGuard` 테스트가 막는다.

### 3.2 새 색 토큰 추가 절차

1. 정말 새 토큰이 필요한지 본다. 의미 색은 셋으로 제한한다. 장식 목적의 새 색을 만들지 않는다.
2. `globals.css` 세 곳에 같은 이름으로 넣는다.
   - `:root` 에 `--al-<이름>: <라이트 값>;`
   - `.dark` 에 `--al-<이름>: <다크 값>;`
   - `@theme inline` 에 `--color-<이름>: var(--al-<이름>);` (그림자면 `--shadow-<이름>`)
3. 글자나 UI 경계로 쓰는 토큰이면 대비 조합을 `frontend/src/tests/design/TokenContrast.test.ts` 의 `PAIRS` 에 더한다 (글자 4.5, UI 경계 3). 대비 테스트는 6자리 hex 만 읽으므로 글자·경계 색은 6자리 hex 로 적는다.
4. 이 문서 2절 표에 행을 더한다.
5. 다크에서 값을 없애려면 지우지 말고 무효 값으로 둔다. 예: 다크 `--al-shadow-card: 0 0 #0000;` (box-shadow 목록 안에서도 유효).

### 3.3 테마 전환

| 부분 | 위치 | 동작 |
|---|---|---|
| 첫 그리기 전 적용 | `frontend/src/app/layout.tsx` `<head>` 인라인 스크립트 | `localStorage.agentlens_theme`(`light`/`dark`/`system`, 그 밖은 `system`)과 `prefers-color-scheme` 로 `<html>` 에 `dark` 또는 `light` 클래스 하나, `data-theme`, `style.colorScheme` 를 단다. 깜빡임이 없다 |
| 저장소 | `frontend/src/lib/theme-store.ts` | `createThemeStore(storageKey, defaultTheme)` 의 외부 저장소. 스냅샷 `<mode>\|<시스템 light/dark>` 는 매번 `localStorage` 와 `matchMedia` 를 새로 읽는다. 구독: 같은 탭 `agentlens:theme-change` 이벤트, 다른 탭 `storage`, 시스템 `matchMedia change`. 순환 순서 `light → dark → system → light` (`nextThemeMode`) |
| 프로바이더 | `frontend/src/context/ThemeContext.tsx` | `useSyncExternalStore` 로 저장소를 읽고 `useLayoutEffect` 에서 `applyThemeToDocument` 로 DOM 에 다시 적용한다. 서버 스냅샷은 `defaultTheme` + `light` |
| viewport | `layout.tsx` `viewport` | `width=device-width`, `initialScale: 1`, `interactiveWidget: 'resizes-content'`, `colorScheme: 'light dark'`, `themeColor` 라이트 `#f8fafc` / 다크 `#0e1013`. `maximumScale`·`userScalable` 을 두지 않는다 (확대 허용) |
| 레이아웃 | `layout.tsx` | `<body className="min-h-dvh bg-canvas text-fg overflow-x-hidden">` → `ThemeProvider` → `<div id="app-shell">` + `<ToastRegion />`. `#app-shell` 은 오버레이 스택이 `inert` 를 다는 대상이다 (6절) |

## 4. 글꼴·크기·간격·반경·그림자·z-index·모션·브레이크포인트

### 4.1 글꼴

| 토큰 | 값 | 쓰는 곳 |
|---|---|---|
| `font-sans` (기본) | `-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | 모든 글자 |
| `font-mono` | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | 코드, `kbd`, 설정 JSON, URL 표시만 |

- 웹 글꼴(`next/font/google` 등)을 쓰지 않는다.
- 고정폭을 라벨·배지·제목에 쓰지 않는다. 영문 대문자 제목(`uppercase tracking-*`)을 쓰지 않는다.
- 줄바꿈 기본값: `globals.css` `@layer base` 의 `body` 에 `word-break: keep-all; overflow-wrap: break-word;` 가 있다. 한국어는 어절 단위로 줄을 바꾸고, 긴 토큰(URL 등)은 넘칠 때만 끊는다. 화면 코드에서 따로 지정하지 않아도 이 값을 물려받는다.
- 기본값을 이기는 곳: 마크다운 영역은 `MARKDOWN_WRAP_CLASSES`(`break-words [overflow-wrap:anywhere] [word-break:break-word]`), 코드·URL·도구 이름 같은 고정폭 토큰은 `break-all`. 줄 수를 제한한 제목(`line-clamp-2`)처럼 긴 토큰을 어디서든 끊어야 하는 곳은 `break-keep [overflow-wrap:anywhere]` 를 직접 준다.
- `break-words`(`overflow-wrap: break-word`)는 `word-break` 를 바꾸지 않으므로 함께 써도 `keep-all` 이 남는다.

### 4.2 글자 크기와 역할 (Tailwind 기본 스케일)

| 역할 | 클래스 | 크기/줄높이 (px) | 굵기 |
|---|---|---|---|
| 페이지 제목 (h1) | `text-xl`, lg 이상 `text-2xl` | 20/28 (24/32) | 600 |
| 대화상자 제목 (`Dialog` 기본 머리줄) | `text-base` | 16/24 | 600 |
| 카드 제목, 절 제목 | `text-base` | 16/24 | 600 |
| 본문, 요약, 마크다운 | `text-sm leading-relaxed` | 14/22.75 | 400 |
| UI 라벨·버튼 | `text-sm` (입력창은 모바일 `text-base`, md 이상 `text-sm`) | 14/20 | 500 |
| 메타·배지·캡션 | `text-xs` | 12/16 | 500 |

- 최소 12px. 임의 글자 크기(`text-[11px]` 등)를 쓰지 않는다. 예외는 `ChatMessageItem` 인라인 코드의 `text-[12px]` 하나다 (테스트가 단언, `text-xs` 와 같은 값).
- 마크다운 본문은 모든 폭에서 14px 이다.
- 입력창 글자를 모바일에서 16px 로 두는 것은 iOS 자동 확대를 막기 위해서다.

### 4.3 간격과 조작 요소 크기

| 항목 | 값 |
|---|---|
| 간격 격자 | 4px. 쓰는 단계 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16 (Tailwind 단위) |
| 페이지 좌우 여백 | 모바일 `px-4`(16), md `px-6`(24), lg `px-8`(32) |
| 최대 너비 | 피드 `max-w-7xl`(1280), 챗 메시지 열 `max-w-3xl`(768) |
| 카드 안쪽 여백 | `Card padding="md"`: `p-4 md:p-5` (16/20), `sm`: `p-3 md:p-4` |
| 쌓임 간격 | 8 / 12 / 16 / 24 |
| 조작 요소 높이 | 모바일 44px(`h-11`), md 이상 36px(`md:h-9`) |
| 아이콘 버튼 | `size-11 md:size-9` |
| `sm` 크기 | 모바일에서도 44px, md 이상에서만 32px (`h-11 md:h-8`) |
| `lg` 크기 | 48px, md 이상 40px (`h-12 md:h-10`) |
| 칩·세그먼트 | `h-11 md:h-8` |
| 탭 | `h-11 md:h-10` |
| 메뉴 항목 | `h-11 md:h-9` |
| 헤더 | `h-14` (56px) |

### 4.4 반경

| 대상 | 클래스 |
|---|---|
| 조작 요소 (버튼·입력·메뉴 항목) | `rounded-lg` (8px) |
| 칩·배지·스위치 트랙 | `rounded-full` |
| 카드·메뉴·팝오버·토스트 | `rounded-xl` (12px) |
| 대화상자 | md 이상 `rounded-2xl` (16px). 모바일 전체 화면은 0, 바텀시트는 위 모서리만(`rounded-t-2xl`) |

### 4.5 그림자

| 토큰 | 라이트 | 다크 | 대상 |
|---|---|---|---|
| `shadow-card` | `0 1px 2px rgb(15 23 42 / 0.06)` | `0 0 #0000` (없음, 테두리로 구분) | 카드, 선택된 세그먼트, 스위치 손잡이 |
| `shadow-overlay` | `0 12px 32px rgb(15 23 42 / 0.16)` | `0 12px 32px rgb(0 0 0 / 0.5)` | 대화상자·드로어·메뉴·팝오버·토스트 |

다른 `shadow-*` 를 쓰지 않는다.

### 4.6 z-index

| 레이어 | 값 | 대상 |
|---|---|---|
| 내용 | 0 | — |
| 고정 툴바 | `z-10` | 피드 필터 영역(md 이상 sticky), 대화상자 안 sticky 탭 머리 |
| 챗 사이드바 | `z-20` | 데스크톱 대화 기록 |
| 헤더 | `z-30` | `/` 헤더, `/chat` 헤더 |
| 메뉴·팝오버 | `z-40` | 더보기 메뉴, 테마 메뉴, 모델 선택, 인용 팝오버, 삭제 확인 팝오버 |
| 대화상자 | `z-50` | 배경막 + 대화상자·시트·드로어. 겹치면 포털에 나중에 붙은 것이 위 |
| 토스트 | `z-60` | 알림 영역 |

`Popover`·`MenuButton` 은 포털을 쓰지 않고 트리거의 `relative` 부모 안에 그린다. 대화상자 안의 팝오버는 대화상자 쌓임 맥락 안에서 그려진다.

### 4.7 모션

| 토큰 | 값 | 쓰는 곳 |
|---|---|---|
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | hover 등 전환 (`transition-colors duration-150 ease-standard`) |
| `animate-fade-in` | 150ms | 배경막, 메뉴·팝오버·토스트 |
| `animate-dialog-in` | 200ms (8px 위로 + 0.98 → 1) | 대화상자 (md 이상 바텀시트 포함) |
| `animate-sheet-in` | 240ms (아래에서 올라옴) | 모바일 바텀시트 |
| `animate-drawer-in` | 240ms (왼쪽에서 나옴) | 드로어 |

- 들어오는 애니메이션은 `motion-safe:animate-*` 로만 붙인다. `prefers-reduced-motion: reduce` 에서는 붙지 않는다.
- 닫힘 애니메이션은 없다. 닫으면 바로 언마운트한다.
- 반복 애니메이션은 진행 표시(`Spinner` 의 `animate-spin`, `Skeleton` 의 `motion-safe:animate-pulse`)에만 쓴다.
- JS 부드러운 스크롤(`behavior: 'smooth'`)은 `useMediaQuery('(prefers-reduced-motion: reduce)')` 가 참이면 `'auto'` 로 바꾼다. 지금 쓰는 곳(`AskAiPanel`, `ChatMessageList`, `ChatPromptInput`, `ScrollRow` 스크롤 버튼) 모두 이 규칙을 따른다.

### 4.8 브레이크포인트

| 이름 | 범위 | Tailwind |
|---|---|---|
| 모바일 | <768 | 기본 또는 `max-md:` |
| 태블릿 | 768~1023 | `md:` ~ `max-lg:` |
| 데스크톱 | ≥1024 | `lg:` |

- Tailwind 기본값(`sm` 640, `md` 768, `lg` 1024, `xl` 1280)만 쓴다. 정의되지 않은 변형(`xs:` 등)을 쓰지 않는다.
- JS 너비 판정은 `useMediaQuery('(min-width: 1024px)')` 처럼 `frontend/src/hooks/useMediaQuery.ts` 만 쓴다. `window.innerWidth` 를 직접 읽지 않는다. 서버·하이드레이션 첫 렌더는 `false` 다.
- 주요 조작 요소(모바일 44×44 대상): 헤더·메뉴 항목, 칩, 탭, 정렬·검색 입력, 카드의 북마크·챗 분석·원문, 페이지 이동, 대화상자 닫기·바닥 버튼, 스위치, 챗 입력·전송·중단, 세션 카드·삭제, 모델 칩, 인용 배지, 내보내기 버튼. 마크다운 본문 안 문장 속 링크는 제외한다 (WCAG 2.5.8 인라인 예외). 마크다운 밖의 문장 속 링크는 44px 로 키운다.

## 5. 공통 부품

### 5.1 부품 목록과 API

모든 부품은 `frontend/src/components/ui/<이름>.tsx` 에 있고 named export 와 default export 를 함께 둔다. 묶음 `index.ts` 는 없다 (`import { Button } from '@/components/ui/Button'`). 표의 props 외에 대부분 네이티브 요소 속성을 그대로 받는다.

| 부품 | 주요 props (기본값) | 접근성·동작 |
|---|---|---|
| `Button` | `variant: 'primary'\|'secondary'\|'ghost'\|'danger'` (`secondary`), `size: 'sm'\|'md'\|'lg'` (`md`), `loading?`, `leadingIcon?`, `button` 속성. `buttonClasses(variant, size, className?)` 를 함께 내보낸다 | `type="button"` 기본. `loading` 이면 `disabled` + `aria-busy="true"`, 아이콘 자리에 `Spinner`. 글자 있는 버튼만 (아이콘만이면 `IconButton`). `<Link>`·`<a>` 를 버튼 모양으로 할 때 `buttonClasses` |
| `IconButton` | `label` (필수), `icon`, `variant` (`ghost`), `size` (`md`), `pressed?` | `aria-label={label}`, `title` 기본 `label`. `pressed` 를 주면 `aria-pressed` (ghost 는 눌림 배경 `accent-soft`) |
| `TextField` | `label`, `hideLabel?`, `description?`, `error?`, `leadingIcon?`, `trailing?`, `containerClassName?`, `input` 속성 (`className` 은 `<input>` 에) | `<label htmlFor>` 연결 (`hideLabel` 이면 `sr-only`), 설명·오류를 `aria-describedby` 로, `error` 면 `aria-invalid` + `danger` 문구. 글자 `text-base md:text-sm`. 입력 글자가 넘치면 말줄임(`text-ellipsis`) |
| `SearchField` | `TextField` props + `onSubmit?(value)`, `onClear?`, `formClassName?` | `<form role="search">`, `type="search"`, `enterKeyHint="search"`. `onClear` 가 있고 값이 있으면 `IconButton label="검색어 지우기"`, 누르면 입력창으로 포커스 |
| `Textarea` | `label`, `hideLabel?`, `description?`, `error?`, `autoResize` (true), `maxHeight` (240), `rows` (3), `containerClassName?` | `TextField` 와 같은 라벨 규칙. 내용에 맞춰 높이를 늘리고 `maxHeight` 를 넘으면 세로 스크롤 |
| `Select` | `label`, `hideLabel?`, `description?`, `error?`, `options: {value, label, disabled?}[]`, `containerClassName?` | 네이티브 `<select>`. `h-11 md:h-9`. `hideLabel` 이어도 접근 이름은 남는다 |
| `Switch` | `checked`, `onChange(checked)`, `label`, `hideLabel?`, `description?`, `containerClassName?` | `button role="switch" aria-checked`. 보이는 라벨이면 `aria-labelledby`, `hideLabel` 이면 `aria-label`. 누르는 영역 `h-11 min-w-11 md:h-9 md:min-w-9` |
| `Badge` | `tone: 'neutral'\|'accent'\|'success'\|'warning'\|'danger'` (`neutral`), `icon?`, `shrink?` (false) | 상호작용 없음. `text-xs`, 높이 24px (`h-6`), `whitespace-nowrap`. `shrink` 가 false 면 `shrink-0 max-w-full` 이라 배지 줄에서 줄지 않는다. true 면 그 둘 대신 `shrink` 만 붙이고 폭 한계(`min-w-*`, `max-w-*`)는 호출자가 `className` 으로 준다. `cn` 이 Tailwind 충돌을 풀지 않으므로(5.2절) 같은 속성 클래스(`shrink-0` 과 `shrink`, `max-w-full` 과 `max-w-32`)를 함께 붙이지 않으려는 prop 이다. 줄어드는 배지는 글자를 `min-w-0 truncate` 감싸개에 넣고 `title` 에 전체 글자를 준다 (뉴스 카드 기술 배지: `<Badge shrink className="min-w-12 max-w-32" title={tech}>`). `min-w-*` 를 주지 않으면 flex 항목의 자동 최소 폭이 글자 폭이라 줄지 않는다 |
| `Chip` | `selected` (필수), `tone: 'accent'\|'warning'` (`accent`, 선택 상태의 색), `count?`, `icon?`, `iconClassName?`(아이콘 감싸개 `data-chip-icon` 에 붙는 클래스, 예: `max-xl:hidden`), `button` 속성 | `button aria-pressed`. `h-11 md:h-8`, `shrink-0 snap-start whitespace-nowrap`. 아이콘은 `aria-hidden`. 피드 `Must-Read` 토글은 `tone="warning"` 이고, `className`(`shrink-0 max-md:w-11 max-md:justify-center max-md:px-0`)과 글자 감싸개(`<span className="max-md:sr-only">`)로 768 미만에서 별 아이콘만 보이는 44×44 버튼이 된다 (접근 이름은 모든 폭에서 `Must-Read`) |
| `ChipGroup` | `label`, `scrollable` (false), `bleed: boolean\|'start'` (false), `className?`, `rowClassName?`, `selectedSelector?` (주지 않으면 `ScrollRow` 기본값 `[aria-pressed="true"]`) | `role="group" aria-label={label}`. `scrollable` 이면 그룹이 `ScrollRow` 의 스크롤 줄이 된다 (아래 `ScrollRow` 규칙 전부. 스크롤 버튼 이름에도 `label` 을 쓴다). 이때 `className` 은 바깥 감싸개(레이아웃 항목)에, `rowClassName` 은 그룹 요소에 붙고, `selectedSelector` 는 `ScrollRow` 로 넘어가 처음 그릴 때·바뀔 때 보이게 할 선택 칩과 스크롤 버튼이 사라질 때 포커스를 받을 칩을 고른다. 선택 칩이 아닌 토글 칩이 `aria-pressed` 를 함께 쓰는 줄은 선택 칩만 고르는 선택자를 넘긴다 (피드 소스 줄: `전체`·소스·`북마크` 칩에 `data-source-chip` 을 달고 `[data-source-chip][aria-pressed="true"]`. `Must-Read` 토글은 소스 줄 밖 형제라 켜고 꺼도 줄이 움직이지 않는다). `bleed`·`selectedSelector` 는 `scrollable` 일 때만 뜻이 있다. 아니면 줄바꿈하는 `flex-wrap` 그룹이고 `className` 은 그룹에 붙는다 |
| `ScrollRow` | `label` (필수, 스크롤 버튼 이름), `bleed: boolean\|'start'` (false), `selectedSelector` (`'[aria-pressed="true"]'`), `className?`(바깥 감싸개), `rowClassName?`(스크롤 줄), `ref?`(스크롤 줄), 그 밖의 `div` 속성(`role`, `aria-label`, `onKeyDown` …)은 스크롤 줄에 | 가로 스크롤 줄. DOM 은 바깥 감싸개(`relative flex min-w-0 items-center gap-1`) 안에 [이전 버튼] [왼쪽 넘침 표시 또는 자리] [스크롤 줄] [다음 버튼] [오른쪽 넘침 표시 또는 자리]. 버튼·표시는 스크롤 줄 **밖** 형제라 그룹 안 버튼 수가 바뀌지 않고 칩을 덮지 않는다. 스크롤 줄은 한 줄(`flex-nowrap`), `snap-x`, 스냅 여백 `scroll-px-6`(24px, 모든 폭·모든 줄), `overscroll-x-contain`, 스크롤바 숨김, 속성 `data-scroll-row`·`data-overflow="none\|start\|end\|both"`(`useScrollOverflow`)·`data-selected-selector`(받은 `selectedSelector` 그대로). 흐림: 넘친 쪽에만 24px `mask-image` (`both` 는 양쪽, `none` 은 마스크 없음). 흐림 폭 = 스냅 여백 = 선택 자식 보이기 여백 = 24px 라, 스냅 위치에 선 칩은 흐림 밖에서 시작한다. 768 이상: 넘친 쪽에만 `IconButton size="sm" variant="ghost"` (`{label} 이전 항목 보기`/`{label} 다음 항목 보기`, `ChevronLeft`/`ChevronRight`), 누르면 줄 폭의 0.8 만큼 `scrollBy` (줄인 모션이면 `behavior: 'auto'`). 768 미만: 버튼 없이 손가락으로 밀고, 넘친 쪽마다 장식 표시를 하나씩 둔다 — 왼쪽이 넘치면(`start`·`both`) 줄 앞에 `‹`(`span aria-hidden data-overflow-hint="start"`, `ChevronLeft`), 오른쪽이 넘치면(`end`·`both`) 줄 뒤에 `›`(`data-overflow-hint="end"`, `ChevronRight`). 표시는 폭 16px(`w-4`, 아이콘 `size-4`), `text-fg-subtle`, `pointer-events-none`, 포커스를 받지 않고, `absolute` 가 아니라 줄 위에 겹치지 않으며, 감싸개 `gap-1` 을 음수 여백(왼쪽 표시 `-mr-1`, 오른쪽 표시 `-ml-1`)으로 상쇄해 줄에 붙는다. `bleed`: 768 미만에서 줄이 페이지 여백 너머 화면 끝까지 닿는다. `true` 는 좌우(`-mx-4 px-4`), `'start'` 는 왼쪽만(`-ml-4 pl-4`, 오른쪽에 다른 컨트롤이 있을 때). 표시가 보이는 쪽에 `bleed` 가 있으면 줄은 그쪽으로 늘지 않고 표시가 그쪽 페이지 여백 16px 를 쓴다 (왼쪽 표시 `max-md:-ml-4`, 오른쪽 표시 `max-md:-mr-4`). 그래서 768 미만 줄의 `bleed` 클래스는 넘침 상태별로 `none` → `bleed` 그대로, `end` → 왼쪽만, `start` → `true` 면 오른쪽만·`'start'` 면 없음, `both` → 없음이다. 줄 패딩이 빠지는 만큼 줄 상자가 옮겨지므로 표시가 나타나고 사라져도 칩의 화면 위치는 그대로다. `bleed` 가 없는 쪽(`bleed="start"` 줄의 오른쪽, `bleed` 없는 줄의 양쪽)은 줄이 넘치는 동안(`data-overflow` ≠ `none`) 표시 자리를 늘 잡아 두고, 그쪽이 넘치지 않으면 같은 크기의 보이지 않는 자리(`span aria-hidden data-overflow-slot="start\|end"`, `invisible`)를 둔다. 그래서 줄 폭은 넘침이 생기고 없어질 때만 바뀌고, 스크롤하다 칩이 16px 씩 옆으로 움직이지 않는다. 포커스: 줄 안 요소가 포커스를 받으면 `scrollIntoView({ inline: 'nearest', block: 'nearest' })`. 처음 그릴 때와 `selectedSelector` 에 맞는 자식이 바뀔 때 그 자식이 보이도록 줄의 `scrollLeft` 만 바꾼다 (페이지는 스크롤하지 않는다). 바라는 범위는 줄 보이는 상자에서 넘친 쪽 흐림 24px 를 뺀 범위다 (줄 끝 `scrollLeft` 0·최댓값 쪽은 흐림이 없다). 스냅 줄은 브라우저가 스냅 위치가 아닌 값을 가장 가까운 스냅 위치로 되돌리므로, 목표를 자식들의 스냅 위치(자식 `scroll-snap-align` 과 줄 `scroll-padding` 으로 계산) 가운데서 고른다: 흐림 밖에 자식이 다 드는 위치 → (지금 위치가 보이는 상자 안이면 그대로) 보이는 상자 안에 다 드는 위치 → 그 자식 자신의 스냅 위치, 여럿이면 지금 위치에 가장 가까운 것. 값을 두는 동안만 `scroll-snap-type: none` 으로 둔다. 그 뒤 넘침 상태·버튼 때문에 줄 폭이 바뀌거나 줄·자식 크기가 바뀌면(건수가 늦게 들어와 칩이 커지는 경우 등, `ResizeObserver`) 그 선택 자식이 생긴 뒤 사용자가 줄을 스크롤하지 않았을 때만 다시 보이게 한다. 사용자 스크롤은 입력 신호 뒤에 온 `scroll` 만이다: 입력 신호는 바깥 감싸개의 `pointerdown`·`touchstart`·`keydown`과 가로 의도의 `wheel`(`Math.abs(deltaX) > Math.abs(deltaY) || shiftKey`, 모두 passive 리스너), 스크롤 버튼 클릭, 줄 안으로의 사용자 포커스 이동(줄의 `focusin`, 줄 자신이 대상이면 제외)이고, 받으면 '사용자 조작 중'(ref) 이 된다. 그동안 온 `scroll` 이면 줄을 '사용자가 스크롤함'(ref, 새 선택 자식이 생기면 지움)으로 표시한다. '사용자 조작 중' 은 `scrollend` 에서 끝나고, `scrollend` 를 지원하지 않으면 마지막 `scroll` 뒤 `USER_SCROLL_IDLE_MS`(150ms), 입력 뒤 `USER_INPUT_TIMEOUT_MS`(1,000ms) 안에 `scroll` 이 없으면 끝난다 (두 값은 측정 근거 없는 파일 상단 상수). 입력 신호 없이 온 `scroll`(브라우저의 범위 자르기·스냅 재맞춤, 다른 코드의 `scrollLeft` 변경), 이 부품이 둔 값과 1px 이내인 `scroll`, 스크롤 버튼 포커스 유지가 옮긴 포커스의 `focusin` 은 사용자 스크롤·입력 신호가 아니다. 세로 휠(가로 성분이 세로 이하이고 Shift 없음)은 줄 위에서 페이지를 내리는 동작이라 입력 신호가 아니다: 768 이상 sticky 툴바 위에서 페이지를 세로로 휠 스크롤해도 '사용자 조작 중' 이 되지 않아, 그 사이 브라우저의 범위 자르기·스냅 재맞춤 `scroll` 이 사용자 스크롤로 기록되지 않는다. 판정은 ref 로만 해 다시 그리지 않고, 리스너·타이머는 언마운트 때 정리한다. 스크롤 버튼 포커스 유지: 포커스를 가진 스크롤 버튼이 사라지면(끝에 닿아 넘침 상태가 바뀜, 폭이 768 미만이 됨) 그리기 전에(`useLayoutEffect`) ① 반대쪽 버튼(있으면) ② 줄의 선택 자식(`selectedSelector`) ③ 줄의 첫 포커스 가능 요소 순서로 `focus({ preventScroll: true })` 한다. 포커스를 가진 버튼은 ref 로 기억하고(다시 그리지 않는다), 사용자가 먼저 다른 곳으로 포커스를 옮겼으면 옮기지 않는다 |
| `SegmentedControl` | `label`, `options: {value, label, icon?, disabled?, ariaLabel?, title?}[]`, `value`, `onChange` | `role="group" aria-label` + 버튼 `aria-pressed`. 이미 선택된 버튼을 눌러도 `onChange` 를 부른다 (호출자가 판단) |
| `Tabs` | `label`, `tabs: {id, label, badge?, disabled?}[]`, `value`, `onChange`, `idPrefix` (`'tabs'`), `mountedPanels?: T[]`(선택되지 않았어도 패널이 DOM 에 있는 탭 id), `className?`(바깥 감싸개, 아래 테두리) | WAI-ARIA 탭: `role="tablist"`/`tab`, `aria-selected`, 로빙 `tabIndex`, ←/→ 순환·Home·End, 자동 활성화(화살표로 옮기면 바로 선택). `aria-controls` 는 패널이 그 순간 DOM 에 있는 탭(선택된 탭과 `mountedPanels` 의 탭)에만 단다. 선택된 패널만 그리면 `mountedPanels` 를 주지 않고, `TabPanel active={false}` 로 숨겨 두는 패널이 있으면 그 탭 id 를 준다. 탭 줄은 `ScrollRow`(`role="tablist"` 가 스크롤 줄)다: 넘침 흐림, 768 이상 스크롤 버튼, 768 미만 넘침 표시(tablist 밖)가 같고, 포커스 받은 탭과 선택된 탭(처음 그릴 때·바뀔 때)을 보이게 미는 것도 `ScrollRow` 가 한다 (`selectedSelector="[role=\"tab\"][aria-selected=\"true\"]"`). `bleed` 는 쓰지 않는다 |
| `TabPanel` | `id` (탭 id), `idPrefix` (`'tabs'`), `active` (true) | `role="tabpanel"`, `aria-labelledby`, `tabIndex={0}`. `active={false}` 면 `hidden`. 선택된 패널만 그려도, 모두 그리고 `active` 로 숨겨도 된다 (숨겨 두는 패널의 탭 id 는 `Tabs` 의 `mountedPanels` 에 준다) |
| `Card` | `as: 'article'\|'section'\|'div'` (`div`), `interactive?`, `padding: 'none'\|'sm'\|'md'` (`md`), `ref?` | `rounded-xl border bg-surface shadow-card`. `interactive` 면 hover 테두리 `border-strong`, `focus-within` 링 |
| `Dialog` | 6.2절 | 6절 |
| `Drawer` | `Dialog` props (`size`·`mobile`·`placement` 제외) + `side: 'left'` | 6절 규칙 + 너비 `min(320px, 85vw)`, 높이 화면 전체 |
| `ConfirmDialog` | `open`, `title`, `description?`, `confirmLabel`, `cancelLabel` (`'취소'`), `tone: 'danger'\|'default'` (`default`), `busy?`, `error?`, `onConfirm`, `onCancel` | `role="alertdialog"`, 크기 `sm` 바텀시트, 처음 포커스는 취소 버튼. `busy` 동안 두 버튼 비활성(확인은 스피너), Escape·배경막 무시, 포커스는 대화상자 컨테이너에 둔다. `busy` 가 풀리면 실패 시 오류 문구로, 그 밖에는 확인 버튼으로 포커스를 돌린다. `error` 는 대화상자 안 `InlineAlert tone="danger"` |
| `MenuButton` (= `Menu`) | `label`, `icon?`, `items: MenuItem[]`, `align: 'start'\|'end'` (`start`), `variant?`, `className?`(트리거), `menuClassName?` | 6.5절 |
| `Popover` | `open`, `onClose`, `anchorRef`, `label`, `role: 'dialog'\|'radiogroup'` (`dialog`), `focusOnOpen` (false), `side: 'bottom'\|'top'` (`bottom`), `align: 'start'\|'end'` (`start`), `id?`, `className?` | 6.5절 |
| `ToastRegion`, `useToast`, `showToast` | `ToastRegion`: `placement: 'global'\|'composer'` (`global`), `className?`. `useToast()` → `{ show, dismiss }`. `show({ message, tone: 'info'\|'success'\|'warning'\|'danger' ('info'), duration (3500, 0 이하면 자동으로 닫지 않음) })` → id. `showToast`·`dismissToast` 는 컴포넌트 밖에서도 부른다 | 알림마다 `role="status" aria-live="polite"`, `danger` 는 `role="alert" aria-live="assertive"`. 닫기 `IconButton label="알림 닫기"`. 영역은 `data-toast-region="global\|composer"`, `z-60`. `global`: `body` 포털 (`#app-shell` 이 `inert` 여도 보인다), 모바일 아래(안전 영역 위), md 이상 오른쪽 위 384px. `composer`: 포털 없이 그 자리에서 부모 위쪽에 붙는다 (`absolute inset-x-0 bottom-full mb-2`, 안쪽 `mx-auto max-w-3xl px-4 md:px-6` 로 메시지 열과 같은 폭). 부모가 `relative` 여야 하고 잘리지 않게 `overflow` 상자 밖에 둔다 (챗 입력 영역 감싸개). 여러 영역이 마운트돼도 하나만 그린다: 오버레이 스택에 모달이 없고 `composer` 영역이 있으면 가장 나중에 등록된 `composer`, 아니면 처음 등록된 `global`(`global` 이 없으면 가장 나중의 `composer`). 모달이 열리면 `composer` 는 `inert` 인 `#app-shell` 안이라 `global` 로 넘긴다. 한 번만 알림: 알림 하나는 처음 그려진 한 번만 live 속성(`role`·`aria-live`)을 갖는다. 그리는 영역이 바뀌어 다른 영역이 그 알림을 그리면, 그 뒤로는 어느 영역에서도(처음 영역으로 돌아와도) 글자·아이콘·닫기 버튼은 같고 `role`·`aria-live` 없이 그려 화면 읽기 프로그램이 같은 알림을 다시 읽지 않는다. 새로 뜬 알림은 처음 그리는 영역에서 알린다. 기록은 모듈의 `announcedBy`(알림 id → 처음 알린 영역 id, 다른 영역이 그린 뒤에는 `null`)이고 알림이 닫히면(`dismissToast`, `clearToasts`) 지운다 |
| `InlineAlert` | `tone: 'info'\|'success'\|'warning'\|'danger'` (`info`), `title?`, `children`, `action?` | 대화상자·영역 안 결과·오류 표시. `danger` 는 `role="alert"`, 나머지는 `role="status"`. `info` 는 `accent-soft` 색 |
| `Spinner` | `label?`, `className?` | 회전 아이콘은 `aria-hidden`, `label` 이 있으면 `sr-only` 글자 |
| `Skeleton` | `className` (크기) | `bg-surface-muted motion-safe:animate-pulse`, `aria-hidden` |
| `EmptyState` | `icon?`, `title`, `description?`, `action?` | 안내 문구와 다음 행동 버튼 |
| `ErrorState` | `title`, `message`, `onRetry?`, `retryLabel` (`'다시 시도'`), `retrying?` | `role="alert"`, 재시도 `Button` (`retrying` 이면 스피너) |
| `Kbd` | `children` | `<kbd>`, 640px 미만에서 숨김 (`hidden sm:inline-flex`) |
| `CodeBlock` | `code`, `language?` (없으면 `snippet`), `codeClassName?`, `copyValue?` | 언어 표시 + 복사 버튼(`useCopyToClipboard`, 문구 `복사`/`복사됨`/`복사 실패`, `aria-live="polite"`) + 가로 스크롤 `<pre tabIndex={0} aria-label="가로 스크롤 가능한 코드 블록">`. 기본 복사 값은 끝 줄바꿈 하나를 뺀 `code` |
| `ThemeMenu` | `align` (`end`), `variant?`, `className?` | `MenuButton label="테마 선택"` + `menuitemradio` 3개(라이트·다크·시스템). `ThemeToggle showDropdown` 이 이것을 그린다 |

입력 계열을 새로 만들 때는 `TextField.tsx` 가 내보내는 도우미를 쓴다: `FieldFrame`(라벨·설명·오류 틀), `useFieldIds(id, hasDescription, hasError, extraDescribedBy?)`, `FIELD_CONTROL_CLASSES`, `fieldBorderClasses(invalid)`.

### 5.2 함께 쓰는 모듈과 훅

| 모듈 | 위치 | 내용 |
|---|---|---|
| `cn(...values)` | `frontend/src/lib/cn.ts` | 클래스 이름을 공백으로 잇고 거짓 값을 뺀다. Tailwind 충돌을 풀지 않는다 (같은 속성 클래스가 둘이면 CSS 순서가 이긴다) |
| `overlayStack`, `useOverlayLayer`, `useOverlayOpen`, `useModalOpen`, `useTopOverlayId` | `frontend/src/lib/overlay-stack.ts` | 6.1절 |
| `CATEGORY_LABELS`·`categoryLabel(id)`, `CATEGORY_SHORT_LABELS`·`categoryShortLabel(id)`, `RADAR_CATEGORY_LABELS`·`radarCategoryLabel(name)`, `SOURCE_LABELS`·`sourceLabel(id)` | `frontend/src/lib/labels.ts` | 카테고리·소스 표시 라벨 한 곳. 긴 라벨(`하네스 & 벤치마크`, `MCP & 생태계`, `에이전트 아키텍처`, `최신 AI 동향`)은 피드 카테고리 필터 칩·상세 배지·소스 등록 선택지·딥 리서처 기록, 짧은 라벨(`하네스`, `MCP`, `에이전트`, `AI 동향`)은 카드 머리줄·챗 기사 칩·인용 팝오버·포커스 캡슐, 레이더 라벨은 트렌드 레이더 응답의 영문 카테고리 이름(`Harness & Benchmark` …)을 한국어로 바꾼다. 모르는 id·이름은 그대로 돌려준다. 소스 `rss` 는 `Global Blogs` |
| `ALL_CATEGORY_LABEL`, `SCOPE_LABELS`·`scopeLabel(mode)` | `frontend/src/lib/labels.ts` | `ALL_CATEGORY_LABEL = '전체 소식'` 은 카테고리 '전체' 의 화면 문구(피드 `전체 소식` 칩, 챗 포커스 캡슐 기본값, 포커스 필터 창 `all` 칩). 검색 범위 라벨은 `scoped` → `단일 기사`, `global` → `ALL_CATEGORY_LABEL`. 챗 모드 탭, 대화 목록 배지·접근 이름(`… 모드`), 없는 기사 알림이 쓴다 |
| `ScoreMetric`·`SOURCE_SCORE_METRICS`·`SCORE_METRIC_LABELS`·`scoreMetric(source)`, `CountMetric`·`COUNT_METRIC_LABELS`·`countMetric(source)` | `frontend/src/lib/labels.ts` | 카드 통계의 지표 표. 원천 점수(`raw_score`)는 `github` → `stars`(`스타`), `hackernews` → `points`(`포인트`), `reddit` → `upvotes`(`추천`)이고 표에 없는 소스는 `null`(점수를 그리지 않음). 개수(`comments_count`)는 `github` → `forks`(`포크`), 그 밖 → `comments`(`댓글`). 아이콘은 두지 않는다 (`NewsCard` 가 `Star`·`ArrowBigUp`·`GitFork`·`MessageSquare` 로 고른다). `scoreMetric(source)` 는 카드의 원천 점수와 인기 점수(`hotness_score`, `Flame`) 둘 다의 표시 조건이다: `null` 인 소스는 둘 다 그리지 않는다 (인기 점수는 `raw_score` 에서 계산되므로 지표 없는 소스에서는 합성 값이다). 인기 점수는 그 위에 `hotness_score > 25` 일 때만 그린다 |
| `FEED_CATEGORIES`(id·lucide 아이콘), `feedCategoryLabel(id)` | `frontend/src/components/feed/FeedToolbar.tsx` | 카테고리 아이콘 표 한 곳: `all` `Compass`, `harness` `ShieldCheck`, `mcp_plugins_skills` `Cpu`, `agent_tech` `Bot`, `ai_news` `Sparkles`. 피드 카테고리 칩과 일일 브리핑 분야 머리글이 같은 표를 쓴다 (표에 없는 분야는 아이콘 없음) |
| `TIER_META`, `TierIcon({ tier, className? })` | `frontend/src/components/chat/ModelTierBadge.tsx` | 모델 티어 표(이름·lucide 아이콘·비용·지연·설명): `haiku` `Zap`, `sonnet` `Target`, `opus` `Brain`. Claude 밖 티어 이름은 `gemini` 포함 `Sparkles`, `gpt` 포함 `Bot`, 그 밖 `Target`. `TierIcon` 은 `aria-hidden="true"`·`data-tier-icon="<티어>"`·`size-3.5` 로 그리고, `ModelTierBadge`·`ChatModelSelector`(트리거·목록)가 같이 쓴다 |
| `useScrollOverflow(ref)` → `'none'\|'start'\|'end'\|'both'`, `measureScrollOverflow(el)` | `frontend/src/hooks/useScrollOverflow.ts` | 가로 스크롤 줄이 어느 쪽으로 넘치는지(아직 볼 것이 남은 쪽). `scrollWidth − clientWidth` 와 `scrollLeft` 로 정하고 1px 이하 차이는 넘침으로 보지 않는다. `ResizeObserver`(줄과 자식), `MutationObserver`(자식 추가·삭제), 줄 `scroll`, 창 `resize` 에서 다시 잰다. 상태는 관찰자·이벤트·`requestAnimationFrame` 콜백 안에서만 바꾼다. `ResizeObserver` 가 없으면(jsdom) 처음 한 번과 `scroll`·`resize` 로만 잰다. `ScrollRow` 가 쓴다 |
| `findRepeatedInsights(items)` → `Set<id>` | `frontend/src/lib/feed-insights.ts` | 현재 목록에서 같은 시사점(`why_it_matters`)이 2번 이상 나온 기사 id. 공백을 정리한 문장의 끝 40자(코드 포인트)를 키로 세고, 20자 미만이거나 빈 문장은 세지 않는다. 피드가 이 집합의 카드에 `NewsCard preferSummary` 를 넘겨 시사점 대신 요약을 보인다 |
| `createThemeStore`, `applyThemeToDocument`, `nextThemeMode` | `frontend/src/lib/theme-store.ts` | 3.3절 |
| `useMediaQuery(query)` | `frontend/src/hooks/useMediaQuery.ts` | `useSyncExternalStore` 로 `matchMedia` 구독. 스냅샷마다 새로 읽고, 서버·`matchMedia` 없음은 `false` |
| `useFocusTrap(ref, active, { initialFocusRef?, initialFocusScopeRef?, restoreFocus = true })`, `getFocusableElements(el)` | `frontend/src/hooks/useFocusTrap.ts` | 6.3절. `tabindex="-1"`·`inert`·`hidden`·`aria-hidden="true"` 아래 요소는 포커스 대상에서 뺀다. 안의 요소가 비활성되는 등으로 포커스가 `body` 로 빠지면 대화상자로 되돌린다 |
| `useScrollLock(active)` | `frontend/src/hooks/useScrollLock.ts` | `body` `overflow: hidden`, 참조 수. 마지막 하나가 풀릴 때 원래 값으로 |
| `useHotkey(combo, handler, { enabled, allowInInputs, preventDefault })` | `frontend/src/hooks/useHotkey.ts` | 7.3절 |
| `useCopyToClipboard(resetMs = 2000)` → `{ status, label, copy, reset }`, `copyText(text)` | `frontend/src/hooks/useCopyToClipboard.ts` | `navigator.clipboard.writeText` → 없거나 실패하면 숨긴 `textarea` + `execCommand('copy')` → 그래도 실패하면 `failed`. 상태 문구 `복사`/`복사됨`/`복사 실패` 를 2초 유지 |
| `useCollector({ onRefresh })`, `collectNow`, `resetAndCollect`, `formatTimeLeft` | `frontend/src/hooks/useCollector.ts` | 수집 상태 공유 저장소. 헤더·스케줄 대화상자·커맨드 팔레트가 같은 상태를 본다. 구독자가 있을 때만 30초마다 스케줄, 수집 중 1.2초마다 진행도를 읽고, 즉시 수집·초기화의 중복 요청을 막는다. 스케줄 상태 응답은 요청 번호로 순서를 맞춰, 더 나중 요청의 응답이 이미 반영됐거나 진행 폴링이 끝나기 전에 보낸 요청의 응답이면 버린다 (`statusSeq`·`appliedStatusSeq`·`progressEndSeq`). 그래서 수집 한 번에 `수집 완료` 는 한 번만 뜬다 |

### 5.3 부품 사용 규칙

| 규칙 | 이유·방법 |
|---|---|
| `className` 은 덧붙이기만 | 부품은 `className` 을 맨 뒤에 붙인다. 배치·여백·너비 조정에 쓰고, 색·높이 클래스를 덮어쓰는 데 쓰지 않는다 (`cn` 은 충돌을 풀지 않는다). 다른 색이 필요하면 부품에 `tone`/`variant` 를 더한다 |
| 숨기기는 감싸는 요소에 | 부품의 `className` 에 `hidden`(또는 `md:hidden` 등)을 주지 않는다. 부품 기본 `inline-flex`/`flex` 가 이겨 숨겨지지 않는다. `<div className="hidden md:block"><Button …/></div>` 처럼 감싸는 요소에 준다 |
| `Tabs`·`TabPanel` 의 `idPrefix` | 두 부품은 형제라 같은 `idPrefix`(기본 `tabs`)로 연결된다. 요소 id 는 `${idPrefix}-tab-${id}`, `${idPrefix}-panel-${id}` (`tabElementId`, `tabPanelElementId`). 한 화면에 탭 묶음이 둘 이상이면 서로 다른 `idPrefix` 를 준다 |
| 같은 접근 이름 두 번 금지 | 폭마다 다른 요소를 그릴 때 접근 이름이 같으면 요소 하나로 두고 글자만 `sr-only` 로 숨긴다. 이름이 다르면(예: lg 이상 `검색·명령` 버튼, lg 미만 `커맨드 팔레트 열기` 아이콘 버튼) 둘로 둔다. 보이는 글자가 접근 이름에 포함되게 한다 (WCAG 2.5.3) |
| 토글 상태 | 접근 이름은 고정하고 상태는 `aria-pressed`/`aria-checked`/`aria-expanded` 로 알린다 (예: 북마크 `IconButton label="보관하기" pressed`) |
| 동작 버튼과 필터 칩 | `Chip` 은 켜고 끄는 필터(`aria-pressed`)에만 쓴다. 누르면 무언가를 실행하는 칩 모양 버튼(예: 빠른 질문)은 `ChipGroup` 안의 일반 `<button>` 으로 그린다 |
| 입력과 칩의 쓰임 | 글자 입력(`SearchField`·`TextField`)과 선택 상자(`Select`)는 칩 줄에 섞지 않고 별도 영역에 둔다 (예: 피드는 검색 영역 → 필터 영역(칩 줄만) → 목록 머리줄(상태 + 정렬)). 입력·선택 상자는 입력 토큰(`h-11 md:h-9`, `rounded-lg`, `border-border-strong`)을 그대로 쓰고 칩 높이·모양(`h-11 md:h-8`, `rounded-full`, `border-border`)에 맞추지 않는다: 같은 줄에 있지 않아 맞출 이유가 없고, 입력 경계는 3:1 대비(WCAG 2.2 SC 1.4.11)가 필요한데 칩 테두리 `border` 는 흰 바탕에서 약 1.2:1, `border-strong` 은 약 3.6:1 이다 |
| 아이콘 | 아이콘은 `lucide-react` 컴포넌트로 그리고 장식이면 `aria-hidden="true"` 를 단다. 버튼·탭·라벨·제목·알림 문구 같은 프론트 글자에 그림 이모지를 넣지 않는다. 그림 이모지 판정은 `/\p{Emoji_Presentation}\|\p{Extended_Pictographic}\u{FE0F}/u` 다: 기본이 이모지 표현인 글자와 U+FE0F 로 이모지 표현을 고른 그림 문자. `©`·`®`·`↔`·`➔`·`✓` 같은 텍스트 표현 기호는 글자로 쓸 수 있다. 같은 대상에 아이콘이 여럿 필요하면 표를 한 곳에 둔다 (카테고리 `FEED_CATEGORIES`, 모델 티어 `TIER_META`, 5.2절) |
| 가로 스크롤 줄 | 한 줄로 두고 넘치면 가로로 미는 조작 요소 줄(필터 칩, 급상승 태그, 챗 맥락 줄, 빠른 질문, 탭)은 `ChipGroup scrollable` 이나 `ScrollRow` 로만 만든다. 그런 줄을 `overflow-x-auto` 로 직접 만들지 않는다 (마크다운 표·`CodeBlock` 의 가로 스크롤 상자는 해당 없음). 그룹 접근 이름이 있으면 `ChipGroup scrollable` (또는 `ScrollRow` 에 `role`·`aria-label` 을 넘긴다). 768 미만에서 넘침 표시를 줄마다 따로 그리지 않는다 (`ScrollRow` 가 그린다). 선택 칩이 아닌 토글이 줄 안에 함께 있으면 `selectedSelector` 로 선택 칩만 고른다 (5.1절 `ChipGroup`) |
| `aria-controls` 는 대상이 있을 때만 | 가리키는 요소가 그 순간 DOM 에 없으면 `aria-controls` 를 달지 않는다. 열릴 때만 그리는 사이드바·드로어·폼을 여는 버튼은 열렸을 때만 단다 (`aria-expanded` 는 늘 단다). `Tabs` 는 `mountedPanels` 규칙(5.1절), `MenuButton` 은 열렸을 때만 단다 |
| 라벨 | 카테고리·소스 표시는 `lib/labels.ts` 에서 가져온다 (5.2절). 피드 카테고리 필터 칩은 `전체 소식` 외에는 긴 라벨이라 상세 배지와 같은 문구다. 챗 포커스 필터 창의 카테고리 칩도 같은 긴 라벨이다. 검색 범위(`단일 기사`·`전체 소식`)와 카드 지표 라벨도 이 모듈에서 가져온다. 화면 안에 라벨 표를 따로 두지 않는다 |
| 브라우저 기본 대화상자 금지 | `window.confirm`/`alert` 대신 `ConfirmDialog`, 실패는 확인 창 안 `InlineAlert` |
| 제목이 두 줄 이상인 대화상자 | `Dialog` 기본 머리줄 제목은 한 줄(`truncate`)이다. 길게 보여야 하면 `header` 로 머리줄을 직접 그리고 제목 id 를 `labelledBy` 로 넘긴다. 닫기 버튼(`닫기`)도 그 안에 둔다 |

## 6. 오버레이 규칙

대화상자·드로어·바텀시트·확인 창·메뉴·팝오버는 모두 오버레이 스택(`frontend/src/lib/overlay-stack.ts`)에 올라간다.

### 6.1 스택

| 항목 | 규칙 |
|---|---|
| 등록 | `useOverlayLayer({ open, kind: 'modal'\|'popover', onEscape, elementRef? })` 가 열린 동안 레이어를 올리고 닫히거나 언마운트되면 뺀다. `Dialog`·`Drawer`·`ConfirmDialog`(`modal`)와 `MenuButton`·`Popover`(`popover`)는 스스로 등록한다 |
| 순서 | 레이어마다 쌓는 순서 번호 `order` 가 있고 스택은 `order` 오름차순이다. `useOverlayLayer` 는 `open` 이 false→true 로 바뀌는 렌더에서 모듈 카운터로 새 번호를 받는다 (늘 증가). `push` 는 맨 뒤가 아니라 `order` 자리에 넣고, 맨 위·`inert`·Escape 는 정렬된 스택을 본다. 다시 열면 새 번호라 맨 위다. `order` 없이 `overlayStack.push` 로 직접 올린 레이어는 그때 새 번호를 받아 맨 위에 놓인다 |
| 같은 렌더에서 함께 열기 | 부모와 자식 대화상자가 같은 렌더에서 함께 열려도 된다. 렌더는 부모가 먼저라 부모 번호 < 자식 번호이고, 자식 effect 가 먼저 돌아 먼저 `push` 돼도 자식이 맨 위다 (StrictMode 이중 렌더에서도 같다). 겹치는 확인 창은 부모 대화상자 안이 아니라 형제로 그려도 된다 (포털이라 위치는 같다) |
| Escape | 스택이 비어 있지 않을 때만 `window` 에 keydown 리스너 하나를 단다. Escape(IME 조합 중·이미 `defaultPrevented` 면 제외)는 맨 위 레이어의 `onEscape` 만 부르고 `preventDefault` 한다. 컴포넌트마다 Escape 리스너를 따로 달지 않는다. 안쪽 요소가 Escape 를 직접 처리했으면 `preventDefault` 해서 스택이 넘기게 한다 |
| 배경 차단 | 모달이 하나라도 있으면 `#app-shell` 에, 맨 위가 아닌 모달 요소에 `inert` 를 단다. React prop 이 아니라 스택이 DOM 에 바로 단다 (닫는 즉시, 포커스 복귀 전에 풀린다). `popover` 는 `inert` 를 만들지 않는다 |
| 열림 여부 | `useOverlayOpen()` 은 레이어가 하나라도 있으면 true. 단일 키 단축키 차단에 쓴다. `useModalOpen()` 은 `modal` 레이어가 하나라도 있으면 true (알림 영역 고르기에 쓴다, 5.1절 `ToastRegion`). `useTopOverlayId()` 는 맨 위 레이어 id |

### 6.2 `Dialog` API

| prop | 기본 | 설명 |
|---|---|---|
| `open`, `onClose` | — | 열림 상태와 닫기 요청 |
| `title` | — | 머리줄 `h2`, `aria-labelledby` 로 연결 |
| `description` | — | 본문 위 설명, `aria-describedby` 로 연결 |
| `size` | `md` | md 이상 너비 `sm` 420 / `md` 560 / `lg` 720 / `xl` 896px |
| `mobile` | `fullscreen` (`size="sm"` 이면 `sheet`) | 768px 미만 배치 |
| `placement` | `center` | `top` 은 커맨드 팔레트용 |
| `initialFocusRef` | — | 처음 포커스할 요소 |
| `dismissOnScrim` | true | 배경막 클릭으로 닫기. 입력 폼은 false |
| `busy` | false | 진행 중이면 Escape·배경막·닫기 버튼을 무시하고 `aria-busy` |
| `footer`, `headerActions` | — | 바닥 고정 영역, 머리줄 닫기 버튼 앞 버튼 |
| `closeLabel` | `닫기` | 머리줄 닫기 버튼 접근 이름 |
| `header`, `labelledBy` | — | 기본 머리줄 대신 직접 그릴 내용과 그 안의 제목 id |
| `ariaLabel` | — | 보이는 제목이 없을 때의 접근 이름 (제목도 `header` 도 없으면 머리줄을 그리지 않는다) |
| `role` | `dialog` | `ConfirmDialog` 는 `alertdialog` |
| `panelProps`, `backdropTestId`, `className`, `bodyClassName` | — | 패널 속성(터치 핸들러 등), 배경막 `data-testid`, 패널·본문 클래스 (본문 기본 `px-4 py-4 md:px-5`) |

`Dialog` 는 네이티브 `<dialog>` 가 아니라 `div role="dialog"` + `createPortal(…, document.body)` 다. 서버 렌더·하이드레이션 첫 렌더에는 그리지 않는다.

### 6.3 모달 공통 동작

| 항목 | 규칙 |
|---|---|
| 속성 | `role="dialog"`(확인 창 `alertdialog`), `aria-modal="true"`, `aria-labelledby` → 제목 `h2`(또는 `aria-label`), `description` 이 있으면 `aria-describedby`, 패널 `tabIndex={-1}` |
| 처음 포커스 | 열 때 `document.activeElement` 를 저장한다. `initialFocusRef` → 본문의 첫 포커스 가능 요소 → 패널 전체의 첫 포커스 가능 요소 → 패널 순서로 포커스한다. 이미 패널 안에 포커스가 있으면 옮기지 않는다 (`initialFocusRef` 가 있으면 옮긴다) |
| 포커스 가두기 | Tab/Shift+Tab 은 패널 안에서 순환한다 |
| 포커스 복귀 | 닫을 때 저장한 요소가 문서에 남아 있으면 그곳으로 되돌린다. 스택 정리(`inert` 해제)가 포커스 복귀보다 먼저 돈다 (`useOverlayLayer` 를 `useFocusTrap` 보다 먼저 선언) |
| 스크롤 잠금 | 모든 모달·드로어가 `useScrollLock` (참조 수) |
| 바텀시트 끌어 닫기 | `mobile="sheet"` 는 아래로 100px(`SHEET_SWIPE_CLOSE_PX`) 넘게 끌면 닫는다 (`busy` 면 무시) |

### 6.4 닫기 수단과 배치

| 종류 | Escape | 배경막 클릭 | 닫기 버튼 |
|---|---|---|---|
| 읽기 위주 (뉴스 상세, 일일 브리핑, 스케줄, MCP, 커맨드 팔레트, 대화 기록 드로어, 포커스 필터) | 닫힘 | 닫힘 | 머리줄 X (`닫기`, 드로어는 `대화 기록 드로어 닫기`). 바닥 `닫기` 는 두지 않는다 |
| 입력 폼 (공유 & 알림 설정, 소스 & 리서처) | 닫힘 | 안 닫힘 (`dismissOnScrim={false}`) | 머리줄 X, 바닥 `닫기` |
| 확인 창 (`ConfirmDialog`) | 닫힘 (`busy` 면 무시) | 닫힘 (`busy` 면 무시) | `취소` |
| 팝오버·메뉴 | 닫힘 | 바깥 pointerdown | 있는 것만 |

| 폭 | `mobile="fullscreen"` | `mobile="sheet"` | `placement="top"` |
|---|---|---|---|
| <768 | 화면 전체(`h-dvh`), 머리줄 56px 고정(제목 + 닫기), 본문 스크롤, 바닥 고정 + `pb-[max(0.75rem,env(safe-area-inset-bottom))]` | 아래 바텀시트, 위 모서리 둥금, 끌기 손잡이, 최대 높이 `90dvh` | 화면 전체, 검색창 맨 위 |
| ≥768 | 가운데, `size` 너비(`max-w-[calc(100vw-3rem)]`), 최대 높이 `85dvh`, 머리줄·바닥 고정, 본문 스크롤 | 가운데, `size` 너비 | 위에서 `12dvh`, 너비 560px |

배경막은 `bg-scrim motion-safe:animate-fade-in`, 대화상자 `animate-dialog-in`, 모바일 바텀시트 `animate-sheet-in`, 드로어 `animate-drawer-in` (모두 `motion-safe:`).

### 6.5 메뉴와 팝오버

| 항목 | `MenuButton` | `Popover` |
|---|---|---|
| 성격 | WAI-ARIA 메뉴 버튼 | 비모달 팝오버 (`role="dialog"` 또는 `radiogroup`, `aria-label`) |
| 트리거 | `icon` 이 있으면 `IconButton`(`aria-label`), 없으면 보이는 글자 버튼. `aria-haspopup="menu"`, `aria-expanded`, 열렸을 때 `aria-controls` | 호출자가 그린다 (`anchorRef`) |
| 항목 | `MenuItem = {type:'item', label, icon?, onSelect?, tone?:'danger', href?, external?, disabled?} \| {type:'radio', label, checked, onSelect, disabled?} \| {type:'separator'} \| {type:'group', label}`. 역할 `menuitem`/`menuitemradio`(`aria-checked`), `href` 면 `<a>` (`external` 이면 새 탭). 비활성은 `aria-disabled` | 자유 내용 |
| 열 때 포커스 | 첫 항목 (트리거에서 ↑ 로 열면 끝 항목). ref 콜백에서 한 번만 옮긴다 | `focusOnOpen` 이면 안의 첫 포커스 가능 요소(없으면 팝오버) |
| 키보드 | ↑↓ 순환, Home·End, Enter·Space 실행, Escape 닫고 트리거로 포커스, Tab 은 닫기 | Escape 닫고 앵커로 포커스 |
| 바깥 클릭 | 바깥 pointerdown 이면 닫는다 (`useOutsidePointerDown`) | 같음 |
| 닫힐 때 포커스 | 항목 실행·Escape 는 트리거로 | 포커스가 안에 있었거나 `body` 로 갔으면 앵커로 |
| 크기·위치 | 트리거 아래 `top-full mt-2`, `align` 쪽 끝 맞춤. 너비 `min(280px, 100vw-32px)`, 최대 높이 `min(70dvh, 32rem)` 넘으면 세로 스크롤. 항목 `h-11 md:h-9`. `z-40` | `side` 아래/위, `align` 쪽 끝. `min-w-48`, `max-w-[calc(100vw-2rem)]`, `z-40` |
| 포털 | 없음 | 없음 |

## 7. 단축키 규칙

### 7.1 키 표

| 키 | 화면 | 동작 | 처리 주체·조건 |
|---|---|---|---|
| ⌘K / Ctrl+K | `/`, `/chat` | 팔레트 열기 / 닫기 | `Header`·`ChatHeader` 의 `useHotkey('mod+k', …, { allowInInputs: true })` (화면마다 하나). 팔레트가 열려 있고 스택 깊이가 1 이하면 닫고, 다른 레이어가 열려 있으면 무시, 아니면 연다. 입력창 안에서도 동작 |
| Escape | 모든 화면 | 맨 위 레이어 하나 닫기 | 오버레이 스택 (6.1). IME 조합 중 무시 |
| Escape (예외) | 뉴스 상세 `AI 질의응답` 탭의 질문 입력 | 대화상자를 닫지 않고 포커스를 그 탭 패널(`role="tabpanel"`)로 옮긴다. 입력한 글자와 대화 기록은 남는다 | `AskAiPanel` 질문 입력의 `onKeyDown`: IME 조합 중이 아니면 `preventDefault` 하고 패널로 포커스를 옮긴다. 스택은 `defaultPrevented` 인 Escape 를 넘긴다. 패널(입력창 밖)에서 누른 다음 Escape 는 맨 위 레이어(뉴스 상세)를 닫는다 |
| j / k | `/` | 다음/이전 카드로 포커스 | 공통 조건. 실제 DOM 포커스를 카드 제목 버튼(`[data-feed-card] h3 button`)으로 옮기고 `scrollIntoView({ block: 'nearest' })` |
| / | `/` | 검색창 포커스 | 공통 조건 |
| b | `/` | 포커스 카드 북마크 | 공통 조건 + 포커스 카드 있음 |
| c | `/` | 포커스 카드로 `/chat?sourceId=` | 같음 |
| t | `/` | 테마 순환 | 공통 조건 |
| Enter / Space | `/` | 포커스 카드 열기 | 이벤트 대상이 `document.body` 일 때만. 버튼·링크·입력 등에서는 가로채지 않는다. 카드 제목 버튼은 브라우저 기본 click 으로 상세를 연다 |

### 7.2 공통 조건 (단일 키)

- IME 조합 중이 아니다 (`isComposing`, `keyCode 229`).
- 대상이 입력 요소(`INPUT`, `TEXTAREA`, `SELECT`, `contentEditable`, `role="combobox"`)가 아니다.
- ⌘·Ctrl·Alt 가 눌려 있지 않다.
- 오버레이 스택이 비어 있다. 홈 화면은 `HotkeyListener` 에 `blockSingleKeys={useOverlayOpen()}` 을 넘긴다. 이 값이 true 면 j/k, /, b, c, t, Enter/Space 와 `customHotkeys` 를 모두 무시한다.
- 글자 키는 `e.key` 소문자 또는 `e.code`(`KeyJ`, `KeyK`, `KeyB`, `KeyC`, `KeyT`, `Slash`)로 판정한다. 한글 입력 상태에서도 동작한다.
- 목록(페이지·필터·정렬)이 바뀌면 포커스 카드 번호를 -1 로 되돌린다.

### 7.3 구현 위치

| 모듈 | 쓰는 곳 | 규칙 |
|---|---|---|
| `frontend/src/components/HotkeyListener.tsx` | `/` 의 단일 키 | props: `onNavigateFeed`, `onOpenDetailModal`, `onHandoverChat`, `onToggleBookmark`, `onFocusSearch`, `onToggleTheme`, `onCloseOverlays`, `onToggleCommandPalette`, `customHotkeys`, `enabled`, `blockSingleKeys`. 홈 화면은 `onCloseOverlays`, `onToggleCommandPalette` 를 넘기지 않는다 (Escape 는 스택, ⌘K 는 `Header`) |
| `frontend/src/hooks/useHotkey.ts` | 조합키 (⌘K) | 표기 `mod+k`, `ctrl+shift+p`, `alt+/`. `mod` 는 ⌘ 또는 Ctrl. `meta`·`ctrl`·`alt` 는 적은 것만 눌려 있어야 하고, `shift` 는 적었을 때만 확인한다. `e.key` 또는 `e.code` 로 맞춘다. IME 조합 중 무시, 기본으로 입력창 안에서는 무시(`allowInInputs`), 맞으면 `preventDefault` |

새 단축키를 더할 때: 단일 키는 위 공통 조건을 지키고, 조합키는 `useHotkey` 로 화면마다 처리 주체를 하나만 둔다. 오버레이가 열려 있을 때 동작해야 하는 키는 Escape 뿐이다.

## 8. 하지 말 것

| 하지 말 것 | 대신 |
|---|---|
| hex 색 클래스(`bg-[#0d1117]`), Tailwind 팔레트 색(`text-slate-500`, `bg-white`, `border-blue-600` …) | 2절 토큰 유틸리티 |
| `dark:` 로 색 지정 | 토큰이 테마를 따른다. `dark:` 는 색이 아닌 차이에만 |
| `globals.css` 의 `!important`, `html:not(.dark) …`·`html.dark …` 덮어쓰기 | 토큰 값 자체를 `:root`·`.dark` 에서 바꾼다 |
| 정의되지 않은 애니메이션 클래스(`animate-in`, `zoom-in-*`, `slide-in-from-*`), `motion-safe:` 없는 들어오는 애니메이션 | 4.7절 `motion-safe:animate-*` |
| 대문자 영문 라벨(`uppercase tracking-*`), 라벨·배지에 고정폭 글꼴 | 문장형 라벨, `font-sans` |
| 임의 글자 크기(`text-[11px]`), 12px 미만 글자 | 4.2절 스케일 |
| 정해지지 않은 그림자(`shadow-lg` 등), 정해지지 않은 z-index(`z-[9999]`) | `shadow-card`·`shadow-overlay`, 4.6절 값 |
| 브라우저 기본 대화상자(`window.confirm`, `alert`) | `ConfirmDialog`, `InlineAlert`, 토스트 |
| 컴포넌트별 Escape 리스너, 직접 만든 포커스 가두기 | 오버레이 스택과 `Dialog`·`Popover`·`MenuButton` |
| `window.innerWidth` 로 너비 판정, 정의되지 않은 `xs:` | `useMediaQuery`, 4.8절 브레이크포인트 |
| viewport 의 `maximumScale`, `userScalable: false` | 확대를 허용한다 |
| 부품 `className` 으로 색 덮어쓰기, `hidden` 주기 | 5.3절 |
| `overflow-x-auto` 로 직접 만든 칩·탭 줄, 넘침과 상관없는 상시 흐림 마스크, 줄마다 따로 그린 넘침 표시 | `ChipGroup scrollable`, `ScrollRow` (5.1·5.3절) |
| 웹 글꼴·외부 CDN·UI 컴포넌트 킷 | 시스템 글꼴, `components/ui/` |

## 9. 검사 방법

| 검사 | 위치 | 언제 | 보는 것 |
|---|---|---|---|
| `TokenGuard` | `frontend/src/tests/design/TokenGuard.test.ts` | `make check` (vitest) | `src/**/*.tsx`(테스트 파일 포함)에 hex 색 클래스(`-\[#[0-9a-fA-F]{3,8}\]`), 팔레트 색 유틸리티(접두 변형 포함, `bg\|text\|border\|ring\|ring-offset\|outline\|divide\|from\|via\|to\|fill\|stroke\|placeholder\|decoration\|caret\|accent\|shadow` × 팔레트 22색 + `white`·`black`), `animate-in`·`zoom-in`·`slide-in-from` 이 0개. `globals.css` 에 `!important`·`html:not(.dark)`·`html.dark` 가 0개 |
| `TokenContrast` | `frontend/src/tests/design/TokenContrast.test.ts` | `make check` | `globals.css` 의 `:root`·`.dark` 블록 값을 읽어 2절 조합을 WCAG 공식으로 계산. 글자 4.5:1, `border-strong` 3:1, 포커스 링(`accent`) 3:1 을 canvas·surface·surface-muted 모두에서 |
| `IconGuard` | `frontend/src/tests/ui/IconGuard.test.ts` | `make check` | `src/components/**`·`src/app/**` 의 `.ts`·`.tsx` 파일 글자에서 그림 이모지(`/\p{Emoji_Presentation}\|\p{Extended_Pictographic}\u{FE0F}/gu`)가 0개. 판정식이 그림 이모지는 잡고 텍스트 표현 기호(`©`·`®`·`↔`·`➔`·`✓`)는 잡지 않는지도 확인한다. 허용 목록은 없다. 실패하면 `파일:줄 글자(U+XXXX)` 목록을 낸다 |
| 부품 단위 테스트 | `frontend/src/tests/ui/` (`ChipGroup`, `ConfirmDialog`, `Dialog`, `OverlayStack`, `Menu`, `Tabs`, `FormControls`, `Primitives`, `Toast`, `useCopyToClipboard`) | `make check` | 역할·이름·포커스·키보드 패턴, 겹친 대화상자 Escape, `busy` 중 Escape 무시, 같은 렌더에서 열린 부모·자식의 스택 순서, 스크롤 줄 `data-overflow` 네 상태·흐림·스크롤 버튼과 그 포커스 유지·넘친 쪽마다 넘침 표시와 보이지 않는 자리·상태별 `bleed` 클래스·`scroll-px-6`·선택 항목 보이기(`selectedSelector`, 스냅 위치 고르기), `Badge shrink` 클래스, `aria-controls` 대상, 알림 영역 고르기와 한 번만 알림, 라벨 표 |
| 단축키 | `frontend/src/tests/HotkeyGating.test.tsx`, `HotkeyListener.test.tsx` | `make check` | 레이어가 열리면 단일 키 무시, 버튼 위 Enter·Space 를 막지 않음, `e.code` 판정 |
| lint·타입 | `pnpm lint`, `pnpm exec tsc --noEmit` | `make check` | eslint 설정 완화·파일 단위 `eslint-disable` 없이 통과 |
| 폭별 화면 검증 | `frontend/scripts/ui-audit.mjs` | 수동 (`make check` 에 없음) | 아래 |

jsdom 은 레이아웃을 계산하지 않으므로 크기·위치·넘침·가림은 vitest 가 아니라 `ui-audit` 로 잰다.

### 9.1 `ui-audit` 실행

`ui-audit` 는 실행 중인 앱과 로컬 Chrome(`CHROME_PATH`, 없으면 흔한 설치 경로)을 쓴다. devDependency `puppeteer-core` 만 쓴다.

- 프로덕션 빌드에서만 돌린다: `make docker-up`(standalone 이미지, 기본 `http://localhost:3001`) 또는 `cd frontend && pnpm build && pnpm start -p <포트>`. 개발 서버(`pnpm dev`)는 Next.js 개발 표시기(`nextjs-portal`)가 화면 요소를 가리고 늘려 판정이 틀어지므로, 페이지에 `nextjs-portal` 이 있으면 환경 오류로 종료 2 다.
- 수집된 기사·브리핑·레이더 데이터가 있어야 카드·뉴스 상세·일일 브리핑·레이더 상태를 잰다.
- 판정 자체를 바꿨으면 먼저 `--self-test` 를 통과시킨다 (9.4절).

```bash
cd frontend
node scripts/ui-audit.mjs --self-test                    # 판정 자체 검증 (앱 불필요, Chrome 필요)
node scripts/ui-audit.mjs                                # 전체 (프로덕션 빌드 앱)
node scripts/ui-audit.mjs --base http://localhost:3101 --commit "$(git rev-parse HEAD)"
node scripts/ui-audit.mjs --routes feed --themes dark --viewports 390x844 --skip-dialogs
```

| 옵션 | 기본 |
|---|---|
| `--base <url>` | `http://localhost:3001` |
| `--out <dir>` | 스크립트의 `DEFAULT_OUT` |
| `--commit <sha>` | `git rev-parse HEAD` (`report.json` 의 `environment.commit`) |
| `--screenshots key\|all\|none` | `key`: `/`·`/chat` × 5개 폭 × light·dark 20장 + 뉴스 상세·일일 브리핑 × 390x844·1440x900 × light 4장. `all` 은 대화상자·추가 상태까지 모든 조합 |
| `--routes`, `--themes`, `--viewports` | `feed,chat` × `light,dark` × `360x780,390x844,768x1024,1024x768,1440x900` |
| `--skip-dialogs`, `--timeout <ms>` (15000), `--headful` | — |
| `--self-test` | 앱 없이 fixture 로 판정을 검증한다. 1440 폭과 360 폭 두 번 연다 (9.4절) |

측정 상태: 경로·테마·폭 조합마다 기본 화면, `/` 의 대화상자 9개(뉴스 상세 — `AI 요약` 탭과 `AI 질의응답` 탭 둘 다, 일일 브리핑, 일일 브리핑 위 연동 설정(겹침), 공유 & 알림, 스케줄, MCP, 소스 & 리서처, 커맨드 팔레트, 초기화 확인 창), `/` 레이더 펼침, `/chat?sourceId={첫 기사 id}`(맥락 줄 기사 칩), `/chat?sourceId=999999999`(없는 기사 → 경고 알림), `/chat` 포커스 필터 열림(포커스 캡슐 `지식 검색 포커스 필터 설정 열기…` 로 연 대화상자. 상태별 검사·R7 대화상자 속성과 `focusLabels`·`terms`·`pictograph` 를 돈다). 5개 폭 × 2테마에서 모두 160조합이다.

결과는 `report.json` 과 PNG 다. `report.json` 에는 `environment: { devIndicator, base, chrome, commit }` 와 조합마다 아래 측정·`checks.<검사 이름>`(`pass`, `targets`, `failures[]` — 요소 경로·이름·rect·이유)이 남는다. 종료 코드 0 통과, 1 실패 하나 이상, 2 사용법·환경 오류(개발 표시기 포함). 데이터가 없어 잴 수 없는 항목(첫 화면 카드, 뉴스 상세, 일일 브리핑, 레이더, 카드 진입점 등)은 `skipped` 에 남고 실패로 치지 않는다. 브리핑이 없으면 일일 브리핑 상태의 `briefing`·`pictograph` 는 대화상자째 `skipped` 다. `skipped` 는 미검증이다. 반면 `rowAlign`·`vRhythm`·`chatAlign`·`toast`·`feedAreas`·`chatHeader`·`cardFooter` 는 대상이 없으면 '대상 없음' 실패다.

### 9.2 화면 규칙 측정 (`report.json` 키 R3~R9)

| 측정 | 판정 |
|---|---|
| R3 가로 넘침 | `document.documentElement.scrollWidth <= innerWidth` |
| R4 헤더 한 줄 | 대화상자 밖 첫 `<header>` 높이 ≤64px, 그리고 직계 자식들의 세로 구간이 한 점에서 겹친다 (`max(top) < min(bottom)`). `items-center` 행에서 높이가 다른 자식은 `offsetTop` 이 달라도 한 줄이다. 자식이 하나뿐인 감싸개는 안으로 내려가서 판정한다. `offsetTop` 값도 결과에 남긴다 |
| R5 첫 화면 카드 | 390x844 에서 첫 `[data-feed-card] h3` 이 화면 안, 1440x900 에서 첫 줄 카드 전체가 화면 안 |
| R6 터치 영역 | 768 미만에서 4.8절 주요 조작 요소가 44×44 이상 (서브픽셀 반올림으로 0.5px 허용, 43.5 이상 통과). 마크다운 본문 링크 제외 |
| R7 대화상자 | `/` 에서 위 대화상자 상태를 하나씩 열어 `role`(초기화 확인 창은 `alertdialog`), `aria-modal`, `aria-labelledby`/`aria-label`, Escape 한 번에 맨 위만 닫힘 |
| R8 확대 허용 | viewport 메타에 `user-scalable=no`·`maximum-scale` 없음 |
| R9 기능 위치 | 폭마다 진입점이 접근 이름으로 찾아진다 (더보기 메뉴 안 포함) |

### 9.3 판정 검사 (`checks.<이름>`)

모든 측정 상태에서 `clip`, `placeholder`, `occluded`, `scrollRow`, `ariaControls`, `keepAll` 을 돌린다. 나머지 열다섯 개는 표의 대상에서만 돈다: `/` 처음 상태는 `rowAlign`(768 이상)·`vRhythm`·`toolbarLayout`·`cardMetric`·`feedAreas`·`cardFooter`·`terms`, `/chat` 기본은 `chatAlign`(1024 이상)·`chatScope`·`terms`·`modelPicker`·`chatHeader`·`pictograph`, `/chat` 기사 칩은 `chatScope`·`terms`, 경고 알림은 `toast`·`chatScope`·`terms`, `/chat` 포커스 필터 열림은 `focusLabels`·`terms`·`pictograph`, 뉴스 상세 두 탭은 `pictograph`·`terms`, 일일 브리핑은 `pictograph`·`briefing`. `toolbarLayout` 부터의 열하나는 '규칙대로인지' 가 아니라 줄이 쓸 만한 폭인지, 표시한 숫자가 정보인지, 같은 기능이 두 번 나오는지, 화면마다 같은 말인지, 영역이 제자리에 있고 끝이 맞는지, 글자가 사라지지 않았는지를 잰다. 기준값(1px 허용 등)은 스크립트 상단 상수 `K` 에 있고, 판정을 고칠 때 느슨하게 바꾸지 않는다.

| 검사 | 대상 | 실패 조건 |
|---|---|---|
| `clip` | 보이는 조작 요소(`button`, `a[href]`, `input`, `select`, `textarea`, `role` 이 `tab`·`switch`·`menuitem`·`menuitemradio` 인 요소)와 자기 글자가 있는 요소 | ① `overflow` 가 `visible` 이 아닌 조상 상자 밖으로 1px 넘게 나감 (조상이 `data-scroll-row` 이면 가로는 `scrollRow` 가 본다. 768 이상(`K.scrollButtonMinWidth`)에서는 스크롤바가 보이는 가로 스크롤 영역도 같은 면제를 받는다. 768 미만은 오버레이 스크롤바라 스크롤 전에는 스크롤바가 보이지 않으므로 이 면제가 없다. 스크롤바가 보이는지는 CSS 로 숨겼는지 — `scrollbar-width: none` 이나 `::-webkit-scrollbar` 의 `display: none` — 로 판정한다. headless Chrome 은 모든 스크롤바를 숨겨 자리 차지로는 알 수 없다. 그래서 스크롤바를 CSS 로 숨긴 가로 스크롤 줄은 `data-scroll-row` 가 있어야 이 면제를 받는다. 말줄임·`line-clamp` 조상이 자르는 것과 폭·높이가 0 인 접힌 조상은 의도한 잘림) ② 화면 밖 (가로 스크롤 영역 안 제외) ③ 글자 넘침: 가로로 넘치는데 `text-overflow: ellipsis` 가 아님, 세로로 넘치는데 `-webkit-line-clamp` 가 없음. `sr-only`·`.markdown-viewer` 안 코드·표는 뺀다 ④ 스크롤 영역 상자의 잘림: 조상을 거슬러 오르다 어떤 축의 스크롤 영역(`overflow-x`/`overflow-y` 가 `auto`·`scroll`)을 지나면, 그 축에서는 요소 rect 대신 그 스크롤 영역의 rect 를 더 바깥 조상의 패딩 상자와 계속 비교한다. 바깥 조상이 그 축에서 `visible` 도 스크롤 영역도 아닌데 스크롤 영역이 1px 넘게 나가면 실패 `스크롤 영역이 부모 상자 밖으로 세로 잘림`/`… 가로 잘림` 이다 (바깥 조상이 같은 축 스크롤 영역이면 비교하지 않고 기준을 그 영역으로 바꾼다). 실패는 스크롤 영역 요소에 한 번만 남긴다. `data-scroll-row` 줄의 가로 비교는 ① 의 면제를 따른다. 대표 원인은 flex 열 안 중간 감싸개에 `min-h-0`(가로는 `min-w-0`)이 없어 스크롤 영역이 내용만큼 커지고 바깥 `overflow: hidden` 상자에 잘려 아래 내용에 닿을 수 없는 것이다 |
| `placeholder` | 값이 빈 한 줄 `input`·`textarea` 의 자리표시 | canvas `measureText`(계산된 `font`)로 잰 너비 > 내용 폭(`clientWidth − 좌우 padding`) + 1 |
| `occluded` | 보이는 범위(화면 ∩ clip 조상) 안에 다 들어온 조작 요소. 열린 대화상자가 있으면 맨 위 대화상자 안만 | 가운데와 네 모서리 안쪽 4px 다섯 점의 `elementFromPoint` 가 그 요소·자손·조상이 아님. 알림 영역(`data-toast-region`)과 입력 안쪽 여백에 놓인 보조 버튼은 가림으로 치지 않는다 |
| `scrollRow` | `[data-scroll-row]` 와 가로 스크롤하는 `role="group"` | 넘치는데(`scrollWidth > clientWidth + 1`) `data-overflow` 가 없거나 `none` 이거나 실제 스크롤 위치와 다름, 넘치지 않는데 `data-overflow` 가 `none` 이 아님 또는 `mask-image` 가 있음, 768 이상에서 넘친 쪽 스크롤 버튼(줄 밖, `{줄 이름} 이전/다음 항목 보기`)이 안 보임, 1440 에서 `카테고리`·`소스` 그룹이 넘침. 모든 폭: 줄의 계산된 `scroll-padding-left`·`scroll-padding-right` 가 24px(상수 `K.maskWidth`, 흐림 폭과 같음)가 아님, 처음 상태에서 선택 칩이 줄 보이는 상자(패딩 상자)에서 넘친 쪽 흐림 24px 를 뺀 범위 밖으로 1px 넘게 나감. 선택 칩은 줄의 `data-selected-selector` 로 찾고, 속성이 없으면 소스 칩(`[data-source-chip][aria-pressed="true"]`) → 선택 탭(`[role="tab"][aria-selected="true"]`) → `[aria-pressed="true"]` 순으로 고른다. 768 미만: 넘친 쪽마다 같은 감싸개 안에 그쪽 표시(`[data-overflow-hint="start"]` 는 줄 왼쪽 끝보다 왼쪽, `"end"` 는 오른쪽 끝보다 오른쪽)가 보이지 않음, 넘치지 않은 쪽에 표시가 있음(`data-overflow-slot` 은 표시가 아니다), 표시 rect 가 줄 rect 와 1px 넘게 겹침. 피드 툴바 Must-Read 증거: 처음 상태에서 `소스` 그룹이 든 `[data-feed-toolbar]` 마다 `checks.scrollRow.toolbar = { viewport, mustReadVisible, mustReadRect }` 를 남긴다. `mustReadVisible` 은 `[data-must-read-toggle]` 가 정확히 하나이고, `소스` 그룹(`[role="group"][aria-label="소스"]`) 안이 아니며, 보이고, rect 가 화면과 툴바 상자 안에 1px 허용으로 다 들고, 가운데 점의 `elementFromPoint` 가 토글이나 자손이고, 768 미만이면 rect 가 44×44 이상(`K.touchMin`)일 때 true 다. false 면 실패 `Must-Read 토글이 첫 화면에 다 보이지 않음 (<이유>)` |
| `ariaControls` | `[aria-controls]` | 가리키는 id 중 하나라도 문서에 없음 |
| `keepAll` | `.markdown-viewer`·코드 밖, 한글이 있고 두 줄 이상으로 그려진 글자 (`Range.getClientRects()` 줄 수) | 부모 요소의 계산된 `word-break` 가 `keep-all` 이 아님 |
| `rowAlign` | `/`, 768 이상의 `[data-feed-card]` | top 이 2px 안인 카드를 한 줄로 묶어, 줄 안 `h3` top 차 > 1px, 카드 높이 차 > 1px, 또는 머리줄 `[data-card-meta]` 의 자식이 한 줄에 놓이지 않음 |
| `vRhythm` | `/` 의 `[data-insights-bar]`, `[data-feed-search]`, `[data-feed-toolbar]`(안의 `[data-toolbar-row]`), `[data-feed-list-header]` (각각 앞 영역 뒤 DOM 순서의 첫 요소) | 요약 바 → 검색 영역, 검색 영역 → 필터 영역 첫 칩 줄, 필터 영역 마지막 칩 줄 → 목록 머리줄 세 간격 중 하나라도 12~16px 밖 (0.5px 허용). 넷 중 하나라도 없으면 '대상 없음' 실패. 기록 `checks.vRhythm.gaps` |
| `chatAlign` | `/chat`, 1024 이상 | 사이드바 머리 영역 아래 경계와 맥락 줄 아래 경계 차 > 1px, 맥락 줄 첫 조작 요소(칠해진 위젯 상자 안이면 그 상자)·메시지 열·입력 영역의 왼쪽 끝 차 > 1px. 위젯 상자(`group`·`radiogroup`·`tablist`·`toolbar`)가 '칠해졌다' 는 것은 배경색 알파가 0 보다 크거나, 왼쪽 테두리나 그림자가 있는 것이다. 배경색 알파는 표기와 상관없이 읽는다: `transparent`, `/` 뒤 값(`rgb(… / 0)`, `color(srgb … / 0)`, `oklab(… / 0)`, `oklch(… / 0%)` 등), 쉼표 표기의 넷째 값(`rgba(…, 0)`), 16진 표기의 알파 자리(`#rrggbb00`, `#rgb0`). 알파 자리가 없는 표기는 1, 읽지 못하는 표기는 칠한 것으로 본다 |
| `toast` | `/chat?sourceId=999999999` 의 알림 | 알림 아래 끝 > 입력 영역 위 끝 + 1, 간격 > 16px, 또는 768 이상에서 메시지 열 좌우 밖 |
| `toolbarLayout` | `/` 처음 상태의 `소스` 그룹이 든 `[data-feed-toolbar]`, 768 미만 | 소스 줄(`[role="group"][aria-label="소스"]`) rect 를 화면 `[0, innerWidth]` 로 자른 폭 < `innerWidth − 16 − 8 − 44 − 16 − 1`(페이지 여백, 토글 간격, 토글 폭, 오른쪽 넘침 표시 자리), 줄 보이는 상자에서 넘친 쪽 흐림 24px 를 뺀 범위 안에 다 드는 소스 칩(`[data-source-chip]`, 없으면 그룹 안 `button`) < 2개, `[data-must-read-toggle]` 이 없음, 토글 세로 가운데가 소스 줄 top~bottom 밖(다른 줄), 토글 오른쪽 끝 ≠ 콘텐츠 오른쪽 끝(필터 영역 부모 rect − 오른쪽 padding, 1px 허용), 또는 필터 영역 안에 `select`·`input[type="search"]` 가 있음. 기록 `checks.toolbarLayout.source = { viewport, visibleWidth, minWidth, fullyVisibleChips, toggleTop, toggleRight, contentRight, sourceTop, sourceBottom }`. 768 이상은 판정하지 않고 줄마다 `{ label, viewport, rowWidth, fullyVisibleChips }` 를 `rows` 에 남긴다 |
| `cardMetric` | `/` 처음 상태의 보이는 `[data-feed-card]` 전부 | 카드 소스는 `data-source`, 없으면 머리줄 둘째 조각을 스크립트 상수 `EXPECT7.sourceLabels`(`lib/labels.ts` 의 `SOURCE_LABELS` 와 같은 값)로 거꾸로 찾는다. 통계는 `[data-card-stat]`(라벨은 안쪽 `sr-only` 글자), 없으면 `sr-only` 글자가 통계 라벨인 요소. 실패: ① 종류 없는 `점수` 라벨 ② `github`·`hackernews`·`reddit` 밖 소스에 점수 통계(`점수`·`스타`·`포인트`·`추천`) ③ `github` 점수가 `스타`, `hackernews` 가 `포인트`, `reddit` 가 `추천` 이 아님 ④ `github` 개수 통계가 `포크` 가 아님 ⑤ `github`·`hackernews`·`reddit` 밖 소스에 인기 점수 통계(`[data-card-stat="hotness"]`, 없으면 `sr-only` `인기 점수` 의 부모). 기록 `checks.cardMetric.summary = { cards, bySource: { <소스>: { cards, scoreShown, hotnessShown } } }` |
| `chatScope` | `/chat` 기본·기사 칩·경고 알림 상태의 그룹 `검색 스코프 모드` | 두 버튼 중 하나라도 화면 밖(1px 허용)이거나 맥락 줄 스크롤 줄(`[data-chat-context-bar] [data-scroll-row]`) 보이는 상자에서 넘친 쪽 흐림 24px 를 뺀 범위 밖. 기본·경고 알림 상태(기사 칩 없음)에서 그 줄의 `data-overflow` 가 `none` 이 아님 |
| `terms` | `/chat` 모든 측정 상태 (포커스 필터 열림 포함), `/` 처음 상태, 뉴스 상세 두 탭 | 보이는 요소의 자기 텍스트 노드를 이어 다듬은 글자가 `Scoped`·`Global` 과 같음, `(Scoped)`·`(Global)` 포함, `Focus:` 로 시작, 또는 `코퍼스` 포함. 그룹 `검색 스코프 모드` 의 둘째 버튼 접근 이름이 `전체 소식` 이 아님. 보이는 조작 요소(`button`, `a`, `[role="tab"]`, `sr-only` 크기 제외)의 접근 이름이나 글자에 금지 용어(스크립트 상수 `EXPECT9.bannedTerms`: `Ask AI` 와 옛 이관 용어 둘)가 있음. 사용자 글(`title` 이 글자와 같은 요소와 그 안, `.markdown-viewer`, 입력, `role="log"`·`[data-chat-messages]` 안)은 뺀다 |
| `modelPicker` | `/chat` 기본 | 보이는(숨김·`sr-only` 크기 제외) `aria-label` 이 `Claude 모델 선택` 으로 시작하는 버튼이 정확히 1개가 아님, 또는 그 버튼 top < DOM 에서 그 앞의 질문 입력창(`textarea`, 접근 이름 `질문 입력…`) bottom − 1 |
| `focusLabels` | `/chat` 포커스 필터 열림의 그룹 `도메인 카테고리` | 칩 글자 목록이 스크립트 상수 `['전체 소식', '하네스 & 벤치마크', 'MCP & 생태계', '에이전트 아키텍처', '최신 AI 동향']` 과 다름 |
| `feedAreas` | `/` 처음 상태, `[data-feed-toolbar]` 의 부모(콘텐츠 상자 = rect − 좌우 padding)마다 | ① `[data-feed-search]`·`[data-feed-list-header]` 가 정확히 1개가 아님, 검색 입력(이름 `키워드 검색`)이 없거나 `[data-feed-search]` 밖, `[data-feed-toolbar]` 안에 `input[type="search"]`·`select` 가 있음, 정렬(`select`, 이름 `정렬`)이 없거나 `[data-feed-list-header]` 밖 ② 순서: 검색 영역 bottom > 필터 영역 첫 칩 줄 top + 1, 또는 마지막 칩 줄 bottom > 목록 머리줄 top + 1 ③ 겹침: 검색 입력 세로 범위가 필터 영역의 칩 그룹(`[role="group"]`) 세로 범위와 1px 넘게 겹침 ④ 높이: 검색 입력·정렬 높이 ≠ 44(768 미만)/36(이상) ±0.5, `Must-Read` 토글 높이 ≠ 같은 줄 소스 칩 높이 ±0.5 ⑤ 끝 맞춤(±1px): 검색 입력 왼쪽·오른쪽 끝, 목록 머리줄 왼쪽 끝, 정렬 오른쪽 끝, 토글 오른쪽 끝이 콘텐츠 상자 끝과 다름. 768 이상은 카테고리 그룹 왼쪽 끝도 ⑥ 한 줄: 목록 머리줄 높이 > 정렬 높이 + 1. 기록 `checks.feedAreas.layout = { viewport, content, search, sort, toggle, header }` |
| `chatHeader` | `/chat` 기본의 `header` | 보이는 `a[href]`·`button` 중 DOM 첫 요소가 이름 `피드로 돌아가기` 링크가 아님, 그 링크가 없음, 또는 그 링크 왼쪽 끝이 다른 보이는 조작 요소 왼쪽 끝보다 1px 넘게 오른쪽 |
| `pictograph` | `/chat` 기본, 포커스 필터 열림, 뉴스 상세 두 탭, 일일 브리핑의 보이는 `button`, `a`, `[role="tab"]`, `[role="menuitem"]`, `[role="radio"]`, `label`, `h1`~`h3` | 다듬은 글자가 `IconGuard` 와 같은 식 `/\p{Emoji_Presentation}\|\p{Extended_Pictographic}\u{FE0F}/u` 에 걸림. `.markdown-viewer` 안, `a[target="_blank"]` 안(외부 기사 제목), `title` 이 글자와 같은 요소(사용자 글)는 뺀다. 텍스트 표현 기호(`©`·`↔` 등)는 걸리지 않는다 |
| `briefing` | 일일 브리핑 대화상자 | ① 보이는 `button` 중 접근 이름에 `설정` 이 있고 `[role="alert"]`·`[role="status"]` 밖인 것이 1개가 아님 ② 대화상자 설명(`aria-describedby` 대상)과 같은 글자를 가진 다른 보이는 요소가 있음 ③ `카테고리별 요약` 탭 패널의 `h3`(고정 머리글 `오늘의 핵심 요약`·`오늘의 추천 Action Items` 와 `aria-hidden` 아이콘 제외) 글자가 긴 라벨 4개(`하네스 & 벤치마크`, `MCP & 생태계`, `에이전트 아키텍처`, `최신 AI 동향`) 밖. 기록 `checks.briefing.categoryHeadings` |
| `cardFooter` | `/` 처음 상태의 보이는 `[data-feed-card]` (접근 이름이 `/챗에서 분석/` 인 버튼이 있는 카드) | 그 버튼의 보이는 글자(조상이 모두 보이고 `sr-only` 가 아닌 글자 노드)에 `AI 챗에서 분석` 이 없음, 버튼 묶음(그 버튼의 부모) rect 가 카드 안쪽 상자(카드 rect − padding) 밖으로 1px 넘게 나감, 또는 통계 묶음(`[data-card-stat]` 의 부모)과 버튼 묶음 rect 가 가로·세로 모두 1px 넘게 겹침. 대상 카드가 없으면 '대상 없음' 실패 |

측정 훅 속성: 앱이 `ui-audit` 와 테스트가 찾는 자리에 다는 `data-*` 속성이다. 이름을 바꾸거나 지우면 해당 검사가 '대상 없음'으로 실패하거나 테스트가 깨진다.

| 속성 | 다는 곳 | 쓰는 검사·테스트 |
|---|---|---|
| `data-scroll-row`, `data-overflow` | `ScrollRow` 스크롤 줄 | `scrollRow`, `clip`(가로 면제), `ChipGroup`·`Tabs`·`FeedToolbar`·`AskAiPanel` 테스트 |
| `data-overflow-hint="start\|end"` | `ScrollRow` 768 미만 넘침 표시 (왼쪽 `‹`·오른쪽 `›`) | `scrollRow`(768 미만 표시), `ChipGroup`·`Tabs`·`FeedToolbar` 테스트 |
| `data-overflow-slot="start\|end"` | `ScrollRow` 768 미만에서 `bleed` 없는 쪽의 보이지 않는 표시 자리 | `ChipGroup` 테스트 (`scrollRow` 는 표시로 세지 않는다) |
| `data-selected-selector` | `ScrollRow` 스크롤 줄 (받은 `selectedSelector`) | `scrollRow`(선택 칩 찾기), `ChipGroup` 테스트 |
| `data-source-chip` | 피드 소스 줄의 `전체`·소스·`북마크` 칩 | 소스 줄 `selectedSelector`, `scrollRow`(속성이 없을 때 선택 칩 대체 규칙), `toolbarLayout`(다 보이는 칩 세기), `ChipGroup` 테스트 |
| `data-must-read-toggle` | 피드 필터 영역의 `Must-Read` 토글 (소스 줄 밖, 같은 줄 오른쪽 끝) | `scrollRow`(필터 영역 `mustReadVisible`), `toolbarLayout`, `feedAreas`, `FeedToolbar` 테스트 |
| `data-chip-icon` | `Chip` 아이콘 감싸개 | `ChipGroup`·`FeedToolbar` 테스트 |
| `data-feed-card` | `NewsCard` 카드 | R5, `rowAlign`, `cardMetric`, j/k 카드 이동 (`page.tsx`) |
| `data-source` | `NewsCard` 카드 (기사 `source` 값) | `cardMetric`, `NewsCard` 테스트 |
| `data-card-stat="score\|count\|hotness"`, `data-metric` | `NewsCard` 바닥 통계 (`data-metric` 은 `stars`·`points`·`upvotes`·`forks`·`comments`, 인기에는 없음) | `cardMetric`, `NewsCard` 테스트 |
| `data-card-meta` | `NewsCard` 머리줄 | `rowAlign`, `cardMetric`(`data-source` 가 없을 때 소스 찾기), `NewsCard` 테스트 |
| `data-card-badges` | `NewsCard` 배지 줄 | `NewsCard` 테스트 |
| `data-insights-bar` | 요약 바 (스켈레톤 포함) | `vRhythm` |
| `data-feed-search` | 피드 검색 영역 (`FeedToolbar` 의 첫 형제) | `feedAreas`, `vRhythm`, `/` 단축키 스크롤 (`page.tsx`), `FeedToolbar` 테스트 |
| `data-feed-toolbar`, `data-toolbar-row` | 피드 필터 영역과 그 줄 | `vRhythm`, `scrollRow`(Must-Read 증거는 `data-feed-toolbar` 마다), `toolbarLayout`, `feedAreas`(콘텐츠 상자 = 그 부모), `FeedToolbar` 테스트 |
| `data-feed-list-header` | 피드 목록 머리줄 (`FeedStatusBar` 바깥, 상태 + 정렬) | `feedAreas`, `vRhythm`, `FeedStatusBar` 테스트 |
| `data-feed-status` | 목록 머리줄 안 상태 (`role="status"`) | `FeedStatusBar` 테스트 |
| `data-tier-icon="<티어>"` | `TierIcon` 이 그린 모델 티어 lucide 아이콘 (`ModelTierBadge`, `ChatModelSelector`) | `ChatModelSelector` 테스트 |
| `data-chat-sidebar-head` | 챗 사이드바 머리 영역 | `chatAlign` |
| `data-chat-context-bar` | 챗 맥락 줄 | `chatAlign`, `chatScope` |
| `data-chat-column` | 챗 메시지 열 | `chatAlign`, `toast` |
| `data-composer` | 챗 입력 영역 안쪽 열 | `chatAlign`, `toast` |
| `data-toast-region` | `ToastRegion` 영역 (`global`/`composer`) | `toast`, `occluded`(면제), `Toast` 테스트 |

### 9.4 자체 검증 (`--self-test`)

`--self-test` 는 앱 없이 `frontend/scripts/ui-audit-fixtures/` 의 HTML 을 `page.setContent` 로 열어 판정 자체를 확인한다. fixture 는 `frontend/src/**` 밖이라 앱 번들·`TokenGuard` 대상이 아니다.

- 폭: fixture 를 1440x6000 으로 한 번 열어 `[data-self-test-narrow]` 영역을 뺀 나머지에 21개 검사 가운데 `toolbarLayout`·`chatScope` 를 뺀 19개와 R3 을 돌리고, 360x6000 으로 한 번 더 열어 `[data-self-test-narrow]`·`[data-self-test-both]` 영역 안만 `clip`·`scrollRow`·`occluded` 를, `[data-self-test-narrow]` 영역 안만 `toolbarLayout`·`chatScope`·`feedAreas` 를 돌린다 (768 미만 넘침 표시 판정, 768 미만 `clip` ①, 768 미만 필터 영역 배치·세 영역 44px 판과 360 모드 탭 판정은 좁은 폭에서만 돈다. `feedAreas` 는 1440 에서는 그 영역 밖을 잰다). fixture 의 `role="dialog"` 는 `data-self-test-dialog` 로 '맨 위 대화상자' 판정에서 뺀다. 자체 검증의 `chatScope` 는 기본 상태(기사 칩 없음)로 판정한다. `[data-self-test-both]` 영역은 1440 에서도 잰다. `data-expect` 는 어느 폭에서든 잡히면 맞지만, `[data-self-test-both]` 안의 `data-expect` 는 그 검사를 돈 두 폭 모두에서 잡혀야 맞다. `data-expect-reason` 이 있으면 그 검사의 실패 이유에 그 글자가 들어 있어야 맞다 (다른 이유의 실패로 덮이지 않게). `clean.html` 은 두 폭 모두 대상이 있고 실패 0 이어야 한다. `defects.html` 에는 21개 검사마다 `data-expect` 표시가 하나 이상 있어야 한다. 1440 에서 `카테고리`·`소스` 줄 규칙(1440 에서 넘치면 실패)이 함께 걸리지 않도록 fixture 줄 이름은 `소스` 를 피한다. 툴바 Must-Read 증거는 `소스` 그룹이 있어야 돌므로 그 fixture 만 `소스` 이름을 쓴다: 고친 형태는 넘치지 않는 폭으로 두고, 결함 형태는 `data-expect-reason` 으로 Must-Read 판정의 실패만 맞게 센다.

| fixture | 맞는 결과 |
|---|---|
| `defects.html` | 검사마다 고정 결함이 있고 `data-expect="<검사 이름>"` 으로 표시돼 있다 (한 요소에 여러 검사면 공백으로 나눈다). 표시된 모든 요소에서 그 검사가 실패해야 한다 |
| `clean.html` | 같은 구조의 고친 형태. 모든 검사가 대상이 있고 통과해야 한다 |
| `dev-indicator.html` | `nextjs-portal` 이 있어 개발 서버 환경 오류로 판정해야 한다 |

셋 다 맞으면 종료 0, 하나라도 틀리면 1. `defects.html` 의 고정 결함과 `clean.html` 의 고친 형태 가운데 스크롤 줄·잘림·칠한 위젯, 피드 세 영역·카드 지표·카드 바닥, 챗 헤더·용어·그림 이모지, 일일 브리핑 관련 짝:

| 결함 (`data-expect`) | `defects.html` | `clean.html` |
|---|---|---|
| 세로로 잘린 스크롤 영역 (`clip` ④) | 높이 200px `overflow: hidden` flex 열 > 머리 40px + `min-height` 없는 중간 감싸개 > `overflow-y: auto` 스크롤 영역 > 600px 내용과 맨 아래 버튼 | 중간 감싸개에 `min-height: 0` |
| 가로로 잘린 스크롤 영역 (`clip` ④) | 폭 300px `overflow: hidden` flex > `min-width` 없는 중간 감싸개 > `data-scroll-row` 없는 `overflow-x: auto` 영역 > 칩 8개(약 600px) | 중간 감싸개에 `min-width: 0` |
| 잘린 배지 줄 (`clip` ①) | 폭 266px `flex-wrap: nowrap; overflow: hidden` 줄 > Must-Read 배지 + 긴 기술 배지 3개(`flex-shrink: 0; max-width: 128px`, 글자 감싸개에 `min-width` 없음) | 기술 배지 `flex-shrink: 1; min-width: 48px; max-width: 128px`, 글자 감싸개 `min-width: 0` |
| 알파 0 배경 감싸개 (`chatAlign`) | — (칠한 위젯 상자 결함은 기존 맥락 줄 fixture) | 맥락 줄의 칠한 `role="group"` 위젯을 알파 0 배경 감싸개 두 겹(바깥 `role="toolbar"` `color(srgb 1 1 1 / 0)`, 안쪽 `role="radiogroup"` `oklab(0 0 0 / 0)`, 각 `padding-left: 4px`)으로 싼다. 칠한 위젯 왼쪽 끝이 메시지 열·입력 영역과 맞으므로, 감싸개를 칠한 것으로 잘못 보면 실패한다 |
| 선택 칩이 줄 밖 (`scrollRow`) | `출처` 줄에서 `Must-Read` 는 보이고 선택된 소스 칩(`data-source-chip`)만 줄 밖 | 선택 소스 칩이 보이는 줄 |
| 왼쪽 표시 없는 줄 (`scrollRow`, 360) | `scrollLeft` 를 가운데에 둔 `data-overflow="both"` 줄에 오른쪽 표시만 있음 | 양쪽 표시, 표시 쪽 `bleed` 없음 |
| 줄을 덮는 표시 (`scrollRow occluded`, 360) | 표시를 `absolute` 로 줄 오른쪽 끝 위에 겹침 | 표시가 줄 뒤 형제 |
| 흐림에 겹친 선택 칩 (`scrollRow`, 360) | `scroll-padding-left: 16px`, 흐림 24px, 선택 칩이 '칩 왼쪽 − 16' 스냅 위치에 선 줄 | `scroll-padding: 0 24px`, 선택 칩이 '칩 왼쪽 − 24' 에 선 줄 |
| 스크롤바를 숨기지 않은 가로 스크롤 영역에 잘린 버튼 (`clip` ①, 360) | 폭 200px `overflow-x: auto`(스크롤바 숨김 없음, `data-scroll-row`·`role="group"` 없음) 영역 > 90px 칩 3개 | — (768 미만에는 스크롤바 면제가 없어 잘린 칩이 실패해야 한다) |
| 숨은 Must-Read (`scrollRow`, 1440·360, `data-expect-reason="Must-Read 토글"`) | `[data-feed-toolbar]`(`data-expect` 는 툴바에) 안 `소스` 줄 첫 칩으로 `data-must-read-toggle` 버튼을 두고 줄을 `scrollLeft` 138 로 민 구조. 넘친 쪽 표시·버튼·스냅 여백·선택 칩은 맞춰 이 판정만 실패한다 | 같은 필터 영역에서 토글이 `소스` 줄 밖, 같은 줄 오른쪽 끝 형제이고 44×44. 소스 줄은 넘치지 않는 폭 |
| 좁은 소스 줄 (`toolbarLayout`, 360) | `[data-feed-toolbar]` 안 한 줄에 소스 그룹(칩 6개) + 44px 토글 + 112px 선택창 | 세 영역 구조의 44px 판: 검색 영역 → 필터 영역(카테고리 줄 양쪽 `bleed`, 소스 줄 왼쪽 `bleed` + 같은 줄 오른쪽 끝 44px 토글, 선택창 없음) → 목록 머리줄(상태 + 112px 정렬, 오른쪽 끝 맞춤). `feedAreas`(360)도 이 형태로 통과해야 한다 |
| 아래 줄 토글 (`toolbarLayout`, 360, `data-expect-reason` `select`·`다른 줄`) | 필터 영역 줄이 `flex-wrap` 이고 소스 줄이 `flex-basis: 100%`·양쪽 `bleed` 로 한 줄을 다 써, 토글(`margin-left: auto`)과 112px 선택창이 아래 줄 | 위 세 영역 구조의 44px 판 |
| 칩 줄 사이 검색 (`feedAreas`, 360, `[data-feed-search]`) | `[data-feed-toolbar]` 안에 카테고리 줄 / 검색 / 소스 줄 / 토글 + 선택창 줄, 그 아래 `[data-feed-status]` | 위 세 영역 구조의 44px 판 |
| 칩 줄 안 검색·정렬 (`feedAreas`, 1440, 이유 `[data-feed-search]`·`겹침`·`검색 입력 왼쪽 끝`) | `[data-feed-toolbar]` 줄 1 `[카테고리 그룹][288px·36px 검색]`, 줄 2 `[소스 그룹][32px 토글][128px·36px 선택창]`, 그 아래 `[data-feed-status]`. 같은 구조로 칩 줄과 같은 줄의 검색(③)과 오른쪽 열 검색의 왼쪽 끝(⑤)도 따로 잡는다 | 콘텐츠 상자 안 `[data-feed-search]`(전체 폭 36px 입력) → `[data-feed-toolbar]`(카테고리 줄, 소스 줄 + 32px 토글) → `[data-feed-list-header]`(상태 + 128px·36px 선택창, 오른쪽 끝 맞춤) |
| 요약 바 아래 30px (`vRhythm`, 이유 `요약 바 → 검색 영역`) | 요약 바 → 검색 영역 30px, 나머지 두 간격은 12·14px | 세 영역 구조에서 세 간격 12px |
| RSS 합성 점수 (`cardMetric`) | `data-source="rss_kr"` 카드 바닥에 `sr-only` `점수` + `180`, `data-source="github"` 카드 개수가 `댓글` | `rss_kr` 카드에 점수 없음, `github` 카드에 `스타`·`포크`, `hackernews` 카드에 `포인트` |
| RSS 인기 점수 (`cardMetric` ⑤) | `data-source="rss_kr"` 카드 바닥에 `sr-only` `인기 점수` + `100` 만 (점수·개수 없음, ①~④ 로는 통과하고 ⑤ 로만 실패) | `github` 카드에 `sr-only` `인기 점수` + `100`(지표 소스는 통과), `rss_kr` 카드는 통계 없음 |
| 아이콘만 남은 바닥 줄 (`cardFooter`, 이유 `보이는 글자`·`카드 안쪽 상자 밖`) | 안쪽 266px 카드 둘: 이관 버튼 글자가 `sr-only`, 또 하나는 줄바꿈 없는 바닥 줄에서 버튼 묶음이 카드 밖으로 넘침 | 같은 카드, 바닥 줄 `flex-wrap`·버튼 묶음 `margin-left: auto` 로 다음 줄, 글자 `AI 챗에서 분석` 보임 |
| 넘친 모드 탭 (`chatScope`, 360) | `[data-chat-context-bar]` 스크롤 줄에 폭 약 353px 두 탭, 둘째 탭이 보이게 민 상태 | 폭 약 202px 두 탭, `data-overflow="none"` |
| 영어 용어 (`terms`) | 탭 `단일 기사 (Scoped)`, 배지 `Global`, 캡슐 `Focus: 전체 소식` | 탭 `단일 기사`·`전체 소식`, 배지 `전체 소식`, 캡슐 `포커스: 전체 소식`, `title` 이 글자와 같은 세션 제목 `Global 소식 정리`(사용자 글 면제 확인) |
| 이관 용어 (`terms`, 이유 = `EXPECT9.bannedTerms` 의 각 용어) | 금지 용어가 든 탭 이름(`Ask AI` 로 시작), 버튼 접근 이름(보이는 글자는 `챗에서 분석`), 배너 버튼 글자 | 탭 `AI 질의응답`, 버튼 `AI 챗에서 분석` |
| 기록 버튼이 앞 (`chatHeader`) | `header` 안 `[대화 기록 보기 버튼][피드로 돌아가기 링크]` | `[링크][기록 버튼]` |
| 그림 이모지 (`pictograph`) | 버튼 `💡 FastMCP…`, `h3` `🔌 MCP & 생태계`, 버튼 `⚠️ AI 응답 생성 실패`(U+FE0F 로 고른 그림 문자) | 버튼 `svg` + 글자, `.markdown-viewer` 안 `💡`, `a[target="_blank"]` 안 `🚀` 제목(둘 다 면제 확인), `h2` `AgentLens © 2026 ↔ 피드`(텍스트 표현 기호는 걸리지 않음 확인) |
| 브리핑 중복 (`briefing`, 이유 `설정 버튼`·`설명과 같은 글자`·`긴 라벨`) | `role="dialog"` 에 설정 버튼 2개(위 톱니 버튼과 바닥 버튼), 설명과 `오늘의 핵심 요약` 본문에 같은 헤드라인, 분야 `h3` `MCP & 도구·스킬 생태계` | 설정 버튼 1개 + `role="alert"` 안 `이메일 설정 열기`(면제 확인), 헤드라인 1번, 분야 `h3` 긴 라벨 |
| 두 번 나온 모델 선택 (`modelPicker`) | 헤더와 입력창 아래에 `aria-label="Claude 모델 선택: Sonnet 5.5"` 버튼 둘 | 입력창 아래 하나, 헤더에 `display: none` 인 같은 버튼 하나 (숨긴 것은 세지 않음 확인) |
| 다른 포커스 라벨 (`focusLabels`) | 그룹 `도메인 카테고리` 에 피드 카테고리 칩과 다른, 컴포넌트 안에 따로 둔 라벨 4개 | 긴 라벨 5개 (`전체 소식` 포함) |

`clean.html` 의 다른 스크롤 줄에도 `scroll-padding: 0 24px` 가 있다 (24px 판정).

## 10. 알려진 제약

### 10.1 설계와 구현이 다른 점 (이 문서는 구현을 따랐다)

| 항목 | 설계 | 구현 |
|---|---|---|
| 대화상자 제목 크기 | `text-lg` (18px) | `Dialog` 기본 머리줄 `h2` 는 `text-base` + `truncate`(한 줄). 두 줄 제목은 `header`·`labelledBy` 로 직접 그린다 (뉴스 상세) |
| 다크 `shadow-card` | `none` | `0 0 #0000` (box-shadow 목록 안에서 유효한 투명 그림자) |
| 탭 높이 | 조작 요소 md 이상 36px | `Tabs` 는 `h-11 md:h-10` (40px) |
| `MenuButton.align` 기본값 | `end` | `start` (`ThemeMenu` 는 `end`) |
| `Popover` | 포털 여부를 정하지 않음 | 포털 없이 앵커 부모 안 `absolute`. `side`·`align`·`id`·`className` 이 더 있다. 인용 팝오버는 `<p>` 안에 `div` 로 그려지고, 조상의 `overflow-hidden` 에 잘릴 수 있다. `Popover` 는 `onKeyDown`·ref 를 넘기지 않아 `ChatModelSelector` 는 감싼 요소에서 키를 받는다 |
| `Chip` 톤 | tone 없음 | `tone: 'accent'\|'warning'` 추가. 피드 `Must-Read` 토글이 `warning` |
| `InlineAlert`·`Toast` 톤 | `tone` 이름을 정하지 않음 | `info\|success\|warning\|danger`. `InlineAlert` 는 `danger` 외 `role="status"`, 토스트 `danger` 는 `aria-live="assertive"` |
| 대화상자 처음 포커스 | `initialFocusRef` → 본문 첫 요소 → 컨테이너 | 본문 첫 요소가 없으면 패널 전체의 첫 포커스 가능 요소(보통 머리줄 `닫기`)를 거쳐 컨테이너 |
| 바텀시트 md 이상 너비 | `sm` 크기 | 받은 `size` 너비 (확인 창은 `sm`) |
| `Button` `lg` | 정하지 않음 | 48px, md 이상 40px |
| 공유 & 알림 설정의 탭별 버튼 | — | 탭마다 있던 `테스트 메일 발송`·`웹훅 테스트 전송`·`설정 저장` 이 바닥 `연결 테스트`·`저장` 두 개로 합쳐졌다 |
| 추가 부품·props | 설계 표에 없음 | `CodeBlock`, `ErrorState` 의 `retryLabel`·`retrying`(`onRetry` 선택), `TextField` 의 `trailing`·`containerClassName`, `Textarea` 의 `autoResize`, `Switch` 의 `hideLabel`·`description`, `Dialog` 의 `closeLabel`·`header`·`labelledBy`·`ariaLabel`·`panelProps`·`bodyClassName` 등 |
| 대비 값 | 다크 `accent-soft-fg` / `accent-soft` 6.2 | 다시 계산하면 6.1 (기준 4.5 는 넘는다) |

### 10.2 남은 문제

| 문제 | 내용 |
|---|---|
| 팔레트 색 빌드 차단 없음 | Tailwind 기본 팔레트를 지우지 않아 빌드는 팔레트 클래스를 만든다. `TokenGuard` 는 `.tsx` 만 보므로 `.ts` 안의 클래스 문자열이나 `globals.css` 의 새 규칙은 걸리지 않는다 |
| 인라인 테마 스크립트와 CSP | 지금은 CSP 가 없다. `'unsafe-inline'` 을 금지하는 CSP 를 도입하면 `layout.tsx` 의 테마 스크립트에 nonce 가 필요하다 |
| `ui-audit` 는 수동 | 프로덕션 빌드로 띄운 앱·로컬 Chrome 이 필요해 `make check` 에 없다. 화면을 바꿨을 때 사람이 돌린다. 수집된 데이터가 없으면 첫 화면 카드·뉴스 상세·브리핑·레이더 측정이 `skipped` 로 빠지고, `rowAlign` 은 '대상 없음' 실패가 된다 |
| 전역 `code` 배경 없음 | 옛 전역 덮어쓰기를 지워 `<code>` 에는 전역 스타일이 없다. 마크다운 밖에서 `<code>` 를 쓰면 배경·테두리 클래스를 직접 준다 (`McpModal` 제목 안의 `claude_desktop_config.json` 처럼). 주지 않으면 고정폭 글자로만 보인다 |
| `HotkeyListener` 선언만 있는 필드 | `HotkeyMapping.modifiers`·`allowInInputs` 는 타입에만 있고 동작에 쓰이지 않는다. 입력 요소 판정(`isEditableTarget`)이 `HotkeyListener` 와 `useHotkey` 에 따로 있다 |
