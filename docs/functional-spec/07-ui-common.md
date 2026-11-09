# 기능명세: UI 공통

Updated: 2026-11-09

## 개요
화면 여러 곳에 걸치는 UI 동작을 정리한다. 뉴스 피드 화면(`/`)의 헤더, 테마(라이트·다크·시스템), 전역 단축키, 커맨드 팔레트, 대화상자·오버레이 공통 규칙, 반응형 레이아웃, 모바일 뷰포트 대응, 로딩·오류·빈 상태 표시, 마크다운 렌더링, 복사 피드백, 접근성 속성이 대상이다. 화면 구성과 컴포넌트 목록은 `../ui-spec.md`, 색·간격·부품 같은 디자인 규칙은 [../design-system.md](../design-system.md) 에 있다.

- 테마 상태는 루트 레이아웃(`frontend/src/app/layout.tsx:35`)의 `ThemeProvider` 가 모든 화면에 제공한다.
- 피드 헤더(`Header`)와 단일 키 단축키(`HotkeyListener`)는 뉴스 피드 화면(`/`)에만 있다. `/chat` 화면은 자체 헤더(`ChatHeader`)를 쓰고, 커맨드 팔레트(⌘K)와 테마 선택은 두 화면 모두에 있다.
- 대화상자·드로어·확인 창·메뉴·팝오버는 공통 부품(`frontend/src/components/ui/`)과 오버레이 스택(`frontend/src/lib/overlay-stack.ts`) 위에서 같은 규칙으로 동작한다 (UI-08).
- UI 문구는 한국어다 (`<html lang="ko">`, `frontend/src/app/layout.tsx:30`).
- 아이콘은 모두 `lucide-react` 컴포넌트(장식이면 `aria-hidden`)로 그리고, 프론트가 정한 UI 글자(버튼·탭·라벨·제목·알림 문구)에는 그림 이모지를 쓰지 않는다. 그림 이모지는 기본이 이모지 표현인 글자(`Emoji_Presentation`)와 U+FE0F 로 이모지 표현을 고른 그림 문자다. `©`·`↔`·`➔`·`✓` 같은 텍스트 표현 기호는 해당하지 않는다. 정적 검사 `frontend/src/tests/ui/IconGuard.test.ts` 가 `src/components/**`·`src/app/**` 의 `.ts`·`.tsx` 를 검사한다. backend 가 만든 글자(브리핑 마크다운 전문, 챗 단계 라벨)와 사용자·기사 글은 대상이 아니다.

## 기능 목록
| ID | 기능 | 설명 | 진입점 |
|---|---|---|---|
| UI-01 | 피드 헤더 | 브랜드, 주 내비, 수집 상태·즉시 수집, 팔레트, 테마, 더보기 메뉴를 담은 56px 한 줄 상단 바. 폭에 따라 요소를 줄이고 나머지는 더보기 메뉴로 옮긴다 | `/` 상단 |
| UI-02 | 수집 진행 줄과 초기화 확인 창 | 헤더 아래에 수집 진행 메시지를 보여 주고, 초기화 전에 확인 창을 띄운다 | 헤더 '즉시 수집', 더보기 메뉴, 스케줄 대화상자, 팔레트 |
| UI-03 | 테마 시스템 | light·dark·system 세 모드, OS 설정 추종, localStorage 저장, 첫 그리기 전 적용, `<html>` 클래스 적용 | 루트 레이아웃 |
| UI-04 | 테마 선택 메뉴 | 라이트·다크·시스템 중 하나를 고르는 메뉴. 단축키·팔레트는 순환 | 피드 헤더(md 이상), 피드·챗 더보기 메뉴 |
| UI-05 | 전역 단축키 | 단일 키 단축키, 입력창·IME·오버레이 예외 | `/` 화면 전체 (window keydown) |
| UI-06 | 피드 키보드 탐색 | j/k 로 카드 포커스를 옮기고 포커스 카드에 상세·북마크·챗 이동을 실행 | `/` 뉴스 카드 그리드 |
| UI-07 | 커맨드 팔레트 | 명령을 검색·선택·실행하는 대화상자. 피드 9개, 챗 4개 | ⌘K / Ctrl+K, 헤더 팔레트 버튼 |
| UI-08 | 대화상자·오버레이 공통 규칙 | 대화상자·드로어·시트·확인 창·메뉴·팝오버의 열기/닫기, 포커스, 배경, 레이어, 폭별 배치 | 각 대화상자 |
| UI-09 | 반응형 레이아웃 | 모바일·태블릿·데스크톱 배치, 요소 숨김, 가로 스크롤 방지 | 모든 화면 |
| UI-10 | 모바일 뷰포트·가상 키보드 대응 | 가상 키보드 높이 추종, 입력창 스크롤, safe-area 여백 | `/chat`, 루트 레이아웃 |
| UI-11 | 로딩·오류·빈 상태 표시 | 데이터 영역별 스켈레톤·스피너, 오류 표시와 재시도, 빈 상태 안내 | 피드, 챗 기록, 대화상자 |
| UI-12 | 마크다운 렌더링 | GFM 마크다운을 스타일 입힌 요소로 그리고, 코드 블록에 복사 버튼을 단다 | 상세 요약, 브리핑, Ask AI, 챗 답변 |
| UI-13 | 복사 피드백 | 클립보드 복사(실패 시 대체 방식) 뒤 2초 동안 `복사됨`/`복사 실패` 표시 | 코드 블록, MCP 설정, 브리핑, Ask AI, 챗 답변 |
| UI-14 | 접근성 속성 | role, aria-* 속성, 키보드 조작 지원 범위 | 대화상자, 메뉴, 팔레트, 피드, 챗 컴포넌트 |

## UI-01 피드 헤더
- 진입점: 뉴스 피드 화면(`/`)의 최상단. `HomePage` 가 `Header` 를 렌더하고 바로 아래에 수집 진행 줄(`CollectorStatusLine`, UI-02)을 둔다 (`frontend/src/app/page.tsx:155-165`).
- 입력: props `onRefresh`(필수), `onOpenSchedule`(필수), `onOpenMcp`(필수), `onOpenWebhook`(선택), `onOpenSources`(선택). 홈 화면은 다섯 개를 모두 넘긴다.
- 처리 규칙:
  1. `<header>` 는 `sticky top-0 z-30 h-14`(56px), `bg-surface/95 backdrop-blur border-b`, 줄바꿈 없는 한 줄이다. 안쪽은 `max-w-7xl`, 좌우 여백 16/24/32px(`px-4 md:px-6 lg:px-8`) (`Header.tsx:122`, `:129`).
  2. 맨 앞에 건너뛰기 링크 `본문으로 건너뛰기`(`#main`)가 있다. 평소에는 `sr-only` 이고 포커스를 받으면 보인다 (`Header.tsx:123-128`).
  3. 요소와 폭별 모양 (`Header.tsx:131-203`):
     | 순서 | 요소 | 1024px 이상 | 768~1023px | 768px 미만 | 동작 |
     |---|---|---|---|---|---|
     | 1 | 브랜드 | 아이콘 + `AgentLens` + 버전 배지 `v{NEXT_PUBLIC_APP_VERSION}` (빌드 때 `next.config.ts` 가 `package.json` 의 `version` 을 넣는다. 값이 없으면 숨김) | 아이콘 + `AgentLens` | 같음 | `/` 링크 |
     | 2 | 주 내비 (`<nav aria-label="주 메뉴">`) | `피드`(`aria-current="page"`) · `AI 챗` 글자 링크 | 같음 | `AI 챗` 아이콘 링크 (글자는 `sr-only`) | `/`, `/chat` |
     | 3 | 수집 상태 | 시계 아이콘 + `다음 수집 {h}h {m}m 후` (수집 중: 스피너 + `수집 중`) | 시계 아이콘 + `{h}h {m}m` | 더보기 메뉴 `수집 스케줄 (다음 {h}h {m}m 후)` | 스케줄 대화상자 |
     | 4 | 즉시 수집 | `Button secondary` 아이콘 + `즉시 수집` (수집 중: 스피너 + `수집 중`, 비활성) | 아이콘 버튼 (이름 `즉시 수집`) | 더보기 메뉴 `즉시 수집` / `수집 중`(비활성) | 수동 수집 (UI-02) |
     | 5 | 커맨드 팔레트 | `검색·명령` + `⌘K` 버튼 | `IconButton` `커맨드 팔레트 열기` | 같음 | 팔레트 (UI-07) |
     | 6 | 테마 | `ThemeMenu` (`테마 선택`) | 같음 | 더보기 메뉴의 `테마` 라디오 3개 | 테마 선택 (UI-04) |
     | 7 | 더보기 (`MenuButton` `더보기`) | `소스 & 리서처`, `공유 & 알림`, `MCP 연동`, `RSS 피드`(새 탭), 구분선, `초기화 & 재수집…`(위험 톤) | 같음 | 위 4개 + 구분선 + `수집 스케줄`, `즉시 수집`, 구분선 + `테마` 라디오 3개 + 구분선 + `초기화 & 재수집…` | 각 대화상자 / 확인 창 |
  4. `소스 & 리서처`, `공유 & 알림` 항목은 각각 `onOpenSources`, `onOpenWebhook` 이 있을 때만 들어간다. `초기화 & 재수집…` 은 수집 중이면 비활성이다 (`Header.tsx:85-119`). 커맨드 팔레트의 초기화 명령도 수집 중이면 비활성(`aria-disabled`)이다.
  5. 768px 미만 판정은 CSS 와 함께 `useMediaQuery('(max-width: 767px)')` 를 쓴다. 이 값으로 테마 메뉴를 그릴지, 더보기 메뉴에 모바일 항목을 넣을지 정한다 (`Header.tsx:64`, `:90`, `:200`).
  6. 남은 시간 `{h}h {m}m` 은 `GET /api/schedule/status` 의 `minutes_until_next_run` 으로 계산한다. 시 = `floor(분/60)`, 분 = `round(분 % 60)`, 시가 0 이면 `{m}m`. 0 이하이거나 숫자가 아니면 0 으로 본다. 상태를 아직 모르면 데스크톱 `다음 수집 확인 중`, 태블릿 `…`, 모바일 메뉴 `수집 스케줄` 이다 (`hooks/useCollector.ts:247-252`, `Header.tsx:83`, `:94`, `:164-165`).
  7. 수집 상태 버튼의 접근 이름은 `수집 스케줄 · {다음 수집 … 후 | 다음 수집 확인 중}` 이다 (`Header.tsx:160`).
  8. 스케줄 상태는 수집 상태 저장소(`useCollector`)가 구독자가 생길 때 한 번, 그 뒤 30,000ms 마다 다시 읽는다. 실패는 조용히 무시하고, 늦게 도착한 오래된 응답은 버린다 (UI-02 규칙 10) (`hooks/useCollector.ts:104-119`, `:167-170`).
  9. ⌘K / Ctrl+K 는 헤더의 `useHotkey('mod+k')` 가 받는다 (UI-07). 커맨드 팔레트와 초기화 확인 창은 헤더가 가진다 (`Header.tsx:69-81`, `:207-218`).
- 출력: 상단 바, 커맨드 팔레트(UI-07), 초기화 확인 창(UI-02).
- 예외·엣지:
  - 서버 렌더와 하이드레이션 첫 렌더에서는 `useMediaQuery` 가 false 라 모바일에서도 잠깐 데스크톱 기준(테마 메뉴 있음, 더보기에 모바일 항목 없음)으로 그린다. 테마 메뉴 자체는 CSS 가 아니라 이 값으로 숨기므로 첫 렌더 직후 사라진다.
  - 헤더는 줄바꿈하지 않는다. 360px 에서 브랜드 + 아이콘 버튼 3개(AI 챗, 팔레트, 더보기)가 한 줄에 들어간다.
- 관련 코드: `frontend/src/components/Header.tsx:1-221`, `frontend/src/hooks/useCollector.ts`, `frontend/src/app/page.tsx:155-165`, 동작 확인 테스트 `frontend/src/tests/Header.test.tsx`

