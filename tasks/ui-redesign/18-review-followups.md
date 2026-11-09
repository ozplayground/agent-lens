# Task 18: 리뷰 후속

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 18
Status: done
Session: implementer A
Agent: af6e0d326aef729b0
Updated: 2026-11-06

## 한 일
- a) 버전 배지
  - `next.config.ts`: `package.json` 은 설정 파일에서만 import 하고 `version` 만 `env.NEXT_PUBLIC_APP_VERSION` 으로 넘긴다.
  - `Header.tsx`: `package.json` import 를 지우고, 렌더 때 `process.env.NEXT_PUBLIC_APP_VERSION` 을 읽는다. 값이 없으면 배지(바깥 `hidden lg:inline-flex` span 포함)를 그리지 않는다. 쓰지 않던 `APP_VERSION` 내보내기도 지웠다.
  - `tests/Header.test.tsx`: 버전 테스트를 `vi.stubEnv` 두 경우로 바꿨다. 값 `9.8.7` → `v9.8.7` 이 보임. 값 `''` → `^v\d` 글자가 없고 브랜드 링크 이름은 `AgentLens`. `afterEach(vi.unstubAllEnvs)` 로 정리한다.
- b) 줄어든 움직임: `ChatMessageList.tsx`(맨 아래로 스크롤)와 `ChatPromptInput.tsx`(포커스 뒤 `block:'end'`)가 `useMediaQuery('(prefers-reduced-motion: reduce)')` 이면 `behavior:'auto'`, 아니면 `'smooth'` (AskAiPanel 과 같은 방식). `MobileViewport.test.tsx` 의 `objectContaining({ block: 'end' })` 단언은 그대로 통과한다.
- c) 수집 중 초기화 차단과 회차 구분:
  - `CommandPalette.tsx`: `PaletteCommand.disabled?` 와 `resetDisabled?` prop 을 더했다. 비활성 명령은 `aria-disabled="true"` + `opacity-50` + `cursor-not-allowed` 로 보이고, 클릭·Enter 로 실행되지 않는다 (팔레트도 닫히지 않음). 초기화 명령의 부제는 `수집 중에는 초기화할 수 없습니다` 로 바뀐다.
  - `Header.tsx`: `resetDisabled={isCollecting}` 를 넘긴다 (더보기 메뉴·스케줄 위험 영역과 같은 조건).
  - `useCollector.ts`: 진행 폴링 회차 `pollRun` 을 두었다. `startProgressPolling`(즉시 수집·초기화 성공 시 새 폴링 시작)에서 올리고, interval 은 자기 회차를 넘긴다. 응답이 돌아왔을 때 요청 당시 회차·세대가 지금과 다르면 버린다. 요청 중 플래그도 지금 회차일 때만 푼다.
  - 테스트 (`tests/Header.test.tsx`): 수집 중 팔레트 초기화 명령이 `aria-disabled` 이고 눌러도 확인 창이 열리지 않는다. 이전 회차의 늦은 진행 응답(`is_running:false`)이 새 회차의 진행 줄 문구를 덮지 않는다. 이 테스트는 고치기 전 `useCollector.ts` 로 돌리면 실패하는 것을 확인했다 (`git diff` 를 잠시 되돌려 실행 → `×`, 되살린 뒤 통과).
- d) 확인 창 포커스
  - 먼저 실패하는 테스트를 썼다: `tests/ui/ConfirmDialog.test.tsx`. 확인 버튼에 포커스가 있는 상태에서 busy 로 바뀌는 흐름. 고치기 전에 2개가 실패했다 (busy 중 컨테이너, 실패 후 오류 문구).
  - `ConfirmDialog.tsx`: `busy` 가 바뀔 때만 포커스를 옮긴다. busy 가 되면 대화상자 컨테이너(`role="alertdialog"`, `tabIndex=-1`)로 보낸다. 풀리면 오류가 있을 때는 오류 문구 래퍼(`tabIndex=-1`, 안에 `InlineAlert role="alert"`)로, 없을 때는 확인 버튼으로 보낸다. 처음 열 때는 기존대로 `취소`.
  - `useFocusTrap.ts`: 일반 대비책을 더했다. 컨테이너 안에서 `focusout` 이 `relatedTarget` 없이 일어나 포커스가 `body` 로 빠지면 다음 틱에 컨테이너로 되돌린다 (진행 중 `disabled` 가 된 버튼 등. 모든 Dialog·Drawer 공통). 닫힘·언마운트 뒤에는 대기 중 확인을 취소한다.
  - 테스트 5개: busy 중 컨테이너, 실패 후 오류 문구, 성공 후 확인 버튼, 처음 열면 취소, 포커스 트랩 대비책 (Dialog 안 버튼 `blur()` → 컨테이너).
