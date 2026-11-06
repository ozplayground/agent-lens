# 기능명세: UI 공통

Updated: 2026-11-06

## 개요
화면 여러 곳에 걸치는 UI 동작을 정리한다. 뉴스 피드 화면(`/`)의 전역 헤더, 테마(라이트·다크·시스템), 전역 단축키, 커맨드 팔레트, 모달 공통 규칙, 반응형 레이아웃, 모바일 뷰포트 대응, 로딩·오류·빈 상태 표시, 마크다운 렌더링, 복사 피드백, 접근성 속성이 대상이다. 화면 구성과 컴포넌트 목록은 `../ui-spec.md` 에 있다.

- 테마 상태는 루트 레이아웃(`frontend/src/app/layout.tsx:26`)의 `ThemeProvider` 가 모든 화면에 제공한다.
- 전역 헤더(`Header`), 전역 단축키(`HotkeyListener`), 커맨드 팔레트(`CommandPalette`)는 뉴스 피드 화면(`/`)에서만 렌더된다. `/chat` 화면에는 셋 다 없고, 자체 헤더(`ChatHeader`)를 쓴다.
- UI 문구는 한국어다 (`<html lang="ko">`, `frontend/src/app/layout.tsx:24`).

## 기능 목록
| ID | 기능 | 설명 | 진입점 |
|---|---|---|---|
| UI-01 | 전역 헤더 | 브랜드, 화면 이동, 모달 열기, 수집 실행, 팔레트·테마 버튼을 담은 상단 고정 바 | `/` 상단 |
| UI-02 | 수집 진행 상태 바와 초기화 확인 창 | 헤더 아래에 수집 진행 메시지를 보여 주고, 초기화 전에 확인 창을 띄운다 | 헤더 '즉시 수집', '초기화 & 재수집', 팔레트 |
| UI-03 | 테마 시스템 | light·dark·system 세 모드, OS 설정 추종, localStorage 저장, `<html>` 클래스 적용 | 루트 레이아웃 |
| UI-04 | 테마 전환 버튼 | 한 번 누를 때마다 다음 모드로 순환하는 아이콘 버튼 | 헤더 오른쪽 끝 |
| UI-05 | 전역 단축키 | 단일 키·조합 키 단축키, 입력창 예외, IME 조합 예외 | `/` 화면 전체 (window keydown) |
| UI-06 | 피드 키보드 탐색 | j/k 로 카드 포커스를 옮기고 포커스 카드에 상세·북마크·챗 이동을 실행 | `/` 뉴스 카드 그리드 |
| UI-07 | 커맨드 팔레트 | 명령 5개를 검색·선택·실행하는 대화상자 | ⌘K / Ctrl+K, 헤더 ⌘K 버튼 |
| UI-08 | 모달·오버레이 공통 규칙 | 모달·드로어·바텀시트·팝오버의 열기/닫기, 배경, 레이어 순서 | 각 모달 |
| UI-09 | 반응형 레이아웃 | Tailwind 브레이크포인트별 배치, 요소 숨김, 가로 스크롤 방지 | 모든 화면 |
| UI-10 | 모바일 뷰포트·가상 키보드 대응 | 확대 금지, 가상 키보드 높이 추종, 입력창 스크롤 | `/chat`, 루트 레이아웃 |
| UI-11 | 로딩·오류·빈 상태 표시 | 데이터 영역별 스피너·스켈레톤, 오류 박스와 재시도, 빈 상태 안내 | 피드, 챗 기록, 모달 |
| UI-12 | 마크다운 렌더링 | GFM 마크다운을 스타일 입힌 요소로 그리고, 코드 블록에 복사 버튼을 단다 | 상세 요약, 브리핑, Ask AI, 챗 답변 |
| UI-13 | 복사 피드백 | 클립보드 복사 뒤 2초 동안 '복사됨' 표시 | 코드 블록, MCP 설정, 브리핑, Ask AI |
| UI-14 | 접근성 속성 | role, aria-* 속성, 키보드 조작 지원 범위 | 팔레트, 챗 컴포넌트 등 |

## UI-01 전역 헤더
- 진입점: 뉴스 피드 화면(`/`)의 최상단. `HomePage` 가 `Header` 를 렌더한다 (`frontend/src/app/page.tsx:123-132`).
- 입력: props `onRefresh`(필수), `onOpenSchedule`(필수), `onOpenMcp`(필수), `onOpenWebhook`(선택), `onOpenSources`(선택). 홈 화면은 다섯 개를 모두 넘긴다.
- 처리 규칙:
  1. `<header>` 는 `sticky top-0 z-40` 으로 스크롤해도 위에 붙는다 (`Header.tsx:114`).
  2. 왼쪽 브랜드 영역: 터미널 아이콘, 제목 `AgentLens`, 버전 배지 `v0.1.0`(고정 문자열), 초록 점과 `Live`(640px 이상에서만), 태그라인 `AI Agent · 하네스(Harness) · MCP 기술 큐레이션`(1024px 이상에서만) (`Header.tsx:117-134`).
  3. 오른쪽 액션 영역은 다음 순서로 놓인다 (`Header.tsx:137-233`):
     | 순서 | 표시 | 종류 | 동작 | 조건 |
     |---|---|---|---|---|
     | 1 | AI 챗 | `next/link` | `/chat` 으로 이동 | 항상 |
     | 2 | 소스 & 리서처 | 버튼 | `onOpenSources()` → 소스 모달 | `onOpenSources` 가 있을 때 |
     | 3 | MCP | 버튼 | `onOpenMcp()` → MCP 모달 | 항상 |
     | 4 | RSS | `<a target="_blank">` | `/api/news/feed/rss.xml` 를 새 탭으로 연다 | 항상 |
     | 5 | 공유 & 알림 | 버튼 | `onOpenWebhook()` → 브리핑 연동 설정 모달 | `onOpenWebhook` 가 있을 때 |
     | 6 | 다음 수집 `{h}h {m}m 후` | 버튼 | `onOpenSchedule()` → 스케줄 모달 | 640px 이상에서만 보인다 (`hidden sm:flex`) |
     | 7 | 초기화 & 재수집 | 버튼 (빨강) | 초기화 확인 창을 연다 (UI-02) | 수집 중이면 비활성 |
     | 8 | 즉시 수집 / 수집 중... | 버튼 (초록) | 수동 수집 시작 (UI-02) | 수집 중이면 비활성, 아이콘 회전 |
     | 9 | ⌘ 아이콘 + `⌘K` | 버튼 | 커맨드 팔레트를 연다 | `⌘K` 글자는 640px 이상에서만 |
     | 10 | 테마 아이콘 | 버튼 | 테마 순환 (UI-04) | 항상 |
  4. '다음 수집' 시간은 `GET /api/schedule/status` 의 `minutes_until_next_run` 으로 계산한다. 시 = `floor(분/60)`, 분 = `round(분 % 60)`. 시가 0 이면 `{m}m 후` 만 보인다 (`Header.tsx:109-111`, `:192`).
  5. 스케줄 상태는 마운트할 때 한 번, 그 뒤 30,000ms 마다 다시 읽는다. 실패는 조용히 무시한다 (`Header.tsx:38-49`).
  6. 헤더는 자체 keydown 리스너로 ⌘K / Ctrl+K 를 받아 팔레트를 토글한다 (`Header.tsx:27-36`). UI-07 참고.
- 출력: 상단 바, 진행 상태 바(UI-02), 초기화 확인 창(UI-02), 커맨드 팔레트(UI-07).
- 예외·엣지:
  - 스케줄 상태를 아직 못 받았거나 실패하면 `minutesLeft` 가 0 이 되어 `0m 후` 로 보인다.
  - 640px 미만에서는 스케줄 버튼이 숨겨져 스케줄 모달을 여는 다른 경로가 없다.
  - 768px 미만에서 브랜드 영역과 액션 영역이 세로로 쌓이고(`flex-col md:flex-row`), 액션 버튼은 줄바꿈(`flex-wrap`)된다.
- 관련 코드: `frontend/src/components/Header.tsx:19-299`, `frontend/src/app/page.tsx:123-132`

