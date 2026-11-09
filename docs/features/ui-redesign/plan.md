# Plan: 디자인시스템과 반응형 UI/UX 재설계

Spec: ./spec.md
Status: approved
Approved-by: 자동 승인 (Claude) (2026-11-07)
Type: feature
Revision: 2026-11-06 2차 보충 — spec 2차(R14~R32, 설계 14, 커밋 0ef0908)에 맞춰 '변경 파일' 2차 목록, 작업 순서 19~28단계, 위험·증명 2차 항목을 더했다. 1~18단계(모두 done)는 바꾸지 않았다
Revision: 2026-11-06 3차 보정 (이전 승인: 자동 승인 (Claude) 2026-11-06) — 27 1회차 프로덕션 측정(`tasks/ui-redesign/27-prod-audit.md`)과 스크린샷 확인에서 남은 결함 4건(커맨드 팔레트 자리표시 360 잘림, 딥 리서처 `정기 스케줄` 값 말줄임, 레이더 카테고리 영문 라벨, 768 미만 스크롤 줄 넘침 표시가 소스 줄에만 있음)을 고친다. 새 29단계, 20·21·22·23 후속, 관문 G6·G7, 27 재측정 순서를 더했다. '변경 파일' 3차 목록, 작업 순서 '3차 보정', 위험·증명 3차 항목을 더했고 1~28단계 본문은 바꾸지 않았다 (20·21·22·23·27·28 끝에 '후속' 줄만 더함). spec 은 바꾸지 않는다 (R15·R16·R19 범위 안, 해석 하나는 '위험' 3차에 적음)
Revision: 2026-11-06 리뷰 후속 보정 (이전 승인: 자동 승인 (Claude) 2026-11-06) — spec 리뷰 후속 보정(커밋 e877b6b: R15·R17·R23·R27·R29·R30 보강, 새 R33, 14.2·14.3·14.4·14.7 C-2·C-7 ④·14.8·14.9·14.10·14.12, 우려 20~22)에 맞춰 '리뷰 후속 기준선', '변경 파일' 의 '리뷰 후속' 목록, 작업 순서 30~37단계와 관문 G8~G10, 위험·증명의 리뷰 후속 항목을 더했다. 담당은 기존 implementer 를 이어 쓴다 (A·B·C·D·E·H). 1~29단계 본문과 1·2·3차 목록·위험·증명은 바꾸지 않았다
Revision: 2026-11-06 리뷰 후속 보정 3 (이전 승인: 자동 승인 (Claude) 2026-11-06) — spec 리뷰 후속 보정 3(커밋 2034bcc: R15, 14.3 '(보정 3)', 14.8 `scrollRow`·fixture·360·390 소스 줄 증거, 새 14.13, 우려 23·24)에 맞춰 작업 순서 '보정 3'(31 B 후속 3 → 34 E 후속, 30 A 후속 2, 관문 G11, 36 A 재측정 4, 관문 G12, 37 후속), '증명' 의 '리뷰 후속에서 바꾸는 기존 단언' 표에 spec 14.13 의 5곳, 위험·증명 보정 3 항목을 더했다. 새 변경 파일은 없다 (모두 '리뷰 후속' 목록에 같은 담당으로 있음). 1~37단계 본문은 30·31·34·36·37 끝에 '후속' 줄만 더했다
Revision: 2026-11-06 known-issues 사후 보정·R33 문구 맞춤 (이전 승인: 자동 승인 (Claude) 2026-11-06, verifier 편차) — ① 37단계(커밋 a9ea174)에서 메인 세션이 판단해 `docs/known-issues.md` 'UI·접근성' 에 1행(360·390 첫 화면 피드 소스 줄 `Must-Read` 미노출, `‹` 단서만, spec 우려 23)을 더했다. 그때 이 plan 은 그 파일을 리뷰 후속 문서 목록에서 명시적으로 빼고 있었다 ('여전히 목록 밖', '목록 밖이면 고치기 전에 plan 을 고쳐 재승인'). 즉 편집이 plan 승인보다 먼저였고, 이 보정은 그 편집을 사후에 범위에 넣는다. 고친 곳: '변경 파일' 리뷰 후속 문서 목록에 `docs/known-issues.md`(37) 추가, '리뷰 후속에서 바꾸지 않는 것'·보정 3 문단의 '목록 밖' 서술, 위험 보정 3 의 우려 23 항목, 37 후속에 그 행과 끝 기준(행 존재 확인). ② spec 리뷰 후속 보정 4(커밋 5c948cf)가 R33 의 유지 대상을 노드·포커스·입력 값·가상 키보드로 한정하고 칩 줄 `scrollLeft` 는 R15 '선택 칩 다시 보이기' 규칙을 따른다고 고쳐, 리뷰 후속 증명 ⑥-4 와 34 의 테스트 ② 설명을 같은 뜻으로 맞췄다
Revision: 2026-11-07 리뷰 후속 보정 5 (이전 승인: 자동 승인 (Claude) 2026-11-06) — spec 리뷰 후속 보정 5(커밋 e274563: 새 R34 Must-Read 정렬 옆 고정 토글(제품 오너 결정, 우려 23 닫음), R15·R33 '사용자 스크롤 = 입력 신호 뒤 `scroll`', 14.2·14.3 '(보정 5)', 14.8 `toolbar.mustReadVisible`, 14.10, 새 14.14, 우려 25·26)에 맞춰 작업 순서 '보정 5'(34 E 후속 3 · 31 B 후속 4 · 30 A 후속 4 병렬 → 관문 G13 → 36 A 재측정 5 → 관문 G14 → 37 후속 2), '증명' 의 바뀌는 기존 단언 표에 spec 14.14 의 5곳, 위험·증명 보정 5 항목을 더했다. 이미 끝난 30 후속 3(reviewer 재리뷰 Nit 1: `clip` ① 스크롤바 면제를 768 이상으로, fixture `3a393df` → 수정 `345112d`)을 기록했다 (plan 보정 없이 기존 30 소유 파일 안에서 한 일). 31 후속 4 는 `ChipGroup.test.tsx:619` 충돌로 blocked(`0330596`)였고 이 보정이 그 단언 변경을 표에 넣어 푼다. 새 변경 파일은 없다 (모두 '리뷰 후속' 목록에 같은 담당으로 있음). '변경 파일' 의 `docs/known-issues.md` 설명에 행 삭제(37 후속 2)를 더했다. 1~37 본문은 30·31·34·36·37 끝에 '후속' 줄만 더했다
Revision: 2026-11-07 리뷰 후속 보정 6 (이전 승인: 자동 승인 (Claude) 2026-11-07) — spec 리뷰 후속 보정 6(커밋 db97826, reviewer 최종 확인 Nit 1·2)에 맞춰 작업 순서 '보정 6'(31 B 후속 5 → 관문 G15 → 36 A 재측정 6(HEAD 1회, 권장) → 관문 G16 → 37 후속 3)을 더했다. Nit 2: `wheel` 은 가로 의도(`Math.abs(deltaX) > Math.abs(deltaY) || shiftKey`)일 때만 입력 신호 — `ScrollRow.tsx`·`ChipGroup.test.tsx`(새 단언 ⑤⑥, 바뀌는 기존 줄 `:619`·`:950`). Nit 1: spec 14.8 `clip` ① 문구 정정은 구현(`ui-audit.mjs:795-797` `hExempt`, 30 후속 3)이 이미 맞아 코드 변경이 없다고 기록했다. 측정 판정(`frontend/scripts`)이 바뀌지 않아 1ec8a9b 기준선은 다시 재지 않고, 앱 동작이 바뀌므로 HEAD 전체 측정 1회를 권장 단계로 둔다 (환경이 없으면 G15 검사·31 의 Chrome 확인으로 대신하고 그 사실을 적는다). '바뀌는 기존 단언' 표에 보정 6 두 줄, 위험·증명 보정 6 항목을 더했다. reviewer 최종 Nit 3(30 후속 3 사후 기록)은 verify.md 편차 C 로 이미 기록됐다. 새 변경 파일은 없다. 1~37 본문은 31·36·37 끝에 '후속' 줄만 더했다
Revision: 2026-11-07 보정 7 (이전 승인: 자동 승인 (Claude) 2026-11-07) — spec 보정 7(커밋 8d643d2, 14.15, R35~R40: 768 미만 툴바 줄 B 줄바꿈, 카드 원천 지표, 챗 스코프 탭·용어 통일, 모델 선택 한 곳, 포커스 시트 라벨)에 맞춰 '변경 파일' 의 '보정 7' 목록(새 경로 `tests/chat/FocusBottomSheet.test.tsx`·`FocusCapsule.test.tsx`·`ChatPromptInput.test.tsx`, 2차 '바꾸지 않는 것' 의 `FocusBottomSheet.tsx` 해제), 작업 순서 '보정 7'(새 단계 38~44, 관문 G17~G19), 위험·증명 보정 7 항목과 '보정 7 에서 바뀌는 기존 단언' 표를 더했다. 담당은 기존 implementer 를 이어 쓴다 (A ui-audit·측정, D 라벨·카드, E 툴바, F 챗). 1~37 본문은 바꾸지 않았다
Revision: 2026-11-07 보정 7 정정 (이전 승인: 자동 승인 (Claude) 2026-11-07) — spec 보정 7 정정(커밋 17b6bc9, 42단계 implementer blocked 보고 두 건)을 반영했다. ① '보정 7 에서 바뀌는 기존 단언' 표에 `chat/ChatSessionWorkflow.test.tsx:58`(`/단일 기사|Scoped/i` → `'단일 기사'` 정확 일치, `:59` `aria-pressed` 단언 그대로) 행을 더하고 '변경 파일' 보정 7 목록에 그 파일(42)을 넣었다. 그 줄을 '그대로 성립하는 단언' 목록에서 뺐다. spec 우려 27 의 파일 목록에는 이 줄이 빠져 있다 — plan 은 spec 14.15 표(정정본)를 따른다. ② R40 의 예전 시트 라벨 정적 확인을 따옴표 포함 형태(`rg "'하네스·평가'|'MCP·도구'|'에이전트 기술'|'AI 뉴스'"`)로 좁혔다 (`SessionEmptyState.tsx:48` 문장 오검출). 다른 곳은 그대로다
Revision: 2026-11-07 보정 7 문서 목록 정정 (이전 승인: 자동 승인 (Claude) 2026-11-07) — 44단계 문서 반영(c65516a) 뒤에도 `docs/functional-spec/07-ui-common.md` 에 지금 동작과 다른 줄 2개(`:262` 챗 헤더 768~1023 열의 `모델 칩` — R39, `:323` 알림 문구 `전체 뉴스 모드` — R38)가 남아, 그 파일을 '변경 파일' 보정 7 문서 목록과 44 본문에 더했다 (44 끝 뒤 메인 세션이 고친다). 44 본문에 `docs/known-issues.md`(이미 목록에 있음)의 backend 테스트 2개 행을 확인된 원인(테스트 환경 격리 문제)으로 고친다는 한 줄을 더했다. 다른 곳은 그대로다

## 시작 전 기준선 (2026-11-06, 이 plan 작성 때 측정)
- `cd frontend && pnpm test`: 24 파일, 241 테스트 통과.
- `pnpm exec tsc --noEmit`: 통과.
- `pnpm lint`: 22 파일에서 오류 54개, 경고 63개. 경고는 실패로 치지 않는다. 오류 위치는 단계 01~03 에 줄 단위로 적었다.
- `puppeteer-core` 는 이미 devDependency 다 (`frontend/package.json`). 의존성을 더하지 않는다.
- `src/tests/setup.ts` 는 `matchMedia`·`ResizeObserver`·clipboard 를 목으로 두지 않는다. `scrollIntoView` 는 빈 함수로 둔다.

### 2차 기준선 (2026-11-06, 19단계 이후 작성 때 측정, HEAD 0ef0908)
- `git diff --quiet 1ec8a9b HEAD -- frontend` 가 참이다. 0ef0908 은 문서만 바꿨으므로 지금 `frontend/` 는 2차 수정 전 코드(R30 의 `1ec8a9b`)와 같다.
- `cd frontend && pnpm test`: 43 파일, 458 테스트 통과. `pnpm lint`: 오류 0, 경고 41. `pnpm exec tsc --noEmit`: 종료 0.
- `setup.ts` 는 여전히 `ResizeObserver` 를 목으로 두지 않는다 (1차 05 가 `matchMedia` 만 더함). 2차도 `setup.ts` 를 바꾸지 않는다.
- `docs/features/ui-redesign/audit/` 에는 1차 `report.json`(next dev 기준 110/110)과 PNG 8장(`{feed,chat}-{light,dark}-{390x844,1440x900}.png`)이 있다.
- 라벨 표가 흩어진 곳: `lib/labels.ts:5-10`(영문), `feed/FeedToolbar.tsx:11-17`, `chat/FocusCapsule.tsx:19-25`, `chat/FocusBottomSheet.tsx:29-35`(우려 18, 그대로 둠), `sources/SourcesListTab.tsx:23-28`. `categoryLabel` 을 쓰는 곳: `NewsCard.tsx:96`, `NewsDetailModal.tsx:216`, `chat/CitationPopover.tsx:62`, `sources/SourcesListTab.tsx:233`, `sources/DeepResearcherTab.tsx:178`.

### 리뷰 후속 기준선 (2026-11-06, HEAD e877b6b, 이 보정 작성 때 측정)
- `cd frontend && pnpm test`: 50 파일, 555 테스트 통과. 작업 트리는 `frontend/AGENTS.md`·`frontend/CLAUDE.md`(추적 안 됨) 외에 깨끗하다.
- `docs/features/ui-redesign/audit/report.json`: `environment.commit` `3300dc3`, 조합 150 모두 통과. `clip` 판정 ④ 와 `chatAlign` 알파 판정 없이 낸 값이다 (우려 22).
- `frontend/src/components/ui/Badge.tsx` 와 `frontend/src/tests/ui/Primitives.test.tsx` 는 1차 글롭(`frontend/src/components/ui/**`, `frontend/src/tests/ui/**`, 05)으로만 열려 있고 2·3차 목록에 따로 없다. 담당을 밝히려고 '리뷰 후속' 목록에 33 담당으로 적는다.
- spec 14.12 가 짚은 코드 줄 (HEAD 에서 다시 확인): `ScrollRow.tsx` 스크롤 버튼 `:141-173`·선택 자식 보이기 effect `:100-107`·넘침 표시 `:174-187`, `Chip.tsx` `ChipGroup`(`:89-116`)이 `selectedSelector` 를 넘기지 않음, `FeedToolbar.tsx` `useToolbarLayout` `:75-81`·폭별 트리 `:236-268`·`max-md:flex-col-reverse` `:259`·파일 머리 표 `:91-99`, `Toast.tsx` 알림 `role`·`aria-live` `:194-198`, `useCollector.ts` `loadStatus` `:93-103`·완료 처리 `:118-123`, `NewsCard.tsx` 배지 줄 `:146-158`, `Badge.tsx:24`(`max-w-full shrink-0`), `ui-audit.mjs` `clip` ① `:709-741`·`painted` `:1011-1016`.
- `IconButton` 은 `ref`·`onFocus`·`onBlur` 를 `...rest` 로 버튼에 넘기고(`IconButton.tsx:33,48`), `Chip` 도 `data-*` 속성을 `...rest` 로 넘긴다. 두 파일은 고치지 않는다.
- spec R33 의 정적 확인 `rg "useMediaQuery\|\border-\|-reverse" …` 는 rg 에서 `\|` 가 글자 `|` 라 지금 코드에서도 출력이 없다 (확인함: 같은 파일에 `useMediaQuery` 3줄, `-reverse` 1줄이 있는데 출력 없음, 종료 1). 이 plan 은 `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx` 를 쓴다 (지금 4줄 출력).

## 변경 파일
게이트 경로(`frontend/src/**`)는 이 목록에 있는 것만 고칠 수 있다. 각 줄의 담당 단계는 '작업 순서' 에 있다.

앱·전역
- `frontend/src/app/globals.css` — 토큰(`:root`·`.dark`·`@theme inline`·`@theme`), `@custom-variant dark`, base 레이어 (04). 옛 `html:not(.dark)`·`html.dark` 덮어쓰기와 `!important` 제거 (15)
- `frontend/src/app/layout.tsx` — viewport, 인라인 테마 스크립트, Geist 제거, `#app-shell` (04). `<ToastRegion />` 마운트 (07)
- `frontend/src/app/page.tsx` — 헤더·단축키 연결 (09), 피드 화면 구성 (10)
- `frontend/src/app/chat/page.tsx` — 팔레트 색 클래스 2곳을 토큰으로 (13)
- `frontend/src/context/ThemeContext.tsx` — `useSyncExternalStore` + `lib/theme-store.ts` 로 다시 쓰기. 내보내는 이름·props 유지 (04)

새 공통 부품·모듈 (모두 새 파일)
- `frontend/src/components/ui/**` — 공통 부품 (05 기초, 06 폼·표시, 07 오버레이). 묶음 파일(`index.ts`)을 두지 않는다. 각 부품을 경로로 import 한다 (`@/components/ui/Button`)
- `frontend/src/lib/cn.ts` — 클래스 이어 붙이기 도우미 (05)
- `frontend/src/lib/theme-store.ts` — 테마 외부 저장소 (04)
- `frontend/src/lib/overlay-stack.ts` — 오버레이 스택 + `useOverlayOpen()` (07)
- `frontend/src/lib/labels.ts` — 카테고리·소스 표시 라벨 (06)
- `frontend/src/hooks/useMediaQuery.ts` — (05)
- `frontend/src/hooks/useCopyToClipboard.ts` — (06)
- `frontend/src/hooks/useFocusTrap.ts` — (07)
- `frontend/src/hooks/useScrollLock.ts` — 참조 수 세는 스크롤 잠금 (07)
- `frontend/src/hooks/useHotkey.ts` — 조합키 단축키 (07)
- `frontend/src/hooks/useCollector.ts` — 수집 상태 공유 저장소·폴링 (09)

피드·헤더·모달
- `frontend/src/components/Header.tsx` — lint (03), 다시 쓰기 (09)
- `frontend/src/components/CommandPalette.tsx` — lint (03), 다시 쓰기 (09)
- `frontend/src/components/HotkeyListener.tsx` — `blockSingleKeys`, Enter/Space 조건, `e.code` 판정 (09)
- `frontend/src/components/ThemeToggle.tsx` — 토큰, `showDropdown` → `ThemeMenu` (07)
- `frontend/src/components/ScheduleModal.tsx` — lint (02), `Dialog`·즉시 수집·위험 영역 (09)
- `frontend/src/components/ResetConfirmDialog.tsx` — 새 파일. 초기화 확인 창 (Header·ScheduleModal 공용) (09)
- `frontend/src/components/feed/**` — 새 파일 `InsightsBar.tsx`, `TrendRadarPanel.tsx`, `FeedToolbar.tsx`, `FeedStatusBar.tsx`, `FeedPagination.tsx`, `NewsCardSkeleton.tsx` (10)
- `frontend/src/components/CategoryFilter.tsx` — 지움 (10, `FeedToolbar` 로 대체)
- `frontend/src/components/SourceFilter.tsx` — 지움 (10)
- `frontend/src/components/TechRadar.tsx` — 지움 (10, `feed/TrendRadarPanel.tsx` 로 옮김)
- `frontend/src/components/DailyBriefingBanner.tsx` — 지움 (10, `InsightsBar` 로 대체)
- `frontend/src/components/NewsCard.tsx` — lint (03), 다시 쓰기 (10)
- `frontend/src/components/NewsDetailModal.tsx` — lint (02), `Dialog`·`Tabs`·`ConfirmDialog` (11)
- `frontend/src/components/news-detail/AskAiPanel.tsx` — 토큰·입력 (11)
- `frontend/src/components/DailyBriefingModal.tsx` — lint (02), 다시 쓰기 (11)
- `frontend/src/components/McpModal.tsx` — `Dialog`·`CodeBlock` (11)
- `frontend/src/components/BriefingSettingsModal.tsx` — lint (02), 다시 쓰기 (12)
- `frontend/src/components/WebhookSettingsModal.tsx` — lint (02), 토큰만 (12)
- `frontend/src/components/SourcesModal.tsx` — lint (02), 다시 쓰기 (12)
- `frontend/src/components/sources/DeepResearcherTab.tsx` — (12)
- `frontend/src/components/sources/SourcesListTab.tsx` — lint (02), 다시 쓰기 (12)
- `frontend/src/components/MarkdownViewer.tsx` — 토큰, 14px, `CodeBlock` 재사용 (14)
- `frontend/src/hooks/useBookmarks.ts` — lint만, 키·형식 유지 (03)
- `frontend/src/hooks/useNewsFeed.ts` — lint (03), 목록이 바뀌면 포커스 초기화에 필요한 값만 (10)

AI 챗
- `frontend/src/components/chat/**` — 아래 파일과 새 `ChatContextBar.tsx`. 담당: lint (01: `ChatMessageItem.tsx`, `ChatModelSelector.tsx`, `ChatWorkspace.tsx`, `useChatSessions.ts`), 셸 (13: `ChatWorkspace.tsx`, `ChatHeader.tsx`, `ChatContextBar.tsx`, `ActiveSourceChip.tsx`, `ChatSidebar.tsx`, `ChatSidebarHeader.tsx`, `ChatHistoryDrawer.tsx`, `SessionList.tsx`, `SessionItemCard.tsx`, `SessionEmptyState.tsx`, `SessionListSkeleton.tsx`, `DeleteConfirmPopover.tsx`), 메시지·입력 (14: `ChatMessageList.tsx`, `ChatMessageItem.tsx`, `CitationBadge.tsx`, `CitationPopover.tsx`, `WorkflowStepTracker.tsx`, `ExportToolbar.tsx`, `ModelTierBadge.tsx`, `ModelChangeDivider.tsx`, `ChatModelSelector.tsx`, `ChatPromptInput.tsx`, `FocusCapsule.tsx`, `FocusBottomSheet.tsx`), 피드 쪽 (10: `HandoverCtaButton.tsx`). `useChatSessions.ts` 는 01 에서 lint 만 고친다 (키·형식 유지)

lint 만 고치는 계약 쪽 파일 (타입 표기만. 스키마 객체·내보낸 타입 이름·필드·응답 본문 불변, spec 설계 12)
- `frontend/src/lib/api.ts` — 108, 458, 504, 521, 538, 573, 580행의 `any` (02)
- `frontend/src/types/chat.ts` — 929행 `ChatHeaderProps.activeSource?: any | null` (01)
- `frontend/src/mocks/handlers.ts` — 64~65행 `(art as any)` (01)
- `frontend/src/mocks/handlers/chat.ts` — 47행 `as any` (01)

테스트 (기존 파일은 아래 줄만 고친다. 단언을 약하게 하지 않는다)
- `frontend/src/tests/setup.ts` — 기본 `matchMedia` 목 추가 (05). 이유는 '증명' 의 표
- `frontend/src/tests/ThemeSystem.test.tsx` — 39, 42행 `any` 타입 표기만 (01)
- `frontend/src/tests/chat/ContractAndMsw.test.ts` — 534, 776, 777행 `any` 타입 표기만 (01)
- `frontend/src/tests/chat/MobileViewport.test.tsx` — 16~19행 viewport 단언 (04, 우려 사항 2)
- `frontend/src/tests/chat/ChatSidebar.test.tsx` — 240~241행 (13, 우려 사항 1)
- `frontend/src/tests/chat/ChatHeader.test.tsx` — 새 테스트 추가만 (13)
- `frontend/src/tests/chat/ChatMessageItem.test.tsx` — 188, 266행 (14, 우려 사항 1)
- `frontend/src/tests/chat/CitationBadge.test.tsx` — 99~100행 (14, 우려 사항 1)
- `frontend/src/tests/chat/ChatWorkspace.test.tsx` — 261행 (14, 우려 사항 1)
- `frontend/src/tests/Header.test.tsx` — 새 파일 (09)
- `frontend/src/tests/HotkeyGating.test.tsx` — 새 파일 (09)
- `frontend/src/tests/ui/**` — 새 파일: `Primitives.test.tsx` (05), `Tabs.test.tsx`, `FormControls.test.tsx`, `useCopyToClipboard.test.tsx` (06), `OverlayStack.test.tsx`, `Dialog.test.tsx`, `Menu.test.tsx`, `Toast.test.tsx` (07)
- `frontend/src/tests/feed/**` — 새 파일 `FeedToolbar.test.tsx`, `InsightsBar.test.tsx` (10)
- `frontend/src/tests/modals/**` — 새 파일 `ScheduleModal.test.tsx` (09), `NewsDetailModal.test.tsx` (11), `SourcesModal.test.tsx`, `BriefingSettingsModal.test.tsx` (12)
- `frontend/src/tests/design/**` — 새 파일 `TokenGuard.test.ts`, `TokenContrast.test.ts` (15)

게이트 밖 파일
- `frontend/scripts/ui-audit.mjs` — 새 파일. 폭별 화면 검사 (08 작성, 16 실행)
- `frontend/next.config.ts` — `env.NEXT_PUBLIC_APP_VERSION` 에 `package.json` 의 `version` 주입 (리뷰 후 추가, 18. spec 설계 3, 근거 E16)
- `docs/features/ui-redesign/audit/**` — `report.json` 과 대표 PNG 8장 (16)

통합·상세 문서 (17)
- `docs/design-system.md` — 새 문서 (spec 설계 10 의 1~9절)
- `docs/ui-spec.md` — viewport, 와이어프레임, 모달 표, 컴포넌트 트리, 상태 관리, '스타일 체계', 알려진 불일치 7(헤더)·9·10·13
- `docs/functional-spec/07-ui-common.md` — UI-01·02·04~11·13·14, 단축키 표, 상수 표, 알려진 불일치 1~15·17~19·20(`showDropdown`)
- `docs/functional-spec/01-news-feed.md` — NEWS-02~06·08·09·14·16~18, 알려진 불일치 '상세 모달 원값 표시'·'헤더 버전'
- `docs/functional-spec/02-ai-chat.md` — CHAT-07·15·16·17·25 진입점
- `docs/functional-spec/04-briefing-and-sharing.md` — BRF-02·03·11 진입점
- `docs/functional-spec/05-sources-and-research.md` — SRC-02·06·07 진입점·확인 창
- `docs/functional-spec/06-mcp-server.md` — MCP-07 진입점
- `docs/known-issues.md` — 'UI·접근성' 7행, '설정과 코드 불일치' 헤더 버전 행
- `docs/tech-spec.md` — '공통 규칙' 한 줄, '상세 문서' 행, '기술 선택과 근거' 4행, '변경 이력' 행
- `docs/test-strategy.md` — 테스트 수, 정적 검사(토큰·대비) 종류, `ui-audit` 수동 검사
- `docs/test-cases.md` — 새 테스트 파일 목록과 영역별 커버리지
- `docs/functional-spec/README.md` — 기능명세 색인 갱신 (구현 후 추가, 17)
- `docs/product.md` — 트렌드 레이더 위치 서술 갱신 (요약 바로 옮김, 구현 후 추가, 17)

### 2차 (19~28단계, spec 설계 14)
한 줄에 경로 하나다 (hook 은 줄의 첫 백틱만 읽는다). 괄호 안 숫자가 담당 단계이고, 한 파일은 한 단계만 고친다. '필요할 때만' 표시가 있는 파일은 그 단계가 고칠 수 있는 범위를 미리 열어 둔 것이고, 바꿀 일이 없으면 두지 않는다. 1차 목록의 글롭과 겹치는 경로도 2차 담당을 밝히려고 다시 적는다.

ui-audit (게이트 밖)
- `frontend/scripts/ui-audit.mjs` — 14.8 검사 10개, 측정 상태 추가, 환경 확인(종료 2), 스크린샷 24장, `--self-test`·`--commit` (19. 27 에서 판정 오탐을 고칠 때도 19 의 연장으로 기록)
- `frontend/scripts/ui-audit-fixtures/defects.html` — 새 파일. 검사마다 고정 결함, `data-expect` 표시 (19)
- `frontend/scripts/ui-audit-fixtures/clean.html` — 새 파일. 모든 검사가 통과해야 하는 페이지 (19)
- `frontend/scripts/ui-audit-fixtures/dev-indicator.html` — 새 파일. `nextjs-portal` 이 있는 페이지, 환경 오류 판정 확인용 (19)
- `docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json` — 새 파일. 수정 전 코드 측정 결과 (19)
- `docs/features/ui-redesign/audit/report.json` — 2차 전체 측정 결과로 덮어씀 (27)
- `docs/features/ui-redesign/audit/*.png` — 대표 스크린샷 24장. 새 이름 규칙에 없는 이전 PNG 는 지움 (27)

공통 부품·모듈
- `frontend/src/app/globals.css` — `@layer base` 의 `body` 에 `word-break: keep-all; overflow-wrap: break-word;`, 스크롤 줄 흐림 규칙(쓰는 경우). 색 토큰 값은 바꾸지 않는다 (20)
- `frontend/src/components/ui/Chip.tsx` — `ChipGroup scrollable` 을 `ScrollRow` 로, 상시 마스크 제거, `bleed`, `Chip` 의 `iconClassName`·`data-chip-icon` (20)
- `frontend/src/components/ui/ScrollRow.tsx` — 새 파일. 가로 스크롤 줄 감싸개 (스크롤 버튼, `data-scroll-row`, `data-overflow`) (20)
- `frontend/src/hooks/useScrollOverflow.ts` — 새 파일. 넘침 상태 훅 (20)
- `frontend/src/components/ui/TextField.tsx` — 입력 요소 기본 클래스에 `text-ellipsis` (20)
- `frontend/src/components/ui/SearchField.tsx` — `TextField` 변경으로 부족할 때만 (20)
- `frontend/src/lib/overlay-stack.ts` — 레이어 `order`(렌더 순서 번호), 정렬된 스택, 모달 존재 구독 (21)
- `frontend/src/components/ui/Toast.tsx` — `ToastRegion placement?: 'global' | 'composer'`, 영역 고르기, `data-toast-region` 값 (21)
- `frontend/src/components/ui/Tabs.tsx` — 패널이 렌더된 탭에만 `aria-controls` (21)
- `frontend/src/components/ui/Dialog.tsx` — `useOverlayLayer` 호출부가 바뀌어야 할 때만 (21)
- `frontend/src/components/ui/Drawer.tsx` — 같은 이유일 때만 (21)
- `frontend/src/components/ui/Menu.tsx` — 같은 이유일 때만 (21)
- `frontend/src/components/ui/Popover.tsx` — 같은 이유일 때만 (21)
- `frontend/src/components/ui/ConfirmDialog.tsx` — 같은 이유일 때만 (21)
- `frontend/src/lib/labels.ts` — 긴 라벨 `CATEGORY_LABELS`, 짧은 라벨 `CATEGORY_SHORT_LABELS`, `categoryShortLabel()` (22)
- `frontend/src/lib/feed-insights.ts` — 새 파일. `findRepeatedInsights()` (22)

피드
- `frontend/src/components/NewsCard.tsx` — 고정 틀, `data-card-meta`, 짧은 라벨, `시사점`, 배지 줄, 인기 점수 바닥 이동, `preferSummary` (22)
- `frontend/src/components/feed/NewsCardSkeleton.tsx` — 카드와 같은 틀 (22)
- `frontend/src/components/chat/HandoverCtaButton.tsx` — 1024~1279 아이콘만 보이는 선택 prop, 접근 이름 유지 (22)
- `frontend/src/components/feed/FeedToolbar.tsx` — 줄별 flex(`data-toolbar-row`), `data-feed-toolbar`, 라벨을 `labels.ts` 에서, 자리표시 `키워드 검색`, `-my-2` (23)
- `frontend/src/components/feed/InsightsBar.tsx` — `flex flex-col gap-3`, 날짜 `max-md:hidden`, 급상승 칩 `lg` 이상·`ScrollRow`, 데이터가 있으면 스켈레톤 없음, `data-insights-bar` (23)
- `frontend/src/components/feed/FeedStatusBar.tsx` — `data-feed-status` (23)
- `frontend/src/components/feed/TrendRadarPanel.tsx` — 급상승 칩 줄을 옮기거나 간격을 맞춰야 할 때만 (23)
- `frontend/src/components/feed/FeedPagination.tsx` — 다시 읽는 동안 유지에 필요할 때만 (23)
- `frontend/src/hooks/useNewsFeed.ts` — 목록 키와 다시 읽기 번호 분리, `Promise.allSettled`, `loadingRadar` 첫 로드만 (23)
- `frontend/src/app/page.tsx` — `preferSummary` 연결, 그리드·main 간격, 다시 읽기 실패 알림 (23)

AI 챗
- `frontend/src/components/chat/ChatMessageList.tsx` — 추천 질문 버튼 `text-left`, 메시지 열 `data-chat-column` (24)
- `frontend/src/components/chat/ChatContextBar.tsx` — `ScrollRow`, 열 맞춤, `data-chat-context-bar` (24)
- `frontend/src/components/chat/ChatSidebarHeader.tsx` — 머리 영역 56px + 44px 두 줄, `data-chat-sidebar-head` (24)
- `frontend/src/components/chat/ChatSidebar.tsx` — 머리 영역 높이를 맞추는 데 필요할 때만 (24)
- `frontend/src/components/chat/ChatHistoryDrawer.tsx` — `ChatSidebarHeader` 변경에 맞출 때만 (24)
- `frontend/src/components/chat/ChatWorkspace.tsx` — 입력 영역 `relative` 감싸개 + `ToastRegion placement="composer"`, 열 맞춤, `data-composer` (24)
- `frontend/src/components/chat/ChatHeader.tsx` — 기록 버튼 `aria-controls` 는 열렸을 때만 (24)
- `frontend/src/components/chat/ActiveSourceChip.tsx` — `categoryShortLabel()` (24)
- `frontend/src/components/chat/FocusCapsule.tsx` — 자체 라벨 표 제거, `categoryShortLabel()` (24)
- `frontend/src/components/chat/CitationPopover.tsx` — `categoryShortLabel()` (24)

기사 상세·브리핑·소스·수집
- `frontend/src/components/news-detail/AskAiPanel.tsx` — 입력 Escape 예외, 자리표시, 빠른 질문 스크롤 줄, `copyFailedIndex` (25)
- `frontend/src/components/NewsDetailModal.tsx` — `copyFailedIndex` 상태 2,000ms (25)
- `frontend/src/components/DailyBriefingModal.tsx` — `이메일 발송` 의 `aria-controls` 는 폼이 열렸을 때만 (26)
- `frontend/src/components/sources/SourcesListTab.tsx` — `새 피드 직접 등록` 의 `aria-controls`, 카테고리 선택지 긴 라벨 (26)
- `frontend/src/hooks/useCollector.ts` — `is_running` 복원, 즉시 수집·초기화 `already_running` 처리 (26)
- `frontend/src/components/Header.tsx` — `useCollector` 변경으로 표시가 안 맞을 때만 (26)
- `frontend/src/components/ScheduleModal.tsx` — 같은 이유일 때만 (26)
- `frontend/src/components/ResetConfirmDialog.tsx` — 같은 이유일 때만 (26)

테스트 (기존 파일은 새 `it`/`describe` 와 import 이름 추가만. 바꾸는 기존 줄은 '증명' 의 2차 표 6줄뿐)
- `frontend/src/tests/ui/ChipGroup.test.tsx` — 새 파일 (20)
- `frontend/src/tests/ui/OverlayStack.test.tsx` — 추가만 (21)
- `frontend/src/tests/ui/Toast.test.tsx` — 추가만 (21)
- `frontend/src/tests/ui/Tabs.test.tsx` — 추가만 (21)
- `frontend/src/tests/ui/FormControls.test.tsx` — 332~335행 (우려 10) + `categoryShortLabel` 테스트 추가 (22)
- `frontend/src/tests/NewsCard.test.tsx` — 51행 (우려 10) + 추가 (22)
- `frontend/src/tests/feed/FeedInsights.test.ts` — 새 파일 (22)
- `frontend/src/tests/feed/FeedToolbar.test.tsx` — 추가만 (23)
- `frontend/src/tests/feed/InsightsBar.test.tsx` — 추가만 (23)
- `frontend/src/tests/hooks/useNewsFeed.test.tsx` — 새 파일 (23)
- `frontend/src/tests/chat/ChatHeader.test.tsx` — 추가만 (24)
- `frontend/src/tests/chat/ChatMessageList.test.tsx` — 추가만 (24)
- `frontend/src/tests/chat/ActiveSourceChip.test.tsx` — 19행 (우려 10) (24)
- `frontend/src/tests/modals/NewsDetailModal.test.tsx` — 추가만 (25)
- `frontend/src/tests/AskAiPanel.test.tsx` — 추가만 (25)
- `frontend/src/tests/hooks/useCollector.test.ts` — 새 파일 (26)
- `frontend/src/tests/Header.test.tsx` — 추가만 (26)
- `frontend/src/tests/modals/SourcesModal.test.tsx` — 추가만 (26)
- `frontend/src/tests/modals/DailyBriefingModal.test.tsx` — 새 파일 (26)

통합·상세 문서 (28, spec 14.10)
- `docs/design-system.md` — 5.1 `ChipGroup`·`ScrollRow`·`Toast`·`Tabs` 행, 4.x 줄바꿈 기본값, 5.2 `useScrollOverflow`·`feed-insights`, 6.1 스택 순서, 7.1 Escape 표(Ask AI 입력 예외), 9 검사 방법(14.8 표, `--self-test`, 프로덕션 실행, 측정 훅 속성), 10.2 '부모·자식 대화상자' 행 지움
- `docs/ui-spec.md` — 툴바 폭별 배치, 카드 틀, 요약 바, 챗 열 맞춤·사이드바 머리 영역, 알림 위치
- `docs/functional-spec/01-news-feed.md` — NEWS-02~06·08·14·18, 깜빡임·통계 실패 항목 지움
- `docs/functional-spec/02-ai-chat.md` — CHAT-07 `aria-controls`, CHAT-17 칩 라벨, 경고 알림 위치, 예외·엣지 정리
- `docs/functional-spec/04-briefing-and-sharing.md` — BRF-06 `이메일 발송` 의 `aria-controls` 조건 (26 반영)
- `docs/functional-spec/05-sources-and-research.md` — SRC-04 카테고리 선택지 라벨, `새 피드 직접 등록` 의 `aria-controls` 조건 (26 반영)
- `docs/functional-spec/07-ui-common.md` — UI-02 수집 상태 복원, UI-08 스택 순서·Ask AI Escape 예외, UI-13 Ask AI 복사 실패, UI-14 `aria-controls` 규칙, 알려진 위험 1·2·3 지움
- `docs/known-issues.md` — 'UI·접근성' 8행 지움, 포커스 시트 라벨 행 추가(우려 18), '데이터·동작 오류' 에 고정 시사점 행 추가(우려 11)
- `docs/test-cases.md` — 2차 새 테스트·바뀐 6줄, 테스트 수
- `docs/test-strategy.md` — 테스트 수, ui-audit 검사 종류·`--self-test`·프로덕션 실행
- `docs/tech-spec.md` — '변경 이력' 에 `ui-redesign` 2차 한 줄 (다른 절은 바뀌지 않음, spec 14.0)

2차에서 바꾸지 않는 것 (R32, spec 14.0): `backend/**`, `frontend/src/types/**`, `frontend/src/mocks/**`, `frontend/src/lib/api.ts`, `frontend/package.json`, `frontend/pnpm-lock.yaml`, `frontend/src/tests/setup.ts`, `frontend/next.config.ts`, `frontend/src/app/layout.tsx`, `frontend/src/components/chat/FocusBottomSheet.tsx`(우려 18), `globals.css` 의 색 토큰 값, localStorage 키, eslint·tsconfig·vitest 설정, `.claude/**`, `docs/product.md`, `docs/functional-spec/README.md`, `docs/api.md`, `docs/data-model.md`, `docs/operations.md`, `docs/features/ui-redesign/verify.md`(Test 스테이지 몫). 이 밖의 파일을 고쳐야 하면 고치지 않고 task 를 `blocked` 로 두고 plan 을 고쳐 재승인받는다 (1차의 사후 보정을 되풀이하지 않는다). `.claude/` 아래 설정을 바꾸는 단계는 없다 (사람 승인 필요 단계 없음).

1차 바꾸지 않는 것: `backend/**`, `frontend/src/types/news.ts`, `frontend/src/types/trends.ts`, `frontend/src/mocks/fixtures/**`, `frontend/src/mocks/server.ts`, `frontend/src/lib/env.ts`, `frontend/src/app/api/**`, `frontend/package.json`, eslint·tsconfig·vitest 설정, `.claude/**`. `.claude/` 아래 설정을 바꾸는 단계는 없다 (사람 승인 필요 단계 없음).

### 3차 보정 (29단계와 20·21·22·23 후속, 27 재측정, 28 후속)
한 줄에 경로 하나다. 괄호 안이 담당이다. 2차 목록에 이미 있는 파일도 3차 담당과 이유를 밝히려고 다시 적는다. 한 파일은 여전히 한 단계만 고친다 (`ScrollRow.tsx`·`ChipGroup.test.tsx` 는 20, `labels.ts`·`FormControls.test.tsx` 는 22, `Tabs.tsx`·`Tabs.test.tsx` 는 21, `FeedToolbar.tsx`·`TrendRadarPanel.tsx`·`tests/feed/*` 는 23, 새 파일과 팔레트·딥 리서처는 29). 2차의 '바꾸지 않는 것' 목록은 그대로 지킨다.

29 (새 단계, 360 잘림 정리)
- `frontend/src/components/CommandPalette.tsx` — 검색 입력 자리표시(`:227`)를 `명령어 검색 또는 바로가기` 로 줄인다. 다른 속성·이름 불변 (29)
- `frontend/src/components/sources/DeepResearcherTab.tsx` — 지표 카드(`Metric`, `:34-41`) 값 상자의 `truncate` 를 줄바꿈으로 (29)
- `frontend/src/tests/CommandPalette.test.tsx` — 추가만 (29)
- `frontend/src/tests/modals/DeepResearcherTab.test.tsx` — 새 파일 (29)

후속 (기존 소유 단계)
- `frontend/src/components/ui/ScrollRow.tsx` — 768 미만 넘침 표시(`data-overflow-hint`), 선택 항목 선택자 prop `selectedSelector` (20 후속)
- `frontend/src/tests/ui/ChipGroup.test.tsx` — 추가만, import 이름 추가 (20 후속)
- `frontend/src/lib/labels.ts` — `RADAR_CATEGORY_LABELS`, `radarCategoryLabel()` (22 후속)
- `frontend/src/tests/ui/FormControls.test.tsx` — `labels` 블록에 추가만 (22 후속)
- `frontend/src/components/ui/Tabs.tsx` — 선택 탭 보이기 effect·`revealTabInRow` 삭제, `ScrollRow` 에 선택자 전달 (21 후속)
- `frontend/src/tests/ui/Tabs.test.tsx` — 추가만 (21 후속)
- `frontend/src/components/feed/FeedToolbar.tsx` — 소스 줄의 자체 넘침 표시와 `group/source` 감싸개 삭제 (23 후속)
- `frontend/src/components/feed/TrendRadarPanel.tsx` — 카테고리 분포 라벨·`title` 을 `radarCategoryLabel()` 로 (23 후속)
- `frontend/src/tests/feed/FeedToolbar.test.tsx` — '증명' 3차 표의 블록 하나 교체 (23 후속)
- `frontend/src/tests/feed/TrendRadarPanel.test.tsx` — 새 파일 (23 후속)

측정 (27 재측정, 2차 목록과 같은 파일)
- `docs/features/ui-redesign/audit/report.json` — 재측정 결과로 덮어씀 (27)
- `docs/features/ui-redesign/audit/*.png` — 재측정 스크린샷 24장 (27)

문서 (28 후속, 모두 2차 문서 목록에 있는 파일)
- `docs/design-system.md` — 5.1 `ScrollRow` 행(768 미만 넘침 표시, `bleed` 오른쪽 자리, `selectedSelector`), `Tabs` 행(선택 탭 보이기는 `ScrollRow`)
- `docs/functional-spec/07-ui-common.md` — 커맨드 팔레트 자리표시 (`:187`)
- `docs/functional-spec/05-sources-and-research.md` — 딥 리서처 지표 값 줄바꿈 (지표를 적은 곳이 있으면)
- `docs/functional-spec/01-news-feed.md` — 레이더 카테고리 분포 한국어 라벨 (NEWS-14·18)
- `docs/ui-spec.md` — 768 미만 스크롤 줄 넘침 표시 (피드 툴바 서술이 소스 줄에만 표시를 적었으면 공통으로)
- `docs/test-cases.md` — 3차 새 테스트 파일 2개, 추가 테스트, 바뀐 `FeedToolbar.test.tsx` 블록, 테스트 수
- `docs/test-strategy.md` — 테스트 수

### 리뷰 후속 (30~37단계, spec 14.12)
한 줄에 경로 하나, 괄호 안이 담당 단계 하나다. 이 목록의 파일은 30~37 중 한 단계만 고친다. 1·2·3차 목록에 이미 있는 파일도 리뷰 후속 담당을 밝히려고 다시 적는다. 2차의 '바꾸지 않는 것'(R32) 목록은 그대로 지킨다. 측정(30·36)에서 이 목록 밖 파일을 고쳐야 하는 새 실패가 나오면 고치지 않고 그 단계를 `blocked` 로 두고, 메인 세션이 planner 에 plan 을 고치게 해 재승인받은 뒤 잇는다 (우려 22, 작업 순서 '리뷰 후속 공통 규칙').

ui-audit (게이트 밖, implementer A, 19 의 연장)
- `frontend/scripts/ui-audit.mjs` — `clip` 판정 ④(스크롤 영역 상자의 같은 축 잘림), `chatAlign` 의 알파 0 배경 판정 (30. 36 에서 찾은 판정 오탐 수정도 30 의 연장으로 기록)
- `frontend/scripts/ui-audit-fixtures/defects.html` — 리뷰 후속 fixture 3종(세로·가로로 잘린 스크롤 영역, 잘린 배지 줄), `data-expect="clip"` (30)
- `frontend/scripts/ui-audit-fixtures/clean.html` — 같은 3종의 고친 형태, 맥락 줄 위젯을 알파 0 배경 감싸개 두 겹으로 싸기 (30)

공통 부품
- `frontend/src/components/ui/ScrollRow.tsx` — 스크롤 버튼 포커스 유지 (포커스 버튼 ref, `onFocus`·`onBlur`, `useLayoutEffect` 로 반대쪽 버튼 → 선택 자식 → 첫 포커스 가능 요소) (31)
- `frontend/src/components/ui/Chip.tsx` — `ChipGroup` 이 `selectedSelector?: string` 을 받아 `ScrollRow` 로 넘김. `Chip` 은 그대로 (31)
- `frontend/src/tests/ui/ChipGroup.test.tsx` — 새 `describe`·도우미 추가만 (31)
- `frontend/src/components/ui/Toast.tsx` — `announcedBy` 기록, 이미 알린 알림은 다른 영역에서 live 속성 없이 그림, 닫힐 때 기록 삭제 (32)
- `frontend/src/tests/ui/Toast.test.tsx` — 추가만 (32)
- `frontend/src/components/ui/Badge.tsx` — `shrink?: boolean` prop (1차 글롭으로만 열려 있던 파일을 담당과 함께 명시) (33)
- `frontend/src/tests/ui/Primitives.test.tsx` — `Badge shrink` 단언 추가만 (33)

피드·수집
- `frontend/src/components/NewsCard.tsx` — 배지 줄 `data-card-badges`, 기술 배지 `Badge shrink`·`min-w-12 max-w-32`, 글자 감싸개 `min-w-0 truncate` (33)
- `frontend/src/tests/NewsCard.test.tsx` — 추가만 (33)
- `frontend/src/components/feed/FeedToolbar.tsx` — 한 트리·CSS 배치(`useToolbarLayout`·`useMediaQuery` 삭제), 소스 칩 `data-source-chip` 과 `selectedSelector` (34)
- `frontend/src/tests/feed/FeedToolbar.test.tsx` — 추가만 (34)
- `frontend/src/hooks/useCollector.ts` — `statusSeq`·`appliedStatusSeq`·`progressEndSeq` 로 오래된 상태 응답 버리기 (35)
- `frontend/src/tests/hooks/useCollector.test.ts` — 추가만 (35)

측정 (implementer A, 27·19 기준선 실행의 연장)
- `docs/features/ui-redesign/audit/report.json` — HEAD 프로덕션 재측정 결과로 덮어씀 (36)
- `docs/features/ui-redesign/audit/*.png` — 재측정 대표 스크린샷 24장 (36)
- `docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json` — 강화한 판정으로 수정 전 기준선 재측정 결과로 덮어씀 (36)

문서 (37, 메인 세션, spec 14.10 '(리뷰 후속)'·14.12)
- `docs/design-system.md` — 5.1 `Badge` 행(`shrink`), `ChipGroup`·`ScrollRow` 행(`selectedSelector`, 스크롤 버튼 포커스 유지), `Toast` 행(한 번만 알림), 9 검사 방법(`clip` ④, `chatAlign` 알파 판정, 새 fixture)
- `docs/ui-spec.md` — 피드 툴바 폭별 배치(14.2 새 표, 한 트리), 카드 배지 줄
- `docs/functional-spec/01-news-feed.md` — NEWS-02~06 툴바 배치·순서·소스 줄 선택 칩, NEWS-08 배지 줄
- `docs/functional-spec/07-ui-common.md` — UI-02 오래된 상태 응답, 알림 재알림 없음, 스크롤 버튼 포커스 유지(해당 절이 있으면)
- `docs/test-cases.md` — 14.9 리뷰 후속 단언, 파일·테스트 수
- `docs/test-strategy.md` — ui-audit `clip` ④·`chatAlign` 알파 판정·fixture, 테스트 수
- `docs/tech-spec.md` — '변경 이력' 의 `ui-redesign` 에 리뷰 후속 한 줄 (다른 절 불변, spec 14.12)
- `docs/known-issues.md` — 'UI·접근성' 에 1행: 360·390 첫 화면 피드 소스 줄 `Must-Read` 미노출(`‹` 단서만). spec 우려 23 의 남은 제한을 기록한다. 다른 행은 바꾸지 않는다 (37 후속. 편집(a9ea174)이 이 줄보다 먼저였던 사후 보정, Revision 참고). 보정 5 에서 R34 로 해소되어 그 행을 지운다 (37 후속 2, spec 14.10 보정 5)

리뷰 후속에서 바꾸지 않는 것 (2차 R32 목록에 더해): `frontend/src/lib/cn.ts`(spec 14.4: 충돌 해결 대신 `Badge shrink`), `frontend/src/components/ui/Tabs.tsx`·`frontend/src/tests/ui/Tabs.test.tsx`(탭 줄은 이미 `selectedSelector='[role="tab"][aria-selected="true"]'` 를 넘겨 31 의 포커스 유지를 그대로 받는다. `Tabs.test.tsx:249` 단언 불변), `frontend/src/components/ui/IconButton.tsx`, `frontend/src/hooks/useMediaQuery.ts`, `frontend/src/hooks/useScrollOverflow.ts`, `frontend/src/app/page.tsx`(툴바 props 불변), `frontend/src/components/Header.tsx`·`ScheduleModal.tsx`(수집 표시는 `useCollector` 스냅샷 그대로), `docs/product.md`(spec 14.12), `docs/features/ui-redesign/spec.md`, `docs/features/ui-redesign/verify.md`(Test 스테이지 몫). 이 밖의 게이트 경로를 고쳐야 하면 고치지 않고 task 를 `blocked` 로 두고 plan 을 고쳐 재승인받는다. `.claude/` 아래 설정을 바꾸는 단계는 없다 (사람 승인 필요 단계 없음).

보정 3 (spec 14.13) 은 새 경로를 더하지 않는다. 고칠 파일이 모두 위 '리뷰 후속' 목록에 같은 담당으로 있다: `ScrollRow.tsx`·`ChipGroup.test.tsx` 는 31(B 후속 3), `FeedToolbar.test.tsx`·(필요할 때만) `FeedToolbar.tsx` 는 34(E 후속), `ui-audit.mjs`·`defects.html`·`clean.html` 은 30(A 후속 2), `audit/report.json`·`audit/*.png`·`audit/baseline-1ec8a9b/report.json` 은 36(A 재측정 4), 문서 8개는 37(후속). `Chip.tsx`(31)는 보정 3 에서 바꾸지 않는다 (spec 14.13). `Tabs.tsx`·`Tabs.test.tsx` 는 여전히 바꾸지 않는다 (`Tabs.test.tsx:373-379` 의 768 미만 `end` 표시 1개 단언은 그대로 성립, spec 14.13). `docs/known-issues.md` 는 리뷰 후속 문서 목록에 37 담당으로 있다 (우려 23 의 남은 제한 1행. 처음에는 목록 밖이었고 37 의 편집 뒤 사후 보정으로 넣었다, Revision 참고).

보정 5 (spec 14.14) 도 새 경로를 더하지 않는다: `FeedToolbar.tsx`·`FeedToolbar.test.tsx` 는 34(E 후속 3), `ScrollRow.tsx`·`ChipGroup.test.tsx` 는 31(B 후속 4), `ui-audit.mjs`·`defects.html`·`clean.html` 은 30(A 후속 4. 이미 끝난 후속 3 도 같은 파일), audit 3종은 36(A 재측정 5), 문서는 37(후속 2: `docs/known-issues.md` 행 삭제, `docs/ui-spec.md`, `docs/functional-spec/01-news-feed.md`, `docs/functional-spec/07-ui-common.md`, `docs/design-system.md`, `docs/test-cases.md`, `docs/test-strategy.md`). `Chip.tsx` 는 바꾸지 않는다 (토글 모양은 `className`·`children`, spec 14.14).

### 보정 7 (38~44단계, spec 14.15, R35~R40)
한 줄에 경로 하나, 괄호 안이 담당 단계 하나다. 이 목록의 파일은 38~44 중 한 단계만 고친다. 앞 목록에 있는 파일도 보정 7 담당을 밝히려고 다시 적는다. 2차 R32 '바꾸지 않는 것' 목록은 그대로 지키되, `frontend/src/components/chat/FocusBottomSheet.tsx` 는 R40(우려 18 닫음)으로 보정 7 에서 42 가 고친다. 측정(38·43)에서 이 목록 밖 파일을 고쳐야 하는 새 실패가 나오면(우려 31) 고치지 않고 그 단계를 `blocked` 로 두고 plan 을 고쳐 재승인받는다.

ui-audit (게이트 밖, implementer A)
- `frontend/scripts/ui-audit.mjs` — 새 검사 6개(`toolbarLayout`, `cardMetric`, `chatScope`, `terms`, `modelPicker`, `focusLabels`), 새 측정 상태 '챗 포커스 필터 열림', 360 self-test 대상 추가 (38. 43 에서 찾은 판정 오탐 수정도 38 의 연장)
- `frontend/scripts/ui-audit-fixtures/defects.html` — 보정 7 fixture 6종의 결함판, `data-expect` (38)
- `frontend/scripts/ui-audit-fixtures/clean.html` — 같은 6종의 정상판 (38)

라벨·카드 (implementer D)
- `frontend/src/lib/labels.ts` — `ALL_CATEGORY_LABEL`, `SCOPE_LABELS`·`scopeLabel()`, `ScoreMetric`·`SOURCE_SCORE_METRICS`·`SCORE_METRIC_LABELS`·`scoreMetric()`, `CountMetric`·`COUNT_METRIC_LABELS`·`countMetric()` (39)
- `frontend/src/tests/ui/FormControls.test.tsx` — `labels` 블록에 추가만 (39)
- `frontend/src/components/NewsCard.tsx` — 바닥 통계 지표별 표시(`data-card-stat`·`data-metric`·`title`·`sr-only`, 합성 점수 숨김), 카드 `data-source` (40)
- `frontend/src/tests/NewsCard.test.tsx` — 추가만 (40)

피드 툴바 (implementer E)
- `frontend/src/components/feed/FeedToolbar.tsx` — 줄 B `max-md:flex-wrap`, 소스 감싸개 `max-md:basis-full`, Must-Read `max-md:ml-auto`, 소스 `bleed` `true`, `ALL_CATEGORY_LABEL` 을 `labels.ts` 에서 (41)
- `frontend/src/tests/feed/FeedToolbar.test.tsx` — '보정 7 에서 바뀌는 기존 단언' 표의 줄 + 추가 (41)

챗 (implementer F)
- `frontend/src/components/chat/ChatContextBar.tsx` — 탭 라벨 `scopeLabel()` (42)
- `frontend/src/components/chat/SessionItemCard.tsx` — 배지 글자·접근 이름 `scopeLabel()` (42)
- `frontend/src/components/chat/FocusCapsule.tsx` — 앞말 `포커스:`, 기본값 `ALL_CATEGORY_LABEL` (42)
- `frontend/src/components/chat/FocusBottomSheet.tsx` — `도메인 카테고리` 칩 라벨을 `labels.ts` 에서 (2차 '바꾸지 않는 것' 해제, R40) (42)
- `frontend/src/components/chat/ChatHeader.tsx` — 모델 선택과 `selectedTier`·`onSelectTier` prop 삭제 (42)
- `frontend/src/components/chat/ChatWorkspace.tsx` — 헤더로의 모델 전달 삭제, `SOURCE_NOT_FOUND_MESSAGE` 문구 (42)
- `frontend/src/components/chat/ChatMessageList.tsx` — `수집된 소식 기반의` (42)
- `frontend/src/tests/chat/ChatHeader.test.tsx` — 표의 줄 + 추가 (42)
- `frontend/src/tests/chat/ChatPromptInput.test.tsx` — 추가만 (헤더에서 옮긴 모델 선택 테스트) (42)
- `frontend/src/tests/chat/ChatWorkspace.test.tsx` — 표의 줄 (42)
- `frontend/src/tests/chat/FocusBottomSheet.test.tsx` — 표의 줄 + 추가 (42)
- `frontend/src/tests/chat/FocusCapsule.test.tsx` — 표의 줄 (42)
- `frontend/src/tests/chat/ChatSidebar.test.tsx` — 표의 줄 + 추가 (세션 배지·접근 이름) (42)
- `frontend/src/tests/chat/ChatSessionWorkflow.test.tsx` — 표의 줄 `:58` 만 (보정 7 정정. spec 우려 27 목록에는 없고 14.15 표 정정본에 있음) (42)

측정 (implementer A)
- `docs/features/ui-redesign/audit/report.json` — 보정 7 판정으로 HEAD 프로덕션 재측정 (43)
- `docs/features/ui-redesign/audit/*.png` — 대표 스크린샷 24장 (43)
- `docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json` — 보정 7 판정으로 기준선 재측정 (43)

문서 (44, 메인 세션, spec 14.15 '문서')
- `docs/known-issues.md` — 'UI·접근성' 포커스 필터 창 카테고리 라벨 행 삭제(R40), '데이터·동작 오류' 의 '첫 화면 카드의 별점…' 행을 확인된 원인으로 정정 (44)
- `docs/ui-spec.md` — 피드 툴바 768 미만 4줄, 카드 바닥 통계, 챗 헤더·입력창 모델 칩, 모델 팝오버 표, 컴포넌트 트리, 맥락 줄 탭 라벨, 포커스 캡슐 앞말 (44)
- `docs/functional-spec/01-news-feed.md` — NEWS-02~06 768 미만 툴바, NEWS-08 카드 통계 규칙 (44)
- `docs/functional-spec/02-ai-chat.md` — CHAT-15 모델 선택 위치, CHAT-16 포커스 시트 라벨, CHAT-17 스코프 탭 라벨, 세션 배지·접근 이름, 없는 기사 알림 문구 (44)
- `docs/functional-spec/07-ui-common.md` — `:262` 챗 헤더 폭별 표 768~1023 열의 `모델 칩` 삭제(R39), `:323` 없는 기사 알림 문구 `전체 소식 모드`(R38) (44. 44 끝(c65516a) 뒤 메인 세션이 고치는 문서 목록 정정)
- `docs/design-system.md` — `labels.ts` 설명(지표 표, `ALL_CATEGORY_LABEL`, `SCOPE_LABELS`), 9 검사 방법(새 검사 6개, 새 측정 상태, fixture) (44)
- `docs/test-cases.md` — 보정 7 바뀐 단언·새 단언, 파일·테스트 수 (44)
- `docs/test-strategy.md` — ui-audit 새 검사·측정 상태 (44)
- `docs/tech-spec.md` — '변경 이력' 의 `ui-redesign` 에 보정 7 한 줄 (44)

보정 7 에서 바꾸지 않는 것 (spec 14.15): `frontend/src/components/ui/ScrollRow.tsx`, `frontend/src/components/ui/Chip.tsx`(implementer B 는 이번에 일이 없다), `frontend/src/components/chat/ChatPromptInput.tsx`, `frontend/src/components/chat/ChatModelSelector.tsx`(`header-chip`·`header-compact` 변형은 부품에 남김), `frontend/src/components/NewsDetailModal.tsx`, `frontend/src/types/**`(`types/chat.ts:921` 의 `ChatHeaderProps` 에 `selectedTier`·`onSelectTier` 가 남는다 — 컴포넌트는 `ChatHeader.tsx:18` 의 자체 인터페이스를 쓴다, R32), `frontend/src/mocks/**`, `frontend/src/lib/api.ts`, `frontend/src/app/page.tsx`, backend 점수 계산(우려 28), `docs/product.md`. F2(768·1024 칩 줄 끝 잘림)는 줄 구성을 바꾸지 않는다 (우려 29).

### 보정 8 (45~48단계, spec 14.16, R41)
한 줄에 경로 하나, 괄호 안이 담당 단계 하나다. 이 목록의 파일은 45~48 중 한 단계만 고친다. 앞 목록에 있는 파일도 보정 8 담당을 밝히려고 다시 적는다 (새 경로는 없다). 측정(45·47)에서 이 목록 밖 파일을 고쳐야 하는 새 실패가 나오면 고치지 않고 그 단계를 `blocked` 로 두고 plan 을 고쳐 재승인받는다.

ui-audit (게이트 밖, implementer A)
- `frontend/scripts/ui-audit.mjs` — `cardMetric` 판정 ⑤(원천 지표가 없는 소스에 인기 점수), `summary.bySource.<소스>.hotnessShown` 기록 (45. 47 에서 찾은 판정 오탐 수정도 45 의 연장)
- `frontend/scripts/ui-audit-fixtures/defects.html` — `rss_kr` 카드에 인기 점수만 있는 블록, `data-expect="cardMetric"` (45)
- `frontend/scripts/ui-audit-fixtures/clean.html` — `cardMetric` 절의 `github` 카드에 인기 점수 추가 (45)

카드 (implementer D2)
- `frontend/src/components/NewsCard.tsx` — `showHot = scoreKind !== null && item.hotness_score > 25` (46)
- `frontend/src/tests/NewsCard.test.tsx` — '보정 8 에서 바뀌는 기존 단언' 표의 줄 + 추가 (46)

측정 (implementer A)
- `docs/features/ui-redesign/audit/report.json` — 보정 8 판정으로 HEAD 프로덕션 재측정 (47)
- `docs/features/ui-redesign/audit/*.png` — 대표 스크린샷 24장 (47)
- `docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json` — 판정이 바뀌므로 기준선 재측정 (47)

문서 (48, 메인 세션, spec 14.16 '문서'. 48 은 보정 9 측정(55)·관문 G23 뒤로 옮겨 보정 9 문서와 함께 한다 — 아래 '보정 9' 문서 목록이 이 목록을 포함한다)
- `docs/known-issues.md` — '데이터·동작 오류' 카드 점수 행 '영향' 칸 (48)
- `docs/ui-spec.md` — 카드 바닥 통계: 인기 점수는 지표 소스만 (48)
- `docs/functional-spec/01-news-feed.md` — NEWS-08 인기 점수 표시 조건 (48)
- `docs/design-system.md` — 카드 통계 설명: `scoreMetric` 이 점수·인기 둘 다의 표시 조건 (48)
- `docs/test-cases.md` — 보정 8 바뀐 단언·새 단언, 테스트 수 (48)
- `docs/tech-spec.md` — '변경 이력' 의 `ui-redesign` 에 보정 8 한 줄 (48)

보정 8 에서 바꾸지 않는 것 (spec 14.16): `frontend/src/lib/labels.ts`(`scoreMetric` 이 이미 '원천 지표가 있는 소스' 를 한 곳에서 판정), `frontend/src/components/NewsDetailModal.tsx`(인기 점수를 그리지 않음), R32 목록(backend, `types/**`, `mocks/**`, `lib/api.ts`, `package.json`·lock, localStorage 키), `인기순`·`추천순` 정렬과 backend 인기 점수 계산(우려 28), `docs/product.md`.

### 보정 9 (49~55단계와 48, spec 14.17, R42~R48)
한 줄에 경로 하나, 괄호 안이 담당 단계 하나다. 이 목록의 파일은 49~55 와 48 중 한 단계만 고친다 (같은 파일을 두 단계가 고치지 않으므로 49~54 를 병렬로 돌릴 수 있다). 앞 목록에 있는 파일도 보정 9 담당을 밝히려고 다시 적는다. 새 경로: `frontend/src/tests/feed/FeedStatusBar.test.tsx`, `frontend/src/tests/ui/IconGuard.test.ts`, `docs/functional-spec/04-briefing-and-sharing.md`(보정 9 에서 처음 목록에 들어감). 측정(49 의 사전 측정, 55)에서 이 목록 밖 파일을 고쳐야 하는 새 실패가 나오면(spec 우려 42) 고치지 않고 그 단계를 `blocked` 로 두고 plan 을 고쳐 재승인받는다.

ui-audit (게이트 밖, implementer A)
- `frontend/scripts/ui-audit.mjs` — `R9_CHECKS` 새 검사 5개(`feedAreas`, `chatHeader`, `pictograph`, `briefing`, `cardFooter`)를 `ALL_CHECKS` 에 넣음, 판정 바꿈 3개(`toolbarLayout`, `vRhythm`, `terms`), 상단 기준 상수(입력 높이 44/36, 칩 높이 44/32, 허용 1px·0.5px, 긴 라벨 4개, 금지 용어 3개), `ENTRY_POINTS` `card-chat` 이름(`:1463` → `/^AI 챗에서 분석/`), `DIALOGS` 뉴스 상세 탭 이름(`:1565` → `/^AI 질의응답/`), 머리 주석·`--help` 문구 (49. 55 에서 찾은 판정 오탐 수정도 49 의 연장)
- `frontend/scripts/ui-audit-fixtures/defects.html` — spec 14.17 fixture 표 8종의 결함판(`data-expect`), 새 판정 때문에 기존 결함 블록에 생기는 덤 실패의 `data-expect-reason` (49)
- `frontend/scripts/ui-audit-fixtures/clean.html` — 같은 8종의 정상판, `[data-feed-toolbar]` 를 가진 기존 clean 블록(보정 5 '숨은 Must-Read', 보정 7 '좁은 소스 줄')과 `vRhythm` 대상 블록을 세 영역 구조(`[data-feed-search]` → `[data-feed-toolbar]` → `[data-feed-list-header]`)로 (49)

피드 세 영역 (implementer E)
- `frontend/src/components/feed/FeedToolbar.tsx` — Fragment 로 `[data-feed-search]`(`scroll-mt-20`) 와 `[data-feed-toolbar]` 두 형제, 검색 `formClassName="w-full"`, 줄 A 카테고리만(`max-md:flex-col max-md:items-stretch` 삭제), 줄 B `[소스][Must-Read]`(41단계의 `max-md:flex-wrap`·`max-md:basis-full`·`max-md:ml-auto` 삭제, 소스 `bleed` `true` → `'start'`), 정렬 `Select`·`SORT_OPTIONS`·`sort`·`onSortChange` 삭제. `FEED_CATEGORIES` 내보내기(이름·`{ id, icon }` 모양·순서)는 그대로 둔다 (53 이 import 한다) (50)
- `frontend/src/components/feed/FeedStatusBar.tsx` — `[data-feed-list-header]` 머리줄(`flex items-start gap-3`), 상태 `div` 에 `min-w-0 flex-1 min-h-11 md:min-h-9`(나머지 속성 그대로. spec 14.17 정정 `5f6417e`, 50 연장), 뒤 형제 정렬 `Select`(`containerClassName="w-28 shrink-0 xl:w-32"`), 새 prop `sort`·`onSortChange`·`onPageChange`, `SORT_OPTIONS` 를 옮겨 내보냄 (50)
- `frontend/src/app/page.tsx` — `FeedToolbar` 에 `sort`·`onSortChange` 를 넘기지 않고 `FeedStatusBar` 에 `sort`·`onSortChange={setSort}`·`onPageChange={setPage}`, `/` 단축키(`:145`)를 `focus({ preventScroll: true })` + `closest('[data-feed-search]')?.scrollIntoView({ block: 'nearest', behavior: 'auto' })` 로 (50)
- `frontend/src/tests/feed/FeedToolbar.test.tsx` — '보정 9 에서 바뀌는 기존 단언' 표의 줄 + 새 단언 (50)
- `frontend/src/tests/feed/FeedStatusBar.test.tsx` — 새 파일: 옮긴 정렬 단언 + 새 단언 (50)

카드·이관·상세 (implementer D2) — `HandoverCtaButton` 이 카드(`card-compact`)와 상세 배너(`modal-banner`)를 함께 그리고, `NewsCard.test.tsx`·`NewsDetailModal.test.tsx`·`HandoverIntegration.test.tsx` 가 모두 그 글자를 단언하므로 한 단계로 묶었다
- `frontend/src/components/NewsCard.tsx` — 바닥 줄(`:178`) `flex flex-wrap items-center justify-between gap-x-2 gap-y-1`, 통계 묶음(`:179`) `min-w-0` 삭제, 버튼 묶음(`:213`) `ml-auto`, `compactBetweenLgXl`(`:217`) 전달 삭제, 머리줄 카테고리 `span`(`:117`) `title={categoryLabel(item.category)}` (51)
- `frontend/src/components/chat/HandoverCtaButton.tsx` — `card-compact` 글자 `AI 챗에서 분석`, `aria-label` 삭제, `title` `AI 챗에서 이 기사를 단일 기사 모드로 분석`, `modal-banner` 제목 `AI 챗에서 분석`·보조 문구 `이 기사를 단일 기사 모드로 열어 질의응답`, `compactBetweenLgXl` prop·클래스·주석 삭제 (51)
- `frontend/src/components/NewsDetailModal.tsx` — 탭 라벨 `AI 질의응답`(`:283`), 오류 답변 앞 `⚠️ ` 삭제(`:200`) (51)
- `frontend/src/components/news-detail/AskAiPanel.tsx` — `QUICK_PROMPTS` 라벨 이모지 삭제(`:51-66`), 이미 있는 `icon` 을 버튼 글자 앞에(`aria-hidden`, `size-4`) (51)
- `frontend/src/tests/NewsCard.test.tsx` — 표의 줄(`:236-241`) + 새 단언 (51)
- `frontend/src/tests/chat/HandoverIntegration.test.tsx` — 표의 줄만 (51)
- `frontend/src/tests/modals/NewsDetailModal.test.tsx` — 표의 줄만 (51)
- `frontend/src/tests/AskAiPanel.test.tsx` — 표의 줄(`:47`, `:67`) + 새 단언 (51)

챗 (implementer F)
- `frontend/src/components/chat/ChatHeader.tsx` — `피드로 돌아가기` `Link`(`:111-119`)를 `대화 기록 보기` `IconButton`(`:100-109`) 앞으로. 클래스·`aria-*` 그대로 (52)
- `frontend/src/components/chat/ChatMessageList.tsx` — 추천 질문(`:21-26`)을 `{ icon, text }` 배열로, 이모지 없는 글자, 카드 앞 lucide 아이콘(`aria-hidden`, `size-4`, `text-accent`), `onSelectPromptSuggestion(text)` (52)
- `frontend/src/components/chat/ModelTierBadge.tsx` — `TIER_META.icon` 을 lucide 컴포넌트로(`haiku` `Zap`, `sonnet` `Target`, `opus` `Brain`, 비 Claude 티어 gemini `Sparkles`·gpt `Bot`·그 밖 `Target`), `<Icon aria-hidden="true" data-tier-icon={tier} className="size-3.5" />` (52)
- `frontend/src/components/chat/ChatModelSelector.tsx` — `:114`, `:168` 이 티어 아이콘 컴포넌트를 그림 (52)
- `frontend/src/tests/chat/ChatHeader.test.tsx` — 추가만 (52)
- `frontend/src/tests/chat/ChatMessageList.test.tsx` — 추가만 (52)
- `frontend/src/tests/chat/ChatModelSelector.test.tsx` — 표의 줄(`:22`, `:181`, `:189`, `:202`) (52)

브리핑 (implementer H)
- `frontend/src/components/DailyBriefingModal.tsx` — 위 작업 줄 `연동 설정` `IconButton`(`:172-180`)·`mobileMenuItems` 의 `연동 설정`(`:117-119`) 삭제, 바닥 버튼 글자 `연동 설정`(`:192-196`), `오늘의 핵심 요약` 의 헤드라인 `<p>`(`:297`) 삭제·개요가 없으면 칸을 그리지 않음, 분야 머리글 `categoryLabel(cat.id)`(표에 없으면 `cat.name`)·아이콘은 `FEED_CATEGORIES`(`@/components/feed/FeedToolbar`)의 같은 id 아이콘(없으면 아이콘 없음, `cat.icon` 은 쓰지 않음), 개요 줄 `**이름**:`(`:301,307`)을 같은 `name` 의 `id` 긴 라벨로, `💡 시사점:`(`:358`) → `Lightbulb`(`aria-hidden`, `size-4`) + `시사점:` (53)
- `frontend/src/tests/modals/DailyBriefingModal.test.tsx` — 추가만 (53)

정적 검사 (implementer G)
- `frontend/src/tests/ui/IconGuard.test.ts` — 새 파일, 판정식 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/u` (54. 작업 순서 '보정 9' 의 결정 1)

측정 (implementer A)
- `docs/features/ui-redesign/audit/report.json` — 보정 9 판정으로 HEAD 프로덕션 재측정 (55)
- `docs/features/ui-redesign/audit/*.png` — 대표 스크린샷 24장 (55)
- `docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json` — 판정이 바뀌므로 기준선 재측정 (55)

문서 (48, 메인 세션, spec 14.16 '문서'·14.17 '문서'. 보정 8 문서 목록을 포함한다)
- `docs/known-issues.md` — 보정 8: '데이터·동작 오류' 카드 점수 행 '영향' 칸. 보정 9: 새 행 3개 — 브리핑 헤드라인·분야 요약을 글자 수로 잘라 단어 중간에서 끊김(`backend/app/services/briefing_service.py:86,88,101-102`), backend 브리핑 분야 이름·이모지가 `labels.ts` 와 다름(화면은 R47 로 가리고 마크다운 전문·Notion·이메일에는 남음), 챗 단계 라벨(SSE `label`)의 이모지. 셋 다 backend 범위 밖(spec 우려 39)이라 별도 intent 로 넘긴다고 적는다 (48)
- `docs/ui-spec.md` — 보정 8: 카드 바닥 통계. 보정 9: 피드 와이어프레임(`:43-90`)을 검색 영역·필터 영역·목록 머리줄로, 영역 표 상태 줄 행(`:106`, 정렬 포함), 세로 간격 문장(`:112`), 카드 바닥 줄(줄바꿈, `AI 챗에서 분석`), 상세 탭 이름·이관 배너 문구, 챗 헤더 순서, 추천 카드·모델 티어 아이콘, 브리핑 대화상자(설정 하나, 헤드라인 한 번, 분야 머리글 라벨·아이콘) (48)
- `docs/functional-spec/01-news-feed.md` — 보정 8: NEWS-08 인기 점수 조건. 보정 9: NEWS-02~06(검색 영역, 정렬 위치, Must-Read 위치, `/` 포커스 스크롤), NEWS-08(바닥 줄, `AI 챗에서 분석`, 머리줄 `title`), 상세 탭 이름, 상태 줄 (48)
- `docs/functional-spec/02-ai-chat.md` — 헤더 순서, 추천 질문 아이콘·보내는 글자, 모델 티어 아이콘 (48)
- `docs/functional-spec/04-briefing-and-sharing.md` — 브리핑 대화상자 설정 진입, 헤드라인, 분야 이름·아이콘 (48)
- `docs/functional-spec/07-ui-common.md` — 그림 문자 금지·lucide 규칙(있는 절에, 없으면 아이콘 규칙 한 줄), 챗 헤더 폭별 표의 왼쪽 순서 (48)
- `docs/functional-spec/03-collection.md` — 보정 8·9 로 바뀐 파일을 가리키는 낡은 코드 줄 참조 정정, `Updated:` 날짜, `:359` 의 지금 화면에 없는 문구 인용 삭제 (48 후속 `aba5a6d`, verifier 편차로 목록에 더함)
- `docs/functional-spec/05-sources-and-research.md` — 낡은 코드 줄 참조 정정(`app/page.tsx` 줄), `Updated:` 날짜 (48 후속 `aba5a6d`)
- `docs/functional-spec/06-mcp-server.md` — 낡은 코드 줄 참조 정정(`app/page.tsx` 줄), `Updated:` 날짜 (48 후속 `aba5a6d`)
- `docs/design-system.md` — 보정 8: 카드 통계(`scoreMetric` 이 점수·인기 둘 다의 표시 조건). 보정 9: 아이콘 규칙(그림 문자 금지, `IconGuard`), 입력과 칩의 쓰임 구분(입력은 별도 영역, 칩 줄에 섞지 않음), `ModelTierBadge` 아이콘, 9 검사 방법(새 검사 5개·바뀐 판정 3개·fixture) (48)
- `docs/test-cases.md` — 보정 8·9 바뀐 단언·새 단언, 파일·테스트 수 (48)
- `docs/test-strategy.md` — `IconGuard` 정적 검사, ui-audit 새 검사 5개·바뀐 판정 3개 (48. 메인 지시의 문서 목록에는 없으나 spec 14.17 '문서' 에 있다)
- `docs/tech-spec.md` — '변경 이력' 의 `ui-redesign` 에 보정 8·보정 9 각 한 줄 (48)

보정 9 에서 바꾸지 않는 것 (spec 14.17 '바뀌는 파일'·'바뀌지 않는 것'): `frontend/src/components/ui/SearchField.tsx`, `ui/TextField.tsx`, `ui/Select.tsx`, `ui/Chip.tsx`, `ui/ScrollRow.tsx`(입력·칩 토큰 그대로, 우려 37), `frontend/src/lib/labels.ts`(긴·짧은 라벨 표 그대로), `frontend/src/components/chat/ChatWorkspace.tsx`(`onToggleHistoryDrawer` 를 모든 폭에 넘기는 것은 그대로), `frontend/src/components/chat/ModelChangeDivider.tsx`(`TIER_META` 에서 `name` 만 쓴다 — `icon` 타입이 바뀌어도 고칠 곳 없음, 작성 때 확인), `frontend/src/components/ui/Toast.tsx`·`frontend/src/app/page.tsx` 의 바닥글 `©`(텍스트 표현 기호라 판정식에 걸리지 않음, 결정 1. `page.tsx` 의 다른 부분은 50 이 고친다), R32 목록(backend, `frontend/src/types/**` — `types/chat.ts` 의 `withIcon` 이모지 포함, `frontend/src/mocks/**` — MSW 브리핑의 `MCP & 플러그인 생태계`·`🔌` 포함, `lib/api.ts`, `package.json`·lock, localStorage 키), 정렬 값·검색 동작·`/` 키, `docs/product.md`. 새 토큰·새 의존성·새 모듈 없음 (카테고리 아이콘 표는 기존 `FEED_CATEGORIES` 를 함께 쓴다).

## 작업 순서
단계마다 `tasks/ui-redesign/NN-<slug>.md` 진행 기록이 하나씩 생긴다. 담당 `[implementer X]` 는 동시에 떠 있는 implementer 서브에이전트를 구분하는 이름이다. 같은 글자가 여러 단계를 맡으면 그 단계들은 순서대로 한다. 관문(G0~G3)은 단계가 아니라 메인 세션이 도는 검사다 (task 파일 없음).

### 모든 단계 공통 규칙
- spec 의 해당 절이 기준이다. 이 plan 은 spec 에 없는 구현 제약(기존 테스트를 깨지 않기 위한 것)을 더한다. 둘이 다르면 멈추고 task 파일을 `blocked` 로 둔다.
- 색은 토큰 유틸리티(`bg-surface`, `text-fg-muted`, `border-border`, `bg-accent-soft` …)만 쓴다. 새로 쓰는 코드에 hex·팔레트 색 클래스(`bg-slate-100`, `text-blue-600`, `bg-white`, `bg-black/40` …), `animate-in`·`zoom-in-95`·`slide-in-from-*`·`fade-in`, 임의 글자 크기(`text-[11px]`), `uppercase tracking-*` 라벨을 두지 않는다. 예외: `ChatMessageItem` 인라인 코드 `text-[12px]`.
- 화면 크기별 변형은 같은 요소에 CSS 클래스로 준다. 같은 접근 이름을 가진 요소를 데스크톱용·모바일용으로 두 번 그리지 않는다 (`getByRole` 단일 조회 테스트가 깨진다). 예: `AI 챗` 링크는 `<a href="/chat">` 하나에 아이콘 + `<span className="max-md:sr-only">AI 챗</span>`.
- JS 너비 판정은 `useMediaQuery` 만 쓴다. `window.matchMedia` 가 함수가 아니면 `false` 를 돌려준다 (jsdom).
- localStorage 키 이름·형식을 바꾸지 않고 새 키를 만들지 않는다 (R11).
- eslint 설정 완화, 파일·줄 단위 `eslint-disable` 을 쓰지 않는다 (허용 목록 없음).
- 브라우저 기본 대화상자(`window.confirm`, `alert`)를 쓰지 않는다.
- implementer 는 커밋하지 않는다. 각 관문을 통과하면 메인 세션이 그 웨이브를 한 번에 커밋한다 (병렬 implementer 의 git index 충돌 방지).

### 단계 끝 검사 기준
- 병렬 웨이브 안의 단계: 다른 implementer 가 같은 작업 트리에서 다른 파일을 고치는 중이므로 담당 범위만 확인한다.
  - `cd frontend && pnpm exec vitest run <단계에 적힌 테스트 파일>` 통과
  - `pnpm exec eslint <단계가 바꾼 파일들>` 오류 0
  - `pnpm exec tsc --noEmit` 출력 중 단계가 바꾼 파일 경로가 나오는 오류 0 (다른 단계 파일의 오류는 task 파일 '막힌 점' 에 적기만 한다)
- 다른 implementer 와 겹치지 않고 혼자 도는 단계(05, 15, 16)와 각 관문: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 가 종료 코드 0.
- 관문 G0~G3: 메인 세션이 위 frontend 명령과 `make build` 를 돌린다. 실패하면 실패 파일의 담당 implementer 에 SendMessage 로 이어서 시킨다 (새로 띄우지 않는다). 통과하면 커밋한다.
- 전체 `make check` 는 backend 테스트가 외부 호출과 `config.json`·`sources.json` 수정을 하므로 마지막(16 끝)에 한 번 돌리고 `git status` 로 두 파일 변경을 되돌린다 (`docs/test-strategy.md`).

### 웨이브 0 — lint 기준선과 토큰 기반 (01~04 병렬)
1. **[implementer A] lint: 계약 쪽·챗** — 오류 14개를 없앤다. 타입 표기만 바꾸고 런타임 값·단언은 그대로 둔다.
   - `types/chat.ts:929` `activeSource?: any | null` → `ActiveSourceChip` 이 받는 기사 타입(`ActiveSourceChipProps` 의 해당 필드 타입) `| null`. 선택 속성 그대로 (`ContractAndMsw.test.ts:1016-1025` 의 `ChatHeaderProps` 리터럴이 tsc 를 통과해야 한다).
   - `mocks/handlers.ts:64-65` `(art as any)` → `'필드' in art` 로 좁히기. `mocks/handlers/chat.ts:47` → `ModelTier` 배열 타입 가드. 응답 값 불변.
   - `tests/chat/ContractAndMsw.test.ts:534` `(s: any)` → 세션 목록 항목 타입, `:776-777` `(i: any)` → 뉴스 항목 타입. `tests/ThemeSystem.test.tsx:39,42` `listener: any` → `(e: MediaQueryListEvent) => void`.
   - `components/chat/ChatMessageItem.tsx:229` any, `ChatModelSelector.tsx:32` set-state-in-effect, `ChatWorkspace.tsx:139` any·`:563` set-state-in-effect, `useChatSessions.ts:107` set-state-in-effect → 파생 값, 이벤트 핸들러, 키 변경 시 상태 초기화(`key` prop 또는 이전 값 비교)로 없앤다. 동작 불변.
   - 끝 기준: `pnpm exec vitest run src/tests/chat src/tests/ThemeSystem.test.tsx` 통과, 위 9개 파일 eslint 오류 0, tsc 에 이 파일 오류 0. `git diff` 에서 `ContractAndMsw.test.ts` 의 `expect(` 줄이 바뀌지 않았다.
2. **[implementer B] lint: api·모달** — 오류 31개.
   - `lib/api.ts`: 108 `catch (err: any)` → `unknown` + `instanceof Error`. 458 `last_run_summary: any` → 쓰는 곳에 맞는 구체 인터페이스 또는 `unknown` + 좁히기. 504·521·538 `const body: any = {}` → `Record<string, unknown>` 또는 요청 본문 인터페이스. 573 `fetchBriefingSettings(): Promise<any>` → `Promise<BriefingSettings>` (`types/news.ts:184`, 이미 있음). 580 `update: any` → `Partial<BriefingSettings>` 또는 실제 보내는 형태. 함수 이름·인자 순서·반환 형태·요청 본문은 같다.
   - `BriefingSettingsModal.tsx` (66·73 set-state-in-effect, 71 immutability, 103·116·140·154·175·193 any, 299·302 no-unescaped-entities 6개), `WebhookSettingsModal.tsx` (24, 59, 78), `DailyBriefingModal.tsx` (74, 89), `ScheduleModal.tsx:15`, `SourcesModal.tsx:57`, `sources/SourcesListTab.tsx:53`, `NewsDetailModal.tsx:161`.
   - `WebhookSettingsModal` 의 `agentlens_webhook_url` 읽기는 열릴 때 한 번 읽는 방식(지연 초기화 또는 열림 이벤트)으로 바꾸고 키·형식은 그대로 둔다.
   - 끝 기준: 위 8개 파일 eslint 오류 0, tsc 에 이 파일 오류 0, `pnpm exec vitest run src/tests/chat/HandoverIntegration.test.tsx src/tests/AskAiPanel.test.tsx` 통과.
3. **[implementer C] lint: 피드·훅** — 오류 9개. `Header.tsx` (46 set-state-in-effect, 103 any), `CommandPalette.tsx:121`, `NewsCard.tsx` (49 purity — 렌더 중 `Date.now()` 류 호출을 밖으로, 174 any), `hooks/useNewsFeed.ts` (91, 99, 103), `hooks/useBookmarks.ts:17` (`agentlens_bookmarks` 를 렌더 밖에서 읽는 방식으로. `useSyncExternalStore` 또는 이벤트 기반. 키·JSON 형식 불변, 하이드레이션 불일치 경고가 생기지 않게).
   - 끝 기준: 위 5개 파일 eslint 오류 0, tsc 에 이 파일 오류 0, `pnpm exec vitest run src/tests/CommandPalette.test.tsx src/tests/NewsCard.test.tsx src/tests/HotkeyListener.test.tsx src/tests/chat/HandoverIntegration.test.tsx` 통과.
4. **[implementer D] 토큰·테마 기반** — spec 설계 1.2~1.8, 8.
   - `globals.css`: `@custom-variant dark (&:where(.dark, .dark *))`, `:root`(라이트)·`.dark`(다크) 에 설계 1.3 표의 모든 `--al-*` 값, `@theme inline` 에 `--color-*` 연결과 `--shadow-card`·`--shadow-overlay`, `@theme` 에 글꼴·`--ease-standard`·`--animate-*` 4개와 keyframes, `@layer base`. 옛 `html:not(.dark)`·`html.dark` 덮어쓰기는 이 단계에서 지우지 않는다 (아직 옛 클래스를 쓰는 화면이 있다). `--background`·`--foreground` 는 `body` 규칙을 새 base 로 옮기며 지운다.
   - `layout.tsx`: Geist·Geist Mono import 와 변수 클래스 제거, viewport 를 설계 8 그대로 (`maximumScale`·`userScalable` 제거), `<head>` 인라인 테마 스크립트(설계 8 의 코드), `<html lang="ko" suppressHydrationWarning>`, `<body className="min-h-dvh bg-canvas text-fg overflow-x-hidden">`, `<div id="app-shell" className="flex min-h-dvh flex-col">`.
   - `lib/theme-store.ts` + `context/ThemeContext.tsx`: 설계 8. 기존 테스트를 지키는 제약 — (a) `getSnapshot` 은 매번 `localStorage[storageKey]` 와 `window.matchMedia(q).matches` 를 새로 읽는다 (캐시한 `MediaQueryList` 의 `matches` 를 쓰지 않는다. `ThemeSystem.test.tsx:125-128` 의 목은 호출마다 새 객체다). (b) `matchMedia` 는 호출 시점에 찾고 없으면 `false`. (c) 모듈 단위 캐시를 두지 않아 테스트 사이에 상태가 새지 않고 `defaultTheme` prop 이 반영된다. (d) `dark`/`light` 클래스 하나와 `data-theme`, `style.colorScheme` 을 `useLayoutEffect` 로 단다. (e) 순환 light→dark→system→light, 저장 키 `agentlens_theme`.
   - `tests/chat/MobileViewport.test.tsx:16-19`: 테스트 이름의 "prevents auto-zoom" 을 "allows user zoom" 으로, `expect(viewport.maximumScale).toBe(1)` → `expect(viewport.maximumScale).toBeUndefined()`, `expect(viewport.userScalable).toBe(false)` → `expect(viewport.userScalable).not.toBe(false)`. 같은 파일 다른 단언은 그대로 (우려 사항 2).
   - 끝 기준: `pnpm exec vitest run src/tests/ThemeSystem.test.tsx src/tests/chat/MobileViewport.test.tsx src/tests/CommandPalette.test.tsx` 통과, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.

**관문 G0** (01~04 모두 done 뒤): frontend 검사 종료 코드 0, `pnpm lint` 오류 0, 테스트 241개 그대로 통과, `make build` 성공 (Geist 제거로 빌드가 Google 글꼴을 받지 않는다). 커밋.

### 웨이브 1 — 공통 부품 기초 (05 단독, 08 병렬 가능)
5. **[implementer A] 공통 부품 기초** — G0 뒤. spec 설계 1.5~1.9, 2 표의 해당 행.
   - `lib/cn.ts`, `components/ui/Button.tsx` (+ `buttonClasses`), `IconButton.tsx`, `Spinner.tsx`, `InlineAlert.tsx`, `Badge.tsx`, `Kbd.tsx`, `hooks/useMediaQuery.ts` (`useSyncExternalStore`, 서버 스냅샷 `false`, `matchMedia` 없으면 `false`).
   - `tests/setup.ts`: 기본 `window.matchMedia` 목을 더한다. `Object.defineProperty(window, 'matchMedia', { writable: true, configurable: true, value })`. 너비 1280 데스크톱으로 가정해 `(min-width: Npx)` 는 N ≤ 1280 이면 `matches: true`, `(max-width: Npx)` 는 N ≥ 1280 이면 true, `prefers-color-scheme: dark`·`prefers-reduced-motion: reduce` 는 false. `addEventListener`/`removeEventListener`/`addListener`/`removeListener` 는 빈 함수. 테스트가 직접 `window.matchMedia = …` 로 바꾸면 그 값이 이긴다 (`ThemeSystem.test.tsx` 방식). 기존 단언은 하나도 바꾸지 않는다.
   - `tests/ui/Primitives.test.tsx`: `Button` 기본 `type="button"`·`loading` 시 `disabled`+`aria-busy`, `IconButton` `aria-label`·`title`·`aria-pressed`, `useMediaQuery` 가 목 값과 `matchMedia` 부재에서 각각 true/false.
   - 끝 기준: frontend 검사 전체 종료 코드 0 (이 단계는 단독이다. 08 은 `src` 밖이라 영향 없음).
6. **[implementer B] 공통 부품: 폼·표시** — 05 뒤, 07·08 과 병렬. `components/ui/TextField.tsx`, `SearchField.tsx`, `Textarea.tsx`, `Select.tsx`, `Switch.tsx`, `Chip.tsx`(`Chip`, `ChipGroup`), `SegmentedControl.tsx`, `Tabs.tsx`(`Tabs`, `TabPanel`), `Card.tsx`, `Skeleton.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `CodeBlock.tsx`(언어 표시, 복사 버튼, `.code-block-wrapper` 계열 클래스는 `MarkdownViewer` 가 넘길 수 있게 `className` 수용), `hooks/useCopyToClipboard.ts`(설계 2: clipboard → `execCommand` 대체 → `failed`, 문구 `복사됨`/`복사 실패` 2초), `lib/labels.ts`(카테고리·소스 라벨. 지금 `NewsCard` 의 `CATEGORY_NAMES` 값을 그대로 옮긴다 — `NewsCard.test.tsx:51` 이 `Harness` 를 찾는다).
   - `SegmentedControl` 은 `role="group"` + 버튼 `aria-pressed` (챗 스코프 `단일 기사 (Scoped)` 테스트가 버튼과 `aria-pressed="true"` 를 찾는다).
   - 테스트: `tests/ui/Tabs.test.tsx`(역할·`aria-selected`·←/→ 순환·Home·End·로빙 tabIndex), `tests/ui/FormControls.test.tsx`(`TextField` 라벨 연결·`aria-describedby`·`aria-invalid`, `Switch` `role="switch"`·`aria-checked`, `Chip` `aria-pressed`, `ChipGroup` `role="group"`, `Select` 라벨), `tests/ui/useCopyToClipboard.test.tsx`(성공, clipboard 없음 → `execCommand` 대체, 둘 다 실패 → `failed`).
   - 끝 기준: `pnpm exec vitest run src/tests/ui` 중 06 의 파일 통과, 바꾼 파일 eslint·tsc 오류 0.
7. **[implementer C] 공통 부품: 오버레이** — 05 뒤, 06·08 과 병렬. spec 설계 2.1 전부.
   - `lib/overlay-stack.ts`: `push({id, kind:'modal'|'popover', onEscape})`, `remove(id)`, `useOverlayOpen()`(`useSyncExternalStore`). **스택이 비어 있지 않을 때 `window` keydown 리스너를 스스로 달고, 비면 뗀다** (앱·프로바이더 단위 리스너 금지. 기존 테스트는 컴포넌트 하나만 렌더하고 `window` 에 Escape 를 보낸다: `CommandPalette.test.tsx:114`, `ChatHistoryDrawer.test.tsx:87`, `ChatSidebar.test.tsx:219`, `FocusBottomSheet.test.tsx:154`, `CitationBadge.test.tsx:78`, `ChatModelSelector.test.tsx:106`). Escape 는 IME 조합 중이 아니면 맨 위 `onEscape` 만 부르고 `preventDefault`. 언마운트하면 반드시 스택에서 빠진다 (테스트 사이 누수 방지).
   - `hooks/useFocusTrap.ts`, `hooks/useScrollLock.ts`(참조 수), `hooks/useHotkey.ts`(⌘K/Ctrl+K 등 조합키, 입력창 안에서도 동작 옵션).
   - `components/ui/Dialog.tsx`, `Drawer.tsx`, `ConfirmDialog.tsx`, `Menu.tsx`(`MenuButton`), `Popover.tsx`, `Toast.tsx`(`ToastRegion`, `useToast`), `ThemeMenu.tsx`. `Dialog` 는 네이티브 `<dialog>` 가 아니라 `div role="dialog"` + 포털이다 (jsdom 에 `showModal` 없음, spec E6).
   - spec 2 의 `Dialog` API 에 기존 테스트를 지키기 위한 선택 props 를 더한다 (상위 호환, design-system.md 에 적는다): `closeLabel?: string`(기본 `닫기`. 포커스 필터 `필터 닫기`, 드로어 `대화 기록 드로어 닫기`), `backdropTestId?: string`(`drawer-backdrop`, `bottom-sheet-backdrop` 유지), `ariaLabel?: string`(제목 대신 `aria-label`, 팔레트 `커맨드 팔레트`), `header?: ReactNode` + `labelledBy?: string`(주면 기본 머리줄(제목 h2 + X)을 그리지 않고 `aria-labelledby` 를 그 id 로. 드로어처럼 이미 제목·닫기 버튼이 있는 곳에서 같은 글자·`닫기` 버튼이 두 번 생기지 않게), `panelProps?`(바텀시트 스와이프 핸들러를 `role="dialog"` 요소에 단다 — `FocusBottomSheet.test.tsx:177-187` 이 그 요소에 touch 이벤트를 보낸다).
   - `Popover` 는 포털 없이 앵커 옆 `absolute` 로 그린다 (`ChatModelSelector.test.tsx:137` 이 목록의 `top-full` 클래스를 본다). 스택에 `popover` 로 올린다.
   - `ToastRegion`: 여러 번 마운트돼도 처음 마운트된 하나만 그린다 (모듈 소유 카운터). 그래서 `layout.tsx` 와 `ChatWorkspace`(13 에서 추가) 양쪽에 둘 수 있고, `ChatWorkspace` 만 렌더하는 테스트(`ChatWorkspace.test.tsx:55` 의 404 토스트 문구)도 통과한다. `layout.tsx` 에 `<ToastRegion />` 마운트.
   - `ThemeToggle.tsx`: 토큰으로, 기본 모드 이름 `테마 전환` 유지(`ThemeSystem.test.tsx:139`), `showDropdown` 이면 `ThemeMenu` 를 그린다. `ThemeProvider` 없이 렌더돼도 동작 (`HandoverIntegration.test.tsx` 는 프로바이더 없이 `Header` 를 그린다).
   - 테스트: `tests/ui/OverlayStack.test.tsx`(push/remove, 맨 위만 Escape, IME 조합 무시, `useOverlayOpen`), `tests/ui/Dialog.test.tsx`(역할·`aria-modal`·제목 연결, 처음 포커스·`initialFocusRef`, Tab/Shift+Tab 순환, 닫을 때 포커스 복귀, 겹친 두 대화상자에서 Escape 한 번에 위만 닫힘, `dismissOnScrim={false}`, `#app-shell` `inert`, `ConfirmDialog` `alertdialog`·처음 포커스 취소·`busy` 중 Escape·배경막 무시), `tests/ui/Menu.test.tsx`(`aria-haspopup`·`aria-expanded`, 첫 항목 포커스, ↑↓·Home·End, Enter 실행, Escape 닫고 트리거로 포커스, `menuitemradio` `aria-checked`, `ThemeMenu` 3항목), `tests/ui/Toast.test.tsx`(`role="status"`/오류 `alert`, 두 번 마운트해도 한 번만 보임).
   - 끝 기준: 07 의 테스트 파일과 `src/tests/ThemeSystem.test.tsx` 통과, 바꾼 파일 eslint·tsc 오류 0.
8. **[implementer D] ui-audit 스크립트 작성** — G0 뒤 언제든 (05~07 과 병렬, `src` 를 건드리지 않는다). `frontend/scripts/ui-audit.mjs`, spec 설계 11.4.
   - 인자: `--base`(기본 `http://localhost:3001`), `--out`(기본 저장소 루트 기준 `docs/features/ui-redesign/audit`), `--screenshots key|all|none`(기본 `key`), Chrome 경로는 `CHROME_PATH` 환경 변수. `puppeteer-core` 만 쓴다.
   - 조합: `/`, `/chat` × light, dark(`localStorage.agentlens_theme` 를 넣고 다시 읽기) × 360×780, 390×844, 768×1024, 1024×768, 1440×900. `/` 에서 대화상자 7종(뉴스 상세, 일일 브리핑, 공유 & 알림, 스케줄, MCP, 소스 & 리서처, 커맨드 팔레트)과 초기화 확인 창을 각 폭에서 하나씩 열어 같은 측정.
   - 측정: R3 `document.documentElement.scrollWidth <= innerWidth`, R4 `<header>` 높이 ≤64 와 직계 자식의 `offsetTop` 이 같음, R5 390×844 에서 첫 `[data-feed-card] h3` 이 뷰포트 안·1440×900 에서 첫 줄 카드 전체가 뷰포트 안, R6 768 미만에서 spec 1.9 주요 조작 요소 선택자의 `getBoundingClientRect()` ≥44×44 (마크다운 본문 링크 제외), R7 열린 대화상자의 `role`·`aria-modal`·`aria-labelledby`(또는 `aria-label`)와 Escape 한 번에 맨 위만 닫힘, R8 viewport 메타에 `user-scalable=no`·`maximum-scale` 없음, R9 폭마다 spec 설계 9 의 화면 진입점(더보기 메뉴를 열어야 하는 것 포함)이 접근 이름으로 찾아지는지.
   - 출력: `report.json`(조합별 측정값과 `pass`, 실패 목록), `key` 모드는 `/`·`/chat` × 390×844·1440×900 × light·dark 8장 PNG, `all` 은 모든 조합. 실패가 하나라도 있으면 종료 코드 1.
   - 끝 기준: `cd frontend && pnpm exec eslint scripts/ui-audit.mjs` 오류 0, `node scripts/ui-audit.mjs --help` 가 사용법을 출력. 실제 실행은 16 에서 한다.

**관문 G1** (05~08 done 뒤): frontend 검사 종료 코드 0, `make build` 성공. 커밋.

### 웨이브 2 — 화면 (09~14, 다섯 implementer 병렬)
공통 부품(05~07)이 모두 done 이어야 이 웨이브를 시작한다. 각 단계는 부품의 공개 API 만 쓰고 `components/ui/**` 를 고치지 않는다. 부품에 버그나 빠진 기능이 있으면 task 파일에 적고 메인 세션이 해당 부품 담당(05 A, 06 B, 07 C)에 SendMessage 로 고치게 한다.

9. **[implementer A] 헤더·수집·팔레트·단축키** — spec 설계 3, 5(초기화 확인 창·스케줄·커맨드 팔레트 행), 7.
   - `hooks/useCollector.ts`: 모듈 단위 외부 저장소(`useSyncExternalStore`)로 상태를 공유하고, 구독자가 하나 이상일 때만 스케줄 30초 재조회·진행 1.2초 폴링을 돈다. 즉시 수집·초기화 함수, 요청 중 ref 로 중복 요청 차단, 언마운트 때 interval 정리. 문구·폴링 규칙은 UI-02 그대로.
   - `components/ResetConfirmDialog.tsx`: `ConfirmDialog tone="danger"`, 제목 `수집 데이터 전체 삭제 및 재수집`, 경고 문구 유지, `취소`/`전체 삭제 후 다시 수집`, 진행 중 `초기화 중...`+`busy`, 실패는 `InlineAlert`(오류 메시지 또는 `초기화 실패`).
   - `Header.tsx`: spec 3 표 그대로. props(`onRefresh`, `onOpenSchedule`, `onOpenMcp`, `onOpenWebhook?`, `onOpenSources?`) 유지. 버전 배지는 spec 설계 3(재승인본)대로 `process.env.NEXT_PUBLIC_APP_VERSION` 을 쓰고 값이 없으면 배지를 숨긴다. `src` 에서 `package.json` 을 import 하지 않는다 (처음 구현은 `package.json` 기본 import 였고 18 에서 바꾼다). `AI 챗` 링크는 요소 하나(공통 규칙). 더보기 메뉴의 모바일 전용 항목(`수집 스케줄`, `즉시 수집`, 테마 그룹)은 `useMediaQuery('(max-width: 767px)')` 일 때만 항목 배열에 넣는다. ⌘K 는 `useHotkey`. 수집 진행 줄은 `<header>` 밖.
   - `CommandPalette.tsx`: `Dialog size="md" placement="top" ariaLabel="커맨드 팔레트"`, 커스텀 머리줄(검색창 + `닫기` 버튼 하나 — `CommandPalette.test.tsx:105` 가 `닫기` 를 하나만 찾는다), 자체 window 리스너 제거, `combobox`/`listbox`/`aria-activedescendant`, 기존 5개 명령 순서·문구 유지, 선택 prop(`onOpenSchedule?`, `onOpenSettings?`, `rssUrl?`, `onRequestReset?`)이 있을 때만 4개 명령 추가, `commands?: PaletteCommand[]` 로 통째 교체, 닫을 때 검색어·선택 초기화, `챗 이동` 옆 `C` 표시 제거.
   - `HotkeyListener.tsx`: 기존 props·동작 유지(`onCloseOverlays`, `onToggleCommandPalette` 도 남긴다 — `HotkeyListener.test.tsx:63-64,113-114`), `blockSingleKeys?: boolean` 추가, Enter/Space 는 `e.target === document.body` 일 때만 `onOpenDetailModal`(다른 키에는 이 조건을 걸지 않는다 — 기존 테스트는 `window` 에 키를 보낸다), 글자 키 `e.code`(`KeyJ` 등) 판정 추가, 공통 조건은 spec 7.
   - `ScheduleModal.tsx`: `Dialog size="md"`, 토큰, 바닥 `즉시 수집`, '위험 영역' 의 `초기화 & 재수집…` → `ResetConfirmDialog`(스택 위에 쌓임). 둘 다 `useCollector` 를 쓴다. 기존 props(`isOpen`, `onClose`) 유지.
   - `app/page.tsx` (이 단계 몫): `HotkeyListener` 에 `blockSingleKeys={useOverlayOpen()}` 를 넘기고 `onCloseOverlays`·`onToggleCommandPalette` 를 넘기지 않는다, j/k 가 카드 제목 버튼에 실제 포커스를 옮기고 `scrollIntoView({block:'nearest'})`, `focusedIndex` 는 페이지·필터·정렬이 바뀌면 -1. 헤더 아래 수집 진행 줄 배치. 피드 본문 구성은 10 이 한다.
   - 테스트: `tests/Header.test.tsx`(더보기 메뉴에 `소스 & 리서처`·`공유 & 알림`·`MCP 연동`·`RSS 피드`·`초기화 & 재수집…` 이 있고 각 콜백·확인 창을 부름, 모바일 목(`matchMedia` 를 768 미만으로)에서 `수집 스케줄`·`즉시 수집`·테마 항목 추가, 버전 배지는 `vi.stubEnv('NEXT_PUBLIC_APP_VERSION', …)` 로 값이 있을 때 `v{값}`·없을 때 배지 없음 (18), `AI 챗` 링크 하나), `tests/HotkeyGating.test.tsx`(오버레이가 열려 있으면 j/k/b/c/t 무시, 버튼에 포커스가 있을 때 Enter·Space 를 `preventDefault` 하지 않음, `code: 'KeyJ'` + `key: 'ㅓ'` 로 이동), `tests/modals/ScheduleModal.test.tsx`(대화상자 속성, `즉시 수집` 호출, 위험 영역 → 확인 창 → Escape 는 확인 창만 닫음).
   - 끝 기준: `pnpm exec vitest run src/tests/Header.test.tsx src/tests/HotkeyGating.test.tsx src/tests/HotkeyListener.test.tsx src/tests/CommandPalette.test.tsx src/tests/modals/ScheduleModal.test.tsx src/tests/chat/HandoverIntegration.test.tsx` 통과, 바꾼 파일 eslint·tsc 오류 0.
   - 알려진 중간 상태: 09 가 `page.tsx` 의 `onCloseOverlays` 연결을 빼면, 아직 `Dialog` 로 바뀌지 않은 모달(11·12 진행 중)은 G2 전까지 Escape 로 닫히지 않을 수 있다. G2 에서 해소된다.
10. **[implementer A] 피드 화면** — 09 뒤 (같은 `page.tsx`). spec 설계 4, 9 의 NEWS 행.
    - `components/feed/InsightsBar.tsx`(브리핑 버튼 + 트렌드 펼침 버튼 `aria-expanded`/`aria-controls`, 둘 다 없으면 그리지 않음, 로딩 48px 스켈레톤), `feed/TrendRadarPanel.tsx`(옛 `TechRadar` 내용·동작 NEWS-14 그대로, 토큰), `feed/FeedToolbar.tsx`(카테고리 `ChipGroup`, `SearchField label="키워드 검색" hideLabel` + ref 전달로 `/` 포커스, 소스 `ChipGroup`(첫 칩 `Must-Read`), `Select label="정렬"` 4개 옵션, md 이상 sticky), `feed/FeedStatusBar.tsx`, `feed/FeedPagination.tsx`(페이지 이동 시 상태 줄로 스크롤·포커스), `feed/NewsCardSkeleton.tsx`.
    - `NewsCard.tsx`: spec 4.3. `data-feed-card`, `role`/`article` 유지(`NewsCard.test.tsx:105,123`), 포커스 시 `ring-2 ring-accent ring-offset-2 ring-offset-canvas` + `data-focused="true"`(`:124-125`), 북마크 `title` `보관하기`/`보관됨`, 제목은 `h3` 안 `<button>`, 라벨은 `lib/labels.ts`.
    - `chat/HandoverCtaButton.tsx`: 토큰, 접근 이름 `전용 챗에서 분석`·`전용 AI 챗으로 이동` 유지.
    - `app/page.tsx`: spec 4.1 순서(sr-only `h1`, `InsightsBar`, `FeedToolbar`, 상태 줄, 그리드 1/2/3열, 스켈레톤 6개, `ErrorState`, `EmptyState` + `필터 전체 초기화`, 페이지 이동, 한 줄 푸터), `<main id="main">`, 개요 카드 제거. 모달 렌더 부분과 그 props 는 바꾸지 않는다 (11·12 와 충돌 방지).
    - `CategoryFilter.tsx`, `SourceFilter.tsx`, `TechRadar.tsx`, `DailyBriefingBanner.tsx` 를 지운다 (다른 import 가 없는지 `grep -rn` 으로 확인).
    - `hooks/useNewsFeed.ts`: 필요할 때만, 반환 형태 유지.
    - 테스트: `tests/feed/FeedToolbar.test.tsx`(카테고리 칩 `aria-pressed`·선택 시 소스 `all`·1페이지 콜백, 정렬 `Select` 4값 콜백, Must-Read 칩, 검색 제출·지우기), `tests/feed/InsightsBar.test.tsx`(브리핑 없으면 버튼 없음, 레이더 펼침 `aria-expanded` 토글, 둘 다 없으면 렌더 없음).
    - 끝 기준: `pnpm exec vitest run src/tests/feed src/tests/NewsCard.test.tsx src/tests/chat/HandoverIntegration.test.tsx src/tests/HotkeyGating.test.tsx` 통과, 바꾼 파일 eslint·tsc 오류 0.
11. **[implementer B] 모달 I: 읽기 위주** — 09 와 병렬. spec 설계 5 의 해당 행. `NewsDetailModal.tsx`(`Dialog size="xl"`, 제목 = 기사 제목 2줄, `Tabs` `AI 요약 & 시사점`/`Ask AI 질의응답`, 절 제목 `개발자 시사점`·`핵심 요약 3줄`·`기술 스택`·`상세 본문 요약`, 자체 Escape 리스너 제거, `대화 초기화` → `ConfirmDialog`, 닫을 때 스트림 중단·초기화 유지, 핸드오버 버튼 하나), `news-detail/AskAiPanel.tsx`(`QUICK_PROMPTS` 내보내기·문구 유지, 빠른 질문 칩 가로 스크롤, 입력 `text-base md:text-sm`), `DailyBriefingModal.tsx`(도구줄, 모바일 `MenuButton label="브리핑 작업"`, 결과 `InlineAlert`, `Tabs`, 연동 설정은 위에 쌓임), `McpModal.tsx`(`dl`, `CodeBlock`). page.tsx 가 넘기는 props 이름·형태를 바꾸지 않는다.
    - 테스트: `tests/modals/NewsDetailModal.test.tsx`(`role="dialog"`·`aria-modal`·제목 연결, 탭 전환, `대화 초기화` 가 `ConfirmDialog` 를 열고 `window.confirm` 을 부르지 않음, Escape 로 닫힘).
    - 끝 기준: `pnpm exec vitest run src/tests/modals/NewsDetailModal.test.tsx src/tests/AskAiPanel.test.tsx src/tests/chat/HandoverIntegration.test.tsx` 통과, 바꾼 파일 eslint·tsc 오류 0.
12. **[implementer C] 모달 II: 입력 폼·소스** — 09 와 병렬. `BriefingSettingsModal.tsx`(`Dialog size="md" dismissOnScrim={false}`, `Tabs` 3개, `TextField`, 비밀값 보기 토글, 바닥 `연결 테스트`/`저장`, `InlineAlert`), `WebhookSettingsModal.tsx`(토큰만, 지우지 않음), `SourcesModal.tsx`(`Dialog size="xl" dismissOnScrim={false}`, `Tabs` 기본 첫 탭, `window.confirm` → `ConfirmDialog` 문구 `이 소스를 목록에서 삭제하시겠습니까?`, 안내는 대화상자 안 `aria-live`), `sources/DeepResearcherTab.tsx`(지표 2열/4열), `sources/SourcesListTab.tsx`(md 이상 표, 모바일 세로 카드, `Switch aria-label="{이름} 수집 켜기"`, `IconButton label="{이름} 삭제"`, 등록 폼 `TextField`). props 이름·형태 유지.
    - 테스트: `tests/modals/SourcesModal.test.tsx`(MSW 로 목록, 삭제 버튼 → `ConfirmDialog`, 취소하면 요청 없음, `window.confirm` 미호출, 배경막 클릭으로 안 닫힘), `tests/modals/BriefingSettingsModal.test.tsx`(탭 3개, 입력 라벨, 배경막 클릭으로 안 닫힘·Escape 로 닫힘).
    - 끝 기준: 위 두 테스트 통과, 바꾼 파일 eslint·tsc 오류 0.
13. **[implementer D] 챗 셸** — 09 와 병렬 (팔레트 연결만 09 뒤). spec 설계 6.
    - `ChatHeader.tsx`: `h-14` 한 줄 `<header>`. **`ChatContextBar` 는 `ChatHeader` 가 `<header>` 바로 뒤 형제로 그린다** (스코프 토글·기사 칩이 `ChatHeader` 렌더 안에 남아 `ChatHeader.test.tsx:35,50` 이 그대로 통과. R4 는 `<header>` 요소 높이만 잰다). 제목 `AI 챗` 은 따로 된 요소(`:22` 정확 일치). 모델 칩은 `hidden md:inline-flex` 로 DOM 에 남긴다(`ChatWorkspace.test.tsx:300` 이 트리거 2개를 센다). 새 대화 `IconButton label="새 대화 시작"` 표시 조건 `!isDesktop || !isSidebarOpen`. `xs:` 제거. 더보기 메뉴(테마 라디오 3개, `뉴스 피드로 이동`, 모바일 `커맨드 팔레트`). `ChatHeaderProps` 에 새 props 를 더할 때는 선택(`?`)으로만 (`ContractAndMsw.test.ts:1016-1025`). 이 props 타입을 `types/chat.ts` 에서 바꿔야 하면 멈춘다 (01 이후 `types/**` 변경은 계약 검토 대상).
    - `ChatContextBar.tsx`(새): `SegmentedControl aria-label="검색 스코프 모드"` 버튼 `단일 기사 (Scoped)`/`전체 코퍼스 (Global)` `aria-pressed`, `ActiveSourceChip`(`기사 컨텍스트 해제`), `h-11` 가로 스크롤. `FastMCP` 같은 기사 제목을 칩 밖에 다시 쓰지 않는다 (`ChatWorkspace.test.tsx:42` 단일 조회).
    - `ChatWorkspace.tsx`: `isDesktop = useMediaQuery('(min-width: 1024px)')`, `window.innerWidth` 제거, 경고 토스트 → `useToast` warning(문구 유지) + `<ToastRegion />` 하나 마운트(07 의 중복 마운트 규칙), 루트 요소는 첫 자식 그대로 `overflow-x-hidden`·`max-w-full`·인라인 높이 유지(`MobileViewport.test.tsx:72-109`), 데스크톱 사이드바는 지금처럼 항상 렌더 + `hidden lg:flex`. 챗 커맨드 팔레트(`CommandPalette commands=…`, ⌘K 는 `ChatHeader` 의 `useHotkey`)는 09 가 done 이 된 뒤 연결한다. 그 전에 나머지가 끝나면 task 파일 '다음' 에 적고 대기한다.
    - `ChatHistoryDrawer.tsx`: `Drawer side="left" header={기존 머리줄} labelledBy=… backdropTestId="drawer-backdrop"`, `id="chat-history-drawer"`, 안의 `nav aria-label="대화 기록 목록"` 유지, 보이는 `대화 기록` 글자와 `닫기` 버튼(`대화 기록 드로어 닫기`)이 각각 하나 (`ChatHistoryDrawer.test.tsx:67,79`, `ChatSidebar.test.tsx:190`). 자체 Escape 리스너 제거.
    - `ChatSidebar.tsx`, `ChatSidebarHeader.tsx`, `SessionList.tsx`, `SessionItemCard.tsx`(활성: `bg-accent-soft border-l-2 border-accent`, `aria-current="true"`, `data-active="true"`, 삭제 버튼은 카드 안에 남김 — `ChatSessionWorkflow.test.tsx:136`), `SessionEmptyState.tsx`, `SessionListSkeleton.tsx`(`data-testid` 유지), `DeleteConfirmPopover.tsx`(`Popover role="dialog"`, 이름 `이 대화를 삭제하시겠습니까?`, `삭제`/`취소`, 자체 Escape 리스너 제거), `ActiveSourceChip.tsx`, `app/chat/page.tsx`.
    - 테스트 수정: `tests/chat/ChatSidebar.test.tsx:240-241` (아래 '증명' 표). `tests/chat/ChatHeader.test.tsx` 에 추가: `matchMedia` 를 1024 미만으로 목 → `새 대화` 버튼이 보이고 누르면 `onNewChat`, 1024 이상 + 사이드바 열림 → 없음.
    - 끝 기준: `pnpm exec vitest run src/tests/chat/ChatHeader.test.tsx src/tests/chat/ChatSidebar.test.tsx src/tests/chat/ChatHistoryDrawer.test.tsx src/tests/chat/ChatSessionWorkflow.test.tsx src/tests/chat/ActiveSourceChip.test.tsx src/tests/chat/MobileViewport.test.tsx` 통과 (`ChatWorkspace.test.tsx` 는 14 가 261행을 고치므로 G2 에서 함께 본다), 바꾼 파일 eslint·tsc 오류 0.
14. **[implementer E] 챗 메시지·입력** — 09 와 병렬. spec 설계 6 의 메시지 열·입력 영역, 5 의 포커스 필터·Popover 행, UI-12·13.
    - `ChatMessageList.tsx`(`role="log"` `aria-live="polite"`, `overflow-x-hidden w-full max-w-full`, `AgentLens AI 챗` 문구), `ChatMessageItem.tsx`(사용자 `bg-accent-soft text-fg`, 답변 컨테이너는 배경 없이 토큰이지만 **`.rounded-2xl.p-4` + `flex-1 min-w-0 max-w-full` 클래스를 유지**(`ChatMessageItem.test.tsx:228-232`), 인라인 코드 `break-all font-mono text-[12px] bg-surface-muted`), `CitationBadge.tsx`(보충 `[S1]`: `bg-success-soft text-success` + `data-tone="supplementary"`, `aria-haspopup="dialog"`), `CitationPopover.tsx`(`Popover role="dialog"`, 자체 Escape 리스너 제거), `WorkflowStepTracker.tsx`(머리줄 `.flex.items-center.gap-2.font-medium` 유지), `ExportToolbar.tsx`(모바일 아이콘 44px, 접근 이름 4개 유지, `useCopyToClipboard`), `ModelTierBadge.tsx`, `ModelChangeDivider.tsx`, `ChatModelSelector.tsx`(`Popover role="radiogroup"`, `text-xs`·`font-semibold`·`top-full` 유지, 자체 Escape 리스너 제거, props 유지), `ChatPromptInput.tsx`(`text-base sm:text-sm` 유지, 전송·중단 `IconButton` 44px, 안내 문구 lg 이상), `FocusCapsule.tsx`, `FocusBottomSheet.tsx`(`Dialog size="sm" mobile="sheet" closeLabel="필터 닫기" backdropTestId="bottom-sheet-backdrop"`, 스와이프는 `role="dialog"` 요소, 기준 768px, 이름·라벨 유지), `components/MarkdownViewer.tsx`(토큰, 모든 폭 14px, `.markdown-viewer`·`.markdown-content`·`.code-block-wrapper`·`.table-wrapper` 와 `ResponsiveLayout.test.tsx` 가 보는 클래스 유지, 코드 블록은 `ui/CodeBlock` 재사용 가능).
    - 테스트 수정: `ChatMessageItem.test.tsx:188, 266`, `CitationBadge.test.tsx:99-100`, `ChatWorkspace.test.tsx:261` (아래 '증명' 표).
    - 끝 기준: `pnpm exec vitest run src/tests/chat/ChatMessageItem.test.tsx src/tests/chat/ChatMessageList.test.tsx src/tests/chat/CitationBadge.test.tsx src/tests/chat/WorkflowStepTracker.test.tsx src/tests/chat/ExportToolbar.test.tsx src/tests/chat/ChatModelSelector.test.tsx src/tests/chat/ChatPromptInput.test.tsx src/tests/chat/FocusCapsule.test.tsx src/tests/chat/FocusBottomSheet.test.tsx src/tests/ResponsiveLayout.test.tsx src/tests/AskAiPanel.test.tsx` 통과, 바꾼 파일 eslint·tsc 오류 0.

**관문 G2** (09~14 done 뒤): frontend 검사 종료 코드 0 (`ChatWorkspace.test.tsx` 포함 전체), `make build` 성공. 커밋.

### 웨이브 3 — 정리·검증·문서 (순서대로)
15. **[implementer A] 옛 덮어쓰기 제거와 정적 검사** — G2 뒤 단독.
    - `globals.css` 에서 `html:not(.dark) …`, `html.dark …` 선택자와 `!important` 를 모두 지운다.
    - `tests/design/TokenGuard.test.ts`: spec 11.3 의 정규식 그대로 `src/**/*.tsx` 를 읽어 hex 색 클래스, 팔레트 색 유틸리티, `animate-in`·`zoom-in`·`slide-in-from` 0개, `globals.css` 의 `!important`·`html:not(.dark)`·`html.dark` 0개. 실패 메시지에 파일:줄을 낸다.
    - `tests/design/TokenContrast.test.ts`: `globals.css` 의 `:root`·`.dark` 블록에서 값을 읽어 spec 1.3 표의 모든 조합을 WCAG 상대 휘도로 계산, 글자 ≥4.5, `border-strong`·`accent`(포커스) 대 배경 ≥3.
    - 두 테스트가 찾은 남은 위반은 이 단계에서 해당 파일을 고친다 (모두 '변경 파일' 안). 테스트를 느슨하게 하지 않는다. 대비가 1.3 표 값과 달라 실패하면 멈추고 보고한다 (토큰 값 변경은 spec 결정이다).
    - 끝 기준: frontend 검사 전체 종료 코드 0, `grep -rEn --include='*.tsx' -e '-\[#[0-9a-fA-F]{3,8}\]' frontend/src` 출력 없음, `grep -c '!important' frontend/src/app/globals.css` 가 0, `make build` 성공.
16. **[implementer A] ui-audit 실행과 폭별 결함 수정** — 15 뒤 단독.
    - 준비: `docker compose up -d --build` (저장소 루트, 바뀐 frontend 이미지로), `curl -f http://127.0.0.1:8000/health`, `wget -qO- http://127.0.0.1:3001/api/health`. 피드에 기사가 6건 이상 있어야 R5 를 잴 수 있다. 없으면 초기화 명령을 쓰지 말고 task 를 `blocked` 로 두고 보고한다.
    - 실행: `cd frontend && CHROME_PATH=<로컬 Chrome> node scripts/ui-audit.mjs`. 실패 항목은 해당 화면 파일을 고치고 다시 돈다 (전부 '변경 파일' 안). 고칠 때마다 frontend 검사를 다시 통과시킨다.
    - 결과: `docs/features/ui-redesign/audit/report.json` 과 대표 PNG 8장을 남긴다 (커밋 대상). `--screenshots all` 결과는 `--out` 을 스크래치 경로로 줘서 커밋하지 않는다. Chrome·Docker 가 없으면 `blocked` 로 두고 사유를 적는다 (verify.md 에서 미검증으로 표시).
    - 끝 기준: `report.json` 의 모든 조합 `pass: true`, frontend 검사 종료 코드 0, 전체 `make check` 는 '증명' 의 알려진 backend 실패 2개 외 실패 없음 (그 뒤 `git status` 로 `config.json`·`sources.json` 변경을 되돌림). `docker compose down` 은 하지 않아도 된다.
17. **[main 세션] 통합·상세 문서 반영** — 16 뒤. 메인 세션이 쓴다 (문서는 역할 게이트 대상이 아니다). spec 설계 10 그대로: 새 `docs/design-system.md`(1~9절. 07 에서 더한 `Dialog` 선택 props, `ToastRegion` 중복 마운트 규칙, 오버레이 스택의 리스너 부착 방식, CSP 사용 시 인라인 스크립트 nonce 주의(우려 사항 9) 포함), `docs/ui-spec.md`, `docs/functional-spec/07·01·02·04·05·06`, `docs/known-issues.md`, `docs/tech-spec.md`('공통 규칙' 한 줄, '상세 문서' 행, '기술 선택과 근거' 4행 — CSS 변수 토큰 + `@theme inline`, 자체 공통 부품, 시스템 글꼴, 오버레이 스택, 근거 E1~E6 — '변경 이력' `| 2026-11-xx | ui-redesign | 공통 규칙, 상세 문서, 기술 선택과 근거 |`), `docs/test-strategy.md`(테스트 수 갱신, 정적 검사 종류, `ui-audit` 는 `make check` 밖의 수동 검사라는 점과 실행 명령), `docs/test-cases.md`(새 테스트 파일). 각 문서 `Updated:` 갱신. 끝 기준: spec 설계 10 의 문서별 항목을 하나씩 대조해 빠진 것이 없다.
18. **[implementer A] 리뷰 후속** — 17 뒤, 단독. reviewer 지적을 고친다. 바꾸는 파일은 모두 '변경 파일' 안이다.
    - a) 버전 배지 (spec 설계 3 재승인본, E16): `components/Header.tsx:19` 의 `package.json` import 를 지우고 `process.env.NEXT_PUBLIC_APP_VERSION` 을 쓴다. 값이 없으면 배지를 그리지 않는다. `frontend/next.config.ts` 의 `env` 에 `NEXT_PUBLIC_APP_VERSION` 을 `package.json` 의 `version` 으로 넣는다 (설정 파일에서만 읽는다). `src` 어디에도 `package.json` import 를 두지 않는다. `tests/Header.test.tsx` 의 버전 테스트를 `vi.stubEnv` 로 값 있음(`v{값}` 보임)·없음(배지 없음) 두 경우로 바꾸고 `vi.unstubAllEnvs()` 로 정리한다.
    - b) 줄어든 움직임: `components/chat/ChatMessageList.tsx:40`, `components/chat/ChatPromptInput.tsx:74` 의 `scrollIntoView({ behavior: 'smooth' })` 를 `prefers-reduced-motion: reduce` 이면 `'auto'` 로 (spec 1.2. `news-detail/AskAiPanel.tsx:82` 와 같은 방식). `MobileViewport.test.tsx` 의 `{block:'end'}` 호출 단언은 그대로 통과해야 한다.
    - c) 수집 중 초기화 차단과 회차 구분: 커맨드 팔레트의 초기화 명령도 `isCollecting` 이면 비활성 (`Header.tsx:216` 이 넘기는 값, `CommandPalette.tsx:149` 의 명령 비활성 처리 — 더보기 메뉴 `Header.tsx:118`, `ScheduleModal.tsx:74` 와 같은 조건). `hooks/useCollector.ts:79, 98`: 초기화(또는 새 수집)를 시작할 때 회차 번호를 올리고, 진행 폴링 응답이 돌아왔을 때 요청 당시 회차가 지금 회차와 다르면 버린다 (이전 회차 진행 응답이 새 폴링 상태를 덮지 않게).
    - d) `ConfirmDialog` 포커스: `busy` 로 버튼이 비활성되면 포커스가 `body` 로 빠지는 문제. `busy` 동안 포커스를 대화상자 컨테이너(`tabIndex={-1}`)에 두고, `busy` 가 풀리면(실패 포함) 대화상자 안으로 돌린다 — `error` 가 있으면 오류 문구(`InlineAlert`, `tabIndex={-1}`), 없으면 확인 버튼. 파일: `components/ui/ConfirmDialog.tsx`, `hooks/useFocusTrap.ts`. 테스트 추가: `tests/ui/Dialog.test.tsx`(또는 새 `tests/ui/ConfirmDialog.test.tsx`)에 busy 중 `document.activeElement` 가 대화상자 컨테이너, 실패로 풀리면 오류 문구, 오류 없이 풀리면 확인 버튼인지 검사.
    - e) 문서: 화면·동작이 바뀐 점(버전 배지 숨김 조건, 팔레트 초기화 비활성, reduced-motion 스크롤, 확인 창 포커스)을 task 파일 '결정'·'다음' 에 적는다. 문서(`docs/functional-spec/07-ui-common.md`, `docs/ui-spec.md`, `docs/design-system.md`, `docs/known-issues.md` 의 '챗 smooth 스크롤' 행)는 메인 세션이 고친다. 18 은 문서를 고치지 않는다.
    - 끝 기준: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 코드 0, `make build` 성공, `grep -rl 'devDependencies' frontend/.next/static` 출력 없음, `grep -rn "package.json" frontend/src --include='*.ts' --include='*.tsx'` 에 import 없음.

### 의존 관계 요약
```
01 ┐
02 ├─ G0 ─ 05 ─┬─ 06 ┐
03 │           ├─ 07 ┼─ G1 ─┬─ 09 ─ 10 ─────────┐
04 ┘     08 ───┘     │      ├─ 11 ───────────────┤
                     │      ├─ 12 ───────────────┼─ G2 ─ 15 ─ 16 ─ 17 ─ 18
                     │      ├─ 13 (팔레트 연결은 09 뒤) ┤
                     │      └─ 14 ───────────────┘
```
- 같은 파일을 두 단계가 고치는 곳은 모두 순서가 정해져 있다: `layout.tsx` 04→07, `page.tsx` 09→10, `globals.css` 04→15, `Header.tsx`·`CommandPalette.tsx`·`NewsCard.tsx` 03→09/10, 모달 파일 02→11/12, 챗 파일 01→13/14, `ThemeSystem.test.tsx` 01→(04 는 실행만).
- 웨이브 2 의 다섯 단계는 파일이 겹치지 않는다. `MarkdownViewer.tsx` 는 14 만, `HandoverCtaButton.tsx` 는 10 만, `ChatModelSelector.tsx` 는 14 만 고친다 (13 의 `ChatHeader` 는 props 를 그대로 쓴다).

### 2차 (19~28단계, spec 설계 14)
spec 14.11 의 제안(19~24)을 파일 소유가 겹치지 않게 다시 나눴다. 제안과 다른 점: ① 카테고리 라벨(`labels.ts`)과 카드(`NewsCard`)를 한 단계(22)에 묶어 웨이브 4 로 당겼다 — `labels.ts` 를 바꾸면 `NewsCard.test.tsx:51` 이 함께 바뀌어야 하므로 두 파일의 소유를 나누면 중간에 깨진 상태가 생긴다. ② 공통 부품을 스크롤 줄(20)과 오버레이·알림·탭(21)으로 나눠 병렬로 돌린다. ③ 상세·브리핑·수집 제안 단계를 Ask AI(25)와 폼·수집(26)으로 나눴다. ④ ui-audit 강화(19)는 수정 전 코드를 `git worktree` 로 따로 띄워 재므로 20~22 와 병렬이다 (spec 14.11 의 '앱 코드를 고치기 전에' 는 같은 작업 트리를 쓴다는 전제였다).

#### 2차 공통 규칙 (1차 '모든 단계 공통 규칙'·'단계 끝 검사 기준' 에 더한다)
- 기준은 spec 설계 14 와 R14~R32 다. 1차 설계(0~13)와 다르면 14 가 이긴다 (ChipGroup 마스크, Escape 예외 R26, 겹친 대화상자 순서, 카테고리 라벨 문구).
- 새 색 토큰·새 의존성 없음. 색은 1.3 표의 토큰만. `TokenGuard.test.ts`·`TokenContrast.test.ts` 가 계속 통과해야 한다.
- **실패 테스트 먼저 (20~26, 모두 결함 수정 성격)**:
  1. 단계에 적힌 '먼저 실패하는 테스트' 를 쓴다. 새 모듈·새 prop 이 필요하면 시그니처만 있는 빈 구현(빈 `Set` 을 돌려주는 함수, 받기만 하는 prop)을 함께 둬서, 실패가 import 오류·타입 오류가 아니라 **단언**에서 나게 한다.
  2. `cd frontend && pnpm exec vitest run <그 테스트 파일>` 로 실패를 확인한다. 실패 메시지가 단계에 적힌 '예상 실패 이유' 와 같은지 본다. 셀렉터 오타·목 누락 같은 다른 이유로 실패하면 테스트를 고쳐 예상 이유로 실패하게 만든다. 고치기 전인데 통과하면 멈추고 task 를 `blocked` 로 둔다 (결함 이해가 틀렸다).
  3. 실패 출력 요약(테스트 이름, 기대값/실제값 1~3줄)을 task 파일 '검사 결과' 에 붙이고, **자기 테스트 파일(과 빈 구현)만** 커밋한다: `git add <경로…> && git commit -m "test(ui-redesign): NN 실패 테스트 — <요지>" -- <경로…>`. 같은 작업 트리의 다른 implementer 파일을 add 하지 않는다. `index.lock` 오류면 몇 초 뒤 다시 한다. (1차 규칙 'implementer 는 커밋하지 않는다' 의 유일한 예외다. 구현 커밋은 관문에서 메인 세션이 한다.)
  4. 그 다음 코드를 고쳐 통과시킨다. 테스트를 다시 고쳐 통과시키지 않는다.
  - jsdom 으로 잴 수 없는 배치 결함(F1·F3·F4·F9~F14 의 잘림·자리표시·카드 어긋남·간격·정렬, `keepAll`, 챗 알림 위치)의 '먼저 실패하는 증거' 는 19 가 커밋한 `audit/baseline-1ec8a9b/report.json` 의 실패 항목이다. 해당 단계는 task 파일에 그 항목(검사 이름·폭·요소 경로)을 인용하고, 같은 결함의 구조(클래스·속성·DOM 위치)를 단위 테스트로 함께 단언한다. 고친 뒤의 확인은 27 의 전체 측정이다.
- **기존 테스트**: 바꿀 수 있는 기존 줄은 '증명' 의 2차 표(우려 10) 6줄뿐이다. 그 밖의 기존 테스트 파일에는 새 `it`/`describe` 블록과 import 이름 추가만 한다. 기존 단언이 깨지면 코드를 고친다.
- **병렬 단계 끝 검사**: 1차 규칙대로 담당 범위만 본다. 같은 웨이브의 다른 단계가 고치는 테스트 파일(예: 20 과 22 가 함께 도는 동안 `FormControls.test.tsx`)의 실패는 그 단계 몫이니 task 파일 '막힌 점' 에 적기만 한다.
- **측정 훅 계약**: 19 의 ui-audit 과 20~26 의 화면이 아래 속성으로 만난다. 화면 단계는 이 속성을 반드시 단다. 19 는 수정 전 코드(속성 없음)에서도 F1~F4 를 잡아야 하므로 `scrollRow`·`clip`·`rowAlign`·`placeholder` 는 속성 없이도 대상을 찾는다 (`scrollRow` 대상 = `[data-scroll-row]` ∪ 계산된 `overflow-x` 가 `auto`/`scroll` 인 `role="group"` 요소, `rowAlign` 은 `[data-feed-card]` 와 그 안 `h3` 로 판정하고 머리줄 줄바꿈 판정은 `[data-card-meta]` 가 있을 때 더함). `vRhythm`·`chatAlign`·`toast` 는 아래 필수 대상이 없으면 '대상 없음' 실패로 기록한다 (조용한 통과 금지).

  | 속성 | 요소 | 다는 단계 | 쓰는 검사 |
  |---|---|---|---|
  | `data-scroll-row`, `data-overflow="none\|start\|end\|both"` | `ScrollRow` 의 스크롤 줄 (칩 줄 포함) | 20 | `scrollRow`, `clip` 가로 제외 |
  | `data-feed-card` (있음) | 뉴스 카드 | 22 (유지) | `rowAlign`, R5 |
  | `data-card-meta` | 카드 머리줄 | 22 | `rowAlign` |
  | `data-insights-bar` | 요약 바 바깥 요소 | 23 | `vRhythm` |
  | `data-feed-toolbar`, `data-toolbar-row` | 툴바 바깥, 툴바의 각 줄 | 23 | `vRhythm` |
  | `data-feed-status` | 상태 줄 바깥 | 23 | `vRhythm` |
  | `data-chat-sidebar-head` | 챗 사이드바 머리 영역 (두 줄 전체) | 24 | `chatAlign` |
  | `data-chat-context-bar` | 맥락 줄 바깥 | 24 | `chatAlign` |
  | `data-chat-column` | 메시지 열 (`max-w-3xl` 상자) | 24 | `chatAlign`, `toast` |
  | `data-composer` | 입력 영역 상자 | 24 | `chatAlign`, `toast` |
  | `data-toast-region="global\|composer"` | 알림 영역 | 21 (값), 24 (composer 마운트) | `toast` |

- **ui-audit 실행 환경** (19, 27): backend `curl -f http://127.0.0.1:8000/health` 가 성공하고 피드 기사가 6건 이상이어야 한다 (없으면 초기화·수집 명령을 쓰지 말고 `blocked`). Chrome 은 `CHROME_PATH`(1차 값 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`). frontend 는 프로덕션 빌드만 쓴다 (R31): `pnpm build` 뒤 `pnpm start -p <포트>`. `output: "standalone"` 때문에 `next start` 가 거부하면 `.next/static` 을 `.next/standalone/.next/static` 으로, `public` 을 `.next/standalone/public` 으로 복사한 뒤 `PORT=<포트> node .next/standalone/server.js`. 개발 서버(3001)는 건드리지 않는다. `/api` 는 `next.config.ts` rewrites 기본값(`http://127.0.0.1:8000`)으로 backend 에 붙는다. 포트: 현재 코드 3101, 수정 전 코드 3102. 띄운 서버는 단계 끝에 끈다.
- 이 웨이브들의 구현 커밋은 관문 G3·G4·G5 에서 메인 세션이 한다. 관문 실패는 담당 implementer 에 SendMessage 로 이어서 시킨다 (task 파일 `Agent:` 의 ID).

#### 웨이브 4 — 측정 강화와 공통 부품 (19~22 병렬, implementer 넷)
19. **[implementer A] ui-audit 판정 강화·자체 검증·수정 전 기준선** — 18 뒤. 20·21·22 와 병렬 (`frontend/scripts/**` 와 `audit/baseline-1ec8a9b/` 만 고친다. `frontend/src` 를 건드리지 않는다). spec 14.8, R29~R31, R30 ①.
    - 담당 파일: `frontend/scripts/ui-audit.mjs`, 새 `frontend/scripts/ui-audit-fixtures/defects.html`·`clean.html`·`dev-indicator.html`, 새 `docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json`.
    - 할 일:
      - 기존 R3~R9 측정은 그대로 두고 14.8 표의 검사 10개(`clip`, `placeholder`, `occluded`, `rowAlign`, `scrollRow`, `ariaControls`, `keepAll`, `vRhythm`, `chatAlign`, `toast`)를 더한다. 조합마다 `checks.<이름> = { pass, failures[] }`(요소 경로·접근 이름·rect·이유). 기준값(1px 허용, 12~16px, 16px, 다섯 점 4px 안쪽, 끝 40자 등)은 스크립트 상단 상수.
      - 대상 찾기는 위 '측정 훅 계약' 대로 (수정 전 코드에서도 F1~F4 를 잡는 대체 선택자 포함).
      - 측정 상태: `/`·`/chat` 기본, `DIALOGS` 9개(뉴스 상세는 `AI 요약 & 시사점`·`Ask AI 질의응답` 탭 둘 다), 추가 3개(`/` 레이더 펼침, `/chat?sourceId={첫 카드 id}`, `/chat?sourceId=999999999`). 각 상태에서 `clip`, `placeholder`, `occluded`, `scrollRow`, `ariaControls`, `keepAll`. `rowAlign`·`vRhythm` 은 `/` 기본 상태, `chatAlign` 은 `/chat` 1024 이상, `toast` 는 경고 알림 상태.
      - 환경: 페이지에 `nextjs-portal` 이 있으면 '개발 서버' 환경 오류로 종료 2. `report.json` 에 `environment: { devIndicator, base, chrome, commit }`, `--commit <sha>` 인자(없으면 `git rev-parse HEAD`).
      - 스크린샷 `--screenshots key`: `{feed,chat}-{light,dark}-{360x780,390x844,768x1024,1024x768,1440x900}.png` 20장 + `{detail,briefing}-light-{390x844,1440x900}.png` 4장 = 24장. `--help` 에 새 인자를 적는다.
      - `--self-test`: 앱 없이 Chrome 만으로 `page.setContent` 로 fixture 를 연다. `defects.html` 은 검사마다 하나 이상의 고정 결함(부모에 잘린 칩, 다른 요소에 가린 칩, 말줄임 없는 넘침, 입력보다 긴 자리표시, 머리줄 줄바꿈으로 제목이 어긋난 카드 두 개, 흐림·버튼 없는 넘친 스크롤 줄, 없는 id 를 가리키는 `aria-controls`, `keep-all` 없는 두 줄 한국어 버튼, 간격 30px 인 요약 바·툴바, 4px 어긋난 챗 열, 입력 영역에서 40px 떨어진 알림)을 `data-expect="<검사 이름>"` 으로 표시한다. `clean.html` 은 같은 구조의 정상판. `dev-indicator.html` 은 `<nextjs-portal>` 을 둔다. 판정: `defects.html` 의 모든 `data-expect` 요소가 해당 검사에서 실패, `clean.html` 은 모든 검사 통과, `dev-indicator.html` 은 환경 오류로 판정 — 셋 다 맞아야 종료 0. fixture 는 앱 번들·`TokenGuard` 대상이 아니다.
      - 수정 전 기준선 (R30 ② 준비, F1~F4 의 '먼저 실패하는 증거'): `git worktree add <scratchpad>/al-1ec8a9b 1ec8a9b` → 그 안 `frontend` 에서 `pnpm install --frozen-lockfile` → `pnpm build` → 포트 3102 로 띄움 → 이 브랜치의 스크립트로 `cd frontend && CHROME_PATH=… node scripts/ui-audit.mjs --base http://localhost:3102 --commit 1ec8a9b --screenshots none --out "$(git rev-parse --show-toplevel)/docs/features/ui-redesign/audit/baseline-1ec8a9b"`. 종료 1 이 정상이다. 끝나면 서버를 끄고 `git worktree remove <경로>`.
      - 기준선에서 F1~F4 중 하나라도 실패로 나오지 않으면 검출을 고친다 (기준값을 느슨하게 하거나 대상을 좁혀 맞추지 않는다. `clean.html` 이 계속 통과해야 한다).
    - 끝 기준: `cd frontend && pnpm exec eslint scripts/ui-audit.mjs` 오류 0, `node scripts/ui-audit.mjs --help` 에 `--self-test`·`--commit` 이 나옴, `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0, `baseline-1ec8a9b/report.json` 의 `environment.devIndicator` 가 `false`·`commit` 이 `1ec8a9b` 이고 실패 목록에 F1(1440 `소스` 그룹 `scrollRow` 또는 `clip`), F2(390 `카테고리` 그룹 `scrollRow`), F3(`placeholder` 검색창), F4(768·1024·1440 중 하나 이상 `rowAlign`)가 있음 — 해당 failures 를 task 파일에 인용한다. 그 밖에 기준선이 보고한 실패(`keepAll`, `vRhythm`, `chatAlign`, `toast`, `ariaControls` 등)도 검사별 건수로 적는다 (20~26 이 인용한다). Chrome·backend·데이터가 없으면 `blocked`.
20. **[implementer B] 스크롤 줄·입력 말줄임·한국어 줄바꿈** — 18 뒤. 19·21·22 와 병렬. spec 14.3, 14.2(입력 `text-ellipsis`), 14.6(줄바꿈 기본값). R15·R16(부품)·R21(줄바꿈).
    - 담당 파일: `components/ui/Chip.tsx`, 새 `components/ui/ScrollRow.tsx`, 새 `hooks/useScrollOverflow.ts`, `components/ui/TextField.tsx`, (필요할 때만) `components/ui/SearchField.tsx`, `app/globals.css`, 새 `tests/ui/ChipGroup.test.tsx`.
    - 할 일:
      - `useScrollOverflow(ref)`: `'none'|'start'|'end'|'both'` 를 돌려준다. `ResizeObserver`(줄과 자식)·`scroll` 이벤트에서 `scrollLeft`·`scrollWidth`·`clientWidth` 로 판정 (1px 허용). 상태 갱신은 관찰자·이벤트·`requestAnimationFrame` 콜백 안에서만 (`react-hooks/set-state-in-effect`). **`ResizeObserver` 가 없으면(jsdom) 던지지 않고** 처음 한 번과 `scroll`·`resize` 이벤트로만 잰다 — `setup.ts` 를 바꾸지 않는다 (FeedToolbar·FocusBottomSheet 등 기존 테스트가 목 없이 렌더한다).
      - `ScrollRow`: 14.3 의 DOM — 바깥 감싸개(`relative flex min-w-0 items-center gap-1`) 안에 [이전 버튼] [스크롤 줄] [다음 버튼]. 스크롤 줄에 `data-scroll-row`, `data-overflow`, 호출자가 주는 속성(`role`, `aria-label`)을 단다. 버튼은 줄 **밖** 형제, 칩을 덮지 않는다, 768 이상에서 넘친 쪽에만 (`IconButton size="sm" variant="ghost"`, 이름 `{label} 이전 항목 보기`/`{label} 다음 항목 보기`, `ChevronLeft`/`ChevronRight`), 누르면 `scrollBy({ left: ±clientWidth × 0.8, behavior })` — 줄어든 움직임이면 `'auto'`, `scrollBy` 가 없으면(jsdom) `scrollLeft` 를 더한다. 흐림은 `data-overflow` 값에 따라 넘친 쪽 24px 만, `none` 이면 마스크 없음. `bleed` 면 768 미만에서 `-mx-4 px-4 scroll-px-4`. 줄 안 요소가 포커스를 받으면 `scrollIntoView({ inline: 'nearest', block: 'nearest' })`, 처음 그릴 때와 `aria-pressed="true"` 자식이 바뀔 때 그 자식이 보이게 스크롤 (DOM 만 읽고 상태를 바꾸지 않는다). 피드 툴바(23), 요약 바 급상승 칩(23), 챗 맥락 줄(24), Ask AI 빠른 질문(25)이 이 부품을 쓴다.
      - `ChipGroup`: `scrollable` 이면 `ScrollRow` 로 그리고 `role="group" aria-label={label}` 은 스크롤 줄에 둔다 (`within(group).getAllByRole('button')` 개수 불변 — `FeedToolbar.test.tsx:33-34,57`). 상시 12px 마스크와 `[scrollbar-width:none]` 아래 숨은 칩 문제(F1)를 없앤다. 새 선택 prop `bleed?`. `scrollable` 이 아니면 지금 그대로 (`FocusBottomSheet` 의 그룹 3개). `Chip` 에 `iconClassName?` 와 아이콘 감싸개 `data-chip-icon`.
      - `TextField`: 입력 요소 기본 클래스에 `text-ellipsis`.
      - `globals.css` `@layer base` 의 `body` 에 `word-break: keep-all; overflow-wrap: break-word;`. 마크다운·코드의 기존 클래스(`break-words`, `break-all`, `[word-break:break-word]`)가 이긴다 (유틸리티 레이어가 base 뒤). 색 토큰 값·다른 규칙은 그대로.
    - 먼저 실패하는 테스트 (`tests/ui/ChipGroup.test.tsx`, `ChipGroup`·`Chip` 공개 API 만 import, `ResizeObserver` 목과 `scrollWidth`/`clientWidth`/`scrollLeft` `defineProperty` 로 넘침을 만든다):
      - 넘치지 않으면 줄의 `data-overflow="none"` 이고 마스크 클래스·스타일 없음 — 예상 실패: 지금 줄에 `data-overflow` 가 없고 상시 `mask-image` 클래스가 있다.
      - 넘침 + `scrollLeft` 0 → `end`, 중간 → `both`, 끝 → `start` — 예상 실패: 속성 없음.
      - 768 이상 목(기본 `setup.ts` 1280)에서 넘친 쪽에만 `카테고리 다음 항목 보기` 버튼, 그 버튼이 `role="group"` 밖, `within(group).getAllByRole('button')` 이 칩 수와 같음 — 예상 실패: 버튼 없음.
      - 다음 버튼을 누르면 줄의 `scrollBy` 가 `clientWidth × 0.8` 로 불림, 칩 포커스 시 `scrollIntoView` 불림 — 예상 실패: 버튼·핸들러 없음.
      - 수정 전 증거 인용: 기준선의 F1·F2 `scrollRow`/`clip`, F3 `placeholder`, `keepAll` 실패.
    - 끝 기준: `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx src/tests/ui/FormControls.test.tsx src/tests/feed src/tests/chat/FocusBottomSheet.test.tsx src/tests/design` 통과 (`FormControls.test.tsx` 의 `labels` 블록 실패는 22 진행 중 상태라 제외하고 적는다), 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
    - 후속 (3차 보정, 2026-11-06): `ScrollRow` 에 768 미만 넘침 표시와 `selectedSelector` prop 을 더한다. 할 일·먼저 실패하는 테스트·끝 기준은 '3차 보정' 의 '20 B 후속'. G6 앞, 22 후속·29 와 병렬.
21. **[implementer C] 겹친 대화상자 순서·챗 알림 영역·탭 `aria-controls`** — 18 뒤. 19·20·22 와 병렬. spec 14.7 C-5·C-2(부품 쪽)·C-1(`Tabs` 쪽). R23(부품)·R24(`Tabs`)·R25.
    - 담당 파일: `lib/overlay-stack.ts`, `components/ui/Toast.tsx`, `components/ui/Tabs.tsx`, (호출부가 바뀌어야 할 때만) `components/ui/Dialog.tsx`·`Drawer.tsx`·`Menu.tsx`·`Popover.tsx`·`ConfirmDialog.tsx`, 테스트 `tests/ui/OverlayStack.test.tsx`·`Toast.test.tsx`·`Tabs.test.tsx` (추가만).
    - 할 일:
      - `overlay-stack.ts` (C-5): 레이어에 `order` 를 둔다. `useOverlayLayer` 가 `open` 이 false→true 로 바뀌는 렌더에서 모듈 카운터로 번호를 받는다 (렌더 중 이전 값 비교 패턴. 부모가 자식보다 먼저 렌더되므로 부모 < 자식. 카운터 증가는 모듈 범위 함수 안에서 하고 `eslint-disable` 을 쓰지 않는다). `push` 는 `order` 오름차순 자리에 넣고, 맨 위·`inert`·Escape 는 정렬된 스택을 본다. 다시 열면 새 번호. `useOverlayLayer` 의 인자·반환은 그대로. `kind === 'modal'` 레이어가 있는지 구독하는 함수를 더한다 (`Toast` 영역 고르기용). StrictMode 이중 렌더에서도 번호가 단조 증가하는지 테스트로 본다 (근거 E23 은 가정).
      - `Toast.tsx` (C-2): `ToastRegion` 에 `placement?: 'global' | 'composer'`(기본 `global`). 그릴 영역: 모달 레이어가 없고 `composer` 영역이 등록돼 있으면 가장 나중에 등록된 `composer`, 아니면 처음 등록된 `global` (`global` 끼리는 지금 규칙 그대로 — `Toast.test.tsx:22-42`). `composer` 는 포털 없이 그 자리에 `absolute inset-x-0 bottom-full mb-2 z-60`, 안쪽 `mx-auto max-w-3xl px-4 md:px-6`. 두 영역 모두 `data-toast-region={placement}`. 알림의 `role`·`aria-live`·닫기 버튼·시간은 그대로. `layout.tsx` 는 바꾸지 않는다 (기본 `global`).
      - `Tabs.tsx` (C-1): `aria-controls` 는 패널이 렌더된 탭에만 단다. 기본은 선택된 탭만. 선택되지 않은 패널을 `TabPanel active={false}` 로 DOM 에 남기는 소비자를 위해 상위 호환 선택 prop(예: `mountedPanels?: string[]`)을 두되, 소비 파일은 이 단계에서 고치지 않는다. `TabPanel` 의 `tabIndex={0}`·나머지 속성 전달은 그대로 둔다 (25 가 Ask AI 패널에 포커스를 옮긴다).
    - 먼저 실패하는 테스트:
      - `OverlayStack.test.tsx` 추가: 부모 `Dialog` 와 그 자식 `Dialog` 를 처음부터 `open` 으로 한 번에 렌더 → 맨 위 레이어가 자식, `window` Escape 한 번에 자식만 닫힘, 자식이 열린 동안 부모 대화상자 요소가 `inert`. 같은 내용을 `<StrictMode>` 로 한 번 더. 예상 실패: 자식 effect 가 먼저 `push` 돼 부모가 맨 위 → Escape 가 부모를 닫는다.
      - `Toast.test.tsx` 추가: `<ToastRegion />` 와 `<ToastRegion placement="composer" />` 를 함께 마운트하고 알림을 띄우면 `[data-toast-region="composer"]` 안에 보임, 모달 `Dialog` 를 열고 띄우면 `global` 영역에 보임. 예상 실패: `placement` 를 받기만 하는 빈 구현이라 처음 마운트된 `global` 에만 그린다.
      - `Tabs.test.tsx` 추가: 선택된 패널만 렌더하는 하네스에서 선택되지 않은 탭에 `aria-controls` 가 없고 선택된 탭은 있으며 그 id 요소가 문서에 있음 (`:44` 그대로). 예상 실패: 모든 탭이 패널 id 를 단다 (`Tabs.tsx:106`).
    - 끝 기준: `pnpm exec vitest run src/tests/ui/OverlayStack.test.tsx src/tests/ui/Toast.test.tsx src/tests/ui/Tabs.test.tsx src/tests/ui/Dialog.test.tsx src/tests/ui/ConfirmDialog.test.tsx src/tests/ui/Menu.test.tsx src/tests/modals src/tests/CommandPalette.test.tsx src/tests/chat/ChatWorkspace.test.tsx src/tests/chat/ChatHistoryDrawer.test.tsx src/tests/chat/ChatSidebar.test.tsx src/tests/chat/FocusBottomSheet.test.tsx src/tests/chat/CitationBadge.test.tsx src/tests/chat/ChatModelSelector.test.tsx src/tests/HotkeyGating.test.tsx` 통과 (1차 '증명' R7 의 기존 Escape 테스트 6곳 포함), 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
    - 후속 (3차 보정, 2026-11-06): `Tabs` 의 선택 탭 보이기 effect 를 지우고 `ScrollRow` 의 `selectedSelector` 를 쓴다. 할 일·테스트·끝 기준은 '3차 보정' 의 '21 C 후속'. G6 뒤, 23 후속과 병렬.
22. **[implementer D] 카테고리 라벨·카드 고정 틀·반복 시사점** — 18 뒤. 19·20·21 과 병렬. spec 14.4, R17·R18·R19(라벨 모듈·카드).
    - 담당 파일: `lib/labels.ts`, 새 `lib/feed-insights.ts`, `components/NewsCard.tsx`, `components/feed/NewsCardSkeleton.tsx`, `components/chat/HandoverCtaButton.tsx`, 테스트 `tests/ui/FormControls.test.tsx`(332~335행 + 추가), `tests/NewsCard.test.tsx`(51행 + 추가), 새 `tests/feed/FeedInsights.test.ts`.
    - 할 일:
      - `labels.ts`: `CATEGORY_LABELS` 를 긴 라벨(`하네스 & 벤치마크`, `MCP & 생태계`, `에이전트 아키텍처`, `최신 AI 동향` — `FeedToolbar` 칩과 같은 문구), 새 `CATEGORY_SHORT_LABELS`(`하네스`, `MCP`, `에이전트`, `AI 동향`)와 `categoryShortLabel()`. 모르는 id 는 원값 (`constructor` 같은 프로토타입 키 포함, 지금 `lookup` 규칙). `sourceLabel` 은 그대로. 이 단계 뒤 `NewsDetailModal`·`DeepResearcherTab`·`SourcesListTab` 배지는 파일을 고치지 않아도 긴 라벨이 된다 (상세 배지는 긴 라벨이 spec 대로다). `CitationPopover` 의 짧은 라벨 전환은 24.
      - `feed-insights.ts`: `findRepeatedInsights(items: NewsItem[]): Set<number>` — `why_it_matters` 를 공백 정리(연속 공백 하나로, 앞뒤 제거)한 문자열의 끝 40자를 키로 세어, 정리한 길이 20자 이상이고 키가 2번 이상 나온 기사 id. `page.tsx` 연결은 23.
      - `NewsCard.tsx` (14.4 고정 틀): `Card` 에 `h-full flex flex-col gap-3`. ① 머리줄 `data-card-meta`(`flex items-center gap-2`, `h-11 md:h-8`) — 왼쪽 `min-w-0 flex-1 truncate text-xs text-fg-subtle` 안에 카테고리 짧은 라벨을 **자기 `<span>`** 으로(`font-medium text-fg-muted`, `NewsCard.test.tsx:51` 이 정확 일치로 찾는다) · 소스 · 시간, 오른쪽 북마크 `IconButton`(음수 마진 없음, `title` `보관하기`/`보관됨` 유지). 배지 없음. ② 제목 `h3 > button` `text-base font-semibold leading-6 line-clamp-2 min-h-12`. ③ 본문 `text-sm leading-6 text-fg-muted line-clamp-2 min-h-12` — 시사점이면 `border-l-2 border-accent pl-3` 과 앞머리 `시사점`(`font-semibold text-fg`, 자기 요소), 시사점 문장은 **자기 요소**(`:54` 정확 일치), 새 선택 prop `preferSummary?: boolean`(기본 `false`)이고 `summary` 가 있으면 요약. 둘 다 없으면 빈 2줄 자리. ④ 배지 줄(있을 때만) `flex flex-nowrap gap-1.5 overflow-hidden` — `Must-Read`(`Badge tone="warning"`, 별 아이콘, `:70` 유지) 1 + 기술 스택 `Badge` 최대 3(`max-w-32 truncate`). ⑤ 바닥 `mt-auto border-t pt-2` — 왼쪽 통계(점수, 댓글, 인기: `hotness_score > 25` 일 때 `Flame` + 반올림 값 + `sr-only` `인기 점수`), 오른쪽 `챗에서 분석`·`원문`. `data-feed-card`, `role`/`article`, `ring-2`·`data-focused`(`:105-125`) 유지.
      - `HandoverCtaButton.tsx`: 1024~1279 에서 글자를 숨기고 아이콘만 보이는 선택 prop(예: `compactBetweenLgXl?: boolean`, 글자는 `lg:max-xl:sr-only`). 접근 이름 `전용 챗에서 분석`·`전용 AI 챗으로 이동` 유지, `NewsDetailModal` 쪽 사용은 기본값으로 그대로.
      - `NewsCardSkeleton.tsx`: 같은 틀(머리줄 1, 제목 2, 본문 2, 바닥 1)과 같은 높이 클래스.
    - 먼저 실패하는 테스트:
      - `FormControls.test.tsx:332-335` 를 긴 라벨 4개로 바꾸고(우려 10, '증명' 2차 표), 같은 `describe('labels')` 에 `categoryShortLabel` 4개 + 모르는 id 원값 테스트를 더한다. 예상 실패: `categoryLabel` 이 영문(`Harness` 등)을 돌려준다, `categoryShortLabel` 빈 구현이 원값을 돌려준다.
      - `NewsCard.test.tsx:51` 을 `'하네스'` 로(우려 10). 추가: `[data-card-meta]` 안에 `Must-Read` 와 기술 스택 배지가 없음, 인기 점수가 `인기 점수` 글자와 함께 머리줄 밖(바닥)에 있음, `preferSummary` + `summary` 면 요약이 보이고 시사점 문장이 없음, 시사점 앞머리가 `시사점`. 예상 실패: `Harness` 를 그림, `data-card-meta` 없음, `preferSummary` 무시, 앞머리 `Insight`.
      - `FeedInsights.test.ts`: 같은 문장 2회 → 두 id, `LangGraph 기반 구현에서 ` 접두 변형 + 같은 문장 → 묶임, 20자 미만 무시, 1회 문장 제외, 빈 값·`null` 제외. 예상 실패: 빈 구현이 빈 `Set`.
      - 수정 전 증거 인용: 기준선의 F4 `rowAlign` 실패.
    - 끝 기준: `pnpm exec vitest run src/tests/NewsCard.test.tsx src/tests/feed/FeedInsights.test.ts src/tests/ui/FormControls.test.tsx src/tests/chat/HandoverIntegration.test.tsx src/tests/modals/NewsDetailModal.test.tsx src/tests/modals/SourcesModal.test.tsx src/tests/chat/CitationBadge.test.tsx` 통과 (`FormControls.test.tsx` 의 `ChipGroup` 블록 실패는 20 진행 중 상태라 제외하고 적는다), 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
    - 후속 (3차 보정, 2026-11-06): `labels.ts` 에 레이더 카테고리 라벨 `RADAR_CATEGORY_LABELS`·`radarCategoryLabel()` 을 더한다. 할 일·먼저 실패하는 테스트·끝 기준은 '3차 보정' 의 '22 D 후속'. G6 앞, 20 후속·29 와 병렬.

**관문 G3** (19~22 done 뒤, 메인 세션): `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공, `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0, `git log --oneline` 에 20·21·22 의 `test(ui-redesign): NN 실패 테스트` 커밋이 구현보다 먼저 있음. 웨이브 커밋 (`audit/baseline-1ec8a9b/report.json` 포함).

#### 웨이브 5 — 화면 (23~26 병렬, implementer 넷)
G3 뒤에 시작한다. 20~22 의 공개 API(`ScrollRow`, `ChipGroup bleed`, `Chip iconClassName`, `ToastRegion placement`, `categoryShortLabel`, `findRepeatedInsights`, `NewsCard preferSummary`)만 쓰고 그 파일들을 고치지 않는다. 부품에 버그나 빠진 기능이 있으면 task 에 적고 메인 세션이 소유 implementer(20 B, 21 C, 22 D)에 SendMessage 로 고치게 한다.

23. **[implementer E] 피드 화면: 툴바·요약 바·다시 읽기** — G3 뒤. 24·25·26 과 병렬. spec 14.2, 14.5, 14.0 결정 2. R14·R15(피드)·R16(검색)·R18(연결)·R20·R22.
    - 담당 파일: `components/feed/FeedToolbar.tsx`, `components/feed/InsightsBar.tsx`, `components/feed/FeedStatusBar.tsx`, (필요할 때만) `components/feed/TrendRadarPanel.tsx`·`components/feed/FeedPagination.tsx`, `hooks/useNewsFeed.ts`, `app/page.tsx`, 테스트 `tests/feed/FeedToolbar.test.tsx`·`tests/feed/InsightsBar.test.tsx`(추가만), 새 `tests/hooks/useNewsFeed.test.tsx`.
    - 할 일:
      - `FeedToolbar`: 14.2 표대로 줄마다 `flex` 컨테이너(`data-toolbar-row`), 바깥 `data-feed-toolbar`. ≥1280: [카테고리 `flex-1 min-w-0` + 검색 `w-72`] [소스 `flex-1 min-w-0` + 정렬 `w-32`]. 768~1279: [카테고리 + 정렬 `w-28`] [검색 `md:w-56 lg:w-64` + 소스]. <768: [검색 전체 폭] [카테고리 `bleed`] [소스 `flex-1 min-w-0` + 정렬 `w-28`]. 두 그룹 모두 `ChipGroup scrollable`. 카테고리 칩 아이콘은 `xl` 미만에서 숨김(`iconClassName`). 카테고리 라벨은 `labels.ts` 의 `CATEGORY_LABELS` 에서 (`FEED_CATEGORIES` 는 id·아이콘만 갖고 라벨 표를 두지 않는다, `전체 소식` 은 그대로). 자리표시 `키워드 검색`. sticky 배경용 `py-2` 는 두되 `-my-2` 로 상쇄. 칩 순서·이름·건수·`aria-pressed`, 그룹 이름, Must-Read 첫 칩, 정렬 옵션은 그대로 (`FeedToolbar.test.tsx` 기존 단언).
      - `InsightsBar`: 감싸개 `flex flex-col gap-3`(숨긴 패널이 여백을 만들지 않게), `data-insights-bar`, 브리핑 버튼 `오늘의 브리핑` · 날짜(`max-md:hidden`) · 헤드라인(768 미만 한 줄 말줄임), 급상승 칩 `hidden lg:flex` + `ScrollRow`, 768~1023 은 `트렌드` 버튼만. 스켈레톤은 `loadingRadar` 이고 브리핑·레이더 데이터가 **없을 때만**. 기존 단언(`InsightsBar.test.tsx:29-88`) 유지.
      - `FeedStatusBar`: 바깥에 `data-feed-status`.
      - `useNewsFeed` (C-4, F15): 목록 키(`category, source, search, sort, highSignalOnly, page`)와 다시 읽기 번호를 분리. `loading` 은 '지금 목록 키의 응답이 아직 없음' 일 때만 true, 같은 키를 다시 읽는 동안 이전 `items`·`total`·`totalPages` 유지. 같은 키 다시 읽기 실패는 목록을 지우지 않고 실패 신호를 돌려준다 (`page.tsx` 가 `useToast` 로 `tone: 'danger'`), 키가 바뀐 요청의 실패는 지금처럼 `ErrorState`. 통계·브리핑·레이더는 `Promise.allSettled`. `loadingRadar` 는 한 번도 읽지 못했을 때만 true. 반환 형태는 유지하고 더하는 값은 선택 필드. `lib/api.ts` 는 바꾸지 않는다.
      - `page.tsx`: `findRepeatedInsights(news)` 를 `useMemo` 로 계산해 `NewsCard preferSummary` 로 넘긴다, 그리드 카드가 줄 높이로 늘어남(`items-stretch`, 카드 `h-full`), main 세로 간격 `gap-3 md:gap-4`(요약 바 → 툴바 → 상태 줄 12~16px), 다시 읽기 실패 알림. 모달 렌더 부분과 props 는 바꾸지 않는다.
    - 먼저 실패하는 테스트:
      - `tests/hooks/useNewsFeed.test.tsx` (MSW `server.use` 로 응답 조정, `mocks/**` 불변): (a) 같은 목록 키 다시 읽기 중 `loading` 이 false 이고 이전 `items` 가 그대로 — 예상 실패: `newsReload` 가 요청 키에 들어 있어 `loading` 이 true (`useNewsFeed.ts:24,119`). (b) 통계 요청이 500 이어도 브리핑·레이더가 반영 — 예상 실패: 하나가 실패하면 전부 반영되지 않음. (c) 다시 읽는 동안 `loadingRadar` 가 false — 예상 실패: `statsLoadedFor !== statsReload` 로 true (`:38`). (d) 목록 키가 바뀌면 `loading` true — 지금도 통과할 수 있는 회귀 방지 단언이라 task 파일에 '실패 예상 아님' 으로 적는다.
      - `InsightsBar.test.tsx` 추가: 날짜 요소에 `max-md:hidden`, 급상승 칩 감싸개가 `lg` 미만에서 숨김(`hidden lg:flex`), `loadingRadar` 이어도 브리핑·레이더 데이터가 있으면 스켈레톤 없이 버튼이 보임. 예상 실패: 날짜 클래스 없음, `hidden md:flex`(`InsightsBar.tsx:69`), 로딩이면 늘 스켈레톤(`:37-39`).
      - `FeedToolbar.test.tsx` 추가: 검색 자리표시가 정확히 `키워드 검색`, `[data-toolbar-row]` 가 2개 이상이고 `카테고리` 그룹과 `소스` 그룹이 서로 다른 줄, 카테고리 칩 아이콘 감싸개 `[data-chip-icon]` 에 `xl` 미만 숨김 클래스. 예상 실패: 긴 예시 자리표시(`FeedToolbar.tsx:29`), 한 그리드(`:95`), 아이콘 클래스 없음.
      - 수정 전 증거 인용: 기준선의 F1·F2·F9·F10·F11 `scrollRow`/`clip`, F3 `placeholder`, F12 `vRhythm` 실패.
    - 끝 기준: `pnpm exec vitest run src/tests/feed src/tests/hooks/useNewsFeed.test.tsx src/tests/NewsCard.test.tsx src/tests/HotkeyGating.test.tsx src/tests/chat/HandoverIntegration.test.tsx` 통과, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
    - 후속 (3차 보정, 2026-11-06): `FeedToolbar` 소스 줄의 자체 넘침 표시(`a00fee4`)를 지우고(공통 표시는 `ScrollRow`), `TrendRadarPanel` 카테고리 분포를 `radarCategoryLabel()` 로 그린다. 할 일·먼저 실패하는 테스트·끝 기준은 '3차 보정' 의 '23 E 후속'. G6 뒤, 21 후속과 병렬.
24. **[implementer F] 챗 화면: 줄바꿈·열 맞춤·알림 위치·기록 버튼·라벨** — G3 뒤. 23·25·26 과 병렬. spec 14.6, 14.7 C-1(챗)·C-2(마운트)·C-3, 14.4(챗 라벨). R19(챗)·R21·R23·R24(챗).
    - 담당 파일: `components/chat/ChatMessageList.tsx`, `ChatContextBar.tsx`, `ChatSidebarHeader.tsx`, (필요할 때만) `ChatSidebar.tsx`·`ChatHistoryDrawer.tsx`, `ChatWorkspace.tsx`, `ChatHeader.tsx`, `ActiveSourceChip.tsx`, `FocusCapsule.tsx`, `CitationPopover.tsx` (모두 `frontend/src/components/chat/`), 테스트 `tests/chat/ChatHeader.test.tsx`·`ChatMessageList.test.tsx`(추가만), `tests/chat/ActiveSourceChip.test.tsx`(19행).
    - 할 일:
      - `ChatMessageList`: 추천 질문 버튼에 `text-left` 를 직접(`:67-73`), 메시지 열 상자에 `data-chat-column`. `role="log"`·`aria-live`·`overflow-x-hidden w-full max-w-full` 유지.
      - 열 맞춤 (F14): 맥락 줄 스크롤 영역·메시지 열·입력 영역이 같은 규칙(안쪽 `mx-auto w-full max-w-3xl`, 바깥 `px-4 md:px-6`). `ChatContextBar` 의 스크롤 영역은 `ScrollRow`(이름 `검색 스코프`)로, 바깥에 `data-chat-context-bar`. 스코프 토글·기사 칩 구조와 이름은 그대로 (`ChatHeader.test.tsx:25-50`).
      - `ChatSidebarHeader`: 1줄 56px(`+ 새 대화`, 접기) + 2줄 44px(`대화 검색`), 머리 영역 전체에 `data-chat-sidebar-head`, 아래 경계 100px (헤더 56 + 맥락 줄 44 와 같음). 드로어·사이드바의 기존 이름·단일 조회(`ChatHistoryDrawer.test.tsx:67,79`, `ChatSidebar.test.tsx:190`) 유지.
      - `ChatWorkspace` (C-2): 입력 영역을 `relative` 감싸개로 싸고(입력 영역의 `overflow-x-hidden` 상자 밖) 그 안에 `<ToastRegion placement="composer" />`. 지금의 `<ToastRegion />`(`:765`)는 이것으로 바꾼다 — `ChatWorkspace` 만 렌더하는 테스트(`ChatWorkspace.test.tsx:55` 의 404 알림)는 모달이 없으니 `composer` 영역에서 그대로 찾힌다. 입력 영역 상자에 `data-composer`. 루트 요소 제약(첫 자식, `overflow-x-hidden`·`max-w-full`·인라인 높이 — `MobileViewport.test.tsx:72-109`)과 1차 13·14 의 제약은 그대로.
      - `ChatHeader` (C-1): 기록 버튼의 `aria-controls` 는 `isHistoryOpen` 일 때만 단다, `aria-expanded` 는 늘 (`:111`).
      - `ActiveSourceChip` (C-3): `categoryShortLabel(source.category)` 를 **자기 요소**로 (`ActiveSourceChip.test.tsx:19` 가 `'MCP'` 정확 일치로 찾는다, `FastMCP` 제목과 같은 요소에 두지 않는다).
      - `FocusCapsule`: 자체 라벨 표(`:19-25`)를 지우고 카테고리는 `categoryShortLabel()`, `all` 의 `전체 소식` 은 그대로 (`FocusCapsule.test.tsx:25,67,140`).
      - `CitationPopover`: `categoryShortLabel()`.
      - `FocusBottomSheet.tsx` 는 고치지 않는다 (우려 18).
    - 먼저 실패하는 테스트:
      - `ChatHeader.test.tsx` 추가: 기록이 닫혔을 때 기록 버튼에 `aria-controls` 가 없고 `aria-expanded="false"`, 열렸을 때 `aria-controls` 가 있음. 예상 실패: 닫혀도 `chat-history-sidebar`/`chat-history-drawer` 를 단다.
      - `ChatMessageList.test.tsx` 추가: 추천 질문 버튼마다 `className` 에 `text-left`. 예상 실패: `text-left` 가 부모 grid 에만 있다.
      - `ActiveSourceChip.test.tsx:19` 를 `'MCP'` 로 (우려 10). 예상 실패: 원값 `mcp_plugins_skills` 를 그린다.
      - 수정 전 증거 인용: 기준선의 F13 `keepAll`, F14 `chatAlign`, `toast`, 기록 버튼 `ariaControls` 실패.
    - 끝 기준: `pnpm exec vitest run src/tests/chat` 통과 (`ChatWorkspace`·`MobileViewport`·`ChatSidebar`·`ChatHistoryDrawer`·`FocusCapsule`·`FocusBottomSheet`·`ContractAndMsw` 포함), 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
25. **[implementer G] 기사 상세 Ask AI: 입력 Escape·복사 실패·자리표시·빠른 질문 줄** — G3 뒤. 23·24·26 과 병렬. spec 14.7 C-6·C-8, 14.2(Ask AI 자리표시), 14.3(빠른 질문). R15(Ask AI)·R16·R26·R28.
    - 담당 파일: `components/news-detail/AskAiPanel.tsx`, `components/NewsDetailModal.tsx`, 테스트 `tests/modals/NewsDetailModal.test.tsx`·`tests/AskAiPanel.test.tsx`(추가만).
    - 할 일:
      - `AskAiPanel` (C-6): 질문 입력 `onKeyDown` 에서 `Escape` 이고 IME 조합 중이 아니면 `preventDefault()` 하고 포커스를 가장 가까운 `[role="tabpanel"]`(Ask AI 탭 패널, `TabPanel` 이 이미 `tabIndex={0}`)로 옮긴다. 스택은 `defaultPrevented` 인 Escape 를 무시한다 (`overlay-stack.ts:37`, 이미 있음). 입력 글자·대화 기록 그대로. 패널에서 누른 다음 Escape 는 지금처럼 닫는다. 근거 E22(React 위임 리스너가 `window` 리스너보다 먼저 돈다)는 가정이므로 테스트로 확인하고, 틀리면 `blocked` 로 보고한다 (`stopPropagation` 이나 스택 규칙 변경으로 우회하지 않는다 — 21 소유 파일).
      - 자리표시 `이 기사에 대해 질문하세요` (`:219`).
      - 빠른 질문 칩 줄을 `ChipGroup scrollable`(이름 `빠른 질문`) 또는 `ScrollRow` 로. `QUICK_PROMPTS` 내보내기·문구는 그대로 (`AskAiPanel.test.tsx:51-71`).
      - (C-8) 새 선택 prop `copyFailedIndex?: number | null`: 그 답변의 복사 버튼이 경고 아이콘 + `복사 실패`, 버튼 옆 `sr-only` `aria-live="polite"` 영역에 같은 문구.
      - `NewsDetailModal`: `copyFailedIndex` 상태를 두고 `copyText` 가 false 면 그 번호를 2,000ms 동안 넘긴다 (타이머는 닫힘·언마운트 때 정리). 닫을 때 기록을 지우는 규칙(NEWS-10), 상세 배지(`categoryLabel`, 긴 라벨)는 그대로.
    - 먼저 실패하는 테스트:
      - `NewsDetailModal.test.tsx` 추가: `Ask AI 질의응답` 탭 → 입력에 글자 → 입력에서 Escape → `role="dialog"` 가 남아 있고 입력 값이 그대로이며 `document.activeElement` 가 Ask AI 탭 패널, 이어서 Escape → 대화상자 닫힘. 예상 실패: 첫 Escape 에 대화상자가 닫힌다.
      - `AskAiPanel.test.tsx` 추가: `copyFailedIndex={0}` 이면 첫 답변의 복사 버튼에 `복사 실패` 와 `aria-live="polite"` 영역 — 예상 실패: prop 을 받기만 하는 빈 구현이라 `복사` 그대로. 자리표시가 정확히 `이 기사에 대해 질문하세요` — 예상 실패: 긴 예시 문구.
      - 수정 전 증거 인용: 기준선의 Ask AI 탭 상태 `placeholder` 실패.
    - 끝 기준: `pnpm exec vitest run src/tests/modals/NewsDetailModal.test.tsx src/tests/AskAiPanel.test.tsx src/tests/chat/HandoverIntegration.test.tsx src/tests/ui/Tabs.test.tsx src/tests/ui/OverlayStack.test.tsx` 통과, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
26. **[implementer H] 폼 `aria-controls`·소스 등록 라벨·수집 상태 복원** — G3 뒤. 23·24·25 와 병렬. spec 14.7 C-1(브리핑·소스 폼)·C-7, 14.4(소스 등록 카테고리). R19(소스)·R24·R27.
    - 담당 파일: `components/DailyBriefingModal.tsx`, `components/sources/SourcesListTab.tsx`, `hooks/useCollector.ts`, (필요할 때만) `components/Header.tsx`·`components/ScheduleModal.tsx`·`components/ResetConfirmDialog.tsx`, 테스트 새 `tests/hooks/useCollector.test.ts`, 새 `tests/modals/DailyBriefingModal.test.tsx`, `tests/Header.test.tsx`·`tests/modals/SourcesModal.test.tsx`(추가만).
    - 할 일:
      - `DailyBriefingModal`: `이메일 발송` 버튼의 `aria-controls` 는 주소 입력 줄이 열렸을 때만, `aria-expanded` 는 늘 (`:153`).
      - `SourcesListTab`: `새 피드 직접 등록` 의 `aria-controls` 는 폼이 열렸을 때만 (`:126`). 카테고리 선택지(`:23-28`)의 라벨을 `CATEGORY_LABELS`(긴 라벨)에서, `value` 는 그대로.
      - `useCollector` (C-7, backend·`lib/api.ts` 불변): ① `loadStatus` 가 받은 `is_running` 이 true 이고 진행 폴링이 없으면 `startProgressPolling('실시간 소식 수집 중...')` 으로 이어 붙인다 (`isCollecting: true` → `즉시 수집` 은 `loading`). ② `collectNow` 가 `triggerManualCollect()` 응답 `status === 'already_running'` 이면 다시 요청하지 않고 그 `message` 로 폴링 시작. ③ `resetAndCollect` 가 `status === 'already_running'` 이면 응답 `message` 로 오류를 던져 확인 창 `InlineAlert` 에 보인다. 18 의 회차 구분·팔레트 비활성 규칙은 그대로. 응답 타입이 `already_running` 을 모르면 쓰는 곳에서 좁힌다 (`api.ts` 를 고치지 않는다).
      - 모듈 저장소는 테스트 사이에 상태가 남는다. 테스트는 `vi.resetModules()` + 동적 import 로 격리하고, 테스트 전용 내보내기를 더하지 않는다 (막히면 task 에 적고 메인 세션과 정한다).
    - 먼저 실패하는 테스트:
      - `tests/hooks/useCollector.test.ts` (MSW `server.use`, 가짜 타이머): (a) `/api/schedule/status` 가 `is_running: true` 면 구독 직후 `isCollecting` true 이고 진행 조회가 불림 — 예상 실패: `isCollecting` false, 진행 조회 없음 (`useCollector.ts:143-163`). (b) 즉시 수집 응답이 `already_running` 이면 트리거 POST 1회 뒤 진행 폴링 시작 — 예상 실패: 폴링이 시작되지 않는다. (c) 초기화 응답이 `already_running` 이면 그 `message` 로 거부 — 예상 실패: 성공으로 끝나 `기존 0건 삭제 완료` 흐름.
      - `Header.test.tsx` 추가: 마운트 때 상태가 `is_running: true` 면 `수집 중` 표시와 진행 줄이 보이고 `즉시 수집` 이 눌리지 않음. 예상 실패: 진행 표시 없음, `즉시 수집` 활성.
      - `SourcesModal.test.tsx` 추가: 등록 폼이 닫혔을 때 `새 피드 직접 등록` 에 `aria-controls` 없음, 누르면 생기고 그 id 요소가 문서에 있음. 예상 실패: 닫혀도 `aria-controls`.
      - `DailyBriefingModal.test.tsx`(새, MSW 의 기존 브리핑 응답): 브리핑이 뜬 뒤 `이메일 발송` 에 `aria-controls` 없음, 누르면 생기고 대상이 문서에 있음. 예상 실패: 닫혀도 `aria-controls`.
    - 끝 기준: `pnpm exec vitest run src/tests/hooks/useCollector.test.ts src/tests/Header.test.tsx src/tests/CommandPalette.test.tsx src/tests/modals/SourcesModal.test.tsx src/tests/modals/DailyBriefingModal.test.tsx src/tests/modals/ScheduleModal.test.tsx` 통과, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.

**관문 G4** (23~26 done 뒤, 메인 세션): frontend 세 명령 종료 0, `make build` 성공, 23~26 의 실패 테스트 커밋이 구현보다 먼저 있음, R19 정적 확인(아래 '증명' 2차 R19 명령), `git diff --name-only 1ec8a9b -- backend frontend/src/types frontend/src/mocks frontend/src/lib/api.ts frontend/package.json frontend/pnpm-lock.yaml frontend/src/tests/setup.ts` 0줄. 웨이브 커밋.

#### 웨이브 6 — 전체 측정·문서 (순서대로)
27. **[implementer A] 프로덕션 전체 측정과 결함 정리** — G4 뒤 단독 (같은 작업 트리에서 다른 implementer 가 돌지 않는다). R14~R24 의 폭별 증거, R29, R31.
    - 담당 파일: `docs/features/ui-redesign/audit/report.json`, `docs/features/ui-redesign/audit/*.png`. 앱 파일·스크립트는 이 단계 소유가 아니다.
    - 할 일:
      - 위 '실행 환경' 대로 G4 커밋을 프로덕션 빌드해 포트 3101 로 띄운다. `--self-test` 종료 0 을 먼저 확인한다.
      - `cd frontend && CHROME_PATH=… node scripts/ui-audit.mjs --base http://localhost:3101 --commit "$(git rev-parse HEAD)"` (기본 `--out`, `--screenshots key`).
      - 실패를 나눈다: (i) 앱 결함 — 요소 경로로 파일을 찾아 '변경 파일' 2차의 담당 단계(20~26)를 적고 멈춘다(task `blocked`, 실패 목록과 담당 단계 표). 메인 세션이 그 단계의 implementer(task 파일 `Agent:`)에 SendMessage 로 고치게 하고, 고친 단계는 자기 단계 끝 기준을 다시 통과한다. 수정은 그 단계 task 파일에 기록한다. 같은 파일을 두 단계가 고치지 않는다. (ii) 판정 오탐 — 19 의 implementer 가 19 의 연장으로 `ui-audit.mjs` 를 고친다 (19 task 파일에 기록). 기준값 상수를 바꾸려면 멈추고 보고한다 (spec 값). 고친 뒤 `--self-test` 를 다시 통과시키고, 검출 로직이 바뀌었으면 19 의 기준선 실행을 다시 해 F1~F4 가 여전히 잡히는지 확인한다.
      - 모두 통과할 때까지 다시 빌드·측정한다. 마지막 실행 결과를 남긴다: `report.json`, PNG 24장. 새 이름 규칙에 없는 이전 PNG 는 지운다 (1차 8장은 같은 이름이라 덮어쓴다).
      - 마지막에 `make check` 를 한 번 돌리고 출력 전체를 task 에 붙인 뒤 `git status` 로 루트 `config.json`·`sources.json` 변경을 되돌린다. backend `test_anti_gemini_isolation_*` 2개 외 실패가 있으면 보고한다.
    - 끝 기준: `report.json` 의 모든 조합 `pass: true`, 조합마다 `checks` 에 그 상태에 해당하는 14.8 검사 이름이 있음, `environment.devIndicator: false`, `environment.commit` 이 측정한 커밋, `ls docs/features/ui-redesign/audit/*.png | wc -l` 이 24, `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공. Chrome·backend·데이터가 없으면 `blocked` (verify 에서 미검증, 통과로 보고하지 않는다 — 우려 13).
    - 후속 (3차 보정, 2026-11-06): 1회차(HEAD `41f6b4c`, 실패 10)의 `clip` 8건은 21 후속(`d55c715`), `placeholder` 2건은 29 가 고친다. G7 뒤 메인 세션이 이 단계 implementer(`aa16eed435b46be0f`)에 SendMessage 로 재측정을 시킨다. 할 일과 추가 육안 확인은 '3차 보정' 의 '27 A 재측정'. 끝 기준은 위 그대로다.

**관문 G5** (27 done 뒤, 메인 세션): G4 와 같은 검사 + 27 의 끝 기준 재확인. 커밋 (측정 결과와 27 중 고친 앱·스크립트 파일).

28. **[main 세션] 통합·상세 문서 반영** — G5 뒤. 메인 세션이 쓴다 (문서는 역할 게이트 대상이 아니다). spec 14.10 과 '변경 파일' 2차의 문서 목록 그대로.
    - `docs/design-system.md`: 5.1 `ChipGroup` 행(스크롤 줄 규칙, 스크롤 버튼, `bleed`)과 새 `ScrollRow` 행, `Toast` 행(`placement`, 영역 고르기), `Tabs` 행(`aria-controls` 규칙), 4.x 줄바꿈 기본값(`keep-all`), 5.2 `useScrollOverflow`·`lib/feed-insights.ts`, 6.1 스택 순서(같은 렌더 허용, `order`)와 '부모가 열린 뒤 사용자 동작으로 연다' 제약 삭제, 7.1 Escape 표(Ask AI 질문 입력 예외, 우려 15), 9 검사 방법(14.8 검사 표, `--self-test`, 프로덕션 실행, 측정 훅 속성 표), 10.2 '부모·자식 대화상자' 행 삭제.
    - `docs/ui-spec.md`: 피드 툴바 폭별 배치(14.2 표), 카드 틀(14.4), 요약 바, 챗 열 맞춤·사이드바 머리 영역, 알림 위치.
    - `docs/functional-spec/01-news-feed.md`: NEWS-02~06(툴바·자리표시), NEWS-08(카드 틀·시사점 반복 규칙·인기 점수), NEWS-14·18(요약 바), 예외·엣지와 알려진 위험의 깜빡임·통계 실패 항목 삭제.
    - `docs/functional-spec/02-ai-chat.md`: CHAT-07(`aria-controls`), CHAT-17(칩 짧은 라벨), 경고 알림 위치, 예외·엣지 정리.
    - `docs/functional-spec/04-briefing-and-sharing.md`: BRF-06 진입점의 `aria-controls` 조건.
    - `docs/functional-spec/05-sources-and-research.md`: SRC-04 카테고리 선택지 라벨, `새 피드 직접 등록` 의 `aria-controls` 조건.
    - `docs/functional-spec/07-ui-common.md`: UI-02(수집 상태 복원, `already_running`), UI-08(스택 순서, Ask AI Escape 예외), UI-13(Ask AI 복사 실패), UI-14(`aria-controls` 규칙), 알려진 위험 1·2·3 삭제.
    - `docs/known-issues.md`: 'UI·접근성' 의 8행(기록 버튼 `aria-controls`, 챗 경고 토스트 위치, 챗 기사 칩 원값, 요약 바 깜빡임, 부모·자식 대화상자 순서, Ask AI 입력 중 Escape, 수집 중 이탈 후 복귀, Ask AI 복사 실패 알림)을 지운다. 'UI·접근성' 에 새 행: 포커스 시트 카테고리 라벨(`하네스·평가` 등)이 다른 화면과 다름 (우려 18, `FocusBottomSheet.tsx:29-35`). '데이터·동작 오류' 에 새 행: LLM 평가가 시사점을 주지 않으면 backend 가 카테고리별 고정 문장을 저장해 카드·상세·챗 출처에 같은 문장이 반복됨 (우려 11, `backend/app/services/llm_processor.py:84-89,703-709`, 카드는 R18 로 완화).
    - `docs/test-cases.md`: 2차 새 테스트 파일 5개와 기존 파일에 더한 테스트, 바뀐 6줄, 파일·테스트 수.
    - `docs/test-strategy.md`: 테스트 수, ui-audit 검사 종류(14.8)·`--self-test`·프로덕션 빌드 실행·`make check` 밖 수동 검사라는 점.
    - `docs/tech-spec.md`: '변경 이력' 에 `| 2026-11-xx | ui-redesign (2차) | 변경 이력만 (화면·부품 규칙은 design-system.md) |` 같은 한 줄. 다른 절은 바꾸지 않는다 (spec 14.0).
    - 각 문서 `Updated:` 갱신. 위 목록 밖 문서(`product.md`, `functional-spec/README.md`, `api.md`, `data-model.md`, `operations.md`)를 고쳐야 한다고 판단되면 고치기 전에 plan 을 고쳐 재승인받는다.
    - 끝 기준: spec 14.10 의 문서별 항목과 위 목록을 하나씩 대조해 빠진 것이 없다. `grep -n "aria-controls=\"chat-history-sidebar\"\|Ask AI 입력 중 Escape\|Ask AI 답변 복사가 실패해도" docs/known-issues.md` 출력 없음.
    - 후속 (3차 보정, 2026-11-06): 3차 보정의 화면·부품 변경도 함께 반영한다. 문서별 항목은 '변경 파일' 3차의 문서 목록. 끝 기준에 `grep -n "ESC로 닫기" docs/functional-spec/07-ui-common.md` 출력 없음을 더한다.

#### 2차 의존 관계 요약
```
18 ─┬─ 19 (A) ─┐
    ├─ 20 (B) ─┤
    ├─ 21 (C) ─┼─ G3 ─┬─ 23 (E) ─┐
    └─ 22 (D) ─┘      ├─ 24 (F) ─┤
                      ├─ 25 (G) ─┼─ G4 ─ 27 (A) ─ G5 ─ 28 (main)
                      └─ 26 (H) ─┘
```
- 병렬 묶음: 웨이브 4 = {19, 20, 21, 22} (implementer A~D 동시), 웨이브 5 = {23, 24, 25, 26} (implementer E~H 동시). 27·28 은 단독.
- 2차 단계끼리 같은 파일을 고치지 않는다 ('변경 파일' 2차의 괄호 번호가 파일마다 하나). 27 에서 생기는 수정은 그 파일의 소유 단계가 이어서 한다.
- 웨이브 5 가 웨이브 4 에 기대는 곳: 23 → 20(`ChipGroup bleed`, `ScrollRow`, `iconClassName`)·21(`useToast`)·22(`CATEGORY_LABELS`, `findRepeatedInsights`, `preferSummary`), 24 → 20(`ScrollRow`)·21(`ToastRegion placement`)·22(`categoryShortLabel`), 25 → 20(스크롤 줄)·21(`TabPanel`, 스택), 26 → 22(`CATEGORY_LABELS`).

### 3차 보정 (29단계, 20·21·22·23 후속, 27 재측정)
27 1회차 측정(HEAD `41f6b4c`)과 스크린샷 확인(`tasks/ui-redesign/27-prod-audit.md` '앱 결함 표'·'눈으로 본 것')에서 남은 것을 고친다. 연동 설정 `웹훅 (Slack/Discord)` 탭 `clip` 8건은 이미 21 후속(`d55c715`)으로 고쳤고 27 재측정으로 확인한다.

| # | 결함 | 근거 | 요구사항 | 담당 |
|---|---|---|---|---|
| 1 | 커맨드 팔레트 자리표시 `명령어 검색 또는 바로가기... (ESC로 닫기)` 가 360 에서 입력보다 김 | 27 1회차 `placeholder` 실패 `feed-{light,dark}-360x780-command-palette`, textWidth 269.8 > available 260 (`CommandPalette.tsx:227`) | R16 | 29 I |
| 2 | 소스 & 리서처 360 `정기 스케줄` 값이 `매일 03:00, 15:0…` 로 잘려 정보가 사라짐 | 27 '눈으로 본 것' (말줄임이라 `clip` 은 통과). `DeepResearcherTab.tsx:34-41` 의 `Metric` 값 상자가 `truncate`, 값 `:138-140` | R16 (말줄임은 허용이지만 값이 사라지므로 줄바꿈) | 29 I |
| 3 | 레이더 `카테고리 분포` 라벨이 영문 (`Harness & Benchmark` 등) | 27 '눈으로 본 것'. 레이더 응답 이름은 backend `trend_service.py:10-25` 의 영문 4개, `TrendRadarPanel.tsx:74-76` 이 원값을 그림 | R19 | 22 D (라벨) → 23 E (사용) |
| 4 | 768 미만 스크롤 줄 넘침 표시가 피드 소스 줄에만 있음. 칩 경계가 줄 끝에 걸리는 폭에서는 다음 칩이 흐림 안에 몇 px 만 남아 넘침이 안 보인다 (390 소스 줄: 줄 끝 254px, 다음 칩 249px 시작) | 27 '눈으로 본 것', spec 14.3 '다음 칩이 일부 잘려 보여 더 있다는 것을 알린다'. 23 후속 2(`a00fee4`)가 `FeedToolbar` 소스 줄에만 따로 넣음 | R15 | 20 B (공통) → 21 C (`Tabs` 정리)·23 E (개별 표시 삭제) |

#### 3차 공통 규칙
- 2차 공통 규칙(실패 테스트 먼저, 경로 지정 실패 테스트 커밋, 측정 훅 계약, 병렬 단계 끝 검사)을 그대로 따른다. 실패 테스트 커밋 메시지: 29 는 `test(ui-redesign): 29 실패 테스트 — <요지>`, 후속은 `test(ui-redesign): NN 후속 (3차) 실패 테스트 — <요지>`.
- 리팩터 성격이라 고치기 전에도 통과하는 테스트(아래 '실패 예상 아님')는 task 파일에 그렇게 적고 실패 확인 없이 쓴다. 이 테스트도 구현과 따로 먼저 커밋하지 않아도 된다.
- 후속은 그 단계의 기존 task 파일(`tasks/ui-redesign/20-scroll-row.md` 등)에 '후속 (3차)' 절로 기록한다. 메인 세션이 task 파일 `Agent:` 의 ID 로 SendMessage 를 보내 이어서 시킨다 (20 B `a49602194c070f0b6`, 21 C `a3e35e97a3d352473`, 22 D `a1a17ea9b97a86155`, 23 E `a2cd41bc978ebd13f`, 27 A `aa16eed435b46be0f`). 29 는 새 implementer 이고 새 task 파일 `tasks/ui-redesign/29-clip-360.md` 를 만든다.
- 바꿀 수 있는 기존 테스트 블록은 '증명' 3차 표의 하나(`FeedToolbar.test.tsx` 의 23 후속 2 블록)뿐이다. 그 밖의 기존 테스트 파일은 새 `it`/`describe` 와 import 이름 추가만.

#### 순서
```
20 B 후속 ─┐
22 D 후속 ─┼─ G6 ─┬─ 21 C 후속 ─┐
29 I ──────┘      └─ 23 E 후속 ─┴─ G7 ─ 27 A 재측정 ─ G5 ─ 28 main (후속 포함)
```
- 웨이브 7a = {20 후속, 22 후속, 29} (implementer B·D·I 동시). 파일이 겹치지 않는다.
- 웨이브 7b = {21 후속, 23 후속} (implementer C·E 동시). 21 후속은 20 후속의 `selectedSelector` 에, 23 후속은 20 후속의 넘침 표시와 22 후속의 `radarCategoryLabel` 에 기댄다. 그래서 7a 뒤다.
- 7a 와 7b 사이에는 피드 소스 줄에 표시가 둘(`FeedToolbar` 자체 표시 + `ScrollRow` 표시) 생길 수 있다. 릴리스가 아니므로 받아들이고 G7 에서 하나로 확인한다.
- **관문 G6** (7a done 뒤, 메인 세션): `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공, 20 후속·22 후속·29 의 실패 테스트 커밋이 구현보다 먼저 있음. 웨이브 커밋.
- **관문 G7** (7b done 뒤, 메인 세션): G6 과 같은 검사 + 23 후속의 실패 테스트 커밋이 구현보다 먼저 있음, G4 의 `git diff --name-only 1ec8a9b -- backend frontend/src/types …` 0줄 검사, '증명' 3차의 정적 확인. 웨이브 커밋. 그 뒤 27 을 이어서 시킨다.

29. **[implementer I] 360 잘림 정리: 커맨드 팔레트·딥 리서처** — G5 전, 웨이브 7a (20 후속·22 후속과 병렬). R16. 결함 1·2.
    - 담당 파일: `components/CommandPalette.tsx`, `components/sources/DeepResearcherTab.tsx`, 테스트 `tests/CommandPalette.test.tsx`(추가만), 새 `tests/modals/DeepResearcherTab.test.tsx`.
    - 할 일:
      - `CommandPalette.tsx:227`: `placeholder` 를 `명령어 검색 또는 바로가기` 로 (Escape 안내는 `닫기` 버튼과 Escape 동작이 대신한다). `aria-label="명령어 검색"`, `role="combobox"`, 입력 글자 크기 `text-base md:text-sm`(16px 확대 방지)는 그대로. 기존 테스트의 `getByPlaceholderText(/명령어 검색/i)`(`CommandPalette.test.tsx:38,61,71,80`)가 계속 찾는다.
      - `DeepResearcherTab.tsx` `Metric`(`:34-41`): 값 상자 `mt-1 truncate text-sm font-semibold text-fg` 에서 `truncate` 를 지우고 `break-words` 로 줄을 바꾼다 (본문 기본 `word-break: keep-all` 이라 어절 단위로 `매일 03:00,` / `15:00 UTC` 처럼 나뉜다). 네 지표 모두 같은 규칙. 지표 문구·값·`suppressHydrationWarning`·그리드(`grid-cols-2 md:grid-cols-4`)는 그대로. 같은 줄 카드 높이는 그리드 기본 `stretch` 로 맞는다.
    - 먼저 실패하는 테스트:
      - `CommandPalette.test.tsx` 추가: `getByRole('combobox', { name: '명령어 검색' })` 의 `placeholder` 속성이 정확히 `명령어 검색 또는 바로가기` 이고 `ESC` 를 포함하지 않는다. 예상 실패: `명령어 검색 또는 바로가기... (ESC로 닫기)`.
      - 새 `DeepResearcherTab.test.tsx`: `<DeepResearcherTab researchStatus={null} auditLogs={[]} loading={false} onRefresh={noop} showToast={noop} />` 를 렌더하고 `매일 03:00, 15:00 UTC` 를 담은 값 상자(지표 라벨 `정기 스케줄` 의 다음 형제)에 `truncate`·`whitespace-nowrap`·`text-ellipsis` 가 없고 `break-words` 가 있다. 네 지표(`자동 채택된 소스`, `자동 채택 기준`, `최근 리서치 일시`, `정기 스케줄`)의 값 상자 모두 같은 단언. 예상 실패: 값 상자에 `truncate`.
      - 배치 증거 인용 (jsdom 으로 폭을 잴 수 없다): task 파일에 27 1회차 `placeholder` 실패 2건(상태 이름, textWidth 269.8, available 260)과 '눈으로 본 것' 의 딥 리서처 행을 인용한다. 고친 뒤 확인은 27 재측정.
    - 끝 기준: `pnpm exec vitest run src/tests/CommandPalette.test.tsx src/tests/modals/DeepResearcherTab.test.tsx src/tests/modals/SourcesModal.test.tsx src/tests/Header.test.tsx src/tests/HotkeyGating.test.tsx` 통과, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.

**20 B 후속 (3차)** — 웨이브 7a. 결함 4 의 공통 부분. R15. 파일: `components/ui/ScrollRow.tsx`, `tests/ui/ChipGroup.test.tsx`(추가만, import 에 `ScrollRow` 추가).
- 할 일:
  - **768 미만 넘침 표시**: `ScrollRow` 가 `!showButtons`(기존 `useMediaQuery('(min-width: 768px)')` 가 false)이고 `overflow` 가 `end` 또는 `both` 일 때 스크롤 줄 **뒤 형제**로 장식 표시를 그린다: `<span aria-hidden="true" data-overflow-hint="" className="flex shrink-0 items-center text-fg-subtle [&>svg]:size-4"><ChevronRight /></span>` (클래스는 같은 뜻이면 바꿔도 된다). 바깥 감싸개 안, 스크롤 줄(`role="group"`/`role="tablist"`) 밖이라 `within(group).getAllByRole('button')` 개수가 그대로이고, 칩을 덮지 않는다 (`occluded`). 포커스·클릭·접근 이름 없음. JS 로 판정하므로 서버 렌더와 첫 그림에는 없다 (스크롤 버튼과 같다). `start`·`none` 과 768 이상에서는 그리지 않는다 (768 이상은 스크롤 버튼이 대신한다).
  - **`bleed === true` 인 줄** (피드 `카테고리`, Ask AI `빠른 질문`): 표시가 보일 때만 줄의 오른쪽 bleed 자리를 표시가 쓴다 — 줄은 왼쪽만 늘이고(`'start'` 와 같은 `max-md:-ml-4 max-md:pl-4 max-md:scroll-pl-4`), 표시는 오른쪽 페이지 여백 16px 안으로 들어가(예: 표시에 `max-md:-mr-4`) 줄 + 표시가 화면 오른쪽 끝까지 닿는다. 표시를 줄 위에 겹쳐 그리지 않는다. 표시가 없을 때는 지금 클래스(`max-md:-mx-4 max-md:px-4 max-md:scroll-px-4`) 그대로다 (`ChipGroup.test.tsx:277-288` 단언 불변). 넘침이 있을 때만 줄이 좁아지므로 넘침 판정이 오가지 않는다. Tailwind 가 찾도록 클래스는 문자열 그대로 쓴다. `bleed="start"` 와 `false` 는 오른쪽을 바꾸지 않는다.
  - **선택 항목 선택자**: 새 선택 prop `selectedSelector?: string` (기본 `'[aria-pressed="true"]'`). 처음 그릴 때와 선택 자식이 바뀔 때 보이게 하는 effect(`ScrollRow.tsx:90-97`)가 이 선택자로 자식을 찾는다. 기본값이라 기존 소비자(`ChipGroup`, 챗 맥락 줄, 급상승, 빠른 질문)는 그대로다. JSDoc 과 파일 머리 주석을 갱신한다.
  - `Chip.tsx`(`ChipGroup`)는 `ScrollRow` 를 그대로 쓰므로 바꾸지 않는다. 바꿀 일이 생기면 2차 목록의 20 소유 범위 안에서 고친다.
- 먼저 실패하는 테스트 (`ChipGroup.test.tsx` 추가, 기존 `mockMatchMedia`·`layout`·`MockResizeObserver` 도우미 사용):
  - (a) `mockMatchMedia(360)`, 넘침 + `scrollLeft` 0(`end`) → `[data-overflow-hint]` 가 1개, `aria-hidden="true"`, `role="group"` 밖이고 그룹과 같은 바깥 감싸개 안에서 그룹 뒤. 같은 조건 `both` 에서도 있음. 예상 실패: 표시 없음.
  - (b) `bleed` + `mockMatchMedia(360)` + `end` → 그룹에 `max-md:-ml-4` 가 있고 `max-md:-mr-4`·`max-md:-mx-4` 가 없음, 표시가 있음. 예상 실패: 표시 없음, 그룹이 `max-md:-mx-4`.
  - (c) `<ScrollRow label="탭" selectedSelector='[aria-selected="true"]'>` 안에 `aria-selected` 버튼들, 247행 테스트와 같은 `getBoundingClientRect` 목(선택 항목이 줄 오른쪽 밖) → 처음 그린 뒤 줄 `scrollLeft` > 0. 예상 실패: prop 을 받기만 하는 빈 구현이 `aria-pressed` 만 찾아 0.
  - (d) 회귀 방지 (실패 예상 아님): `start`·`none`·`mockMatchMedia(1280)` + `end` 에서는 표시 없음, 1280 + `end` 에서는 `카테고리 다음 항목 보기` 버튼 있음.
- 끝 기준: `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx src/tests/ui/Tabs.test.tsx src/tests/feed src/tests/chat src/tests/AskAiPanel.test.tsx src/tests/modals` 통과 (`FeedToolbar.test.tsx` 의 기존 23 후속 2 블록은 1280 기본 목이라 영향 없음. 실패가 나면 task 에 적고 메인 세션에 알린다), 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.

**22 D 후속 (3차)** — 웨이브 7a. 결함 3 의 라벨 부분. R19. 파일: `lib/labels.ts`, `tests/ui/FormControls.test.tsx`(`labels` 블록에 추가만).
- 할 일: `RADAR_CATEGORY_LABELS: Readonly<Record<string, string>>` = `{ 'Harness & Benchmark': '하네스 & 벤치마크', 'Protocols & Tooling': '프로토콜 & 도구', 'Models & Reasoning': '모델 & 추론', 'Infra & Runtime': '인프라 & 런타임' }` 와 `radarCategoryLabel(name: string): string` (기존 `lookup` 사용, 모르는 값·프로토타입 키는 그대로). 키는 backend `trend_service.py:10-25` 의 이름 그대로다 (backend·`types/trends.ts` 불변). 파일 머리 주석에 '레이더 카테고리 라벨: 트렌드 레이더 분포' 를 더한다. 기존 표·함수는 그대로.
- 먼저 실패하는 테스트: `describe('labels')` 에 `radarCategoryLabel` 4개 이름 → 위 한국어, `'Unknown Cat'` → 그대로, `'constructor'` → 그대로. 예상 실패: 시그니처만 있는 빈 구현이 원값을 돌려준다.
- 끝 기준: `pnpm exec vitest run src/tests/ui/FormControls.test.tsx src/tests/NewsCard.test.tsx src/tests/chat/ActiveSourceChip.test.tsx` 통과, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.

**21 C 후속 (3차)** — 웨이브 7b (G6 뒤, 23 후속과 병렬). 결함 4 의 정리. R15. 파일: `components/ui/Tabs.tsx`, `tests/ui/Tabs.test.tsx`(추가만).
- 할 일: `Tabs.tsx` 의 선택 탭 보이기 `useEffect`(`:74-79`), `revealTabInRow`(`:27-36`), `REVEAL_PADDING_PX`(`:25`), 쓰임이 없어지면 `rowRef` 와 `ScrollRow` 의 `ref` 전달, 안 쓰는 `useEffect` import 를 지운다. `ScrollRow` 에 `selectedSelector='[role="tab"][aria-selected="true"]'` 를 넘긴다. 키보드 이동의 포커스용 `tabRefs`, `aria-controls` 규칙, 로빙 `tabIndex` 는 그대로. 파일 머리 JSDoc(`:59-60`)의 '선택된 탭이 보이게 줄을 민다' 를 `ScrollRow` 가 한다고 고친다. 768 미만 넘침 표시는 `ScrollRow` 에서 그대로 받는다 (대화상자 안 탭 줄).
- 테스트 (리팩터라 모두 실패 예상 아님, 회귀 방지):
  - 기존 `Tabs.test.tsx:262-290`(키보드로 옮긴 탭 보이기, 처음 그릴 때 선택 탭까지 밀기)이 단언 변경 없이 통과.
  - 추가: 선택을 줄 밖 탭으로 바꾸면(`rerender` 또는 클릭) 줄 `scrollLeft` 가 그 탭 쪽으로 바뀐다.
  - 추가: 768 미만 목 + 탭 줄 넘침(`end`)에서 `[data-overflow-hint]` 가 `role="tablist"` 밖에 있다.
  - 정적: `grep -nE "useEffect|revealTabInRow" frontend/src/components/ui/Tabs.tsx` 출력 없음.
- 끝 기준: `pnpm exec vitest run src/tests/ui/Tabs.test.tsx src/tests/ui/ChipGroup.test.tsx src/tests/modals src/tests/AskAiPanel.test.tsx` 통과, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.

**23 E 후속 (3차)** — 웨이브 7b (G6 뒤, 21 후속과 병렬). 결함 3 의 사용 부분, 결함 4 의 개별 표시 삭제. R15·R19. 파일: `components/feed/FeedToolbar.tsx`, `components/feed/TrendRadarPanel.tsx`, `tests/feed/FeedToolbar.test.tsx`('증명' 3차 표의 블록 교체), 새 `tests/feed/TrendRadarPanel.test.tsx`.
- 할 일:
  - `FeedToolbar.tsx` `sourceGroup`(`:180-224`): `group/source` 감싸개 `div` 와 `data-overflow-hint` `span` 을 지우고 `<ChipGroup label="소스" scrollable bleed="start" className="min-w-0 flex-1">` 를 바로 둔다. 주석은 '넘침 표시는 `ScrollRow` 공통' 으로 고친다. 쓰지 않게 된 `ChevronRight` import 를 지운다. 칩·순서·이름·정렬 위치·`bleed="start"` 는 그대로 (`FeedToolbar.test.tsx:140-151` 단언 불변).
  - `TrendRadarPanel.tsx` 카테고리 분포(`:62-82`): 보이는 글자와 `title` 을 `radarCategoryLabel(cat.name)` 로. `key` 와 `CategoryIcon name` 은 원값 그대로 (데이터 키). 한 열 배치(`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)·말줄임은 그대로.
- 먼저 실패하는 테스트:
  - `FeedToolbar.test.tsx` 의 `describe('FeedToolbar — 768 미만 소스 줄 넘침 표시 (spec 14.3, 후속 2)')`(`:154-175`)를 교체 ('증명' 3차 표): 768 미만 `matchMedia` 목과 소스 줄 넘침(`end`) 목에서, 소스 줄이 있는 `[data-toolbar-row]` 안 `[data-overflow-hint]` 가 정확히 1개, `aria-hidden="true"`, `소스` 그룹 밖이며 정렬 선택창보다 앞, 문서에 `.group\/source` 요소가 없음. 목은 `ChipGroup.test.tsx` 의 방식(`matchMedia` 교체, `scrollWidth`·`clientWidth` `defineProperty`, `afterEach` 복원)을 이 파일 안에 둔다. 예상 실패: `FeedToolbar` 자체 표시와 `ScrollRow` 표시로 2개, `.group/source` 있음.
  - 새 `TrendRadarPanel.test.tsx`: 카테고리 4개(영문 이름)와 모르는 이름 `Other Stuff` 를 가진 `TechRadarData` 로 렌더 → `하네스 & 벤치마크`·`프로토콜 & 도구`·`모델 & 추론`·`인프라 & 런타임` 이 보이고, `queryByText('Harness & Benchmark')` 등 영문 4개가 없고, `title` 이 영문인 요소가 없고, `Other Stuff` 는 그대로 보인다. 예상 실패: 영문 원값을 그린다.
  - 배치 증거 인용: 27 '눈으로 본 것' 의 390 소스 줄 행과 레이더 360 행.
- 끝 기준: `pnpm exec vitest run src/tests/feed src/tests/ui/ChipGroup.test.tsx src/tests/hooks/useNewsFeed.test.tsx src/tests/HotkeyGating.test.tsx` 통과, `grep -nE "data-overflow-hint|group/source" frontend/src/components/feed/FeedToolbar.tsx` 출력 없음, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.

**27 A 재측정** — G7 뒤 단독. 27 의 할 일·끝 기준 그대로 (프로덕션 빌드 3101, `--self-test` 먼저, 전체 측정, 모두 통과한 마지막 결과의 `report.json`·PNG 24장, `make check` 한 번 뒤 `config.json`·`sources.json`·`backend/app/config/sources.json` 되돌림). 더해서:
- 1회차 실패 10건(`clip` 8, `placeholder` 2)이 0 인지 task 에 적는다.
- 육안 확인 (scratchpad `--screenshots all` 또는 360 스크린샷): 360 소스 & 리서처 `정기 스케줄` 값 전체(`매일 03:00, 15:00 UTC`)가 보임, 360 레이더 펼침의 분포 라벨이 한국어, 390 피드 소스 줄과 360·390 피드 카테고리 줄이 넘칠 때 `›` 표시, 360 연동 설정 탭 줄 표시, Ask AI `빠른 질문` 줄 표시가 칩을 덮지 않음. 본 것과 스크린샷 경로를 task 에 적는다.
- 새 앱 결함이 나오면 27 의 '실패를 나눈다' 규칙대로 소유 단계(3차 소유 포함: 팔레트·딥 리서처는 29 I)에 돌린다.

### 리뷰 후속 (30~37단계, spec 14.12)
reviewer 2·3차 리뷰의 8건(Important 3·Nit 5)을 고친다. spec 14.12 의 제안 단계(30 ui-audit, 31 공통 부품, 32 피드·수집, 33 측정·문서)를 파일 소유가 겹치지 않게 기존 소유 implementer 별로 다시 나눴다. 제안과 다른 점: ① 공통 부품(제안 31)을 `ScrollRow`·`ChipGroup`(31 B), `Toast`(32 C), `Badge`·`NewsCard`(33 D)로 나눴다. `Badge shrink` 를 쓰는 곳이 `NewsCard` 하나라 두 파일을 한 단계에 묶어, 부품만 바뀌고 카드는 그대로인 중간 상태를 없앴다. ② 피드·수집(제안 32)을 `FeedToolbar`(34 E)와 `useCollector`(35 H)로 나눴다. `useCollector` 는 부품에 기대지 않아 첫 웨이브로 당겼다. ③ 측정(36 A)과 문서(37 main)를 나눴다 (1·2차와 같다). ④ 30 은 수정 전 HEAD 를 `git worktree` 로 따로 띄워 재므로 31~35 와 병렬이다.

| 리뷰 항목 | 요구 | 단계 (담당) |
|---|---|---|
| Important 1 스크롤 버튼이 포커스를 가진 채 사라짐 | R15 | 31 B |
| Important 2 `clip` 이 스크롤 영역 바깥의 같은 축 잘림을 보지 않음 | R29·R30 | 30 A (판정·fixture) → 36 A (측정) |
| Important 3 배지 줄이 글자 중간에서 잘림 | R17·R30 | 33 D (앱), 30 A (fixture) → 36 A (측정) |
| Nit 1 툴바가 폭마다 다른 트리를 다시 마운트 | R33 | 34 E |
| Nit 2 늦은 30초 상태 응답이 폴링을 되살림 | R27 | 35 H |
| Nit 3 영역이 바뀌면 남은 알림을 다시 읽음 | R23 | 32 C |
| Nit 4 소스 줄이 Must-Read 를 선택 칩으로 봄 | R15 | 31 B (`ChipGroup selectedSelector`) → 34 E (`data-source-chip`) |
| Nit 5 `chatAlign` 투명 판정이 `rgba(…, 0)` 만 | R29·R30 | 30 A |

#### 리뷰 후속 공통 규칙
- 2차 공통 규칙(실패 테스트 먼저, 경로 지정 실패 테스트 커밋, 측정 훅 계약, 병렬 단계 끝 검사, ui-audit 실행 환경)과 3차 공통 규칙(실패 예상 아님 표기)을 그대로 따른다. 실패 테스트 커밋 메시지는 `test(ui-redesign): NN 실패 테스트 — <요지>` 다 (30 은 `test(ui-redesign): 30 실패 fixture — <요지>`).
- **기존 테스트 단언은 바꾸지 않는다** (spec 14.9, 우려 20). 기존 테스트 파일에는 새 `it`/`describe` 블록, 새 도우미 함수, import 이름 추가만 한다. 기존 도우미(`ChipGroup.test.tsx` 의 `mockMatchMedia`, `FeedToolbar.test.tsx` 의 360 블록 목 등)가 모자라면 고치지 않고 새 도우미를 더한다. 기존 단언이 깨지면 코드를 고친다. 단언을 바꾸지 않고는 풀 수 없으면 멈추고 task 를 `blocked` 로 둔다 — '증명' 의 '리뷰 후속에서 바꾸는 기존 단언' 표에 행을 더해 재승인받아야 한다 (지금 그 표는 비어 있다).
- **담당은 기존 implementer 를 이어 쓴다.** 메인 세션은 새로 띄우지 않고 기존 task 파일 `Agent:` 의 ID 로 SendMessage 를 보낸다: A `aa16eed435b46be0f`(30·36), B `a49602194c070f0b6`(31), C `a3e35e97a3d352473`(32), D `a1a17ea9b97a86155`(33), E `a2cd41bc978ebd13f`(34), H `a3946f65cec43927e`(35). 그 ID 로 이어갈 수 없으면(세션이 없어짐) 새 implementer 를 띄우고 새 task 파일 `Agent:` 에 새 ID 와 이유를 적는다.
- **task 파일**: 단계마다 새 파일을 만든다 — `tasks/ui-redesign/30-audit-clip-scroll.md`, `31-scroll-focus.md`, `32-toast-announce-once.md`, `33-badge-row.md`, `34-toolbar-single-tree.md`, `35-collector-stale-status.md`, `36-prod-audit-3.md`, `37-docs-3.md`. 이전 task 파일(19~29)은 고치지 않는다 (30·36 의 기록은 각자 새 파일에, 이전 단계와의 관계는 '결정' 에 적는다).
- **측정에서 새 실패 (우려 22)**: 30 의 사전 측정이나 36 의 측정이 앱 결함을 찾으면 요소 경로로 파일을 찾아 '변경 파일' 리뷰 후속 목록의 담당 단계를 적는다. ① 목록 안 파일이면 메인 세션이 그 단계 implementer 에 SendMessage 로 고치게 하고, 고친 단계는 자기 끝 기준을 다시 통과하며 그 task 파일에 기록한다. ② 목록 밖 파일이면 고치지 않는다. 측정 단계 task 를 `blocked` 로 두고 '실패 목록' 표(검사·상태·폭·테마·요소 경로·파일·제안 담당)를 남긴다. 메인 세션이 planner 에 plan '변경 파일'·작업 순서를 고치게 해 재승인받은 뒤 잇는다. 제안 담당은 그 파일의 2·3차 소유 implementer 다 (예: 챗 화면 파일은 24 F, 기사 상세 Ask AI 는 25 G, 팔레트·딥 리서처는 29 I, 수집 표시 화면은 26 H).
- 같은 파일을 두 단계가 고치지 않는다. 단계 사이 의존: 34 는 31 의 `ChipGroup selectedSelector` 를 쓴다 (31 → G8 → 34). 33 의 배지 줄 결함은 30 의 `defects.html` 배지 줄 fixture 가 재현하고, 프로덕션 확인은 36 이다. 30 의 판정 ④ 가 잡는 새 실패는 31~35 의 결과와 함께 36 이 다시 본다.

#### 순서
```
30 A ─┐
31 B ─┤
32 C ─┼─ G8 ─ 34 E ─ G9 ─ 36 A ─ G10 ─ 37 main
33 D ─┤
35 H ─┘
```
- 웨이브 8a = {30, 31, 32, 33, 35} (implementer A·B·C·D·H 동시). 파일이 겹치지 않는다. 30 은 `frontend/scripts/**` 만, 31~35 는 `frontend/src/**` 의 서로 다른 파일만 고친다.
- 웨이브 8b = {34} (implementer E 단독). 31 의 `ChipGroup selectedSelector` 가 들어간 G8 커밋 뒤에 시작한다.
- 36 은 G9 뒤 단독이다 (같은 작업 트리에서 다른 implementer 가 돌지 않는다). 37 은 G10 뒤 메인 세션.
- **관문 G8** (8a done 뒤, 메인 세션): `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공, `cd frontend && CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0, `git log --oneline` 에서 30(fixture)·31·32·33·35 의 실패 테스트 커밋이 구현보다 먼저 있음, 2차 G4 의 `git diff --name-only 1ec8a9b -- backend frontend/src/types …` 0줄, 30 task 의 사전 측정 표에 목록 밖 파일 결함(분류 iii)이 없음. 웨이브 커밋.
- **관문 G9** (34 done 뒤, 메인 세션): G8 의 frontend 세 명령·`make build`, 34 의 실패 테스트 커밋이 구현보다 먼저 있음, `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx` 출력 없음. 커밋.
- **관문 G10** (36 done 뒤, 메인 세션): G9 와 같은 검사 + 36 의 끝 기준 재확인. 커밋 (측정 결과, 36 중 고친 앱·스크립트 파일). 그 뒤 37.

30. **[implementer A] ui-audit 판정 보강: `clip` ④·`chatAlign` 알파 판정·fixture, 사전 측정** — 웨이브 8a (31·32·33·35 와 병렬. `frontend/scripts/**` 만 고치고 `frontend/src` 를 건드리지 않는다). spec 14.8 `clip` ④·`chatAlign`·'(리뷰 후속, R30 ①) fixture 추가' 표, 우려 22. R29·R30 ①. 리뷰 Important 2·Nit 5, Important 3 의 fixture.
    - 담당 파일: `frontend/scripts/ui-audit.mjs`, `frontend/scripts/ui-audit-fixtures/defects.html`, `frontend/scripts/ui-audit-fixtures/clean.html`. task `tasks/ui-redesign/30-audit-clip-scroll.md`.
    - 할 일:
      - fixture (spec 14.8 fixture 표 그대로): `defects.html` 에 ① 세로로 잘린 스크롤 영역(바깥 `display:flex; flex-direction:column; height:200px; overflow:hidden` > 머리 40px + 중간 감싸개 `flex:1; display:flex; flex-direction:column`(`min-height` 없음) > 스크롤 영역 `flex:1; overflow-y:auto` > 600px 내용과 맨 아래 버튼), ② 가로로 잘린 스크롤 영역(바깥 `display:flex; width:300px; overflow:hidden` > 중간 감싸개 `flex:1`(`min-width` 없음) > `overflow-x:auto` 스크롤 영역(`data-scroll-row` 없음) > 칩 8개 약 600px), ③ 잘린 배지 줄(폭 266px `display:flex; flex-wrap:nowrap; gap:6px; overflow:hidden` > Must-Read 배지 + 긴 기술 배지 3개 `flex-shrink:0; max-width:128px`, 글자 감싸개 말줄임·`min-width` 없음). `data-expect="clip"` 은 ①② 는 스크롤 영역 요소에, ③ 은 배지 줄 요소에 단다. `clean.html` 에는 같은 구조의 고친 형태(①에 `min-height:0`, ②에 `min-width:0`, ③ 기술 배지 `flex-shrink:1; min-width:48px; max-width:128px` + 글자 감싸개 `min-width:0`)와, 기존 맥락 줄의 칠한 `role="group"` 위젯(`clean.html:151` 부근)을 알파 0 배경 감싸개 두 겹(바깥 `role="toolbar"` `background-color: color(srgb 1 1 1 / 0)`, 안쪽 `role="radiogroup"` `background-color: oklab(0 0 0 / 0)`, 각 `padding-left:4px`)으로 싸서 칠한 위젯 왼쪽 끝이 메시지 열·입력 영역과 맞게 둔다. 기존 fixture 요소는 지우거나 바꾸지 않는다 (감싸개를 더하는 것만).
      - `clip` ④ (`:709-741`): 조상을 거슬러 오르다 어떤 축의 스크롤 영역(`overflow-x`/`overflow-y` 가 `auto`·`scroll`)을 지나면, 그 축에서는 요소 rect 대신 그 스크롤 영역의 rect 를 더 바깥 조상의 패딩 상자와 계속 비교한다 (지금은 `pastScrollX`/`pastScrollY` 로 비교를 멈춘다). 바깥 조상이 그 축에서 `visible` 이 아니고 스크롤 영역도 아니며 스크롤 영역 rect 가 1px(`clipTolerance`) 넘게 나가면 실패 `스크롤 영역이 부모 상자 밖으로 세로 잘림`/`… 가로 잘림` 이다. 실패는 스크롤 영역 요소에 한 번만 남긴다 (보고한 스크롤 영역을 `Set` 으로 기억해 그 안 요소들이 중복하지 않게). `data-scroll-row` 줄 자체의 가로 비교는 ① 의 면제 그대로, 말줄임·line-clamp·접힌 영역(`intended`) 규칙 그대로. 기준값 상수는 바꾸지 않는다 (바꿔야 할 것 같으면 멈추고 보고, spec 값).
      - `chatAlign` 의 `painted` (`:1011-1016`): 계산된 `background-color` 에서 알파를 읽는 도우미를 스크립트 상단에 둔다 — `/` 뒤 값, 쉼표 표기의 넷째 값, 16진 표기(`#rrggbbaa`·`#rgba`)의 알파 자리. 0 또는 0% 면 투명, `transparent` 도 투명, 알파를 읽지 못하면 칠한 것으로 본다. `borderLeftWidth`·`boxShadow` 판정은 그대로.
      - 사전 측정 (우려 22, 결과는 커밋하지 않는다): 2차 '실행 환경' 과 27 task 의 방식대로 `git worktree add --detach <scratchpad>/al-pre <이 단계 시작 때 HEAD>` 를 프로덕션 빌드해 포트 3101 로 띄우고(31~35 의 미커밋 수정이 들어가지 않는다), 이 단계에서 고친 스크립트로 `node scripts/ui-audit.mjs --base http://localhost:3101 --commit <그 sha> --screenshots none --out <scratchpad>/pre-audit` 를 돌린다. 실패를 나눈다: (i) 판정 오탐 → 이 단계에서 스크립트를 고친다 (`clean.html` 계속 통과, 기준값 불변). (ii) 31~35 가 고치는 결함(예: 1024 배지 줄 `clip` → 33) → 담당 단계만 적는다. (iii) '변경 파일' 리뷰 후속 목록 밖 파일의 결함 → 공통 규칙대로 task 를 `blocked` 로 두고 '실패 목록' 표를 남긴다. 끝나면 서버를 끄고 `git worktree remove` 한다.
    - 먼저 실패하는 테스트 (vitest 대상이 아니다. `--self-test` 가 판정의 테스트다):
      - fixture 만 더하고 스크립트를 고치기 전에 `cd frontend && CHROME_PATH=… node scripts/ui-audit.mjs --self-test` → 종료 1. 예상 실패 이유: (a) `defects.html` ①② 의 스크롤 영역이 `clip` 실패를 내지 않는다 (스크롤 영역을 지나면 그 축 비교를 멈춘다). (b) `clean.html` 에서 `chatAlign` 실패 (감싸개의 `color(srgb … / 0)`·`oklab(… / 0)` 배경을 칠한 것으로 봐 왼쪽 끝이 4px 또는 8px 어긋난다, `:1014` 의 `rgba(…, 0)` 정규식 하나뿐).
      - 실패 예상 아님 (결함 재현 확인, spec 14.12 단계 30): `defects.html` ③ 배지 줄은 지금의 ① 로 이미 `clip` 실패여야 한다. 실패하지 않으면 멈추고 `blocked` (배지 줄 결함 이해가 틀렸다). `clean.html` 의 고친 ①②③ 은 통과해야 한다 (통과하지 않으면 판정 오탐이므로 고친다).
      - self-test 출력의 문제 줄을 task '검사 결과' 에 붙이고 fixture 두 파일만 경로 지정 커밋한다: `test(ui-redesign): 30 실패 fixture — clip ④·chatAlign 알파`. 그 다음 스크립트를 고친다.
    - 끝 기준: `cd frontend && pnpm exec eslint scripts/ui-audit.mjs` 오류 0, `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0 (`defects.html` 의 새 `data-expect="clip"` 3개가 모두 `clip` 실패, `clean.html` 실패 0, `dev-indicator.html` 환경 오류), task 에 사전 측정 표(조합 수, 검사별 실패 수, 새 실패마다 (i)~(iii) 분류와 담당). (iii) 이 있으면 `blocked`. Chrome 이 없으면 `blocked`. backend·데이터가 없으면 사전 측정만 못 했다고 적고 메인 세션에 알린다 (36 이 같은 판정으로 다시 잰다).
    - 후속 2 (보정 3, 2026-11-06): `scrollRow` 보정 3 판정(768 미만 넘친 쪽마다 표시·표시 겹침, 선택 칩이 흐림 24px 밖, `scroll-padding` 24px, `data-selected-selector`), fixture 3행, `--self-test` 360 폭, 360·390 소스 줄 `mustReadHidden`·`startHint` 증거. 할 일·먼저 실패하는 테스트·끝 기준은 '보정 3' 의 '30 A 후속 2'. 31 B 후속 3 과 병렬. 기록은 `30-audit-clip-scroll.md` 의 '후속 2' 절 (후속 1 은 그 파일의 '후속: `scrollRow` 선택 칩 가시성').
    - 후속 3 (reviewer 재리뷰 Nit 1, 2026-11-07, done): `clip` ① 의 '스크롤바가 보이는 스크롤 영역' 가로 면제를 768 이상에서만 준다 (모바일·macOS 기본은 오버레이 스크롤바라 스크롤 전에는 보이지 않는다). 360 self-test 검사 목록에 `clip` 을 더했다. fixture 먼저 `3a393df`, 수정 `345112d`. 기준값 상수 불변. 프로덕션 확인은 36 재측정 5. 기록은 `30-audit-clip-scroll.md` '후속 3'.
    - 후속 4 (보정 5, 2026-11-07): `toolbar.mustReadVisible` 판정과 '숨은 Must-Read' fixture. 할 일·테스트·끝 기준은 '보정 5' 의 '30 A 후속 4'. 34 E 후속 3·31 B 후속 4 와 병렬.
31. **[implementer B] 스크롤 버튼 포커스 유지·`ChipGroup selectedSelector`** — 웨이브 8a. spec 14.3 '스크롤 버튼 포커스 유지'·'줄별 선택 칩 선택자', 14.9 `ui/ChipGroup.test.tsx`, R15. 리뷰 Important 1, Nit 4 의 부품 쪽.
    - 담당 파일: `components/ui/ScrollRow.tsx`, `components/ui/Chip.tsx`, `tests/ui/ChipGroup.test.tsx`(추가만). task `tasks/ui-redesign/31-scroll-focus.md`.
    - 할 일:
      - `ScrollRow`: 이전·다음 버튼 요소 ref 두 개와, 포커스를 가진 버튼을 기억하는 ref(`'prev' | 'next' | null`, 상태가 아니라 다시 그리지 않는다)를 둔다. 버튼 `onFocus` 에서 설정하고, `onBlur` 에서는 `queueMicrotask` 뒤 그 버튼이 아직 문서에 연결돼 있을 때만 지운다 (사용자가 포커스를 옮긴 경우). `useLayoutEffect`(의존 `showPrev`, `showNext`)에서 기억한 버튼이 렌더되지 않고 `document.activeElement` 가 `body`·`null`·연결이 끊긴 요소면 ① 반대쪽 버튼(렌더돼 있으면) ② 줄 안 `selectedSelector` 자식 ③ 줄의 첫 포커스 가능 요소(비활성이 아닌 `button`·`[href]`·`input`·`select`·`textarea`·`[tabindex]:not([tabindex="-1"])`) 순서로 첫 대상에 `focus({ preventScroll: true })` 하고 ref 를 지운다. 버튼은 지금처럼 넘친 쪽에만 렌더한다 (늘 렌더 + `aria-disabled` 금지 — `ChipGroup.test.tsx:176,188`, `Tabs.test.tsx:249`). 상태 갱신을 더하지 않는다 (`react-hooks/set-state-in-effect`). 파일 머리 JSDoc 에 포커스 유지 순서를 적는다. 넘침 표시·`bleed`·선택 자식 보이기 effect 는 그대로.
      - `ChipGroup` (`Chip.tsx:89-116`): `selectedSelector?: string` 을 받아 `scrollable` 이면 `ScrollRow` 에 넘긴다. 주지 않으면 넘기지 않아 `ScrollRow` 기본값(`[aria-pressed="true"]`) 그대로다. `scrollable` 이 아니면 쓰지 않는다. `Chip` 은 바꾸지 않는다 (`data-source-chip` 같은 속성은 `...rest` 로 이미 넘어간다).
      - 탭 줄(`Tabs`)은 이미 `selectedSelector='[role="tab"][aria-selected="true"]'` 를 넘기므로 ② 대상은 선택 탭이다. `Tabs.tsx` 는 고치지 않는다.
    - 먼저 실패하는 테스트 (`ChipGroup.test.tsx` 에 새 `describe`. 기존 `layout`·`MockResizeObserver`·`setScrollLeft` 도우미를 쓴다. `useMediaQuery` 는 렌더마다 `matchMedia` 를 다시 읽으므로 폭을 바꿀 때는 목을 바꾼 뒤 `rerender` 로 다시 그린다. 기존 `mockMatchMedia` 로 모자라면 새 도우미를 더한다):
      - ① 1280 목, `end` 상태에서 `카테고리 다음 항목 보기` 에 `focus()` → `scrollLeft` 를 끝으로 바꾸고 `scroll` 이벤트 → `다음` 버튼이 없고 `document.activeElement` 가 `카테고리 이전 항목 보기` 버튼. 예상 실패: 버튼이 빠지며 `activeElement` 가 `body`.
      - ② 1280 목, `both` 상태에서 `다음` 버튼에 `focus()` → 목을 360 으로 바꿔 `rerender`(두 버튼 사라짐) → `activeElement` 가 `aria-pressed="true"` 칩. 예상 실패: `body`.
      - ③ 회귀 방지 (실패 예상 아님): 버튼에 `focus()` → 다른 칩에 `focus()` → 버튼이 사라져도 `activeElement` 는 그 칩.
      - ④ `<ChipGroup label="소스" scrollable selectedSelector='[data-source-chip][aria-pressed="true"]'>` 안에 첫 칩 `aria-pressed` true(선택자 밖, 줄 안)와 줄 오른쪽 밖의 `data-source-chip` 선택 칩. 기존 `ScrollRow — selectedSelector (3차)` 블록(`:414-`)과 같은 `getBoundingClientRect` 목 → 처음 그린 뒤 줄 `scrollLeft` > 0. 예상 실패: `ChipGroup` 이 prop 을 받기만 하는 빈 구현이라 기본 선택자가 줄 안 첫 칩을 골라 `scrollLeft` 0.
      - 빈 구현: `ChipGroup` 의 `selectedSelector` 는 받기만 한다 (실패가 타입 오류가 아니라 단언에서 나게).
    - 끝 기준: `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx src/tests/ui/Tabs.test.tsx src/tests/feed src/tests/chat src/tests/AskAiPanel.test.tsx src/tests/modals` 통과, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
    - 후속 3 (보정 3, 2026-11-06): 768 미만 양쪽 넘침 표시·`data-overflow-slot`·표시 쪽 `bleed` 규칙·`scroll-px-6`·`data-selected-selector`, `ChipGroup.test.tsx` 의 기존 단언 4곳 변경(':287, :328, :368, :388-396', '증명' 표)과 새 단언. 할 일·먼저 실패하는 테스트·끝 기준은 '보정 3' 의 '31 B 후속 3'. 30 A 후속 2 와 병렬, 34 E 후속보다 먼저. 기록은 `31-scroll-focus.md` 의 '후속 3' 절 (후속·후속 2 는 그 파일에 이미 있음).
    - 후속 4 (보정 5, 2026-11-07): 입력 신호 뒤 `scroll` 만 사용자 스크롤로 보는 판정, `ChipGroup.test.tsx:619` 단언 변경('증명' 표). `0330596` 에서 blocked 였던 같은 '후속 4' 절을 이어서 한다. 할 일·테스트·끝 기준은 '보정 5' 의 '31 B 후속 4'. 34 E 후속 3·30 A 후속 4 와 병렬.
    - 후속 5 (보정 6, 2026-11-07): `wheel` 은 가로 의도일 때만 입력 신호, 새 단언 ⑤⑥, `ChipGroup.test.tsx:619`·`:950` 의 휠 입력을 `{ deltaX: 40 }` 으로 ('증명' 표). 할 일·테스트·끝 기준은 '보정 6' 의 '31 B 후속 5'. 기록은 `31-scroll-focus.md` 의 '후속 5' 절.
32. **[implementer C] 알림 한 번만 알리기** — 웨이브 8a. spec 14.7 C-2 '(리뷰 후속)', 14.9 `ui/Toast.test.tsx`, R23. 리뷰 Nit 3.
    - 담당 파일: `components/ui/Toast.tsx`, `tests/ui/Toast.test.tsx`(추가만). task `tasks/ui-redesign/32-toast-announce-once.md`.
    - 할 일: 모듈 저장소에 `announcedBy: Map<number, string>`(알림 id → 영역 id)를 둔다. 알림을 그린 영역이 `useEffect` 에서 아직 기록이 없는 id 만 자기 영역 id 로 적는다 (같은 값이라 StrictMode 이중 실행에도 결과가 같다). 알림 요소는 기록이 없거나 자기 영역 id 일 때만 `role`(`status`/`alert`)·`aria-live` 를 갖고, 다른 영역이 이미 알린 알림은 live 속성 없이 그린다 (글자·아이콘·닫기 버튼·클래스는 같다). `dismissToast` 는 그 id, `clearToasts` 는 전체 기록을 지운다. 영역 고르기(`pickRegionOwner`), `placement`, `data-toast-region`, 시간, `role`·`aria-live` 값은 그대로. 첫 영역이 기록 전에 다시 그려져도 자기 알림의 live 속성을 잃지 않는지(기록이 없으면 live) 확인한다.
    - 먼저 실패하는 테스트 (`Toast.test.tsx` 새 `describe`. 모달은 기존 `Toast.test.tsx` 의 모달 `Dialog` 패턴):
      - `<ToastRegion />` 와 `<ToastRegion placement="composer" />` 마운트 → `danger` 알림 → `[data-toast-region="composer"]` 안에 `role="alert"` → 모달 `Dialog` 를 열어 알림이 `global` 영역으로 옮겨짐 → `global` 영역 안 같은 글자 요소에 `role`·`aria-live` 가 없고 `within(global).queryAllByRole('alert')` 0개 → 그 상태에서 새 `info` 알림은 `global` 영역에서 `role="status"`·`aria-live="polite"`. 예상 실패: 옮겨진 알림이 `role="alert"` 를 다시 가져 1개.
      - 회귀 방지 (실패 예상 아님): 영역이 하나일 때 알림은 지금처럼 `role`·`aria-live` (기존 `:12-20`, `:87` 단언과 같은 조건).
      - spec 14.9 의 '닫힌 알림 id 는 기록에서 지워짐' 은 알림 id 가 재사용되지 않아 공개 API 로 관찰할 수 없다. 테스트 전용 내보내기를 만들지 않고 '증명' 의 정적 확인으로 대신한다 ('위험' 리뷰 후속).
    - 끝 기준: `pnpm exec vitest run src/tests/ui/Toast.test.tsx src/tests/ui/OverlayStack.test.tsx src/tests/ui/Dialog.test.tsx src/tests/chat/ChatWorkspace.test.tsx src/tests/modals src/tests/Header.test.tsx` 통과, `grep -nE "announcedBy\.(delete|clear)" frontend/src/components/ui/Toast.tsx` 가 `dismissToast`·`clearToasts` 안에서 나옴, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
33. **[implementer D] 배지 줄: `Badge shrink`·기술 배지 줄어듦** — 웨이브 8a. spec 14.4 '배지 줄 (리뷰 후속)', 14.9 `NewsCard.test.tsx`, R16·R17. 리뷰 Important 3.
    - 담당 파일: `components/ui/Badge.tsx`, `components/NewsCard.tsx`, `tests/NewsCard.test.tsx`·`tests/ui/Primitives.test.tsx`(추가만). task `tasks/ui-redesign/33-badge-row.md`.
    - 할 일:
      - `Badge`: `shrink?: boolean`(기본 `false`). `false` 면 지금 클래스 그대로(`max-w-full shrink-0` 포함). `true` 면 그 두 클래스 대신 `shrink` 만 붙이고 폭 한계(`min-w-*`, `max-w-*`)는 호출자 `className` 이 준다. 같은 속성 클래스를 두 번 붙이지 않는 것이 목적이다 (`cn` 은 충돌을 풀지 않는다, `lib/cn.ts` 불변). 다른 `Badge` 사용처는 고치지 않는다 (기본값이라 그대로).
      - `NewsCard` 배지 줄(`:146-158`): 감싸개에 `data-card-badges`, 클래스 `flex flex-nowrap items-center gap-1.5 overflow-hidden` 유지(안전장치). 기술 배지 `<Badge shrink className="min-w-12 max-w-32" title={tech}><span className="min-w-0 truncate">{tech}</span></Badge>`. `Must-Read` 배지는 `shrink` 없이 그대로. 기술 최대 3개, 머리줄 배지 없음, 제목·본문·바닥은 그대로. 카드에 '+N'·펼침을 더하지 않는다.
    - 먼저 실패하는 테스트:
      - `NewsCard.test.tsx` 새 `describe` (Must-Read + 긴 기술 이름 3개 기사): `[data-card-badges]` 가 있고 `flex-nowrap`·`overflow-hidden`; 기술 배지마다 `shrink`·`min-w-12`·`max-w-32` 가 있고 `shrink-0`·`max-w-full` 이 없음; 기술 글자 감싸개가 `min-w-0`·`truncate`; Must-Read 배지는 `shrink-0`; 기술 배지 `title` 이 기술 이름 전체. 클래스는 `classList.contains` 로 토큰 단위로 본다 (`shrink` 가 `shrink-0` 의 부분 문자열이라 `className` 문자열 `toContain` 은 쓰지 않는다). 예상 실패: `data-card-badges` 없음, 기술 배지에 `shrink-0`·`max-w-full` 이 있고 `min-w-12`·글자 감싸개 `min-w-0` 이 없음.
      - `Primitives.test.tsx` 새 `it`: `<Badge shrink className="min-w-12 max-w-32">` 의 `classList` 에 `shrink`·`min-w-12`·`max-w-32` 가 있고 `shrink-0`·`max-w-full` 이 없음, 기본 `<Badge>` 는 `shrink-0`·`max-w-full` 이 있음. 예상 실패: prop 을 받기만 하는 빈 구현이라 `shrink-0`·`max-w-full` 이 붙는다.
      - 빈 구현: `Badge` 의 `shrink` 는 받기만 한다.
      - 배치 증거 인용 (jsdom 은 배치를 계산하지 않는다): spec 14.4 의 리뷰 측정(1024 3열 카드 안쪽 약 266px 에서 마지막 배지가 약 20px 글자 중간에서 잘림)과, 30 이 끝났으면 30 task 의 `defects.html` ③ 실패 줄. 프로덕션 확인은 36.
    - 끝 기준: `pnpm exec vitest run src/tests/NewsCard.test.tsx src/tests/ui/Primitives.test.tsx src/tests/modals src/tests/chat src/tests/feed src/tests/design` 통과, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
34. **[implementer E] 툴바 한 트리·소스 줄 선택 칩** — 웨이브 8b (G8 뒤 단독. 31 의 `ChipGroup selectedSelector` 에 기댄다). spec 14.2 (R33 표·폭 계산), 14.3 '줄별 선택 칩 선택자', 14.9 `feed/FeedToolbar.test.tsx`, 우려 20. R14·R15·R16·R33. 리뷰 Nit 1, Nit 4 의 사용 쪽.
    - 담당 파일: `components/feed/FeedToolbar.tsx`, `tests/feed/FeedToolbar.test.tsx`(추가만). task `tasks/ui-redesign/34-toolbar-single-tree.md`.
    - 할 일:
      - `useToolbarLayout`·`ToolbarLayout`·`useMediaQuery` import 와 폭별 분기(`:236-268`)를 지우고 한 트리로 그린다: `[data-feed-toolbar]` 안에 줄 A `ToolbarRow`(`max-md:flex-col max-md:items-stretch`) = 카테고리 그룹 → 검색, 줄 B `ToolbarRow` = 소스 그룹 → 정렬. 폭별 크기는 클래스로만 준다 (14.2 표): 카테고리 `min-w-0 flex-1`(768 미만은 세로 쌓기라 전체 폭, `bleed` 그대로, 아이콘 `max-xl:hidden` 그대로), 검색 폼 `w-full md:w-48 md:shrink-0 xl:w-72`, 소스 `min-w-0 flex-1`(`bleed="start"` 그대로), 정렬 `w-28 shrink-0 xl:w-32`. `order-*`·`*-reverse`·grid 영역을 쓰지 않는다. 파일 머리 JSDoc 표(`:91-99`)와 주석을 14.2 새 표대로 고친다. 주석에도 `useMediaQuery`·`-reverse`·`order-` 글자를 남기지 않는다 (정적 확인이 주석까지 본다).
      - 소스 줄: `전체`·소스·`북마크` 칩에 `data-source-chip=""`, `ChipGroup` 에 `selectedSelector='[data-source-chip][aria-pressed="true"]'`. `Must-Read` 칩과 구분선은 그대로 (선택자 밖).
      - 그대로 두는 것: 칩 순서·이름·건수·`aria-pressed`, 그룹 이름, Must-Read 첫 칩, 정렬 옵션, 자리표시 `키워드 검색`, `-my-2`·sticky·배경 클래스, `searchInputRef`, props (`page.tsx` 불변).
    - 먼저 실패하는 테스트 (새 `describe`. 폭 목은 이 파일의 360 블록과 같은 방식의 새 도우미를 두고 `afterEach` 에서 복원. 칩 rect 는 `ChipGroup.test.tsx` 의 `getBoundingClientRect` 목 방식):
      - ① `highSignalOnly: true, source: 'github'`, 소스 줄 넘침 목과 칩 rect 목(`GitHub` 칩이 줄 오른쪽 밖) → 처음 그린 뒤 소스 줄 `scrollLeft` > 0. 이어서 `highSignalOnly` 만 false 로 `rerender` → `scrollLeft` 불변. 예상 실패: 기본 선택자가 줄 안의 `Must-Read` 를 골라 `scrollLeft` 0 (그리고 Must-Read 를 끄면 선택 칩이 바뀌어 줄이 움직인다).
      - ② 폭 목 360 으로 렌더 → 검색 입력에 `focus()` 와 값 → 1024 로 바꿔 `rerender` → 1440 으로 바꿔 `rerender`: 매번 `getByRole('searchbox', { name: '키워드 검색' })` 가 처음 노드와 같고(`toBe`) `document.activeElement` 이며 값이 남음, `카테고리`·`소스` 그룹 노드도 처음과 같음. 칩 줄 `scrollLeft` 는 단언하지 않는다 (R15 의 선택 칩 다시 보이기 규칙을 따른다, spec 보정 4). 예상 실패: 폭마다 다른 트리라 다시 마운트되어 노드가 다르고 포커스가 `body`.
      - ③ 360·1024·1440 각각에서 컨트롤 DOM 순서 `카테고리` 그룹 → 검색 → `소스` 그룹 → 정렬 (`compareDocumentPosition`). 예상 실패: 360 은 검색이 카테고리보다 앞(`sm` 트리), 1024 는 정렬이 검색보다 앞(`md` 트리).
      - ④ 360·1024·1440 각각에서 검색과 `카테고리` 그룹이 같은 `[data-toolbar-row]`, `소스` 그룹과 정렬이 같은 `[data-toolbar-row]`. 예상 실패: 1024 에서 카테고리와 정렬이 같은 줄, 360 에서 검색이 혼자 한 줄.
      - 배치 증거 인용: 리뷰 Nit 1 의 코드 줄(`:67-81,154-158,226,236-268`)과 하이드레이션 뒤 배치 변경 설명 (jsdom 은 하이드레이션을 재지 않는다. 프로덕션 확인은 36 과 verify 의 Chrome 확인).
    - 끝 기준: `pnpm exec vitest run src/tests/feed src/tests/ui/ChipGroup.test.tsx src/tests/hooks/useNewsFeed.test.tsx src/tests/HotkeyGating.test.tsx src/tests/chat/HandoverIntegration.test.tsx` 통과 (기존 `FeedToolbar.test.tsx` 단언 모두 그대로), `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx` 출력 없음, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
    - 후속 (보정 3, 2026-11-06): `FeedToolbar.test.tsx:142` 단언 변경('증명' 표)과 360 소스 줄 `both` 의 왼쪽 표시 새 단언, 필요할 때만 `FeedToolbar.tsx`. 31 B 후속 3 뒤. 할 일·테스트·끝 기준은 '보정 3' 의 '34 E 후속'. 기록은 `34-toolbar-single-tree.md` 의 '후속' 절.
    - 후속 3 (보정 5, 2026-11-07): R34 Must-Read 고정 토글, `FeedToolbar.test.tsx:50·:52-55·:57·:59` 단언 변경('증명' 표). 위 ③ 의 DOM 순서는 `카테고리 → 검색 → 소스 → Must-Read → 정렬` 이 된다 (새 `it` 로 단언). 할 일·테스트·끝 기준은 '보정 5' 의 '34 E 후속 3'. 31 B 후속 4·30 A 후속 4 와 병렬.
35. **[implementer H] 오래된 상태 응답 버리기** — 웨이브 8a. spec 14.7 C-7 ④, 14.9 `hooks/useCollector.test.ts`, R27. 리뷰 Nit 2.
    - 담당 파일: `hooks/useCollector.ts`, `tests/hooks/useCollector.test.ts`(추가만). task `tasks/ui-redesign/35-collector-stale-status.md`.
    - 할 일: 모듈 변수 `statusSeq`(상태 요청마다 1 증가, 요청 번호로 캡처), `appliedStatusSeq`(마지막으로 반영한 응답의 번호), `progressEndSeq`(진행 폴링이 완료·실패로 끝날 때의 `statusSeq`)를 둔다. `loadStatus` 응답의 번호가 `appliedStatusSeq` 보다 작거나 `progressEndSeq` 이하이면 상태도 폴링도 바꾸지 않고 버린다. 진행 완료 처리(`:118-123`)와 진행 실패 처리에서 `progressEndSeq = statusSeq` 를 정한 뒤 `loadStatus()` 를 부른다 (완료 뒤 보낸 상태 요청은 반영된다). `stopAll` 이 세 값을 처음으로 돌린다 (`generation` 규칙 그대로). 즉시 수집·초기화·`already_running`·회차(`pollRun`) 규칙, 공개 반환값, 문구는 그대로. backend·`lib/api.ts` 불변, 테스트 전용 내보내기 없음 (26 의 `vi.resetModules()` + 동적 import 방식).
    - 먼저 실패하는 테스트 (`useCollector.test.ts` 새 `describe`, MSW `server.use` 로 상태 응답을 붙잡아 두는 핸들러, 가짜 타이머):
      - ① 수집 중 30초 상태 요청을 붙잡아 둔 채(`is_running: true`) 진행 응답이 `is_running: false` → `수집 완료 …` 문구 → 붙잡은 응답을 풂 → `isCollecting` false, `PROGRESS_POLL_MS` 를 여러 번 지나도 진행 요청 횟수 불변, `수집 완료` 문구가 설정된 횟수 1. 예상 실패: 늦은 응답이 `progressTimer === null` 을 보고 폴링을 다시 켜 `isCollecting` true, 진행 요청이 늘고 다음 완료에서 문구가 두 번.
      - ② 상태 요청 A(먼저)·B(나중) 중 B 응답이 먼저 반영된 뒤 A 응답이 오면 `status` 가 B 값 그대로. 예상 실패: A 가 덮어쓴다.
      - 회귀 방지 (실패 예상 아님): 26 의 (a)~(c) 와 회차 구분 테스트가 그대로 통과.
    - 끝 기준: `pnpm exec vitest run src/tests/hooks/useCollector.test.ts src/tests/Header.test.tsx src/tests/CommandPalette.test.tsx src/tests/modals/ScheduleModal.test.tsx` 통과, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
36. **[implementer A] 측정 재실행: self-test·1ec8a9b 기준선·HEAD 프로덕션** — G9 뒤 단독. 판정(30)이 바뀌었으므로 수정 전 기준선과 HEAD 프로덕션을 둘 다 다시 잰다. R14~R24·R29~R31 의 폭별 증거, R30 ①②, R33 의 화면 쪽 증거. 19 기준선·27 측정의 연장.
    - 담당 파일: `docs/features/ui-redesign/audit/report.json`, `docs/features/ui-redesign/audit/*.png`, `docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json`. 앱·스크립트 파일은 이 단계 소유가 아니다 (판정 오탐 수정은 30 의 연장으로 A 가 하고 30 task 에 기록, 앱 결함은 소유 단계). task `tasks/ui-redesign/36-prod-audit-3.md`.
    - 할 일:
      1. `cd frontend && CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0.
      2. HEAD(G9 커밋) 프로덕션: 27 task 의 방식대로 `git worktree add --detach <scratchpad>/al-head HEAD` → `pnpm install --frozen-lockfile` → 빌드 → standalone 포트 3101, backend 는 scratchpad DB 복사본으로 8102. `node scripts/ui-audit.mjs --base http://localhost:3101 --commit "$(git rev-parse HEAD)"` (기본 `--out`, `--screenshots key`).
      3. 수정 전 기준선 (R30 ②): 19 task 의 방식대로 `git worktree add <scratchpad>/al-1ec8a9b 1ec8a9b` → 프로덕션 빌드 → 포트 3102 → `node scripts/ui-audit.mjs --base http://localhost:3102 --commit 1ec8a9b --screenshots none --out "$(git rev-parse --show-toplevel)/docs/features/ui-redesign/audit/baseline-1ec8a9b"`. 종료 1 이 정상이다. F1~F4 가 그대로 잡히는지 확인하고, 판정 ④·알파 판정으로 늘어난 기준선 실패를 검사별 건수로 적는다. F1~F4 중 하나라도 빠지면 30 의 연장으로 검출을 고친다 (기준값을 느슨하게 하거나 대상을 좁혀 맞추지 않는다).
      4. 실패를 나눈다 (공통 규칙 '측정에서 새 실패'): 앱 결함이 리뷰 후속 목록 안 파일이면 메인 세션이 담당 단계(31~35) implementer 에 SendMessage 로 고치게 한다. 목록 밖이면 `blocked` + plan 재승인. 판정 오탐이면 30 의 연장 (self-test 다시 통과, 검출이 바뀌면 3 을 다시). 기준값 상수 변경은 멈추고 보고한다. 모두 통과할 때까지 다시 빌드·측정하고 마지막 결과를 남긴다 (`report.json`, PNG 24장. 이름 규칙에 없는 PNG 는 지운다).
      5. 배지 줄 결함의 프로덕션 재현 (spec 14.8): 측정 데이터에 1024 3열에서 Must-Read + 기술 3개 카드가 있는지 1024 스크린샷과 피드 응답으로 확인한다. 있으면 그 카드의 `clip` 실패 0 을, 없으면 '프로덕션 재현 불가 — fixture(30)·단위 테스트(33)로 증명' 을 task 에 적는다.
      6. 육안 확인 (스크린샷 또는 scratchpad `--screenshots all`): 360·768·1024·1440 피드 툴바가 14.2 새 표의 배치(768 미만 카테고리 → 검색 → 소스+정렬, 768~1279 카테고리+검색 / 소스+정렬)이고 R5 첫 화면(390×844 카드 제목 1개 이상)이 유지됨, 1024 카드 배지 줄이 글자 중간에서 잘리지 않음. 본 것과 경로를 task 에 적는다.
      7. 마지막에 `make check` 를 한 번 돌리고 출력 전체를 task 에 붙인 뒤 `git status` 로 루트 `config.json`·`sources.json`·`backend/app/config/sources.json` 변경을 되돌린다. backend `test_anti_gemini_isolation_*` 2개 외 실패가 있으면 보고한다.
    - 끝 기준: `report.json` 모든 조합 `pass: true`(판정 ④ 포함), 조합마다 그 상태의 14.8 검사 이름이 `checks` 에 있음, `environment.devIndicator: false`, `environment.commit` 이 측정한 커밋, `ls docs/features/ui-redesign/audit/*.png | wc -l` 이 24, `baseline-1ec8a9b/report.json` 의 `environment.commit` 이 `1ec8a9b` 이고 F1·F2·F3·F4 실패가 있음, `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공. Chrome·backend·데이터가 없으면 `blocked` (verify 에서 미검증, 통과로 보고하지 않는다 — 우려 13).
    - 재측정 4 (보정 3, 2026-11-06): G11 뒤 단독. `frontend/scripts` 가 바뀌므로(30 후속 2) 1ec8a9b 기준선과 HEAD 프로덕션을 둘 다 다시 잰다. 360·390 소스 줄 `mustReadHidden`·`startHint` 인용, 360·390 라이트 스크린샷 육안 확인. 할 일·끝 기준은 '보정 3' 의 '36 A 재측정 4'. 기록은 `36-prod-audit-3.md` 의 '재측정 4' 절 (재측정 2·3 은 그 파일에 이미 있음).
    - 재측정 5 (보정 5, 2026-11-07): G13 뒤 단독. 판정(30 후속 3·4)과 앱(34 후속 3·31 후속 4)이 바뀌어 HEAD 와 1ec8a9b 기준선을 다시 잰다. 할 일·끝 기준은 '보정 5' 의 '36 A 재측정 5'. 기록은 `36-prod-audit-3.md` '재측정 5'.
    - 재측정 6 (보정 6, 2026-11-07, 권장): G15 뒤 단독. 판정이 바뀌지 않아 HEAD 전체 측정 1회만 (1ec8a9b 기준선은 다시 재지 않음). 할 일·끝 기준은 '보정 6' 의 '36 A 재측정 6'. 기록은 `36-prod-audit-3.md` '재측정 6'.
37. **[main 세션] 통합·상세 문서 반영** — G10 뒤. spec 14.10 '(리뷰 후속)' 과 14.12, '변경 파일' 리뷰 후속의 문서 목록 그대로. task `tasks/ui-redesign/37-docs-3.md`.
    - `docs/design-system.md`: 5.1 `Badge` 행(`shrink` prop, 같은 속성 클래스를 두 번 붙이지 않는 이유 — `cn` 이 충돌을 풀지 않음), `ChipGroup`·`ScrollRow` 행(`selectedSelector`, 스크롤 버튼 포커스 유지 순서: 반대쪽 버튼 → 선택 자식 → 첫 포커스 가능 요소), `Toast` 행(한 알림은 처음 그린 영역에서만 live 속성), 9 검사 방법(`clip` ④, `chatAlign` 알파 판정, 새 fixture 4종).
    - `docs/ui-spec.md`: 피드 툴바 폭별 배치(14.2 새 표, 768 미만 카테고리가 맨 위, 한 트리·CSS 배치, DOM 순서 = 화면 순서), 카드 배지 줄(기술 배지가 줄며 말줄임, 각 48~128px).
    - `docs/functional-spec/01-news-feed.md`: NEWS-02~06 툴바 배치·순서·폭이 바뀌어도 검색 포커스 유지·소스 줄 선택 칩(Must-Read 제외), NEWS-08 배지 줄.
    - `docs/functional-spec/07-ui-common.md`: UI-02 오래된 상태 응답 무시·`수집 완료` 한 번, 알림이 영역을 옮겨도 다시 알리지 않음, 스크롤 줄 버튼 포커스 유지(스크롤 줄을 적은 절이 있으면).
    - `docs/test-cases.md`: 14.9 리뷰 후속 단언(파일별 추가 테스트), 파일·테스트 수.
    - `docs/test-strategy.md`: ui-audit `clip` ④·`chatAlign` 알파 판정·fixture, 테스트 수.
    - `docs/tech-spec.md`: '변경 이력' 에 `ui-redesign` 리뷰 후속 한 줄. 다른 절은 바꾸지 않는다.
    - 각 문서 `Updated:` 갱신. 위 목록 밖 문서를 고쳐야 한다고 판단되면 고치기 전에 plan 을 고쳐 재승인받는다.
    - 끝 기준: spec 14.10 '(리뷰 후속)' 의 문서별 항목을 하나씩 대조해 빠진 것이 없다. `grep -nE "카테고리 \+ 정렬|\[검색\] \[카테고리\]|검색\(전체 폭\) \||카테고리\(남는 폭 전부\) \+ 정렬|배치는 \`useMediaQuery\` 로 고른다" docs/ui-spec.md docs/functional-spec/01-news-feed.md` 출력 없음 (작성 때 `ui-spec.md:101`, `01-news-feed.md:62,63,65` 의 옛 배치 서술. 고친 내용을 task 에 적는다).
    - 후속 (보정 3, 2026-11-06): G12 뒤. 37 을 아직 하지 않았으면 위 항목과 보정 3 항목을 한 번에 반영한다. 보정 3 항목은 '보정 3' 의 '37 후속'.
    - 후속 2 (보정 5, 2026-11-07): G14 뒤. known-issues Must-Read 행 삭제와 ui-spec·01·07·design-system·test-cases·test-strategy. '보정 5' 의 '37 후속 2'.
    - 후속 3 (보정 6, 2026-11-07): G16 뒤. `docs/design-system.md` `ScrollRow` 행, `docs/functional-spec/07-ui-common.md` 사용자 스크롤 정의, `docs/test-cases.md` 수·행. '보정 6' 의 '37 후속 3'.

#### 보정 3 (spec 14.13, R15 — 768 미만 양쪽 넘침 표시, 흐림 = 스냅 여백 24px)
36 재측정 3(`8a283d9`, 측정 HEAD `af0c259`)의 육안 확인에서 360·390 소스 줄이 처음부터 `scrollLeft 138` 이라 `★ Must-Read` 가 왼쪽 밖에 숨는데 768 미만 표시가 오른쪽에만 있었다. 31 후속 2 는 768 미만 `bleed` 쪽 스냅 여백 16px(`ScrollRow.tsx:320-325`)가 흐림 24px 와 달라 스냅 위치의 선택 칩 왼쪽 약 8px 가 흐림에 겹친다고 보고했다. spec 14.3 '(보정 3)' 두 항목과 14.8 `scrollRow`·fixture '(보정 3)' 행, 14.13 을 구현한다. `Must-Read` 를 첫 화면에 늘 보이게 하는 배치 변경은 범위 밖이다 (우려 23).

- **규칙**: 리뷰 후속 공통 규칙 그대로다. 다만 바꿀 수 있는 기존 단언은 '증명' 의 '리뷰 후속에서 바꾸는 기존 단언' 표의 보정 3 다섯 줄(spec 14.13, 우려 24)뿐이고, 그 밖의 기존 단언은 그대로 통과해야 한다 (특히 768 미만 `end` 표시 1개: `ChipGroup.test.tsx:357-363`, `Tabs.test.tsx:373-379`, `FeedToolbar.test.tsx:211-215`, `bleed` 줄 `end` 클래스 `ChipGroup.test.tsx:383-385`, 스냅 알고리즘 `mockSnapStyles('16px')` 테스트 `:670-704`). 바꾼 단언은 지우거나 느슨하게 하지 않고 새 규칙을 같은 세기로 단언한다. 실패 테스트 커밋 메시지: `test(ui-redesign): 31 후속 3 실패 테스트 — <요지>`, `test(ui-redesign): 30 후속 2 실패 fixture — <요지>`. 담당은 같은 agent ID 로 SendMessage (B `a49602194c070f0b6`, E `a2cd41bc978ebd13f`, A `aa16eed435b46be0f`). 기록은 기존 task 파일에 절을 더한다 (새 task 파일 없음).
- **순서**
  ```
  31 B 후속 3 ─── 34 E 후속 ─┐
  30 A 후속 2 ───────────────┴─ G11 ─ 36 A 재측정 4 ─ G12 ─ 37 main (후속 포함)
  ```
  - 웨이브 9a = {31 B 후속 3, 30 A 후속 2} 동시. 파일이 겹치지 않는다 (`frontend/src/components/ui/ScrollRow.tsx`·`tests/ui/ChipGroup.test.tsx` 대 `frontend/scripts/**`). 30 후속 2 의 fixture 는 정적 HTML 이라 31 후속 3 을 기다리지 않는다.
  - 34 E 후속은 31 B 후속 3 이 done 이면 시작한다 (30 후속 2 를 기다리지 않는다). 31 후속 3 이 `ScrollRow` 의 `max-md:scroll-pl-4` 를 `scroll-px-6` 으로 바꾸는 순간 `FeedToolbar.test.tsx:142` 가 실패하고, 그 단언은 34(E) 소유라 B 가 고치지 않는다. 그래서 31 후속 3 끝과 34 후속 끝 사이에는 그 한 단언이 실패하는 중간 상태가 있다 (릴리스가 아니므로 받아들이고 G11 에서 0 으로 확인한다). 34 후속의 새 단언(소스 줄 왼쪽 표시)도 31 후속 3 의 양쪽 표시에 기댄다.
  - 36 재측정 4 는 G11 뒤 단독. 앱(`ScrollRow`)과 판정(`scrollRow`)이 함께 바뀌므로 둘 다 들어간 커밋을 잰다.
- **관문 G11** (31 후속 3·34 후속·30 후속 2 done 뒤, 메인 세션): `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공, `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0, `git log --oneline 2034bcc..` 에서 31 후속 3 실패 테스트·30 후속 2 실패 fixture 커밋이 각 구현보다 먼저 있음, '증명' 보정 3 의 기존 단언 확인(바뀐 줄이 표의 다섯 곳과 import 줄뿐), 2차 G4 의 R32 diff 0줄. 웨이브 커밋.
- **관문 G12** (36 재측정 4 done 뒤, 메인 세션): G11 과 같은 검사 + 36 의 끝 기준과 아래 '36 A 재측정 4' 의 더한 끝 기준. 커밋. 그 뒤 37.

**31 B 후속 3** — 웨이브 9a. spec 14.3 '(보정 3)' 두 항목, 14.13 표·새 단언. R15. 파일: `components/ui/ScrollRow.tsx`, `tests/ui/ChipGroup.test.tsx`(표의 4곳 변경 + 새 단언). `Chip.tsx` 는 바꾸지 않는다.
- 할 일 (`ScrollRow.tsx`):
  - 768 미만 넘친 쪽마다 표시: `start` 는 줄 **앞** 형제 `<span aria-hidden="true" data-overflow-hint="start">`(`ChevronLeft`), `end` 는 줄 **뒤** 형제 `data-overflow-hint="end"`(`ChevronRight`), `both` 는 둘 다. 넘치지 않는 쪽에는 없다. 768 이상은 표시 없이 스크롤 버튼(지금 규칙). 표시는 `pointer-events-none`, 포커스 받지 않음, `absolute` 금지(줄·칩 위에 겹치지 않는다), 폭 `w-4`·아이콘 `size-4`, 줄과 간격 0(감싸개 `gap-1` 상쇄: 왼쪽 표시 `-mr-1`, 오른쪽 표시 `-ml-1`).
  - `bleed` 쪽별 규칙 (14.3 보정 3-4·5): 표시가 보이는 쪽에 `bleed` 가 있으면 줄은 그쪽 `-m*-4 p*-4` 를 빼고 표시가 그쪽 페이지 여백을 쓴다 (왼쪽 표시 `max-md:-ml-4`, 오른쪽 표시 `max-md:-mr-4`). 상태별 768 미만 줄 클래스: `none` → `bleed` 그대로, `end` → 왼쪽 `bleed` 만(지금과 같음), `start` → `bleed === true` 면 오른쪽만·`'start'` 면 늘이지 않음, `both` → 늘이지 않음. Tailwind 가 찾도록 클래스는 문자열 그대로 쓴다.
  - `bleed` 없는 쪽의 자리: 줄이 넘치는 동안(`data-overflow` ≠ `none`) `bleed` 가 없는 쪽에는 표시 자리를 늘 둔다. 그쪽이 넘치면 `data-overflow-hint="<쪽>"` 표시, 넘치지 않으면 같은 크기의 `invisible` 자리 `<span aria-hidden="true" data-overflow-slot="<쪽>">` (속성은 `data-overflow-hint` 가 아니다 — 기존 `[data-overflow-hint]` 개수 단언이 그대로 성립). 줄 폭은 넘침이 생기고 없어질 때만 바뀐다.
  - 스냅 여백: 스크롤 줄에 늘 `scroll-px-6`(24px, 폭 접두 없음)을 두고 `bleed` 클래스에서 `max-md:scroll-px-4`·`max-md:scroll-pl-4` 를 뺀다. 흐림(`MASK_CLASSES` 24px), `REVEAL_PADDING_PX`(24)와 같은 값이다. 31 후속 2 의 스냅 위치 고르기 알고리즘은 그대로 (계산된 `scroll-padding` 을 읽으므로 24px 를 받는다).
  - `data-selected-selector={selectedSelector}` 를 스크롤 줄에 단다 (ui-audit 이 선택 칩을 찾는다).
  - 파일 머리 JSDoc·`bleed` prop 주석(`:138`)을 새 규칙으로 고친다. 포커스 유지·선택 칩 보이기·스크롤 버튼은 그대로.
- 먼저 실패하는 테스트 (`ChipGroup.test.tsx`, 768 미만은 기존 `mockMatchMedia(360)`):
  - 표의 기존 단언 4곳을 바꾼다: `:287` `max-md:scroll-px-4` → `scroll-px-6`, `:328` `max-md:scroll-pl-4` → `scroll-px-6`, `:368` `both` 에서 표시 1개 → 2개(`"start"` 그룹 앞, `"end"` 그룹 뒤, 둘 다 그룹 밖·`aria-hidden`), `:388-396` 테스트 (d) 의 제목과 `start` 부분 → `start` 에서 `data-overflow-hint="start"` 1개가 그룹 앞 (같은 테스트의 `none`·768 이상 부분 그대로). 예상 실패: 줄에 `max-md:scroll-px-4`/`scroll-pl-4` 만 있고 `scroll-px-6` 없음, `both` 에서 오른쪽 표시 1개뿐, `start` 에서 표시 없음.
  - 새 단언 (spec 14.13 ①~⑥): ① `start`·`end`·`both` 마다 보이는 표시 개수·`data-overflow-hint` 값·그룹 앞뒤 위치 ② `bleed` 줄의 상태별 클래스(`end` 왼쪽만, `start` 오른쪽만, `both` 없음, `none` 좌우) ③ `bleed` 없는 쪽(`bleed="start"` 줄의 오른쪽, `bleed` 없는 줄의 양쪽)은 넘치는 동안 `data-overflow-slot` 자리가 있고 그쪽이 넘치지 않으면 `invisible` ④ 표시의 간격 상쇄 클래스(왼쪽 `-mr-1`, 오른쪽 `-ml-1`)와 `bleed` 쪽 여백 클래스(`max-md:-ml-4`/`max-md:-mr-4`) ⑤ 모든 스크롤 줄에 `scroll-px-6`, `data-selected-selector` 가 `selectedSelector` 값(기본값 포함) ⑥ 768 이상은 표시 없이 버튼만 (회귀 방지, 실패 예상 아님). 예상 실패: ①②③④⑤ 는 지금 구조(오른쪽 표시만, 자리 없음, 속성 없음)에서 실패.
  - 실패 출력 요약을 task '후속 3' 절에 붙이고 `ChipGroup.test.tsx` 만 경로 지정 커밋한 뒤 구현한다.
- 끝 기준: `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx src/tests/ui/Tabs.test.tsx src/tests/chat src/tests/AskAiPanel.test.tsx src/tests/modals src/tests/feed` 통과. 단 `feed/FeedToolbar.test.tsx:142` 의 실패 1건은 34 E 후속 몫이라 예외로 task 에 적는다 (다른 `feed` 실패는 예외가 아니다). 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0, `grep -nE "scroll-p[lx]-4" frontend/src/components/ui/ScrollRow.tsx` 출력 없음.

**34 E 후속** — 31 B 후속 3 뒤 (30 A 후속 2 와 병렬 가능). spec 14.13 표 `FeedToolbar.test.tsx:142`, 새 단언(360 목). R15. 파일: `tests/feed/FeedToolbar.test.tsx`(표의 1곳 변경 + 새 단언), 필요할 때만 `components/feed/FeedToolbar.tsx`.
- 할 일:
  - `:142` 를 `toHaveClass('max-md:-ml-4', 'max-md:pl-4', 'scroll-px-6')` 로 바꾼다. `:143-144` 는 그대로.
  - 새 단언 (이 파일의 360 블록과 같은 목 방식, 새 `it`): 360 에서 소스 줄이 `both`(넘침 목 + `scrollLeft` 중간)일 때 소스 줄 감싸개(`[data-toolbar-row]` 안) `data-overflow-hint="start"` 가 `소스` 그룹 앞에 있고 그룹 밖·`aria-hidden`, `data-overflow-hint="end"` 는 그룹 뒤·정렬 선택창 앞.
  - `FeedToolbar.tsx` 는 `bleed="start"`·`selectedSelector` 그대로라 바꾸지 않을 것으로 본다 (spec 14.13). 새 단언이 `FeedToolbar.tsx` 때문에 실패할 때만 고치고 이유를 task 에 적는다. 정적 확인(`rg -n 'useMediaQuery|\border-|-reverse' …` 출력 없음)은 계속 지킨다.
- 테스트 순서: 단언을 바꾸기 전에 `pnpm exec vitest run src/tests/feed/FeedToolbar.test.tsx` 로 `:142` 가 31 후속 3 의 클래스 변경 때문에 실패하는 출력(기대 `max-md:scroll-pl-4`, 실제 클래스 목록)을 task 에 붙인다 — 요구 변경 때문에 단언이 바뀐다는 증거다. 새 단언은 31 후속 3 의 구현에 기대므로 쓰자마자 통과할 수 있다 (실패 예상 아님, 회귀 방지).
- 끝 기준: `pnpm exec vitest run src/tests/feed src/tests/ui/ChipGroup.test.tsx src/tests/hooks/useNewsFeed.test.tsx src/tests/HotkeyGating.test.tsx src/tests/chat/HandoverIntegration.test.tsx` 통과 (예외 없음), `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx` 출력 없음, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.

**30 A 후속 2** — 웨이브 9a (31 B 후속 3 과 병렬). spec 14.8 `scrollRow` '(보정 3)'·fixture 표 '(보정 3)' 3행·'360·390 `/` 처음 상태 소스 줄 증거'. R15·R29·R30 ①. 파일: `frontend/scripts/ui-audit.mjs`, `frontend/scripts/ui-audit-fixtures/defects.html`, `frontend/scripts/ui-audit-fixtures/clean.html`.
- 할 일:
  - fixture (spec 14.8 표 그대로): `defects.html` 에 ① 왼쪽 표시 없는 줄(`data-overflow="both"`, `scrollLeft` 중간, 오른쪽 표시만 — 3차 구조) ② 줄을 덮는 표시(표시를 `absolute` 로 줄 오른쪽 끝 위에 겹침) ③ 흐림에 겹친 선택 칩(`scroll-padding-left:16px`, 흐림 24px, 선택 칩이 칩 왼쪽 − 16 에 선 줄, `data-selected-selector` 있음). `data-expect` 는 ① `scrollRow`, ② `scrollRow occluded`, ③ `scrollRow`. `clean.html` 에 고친 형태(① 양쪽 표시·표시 쪽 `bleed` 없음, ② 표시가 줄 뒤 형제, ③ `scroll-padding: 0 24px`·칩 왼쪽 − 24). 새 판정 '`scroll-padding` 24px' 때문에 기존 `clean.html` 스크롤 줄에 `scroll-padding: 0 24px` 를 더하는 것은 허용한다 (다른 속성·요소는 바꾸지 않는다). 기존 `defects.html` 결함은 그대로 자기 검사에서 실패해야 한다.
  - `--self-test` 가 fixture 를 지금 폭과 360 폭 둘 다로 연다 (768 미만 판정은 360 에서만 돈다). 1440 에서 `소스` 이름이 R14 와 엉키지 않게 새 fixture 줄 이름은 후속 1 처럼 `소스` 를 피한다.
  - `scrollRow` 판정 (14.8 '(보정 3)'): 768 미만에서 넘친 쪽마다 같은 감싸개 안에 그쪽 표시가 보임(`[data-overflow-hint="start"]` 는 줄 왼쪽 끝보다 왼쪽, `"end"` 는 오른쪽 끝보다 오른쪽), 넘치지 않은 쪽에 표시 없음(`data-overflow-slot` 은 표시가 아니다), 표시 rect 가 줄 rect 와 1px 넘게 겹치지 않음. 모든 폭: 처음 상태에서 선택 칩이 줄 보이는 상자에서 넘친 쪽 흐림 24px 를 뺀 범위 안 (1px 허용). 선택 칩은 줄의 `data-selected-selector` 로 찾고, 속성이 없으면(1ec8a9b 기준선) 후속 1 의 `selectedSelectorOf` 대체 순서를 쓴다. 줄의 계산된 `scroll-padding-left`·`scroll-padding-right` 가 24px 가 아니면 실패. 흐림 폭 24px 는 스크립트 상단 상수로 둔다 (`ScrollRow` 의 값과 같음). 기존 허용치 상수는 바꾸지 않는다.
  - 증거: 360·390 `/` 처음 상태 조합의 `checks.scrollRow` 에 소스 줄 항목 `{ mustReadHidden, startHint }` 를 남긴다 (`mustReadHidden` = `Must-Read` 칩 rect 가 줄 보이는 상자 왼쪽 밖, `startHint` = `[data-overflow-hint="start"]` 가 보임). `mustReadHidden && !startHint` 면 실패.
- 먼저 실패하는 테스트: fixture 만 더하고 스크립트를 고치기 전 `--self-test` → 종료 1. 예상 실패 이유: ①③ 이 `scrollRow` 실패를 내지 않는다 (768 미만 표시 쪽 판정 없음, 360 폭으로 열지 않음, 선택 칩을 흐림을 빼지 않은 패딩 상자로만 봄, `scroll-padding` 을 보지 않음). ② 의 `occluded` 는 지금도 잡을 수 있으나(실패 예상 아님) `scrollRow` 쪽은 못 잡는다. `clean.html` 은 통과해야 한다. 실패 줄을 task 에 붙이고 fixture 두 파일만 경로 지정 커밋 (`test(ui-redesign): 30 후속 2 실패 fixture — scrollRow 보정 3`).
- 끝 기준: `cd frontend && pnpm exec eslint scripts/ui-audit.mjs` 오류 0, `--self-test` 종료 0 (새 `data-expect` 3개 모두 해당 검사 실패, `clean.html` 두 폭 모두 실패 0, `dev-indicator.html` 환경 오류), `--help` 에 360 self-test 설명. 프로덕션 측정은 36 재측정 4 가 한다 (이 단계에서 31 후속 3 전 코드를 재면 보정 3 판정으로 실패가 나는 것이 정상이라 하지 않는다).

**36 A 재측정 4** — G11 뒤 단독. 36 의 할 일 1~7 과 끝 기준 그대로 하되:
- 3(1ec8a9b 기준선)을 반드시 다시 한다 (`frontend/scripts` 가 바뀜). F1~F4 가 그대로 잡히는지, 보정 3 판정으로 늘어난 기준선 실패를 검사별 건수로 적는다 (기준선에는 `data-selected-selector`·24px 스냅 여백이 없으므로 늘어나는 것이 정상).
- HEAD 프로덕션 결과에서 360·390 `/` 처음 상태 조합(`feed-{light,dark}-{360x780,390x844}`)의 소스 줄 `{ mustReadHidden, startHint }` 값을 task 에 인용한다. `mustReadHidden` 이 true 면 `startHint` 가 true 여야 한다.
- 육안 확인 (360·390 라이트 스크린샷, 처음 상태와 소스 줄을 손으로 끝까지 민 상태 — scratchpad `--screenshots all` 또는 3배 확대): 왼쪽 `‹` 가 `Must-Read` 가 숨었을 때 보이고 칩을 덮지 않음, 선택 칩이 왼쪽 흐림 밖에 다 보임, 표시가 나타나고 사라질 때 칩이 옆으로 움직이지 않음, 카테고리 줄·연동 설정 탭 줄·Ask AI 빠른 질문 줄·챗 맥락 줄의 표시. 본 것과 경로를 '재측정 4' 절에 적는다.
- 새 실패는 리뷰 후속 공통 규칙대로 나눈다 (`ScrollRow` 는 31 B, 판정은 30 A, 목록 밖이면 `blocked` + plan 재승인).
- 끝 기준 더함: `report.json` 의 360·390 `/` 처음 상태 조합에 `mustReadHidden`·`startHint` 항목이 있음, `baseline-1ec8a9b/report.json` 의 `environment.commit` 이 `1ec8a9b` 이고 F1~F4 실패가 있음, `make check` 출력과 `config.json`·`sources.json`·`backend/app/config/sources.json` 되돌림 기록.

**37 후속** (메인 세션, G12 뒤) — spec 14.13 '단계' 의 문서와, 보정 3 으로 어긋나는 기존 서술. 모두 '변경 파일' 리뷰 후속 문서 목록 안이다.
- `docs/design-system.md`: 5.1 `ChipGroup`·`ScrollRow` 행(`:226` 부근: 768 미만 넘친 쪽마다 표시, `data-overflow-slot`, 표시 쪽 `bleed` 규칙, `scroll-px-6` = 흐림 = 선택 칩 보이기 여백 24px, `data-selected-selector`), 측정 훅 표(`:489` 의 `data-overflow-hint` 행에 `start`/`end` 값, 새 `data-overflow-slot`·`data-selected-selector` 행), 9 검사 방법(`scrollRow` 보정 3 판정, 360 self-test, `mustReadHidden`·`startHint`).
- `docs/ui-spec.md`: 768 미만 스크롤 줄 표시 서술(`:86-87`, `:159` 의 '오른쪽으로 넘치면 줄 끝 ›' → 넘친 쪽마다 `‹`·`›`).
- `docs/functional-spec/01-news-feed.md`: '가로 스크롤' 항목(`:72`)의 768 미만 표시. 360·390 처음 상태에서 `Must-Read` 가 왼쪽 밖일 수 있고 `‹` 가 단서라는 점 (우려 23).
- `docs/functional-spec/07-ui-common.md`: 칩 줄 표(`:253`)·가로 스크롤 줄 행(`:373`)의 768 미만 표시.
- `docs/test-cases.md`: 바뀐 5곳(`:843`, `:848` 부근 행 포함)과 새 단언, 테스트 수. `docs/test-strategy.md`: `--self-test` 360 폭, `scrollRow` 보정 3 판정.
- `docs/known-issues.md`: 'UI·접근성' 에 1행 — 360·390 첫 화면에서 피드 소스 줄 `Must-Read` 가 줄 왼쪽 밖에 있어 보이지 않고 `‹` 표시로 단서만 준다 (spec 우려 23 의 남은 제한, 관련 문서·코드 위치). 다른 행은 바꾸지 않는다. (사후 보정: a9ea174 에서 이미 더함)
- 끝 기준: `grep -nE "오른쪽으로 넘치면 줄 끝|넘치면 줄 끝 ›|scroll-px-4|scroll-pl-4" docs/design-system.md docs/ui-spec.md docs/functional-spec/01-news-feed.md docs/functional-spec/07-ui-common.md docs/test-cases.md` 출력 없음 (작성 때 7줄: `design-system.md:226`, `ui-spec.md:86,159`, `01-news-feed.md:72`, `07-ui-common.md:253`, `test-cases.md:635,843`). `sed -n '/^## UI·접근성/,/^## 테스트·운영/p' docs/known-issues.md | grep -c 'Must-Read\` 칩이 줄 왼쪽 밖'` 이 1 (그 행이 'UI·접근성' 절에 정확히 하나), `git diff a9ea174~1 a9ea174 -- docs/known-issues.md` 의 바뀐 줄이 그 행 추가 1줄뿐. 찾은 줄과 고친 내용을 `37-docs-3.md` 에 적는다.

#### 보정 5 (spec 14.14, R34·R15·R33 — Must-Read 고정 토글, 사용자 스크롤 = 입력 신호 뒤 `scroll`)
근거: ① 제품 오너 결정(2026-11-07) — 우려 23 의 대안 ①, `Must-Read` 를 소스 스크롤 줄 밖, 정렬 옆 고정 토글로 (R34). ② reviewer 재리뷰 Nit 2 — 보정 4 의 '사용자 스크롤'(부품이 둔 값과 1px 넘게 다른 `scroll`)이 브라우저의 범위 자르기·스냅 재맞춤도 사용자 스크롤로 보아 선택 칩 다시 보이기가 멈춘다 (31 후속 4 가 이 때문에 `ChipGroup.test.tsx:619` 와 충돌해 blocked, `0330596`). ③ reviewer 재리뷰 Nit 1 — `clip` ① 스크롤바 면제는 30 후속 3(`3a393df` → `345112d`)으로 이미 고쳤다 (위 30 의 '후속 3' 줄). spec 14.2·14.3 '(보정 5)', 14.8 'Must-Read 증거'·fixture '(보정 5)' 행, 14.10 보정 5, 14.14 가 기준이다.

- **규칙**: 리뷰 후속 공통 규칙 그대로. 바꿀 수 있는 기존 단언은 '증명' 의 '리뷰 후속에서 바꾸는 기존 단언' 표의 보정 5 다섯 줄(spec 14.14 표, 우려 25)뿐이다. 실패 테스트 커밋 메시지: `test(ui-redesign): 34 후속 3 실패 테스트 — <요지>`, `test(ui-redesign): 31 후속 4 실패 테스트 — <요지>`, `test(ui-redesign): 30 후속 4 실패 fixture — <요지>`. 담당은 같은 agent ID 로 SendMessage (E `a2cd41bc978ebd13f`, B `a49602194c070f0b6`, A `aa16eed435b46be0f`). 기록은 기존 task 파일의 새 절 (31 은 blocked 였던 '후속 4' 절을 이어 쓰고 task `Status:` 를 진행 상태로 되돌린다).
- **표 밖 단언이 깨지면 멈춘다 (우려 26)**: 31 후속 4 구현 뒤 표 밖 기존 단언이 깨지면 — 특히 `ChipGroup.test.tsx` 에서 입력 신호 없이 `setScrollLeft` 로 넘침 상태를 만드는 12곳(`:150, :153, :180, :186, :212, :366, :404, :473, :484, :506, :745, :787`, spec 14.14) — 단언·도우미를 고치지 않고 그 단계를 `blocked` 로 두고 깨진 테스트 이름·실패 출력·원인(다시 보이기가 `scrollLeft` 를 조정함 등)을 task 에 적어 메인 세션에 보고한다. spec 보정이 필요한지는 메인 세션이 정한다. 34 후속 3 의 `FeedToolbar.test.tsx` 표 밖 단언(:139-151, :203-217, :219-263, :365-381, :383-402, :404-411, :413-424)도 같은 규칙이다.
- **순서**
  ```
  34 E 후속 3 ─┐
  31 B 후속 4 ─┼─ G13 ─ 36 A 재측정 5 ─ G14 ─ 37 main 후속 2
  30 A 후속 4 ─┘
  ```
  - 웨이브 10a = {34 후속 3, 31 후속 4, 30 후속 4} 동시. 파일이 겹치지 않는다 (`FeedToolbar.tsx`·`FeedToolbar.test.tsx` / `ScrollRow.tsx`·`ChipGroup.test.tsx` / `frontend/scripts/**`). 30 후속 4 의 fixture 는 정적 HTML 이라 앱 단계를 기다리지 않는다.
  - 병렬 단계 끝 검사는 담당 범위만 본다 (2차 규칙). 다른 단계 파일의 실패(예: 31 후속 4 진행 중 `tests/feed` 실패)는 task 에 적기만 하고, 자기 변경이 원인으로 보이면 메인 세션에 알린다 (남의 파일을 고치지 않는다).
  - 36 재측정 5 는 G13 뒤 단독 (앱·판정이 모두 들어간 커밋을 잰다). 37 후속 2 는 G14 뒤.
- **관문 G13** (34 후속 3·31 후속 4·30 후속 4 done 뒤, 메인 세션): `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공, `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0, `git log --oneline e274563..` 에서 세 단계의 실패 테스트(fixture) 커밋이 각 구현보다 먼저 있음, '증명' 보정 5 의 기존 단언 확인(바뀐 줄이 표의 다섯 곳과 import 줄뿐), `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx` 출력 없음, R32 diff 0줄. 웨이브 커밋.
- **관문 G14** (36 재측정 5 done 뒤, 메인 세션): G13 과 같은 검사 + '36 A 재측정 5' 끝 기준. 커밋. 그 뒤 37 후속 2.

**34 E 후속 3** — 웨이브 10a. spec 14.2 '(보정 5, R34)'·표·폭 계산, 14.14 표·새 단언. R34·R33·R6. 파일: `components/feed/FeedToolbar.tsx`, `tests/feed/FeedToolbar.test.tsx`(표의 4곳 변경 + 새 단언).
- 할 일 (`FeedToolbar.tsx`, spec 14.2 보정 5):
  - `Must-Read` `Chip`(`tone="warning"`, 별 아이콘, `title` 지금 문구, `onClick` 은 지금처럼 `onHighSignalChange(!highSignalOnly)` + `onPageChange(1)`)을 소스 `ChipGroup` 밖, 줄 B 의 소스 그룹과 정렬 선택창 사이 형제로 옮긴다. 속성 `data-must-read-toggle`, `className="shrink-0 max-md:w-11 max-md:justify-center max-md:px-0"`, 글자는 `<span className="max-md:sr-only">Must-Read</span>`. 접근 이름은 모든 폭에서 `Must-Read`, 폭이 바뀌어도 같은 노드 (R33).
  - 소스 그룹 안 구분선(`aria-hidden` `w-px`)을 지운다. 소스 그룹에는 `전체`·소스·`북마크`(`data-source-chip`)만 남는다. `selectedSelector`·`bleed="start"`·`data-source-chip` 은 그대로.
  - DOM·Tab 순서 `카테고리 → 검색 → 소스 줄 → Must-Read → 정렬`. `order`·`*-reverse` 를 쓰지 않는다. 파일 머리 JSDoc 표·주석을 14.2 보정 5 표대로 고친다 (주석에도 `useMediaQuery`·`-reverse`·`order-` 글자 금지).
  - `Chip.tsx`·`page.tsx`·props 는 바꾸지 않는다.
- 먼저 실패하는 테스트 (`FeedToolbar.test.tsx`):
  - 표의 4곳: `:50` 제목, `:52-55`(`getByRole('button', { name: 'Must-Read' })` 가 `aria-pressed="false"`, `within(group).queryByRole('button', { name: 'Must-Read' })` 가 null, 소스 그룹과 같은 `data-toolbar-row` 에서 소스 그룹 뒤·정렬 앞), `:57`(소스 칩 글자 `['전체7', 'GitHub5', 'arXiv2', '북마크2']`), `:59`(토글 클릭). `:60-61` 콜백 단언은 그대로.
  - 새 `it` (기존 `:404-411` 은 그대로): 360·1024·1440 에서 DOM 순서 `소스` 그룹 → Must-Read → 정렬. Must-Read 에 `data-must-read-toggle`, `shrink-0`·`max-md:w-11` 클래스, 글자 감싸개 `max-md:sr-only`, 폭 목 360·1440 에서 접근 이름 `Must-Read` 이고 같은 노드. 소스 그룹 안에 구분선(`aria-hidden` 이고 `w-px`)이 없음. `highSignalOnly: true` 면 `aria-pressed="true"`.
  - 예상 실패: Must-Read 가 소스 그룹 첫 칩이라 그룹 안에서 찾히고 칩 글자에 `Must-Read` 가 들어감, `data-must-read-toggle`·`max-md:sr-only` 없음, 구분선 있음, DOM 순서 Must-Read 가 소스 그룹보다 앞(그룹 안).
  - 실패 출력 요약을 task '후속 3' 에 붙이고 `FeedToolbar.test.tsx` 만 경로 지정 커밋한 뒤 구현한다.
- 끝 기준: `pnpm exec vitest run src/tests/feed src/tests/ui/ChipGroup.test.tsx src/tests/hooks/useNewsFeed.test.tsx src/tests/HotkeyGating.test.tsx src/tests/chat/HandoverIntegration.test.tsx` 통과 (`ChipGroup.test.tsx` 실패는 31 후속 4 진행 중이면 적기만), `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx` 출력 없음, `grep -n "w-px" frontend/src/components/feed/FeedToolbar.tsx` 출력 없음, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.

**31 B 후속 4** — 웨이브 10a. spec 14.3 '(보정 5) 사용자 스크롤 정의' 1~5, 14.14 표·새 단언, 우려 26. R15·R33. 파일: `components/ui/ScrollRow.tsx`, `tests/ui/ChipGroup.test.tsx`(표의 1곳 변경 + 새 단언). 기록은 `31-scroll-focus.md` 의 '후속 4' 절을 이어서 (blocked 를 풀었다는 것과 이 plan 보정을 적는다).
- 할 일 (`ScrollRow.tsx`, 보정 4 의 '부품이 둔 값과 다른 `scroll` = 사용자' 판정(`:225-228`, `:239-242`)을 바꾼다):
  - 입력 신호: 바깥 감싸개(스크롤 줄·스크롤 버튼·넘침 표시를 담은 요소)에서 받은 `pointerdown`, `wheel`, `touchstart`, `keydown`, 스크롤 버튼 클릭, 줄 안으로의 사용자 포커스 이동(`focusin` 과 그 뒤 `scrollIntoView`). 단 이 부품의 '스크롤 버튼 포커스 유지' 가 옮긴 포커스의 `focusin` 은 입력 신호가 아니다.
  - 입력 신호를 받으면 '사용자 조작 중' (ref). 이 동안 온 `scroll` 은 사용자 스크롤이고 줄을 '사용자가 스크롤함' 으로 표시 (다음 새 선택 칩까지). '사용자 조작 중' 은 `scrollend` 에서 끝나고, `scrollend` 가 없으면 마지막 `scroll` 뒤 150ms, 입력 뒤 1,000ms 안에 `scroll` 이 없으면 끝난다. 시간 값은 파일 상단 상수 (근거 없는 가정, spec E34·우려 26).
  - 입력 신호 없이 온 `scroll`(브라우저 자르기·스냅 재맞춤, 다른 코드의 `scrollLeft` 변경)과 이 부품이 `revealInRow` 로 둔 값의 `scroll`(1px 이내)은 사용자 스크롤이 아니다.
  - 판정은 ref 로만 한다 (상태 갱신 없음, `react-hooks/set-state-in-effect`). 리스너·타이머는 언마운트 때 정리한다. 포커스 유지·표시·버튼·스냅 위치 고르기·`data-selected-selector` 는 그대로. JSDoc 갱신.
- 먼저 실패하는 테스트 (`ChipGroup.test.tsx`):
  - 표의 1곳: `:619` 앞에 `fireEvent.wheel(group)` 을 넣는다 (`setScrollLeft(group, 10)` 과 `:622`·`:624-625` 는 그대로). 지금 구현에서도 통과한다 (실패 예상 아님, 요구 변경으로 바뀌는 단언).
  - 새 단언 (spec 14.14): ① 입력 없이 `setScrollLeft`(브라우저 자르기 흉내) 뒤 줄 폭이 바뀌면(`triggerResize`) 선택 칩이 다시 흐림 밖에 보임 — 예상 실패: 지금 구현이 그 `scroll` 을 사용자 스크롤로 보아 다시 보이기를 멈춤. ② `pointerdown`·`touchstart`·`keydown`·스크롤 버튼 클릭 각각 뒤 `scroll` 이면 폭이 바뀌어도 `scrollLeft` 유지 — 지금도 통과 (실패 예상 아님). ③ 입력 신호 뒤 1,000ms 안에 `scroll` 이 없으면(가짜 타이머) 다음 입력 없는 `scroll` 은 사용자 스크롤이 아님 — 예상 실패: 지금 구현은 모든 다른 값 `scroll` 을 사용자로 봄. ④ 포커스 유지로 옮긴 포커스(`focusin`)는 입력 신호가 아님 — 예상 실패 여부는 구현 전 실행으로 확인해 task 에 적는다.
  - 실패 출력 요약을 task '후속 4' 에 붙이고 `ChipGroup.test.tsx` 만 경로 지정 커밋한 뒤 구현한다.
- 끝 기준: `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx src/tests/ui/Tabs.test.tsx src/tests/chat src/tests/AskAiPanel.test.tsx src/tests/modals src/tests/feed` 통과 (`FeedToolbar.test.tsx` 실패는 34 후속 3 진행 중이면 적기만. 그 밖의 실패, 특히 표 밖 `setScrollLeft` 12곳은 위 '표 밖 단언이 깨지면 멈춘다' 규칙), 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0. Chrome 확인(31 후속 2 와 같은 방식, task 에 기록): 360·390 처음 상태 유지, 휠·터치 에뮬레이션으로 민 뒤 폭을 바꿔도 끌어오지 않음, 입력 없이 폭만 바꾸면 선택 칩 다시 보임.

**30 A 후속 4** — 웨이브 10a. spec 14.8 '(보정 3, 보정 5 로 바꿈) `/` 처음 상태 Must-Read 증거'·fixture 표 '(보정 5) 숨은 Must-Read' 행. R34·R6·R30 ①. 파일: `frontend/scripts/ui-audit.mjs`, `frontend/scripts/ui-audit-fixtures/defects.html`, `frontend/scripts/ui-audit-fixtures/clean.html`.
- 할 일:
  - 보정 3 의 소스 줄 증거 `{ mustReadHidden, startHint }`(`ui-audit.mjs:1004-1011` 부근)를 지우고, `[data-feed-toolbar]` 가 있는 페이지(`/` 와 fixture)의 처음 상태마다 `checks.scrollRow.toolbar = { viewport, mustReadVisible, mustReadRect }` 를 남긴다. `mustReadVisible` = `[data-must-read-toggle]` 가 정확히 하나, `[role="group"][aria-label="소스"]` 안이 아님, rect 가 화면(`0 ≤ left`, `right ≤ innerWidth`)과 `[data-feed-toolbar]` 상자 안에 1px 허용으로 다 듦, 가운데 점 `elementFromPoint` 가 토글이나 자손. false 면 실패 '`Must-Read` 토글이 첫 화면에 다 보이지 않음'. 768 미만에서는 토글 rect 가 44×44 이상인지도 본다 (R6). 기준값 상수 불변.
  - fixture: `defects.html` 에 '숨은 Must-Read' — `[data-feed-toolbar]` 안 소스 줄(`role="group" aria-label="소스"`) 첫 칩으로 `data-must-read-toggle` 버튼을 두고 줄을 `scrollLeft` 138 로 민 구조 (보정 3 구조), `data-expect="scrollRow"` 는 툴바에. 다른 `scrollRow` 조건(넘친 쪽 표시 등)은 통과하게 맞춰 이 판정만 실패하게 한다. `clean.html` 에 같은 툴바에서 토글이 소스 줄 밖, 줄과 정렬 선택창 사이 형제인 구조. self-test 는 두 폭(지금 폭, 360) 모두에서 이 fixture 를 본다. 1440 R14 와 엉키지 않게 fixture 툴바 크기를 맞춘다 (`소스` 이름이 필요하므로, 넘치지 않는 폭으로).
  - 보정 3 의 `mustReadHidden` 증거만 증명하던 fixture 가 있으면 지우지 말고 위 '숨은 Must-Read' 로 바꾼다. 다른 fixture 는 바꾸지 않는다.
- 먼저 실패하는 테스트: fixture 만 더하고 스크립트를 고치기 전 `--self-test` → 종료 1. 예상 실패 이유: `mustReadVisible` 판정이 없어 '숨은 Must-Read' 툴바가 `scrollRow` 실패를 내지 않음 (fixture 에 왼쪽 표시를 두어 옛 `mustReadHidden && !startHint` 판정도 통과하게 한다). `clean.html` 은 통과. 실패 줄을 task '후속 4' 에 붙이고 fixture 두 파일만 경로 지정 커밋한 뒤 스크립트를 고친다.
- 끝 기준: `cd frontend && pnpm exec eslint scripts/ui-audit.mjs` 오류 0, `--self-test` 종료 0 (새 `data-expect` 가 두 폭에서 `scrollRow` 실패, `clean.html` 두 폭 실패 0, 30 후속 3 의 360 `clip` fixture 계속 실패, `dev-indicator.html` 환경 오류), `grep -nE "mustReadHidden|startHint" frontend/scripts/ui-audit.mjs` 출력 없음. 프로덕션 측정은 36 재측정 5.

**36 A 재측정 5** — G13 뒤 단독. 36 의 할 일 1~7 과 끝 기준, 재측정 4 의 더한 끝 기준을 그대로 하되 (`mustReadHidden`·`startHint` 대신 아래):
- 1ec8a9b 기준선을 다시 잰다 (`frontend/scripts` 가 30 후속 3·4 로 바뀜). F1~F4 가 그대로 잡히는지, `clip` ① 면제 변경과 `mustReadVisible` 판정으로 늘어난 기준선 실패를 검사별 건수로 적는다 (기준선에는 `data-must-read-toggle` 이 없어 `mustReadVisible` 실패가 정상).
- HEAD 프로덕션: 5개 폭 × 2테마 `/` 처음 상태 10조합 모두 `checks.scrollRow.toolbar.mustReadVisible: true` 와 `mustReadRect` 를 task 에 인용 (R34), 360·390 에서 토글 rect ≥ 44×44 (R6). 30 후속 3 의 `clip` ① 변경(768 미만 스크롤바 면제 없음)으로 새 `clip` 실패가 나면 리뷰 후속 공통 규칙대로 나눈다 (목록 밖 파일이면 `blocked` + plan 재승인).
- 육안 확인 (360·390 라이트 스크린샷과 1024·1440, 처음 상태): Must-Read 토글이 소스 줄과 정렬 사이에 다 보임(768 미만은 별 아이콘만), 소스 줄 첫 칩이 `전체` 이고 처음 상태에서 줄이 밀리지 않음(spec 14.2 폭 계산: 360·390 `scrollLeft` 0 기대, 다르면 값 기록), 768 미만 오른쪽 `›` 표시가 소스 줄과 토글 사이. 본 것과 경로를 '재측정 5' 절에 적는다.
- 끝 기준 더함: `report.json` 의 `/` 처음 상태 10조합에 `checks.scrollRow.toolbar` 가 있고 모두 `mustReadVisible: true`, `grep -c "mustReadHidden" docs/features/ui-redesign/audit/report.json` 이 0, `baseline-1ec8a9b/report.json` 의 `environment.commit` `1ec8a9b`·F1~F4 실패, PNG 24장, `make check` 출력과 루트 `config.json`·`sources.json`·`backend/app/config/sources.json` 되돌림 기록.

**37 후속 2** (메인 세션, G14 뒤) — spec 14.10 '(보정 5)' 와 보정 5 로 어긋나는 기존 서술. 모두 '변경 파일' 리뷰 후속 문서 목록 안이다. 기록은 `37-docs-3.md` 의 새 절 '후속 2'.
- `docs/known-issues.md`: 'UI·접근성' 의 '360·390px 폭 첫 화면에서 피드 소스 줄의 `Must-Read` 칩이 줄 왼쪽 밖…' 행(`:60`)을 지운다 (R34 로 해소). 다른 행은 그대로.
- `docs/ui-spec.md`: 피드 툴바 와이어프레임·표(`:44`, `:71`, `:88`, `:102`)의 줄 B 를 `[소스 줄] [☆ Must-Read 토글] [정렬]`, 768 미만 별 아이콘 토글로.
- `docs/functional-spec/01-news-feed.md`: NEWS-04 진입점(`:14`, `:92`)을 정렬 옆 고정 토글로, 소스 줄 순서(`:78`)에서 `Must-Read`·구분선 삭제, 360·390 미노출 서술(`:100`, `:353`) 삭제.
- `docs/functional-spec/07-ui-common.md`: 360·390 Must-Read 미노출 서술(`:278`) 삭제, 가로 스크롤 줄의 '사용자 스크롤' 정의가 적힌 곳이 있으면 입력 신호 뒤 `scroll` 로.
- `docs/design-system.md`: `ScrollRow` 행의 '사용자 스크롤' 정의(입력 신호 뒤 `scroll`, 시간 값), 9 검사 방법(`:476`)·측정 훅 표(`:489`)의 `sourceRow.startHint` 를 `toolbar.mustReadVisible` 로, 새 측정 훅 `data-must-read-toggle` 행, 알려진 제한 표(`:562`)의 '좁은 폭 소스 줄의 `Must-Read`' 행 삭제, fixture 표에 '숨은 Must-Read'·30 후속 3 의 360 `clip` 행.
- `docs/test-cases.md`: spec 14.14 의 바뀐 5곳과 새 단언, 파일·테스트 수. `docs/test-strategy.md`: `scrollRow` 행(`:35`)의 Must-Read 증거, `clip` ① 스크롤바 면제 768 이상(30 후속 3), self-test 360 `clip`.
- 끝 기준: `grep -rnE "mustReadHidden|startHint|줄 왼쪽 밖|왼쪽 밖에 있|소스 칩 줄 첫 칩|첫 칩 \`Must-Read\`|\[☆ Must-Read\] │|Must-Read\`\(NEWS-04\), 구분선" docs/design-system.md docs/ui-spec.md docs/functional-spec/01-news-feed.md docs/functional-spec/07-ui-common.md docs/test-strategy.md docs/test-cases.md docs/known-issues.md` 출력 없음 (작성 때 14줄: `ui-spec.md:44,71,88`, `design-system.md:476,489,562`, `01-news-feed.md:14,78,92,100,353`, `07-ui-common.md:278`, `test-strategy.md:35`, `known-issues.md:60`). `sed -n '/^## UI·접근성/,/^## 테스트·운영/p' docs/known-issues.md | grep -c 'Must-Read'` 가 0. 찾은 줄과 고친 내용을 `37-docs-3.md` '후속 2' 에 적는다.

#### 보정 6 (spec 보정 6, reviewer 최종 확인 Nit 1·2 — 가로 의도 휠만 입력 신호)
근거: ① Nit 2 — 보정 5 구현(`ScrollRow.tsx:52` `USER_INPUT_EVENTS`)은 방향과 상관없이 `wheel` 을 입력 신호로 센다. md 이상 sticky 툴바 위에서 페이지를 세로로 휠 스크롤하면 '사용자 조작 중' 이 되어, 그 사이 브라우저 자르기·스냅 재맞춤 `scroll` 이 사용자 스크롤로 기록되고 선택 칩 다시 보이기가 멈춘다. spec 14.3 보정 5-1 이 `wheel` 을 `Math.abs(deltaX) > Math.abs(deltaY) || shiftKey` 일 때만 신호로 정했다. ② Nit 1 — spec 14.8 `clip` ① 칸이 '스크롤바가 보이는 가로 스크롤 영역' 면제를 모든 폭으로 적고 있었는데 구현(`ui-audit.mjs:795-797` `hExempt`, 30 후속 3)은 768 이상에서만 준다. spec 문구를 구현에 맞췄다. **코드 변경 없음**: 30 단계는 이 보정에서 하지 않는다 (`ui-audit.mjs`·fixture 불변). ③ reviewer 최종 Nit 3(30 후속 3 이 plan 에 오르기 전에 구현됨)은 `docs/features/ui-redesign/verify.md` 의 편차 C 로 이미 기록됐다 (plan 보정 5 Revision 에도 사후 기록). spec 14.3 보정 5-1, 14.14 새 단언 ⑤⑥·'(보정 6) 바뀌는 기존 단언' 표·측정, 우려 25 가 기준이다.

- **규칙**: 리뷰 후속 공통 규칙과 보정 5 규칙 그대로. 바꿀 수 있는 기존 줄은 '증명' 표의 보정 6 두 줄(`ChipGroup.test.tsx:619`·`:950`, 단언 값 불변)뿐이다. 표 밖 단언이 깨지면 고치지 않고 `blocked` 로 두고 보고한다 (우려 26 과 같은 규칙). 실패 테스트 커밋 메시지: `test(ui-redesign): 31 후속 5 실패 테스트 — <요지>`. 담당은 B `a49602194c070f0b6` 에 SendMessage, 기록은 `31-scroll-focus.md` 의 새 절 '후속 5'.
- **순서**
  ```
  31 B 후속 5 ─ G15 ─ 36 A 재측정 6 (권장) ─ G16 ─ 37 main 후속 3
  ```
  - 31 후속 5 는 단독 (이 보정에서 바뀌는 앱·테스트 파일이 `ScrollRow.tsx`·`ChipGroup.test.tsx` 둘뿐이다).
  - **측정 판단**: `frontend/scripts` 는 바뀌지 않고(36 재측정 5 커밋 `3cedad0` 이후 `git diff --stat 3cedad0 HEAD -- frontend/scripts` 출력 없음, 작성 때 확인) 1ec8a9b 앱도 그대로라 기준선 재측정은 하지 않는다 (재측정 3 과 같은 판단). ui-audit 은 처음 상태와 정해진 조작만 재고 `wheel` 을 보내지 않으므로 이 변경은 판정 결과를 바꾸지 않을 것으로 본다. 그러나 앱 동작(`ScrollRow` 리스너)이 바뀌므로 HEAD 전체 측정 1회(36 재측정 6)를 권장한다. Chrome·backend·데이터가 없으면 `blocked` 로 두지 않고, G15 의 frontend 세 명령·`make build`·`--self-test` 와 31 후속 5 의 Chrome 확인으로 대신하며 그 사실을 `36-prod-audit-3.md` '재측정 6' 과 verify.md 에 적는다 (통과로 보고하지 않고 '미측정, 대체 증거' 로).
- **관문 G15** (31 후속 5 done 뒤, 메인 세션): `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공, `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0, `git log --oneline db97826..` 에서 31 후속 5 실패 테스트 커밋이 구현보다 먼저 있음, '증명' 보정 6 의 기존 줄 확인, R32 diff 0줄. 커밋.
- **관문 G16** (36 재측정 6 done 뒤, 또는 측정 환경이 없어 대체 증거를 적은 뒤, 메인 세션): G15 와 같은 검사 + '36 A 재측정 6' 끝 기준(측정했으면). 커밋. 그 뒤 37 후속 3.

**31 B 후속 5** — G15 앞 단독. spec 14.3 보정 5-1 '(보정 6)', 14.14 새 단언 ⑤⑥·보정 6 표. R15·R33. 파일: `components/ui/ScrollRow.tsx`, `tests/ui/ChipGroup.test.tsx`(표의 2곳 변경 + 새 단언).
- 할 일 (`ScrollRow.tsx`): `wheel` 리스너만 따로 둔다 — 이벤트의 `Math.abs(deltaX) > Math.abs(deltaY) || shiftKey` 가 참일 때만 '사용자 조작 중' 을 시작한다. 그 밖의 입력 신호(`pointerdown`·`touchstart`·`keydown`·스크롤 버튼 클릭·사용자 포커스 이동)와 시간 값·`scrollend`·ref 판정은 그대로. passive 리스너·언마운트 정리 그대로. `USER_INPUT_EVENTS` 와 파일 머리 JSDoc(`:52`, `:189` 부근)을 고친다.
- 먼저 실패하는 테스트 (`ChipGroup.test.tsx`):
  - 표의 2곳: `:619` `fireEvent.wheel(group)` → `fireEvent.wheel(group, { deltaX: 40 })` (뒤의 `setScrollLeft`, `:622` `toBe(10)`, `:624-625` 그대로), `:950` 같은 변경 (`:951-957` 그대로). 지금 구현에서도 통과한다 (실패 예상 아님, 구현 뒤에도 같은 뜻이 성립하게 하는 변경).
  - 새 단언 ⑤ (새 `it`): 세로 휠 `fireEvent.wheel(group, { deltaY: 100 })`(`deltaX` 0, Shift 없음) 뒤 `setScrollLeft`, 줄 폭 변화(`triggerResize`) → 선택 칩이 다시 흐림 밖에 보임. 예상 실패: 지금 구현이 세로 휠도 신호로 세어 그 `scroll` 을 사용자 스크롤로 기록해 다시 보이기를 멈춤.
  - 새 단언 ⑥ (새 `it`): `deltaX` 가 `deltaY` 보다 큰 휠(예: `{ deltaX: 40, deltaY: 10 }`), `shiftKey: true` 인 세로 휠(`{ deltaY: 100, shiftKey: true }`) 각각 뒤 `scroll` 이면 폭이 바뀌어도 `scrollLeft` 유지. 지금도 통과 (실패 예상 아님, 회귀 방지).
  - 실패 출력 요약을 task '후속 5' 에 붙이고 `ChipGroup.test.tsx` 만 경로 지정 커밋한 뒤 구현한다.
- 끝 기준: `pnpm exec vitest run src/tests/ui/ChipGroup.test.tsx src/tests/ui/Tabs.test.tsx src/tests/feed src/tests/chat src/tests/AskAiPanel.test.tsx src/tests/modals` 통과 (표 밖 실패는 `blocked`), 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0, `grep -rn "fireEvent.wheel(group)" frontend/src/tests` 출력 없음. **실제 Chrome 확인** (프로덕션 빌드, 31 후속 2·4 와 같은 방식, 결과와 `scrollLeft` 값·스크린샷 경로를 task 에): ① 1024 이상 `/` 에서 소스 줄을 Shift+휠로 민 뒤 창 폭을 바꿔도 민 위치가 남음. ② 1024 에서 sticky 툴바 위에 포인터를 두고 페이지를 세로 휠로 내린 직후 폭을 바꾸면 선택 칩이 다시 흐림 밖에 보임. ③ 보정 5 의 터치 에뮬레이션 확인(민 위치 유지)이 그대로. 확인하지 못하면 '미확인' 으로 적고 메인 세션에 알린다.

**36 A 재측정 6 (권장)** — G15 뒤 단독. 36 의 할 일 1·2·4·6·7 과 끝 기준(기준선 항목 제외)을 그대로 한다: `--self-test` 종료 0, HEAD 프로덕션 전체 측정(`--commit "$(git rev-parse HEAD)"`, 기본 `--out`, `--screenshots key`), `report.json` 모든 조합 `pass: true`, `/` 10조합 `toolbar.mustReadVisible: true`, PNG 24장, `make check` 한 번과 `config.json`·`sources.json`·`backend/app/config/sources.json` 되돌림. 1ec8a9b 기준선은 다시 재지 않는다 (`git diff --stat 3cedad0 HEAD -- frontend/scripts` 출력 없음을 task 에 적는다). 새 실패는 리뷰 후속 공통 규칙대로 나눈다. 측정 환경이 없으면 위 '측정 판단' 대로 대체 증거를 적고 끝낸다.

**37 후속 3** (메인 세션, G16 뒤) — 보정 6 으로 어긋나는 서술. 모두 '변경 파일' 리뷰 후속 문서 목록 안이다. 기록은 `37-docs-3.md` 의 새 절 '후속 3'.
- `docs/design-system.md`: `ScrollRow` 행(`:226`)의 입력 신호 `wheel` 을 '가로 의도의 `wheel`(`Math.abs(deltaX) > Math.abs(deltaY) || shiftKey`)' 로, 세로 휠은 신호가 아님.
- `docs/functional-spec/07-ui-common.md`: 사용자 스크롤 정의의 입력 신호 줄(`:271`)을 같은 뜻으로.
- `docs/test-cases.md`: 테스트 수(`:9` frontend 파일·테스트 수), `ChipGroup.test.tsx` 의 바뀐 두 행(`:870`, `:882` 의 `wheel` 설명을 가로 휠로)과 새 테스트 ⑤⑥ 행.
- 끝 기준: `grep -nE "\`pointerdown\`·\`wheel\`·" docs/design-system.md docs/functional-spec/07-ui-common.md` 출력 없음 (작성 때 `design-system.md:226`, `07-ui-common.md:271`), `grep -n "가로 의도\|deltaX" docs/design-system.md docs/functional-spec/07-ui-common.md` 가 두 파일 모두 출력 있음, `docs/test-cases.md` 의 frontend 테스트 수가 G16 의 `pnpm test` 출력과 같음. 찾은 줄과 고친 내용을 `37-docs-3.md` '후속 3' 에 적는다.

#### 보정 7 (spec 14.15, R35~R40 — 프로덕션 스크린샷 결함 7건)
근거: 메인 세션이 36 재측정 6(`afa1ee3`, HEAD `27f3eed`)의 스크린샷 24장에서 확정한 결함 F1·F3·C1~C4 (F2 는 바꾸지 않음, 우려 29). 기존 14.8 검사는 '규칙대로인지' 만 보아 이 결함들을 놓쳤고, 보정 7 은 결함마다 그 성질을 재는 새 검사를 더한다. spec 14.15 의 설계·새 검사 표·fixture 표·회귀 증명·바뀌는 단언 표·새 단언·문서가 기준이다. 작성 때 기준선: HEAD `8d643d2`, `cd frontend && pnpm test` 50 파일 599 테스트 통과.

| 결함 | 요구 | 단계 (담당) |
|---|---|---|
| F1 360·390 소스 줄이 칩 1.5개 폭 | R35 | 41 E (앱), 38 A (`toolbarLayout`) |
| F3 카드 `★180` 합성 점수, GitHub 포크를 `댓글` 로 | R36 | 39 D (지표 표) → 40 D (카드), 38 A (`cardMetric`) |
| C1 360 챗 스코프 탭 잘림 | R37 | 42 F (C2 의 짧은 라벨로), 38 A (`chatScope`) |
| C2 챗 용어 영어·불일치 | R38 | 39 D (`ALL_CATEGORY_LABEL`·`SCOPE_LABELS`) → 42 F, 41 E (`feedCategoryLabel`), 38 A (`terms`) |
| C3 모델 선택이 헤더·입력창 두 곳 | R39 | 42 F, 38 A (`modelPicker`) |
| C4 포커스 시트 라벨이 다름 | R40 | 42 F, 38 A (`focusLabels`·새 측정 상태) |

- **규칙**: 리뷰 후속 공통 규칙(실패 테스트 먼저, 경로 지정 실패 테스트 커밋, 병렬 단계 끝 검사, ui-audit 실행 환경)을 그대로 따른다. 실패 테스트 커밋 메시지: `test(ui-redesign): NN 실패 테스트 — <요지>` (38 은 `test(ui-redesign): 38 실패 fixture — <요지>`). 바꿀 수 있는 기존 단언은 '증명' 의 '보정 7 에서 바뀌는 기존 단언' 표(spec 14.15 표, 우려 27)의 줄뿐이다. **표 밖 기존 단언이 깨지면 고치지 않고 그 단계를 `blocked` 로 두고** 깨진 테스트·실패 출력·원인을 task 에 적어 메인 세션에 보고한다 (spec 14.15 '구현 중 이 표 밖 단언이 깨지면 단언을 고치지 않고 멈춰 보고한다'). spec 이 확인한 '그대로 성립하는 단언'(`ChatHeader.test.tsx:35`, `FormControls.test.tsx:262-270`, `ChatWorkspace.test.tsx:283-284`, `NewsCard.test.tsx` fixture `:11,25`, `FeedToolbar.test.tsx:209-223`, `ChatModelSelector.test.tsx:122,129-`)이 깨지면 특히 그렇다.
- **담당**: 기존 implementer 를 이어 쓴다. 메인 세션이 task 파일 `Agent:` 의 ID 로 SendMessage: A `aa16eed435b46be0f`(38·43), D `a1a17ea9b97a86155`(39·40), E `a2cd41bc978ebd13f`(41), F `ae45fb4787df1dd15`(42, 24단계 챗 담당). B(`ScrollRow`·`Chip`)는 이번에 일이 없다. 그 ID 로 이어갈 수 없으면 새 implementer 를 띄우고 새 task 파일 `Agent:` 에 새 ID 와 이유를 적는다.
- **task 파일** (새로 만든다): `tasks/ui-redesign/38-audit-r35-r40.md`, `39-labels-metric-scope.md`, `40-card-metric.md`, `41-toolbar-wrap.md`, `42-chat-terms-model.md`, `43-prod-audit-7.md`, `44-docs-7.md`.
- **측정에서 새 실패 (우려 31)**: 38 의 사전 측정이나 43 의 측정이 앱 결함을 찾으면 '변경 파일' 보정 7 목록의 담당 단계에 돌린다 (메인 세션이 SendMessage). 목록 밖 파일이면 고치지 않고 측정 단계 task 를 `blocked` 로 두고 '실패 목록' 표(검사·상태·폭·테마·요소 경로·파일·제안 담당)를 남긴다. 메인 세션이 plan 을 고쳐 재승인받은 뒤 잇는다.
- **순서**
  ```
  39 D (라벨) ─ G17 ─┬─ 40 D (카드)  ─┐
                     ├─ 41 E (툴바)  ─┤
                     └─ 42 F (챗)    ─┼─ G18 ─ 43 A (측정) ─ G19 ─ 44 main (문서)
  38 A (ui-audit, 39~42 와 병렬) ─────┘
  ```
  - 38 A 는 `frontend/scripts/**` 만 고치고 사전 측정은 `git worktree` 로 따로 띄운 고치기 전 코드를 재므로 39~42 와 병렬이다. G18 에 합류한다.
  - 39 D(라벨)는 작은 단계로 먼저 끝낸다. 40·41·42 가 `labels.ts` 의 새 내보내기를 쓴다 (40 `scoreMetric`·`countMetric`, 41 `ALL_CATEGORY_LABEL`, 42 `ALL_CATEGORY_LABEL`·`scopeLabel`·`categoryLabel`).
  - 웨이브 11b = {40 D, 41 E, 42 F} 동시. 파일이 겹치지 않는다 (`NewsCard.tsx`·`NewsCard.test.tsx` / `FeedToolbar.tsx`·`FeedToolbar.test.tsx` / `components/chat/*` 7개·`tests/chat/*` 6개). D 는 39 뒤에 40 을 순서대로 한다.
  - 43 은 G18 뒤 단독, 44 는 G19 뒤.
- **관문 G17** (39 done 뒤, 메인 세션): `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, 39 의 실패 테스트 커밋이 구현보다 먼저 있음, R32 diff 0줄. 커밋 (38 의 미커밋 파일은 넣지 않는다 — 38 의 fixture 커밋은 38 이 경로 지정으로 한다).
- **관문 G18** (38·40·41·42 done 뒤, 메인 세션): frontend 세 명령 종료 0, `make build` 성공, `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0, `git log --oneline 8d643d2..` 에서 38(fixture)·40·41·42 의 실패 테스트 커밋이 각 구현보다 먼저 있음, '증명' 보정 7 의 기존 단언 확인, '증명' 보정 7 의 정적 확인, R32 diff 0줄, 38 task 의 사전 측정 표에 목록 밖 파일 결함이 없음. 웨이브 커밋.
- **관문 G19** (43 done 뒤, 메인 세션): G18 과 같은 검사 + 43 의 끝 기준. 커밋. 그 뒤 44.

38. **[implementer A] ui-audit 보정 7 검사 6개·새 측정 상태·fixture, 사전 측정** — 39~42 와 병렬 (`frontend/scripts/**` 만 고친다). spec 14.15 '새 검사' 표·'새 측정 상태'·fixture 표, 우려 31. R35~R40 의 측정, R30 ①.
    - 담당 파일: `frontend/scripts/ui-audit.mjs`, `frontend/scripts/ui-audit-fixtures/defects.html`, `frontend/scripts/ui-audit-fixtures/clean.html`. task `tasks/ui-redesign/38-audit-r35-r40.md`.
    - 할 일:
      - 새 검사 6개를 spec 14.15 표의 대상·판정·기록 그대로 더한다: `toolbarLayout`(`/` 처음 상태, 768 미만 판정, 768 이상은 `{ rowWidth, fullyVisibleChips }` 기록만), `cardMetric`(`/` 보이는 카드 전부, `data-source`·`data-card-stat` 이 없으면 머리줄 글자·`sr-only` 글자로 대체 판정 — 고치기 전 코드도 잴 수 있게), `chatScope`(`/chat` 기본·기사 칩·경고 알림), `terms`(`/chat` 모든 측정 상태, 사용자 글 면제), `modelPicker`(`/chat` 기본), `focusLabels`(새 상태). `SOURCE_LABELS`·기대 라벨 목록은 스크립트 상단 상수 (`lib/labels.ts` 와 같은 값). 기존 기준값 상수는 바꾸지 않는다.
      - 새 측정 상태 '챗 포커스 필터 열림' (5폭 × 2테마): `/chat` 에서 `지식 검색 포커스 필터 설정 열기` 로 시작하는 버튼을 눌러 연 대화상자. 이 상태에서 `focusLabels`·`terms` 와 14.8 상태별 검사(`clip`, `placeholder`, `occluded`, `scrollRow`, `ariaControls`, `keepAll`)·R7 대화상자 속성 판정을 돌린다. 조합 수는 150 → 160 이 된다. 스크린샷 24장 규칙은 그대로.
      - fixture 6종 (spec 14.15 fixture 표): 좁은 소스 줄(360), RSS 합성 점수, 넘친 모드 탭(360), 영어 용어(사용자 글 면제 확인 포함), 두 번 나온 모델 선택(숨긴 버튼은 세지 않음 확인 포함), 다른 포커스 라벨. `/chat` 용 검사는 fixture 안에 같은 선택자 구조를 둔다. 기존 fixture 요소는 바꾸지 않는다 (새 판정이 기존 `clean.html` 요소를 실패로 잡으면 판정 오탐인지 먼저 보고, fixture 를 고쳐야 하면 task 에 이유를 적는다).
      - `--help` 에 새 검사·상태를 적는다.
      - 사전 측정 (우려 31, 결과는 커밋하지 않는다): 2차 '실행 환경' 과 36 task 방식대로 `git worktree add --detach <scratchpad>/al-pre7 8d643d2`(보정 7 앱 수정 전, spec 승인 커밋)를 프로덕션 빌드해 포트 3101 로 띄우고 이 단계의 스크립트로 전체 측정(`--out <scratchpad>/pre-audit-7 --screenshots none --commit 8d643d2`). spec 표 '고치기 전' 열의 실패(360·390 `toolbarLayout`, `cardMetric`, 360 `chatScope`, `terms`, 768 이상 `modelPicker`, `focusLabels`)가 실제로 나오는지 확인하고 검사별 건수·대표 요소를 task 에 인용한다 (verify 의 회귀 증명과 같은 방법의 예비 실행). 새 상태의 14.8 검사 실패는 나눈다: 판정 오탐 → 이 단계에서 고침, 42 등 보정 7 담당이 고칠 결함 → 담당만 적음, 목록 밖 파일 결함 → `blocked` + 실패 목록 표. 끝나면 서버를 끄고 worktree 를 지운다.
    - 먼저 실패하는 테스트: fixture 만 더하고 스크립트를 고치기 전 `--self-test` → 종료 1. 예상 실패 이유: 새 `data-expect`(`toolbarLayout`, `cardMetric`, `chatScope`, `terms`, `modelPicker`, `focusLabels`)가 모르는 검사 이름이거나 잡히지 않음. 실패 줄을 task 에 붙이고 fixture 두 파일만 경로 지정 커밋 (`test(ui-redesign): 38 실패 fixture — 보정 7 검사 6종`). 그 뒤 스크립트를 고친다.
    - 끝 기준: `cd frontend && pnpm exec eslint scripts/ui-audit.mjs` 오류 0, `--self-test` 종료 0 (새 결함 6종이 각 검사에서 실패, `clean.html` 두 폭 실패 0, 기존 결함 모두 계속 실패, `dev-indicator.html` 환경 오류), 사전 측정 표(조합 수 160, 검사별 실패, 새 실패 분류)가 task 에 있음. 목록 밖 결함이 있으면 `blocked`. Chrome 이 없으면 `blocked`, backend·데이터가 없으면 사전 측정만 못 했다고 적고 메인 세션에 알린다.
39. **[implementer D] 라벨: 지표 표·`ALL_CATEGORY_LABEL`·`SCOPE_LABELS`** — 웨이브 11a (38 과 병렬). spec 14.15 F3·C2 설계. R36·R38.
    - 담당 파일: `frontend/src/lib/labels.ts`, `frontend/src/tests/ui/FormControls.test.tsx`(`labels` 블록에 추가만). task `tasks/ui-redesign/39-labels-metric-scope.md`.
    - 할 일: `labels.ts` 에 `ALL_CATEGORY_LABEL = '전체 소식'`, `SCOPE_LABELS = { scoped: '단일 기사', global: ALL_CATEGORY_LABEL }`·`scopeLabel(mode)`, `ScoreMetric = 'stars' | 'points' | 'upvotes'`·`SOURCE_SCORE_METRICS = { github: 'stars', hackernews: 'points', reddit: 'upvotes' }`·`SCORE_METRIC_LABELS = { stars: '스타', points: '포인트', upvotes: '추천' }`·`scoreMetric(source)`(표에 없으면 `null`, 프로토타입 키도 `null` — 기존 `lookup` 규칙), `CountMetric = 'comments' | 'forks'`·`COUNT_METRIC_LABELS = { comments: '댓글', forks: '포크' }`·`countMetric(source)`(`github` 만 `'forks'`). React·아이콘을 import 하지 않는다. 기존 표·함수와 파일 머리 주석(항목 추가)은 그대로. `types/chat.ts` 의 `ScopeMode` 를 타입으로만 import 해도 된다 (타입 파일 불변).
    - 먼저 실패하는 테스트 (`FormControls.test.tsx` `describe('labels')` 에 추가): `scoreMetric('github') === 'stars'`, `scoreMetric('hackernews') === 'points'`, `scoreMetric('reddit') === 'upvotes'`, `scoreMetric('rss_kr')`·`('huggingface')`·`('arxiv')`·`('constructor')` 가 `null`, `countMetric('github') === 'forks'`, `countMetric('hackernews') === 'comments'`, `scopeLabel('scoped') === '단일 기사'`, `scopeLabel('global') === ALL_CATEGORY_LABEL === '전체 소식'`, `SCORE_METRIC_LABELS`·`COUNT_METRIC_LABELS` 값. 빈 구현(`null`·`''` 을 돌려주는 시그니처)을 함께 둬 단언에서 실패하게 한다. 예상 실패: 빈 구현이 `null`·`'comments'`·빈 문자열을 돌려준다.
    - 끝 기준: `pnpm exec vitest run src/tests/ui/FormControls.test.tsx src/tests/NewsCard.test.tsx src/tests/feed src/tests/chat` 통과, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
40. **[implementer D] 카드 바닥 통계: 원천 지표만** — 웨이브 11b (G17 뒤, 41·42 와 병렬). spec 14.15 F3 설계, 우려 28·30. R36.
    - 담당 파일: `frontend/src/components/NewsCard.tsx`, `frontend/src/tests/NewsCard.test.tsx`(추가만). task `tasks/ui-redesign/40-card-metric.md`.
    - 할 일 (`NewsCard.tsx:163-186` 바닥 통계): 점수는 `scoreMetric(item.source)` 가 있고 `raw_score > 0` 일 때만 그린다 (아이콘 `stars` → `Star`, `points`·`upvotes` → `ArrowBigUp`). 개수는 `comments_count > 0` 일 때(지금 규칙) `countMetric` 이 `forks` → `GitFork`, `comments` → `MessageSquare`. 각 통계 `span` 에 `data-card-stat="score"|"count"|"hotness"`, `data-metric`(인기는 생략), `title`(`GitHub 스타`·`HackerNews 포인트`·`Reddit 추천`·`GitHub 포크`·`댓글`), 안쪽 `sr-only` 는 표의 라벨. 인기(`hotness_score > 25`, `sr-only` `인기 점수`)는 그대로. 카드(`[data-feed-card]`)에 `data-source={item.source}`. `title` 의 소스 이름은 `sourceLabel()` 또는 지표 라벨로 만들고 새 라벨 표를 카드에 두지 않는다 (R19 한 곳 규칙). 배지 줄·머리줄·제목·본문·`preferSummary` 그대로. `NewsDetailModal.tsx` 는 바꾸지 않는다.
    - 먼저 실패하는 테스트 (`NewsCard.test.tsx` 새 `describe`): `source` 가 `rss_kr`·`rss`·`arxiv`·`huggingface` 이고 `raw_score` 120 이면 `[data-card-stat="score"]` 가 없고 `스타`·`점수` 글자도 없음. `github` 이면 `data-metric="stars"`, `sr-only` `스타`, `title` `GitHub 스타`. `hackernews` 는 `포인트`, `reddit` 은 `추천`. `github` 의 `comments_count` 15 는 `data-metric="forks"`·`포크`, `hackernews` 는 `comments`·`댓글`. 카드에 `data-source`. 예상 실패: 소스와 상관없이 `Star` + `점수` 를 그리고, 개수는 늘 `댓글`, `data-card-stat`·`data-source` 없음. 기존 인기 점수 단언(`:180-195`)과 fixture(`source: 'github'`, `raw_score: 120`)는 그대로 통과해야 한다.
    - 배치 증거 인용: spec 14.15 F3 행(첫 화면 `★180`, DB 조회 값)과 38 사전 측정의 `cardMetric` 실패(있으면).
    - 끝 기준: `pnpm exec vitest run src/tests/NewsCard.test.tsx src/tests/ui/Primitives.test.tsx src/tests/feed src/tests/modals/NewsDetailModal.test.tsx src/tests/design` 통과, `grep -n "raw_score" frontend/src/components/NewsCard.tsx` 의 점수 표시가 `scoreMetric` 조건 안, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
41. **[implementer E] 피드 툴바: 768 미만 줄 B 줄바꿈** — 웨이브 11b (G17 뒤, 40·42 와 병렬). spec 14.15 F1 설계, 14.15 표의 `FeedToolbar.test.tsx` 줄. R35·R33·R34·R20·R5·R6.
    - 담당 파일: `frontend/src/components/feed/FeedToolbar.tsx`, `frontend/src/tests/feed/FeedToolbar.test.tsx`. task `tasks/ui-redesign/41-toolbar-wrap.md`.
    - 할 일: 줄 B(`FeedToolbar.tsx:247`)에 `max-md:flex-wrap`. 소스 줄 바깥 감싸개(줄 B 의 직접 자식, 지금 `min-w-0 flex-1` 을 받는 요소)에 `max-md:basis-full`. Must-Read 토글에 `max-md:ml-auto`. 소스 `ChipGroup` 의 `bleed` 를 `'start'` 에서 `true` 로 (`:167` 주석 갱신). `ALL_CATEGORY_LABEL` 을 지역 상수(`:22`)에서 `labels.ts` import 로 (`feedCategoryLabel` 동작·내보내기 그대로). 768 이상 클래스는 바꾸지 않는다. DOM·`data-toolbar-row`·Tab 순서, `order`·`*-reverse` 금지(정적 확인 계속), 파일 머리 JSDoc 표(768 미만 줄 B 두 줄)를 고친다.
    - 먼저 실패하는 테스트: 표의 줄 `:145`(제목), `:148`(`max-md:-mx-4`·`max-md:px-4`·`scroll-px-6`), `:149-150`(줄 B `max-md:flex-wrap`, 소스 그룹 감싸개 `max-md:basis-full`, Must-Read `max-md:ml-auto`), `:263-265`(주석, `expect(end).toHaveClass('max-md:-mr-4')`)를 바꾸고, 새 단언: 768 이상 클래스(`md:` 접두 없는 `flex-wrap`·`basis-full`·`ml-auto`)가 없음. 예상 실패: 줄 B 에 `max-md:flex-wrap` 없음, 소스 줄이 `max-md:-ml-4`(왼쪽만), 오른쪽 표시에 `max-md:-mr-4` 없음. `:152-156`·`:209-223` 과 ③·④·⑤ 순서·묶음 단언은 그대로 통과해야 한다.
    - 배치 증거 인용: spec 14.15 F1 행과 38 사전 측정의 360·390 `toolbarLayout` 실패.
    - 끝 기준: `pnpm exec vitest run src/tests/feed src/tests/ui/ChipGroup.test.tsx src/tests/hooks/useNewsFeed.test.tsx src/tests/HotkeyGating.test.tsx src/tests/chat/HandoverIntegration.test.tsx` 통과, `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx` 출력 없음, `grep -n "const ALL_CATEGORY_LABEL" frontend/src/components/feed/FeedToolbar.tsx` 출력 없음, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
42. **[implementer F] 챗: 스코프 라벨·용어 통일·모델 선택 한 곳·포커스 시트 라벨** — 웨이브 11b (G17 뒤, 40·41 과 병렬). spec 14.15 C1~C4 설계, 14.15 표의 `chat/*` 줄, 새 단언. R37·R38·R39·R40.
    - 담당 파일: `components/chat/ChatContextBar.tsx`, `SessionItemCard.tsx`, `FocusCapsule.tsx`, `FocusBottomSheet.tsx`, `ChatHeader.tsx`, `ChatWorkspace.tsx`, `ChatMessageList.tsx`, 테스트 `tests/chat/ChatHeader.test.tsx`, `ChatPromptInput.test.tsx`(추가만), `ChatWorkspace.test.tsx`, `FocusBottomSheet.test.tsx`, `FocusCapsule.test.tsx`, `ChatSidebar.test.tsx`, `ChatSessionWorkflow.test.tsx`(`:58` 만, 보정 7 정정). task `tasks/ui-redesign/42-chat-terms-model.md`.
    - 할 일:
      - C2·C1: `ChatContextBar.tsx:19-22` 탭 라벨을 `scopeLabel('scoped')`·`scopeLabel('global')` 로 (그룹 이름 `검색 스코프 모드` 그대로). `SessionItemCard.tsx:82,99-107` 배지 글자 `scopeLabel(mode)`, 접근 이름 `${scopeLabel(mode)} 모드`. `FocusCapsule.tsx:47,88` 앞말 `포커스:`, 기본값 `ALL_CATEGORY_LABEL`. `ChatWorkspace.tsx:42` `SOURCE_NOT_FOUND_MESSAGE` = `요청하신 기사를 찾을 수 없어 전체 소식 모드로 시작합니다.`. `ChatMessageList.tsx:64` `수집된 코퍼스 기반의` → `수집된 소식 기반의`. 식별자·주석·`types/chat.ts` 값(`'scoped'`·`'global'`)은 그대로.
      - C3: `ChatHeader.tsx:129-138` 의 모델 선택과 자체 인터페이스(`:18`)의 `selectedTier`·`onSelectTier`(`:29-30,55-56`)를 지운다. `ChatWorkspace.tsx:684-685` 의 전달을 지운다. 입력창 쪽(`ChatPromptInput`, `:732-733` 전달)·`ChatModelSelector` 변형·`ModelChangeDivider`·스트리밍 중 비활성은 그대로. `types/chat.ts:921` 의 `ChatHeaderProps` 는 바꾸지 않는다 (R32, `ContractAndMsw.test.ts:1018-1026` 이 그 타입으로 `selectedTier` 를 쓴다).
      - C4: `FocusBottomSheet.tsx:29-35` 의 표를 `[{ id: 'all', label: ALL_CATEGORY_LABEL }, ...(['harness','mcp_plugins_skills','agent_tech','ai_news'] as const).map((id) => ({ id, label: categoryLabel(id) }))]` 로. 칩 순서·`id`·선택 동작·줄바꿈 `ChipGroup` 은 그대로.
    - 먼저 실패하는 테스트: 표의 줄 — `ChatHeader.test.tsx:71-90`(헤더에 모델 선택 없음으로) ·`:92-105`(지움, 단언은 `ChatPromptInput.test.tsx` 로), `ChatWorkspace.test.tsx:55`(`전체 소식 모드`)·`:142`(`하네스 & 벤치마크`)·`:295-321`(트리거 1개, 즉시 반영, 질문 입력창 뒤), `FocusBottomSheet.test.tsx:41-42`·`:90`, `FocusCapsule.test.tsx:140`(제목 `:8`·`:48` 의 `Focus:` 글자 포함), `ChatSidebar.test.tsx:256`(`단일 기사`), `ChatSessionWorkflow.test.tsx:58`(`name: '단일 기사'` 정확 일치, `:59` 그대로 — 보정 7 정정: 세션 카드 접근 이름과 겹쳐 'Found multiple elements' 로 깨짐). 새 단언: `ChatPromptInput.test.tsx`(트리거 `Sonnet 5.5`, `Haiku 5.5` 선택 → `onSelectTier('haiku')`, `isStreaming` 이면 `disabled`), `ChatHeader.test.tsx`(스코프 두 버튼 접근 이름이 정확히 `단일 기사`·`전체 소식`, 모델 선택 없음), `ChatSidebar.test.tsx`(`global` 세션 배지 `전체 소식`, 접근 이름 `단일 기사 모드`/`전체 소식 모드`, `Scoped`·`Global` 글자 없음), `FocusBottomSheet.test.tsx`(칩 글자 순서 `['전체 소식', '하네스 & 벤치마크', 'MCP & 생태계', '에이전트 아키텍처', '최신 AI 동향']`). 예상 실패: 라벨이 `단일 기사 (Scoped)`·`전체 코퍼스 (Global)`, 배지 `Global`·`Scoped`, 캡슐 `Focus:`, 알림 `전체 뉴스 모드`, 시트 라벨 `하네스·평가` 등, 헤더·입력창 트리거 2개. `ChatPromptInput.test.tsx` 새 테스트는 입력창이 이미 모델 선택을 그리므로 통과할 수 있다 (실패 예상 아님, 옮긴 단언).
    - 배치 증거 인용: spec 14.15 C1~C4 행과 38 사전 측정의 `chatScope`·`terms`·`modelPicker`·`focusLabels` 실패.
    - 끝 기준: `pnpm exec vitest run src/tests/chat src/tests/ui/FormControls.test.tsx src/tests/HotkeyGating.test.tsx` 통과 (`ContractAndMsw`·`ChatModelSelector`·`ChatSessionWorkflow`·`MobileViewport` 포함), `rg -n "\(Scoped\)|\(Global\)|>Scoped<|>Global<|Focus:|코퍼스" frontend/src/components/chat` 의 결과가 주석 줄뿐, `rg -n "'하네스·평가'|'MCP·도구'|'에이전트 기술'|'AI 뉴스'" frontend/src/components` 출력 없음 (보정 7 정정: 따옴표 포함 형태라 `SessionEmptyState.tsx:48` 의 문장을 잡지 않는다), `grep -n "selectedTier\|onSelectTier" frontend/src/components/chat/ChatHeader.tsx` 출력 없음, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
43. **[implementer A] 측정: 보정 7 판정으로 HEAD·1ec8a9b 재측정** — G18 뒤 단독. 36 의 할 일 1~7 과 끝 기준을 따른다 (36 task 방식: worktree, standalone 3101, backend DB 복사본 8102). R35~R40 의 폭별 증거, R29·R30, R5·R6·R20.
    - 담당 파일: `docs/features/ui-redesign/audit/report.json`, `audit/*.png`, `audit/baseline-1ec8a9b/report.json`. 앱·스크립트 수정은 담당 단계의 연장 (판정 오탐은 38). task `tasks/ui-redesign/43-prod-audit-7.md`.
    - 할 일:
      1. `--self-test` 종료 0.
      2. HEAD(G18 커밋) 프로덕션 전체 측정(`--commit "$(git rev-parse HEAD)"`, 기본 `--out`, `--screenshots key`). 조합 160 (새 상태 10 포함).
      3. 1ec8a9b 기준선을 다시 잰다 (`frontend/scripts` 가 38 로 바뀜). F1~F4 가 그대로 잡히는지, 보정 7 검사로 늘어난 기준선 실패 건수를 적는다 (늘어나는 것이 정상).
      4. 새 실패는 '측정에서 새 실패' 규칙대로 나눈다.
      5. 기록: 360·390 `/` 의 `checks.toolbarLayout.source`(보이는 폭 ≥ `innerWidth − 33`, 다 보이는 소스 칩 ≥ 2, 토글·정렬 top ≥ 소스 줄 bottom − 1), 768 이상 `{ rowWidth, fullyVisibleChips }`(F2 참고 자료), `checks.cardMetric.summary`(소스별 카드 수·점수 표시 수, 첫 화면에 `github` 카드가 없으면 그 사실), 360 `chatScope`, 5폭 `modelPicker`(트리거 1개), 새 상태 `focusLabels`, `/` 10조합 `scrollRow.toolbar.mustReadVisible: true`, 390×844 R5(첫 카드 제목), 360·390 R6(Must-Read 44×44), `vRhythm`.
      6. 육안 확인 (스크린샷과 scratchpad `--screenshots all`): 360·390 피드 툴바(소스 줄 한 줄, 아래 줄 오른쪽 Must-Read·정렬), 카드 바닥 통계(국내 테크 카드에 점수 없음, GitHub 카드 스타·포크), 360 챗 스코프 탭 두 개가 다 보임, 1440 챗 헤더에 모델 칩 없음·입력창 아래 하나, 포커스 필터 창 라벨. 본 것과 경로를 task 에 적는다.
      7. `make check` 한 번, 출력 전체를 task 에, 루트 `config.json`·`sources.json`·`backend/app/config/sources.json` 변경을 되돌림.
    - 끝 기준: `report.json` 모든 조합(160) `pass: true`, 조합마다 그 상태의 14.8·14.15 검사 이름이 `checks` 에 있음, `environment.devIndicator: false`, `environment.commit` 이 측정 커밋, PNG 24장, `baseline-1ec8a9b/report.json` 의 `environment.commit` `1ec8a9b`·F1~F4 실패, frontend 세 명령 종료 0, `make build` 성공. Chrome·backend·데이터가 없으면 `blocked` (verify 에서 미검증).
44. **[main 세션] 통합·상세 문서 반영 (보정 7)** — G19 뒤. spec 14.15 '문서' 와 '변경 파일' 보정 7 의 문서 목록. task `tasks/ui-redesign/44-docs-7.md`.
    - `docs/known-issues.md`: 'UI·접근성' 의 포커스 필터 창 카테고리 라벨 행(2026-11-07 기준 `:59`)을 지운다 (R40). '데이터·동작 오류' 의 '첫 화면 카드의 별점(raw_score)·인기 점수(hotness_score)·상대 시간이 모두 같은 값으로 보인다 (의심: …)' 행(`:34`)을 spec 14.15 '문서' 의 확인된 원인으로 고친다: 수집기의 합성 `raw_score`(`rss.py:75`, `arxiv.py:48`, `huggingface.py:33`, `github.py:61-69` 폴백), `calculate_hotness` 포화(`categorizer.py:147`, 4734건 중 1034건이 100), 영향(카드 인기 점수·`추천순`·`인기순` 정렬), 프론트는 합성 점수를 숨김(R36), 상대 시간은 미확인(의심으로 남김), 점수 부분에서 '의심' 표기 삭제.
    - `docs/ui-spec.md`, `docs/functional-spec/01-news-feed.md`, `docs/functional-spec/02-ai-chat.md`, `docs/design-system.md`, `docs/test-cases.md`(`:302-303` ChatHeader 모델 선택 두 행, `:421` 동기화 행 포함), `docs/test-strategy.md`, `docs/tech-spec.md`: '변경 파일' 보정 7 의 문서별 항목 그대로.
    - 각 문서 `Updated:` 갱신. 목록 밖 문서를 고쳐야 하면 고치기 전에 plan 을 고쳐 재승인받는다.
    - 후속 (문서 목록 정정, 2026-11-07, 44 끝(c65516a) 뒤 메인 세션): `docs/functional-spec/07-ui-common.md` 의 남은 두 줄을 고친다 — `:262` 챗 헤더 폭별 표 768~1023 열에서 `모델 칩` 을 지운다(R39: 헤더에 모델 선택 없음, 모델 선택은 모든 폭에서 입력창 아래), `:323` 알림 문구를 `요청하신 기사를 찾을 수 없어 전체 소식 모드로 시작합니다.` 로(R38). 끝 기준: `grep -nE "모델 칩|전체 뉴스 모드" docs/functional-spec/07-ui-common.md` 의 결과에 챗 헤더 표 행과 알림 문구가 없다. 기록은 `44-docs-7.md` 의 '후속' 절.
    - 후속 (같은 때, 메인 세션): `docs/known-issues.md` '테스트·운영' 의 backend `test_anthropic_provider.py::test_anti_gemini_isolation_*` 2개 행을 확인된 원인으로 고친다 — `has_live_provider` 가 빈 `OLLAMA_BASE_URL` 을 `config.json` 의 `ollama_base_url` 로 대체하고(`backend/app/services/llm_processor.py:267`), 로컬 Ollama 가 떠 있으면 그 검사를 통과하지만 설정 모델이 설치돼 있지 않아 `LLMUpstreamException` 이 난다. 외부 LLM 장애가 아니라 테스트 환경 격리 문제다 (backend 는 이 기능 범위 밖이라 고치지 않는다, R32).
    - 끝 기준: spec 14.15 '문서' 항목을 하나씩 대조해 빠진 것이 없다. `grep -nE "하네스·평가|MCP·도구|전체 코퍼스|\(Scoped\)|\(Global\)|Focus:|전체 뉴스 모드|header-chip" docs/ui-spec.md docs/functional-spec/02-ai-chat.md docs/known-issues.md docs/design-system.md` 의 결과가 바뀌지 않은 부품 설명(`ChatModelSelector` 의 `header-chip` 변형이 부품에 남는다는 서술)뿐이고, 찾은 줄과 고친 내용을 task 에 적는다. `grep -n "의심" docs/known-issues.md` 의 카드 점수 행에서 점수 부분 '의심' 이 없다. `docs/test-cases.md` 의 frontend 테스트 수가 G19 의 `pnpm test` 출력과 같다.

#### 보정 8 (spec 14.16, R41 — 인기 점수도 원천 지표 소스만)
근거: 보정 7 구현 뒤 프로덕션 스크린샷 `audit/feed-light-1440x900.png` 에서 `국내 테크` 카드 5장이 점수 없이 `🔥 100` 만 같은 값으로 보인다. 인기 점수는 `raw_score` 에서 계산되므로(`backend/app/collectors/categorizer.py:139-147`) R36 이 숨긴 합성 `raw_score` 소스에서는 인기 점수도 합성 값이다. 표시 코드는 `NewsCard.tsx:89` `showHot = item.hotness_score > 25` 로 소스를 보지 않는다. spec 14.16 의 설계·ui-audit 표·fixture·회귀 증명·바뀌는 단언 표·새 단언·문서가 기준이다. 작성 때 기준선: HEAD `d444621`, `cd frontend && pnpm test` 622 테스트 통과.

- **규칙**: 리뷰 후속 공통 규칙(실패 테스트 먼저, 경로 지정 실패 테스트 커밋, 병렬 단계 끝 검사, ui-audit 실행 환경)을 그대로 따른다. 실패 테스트 커밋 메시지: `test(ui-redesign): 45 실패 fixture — <요지>`, `test(ui-redesign): 46 실패 테스트 — <요지>`. 바꿀 수 있는 기존 단언은 '증명' 의 '보정 8 에서 바뀌는 기존 단언' 표(spec 14.16 표, 우려 33)의 두 곳뿐이다. **표 밖 기존 단언이 깨지면 고치지 않고 그 단계를 `blocked` 로 두고** 깨진 테스트·실패 출력·원인을 task 에 적어 메인 세션에 보고한다. spec 이 확인한 '그대로 성립하는 단언'(`NewsCard.test.tsx:180-196` 인기 점수 바닥 이동·25 이하 숨김 — fixture `source: 'github'`(`:11`), `:157-169` 머리줄에 인기 없음)이 깨지면 특히 그렇다.
- **담당**: 메인 세션이 task 파일 `Agent:` 의 ID 로 SendMessage: A `aa16eed435b46be0f`(45·47), D2 `a665cef8caa94ac11`(46, 39·40 을 맡은 implementer). 그 ID 로 이어갈 수 없으면 새 implementer 를 띄우고 새 task 파일 `Agent:` 에 새 ID 와 이유를 적는다.
- **task 파일** (새로 만든다): `tasks/ui-redesign/45-audit-hotness.md`, `46-card-hotness.md`, `47-prod-audit-8.md`, `48-docs-8.md`.
- **순서**
  ```
  45 A (ui-audit) ─┐
  46 D2 (카드)    ─┴─ G20 ─ 47 A (측정) ─ G21 ─ (보정 9: 49~54 ─ G22 ─ 55 ─ G23) ─ 48 main (문서, 보정 8·9)
  ```
  - 45·46 병렬. 파일이 겹치지 않는다 (`frontend/scripts/**` / `NewsCard.tsx`·`NewsCard.test.tsx`). 45 의 사전 측정은 `git worktree` 로 띄운 보정 8 수정 전 코드를 재므로 46 을 기다리지 않는다.
  - 47 은 G20 뒤 단독. 48 은 원래 G21 뒤였으나 아직 하지 않았으므로 보정 9 의 측정(55)·관문 G23 뒤로 옮겼다 (보정 9 문서까지 한 번에 고친다, '보정 9' 절의 48).
- **관문 G20** (45·46 done 뒤, 메인 세션): `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공, `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0, `git log --oneline d444621..` 에서 45(fixture)·46 의 실패 테스트 커밋이 각 구현보다 먼저 있음, '증명' 보정 8 의 기존 단언 확인, R32 diff 0줄, 45 task 의 사전 측정 표에 목록 밖 파일 결함이 없음. 웨이브 커밋.
- **관문 G21** (47 done 뒤, 메인 세션): G20 과 같은 검사 + 47 의 끝 기준. 커밋. 그 뒤 보정 9 (49~), 48 은 G23 뒤.

45. **[implementer A] ui-audit `cardMetric` ⑤·fixture, 사전 측정** — 46 과 병렬 (`frontend/scripts/**` 만 고친다). spec 14.16 ui-audit 표·fixture. R41 의 측정, R30 ①.
    - 담당 파일: `frontend/scripts/ui-audit.mjs`, `frontend/scripts/ui-audit-fixtures/defects.html`, `frontend/scripts/ui-audit-fixtures/clean.html`. task `tasks/ui-redesign/45-audit-hotness.md`.
    - 할 일:
      - `cardMetric` 에 판정 ⑤: 카드 소스(`data-source`, 없으면 머리줄 소스 라벨 — 14.15 와 같은 대체 판정)가 점수 지표 표(`r7.scoreMetricLabels`)에 없는데 라벨이 `인기 점수` 인 통계(`[data-card-stat="hotness"]`, 없으면 `sr-only` `인기 점수` 의 부모)가 있으면 실패 '원천 지표가 없는 소스(<소스>)에 인기 점수'. 기록 `checks.cardMetric.summary.bySource.<소스>.hotnessShown`(인기 점수를 그린 카드 수). 판정 ①~④ 와 기준값 상수는 바꾸지 않는다.
      - fixture: `defects.html` 에 블록 하나(`data-expect="cardMetric"`, `data-note="rss_kr 카드에 인기 점수"`) — `data-source="rss_kr"` 카드 바닥에 `sr-only` `인기 점수` + `100` 만 (점수·개수 없음 — 판정 ①~④ 로는 통과하고 ⑤ 로만 실패해야 함). `clean.html` 의 `cardMetric` 절은 `github` 카드에 `sr-only` `인기 점수` + `100` 을 더하고(지표 소스는 통과), `rss_kr` 카드는 그대로(통계 없음). 다른 fixture 는 바꾸지 않는다.
      - 사전 측정 (결과는 커밋하지 않는다): 36·43 task 방식대로 `git worktree add --detach <scratchpad>/al-pre8 d444621`(보정 8 앱 수정 전, spec 승인 커밋)를 프로덕션 빌드해 3101 로 띄우고 이 단계의 스크립트로 전체 측정(`--out <scratchpad>/pre-audit-8 --screenshots none --commit d444621`). spec 표 '고치기 전' 열의 실패(첫 화면 `국내 테크` 카드마다 `cardMetric` ⑤)가 나오는지 확인하고 건수·대표 요소를 task 에 인용한다 (verify 회귀 증명의 예비 실행). 다른 새 실패는 나눈다 (판정 오탐 → 이 단계, 46 이 고칠 결함 → 적기만, 목록 밖 → `blocked`). 끝나면 서버를 끄고 worktree 를 지운다.
    - 먼저 실패하는 테스트: fixture 만 더하고 스크립트를 고치기 전 `--self-test` → 종료 1. 예상 실패 이유: `rss_kr 카드에 인기 점수` 블록이 판정 ①~④ 로는 통과해 `cardMetric` 이 결함을 잡지 못함 (MISS). `clean.html` 은 통과. 실패 줄을 task 에 붙이고 fixture 두 파일만 경로 지정 커밋 (`test(ui-redesign): 45 실패 fixture — cardMetric ⑤ 합성 소스 인기 점수`). 그 뒤 스크립트를 고친다.
    - 끝 기준: `cd frontend && pnpm exec eslint scripts/ui-audit.mjs` 오류 0, `--self-test` 종료 0 (새 블록이 `cardMetric` 실패, `clean.html` 두 폭 실패 0, 기존 결함 계속 실패, `dev-indicator.html` 환경 오류), 사전 측정 표가 task 에 있음. Chrome 이 없으면 `blocked`, backend·데이터가 없으면 사전 측정만 못 했다고 적고 메인 세션에 알린다.
46. **[implementer D2] 카드 인기 점수: 지표 소스만** — 45 와 병렬. spec 14.16 설계·바뀌는 단언 표·새 단언, 우려 28·33. R41.
    - 담당 파일: `frontend/src/components/NewsCard.tsx`, `frontend/src/tests/NewsCard.test.tsx`. task `tasks/ui-redesign/46-card-hotness.md`.
    - 할 일: `NewsCard.tsx:89` 를 `showHot = scoreKind !== null && item.hotness_score > 25` 로 바꾼다 (`scoreKind = scoreMetric(item.source)` 가 `:91` 이므로 선언 순서를 맞춘다). 인기 통계 마크업(`data-card-stat="hotness"`, `Flame`, `sr-only` `인기 점수`, 반올림)과 점수·개수 통계, 카드 고정 틀은 그대로. `lib/labels.ts`·`NewsDetailModal.tsx` 는 바꾸지 않는다.
    - 먼저 실패하는 테스트 (`NewsCard.test.tsx`):
      - 표의 두 곳: `:328-329`(주석 '인기 점수도 합성 값이라 숨긴다 (R41)', `expect(stat(container, 'hotness')).toBeNull()` 과 `expect(screen.queryByText('인기 점수')).toBeNull()`. 같은 테스트의 `:321-327` 은 그대로), `:404-405`(`renderSource({ source: 'github', hotness_score: 84.6 })`. `:406-410` 은 그대로).
      - 새 단언 (새 `it`): `rss_kr`·`rss`·`arxiv`·`huggingface`·`mystery` 각각 `hotness_score: 84.6` 이면 `[data-card-stat="hotness"]` 와 `인기 점수` 글자가 없음. `github`·`hackernews`·`reddit` 각각 `hotness_score: 84.6` 이면 인기 통계가 있고 `85`.
      - 예상 실패: 소스와 상관없이 `hotness_score > 25` 면 인기 통계를 그려 `:328-329` 의 바뀐 단언과 새 단언의 합성 소스 부분이 실패. `:404-405` 와 지표 소스 부분은 지금도 통과 (실패 예상 아님).
      - 실패 출력 요약을 task 에 붙이고 `NewsCard.test.tsx` 만 경로 지정 커밋한 뒤 구현한다.
    - 배치 증거 인용: spec 14.16 근거(`feed-light-1440x900.png` 의 `🔥 100` 5장)와, 45 가 끝났으면 사전 측정의 `cardMetric` ⑤ 실패.
    - 끝 기준: `pnpm exec vitest run src/tests/NewsCard.test.tsx src/tests/ui/Primitives.test.tsx src/tests/ui/FormControls.test.tsx src/tests/feed src/tests/modals/NewsDetailModal.test.tsx src/tests/design` 통과, `grep -n "showHot" frontend/src/components/NewsCard.tsx` 의 선언에 `scoreKind !== null` 이 있음, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
47. **[implementer A] 측정: 보정 8 판정으로 HEAD·1ec8a9b 재측정** — G20 뒤 단독. 43 의 할 일·끝 기준을 따른다 (36·43 task 방식: worktree, standalone 3101, backend DB 복사본 8102). R41 의 폭별 증거, R29·R30.
    - 담당 파일: `docs/features/ui-redesign/audit/report.json`, `audit/*.png`, `audit/baseline-1ec8a9b/report.json`. 앱·스크립트 수정은 담당 단계의 연장 (판정 오탐은 45, 카드는 46). task `tasks/ui-redesign/47-prod-audit-8.md`.
    - 할 일: ① `--self-test` 종료 0. ② HEAD(G20 커밋) 프로덕션 전체 측정 160조합(`--commit "$(git rev-parse HEAD)"`, 기본 `--out`, `--screenshots key`). ③ 1ec8a9b 기준선 재측정 (`frontend/scripts` 가 45 로 바뀜). F1~F4 가 그대로 잡히는지, 늘어난 기준선 실패 건수를 적는다. ④ 새 실패는 공통 규칙대로 나눈다. ⑤ 기록: `cardMetric.summary.bySource` 의 소스별 `cards`·`scoreShown`·`hotnessShown`(지표 없는 소스는 `hotnessShown` 0), `/` 10조합 `cardMetric` 실패 0, `rowAlign`(카드 고정 틀 그대로) 실패 0. ⑥ 육안 확인: `feed-*` 스크린샷에서 `국내 테크` 등 지표 없는 소스 카드에 `🔥` 가 없고 GitHub·HackerNews 카드는 그대로, 바닥 줄 높이·카드 높이가 같은 줄에서 맞음. 본 것과 경로를 task 에 적는다. ⑦ `make check` 한 번, 출력 전체를 task 에, 루트 `config.json`·`sources.json`·`backend/app/config/sources.json` 변경을 되돌림.
    - 끝 기준: `report.json` 160조합 모두 `pass: true`, `environment.devIndicator: false`, `environment.commit` 이 측정 커밋, PNG 24장, `baseline-1ec8a9b/report.json` 의 `environment.commit` `1ec8a9b`·F1~F4 실패, frontend 세 명령 종료 0, `make build` 성공. Chrome·backend·데이터가 없으면 `blocked` (verify 에서 미검증).
48. **[main 세션] 통합·상세 문서 반영 (보정 8·9)** — 보정 9 의 관문 G23 뒤로 옮겼다 (아직 하지 않았고, 보정 9 가 같은 문서를 다시 고치므로 한 번에 한다). 본문은 아래 '보정 9' 절의 48 이 대신한다. task 파일은 그대로 `tasks/ui-redesign/48-docs-8.md`.

#### 보정 9 (spec 14.17, R42~R48 — 피드 세 영역 분리와 화면 구성 결함 6건)
근거: 승인된 spec 보정 9(커밋 `adf8581`, 14.17, R42~R48, 우려 34~42). 사용자 재지시로 피드 검색·필터·정렬을 모든 폭에서 세 영역으로 나누고(G1, R42), 47단계 스크린샷 24장에서 확인한 결함 H1~H6(R43~R48)을 고친다. spec 14.17 의 설계·폭 계산·ui-audit 표·fixture 표·회귀 증명·바뀌는 단언 표·새 단언·문서가 기준이다. 작성 때 기준선: HEAD `adf8581`(앱 코드는 `bcec1f5` 와 같다 — `git diff --stat bcec1f5 adf8581 -- frontend` 0줄), `cd frontend && pnpm exec vitest run` 50 파일 630 테스트 통과. spec 14.17 이 인용한 줄 번호는 이 작업 트리에서 다시 확인했다.

| 결함 | 요구 | 단계 (담당) |
|---|---|---|
| G1 검색·정렬이 칩 줄 안, 높이·끝 어긋남 | R42 (R35·R33·R34·R20 고침) | 50 E (앱), 49 A (`feedAreas`, `toolbarLayout`·`vRhythm` 판정) |
| H1 챗 헤더 `기록 → ← 피드` 순서 | R43 | 52 F, 49 A (`chatHeader`) |
| H2 UI 글자의 그림 문자 | R44 | 51 D2 (Ask AI·상세 오류), 52 F (추천 질문·모델 티어), 53 H (시사점·분야 머리글), 54 G (`IconGuard`), 49 A (`pictograph`) |
| H3 `Ask AI`·`전용 챗`·`전용 AI 챗` | R45 | 51 D2, 49 A (`terms` 넓힘, `ENTRY_POINTS`·`DIALOGS` 이름) |
| H4 브리핑 설정 두 곳·헤드라인 두 번 | R46 | 53 H, 49 A (`briefing` ①②) |
| H5 브리핑 분야 이름·카드 머리줄 라벨 | R47 | 53 H (브리핑), 51 D2 (카드 `title`), 49 A (`briefing` ③) |
| H6 1024 카드 바닥 `챗에서 분석` 글자 사라짐 | R48 | 51 D2, 49 A (`cardFooter`) |

- **결정 1 (`IconGuard`·`pictograph` 판정식, spec 정정 `13506f9` 로 해소)**: 처음 spec 의 `/\p{Extended_Pictographic}/u` 는 `frontend/src/components/**`·`frontend/src/app/**` 에서 다섯 파일 밖의 텍스트 표현 기호 두 곳 — `frontend/src/app/page.tsx:265` 바닥글 `©`(U+00A9), `frontend/src/components/ui/Toast.tsx:34,185` 주석 `↔`(U+2194) — 도 걸어 54 가 고친 뒤에도 통과할 수 없었다 (planner 확인). 메인이 선택지 ① 을 골라 spec 14.17 H2·`pictograph`·R44 를 판정식 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/u`(전역 플래그로 센다)로 정정했다. 이 식에 걸리는 글자는 기본이 이모지 표현인 글자(💡🔄📊⚡🎯🧠🔒 등)와 뒤에 U+FE0F 가 붙은 그림 문자(🛠️⚖️⚠️)이고, 텍스트 표현 기호(`©`·`®`·`↔`·`➔`·`✓`)는 걸리지 않는다. 메인이 node 로 센 결과 대상 범위에서 다섯 파일 16글자만 걸린다: `DailyBriefingModal.tsx` 1, `NewsDetailModal.tsx` 1, `chat/ChatMessageList.tsx` 4, `chat/ModelTierBadge.tsx` 6, `news-detail/AskAiPanel.tsx` 4. 그래서 `page.tsx` 바닥글과 `Toast.tsx` 는 고치지 않고 '변경 파일' 도 늘지 않는다. 54 와 49 의 `pictograph` 가 이 식을 함께 쓴다.
- **결정 2 (뉴스 상세 탭의 회귀 증명 방법, spec 정정 `13506f9` 로 해소)**: 보정 9 의 ui-audit 는 뉴스 상세 둘째 탭을 새 이름 `/^AI 질의응답/`(`DIALOGS`)로 찾으므로, 고치기 전 커밋 `adf8581`(탭 이름 `Ask AI 질의응답`)에서는 그 탭을 열지 못한다. 메인이 plan 의 대안을 채택했다: 그 탭 상태의 `pictograph` 실패(빠른 질문 이모지 4개)와 `terms` 의 탭 이름 실패는 프로덕션 회귀 측정으로 증명하지 않고, ① `--self-test` fixture(`pictograph`·`terms` 행) ② 51 의 단위 테스트(`AskAiPanel.test.tsx`·`modals/NewsDetailModal.test.tsx` 의 바뀐 단언과 빠른 질문 `svg` 새 단언) ③ `IconGuard`(54, 고치기 전 `AskAiPanel.tsx:51-66` 에서 실패)로 증명한다. 고치기 전 실행에서 그 탭 상태가 열리지 않은 것은 실패도 통과도 아닌 '측정 못 함' 으로 verify.md 에 적는다. 고친 뒤 실행에서는 그 탭 상태가 열려 실패 0 이어야 한다.
- **규칙**: 리뷰 후속 공통 규칙(실패 테스트 먼저, 경로 지정 실패 테스트 커밋, 병렬 단계 끝 검사, ui-audit 실행 환경)과 1차 '모든 단계 공통 규칙'(토큰 색만, CSS 변형, `useMediaQuery` 만, localStorage 불변, eslint 완화 금지)을 그대로 따른다.
  - 실패 테스트 커밋 메시지: `test(ui-redesign): 49 실패 fixture — <요지>`, `test(ui-redesign): NN 실패 테스트 — <요지>`(50~54). 각 단계는 **구현 파일을 고치기 전에** 자기 테스트(와 필요하면 시그니처만 있는 빈 구현)만 경로 지정 커밋한다. 관문 G22 는 `git log --oneline adf8581..` 에서 49~54 의 실패 테스트 커밋 여섯 개가 모두 G22 구현 커밋보다 앞에 있는지 본다.
  - 바꿀 수 있는 기존 단언은 '증명' 의 '보정 9 에서 바뀌는 기존 단언' 표(spec 14.17 표, 우려 34)의 줄뿐이다. **그 밖의 기존 단언은 바꾸지 않는다.** 표 밖 기존 단언이 깨지면 고치지 않고 그 단계를 `blocked` 로 두고 깨진 테스트·실패 출력·원인을 task 에 적어 메인 세션에 보고한다. spec 이 '그대로 성립한다' 고 확인한 단언(`FeedToolbar.test.tsx:95-111,115-118,120-133,135-141,161-173,387-403,456-466`, `NewsDetailModal.test.tsx:65,88,137`, `ChatMessageList.test.tsx:28`, `FormControls.test.tsx:143,151`, `DailyBriefingModal.test.tsx:8-27`)이 깨지면 특히 그렇다.
  - 병렬 단계 끝 검사는 담당 범위만 본다. 같은 웨이브의 다른 단계가 실패 테스트로 먼저 커밋한 파일(예: 52 가 `src/tests/chat` 을 돌릴 때 51 의 `HandoverIntegration.test.tsx`, 모든 단계에서 54 의 `IconGuard.test.ts`)의 실패는 그 단계 몫이니 task '막힌 점' 에 적기만 한다.
  - `FEED_CATEGORIES`(`FeedToolbar.tsx:13-19`)는 50 의 파일에 있고 53 이 import 한다. 50 은 그 내보내기의 이름·`{ id, icon }` 모양·순서를 바꾸지 않는다. 바꿔야 하면 멈추고 메인 세션에 알린다 (53 과 조율).
- **담당**: 메인 세션이 task 파일 `Agent:` 의 ID 로 SendMessage 로 이어 쓴다: A `aa16eed435b46be0f`(49·55, ui-audit·측정), E `a2cd41bc978ebd13f`(50, 23·34·41 피드 툴바), D2 `a665cef8caa94ac11`(51, 39·40·46 카드), F `ae45fb4787df1dd15`(52, 24·42 챗), H `a3946f65cec43927e`(53, 26 에서 `DailyBriefingModal` 을 고친 implementer), G `a4298b1aa5033196d`(54, 25 Ask AI). 그 ID 로 이어갈 수 없으면 새 implementer 를 띄우고 새 task 파일 `Agent:` 에 새 ID 와 이유를 적는다. 48 은 메인 세션(문서 작성 서브에이전트를 써도 된다).
- **task 파일** (새로 만든다): `tasks/ui-redesign/49-audit-areas.md`, `50-feed-areas.md`, `51-card-handover-detail.md`, `52-chat-header-icons.md`, `53-briefing.md`, `54-icon-guard.md`, `55-prod-audit-9.md`. 48 은 기존 `48-docs-8.md` 를 그대로 쓰고 제목을 '통합·상세 문서 반영 (보정 8·9)' 로 고친다.
- **순서와 병렬** (implementer 여섯이 같은 작업 트리에서 동시에 돈다. 담당 파일이 겹치지 않는다):
  ```
  54 G (IconGuard 실패 테스트) ─┐
  49 A (ui-audit·fixture·사전 측정) ─┤
  50 E (피드 세 영역)             ─┤
  51 D2 (카드 바닥·이관·상세)     ─┼─ G22 ─ 55 A (160조합 측정·스크린샷·Chrome) ─ G23 ─ 48 main (문서, 보정 8·9)
  52 F (챗 헤더·이모지)           ─┤
  53 H (브리핑)                   ─┘
  ```
  - 띄우는 순서: 54 와 49 를 먼저 띄우고, 54 의 실패 테스트 커밋이 들어간 뒤 50~53 을 띄운다. 54 는 다섯 파일의 이모지가 아직 있는 작업 트리에서 실패를 기록해야 하기 때문이다 (51·52·53 이 이모지를 먼저 지우면 실패 목록이 줄어든다). 54 는 테스트 파일 하나만 쓰므로 몇 분 안에 끝난다. 49 는 `frontend/scripts/**` 만 고치고 사전 측정은 `git worktree` 의 `adf8581` 을 재므로 다른 단계를 기다리지 않는다.
  - 파일 소유: 49 `frontend/scripts/**` / 50 `feed/FeedToolbar.tsx`·`feed/FeedStatusBar.tsx`·`app/page.tsx`·`tests/feed/FeedToolbar.test.tsx`·`tests/feed/FeedStatusBar.test.tsx` / 51 `NewsCard.tsx`·`chat/HandoverCtaButton.tsx`·`NewsDetailModal.tsx`·`news-detail/AskAiPanel.tsx`·`tests/NewsCard.test.tsx`·`tests/chat/HandoverIntegration.test.tsx`·`tests/modals/NewsDetailModal.test.tsx`·`tests/AskAiPanel.test.tsx` / 52 `chat/ChatHeader.tsx`·`chat/ChatMessageList.tsx`·`chat/ModelTierBadge.tsx`·`chat/ChatModelSelector.tsx`·`tests/chat/ChatHeader.test.tsx`·`tests/chat/ChatMessageList.test.tsx`·`tests/chat/ChatModelSelector.test.tsx` / 53 `DailyBriefingModal.tsx`·`tests/modals/DailyBriefingModal.test.tsx` / 54 `tests/ui/IconGuard.test.ts`. 이 밖의 파일은 어느 단계도 고치지 않는다.
  - 유일한 단계 사이 의존: 53 은 50 의 파일에 있는 `FEED_CATEGORIES` 를 import 만 한다 (지금도 내보내져 있어 50 을 기다리지 않는다). 54 는 51·52·53 이 끝나야 통과한다 (G22 에서 확인).
  - 55 는 G22 뒤 단독, 48 은 G23 뒤.
- **관문 G22** (49~54 done 뒤, 메인 세션): `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0 (`IconGuard.test.ts` 통과 포함), `make build` 성공, `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0, 실패 테스트 커밋 순서(위 '규칙'), '증명' 보정 9 ⑦ 의 기존 단언 확인, R32 diff 0줄, '증명' 보정 9 의 정적 확인, 49 task 의 사전 측정 표에 목록 밖 파일 결함이 없음. 실패는 그 파일 담당 implementer 에 SendMessage 로 이어서 시킨다. 통과하면 웨이브 커밋.
- **관문 G23** (55 done 뒤, 메인 세션): G22 와 같은 검사 + 55 의 끝 기준. 커밋. 그 뒤 48.

49. **[implementer A] ui-audit 새 검사 5개·바뀐 판정 3개·fixture, 사전 측정** — 50~54 와 병렬 (`frontend/scripts/**` 만 고친다). spec 14.17 'ui-audit' 표·fixture 표·회귀 증명. R42~R48 의 측정, R29·R30.
    - 담당 파일: `frontend/scripts/ui-audit.mjs`, `frontend/scripts/ui-audit-fixtures/defects.html`, `frontend/scripts/ui-audit-fixtures/clean.html`. task `tasks/ui-redesign/49-audit-areas.md`.
    - 할 일:
      - `const R9_CHECKS = ['feedAreas', 'chatHeader', 'pictograph', 'briefing', 'cardFooter']` 를 `R7_CHECKS` 와 같은 방식으로 두고 `ALL_CHECKS` 에 넣는다. 상태별 실행: `/` 처음 상태 `feedAreas`·`cardFooter`·`terms`(넓힘), `/chat` 기본 `chatHeader`·`pictograph`(·`terms` 그대로), 챗 포커스 필터 열림 `pictograph`, 뉴스 상세 두 탭(열린 첫 탭 + `ask-ai` 탭 상태) `pictograph`·`terms`, 일일 브리핑 `pictograph`·`briefing`. 판정·기록은 spec 14.17 표 그대로 (`feedAreas` ①~⑥ 과 `checks.feedAreas.layout`, `chatHeader`, `pictograph` 판정식 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/u`(54 의 `IconGuard` 와 같은 식, 결정 1)·면제 3종, `terms` 금지 용어, `briefing` ①~③, `cardFooter` 세 조건).
      - 판정 바꿈: `toolbarLayout`(보정 7 의 '보이는 폭 ≥ innerWidth − 33'·'토글·정렬 top ≥ 소스 줄 bottom' 을 지우고 spec 표의 다섯 조건, 기록에서 `sortTop` 을 빼고 `toggleRight`·`contentRight` 추가), `vRhythm`(세 간격: 요약 바 → `[data-feed-search]` → 첫 `[data-toolbar-row]`, 마지막 `[data-toolbar-row]` → `[data-feed-list-header]`, 대상 없으면 '대상 없음' 실패), `terms`(대상 상태 넓힘 + `Ask AI`·`전용 챗`·`전용 AI 챗`).
      - 기준 상수는 스크립트 상단(지금 `K`·`r7` 상수 옆)에 둔다. 콘텐츠 상자 = `[data-feed-toolbar]` 부모의 rect 에서 `padding-left/right` 를 뺀 범위. 기존 판정·상수(보정 7·8 포함)는 바꾸지 않는다.
      - `ENTRY_POINTS` `card-chat` 이름 `/^AI 챗에서 분석/`(`:1463`), `DIALOGS` 뉴스 상세 탭 `{ id: 'ask-ai', label: '뉴스 상세 AI 질의응답 탭', name: /^AI 질의응답/ }`(`:1565`). `ENTRY_POINTS` 의 `search`·`sort` 항목은 그대로 (영역이 바뀌어도 역할·이름이 같다).
      - fixture: spec 14.17 fixture 표 8행(칩 줄 안 검색·정렬 1440, 칩 줄 사이 검색 360, 아래 줄 토글 360, 기록 버튼이 앞, 이모지, 영어·전용 용어, 브리핑 중복, 아이콘만 남은 바닥 줄)을 `defects.html`(`data-expect`, `data-note`)·`clean.html` 에 넣는다. 360 판정은 지금처럼 `[data-self-test-narrow]` 영역. 기존 clean 블록 중 `[data-feed-toolbar]` 를 가진 것(보정 5 '숨은 Must-Read', 보정 7 '좁은 소스 줄')과 `vRhythm` 대상 블록을 세 영역 구조로 고친다. defects 쪽 덤 실패는 `data-expect-reason` 으로 이유를 지정해 `data-expect` 판정을 가리지 않게 한다.
      - 사전 측정 (결과는 커밋하지 않는다): 45 task 방식대로 `git worktree add --detach <scratchpad>/al-pre9 adf8581`(보정 9 앱 수정 전, spec 승인 커밋)을 프로덕션 빌드해 띄우고(standalone, backend DB 복사본) 이 단계의 스크립트로 전체 측정(`--out <scratchpad>/pre-audit-9 --screenshots none --commit adf8581`). spec 표 '고치기 전 (예상)' 열과 대조해 검사별 실패 건수·대표 요소를 task 에 표로 인용한다: `feedAreas` 모든 폭 ①, 768 이상 ③⑤, 768 미만 ②; `toolbarLayout` 360·390; `vRhythm` '대상 없음'; `chatHeader` 기록 버튼이 보이는 폭; `pictograph` `/chat` 기본(추천 카드 4·모델 칩)·일일 브리핑 분야 머리글; `terms` `/` 카드·상세 첫 탭 배너; `briefing` ①②③; `cardFooter` 모든 폭(1024 `sr-only`); R9 `card-chat` 진입점 실패. 뉴스 상세 `ask-ai` 탭 상태가 열리지 않은 것은 '측정 못 함' 으로 따로 적는다 (결정 2). 다른 새 실패는 나눈다 (판정 오탐 → 이 단계, 50~53 이 고칠 결함 → 담당 단계 적기만, 목록 밖 파일 → `blocked`, spec 우려 42). 브리핑이 없으면 `briefing`·브리핑 `pictograph` 는 skipped 라고 적는다. 끝나면 서버를 끄고 worktree 를 지운다.
    - 먼저 실패하는 테스트: fixture 두 파일만 고치고 스크립트를 고치기 전 `--self-test` → 종료 1. 예상 실패 이유: `defects.html` 의 `data-expect="feedAreas|chatHeader|pictograph|briefing|cardFooter"` 가 '모르는 검사 이름', '아래 줄 토글' 결함이 옛 `toolbarLayout` 판정을 통과(MISS), `Ask AI`·`전용 챗` 블록이 옛 `terms` 를 통과(MISS), 세 영역 구조로 고친 `clean.html` `vRhythm` 블록이 옛 판정에서 '대상 없음: `[data-feed-status]`'. 실패 줄을 task 에 붙이고 fixture 두 파일만 경로 지정 커밋 (`test(ui-redesign): 49 실패 fixture — 세 영역·챗 헤더·그림 문자·용어·브리핑·카드 바닥`). 그 뒤 스크립트를 고친다.
    - 끝 기준: `cd frontend && pnpm exec eslint scripts/ui-audit.mjs` 오류 0, `--self-test` 종료 0 (새 8 블록이 각 검사에서 실패, 면제 확인 블록 — `.markdown-viewer` 안 `💡`, `a[target="_blank"]` 안 `🚀`, `h2` `AgentLens © 2026 ↔ 피드`(텍스트 표현 기호는 걸리지 않음, spec 정정 `13506f9` 의 `clean.html` 행), `role="alert"` 안 `이메일 설정 열기` — 통과, `clean.html` 두 폭 실패 0, 기존 결함 계속 실패, `dev-indicator.html` 환경 오류), 사전 측정 표가 task 에 있음. Chrome 이 없으면 `blocked`, backend·데이터가 없으면 사전 측정만 못 했다고 적고 메인 세션에 알린다.
50. **[implementer E] 피드 세 영역: 검색 영역·필터 영역·목록 머리줄** — 49·51~54 와 병렬. spec 14.17 설계 G1·바뀌는 단언 표의 `FeedToolbar.test.tsx` 행·새 단언, 우려 35·36·37·38. R42 (R35·R33·R34·R20 고침).
    - 담당 파일: `frontend/src/components/feed/FeedToolbar.tsx`, `frontend/src/components/feed/FeedStatusBar.tsx`, `frontend/src/app/page.tsx`, `frontend/src/tests/feed/FeedToolbar.test.tsx`, `frontend/src/tests/feed/FeedStatusBar.test.tsx`(새). task `tasks/ui-redesign/50-feed-areas.md`.
    - 할 일 (spec 14.17 설계 G1 그대로):
      - `FeedToolbar`: Fragment 로 ① `<div data-feed-search="" className="scroll-mt-20">{searchField}</div>`(`formClassName="w-full"`) ② 지금의 `div[data-feed-toolbar]`(클래스 그대로). 줄 A 카테고리만, 줄 B `[소스][Must-Read]`(`max-md:flex-wrap`·`max-md:basis-full`·`max-md:ml-auto` 삭제, `bleed="start"`). 정렬 `Select`·`SORT_OPTIONS`·`sort`·`onSortChange` 를 뺀다. `data-toolbar-row`·`data-must-read-toggle`·`data-source-chip`·`selectedSelector`·`FEED_CATEGORIES`·`feedCategoryLabel`·`FEED_SOURCES` 는 그대로. `order`·`*-reverse`·`useMediaQuery` 를 쓰지 않는다 (R33 한 트리).
      - `FeedStatusBar`: `<div data-feed-list-header="" className="flex items-start gap-3">` 안에 ① 지금의 상태 `div`(`ref`, `data-feed-status`, `tabIndex={-1}`, `role="status"`, `aria-live="polite"`, `scroll-mt-44 md:scroll-mt-48`)에 `min-w-0 flex-1 min-h-11 md:min-h-9` 를 더하고 안쪽은 그대로 (spec 14.17 정정 `5f6417e`: 상태가 여러 줄로 감겨도 정렬이 첫 줄에 남게 머리줄은 `items-start`, 상태 최소 높이 = 정렬 높이 44 / md 36. 아래 '50 연장') ② 형제 `Select label="정렬" hideLabel options={SORT_OPTIONS} containerClassName="w-28 shrink-0 xl:w-32"`, `onChange` 는 `onSortChange(value)` 뒤 `onPageChange(1)`. `SORT_OPTIONS` 를 이 파일에서 내보낸다.
      - `page.tsx`: prop 전달을 옮기고, `/` 단축키(`:145`)를 `input.focus({ preventScroll: true })` 뒤 `input.closest('[data-feed-search]')?.scrollIntoView({ block: 'nearest', behavior: 'auto' })`.
    - 먼저 실패하는 테스트:
      - `FeedToolbar.test.tsx`: '보정 9 에서 바뀌는 기존 단언' 표의 `FeedToolbar.test.tsx` 행 전부(fixture 키 `:11,18,325,332` 삭제, `:50`·`:57-61`, `:80-93` 은 `FeedStatusBar.test.tsx` 로 옮김, `:145,148,150-152,154-158`, `:225,230-231,237`, `:241,264,278-281`, `:341-347`·`:422` 옮김, `:426-433`, `:435-454`, `:468-479`)와 새 단언(`[data-feed-search]` 가 `scroll-mt-20`, 검색 폼 `w-full` 이고 `md:w-48`·`xl:w-72` 없음, `[data-feed-toolbar]` 안에 `searchbox`·`combobox` 없음).
      - `FeedStatusBar.test.tsx`(새): 옮긴 정렬 단언(옵션 4개 값·글자, `latest` 선택 → `onSortChange('latest')`·`onPageChange(1)`), 정렬이 `[data-feed-list-header]` 안·`role="status"` 밖·상태 뒤(DOM), 상태가 `aria-live="polite"`·`페이지 p / T` 를 담음, 머리줄 `flex items-center` 이고 `flex-wrap` 아님(처음 실패 테스트 `ab2d673` 의 단언. 50 연장에서 `items-start` 로 바뀜), 상태 `min-w-0 flex-1`, 정렬 감싸개 `w-28 shrink-0 xl:w-32`, 폭 목 360 → 1440 다시 그려도 같은 정렬 노드.
      - 빈 구현: `FeedStatusBarProps` 에 `sort?`·`onSortChange?`·`onPageChange?` 를 받기만 하게 둔다 (실패가 단언에서 나게). fixture 키를 지워 생기는 `FeedToolbar` 필수 prop 누락 tsc 오류는 이 커밋 시점에만 허용하고 구현 뒤 0 이어야 한다 (vitest 는 타입을 보지 않는다).
      - 예상 실패: 툴바 안에 `combobox`·검색이 있어 '없음' 단언 실패, `[data-feed-search]` 없음, DOM 순서 `카테고리 → 검색`, 소스 줄 `bleed` 가 양쪽(`max-md:-mx-4`)·줄 B `max-md:flex-wrap`·토글 `max-md:ml-auto`, `FeedStatusBar` 에 정렬 없음. 그대로 통과해야 하는 줄(`:62-67`, '규칙' 의 확인 목록)은 실패 예상 아님.
      - 실패 출력 요약을 task 에 붙이고 두 테스트 파일(과 빈 구현을 둔 `FeedStatusBar.tsx`)만 경로 지정 커밋한 뒤 구현한다.
    - 배치 증거 인용: jsdom 은 높이·끝 맞춤을 재지 못한다. 49 가 끝났으면 사전 측정의 `feedAreas`·`toolbarLayout`·`vRhythm` 실패(1440 검색 x 1040 ≠ 112, 390 칩 두 줄 사이 검색 등)를 task 에 인용한다. 고친 뒤 확인은 55.
    - 끝 기준: `pnpm exec vitest run src/tests/feed src/tests/HotkeyListener.test.tsx src/tests/HotkeyGating.test.tsx src/tests/ResponsiveLayout.test.tsx src/tests/ui/FormControls.test.tsx src/tests/ui/ChipGroup.test.tsx src/tests/design` 통과, 정적 확인 `rg -n "SORT_OPTIONS|onSortChange|<Select|max-md:flex-wrap|max-md:basis-full|max-md:ml-auto|useMediaQuery|-reverse" frontend/src/components/feed/FeedToolbar.tsx` 출력 없음, `grep -n "data-feed-search" frontend/src/components/feed/FeedToolbar.tsx`·`grep -n "data-feed-list-header\|SORT_OPTIONS" frontend/src/components/feed/FeedStatusBar.tsx`·`grep -n "preventScroll\|data-feed-search" frontend/src/app/page.tsx` 출력 있음, `grep -n "export const FEED_CATEGORIES" frontend/src/components/feed/FeedToolbar.tsx` 출력 있음, 바꾼 파일 eslint 오류 0, tsc 에 이 파일들 오류 0.
    - **50 연장 (verifier 편차, spec 14.17 정정 `5f6417e`)**: 처음 구현의 머리줄 `flex items-center` 는 상태가 여러 줄로 감기면 정렬을 머리줄 세로 가운데로 내렸다 (360 필터 상태에서 정렬 top − 머리줄 top = 14 실측). 머리줄을 `flex items-start gap-3` 로, 상태 영역을 `min-w-0 flex-1 min-h-11 md:min-h-9` 로 바꿨다 (상태가 한 줄이면 상태 안 `items-center` 로 글자 중심이 정렬 중심과 맞음). 실패 테스트 `5de1774` → 구현 `a7b2d95`. 이 연장에서 `frontend/src/tests/feed/FeedStatusBar.test.tsx` 의 `expect(header).toHaveClass('flex', 'items-center')` 를 `'flex', 'items-start'` 로 바꿨다. 이 단언은 50 이 `ab2d673`(실패 테스트)에서 새 파일에 더한 것이라 `adf8581` 기준 기존 단언이 아니고, spec 14.17 '새 단언' 정정에 맞춘 것이다. 같은 커밋에서 새 `it`(머리줄 `items-start`·`items-center` 아님, 상태 `min-h-11`·`md:min-h-9`·`items-center`)을 더했다. 끝 기준은 위와 같다. 측정은 55 재측정(`d47c98e`, HEAD `4f7935f` 160/160).
51. **[implementer D2] 카드 바닥 줄·챗 이관 용어·상세 탭·Ask AI 빠른 질문** — 49·50·52~54 와 병렬. spec 14.17 설계 H2(Ask AI·상세 오류)·H3·H5(카드 `title`)·H6, 바뀌는 단언 표의 `NewsCard`·`HandoverIntegration`·`NewsDetailModal`·`AskAiPanel` 행, 우려 40·41. R44·R45·R47·R48.
    - 담당 파일: `frontend/src/components/NewsCard.tsx`, `frontend/src/components/chat/HandoverCtaButton.tsx`, `frontend/src/components/NewsDetailModal.tsx`, `frontend/src/components/news-detail/AskAiPanel.tsx`, `frontend/src/tests/NewsCard.test.tsx`, `frontend/src/tests/chat/HandoverIntegration.test.tsx`, `frontend/src/tests/modals/NewsDetailModal.test.tsx`, `frontend/src/tests/AskAiPanel.test.tsx`. task `tasks/ui-redesign/51-card-handover-detail.md`.
    - 할 일: H6 — `NewsCard.tsx` 바닥 줄(`:178`) `flex flex-wrap items-center justify-between gap-x-2 gap-y-1`, 통계 묶음(`:179`) `min-w-0` 삭제, 버튼 묶음(`:213`) `ml-auto`, `compactBetweenLgXl`(`:217`) 삭제와 `HandoverCtaButton.tsx:20,29,82,84` 의 prop·클래스 삭제. H3 — `HandoverCtaButton` `card-compact` 글자 `AI 챗에서 분석`, `aria-label` 삭제(접근 이름 = 보이는 글자), `title` `AI 챗에서 이 기사를 단일 기사 모드로 분석`, `modal-banner` 제목 `AI 챗에서 분석`·보조 문구 `이 기사를 단일 기사 모드로 열어 질의응답`, 주석(`:17-18`, `:73`)도 새 이름으로. `NewsDetailModal.tsx:283` 탭 `AI 질의응답`. H5 — 머리줄 카테고리 `span`(`:117`) `title={categoryLabel(item.category)}` (짧은 라벨 글자는 그대로, R19). H2 — `AskAiPanel.tsx:51-66` 라벨 이모지 삭제, `icon` 을 버튼 글자 앞에(`<p.icon aria-hidden="true" className="size-4" />`), `query` 그대로. `NewsDetailModal.tsx:200` `⚠️ ` 삭제. 카드 고정 틀(`h-full`, `mt-auto`, grid `items-stretch`)은 그대로.
    - 먼저 실패하는 테스트: 표의 `NewsCard.test.tsx:236-241`, `HandoverIntegration.test.tsx:69,85,104,122`, `NewsDetailModal.test.tsx:76,81,97,98,102,130,166,177,188,212,213`, `AskAiPanel.test.tsx:47,67` 과 새 단언(`AskAiPanel.test.tsx`: 빠른 질문 버튼마다 `svg[aria-hidden="true"]`, `NewsCard.test.tsx`: 머리줄 카테고리 `span` 의 `title` 이 `categoryLabel(item.category)`). 예상 실패: 새 이름(`AI 챗에서 분석`, `/^AI 질의응답/`, `핵심 원리 및 구조`)을 가진 요소가 없어 `getByRole`·`getAllByText` 가 던짐, 버튼 안 `svg` 0개, `title` 없음, 이관 글자 클래스에 `lg:max-xl:sr-only`. `:102` 의 건수 배지 `1` 단언 자체는 그대로 (조회 이름만 바뀜). 실패 출력 요약을 task 에 붙이고 네 테스트 파일만 경로 지정 커밋한 뒤 구현한다.
    - 배치 증거 인용: 47 스크린샷 `audit/feed-light-1024x768.png`(바닥 줄 아이콘만), 49 가 끝났으면 사전 측정의 `cardFooter`·`terms` 실패.
    - 끝 기준: `pnpm exec vitest run src/tests/NewsCard.test.tsx src/tests/chat/HandoverIntegration.test.tsx src/tests/modals/NewsDetailModal.test.tsx src/tests/AskAiPanel.test.tsx src/tests/HotkeyGating.test.tsx src/tests/ui/Primitives.test.tsx src/tests/design` 통과, `rg -n "compactBetweenLgXl|전용 (AI )?챗|Ask AI 질의응답|lg:max-xl" frontend/src/components` 출력 없음, `rg -n --pcre2 "\p{Extended_Pictographic}" frontend/src/components/news-detail/AskAiPanel.tsx frontend/src/components/NewsDetailModal.tsx` 출력 없음, 바꾼 파일 eslint 오류 0, tsc 에 이 파일들 오류 0.
52. **[implementer F] 챗 헤더 순서·추천 질문·모델 티어 아이콘** — 49~51·53·54 와 병렬. spec 14.17 설계 H1·H2(챗), 바뀌는 단언 표의 `ChatModelSelector` 행, 새 단언. R43·R44.
    - 담당 파일: `frontend/src/components/chat/ChatHeader.tsx`, `frontend/src/components/chat/ChatMessageList.tsx`, `frontend/src/components/chat/ModelTierBadge.tsx`, `frontend/src/components/chat/ChatModelSelector.tsx`, `frontend/src/tests/chat/ChatHeader.test.tsx`, `frontend/src/tests/chat/ChatMessageList.test.tsx`, `frontend/src/tests/chat/ChatModelSelector.test.tsx`. task `tasks/ui-redesign/52-chat-header-icons.md`.
    - 할 일: H1 — `ChatHeader.tsx` 에서 `Link`(`:111-119`)를 기록 `IconButton`(`:100-109`) 앞으로 (클래스·`aria-*` 그대로, `ChatWorkspace.tsx` 는 고치지 않는다). H2 — `ChatMessageList.tsx:21-26` 을 `{ icon, text }` 배열로(글자에서 이모지를 뺌, 예 `FastMCP로 파이썬 기반 경량 MCP 서버 구축하는 방법`), 카드 앞 lucide 아이콘(`aria-hidden`, `size-4`, `text-accent`, 설치된 `lucide-react` 에 있는 이름: 예 `Server`·`GitBranch`·`ChartColumn`·`TrendingUp`), `onSelectPromptSuggestion(text)`. `ModelTierBadge.tsx` `TIER_META.icon` 타입을 lucide 컴포넌트로(`haiku` `Zap`, `sonnet` `Target`, `opus` `Brain`), 비 Claude 티어 gemini `Sparkles`·gpt `Bot`·그 밖 `Target`, 그릴 때 `<Icon aria-hidden="true" data-tier-icon={tier} className="size-3.5" />`. `ChatModelSelector.tsx:114`(트리거)·`:168`(목록)도 같은 방식으로 그린다 (같은 마크업을 두 파일이 쓰면 `ModelTierBadge.tsx` 에 작은 컴포넌트를 내보내 함께 쓴다). 이름·비용·지연 표시는 그대로. `ModelChangeDivider.tsx` 는 `name` 만 써서 고치지 않는다.
    - 먼저 실패하는 테스트: 표의 `ChatModelSelector.test.tsx:22,181,189,202` 와 새 단언(`ChatHeader.test.tsx`: `onToggleHistoryDrawer` 를 줄 때 `피드로 돌아가기` 링크가 `대화 기록 보기` 버튼보다 DOM 앞이고 헤더 안 첫 조작 요소가 그 링크. `ChatMessageList.test.tsx`: 첫 추천 카드를 누르면 `onSelectPromptSuggestion` 이 `'FastMCP로 파이썬 기반 경량 MCP 서버 구축하는 방법'` 으로 불림, 카드마다 `svg[aria-hidden="true"]` 하나). 예상 실패: 기록 버튼이 먼저, 이모지가 붙은 글자로 불림, 카드 안 `svg` 0개, `[data-tier-icon]` 없음. `ChatMessageList.test.tsx:28`·`:75` 의 정규식은 그대로 맞는다 (실패 예상 아님). 실패 출력 요약을 task 에 붙이고 세 테스트 파일만 경로 지정 커밋한 뒤 구현한다.
    - 배치 증거 인용: 47 스크린샷 `audit/chat-light-1440x900.png`·`chat-light-390x844.png`, 49 가 끝났으면 사전 측정의 `chatHeader`·`pictograph` 실패.
    - 끝 기준: `pnpm exec vitest run src/tests/chat` 통과(51 의 `HandoverIntegration.test.tsx` 는 51 몫, '규칙'), `rg -n --pcre2 "\p{Extended_Pictographic}" frontend/src/components/chat` 출력 없음, `grep -n "data-tier-icon" frontend/src/components/chat/ModelTierBadge.tsx` 출력 있음, `ChatHeader.tsx` 에서 `href="/"` 줄 번호 < `대화 기록 보기` 줄 번호, 바꾼 파일 eslint 오류 0, tsc 에 이 파일들 오류 0.
53. **[implementer H] 일일 브리핑: 설정 한 곳·헤드라인 한 번·분야 라벨·시사점 아이콘** — 49~52·54 와 병렬. spec 14.17 설계 H4·H5(브리핑)·H2(시사점), 새 단언, 우려 39. R44·R46·R47.
    - 담당 파일: `frontend/src/components/DailyBriefingModal.tsx`, `frontend/src/tests/modals/DailyBriefingModal.test.tsx`. task `tasks/ui-redesign/53-briefing.md`.
    - 할 일: H4 — 위 작업 줄 `연동 설정` `IconButton`(`:172-180`)과 `mobileMenuItems` 의 `연동 설정`(`:117-119`) 삭제, 바닥 버튼(`:192-196`) 글자 `연동 설정`, 실패 알림 안 `Notion 설정 열기`·`이메일 설정 열기`(`:252-256,267-271`)는 둔다. `오늘의 핵심 요약` 의 헤드라인 `<p>`(`:297`) 삭제, 헤드라인은 `Dialog` 설명(`:213`)에만, 개요(`briefing.overview`)가 없으면 그 칸을 그리지 않는다. H5 — 분야 머리글 글자는 `CATEGORY_LABELS` 에 `cat.id` 가 있으면 `categoryLabel(cat.id)`, 없으면 `cat.name`. 아이콘은 `cat.icon` 대신 `FEED_CATEGORIES`(`@/components/feed/FeedToolbar` 에서 import, 50 이 모양을 유지)에서 같은 `id` 의 아이콘을 `aria-hidden` 감싸개(`size-4`)에 그리고, 없는 id 는 아이콘 없음. 개요 줄의 `**이름**:`(`:301,307`)은 이름이 `briefing.categories` 의 어떤 `name` 과 같고 그 `id` 가 표에 있으면 긴 라벨로 바꿔 그린다. 마크다운 전문 탭은 그대로. H2 — `💡 시사점:`(`:358`) → `<Lightbulb aria-hidden="true" className="size-4" />` + `시사점:`. 계약(`types/**`·`mocks/**`)은 바꾸지 않는다.
    - 먼저 실패하는 테스트 (새 `describe`, MSW 기존 브리핑 응답 `fetchDailyBriefing()`): `onOpenSettings` 를 주면 이름에 `연동 설정` 이 있는 버튼이 대화상자 안에 정확히 1개, `브리핑 작업` 메뉴를 열면 `연동 설정` 항목이 없음, 헤드라인 글자가 정확히 1번(`getAllByText(headline)` 길이 1), `카테고리별 요약` 패널의 분야 머리글(`h3`)이 `MCP & 생태계`·`에이전트 아키텍처`(MSW 응답의 `mcp_plugins_skills`·`agent_tech`, 작성 때 확인)이고 `MCP & 플러그인 생태계` 글자가 그 패널에 없음, 시사점 줄에 `svg[aria-hidden="true"]` 와 `시사점:`. (`agent_tech` 의 MSW `name` 은 이미 `에이전트 아키텍처` 라 그 머리글은 고치기 전에도 통과한다 — 실패 예상은 `mcp_plugins_skills` 쪽. `mocks/**` 는 고치지 않는다.) 예상 실패: jsdom 은 `max-md:hidden` 을 숨기지 않아 설정 버튼이 2개, 메뉴에 `연동 설정`, 헤드라인 2번, 머리글이 backend 이름, 시사점에 `svg` 없음. 기존 `:8-27` 은 그대로 통과 (실패 예상 아님). 실패 출력 요약을 task 에 붙이고 테스트 파일만 경로 지정 커밋한 뒤 구현한다.
    - 배치 증거 인용: 47 스크린샷 `audit/briefing-light-1440x900.png`·`briefing-light-390x844.png`, 49 가 끝났으면 사전 측정의 `briefing`·`pictograph` 실패 (브리핑이 없으면 skipped).
    - 끝 기준: `pnpm exec vitest run src/tests/modals/DailyBriefingModal.test.tsx src/tests/modals/BriefingSettingsModal.test.tsx src/tests/ui/Dialog.test.tsx src/tests/ui/Menu.test.tsx src/tests/design` 통과, `grep -n "연동 설정 관리\|cat.icon" frontend/src/components/DailyBriefingModal.tsx` 출력 없음, `grep -c "연동 설정" frontend/src/components/DailyBriefingModal.tsx` 이 바닥 버튼 한 곳(과 주석)뿐, `rg -n --pcre2 "\p{Extended_Pictographic}" frontend/src/components/DailyBriefingModal.tsx` 출력 없음, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0.
54. **[implementer G] 정적 검사 `IconGuard`** — 49 와 함께 먼저 띄운다 (실패 테스트 커밋 뒤 50~53 시작). spec 14.17 설계 H2 정적 검사. R44.
    - 담당 파일: `frontend/src/tests/ui/IconGuard.test.ts`(새). task `tasks/ui-redesign/54-icon-guard.md`.
    - 할 일: `TokenGuard.test.ts` 와 같은 방식(`// @vitest-environment node`, `node:fs` 로 `frontend/src/components/**/*.{ts,tsx}`·`frontend/src/app/**/*.{ts,tsx}` 를 모음)으로 파일 글자에서 판정식 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/gu`(spec 14.17 H2 정정 `13506f9`, 결정 1. 전역 플래그로 센다)에 걸리는 글자를 찾는다. 텍스트 표현 기호(`app/page.tsx:265` 의 `©`, `ui/Toast.tsx:34,185` 주석의 `↔`, `ModelChangeDivider.tsx:40` 의 `➔`, `WorkflowStepTracker.tsx:125` 의 `✓`)는 걸리지 않아야 하고 허용 목록을 두지 않는다. 실패 메시지에 `파일:줄 글자(U+XXXX)` 목록을 담는다. 대상 파일이 0개면 실패 (조용한 통과 금지).
    - 먼저 실패하는 테스트: 51~53 이 이모지를 지우기 전 작업 트리에서 `pnpm exec vitest run src/tests/ui/IconGuard.test.ts` → 실패. 예상 실패 목록 (메인이 node 로 센 값과 같다): `DailyBriefingModal.tsx:358`(1), `NewsDetailModal.tsx:200`(1), `chat/ChatMessageList.tsx:22-25`(4), `chat/ModelTierBadge.tsx:22,32,42,74`(6, `:74` 에 3글자), `news-detail/AskAiPanel.tsx:51,56,61,66`(4) — 다섯 파일 16글자, 그 밖 파일 없음. 목록이 다르면 멈추고 메인 세션에 알린다. 실패 출력을 task 에 붙이고 이 파일만 경로 지정 커밋 (`test(ui-redesign): 54 실패 테스트 — IconGuard 그림 문자 0개`). 이 단계는 앱 코드를 고치지 않는다 — 통과는 51·52·53 이 만들고 G22 에서 확인한다.
    - 끝 기준: 실패 테스트 커밋이 있음, 바꾼 파일 eslint 오류 0, tsc 에 이 파일 오류 0. (통과 확인은 G22.)
55. **[implementer A] 측정: 보정 9 판정으로 HEAD 160조합·1ec8a9b 재측정, 스크린샷, Chrome 확인** — G22 뒤 단독. 47 의 할 일·끝 기준을 따른다 (36·43·47 task 방식: worktree, standalone 3101, backend DB 복사본 8102). R42~R48 의 폭별 증거, R5, R29·R30, 우려 35·36·38·41 확인.
    - 담당 파일: `docs/features/ui-redesign/audit/report.json`, `audit/*.png`, `audit/baseline-1ec8a9b/report.json`. 앱·스크립트 수정은 담당 단계의 연장 (판정 오탐은 49, 피드 50, 카드·상세 51, 챗 52, 브리핑 53). task `tasks/ui-redesign/55-prod-audit-9.md`.
    - 할 일: ① `--self-test` 종료 0. ② HEAD(G22 커밋) 프로덕션 전체 측정 160조합(`--commit "$(git rev-parse HEAD)"`, 기본 `--out`, `--screenshots key`) — 새 검사 5개가 해당 상태 조합의 `checks` 에 있어야 한다. ③ 1ec8a9b 기준선 재측정 (`frontend/scripts` 가 49 로 바뀜): F1~F4 가 그대로 잡히는지, 늘어난 기준선 실패 건수. ④ 새 실패는 공통 규칙대로 나눈다 (목록 밖 파일 → `blocked`, 우려 42). ⑤ 기록 (task 에 표로): `feedAreas.layout` 의 5폭 rect(검색·정렬·토글·머리줄·콘텐츠 끝 차이), 360·390 `toolbarLayout.source`(보이는 폭·흐림 밖 칩 수·토글 줄·`toggleRight`/`contentRight`), `vRhythm` 세 간격, R5(1440×900 첫 줄 아래 끝, 390×844 첫 제목 아래 끝), `cardFooter`·`rowAlign` `/` 10조합 실패 0, `chatHeader`·`pictograph`·`terms`·`briefing` 실패 0(브리핑 없으면 skipped). ⑥ Chrome 확인 (프로덕션 3101, 결과·방법을 task 에): 우려 36 — 1024×768·390×844 에서 `window.scrollTo(0, 1500)` 뒤 `/` → `document.activeElement` 가 `키워드 검색` 입력, 입력 rect top ≥ 56(헤더 아래)·bottom ≤ `innerHeight`; 1024×768 스크롤 상태에서 sticky 띠 = 헤더 bottom 56 + `[data-feed-toolbar]` 높이(spec 계산 약 88, 합 약 144) 값. 우려 38 — 360×780 에서 카테고리 칩 하나와 `Must-Read` 를 켠 상태의 목록 머리줄: `document.documentElement.scrollWidth ≤ innerWidth`, 정렬이 머리줄 첫 줄 오른쪽(정렬 top − 머리줄 top ≤ 1), 머리줄 높이 (기록만, spec 은 판정하지 않음). ⑦ 육안 확인: `feed-light-{360x780,390x844,768x1024,1024x768,1440x900}.png`(세 영역 순서·끝 맞춤, 소스 줄 + 토글 한 줄, 정렬이 머리줄 오른쪽, 카드 바닥 `AI 챗에서 분석` 글자, 같은 줄 카드 높이·제목 위치), `chat-light-{390x844,1440x900}.png`(헤더 `← 피드` 가 맨 왼쪽, 추천 카드·모델 칩 아이콘), `detail-light-*.png`(탭 `AI 질의응답`, 배너 `AI 챗에서 분석`), `briefing-light-*.png`(설정 하나, 헤드라인 한 번, 분야 머리글 긴 라벨·아이콘). 본 것과 경로를 task 에 적는다. ⑧ `make check` 한 번, 출력 전체를 task 에, 루트 `config.json`·`sources.json`·`backend/app/config/sources.json` 변경을 되돌림.
    - 끝 기준: `report.json` 160조합 모두 `pass: true`, `environment.devIndicator: false`, `environment.commit` 이 측정 커밋, PNG 24장, `baseline-1ec8a9b/report.json` 의 `environment.commit` `1ec8a9b`·F1~F4 실패, ⑤⑥⑦ 기록이 task 에 있음, frontend 세 명령 종료 0, `make build` 성공. Chrome·backend·데이터가 없으면 `blocked` (verify 에서 미검증). ⑥ 을 못 하면 그 항목만 미검증으로 적고 메인 세션에 알린다 (spec 우려 36: 통과로 보고하지 않는다).
문서 단계 (번호는 보정 8 의 48 을 그대로 쓴다. 55 다음에 한다):

48. **[main 세션] 통합·상세 문서 반영 (보정 8·9)** — G23 뒤 (보정 8 의 G21 뒤에서 옮김). spec 14.16 '문서'·14.17 '문서' 와 '변경 파일' 보정 8·보정 9 의 문서 목록. task `tasks/ui-redesign/48-docs-8.md`(제목을 '보정 8·9' 로).
    - 보정 8 몫 (원래 48 그대로): `docs/known-issues.md` '데이터·동작 오류' 의 카드 점수 행 '영향' 칸: '카드의 인기 점수(`🔥100`)가 여러 카드에 같게 보여 정보를 주지 않고' 를 '카드는 원천 지표가 있는 소스(`github`·`hackernews`·`reddit`)만 `raw_score` 와 인기 점수를 그려 합성 값을 숨긴다(R36·R41). 지표 소스에서도 인기 점수가 포화하면 100 으로 같게 보이고' 로 고친다. 정렬·폴백 `stars_hint`·합성 포크 수 서술은 그대로. `docs/ui-spec.md`(카드 바닥 통계), `docs/functional-spec/01-news-feed.md`(NEWS-08 인기 점수 표시 조건), `docs/design-system.md`(카드 통계: `scoreMetric` 이 점수·인기 둘 다의 표시 조건), `docs/test-cases.md`(보정 8 바뀐 단언·새 단언), `docs/tech-spec.md`('변경 이력' 보정 8 한 줄).
    - 보정 9 몫 (spec 14.17 '문서'):
      - `docs/known-issues.md`: 새 행 3개를 알맞은 절에 — ① 브리핑 헤드라인·분야 요약을 글자 수로 잘라 단어 중간에서 끊김(`backend/app/services/briefing_service.py:86,88,101-102`, 예 `…persistent p...`) ② backend 브리핑 분야 이름·이모지 아이콘(`:16-38`)이 `labels.ts` 와 다름 — 화면은 R47 로 가리고 마크다운 전문·Notion·이메일 본문(`notion_service.py:79`, `email_service.py:120` 의 `📌` 포함)에는 남음 ③ 챗 단계 라벨(SSE `label`)의 이모지. 셋 다 '원인: backend 문자열, 범위 밖(spec 우려 39), 별도 intent(`/triage-signal` 또는 `/write-intent`)로 넘김' 을 적는다.
      - `docs/ui-spec.md`: 피드 와이어프레임(`:43-90` 폭별 툴바 그림 → 검색 영역·필터 영역·목록 머리줄), 영역 표 상태 줄 행(`:106`, 정렬 포함 '목록 머리줄'), 세로 간격 문장(`:112`), 카드 바닥 줄(줄바꿈, `AI 챗에서 분석`), 상세 탭 이름·이관 배너 문구, 챗 헤더 순서, 추천 카드·모델 티어 아이콘, 브리핑 대화상자(설정 하나, 헤드라인 한 번, 분야 머리글 라벨·아이콘).
      - `docs/functional-spec/01-news-feed.md`(NEWS-02~06 검색 영역·정렬 위치·Must-Read 위치·`/` 포커스 스크롤, NEWS-08 바닥 줄·`AI 챗에서 분석`·머리줄 `title`, 상세 탭 이름, 상태 줄), `02-ai-chat.md`(헤더 순서, 추천 질문 아이콘·보내는 글자, 모델 티어 아이콘), `04-briefing-and-sharing.md`(브리핑 설정 진입·헤드라인·분야 이름·아이콘), `07-ui-common.md`(그림 문자 금지·lucide 규칙, 챗 헤더 폭별 표의 왼쪽 순서).
      - (48 후속 `aba5a6d`, verifier 편차로 목록에 더함) `docs/functional-spec/03-collection.md`·`05-sources-and-research.md`·`06-mcp-server.md`: 보정 8·9 로 바뀐 파일(예: `frontend/src/app/page.tsx`)을 가리키는 낡은 코드 줄 참조를 지금 줄로 고치고 `Updated:` 날짜를 바꾼다. `03-collection.md:359` 는 지금 화면에 없는 문구 인용을 지운다.
      - `docs/design-system.md`: 아이콘 규칙(그림 이모지 금지, `IconGuard`·`pictograph` 판정식 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/u`, 텍스트 표현 기호 `©`·`↔` 등은 허용), 입력과 칩의 쓰임 구분(입력은 별도 영역, 칩 줄에 섞지 않음, 우려 37 의 대비 근거), `ModelTierBadge` 아이콘, 9 검사 방법(새 검사 5개·바뀐 판정 3개·fixture 8종).
      - `docs/test-cases.md`: 보정 9 바뀐 단언·새 단언(새 파일 `FeedStatusBar.test.tsx`·`IconGuard.test.ts` 포함), 파일·테스트 수. `docs/test-strategy.md`: `IconGuard` 정적 검사, ui-audit 새 검사·바뀐 판정. `docs/tech-spec.md`: '변경 이력' 보정 9 한 줄.
    - 각 문서 `Updated:` 갱신. 목록 밖 문서를 고쳐야 하면 고치기 전에 plan 을 고쳐 재승인받는다. 별도 backend intent 는 메인 세션이 연다 (이 plan 범위 밖).
    - 끝 기준: spec 14.16 '문서'·14.17 '문서' 항목을 하나씩 대조해 빠진 것이 없다. `grep -n "정보를 주지 않고" docs/known-issues.md` 의 카드 점수 행에 옛 '영향' 문구가 없다. `rg -n "Ask AI 질의응답|전용 챗에서 분석|전용 AI 챗으로 이동|연동 설정 관리" docs/ui-spec.md docs/functional-spec` 이 지난 동작을 설명하는 줄을 내지 않는다 (변경 이력 서술은 제외). `docs/known-issues.md` 에 우려 39 의 세 행이 있다. `docs/test-cases.md` 의 frontend 파일·테스트 수가 G23 의 `pnpm test` 출력과 같다.

## 위험
- **가장 위험한 단계: 07 (오버레이 부품)**. 모든 모달·드로어·팝오버·단축키가 여기에 기대고, 기존 테스트 6곳이 컴포넌트 단독 렌더에서 `window` Escape 로 닫히기를 기대한다. 깨질 수 있는 것: 스택 리스너를 프로바이더에 달면 그 6곳이 모두 실패, 언마운트 때 스택에서 빠지지 않으면 테스트 사이에 레이어가 남아 단축키가 막힘(`useOverlayOpen` 이 계속 true), `inert` 를 `#app-shell` 에 걸고 풀지 않으면 화면 전체가 조작 불가, 포털 대화상자의 포커스 복귀 실패. 대비: 07 의 `OverlayStack`·`Dialog` 테스트가 언마운트 정리·`inert` 해제·복귀를 직접 검사하고, G1 에서 전체 테스트를 돈다.
- **두 번째: 13 (챗 셸)**. 기존 챗 테스트가 많은 구조에 기댄다: 스코프 토글·기사 칩이 `ChatHeader` 안에 있어야 함, 모델 트리거 정확히 2개, `새 대화` 단일 조회(`ChatWorkspace.test.tsx:114`), 드로어의 `대화 기록` 글자·`닫기` 버튼 단일, 루트 요소가 첫 자식. 이 제약을 단계 설명에 적었다. `새 대화` 단일 조회는 `setup.ts` 의 데스크톱 `matchMedia` 기본값(05)에 기댄다 — 기본값이 없으면 `isDesktop=false` 가 되어 헤더 버튼과 사이드바 `+ 새 대화` 가 함께 보여 실패한다.
- **04 (테마 저장소)**: `useSyncExternalStore` 로 바꾸며 `ThemeSystem.test.tsx` 의 목(호출마다 새 객체)과 어긋날 수 있다. 제약 (a)~(e) 를 적었다. 하이드레이션 불일치 경고는 `suppressHydrationWarning` 과 서버 스냅샷으로 막는다.
- **병렬 작업 중 검사**: 같은 작업 트리에서 implementer 다섯이 동시에 고치므로 전체 `pnpm test`·`tsc` 가 남의 미완성 파일 때문에 실패할 수 있다. 그래서 병렬 단계는 담당 범위만 확인하고 관문에서 전체를 본다. 관문 실패는 담당 implementer 를 SendMessage 로 이어 부른다.
- **중간 상태 회귀**: 09 이후 G2 전까지 일부 모달이 Escape 로 닫히지 않을 수 있다. 릴리스가 아니므로 받아들이고 G2 에서 확인한다.
- **`package.json` import**: 처음 구현(09)은 `Header.tsx` 에서 `package.json` 을 import 해 클라이언트 번들에 `package.json` 전체(`devDependencies` 포함)가 들어갈 수 있었다 (리뷰 지적). 18 에서 `next.config.ts` 의 `env.NEXT_PUBLIC_APP_VERSION` 으로 바꾸고, 빌드 산출물에 `devDependencies` 문자열이 없는지 확인한다 (spec 설계 3, E16).
- **ui-audit 전제**: Docker·로컬 Chrome·수집된 기사가 있어야 한다. 없으면 R3~R6·R9 의 폭별 증거가 비고 verify 에서 미검증으로 남는다 (우려 사항 7).
- **`make check` 부작용**: backend 테스트가 외부 호출을 하고 `config.json`·`sources.json` 을 고친다. 단계별 검사는 frontend 명령만 쓰고, 전체 `make check` 는 16 끝에 한 번 돈 뒤 두 파일을 되돌린다.
- 버린 대안:
  - 화면마다 한 번에 다시 쓰기(단계 0~7 을 한 implementer 가 순서대로): 같은 파일 충돌은 없지만 너무 길어 한 세션에 끝나지 않는다. 웨이브 병렬로 나눴다.
  - 공통 부품을 화면 단계 안에서 필요할 때 만들기: 같은 부품을 여러 implementer 가 따로 만들게 된다. 부품을 05~07 에 먼저 모았다.
  - `isolation: worktree` 로 implementer 마다 작업 트리 분리: 검사는 깨끗하지만 웨이브마다 병합이 필요하고 `page.tsx`·테스트 파일 병합 충돌 위험이 크다. 파일 소유를 나누는 같은 트리 방식을 골랐다.
  - 테스트 쪽에 래퍼(`ToastRegion`·`ThemeProvider`)를 더해 통과시키기: 기존 테스트를 고치는 것이라 버렸다. 대신 `ToastRegion` 중복 마운트 규칙과 `Dialog` 선택 props 로 구현 쪽에서 맞춘다.
  - `ChatContextBar` 를 `ChatWorkspace` 가 그리기: spec 대로지만 `ChatHeader.test.tsx:35,50` 이 깨진다. `ChatHeader` 가 `<header>` 뒤 형제로 그리게 해 화면 결과는 같고 테스트는 그대로 둔다.
  - `@theme` 의 `--color-*: initial` 로 팔레트 차단: spec 이 보류했다 (E2). `TokenGuard.test.ts` 로 막는다.

### 2차 (19~28단계)
- **가장 위험한 단계: 19 (ui-audit 판정)**. 1차 판정은 110/110 을 냈지만 F1~F4 를 놓쳤다. 휴리스틱(다섯 점 hit test, 끝 40자, 1px 허용)은 오탐·미탐이 있을 수 있다 (우려 13). 수정 전 코드에는 2차 측정 훅 속성이 없어서, 새 속성에만 기대면 기준선이 F1~F4 를 못 잡고 R30 ② 를 증명할 수 없다. 대비: 대체 선택자(측정 훅 계약), `--self-test` 의 고정 결함·정상 페이지·개발 표시기 페이지, 기준선에서 F1~F4 를 실제로 잡는지 끝 기준으로 확인, 27 에서 오탐을 고치면 self-test·기준선 다시 실행. 필수 대상이 없을 때 '대상 없음' 실패로 기록해 조용한 통과를 막는다.
- **두 번째: 21 (겹친 대화상자 순서)**. 렌더 중 모듈 카운터를 올리는 방식은 StrictMode 이중 렌더·동시 렌더에서 번호가 단조 증가한다는 가정(E23)에 기댄다. 정렬된 스택으로 바꾸다 맨 위·`inert`·Escape 계산이 어긋나면 모든 대화상자·메뉴·팝오버가 깨진다. eslint(react-hooks 규칙)가 렌더 중 모듈 상태 변경을 잡으면 `eslint-disable` 없이 풀어야 한다. 대비: StrictMode 테스트, 1차 Escape 테스트 6곳과 `tests/ui`·`tests/modals` 전체를 21 의 끝 기준에 넣었다. lint 로 막히면 `blocked` 로 보고한다.
- **세 번째: 23 (`useNewsFeed`)**. 목록 키와 다시 읽기를 나누면 페이지 이동·필터 변경·북마크 필터·검색 제출의 로딩 판정이 함께 바뀐다. 이전 목록을 남기다 키가 바뀐 뒤에도 옛 목록을 보이면 잘못된 결과가 보인다. 대비: `useNewsFeed.test.tsx` 의 키 변경 단언(d), `HotkeyGating`·`HandoverIntegration`·`feed` 테스트.
- **`ResizeObserver` 부재 (20)**: jsdom 과 `setup.ts` 에 `ResizeObserver` 가 없다. `ScrollRow` 가 무조건 쓰면 `ChipGroup scrollable` 을 렌더하는 기존 테스트(`FeedToolbar`, 이후 챗·Ask AI)가 모두 던진다. 대비: 훅이 없을 때 대체 경로, `setup.ts` 를 바꾸지 않는다.
- **Ask AI Escape 순서 (25)**: React 위임 리스너가 `window` 리스너보다 먼저 돈다는 가정(E22)이 틀리면 R26 을 `AskAiPanel` 만으로 풀 수 없다. 스택 규칙(21 소유)을 바꾸는 우회는 하지 않고 `blocked` 로 보고한다.
- **알림 영역 (21·24)**: `composer` 영역이 입력 영역의 `overflow-x-hidden` 상자 안에 들어가면 잘린다 (`clip` 실패). 24 가 감싸개를 그 상자 밖에 둔다. 모달이 열렸는데 `composer` 에 그리면 `inert` 인 `#app-shell` 안이라 읽히지 않는다 — 21 의 '모달 없을 때만' 규칙과 테스트가 막는다.
- **라벨 문구 변경 (22·24)**: 22 뒤 `NewsDetailModal`·`DeepResearcherTab`·`SourcesListTab` 배지가 파일 수정 없이 긴 라벨로 바뀌고, `CitationPopover` 는 24 전까지 긴 라벨이다. 지금 이 문구를 단언하는 테스트는 없다(2026-11-06 grep). 포커스 시트(`FocusBottomSheet`)는 다른 이름이 남는다 (우려 18, known-issues 행).
- **병렬 실패 테스트 커밋**: 같은 작업 트리에서 implementer 넷이 각자 커밋하므로 `index.lock` 충돌과 남의 파일이 섞일 위험이 있다. 대비: 경로 지정 커밋(`git commit -- <경로>`)만, 재시도. 관문에서 메인 세션이 `git log` 로 순서를 확인한다.
- **같은 줄 카드 높이 (22·23)**: 카드 고정 틀(22)과 그리드 늘림(23)이 나뉘어 있어 한쪽만 되면 `rowAlign` 이 실패한다. 27 의 측정이 둘을 함께 본다.
- **측정 환경**: Chrome·backend·기사 6건 이상·빈 포트(3101·3102)가 필요하다. 수정 전 기준선은 `pnpm install` 이 네트워크를 쓸 수 있다. 없으면 19·27 이 `blocked`, verify 에서 미검증 (우려 7·13). `next start` 와 `output: "standalone"` 충돌은 standalone 서버로 우회한다 (실행 환경 절).
- **`make check`**: backend live LLM 테스트 2개 실패는 범위 밖이고(우려 17), 실행이 루트 `config.json`·`sources.json` 을 고친다. 27 에서 한 번 돌리고 되돌린다.
- 2차 버린 대안:
  - spec 14.11 대로 라벨 모듈은 공통 부품 단계(20), 카드는 피드 단계(21): `labels.ts` 를 바꾸는 순간 `NewsCard.test.tsx:51` 이 다음 단계까지 깨지고, 같은 파일을 두 단계가 고치거나 중간 관문이 실패한다. 라벨과 카드를 한 단계(22)로 묶었다.
  - 수정 전 기준선을 같은 작업 트리에서 20~22 전에 재기: 19 가 끝날 때까지 모든 구현이 기다려야 한다. `git worktree` 로 `1ec8a9b` 를 따로 띄워 병렬로 돌린다 (spec 14.8 의 회귀 증명 방법과 같다).
  - `setup.ts` 에 전역 `ResizeObserver` 목 추가: 모든 테스트 환경이 바뀌어 기존 단언의 전제가 달라질 수 있다. 훅의 대체 경로를 골랐다.
  - 27 에서 측정 담당이 앱 파일을 직접 고치기 (1차 16 방식): 한 파일을 두 단계가 고치게 된다. 소유 단계 implementer 에 SendMessage 로 이어서 시킨다.
  - 390 칩 줄 줄바꿈: spec 14.0 결정 1 이 가로 스크롤로 정했다 (R5 예산).

### 3차 (29, 20·21·22·23 후속)
- **가장 위험한 단계: 20 후속 (`ScrollRow`)**. 피드 카테고리·소스, 챗 맥락 줄, Ask AI 빠른 질문, 모든 `Tabs`(대화상자 탭 줄)가 이 부품을 쓴다. 깨질 수 있는 것: 표시를 줄 위에 겹치면 `occluded`·`clip` 실패, 오른쪽 bleed 자리 교체를 잘못하면 문서 가로 스크롤(R3) 또는 줄 폭이 오가는 판정 진동, 기본 선택자를 바꾸면 기존 칩 줄의 선택 칩 보이기(`ChipGroup.test.tsx:247`)가 깨짐. 대비: 표시는 줄 밖 형제·장식, 넘침이 있을 때만 줄이 좁아지는 단방향 변화, 기본 선택자 유지, 20 후속 끝 기준에 `tests/feed`·`tests/chat`·`tests/modals`·Ask AI 를 넣었고 27 재측정이 5개 폭 `scrollRow`·`occluded`·`clip`·R3 를 본다.
- **spec 해석 (승인자 확인 필요)**: R15·spec 14.3 은 '768 미만에서 줄이 화면 좌우 끝까지 닿는다' 고 한다. `bleed` 가 좌우인 줄(피드 카테고리, Ask AI 빠른 질문)에 넘침 표시가 보일 때 이 plan 은 오른쪽 bleed 16px 를 표시에 준다 — 줄 자체는 오른쪽 끝에서 16px 앞에서 끝나고, 줄 + 표시가 화면 끝까지 닿는다. 표시를 줄 위에 겹치면 칩을 덮어 `occluded` 를 어기므로 이 방법을 골랐다. 넘침이 없을 때는 지금처럼 줄이 좌우 끝까지 닿는다. 이 해석이 R15 와 다르다고 보면 spec 을 고쳐야 한다 (이 plan 은 spec 을 바꾸지 않는다).
- **레이더 라벨 문구**: spec R19 는 피드 4개 카테고리 문구만 정한다. 레이더 4개 이름의 한국어(`하네스 & 벤치마크`, `프로토콜 & 도구`, `모델 & 추론`, `인프라 & 런타임`)는 이 plan 이 정했다. `CATEGORY_LABELS` 의 `&` 표기에 맞췄다 (23 task 의 넘김 메모는 `·` 표기를 예로 들었다). 문구를 바꾸려면 승인 때 고친다.
- **문구 변경**: 팔레트 자리표시가 바뀌면 `docs/functional-spec/07-ui-common.md:187` 이 어긋난다 → 28 후속. 기존 테스트는 정규식 `/명령어 검색/` 으로 찾아 영향 없다.
- **중간 상태**: 7a 뒤 7b 전에는 피드 소스 줄에 표시가 둘일 수 있다 (3차 '순서'). 27 1회차 `report.json`·PNG 는 작업 트리에 커밋되지 않은 채 있다 → 27 재측정이 덮어쓴다.
- 3차 버린 대안:
  - `FeedToolbar` 방식(`group-has` CSS 로 줄 밖 표시)을 소비자마다 복사: 같은 코드가 다섯 곳에 생기고 탭 줄·챗·Ask AI 가 빠지기 쉽다. `ScrollRow` 공통으로 옮겼다.
  - 표시를 줄 위 오른쪽 끝에 겹쳐 그리기: 칩을 덮어 `occluded` 실패.
  - 딥 리서처 값을 짧게(`03:00·15:00 UTC`): 다른 지표 값도 같은 위험이 남고 문구 변경이 기능명세 변경이 된다. 줄바꿈을 골랐다.
  - 팔레트 입력 글자를 줄여 자리표시를 맞추기: 768 미만 입력 16px 규칙(확대 방지)을 어긴다.
  - 레이더 이름을 backend 에서 한국어로: R32(backend 불변) 위반, 계약 변경.

### 리뷰 후속 (30~37단계)
- **가장 위험한 단계: 34 (툴바 한 트리)**. 768 미만과 768~1279 의 배치가 바뀐다 (우려 20: 모바일 검색이 카테고리 아래로, 768~1279 '카테고리+검색 / 소스+정렬'). 깨질 수 있는 것: 1024 줄 A 는 계산 여유가 약 5px 라 카테고리 줄이 넘쳐 스크롤 버튼이 나올 수 있음(R15 규칙으로 허용), 768 미만 세로 쌓기에서 카테고리 `bleed` 와 검색 전체 폭이 어긋나 문서 가로 스크롤(R3)·`clip`, sticky 툴바 높이가 바뀌어 `vRhythm`·R5 첫 화면 예산이 깨짐, 검색 폭 `md:w-48` 에서 자리표시가 넘침(R16 `placeholder`). jsdom 은 이것을 재지 못한다. 대비: 34 의 단위 테스트는 노드 동일성·DOM 순서·줄 소속만 보고, 배치는 36 의 5개 폭 측정(`scrollRow`·`clip`·`placeholder`·`vRhythm`·R3·R5)과 육안 확인, verify 의 Chrome 확인이 본다. `page.tsx`·`HotkeyGating`(`/` 로 검색 포커스)은 `searchInputRef` 가 그대로라 영향이 없어야 하고 34 끝 기준에 넣었다.
- **두 번째: 31 (`ScrollRow` 포커스 유지)**. 피드 칩 줄, 요약 바 급상승, 챗 맥락 줄, Ask AI 빠른 질문, 모든 대화상자 탭 줄이 이 부품을 쓴다. 깨질 수 있는 것: 사용자가 다른 곳으로 옮긴 포커스를 빼앗음(ref 를 지우는 시점이 틀리면), 대화상자 포커스 가두기와 다툼, 버튼이 사라질 때마다 줄이 선택 칩으로 스크롤됨(`preventScroll` 누락). jsdom 은 '포커스 요소가 빠지면 `body`' 동작만 흉내 내고 실제 Chrome 의 `blur` 발생 여부는 다르다 (우려 21). 대비: ref + 마이크로태스크 + `useLayoutEffect` 설계가 `blur` 발생과 상관없게 되어 있고, ③ 회귀 테스트(사용자가 옮긴 포커스 유지), 31 끝 기준에 `tests/chat`·`tests/modals`·Ask AI·`Tabs` 를 넣었고, verify 가 Chrome 에서 키보드로 직접 확인한다 ('증명' 리뷰 후속 ⑥).
- **30 (판정 ④)**: 2차 측정 150/150 은 ④ 없이 낸 값이라 프로덕션에서 새 실패가 나올 수 있다 (우려 22). 오탐 위험: 중첩 스크롤, sticky·fixed 조상, `overflow: clip`, 대화상자 본문의 flex 열, 의도한 `bleed` 줄. 대비: 30 이 수정 전 HEAD 에 먼저 돌려 새 실패를 분류하고, 목록 밖 파일 결함이면 `blocked` + plan 재승인, 오탐은 `clean.html` 이 계속 통과하는 범위에서만 고친다 (기준값 불변). 36 이 기준선을 다시 재 F1~F4 가 계속 잡히는지 본다.
- **32 (알림 한 번만)**: 렌더 중에 모듈 값(`announcedBy`)을 읽는다. 영역 전환과 기록 순서가 어긋나면 첫 영역이 자기 알림을 live 속성 없이 그려 아무도 알리지 않는 경우가 생길 수 있다 (예: 알림이 뜨는 같은 커밋에서 영역이 바뀜). 대비: 기록이 없으면 live 로 그리는 기본값, 회귀 테스트(영역 하나일 때 live), `ChatWorkspace.test.tsx:55` 의 404 알림 단언, verify 의 챗 경고 알림 확인.
- **spec 해석 (승인자 확인 필요) — 32**: spec 14.9 는 '닫힌 알림 id 는 기록에서 지워짐' 을 테스트 단언으로 적었다. 알림 id 는 다시 쓰이지 않아 공개 API 로는 관찰할 수 없으므로, 이 plan 은 테스트 전용 내보내기를 만들지 않고 정적 확인(`grep -nE "announcedBy\.(delete|clear)" …` 이 `dismissToast`·`clearToasts` 안에 있음)과 리뷰로 대신한다. 테스트로 증명해야 한다고 보면 승인 때 '내보내기 허용' 을 적어 고친다.
- **spec 의 정적 확인 명령 (R33)**: spec R33 의 `rg "useMediaQuery\|\border-\|-reverse" …` 는 rg 에서 `\|` 가 글자 `|` 라 늘 출력이 없다 ('리뷰 후속 기준선' 에서 확인). 이 plan 과 verify 는 `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx` 를 쓴다. spec 문구는 이 plan 이 바꾸지 않는다.
- **33 (`Badge shrink`)**: `shrink` 는 `shrink-0` 의 부분 문자열이라 `className` 문자열 비교 테스트는 거짓 통과한다 → `classList` 토큰 비교. 배지 줄 결함은 측정 데이터에 1024 Must-Read + 긴 기술 3개 카드가 없으면 프로덕션에서 재현되지 않는다 → fixture(30)·단위 테스트(33)로 증명하고 재현 여부를 36 task 에 따로 적는다 (spec 14.8).
- **35 (상태 응답 번호)**: 번호 비교가 `generation`(구독 끊김)·`pollRun`(회차)과 겹친다. 완료 처리 안의 `loadStatus()` 를 `progressEndSeq` 를 정하기 전에 보내면 그 응답까지 버려져 상태가 늦게 갱신된다. 가짜 타이머 + MSW 지연 응답 테스트는 순서가 불안정할 수 있다. 대비: 14.7 C-7 ④ 의 순서를 그대로 따르고, 26 의 기존 테스트를 끝 기준에 넣었다.
- **병렬 웨이브 8a (다섯 implementer)**: 30 의 프로덕션 빌드·측정이 길어 G8 이 늦어질 수 있고, 같은 작업 트리에서 실패 테스트 커밋이 겹친다. 대비: 30 은 worktree 에서 빌드해 작업 트리를 건드리지 않고, 커밋은 경로 지정·재시도 (2차 규칙).
- **측정 환경**: Chrome·backend(8102)·기사 6건 이상·빈 포트(3101·3102)·`pnpm install` 네트워크가 필요하다. 없으면 30 사전 측정·36 이 `blocked`, verify 에서 미검증 (우려 13).
- 리뷰 후속 버린 대안:
  - 스크롤 버튼을 늘 렌더하고 `aria-disabled`: 기존 단언 3곳(`ChipGroup.test.tsx:176,188`, `Tabs.test.tsx:249`)을 바꿔야 한다 (spec 14.3, E29).
  - 툴바를 CSS grid 영역이나 `order` 로 재배치: 한 트리지만 DOM·Tab 순서와 화면 순서가 달라져 R33 위반.
  - `cn` 에 tailwind-merge 를 넣어 클래스 충돌 해결: 새 의존성 (R32 위반).
  - 알림을 별도의 늘 있는 `sr-only` live 영역 하나로 알리기: 영역 구조와 기존 `role` 단언(`Toast.test.tsx:19-20,87`, `ChatWorkspace.test.tsx:55`)이 바뀐다.
  - spec 제안대로 공통 부품(31)·피드·수집(32)을 한 단계씩: 소유 implementer 가 셋 이상 섞여 agent 재사용이 안 되고 병렬이 줄어든다. 파일 소유별로 나눴다.
  - 수정 전 기준선을 30 에서도 재기: 36 이 최종 판정으로 다시 재야 하므로 1ec8a9b 빌드가 두 번이 된다. 30 은 HEAD 사전 측정만, 기준선은 36 에서 한 번 (검출이 바뀌면 다시).

### 보정 3 (31 후속 3, 34 후속, 30 후속 2, 36 재측정 4)
- **가장 위험한 곳: 31 후속 3 의 `bleed` 쪽별 규칙과 표시 자리**. 모든 스크롤 줄(피드 카테고리·소스, 급상승, 챗 맥락 줄, Ask AI 빠른 질문, 대화상자 탭 줄)의 768 미만 폭 계산이 바뀐다. 깨질 수 있는 것: 표시 16px 와 여백 16px 가 어긋나 문서 가로 스크롤(R3)·`clip`, 표시가 나타나고 사라질 때 칩이 옆으로 움직이거나 넘침 판정이 오감(줄이 좁아져 다시 넘침), 표시를 줄 위에 겹쳐 `occluded`, `data-overflow-slot` 을 `data-overflow-hint` 로 잘못 달아 기존 `end` 1개 단언(`ChipGroup.test.tsx:357-363`, `Tabs.test.tsx:373-379`, `FeedToolbar.test.tsx:211-215`)이 깨짐. 대비: 줄 폭은 넘침이 생기고 없어질 때만 바뀌는 규칙(14.3 보정 3-4), 31 후속 3 끝 기준에 `tests/chat`·`tests/modals`·Ask AI·`Tabs` 를 넣었고, 36 재측정 4 가 5개 폭 `scrollRow`·`occluded`·`clip`·R3 과 육안(표시가 나타날 때 칩이 움직이지 않음)으로 본다.
- **스냅 여백 24px**: 768 이상 줄도 스냅 여백이 0 → 24px 로 바뀐다. 31 후속 2 의 스냅 위치 고르기가 계산된 `scroll-padding` 을 읽으므로 값이 바뀌면 처음 상태의 `scrollLeft` 가 달라진다 (360·390 소스 줄 138 이 다른 값이 될 수 있음). 대비: 스냅 알고리즘 테스트(`:670-704`)는 계산된 스타일을 목으로 넣어 그대로이고, 36 재측정 4 의 선택 칩 판정(흐림 밖)과 `mustReadHidden`·`startHint` 로 실제 값을 본다.
- **중간 상태 (31 후속 3 → 34 후속)**: `FeedToolbar.test.tsx:142` 는 34 소유라 31 후속 3 끝과 34 후속 끝 사이에 실패 1건이 남는다. 31 후속 3 의 끝 기준이 이 한 건만 예외로 두고, G11 이 0 으로 확인한다. 같은 파일을 두 단계가 고치지 않는다는 규칙을 지키려고 받아들였다 (버린 대안: B 가 `FeedToolbar.test.tsx:142` 까지 고침 — 한 파일을 두 implementer 가 고치게 된다).
- **30 후속 2 판정의 기준선 영향**: 보정 3 판정(24px 스냅 여백, `data-selected-selector`)은 1ec8a9b 와 31 후속 3 전 HEAD 에서 거의 모든 스크롤 줄을 실패로 만든다. 기준선 실패가 느는 것은 정상이고, F1~F4 가 그대로 잡히는지만 본다. `data-selected-selector` 가 없는 줄은 후속 1 의 대체 순서로 선택 칩을 찾으므로 기준선의 선택 칩 판정은 이전과 같다.
- **우려 23 (승인자 확인 필요)**: 보정 3 은 360·390 첫 화면에서 `Must-Read` 를 보이게 하지 않는다. 왼쪽 `‹` 단서만 준다. `Must-Read` 를 첫 화면에 늘 보이게 하는 배치 변경(spec 우려 23 의 대안 ①②)은 이 plan 범위 밖이고, 하려면 spec 결정과 `FeedToolbar.test.tsx:50-57` 단언 변경이 필요하다. 남은 제한은 `docs/known-issues.md` 'UI·접근성' 1행으로 기록한다 (37 후속). 이 파일은 처음에 목록 밖이었는데 37(a9ea174)이 plan 보정 전에 행을 더했다 — 사후 보정으로 '변경 파일' 에 넣었다 (verifier 편차, Revision 참고). 같은 일을 막으려면 목록 밖 문서는 편집 전에 plan 을 고친다 (37 본문의 규칙 그대로).
- **기존 단언 변경 (우려 24)**: 5곳은 요구가 바뀐 경우로 spec 승인과 함께 승인됐다 (spec 14.13, 우려 24). 그 밖의 기존 단언이 깨지면 코드를 고치고, 고칠 수 없으면 `blocked` + 재승인이다.

### 보정 5 (34 후속 3, 31 후속 4, 30 후속 4, 36 재측정 5, 30 후속 3 기록)
- **가장 위험한 곳: 31 후속 4 의 사용자 스크롤 판정**. 시간 값(입력 뒤 1,000ms, `scrollend` 없을 때 150ms)은 근거 없는 가정이다 (spec E34, 우려 26). 깨질 수 있는 것: 관성 스크롤이 `scrollend` 없이 150ms 넘게 멈췄다 움직이면 그 뒤 `scroll` 을 사용자 스크롤이 아니라고 보아 다시 보이기가 사용자가 민 줄을 끌어옴, 입력 신호 리스너를 바깥 감싸개가 아닌 줄에만 달아 스크롤 버튼 클릭을 놓침, 포커스 유지가 옮긴 포커스를 입력으로 봄, 입력 없이 `setScrollLeft` 를 쓰는 기존 테스트 12곳에서 다시 보이기가 `scrollLeft` 를 바꿈(jsdom 은 코드로 둔 `scrollLeft` 에 `scroll` 을 내지 않아 영향이 없을 것으로 보지만 실행으로 확인하지 않음). 대비: 새 단언 ①~④, 표 밖 단언이 깨지면 고치지 않고 `blocked`(우려 26), 31 후속 4 의 Chrome 확인과 verify 의 터치 에뮬레이션·휠 확인(증명 보정 5 ⑥).
- **34 후속 3 (Must-Read 토글)**: 줄 B 에 44px(768 미만)·약 114px(768 이상) 토글이 들어가 소스 줄이 좁아진다. 1024·768 은 소스 줄이 넘쳐 스크롤 버튼이 나오고(R15 규칙), 360·390 은 소스 상자 156·186px 로 첫 칩 `전체`(약 87px)만 다 보인다 (spec 14.2 계산값). 깨질 수 있는 것: 토글이 정렬 선택창과 겹치거나 화면 밖(R3·`clip`), 768 미만 터치 영역 44px 미만(R6), `sr-only` 글자 때문에 접근 이름이 폭마다 달라짐, 구분선 삭제로 소스 줄 첫 칩 간격 변화, `vRhythm`·R5 첫 화면 높이 변화(줄 수는 같음). 대비: 단위 테스트(노드 동일성·접근 이름·순서·클래스), 36 재측정 5 의 `mustReadVisible`·R6·`clip`·`occluded`·R3·R5 와 육안 확인.
- **30 후속 3 의 앱 영향 (아직 측정 안 함)**: `clip` ① 스크롤바 면제를 768 이상으로 좁혀, 768 미만에서 `data-scroll-row` 없이 스크롤바를 숨기지 않은 가로 스크롤 영역(마크다운 표·코드 블록은 제외 규칙 그대로)이 조작 요소를 가리면 새 `clip` 실패가 난다 (30 task '후속 3' 의 앱 영향 예상). 36 재측정 5 가 처음 잰다. 목록 밖 파일 결함이면 `blocked` + plan 재승인 (공통 규칙).
- **30 후속 4 의 기준선**: 1ec8a9b 에는 `data-must-read-toggle` 이 없어 `/` 10조합 모두 `mustReadVisible` 실패가 더해진다. 정상이고 F1~F4 가 그대로 잡히는지만 본다.
- **보정 3 증명 ④ 와의 관계**: 보정 3 의 `{ mustReadHidden, startHint }` 증거는 spec 보정 5 로 `toolbar.mustReadVisible` 로 바뀌었다. 재측정 5 뒤 `report.json` 에는 `mustReadHidden` 이 없다. 보정 3 증명 ④ 는 보정 5 증명 ④ 로 대신한다 (보정 3 증명 ④ 줄 끝 괄호).
- **30 후속 3 기록**: 이 plan 보정 전에 끝난 일이다. 고친 파일(`ui-audit.mjs`, `defects.html`)은 30 소유 범위 안이고 fixture 를 먼저 커밋했으며 기준값 상수를 바꾸지 않아 plan 규칙 안이다. 그러나 판정이 바뀌었는데 프로덕션 측정은 아직 없다 → 36 재측정 5.
- **기존 단언 변경 (우려 25)**: 다섯 곳은 요구가 바뀐 경우로 spec 승인과 함께 승인됐다 (spec 14.14 표). `:619` 는 단언이 아니라 입력 신호를 넣는 준비 줄이지만, 같은 테스트의 단언(`:622`)이 확인하는 동작의 조건이 바뀌므로 표에 넣었다.
- 보정 5 버린 대안:
  - 31 후속 4 의 '풀 방법 2'(부품이 둔 값과 다른 `scroll` 은 사용자로 두고 크기 변화 직후·clamp 된 `scroll` 만 뺌): `:619` 를 바꾸지 않지만 '직후' 기준 시간이라는 또 다른 휴리스틱이 들고 spec 보정 5 의 정의와 다르다.
  - Must-Read 를 처음 상태에서 `scrollLeft 0` 우선(spec 우려 23 대안 ②): R15 '선택 칩 전체가 보이게' 를 완화한다. 제품 오너가 대안 ① 을 골랐다.

### 보정 6 (31 후속 5, 36 재측정 6, 37 후속 3)
- **가장 위험한 곳: 31 후속 5 의 휠 방향 판정**. 깨질 수 있는 것: 트랙패드 가로 제스처의 `deltaX`·`deltaY` 가 비슷하거나 세로 성분이 조금 커서 가로 의도가 신호로 잡히지 않음(사용자가 민 줄을 다시 끌어옴), 브라우저마다 Shift+휠을 `deltaX` 로 바꿔 보내거나 `shiftKey` 만 둔다는 차이, `deltaMode`(줄·페이지 단위)는 비교에 영향 없음(같은 이벤트 안의 두 축 비교). jsdom 의 `fireEvent.wheel` 은 실제 장치 값을 흉내 내지 못한다. 대비: 31 후속 5 의 실제 Chrome 확인 ①②, verify 의 확인(증명 보정 6 ⑥). 판정을 시간·크기 임계값으로 바꾸지 않는다 (spec 식 그대로).
- **측정을 권장으로 둔 판단**: 판정 스크립트가 그대로이고 ui-audit 이 `wheel` 을 보내지 않아 `report.json` 결과가 바뀌지 않을 것으로 본다. 그래도 리스너 코드가 바뀌어 처음 상태 동작(선택 칩 보이기)에 회귀가 있으면 측정만 잡을 수 있으므로 HEAD 1회를 권장한다. 측정하지 못하면 대체 증거로 끝내되 verify 에서 '미측정' 으로 남는다.
- **바뀌는 기존 줄 두 곳**: 단언 값이 아니라 입력(준비) 줄이다. `:950` 은 그대로 두어도 통과하지만 휠이 처음부터 신호가 아니게 되어 '1,000ms 시간 끝' 을 검사하지 않게 된다 (검사가 약해짐, spec 14.14 보정 6 표). 그래서 둘 다 가로 휠로 바꾼다. `frontend/src/tests` 의 `fireEvent.wheel` 은 이 두 곳뿐이다 (작성 때 grep 확인).
- **30 단계 미변경**: spec 14.8 `clip` ① 은 문구 정정이고 구현이 이미 맞다 (`ui-audit.mjs:795-797`). 30 에서 아무것도 고치지 않는다. 바꿔야 할 것 같으면 plan 을 고쳐 재승인받는다.
- 버린 대안: 세로 휠도 신호로 두고 sticky 툴바 위 세로 스크롤만 예외로 걸러냄 — 페이지 스크롤 판정이 따로 필요하고 spec 정의와 다르다.

### 보정 7 (38~44단계)
- **가장 위험한 단계: 42 (챗)**. 파일이 가장 많고(컴포넌트 7, 테스트 6) 바뀌는 기존 단언도 가장 많다 (9곳). 깨질 수 있는 것: `ChatHeader` 에서 모델 prop 을 지우다 `ChatWorkspace` 의 입력창 쪽 전달(`:732-733`)까지 지워 모델 선택이 사라짐, `types/chat.ts:921` `ChatHeaderProps` 와 컴포넌트 자체 인터페이스가 어긋난 채 남음(R32 로 타입을 고치지 않아 생기는 의도한 차이 — `ContractAndMsw.test.ts:1018-1026` 은 타입만 쓰므로 통과), 짧아진 스코프 라벨이 다른 테스트의 정규식(`/단일 기사|Scoped/i`)과 어긋남(`ChatHeader.test.tsx:35` 는 성립, `ChatSessionWorkflow.test.tsx:58` 은 세션 카드 접근 이름 `…, 단일 기사 모드` 와 겹쳐 깨져 보정 7 정정으로 표에 옮김), 접근 이름이 바뀌어 ui-audit `ENTRY_POINTS` 나 테스트의 `getByRole` 이 못 찾음(그룹 이름 `검색 스코프 모드` 는 그대로). 대비: 42 끝 기준에 `tests/chat` 전체와 정적 확인, 38 의 `terms`·`modelPicker`·`chatScope`·`focusLabels`, 43 의 160조합 측정.
- **41 (툴바 줄바꿈)**: 768 미만 툴바가 약 52px 높아진다 (spec 계산). 깨질 수 있는 것: 390×844 첫 화면 카드 제목이 아래로 밀려 R5 실패, `vRhythm`, 소스 줄 `bleed` 양쪽으로 바뀌며 문서 가로 스크롤(R3)·`clip`, 오른쪽 표시와 토글이 같은 줄에서 겹침. jsdom 은 배치를 재지 못한다. 대비: 단위 테스트는 클래스·순서·묶음만, 배치는 43 의 `toolbarLayout`·R5·R3·`vRhythm`·`mustReadVisible` 과 육안 확인.
- **38 (새 측정 상태, 우려 31)**: '챗 포커스 필터 열림' 10조합에서 14.8 상태별 검사가 지금 프로덕션에서 새 실패를 낼 수 있다 (36 재측정 6 의 150/150 은 이 상태 없이 낸 값). 그 실패가 보정 7 목록 밖 파일(예: `ui/Dialog.tsx`, `chat/FocusBottomSheet.tsx` 외 시트 부품)이면 `blocked` + plan 재승인이다. 대비: 38 의 사전 측정이 앱 수정 전에 실패 목록을 먼저 얻는다.
- **38 (휴리스틱 오탐)**: `terms` 의 사용자 글 면제(세션 제목 `title`, `.markdown-viewer`, 입력값)와 `cardMetric` 의 대체 판정(머리줄 글자로 소스 찾기)은 오탐·미탐이 있을 수 있다. 대비: fixture 의 면제 확인 케이스(`Global 소식 정리` 세션 제목, 숨긴 모델 버튼), 기준값을 느슨하게 하지 않음, 오탐 수정은 38 연장으로 기록.
- **40 (카드 지표)**: `github` 의 폴백 `stars_hint`(기본 5000)는 프론트가 실제 스타와 구별할 수 없어 계속 `스타` 로 보인다 (우려 28). 인기 점수 `🔥100` 은 계속 많은 카드에 같게 보인다 (backend 포화, 범위 밖). 첫 화면 데이터에 `github` 카드가 없으면 `cardMetric` ④ 는 fixture 로만 증명된다 (43 이 그 사실을 적는다). HuggingFace·arXiv 점수는 숨긴다 (우려 30).
- **39 → 40·41·42 의존**: 39 가 늦으면 웨이브 11b 전체가 기다린다. 39 는 표와 함수만 더하는 작은 단계로 두었다. 41 은 `ALL_CATEGORY_LABEL` 을 옮기면서 `feedCategoryLabel` 내보내기를 유지해야 한다 (쓰는 곳 `FeedToolbar.tsx:140`).
- **2차 증명과의 관계**: 2차 R32 증명의 `git diff --name-only 1ec8a9b..HEAD -- … frontend/src/components/chat/FocusBottomSheet.tsx` 0줄과 2차 R19 의 '포커스 시트 제외' 는 보정 7 뒤 성립하지 않는다 (R40 이 우려 18 을 닫음). 보정 7 증명의 R32 행이 대신한다.
- **known-issues 정정**: '첫 화면 카드의 별점…' 행은 지우지 않고 확인된 원인으로 고친다 (backend 원인은 남는다, 우려 28). 별도 backend intent 는 메인 세션이 `/triage-signal` 또는 `/write-intent` 로 연다 (이 plan 범위 밖).
- 보정 7 버린 대안:
  - 챗 모델 선택을 768 이상 헤더·768 미만 입력창으로 CSS 로 한쪽 숨김: 폭마다 자리가 다르고 DOM 이 둘이라 spec 이 택하지 않았다 (14.15 C3).
  - 챗을 두 implementer(용어·모델)로 나눔: `ChatWorkspace.tsx`·`ChatHeader.test.tsx` 에 두 결함의 변경이 섞이고 `ChatHeader` 가 `ChatContextBar` 를 그려 같은 파일을 두 단계가 고치게 된다. 한 implementer(F)로 묶었다.
  - 라벨(39)을 각 화면 단계 안에서 따로 더함: `labels.ts` 를 세 단계가 고치게 된다. 먼저 한 단계로 끝냈다.
  - `types/chat.ts` 의 `ChatHeaderProps` 에서도 모델 prop 삭제: R32(계약 파일 불변) 위반.

### 보정 8 (45~48단계)
- **가장 위험한 곳: 45 의 판정 ⑤ 와 소스 대체 판정**. `data-source` 가 없는 카드(1ec8a9b 기준선 등)는 머리줄 소스 라벨로 소스를 찾는데, 라벨이 바뀌었거나 잘리면(말줄임) 소스를 못 찾아 오탐·미탐이 난다. 깨질 수 있는 것: 지표 소스 카드에 ⑤ 오탐, `hotnessShown` 집계 누락. 대비: fixture 의 지표 소스 정상 카드(`clean.html` `github` + 인기), 기준값 불변, 오탐 수정은 45 연장으로 기록, 47 의 소스별 집계 확인.
- **46 (카드)**: 지표 없는 소스 카드는 바닥 통계가 비거나 `댓글` 만 남는다. 바닥 줄 높이는 오른쪽 버튼(`챗에서 분석`, `원문`)이 정하므로 카드 고정 틀(R17)·`rowAlign` 은 바뀌지 않을 것으로 본다 (spec 14.16). jsdom 은 배치를 재지 못한다 → 47 의 `rowAlign` 과 육안 확인. 지표 소스에서도 인기 점수가 포화(`🔥 100`)할 수 있다 — backend 계산이라 범위 밖 (우려 28).
- **선언 순서**: `showHot` 이 `scoreKind` 보다 앞(`:89` vs `:91`)이라 그대로 바꾸면 TDZ 오류다. 46 이 선언 순서를 맞춘다 (tsc·테스트가 잡는다).
- **측정 환경**: Chrome·backend(8102)·기사 데이터·빈 포트가 필요하다. 없으면 45 사전 측정·47 이 미완료로 남고 verify 에서 미검증.
- 보정 8 버린 대안:
  - `labels.ts` 에 인기 점수용 판정 함수를 따로 둠: `scoreMetric` 이 이미 '원천 지표가 있는 소스' 판정이라 같은 표가 두 개가 된다 (spec 14.16).
  - 인기 점수를 모든 카드에서 숨김: 지표 소스의 인기 점수는 실제 지표에서 계산된 값이라 정보가 남는다. 숨길지는 제품 오너 결정 (우려 28).

### 보정 9 (49~55단계, 48)
- **`IconGuard`·`pictograph` 판정식 (결정 1, spec 정정 `13506f9` 로 해소)**: 처음 식은 `page.tsx:265` `©`·`Toast.tsx:34,185` `↔` 때문에 54 가 고친 뒤에도 실패했다. 정정한 식 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/u` 는 다섯 파일 16글자만 건다. 남는 위험: 앞으로 누가 U+FE0F 없이 텍스트 표현 기호(`⚠`, `✔` 등)를 쓰면 걸리지 않는다. 이 글자들은 그림 이모지로 보이지 않으므로 spec 이 받아들였다. 대비: 54 의 예상 실패 목록이 메인이 센 값(다섯 파일 16글자)과 다르면 멈추고, 49 `clean.html` 의 `©`·`↔` 행으로 `pictograph` 의 같은 식을 확인한다.
- **가장 위험한 단계: 50 (피드 세 영역)**. 바뀌는 기존 단언이 가장 많고(`FeedToolbar.test.tsx` 12행, 두 곳은 새 파일로 옮김) R33 한 트리·R34·R35·R15 의 이전 결정 위에 배치를 다시 짠다. 깨질 수 있는 것: 소스 줄 `bleed="start"` 로 돌아가며 오른쪽 넘침 표시와 토글이 겹침(14.3 보정 3-4 의 '표시 쪽 `bleed`' 규칙), 툴바 안 `onPageChange` 를 지우다 카테고리·소스 변경의 페이지 1 이동까지 지움(정렬만 옮긴다), `statusRef` 포커스 이동(`FeedPagination`)이 정렬까지 읽음(정렬은 live 영역 밖 형제로 둔다), 상태 `scroll-mt-44 md:scroll-mt-48` 이 sticky 띠가 144px 로 줄어 여백이 커짐(값은 그대로 둔다 — 띠보다 크면 가려지지 않는다), R5 첫 화면. jsdom 은 배치를 재지 못한다. 대비: 단위 테스트는 클래스·순서·묶음만, 배치는 49 의 `feedAreas`·`toolbarLayout`·`vRhythm` 과 55 의 160조합·Chrome·육안.
- **우려 35 (360·390 소스 줄이 보정 7 보다 좁아짐)** — 확인 방법: 55 ⑤ 의 360·390 × 2테마 `toolbarLayout.source` 에서 보이는 폭 ≥ `innerWidth − 16 − 8 − 44 − 16 − 1`(360 은 275, spec 계산 276 / 390 은 305, 계산 306), 흐림 밖에 다 보이는 소스 칩 ≥ 2, 토글 세로 가운데가 소스 줄 안, `toggleRight` = `contentRight` ±1. 49 fixture '아래 줄 토글'(결함)·'소스 줄 + 44px 토글 한 줄'(정상)로 판정을 증명한다. 55 ⑦ 에서 `feed-light-360x780.png`·`feed-dark-390x844.png` 을 보고 칩 2개·토글이 같은 줄인지 적는다. 실패하면 단언·기준을 바꾸지 않고 멈춰 보고한다 (보정 7 F1 결함 재발).
- **우려 36 (768 이상 검색·정렬이 sticky 띠에서 빠짐, `/` 스크롤)** — 확인 방법: 55 ⑥ Chrome 에서 1024×768·390×844 를 `scrollTo(0, 1500)` 한 뒤 `/` → 포커스가 `키워드 검색` 입력이고 입력 rect top ≥ 56·bottom ≤ `innerHeight`. 1024×768 스크롤 상태의 sticky 띠(헤더 56 + 필터 영역)가 약 144px (보정 8 의 152 보다 작음). jsdom 단위 테스트는 `page.tsx` 를 그리지 않아 이 동작을 덮지 못한다 (`setup.ts` 가 `scrollIntoView` 를 빈 함수로 둔다). 확인하지 못하면 verify.md 에 미검증으로 적고 통과로 보고하지 않는다.
- **우려 38 (R5 여유, 360 머리줄 필터 상태)** — 확인 방법: 55 ② 의 R5 판정 통과와 ⑤ 기록(1440×900 첫 줄 아래 끝 spec 계산 약 619, GitHub 바닥 두 줄이면 약 655 < 900 / 390×844 첫 제목 아래 끝 약 469 < 844), `feedAreas` ⑥(360 처음 상태 머리줄 한 줄). 필터 상태는 측정 상태가 아니라 판정하지 않고 55 ⑥ 에서 360 카테고리 + Must-Read 상태의 문서 가로 넘침 없음·정렬 첫 줄 오른쪽을 기록만 한다. R5 가 실패하면 멈춰 보고한다.
- **우려 41 (같은 줄 카드에 바닥 한 줄·두 줄 섞임)** — 확인 방법: 55 ② 의 `/` 10조합 `rowAlign`(제목 top·카드 높이) 실패 0 과 `cardFooter`(글자 보임, 버튼 묶음이 카드 안, 통계와 안 겹침) 실패 0, 55 ⑦ 에서 `feed-light-1024x768.png`·`feed-light-1440x900.png` 의 GitHub 카드(두 줄 바닥, 버튼 묶음 오른쪽 끝)와 RSS 카드(한 줄)가 같은 줄에서 높이·제목 위치가 맞는지 본다. 첫 화면에 GitHub 카드가 없으면 두 줄 바닥은 `cardFooter` fixture(49)로만 증명했다고 적는다.
- **우려 42 (새 검사가 목록 밖 실패를 냄)**: `pictograph` 는 보이는 조작 요소·제목 글자를 보므로 backend 가 만든 글자(챗 사이드바 세션 제목, 상세의 기술 스택·태그 칩, 일일 브리핑의 기사 제목 링크)에 이모지가 있으면 실패할 수 있다. 면제(`title` 이 글자와 같은 요소, `.markdown-viewer`, `a[target="_blank"]`)로 걸러지지 않는 것은 49 사전 측정에서 먼저 드러난다. 판정 오탐이면 49 연장, 고칠 파일이 목록 밖이면 `blocked` + plan 재승인. `terms` 를 `/` 로 넓히면 카드 밖(헤더 메뉴·요약 바)의 `Ask AI` 문구도 잡는다 — 작성 때 `rg "Ask AI|전용 (AI )?챗" frontend/src/components frontend/src/app` 은 51 의 두 파일과 `AskAiPanel.tsx:91` 주석뿐이었다.
- **뉴스 상세 탭의 회귀 증명 (결정 2, spec 정정 `13506f9` 로 해소)**: `adf8581` 측정에서는 그 탭 상태가 열리지 않아 그 탭의 `pictograph`·`terms` 고치기 전 실패를 프로덕션에서 볼 수 없다. 메인 결정대로 fixture·51 의 단위 테스트·`IconGuard` 로 증명하고, 고치기 전 실행의 그 탭 상태는 verify.md 에 '측정 못 함' 으로 적는다 (실패나 통과로 세지 않는다). 고친 뒤 실행에서는 그 탭 상태가 열려 실패 0 이어야 한다 — 열리지 않으면 49 의 `DIALOGS` 이름이나 51 의 탭 라벨이 틀린 것이다.
- **병렬 실행**: implementer 여섯이 한 작업 트리에서 돈다. 깨질 수 있는 것: 경로 지정 커밋이 동시에 일어나 `index.lock` 충돌(몇 초 뒤 다시, 잠금 파일을 지우지 않는다), 한 단계가 다른 단계 파일을 `git add`(경로 지정만), 54 의 실패 목록이 다른 단계의 이모지 삭제로 줄어듦(54 를 먼저 띄운다), 50 이 `FEED_CATEGORIES` 를 바꿔 53 이 깨짐('규칙' 으로 금지). 병렬 단계 끝 검사는 담당 범위만 보고, 전체 검사는 G22 가 한다.
- **54 의 판정 범위**: `IconGuard` 는 `components/**`·`app/**` 만 본다. `types/chat.ts` 의 `withIcon` 이모지(컴포넌트가 쓰지 않음)와 테스트 파일의 이모지(테스트 제목·SSE 라벨 목)는 대상 밖이다 (spec 우려 39, R32).
- **R46 의 768 미만 진입**: 메뉴 `연동 설정` 을 지우면 768 미만은 바닥 버튼만 남는다. 바닥 버튼은 `max-md:hidden` 이 아니라 모든 폭에 보인다 (작성 때 `DailyBriefingModal.tsx:192-196` 확인). 55 의 `briefing` ① 이 측정 폭마다 1개를 판정한다.
- 보정 9 버린 대안:
  - 검색·정렬을 칩 높이·알약 모양으로 맞춤(메인의 첫 방향): 사용자 재지시로 영역이 나뉘어 이유가 없고, 칩 테두리는 SC 1.4.11 3:1 미달 (spec 우려 37).
  - 사용자 예시대로 '피드 세 영역·카드 바닥 / 챗 헤더·이모지 / 상세·브리핑 / ui-audit' 네 묶음: `HandoverCtaButton` 이 카드와 상세 배너를 함께 그려, 카드 바닥 단계와 상세 단계가 같은 파일을 고치거나 `NewsDetailModal.test.tsx:76`(배너 이름)이 다른 단계의 구현을 기다리게 된다. 카드 바닥·이관·상세를 한 단계(51)로, 피드 세 영역(50)과 브리핑(53)을 따로 두었다.
  - 카테고리 아이콘 표를 새 모듈(`lib/categoryIcons.ts` 등)로 옮김: 50 과 53 이 함께 기다리는 의존이 생긴다. 이미 내보내진 `FEED_CATEGORIES` 를 53 이 import 만 하면 파일이 겹치지 않는다.
  - 실패 테스트를 한 단계가 모두 먼저 써서 커밋: 테스트 파일과 구현 파일 담당이 갈려 구현 단계가 테스트를 못 고치는 문제(오타·셀렉터)가 생긴다. 기존 규칙대로 단계마다 실패 테스트를 먼저 커밋하고 G22 가 순서를 확인한다.
  - `IconGuard` 를 51·52·53 중 한 단계에 넣음: 다른 두 단계가 끝나야 통과해 그 단계 끝 기준을 지킬 수 없다. 실패 테스트만 쓰는 54 로 따로 두었다.

## 증명
- frontend 증명: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 코드 0 (R10).
- `make check` 는 backend pytest 를 먼저 돌리고, backend 가 실패하면 거기서 멈춰 frontend 단계를 돌리지 않는다. backend `tests/test_anthropic_provider.py::test_anti_gemini_isolation_*` 2개는 외부 LLM 업스트림 실패로 main 에서도 실패한다 (이번 범위 밖, backend 를 바꾸지 않는다). 그래서 `make check` 종료 코드는 이 기능의 증명으로 쓰지 않고, 위 frontend 명령 종료 0 으로 증명한다. `make check` 를 돌렸다면 그 두 테스트 외의 backend 실패가 없는지만 확인하고 `config.json`·`sources.json` 변경을 되돌린다.
- 이 기능은 버그 수정이 아니라 먼저 실패하는 테스트 절차는 없다. 새 테스트는 해당 단계 안에서 구현과 함께 쓴다. 18 의 d) 는 고치기 전 실패하는 테스트(busy 중 포커스가 `body`)를 먼저 쓴다.
- 18단계 (리뷰 후속):
  - 버전 배지: `tests/Header.test.tsx` 의 `vi.stubEnv` 값 있음·없음 테스트 통과, `grep -rn "package.json" frontend/src --include='*.ts' --include='*.tsx'` 에 import 없음, `make build` 뒤 `grep -rl 'devDependencies' frontend/.next/static` 출력 없음, `grep -n 'NEXT_PUBLIC_APP_VERSION' frontend/next.config.ts`
  - 줄어든 움직임: `grep -n "behavior" frontend/src/components/chat/ChatMessageList.tsx frontend/src/components/chat/ChatPromptInput.tsx` 가 reduced-motion 조건을 거친 값만, `tests/chat/MobileViewport.test.tsx` 통과
  - 수집 중 초기화 차단·회차 구분: `tests/Header.test.tsx` 또는 `tests/CommandPalette.test.tsx` 에 더한 테스트로 수집 중 팔레트 초기화 명령 비활성, `useCollector` 회차 구분은 이전 회차 진행 응답을 무시하는 테스트(`tests/Header.test.tsx` 또는 `tests/modals/ScheduleModal.test.tsx`, MSW 지연 응답)
  - 확인 창 포커스: `tests/ui/Dialog.test.tsx`(또는 `tests/ui/ConfirmDialog.test.tsx`)의 busy 중·실패 후·완료 후 `document.activeElement` 단언
  - 위 모두 `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 코드 0 안에서

| 요구사항 | 증명 |
|---|---|
| R0 토큰·공통 부품·문서 | `frontend/src/app/globals.css` 의 `:root`·`.dark`·`@theme inline` 블록, `ls frontend/src/components/ui/` 에 spec 2 표의 부품 파일, `tests/ui/Primitives.test.tsx`·`Tabs.test.tsx`·`FormControls.test.tsx`·`Dialog.test.tsx`·`Menu.test.tsx`·`Toast.test.tsx`, `docs/design-system.md` 1~9절 |
| R1 hex·팔레트·`!important` 0 | `frontend/src/tests/design/TokenGuard.test.ts`. 보조 grep: `grep -rEn --include='*.tsx' -e '-\[#[0-9a-fA-F]{3,8}\]' frontend/src` 출력 없음 (패턴이 `-` 로 시작하므로 `-e` 로 넘긴다), `grep -c '!important' frontend/src/app/globals.css` → 0 |
| R2 클래스 하나로 테마 | `tests/ThemeSystem.test.tsx`(기존 단언 그대로: `dark`/`light` 클래스, `data-theme`, 시스템 변경 추종), `tests/design/TokenContrast.test.ts`, `grep -n '@custom-variant dark' frontend/src/app/globals.css`, `grep -n 'agentlens_theme' frontend/src/app/layout.tsx`(인라인 스크립트), `audit/` 의 light·dark PNG |
| R3 가로 스크롤 없음 | `docs/features/ui-redesign/audit/report.json` 의 `scrollWidth <= innerWidth` 가 모든 조합(경로 2 × 테마 2 × 폭 5, 대화상자 열린 상태 포함)에서 true |
| R4 헤더 56px 한 줄 | `audit/report.json` 의 header 높이 ≤64·한 줄 (모든 폭, `/`·`/chat`) |
| R5 첫 화면 카드 | `audit/report.json` 의 390×844 첫 카드 제목·1440×900 첫 줄 카드 판정, `audit/` 대표 PNG |
| R6 터치 영역 44px | `audit/report.json` 의 768 미만 주요 조작 요소 크기 목록 |
| R7 대화상자·Escape·단축키 | `tests/ui/OverlayStack.test.tsx`, `tests/ui/Dialog.test.tsx`, `tests/ui/Menu.test.tsx`, `tests/HotkeyGating.test.tsx`, `tests/modals/*.test.tsx`, 기존 Escape 테스트(`CommandPalette.test.tsx:114`, `chat/ChatHistoryDrawer.test.tsx:87`, `chat/ChatSidebar.test.tsx:219`, `chat/FocusBottomSheet.test.tsx:154`, `chat/CitationBadge.test.tsx:78`, `chat/ChatModelSelector.test.tsx:106`)가 단언 변경 없이 통과, `audit/report.json` 의 대화상자 속성·Escape 판정 |
| R8 확대 허용 | `tests/chat/MobileViewport.test.tsx:18-19`(바꾼 단언), `audit/report.json` 의 viewport 메타 판정, `grep -nE 'maximumScale|userScalable' frontend/src/app/layout.tsx` 출력 없음 |
| R9 기능 위치 | `tests/Header.test.tsx`(더보기 항목·모바일 항목·콜백), `tests/feed/*.test.tsx`, `tests/modals/*.test.tsx`, `tests/chat/ChatHeader.test.tsx`(1024 미만 `새 대화`), `tests/chat/HandoverIntegration.test.tsx`, `audit/report.json` 의 폭별 진입점 판정 (spec 설계 9 표의 항목별) |
| R10 frontend 검사 | 위 명령 종료 코드 0, `pnpm lint` 오류 0 (기준선 54 → 0) |
| R11 localStorage 키 | `grep -rhoE "agentlens_[a-z_]+" frontend/src --include='*.ts' --include='*.tsx' \| sort -u` 결과가 `agentlens_bookmarks`, `agentlens_chat_session_`, `agentlens_chat_sessions_index`, `agentlens_theme`, `agentlens_webhook_url` 뿐 (테스트 파일 제외 시), `ThemeSystem.test.tsx` 의 `agentlens_theme` 단언 통과 |
| R12 계약·의존성 불변 | `git diff main -- backend/` 비어 있음, `git diff main -- frontend/package.json frontend/pnpm-lock.yaml` 비어 있음, `git diff main -- frontend/src/types frontend/src/mocks` 가 01 의 줄(타입 표기)만, `tests/chat/ContractAndMsw.test.ts` 의 `expect(` 줄 무변경으로 통과, `grep -rn 'next/font' frontend/src` 출력 없음, reviewer 가 diff 로 스키마·응답 불변 확인 |
| R13 한국어·라벨 유지 | spec 11.2 의 이름을 찾는 기존 테스트가 단언 변경 없이 통과. `git diff -U0 main -- frontend/src/tests` 에서 기존 테스트 파일의 변경이 아래 표의 줄(단언 아닌 변경 포함)과 `setup.ts`, `ChatHeader.test.tsx` 의 추가뿐 |

테스트 단언·코드를 바꾸는 기존 테스트 파일 (그 외 기존 테스트 줄은 바꾸지 않는다):

| 파일:줄 | 전 | 후 | 이유 |
|---|---|---|---|
| `frontend/src/tests/chat/ChatSidebar.test.tsx:225` (단언 아님) | 테스트 이름에 `bg-indigo-50` | 팔레트 색 이름을 뺀 이름 | `TokenGuard.test.ts`(15) 가 `.tsx` 의 테스트 이름 문자열도 팔레트 클래스로 잡는다. 단언(240-241)은 아래 행대로 우려 사항 1 |
| `frontend/src/tests/chat/ChatSidebar.test.tsx:240-241` | `className` 에 `border-l-indigo-600`, `bg-indigo-50` | `toHaveAttribute('data-active','true')` + `className` 에 `bg-accent-soft`, `border-accent` | 우려 사항 1. R1 이 팔레트 클래스를 금지. 같은 동작(활성 세션 강조)을 의미 토큰으로 계속 검사. spec 승인으로 승인됨 |
| `frontend/src/tests/chat/ChatMessageItem.test.tsx:188` | `className` 에 `emerald` | `toHaveAttribute('data-tone','supplementary')` + `className` 에 `text-success` | 우려 사항 1 (보충 출처 구분) |
| `frontend/src/tests/chat/ChatMessageItem.test.tsx:266` | `className` 에 `bg-slate-100` | `className` 에 `bg-surface-muted` | 우려 사항 1 (인라인 코드 배경) |
| `frontend/src/tests/chat/CitationBadge.test.tsx:99-100` | 주석 + `className` 에 `emerald` | 주석 갱신 + `data-tone="supplementary"` + `text-success` | 우려 사항 1 |
| `frontend/src/tests/chat/ChatWorkspace.test.tsx:261` | `suppCitations[0].className` 에 `emerald` | `data-tone="supplementary"` + `text-success` | 우려 사항 1 |
| `frontend/src/tests/chat/MobileViewport.test.tsx:16-19` | 테스트 이름 "prevents auto-zoom", `maximumScale` 1, `userScalable` false | 이름 "allows user zoom", `maximumScale` undefined, `userScalable` not false | 우려 사항 2. 요구사항(intent 기준 8) 변경 |
| `frontend/src/tests/chat/ContractAndMsw.test.ts:534, 776, 777` | `(s: any)`, `(i: any)` | 구체 타입 | 우려 사항 5. lint `no-explicit-any`, 단언·입력 불변 |
| `frontend/src/tests/chat/ContractAndMsw.test.ts:50, 56` (단언 아님) | — | 타입 import 추가 | 534·776·777 의 `any` 를 구체 타입으로 바꾸려면 그 타입을 가져와야 한다 (01). 런타임·단언 불변 |
| `frontend/src/tests/ThemeSystem.test.tsx:39, 42` | `listener: any` | `(e: MediaQueryListEvent) => void` | 우려 사항 5. 단언·입력 불변 |
| `frontend/src/tests/setup.ts` (추가) | `matchMedia` 없음 | 데스크톱(1280) 기본 `matchMedia` 목, 테스트가 덮어쓸 수 있음 | jsdom 에 없는 브라우저 API 보충. `useMediaQuery` 도입 뒤에도 기존 테스트가 가정하던 데스크톱 화면(사이드바 열림)을 유지. 단언 변경 아님 |
| `frontend/src/tests/setup.ts` (삭제, 단언 아님) | `vi.mock('next/font/google', …)` (Geist·Geist_Mono 목) | 지움 | `layout.tsx` 에서 Geist 를 지워(04) 아무도 `next/font/google` 을 쓰지 않아 목이 쓰이지 않는다 (04·05) |
| `frontend/src/tests/chat/ChatHeader.test.tsx` (추가) | — | 1024 미만 `새 대화` 표시 테스트 | spec 11.3 |

### 2차 증명 (19~28단계, spec 11.5 순서)
- ① `cd frontend && CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0 (R30 ①).
- ② 수정 전 코드(`1ec8a9b`)를 `git worktree` 로 프로덕션 빌드해 같은 backend 데이터로 강화한 스크립트를 돌리면 F1~F4 실패를 보고한다 (R30 ②). 19 가 `audit/baseline-1ec8a9b/report.json` 으로 남기고, verify 가 같은 방법으로 다시 돌려 verify.md 에 명령·요약을 인용한다.
- ③ 2차 구현 뒤 프로덕션 빌드에서 `node scripts/ui-audit.mjs --base http://localhost:3101 --commit <sha>` 종료 0, `audit/report.json` 전체 조합 `pass: true` (R14~R24, R29, R31).
- ④ `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0 (R10, R32). `make check` 는 출력 전체를 붙이되 backend `test_anti_gemini_isolation_*` 2개 실패는 범위 밖(우려 17).
- ⑤ 대표 스크린샷 24장 경로를 verify.md 에 남긴다 (R31).
- 실패 테스트 먼저: `git log --oneline 1ec8a9b..HEAD` 에서 20~26 각 단계의 `test(ui-redesign): NN 실패 테스트` 커밋이 그 단계 구현이 들어간 관문 커밋보다 앞에 있고, 각 task 파일 '검사 결과' 에 실패 출력 요약이 있다. 단계별 예상 실패 이유는 '작업 순서' 각 단계의 '먼저 실패하는 테스트' 에 있다.

| 요구사항 | 증명 |
|---|---|
| R14 툴바 줄 배치, 1440 그룹 안 넘침 | `audit/report.json` 1440 조합의 `scrollRow`(그룹 `카테고리`·`소스` 넘침 없음)·`clip` 실패 0, 기준선 보고의 F1 실패와 비교. `tests/feed/FeedToolbar.test.tsx` 의 `[data-toolbar-row]` 단언 |
| R15 가로 스크롤 줄 | `tests/ui/ChipGroup.test.tsx`(`data-overflow` 네 상태, 마스크 없음, 그룹 밖 버튼, `scrollBy`, `scrollIntoView`), `audit/report.json` 5개 폭 `scrollRow` 실패 0, 기준선 F2 |
| R16 말줄임·자리표시 | `audit/report.json` 5개 폭 `clip`·`placeholder` 실패 0, 기준선 F3. `FeedToolbar.test.tsx`·`AskAiPanel.test.tsx` 의 자리표시 단언 |
| R17 카드 고정 틀 | `tests/NewsCard.test.tsx`(머리줄 배지 없음, 바닥 `인기 점수`, `시사점`), `audit/report.json` 768·1024·1440 `rowAlign` 실패 0, 기준선 F4 |
| R18 반복 시사점 | `tests/feed/FeedInsights.test.ts`, `NewsCard.test.tsx` 의 `preferSummary` 단언, `grep -n "preferSummary" frontend/src/app/page.tsx` |
| R19 카테고리 라벨 한 곳 | `tests/ui/FormControls.test.tsx` 의 `labels` 블록(긴·짧은 라벨), `NewsCard.test.tsx:51`, `chat/ActiveSourceChip.test.tsx:19`, 표 아래 '정적 확인' 의 R19 명령 두 개 출력 없음 (라벨 문구는 `lib/labels.ts` 에만. `FocusBottomSheet` 의 `하네스·평가` 등은 우려 18 로 제외) |
| R20 요약 바·세로 간격 | `tests/feed/InsightsBar.test.tsx`(날짜 `max-md:hidden`, 급상승 `lg`, 데이터 있으면 스켈레톤 없음), `audit/report.json` `vRhythm` 실패 0 |
| R21 줄바꿈·추천 질문·챗 정렬 | `tests/chat/ChatMessageList.test.tsx` 의 `text-left`, `grep -n "keep-all" frontend/src/app/globals.css`, `audit/report.json` `keepAll`·`chatAlign` 실패 0 |
| R22 다시 읽기 중 유지 | `tests/hooks/useNewsFeed.test.tsx`(a)~(d), `InsightsBar.test.tsx` 의 스켈레톤 단언 |
| R23 챗 알림 위치 | `tests/ui/Toast.test.tsx`(`composer` 우선, 모달이면 `global`), `chat/ChatWorkspace.test.tsx:55` 단언 그대로 통과, `audit/report.json` 5개 폭 `toast` 실패 0 |
| R24 `aria-controls` | `tests/chat/ChatHeader.test.tsx`, `tests/ui/Tabs.test.tsx`, `tests/modals/SourcesModal.test.tsx`, `tests/modals/DailyBriefingModal.test.tsx` 의 추가 단언, `audit/report.json` 모든 측정 상태 `ariaControls` 실패 0 |
| R25 겹친 대화상자 순서 | `tests/ui/OverlayStack.test.tsx` 의 같은 렌더 부모·자식(일반·StrictMode) 단언, 1차 Escape 테스트 6곳 단언 변경 없이 통과 |
| R26 Ask AI 입력 Escape | `tests/modals/NewsDetailModal.test.tsx` 추가 단언 (대화상자 남음, 글자 남음, 포커스 패널, 다음 Escape 닫힘) |
| R27 수집 상태 복원 | `tests/hooks/useCollector.test.ts`(a)~(c), `tests/Header.test.tsx` 의 `is_running` 복원 단언 |
| R28 Ask AI 복사 실패 | `tests/AskAiPanel.test.tsx` 의 `copyFailedIndex` 단언 (`복사 실패`, `aria-live="polite"`) |
| R29 판정 강화 | `audit/report.json` 의 조합마다 `checks` 에 그 상태의 14.8 검사 이름(`clip`, `placeholder`, `occluded`, `scrollRow`, `ariaControls`, `keepAll`, 그리고 해당 상태의 `rowAlign`·`vRhythm`·`chatAlign`·`toast`), 측정 상태에 `DIALOGS` 9개(뉴스 상세 탭 2개)와 추가 3개가 있음 |
| R30 판정 검증 | ① `node scripts/ui-audit.mjs --self-test` 종료 0 (`defects.html` 의 모든 `data-expect` 실패, `clean.html` 통과, `dev-indicator.html` 환경 오류). ② `audit/baseline-1ec8a9b/report.json`(`environment.commit` `1ec8a9b`)에 F1(1440 `소스` `scrollRow`/`clip`), F2(390 `카테고리` `scrollRow`), F3(`placeholder` 검색창), F4(`rowAlign`) 실패. verify 가 worktree 로 다시 돌려 같은 결과를 verify.md 에 인용 |
| R31 프로덕션 측정·스크린샷 | `audit/report.json` 의 `environment.devIndicator: false`, `--self-test` 의 `dev-indicator.html` 판정(개발 서버면 종료 2), 표 아래 '정적 확인' 의 PNG 수 24 (`{feed,chat}-{light,dark}-{5개 폭}` 20장 + `{detail,briefing}-light-{390x844,1440x900}` 4장) |
| R32 범위 | `git diff --name-only 1ec8a9b..HEAD -- backend frontend/src/types frontend/src/mocks frontend/src/lib/api.ts frontend/package.json frontend/pnpm-lock.yaml` 0줄, `git diff --name-only 1ec8a9b..HEAD -- frontend/src/tests/setup.ts frontend/next.config.ts frontend/src/app/layout.tsx frontend/src/components/chat/FocusBottomSheet.tsx` 0줄, 1차 R11 의 localStorage 키 grep 결과 그대로, `git diff --name-only 1ec8a9b..HEAD -- frontend backend` 의 모든 경로가 '변경 파일' 2차 목록 안 (reviewer 가 대조), frontend 세 명령 종료 0 |

정적 확인 (저장소 루트에서):
- R19: `grep -rnE "'(Harness|Agent Tech|AI Frontier|MCP & Skills|에이전트 기술|AI 뉴스)'" frontend/src/components frontend/src/lib` 출력 없음
- R19: `grep -rlE "하네스 & 벤치마크|에이전트 아키텍처" frontend/src/components` 출력 없음
- R31: `ls docs/features/ui-redesign/audit/*.png | wc -l` 이 24

2차에서 바꾸는 기존 테스트 줄 (우려 10, spec 승인으로 승인됨. 그 밖의 기존 테스트 줄은 바꾸지 않는다):

| 파일:줄 | 전 | 후 | 단계 | 이유 |
|---|---|---|---|---|
| `frontend/src/tests/ui/FormControls.test.tsx:332` | `expect(categoryLabel('harness')).toBe('Harness')` | `.toBe('하네스 & 벤치마크')` | 22 | R19 긴 라벨 (필터 칩과 같은 문구), R13 한국어 |
| `frontend/src/tests/ui/FormControls.test.tsx:333` | `.toBe('MCP & Skills')` | `.toBe('MCP & 생태계')` | 22 | 같음 |
| `frontend/src/tests/ui/FormControls.test.tsx:334` | `.toBe('Agent Tech')` | `.toBe('에이전트 아키텍처')` | 22 | 같음 |
| `frontend/src/tests/ui/FormControls.test.tsx:335` | `.toBe('AI Frontier')` | `.toBe('최신 AI 동향')` | 22 | 같음 |
| `frontend/src/tests/NewsCard.test.tsx:51` | `screen.getByText('Harness')` | `screen.getByText('하네스')` | 22 | R17·R19 카드 머리줄 짧은 라벨 |
| `frontend/src/tests/chat/ActiveSourceChip.test.tsx:19` | `screen.getByText('mcp_plugins_skills')` | `screen.getByText('MCP')` | 24 | R19, C-3 (원값 표시가 known-issues 결함) |

- 단언을 지우거나 느슨하게 하지 않는다. 같은 `it` 의 나머지 줄과 테스트 이름(예: `FormControls.test.tsx:331` 의 `to the NewsCard labels`, `NewsCard.test.tsx:50` 주석)은 그대로 둔다.
- 확인: `git diff -U0 1ec8a9b -- frontend/src/tests | grep -E '^-[^-]'` 의 결과가 위 6줄과 import 줄(이름 추가로 바뀐 줄)뿐이다. 새로 추가된 테스트 파일 5개(`ui/ChipGroup.test.tsx`, `feed/FeedInsights.test.ts`, `hooks/useNewsFeed.test.tsx`, `hooks/useCollector.test.ts`, `modals/DailyBriefingModal.test.tsx`)는 이 확인에 해당하지 않는다.
- 1차 표의 바뀐 단언(우려 1·2·5)은 2차에서 다시 바꾸지 않는다. `FocusBottomSheet.test.tsx:41-42,90`, `ChatWorkspace.test.tsx:142` 의 포커스 시트 라벨 단언도 그대로다 (우려 18).

### 3차 증명 (29, 20·21·22·23 후속, 27 재측정)
- `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공 (G6·G7).
- 실패 테스트 먼저: `git log --oneline` 에서 `test(ui-redesign): 29 실패 테스트`, `20 후속 (3차) 실패 테스트`, `22 후속 (3차) 실패 테스트`, `23 후속 (3차) 실패 테스트` 커밋이 각 구현이 들어간 관문(G6·G7) 커밋보다 앞에 있고, task 파일 '검사 결과' 에 실패 출력 요약이 있다. 21 후속은 리팩터라 '실패 예상 아님' 으로 적힌다.
- 27 재측정: 27 의 끝 기준 그대로 (`report.json` 모든 조합 `pass: true`, `environment.devIndicator: false`, PNG 24장). 1회차 실패 10건이 0.

| 항목 | 증명 |
|---|---|
| 29 팔레트 자리표시 (R16) | `tests/CommandPalette.test.tsx` 추가 단언 (`명령어 검색 또는 바로가기`, `ESC` 없음), `audit/report.json` 의 `feed-{light,dark}-360x780-command-palette` `placeholder` 실패 0 (1회차 textWidth 269.8 > 260) |
| 29 딥 리서처 지표 (R16) | `tests/modals/DeepResearcherTab.test.tsx` (네 지표 값 상자에 `truncate` 없음, `break-words`), 27 재측정 task 의 360 소스 & 리서처 육안 확인(값 전체 보임)과 스크린샷 경로, `audit/report.json` 소스 대화상자 상태 `clip` 실패 0 |
| 20 후속 넘침 표시 (R15) | `tests/ui/ChipGroup.test.tsx` 추가 (a)(b)(d), `audit/report.json` 5개 폭 `scrollRow`·`occluded`·`clip` 실패 0, R3(`scrollWidth <= innerWidth`) 실패 0, 27 재측정 task 의 390 소스 줄·360/390 카테고리 줄 `›` 육안 확인 |
| 20 후속 선택자·21 후속 (R15) | `tests/ui/ChipGroup.test.tsx` 추가 (c), `tests/ui/Tabs.test.tsx:262-290` 단언 변경 없이 통과와 추가 테스트, `grep -nE "useEffect\|revealTabInRow" frontend/src/components/ui/Tabs.tsx` 출력 없음 |
| 22·23 후속 레이더 라벨 (R19) | `tests/ui/FormControls.test.tsx` 의 `radarCategoryLabel` 단언, `tests/feed/TrendRadarPanel.test.tsx`, 아래 '정적 확인', 27 재측정 task 의 360 레이더 펼침 육안 확인 |
| 23 후속 개별 표시 삭제 (R15) | `tests/feed/FeedToolbar.test.tsx` 의 교체 블록 (표시 정확히 1개, `.group/source` 없음), `grep -nE "data-overflow-hint\|group/source" frontend/src/components/feed/FeedToolbar.tsx` 출력 없음 |
| R32 범위 | 2차 R32 명령 그대로, 그리고 `git diff --name-only 1ec8a9b..HEAD -- frontend backend` 의 모든 경로가 '변경 파일' 2차·3차 목록 안 |

정적 확인 (저장소 루트에서):
- R19 레이더: `grep -n "radarCategoryLabel" frontend/src/components/feed/TrendRadarPanel.tsx` 출력 있음, `grep -nE "^\s*\{cat\.name\}\s*$|title=\{cat\.name\}" frontend/src/components/feed/TrendRadarPanel.tsx` 출력 없음 (`key`·`CategoryIcon name` 의 원값은 데이터 키라 허용)
- R19 라벨 한 곳: `grep -rlE "프로토콜 & 도구|인프라 & 런타임" frontend/src/components` 출력 없음
- 2차 정적 확인 3개 그대로 통과

3차에서 바꾸는 기존 테스트 블록 (그 밖의 기존 테스트 줄은 바꾸지 않는다):

| 파일:줄 | 전 | 후 | 단계 | 이유 |
|---|---|---|---|---|
| `frontend/src/tests/feed/FeedToolbar.test.tsx:154-175` (`describe('FeedToolbar — 768 미만 소스 줄 넘침 표시 (spec 14.3, 후속 2)')`) | `FeedToolbar` 전용 표시: `.group/source` 감싸개, `max-md:group-has-[[data-overflow=end]]/source:flex` 클래스 단언 | 768 미만·넘침 목에서 소스 줄 표시가 정확히 1개, `aria-hidden`, 그룹 밖·정렬 앞, `.group/source` 없음 | 23 후속 | 결함 4: 같은 요구(R15 넘침 알림)를 `ScrollRow` 공통 기능으로 옮겨 구현 위치가 바뀐다. 알리는 동작(줄 밖 장식 표시, 768 미만, 넘칠 때만)은 그대로 단언한다. 이 블록은 2차 23 후속 2(`b20ff3a`)에서 더한 것이라 1ec8a9b 대비 `-` 줄 확인(2차 표 아래)에는 나오지 않는다 |

### 리뷰 후속 증명 (30~37단계)
- ① `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공 (G8·G9·G10). `make check` 는 36 이 한 번 돌려 출력 전체를 붙이되 backend `test_anti_gemini_isolation_*` 2개 실패는 범위 밖 (우려 17).
- ② 실패 테스트 먼저: `git log --oneline e877b6b..HEAD` 에서 `test(ui-redesign): 30 실패 fixture`, `31 실패 테스트`, `32 실패 테스트`, `33 실패 테스트`, `34 실패 테스트`, `35 실패 테스트` 커밋이 각 구현이 들어간 관문(G8·G9) 커밋보다 앞에 있고, 각 task 파일 '검사 결과' 에 실패 출력 요약(예상 이유와 같음)이 있다. '실패 예상 아님' 테스트는 task 에 그렇게 적혀 있다.
- ③ `cd frontend && CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0 — `defects.html` 의 새 `data-expect="clip"` 3개(세로·가로로 잘린 스크롤 영역, 잘린 배지 줄)가 `clip` 실패, `clean.html`(고친 형태와 알파 0 배경 감싸개 포함) 실패 0 (R30 ①).
- ④ 수정 전 기준선: `audit/baseline-1ec8a9b/report.json`(`environment.commit` `1ec8a9b`)에 F1~F4 실패가 있다 (R30 ②). verify 가 같은 방법으로 다시 돌려 verify.md 에 명령·요약을 인용한다.
- ⑤ HEAD 프로덕션: `audit/report.json` 의 모든 조합 `pass: true` (판정 ④·알파 판정 포함), `environment.devIndicator: false`, PNG 24장 (R29·R31). 36 task 에 배지 줄 결함의 프로덕션 재현 여부가 적혀 있다.
- ⑥ **verify 의 Chrome 키보드 포커스 확인 (우려 21, R15·R33)**. ui-audit 은 키보드 포커스를 재지 않으므로 verify 가 프로덕션 빌드(36 과 같은 실행 환경)를 Chrome 으로 열어 직접 확인하고, 각 항목의 결과(`document.activeElement` 의 태그·접근 이름·값)와 스크린샷 경로를 verify.md 에 적는다. 방법은 Chrome DevTools MCP 나 `puppeteer-core` 스크립트(scratchpad) 중 하나이고, 키는 실제 키 입력(`Tab`, `Enter`)으로 보낸다 (`element.click()` 이나 `focus()` 호출로 대신하지 않는다). 확인하지 못한 항목은 미검증으로 적고 통과로 보고하지 않는다.
  1. 1024×768 `/`: `Tab` 으로 `카테고리 다음 항목 보기` 에 포커스 → `Enter` 를 줄 끝에 닿을 때까지 반복 → `다음` 버튼이 사라진 뒤 `document.activeElement` 가 `카테고리 이전 항목 보기` 버튼이다 (`body` 가 아니다). 1024 에서 카테고리 줄이 넘치지 않으면 소스 줄의 `소스 다음 항목 보기` 로, 그것도 넘치지 않으면 768×1024 에서 같은 절차를 하고 그 사실을 적는다.
  2. 1 의 상태(이전 버튼에 포커스)에서 창(뷰포트) 폭을 767 이하로 줄이면 두 버튼이 사라지고 `document.activeElement` 가 그 줄의 선택 칩(`aria-pressed="true"`)이다.
  3. 소스 줄: `Must-Read` 를 켜고 오른쪽 끝 쪽 소스 칩(예: `북마크`)을 고른 상태에서 다시 그리면(새로고침 없이 폭을 바꾸거나 다른 필터를 눌렀다 돌아옴) 줄이 그 소스 칩이 보이게 스크롤되고, `Must-Read` 만 끄고 켤 때 줄의 `scrollLeft` 가 바뀌지 않는다.
  4. 툴바 폭 전환 (R33): 1440 `/` 에서 `/` 키로 검색에 포커스하고 글자를 입력 → 포커스를 둔 채 뷰포트 폭을 1440 → 1024 → 360 으로 바꾼다 (DevTools 기기 모드나 `Emulation.setDeviceMetricsOverride`, 포커스를 옮기는 동작 없이) → 매번 input 노드·포커스·값과 칩 줄 노드가 유지된다 (`document.activeElement` 가 같은 검색 입력이고 값이 남아 있음. `scrollLeft` 는 R15 의 선택 칩 다시 보이기 규칙을 따른다, spec 보정 4).
  5. 각 폭(360·1024·1440)에서 `Tab` 순서가 카테고리 칩들 → 검색 입력(값이 있으면 `검색어 지우기`) → `Must-Read`·소스 칩들 → 정렬 이고, 화면의 읽는 순서와 같다.
  6. 1024 에서 새로고침 직후와 1초 뒤 검색 입력·정렬 선택창의 rect 가 같다 (하이드레이션 뒤 배치가 바뀌지 않음).
- ⑦ 기존 테스트 단언 불변 (spec 14.9): `git diff -U0 e877b6b -- frontend/src/tests | grep -E '^-[^-]'` 의 결과가 import 줄(이름 추가로 바뀐 줄)뿐이다. 새 테스트 파일은 없다. (보정 3 뒤에는 아래 표의 보정 3 다섯 곳이 더해진다. 그 확인은 표 아래 `2034bcc` 기준 명령이다.)

| 요구사항 | 증명 |
|---|---|
| R15 스크롤 버튼 포커스 유지·선택 칩 | `tests/ui/ChipGroup.test.tsx` 추가 ①~④, `tests/feed/FeedToolbar.test.tsx` 추가 ①, `Tabs.test.tsx:249`·`ChipGroup.test.tsx:176,188` 단언 그대로 통과, ⑥ 의 1·2·3 |
| R16·R17 배지 줄 | `tests/NewsCard.test.tsx` 배지 줄 클래스 단언, `tests/ui/Primitives.test.tsx` 의 `Badge shrink` 단언, ③ 의 배지 줄 fixture, `audit/report.json` 768·1024·1440 `clip` 실패 0, 36 task 의 프로덕션 재현 여부와 1024 육안 확인 |
| R23 한 번만 알림 | `tests/ui/Toast.test.tsx` 추가 (옮겨진 알림 live 속성 없음, 새 알림은 있음), 기존 `Toast.test.tsx`·`chat/ChatWorkspace.test.tsx:55` 단언 그대로 통과, 아래 정적 확인, `audit/report.json` `toast` 실패 0 |
| R27 오래된 상태 응답 | `tests/hooks/useCollector.test.ts` 추가 ①②, 26 의 기존 테스트 그대로 통과 |
| R29 `clip` ④·`chatAlign` 알파 | ③, ⑤ (`report.json` 조합마다 `checks.clip`·`checks.chatAlign` 이 있고 실패 0) |
| R30 판정 검증 | ③, ④ |
| R33 툴바 한 트리 | `tests/feed/FeedToolbar.test.tsx` 추가 ②③④, 아래 정적 확인, `audit/report.json` 5개 폭 `scrollRow`·`clip`·`placeholder`·`vRhythm`·R3·R5 실패 0, 36 의 툴바 배치 육안 확인, ⑥ 의 4·5·6 |
| R32 범위 | 2차 R32 명령 그대로, `git diff --name-only 1ec8a9b..HEAD -- frontend backend` 의 모든 경로가 '변경 파일' 2차·3차·리뷰 후속 목록 안, 아래 '바꾸지 않는 것' 확인 |

정적 확인 (저장소 루트에서):
- R33: `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx` 출력 없음 (spec R33 의 `\|` 표기는 rg 에서 늘 출력이 없으므로 이 명령을 쓴다)
- R15 소스 줄: `grep -c 'data-source-chip' frontend/src/components/feed/FeedToolbar.tsx` 가 1 이상이고 `grep -n 'selectedSelector' frontend/src/components/feed/FeedToolbar.tsx frontend/src/components/ui/Chip.tsx` 출력 있음
- R23: `grep -nE "announcedBy\.(delete|clear)" frontend/src/components/ui/Toast.tsx` 가 `dismissToast`·`clearToasts` 안의 줄을 보인다
- R17: `grep -n 'data-card-badges' frontend/src/components/NewsCard.tsx` 출력 있음, `grep -rn 'shrink-0' frontend/src/components/NewsCard.tsx` 에 기술 배지 줄이 없음
- 바꾸지 않는 것: `git diff --name-only e877b6b..HEAD -- frontend/src/lib/cn.ts frontend/src/components/ui/Tabs.tsx frontend/src/tests/ui/Tabs.test.tsx frontend/src/components/ui/IconButton.tsx frontend/src/app/page.tsx` 0줄
- 2차·3차 정적 확인 그대로 통과

리뷰 후속에서 바꾸는 기존 단언 (spec 14.9: 없음. 구현 중 바꿔야 할 단언이 나오면 멈추고 task 를 `blocked` 로 두고 이 표에 행을 더해 재승인받는다):

| 파일:줄 | 전 | 후 | 단계 | 이유 |
|---|---|---|---|---|
| (없음) | — | — | — | 30~35 의 테스트는 모두 새 `it`/`describe`·도우미·import 이름 추가다. 기존 `FeedToolbar.test.tsx` 단언(줄 소속은 카테고리·소스가 다른 줄인지만 봄, 360 블록의 정렬·표시 위치)은 한 트리 배치에서도 그대로 성립한다 (우려 20). `ChipGroup.test.tsx:176,188`·`Tabs.test.tsx:249` 는 버튼을 지금처럼 넘친 쪽에만 렌더하므로 그대로다 |
| `frontend/src/tests/ui/ChipGroup.test.tsx:287` | `bleed` 줄(넘치지 않음) `className` 에 `max-md:scroll-px-4` | `scroll-px-6` (폭 접두 없음). `:285-286`(`max-md:-mx-4`·`max-md:px-4`)은 그대로 | 31 후속 3 (보정 3) | 스냅 여백 = 흐림 폭 24px, 모든 폭·모든 줄 (spec 14.3 보정 3, 14.13). 16px 는 스냅 위치의 선택 칩 왼쪽 약 8px 가 흐림에 겹친 원인 (31 후속 2 보고). 우려 24 로 승인 |
| `frontend/src/tests/ui/ChipGroup.test.tsx:328` | `bleed="start"` 줄 `className` 에 `max-md:scroll-pl-4` | `scroll-px-6`. `:326-327`, `:329-331` 은 그대로 | 31 후속 3 (보정 3) | 위와 같음 |
| `frontend/src/tests/ui/ChipGroup.test.tsx:368` | 768 미만 `both` 에서 `[data-overflow-hint]` 1개 | 2개: `data-overflow-hint="start"` 가 그룹 앞, `"end"` 가 그룹 뒤 (둘 다 그룹 밖, `aria-hidden`) | 31 후속 3 (보정 3) | 768 미만 넘친 쪽마다 표시 (spec 14.3 보정 3-1). 오른쪽에만 두면 왼쪽에 숨은 칩(360·390 소스 줄 `Must-Read`, 36 재측정 3)의 단서가 없다. 우려 24 로 승인 |
| `frontend/src/tests/ui/ChipGroup.test.tsx:388-396` (테스트 (d) 의 제목 `:388` 과 `start` 부분 `:396`) | 768 미만 `start` 에서 `[data-overflow-hint]` 없음. 제목 `(d) draws no hint at start, none, or at >=768px where the next button shows instead` | `start` 에서 `data-overflow-hint="start"` 1개가 그룹 앞. 제목 `draws only the start hint at start, none when it fits, and buttons instead at >=768px`. 같은 테스트의 `none`(`:399-404`)·768 이상(`:406-410`) 부분은 그대로 | 31 후속 3 (보정 3) | 위와 같음 |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:142` | 소스 줄 `toHaveClass('max-md:-ml-4', 'max-md:pl-4', 'max-md:scroll-pl-4')` | `toHaveClass('max-md:-ml-4', 'max-md:pl-4', 'scroll-px-6')`. `:143-144` 는 그대로 | 34 후속 (보정 3) | `:287` 과 같음. `ScrollRow` 가 바꾸는 클래스를 소비자 테스트가 단언한다 (파일 소유가 34 라 E 가 31 후속 3 뒤에 바꾼다) |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:50` (테스트 제목) | `shows Must-Read first in the source group and toggles it` | `shows the Must-Read toggle outside the source group, between the source row and sort, and toggles it` | 34 후속 3 (보정 5) | R34: Must-Read 는 소스 그룹 첫 칩이 아니라 그룹 밖 토글 (제품 오너 결정 2026-11-07, spec 14.14). 우려 25 로 승인 |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:52-55` | 소스 그룹 버튼 `chips[0]` 이 `Must-Read` 이고 `aria-pressed="false"` | `getByRole('button', { name: 'Must-Read' })` 가 `aria-pressed="false"`, 소스 그룹 안에 없음(`within(group).queryByRole('button', { name: 'Must-Read' })` 가 null), 소스 그룹과 같은 `data-toolbar-row` 에서 소스 그룹 뒤·정렬 선택창 앞 (DOM 순서) | 34 후속 3 (보정 5) | 위와 같음. 접근 이름·`aria-pressed` 단언 세기는 같다 |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:57` | 소스 그룹 칩 글자 `['Must-Read', '전체7', 'GitHub5', 'arXiv2', '북마크2']` | `['전체7', 'GitHub5', 'arXiv2', '북마크2']` (건수 있는 소스만·전체·북마크 규칙 그대로) | 34 후속 3 (보정 5) | 위와 같음 |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:59` | `fireEvent.click(chips[0])` | `fireEvent.click(` Must-Read 토글 `)`. `:60-61` 의 콜백 단언(`onHighSignalChange(true)`, `onPageChange(1)`)은 그대로 | 34 후속 3 (보정 5) | 위와 같음 |
| `frontend/src/tests/ui/ChipGroup.test.tsx:619` (단언의 준비 줄) | 입력 없이 `setScrollLeft(group, 10)` 을 사용자 스크롤로 다룸 | `fireEvent.wheel(group)` 뒤 `setScrollLeft(group, 10)`. `:622` `expect(group.scrollLeft).toBe(10)` 과 `:624-625` 는 그대로 | 31 후속 4 (보정 5) | 사용자 스크롤 = 입력 신호 뒤 `scroll` (spec 14.3 보정 5). 입력 없는 `scrollLeft` 변경은 브라우저 자르기·스냅 재맞춤과 구별할 수 없어 사용자 스크롤이 아니다. '사용자가 민 위치를 끌어오지 않음' 은 입력 신호를 넣어 같은 세기로 남긴다. 31 후속 4 가 이 충돌로 blocked 였다(`0330596`). 우려 25 로 승인 |
| `frontend/src/tests/ui/ChipGroup.test.tsx:619` (보정 6, 준비 줄) | `fireEvent.wheel(group);` 뒤 `setScrollLeft(group, 10)` | `fireEvent.wheel(group, { deltaX: 40 });` (뒤의 `setScrollLeft`, `:622` `toBe(10)`, `:624-625` 그대로) | 31 후속 5 (보정 6) | `wheel` 은 가로 의도일 때만 입력 신호 (spec 14.3 보정 5-1 보정 6). `deltaX`·`deltaY` 가 모두 0 인 휠은 세로로 읽혀 신호가 아니고, 다시 보이기가 `scrollLeft` 를 바꿔 `:622` 가 깨진다. 테스트의 뜻('사용자가 민 위치를 끌어오지 않음')은 가로 휠이어야 성립한다. 우려 25 로 승인 (spec 14.14 보정 6 표) |
| `frontend/src/tests/ui/ChipGroup.test.tsx:950` (보정 6, 테스트 ③ 의 준비 줄) | `fireEvent.wheel(group);` | `fireEvent.wheel(group, { deltaX: 40 });` (`:951-957` 그대로) | 31 후속 5 (보정 6) | 그대로 두면 `:957` 은 통과하지만 휠이 처음부터 신호가 아니어서 '1,000ms 시간 끝' 을 검사하지 않게 된다 (검사가 약해짐). 가로 휠로 바꿔 시간 끝 판정을 계속 검사한다. 우려 25 로 승인 |

- 보정 3 다섯 줄은 spec 14.13 표와 우려 24 로 승인됐다. 단언을 지우거나 느슨하게 하지 않고 새 규칙을 같은 세기로 단언한다. 위 다섯 곳 밖의 기존 단언은 그대로 통과해야 한다 — 특히 768 미만 `end` 표시 1개(`ChipGroup.test.tsx:357-363`, `Tabs.test.tsx:373-379`, `FeedToolbar.test.tsx:211-215`), `bleed` 줄 `end` 클래스(`ChipGroup.test.tsx:383-385`), 스냅 알고리즘 테스트(`ChipGroup.test.tsx:670-704`, `mockSnapStyles('16px')`). `:649` 는 주석이다.
- 확인: `git diff -U0 2034bcc -- frontend/src/tests | grep -E '^-[^-]'` 의 결과가 위 다섯 곳(`ChipGroup.test.tsx` 의 `:287`, `:328`, `:368`, `:388`, `:396` 과 `FeedToolbar.test.tsx:142`)과 import 줄(이름 추가)뿐이다. (보정 5 뒤에는 표의 보정 5 다섯 곳이 더해진다. 그 확인은 '보정 5 증명' 의 `e274563` 기준 명령이다.)

### 보정 3 증명 (31 후속 3, 34 후속, 30 후속 2, 36 재측정 4, spec 14.13)
- ① `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공 (G11·G12).
- ② 실패 테스트 먼저: `git log --oneline 2034bcc..HEAD` 에서 `test(ui-redesign): 31 후속 3 실패 테스트`, `test(ui-redesign): 30 후속 2 실패 fixture` 커밋이 각 구현이 들어간 관문(G11) 커밋보다 앞에 있고, `31-scroll-focus.md` '후속 3'·`30-audit-clip-scroll.md` '후속 2' 의 '검사 결과' 에 실패 출력 요약이 있다. `34-toolbar-single-tree.md` '후속' 에 `:142` 가 31 후속 3 뒤 실패한 출력이 있다.
- ③ `cd frontend && CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0 — 지금 폭과 360 폭 모두에서 `defects.html` 의 보정 3 결함 3종(왼쪽 표시 없는 줄, 줄을 덮는 표시, 흐림에 겹친 선택 칩)이 `scrollRow`(덮는 표시는 `occluded` 도) 실패, `clean.html` 실패 0 (R30 ①).
- ④ HEAD 프로덕션 (36 재측정 4): `audit/report.json` 모든 조합 `pass: true` (보정 3 `scrollRow` 판정 포함, R29), `feed-{light,dark}-{360x780,390x844}` 의 `checks.scrollRow` 에 소스 줄 `{ mustReadHidden, startHint }` 가 있고 `mustReadHidden` 이 true 면 `startHint` 가 true, PNG 24장. verify 는 이 값과 `feed-light-360x780.png`·`feed-light-390x844.png` 를 verify.md 에 인용한다. (보정 5 뒤에는 `mustReadHidden`·`startHint` 대신 '보정 5 증명' ④ 의 `toolbar.mustReadVisible` 로 대신한다.)
- ⑤ 수정 전 기준선: `audit/baseline-1ec8a9b/report.json` 을 보정 3 판정으로 다시 쟀고(`environment.commit` `1ec8a9b`) F1~F4 실패가 그대로 있다 (R30 ②).
- ⑥ verify 의 Chrome 확인 (리뷰 후속 ⑥ 에 더함, 실제 프로덕션 빌드·실제 터치 스크롤 또는 `scrollLeft` 조작, 결과·스크린샷 경로를 verify.md 에): 360·390 `/` 처음 상태 소스 줄에서 `Must-Read` 가 왼쪽 밖이면 왼쪽 `‹` 가 보이고 칩을 덮지 않음, 소스 줄을 왼쪽 끝까지 밀면 `‹` 가 사라지고 `Must-Read` 가 보이며 그때 칩이 옆으로 튀지 않음, 선택 칩 왼쪽이 흐림에 겹치지 않음, 리뷰 후속 ⑥ 의 2(폭을 767 이하로 줄이면 포커스가 선택 칩으로)가 보정 3 뒤에도 그대로. 확인하지 못한 항목은 미검증으로 적는다.

| 요구사항 | 증명 |
|---|---|
| R15 768 미만 넘친 쪽마다 표시·표시 쪽 `bleed` | `tests/ui/ChipGroup.test.tsx` 의 바뀐 `:368`·`:388-396` 과 새 단언 ①~④·⑥, `tests/feed/FeedToolbar.test.tsx` 의 새 왼쪽 표시 단언, 기존 `end` 1개 단언 3곳 그대로 통과, ④ 의 `scrollRow`·`occluded`·`clip`·R3 실패 0, ④ 의 `mustReadHidden`·`startHint`, ⑥ |
| R15 흐림 = 스냅 여백 24px | `ChipGroup.test.tsx` 의 바뀐 `:287`·`:328` 과 새 단언 ⑤, `FeedToolbar.test.tsx:142`, 아래 정적 확인, ④ 의 선택 칩 판정(흐림 밖)·`scroll-padding` 판정 실패 0 |
| R29·R30 판정 | ③, ④, ⑤ |
| R32 범위 | 리뷰 후속 R32 행 그대로 (보정 3 은 새 경로 없음) |

정적 확인 (저장소 루트에서):
- `grep -nE "scroll-p[lx]-4" frontend/src/components/ui/ScrollRow.tsx` 출력 없음, `grep -n "scroll-px-6" frontend/src/components/ui/ScrollRow.tsx` 출력 있음
- `grep -n "data-selected-selector" frontend/src/components/ui/ScrollRow.tsx frontend/scripts/ui-audit.mjs` 두 파일 모두 출력 있음
- `grep -n "data-overflow-slot" frontend/src/components/ui/ScrollRow.tsx` 출력 있음
- `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx` 출력 없음 (34 후속 뒤에도)
- `git diff --name-only 2034bcc..HEAD -- frontend/src/components/ui/Chip.tsx frontend/src/components/ui/Tabs.tsx frontend/src/tests/ui/Tabs.test.tsx` 0줄

### 보정 5 증명 (34 후속 3, 31 후속 4, 30 후속 4, 36 재측정 5, 30 후속 3, spec 14.14)
- ① `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공 (G13·G14).
- ② 실패 테스트 먼저: `git log --oneline e274563..HEAD` 에서 `test(ui-redesign): 34 후속 3 실패 테스트`, `31 후속 4 실패 테스트`, `30 후속 4 실패 fixture` 커밋이 각 구현이 들어간 관문(G13) 커밋보다 앞에 있고 task 절('후속 3'·'후속 4'·'후속 4')에 실패 출력 요약이 있다. 30 후속 3 은 `3a393df`(fixture) 가 `345112d`(수정)보다 앞이고 `30-audit-clip-scroll.md` '후속 3' 에 수정 전 MISS 출력이 있다 (확인함).
- ③ `cd frontend && CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0 — 지금 폭과 360 폭에서 '숨은 Must-Read' 툴바가 `scrollRow` 실패, 30 후속 3 의 360 `clip` fixture 가 `clip` 실패, `clean.html` 두 폭 실패 0 (R30 ①).
- ④ HEAD 프로덕션 (36 재측정 5): `audit/report.json` 모든 조합 `pass: true` (30 후속 3 의 `clip` ① 변경과 `mustReadVisible` 판정 포함, R29), `/` 처음 상태 10조합(5개 폭 × 2테마) 모두 `checks.scrollRow.toolbar.mustReadVisible: true`, 360·390 토글 rect ≥ 44×44 (R34·R6), PNG 24장. verify 는 이 값과 360·390 라이트 스크린샷을 verify.md 에 인용한다.
- ⑤ 수정 전 기준선: `audit/baseline-1ec8a9b/report.json` 을 보정 5 판정으로 다시 쟀고 F1~F4 실패가 그대로 있다 (R30 ②).
- ⑥ **verify 의 Chrome 확인 (보정 5, spec 14.14 측정·우려 26)**. 프로덕션 빌드를 Chrome 으로 열고 결과(`scrollLeft` 값, `document.activeElement`, 스크린샷 경로)를 verify.md 에 적는다. 확인하지 못한 항목은 미검증으로 적고 통과로 보고하지 않는다.
  1. 사용자 스크롤 (터치·휠): 360 `/` 에서 DevTools 터치 에뮬레이션으로 소스 줄과 카테고리 줄을 손가락으로 민 뒤 폭을 1440 → 360 처럼 바꾸면 민 위치가 남는다 (선택 칩으로 끌어오지 않음). 768 이상에서는 마우스 휠(가로 휠 또는 Shift+휠)로 민 뒤 폭을 바꿔 같은 것을 본다.
  2. 입력 없는 `scroll` 뒤 다시 보이기: 360 `/` 를 손대지 않고(입력 없이) 1440 → 360 으로 바꾸면 소스·카테고리 줄의 선택 칩이 흐림 밖에 다 보인다. 줄을 좁혀 브라우저가 `scrollLeft` 를 자른 뒤에도 다음 폭 변화에서 선택 칩이 다시 보인다.
  3. 모든 폭 첫 화면 Must-Read: 360·390·768·1024·1440 `/` 처음 상태(스크롤 0, 조작 전)에서 Must-Read 토글 전체가 화면과 툴바 안에 보이고, 360·390 은 별 아이콘만이며 접근 이름이 `Must-Read` 이고 크기 ≥ 44×44.
  4. Tab 순서: 각 폭에서 `Tab` 으로 지나갈 때 소스 줄의 칩(과 768 이상의 스크롤 버튼) → Must-Read → 정렬 순서이고 화면 순서와 같다 (리뷰 후속 ⑥-5 의 순서에 Must-Read 가 소스와 정렬 사이로 들어간다).
  5. 리뷰 후속 ⑥ 의 1·2(스크롤 버튼 포커스 유지)와 4(폭 전환 시 input 노드·포커스·값 유지)가 보정 5 뒤에도 그대로.
- ⑦ 기존 단언: `git diff -U0 e274563 -- frontend/src/tests | grep -E '^-[^-]'` 의 결과가 표의 보정 5 다섯 곳(`FeedToolbar.test.tsx` 의 `:50`, `:52-55`, `:57`, `:59`, `ChipGroup.test.tsx:619`)과 import 줄뿐이다. 표 밖 단언(특히 `ChipGroup.test.tsx` 의 입력 없는 `setScrollLeft` 12곳을 쓰는 테스트, `FeedToolbar.test.tsx` 의 :139-151·:203-217·:219-263·:365-381·:383-402·:404-411·:413-424)은 그대로 통과한다. (보정 6 뒤에는 `ChipGroup.test.tsx:619`·`:950` 의 휠 입력 변경이 더해진다. 그 확인은 '보정 6 증명' 의 `db97826` 기준 명령이다.)

| 요구사항 | 증명 |
|---|---|
| R34 Must-Read 고정 토글 | `tests/feed/FeedToolbar.test.tsx` 의 바뀐 `:50·:52-55·:57·:59` 와 새 단언, ④ 의 `mustReadVisible`·44×44, `clip`·`occluded` 실패 0, ⑥-3·4, 아래 정적 확인 |
| R15·R33 사용자 스크롤 = 입력 신호 뒤 `scroll` | `tests/ui/ChipGroup.test.tsx` 의 바뀐 `:619` 와 새 단언 ①~④, 표 밖 단언 그대로 통과(⑦), ⑥-1·2·5 |
| R33 DOM 순서 | `FeedToolbar.test.tsx` 새 `it`(소스 → Must-Read → 정렬, 세 폭), `:404-411` 그대로 통과, ⑥-4 |
| R29·R30 판정 (`mustReadVisible`, `clip` ① 768 이상 면제) | ③, ④, ⑤ |
| R32 범위 | 리뷰 후속 R32 행 그대로 (보정 5 는 새 경로 없음) |

정적 확인 (저장소 루트에서):
- `grep -n "data-must-read-toggle" frontend/src/components/feed/FeedToolbar.tsx frontend/scripts/ui-audit.mjs` 두 파일 모두 출력 있음, `grep -n "w-px" frontend/src/components/feed/FeedToolbar.tsx` 출력 없음 (구분선 삭제)
- `grep -nE "mustReadHidden|startHint" frontend/scripts/ui-audit.mjs` 출력 없음
- `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx` 출력 없음
- `sed -n '/^## UI·접근성/,/^## 테스트·운영/p' docs/known-issues.md | grep -c 'Must-Read'` 가 0 (37 후속 2)
- `git diff --name-only e274563..HEAD -- frontend/src/components/ui/Chip.tsx frontend/src/components/ui/Tabs.tsx frontend/src/tests/ui/Tabs.test.tsx frontend/src/app/page.tsx` 0줄

### 보정 6 증명 (31 후속 5, 36 재측정 6, 37 후속 3, spec 보정 6)
- ① `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공, `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0 (G15·G16).
- ② 실패 테스트 먼저: `git log --oneline db97826..HEAD` 에서 `test(ui-redesign): 31 후속 5 실패 테스트` 커밋이 구현이 들어간 G15 커밋보다 앞에 있고, `31-scroll-focus.md` '후속 5' 에 새 단언 ⑤ 의 실패 출력 요약이 있다.
- ③ 기존 단언: `git diff -U0 db97826 -- frontend/src/tests | grep -E '^-[^-]'` 의 결과가 `ChipGroup.test.tsx:619`·`:950` 두 줄과 import 줄뿐이다. 표 밖 단언은 그대로 통과한다.
- ④ 측정 (36 재측정 6, 권장): 측정했으면 `audit/report.json` 모든 조합 `pass: true`, `/` 10조합 `toolbar.mustReadVisible: true`, `environment.commit` 이 G15 뒤 커밋, PNG 24장. 측정하지 못했으면 `36-prod-audit-3.md` '재측정 6' 과 verify.md 에 '미측정, 대체 증거(① 과 31 후속 5 의 Chrome 확인)' 로 적는다 (통과로 보고하지 않는다). 1ec8a9b 기준선은 판정 불변이라 보정 5 결과를 그대로 쓴다 (`git diff --stat 3cedad0 HEAD -- frontend/scripts` 출력 없음).
- ⑤ spec 14.8 `clip` ① 문구 정정 (Nit 1): 코드 변경 없음. `git diff --name-only db97826..HEAD -- frontend/scripts` 0줄, `sed -n 795,797p frontend/scripts/ui-audit.mjs` 에 `vw >= k.scrollButtonMinWidth` 가 있다 (spec 14.8 의 '768 이상에서만' 과 같다).
- ⑥ **verify 의 Chrome 확인 (보정 6, spec 14.14 측정)**: 프로덕션 빌드에서 실제 입력으로 확인하고 결과(`scrollLeft` 값, 스크린샷 경로)를 verify.md 에 적는다. 확인하지 못한 항목은 미검증.
  1. 1024 이상 `/` 에서 소스 줄을 Shift+휠(가로 휠)로 민 뒤 창 폭을 바꾸면 민 위치가 남는다.
  2. 1024 에서 sticky 툴바 위에 포인터를 두고 페이지를 세로 휠로 내린 직후 창 폭을 바꾸면 소스·카테고리 줄의 선택 칩이 다시 흐림 밖에 다 보인다.
  3. 보정 5 ⑥ 의 1(터치 에뮬레이션으로 민 위치 유지)·2(입력 없는 폭 변화 뒤 다시 보이기)가 그대로.
- ⑦ reviewer 최종 Nit 3 (30 후속 3 사후 기록): `docs/features/ui-redesign/verify.md` 의 편차 C 행(30 후속 3 이 plan 에 오르기 전에 구현됨, plan 보정 5 가 사후로 넣음)이 있다. 이 보정에서 따로 할 일은 없다.

| 요구사항 | 증명 |
|---|---|
| R15·R33 가로 의도 휠만 입력 신호 | `tests/ui/ChipGroup.test.tsx` 의 바뀐 `:619`·`:950` 과 새 단언 ⑤⑥, ③, 31 후속 5 의 Chrome 확인 ①②, ⑥ |
| R29 `clip` ① 면제 768 이상 (문구 정정) | ⑤, 보정 5 증명 ③(30 후속 3 의 360 `clip` fixture) |
| R32 범위 | 리뷰 후속 R32 행 그대로 (보정 6 은 새 경로 없음, 바뀌는 파일 `ScrollRow.tsx`·`ChipGroup.test.tsx` 와 문서 3개) |

정적 확인 (저장소 루트에서):
- `grep -rn "fireEvent.wheel(group)" frontend/src/tests` 출력 없음
- `grep -nE "deltaX|shiftKey" frontend/src/components/ui/ScrollRow.tsx` 출력 있음
- `git diff --name-only db97826..HEAD -- frontend/src frontend/scripts` 의 경로가 `frontend/src/components/ui/ScrollRow.tsx`·`frontend/src/tests/ui/ChipGroup.test.tsx` 뿐 (보정 6 범위. 보정 7 뒤에는 '보정 7 증명' 의 `8d643d2` 기준 명령으로 본다)

### 보정 7 증명 (38~44단계, spec 14.15)
- ① `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공, `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0 (G18·G19).
- ② 실패 테스트 먼저: `git log --oneline 8d643d2..HEAD` 에서 `test(ui-redesign): 38 실패 fixture`, `39 실패 테스트`, `40 실패 테스트`, `41 실패 테스트`, `42 실패 테스트` 커밋이 각 구현이 들어간 관문(G17·G18) 커밋보다 앞에 있고, 각 task '검사 결과' 에 실패 출력 요약이 있다.
- ③ `--self-test`: 보정 7 fixture 6종(좁은 소스 줄 360, RSS 합성 점수, 넘친 모드 탭 360, 영어 용어, 두 번 나온 모델 선택, 다른 포커스 라벨)이 각 검사에서 실패하고, `clean.html` 이 두 폭에서 실패 0 (사용자 글 면제·숨긴 버튼 미집계 확인 포함) (R30 ①).
- ④ HEAD 프로덕션 (43): `audit/report.json` 의 160조합 모두 `pass: true`, 새 검사 6개가 해당 상태 조합마다 `checks` 에 있음, `/` 10조합 `toolbar.mustReadVisible: true`, 360·390 `toolbarLayout.source` 의 보이는 폭·다 보이는 칩 수·토글 top 값, `cardMetric.summary`, PNG 24장. verify 가 이 값과 360·390 피드·360 챗·1440 챗 라이트 스크린샷을 인용한다.
- ⑤ **회귀 증명 (spec 14.15, R30 ② 와 같은 방법)**: verify 단계에서 spec 승인 커밋 `8d643d2`(보정 7 앱 수정 전)를 `git worktree add <scratchpad> 8d643d2` 로 프로덕션 빌드해 띄우고, 보정 7 의 ui-audit(현재 브랜치 파일)를 같은 backend 데이터로 돌린다. 360·390 `toolbarLayout`, `cardMetric`, 360 `chatScope`, `terms`, 768 이상 `modelPicker`, `focusLabels` 실패가 보고되어야 하고, 고친 HEAD 에서는 같은 명령으로 전 조합 실패 0 이어야 한다. verify.md 에 두 실행의 명령·요약을 인용한다. 첫 화면에 `github` 카드가 없으면 `cardMetric` ④ 는 fixture(③)로만 증명했다고 적는다. 38 의 사전 측정(같은 커밋, 커밋하지 않은 결과)은 예비 실행이고 verify 가 다시 돌린다.
- ⑥ 수정 전 기준선: `audit/baseline-1ec8a9b/report.json` 을 보정 7 판정으로 다시 쟀고 F1~F4 실패가 그대로 있다.
- ⑦ 기존 단언: `git diff -U0 8d643d2 -- frontend/src/tests | grep -E '^-[^-]'` 의 결과가 아래 표의 줄과 import 줄뿐이다. 표 밖 기존 단언은 그대로 통과한다.
- ⑧ 사람 검토: 43 의 스크린샷 24장(특히 `feed-light-360x780.png`, `feed-dark-390x844.png`, `chat-light-360x780.png`, `chat-light-1440x900.png`)을 verify 에서 사람이 본다. F2(768·1024 칩 줄 끝 잘림)는 바꾸지 않은 결정이라 그대로 보인다 (우려 29).

| 요구사항 | 증명 |
|---|---|
| R35 768 미만 툴바 줄 B 줄바꿈 | `tests/feed/FeedToolbar.test.tsx` 의 바뀐 줄과 새 단언, ④ 의 `toolbarLayout`(360·390 × 2테마 실패 0)·`mustReadVisible`·`vRhythm`·R5·R6, ⑤, 정적 확인 |
| R36 카드 원천 지표 | `tests/NewsCard.test.tsx`·`tests/ui/FormControls.test.tsx`(labels) 새 단언, ④ 의 `cardMetric` 5폭 × 2테마 실패 0, ③, ⑤ |
| R37 챗 스코프 탭 | `tests/chat/ChatHeader.test.tsx` 새 단언(접근 이름), ④ 의 `chatScope` 3상태 × 5폭 × 2테마 실패 0, ⑤ |
| R38 챗 용어 통일 | `ChatWorkspace.test.tsx:55`·`FocusCapsule.test.tsx:140`·`ChatSidebar.test.tsx:256` 바뀐 단언과 `ChatSidebar.test.tsx`·`FormControls.test.tsx` 새 단언, ④ 의 `terms` `/chat` 모든 상태 실패 0, ③, ⑤, 정적 확인 |
| R39 모델 선택 한 곳 | `ChatHeader.test.tsx`·`ChatWorkspace.test.tsx:295-321` 바뀐 단언, `ChatPromptInput.test.tsx` 옮긴 단언, ④ 의 `modelPicker` 5폭 × 2테마 실패 0, ⑤, 정적 확인 |
| R40 포커스 시트 라벨 | `FocusBottomSheet.test.tsx:41-42,90`·`ChatWorkspace.test.tsx:142` 바뀐 단언과 칩 순서 새 단언, ④ 의 새 상태 `focusLabels` 실패 0, ⑤, 정적 확인 |
| R29·R30 판정 | ③, ④, ⑤, ⑥ |
| R32 범위 | `git diff --name-only 1ec8a9b..HEAD -- backend frontend/src/types frontend/src/mocks frontend/src/lib/api.ts frontend/package.json frontend/pnpm-lock.yaml` 0줄, `git diff --name-only 8d643d2..HEAD -- frontend backend` 의 모든 경로가 '변경 파일' 보정 7 목록 안 (2차 R32 의 `FocusBottomSheet.tsx` 0줄 조건은 보정 7 부터 제외, R40), `git diff --name-only 8d643d2..HEAD -- frontend/src/components/ui/ScrollRow.tsx frontend/src/components/ui/Chip.tsx frontend/src/components/chat/ChatPromptInput.tsx frontend/src/components/chat/ChatModelSelector.tsx frontend/src/components/NewsDetailModal.tsx frontend/src/app/page.tsx` 0줄 |

정적 확인 (저장소 루트에서):
- R38: `rg -n "\(Scoped\)|\(Global\)|>Scoped<|>Global<|Focus:|코퍼스" frontend/src/components/chat` 결과가 주석 줄뿐 (spec R38 의 `\|` 표기는 rg 에서 글자 `|` 라 이 표기를 쓴다)
- R40: `rg -n "'하네스·평가'|'MCP·도구'|'에이전트 기술'|'AI 뉴스'" frontend/src/components` 출력 없음 (보정 7 정정: 따옴표 포함 형태라 `SessionEmptyState.tsx:48` 의 문장을 잡지 않는다)
- R39: `grep -n "selectedTier\|onSelectTier\|ChatModelSelector" frontend/src/components/chat/ChatHeader.tsx` 출력 없음, `grep -n "onSelectTier" frontend/src/components/chat/ChatWorkspace.tsx` 가 입력창 쪽 한 곳
- R36: `grep -n "scoreMetric\|countMetric" frontend/src/components/NewsCard.tsx` 출력 있음, `grep -n "data-source=" frontend/src/components/NewsCard.tsx` 출력 있음
- R35·R33: `rg -n 'useMediaQuery|\border-|-reverse' frontend/src/components/feed/FeedToolbar.tsx` 출력 없음, `grep -n "max-md:flex-wrap\|max-md:basis-full\|max-md:ml-auto" frontend/src/components/feed/FeedToolbar.tsx` 세 클래스 모두 출력 있음
- 라벨 한 곳: `grep -rn "'전체 소식'" frontend/src/components` 출력 없음 (`ALL_CATEGORY_LABEL` 만 씀)

보정 7 에서 바뀌는 기존 단언 (spec 14.15 표, 우려 27 로 승인. 단언을 지우거나 느슨하게 하지 않고 같은 동작을 같은 세기로 단언한다. 그 밖의 기존 단언은 바꾸지 않는다):

| 파일:줄 | 전 | 후 | 단계 | 이유 |
|---|---|---|---|---|
| `frontend/src/tests/feed/FeedToolbar.test.tsx:145` (테스트 제목) | `bleeds the source row to the left edge only, so it does not slide under the sort select` | `bleeds the source row to both edges below 768px and wraps Must-Read and sort onto the next line` | 41 | R35: 768 미만에서 소스 줄 오른쪽 이웃이 다음 줄로 내려가 양쪽 `bleed` |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:148` | `toHaveClass('max-md:-ml-4', 'max-md:pl-4', 'scroll-px-6')` | `toHaveClass('max-md:-mx-4', 'max-md:px-4', 'scroll-px-6')` | 41 | 위와 같음. `bleed` 클래스를 같은 세기로 단언 |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:149-150` | `not.toHaveClass('max-md:-mx-4')`, `not.toHaveClass('max-md:-mr-4')` | 줄 B 가 `max-md:flex-wrap`, 소스 그룹을 담은 줄 B 직접 자식이 `max-md:basis-full`, Must-Read 토글이 `max-md:ml-auto`. `:152-156` 은 그대로 | 41 | 오른쪽을 늘이지 않는다는 단언이 줄바꿈 배치 단언으로 바뀐다 |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:263-265` | 주석 '오른쪽 표시는 정렬 선택창 밑으로 늘이지 않는다', `expect(end).not.toHaveClass('max-md:-mr-4')` | 주석 '오른쪽 표시도 화면 끝 여백을 쓴다 (소스 줄이 한 줄을 다 쓴다)', `expect(end).toHaveClass('max-md:-mr-4')`. `:264` 는 그대로 | 41 | 14.3 보정 3-4: 표시 쪽 `bleed` 면 표시가 페이지 여백을 씀 |
| `frontend/src/tests/chat/ChatHeader.test.tsx:71-90` | 헤더에 `selectedTier`·`onSelectTier` 를 넘기면 모델 선택이 보이고 `Haiku 5.5` 선택 → 콜백 | 헤더에 모델 선택 없음 (`queryByRole('button', { name: /Claude 모델 선택/ })` 가 null). 같은 동작은 `ChatPromptInput.test.tsx` 새 테스트로 옮김 | 42 | R39: 모델 선택은 입력창 한 곳. 단언 세기는 옮긴 곳에서 같다 |
| `frontend/src/tests/chat/ChatHeader.test.tsx:92-105` | 헤더 모델 선택이 스트리밍 중 비활성 | 지움. 같은 단언(스트리밍 중 `Claude 모델 선택` 버튼 `disabled`)을 `ChatPromptInput.test.tsx` 로 옮김 | 42 | 위와 같음 (헤더에 대상이 없다) |
| `frontend/src/tests/chat/ChatWorkspace.test.tsx:295-321` (제목, `:300-302`, `:310-311`, `:319-320`) | 트리거 2개(헤더·입력창)가 서로 동기화 | 제목 `shows a single model selector under the composer and reflects tier changes immediately (R39)`, 트리거 1개, 처음 `Sonnet 5.5`, `Haiku 5.5`·`Opus 5.5` 선택 뒤 즉시 반영, 트리거가 질문 입력창 뒤(DOM 순서) | 42 | R39. 두 트리거 동기화 요구가 없어진다. 즉시 반영 단언은 같은 세기 |
| `frontend/src/tests/chat/ChatWorkspace.test.tsx:55` | `/요청하신 기사를 찾을 수 없어 전체 뉴스 모드로 시작합니다/i` | `/요청하신 기사를 찾을 수 없어 전체 소식 모드로 시작합니다/i` | 42 | R38 용어 통일 |
| `frontend/src/tests/chat/ChatWorkspace.test.tsx:142` | `findByRole('button', { name: /하네스·평가/i })` | `findByRole('button', { name: /하네스 & 벤치마크/ })` | 42 | R40 |
| `frontend/src/tests/chat/FocusBottomSheet.test.tsx:41-42` | `/하네스·평가/i`, `/MCP·도구/i` 버튼이 있음 | `/하네스 & 벤치마크/`, `/MCP & 생태계/` 버튼이 있음 | 42 | R40 |
| `frontend/src/tests/chat/FocusBottomSheet.test.tsx:90` | `getByRole('button', { name: /MCP·도구/i })` | `getByRole('button', { name: /MCP & 생태계/ })` | 42 | R40 |
| `frontend/src/tests/chat/FocusCapsule.test.tsx:140` (제목 `:8`, `:48` 의 `Focus:` 글자 포함) | `getByText('Focus: 전체 소식')` | `getByText('포커스: 전체 소식')` | 42 | R38: 캡슐 앞말 한국어 |
| `frontend/src/tests/chat/ChatSidebar.test.tsx:256` | `getByText(/Scoped/i)` | `getByText('단일 기사')` | 42 | R38 |
| `frontend/src/tests/chat/ChatSessionWorkflow.test.tsx:58` (보정 7 정정) | `getByRole('button', { name: /단일 기사\|Scoped/i })` | `getByRole('button', { name: '단일 기사' })` (정확 일치). `:59` `aria-pressed="true"` 단언은 그대로 | 42 | R38 로 세션 카드 접근 이름이 `…, 단일 기사 모드` 가 되어 `ChatWorkspace` 안의 세션 카드와 스코프 탭이 함께 걸려 'Found multiple elements' 로 깨진다 (42단계 implementer 보고). 정확 일치는 세션 카드 이름과 겹치지 않고 단언 세기(`aria-pressed`)는 같다. spec 14.15 표 정정본(17b6bc9)에 있고, spec 우려 27 의 파일 목록에는 빠져 있다 (plan 은 14.15 표를 따른다) |

### 보정 8 증명 (45~48단계, spec 14.16)
- ① `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0, `make build` 성공, `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0 (G20·G21).
- ② 실패 테스트 먼저: `git log --oneline d444621..HEAD` 에서 `test(ui-redesign): 45 실패 fixture`, `46 실패 테스트` 커밋이 각 구현이 들어간 G20 커밋보다 앞에 있고, 각 task '검사 결과' 에 실패 출력 요약이 있다.
- ③ `--self-test`: `defects.html` 의 `rss_kr 카드에 인기 점수` 블록이 `cardMetric` 실패(⑤ 로만), `clean.html` 의 `github` + 인기 카드는 통과, 두 폭 실패 0 (R30 ①).
- ④ HEAD 프로덕션 (47): `audit/report.json` 160조합 모두 `pass: true`, `/` 10조합 `cardMetric` 실패 0, `summary.bySource` 에서 지표 없는 소스(`rss_kr`·`rss`·`arxiv`·`huggingface`)의 `hotnessShown` 0, `rowAlign` 실패 0, PNG 24장. verify 가 이 값과 `feed-light-1440x900.png` 를 인용한다.
- ⑤ **회귀 증명 (spec 14.16, R30 ② 와 같은 방법)**: verify 단계에서 spec 승인 커밋 `d444621`(보정 8 앱 수정 전)을 `git worktree add <scratchpad> d444621` 로 프로덕션 빌드해 띄우고, 보정 8 의 ui-audit(현재 브랜치 파일)를 같은 backend 데이터로 돌려 `cardMetric` ⑤ 실패(첫 화면 `국내 테크` 카드)가 보고되는지 확인한다. 고친 HEAD 에서 같은 명령으로 전 조합 실패 0 이어야 한다. verify.md 에 두 실행의 명령·요약을 인용한다. 45 의 사전 측정은 같은 커밋의 예비 실행이고 verify 가 다시 돌린다.
- ⑥ 수정 전 기준선: `audit/baseline-1ec8a9b/report.json` 을 보정 8 판정으로 다시 쟀고 F1~F4 실패가 그대로 있다.
- ⑦ 기존 단언: `git diff -U0 d444621 -- frontend/src/tests | grep -E '^-[^-]'` 의 결과가 아래 표의 줄(`NewsCard.test.tsx:328`·`:329`·`:405`)과 import 줄뿐이다. 표 밖 기존 단언은 그대로 통과한다.
- 기준선 (작성 때): HEAD `d444621`, `cd frontend && pnpm test` 622 테스트 통과.

| 요구사항 | 증명 |
|---|---|
| R41 인기 점수는 지표 소스만 | `tests/NewsCard.test.tsx` 의 바뀐 `:328-329`·`:404-405` 와 새 단언, `:180-196` 그대로 통과, ③, ④, ⑤, 아래 정적 확인 |
| R17 카드 고정 틀 유지 | ④ 의 `rowAlign` 실패 0, 47 육안 확인 |
| R29·R30 판정 | ③, ④, ⑤, ⑥ |
| R32 범위 | `git diff --name-only 1ec8a9b..HEAD -- backend frontend/src/types frontend/src/mocks frontend/src/lib/api.ts frontend/package.json frontend/pnpm-lock.yaml` 0줄, `git diff --name-only d444621..HEAD -- frontend backend` 의 모든 경로가 '변경 파일' 보정 8 목록 안, `git diff --name-only d444621..HEAD -- frontend/src/lib/labels.ts frontend/src/components/NewsDetailModal.tsx` 0줄 |

정적 확인 (저장소 루트에서):
- `grep -n "const showHot" frontend/src/components/NewsCard.tsx` 에 `scoreKind !== null` 이 있다
- `rg -n "hotness_score" frontend/src/components` 의 결과가 `NewsCard.tsx` 뿐 (상세는 그리지 않음)
- `grep -n "hotnessShown" frontend/scripts/ui-audit.mjs` 출력 있음

보정 8 에서 바뀌는 기존 단언 (spec 14.16 표, 우려 33 으로 승인. 단언을 지우거나 느슨하게 하지 않고 같은 세기로 단언한다. 그 밖의 기존 단언은 바꾸지 않는다):

| 파일:줄 | 전 | 후 | 단계 | 이유 |
|---|---|---|---|---|
| `frontend/src/tests/NewsCard.test.tsx:328-329` (`hides the synthetic raw_score for %s` 안) | 주석 '인기 점수는 그대로 보인다', `expect(stat(container, 'hotness')).not.toBeNull()` | 주석 '인기 점수도 합성 값이라 숨긴다 (R41)', `expect(stat(container, 'hotness')).toBeNull()` 과 `expect(screen.queryByText('인기 점수')).toBeNull()`. 같은 테스트의 `:321-327` 은 그대로 | 46 | R41: 합성 `raw_score` 소스의 인기 점수는 `raw_score` 에서 계산된 합성 값 |
| `frontend/src/tests/NewsCard.test.tsx:404-405` (`marks the hotness stat without a metric attribute`) | `renderSource({ source: 'rss_kr', hotness_score: 84.6 })` | `renderSource({ source: 'github', hotness_score: 84.6 })`. `:406-410`(`data-metric` 없음, `sr-only` `인기 점수`, `85`)은 그대로 | 46 | R41 로 `rss_kr` 카드에는 인기 통계가 없다. 테스트가 확인하던 마크업 규칙은 지표 소스에서 같은 세기로 단언한다 |

### 보정 9 증명 (49~55단계와 48, spec 14.17)
- ① `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0 (`IconGuard.test.ts`·`FeedStatusBar.test.tsx` 포함), `make build` 성공, `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` 종료 0 (G22·G23).
- ② 실패 테스트 먼저: `git log --oneline adf8581..HEAD` 에서 `test(ui-redesign): 49 실패 fixture`, `50 실패 테스트`, `51 실패 테스트`, `52 실패 테스트`, `53 실패 테스트`, `54 실패 테스트` 커밋이 모두 G22 구현 커밋보다 앞에 있고, 각 task '검사 결과' 에 실패 출력 요약(예상 실패 이유와 같음)이 있다.
- ③ `--self-test`: spec 14.17 fixture 8종이 `defects.html` 에서 각 검사(`feedAreas` 1440·360, `toolbarLayout` 360, `chatHeader`, `pictograph`, `terms`, `briefing`, `cardFooter`)로 실패하고, `clean.html` 이 두 폭에서 실패 0 (면제 확인: `.markdown-viewer` 안 `💡`, `a[target="_blank"]` 안 `🚀`, `h2` `AgentLens © 2026 ↔ 피드` — 텍스트 표현 기호는 `pictograph` 에 걸리지 않음(결정 1), `role="alert"` 안 `이메일 설정 열기`), 세 영역 구조로 고친 기존 clean 블록 통과 (R30 ①).
- ④ HEAD 프로덕션 (55): `audit/report.json` 160조합 모두 `pass: true`, 새 검사 5개가 해당 상태 조합의 `checks` 에 있음, 55 ⑤ 기록(`feedAreas.layout`, 360·390 `toolbarLayout.source`, `vRhythm` 세 간격, R5 값), PNG 24장. verify 가 이 값과 `feed-light-{360x780,390x844,768x1024,1024x768,1440x900}.png`, `chat-light-{390x844,1440x900}.png`, `detail-light-*.png`, `briefing-light-*.png` 육안 확인을 인용한다.
- ⑤ **회귀 증명 — 새 검사마다 `adf8581` 에서 실패하고 고친 뒤 통과** (spec 14.17 회귀 증명, R30 ② 와 같은 방법). verify 단계에서 한다. 49 의 사전 측정은 같은 커밋의 예비 실행이고 verify 가 다시 돌린다.
  - ui-audit (프로덕션): `git worktree add --detach <scratchpad>/al-pre9 adf8581` 을 프로덕션 빌드해 3102 로 띄우고, 현재 브랜치의 `frontend/scripts/ui-audit.mjs` 로 같은 backend 데이터를 잰다 (`node scripts/ui-audit.mjs --base http://127.0.0.1:3102 --out <scratchpad>/pre9 --commit adf8581 --screenshots none`, 옵션 이름은 스크립트 `--help` 대로). 그 뒤 고친 HEAD(3101)를 같은 명령으로 잰다. 검사별 기대:

    | 검사 | `adf8581` 에서 보고되어야 할 실패 | 고친 HEAD |
    |---|---|---|
    | `feedAreas` | 모든 폭 ①(`[data-feed-search]`·`[data-feed-list-header]` 없음, 툴바 안 검색·정렬), 768 이상 ③(1440 검색이 분야 칩 줄과 같은 줄)·⑤(검색 왼쪽 1040 ≠ 112), 768 미만 ② | 10조합 실패 0 |
    | `toolbarLayout` (바뀐 판정) | 360·390: 토글이 소스 줄 아래 줄, 툴바 안 정렬·검색 | 실패 0 (360 보이는 폭 ≥ 275) |
    | `vRhythm` (바뀐 판정) | '대상 없음: `[data-feed-search]`, `[data-feed-list-header]`' | 실패 0 |
    | `chatHeader` | 기록 버튼이 보이는 모든 폭 (기록 버튼이 먼저) | 실패 0 |
    | `pictograph` | `/chat` 기본: 추천 카드 4개·모델 칩 `🎯`. 일일 브리핑: 분야 머리글 `h3`. 뉴스 상세 `AI 질의응답` 탭: 그 탭 상태가 열리지 않아 '측정 못 함' (결정 2 — 실패·통과로 세지 않고 아래 대체 증명으로 갈음) | 실패 0 (`AI 질의응답` 탭 상태가 열리고 실패 0) |
    | `terms` (넓힌 판정) | `/` 카드마다 `전용 챗에서 분석`, 상세 첫 탭 상태의 배너 `전용 AI 챗으로 이동`(그 상태에서 보이는 탭 이름 `Ask AI 질의응답` 이 잡히면 함께 적는다). 둘째 탭 상태는 '측정 못 함' (결정 2) | 실패 0 (둘째 탭 상태 포함) |
    | `briefing` | ① 768 이상 설정 버튼 2개 ② 헤드라인 두 번 ③ `MCP & 도구·스킬 생태계` 등 | 실패 0 |
    | `cardFooter` | 모든 폭(보이는 글자가 `챗에서 분석`), 1024 는 글자가 `sr-only` | 실패 0 |
    | R9 진입점 `card-chat` | 이름이 `/^AI 챗에서 분석/` 가 아니라 못 찾음 | 실패 0 |
    | 뉴스 상세 `AI 질의응답` 탭 상태 (`DIALOGS` `ask-ai`) | 탭 이름이 `/^AI 질의응답/` 가 아니라 열지 못함 → '측정 못 함' (실패·통과로 세지 않음, 결정 2) | 열림, 그 상태의 검사 실패 0 |

    결정 2 의 대체 증명 (그 탭의 `pictograph`·`terms` 고치기 전 실패): ① `--self-test` 의 `pictograph`·`terms` fixture 행이 `defects.html` 에서 실패(③) ② 51 의 실패 테스트 커밋에서 `AskAiPanel.test.tsx:47,67`·`modals/NewsDetailModal.test.tsx` 의 탭 이름·빠른 질문 바뀐 단언과 빠른 질문 `svg` 새 단언이 실패(②, 아래 vitest 재실행) ③ `IconGuard` 가 `adf8581` 에서 `news-detail/AskAiPanel.tsx:51,56,61,66` 4글자로 실패. verify.md 에 세 가지를 인용하고 그 탭 상태를 '측정 못 함' 으로 적는다.

    일일 브리핑이 없으면 `briefing`·브리핑 `pictograph` 는 두 실행 모두 skipped 이고 fixture(③)로만 증명했다고 적는다. 첫 화면에 GitHub 카드가 없으면 `cardFooter` 의 두 줄 바닥은 fixture 로만 증명했다고 적는다. verify.md 에 두 실행의 명령·요약을 인용한다.
  - vitest (새 단언·바뀐 단언): 같은 worktree 에서 `cd frontend && pnpm install --frozen-lockfile` 뒤 HEAD 의 테스트 파일을 덮어쓴다 (`git -C <worktree> checkout <HEAD> -- frontend/src/tests/feed/FeedToolbar.test.tsx frontend/src/tests/feed/FeedStatusBar.test.tsx frontend/src/tests/chat/ChatHeader.test.tsx frontend/src/tests/chat/ChatMessageList.test.tsx frontend/src/tests/chat/ChatModelSelector.test.tsx frontend/src/tests/chat/HandoverIntegration.test.tsx frontend/src/tests/AskAiPanel.test.tsx frontend/src/tests/modals/NewsDetailModal.test.tsx frontend/src/tests/modals/DailyBriefingModal.test.tsx frontend/src/tests/NewsCard.test.tsx frontend/src/tests/ui/IconGuard.test.ts`). `pnpm exec vitest run <그 파일들>` 이 실패하고, 실패한 테스트 이름이 아래 '새 단언'·'바뀐 단언' 의 각 항목을 덮는다 (`FeedStatusBar.test.tsx` 는 정렬 없음, `IconGuard.test.ts` 는 다섯 파일 16글자). HEAD 에서 같은 파일이 통과한다. 각 단계 task 의 실패 출력(②)이 같은 사실의 단계별 기록이다.
- ⑥ 수정 전 기준선: `audit/baseline-1ec8a9b/report.json` 을 보정 9 판정으로 다시 쟀고 F1~F4 실패가 그대로 있다.
- ⑦ 기존 단언: `git diff -U0 adf8581 -- frontend/src/tests | grep -E '^-[^-]'` 의 결과가 아래 '보정 9 에서 바뀌는 기존 단언' 표의 줄과 import 줄뿐이다. 표 밖 기존 단언은 그대로 통과한다 (`FeedToolbar.test.tsx:95-111,115-118,120-133,135-141,161-173,387-403,456-466`, `NewsDetailModal.test.tsx:65,88,137`, `ChatMessageList.test.tsx:28,75`, `FormControls.test.tsx:143,151`, `DailyBriefingModal.test.tsx:8-27` 포함). 새 파일 `FeedStatusBar.test.tsx` 는 `adf8581` 에 없어 이 diff 의 지운 줄에 들어가지 않는다. 그 파일 안에서 50 연장(`5de1774`)이 `expect(header).toHaveClass('flex', 'items-center')`(50 이 `ab2d673` 에서 더한 단언)를 `'flex', 'items-start'` 로 바꾼 것은 spec 14.17 '새 단언' 정정(`5f6417e`)을 따른 것이다 (작업 순서 50 의 '50 연장').
- ⑧ Chrome 확인 (55 ⑥): `/` 포커스 스크롤(1024×768·390×844), sticky 띠 높이, 360 필터 상태 머리줄. 못 했으면 verify.md 에 미검증.
- ⑨ 사람 검토: 55 의 스크린샷 24장을 verify 에서 사람이 본다 (④ 의 목록).
- 기준선 (작성 때): HEAD `adf8581`, `cd frontend && pnpm exec vitest run` 50 파일 630 테스트 통과.

| 요구사항 | 증명 |
|---|---|
| R42 피드 세 영역 | `tests/feed/FeedToolbar.test.tsx` 바뀐 줄·새 단언, 새 `tests/feed/FeedStatusBar.test.tsx`, ③, ④ 의 `feedAreas` 5폭 × 2테마 실패 0·`toolbarLayout`·`vRhythm`·`scrollRow.toolbar.mustReadVisible`·R5·R6·`placeholder` 통과, ⑤, ⑧, 정적 확인 |
| R43 챗 헤더 순서 | `tests/chat/ChatHeader.test.tsx` 새 단언, ④ 의 `chatHeader` 실패 0, ⑤ |
| R44 그림 문자 없음 | `tests/ui/IconGuard.test.ts`(판정식 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/u`, 결정 1), `ChatModelSelector.test.tsx`·`AskAiPanel.test.tsx`·`NewsDetailModal.test.tsx`·`DailyBriefingModal.test.tsx`·`ChatMessageList.test.tsx` 단언, ④ 의 `pictograph` 실패 0, ③, ⑤ |
| R45 이관·상세 용어 | `NewsDetailModal.test.tsx`·`NewsCard.test.tsx`·`HandoverIntegration.test.tsx` 바뀐 줄, ④ 의 `terms`(넓힘)·R9 진입점 실패 0, ③, ⑤, 정적 확인 |
| R46 브리핑 설정 한 곳·헤드라인 한 번 | `DailyBriefingModal.test.tsx` 새 단언, ④ 의 `briefing` ①② 실패 0, ③, ⑤ |
| R47 분야 이름 한 곳 | `DailyBriefingModal.test.tsx`(머리글 `MCP & 생태계`·`에이전트 아키텍처`), `NewsCard.test.tsx`(머리줄 `title`), ④ 의 `briefing` ③ 실패 0, ⑤ |
| R48 카드 바닥 글자 | `NewsCard.test.tsx:236-241` 바뀐 단언, ④ 의 `cardFooter` 5폭 × 2테마 실패 0·`rowAlign`·`clip`·`occluded`·R5 통과, ③, ⑤ |
| R17 카드 고정 틀 유지 | ④ 의 `rowAlign` 실패 0, 55 ⑦ 육안 |
| R29·R30 판정 | ③, ④, ⑤, ⑥ |
| R32 범위 | `git diff --name-only 1ec8a9b..HEAD -- backend frontend/src/types frontend/src/mocks frontend/src/lib/api.ts frontend/package.json frontend/pnpm-lock.yaml` 0줄, `git diff --name-only adf8581..HEAD -- frontend backend` 의 모든 경로가 '변경 파일' 보정 9 목록 안, `git diff --name-only adf8581..HEAD -- frontend/src/components/ui frontend/src/lib/labels.ts frontend/src/components/chat/ChatWorkspace.tsx frontend/src/components/chat/ModelChangeDivider.tsx` 0줄 (결정 1 로 `ui/Toast.tsx` 도 이 조건 안 — 고치지 않는다) |

정적 확인 (저장소 루트에서):
- R42: `rg -n "SORT_OPTIONS|onSortChange|<Select|max-md:flex-wrap|max-md:basis-full|max-md:ml-auto|useMediaQuery|-reverse" frontend/src/components/feed/FeedToolbar.tsx` 출력 없음, `grep -n "data-feed-search" frontend/src/components/feed/FeedToolbar.tsx`·`grep -n "data-feed-list-header" frontend/src/components/feed/FeedStatusBar.tsx`·`grep -n "preventScroll" frontend/src/app/page.tsx` 출력 있음
- R44: `rg -n --pcre2 "\p{Emoji_Presentation}|\p{Extended_Pictographic}\x{FE0F}" frontend/src/components frontend/src/app` 출력 없음 (결정 1 의 판정식을 rg PCRE2 로 쓴 것. 텍스트 표현 기호 `page.tsx:265` `©`·`Toast.tsx:34,185` `↔` 는 걸리지 않는다)
- R45: `rg -n "Ask AI 질의응답|전용 (AI )?챗|compactBetweenLgXl|lg:max-xl:sr-only" frontend/src/components` 출력 없음
- R46: `grep -n "연동 설정 관리" frontend/src/components/DailyBriefingModal.tsx` 출력 없음
- R47: `grep -n "cat.icon" frontend/src/components/DailyBriefingModal.tsx` 출력 없음, `grep -n "FEED_CATEGORIES" frontend/src/components/DailyBriefingModal.tsx` 출력 있음
- R43: `ChatHeader.tsx` 의 `href="/"` 줄 번호가 `label="대화 기록 보기"` 줄 번호보다 작다

보정 9 에서 바뀌는 기존 단언 (spec 14.17 표를 그대로 옮김, 우려 34 로 승인. 줄은 HEAD `bcec1f5` 작업 트리 기준이고 `adf8581` 에서도 같다. 단언을 지우거나 느슨하게 하지 않고 같은 동작을 같은 세기로 단언하며, 옮기는 단언은 옮긴 곳에서 같은 세기다. **이 표 밖의 기존 단언은 바꾸지 않는다** — 깨지면 단계를 `blocked` 로 두고 보고한다):

| 파일:줄 | 지금 단언 | 바뀐 단언 | 단계 | 이유 |
|---|---|---|---|---|
| `frontend/src/tests/feed/FeedToolbar.test.tsx:11,18`(`setup`), `:325,332`(`baseProps`) | fixture 에 `sort`, `onSortChange` | 두 키를 지운다 (`FeedToolbarProps` 에서 빠짐). 단언 아님 | 50 | R42: 정렬이 `FeedToolbar` 밖 |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:50` (제목), `:57-61` | 정렬을 찾아 `Must-Read` 가 소스 그룹 뒤·정렬 앞 | 제목 `shows the Must-Read toggle outside the source group at the end of the source row, and toggles it`. `queryByRole('combobox', { name: '정렬' })` 가 null, `mustRead` 가 소스 그룹과 같은 `data-toolbar-row` 의 `lastElementChild`, 소스 그룹 뒤(DOM). `:62-67` 은 그대로 | 50 | R42·R34: 토글은 소스 줄 오른쪽 끝, 정렬은 목록 머리줄 |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:80-93` | `FeedToolbar` 의 정렬 4옵션·콜백 | 새 `frontend/src/tests/feed/FeedStatusBar.test.tsx` 로 옮긴다: 같은 옵션 4개(값·글자), `latest` 선택 → `onSortChange('latest')`, `onPageChange(1)` | 50 | R42. 단언 세기는 옮긴 곳에서 같다 |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:145` (제목), `:148`, `:150-152`, `:154-158` | `bleed` 양쪽(`max-md:-mx-4`·`max-md:px-4`), 줄 B `max-md:flex-wrap`, 소스 감싸개 `max-md:basis-full`, 토글 `max-md:ml-auto`, 정렬이 줄 B 안 | 제목 `bleeds the source row to the left edge only and keeps Must-Read on the same row below 768px (R35 보정 9)`. `:148` `toHaveClass('max-md:-ml-4', 'max-md:pl-4', 'scroll-px-6')` 와 `not.toHaveClass('max-md:-mx-4')`·`not.toHaveClass('max-md:-mr-4')`. `:150-152` 줄 B 가 `max-md:flex-wrap` 아님, 감싸개가 `max-md:basis-full` 아님, 토글이 `max-md:ml-auto` 아님. `:154-158` `[data-feed-toolbar]` 안에 `combobox` 가 없음 | 50 | R35 보정 9: 41단계 줄바꿈을 되돌림. 보정 6 의 `bleed` 단언과 같은 세기 |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:225` (제목), `:230-231`, `:237` | 표시가 정렬 앞, 줄이 정렬을 담음 | 제목 `… outside the group and before the Must-Read toggle`. `sort` 대신 `toggle = getByRole('button', { name: 'Must-Read' })`: 줄이 토글을 담고, 표시가 토글 앞 | 50 | 정렬이 줄 B 에 없다. 같은 순서 단언을 토글로 |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:241` (제목), `:264`, `:278`, `:279-281` | `end` 표시가 정렬 앞, `end` 가 `max-md:-mr-4` | 제목 `… (start before the group, end before the Must-Read toggle)`. `end` 가 토글 앞. 주석 '오른쪽 표시는 토글 앞이라 화면 끝 여백을 쓰지 않는다 (보정 6 과 같음)', `expect(end).not.toHaveClass('max-md:-mr-4')`. `:280` `start` 는 그대로 | 50 | `bleed="start"` 로 돌아가 오른쪽 표시는 `bleed` 없는 쪽 (14.3 보정 3-4) |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:341-347` (`controls()`), `:422` | `controls()` 가 정렬을 찾고 ② 가 정렬 노드 유지 단언 | `controls()` 에서 `sort` 를 뺀다. `:422` 를 지우고 같은 단언(폭 목 360 → 1440 으로 다시 그려도 정렬이 같은 노드)을 `frontend/src/tests/feed/FeedStatusBar.test.tsx` 에 둔다 | 50 | R42·R33. 세기는 옮긴 곳에서 같다 |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:426-433` (③) | 제목 `③ orders controls 카테고리 → 검색 → 소스 → 정렬`, `precedes(category, search)`, `precedes(search, source)`, `precedes(source, sort)` | 제목 `③ orders controls 검색 → 카테고리 → 소스 → Must-Read in the DOM at %ipx`. `precedes(search, category)`, `precedes(category, source)`, `precedes(source, toggle)` | 50 | R42·R33: 검색이 필터 영역 위 |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:435-454` (⑤) | `precedes(toggle, sort)` | 토글이 소스 그룹과 같은 `data-toolbar-row` 의 `lastElementChild`. 나머지(`:442`, `:444-452`)는 그대로 | 50 | R34 보정 9 |
| `frontend/src/tests/feed/FeedToolbar.test.tsx:468-479` (④) | 제목 `④ puts 카테고리+검색 and 소스+정렬 in the same toolbar rows`, 검색은 줄 A, 정렬은 줄 B | 제목 `④ puts search in its own area above the filter rows and Must-Read in the source row at %ipx`. 검색의 `closest('[data-toolbar-row]')` 가 null, `closest('[data-feed-search]')` 가 있고 그 영역이 `[data-feed-toolbar]` 밖·앞(DOM). 토글의 `data-toolbar-row` = 줄 B. `:474-476` 은 그대로 | 50 | R42 |
| `frontend/src/tests/chat/ChatModelSelector.test.tsx:22` | `toHaveTextContent('🎯')` | 트리거 안 `[data-tier-icon="sonnet"]` `svg` 가 있고 `aria-hidden="true"`, 트리거 글자에 그림 문자 없음 | 52 | R44: 티어 아이콘이 lucide |
| `frontend/src/tests/chat/ChatModelSelector.test.tsx:181`, `:189` | `getByText('⚡')`, `getByText('🎯')` | `[data-tier-icon="haiku"]`, `[data-tier-icon="sonnet"]` 가 있음 | 52 | R44 |
| `frontend/src/tests/chat/ChatModelSelector.test.tsx:202` | `queryByText('🧠')` 가 null | `[data-tier-icon]` 이 null | 52 | R44. `showIcon={false}` 단언 세기 같음 |
| `frontend/src/tests/AskAiPanel.test.tsx:47`, `:67` | `getAllByText('💡 핵심 원리 및 구조')` | `getAllByText('핵심 원리 및 구조')` | 51 | R44 |
| `frontend/src/tests/modals/NewsDetailModal.test.tsx:98`, `:213` | 버튼 이름 `'💡 핵심 원리 및 구조'` | `'핵심 원리 및 구조'` | 51 | R44 |
| `frontend/src/tests/modals/NewsDetailModal.test.tsx:81,97,102,130,166,177,188,212` | 탭 이름 `/Ask AI 질의응답/` | `/^AI 질의응답/` (`:102` 의 건수 배지 `1` 단언은 그대로) | 51 | R45 |
| `frontend/src/tests/modals/NewsDetailModal.test.tsx:76` | 버튼 `/전용 AI 챗으로 이동/` 1개 | 버튼 `/^AI 챗에서 분석/` 1개 | 51 | R45 |
| `frontend/src/tests/NewsCard.test.tsx:236-241` | 제목 `shows the handover button as icon-only between lg and xl while keeping its accessible name`, 이름 `전용 챗에서 분석`, 글자 `챗에서 분석` 의 클래스에 `lg:max-xl:sr-only` | 제목 `keeps the handover label visible at every width (R48)`. 이름 `AI 챗에서 분석` 버튼 안 글자 `AI 챗에서 분석` 의 클래스에 `sr-only` 가 들어 있지 않음. 바닥 줄이 `flex-wrap`, 버튼 묶음이 `ml-auto` | 51 | R48·R45: 아이콘만 모드를 없앰. 클래스 단언 세기 같음 |
| `frontend/src/tests/chat/HandoverIntegration.test.tsx:69`, `:104` | `/전용 챗에서 분석\|Ask AI/i` | `{ name: 'AI 챗에서 분석' }` (정확 일치) | 51 | R45 |
| `frontend/src/tests/chat/HandoverIntegration.test.tsx:85`, `:122` | `/전용 AI 챗으로 이동\|전용 챗에서 분석/i` | `/^AI 챗에서 분석/` (배너 이름에 보조 문구가 이어짐) | 51 | R45 |

보정 9 새 단언 (spec 14.17 '새 단언'. 기존 파일에는 새 `it`/`describe`·도우미·import 만 더한다):
- `frontend/src/tests/feed/FeedStatusBar.test.tsx` (새, 50): 옮긴 정렬 단언, 정렬이 `[data-feed-list-header]` 안·`role="status"` 밖·상태 뒤(DOM), 상태 `aria-live="polite"`·`페이지 p / T`, 머리줄 `flex items-start`·`items-center` 아님·`flex-wrap` 아님, 상태 `min-w-0 flex-1 min-h-11 md:min-h-9`(spec 14.17 정정 `5f6417e`, 50 연장), 정렬 감싸개 `w-28 shrink-0 xl:w-32`, 폭 목 360 → 1440 에서 같은 정렬 노드.
- `frontend/src/tests/feed/FeedToolbar.test.tsx` (50): `[data-feed-search]` 가 `scroll-mt-20`, 검색 폼 `w-full`·`md:w-48`·`xl:w-72` 없음, `[data-feed-toolbar]` 안에 `searchbox`·`combobox` 없음.
- `frontend/src/tests/chat/ChatHeader.test.tsx` (52): `피드로 돌아가기` 링크가 `대화 기록 보기` 버튼보다 DOM 앞, 헤더 안 첫 조작 요소가 그 링크.
- `frontend/src/tests/chat/ChatMessageList.test.tsx` (52): 첫 추천 카드 → `onSelectPromptSuggestion('FastMCP로 파이썬 기반 경량 MCP 서버 구축하는 방법')`, 카드마다 `svg[aria-hidden="true"]` 하나.
- `frontend/src/tests/ui/IconGuard.test.ts` (새, 54): 대상 파일에서 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/gu` 에 걸리는 글자 0개 (결정 1).
- `frontend/src/tests/AskAiPanel.test.tsx` (51): 빠른 질문 버튼마다 `svg[aria-hidden="true"]`.
- `frontend/src/tests/modals/DailyBriefingModal.test.tsx` (53): `연동 설정` 버튼 정확히 1개, `브리핑 작업` 메뉴에 `연동 설정` 없음, 헤드라인 1번, 분야 머리글 `MCP & 생태계`·`에이전트 아키텍처`·`MCP & 플러그인 생태계` 없음, 시사점 `svg[aria-hidden="true"]` + `시사점:`.
- `frontend/src/tests/NewsCard.test.tsx` (51): 머리줄 카테고리 `span` 의 `title` 이 `categoryLabel(item.category)`.
