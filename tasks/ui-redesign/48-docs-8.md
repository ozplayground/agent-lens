# Task 48: 통합·상세 문서 반영 (보정 8·9)

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 48 (보정 8·9)
Status: done
Session: main
Agent: a7aa71569c11f941d (general-purpose, 문서)
Updated: 2026-11-07

## 한 일
plan 48 본문(보정 8 몫·보정 9 몫)과 spec 14.16 '문서'·14.17 '문서' 를 하나씩 대조해 반영했다. 코드 기준 HEAD `4f7935f` (45·46 `bcec1f5`·`cfa9a5b`, 49~54 `ca1ae9f..707e1a0`, 50 연장 `a7b2d95` 포함). 문서 내용은 지금 `frontend/src`·`frontend/scripts/ui-audit.mjs`·fixture·backend 코드를 직접 열어 확인했다 (frontend/src, backend/app, frontend/scripts, audit/, spec.md, plan.md 는 고치지 않음).

- `docs/known-issues.md`
  - '데이터·동작 오류' 카드 점수 행 '영향' 칸: 옛 '카드의 인기 점수(`🔥100`)가 여러 카드에 같게 보여 정보를 주지 않고' 를 '카드는 원천 지표가 있는 소스(`github`·`hackernews`·`reddit`)만 `raw_score` 와 인기 점수를 그려 합성 값을 숨긴다. 지표 소스에서도 인기 점수가 포화하면 100 으로 같게 보이고' 로 고쳤다. 정렬·폴백 `stars_hint`·합성 포크 수 서술은 그대로.
  - 새 행 3개 (backend 범위 밖): ① '데이터·동작 오류' — 브리핑 헤드라인·분야 요약 글자 수 자르기(`briefing_service.py:86`, `:88`, `:101-102`, 예 `…persistent p...`) ② 'UI·접근성' — backend 분야 이름·이모지가 `labels.ts` 와 다름(`briefing_service.py:16-38`, 화면은 긴 라벨·lucide 로 가리고 마크다운 전문·Notion·이메일(`notion_service.py:79`, `email_service.py:120` 의 `📌`)에는 남음) ③ 'UI·접근성' — 챗 단계 라벨(SSE `status` 의 `label`) 이모지(`chat_service.py:614`, `:635`, `:678`, `:693`, `:715`, `:734`). 각 행에 '원인은 backend 문자열, 프론트 범위 밖이라 backend 에서 따로 고친다' 를 적었다. 'UI·접근성' 의 "지금 알려진 문제가 없다." 는 표로 바꿨다.
  - 지운 행: 없음 (보정 8·9 가 행 전체를 고친 문제는 없다. 카드 점수 행은 영향 칸만 바뀜).
