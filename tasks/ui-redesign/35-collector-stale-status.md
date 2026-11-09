# Task 35: 오래된 상태 응답 버리기 (statusSeq)

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 35 (리뷰 후속)
Status: done
Session: main
Agent: a3946f65cec43927e (implementer H)
Updated: 2026-11-06

## 한 일
- 먼저 실패하는 테스트: `tests/hooks/useCollector.test.ts` 에 새 `describe('useCollector (오래된 상태 응답 버리기, C-7 ④)')` 와 새 도우미 `deferred()`·`settle()` 추가 (기존 블록·도우미 불변). 커밋 054f624.
  - ① 마운트 상태 #1 `is_running: true` 로 폴링 복원 → 30초 갱신 상태 #2 를 MSW 핸들러에서 붙잡아 둠 → 진행 응답 `is_running: false` 로 `수집 완료 (+2건 신규 반영)` → 완료 뒤 상태 #3 (`is_running: false`) 반영 → 붙잡은 #2 (`is_running: true`) 를 풂 → `isCollecting` false, `status.is_running` false, `PROGRESS_POLL_MS` ×4 뒤에도 진행 요청 횟수 불변, 완료 문구로 바뀐 횟수 1.
  - ② 상태 요청 A(먼저, 붙잡음)·B(나중, 바로 응답) 중 B 반영 뒤 A 가 오면 `status.minutes_until_next_run` 이 B 값(10) 그대로, `timeLeft` `10m`.
- 구현 (`hooks/useCollector.ts`): 모듈 변수 `statusSeq`(상태 요청마다 +1, 요청이 번호 캡처), `appliedStatusSeq`(마지막 반영 응답 번호), `progressEndSeq`(진행 폴링이 완료·실패로 끝날 때의 `statusSeq`). `loadStatus` 응답 번호가 `appliedStatusSeq` 보다 작거나 `progressEndSeq` 이하이면 상태도 폴링도 바꾸지 않고 버린다. 완료 처리에서 `progressEndSeq = statusSeq` 를 정한 뒤 기존 `loadStatus()` 를 부른다 (그 응답은 반영). 실패 처리에서도 `progressEndSeq = statusSeq`. `stopAll` 이 세 값을 0 으로 돌린다. 즉시 수집·초기화·`already_running`·`pollRun`·`generation` 규칙, 공개 반환값, 문구는 그대로. 커밋 f0da54a.

## 바꾼 파일
- frontend/src/tests/hooks/useCollector.test.ts (추가만)
- frontend/src/hooks/useCollector.ts

## 검사 결과
### 실패 테스트 (구현 전)
`cd frontend && pnpm exec vitest run src/tests/hooks/useCollector.test.ts` → `Tests 2 failed | 4 passed (6)`
- ① `ignores a late is_running status response sent before the progress polling finished`: `expected true to be false` (useCollector.test.ts:258, 붙잡은 응답을 푼 직후 `isCollecting` — 늦은 응답이 `progressTimer === null` 을 보고 폴링을 다시 켬)
- ② `keeps the newer status when an older status response arrives after it`: `expected 192 to be 10` (앞선 응답 A 가 B 를 덮어씀)
- 26 의 (a)~(c) 4개는 그대로 통과 (회귀 방지, 실패 예상 아님)

### 구현 뒤
끝 기준 `pnpm exec vitest run src/tests/hooks/useCollector.test.ts src/tests/Header.test.tsx src/tests/CommandPalette.test.tsx src/tests/modals/ScheduleModal.test.tsx`
```
 Test Files  4 passed (4)
      Tests  34 passed (34)
```
`pnpm exec eslint src/hooks/useCollector.ts src/tests/hooks/useCollector.test.ts` → 출력 없음, 종료 0
`pnpm exec tsc --noEmit` → 출력 없음, 종료 0
`pnpm test` (전체, 21:09 작업 트리 기준)
```
 Test Files  50 passed (50)
      Tests  567 passed (567)
```

## 결정
- 진행 '실패' 처리에서는 `progressEndSeq` 만 정하고 `loadStatus()` 를 새로 부르지 않았다. plan 문장('완료 처리와 실패 처리에서 `progressEndSeq = statusSeq` 를 정한 뒤 `loadStatus()` 를 부른다')을 '완료 처리는 기존대로 그 뒤 `loadStatus()`' 로 읽었다. 실패 때도 바로 상태를 읽으면, 진행 조회만 계속 실패하고 backend 가 `is_running: true` 인 경우 폴링이 1.2초마다 켜졌다 꺼지며 진행 줄이 깜빡인다. 실패 뒤 복원은 다음 30초 갱신이 맡는다 (spec C-7 ④ 는 실패 때 다시 읽기를 요구하지 않는다).
- 가짜 타이머는 26 과 같이 `setInterval`/`clearInterval` 만. 응답 순서는 MSW 핸들러 안에서 `deferred()` 약속을 기다려 정하고, 응답 처리는 실제 `setTimeout` 으로 잠깐 기다린다 (`settle()`). 테스트 전용 내보내기 없음, `vi.resetModules()` + 동적 import.
- 완료 문구 횟수는 `renderHook` 렌더마다 `message` 를 기록해 '다른 문구 → `수집 완료…`' 로 바뀐 횟수로 센다.

## 막힌 점
- 없음. (테스트 실행 때 React 'not wrapped in act' 경고가 stderr 에 찍히지만 판정에는 영향 없다 — 26 과 같다.)

## 다음
- 관문 G8 (메인 세션).
- 37 문서: `docs/functional-spec/07-ui-common.md` UI-02 에 오래된 상태 응답 버리기·완료 알림 1회, `docs/test-cases.md` 에 ①② 추가.