## UI-02 수집 진행 줄과 초기화 확인 창
- 진입점: 즉시 수집 — 헤더 `즉시 수집`(md 이상), 더보기 `즉시 수집`(768px 미만), 스케줄 대화상자 바닥 `즉시 수집`, 팔레트 `최신 소식 즉시 수집 트리거`. 초기화 — 더보기 `초기화 & 재수집…`, 스케줄 대화상자 '위험 영역' `초기화 & 재수집…`, 팔레트 `수집 데이터 초기화 & 재수집`.
- 입력: 없음 (버튼 클릭).
- 처리 규칙:
  1. 수집 상태는 모듈 단위 저장소 하나(`useCollector`)에 있다. 헤더, 수집 진행 줄, 스케줄 대화상자, 초기화 확인 창이 같은 값(`status`, `isCollecting`, `message`)을 본다 (`hooks/useCollector.ts:31-38`, `:266-291`).
  2. 즉시 수집: 수집 중이거나 요청 중이면 아무것도 하지 않는다. `POST /api/schedule/trigger` 를 부르고, 성공하면 메시지 `실시간 소식 수집 중...` 으로 진행 폴링을 시작한다. 응답 `status` 가 `already_running`(backend 가 이미 수집 중이라 새로 시작하지 않음)이면 응답 `message` 로 진행 폴링을 시작해 진행 중인 수집을 따라간다. 요청 자체가 실패하면 `수집 요청 실패` 를 3,000ms 동안 보여 준다 (`hooks/useCollector.ts:206-223`).
  3. 진행 폴링: 1,200ms 마다 `GET /api/schedule/progress` 를 읽는다. 앞 요청이 끝나지 않았으면 그 회차는 건너뛴다 (`hooks/useCollector.ts:121-165`).
     - `step_message` 가 있으면 진행 줄 메시지를 그것으로 바꾼다.
     - `items_saved` 가 직전보다 늘면 등록된 새로고침 콜백(`onRefresh`, 피드·통계·브리핑 다시 읽기)을 부른다.
     - `is_running` 이 false 가 되면 폴링을 멈추고 `수집 완료 (+{items_saved}건 신규 반영)` 를 보여 준 뒤, 새로고침과 스케줄 상태 재조회를 하고 4,000ms 뒤 메시지를 지운다. 이 재조회 응답은 반영된다 (규칙 10).
     - 폴링 요청이 실패하면 폴링을 멈추고 메시지를 바로 지운다. 이때는 스케줄 상태를 바로 다시 읽지 않는다 (진행 조회만 계속 실패하면 폴링이 1.2초마다 켜졌다 꺼지므로). 수집이 아직 돌고 있으면 다음 30초 재조회가 규칙 9 로 다시 붙인다.
  4. 수집 진행 줄: `<header>` 밖, 헤더 바로 아래 한 줄(`h-9`, `bg-surface-muted`)이다. 스크롤하면 함께 올라간다. 메시지가 있을 때만 보이고, 알림 영역(`role="status" aria-live="polite"`)은 항상 DOM 에 있다. 수집 중이면 스피너와 오른쪽 문구 `피드 실시간 반영 중`(640px 이상), 끝나면 초록 체크 아이콘이다 (`Header.tsx:226-250`).
  5. 초기화 확인 창: `ResetConfirmDialog` → `ConfirmDialog tone="danger"` (`role="alertdialog"`, 768px 미만 바텀시트). 제목 `수집 데이터 전체 삭제 및 재수집`, 영구 삭제 경고 문구, 버튼 `취소`(처음 포커스)와 `전체 삭제 후 다시 수집` (`ResetConfirmDialog.tsx:44-60`).
  6. 확인을 누르면 `POST /api/schedule/reset-and-collect` 를 부른다. 진행 중에는 확인 버튼이 `초기화 중...`(스피너)으로 바뀌고 `busy` 라 두 버튼이 비활성, Escape·배경막도 무시된다. 성공하면 창을 닫고 새로고침 후 `기존 {deleted_count}건 삭제 완료. 신규 수집 중...` 메시지로 진행 폴링을 시작한다. 이미 요청 중이면 다시 보내지 않는다 (`ResetConfirmDialog.tsx:29-42`, `hooks/useCollector.ts:229-244`). 진행 폴링은 시작할 때마다 회차 번호를 올리고, 이전 회차의 늦은 응답은 버린다.
  7. 초기화가 실패하면 창을 닫지 않고 창 안 `InlineAlert` 로 오류 메시지(없으면 `초기화 실패`)를 보여 준다. 응답 `status` 가 `already_running`(backend 가 수집 중이라 삭제하지 않음)이어도 실패로 다룬다: 응답 `message`(없으면 `현재 수집이 진행 중이므로 초기화할 수 없습니다.`)를 창 안 오류로 보이고, 새로고침·진행 폴링을 시작하지 않는다 (`hooks/useCollector.ts:236-238`).
  8. 마지막 구독자(헤더 등)가 언마운트되면 스케줄 재조회·진행 폴링·메시지 타이머를 모두 정리하고 상태를 처음으로 되돌린다. 정리 뒤에 도착한 응답은 버린다 (`hooks/useCollector.ts:172-196`).
  9. 수집 상태 복원: 스케줄 상태(첫 구독 때와 30초 재조회 때)가 `is_running: true` 이고 진행 폴링이 돌고 있지 않으면 `실시간 소식 수집 중...` 으로 진행 폴링을 시작한다. 그래서 수집 중에 다른 화면에 갔다 돌아와도, 이 화면 밖에서 시작된 수집(정기 스케줄 등)이어도 진행 줄과 `isCollecting`(즉시 수집 `수집 중`·비활성)이 다시 붙는다 (`hooks/useCollector.ts:104-119`).
  10. 오래된 스케줄 상태 응답 버리기: 스케줄 상태 요청마다 번호(`statusSeq`)를 매기고, 마지막으로 반영한 응답 번호(`appliedStatusSeq`)와 진행 폴링이 완료·실패로 끝날 때의 번호(`progressEndSeq`)를 기억한다. 응답 번호가 `appliedStatusSeq` 보다 작거나(더 나중 요청의 응답이 이미 반영됨) `progressEndSeq` 이하이면(진행 폴링이 끝나기 전에 보낸 요청) 상태도 폴링도 바꾸지 않고 버린다. 그래서 수집 중에 나간 30초 재조회의 `is_running: true` 응답이 진행 폴링이 완료를 본 뒤에 늦게 도착해도 폴링이 다시 켜지지 않고, 수집 한 번에 `수집 완료` 는 한 번만 뜬다. 완료 처리에서 부르는 재조회는 `progressEndSeq` 를 정한 뒤에 보내므로 반영된다. 마지막 구독자가 빠지면(규칙 8) 세 번호를 0 으로 되돌린다 (`hooks/useCollector.ts:58-66`, `:104-119`, `:134-149`).
- 출력: 진행 줄 메시지, 피드 갱신.
- 예외·엣지:
  - 초기화 확인 창은 Escape·배경막·`취소` 로 닫힌다 (진행 중 제외).
  - 스케줄 대화상자 안에서 초기화 확인 창을 열면 스케줄 대화상자 위에 쌓이고, Escape 는 확인 창만 닫는다.
  - 수집 중에 `/chat` 으로 이동하면 정리 규칙(8)에 따라 폴링이 멈춘다. 다시 `/` 로 돌아오면 첫 스케줄 상태 조회에서 규칙 9 로 진행 줄이 다시 붙는다. 진행 줄 문구는 `실시간 소식 수집 중...` 으로 시작해 다음 진행 응답의 `step_message` 로 바뀐다.
  - 스케줄 상태를 받기 전(돌아온 직후 응답 전)에 `즉시 수집` 을 누르면 요청이 간다. backend 가 `already_running` 으로 답해 새 수집은 시작되지 않고, 규칙 2 대로 진행 폴링만 붙는다.
- 관련 코드: `frontend/src/hooks/useCollector.ts:1-293`, `frontend/src/components/Header.tsx:226-250`, `frontend/src/components/ResetConfirmDialog.tsx:1-62`, `frontend/src/components/ScheduleModal.tsx:14-84`, `frontend/src/lib/api.ts:190-202`, `:246-256`, 동작 확인 테스트 `frontend/src/tests/hooks/useCollector.test.ts`, `frontend/src/tests/Header.test.tsx`

## UI-03 테마 시스템
- 진입점: `RootLayout` 의 `<head>` 인라인 스크립트와 `<body>` 안 `ThemeProvider` (`frontend/src/app/layout.tsx:22-40`). 컴포넌트는 `useTheme()` 으로 읽는다.
- 입력: `ThemeProvider` props — `defaultTheme`(기본 `'system'`), `storageKey`(기본 `'agentlens_theme'`), `attribute`(기본 `'class'`). 루트 레이아웃은 기본값을 그대로 쓴다.
- 처리 규칙:
  1. 모드는 `'light' | 'dark' | 'system'` 세 가지다. 컨텍스트 값은 `theme`(선택한 모드), `resolvedTheme`(실제 적용된 `'light' | 'dark'`), `toggleTheme()`, `setTheme(mode)` 이다 (`ThemeContext.tsx:16-25`).
  2. 첫 그리기 전: `<head>` 인라인 스크립트가 `localStorage['agentlens_theme']`(세 값이 아니면 `system`)와 `prefers-color-scheme` 으로 `<html>` 의 `dark`/`light` 클래스, `data-theme`, `style.colorScheme` 을 정한다. 예외는 무시한다 (`layout.tsx:22-26`).
  3. 상태 원천: `ThemeProvider` 는 `lib/theme-store.ts` 의 외부 저장소를 `useSyncExternalStore` 로 읽는다. 스냅샷을 만들 때마다 `localStorage[storageKey]`(세 값 중 하나가 아니면 `defaultTheme`, 읽기 예외면 인스턴스 안 대체값 또는 `defaultTheme`)와 `matchMedia('(prefers-color-scheme: dark)').matches`(`matchMedia` 가 없으면 light)를 새로 읽는다 (`ThemeContext.tsx:50-53`, `lib/theme-store.ts:65-83`).
  4. 변경 알림: 같은 탭의 `setTheme`/`toggleTheme` 은 `agentlens:theme-change` window 이벤트로, 다른 탭의 변경은 `storage` 이벤트로, OS 설정 변경은 `matchMedia` `change`(없으면 `addListener`)로 알린다 (`lib/theme-store.ts:95-127`).
  5. `resolvedTheme` = `theme` 가 `'system'` 이면 OS 설정, 아니면 `theme` (`lib/theme-store.ts:29-32`).
  6. DOM 적용: `resolvedTheme` 가 바뀔 때마다 `useLayoutEffect` 로 `<html>` 에 `dark` 또는 `light` 클래스 하나, `data-theme`, `style.colorScheme` 을 단다 (`ThemeContext.tsx:56-58`, `lib/theme-store.ts:133-144`).
  7. 순환 순서: `light → dark → system → light` (`lib/theme-store.ts:23-27`).
  8. 저장: `setMode` 가 새 모드를 `localStorage[storageKey]` 에 쓴다. 쓰기 예외면 인스턴스 안 대체값에 둔다 (`lib/theme-store.ts:85-93`).
  9. 스타일 반영: 색 토큰 변수가 `.dark` 클래스에서 다크 값으로 바뀌고, `dark:` 변형도 `<html class="dark">` 를 따른다 (`globals.css:2`, `:38-67`). 토큰은 `../design-system.md` 참고.
- 출력: `<html>` 의 `class`·`data-theme`·`style.colorScheme`, `localStorage['agentlens_theme']`.
- 예외·엣지:
  - Provider 밖에서 `useTheme()` 을 부르면 기본값(`theme: 'system'`, `resolvedTheme: 'light'`, 아무것도 안 하는 함수)을 받는다 (`ThemeContext.tsx:37-42`).
  - 서버 렌더와 하이드레이션 첫 렌더는 서버 스냅샷(`defaultTheme`, light)으로 그리고 바로 클라이언트 값으로 다시 그린다. 색은 인라인 스크립트가 이미 적용해 깜빡이지 않는다. `<html>` 에 `suppressHydrationWarning` 이 있다 (`layout.tsx:30`).
- 관련 코드: `frontend/src/context/ThemeContext.tsx:1-73`, `frontend/src/lib/theme-store.ts:1-144`, `frontend/src/app/layout.tsx:22-40`, `frontend/src/app/globals.css`, 동작 확인 테스트 `frontend/src/tests/ThemeSystem.test.tsx`

## UI-04 테마 선택 메뉴
- 진입점: 피드 헤더 `테마 선택` 메뉴(768px 이상, `Header.tsx:200`), 피드 더보기 메뉴의 `테마` 라디오(768px 미만, `Header.tsx:105-109`), 챗 헤더 더보기 메뉴의 `테마` 라디오(모든 폭, `ChatHeader.tsx:79-91`). 단축키 `t`(UI-05, `/` 만)와 팔레트 테마 명령(UI-07, 두 화면)은 `toggleTheme()` 으로 순환한다.
- 입력: `ThemeMenu` props `align`(기본 `end`), `variant`, `className`.
- 처리 규칙:
  1. `ThemeMenu` 는 `MenuButton label="테마 선택"` 이다. 트리거 아이콘은 현재 모드(`light` 해, `dark` 달, `system` 노트북)를 보여 준다 (`ui/ThemeMenu.tsx:21-31`).
  2. 항목은 `menuitemradio` 3개 `라이트`·`다크`·`시스템` 이고 현재 모드에 `aria-checked="true"` 다. 고르면 `setTheme(mode)` 로 바로 적용·저장한다 (UI-03).
  3. 더보기 메뉴의 테마 라디오도 같은 3개를 `테마` 그룹 제목 아래에 둔다.
  4. 메뉴 열기·닫기·키보드 규칙은 UI-08, UI-14 의 메뉴 규칙을 따른다.
