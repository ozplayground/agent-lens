# [AgentLens Frontend 전체] 5-Pillar 코드 품질 감사 및 리뷰 보고서 (Code Review Report)

Updated: 2026-11-09
기준: v0.4.1 (main)

- **검토일자**: 2026-11-09
- **검토자**: 시니어 코드 리뷰어 (`frontend-code-reviewer`)
- **검토 대상 PR / 브랜치**: PR 이나 diff 리뷰가 아니다. `main` (`9e0c9e5`, v0.4.0) 의 frontend 를 지금 있는 그대로(as-built) 감사했다. 범위는 `frontend/src/**` (제품 코드, `mocks/`, `tests/`), `frontend/next.config.ts`, `frontend/scripts/ui-audit.mjs`. lockfile 은 보지 않았다.
- **대조 문서**: `docs/ui-system-designer/01_COMPONENT_SPEC.md` (10절 알려진 불일치), `docs/ui-system-designer/02_DESIGN_SYSTEM.md` (7절 금지 규칙, 8절 검사, 9.2절 남은 문제), `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` (7절 CT-001~CT-026), `docs/frontend-tdd-engineer/01_TDD_CYCLE_LOG.md` (3.2절 5대 상태 공백, 4절 실행 증거), 옛 `docs/known-issues.md` 의 frontend·UI·접근성 행 (8절 대응표), 이전 릴리스 리뷰의 Nit 3건 (7절)
- **재리뷰 대상**: 작업 트리(커밋 전)의 필수 결함 수정. `git diff -- frontend/` 의 7개 파일(`components/chat/ChatWorkspace.tsx`, `components/chat/ChatMessageItem.tsx`, `components/chat/ExportToolbar.tsx`, `hooks/useNewsFeed.ts`, `tests/chat/ChatWorkspace.test.tsx`, `tests/chat/ChatMessageItem.test.tsx`, `tests/chat/ExportToolbar.test.tsx`)과 새 파일 2개(`tests/chat/ChatStreamTurn.test.tsx`, `tests/feed/FeedSearch.test.tsx`). 결과는 9절.
- **재리뷰 2차 대상**: 같은 작업 트리에 더한 수정 FE-33·FE-34·BUG-02R (계약 `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` 8.1). 1차 재리뷰 범위에 `types/chat.ts`, `mocks/handlers/chat.ts`, `tests/chat/ContractAndMsw.test.ts` 3개 파일이 더해졌다. 결과는 9.7절.
- **최종 판정**: **APPROVED** (재리뷰 2차, 2026-11-09). 1차 감사는 REQUEST_CHANGES, 재리뷰 1차는 APPROVED 였다.

지적 수 (1차 감사): 모두 32건. **머지 전 필수 5건** (FE-01, FE-02, FE-03, FE-09, FE-22), **권장 27건**.
지적 수 (재리뷰 뒤): 필수 5건은 모두 **해결**. 남은 지적은 권장 27건(FE-04~FE-08, FE-10~FE-21, FE-23~FE-32; FE-28 은 일부 해결)과 재리뷰에서 새로 찾은 **권장 3건**(FE-33~FE-35)으로, 머지 전 필수는 0건이다.
지적 수 (재리뷰 2차 뒤): FE-33·FE-34 **해결**. 남은 권장은 27건 + FE-35 = 28건이고 머지 전 필수는 0건이다. 2차에서 새 지적은 없다 (9.7.4절의 관찰 3건은 지적으로 세지 않는다). 제품 오너가 검사 범위 밖으로 정한 범주(인증·CORS, SSRF, 비밀값 평문 저장·노출, 설정 재적용 누락)의 사실은 지적에 넣지 않고 5.1절에 따로 모았으며 판정 근거로 쓰지 않았다.

"실행 확인" 이라고 적은 지적은 제품 코드를 고치지 않고 scratchpad 에 둔 임시 vitest 파일(저장소의 `vitest.config.ts` 설정·`src/tests/setup.ts`·MSW 서버를 그대로 쓰는 별도 설정)로 재현했다. 재현에 쓴 파일은 저장소 밖에 있고, 실행 뒤 `git status` 는 바뀌지 않았다. "코드로 확인" 은 실행하지 않고 코드 경로만 읽은 것이다.

---

## 1. 5-Pillar 코드 품질 감사 매트릭스 (5-Pillar Audit)

이 서브에이전트의 감사 축(React·Next.js 아키텍처 / 성능·번들 / 접근성 / 타입·상태 / 테스트)으로 다섯 행을 채웠다. `fullstack-code-review` 스킬의 클린코드·SOLID 는 1·4행에, 보안·데이터 무결성은 4행에 넣었다.

| 감사 필라 (Pillar) | 세부 검토 기준 | 평가 점수 (1~5) | 검토 소견 및 발견 사항 |
| :--- | :--- | :---: | :--- |
| **Pillar 1: React·Next.js 아키텍처** | RSC/RCC 경계, 훅 의존성 배열, 상태 갱신 함수의 순수성, 불필요한 상태 동기화, 설계 문서 일치 | 2 / 5 | 라우트 경계는 맞다: `app/layout.tsx`·`app/chat/page.tsx` 는 RSC 이고 `ChatWorkspace` 를 `Suspense` 로 감싼다. 그러나 챗 전송 콜백이 오래된 모델 티어를 잡아 **고른 모델과 다른 모델로 요청한다** (FE-01, 실행 확인). `setMessages` 갱신 함수 안에서 서버 저장을 부르고 한 턴에 두 번 저장한다 (FE-02, 실행 확인). `done` 없이 끊긴 스트림을 완료로 표시한다 (FE-03, 실행 확인). 재시도가 실패한 질문을 history 에 한 번 더 넣는다 (FE-04). 오류 경계(`error.tsx`)가 없다 (FE-05). 훅을 쓰는 공용 부품 7개에 `'use client'` 가 없다 (FE-06). 챗 호출 6곳이 `lib/api.ts` 를 거치지 않고 시간 제한이 없다 (FE-07). 쓰지 않는 코드와 연결되지 않은 prop 이 있다 (FE-08). |
| **Pillar 2: 성능·번들** | 클라이언트 번들, `next/dynamic` 분할, 불필요한 리렌더, 요청 수 | 3 / 5 | 검색어 한 글자마다 `/api/news` 를 다시 부르고 페이지를 1로 돌리지 않아 2페이지 이상에서 검색하면 빈 결과가 나온다 (FE-09, 실행 확인). 토큰마다 모든 메시지와 마크다운을 다시 그린다 (FE-10). `next/dynamic`·`React.lazy` 를 한 곳도 쓰지 않아 홈 첫 번들에 대화상자 6개가 들어간다 (FE-11, 크기는 재지 않았다). 피드 훅의 '같은 키 다시 읽기 / 키 변경' 구분(`useNewsFeed.ts:21-34`)과 수집 상태 외부 저장소(`useCollector.ts`)의 오래된 응답 버리기는 잘 되어 있다. |
| **Pillar 3: 접근성·디자인 토큰** | 시맨틱 HTML, 키보드·포커스 트랩, ARIA, 대비 (WCAG 2.2 AA), 토큰 사용, 공통 부품 재사용 | 4 / 5 | 대화상자·드로어·시트·팝오버가 모두 공통 부품(`ui/Dialog`·`ui/Drawer`·`ui/Popover`·`ui/ConfirmDialog`)을 써서 포커스 트랩·Escape·스크롤 잠금이 한 곳에 있다. 대비는 `TokenContrast.test.ts` 가, 토큰 위반은 `TokenGuard.test.ts` 가 `make check` 에서 막는다. `.tsx` 의 hex 는 `layout.tsx:12-13` 의 `themeColor` 두 개뿐이고 `!important` 는 0건이다. 남은 문제: 세션 카드 안 버튼 중첩 (FE-12), 인용 팝오버가 `<p>` 안에 `div` 로 그려짐 (FE-13), 챗 로그가 토큰마다 읽힘 (FE-14), 세션 삭제 실패가 알려지지 않음 (FE-15), 공통 부품을 두고 새로 만든 버튼과 `themeColor` hex 중복 (FE-16). |
| **Pillar 4: 타입·상태·보안** | `any`, zod 런타임 검증, 오류 경계, localStorage 값 검증, 환경 변수, 화면 문구의 사실성 | 2 / 5 | 제품 코드에 `any` 는 0건이다. 그러나 응답을 zod 로 검증하는 곳이 없다 (FE-19). localStorage 의 북마크·세션 목록이 배열이 아니면 화면이 렌더 오류로 죽는다 (FE-17·FE-18, 실행 확인). 챗 `Notion 동기화` 는 서버를 부르지 않고 성공을 표시한다 (FE-22). 초기화 함수가 실행하지 않고 끝나도 확인 창은 성공처럼 닫힌다 (FE-20). `env.ts` 를 아무도 import 하지 않고 `NEXT_PUBLIC_APP_VERSION` 이 스키마에 없다 (FE-21). 그 밖에 Ask AI 스트림 파서 (FE-23), URL 의 `session_id` 검증 (FE-24), 고정 문구 (FE-25), localStorage 상세 캐시 누적 (FE-26), 개인 개발 호스트 커밋 (FE-27). |
| **Pillar 5: 테스트** | 사용자 중심 RTL 쿼리, MSW 목 정합성, UI 5대 상태, 회귀 방지 | 3 / 5 | 52개 파일 649개 테스트가 모두 통과하고 쿼리는 대부분 `getByRole`·접근 이름 기준이다. 그러나 FE-01·02·03·09 결함을 잡는 테스트가 없다: 모델 변경 테스트는 버튼 글자만 보고 요청 본문을 보지 않는다 (FE-28). `ContractAndMsw.test.ts:1017` 은 방금 만든 객체 리터럴을 단언한다 (FE-29). 피드 첫 화면의 Loading·Error·Empty 를 그리는 테스트가 없다 (FE-30). MSW 가 backend 와 다르게 응답해 테스트가 실제 순서·필드를 검증하지 못한다 (FE-31). eslint 경고 41개 (FE-32). |

### 1.1 검사 실행 결과 (2026-11-09, 직접 실행)

`make check` (저장소 루트, 종료 코드 **0**):

```
cd backend && ../.venv/bin/pytest -v tests/
============================= 217 passed in 13.33s =============================
cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit
$ vitest run
 Test Files  52 passed (52)
      Tests  649 passed (649)
$ eslint
✖ 41 problems (0 errors, 41 warnings)
EXIT=0
```

- `tsc --noEmit` 은 출력 0줄로 끝났다 (오류 0).
- vitest stderr 에 실패가 아닌 메시지 두 개가 나온다: `vitest.config.ts` 를 CommonJS 로 읽는 Vite `configLoader: 'native'` 경고, jsdom `Not implemented: navigation to another Document`.
- 실행 전후 `git status --porcelain` 이 같았다 (추적 파일 변경 없음).

eslint 경고 41개 (오류 0) 내역:

| 구분 | 수 | 파일 (경고 수) | 규칙 |
|---|---:|---|---|
| 제품 코드 | 3 | `src/components/chat/ChatWorkspace.tsx:508` (1, `useCallback` 의존성에 `selectedTier` 없음 = FE-01), `src/components/chat/useChatSessions.ts:14`·`:16` (2, 미사용 import `fromChatFocusFilter`·`chatMessageItemToUiMessage`) | `react-hooks/exhaustive-deps` 1, `@typescript-eslint/no-unused-vars` 2 |
| MSW (`src/mocks/**`) | 24 | `handlers.ts` (20), `handlers/chat.ts` (2: `MODEL_TO_TIER`, `timeRange`), `fixtures/chat.ts` (2) | `no-unused-vars` |
| 테스트 (`src/tests/**`) | 14 | `chat/ContractAndMsw.test.ts` (7), `chat/ChatSidebar.test.tsx` (3), `ResponsiveLayout.test.tsx` (1), `ThemeSystem.test.tsx` (1), `chat/ChatWorkspace.test.tsx` (1), `chat/WorkflowStepTracker.test.tsx` (1) | `no-unused-vars` |

`make check` 는 경고로 실패하지 않는다. 경고는 lint '오류' 가 아니므로 개별 지적으로 반복하지 않고, 제품 코드의 `exhaustive-deps` 1건만 실제 결함이라 FE-01 로 다뤘다 (나머지는 FE-32 정리 권장).

---

## 2. 세부 피드백 및 코드 개선 제안 (Action Items)

경로는 `frontend/` 기준이다. 심각도는 **[머지 전 필수]** 와 **[권장]** 두 가지다.

### Pillar 1: React·Next.js 아키텍처