## UI-02 수집 진행 상태 바와 초기화 확인 창
- 진입점: 헤더 '즉시 수집' 버튼, 커맨드 팔레트 '최신 소식 즉시 수집 트리거', 헤더 '초기화 & 재수집' 버튼.
- 입력: 없음 (버튼 클릭).
- 처리 규칙:
  1. 즉시 수집: 이미 수집 중이면 아무것도 하지 않는다. `POST /api/schedule/trigger` 를 부르고, 성공하면 메시지 `실시간 소식 수집 중...` 으로 진행 폴링을 시작한다 (`Header.tsx:83-93`).
  2. 진행 폴링: 1,200ms 마다 `GET /api/schedule/progress` 를 읽는다 (`Header.tsx:51-81`).
     - `step_message` 가 있으면 상태 바 메시지를 그것으로 바꾼다.
     - `items_saved` 가 직전보다 늘면 `onRefresh()` 를 불러 피드·통계·브리핑을 다시 읽는다.
     - `is_running` 이 false 가 되면 폴링을 멈추고 `수집 완료 (+{items_saved}건 신규 반영)` 를 보여 준 뒤, `onRefresh()` 와 스케줄 상태 재조회를 하고 4,000ms 뒤 메시지를 지운다.
     - 폴링 요청이 실패하면 폴링을 멈추고 메시지를 바로 지운다.
  3. 수집 요청 자체가 실패하면 `수집 요청 실패` 를 3,000ms 동안 보여 준다.
  4. 상태 바: 메시지가 있을 때만 헤더 아래에 한 줄로 나온다. 수집 중이면 회전 아이콘과 오른쪽 문구 `스트리밍 파이프라인: 피드 실시간 반영 중`(640px 이상), 끝나면 초록 체크 아이콘 (`Header.tsx:237-255`).
  5. 초기화 확인 창: '초기화 & 재수집' 을 누르면 헤더 안에 고정 오버레이(`fixed inset-0 z-50`)로 뜬다. 제목 `수집 데이터 전체 삭제 및 재수집`, 영구 삭제 경고 문구, 버튼 `취소` 와 `전체 삭제 후 다시 수집` (`Header.tsx:258-287`).
  6. 확인을 누르면 `POST /api/schedule/reset-and-collect` 를 부른다. 진행 중에는 두 버튼이 비활성이고 확인 버튼이 `초기화 중...` 으로 바뀐다. 성공하면 창을 닫고 `onRefresh()` 후 `기존 {deleted_count}건 삭제 완료. 신규 수집 중...` 메시지로 진행 폴링을 시작한다 (`Header.tsx:95-107`).
- 출력: 상태 바 메시지, 피드 갱신.
- 예외·엣지:
  - 초기화 실패는 브라우저 `alert()` 로 오류 메시지(없으면 `초기화 실패`)를 띄운다.
  - 초기화 확인 창은 Escape 키, 배경 클릭으로 닫히지 않는다. `취소` 버튼으로만 닫는다.
  - 진행 폴링 interval 은 컴포넌트 언마운트 때 정리하지 않는다 ('알려진 불일치·위험' 참고).
- 관련 코드: `frontend/src/components/Header.tsx:51-107`, `:237-287`, `frontend/src/lib/api.ts:190-202`, `:246-256`

## UI-03 테마 시스템
- 진입점: `RootLayout` 이 `<body>` 안을 `ThemeProvider` 로 감싼다 (`frontend/src/app/layout.tsx:26-28`). 컴포넌트는 `useTheme()` 으로 읽는다.
- 입력: `ThemeProvider` props — `defaultTheme`(기본 `'system'`), `storageKey`(기본 `'agentlens_theme'`), `attribute`(기본 `'class'`). 루트 레이아웃은 기본값을 그대로 쓴다.
- 처리 규칙:
  1. 모드는 `'light' | 'dark' | 'system'` 세 가지다. 컨텍스트 값은 `theme`(선택한 모드), `resolvedTheme`(실제 적용된 `'light' | 'dark'`), `toggleTheme()`, `setTheme(mode)` 이다 (`ThemeContext.tsx:5-17`).
  2. 초기 모드: 브라우저에서 `localStorage['agentlens_theme']` 를 읽어 세 값 중 하나면 쓰고, 아니면(없음, 다른 값, 접근 예외) `defaultTheme` 를 쓴다 (`ThemeContext.tsx:49-59`).
  3. OS 설정: `matchMedia('(prefers-color-scheme: dark)')` 로 초기값을 정하고, `change` 이벤트를 구독해 바뀔 때마다 갱신한다. `addEventListener` 가 없는 브라우저에서는 `addListener` 를 쓴다. `matchMedia` 가 없으면 `'light'` 로 본다 (`ThemeContext.tsx:36-41`, `:92-106`).
  4. `resolvedTheme` = `theme` 가 `'system'` 이면 OS 설정, 아니면 `theme` (`ThemeContext.tsx:63-68`).
  5. DOM 적용: `resolvedTheme` 가 바뀔 때마다 `<html>` 에 `data-theme="light|dark"` 를 넣고, `attribute === 'class'` 이면 `dark` 또는 `light` 클래스 하나만 남긴다 (`ThemeContext.tsx:71-89`).
  6. 순환 순서: `light → dark → system → light` (`ThemeContext.tsx:115-130`).
  7. 저장: `toggleTheme`, `setTheme` 둘 다 새 모드를 `localStorage['agentlens_theme']` 에 쓴다. 쓰기 예외는 무시한다.
  8. 스타일 반영: `globals.css` 가 `html.dark` / `html:not(.dark)` 선택자로 배경·글자·테두리·입력창·코드 블록 색을 `!important` 로 덮어쓴다 (`frontend/src/app/globals.css:22-208`). 색상 매핑은 `../ui-spec.md` '스타일 체계' 참고.
- 출력: `<html>` 의 `class`·`data-theme` 속성, `localStorage['agentlens_theme']`.
- 예외·엣지:
  - Provider 밖에서 `useTheme()` 을 부르면 기본값(`theme: 'system'`, `resolvedTheme: 'light'`, 아무것도 안 하는 함수)을 받는다 (`ThemeContext.tsx:29-34`).
  - 서버 렌더 때는 `localStorage` 와 `matchMedia` 가 없어 `system` / `light` 로 그린다. `<html>` 클래스는 클라이언트 effect 에서 붙으므로 첫 화면 직후 테마가 바뀔 수 있다. `<head>` 에 미리 테마를 적용하는 스크립트는 없다.
  - `<html>` 에 `suppressHydrationWarning` 이 있다 (`layout.tsx:24`).
- 관련 코드: `frontend/src/context/ThemeContext.tsx:1-141`, `frontend/src/app/layout.tsx:24-28`, `frontend/src/app/globals.css`

## UI-04 테마 전환 버튼
- 진입점: 헤더 액션 영역 마지막 버튼 (`Header.tsx:232`). 단축키 `t`(UI-05), 팔레트 테마 명령(UI-07)도 같은 `toggleTheme()` 을 부른다.
- 입력: props `className`, `size`(`'sm' | 'md' | 'lg'`, 기본 `'md'`), `showDropdown`(기본 false). 헤더는 기본값으로 쓴다.
- 처리 규칙:
  1. 클릭하면 `toggleTheme()` 으로 다음 모드로 넘어간다 (`ThemeToggle.tsx:49`).
  2. 아이콘: `system` 노트북(Laptop, 파랑), `dark` 달(Moon, 남색), `light` 해(Sun, 호박색). 현재 모드를 보여 준다 (`ThemeToggle.tsx:55-61`).
  3. 크기: sm 28px(`w-7 h-7`), md 32px(`w-8 h-8`), lg 40px(`w-10 h-10`). 아이콘 14/16/20px (`ThemeToggle.tsx:23-33`).
  4. `title` = `{현재 라벨} - 클릭하여 {다음 동작}`. 현재 라벨은 `라이트 모드`, `다크 모드`, `시스템 테마 (현재 다크|라이트)`. 다음 동작은 `다크 모드로 전환`, `시스템 테마로 전환`, `라이트 모드로 전환` (`ThemeToggle.tsx:35-52`).
  5. `aria-label="테마 전환"` (`ThemeToggle.tsx:53`).
- 출력: 테마 변경 (UI-03).
- 예외·엣지: `showDropdown` prop 은 선언만 있고 구현이 없다. 드롭다운으로 모드를 직접 고르는 UI 는 없다.
- 관련 코드: `frontend/src/components/ThemeToggle.tsx:1-64`