- 출력: 테마 변경 (UI-03).
- 예외·엣지: `ThemeToggle`(한 번 누를 때마다 순환하는 `IconButton` `테마 전환`, `showDropdown` 이면 `ThemeMenu`)은 남아 있지만 렌더하는 곳이 없다 (`ThemeToggle.tsx:18-48`).
- 관련 코드: `frontend/src/components/ui/ThemeMenu.tsx:1-34`, `frontend/src/components/ui/Menu.tsx`, `frontend/src/components/Header.tsx:47-51`, `:105-109`, `:200`, `frontend/src/components/chat/ChatHeader.tsx:36-91`, `frontend/src/components/ThemeToggle.tsx`

## UI-05 전역 단축키
- 진입점: `HomePage` 가 `HotkeyListener` 를 렌더한다 (`page.tsx:140-154`). `window` 의 `keydown` 을 듣고 화면에는 아무것도 그리지 않는다 (`return null`).
- 입력: 콜백 props `onNavigateFeed`, `onOpenDetailModal`, `onHandoverChat`, `onToggleBookmark`, `onFocusSearch`, `onToggleTheme`, `onCloseOverlays`, `onToggleCommandPalette`, 추가 매핑 `customHotkeys`(기본 `[]`), `enabled`(기본 true), `blockSingleKeys`(기본 false). 홈 화면은 `onCloseOverlays`, `onToggleCommandPalette`, `customHotkeys` 를 넘기지 않고, `blockSingleKeys` 에 `useOverlayOpen()`(오버레이가 하나라도 열려 있는지)을 넘긴다.
- 처리 규칙 (판정 순서, `HotkeyListener.tsx:87-172`):
  1. `enabled` 가 false 면 리스너를 달지 않는다.
  2. IME 조합 중(`e.isComposing` 또는 `keyCode 229`)이면 무시한다.
  3. ⌘ 또는 Ctrl + `k`(`e.key` 또는 `e.code === 'KeyK'`): `onToggleCommandPalette` 를 넘겼을 때만 기본 동작을 막고 부른다. 홈 화면은 넘기지 않으므로 여기서 처리하지 않는다 (⌘K 는 `Header`, UI-07).
  4. `Escape`: `onCloseOverlays?.()` 를 부르고 끝낸다. 홈 화면은 넘기지 않는다 (Escape 는 오버레이 스택, UI-08).
  5. `blockSingleKeys` 가 true 면 끝낸다. 대화상자·드로어·메뉴·팝오버·팔레트가 열려 있으면 아래 키가 모두 무시된다.
  6. 대상 요소가 `INPUT`, `TEXTAREA`, `SELECT`, `contentEditable`, `role="combobox"` 이면 끝낸다.
  7. ⌘, Ctrl, Alt 중 하나라도 눌려 있으면 끝낸다. Shift 는 검사하지 않는다.
  8. 키 판정: `e.key` 소문자가 `j`·`k`·`b`·`c`·`t`·`/` 중 하나면 그 값, 아니면 `e.code`(`KeyJ`, `KeyK`, `KeyB`, `KeyC`, `KeyT`, `Slash`)로 바꾼다. 한글 입력 상태에서도 물리 키로 동작한다 (`HotkeyListener.tsx:47-64`).
  9. `customHotkeys` 에서 `key` 가 같은 첫 매핑의 `handler` 를 부르고 끝낸다. `modifiers`, `allowInInputs` 필드는 타입에만 있고 판정에 쓰지 않는다.
  10. 표준 단일 키: `j` → `onNavigateFeed(1)`, `k` → `onNavigateFeed(-1)`, `/` → `onFocusSearch()`, `b` → `onToggleBookmark()`, `c` → `onHandoverChat()`, `t` → `onToggleTheme()`. 모두 기본 동작을 막는다.
  11. `Enter` 또는 스페이스: `onOpenDetailModal` 이 있고 이벤트 대상이 `document.body` 일 때만 기본 동작을 막고 부른다. 버튼·링크·입력 등에 포커스가 있으면 가로채지 않는다 (`HotkeyListener.tsx:160-168`).
  12. 콜백 props 나 `blockSingleKeys` 가 바뀔 때마다 리스너를 다시 단다 (`HotkeyListener.tsx:176-188`).
- 홈 화면 연결 (`page.tsx:140-154`):
  | 콜백 | 연결된 동작 |
  |---|---|
  | `onNavigateFeed` | `handleNavigateFeed` — 카드 포커스 이동 (UI-06) |
  | `onOpenDetailModal` | 포커스 카드의 상세 대화상자 열기 |
  | `onHandoverChat` | 포커스 카드로 `/chat?sourceId={id}` 이동 |
  | `onToggleBookmark` | 포커스 카드 북마크 토글 |
  | `onFocusSearch` | 검색 입력창에 스크롤 없이 `focus()` 한 뒤 검색 영역을 `scrollIntoView({ block: 'nearest' })` (`page.tsx:145-151`) |
  | `onToggleTheme` | `useTheme().toggleTheme` |
  | `blockSingleKeys` | `useOverlayOpen()` |
- 출력: 콜백 실행.
- 예외·엣지:
  - Shift 를 검사하지 않아 `Shift+J` 등도 같은 동작을 한다.
  - `/chat` 화면에는 `HotkeyListener` 가 없다. 챗에서 쓰는 키는 ⌘K(UI-07)와 각 요소의 키 처리뿐이다 (단축키 표).
- 관련 코드: `frontend/src/components/HotkeyListener.tsx:1-191`, `frontend/src/app/page.tsx:38`, `:83-154`, `frontend/src/lib/overlay-stack.ts:146-149`, 동작 확인 테스트 `frontend/src/tests/HotkeyListener.test.tsx`, `frontend/src/tests/HotkeyGating.test.tsx`

## UI-06 피드 키보드 탐색
- 진입점: 홈 화면 뉴스 카드 그리드. 단축키 `j`, `k`, `Enter`/스페이스, `b`, `c` (UI-05).
- 입력: `focusedIndex` 상태 (초기값 -1, `page.tsx:36`).
- 처리 규칙:
  1. `j` 는 +1, `k` 는 -1 만큼 옮긴다. 결과가 0 보다 작으면 0, 목록 길이 이상이면 마지막 인덱스로 고정한다. 목록이 비어 있으면 아무것도 하지 않는다. 처음 `j` 를 누르면 -1 → 0 으로 첫 카드가 포커스된다 (`page.tsx:108-111`).
  2. 상태와 함께 실제 DOM 포커스를 그 카드(`[data-feed-card]`)의 제목 버튼(`h3 button`)으로 옮기고(`preventScroll`), 카드를 `scrollIntoView({ block: 'nearest' })` 로 화면 안에 넣는다 (`page.tsx:112-117`).
  3. 포커스 카드는 `isFocused` prop 으로 `ring-2 ring-accent ring-offset-2 ring-offset-canvas` 와 `data-focused="true"` 를 받는다 (`NewsCard.tsx:108-113`).
  4. 카드 열기: 제목 버튼에 포커스가 있으면 Enter/스페이스가 버튼의 기본 클릭이 되어 카드의 `onSelect` 로 상세 대화상자를 연다. 포커스가 `document.body` 에 있으면 `HotkeyListener` 가 `focusedIndex` 카드의 상세를 연다 (`page.tsx:120-124`).
  5. `c`: `focusedIndex >= 0` 이고 카드가 있으면 `router.push('/chat?sourceId={id}')` (`page.tsx:126-130`).
  6. `b`: 같은 조건에서 북마크를 토글하고 `localStorage['agentlens_bookmarks']` 에 저장한다 (`page.tsx:132-136`, `hooks/useBookmarks.ts`).
  7. 목록 키(`page`, `category`, `source`, `search`, `sort`, `highSignalOnly`)가 바뀌면 `focusedIndex` 를 -1 로 되돌린다 (`page.tsx:83-89`).
  8. 카드 제목은 `<button>` 이라 Tab 으로 갈 수 있고 Enter/스페이스로 상세를 연다 (`NewsCard.tsx:142-149`).
- 출력: 카드 강조 표시, 상세 대화상자, 화면 이동, 북마크 변경.
- 예외·엣지:
  - 마우스로 카드를 누르거나 Tab 으로 제목 버튼에 가도 `focusedIndex` 는 바뀌지 않는다. 그 상태에서 `b`/`c` 는 j/k 로 고른 카드에 적용된다.
  - 검색어를 한 글자 입력할 때마다 목록 키가 바뀌어 `focusedIndex` 가 -1 이 된다.
- 관련 코드: `frontend/src/app/page.tsx:36`, `:83-136`, `:235-250`, `frontend/src/components/NewsCard.tsx:80-149`, 동작 확인 테스트 `frontend/src/tests/HotkeyGating.test.tsx`, `frontend/src/tests/NewsCard.test.tsx`

## UI-07 커맨드 팔레트
- 진입점: ⌘K / Ctrl+K (`/` 는 `Header`, `/chat` 은 `ChatHeader` 의 `useHotkey('mod+k')`), 피드 헤더 `검색·명령 ⌘K` 버튼(1024px 이상)·`커맨드 팔레트 열기` 아이콘 버튼(1024px 미만), 챗 헤더 `커맨드 팔레트 열기`(768px 이상)·더보기 `커맨드 팔레트`(768px 미만).
- 입력: props `isOpen`, `onClose`, `onOpenSources`, `onOpenMcp`, `onTriggerCollect`, `onOpenSchedule?`, `onOpenSettings?`, `rssUrl?`, `onRequestReset?`, `commands?`. 피드 헤더는 `commands` 없이 나머지를 모두 넘긴다 (`Header.tsx:207-217`). 챗 화면은 `commands` 로 목록을 통째로 바꾼다 (`ChatWorkspace.tsx:758-762`).
- 처리 규칙:
  1. 피드 명령 (표시 순서, `CommandPalette.tsx:76-159`). 선택적 명령은 해당 prop 이 있을 때만 붙는다.
     | id | 제목 | 부제 | 실행 | 단축키 표시 |
     |---|---|---|---|---|
     | chat | AI 챗 워크스페이스 이동 | 기술 소식 기반 심층 질의응답 및 에이전틱 리서치 | `router.push('/chat')` | 없음 |
     | theme | 현재 모드에 따라 바뀜 (아래) | 시스템 및 개인 선호 테마 순환 토글 (Light -> Dark -> System) | `toggleTheme()` | T |
     | sources | 소스 관리 & AI 리서처 열기 | RSS 피드 및 GitHub 소스 등록, 자율 소스 탐색 | `onOpenSources()` | 없음 |
     | mcp | FastMCP 도구 설정 열기 | Claude Desktop 및 에이전트 연동 가이드 | `onOpenMcp()` | 없음 |
     | collect | 최신 소식 즉시 수집 트리거 | 등록된 모든 소스에서 즉시 신규 기술 소식 크롤링 | `onTriggerCollect()` | 없음 |
     | schedule | 수집 스케줄 보기 | 자동 수집 주기와 다음 예정 시각 | `onOpenSchedule()` | 없음 |
     | settings | 공유 & 알림 설정 열기 | Notion · 이메일 · 웹훅 브리핑 연동 | `onOpenSettings()` | 없음 |
     | rss | RSS 피드 열기 | 새 탭에서 RSS 피드 주소를 엽니다 | `window.open(rssUrl, '_blank', 'noopener,noreferrer')` | 없음 |
     | reset | 수집 데이터 초기화 & 재수집 | 저장된 소식을 모두 지우고 처음부터 다시 수집 (확인 후 실행) | `onRequestReset()` → 초기화 확인 창 (UI-02) | 없음 |
  2. 챗 명령 (`ChatWorkspace.tsx:581-621`): `뉴스 피드로 이동`(`router.push('/')`), 테마 순환(제목 규칙 같음, 단축키 표시 없음), `새 대화 시작`, `대화 기록 열기`(1024px 이상은 사이드바 열기, 미만은 드로어 열기).
  3. 테마 명령 제목: `light` 이면 `다크 모드로 전환`, `dark` 이면 `시스템 모드로 전환`, `system` 이면 `라이트 모드로 전환 (현재 시스템)`. 아이콘도 현재 모드(해·달·노트북)를 따른다.
  4. 명령을 실행하면 `perform()` 뒤 `onClose()` 로 팔레트를 닫는다 (`CommandPalette.tsx:181-184`).
  5. 검색: 입력값을 앞뒤 공백 제거·소문자로 바꿔 제목 또는 부제에 포함되는 명령만 남긴다. 빈 입력이면 전체를 보여 준다. 입력이 바뀌면 선택을 첫 항목으로 되돌린다 (`CommandPalette.tsx:163-171`, `:213-216`).
  6. 검색 입력창 키 처리 (IME 조합 중 제외, `CommandPalette.tsx:186-198`): `ArrowDown` 다음 항목(끝에서 처음으로), `ArrowUp` 이전 항목(처음에서 끝으로), `Enter` 선택 항목 실행(결과가 없으면 아무것도 안 함). 선택 항목은 목록 안에서 보이게 스크롤한다.
  7. 마우스: 항목 위에서 움직이면 그 항목이 선택되고, 클릭하면 실행한다.
  8. ⌘K / Ctrl+K: 화면 헤더가 처리한다. 팔레트가 열려 있고 오버레이 스택 깊이가 1 이하(팔레트가 맨 위)면 닫고, 다른 레이어가 열려 있으면 무시하고, 아무것도 없으면 연다. 입력창 안에서도 동작한다 (`Header.tsx:69-81`, `ChatHeader.tsx:62-75`).
  9. 닫기: Escape(오버레이 스택), 배경막 클릭, 머리줄 X(`닫기`), ⌘K.
  10. 대화상자: `Dialog size="md" placement="top"`, `aria-label="커맨드 팔레트"`. 768px 미만은 화면 전체, 이상은 위에서 `12dvh`, 너비 560px, 최대 높이 `85dvh`. 열리면 검색 입력창에 포커스가 간다. 자리표시자 `명령어 검색 또는 바로가기` 는 360px 화면의 입력 폭 안에 들어간다. 닫는 방법은 머리줄 `닫기` 버튼과 바닥줄 `Esc 닫기` 안내(640px 이상)가 알린다 (`CommandPalette.tsx:210-314`).
  11. 바닥줄 `↑↓ 탐색`, `↵ 실행`, `Esc 닫기` 안내와 단축키 표시(`Kbd`)는 640px 이상에서만 보인다.
  12. 팔레트가 닫히면 내용이 언마운트되어 검색어와 선택이 초기화된다 (`CommandPalette.tsx:51-54`).