- `docs/ui-spec.md`: 피드 와이어프레임 3종(검색 영역 → 필터 영역 → 목록 머리줄, 카드 바닥 두 줄과 `AI 챗에서 분석`), 영역 표 4행(검색 영역·필터 영역)·5행(목록 머리줄, 정렬 포함)·6행(바닥 줄바꿈, 인기 점수 지표 소스만, 머리줄 `title`, `AI 챗에서 분석`)·8행·9행 줄 번호, 세로 간격 문장(다섯 영역, `page.tsx:170`, `FeedToolbar.tsx:218-221`), 챗 와이어프레임 3종 헤더 순서(`[← 피드] [🕘]`), 챗 영역 표(헤더 순서, 추천 질문 아이콘·보내는 글자, 모델 배지·모델 칩 lucide 아이콘), 대화상자 표(뉴스 상세 탭 `AI 질의응답`·배너 `AI 챗에서 분석`·빠른 질문 아이콘, 일일 브리핑 설정 한 곳·헤드라인 한 번·분야 머리글·시사점 아이콘, 공유 & 알림 여는 곳, 확인 창 여는 곳), 컴포넌트 트리(`FeedToolbar`·`FeedStatusBar`·`HandoverCtaButton`), 스타일 체계(아이콘 규칙·`IconGuard`, 레이어 이름).
- `docs/functional-spec/01-news-feed.md`: 개요·기능 표(NEWS-02~06·08·10·15·19), NEWS-01 목록 머리줄(위쪽 맞춤·상태 최소 높이 = 정렬 높이), NEWS-02 세 영역 폭별 표·DOM 순서·sticky 는 필터 영역만·간격, NEWS-03 소스 줄 왼쪽 bleed·토글 같은 줄, NEWS-04 토글 위치·높이, NEWS-05 검색 영역·`/` 포커스 스크롤(`preventScroll` + `scrollIntoView`, `scroll-mt-20`), NEWS-06 정렬이 목록 머리줄, NEWS-08 머리줄 `title`·바닥 줄바꿈·인기 점수 표시 조건·`AI 챗에서 분석`, NEWS-09 탭·배너, NEWS-10 탭 이름·빠른 질문 lucide 아이콘·오류 문구(이모지 없음), NEWS-15·16, NEWS-19 이름·문구, 상수 표(인기 점수 표시 조건, 줄 번호), 알려진 불일치(합성 점수 정렬 서술, 줄 번호). 고친 절의 코드 줄 참조를 지금 줄로 맞췄다.
- `docs/functional-spec/02-ai-chat.md`: 개요 헤더 순서, CHAT-08 추천 질문(아이콘·이모지 없는 글자 보냄), CHAT-15 티어 아이콘(`Zap`·`Target`·`Brain`, `TierIcon`, Claude 밖 티어), CHAT-18 이관 버튼 이름, 반응형 헤더 표(피드로가 맨 왼쪽), 관련 코드 줄.
- `docs/functional-spec/04-briefing-and-sharing.md`: 기능 표 BRF-03·BRF-11, BRF-03 규칙 1(헤드라인은 설명 한 곳)·2(도구줄에 설정 없음)·6(핵심 요약은 개요만, 분야 이름 긴 라벨·lucide 아이콘, 시사점 `Lightbulb`)·8·9(설정 진입 바닥 `연동 설정` 한 곳), 알려진 불일치 2행 추가(글자 수 자르기, backend 분야 이름·이모지), 낡은 `DailyBriefingModal.tsx`·`page.tsx` 줄 참조. `Updated` 2026-11-07.
- `docs/functional-spec/07-ui-common.md`: 개요에 아이콘 규칙 한 줄(lucide, 그림 이모지 금지, 판정식, `IconGuard`), UI-05 `onFocusSearch`, UI-08 예외 문구, UI-09 홈 표(검색 영역·필터 영역·목록 머리줄 행, 카드 바닥), 챗 표(헤더 왼쪽 순서, 추천 질문 아이콘), 예외 서술, UI-14 표(목록 머리줄 상태, 피드 검색·필터·목록 머리줄, 뉴스 카드, 질의응답 탭, 챗 헤더 DOM 순서), 단축키 표 `/`·Escape, 레이어 이름.
- `docs/design-system.md`: 1 원칙(아이콘은 lucide 하나), 4.6 레이어 이름, 5.2(`scoreMetric` 이 점수·인기 둘 다의 표시 조건, `FEED_CATEGORIES` 표, `TIER_META`·`TierIcon`), 5.3(입력과 칩의 쓰임, 아이콘 규칙), 7.1 Escape 예외 탭 이름, 9 표(`IconGuard`), 9.1(뉴스 상세 탭 이름, 포커스 필터 `pictograph`, '대상 없음' 검사), 9.3(검사별 대상, `vRhythm`·`toolbarLayout` 바뀐 판정, `cardMetric` ⑤, `terms` 넓힘, 새 검사 5개 `feedAreas`·`chatHeader`·`pictograph`·`briefing`·`cardFooter`), 측정 훅(`data-feed-search`, `data-feed-list-header`, `data-tier-icon`, 바뀐 `data-must-read-toggle`·`data-feed-toolbar`·`data-feed-status`), 9.4(21개 검사, 360 `feedAreas`, fixture 짝 9종 추가·2종 고침).
- `docs/test-cases.md`: 개수(52 파일 649, `vitest list` 576), 파일별 개수와 행 — AskAiPanel 8, ChatHeader 12, ChatMessageList 5, ChatModelSelector(아이콘 단언), HandoverIntegration(이름), FeedStatusBar 6(새 절), FeedToolbar 26(바뀐 10행·새 2행·정렬 행 삭제), DailyBriefingModal 6, NewsDetailModal(탭·배너 이름), NewsCard 42, IconGuard 3(새 절), 영역별 커버리지 8행, 이름·단언 불일치 1행(FeedToolbar ⑤ 'before sort').
- `docs/test-strategy.md`: frontend 수 52/649, 정적 검사 행에 `IconGuard`, 화면 측정 판정 21종·브리핑 skipped, 자체 검증(21종, `feedAreas` 두 폭, fixture 목록), 판정 표(`vRhythm`·`toolbarLayout`·`cardMetric`·`terms` 고침, 새 5행).
- `docs/tech-spec.md`: 변경 이력에 `| 2026-11-07 | ui-redesign | … |` 두 줄(보정 8: 카드 인기 점수, 보정 9: 피드 세 영역·아이콘·이관 용어·브리핑·ui-audit).

## 바꾼 파일
- docs/known-issues.md
- docs/ui-spec.md
- docs/functional-spec/01-news-feed.md
- docs/functional-spec/02-ai-chat.md
- docs/functional-spec/04-briefing-and-sharing.md
- docs/functional-spec/07-ui-common.md
- docs/design-system.md
- docs/test-cases.md
- docs/test-strategy.md
- docs/tech-spec.md
- tasks/ui-redesign/48-docs-8.md