## UI-05 전역 단축키
- 진입점: `HomePage` 가 `HotkeyListener` 를 렌더한다 (`page.tsx:114-122`). `window` 의 `keydown` 을 듣고 화면에는 아무것도 그리지 않는다 (`return null`).
- 입력: 콜백 props `onNavigateFeed`, `onOpenDetailModal`, `onHandoverChat`, `onToggleBookmark`, `onFocusSearch`, `onToggleTheme`, `onCloseOverlays`, `onToggleCommandPalette`, 추가 매핑 `customHotkeys`(기본 `[]`), `enabled`(기본 true). 홈 화면은 `onToggleCommandPalette` 와 `customHotkeys` 를 넘기지 않는다.
- 처리 규칙 (판정 순서, `HotkeyListener.tsx:60-147`):
  1. `enabled` 가 false 면 리스너를 달지 않는다.
  2. `e.isComposing` 이 true(한글 등 IME 조합 중)면 무시한다.
  3. 대상 요소가 `INPUT`, `TEXTAREA`, `SELECT`, `contentEditable` 이면 '입력 중' 으로 본다.
  4. ⌘ 또는 Ctrl + `k`(대소문자 무관): 기본 동작을 막고 `onToggleCommandPalette?.()` 를 부른 뒤 끝낸다. 입력 중에도 동작한다.
  5. `Escape`: `onCloseOverlays?.()` 를 부르고 끝낸다. 입력 중에도 동작한다. 기본 동작은 막지 않는다.
  6. 입력 중이면 여기서 끝낸다 (단일 키 단축키 무시).
  7. ⌘, Ctrl, Alt 중 하나라도 눌려 있으면 끝낸다. Shift 는 검사하지 않는다.
  8. `customHotkeys` 에서 `key` 가 대소문자 무관하게 같은 첫 매핑의 `handler` 를 부르고 끝낸다. `modifiers`, `allowInInputs` 필드는 타입에만 있고 판정에 쓰지 않는다.
  9. 표준 단일 키(대문자도 같은 동작): `j` → `onNavigateFeed(1)`, `k` → `onNavigateFeed(-1)`, `/` → `onFocusSearch()`, `b` → `onToggleBookmark()`, `c` → `onHandoverChat()`, `t` → `onToggleTheme()`. 모두 기본 동작을 막는다.
  10. `Enter` 또는 스페이스: `onOpenDetailModal` 이 넘어왔으면 기본 동작을 막고 부른다.
  11. 콜백 props 가 바뀔 때마다 리스너를 다시 단다 (`HotkeyListener.tsx:151-162`).
- 홈 화면 연결 (`page.tsx:114-122`):
  | 콜백 | 연결된 동작 |
  |---|---|
  | `onNavigateFeed` | `handleNavigateFeed` — 카드 포커스 이동 (UI-06) |
  | `onOpenDetailModal` | 포커스 카드의 상세 모달 열기 |
  | `onHandoverChat` | 포커스 카드로 `/chat?sourceId={id}` 이동 |
  | `onToggleBookmark` | 포커스 카드 북마크 토글 |
  | `onFocusSearch` | 검색 입력창 `focus()` |
  | `onToggleTheme` | `useTheme().toggleTheme` |
  | `onCloseOverlays` | 홈 화면의 모달 6개를 모두 닫는다: 뉴스 상세, 일일 브리핑, 스케줄, MCP, 브리핑 연동 설정, 소스 (`page.tsx:103-110`) |
- 출력: 콜백 실행.
- 예외·엣지:
  - Escape 는 열린 모달을 한꺼번에 닫는다. 일일 브리핑 모달 위에 연동 설정 모달을 연 상태에서도 둘 다 닫힌다. 헤더 안의 커맨드 팔레트와 초기화 확인 창은 `onCloseOverlays` 대상이 아니다 (팔레트는 자체 Escape 처리, 확인 창은 Escape 로 닫히지 않는다).
  - 단일 키 단축키는 모달이 열려 있어도 동작한다. 모달 안의 입력창에 포커스가 없으면 `j`/`k`/`b`/`c`/`t` 가 배경 피드에 적용된다.
  - `Enter`·스페이스는 홈 화면에서 항상 `preventDefault()` 된다. 버튼·링크에 포커스를 둔 키보드 조작과 스페이스 페이지 스크롤에 영향을 준다 ('알려진 불일치·위험' 참고).
  - `/chat` 화면에는 전역 단축키가 없다.
- 관련 코드: `frontend/src/components/HotkeyListener.tsx:1-165`, `frontend/src/app/page.tsx:75-122`, 동작 확인 테스트 `frontend/src/tests/HotkeyListener.test.tsx`

## UI-06 피드 키보드 탐색
- 진입점: 홈 화면 뉴스 카드 그리드. 단축키 `j`, `k`, `Enter`/스페이스, `b`, `c` (UI-05).
- 입력: `focusedIndex` 상태 (초기값 -1, `page.tsx:28`).
- 처리 규칙:
  1. `j` 는 +1, `k` 는 -1 만큼 옮긴다. 결과가 0 보다 작으면 0, 목록 길이 이상이면 마지막 인덱스로 고정한다. 목록이 비어 있으면 아무것도 하지 않는다 (`page.tsx:75-83`). 처음 `j` 를 누르면 -1 → 0 으로 첫 카드가 포커스된다.
  2. 포커스 카드는 `isFocused` prop 으로 `ring-2 ring-blue-500` 테두리와 `data-focused="true"` 속성을 받는다 (`NewsCard.tsx:61-63`, `page.tsx:347`).
  3. `Enter`/스페이스: `focusedIndex >= 0` 이고 해당 카드가 있으면 상세 모달을 연다 (`page.tsx:85-89`).
  4. `c`: 같은 조건에서 `router.push('/chat?sourceId={id}')` (`page.tsx:91-95`).
  5. `b`: 같은 조건에서 북마크를 토글하고 `localStorage['agentlens_bookmarks']` 에 저장한다 (`page.tsx:97-101`, `hooks/useBookmarks.ts:25-40`).
- 출력: 카드 강조 표시, 상세 모달, 화면 이동, 북마크 변경.
- 예외·엣지:
  - 포커스 카드를 화면 안으로 스크롤하는 코드는 없다. 화면 밖 카드에 포커스가 가도 스크롤되지 않는다.
  - 페이지·필터·정렬이 바뀌어도 `focusedIndex` 를 초기화하지 않는다. 같은 인덱스의 다른 카드가 강조된다.
  - 카드(`<article>`)는 `tabIndex` 가 없어 Tab 키로 포커스할 수 없다. 키보드 탐색은 j/k 로만 된다.
- 관련 코드: `frontend/src/app/page.tsx:28`, `:75-101`, `:338-351`, `frontend/src/components/NewsCard.tsx:58-64`

