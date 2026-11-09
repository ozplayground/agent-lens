# AgentLens 프론트엔드 테스트 현황과 TDD 실행 기록서 (Frontend TDD Log)

- **작성일자**: 2026-11-09
- **작성자**: 프론트엔드 TDD 엔지니어 (`frontend-tdd-engineer`)
- **문서 버전**: v0.4.1 (as-built. 처음 v0.4.0 의 52개 파일·649개 테스트를 기록했고, v0.4.1 리뷰 수정 사이클(2.6·2.7절)을 더했다. v0.4.1 최종: 54개 파일, 666개 테스트 — 계약 담당이 MSW 저장 순서 테스트 2개를 더해 664 → 666)
- **상태**: Draft
- Updated: 2026-11-09
- 기준: v0.4.1 (main)

> 2026-11-09 추가: 코드 리뷰(`docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md`) 머지 전 필수 5건(FE-01·02·03·09·22)을 TDD 로 고친 사이클을 2.6절에 적었다. 이 사이클 뒤 frontend 는 **54개 파일, 654개 테스트**다 (4.5절). 이어서 2.7절 사이클(BUG-02R, FE-33, FE-34) 뒤에는 **54개 파일, 664개**다 (4.6절. 새 테스트 4개 + 계약 담당이 `chat/ContractAndMsw.test.ts` 에 더한 6개). 3절·4.1~4.4절·6.1~6.53절의 나머지 숫자는 사이클 전(52개 파일, 649개) 기록이고, 사이클에서 바뀐 표(3.1, 6.6, 6.12, 6.15)와 새 표(6.54, 6.55)만 고쳤다.

이 문서는 새 기능의 사이클 기록이 아니라 **지금 main 의 frontend 테스트를 설명하는 기록**이다. 이 작업에서 코드와 테스트는 고치지 않았다. 사이클 기록(2절)은 git 이력의 '먼저 실패하는 테스트' 커밋과, 그 커밋을 남긴 단계 기록(커밋 `94fdf8e` 에 들어 있는 `tasks/ui-redesign/NN-*.md`)을 근거로 한다.

연결 문서 (새 경로):
- 컴포넌트·화면 명세, 디자인 토큰, `ui-audit.mjs` 판정 상세: `docs/ui-system-designer/01_COMPONENT_SPEC.md`
- 계약(zod ↔ MSW ↔ Pydantic): `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md`
- 도메인별 기능 명세: `docs/spec-writer/fsd/01_NEWS_FEED_SPECIFICATION.md` ~ `07_UI_COMMON_SPECIFICATION.md`
- backend 테스트(pytest 217개)와 backend 쪽 커버리지·외부 호출 판정: `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md`

테스트 이름에 붙은 `R<n>` 은 ui-redesign 작업 spec 의 요구 번호다 (커밋 `94fdf8e` 의 `docs/features/ui-redesign/spec.md`. 지금 main 의 작업 트리에는 이 파일이 없다).

---

## 1. TDD 개발 대상 컴포넌트 및 사용자 인터랙션

FSD 도메인 코드별로 묶었다. 단위 기능 ID(`FUNC-<코드>-NNN`)는 `docs/spec-writer/fsd/` 의 각 문서가 정한다. 모든 경로는 `frontend/src/` 기준.

| 도메인 (FSD) | 대상 컴포넌트·훅 | 테스트 파일 (`frontend/src/tests/`) | 모의 핸들러·환경 |
| :--- | :--- | :--- | :--- |
| **NEWS** 뉴스 피드 | `components/NewsCard.tsx`, `components/feed/FeedToolbar.tsx`·`FeedStatusBar.tsx`·`InsightsBar.tsx`·`TrendRadarPanel.tsx`, `lib/feed-insights.ts`, `hooks/useNewsFeed.ts`, `components/NewsDetailModal.tsx`, `components/news-detail/AskAiPanel.tsx`, `components/chat/HandoverCtaButton.tsx` | `NewsCard.test.tsx`, `AskAiPanel.test.tsx`, `feed/FeedToolbar.test.tsx`, `feed/FeedStatusBar.test.tsx`, `feed/InsightsBar.test.tsx`, `feed/TrendRadarPanel.test.tsx`, `feed/FeedInsights.test.ts`, `hooks/useNewsFeed.test.tsx`, `modals/NewsDetailModal.test.tsx`, `chat/HandoverIntegration.test.tsx`, `HotkeyGating.test.tsx` | `mocks/handlers.ts` `newsHandlers` (`:214`, `GET */api/news`·`/api/news/:news_id`·`POST /ask`·`/ask/stream`·`GET /api/briefing/today`·`POST /api/briefing/generate`·`GET /api/sources`·`/api/stats`·`DELETE /api/news/all`), `useNewsFeed` 는 `server.use` 로 `GET */api/trends/radar` 추가와 지연·500 |
| **CHAT** AI 챗 | `components/chat/*` (ChatWorkspace, ChatHeader, ChatContextBar, ChatMessageList·Item, ChatPromptInput, ChatModelSelector, ModelTierBadge, ModelChangeDivider, ChatSidebar, ChatHistoryDrawer, SessionList·SessionItemCard, DeleteConfirmPopover, CitationBadge·Popover, FocusCapsule, FocusBottomSheet, WorkflowStepTracker, ExportToolbar, ActiveSourceChip), `components/chat/useChatSessions.ts`, `types/chat.ts`·`types/news.ts` | `chat/*.test.tsx` 17개 (그중 `HandoverIntegration` 은 NEWS, `MobileViewport` 는 UI 동작도 본다), `chat/ContractAndMsw.test.ts`, `ResponsiveLayout.test.tsx` | `mocks/handlers/chat.ts` `chatHandlers` (`:246`, `POST */api/chat/stream`·`/api/chat/query`, `GET /api/chat/sources/:source_id`·`/api/chat/search`·`/api/chat/sessions`, `POST /api/chat/sessions`, `GET`·`DELETE /api/chat/sessions/:session_id`), `mocks/handlers.ts` `sseGetChatStreamHandler` (`:480`, MSW 에만 있는 `GET */api/chat/stream`), fixture `mocks/fixtures/chat.ts`, `resetMockSessionStore()` |
| **COLL** 수집 | `components/Header.tsx`, `ResetConfirmDialog.tsx`, `ScheduleModal.tsx`, `hooks/useCollector.ts` | `Header.test.tsx`, `hooks/useCollector.test.ts`, `modals/ScheduleModal.test.tsx` | `useCollector.test.ts` 는 `server.use` 로 `GET */api/schedule/status`·`/progress`, `POST */api/schedule/trigger`·`/reset-and-collect`. `Header`·`ScheduleModal` 은 `vi.mock('@/lib/api')` |
| **BRF** 브리핑·공유 | `components/BriefingSettingsModal.tsx`, `DailyBriefingModal.tsx`, `components/chat/ExportToolbar.tsx`, `InsightsBar` 브리핑 버튼 | `modals/BriefingSettingsModal.test.tsx`, `modals/DailyBriefingModal.test.tsx`, `chat/ExportToolbar.test.tsx`, `feed/InsightsBar.test.tsx` | `server.use` 로 `GET`·`POST */api/briefing/settings`. 브리핑은 기본 `GET */api/briefing/today` |
| **SRC** 소스·딥 리서치 | `components/SourcesModal.tsx`, `sources/SourcesListTab.tsx`, `sources/DeepResearcherTab.tsx` | `modals/SourcesModal.test.tsx`, `modals/DeepResearcherTab.test.tsx` | `server.use` 로 `GET */api/research/status`·`/audit-logs`, `DELETE */api/sources/:type/:id`. 소스 목록은 기본 `GET */api/sources` |
| **MCP** MCP 서버 | `components/McpModal.tsx` | 없음 | — |
| **UI** UI 공통 | `context/ThemeContext.tsx`, `components/ThemeToggle.tsx`, `HotkeyListener.tsx`, `CommandPalette.tsx`, `MarkdownViewer.tsx`, `app/layout.tsx` (`viewport`), `components/ui/*`, `lib/overlay-stack.ts`·`cn.ts`·`labels.ts`, `hooks/useCopyToClipboard.ts`·`useMediaQuery.ts`·`useFocusTrap.ts`·`useScrollLock.ts`·`useScrollOverflow.ts`, `app/globals.css` | `ThemeSystem.test.tsx`, `HotkeyListener.test.tsx`, `HotkeyGating.test.tsx`, `CommandPalette.test.tsx`, `ResponsiveLayout.test.tsx`, `chat/MobileViewport.test.tsx`, `ui/*.test.ts(x)` 11개, `design/TokenGuard.test.ts`, `design/TokenContrast.test.ts` | MSW 없음 (부품 단위). `window.matchMedia` 폭 mock, `ResizeObserver`·`scrollWidth`·`getBoundingClientRect` 정의, `navigator.clipboard`·`document.execCommand` mock. 정적 검사 3개는 파일 읽기 |

디렉터리별 파일 수: 루트 8, `chat/` 18, `design/` 2, `feed/` 5, `hooks/` 2, `modals/` 6, `ui/` 11 (합 52, `setup.ts` 별도).

---

## 2. Red-Green-Refactor 사이클 실행 기록

### 2.1 git 이력에서 확인한 사실

- **main 에 이어진 커밋에는 '테스트만 담은 커밋' 이 없다.** frontend 테스트를 건드린 main 커밋 9개는 모두 테스트와 구현을 함께 담는다 (`git log -- frontend/src/tests` 로 확인):

| 커밋 | 날짜 | 테스트 파일 (추가) | 같은 커밋의 `frontend/src` 비테스트 파일 | 요지 |
|---|---|---|---|---|
| `18f46fc` | 2026-09-16 | 3 (3) | 27 | v0.1.0 첫 커밋: `setup.ts`, `AskAiPanel`, `NewsCard` |
| `44507de` | 2026-10-19 | 24 (22) | 45 | v0.2.0: `chat/*` 18개, `CommandPalette`, `HotkeyListener`, `ResponsiveLayout`, `ThemeSystem` 추가 |
| `1046945` | 2026-10-19 | 2 (0) | 7 | v0.2.0 수정: Claude 5.5 모델 ID, 원시 ID 숨김 |
| `d86c541` | 2026-10-19 | 5 (0) | 10 | v0.2.1: scoped 포커스, 프로덕션 mock 제거, 과거 모델 보존 |
| `b46b6e7` | 2026-10-19 | 2 (0) | 2 | v0.2.2: 질문 맞춤 출처 |
| `20eec54` | 2026-10-19 | 4 (0) | 5 | v0.3.0: ReAct 챗 |
| `017b076` | 2026-10-19 | 4 (0) | 5 | v0.3.1: 인용 필터·토큰 예산 |
| `c605577` | 2026-10-20 | 2 (0) | 4 | 산출물 정리 |
| `94fdf8e` | 2026-11-09 | 48 (28) | 103 | ui-redesign·backend-llm-test-isolation·make-targets 를 합친 squash 커밋 |

- 그래서 v0.1.0 ~ v0.3.1 테스트가 구현보다 먼저 쓰였는지는 **git 으로 확인하지 못한다.** v0.3.1 하네스의 옛 TDD 기록은 ThemeSystem·HotkeyListener 등의 RED 출력을 적어 두었지만, 같은 시점의 커밋으로 대조할 수 없다.
- `94fdf8e` 는 브랜치 `refactoring` 의 단계 커밋을 하나로 합친 것이다. 합치기 전 단계 커밋은 어느 브랜치에서도 닿지 않지만 이 저장소의 reflog 에 남아 있다 (`git log --reflog --grep='실패 테스트'` → 41개, 그중 단계 기록 커밋 `1aa5317` 1개를 뺀 40개가 테스트 커밋). reflog 가 만료되거나 `git gc` 로 정리되면 이 커밋들은 사라질 수 있다. 같은 내용은 `94fdf8e` 안의 `tasks/ui-redesign/*.md` 에도 적혀 있다.
- 테스트 우선 커밋 40개는 모두 backend 파일을 건드리지 않는다. 테스트 파일과 단계 기록 말고 바꾼 것은 '받기만 하는 빈 구현'(타입 시그니처·빈 함수)이다: `e86707c`·`5c2717f`·`a377370`·`fb2a3a3` 의 `components/ui/Chip.tsx`·`ScrollRow.tsx`, `05c5890` 의 `ui/Toast.tsx`, `36e6d7c` 의 `NewsCard.tsx`·`lib/feed-insights.ts`·`lib/labels.ts`, `57bda24`·`fde09ca` 의 `lib/labels.ts`, `54d381b` 의 `news-detail/AskAiPanel.tsx`(`copyFailedIndex` 선언), `2f4b178` 의 `ui/Badge.tsx`, `285cd56` 의 `hooks/useNewsFeed.ts`(`reloadError: null`), `ab2d673` 의 `feed/FeedStatusBar.tsx`. 단계 기록에 따르면 실패가 import·타입 오류가 아니라 단언에서 나게 하려는 것이다. 이 빈 구현이 '빈' 것인지는 단계 기록의 설명을 따랐고 diff 를 하나하나 다시 보지는 않았다.

### 2.2 테스트 우선 커밋 목록 (ui-redesign, 2026-11-06 ~ 11-07)

'RED 결과' 는 그 단계 기록(`git show 94fdf8e:tasks/ui-redesign/<단계>.md`)에 적힌 실행 결과다. 기록에 수치가 없으면 '수치 기록 없음' 으로 적었다. 지금(2026-11-09) 이 테스트들은 모두 통과한다 (4절).

| RED 커밋 | 단계 | 테스트 파일 | RED 결과 (단계 기록) | GREEN 커밋 (확인한 것만) |
|---|---|---|---|---|
| `e86707c` | 20 | `ui/ChipGroup.test.tsx` | `Tests 13 failed \| 1 passed (14)`, 모두 단언 실패 | — |
| `5c2717f` | 20 후속 | `ui/ChipGroup.test.tsx` | `Tests 2 failed \| 14 passed (16)` | — |
| `fa3959a` | 20 후속 | `ui/ChipGroup.test.tsx` | 코드와 상관없이 성립할 수 없던 단언(`flex-1`)을 `wrapper-extra` 로 고친 커밋. 빈 시그니처로 되돌려 `Tests 2 failed \| 14 skipped` 재확인 | — |
| `a377370` | 20 후속 3차 | `ui/ChipGroup.test.tsx` | `Tests 3 failed \| 17 passed (20)` | `8fb3e3a` |
| `05c5890` | 21 | `ui/OverlayStack`·`Tabs`·`Toast.test.tsx` | 커밋 전 8건 실패 | `d125622` |
| `8ec5ba2` | 21 후속 | `ui/Tabs.test.tsx` | 4건 실패 (`data-scroll-row` 없음, `data-overflow` 없음, `scrollIntoView` 호출 없음, `scrollLeft` 0) | — |
| `36e6d7c` | 22 | `NewsCard`·`feed/FeedInsights`·`ui/FormControls` | `Test Files 3 failed (3)`, `Tests 16 failed \| 33 passed (49)` | — |
| `57bda24` | 22 후속 3차 | `ui/FormControls.test.tsx` | `Tests 1 failed \| 28 passed (29)` (빈 구현 `radarCategoryLabel(name) => name`) | — |
| `285cd56` | 23 | `feed/FeedToolbar`·`feed/InsightsBar`·`hooks/useNewsFeed` | `useNewsFeed` 4 실패 / 2 통과, `FeedToolbar`+`InsightsBar` 6 실패 / 12 통과 | — |
| `d483d45` | 23 후속 | `feed/FeedToolbar.test.tsx` | 수치 기록 없음 | — |
| `b20ff3a` | 23 후속 2 | `feed/FeedToolbar`·`feed/InsightsBar` | 수치 기록 없음 | — |
| `75fe34b` | 23 후속 3차 | `feed/FeedToolbar`·`feed/TrendRadarPanel` | 다른 단계 기록에 '구현 전이라 2건 실패' 로 남음 | — |
| `b9cfa74` | 24 | `chat/ActiveSourceChip`·`ChatHeader`·`ChatMessageList` | `Tests 3 failed \| 16 passed (19)` | — |
| `54d381b` | 25 | `AskAiPanel`·`modals/NewsDetailModal` | 4 실패 / 13 통과 (자리표시 긴 문구, `copyFailedIndex` 빈 구현, 입력 Escape 가 대화상자를 닫음, 모달 복사 실패 표시 없음) | — |
| `e777bb0` | 26 | `Header`·`hooks/useCollector`·`modals/DailyBriefingModal`·`modals/SourcesModal` | `useCollector` 3 failed \| 1 passed, 나머지 세 파일 4 failed \| 18 passed | `f1c58dc` |
| `a44e7e7` | 29 | `CommandPalette`·`modals/DeepResearcherTab` | `Tests 6 failed \| 9 passed (15)` (자리표시 `… (ESC로 닫기)`, 지표 값 말줄임) | — |
| `fb2a3a3` | 31 | `ui/ChipGroup.test.tsx` | `Tests 3 failed \| 21 passed (24)` | — |
| `1cabd27` | 31 후속 | `ui/ChipGroup.test.tsx` | `Tests 2 failed \| 25 passed (27)` | — |
| `d90fc1c` | 31 후속 | `ui/ChipGroup.test.tsx` | `Tests 1 failed \| 27 passed (28)`, `expected [ '' ] to deeply equal [ 'none' ]` | — |
| `380c035` | 31 후속 2 | `ui/ChipGroup.test.tsx` | `Tests 2 failed \| 28 passed (30)` | — |
| `3b0cab5` | 31 후속 3 | `ui/ChipGroup.test.tsx` | `Tests 9 failed \| 27 passed (36)` | — |
| `0a9ea61` | 31 후속 4 | `ui/ChipGroup.test.tsx` | `Tests 3 failed \| 37 passed (40)` | — |
| `36991b5` | 31 후속 5 | `ui/ChipGroup.test.tsx` | `Tests 1 failed \| 41 passed (42)` | — |
| `c3afcc4` | 32 | `ui/Toast.test.tsx` | `expect(element).not.toHaveAttribute("role")` 실패 (옮겨진 알림이 `role="alert"` 를 다시 가짐) | `8a46693` |
| `46102d4` | 32 후속 | `ui/Toast.test.tsx` | `Toast.test.tsx:220` `expect(returned).not.toHaveAttribute('role')` 실패 | `0a6dbeb` |
| `2f4b178` | 33 | `NewsCard`·`ui/Primitives` | `Test Files 2 failed (2)`, `Tests 4 failed \| 30 passed (34)` (`Badge shrink` 빈 구현) | — |
| `8abeea7` | 34 | `feed/FeedToolbar.test.tsx` | 6 실패 / 13 통과 (폭마다 다른 트리라 검색 입력 재마운트, DOM 순서·줄 소속 다름) | `1fde9c8` |
| `2d3f760` | 34 후속 3 | `feed/FeedToolbar.test.tsx` | 수치 기록 없음 (R34 단언 표 4곳 변경) | — |
| `054f624` | 35 | `hooks/useCollector.test.ts` | `Tests 2 failed \| 4 passed (6)` | `f0da54a` |
| `fde09ca` | 39 | `ui/FormControls.test.tsx` | `3 failed \| 29 passed` | — |
| `9058214` | 40 | `NewsCard.test.tsx` | `Tests 13 failed \| 20 passed (33)` | — |
| `214fabe` | 41 | `feed/FeedToolbar.test.tsx` | 2 실패 / 23 통과 | `705a151` |
| `8b451d5` | 42 | `chat/ChatHeader`·`ChatPromptInput`·`ChatSidebar`·`ChatWorkspace`·`FocusBottomSheet`·`FocusCapsule` | `Tests 11 failed \| 53 passed (64)` | `738425e` |
| `355ff0b` | 46 | `NewsCard.test.tsx` | `Tests 10 failed \| 31 passed (41)` | — |
| `ab2d673` | 50 | `feed/FeedStatusBar`·`feed/FeedToolbar` | 18 실패 / 13 통과 | — |
| `5de1774` | 50 연장 | `feed/FeedStatusBar.test.tsx` | 수치 기록 없음 | — |
| `30d1b19` | 51 | `NewsCard`·`chat/HandoverIntegration`·`modals/NewsDetailModal`·`AskAiPanel` | `Tests 16 failed \| 49 passed (65)` | — |
| `9531e38` | 52 | `chat/ChatHeader`·`ChatMessageList`·`ChatModelSelector` | `Tests 5 failed \| 27 passed (32)` | — |
| `04101ab` | 53 | `modals/DailyBriefingModal.test.tsx` | `Tests 5 failed \| 1 passed (6)` | `d3a8696` |
| `ca1ae9f` | 54 | `ui/IconGuard.test.ts` | `Tests 1 failed \| 2 passed (3)` (그림 이모지 목록. 앱 코드는 51·52·53 이 고침) | 51·52·53 구현 |

- 테스트만 고친 단계 커밋이 하나 더 있다: `9f30e2a` (34 후속 보정 3, 소스 줄 `scroll-px-6` 단언 변경). '실패 테스트' 라는 제목이 아니라 위 목록에 넣지 않았다.
- 웨이브 0~2(`7191368`, `ef5d36b`, `5103778`)와 15·18 단계(`37343e5`, `106e242`)는 테스트와 구현을 한 커밋에 담았다. `TokenGuard`·`TokenContrast` 는 `37343e5` 에서 구현과 함께 들어왔다.

### 2.3 대표 사이클 1: 오래된 수집 상태 응답 버리기 (`useCollector`, 단계 35)

- **대응 기능**: COLL (헤더 수집 상태, `docs/spec-writer/fsd/03_COLLECTION_SPECIFICATION.md`)
- **대상**: `frontend/src/hooks/useCollector.ts`
- **테스트 파일**: `frontend/src/tests/hooks/useCollector.test.ts`
- **모의 핸들러**: 테스트 안 `server.use(http.get('*/api/schedule/status', …))`, 도우미 `deferred()` 로 응답을 붙잡아 순서를 정함

#### 1. RED Phase (커밋 `054f624`)
- **작성된 테스트 코드** (지금 파일 `useCollector.test.ts:276-306` 에서 발췌):
```typescript
it('② keeps the newer status when an older status response arrives after it', async () => {
  let statusCount = 0;
  const held = deferred();
  server.use(
    http.get('*/api/schedule/status', async () => {
      statusCount += 1;
      const seq = statusCount;
      if (seq === 1) await held.promise;
      return HttpResponse.json({ ...scheduleStatus(false), minutes_until_next_run: seq === 1 ? 192 : 10 });
    })
  );
  // … 30초 갱신 요청 B 가 먼저 반영된 뒤 붙잡은 A 를 풂
  expect(result.current.status?.minutes_until_next_run).toBe(10);
  expect(result.current.timeLeft).toBe('10m');
});
```
- **실행 결과 (단계 기록)**:
```
pnpm exec vitest run src/tests/hooks/useCollector.test.ts → Tests 2 failed | 4 passed (6)
① expected true to be false   (늦은 is_running 응답이 진행 폴링을 다시 켬)
② expected 192 to be 10       (앞선 응답 A 가 나중 응답 B 를 덮어씀)
```

#### 2. GREEN Phase (커밋 `f0da54a`)
- **구현 요약**: 모듈 변수 `statusSeq`(요청마다 +1), `appliedStatusSeq`(마지막 반영 번호), `progressEndSeq`(진행 폴링이 끝난 때의 번호). 응답 번호가 `appliedStatusSeq` 보다 작거나 `progressEndSeq` 이하이면 버린다.
- **실행 결과 (단계 기록)**: `useCollector`·`Header`·`CommandPalette`·`ScheduleModal` 4파일 `Tests 34 passed (34)`, 전체 `Test Files 50 passed (50)`, `Tests 567 passed (567)`, eslint·`tsc --noEmit` 종료 0.

#### 3. REFACTOR Phase
- 단계 기록에 리팩터 단계가 따로 없다. `stopAll` 이 세 값을 0 으로 되돌리는 정리까지 GREEN 커밋에 들어 있다.

### 2.4 대표 사이클 2: 일일 브리핑 설정 한 곳·헤드라인 한 번 (`DailyBriefingModal`, 단계 53)

- **대응 기능**: BRF (`docs/spec-writer/fsd/04_BRIEFING_AND_SHARING_SPECIFICATION.md`)
- **대상**: `frontend/src/components/DailyBriefingModal.tsx`
- **테스트 파일**: `frontend/src/tests/modals/DailyBriefingModal.test.tsx`
- **모의 핸들러**: 기본 MSW `GET */api/briefing/today` (`mocks/handlers.ts:433`)

#### 1. RED Phase (커밋 `04101ab`)
```typescript
it('shows the headline exactly once', async () => {
  const { briefing } = await renderBriefing();
  expect(screen.getAllByText(briefing.headline)).toHaveLength(1);
});
```
```
pnpm exec vitest run src/tests/modals/DailyBriefingModal.test.tsx → Tests 5 failed | 1 passed (6)
- 설정 버튼: expected [ <button …>, … ] to have a length of 1 but got 2
- 헤드라인: expected [ <div id="_r_c_" …>, … ] to have a length of 1 but got 2
- 분야 머리글: Unable to find an accessible element with the role "heading" and name "MCP & 생태계"
- 개요 줄: Unable to find an element with the text: MCP & 생태계:
- 시사점: `💡 시사점:` 이라 /^시사점:$/ 불일치 (svg 없음)
```

#### 2. GREEN Phase (커밋 `d3a8696`)
- 위 작업 줄의 `연동 설정` 아이콘 버튼과 모바일 메뉴 항목을 지우고 바닥 버튼 글자를 `연동 설정` 으로, 헤드라인은 `Dialog` `description` 에만, 분야 머리글은 `categoryLabel(cat.id)` 와 `FEED_CATEGORIES` 아이콘, `💡` 대신 `Lightbulb` 아이콘.
- 단계 기록: 관련 7파일 `Tests 105 passed (105)`, `IconGuard.test.ts` 3 passed.

#### 3. REFACTOR Phase
- 따로 없음.

### 2.5 대표 사이클 3: 피드 툴바 한 트리 (`FeedToolbar`, 단계 34)

- **대응 기능**: NEWS (`docs/spec-writer/fsd/01_NEWS_FEED_SPECIFICATION.md`)
- **대상**: `frontend/src/components/feed/FeedToolbar.tsx`
- **테스트 파일**: `frontend/src/tests/feed/FeedToolbar.test.tsx` (지금 이름 ①~⑤ 블록)
- **모의**: `mockViewport(width)` 로 `matchMedia` 를 360·1024·1440 으로 바꿈, 스크롤 줄 `scrollWidth`/`clientWidth`/`scrollLeft` 정의

#### 1. RED Phase (커밋 `8abeea7`)
```
pnpm exec vitest run src/tests/feed/FeedToolbar.test.tsx → 6 실패 / 13 통과
① expected 0 to be greater than 0   (기본 선택자가 줄 안 Must-Read 를 골라 줄이 움직이지 않음)
② expected <input id="field-_r_r_" …> to be <input id="field-_r_o_" …>   (폭마다 다른 트리라 검색 입력이 다시 마운트됨)
③ 360px, 1024px: expected false to be true   (DOM 순서가 폭마다 다름)
④ 360px, 1024px: 검색 입력·카테고리가 다른 줄 소속
③·④ 1440px 는 통과 (회귀 방지)
```

#### 2. GREEN Phase (커밋 `1fde9c8`)
- 폭별 JS 트리 선택을 없애고 한 DOM 트리를 CSS 미디어 쿼리 클래스로만 배치. 소스 줄 선택 칩 선택자를 `data-source-chip` 으로 좁힘.

#### 3. REFACTOR Phase
- 이후 41(`214fabe` → `705a151`)과 50(`ab2d673`)이 같은 파일의 단언을 다시 바꿨다. 50 에서 정렬이 `FeedStatusBar` 로 옮겨지면서 ⑤ 테스트 이름의 'before sort' 는 단언 없이 이름에만 남았다 (8.3절).

### 2.6 사이클 4: 코드 리뷰 머지 전 필수 5건 (2026-11-09, 커밋 전)

