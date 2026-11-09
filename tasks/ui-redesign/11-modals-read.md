# Task 11: 모달 I: 읽기 위주

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 11
Status: done
Session: implementer B
Agent: a7d62a4c682b3b182
Updated: 2026-11-06

## 한 일
- `NewsDetailModal`: `Dialog size="xl"` + 직접 만든 머리줄(`header`·`labelledBy`): `lib/labels` 카테고리 `Badge`, Must-Read `Badge tone="warning"`, 기사 제목 `h2` 2줄(`line-clamp-2`, `break-keep`), 보관 `IconButton`(`보관하기`/`보관됨`), `닫기` `IconButton`, 아래에 `Tabs`(`AI 요약 & 시사점` / `Ask AI 질의응답` + 대화 수 배지, idPrefix `news-detail`). 요약 탭 절 제목 `개발자 시사점`·`핵심 요약 3줄`·`기술 스택`(Badge 목록)·`상세 본문 요약`, 핸드오버 배너 하나(`modal-banner`). 바닥: `출처: {sourceLabel}`, 작성자(md 이상), `원문 링크 방문`(`buttonClasses('primary')` 링크). 자체 window Escape 리스너 제거(스택이 처리). `대화 초기화` → `ConfirmDialog`(제목 `대화 초기화`, 문구 `AI 대화 내역을 모두 초기화하시겠습니까?`, `초기화`, danger), `window.confirm` 제거. 닫을 때 스트림 중단·상태 초기화(확인 창 상태 포함) 유지. 답변 복사는 `copyText`(clipboard → execCommand 대체).
- `news-detail/AskAiPanel`: 토큰으로 다시 그림. `QUICK_PROMPTS` 내보내기·문구 그대로. 빠른 질문은 `ChipGroup label="빠른 질문" scrollable` 한 줄 가로 스크롤(빈 상태의 중복 목록은 지움), `대화 초기화` `Button ghost sm`, 입력은 `TextField label="질문 입력" hideLabel`(`text-base md:text-sm`) + `Button primary` `전송`(`loading`), 바닥 고정. 사용자 말풍선 `bg-accent-soft text-fg`. 자동 스크롤은 `prefers-reduced-motion` 이면 `auto`(`useMediaQuery`). props 그대로.
- `DailyBriefingModal`: `Dialog size="xl"`, 제목 `오늘의 AI 브리핑` + 날짜, `description` = 헤드라인. 도구줄: 주 버튼 `Notion 내보내기`(완료 후 `Notion에서 열기` 링크), `이메일 발송`(`aria-expanded`, 누르면 `수신자 이메일` `TextField` 폼 펼침), `IconButton` `마크다운 복사`(`useCopyToClipboard`, `복사됨`/`복사 실패`)·`.md 다운로드`·`연동 설정`. 768 미만에서는 이들을 CSS 로 숨기고 `MenuButton label="브리핑 작업"`(이메일 발송·복사·다운로드·연동 설정). 결과는 `InlineAlert`(실패 시 `Notion 설정 열기`/`이메일 설정 열기` 동작). `Tabs` `카테고리별 요약`/`마크다운 전문`. 바닥 `연동 설정 관리`·`닫기`. 연동 설정은 page.tsx 가 그리는 `BriefingSettingsModal` 이 나중에 열리므로 위에 쌓인다.
- `McpModal`: `Dialog size="lg"`, 도구 4개 `dl`, 설정 예시 `CodeBlock language="json"`(복사 버튼), 바닥 `닫기`. 고정 문자열 그대로.
- `tests/modals/NewsDetailModal.test.tsx` 추가 (7개): dialog·`aria-modal`·제목 h2 연결, 요약 탭 절 제목 4개·핸드오버 버튼 하나, 탭 클릭·← 키 전환, 빠른 질문 → `대화 초기화` → `alertdialog`(처음 포커스 `취소`, Escape 는 확인 창만 닫음, `초기화` 로 비움, `window.confirm` 미호출), Escape 로 닫히고 다시 열면 요약 탭, `닫기`·배경막으로 닫힘, 원문 링크.
- page.tsx 가 넘기는 props 이름·형태는 바꾸지 않았다.

