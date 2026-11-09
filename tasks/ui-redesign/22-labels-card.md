# Task 22: 카테고리 라벨·카드 고정 틀·반복 시사점

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 22
Status: done
Session: main
Agent: a1a17ea9b97a86155 (implementer D)
Updated: 2026-11-06

## 한 일
- `lib/labels.ts`: `CATEGORY_LABELS` 를 긴 라벨(`하네스 & 벤치마크`, `MCP & 생태계`, `에이전트 아키텍처`, `최신 AI 동향` — `FeedToolbar` 칩과 같은 문구)로 바꾸고 `CATEGORY_SHORT_LABELS`(`하네스`, `MCP`, `에이전트`, `AI 동향`)와 `categoryShortLabel()` 을 더했다. 모르는 id 는 기존 `lookup` 규칙대로 원값(프로토타입 키 포함). `sourceLabel` 은 그대로.
- 새 `lib/feed-insights.ts`: `findRepeatedInsights(items: NewsItem[]): Set<number>` — `why_it_matters` 를 공백 정리(연속 공백 하나, 앞뒤 제거)한 문자열의 끝 40자(코드 포인트 기준)를 키로 세어, 정리한 길이 20자 이상이고 키가 2번 이상 나온 기사 id. 문자열이 아니면(`null` 등) 빈 값으로 본다.
- `components/NewsCard.tsx` (14.4 고정 틀): `Card` 에 `h-full flex flex-col gap-3`. ① 머리줄 `data-card-meta`(`flex h-11 items-center gap-2 md:h-8`) — 왼쪽 `min-w-0 flex-1 truncate text-xs text-fg-subtle` 안에 짧은 카테고리 라벨 `<span class="font-medium text-fg-muted">` · 소스 · 시간, 오른쪽 북마크 `IconButton size="sm"`(음수 마진 제거, `title` `보관하기`/`보관됨` 유지). ② `h3`(`line-clamp-2 min-h-12 text-base leading-6 font-semibold`) > `button`(`line-clamp-2`). ③ 본문 `p`(`line-clamp-2 min-h-12 text-sm leading-6 text-fg-muted`) — 시사점이면 `border-l-2 border-accent pl-3` + 앞머리 `<span>시사점</span>` + 문장 `<span>`, `preferSummary && summary` 면 요약, 둘 다 없으면 빈 `p aria-hidden min-h-12`. ④ 배지 줄(있을 때만) `flex flex-nowrap items-center gap-1.5 overflow-hidden` — `Must-Read`(warning, 별) + 기술 스택 최대 3(`Badge max-w-32` 안 `span.truncate`, `title` 에 전체 이름). ⑤ 바닥 `mt-auto border-t pt-2` — 점수·댓글·인기(`hotness_score > 25`, `Flame` + `sr-only` `인기 점수` + 반올림 값), 오른쪽 `챗에서 분석`(`compactBetweenLgXl`)·`원문`. `data-feed-card`, `article`, `ring-2`·`data-focused` 유지. 새 선택 prop `preferSummary?: boolean`(기본 `false`).
- `components/chat/HandoverCtaButton.tsx`: 선택 prop `compactBetweenLgXl?: boolean`(기본 `false`). 켜면 `card-compact` 글자를 `<span class="lg:max-xl:sr-only">` 로 감싸고 버튼에 `lg:max-xl:px-2`. 글자는 기본값에서도 `<span>` 으로 감싸지만 클래스는 없다. 접근 이름 `전용 챗에서 분석`, `modal-banner` 의 `전용 AI 챗으로 이동` 그대로, `NewsDetailModal` 은 고치지 않았다.
- `components/feed/NewsCardSkeleton.tsx`: 카드와 같은 틀 — 머리줄 `h-11 md:h-8`, 제목·본문 각 `min-h-12` 2줄, 바닥 `mt-auto border-t pt-2` 안 `h-11 md:h-8`, `Card h-full flex flex-col gap-3`.
- 테스트: `FormControls.test.tsx:332-335` 를 긴 라벨로(우려 10 표대로), `categoryShortLabel` 테스트 2개 추가. `NewsCard.test.tsx:51` 을 `'하네스'` 로(우려 10), `describe('fixed frame (R17)')` 10개 추가. 새 `tests/feed/FeedInsights.test.ts` 7개.
## 바꾼 파일
- `frontend/src/lib/labels.ts`
- `frontend/src/lib/feed-insights.ts` (새 파일)
- `frontend/src/components/NewsCard.tsx`
- `frontend/src/components/feed/NewsCardSkeleton.tsx`
- `frontend/src/components/chat/HandoverCtaButton.tsx`
- `frontend/src/tests/ui/FormControls.test.tsx` (332~335행 + `labels` 블록 추가, import 이름 추가)
- `frontend/src/tests/NewsCard.test.tsx` (51행 + 추가, import 이름 `within` 추가)
- `frontend/src/tests/feed/FeedInsights.test.ts` (새 파일)
## 검사 결과
### 먼저 실패하는 테스트 (빈 구현 상태)
명령: `cd frontend && pnpm exec vitest run src/tests/NewsCard.test.tsx src/tests/feed/FeedInsights.test.ts src/tests/ui/FormControls.test.tsx`
결과: `Test Files 3 failed (3)`, `Tests 16 failed | 33 passed (49)`. 실패는 모두 예상 이유(단언)였다.
- `FormControls.test.tsx > labels > maps category and source ids …`: `expected 'Harness' to be '하네스 & 벤치마크'` (긴 라벨이 아직 영문)
- `FormControls.test.tsx > labels > maps category ids to the short labels …`: `expected 'harness' to be '하네스'` (빈 구현이 원값)
- `NewsCard.test.tsx > renders title, category, …`: `Unable to find an element with the text: 하네스` (카드가 `Harness` 를 그림)
- `NewsCard.test.tsx > fixed frame (R17) > renders a single meta row …`, `keeps Must-Read …`: `expected null not to be null` (`[data-card-meta]` 없음)
- `… shows at most three tech stack badges`: `expected <span …> to be null` (기술 배지 4개까지 그림)
- `… moves the hotness score …`: `Unable to find … 인기 점수` (`Hot 85` 배지가 머리줄에 있음)
- `… labels the insight body with "시사점" …`, `keeps the insight when preferSummary …`: `Unable to find … 시사점` (앞머리 `Insight`)
- `… shows the summary instead of the insight when preferSummary …`: `Unable to find … A multimodal software engineering benchmark …` (`preferSummary` 무시)
- `… fixes the title and body to two lines …`: `expected '…flex cursor-pointer flex-col gap-3' to contain 'h-full'`
- `… handover button as icon-only between lg and xl …`: `expected 'inline-flex shrink-0 …' to contain 'lg:max-xl:sr-only'`
- `FeedInsights.test.ts` 4개: `expected [] to deeply equal [ 1, 3 ]` 등 (빈 구현이 빈 `Set`). 20자 미만·1회·빈 목록 3개는 빈 `Set` 이 정답이라 통과.
- 수정 전 배치 증거: 19 의 `audit/baseline-1ec8a9b/report.json` F4 `rowAlign` 실패. 22 끝날 때(2026-11-06) 그 파일이 아직 없어 항목을 인용하지 못했다 (19 진행 중). 같은 결함의 구조(머리줄 `flex-wrap` 없음, 배지 머리줄 밖, 제목·본문 `min-h-12`·`line-clamp-2`, 카드 `h-full`)는 위 단위 테스트가 단언한다. 고친 뒤 배치 확인은 27.
- 커밋: `36e6d7c test(ui-redesign): 22 실패 테스트 — 카테고리 긴·짧은 라벨, 카드 고정 틀, 반복 시사점`