### FE-01 [머지 전 필수] 모델을 바꾼 뒤 보내도 이전 티어로 요청한다 (오래된 클로저)
- **재리뷰 (2026-11-09)**: **해결**. 9.1절.
- **위치**: `src/components/chat/ChatWorkspace.tsx:246-509` (의존성 배열 `:508`), 사용처 `:287-288`, `:320-321`, `:417-418`, `:456-457`, 전달 `:726`
- **근거 (실행 확인)**: `handleSendMessage` 는 `selectedTier` 를 읽지만 의존성 배열(`:508`)에 없다. 티어를 바꿔도 `messages`·`isStreaming` 등 배열의 값이 바뀌지 않으면 이전 콜백이 그대로 `ChatPromptInput` 의 `onSubmit`(`:726`)으로 남는다. 임시 테스트에서 모델 선택을 `Haiku 5.5` 로 바꾸고(트리거 글자 `Haiku` 확인) 바로 보냈더니 MSW 가 받은 본문은 `model_tier = sonnet`, `model = claude-sonnet-5-5` 였다. eslint 도 같은 줄을 경고한다 (1.1절). 옛 알려진 문제의 '의심' 이 사실로 확인됐다.
- **현재 코드**:
```typescript
    [isStreaming, scopeMode, activeSource, sessionId, focusFilters, messages, createOrUpdateSession]
```
- **개선 제안 (Diff)**:
```diff
-    [isStreaming, scopeMode, activeSource, sessionId, focusFilters, messages, createOrUpdateSession]
+    [isStreaming, scopeMode, activeSource, sessionId, focusFilters, messages, selectedTier, createOrUpdateSession]
```
  회귀 테스트(FE-28)를 같이 넣는다: 티어를 바꾼 뒤 보낸 요청 본문의 `model_tier` 가 바꾼 값인지 단언한다.

### FE-02 [머지 전 필수] 상태 갱신 함수 안에서 서버 저장을 부르고, 한 턴을 두 번 저장한다
- **재리뷰 (2026-11-09)**: **해결**. 9.1절.
- **위치**: `src/components/chat/ChatWorkspace.tsx:410-436` (`done` 처리), `:449-470` (루프 뒤 마무리), `:472-486` (중단), 저장 함수 `src/components/chat/useChatSessions.ts:159-249` (`:233-246` 의 `POST /api/chat/sessions`)
- **근거 (실행 확인)**: `createOrUpdateSession` (localStorage 쓰기 + `fetch` POST) 을 `setMessages((prev) => …)` 갱신 함수 안에서 부른다. React 갱신 함수는 순수해야 하고 개발 모드 StrictMode 에서는 두 번 실행된다. 또 `done` 이벤트에서 한 번, 루프가 끝난 뒤 마무리에서 한 번 더 부른다 (마무리는 상태가 `streaming` 이 아니어도 저장한다). 임시 테스트에서 질문 한 번에 `POST /api/chat/sessions` 가 StrictMode 없이 **2번**, `React.StrictMode` 안에서 **4번** 나갔다. 두 번째 POST 는 같은 클라이언트 메시지 id 를 다시 보내므로, `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` CT-008 이 적은 backend 의 id 중복 검사 없는 INSERT 와 만나 기본 키 충돌이 날 것으로 보인다 (backend 쪽은 실행하지 않았다). `useChatSessions.ts:190-230` 의 `setSessions` 갱신 함수도 localStorage 를 쓴다.
- **현재 코드**:
```typescript
              } else if (eventType === 'done') {
                setMessages((prev) => {
                  const updated = prev.map(/* … completed … */);
                  // Commit completed turn to dual-layer session store
                  createOrUpdateSession({ sessionId, /* … */ messages: updated });
                  return updated;
                });
```
- **개선 제안 (Diff)**: 스트리밍 중에는 다른 메시지가 바뀌지 않으므로(전송·모델 변경이 막혀 있다) 보조 메시지를 지역 변수로 누적하고, 루프가 끝난 뒤 갱신 함수 **밖에서** 한 번만 저장한다.
```diff
+      let assistantFinal: ChatMessage = initialAssistantMessage;
+      const updateAssistant = (patch: Partial<ChatMessage>) => {
+        assistantFinal = { ...assistantFinal, ...patch };
+        setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? assistantFinal : m)));
+      };
 …
-              } else if (eventType === 'done') {
-                setMessages((prev) => {
-                  const updated = prev.map(/* … */);
-                  createOrUpdateSession({ /* … */ messages: updated });
-                  return updated;
-                });
+              } else if (eventType === 'done') {
+                receivedDone = true;
+                updateAssistant({
+                  status: 'completed',
+                  model_used: data.model || TIER_TO_MODEL[selectedTier],
+                  model_tier: data.model_tier || selectedTier,
+                  latency_ms: data.latency_ms,
+                  usage: data.usage,
+                });
 …
-        setMessages((prev) => {
-          const final = prev.map(/* … */);
-          createOrUpdateSession({ /* … */ messages: final });
-          return final;
-        });
+      } finally {
+        // 완료·중단 모두 여기서 한 번만 저장한다 (갱신 함수 밖)
+        void createOrUpdateSession({
+          sessionId, scopeMode: targetScope, activeSourceId: targetSourceId,
+          activeSourceTitle: targetTitle, focusFilters,
+          messages: [...messages, userMessage, assistantFinal],
+        });
```
  `useChatSessions.createOrUpdateSession` 도 `setSessions` 갱신 함수 안의 localStorage 쓰기를 갱신 함수 밖으로 옮긴다. backend 의 `persist_turn` 과 프론트 POST 가 같은 턴을 둘 다 저장하는 문제(CT-008)는 저장 주체를 하나로 정해야 끝난다 (backend 측은 `docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md`).

### FE-03 [머지 전 필수] `done` 없이 끊긴 스트림을 완료로 표시하고 그대로 저장한다
- **재리뷰 (2026-11-09)**: **해결**. 부수 문제는 FE-33·FE-34 (9.3절).
- **위치**: `src/components/chat/ChatWorkspace.tsx:449-470`
- **근거 (실행 확인)**: 루프가 끝나면 `status === 'streaming'` 인 보조 메시지를 무조건 `completed` 로 바꾼다. 임시 테스트에서 `token` 이벤트 하나만 보내고 `done` 없이 스트림을 닫자 화면에 `잘린 답` 이 보이고 재시도 버튼이 0개였으며, localStorage 에 저장된 메시지 상태는 `["completed","completed"]` 였다. 잘린 답이 완료된 답처럼 보이고 출처 배지·익스포트 툴바(`status === 'completed'` 조건)가 붙는다.
- **현재 코드**:
```typescript
            msg.id === assistantMsgId && msg.status === 'streaming'
              ? { ...msg, status: 'completed' as const, /* … */ }
              : msg
```
- **개선 제안 (Diff)**:
```diff
+        let receivedDone = false;
         while (true) {
 …
               } else if (eventType === 'done') {
+                receivedDone = true;
 …
-            msg.id === assistantMsgId && msg.status === 'streaming'
-              ? { ...msg, status: 'completed' as const, model_tier: msg.model_tier || selectedTier, model_used: msg.model_used || TIER_TO_MODEL[selectedTier] }
-              : msg
+            msg.id === assistantMsgId && msg.status === 'streaming'
+              ? receivedDone
+                ? { ...msg, status: 'completed' as const, model_tier: msg.model_tier || selectedTier, model_used: msg.model_used || TIER_TO_MODEL[selectedTier] }
+                : { ...msg, status: 'error' as const, errorMessage: '응답이 중간에 끊겼습니다. 다시 시도해 주세요.' }
+              : msg
```
  backend 가 `stop_reason` 을 보지 않는 문제는 backend 범위다.

### FE-04 [권장] 재시도가 실패한 질문을 history 에 한 번 더 넣는다
- **위치**: `src/components/chat/ChatWorkspace.tsx:628-637` (재시도), `:297-304` (history 계산)
- **근거 (실행 확인)**: 재시도는 실패한 질문·답 쌍을 `setMessages` 로 지운 뒤 바로 `handleSendMessage(questionText)` 를 부른다. 이 콜백이 잡은 `messages` 는 지우기 전 목록이라, 상태가 `sent` 인 실패 질문이 history 에 들어간다. 임시 테스트에서 첫 요청을 502 로 실패시킨 뒤 재시도하니 두 번째 요청 본문이 `history = [{"role":"user","content":"재시도 질문"}]`, `question = 재시도 질문` 이었다 (같은 질문 두 번). 재시도하지 않은 실패 턴도 답 없는 `user` 메시지로 history 에 남는다.
- **개선 제안 (Diff)**:
```diff
       const historyPayload: ChatMessageHistory[] = applySlidingWindow(
         messages
-          .filter((m) => m.status === 'completed' || m.status === 'sent')
+          // 답이 완료된 턴만 보낸다 (실패·중단 턴의 질문은 빼고, 재시도 대상 질문도 빼서 중복을 막는다)
+          .filter((m, i, arr) =>
+            m.role === 'assistant'
+              ? m.status === 'completed'
+              : arr[i + 1]?.role === 'assistant' && arr[i + 1]?.status === 'completed')
```

### FE-05 [권장] 오류 경계가 없다
- **위치**: `src/app/` 에 `error.tsx`·`global-error.tsx`·`not-found.tsx`·`loading.tsx` 가 없다 (`ls` 확인). `ErrorBoundary`·`componentDidCatch` 도 0건.
- **근거**: 렌더 중 예외 하나가 페이지 전체를 지운다. FE-17·FE-18 처럼 localStorage 값 하나로 생기는 예외는 저장값을 지우기 전까지 매번 재현된다.
- **개선 제안 (Diff)**:
```diff
+// src/app/error.tsx
+'use client';
+import { ErrorState } from '@/components/ui/ErrorState';
+export default function Error({ error, reset }: { error: Error; reset: () => void }) {
+  return <ErrorState title="화면을 그리지 못했습니다" message={error.message} onRetry={reset} />;
+}
```

### FE-06 [권장] 훅·이벤트 prop 을 쓰는 공용 부품에 `'use client'` 가 없다
- **위치**: `src/components/ui/Textarea.tsx` (`useLayoutEffect`), `ui/SearchField.tsx` (`useRef`), `ui/TextField.tsx`·`ui/Switch.tsx` (`useId`), `ui/SegmentedControl.tsx`·`ui/ErrorState.tsx` (`onClick`), `feed/FeedStatusBar.tsx` (`onChange`). `grep -L "use client"` 로 확인.
- **근거**: 지금은 RCC 에서만 import 되어 동작하지만, RSC(`app/chat/page.tsx` 같은 곳)에서 직접 쓰면 빌드 오류가 난다. `docs/ui-system-designer/01_COMPONENT_SPEC.md` 10절 11번과 같다. 훅이 없는 `Button`·`Badge`·`Card` 등은 RSC 에서 쓸 수 있어 지금처럼 두는 것이 맞다.
- **개선 제안 (Diff)**: 위 7개 파일 맨 위에
```diff
+'use client';
```

### FE-07 [권장] 챗 호출 6곳이 `lib/api.ts` 를 거치지 않고 시간 제한이 없다
- **위치**: `src/components/chat/useChatSessions.ts:67`, `:136`, `:234`, `:265`, `src/components/chat/ChatWorkspace.tsx:310`, `:530`
- **근거**: 이 6곳은 `fetch` 를 직접 부른다. `lib/api.ts:25-37` 의 `fetchWithTimeout`(기본 8초)을 쓰지 않아 세션 목록·상세·출처 조회가 멈추면 로딩이 끝나지 않는다. 또 챗 스트림은 상대 경로라 Next rewrite 프록시를 거치는데, 뉴스 Ask AI 스트림은 `getDirectApiBase`(`lib/api.ts:12-23`)로 backend 에 직접 붙는다. 그 함수 주석이 적은 rewrite 청크 버퍼링이 챗 스트림에도 영향을 주는지는 확인하지 못했다 (`01_COMPONENT_SPEC.md` 10절 1·7번).
- **개선 제안 (Diff)**:
```diff
-    return fetch(`/api/chat/sessions?limit=${MAX_SESSIONS}`)
+    return fetchChatSessions(MAX_SESSIONS) // lib/api.ts 에 fetchWithTimeout 기반 함수로 옮긴다
```
  스트림 본문(`/api/chat/stream`)에는 전체 시간 제한 대신 '첫 바이트까지' 제한만 둔다.