## 검사 결과
- frontend 테스트 수: `cd frontend && pnpm test` → `Test Files  52 passed (52)`, `Tests  649 passed (649)` (2026-11-07 22:44). 파일별 개수는 `pnpm exec vitest run --reporter=json` 로 확인. `pnpm exec vitest list` 576줄 (TokenContrast 3, DeepResearcherTab 2, FeedToolbar 20, NewsCard 32). 문서의 수(test-cases 52/649/576, test-strategy 52/649)와 같다.
- 옛 용어: `grep -rnE "전용 챗|Ask AI 질의응답|전용 AI 챗으로 이동|연동 설정 관리" docs/ui-spec.md docs/functional-spec docs/design-system.md docs/test-cases.md docs/test-strategy.md docs/known-issues.md docs/tech-spec.md` → 출력 없음 (종료 1). plan 끝 기준 `rg -n "Ask AI 질의응답|전용 챗에서 분석|전용 AI 챗으로 이동|연동 설정 관리" docs/ui-spec.md docs/functional-spec` → 출력 없음.
- 정렬이 툴바에 있다는 서술: `정렬` 이 든 줄 가운데 `툴바|줄 B|toolbar|필터 영역|Must-Read` 가 함께 있는 줄을 모두 읽었다. 지금 동작으로 정렬을 필터 영역(툴바)에 두는 서술은 없다. 남은 줄은 '필터 영역 안에는 없다' 는 서술, `ui-audit` defects fixture(고치기 전 구조) 설명, test-cases 의 이름·단언 불일치 메모뿐이다.
- `grep -n "정보를 주지 않고" docs/known-issues.md` → 출력 없음.
- known-issues 에 우려 39 의 세 행이 있다 (`briefing_service.py:101-102` 행, 분야 이름·이모지 행, 챗 단계 라벨 행).
- 새 줄 작업 이력 표현: `git diff -U0 -- docs/ | grep '^+' | rg "우려|보정|docs/features|tasks/|/write-|/implement-plan|/triage|승인|Revision|spec 14|intent"` → test-cases 가 인용한 실제 테스트 이름 1줄(`… below 768px (R35 보정 9)`)뿐.
- 표 열 수: 바꾼 문서의 표마다 행의 `|` 수를 머리줄과 대조 → 바꾼 줄에 어긋남 없음 (design-system.md:227 `ScrollRow` 행은 이번에 손대지 않은 기존 줄).
- `Updated:` 바꾼 문서 10개 모두 2026-11-07.

## 결정
- 사용자 지시(통합 문서에는 스킬 이름·작업 이력을 쓰지 않는다)가 plan 문구보다 앞선다고 보고, plan 이 적은 known-issues 문구의 `(R36·R41)` 과 '별도 intent(`/triage-signal` 또는 `/write-intent`)로 넘김' 은 '프론트 범위 밖이라 backend 에서 따로 고친다' 로 바꿔 적었다.
- 옛 용어 grep 을 0 으로 만들려고, `terms` 검사 설명(design-system 9.3·9.4, test-strategy 판정 표)의 금지 용어 목록은 글자 대신 스크립트 상수 `EXPECT9.bannedTerms`(`Ask AI` 와 옛 이관 용어 둘)로 가리켰다.
- 07-ui-common.md 는 plan 이 아이콘 규칙·챗 헤더 표만 적었지만, 같은 파일(목록 안)에 정렬이 툴바에 있다는 서술·`챗에서 분석` 아이콘만 서술·옛 탭 이름이 남아 있어 함께 고쳤다 (끝 기준의 옛 용어·정렬 grep 대상).
- known-issues 'UI·접근성' 에 두 행(분야 이름·이모지, 챗 단계 라벨)을, '데이터·동작 오류' 에 글자 수 자르기 행을 두었다.
- tech-spec 변경 이력의 기능 id 열은 지시대로 `ui-redesign` 만 쓰고, 보정 8·9 구분은 바뀐 절 열에 적었다.

## 막힌 점
- 없음.
- 범위 밖으로 남은 것: plan 목록 밖 문서(product.md, api.md 등)는 grep 결과 옛 용어·정렬 서술이 없어 고칠 것이 없었다. 02-ai-chat.md·07-ui-common.md 의 이번에 손대지 않은 절에 낡은 코드 줄 참조(예: 02 CHAT-17 `ChatHeader.tsx:158-164`, 상수 표 `ChatHeader.tsx:59,92,133`)가 남아 있다 (내용 서술은 맞음).