- 출력: 명령 실행, 팔레트 닫힘.
- 예외·엣지:
  - 결과가 없으면 `검색된 명령어가 없습니다.` 를 보여 준다.
  - 테마 명령 옆 `T` 는 피드 화면의 전역 `t` 키를 뜻한다. 팔레트가 열려 있는 동안에는 입력창에 포커스가 있어 `T` 는 검색어로 들어간다.
  - 메뉴·대화상자 등 다른 레이어가 열려 있으면 ⌘K 로 팔레트를 열 수 없다.
- 관련 코드: `frontend/src/components/CommandPalette.tsx:1-305`, `frontend/src/components/Header.tsx:69-81`, `:183-197`, `:207-217`, `frontend/src/components/chat/ChatHeader.tsx:62-75`, `:129-136`, `frontend/src/components/chat/ChatWorkspace.tsx:581-621`, 동작 확인 테스트 `frontend/src/tests/CommandPalette.test.tsx`

## UI-08 대화상자·오버레이 공통 규칙
- 진입점: 각 대화상자의 여는 버튼. 목록과 여는 곳은 `../ui-spec.md` '대화상자·드로어·시트·팝오버' 참고.
- 입력: 각 대화상자는 `open`(`isOpen`)과 `onClose` 를 받는다.
- 처리 규칙:
  1. 열림 상태는 부모가 가진다. 홈 화면은 `page.tsx` 의 `useState` 6개(`detailModalOpen`, `briefingModalOpen`, `schedOpen`, `mcpOpen`, `webhookModalOpen`, `sourcesModalOpen`), 헤더는 팔레트·초기화 확인 창, 챗 화면은 `ChatWorkspace` 의 `isDrawerOpen`, `isBottomSheetOpen`, `isPaletteOpen` 으로 관리한다.
  2. 공통 프레임: `Dialog`, `Drawer`, `ConfirmDialog` 는 모두 `ModalFrame` 을 쓴다. `createPortal(…, document.body)` 로 `#app-shell` 밖에 그리고, 열려 있고 클라이언트일 때만 그린다(닫히면 내용이 언마운트된다) (`ui/Dialog.tsx:125-249`).
  3. 오버레이 스택: 대화상자·드로어·확인 창은 `modal`, 메뉴·팝오버는 `popover` 레이어로 열릴 때 스택에 올라가고 닫히면 빠진다. 스택이 비어 있지 않을 때만 `window` keydown 리스너 하나가 달린다. Escape(IME 조합 중·이미 기본 동작이 막힌 이벤트 제외)는 맨 위 레이어의 닫기만 부르고 기본 동작을 막는다. 컴포넌트별 Escape 리스너는 없다 (`lib/overlay-stack.ts:46-55`, `:199-229`).
     - 쌓는 순서: 레이어마다 순서 번호(`order`)가 있고 스택은 번호 오름차순이다. `useOverlayLayer` 는 `open` 이 false→true 로 바뀌는 렌더에서 번호를 받는다. 부모가 자식보다 먼저 렌더되므로 부모·자식 대화상자를 같은 렌더에서 함께 열어도 자식이 맨 위다 (자식 effect 가 먼저 스택에 올라가도 번호 자리에 들어간다). 닫았다 다시 열면 새 번호를 받아 맨 위가 된다. 맨 위 판정, `inert`, Escape 는 이 순서를 본다 (`lib/overlay-stack.ts:104-120`).
     - 예외: 뉴스 상세 `AI 질의응답` 탭의 질문 입력창에서 누른 Escape 는 대화상자를 닫지 않는다. IME 조합 중이 아니면 기본 동작을 막고(스택이 무시한다) 포커스를 질의응답 탭 패널로 옮긴다. 입력한 글자와 대화 기록은 그대로다. 패널에서 다시 누른 Escape 는 맨 위 레이어(상세 대화상자)를 닫는다 (`news-detail/AskAiPanel.tsx:90-98`).
  4. 속성: `role="dialog"`(확인 창 `alertdialog`), `aria-modal="true"`, 제목 `h2` 로 `aria-labelledby`(제목이 없으면 `aria-label`), 설명이 있으면 `aria-describedby`, 진행 중이면 `aria-busy` (`ui/Dialog.tsx:200-213`).
  5. 포커스: 열 때 이전 포커스 요소를 저장하고 `initialFocusRef` → 본문의 첫 포커스 가능 요소 → 대화상자(`tabIndex={-1}`) 순으로 포커스한다. Tab/Shift+Tab 은 대화상자 안에서 돈다. 닫으면 저장한 요소로 돌려준다 (`hooks/useFocusTrap.ts`).
  6. 배경: 모달이 하나라도 열려 있으면 `#app-shell` 에 `inert`, 맨 위가 아닌 모달에도 `inert` 를 단다. `body` 스크롤은 참조 수로 잠가 마지막 모달이 닫힐 때 풀린다 (`lib/overlay-stack.ts:67-83`, `hooks/useScrollLock.ts`). 알림 영역은 `#app-shell` 밖이라 가려지지 않는다.
  7. 배경막: `bg-scrim` 토큰(라이트 `rgb(15 23 42 / 0.45)`, 다크 `rgb(0 0 0 / 0.6)`), `motion-safe:animate-fade-in` (`ui/Dialog.tsx:194-199`, `globals.css:33`, `:62`).
  8. 레이어 순서: 피드 필터 영역 `z-10`, 챗 사이드바 `z-20`, 헤더(`/`, `/chat`) `z-30`, 메뉴·팝오버 `z-40`, 대화상자·드로어·시트 `z-50`, 알림 `z-60`. 겹친 대화상자는 나중에 포털에 붙은 것이 위다 (예: 일일 브리핑 위의 공유 & 알림 설정, 스케줄 위의 초기화 확인 창).
  9. 폭별 배치 (`ui/Dialog.tsx:89-115`):
     | 폭 | 기본 (`mobile="fullscreen"`) | `mobile="sheet"` (확인 창, 포커스 필터) | `placement="top"` (팔레트) | `Drawer` |
     |---|---|---|---|---|
     | 768px 미만 | 화면 전체(`h-dvh`), 머리줄 56px, 본문 스크롤, 바닥 고정 + `pb-[max(0.75rem,env(safe-area-inset-bottom))]` | 아래 바텀시트, 위 모서리 둥금, 끌기 손잡이, 최대 `90dvh` | 화면 전체, 검색창 맨 위 | 왼쪽, 너비 `min(320px, 85vw)`, 높이 전체 |
     | 768px 이상 | 가운데, 너비 sm 420 / md 560 / lg 720 / xl 896px(`max-w-[calc(100vw-3rem)]`), 최대 높이 `85dvh`, 머리줄·바닥 고정, 본문 스크롤 | 가운데 (420px) | 위에서 `12dvh`, 560px | 같음 |
  10. 대화상자별 크기: 뉴스 상세·일일 브리핑·소스 & 리서처 `xl`, MCP `lg`, 공유 & 알림 설정·스케줄·팔레트 `md`, 확인 창·포커스 필터 `sm`.
  11. 닫기 수단:
      | 종류 | Escape | 배경막 클릭 | 닫기 버튼 | 기타 |
      |---|---|---|---|---|
      | 읽기 위주 (뉴스 상세, 일일 브리핑, 스케줄, MCP, 커맨드 팔레트, 대화 기록 드로어, 포커스 필터) | 닫힘 | 닫힘 | 머리줄 X `닫기` (드로어 `대화 기록 드로어 닫기`, 포커스 필터 `필터 닫기`), 일일 브리핑·MCP 바닥 `닫기` | 팔레트 ⌘K, 드로어는 세션 선택·새 대화 때, 포커스 필터는 `적용하기`·아래로 100px 스와이프 |
      | 입력 폼 (공유 & 알림 설정, 소스 & 리서처) | 닫힘 | 안 닫힘 (`dismissOnScrim={false}`) | 머리줄 X, 바닥 `닫기` | — |
      | 확인 창 (`ConfirmDialog`) | 닫힘 (`busy` 면 무시) | 닫힘 (`busy` 면 무시) | `취소`, 머리줄 X `닫기` (`busy` 면 비활성) | 처음 포커스는 `취소` |
      | 메뉴 (`MenuButton`) | 닫힘, 트리거로 포커스 | 바깥 pointerdown | — | Tab, 항목 실행 |
      | 팝오버 (모델 선택, 인용 출처, 세션 삭제 확인) | 닫힘, 트리거로 포커스 | 바깥 pointerdown | 인용 `팝오버 닫기`, 삭제 확인 `취소` | 모델 선택은 고르면 닫힘 |
  12. 애니메이션: 대화상자 `animate-dialog-in`(200ms), 바텀시트 `animate-sheet-in`(240ms), 드로어 `animate-drawer-in`(240ms), 메뉴·팝오버 `animate-fade-in`(150ms). 모두 `motion-safe:` 다.
  13. 바텀시트(`mobile="sheet"`)는 시트 위에서 아래로 100px 넘게 끌면 닫힌다 (`ui/Dialog.tsx:25`, `:179-190`).
  14. 확인이 필요한 동작은 브라우저 기본 대화상자 대신 `ConfirmDialog` 를 쓴다: 소스 삭제(`이 소스를 목록에서 삭제하시겠습니까?`), Ask AI 대화 초기화(`AI 대화 내역을 모두 초기화하시겠습니까?`), 초기화 & 재수집 (UI-02).
  15. 뉴스 상세 대화상자는 닫을 때와 닫힌 동안 `isOpen`/기사 id 가 바뀔 때 탭·질문·대화 기록·복사 표시를 초기화하고 진행 중인 스트리밍 요청을 중단한다 (`NewsDetailModal.tsx:55-117`). 다른 대화상자 컴포넌트는 마운트된 채라 내부 상태가 남는 것이 있다 (예: 일일 브리핑의 보기 탭).
- 출력: 오버레이 표시·제거.
- 예외·엣지:
  - Escape 는 입력창 안에서도 맨 위 대화상자를 닫는다. 뉴스 상세 `AI 질의응답` 탭 질문 입력창만 예외다 (규칙 3). 질의응답 탭 패널에서 Escape 로 대화상자를 닫으면 규칙 15 대로 대화 기록이 지워진다.
  - 팝오버·메뉴는 포털 없이 트리거 옆 `absolute` 로 그려 부모의 쌓임 맥락 안에 있다.
  - 바텀시트의 끌어 닫기는 폭을 보지 않아, 768px 이상에서 가운데에 뜬 포커스 필터도 터치로 아래로 100px 끌면 닫힌다.
  - 챗 기록 드로어는 `isDrawerOpen && !isDesktop` 일 때만 열린다. 열린 채로 1024px 이상으로 넓히면 닫혀 보이고, 다시 좁히면 다시 열린다 (`ChatWorkspace.tsx:733`).