### 구현 뒤
- 끝 기준: `cd frontend && pnpm exec vitest run src/tests/NewsCard.test.tsx src/tests/feed/FeedInsights.test.ts src/tests/ui/FormControls.test.tsx src/tests/chat/HandoverIntegration.test.tsx src/tests/modals/NewsDetailModal.test.tsx src/tests/modals/SourcesModal.test.tsx src/tests/chat/CitationBadge.test.tsx`
  ```
   Test Files  7 passed (7)
        Tests  73 passed (73)
  ```
  (`FormControls.test.tsx` 의 `ChipGroup` 블록도 이 시점에 통과했다. 제외한 것 없음.)
- `pnpm exec eslint <바꾼 파일 8개>` → 종료 0 (오류·경고 없음)
- `pnpm exec tsc --noEmit` → 종료 0, 출력 없음
- 전체 `cd frontend && pnpm test` (같은 작업 트리에 19~21 의 미완 변경이 있는 상태) → `Test Files 45 passed (45)`, `Tests 500 passed (500)`, 종료 0
- R19 정적 확인 `grep -rnE "'(Harness|Agent Tech|AI Frontier|MCP & Skills|에이전트 기술|AI 뉴스)'" frontend/src/components frontend/src/lib` → `FocusBottomSheet.tsx:33-34`(우려 18, 제외), `FocusCapsule.tsx:23-24`(24 담당)만 남음. `grep -rlE "하네스 & 벤치마크|에이전트 아키텍처" frontend/src/components` → `feed/FeedToolbar.tsx`(23 담당), `sources/SourcesListTab.tsx`(26 담당). 22 소유 파일에는 없음.