## UI-07 커맨드 팔레트
- 진입점: ⌘K / Ctrl+K (헤더 keydown 리스너, `Header.tsx:27-36`), 헤더의 ⌘ 버튼 (`Header.tsx:221-229`). 헤더가 렌더하는 `/` 화면에서만 쓸 수 있다.
- 입력: props `isOpen`(기본 false), `onClose`, `onOpenSources`, `onOpenMcp`, `onTriggerCollect`. 헤더는 각각 팔레트 닫기, 페이지의 소스 모달 열기, MCP 모달 열기, 헤더의 `handleCollect` 를 넘긴다 (`Header.tsx:290-296`).
- 처리 규칙:
  1. 명령 목록 (표시 순서, `CommandPalette.tsx:38-108`). 모든 명령은 실행 뒤 `onClose()` 로 팔레트를 닫는다.
     | id | 제목 | 부제 | 분류 | 실행 | 단축키 표시 |
     |---|---|---|---|---|---|
     | chat | AI 챗 워크스페이스 이동 | 기술 소식 기반 심층 질의응답 및 에이전틱 리서치 | navigation | `router.push('/chat')` | C |
     | theme | 현재 모드에 따라 바뀜 (아래) | 시스템 및 개인 선호 테마 순환 토글 (Light -> Dark -> System) | theme | `toggleTheme()` | T |
     | sources | 소스 관리 & AI 리서처 열기 | RSS 피드 및 GitHub 소스 등록, 자율 소스 탐색 | data | `onOpenSources()` | 없음 |
     | mcp | FastMCP 도구 설정 열기 | Claude Desktop 및 에이전트 연동 가이드 | system | `onOpenMcp()` | 없음 |
     | collect | 최신 소식 즉시 수집 트리거 | 등록된 모든 소스에서 즉시 신규 기술 소식 크롤링 | data | `onTriggerCollect()` | 없음 |
  2. 테마 명령 제목: `light` 이면 `다크 모드로 전환`, `dark` 이면 `시스템 모드로 전환`, `system` 이면 `라이트 모드로 전환 (현재 시스템)`. 아이콘도 현재 모드(해·달·노트북)를 따른다.
  3. 검색: 입력값을 앞뒤 공백 제거·소문자로 바꿔 제목 또는 부제에 포함되는 명령만 남긴다. 빈 입력이면 전체를 보여 준다 (`CommandPalette.tsx:110-118`).
  4. 검색어가 바뀔 때마다 선택 인덱스를 0 으로 되돌린다 (`CommandPalette.tsx:120-122`).
  5. 검색 입력창 키 처리 (`CommandPalette.tsx:141-156`):
     - `ArrowDown`: 다음 항목, 마지막에서 첫 항목으로 돈다.
     - `ArrowUp`: 이전 항목, 첫 항목에서 마지막으로 돈다.
     - `Enter`: 선택한 항목을 실행한다. 결과가 없으면 아무것도 하지 않는다.
  6. 마우스: 항목에 올리면 그 항목이 선택되고, 클릭하면 실행한다.
  7. 열려 있는 동안 window keydown 을 따로 듣는다. ⌘/Ctrl+K 또는 Escape 를 누르면 기본 동작을 막고 닫는다 (`CommandPalette.tsx:124-139`).
  8. 배경(오버레이) 클릭, 오른쪽 위 X 버튼(`aria-label="닫기"`)으로 닫는다. 패널 안 클릭은 전파를 막아 닫히지 않는다.
  9. 열리면 검색 입력창이 자동 포커스된다 (`autoFocus`). 자리표시자 `명령어 검색 또는 바로가기... (ESC로 닫기)`.
  10. 배치: 화면 위에서 80px(`pt-20`) 아래, 최대 너비 `max-w-xl`(576px), 목록 최대 높이 `max-h-80`(320px) 스크롤. 바닥줄에 `↑↓ 탐색`, `↵ 실행`, `ESC 닫기` 안내가 있다 (`CommandPalette.tsx:160-271`).
  11. 단축키 표시(`kbd`)는 640px 이상에서만 보인다.
- 출력: 명령 실행, 팔레트 닫힘.
- 예외·엣지:
  - 결과가 없으면 `검색된 명령어가 없습니다.` 를 보여 준다.
  - 팔레트는 닫혀도 헤더 안에 마운트된 채로 남아(`isOpen` 이 false 면 `null` 반환) 검색어와 선택 인덱스가 다음에 열 때 그대로 남는다.
  - 팔레트가 열린 상태에서 ⌘K 를 누르면 헤더 리스너(토글)와 팔레트 리스너(닫기)가 함께 동작하고, 둘 다 닫힘 상태로 끝난다.
  - 팔레트 표시 단축키 `C` 는 '챗 이동' 옆에 있지만, 실제 전역 `c` 키는 포커스 카드가 있을 때만 그 카드로 챗 이동을 한다 (UI-06). 포커스 카드가 없으면 아무 일도 없다.
  - 포커스 가두기(focus trap)와 배경 스크롤 잠금은 없다.
- 관련 코드: `frontend/src/components/CommandPalette.tsx:1-273`, `frontend/src/components/Header.tsx:25-36`, `:221-229`, `:290-296`, 동작 확인 테스트 `frontend/src/tests/CommandPalette.test.tsx`

## UI-08 모달·오버레이 공통 규칙
- 진입점: 각 모달의 여는 버튼. 목록과 여는 곳은 `../ui-spec.md` '모달·드로어·바텀시트·팝오버' 참고.
- 입력: 각 모달은 `isOpen`(또는 내부 상태)과 `onClose` 를 받는다.
- 처리 규칙:
  1. 열림 상태는 부모가 가진다. 홈 화면은 `page.tsx` 의 `useState` 6개(`detailModalOpen`, `briefingModalOpen`, `schedOpen`, `mcpOpen`, `webhookModalOpen`, `sourcesModalOpen`)로, 챗 화면은 `ChatWorkspace` 의 `isDrawerOpen`, `isBottomSheetOpen` 으로 관리한다.
  2. 닫힌 모달은 `if (!isOpen) return null` 로 DOM 에서 빠진다. 컴포넌트 자체는 마운트된 채라 내부 상태가 남는 모달이 있다 (예: 일일 브리핑의 보기 탭, 커맨드 팔레트 검색어). 뉴스 상세 모달은 닫힐 때와 `isOpen`/`item.id` 가 바뀔 때 탭·질문·대화 기록을 초기화하고 진행 중인 스트리밍 요청을 중단한다 (`NewsDetailModal.tsx:44-79`).
  3. 오버레이 공통 클래스: `fixed inset-0 z-50`, 가운데 정렬, 반투명 검정 배경 + 블러. `globals.css` 가 `bg-black/60`, `bg-black/70`, `bg-black/75` 를 `rgba(15, 23, 42, 0.6)` + `blur(4px)` 로 통일한다 (`globals.css:215-220`). `bg-black/40` 은 이 규칙에 포함되지 않는다.
  4. 레이어 순서: 홈 헤더 `z-40`, 모든 모달 `z-50`. 같은 `z-50` 끼리는 DOM 순서로 겹친다. 홈 화면에서 브리핑 연동 설정 모달은 일일 브리핑 모달보다 뒤에 렌더되어 위에 보인다 (`page.tsx:409-417`). 챗 헤더 `z-30`, 데스크톱 사이드바 `z-20`, 경고 토스트 `z-40`.
  5. 닫기 수단 (컴포넌트별):
     | 오버레이 | Escape | 배경 클릭 | 닫기 버튼 | 기타 |
     |---|---|---|---|---|
     | 뉴스 상세 | 자체 리스너 + 전역 단축키 | 닫힘 | 헤더 X | — |
     | 일일 브리핑 | 전역 단축키만 | 안 닫힘 | 헤더 X, 바닥 `닫기` | — |
     | 브리핑 연동 설정 | 전역 단축키만 | 안 닫힘 | 헤더 X, 바닥 `닫기` | — |
     | 스케줄 | 전역 단축키만 | 안 닫힘 | X, `닫기` | — |
     | MCP | 전역 단축키만 | 안 닫힘 | X, `닫기` | — |
     | 소스 | 전역 단축키만 | 닫힘 | 헤더 X, 바닥 `닫기` | — |
     | 초기화 확인 창 | 안 닫힘 | 안 닫힘 | `취소` | — |
     | 커맨드 팔레트 | 자체 리스너 | 닫힘 | X | ⌘/Ctrl+K |
     | 챗 기록 드로어 | 자체 리스너 | 닫힘 | X | 세션 선택·새 대화 때 닫힘 |
     | 포커스 필터 바텀시트 | 자체 리스너 | 닫힘 | X | 아래로 100px 이상 스와이프, `적용` 버튼 |
     | 모델 선택 팝오버 | 자체 리스너 (트리거로 포커스 복귀) | 바깥 mousedown/touchstart | — | 선택하면 닫힘 |
     | 인용 출처 팝오버 | 자체 리스너 | 바깥 mousedown | 닫기 버튼 | — |
     | 세션 삭제 확인 팝오버 | 자체 리스너 | 바깥 mousedown | `취소` | 열릴 때 취소 버튼에 포커스 |
  6. 배경 스크롤 잠금: 챗 기록 드로어만 열려 있는 동안 `document.body.style.overflow = 'hidden'` 을 걸고 닫을 때 원래 값으로 되돌린다 (`ChatHistoryDrawer.tsx:59-66`). 다른 모달은 잠그지 않는다.
  7. 모달 크기: 뉴스 상세·소스 `max-w-4xl` + 높이 `max-h-[92vh]`(640px 이상 `88vh`), 일일 브리핑 `max-w-4xl max-h-[90vh]`, 브리핑 연동 설정 `max-w-xl max-h-[90vh]`, MCP `max-w-2xl`, 스케줄 `max-w-xl`, 초기화 확인 창 `max-w-md`. 본문은 내부 스크롤(`overflow-y-auto`)한다.
  8. 열고 닫는 애니메이션 클래스(`animate-in fade-in zoom-in-95 slide-in-from-left` 등)를 쓰지만, 이 클래스를 정의하는 플러그인이나 CSS 는 찾지 못했다.
  9. 확인이 필요한 일부 동작은 브라우저 기본 대화상자를 쓴다: 소스 삭제 `window.confirm('이 소스를 목록에서 삭제하시겠습니까?')`, Ask AI 대화 초기화 `window.confirm('AI 대화 내역을 모두 초기화하시겠습니까?')`, 초기화 실패 `alert()`.