- 관련 코드: `frontend/src/components/ui/Dialog.tsx:1-260`, `frontend/src/components/ui/Drawer.tsx`, `frontend/src/components/ui/ConfirmDialog.tsx`, `frontend/src/components/ui/Menu.tsx`, `frontend/src/components/ui/Popover.tsx`, `frontend/src/lib/overlay-stack.ts:1-229`, `frontend/src/hooks/useFocusTrap.ts`, `frontend/src/hooks/useScrollLock.ts`, `frontend/src/components/news-detail/AskAiPanel.tsx:90-98`, `frontend/src/app/page.tsx:94-100`, `:276-300`, 동작 확인 테스트 `frontend/src/tests/ui/Dialog.test.tsx`, `frontend/src/tests/ui/OverlayStack.test.tsx`, `frontend/src/tests/ui/Menu.test.tsx`, `frontend/src/tests/modals/NewsDetailModal.test.tsx`

## UI-09 반응형 레이아웃
- 진입점: 모든 화면.
- 입력: 뷰포트 너비.
- 처리 규칙:
  1. 브레이크포인트는 Tailwind 4 기본값 sm 640px, md 768px, lg 1024px, xl 1280px 이다. 장치 구분은 모바일 768px 미만, 태블릿 768~1023px, 데스크톱 1024px 이상이다. JS 너비 판정은 `useMediaQuery` 만 쓴다 (`hooks/useMediaQuery.ts`): 피드 헤더 `(max-width: 767px)`, 챗 `(min-width: 1024px)`·`(min-width: 768px)`, 가로 스크롤 줄의 스크롤 버튼·넘침 표시 `(min-width: 768px)` (`Header.tsx:64`, `ChatWorkspace.tsx:63`, `ChatHeader.tsx:58-59`, `ui/ScrollRow.tsx`). 피드 툴바 배치는 JS 판정 없이 CSS 클래스로만 바꾼다.
  2. 조작 요소 높이는 모바일 44px, md 이상 36px(`h-11 md:h-9`)이다.
  3. 홈 화면 (`page.tsx`, `Header.tsx`, `feed/*`):
     | 영역 | 768px 미만 | 768~1023px | 1024px 이상 |
     |---|---|---|---|
     | 본문 좌우 여백·최대 너비 | 16px (`px-4`), `max-w-7xl` | 24px (`md:px-6`) | 32px (`lg:px-8`) |
     | 본문 영역 사이 세로 간격 (요약 바·검색 영역·필터 영역·목록 머리줄·그리드) | 12px (`gap-3`), 위 여백 12px | 16px (`md:gap-4`), 위 여백 24px | 같음 |
     | 헤더 (UI-01) | 브랜드 + AI 챗·팔레트·더보기 아이콘 | + `피드`·`AI 챗` 글자, 수집 상태(남은 시간), 즉시 수집 아이콘, 테마 메뉴 | + 버전 배지, `다음 수집 … 후`, `즉시 수집` 글자, `검색·명령 ⌘K` |
     | 요약 바 | 브리핑 버튼(`오늘의 브리핑 · 헤드라인`, 날짜 숨김) + `트렌드` | + 날짜 | + 급상승 태그 칩 3개 |
     | 검색 영역 | 검색 입력 전체 폭, 44px. 고정하지 않음 | 검색 입력 전체 폭, 36px. 고정하지 않음 | 같음 |
     | 필터 영역 (트리 하나, 배치는 CSS) | 줄 1 카테고리 칩(아이콘 숨김, 화면 좌우 끝까지) / 줄 2 소스 칩(왼쪽 화면 끝까지) + `Must-Read` 토글(별 아이콘만, 44×44). 고정하지 않음 | 줄 1 카테고리 칩(아이콘 숨김) / 줄 2 소스 칩 + `Must-Read` 토글(별 + 글자). `sticky top-14 z-10` | 1024~1279px 는 768~1023px 과 같다. 1280px 이상은 카테고리 칩 아이콘이 보인다. 고정. 필터 영역 안에 입력·선택 상자가 없다. `Must-Read` 토글은 소스 줄 밖, 같은 줄 오른쪽 끝이라 모든 폭 첫 화면에서 전체가 보인다 |
     | 목록 머리줄 | 상태 + 정렬(`w-28`, 44px) | 상태 + 정렬(`w-28`, 36px) | 1280px 이상 정렬 `w-32`. 모든 폭에서 DOM 순서 = 화면 순서 = Tab 순서 `검색 → 카테고리 → 소스 → Must-Read → 상태 → 정렬 → 카드`, 검색·필터 줄·머리줄의 양 끝이 콘텐츠 상자 끝과 같다 |
     | 칩 줄 | 한 줄 가로 스크롤 (`ChipGroup scrollable`). 넘친 쪽만 24px 흐림, 넘친 쪽마다 줄 밖에 `‹`(왼쪽)·`›`(오른쪽) 표시 | 넘친 쪽만 흐림 + 넘친 쪽에 스크롤 버튼 (`{줄 이름} 이전/다음 항목 보기`) | 같음 |
     | 뉴스 카드 그리드 | 1열, 간격 16px | 2열 | 3열, 간격 20px. 카드 바닥 `AI 챗에서 분석` 글자는 모든 폭에서 보이고, 한 줄에 다 들지 않으면 버튼 묶음이 다음 줄로 내려간다 |
     | 페이지 이동 | 이전·다음이 반씩 차지 | 가운데 | 같음 |
  4. 챗 화면:
     | 영역 | 768px 미만 | 768~1023px | 1024px 이상 |
     |---|---|---|---|
     | 대화 기록 | 헤더 기록 버튼 → 왼쪽 드로어(`min(320px, 85vw)`) | 같음 | 왼쪽 고정 사이드바(`w-72`), 기록 버튼은 사이드바 접기/펴기 |
     | 사이드바·드로어 머리 영역 | 1줄 `+ 새 대화`, 2줄 `대화 검색` (`min-h-11`) | 같음 (2줄 `h-11`) | 1줄 56px(`+ 새 대화`, 접기) = 챗 헤더 높이, 2줄 44px(`대화 검색`) = 맥락 줄 높이. 아래 경계가 100px 로 헤더 + 맥락 줄 아래 경계와 같다 |
     | 챗 헤더 (`h-14`, 한 줄, 왼쪽부터) | `←`(아이콘만, 맨 왼쪽), 기록, `AI 챗`, 새 대화, 더보기(+`커맨드 팔레트`) | `← 피드`(맨 왼쪽), 기록, `AI 챗`, 새 대화, 팔레트, 더보기 (모델 선택은 모든 폭에서 입력창 아래) | 같음. 새 대화는 사이드바를 접었을 때만 |
     | 맥락 줄 | `min-h-11 py-1`, 가로 스크롤 줄 | `h-11` | 같음 |
     | 열 맞춤 (맥락 줄 스크롤 영역·메시지 열·입력 영역) | 바깥 `px-4`, 안쪽 `mx-auto w-full max-w-3xl` | 바깥 `px-6`, 안쪽 같음 | 같음. 세 영역의 왼쪽 끝이 맞는다 |
     | 추천 질문 | 1열 (640px 이상 2열), 앞에 lucide 아이콘, 글자 왼쪽 정렬 | 2열 | 2열 |
     | 알림 (`ToastRegion placement="composer"`) | 입력 영역 바로 위(8px 띄움), 메시지 열 폭 안 | 같음 | 같음. 대화상자가 열려 있으면 전역 알림 영역 |
     | 포커스 필터 | 바텀시트 | 가운데 대화상자 (420px) | 같음 |
     | 입력창 안내 | `Enter: 전송, Shift+Enter: 줄바꿈` 숨김 | 숨김 | 보임 |
  5. 새 대화 버튼 표시 조건은 `!isDesktop || !isSidebarOpen` 이다. 1024px 미만에서는 항상 보인다 (`ChatHeader.tsx:77`).
  6. 가로 스크롤 방지: `<body>` 와 챗 루트에 `overflow-x-hidden` (`layout.tsx:34`, `ChatWorkspace.tsx:640-643`). 가로 스크롤 줄(`ui/ScrollRow`: 피드 카테고리·소스 칩 줄, 요약 바 급상승 칩, 챗 맥락 줄, 탭 목록, Ask AI 빠른 질문)은 자체 가로 스크롤을 갖는다. 줄에는 넘침 상태 `data-overflow`(`none`·`start`·`end`·`both`)가 붙고 넘친 쪽만 24px 흐린다. 768px 이상은 넘친 쪽에 스크롤 버튼(`{줄 이름} 이전 항목 보기`/`다음 항목 보기`, 누르면 줄 폭의 80% 이동)이 붙는다. 포커스를 가진 버튼이 사라지면(끝에 닿음, 폭이 768px 미만이 됨) 반대쪽 버튼 → 선택 항목 → 줄의 첫 포커스 가능 요소 순으로 포커스를 옮긴다. 768px 미만은 넘친 쪽마다 장식 표시(`aria-hidden`)가 붙는다: 왼쪽이 넘치면 줄 앞에 `‹`, 오른쪽이 넘치면 줄 뒤에 `›`. 버튼과 표시는 줄 밖 형제라 항목을 덮지 않고, 표시가 나타나고 사라져도 항목이 옆으로 움직이지 않는다. 줄 안 항목이 포커스를 받으면, 그리고 처음 그릴 때와 선택 항목(칩 `aria-pressed="true"`, 탭 `aria-selected="true"`, 피드 소스 줄은 선택 소스 칩 `[data-source-chip][aria-pressed="true"]`)이 바뀔 때 그 항목이 흐림 밖에 보이게 줄을 민다. 그 뒤 줄 폭(넘침 상태·스크롤 버튼·표시·화면 폭)이나 줄·항목 크기가 바뀌면, 그 선택 항목이 생긴 뒤 사용자가 줄을 직접 스크롤하지 않았을 때만 다시 보이게 민다. 사용자 스크롤은 입력 신호 뒤에 온 `scroll` 만이다:
     - 입력 신호: 줄 바깥 감싸개(스크롤 줄·스크롤 버튼·넘침 표시를 담은 요소)에서 받은 `pointerdown`·`touchstart`·`keydown`, 가로 의도의 `wheel`(`Math.abs(deltaX) > Math.abs(deltaY) || shiftKey`), 스크롤 버튼 클릭, 줄 안으로의 사용자 포커스 이동(`focusin`). 세로 휠(가로 성분이 세로 이하이고 Shift 없음)은 줄 위에서 페이지를 내리는 동작이라 입력 신호가 아니다. 그래서 sticky 툴바 위에서 페이지를 세로 휠로 내리는 동안 브라우저가 범위를 자르거나 스냅 위치로 다시 맞춘 `scroll` 은 사용자 스크롤로 기록되지 않는다. 스크롤 버튼이 사라질 때 이 부품이 옮긴 포커스는 입력 신호가 아니다.
     - 입력 신호를 받으면 '사용자 조작 중' 이 되고, 그동안 온 `scroll` 이 사용자 스크롤이다 (줄을 '사용자가 스크롤함' 으로 표시하고, 새 선택 항목이 생기면 지운다). '사용자 조작 중' 은 `scrollend` 에서 끝나고, `scrollend` 를 지원하지 않으면 마지막 `scroll` 뒤 150ms, 입력 뒤 1,000ms 안에 `scroll` 이 없으면 끝난다.
     - 입력 신호 없이 온 `scroll`(브라우저가 줄이 좁아져 범위를 자르거나 스냅 위치로 다시 맞춘 것, 다른 코드의 `scrollLeft` 변경)과 이 부품이 선택 항목을 보이려고 둔 값(1px 이내)의 `scroll` 은 사용자 스크롤이 아니다. 그래서 손대지 않은 줄은 폭이 바뀔 때마다 선택 항목이 다시 보이고, 손가락·가로 휠(Shift + 휠 포함)·버튼으로 민 줄은 폭이 바뀌어도 민 위치가 남는다.
     - 마크다운 영역은 `min-w-0 max-w-full break-words [overflow-wrap:anywhere] [word-break:break-word]` 로 긴 토큰을 끊고, 코드 블록과 표만 자체 가로 스크롤(`overflow-x-auto overscroll-x-contain`)을 갖는다 (UI-12).
  7. 한국어 줄바꿈: `body` 에 `word-break: keep-all; overflow-wrap: break-word;` 가 있어 모든 글자가 어절 단위로 줄을 바꾸고, 긴 토큰은 넘칠 때만 끊는다 (`globals.css:125-134`). 마크다운·코드 영역은 자체 클래스가 이긴다. 카드 제목·뉴스 상세 제목은 `break-keep [overflow-wrap:anywhere]` 로 긴 토큰도 끊는다.