## 다음
- 메인 세션 검토. 별도 backend intent(우려 39 의 세 항목)는 메인 세션이 연다.

## 후속 (낡은 코드 줄 참조, 메인 지시 2026-11-07)
- 한 일: docs/ui-spec.md, docs/functional-spec/*.md, docs/design-system.md, docs/test-cases.md, docs/test-strategy.md, docs/known-issues.md 에서 보정 8·9 로 바뀐 파일(FeedToolbar, FeedStatusBar, app/page, NewsCard, HandoverCtaButton, NewsDetailModal, AskAiPanel, ChatHeader, ChatMessageList, ModelTierBadge, ChatModelSelector, DailyBriefingModal, ui-audit.mjs)을 가리키는 `파일:줄` 참조 133개를 뽑았다. 문서 줄의 git blame 커밋에서 HEAD 로 줄 대응을 계산한 뒤, 참조마다 문서 문맥과 HEAD 코드를 직접 대조해 맞췄다. 편집 65곳, 줄 지정 약 76개를 고쳤다. 나머지는 이미 맞았다(이번 48 에서 쓴 참조 포함).
  - 대응 계산만으로는 틀리는 참조가 있어 문맥으로 정했다: 02 CHAT-18 `NewsCard.tsx:176-180`→`:218-222`, `NewsDetailModal.tsx:299-306`→`:336-344`, `page.tsx:111-114`→`:126-130`. 02 CHAT-17 `ChatHeader.tsx:158-164`→`:143-149`. 02 상수 표 `ChatHeader.tsx:59,92,133`→`59,92,134`.
  - test-strategy: `ui-audit.mjs:1-177`→`:1-222`(USAGE 끝). 함께 적힌 '대상 없음' 실패 검사 목록에 `feedAreas`·`chatHeader`·`briefing`·`cardFooter` 를 더했다 (코드 확인).
  - 03-collection.md:359: 화면 문구 "LLM으로 선별하고 3줄 핵심 요약과 개발자 시사점을 추출" 이 지금 frontend 어디에도 없어(`grep -rn "LLM으로 선별" frontend/src` 0줄) 줄 번호를 고칠 대상이 없다. 그 문장과 `page.tsx:150` 참조를 지웠다.
- 바꾼 파일: docs/functional-spec/01-news-feed.md, 02-ai-chat.md, 03-collection.md, 04-briefing-and-sharing.md, 05-sources-and-research.md, 06-mcp-server.md, 07-ui-common.md, docs/test-strategy.md, tasks/ui-redesign/48-docs-8.md. 03·05·06 의 `Updated` 를 2026-11-07 로.
- 검사 결과: 고친 참조의 줄을 HEAD 에서 `awk 'NR>=a&&NR<=b'` 로 열어 문서 문맥과 같은 코드인지 확인했다. design-system.md·test-cases.md·known-issues.md·ui-spec.md 의 대상 참조(`ChatModelSelector.tsx:13-14,93`, `NewsDetailModal.tsx:402-411`, `app/page.tsx:72`·`:36`·`:83-89`·`:94-100`)는 이미 맞아 그대로 두었다.

## 후속 2 (리뷰 Nit 3, 메인 지시 2026-11-07)
- 한 일: docs/test-strategy.md 의 ui-audit 판정 표와 그 아래 설명에 검사 범위의 한계를 적었다.
  - `pictograph`: 대상 선택자 `button, a, [role="tab"], [role="menuitem"], [role="radio"], label, h1, h2, h3` 밖의 `p`·`span`·`div` 글자는 보지 않는다 (`ui-audit.mjs:1625`). 피드 `/` 기본 상태의 검사 목록에 없다 (`:2146-2157`. 도는 상태는 `:1848-1849`, `:1862`, `:1901`, `:2157`).
  - `terms` 금지 용어: `button`·`a`·`[role="tab"]` 의 접근 이름·글자만 보고, 제목·본문·`title` 속성은 보지 않는다 (`:1465-1472`).
  - `IconGuard` 가 `components/**`·`app/**` 의 소스 글자 전체에서 그림 이모지를 찾아 `pictograph` 의 범위를 소스 수준에서 보완한다 (`IconGuard.test.ts:15`). `lib`·`hooks`·`context` 는 대상이 아니다.
- 결정: `IconGuard` 는 그림 이모지만 보고 금지 용어는 보지 않는다. 그래서 `terms` 금지 용어 범위를 보완한다고는 적지 않고, 이 사실을 그대로 적었다.
- 바꾼 파일: docs/test-strategy.md, tasks/ui-redesign/48-docs-8.md
- 검사 결과: 인용한 줄을 HEAD 에서 열어 확인했다 (`ui-audit.mjs` 1465·1470·1625·1848·1849·1862·1901·2156·2157, `IconGuard.test.ts:15`).