### 수정 전 증거 (기준선 인용, 메인 세션이 verifier 편차 B 에 따라 추가)
출처: `docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json` (1ec8a9b 프로덕션 빌드, 19단계 측정, verifier 재실행으로 같은 328건 확인).
- rowAlign (F4):
  - `feed-light-768x1024` `rowAlign` 건수 6, 예: Agent Tech국내 테크·15일 전Must-ReadHot 100[AI — 같은 줄 h3 top 차 24px
  - `feed-light-1440x900` `rowAlign` 건수 7, 예: Agent Tech국내 테크·15일 전Must-ReadHot 100[AI — 같은 줄 h3 top 차 24px
  - `feed-dark-768x1024` `rowAlign` 건수 6, 예: Agent Tech국내 테크·15일 전Must-ReadHot 100[AI — 같은 줄 h3 top 차 24px
  - `feed-dark-1440x900` `rowAlign` 건수 7, 예: Agent Tech국내 테크·15일 전Must-ReadHot 100[AI — 같은 줄 h3 top 차 24px

## 결정
- 머리줄 왼쪽은 `p` 가 아니라 `div` 로 뒀다. 본문 자리(빈 2줄 포함)를 카드의 첫 `p` 로 두어 테스트와 문서 구조가 단순하다.
- 제목은 `h3` 와 안쪽 `button` 둘 다 `line-clamp-2` 를 둔다. 버튼은 원자 인라인이라 `h3` 의 클램프만으로는 글자가 잘리지 않는다. 높이 고정은 `h3 min-h-12`.
- 기술 스택 배지의 말줄임은 `Badge`(inline-flex) 안 `span.truncate` 로 했다. flex 컨테이너 자체의 `text-overflow` 는 텍스트 조각에 먹지 않는다. `cn` 이 Tailwind 충돌을 풀지 않아 `Badge` 의 `shrink-0` 은 그대로이고, 줄이 넘치면 배지 줄의 `overflow-hidden` 이 자른다 (plan 클래스 그대로).
- `HandoverCtaButton` 글자는 기본값에서도 `<span>` 으로 감쌌다 (클래스 없음, 보이는 글자·접근 이름 불변).
- `findRepeatedInsights` 의 끝 40자는 `Array.from` 으로 코드 포인트 단위로 자른다. 길이 판정(20자)은 `String.length` (한국어·영문은 BMP 라 같다).
- 구현 커밋은 호출자(메인 세션)가 해시를 요청해 자기 경로만 지정해 직접 했다.
## 막힌 점
- 없음. 19 의 `audit/baseline-1ec8a9b/report.json` 이 아직 없어 F4 `rowAlign` 항목 인용은 비어 있다 (G3 또는 27 에서 인용).
## 다음
- 23: `page.tsx` 에서 `const repeated = useMemo(() => findRepeatedInsights(news), [news])` 로 계산해 `<NewsCard preferSummary={repeated.has(item.id)} />` 로 넘긴다. 그리드는 같은 줄 카드가 같은 높이가 되도록 `items-stretch`(기본) 유지, 카드가 `h-full` 이다. `FeedToolbar` 칩 라벨은 `categoryLabel(id)` 로 (`'all'` 의 `전체 소식` 은 labels 에 없음).
- 24: `ActiveSourceChip`, `CitationPopover`, `FocusCapsule` 에서 `categoryShortLabel(category)`.
- 26: `SourcesListTab` 카테고리 선택지는 `categoryLabel(id)` 또는 `CATEGORY_LABELS` 키 순서.
- 27: 768·1024·1440 `rowAlign` 실측.


## 후속 (3차)
plan '3차 보정' 의 '22 D 후속 (3차)' (결함 3 의 라벨 부분, R19). 파일: `frontend/src/lib/labels.ts`, `frontend/src/tests/ui/FormControls.test.tsx` (`labels` 블록에 추가만, import 이름 추가).

### 한 일
- `lib/labels.ts`: `RADAR_CATEGORY_LABELS`(`Harness & Benchmark`→`하네스 & 벤치마크`, `Protocols & Tooling`→`프로토콜 & 도구`, `Models & Reasoning`→`모델 & 추론`, `Infra & Runtime`→`인프라 & 런타임`)와 `radarCategoryLabel(name)`(기존 `lookup` 사용 — 모르는 값·프로토타입 키는 그대로)을 더했다. 파일 머리 주석에 '레이더 카테고리 라벨: 트렌드 레이더 분포' 줄을 더했다. 기존 표·함수 불변. backend·`types/trends.ts` 불변.
- `tests/ui/FormControls.test.tsx`: `describe('labels')` 에 `radarCategoryLabel` 테스트 2개 추가, import 에 이름 추가. 기존 단언 불변.

### 바꾼 파일
- `frontend/src/lib/labels.ts`
- `frontend/src/tests/ui/FormControls.test.tsx`

### 커밋
- 실패 테스트: `57bda24 test(ui-redesign): 22 후속 (3차) 실패 테스트 — 레이더 카테고리 한국어 라벨`
- 구현: 이 기록과 함께 커밋 (`feat(ui-redesign): 22 후속 (3차) …`)

### 검사 결과
#### 먼저 실패하는 테스트 (빈 구현 `radarCategoryLabel(name) => name`)
명령: `cd frontend && pnpm exec vitest run src/tests/ui/FormControls.test.tsx`
결과: `Test Files 1 failed (1)`, `Tests 1 failed | 28 passed (29)`
- `labels > maps trend radar category names to Korean labels`: `AssertionError: expected 'Harness & Benchmark' to be '하네스 & 벤치마크'` (예상 이유: 빈 구현이 원값)
- `labels > falls back to the raw name for unknown radar categories and prototype keys` 는 빈 구현에서도 통과 (원값 반환이 정답인 회귀 방지 단언)
#### 구현 뒤
- 끝 기준 `cd frontend && pnpm exec vitest run src/tests/ui/FormControls.test.tsx src/tests/NewsCard.test.tsx src/tests/chat/ActiveSourceChip.test.tsx` → `Test Files 3 passed (3)`, `Tests 48 passed (48)`
- `pnpm exec eslint src/lib/labels.ts src/tests/ui/FormControls.test.tsx` → 종료 0, 출력 없음
- `pnpm exec tsc --noEmit` → 종료 0, 출력 없음
- 정적 확인 `grep -rlE "프로토콜 & 도구|인프라 & 런타임" frontend/src/components` → 출력 없음
- 전체 `cd frontend && pnpm test` → `Test Files 1 failed | 48 passed (49)`, `Tests 3 failed | 548 passed (551)`. 실패 3개는 모두 `tests/ui/ChipGroup.test.tsx` 의 20 B 후속 (3차) 실패 테스트 (a)(b)(c) (`a377370`, 20 진행 중 — `ScrollRow` 구현 전). 22 와 무관하다 (병렬 단계 끝 검사 규칙).

### 막힌 점
- 없음.

### 다음
- 23 E 후속: `TrendRadarPanel` 카테고리 분포에서 `import { radarCategoryLabel } from '@/lib/labels'` 로 `{radarCategoryLabel(cat.name)}`·`title={radarCategoryLabel(cat.name)}` 를 그린다 (`key`·`CategoryIcon name` 은 원값).
