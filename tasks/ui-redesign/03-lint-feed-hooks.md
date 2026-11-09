# Task 03: lint: 피드·훅

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 3
Status: done
Session: implementer C
Agent: abc3094397c406b58
Updated: 2026-11-06

## 한 일
- lint 오류 9개를 없앴다 (eslint-disable 없음, 테스트 수정 없음).
- `Header.tsx:46` 일정 상태 조회를 `useCallback` + `.then(setStatus)` 로 바꿔 effect 안 동기 setState 제거. `:103` `catch (e: any)` → `e instanceof Error` 로 좁힘 (alert 는 09 에서 바꾼다).
- `CommandPalette.tsx:121` `search` 변경 effect 를 지우고 입력 `onChange` 에서 `setSelectedIndex(0)`.
- `NewsCard.tsx:49` 렌더 중 `Date.now()` 대신 모듈 시계 저장소(1분 간격 갱신)를 `useSyncExternalStore` 로 읽고, `getRelativeTime(dateStr, now)` 를 컴포넌트 밖으로. `:174` `{} as any` 제거: `onHandoverToChat` 의 `e` 를 선택 인자로 (호출처 없음).
- `useBookmarks.ts:17` `agentlens_bookmarks` 를 `useSyncExternalStore` 로 읽는다 (서버 스냅숏 null → 하이드레이션 불일치 없음, `storage` 이벤트로 다른 탭 반영). 키·JSON 형식 그대로, 저장 실패 시에도 화면 상태는 바뀐다 (이전 동작 유지).
- `useNewsFeed.ts:91,99,103` 요청 키(`requestKey`)와 완료된 응답 키를 비교해 `loading`·`error` 를 파생, effect 는 비동기 콜백에서만 setState. 북마크 보기는 `useMemo` 파생. `loadNews`·`loadStatsAndBriefing` 은 재요청 카운터 증가, `setError(null)` 동작 유지. 반환 이름 그대로.

## 바꾼 파일
- frontend/src/components/Header.tsx
- frontend/src/components/CommandPalette.tsx
- frontend/src/components/NewsCard.tsx
- frontend/src/hooks/useBookmarks.ts
- frontend/src/hooks/useNewsFeed.ts

## 검사 결과
- `pnpm exec eslint` 5개 파일: `✖ 3 problems (0 errors, 3 warnings)` (기존 미사용 변수 경고)
- `pnpm exec tsc --noEmit`: 출력 없음 (오류 0)
- `pnpm exec vitest run src/tests/CommandPalette.test.tsx src/tests/NewsCard.test.tsx src/tests/HotkeyListener.test.tsx src/tests/chat/HandoverIntegration.test.tsx`: `Test Files 4 passed (4)`, `Tests 27 passed (27)`
- 참고 `pnpm test` 전체: `Test Files 24 passed (24)`, `Tests 241 passed (241)`

## 결정
- 피드 요청은 effect 정리 함수로 늦게 온 이전 응답을 버린다 (이전: 마지막 도착 응답이 이김).
- `setError` 는 `(message: string | null) => void` (page.tsx 는 null 만 넘긴다).

## 막힌 점
- 없음. 확인 시점에 다른 단계 파일의 tsc 오류도 없었다.

## 다음
- 관문 G0 (메인 세션).