- 출력: 너비별 배치.
- 예외·엣지:
  - `useMediaQuery` 는 서버 렌더와 하이드레이션 첫 렌더에서 false 다. 챗 화면은 첫 렌더에서 데스크톱이 아닌 것으로 보고 그린 뒤 바로 바뀐다.
  - 1024px 이상에서 사이드바를 접으면 `<aside id="chat-history-sidebar">` 를 그리지 않는다. 기록 버튼은 그동안 `aria-controls` 를 달지 않는다 (UI-14).
  - 피드 검색 영역·필터 영역·목록 머리줄은 모든 폭에서 같은 트리이고 배치는 CSS 로만 바뀌므로, 서버 렌더·하이드레이션 첫 렌더와 그 뒤의 배치·DOM 순서가 같다. 폭이 바뀌어도 검색 입력·칩 줄·`Must-Read` 토글·정렬이 다시 마운트되지 않는다 (`feed/FeedToolbar.tsx:211-229`, `feed/FeedStatusBar.tsx:52-86`). 768px 미만 토글의 `Must-Read` 글자는 `max-md:sr-only` 라 접근 이름이 폭과 상관없이 같다.
  - 가로 스크롤 줄의 넘침 상태·스크롤 버튼·`‹`·`›` 표시는 JS 로 정하므로 서버 렌더와 첫 그림에는 없다.
- 관련 코드: `frontend/src/app/page.tsx:167-269`, `frontend/src/components/Header.tsx:122-205`, `frontend/src/components/feed/FeedToolbar.tsx:63-229`, `frontend/src/components/feed/FeedStatusBar.tsx:29-88`, `frontend/src/components/feed/InsightsBar.tsx:54-118`, `frontend/src/components/ui/ScrollRow.tsx`, `frontend/src/components/chat/ChatSidebarHeader.tsx:26-76`, `frontend/src/components/chat/ChatMessageList.tsx:49-98`, `frontend/src/components/chat/ChatWorkspace.tsx:640-767`, `frontend/src/components/chat/ChatHeader.tsx:77-150`, `frontend/src/components/chat/ChatContextBar.tsx:37-57`, `frontend/src/app/globals.css:125-134`, 동작 확인 테스트 `frontend/src/tests/ResponsiveLayout.test.tsx`, `frontend/src/tests/ui/ChipGroup.test.tsx`, `frontend/src/tests/feed/FeedToolbar.test.tsx`

## UI-10 모바일 뷰포트·가상 키보드 대응
- 진입점: 루트 레이아웃 viewport 설정, `/chat` 화면, 768px 미만 대화상자.
- 입력: 뷰포트 크기, `window.visualViewport`.
- 처리 규칙:
  1. viewport: `width=device-width`, `initialScale=1`, `interactiveWidget='resizes-content'`, `colorScheme: 'light dark'`, `themeColor` 라이트 `#f8fafc` / 다크 `#0e1013` (`layout.tsx:6-15`). 확대를 막지 않는다.
  2. 챗 페이지 `<main>` 은 `h-[100dvh]` 다 (`app/chat/page.tsx:12`).
  3. `ChatWorkspace` 는 `visualViewport` 의 `resize`·`scroll` 이벤트마다 루트 높이를 `{visualViewport.height}px` 로 바꾼다. 처음 높이는 `100dvh` 이고, `visualViewport` 가 없으면 그대로 둔다 (`ChatWorkspace.tsx:96`, `:113-131`, `:642`). 가상 키보드가 올라오면 화면이 줄어든 높이에 맞춰진다.
  4. 챗 입력창은 640px 미만에서 글자 16px(`text-base`)라 iOS 자동 확대를 피하고, 640px 이상은 14px 다. 포커스되면 100ms 뒤 `scrollIntoView({ block: 'end', behavior: 'smooth' })` 한다 (`ChatPromptInput.tsx:71-76`, `:93`). 다른 입력 필드(`TextField`)는 768px 미만 16px 다.
  5. 입력창 높이는 내용에 맞춰 늘고 최대 180px 이다 (`ChatPromptInput.tsx:26`, `:90`, `ui/Textarea.tsx:51-54`).
  6. 하단 입력 영역과 전체 화면 대화상자 바닥의 아래 여백은 `max(0.75rem, env(safe-area-inset-bottom))` 이다 (`ChatWorkspace.tsx:703`, `ui/Dialog.tsx:241`). 전역 알림 영역은 768px 미만에서 아래 `max(1rem, env(safe-area-inset-bottom))` 에 뜬다 (`ui/Toast.tsx:250`). 챗 화면의 알림은 입력 영역 바로 위에 뜨므로 입력창과 겹치지 않는다 (UI-09).
  7. 바텀시트는 아래로 100px 넘게 끌면 닫힌다 (UI-08).
- 출력: 뷰포트에 맞춘 챗 화면 높이.
- 예외·엣지: 없음.
- 관련 코드: `frontend/src/app/layout.tsx:6-15`, `frontend/src/app/chat/page.tsx:10-24`, `frontend/src/components/chat/ChatWorkspace.tsx:113-131`, `frontend/src/components/chat/ChatPromptInput.tsx:25-94`, 동작 확인 테스트 `frontend/src/tests/chat/MobileViewport.test.tsx`

## UI-11 로딩·오류·빈 상태 표시
- 진입점: 데이터를 읽는 각 영역.
- 입력: 각 영역의 loading / error / 데이터 상태.
- 처리 규칙:
  1. 홈 피드 (`page.tsx:214-268`). 세 상태는 서로 배타적이다.
     - 로딩: 지금 목록 키(카테고리·소스·검색어·정렬·Must-Read·페이지)의 응답이 아직 없을 때만이다. 카드 그리드 자리에 카드 스켈레톤 6장(`NewsCardSkeleton`, `aria-hidden`, 카드와 같은 틀·높이)과 `sr-only` 문구 `소식을 불러오는 중...`. 첫 렌더부터 보인다. 같은 목록 키를 다시 읽는 동안(수집 중 새 소식 저장, 수집 끝, 검색 제출, 소스 변경)에는 스켈레톤으로 바꾸지 않고 이전 카드·건수·페이지 이동을 그대로 그린다 (`hooks/useNewsFeed.ts:21-34`, `:116-133`).
     - 오류: 목록 키가 바뀐 요청이 실패하면 `ErrorState`(`role="alert"`) — 제목은 오류 메시지(`API 오류 ({status}): {statusText}` 또는 `데이터를 불러오지 못했습니다.` 등), 안내 `백엔드 서버(포트 8000) 연결 상태를 확인해주세요.`, `다시 시도` 버튼(오류를 지우고 다시 읽는다).
     - 다시 읽기 실패: 같은 목록 키를 다시 읽다 실패하면 목록을 지우지 않고 `danger` 알림으로 오류 메시지를 띄운다. 실패할 때마다 한 번씩 뜬다 (`page.tsx:74-81`).
     - 빈 상태: `EmptyState` — `조건에 일치하는 소식이 없습니다`, `다른 카테고리를 선택하거나 검색어 및 필터를 초기화해 보세요.`, `필터 전체 초기화` 버튼(카테고리·소스·검색어·Must-Read 를 초기화하고 1페이지로. 정렬은 그대로).
     - 페이지 이동은 로딩이 아니고 전체 페이지가 2 이상일 때만 나온다 (`feed/FeedPagination.tsx:17`).
  2. 홈의 다른 영역:
     - 요약 바: 통계·브리핑·레이더 첫 읽기가 끝나기 전이고 보여 줄 브리핑·레이더가 없으면 바 전체가 48px 스켈레톤이다. 다시 읽는 동안에는 이전 브리핑·레이더를 그대로 그린다. 브리핑도 레이더 태그도 없으면 그리지 않는다. 레이더 태그가 없으면 `트렌드` 버튼과 급상승 칩이 빠진다 (`hooks/useNewsFeed.ts:40-59`, `feed/InsightsBar.tsx:41-52`, `:77`).
     - 통계·브리핑·레이더는 `Promise.allSettled` 로 함께 읽어 하나가 실패해도 나머지를 반영한다. 실패는 화면에 표시하지 않는다 (통계 실패만 콘솔에 남긴다) (`hooks/useNewsFeed.ts:45-59`).
     - 헤더 스케줄 상태를 아직 모르면 `다음 수집 확인 중` 이다 (UI-01).
  3. 대화상자:
     - 공유 & 알림 설정: 설정을 읽는 동안 본문에 스피너 + `설정을 불러오는 중...`, 결과·실패는 `InlineAlert` (`BriefingSettingsModal.tsx:336-345`).
     - 소스 & 리서처: 결과 안내는 대화상자 안 `aria-live` 영역에 보이고 3,500ms 뒤 사라진다. 읽기에 실패하면 `데이터를 불러오지 못했습니다.` (`SourcesModal.tsx:73-74`, `:100-102`, `:200-211`).
     - 스케줄: 상태를 받기 전 `계산 중...` (`ScheduleModal.tsx:55`).
     - 일일 브리핑: Notion·이메일 결과는 `InlineAlert`(실패면 해당 설정 열기 버튼).
     - 버튼 진행 표시: 진행 중인 버튼은 `Button loading`(비활성 + `aria-busy` + 스피너)을 쓴다.
  4. 챗 화면:
     - 대화 기록 목록: 로딩 중 스켈레톤 5줄(`role="status" aria-label="대화 기록을 불러오는 중..."`), 오류면 `ErrorState`(`대화 기록을 불러오지 못했습니다` + 오류 문구 + `다시 시도`), 비어 있으면 빈 상태 컴포넌트(검색 결과 없음 / 대화 없음 구분) (`SessionList.tsx:35-60`).
     - 대화 목록 조회가 실패해도 localStorage 캐시가 있으면 오류 없이 캐시를 보여 준다 (`useChatSessions.ts:83-97`).
     - 메시지가 없으면 웰컴 화면과 추천 질문 4개를 보여 준다 (`ChatMessageList.tsx:49-88`).
     - URL 의 `sourceId` 기사를 찾지 못하면 `warning` 알림 `요청하신 기사를 찾을 수 없어 전체 소식 모드로 시작합니다.` 를 입력 영역 바로 위에 띄운다 (UI-09). 3,500ms 뒤 사라지고 `알림 닫기` 로 닫을 수 있다 (`ChatWorkspace.tsx:42`, `:544`, `:557`).
     - 챗 페이지 Suspense fallback: `워크스페이스 환경을 초기화하는 중...` (`app/chat/page.tsx:13-19`).
- 출력: 상태별 안내 UI.
- 예외·엣지: 북마크 보기(`source === 'bookmarks'`)는 서버를 부르지 않고 localStorage 목록을 거르므로 로딩·오류 상태가 없다 (`useNewsFeed.ts:75`, `:103`).
- 관련 코드: 위 각 줄 참조, `frontend/src/components/ui/ErrorState.tsx`, `frontend/src/components/ui/EmptyState.tsx`, `frontend/src/components/ui/Skeleton.tsx`, `frontend/src/components/ui/Toast.tsx`, 동작 확인 테스트 `frontend/src/tests/hooks/useNewsFeed.test.tsx`, `frontend/src/tests/feed/InsightsBar.test.tsx`

## UI-12 마크다운 렌더링
- 진입점: `MarkdownViewer` 를 쓰는 곳 — 뉴스 상세의 `상세 본문 요약`(`NewsDetailModal.tsx:379`), 일일 브리핑 `마크다운 전문` 탭(`DailyBriefingModal.tsx:410`), Ask AI 답변(`news-detail/AskAiPanel.tsx:220`). 챗 답변은 `ChatMessageItem` 이 자체 `ReactMarkdown` 설정을 쓰고 코드 렌더러 `MarkdownCode` 와 줄바꿈 클래스만 가져다 쓴다 (`ChatMessageItem.tsx:13`, `:285-287`).
- 입력: `content`(마크다운 문자열), `className`(선택).
- 처리 규칙:
  1. `content` 가 빈 값이면 아무것도 그리지 않는다 (`MarkdownViewer.tsx:119`).
  2. `react-markdown` + `remark-gfm`(표, 취소선, 자동 링크 등 GFM) 으로 그린다. HTML 을 해석하는 rehype 플러그인은 쓰지 않는다.
  3. 바깥 컨테이너: 클래스 `markdown-viewer`, `w-full max-w-full min-w-0`, 글자 14px(`text-sm`), 긴 단어 끊기(`MARKDOWN_WRAP_CLASSES`) (`MarkdownViewer.tsx:122-127`).
  4. 제목은 한 단계씩 낮춰 그린다: `#` → `<h2>`, `##` → `<h3>`, `###` → `<h4>`, `####` → `<h5>`. `#`·`##` 는 아래 테두리가 있다.
  5. 목록 마커는 `fg-subtle` 색, 인용은 왼쪽 `accent` 4px 테두리·`surface-muted` 배경, 링크는 새 탭(`target="_blank" rel="noopener noreferrer"`)·`accent` 글자·`break-all`, `hr` 은 `border` 색 선, `strong` 은 semibold.
  6. 표는 `div.table-wrapper`(`overflow-x-auto overscroll-x-contain`, 둥근 테두리) 안에 최소 너비 320px, 글자 12px 표로 그린다.
  7. 코드 (`MarkdownCode`, `MarkdownViewer.tsx:31-53`):
     - `pre` 는 감싸지 않고 자식만 넘긴다. `MarkdownCode` 가 블록/인라인을 판정한다.
     - `language-xxx` 클래스가 있거나 내용에 줄바꿈이 있으면 블록, 아니면 인라인 코드다.
     - 인라인: 테두리 + `surface-muted` 배경, 고정폭 12px, `break-all`. 챗 답변은 인라인 클래스를 따로 넘긴다.
     - 블록: 공통 부품 `ui/CodeBlock`(바깥 클래스 `code-block-wrapper`) — 머리줄(언어명, 없으면 `snippet`)과 복사 버튼, 본문 `<pre tabIndex={0} aria-label="가로 스크롤 가능한 코드 블록">` (`overflow-x-auto overscroll-x-contain`) (`ui/CodeBlock.tsx:21-57`).
     - 복사 버튼은 끝 줄바꿈 하나를 뺀 원문을 복사하고 2,000ms 동안 `복사됨` 또는 `복사 실패` 를 보여 준다 (UI-13).
  8. 문법 강조(syntax highlighting)는 없다.
  9. 색은 모두 토큰 유틸리티라 테마를 따로 처리하지 않는다 (UI-03).
