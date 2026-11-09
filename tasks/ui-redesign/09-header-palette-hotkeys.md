# Task 09: 헤더·수집·팔레트·단축키

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 9
Status: done
Session: implementer A
Agent: af6e0d326aef729b0
Updated: 2026-11-06

**09 done** — CommandPalette 의 새 API(`commands?: PaletteCommand[]`, 선택 prop 4개)를 13 이 연결할 수 있다.

## 한 일
- `hooks/useCollector.ts`: 모듈 단위 외부 저장소(`useSyncExternalStore`). 구독자가 있을 때만 스케줄 30초 재조회. 수집이 시작되면 1.2초마다 진행을 폴링하고, 앞 요청이 안 끝났으면 그 회차는 건너뛴다. 마지막 구독자가 빠지면 interval·timeout 을 모두 정리하고 상태를 초기화한다 (세대 번호로 늦게 온 응답을 버림). `collectNow`·`resetAndCollect` 는 요청 중 플래그로 중복 요청을 막는다. 문구는 UI-02 그대로 (`실시간 소식 수집 중...`, `수집 완료 (+N건 신규 반영)` 4초, `수집 요청 실패` 3초, `기존 N건 삭제 완료. 신규 수집 중...`). `useCollector({ onRefresh })` 는 새로고침 콜백을 등록한다 (저장 건수 증가·완료·초기화 때 부름). `formatTimeLeft()` → `3h 12m`.
- `components/ResetConfirmDialog.tsx` (새): `ConfirmDialog tone="danger"`. 제목·경고 문구 유지, `취소`/`전체 삭제 후 다시 수집`, 진행 중 `초기화 중...` + `busy`. 실패는 창 안 `InlineAlert` (오류 메시지 또는 `초기화 실패`). `alert()` 를 없앴다.
- `Header.tsx` 다시 쓰기:
  - 56px sticky 한 줄, 건너뛰기 링크(`#main`).
  - 브랜드 링크 + `v{package.json version}` 배지 (lg 이상).
  - `nav aria-label="주 메뉴"`: `피드` 에 aria-current, `AI 챗` 링크 하나 (모바일은 글자에 `max-md:sr-only`).
  - 수집 상태 버튼 (md 이상, `aria-label="수집 스케줄 · 다음 수집 …"`), 즉시 수집 `Button` (md 이상, 태블릿은 글자 sr-only).
  - 팔레트: lg 이상 `검색·명령` + `Kbd ⌘K`, lg 미만 `IconButton label="커맨드 팔레트 열기"`. `ThemeMenu` (md 이상).
  - `MenuButton label="더보기"`: 소스 & 리서처, 공유 & 알림, MCP 연동, RSS 피드(새 탭), 구분선, `초기화 & 재수집…`(위험 톤). 모바일(`useMediaQuery('(max-width: 767px)')`)이면 위험 항목 앞에 `수집 스케줄 (다음 … 후)`, `즉시 수집`, 테마 라디오 3개를 넣는다.
  - ⌘K 는 `useHotkey('mod+k', …, { allowInInputs: true })`: 팔레트가 맨 위면 닫고, 다른 레이어가 열려 있으면 무시하고, 아니면 연다. 버전은 `import pkg from '../../package.json'`.
- `CollectorStatusLine` (Header.tsx 에서 내보냄): `<header>` 밖의 진행 줄. `role="status" aria-live="polite"` 요소는 항상 있고, 메시지가 있을 때만 `h-9 bg-surface-muted` 줄을 그린다.
- `CommandPalette.tsx` 다시 쓰기:
  - `Dialog size="md" placement="top" ariaLabel="커맨드 팔레트"` + `header` (검색 입력 + `닫기` IconButton 하나).
  - 입력은 `role="combobox"` (`aria-controls`·`aria-activedescendant`·`aria-expanded`), 목록은 `ul role="listbox"` + `li role="option"`.
  - 자체 window 리스너를 없앴다 (Escape 는 오버레이 스택).
  - 기존 5개 명령의 순서·문구 유지, `C` 표시 제거 (`T` 는 유지).
  - 선택 prop(`onOpenSchedule`, `onOpenSettings`, `rssUrl`, `onRequestReset`)이 있을 때만 `수집 스케줄 보기`, `공유 & 알림 설정 열기`, `RSS 피드 열기`, `수집 데이터 초기화 & 재수집` 을 더한다.
  - `commands?: PaletteCommand[]` 로 목록을 통째로 바꾼다. 닫히면 내용이 언마운트되어 검색어·선택이 초기화된다.
- `HotkeyListener.tsx`:
  - 기존 props·동작 유지, `blockSingleKeys?` 추가.
  - IME `keyCode 229` 도 무시하고, 입력 판정에 `role="combobox"` 를 더했다.
  - 글자 키는 `e.key` 소문자 → `e.code`(`KeyJ` 등, `Slash`) 순서로 판정한다.
  - Enter/Space 는 `e.target === document.body` 일 때만 `onOpenDetailModal` + `preventDefault`.
  - ⌘K 는 `onToggleCommandPalette` 를 넘겼을 때만 가로챈다.
