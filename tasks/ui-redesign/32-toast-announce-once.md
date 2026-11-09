# Task 32: 알림 한 번만 알리기 (announcedBy)

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 32 (리뷰 후속)
Status: done
Session: main
Agent: a3e35e97a3d352473 (implementer C)
Updated: 2026-11-06

## 한 일
- 먼저 실패하는 테스트 (커밋 `c3afcc4`, `test(ui-redesign): 32 실패 테스트 — 영역이 바뀐 알림을 다시 알리지 않음`). `tests/ui/Toast.test.tsx` 에 새 `describe('ToastRegion 한 번만 알리기')` 를 추가만 했고, import 에 `within` 을 더했다.
  - 첫 테스트: global·composer 두 영역을 마운트하고 `danger` 알림을 띄우면 composer 안에 `role="alert"` 가 있다. 모달 `Dialog` 를 열어(`rerender`) 알림이 global 로 옮겨지면, 같은 알림 요소에 `role`·`aria-live` 가 없고 `within(global).queryAllByRole('alert')` 가 0개이며 닫기 버튼은 그대로 있다. 그 상태에서 띄운 새 `info` 알림은 global 에서 `role="status"`·`aria-live="polite"` 를 갖는다.
  - 커밋 전 실행에서 이 테스트는 예상한 이유로 실패했다: `expect(element).not.toHaveAttribute("role")`. 옮겨진 알림이 `role="alert"` 를 다시 갖고 있었다.
  - 회귀 방지 테스트 (실패 예상 아님): 영역이 하나일 때 `status`/`polite`, `alert`/`assertive`. 고치기 전에도 통과했다.
- 구현 (커밋 `8a46693`, `components/ui/Toast.tsx`):
  - 모듈 저장소에 `announcedBy: Map<number, string>`(알림 id → 영역 id) 를 두었다.
  - `ToastRegion` 은 영역 소유자일 때 `useEffect`(deps `isOwner`, `items`, `regionId`)에서 아직 기록이 없는 id 만 자기 `regionId` 로 적는다.
  - 알림 요소는 기록이 없거나 자기 영역 id 일 때만 `role`·`aria-live` 를 갖는다. 글자·아이콘·닫기 버튼·클래스는 바꾸지 않았다.
  - `dismissToast` 는 `announcedBy.delete(id)`, `clearToasts` 는 `announcedBy.clear()` 로 기록을 지운다.
  - 소유자 판정은 hook 순서 때문에 `isOwner` 변수로 먼저 계산하고, 그 뒤에 `return null` 한다. 고르기 규칙(`pickRegionOwner`) 자체는 바꾸지 않았다.
  - 첫 영역이 기록 전에 다시 그려져도 기록이 없으면 live 이므로 live 속성을 잃지 않는다.

## 바꾼 파일
- `frontend/src/components/ui/Toast.tsx`
- `frontend/src/tests/ui/Toast.test.tsx` (추가만)

## 검사 결과
- 끝 기준 `cd frontend && pnpm exec vitest run src/tests/ui/Toast.test.tsx src/tests/ui/OverlayStack.test.tsx src/tests/ui/Dialog.test.tsx src/tests/chat/ChatWorkspace.test.tsx src/tests/modals src/tests/Header.test.tsx`
  ```
   Test Files  11 passed (11)
        Tests  103 passed (103)
  ```
- 정적 확인 `grep -nE "announcedBy\.(delete|clear)" frontend/src/components/ui/Toast.tsx`
  ```
  64:  announcedBy.delete(id);
  88:  announcedBy.clear();
  ```
  64행은 `dismissToast`(60행~), 88행은 `clearToasts`(86행~) 안이다.
- `pnpm exec eslint src/components/ui/Toast.tsx src/tests/ui/Toast.test.tsx` → 종료 0
- `pnpm exec tsc --noEmit` → 종료 0
- 전체 `pnpm test` (같은 작업 트리에서 30·31·33·35 진행 중): `Test Files  1 failed | 49 passed (50)`, `Tests  3 failed | 564 passed (567)`. 실패 3건은 모두 31 B 가 진행 중인 `tests/ui/ChipGroup.test.tsx` 의 리뷰 후속 블록이다 (ScrollRow 포커스 유지 ①②, `ChipGroup selectedSelector` ④). 32 파일과는 상관없다.