- 출력: 오버레이 표시·제거.
- 예외·엣지:
  - 포커스 가두기와 닫은 뒤 포커스 복귀는 모델 선택 팝오버 외에는 없다.
  - 세션 삭제 확인 팝오버의 Escape 처리는 `e.stopPropagation()` 만 하므로 같은 window 의 다른 리스너(챗 기록 드로어의 Escape)도 실행된다. 드로어 안에서 팝오버를 Escape 로 닫으면 드로어도 닫힌다.
  - 스케줄 모달은 `zinc` 계열 어두운 색을 직접 써서 테마와 관계없이 어둡게 보인다.
- 관련 코드: `frontend/src/app/page.tsx:61-110`, `:400-425`, `frontend/src/components/NewsDetailModal.tsx:81-89`, `:200-205`, `frontend/src/components/SourcesModal.tsx:92-93`, `frontend/src/components/chat/ChatHistoryDrawer.tsx:49-91`, `frontend/src/components/chat/FocusBottomSheet.tsx:64-108`, `frontend/src/components/chat/ChatModelSelector.tsx:36-75`, `frontend/src/components/chat/DeleteConfirmPopover.tsx:23-50`, `frontend/src/components/chat/CitationPopover.tsx:23-45`, `frontend/src/app/globals.css:210-220`

## UI-09 반응형 레이아웃
- 진입점: 모든 화면.
- 입력: 뷰포트 너비.
- 처리 규칙:
  1. 브레이크포인트는 Tailwind 4 기본값을 쓴다. `globals.css` 에 `@theme` 재정의가 없다. sm 640px, md 768px, lg 1024px. `xl` 이상 접두사는 쓰지 않는다. `ChatWorkspace` 는 JS 로 `window.innerWidth >= 1024` 를 따로 검사한다 (`ChatWorkspace.tsx:634`).
  2. 홈 화면 (`page.tsx`, `Header.tsx`):
     | 영역 | 640px 미만 | 640px 이상 | 768px 이상 | 1024px 이상 |
     |---|---|---|---|---|
     | 본문 좌우 여백 | 16px (`px-4`) | 24px (`sm:px-6`) | — | 32px (`lg:px-8`) |
     | 본문 최대 너비 | `max-w-7xl`(1280px) | | | |
     | 헤더 | 브랜드·액션 세로 쌓임 | `Live`, ⌘K 글자, 스케줄 버튼 표시 | 브랜드·액션 가로 배치 | 태그라인 표시 |
     | 개요 카드·툴바 | 세로 쌓임 | 가로 배치 | | |
     | 뉴스 카드 그리드 | 1열 | 1열 | 2열 | 3열 |
  3. 챗 화면:
     | 영역 | 1024px 미만 | 1024px 이상 |
     |---|---|---|
     | 대화 기록 | 헤더 기록 버튼 → 왼쪽 슬라이드 드로어(`w-72`, 640px 이상 `w-80`) | 왼쪽 고정 사이드바(`w-72`), 기록 버튼은 사이드바 접기/펴기 |
     | 챗 헤더 | 640px 미만에서 세로 쌓임 | 가로 배치 (`max-w-5xl`) |
     | 포커스 필터 | 640px 미만 화면 아래 바텀시트(위쪽만 둥근 모서리, 끌기 손잡이) | 640px 이상 가운데 모달 |
     | 입력창 안내 | `Enter: 전송, Shift+Enter: 줄바꿈` 은 1024px 이상에서만, 스코프 표시는 640px 이상에서만 | |
  4. 가로 스크롤 방지: `<body>` 와 챗 루트에 `overflow-x-hidden w-full max-w-full` (`layout.tsx:25`, `ChatWorkspace.tsx:587`). 마크다운 영역은 `min-w-0 max-w-full break-words [overflow-wrap:anywhere] [word-break:break-word]` 로 긴 토큰을 끊고, 코드 블록과 표만 자체 가로 스크롤(`overflow-x-auto overscroll-x-contain`)을 갖는다 (UI-12).
- 출력: 너비별 배치.
- 예외·엣지:
  - 챗 헤더의 `피드` 글자는 `hidden xs:inline` 인데 `xs` 브레이크포인트를 정의한 곳이 없어 어떤 너비에서도 보이지 않는다 (`ChatHeader.tsx:51`).
  - 데스크톱 사이드바는 `hidden lg:flex` 로 1024px 미만에서 숨겨지지만 `isSidebarOpen` 초기값이 true 이므로, 1024px 미만에서도 챗 헤더의 '새 대화' 버튼(`showNewChatButton={!isSidebarOpen}`)이 숨겨진다. 1024px 미만 사용자는 드로어 안의 `+ 새 대화` 로 새 대화를 시작한다.
- 관련 코드: `frontend/src/app/page.tsx:134-339`, `frontend/src/components/Header.tsx:115-233`, `frontend/src/components/chat/ChatWorkspace.tsx:584-717`, `frontend/src/components/chat/ChatHeader.tsx:40-152`, `frontend/src/components/chat/FocusBottomSheet.tsx:101-121`, 동작 확인 테스트 `frontend/src/tests/ResponsiveLayout.test.tsx`

## UI-10 모바일 뷰포트·가상 키보드 대응
- 진입점: 루트 레이아웃 viewport 설정, `/chat` 화면.
- 입력: 뷰포트 크기, `window.visualViewport`.
- 처리 규칙:
  1. viewport 메타: `width=device-width`, `initialScale=1`, `maximumScale=1`, `userScalable=false`, `interactiveWidget='resizes-content'` (`layout.tsx:9-15`). 사용자 확대를 막는다.
  2. 챗 페이지 `<main>` 은 `h-[100dvh]` 다 (`app/chat/page.tsx:12`).
  3. `ChatWorkspace` 는 `visualViewport` 의 `resize`·`scroll` 이벤트마다 루트 높이를 `{visualViewport.height}px` 로 바꾼다. 처음 높이는 `100dvh` 이고, `visualViewport` 가 없으면 그대로 둔다 (`ChatWorkspace.tsx:86`, `:104-121`). 가상 키보드가 올라오면 화면이 줄어든 높이에 맞춰진다.
  4. 챗 입력창(textarea)은 글자 크기 16px(`text-base`, 640px 이상 `sm:text-sm`)로 iOS 자동 확대를 피한다. 포커스되면 100ms 뒤 `scrollIntoView({ block: 'end', behavior: 'smooth' })` 한다 (`ChatPromptInput.tsx:72-76`, `:91`).
  5. 입력창 높이는 내용에 맞춰 늘고 최대 180px 이다 (`ChatPromptInput.tsx:43-48`).
  6. 하단 입력 영역 아래 여백은 `max(0.75rem, env(safe-area-inset-bottom))` 이다 (`ChatWorkspace.tsx:662`).
  7. 포커스 필터 바텀시트는 시트 위에서 아래로 100px 이상 스와이프하면 닫힌다 (`FocusBottomSheet.tsx:79-88`, 판정 `:85`).
- 출력: 뷰포트에 맞춘 챗 화면 높이.
- 예외·엣지: `userScalable=false`, `maximumScale=1` 은 저시력 사용자의 확대를 막는다 ('알려진 불일치·위험' 참고).
- 관련 코드: `frontend/src/app/layout.tsx:9-15`, `frontend/src/app/chat/page.tsx:10-23`, `frontend/src/components/chat/ChatWorkspace.tsx:103-121`, `frontend/src/components/chat/ChatPromptInput.tsx:43-91`, 동작 확인 테스트 `frontend/src/tests/chat/MobileViewport.test.tsx`