- `ScheduleModal.tsx`: `Dialog size="md" title="자동 수집 스케줄"` (설명 = 기존 부제), 토큰 색. 바닥에 `즉시 수집`(`useCollector`). '위험 영역' 절의 `초기화 & 재수집…` `Button danger` → `ResetConfirmDialog` (스택 위에 쌓임). props(`isOpen`, `onClose`) 유지. 상태는 공유 저장소에서 읽는다.
- `app/page.tsx` (09 몫):
  - `HotkeyListener` 에 `blockSingleKeys={useOverlayOpen()}` 를 넘기고, `onCloseOverlays`·`onToggleCommandPalette` 는 넘기지 않는다 (`handleCloseOverlays` 제거).
  - j/k 는 다음 인덱스를 계산해 `[data-feed-card]` 의 `h3 button`(없으면 카드)에 실제 포커스를 옮기고 `scrollIntoView({ block: 'nearest' })`.
  - `focusedIndex` 는 [page, category, source, search, sort, highSignalOnly] 가 바뀌면 렌더 중 비교로 -1.
  - `<Header/>` 바로 아래에 `<CollectorStatusLine/>`.
- 테스트 (새): `tests/Header.test.tsx`(9), `tests/HotkeyGating.test.tsx`(7), `tests/modals/ScheduleModal.test.tsx`(5).

## 바꾼 파일
- frontend/src/hooks/useCollector.ts (새)
- frontend/src/components/ResetConfirmDialog.tsx (새)
- frontend/src/components/Header.tsx
- frontend/src/components/CommandPalette.tsx
- frontend/src/components/HotkeyListener.tsx
- frontend/src/components/ScheduleModal.tsx
- frontend/src/app/page.tsx
- frontend/src/tests/Header.test.tsx (새)
- frontend/src/tests/HotkeyGating.test.tsx (새)
- frontend/src/tests/modals/ScheduleModal.test.tsx (새)

## 검사 결과
- `pnpm exec vitest run src/tests/Header.test.tsx src/tests/HotkeyGating.test.tsx src/tests/HotkeyListener.test.tsx src/tests/CommandPalette.test.tsx src/tests/modals/ScheduleModal.test.tsx src/tests/chat/HandoverIntegration.test.tsx`
  ```
   Test Files  6 passed (6)
        Tests  43 passed (43)
  ```
- `pnpm exec eslint <바꾼 10개 파일>` → 오류 0 (종료 코드 0)
- `pnpm exec tsc --noEmit` → 이 단계 파일 오류 0. 다른 단계 파일 오류 1개 ('막힌 점').

## 결정
- 팔레트는 명령의 `perform` 이 끝나면 `onClose` 를 부른다. 기본 명령의 `perform` 은 스스로 닫지 않는다. `commands` 로 넘기는 명령(13)도 스스로 닫을 필요가 없다.
- 커맨드 팔레트 버튼은 두 요소다: lg 이상 `검색·명령` 버튼, lg 미만 `IconButton label="커맨드 팔레트 열기"`. 접근 이름이 달라 공통 규칙의 '같은 이름 두 번' 에 걸리지 않고, 보이는 글자가 이름이 되어 WCAG 2.5.3 을 지킨다. 즉시 수집·AI 챗은 이름이 같아 요소 하나로 두고 글자만 `sr-only` 로 숨긴다.
- 수집 진행 줄은 `Header.tsx` 에서 `CollectorStatusLine` 으로 내보내고, page 가 헤더 바로 아래에 놓는다 (plan "헤더 아래 수집 진행 줄 배치").
- 스케줄 대화상자는 읽기 위주라 바닥 `닫기` 없이 머리줄 X(`닫기`) 만 둔다 (spec 2.1-7). 바닥에는 `즉시 수집` 을 둔다.
- ⌘K 의 '팔레트가 맨 위' 판정은 팔레트가 열려 있고 스택 깊이가 1 이하인지로 한다.
- 상태를 아직 모르면 수집 상태 버튼은 `다음 수집 확인 중` 이다 (이전: `0m 후`).
- `make build` 는 관문에서 메인이 돈다. 병렬 implementer 와 `.next` 충돌을 피하려고 이 단계에서는 돌리지 않았다.

## 막힌 점
- (다른 단계 파일, 기록만) `tsc`: `src/components/chat/ChatMessageItem.tsx(20,10): error TS2614: Module '"@/components/MarkdownViewer"' has no exported member 'CodeBlock'` — 11/14 에서 진행 중인 변경으로 보인다.
- 알려진 중간 상태: page 에서 `onCloseOverlays` 를 뺐으므로, 아직 `Dialog` 로 바뀌지 않은 모달(11·12 진행 중)은 G2 전까지 Escape 로 닫히지 않을 수 있다.

## 다음
- 10단계(피드 화면)로 이어 간다.