- **대응**: `docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md` FE-01, FE-02, FE-03, FE-09, FE-22. 리뷰어의 재현 테스트(scratchpad `fcr-probe/`)를 저장소 테스트로 옮겨 단언으로 바꿨다.
- **대상 코드**: `frontend/src/components/chat/ChatWorkspace.tsx`, `frontend/src/hooks/useNewsFeed.ts`, `frontend/src/components/chat/ExportToolbar.tsx`, `frontend/src/components/chat/ChatMessageItem.tsx`
- **테스트 파일**: 새 파일 `frontend/src/tests/chat/ChatStreamTurn.test.tsx` (4), `frontend/src/tests/feed/FeedSearch.test.tsx` (2). 기대를 바꾼 파일 `chat/ExportToolbar.test.tsx`, `chat/ChatMessageItem.test.tsx`, `chat/ChatWorkspace.test.tsx` (아래 '기존 테스트 변경').
- **모의 핸들러**: `mocks/**` 는 고치지 않았다. 테스트 안에서 `server.use` 로 `POST */api/chat/stream`(SSE 본문 지정), `POST */api/chat/sessions`(본문 수집), `GET */api/news`(쿼리 수집, `search=mcp&page=1` 에만 1건)를 덮어썼다.

#### 1. RED Phase
`python3 .claude/skills/frontend-tdd-workflow/scripts/run_frontend_tdd.py --phase red -- <파일>` (저장소 루트). 구현 전 실패 이유가 리뷰 근거와 같다.

FE-01·02·03 (`src/tests/chat/ChatStreamTurn.test.tsx`):
```
 FAIL  … > FE-01: 모델을 바꾼 직후 보낸 질문은 바꾼 모델(티어)로 요청한다
AssertionError: expected 'sonnet' to be 'haiku' // Object.is equality
 FAIL  … > FE-02: 완료된 한 턴은 세션 저장 POST 를 한 번만 보낸다
AssertionError: expected [ { …(6) }, { …(6) } ] to have a length of 1 but got 2
 FAIL  … > FE-02: StrictMode 에서도 완료된 한 턴은 세션 저장 POST 를 한 번만 보낸다
AssertionError: expected [ { …(6) }, { …(6) }, { …(6) }, …(1) ] to have a length of 1 but got 4
 FAIL  … > FE-03: done 없이 끊긴 스트림은 오류로 보이고 완료로 저장하지 않는다
TestingLibraryElementError: Unable to find an element with the text: 응답이 중간에 끊겼습니다. 다시 시도해 주세요..
      Tests  4 failed (4)
✅ RED 확인
```

FE-09 (`src/tests/feed/FeedSearch.test.tsx`):
```
 FAIL  … > 3페이지에서 검색어를 입력하면 1페이지 결과를 보이고, 입력이 멈춘 뒤 한 번만 요청한다
TestingLibraryElementError: Unable to find an element with the text: MCP 검색 결과 기사.
 FAIL  … > 입력 직후 Enter 를 누르면 기다리지 않고 그 검색어로 요청한다
AssertionError: expected [ [ 'mcp', '1' ], [ 'mcp', '1' ] ] to deeply equal [ [ 'mcp', '1' ] ]
      Tests  2 failed (2)
✅ RED 확인
```
- 첫 테스트는 3페이지 그대로 `search=m`·`mc`·`mcp` 를 요청해 1페이지 결과가 보이지 않는다. 둘째는 입력 즉시 한 번, Enter 의 다시 읽기로 한 번 더 요청한다.

FE-22 (`src/tests/chat/ExportToolbar.test.tsx`, `src/tests/chat/ChatMessageItem.test.tsx`):
```
 FAIL  … > renders ExportToolbar with 4-step report actions for completed assistant message
 FAIL  … > renders copy markdown and download .md buttons only (FE-22: no fake Notion sync)
AssertionError: expected [ '마크다운 복사', '.md 다운로드', 'Notion 동기화' ] to deeply equal [ '마크다운 복사', '.md 다운로드' ]
      Tests  2 failed | 17 passed (19)
✅ RED 확인
```

#### 2. GREEN Phase
- **FE-01**: `handleSendMessage` 의존성 배열에 `selectedTier` 를 넣었다 (eslint `react-hooks/exhaustive-deps` 경고도 사라짐, 41 → 40).
- **FE-02**: 상태 갱신 함수 안의 `createOrUpdateSession` 호출 3곳(`done`, 루프 뒤 마무리, 중단)을 없앴다. 보조 메시지를 지역 변수(`assistantFinal`)로 누적해 `updateAssistant(patch)` 로 화면에 반영하고, 턴이 끝나면 갱신 함수 밖의 `saveTurn()` 으로 한 번만 저장한다 (완료 또는 중단일 때. 오류는 전과 같이 저장하지 않는다). 이번 턴 앞의 대화는 추가 갱신 함수가 받은 `prev` 를 기록해 쓴다 (재시도는 실패 쌍을 지운 직후 부르므로 콜백이 잡은 `messages` 보다 정확하다).
- **FE-03**: `done` 이벤트를 받았는지(`receivedDone`) 기록하고, 받지 못한 채 스트림이 끝나면 `응답이 중간에 끊겼습니다. 다시 시도해 주세요.` 오류로 던져 기존 오류 처리(오류 카드 + `답변 다시 시도`, 저장 안 함)로 보낸다.
- **FE-09**: `useNewsFeed` 가 입력창 값 `search` 와 요청 값 `appliedSearch` 를 나눴다. `setSearch` 는 화면 값만 바로 바꾸고 `SEARCH_DEBOUNCE_MS`(300ms, 기존 코드에 비슷한 디바운스 값이 없어 지시대로 300ms) 뒤 `appliedSearch` 와 `page = 1` 을 같은 렌더에서 바꾼다. 빈 값은 바로 반영한다. `loadNews`(Enter)는 기다리던 검색어를 먼저 반영한다. `handleSelectTag`·`resetFilters` 는 바로 반영한다. `FeedToolbar.tsx` 는 바꾸지 않았다 (page 되돌리기를 훅에서 해서 모든 호출이 같은 규칙을 따른다).
- **FE-22**: `ExportToolbar` 의 `Notion 동기화` 버튼, 가짜 성공 처리(`handleSyncNotion`), `notionSyncing`·`notionSynced` 상태, `onNotionSuccess`·`messageId` prop 을 없앴다. `ChatMessageItem` 은 `messageId` 를 넘기지 않는다. 마크다운 복사·`.md` 다운로드는 그대로다.

```
python3 … --phase green -- src/tests/chat/ExportToolbar.test.tsx src/tests/chat/ChatMessageItem.test.tsx
 Test Files  2 passed (2)
      Tests  19 passed (19)
✅ GREEN 확인
python3 … --phase green -- src/tests/chat/
 Test Files  19 passed (19)
      Tests  221 passed (221)
✅ GREEN 확인
python3 … --phase green -- src/tests/feed/ src/tests/hooks/
 Test Files  8 passed (8)
      Tests  65 passed (65)
✅ GREEN 확인
```
`--reporter=verbose` 로 본 새 테스트:
```
 ✓ chat/ChatStreamTurn.test.tsx > … > FE-01: 모델을 바꾼 직후 보낸 질문은 바꾼 모델(티어)로 요청한다
 ✓ chat/ChatStreamTurn.test.tsx > … > FE-02: 완료된 한 턴은 세션 저장 POST 를 한 번만 보낸다
 ✓ chat/ChatStreamTurn.test.tsx > … > FE-02: StrictMode 에서도 완료된 한 턴은 세션 저장 POST 를 한 번만 보낸다
 ✓ chat/ChatStreamTurn.test.tsx > … > FE-03: done 없이 끊긴 스트림은 오류로 보이고 완료로 저장하지 않는다
 ✓ feed/FeedSearch.test.tsx > 피드 검색어 입력 (FE-09) > 3페이지에서 검색어를 입력하면 1페이지 결과를 보이고, 입력이 멈춘 뒤 한 번만 요청한다
 ✓ feed/FeedSearch.test.tsx > 피드 검색어 입력 (FE-09) > 입력 직후 Enter 를 누르면 기다리지 않고 그 검색어로 요청한다
 ✓ chat/ExportToolbar.test.tsx > … > renders copy markdown and download .md buttons only (FE-22: no fake Notion sync)
```

#### 3. REFACTOR Phase
- 스트림 이벤트별 `setMessages(prev => prev.map(…))` 반복을 `updateAssistant(patch)` 하나로 줄였다. `ChatWorkspace.tsx` 는 165줄 바뀌고 줄었다 (추가보다 삭제가 많다).
- `ChatStreamTurn` 의 저장 대기(`settle`)를 `act` 로 감싸 `not wrapped in act(...)` 경고를 없앴다.

#### 기존 테스트 변경 (기능 변경에 따른 기대 변경)
- `chat/ExportToolbar.test.tsx`: 첫 테스트를 '툴바 버튼이 `마크다운 복사`·`.md 다운로드` 둘뿐이고 Notion 문구가 없다' 로 바꿨다. `handles Notion sync and triggers callback` 은 기능을 없애서 지웠고, `disables buttons when isStreaming is true` 에서 Notion 버튼 단언을 뺐다. 기본 props 에서 없앤 prop(`messageId`, `onNotionSuccess`)을 뺐다. 5개 → 4개.
- `chat/ChatMessageItem.test.tsx` › renders ExportToolbar with 4-step report actions…: `Notion 동기화` 버튼이 **없음**을 단언하도록 바꿨다.
- `chat/ChatWorkspace.test.tsx` › flushes remaining decoder bytes…: 이 테스트의 스트림은 `done` 없이 끝나 FE-03 뒤에는 오류(잘린 답)가 된다. 테스트 목적(끝에 `\n\n` 없는 마지막 블록 처리, 청크 사이에서 갈린 UTF-8)은 그대로 두고, 마지막 블록을 `\n\n` 없는 `done` 이벤트로 바꾸고 UTF-8 분할을 토큰 블록의 `완`(3바이트) 가운데로 옮겼다. 단언은 더했다: 완료된 답의 `리포트 익스포트 툴바` 가 보이고 끊김 오류 문구가 없다. (옛 분할 위치 `finalBytes.length - 5` 는 `완|료"}` 경계라 실제로는 글자 가운데를 자르지 않았다.)

#### 남은 것 (이 사이클 범위 밖)
- `useChatSessions.createOrUpdateSession` 의 `setSessions` 갱신 함수 안 localStorage 쓰기는 그대로다. 같은 값을 쓰므로 두 번 실행돼도 결과는 같고, POST 는 갱신 함수 밖이다.
- 새 대화·세션 선택으로 스트림이 중단되면, 전에는 갱신 함수의 `prev`(이미 비었거나 다른 세션 목록)를 저장해 중단된 턴이 저장되지 않거나 다른 세션 메시지가 옛 세션 id 로 저장될 수 있었다. 지금은 그 턴이 속한 세션 id 로 '앞의 대화 + 질문 + 중단된 답' 을 저장한다.
- 재시도 history 중복(FE-04)은 고치지 않았다.

### 2.7 사이클 5: 클라이언트 메시지 id·끊긴 답 보이기·중단 판정 (2026-11-09, 커밋 전)

- **대응**: BUG-02R (`docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` 8.1절. zod·MSW·계약 테스트는 계약 담당이 먼저 반영), FE-33·FE-34 (`docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md` 9.3절)
- **대상 코드**: `frontend/src/components/chat/ChatWorkspace.tsx`, `frontend/src/components/chat/ChatMessageItem.tsx`
- **테스트 파일**: `frontend/src/tests/chat/ChatStreamTurn.test.tsx` 에 4개 추가 (4 → 8)
- **모의**: BUG-02R·FE-33 은 `server.use` 로 `POST */api/chat/stream`(첫 요청 502 후 정상 SSE / `token` 하나만 보내고 닫음)과 `POST */api/chat/sessions`(본문 수집). FE-34 는 중단 신호를 무시하는 응답이 필요해 `vi.spyOn(globalThis, 'fetch')` 로 `ReadableStream` 을 돌려주고, 중단 버튼을 누른 뒤 본문을 정상 종료(`close`)한다.

#### 1. RED Phase
`python3 .claude/skills/frontend-tdd-workflow/scripts/run_frontend_tdd.py --phase red -- src/tests/chat/ChatStreamTurn.test.tsx`:
```
 FAIL  … > BUG-02R: 스트림 요청에 클라이언트 메시지 id 두 개를 싣고, 세션 저장도 같은 id 를 쓴다
TypeError: .toMatch() expects to receive a string, but got undefined
 FAIL  … > BUG-02R: 재시도는 새 메시지 id 로 보내고, 저장도 새 id 로 한다
AssertionError: expected undefined to be truthy
 FAIL  … > FE-33: done 없이 끊긴 스트림의 부분 답을 그대로 보이고 그 아래에 끊김 오류와 다시 시도를 함께 보인다
TestingLibraryElementError: Unable to find an element with the text: 받은 부분 답.
 FAIL  … > FE-34: 사용자가 중단한 뒤 스트림이 오류 없이 끝나면 끊김 오류가 아니라 중단으로 처리한다
Error: expect(element).not.toBeInTheDocument()   (끊김 오류 문구가 보임)
      Tests  4 failed | 4 passed (8)
✅ RED 확인
```

#### 2. GREEN Phase
- **BUG-02R**: 스트림 요청 본문에 `user_message_id: userMsgId`, `assistant_message_id: assistantMsgId` 를 더했다. `saveTurn` 은 원래 같은 메시지 객체(같은 id)를 저장한다. `handleSendMessage` 가 호출마다 id 를 새로 만들어 재시도는 새 id 로 보내고 저장한다.
- **FE-33**: `ChatMessageItem` 이 오류여도 내용이 있으면 마크다운 본문을 그리고, 그 아래에 오류 문구와 `답변 다시 시도` 를 그린다. 모델 배지·내보내기 도구줄은 오류가 아닐 때만 그린다. 끊긴 턴은 전과 같이 저장하지 않는다.
- **FE-34**: 루프가 끝났을 때 `controller.signal.aborted` 면 끊김 오류로 던지지 않고 `aborted` 로 두고 `saveTurn()` 으로 한 번 저장한다.
```
python3 … --phase green -- src/tests/chat/
 Test Files  19 passed (19)
      Tests  231 passed (231)
✅ GREEN 확인
 ✓ … > BUG-02R: 스트림 요청에 클라이언트 메시지 id 두 개를 싣고, 세션 저장도 같은 id 를 쓴다
 ✓ … > BUG-02R: 재시도는 새 메시지 id 로 보내고, 저장도 새 id 로 한다
 ✓ … > FE-33: done 없이 끊긴 스트림의 부분 답을 그대로 보이고 그 아래에 끊김 오류와 다시 시도를 함께 보인다
 ✓ … > FE-34: 사용자가 중단한 뒤 스트림이 오류 없이 끝나면 끊김 오류가 아니라 중단으로 처리한다
```

#### 3. REFACTOR Phase
- `ChatStreamTurn` 의 `expect(await screen.findByText(x)).toBeInTheDocument()` 7곳을 `await waitFor(() => expect(screen.getByText(x)).toBeInTheDocument())` 로 바꿨다. 찾은 `<p>` 가 완료 렌더에서 새 노드로 바뀌면 떨어진 노드를 단언해 실패하는 경합이 재시도 테스트에서 실제로 났다 (단언 내용은 같다).
- 스트림 중 `error` 이벤트로 끊긴 답도 같은 경로라, 이제 부분 답 아래에 오류가 보인다 (`chat/ChatWorkspace.test.tsx` 의 mid-stream 오류 테스트는 그대로 통과).

---

## 3. UI 5대 상태 (Idle, Loading, Error, Empty, Success) 검증표

'통과 여부' 는 2026-11-09 전체 실행(4절, 649개 통과) 기준이다. '모의 조건' 의 MSW 는 `frontend/src/mocks/`, props 는 테스트가 상태 값을 직접 넘긴 것이다. 화면 전체를 그리는 테스트와 부품만 그리는 테스트를 구분했다.

### 3.1 상태별 대응표

| 상태 | 화면·부품 | 테스트 (파일 › 이름) | 모의 조건 | 통과 |
| :--- | :--- | :--- | :--- | :---: |
| **Idle** | 챗 화면 처음 | `chat/ChatWorkspace` › renders initial empty workspace with welcome view when no search params | MSW 챗 핸들러, 검색 파라미터 없음 | PASS |
| Idle | 챗 새 세션 | `chat/ChatSessionWorkflow` › renders initial clean slate and generates new session UUID without auto-loading past session | MSW 세션 핸들러, `resetMockSessionStore`, localStorage 초기화 | PASS |
| Idle | 커맨드 팔레트 | `CommandPalette` › renders 5 core actions in Idle state | props (`isOpen`) | PASS |
| Idle | 기사 질의응답 패널 | `AskAiPanel` › renders quick prompts and placeholder when chat history is empty | props (빈 기록) | PASS |
| Idle | 포커스 캡슐·시트 처음 | `chat/FocusCapsule` › does not display fake count badges and renders clean label in initial state, `chat/FocusBottomSheet` › does not display matching count badge or alert when targetCount is undefined (initial clean state) | props | PASS |
| **Loading** | 챗 기록 사이드바·드로어 | `chat/ChatSidebar` › renders skeleton loading state when isLoading is true, `chat/ChatHistoryDrawer` › renders Loading State with skeletons when isLoading is true | props `isLoading` | PASS |
| Loading | 챗 답 스트리밍 | `chat/ChatWorkspace` › sends question, streams response via MSW…, allows user to stop streaming and preserves partial answer, receives SSE status events, renders WorkflowStepTracker… | MSW `POST */api/chat/stream` (핸들러 안 `delay`) | PASS |
| Loading | 스트리밍 중 부품 | `chat/WorkflowStepTracker` › renders real-time step animation, label, and progress during streaming, `chat/ChatMessageItem` › hides source count badges while streaming…, `chat/ChatPromptInput` › renders Stop generating button when isStreaming is true…, `chat/ChatHeader` › disables new chat button when streaming, `chat/ChatModelSelector` › disables trigger … when isStreaming is true, `chat/ExportToolbar` › disables buttons when isStreaming is true | props `isStreaming`·`currentStatus` | PASS |
| Loading | 요약 바 레이더 | `feed/InsightsBar` › shows a skeleton while the radar is loading, keeps showing the buttons without a skeleton while re-reading when data exists | props `loadingRadar` | PASS |
| Loading | 피드 훅 | `hooks/useNewsFeed` › (a) keeps the previous items without loading while the same list key is re-read, (c) keeps loadingRadar false…, (d) shows loading again when the list key changes | MSW `server.use` 지연 응답 | PASS |
| Loading | 수집 진행 | `Header` › shows 수집 중 and the progress line on mount when a collection is already running, `hooks/useCollector` › (a) restores collecting and progress polling when the schedule status says is_running | `vi.mock('@/lib/api')` / MSW `server.use` | PASS |
| Loading | 처리 중 확인 창·버튼 | `ui/ConfirmDialog` › keeps focus on the dialog container while busy, `ui/Dialog` › ignores Escape and the backdrop while busy and disables both buttons, `ui/Primitives` › is disabled and aria-busy while loading, Spinner renders an sr-only label, `ui/FormControls` › Skeleton is hidden from assistive tech and pulses | props | PASS |
| **Error** | 챗 답 오류 | `chat/ChatWorkspace` › displays clear error card and retry button on LLM 502 failure…, … on LLM 503 provider unavailable, displays error card and retry button when mid-stream SSE error occurs | MSW 오류 트리거 (502·503, 스트림 중 `error` 이벤트) | PASS |
| Error | 챗 답이 `done` 없이 끊김 (2.6, 2.7) | `chat/ChatStreamTurn` › FE-03: done 없이 끊긴 스트림은 오류로 보이고 완료로 저장하지 않는다, FE-33: …부분 답을 그대로 보이고 그 아래에 끊김 오류와 다시 시도… | `server.use` 로 `token` 하나만 보내고 닫는 SSE | PASS |
| Idle (중단) | 사용자 중단 뒤 본문 정상 종료 (2.7) | `chat/ChatStreamTurn` › FE-34 | `vi.spyOn(globalThis, 'fetch')` 로 신호를 무시하는 스트림 | PASS |
| Error | 없는 기사로 챗 진입 | `chat/ChatWorkspace` › handles 404 for invalid sourceId by showing warning and falling back to global mode | MSW `GET */api/chat/sources/:id` 404 | PASS |
| Error | 메시지 단위 | `chat/ChatMessageItem` › renders error state with retry button and calls onRetry | props | PASS |
| Error | 챗 기록 목록 | `chat/ChatSidebar` › renders error state and triggers retry when load fails, `chat/ChatHistoryDrawer` › renders Error State with retry button when error is present | props `error` | PASS |
| Error | 피드 훅 | `hooks/useNewsFeed` › (b) applies briefing and radar even when the stats request fails, (e) a failed re-read keeps the list and returns a reload failure signal…, (e) a failed request for a changed list key is still an error (ErrorState) | MSW `*/api/stats`·`*/api/news` 500 | PASS |
| Error | 수집 초기화 | `Header` › shows the reset error inside the dialog instead of alert(), `hooks/useCollector` › (c) rejects with the response message when the reset says already_running | `resetAndRecollect` 거부 / MSW `already_running` | PASS |
| Error | 복사 실패 | `ui/useCopyToClipboard` › reports failed (복사 실패) for 2 seconds when both methods fail, reports failed when there is no clipboard and no execCommand, `modals/NewsDetailModal` › shows 복사 실패 on the answer for 2 seconds when copying fails, `AskAiPanel` › shows 복사 실패 on the failed answer copy button… | `navigator.clipboard` 거부·`execCommand` false | PASS |
| Error | 공통 부품 | `ui/FormControls` › ErrorState is an alert with a retry button, sets aria-invalid only when there is an error, `ui/Dialog` › shows the error inside the dialog, `ui/ConfirmDialog` › moves focus to the error message when busy ends with an error, `ui/Primitives` › InlineAlert uses role="alert" for danger…, `ui/Toast` › shows a status toast and an alert toast for errors | props | PASS |
| Error | 계약 (MSW 자체) | `chat/ContractAndMsw` › 502·503·400·401·429·529 트리거, 세션 400·404·500, 뉴스 400·404·500·503, ask 503 | MSW 핸들러 오류 분기 (화면 없음) | PASS |
| **Empty** | 챗 메시지 없음 | `chat/ChatMessageList` › renders Welcome Empty View with 4 suggestion prompt pills when messages array is empty | props | PASS |
| Empty | 챗 기록 없음 | `chat/ChatSidebar` › renders empty state when there are no saved sessions, `chat/ChatHistoryDrawer` › renders Empty State when sessions array is empty | props `sessions=[]` | PASS |
| Empty | 팔레트 검색 결과 없음 | `CommandPalette` › displays Empty State when no actions match search query | props + 입력 | PASS |
| Empty | 포커스 필터 0건 | `chat/FocusBottomSheet` › displays guidance alert when targetCount is 0 | props | PASS |
| Empty | 요약 바 데이터 없음 | `feed/InsightsBar` › renders nothing when there is neither a briefing nor radar data, has no briefing button when there is no briefing | props | PASS |
| Empty | 단계 정보 없음 | `chat/WorkflowStepTracker` › does not render when stepHistory is empty and currentStatus is null | props | PASS |
| Empty | 카드 본문 없음·버전 없음 | `NewsCard` › fixes the title and body to two lines and keeps an empty two-line slot without text, `Header` › renders no version badge when the version is missing | props / `vi.stubEnv` | PASS |
| Empty | 공통 부품·순수 함수 | `ui/FormControls` › EmptyState shows title, description and action, `feed/FeedInsights` › returns an empty set for an empty list | props / 입력 값 | PASS |
| **Success** | 챗 답 완료 | `chat/ChatWorkspace` › sends question, streams response via MSW, and renders assistant answer, dynamically displays question-specific sources chip…, does not display fake hardcoded 5-count badge… | MSW 스트림 `done` | PASS |
| Success | 챗 한 턴 저장·모델 반영 (2.6) | `chat/ChatStreamTurn` › FE-01 (바꾼 티어로 요청), FE-02 (StrictMode 포함 저장 POST 1번) | `server.use` 로 SSE 지정, 세션 POST 수집 | PASS |
| Success | 피드 검색 결과 (2.6) | `feed/FeedSearch` › 3페이지에서 검색어를 입력하면 1페이지 결과를 보이고…, 입력 직후 Enter… | `server.use` 로 `GET */api/news` 쿼리 수집 | PASS |
| Success | 챗 세션 복원·삭제 | `chat/ChatSessionWorkflow` › hydrates full 4-pillar context…, allows continuous multi-turn chat after session hydration, deletes a session via DELETE API… | MSW 세션 핸들러 | PASS |
| Success | 메시지 완료 | `chat/ChatMessageItem` › renders ExportToolbar with 4-step report actions for completed assistant message, accurately displays true backend source counts… | props `status: 'completed'` | PASS |
| Success | 수집 완료 | `hooks/useCollector` › ① ignores a late is_running status response… (`수집 완료 (+2건 신규 반영)` 이 한 번) | MSW `server.use` + `deferred()` | PASS |
| Success | 설정 저장·소스 삭제 | `modals/BriefingSettingsModal` › shows the save result in an inline alert, `modals/SourcesModal` › deletes after confirming and shows the result in the live region | MSW `POST */api/briefing/settings`, `DELETE */api/sources/:type/:id` | PASS |
| Success | 데이터가 있는 대화상자 | `modals/DailyBriefingModal` (6개 모두), `modals/NewsDetailModal` › shows the summary tab first with Korean section headings | MSW `GET */api/briefing/today`, `mockNewsItems` | PASS |
| Success | 복사 성공 | `ui/useCopyToClipboard` › copies with navigator.clipboard and shows 복사됨 for 2 seconds, `chat/ExportToolbar` › copies markdown content to clipboard and shows feedback | `navigator.clipboard` mock | PASS |

### 3.2 5대 상태 공백

- **피드 메인 화면(`app/page.tsx`)의 Loading·Error·Empty 를 그려 보는 테스트가 없다.** 화면은 `NewsCardSkeleton`(`frontend/src/app/page.tsx:218`), `ErrorState`(`:224`), `EmptyState`(`:253`)를 쓰지만 이 페이지를 렌더링하는 테스트가 없다. 상태 전환은 훅 수준(`hooks/useNewsFeed.test.tsx`)에서만 본다.
- MSW 지연으로 '로딩 표시가 보인다' 를 단언하는 화면 테스트는 없다. 로딩 단언은 모두 props(`isLoading`, `loadingRadar`, `isStreaming`)를 넘기거나 훅의 `loading` 값을 본다.
- 챗 기록 목록의 Loading·Error·Empty 는 `ChatSidebar`·`ChatHistoryDrawer` 에 props 로 넘겨 본다. `useChatSessions` 가 MSW 500(`GET */api/chat/sessions` 500 트리거)을 받아 오류 상태로 바뀌는 화면 흐름은 테스트가 없다 (트리거 자체는 `ContractAndMsw` 가 본다).
- 소스 대화상자·딥 리서처 탭·스케줄 대화상자·MCP 모달은 Loading·Error·Empty 상태 테스트가 없다 (`modals/SourcesModal` 은 Success 와 확인 창만, `DeepResearcherTab` 은 지표 줄바꿈만).
- 일일 브리핑 대화상자는 브리핑이 없거나 요청이 실패할 때의 화면 테스트가 없다.

---

## 4. 실행 증거 (2026-11-09)