## UI-11 로딩·오류·빈 상태 표시
- 진입점: 데이터를 읽는 각 영역.
- 입력: 각 영역의 loading / error / 데이터 상태.
- 처리 규칙:
  1. 홈 피드 (`page.tsx:309-370`). 세 상태는 서로 배타적이다.
     - 로딩: 회전 아이콘 + `소식을 불러오는 중...`. `loading` 초기값이 true 라 첫 렌더부터 보인다.
     - 오류: 빨간 점선 박스에 오류 메시지(`API 오류 ({status}): {statusText}` 또는 `데이터를 불러오지 못했습니다.` 등), 안내 `백엔드 서버(포트 8000) 연결 상태를 확인해주세요.`, `다시 시도` 버튼(오류를 지우고 다시 읽는다).
     - 빈 상태: `조건에 일치하는 소식이 없습니다`, `다른 카테고리를 선택하거나 검색어 및 필터를 초기화해 보세요.`, `필터 전체 초기화` 버튼(카테고리·소스·검색어·Must-Read 를 초기화하고 1페이지로. 정렬은 그대로).
     - 페이지네이션은 로딩이 아니고 전체 페이지가 2 이상일 때만 나온다.
  2. 홈의 다른 영역:
     - Tech Radar: 로딩 중이면 `animate-pulse` 자리표시 박스, 데이터가 없거나 태그가 0개면 영역 자체를 그리지 않는다 (`TechRadar.tsx:22-30`).
     - 일일 브리핑 배너: 브리핑이 없으면 그리지 않는다 (`DailyBriefingBanner.tsx:13`).
     - 통계·브리핑·레이더 조회 실패는 화면에 표시하지 않고 콘솔에 남긴다 (`hooks/useNewsFeed.ts:32-48`).
     - 헤더 스케줄 상태 실패는 무시한다 (UI-01).
  3. 모달:
     - 브리핑 연동 설정: 설정을 읽는 동안 본문에 회전 아이콘, 실패하면 피드백 영역에 오류 문구 (`BriefingSettingsModal.tsx:77-108`, `:265-267`).
     - 소스: 실패하면 상단 토스트 `데이터를 불러오지 못했습니다.`. 다른 토스트는 3,500ms 뒤 사라진다 (`SourcesModal.tsx:37-64`, `:154-164`).
     - 스케줄: 상태를 받기 전 `계산 중...`.
     - 버튼 진행 표시: 진행 중인 버튼은 `disabled` 와 회전 아이콘(`Loader2`/`RefreshCw` + `animate-spin`)을 쓴다.
  4. 챗 화면:
     - 대화 기록 목록: 로딩 중 스켈레톤 5줄(`aria-label="대화 기록을 불러오는 중..."`), 오류면 장미색 박스 + `다시 시도`, 비어 있으면 빈 상태 컴포넌트(검색 결과 없음 / 대화 없음 구분) (`SessionList.tsx:35-66`).
     - 대화 목록 조회가 실패해도 localStorage 캐시가 있으면 오류 없이 캐시를 보여 준다 (`useChatSessions.ts:82-97`).
     - 메시지가 없으면 웰컴 화면과 추천 질문 4개를 보여 준다 (`ChatMessageList.tsx:45-75`).
     - URL 의 `sourceId` 기사를 찾지 못하면 상단 호박색 토스트 `요청하신 기사를 찾을 수 없어 전체 뉴스 모드로 시작합니다.` 를 띄운다. X 로 닫는다 (`ChatWorkspace.tsx:534`, `:610-624`).
     - 챗 페이지 Suspense fallback: `워크스페이스 환경을 초기화하는 중...` (`app/chat/page.tsx:13-19`).
- 출력: 상태별 안내 UI.
- 예외·엣지: 북마크 보기(`source === 'bookmarks'`)는 서버를 부르지 않고 localStorage 목록을 거르므로 로딩·오류 상태가 없다 (`useNewsFeed.ts:58-74`).
- 관련 코드: 위 각 줄 참조

## UI-12 마크다운 렌더링
- 진입점: `MarkdownViewer` 를 쓰는 곳 — 뉴스 상세의 `상세 본문 요약`(`NewsDetailModal.tsx:348`), 일일 브리핑 `마크다운 전문` 탭(`DailyBriefingModal.tsx:440`), Ask AI 답변(`news-detail/AskAiPanel.tsx:210`). 챗 답변은 `ChatMessageItem` 이 자체 `ReactMarkdown` 설정을 쓰고 코드 블록만 `CodeBlock` 을 가져다 쓴다 (`ChatMessageItem.tsx:20`, `:224-246`).
- 입력: `content`(마크다운 문자열), `className`(선택).
- 처리 규칙:
  1. `content` 가 빈 값이면 아무것도 그리지 않는다 (`MarkdownViewer.tsx:82`).
  2. `react-markdown` + `remark-gfm`(표, 취소선, 자동 링크 등 GFM) 으로 그린다. HTML 을 해석하는 rehype 플러그인은 쓰지 않는다.
  3. 바깥 컨테이너: 클래스 `markdown-viewer`, `w-full max-w-full min-w-0`, 긴 단어 끊기, 글자 12px(640px 이상 14px) (`MarkdownViewer.tsx:85`).
  4. 제목은 한 단계씩 낮춰 그린다: `#` → `<h2>`, `##` → `<h3>`, `###` → `<h4>`, `####` → `<h5>`. `#`·`##` 는 아래 테두리가 있다.
  5. 목록은 파란 마커, 인용은 왼쪽 파란 4px 테두리·옅은 파랑 배경·기울임, 링크는 새 탭(`target="_blank" rel="noopener noreferrer"`)·파란 글자·`break-all`, `hr` 은 회색 선, `strong` 은 semibold.
  6. 표는 `div.table-wrapper`(`overflow-x-auto overscroll-x-contain`, 둥근 테두리) 안에 최소 너비 320px 표로 그린다.
  7. 코드 (`CodeBlock`, `MarkdownViewer.tsx:19-79`):
     - `pre` 는 감싸지 않고 자식만 넘긴다. `CodeBlock` 이 블록/인라인을 직접 판정한다.
     - `language-xxx` 클래스가 있거나 내용에 줄바꿈이 있으면 블록, 아니면 인라인 코드다.
     - 인라인: 회색 배경 배지, `break-all`.
     - 블록: `div.code-block-wrapper`(`overflow-hidden`) 안에 머리줄(터미널 아이콘 + 언어명, 없으면 `snippet`)과 복사 버튼, 본문 `<pre tabIndex={0} aria-label="가로 스크롤 가능한 코드 블록">` (`overflow-x-auto overscroll-x-contain`).
     - 복사 버튼은 끝 줄바꿈 하나를 뺀 원문을 클립보드에 쓰고 2,000ms 동안 `복사됨` 을 보여 준다.
  8. 문법 강조(syntax highlighting)는 없다.
- 출력: 스타일 입힌 HTML.
- 예외·엣지:
  - 언어 표시 없는 한 줄짜리 펜스 코드 블록은 줄바꿈이 없으면 인라인 코드로 그려질 수 있다 (판정 규칙상).
  - 라이트 모드 색은 `slate` 계열이고, 다크 모드에서는 `globals.css` 의 `html.dark pre, code` 와 `text-slate-*`, `bg-white`, `bg-slate-*` 덮어쓰기를 따른다.
- 관련 코드: `frontend/src/components/MarkdownViewer.tsx:1-188`, 동작 확인 테스트 `frontend/src/tests/ResponsiveLayout.test.tsx`

## UI-13 복사 피드백
- 진입점: 코드 블록 `복사`(UI-12), MCP 모달 `설정 복사`, 일일 브리핑 `복사`, 뉴스 상세 Ask AI 답변 복사, 챗 답변 `마크다운 복사`.
- 입력: 복사할 문자열.
- 처리 규칙:
  1. `navigator.clipboard.writeText(text)` 로 쓴다.
  2. 아이콘을 체크로 바꾸고 문구를 `복사됨`(MCP 모달은 `복사됨!`)으로 바꾼 뒤 2,000ms 뒤 되돌린다 (`MarkdownViewer.tsx:26-30`, `McpModal.tsx:65`, `DailyBriefingModal.tsx:52-56`, `NewsDetailModal.tsx:187-191`).
  3. 챗 답변의 `ExportToolbar` 는 같은 2,000ms 피드백에 더해 클립보드 API 실패 시 대체 경로를 둔다 (`chat/ExportToolbar.tsx:47-61`). 대체 경로의 세부 동작은 `functional-spec/02-ai-chat.md` 범위다.
- 출력: 클립보드 내용, 2초 피드백.
- 예외·엣지: `ExportToolbar` 외의 복사 버튼은 `writeText` 의 실패(Promise 거부, `navigator.clipboard` 미정의)를 처리하지 않는다. 실패해도 `복사됨` 이 표시된다.
- 관련 코드: 위 줄 참조