### FE-08 [권장] 쓰지 않는 코드와 연결되지 않은 prop
- **위치와 근거** (각각 `grep` 으로 호출처 0건 확인):
  - 렌더하는 곳이 없는 컴포넌트: `src/components/WebhookSettingsModal.tsx` (localStorage 키 `agentlens_webhook_url` 포함, 공통 `Dialog` 를 쓰지 않는 옛 모달), `src/components/ThemeToggle.tsx` (테스트만 쓴다)
  - import 되지 않는 모듈: `src/lib/env.ts` (FE-21)
  - 호출처 없는 api 함수: `askQuestionAboutNews` (`lib/api.ts:70`), `sendBriefingToWebhook` (`:232`, 위 미사용 모달에서만), `deleteAllNews` (`:258`), `discoverSources` (`:417`), `registerCandidate` (`:433`)
  - 연결되지 않은 콜백: `ChatWorkspace` 가 `ChatMessageList` 에 `onOpenSourceDetail` 을 넘기지 않아(`ChatWorkspace.tsx:687-698`) 인용 팝오버의 `기사 상세` 버튼(`CitationPopover.tsx:87`)이 나타나지 않는다. `onCopyMessage={() => {}}` (`:697`) 는 빈 함수다. `ChatPage` 는 `initialSourceId`·`initialQuestion` 을 넘기지 않는다 (`app/chat/page.tsx:20`). `HotkeyListener` 의 `onCloseOverlays`·`onToggleCommandPalette`·`customHotkeys` (`HotkeyListener.tsx:36-40`), `NewsCard`·`NewsDetailModal` 의 `onHandoverToChat`, `DeleteConfirmPopover`·`CitationPopover` 의 `anchorRect` (`:13`, `:16`)
  - 화면에 없는 변형: `ChatModelSelector` 의 `header-compact`·`header-chip` (`ChatModelSelector.tsx:13-14`, `:93`), `ModelTierBadge` 의 `chip`·`pill`·`pipeline`, `HandoverCtaButton` 의 `modal-icon`
  - 중복 타입: `types/chat.ts:921-948` 의 옛 `ChatHeaderProps` (`selectedTier`·`onSelectTier` 포함)와 `ChatHeader.tsx:17-34` 의 같은 이름 인터페이스. `SourcesResponse`·`SourceItem`·`MonitoredRepo` 가 `types/news.ts`(zod)와 `lib/api.ts:270-329`(interface) 두 곳에 다르게 있다 (CT-006)
- **개선 제안 (Diff)**: 미사용 파일·함수·변형을 지우고, `onOpenSourceDetail` 은 연결하거나 prop 을 지운다.
```diff
         <ChatMessageList
 …
-          onCopyMessage={() => {}}
+          onOpenSourceDetail={(id) => router.push(`/chat?sourceId=${id}`)}
```

### Pillar 2: 성능·번들

### FE-09 [머지 전 필수] 검색어 한 글자마다 다시 요청하고, 페이지를 1로 돌리지 않는다
- **재리뷰 (2026-11-09)**: **해결**. 부수 문제는 FE-35 (9.3절).
- **위치**: `src/components/feed/FeedToolbar.tsx:142` (입력 `onChange`), `src/hooks/useNewsFeed.ts:26` (`listKey` 에 `search`·`page`), `:71-98` (목록 요청 effect)
- **근거 (실행 확인)**: 입력 `onChange` 는 `onSearchChange` 만 부르고 `onPageChange(1)` 은 Enter(`:143-146`)와 지우기(`:147-150`)에서만 부른다. `search` 가 바로 목록 키라 글자마다 요청이 나간다. 임시 테스트에서 3페이지로 간 뒤 `m`·`mc`·`mcp` 를 입력하자 요청이 `?search=m&…&page=3`, `?search=mc&…&page=3`, `?search=mcp&…&page=3` 으로 세 번 나갔다. 결과가 18건 이하이면 3페이지는 비어 `조건에 일치하는 소식이 없습니다` 가 보인다. 이전 요청은 `cancelled` 플래그로 무시만 하고 중단(abort)하지 않는다. Enter 를 누르면 `setPage(1)` 과 `loadNews()` 로 한 번 더 요청한다.
- **현재 코드**:
```typescript
      onChange={(e) => onSearchChange(e.target.value)}
```
- **개선 제안 (Diff)**:
```diff
-      onChange={(e) => onSearchChange(e.target.value)}
+      onChange={(e) => {
+        onSearchChange(e.target.value);
+        onPageChange(1);
+      }}
```
```diff
 // src/hooks/useNewsFeed.ts — 요청 키에는 입력이 멈춘 뒤의 값만 쓴다
+  const debouncedSearch = useDebouncedValue(search, 300);
-  const listKey = JSON.stringify([category, source, search, sort, highSignalOnly, page]);
+  const listKey = JSON.stringify([category, source, debouncedSearch, sort, highSignalOnly, page]);
```
  (300ms 는 예시 값이다. 측정한 값이 아니다.)

### FE-10 [권장] 스트리밍 토큰마다 모든 메시지와 마크다운을 다시 그린다
- **위치**: `src/components/chat/ChatWorkspace.tsx:402-409` (토큰마다 `setMessages`), `:148-168` (`timelineItems` 매번 정렬), `src/components/chat/ChatMessageList.tsx:43-45` (토큰마다 `scrollIntoView` smooth), `:99-128`, `src/components/chat/ChatMessageItem.tsx:31` (memo 없음), `:98` (`markdownComponents` 를 렌더마다 새로 만듦), `:285` (`ReactMarkdown`)
- **근거 (코드로 확인)**: 토큰 하나가 `messages` 배열을 새로 만들고, `ChatMessageItem` 은 `React.memo` 가 아니며 `markdownComponents` 객체가 매번 새로 생겨 이전 답들까지 마크다운을 다시 파싱한다. 대화가 길수록 토큰당 비용이 커진다. 측정은 하지 않았다.
- **개선 제안 (Diff)**:
```diff
-export default function ChatMessageItem({
+function ChatMessageItem({
 …
-  const markdownComponents: Components = {
+  const markdownComponents = useMemo<Components>(() => ({
 …
-  };
+  }), [message.sources, onOpenSourceDetail]);
 …
+export default React.memo(ChatMessageItem);
```
  `onRetry`·`onCopy` 는 `useCallback` 으로 고정하고, 스크롤은 스트리밍 중 `behavior: 'auto'` 로 바꾸거나 `requestAnimationFrame` 으로 묶는다.

### FE-11 [권장] 코드 분할이 없다
- **위치**: `src/app/page.tsx:8-12`, `:22` (대화상자 6개 정적 import), `next/dynamic`·`React.lazy` 사용 0건 (`grep` 확인)
- **근거**: 홈은 `'use client'` 페이지(`page.tsx:1`)이고, 처음에 닫혀 있는 `NewsDetailModal`·`DailyBriefingModal`(둘 다 `MarkdownViewer` → `react-markdown`·`remark-gfm`), `ScheduleModal`, `McpModal`, `BriefingSettingsModal`, `SourcesModal` 이 첫 번들에 들어간다. 번들 크기는 이번에 빌드해 재지 않았다.
- **개선 제안 (Diff)**:
```diff
-import NewsDetailModal from '@/components/NewsDetailModal';
+import dynamic from 'next/dynamic';
+const NewsDetailModal = dynamic(() => import('@/components/NewsDetailModal'), { ssr: false });
```
  나머지 대화상자도 같은 방식으로 바꾸고, 바꾸기 전후 `make build` 의 번들 크기를 재서 남긴다.

### Pillar 3: 접근성·디자인 토큰

### FE-12 [권장] 세션 카드 안에 버튼이 중첩된다
- **위치**: `src/components/chat/SessionItemCard.tsx:79-126`
- **근거**: `role="button"` `tabIndex={0}` 인 `div` 안에 삭제 `IconButton` 이 있다. 상호작용 요소 중첩(WCAG 4.1.2 Name, Role, Value, axe `nested-interactive`)이라 스크린 리더가 바깥 버튼 이름에 안쪽 버튼을 섞어 읽거나 안쪽을 건너뛸 수 있다. 키보드는 `stopPropagation` 으로 동작한다 (`:119-123`).
- **개선 제안 (Diff)**:
```diff
-    <div className="group relative w-full">
-      <div role="button" tabIndex={0} … onClick={handleCardClick} onKeyDown={handleKeyDown}>
-        <div className="min-w-0 flex-1">…</div>
-        <IconButton … />
-      </div>
+    <div className="group relative flex w-full items-center">
+      <button type="button" aria-current={isActive ? 'true' : undefined} onClick={handleCardClick} className="min-w-0 flex-1 text-left …">
+        …제목·배지·시간…
+      </button>
+      <IconButton … />
     </div>
```

### FE-13 [권장] 인용 팝오버가 답변 문단 `<p>` 안에 `div` 로 그려진다
- **위치**: `src/components/chat/CitationBadge.tsx:45`, `:77` (배지 `span` 안에 `CitationPopover`), `src/components/chat/CitationPopover.tsx:76`, `:80` (안에 `<p>`), `src/components/ui/Popover.tsx:112-113` (포털 없이 `<div>` 반환, `createPortal` 0건)
- **근거**: 마크다운 문단 `<p>` → 배지 `span` → 팝오버 `div` → `p` 로 HTML 중첩 규칙(`<p>` 안 흐름 콘텐츠 금지)에 어긋난다. React 는 개발 모드에서 `<div> cannot be a descendant of <p>` 경고를 내고, 부모의 `overflow`·쌓임 맥락에 팝오버가 잘릴 수 있다 (`01_COMPONENT_SPEC.md` 10절 4번).
- **개선 제안 (Diff)**:
```diff
 // src/components/ui/Popover.tsx
+import { createPortal } from 'react-dom';
 …
-  return (
-    <div …>
+  return createPortal(
+    <div …>
 …
-    </div>
-  );
+    </div>,
+    document.body
+  );
```
  포털로 옮기면 위치를 `anchorRef` 의 `getBoundingClientRect()` 로 계산해야 한다.

### FE-14 [권장] 챗 로그 live region 이 토큰마다 읽힌다
- **위치**: `src/components/chat/ChatMessageList.tsx:93-95`
- **근거**: 메시지 목록 전체가 `role="log" aria-live="polite" aria-relevant="additions text"` 라, 스트리밍 중 토큰이 붙을 때마다 바뀐 글자가 스크린 리더 대기열에 쌓인다. 답이 끝날 때까지 다른 안내가 밀린다.
- **개선 제안 (Diff)**:
```diff
     <div
       role="log"
       aria-live="polite"
-      aria-relevant="additions text"
+      aria-relevant="additions"
+      aria-busy={isStreaming}
```
  완료 시점에 `sr-only` 영역으로 '답변 완료' 를 한 번 알린다.

### FE-15 [권장] 세션 삭제 실패를 알리지 않고 처리하지 않은 Promise 거부로 끝난다
- **위치**: `src/components/chat/SessionItemCard.tsx:67-75` (`try/finally` 만 있음), `src/components/chat/useChatSessions.ts:264-275` (실패 시 목록을 다시 읽고 다시 던짐), `src/components/chat/ChatWorkspace.tsx:235-243`
- **근거 (코드로 확인)**: DELETE 가 실패하면 낙관적으로 지운 카드가 목록 재조회로 다시 나타나지만 오류 문구가 없다. 던진 오류는 `handleDeleteConfirm` 에서 잡히지 않는다.
- **개선 제안 (Diff)**:
```diff
   const handleDeleteConfirm = async () => {
     setIsDeleting(true);
     try {
       await onDelete(session.id);
+    } catch (e) {
+      toast.show({ message: (e instanceof Error && e.message) || '대화를 삭제하지 못했습니다.', tone: 'danger' });
     } finally {
```

### FE-16 [권장] 공통 부품을 두고 새로 만든 버튼, `themeColor` hex 중복
- **위치**: 공통 `Button`/`IconButton` 대신 `<button>` 을 직접 쓴 곳 14개 파일 (`ui/` 밖, `grep -c "<button"`): `WebhookSettingsModal.tsx` (4, 미사용), `Header.tsx` (2), `feed/InsightsBar.tsx` (2), `chat/FocusCapsule.tsx` (2), `chat/CitationPopover.tsx` (2), `NewsCard.tsx`, `news-detail/AskAiPanel.tsx`, `chat/WorkflowStepTracker.tsx`, `chat/HandoverCtaButton.tsx`, `chat/CitationBadge.tsx`, `chat/ChatSidebarHeader.tsx`, `chat/ChatModelSelector.tsx`, `chat/ChatMessageList.tsx`, `chat/ActiveSourceChip.tsx` (각 1). hex: `src/app/layout.tsx:12-13`
- **근거**: 이 가운데 카드 제목·칩·배지처럼 모양이 달라 직접 쓴 것은 타당하지만, `CitationPopover.tsx:64-72` 의 닫기 버튼은 `IconButton` (아이콘 + `aria-label` + 44/32px 크기)을 그대로 다시 구현했다. `layout.tsx:12-13` 의 `#f8fafc`·`#0e1013` 은 `globals.css:11`·`:40` 의 `--al-canvas` 와 같은 값을 복사한 것이다 (Next `Viewport.themeColor` 는 CSS 변수를 못 받는다). 한쪽만 바꾸면 모바일 브라우저 상단 색이 어긋난다. `!important` 는 0건이고 `TokenGuard` 가 통과한다.
- **개선 제안 (Diff)**:
```diff
-        <button type="button" onClick={onClose} aria-label="팝오버 닫기" title="팝오버 닫기" className="-mt-1 -mr-1 inline-flex size-11 …">
-          <X aria-hidden="true" className="size-4" />
-        </button>
+        <IconButton label="팝오버 닫기" icon={<X />} onClick={onClose} className="-mt-1 -mr-1" />
```
  `themeColor` 값은 `TokenContrast.test.ts` 처럼 `globals.css` 를 읽어 같은지 확인하는 테스트를 둔다.

### Pillar 4: 타입·상태·보안