- 출력: 스타일 입힌 HTML.
- 예외·엣지:
  - 언어 표시 없는 한 줄짜리 펜스 코드 블록은 줄바꿈이 없으면 인라인 코드로 그려질 수 있다 (판정 규칙상).
- 관련 코드: `frontend/src/components/MarkdownViewer.tsx:1-134`, `frontend/src/components/ui/CodeBlock.tsx:1-59`, 동작 확인 테스트 `frontend/src/tests/ResponsiveLayout.test.tsx`

## UI-13 복사 피드백
- 진입점: 코드 블록 `복사`(UI-12, MCP 대화상자 설정 예시 포함), 일일 브리핑 `마크다운 복사`, 뉴스 상세 Ask AI 답변 `복사`, 챗 답변 `답변 복사`·`마크다운 복사`.
- 입력: 복사할 문자열.
- 처리 규칙:
  1. `copyText(text)`: `navigator.clipboard.writeText` 로 쓴다. 없거나 실패하면(권한 거부, 비보안 출처) 숨긴 `textarea` + `document.execCommand('copy')` 로 한 번 더 시도한다. 그래도 실패하면 false 다 (`hooks/useCopyToClipboard.ts:12-57`).
  2. `useCopyToClipboard()`: 결과에 따라 상태를 `copied` 또는 `failed` 로 2,000ms 유지한 뒤 `idle` 로 되돌린다. 문구는 `복사` / `복사됨` / `복사 실패` (`hooks/useCopyToClipboard.ts:6-10`, `:70-111`).
  3. 쓰는 곳: 코드 블록(아이콘 복사 → 체크 / 경고, 문구는 `aria-live="polite"`) (`ui/CodeBlock.tsx:22-46`), 일일 브리핑(`마크다운 복사` → `복사됨` / `복사 실패`, 768px 미만은 `브리핑 작업` 메뉴 항목) (`DailyBriefingModal.tsx:65`, `:127-128`), 챗 답변 머리줄 `답변 복사` (`chat/ChatMessageItem.tsx:38`, `:47`), 챗 `ExportToolbar` `마크다운 복사` (`chat/ExportToolbar.tsx:42`, `:58-61`, `:105`).
  4. Ask AI 답변 복사는 `copyText` 를 바로 쓴다. 결과를 그 답변의 복사 버튼에 2,000ms 동안 보인다: 성공하면 체크 아이콘 + `복사됨`, 실패하면 경고 아이콘 + `복사 실패`(위험 색). 실패 문구는 버튼 옆 `sr-only` `aria-live="polite"` 영역에도 넣어 화면 읽기 프로그램이 읽는다. 공통 훅과 같은 문구·시간이다. 새 결과가 나오면 앞 타이머를 지우고, 대화상자를 닫거나 언마운트하면 타이머를 정리한다 (`NewsDetailModal.tsx:217-237`, `news-detail/AskAiPanel.tsx:184-211`).
- 출력: 클립보드 내용, 2초 피드백.
- 예외·엣지: 없음.
- 관련 코드: `frontend/src/hooks/useCopyToClipboard.ts:1-113`, 위 줄 참조, 동작 확인 테스트 `frontend/src/tests/ui/useCopyToClipboard.test.tsx`, `frontend/src/tests/AskAiPanel.test.tsx`

## UI-14 접근성 속성
- 진입점: 각 컴포넌트.
- 입력: 없음.
- 처리 규칙 (코드에 있는 속성):
  - `aria-controls` 는 가리키는 요소가 그 순간 DOM 에 있을 때만 단다. 조건부로 그리는 대상(접힌 사이드바, 닫힌 드로어·메뉴·팝오버·폼, 그리지 않은 탭 패널)을 가리키는 컨트롤은 대상이 없을 때 속성을 빼고, `aria-expanded` 는 늘 단다.
  | 컴포넌트 | 속성 |
  |---|---|
  | 대화상자 공통 (`Dialog`, `Drawer`, `ConfirmDialog`) | `role="dialog"`(확인 창 `alertdialog`), `aria-modal="true"`, `aria-labelledby`(제목 `h2`) 또는 `aria-label`, `aria-describedby`, 진행 중 `aria-busy`, 닫기 `IconButton` `닫기`. 포커스 가두기·복귀, 배경 `inert` (UI-08) |
  | 건너뛰기 링크 | `본문으로 건너뛰기` → `#main` (`main tabIndex={-1}`), 포커스 때만 보임 |
  | 피드 헤더 | `<nav aria-label="주 메뉴">`, 현재 쪽 `aria-current="page"`, 모바일 `AI 챗` 링크는 `sr-only` 글자, 수집 상태 `aria-label="수집 스케줄 · 다음 수집 … 후"`, `커맨드 팔레트 열기`, `즉시 수집`, `테마 선택`, `더보기` |
  | 메뉴 (`MenuButton`) | 트리거 `aria-haspopup="menu" aria-expanded`, 열렸을 때만 `aria-controls`, `role="menu"`, 항목 `menuitem` / `menuitemradio`(`aria-checked`), `separator`. 열면 첫 항목 포커스, ↑↓ 순환, Home·End, Enter·Space 실행, Escape 닫고 트리거로, Tab 닫기 |
  | 커맨드 팔레트 | `role="dialog" aria-label="커맨드 팔레트"`, 입력 `role="combobox" aria-label="명령어 검색" aria-expanded aria-controls aria-autocomplete="list" aria-activedescendant`, 목록 `role="listbox" aria-label="명령어 목록"`, 항목 `role="option" aria-selected` |
  | 상태 알림 | 수집 진행 줄·피드 목록 머리줄의 상태 `role="status" aria-live="polite"`(정렬은 그 밖 형제), 알림 `role="status" aria-live="polite"`(오류 `role="alert" aria-live="assertive"`, 닫기 `알림 닫기`), `InlineAlert`·`ErrorState` 오류 `role="alert"`. 알림 하나는 처음 그려진 한 번만 `role`·`aria-live` 를 갖는다: 그리는 영역이 바뀌어(챗 입력 영역 위 ↔ 전역, 대화상자가 열리고 닫힐 때) 다시 그려지면, 처음 영역으로 돌아와도 같은 글자·닫기 버튼을 live 속성 없이 그려 화면 읽기 프로그램이 다시 읽지 않는다. 새 알림은 지금 영역에서 알린다 (`ui/Toast.tsx:32-37`, `:201-225`) |
  | 피드 검색·필터·목록 머리줄 | 검색 영역 `<form role="search">` + 라벨 `키워드 검색`(`sr-only`) + `검색어 지우기`, 필터 영역 칩 묶음 `role="group" aria-label`(`카테고리`, `소스`) + 칩 `aria-pressed`, `Must-Read` 토글 `aria-pressed`, 목록 머리줄 정렬 `<select>` 라벨 `정렬`(`sr-only`) |
  | 가로 스크롤 줄 (`ScrollRow`) | 768px 이상 스크롤 버튼 `{줄 이름} 이전 항목 보기`/`{줄 이름} 다음 항목 보기`(줄 밖 형제라 그룹 안 버튼 수를 바꾸지 않는다). 포커스를 가진 버튼이 사라지면 포커스가 `body` 로 빠지지 않게 반대쪽 버튼 → 선택 항목 → 줄의 첫 포커스 가능 요소로 옮긴다 (사용자가 먼저 다른 곳으로 옮겼으면 그대로). 768px 미만 넘침 표시 `‹`·`›` 와 보이지 않는 표시 자리는 `aria-hidden` 장식(포커스·이름 없음) |
  | 요약 바 | `트렌드` 버튼 `aria-expanded aria-controls`(패널 자리는 접혀도 `hidden` 으로 DOM 에 있다), 패널 `aria-label="트렌드 레이더"`, 급상승 칩 줄 `role="group" aria-label="급상승 태그"` |
  | 뉴스 카드 | `<article>` + 제목 `h3 > button`(Tab, Enter·Space), 북마크 `IconButton` `보관하기` + `aria-pressed`(`title` `보관하기`/`보관됨`), 바닥 통계 `sr-only` `스타`·`포인트`·`추천`·`포크`·`댓글`·`인기 점수`, `AI 챗에서 분석` 은 접근 이름 = 보이는 글자, `원문` 링크에 `sr-only` `(새 탭)` |
  | 페이지 이동 | `<nav aria-label="페이지 이동">` |
  | 탭 (`Tabs`) | `role="tablist" aria-label`, `role="tab" aria-selected`, 패널이 DOM 에 있는 탭(선택된 탭, `mountedPanels` 로 숨겨 둔 패널의 탭)에만 `aria-controls`, 로빙 `tabIndex`, ←/→ 순환·Home·End(자동 활성화), `role="tabpanel" aria-labelledby tabIndex={0}` |
  | 뉴스 상세 `AI 질의응답` 탭 | 빠른 질문 `role="group" aria-label="빠른 질문"`(버튼 안 아이콘 `aria-hidden`), 질문 입력 라벨 `질문 입력`(`sr-only`, 입력 중 Escape 는 패널로 포커스, UI-08), 답변 복사 실패 문구 `sr-only aria-live="polite"` (UI-13) |
  | 일일 브리핑·소스 & 리서처 | `이메일 발송`·`새 피드 직접 등록` 은 `aria-expanded`, 폼이 열렸을 때만 `aria-controls` |
  | 스위치 | `button role="switch" aria-checked` |
  | 코드 블록 | `<pre tabIndex={0} aria-label="가로 스크롤 가능한 코드 블록">` (키보드로 포커스 후 가로 스크롤) |
  | 챗 헤더 | DOM 순서대로 `피드로 돌아가기`(첫 조작 요소), 기록 버튼 `aria-label="대화 기록 보기" aria-expanded`, 기록이 열렸을 때만 `aria-controls`(1024px 이상 `chat-history-sidebar`, 미만 `chat-history-drawer`), 제목 `h1` `AI 챗`, `새 대화 시작`, `커맨드 팔레트 열기`, `더보기` |
  | 맥락 줄 | 스코프 `role="group" aria-label="검색 스코프 모드"` + 버튼 `aria-pressed`, 기사 칩 해제 `기사 컨텍스트 해제` |
  | 대화 기록 사이드바·드로어 | 사이드바 `<aside role="navigation" aria-label="대화 기록 목록">`, 드로어 `role="dialog"`(제목 `대화 기록`) 안 `<nav aria-label="대화 기록 목록">`, 닫기 `대화 기록 드로어 닫기`, `사이드바 접기`/`사이드바 펼치기`, 검색 `대화 검색`·`검색어 지우기`, 검색 결과 수 `sr-only aria-live="polite"` |
  | 세션 카드 | `role="button" tabIndex={0}` + Enter/스페이스로 선택, 활성 `aria-current="true"`, `aria-label="대화: {제목}, {시간}, {모드}"`, 삭제 `대화 '{제목}' 삭제` |
  | 메시지 목록 | `role="log" aria-live="polite" aria-relevant="additions text"` |
  | 포커스 필터 | 캡슐 `<button aria-haspopup="dialog" aria-expanded aria-label="지식 검색 포커스 필터 설정 열기. 현재 설정: …">`, `포커스 필터 초기화`, 시트는 대화상자 공통 + 닫기 `필터 닫기`, Must-Read `role="switch"` |
  | 모델 선택 | 트리거 `aria-label="Claude 모델 선택: {이름}" aria-haspopup aria-expanded`, 열렸을 때만 `aria-controls`, 팝오버 `role="radiogroup" aria-label="Claude AI 모델 선택"` + 항목 `role="radio" aria-checked` 로빙 `tabIndex`, 화살표 4방향 순환·Home·End, Enter/스페이스 선택 |
  | 기타 챗 | 입력창 라벨 `질문 입력`(`sr-only`), `답변 생성 중단`, `질문 전송`, `답변 복사`, `답변 다시 시도`, 내보내기 `role="group" aria-label="리포트 익스포트 툴바"`(`마크다운 복사`, `.md 다운로드`, `Notion 동기화`), 진행 표시 `role="region"`/`role="progressbar"`, 모델 변경 구분선 `role="separator"`, 인용 팝오버 `role="dialog"` + `팝오버 닫기` |