## UI-14 접근성 속성
- 진입점: 각 컴포넌트.
- 입력: 없음.
- 처리 규칙 (코드에 있는 속성):
  | 컴포넌트 | 속성 |
  |---|---|
  | 커맨드 팔레트 | `role="dialog" aria-modal="true" aria-label="커맨드 팔레트"`, 목록 `role="listbox" aria-label="명령어 목록"`, 항목 `role="option" aria-selected`, 닫기 `aria-label="닫기"` |
  | 테마 버튼 | `aria-label="테마 전환"`, `title` 에 현재·다음 모드 |
  | 코드 블록 | `<pre tabIndex={0} aria-label="가로 스크롤 가능한 코드 블록">` (키보드로 포커스 후 가로 스크롤) |
  | 모달 배경 | 뉴스 상세·소스의 배경 div `aria-hidden="true"` |
  | 챗 헤더 | 피드 링크 `aria-label="피드로 돌아가기"`, 스코프 그룹 `role="group" aria-label="검색 스코프 모드"` + 버튼 `aria-pressed`, 기록 버튼 `aria-label="대화 기록 보기" aria-expanded aria-controls="chat-history-drawer"`, `aria-label="새 대화 시작"` |
  | 대화 기록 사이드바·드로어 | `role="navigation" aria-label="대화 기록 목록"`, 드로어 닫기 `aria-label="대화 기록 드로어 닫기"`, 검색 결과 수 `sr-only aria-live="polite"` |
  | 세션 카드 | `role="button" tabIndex` + Enter/스페이스로 선택, 삭제 버튼 `aria-label="대화 '{제목}' 삭제"` |
  | 메시지 목록 | `role="log" aria-live="polite" aria-relevant="additions text"` |
  | 포커스 필터 | 캡슐 `role="button" tabIndex={0} aria-haspopup="dialog" aria-expanded` + Enter/스페이스, 시트 `role="dialog" aria-modal="true"`, Must-Read 토글 `role="switch"` |
  | 모델 선택 | `role="radiogroup" aria-label="Claude AI 모델 선택"` + 항목 `role="radio"`, 화살표 4방향으로 이동(순환), Enter/스페이스로 선택 |
  | 기타 챗 | 입력창 `aria-label="질문 입력"`, `답변 생성 중단`, `질문 전송`, `답변 복사`, `답변 다시 시도`, 진행 표시 `role="region"`/`role="progressbar"`, 모델 변경 구분선 `role="separator"`, 인용 팝오버 `role="dialog"` |
- 출력: 보조기술용 속성.
- 예외·엣지 (속성이 없는 곳):
  - 뉴스 상세, 일일 브리핑, 브리핑 연동 설정, 스케줄, MCP, 소스 모달과 초기화 확인 창에는 `role="dialog"`·`aria-modal`·`aria-labelledby` 가 없다. 아이콘만 있는 닫기 X 버튼(뉴스 상세·소스·MCP·스케줄 등)에도 `aria-label` 이 없다.
  - 뉴스 카드(`<article onClick>`)와 일일 브리핑 배너(`<div onClick>`)는 클릭으로만 열리고 Tab 포커스·키 처리가 없다.
  - 챗 헤더 `aria-controls="chat-history-drawer"` 가 가리키는 `id` 를 가진 요소가 없다.
- 관련 코드: `frontend/src/components/CommandPalette.tsx:161-211`, `frontend/src/components/ThemeToggle.tsx:52-53`, `frontend/src/components/MarkdownViewer.tsx:68-71`, `frontend/src/components/chat/ChatHeader.tsx:44-144`, `frontend/src/components/chat/ChatMessageList.tsx:78-81`, `frontend/src/components/chat/FocusBottomSheet.tsx:110-113`, `frontend/src/components/chat/ChatModelSelector.tsx:93-110`, `:163-186`

## 단축키 표
| 키 | 동작 | 조건 | 위치 |
|---|---|---|---|
| ⌘K / Ctrl+K | 커맨드 팔레트 열기/닫기 | `/` 화면. 입력창 안에서도 동작. 기본 동작 막음 | `Header.tsx:27-36` (HotkeyListener 는 홈에서 콜백 없이 기본 동작만 막음, `HotkeyListener.tsx:75-79`) |
| ⌘K / Ctrl+K | 팔레트 닫기 | 팔레트가 열려 있을 때 | `CommandPalette.tsx:128-130` |
| Escape | 홈 모달 6개 모두 닫기 | `/` 화면. 입력창 안에서도 동작 | `HotkeyListener.tsx:82-85`, `page.tsx:103-110` |
| Escape | 팔레트 닫기 | 팔레트가 열려 있을 때 | `CommandPalette.tsx:131-133` |
| Escape | 뉴스 상세 모달 닫기(상태 초기화) | 모달이 열려 있을 때 | `NewsDetailModal.tsx:81-89` |
| j / J | 다음 카드로 포커스 | `/` 화면, 입력 중 아님, ⌘·Ctrl·Alt 없음, IME 조합 아님 | `HotkeyListener.tsx:107-111` |
| k / K | 이전 카드로 포커스 | 같음 | `HotkeyListener.tsx:112-116` |
| / | 검색 입력창 포커스 | 같음 | `HotkeyListener.tsx:117-120` |
| b / B | 포커스 카드 북마크 토글 | 같음 + 포커스 카드 있음 | `HotkeyListener.tsx:121-125` |
| c / C | 포커스 카드로 `/chat?sourceId={id}` 이동 | 같음 + 포커스 카드 있음 | `HotkeyListener.tsx:126-130` |
| t / T | 테마 순환 (light→dark→system) | 같음 | `HotkeyListener.tsx:131-135` |
| Enter / 스페이스 | 포커스 카드 상세 모달 열기 | 같음. 포커스 카드가 없어도 기본 동작은 막힘 | `HotkeyListener.tsx:136-143` |
| ↑ / ↓ | 팔레트 항목 이동 (순환) | 팔레트 검색 입력창 포커스 | `CommandPalette.tsx:142-149` |
| Enter | 팔레트 선택 항목 실행 | 팔레트 검색 입력창 포커스 | `CommandPalette.tsx:150-155` |
| Enter | 챗 질문 전송 | 챗 입력창, Shift 없음, IME 조합 아님 | `ChatPromptInput.tsx:50-59` |
| Shift+Enter | 챗 입력창 줄바꿈 | 챗 입력창 | `ChatPromptInput.tsx:50-59` (기본 동작) |
| Escape | 챗 기록 드로어 / 포커스 필터 / 모델 선택 / 인용 팝오버 / 삭제 확인 닫기 | 각 오버레이가 열려 있을 때 | `ChatHistoryDrawer.tsx:52`, `FocusBottomSheet.tsx:68`, `ChatModelSelector.tsx:64`, `CitationPopover.tsx:27`, `DeleteConfirmPopover.tsx:30` |
| ↑ ↓ ← → | 모델 항목 이동 (순환) | 모델 선택 radiogroup 포커스 | `ChatModelSelector.tsx:93-103` |
| Enter / 스페이스 | 모델 선택, 세션 선택, 포커스 필터 열기 | 각 요소 포커스 | `ChatModelSelector.tsx:104-106`, `SessionItemCard.tsx:54-59`, `FocusCapsule.tsx:75-80` |

## 상수·설정값
| 이름 | 값 | 위치 |
|---|---|---|
| 테마 저장 키 | `agentlens_theme` (`light` / `dark` / `system`) | `context/ThemeContext.tsx:46` |
| 기본 테마 | `system` | `context/ThemeContext.tsx:45` |
| 테마 순환 순서 | light → dark → system → light | `context/ThemeContext.tsx:115-130` |
| `<html>` 테마 표시 | 클래스 `dark`/`light`, 속성 `data-theme` | `context/ThemeContext.tsx:71-84` |
| 북마크 저장 키 | `agentlens_bookmarks` | `hooks/useBookmarks.ts:6` |
| 헤더 스케줄 재조회 주기 | 30,000ms | `components/Header.tsx:47` |
| 수집 진행 폴링 주기 | 1,200ms | `components/Header.tsx:80` |
| 수집 완료 메시지 표시 | 4,000ms | `components/Header.tsx:73` |
| 수집 요청 실패 메시지 표시 | 3,000ms | `components/Header.tsx:91` |
| 헤더 버전 표시 | `v0.1.0` (고정 문자열) | `components/Header.tsx:124` |
| 팔레트 명령 수 | 5 | `components/CommandPalette.tsx:38-108` |
| 팔레트 위치·크기 | `pt-20`, `max-w-xl`, 목록 `max-h-80` | `components/CommandPalette.tsx:165-198` |
| 복사 피드백 | 2,000ms | `MarkdownViewer.tsx:29`, `McpModal.tsx:65`, `DailyBriefingModal.tsx:55`, `NewsDetailModal.tsx:190` |
| 소스 모달 토스트 | 3,500ms | `components/SourcesModal.tsx:63` |
| 바텀시트 스와이프 닫기 거리 | 100px | `components/chat/FocusBottomSheet.tsx:85` |
| 챗 입력창 최대 높이 | 180px | `components/chat/ChatPromptInput.tsx:46` |
| 챗 입력창 포커스 스크롤 지연 | 100ms | `components/chat/ChatPromptInput.tsx:73-75` |
| 챗 사이드바/드로어 전환 기준 | 1024px (`window.innerWidth`, `lg`) | `components/chat/ChatWorkspace.tsx:604`, `:634` |
| 레이어 | 홈 헤더 z-40, 모달 z-50, 챗 헤더 z-30, 챗 사이드바 z-20 | 각 파일 |
| 오버레이 배경 통일색 | `rgba(15, 23, 42, 0.6)` + `blur(4px)` (`bg-black/60·70·75`) | `app/globals.css:215-220` |
| 스크롤바 | 6px, 라이트 `#cbd5e1`, 다크 `#30363d` | `app/globals.css:222-251` |
| viewport | `device-width`, scale 1, 최대 1, 확대 금지, `resizes-content` | `app/layout.tsx:9-15` |