### FE-17 [권장] 북마크 저장값이 배열이 아니면 피드 화면이 렌더 오류로 죽는다 (이전 릴리스 Nit)
- **위치**: `src/hooks/useBookmarks.ts:44-53` (`parseBookmarks`), `:70` (`bookmarkedItems.map`)
- **근거 (실행 확인)**: `JSON.parse` 결과를 `NewsItem[]` 로 단정하고 배열인지 보지 않는다. 임시 테스트에서 `agentlens_bookmarks` 에 `{"a":1}` 을 넣고 훅을 렌더하자 `bookmarkedItems.map is not a function` 이 났다. `null` 도 같다. 오류 경계가 없어(FE-05) 홈 전체가 그려지지 않고, 저장값을 지우기 전까지 반복된다. 앱 자신은 배열만 쓰므로 다른 탭·수동 편집·이전 형식에서만 생긴다. 배열 안 원소 모양도 검증하지 않는다.
- **현재 코드**:
```typescript
    const parsed: NewsItem[] = JSON.parse(raw);
    return parsed;
```
- **개선 제안 (Diff)**:
```diff
-    const parsed: NewsItem[] = JSON.parse(raw);
-    return parsed;
+    const parsed: unknown = JSON.parse(raw);
+    const result = z.array(NewsItemSchema).safeParse(parsed);
+    return result.success ? result.data : [];
```
  회귀 테스트: 배열 아닌 값·`null`·원소가 숫자인 배열을 넣고 빈 북마크로 렌더되는지 본다.

### FE-18 [권장] 챗 세션 목록 저장값이 배열이 아니면 챗 화면이 죽는다
- **위치**: `src/components/chat/useChatSessions.ts:45-54` (첫 상태), `:86-89` (서버 실패 시 대체), `:129-132` (세션 상세 캐시)
- **근거 (실행 확인)**: 세 곳 모두 `JSON.parse` 결과를 그대로 상태로 쓴다. 임시 테스트에서 `agentlens_chat_sessions_index` 에 `{"x":1}` 을 넣고 세션 목록 API 를 500 으로 만들자 `sessions.map is not a function` 이 났다. 서버가 응답하면 목록은 덮어쓰지만, 첫 렌더는 저장값으로 그리므로 서버 응답 전에 이미 실패한다.
- **개선 제안 (Diff)**:
```diff
-      if (cached) {
-        return JSON.parse(cached);
-      }
+      if (cached) {
+        const parsed: unknown = JSON.parse(cached);
+        return Array.isArray(parsed) ? (parsed as ChatSessionMeta[]).filter((s) => typeof s?.id === 'string') : [];
+      }
```
  상세 캐시는 `ChatSessionDetailSchema.safeParse` 로 확인한다 (CT-002 를 먼저 고쳐야 한다, FE-19).

### FE-19 [권장] 응답을 런타임에 검증하지 않는다
- **위치**: `src/lib/api.ts` 의 모든 `return res.json()` (예: `:60`, `:67`), `src/components/chat/ChatWorkspace.tsx:533` (`as ChatSourceDetailResponse`), `:373` (SSE `JSON.parse`), `src/components/chat/useChatSessions.ts:73`, `:138`. zod 의 `parse`·`safeParse` 를 쓰는 제품 코드는 `types/chat.ts:554-574` 의 `parseChatSseEvent` 뿐이고 호출처가 없다.
- **근거**: `docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` CT-026 과 같다. 그래서 CT-002 (`publisher: null` 을 zod 가 거부), CT-003·CT-005 (`full_content`·`scraped_at`), CT-021 (null 과 optional 혼동) 같은 불일치가 화면에서 드러나지 않는다. 지금 바로 `parseChatSseEvent` 를 쓰면 backend 가 보내는 `publisher: null` 때문에 모든 `sources` 이벤트가 `null` 이 된다 (CT-002, 계약 문서에서 실행 확인).
- **개선 제안 (Diff)**: CT-002 를 먼저 고친 뒤 경계에서 `safeParse` 한다.
```diff
 // src/types/chat.ts (ChatSourceItemSchema)
-  publisher: z.string().optional(),
+  publisher: z.string().nullable().optional(),
```
```diff
 // src/components/chat/ChatWorkspace.tsx
-              const data = JSON.parse(dataStr);
+              const parsedEvent = parseChatSseEvent(eventType, dataStr);
+              if (!parsedEvent) continue; // 계약 위반은 건너뛰고 개발 모드에서 경고
```

### FE-20 [권장] 초기화를 실행하지 않고 끝나도 확인 창이 성공처럼 닫힌다 (이전 릴리스 Nit)
- **위치**: `src/hooks/useCollector.ts:229-244` (`:230` 요청 중이면 `return`, `:235` 구독 세대가 바뀌면 `return`), `src/components/ResetConfirmDialog.tsx:33-37`
- **근거 (코드로 확인)**: `resetAndCollect` 는 두 경우에 아무것도 하지 않고 정상 종료한다. 확인 창은 정상 종료를 성공으로 보고 닫은 뒤 `onDone` 을 부른다. 지금 UI 에서는 확인 창이 `busy` 동안 닫히지 않고 메뉴·스케줄 대화상자의 초기화 진입점은 `isCollecting` 이면 막혀 있어(`Header.tsx:118`, `ScheduleModal.tsx:74`) 실제로 겪기는 어렵다. 함수 주석(`:225-228`)과 반환 계약이 다르다는 결함이다.
- **개선 제안 (Diff)**:
```diff
-export async function resetAndCollect(): Promise<void> {
-  if (resetInFlight) return;
+export async function resetAndCollect(): Promise<'started' | 'skipped'> {
+  if (resetInFlight) return 'skipped';
 …
-    if (gen !== generation) return;
+    if (gen !== generation) return 'skipped';
 …
+    return 'started';
```
```diff
 // src/components/ResetConfirmDialog.tsx
-      await reset();
-      setBusy(false);
-      onClose();
-      onDone?.();
+      const result = await reset();
+      setBusy(false);
+      if (result === 'skipped') { setError('이미 초기화 요청을 처리하고 있습니다.'); return; }
+      onClose();
+      onDone?.();
```

### FE-21 [권장] `env.ts` 가 실행되지 않고 `NEXT_PUBLIC_APP_VERSION` 이 스키마에 없다 (이전 릴리스 Nit)
- **위치**: `src/lib/env.ts:7-28` (import 0건), `src/components/Header.tsx:66` (`process.env.NEXT_PUBLIC_APP_VERSION`), `next.config.ts:13-15`, `src/lib/api.ts:9`, `:13-14`, `:22` (`process.env` 직접 읽기), `src/app/api/health/route.ts:9` (`version: '0.4.0'` 고정)
- **근거**: `.claude/rules/environment-standards.md` 는 frontend 환경 변수를 `env.ts` 의 zod 스키마로 검증하고 새 변수를 스키마에 넣으라고 한다. 지금 `env.ts` 를 아무도 import 하지 않아 검증이 돌지 않고, 빌드 때 `next.config.ts` 가 넣는 `NEXT_PUBLIC_APP_VERSION` 은 스키마에 없다. 헤더 배지는 `package.json` 버전을 쓰지만 `/api/health` 의 버전은 손으로 맞추는 고정 문자열이다 (`docs/releases.md` '버전 문자열 위치' 에 올라 있다). 또 Dockerfile 빌드 단계가 `NEXT_PUBLIC_API_URL` 을 넘기지 않아 compose 의 값이 브라우저 번들에 들어가지 않을 가능성이 있다 (`01_COMPONENT_SPEC.md` 10절 2번, 빌드 산출물로 확인하지 못함, `docs/devops-engineer/` 범위).
- **개선 제안 (Diff)**:
```diff
 export const clientEnvSchema = z.object({
   NEXT_PUBLIC_API_URL: z.string().url().optional().or(z.literal('')),
+  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
 });
```
```diff
 // src/components/Header.tsx, src/lib/api.ts
-  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;
+  const appVersion = clientEnv.NEXT_PUBLIC_APP_VERSION;
```
```diff
 // src/app/api/health/route.ts
-    version: '0.4.0',
+    version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown',
```
  (클라이언트에서는 `NEXT_PUBLIC_*` 를 정적 참조로만 읽을 수 있으므로 `clientEnv` 는 `process.env.NEXT_PUBLIC_…` 를 하나씩 적어 만든다. 지금 `env.ts:23-28` 처럼 서버 변수까지 한 객체로 파싱하면 클라이언트에서 쓸 수 없다.)

### FE-22 [머지 전 필수] 챗 `Notion 동기화` 가 서버를 부르지 않고 성공을 표시한다
- **재리뷰 (2026-11-09)**: **해결**. 9.1절.
- **위치**: `src/components/chat/ExportToolbar.tsx:88-101`, 버튼 `:156-170`
- **근거 (코드로 확인)**: 300ms 를 기다린 뒤 `Notion 연동됨` 과 성공 아이콘을 보이고, 만들지도 않은 `https://notion.so/agentlens/report-{messageId}` 를 `onNotionSuccess` 로 넘긴다. backend 에는 챗 답을 Notion 으로 보내는 엔드포인트가 없다 (`backend/app/api/chat.py` 라우트 9개, Notion 은 `briefing.py:55`, `:95` 의 브리핑용만). 사용자는 저장됐다고 믿고 실제로는 아무것도 남지 않는다. 화면이 하지 않은 일을 성공으로 알리는 것은 데이터 무결성 결함이라 필수로 분류했다.
- **현재 코드**:
```typescript
      const notionPageUrl = `https://notion.so/agentlens/report-${messageId}`;
      await new Promise((resolve) => setTimeout(resolve, 300));
      setNotionSynced(true);
```
- **개선 제안 (Diff)**: API 가 생기기 전까지 버튼을 그리지 않는다.
```diff
-      {/* Sync Notion Button */}
-      <Button variant="ghost" size="sm" onClick={handleSyncNotion} …>
-        …
-      </Button>
+      {/* Notion 동기화: 챗 답 내보내기 API 가 생기면 그때 연결한다 */}
```
  관련 테스트(`chat/ExportToolbar.test.tsx`, `chat/ChatMessageItem.test.tsx` 의 '4-step report actions')의 기대도 같은 변경에서 고친다 (기능 제거에 따른 기대 변경이고, 통과시키려고 약하게 만드는 것이 아니다).

### FE-23 [권장] Ask AI 스트림 파서: 끝 버퍼를 버리고, 표시 기본값이 `Gemini 3.5 Flash` 다
- **위치**: `src/lib/api.ts:129-168` (`:132` 기본값, `:136-137` `done` 이면 바로 `break`)
- **근거 (코드로 확인)**: v0.3.1 에서 챗 스트림에 넣은 '끝날 때 `decoder.decode()` 와 남은 버퍼 처리' 가 이 파서에는 없다. 마지막 이벤트가 `\n\n` 없이 끝나면 그 이벤트(`done.total_text` 등)를 버린다. backend 는 지금 모든 이벤트를 `\n\n` 으로 끝내므로(`backend/app/api/news.py:157`) 실제로 잃는 경우는 확인하지 못했다. `meta` 가 오지 않으면 모델 표시가 `Gemini 3.5 Flash` 가 된다 (CT-012, 옛 알려진 문제 'Ask AI 의 Gemini 표기'). `error` 이벤트를 처리하지 않는다. 스트림 중 Anthropic 실패 시 부분 답 뒤에 대체 답이 이어 붙는 문제는 backend 가 `meta` 와 토큰을 다시 보내는 데서 생기고(`backend/app/services/llm_processor.py:936-958`), 프론트는 두 번째 `meta` 를 받으면 누적 답을 비우는 방법으로 완화할 수 있다.
- **개선 제안 (Diff)**:
```diff
-  let modelUsed = 'Gemini 3.5 Flash';
+  let modelUsed = '';
 …
-    const { done, value } = await reader.read();
-    if (done) break;
-    buffer += decoder.decode(value, { stream: true });
-    const parts = buffer.split('\n\n');
-    buffer = parts.pop() || '';
+    const { done, value } = await reader.read();
+    buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
+    const parts = buffer.split('\n\n');
+    buffer = done ? '' : parts.pop() || '';
 …
