# Task 33: 배지 줄 (Badge shrink, 기술 배지 줄어듦)

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 33 (리뷰 후속)
Status: done
Session: main
Agent: a1a17ea9b97a86155 (implementer D)
Updated: 2026-11-06

## 한 일
- `components/ui/Badge.tsx`: `shrink?: boolean`(기본 `false`)을 더했다. `false` 면 지금 클래스 그대로(`max-w-full shrink-0`), `true` 면 그 둘 대신 `shrink` 만 붙이고 폭 한계는 호출자 `className` 이 준다. 같은 속성 클래스가 두 번 붙지 않는다 (`lib/cn.ts` 불변). 다른 `Badge` 사용처는 고치지 않았다 (기본값).
- `components/NewsCard.tsx` 배지 줄: 감싸개에 `data-card-badges`, 클래스 `flex flex-nowrap items-center gap-1.5 overflow-hidden` 유지(안전장치). 기술 배지 `<Badge shrink className="min-w-12 max-w-32" title={tech}><span className="min-w-0 truncate">{tech}</span></Badge>`. Must-Read 는 `shrink` 없이 그대로(`shrink-0`). 기술 최대 3개, 머리줄·제목·본문·바닥 그대로, '+N'·펼침 없음.
- 테스트 추가만: `tests/NewsCard.test.tsx` 새 `describe('badge row shrinking (R16·R17, 리뷰 후속)')` 3개, `tests/ui/Primitives.test.tsx` 새 `it` 1개. 클래스는 `classList.contains` 로 토큰 단위로 본다. 기존 단언 불변.
## 바꾼 파일
- `frontend/src/components/ui/Badge.tsx`
- `frontend/src/components/NewsCard.tsx`
- `frontend/src/tests/NewsCard.test.tsx` (추가만)
- `frontend/src/tests/ui/Primitives.test.tsx` (추가만)
## 검사 결과
### 먼저 실패하는 테스트 (`Badge shrink` 는 받기만 하는 빈 구현)
명령: `cd frontend && pnpm exec vitest run src/tests/NewsCard.test.tsx src/tests/ui/Primitives.test.tsx`
결과: `Test Files 2 failed (2)`, `Tests 4 failed | 30 passed (34)`. 모두 예상 이유(단언)로 실패했다.
- `NewsCard.test.tsx > badge row shrinking > marks the badge row …`: `expected null not to be null` (`[data-card-badges]` 없음)
- `… lets each tech badge shrink …`: `:276` `expect(text.classList.contains('min-w-0')).toBe(true)` → `expected false to be true` (글자 감싸개에 `min-w-0` 없음)
- `… keeps the Must-Read badge from shrinking`: `expected null not to be null` (`[data-card-badges]` 없음)
- `Primitives.test.tsx > display primitives > Badge shrink …`: `:95` `classList.contains('shrink')` → `expected false to be true` (빈 구현이라 `shrink-0 max-w-full` 이 붙음)
- 배치 증거 (jsdom 은 배치를 계산하지 않는다): spec 14.4 '배지 줄 (리뷰 후속)' 의 리뷰 측정 — 1024 3열 카드 안쪽 약 266px 에서 Must-Read + 긴 기술 3개면 마지막 배지가 약 20px 글자 중간에서 잘림 (`Badge.tsx:24` 늘 `shrink-0`, 글자 감싸개 `min-w-0` 없음). 30 의 `defects.html` ③ 배지 줄 실패 줄은 이 시점 30 task 에 아직 없다 (30 진행 중). 프로덕션 확인은 36.
### 구현 뒤
- 실패 테스트 커밋: `2f4b178 test(ui-redesign): 33 실패 테스트 — Badge shrink, 기술 배지 줄어듦`
- 끝 기준 `cd frontend && pnpm exec vitest run src/tests/NewsCard.test.tsx src/tests/ui/Primitives.test.tsx src/tests/modals src/tests/chat src/tests/feed src/tests/design` → 종료 0, `Test Files 32 passed (32)`, `Tests 374 passed (374)`
- `pnpm exec eslint src/components/ui/Badge.tsx src/components/NewsCard.tsx src/tests/NewsCard.test.tsx src/tests/ui/Primitives.test.tsx` → 종료 0, 출력 없음
- `pnpm exec tsc --noEmit` → 종료 0, 출력 없음
- 전체 `cd frontend && pnpm test` (30·31·32·35 미완 변경이 같은 작업 트리에 있음) → 종료 1, `Test Files 1 failed | 49 passed (50)`, `Tests 3 failed | 564 passed (567)`. 실패 3개는 모두 `tests/ui/ChipGroup.test.tsx` 의 31 실패 테스트(`fb2a3a3`: ① 사라지는 다음 버튼 포커스, ② 768 미만 버튼 사라짐 포커스, ④ `ChipGroup selectedSelector`)로 31 진행 중 상태다. 33 과 무관하다 (병렬 단계 끝 검사 규칙).

## 결정
- `Badge` 의 `shrink` 분기는 기본 클래스 문자열에서 `max-w-full shrink-0` 을 떼어 `shrink ? 'shrink' : 'max-w-full shrink-0'` 로 붙였다. 기본값의 클래스 집합은 이전과 같다 (순서만 다름).
- 배지 줄의 실제 배치(1024 3열 약 266px 에 Must-Read + 기술 48px×3 이 들어감)는 jsdom 으로 잴 수 없어 클래스로만 단언했다. 확인은 30 fixture ③ 과 36 측정.
## 막힌 점
- 없음. 30 의 `defects.html` ③ 실패 줄은 30 진행 중이라 인용하지 못했다 (36 에서 함께 본다).
## 다음
- G8 에서 31 구현이 들어온 뒤 전체 `pnpm test` 를 다시 확인한다. 36 이 1024 배지 줄 `clip` 실패 0 을 확인한다.