- e) 문서는 고치지 않았다. 바뀐 점은 아래 '결정'·'다음' 에 적었다.

## 바꾼 파일
- frontend/next.config.ts
- frontend/src/components/Header.tsx
- frontend/src/components/CommandPalette.tsx
- frontend/src/components/chat/ChatMessageList.tsx
- frontend/src/components/chat/ChatPromptInput.tsx
- frontend/src/components/ui/ConfirmDialog.tsx
- frontend/src/hooks/useCollector.ts
- frontend/src/hooks/useFocusTrap.ts
- frontend/src/tests/Header.test.tsx
- frontend/src/tests/ui/ConfirmDialog.test.tsx (새)

## 검사 결과
- `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` — 세 명령 모두 종료 코드 0
  ```
   Test Files  43 passed (43)
        Tests  458 passed (458)
  ✖ 41 problems (0 errors, 41 warnings)
  tsc exit 0
  ```
- `make build` → 종료 코드 0 (라우트 `/`, `/_not-found`, `/api/health`, `/chat`)
- `grep -rl 'devDependencies' frontend/.next/static` → 출력 없음 (종료 코드 1)
- `grep -rn --include='*.ts' --include='*.tsx' "package.json" frontend/src` → 출력 없음 (주석 문구도 '패키지 버전' 으로 바꿨다)
- `grep -n 'NEXT_PUBLIC_APP_VERSION' frontend/next.config.ts` → `12:    NEXT_PUBLIC_APP_VERSION: APP_VERSION,`
- 빌드 산출물 `frontend/.next/static/chunks/*.js` 에 `0.3.1` 이 들어간다. dev 서버(재시작 후)의 `/` HTML 에도 `v0.3.1` 배지가 있다 (`curl http://localhost:3001/`).
- `grep -n "behavior" ChatMessageList.tsx ChatPromptInput.tsx` → 두 곳 모두 `reduceMotion ? 'auto' : 'smooth'`

## 결정
- 회차 번호는 새 진행 폴링이 실제로 시작될 때(`startProgressPolling`, 즉 즉시 수집 요청 성공·초기화 요청 성공) 올린다. 초기화 요청을 보내는 순간에 올리면, 요청이 실패했을 때 진행 중이던 폴링의 응답이 모두 버려져 `isCollecting` 이 풀리지 않는다. 늦게 온 이전 회차 응답이 새 회차를 덮지 않는다는 목적은 이 시점으로 충분하다 (테스트로 확인). 초기화는 수집 중에 UI 세 곳에서 모두 막혀 있다.
- 오류 문구 포커스 대상은 `InlineAlert` 를 감싼 `div tabIndex={-1}` 이다 (공통 부품 `InlineAlert` 의 API 는 바꾸지 않았다).
- 화면·동작 변경 (문서 반영용, 메인 세션):
  1. 버전 배지: `next.config.ts` 의 `env.NEXT_PUBLIC_APP_VERSION`(= package.json version)으로 그린다. 값이 없으면 배지를 숨긴다. src 에서 `package.json` 을 import 하지 않는다.
  2. 커맨드 팔레트의 `수집 데이터 초기화 & 재수집` 은 수집 중 비활성이다 (`aria-disabled`, 부제 `수집 중에는 초기화할 수 없습니다`). 더보기 메뉴·스케줄 위험 영역과 같은 조건이다. `PaletteCommand.disabled` 가 생겼다.
  3. 챗 메시지 목록 자동 스크롤과 입력창 포커스 스크롤은 `prefers-reduced-motion: reduce` 이면 즉시 이동한다 (known-issues '챗 smooth 스크롤' 해결).
  4. 확인 창 포커스: busy 중 컨테이너, 실패하면 오류 문구, 성공(창이 남는 경우)하면 확인 버튼. 모든 Dialog·Drawer 는 포커스가 `body` 로 빠지면 컨테이너로 되돌린다 (`useFocusTrap`).
  5. 수집 진행 폴링은 회차를 구분해 이전 회차 응답을 무시한다.

## 막힌 점
- 없음.

## 다음
- 메인 세션 문서 반영:
  - `docs/functional-spec/07-ui-common.md`: 버전 배지 조건, 팔레트 초기화 비활성, 수집 폴링 회차
  - `docs/ui-spec.md`: 헤더 배지, 팔레트 명령 비활성 표시
  - `docs/design-system.md`: ConfirmDialog busy 포커스 규칙, useFocusTrap 의 focusout 대비책, `PaletteCommand.disabled`
  - `docs/known-issues.md`: '챗 smooth 스크롤' 행 지우기