### 4.1 vitest (GREEN 확인)
`python3 .claude/skills/frontend-tdd-workflow/scripts/run_frontend_tdd.py --phase green` (저장소 루트, 인자 없음 = 전체, `frontend/` 에서 `pnpm exec vitest run`):
```
[frontend TDD] /Users/wonyoung/workspace/ozplayground/agentlens/frontend: pnpm exec vitest run

 RUN  v5.0.0 /Users/wonyoung/workspace/ozplayground/agentlens/frontend

 Test Files  52 passed (52)
      Tests  649 passed (649)
   Duration  6.90s (environment 36%, tests 34%, setup 18%, import 6%, transform 5%)

✅ GREEN 확인: 테스트가 모두 통과했다.
```
- 종료 코드 0. 실패·건너뜀 0.
- stderr 에 두 메시지가 나온다 (실패 아님): Vite 의 `configLoader: 'native'` 경고 (`vitest.config.ts` 가 CommonJS 로 읽히는 파일에서 ESM 문법을 씀), jsdom 의 `Not implemented: navigation to another Document`. 뒤의 것이 어느 테스트에서 나오는지는 확인하지 못했다.
- 파일별 테스트 수는 `pnpm exec vitest run --reporter=json` 결과로 다시 셌고 6절의 괄호 숫자와 52개 파일 모두 같다. 6절 표의 테스트 이름도 JSON 의 이름과 모두 일치한다 (`it.each` 이름 틀 `%s`·`%i`·`{fg}` 줄은 대조에서 뺐다).

