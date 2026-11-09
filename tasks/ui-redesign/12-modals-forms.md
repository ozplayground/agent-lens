# Task 12: 모달 II: 입력 폼·소스

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 12
Status: done
Session: implementer C
Agent: abc3094397c406b58
Updated: 2026-11-06

## 한 일
- `BriefingSettingsModal`: `Dialog size="md" dismissOnScrim={false}`, 제목 `공유 & 알림 설정`(+ 설명 `aria-describedby`), `Tabs` 3개(`Notion 연동`/`이메일 (SMTP)`/`웹훅 (Slack/Discord)`, 탭을 바꾸면 결과 지움), 모든 입력 `TextField`(보이는 라벨·`description`), 비밀값(Notion 토큰·SMTP 비밀번호)은 `type="password"` + 보기 토글 `IconButton`(`토큰 보기`/`토큰 숨기기`, `aria-pressed`), 체크박스 → `Switch`, 바닥 고정 `닫기`·`연결 테스트`(현재 탭의 테스트)·`저장`, 결과 `InlineAlert`, 로딩 `Spinner`. 요청·저장 규칙(`***` 처리, 웹훅 분기)과 named export·props 그대로.
- `WebhookSettingsModal`: 렌더되지 않는 파일. 구조·동작·`agentlens_webhook_url` 키 그대로 두고 색·크기만 토큰으로, `role="dialog"`·`aria-modal`·제목 연결, 닫기 버튼 이름 `닫기`.
- `SourcesModal`: `Dialog size="xl" dismissOnScrim={false}` 제목 `소스 & 리서처`, `Tabs`(`AI 딥 리서처`(+채택 수 배지, 기본 선택)/`등록된 수집원`(+활성 RSS 수 배지)), 머리 안내·탭은 본문 위 sticky, 결과 안내는 대화상자 안 `aria-live="polite"` 영역, 삭제는 `window.confirm` 대신 `ConfirmDialog`(제목 `이 소스를 목록에서 삭제하시겠습니까?`, `tone="danger"`, 진행 중 `busy`, 실패는 창 안 오류), 바닥 `닫기`. props 그대로.
- `sources/SourcesListTab`: 지표 2열/md 4열 카드, RSS 목록은 md 이상 표(이름·URL·카테고리·상태·작업), 모바일은 같은 `<table>` 을 CSS(`max-md:`)로 세로 카드(요소 한 벌), `Switch aria-label="{이름} 수집 켜기"`, `IconButton label="{이름} 삭제"`, GitHub 저장소도 `Switch`, 등록 폼 `TextField`·`Select`·`Button`, 카테고리 표시는 `lib/labels`.
- `sources/DeepResearcherTab`: 지표 2열/md 4열, 판정 `Badge`, 실행·새로고침·검증 `Button`, URL 검증은 `form` + `TextField`, 결과 `InlineAlert`. 동작 그대로.
- 테스트 2개 파일.

## 바꾼 파일
- frontend/src/components/BriefingSettingsModal.tsx
- frontend/src/components/WebhookSettingsModal.tsx
- frontend/src/components/SourcesModal.tsx
- frontend/src/components/sources/DeepResearcherTab.tsx
- frontend/src/components/sources/SourcesListTab.tsx
- frontend/src/tests/modals/SourcesModal.test.tsx (새)
- frontend/src/tests/modals/BriefingSettingsModal.test.tsx (새)

## 검사 결과
- `cd frontend && pnpm exec vitest run src/tests/modals/SourcesModal.test.tsx src/tests/modals/BriefingSettingsModal.test.tsx`
  `Test Files  2 passed (2)` / `Tests  13 passed (13)`
- `pnpm exec eslint <위 7개 파일>`: 출력 없음, `eslint=0`
- `pnpm exec tsc --noEmit`: 출력 없음, `tsc=0`
- 참고 `pnpm test` 전체 (다른 implementer 진행 중 트리): `Test Files  35 passed (35)` / `Tests  354 passed (354)`

## 결정
- MSW 에 없는 엔드포인트(`/api/briefing/settings`, `/api/research/status`, `/api/research/audit-logs`, `DELETE /api/sources/:type/:id`)는 테스트 파일 안 `server.use` 로만 더했다 (`mocks/**` 는 이 단계 범위 밖).
- 바닥 `연결 테스트` 하나가 현재 탭의 테스트(Notion/메일/웹훅)를 부른다. 탭마다 있던 `테스트 메일 발송`·`웹훅 테스트 전송`·`설정 저장` 버튼은 바닥 `연결 테스트`·`저장` 으로 합쳤다 (spec 5).
- 삭제 확인 창은 `SourcesModal` 대화상자 밖 형제로 그리고 사용자 동작으로 열리므로 스택 위에 쌓인다. Escape 는 확인 창만 닫는다 (테스트로 확인).
- `SourcesListTab.onDelete` 는 확인 창을 여는 것으로 바로 끝난다 (props 형태 `Promise<void>` 유지).

## 막힌 점
- 없음. 공통 부품(`components/ui/**`)은 고치지 않았다.

## 다음
- 관문 G2 (메인 세션).