## 바꾼 파일
- frontend/src/components/NewsDetailModal.tsx
- frontend/src/components/news-detail/AskAiPanel.tsx
- frontend/src/components/DailyBriefingModal.tsx
- frontend/src/components/McpModal.tsx
- frontend/src/tests/modals/NewsDetailModal.test.tsx (새)

## 검사 결과
- `cd frontend && pnpm exec vitest run src/tests/modals/NewsDetailModal.test.tsx src/tests/AskAiPanel.test.tsx src/tests/chat/HandoverIntegration.test.tsx` → `Test Files 3 passed (3)`, `Tests 15 passed (15)`
- `pnpm exec eslint <위 5개 파일>` → 출력 없음, 종료 0
- `pnpm exec tsc --noEmit` → 출력 없음, 종료 0 (전체 트리)
- 참고: 같은 시점 전체 `pnpm exec vitest run` → `Test Files 35 passed (35)`, `Tests 354 passed (354)`
- DailyBriefingModal·McpModal 은 임시 스모크 테스트(대화상자 이름·설명, 탭, `브리핑 작업` 메뉴 4항목, 이메일 폼, `연동 설정 관리`, MCP `dt` 4개·`복사` 버튼·Escape 닫힘)로 확인한 뒤 파일을 지웠다 (plan 에 없는 테스트 파일이라 남기지 않음).
- 바꾼 파일에 팔레트 색·임의 글자 크기·`uppercase`·`tracking-`·`animate-in` 류·`window.confirm` 없음 (grep 확인).

## 결정
- `Dialog` 기본 머리줄 제목은 `truncate`(1줄)라 spec 의 "제목 2줄"을 맞추려고 뉴스 상세는 `header` + `labelledBy` 로 직접 머리줄을 그렸다 (공통 부품은 고치지 않음). 닫기 버튼 이름은 `닫기` 하나.
- 탭 목록을 머리줄(고정 영역)에 두어 본문이 스크롤돼도 탭이 보이게 했다. 본문은 `bodyClassName="flex flex-col p-0"`, Ask AI 패널은 `min-h-0 flex-1` + md 이상 `min-h-[28rem]` 로 입력창을 바닥에 둔다.
- 빠른 질문 칩은 동작 버튼이라 `Chip`(`aria-pressed`) 대신 칩 모양 `<button>` 을 `ChipGroup` 안에 두었다.
- AskAiPanel 빈 상태의 빠른 질문 중복 목록을 지웠다 (같은 이름의 버튼 두 벌 방지, `AskAiPanel.test.tsx` 는 `getAllByText ≥1` 이라 그대로 통과).
- 브리핑 모달은 `Notion 발행` → `Notion 내보내기`, `이메일 전송` → `이메일 발송` 으로 spec 문구에 맞췄다 (이 문구를 찾는 테스트 없음).
- 브리핑 모달의 결과·도구줄은 본문 안(스크롤)에 두고, 머리줄은 Dialog 기본(제목 + `닫기`)을 썼다.

## 막힌 점
- 없음. 공통 부품 변경 필요 없음.
- 중간 상태 메모: `BriefingSettingsModal`(12, C)이 아직 `Dialog` 로 바뀌기 전이면, 브리핑 모달 위에서 `연동 설정` 을 열 때 옛 모달은 `#app-shell` 안에 그려져 `inert` 가 걸린다 (누를 수 없음). 12 가 `Dialog` 로 바꾸면 해소된다 — G2 에서 확인.

## 다음
- 없음. 관문 G2 에서 메인 세션이 전체 검사·`make build`·커밋.