### 4.2 eslint
`cd frontend && pnpm lint` (`eslint`, 설정 `frontend/eslint.config.mjs`: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`):
```
✖ 41 problems (0 errors, 41 warnings)
```
- 종료 코드 0. **오류 0개, 경고 41개.**
- 규칙별: `@typescript-eslint/no-unused-vars` 40, `react-hooks/exhaustive-deps` 1.
- 파일별: `src/mocks/handlers.ts` 20, `src/tests/chat/ContractAndMsw.test.ts` 7, `src/tests/chat/ChatSidebar.test.tsx` 3, `src/mocks/handlers/chat.ts` 2, `src/mocks/fixtures/chat.ts` 2, `src/components/chat/useChatSessions.ts` 2, `src/tests/chat/WorkflowStepTracker.test.tsx` 1, `src/tests/ThemeSystem.test.tsx` 1, `src/tests/ResponsiveLayout.test.tsx` 1, `src/tests/chat/ChatWorkspace.test.tsx` 1, `src/components/chat/ChatWorkspace.tsx` 1 (`:508` `useCallback` 의존성에 `selectedTier` 없음, `react-hooks/exhaustive-deps`).
- 테스트 파일의 경고는 14개, mocks 24개, 제품 코드 3개다. 커밋 `94fdf8e` 메시지는 '남은 경고 41개는 기존 테스트 파일의 미사용 변수' 라고 적었지만, 지금 실행에서는 41개 중 테스트 파일 경고는 14개이고 나머지는 `src/mocks/**`(24)와 제품 코드(3)다. 수는 같다.

### 4.3 타입 검사
`cd frontend && pnpm exec tsc --noEmit`:
- 종료 코드 0, 출력 0줄. **오류 0개.**

### 4.4 `make check` 의 frontend 부분
`Makefile` 의 `check` 는 backend pytest 뒤 `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 을 돈다. 이 작업에서는 frontend 세 명령을 따로 돌렸고(위 4.1~4.3) `make check` 전체는 돌리지 않았다.

### 4.5 사이클 4 뒤 `make check` (2026-11-09, 2.6절)
저장소 루트 `make check`, 종료 코드 **0**:
```
============================= 235 passed in 9.77s ==============================
 Test Files  54 passed (54)
      Tests  654 passed (654)
✖ 40 problems (0 errors, 40 warnings)
```
- backend pytest 235개는 같은 시간에 backend 쪽 작업이 더한 테스트를 포함한 수다 (이 사이클은 backend 를 고치지 않았다).
- frontend: 52 → 54개 파일 (새 `chat/ChatStreamTurn.test.tsx` 4개, `feed/FeedSearch.test.tsx` 2개), 649 → 654개 (`chat/ExportToolbar.test.tsx` 1개 삭제).
- eslint 경고 41 → 40: 제품 코드의 `react-hooks/exhaustive-deps`(`ChatWorkspace.tsx`, FE-01)가 없어졌다. 남은 제품 코드 경고는 `useChatSessions.ts` 미사용 import 2개다. 새 파일·고친 파일에서 생긴 경고는 없다.
- `tsc --noEmit` 오류 0.

### 4.6 사이클 5 뒤 `make check` (2026-11-09, 2.7절)
저장소 루트 `make check`, 종료 코드 **0**:
```
============================= 244 passed in 12.80s =============================
 Test Files  54 passed (54)
      Tests  664 passed (664)
✖ 40 problems (0 errors, 40 warnings)
```
- frontend 654 → 664: 이 사이클의 `ChatStreamTurn` 4개와 계약 담당이 `chat/ContractAndMsw.test.ts` 에 더한 BUG-02R 계약 테스트 6개. backend 244 는 backend 쪽 작업이 더한 수다.
- eslint 경고 40개 그대로 (새 경고 없음), `tsc --noEmit` 오류 0.

---

## 5. 테스트 환경과 검사 명령

### 5.1 검사 명령
- 전체: `make check` (= `make test`). backend pytest 다음에 frontend `pnpm test && pnpm lint && pnpm exec tsc --noEmit`. 하나라도 실패하면 0 이 아닌 값으로 끝난다.
- frontend 만: `cd frontend && pnpm test` (`vitest run`), `pnpm lint` (`eslint`), `pnpm exec tsc --noEmit`.
- TDD 단계 확인: `python3 .claude/skills/frontend-tdd-workflow/scripts/run_frontend_tdd.py --phase red|green|check [-- vitest 인자]`. `red` 는 vitest 가 실패해야 종료 0, `green` 은 통과해야 종료 0, `check` 는 vitest 종료 코드를 그대로 돌려준다. `pnpm` 이 없으면 `npx vitest run` 을 쓴다.
- `pnpm exec vitest list` 는 `it.each` 를 한 줄로 세어 576개를 보인다 (`design/TokenContrast.test.ts` 3개, `modals/DeepResearcherTab.test.tsx` 2개, `feed/FeedToolbar.test.tsx` 20개, `NewsCard.test.tsx` 32개로 나온다). 실행 수 649 와 다른 이유다 (2026-11-07 기록).

### 5.2 vitest 설정
`frontend/vitest.config.ts`: 플러그인 `@vitejs/plugin-react`, `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./src/tests/setup.ts']`, 별칭 `@` → `./src`. 버전은 `frontend/package.json` 기준 vitest `^5.0.0`(실행 v5.0.0), jsdom `^30.0.1`, msw `^2.15.0`, `@testing-library/react` `^16.3.3`, `@testing-library/user-event` `^14.6.7`, `@testing-library/jest-dom` `^7.0.1`.

- 테스트 종류: 단위(컴포넌트·훅·공통 부품, jsdom, MSW), 정적 검사(`design/TokenGuard`, `design/TokenContrast`, `ui/IconGuard` — vitest 로 돌고 `make check` 에 들어 있다), 계약(`chat/ContractAndMsw.test.ts`, zod 스키마 ↔ MSW 핸들러). 위치 규칙: 공통 부품 `ui/`, 피드 화면 부품 `feed/`, 대화상자 `modals/`, 훅 `hooks/`, 챗 `chat/`, 디자인 토큰 `design/`.
- E2E 테스트는 없다. 두 앱을 함께 띄우는 통합 검사도 정하지 않았다.
- `skip`, `xfail`, `.only`, `.todo` 마커는 frontend 어디에도 없다.

### 5.3 MSW 서버
- `frontend/src/mocks/server.ts`: `setupServer(...handlers)` (msw/node).
- `frontend/src/mocks/handlers.ts:564-568`: `handlers = [sseGetChatStreamHandler, ...chatHandlers, ...newsHandlers]`. `newsHandlers` 는 `:214`, 경로 핸들러는 `:218-480`. `sseGetChatStreamHandler` 는 `:480` (`GET */api/chat/stream`, backend 에는 없는 경로).
- `frontend/src/mocks/handlers/chat.ts:246`: `chatHandlers` (경로 핸들러 `:250-1153`), `resetMockSessionStore()` 로 메모리 세션 저장소를 비운다. fixture 는 `frontend/src/mocks/fixtures/chat.ts`.
- 모든 경로가 `*/api/...` 꼴이라 상대 경로·절대 경로 요청을 함께 받는다. 테스트는 필요한 응답을 `server.use(...)` 로 덮어쓰고, `setup.ts` 의 `afterEach` 가 `resetHandlers()` 로 되돌린다.
- 핸들러가 없는 요청은 `onUnhandledRequest: 'bypass'` 라 실제 네트워크로 나간다 (`setup.ts:70`). 이 때문에 생기는 로컬 요청은 8.1절.
- 프로덕션 코드는 MSW 를 import 하지 않는다 (v0.2.1 의 '프로덕션 mock 제거'). 계약 상세는 `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md`.

### 5.4 jsdom 한계와 폭 mock
- `setup.ts` 는 jsdom 에 없는 `window.matchMedia` 를 폭 1280px 데스크톱으로 가정한 mock 으로 채운다 (`setup.ts:9-55`). 폭별 동작을 보는 테스트는 이 mock 을 바꿔 쓰고 `afterEach` 에서 되돌린다.
- jsdom 은 레이아웃을 계산하지 않는다. 크기·위치·넘침은 vitest 로 확인하지 않고 `ui-audit.mjs` 로 잰다. 스크롤 줄 테스트는 `scrollWidth`·`clientWidth`·`scrollLeft`·`getBoundingClientRect` 를 직접 정의해 흉내 낸다. jsdom 은 `max-md:hidden` 같은 클래스로 숨긴 요소를 숨기지 않는다 (단계 53 기록).

### 5.5 화면 감사 `ui-audit.mjs` (요약)
- 위치: `frontend/scripts/ui-audit.mjs` (2,556줄, puppeteer-core), 판정 검증용 fixture `frontend/scripts/ui-audit-fixtures/defects.html`·`clean.html`·`dev-indicator.html`.
- 역할: jsdom 이 못 재는 폭별 화면 규칙을 실행 중인 프로덕션 빌드 앱에서 잰다. `/`·`/chat` × 라이트·다크 × 360·390·768·1024·1440px 과 대화상자·추가 상태(모두 160조합)에서 가로 스크롤, 헤더 한 줄, 첫 화면 카드, 44px 터치 영역, 대화상자 접근성, 확대 허용, 폭별 진입점과 판정 21종(`clip`, `placeholder`, `occluded`, `scrollRow`, `ariaControls`, `keepAll`, `rowAlign`, `vRhythm`, `chatAlign`, `toast`, `toolbarLayout`, `cardMetric`, `chatScope`, `terms`, `modelPicker`, `focusLabels`, `feedAreas`, `chatHeader`, `pictograph`, `briefing`, `cardFooter`)을 낸다.
- 실행: 프로덕션 빌드를 띄운 뒤(`make docker-up` 또는 `cd frontend && pnpm build && pnpm start`, 기본 `http://localhost:3001`, `--base` 로 변경) `cd frontend && node scripts/ui-audit.mjs`. 개발 서버(`next dev`)는 대상이 아니다 (개발 표시기가 있으면 종료 2). 로컬 Chrome 이 필요하다 (`CHROME_PATH`). 종료 코드 0 통과, 1 실패 하나 이상, 2 사용법·환경 오류. `--self-test` 는 앱 없이 fixture 로 판정 자체를 검증한다.
- **`make check` 밖의 수동 검사다.** 화면을 바꿨을 때 돌린다. 기능 흐름은 검증하지 않는다.
- `pictograph`·`terms` 금지 용어 검사가 보지 않는 UI 글자는 정적 검사 `ui/IconGuard.test.ts` 가 소스 수준에서 보완한다 (`components/**`·`app/**` 의 `.ts`·`.tsx` 전체. 대상 `IconGuard.test.ts:15`, 판정식 `:17`). `lib/**`·`hooks/**`·`context/**` 는 대상이 아니고, 금지 용어는 `IconGuard` 가 보지 않는다.
- 판정별 실패 조건·대상 상태·fixture 구성·결과 파일(`report.json`, PNG) 상세는 `docs/ui-system-designer/01_COMPONENT_SPEC.md` 에 둔다.

---

## 6. 파일별 테스트 명세

표기: '없음' 은 콜백을 `vi.fn()` 으로 넘기는 것 말고는 mock 이 없다는 뜻이다. `setup.ts` 의 전역 mock 은 항상 켜져 있다. 괄호 숫자는 실행 기준 테스트 수(`it.each` 는 펼친 수)다. 'mock/외부 호출' 칸이 MSW 사용 여부를 겸한다.

### 6.1 `frontend/src/tests/setup.ts`
vitest 설정(`frontend/vitest.config.ts`: jsdom, globals, `setupFiles: ['./src/tests/setup.ts']`)이 모든 테스트 파일 앞에 읽는다.

| 항목 | 동작 |
|---|---|
| `@testing-library/jest-dom/vitest` | DOM 매처를 등록한다 |
| `HTMLElement.prototype.scrollIntoView` | jsdom 에 없는 메서드를 빈 함수로 채운다 |
| `window.matchMedia` | jsdom 에 없는 함수를 폭 1280px 데스크톱으로 가정한 mock 으로 채운다. `(min-width: Npx)` 는 N ≤ 1280 이면 참, `(max-width: Npx)` 는 N ≥ 1280 이면 참, `prefers-color-scheme` 등 그 밖의 특성은 거짓, 리스너 등록은 아무것도 하지 않는다. 쓰기 가능이라 테스트가 `window.matchMedia = …` 로 바꿀 수 있다 (`setup.ts:9-55`) |
| `vi.mock('next/navigation')` | `useRouter`(push/replace/prefetch/back), `useSearchParams().get → null`, `usePathname → ''` 를 기본 mock 으로 둔다. 여러 테스트 파일이 자체 mock 으로 덮어쓴다 |
| MSW `server` | `beforeAll` 에서 `server.listen({ onUnhandledRequest: 'bypass' })`, `afterEach` 에서 `resetHandlers`, `afterAll` 에서 `close`. 핸들러는 `frontend/src/mocks/handlers.ts` (+ `mocks/handlers/chat.ts`)의 `*/api/...` 경로다. 핸들러가 없는 요청은 실제 네트워크로 그대로 나간다 (`setup.ts:70`) |

### 6.2 `frontend/src/tests/AskAiPanel.test.tsx` (8) — 대상 `components/news-detail/AskAiPanel.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders quick prompts and placeholder when chat history is empty | 대화 기록이 없으면 빠른 질문 프롬프트와 placeholder 를 보여준다 | AskAiPanel | 없음 |
| triggers onAsk with prompt text when quick prompt pill is clicked | 빠른 질문 pill(`핵심 원리 및 구조`) 클릭 시 그 질문문으로 onAsk 를 부른다 | AskAiPanel | 없음 |
| draws a decorative icon before each quick prompt label instead of an emoji (R44) | `빠른 질문` 그룹의 빠른 질문 버튼마다 `svg[aria-hidden="true"]` 가 하나 있고, 라벨(`QUICK_PROMPTS[].label`)에 그림 이모지가 없다 | AskAiPanel | 없음 |
| renders chat messages correctly when chat history exists | 대화 기록이 있으면 메시지를 보여준다 | AskAiPanel | 없음 |
| uses the short placeholder 이 기사에 대해 질문하세요 | `질문 입력` 입력창의 자리표시가 `이 기사에 대해 질문하세요` 다 | AskAiPanel | 없음 |
| shows 복사 실패 on the failed answer copy button with a polite live region (copyFailedIndex) | `copyFailedIndex` 의 답변 `답변 복사` 버튼만 `복사 실패` 를 보이고, `복사 실패` 를 읽는 `aria-live="polite"` `sr-only` 영역이 하나 있다 | AskAiPanel | 없음 |
| keeps the plain 복사 label when copyFailedIndex is null | `copyFailedIndex` 가 null 이면 어느 복사 버튼에도 `복사 실패` 가 없다 | AskAiPanel | 없음 |
| renders quick prompts in a single scroll row named 빠른 질문 | 빠른 질문이 `빠른 질문` 이름의 그룹 하나(`data-scroll-row`, `data-overflow`)에 모두 있다 | AskAiPanel, ScrollRow | 없음 |

### 6.3 `frontend/src/tests/chat/ActiveSourceChip.test.tsx` (4) — 대상 `components/chat/ActiveSourceChip.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders category and title accurately | 카테고리 짧은 라벨(`mcp_plugins_skills` → `MCP`)과 제목을 보여준다 | ActiveSourceChip, `lib/labels.ts` | fixture `mocks/fixtures/chat.ts` |
| calls onRemove when the remove button is clicked | 제거 버튼 클릭 시 onRemove | ActiveSourceChip | 없음 |
| does not trigger onRemove when disabled | disabled 면 onRemove 를 부르지 않는다 | ActiveSourceChip | 없음 |
| calls onPreviewClick when title or preview button is clicked | 제목·미리보기 클릭 시 onPreviewClick | ActiveSourceChip | 없음 |

### 6.4 `frontend/src/tests/chat/ChatHeader.test.tsx` (12) — 대상 `components/chat/ChatHeader.tsx`
마지막 두 테스트(`새 대화` 표시 조건)는 `window.matchMedia` 를 지정한 폭으로 답하는 mock 으로 바꾸고 `afterEach` 에서 되돌린다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders navigation back link to feed and brand title | 피드로 돌아가는 링크와 브랜드 제목 | ChatHeader | 없음 |
| renders scope segmented controls and calls onScopeChange | scope 세그먼트 컨트롤과 onScopeChange 호출 | ChatHeader | 없음 |
| renders ActiveSourceChip when activeSource is provided | activeSource 가 있으면 칩을 보여준다 | ChatHeader, ActiveSourceChip | fixture |
| calls onNewChat when 새 대화 button is clicked | "새 대화" 클릭 시 onNewChat | ChatHeader | 없음 |
| disables new chat button when streaming | 스트리밍 중 새 대화 버튼 비활성 | ChatHeader | 없음 |
| does not render a model selector in the header (R39: the composer is the only place) | 헤더에 `Claude 모델 선택` 버튼이 없다 (`queryByRole` null). 모델 선택은 입력창 한 곳 | ChatHeader | 없음 |
| names the two scope tabs exactly 단일 기사 and 전체 소식 inside the 검색 스코프 모드 group (R37·R38) | 그룹 `검색 스코프 모드` 안 두 버튼의 접근 이름이 정확히 `단일 기사`·`전체 소식` | ChatHeader, ChatContextBar | 없음 |
| puts the 피드로 돌아가기 link before the 대화 기록 보기 button, as the first control in the header (R43) | `피드로 돌아가기` 링크가 `대화 기록 보기` 버튼보다 DOM 앞이고, `header` 안 첫 `a[href]`·`button` 이 그 링크다 | ChatHeader | 없음 |
| 기록이 닫혀 있으면 aria-controls 를 달지 않고 aria-expanded 는 false | `isHistoryOpen=false` 면 `대화 기록 보기` 버튼에 `aria-controls` 가 없고 `aria-expanded="false"` | ChatHeader | 없음 |
| 기록이 열려 있으면 aria-controls 와 aria-expanded="true" 를 단다 | `isHistoryOpen=true` 면 `aria-expanded="true"` 와 `chat-history-sidebar` 또는 `chat-history-drawer` 를 가리키는 `aria-controls` | ChatHeader | 없음 |
| shows 새 대화 below 1024px even when the sidebar is open, and calls onNewChat | 폭 800px 에서는 사이드바가 열려 있어도 "새 대화" 버튼이 보이고 누르면 onNewChat | ChatHeader (`!isDesktop \|\| !isSidebarOpen`) | `window.matchMedia` 폭 800 mock |
| hides 새 대화 at 1024px and above while the sidebar is open | 폭 1280px 에서 사이드바가 열려 있으면 "새 대화" 버튼이 없다 | ChatHeader | `window.matchMedia` 폭 1280 mock |

### 6.5 `frontend/src/tests/chat/ChatHistoryDrawer.test.tsx` (10) — 대상 `components/chat/ChatHistoryDrawer.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| does not render when isOpen is false | 닫힘 상태면 렌더링하지 않는다 | ChatHistoryDrawer | 없음 |
| renders drawer with navigation role and title when isOpen is true | 열림 상태에서 navigation role 과 제목 | ChatHistoryDrawer | 없음 |
| calls onClose when backdrop or close button is clicked | 배경·닫기 버튼 클릭 시 onClose | ChatHistoryDrawer | 없음 |
| calls onClose when Escape key is pressed | Escape 키로 onClose | ChatHistoryDrawer | 없음 |
| calls onNewChat and onClose when + 새 대화 button is clicked | "+ 새 대화" 클릭 시 onNewChat, onClose | ChatHistoryDrawer | 없음 |
| calls onSelectSession and onClose when a session card is clicked | 세션 카드 클릭 시 onSelectSession, onClose | ChatHistoryDrawer | 없음 |
| renders Loading State with skeletons when isLoading is true | 로딩 스켈레톤 | ChatHistoryDrawer | 없음 |
| renders Error State with retry button when error is present | 오류 상태와 재시도 버튼 | ChatHistoryDrawer | 없음 |
| renders Empty State when sessions array is empty | 빈 상태 | ChatHistoryDrawer | 없음 |
| triggers delete session confirmation popover and calls onDeleteSession | 삭제 확인 팝오버 후 onDeleteSession | ChatHistoryDrawer, DeleteConfirmPopover | 없음 |

### 6.6 `frontend/src/tests/chat/ChatMessageItem.test.tsx` (15) — 대상 `components/chat/ChatMessageItem.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders user message bubble cleanly | 사용자 메시지 말풍선 | ChatMessageItem | 없음 |
| faithfully preserves and renders legacy gemini model_used without distortion | 과거 Gemini 모델명을 바꾸지 않고 보여준다 | ChatMessageItem | 없음 |
| formats Haiku and Opus model names without exposing raw model IDs | Haiku/Opus 표시명을 쓰고 원시 모델 ID 를 숨긴다 | ChatMessageItem | 없음 |
| handles copy action when copy button is clicked | 복사 버튼이 본문을 클립보드에 쓴다 | ChatMessageItem | `navigator.clipboard` mock |
| renders ExportToolbar with 4-step report actions for completed assistant message | 완료된 답변에 ExportToolbar (`마크다운 복사`, `.md 다운로드`). `Notion 동기화` 버튼은 없다 (FE-22) | ChatMessageItem, ExportToolbar | 없음 |
| renders error state with retry button and calls onRetry | 오류 상태와 재시도 시 onRetry | ChatMessageItem | 없음 |
| renders auto-relaxation guidance badge when is_relaxed is true | is_relaxed 면 완화 안내 배지 | ChatMessageItem | 없음 |
| renders dual citations [1] and [S1] appropriately in assistant message | [1], [S1] 인용 배지. [S1] 은 `data-tone="supplementary"` 와 `text-success` 클래스 | ChatMessageItem, CitationBadge | 없음 |
| renders WorkflowStepTracker in assistant message when step_history or current_status is present | 단계 정보가 있으면 WorkflowStepTracker | ChatMessageItem, WorkflowStepTracker | 없음 |
| renders ultra-long unspaced text with break-words, [overflow-wrap:anywhere], and flex-1 min-w-0 max-w-full bubble | 공백 없는 긴 텍스트 줄바꿈 클래스 | ChatMessageItem | 없음 |
| renders long inline code with break-all, font-mono, and border styling | 긴 인라인 코드 스타일 (`break-all`, `font-mono`, `text-[12px]`, 배경 토큰 `bg-surface-muted`) | ChatMessageItem | 없음 |
| renders markdown table wrapped in an isolated horizontal scroll wrapper | 표를 가로 스크롤 래퍼로 감싼다 | ChatMessageItem | 없음 |
| renders headings h1-h3, li, and blockquote with [overflow-wrap:anywhere] and break-words | 제목·목록·인용 줄바꿈 클래스 | ChatMessageItem | 없음 |
| accurately displays true backend source counts (e.g., 1 or 3) and never hardcodes 5 items | 실제 출처 개수(1, 3)를 보여주고 5 고정값이 없다 | ChatMessageItem | 없음 |
| hides source count badges while streaming (even with non-empty content and sources) and shows them only when status === "completed" | 스트리밍 중 출처 개수 배지를 숨기고 완료 시에만 보여준다 | ChatMessageItem | 없음 |

### 6.7 `frontend/src/tests/chat/ChatMessageList.test.tsx` (5) — 대상 `components/chat/ChatMessageList.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders Welcome Empty View with 4 suggestion prompt pills when messages array is empty | 메시지가 없으면 환영 화면과 제안 4개 | ChatMessageList | 없음 |
| renders accessible message list with role log and aria-live | role=log, aria-live 목록 | ChatMessageList | 없음 |
| enforces overflow-x-hidden, w-full, and max-w-full on message list container | 가로 넘침 방지 클래스 | ChatMessageList | 없음 |
| 추천 질문 버튼마다 text-left 를 직접 단다 (spec 14.6) | 추천 질문 버튼 4개가 모두 `text-left` 클래스를 가진다 (글자 왼쪽 정렬) | ChatMessageList | 없음 |
| sends the suggestion text without emoji and draws one decorative lucide icon per card (R44) | 첫 추천 카드를 누르면 `onSelectPromptSuggestion('FastMCP로 파이썬 기반 경량 MCP 서버 구축하는 방법')`(이모지 없음). 카드마다 첫 자식이 `svg.text-accent[aria-hidden="true"]` 하나이고 글자에 그림 이모지가 없다 | ChatMessageList | 없음 |

### 6.8 `frontend/src/tests/chat/ChatModelSelector.test.tsx` (15) — 대상 `components/chat/ChatModelSelector.tsx`, `ModelChangeDivider.tsx`, `ModelTierBadge.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders inline chip trigger with default Sonnet 5.5 tier and icon | 기본 Sonnet 5.5 칩 트리거. 트리거 안 `[data-tier-icon="sonnet"]` 가 `svg` 이고 `aria-hidden="true"`, 트리거 글자에 그림 이모지가 없다 | ChatModelSelector, TierIcon | 없음 |
| opens popover on click and renders all 3 Claude tiers with WAI-ARIA radiogroup | 클릭 시 radiogroup 팝오버에 3개 티어 | ChatModelSelector | 없음 |
| calls onSelectTier when user selects a different tier and closes popover | 다른 티어 선택 시 onSelectTier 후 닫힌다 | ChatModelSelector | 없음 |
| supports keyboard navigation: ArrowDown / ArrowUp cyclic focus and Enter selection | 화살표 순환 포커스와 Enter 선택 | ChatModelSelector | 없음 |
| closes popover on Escape key press and returns focus to trigger | Escape 로 닫고 트리거로 포커스 복귀 | ChatModelSelector | 없음 |
| disables trigger and prevents popover open when isStreaming is true | 스트리밍 중 비활성, 팝오버 안 열림 | ChatModelSelector | 없음 |
| renders header-compact variant appropriately | header-compact 변형 | ChatModelSelector | 없음 |
| renders header-chip variant appropriately and positions popover downwards | header-chip 변형과 아래쪽 팝오버 | ChatModelSelector | 없음 |
| honors forceOpen prop | forceOpen 이면 열린 상태 | ChatModelSelector | 없음 |
| renders separator with accessible role and concise model change label | 모델 변경 구분선 role 과 라벨 | ModelChangeDivider | 없음 |
| renders custom contextNotice when provided | contextNotice 표시 | ModelChangeDivider | 없음 |
| renders chip variant with tier icon, name, and relative cost | 칩 변형의 티어 아이콘(`[data-tier-icon="haiku"]`)·이름·상대 비용 | ModelTierBadge, TierIcon | 없음 |
| renders footer variant with latency in milliseconds | footer 변형의 티어 아이콘(`[data-tier-icon="sonnet"]`)과 지연시간(ms) | ModelTierBadge, TierIcon | 없음 |
| renders recommendation tag when showRecommended is true for Sonnet | Sonnet 추천 태그 | ModelTierBadge | 없음 |
| can hide icon when showIcon is false | showIcon=false 면 `[data-tier-icon]` 이 없다 | ModelTierBadge | 없음 |

### 6.9 `frontend/src/tests/chat/ChatPromptInput.test.tsx` (9) — 대상 `components/chat/ChatPromptInput.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders textarea with accessible role and placeholder | 접근 가능한 textarea 와 placeholder | ChatPromptInput | 없음 |
| triggers onChange when typing | 입력 시 onChange | ChatPromptInput | 없음 |
| calls onSubmit on Enter key (when not composing and not shift) | Enter 로 onSubmit | ChatPromptInput | 없음 |
| does NOT call onSubmit when Shift+Enter is pressed | Shift+Enter 는 제출하지 않는다 | ChatPromptInput | 없음 |
| does NOT call onSubmit when IME is composing | IME 조합 중 Enter 는 제출하지 않는다 | ChatPromptInput | 이벤트 `isComposing` 속성 지정 |
| renders Stop generating button when isStreaming is true and calls onStopGenerating | 스트리밍 중 중지 버튼과 onStopGenerating | ChatPromptInput | 없음 |
| displays character counter and highlights warning when length exceeds maxLength | 글자 수 표시와 초과 경고 | ChatPromptInput | 없음 |
| renders the model trigger with Sonnet 5.5 and calls onSelectTier with haiku | `selectedTier`·`onSelectTier` 를 넘기면 `Claude 모델 선택` 버튼 글자가 `Sonnet 5.5`, `Haiku 5.5` 를 고르면 `onSelectTier('haiku')` | ChatPromptInput, ChatModelSelector | 없음 |
| disables the model trigger while streaming | `isStreaming` 이면 `Claude 모델 선택` 버튼이 `disabled` | ChatPromptInput, ChatModelSelector | 없음 |

### 6.10 `frontend/src/tests/chat/ChatSessionWorkflow.test.tsx` (5) — 대상 `components/chat/ChatWorkspace.tsx`, `useChatSessions.ts`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders initial clean slate and generates new session UUID without auto-loading past session | 처음엔 빈 화면, 새 세션 UUID, 과거 세션 자동 로드 없음 | ChatWorkspace | MSW 세션 핸들러, `resetMockSessionStore`, next/navigation mock, localStorage 초기화 |
| hydrates full 4-pillar context (messages, scopeMode, activeSource) when selecting a past session | 과거 세션 선택 시 메시지·scope·출처 복원 (스코프 탭은 접근 이름 정확히 `단일 기사` 로 찾아 `aria-pressed="true"` 확인. 세션 카드 이름 `…, 단일 기사 모드` 와 겹치지 않게 정확 일치) | ChatWorkspace, useChatSessions | 같음 |
| allows continuous multi-turn chat after session hydration | 복원 후 연속 대화 | ChatWorkspace | 같음 (MSW 스트림) |
| resets to new session and empty state when "+ 새 대화" is clicked | "+ 새 대화" 로 새 세션·빈 상태 | ChatWorkspace | 같음 |
| deletes a session via DELETE API and resets active conversation if deleted session was active | DELETE 후 활성 세션이면 대화 초기화 | ChatWorkspace, useChatSessions | 같음 |

### 6.11 `frontend/src/tests/chat/ChatSidebar.test.tsx` (11) — 대상 `components/chat/ChatSidebar.tsx`, `ChatHistoryDrawer.tsx`, `SessionItemCard.tsx`, `DeleteConfirmPopover.tsx`, `SessionList.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders desktop navigation panel with header, + 새 대화 button, search input, and session items | 데스크톱 패널의 헤더·새 대화·검색·세션 목록 | ChatSidebar | 없음 |
| filters session items based on searchQuery | 검색어로 세션 필터 | ChatSidebar, SessionList | 없음 |
| renders skeleton loading state when isLoading is true | 로딩 스켈레톤 | ChatSidebar | 없음 |
| renders error state and triggers retry when load fails | 오류 상태와 재시도 | ChatSidebar | 없음 |
| renders empty state when there are no saved sessions | 빈 상태 | ChatSidebar | 없음 |
| renders mobile slide-over drawer with backdrop and close button when isOpen is true | 모바일 드로어의 배경·닫기 버튼 | ChatHistoryDrawer | 없음 |
| calls onClose when backdrop is clicked or Escape key is pressed | 배경 클릭·Escape 로 onClose | ChatHistoryDrawer | 없음 |
| renders active session highlight with data-active, bg-accent-soft and border-accent | 활성 세션은 `aria-current="true"`, `data-active="true"`, 토큰 클래스 `bg-accent-soft`·`border-accent` | SessionItemCard | 없음 |
| renders truncated title, relative time, and scope badge | 잘린 제목·상대 시간·scope 배지(`단일 기사`) | SessionItemCard | 없음 |
| uses 단일 기사 / 전체 소식 for the scope badge and accessible name, with no Scoped·Global text (R38) | `global` 세션 배지 `전체 소식`, 카드 접근 이름에 `단일 기사 모드`/`전체 소식 모드`, 화면에 `Scoped`·`Global` 글자 없음 | SessionItemCard | 없음 |
| opens delete confirmation popover on delete click, cancels on 취소, and executes onDelete on 삭제 | 삭제 팝오버의 취소/삭제 | SessionItemCard, DeleteConfirmPopover | 없음 |

### 6.12 `frontend/src/tests/chat/ChatWorkspace.test.tsx` (18) — 대상 `components/chat/ChatWorkspace.tsx`
공통 mock: 파일 자체 `vi.mock('next/navigation')`(`useSearchParams().get` 을 `mockGet` 으로), `beforeEach` 에서 localStorage 초기화, 네트워크는 MSW 채팅 핸들러(`mocks/handlers/chat.ts`)가 받는다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders initial empty workspace with welcome view when no search params | 검색 파라미터가 없으면 환영 화면과 입력창 | ChatWorkspace | 공통 |
| fetches source metadata and switches to scoped mode when sourceId is present in searchParams | sourceId 가 있으면 출처를 불러와 scoped 로 바뀐다 | ChatWorkspace | 공통 (MSW `GET /api/chat/sources/:id`) |
| handles 404 for invalid sourceId by showing warning and falling back to global mode | 없는 sourceId 면 경고 `요청하신 기사를 찾을 수 없어 전체 소식 모드로 시작합니다` 후 global | ChatWorkspace | 공통 |
| sends question, streams response via MSW, and renders assistant answer | 질문 전송, 스트림 수신, 답 표시 | ChatWorkspace | 공통 (MSW `POST /api/chat/stream`) |
| allows user to stop streaming and preserves partial answer | 중지 시 부분 답 유지 | ChatWorkspace | 공통 |
| resets conversation when 새 대화 button is clicked | 새 대화로 초기화 | ChatWorkspace | 공통 |
| renders FocusCapsule and opens FocusBottomSheet when clicked | 포커스 캡슐 클릭 시 바텀시트 (시트의 `하네스 & 벤치마크` 칩을 찾는다) | ChatWorkspace, FocusCapsule, FocusBottomSheet | 공통 |
| sends filters payload and displays auto-relaxation banner when is_relaxed is true | 필터 payload 전송, 완화 배너 | ChatWorkspace | 공통 |
| displays clear error card and retry button on LLM 502 failure, and clicking retry re-sends question | 502 오류 카드와 재시도 재전송 | ChatWorkspace | 공통 (MSW 오류 트리거) |
| displays clear error card and retry button on LLM 503 provider unavailable | 503 오류 카드 | ChatWorkspace | 공통 |
| displays error card and retry button when mid-stream SSE error occurs | 스트림 중 error 이벤트 처리 | ChatWorkspace | 공통 |
| receives SSE status events, renders WorkflowStepTracker and dual citations upon completion | status 이벤트로 단계 표시, 완료 후 인용. 보충 인용 [S1] 은 `data-tone="supplementary"` 와 `text-success` | ChatWorkspace, WorkflowStepTracker | 공통 |
| switches Claude model mid-session and renders ModelChangeDivider in timeline | 세션 중 모델 변경 구분선 | ChatWorkspace, ModelChangeDivider | 공통 |
| shows a single model selector under the composer and reflects tier changes immediately (R39) | `Claude 모델 선택` 트리거가 정확히 1개이고 질문 입력창 뒤(DOM 순서)에 있다. 처음 `Sonnet 5.5`, `Haiku 5.5`·`Opus 5.5` 를 고르면 트리거 글자가 즉시 바뀐다 | ChatWorkspace, ChatPromptInput, ChatModelSelector | 공통 |
| correctly sends scope: scoped and source_id when article is focused, and renders customized response | scoped 요청 본문과 맞춤 응답 | ChatWorkspace | 공통 |
| dynamically displays question-specific sources chip and inline citations for global mode questions (v0.2.2) | global 질문별 출처 칩과 인용 | ChatWorkspace | 공통 |
| does not display fake hardcoded 5-count badge upon entering chat, and reflects true backend sources | 5 고정 배지 없음, 실제 출처 수 | ChatWorkspace | 공통 |
| flushes remaining decoder bytes and processes trailing SSE event block in buffer when stream ends without trailing double newline | 마지막 SSE 블록(`done`)이 `\n\n` 없이 끝나고 UTF-8 이 청크 사이에서 갈려도 남은 버퍼를 처리해 답이 완료된다 (내보내기 도구줄이 보이고 끊김 오류가 없다) | ChatWorkspace SSE 파서 | `vi.spyOn(globalThis, 'fetch')` 로 ReadableStream 응답 |

### 6.13 `frontend/src/tests/chat/CitationBadge.test.tsx` (6) — 대상 `components/chat/CitationBadge.tsx`, `CitationPopover.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders inline interactive badge with accessible ARIA attributes when source is provided | 출처가 있으면 ARIA 속성이 있는 배지 | CitationBadge | fixture |
| renders non-interactive fallback span for phantom citation when source is undefined | 출처가 없으면 비대화형 span | CitationBadge | 없음 |
| opens CitationPopover dialog on click or hover and displays source details | 클릭·hover 로 팝오버와 출처 상세 | CitationBadge, CitationPopover | fixture |
| closes CitationPopover when Escape key is pressed | Escape 로 팝오버 닫기 | CitationPopover | fixture |
| visually differentiates supplementary citation [S1] with emerald styling and web search label | [S1] 보조 인용은 `data-tone="supplementary"` 와 `text-success` 클래스, 웹 검색 라벨 (이름의 emerald 는 옛 색 이름이다) | CitationBadge | 없음 |
| renders supplementary web metadata (domain, query, snippet) in CitationPopover for [S1] | [S1] 팝오버의 도메인·질의·스니펫 | CitationPopover | 없음 |

### 6.14 `frontend/src/tests/chat/ContractAndMsw.test.ts` (72)
`beforeEach` 에서 `resetMockSessionStore()`. 스키마·헬퍼 테스트의 대상은 `frontend/src/types/chat.ts`, `frontend/src/types/news.ts` 이고 mock 이 없다. "MSW" 표기 테스트는 상대 경로 `fetch` 로 `frontend/src/mocks/handlers.ts`, `mocks/handlers/chat.ts` 의 핸들러 자체를 검증한다 (backend 를 부르지 않는다).

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| applies standard defaults when empty object is passed | 빈 객체에 포커스 필터 기본값 | `ChatFocusFilterSchema` | 없음 |
| validates proper category, time_range, sort, and high_signal_only | 필터 필드 검증 | `ChatFocusFilterSchema` | 없음 |
| converts between UI camelCase FocusFilters and API snake_case ChatFocusFilter | camelCase ↔ snake_case 변환 | `toChatFocusFilter`, `fromChatFocusFilter` | 없음 |
| validates all 7 agentic & ReAct workflow step enum values | 단계 enum 7개 | `ChatStatusStepSchema` | 없음 |
| validates ChatStatusPayload schema with optional query and progress | status payload 의 선택 필드 | `ChatStatusPayloadSchema` | 없음 |
| validates primary source with numeric index | 숫자 index primary 출처 | `ChatSourceItemSchema` | 없음 |
| validates supplementary source with string index like S1 | "S1" index 보조 출처 | `ChatSourceItemSchema` | 없음 |
| validates ChatSourcesPayload with dual sources and counts | 이중 출처와 개수 | `ChatSourcesPayloadSchema` | 없음 |
| correctly parses event: status | SSE status 파싱 | `parseChatSseEvent` | 없음 |
| correctly parses event: sources | SSE sources 파싱 | `parseChatSseEvent` | 없음 |
| returns null for unparseable or unknown events | 알 수 없는 이벤트는 null | `parseChatSseEvent` | 없음 |
| validates standard LLM error codes | LLM 오류 코드 enum | `LlmErrorCodeSchema` | 없음 |
| validates LlmErrorResponse schema for upstream errors (502 / 503) | 502/503 오류 응답 | `LlmErrorResponseSchema` | 없음 |
| handles POST /api/chat/stream 502 error trigger | 502 트리거 응답 | `mocks/handlers/chat.ts` | MSW |
| handles POST /api/chat/stream 503 error trigger | 503 트리거 응답 | 같음 | MSW |
| handles POST /api/chat/query with filters and returns dual sources | 필터 query 의 이중 출처 | 같음 | MSW |
| handles GET /api/chat/search with category and high_signal_only filters | 검색 필터 | 같음 | MSW |
| validates ChatSessionSummarySchema correctly | 세션 요약 스키마 | `ChatSessionSummarySchema` | 없음 |
| rejects invalid UUID in ChatSessionSummarySchema | 잘못된 UUID 거부 | 같음 | 없음 |
| validates ChatMessageItemSchema and coerces numeric id to string | 숫자 id 를 문자열로 | `ChatMessageItemSchema` | 없음 |
| validates ChatSessionDetailSchema with full message history | 세션 상세와 메시지 이력 | `ChatSessionDetailSchema` | 없음 |
| validates ChatSessionCreateRequestSchema with defaults | 세션 생성 요청 기본값 | `ChatSessionCreateRequestSchema` | 없음 |
| validates GenericSuccessResponseSchema | 일반 성공 응답 | `GenericSuccessResponseSchema` | 없음 |
| generateAutoTitle correctly trims markdown and limits to 30 characters | 자동 제목의 마크다운 제거·30자 제한 | `generateAutoTitle` | 없음 |
| applySlidingWindow correctly limits turns to 10 and respects token heuristic | 대화 10턴·토큰 휴리스틱 제한 | `applySlidingWindow` | 없음 |
| converts bidirectionally between ChatMessageItem and UI ChatMessage | API 메시지 ↔ UI 메시지 변환 | `chatMessageItemToUiMessage`, `uiMessageToChatMessageItem` | 없음 |
| handles GET /api/chat/sessions (200 OK) sorted by updated_at DESC | 세션 목록 정렬 | `mocks/handlers/chat.ts` | MSW |
| handles GET /api/chat/sessions 500 error trigger | 목록 500 트리거 | 같음 | MSW |
| handles POST /api/chat/sessions (201 Created) | 세션 생성 201 | 같음 | MSW |
| handles POST /api/chat/sessions 400 error trigger | 생성 400 트리거 | 같음 | MSW |
| handles POST /api/chat/sessions 500 error trigger | 생성 500 트리거 | 같음 | MSW |
| handles GET /api/chat/sessions/:session_id (200 OK) | 상세 200 | 같음 | MSW |
| handles GET /api/chat/sessions/:session_id (404 Not Found) | 상세 404 | 같음 | MSW |
| handles GET /api/chat/sessions/:session_id 500 error trigger | 상세 500 트리거 | 같음 | MSW |
| handles DELETE /api/chat/sessions/:session_id (200 OK CASCADE) | 삭제 200 | 같음 | MSW |
| handles DELETE /api/chat/sessions/:session_id (404 Not Found) | 삭제 404 | 같음 | MSW |
| handles DELETE /api/chat/sessions/:session_id 500 error trigger | 삭제 500 트리거 | 같음 | MSW |
| auto-persists conversation turn to session store upon POST /api/chat/stream completion | 스트림 완료 후 mock 세션 저장소에 대화 저장 | 같음 | MSW |
| validates NewsItemSchema with complete attributes | 뉴스 항목 스키마 | `NewsItemSchema` | 없음 |
| validates NewsListResponseSchema with pagination envelope | 페이지네이션 응답 | `NewsListResponseSchema` | 없음 |
| validates SourceConfigSchema and SourcesResponseSchema | 소스 설정·목록 응답 | `SourceConfigSchema`, `SourcesResponseSchema` | 없음 |
| validates MessageSchema and SendMessageRequestSchema contract conformity | 메시지·전송 요청 스키마 | `MessageSchema`, `SendMessageRequestSchema` | 없음 |
| handles GET /api/news with pagination and sorting | 뉴스 목록 페이지·정렬 | `mocks/handlers.ts` | MSW |
| handles GET /api/news with category and high_signal_only filters | 뉴스 필터 | 같음 | MSW |
| handles GET /api/news 400 Bad Request fallback (invalid page) | 잘못된 page 400 | 같음 | MSW |
| handles GET /api/news 500 Internal Error trigger | 500 트리거 | 같음 | MSW |
| handles GET /api/news 503 Fallback trigger | 503 트리거 | 같음 | MSW |
| handles GET /api/news/:id 404 Not Found fallback | 상세 404 | 같음 | MSW |
| handles POST /api/news/:id/ask 503 Fallback trigger | ask 503 트리거 | 같음 | MSW |
| handles GET /api/chat/stream SSE streaming mock | GET 스트림 mock 이 status·done 을 낸다 | `mocks/handlers.ts` `sseGetChatStreamHandler` | MSW |
| validates ModelTierSchema for all 3 tiers and rejects unknown values | 티어 3개 허용, 그 밖은 거부 | `ModelTierSchema` | 없음 |
| validates ChatModelSchema allows dynamic model identifiers and rejects empty strings | 모델 ID 허용, 빈 문자열 거부 | `ChatModelSchema` | 없음 |
| verifies Claude model constants and bidirectional mappings | 모델 상수와 티어↔모델 매핑 | `CLAUDE_MODELS`, `TIER_TO_MODEL`, `MODEL_TO_TIER` | 없음 |
| verifies sanitizeModelTier preserves historical models and defaults to sonnet for claude | 과거 모델 보존, Claude 기본 sonnet | `sanitizeModelTier` | 없음 |
| verifies formatModelDisplayName and getModelLabel masks raw IDs with clean 5.5 brand names | 원시 ID 대신 표시명 | `formatModelDisplayName`, `getModelLabel` | 없음 |
| validates TokenUsageMetaSchema with prompt caching fields | 캐시 토큰 필드 | `TokenUsageMetaSchema` | 없음 |
| validates ChatStreamRequestSchema with optional model and model_tier defaults | 스트림 요청 기본 모델·티어 | `ChatStreamRequestSchema` | 없음 |
| validates ChatDonePayloadSchema with model_tier and token usage meta | done payload | `ChatDonePayloadSchema` | 없음 |
| validates Claude v4.0 error codes in LlmErrorCodeSchema | Anthropic 오류 코드 | `LlmErrorCodeSchema` | 없음 |
| preserves model_tier and usage in chatMessageItemToUiMessage and uiMessageToChatMessageItem roundtrip | 변환 왕복에서 티어·usage 유지 | 변환 헬퍼 | 없음 |
| verifies UI component prop contracts compatibility | 컴포넌트 props 타입 객체 생성 | `ChatHeaderProps` 등 타입 | 없음 |
| handles POST /api/chat/stream with model_tier=haiku and verifies ~180ms latency & Haiku usage | haiku 응답의 지연·usage | `mocks/handlers/chat.ts` | MSW |
| handles POST /api/chat/stream with model_tier=opus and verifies ~1780ms latency & Opus usage | opus 응답 | 같음 | MSW |
| handles POST /api/chat/stream default model routing to Sonnet with ~642ms latency | 기본 sonnet 응답 | 같음 | MSW |
| handles POST /api/chat/stream 400 Bad Request on invalid model_tier | 잘못된 티어 400 | 같음 | MSW |
| handles POST /api/chat/stream 401 Anthropic API Key Missing trigger | 401 트리거 | 같음 | MSW |
| handles POST /api/chat/stream 429 Anthropic Rate Limit trigger | 429 트리거 | 같음 | MSW |
| handles POST /api/chat/stream 529 Anthropic Overloaded trigger | 529 트리거 | 같음 | MSW |
| handles POST /api/chat/query with model_tier=haiku and returns full DTO contract | haiku query 응답 형식 | 같음 | MSW |
| handles GET /api/chat/stream with searchParam model_tier=opus | GET 스트림의 opus 파라미터 | `mocks/handlers.ts` | MSW |
| handles POST /api/chat/stream with scope=scoped and source_id=102 returning customized LangGraph report | scoped 102 맞춤 응답 | `mocks/handlers/chat.ts` | MSW |
| returns dynamically filtered, keyword-matched sources for global chat stream (v0.2.2) | global 스트림 출처의 키워드 필터 | 같음 | MSW |

### 6.15 `frontend/src/tests/chat/ExportToolbar.test.tsx` (4) — 대상 `components/chat/ExportToolbar.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders copy markdown and download .md buttons only (FE-22: no fake Notion sync) | 툴바 버튼이 `마크다운 복사`·`.md 다운로드` 둘뿐이고 Notion 버튼·`Notion 연동` 문구가 없다 | ExportToolbar | `navigator.clipboard` mock |
| copies markdown content to clipboard and shows feedback | 마크다운 복사와 피드백 | ExportToolbar | `navigator.clipboard` mock |
| triggers .md file download with blob | Blob 으로 .md 다운로드 | ExportToolbar | `URL.createObjectURL` 교체 |
| disables buttons when isStreaming is true | 스트리밍 중 복사·다운로드 버튼 비활성 | ExportToolbar | 없음 |

### 6.16 `frontend/src/tests/chat/FocusBottomSheet.test.tsx` (9) — 대상 `components/chat/FocusBottomSheet.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| does not render when isOpen is false | 닫힘이면 렌더링 안 함 | FocusBottomSheet | 없음 |
| renders modal dialog with controls and a11y role when isOpen is true | 열림 시 dialog role 과 컨트롤 (`하네스 & 벤치마크`·`MCP & 생태계` 칩) | FocusBottomSheet | 없음 |
| displays guidance alert when targetCount is 0 | 대상 0건 안내 | FocusBottomSheet | 없음 |
| allows manipulating filters and calls onApplyFilters with updated values | 필터 조작(`MCP & 생태계` 칩 등) 후 onApplyFilters | FocusBottomSheet | 없음 |
| calls onResetFilters when 초기화 button is clicked | 초기화 버튼 | FocusBottomSheet | 없음 |
| closes on backdrop click and Escape key press | 배경 클릭·Escape 로 닫기 | FocusBottomSheet | 없음 |
| detects 100px swipe-down gesture and triggers onClose | 100px 아래 스와이프로 닫기 | FocusBottomSheet | 터치 이벤트 |
| does not display matching count badge or alert when targetCount is undefined (initial clean state) | 초기 상태에 개수 배지 없음 | FocusBottomSheet | 없음 |
| labels the category chips with 전체 소식 and the long category labels, in order (R40) | 카테고리 칩 글자 순서가 `전체 소식`, `하네스 & 벤치마크`, `MCP & 생태계`, `에이전트 아키텍처`, `최신 AI 동향` 이고, 예전 시트 전용 라벨 버튼이 없다 | FocusBottomSheet, `lib/labels.ts` | 없음 |

### 6.17 `frontend/src/tests/chat/FocusCapsule.test.tsx` (6) — 대상 `components/chat/FocusCapsule.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders default capsule [🎯 포커스: 전체 소식 ▾] with 30px minimal height and a11y attributes | 기본 캡슐 라벨 `포커스: 전체 소식`·높이·접근성 | FocusCapsule | 없음 |
| triggers onClick when default capsule is clicked | 클릭 시 onClick | FocusCapsule | 없음 |
| renders filtered capsule [🎯 포커스: MCP · 최근 7일 ✕] when filters are active | 필터 적용 라벨 | FocusCapsule | 없음 |
| triggers onReset and stops propagation when reset button ✕ is clicked | ✕ 클릭 시 onReset, 전파 중단 | FocusCapsule | 없음 |
| adapts to scoped mode when scopedSource is provided | scoped 출처 표시 | FocusCapsule | 없음 |
| does not display fake count badges and renders clean label in initial state | 초기 상태에 가짜 개수 없음 | FocusCapsule | 없음 |

### 6.18 `frontend/src/tests/chat/HandoverIntegration.test.tsx` (5) — 대상 `components/Header.tsx`, `NewsCard.tsx`, `NewsDetailModal.tsx`, `chat/HandoverCtaButton.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders AI 챗 link in Header navigation bar pointing to /chat | 헤더의 "AI 챗" 링크 href=/chat | Header | next/navigation mock(push), **로컬 요청** (`/api/schedule/status` 가 MSW 미처리로 bypass) |
| HandoverCtaButton navigates to /chat?sourceId={id} and stops click propagation | 카드 버튼(접근 이름 정확히 `AI 챗에서 분석`)이 `/chat?sourceId=101` 로 이동, 전파 중단 | HandoverCtaButton | next/navigation mock |
| HandoverCtaButton encodes draftQuestion into q query parameter | 배너 버튼(이름이 `AI 챗에서 분석` 으로 시작)이 질문을 q 파라미터로 인코딩 | HandoverCtaButton | next/navigation mock |
| NewsCard includes handover CTA button that does not trigger card selection | 카드 안 `AI 챗에서 분석` 버튼이 카드 선택을 일으키지 않는다 | NewsCard, HandoverCtaButton | next/navigation mock |
| NewsDetailModal includes handover button to transfer current question to dedicated chat | 상세 모달의 `AI 챗에서 분석` 배너 버튼으로 챗 이동 | NewsDetailModal | next/navigation mock |

### 6.19 `frontend/src/tests/chat/MobileViewport.test.tsx` (5) — 대상 `app/layout.tsx`, `components/chat/ChatPromptInput.tsx`, `ChatWorkspace.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| verifies layout viewport metadata allows user zoom and enables interactiveWidget resize | `viewport` 내보내기에 `maximumScale` 이 없고 `userScalable` 이 false 가 아니다 (확대 허용), `interactiveWidget: 'resizes-content'` | `app/layout.tsx` `viewport` | 없음 |
| ensures ChatPromptInput textarea has text-base (16px) to block iOS auto-zoom and horizontal scroll | textarea 16px 클래스 | ChatPromptInput | 없음 |
| ensures ChatPromptInput calls scrollIntoView on focus so keyboard does not obscure input | 포커스 시 scrollIntoView | ChatPromptInput | `vi.useFakeTimers` |
| ensures ChatWorkspace has overflow-x-hidden and max-w-full to prevent horizontal scrollbars | 가로 스크롤 방지 클래스 | ChatWorkspace | MSW (세션 목록 요청) |
| dynamically adapts ChatWorkspace height when visualViewport resizes due to virtual keyboard | visualViewport 크기에 맞춰 높이 변경 | ChatWorkspace | `window.visualViewport` 정의, MSW |

### 6.20 `frontend/src/tests/chat/WorkflowStepTracker.test.tsx` (6) — 대상 `components/chat/WorkflowStepTracker.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders real-time step animation, label, and progress during streaming | 스트리밍 중 단계 라벨·진행률 | WorkflowStepTracker | 없음 |
| renders evaluating_sufficiency, agentic_searching and synthesizing step states accurately | 각 단계 상태 표시 | WorkflowStepTracker | 없음 |
| automatically collapses into a 28px slim accordion when isDone is true | 완료 시 28px 아코디언으로 접힘 | WorkflowStepTracker | 없음 |
| toggles accordion details on click/tap | 클릭으로 상세 토글 | WorkflowStepTracker | 없음 |
| does not render when stepHistory is empty and currentStatus is null | 단계가 없으면 렌더링 안 함 | WorkflowStepTracker | 없음 |
| renders dedicated lucide-react icons and labels for ReAct steps (thinking, tool_calling, observing) | ReAct 단계 아이콘·라벨 | WorkflowStepTracker | 없음 |

### 6.21 `frontend/src/tests/CommandPalette.test.tsx` (10) — 대상 `components/CommandPalette.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders dialog and search input when isOpen is true | 열림 시 dialog 와 검색창 | CommandPalette | next/navigation mock |
| does not render when isOpen is false | 닫힘이면 렌더링 안 함 | CommandPalette | 같음 |
| renders 5 core actions in Idle state | 기본 상태 액션 5개 | CommandPalette | 같음 |
| filters actions when searching | 검색으로 액션 필터 | CommandPalette | 같음 |
| displays Empty State when no actions match search query | 일치 없음 상태 | CommandPalette | 같음 |
| navigates through items with ArrowDown and ArrowUp and executes with Enter | 화살표 이동, Enter 실행 | CommandPalette | 같음 |
| executes action callback and closes palette on action item click | 클릭 실행 후 닫기 | CommandPalette | 같음 |
| calls onClose when backdrop or close button is clicked | 배경·닫기 버튼으로 onClose | CommandPalette | 같음 |
| calls onClose when Escape key is pressed | Escape 로 onClose | CommandPalette | 같음 |
| 검색 입력 자리표시가 짧은 문구이고 ESC 안내를 담지 않는다 | `명령어 검색` combobox 의 자리표시가 `명령어 검색 또는 바로가기` 이고 `ESC` 를 담지 않는다 | CommandPalette | 같음 (`ThemeProvider` 로 감쌈) |

### 6.22 `frontend/src/tests/design/TokenContrast.test.ts` (57) — 대상 `app/globals.css`
`globals.css` 의 `:root`(라이트)·`.dark`(다크) 블록에서 `--al-*` 토큰 값을 읽어 WCAG 2.x 상대 휘도 공식으로 대비를 계산한다. 글자는 4.5:1, UI 경계(`border-strong`)와 포커스 링(`accent`)은 3:1 이상이어야 한다. 조합 하나가 테스트 하나다 (`it.each`).

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| computes known WCAG reference ratios | 계산식이 검정/흰색 21:1, 같은 색 1:1 을 낸다 | 파일 안 `contrastRatio` | 없음 (파일 읽기) |
| `{fg} on {bg} ≥ {n}:1` (테마마다 25개) | `fg`·`fg-muted`·`fg-subtle`, `border-strong`, `accent`, `on-accent`(`accent-solid`·`accent-solid-hover`·`danger-solid`·`danger-solid-hover` 위), `accent-soft-fg`, `success`·`warning`·`danger`(표면·`*-soft` 위)의 대비가 기준 이상이다 | `globals.css` `:root`, `.dark` | 같음 |
| `focus ring (accent) on {bg} ≥ 3:1` (테마마다 3개) | 포커스 링 색이 `canvas`, `surface`, `surface-muted` 위에서 3:1 이상이다 | 같음 | 같음 |

### 6.23 `frontend/src/tests/design/TokenGuard.test.ts` (5) — 대상 `frontend/src/**/*.tsx`, `app/globals.css`
화면 코드가 토큰 유틸리티만 쓰는지 소스 파일을 읽어 정규식으로 검사한다. 위반은 `파일:줄  일치` 목록으로 실패 메시지에 나온다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| finds the source files to scan | 검사할 `.tsx` 파일이 50개보다 많다 (경로 오류로 빈 검사가 되지 않게) | `frontend/src` 전체 | 없음 (파일 읽기) |
| has no hex color classes in .tsx files | 임의 hex 색 클래스(`-[#…]`)가 없다 | `.tsx` 전체 | 같음 |
| has no Tailwind palette color utilities in .tsx files | `bg-slate-100`, `text-blue-600` 같은 Tailwind 기본 팔레트 색 유틸리티(`white`, `black` 포함, 변형 접두사 포함)가 없다 | `.tsx` 전체 | 같음 |
| has no legacy tailwindcss-animate classes in .tsx files | `animate-in`, `zoom-in`, `slide-in-from` 클래스가 없다 | `.tsx` 전체 | 같음 |
| globals.css has no !important and no legacy html:not(.dark) / html.dark overrides | `globals.css` 에 `!important`, `html:not(.dark)`, `html.dark` 가 없다 | `app/globals.css` | 같음 |

### 6.24 `frontend/src/tests/feed/FeedInsights.test.ts` (7) — 대상 `lib/feed-insights.ts`
목록에서 같은 시사점 문장이 반복되는 기사를 고르는 순수 함수 `findRepeatedInsights` 를 기사 목록 fixture 로 부른다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| returns the ids of articles whose insight sentence appears twice | 같은 시사점이 두 번 나오는 기사 id 만 돌려준다 | findRepeatedInsights | 없음 |
| groups the backend "<tech> 기반 구현에서 " prefixed variant with the plain sentence | backend 가 앞에 `{기술} 기반 구현에서 ` 를 붙인 문장도 원래 문장과 같은 것으로 센다 (끝 40자 비교) | 같음 | 없음 |
| normalizes whitespace before comparing (runs of spaces, leading and trailing spaces) | 연속 공백·앞뒤 공백을 정리한 뒤 비교한다 | 같음 | 없음 |
| ignores sentences shorter than 20 characters after normalizing | 정리 뒤 20자 미만 문장은 반복으로 보지 않는다 | 같음 | 없음 |
| excludes sentences that appear only once | 한 번만 나오는 문장은 빠진다 | 같음 | 없음 |
| excludes empty and null insights | 빈 문자열·null 시사점은 빠진다 | 같음 | 없음 |
| returns an empty set for an empty list | 빈 목록이면 빈 집합 | 같음 | 없음 |

### 6.25 `frontend/src/tests/feed/FeedStatusBar.test.tsx` (6) — 대상 `components/feed/FeedStatusBar.tsx`, `ui/Select.tsx`
목록 머리줄(상태 + 정렬)만 그린다. 마지막 테스트는 `window.matchMedia` 를 지정한 폭으로 답하는 mock(`mockViewport`)으로 바꾸고 `afterEach` 에서 되돌린다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| offers four sort options in a labelled select and calls back on change | `정렬` 이름의 select 에 선택지 4개(`hot` 인기순, `quality` 품질순, `latest` 최신순, `top` 추천순, 값·글자 순서대로). `latest` 로 바꾸면 `onSortChange('latest')`·`onPageChange(1)` | FeedStatusBar, Select | 없음 |
| places sort inside [data-feed-list-header], outside the status live region and after it | `[data-feed-list-header]` 가 상태(`role="status"`)와 정렬을 담고, 정렬은 상태 밖이며 상태 뒤(DOM)다 | FeedStatusBar | 없음 |
| keeps the status as a polite live region with the page text | 상태가 `aria-live="polite"`·`data-feed-status` 이고 `페이지 2 / 5` 를 담는다 | FeedStatusBar | 없음 |
| lays out the header as one non-wrapping row: status min-w-0 flex-1, sort w-28 shrink-0 xl:w-32 | 머리줄이 `flex`·`items-start` 이고 `flex-wrap` 이 아니다. 상태가 `min-w-0 flex-1`, 정렬 감싸개가 `w-28 shrink-0 xl:w-32` | FeedStatusBar | 없음 |
| keeps sort on the first line when the status wraps: header items-start, status min-h matches the select (44 / md 36) | 필터·Must-Read 배지가 붙은 상태에서도 머리줄이 `items-start`(`items-center` 아님)라 정렬이 첫 줄 오른쪽에 남는다. 상태가 `min-h-11 md:min-h-9 items-center`, 정렬 select 가 `h-11 md:h-9` 라 한 줄일 때 세로 가운데가 같다 | FeedStatusBar, Select | 없음 |
| keeps the same sort node across widths (360 → 1440) | 폭 mock 360 → 1440 으로 다시 그려도 정렬이 같은 노드다 | FeedStatusBar | `matchMedia` 폭 mock |

### 6.26 `frontend/src/tests/feed/FeedToolbar.test.tsx` (26) — 대상 `components/feed/FeedToolbar.tsx`
768px 미만 넘침 표시 블록은 `window.matchMedia` 를 폭 360px 로 답하는 mock 으로 바꾸고, 스크롤 줄의 `scrollWidth`(600)·`clientWidth`(300)를 `HTMLElement.prototype` 에 정의해 넘침을 흉내 낸 뒤 `afterEach` 에서 되돌린다 (양쪽 표시 테스트는 그 테스트 안에서만 `scrollLeft` 저장 mock 을 두고 `finally` 에서 지운다). 한 트리 블록(①~⑤)은 자기 도우미를 쓴다: `mockViewport(width)`(`matchMedia` 를 `min-width`·`max-width`·복합 질의에 그 폭으로 답하게 교체), 스크롤 줄 `scrollWidth` 600·`clientWidth` 300·`scrollLeft` 저장(WeakMap) mock, `getBoundingClientRect` mock. `afterEach` 에서 모두 되돌린다. ③·④ 와 ⑤ 의 배치 테스트는 `it.each([360, 1024, 1440])` 라 각 3개다. 정렬은 이 컴포넌트에 없다 (`FeedStatusBar.test.tsx`).

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders category chips with aria-pressed and counts | `카테고리` 그룹의 칩이 `aria-pressed` 와 건수를 가진다 (`전체 소식` 은 합계) | FeedToolbar, Chip | 없음 |
| selecting a category resets source to all and page to 1 | 카테고리를 고르면 소스 `all`, 1페이지로 콜백 | FeedToolbar | 없음 |
| shows the Must-Read toggle outside the source group at the end of the source row, and toggles it | `Must-Read` 버튼이 `aria-pressed="false"` 이고 `소스` 그룹 안에 없으며, 소스 그룹과 같은 `[data-toolbar-row]` 의 마지막 자식이고 소스 그룹 뒤(DOM 순서)다. `정렬` combobox 는 없다. 소스 그룹 칩 글자는 `전체7`·`GitHub5`·`arXiv2`·`북마크2`(건수가 있는 소스만)이고, 토글을 누르면 `onHighSignalChange(true)`·`onPageChange(1)` | FeedToolbar | 없음 |
| selecting a source calls back with page 1 | 소스·북마크 칩 선택 시 1페이지로 콜백 | FeedToolbar | 없음 |
| submits and clears the keyword search | `키워드 검색` searchbox 제출과 `검색어 지우기` | FeedToolbar, SearchField | 없음 |
| uses the short placeholder 키워드 검색 | 검색창 자리표시가 `키워드 검색` 이다 | FeedToolbar | 없음 |
| lays out rows as separate flex rows with the category and source groups on different rows | `[data-feed-toolbar]` 안에 `[data-toolbar-row]` 줄이 2개 이상이고 `카테고리`·`소스` 그룹이 서로 다른 줄에 있으며 툴바가 `grid` 가 아니다 | FeedToolbar | 없음 |
| hides category chip icons below xl | `카테고리` 칩 아이콘 5개(`[data-chip-icon]`)가 `max-xl:hidden` | FeedToolbar, Chip | 없음 |
| bleeds the source row to the left edge only and keeps Must-Read on the same row below 768px (R35 보정 9) | 넘치지 않는 `소스` 줄은 768px 미만에서 왼쪽만 화면 끝까지 늘어나고(`max-md:-ml-4`·`max-md:pl-4`, `max-md:-mx-4`·`max-md:-mr-4` 없음) 스냅 여백 `scroll-px-6` 이 있다. 줄 B(`[data-toolbar-row]`)가 `max-md:flex-wrap` 아님, 소스 그룹을 담은 직접 자식이 `max-md:basis-full` 아님, `Must-Read` 토글이 `max-md:ml-auto` 아님. `[data-feed-toolbar]` 안에 combobox 가 없다 | FeedToolbar, ChipGroup | 없음 |
| keeps the 768px+ row B unchanged: no unprefixed flex-wrap, basis-full or ml-auto (R35) | 줄 B 에 `flex-wrap`·`md:flex-wrap`, 소스 감싸개에 `basis-full`·`md:basis-full`, 토글에 `ml-auto`·`md:ml-auto` 가 없어 768px 이상 배치가 그대로다 | FeedToolbar | 없음 |
| has exactly one decorative hint in the source row, outside the group and before the Must-Read toggle | 360px 에서 `소스` 줄이 끝 쪽으로 넘치면(`data-overflow="end"`) 토글을 담은 툴바 줄에 장식 넘침 표시(`data-overflow-hint`, `aria-hidden`)가 정확히 하나 있고, 그룹 밖·`Must-Read` 토글 앞에 있다. 소스 줄 자체 표시(`.group/source`)는 없다 | FeedToolbar, ScrollRow | `matchMedia` 폭 360 mock, `scrollWidth`/`clientWidth` 정의 |
| shows hints on both sides of the source row when it overflows both ways (start before the group, end before the Must-Read toggle) | 360px 에서 `소스` 줄 `scrollLeft` 를 150 으로 옮겨 `data-overflow="both"` 가 되면 같은 `[data-toolbar-row]` 안에 `data-overflow-hint="start"`·`"end"` 가 하나씩 있고 둘 다 `aria-hidden`·그룹 밖이며, 순서가 `start` 표시 → `소스` 그룹 → `end` 표시 → `Must-Read` 토글이다. `start` 표시는 `max-md:-ml-4`(화면 끝 여백을 씀), `end` 표시는 `max-md:-mr-4` 가 아니다(토글 앞이라 화면 끝 여백을 쓰지 않음) | FeedToolbar, ScrollRow | 위와 같음 + 이 테스트 안 `scrollLeft` 저장 mock |
| ① reveals the selected source chip, not Must-Read, and does not move when only Must-Read toggles | `highSignalOnly` + `source='github'` 에서 줄 오른쪽 밖의 `GitHub` 칩이 보이게 처음부터 소스 줄 `scrollLeft` 가 0 보다 크고, `highSignalOnly` 만 false 로 바꿔 다시 그려도 `scrollLeft` 가 그대로다 (소스 줄 선택 칩은 `data-source-chip` 칩만) | FeedToolbar, ChipGroup `selectedSelector`, ScrollRow | 한 트리 블록 도우미 |
| ② keeps the same search input, focus, value and chip rows across widths (360 → 1024 → 1440) | 폭 mock 을 360 → 1024 → 1440 으로 바꿔 다시 그려도 검색 입력·`카테고리`·`소스` 그룹이 처음과 같은 노드이고, 검색 입력이 포커스(`document.activeElement`)와 값 `MCP` 를 유지한다 | FeedToolbar | 같음 |
| ③ orders controls 검색 → 카테고리 → 소스 → Must-Read in the DOM at %ipx (360, 1024, 1440) | 세 폭 모두 DOM 순서가 검색 입력 → `카테고리` 그룹 → `소스` 그룹 → `Must-Read` 토글이다 | FeedToolbar | 같음 |
| ⑤ places the fixed Must-Read toggle after the source group and before sort at %ipx (R34) (360, 1024, 1440) | 세 폭 모두 `Must-Read` 토글이 `소스` 그룹 뒤이고 그 줄(`[data-toolbar-row]`)의 마지막 자식이며 그룹 안에 없다 (이름의 'before sort' 는 단언하지 않는다. 정렬은 이 컴포넌트에 없다). 토글에 `data-must-read-toggle`, 클래스 `shrink-0`·`max-md:w-11`, 글자 감싸개 `max-md:sr-only` 가 있고, 소스 그룹 안에 구분선(`aria-hidden` 이고 `w-px`)이 없다 | FeedToolbar | 같음 |
| ⑤ keeps the same Must-Read node and name across widths and reflects highSignalOnly (R34·R33) | `highSignalOnly: true` 로 폭 mock 360 → 1440 을 바꿔 다시 그려도 접근 이름 `Must-Read` 인 같은 노드이고 `aria-pressed="true"` 다 | FeedToolbar | 같음 |
| ④ puts search in its own area above the filter rows and Must-Read in the source row at %ipx (360, 1024, 1440) | 세 폭 모두 `카테고리`·`소스` 그룹이 서로 다른 `[data-toolbar-row]` 에 있고, 검색 입력은 어느 줄에도 없이 `[data-feed-search]` 안이며 그 영역이 `[data-feed-toolbar]` 밖·앞(DOM)이다. `Must-Read` 토글은 `소스` 줄에 있다 | FeedToolbar | 같음 |
| puts the search field in its own [data-feed-search] area with full width | `[data-feed-search]` 가 `scroll-mt-20` 이고, 그 안 `search` 폼이 `w-full` 이며 `md:w-48`·`xl:w-72` 가 없다 | FeedToolbar, SearchField | 없음 |
| has no searchbox or combobox inside the filter area [data-feed-toolbar] | `[data-feed-toolbar]` 안에 `searchbox`·`combobox` 가 없다 | FeedToolbar | 없음 |

### 6.27 `frontend/src/tests/feed/InsightsBar.test.tsx` (10) — 대상 `components/feed/InsightsBar.tsx`, `TrendRadarPanel.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders nothing when there is neither a briefing nor radar data | 브리핑·레이더가 모두 없으면 아무것도 그리지 않는다 | InsightsBar | 없음 |
| shows a skeleton while the radar is loading | 레이더 로딩 중 스켈레톤 | InsightsBar | 없음 |
| has no briefing button when there is no briefing | 브리핑이 없으면 브리핑 버튼 없이 `트렌드` 버튼만 | InsightsBar | 없음 |
| opens the briefing from the briefing button | `오늘의 브리핑 · {date} · {headline}` 버튼이 onOpenBriefing 을 부른다 | InsightsBar | 없음 |
| toggles the trend radar panel with aria-expanded / aria-controls | `트렌드` 버튼의 `aria-expanded`·`aria-controls` 와 `트렌드 레이더` 영역 열고 닫기 | InsightsBar, TrendRadarPanel | 없음 |
| selects a tag from the radar panel and clears it | 패널의 태그 선택과 `필터 초기화` | TrendRadarPanel | 없음 |
| marks the outer element and hides the briefing date below md | 바깥 요소에 `data-insights-bar`, 브리핑 날짜는 `max-md:hidden` | InsightsBar | 없음 |
| shows surging chips only from lg (hidden lg:flex) | `급상승` 칩 묶음이 `hidden lg:flex` (768~1023px 에서 숨김) | InsightsBar | 없음 |
| keeps showing the buttons without a skeleton while re-reading when data exists | 데이터가 있으면 `loadingRadar` 중에도 스켈레톤 대신 `트렌드`·브리핑 버튼을 그대로 보인다 | InsightsBar | 없음 |
| lays out category shares in one column on narrow screens and keeps the full name accessible | 레이더 `카테고리 분포` 목록이 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` 이고, 항목마다 이름 전체가 `title` 에 있다 | TrendRadarPanel | 없음 |

### 6.28 `frontend/src/tests/feed/TrendRadarPanel.test.tsx` (2) — 대상 `components/feed/TrendRadarPanel.tsx`, `lib/labels.ts`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| shows Korean radar category labels and no English names in text or title | 레이더 `카테고리 분포` 가 응답의 영문 이름 대신 한국어 라벨(`하네스 & 벤치마크`, `프로토콜 & 도구`, `모델 & 추론`, `인프라 & 런타임`)을 글자와 `title` 에 쓴다 | TrendRadarPanel, `radarCategoryLabel` | 없음 |
| keeps an unknown radar category name as is | 모르는 카테고리 이름(`Other Stuff`)은 그대로 보인다 | 같음 | 없음 |

### 6.29 `frontend/src/tests/Header.test.tsx` (13) — 대상 `components/Header.tsx`, `ResetConfirmDialog.tsx`, `hooks/useCollector.ts`
공통 mock: `vi.mock('@/lib/api')` 로 `fetchScheduleStatus`(다음 수집 192분 뒤), `triggerManualCollect`, `fetchCrawlProgress`, `resetAndRecollect` 를 바꾼다. `ThemeProvider defaultTheme="light"` 로 감싼다. 폭은 setup.ts 의 1280px mock 이고, 모바일 테스트만 768px 미만으로 답하는 mock 을 쓴다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| shows v{version} when the build provides a version | 빌드가 넣은 `NEXT_PUBLIC_APP_VERSION`(`9.8.7`)이 `v9.8.7` 배지로 보인다 | Header | 공통 + `vi.stubEnv` |
| renders no version badge when the version is missing | 버전 값이 비면 배지가 없고 `AgentLens` 링크는 남는다 | Header | 공통 + `vi.stubEnv` |
| renders exactly one AI 챗 link pointing to /chat inside the main nav | `주 메뉴` 내비 안에 `AI 챗` 링크가 하나, href `/chat` | Header | 공통 |
| shows the next collection time on the schedule button and opens the schedule | `수집 스케줄 · 다음 수집 3h 12m 후` 버튼이 onOpenSchedule 을 부른다 | Header, useCollector | 공통 |
| lists the desktop more-menu items and calls each callback | 데스크톱 `더보기` 메뉴가 `소스 & 리서처`, `공유 & 알림`, `MCP 연동`, `RSS 피드`(새 탭 `/api/news/feed/rss.xml`), `초기화 & 재수집…` 순서이고 각 콜백을 부른다. 테마·수집 스케줄 항목은 없다 | Header, MenuButton | 공통 |
| opens the reset confirmation dialog from the more menu | `수집 데이터 전체 삭제 및 재수집` alertdialog, 처음 포커스 `취소`, `전체 삭제 후 다시 수집` 으로 resetAndRecollect 후 닫힘 | Header, ResetConfirmDialog | 공통 |
| shows the reset error inside the dialog instead of alert() | 초기화 실패 문구가 대화상자 안 `alert` 로 나오고 `window.alert` 를 부르지 않는다 | ResetConfirmDialog | 공통 + `resetAndRecollect` 거부, `window.alert` spy |
| adds schedule, collect and theme items to the more menu on mobile | 모바일 더보기 메뉴에 `수집 스케줄 (다음 3h 12m 후)`, `즉시 수집`, 테마 라디오 3개(`라이트`·`다크`·`시스템`)가 붙고 마지막은 `초기화 & 재수집…` | Header | 공통 + 폭 768 미만 `matchMedia` mock |
| toggles the command palette with Cmd+K / Ctrl+K | ⌘K·Ctrl+K 로 `커맨드 팔레트` 열고 닫기 | Header, useHotkey | 공통 |
| adds schedule, settings, RSS and reset commands to the palette | `커맨드 팔레트 열기` 버튼으로 연 팔레트의 명령이 9개이고 `C` 표시가 없으며, 스케줄·초기화 명령이 각 동작을 연다 | Header, CommandPalette | 공통 |
| disables the palette reset command while collecting | 수집 중에는 팔레트의 `수집 데이터 초기화 & 재수집` 이 `aria-disabled="true"` 이고 눌러도 확인 창이 열리지 않는다 | Header, CommandPalette, useCollector | 공통 |
| shows 수집 중 and the progress line on mount when a collection is already running | 마운트 때 스케줄 상태가 `is_running` 이면 `수집 중`(비활성) 버튼과 진행 줄 `실시간 소식 수집 중...` 을 보이고, 눌러도 수집 요청을 보내지 않는다 | Header, useCollector, `CollectorStatusLine` | 공통 + `fetchScheduleStatus` 가 `is_running: true` |
| ignores a progress response from a previous run after a new run starts | 즉시 수집 뒤 초기화로 새 회차가 시작되면, 늦게 도착한 이전 회차의 진행 응답(끝남)은 진행 줄에 반영되지 않는다 | useCollector, `CollectorStatusLine` | 공통 + `fetchCrawlProgress` 지연 응답 |

### 6.30 `frontend/src/tests/hooks/useCollector.test.ts` (6) — 대상 `hooks/useCollector.ts`
공통 mock: MSW `server.use` 로 `GET */api/schedule/status`, `GET */api/schedule/progress`, `POST */api/schedule/trigger`, `POST */api/schedule/reset-and-collect` 응답을 정하고 호출 수를 센다. 모듈 저장소가 테스트 사이에 남지 않도록 매 테스트 `vi.resetModules()` 뒤 동적 import 한다. 진행 폴링·스케줄 갱신의 `setInterval` 만 가짜 타이머다. 오래된 응답 테스트(①②)는 도우미 `deferred()` 로 MSW 핸들러 안에서 상태 응답을 붙잡아 응답 순서를 정하고, `settle()` 로 실제 `setTimeout` 만큼 기다려 응답 처리를 끝낸다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| (a) restores collecting and progress polling when the schedule status says is_running | 스케줄 상태가 `is_running` 이면 마운트 때 수집 중 상태와 진행 폴링을 되살린다 | useCollector | 공통 |
| (a) does not start progress polling when the schedule status is idle | 수집 중이 아니면 진행 폴링을 시작하지 않는다 | useCollector | 공통 |
| (b) joins the running collection with the response message when the trigger says already_running | 수동 수집 응답이 `already_running` 이면 그 메시지로 진행 중인 수집에 합류하고(폴링 시작), 다시 눌러도 요청하지 않는다 | useCollector | 공통 |
| (c) rejects with the response message when the reset says already_running | 초기화 응답이 `already_running` 이면 그 메시지로 거부하고 `삭제 완료` 안내를 보이지 않는다 | useCollector | 공통 |
| ① ignores a late is_running status response sent before the progress polling finished | 마운트 상태 `is_running: true` 로 폴링이 붙은 뒤 30초 재조회 응답(`is_running: true`)을 붙잡아 둔 채 진행 응답이 `is_running: false` 로 끝나 `수집 완료 (+2건 신규 반영)` 이 뜨고 완료 뒤 재조회가 반영되면, 붙잡은 응답을 풀어도 `isCollecting`·`status.is_running` 이 false 이고 `PROGRESS_POLL_MS` ×4 가 지나도 진행 요청 수가 그대로이며, 완료 문구로 바뀐 횟수가 1 이다 | useCollector | 공통 + `deferred()` |
| ② keeps the newer status when an older status response arrives after it | 먼저 보낸 상태 요청 A(붙잡음)와 나중 요청 B(바로 응답) 가운데 B 가 반영된 뒤 A 가 도착해도 `status.minutes_until_next_run` 이 B 값(10), `timeLeft` 가 `10m` 그대로다 | useCollector | 같음 |

### 6.31 `frontend/src/tests/hooks/useNewsFeed.test.tsx` (6) — 대상 `hooks/useNewsFeed.ts`
공통 mock: MSW 기본 핸들러(`mockNewsItems`, `mockDailyBriefing`)에 `server.use` 로 `GET */api/trends/radar` 를 더하고, 테스트마다 `GET */api/news`·`*/api/stats`·`*/api/briefing/today` 를 지연·실패로 바꾼다. `renderHook` 으로 훅만 돌린다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| (a) keeps the previous items without loading while the same list key is re-read | 같은 목록 조건을 다시 읽는 동안 이전 기사를 유지하고 `loading` 이 되지 않는다 | useNewsFeed | 공통 |
| (b) applies briefing and radar even when the stats request fails | 통계 요청이 실패해도 브리핑·레이더는 반영한다 | useNewsFeed | 공통 + `*/api/stats` 500 |
| (c) keeps loadingRadar false and the previous briefing while stats are re-read | 통계를 다시 읽는 동안 `loadingRadar` 는 false 이고 이전 브리핑을 유지한다 | useNewsFeed | 공통 + 지연 응답 |
| (d) shows loading again when the list key changes | 목록 조건이 바뀌면 다시 `loading` 이다 | useNewsFeed | 공통 |
| (e) a failed re-read keeps the list and returns a reload failure signal instead of an error | 같은 조건 다시 읽기가 실패하면 목록을 유지하고 오류 대신 다시 읽기 실패 신호를 준다 | useNewsFeed | 공통 + `*/api/news` 500 |
| (e) a failed request for a changed list key is still an error (ErrorState) | 바뀐 조건의 요청이 실패하면 여전히 오류(ErrorState)다 | useNewsFeed | 공통 + `*/api/news` 500 |

### 6.32 `frontend/src/tests/HotkeyGating.test.tsx` (7) — 대상 `components/HotkeyListener.tsx`, `lib/overlay-stack.ts`
홈 화면처럼 `useOverlayOpen()` 값을 `blockSingleKeys` 로 넘기는 시험용 컴포넌트에 `Dialog` 를 함께 그린다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| ignores j/k/b/c/t while an overlay is open | 대화상자가 열려 있으면 단일 키가 동작하지 않는다 | HotkeyListener, overlay-stack | 없음 |
| handles j/k again when no overlay is open | 대화상자가 닫히면 j/k 가 다시 동작한다 | 같음 | 없음 |
| blockSingleKeys prop blocks single keys on its own | `blockSingleKeys` 만으로 단일 키를 막는다 | HotkeyListener | 없음 |
| does not preventDefault Enter/Space when a button has focus | 버튼에 포커스가 있으면 Enter/Space 를 가로채지 않는다 | HotkeyListener | 없음 |
| opens the focused card on Enter only when the target is document.body | 대상이 `document.body` 일 때만 Enter 로 onOpenDetailModal | HotkeyListener | 없음 |
| matches letter keys by e.code when a Korean layout is active | 한글 자판(`e.key` 가 한글)이어도 `e.code` 로 글자 키를 판정한다 | HotkeyListener | 없음 |
| ignores keys during IME composition reported as keyCode 229 | `keyCode 229` 조합 중 키를 무시한다 | HotkeyListener | 없음 |

### 6.33 `frontend/src/tests/HotkeyListener.test.tsx` (8) — 대상 `components/HotkeyListener.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| triggers onNavigateFeed when j or k key is pressed | j/k 로 피드 이동 | HotkeyListener | 없음 |
| triggers onFocusSearch and prevents default when / key is pressed | / 로 검색 포커스, 기본 동작 막음 | HotkeyListener | `preventDefault` spy |
| triggers onToggleBookmark on b key and onHandoverChat on c key | b 북마크, c 챗 이동 | HotkeyListener | 없음 |
| triggers onToggleTheme on t key | t 로 테마 전환 | HotkeyListener | 없음 |
| triggers onCloseOverlays on Escape key | Escape 로 오버레이 닫기 | HotkeyListener | 없음 |
| triggers onToggleCommandPalette on Cmd+K or Ctrl+K and prevents default | Cmd/Ctrl+K 로 팔레트, 기본 동작 막음 | HotkeyListener | `preventDefault` spy |
| enforces Input Isolation Rule: ignores single-key shortcuts when typing in an input element | 입력창 안에서는 단일 키 단축키 무시 | HotkeyListener | 없음 |
| ignores hotkeys during IME composition (isComposing = true) | IME 조합 중 무시 | HotkeyListener | 없음 |

### 6.34 `frontend/src/tests/modals/BriefingSettingsModal.test.tsx` (7) — 대상 `components/BriefingSettingsModal.tsx`
공통 mock: MSW `server.use` 로 `GET */api/briefing/settings` 응답을 정한다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| is a modal dialog with a linked title | `공유 & 알림 설정` 제목이 연결된 modal dialog | BriefingSettingsModal, Dialog | 공통 |
| has three tabs and switches panels | 탭 `Notion 연동`, `이메일 (SMTP)`, `웹훅 (Slack/Discord)` 전환과 `STARTTLS 암호화 사용` 스위치 | BriefingSettingsModal, Tabs, Switch | 공통 |
| toggles secret visibility with an icon button | `토큰 보기`/`토큰 숨기기` 아이콘 버튼으로 비밀값 표시 전환 (`aria-pressed`) | BriefingSettingsModal, TextField | 공통 |
| has footer actions 연결 테스트 / 저장 / 닫기 | 바닥 버튼 `연결 테스트`, `저장`, `닫기` | BriefingSettingsModal | 공통 |
| shows the save result in an inline alert | `저장` 결과 문구가 `status` 영역에 나온다 | BriefingSettingsModal, InlineAlert | 공통 + MSW `POST */api/briefing/settings` |
| does not close on a backdrop click but closes on Escape | 배경 클릭으로는 닫히지 않고 Escape 로 닫힌다 (`dismissOnScrim={false}`) | BriefingSettingsModal, Dialog | 공통 |
| renders nothing when closed | 닫힘이면 렌더링 안 함 | BriefingSettingsModal | 없음 |

### 6.35 `frontend/src/tests/modals/DailyBriefingModal.test.tsx` (6) — 대상 `components/DailyBriefingModal.tsx`
뒤의 다섯 테스트는 MSW 기본 브리핑 응답(`fetchDailyBriefing`)을 읽어(필요하면 `overview` 를 바꿔) `onOpenSettings` 와 함께 그린다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| points 이메일 발송 at the email form only while the form is open | `이메일 발송` 버튼은 닫혀 있을 때 `aria-expanded="false"` 이고 `aria-controls` 가 없다. 누르면 `aria-expanded="true"` 와 문서에 있는 주소 입력 줄을 가리키는 `aria-controls`, 다시 누르면 둘 다 처음대로 | DailyBriefingModal | MSW `GET */api/briefing/today` (기본 핸들러) |
| has exactly one 연동 설정 button and no 연동 설정 item in the 브리핑 작업 menu | 대화상자 안 이름에 `연동 설정` 이 든 버튼이 정확히 1개이고 누르면 `onOpenSettings` 1번. `브리핑 작업` 메뉴에는 항목이 있지만 `연동 설정` 항목은 없다 | DailyBriefingModal, Menu | 같음 |
| shows the headline exactly once | 헤드라인 글자가 화면에 정확히 1번(`getAllByText(headline)` 길이 1) | DailyBriefingModal, Dialog | 같음 |
| labels category headers with the long category labels and lucide icons instead of backend names and emoji | `카테고리별 요약` 패널의 `h3` 가 `MCP & 생태계`·`에이전트 아키텍처` 이고 각각 `svg` 아이콘이 있으며 글자에 그림 문자가 없다. backend 이름 `MCP & 플러그인 생태계` 는 패널에 없다 | DailyBriefingModal, `lib/labels.ts`, `FEED_CATEGORIES` | 같음 |
| replaces backend category names in overview lines with the long labels | 개요 `• **MCP & 플러그인 생태계**: …` 는 `MCP & 생태계:` 로, 분야 표에 없는 `모르는 분야:` 는 그대로 그린다 | DailyBriefingModal | 같음 (응답의 `overview` 를 바꿈) |
| marks the 시사점 line with an aria-hidden svg icon and the plain 시사점: text | 시사점 라벨마다 글자가 정확히 `시사점:` 이고 그 문단에 `svg[aria-hidden="true"]` 가 있다 | DailyBriefingModal | 같음 |

### 6.36 `frontend/src/tests/modals/DeepResearcherTab.test.tsx` (5) — 대상 `components/sources/DeepResearcherTab.tsx`
`researchStatus={null}`, 빈 감사 일지로 탭만 그린다. 네 지표는 `it.each` 하나로 돈다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| 정기 스케줄 값 상자가 말줄임 없이 줄을 바꾼다 | `정기 스케줄` 값 `매일 03:00, 15:00 UTC` 상자에 `truncate`·`whitespace-nowrap`·`text-ellipsis` 가 없고 `break-words` 가 있다 | DeepResearcherTab `Metric` | 없음 |
| `%s 값 상자가 말줄임 없이 줄을 바꾼다` (지표 4개) | `자동 채택된 소스`, `자동 채택 기준`, `최근 리서치 일시`, `정기 스케줄` 값 상자 모두 같은 단언 | 같음 | 없음 |

### 6.37 `frontend/src/tests/modals/NewsDetailModal.test.tsx` (10) — 대상 `components/NewsDetailModal.tsx`, `news-detail/AskAiPanel.tsx`
공통 mock: 파일 자체 `vi.mock('next/navigation')`, 기사는 `mocks/handlers.ts` 의 `mockNewsItems`.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| is a modal dialog labelled by the article title | 기사 제목이 대화상자 이름이다 | NewsDetailModal, Dialog | 공통 |
| shows the summary tab first with Korean section headings | 첫 탭 `AI 요약 & 시사점`, 절 제목 `개발자 시사점`·`핵심 요약 3줄`·`기술 스택`·`상세 본문 요약`, 이름이 `AI 챗에서 분석` 으로 시작하는 배너 버튼 하나 | NewsDetailModal, Tabs | 공통 |
| switches tabs with click and arrow keys | 클릭·화살표 키로 이름이 `AI 질의응답` 으로 시작하는 탭 전환, `질문 입력` 입력창 | NewsDetailModal, Tabs, AskAiPanel | 공통 |
| opens a ConfirmDialog for 대화 초기화 without window.confirm, and clears on confirm | 빠른 질문 `핵심 원리 및 구조` 로 대화 하나를 만들면 탭에 건수 `1` 이 붙고, `대화 초기화` 가 `window.confirm` 대신 alertdialog 를 열고(처음 포커스 `취소`) `초기화` 로 대화를 비운다 | NewsDetailModal, ConfirmDialog | 공통 + MSW `POST */api/news/:news_id/ask/stream`, `window.confirm` spy (불리지 않음을 단언) |
| closes with Escape and resets to the summary tab when reopened | Escape 로 닫고 다시 열면 요약 탭 | NewsDetailModal | 공통 |
| closes with the 닫기 button and the backdrop | `닫기` 버튼·배경 클릭으로 닫기 | NewsDetailModal, Dialog | 공통 |
| shows the source label and the original link in the footer | 바닥에 출처 라벨과 `원문 링크 방문` 링크 | NewsDetailModal, `lib/labels.ts` | 공통 |
| Escape in the Ask AI question input keeps the dialog, the text and moves focus to the Ask AI panel; the next Escape closes | `AI 질의응답` 탭 `질문 입력` 에서 Escape 를 누르면 대화상자와 입력 글자가 남고 포커스가 그 탭 패널로 가며, 다음 Escape 에 닫힌다 | NewsDetailModal, AskAiPanel, overlay-stack | 공통 |
| Escape during IME composition in the question input does nothing | IME 조합 중 Escape 는 아무 일도 하지 않는다 (포커스도 입력창에 남음) | 같음 | 공통 |
| shows 복사 실패 on the answer for 2 seconds when copying fails | 답변 복사가 실패하면 `답변 복사` 버튼이 2초 동안 `복사 실패` 를 보이고 `aria-live="polite"` 영역이 읽는다 | NewsDetailModal, AskAiPanel, useCopyToClipboard | 공통 + MSW 질문 스트림, `navigator.clipboard.writeText` 거부·`execCommand` false |

### 6.38 `frontend/src/tests/modals/ScheduleModal.test.tsx` (5) — 대상 `components/ScheduleModal.tsx`
공통 mock: `vi.mock('@/lib/api')` 로 `fetchScheduleStatus`, `triggerManualCollect`, `fetchCrawlProgress`, `resetAndRecollect` 를 바꾼다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders nothing when closed | 닫힘이면 렌더링 안 함 | ScheduleModal | 공통 |
| is a labelled modal dialog with the schedule and next run | `자동 수집 스케줄` 대화상자에 수집 주기와 다음 예정 | ScheduleModal | 공통 |
| closes with the header close button and Escape | `닫기` 버튼과 Escape 로 onClose | ScheduleModal, Dialog | 공통 |
| triggers a manual collection from the footer button | 바닥 `즉시 수집` 이 triggerManualCollect 를 부른다 | ScheduleModal, useCollector | 공통 |
| opens the reset confirmation from the danger zone and Escape closes only the confirmation | `위험 영역` 의 `초기화 & 재수집…` 이 확인 창을 열고, Escape 한 번은 확인 창만 닫는다 | ScheduleModal, ResetConfirmDialog, overlay-stack | 공통 |

### 6.39 `frontend/src/tests/modals/SourcesModal.test.tsx` (8) — 대상 `components/SourcesModal.tsx`, `sources/SourcesListTab.tsx`
공통 mock: MSW `server.use` 로 `GET */api/research/status`, `GET */api/research/audit-logs`, `DELETE */api/sources/:type/:id`(호출 기록)를 정한다. 소스 목록은 기본 MSW `GET */api/sources`. `window.confirm` spy 는 불리지 않음을 단언하는 데 쓴다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| is a modal dialog whose first tab is selected by default | `소스 & 리서처` 대화상자, 첫 탭 `AI 딥 리서처` 선택 | SourcesModal, Tabs | 공통 |
| lists sources from MSW with a switch and a delete button per source | 소스마다 `{이름} 수집 켜기` 스위치와 `{이름} 삭제` 버튼 | SourcesListTab, Switch | 공통 |
| opens a ConfirmDialog on delete and sends no request when cancelled | 삭제가 `이 소스를 목록에서 삭제하시겠습니까?` alertdialog 를 열고(처음 포커스 `취소`) 취소하면 요청이 없다 | SourcesListTab, ConfirmDialog | 공통 |
| Escape closes only the confirm dialog | Escape 한 번은 확인 창만 닫고 소스 대화상자는 남는다 | 같음, overlay-stack | 공통 |
| deletes after confirming and shows the result in the live region | `삭제` 확인 후 `DELETE rss/geeknews` 요청과 결과 안내 | SourcesListTab | 공통 |
| does not close on a backdrop click but closes on Escape and the footer button | 배경 클릭으로는 닫히지 않고 Escape·바닥 `닫기` 로 닫힌다 | SourcesModal, Dialog | 공통 |
| points 새 피드 직접 등록 at the form only while the form is open | `새 피드 직접 등록` 은 폼이 닫혀 있으면 `aria-controls` 가 없고, 열면 문서에 있는 폼을 가리키며, 다시 닫으면 없어진다 | SourcesListTab | 공통 |
| labels the category options with the long category labels and keeps the values | `카테고리 분류` 선택지가 값 `harness`·`mcp_plugins_skills`·`agent_tech`·`ai_news` 에 긴 라벨 `하네스 & 벤치마크`·`MCP & 생태계`·`에이전트 아키텍처`·`최신 AI 동향` 이고 기본값 `ai_news` | SourcesListTab, `lib/labels.ts` | 공통 |

### 6.40 `frontend/src/tests/NewsCard.test.tsx` (42) — 대상 `components/NewsCard.tsx`, `ui/Badge.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders title, category, insight, and tech stack correctly | 제목, 카테고리 짧은 라벨(`하네스`), 시사점, 기술 스택 | NewsCard | 전역 next/navigation mock |
| renders Must-Read high signal badge when is_high_signal is true | 고신호 배지 | NewsCard | 같음 |
| calls onToggleBookmark with stopPropagation when bookmark button is clicked | 북마크 클릭 시 onToggleBookmark, 전파 중단 | NewsCard | 같음 |
| triggers onSelect when card is clicked | 카드 클릭 시 onSelect | NewsCard | 같음 |
| applies focus ring and data-focused attribute when isFocused is true | 포커스 링과 data-focused | NewsCard | 같음 |
| renders a single meta row with the short category label, source, time and the bookmark button | 머리줄(`data-card-meta`) 한 줄에 짧은 카테고리 라벨·소스·시간과 북마크 버튼 | NewsCard | 같음 |
| keeps Must-Read, tech stack and hotness badges out of the meta row | 머리줄에 `Must-Read`·기술 스택·인기 배지가 없다 | NewsCard | 같음 |
| shows at most three tech stack badges | 기술 스택 배지는 최대 3개 | NewsCard | 같음 |
| moves the hotness score to the footer stats with an sr-only "인기 점수" label | 인기 점수가 바닥 통계에 `sr-only` `인기 점수` 와 함께 있다 | NewsCard | 같음 |
| hides the hotness stat when the score is 25 or below | `hotness_score` 25 이하면 인기 통계가 없다 | NewsCard | 같음 |
| labels the insight body with "시사점" and keeps the sentence in its own element | 본문 앞머리가 `시사점` 이고 문장은 자기 요소에 있다 | NewsCard | 같음 |
| shows the summary instead of the insight when preferSummary is set and a summary exists (R18) | `preferSummary` 이고 요약이 있으면 시사점 대신 요약 | NewsCard | 같음 |
| keeps the insight when preferSummary is set but the summary is empty | `preferSummary` 여도 요약이 비면 시사점 | NewsCard | 같음 |
| fixes the title and body to two lines and keeps an empty two-line slot without text | 제목·본문을 두 줄 높이로 고정하고, 본문이 없으면 빈 두 줄 자리를 둔다 | NewsCard | 같음 |
| keeps the handover label visible at every width (R48) | 이름 `AI 챗에서 분석` 버튼 안 글자 `AI 챗에서 분석` 의 클래스에 `sr-only` 가 없다. 버튼 묶음(버튼의 부모)이 `ml-auto`, 바닥 줄이 `flex-wrap` | NewsCard, HandoverCtaButton | 같음 |
| puts the long category label in the meta row category title (R47) | 머리줄의 짧은 라벨 `하네스` 요소의 `title` 이 `categoryLabel(category)` = `하네스 & 벤치마크` | NewsCard, `lib/labels.ts` | 같음 |
| marks the badge row and keeps it on one clipped line | 배지 줄이 `[data-card-badges]` 이고 `flex-nowrap`·`overflow-hidden` 이다 | NewsCard | 같음 |
| lets each tech badge shrink between min-w-12 and max-w-32 with a truncating text wrapper and full-name title | 기술 배지마다 `shrink`·`min-w-12`·`max-w-32` 가 있고 `shrink-0`·`max-w-full` 이 없으며, 글자 감싸개가 `min-w-0`·`truncate`, `title` 이 기술 이름 전체다 (클래스는 `classList.contains` 로 토큰 단위 비교) | NewsCard, Badge | 같음 |
| keeps the Must-Read badge from shrinking | Must-Read 배지는 `shrink-0` 이다 | NewsCard, Badge | 같음 |
| hides the synthetic raw_score for %s (rss_kr, rss, arxiv, huggingface, mystery) | 원천 지표가 없는 소스는 `raw_score` 120 이어도 `[data-card-stat="score"]` 가 없고 `스타`·`점수` 글자도 없다. 인기 점수도 합성 값이라 `[data-card-stat="hotness"]` 와 `인기 점수` 글자가 없다 (5개) | NewsCard, `lib/labels.ts` `scoreMetric` | 같음 |
| shows GitHub raw_score as stars with a Star icon | `github` 점수는 `data-metric="stars"`, `sr-only` `스타`, `title` `GitHub 스타` | NewsCard | 같음 |
| shows HackerNews raw_score as points with an ArrowBigUp icon | `hackernews` 점수는 `points`·`포인트` | NewsCard | 같음 |
| shows Reddit raw_score as upvotes with an ArrowBigUp icon | `reddit` 점수는 `upvotes`·`추천` | NewsCard | 같음 |
| hides the score stat when a native metric source has raw_score 0 | 원천 지표 소스라도 `raw_score` 0 이면 점수 통계가 없다 | NewsCard | 같음 |
| labels the GitHub count as forks with a GitFork icon | `github` 의 `comments_count` 15 는 `data-metric="forks"`·`포크` | NewsCard | 같음 |
| labels the HackerNews count as comments with a MessageSquare icon | `hackernews` 개수는 `comments`·`댓글` | NewsCard | 같음 |
| hides the count stat when comments_count is 0 | `comments_count` 0 이면 개수 통계가 없다 | NewsCard | 같음 |
| marks the hotness stat without a metric attribute | `github` 카드(`hotness_score` 84.6)의 인기 통계는 `data-card-stat="hotness"` 이고 `data-metric` 이 없으며 `sr-only` `인기 점수`·`85` | NewsCard | 같음 |
| hides the hotness stat for %s whose hotness is derived from a synthetic raw_score (R41) (rss_kr, rss, arxiv, huggingface, mystery) | 원천 지표가 없는 소스는 `hotness_score` 84.6 이어도 인기 통계·`인기 점수`·`85` 가 없다 (5개) | NewsCard, `scoreMetric` | 같음 |
| keeps the hotness stat for %s which has a native score metric (R41) (github, hackernews, reddit) | 원천 지표 소스는 `hotness_score` 84.6 이면 인기 통계가 있고 `sr-only` `인기 점수`·`85` (3개) | NewsCard | 같음 |
| never renders a bare "점수" label for any source | 어느 소스에서도 종류 없는 `점수` 라벨을 그리지 않는다 | NewsCard | 같음 |
| exposes the item source on the card as data-source | 카드(`[data-feed-card]`)에 `data-source` 가 기사 `source` 값이다 | NewsCard | 같음 |

### 6.41 `frontend/src/tests/ResponsiveLayout.test.tsx` (4) — 대상 `components/chat/ChatMessageItem.tsx`, `components/MarkdownViewer.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| enforces min-w-0 and max-w-full flex constraints on ChatMessageItem container | 메시지 컨테이너 flex 제약 클래스 | ChatMessageItem | 없음 |
| isolates code block horizontal scrolling with overscroll-x-contain and local overflow-x-auto | 코드 블록 가로 스크롤 격리 | ChatMessageItem | 없음 |
| isolates markdown table scrolling within div.table-wrapper with overscroll-x-contain | 표 스크롤 격리 | ChatMessageItem | 없음 |
| ensures MarkdownViewer standalone component enforces 0px overflow classes | MarkdownViewer 넘침 방지 클래스 | MarkdownViewer | 없음 |

### 6.42 `frontend/src/tests/ThemeSystem.test.tsx` (5) — 대상 `context/ThemeContext.tsx`, `components/ThemeToggle.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| initializes with defaultTheme system and resolves OS preference | 기본 system 테마와 OS 선호 해석 | ThemeProvider, useTheme | `window.matchMedia` mock, localStorage |
| loads saved theme from localStorage if present | 저장된 테마 로드 | ThemeProvider | 같음 |
| cycles through light -> dark -> system -> light when toggleTheme is called | light→dark→system→light 순환과 저장 | ThemeProvider | 같음 |
| updates resolvedTheme when OS theme changes in system mode | system 모드에서 OS 변경 반영 | ThemeProvider | matchMedia change 리스너 호출 |
| renders ThemeToggle button with proper aria-label and accessible title | 토글 버튼 aria-label 과 title | ThemeToggle | 같음 |

### 6.43 `frontend/src/tests/ui/ChipGroup.test.tsx` (42) — 대상 `components/ui/Chip.tsx`(`ChipGroup scrollable`), `ScrollRow.tsx`, `hooks/useScrollOverflow.ts`
공통 mock: jsdom 은 레이아웃이 없어 스크롤 줄(`data-scroll-row` 또는 `role="group"`)의 `scrollWidth`·`clientWidth`·`scrollLeft` 를 `HTMLElement.prototype` 에 정의해 흉내 내고, `ResizeObserver` 를 `vi.stubGlobal` 로 바꾸며, 테스트마다 `window.matchMedia` 를 지정한 폭·줄어든 움직임 설정으로 바꾼다. `afterEach` 에서 모두 되돌린다. 도우미: `mockScrollingRects`(줄 상자와 칩 rect 를 `scrollLeft` 에 따라 돌려주는 `getBoundingClientRect` mock), `expectChipInsideRow`(칩이 줄 보이는 상자 안), `mockSnapStyles(scrollPaddingLeft)`(`getComputedStyle` 을 감싸 줄에 `scroll-snap-type: x proximity`·`scroll-padding-left`, 칩에 `scroll-snap-align: start` 를 돌려줌), `bleedTree`·`sideMarks`·`scrollTo`(`bleed` 줄을 그리고 표시·자리를 모으고 넘침 상태를 만듦).

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| marks a row that fits as data-overflow="none" with no mask | 넘치지 않으면 `data-overflow="none"`, 흐림 마스크 없음 | ChipGroup, useScrollOverflow | 공통 |
| allows 1px of slack before calling it overflow | 1px 차이까지는 넘침으로 보지 않는다 | 같음 | 공통 |
| reports end, both and start as the row scrolls, with a mask only while overflowing | 스크롤 위치에 따라 `end`·`both`·`start` 로 바뀌고 넘칠 때만 넘친 쪽 마스크 | 같음 | 공통 |
| re-measures when the ResizeObserver reports a size change | `ResizeObserver` 가 크기 변화를 알리면 다시 잰다 | 같음 | 공통 |
| shows a next button outside the group only on the overflowing side at >=768px | 768px 이상에서 넘친 쪽에만 `{줄 이름} 다음 항목 보기` 버튼이 그룹 밖에 있다 | ScrollRow | 공통 |
| has no scroll buttons below 768px even when overflowing | 768px 미만은 넘쳐도 스크롤 버튼이 없다 | ScrollRow | 공통 |
| scrolls by 80% of the row width with scrollBy when a button is pressed | 버튼은 줄 폭의 80% 만큼 `scrollBy` 한다 | ScrollRow | 공통 + 줄 요소의 `scrollBy` 를 `vi.fn` 으로 |
| uses behavior "auto" when reduced motion is preferred | 줄어든 움직임 설정이면 `behavior: "auto"` | ScrollRow | 공통 |
| falls back to adding to scrollLeft when scrollBy is missing | `scrollBy` 가 없으면 `scrollLeft` 를 더한다 | ScrollRow | 공통 |
| scrolls a focused chip into view with inline/block "nearest" | 포커스 받은 칩을 `scrollIntoView({inline, block: "nearest"})` 로 보이게 한다 | ScrollRow | 공통 + `scrollIntoView` spy |
| scrolls the row so the selected chip is visible on first render and when the selection changes | 처음 그릴 때와 선택이 바뀔 때 선택된 칩(`aria-pressed="true"`)이 보이도록 줄을 민다 | ScrollRow | 공통 + `getBoundingClientRect` spy |
| bleeds to the screen edges below 768px when bleed is set | `bleed` 면 768px 미만에서 줄이 좌우 화면 끝까지 늘어나고(`max-md:-mx-4`·`max-md:px-4`) 스냅 여백 `scroll-px-6` 이 있다 | ChipGroup, ScrollRow | 공통 |
| keeps a non-scrollable group as a wrapping group without a scroll row | `scrollable` 이 아니면 스크롤 줄 없이 줄바꿈 그룹이다 | ChipGroup | 공통 |
| wraps the chip icon in data-chip-icon and applies iconClassName to it | 칩 아이콘을 `data-chip-icon` 으로 감싸고 `iconClassName` 을 단다 | Chip | 공통 |
| bleeds only to the left edge below 768px when bleed="start" | `bleed="start"` 면 왼쪽으로만 늘어나고(`max-md:-ml-4`·`max-md:pl-4`, `-mx-4`·`px-4`·`-mr-4`·`pr-4` 없음) 스냅 여백 `scroll-px-6` 이 있다 | ChipGroup, ScrollRow | 공통 |
| passes rowClassName to the scroll row and className to the outer wrapper | `rowClassName` 은 스크롤 줄, `className` 은 바깥 감싸개에 붙는다 | 같음 | 공통 |
| (a) draws a decorative hint after the group when overflowing to the end below 768px | 768px 미만에서 끝 쪽으로 넘치면 그룹 뒤 형제로 장식 넘침 표시(`data-overflow-hint`, `aria-hidden`) 1개를 두고 스크롤 버튼은 없다. 양쪽으로 넘치면(`both`) 표시가 2개로, `data-overflow-hint="start"` 가 그룹 앞, `"end"` 가 그룹 뒤에 있고 둘 다 그룹 밖·`aria-hidden` 이다 | ScrollRow | 공통 |
| (b) gives the right bleed to the hint on a bleed row while the hint shows | 좌우 `bleed` 줄은 표시가 보이는 동안 줄을 왼쪽만 늘이고 오른쪽 여백은 표시가 쓴다 | ScrollRow | 공통 |
| draws only the start hint at start, none when it fits, and buttons instead at >=768px | 768px 미만 `start` 에서는 `data-overflow-hint="start"` 표시 1개만 그룹 앞(그룹 밖, `aria-hidden`)에 있고, 넘치지 않으면(`none`) 표시가 없으며, 768px 이상은 표시 없이 다음 버튼이 보인다 | ScrollRow | 공통 |
| (c) reveals the child matched by selectedSelector on first render | 처음 그릴 때 `selectedSelector` 에 맞는 자식이 보이도록 줄을 민다 | ScrollRow | 공통 |
| ① moves focus to the opposite button when the focused next button disappears at the end | 768px 이상 `end` 에서 `다음` 버튼에 포커스를 두고 줄을 끝까지 민 것으로 바꿔 `scroll` 을 보내면 `다음` 버튼이 없어지고 포커스가 `이전` 버튼에 있다 | ScrollRow | 공통 |
| ② moves focus to the selected chip when both buttons disappear below 768px | 같은 상태에서 폭 mock 을 768px 미만으로 바꿔 두 버튼이 사라지면 포커스가 선택 칩에 있다 | ScrollRow | 공통 |
| ③ leaves focus alone when the user already moved it to a chip before the button disappears | 버튼에서 다른 칩으로 포커스를 옮긴 뒤 버튼이 사라지면 포커스는 그 칩에 그대로다 | ScrollRow | 공통 |
| ④ reveals the chip matched by selectedSelector and ignores the default aria-pressed chip | `ChipGroup selectedSelector` 를 넘기면 그 선택자의 칩 기준으로 `scrollLeft` 가 움직이고 기본 선택자(`aria-pressed="true"`)의 첫 칩은 무시한다 | ChipGroup, ScrollRow | 공통 + `getBoundingClientRect` spy |
| re-reveals the selected chip after the overflow hint appears and narrows the row below 768px | 768px 미만에서 넘침 표시가 나타나 줄이 좁아지면 선택 칩을 다시 줄 안에 보이게 한다 | ScrollRow | 공통 + `mockScrollingRects` |
| re-reveals the selected chip when it grows (e.g. counts arrive) and the ResizeObserver fires | 선택 칩이 커지고(건수가 늦게 들어옴) `ResizeObserver` 가 알리면 선택 칩을 다시 보이게 한다 | ScrollRow | 같음 |
| does not pull the row back after the user scrolled, but still reveals a newly selected chip | 사용자가 줄을 민 뒤(가로 휠 `fireEvent.wheel(group, { deltaX: 40 })` 뒤 `scrollLeft` 10)에는 칩 크기가 바뀌어도 `scrollLeft` 를 되돌리지 않고, 새로 선택한 칩은 보이게 한다 | ScrollRow | 같음 |
| turns scroll snapping off while it sets scrollLeft and restores it right after | 선택 칩을 보이게 `scrollLeft` 를 둘 때 그 순간만 `style.scrollSnapType` 이 `none` 이고 바로 원래 값(빈 문자열)으로 돌아온다 | ScrollRow | 공통 + `scrollLeft` setter 기록 |
| moves to the snap position that shows the whole chip instead of an in-between offset snapping would undo | 스냅 줄(보이는 폭 207px, `scroll-padding-left` 16px)에서 흐림 밖에 다 드는 스냅 위치가 없으면 보이는 상자 안에 칩이 다 드는 스냅 위치 가운데 지금 위치와 가장 가까운 102 로 민다 | ScrollRow | 공통 + `mockSnapStyles('16px')`, `mockScrollingRects` |
| prefers a snap position that keeps the chip clear of the 24px fades | 흐림 24px 밖에 칩이 다 드는 스냅 위치(102)를 고른다 | ScrollRow | 같음 |
| ① shows a start hint before and an end hint after the group for each overflowing side | 768px 미만 `start`·`end`·`both` 마다 보이는 표시의 개수·`data-overflow-hint` 값·그룹 앞뒤 위치 | ScrollRow | 공통 + `bleedTree`·`sideMarks`·`scrollTo` |
| ② drops the bleed on the side whose hint shows (bleed row: end → left only, start → right only, both → none, none → both) | 좌우 `bleed` 줄의 768px 미만 클래스가 넘침 상태별로 `end` → 왼쪽만, `start` → 오른쪽만, `both` → 없음, `none` → 좌우 | ScrollRow | 같음 |
| ③ keeps an invisible slot on a side without bleed while the row overflows and that side does not | `bleed` 없는 쪽(`bleed="start"` 줄의 오른쪽, `bleed` 없는 줄의 양쪽)은 넘치는 동안 `data-overflow-slot` 자리가 있고 그쪽이 넘치지 않으면 `invisible` 이다 | ScrollRow | 같음 |
| ④ cancels the wrapper gap on hints and gives the bleed side page margin to the hint | 표시의 간격 상쇄 클래스(왼쪽 `-mr-1`, 오른쪽 `-ml-1`)와 `bleed` 쪽 여백 클래스(`max-md:-ml-4`/`max-md:-mr-4`) | ScrollRow | 같음 |
| ⑤ puts scroll-px-6 and data-selected-selector on every scroll row | 모든 스크롤 줄에 `scroll-px-6` 이 있고 `data-selected-selector` 가 넘긴 `selectedSelector` 값(주지 않으면 기본값)이다 | ScrollRow | 같음 |
| ⑥ shows buttons and no hints or slots at >=768px | 768px 이상에서는 표시·자리 없이 스크롤 버튼만 있다 | ScrollRow | 같음 |
| ① re-reveals the selected chip on resize after a scroll that came without any input (browser clamp/snap) | 입력 없이 `scrollLeft` 가 바뀐 뒤(브라우저 자르기·스냅 재맞춤 흉내) 선택 칩이 커지고 `ResizeObserver` 가 알리면 선택 칩을 다시 줄 안에 보이게 한다 | ScrollRow | 공통 + `mockScrollingRects` |
| ② keeps the user position on resize after pointerdown, touchstart, keydown or a scroll button click | `pointerdown`·`touchstart`·`keydown` 각각 뒤 `scrollLeft` 10, 스크롤 버튼 클릭 뒤 `scroll`(240)이면 칩이 커져도 `scrollLeft` 가 그대로다 | ScrollRow | 같음 |
| ③ ends the interaction when no scroll follows the input within 1,000ms | 가로 휠(`{ deltaX: 40 }`, 입력 신호) 뒤 1,100ms 동안 `scroll` 이 없으면 '사용자 조작 중' 이 끝나, 그 뒤 입력 없는 `scrollLeft` 변경은 사용자 스크롤이 아니라 선택 칩을 다시 보이게 한다 | ScrollRow | 같음 + 가짜 타이머(`setTimeout`·`clearTimeout`) |
| ④ does not treat the focus moved by "keep focus" as an input signal | 768px 이상 `다음` 버튼에 포커스를 두고 폭 mock 을 360 으로 바꿔 포커스 유지가 선택 칩으로 포커스를 옮긴 뒤, 입력 없는 `scrollLeft` 변경과 칩 크기 변화에서 선택 칩을 다시 보이게 한다 (옮긴 포커스의 `focusin` 은 입력 신호가 아니다) | ScrollRow | 같음 |
| ⑤ does not count a vertical wheel (page scroll over the row) as an input signal | 세로 휠(`fireEvent.wheel(group, { deltaY: 100 })`, `deltaX` 0, Shift 없음) 뒤 `scrollLeft` 를 10 으로 바꾸고 선택 칩이 커져 `ResizeObserver` 가 알리면 선택 칩을 다시 줄 안에 보이게 한다 (세로 휠은 입력 신호가 아니다) | ScrollRow | 같음 (도우미 `setupGrowingRow`) |
| ⑥ counts a wheel with deltaX > deltaY and a Shift + vertical wheel as input signals | `{ deltaX: 40, deltaY: 10 }` 휠, `{ deltaY: 100, shiftKey: true }` 휠 각각 뒤 `scrollLeft` 10 이면 칩이 커져도 `scrollLeft` 가 그대로다 (가로 의도 휠은 입력 신호다) | ScrollRow | 같음 |

### 6.44 `frontend/src/tests/ui/ConfirmDialog.test.tsx` (5) — 대상 `components/ui/ConfirmDialog.tsx`, `hooks/useFocusTrap.ts`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| keeps focus on the dialog container while busy (buttons are disabled) | 확인 버튼에 포커스가 있던 채로 `busy` 가 되면 두 버튼이 비활성이고 포커스는 대화상자 컨테이너에 남는다 | ConfirmDialog | 없음 |
| moves focus to the error message when busy ends with an error | `busy` 가 오류와 함께 끝나면 포커스가 오류 문구로 간다 | ConfirmDialog | 없음 |
| moves focus to the confirm button when busy ends without an error | 오류 없이 끝나면 확인 버튼으로 간다 | ConfirmDialog | 없음 |
| still focuses cancel first when opened (not busy) | 처음 열 때는 `취소` 에 포커스 | ConfirmDialog | 없음 |
| returns focus to the dialog when the focused element loses focus to the body | 포커스가 `body` 로 빠지면 대화상자로 되돌린다 | Dialog, useFocusTrap | 없음 |

### 6.45 `frontend/src/tests/ui/Dialog.test.tsx` (16) — 대상 `components/ui/Dialog.tsx`, `Drawer.tsx`, `ConfirmDialog.tsx`, `hooks/useFocusTrap.ts`, `hooks/useScrollLock.ts`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders role, aria-modal and links the title and description | `role="dialog"`, `aria-modal`, 제목·설명 연결 | Dialog | 없음 |
| focuses the first focusable element of the body, or initialFocusRef | 본문 첫 포커스 요소 또는 `initialFocusRef` 로 포커스 | Dialog, useFocusTrap | 없음 |
| cycles Tab and Shift+Tab inside the dialog | Tab/Shift+Tab 포커스 트랩 | 같음 | 없음 |
| returns focus to the opener when closed | 닫으면 연 요소로 포커스 복귀 | 같음 | 없음 |
| closes on the close button and on the backdrop by default | 기본은 닫기 버튼·배경 클릭으로 닫힌다 | Dialog | 없음 |
| does not close on the backdrop when dismissOnScrim is false | `dismissOnScrim={false}` 면 배경 클릭으로 안 닫힌다 | Dialog | 없음 |
| sets inert on #app-shell and locks body scroll while open, and releases both on close | 열린 동안 `#app-shell` 에 `inert`, body 스크롤 잠금, 닫으면 둘 다 해제 | Dialog, useScrollLock, overlay-stack | 없음 |
| leaves the stack when unmounted while open | 열린 채 언마운트되면 스택에서 빠진다 | Dialog, overlay-stack | 없음 |
| closes only the top dialog with one Escape when two are stacked | 두 개가 쌓이면 Escape 한 번에 위의 것만 닫힌다 | 같음 | 없음 |
| supports ariaLabel, header + labelledBy, closeLabel and panelProps | `ariaLabel`, `header`+`labelledBy`, `closeLabel`, `panelProps` | Dialog | 없음 |
| closes a sheet on a 100px swipe down | 시트는 100px 아래 스와이프로 닫힌다 | Dialog (`mobile="sheet"`) | 터치 이벤트 |
| is a modal dialog with the given close label and backdrop test id | Drawer 의 modal dialog, 닫기 라벨, 배경 test id | Drawer | 없음 |
| is an alertdialog that focuses cancel first | ConfirmDialog 는 `alertdialog` 이고 처음 포커스가 취소 | ConfirmDialog | 없음 |
| calls onConfirm / onCancel | 확인·취소 콜백 | ConfirmDialog | 없음 |
| ignores Escape and the backdrop while busy and disables both buttons | `busy` 면 Escape·배경 클릭 무시, 두 버튼 비활성 | ConfirmDialog | 없음 |
| shows the error inside the dialog | 오류를 창 안에 보인다 | ConfirmDialog | 없음 |

### 6.46 `frontend/src/tests/ui/FormControls.test.tsx` (32) — 대상 `components/ui/` 의 입력·표시 부품, `lib/labels.ts`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| links the label to the input | 라벨과 입력 연결 | TextField | 없음 |
| keeps a hidden label as sr-only text | 숨긴 라벨은 `sr-only` 글자로 남는다 | TextField | 없음 |
| points aria-describedby at the description and the error | `aria-describedby` 가 도움말·오류를 가리킨다 | TextField | 없음 |
| sets aria-invalid only when there is an error | 오류가 있을 때만 `aria-invalid` | TextField | 없음 |
| uses 16px text on mobile to avoid iOS auto-zoom | 모바일 16px 글자 (iOS 자동 확대 방지) | TextField | 없음 |
| forwards ref to the input | ref 를 input 으로 넘긴다 | TextField | 없음 |
| renders a search landmark with a searchbox | `search` 랜드마크와 searchbox | SearchField | 없음 |
| submits the current value on Enter | Enter 로 현재 값 제출 | SearchField | 없음 |
| clears with the 검색어 지우기 button and returns focus to the input | `검색어 지우기` 후 입력창으로 포커스 | SearchField | 없음 |
| links the label and error like TextField | 라벨·오류 연결 | Textarea | 없음 |
| links the label to a native select with the given options | 라벨과 네이티브 select, 선택지 | Select | 없음 |
| keeps a hidden label accessible | 숨긴 라벨도 접근 이름이 된다 | Select | 없음 |
| is a role="switch" button with aria-checked and toggles through onChange | `role="switch"`, `aria-checked`, onChange 토글 | Switch | 없음 |
| uses aria-label when the label is hidden | 라벨을 숨기면 `aria-label` | Switch | 없음 |
| does not call onChange when disabled | 비활성이면 onChange 없음 | Switch | 없음 |
| renders chips as buttons with aria-pressed inside a labelled group | 이름 있는 그룹 안 `aria-pressed` 버튼 | Chip, ChipGroup | 없음 |
| uses accent tone by default and warning tokens when tone="warning" is selected | 기본 accent 톤, `tone="warning"` 선택 시 warning 토큰 | Chip | 없음 |
| scrolls horizontally on one line when scrollable | `scrollable` 이면 한 줄 가로 스크롤 | ChipGroup | 없음 |
| is a labelled group of aria-pressed buttons | 이름 있는 `aria-pressed` 버튼 그룹 | SegmentedControl | 없음 |
| Card renders the requested element | `as` 로 요소 지정 | Card | 없음 |
| Skeleton is hidden from assistive tech and pulses | 보조기술에서 숨기고 깜빡임 | Skeleton | 없음 |
| EmptyState shows title, description and action | 제목·설명·동작 | EmptyState | 없음 |
| ErrorState is an alert with a retry button | `alert` 와 재시도 버튼 | ErrorState | 없음 |
| CodeBlock shows the language, a copy button and a scrollable pre, and accepts className | 언어 라벨, 복사 버튼, 가로 스크롤 `pre`, `className` | CodeBlock | 없음 |
| maps category and source ids to the NewsCard labels and falls back to the id | 카테고리 id 의 긴 라벨(`하네스 & 벤치마크`, `MCP & 생태계`, `에이전트 아키텍처`, `최신 AI 동향`)과 소스 id 의 라벨, 모르는 값은 id 그대로 | `lib/labels.ts` | 없음 |
| maps category ids to the short labels used on cards and chips | 짧은 라벨 `하네스`, `MCP`, `에이전트`, `AI 동향` | `categoryShortLabel` | 없음 |
| falls back to the raw id for unknown categories in the short labels | 모르는 id 와 `constructor`·`toString` 같은 프로토타입 키는 그대로 돌려준다 | 같음 | 없음 |
| maps trend radar category names to Korean labels | 레이더 이름 4개를 한국어 라벨로 바꾼다 | `radarCategoryLabel` | 없음 |
| falls back to the raw name for unknown radar categories and prototype keys | 모르는 이름·프로토타입 키는 그대로 | 같음 | 없음 |
| maps sources to their native score metric and hides synthetic scores (R36) | `scoreMetric('github') === 'stars'`, `hackernews` → `points`, `reddit` → `upvotes`, `rss_kr`·`huggingface` 등 → `null`, 라벨 `스타`·`포인트`·`추천` | `scoreMetric`, `SCORE_METRIC_LABELS` | 없음 |
| labels the GitHub count as forks and every other count as comments (R36) | `countMetric('github') === 'forks'`, `countMetric('hackernews') === 'comments'`, 라벨 `포크`·`댓글` | `countMetric`, `COUNT_METRIC_LABELS` | 없음 |
| names the search scopes in Korean with the shared all-category label (R38) | `scopeLabel('scoped') === '단일 기사'`, `scopeLabel('global') === ALL_CATEGORY_LABEL === '전체 소식'` | `scopeLabel`, `SCOPE_LABELS`, `ALL_CATEGORY_LABEL` | 없음 |

### 6.47 `frontend/src/tests/ui/IconGuard.test.ts` (3) — 대상 `frontend/src/components/**`, `frontend/src/app/**` 의 `.ts`·`.tsx`
node 환경에서 파일 글자를 읽는 정적 검사다. 판정식은 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/gu` 이고 허용 목록은 없다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| finds the source files to scan in components/** and app/** | 대상 파일이 `components` 와 `app` 양쪽에 있고 50개를 넘는다 (대상을 못 찾아 빈 검사로 통과하지 않게) | 파일 목록 | 파일 읽기 |
| the rule matches pictographic emoji but not text-presentation symbols | `💡🔄📊⚡🎯🧠🔒` 7개, `🛠️⚖️⚠️`(U+FE0F) 3개를 세고 `© ® ↔ ➔ ✓` 는 0개 | 판정식 | 없음 |
| has no pictographic emoji in UI source text | 대상 파일 전체에서 걸리는 글자가 없다 (실패하면 `파일:줄 글자(U+XXXX)` 목록) | 대상 파일 | 파일 읽기 |

### 6.48 `frontend/src/tests/ui/Menu.test.tsx` (11) — 대상 `components/ui/Menu.tsx`, `ThemeMenu.tsx`, `Popover.tsx`, `components/ThemeToggle.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| exposes aria-haspopup / aria-expanded / aria-controls on the trigger | 트리거의 `aria-haspopup`·`aria-expanded`·`aria-controls` | MenuButton | 없음 |
| focuses the first item when opened and moves with arrows, Home and End (skipping disabled) | 열면 첫 항목 포커스, 화살표·Home·End 이동(비활성 건너뜀) | MenuButton | 없음 |
| runs the item on Enter, closes and returns focus to the trigger | Enter 로 실행 후 닫고 트리거로 포커스 | MenuButton | 없음 |
| closes on Escape and focuses the trigger | Escape 로 닫고 트리거 포커스 | MenuButton | 없음 |
| closes on an outside pointerdown and on Tab | 바깥 pointerdown·Tab 으로 닫기 | MenuButton | 없음 |
| opens with ArrowUp on the trigger focusing the last item | 트리거에서 ArrowUp 이면 마지막 항목 포커스 | MenuButton | 없음 |
| Escape inside a dialog closes only the menu | 대화상자 안 메뉴는 Escape 한 번에 메뉴만 닫힌다 | MenuButton, Dialog, overlay-stack | 없음 |
| renders three menuitemradio entries with aria-checked and switches theme | `menuitemradio` 3개와 `aria-checked`, 테마 전환 | ThemeMenu, ThemeProvider | localStorage |
| ThemeToggle showDropdown renders the theme menu; default stays a single toggle button | `showDropdown` 이면 테마 메뉴, 기본은 토글 버튼 하나 | ThemeToggle | localStorage |
| renders next to the anchor (no portal), focuses inside, closes on Escape back to the anchor | 앵커 옆에 그리고(포털 없음) 안으로 포커스, Escape 로 닫고 앵커로 복귀 | Popover | 없음 |
| closes on an outside pointerdown but not on the anchor or inside | 바깥 pointerdown 으로 닫히고 앵커·안쪽 클릭으로는 안 닫힌다 | Popover | 없음 |

### 6.49 `frontend/src/tests/ui/OverlayStack.test.tsx` (11) — 대상 `lib/overlay-stack.ts`, `components/ui/Dialog.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| push / remove keeps order and the top layer | 등록·제거 순서와 맨 위 레이어 | overlayStack | 없음 |
| calls only the top layer onEscape and prevents default | Escape 는 맨 위 레이어의 onEscape 만 부르고 기본 동작을 막는다 | overlayStack | 없음 |
| ignores Escape while IME composition is in progress | IME 조합 중 Escape 무시 | overlayStack | 없음 |
| attaches the window listener only while the stack is non-empty | 스택이 비어 있지 않을 때만 window 리스너 | overlayStack | `window.addEventListener`/`removeEventListener` spy |
| sets inert on #app-shell while a modal is open and removes it after | 모달이 열린 동안 `#app-shell` 에 `inert` | overlayStack | 없음 |
| useOverlayOpen follows the stack | `useOverlayOpen` 이 스택 상태를 따른다 | useOverlayOpen | 없음 |
| a component layer handles window Escape and leaves the stack on unmount | 컴포넌트 레이어가 Escape 를 받고 언마운트 때 빠진다 | useOverlayLayer | 없음 |
| removes the layer when open becomes false | `open` 이 false 가 되면 레이어 제거 | useOverlayLayer | 없음 |
| calls the latest onEscape after re-render | 다시 그린 뒤 최신 onEscape 를 부른다 | useOverlayLayer | 없음 |
| 자식이 맨 위이고 Escape 한 번에 자식만 닫히며 부모는 inert 다 | 같은 렌더에서 함께 연 부모·자식 대화상자 중 자식이 스택 맨 위이고 부모는 `inert`, Escape 한 번에 자식만, 다음 Escape 에 부모가 닫힌다 | overlayStack, Dialog | 없음 |
| StrictMode 이중 렌더에서도 자식이 맨 위다 | `StrictMode` 에서도 같은 결과 | 같음 | 없음 |

### 6.50 `frontend/src/tests/ui/Primitives.test.tsx` (16) — 대상 `lib/cn.ts`, `components/ui/Button.tsx`, `IconButton.tsx`, `Spinner.tsx`, `InlineAlert.tsx`, `Badge.tsx`, `Kbd.tsx`, `hooks/useMediaQuery.ts`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| joins truthy class names and skips falsy values | 참인 클래스만 잇는다 | cn | 없음 |
| defaults to type="button" | 기본 `type="button"` | Button | 없음 |
| keeps an explicit type | 지정한 type 유지 | Button | 없음 |
| is disabled and aria-busy while loading | 로딩 중 비활성과 `aria-busy` | Button | 없음 |
| has no aria-busy when not loading | 로딩이 아니면 `aria-busy` 없음 | Button | 없음 |
| exposes buttonClasses for links styled as buttons | 링크용 `buttonClasses` | Button | 없음 |
| uses label for aria-label and title | `label` 이 `aria-label`·`title` | IconButton | 없음 |
| sets aria-pressed when pressed is given | `pressed` 면 `aria-pressed` | IconButton | 없음 |
| Spinner renders an sr-only label | `sr-only` 라벨 | Spinner | 없음 |
| InlineAlert uses role="alert" for danger and role="status" otherwise | danger 는 `alert`, 그 밖은 `status` | InlineAlert | 없음 |
| Badge renders its text | 글자 표시 | Badge | 없음 |
| Badge shrink replaces shrink-0 and max-w-full with shrink and leaves the width limits to className | `shrink` 면 `shrink-0`·`max-w-full` 대신 `shrink` 만 붙고 폭 한계는 `className` 으로 준 것뿐이다 | Badge | 없음 |
| Kbd renders a kbd element hidden below 640px | `kbd` 요소, 640px 미만 숨김 | Kbd | 없음 |
| follows the default desktop (1280px) matchMedia mock | setup.ts 의 1280px mock 을 따른다 | useMediaQuery | setup.ts `matchMedia` |
| returns the value of a matchMedia mock set by the test | 테스트가 바꾼 mock 값을 돌려준다 | useMediaQuery | `matchMedia` 교체 |
| returns false when matchMedia is not a function | `matchMedia` 가 없으면 false | useMediaQuery | `matchMedia` 를 undefined 로 |

### 6.51 `frontend/src/tests/ui/Tabs.test.tsx` (17) — 대상 `components/ui/Tabs.tsx`, `ScrollRow.tsx`
넘침 테스트는 tablist 의 `scrollWidth`·`clientWidth`·`scrollLeft` 를 `HTMLElement.prototype` 에 정의하고 `window.matchMedia` 를 바꿔 쓴 뒤 되돌린다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders tablist, tabs and the linked tabpanel | `tablist`·`tab`·연결된 `tabpanel` | Tabs, TabPanel | 없음 |
| uses roving tabIndex: only the selected tab is in the Tab order | 선택 탭만 Tab 순서에 있다 (roving tabIndex) | Tabs | 없음 |
| activates a tab on click | 클릭으로 선택 | Tabs | 없음 |
| moves with ArrowRight/ArrowLeft and wraps around, moving focus and selection | 좌우 화살표로 순환 이동, 포커스·선택 함께 | Tabs | 없음 |
| jumps to the first and last tab with Home and End | Home·End 로 처음·끝 | Tabs | 없음 |
| renders a badge inside the tab | 탭 안 배지 | Tabs | 없음 |
| hides inactive panels with the hidden attribute | 비활성 패널은 `hidden` | TabPanel | 없음 |
| 선택된 패널만 그리면 선택되지 않은 탭에는 aria-controls 가 없다 | 패널을 선택된 것만 그리면 다른 탭에는 `aria-controls` 가 없다 | Tabs | 없음 |
| 탭을 바꾸면 aria-controls 도 새로 선택된 탭으로 옮긴다 | 선택이 바뀌면 `aria-controls` 도 옮긴다 | Tabs | 없음 |
| 모든 aria-controls 가 문서에 있는 요소를 가리킨다 | 모든 `aria-controls` 대상이 문서에 있다 | Tabs | 없음 |
| mountedPanels 로 숨겨 둔 패널이 있는 탭에도 aria-controls 를 단다 | `mountedPanels` 의 탭에도 단다 | Tabs | 없음 |
| 넘치지 않으면 tablist 가 data-scroll-row 이고 data-overflow="none", 마스크·스크롤 버튼 없음 | tablist 가 공통 스크롤 줄이고 넘치지 않으면 표시가 없다 | Tabs, ScrollRow | 레이아웃 정의 |
| 넘치면 넘친 쪽을 data-overflow 로 알리고 흐림을 주며, 768 이상에서 tablist 밖에 스크롤 버튼을 둔다 | 넘친 쪽 `data-overflow`·흐림, 768px 이상 tablist 밖 스크롤 버튼 | 같음 | 레이아웃 정의 |
| 키보드로 옮긴 탭이 보이도록 스크롤한다 | 화살표로 옮긴 탭이 보이게 줄을 민다 | 같음 | 레이아웃 정의 |
| 선택된 탭이 줄 밖에 있으면 처음 그릴 때 줄을 그 탭까지 민다 | 처음 그릴 때 선택 탭까지 민다 | 같음 | 레이아웃 정의 |
| 선택을 줄 밖 탭으로 바꾸면 줄을 그 탭 쪽으로 민다 | 선택이 줄 밖 탭으로 바뀌면 그 탭 쪽으로 민다 (`selectedSelector`) | 같음 | 레이아웃 정의 |
| 768 미만에서 탭 줄이 넘치면 tablist 밖에 장식 넘침 표시를 둔다 | 768px 미만에서 넘치면 tablist 밖에 `data-overflow-hint` | 같음 | 레이아웃 정의, `matchMedia` 폭 mock |

### 6.52 `frontend/src/tests/ui/Toast.test.tsx` (10) — 대상 `components/ui/Toast.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| shows a status toast and an alert toast for errors | 일반 토스트는 `status`, 오류는 `alert` | ToastRegion, useToast | 없음 |
| renders only once when ToastRegion is mounted twice | `ToastRegion` 이 두 번 마운트돼도 한 번만 그린다 | ToastRegion | 없음 |
| keeps rendering through the second region when the first unmounts | 첫 영역이 언마운트되면 둘째 영역이 이어 그린다 | ToastRegion | 없음 |
| dismisses with the close button and after the duration | 닫기 버튼과 지속 시간 뒤 사라진다 | ToastRegion | `vi.useFakeTimers` |
| 모달이 없으면 composer 영역에 그린다 | 전역·`composer` 영역이 함께 있고 모달이 없으면 `composer` 영역(`data-toast-region="composer"`)에만 그린다. `status`·`aria-live="polite"`·`알림 닫기` 는 그대로 | ToastRegion | 없음 |
| 모달 대화상자가 열려 있으면 global 영역에 그린다 | 모달 대화상자가 열려 있으면 전역 영역에만 그린다 | ToastRegion, Dialog | 없음 |
| composer 영역이 사라지면 global 영역으로 돌아간다 | `composer` 영역이 언마운트되면 전역 영역이 이어 그린다 | ToastRegion | 없음 |
| composer 에서 알린 알림은 global 로 옮겨져도 live 속성이 없고, 새 알림은 global 에서 알린다 | 전역·`composer` 영역에서 `danger` 알림이 `composer` 안에 `role="alert"` 로 뜬 뒤 모달 `Dialog` 를 열어 전역 영역으로 옮겨지면, 같은 알림 요소에 `role`·`aria-live` 가 없고 전역 영역의 `alert` 가 0개이며 닫기 버튼은 그대로다. 그 상태에서 띄운 새 `info` 알림은 전역 영역에서 `role="status"`·`aria-live="polite"` 를 갖는다 | ToastRegion, Dialog | 없음 |
| 영역이 하나일 때는 지금처럼 role·aria-live 를 갖는다 (회귀 방지) | 영역이 하나면 알림은 `status`/`polite`, 오류는 `alert`/`assertive` 다 | ToastRegion | 없음 |
| composer → global → composer 왕복 뒤 같은 알림에 role·aria-live 가 없다 | `composer` 에서 `role="alert"` 로 뜬 `danger` 알림이 모달을 열어 전역으로 옮겨졌다가 모달을 닫아 `composer` 로 돌아오면, `composer` 영역 안 같은 글자의 요소에 `role`·`aria-live` 가 없고 `alert` 가 0개다 | ToastRegion, Dialog | 없음 |

### 6.53 `frontend/src/tests/ui/useCopyToClipboard.test.tsx` (5) — 대상 `hooks/useCopyToClipboard.ts`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| copies with navigator.clipboard and shows 복사됨 for 2 seconds | `navigator.clipboard` 로 복사하고 2초 동안 `복사됨` | useCopyToClipboard | `navigator.clipboard` mock, `vi.useFakeTimers` |
| falls back to execCommand("copy") when navigator.clipboard is missing | clipboard 가 없으면 `execCommand("copy")` | useCopyToClipboard, copyText | `document.execCommand` mock |
| falls back to execCommand when navigator.clipboard.writeText rejects | `writeText` 거부 시 `execCommand` | 같음 | 같음 |
| reports failed (복사 실패) for 2 seconds when both methods fail | 둘 다 실패하면 2초 동안 `복사 실패` | useCopyToClipboard | 같음 |
| reports failed when there is no clipboard and no execCommand | 둘 다 없으면 실패 | useCopyToClipboard | 같음 |

### 6.54 `frontend/src/tests/chat/ChatStreamTurn.test.tsx` (8) — 대상 `components/chat/ChatWorkspace.tsx`, `useChatSessions.ts`
공통 mock: 파일 자체 `vi.mock('next/navigation')`(검색 파라미터 없음), `beforeEach` 에서 localStorage 초기화, `server.use` 로 `POST */api/chat/stream` 에 지정한 SSE 본문을 한 번에 보내고 닫는다. 세션 저장은 `POST */api/chat/sessions` 본문을 모은다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| FE-01: 모델을 바꾼 직후 보낸 질문은 바꾼 모델(티어)로 요청한다 | `Haiku 5.5` 를 고른 직후 보낸 요청 본문이 `model_tier = haiku`, `model = claude-haiku-5-5` | ChatWorkspace `handleSendMessage` | 공통 (요청 본문 수집) |
| FE-02: 완료된 한 턴은 세션 저장 POST 를 한 번만 보낸다 | 저장 POST 가 1번이고 본문 메시지가 `[user 질문 completed, assistant 답 completed]` | ChatWorkspace, useChatSessions | 공통 (세션 POST 수집) |
| FE-02: StrictMode 에서도 완료된 한 턴은 세션 저장 POST 를 한 번만 보낸다 | `React.StrictMode` 안에서도 저장 POST 1번 | 같음 | 같음 |
| FE-03: done 없이 끊긴 스트림은 오류로 보이고 완료로 저장하지 않는다 | `응답이 중간에 끊겼습니다. 다시 시도해 주세요.` 와 `답변 다시 시도` 버튼이 보이고 내보내기 도구줄이 없다. POST 본문과 localStorage 어디에도 `completed` 인 보조 메시지가 없다 | ChatWorkspace SSE 마무리 | 공통 (`token` 하나만 보내고 닫음) |
| BUG-02R: 스트림 요청에 클라이언트 메시지 id 두 개를 싣고, 세션 저장도 같은 id 를 쓴다 | 요청 본문의 `user_message_id`·`assistant_message_id` 가 1~36자이고 서로 다르며, 세션 저장 POST 메시지 id 가 `[user, assistant]` 순서로 같다 | ChatWorkspace `handleSendMessage`, `saveTurn` | 공통 |
| BUG-02R: 재시도는 새 메시지 id 로 보내고, 저장도 새 id 로 한다 | 첫 요청 502 → `답변 다시 시도` → 두 번째 요청의 두 id 가 첫 요청과 다르고, 저장 POST 1번이 두 번째 id 를 쓴다 | 같음, `handleRetryMessage` | 공통 (첫 요청 502) |
| FE-33: done 없이 끊긴 스트림의 부분 답을 그대로 보이고 그 아래에 끊김 오류와 다시 시도를 함께 보인다 | `받은 부분 답` 이 오류 문구보다 앞에 보이고 `답변 다시 시도` 가 있으며 내보내기 도구줄은 없고 저장 POST 0번 | ChatMessageItem 오류 렌더 | 공통 |
| FE-34: 사용자가 중단한 뒤 스트림이 오류 없이 끝나면 끊김 오류가 아니라 중단으로 처리한다 | `답변 생성 중단` 뒤 본문이 정상 종료돼도 끊김 문구가 없고 부분 답이 보이며 저장 POST 1번이 `[user completed, assistant aborted]` | ChatWorkspace 루프 마무리 | `vi.spyOn(globalThis, 'fetch')` (신호 무시 스트림, 세션 POST 수집) |

### 6.55 `frontend/src/tests/feed/FeedSearch.test.tsx` (2) — 대상 `hooks/useNewsFeed.ts`, `components/feed/FeedToolbar.tsx`
공통: 테스트 안의 `SearchHarness` 가 홈 화면처럼 `useNewsFeed` 값·setter 를 `FeedToolbar` 에 넘기고 목록 제목과 `현재 N페이지` 를 그린다. `server.use` 로 `GET */api/news` 쿼리를 모으고 `search=mcp&page=1` 에만 `MCP 검색 결과 기사` 1건을 준다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| 3페이지에서 검색어를 입력하면 1페이지 결과를 보이고, 입력이 멈춘 뒤 한 번만 요청한다 | 3페이지에서 `m`·`mc`·`mcp` 를 입력하면 입력창은 바로 `mcp`, 결과 기사가 보이고 `현재 1페이지`, 입력 뒤 요청은 `search=mcp&page=1` 한 번 | useNewsFeed `setSearch`(300ms 디바운스) | 공통 |
| 입력 직후 Enter 를 누르면 기다리지 않고 그 검색어로 요청한다 | 입력 직후 검색 폼 제출 시 결과가 보이고 요청은 `search=mcp&page=1` 한 번 | useNewsFeed `loadNews`, FeedToolbar 제출 | 공통 |

---

## 7. 기능 영역별 커버리지와 공백 (frontend)

"있음" 은 테스트가 검증하는 동작, "없음" 은 코드에 있지만 이를 직접 부르거나 단언하는 테스트를 찾지 못한 동작이다. backend 쪽 행은 `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md` 에 둔다. 5대 상태 공백은 3.2절.

### 7.1 뉴스 피드 (NEWS)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 뉴스 카드 렌더링·북마크·선택·포커스, 고정 틀(머리줄 한 줄, 짧은 카테고리 라벨, 배지 줄과 기술 배지 줄어듦·말줄임·`title`, 머리줄 카테고리 `title` 긴 라벨, 바닥 인기 점수(원천 지표 소스만), 소스별 원천 지표(스타·포인트·추천)와 합성 점수·합성 인기 점수 숨김, GitHub 포크, `data-source`·`data-card-stat`·`data-metric`, 바닥 줄 줄바꿈과 모든 폭의 `AI 챗에서 분석` 글자, `시사점`, 반복이면 요약), 카드·상세 모달의 `AI 챗에서 분석` 이동 버튼 | `NewsCard.test.tsx`, `ui/Primitives.test.tsx`, `HandoverIntegration.test.tsx` |
| 있음 | 반복 시사점 판정(공백 정리, 끝 40자, 20자 미만 제외) | `feed/FeedInsights.test.ts` |
| 있음 | 뉴스 목록 MSW 핸들러와 `NewsItemSchema` 계약 | `ContractAndMsw.test.ts` (MSW News 절) |
| 있음 | 검색 영역·필터 영역(검색 영역 `[data-feed-search]` 전체 폭·`scroll-mt-20`, 필터 영역 안 검색 입력·선택 상자 없음, 카테고리·소스 칩과 건수, 소스 줄 오른쪽 끝 `Must-Read` 토글(위치·폭별 모양·같은 노드), 검색 제출·지우기, 고르면 1페이지, 줄 배치, 자리표시 `키워드 검색`, 768px 미만 소스 줄 왼쪽만 bleed·토글 같은 줄, 768px 이상 줄 B 그대로, 양쪽 넘침 표시(오른쪽은 토글 앞), 폭이 바뀌어도 같은 노드·포커스·값, 세 폭의 DOM 순서 `검색 → 카테고리 → 소스 → Must-Read`, 소스 줄 선택 칩) | `feed/FeedToolbar.test.tsx` |
| 있음 | 목록 머리줄(정렬 select 4개 선택지와 콜백·1페이지, 정렬이 상태 live 영역 밖·뒤, 상태 `aria-live`·페이지 글자, 한 줄 배치·위쪽 맞춤·상태 최소 높이, 폭이 바뀌어도 같은 정렬 노드) | `feed/FeedStatusBar.test.tsx` |
| 있음 | 요약 바(브리핑 버튼, 트렌드 레이더 펼침, 태그 선택·초기화, 폭별 표시, 다시 읽기 중 스켈레톤 없음, 레이더 카테고리 분포 배치·한국어 라벨) | `feed/InsightsBar.test.tsx`, `feed/TrendRadarPanel.test.tsx` |
| 있음 | 피드 훅의 다시 읽기(같은 조건이면 목록 유지·로딩 없음, 통계 실패해도 브리핑·레이더 반영, 실패 신호와 오류 구분) | `hooks/useNewsFeed.test.tsx` |
| 있음 | 기사 상세 대화상자(제목 이름, 탭과 화살표 키, 한국어 절 제목, `대화 초기화` 확인 창, 닫기, 바닥 출처 라벨, `AI 질의응답` 탭 입력 중 Escape, 답변 복사 실패 표시)와 질의응답 패널(자리표시, 빠른 질문 스크롤 줄, 빠른 질문 앞 lucide 아이콘) | `modals/NewsDetailModal.test.tsx`, `AskAiPanel.test.tsx` |
| 있음 | 피드 단축키의 오버레이 차단, Enter/Space 조건, 한글 자판 `e.code` 판정 | `HotkeyGating.test.tsx` |
| 없음 | 피드 메인 화면 조립(`/` 단축키의 검색 영역 스크롤 포함), 피드 훅의 다시 읽기 밖 동작(필터 조합, 북마크 보기), 북마크 훅, 목록 머리줄 상태의 필터·북마크 배지 글자, 페이지 이동 | `frontend/src/app/page.tsx`, `frontend/src/hooks/useNewsFeed.ts`, `frontend/src/hooks/useBookmarks.ts`, `frontend/src/components/feed/FeedStatusBar.tsx`, `feed/FeedPagination.tsx` |
| 없음 | 프론트 API 클라이언트 함수(타임아웃, ask 스트림의 직접 연결·대체 경로) | `frontend/src/lib/api.ts:25-169` |

### 7.2 수집 (COLL)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 헤더 수집 상태 버튼·즉시 수집(모바일 더보기)·초기화 확인 창과 창 안 오류, 수집 중 팔레트 초기화 비활성, 스케줄 대화상자의 즉시 수집·위험 영역 (API 는 mock) | `Header.test.tsx`, `modals/ScheduleModal.test.tsx` |
| 있음 | 수집 상태 복원(마운트 때 `is_running` 이면 수집 중·진행 폴링), `already_running` 응답 처리(수동 수집은 합류, 초기화는 거부), 이전 회차 진행 응답 무시, 오래된 스케줄 상태 응답 버리기(진행 폴링이 끝난 뒤 도착한 30초 재조회 응답, 더 나중 응답보다 늦게 온 응답)와 `수집 완료` 한 번 | `hooks/useCollector.test.ts`, `Header.test.tsx` |
| 없음 | 진행 줄 문구의 단계별 변화 | `frontend/src/hooks/useCollector.ts` |

### 7.3 AI 챗 (CHAT)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 챗 화면 전체(스트림, 중지, 재시도, 필터, 모델 변경, 입력창 아래 모델 선택 하나, 세션 복원·삭제)와 하위 컴포넌트, 검색 범위 용어(`단일 기사`·`전체 소식`: 탭 접근 이름, 세션 배지·접근 이름, 없는 기사 알림, 캡슐 `포커스:`), 포커스 필터 창 카테고리 칩 긴 라벨 순서, 모델 티어 lucide 아이콘(`data-tier-icon`), 카드·배너 이관 버튼 이름 `AI 챗에서 분석` | `frontend/src/tests/chat/*.test.tsx` |
| 있음 | 프론트 채팅 계약(zod)과 MSW 핸들러 | `ContractAndMsw.test.ts` |
| 없음 | 뉴스 상세 질의응답 탭의 답 스트림 처리·오류 분기 | `frontend/src/components/NewsDetailModal.tsx`, `frontend/src/lib/api.ts:70-169` (`modals/NewsDetailModal.test.tsx` 는 빠른 질문 전송과 대화 추가까지만 단언한다) |

### 7.4 브리핑·공유 (BRF)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 챗 답변 내보내기(복사, .md, Notion 콜백) | `ExportToolbar.test.tsx` |
| 있음 | 공유 & 알림 설정 대화상자(탭 3개, 비밀값 보기 토글, 바닥 `연결 테스트`·`저장`·`닫기`, 저장 결과 안내, 배경 클릭으로 안 닫힘) | `modals/BriefingSettingsModal.test.tsx` |
| 있음 | 요약 바의 브리핑 버튼 | `feed/InsightsBar.test.tsx` |
| 있음 | 일일 브리핑 대화상자의 `이메일 발송` `aria-controls`(주소 입력 줄이 열렸을 때만), 설정 진입 한 곳(`브리핑 작업` 메뉴에 없음), 헤드라인 한 번, 분야 머리글 긴 라벨·lucide 아이콘, 개요 분야 이름 바꾸기, 시사점 아이콘 | `modals/DailyBriefingModal.test.tsx` |
| 없음 | 일일 브리핑 대화상자의 나머지 동작(Notion 발행, 이메일 발송 요청, 복사·다운로드, 탭), 설정 대화상자의 `연결 테스트` 요청, 웹훅 설정 모달 | `frontend/src/components/DailyBriefingModal.tsx`, `BriefingSettingsModal.tsx:230` 이하, `WebhookSettingsModal.tsx` |

### 7.5 소스·리서치 (SRC)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 소스 목록 계약(`SourceConfigSchema`) | `ContractAndMsw.test.ts` |
| 있음 | 소스 대화상자(첫 탭, 소스별 `Switch`·삭제 버튼, 삭제 `ConfirmDialog`, Escape 는 확인 창만, 배경 클릭으로 안 닫힘, `새 피드 직접 등록` 의 `aria-controls`, 카테고리 선택지 긴 라벨) | `modals/SourcesModal.test.tsx` |
| 있음 | 딥 리서처 탭 지표 값의 줄바꿈(말줄임 없음) | `modals/DeepResearcherTab.test.tsx` |
| 없음 | `Switch` 를 눌렀을 때의 토글 요청, RSS 추가 폼 제출, 딥 리서처 실행·감사 일지 동작 | `frontend/src/components/SourcesModal.tsx:107`, `sources/SourcesListTab.tsx:66`, `sources/DeepResearcherTab.tsx` |

### 7.6 MCP 서버 (MCP)
| 구분 | 동작 | 근거 |
|---|---|---|
| 없음 | MCP 안내 모달 | `frontend/src/components/McpModal.tsx` |

### 7.7 UI 공통 (UI)
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 테마 시스템, 단축키, 커맨드 팔레트(자리표시 `명령어 검색 또는 바로가기` 포함) | `ThemeSystem.test.tsx`, `HotkeyListener.test.tsx`, `CommandPalette.test.tsx` |
| 있음 | 가로 넘침 방지 클래스, 모바일 viewport(확대 허용)·가상 키보드 | `ResponsiveLayout.test.tsx`, `MobileViewport.test.tsx` |
| 있음 | 헤더(빌드 버전 배지와 값이 없을 때, `주 메뉴` 의 "AI 챗" 링크, 폭별 더보기 항목, ⌘K, 팔레트 추가 명령) | `Header.test.tsx`, `HandoverIntegration.test.tsx` |
| 있음 | 디자인 토큰 규칙(`.tsx` 의 hex·팔레트 색 클래스, `globals.css` 의 `!important` 없음)과 라이트·다크 토큰 대비 | `design/TokenGuard.test.ts`, `design/TokenContrast.test.ts` |
| 있음 | UI 글자의 그림 이모지 금지(`components/**`·`app/**` 정적 검사, 텍스트 표현 기호 허용) | `ui/IconGuard.test.ts` |
| 있음 | 공통 부품(대화상자·드로어·확인 창과 처리 중 포커스, 메뉴·팝오버·테마 메뉴, 탭과 `aria-controls`·스크롤 줄, 토스트와 `composer`·전역 영역 고르기·한 번만 알리기, 입력·표시 부품과 `Badge shrink`, 긴·짧은·레이더 라벨, 카드 지표 표·검색 범위 라벨), 가로 스크롤 줄(`ScrollRow`: 넘침 상태, 흐림, 768px 이상 버튼과 사라질 때 포커스 유지, 768px 미만 넘친 쪽마다 표시·보이지 않는 자리, 상태별 `bleed`, `scroll-px-6`·`data-selected-selector`, 선택·포커스 항목 보이기와 크기 변화 뒤 다시 보이기, 입력 신호 뒤 `scroll` 만 사용자 스크롤로 보는 판정과 가로 의도 휠만 입력 신호로 세기, 스냅 위치 고르기), 오버레이 스택(Escape 맨 위만, `inert`, 같은 렌더 부모·자식 순서), 복사 훅, `useMediaQuery` | `ui/*.test.tsx` |
| 있음 | 챗 헤더의 폭별 "새 대화" 표시 조건, 헤더에 모델 선택 없음, `피드로 돌아가기` 가 헤더 첫 조작 요소(기록 버튼 앞), 기록 버튼 `aria-controls`(열렸을 때만), 추천 질문 왼쪽 정렬·앞 lucide 아이콘·이모지 없이 보내기, 기사 칩 짧은 카테고리 라벨 | `chat/ChatHeader.test.tsx`, `chat/ChatMessageList.test.tsx`, `chat/ActiveSourceChip.test.tsx` |
| 없음 | 폭별 화면 규칙(문서 가로 스크롤, 헤더 높이·한 줄, 첫 화면 카드, 44px 터치 영역, 잘림·자리표시 길이·가림, 카드 줄 맞춤, 세로 간격, 피드 세 영역 배치·끝 맞춤, 카드 바닥 글자, 챗 열 맞춤, 챗 알림 위치). jsdom 은 레이아웃을 계산하지 않는다. `frontend/scripts/ui-audit.mjs` 가 실행 중인 앱에서 따로 잰다 (`make check` 밖) | `frontend/src/app/page.tsx`, `frontend/src/components/chat/ChatWorkspace.tsx` |
| 없음 | 첫 그리기 전 테마 적용 인라인 스크립트 | `frontend/src/app/layout.tsx:23-32` |
| 없음 | 프론트 헬스 라우트, 챗 페이지 래퍼 | `frontend/src/app/api/health/route.ts`, `frontend/src/app/chat/page.tsx` |

### 7.8 설정 (frontend 환경변수)
| 구분 | 동작 | 근거 |
|---|---|---|
| 없음 | 프론트 환경변수 검증 | `frontend/src/lib/env.ts` |

---

## 8. 외부 호출과 알려진 불일치

### 8.1 외부 호출 판정 (frontend)
판정 기준: '외부 호출함' 은 mock 없이 인터넷 호스트로 요청을 보내는 경로가 테스트에서 항상 실행된다는 뜻이고, '조건부' 는 상태에 따라 갈린다. 로컬호스트(jsdom 문서 origin) 요청은 '로컬' 로 따로 적는다.

| 항목 | 판정 | 근거 `path:line` |
|---|---|---|
| `chat/HandoverIntegration.test.tsx` 의 Header 테스트 (`renders AI 챗 link in Header navigation bar pointing to /chat`) | 조건부 (로컬) | Header 가 `useCollector` 로 마운트 시 `fetchScheduleStatus()` 를 불러 `/api/schedule/status` 를 요청한다 (`frontend/src/components/Header.tsx:60`, `frontend/src/hooks/useCollector.ts:108-118`, `frontend/src/lib/api.ts:171-173`). 기본 MSW 핸들러에 schedule 경로가 없고 `onUnhandledRequest: 'bypass'` (`frontend/src/tests/setup.ts:70`)라 jsdom 문서 origin 으로 실제 fetch 가 나간다. 실패는 `.catch(() => {})` 로 무시된다 (`useCollector.ts:118`). `Header.test.tsx`, `modals/ScheduleModal.test.tsx` 는 `vi.mock('@/lib/api')` 로, `hooks/useCollector.test.ts` 는 `server.use` 로 이 요청을 막는다 |
| 그 밖의 frontend 테스트 | 안 함 | 채팅·뉴스 요청은 상대 경로이고 MSW `*/api/...` 핸들러가 받는다 (`frontend/src/mocks/handlers.ts:218-480`, `frontend/src/mocks/handlers/chat.ts:250-1153`). 정적 검사 3개(`TokenGuard`, `TokenContrast`, `IconGuard`)는 저장소 파일만 읽는다 |

### 8.2 계약·MSW 관련
- MSW 에만 있는 엔드포인트: `GET /api/chat/stream` (`frontend/src/mocks/handlers.ts:480`) 을 `ContractAndMsw.test.ts` 두 테스트(`handles GET /api/chat/stream SSE streaming mock`, `handles GET /api/chat/stream with searchParam model_tier=opus`)가 검증하지만 backend 에는 `POST /api/chat/stream` 만 있다 (`backend/app/api/chat.py:276`).
- `ContractAndMsw.test.ts` 의 MSW 테스트는 mock 핸들러 자체의 동작을 검증하며 backend 와의 일치를 확인하지 않는다. backend 응답 형식과 frontend zod 스키마를 함께 대조하는 테스트는 없다.
- API 수준 401(키 누락)·529(과부하) 응답은 frontend MSW 트리거(`ContractAndMsw`)만 있고 backend 테스트가 없다 (`backend/app/api/chat.py:212-237`, `350-375`).

### 8.3 이름·설명과 실제 단언의 불일치
- `feed/FeedToolbar.test.tsx` 의 `⑤ places the fixed Must-Read toggle after the source group and before sort at %ipx (R34)` 는 이름에 'before sort' 가 남아 있지만 정렬은 `FeedToolbar` 에 없고 (`FeedStatusBar` 로 옮겨짐, 단계 50), 단언은 토글이 소스 그룹 뒤이고 그 줄의 마지막 자식인지만 본다.
- `chat/CitationBadge.test.tsx` 의 `visually differentiates supplementary citation [S1] with emerald styling…` 의 'emerald' 는 옛 색 이름이다. 단언은 `data-tone="supplementary"` 와 토큰 클래스 `text-success` 를 본다.
- `chat/FocusCapsule.test.tsx` 의 이름 `[🎯 포커스: 전체 소식 ▾]`, `[🎯 포커스: MCP · 최근 7일 ✕]` 에는 그림 이모지가 남아 있다. 이름일 뿐이고, `IconGuard` 는 `components/**`·`app/**` 만 보므로 테스트 파일은 대상이 아니다.

### 8.4 lint 경고 (고치지 않음, 보고만)
- 4.2절의 경고 41개. 제품 코드 경고 3개: `components/chat/ChatWorkspace.tsx:508` (`react-hooks/exhaustive-deps`, `useCallback` 에 `selectedTier` 빠짐), `components/chat/useChatSessions.ts:14`·`:16` (쓰지 않는 import `fromChatFocusFilter`, `chatMessageItemToUiMessage`). 이 작업은 문서화라 고치지 않았다.

### 8.5 건너뛰는 테스트
- `skip`, `xfail`, `.only`, `.todo` 는 frontend 에 없다. frontend 649개는 2026-11-09 모두 통과했다.

---

## 9. 옛 문서에서 옮긴 내용과 정정

| 옛 문서·절 | 이 문서의 위치 |
|---|---|
| `docs/test-cases.md` 머리 (개수 확인 방법, `vitest list` 576 차이) | 4.1, 5.1 |
| `docs/test-cases.md` `### frontend` 의 `setup.ts` 와 파일별 표 52개 | 6절 (그대로 옮기고 표 머리말만 6.x 로) |
| `docs/test-cases.md` `## 기능 영역별 커버리지` 의 frontend 행 | 7절 (backend 행은 `docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md`) |
| `docs/test-cases.md` `## 외부 호출 판정` 의 frontend 행 2개 | 8.1 |
| `docs/test-cases.md` `## 알려진 불일치·위험` 의 frontend 항목 (FeedToolbar 이름, MSW 에만 있는 경로, MSW 계약 검증 한계, 건너뛰기 없음) | 8.2, 8.3, 8.5 |
| `docs/test-strategy.md` frontend 검사 명령, 테스트 종류의 frontend 행(단위·정적 검사·계약·화면 측정), MSW·`setup.ts`·jsdom 문단, `ui-audit.mjs` 실행·판정 요약, 'E2E 없음' | 5절 (`ui-audit.mjs` 판정 표·fixture 상세는 `docs/ui-system-designer/01_COMPONENT_SPEC.md`) |
| `docs/test-strategy.md` 통과 기준의 frontend 항목 ('계약을 바꿨으면 `ContractAndMsw.test.ts` 가 바뀐 계약으로 통과') | 9.1 |

### 9.1 통과 기준 (frontend)
- `make check` 종료 코드 0 (frontend 부분: vitest 전체 통과, eslint 오류 0, `tsc --noEmit` 오류 0).
- 버그 수정은 먼저 실패하던 테스트가 통과한다.
- 계약을 바꿨으면 `chat/ContractAndMsw.test.ts` 가 바뀐 계약으로 통과한다.

### 9.2 코드와 옛 문서가 달랐던 곳 (이 문서에서 고침)
- `Header.tsx` 의 `useCollector` 호출: 옛 문서 `Header.tsx:62` → 지금 `:60`.
- `useCollector.ts` 의 `fetchScheduleStatus` 호출과 무시하는 `.catch`: 옛 문서 `useCollector.ts:82-90`, `:89` → 지금 `:108-118`, `:118`.
- MSW 챗 핸들러 범위: 옛 문서 `mocks/handlers/chat.ts:243-1098` → 지금 `chatHandlers` 선언 `:246`, 핸들러 `:250-1153`.
- `94fdf8e` 커밋 메시지의 '남은 경고 41개는 기존 테스트 파일의 미사용 변수' 는 지금 실행과 다르다: 41개 중 테스트 파일 14, `src/mocks/**` 24, 제품 코드 3 (8.4).
- 옛 문서의 frontend 개수(52개 파일, 649개)와 테스트 이름은 지금 코드와 같다 (4.1).