## 결정
- spec 14.7 C-2 대로 '기록이 없거나 자기 영역 id' 일 때 live 다. 그래서 알림이 원래 영역으로 돌아가면 그 영역이 다시 live 로 그린다 (composer → 모달 열림으로 global → 모달 닫힘으로 composer). 이때 새 DOM 요소로 마운트되므로 스크린리더가 한 번 더 읽을 수 있다. plan·spec 의 규칙 그대로라 더 고치지 않았다. 막으려면 '지금 그리고 있는 영역' 을 따로 추적해야 하므로 spec 을 바꿔야 한다 (메인 세션에 보고).
- spec 14.9 의 '닫힌 알림 id 는 기록에서 지워짐' 은 공개 API 로 관찰할 수 없다. plan 대로 테스트 전용 export 를 만들지 않고 위 정적 확인으로 대신했다.

## 막힌 점
- 없음.

## 다음
- 37 (메인 세션): `docs/design-system.md` `Toast` 행(한 번만 알림), `docs/functional-spec/07-ui-common.md` 의 알림 재알림 없음.

## 후속 (spec 리뷰 후속 보정 2, `c9959c3`)
위 '결정' 첫 항목에 적은 왕복 재알림 문제를 spec 보정 2 대로 고쳤다. R23 과 14.7 C-2 를 따른다: 다른 영역으로 한 번 넘어간 알림은 처음 영역으로 돌아와도 live 가 아니다.

### 한 일
- 실패 테스트 (커밋 `46102d4`, `test(ui-redesign): 32 후속 실패 테스트 — composer → global → composer 왕복 뒤 재알림 없음`). `Toast.test.tsx` 에 새 `describe('ToastRegion 한 번만 알리기 — 왕복')` 를 추가만 했다.
  - 테스트 흐름: composer 에서 `danger` 알림이 `role="alert"` 로 뜬다. 모달을 열어 global 로 넘어갔다가 모달을 닫아 composer 로 돌아온다. 이때 composer 안 같은 글자 요소에 `role`·`aria-live` 가 없고, `queryAllByRole('alert')` 가 0개이며, 닫기 버튼은 있다. 돌아온 뒤 새로 뜬 알림은 composer 에서 `role="status"`·`aria-live="polite"` 를 갖는다.
  - 커밋 전 실행에서 예상한 이유로 실패했다: `Toast.test.tsx:220` `expect(returned).not.toHaveAttribute('role')`. 기록이 처음 영역 id 로 남아 있어 돌아온 composer 가 live 로 다시 마운트했다.
- 구현 (커밋 `0a6dbeb`): `announcedBy: Map<number, string | null>`.
  - 그린 영역은 `useEffect` 에서 기록을 고친다: 기록이 없으면 자기 id 를, 다른 영역 id 면 `null`(넘겨줌)을 적고, 자기 id 나 `null` 이면 그대로 둔다.
  - 알림 요소는 기록이 없거나 자기 영역 id 일 때만 `role`·`aria-live` 를 갖는다.
  - `dismissToast`/`clearToasts` 의 기록 삭제, 영역 고르기, `placement`, `data-toast-region`, 시간, `role`·`aria-live` 값은 그대로다.
  - StrictMode 이중 실행: 첫 실행이 자기 id 를 적고, 둘째 실행은 자기 id 를 보고 그대로 두므로 `null` 로 바뀌지 않는다.

### 바꾼 파일
- `frontend/src/components/ui/Toast.tsx`
- `frontend/src/tests/ui/Toast.test.tsx` (추가만)

### 검사 결과
- 끝 기준 `pnpm exec vitest run src/tests/ui/Toast.test.tsx src/tests/ui/OverlayStack.test.tsx src/tests/ui/Dialog.test.tsx src/tests/chat/ChatWorkspace.test.tsx src/tests/modals src/tests/Header.test.tsx` → `Test Files  11 passed (11)`, `Tests  104 passed (104)`
- `grep -nE "announcedBy\.(delete|clear)" frontend/src/components/ui/Toast.tsx` → `65:  announcedBy.delete(id);`(`dismissToast` 안), `89:  announcedBy.clear();`(`clearToasts` 안)
- `pnpm exec eslint src/components/ui/Toast.tsx src/tests/ui/Toast.test.tsx` → 종료 0
- `pnpm exec tsc --noEmit` → 종료 0
- 전체 `pnpm test`: `Test Files  1 failed | 49 passed (50)`, `Tests  6 failed | 570 passed (576)`. 실패 6건은 모두 34 E 가 진행 중인 `tests/feed/FeedToolbar.test.tsx` 의 '한 트리·DOM 순서·소스 줄 선택 칩 (… 리뷰 후속 34)' 블록이다 (실패 테스트가 먼저 커밋되고 구현은 아직이다). 32 파일과는 상관없다.

### 결정
- 위 '결정' 첫 항목의 왕복 재알림은 이번 후속으로 처리했다.

### 막힌 점
- 없음.