+    if (done) break;
```

### FE-24 [권장] URL 의 `session_id` 를 검증·인코딩하지 않고 경로에 넣는다
- **위치**: `src/components/chat/ChatWorkspace.tsx:516-519`, `src/components/chat/useChatSessions.ts:136`, `:265`
- **근거 (코드로 확인)**: `/chat?session_id=…` 값을 그대로 `fetch(\`/api/chat/sessions/${sessionId}\`)` 에 넣는다. `../` 를 담으면 같은 출처의 다른 GET 경로로 정규화된다. GET 이라 상태를 바꾸지는 않지만, 세션 id 는 UUID 만 받도록 막는 것이 맞다.
- **개선 제안 (Diff)**:
```diff
     const paramSessionId = searchParams?.get('session_id');
-    if (paramSessionId && !initialSessionLoadedRef.current) {
+    if (paramSessionId && z.string().uuid().safeParse(paramSessionId).success && !initialSessionLoadedRef.current) {
```
```diff
-        const res = await fetch(`/api/chat/sessions/${sessionId}`);
+        const res = await fetch(`/api/chat/sessions/${encodeURIComponent(sessionId)}`);
```

### FE-25 [권장] 화면 문구가 고정값이거나 실제 동작과 다르다
- **위치와 근거**:
  - `src/components/ScheduleModal.tsx:30`, `:47-48`: `매일 4회(0, 6, 12, 18시 UTC)`, KST `09:00, 15:00, 21:00, 03:00` 을 박아 두어 backend 스케줄이 바뀌면 따라가지 않는다. `/api/schedule/status` 의 `next_run` 만 응답 값을 쓴다 (`:55-58`).
  - `src/components/McpModal.tsx:15-23`: 설정 예시의 `"cwd": "/path/to/agentlens/backend"` 자리표시를 그대로 복사하게 한다.
  - `src/components/sources/DeepResearcherTab.tsx:110`: 'LLM 기술 적합도 분석' 이라고 쓰지만 backend 평가는 키워드 규칙이다 (옛 알려진 문제).
  - `src/components/NewsDetailModal.tsx:348`: `핵심 요약 3줄` 은 규칙 기반 요약이다 (옛 알려진 문제).
  - `src/components/chat/ModelTierBadge.tsx` 의 `TIER_META` 지연(`~0.3s`·`~0.6s`·`~1.8s`)·비용(`$`~`$$$`)은 측정값이 아닌 고정 문자열이다 (`01_COMPONENT_SPEC.md` 10절 14번).
- **개선 제안 (Diff)**:
```diff
-        description="매일 4회(0, 6, 12, 18시 UTC) 전세계 소식을 자동 수집합니다."
+        description="정해진 시각마다 전세계 소식을 자동 수집합니다."
```
  수집 시각은 backend 가 `ScheduleStatus` 에 시각 목록을 내주면 그 값으로 그린다. 적합도 문구는 '키워드 규칙' 으로, 지연·비용 표기는 '예상' 으로 바꾼다.

### FE-26 [권장] 챗 세션 상세 캐시가 localStorage 에 쌓인다
- **위치**: `src/components/chat/useChatSessions.ts:205-207` (목록을 30개로 자를 때 밀려난 세션의 상세 키를 지우지 않음), `:278-283` (`resetSessions` 가 목록 키만 지움)
- **근거**: `agentlens_chat_session_{id}` 키가 계속 늘어 용량 한도에 닿으면 이후 `setItem` 이 조용히 실패한다 (`catch {}`).
- **개선 제안 (Diff)**:
```diff
         const nextList = [updatedMeta, ...filtered].slice(0, MAX_SESSIONS);
+        for (const evicted of [updatedMeta, ...filtered].slice(MAX_SESSIONS)) {
+          localStorage.removeItem(`${STORAGE_SESSION_PREFIX}${evicted.id}`);
+        }
```

### FE-27 [권장] 개인 개발 호스트·LAN IP 가 설정에 커밋돼 있다
- **위치**: `next.config.ts:16-22` (`macbookpro.tail304081.ts.net`, `192.168.1.109`)
- **근거**: 특정 기기 이름과 사설 IP 가 저장소에 남는다. 비밀은 아니지만 다른 개발 환경에서는 의미가 없고, 이 목록 때문에 HTTP(비보안 출처) 접속을 허용하게 되어 클립보드가 폐기 예정 `execCommand('copy')` 경로를 타게 된다 (`01_COMPONENT_SPEC.md` 10절 16번).
- **개선 제안 (Diff)**:
```diff
-  allowedDevOrigins: [
-    "macbookpro.tail304081.ts.net",
-    "*.ts.net",
-    "localhost",
-    "127.0.0.1",
-    "192.168.1.109"
-  ],
+  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS ?? "localhost,127.0.0.1").split(","),
```
  새 변수는 `env.ts`·`.env.example` 에 함께 넣는다.

### Pillar 5: 테스트

### FE-28 [권장] 필수 결함 4건을 잡는 회귀 테스트가 없다
- **위치**: `src/tests/chat/ChatWorkspace.test.tsx` (모델 변경 테스트는 트리거 글자만 단언, 요청 본문 단언 없음), `src/tests/feed/FeedToolbar.test.tsx`, `src/tests/hooks/useNewsFeed.test.tsx`
- **근거**: FE-01(요청의 `model_tier`), FE-02(턴당 세션 POST 횟수), FE-03(`done` 없이 끝난 스트림의 상태), FE-09(입력 중 페이지·요청 수)는 이번 감사에서 임시 테스트로 바로 재현됐지만 저장소 테스트에는 같은 단언이 없다. 이 지적은 필수 항목을 고칠 때 Red 테스트로 먼저 넣는다.
- **개선 제안 (Diff)**:
```diff
+  it('sends the tier selected right before sending', async () => {
+    const bodies: unknown[] = [];
+    server.use(http.post('*/api/chat/stream', async ({ request }) => { bodies.push(await request.json()); return sse('event: done\ndata: {}\n\n'); }));
+    render(<ChatWorkspace />);
+    fireEvent.click(screen.getByRole('button', { name: /Claude 모델 선택/ }));
+    fireEvent.click(screen.getByRole('radio', { name: /Haiku 5.5/ }));
+    /* 입력 후 Enter */
+    await waitFor(() => expect(bodies[0]).toMatchObject({ model_tier: 'haiku' }));
+  });
```

### FE-29 [권장] 컴포넌트가 받지 않는 prop 을 단언하는 계약 테스트
- **위치**: `src/tests/chat/ContractAndMsw.test.ts:1017-1030` 부근 (`verifies UI component prop contracts compatibility`)
- **근거**: 테스트가 만든 `ChatHeaderProps` 객체 리터럴(`selectedTier: 'sonnet'` 포함)의 필드를 바로 다시 단언한다. 이 타입은 `types/chat.ts:921-948` 의 옛 정의이고 실제 `ChatHeader` 는 `ChatHeader.tsx:17-34` 의 다른 인터페이스를 받으며 모델 선택을 받지 않는다. 통과해도 아무것도 보장하지 않는다 (옛 알려진 문제 '테스트·운영' 1행).
- **개선 제안 (Diff)**:
```diff
-    it('verifies UI component prop contracts compatibility', () => {
-      const headerProps: ChatHeaderProps = { scopeMode: 'global', onNewChat: () => {}, selectedTier: 'sonnet', onSelectTier: () => {}, isStreaming: false };
-      expect(headerProps.selectedTier).toBe('sonnet');
+    // 옛 ChatHeaderProps 를 지우고(FE-08), 헤더에 모델 선택이 없다는 사실은 ChatHeader.test.tsx 의 R39 테스트가 이미 본다.
```

### FE-30 [권장] UI 5대 상태 테스트 공백
- **위치·근거** (`docs/frontend-tdd-engineer/01_TDD_CYCLE_LOG.md` 3.2절과 같다):
  - 피드 메인 화면(`src/app/page.tsx`)의 Loading (`NewsCardSkeleton`, `:214-221`)·Error (`ErrorState`, `:223-233`)·Empty (`EmptyState`, `:252-264`)를 그리는 테스트가 없다. 상태 전환은 `hooks/useNewsFeed.test.tsx` 의 훅 값으로만 본다.
  - MSW 지연으로 '로딩 표시가 보인다' 를 단언하는 화면 테스트가 없다 (모두 props 로 상태를 넘긴다).
  - `useChatSessions` 가 MSW `GET */api/chat/sessions` 500 을 받아 사이드바 오류 상태로 바뀌는 흐름 테스트가 없다.
  - 소스 대화상자·딥 리서처 탭·스케줄 대화상자·MCP 모달의 Loading·Error·Empty 테스트가 없다.
  - 일일 브리핑 대화상자의 브리핑 없음·요청 실패 화면 테스트가 없다.
- **개선 제안 (Diff)**:
```diff
+// src/tests/feed/HomePage.test.tsx
+it('shows skeletons, then ErrorState on 500, then EmptyState on an empty list', async () => {
+  server.use(http.get('*/api/news', async () => { await delay(50); return HttpResponse.json({}, { status: 500 }); }));
+  render(<HomePage />);
+  expect(screen.getByText('소식을 불러오는 중...')).toBeInTheDocument();
+  expect(await screen.findByRole('alert')).toBeInTheDocument();
+});
```

### FE-31 [권장] MSW 가 backend 와 다르게 응답해 테스트가 실제 계약을 검증하지 못한다
- **위치·근거** (`docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md` 7절):
  - CT-011: MSW 는 `sources` 를 항상 토큰 **앞**에 보내고 `evaluating_sufficiency`·`agentic_searching` 단계와 보충 출처 `[S1]` 을 보낸다. backend global 모드는 `sources` 를 토큰 **뒤**에 보내고 보충 출처가 없다. `ChatWorkspace` 테스트는 MSW 순서로만 돈다.
  - CT-010: MSW 에만 `GET /api/chat/stream` 이 있다 (`src/mocks/handlers.ts:480`).
  - CT-002·CT-013: fixture 는 `publisher` 를 빼고 보내 backend 의 `publisher: null` 을 재현하지 않는다. `initialMockSessions[2]` 는 UUID variant 가 `0` 이라 `ChatSessionDetailSchema` 를 통과하지 못한다 (`src/mocks/fixtures/chat.ts:321` 부근).
  - CT-005·CT-023·CT-014: `NewsItem.full_content`·`scraped_at` 은 MSW 에만 있고, 브리핑 `date` 형식이 다르며(MSW `YYYY-MM-DD`, backend `YYYY년 MM월 DD일`), 오류는 모두 `error_code` 형식으로 흉내 낸다 (backend 는 4가지 형식).
- **개선 제안 (Diff)**:
```diff
 // src/mocks/handlers/chat.ts (global 모드)
-  emit('sources', sourcesPayload);
-  for (const token of tokens) emit('token', { token });
+  for (const token of tokens) emit('token', { token });
+  emit('sources', { ...sourcesPayload, sources: sourcesPayload.sources.map((s) => ({ ...s, publisher: null })) });
```
  고친 뒤 `ChatWorkspace.test.tsx` 에 'sources 가 토큰 뒤에 와도 출처 칩이 그려진다' 를 더한다.

### FE-32 [권장] eslint 경고 41개 정리
- **위치**: 1.1절 표
- **근거**: 제품 코드 3개 가운데 `exhaustive-deps` 1개는 실제 결함(FE-01)이었다. 경고가 41개 쌓여 있으면 새 경고가 묻힌다. 나머지 40개는 모두 미사용 import·변수다 (제품 2, MSW 24, 테스트 14).
- **개선 제안 (Diff)**:
```diff
 // src/components/chat/useChatSessions.ts
-  fromChatFocusFilter,
   uiMessageToChatMessageItem,
-  chatMessageItemToUiMessage,
 } from '@/types/chat';
```
  정리한 뒤 `eslint --max-warnings 0` 을 `pnpm lint` 에 넣는 것을 검토한다 (`make check` 동작이 바뀌므로 별도 결정).

---

## 3. 최종 리뷰 판정 및 출시 승인

- **판정 결과 (재리뷰 2차, 2026-11-09)**: **APPROVED (승인)**
- **재리뷰 2차 코멘트**: FE-33(끊긴 스트림의 부분 답 유지)·FE-34(중단 뒤 정상 종료는 중단으로 저장)·BUG-02R(스트림 요청에 클라이언트 메시지 id)이 고쳐졌고 재현으로 확인했다. `ChatStreamTurn.test.tsx` 의 새 테스트 4개는 결함을 정확히 겨누고, `findByText` → `waitFor(getByText)` 7곳은 같은 의미라 테스트를 약하게 만들지 않았다. `make check` 종료 0 (backend 244, frontend 54개 파일 664개 통과, eslint 오류 0·경고 40, tsc 오류 0). 근거는 9.7절.
- **판정 결과 (재리뷰 1차, 2026-11-09)**: **APPROVED (승인)**
- **재리뷰 코멘트**: 머지 전 필수 5건(FE-01, FE-02, FE-03, FE-09, FE-22)이 작업 트리에서 모두 해결됐다. 1차 감사의 재현 테스트를 다시 돌려 고친 동작을 확인했고, 새 회귀 테스트 6개가 같은 결함을 막는다. 기존 테스트 기대를 바꾼 3곳은 기능 변경에 따른 정당한 변경이고 테스트를 약하게 만들지 않았다. `make check` 는 종료 0 이다. 새로 찾은 문제 3건(FE-33~FE-35)은 모두 권장이다. 근거는 9절. 커밋할 때 이 보고서의 재리뷰 범위(9절 머리)와 같은 파일만 담는다.

### 3.1 1차 감사 판정 (2026-11-09, 기록용)

- **판정 결과**: **REQUEST_CHANGES (변경 요청)**
- **판정 코멘트**:
  - `make check` 는 통과한다 (backend 217, frontend 649 통과, eslint 오류 0, `tsc` 오류 0). 그러나 통과하는 테스트가 잡지 못하는 머지 전 필수 결함 5건이 있다.
    1. FE-01: 고른 모델과 다른 모델로 요청한다 (실행 확인).
    2. FE-02: 한 턴을 두 번(개발 모드 네 번) 서버에 저장하고, 상태 갱신 함수 안에서 부수 효과를 낸다 (실행 확인).
    3. FE-03: 끊긴 답을 완료로 표시·저장한다 (실행 확인).
    4. FE-09: 2페이지 이상에서 검색하면 빈 결과가 나오고 글자마다 요청한다 (실행 확인).
    5. FE-22: 챗 Notion 동기화가 하지 않은 일을 성공으로 알린다.
  - 다섯 건 모두 고치는 범위가 작다 (의존성 한 줄, 저장 호출 위치, 완료 판정 플래그, 입력 핸들러, 버튼 제거). FE-28 의 회귀 테스트를 Red 로 먼저 넣고 고친 뒤 다시 리뷰를 요청한다.
  - 권장 27건은 이번 머지를 막지 않는다. 그중 FE-05(오류 경계)·FE-17·FE-18(localStorage 검증)은 한 번 생기면 화면이 계속 죽는 경로라 다음 작업에서 먼저 처리하기를 권한다.

---

## 4. 준수 확인 (`fullstack-code-review` 스킬)

| 항목 | 결과 | 근거 |
|---|---|---|
| 계약 (`backend/app/schemas/` ↔ `frontend/src/types/` ↔ `frontend/src/mocks/`) | 불일치 26건이 문서화돼 있고 런타임 검증이 없다 | CT-001~CT-026, FE-19, FE-31 |
| 설정 (새 frontend 변수는 `env.ts`) | 미준수 | `NEXT_PUBLIC_APP_VERSION` 이 스키마에 없고 `env.ts` 를 import 하지 않는다 (FE-21) |
| 문서 | 이번 감사는 코드를 바꾸지 않아 해당 없음 | — |
| 버전 문자열 | `frontend/package.json` `0.4.0`, `src/app/api/health/route.ts:9` `0.4.0` 으로 같다. 헤더 배지는 `package.json` 을 빌드 때 읽는다 (`next.config.ts:6`, `:14`) | FE-21 |
| 디자인 토큰 | `.tsx` hex 는 `layout.tsx:12-13` 의 `themeColor` 2개뿐, `!important` 0건, `TokenGuard`·`TokenContrast` 통과 | FE-16 |

## 5. 범위 밖으로 넘기는 항목 (backend·devops)

frontend 화면에 보이지만 원인이 backend 에 있어 이 보고서에서 수정 제안을 하지 않은 것. `docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md` 와 `docs/devops-engineer/01_DEPLOYMENT_SPEC.md` 에서 다룬다.

| 문제 | 원인 위치 | 프론트 관련 지적 |
|---|---|---|
| 챗 턴을 backend `persist_turn` 과 프론트 POST 가 둘 다 저장 (CT-008) | `backend/app/services/chat_session_service.py:241-274`, `:299-366` | FE-02 |
| 스트림 종료 시 `stop_reason` 을 보지 않음 | backend 챗 서비스 | FE-03 |
| Ask AI 스트림 중 Anthropic 실패 시 대체 답을 이어 붙임 | `backend/app/services/llm_processor.py:936-958` | FE-23 |
| GitHub 저장소 id(`owner/repo`)를 경로 한 마디로 받아 토글·삭제가 404 (CT-001, 계약 문서에서 TestClient 로 실행 확인) | `backend/app/api/sources.py:77`, `:85` (`{item_id}`), 프론트 `lib/api.ts:369`, `:399` 는 `encodeURIComponent` | 프론트는 지금대로 두고 backend 경로를 `{item_id:path}` 로 |
| 브리핑 분야 이름·이모지, 헤드라인 글자 수 자르기 | `backend/app/services/briefing_service.py:16-38`, `:86`, `:88`, `:101-102` | 없음 (프론트는 받은 글자를 그린다) |
| 챗 진행 단계 라벨의 그림 이모지 | `backend/app/services/chat_service.py:614`, `:635`, `:678`, `:693`, `:715`, `:734` | 없음 |
| RSS 채널 링크가 3000 포트 고정 (프론트는 3001) | backend RSS 생성 | 없음 |
| Dockerfile 빌드 단계에 `NEXT_PUBLIC_API_URL` 없음 | `frontend/Dockerfile` | FE-21 |

## 5.1 검사 범위 밖 (수용된 위험)

제품 오너 결정(2026-11-09)에 따라 아래 범주는 검사하지 않는다: 인증 없음과 CORS 전체 허용, SSRF, 비밀값 평문 저장, 설정 조회로 비밀값 노출, 설정 재적용 누락. 이 범주의 사실은 근거와 함께 여기 남기고, 지적 번호(FE-xx)를 주지 않으며 판정(1·3절)의 근거로 쓰지 않는다. 위 2절의 32건 가운데 이 범주에 드는 것은 없다 (FE-24 는 경로 입력 검증, FE-27 은 개발 서버 허용 호스트라 해당하지 않는다).

| 범주 | frontend 에서 보이는 사실 | 근거 |
|---|---|---|
| 인증 없음 | 프론트는 어떤 요청에도 인증 헤더·자격 증명을 붙이지 않는다 (`Authorization`·`credentials` 0건). 전체 삭제 후 재수집(`resetAndRecollect`), 소스 토글·삭제, 브리핑 설정 저장을 확인 창 하나만 거쳐 부른다 | `src/lib/api.ts:246`, `:367`, `:397`, `:597`, `src/components/ResetConfirmDialog.tsx:29-42` |
| SSRF | 사용자가 입력한 URL·호스트를 backend 로 보내 backend 가 그 주소로 요청한다: 웹훅 테스트, URL 점검, Notion·SMTP 연결 테스트 | `src/lib/api.ts:218` (`testWebhook`), `:406` (`inspectUrl`), `:536` (`testNotionConnection`), `:553` (`testEmailConnection`) |
| 비밀값 평문 저장 | 쓰이지 않는 `WebhookSettingsModal` 이 웹훅 URL 을 localStorage `agentlens_webhook_url` 에 평문으로 쓴다 (렌더되지 않아 지금은 실행되지 않는다. 컴포넌트 삭제는 FE-08) | `src/components/WebhookSettingsModal.tsx:30`, `:40` |
| 설정 조회로 비밀값 노출 | 브리핑 설정 대화상자가 `GET /api/briefing/settings` 로 받은 Slack·Discord 웹훅 URL 을 가리지 않은 채 입력란에 채운다 (Notion 키는 backend 가 앞뒤 4자만 돌려준다) | `src/lib/api.ts:573`, `src/components/BriefingSettingsModal.tsx:164-166` |
| 설정 재적용 누락 | 저장 뒤 화면에는 새 값이 보이지만 backend `settings.reload()` 가 Notion·SMTP 값을 다시 읽지 않아 재시작 전까지 옛 값으로 발송한다 (backend 원인) | `src/lib/api.ts:597`, `src/components/BriefingSettingsModal.tsx:209-217`, `:253` |

## 6. 잘된 점 (유지할 것)

- `useCollector` 의 모듈 외부 저장소 + `useSyncExternalStore` 와 요청 번호(`statusSeq`·`appliedStatusSeq`·`progressEndSeq`)로 오래된 응답을 버리는 구조 (`src/hooks/useCollector.ts:51-66`, `:104-119`).
- `useNewsFeed` 의 '같은 키 다시 읽기 실패는 목록 유지 + 신호, 키가 바뀐 요청 실패는 ErrorState' 구분 (`src/hooks/useNewsFeed.ts:21-34`, `:116-130`).
- 오버레이 스택(`src/lib/overlay-stack.ts`)으로 Escape 가 맨 위 레이어만 닫고, 단축키가 오버레이 위에서 막힌다 (`page.tsx:153` `blockSingleKeys`).
- 챗 SSE 의 끝 버퍼·멀티바이트 처리 (`ChatWorkspace.tsx:339-355`), 테마 첫 그림 스크립트의 저장값 검증 (`layout.tsx:23`, `lib/theme-store.ts:69-78`).
- 제품 코드에 `any`·`dangerouslySetInnerHTML`(테마 스크립트 제외)·`rehype-raw` 가 없다. 마크다운은 `react-markdown` 기본 URL 변환을 쓴다.

---

## 7. 이전 릴리스 리뷰 Nit 확인 결과

| Nit | 지금 상태 | 지적 |
|---|---|---|
| 북마크 저장값이 배열이 아니면 렌더 오류 (`useBookmarks.ts`) | 남아 있다. `{"a":1}` 로 `bookmarkedItems.map is not a function` 재현 | FE-17 |
| 초기화 확인 창이 실제 미실행에도 성공처럼 닫힘 (`useCollector.ts`·`ResetConfirmDialog.tsx`) | 남아 있다. `useCollector.ts:230`, `:235` 의 조용한 `return` 을 확인 창이 성공으로 처리 (`ResetConfirmDialog.tsx:33-37`). 지금 UI 로는 닿기 어렵다 | FE-20 |
| `NEXT_PUBLIC_APP_VERSION` 이 `env.ts` 에 없음 | 남아 있다. `env.ts` 자체가 import 되지 않는다 | FE-21 |

## 8. 옛 `docs/known-issues.md` frontend·UI·접근성 행 대응표

옛 문서는 곧 지워지므로 frontend 가 원인이거나 frontend 에서 고칠 수 있는 행을 모두 이 보고서의 지적으로 옮겼다.

| 옛 행 (절) | 지금 코드 확인 | 이 보고서 |
|---|---|---|
| 챗 한 턴을 서버와 프론트가 둘 다 저장 (데이터·동작 오류) | 프론트는 한 턴에 2번 POST (실행 확인) | FE-02, 5절 |
| 모델을 바꾼 직후 보내면 이전 티어로 요청 (의심) | 의심이 아니라 사실 (실행 확인) | FE-01 |
| 스트림이 `done` 없이 끊겨도 완료로 표시 | 사실 (실행 확인) | FE-03, 5절 |
| 스트림 중 Anthropic 실패 시 부분 답 뒤 대체 답 (Ask AI) | 원인은 backend | FE-23, 5절 |
| 검색어 한 글자마다 다시 부르고 페이지를 1로 돌리지 않음 | 사실 (실행 확인) | FE-09 |
| GitHub 저장소 id 경로 (의심) | 계약 문서 CT-001 에서 404 실행 확인 | 5절 |
| 화면 문구와 실제 동작이 다름: Ask AI "Gemini", 딥 리서치 "LLM 평가", 3줄 요약, 챗 Notion 동기화 | 모두 남아 있다 | FE-23, FE-25, FE-22 |
| RSS 채널 링크 3000 포트 | backend | 5절 |
| 계약 7행 (오류 형식, MSW 전용 경로·단계, sources 순서, zod 필드, 오류 코드, `model_tier` 500, 런타임 zod 미적용) | 계약 문서 CT-002~CT-026 | FE-19, FE-31 |
| UI·접근성: 브리핑 분야 이름·이모지 | backend | 5절 |
| UI·접근성: 챗 진행 단계 라벨 이모지 | backend | 5절 |
| 테스트·운영: `ChatModelSelector` 변형·`ChatHeaderProps` 잔존, `ContractAndMsw.test.ts:1017` | 남아 있다 (`ChatModelSelector.tsx:13-14`, `:93`, `types/chat.ts:942-944`) | FE-08, FE-29 |
| 테스트·운영: `NEXT_PUBLIC_API_URL` 을 Docker 빌드에서 넘기지 않음 (의심) | 빌드 산출물로 확인하지 못함 | FE-21, 5절 |
| 쓰이지 않는 코드 (프론트 목록 전체) | 모두 남아 있다 | FE-08 |

`docs/ui-system-designer/01_COMPONENT_SPEC.md` 10절과의 대응: 1·7 → FE-07, 2·8 → FE-21, 3 → FE-12, 4 → FE-13, 5 → FE-21, 6·12·13 → FE-08, 9 → FE-26, 10·14 → FE-25·FE-22, 11 → FE-06, 15 (ScrollRow 시간 상수)·16 (클립보드 대체 경로) → 지적하지 않음 (측정 근거 없는 상수와 폐기 예정 API 사용은 문서에 기록돼 있고 동작 결함은 확인하지 못했다. 16은 FE-27 에서 함께 언급).

---

## 9. 재리뷰 결과 (2026-11-09, 작업 트리)

범위: 머리말의 '재리뷰 대상' 9개 파일. 방법은 세 가지다: diff 를 읽고, `make check` 를 돌리고, 1차 감사 재현 테스트(scratchpad, 제품 코드 밖)를 그대로 다시 돌렸다. 고친 뒤 버전과 1차 감사 때 버전(`git show HEAD:…ChatWorkspace.tsx` 사본)을 같은 조건에서 비교한 재현도 더했다. 작업 트리를 바꾸는 git 명령(stash·checkout·reset)은 쓰지 않았고, `make check` 전후 `git status --porcelain` 은 같았다.

### 9.1 필수 5건 확인

| 지적 | 결과 | 고친 내용 (path:line) | 근거 |
|---|---|---|---|
| FE-01 모델 변경 후 이전 티어로 요청 | **해결** | `ChatWorkspace.tsx:461` 의존성 배열에 `selectedTier` 추가 | 1차 재현 테스트: Haiku 선택 뒤 전송 → 본문 `model_tier = haiku`, `model = claude-haiku-5-5` (1차는 `sonnet`). 새 테스트 `ChatStreamTurn.test.tsx:65-84`. eslint `exhaustive-deps` 경고가 사라졌다 (41 → 40) |
| FE-02 갱신 함수 안 저장, 턴당 2회 저장 | **해결** | `ChatWorkspace.tsx:292-319`: 보조 메시지를 지역 변수 `assistantFinal` 로 누적(`updateAssistant`, `:302-307`)하고, 저장(`saveTurn`, `:309-319`)은 갱신 함수 밖에서 완료(`:445`)·중단(`:449`) 때 한 번만 부른다 | 1차 재현 테스트: 턴당 POST 가 StrictMode 없이 **1번**(1차 2번), StrictMode 안에서 **1번**(1차 4번). 새 테스트 `ChatStreamTurn.test.tsx:86-124` 는 횟수와 저장된 메시지 내용·상태를 단언한다 |
| FE-03 `done` 없는 스트림을 완료로 표시 | **해결** | `ChatWorkspace.tsx:366`, `:420` (`receivedDone`), `:441-443` (`done` 이 없으면 `TRUNCATED_STREAM_MESSAGE` 로 오류 처리) | 1차 재현 테스트의 '완료로 보인다' 단언이 이제 실패한다 (화면에 `응답이 중간에 끊겼습니다. 다시 시도해 주세요.`). 새 테스트 `ChatStreamTurn.test.tsx:126-147`: 오류 문구, `답변 다시 시도` 버튼, 내보내기 툴바 없음, 저장된 보조 메시지에 `completed` 없음 |
| FE-09 검색 글자마다 요청, 페이지 미초기화 | **해결** | `useNewsFeed.ts:9` (`SEARCH_DEBOUNCE_MS = 300`, 측정값 아님), `:18-56` (입력값 `search` 와 요청값 `appliedSearch` 분리, `commitSearch` 가 `appliedSearch`·`page=1` 을 같은 렌더에서 바꿈), `:64` (`listKey` 에 `appliedSearch`), `:184-188` (Enter 때 기다리던 검색어를 먼저 반영) | 1차 재현 테스트: 3페이지에서 `m`·`mc`·`mcp` 입력 → 요청이 `?search=mcp&…&page=1` **1번**(1차는 page=3 으로 3번). 새 테스트 `FeedSearch.test.tsx:64-98` (입력 멈춘 뒤 1번, Enter 면 기다리지 않고 1번) |
| FE-22 Notion 동기화 가짜 성공 | **해결** | `ExportToolbar.tsx`: 버튼·`handleSyncNotion`·`messageId`·`onNotionSuccess` prop 제거, 머리 주석에 이유 기록. `ChatMessageItem.tsx` 의 `messageId` 전달 제거 | `ExportToolbar.test.tsx` 가 툴바 버튼을 `['마크다운 복사', '.md 다운로드']` 로 정확히 단언하고 `Notion 연동` 글자가 없음을 본다. `tsc --noEmit` 오류 0 (남은 사용처 없음) |

### 9.2 기존 테스트 기대를 바꾼 3곳: 정당한 변경인가

| 파일 | 바뀐 것 | 판단 | 이유 |
|---|---|---|---|
| `src/tests/chat/ChatMessageItem.test.tsx:128-129` | `Notion 동기화` 버튼이 있다 → 없다 | **정당** | FE-22 기능 제거에 따른 기대 변경이다. 나머지 두 버튼 단언은 그대로다. 테스트 이름 `renders ExportToolbar with 4-step report actions…`(`:123`)는 이제 버튼 2개라 이름만 낡았다 (권장, 동작 영향 없음) |
| `src/tests/chat/ExportToolbar.test.tsx` | 'Notion 버튼 있음' 단언과 `handles Notion sync and triggers callback` 테스트 삭제, 스트리밍 중 비활성 단언에서 Notion 버튼 제거 | **정당, 오히려 강해짐** | 지운 테스트는 가짜 동작(300ms 뒤 성공)을 보증하던 것이다. 대신 툴바 안 버튼 목록 전체를 정확히 비교하고 `Notion 연동` 글자가 없음을 단언한다 |
| `src/tests/chat/ChatWorkspace.test.tsx:418-470` (끝 버퍼 플러시 테스트) | 마지막 블록이 `\n\n` 없는 `token` → `\n\n` 없는 `done`. 멀티바이트 분할을 마지막 블록에서 그 앞 `token` 블록(`완` 3바이트 중간)으로 옮김. 툴바 존재·끊김 문구 없음 단언 추가 | **정당, 약해지지 않음** | FE-03 뒤에는 `done` 이 없는 스트림이 오류가 되므로 원래 입력으로는 성공 경로를 볼 수 없다. 이 테스트가 보려는 두 가지는 그대로 남는다: ① `\n\n` 없이 끝난 마지막 블록을 `done=true` 에서 처리한다 (이제 그 블록이 `done` 이라 처리되지 않으면 툴바가 없고 끊김 문구가 보여 테스트가 실패한다. 단언이 더 엄격해졌다), ② 멀티바이트 문자가 청크 경계에서 갈려도 복원한다. 1차 버전도 분할된 문자가 다음 청크에서 완성돼 끝의 `decoder.decode()` 가 내보낼 바이트는 없었으므로, '스트림 끝에 미완성 바이트가 남는 경우' 는 전에도 지금도 다루지 않는다 |

새 테스트 2개 파일(6개)은 접근 이름 기준 RTL 쿼리와 MSW `server.use` 를 쓰고, 단언이 1차 재현과 같은 관찰값(요청 본문, POST 횟수·내용, 화면 문구, 요청 쿼리)을 본다. 테스트를 약하게 만든 흔적은 없다. FE-28 은 FE-01·02·03·09 부분이 해결됐다.

### 9.3 새로 찾은 문제 (모두 권장)

### FE-33 [권장] 끊긴 스트림의 부분 답이 화면과 저장에서 모두 사라진다
- **재리뷰 2차**: **해결** (화면). 저장하지 않는 것은 의도된 설계로 남았다. 9.7.1절.
- **위치**: `src/components/chat/ChatWorkspace.tsx:441-443`, `:450-454` (오류 분기는 저장하지 않음), `src/components/chat/ChatMessageItem.tsx:261-280` (`isError` 면 본문 대신 오류 문구만 그림)
- **근거 (실행 확인)**: `token` 하나 뒤 `done` 없이 닫힌 스트림에서 화면에 `잘린 답` 이 보이지 않았다 (1차 재현 테스트의 `findByText('잘린 답')` 실패). 1차 감사 때는 잘린 답이 완료처럼 보였다. 이제 상태는 맞지만 받은 글자를 버리고, 오류 턴은 `saveTurn` 을 부르지 않아 새로고침하면 질문도 남지 않는다. 스트림 중 `error` 이벤트도 같은 경로라 이 동작은 그 전부터 있었다.
- **개선 제안 (Diff)**:
```diff
 // src/components/chat/ChatMessageItem.tsx
-          {isError ? (
-            <div className="space-y-3 py-1">…오류 문구·다시 시도…</div>
-          ) : (
-            <div className={cn('markdown-content …')}>…</div>
-          )}
+          {message.content ? (
+            <div className={cn('markdown-content …')}>…</div>
+          ) : null}
+          {isError ? <div className="space-y-3 py-1">…오류 문구·다시 시도…</div> : null}
```

### FE-34 [권장] 사용자가 중단한 뒤 스트림이 정상 종료되면 '끊김' 오류로 바뀐다
- **재리뷰 2차**: **해결**. 9.7.1절.
- **위치**: `src/components/chat/ChatWorkspace.tsx:441-443` (`receivedDone` 만 보고 `controller.signal.aborted` 를 보지 않음), `:133-145` (`handleStopGenerating`)
- **근거 (실행 확인, 모의 조건)**: `답변 생성 중단` 을 누른 뒤 응답 본문이 오류 대신 정상 종료(`close`)되도록 만든 스트림에서 비교했다. 1차 버전은 상태가 `aborted` 로 남고 부분 답이 보였으며 저장 1번(`["completed","aborted"]`)이었다. 고친 버전은 `응답이 중간에 끊겼습니다…` 오류로 바뀌고 부분 답이 사라졌으며 저장은 0번이었다. 브라우저에서는 `abort()` 가 본문 읽기를 `AbortError` 로 거부시키므로 이 경로는 드물다. 중단 버튼과 종료가 겹치는 경합에서만 생길 것으로 본다 (브라우저로는 확인하지 못했다). 본문 읽기가 거부되는 일반 중단 경로는 1차와 고친 버전이 같게 동작했다.
- **개선 제안 (Diff)**:
```diff
-        if (!receivedDone) {
+        if (!receivedDone && !controller.signal.aborted) {
           throw new Error(TRUNCATED_STREAM_MESSAGE);
         }
-
-        saveTurn();
+        if (controller.signal.aborted) updateAssistant({ status: 'aborted' });
+        saveTurn();
```

### FE-35 [권장] 검색어 대기 중(300ms 안)에 바꾼 페이지가 1로 되돌아가고, 필터를 바꾸면 두 번 요청한다
- **위치**: `src/hooks/useNewsFeed.ts:29-36` (`commitSearch` 가 항상 `setPage(1)`), `:38-50`
- **근거 (코드로 확인)**: 입력 뒤 300ms 안에 페이지 버튼을 누르면, 그 페이지로 요청한 뒤 타이머가 `page=1` 로 되돌려 한 번 더 요청한다. 카테고리·소스·Must-Read 를 바꿔도 이전 검색어로 한 번, 타이머가 끝난 뒤 새 검색어로 한 번 요청한다. 결과는 마지막 상태와 맞으므로 기능 결함은 아니고, 보이는 페이지가 사용자가 고른 것과 달라질 수 있다.
- **개선 제안 (Diff)**:
```diff
 // 페이지·필터 변경 때 기다리던 검색어를 먼저 반영해 한 번만 요청한다
-  const setPage = …
+  const flushPendingSearch = () => { if (pendingSearch.current !== null) commitSearch(pendingSearch.current); };
+  const setPageAndFlush = (p: number) => { flushPendingSearch(); setPage(p); };
```

### 9.4 그대로 남은 관련 권장 지적
- **FE-04** (재시도 history 중복): 남아 있다. 1차 재현 테스트가 같은 결과를 냈다 (`history = [{"role":"user","content":"재시도 질문"}]`, `question = 재시도 질문`). 저장 목록은 고쳐졌지만 history 는 아직 콜백이 잡은 `messages` 로 만든다 (`ChatWorkspace.tsx:325-332`). 저장 목록은 갱신 함수의 `prev` 로 만들어(`:294-297`) 실패 쌍이 빠진다.
- **FE-17·FE-18** (localStorage 값 검증): 남아 있다. 재현 테스트가 같은 오류(`bookmarkedItems.map is not a function`, `sessions.map is not a function`)를 냈다.
- `ChatWorkspace.tsx:294-297` 의 갱신 함수는 바깥 변수 `earlierMessages` 에 `prev` 를 기록한다. 갱신 함수 안의 대입이지만 같은 입력에 같은 값을 쓰고 서버 호출·저장소 쓰기는 없어, StrictMode 이중 실행에도 결과가 같다 (StrictMode 재현에서 POST 1번). 문제로 보지 않는다.

### 9.5 문서 동기화 (코드 밖, 오케스트레이터에게 넘김)
FE-22 로 챗 `Notion 동기화` 버튼이 없어졌다. 다음 산출물에 이 버튼이 아직 적혀 있어 각 담당 서브에이전트가 고쳐야 한다 (`grep -rln "Notion 동기화" docs`): `docs/ui-system-designer/01_COMPONENT_SPEC.md`, `docs/spec-writer/fsd/02_AI_CHAT_SPECIFICATION.md`, `docs/spec-writer/fsd/07_UI_COMMON_SPECIFICATION.md`, `docs/spec-writer/01_PRD.md`, `docs/spec-writer/03_POLICIES_AND_EDGES.md`, `docs/frontend-tdd-engineer/01_TDD_CYCLE_LOG.md` (테스트 수 649 → 654, 파일 52 → 54 도 바뀜), `docs/qa-engineer/02_QA_TEST_REPORT.md`, `docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md`. 검색 디바운스(300ms)와 끊긴 스트림 오류 문구도 UI 공통·챗 FSD 에 반영할 동작 변경이다.

### 9.6 `make check` (재리뷰, 2026-11-09, 직접 실행)

종료 코드 **0**:

```
cd backend && ../.venv/bin/pytest -v tests/
============================= 235 passed in 13.31s =============================
cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit
$ vitest run
 Test Files  54 passed (54)
      Tests  654 passed (654)
$ eslint
✖ 40 problems (0 errors, 40 warnings)
EXIT=0
```

- frontend: 1차 52개 파일 649개 → 54개 파일 654개. 늘어난 테스트 5개 = 새 테스트 6개 (`ChatStreamTurn` 4, `FeedSearch` 2) − 지운 Notion 테스트 1개.
- backend 테스트 수(217 → 235)는 이번 frontend 수정과 상관없는 backend 작업 트리 변경 때문이다. 이 보고서 범위 밖이다.
- `tsc --noEmit`: 출력 0줄 (오류 0).
- eslint 경고 40개: 제품 코드 2개 (`useChatSessions.ts:14`·`:16` 미사용 import, FE-32), MSW 24개, 테스트 14개. 1차 감사의 `ChatWorkspace.tsx:508` `exhaustive-deps` 경고는 FE-01 수정으로 사라졌고, 새 파일에서 생긴 경고는 없다.
- vitest stderr 의 Vite `configLoader` 경고와 jsdom `Not implemented: navigation to another Document` 는 1차 때와 같다 (실패 아님).

### 9.7 재리뷰 2차 (2026-11-09, 작업 트리)

범위: FE-33, FE-34, BUG-02R 수정. 이번에 바뀐 파일은 `src/components/chat/ChatWorkspace.tsx`, `src/components/chat/ChatMessageItem.tsx`, `src/types/chat.ts`, `src/mocks/handlers/chat.ts`, `src/tests/chat/ChatStreamTurn.test.tsx`(새 파일, 테스트 4개 추가), `src/tests/chat/ContractAndMsw.test.ts`(+137줄, 삭제 0줄)다. 변경 요약은 오케스트레이터가 준 `code-changes-v041.md` 와 diff 를 대조했다. backend 변경(BUG-02~08)은 `docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md` 범위라 여기서 판정하지 않았다. 다만 `make check` 에는 함께 들어간다. 작업 트리를 바꾸는 git 명령은 쓰지 않았고, `make check` 전후 `git status --porcelain` 은 같았다.

#### 9.7.1 건별 확인

| 지적 | 결과 | 고친 내용 (path:line) | 근거 |
|---|---|---|---|
| FE-33 끊긴 스트림의 부분 답이 사라짐 | **해결** (화면) | `ChatMessageItem.tsx:261` (`!isError \|\| hasContent` 면 본문을 그린다, `hasContent` 는 `:168`), `:276` (모델 배지·내보내기 툴바는 오류가 아닐 때만), `:298-318` (오류 문구·`답변 다시 시도` 를 본문 **아래**에 그린다) | 1차 재현 테스트(`done` 없이 `token` 하나)에서 이제 `잘린 답` 이 보이고 `답변 다시 시도` 버튼이 1개다 (재리뷰 1차에서는 본문이 안 보여 이 단언이 실패했다). 새 테스트 `ChatStreamTurn.test.tsx:207-222`: 부분 답이 오류 문구보다 DOM 앞, 다시 시도 버튼 있음, 툴바 없음, 저장 POST 0번. 저장하지 않는 것은 변경 요약에 '오류·끊김은 저장 안 함' 으로 적힌 의도된 설계이고 backend(BUG-08: 스트림 오류 시 저장 안 함)와도 같다 |
| FE-34 중단 뒤 정상 종료가 끊김 오류로 바뀜 | **해결** | `ChatWorkspace.tsx:444-452` (`stoppedByUser = controller.signal.aborted`. 중단이면 끊김 오류를 던지지 않고 `aborted` 로 바꾼 뒤 `saveTurn()`) | 재리뷰 1차 비교 재현(`stop2`, 중단 뒤 본문 `close`)에서 1차 감사 버전과 고친 버전이 같아졌다: 둘 다 저장 1번, 상태 `["completed","aborted"]`, 부분 답 보임, 오류 문구 없음 (재리뷰 1차에서는 고친 버전이 저장 0번에 끊김 오류였다). 새 테스트 `ChatStreamTurn.test.tsx:224-267` 은 신호를 무시하는 `fetch` 대역으로 같은 경로를 재현해 상태 `aborted` 와 저장 1번을 단언한다 |
| BUG-02R 스트림 요청에 클라이언트 메시지 id | **해결** (frontend 몫) | `ChatWorkspace.tsx:350-353` (요청 본문에 `user_message_id: userMsgId`, `assistant_message_id: assistantMsgId`), `:264-265` (호출마다 새 id: `msg-user-`·`msg-asst-` + 36진 최대 7자 = 최대 16자, 접두가 달라 두 id 는 늘 다르다), `:309-317` (`saveTurn` 이 같은 메시지 객체 = 같은 id 를 저장). zod `types/chat.ts:383-417` (`CHAT_MESSAGE_ID_MAX_LENGTH = 36`, `ChatClientMessageIdSchema`, 두 필드 `.nullable().optional()`, 서로 다름 `.refine`). MSW `handlers/chat.ts:300-318` (400 `ERR_INVALID_PAYLOAD`), `:603-665` (그 id 로 저장, 이미 있는 id 는 건너뜀) | 계약 8.1절의 frontend 항목(요청 본문 두 필드, 같은 id 로 `saveTurn`, 재시도마다 새 id)과 일치한다. 새 테스트 `ChatStreamTurn.test.tsx:151-175` (두 id 가 1~36자이고 서로 다르며 세션 POST 의 메시지 id 와 같음), `:177-205` (재시도의 두 id 가 첫 요청과 다르고, 저장은 재시도 쌍 하나만). 계약 테스트 6개(`ContractAndMsw.test.ts` describe `Chat Stream Client Message Ids Contract (BUG-02R)`)가 zod 수용·거부와 MSW 저장·중복 건너뜀·400 을 본다 |

#### 9.7.2 테스트 변경 판단

| 변경 | 판단 | 이유 |
|---|---|---|
| `ChatStreamTurn.test.tsx` 에 테스트 4개 추가 (BUG-02R 2개 `:151-205`, FE-33 `:207-222`, FE-34 `:224-267`) | **적절** | 각 테스트가 고친 결함의 관찰값을 직접 단언한다: 요청 본문의 id, 세션 POST 의 id·횟수·상태, 화면에서 부분 답과 오류 문구의 순서, 툴바 유무. FE-34 테스트만 MSW 대신 `vi.spyOn(globalThis, 'fetch')` 를 쓰는데, 중단 신호를 무시하고 정상 종료하는 응답은 MSW 로 만들기 어려워서다 (재리뷰 1차 재현에서도 MSW 만으로는 중단이 본문 읽기를 거부시키지 않아 같은 경로를 따로 만들어야 했다). `finally` 에서 `mockRestore` 한다 |
| `findByText(x)` → `waitFor(() => expect(getByText(x)).toBeInTheDocument())` 7곳 (`:99`, `:123`, `:135`, `:164`, `:192`, `:195`, `:249`) | **약해지지 않음** | Testing Library 의 `findBy*` 는 `waitFor` + `getBy*` 를 합친 것이라 기다림·시간 제한(기본 1000ms)·실패 조건이 같다. 바뀐 것은 반환값을 쓰지 않는다는 점뿐이고, 7곳 모두 반환값을 쓰지 않았다. 단언을 지우거나 조건을 넓힌 곳은 없다. `:214` 의 `findByText` 는 반환값(오류 요소)을 DOM 순서 비교에 쓰므로 그대로 두었다 |
| 재리뷰 1차의 FE-02·FE-03 테스트 | 바뀌지 않음 | 단언(POST 1번, 저장 내용, 끊김 문구·버튼·툴바 없음, `completed` 저장 없음)이 그대로다. FE-02 테스트의 메시지 타입에 `id` 가 더해졌을 뿐이다 |
| `ContractAndMsw.test.ts` | 추가만 | diff 가 +137/−0 이다. 기존 테스트 기대 변경이 없다 |

#### 9.7.3 1차 재현 테스트 다시 실행 (scratchpad, 제품 코드 밖)

| 재현 | 1차 감사 | 재리뷰 1차 | 재리뷰 2차 |
|---|---|---|---|
| 티어 변경 후 요청 (FE-01) | `sonnet` | `haiku` | `haiku`, `claude-haiku-5-5` |
| 턴당 세션 POST (FE-02) | 2 / StrictMode 4 | 1 / 1 | 1 / 1 |
| `done` 없는 스트림 (FE-03·FE-33) | 완료로 보임 | 오류, 부분 답 안 보임 | 오류 + 부분 답 보임, 다시 시도 1개 |
| 중단 뒤 본문 정상 종료 (FE-34) | aborted, 저장 1 | 끊김 오류, 저장 0 | aborted, 저장 1, 부분 답 보임 |
| 3페이지에서 `mcp` 입력 (FE-09) | page=3 요청 3번 | `mcp`·page=1 1번 | 같음 |
| 재시도 history (FE-04) | 실패 질문 중복 | 같음 | **같음 (미해결, 권장)** |
| 북마크·세션 목록 비배열 (FE-17·18) | 렌더 오류 | 같음 | **같음 (미해결, 권장)** |

참고: 중단 신호를 `AbortError` `DOMException` 으로 본문에 흘리는 모의(`stop` 재현)에서는 1차 버전도 고친 버전도 '네트워크 지연…' 오류로 가고 저장하지 않는다. jsdom 의 `DOMException` 이 테스트 환경에서 `instanceof Error` 가 아니어서 생기는 모의 환경의 차이다. 브라우저에서는 `DOMException` 이 `Error` 를 상속하므로 `ChatWorkspace.tsx:456-458` 의 중단 분기로 간다 (브라우저로 실행하지는 않았다). 이번 수정 전후 동작이 같으므로 지적으로 세지 않는다.

#### 9.7.4 관찰 (지적으로 세지 않음)
- `ChatWorkspace.tsx:450-452`: `done` 을 받은 직후 루프가 끝나기 전에 중단을 누르면, 완료된 답이 `aborted` 로 바뀌어 저장된다 (`stoppedByUser` 가 `receivedDone` 보다 앞섬). 마이크로초 단위 경합이라 재현하지 않았다. 고친다면 `if (stoppedByUser && !receivedDone)` 이다.
- MSW 의 메시지 id 검증(`handlers/chat.ts:300-318`)은 zod `ChatStreamRequestSchema` 를 쓰지 않고 같은 규칙을 다시 적었다. 지금은 두 곳이 같지만 한쪽만 바뀌면 어긋난다. `ChatStreamRequestSchema.safeParse(payload)` 로 바꾸면 한 곳이 된다.
- 계약 8.1절이 적은 대로 메시지 id 는 DB 전역 기본 키라, 다른 세션에 같은 클라이언트 id 가 이미 있으면 서버가 건너뛰어 이 세션에 저장되지 않는다. 클라이언트 id 의 무작위 부분은 36진 7자다. 계약이 오류로 다루지 않기로 했으므로 frontend 결함으로 보지 않는다. `crypto.randomUUID()` (36자, 계약 상한 안)를 쓰면 가능성이 더 줄어든다.

#### 9.7.5 남은 지적과 문서 동기화
- 남은 권장 28건 가운데 이번 수정과 맞닿은 것: FE-04(재시도 history 중복, 9.7.3 재현 그대로), FE-17·FE-18(localStorage 비배열), FE-35(디바운스 중 페이지 되돌림).
- 9.5절의 문서 동기화 목록에 더할 것: 끊긴 스트림은 부분 답 아래에 오류·다시 시도를 그린다(FE-33), 중단 뒤 정상 종료도 중단으로 저장한다(FE-34), 스트림 요청 본문에 `user_message_id`·`assistant_message_id` 가 있다(BUG-02R). 챗 FSD(`docs/spec-writer/fsd/02_AI_CHAT_SPECIFICATION.md`), 컴포넌트 명세(`docs/ui-system-designer/01_COMPONENT_SPEC.md`), TDD 기록(`docs/frontend-tdd-engineer/01_TDD_CYCLE_LOG.md`, 테스트 수 664) 담당이 반영한다.

#### 9.7.6 `make check` (재리뷰 2차, 2026-11-09, 직접 실행)

종료 코드 **0**:

```
cd backend && ../.venv/bin/pytest -v tests/
============================= 244 passed in 13.87s =============================
cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit
$ vitest run
 Test Files  54 passed (54)
      Tests  664 passed (664)
$ eslint
✖ 40 problems (0 errors, 40 warnings)
EXIT=0
```

- frontend 664 = 재리뷰 1차 654 + `ChatStreamTurn` 4 + `ContractAndMsw` 6.
- backend 244 는 backend 작업 트리 변경(새 `backend/tests/test_code_review_fixes.py` 포함) 때문이다. 이 보고서 범위 밖이다.
- `tsc --noEmit` 오류 0 (출력 0줄).
- eslint 경고 40개 (오류 0). 파일 구성은 재리뷰 1차와 같다: 제품 코드 2 (`useChatSessions.ts:14`·`:16`), MSW 24, 테스트 14. 이번에 바뀐 파일에서 새로 생긴 경고는 없다.
- vitest stderr 의 Vite `configLoader` 경고와 jsdom `Not implemented: navigation to another Document` 는 이전과 같다 (실패 아님).
