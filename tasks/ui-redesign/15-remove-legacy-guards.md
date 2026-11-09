# Task 15: 옛 덮어쓰기 제거와 정적 검사

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 15
Status: done
Session: implementer A
Agent: af6e0d326aef729b0
Updated: 2026-11-06

## 한 일
- `globals.css`: 옛 덮어쓰기 영역을 모두 지웠다. 지운 것:
  - `html:not(.dark) …` 와 `html.dark …` 선택자 61개, `!important` 전부
  - 전역 `.shadow-2xl`·`.bg-black/60·70·75` 덮어쓰기
  - 전역 `input`·`textarea`·`select`·`pre`·`code` 색 덮어쓰기
  - hex 로 된 webkit 스크롤바 색
  - 남긴 것: 토큰(`:root`·`.dark`·`@theme inline`·`@theme`), `@layer base`, Safari 용 `::-webkit-scrollbar` 3규칙 (토큰 `--al-border-strong`, 트랙 투명. `html.dark` 분기 없음).
- `tests/design/TokenGuard.test.ts` (새, node 환경): `src/**/*.tsx` 전체를 읽어 아래 셋이 0개인지 확인한다. 실패하면 `파일:줄  일치` 목록을 낸다.
  - spec 11.3 정규식 그대로의 hex 색 클래스 `-\[#…\]`
  - 팔레트 색 유틸리티
  - `animate-in|zoom-in|slide-in-from`
  - 그리고 `globals.css` 의 `!important`·`html:not(.dark)`·`html.dark` 가 0개인지 확인한다.
- `tests/design/TokenContrast.test.ts` (새, node 환경): `globals.css` 의 `:root`·`.dark` 블록에서 `--al-*` 값을 읽어 WCAG 2.x 상대 휘도로 계산한다. 공식 자체는 21:1·1:1 기준값으로 검사한다.
  - spec 1.3 표의 '대비 확인' 25개 조합: 글자 4.5, `border-strong` 3
  - 포커스 링 `accent` 가 canvas·surface·surface-muted 위에서 3 이상
  - 라이트·다크 각각. 모두 통과했다 (1.3 표 값과 어긋나는 조합 없음).
- TokenGuard 가 처음 찾은 위반 1건: `tests/chat/ChatSidebar.test.tsx:225` 의 테스트 **이름** 문자열 `… border-l-indigo-600 and bg-indigo-50`. 13단계에서 단언은 토큰으로 바뀌었는데 이름만 남아 있었다. 이름을 `renders active session highlight with data-active, bg-accent-soft and border-accent` 로 바꿨다. `expect(` 줄은 그대로다.
- 10단계에서 남긴 일: `FeedToolbar` 의 Must-Read 칩에 `tone="warning"` (B 가 더한 `Chip tone`) 을 적용했다. 선택 시 별 아이콘은 `fill-current` (칩 글자색 warning 을 따름), 선택 전에는 `text-warning`.

## 바꾼 파일
- frontend/src/app/globals.css
- frontend/src/tests/design/TokenGuard.test.ts (새)
- frontend/src/tests/design/TokenContrast.test.ts (새)
- frontend/src/tests/chat/ChatSidebar.test.tsx (225행 테스트 이름만)
- frontend/src/components/feed/FeedToolbar.tsx (Must-Read 칩 `tone="warning"`)

## 검사 결과
- `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` — 세 명령 모두 종료 코드 0
  ```
   Test Files  42 passed (42)
        Tests  450 passed (450)
  test exit 0
  ✖ 41 problems (0 errors, 41 warnings)
  lint exit 0
  tsc exit 0
  ```
- `grep -rEn --include='*.tsx' -- '-\[#[0-9a-fA-F]{3,8}\]' frontend/src` → 출력 없음 (종료 코드 1). 참고: 이 셸의 `grep` 은 ugrep 별칭이고, BSD grep 은 `--` 뒤의 `--include` 를 파일로 읽는다. 그래서 `/usr/bin/grep` 으로 옵션 순서만 바꿔 돌렸다.
- `grep -c '!important' frontend/src/app/globals.css` → `0`
- `make build` → 종료 코드 0 (`✓ Compiled successfully`, 라우트 `/`, `/_not-found`, `/api/health`, `/chat`, 경고·오류 없음)

## 결정
- 두 가드 테스트 파일 첫 줄에 `// @vitest-environment node` 를 두었다. jsdom 환경에서는 `import.meta.url` 이 file 스킴이 아니라 소스 경로를 구할 수 없다. 검사 범위·정규식은 spec 그대로다.
- TokenGuard 는 spec 대로 `src/**/*.tsx` 전체(테스트 파일 포함)를 본다. 테스트 파일을 빼서 느슨하게 하지 않고, 걸린 테스트 이름을 고쳤다.
- 포커스 링 3:1 은 링이 놓일 수 있는 세 배경(canvas·surface·surface-muted) 모두에서 확인한다. 표의 `accent` 글자 조합(4.5)도 따로 확인한다.

## 막힌 점
- 없음. TokenGuard 가 공통 부품(`components/ui/**`)에서 찾은 위반은 없다.
- 관찰 (고치지 않음, 15 범위 밖): 전역 `code` 배경 덮어쓰기가 없어져 `McpModal.tsx:54` 의 제목 안 `<code className="font-mono text-sm">` 는 이제 배경 없이 고정폭 글자로만 보인다. 의도된 표시인지 16(ui-audit) 이나 verify 에서 보면 된다.

## 다음
- 없음. 16(ui-audit 실행)은 메인이 앱을 띄운 뒤 지시한다.