- 출력: 보조기술용 속성.
- 예외·엣지 (속성이 맞지 않는 곳):
  - 세션 카드(`role="button"`) 안에 삭제 버튼이 들어 있어 상호작용 요소가 중첩된다.
  - 인용 팝오버는 포털 없이 답변 문단(`<p>`) 안에 `div` 로 그려진다.
- 관련 코드: `frontend/src/components/ui/Dialog.tsx:200-245`, `frontend/src/components/ui/Menu.tsx`, `frontend/src/components/ui/Tabs.tsx`, `frontend/src/components/ui/ScrollRow.tsx`, `frontend/src/components/news-detail/AskAiPanel.tsx`, `frontend/src/components/DailyBriefingModal.tsx:162-172`, `frontend/src/components/sources/SourcesListTab.tsx:118-126`, `frontend/src/components/CommandPalette.tsx:210-314`, `frontend/src/components/Header.tsx:123-203`, `frontend/src/components/NewsCard.tsx:80-238`, `frontend/src/components/chat/ChatHeader.tsx:98-149`, `frontend/src/components/chat/ChatContextBar.tsx`, `frontend/src/components/chat/SessionItemCard.tsx:75-122`, `frontend/src/components/chat/ChatMessageList.tsx:92-95`, `frontend/src/components/chat/FocusCapsule.tsx:83-108`, `frontend/src/components/chat/ChatModelSelector.tsx:96-187`

## 단축키 표
| 키 | 동작 | 조건 | 위치 |
|---|---|---|---|
| ⌘K / Ctrl+K | 커맨드 팔레트 열기 / 닫기 | `/`, `/chat`. 팔레트가 맨 위면 닫고, 다른 레이어가 열려 있으면 무시. 입력창 안에서도 동작. 기본 동작 막음. IME 조합 중 무시 | `Header.tsx:69-81`, `ChatHeader.tsx:62-75`, `hooks/useHotkey.ts:97-121` |
| Escape | 맨 위 레이어 하나 닫기 (대화상자, 드로어, 시트, 확인 창, 팔레트, 메뉴, 팝오버) | 모든 화면. 레이어가 열려 있을 때. 입력창 안에서도 동작 (뉴스 상세 `AI 질의응답` 탭 질문 입력창은 닫지 않고 그 탭 패널로 포커스, UI-08). IME 조합 중 무시. 확인 창은 진행 중이면 무시 | `lib/overlay-stack.ts:46-55`, `news-detail/AskAiPanel.tsx:90-98` |
| j | 다음 카드로 포커스 (제목 버튼으로 DOM 포커스, 화면 안으로 스크롤) | `/`, 입력 중 아님, ⌘·Ctrl·Alt 없음, IME 조합 아님, 오버레이 없음 | `HotkeyListener.tsx:136-139`, `page.tsx:108-118` |
| k | 이전 카드로 포커스 | 같음 | `HotkeyListener.tsx:140-143` |
| / | 검색 입력창 포커스, 검색 영역을 sticky 헤더 아래로 보이게 스크롤 | 같음 | `HotkeyListener.tsx:144-147`, `page.tsx:145-151` |
| b | 포커스 카드 북마크 토글 | 같음 + 포커스 카드 있음 | `HotkeyListener.tsx:148-151` |
| c | 포커스 카드로 `/chat?sourceId={id}` 이동 | 같음 + 포커스 카드 있음 | `HotkeyListener.tsx:152-155` |
| t | 테마 순환 (light→dark→system) | 같음 | `HotkeyListener.tsx:156-159` |
| Enter / 스페이스 | 포커스 카드 상세 열기 | 같음 + 이벤트 대상이 `document.body`. 버튼·링크 등에서는 브라우저 기본 동작 (카드 제목 버튼은 기본 클릭으로 상세를 연다) | `HotkeyListener.tsx:160-168` |
| ↑ / ↓ | 팔레트 항목 이동 (순환) | 팔레트 검색 입력창 포커스 | `CommandPalette.tsx:188-193` |
| Enter | 팔레트 선택 항목 실행 | 팔레트 검색 입력창 포커스, IME 조합 아님 | `CommandPalette.tsx:194-197` |
| ↑ / ↓, Home / End, Enter / 스페이스, Tab | 메뉴 항목 이동 (순환)·처음/끝·실행·닫기 | 메뉴가 열려 있을 때 | `ui/Menu.tsx:103-140` |
| ← / →, Home / End | 탭 이동 (순환, 자동 활성화) | 탭 목록 포커스 | `ui/Tabs.tsx` |
| Tab / Shift+Tab | 대화상자 안에서 포커스 순환 | 대화상자가 열려 있을 때 | `hooks/useFocusTrap.ts` |
| Enter | 챗 질문 전송 | 챗 입력창, Shift 없음, IME 조합 아님 | `ChatPromptInput.tsx:49-58` |
| Shift+Enter | 챗 입력창 줄바꿈 | 챗 입력창 | `ChatPromptInput.tsx:49-58` (기본 동작) |
| ↑ ↓ ← →, Home / End | 모델 항목 이동 (순환)·처음/끝 | 모델 선택 radiogroup 안 포커스 | `ChatModelSelector.tsx:65-82` |
| Enter / 스페이스 | 모델 선택, 세션 선택 | 각 요소 포커스 | `ChatModelSelector.tsx:83-86`, `SessionItemCard.tsx:59` |

## 상수·설정값
| 이름 | 값 | 위치 |
|---|---|---|
| 테마 저장 키 | `agentlens_theme` (`light` / `dark` / `system`) | `context/ThemeContext.tsx:47`, `app/layout.tsx:23` |
| 기본 테마 | `system` | `context/ThemeContext.tsx:46` |
| 테마 순환 순서 | light → dark → system → light | `lib/theme-store.ts:23-27` |
| 같은 탭 테마 변경 이벤트 | `agentlens:theme-change` | `lib/theme-store.ts:14` |
| `<html>` 테마 표시 | 클래스 `dark`/`light`, 속성 `data-theme`, `style.colorScheme` | `lib/theme-store.ts:133-144`, `app/layout.tsx:23-26` |
| 북마크 저장 키 | `agentlens_bookmarks` | `hooks/useBookmarks.ts:6` |
| 스케줄 재조회 주기 | 30,000ms | `hooks/useCollector.ts:23` |
| 수집 진행 폴링 주기 | 1,200ms | `hooks/useCollector.ts:24` |
| 수집 완료 메시지 표시 | 4,000ms | `hooks/useCollector.ts:25` |
| 수집 요청 실패 메시지 표시 | 3,000ms | `hooks/useCollector.ts:29` |
| 헤더 버전 표시 | `NEXT_PUBLIC_APP_VERSION` (빌드 때 `package.json` 의 `version`, 지금 `v0.3.1`), 1024px 이상, 값이 없으면 숨김. 클라이언트 번들에 `package.json` 을 넣지 않는다 | `next.config.ts:6`, `:14`, `components/Header.tsx:66` |
| 헤더 높이 | 56px (`h-14`) | `components/Header.tsx:122`, `components/chat/ChatHeader.tsx:98` |
| 팔레트 명령 수 | 피드 9 (기본 5 + 선택 4), 챗 4 | `components/CommandPalette.tsx:76-159`, `components/chat/ChatWorkspace.tsx:581-621` |
| 팔레트 위치·크기 | 768px 이상 위에서 `12dvh`, 너비 560px, 최대 높이 `85dvh` / 미만 전체 화면 | `components/ui/Dialog.tsx:91`, `:101-105` |
| 대화상자 너비 (768px 이상) | sm 420 / md 560 / lg 720 / xl 896px | `components/ui/Dialog.tsx:69-74` |
| 드로어 너비 | `min(320px, 85vw)` | `components/ui/Dialog.tsx:99` |
| 바텀시트 최대 높이 | `90dvh` | `components/ui/Dialog.tsx:109` |
| 바텀시트 스와이프 닫기 거리 | 100px | `components/ui/Dialog.tsx:25` |
| 메뉴 너비·최대 높이 | `min(280px, 100vw - 32px)`, `min(70dvh, 32rem)` | `components/ui/Menu.tsx:182` |
| 복사 피드백 | 2,000ms (`복사됨`·`복사 실패`) | `hooks/useCopyToClipboard.ts:70`, `components/NewsDetailModal.tsx:24` |
| 알림 자동 닫힘 | 3,500ms | `components/ui/Toast.tsx:25` |
| 소스 대화상자 결과 안내 | 3,500ms | `components/SourcesModal.tsx:102` |
| 챗 입력창 최대 높이 | 180px | `components/chat/ChatPromptInput.tsx:26` |
| 챗 입력창 포커스 스크롤 지연 | 100ms | `components/chat/ChatPromptInput.tsx:73-75` |
| 챗 사이드바/드로어 전환 기준 | 1024px (`useMediaQuery('(min-width: 1024px)')`) | `components/chat/ChatWorkspace.tsx:63` |
| 레이어 | 피드 필터 영역 z-10, 챗 사이드바 z-20, 헤더 z-30, 메뉴·팝오버 z-40, 대화상자 z-50, 알림 z-60 | 각 파일 |
| 배경막 색 | `bg-scrim`: 라이트 `rgb(15 23 42 / 0.45)`, 다크 `rgb(0 0 0 / 0.6)` | `app/globals.css:33`, `:62` |
| 모션 | `fade-in` 150ms, `dialog-in` 200ms, `sheet-in`·`drawer-in` 240ms, `ease-standard` `cubic-bezier(0.2, 0, 0, 1)` | `app/globals.css:101-105` |
| 스크롤바 | 얇게(`thin`), WebKit 6px, 색 `border-strong` | `app/globals.css:140-159` |
| 가로 스크롤 줄 '사용자 조작 중' 종료 | `scrollend`, 없으면 마지막 `scroll` 뒤 150ms. 입력 뒤 `scroll` 이 없으면 1,000ms | `components/ui/ScrollRow.tsx:47`, `:49` |
| viewport | `device-width`, scale 1, `resizes-content`, `color-scheme: light dark`, `theme-color` `#f8fafc`/`#0e1013` | `app/layout.tsx:6-15` |

## 알려진 불일치·위험
1. **클립보드 복사가 폐기 예정 API 에 기댄다.** 공통 훅과 Ask AI 복사는 `navigator.clipboard` 가 실패하면 `execCommand('copy')` 로 다시 시도하는데, 이 API 는 표준에서 폐기 예정이다. `next.config.ts` 의 `allowedDevOrigins` 에 LAN IP(`192.168.1.109`)가 있어 HTTP(비보안 출처)로 접속하면 첫 번째 방식이 실패하고 대체 방식에 기댄다 (UI-13).
2. **팝오버가 포털을 쓰지 않는다.** 인용 팝오버는 답변 문단 `<p>` 안에 `div` 로 그려져 HTML 중첩 규칙에 어긋나고, 부모의 `overflow`·쌓임 맥락에 잘릴 수 있다 (UI-14).
3. **세션 카드 안에 버튼이 중첩된다.** `role="button"` 카드 안에 삭제 `IconButton` 이 있다 (`SessionItemCard.tsx:76-122`).
4. **`HotkeyMapping` 의 `modifiers`·`allowInInputs` 는 선언만 있고 동작하지 않는다.** `ThemeToggle` 은 렌더하는 곳이 없다.
5. **가로 스크롤 줄의 사용자 스크롤 판정이 시간 값에 기댄다.** 150ms·1,000ms 는 측정 근거가 없는 값이다. `scrollend` 가 없는 브라우저에서 관성 스크롤이 150ms 넘게 멈췄다 다시 움직이면 그 뒤 `scroll` 을 사용자 스크롤로 보지 않아, 폭이 바뀔 때 선택 항목으로 줄을 끌어올 수 있다. 입력 없이 다른 코드가 줄을 움직여도 사용자 스크롤로 보지 않는다 (UI-09 규칙 6, `components/ui/ScrollRow.tsx:43-52`).