## 알려진 불일치·위험
1. **`dark:` 유틸리티와 테마 토글이 어긋난다.** `globals.css` 에 `@custom-variant dark` 선언이 없다. Tailwind 4 의 기본 `dark:` 변형은 `<html>` 의 `dark` 클래스가 아니라 OS 의 `prefers-color-scheme` 를 따른다. `ThemeProvider` 는 클래스만 바꾸므로 `dark:` 클래스를 쓴 컴포넌트(커맨드 팔레트, 테마 버튼, 뉴스 카드, 챗 메시지·모델 선택·익스포트 툴바 등 8개 파일, 74줄)는 사용자가 고른 테마가 아니라 OS 설정을 따른다. 반면 `globals.css` 의 `html.dark …` / `html:not(.dark) …` 덮어쓰기는 고른 테마를 따른다. 사용자가 고른 테마와 OS 설정이 다르면 한 화면에 두 테마가 섞일 수 있다 (브라우저에서 확인하지 않았다).
2. **홈 화면에서 Enter·스페이스 기본 동작이 막힌다.** `HotkeyListener` 는 입력창이 아닌 곳의 Enter·스페이스를 `onOpenDetailModal` 이 있으면 항상 `preventDefault()` 한다. 버튼·링크는 '입력 중' 예외에 들어가지 않아, 키보드로 포커스한 버튼·링크를 Enter/스페이스로 실행하는 동작과 스페이스 페이지 스크롤이 막힐 수 있다. 포커스 카드가 없을 때(-1)도 막힌다 (`HotkeyListener.tsx:136-143`).
3. **단일 키 단축키가 모달 위에서도 배경에 적용된다.** 모달이 열려 있어도 `j`/`k`/`b`/`c`/`t`/Enter 가 배경 피드의 포커스 카드에 동작한다. 예: 뉴스 상세 모달에서 `c` 를 누르면 모달 기사가 아니라 배경 포커스 카드로 챗 이동한다.
4. **Escape 가 모달을 한꺼번에 닫는다.** 일일 브리핑 → 연동 설정으로 겹쳐 연 상태에서 Escape 는 위 모달만이 아니라 둘 다 닫는다. 입력 중에도 동작하므로 Ask AI 입력 중 Escape 를 누르면 상세 모달이 닫히고 대화 기록이 지워진다.
5. **⌘K 처리가 세 곳에 나뉘어 있다.** 헤더 자체 리스너, 팔레트 리스너, `HotkeyListener`(홈에서 콜백 없이 기본 동작만 막음). 지금은 결과가 맞지만 `HotkeyListener` 에 `onToggleCommandPalette` 를 연결하면 토글이 두 번 일어나 팔레트가 열리지 않게 된다.
6. **팔레트 단축키 표시와 실제 키가 다르다.** '챗 이동' 옆 `C` 는 전역 `c`(포커스 카드 핸드오버)와 동작이 다르다. 팔레트가 열려 있으면 입력창에 포커스가 있어 `C`/`T` 는 검색어로 입력된다. 팔레트를 닫아도 검색어가 남는다.
7. **모달 접근성이 고르지 않다.** 커맨드 팔레트·포커스 필터 외의 모달에는 `role="dialog"`·`aria-modal`·제목 연결이 없고, 아이콘만 있는 닫기 버튼에 `aria-label` 이 없다. 포커스 가두기와 닫은 뒤 포커스 복귀가 없다. 배경 클릭 닫기도 모달마다 다르다 (UI-08 표).
8. **세션 삭제 확인의 Escape 가 드로어까지 닫는다.** `DeleteConfirmPopover` 는 window 리스너에서 `stopPropagation()` 만 해 다른 window 리스너를 막지 못한다 (`DeleteConfirmPopover.tsx:30-33`).
9. **애니메이션 클래스 정의가 없다.** `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-left`, `slide-in-from-top`, `animate-fade-in` 등을 컴포넌트 18줄에서 쓰지만 `tailwindcss-animate`/`tw-animate-css` 같은 플러그인이 의존성에 없고 `globals.css` 에도 정의가 없다. 열고 닫는 애니메이션은 적용되지 않는 것으로 보인다.
10. **확대 금지 viewport.** `maximumScale: 1`, `userScalable: false` 는 핀치 확대를 막아 저시력 사용자 접근성에 불리하다. 테스트(`MobileViewport.test.tsx`)가 이 값을 고정한다.
11. **테마 첫 화면 깜빡임 가능성.** 테마를 `<head>` 에서 미리 적용하지 않고 hydrate 뒤 effect 에서 `<html>` 클래스를 바꾼다. 저장된 테마가 서버 기본값(`system`→`light`)과 다르면 첫 화면이 잠깐 다른 테마로 보일 수 있다. 또 `useState` 초기화에서 localStorage 를 읽어 서버·클라이언트 첫 렌더가 다를 수 있다.
12. **수집 진행 폴링이 정리되지 않는다.** `pollProgress` 의 `setInterval` 은 완료·오류 때만 멈추고 헤더 언마운트(예: 수집 중 `/chat` 이동) 때 정리하지 않는다. 화면을 떠난 뒤에도 1.2초마다 요청과 `onRefresh` 가 이어질 수 있다. 즉시 수집을 팔레트·버튼에서 빠르게 두 번 누르면 `isCollecting` 이 갱신되기 전 두 번 요청될 여지도 있다.
13. **헤더 버전 표시가 실제 버전과 다르다.** 헤더는 `v0.1.0` 고정, `package.json` 과 `/api/health` 응답은 `0.3.1` 이다.
14. **스케줄 버튼이 모바일에서 사라진다.** 640px 미만에서 헤더 스케줄 버튼이 `hidden` 이고 팔레트에도 스케줄 명령이 없어 스케줄 모달을 열 방법이 없다.
15. **피드 포커스가 화면 밖으로 나가도 스크롤되지 않고, 필터를 바꿔도 초기화되지 않는다** (UI-06).
16. **클립보드 실패 처리 없음.** `navigator.clipboard` 는 보안 컨텍스트(HTTPS, localhost)에서만 있다. `next.config.ts` 의 `allowedDevOrigins` 에 LAN IP(`192.168.1.109`)가 있어 HTTP 로 접속하는 경우가 있는데, 이때 `ExportToolbar` 외의 복사 버튼은 예외가 처리되지 않고 '복사됨' 피드백도 정확하지 않을 수 있다.
17. **챗 헤더 `피드` 글자와 `aria-controls` 대상 없음.** `xs:` 브레이크포인트가 정의되지 않아 글자가 보이지 않고, `aria-controls="chat-history-drawer"` 의 대상 `id` 가 없다.
18. **1024px 미만에서 챗 헤더 '새 대화' 버튼이 숨겨진다.** `isSidebarOpen` 기본값 true 가 화면 너비와 관계없이 '새 대화' 버튼을 숨긴다 (UI-09).
19. **스케줄 모달만 항상 어두운 색이다.** `zinc-900` 계열을 직접 써서 라이트 모드에서도 어둡다. 다른 모달은 흰 배경 + 테마 덮어쓰기다.
20. **`ThemeToggle` 의 `showDropdown` 과 `HotkeyMapping` 의 `modifiers`·`allowInInputs` 는 선언만 있고 동작하지 않는다.**
