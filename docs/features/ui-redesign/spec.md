# Spec: 디자인시스템과 반응형 UI/UX 재설계

Intent: ./intent.md
Status: approved
Approved-by: 자동 승인 (Claude) (2026-11-07)
Revision: 2026-11-06 2차 보충 — '14. 후속 범위 (2차)' 와 R14~R32 추가. 1차(R0~R13, 설계 0~13)는 승인됐던 내용 그대로다
Revision: 2026-11-06 리뷰 후속 보정 (이전 승인: 자동 승인 (Claude) 2026-11-06) — reviewer 2·3차 리뷰 Important 3·Nit 5 를 반영한다. 고친 요구: R15(스크롤 버튼 포커스 유지, 소스 줄 선택 칩 선택자), R17(배지 줄: 기술 배지가 줄어들며 말줄임), R23(이미 알린 알림을 다시 알리지 않음), R27(오래된 상태 응답 무시), R29(`clip` 이 스크롤 영역 상자의 잘림도 봄, `chatAlign` 투명 판정), R30(새 fixture). 새 요구: R33(툴바 한 트리·CSS 배치). 고친 절: 14.2, 14.3, 14.4, 14.7 C-2·C-7, 14.8, 14.9, 14.10, 새 14.12, 우려 20~22, 근거 E28~E33. 1차와 2차의 나머지 R 행·절은 그대로다
Revision: 2026-11-06 리뷰 후속 보정 2 (이전 승인: 자동 승인 (Claude) 2026-11-06) — 32단계 구현(`8a46693`)에서 14.7 C-2 의 '기록이 없거나 자기 영역 id 면 live' 규칙이 `composer` → `global` → `composer` 왕복 뒤 알림을 다시 읽게 해 R23 을 어긴다는 보고를 반영한다. 고친 곳: R23(처음 그려진 한 번만 live, 넘겨준 뒤에는 처음 영역으로 돌아와도 조용함), 14.7 C-2(`announcedBy` 값에 `null` = 넘겨줌), 14.9 `ui/Toast.test.tsx` 왕복 단언. 다른 R 행·절은 그대로다
Revision: 2026-11-06 리뷰 후속 보정 3 (이전 승인: 자동 승인 (Claude) 2026-11-06) — 36 재측정 3(`8a283d9`) 육안 확인(360·390 소스 줄이 처음부터 `scrollLeft 138` 이라 `Must-Read` 가 왼쪽 밖에 숨는데 768 미만 표시가 오른쪽에만 있음)과 31 후속 2 보고(스냅 여백 16px ≠ 흐림 24px)를 반영한다. 고친 곳: R15(768 미만 넘친 쪽마다 표시, 표시 쪽 `bleed` 규칙, 흐림 = 스냅 여백 24px, 측정 기준), 14.3 '(보정 3)' 두 항목, 14.8 `scrollRow` 판정·fixture 3행·360·390 소스 줄 증거, 새 14.13(바뀌는 단언 5곳 표, 새 단언, 단계), 우려 23·24. 다른 R 행·절은 그대로다
Revision: 2026-11-06 리뷰 후속 보정 4 (이전 승인: 자동 승인 (Claude) 2026-11-06) — verifier Chrome 실측(검색에 포커스·값을 둔 채 1440→1024→360→1440: input 노드·포커스·값, 칩 줄 노드는 유지, 소스 줄 `scrollLeft` 0→0→114→0)이 R33 의 '`scrollLeft` 가 유지된다' 와 달라 R33 을 R15 와 맞춘다. 고친 곳: R33(유지되는 것은 노드·포커스·입력 값·가상 키보드, `scrollLeft` 는 R15 다시 보이기 규칙을 따름, 측정 기준), 14.2 R33 항목 두 문장, 14.3 '포커스'(31 후속 구현의 '선택 칩 다시 보이기' 규칙을 spec 에 적음), 14.9 `FeedToolbar.test.tsx` ②. 다른 R 행·절은 그대로다
Revision: 2026-11-07 리뷰 후속 보정 5 (이전 승인: 자동 승인 (Claude) 2026-11-06) — ① 제품 오너 결정(2026-11-07): `Must-Read` 를 소스 스크롤 줄에서 빼 정렬 옆 고정 토글로 둔다 (우려 23 닫음). ② reviewer 재리뷰 Nit 2: 선택 칩 다시 보이기의 '사용자 스크롤' 을 '줄에 대한 입력 신호 뒤에 온 `scroll`' 로 다시 정의한다. 고친 곳: 새 R34, R15(소스 줄 선택 칩 문구, 측정 기준), R33(사용자 스크롤 정의, DOM 순서·측정 기준), 14.2(배치 표 줄 B, 'Must-Read 토글' 항목, 폭 계산, '그대로' 목록), 14.3(줄별 선택자 끝, 보정 3-6, '포커스' 와 새 '(보정 5) 사용자 스크롤 정의'), 14.8(Must-Read 증거를 `mustReadVisible` 로 교체, fixture 1행), 14.10(known-issues 행 삭제 등), 새 14.14(바뀌는 단언 표, 새 단언, 측정, 단계), 우려 23 닫음·25·26 추가, 근거 E34. 다른 R 행·절은 그대로다
Revision: 2026-11-07 리뷰 후속 보정 6 (이전 승인: 자동 승인 (Claude) 2026-11-07) — reviewer 최종 확인 Nit 1·2. ① 14.8 `clip` ① 의 '스크롤바가 보이는 스크롤 영역' 가로 면제를 구현(`ui-audit.mjs:795-797` `hExempt`, 30 후속 3)과 같게 768 이상(`K.scrollButtonMinWidth`)에서만으로 고친다. ② 14.3 '(보정 5) 사용자 스크롤 정의' 의 `wheel` 을 가로 의도(`Math.abs(deltaX) > Math.abs(deltaY) || shiftKey`)일 때만 입력 신호로 센다. 고친 곳: 14.8 `clip` 칸, 14.3 보정 5-1, R15·R33 측정 기준(세로 휠은 신호 아님, Chrome 확인), 14.14(새 단언 ⑤⑥, 보정 6 바뀌는 단언 표 `ChipGroup.test.tsx:619`·`:950`, 측정), 우려 25. 다른 R 행·절은 그대로다
Revision: 2026-11-07 보정 7 (이전 승인: 자동 승인 (Claude) 2026-11-07) — 메인 세션이 프로덕션 측정 스크린샷 24장(`audit/*.png`)을 직접 보고 확정한 결함 7건(피드 F1~F3, 챗 C1~C4)을 다룬다. 새 요구: R35(768 미만 소스 줄 전체 폭), R36(카드 원천 지표만 표시), R37(360 모드 탭), R38(챗 용어 통일), R39(모델 선택 한 곳), R40(포커스 시트 라벨). F2(태블릿 칩 줄 잘림)는 줄 구성을 바꾸지 않기로 판단했다 (14.15 F2, 우려 29). 고친 곳: R19(포커스 시트 제외 삭제), 14.2 배치 표 768 미만 행, 9 대응표 CHAT-15 행, 14.4 '라벨(R19)' 끝 문장, 새 14.15(결함·판정 기준·바뀌는 단언 표·측정·문서·단계), 우려 18 닫음·27~32 추가, 근거 E35~E40. 다른 R 행·절은 그대로다
Revision: 2026-11-07 보정 7 정정 (이전 승인: 자동 승인 (Claude) 2026-11-07) — 42단계 implementer 보고. ① 14.15 '바뀌는 단언' 표에 `chat/ChatSessionWorkflow.test.tsx:58` 행 추가(`/단일 기사|Scoped/i` → `'단일 기사'` 정확 일치. 세션 카드 접근 이름 `…, 단일 기사 모드` 와 겹쳐 여러 요소가 걸림)하고 '그대로 성립한다' 서술을 고침. ② R40 측정 기준의 `rg` 정규식을 따옴표 포함 형태로 좁힘(`SessionEmptyState.tsx:48` 문장 오검출). 다른 곳은 그대로다
Revision: 2026-11-07 보정 8 (이전 승인: 자동 승인 (Claude) 2026-11-07) — 메인 세션 지시. 카드 바닥 인기 점수 `🔥100` 이 RSS 카드마다 같은 값으로 보인다 (`audit/feed-light-1440x900.png`). 인기 점수는 `raw_score` 에서 계산되므로 R36 이 숨긴 합성 점수 소스에서는 인기 점수도 합성 값이다. 새 요구: R41(인기 점수도 원천 지표 소스만). 고친 곳: 14.4 바닥 통계 문장, 새 14.16(판정 `cardMetric` ⑤, fixture, 바뀌는 단언 표, 문서, 단계), 우려 28 해결 칸, 새 우려 33, 근거 E41. 다른 R 행·절은 그대로다
Policies: 정책 스킬 없음 (`.claude/skills/` 에 보안·UX·브랜드 정책 스킬이 없다). 적용한 규칙: `CLAUDE.md` SDLC 규칙(테스트를 고쳐 통과시키지 않는다, plan 범위 게이트), `.claude/rules/contracts.md`, `docs/product.md` '제품 원칙과 제약'(2026-11-06, 커밋 b983c33: 폭별 기능 동등, 단일 디자인시스템, WCAG 2.2 AA)

## 요구사항
번호 뒤 괄호는 intent '기대 결과' 측정 기준 번호다. R0 은 측정 기준 앞의 문장(디자인시스템을 정의하고 문서로 남긴다)에 대응한다.

| ID | 요구사항 | 측정 기준 |
|---|---|---|
| R0 | 색·글꼴·크기·간격·반경·그림자·모션·z-index 를 토큰으로 정의하고(설계 1), 공통 부품을 `frontend/src/components/ui/` 한 곳에 두고(설계 2), `docs/design-system.md` 로 문서화한다(설계 10) | 기대 결과 본문 |
| R1 | `frontend/src/**/*.tsx` 에 임의 hex 색 클래스(`-[#…]`)가 0개, Tailwind 기본 팔레트 색 유틸리티(`bg-slate-100`, `text-blue-600` 등)도 0개다. `globals.css` 에 `!important` 가 0개다. 정적 검사 테스트로 강제한다 | (1) |
| R2 | 테마는 `<html>` 의 `dark`/`light` 클래스 하나로 결정되고 `dark:` 변형도 그 클래스를 따른다. 색은 토큰 변수 값만 바꿔 적용한다. 첫 그리기 전에 저장된 테마가 적용된다 | (2) |
| R3 | 360, 390, 768, 1024, 1440px 에서 `/`, `/chat`, 모든 대화상자가 열린 상태에서 문서 가로 스크롤이 없다 (코드 블록·표·칩 줄처럼 의도한 내부 가로 스크롤만 허용) | (3) |
| R4 | `/` 와 `/chat` 의 `<header>` 높이가 모든 폭에서 56px(≤64px)이고 한 줄이다 | (4) |
| R5 | 390×844 첫 화면(스크롤 0, 수집 진행 줄 없음)에 기사 카드 제목이 1개 이상 보이고, 1440×900 첫 화면에 카드 한 줄 전체가 보인다 | (5) |
| R6 | 768px 미만에서 주요 조작 요소(설계 1.9 정의)의 터치 영역이 44×44px 이상이다 | (6) |
| R7 | 모든 모달·시트·드로어가 `role="dialog"`(확인 창은 `alertdialog`), `aria-modal="true"`, `aria-labelledby` 제목 연결, 포커스 트랩, 닫을 때 포커스 복귀를 갖는다. Escape 는 맨 위 레이어 하나만 닫는다. 레이어가 열려 있으면 피드 단일 키 단축키가 동작하지 않는다. 포커스된 버튼·링크를 Enter·Space 로 누를 수 있다 | (7) |
| R8 | viewport 에 `maximumScale`, `userScalable: false` 를 두지 않는다 | (8) |
| R9 | `docs/functional-spec/` 의 NEWS, CHAT, BRF, SRC, MCP, UI 화면 기능이 모두 각 폭(데스크톱·태블릿·모바일)에서 닿을 수 있다 (설계 9 대응표) | (9) |
| R10 | `make check` 의 frontend 단계(vitest, eslint, `tsc --noEmit`)가 통과한다. 기준선 eslint 오류 54개를 없앤다 | (10) |
| R11 | localStorage 키(`agentlens_theme`, `agentlens_bookmarks`, `agentlens_chat_sessions_index`, `agentlens_chat_session_{id}`, `agentlens_webhook_url`)의 이름·형식을 바꾸지 않는다. 새 키를 추가하지 않는다 | 제약 |
| R12 | backend, REST·SSE 계약, `types/**`·`mocks/**` 의 스키마·응답 형태를 바꾸지 않는다. 런타임 의존성을 추가하지 않는다. 외부 폰트·CDN 에 기대지 않는다 | 제약 |
| R13 | UI 문구는 한국어다. 테스트가 찾는 라벨·aria 이름은 유지한다 (설계 11.2 목록) | 제약 |

2차 요구사항 (설계 14). 괄호 안 문자는 14.0 의 작업 묶음(A 화면 결함, B 챗 알림 위치, C 알려진 문제, D 자동 측정, E 범위)과 14.1 결함 번호(F1~F17)다. 자동 측정 항목은 14.8 의 ui-audit 검사 이름이다.

| ID | 요구사항 | 측정 기준 |
|---|---|---|
| R14 | 필터 툴바는 폭마다 줄을 독립된 flex 줄로 배치하고(14.2 표), 두 컨트롤이 그리드 열을 나눠 쓰지 않는다. 1440×900 에서 `카테고리`·`소스` 그룹이 넘치지 않고(`scrollWidth ≤ clientWidth + 1`) `북마크` 를 포함한 모든 칩이 그룹 안에 다 보인다. 정렬 선택창 오른쪽에 빈 열이 없다 (보정 9 부터 정렬은 툴바가 아니라 목록 머리줄에 있다, R42) | (A-1, F1, F9) ui-audit `scrollRow`, `clip` 이 1440 에서 실패 0 |
| R15 | 칩 줄(피드 카테고리·소스, 요약 바 급상승, 챗 맥락 줄, Ask AI 빠른 질문)은 줄바꿈하지 않고 가로 스크롤한다 (390 결정, 14.3). 넘칠 때만 넘친 쪽에 흐림과 `data-overflow`(`start`/`end`/`both`)를 둔다. 768 이상에서는 넘친 쪽에 스크롤 버튼(그룹 밖)이 보인다. 768 미만에서는 넘친 쪽마다 장식 넘침 표시(그룹 밖, `start` 는 왼쪽 `‹`, `end` 는 오른쪽 `›`, `both` 는 둘 다)가 보이고, 표시는 칩을 덮지 않는다. 768 미만에서 표시가 없는 쪽은 줄이 화면 끝까지 닿고(`bleed`), 표시가 있는 쪽은 표시가 그 페이지 여백을 쓴다 (14.3). 칩에 포커스가 가거나 선택되면 그 칩 전체가 보이게 스크롤한다. 흐림 폭과 스냅 여백(`scroll-padding`)은 모든 폭에서 24px 로 같아, 선택 칩은 흐림 밖에 다 보인다 (14.3). 줄마다 '선택 칩' 이 무엇인지 정한다: 소스 줄은 소스 칩(`전체`·소스·`북마크`) 중 눌린 것이다 (14.3. 보정 5 부터 `Must-Read` 는 소스 줄 밖 토글이다, R34). 넘치지 않으면 흐림이 없다. 스크롤 버튼에 키보드 포커스가 있을 때 그 버튼이 사라져도(넘침 상태가 바뀌거나 폭이 768 미만이 됨) 포커스는 `body` 로 떨어지지 않고 반대쪽 버튼, 없으면 그 줄의 선택 칩, 없으면 줄의 첫 포커스 가능 요소로 옮겨진다 (14.3) | (A-2, F2) ui-audit `scrollRow` 5개 폭 실패 0 (보정 3: 768 미만 넘친 쪽마다 표시, 처음 상태 선택 칩이 흐림 밖), `occluded` 실패 0, `ui/ChipGroup.test.tsx`(버튼이 사라질 때 `document.activeElement`, 선택자, 표시 쪽·bleed 클래스, `scroll-px-6`), `feed/FeedToolbar.test.tsx`(Must-Read 와 소스가 함께 눌렸을 때 소스 칩이 보이게 스크롤), 선택 칩 다시 보이기의 '사용자 스크롤' 판정(입력 신호 뒤 `scroll` 만, 14.3 보정 5. 보정 6: 세로 휠은 입력 신호가 아님)은 `ui/ChipGroup.test.tsx` 와 Chrome 확인 (14.14) |
| R16 | 한 줄 글자(칩·버튼·배지·메타·제목 줄임)는 다 들어가거나 말줄임표(`…`)로 끝난다. 여러 줄 글자는 `line-clamp` 말줄임으로만 자른다. 입력 자리표시는 5개 폭에서 입력 내용 폭 안에 들어간다 | (A-1·A-2, F3) ui-audit `clip`, `placeholder` 5개 폭 실패 0 |
| R17 | 뉴스 카드: 머리줄은 한 줄(카테고리 짧은 라벨 · 소스 · 시간, 넘치면 말줄임)이고 북마크 버튼과 세로 가운데가 맞는다. 제목 2줄 높이 고정, 본문 2줄 높이 고정, 배지 줄은 한 줄(Must-Read 1 + 기술 스택 최대 3), 인기 점수는 바닥 통계로 옮긴다. 배지 줄이 R16 을 지킨다: `Must-Read` 는 줄어들지 않고, 기술 배지는 자리가 모자라면 함께 줄어들며 말줄임표로 끝난다 (각 최소 48px, 최대 128px). 배지가 글자 중간에서 줄 상자에 잘리지 않는다. 기술 이름 전체는 접근 이름(배지 글자)·`title`·기사 상세의 기술 목록으로 닿는다 (14.4). 같은 줄 카드의 제목 top 차와 카드 높이 차가 1px 이하다. 본문 라벨은 `시사점` | (A-3, F4, F6, F8) ui-audit `rowAlign` 768·1024·1440 실패 0, `clip` 실패 0(`--self-test` 의 배지 줄 fixture 가 이 결함을 잡음, R30), `NewsCard.test.tsx`(배지 줄 클래스 단언, 14.4) |
| R18 | 현재 목록에서 같은 시사점 문장(공백 정리 후 끝 40자가 같음)이 2개 이상 카드에 있으면 그 카드들은 시사점 대신 요약을 보인다 (요약이 없으면 시사점). 기사 상세는 바꾸지 않는다 | (A-4, F5) `feed/FeedInsights.test.ts`, `NewsCard.test.tsx` |
| R19 | 카테고리 표시 라벨은 `lib/labels.ts` 한 곳에서 나온다. 긴 라벨(필터 칩, 상세 배지): `하네스 & 벤치마크`, `MCP & 생태계`, `에이전트 아키텍처`, `최신 AI 동향`. 짧은 라벨(카드 머리줄, 챗 기사 칩, 인용 팝오버, 포커스 캡슐): `하네스`, `MCP`, `에이전트`, `AI 동향`. 피드·상세·챗 화면에 원값(`mcp_plugins_skills` 등)과 영문 카테고리 라벨이 나오지 않는다 (보정 7 부터 포커스 시트도 포함한다, R40. 이전에는 우려 18 로 제외) | (A-5, C, F7·F8) 단위 테스트, `rg` 로 `components/**` 에 카테고리 라벨 표가 `labels.ts` 밖에 없음 |
| R20 | 요약 바: 768 미만에서는 날짜를 숨기고 헤드라인을 보인다. 급상승 칩은 1024 이상에서만 보인다. 요약 바와 툴바 사이, 툴바와 상태 줄 사이 세로 간격이 모든 폭에서 12~16px 다. (보정 9, R42) 영역이 셋으로 나뉜 뒤에는 요약 바 → 검색 영역, 검색 영역 → 필터 영역(첫 칩 줄), 필터 영역(마지막 칩 줄) → 목록 머리줄 세 간격이 모든 폭에서 12~16px 다 | (A-5, F10~F12) ui-audit `vRhythm` 실패 0 (보정 9: 세 간격, 14.17), `InsightsBar.test.tsx` |
| R21 | 마크다운 밖의 한국어 여러 줄 글자는 어절 단위로 줄을 바꾼다(`word-break: keep-all`). 챗 추천 질문 카드는 왼쪽 정렬이다. 챗 1024 이상에서 사이드바 머리 영역 아래 경계와 헤더+맥락 줄 아래 경계가 ±1px, 맥락 줄·메시지 열·입력 영역 왼쪽 끝이 ±1px 로 맞는다 | (A-5, F13·F14) ui-audit `keepAll`, `chatAlign` 실패 0 |
| R22 | 데이터를 다시 읽는 동안(수집 중 새 소식 저장, 수집 끝, 소스 변경, 같은 조건 검색 제출) 요약 바와 카드 그리드가 스켈레톤으로 바뀌지 않고 이전 내용을 유지한다. 스켈레톤은 첫 로드와 필터·정렬·검색어·페이지가 바뀔 때만 그린다. 통계 요청이 실패해도 브리핑·레이더는 갱신된다 | (C-4, F15) `hooks/useNewsFeed.test.tsx`, `InsightsBar.test.tsx` |
| R23 | `/chat` 의 알림은 대화상자가 열려 있지 않으면 입력 영역 바로 위, 메시지 열 폭 안에 뜬다: 알림 아래 끝 ≤ 입력 영역 위 끝, 간격 ≤ 16px, 768 이상에서 좌우가 메시지 열 안. 대화상자가 열려 있으면 전역 알림 영역(설계 2 `Toast`)에 뜬다. 알림을 그리는 영역이 바뀌어도(`composer` ↔ `global`) 이미 알린 알림은 스크린리더에 다시 알리지 않는다: 알림 하나는 처음 그려진 한 번만 `role="status"`/`role="alert"`·`aria-live` 를 갖고, 다른 영역으로 한 번 넘어간 뒤에는 처음 영역으로 돌아와도 갖지 않는다 (14.7 C-2) | (B, C-2) ui-audit `toast` 5개 폭 실패 0, `ui/Toast.test.tsx`(영역이 바뀐 뒤 같은 알림에 live 속성 없음, `composer` → `global` → `composer` 왕복 뒤에도 없음, 새 알림은 있음) |
| R24 | `aria-controls` 는 그 순간 DOM 에 있는 요소의 id 만 가리킨다 (챗 기록 버튼, `Tabs`, 브리핑 `이메일 발송`, `새 피드 직접 등록` 포함) | (C-1, F17) ui-audit `ariaControls` 모든 측정 상태 실패 0, 단위 테스트 |
| R25 | 겹친 대화상자는 같은 렌더에서 함께 열려도 렌더 순서(부모 → 자식)대로 쌓인다. 자식이 맨 위이고, Escape 한 번에 자식만 닫히며, 부모는 `inert` 다 | (C-5) `ui/OverlayStack.test.tsx` |
| R26 | 기사 상세 Ask AI 입력창에서 Escape 를 누르면 대화상자가 닫히지 않는다. 입력 글자와 대화 기록이 남고 포커스가 Ask AI 탭 패널로 옮겨진다. 입력창 밖에서 누른 Escape 는 지금처럼 맨 위 레이어를 닫는다 | (C-6) `modals/NewsDetailModal.test.tsx` |
| R27 | `/` 를 다시 열 때 backend 가 수집 중(`GET /api/schedule/status` 의 `is_running: true`)이면 진행 줄과 `수집 중` 표시, 진행 폴링을 되살리고 `즉시 수집` 을 누를 수 없게 둔다. 즉시 수집 응답이 `already_running` 이면 다시 요청하지 않고 진행 폴링을 이어 붙인다. 초기화 응답이 `already_running` 이면 확인 창 안 오류로 응답 문구를 보인다. 오래된 상태 응답은 버린다: 진행 폴링이 끝나기 전에 보낸 상태 요청의 응답, 또는 더 나중에 보낸 상태 요청의 응답이 이미 반영된 뒤 도착한 응답은 상태도 폴링도 바꾸지 않는다. 수집 한 번에 `수집 완료` 알림은 한 번만 난다 (14.7 C-7) | (C-7) `hooks/useCollector.test.ts`(완료 뒤 늦게 온 `is_running: true` 응답 → 폴링 재시작 없음·완료 문구 1회), `Header.test.tsx` |
| R28 | Ask AI 답변 복사가 실패하면 그 답변의 복사 버튼이 2초 동안 `복사 실패` 를 보이고 `aria-live` 로 알린다 | (C-8) `AskAiPanel.test.tsx` |
| R29 | ui-audit 판정을 강화한다 (14.8): 잘림(부모 clip·화면 밖·말줄임 없는 넘침·자리표시. 스크롤 영역을 지난 뒤에는 그 축에서 스크롤 영역 상자 자체가 바깥 조상에 잘리는지를 세로·가로 모두 계속 본다), 가림(요소 위 5점 hit test), 같은 줄 카드 정렬, 스크롤 줄 표시, `aria-controls` 대상, 한국어 줄바꿈, 세로 간격, 챗 정렬(배경색은 표기와 상관없이 알파 0 이면 칠하지 않은 것으로 본다), 챗 알림 위치. 360·390·768·1024·1440 × light·dark × `/`·`/chat`·기존 대화상자 상태 9개(ui-audit `DIALOGS`, 뉴스 상세는 탭 2개 모두)·추가 상태 3개(레이더 펼침, 챗 기사 칩, 챗 경고 알림) | (D) `report.json` 의 `checks` 에 14.8 검사 이름이 조합마다 있음 |
| R30 | 강화한 판정이 결함을 잡는다는 증거를 남긴다: (1) `--self-test` 가 결함 고정 페이지에서는 검사마다 실패를, 깨끗한 페이지에서는 통과를 낸다. 결함 고정 페이지는 리뷰 후속 결함 3종(바깥 `overflow:hidden` 상자에 세로로 잘린 스크롤 영역, 가로로 잘린 스크롤 영역, 기술 배지가 줄어들지 않아 잘린 266px 배지 줄)을 `clip` 으로 표시하고, 깨끗한 페이지는 같은 구조의 고친 형태(`min-height:0`·`min-width:0`, 줄어드는 배지)와 알파 0 배경(`oklab(… / 0)`, `color(srgb … / 0)`)을 가진 챗 정렬 위젯을 담는다 (14.8). (2) 2차 수정 전 코드(커밋 `1ec8a9b`)를 같은 방법으로 띄워 돌리면 F1(1440 소스 줄), F2(390 카테고리 줄), F3(자리표시), F4(카드 제목 어긋남)를 실패로 보고한다 | (D) verify.md 에 두 실행의 명령·요약 인용 |
| R31 | ui-audit 은 프로덕션 빌드에서 돌린다. Next.js 개발 표시기(`nextjs-portal`)가 있으면 환경 오류(종료 2)로 끝낸다. 대표 스크린샷은 `/`·`/chat` × 5개 폭 × 2테마 20장과 뉴스 상세·일일 브리핑의 390·1440 (라이트) 4장이다 | (D, F16) `report.json` `environment.devIndicator: false`, PNG 24장 |
| R32 | 2차도 R11·R12·R13 을 지킨다: backend, `types/**`, `mocks/**`, `lib/api.ts`, `package.json` 의존성, localStorage 키를 바꾸지 않는다. `make check` 의 backend live LLM 테스트 2개 실패(known-issues '테스트·운영')는 범위 밖이고, R10 은 `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0 으로 증명한다 | (E) `git diff --name-only 1ec8a9b..HEAD -- backend frontend/src/types frontend/src/mocks frontend/src/lib/api.ts frontend/package.json frontend/pnpm-lock.yaml` 0줄 |
| R33 | 필터 툴바는 모든 폭에서 같은 DOM 트리를 쓰고 폭별 배치는 CSS(미디어 쿼리 클래스)로만 바꾼다. 폭에 따라 JS 로 트리를 고르지 않는다. 그래서 폭이 바뀌어도 검색 입력과 스크롤 줄이 다시 마운트되지 않아 두 요소의 DOM 노드, 입력 포커스, 입력 값, 가상 키보드가 유지된다. 칩 줄의 `scrollLeft` 는 R15 의 '선택 칩 다시 보이기' 규칙(14.3)을 따른다: 사용자가 줄을 직접 스크롤했으면(줄에 대한 입력 신호 뒤에 온 `scroll`, 14.3 보정 5) 그 위치를 유지하고, 직접 스크롤하지 않았으면(브라우저의 범위 자르기·스냅 재맞춤 포함) 폭이 바뀌어 줄 폭이 달라질 때 선택 칩이 흐림 밖에 다 보이도록 다시 맞춘다 (예: 보정 4 Chrome 실측 1440→1024→360→1440 에서 소스 줄 `scrollLeft` 0→0→114→0. `Must-Read` 가 소스 줄 첫 칩이던 때라 360 에서 `scrollLeft` 0 이면 선택 칩 `전체` 가 다 들어가지 않았다). 서버 HTML 과 하이드레이션 첫 렌더가 같아 768~1279 첫 로드 뒤 배치가 바뀌지 않는다. 모든 폭에서 DOM 순서(= Tab 순서)가 화면의 읽는 순서(위→아래, 왼→오른)와 같다. CSS `order`·`*-reverse`·grid 영역 재배치로 화면 순서를 DOM 과 다르게 만들지 않는다 (14.2). (보정 9, R42) `FeedToolbar` 는 검색 영역과 필터 영역 두 형제를 같은 트리로 그리고, 정렬은 `FeedToolbar` 밖 목록 머리줄(`FeedStatusBar`)로 옮긴다. 컨트롤 DOM 순서는 `검색 → 카테고리 → 소스 → Must-Read`, 그 뒤 목록 머리줄의 `상태 → 정렬` 이다 (14.17) | (리뷰 Nit 1) `feed/FeedToolbar.test.tsx`(폭 목을 360→1024→1440 으로 바꿔 다시 그려도 검색 입력과 각 칩 줄이 같은 노드이고 검색 포커스·값 유지, 컨트롤 DOM 순서 `카테고리 → 검색 → 소스 → Must-Read → 정렬`(보정 5, R34). 보정 9 부터 `검색 → 카테고리 → 소스 → Must-Read`, 정렬 노드 유지는 `feed/FeedStatusBar.test.tsx`, 14.17 표), `ui/ChipGroup.test.tsx`(줄 폭이 바뀌면 사용자가 스크롤하지 않은 줄은 선택 칩을 다시 보이게 하고, 입력 신호 뒤 스크롤한 줄은 `scrollLeft` 유지, 입력 없이 `scrollLeft` 가 바뀐 줄은 다시 보이기를 계속함, 보정 6: 세로 휠(`deltaY` 만) 뒤 `scrollLeft` 가 바뀐 줄도 다시 보이기를 계속함 — 14.14), Chrome 실측(검색에 포커스·값을 둔 채 1440→1024→360→1440: input 노드·포커스·값, 칩 줄 노드 유지. `scrollLeft` 는 단언하지 않는다. 보정 5: 입력 없이 폭만 바꿀 때 선택 칩이 흐림 밖에 보이고, 줄을 손가락·가로 휠로 민 뒤 폭을 바꾸면 민 위치가 남음. 보정 6: 1024 에서 툴바 위에 포인터를 두고 페이지를 세로 휠로 내린 직후 폭을 바꿔도 선택 칩이 다시 보임), `rg "useMediaQuery\|\border-\|-reverse" frontend/src/components/feed/FeedToolbar.tsx` 0줄 |
| R34 | (보정 5, 제품 오너 결정 2026-11-07) 피드 툴바의 `Must-Read` 는 소스 스크롤 줄 밖, 줄 B 에서 소스 줄과 정렬 선택창 사이의 늘 보이는 토글이다. (보정 9, R42) 정렬이 목록 머리줄로 옮겨져 토글은 필터 영역 소스 줄의 오른쪽 끝(줄의 마지막 요소, 오른쪽 끝이 콘텐츠 오른쪽 끝 ±1px)에 온다. 아래 'DOM 순서 `소스 줄 → Must-Read → 정렬`' 은 `소스 줄 → Must-Read` 로 읽는다 (정렬은 목록 머리줄). `button aria-pressed`, 접근 이름 `Must-Read`(모든 폭에서 같음), `title` 은 지금 문구. 768 미만에서는 별 아이콘만 보이고(글자는 `sr-only`) 터치 영역 44×44px, 768 이상에서는 별 + `Must-Read` 글자. 모든 폭의 첫 화면(스크롤 0, 사용자 조작 전)에서 토글 전체가 화면과 툴바 안에 보인다. 소스 줄에는 소스 칩(`전체`·소스·`북마크`)만 있고 구분선이 없다. DOM 순서(= Tab 순서)는 `소스 줄 → Must-Read → 정렬` 이고 화면 순서와 같다 (14.2) | (보정 5) ui-audit `scrollRow` 의 툴바 증거 `mustReadVisible: true` 5개 폭 × 2테마 `/` 처음 상태 모두 (14.8), `clip`·`occluded` 실패 0, R6 터치 영역(360·390 `Must-Read` ≥ 44×44), `feed/FeedToolbar.test.tsx`(14.14 표의 바뀐 단언과 새 단언) |
| R35 | (보정 7, F1. 보정 9 로 바뀜) 768 미만에서 피드 필터 영역의 소스 줄은 소스 칩 2개 이상을 흐림 밖에 다 보인다. 소스 줄은 왼쪽 화면 끝까지 닿고(`bleed="start"`) 같은 줄 오른쪽 끝에는 `Must-Read` 토글(R34 모양 그대로: 별만, 44×44)만 둔다. 정렬은 목록 머리줄로 옮겨져(R42) 소스 줄과 폭을 나누지 않는다. 보정 7 의 '소스 줄이 한 줄을 다 쓰고 토글·정렬은 아래 줄 오른쪽'(41단계 줄 B 줄바꿈: `max-md:flex-wrap`·`max-md:basis-full`·`max-md:ml-auto`, `bleed` 양쪽)은 되돌린다. 배치는 CSS 로만 바꾼다: 같은 DOM 트리(R33), DOM·Tab 순서가 화면 읽는 순서와 같고 `order`·`*-reverse` 를 쓰지 않는다. R34(첫 화면 토글 보임), R20(세로 간격), R5(첫 화면 카드 제목), R6(터치 영역)을 계속 지킨다 (14.17 G1. 보정 7 당시 설계는 14.15 F1) | ui-audit `toolbarLayout`(보정 9 판정, 14.17) 360·390 × 2테마 `/` 처음 상태 실패 0: 소스 줄 보이는 폭 ≥ `innerWidth − 16 − 8 − 44 − 16 − 1`(360: 275, 390: 305), 흐림 밖에 다 보이는 소스 칩 ≥ 2, 토글이 소스 줄과 같은 줄(토글 세로 가운데가 소스 줄 top~bottom 안)이고 토글 오른쪽 끝이 콘텐츠 오른쪽 끝 ±1px, `[data-feed-toolbar]` 안에 `select`·검색 입력 없음. 고치기 전 코드(보정 8 까지)에서 실패 (14.17 회귀 증명). `scrollRow.toolbar.mustReadVisible: true`, `vRhythm`·R5·R6 통과, `feed/FeedToolbar.test.tsx`(14.17 표) |
| R36 | (보정 7, F3) 뉴스 카드 바닥 통계의 원천 점수(`raw_score`)는 원천이 실제 지표를 주는 소스에서만 보인다: `github`(스타), `hackernews`(포인트), `reddit`(추천). 그 밖 소스(`rss_kr`·`rss` 고정 180·150, `arxiv` 고정 120, `huggingface` 댓글 수 + 40, 모르는 소스)는 `raw_score` 가 0 보다 커도 그리지 않는다. 지표 종류는 아이콘과 접근 이름으로 구분한다: 스타 `Star`·`스타`, 포인트·추천 `ArrowBigUp`·`포인트`/`추천`. 개수 통계(`comments_count`)도 종류를 따른다: `github` 는 포크 수라 `GitFork`·`포크`, 그 밖은 `MessageSquare`·`댓글`. 지표 표와 라벨은 `lib/labels.ts` 한 곳에서 나온다. 기사 상세는 지금도 점수를 그리지 않으며 그대로 둔다. 인기 점수(`hotness_score`) 표시 규칙과 backend 점수 계산은 바꾸지 않는다 (우려 28) | ui-audit `cardMetric` 5개 폭 × 2테마 `/` 실패 0, 고치기 전 코드에서 실패 (14.15 회귀 증명), `--self-test` fixture, `NewsCard.test.tsx`·`ui/FormControls.test.tsx`(labels) 새 단언 |
| R37 | (보정 7, C1) `/chat` 맥락 줄의 검색 스코프 두 탭은 360 을 포함한 5개 폭에서 잘리지 않고 다 보인다. 기사 칩이 없으면 맥락 줄이 넘치지 않는다(`data-overflow="none"`). 기사 칩이 있어 줄이 넘쳐도 처음 상태에서 두 탭은 줄 보이는 상자(넘친 쪽 흐림 24px 제외)와 화면 안에 다 있다 | ui-audit `chatScope` `/chat` 3상태(기본·기사 칩·경고 알림) × 5폭 × 2테마 실패 0, 고치기 전 360 에서 실패 |
| R38 | (보정 7, C2) 챗 화면의 검색 범위 용어는 한국어 하나로 쓴다: `scoped` = `단일 기사`, `global` = `전체 소식`. 모드 탭, 대화 목록 배지, 대화 항목 접근 이름(`단일 기사 모드`/`전체 소식 모드`), 없는 기사 알림(`요청하신 기사를 찾을 수 없어 전체 소식 모드로 시작합니다.`), 빈 화면 안내(`수집된 소식 기반의`)가 같은 말을 쓴다. 포커스 캡슐 앞말은 `포커스:` 이고 기본값 `전체 소식` 은 피드 `전체 소식` 칩·포커스 시트 `전체 소식` 칩과 같은 말이다. 모드 탭·배지·캡슐·빈 화면 안내에 `Scoped`·`Global`·`Focus:`·`코퍼스` 가 나오지 않는다. 라벨은 `lib/labels.ts` 의 `ALL_CATEGORY_LABEL`·`SCOPE_LABELS` 에서 나온다 | ui-audit `terms` `/chat` 모든 측정 상태 실패 0, 고치기 전 실패, `--self-test` fixture, 단위 테스트(14.15 표), `rg "\(Scoped\)\|\(Global\)\|>Scoped<\|>Global<\|Focus:\|코퍼스" frontend/src/components/chat` 0줄 (주석 제외) |
| R39 | (보정 7, C3) 챗 모델 선택은 모든 폭에서 입력창 아래 한 곳에만 있다. 챗 헤더는 모델 선택을 그리지 않는다 (`ChatHeader` 의 `selectedTier`·`onSelectTier` prop 을 지운다). 선택 동작·팝오버(위로 열림)·스트리밍 중 비활성·`ModelChangeDivider` 는 그대로다 | ui-audit `modelPicker` `/chat` 기본 × 5폭 × 2테마 실패 0 (보이는 `Claude 모델 선택` 버튼 정확히 1개, 질문 입력창 아래), 고치기 전 768 이상에서 실패, 단위 테스트(14.15 표) |
| R40 | (보정 7, C4) 챗 포커스 필터 창의 `도메인 카테고리` 칩 라벨은 `lib/labels.ts` 에서 나온다: `전체 소식` + 긴 라벨 4개(`하네스 & 벤치마크`, `MCP & 생태계`, `에이전트 아키텍처`, `최신 AI 동향`). 피드 `카테고리` 칩과 같은 말·같은 순서다. R19 의 '포커스 시트 제외' 를 없앤다 (우려 18 닫음) | ui-audit 새 측정 상태 '챗 포커스 필터 열림' 의 `focusLabels` 5폭 × 2테마 실패 0, 고치기 전 실패, `chat/FocusBottomSheet.test.tsx`, `rg "'하네스·평가'\|'MCP·도구'\|'에이전트 기술'\|'AI 뉴스'" frontend/src/components` 0줄 (보정 7 정정: 따옴표 포함 형태로 좁혀 `SessionEmptyState.tsx:48` 의 문장 '에이전트 기술과 뉴스를 탐색해보세요' 를 잡지 않는다) |
| R41 | (보정 8) 뉴스 카드 바닥의 인기 점수(`hotness_score`, `Flame`·`인기 점수`)는 R36 지표 표에서 점수 지표가 있는 소스(`github`·`hackernews`·`reddit`, `scoreMetric(source) !== null`)에서만 보인다. 그 밖 소스(`rss_kr`·`rss`·`arxiv`·`huggingface`·모르는 소스)는 `hotness_score > 25` 여도 그리지 않는다. 지표 소스의 표시 규칙(`> 25`, 반올림, `sr-only` `인기 점수`)은 그대로다. 기사 상세는 지금도 인기 점수를 그리지 않으며 그대로 둔다. `인기순` 정렬과 backend 계산은 바꾸지 않는다 (우려 28) | ui-audit `cardMetric` ⑤(지표 없는 소스 카드에 인기 점수 표시 → 실패) 5개 폭 × 2테마 `/` 실패 0, 고치기 전 코드(보정 7 까지)에서 실패 (14.16 회귀 증명), `--self-test` fixture, `NewsCard.test.tsx`(14.16 표) |
| R42 | (보정 9, 사용자 결정 2026-11-07) 피드 `/` 의 검색·필터·정렬을 모든 폭에서 세 영역으로 나눈다. ① 검색 영역(`[data-feed-search]`): 요약 바 아래, 필터 영역 위에 검색 입력만 있는 한 줄이다. 너비는 콘텐츠 폭 전체(입력의 왼쪽·오른쪽 끝 = 콘텐츠 상자 끝 ±1px), 높이는 입력 토큰(768 미만 44px, 이상 36px), 모서리·테두리는 입력 토큰(`rounded-lg`, `border-border-strong`, hover·포커스 표시) 그대로다. 칩 줄과 같은 줄에 있거나 겹치지 않는다. 768 이상에서도 sticky 가 아니다. ② 필터 영역(`[data-feed-toolbar]`): 카테고리 칩 줄, 그 아래 소스 칩 줄 + 그 줄 오른쪽 끝 `Must-Read` 토글(R34·R35)만 있다. 검색 입력과 정렬이 없다. 768 이상 sticky 는 그대로다. ③ 목록 머리줄(`[data-feed-list-header]`): 왼쪽에 상태(`총 N건`·`(전체 M건)`·배지, 오른쪽 끝에 `페이지 p / T`, 지금의 `role="status"` 영역 그대로), 그 오른쪽에 정렬 선택창(`Select label="정렬"`, 옵션·동작 그대로, 768 미만 44px·이상 36px). 정렬은 상태 live 영역 밖이고 오른쪽 끝이 콘텐츠 오른쪽 끝 ±1px 다. 360 처음 상태(필터 없음)에서 머리줄은 한 줄이다(머리줄 높이 = 정렬 높이 ±1px). DOM·Tab 순서 = 화면 순서 `검색 → 카테고리 → 소스 → Must-Read → 상태 → 정렬`. `/` 단축키는 검색 입력에 포커스하고 입력이 헤더에 가리지 않게 보이게 한다 (14.17 G1) | ui-audit `feedAreas` 5폭 × 2테마 `/` 처음 상태 실패 0, 고치기 전 코드에서 실패 (14.17 회귀 증명). `toolbarLayout`(보정 9)·`vRhythm`(세 간격)·`scrollRow.toolbar.mustReadVisible`·R5·R6·`placeholder` 통과, `--self-test` fixture, `feed/FeedToolbar.test.tsx`·새 `feed/FeedStatusBar.test.tsx`(14.17 표), Chrome 확인(1024·390 에서 아래로 스크롤한 뒤 `/` → 검색 입력 포커스, 입력 전체가 헤더 아래 화면 안) |
| R43 | (보정 9, H1) `/chat` 헤더 왼쪽 순서는 `피드로 돌아가기` 링크 → `대화 기록 보기` 버튼(있을 때) → 제목 `AI 챗` 이다. 뒤로 가기가 헤더의 맨 왼쪽 조작 요소다. DOM 순서도 같다 | ui-audit `chatHeader` `/chat` 기본 × 5폭 × 2테마 실패 0, 고치기 전 기록 버튼이 보이는 폭에서 실패, `chat/ChatHeader.test.tsx` 새 단언 |
| R44 | (보정 9, H2) 프론트가 정한 UI 글자(`frontend/src/components/**`, `frontend/src/app/**` 의 문자열·JSX 글자)에 그림 이모지를 쓰지 않는다. 그림 이모지 = 판정식 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/u` 에 걸리는 글자다: 기본이 이모지 표현인 글자(예: 💡🔄📊⚡🎯🧠🔒), 또는 뒤에 이모지 표현 선택자 U+FE0F 가 붙은 그림 문자(예: 🛠️⚖️⚠️). 텍스트 표현 기호(`©`·`®`·`↔`·`➔`·`✓` 등)는 그림 이모지가 아니어서 쓸 수 있다 (정정, 14.17 H2). 아이콘은 `lucide-react` 로 그린다 (챗 추천 질문, 모델 티어, Ask AI 빠른 질문, 브리핑 시사점·분야 머리글). backend 가 만든 문자열(챗 단계 라벨, 답변, 브리핑 마크다운 전문)과 `types/**`·`mocks/**` 는 범위 밖이다 (R32, 우려 39) | 정적 검사 `ui/IconGuard.test.ts`(대상 파일에서 위 판정식에 걸리는 글자 0개), ui-audit `pictograph` 실패 0 (14.17 표의 상태), 고치기 전 실패, `chat/ChatModelSelector.test.tsx`·`AskAiPanel.test.tsx`·`modals/NewsDetailModal.test.tsx`·`modals/DailyBriefingModal.test.tsx`(14.17 표) |
| R45 | (보정 9, H3) 기사 상세와 챗 이관 용어를 한국어로 맞춘다 (R38 의 용어 규칙을 넓힘): 상세 탭 `AI 요약 & 시사점`(그대로)·`AI 질의응답`(지금 `Ask AI 질의응답`). 카드와 상세의 챗 이관 버튼은 같은 말 `AI 챗에서 분석` 을 보이는 글자와 접근 이름 첫머리로 쓴다(헤더 내비 `AI 챗` 과 같은 목적지 이름). 상세 배너 보조 문구는 `이 기사를 단일 기사 모드로 열어 질의응답`. 화면에 `Ask AI`·`전용 챗`·`전용 AI 챗` 이 나오지 않는다 | ui-audit `terms`(보정 9: `/`·뉴스 상세 두 탭 상태로 넓힘) 실패 0, 고치기 전 실패, `modals/NewsDetailModal.test.tsx`·`NewsCard.test.tsx`·`chat/HandoverIntegration.test.tsx`(14.17 표) |
| R46 | (보정 9, H4) 일일 브리핑 대화상자: 연동 설정을 여는 상시 버튼은 하나(바닥의 `연동 설정`)다. 위 작업 줄의 톱니 버튼과 768 미만 `브리핑 작업` 메뉴의 `연동 설정` 항목을 지운다 (Notion·이메일 실패 알림 안의 `… 설정 열기` 는 실패 때만 보이는 맥락 버튼이라 둔다). 헤드라인은 대화상자 설명(제목 아래) 한 곳에만 보이고 `오늘의 핵심 요약` 칸에는 개요만 둔다. 헤드라인의 단어 중간 잘림(`…persistent p...`)은 backend 가 만든 문자열이라 범위 밖이다 (우려 39) | ui-audit `briefing` 일일 브리핑 상태 × 측정 폭 실패 0, 고치기 전 실패, `modals/DailyBriefingModal.test.tsx` 새 단언 |
| R47 | (보정 9, H5) 분야 이름은 `lib/labels.ts` 한 곳에서 나온다 (R19 를 브리핑으로 넓힘): 일일 브리핑의 분야 머리글과 `오늘의 핵심 요약` 개요의 분야 이름은 backend 의 `categories[].name` 대신 `categories[].id` 로 찾은 긴 라벨(`하네스 & 벤치마크`, `MCP & 생태계`, `에이전트 아키텍처`, `최신 AI 동향`)이고, 머리글 아이콘은 피드 카테고리 칩과 같은 lucide 아이콘이다. 표에 없는 id 는 backend 이름을 그대로 쓴다. 카드 머리줄의 짧은 라벨(`에이전트` 등)은 R19 그대로 두고 긴 라벨을 `title` 로 단다. 마크다운 전문 탭은 backend 문서를 그대로 보인다 (우려 39·40) | ui-audit `briefing` 의 분야 머리글 판정 실패 0, 고치기 전 실패, `modals/DailyBriefingModal.test.tsx`(MSW 브리핑의 `MCP & 플러그인 생태계` → `MCP & 생태계`), `NewsCard.test.tsx`(머리줄 `title`) |
| R48 | (보정 9, H6) 뉴스 카드 바닥 줄의 챗 이관 버튼은 모든 폭에서 글자(`AI 챗에서 분석`)를 보인다 (1024~1279 의 아이콘만 모드를 없앤다). 통계와 버튼 묶음(`AI 챗에서 분석`·`원문`)이 한 줄에 들어가지 않으면 버튼 묶음이 다음 줄 오른쪽 끝으로 내려간다. 버튼 묶음은 카드 안쪽 상자 안에 다 있고 통계와 겹치지 않는다. R17 카드 틀·`rowAlign` 을 계속 지킨다 | ui-audit `cardFooter` `/` 5폭 × 2테마 실패 0, 고치기 전 1024 에서 실패, `NewsCard.test.tsx`(14.17 표), `rowAlign`·`clip`·`occluded`·R5 통과 |

## 설계

### 0. 범위와 바뀌는 tech-spec 절
- 바뀌는 것: `frontend/src/app/**`, `components/**`, `context/**`, `hooks/**`, 새 `components/ui/**`, `lib/` 의 새 파일(`overlay-stack.ts`, `theme-store.ts`, `labels.ts`), lint 만 고치는 `lib/api.ts`·`types/chat.ts`·`mocks/**`, `tests/**`, 새 `frontend/scripts/ui-audit.mjs`.
- 계약 변경: 없다. 변경 전/후가 같다 (설계 12).
- `docs/tech-spec.md` 에서 구현 마지막에 `/implement-plan` 이 고칠 절:
  - '공통 규칙': "UI: 토큰·공통 부품·오버레이 규칙은 `design-system.md`" 한 줄 추가
  - '상세 문서': `design-system.md` 행 추가
  - '기술 선택과 근거': 4행 추가 (CSS 변수 토큰 + Tailwind `@theme inline`, 자체 공통 부품, 시스템 글꼴, 오버레이 스택) — 근거 절 E1~E6 참고
  - '변경 이력': `ui-redesign` 행
  - '시스템 구성', '앱 사이 인터페이스', '데이터': 바뀌지 않는다
- 2차 범위(R14~R32)와 그로 바뀌는 tech-spec 절은 14.0 에 따로 적는다.

### 1. 디자인 토큰

#### 1.1 방향
- 중립 회색(차가운 slate 계열) + 단일 강조색 파랑. GitHub 다크 hex 를 버린다. 범주별 무지개색(MCP 보라, 핸드오버 남색, 레이더 색 등)을 없애고, 의미 색은 성공·주의·위험 세 가지만 둔다.
- Must-Read·Hot 같은 강조는 `warning` 톤 하나로, Scoped·핸드오버·선택 상태는 `accent` 로, 보충 웹 출처 `[S1]` 은 `success` 로 구분한다.

#### 1.2 Tailwind 4 구조 (`frontend/src/app/globals.css`)
```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

:root {            /* 라이트 = 기본 */
  color-scheme: light;
  --al-canvas: #f8fafc;  /* … 아래 표의 라이트 값 전부 */
}
.dark {
  color-scheme: dark;
  --al-canvas: #0e1013;  /* … 아래 표의 다크 값 전부 */
}

@theme inline {    /* 유틸리티가 변수를 직접 참조 → 클래스 하나로 테마 전환 */
  --color-canvas: var(--al-canvas);
  /* … 아래 표의 모든 색 토큰, --shadow-card, --shadow-overlay */
}

@theme {           /* 테마와 무관한 값 */
  --font-sans: …; --font-mono: …;           /* 1.4 */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --animate-fade-in: fade-in 150ms cubic-bezier(0.2, 0, 0, 1) both;
  --animate-dialog-in: dialog-in 200ms cubic-bezier(0.2, 0, 0, 1) both;
  --animate-sheet-in: sheet-in 240ms cubic-bezier(0.2, 0, 0, 1) both;
  --animate-drawer-in: drawer-in 240ms cubic-bezier(0.2, 0, 0, 1) both;
  @keyframes fade-in   { from { opacity: 0 } to { opacity: 1 } }
  @keyframes dialog-in { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: none } }
  @keyframes sheet-in  { from { transform: translateY(100%) } to { transform: none } }
  @keyframes drawer-in { from { transform: translateX(-100%) } to { transform: none } }
}

@layer base {
  body { background: var(--al-canvas); color: var(--al-fg); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
  :focus-visible { outline: 2px solid var(--al-accent); outline-offset: 2px; }
  ::placeholder { color: var(--al-fg-subtle); opacity: 1; }
  * { scrollbar-width: thin; scrollbar-color: var(--al-border-strong) transparent; }
}
```
- `html:not(.dark) …`, `html.dark …` 덮어쓰기와 `!important` 를 모두 지운다. 기존 `--background`/`--foreground` 변수도 지운다 (쓰는 곳은 `body` 뿐).
- 기본 팔레트 네임스페이스(`--color-*: initial`)는 지우지 않는다. `bg-transparent`·`text-current` 가 남는지 확인하지 못했기 때문이다 (근거 E2). 대신 R1 정적 검사 테스트(설계 11.3)가 팔레트 색 클래스를 막는다.
- `dark:` 변형은 남겨 두지만 색에는 쓰지 않는다 (색은 토큰이 테마를 따른다). 색이 아닌 차이(예: 그림자 끄기)에만 쓴다.
- 애니메이션은 `motion-safe:animate-*` 로만 붙인다. `prefers-reduced-motion: reduce` 에서는 붙지 않는다. JS 부드러운 스크롤(`behavior: 'smooth'`)도 같은 조건에서 `'auto'` 로 바꾼다. 닫힘 애니메이션은 두지 않는다 (바로 언마운트). 정의 없는 `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-*`, `animate-fade-in` 클래스는 모두 지운다.

#### 1.3 색 토큰
대비는 WCAG 2.x 상대 휘도 공식으로 손으로 계산했다. 설계 11.3 의 대비 테스트가 같은 공식으로 다시 확인한다.

| 토큰 (유틸리티 예) | 용도 | 라이트 | 다크 | 대비 확인 (라이트 / 다크) |
|---|---|---|---|---|
| `canvas` (`bg-canvas`) | 페이지 배경 | `#f8fafc` | `#0e1013` | — |
| `surface` (`bg-surface`) | 카드·헤더·대화상자·메뉴 | `#ffffff` | `#16191d` | — |
| `surface-muted` | hover, 눌린 칩, 코드·인용 배경, 보조 영역 | `#f1f5f9` | `#1f2329` | — |
| `fg` (`text-fg`) | 본문·제목 | `#0f172a` | `#e8eaed` | surface 17.9 / 14.6, muted 16.3 / 13.1 |
| `fg-muted` | 보조 글자 (요약, 설명) | `#475569` | `#a9b0ba` | surface 7.6 / 8.1, muted 6.9 / 7.2 |
| `fg-subtle` | 메타(시간·건수), 자리표시 | `#5c6b80` | `#858d98` | surface 5.4 / 5.3, canvas 5.2 / 5.7, muted 5.0 / 4.7 |
| `border` | 구분선·카드 테두리 (장식) | `#e2e8f0` | `#2a2f36` | 장식용, 기준 없음 |
| `border-strong` | 입력창·스위치·체크 테두리 (UI 경계) | `#7b8798` | `#6b7480` | surface 3.6 / 3.7, canvas 3.5 / 4.0 (≥3) |
| `accent` | 링크·선택 표시·아이콘·포커스 링 | `#2563eb` | `#60a5fa` | surface 5.2 / 6.9, canvas 4.9 / 7.5, muted 4.7 / 6.2 |
| `accent-solid` | 주 버튼 배경 | `#2563eb` | `#2563eb` | `on-accent` 글자 5.2 / 5.2 |
| `accent-solid-hover` | 주 버튼 hover | `#1d4ed8` | `#1d4ed8` | `on-accent` 6.7 |
| `on-accent` | 주·위험 버튼 글자 | `#ffffff` | `#ffffff` | — |
| `accent-soft` | 선택된 칩·세션·사용자 말풍선 배경 | `#eff6ff` | `#15233f` | — |
| `accent-soft-fg` | `accent-soft` 위 글자 | `#1d4ed8` | `#60a5fa` | 6.2 / 6.2 |
| `success` | 성공·수집 완료·보충 출처 글자 | `#047857` | `#34d399` | surface 5.5 / 9.2 |
| `success-soft` | 성공 배경 | `#ecfdf5` | `#0f2a20` | `success` 글자 5.2 / 8.0 |
| `warning` | Must-Read·Hot·주의 글자 | `#b45309` | `#fbbf24` | surface 5.0 / 10.6, canvas 4.8 / 11.4 |
| `warning-soft` | 주의 배경 | `#fffbeb` | `#2d2410` | `warning` 글자 4.8 / 9.2 |
| `danger` | 오류·위험 글자 | `#b91c1c` | `#f87171` | surface 6.5 / 6.4, muted 5.9 / 5.7 |
| `danger-soft` | 오류 배경 | `#fef2f2` | `#2d1517` | `danger` 글자 5.9 / 6.2 |
| `danger-solid` | 위험 버튼 배경 | `#b91c1c` | `#b91c1c` | `on-accent` 6.5 |
| `danger-solid-hover` | 위험 버튼 hover | `#991b1b` | `#991b1b` | `on-accent` 8.3 |
| `scrim` | 모달 배경막 | `rgb(15 23 42 / 0.45)` | `rgb(0 0 0 / 0.6)` | — |

- 규칙: 본문 크기 글자는 4.5:1 이상인 조합만 쓴다 (위 표에 적힌 조합). `fg-subtle` 은 `surface-muted` 보다 어두운 배경에 쓰지 않는다. 비활성 요소는 `opacity-50` (대비 기준 예외, WCAG 1.4.3).
- 포커스 링은 `accent` (배경 대비 ≥3:1, WCAG 2.4.7·1.4.11). `NewsCard` 의 j/k 포커스 표시는 `ring-2 ring-accent ring-offset-2 ring-offset-canvas` 를 쓴다 (`ring-2` 단언 유지).
- 불투명도 수정자(`bg-accent/10`)는 Tailwind 4 의 `color-mix` 로 동작하므로 쓸 수 있지만, 글자 대비가 필요한 곳은 위 표의 단색 토큰을 쓴다.

#### 1.4 글꼴
- `next/font/google` 의 Geist·Geist Mono 를 지운다 (쓰지 않는데 빌드 때 Google 에서 받는다, ui-spec 알려진 위험 10). 시스템 글꼴만 쓴다.
- `--font-sans: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;`
- `--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;`
- 고정폭은 코드, `kbd`, 설정 JSON, URL 표시에만 쓴다. 라벨·배지·제목에 쓰지 않는다. 영문 대문자 제목(`uppercase tracking-*`)을 쓰지 않는다.

#### 1.5 글자 크기와 역할 (Tailwind 기본 스케일 그대로)
| 역할 | 클래스 | 크기/줄높이 | 굵기 |
|---|---|---|---|
| 페이지 제목 (h1) | `text-xl` (lg 이상 `text-2xl`) | 20/28 (24/32) | 600 |
| 대화상자 제목 | `text-lg` | 18/28 | 600 |
| 카드 제목, 절 제목 | `text-base` | 16/24 | 600 |
| 본문, 요약, 마크다운 | `text-sm` + `leading-relaxed` | 14/22.75 | 400 |
| UI 라벨·버튼 | `text-sm` (모바일 입력창은 `text-base`) | 14/20 | 500 |
| 메타·배지·캡션 | `text-xs` | 12/16 | 500 |
- 최소 12px. 임의 글자 크기(`text-[11px]` 등)를 쓰지 않는다. 예외: `ChatMessageItem` 인라인 코드의 `text-[12px]`(테스트 단언, `text-xs` 와 같은 값)는 그대로 둔다.
- 마크다운 본문은 모든 폭에서 14px 이다 (지금 모바일 12px).
- 한국어 제목·카드 제목은 `break-keep [overflow-wrap:anywhere]` 로 어절 단위로 줄을 바꾸되 긴 토큰은 끊는다. 마크다운 영역의 기존 줄바꿈 클래스(`break-words [overflow-wrap:anywhere] [word-break:break-word]`)는 그대로 둔다.

#### 1.6 간격·크기·반경·그림자
- 간격: 4px 격자. 쓰는 단계 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16 (Tailwind 단위).
- 페이지 좌우 여백: 모바일 16px(`px-4`), 태블릿 24px(`md:px-6`), 데스크톱 32px(`lg:px-8`). 피드 최대 너비 `max-w-7xl`(1280px). 챗 메시지 열 최대 너비 `max-w-3xl`(768px).
- 카드 안쪽 여백 16px, md 이상 20px. 쌓임 간격 8/12/16/24.
- 조작 요소 높이: 모바일(`<md`) 44px(`h-11`), md 이상 36px(`md:h-9`). 아이콘 버튼 `size-11 md:size-9`. 작은 버튼 `sm`(32px)은 md 이상 밀집 영역에서만.
- 반경: 조작 요소 `rounded-lg`(8px), 칩·배지 `rounded-full`, 카드 `rounded-xl`(12px), 대화상자 `rounded-2xl`(16px, 모바일 전체 화면은 0, 바텀시트는 위 모서리만).
- 그림자: `shadow-card` (라이트 `0 1px 2px rgb(15 23 42 / 0.06)`, 다크 `none` — 테두리로 구분), `shadow-overlay` (라이트 `0 12px 32px rgb(15 23 42 / 0.16)`, 다크 `0 12px 32px rgb(0 0 0 / 0.5)`). 다른 `shadow-*` 는 쓰지 않는다.

#### 1.7 z-index
| 레이어 | 값 | 대상 |
|---|---|---|
| 내용 | 0 | — |
| 고정 툴바 | `z-10` | 피드 필터 툴바(md 이상 sticky) |
| 챗 사이드바 | `z-20` | 데스크톱 대화 기록 |
| 헤더 | `z-30` | `/` 헤더, `/chat` 헤더 |
| 메뉴·팝오버 | `z-40` | 더보기 메뉴, 테마 메뉴, 모델 선택, 인용 팝오버, 삭제 확인 팝오버 |
| 대화상자 | `z-50` | 배경막 + 대화상자·시트·드로어. 겹친 대화상자는 포털에 나중에 붙은 것이 위 |
| 토스트 | `z-60` | 알림 영역 |
- 대화상자 안의 팝오버는 대화상자 쌓임 맥락 안에서 그린다.

#### 1.8 모션
- 시간: 빠름 120~150ms(hover, 페이드), 보통 200ms(대화상자), 240ms(시트·드로어). 곡선 `ease-standard`.
- 반복 애니메이션은 진행 표시(`animate-spin`, `animate-pulse` 스켈레톤)에만 쓴다.

#### 1.9 브레이크포인트
- Tailwind 기본값을 쓴다: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- 장치 구분: 모바일 `<768` (`max-md:` 또는 기본), 태블릿 `768~1023` (`md:` ~ `max-lg:`), 데스크톱 `≥1024` (`lg:`).
- 정의되지 않은 `xs:` 를 지운다. JS 너비 판정(`window.innerWidth >= 1024`)은 `useMediaQuery('(min-width: 1024px)')` 로 바꾼다.
- "주요 조작 요소"(R6): 헤더·메뉴 항목, 칩, 탭, 정렬·검색 입력, 카드의 북마크·챗 분석·원문, 페이지 이동, 대화상자 닫기·바닥 버튼, 스위치, 챗 입력·전송·중단, 세션 카드·삭제, 모델 칩, 인용 배지, 내보내기 버튼. 마크다운 본문 안 링크(문장 속 링크)는 제외한다 (WCAG 2.5.8 인라인 예외).

### 2. 공통 부품 (`frontend/src/components/ui/`)
모든 부품은 토큰 유틸리티만 쓴다. `className` 을 받아 덧붙일 수 있지만 색 클래스를 덮어쓰는 데 쓰지 않는다.

| 부품 | API (요지) | 접근성·동작 규칙 |
|---|---|---|
| `Button` | `variant: 'primary'\|'secondary'\|'ghost'\|'danger'`, `size: 'sm'\|'md'\|'lg'`, `loading?`, `leadingIcon?`, 나머지 `button` 속성. `buttonClasses(variant, size)` 를 함께 내보내 `<Link>`·`<a>` 에 쓴다 | `type="button"` 기본. `loading` 이면 `disabled` + `aria-busy="true"`, 아이콘 자리에 스피너. 글자 있는 버튼만 (아이콘만이면 `IconButton`) |
| `IconButton` | `label: string`(필수), `icon`, `variant`, `size`, `pressed?` | `aria-label={label}`, `title={label}`. `pressed` 가 있으면 `aria-pressed` |
| `TextField` | `label`, `hideLabel?`, `description?`, `error?`, `leadingIcon?`, `input` 속성 | `<label htmlFor>` 연결 (`hideLabel` 이면 `sr-only`), `aria-describedby`, `error` 면 `aria-invalid` + `danger` 문구. 글자 `text-base md:text-sm` (iOS 자동 확대 방지) |
| `SearchField` | `TextField` + `onSubmit`, `onClear` | `<form role="search">`, `type="search"`, 지우기 `IconButton label="검색어 지우기"` |
| `Textarea` | `label`, 자동 높이 `maxHeight` | `TextField` 와 같은 라벨 규칙 |
| `Select` | `label`, `hideLabel?`, `options: {value,label}[]` | 네이티브 `<select>`. 높이 규칙 1.6 |
| `Switch` | `checked`, `onChange`, `label` | `button role="switch" aria-checked`, 라벨은 보이는 글자 또는 `aria-label` |
| `Badge` | `tone: 'neutral'\|'accent'\|'success'\|'warning'\|'danger'`, `icon?` | 상호작용 없음. `text-xs`, 높이 20~24px |
| `Chip` / `ChipGroup` | `Chip`: `selected`, `count?`, `onClick`. `ChipGroup`: `label`, `scrollable?` | `button aria-pressed`. 그룹은 `role="group" aria-label`. `scrollable` 이면 한 줄 가로 스크롤(`overflow-x-auto overscroll-x-contain snap-x`), 줄바꿈 없음, 양 끝 흐림 마스크. 높이 `h-11 md:h-8` |
| `SegmentedControl` | `label`, `options`, `value`, `onChange` | `role="group"` + 버튼 `aria-pressed` (챗 스코프 토글의 기존 구조 유지) |
| `Tabs` | `label`, `tabs: {id,label,badge?}[]`, `value`, `onChange`, 패널은 `TabPanel id` | WAI-ARIA 탭: `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`/`aria-labelledby`, 로빙 `tabIndex`, ←/→ 순환·Home·End, 자동 활성화. 탭 목록이 넘치면 가로 스크롤 |
| `Card` | `as?: 'article'\|'section'\|'div'`, `interactive?`, `padding?` | `interactive` 면 hover 테두리 `border-strong`, `focus-within` 링 |
| `Dialog` | `open`, `onClose`, `title`, `description?`, `size: 'sm'\|'md'\|'lg'\|'xl'`, `mobile: 'fullscreen'\|'sheet'`(기본 `fullscreen`, `sm` 은 `sheet`), `placement?: 'center'\|'top'`, `initialFocusRef?`, `dismissOnScrim?`(기본 true), `busy?`, `footer?`, `headerActions?`, `children` | 아래 2.1 |
| `Drawer` | `Dialog` 와 같은 API + `side: 'left'` | 2.1 규칙 + 너비 `min(320px, 85vw)` |
| `ConfirmDialog` | `open`, `title`, `description`, `confirmLabel`, `cancelLabel='취소'`, `tone: 'danger'\|'default'`, `busy?`, `error?`, `onConfirm`, `onCancel` | `role="alertdialog"`, 처음 포커스는 취소 버튼, `busy` 동안 두 버튼 비활성·Escape/배경막 무시, `error` 는 대화상자 안 `InlineAlert` |
| `Menu` (`MenuButton`) | `label`, `icon?`, `items: MenuItem[]`, `align?: 'end'` — `MenuItem = {type:'item', label, icon?, onSelect, tone?:'danger', href?, external?, disabled?} \| {type:'radio', label, checked, onSelect} \| {type:'separator'} \| {type:'group', label}` | WAI-ARIA 메뉴 버튼: `aria-haspopup="menu" aria-expanded aria-controls`, `role="menu"`, 항목 `menuitem`/`menuitemradio`(`aria-checked`). 열면 첫 항목에 포커스, ↑↓ 순환, Home·End, Enter·Space 실행, Escape 닫고 트리거로 포커스, Tab 은 닫기, 바깥 pointerdown 닫기. 항목 높이 `h-11 md:h-9`. 너비 `min(280px, 100vw - 32px)`, 넘치면 세로 스크롤. 오버레이 스택에 `popover` 로 올린다 |
| `Popover` | `open`, `onClose`, `anchorRef`, `label`, `role?: 'dialog'\|'radiogroup'`, `focusOnOpen?` | 비모달. 오버레이 스택에 `popover` 로 올린다 (Escape 맨 위만). 바깥 pointerdown 닫기. 닫으면 트리거로 포커스 |
| `Toast` (`ToastRegion`, `useToast`) | `show({message, tone, duration=3500})` | `role="status" aria-live="polite"`(오류는 `role="alert"`). 위치: 모바일 아래(챗은 입력창 위), md 이상 오른쪽 위. `z-60`. 닫기 버튼 `label="알림 닫기"` |
| `InlineAlert` | `tone`, `title?`, `children`, `action?` | 대화상자·영역 안 결과·오류 표시. 오류는 `role="alert"` |
| `Spinner` | `label?` | 시각 요소 `aria-hidden`, `label` 이 있으면 `sr-only` 글자 |
| `Skeleton` | `className` | `animate-pulse bg-surface-muted`, `aria-hidden` |
| `EmptyState` / `ErrorState` | `icon?`, `title`, `description?`, `action?` / `title`, `message`, `onRetry` | `ErrorState` 는 `role="alert"`, 재시도 `Button` |
| `Kbd` | `children` | `<kbd>`, 640px 미만 숨김 |
| `ThemeMenu` | 없음 (`useTheme`) | `MenuButton label="테마 선택"` + `menuitemradio` 3개(라이트·다크·시스템). `ThemeToggle` 의 `showDropdown` prop 이 이것을 그린다 (선언만 있던 prop 구현) |

함께 두는 훅·모듈:
- `lib/overlay-stack.ts`: 레이어 스택 (2.1).
- `hooks/useMediaQuery.ts`: `useSyncExternalStore` 로 `matchMedia` 구독, 서버 스냅샷 `false`.
- `hooks/useFocusTrap.ts`, `hooks/useScrollLock.ts`(참조 수 세기).
- `hooks/useCopyToClipboard.ts`: `navigator.clipboard.writeText`, 없거나 실패하면 숨긴 `textarea` + `document.execCommand('copy')` 로 한 번 더, 그래도 실패하면 상태 `failed` → 버튼 문구 `복사 실패` 2초 (UI-13 알려진 위험 16 해결). 성공 문구 `복사됨` 2초.
- `lib/labels.ts`: 카테고리·소스 표시 라벨 한 곳 (카드·상세 모달·필터가 같은 라벨을 쓴다. 상세 모달의 원값 표시 불일치 해결).

#### 2.1 대화상자·오버레이 공통 규칙
1. 포털: `createPortal(…, document.body)`. 루트 레이아웃은 앱 내용을 `<div id="app-shell">` 로 감싼다.
2. 스택: 열릴 때 `overlayStack.push({ id, kind: 'modal'|'popover', onEscape })`, 닫힐 때 뺀다. `window` 에 keydown 리스너 하나만 단다 (스택이 비어 있지 않을 때). Escape(IME 조합 중 제외)는 맨 위 레이어의 `onEscape` 만 부르고 `preventDefault`. 컴포넌트별 Escape 리스너(`NewsDetailModal`, `CommandPalette`, `ChatHistoryDrawer`, `FocusBottomSheet`, `ChatModelSelector`, `CitationPopover`, `DeleteConfirmPopover`)를 지운다. 드로어 안 삭제 확인 팝오버를 Escape 로 닫아도 드로어는 남는다 (07 알려진 위험 8 해결).
3. `useOverlayOpen()`: 스택에 레이어가 하나라도 있으면 true (`useSyncExternalStore`). 단축키 차단에 쓴다 (설계 7).
4. 모달 속성: `role="dialog"`(확인 창 `alertdialog`), `aria-modal="true"`, `aria-labelledby`→제목 `h2`, `description` 이 있으면 `aria-describedby`.
5. 포커스: 열 때 `document.activeElement` 를 저장하고 `initialFocusRef` → 없으면 본문의 첫 포커스 가능 요소 → 없으면 대화상자 컨테이너(`tabIndex={-1}`)에 포커스. Tab/Shift+Tab 은 대화상자 안에서 순환. 닫을 때 저장한 요소가 문서에 있으면 그곳으로 되돌린다.
6. 배경: 모달이 하나라도 열리면 `#app-shell` 에 `inert`, 스택에서 맨 위가 아닌 모달에도 `inert`. `body` 스크롤 잠금 (참조 수, 모든 모달·드로어 공통. 지금은 드로어만).
7. 닫기 수단 (통일):
   | 종류 | Escape | 배경막 클릭 | 닫기 버튼 |
   |---|---|---|---|
   | 읽기 위주 (뉴스 상세, 일일 브리핑, 스케줄, MCP, 커맨드 팔레트, 대화 기록 드로어, 포커스 필터) | 닫힘 | 닫힘 | 머리줄 X (`label="닫기"`, 드로어는 `대화 기록 드로어 닫기`) |
   | 입력 폼 (공유 & 알림 설정, 소스 & 리서처) | 닫힘 | 안 닫힘 (`dismissOnScrim={false}`) | 머리줄 X, 바닥 `닫기` |
   | 확인 창 (`ConfirmDialog`) | 닫힘 (`busy` 면 무시) | 닫힘 (`busy` 면 무시) | `취소` |
   | 팝오버·메뉴 | 닫힘 | 바깥 pointerdown | 있는 것만 |
8. 배치:
   | 폭 | `mobile='fullscreen'` | `mobile='sheet'` | `placement='top'` (팔레트) |
   |---|---|---|---|
   | `<768` | 화면 전체(`inset-0`, 높이 `100dvh`), 머리줄 56px 고정(제목 + 닫기), 본문 스크롤, 바닥 고정 + `pb-[max(0.75rem,env(safe-area-inset-bottom))]` | 아래 바텀시트, 위 모서리 둥금, 끌기 손잡이, 최대 높이 `90dvh` | 전체 화면, 검색창 맨 위 |
   | `≥768` | 가운데, 너비 sm 420 / md 560 / lg 720 / xl 896px (`max-w-[calc(100vw-3rem)]`), 최대 높이 `85dvh`, 머리줄·바닥 고정, 본문 스크롤 | 가운데 (`sm` 크기) | 위에서 `12dvh`, 너비 560px |
9. 애니메이션: 배경막 `motion-safe:animate-fade-in`, 대화상자 `animate-dialog-in`, 바텀시트 `animate-sheet-in`, 드로어 `animate-drawer-in`.
10. 바텀시트의 아래로 100px 스와이프 닫기(`FocusBottomSheet` 의 기존 규칙)는 `mobile='sheet'` 공통 동작으로 옮긴다.
11. 브라우저 기본 대화상자(`window.confirm`, `alert`)를 쓰지 않는다: 소스 삭제·Ask AI 대화 초기화는 `ConfirmDialog`, 초기화 실패는 확인 창 안 `InlineAlert`.

### 3. 헤더 (`/`, `Header`)
- `<header>` 는 `sticky top-0 z-30 h-14`(56px), `bg-surface/95 backdrop-blur border-b border-border`, 한 줄(`flex items-center`, 줄바꿈 없음). 맨 앞에 건너뛰기 링크 `본문으로 건너뛰기`(`sr-only focus:not-sr-only` → `#main`).
- 버전 배지는 `package.json` 의 `version` 을 `v0.3.1` 처럼 그린다 (고정 문자열 `v0.1.0` 제거). 버전 문자열만 클라이언트로 넘긴다:
  - `frontend/next.config.ts` 가 빌드 때 `package.json` 을 읽어 `env: { NEXT_PUBLIC_APP_VERSION: pkg.version }` 으로 넘긴다 (설정 파일은 서버에서만 실행되므로 `package.json` 전체가 번들에 들어가지 않는다).
  - `Header` 는 `process.env.NEXT_PUBLIC_APP_VERSION` 만 읽는다. 컴포넌트·`src/**` 에서 `package.json` 을 import 하지 않는다 (지금 `Header.tsx:19` 의 `import pkg from '../../package.json'` 은 devDependencies 까지 클라이언트 번들에 넣는다).
  - 값이 없거나 빈 문자열이면(vitest 등 Next 빌드를 거치지 않는 환경) 배지를 그리지 않는다. 다른 값으로 대신 표시하지 않는다.
  - 테스트: `Header.test.tsx` 가 테스트 안에서만 `package.json` 을 읽어 `vi.stubEnv('NEXT_PUBLIC_APP_VERSION', version)` 으로 넣고 배지 글자가 `v{version}` 인지 본다. 값을 비운 경우 배지가 없는지도 본다.

| 요소 | 데스크톱 ≥1024 | 태블릿 768~1023 | 모바일 <768 | 동작 |
|---|---|---|---|---|
| 브랜드 | 아이콘 + `AgentLens` + `v0.3.1` 배지 | 아이콘 + `AgentLens` | 아이콘 + `AgentLens` | `/` 링크 |
| 주 내비 (`<nav aria-label="주 메뉴">`) | `피드` · `AI 챗` 글자 링크, 현재 쪽 `aria-current="page"` | 같음 | `AI 챗` 아이콘 링크 (`aria-label="AI 챗"`) | `AI 챗` 링크 이름 유지 (`HandoverIntegration` 테스트) |
| 수집 상태 버튼 | `다음 수집 3h 12m 후` (수집 중: 스피너 + `수집 중`) | 시계 아이콘 + `3h 12m` (`aria-label="수집 스케줄 · 다음 수집 3h 12m 후"`) | 더보기 메뉴 `수집 스케줄 (다음 3h 12m 후)` | 스케줄 대화상자 |
| 즉시 수집 | `Button secondary` 아이콘 + `즉시 수집` | `IconButton label="즉시 수집"` | 더보기 메뉴 | 수동 수집 |
| 커맨드 팔레트 | `검색·명령` + `Kbd ⌘K` 버튼 | `IconButton label="커맨드 팔레트 열기"` | 같음 (44px) | 팔레트 |
| 테마 | `ThemeMenu` | `ThemeMenu` | 더보기 메뉴의 `테마` 라디오 3개 | 테마 선택 |
| 더보기 (`MenuButton label="더보기"`) | `소스 & 리서처`, `공유 & 알림`, `MCP 연동`, `RSS 피드`(새 탭), 구분선, `초기화 & 재수집…`(위험 톤) | 같음 | 위 항목 + `수집 스케줄`, `즉시 수집`, 테마 그룹 | — |
- 폭별 버튼 수: 데스크톱 브랜드 + 내비 2 + 오른쪽 5, 모바일 브랜드 + 오른쪽 3(AI 챗, 팔레트, 더보기). 360px 에서 브랜드 약 130px + 44×3 + 간격 = 약 290px < 328px.
- 하단 내비게이션은 두지 않는다 (목적지가 `/`, `/chat` 둘뿐이고 챗 입력창과 세로 공간을 다툰다).
- 파괴적 동작 `초기화 & 재수집` 은 헤더 주요 버튼에서 빼고 더보기 메뉴의 마지막(위험 톤, 구분선 뒤), 스케줄 대화상자의 '위험 영역', 커맨드 팔레트에 둔다. 모두 `ConfirmDialog` 를 거친다.
- 수집 진행 줄: `<header>` 밖, 헤더 바로 아래 한 줄(`h-9`, `bg-surface-muted`, `role="status" aria-live="polite"`). 메시지가 있을 때만 보이고 스크롤하면 함께 올라간다. 문구·폴링 규칙은 UI-02 그대로.
- 수집 로직은 `hooks/useCollector.ts` 로 뺀다 (스케줄 상태 30초 재조회, 1.2초 진행 폴링, 즉시 수집, 초기화). 언마운트 때 interval 을 정리하고, 요청 중 플래그(ref)로 두 번 요청을 막는다 (07 알려진 위험 12 해결). `Header` props(`onRefresh`, `onOpenSchedule`, `onOpenMcp`, `onOpenWebhook?`, `onOpenSources?`)는 그대로 둔다. 커맨드 팔레트와 초기화 확인 창은 지금처럼 `Header` 가 가진다.

### 4. 뉴스 피드 화면 (`/`)

#### 4.1 구성 (위에서 아래)
1. 헤더 (3절)
2. `<main id="main">` 안:
   - `h1` `AI 에이전트 소식` (`sr-only`. 화면 제목은 헤더 브랜드가 대신한다)
   - **요약 바 (`InsightsBar`)**: 지금의 일일 브리핑 배너 + 개요 카드 + Tech Radar 접힌 상태를 한 줄(48px, `Card`)로 합친다.
     - 왼쪽: 브리핑 버튼 `오늘의 브리핑 · {date} · {headline}` (한 줄 말줄임, 누르면 일일 브리핑 대화상자). 브리핑이 없으면 그리지 않는다.
     - 오른쪽: 트렌드 레이더 펼침 버튼(`aria-expanded`, `aria-controls`). md 이상은 `급상승` + 상위 3개 태그 칩(누르면 검색)을 함께 보이고, 모바일은 아이콘 + `트렌드` 글자만.
     - 펼치면 바로 아래에 레이더 패널(급상승 6, 카테고리 분포, 태그 클라우드, 선택 태그 초기화)을 그린다. 내용·동작은 NEWS-14 그대로.
     - 개요 카드는 지운다: 경로 표시 `agentlens / feed` 와 표시용 Must-Read 배지는 기능이 없고, 서비스 설명은 메타 설명에 있다. 전체 건수는 상태 줄로 옮긴다.
     - 레이더 로딩 중이면 48px 스켈레톤. 브리핑·레이더 둘 다 없으면 바 전체를 그리지 않는다.
   - **필터 툴바 (`FeedToolbar`)**: md 이상 `sticky top-14 z-10 bg-canvas/95 backdrop-blur`, 모바일은 고정하지 않는다.
     - 카테고리: `ChipGroup label="카테고리" scrollable` 의 `Chip` 5개 + 건수 (탭 모양 밑줄 대신 칩). 고르면 소스 `all`, 1페이지 (NEWS-02 규칙 유지).
     - 검색: `SearchField label="키워드 검색"`(`hideLabel`), 자리표시 지금 문구 유지. `/` 단축키로 포커스.
     - 소스·Must-Read: `ChipGroup label="소스" scrollable`. 첫 칩 `Must-Read`(별 아이콘, `aria-pressed`, `warning` 톤), 구분선, `전체`, 건수가 있는 소스, `북마크 n`.
     - 정렬: `Select label="정렬"` (`인기순`, `품질순`, `최신순`, `추천순`). 버튼 4개를 지운다 (390px 에서 `인기\n순` 깨짐 해결).
   - **상태 줄**: `총 {total}건` + 필터 표시 배지(`북마크 보기`, `Must-Read`) + 오른쪽 `페이지 p / T`. `role="status" aria-live="polite"`. `stats.total_news` 가 있고 필터가 걸려 있으면 `(전체 {total_news}건)` 를 덧붙인다.
   - **카드 그리드**: 1열(<768) / 2열(768~1023) / 3열(≥1024), 간격 16px(lg 20px).
   - **로딩**: 카드 스켈레톤 6개 (레이아웃이 흔들리지 않게). **오류**: `ErrorState` (문구·`다시 시도` 유지). **빈 상태**: `EmptyState` + `필터 전체 초기화`.
   - **페이지 이동**: `이전`·`다음` `Button secondary` + `p / T`. 모바일은 두 버튼이 반씩 차지(44px). 페이지를 바꾸면 그리드 위(상태 줄)로 스크롤하고 포커스를 상태 줄로 옮긴다.
3. 푸터: 한 줄 `text-xs text-fg-subtle`.

#### 4.2 폭별 툴바 배치와 첫 화면 예산
- 2차: 툴바 줄 구성은 14.2 표가 이 표를 대신한다 (그리드 열 공유 제거). 첫 화면 예산(R5)은 그대로다.
- (보정 9) 검색·필터·정렬 배치와 첫 화면 높이는 14.17 G1 이 이 표와 14.2 표를 대신한다 (검색 영역, 필터 영역, 목록 머리줄의 정렬).
| 폭 | 툴바 줄 | 첫 카드 위치(예상) |
|---|---|---|
| 1440×900 | 줄1: 카테고리 칩(왼쪽) + 검색(오른쪽 `w-80`) 48px / 줄2: 소스 칩(가로 스크롤) + 정렬(오른쪽) 44px | 헤더 56 + 여백 24 + 요약 바 48 + 16 + 툴바 100 + 상태 줄 32 + 12 ≈ y 290. 카드 높이 약 240~280px → 첫 줄 끝 ≈ 570 < 900 |
| 1024×768 | 1440 과 같음 (검색 `w-64`) | ≈ y 290, 첫 줄 끝 ≈ 570 < 768 |
| 768~1023 | 줄1: 카테고리 칩 / 줄2: 검색(`flex-1`) + 정렬 / 줄3: 소스 칩 (각 36~40px) | ≈ y 330 |
| 390×844, 360 | 줄1: 검색 44 / 줄2: 카테고리 칩 44 / 줄3: 소스 칩(`flex-1 min-w-0`) + 정렬 44, 줄 간격 8 | 헤더 56 + 12 + 요약 바 48 + 12 + 툴바 148 + 상태 줄 28 + 12 ≈ y 316. 카드 머리줄 24 + 8 → 첫 제목 ≈ y 364~412 < 844 |
- 수집 진행 줄(36px)이 떠 있어도 390×844 에서 첫 제목은 y ≈ 450 으로 화면 안이다.

#### 4.3 뉴스 카드 (`NewsCard`)
- 2차: 머리줄 배지·`Insight` 라벨·높이 규칙은 14.4 가 이 절을 대신한다.
- `Card as="article" interactive`, `data-feed-card`, 클릭하면 상세 (테스트 유지). 제목은 `h3` 안 `<button>` 으로 Tab·Enter·Space 로 열 수 있다 (07 UI-14 예외 해결).
- 머리줄: 카테고리 `Badge neutral`(`lib/labels.ts` 라벨) · 소스 · 상대 시간 (`text-xs text-fg-subtle`), `Must-Read` `Badge warning`, `Hot {n}` `Badge warning`(불꽃 아이콘). 오른쪽 북마크 `IconButton`(`title` `보관하기`/`보관됨` 유지, 선택 시 `text-warning` 채움).
- 본문: 제목 2줄, `Insight` 2줄(`text-fg-muted`, 왼쪽 `accent` 2px 선) 또는 요약 2줄, 기술 스택 칩 최대 4개(`Badge neutral`).
- 바닥: 별점·댓글 수(`text-fg-subtle`), 오른쪽 `챗에서 분석`(접근 이름 `전용 챗에서 분석`, 보이는 글자가 이름에 포함, WCAG 2.5.3) `Button ghost sm`, `원문` 링크. 모바일은 두 조작 모두 44px.
- 포커스 카드: `ring-2 ring-accent ring-offset-2 ring-offset-canvas` + `data-focused="true"`.

### 5. 모달별 바뀌는 점
공통: 모두 `Dialog`/`Drawer`/`ConfirmDialog` 로 바꾸고 2.1 규칙을 따른다. 영문 대문자 제목과 고정폭 라벨을 한국어 문장형 제목으로 바꾼다.

| 모달 | 크기·모바일 | 바뀌는 점 |
|---|---|---|
| 뉴스 상세 (`NewsDetailModal`) | `xl`, 전체 화면 | 제목 = 기사 제목(2줄, 지금 1줄 말줄임). 머리줄 배지는 `lib/labels.ts` 라벨. `Tabs` (`AI 요약 & 시사점` / `Ask AI 질의응답` + 대화 수 배지). 절 제목 `개발자 시사점`, `핵심 요약 3줄`(지금 `3-Bullet Executive TL;DR`), `기술 스택`, `상세 본문 요약`. 핸드오버 배너 이름 `전용 AI 챗으로 이동` 유지. Ask AI: 빠른 질문 칩 가로 스크롤, 입력창 바닥 고정(`text-base md:text-sm`), `대화 초기화` 는 `ConfirmDialog`. 바닥: 출처 라벨, 작성자, `원문 링크 방문` `Button primary`. Escape·배경막·X 로 닫고 닫을 때 스트림 중단·초기화 (기존 규칙) |
| 일일 브리핑 (`DailyBriefingModal`) | `xl`, 전체 화면 | 머리줄: 날짜 + 헤드라인. 도구줄: 주 버튼 `Notion 내보내기`/`Notion에서 열기`, `이메일 발송`(누르면 주소 입력 줄 펼침), `IconButton` 복사·`.md 다운로드`·연동 설정. 모바일은 주 버튼 + `MenuButton label="브리핑 작업"`(나머지). 결과는 `InlineAlert`. `Tabs` (`카테고리별 요약` / `마크다운 전문`). 바닥 `연동 설정 관리`, `닫기`. 연동 설정을 열면 위에 쌓이고 Escape 는 연동 설정만 닫는다 |
| 공유 & 알림 설정 (`BriefingSettingsModal`) | `md`, 전체 화면, `dismissOnScrim={false}` | `Tabs` (`Notion 연동` / `이메일 (SMTP)` / `웹훅 (Slack/Discord)`). 모든 입력은 `TextField`(보이는 라벨, 도움말 `description`, 오류 `error`). 비밀값 입력은 `type="password"` + 보기 토글 `IconButton`. `연결 테스트` `Button secondary`, `저장` `Button primary` 바닥 고정. 결과는 `InlineAlert` |
| 스케줄 (`ScheduleModal`) | `md`, 전체 화면 | 항상 어두운 `zinc` 색을 버리고 토큰으로 (07 알려진 위험 19 해결). 내용: 수집 주기, 다음 예정(분·시각). 바닥에 `즉시 수집` `Button secondary` 추가, '위험 영역' 절에 `초기화 & 재수집…` `Button danger` (→ `ConfirmDialog`). 수집 시각 고정 문구는 그대로 (범위 밖) |
| MCP (`McpModal`) | `lg`, 전체 화면 | 도구 4개는 정의 목록(`dl`). 설정 예시는 `CodeBlock`(언어 `json`, 복사 버튼, `useCopyToClipboard`). 고정 예시 문자열은 그대로 (범위 밖) |
| 소스 & 리서처 (`SourcesModal`, `DeepResearcherTab`, `SourcesListTab`) | `xl`, 전체 화면, `dismissOnScrim={false}` | `Tabs` (`AI 딥 리서처` / `등록된 수집원`, 기본 첫 탭 유지). 지표는 2열(모바일)·4열(md 이상) 카드. 수집원 목록: md 이상 표(이름·URL·카테고리·상태·작업), 모바일은 행을 세로 카드로. 켜기/끄기는 `Switch`(`aria-label="{이름} 수집 켜기"`), 삭제는 `IconButton label="{이름} 삭제"` → `ConfirmDialog` (`이 소스를 목록에서 삭제하시겠습니까?`). 새 피드 등록은 `TextField` 폼. 토스트는 대화상자 안 `aria-live` 영역 |
| 초기화 확인 창 | `ConfirmDialog tone="danger"`, `sm`, 모바일 바텀시트 | 제목 `수집 데이터 전체 삭제 및 재수집`, 경고 문구 유지, 버튼 `취소`(처음 포커스) / `전체 삭제 후 다시 수집`(`danger`). 진행 중 `초기화 중...` + `busy`. 실패는 `alert()` 대신 창 안 `InlineAlert` (문구 = 오류 메시지 또는 `초기화 실패`). 지금과 달리 Escape·배경막으로도 닫힌다 (`busy` 일 때 제외) |
| 커맨드 팔레트 (`CommandPalette`) | `md`, `placement="top"`, 모바일 전체 화면 | `role="dialog" aria-label="커맨드 팔레트"` 유지. 목록은 `role="listbox"` + 입력창 `aria-activedescendant`·`aria-controls`(`combobox` 패턴). 자체 window 리스너를 지우고 Escape 는 스택, ⌘K 는 설계 7. 닫을 때 검색어·선택을 초기화. 명령: 기존 5개를 같은 순서·문구로 두고(테스트), 넘겨받은 prop 이 있을 때만 `수집 스케줄 보기`, `공유 & 알림 설정 열기`, `RSS 피드 열기`, `수집 데이터 초기화 & 재수집`을 뒤에 붙인다. 새 명령 제목에 `모드로 전환` 을 쓰지 않는다 (테스트가 하나만 찾는다). `챗 이동` 옆 `C` 표시를 지운다 (실제 `c` 와 동작이 달라서, 07 알려진 위험 6). 선택 prop `commands?: PaletteCommand[]` 로 명령 목록을 통째로 바꿀 수 있다 (챗 화면) |
| 대화 기록 드로어 (`ChatHistoryDrawer`) | `Drawer side="left"` | `role="dialog" aria-modal aria-labelledby`(제목 `대화 기록`), `id="chat-history-drawer"`(헤더 `aria-controls` 대상, 07 알려진 위험 17 해결). 안의 `nav aria-label="대화 기록 목록"` 유지 |
| 포커스 필터 (`FocusBottomSheet`) | `Dialog size="sm" mobile="sheet"` | 이름 `수집 소식 타깃팅 포커스 필터` 유지. 전환 기준을 640px 에서 768px 로 맞춘다. 버튼·스위치 라벨 유지 |
| 모델 선택, 인용 출처, 세션 삭제 확인 | `Popover` | 스택 등록으로 Escape 맨 위만. 라벨·역할 유지 (`radiogroup` `Claude AI 모델 선택`, 인용 `dialog`, 삭제 확인 `dialog` `대화 삭제`) |
| `WebhookSettingsModal` (렌더 안 됨) | — | 토큰으로만 옮긴다 (R1 검사 대상). 지우지 않는다 |

### 6. AI 챗 화면 (`/chat`)
- 높이 규칙(`100dvh`, `visualViewport` 추종, 입력창 `text-base` + `sm:text-sm`, 포커스 시 `scrollIntoView`, safe-area 여백)은 UI-10 그대로 둔다. 확대 금지만 푼다 (설계 8).
- **챗 헤더 (`ChatHeader`, `h-14`, 한 줄)**:
  | 요소 | ≥1024 | 768~1023 | <768 |
  |---|---|---|---|
  | 기록 | 사이드바 접기/펴기 `IconButton` | 드로어 열기 | 드로어 열기 (`aria-label="대화 기록 보기" aria-expanded aria-controls="chat-history-drawer"` 유지) |
  | 피드로 | `←` + `피드` 링크 (`aria-label="피드로 돌아가기"`) | 같음 | 아이콘만 |
  | 제목 | `AI 챗` | 같음 | 같음 (말줄임) |
  | 모델 칩 (header-chip) | 보임 | 보임 | 숨김 (`hidden md:inline-flex`, 입력창 칩으로 대신) |
  | 새 대화 | 사이드바를 접었을 때만 | 항상 | 항상 (`IconButton label="새 대화 시작"`) |
  | 커맨드 팔레트 | `IconButton` | 같음 | 더보기 메뉴로 |
  | 더보기 | `MenuButton label="더보기"`: 테마 라디오 3개, `뉴스 피드로 이동` | 같음 | + `커맨드 팔레트` |
  - '새 대화' 표시 조건은 `!isDesktop \|\| !isSidebarOpen` (`isDesktop` = `useMediaQuery('(min-width: 1024px)')`). 1024px 미만에서 버튼이 숨던 문제(07 알려진 위험 18)를 고친다.
  - `/chat` 에서도 테마를 바꿀 수 있다 (ui-spec 알려진 위험 13 해결).
- **맥락 줄 (`ChatContextBar`, 헤더 아래, `h-11`, 가로 스크롤)**: 스코프 `SegmentedControl`(`단일 기사 (Scoped)` / `전체 코퍼스 (Global)`, `aria-label="검색 스코프 모드"`, 버튼 `aria-pressed` 유지) + `ActiveSourceChip`(`기사 컨텍스트 해제` 유지). 헤더에서 이 두 요소를 옮긴다.
- **대화 기록**: 데스크톱(≥1024) 고정 사이드바 `w-72`, 접을 수 있다. 태블릿·모바일 드로어. 활성 세션은 `bg-accent-soft` + 왼쪽 `border-l-2 border-accent`, `aria-current="true"`, `data-active="true"`.
- **메시지 열**: `max-w-3xl` 가운데. 사용자 말풍선 `bg-accent-soft text-fg` 오른쪽, 답변은 말풍선 없이 `surface` 위 마크다운. 인용 배지는 `accent-soft`, 보충 출처 `[S1]` 은 `success-soft` + `text-success` + `data-tone="supplementary"`. `WorkflowStepTracker` 머리줄은 `.flex.items-center.gap-2.font-medium` 클래스를 그대로 둔다(테스트 선택자). 내보내기 도구줄은 모바일에서 아이콘 버튼(44px, 접근 이름 `답변 복사`·`마크다운 복사`·`.md 다운로드`·`Notion 동기화` 유지).
- **입력 영역**: 바닥 고정, `bg-surface border-t`. 포커스 캡슐(`FocusCapsule`) → 입력창(`Textarea`) → 도구줄(모델 inline-chip, 글자 수, 전송/중단 `IconButton` 44px). `Enter: 전송, Shift+Enter: 줄바꿈` 안내는 lg 이상만.
- **경고 토스트**(`sourceId` 기사 없음): `useToast` 의 `warning` 톤, 문구 유지.
- **태블릿 사이드바**: 드로어로 둔다 (768px 에서 고정 288px 를 빼면 메시지 열이 480px 로 줄어 표·코드 블록이 좁아진다).
- **챗 커맨드 팔레트**: `CommandPalette commands=…` 로 `뉴스 피드로 이동`, 테마 순환(제목 규칙은 피드와 같음), `새 대화 시작`, `대화 기록 열기`. ⌘K 는 `ChatHeader` 가 단다.

### 7. 단축키 규칙
| 키 | 화면 | 동작 | 조건 |
|---|---|---|---|
| ⌘K / Ctrl+K | `/`, `/chat` | 팔레트 열기 / 닫기 | 처리 주체는 화면마다 하나 (`Header`, `ChatHeader` 의 `useHotkey`). 팔레트가 맨 위 레이어면 닫고, 다른 레이어가 열려 있으면 무시, 아니면 연다. 입력창 안에서도 동작 |
| Escape | 모든 화면 | 맨 위 레이어 하나 닫기 | 오버레이 스택이 처리 (2.1). IME 조합 중 무시 |
| j / k | `/` | 다음/이전 카드로 포커스 이동 | 아래 공통 조건. 실제 DOM 포커스를 그 카드의 제목 버튼으로 옮기고 `scrollIntoView({ block: 'nearest' })` |
| / | `/` | 검색창 포커스 | 공통 조건 |
| b | `/` | 포커스 카드 북마크 | 공통 조건 + 포커스 카드 있음 |
| c | `/` | 포커스 카드로 `/chat?sourceId=` | 같음 |
| t | `/` | 테마 순환 | 공통 조건 |
| Enter / Space | `/` | 포커스 카드 열기 | 대상이 `document.body` 일 때만. 버튼·링크·입력·`role` 이 있는 요소에서는 가로채지 않는다 (브라우저 기본 동작). 카드 제목 버튼은 기본 동작으로 상세를 연다 |
- 공통 조건: IME 조합 중 아님(`isComposing`, `keyCode 229`), 대상이 입력 요소(`INPUT`, `TEXTAREA`, `SELECT`, `contentEditable`, `role="combobox"`) 아님, ⌘·Ctrl·Alt 없음, **오버레이 스택이 비어 있음**.
- 글자 키는 `e.key` 소문자 또는 `e.code`(`KeyJ`, `KeyK`, `KeyB`, `KeyC`, `KeyT`, `Slash`)로 판정한다 (한글 입력 상태에서도 동작).
- `HotkeyListener` 의 기존 props·동작은 유지하고 `blockSingleKeys?: boolean` 을 더한다 (`/` 화면이 `useOverlayOpen()` 값을 넘긴다). 홈 화면은 `onCloseOverlays`, `onToggleCommandPalette` 를 넘기지 않는다 (Escape 는 스택, ⌘K 는 `Header`). `onOpenDetailModal` 은 위 Enter/Space 조건에서만 부른다.
- `focusedIndex` 는 목록(페이지·필터·정렬)이 바뀌면 -1 로 되돌린다 (07 알려진 위험 15 해결).

### 8. 루트 레이아웃 (`app/layout.tsx`)
- viewport: `{ width: 'device-width', initialScale: 1, interactiveWidget: 'resizes-content', colorScheme: 'light dark', themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f8fafc' }, { media: '(prefers-color-scheme: dark)', color: '#0e1013' }] }`. `maximumScale`, `userScalable` 를 지운다.
- `<html lang="ko" suppressHydrationWarning>`, 글꼴 변수 클래스 제거. `<head>` 안 인라인 스크립트(`dangerouslySetInnerHTML`)가 첫 그리기 전에 테마를 적용한다:
  ```js
  (function(){try{var m=localStorage.getItem('agentlens_theme');if(m!=='light'&&m!=='dark'&&m!=='system')m='system';
  var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  var r=document.documentElement;r.classList.remove(d?'light':'dark');r.classList.add(d?'dark':'light');
  r.setAttribute('data-theme',d?'dark':'light');r.style.colorScheme=d?'dark':'light';}catch(e){}})();
  ```
- `<body className="min-h-dvh bg-canvas text-fg overflow-x-hidden">` → `<ThemeProvider><div id="app-shell" className="flex min-h-dvh flex-col">{children}</div><ToastRegion /></ThemeProvider>`.
- `ThemeProvider` (`context/ThemeContext.tsx`): 내보내는 타입·값(`ThemeMode`, `Theme`, `theme`, `resolvedTheme`, `toggleTheme`, `setTheme`)과 props(`defaultTheme`, `storageKey`, `attribute`)를 유지한다. 내부는 `lib/theme-store.ts` 의 외부 저장소 + `useSyncExternalStore`:
  - `getSnapshot`: `localStorage[storageKey]` 를 매번 읽어 세 값 중 하나면 그 값, 아니면 `defaultTheme`. 시스템 선호는 `matchMedia('(prefers-color-scheme: dark)').matches` 를 매번 읽는다.
  - `getServerSnapshot`: `defaultTheme` 와 `light`. 하이드레이션 중에는 서버 값으로 그리고 바로 클라이언트 값으로 다시 그린다 (불일치 오류 없음). 색은 인라인 스크립트가 이미 적용해 깜빡이지 않는다.
  - 구독: `matchMedia` `change`(`addEventListener`, 없으면 `addListener`), `window` `storage`(다른 탭 동기화), 같은 탭의 `setTheme`/`toggleTheme` 알림.
  - DOM 적용: `useLayoutEffect` 로 `resolvedTheme` 마다 `dark`/`light` 클래스 하나, `data-theme`, `style.colorScheme` (개발 모드 재마운트 대응).
  - 순환 순서·저장 규칙은 UI-03 그대로.

### 9. 기능 위치 대응표
"—" 는 화면 진입점이 없는 기능(백엔드·API·자동 실행)이고 이번 작업으로 바뀌지 않는다.

| 기능 | 데스크톱 ≥1024 | 태블릿 768~1023 | 모바일 <768 |
|---|---|---|---|
| NEWS-01 목록·페이지 | 3열 그리드, `이전`/`다음` | 2열 | 1열, 버튼 반씩 |
| NEWS-02 카테고리 | 툴바 줄1 칩 | 툴바 줄1 칩 | 툴바 줄2 칩(가로 스크롤) |
| NEWS-03 소스 | 툴바 줄2 칩 | 툴바 줄3 칩 | 툴바 줄3 칩(가로 스크롤) |
| NEWS-04 Must-Read | 소스 칩 줄 첫 칩 | 같음 | 같음 |
| NEWS-05 검색 | 툴바 줄1 검색창, `/` | 줄2 검색창, `/` | 줄1 검색창 |
| NEWS-06 정렬 | 툴바 `Select` | 같음 | 같음 |
| NEWS-07 북마크 | 카드·상세 북마크, `b`, `북마크` 칩 | 같음 | 카드·상세 북마크, `북마크` 칩 |
| NEWS-08 카드 | 카드 | 카드 | 카드 |
| NEWS-09 상세 | 가운데 대화상자 | 가운데 대화상자 | 전체 화면 |
| NEWS-10 Ask AI | 상세 `Ask AI 질의응답` 탭 | 같음 | 같음 |
| NEWS-11, NEWS-12 | — | — | — |
| NEWS-13 RSS | 더보기 `RSS 피드`, 팔레트 | 같음 | 더보기, 팔레트 |
| NEWS-14 트렌드 레이더 | 요약 바(급상승 3개 + 펼침) | 같음 | 요약 바 `트렌드` 펼침 |
| NEWS-15 통계 | 상태 줄, 칩 건수 | 같음 | 같음 |
| NEWS-16 단축키 | 전역 키 | 전역 키 | 하드웨어 키보드가 있으면 같음 |
| NEWS-17 초기화 | 더보기 `초기화 & 재수집…`, 스케줄 위험 영역, 팔레트 | 같음 | 같음 |
| NEWS-18 브리핑 배너 | 요약 바 브리핑 버튼 | 같음 | 같음 |
| NEWS-19 핸드오버 | 카드 `챗에서 분석`, 상세 배너, `c` | 같음 | 카드, 상세 배너 |
| CHAT-01 세션 목록·검색 | 사이드바 | 드로어 | 드로어 |
| CHAT-02 새 대화 | 사이드바 `+ 새 대화`, (접힘 시) 헤더, 팔레트 | 헤더, 드로어, 팔레트 | 헤더, 드로어 |
| CHAT-03 세션 선택 | 사이드바 카드, URL | 드로어 카드, URL | 같음 |
| CHAT-04, 06, 10, 12, 13, 21~24 | — | — | — |
| CHAT-05 세션 삭제 | 카드 삭제 → 팝오버 | 같음 | 같음 |
| CHAT-07 기록 사이드바·드로어 | 사이드바(접기) | 드로어 | 드로어 |
| CHAT-08 입력·전송 | 입력 영역 | 같음 | 같음 |
| CHAT-09 스트리밍 표시 | 메시지 열 | 같음 | 같음 |
| CHAT-11 단계 표시 | 답변 위 | 같음 | 같음 |
| CHAT-14 인용 | 배지 → 팝오버 | 같음 | 같음 |
| CHAT-15 모델 선택 | 입력창 칩 (보정 7, R39. 이전: 헤더 칩, 입력창 칩) | 입력창 칩 (보정 7, R39) | 입력창 칩 |
| CHAT-16 포커스 필터 | 캡슐 → 가운데 대화상자 | 같음 | 캡슐 → 바텀시트 |
| CHAT-17 스코프·기사 칩 | 맥락 줄 | 맥락 줄 | 맥락 줄 |
| CHAT-18 핸드오버 수신 | URL → 맥락 줄 칩 | 같음 | 같음 |
| CHAT-19 내보내기 | 답변 아래 도구줄 | 같음 | 아이콘 도구줄 |
| CHAT-20 오류·중단·재시도 | 전송 자리 `중단`, 오류 카드 `다시 시도` | 같음 | 같음 |
| CHAT-25 반응형 | 설계 6 | 설계 6 | 설계 6 |
| BRF-01, 08, 10, 13 | — | — | — |
| BRF-02 배너 | 요약 바 | 같음 | 같음 |
| BRF-03 브리핑 모달 | 가운데 대화상자 | 같음 | 전체 화면 |
| BRF-04 Notion 발행 | 브리핑 도구줄 주 버튼 | 같음 | 같음 |
| BRF-05, 07, 09 연결 테스트 | 공유 & 알림 탭별 `연결 테스트` | 같음 | 같음 |
| BRF-06 이메일 발송 | 브리핑 도구줄 `이메일 발송` | 같음 | `브리핑 작업` 메뉴 |
| BRF-11 연동 설정 | 더보기 `공유 & 알림`, 팔레트, 브리핑 `연동 설정 관리` | 같음 | 같음 |
| BRF-12 웹훅 모달(미사용) | 진입점 없음 (지금과 같음) | — | — |
| SRC-01, 05, 09, 10, 12 | — | — | — |
| SRC-02 소스 모달 | 더보기 `소스 & 리서처`, 팔레트 | 같음 | 같음 (전체 화면) |
| SRC-03 목록 | `등록된 수집원` 탭 표 | 표 | 세로 카드 |
| SRC-04 RSS 추가 | 목록 탭 폼 | 같음 | 같음 |
| SRC-06 켜기/끄기 | `Switch` | 같음 | 같음 |
| SRC-07 삭제 | `IconButton` → `ConfirmDialog` | 같음 | 같음 |
| SRC-08 URL 검사 | 딥 리서처 탭 | 같음 | 같음 |
| SRC-11 딥 리서치 실행 | 딥 리서처 탭 버튼 | 같음 | 같음 |
| SRC-13 상태 | 지표 4열 | 4열 | 2열 |
| SRC-14 감사 일지 | 딥 리서처 탭 목록 | 같음 | 같음 |
| MCP-01~06 | — | — | — |
| MCP-07 MCP 모달 | 더보기 `MCP 연동`, 팔레트 | 같음 | 같음 |
| UI-01 헤더 | 설계 3 | 설계 3 | 설계 3 |
| UI-02 진행 줄·초기화 확인 | 헤더 아래 줄, `ConfirmDialog` | 같음 | 같음 |
| UI-03 테마 | 인라인 스크립트 + `ThemeProvider` | 같음 | 같음 |
| UI-04 테마 전환 | 헤더 `ThemeMenu`, `t`, 팔레트, 챗 더보기 | 같음 | 더보기 테마 그룹, 팔레트 |
| UI-05, UI-06 단축키·카드 탐색 | 설계 7 | 설계 7 | 하드웨어 키보드가 있으면 같음 |
| UI-07 팔레트 | 헤더 버튼, ⌘K (`/`, `/chat`) | 아이콘 버튼, ⌘K | 아이콘 버튼(`/`), 더보기(`/chat`) |
| UI-08 오버레이 규칙 | 설계 2.1 | 같음 | 같음 |
| UI-09, UI-10 반응형·뷰포트 | 설계 1.9, 4.2, 6, 8 | 같음 | 같음 |
| UI-11 상태 표시 | 스켈레톤·`ErrorState`·`EmptyState` | 같음 | 같음 |
| UI-12 마크다운 | `MarkdownViewer` (토큰, 14px) | 같음 | 같음 |
| UI-13 복사 피드백 | `useCopyToClipboard` | 같음 | 같음 |
| UI-14 접근성 속성 | 설계 2, 2.1, 5 | 같음 | 같음 |
| 스케줄 모달 (NEWS 화면 기능, UI-01 6번) | 헤더 수집 상태 버튼 | 헤더 시계 버튼 | 더보기 `수집 스케줄` (지금은 진입점 없음, 07 알려진 위험 14 해결) |

### 10. 문서
`/implement-plan` 이 구현 마지막 단계에서 고친다 (이 spec 단계에서는 고치지 않는다).
- 새 `docs/design-system.md`: 1) 원칙(중립+단일 강조, 토큰만 쓰기) 2) 토큰 표(1.3 그대로, 대비 포함) 3) Tailwind 구조와 새 토큰 추가 절차(`:root`·`.dark`·`@theme inline` 세 곳) 4) 글꼴·크기 역할·간격·반경·그림자·z-index·모션·브레이크포인트 5) 공통 부품 목록·API·접근성 규칙(2 표) 6) 오버레이 규칙(2.1) 7) 단축키 규칙(7) 8) 하지 말 것(hex·팔레트 클래스, `!important`, 대문자 영문 라벨, 임의 글자 크기, 브라우저 기본 대화상자) 9) 검사 방법(11.3, 11.4).
- `docs/ui-spec.md`: 라우트 절 viewport, 두 화면 와이어프레임(폭별 3개씩)·영역 구성, 모달 표(종류·크기·닫기·파일), 컴포넌트 트리(`components/ui`, `InsightsBar`, `FeedToolbar`, `ChatContextBar`, `ToastRegion`), 상태 관리(`overlay-stack`, `theme-store`), '스타일 체계' 절 전체를 design-system.md 요약 + 링크로, 알려진 불일치 9·10·13 지우기, 7(버전) 중 헤더 부분 지우기.
- `docs/functional-spec/07-ui-common.md`: UI-01·02·04·05·06·07·08·09·10·11·13·14 규칙, 단축키 표, 상수 표(레이어, 오버레이 색, viewport, 헤더 버전), 알려진 불일치 1·2·3·4·5·6·7·8·9·10·11·12·13·14·15·17·18·19, 20 중 `showDropdown` 을 지운다.
- `docs/functional-spec/01-news-feed.md`: NEWS-02(칩), 03, 04, 05, 06(Select), 08(카드 구성), 09(제목·탭·라벨), 14(요약 바), 16, 17(진입점), 18(요약 바) 진입점·출력 문구, 알려진 불일치 '상세 모달 원값 표시', '헤더 버전' 지우기.
- `docs/functional-spec/02-ai-chat.md`: CHAT-07, 15, 16, 17, 25 진입점.
- `docs/functional-spec/04-briefing-and-sharing.md`: BRF-02, 03, 11 진입점.
- `docs/functional-spec/05-sources-and-research.md`: SRC-02, 06, 07 진입점·확인 창.
- `docs/functional-spec/06-mcp-server.md`: MCP-07 진입점.
- `docs/known-issues.md`: 'UI·접근성' 7행을 지우고 남은 것이 있으면 다시 적는다. '설정과 코드 불일치' 의 헤더 버전 행을 지운다.
- `docs/tech-spec.md`: 설계 0 의 절.
- `docs/product.md`: '제품 원칙과 제약' 의 원칙 3줄(b983c33)은 그대로 둔다. '범위' 의 트렌드 레이더 줄은 구현으로 위치가 바뀌었으므로 지금 코드대로 고친다: `frontend/src/components/TechRadar.tsx` 는 지워졌고, 피드 위 요약 바(`frontend/src/components/feed/InsightsBar.tsx`)에서 펼치는 패널(`frontend/src/components/feed/TrendRadarPanel.tsx`)이 레이더를 그린다. API(`GET /api/trends/radar`) 서술은 그대로.

### 11. 테스트와 검증

#### 11.1 단계 (planner 에게 넘기는 제안)
화면 단위로 나누고 단계마다 frontend `make check` 를 통과시킨다.
0. eslint 기준선 54개 정리 (설계 12, 우려 사항 4·5)
1. 토큰·`globals.css` 구조·레이아웃·테마 저장소 (옛 덮어쓰기는 이 단계에서 남겨 둔다)
2. `components/ui/**`, `overlay-stack`, 훅 + 부품 단위 테스트
3. 헤더·`useCollector`·커맨드 팔레트·단축키
4. 피드 화면(요약 바, 툴바, 카드, 상태)
5. 모달 7종 + `ConfirmDialog` 교체
6. 챗 화면
7. 옛 `globals.css` 덮어쓰기·`!important` 제거, 정적 검사·대비 테스트 추가, `ui-audit` 실행, 문서

#### 11.2 유지할 테스트 계약
- 라벨·이름: `테마 전환`(ThemeToggle 기본 모드), `커맨드 팔레트` 대화상자와 명령 5개 문구, 자리표시 `명령어 검색…`, `검색된 명령어가 없습니다.`, 팔레트 안 `닫기` 하나, `AI 챗` 링크, `전용 챗에서 분석`, `전용 AI 챗으로 이동`, 북마크 `title` `보관하기`, 챗의 모든 이름(`질문 입력`, `질문 전송`, `중단`, `새 대화`, `피드로 돌아가기`, `단일 기사|Scoped`, `기사 컨텍스트 해제`, `대화 기록 목록`, `대화 기록 드로어 닫기`, `+ 새 대화`, `대화 검색`, `대화: …`, `삭제`, `대화 삭제`, `취소`, `Claude 모델 선택`, `Claude AI 모델 선택`, `Haiku/Sonnet/Opus 5.5`, `출처 n번`, `보충 … 출처 … S1`, `심층 분석 과정 … 단계 완료`, `지식 검색 포커스 필터`, `포커스 필터 초기화`, `수집 소식 타깃팅 포커스 필터`, `필터 닫기`, `적용하기`, `Must-Read 고신호 전용 토글`, `답변 복사`, `마크다운 복사`, `.md 다운로드`, `Notion 동기화`, `다시 시도`).
- 클래스: `ResponsiveLayout`·`MobileViewport`·`ChatMessageItem`·`ChatMessageList` 가 단언하는 `min-w-0`, `max-w-full`, `w-full`, `flex-1`, `break-words`, `break-all`, `font-mono`, `text-[12px]`, `[overflow-wrap:anywhere]`, `[word-break:break-word]`, `overflow-hidden`, `overflow-x-auto`, `overscroll-x-contain`, `overflow-x-hidden`, `min-w-[320px]`, `border-collapse`, `.markdown-content`, `.markdown-viewer`, `.code-block-wrapper`, `.table-wrapper`, `text-base` + `sm:text-sm`; `ChatModelSelector` 의 `text-xs`, `font-semibold`, `top-full`; `NewsCard` `ring-2`; `WorkflowStepTracker` 의 `.flex.items-center.gap-2.font-medium`; `ThemeSystem` 의 `<html>` `dark`/`light` 클래스·`data-theme`.
- 바꿔야 하는 단언은 우려 사항 1·2 에만 있다.

#### 11.3 새 테스트 (`frontend/src/tests/` 아래, 기존 단언을 약하게 하지 않는다)
- `design/TokenGuard.test.ts` (R1): `src/**/*.tsx` 를 읽어 `-\[#[0-9a-fA-F]{3,8}\]`, 팔레트 색 유틸리티 정규식(`\b(?:[a-z-]+:)*(?:bg|text|border|ring|ring-offset|outline|divide|from|via|to|fill|stroke|placeholder|decoration|caret|accent|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?(?:\/\d+)?\b`), `animate-in`·`zoom-in`·`slide-in-from` 가 0개인지, `globals.css` 에 `!important` 와 `html:not(.dark)`·`html.dark` 선택자가 0개인지 본다.
- `design/TokenContrast.test.ts` (R2·접근성): `globals.css` 의 `:root`·`.dark` 블록에서 토큰 값을 읽어 1.3 표의 조합을 상대 휘도 공식으로 계산해 글자 4.5:1, UI 경계·포커스 3:1 이상인지 본다.
- `ui/OverlayStack.test.tsx`, `ui/Dialog.test.tsx` (R7): 역할·`aria-modal`·제목 연결, 처음 포커스, Tab 순환, 닫을 때 포커스 복귀, 겹친 두 대화상자에서 Escape 한 번에 위만 닫힘, `ConfirmDialog` `busy` 중 Escape 무시.
- `ui/Menu.test.tsx`, `ui/Tabs.test.tsx`: 키보드 패턴.
- `HotkeyGating.test.tsx` (R7): 레이어가 열려 있으면 j/k/b/c/t 무시, 버튼에 포커스가 있으면 Enter·Space 를 막지 않음, `KeyJ` code 판정.
- `Header.test.tsx` (R9): 더보기 메뉴에 소스·공유·MCP·RSS·초기화(모바일 항목 포함)가 있고 각 콜백을 부른다. `NEXT_PUBLIC_APP_VERSION` 을 넣으면 배지가 `package.json` 버전과 같고, 비우면 배지가 없다 (설계 3).
- `chat/ChatHeader.test.tsx` 에 추가: 1024px 미만(`matchMedia` 목)에서 `새 대화` 가 보인다.

#### 11.4 폭별 화면 검증 (열린 질문 7의 답)
- `frontend/scripts/ui-audit.mjs` (devDependency `puppeteer-core` 사용, 런타임 의존성 아님). 실행 중인 앱(`make docker-up`, 기본 `http://localhost:3001`)과 로컬 Chrome(`CHROME_PATH`)이 필요해 `make check` 에 넣지 않는다.
- 조합: 경로 `/`, `/chat` × 테마 light, dark (`localStorage` 를 넣고 다시 읽기) × 뷰포트 360×780, 390×844, 768×1024, 1024×768, 1440×900. 추가로 `/` 에서 대화상자 7종을 하나씩 열어 같은 측정.
- 측정: `scrollWidth <= innerWidth`(R3), `<header>` 높이 ≤64 와 자식이 한 줄(R4), 390 에서 첫 `[data-feed-card] h3` 이 화면 안, 1440 에서 첫 줄 카드 전체가 화면 안(R5), 768 미만에서 1.9 의 주요 조작 요소 `getBoundingClientRect()` ≥44×44(R6), 대화상자 속성·Escape(R7), viewport 메타에 `user-scalable=no`/`maximum-scale` 없음(R8).
- 결과: `docs/features/ui-redesign/audit/report.json` 과 조합별 PNG. verify.md 가 이 결과를 인용한다. PNG 를 커밋할지는 plan 이 정한다.
- 2차 보정: 위 측정은 R3~R9 의 '넘침이 없는가·닿을 수 있는가' 만 보아, 칩이 부모 안에서 잘리거나 다른 요소에 가리거나 카드 제목이 어긋나는 결함(14.1 F1~F4)을 통과시켰다 (`report.json` 110/110). 2차는 14.8 의 검사를 더하고, 측정 환경을 프로덕션 빌드로 바꾸고(R31), 판정 자체를 검증한다(R30).

#### 11.5 2차 테스트와 검증 (설계 14)
- 단계 제안은 14.11, 새·바뀐 단위 테스트는 14.9, ui-audit 강화는 14.8 이다.
- 2차 증명 순서: ① 강화한 ui-audit 의 `--self-test` 통과 ② 같은 ui-audit 을 수정 전 코드(`1ec8a9b`)에 돌려 F1~F4 를 실패로 보고 (R30) ③ 2차 구현 뒤 프로덕션 빌드에서 전체 조합 실패 0 (R14~R24, R29, R31) ④ `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0 (R10, R32) ⑤ 대표 스크린샷 24장을 verify.md 에서 사람이 볼 수 있게 경로로 남긴다.
- 11.2 의 유지할 테스트 계약은 2차에도 그대로다. 바꿔야 하는 단언은 우려 사항 10 에만 있다.

### 12. 계약과 lint 기준선
- 계약 변경 없음. 변경 전/후:
  | 대상 | 전 | 후 |
  |---|---|---|
  | `backend/app/schemas/**` | 그대로 | 그대로 (건드리지 않음) |
  | zod 스키마·내보낸 타입 이름·필드(`types/chat.ts`, `news.ts`, `trends.ts`) | 그대로 | 그대로 |
  | MSW 응답 본문·상태 코드·SSE 순서(`mocks/**`) | 그대로 | 그대로 |
  | 계약 테스트 `ContractAndMsw.test.ts` 단언 | 그대로 | 그대로 |
- lint 만 고치는 곳 (타입 표기만, 런타임 값·스키마 불변):
  - `types/chat.ts:929` `ChatHeaderProps.activeSource?: any | null` → `ActiveSourceChip` 이 받는 기사 타입. 이것은 컴포넌트 props 타입이고 API 응답 스키마가 아니다.
  - `mocks/handlers.ts:64-65` `(art as any)` → 필드 존재 검사로 좁히기. `mocks/handlers/chat.ts:47` `as any` → `ModelTier` 배열 타입 가드. 응답 값은 같다.
  - `lib/api.ts` `any` 7곳 → `unknown` + 좁히기, 또는 이미 있는 `BriefingSettings` 타입·구체 인터페이스. 함수 이름·인자·반환 형태·요청 본문은 같다.
  - `tests/chat/ContractAndMsw.test.ts`, `tests/ThemeSystem.test.tsx` 의 `any` → 구체 타입. 단언은 바꾸지 않는다.
- `react-hooks/set-state-in-effect` 13개는 해당 컴포넌트를 다시 쓰며 파생 값·이벤트 핸들러·`useSyncExternalStore` 로 없앤다. `react/no-unescaped-entities` 6개는 문자 이스케이프.
- eslint 설정 완화, 파일 단위 `eslint-disable` 은 쓰지 않는다. 줄 단위 disable 은 사유 주석과 함께 plan 에 적은 곳만.
- plan '변경 파일' 에 위 `types/**`·`mocks/**`·`lib/api.ts`·계약 테스트 파일을 넣는다 (contracts.md 경로 규칙).

### 13. 함께 고치는 알려진 문제
| 문서·항목 | 고침 |
|---|---|
| known-issues 'UI·접근성' 7행 전부 | 설계 1.2, 2.1, 3, 4, 6, 7, 8 |
| 07 알려진 위험 1~15, 17, 18, 19, 20(`showDropdown`) | 위 각 절 |
| 07 알려진 위험 16 (클립보드 실패) | `useCopyToClipboard` |
| ui-spec 알려진 위험 9, 10, 13, 7(헤더 버전) | 설계 1, 3, 6 |
| 01 '상세 모달 원값 표시' | `lib/labels.ts` |
| (2차) known-issues 'UI·접근성' 8행 전부: 챗 기록 버튼 `aria-controls`, 챗 경고 토스트 위치, 챗 기사 칩 카테고리 원값, 요약 바 깜빡임, 부모·자식 대화상자 동시 열림 순서, Ask AI 입력 중 Escape, 수집 중 `/` 이탈 후 복귀, Ask AI 복사 실패 알림 | 설계 14.7 (R19, R22~R28) |
| (2차) 01 알려진 위험 '통계 실패가 브리핑·레이더를 막음' | 설계 14.5 (R22) |
| (2차) 02 CHAT-07·CHAT-17 예외·엣지(기록 버튼 `aria-controls`, 칩 원값), 07 알려진 위험 1·2·3, design-system.md 10.2 '부모·자식 대화상자' | 설계 14.6, 14.7 |
| 고치지 않는 것 | Ask AI `Gemini` 표기(문구·동작 문제, 별도 intent), 스케줄 시각 고정 문구, MCP 고정 예시, `/api/health` 버전 고정, `HotkeyMapping.modifiers`·`allowInInputs`, `WebhookSettingsModal` 삭제 여부. (2차) backend 의 카테고리별 고정 시사점 문장(우려 11), `hotness_score` 포화·같은 점수(우려 12), 포커스 시트 카테고리 라벨(우려 18), MCP 서버가 돌린 수집의 상태 공유(우려 16), `make check` backend live LLM 테스트 2개 실패(우려 17) |

### 14. 후속 범위 (2차)
18단계 구현과 검증(verify.md, ui-audit 110/110)을 끝났다고 보고했지만 화면 결함과 알려진 문제가 남았다. 원작성자의 말: "남은게 있다며? 그리고 범위밖 변경이 있다며? 뭐가 끝났는데?", "하나도 안 끝났네". 원래 요청은 "pc 모바일 태블릿등에서 사용성이 좋은 ui ux가 필요해, 디자인시스템을 설계하고 ui ux를 수정해줘" (intent.md). 원작성자의 불만은 "디자인이 너무 별로" 였고, 지금 화면은 예전 화면을 정리한 수준이라는 평가가 있다. 이 절은 남은 것을 요구사항 R14~R32 로 만든다.

#### 14.0 범위와 결정 요약
- 작업 묶음: A 화면 결함과 첫 화면 정보 위계(R14~R22), B 챗 알림 위치(R23), C known-issues 'UI·접근성' 8행(R19, R22~R28), D 자동 측정 강화(R29~R31), E 범위(R32).
- 바뀌는 파일(예상, plan 이 확정): `components/feed/FeedToolbar.tsx`, `components/feed/InsightsBar.tsx`, `components/feed/NewsCardSkeleton.tsx`, `components/NewsCard.tsx`, `components/chat/HandoverCtaButton.tsx`(카드 아이콘 모드), `app/page.tsx`, `app/globals.css`(줄바꿈 기본값), `hooks/useNewsFeed.ts`, `hooks/useCollector.ts`, 새 `hooks/useScrollOverflow.ts`, 새 `lib/feed-insights.ts`, `lib/labels.ts`, `lib/overlay-stack.ts`, `components/ui/Chip.tsx`(`ChipGroup`), `components/ui/Toast.tsx`, `components/ui/Tabs.tsx`, `components/news-detail/AskAiPanel.tsx`, `components/NewsDetailModal.tsx`, `components/DailyBriefingModal.tsx`, `components/sources/SourcesListTab.tsx`, `components/chat/ChatHeader.tsx`, `ChatSidebarHeader.tsx`, `ChatContextBar.tsx`, `ChatMessageList.tsx`, `ChatWorkspace.tsx`, `ActiveSourceChip.tsx`, `FocusCapsule.tsx`, `CitationPopover.tsx`, `frontend/scripts/ui-audit.mjs`, 새 `frontend/scripts/ui-audit-fixtures/`, `frontend/src/tests/**`.
- 바뀌지 않는 것: backend, REST·SSE 계약, `types/**`, `mocks/**`, `lib/api.ts`, `package.json`·lock(devDependency 포함), localStorage 키 (R32). 새 의존성을 넣지 않는다. 기존 토큰(설계 1.3)과 부품(설계 2) 안에서 고친다. 새 색 토큰은 없다.
- 결정:
  1. 390 의 칩 줄은 **가로 스크롤**로 둔다. 줄바꿈하면 카테고리 5칩(1440 실측 약 857px)이 358px 폭에서 3줄이 되어 툴바가 약 100px 늘고 R5 예산을 잡아먹는다. 대신 스크롤 가능함이 보여야 한다 (R15, 14.3).
  2. 첫 화면 정보 위계: 필터 칩 줄은 데스크톱 2줄·모바일 2줄(검색 줄 별도)로 두되 모든 폭에서 잘림 없이 보이거나 스크롤 표시가 있다. 카드 배지는 카드당 최대 4개(Must-Read 1 + 기술 스택 3)를 한 줄에, 머리줄에는 배지를 두지 않는다. 정보가 없는 `Hot 100` 배지를 바닥 통계로 내린다. 카드는 머리줄 1줄·제목 2줄·본문 2줄·배지 0~1줄·바닥 1줄의 고정 틀이다 (14.2, 14.4).
  3. 반복 시사점은 데이터 문제다 (F5). 프론트는 반복될 때 요약을 대신 보여 완화만 하고, 원인은 우려 11 로 넘긴다.
- `docs/tech-spec.md`: '변경 이력' 의 `ui-redesign` 행에 2차 한 줄. 다른 절은 바뀌지 않는다. `docs/product.md`: 범위·사용자·원칙·기능 목록이 바뀌지 않아 고치지 않는다.

#### 14.1 화면 점검 결과
2026-11-06 에 `audit/*.png` 8장(피드·챗 × 390×844·1440×900 × 라이트·다크)을 직접 열어 보고, 768·1024 는 코드로 폭을 계산했다. 좌표는 1440 스크린샷의 픽셀 값이다.

| 번호 | 화면·폭 | 결함 | 원인 | 요구사항 |
|---|---|---|---|---|
| F1 | 피드 1440 | 소스 줄 마지막 칩 `Global Blogs 270` 이 정렬 선택창 앞에서 잘리고, 그 뒤 `북마크` 칩은 화면에 아예 보이지 않는다. 정렬 오른쪽(x≈1120~1328)은 빈칸이다 | `FeedToolbar.tsx:95` 의 `grid-cols-[minmax(0,1fr)_auto]` 에서 auto 열을 검색(`xl:w-80`, 320px)과 정렬(`w-28`, 112px)이 같이 써 열 폭이 320px 가 된다. 소스 줄이 그만큼 좁아진다. 스크롤바를 숨겨(`Chip.tsx:82` `[scrollbar-width:none]`) 세로 휠 마우스로는 숨은 칩에 닿을 수 없다 | R14, R15 |
| F2 | 피드 390 | 카테고리 줄이 오른쪽에서 잘리고 스크롤할 수 있다는 표시가 없다. 소스 줄은 `Must-Read`·`전체` 두 칩만 보이고 나머지 칩(소스 5개, `북마크`)이 숨는다 | `ChipGroup` 마스크가 넘침과 상관없이 양 끝 12px 를 늘 흐리고(`Chip.tsx:82`), 넘침 상태·스크롤 버튼이 없다. 소스 줄이 정렬과 한 줄이라 238px 만 받는다 | R15 |
| F3 | 피드 1440·390 | 검색 자리표시 `키워드 검색 (SWE-bench, MCP, LangGraph, Claude 5.5 등)...` 가 말줄임 없이 `LangGraph` 에서 끊긴다 | `FeedToolbar.tsx:29` 문구가 입력 폭보다 길다. Ask AI 자리표시(`AskAiPanel.tsx:219`, 43자)도 390 에서 같다(코드 계산) | R16 |
| F4 | 피드 전 폭 | `Must-Read`·`Hot 100` 배지가 메타 줄에서 줄바꿈되어 카드마다 제목 위치가 다르다 (1440 두 번째 줄: 4·5번 카드 제목 y≈629, 6번 y≈653). 4·5번 카드는 본문 아래가 비어 보인다. 390 에서는 북마크 버튼이 메타 줄보다 아래로 처진다 | `NewsCard.tsx:95` 메타 줄 `flex-wrap`, 제목·본문 높이 고정 없음, 북마크 `-mt-1 -mr-1` + 모바일 44px. 768 2열(카드 안쪽 약 312px)·1024 3열(약 266px)에서는 `Hot` 하나만 있어도 넘친다(코드 계산) | R17 |
| F5 | 피드 전 폭 | 여러 카드의 Insight 문구가 같다 (1440: 2·4번 `프론티어 추론 모델과…`, 3·5·6번 `단일 프롬프트를 넘어…`) | **데이터 문제.** 프론트는 `item.why_it_matters` 를 카드마다 그대로 그린다(`NewsCard.tsx:138-142`, `GET /api/news` 응답 필드). backend `llm_processor.py:84-89` 의 `CATEGORY_INSIGHTS` 와 `:703-709` 가 LLM 평가가 시사점을 주지 않으면 카테고리별 고정 문장(기술 이름이 잡히면 `{기술} 기반 구현에서 ` + 고정 문장)을 저장한다 | R18(완화), 우려 11 |
| F6 | 피드 전 폭 | 첫 화면 카드 9개가 모두 `Hot 100` 이라 배지가 정보를 주지 않고 메타 줄만 차지한다. 별점도 모두 `180`, 시간도 모두 `18일 전` | 표시 기준 `hotness_score > 25`(`NewsCard.tsx:79`). 점수 값은 데이터 | R17, 우려 12 |
| F7 | 피드·챗 | 같은 카테고리를 화면마다 다르게 부른다: 필터 `하네스 & 벤치마크`, 카드·상세 `Harness`, 챗 기사 칩 `harness`(원값), 포커스 캡슐 `하네스`, 포커스 시트 `하네스·평가`, 소스 등록 `Agent Tech (에이전트 아키텍처)` | 라벨 표가 `FeedToolbar.tsx:11-17`, `lib/labels.ts:5-10`, `FocusCapsule.tsx:19-25`, `FocusBottomSheet.tsx:29-35`, `SourcesListTab.tsx:26` 에 따로 있고 `ActiveSourceChip.tsx:35` 는 원값을 그린다 | R19 |
| F8 | 피드 | 카드 본문 라벨 `Insight`, 카드 카테고리 배지 `Harness`·`Agent Tech`·`AI Frontier` 가 영문이다 (R13 위반) | `NewsCard.tsx:140`, `lib/labels.ts:5-10` | R17, R19 |
| F9 | 피드 1024 (코드) | 카테고리 줄(약 857px)이 검색(`lg:w-64`)과 한 줄이라 약 696px 만 받아 `최신 AI 동향` 이 숨는다. 소스 줄(약 1,000px)도 약 696px 만 받는다 | `FeedToolbar.tsx:95` lg 배치 | R14, R15 |
| F10 | 피드 768 (코드) | 카테고리·소스 줄이 모두 넘친다. 요약 바의 급상승 칩 3개가 md 부터 보여 브리핑 버튼이 약 200px 로 줄고 헤드라인이 거의 보이지 않는다 | `InsightsBar.tsx:69` `hidden md:flex` | R15, R20 |
| F11 | 피드 390 | 요약 바가 `오늘의 브리핑 · 2026년 11월 06...` 에서 끊겨 헤드라인이 보이지 않는다 | `InsightsBar.tsx:54-60` 이 날짜를 헤드라인 앞에 둔다 | R20 |
| F12 | 피드 전 폭 | 요약 바 아래 간격이 1440 약 38px, 390 약 30px 로 다른 영역 사이(12~20px)보다 넓다 | `InsightsBar.tsx:45` 의 `space-y-3` 이 숨긴 패널(`hidden`) 때문에 바에 12px 아래 여백을 더하고, 툴바 `py-2` 가 main `gap` 에 더해진다 | R20 |
| F13 | 챗 1440·390 | 추천 질문 카드 글자가 가운데 정렬이고 한국어 단어가 중간에서 끊긴다 (`시간 여`/`행`, `오`/`픈소스`, `평가 지`/`표`, `동`/`향`) | `ChatMessageList.tsx:67-73`: `text-left` 가 부모 grid 에만 있어 버튼 기본 `text-align: center` 를 덮지 못하고, `break-keep` 이 없다 | R21 |
| F14 | 챗 1440 | 사이드바 머리 영역 아래 경계(y≈104)와 헤더+맥락 줄 아래 경계(y≈100)가 4px 어긋난다. 맥락 줄 스코프 토글 왼쪽 끝(x≈505)이 입력 영역 왼쪽 끝(x≈480)과 맞지 않는다 | `ChatContextBar.tsx:36` 의 `md:px-6` 과 입력 영역(`ChatWorkspace.tsx:703-704`)의 안쪽 여백이 다르다. 사이드바 머리 영역 높이가 헤더(56)+맥락 줄(44)과 다르다 | R21 |
| F15 | 피드 (코드) | 수집 중 새 소식이 저장될 때마다 카드 그리드 전체가 스켈레톤 6개로 바뀌고 페이지 이동 줄이 사라진다 | `useNewsFeed.ts:24,119` 가 `newsReload` 를 요청 키에 넣어 다시 읽기도 로딩으로 판정, `page.tsx:192-244`. 요약 바 깜빡임(known-issues)과 같은 원인군 | R22 |
| F16 | 측정 | 모든 스크린샷 왼쪽 아래 Next.js 개발 표시기(`N`)가 카드 점수(390 두 번째 카드 `180`), 세션 목록 항목, 입력 모델 칩(`Sonnet 5.5` → `nnet 5.5`)을 가린다 | 측정을 `next dev` 에서 돌렸다 (verify.md '남은 위험'). 사용자 화면 결함은 아니지만 측정을 오염한다 | R31 |
| F17 | 대화상자 (코드) | `aria-controls` 가 없는 요소를 가리킨다: `Tabs.tsx:106` 이 선택되지 않은 탭에도 패널 id 를 달지만 뉴스 상세·일일 브리핑은 선택된 패널만 그린다. `DailyBriefingModal.tsx:153`(이메일 폼), `SourcesListTab.tsx:126`(새 피드 폼)도 폼이 닫혀 있을 때 대상이 없다 | 조건부 렌더와 고정 `aria-controls` | R24 |

#### 14.2 필터 툴바 (`FeedToolbar`, R14·R16·R33)
- (보정 9) 이 절의 줄 A·B 표, Must-Read 위치, 폭 계산, DOM 순서는 14.17 G1 이 대신한다: 검색은 필터 영역 위 별도 영역, 정렬은 목록 머리줄, Must-Read 는 소스 줄 오른쪽 끝. 아래는 보정 8 까지의 기록이다.
- 한 그리드 대신 줄마다 `flex` 컨테이너(`data-toolbar-row`)를 둔다. 같은 열을 두 컨트롤이 나눠 쓰지 않는다.
- (리뷰 후속, R33) 폭별 배치를 JS(`useToolbarLayout`, `FeedToolbar.tsx:67-81`)로 고르고 폭마다 다른 트리를 그리던 방식(`FeedToolbar.tsx:236-268`)을 버린다. 그 방식은 폭이 바뀔 때 검색 입력과 스크롤 줄을 다른 트리 위치에 다시 마운트해 포커스·가상 키보드와 사용자가 스크롤한 줄 위치를 잃고(다시 마운트된 줄은 처음 상태로 돌아간다), 서버·첫 렌더는 `xl` 트리라 768~1279 에서 하이드레이션 뒤 정렬·검색이 줄을 바꿨다. 이제 트리는 하나다: 줄 A `[카테고리][검색]`, 줄 B `[소스][정렬]`. 768 미만에서는 줄 A 만 세로로 쌓는다(`max-md:flex-col max-md:items-stretch`, 순서는 그대로). 세 폭 모두 DOM 순서 `카테고리 → 검색 → 소스 → 정렬`(보정 5 부터 `카테고리 → 검색 → 소스 → Must-Read → 정렬`) 이 화면 순서와 같다. `order`·`flex-*-reverse`·grid 영역으로 순서를 바꾸지 않는다 (WCAG 1.3.2·2.4.3, 근거 E28). (보정 4) 한 트리가 지키는 것은 노드·포커스·입력 값·가상 키보드다. 칩 줄 `scrollLeft` 는 폭이 바뀌어도 그대로라고 약속하지 않는다: 줄 폭이 바뀌면 R15 '선택 칩 다시 보이기'(14.3) 대로 움직일 수 있다. `FeedToolbar` 는 `useMediaQuery` 를 쓰지 않는다 (`ScrollRow` 안의 스크롤 버튼 판정은 그대로).

  | 폭 | 줄 A | 줄 B | 비고 |
  |---|---|---|---|
  | ≥1280 (`xl`) | 카테고리(`flex-1 min-w-0`, 아이콘 있음) + 검색(`xl:w-72`) | 소스(`flex-1 min-w-0`) + Must-Read 토글(별 + 글자) + 정렬(`xl:w-32`) | 2차와 같다 (보정 5: Must-Read 토글 추가) |
  | 768~1279 | 카테고리(`flex-1 min-w-0`, 아이콘 숨김) + 검색(`md:w-48`) | 소스(`flex-1 min-w-0`) + Must-Read 토글(별 + 글자) + 정렬(`w-28`) | 2차의 '카테고리+정렬 / 검색+소스' 에서 바뀐다 |
  | <768 | 카테고리(아이콘 숨김, 화면 좌우 끝까지) 아래에 검색(전체 폭) — 한 줄 A 안의 세로 쌓기 | (보정 7, R35) 소스(전체 폭, 화면 좌우 끝까지) 아래 줄 오른쪽 끝에 Must-Read 토글(별만, 44×44) + 정렬(`w-28`) — 줄 B 안의 줄바꿈 (14.15 F1). 보정 6 까지는 `소스(왼쪽 끝까지) + Must-Read + 정렬` 한 줄이었다 | 2차의 '검색이 맨 위' 에서 카테고리가 맨 위로 바뀐다. 보정 7 부터 줄 수 4 (높이 약 52px 늘어남, 14.15 F1) |
- (보정 5, R34) Must-Read 토글: 지금은 소스 그룹 첫 칩 + 구분선이다(`FeedToolbar.tsx:176-188`). 이것을 소스 `ChipGroup` 밖, 줄 B 의 소스 줄과 정렬 사이 형제로 옮기고 구분선(`:188`)을 지운다 (구분선은 Must-Read 와 소스 칩을 가르던 것이라 더 쓸 곳이 없다).
  - 부품: 지금처럼 `Chip tone="warning"`(`button aria-pressed`, 선택 시 `warning` 톤, 별 아이콘 채움)을 쓴다. 속성 `data-must-read-toggle`, `title` 은 지금 문구, `className="shrink-0 max-md:w-11 max-md:justify-center max-md:px-0"`. 글자는 `<span className="max-md:sr-only">Must-Read</span>` 로 두어 접근 이름이 모든 폭에서 `Must-Read` 이고 폭이 바뀌어도 다시 마운트되지 않는다 (R33). 높이는 `Chip` 의 `h-11 md:h-8` 그대로라 768 미만 44×44.
  - DOM·Tab 순서: `카테고리 → 검색 → 소스 줄(이전 버튼, 칩, 다음 버튼·표시) → Must-Read → 정렬`. 화면 순서와 같다.
  - 소스 줄 오른쪽은 이제 Must-Read 토글과 닿는다. `bleed="start"` 는 그대로(오른쪽은 늘이지 않는다), 768 미만 오른쪽 넘침 표시는 소스 줄과 Must-Read 사이에 온다 (14.3 보정 3-4 의 '`bleed` 없는 쪽').
  - 소스 줄의 `selectedSelector='[data-source-chip][aria-pressed="true"]'` 와 `data-source-chip` 은 그대로 둔다 (줄에 소스 칩만 남아 기본 선택자와 같은 결과지만, 바꿀 이유가 없고 기존 단언을 건드리지 않는다).
- 폭 계산 (측정 데이터: 카테고리 5칩, 소스 칩 7개 = 전체·국내 테크·GitHub·HackerNews·HuggingFace·Global Blogs·북마크. 2차 측정의 소스 줄 약 1,000px 에서 Must-Read 약 114px·구분선과 간격 약 17px 를 뺀 약 869px. Must-Read 토글은 768 이상 약 114px(여백 24 + 별 16 + 간격 6 + 글자 약 68, 계산값), 768 미만 44px):
  - 1440 (안쪽 1216px): 줄 A = 857 + 16 + 288 = 1161 ≤ 1216, 줄 B = 약 869 + 16 + 114 + 16 + 128 = 약 1,143 ≤ 1216. 둘 다 넘치지 않는다 (R14). 건수 있는 소스가 늘어 넘치면 R15 규칙을 따른다.
  - 1024 (안쪽 960px): 줄 A = 아이콘을 뺀 카테고리 약 747 + 16 + 192 = 약 955 ≤ 960 (여유 약 5px, 계산값이라 넘칠 수 있고 넘치면 R15). 줄 B 의 소스는 960 − 16 − 114 − 16 − 112 = 약 702px 로 약 869 보다 좁아 R15 의 스크롤 버튼이 보인다.
  - 768 (안쪽 720px): 줄 A 카테고리 720 − 16 − 192 = 512px, 줄 B 소스 720 − 16 − 114 − 16 − 112 = 약 462px. 둘 다 넘친다 → R15.
  - 390 (안쪽 358px, 간격 8): 줄 B 소스 상자 358 − 8 − 44 − 8 − 112 = 186px (+ 왼쪽 `bleed` 16px). 360 (안쪽 328px): 156px (+16). 첫 소스 칩 `전체`(건수 4자리 포함 약 87px)가 `scrollLeft` 0 에서 흐림 밖에 다 들어가 처음 상태에 줄이 밀리지 않는다 (계산값, ui-audit 로 확인). 넘치는 나머지 칩은 R15(오른쪽 `›`)로 닿는다.
  - `md:w-48`(192px) 검색 상자 안쪽 글자 폭(아이콘·지우기 버튼 뺀 약 110px)에 자리표시 `키워드 검색` 이 들어간다 (R16 `placeholder` 로 확인).
- 칩 순서·이름·건수·`aria-pressed`, 그룹 이름(`카테고리`, `소스`), 정렬 `Select` 의 옵션은 그대로다 (`FeedToolbar.test.tsx` 단언 유지). (보정 5) 'Must-Read 가 소스 그룹 첫 칩인 구조' 는 R34 로 바뀐다: Must-Read 는 소스 그룹 밖 토글이다 (바뀌는 단언은 14.14 표).
- 카테고리 칩 아이콘은 `xl` 미만에서 숨긴다 (`[&_[data-chip-icon]]:max-xl:hidden` 같은 규칙, `Chip` 에 `iconClassName` 을 받는다).
- 검색 자리표시는 `키워드 검색` 으로 줄인다. 예시 문구는 넣지 않는다 (360px 에서 검색 줄 안쪽 약 280px, `xl` 검색 안쪽 약 240px 를 모두 넘지 않게). 입력 요소에는 `text-ellipsis` 를 둔다. Ask AI 자리표시는 `이 기사에 대해 질문하세요` 로 줄인다 (예시는 빠른 질문 칩이 대신한다).
- 툴바 세로 여백: sticky 배경용 `py-2` 는 두되 `-my-2` 로 상쇄해 앞뒤 형제와의 간격은 main `gap` 하나로 정한다 (R20).

#### 14.3 가로 스크롤 줄 (`ChipGroup scrollable`, R15)
- DOM: 바깥 감싸개(`relative flex min-w-0 items-center gap-1`) 안에 [이전 버튼] [`role="group"` 칩 줄] [다음 버튼]. 스크롤 버튼은 그룹 **밖** 형제다 (`within(group).getAllByRole('button')` 개수를 바꾸지 않는다). 버튼은 칩을 덮지 않는다 (오버레이 배치 금지 — `occluded` 검사).
- 칩 줄 속성: `data-scroll-row`, `data-overflow="none|start|end|both"`. 새 훅 `useScrollOverflow(ref)` 가 `ResizeObserver`(줄과 자식)와 `scroll` 이벤트에서 `scrollLeft`, `scrollWidth`, `clientWidth` 로 상태를 정한다 (1px 허용). 상태 갱신은 관찰자·이벤트 콜백 안에서만 한다 (`react-hooks/set-state-in-effect`).
- 흐림: `data-overflow` 가 `start` 면 왼쪽 24px, `end` 면 오른쪽 24px, `both` 면 양쪽에만 `mask-image` 를 둔다. `none` 이면 마스크가 없다. 지금의 상시 12px 마스크를 지운다.
- (보정 3) 흐림 폭 = 스냅 여백 = 선택 칩 보이기 여백 = 24px, 모든 폭·모든 스크롤 줄. 3차 구현은 스냅 여백이 768 미만 `bleed` 쪽에만 16px(`max-md:scroll-px-4`/`scroll-pl-4`, `ScrollRow.tsx:320-325`)이고 흐림은 24px(`:20-25`)라, 스냅 위치에 선 선택 칩 왼쪽 약 8px 가 왼쪽 흐림에 겹쳤다 (31 후속 2 보고). 768 이상은 스냅 여백이 0 이라 칩이 흐림 24px 안에 통째로 선다. 이제 스크롤 줄에 늘 `scroll-px-6`(24px)을 두고 `bleed` 클래스에서 `scroll-p*-4` 를 뺀다. 스냅 위치 `칩 왼쪽 − 24` 에서 칩은 왼쪽 흐림 밖에서 시작하고, `revealInRow` 의 흐림 여백(`REVEAL_PADDING_PX = 24`, `:31`)과 같은 값이라 '흐림 밖에 다 드는 스냅 위치' 를 찾을 수 있다. 줄 끝(`scrollLeft` 0·최댓값)에서는 그쪽 흐림이 없으므로 여백도 필요 없다 (스냅 위치가 0·최댓값으로 잘림).
- 스크롤 버튼: 768 이상에서 넘친 쪽에만 `IconButton size="sm" variant="ghost"` (`label` = `{그룹 이름} 이전 항목 보기` / `{그룹 이름} 다음 항목 보기`, 아이콘 `ChevronLeft`/`ChevronRight`). 누르면 `clientWidth × 0.8` 만큼 스크롤한다 (줄어든 움직임이면 `behavior: 'auto'`). 768 미만은 버튼 없이 손가락으로 민다.
- (리뷰 후속, R15) 스크롤 버튼 포커스 유지: 버튼은 지금처럼 넘친 쪽에만 렌더한다 (`ScrollRow.tsx:141-173`. 늘 렌더하고 `aria-disabled` 로 두는 방식은 버튼이 없음을 단언하는 `ui/ChipGroup.test.tsx:176,188`, `ui/Tabs.test.tsx:249` 와 충돌해 택하지 않는다, 근거 E29). 대신 사라지는 버튼의 포커스를 옮긴다:
  1. `ScrollRow` 가 포커스를 가진 버튼을 ref 로 기억한다 (`'prev' | 'next' | null`, 상태가 아니라 ref 라 다시 그리지 않는다). 버튼 `onFocus` 에서 설정한다. `onBlur` 에서는 `queueMicrotask` 뒤 그 버튼이 아직 문서에 있을 때만(사용자가 포커스를 옮긴 경우) 지운다. 버튼이 빠지면서 생긴 `blur`(브라우저에 따라 오거나 오지 않는다)는 버튼이 문서에 없으므로 ref 를 남긴다.
  2. `useLayoutEffect`(의존: `showPrev`, `showNext`)에서 기억한 버튼이 더 이상 렌더되지 않고 `document.activeElement` 가 `body`·`null`·연결이 끊긴 요소면, 다음 순서의 첫 대상에 `focus({ preventScroll: true })` 한다: ① 반대쪽 버튼(렌더돼 있으면) ② 줄의 선택 칩(`selectedSelector`) ③ 줄의 첫 포커스 가능 요소. 그 뒤 ref 를 지운다. 그리기 전에 옮기므로 포커스 링이 깜빡이지 않는다.
  3. 사용자가 다른 곳으로 포커스를 옮긴 뒤(빈 곳 클릭 포함)에는 옮기지 않는다 (1 에서 ref 가 비워짐).
  - 예: 768 이상에서 `다음` 을 키보드로 눌러 끝에 닿으면 `data-overflow` 가 `start` 가 되어 `다음` 버튼이 사라지고 포커스는 `이전` 버튼으로 간다. 폭이 768 미만이 되어 두 버튼이 모두 사라지면 선택 칩으로 간다.
- (리뷰 후속, R15) 줄별 선택 칩 선택자: `ChipGroup` 에 `selectedSelector?: string` 을 더해 `ScrollRow` 로 넘긴다 (지금은 넘기지 않아 기본값 `[aria-pressed="true"]` 고정, `Chip.tsx:97-108`). 소스 줄은 `전체`·소스·`북마크` 칩에 `data-source-chip` 을 달고 `selectedSelector='[data-source-chip][aria-pressed="true"]'` 를 넘긴다. 그래서 `Must-Read`(소스 줄 첫 칩, `FeedToolbar.tsx:184-195`)가 눌려 있어도 선택된 소스 칩이 보이게 스크롤한다. `Must-Read` 를 켜고 끄는 것만으로는 줄이 움직이지 않는다 (선택 소스 칩이 그대로이므로). 다른 줄(카테고리, 급상승, 맥락 줄, 빠른 질문, 탭)은 지금 선택자 그대로다. (보정 5) `Must-Read` 가 소스 줄 밖 토글로 옮겨진 뒤에도 선택자는 그대로 둔다 (14.2 보정 5).
- 768 미만 `bleed`: 줄이 페이지 좌우 여백을 넘어 화면 끝까지 닿는다 (`-mx-4 px-4`). 오른쪽 끝에서 다음 칩이 일부 잘려 보여 더 있다는 것을 알린다. 이 잘림은 스크롤 줄 안의 의도한 잘림이라 `clip` 검사에서 빼고 `scrollRow` 검사가 본다. `bleed` 값: `true` 는 좌우, `'start'` 는 왼쪽만(오른쪽에 다른 컨트롤이 있는 소스 줄).
- (보정 3) 768 미만 넘침 표시: 36 재측정 3(`8a283d9`)에서 360·390 소스 줄이 선택 칩 보이기로 처음부터 `scrollLeft 138` 이 되어 맨 앞 `★ Must-Read` 칩과 구분선이 왼쪽 밖으로 숨는데, 표시가 오른쪽(`end`·`both`)에만 있어(`ScrollRow.tsx:318,368-379`) 왼쪽에 칩이 있다는 단서가 없었다. 규칙:
  1. 768 미만에서 넘친 쪽마다 표시를 하나씩 둔다: `start` 는 왼쪽 `‹`(`ChevronLeft`), `end` 는 오른쪽 `›`(`ChevronRight`), `both` 는 둘 다. 넘치지 않는 쪽에는 없다. 768 이상은 표시 대신 스크롤 버튼(지금 규칙)이다.
  2. 표시는 스크롤 줄 **밖** 감싸개의 형제다: 왼쪽 표시는 줄 앞, 오른쪽 표시는 줄 뒤. `aria-hidden="true"`, `pointer-events-none`, 포커스를 받지 않는다. 속성 `data-overflow-hint="start"` / `"end"` (값 없는 `[data-overflow-hint]` 선택자로도 잡힌다). 줄·칩 위에 겹쳐 그리지 않는다 (`absolute` 배치 금지, ui-audit `occluded`).
  3. 크기: 표시 폭 16px(`w-4`, 아이콘 `size-4`), 표시와 줄 사이 간격 0 (감싸개 `gap-1` 을 표시 쪽 음수 여백 `-mr-1`/`-ml-1` 로 상쇄).
  4. `bleed` 와의 관계 (좌우 같은 규칙, 지금의 오른쪽 규칙을 왼쪽에도): 표시가 보이는 쪽에 `bleed` 가 있으면 줄은 그쪽으로 늘지 않고(그쪽 `-m*-4 p*-4` 를 빼고) 표시가 그쪽 페이지 여백 16px 를 쓴다(왼쪽 표시 `max-md:-ml-4`, 오른쪽 표시 `max-md:-mr-4`). 그래서 표시 16px 가 여백 16px 를 정확히 채우고 줄 상자는 콘텐츠 가장자리에서 시작·끝난다. 줄의 패딩이 빠지는 만큼 상자도 같은 폭만큼 좁아지므로 칩의 화면 위치는 표시가 나타나고 사라질 때 움직이지 않는다. `bleed` 가 없는 쪽(소스 줄 오른쪽, `bleed` 없는 줄의 양쪽)은 표시가 줄과 이웃 컨트롤(정렬 선택창 등) 사이에 놓여 줄이 16px 좁아진다. 이때 스크롤하다 그쪽 표시가 나타나고 사라지며 칩이 16px 씩 움직이지 않게, 줄이 넘치는 동안(`data-overflow` ≠ `none`) `bleed` 없는 쪽에는 표시 자리를 늘 잡아 두고 그쪽이 넘치지 않을 때는 아이콘만 숨긴다 (`invisible`, 속성은 `data-overflow-hint` 대신 `data-overflow-slot`, `aria-hidden`). 그래서 줄 폭은 넘침이 생기고 없어질 때만 바뀐다. 표시가 없는 쪽의 `bleed` 는 그대로다.
  5. 결과 (`bleed` 별 768 미만 클래스): `none` → `bleed` 그대로. `end` → 왼쪽 `bleed` 만(지금과 같음). `start` → 오른쪽 `bleed` 만(`true` 일 때. `'start'` 면 늘이지 않음). `both` → 늘이지 않음.
  6. 처음 상태: 선택 칩 보이기(위 '포커스')는 그대로다. 그래서 줄은 처음부터 `start`·`both` 일 수 있고, 그때 왼쪽 표시가 왼쪽에 숨은 칩의 단서다. (보정 5) `Must-Read` 는 소스 줄 밖 토글로 옮겨 모든 폭 첫 화면에 보인다 (R34, 우려 23 해소).
- 포커스: 줄 안 칩이 포커스를 받으면 `scrollIntoView({ inline: 'nearest', block: 'nearest' })`. 처음 그릴 때와 선택 칩(`aria-pressed="true"`)이 바뀔 때 그 칩이 보이게 스크롤한다 (DOM 만 읽고 상태를 바꾸지 않는다). (보정 4, 31 후속 구현 `ScrollRow.tsx:202-260` 을 spec 에 적음) 선택 칩 다시 보이기: 선택 칩이 바뀐 뒤 사용자가 줄을 직접 스크롤하지 않았으면, 줄 폭(넘침 상태·버튼·표시·화면 폭)이나 줄·칩 크기가 바뀔 때 선택 칩이 흐림 밖에 다 보이도록 다시 맞춘다. 사용자가 직접 스크롤했으면 그 위치를 유지하고 다시 끌어오지 않는다. 새 선택 칩이 생기면 이 구분을 처음부터 다시 한다. 그래서 화면 폭이 바뀌면 사용자가 스크롤하지 않은 줄의 `scrollLeft` 는 바뀔 수 있다 (R33).
- (보정 5, reviewer 재리뷰 Nit 2) '사용자가 직접 스크롤함' 의 정의: 보정 4 는 '이 부품이 둔 값과 1px 넘게 다른 `scroll`' 이었다(`ScrollRow.tsx:225-228`). 이 정의는 브라우저의 범위 자르기(줄이 좁아져 최댓값이 줄면 `scrollLeft` 가 잘림)와 스냅 재맞춤(`snap-x` 가 가장 가까운 스냅 위치로 다시 맞춤)도 사용자 스크롤로 잘못 보아, 그 뒤 폭이 바뀌어도 선택 칩을 다시 보이게 하지 않는다. 새 정의:
  1. 입력 신호: 줄 감싸개(스크롤 줄, 스크롤 버튼, 넘침 표시를 담은 바깥 감싸개)에서 받은 `pointerdown`, 가로 의도의 `wheel`, `touchstart`, `keydown`, 스크롤 버튼 클릭, 줄 안으로의 포커스 이동(`focusin`, 그 뒤 `scrollIntoView`). (보정 6, reviewer 최종 확인 Nit 2) `wheel` 은 `Math.abs(deltaX) > Math.abs(deltaY) || shiftKey` 일 때만 신호다. 세로 휠(가로 성분이 세로 이하이고 Shift 없음)은 신호가 아니다: md 이상 sticky 툴바 위에서 페이지를 세로로 휠 스크롤해도 '사용자 조작 중' 이 되지 않아, 그 사이의 브라우저 자르기·스냅 재맞춤 `scroll` 이 사용자 스크롤로 기록되지 않는다. 지금 구현은 방향과 상관없이 `wheel` 을 신호로 센다 (`ScrollRow.tsx:52` `USER_INPUT_EVENTS`).
  2. 입력 신호를 받으면 '사용자 조작 중' 이 된다. 이 상태에서 온 `scroll` 은 사용자 스크롤이고, 그 줄은 '사용자가 스크롤함' 으로 표시된다 (다음 새 선택 칩까지).
  3. '사용자 조작 중' 은 `scrollend` 에서 끝난다. `scrollend` 를 지원하지 않으면 마지막 `scroll` 뒤 150ms 동안 `scroll` 이 없을 때 끝난다. 입력 신호 뒤 1,000ms 안에 `scroll` 이 하나도 오지 않으면 끝난다 (스크롤 없는 탭·클릭).
  4. 입력 신호 없이 온 `scroll`(브라우저 자르기·스냅 재맞춤, 다른 코드의 `scrollLeft` 변경)은 사용자 스크롤이 아니다. 이 부품이 `revealInRow` 로 둔 값의 `scroll`(1px 이내)은 '사용자 조작 중' 이어도 사용자 스크롤이 아니다. 이 부품이 '스크롤 버튼 포커스 유지'(위)로 옮긴 포커스의 `focusin` 은 입력 신호가 아니다.
  5. 입력 신호 판정은 상태가 아니라 ref 로 한다 (다시 그리지 않는다, `react-hooks/set-state-in-effect`).
- 같은 규칙을 쓰는 곳: 피드 `카테고리`·`소스`, 요약 바 급상승 칩, 챗 맥락 줄(`ChatContextBar` 의 스크롤 영역을 `ChipGroup` 감싸개 규칙으로), Ask AI `빠른 질문`.

#### 14.4 뉴스 카드 (`NewsCard`, R17~R19)
- 고정 틀 (위에서 아래, `Card` 는 `h-full flex flex-col gap-3`, 그리드 줄 안 카드는 같은 높이):
  1. **머리줄** `data-card-meta` (`flex items-center gap-2`, 높이 모바일 44px·md 이상 32px): 왼쪽 `min-w-0 flex-1 truncate text-xs text-fg-subtle` 한 줄에 `카테고리 짧은 라벨`(`font-medium text-fg-muted`) · 소스 · 시간. 오른쪽 북마크 `IconButton`(음수 마진 없음, 세로 가운데). 배지를 두지 않는다.
  2. **제목** `h3 > button`: `text-base font-semibold leading-6 line-clamp-2 min-h-12` (2줄 = 48px 고정).
  3. **본문** `p`: `text-sm leading-6 text-fg-muted line-clamp-2 min-h-12`. 시사점이면 `border-l-2 border-accent pl-3` 과 앞머리 `시사점`(`font-semibold text-fg`), 요약이면 그대로. 둘 다 없으면 빈 2줄 자리를 둔다.
  4. **배지 줄** (있을 때만, `data-card-badges`): `flex flex-nowrap gap-1.5 overflow-hidden`, `Must-Read`(`Badge warning`, 별 아이콘) 1개 + 기술 스택 `Badge neutral` 최대 3개. 줄어드는 규칙은 아래 '배지 줄 (리뷰 후속)'.
  5. **바닥** (`mt-auto border-t pt-2`): 왼쪽 통계 — 점수(별), 댓글, 인기(`Flame`, `hotness_score > 25` 일 때 반올림 값, `sr-only` `인기 점수`). (보정 7·8) 점수·개수는 R36, 인기는 R41 규칙을 따른다: 원천 지표가 있는 소스만 점수와 인기를 그린다 (14.15 F3, 14.16). 오른쪽 `챗에서 분석`, `원문`. 1024~1279 3열(카드 안쪽 약 266px)에서는 `챗에서 분석` 을 아이콘만 보인다 (접근 이름 `전용 챗에서 분석` 유지).
- 배지 수: 지금 카드당 최대 7개(메타 3 + 기술 4)·두 줄 → 최대 4개·한 줄. 머리줄 배지 0개.
- 배지 줄 (리뷰 후속, R16·R17): 2차 구현은 배지 줄 `overflow-hidden` 안에서 `Badge` 가 늘 `shrink-0`(`Badge.tsx:24`)이고 글자 감싸개에 `min-w-0` 이 없어(`NewsCard.tsx:146-158`) 기술 배지의 `max-w-32`·`truncate` 가 줄어들지 못한다. 1024 3열 카드 안쪽 약 266px 에서 Must-Read + 긴 기술 3개면 마지막 배지가 약 20px 글자 중간에서 잘린다 (리뷰 측정). 이것은 R16 과 충돌하므로 다음으로 바꾼다:
  - `Badge` 에 `shrink?: boolean`(기본 `false`)을 더한다. `false` 면 지금처럼 `shrink-0 max-w-full`. `true` 면 그 둘 대신 `shrink` 만 붙이고, 폭 한계(`min-w-*`, `max-w-*`)는 호출자가 `className` 으로 준다. `cn` 은 Tailwind 충돌을 풀지 않아(`lib/cn.ts:4-8`) 같은 속성 클래스 둘(`shrink-0`과 `shrink`, `max-w-full` 과 `max-w-32`)이 함께 붙으면 어느 쪽이 이길지 생성 CSS 순서에 달리므로, 같은 속성 클래스를 두 번 붙이지 않는 것이 이 prop 의 목적이다. 다른 `Badge` 사용처는 바뀌지 않는다.
  - 기술 배지: `<Badge shrink className="min-w-12 max-w-32" title={tech}><span className="min-w-0 truncate">{tech}</span></Badge>`. 배지의 최소 폭을 `min-w-12` 로 명시하는 이유: 지정하지 않으면 flex 항목의 자동 최소 폭이 내용(줄바꿈 없는 글자) 폭이라 줄어들지 않는다. 자리가 모자라면 기술 배지끼리 줄고(`flex-shrink: 1`), 각 배지는 48px 아래로 줄지 않으며, 글자는 말줄임표로 끝난다. 짧은 이름은 글자 폭 그대로다.
  - `Must-Read` 배지는 `shrink` 없이 둔다 (줄지 않음).
  - 들어가는지 계산: Must-Read 약 92px(아이콘 14 + 간격 4 + 글자 약 58 + 좌우 여백 16) + 기술 최소 48 × 3 + 간격 6 × 3 = 약 254px ≤ 266px (1024 3열, 가장 좁은 카드). 360 모바일 1열 카드 안쪽 약 296px, 768 2열 약 312px 는 더 넓다. 계산값이라 실제 렌더는 ui-audit `clip` 이 판정한다.
  - 기술 이름 전체에 닿는 방법: 배지 글자는 DOM 에 전체가 있어 접근 이름이 잘리지 않는다. 마우스는 `title` 툴팁, 모든 사용자는 기사 상세 대화상자의 기술 목록(`NewsDetailModal.tsx:362-366`, 3개 넘는 기술도 모두)으로 본다. 카드에 '+N' 이나 펼침을 더하지 않는다 (카드 고정 틀 유지).
  - 배지 줄의 `overflow-hidden` 은 남긴다 (계산이 어긋날 때 레이아웃이 카드 밖으로 밀리지 않게 하는 안전장치). 이 상자에 배지가 잘리면 ui-audit `clip` ① 이 실패로 잡는다 (14.8 fixture).
  - 단위 테스트 단언 (`NewsCard.test.tsx`, jsdom 은 배치를 계산하지 않으므로 클래스로 단언한다): 배지 줄(`[data-card-badges]`)이 `flex-nowrap`·`overflow-hidden`; 기술 배지마다 `shrink`·`min-w-12`·`max-w-32` 가 있고 `shrink-0`·`max-w-full` 이 없음; 기술 글자 감싸개가 `min-w-0`·`truncate`; Must-Read 배지는 `shrink-0`; `ui/Primitives.test.tsx` 또는 새 단언으로 `Badge shrink` 가 `shrink-0`·`max-w-full` 을 붙이지 않음; 기술 배지 `title` 이 기술 이름 전체. 기존 단언(기술 최대 3개, 머리줄에 배지 없음)은 그대로다.
- 반복 시사점(R18): 새 `lib/feed-insights.ts` 의 `findRepeatedInsights(items: NewsItem[]): Set<number>` — `why_it_matters` 를 공백 정리한 문자열의 끝 40자를 키로 세어, 20자 이상이고 키가 2번 이상 나온 기사 id 를 돌려준다 (끝을 보는 이유: backend 가 `{기술} 기반 구현에서 ` 접두를 붙인 변형도 같은 고정 문장으로 끝난다). `page.tsx` 가 현재 `news` 로 계산해 `NewsCard preferSummary` 로 넘긴다. `preferSummary` 이고 `summary` 가 있으면 요약을 그린다. 기본값 `false` (기존 단언 유지).
- 라벨(R19): `lib/labels.ts` 에 `CATEGORY_LABELS`(긴 라벨, 필터 칩과 같은 문구)와 `CATEGORY_SHORT_LABELS`(짧은 라벨), `categoryLabel()`, `categoryShortLabel()` 를 둔다. `FeedToolbar` 의 `FEED_CATEGORIES` 라벨, `FocusCapsule` 의 표, `ActiveSourceChip`, `CitationPopover`, `NewsCard`, `NewsDetailModal` 이 이 모듈만 쓴다. `SourcesListTab` 의 카테고리 선택지는 긴 라벨을 쓴다. 모르는 id 는 원값 그대로 (지금 규칙). `FocusBottomSheet` 표는 테스트가 문구를 고정해 그대로 둔다 (우려 18). (보정 7, R40) `FocusBottomSheet` 도 이 모듈의 긴 라벨과 `ALL_CATEGORY_LABEL` 을 쓴다 (14.15 C4, 우려 18 닫음).
- `NewsCardSkeleton` 을 같은 틀(머리줄 1, 제목 2, 본문 2, 바닥 1)로 맞춰 로딩 → 카드 전환 때 높이가 흔들리지 않게 한다.

#### 14.5 요약 바·세로 간격·다시 읽기 (`InsightsBar`, `useNewsFeed`, R20·R22)
- 브리핑 버튼: `오늘의 브리핑` · 날짜(`max-md:hidden`) · 헤드라인. 768 미만에서는 `오늘의 브리핑 · {헤드라인}` 이 한 줄 말줄임이다.
- 급상승 칩: `hidden lg:flex` (1024 이상). 768~1023 은 `트렌드` 버튼만.
- 감싸개를 `flex flex-col gap-3` 으로 바꾼다. 숨긴 패널(`hidden`)은 flex 항목이 아니어서 여백을 만들지 않는다.
- 스켈레톤: `useNewsFeed` 의 `loadingRadar` 를 '한 번도 읽지 못함'(`statsLoadedFor === -1`)일 때만 true 로 바꾼다. 다시 읽는 동안에는 이전 브리핑·레이더를 그대로 그린다.
- 통계·브리핑·레이더를 `Promise.allSettled` 로 읽어 하나가 실패해도 나머지를 반영한다 (01 알려진 위험).
- 카드 그리드: 피드 응답에 목록 키(`category, source, search, sort, highSignalOnly, page`)와 다시 읽기 번호를 따로 둔다. `loading` 은 '지금 목록 키의 응답이 아직 없음' 일 때만 true 다. 같은 목록 키를 다시 읽는 동안에는 이전 `items`·`total`·`totalPages` 를 그린다. 다시 읽기가 실패하면 목록을 지우지 않고 `showToast({ tone: 'danger' })` 로 알린다. 목록 키가 바뀐 요청의 실패는 지금처럼 `ErrorState`.
- 목표 간격 (R20, `vRhythm`): 요약 바 아래 끝 → 툴바 첫 줄 위 끝, 툴바 마지막 줄 아래 끝 → 상태 줄 위 끝이 모두 12~16px (모바일 12, md 이상 16).

#### 14.6 챗 화면 (R21·R23·R24)
- 한국어 줄바꿈: `globals.css` `@layer base` 의 `body` 에 `word-break: keep-all; overflow-wrap: break-word;` 를 둔다 (한국어는 어절 단위, 긴 토큰은 넘칠 때만 끊김). 마크다운(`.markdown-viewer`)·코드(`font-mono`, `break-all`)는 지금 클래스가 이긴다 (11.2 의 클래스 단언 유지).
- 추천 질문 카드(`ChatMessageList.tsx:67-73`): 버튼에 `text-left` 를 직접 둔다.
- 열 맞춤: 맥락 줄 스크롤 영역, 메시지 열, 입력 영역이 같은 규칙(`mx-auto w-full max-w-3xl`, 바깥 `px-4 md:px-6`)을 쓴다. 사이드바 머리 영역을 두 줄로 나눈다: 1줄 56px(`+ 새 대화`, 접기 버튼) — 챗 헤더와 같은 높이, 2줄 44px(`대화 검색`) — 맥락 줄과 같은 높이, 아래 경계 100px.
- 알림 위치(R23, B): 14.7 C-2.
- 기록 버튼 `aria-controls`(R24): 14.7 C-1.

#### 14.7 알려진 문제 8행 (C, known-issues 'UI·접근성')
| 행 | 근거 문서 | 원인 | 설계 | 요구사항 |
|---|---|---|---|---|
| C-1 접힌 사이드바에서 기록 버튼 `aria-controls` 가 없는 요소를 가리킴 | 02-ai-chat.md CHAT-07 예외·엣지 | `ChatHeader.tsx:111` 이 늘 `chat-history-sidebar`/`chat-history-drawer` 를 단다. `ChatSidebar.tsx:48-50` 은 접히면 `null`, 드로어는 열릴 때만 포털로 그린다 | `aria-controls` 는 `isHistoryOpen` 일 때만 단다 (`aria-expanded` 는 늘). 같은 규칙: `Tabs` 는 패널이 렌더된 탭(선택된 탭, 또는 `TabPanel active` 로 숨겨 둔 패널)에만, `DailyBriefingModal` `이메일 발송` 은 폼이 열렸을 때만, `SourcesListTab` `새 피드 직접 등록` 은 폼이 열렸을 때만 | R24 |
| C-2 챗 경고 토스트가 입력창 위가 아니라 전역 알림 영역에 뜸 | 02-ai-chat.md, spec 설계 6 | `Toast.tsx:92-124` 는 처음 마운트된 `ToastRegion` 하나만 그린다. `layout.tsx` 의 것이 먼저라 `ChatWorkspace.tsx:765` 의 것은 그려지지 않는다 | `ToastRegion` 에 `placement?: 'global' \| 'composer'`(기본 `global`). 그릴 영역 고르기: 오버레이 스택에 모달이 없고 `composer` 영역이 등록돼 있으면 가장 나중에 등록된 `composer` 영역, 아니면 처음 등록된 `global` 영역 (`global` 끼리는 지금 규칙, `Toast.test.tsx` 유지). `composer` 영역은 포털 없이 그 자리에 그린다: `ChatWorkspace` 가 입력 영역을 `relative` 감싸개로 싸고(입력 영역의 `overflow-x-hidden` 상자 밖), 영역은 `absolute inset-x-0 bottom-full mb-2 z-60`, 안쪽은 메시지 열과 같은 `mx-auto max-w-3xl px-4 md:px-6`. 알림 접근성 속성·닫기 버튼·시간은 그대로. (리뷰 후속) 그리는 영역이 바뀌면 남은 알림이 새 영역에서 다시 마운트되고, live 속성을 가진 요소가 새로 들어오면 스크린리더가 같은 알림을 한 번 더 읽는다 (`Toast.tsx:189-205`). 그래서 알림은 처음 그려진 한 번만 live 다. 그 영역이 그리기를 한 번이라도 넘겨준 뒤(다른 영역이 그 알림을 그린 뒤)에는 어느 영역에서도, 처음 알린 영역으로 돌아와도 live 속성 없이 그린다. 모듈 저장소에 `announcedBy: Map<알림 id, 영역 id \| null>` 을 둔다 (값 `null` = 넘겨줌, 이후 늘 조용함). 영역은 알림을 그린 뒤 `useEffect` 에서 기록을 고친다: 기록이 없으면 자기 영역 id 를 적고, 기록이 다른 영역 id 면 `null` 로 바꾼다 (`null` 이면 그대로). 알림 요소는 기록이 없거나 기록이 자기 영역 id 일 때만 `role`(`status`/`alert`)·`aria-live` 를 갖는다. 기록이 다른 영역 id 이거나 `null` 이면 live 속성 없이(글자·아이콘·닫기 버튼은 같게) 그린다. 예: `composer` 에서 알림 → 모달이 열려 `global` 이 그림(조용함, 기록 `null`) → 모달이 닫혀 `composer` 가 다시 마운트해 그림(조용함). 알림이 닫히면(`dismissToast`, `clearToasts`) 그 id 를 지운다. 새로 뜬 알림은 처음 그리는 영역에서 지금처럼 알린다. (보정 2: 32단계 구현 `8a46693` 은 '기록이 없거나 자기 영역 id 면 live' 규칙이라, 기록이 처음 영역 id 로 남아 있어 왕복 뒤 `composer` 가 live 로 다시 마운트해 한 번 더 읽혔다) | R23 |
| C-3 챗 기사 칩이 카테고리 원값을 보임 | 02-ai-chat.md CHAT-17 | `ActiveSourceChip.tsx:35` 가 `source.category` 를 그대로 그린다 | `categoryShortLabel(source.category)` (14.4 라벨) | R19 |
| C-4 요약 바가 통계를 다시 읽을 때마다 스켈레톤으로 깜빡임 | 01-news-feed.md NEWS-14 예외·엣지, 알려진 위험 | `useNewsFeed.ts:38` `loadingRadar = statsLoadedFor !== statsReload`, `InsightsBar.tsx:37-39` | 14.5 (첫 로드만 스켈레톤, `allSettled`, 카드 그리드도 이전 내용 유지) | R22 |
| C-5 부모·자식 대화상자를 같은 렌더에서 열면 자식이 스택 아래에 깔림 | design-system.md 6.1·10.2 | `overlay-stack.ts:184-193` 이 `useEffect` 에서 `push` 해 맨 뒤에 붙인다. React 는 자식 effect 를 부모보다 먼저 돌린다 | 레이어에 `order` 를 둔다. `useOverlayLayer` 가 `open` 이 false→true 로 바뀌는 렌더에서 모듈 카운터로 번호를 받는다 (렌더 중 이전 값 비교 패턴, 부모가 자식보다 먼저 렌더되므로 부모 < 자식). `push` 는 맨 뒤가 아니라 `order` 오름차순 자리에 넣는다. 맨 위·`inert`·Escape 는 정렬된 스택을 본다. 다시 열면 새 번호(맨 위). design-system 6.1 의 '부모가 열린 뒤 사용자 동작으로 연다' 제약을 지운다 | R25 |
| C-6 Ask AI 입력 중 Escape 로 대화상자가 닫히고 대화가 사라짐 | 07-ui-common.md UI-08 예외·엣지, 알려진 위험 1 | 오버레이 스택은 대상 요소를 보지 않는다(`overlay-stack.ts:34-42`). 닫으면 `NewsDetailModal.tsx:50-61` 이 기록을 지운다 | `AskAiPanel` 의 질문 입력 `onKeyDown`: `Escape` 이고 IME 조합 중이 아니면 `preventDefault()` 하고 포커스를 Ask AI 탭 패널(`tabIndex={-1}`)로 옮긴다. 스택은 `defaultPrevented` 인 Escape 를 무시한다(`overlay-stack.ts:37`, 이미 있음). 입력 글자와 기록은 그대로다. 다음 Escape(입력창 밖)는 지금처럼 닫는다. 닫을 때 기록을 지우는 기존 규칙(NEWS-10)은 바꾸지 않는다 | R26 |
| C-7 수집 중 `/` 를 떠났다 오면 진행 표시가 사라지고 `즉시 수집` 으로 중복 요청 | 07-ui-common.md UI-02, 알려진 위험 2 | `useCollector.ts:143-163` 이 마지막 구독자가 빠지면 상태를 처음으로 되돌리고, 다시 구독할 때 진행 여부를 묻지 않는다 | backend 를 바꾸지 않고 이미 있는 응답을 쓴다: ① `loadStatus` 가 받은 `status.is_running` 이 true 이고 진행 폴링이 없으면 `startProgressPolling('실시간 소식 수집 중...')` 으로 이어 붙인다 (`isCollecting: true` → `즉시 수집` 은 `loading`). ② `collectNow` 가 `triggerManualCollect()` 응답 `status === 'already_running'` 이면 그 `message` 로 폴링을 시작한다 (backend `schedule.py:51-58` 가 이미 중복 실행을 막는다). ③ `resetAndCollect` 가 `status === 'already_running'` 이면 응답 `message` 로 오류를 던져 확인 창 `InlineAlert` 에 보인다 (`기존 0건 삭제 완료` 로 잘못 알리지 않는다). ④ (리뷰 후속) 오래된 상태 응답 버리기: 30초 상태 요청(`SCHEDULE_REFRESH_MS`, `useCollector.ts:21,148`)이 수집 중일 때 나가고, 그 응답(`is_running: true`)이 진행 폴링이 완료를 보고 멈춘 뒤(`:118-123`) 도착하면, `loadStatus`(`:93-103`)가 `progressTimer === null` 을 보고 폴링을 다시 켜 다음 진행 응답에서 `수집 완료` 를 또 알린다. 모듈 변수 `statusSeq`(상태 요청마다 1 증가, 요청 번호로 캡처), `appliedStatusSeq`(마지막으로 반영한 응답의 번호), `progressEndSeq`(진행 폴링이 완료·실패로 끝날 때의 `statusSeq`)를 둔다. 응답 번호가 `appliedStatusSeq` 보다 작거나 `progressEndSeq` 이하이면 상태도 폴링도 바꾸지 않고 버린다. 완료 처리 안에서 부르는 `loadStatus()` 는 `progressEndSeq` 를 정한 뒤에 보내므로 반영된다. `stopAll` 의 `generation` 규칙은 그대로다 | R27 |
| C-8 Ask AI 답변 복사가 실패해도 알림이 없음 | 07-ui-common.md UI-13, 알려진 위험 3 | `NewsDetailModal.tsx:194-200` 이 `copyText` 가 false 면 아무것도 하지 않는다 | `NewsDetailModal` 이 `copyFailedIndex` 상태를 두고 실패하면 2,000ms 동안 그 번호를 넘긴다. `AskAiPanel` 새 선택 prop `copyFailedIndex?: number \| null`: 그 답변의 복사 버튼이 경고 아이콘 + `복사 실패`, 버튼 옆 `sr-only` `aria-live="polite"` 영역에 같은 문구 (UI-13 의 `useCopyToClipboard` 와 같은 문구·시간) | R28 |

- backend 변경이 필요한 행은 없다. C-7 의 MCP 서버 수집 공유는 backend 문제라 범위 밖이다 (우려 16).

#### 14.8 ui-audit 판정 강화 (`frontend/scripts/ui-audit.mjs`, R29~R31)
기존 R3~R9 측정은 그대로 두고 아래 검사를 더한다. 검사마다 `report.json` 의 조합 `checks.<이름>` 에 `pass`, `failures[]`(요소 경로·이름·rect·이유)를 남긴다. 기준값(1px 허용 등)은 스크립트 상단 상수로 둔다.

| 검사 | 대상 | 판정 (실패 조건) |
|---|---|---|
| `clip` | 보이는 조작 요소(`button`, `a[href]`, `input`, `select`, `textarea`, `role` 이 `tab`·`switch`·`menuitem`·`menuitemradio` 인 요소)와 글자를 가진 요소(자기 텍스트 노드가 있는 요소) | ① 조상 중 `overflow` 가 `visible` 이 아닌 상자 밖으로 1px 넘게 나감 (단, 조상이 `data-scroll-row` 이면 모든 폭에서, 스크롤바가 보이는 가로 스크롤 영역이면 768 이상(`K.scrollButtonMinWidth`)에서만 가로는 `scrollRow` 가 봄. 보정 6: 768 미만과 macOS 기본 설정은 오버레이 스크롤바라 스크롤하기 전에는 스크롤바가 보이지 않으므로 면제하지 않는다, 30 후속 3 구현 `ui-audit.mjs:795-797` `hExempt` 와 같음) ② 화면 밖(`left < -1` 또는 `right > innerWidth + 1`, 스크롤 줄 안 제외) ③ 글자 넘침: `scrollWidth > clientWidth + 1` 인데 `text-overflow` 가 `ellipsis` 가 아님, 또는 `scrollHeight > clientHeight + 1` 인데 `-webkit-line-clamp` 가 없음. `sr-only`(1px)·`.markdown-viewer` 안 코드·표는 뺀다. ④ (리뷰 후속) 스크롤 영역 상자의 잘림: 조상을 거슬러 오르다 어떤 축의 스크롤 영역(`overflow-x`/`overflow-y` 가 `auto`·`scroll`)을 지나면, 그 축에서는 요소 rect 대신 **그 스크롤 영역의 rect** 를 더 바깥 조상과 계속 비교한다 (지금은 그 축의 비교를 멈춘다, `ui-audit.mjs:708-742`). 바깥 조상이 그 축에서 `visible` 이 아니고 스크롤 영역이 아니며(중첩 스크롤은 바깥이 스크롤로 닿게 하므로 뺀다) 스크롤 영역 rect 가 그 패딩 상자 밖으로 1px 넘게 나가면 실패 '스크롤 영역이 부모 상자 밖으로 세로/가로 잘림' 이다. 실패는 스크롤 영역 요소에 한 번만 남긴다 (그 안 요소마다 중복하지 않는다). 대표 원인: flex 열 안의 중간 감싸개에 `min-h-0`(가로는 `min-w-0`)이 없어 스크롤 영역이 내용 높이만큼 커지고 바깥 `overflow:hidden` 상자에 잘려 아래 내용에 닿을 수 없음. 768 미만 `bleed` 줄처럼 의도한 가로 스크롤 줄 자체(`data-scroll-row`)의 가로 비교는 ① 의 면제를 그대로 따른다 |
| `placeholder` | 값이 빈 `input`·`textarea` 의 자리표시 | canvas `measureText`(계산된 `font`)로 잰 너비 > `clientWidth − padding` + 1 (한 줄 입력) |
| `occluded` | 보이는 조작 요소 중 화면·스크롤 줄 보이는 범위 안에 있는 것 | 가운데와 네 모서리 안쪽 4px 다섯 점의 `document.elementFromPoint` 가 그 요소나 자손이 아님 (형제·다른 레이어에 가려짐). 열린 대화상자가 있으면 맨 위 대화상자 안 요소만 본다 |
| `rowAlign` | `[data-feed-card]` (`/`, 768 이상) | top 이 2px 안인 카드를 한 줄로 묶어, 줄 안 `h3` top 차 > 1px, 카드 높이 차 > 1px, `[data-card-meta]` 의 자식 rect top 이 두 값 이상(줄바꿈) 중 하나면 실패 |
| `scrollRow` | `[data-scroll-row]` | 넘침(`scrollWidth > clientWidth + 1`)인데 `data-overflow` 가 실제 스크롤 위치와 다르거나 `none`, 768 이상에서 넘친 쪽 스크롤 버튼이 안 보임, 넘치지 않는데 `mask-image` 가 `none` 이 아님. 1440 에서 그룹 `카테고리`·`소스` 가 넘치면 실패 (R14). (보정 3) 768 미만: 넘친 쪽마다 같은 감싸개 안에 그 쪽 표시(`[data-overflow-hint="start"]` 는 줄 왼쪽 끝보다 왼쪽, `"end"` 는 오른쪽 끝보다 오른쪽)가 보이지 않음, 넘치지 않은 쪽에 표시가 있음, 표시 rect 가 줄 rect 와 1px 넘게 겹침 중 하나면 실패. 모든 폭: 처음 상태(측정 전 사용자 조작 없음)에서 줄의 선택 칩(줄의 `data-selected-selector` 속성 값으로 찾음, `ScrollRow` 가 `selectedSelector` 를 그대로 단다)이 줄 보이는 상자에서 넘친 쪽 흐림 24px 를 뺀 범위 밖으로 1px 넘게 나가면 실패. 줄의 계산된 `scroll-padding-left/right` 가 24px 가 아니면 실패 |
| `ariaControls` | `[aria-controls]` | 참조한 id 중 하나라도 문서에 없음 |
| `keepAll` | `.markdown-viewer` 밖, 한글이 있고 두 줄 이상으로 그려진 요소 (`Range.getClientRects()` 의 top 이 둘 이상) | 계산된 `word-break` 가 `keep-all` 이 아님 |
| `vRhythm` | `/` | 요약 바 → 툴바, 툴바 → 상태 줄 세로 간격이 12~16px 밖 |
| `chatAlign` | `/chat`, 1024 이상 | 사이드바 머리 영역 아래 경계와 맥락 줄 아래 경계 차 > 1px, 맥락 줄 첫 조작 요소·메시지 열·입력창의 왼쪽 끝 차 > 1px. 첫 조작 요소가 칠해진 위젯 상자 안에 있으면 그 상자의 왼쪽 끝을 쓴다. (리뷰 후속) '칠해진' 판정의 배경색은 표기와 상관없이 알파가 0 이면 칠하지 않은 것으로 본다: `transparent`, `rgba(…, 0)`, `rgb(… / 0)`, `rgb(… / 0%)`, `color(srgb … / 0)`, `oklab(… / 0)`, `oklch(… / 0)`, `hsl(… / 0)`, `#rrggbb00`, `#rgb0` 등. 계산된 색 문자열에서 알파 성분(`/` 뒤 값, 또는 쉼표 표기의 넷째 값, 또는 16진 표기의 알파 자리)을 읽어 0(또는 0%)이면 투명이다 (지금은 `rgba(…, 0)` 정규식 하나뿐, `ui-audit.mjs:1014`). 알파를 읽을 수 없는 표기는 칠한 것으로 본다 |
| `toast` | `/chat?sourceId=999999999` (없는 기사 → 경고 알림) | 알림 아래 끝 > 입력 영역 위 끝 + 1, 또는 간격 > 16px, 또는 768 이상에서 메시지 열 좌우 밖 |

- 측정 상태를 늘린다: 기존 `/`·`/chat`·대화상자 상태 9개(`DIALOGS`: 7종 + 겹친 브리핑·연동 설정 + 초기화 확인 창, 뉴스 상세는 `AI 요약` 탭과 `Ask AI 질의응답` 탭 둘 다)에 더해 `/` 레이더 펼침, `/chat?sourceId={첫 카드 id}`(맥락 줄 기사 칩), `/chat?sourceId=999999999`(경고 알림). 각 상태에서 `clip`, `placeholder`, `occluded`, `scrollRow`, `ariaControls`, `keepAll` 을 돌린다.
- 환경(R31): 프로덕션 빌드(`make docker-up` 이미지, 또는 `cd frontend && pnpm build && pnpm start -p 3001`)를 대상으로 한다. 페이지에 `nextjs-portal` 요소가 있으면 '개발 서버' 환경 오류로 종료 2. `report.json` 에 `environment: { devIndicator, base, chrome, commit }` 를 남긴다 (`commit` 은 `--commit` 인자 또는 `git rev-parse HEAD`).
- 스크린샷(R31): `--screenshots key` 를 `/`·`/chat` × 5개 폭 × 2테마 20장 + 뉴스 상세·일일 브리핑 × 390·1440 라이트 4장으로 바꾼다.
- 자체 검증(R30 ①): `--self-test` 는 `frontend/scripts/ui-audit-fixtures/defects.html` 과 `clean.html` 을 `page.setContent` 로 연다. `defects.html` 에는 검사마다 하나씩 고정 결함(부모에 잘린 칩, 선택창에 가린 칩, 말줄임 없는 넘침, 긴 자리표시, 메타 줄바꿈으로 어긋난 카드 두 개, 표시 없는 스크롤 줄, 없는 id 를 가리키는 `aria-controls`, `keep-all` 없는 두 줄 한국어 버튼)을 `data-expect="<검사 이름>"` 으로 표시한다. 모든 표시 요소에서 해당 검사가 실패하고 `clean.html` 에서 모든 검사가 통과해야 종료 0. fixture 는 `frontend/src/**` 밖이라 앱 번들·`TokenGuard` 대상이 아니다.
- (리뷰 후속, R30 ①) fixture 추가. 고정 결함은 `data-expect="clip"` 으로 표시하고 각각 아래 실패를 내야 한다. `clean.html` 에는 같은 구조의 고친 형태를 넣고 실패 0 이어야 한다.

  | fixture | `defects.html` (실패해야 함) | `clean.html` (통과해야 함) |
  |---|---|---|
  | 세로로 잘린 스크롤 영역 | 바깥 `display:flex; flex-direction:column; height:200px; overflow:hidden` > 머리 40px + 중간 감싸개 `flex:1; display:flex; flex-direction:column`(`min-height` 없음) > 스크롤 영역 `flex:1; overflow-y:auto`(`data-expect="clip"`) > 높이 600px 내용과 맨 아래 버튼. 판정 ④ 세로 | 중간 감싸개에 `min-height:0` |
  | 가로로 잘린 스크롤 영역 | 바깥 `display:flex; width:300px; overflow:hidden` > 중간 감싸개 `flex:1`(`min-width` 없음) > 스크롤 영역 `overflow-x:auto`(`data-scroll-row` 없음, `data-expect="clip"`) > 칩 8개(합 약 600px). 판정 ④ 가로 | 중간 감싸개에 `min-width:0` |
  | 잘린 배지 줄 | 폭 266px `display:flex; flex-wrap:nowrap; gap:6px; overflow:hidden` 줄(`data-expect="clip"`) > Must-Read 배지 + 기술 배지 3개(긴 이름, `flex-shrink:0; max-width:128px`, 글자 감싸개 `overflow:hidden; text-overflow:ellipsis; white-space:nowrap` 이고 `min-width` 없음) — 2차 `NewsCard` 배지 줄 구조. 판정 ① 가로 | 기술 배지 `flex-shrink:1; min-width:48px; max-width:128px`, 글자 감싸개 `min-width:0` (14.4 배지 줄) |
  | 알파 0 배경 위젯 (`chatAlign`) | — (칠한 위젯 상자 결함은 기존 fixture) | `chatAlign` 은 페이지마다 맥락 줄 하나만 보므로(`ui-audit.mjs:995-999`) 기존 맥락 줄의 칠한 `role="group"` 위젯(`clean.html:151`)을 알파 0 배경 감싸개 두 겹으로 싼다: 바깥 `role="toolbar"` 에 `background-color: color(srgb 1 1 1 / 0)`, 안쪽 `role="radiogroup"` 에 `background-color: oklab(0 0 0 / 0)`, 둘 다 `padding-left:4px`. 칠한 위젯의 왼쪽 끝은 메시지 열·입력 영역과 맞추고, 감싸개는 4px·8px 왼쪽에 둔다. 감싸개를 칠한 것으로 잘못 보면 왼쪽 끝이 어긋나 실패하므로, 통과가 두 표기를 투명으로 본다는 증명이다 |
| (보정 3) 왼쪽 표시 없는 줄 (`scrollRow`) | 768 미만 폭으로 연 페이지(`--self-test` 는 fixture 를 360 폭으로도 연다)에서 `scrollLeft` 를 중간에 둔 넘친 줄(`data-overflow="both"`)에 오른쪽 표시만 있음 (3차 구조) | 왼쪽·오른쪽 표시 둘 다, 표시 쪽 `bleed` 없음 |
| (보정 3) 줄을 덮는 표시 (`scrollRow`, `occluded`) | 표시를 `absolute` 로 줄 오른쪽 끝 위에 겹침 | 표시가 줄 뒤 형제 |
| (보정 3) 흐림에 겹친 선택 칩 (`scrollRow`) | `scroll-padding-left:16px`, 흐림 24px, 선택 칩이 스냅 위치(칩 왼쪽 − 16)에 선 줄 (31 후속 2 구조) | `scroll-padding: 0 24px`, 선택 칩이 칩 왼쪽 − 24 에 선 줄 |
| (보정 5) 숨은 Must-Read (`scrollRow` 툴바 증거) | `[data-feed-toolbar]` 안 소스 줄(`role="group" aria-label="소스"`) 첫 칩으로 `data-must-read-toggle` 버튼을 두고 줄을 `scrollLeft` 138 로 민 구조 (3차·보정 3 구조). `data-expect="scrollRow"` 는 툴바에 | 같은 툴바에서 토글이 소스 줄 밖, 줄과 정렬 선택창 사이 형제 |
- (보정 3, 보정 5 로 바꿈) `/` 처음 상태 Must-Read 증거: 보정 3 의 소스 줄 항목 `{ mustReadHidden, startHint }`(`ui-audit.mjs:1004-1011`, 소스 줄 안에서 `Must-Read` 버튼을 찾음)를 지우고, 5개 폭 × 2테마 `/` 처음 상태마다 `checks.scrollRow.toolbar = { viewport, mustReadVisible, mustReadRect }` 를 남긴다 (이 판정은 `[data-feed-toolbar]` 가 있는 페이지 — `/` 와 fixture — 에서 돈다). `mustReadVisible` = `[data-must-read-toggle]` 가 하나 있고, `[role="group"][aria-label="소스"]` 안이 아니며, rect 가 화면(`0 ≤ left`, `right ≤ innerWidth`)과 `[data-feed-toolbar]` 상자 안에 1px 허용으로 다 들고, 가운데 점의 `elementFromPoint` 가 그 토글이나 자손. false 면 실패 '`Must-Read` 토글이 첫 화면에 다 보이지 않음'. 768 미만에서는 토글 rect 가 44×44 이상인지도 본다 (R6). verify 는 이 값과 360·390 라이트 스크린샷을 인용한다.
- (리뷰 후속) 판정 ④ 를 더한 뒤 프로덕션 전체 측정(R29)도 다시 실패 0 이어야 한다. 새로 잡힌 실패는 앱 코드(`min-h-0`·`min-w-0` 누락 등)를 고친다. 배지 줄 결함은 측정 데이터에 Must-Read + 긴 기술 3개 카드가 1024 에 없으면 프로덕션 측정으로는 재현되지 않으므로, verify 는 그 경우를 fixture(R30 ①)와 단위 테스트(14.4)로 증명하고 프로덕션 재현 여부를 따로 적는다.
- 회귀 증명(R30 ②): verify 단계에서 `git worktree add <scratchpad> 1ec8a9b` 로 수정 전 코드를 프로덕션 빌드해 띄우고 강화한 스크립트(현재 브랜치 파일)를 돌려, F1~F4 에 해당하는 실패(1440 `scrollRow`/`clip` 소스 줄, 390 `scrollRow` 카테고리 줄, `placeholder` 검색창, `rowAlign`)가 보고되는지 확인한다. 같은 백엔드 데이터를 쓴다.
- `make check` 에 넣지 않는다 (Chrome·실행 중인 앱 필요, 우려 7·13).

#### 14.9 테스트 (vitest, `frontend/src/tests/`)
- 새 파일: `ui/ChipGroup.test.tsx` (scrollWidth·clientWidth 목 + `ResizeObserver` 목으로 `data-overflow` 네 상태, 넘치지 않으면 마스크 클래스 없음, 스크롤 버튼이 그룹 밖·넘친 쪽에만, 누르면 `scrollBy` 호출, 칩 포커스 시 `scrollIntoView`), `feed/FeedInsights.test.ts` (`findRepeatedInsights`: 같은 문장, 접두 변형, 20자 미만 무시, 한 번만 나온 문장 제외), `hooks/useNewsFeed.test.tsx` (다시 읽기 중 `loading` false·이전 목록 유지, 목록 키 변경 시 `loading` true, 통계 실패해도 브리핑·레이더 반영, `loadingRadar` 는 첫 로드만), `hooks/useCollector.test.ts` (`is_running` 이면 구독 직후 진행 줄·`isCollecting`, `already_running` 응답이면 트리거 1회·폴링 시작, 초기화 `already_running` 이면 오류).
- 추가 단언(기존 파일): `NewsCard.test.tsx`(머리줄 `data-card-meta` 에 배지 없음, 인기 점수는 바닥 `인기 점수`, `preferSummary` 면 요약, 본문 라벨 `시사점`), `feed/InsightsBar.test.tsx`(날짜 `max-md:hidden`, 다시 읽기 중 스켈레톤 없음), `ui/Toast.test.tsx`(`composer` 영역 우선, 모달이 열리면 `global`), `ui/OverlayStack.test.tsx`(같은 렌더 부모·자식 → 자식 맨 위, Escape 한 번에 자식만, 부모 `inert`), `modals/NewsDetailModal.test.tsx`(Ask AI 입력에서 Escape → 대화상자 남음·글자 남음·포커스 패널, 다음 Escape → 닫힘), `AskAiPanel.test.tsx`(`copyFailedIndex` → `복사 실패`), `chat/ChatHeader.test.tsx`(기록 닫힘 → `aria-controls` 없음, 열림 → 있음), `ui/Tabs.test.tsx`(렌더되지 않은 패널의 탭에 `aria-controls` 없음), `chat/ChatMessageList.test.tsx`(추천 질문 버튼 `text-left`), `Header.test.tsx`(`is_running` 상태 복원).
- 바꾸는 단언은 우려 10 의 6줄뿐이다. 나머지 기존 단언은 그대로 통과해야 한다.
- (리뷰 후속) 추가 단언. 기존 단언은 바꾸지 않는다 (우려 20):
  - `ui/ChipGroup.test.tsx` (R15): ① 768 이상·`end` 상태에서 `다음` 버튼에 포커스 → 줄을 끝까지 스크롤한 것으로 목을 바꾸고 `scroll` 이벤트 → `다음` 버튼이 없고 `document.activeElement` 가 `이전` 버튼. ② 같은 상태에서 폭 목을 768 미만으로 바꿔 두 버튼이 사라지면 `document.activeElement` 가 선택 칩. ③ 버튼에서 포커스를 다른 칩으로 옮긴 뒤 버튼이 사라지면 포커스는 그 칩에 그대로. ④ `ChipGroup selectedSelector` 를 넘기면 그 선택자의 칩 기준으로 `scrollLeft` 가 움직이고 기본 선택자의 첫 칩은 무시.
  - `feed/FeedToolbar.test.tsx` (R15·R33): ① `highSignalOnly` + `source='github'` 에서 소스 줄이 `GitHub` 칩이 보이게 스크롤 (칩 rect 목), `Must-Read` 만 켜고 끌 때는 `scrollLeft` 불변. ② 폭 목 360→1024→1440 으로 다시 그려도 검색 입력이 같은 노드이고 포커스·값 유지, 각 스크롤 줄 노드도 같음 (`scrollLeft` 는 단언하지 않는다, 보정 4). ③ 컨트롤 DOM 순서 `카테고리` 그룹 → 검색 → `소스` 그룹 → 정렬. ④ 검색과 카테고리가 같은 `data-toolbar-row`, 소스와 정렬이 같은 `data-toolbar-row`.
  - `NewsCard.test.tsx` (R17): 14.4 '배지 줄' 의 클래스 단언.
  - `ui/Toast.test.tsx` (R23): `danger` 알림이 `composer` 영역에 `role="alert"` 로 뜬 뒤 모달을 열어 `global` 로 옮겨지면 같은 글자의 요소에 `role`·`aria-live` 가 없고 `getAllByRole('alert')` 가 0개, 그 상태에서 새 알림은 `role` 이 있음. 닫힌 알림 id 는 기록에서 지워짐. (보정 2) `composer` → `global` → `composer` 왕복: `composer` 에서 `role="alert"` 로 뜬 `danger` 알림이 모달을 열어 `global` 로 옮겨졌다가 모달을 닫아 `composer` 로 돌아오면, `composer` 영역 안 같은 글자의 요소에 `role`·`aria-live` 가 없고 `queryAllByRole('alert')` 가 0개.
  - `hooks/useCollector.test.ts` (R27): 상태 요청을 붙잡아 둔 채(`is_running: true`) 진행 응답이 `is_running: false` 로 완료 → `수집 완료` 문구 → 붙잡은 상태 응답을 풀어도 `isCollecting` false, 진행 요청 횟수 불변(`PROGRESS_POLL_MS` 몇 번 지나도), 완료 문구가 한 번만 설정됨. 더 나중 요청의 응답이 먼저 반영된 뒤 앞선 응답이 오면 `status` 가 바뀌지 않음.
  - ui-audit 은 vitest 대상이 아니다. `--self-test`(14.8 fixture 표)가 판정 ④·배지 줄·알파 0 판정의 증명이다.

#### 14.10 문서 (`/implement-plan` 이 구현 마지막에 고친다)
- `docs/design-system.md`: 5.1 `ChipGroup` 행(스크롤 줄 규칙, 스크롤 버튼, `bleed`), `Toast` 행(`placement`), 4.x 줄바꿈 기본값(`keep-all`), 5.2 `useScrollOverflow`·`feed-insights`, 6.1 스택 순서(같은 렌더 허용, `order`), 7.1 Escape 표(Ask AI 입력 예외), 9 검사 방법(14.8 검사 표, `--self-test`, 프로덕션 실행), 10.2 '부모·자식 대화상자' 행 지우기.
- `docs/ui-spec.md`: 피드 툴바 폭별 배치(14.2 표), 카드 틀(14.4), 요약 바, 챗 열 맞춤·사이드바 머리 영역, 알림 위치.
- `docs/functional-spec/01-news-feed.md`: NEWS-02~06(툴바·자리표시), NEWS-08(카드 틀·시사점 반복 규칙·인기 점수), NEWS-14·18(요약 바), 예외·엣지와 알려진 위험의 깜빡임·통계 실패 지우기.
- `docs/functional-spec/02-ai-chat.md`: CHAT-07(`aria-controls`), CHAT-17(칩 라벨), 경고 알림 위치, 예외·엣지 정리.
- `docs/functional-spec/07-ui-common.md`: UI-02(수집 상태 복원), UI-08(스택 순서, Ask AI Escape 예외), UI-13(Ask AI 복사 실패), UI-14(`aria-controls` 규칙), 알려진 위험 1·2·3 지우기.
- `docs/known-issues.md`: 'UI·접근성' 8행을 지운다. 새 행: 포커스 시트 카테고리 라벨이 다른 화면과 다름(우려 18). 적절한 절에: backend 가 LLM 평가 시사점이 없을 때 카테고리별 고정 문장을 저장함(우려 11, `llm_processor.py:84-89,703-709`).
- `docs/test-cases.md`: 14.9 테스트. `docs/test-strategy.md`: ui-audit 의 검사 종류·자체 검증·프로덕션 실행(테스트 종류가 바뀌므로).
- `docs/tech-spec.md`: '변경 이력' 의 `ui-redesign` 2차 한 줄.
- (보정 5) `docs/known-issues.md`: 'UI·접근성' 의 '360·390px 폭 첫 화면에서 피드 소스 줄의 `Must-Read` 칩이 줄 왼쪽 밖에 있어 보이지 않는다' 행(2026-11-07 기준 `:60`)을 지운다 (R34 로 해소). `docs/ui-spec.md`: 피드 툴바 줄 B(소스 + Must-Read 토글 + 정렬), 768 미만 별 아이콘 토글. `docs/functional-spec/01-news-feed.md`: Must-Read 토글 위치(NEWS-02~06 의 해당 항목), 소스 줄 구분선 삭제. `docs/design-system.md`: `ScrollRow` 행의 '사용자 스크롤' 정의(입력 신호 뒤 `scroll`). `docs/test-cases.md`: 14.14 단언.
- (리뷰 후속) `docs/design-system.md`: 5.1 `Badge` 행(`shrink` prop, 같은 속성 클래스 두 번 금지), `ChipGroup` 행(`selectedSelector`, 스크롤 버튼 포커스 유지), `Toast` 행(한 번만 알림), 9 검사 방법(`clip` ④, `chatAlign` 알파 판정, 새 fixture). `docs/ui-spec.md`: 피드 툴바 폭별 배치(14.2 새 표, 768 미만 카테고리가 맨 위), 카드 배지 줄. `docs/functional-spec/01-news-feed.md`: NEWS-02~06 툴바 배치·순서, NEWS-08 배지 줄. `docs/functional-spec/07-ui-common.md`: UI-02 오래된 상태 응답, 알림 재알림 없음. `docs/test-cases.md`: 14.9 리뷰 후속 단언. `docs/test-strategy.md`: ui-audit `clip` ④·fixture.

#### 14.11 단계 (planner 에게 넘기는 제안, plan 의 18단계 뒤)
19. **ui-audit 강화와 회귀 증명 준비** — 14.8 검사·상태·환경·스크린샷, fixture 와 `--self-test`. 먼저 `--self-test` 를 통과시키고, 수정 전 코드에서 F1~F4 가 실패로 나오는지 확인한다 (R30). 앱 코드를 고치기 전에 한다.
20. **공통 부품** — `ChipGroup`·`useScrollOverflow`, `globals.css` 줄바꿈, `lib/labels.ts`, `Toast` `placement`, `overlay-stack` 순서, `Tabs` `aria-controls`. 단위 테스트 포함.
21. **피드** (20 뒤) — `FeedToolbar`, `InsightsBar`, `NewsCard`·`NewsCardSkeleton`·`HandoverCtaButton` 아이콘 모드, `feed-insights`, `useNewsFeed`, `page.tsx`.
22. **챗** (20 뒤, 21 과 병렬) — `ChatMessageList`, `ChatContextBar`·`ChatSidebarHeader`·`ChatWorkspace` 열 맞춤과 알림 영역, `ChatHeader` `aria-controls`, `ActiveSourceChip`, `FocusCapsule`, `CitationPopover`.
23. **상세·브리핑·수집** (20 뒤, 21·22 와 병렬) — `AskAiPanel`·`NewsDetailModal`(Escape, 복사 실패, 자리표시), `DailyBriefingModal`·`SourcesListTab` `aria-controls`, `useCollector`.
24. **전체 측정·결함 수정·문서** (21~23 뒤) — 프로덕션 빌드에서 ui-audit 전 조합 실패 0, 스크린샷 24장, 14.10 문서.
- 21·22·23 은 파일이 겹치지 않는다 (`page.tsx` 는 21 만, `ChatWorkspace.tsx` 는 22 만, `NewsDetailModal.tsx` 는 23 만).

#### 14.12 리뷰 후속 보정 (reviewer 2·3차, Important 3·Nit 5)
2026-11-06 reviewer 2·3차 리뷰의 8건을 모두 고친다. 코드 줄은 HEAD `b7fc73c` 에서 확인했다.

| 리뷰 항목 | 확인한 코드 | 요구 | 설계 |
|---|---|---|---|
| Important 3 배지 줄이 글자 중간에서 잘림 (spec 14.4 의 `overflow-hidden` 이 R16 과 충돌) | `NewsCard.tsx:146-158`, `Badge.tsx:24`(`shrink-0 max-w-full`), `lib/cn.ts:4-8`(충돌 미해결) | R17, R30 | 14.4 '배지 줄', 14.8 fixture |
| Important 1 스크롤 버튼이 포커스를 가진 채 사라짐 | `ScrollRow.tsx:128-129,141-173` | R15 | 14.3 '스크롤 버튼 포커스 유지' |
| Important 2 `clip` 이 스크롤 영역 바깥의 같은 축 잘림을 보지 않음 | `ui-audit.mjs:708-742` | R29, R30 | 14.8 `clip` ④, fixture |
| Nit 1 툴바가 폭마다 다른 트리를 다시 마운트, 하이드레이션 뒤 배치 변경 | `FeedToolbar.tsx:67-81,154-158,226,236-268` | R33 | 14.2 |
| Nit 2 늦은 30초 상태 응답이 폴링을 되살려 `수집 완료` 두 번 | `useCollector.ts:21,93-103,118-123,148` | R27 | 14.7 C-7 ④ |
| Nit 3 영역이 바뀌면 남은 알림을 다시 읽음 | `Toast.tsx:126-135,184-205` | R23 | 14.7 C-2 |
| Nit 4 소스 줄이 Must-Read 를 선택 칩으로 봄 | `ScrollRow.tsx:79,99-107`, `Chip.tsx:97-108`, `FeedToolbar.tsx:183-213` | R15 | 14.3 '줄별 선택 칩 선택자' |
| Nit 5 `chatAlign` 투명 판정이 `rgba(…, 0)` 만 | `ui-audit.mjs:1011-1016` | R29, R30 | 14.8 `chatAlign` |

- 바뀌는 파일(예상, plan 이 확정): `components/ui/Badge.tsx`, `components/NewsCard.tsx`, `components/ui/ScrollRow.tsx`, `components/ui/Chip.tsx`, `components/feed/FeedToolbar.tsx`, `components/ui/Toast.tsx`, `hooks/useCollector.ts`, `frontend/scripts/ui-audit.mjs`, `frontend/scripts/ui-audit-fixtures/defects.html`·`clean.html`, 테스트 `NewsCard.test.tsx`, `ui/ChipGroup.test.tsx`, `feed/FeedToolbar.test.tsx`, `ui/Toast.test.tsx`, `hooks/useCollector.test.ts`(단언 추가만). 판정 ④ 가 프로덕션에서 새 실패를 잡으면 그 화면 파일이 늘 수 있다 (plan '변경 파일' 을 고치고 재승인).
- 바뀌지 않는 것: R32 그대로 (backend, `types/**`, `mocks/**`, `lib/api.ts`, `package.json`·lock, localStorage 키). 새 토큰·새 의존성 없음. 계약 변경 없음.
- `docs/tech-spec.md`: '변경 이력' 의 `ui-redesign` 행에 리뷰 후속 한 줄. 다른 절은 바뀌지 않는다. `docs/product.md`: 범위·사용자·원칙·기능 목록이 바뀌지 않아 고치지 않는다.
- 단계 (planner 에게 넘기는 제안, plan 의 29단계 뒤):
  30. **ui-audit 판정 보강** — `clip` ④, `chatAlign` 알파 판정, 14.8 fixture 4종. `--self-test` 를 먼저 통과시킨다 (앱 코드 고치기 전에 배지 줄 fixture 가 실패를 내는 것으로 결함 재현을 확인).
  31. **공통 부품** (30 과 병렬) — `Badge shrink`, `ScrollRow` 포커스 유지, `ChipGroup selectedSelector`, `Toast` 한 번만 알림. 단위 테스트 포함.
  32. **피드·수집** (31 뒤) — `NewsCard` 배지 줄, `FeedToolbar` 한 트리·소스 줄 선택자, `useCollector` 오래된 응답. 단위 테스트 포함.
  33. **전체 측정·문서** (30·32 뒤) — 프로덕션 빌드 ui-audit 전 조합 실패 0(판정 ④ 로 새로 잡힌 결함 수정 포함), 스크린샷 24장, 14.10 리뷰 후속 문서.

#### 14.13 보정 3: 768 미만 양쪽 넘침 표시, 흐림 = 스냅 여백 (R15)
36 재측정 3(기록 커밋 `8a283d9`, `tasks/ui-redesign/36-prod-audit-3.md:221-279` '재측정 3', 측정 HEAD `af0c259`)의 360·390 육안 확인과 31 후속 2 보고를 반영한다. 기록 값: 360·390 소스 줄은 처음 상태에서 `scrollLeft 138` 이고 선택 칩 `전체` 는 [15.6, 102.7] 로 보이는 상자 [0, 204]·[0, 234] 안이다 (`:248`). 즉 360·390 에서는 `Must-Read` 와 선택 칩 `전체` 가 줄에 함께 들어가지 않는다. 설계는 14.3 '(보정 3)' 두 항목, 측정은 14.8 `scrollRow` 와 fixture 표 '(보정 3)' 행이다.

- 바뀌는 파일(예상, plan 이 확정): `components/ui/ScrollRow.tsx`(양쪽 표시·자리, `bleed` 쪽별 규칙, `scroll-px-6`, `data-selected-selector`), `frontend/scripts/ui-audit.mjs`, `frontend/scripts/ui-audit-fixtures/defects.html`·`clean.html`, 테스트 `ui/ChipGroup.test.tsx`, `feed/FeedToolbar.test.tsx`. `FeedToolbar.tsx`·`Chip.tsx` 는 바뀌지 않을 것으로 본다 (`bleed` prop 값은 그대로).
- 바뀌는 기존 단언 (요구가 바뀐 경우, `CLAUDE.md` '테스트를 고쳐 통과시키지 않는다' 와의 관계는 우려 24):

  | 파일:줄 | 지금 단언 | 바뀐 단언 | 이유 |
  |---|---|---|---|
  | `ui/ChipGroup.test.tsx:287` | `bleed` 줄(넘치지 않음) 클래스에 `max-md:scroll-px-4` | `scroll-px-6` (폭 접두 없음). 같은 테스트의 `max-md:-mx-4`·`max-md:px-4`(:285-286)는 그대로 | 스냅 여백 = 흐림 폭 24px, 모든 폭·모든 줄 (14.3 보정 3). 16px 는 선택 칩 왼쪽 8px 가 흐림에 겹친 원인 |
  | `ui/ChipGroup.test.tsx:328` | `bleed="start"` 줄 클래스에 `max-md:scroll-pl-4` | `scroll-px-6`. :326-327, :329-331 은 그대로 | 위와 같음 |
  | `feed/FeedToolbar.test.tsx:142` | 소스 줄 `toHaveClass('max-md:-ml-4', 'max-md:pl-4', 'max-md:scroll-pl-4')` | `toHaveClass('max-md:-ml-4', 'max-md:pl-4', 'scroll-px-6')`. :143-144 는 그대로 | 위와 같음 |
  | `ui/ChipGroup.test.tsx:368` | 768 미만 `both` 에서 `[data-overflow-hint]` 1개 | 2개: `data-overflow-hint="start"` 가 그룹 앞, `"end"` 가 그룹 뒤 (둘 다 그룹 밖, `aria-hidden`) | 768 미만 넘친 쪽마다 표시 (14.3 보정 3-1). 오른쪽에만 두면 왼쪽에 숨은 칩(소스 줄 `Must-Read`)의 단서가 없다 |
  | `ui/ChipGroup.test.tsx:388-396` (테스트 (d) 의 `start` 부분과 제목) | 768 미만 `start` 에서 `[data-overflow-hint]` 없음. 제목 `draws no hint at start, none, or at >=768px` | `start` 에서 `data-overflow-hint="start"` 1개가 그룹 앞. 제목 `draws only the start hint at start, none when it fits, and buttons instead at >=768px`. 같은 테스트의 `none`(:399-404)·768 이상(:406-410) 부분은 그대로 | 위와 같음 |

  위 5곳 밖의 기존 단언은 그대로 통과해야 한다. 특히 768 미만 `end` 에서 표시 1개(`ChipGroup.test.tsx:357-363`, `Tabs.test.tsx:373-379`, `FeedToolbar.test.tsx:211-215`)는 그대로다: `bleed` 없는 쪽에 잡아 둔 자리는 `data-overflow-hint` 가 아니라 `data-overflow-slot` 이다. `bleed` 줄의 `end` 상태 클래스 단언(`ChipGroup.test.tsx:383-385`)도 그대로다. `:649` 는 주석이고 `mockSnapStyles('16px')` 를 쓰는 스냅 알고리즘 테스트(:670-704)는 계산된 스타일을 목으로 넣으므로 클래스와 상관없이 그대로 둔다.
- 새 단언 (`ui/ChipGroup.test.tsx`, 768 미만 목): ① `start`·`end`·`both` 마다 보이는 표시의 개수·`data-overflow-hint` 값·그룹 앞뒤 위치. ② `bleed` 줄의 상태별 클래스 (14.3 보정 3-5: `end` 왼쪽만, `start` 오른쪽만, `both` 없음, `none` 좌우). ③ `bleed` 없는 쪽은 넘치는 동안 `data-overflow-slot` 자리가 있고 그쪽이 넘치지 않으면 `invisible`. ④ 표시의 간격 상쇄 클래스(왼쪽 `-mr-1`, 오른쪽 `-ml-1`)와 `bleed` 쪽 여백 클래스(`max-md:-ml-4`/`max-md:-mr-4`). ⑤ 모든 스크롤 줄에 `scroll-px-6`, `data-selected-selector` 가 `selectedSelector` 값. ⑥ 768 이상에서는 표시가 없고 버튼만 (지금 단언 유지). 새 단언 (`feed/FeedToolbar.test.tsx`, 360 목): 소스 줄이 `both` 일 때 소스 줄 감싸개 안 `data-overflow-hint="start"` 가 소스 그룹 앞에 있음.
- 단계 (planner 에게 넘기는 제안): ScrollRow·테스트(위 표와 새 단언) → ui-audit `scrollRow` 보정 3 판정·fixture 3종·`--self-test` 360 폭 → 프로덕션 재측정(R29 전 조합, 360·390 소스 줄 `mustReadHidden`·`startHint` 인용, 360·390 라이트 스크린샷 육안 확인) → 문서(`docs/design-system.md` 5.1 `ChipGroup`/`ScrollRow` 행, `docs/ui-spec.md` 스크롤 줄 표시, `docs/test-cases.md`).

#### 14.14 보정 5: Must-Read 고정 토글(R34), 사용자 스크롤 정의 (R15·R33)
- 근거: ① 제품 오너(사용자) 결정 2026-11-07 — 우려 23 의 대안 ① 'Must-Read 를 정렬 옆 고정 토글로'. ② reviewer 재리뷰 Nit 2 — 보정 4 의 '사용자 스크롤' 정의가 브라우저 자르기·스냅 재맞춤을 사용자 스크롤로 오인한다.
- 설계: Must-Read 는 14.2 '(보정 5, R34)' 와 표·폭 계산, 사용자 스크롤은 14.3 '(보정 5)', 측정은 14.8 'Must-Read 증거' 와 fixture 표 '(보정 5)' 행.
- 바뀌는 파일(예상, plan 이 확정): `components/feed/FeedToolbar.tsx`(Must-Read 를 소스 그룹 밖 토글로, 구분선 삭제), `components/ui/ScrollRow.tsx`(입력 신호 기반 사용자 스크롤 판정), `frontend/scripts/ui-audit.mjs`(Must-Read 증거 교체), `frontend/scripts/ui-audit-fixtures/defects.html`·`clean.html`, 테스트 `feed/FeedToolbar.test.tsx`, `ui/ChipGroup.test.tsx`. `Chip.tsx` 는 바뀌지 않는다 (`className`·`children` 으로 토글 모양을 만든다).
- 바뀌는 기존 단언 (요구가 바뀐 경우, 우려 25):

  | 파일:줄 | 지금 단언 | 바뀐 단언 | 이유 |
  |---|---|---|---|
  | `feed/FeedToolbar.test.tsx:50` (테스트 제목) | `shows Must-Read first in the source group and toggles it` | `shows the Must-Read toggle outside the source group, between the source row and sort, and toggles it` | R34: Must-Read 는 소스 그룹 첫 칩이 아니라 그룹 밖 토글 (제품 오너 결정) |
  | `feed/FeedToolbar.test.tsx:52-55` | 소스 그룹의 버튼 `chips[0]` 이 `Must-Read` 이고 `aria-pressed="false"` | `getByRole('button', { name: 'Must-Read' })` 가 `aria-pressed="false"` 이고, 소스 그룹 안에 없으며(`within(group).queryByRole('button', { name: 'Must-Read' })` 가 null), 소스 그룹과 같은 `data-toolbar-row` 에서 소스 그룹 뒤·정렬 선택창 앞 (DOM 순서) | 위와 같음. 접근 이름·`aria-pressed` 단언 세기는 같다 |
  | `feed/FeedToolbar.test.tsx:57` | 소스 그룹 칩 글자 `['Must-Read', '전체7', 'GitHub5', 'arXiv2', '북마크2']` | `['전체7', 'GitHub5', 'arXiv2', '북마크2']` (건수 있는 소스만·전체·북마크 규칙은 그대로) | 위와 같음 |
  | `feed/FeedToolbar.test.tsx:59` | `fireEvent.click(chips[0])` | `fireEvent.click(` Must-Read 토글 `)`. :60-61 의 콜백 단언(`onHighSignalChange(true)`, `onPageChange(1)`)은 그대로 | 위와 같음 |
  | `ui/ChipGroup.test.tsx:619` | 입력 없이 `setScrollLeft(group, 10)` 을 사용자 스크롤로 다룸 | `fireEvent.wheel(group)` 뒤 `setScrollLeft(group, 10)` (보정 6 에서 `fireEvent.wheel(group, { deltaX: 40 })` 으로 다시 바뀜, 아래 표). :622 `expect(group.scrollLeft).toBe(10)` 과 :624-625 는 그대로 | 사용자 스크롤 = 입력 신호 뒤 `scroll` (14.3 보정 5). 입력 없는 `scrollLeft` 변경은 브라우저 자르기·스냅 재맞춤과 구별할 수 없어 사용자 스크롤이 아니다. 테스트가 확인하던 '사용자가 민 위치를 끌어오지 않음' 은 입력 신호를 넣어 같은 세기로 남긴다 |

  위 밖의 기존 단언은 그대로 통과해야 한다. 확인한 것: `FeedToolbar.test.tsx` 의 ① 소스 칩 보이기(:365-381, Must-Read rect 목은 쓰이지 않게 되지만 단언 :376·:380 은 그대로 성립), ② 한 트리(:383-402), ③ DOM 순서(:404-411, 카테고리 < 검색 < 소스 < 정렬은 그대로 성립), ④ 줄 묶음(:413-424), 넘침 표시 2건(:203-217, :219-263, 오른쪽 표시가 정렬 앞이라는 단언은 표시 → Must-Read → 정렬 순서에서도 성립), `bleed` 클래스(:139-151). `ui/ChipGroup.test.tsx:518-540` 의 Must-Read 는 `ChipGroup` 단위 fixture 라 바뀌지 않는다. 입력 없이 `setScrollLeft` 로 넘침 상태를 만드는 다른 테스트(`ChipGroup.test.tsx:150,153,180,186,212,366,404,473,484,506,745,787` 의 `setScrollLeft`)는 새 정의에서 다시 보이기가 `scrollLeft` 를 조정할 수 있으나 그 테스트들은 `scrollLeft` 값이 아니라 `data-overflow`·버튼·표시·포커스를 단언한다 (우려 26).
- 새 단언:
  - `feed/FeedToolbar.test.tsx` (R34): ③ 에 `소스 → Must-Read → 정렬` 순서 추가 (360·1024·1440). Must-Read 토글이 `data-must-read-toggle`, 클래스 `max-md:w-11`·`shrink-0`, 글자 감싸개 `max-md:sr-only`, 접근 이름이 폭 목 360·1440 모두 `Must-Read` 이고 같은 노드. 소스 그룹 안에 구분선(`aria-hidden` `w-px`)이 없음. `highSignalOnly` 면 `aria-pressed="true"`.
  - `ui/ChipGroup.test.tsx` (R15 보정 5): ① 입력 없이 `setScrollLeft`(브라우저 자르기 흉내) 뒤 줄 폭이 바뀌면(`triggerResize`) 선택 칩이 다시 흐림 밖에 보임. ② `pointerdown`·`touchstart`·`keydown`·스크롤 버튼 클릭 각각 뒤 `scroll` 이면 폭이 바뀌어도 `scrollLeft` 유지. ③ 입력 신호 뒤 `scroll` 이 1,000ms 안에 없으면(가짜 타이머) 다음 입력 없는 `scroll` 은 사용자 스크롤이 아님. ④ 이 부품의 포커스 유지로 옮긴 포커스(`focusin`)는 입력 신호가 아님. ⑤ (보정 6, 새 테스트 추가만) 세로 휠(`fireEvent.wheel(group, { deltaY: 100 })`, `deltaX` 0, Shift 없음) 뒤 `setScrollLeft` 를 하고 줄 폭이 바뀌면 선택 칩이 다시 흐림 밖에 보임 (세로 휠은 입력 신호가 아님). ⑥ (보정 6) `deltaX` 가 `deltaY` 보다 큰 휠, `shiftKey: true` 인 세로 휠은 각각 입력 신호라 그 뒤 `scroll` 위치가 폭 변화에도 유지됨.
- (보정 6) 바뀌는 기존 단언. `wheel` 을 가로 의도일 때만 신호로 세면, 보정 5 구현이 넣은 `fireEvent.wheel(group)` 두 곳은 `deltaX`·`deltaY` 가 모두 0 이고 Shift 가 없어(`Math.abs(0) > Math.abs(0)` 은 거짓) 신호가 아니게 된다. 테스트가 확인하려던 동작을 지키려고 가로 휠로 바꾼다 (줄은 2026-11-07 작업 트리 기준):

  | 파일:줄 | 지금 | 바뀐 값 | 이유 |
  |---|---|---|---|
  | `ui/ChipGroup.test.tsx:619` | `fireEvent.wheel(group);` 뒤 `setScrollLeft(group, 10)` | `fireEvent.wheel(group, { deltaX: 40 });` (뒤의 `setScrollLeft`, :622 `toBe(10)`, :624-625 는 그대로) | 그대로 두면 세로 휠로 읽혀 신호가 아니고, 다시 보이기가 `scrollLeft` 를 바꿔 :622 가 깨진다. 테스트의 뜻('사용자가 민 위치를 끌어오지 않음')은 가로 휠이어야 성립한다 |
  | `ui/ChipGroup.test.tsx:950` (테스트 ③ '입력 뒤 1,000ms 안에 scroll 이 없으면 끝남') | `fireEvent.wheel(group);` | `fireEvent.wheel(group, { deltaX: 40 });` (:951-957 은 그대로) | 그대로 두면 단언 :957 은 여전히 통과하지만, 휠이 처음부터 신호가 아니어서 '1,000ms 시간 끝' 을 검사하지 않게 된다 (검사가 약해짐). 가로 휠로 바꿔 시간 끝 판정을 계속 검사한다 |

  다른 테스트에는 `fireEvent.wheel` 이 없다 (`frontend/src/tests` 에서 이 두 곳뿐).
- 측정: ui-audit `scrollRow` 툴바 증거 `mustReadVisible: true` 가 5개 폭 × 2테마 `/` 처음 상태 모두 (R34), `--self-test` 의 '숨은 Must-Read' fixture. Chrome 확인(verify): 360 `/` 를 손대지 않고 1440→360 으로 바꿔 소스·카테고리 줄의 선택 칩이 흐림 밖에 보임, 같은 화면에서 줄을 손가락(터치 에뮬레이션)·가로 휠(Shift + 휠)로 민 뒤 폭을 바꾸면 민 위치가 남음. (보정 6) 1024 에서 sticky 툴바 위에 포인터를 두고 페이지를 세로 휠로 내린 직후 폭을 바꿔도 선택 칩이 다시 흐림 밖에 보임. 확인하지 못하면 verify.md 에 미검증으로 적는다.
- 단계 (planner 에게 넘기는 제안): `FeedToolbar` Must-Read 토글·테스트 → `ScrollRow` 사용자 스크롤 판정·테스트 (앞 단계와 파일이 겹치지 않아 병렬 가능) → ui-audit 증거 교체·fixture·`--self-test` → 프로덕션 재측정(R29 전 조합, `mustReadVisible` 인용, 360·390 라이트 스크린샷) → 문서 (14.10 보정 5).

#### 14.15 보정 7: 프로덕션 스크린샷 결함 7건 (R35~R40)
- 근거: 메인 세션이 프로덕션 측정 스크린샷 24장(`docs/features/ui-redesign/audit/*.png`, 36 재측정 6 `afa1ee3`, HEAD `27f3eed`)을 직접 보고 확정한 결함이다. spec 작성자가 `feed-light-360x780.png`, `feed-light-768x1024.png`, `feed-light-1024x768.png`, `chat-light-360x780.png`, `chat-light-1440x900.png` 를 다시 열어 같은 모습을 확인했다. 상세 모달(`detail-*.png`)과 일일 브리핑(`briefing-*.png`)은 결함이 없다고 메인이 보고했고 이 보정에서 바꾸지 않는다. 코드 줄은 2026-11-07 작업 트리(HEAD `0b2a2cc`) 기준이다.
- 기존 측정이 이 결함을 놓친 이유: 14.8 검사는 잘림·가림·정렬·넘침 표시가 '규칙대로인지' 만 보고, 줄이 쓸 만한 폭인지(F1), 표시한 숫자가 정보인지(F3), 같은 기능이 두 번 나오는지(C3), 화면마다 같은 말인지(C2·C4)는 보지 않았다. 아래 새 검사는 결함마다 하나씩 그 성질을 잰다.

| 번호 | 화면·폭 | 결함 | 원인 (코드) | 요구 |
|---|---|---|---|---|
| F1 | 피드 360·390 | 툴바 줄 B 의 소스 칩 줄이 칩 1.5개 폭이다 (`feed-light-360x780.png`: `전체 4734` 와 `국내…` 일부만 보임, `feed-dark-390x844.png` 같음) | `FeedToolbar.tsx:247-251` 줄 B 가 768 미만에서도 한 줄이라 소스 줄이 Must-Read 토글(44px)·정렬(`w-28` 112px)과 폭을 나눈다. 14.2 폭 계산으로 360 소스 상자 156px(+ 왼쪽 `bleed` 16) | R35 |
| F2 | 피드 768·1024 | 카테고리·소스 줄 끝 칩이 단어 중간에서 잘린다 (`feed-light-768x1024.png` 의 `에…`·`HackerNew…`, `feed-light-1024x768.png` 의 `Glo…`). 768 은 카테고리 줄이 검색창과 한 줄이라 칩 3개만 보인다 | 넘친 스크롤 줄의 의도한 잘림 (14.3 '`bleed`' 항목: 다음 칩이 일부 보여 더 있다는 것을 알린다) + 흐림 24px + 768 이상 스크롤 버튼 | 바꾸지 않음 (아래 F2 판단, 우려 29) |
| F3 | 피드 전 폭 | 첫 화면 카드가 모두 `★180 · 🔥100` 이다 | 표시: `NewsCard.tsx:165-171` 이 `raw_score > 0` 이면 소스와 상관없이 별 아이콘 + `점수` 로 그린다. 데이터: `rss.py:75` 가 `raw_score` 를 국내(KR) 180, 그 밖 150 고정값으로 넣는다. `arxiv.py:48` 은 120 고정, `huggingface.py:33` 은 `numComments + 40`(좋아요가 아니다), `github.py:44` 는 스타(`github.py:61-69` 폴백은 `stars_hint`, 기본 5000), `hackernews.py:39` 는 포인트, `reddit.py:36` 은 추천 점수다. `github.py:45` 의 `comments_count` 는 포크 수인데 카드는 `MessageSquare`·`댓글` 로 그린다(`NewsCard.tsx:172-178`). `categorizer.py:147` `min(100, hotness × 8)` 이 포화한다. 메인 세션 DB 조회(2026-11-07, `backend/agentlens.db`): `rss_kr` 459건 모두 180·그중 인기 100 이 373건, `rss` 285건 모두 150, `github` 0~277217, `hackernews` 1~815, `huggingface` 40~48, 4734건 중 인기 100 이 1034건 | R36 (표시), 우려 28 (backend) |
| C1 | 챗 360 | 모드 탭 `단일 기사 (Scoped)`·`전체 코퍼스 (Global)` 가 넘쳐 첫 탭이 왼쪽에서 잘리고(`<일 기사`) 왼쪽 넘침 표시가 글자 옆에 붙는다 (`chat-light-360x780.png`, `chat-dark-360x780.png`) | `ChatContextBar.tsx:19-22` 라벨이 길다. 두 탭 폭 계산 약 353px(`SegmentedControl.tsx:49` `px-3`·아이콘 16·간격 6 + 글자) > 360 안쪽 328px. 선택 칩(`전체 코퍼스`) 보이기로 줄이 밀려 첫 탭이 왼쪽 밖으로 나간다 | R37 (C2 의 짧은 라벨로 해결) |
| C2 | 챗 전 폭 | 모드 탭과 대화 목록 배지에 영어(`Scoped`, `Global`)가 섞이고, 탭은 `전체 코퍼스`, 포커스 캡슐은 `전체 소식`, 대화 항목 접근 이름은 `기사 집중 모드`/`전체 소식 모드`, 없는 기사 알림은 `전체 뉴스 모드` 로 같은 것을 다르게 부른다. 캡슐 앞말 `Focus:` 도 영어다 | `ChatContextBar.tsx:20-21`, `SessionItemCard.tsx:82,99-107`, `FocusCapsule.tsx:47,88`, `ChatWorkspace.tsx:42`, `ChatMessageList.tsx:64`(`코퍼스`). 용어 표가 `lib/labels.ts` 밖에 흩어져 있다 | R38 |
| C3 | 챗 768·1024·1440 | 모델 선택(`Sonnet 5.5 추천`)이 헤더 오른쪽과 입력창 아래 두 번 나온다 (`chat-light-1440x900.png`). 360·390 은 입력창 아래만 | `ChatHeader.tsx:129-138` 이 md 이상에서 `header-chip` 을, `ChatPromptInput.tsx:102-109` 가 모든 폭에서 `inline-chip` 을 그린다 (`ChatWorkspace.tsx:684-685,732-733` 이 둘 다에 넘김) | R39 |
| C4 | 챗 포커스 필터 창 | 카테고리 칩 라벨 `하네스·평가`, `MCP·도구`, `에이전트 기술`, `AI 뉴스` 가 다른 화면과 다르다 (known-issues 'UI·접근성' `:59`) | `FocusBottomSheet.tsx:29-35` 의 따로 둔 표 | R40 |

- 설계 (결함별):
  - **F1 (R35)**: 줄 B(`FeedToolbar.tsx:247`)에 `max-md:flex-wrap` 을 둔다. 소스 줄의 바깥 감싸개(줄 B 의 직접 자식, 지금 `className="min-w-0 flex-1"` 을 받는 요소)에 `max-md:basis-full` 을 더해 768 미만에서 한 줄을 다 쓰게 한다. Must-Read 토글에 `max-md:ml-auto` 를 더해 토글과 정렬이 다음 줄 오른쪽 끝에 붙게 한다 (정렬이 줄 B 오른쪽 끝에 있는 768 이상 배치와 같은 자리). 줄 B 의 `gap-2` 가 두 줄 사이 세로 간격 8px 가 되어 줄 A·B 사이(툴바 `gap-2`)와 같다. 소스 줄 `bleed` 는 `'start'` 에서 `true` 로 바꾼다: 768 미만에서 오른쪽 이웃(토글)이 다음 줄로 내려가 `'start'` 의 이유(`FeedToolbar.tsx:167` 주석)가 없어졌고, 카테고리 줄과 좌우 끝(표시 자리)이 맞는다. 768 이상에서 `bleed` 는 효과가 없다 (`max-md:` 클래스). DOM·`data-toolbar-row`·Tab 순서는 바뀌지 않는다 (R33·R34: 토글과 정렬은 여전히 소스 줄과 같은 `data-toolbar-row`).
    - 폭 계산 (계산값, ui-audit 로 확인): 360 에서 소스 줄은 넘치지 않으면 화면 0~360, `end` 면 0~344(오른쪽 표시 16), `both` 면 16~344. 보이는 소스 칩: `전체 4734`(약 87px)·`국내 테크 459`(약 100px)가 왼쪽 패딩 16 뒤 흐림 밖에 다 들어간다 (보정 6 까지 1개).
    - 높이: 줄 B 가 768 미만에서 44 + 8 + 44 = 96px 로 약 52px 늘어난다. `feed-light-360x780.png` 의 첫 카드 제목 아래 끝이 약 y 440 이라 약 492 로 내려가도 780 안이다 (R5 는 390×844 판정, 계산값이라 ui-audit R5 로 확인). 툴바는 768 미만에서 sticky 가 아니라(`md:sticky`) 스크롤하면 사라진다.
  - **F2 (판단: 줄 구성을 바꾸지 않는다)**: 근거 ① 1024 는 카테고리 줄이 이미 다 들어간다 (`feed-light-1024x768.png`: `전체 소식` x≈32 ~ `최신 AI 동향` 끝 x≈784, 약 752px). 1024 의 잘림은 소스 줄 하나이고 소스 7칩 약 869px(14.2 계산)가 줄 B 약 702px 보다 넓은 데이터 문제라 줄 구성으로 풀리지 않는다. ② 768 에서 검색을 별도 줄로 내려도 카테고리 줄은 720px(안쪽) − 스크롤 버튼 자리 < 약 752px 라 여전히 넘쳐 끝 칩이 잘린다 (보이는 칩 3개 → 4개 남짓). 대신 768 이상 툴바는 sticky(`md:sticky`)라 늘어난 줄(약 40px)이 스크롤 내내 화면을 차지한다. ③ 스크롤 줄 끝 칩의 일부 잘림은 설계한 넘침 신호다 (14.3: 흐림 24px + 768 이상 넘친 쪽 스크롤 버튼). 이 신호는 ui-audit `scrollRow`(넘침 ↔ `data-overflow`, 768 이상 넘친 쪽 버튼 보임, 선택 칩이 흐림 밖)로 이미 판정한다. 그래서 새 요구와 판정 기준을 두지 않는다. 제품 오너가 768 줄 구성 개선을 원하면 우려 29 의 대안을 고른다.
  - **F3 (R36)**: `lib/labels.ts` 에 지표 표를 둔다 (아이콘은 두지 않는다, `lib` 는 React 를 모른다):
    - `ScoreMetric = 'stars' | 'points' | 'upvotes'`, `SOURCE_SCORE_METRICS = { github: 'stars', hackernews: 'points', reddit: 'upvotes' }`, `SCORE_METRIC_LABELS = { stars: '스타', points: '포인트', upvotes: '추천' }`, `scoreMetric(source): ScoreMetric | null` (표에 없으면 `null`).
    - `CountMetric = 'comments' | 'forks'`, `countMetric(source)`: `github` 은 `'forks'`, 그 밖은 `'comments'`. `COUNT_METRIC_LABELS = { comments: '댓글', forks: '포크' }`.
    - `NewsCard` 바닥 통계(`NewsCard.tsx:163-186`): 점수는 `scoreMetric(item.source)` 가 있고 `raw_score > 0` 일 때만 그린다. 아이콘: `stars` → `Star`, `points`·`upvotes` → `ArrowBigUp`. 개수: `comments_count > 0` 일 때(지금 규칙) `forks` → `GitFork`, `comments` → `MessageSquare`. 각 통계 `span` 에 `data-card-stat="score"|"count"|"hotness"`, `data-metric="<지표>"`(인기는 생략), `title`(`GitHub 스타`·`HackerNews 포인트`·`Reddit 추천`·`GitHub 포크`·`댓글`), 안쪽 `sr-only` 는 표의 라벨(`스타`·`포인트`·`추천`·`포크`·`댓글`). 인기(`hotness_score > 25`, `sr-only` `인기 점수`)는 그대로다. 카드(`[data-feed-card]`)에 `data-source={item.source}` 를 더한다 (ui-audit 용 DOM 속성, 계약 아님).
    - 별 아이콘은 이제 GitHub 스타와 Must-Read 배지(채운 별)에만 쓰인다.
    - 기사 상세(`NewsDetailModal.tsx`)는 `raw_score`·`hotness_score` 를 그리지 않는다 (`rg raw_score frontend/src/components` 는 `NewsCard.tsx` 만). 바꾸지 않는다. 나중에 상세에 점수를 넣으면 같은 `scoreMetric` 을 쓴다.
    - 바뀌지 않는 것: `NewsItem` 타입·zod·MSW(`raw_score`, `comments_count`, `source` 필드 그대로), backend 점수 계산, `추천순`·`인기순` 정렬(우려 28).
  - **C1 (R37)**: C2 의 라벨(`단일 기사`, `전체 소식`)로 두 탭 폭이 약 202px(계산값: 탭마다 `px-3` 24 + 아이콘 16 + 간격 6 + 글자 4자 약 52, 감싸개 `p-0.5`·`gap-0.5`)가 되어 360 안쪽 328px 에 들어간다. 맥락 줄 구조(`ScrollRow`, 기사 칩)는 바꾸지 않는다. 기사 칩이 있으면 줄이 넘칠 수 있으나 선택 탭이 `단일 기사`(첫 탭)라 처음 `scrollLeft` 0 에서 두 탭이 다 보인다.
  - **C2 (R38)**: `lib/labels.ts` 에 `ALL_CATEGORY_LABEL = '전체 소식'`(지금 `FeedToolbar.tsx:22` 에서 옮김)과 `SCOPE_LABELS = { scoped: '단일 기사', global: ALL_CATEGORY_LABEL }`, `scopeLabel(mode)` 를 둔다. 쓰는 곳: `ChatContextBar` 탭 라벨, `SessionItemCard` 배지 글자·접근 이름(`${scopeLabel} 모드`), `ChatWorkspace` `SOURCE_NOT_FOUND_MESSAGE`(`… 전체 소식 모드로 시작합니다.`), `FocusCapsule` 기본값(`ALL_CATEGORY_LABEL`)과 앞말 `포커스:`, `FeedToolbar` `feedCategoryLabel('all')`, `FocusBottomSheet` `all` 칩(C4). `ChatMessageList.tsx:64` 의 `수집된 코퍼스 기반의` 는 `수집된 소식 기반의` 로 바꾼다. 코드 안 식별자·주석(`isScoped`, `HotkeyListener.tsx:27` 주석)과 `types/chat.ts` 의 값(`'scoped'`, `'global'`)은 바꾸지 않는다. 그룹 이름 `검색 스코프 모드`(ui-audit `ENTRY_POINTS`·테스트가 찾는 이름, R13)는 그대로 둔다.
  - **C3 (R39)**: 입력창 아래 한 곳으로 정한다. 이유: ① 360·390 이 이미 입력창 아래라 모든 폭에서 같은 자리가 된다 (폭별 기능 동등, 단일 디자인시스템). ② 모델 선택은 다음에 보낼 질문에 적용되므로 전송 버튼 옆이 맞고, 바꾼 뒤 타임라인 `ModelChangeDivider` 와도 가깝다. ③ 헤더는 768 이상에서 한 자리 비워져 R4(한 줄 56px)에 여유가 생긴다. `ChatHeader.tsx:129-138` 의 모델 선택과 `selectedTier`·`onSelectTier` prop(`:29-30,55-56`)을 지우고 `ChatWorkspace.tsx:684-685` 의 전달을 지운다. `ChatModelSelector` 의 `header-chip`·`header-compact` 변형은 부품에 남긴다 (`ChatModelSelectorProps` 가 `types/chat.ts:860` 에 있어 R32 로 바꾸지 않고, `ChatModelSelector.test.tsx:122,129-` 단언을 유지한다). 대안(768 이상 헤더, 768 미만 입력창, CSS 로 한쪽 숨김)은 폭마다 자리가 달라지고 DOM 이 둘이라 택하지 않는다.
  - **C4 (R40)**: `FocusBottomSheet.tsx:29-35` 의 표를 `[{ id: 'all', label: ALL_CATEGORY_LABEL }, ...(['harness','mcp_plugins_skills','agent_tech','ai_news'] as const).map((id) => ({ id, label: categoryLabel(id) }))]` 로 바꾼다 (필터 칩은 긴 라벨, R19). 시트의 칩 줄은 줄바꿈 `ChipGroup`(스크롤 아님)이라 긴 라벨이 360 시트에서 여러 줄로 감긴다. 칩 순서·`id`·선택 동작은 그대로다.
- ui-audit 새 검사 (`frontend/scripts/ui-audit.mjs`, 14.8 표에 행으로 더한다). 각 검사는 고치기 전 코드에서 실패하고 고친 뒤 통과해야 한다. '고치기 전' 열은 2026-11-07 스크린샷·코드로 본 예상 실패이고, 회귀 증명(아래)으로 실제 실패를 기록한다.

  | 검사 | 대상 | 판정 (실패 조건) | 고치기 전 (예상) |
  |---|---|---|---|
  | `toolbarLayout` | `/` 처음 상태, `innerWidth < 768` | 소스 줄(`[data-feed-toolbar] [role="group"][aria-label="소스"]`)의 rect 를 `[0, innerWidth]` 로 자른 폭 < `innerWidth − 32 − 1`; 또는 소스 칩(`[data-source-chip]`, 없으면 그룹 안 `button`) 중 줄 보이는 상자에서 넘친 쪽 흐림 24px 를 뺀 범위 안에 다 드는 칩 < 2개; 또는 `[data-must-read-toggle]`·정렬 선택창의 top < 소스 줄 bottom − 1. 768 이상은 판정하지 않고 줄마다 `{ rowWidth, fullyVisibleChips }` 만 기록한다 (F2 참고 자료). 기록: `checks.toolbarLayout.source = { viewport, visibleWidth, fullyVisibleChips, toggleTop, sourceBottom }` | 360: 보이는 폭 약 172px(< 327), 다 보이는 칩 1개, 토글 top = 소스 줄 top (같은 줄). 390 도 같은 구조 |
  | `cardMetric` | `/` 의 보이는 `[data-feed-card]` 전부 (처음 상태) | 카드 소스 = `data-source` 속성, 없으면 머리줄(`[data-card-meta]`) 둘째 글자 조각을 `SOURCE_LABELS`(스크립트 상수, `lib/labels.ts` 와 같은 값)로 거꾸로 찾음. 통계 = 카드 바닥 줄 통계 영역의 자식 중 `sr-only` 글자가 `점수`·`스타`·`포인트`·`추천`·`포크`·`댓글`·`인기 점수` 인 요소 (`data-card-stat` 가 있으면 그것). 실패: ① 종류 없는 `점수` 라벨 ② 소스가 `github`·`hackernews`·`reddit` 가 아닌데 점수 통계(`점수`·`스타`·`포인트`·`추천`)가 있음 ③ `github` 점수가 `스타` 가 아님, `hackernews` 가 `포인트` 가 아님, `reddit` 가 `추천` 이 아님 ④ `github` 개수 통계가 `포크` 가 아님. 기록: `checks.cardMetric.summary = { cards, bySource: { <소스>: { cards, scoreShown } } }` | 첫 화면 `국내 테크` 카드마다 ①·② (`점수 180`), 1440 첫 화면의 `GitHub` 카드는 ①·④ (`댓글` = 포크) |
  | `chatScope` | `/chat` 기본·기사 칩(`sourceId`)·경고 알림 상태 | 그룹 `검색 스코프 모드` 의 두 버튼 중 하나라도 rect 가 화면 밖(1px 허용)이거나 맥락 줄 스크롤 줄(`[data-chat-context-bar] [data-scroll-row]`) 보이는 상자에서 넘친 쪽 흐림 24px 를 뺀 범위 밖; 또는 기본·경고 알림 상태(기사 칩 없음)에서 그 줄의 `data-overflow` 가 `none` 이 아님 | 360 기본: `data-overflow` `start`, `단일 기사 (Scoped)` 가 왼쪽 밖 |
  | `terms` | `/chat` 모든 측정 상태 (포커스 필터 열림 포함) | 보이는 요소 중 자기 텍스트 노드를 이어 붙여 다듬은 글자가 `Scoped` 또는 `Global` 과 같음, `(Scoped)`·`(Global)` 을 포함, `Focus:` 로 시작, 또는 `코퍼스` 를 포함하면 실패. 그룹 `검색 스코프 모드` 의 `global` 쪽 버튼(둘째 버튼) 접근 이름이 `전체 소식` 이 아니면 실패. 사용자 글(세션 제목처럼 `title` 속성이 글자와 같은 요소, `.markdown-viewer`, 입력값, 메시지 목록의 대화 내용)은 뺀다 (측정 상태에는 대화가 없다) | 모든 폭: 탭 `(Scoped)`·`(Global)`, 캡슐 `Focus:`, 빈 화면 안내 `코퍼스`. 1024 이상에서 세션이 있으면 배지 `Global`·`Scoped` |
  | `modelPicker` | `/chat` 기본 | 보이는(`display`·`visibility` 가 숨김이 아니고 rect 가 0 이 아닌) 버튼 중 `aria-label` 이 `Claude 모델 선택` 으로 시작하는 것이 정확히 1개가 아님, 또는 그 버튼 top < 질문 입력창(`textarea`, 이름 `질문 입력`) bottom − 1 | 768·1024·1440: 2개 (헤더·입력창) |
  | `focusLabels` | 새 상태 '챗 포커스 필터 열림' (`/chat` 에서 `지식 검색 포커스 필터 설정 열기` 로 시작하는 버튼을 눌러 연 대화상자) | 그룹 `도메인 카테고리` 의 칩 글자 목록이 `['전체 소식', '하네스 & 벤치마크', 'MCP & 생태계', '에이전트 아키텍처', '최신 AI 동향']`(스크립트 상수)과 다름 | `['전체 소식', '하네스·평가', 'MCP·도구', '에이전트 기술', 'AI 뉴스']` |

  - 새 측정 상태 '챗 포커스 필터 열림'(5폭 × 2테마)에서도 14.8 의 상태별 검사(`clip`, `placeholder`, `occluded`, `scrollRow`, `ariaControls`, `keepAll`)와 R7 대화상자 속성 판정을 돌린다. 새로 잡힌 실패는 앱 코드를 고친다 (우려 31).
  - `--self-test` fixture (`defects.html` 은 `data-expect="<검사>"` 로 실패해야 함, `clean.html` 은 통과해야 함. `/chat` 용 검사는 fixture 안에 같은 선택자 구조를 둔다):

    | fixture | `defects.html` | `clean.html` |
    |---|---|---|
    | 좁은 소스 줄 (`toolbarLayout`, 360 폭으로 연 페이지) | `[data-feed-toolbar]` 안 한 줄에 소스 그룹(칩 6개) + 44px 토글 + 112px 선택창 (보정 6 구조) | 같은 요소, 줄 B `flex-wrap`, 소스 감싸개 `flex-basis:100%`, 토글 `margin-left:auto` |
    | RSS 합성 점수 (`cardMetric`) | `data-source="rss_kr"` 카드 바닥에 `sr-only` `점수` + `180`, `data-source="github"` 카드에 `댓글` | `rss_kr` 카드에 점수 없음, `github` 카드에 `스타`·`포크`, `hackernews` 카드에 `포인트` |
    | 넘친 모드 탭 (`chatScope`, 360 폭) | `[data-chat-context-bar]` 스크롤 줄에 폭 약 353px 두 탭, `scrollLeft` 를 둘째 탭이 보이게 민 상태 | 폭 약 202px 두 탭, `data-overflow="none"` |
    | 영어 용어 (`terms`) | 탭 `단일 기사 (Scoped)`, 배지 `Global`, 캡슐 `Focus: 전체 소식` | 탭 `단일 기사`·`전체 소식`, 배지 `전체 소식`, 캡슐 `포커스: 전체 소식`, `title` 이 글자와 같은 세션 제목 `Global 소식 정리`(사용자 글 면제 확인) |
    | 두 번 나온 모델 선택 (`modelPicker`) | 헤더와 입력창 아래에 `aria-label="Claude 모델 선택: Sonnet 5.5"` 버튼 둘 | 입력창 아래 하나, 헤더에 `display:none` 인 같은 버튼 하나 (숨긴 것은 세지 않음 확인) |
    | 다른 포커스 라벨 (`focusLabels`) | 그룹 `도메인 카테고리` 에 `하네스·평가` 등 | 긴 라벨 5개 |
  - 회귀 증명 (R30 ② 와 같은 방법): verify 단계에서 보정 7 구현 전 커밋(이 spec 승인 커밋)을 `git worktree add <scratchpad> <커밋>` 으로 프로덕션 빌드해 띄우고, 보정 7 의 ui-audit(현재 브랜치 파일)를 같은 백엔드 데이터로 돌린다. 위 표 '고치기 전' 열의 실패(360·390 `toolbarLayout`, `cardMetric`, 360 `chatScope`, `terms`, 768 이상 `modelPicker`, `focusLabels`)가 보고되어야 한다. 고친 뒤 같은 명령으로 전 조합 실패 0 이어야 한다. verify.md 에 두 실행의 명령·요약을 인용한다. 데이터에 `github` 카드가 첫 화면에 없으면 ④ 는 fixture 로만 증명하고 그렇게 적는다.
- 바뀌는 기존 단언 (요구가 바뀐 경우, 우려 27). 줄은 2026-11-07 작업 트리 기준:

  | 파일:줄 | 지금 단언 | 바뀐 단언 | 이유 |
  |---|---|---|---|
  | `feed/FeedToolbar.test.tsx:145` (테스트 제목) | `bleeds the source row to the left edge only, so it does not slide under the sort select` | `bleeds the source row to both edges below 768px and wraps Must-Read and sort onto the next line` | R35: 768 미만에서 소스 줄 오른쪽 이웃이 다음 줄로 내려가 양쪽 `bleed` |
  | `feed/FeedToolbar.test.tsx:148` | `toHaveClass('max-md:-ml-4', 'max-md:pl-4', 'scroll-px-6')` | `toHaveClass('max-md:-mx-4', 'max-md:px-4', 'scroll-px-6')` | 위와 같음. `bleed` 클래스를 같은 세기로 단언 |
  | `feed/FeedToolbar.test.tsx:149-150` | `not.toHaveClass('max-md:-mx-4')`, `not.toHaveClass('max-md:-mr-4')` | 줄 B(`sourceRow.closest('[data-toolbar-row]')`)가 `max-md:flex-wrap`, 그 줄의 직접 자식 중 소스 그룹을 담은 요소가 `max-md:basis-full`, Must-Read 토글이 `max-md:ml-auto` | 위와 같음. 오른쪽을 늘이지 않는다는 단언이 줄바꿈 배치 단언으로 바뀐다. :152-156(정렬이 같은 줄, 그룹 밖)은 그대로 |
  | `feed/FeedToolbar.test.tsx:263-265` | 주석 '오른쪽 표시는 정렬 선택창 밑으로 늘이지 않는다', `expect(end).not.toHaveClass('max-md:-mr-4')` | 주석 '오른쪽 표시도 화면 끝 여백을 쓴다 (소스 줄이 한 줄을 다 쓴다)', `expect(end).toHaveClass('max-md:-mr-4')`. :264 `start` 는 그대로 | 위와 같음 (14.3 보정 3-4: 표시 쪽 `bleed` 면 표시가 페이지 여백을 씀) |
  | `chat/ChatHeader.test.tsx:71-90` | 헤더에 `selectedTier`·`onSelectTier` 를 넘기면 모델 선택이 보이고 `Haiku 5.5` 를 고르면 콜백 | 헤더에 모델 선택이 없음: `queryByRole('button', { name: /Claude 모델 선택/ })` 가 null. 같은 동작(트리거 글자 `Sonnet 5.5`, `Haiku 5.5` 선택 → `onSelectTier('haiku')`)은 `chat/ChatPromptInput.test.tsx` 새 테스트로 옮긴다 | R39: 모델 선택은 입력창 한 곳. 단언 세기는 옮긴 곳에서 같다 |
  | `chat/ChatHeader.test.tsx:92-105` | 헤더 모델 선택이 스트리밍 중 비활성 | 지운다. 같은 단언(스트리밍 중 `Claude 모델 선택` 버튼 `disabled`)을 `chat/ChatPromptInput.test.tsx` 새 테스트로 옮긴다 | 위와 같음 (헤더에 대상이 없다) |
  | `chat/ChatWorkspace.test.tsx:295-321` (테스트 제목과 :300-302, :310-311, :319-320) | 트리거 2개(헤더·입력창)가 서로 동기화 | 제목 `shows a single model selector under the composer and reflects tier changes immediately (R39)`. `getAllByRole('button', { name: /Claude 모델 선택/i })` 길이 1, 처음 `Sonnet 5.5`, `Haiku 5.5` 선택 뒤 즉시 `Haiku 5.5`, `Opus 5.5` 선택 뒤 즉시 `Opus 5.5`. 트리거가 질문 입력창 뒤(DOM 순서) | R39. 두 트리거 동기화라는 요구(REQ-UI-008 표기)가 없어진다. 즉시 반영 단언은 같은 세기로 남긴다 |
  | `chat/ChatWorkspace.test.tsx:55` | `/요청하신 기사를 찾을 수 없어 전체 뉴스 모드로 시작합니다/i` | `/요청하신 기사를 찾을 수 없어 전체 소식 모드로 시작합니다/i` | R38 용어 통일 |
  | `chat/ChatWorkspace.test.tsx:142` | `findByRole('button', { name: /하네스·평가/i })` | `findByRole('button', { name: /하네스 & 벤치마크/ })` | R40 |
  | `chat/FocusBottomSheet.test.tsx:41-42` | `/하네스·평가/i`, `/MCP·도구/i` 버튼이 있음 | `/하네스 & 벤치마크/`, `/MCP & 생태계/` 버튼이 있음 | R40 |
  | `chat/FocusBottomSheet.test.tsx:90` | `getByRole('button', { name: /MCP·도구/i })` | `getByRole('button', { name: /MCP & 생태계/ })` | R40 |
  | `chat/FocusCapsule.test.tsx:140` (제목 :8, :48 의 `Focus:` 글자 포함) | `getByText('Focus: 전체 소식')` | `getByText('포커스: 전체 소식')` | R38: 캡슐 앞말 한국어 |
  | `chat/ChatSidebar.test.tsx:256` | `getByText(/Scoped/i)` | `getByText('단일 기사')` | R38 |
  | `chat/ChatSessionWorkflow.test.tsx:58` (보정 7 정정) | `getByRole('button', { name: /단일 기사\|Scoped/i })` | `getByRole('button', { name: '단일 기사' })` (정확 일치). :59 `aria-pressed="true"` 단언은 그대로 | R38 로 세션 카드 접근 이름이 `…, 단일 기사 모드` 가 되어, `ChatWorkspace` 안의 사이드바 세션 카드와 스코프 탭이 함께 걸려 'Found multiple elements' 로 깨진다 (42단계 implementer 보고). 정확 일치는 세션 카드 이름과 겹치지 않고 단언 세기(`aria-pressed`)는 같다 |

  위 밖의 기존 단언은 그대로 통과해야 한다. 확인한 것: `chat/ChatHeader.test.tsx:35` 의 `/단일 기사|Scoped/i` 는 새 라벨에도 맞는다 (`ChatHeader` 만 그려 세션 카드가 없다). (보정 7 정정) `chat/ChatSessionWorkflow.test.tsx:58` 은 처음에 여기서 '그대로 성립한다' 고 적었으나 세션 카드 접근 이름과 겹쳐 깨지므로 위 표로 옮겼다. `ui/FormControls.test.tsx:262-270` 은 `SegmentedControl` 단위 fixture 의 자체 라벨이라 바뀌지 않는다. `chat/ChatWorkspace.test.tsx:283-284` 는 `getAllByRole(...)[0]` 이라 트리거 1개에서도 성립한다. `NewsCard.test.tsx` 의 fixture 는 `source: 'github'`·`raw_score: 120`(`:11,25`)이라 점수가 계속 보인다. `feed/FeedToolbar.test.tsx:209-223`(오른쪽 표시 1개, 정렬 앞)은 `bleed` 가 양쪽이어도 `end` 상태에서 표시 1개이고 DOM 순서가 같아 성립한다 (`ScrollRow.tsx:415-428`). 구현 중 이 표 밖 단언이 깨지면 단언을 고치지 않고 멈춰 보고한다.
- 새 단언:
  - `feed/FeedToolbar.test.tsx` (R35): 360·1024·1440 에서 DOM 순서와 `data-toolbar-row` 묶음이 그대로 (기존 ③·④·⑤ 가 확인). 768 미만 줄바꿈 클래스(위 표). 768 이상 클래스(`md:` 접두 없는 `flex-wrap`·`basis-full`·`ml-auto`)가 없음.
  - `NewsCard.test.tsx` (R36): `source` 가 `rss_kr`·`rss`·`arxiv`·`huggingface` 이고 `raw_score` 120 이면 `[data-card-stat="score"]` 가 없고 `스타`·`점수` 글자도 없음. `github` 이면 `data-metric="stars"`, `sr-only` `스타`, `title` `GitHub 스타`. `hackernews` 는 `포인트`, `reddit` 은 `추천`. `github` 의 `comments_count` 15 는 `data-metric="forks"`·`포크`, `hackernews` 는 `comments`·`댓글`. 카드에 `data-source`. 인기 점수 단언(`:180-195`)은 그대로.
  - `ui/FormControls.test.tsx` (labels): `scoreMetric('github') === 'stars'`, `scoreMetric('rss_kr') === null`, `scoreMetric('huggingface') === null`, `countMetric('github') === 'forks'`, `countMetric('hackernews') === 'comments'`, `scopeLabel('scoped') === '단일 기사'`, `scopeLabel('global') === ALL_CATEGORY_LABEL === '전체 소식'`.
  - `chat/ChatPromptInput.test.tsx` (R39, ChatHeader 에서 옮김): `selectedTier`·`onSelectTier` 를 넘기면 `Claude 모델 선택` 버튼이 `Sonnet 5.5` 글자, `Haiku 5.5` 선택 → `onSelectTier('haiku')`, `isStreaming` 이면 버튼 `disabled`.
  - `chat/ChatHeader.test.tsx` (R37·R38): 스코프 두 버튼의 접근 이름이 정확히 `단일 기사`, `전체 소식`. 헤더에 모델 선택 없음.
  - `chat/ChatSidebar.test.tsx` 또는 `SessionItemCard` 테스트 (R38): `global` 세션 배지 `전체 소식`, 접근 이름에 `단일 기사 모드`/`전체 소식 모드`. 화면에 `Scoped`·`Global` 글자 없음.
  - `chat/FocusBottomSheet.test.tsx` (R40): 칩 글자 순서가 `['전체 소식', '하네스 & 벤치마크', 'MCP & 생태계', '에이전트 아키텍처', '최신 AI 동향']`.
- 바뀌는 파일 (예상, plan 이 확정): `frontend/src/lib/labels.ts`, `components/feed/FeedToolbar.tsx`, `components/NewsCard.tsx`, `components/chat/ChatContextBar.tsx`, `SessionItemCard.tsx`, `FocusCapsule.tsx`, `FocusBottomSheet.tsx`, `ChatHeader.tsx`, `ChatWorkspace.tsx`, `ChatMessageList.tsx`, `frontend/scripts/ui-audit.mjs`, `frontend/scripts/ui-audit-fixtures/defects.html`·`clean.html`, 테스트 `feed/FeedToolbar.test.tsx`, `NewsCard.test.tsx`, `ui/FormControls.test.tsx`, `chat/ChatHeader.test.tsx`, `chat/ChatPromptInput.test.tsx`, `chat/ChatWorkspace.test.tsx`, `chat/FocusBottomSheet.test.tsx`, `chat/FocusCapsule.test.tsx`, `chat/ChatSidebar.test.tsx`. `ScrollRow.tsx`·`Chip.tsx`·`ChatPromptInput.tsx`·`ChatModelSelector.tsx`·`NewsDetailModal.tsx` 는 바뀌지 않을 것으로 본다.
- 바뀌지 않는 것: R32 그대로 (backend, `types/**`, `mocks/**`, `lib/api.ts`, `package.json`·lock, localStorage 키). 계약 변경 없음: 카드 표시 규칙만 바뀌고 `NewsItem` 필드·zod·MSW 는 그대로다. 새 토큰·새 의존성 없음 (`ArrowBigUp`·`GitFork` 는 이미 의존하는 `lucide-react` 아이콘).
- `docs/product.md`: 범위·사용자·원칙·기능 목록이 바뀌지 않아 고치지 않는다. `docs/tech-spec.md`: '변경 이력' 의 `ui-redesign` 행에 보정 7 한 줄 (구현 뒤 `/implement-plan`).
- 문서 (`/implement-plan` 이 구현 마지막에 고친다):
  - `docs/known-issues.md`: 'UI·접근성' 의 포커스 필터 창 카테고리 라벨 행(2026-11-07 기준 `:59`)을 지운다 (R40). '데이터·동작 오류' 의 `첫 화면 카드의 별점(raw_score)·인기 점수(hotness_score)·상대 시간이 모두 같은 값으로 보인다 (의심: …)` 행(`:34`)을 확인된 원인으로 고친다: 문제 = 수집기가 `raw_score` 에 원천 지표가 아닌 값을 넣는다(`rss.py:75` 국내 180·그 밖 150 고정, `arxiv.py:48` 120 고정, `huggingface.py:33` `numComments + 40`, `github.py:61-69` 폴백 `stars_hint` 기본 5000) + `calculate_hotness` 가 `min(100, hotness × 8)` 로 포화한다(`categorizer.py:147`, 2026-11-07 DB 4734건 중 1034건이 100, `rss_kr` 459건 중 373건이 100). 영향 = 카드 인기 점수가 정보를 주지 않고 `추천순`(`raw_score`)·`인기순`(`hotness_score`) 정렬이 합성 값에 좌우된다. 프론트는 합성 `raw_score` 를 카드에서 숨긴다(R36). 상대 시간이 같은 값으로 보이는 것은 원인을 확인하지 않았다(의심으로 남긴다). '의심' 표기는 점수 부분에서 뺀다.
  - `docs/ui-spec.md`: 피드 툴바 768 미만 4줄(줄 B 줄바꿈), 카드 바닥 통계(지표별 아이콘·라벨, 합성 점수 숨김), 챗 헤더(모델 칩 삭제), 입력창 모델 칩(모든 폭), 모델 선택 팝오버 표(헤더 칩 행 삭제), 컴포넌트 트리의 `ChatModelSelector (header-chip)` 삭제, 맥락 줄 탭 라벨, 포커스 캡슐 앞말.
  - `docs/functional-spec/01-news-feed.md`: NEWS-02~06(768 미만 툴바 배치), NEWS-08(카드 통계 규칙). `docs/functional-spec/02-ai-chat.md`: CHAT-15(모델 선택 위치), CHAT-16(포커스 시트 라벨), CHAT-17(스코프 탭 라벨), 세션 배지·접근 이름, 없는 기사 알림 문구.
  - `docs/design-system.md`: `labels.ts` 설명(지표 표, `ALL_CATEGORY_LABEL`, `SCOPE_LABELS`), 9 검사 방법(새 검사 6개, 새 측정 상태, fixture).
  - `docs/test-cases.md`: 위 바뀐 단언(`:302-303` ChatHeader 모델 선택 두 행, `:421` 동기화 행 포함)과 새 단언. `docs/test-strategy.md`: ui-audit 새 검사·측정 상태.
- 단계 (planner 에게 넘기는 제안, plan 의 마지막 단계 뒤):
  1. **ui-audit 새 검사와 회귀 증명 준비** — 새 검사 6개, 측정 상태 '챗 포커스 필터 열림', fixture 6종, `--self-test` 통과. 앱 코드를 고치기 전에 프로덕션 빌드에 돌려 '고치기 전' 실패를 기록한다.
  2. **라벨** — `lib/labels.ts`(지표 표, `ALL_CATEGORY_LABEL`, `SCOPE_LABELS`)와 단위 테스트. 3·4 가 이것을 쓴다.
  3. **피드** (2 뒤) — `FeedToolbar` 줄바꿈·`bleed`, `NewsCard` 통계. 테스트 포함.
  4. **챗** (2 뒤, 3 과 병렬: 파일이 겹치지 않는다) — `ChatContextBar`, `SessionItemCard`, `FocusCapsule`, `FocusBottomSheet`, `ChatHeader`, `ChatWorkspace`, `ChatMessageList`. 테스트 포함.
  5. **전체 측정·문서** (1·3·4 뒤) — 프로덕션 빌드 ui-audit 전 조합 실패 0, 스크린샷 24장 육안 확인(360·390 피드 툴바, 카드 통계, 360 챗 탭, 1440 챗 헤더), 위 문서.

#### 14.16 보정 8: 인기 점수도 원천 지표 소스만 (R41)
- 근거: 메인 세션 지시(2026-11-07). 보정 7 구현 뒤 프로덕션 스크린샷 `audit/feed-light-1440x900.png` 에서 첫 줄·둘째 줄의 `국내 테크` 카드 5장이 점수 없이 `🔥 100` 만 같은 값으로 보인다 (spec 작성자 재확인. 같은 화면의 `GitHub` 카드는 `☆ 19,848 · 포크 2646 · 🔥 100`).
- 원인: `backend/app/collectors/categorizer.py:139-147` `calculate_hotness` 는 `engagement = raw_score + comments × 2.5 + 5` 를 시간으로 나눈 뒤 `min(100, hotness × 8)` 로 자른다. 인기 점수는 `raw_score` 에서 나오므로 R36 이 숨긴 합성 `raw_score` 소스(`rss_kr`·`rss` 고정 180·150, `arxiv` 120, `huggingface` `numComments + 40`)에서는 인기 점수도 합성 값이다. 메인 세션 DB 조회(2026-11-07): 4734건 중 1034건이 100, `rss_kr` 459건 중 373건이 100. 표시 코드는 `NewsCard.tsx:89` `showHot = item.hotness_score > 25` 로 소스를 보지 않는다 (줄은 2026-11-07 작업 트리 기준, 보정 7 구현 뒤).
- 설계: `NewsCard.tsx:89` 를 `showHot = scoreKind !== null && item.hotness_score > 25` 로 바꾼다 (`scoreKind = scoreMetric(item.source)`, `:91`. 선언 순서를 맞춘다). `lib/labels.ts` 는 바꾸지 않는다 (`scoreMetric` 이 '원천 지표가 있는 소스' 판정을 이미 한 곳에서 한다). 인기 통계 마크업(`data-card-stat="hotness"`, `Flame`, `sr-only` `인기 점수`, 반올림)은 그대로다. 기사 상세(`NewsDetailModal.tsx`)는 `hotness_score` 를 그리지 않는다 (`rg hotness_score frontend/src/components` 는 `NewsCard.tsx` 만) — 바꾸지 않는다.
  - 결과: 지표 없는 소스의 카드는 바닥 통계가 비거나 개수(`댓글`, `comments_count > 0` 일 때)만 남는다. 바닥 줄 높이는 오른쪽 버튼(`챗에서 분석`, `원문`)이 정하므로 카드 고정 틀(R17)과 `rowAlign` 은 바뀌지 않는다.
  - 지표 소스에서도 인기 점수가 포화할 수 있다 (예: 위 GitHub 카드 `🔥 100`). 포화 자체는 backend 계산이라 범위 밖이다 (우려 28).
- ui-audit (`frontend/scripts/ui-audit.mjs` `cardMetric`, 14.15 표의 행에 판정 ⑤ 를 더한다):

  | 검사 | 더하는 판정 (실패 조건) | 고치기 전 (예상) |
  |---|---|---|
  | `cardMetric` ⑤ | 카드 소스(14.15 와 같이 `data-source`, 없으면 머리줄 소스 라벨)가 점수 지표 표(`r7.scoreMetricLabels`)에 없는데 라벨이 `인기 점수` 인 통계(`[data-card-stat="hotness"]`, 없으면 `sr-only` `인기 점수` 의 부모)가 있으면 실패 '원천 지표가 없는 소스(<소스>)에 인기 점수'. 기록: `checks.cardMetric.summary.bySource.<소스>.hotnessShown` (인기 점수를 그린 카드 수) | 보정 7 구현 상태의 프로덕션 `/` 첫 화면 `국내 테크` 카드마다 실패 (`feed-light-1440x900.png` 의 `🔥 100` 5장) |

  - `--self-test` fixture: `defects.html` 에 블록 하나(`data-expect="cardMetric"`, `data-note="rss_kr 카드에 인기 점수"`)를 더한다: `data-source="rss_kr"` 카드 바닥에 `sr-only` `인기 점수` + `100` 만 (점수·개수 없음 — 판정 ①~④ 로는 통과하고 ⑤ 로만 실패해야 함). `clean.html` 의 `cardMetric` 절은 `github` 카드에 `sr-only` `인기 점수` + `100` 을 더하고(지표 소스는 통과), `rss_kr` 카드는 그대로(통계 없음) 둔다.
  - 회귀 증명 (R30 ② 와 같은 방법): verify 단계에서 보정 8 구현 전 커밋(이 spec 승인 커밋)을 프로덕션 빌드해 띄우고 보정 8 의 ui-audit(현재 브랜치 파일)를 같은 백엔드 데이터로 돌려 `cardMetric` ⑤ 실패가 보고되는지 확인한다. 고친 뒤 같은 명령으로 전 조합 실패 0 이어야 한다. verify.md 에 두 실행의 명령·요약을 인용한다.
- 바뀌는 기존 단언 (요구가 바뀐 경우, 우려 33). 줄은 2026-11-07 작업 트리 기준:

  | 파일:줄 | 지금 단언 | 바뀐 단언 | 이유 |
  |---|---|---|---|
  | `NewsCard.test.tsx:328-329` (`hides the synthetic raw_score for %s` 안) | 주석 '인기 점수는 그대로 보인다', `expect(stat(container, 'hotness')).not.toBeNull()` | 주석 '인기 점수도 합성 값이라 숨긴다 (R41)', `expect(stat(container, 'hotness')).toBeNull()` 과 `expect(screen.queryByText('인기 점수')).toBeNull()`. 같은 테스트의 :321-327 은 그대로 | R41: 합성 `raw_score` 소스의 인기 점수는 `raw_score` 에서 계산된 합성 값 |
  | `NewsCard.test.tsx:404-405` (`marks the hotness stat without a metric attribute`) | `renderSource({ source: 'rss_kr', hotness_score: 84.6 })` | `renderSource({ source: 'github', hotness_score: 84.6 })`. :406-410(`data-metric` 없음, `sr-only` `인기 점수`, `85`)은 그대로 | R41 로 `rss_kr` 카드에는 인기 통계가 없다. 테스트가 확인하던 마크업 규칙은 지표 소스에서 같은 세기로 단언한다 |

  위 밖의 기존 단언은 그대로 통과해야 한다. 확인한 것: `NewsCard.test.tsx:180-196`(인기 점수 바닥 이동·25 이하 숨김)은 fixture `source: 'github'`(`:11`)라 그대로 성립한다. `:157-169`(머리줄에 인기 없음)도 그대로다. 구현 중 이 표 밖 단언이 깨지면 단언을 고치지 않고 멈춰 보고한다.
- 새 단언 (`NewsCard.test.tsx`, R41): `rss_kr`·`rss`·`arxiv`·`huggingface`·`mystery` 각각 `hotness_score: 84.6` 이면 `[data-card-stat="hotness"]` 와 `인기 점수` 글자가 없음. `github`·`hackernews`·`reddit` 각각 `hotness_score: 84.6` 이면 인기 통계가 있고 `85`. 지표 소스라도 `hotness_score: 25` 면 없음 (기존 :193-196 이 `github` 로 확인).
- 바뀌는 파일 (예상, plan 이 확정): `frontend/src/components/NewsCard.tsx`, `frontend/scripts/ui-audit.mjs`, `frontend/scripts/ui-audit-fixtures/defects.html`·`clean.html`, `frontend/src/tests/NewsCard.test.tsx`. `lib/labels.ts`·`NewsDetailModal.tsx` 는 바뀌지 않을 것으로 본다.
- 바뀌지 않는 것: R32 그대로 (backend, `types/**`, `mocks/**`, `lib/api.ts`, `package.json`·lock, localStorage 키). 계약 변경 없음 (`hotness_score` 필드·zod·MSW 그대로). `인기순`·`추천순` 정렬(backend 값). 새 토큰·새 의존성 없음.
- `docs/product.md`: 바뀌지 않는다. `docs/tech-spec.md`: '변경 이력' 의 `ui-redesign` 행에 보정 8 한 줄 (구현 뒤 `/implement-plan`).
- 문서 (`/implement-plan` 이 구현 마지막에 고친다):
  - `docs/known-issues.md` '데이터·동작 오류' 의 카드 점수 행(2026-11-07 기준 `:34`) '영향' 칸: '카드의 인기 점수(`🔥100`)가 여러 카드에 같게 보여 정보를 주지 않고' 를 '카드는 원천 지표가 있는 소스(`github`·`hackernews`·`reddit`)만 `raw_score` 와 인기 점수를 그려 합성 값을 숨긴다(R36·R41). 지표 소스에서도 인기 점수가 포화하면 100 으로 같게 보이고' 로 고친다. 정렬·폴백 `stars_hint`·합성 포크 수 서술은 그대로 둔다.
  - `docs/ui-spec.md`: 카드 바닥 통계 (인기 점수는 지표 소스만).
  - `docs/functional-spec/01-news-feed.md`: NEWS-08 카드 통계 규칙 (인기 점수 표시 조건).
  - `docs/design-system.md`: 카드 통계 설명 (`scoreMetric` 이 점수·인기 둘 다의 표시 조건).
  - `docs/test-cases.md`: 위 바뀐 단언과 새 단언.
- 단계 (planner 에게 넘기는 제안, plan 의 마지막 단계 뒤): ① ui-audit `cardMetric` ⑤·fixture·`--self-test`, 앱 코드를 고치기 전에 프로덕션에 돌려 실패 기록 → ② `NewsCard` 와 테스트 (① 과 파일이 겹치지 않아 병렬 가능) → ③ 프로덕션 재측정(전 조합 실패 0, `feed-*` 스크린샷 육안 확인) → ④ 위 문서.

#### 14.17 보정 9: 피드 세 영역 분리(R42)와 화면 구성 결함 6건(R43~R48)
- 경위 (Revision 줄은 메인 지시로 더하지 않았다. 이 절이 보정 9 의 기록이다):
  1. 사용자 보고 "전체소식 부분 검색창이랑 정렬 콤보박스 이상하게 나옴". 메인이 HEAD `bcec1f5` 프로덕션(127.0.0.1:3101)에서 잰 값: 1440 분야 칩 줄(y 146) 칩 h32·알약·테두리 `rgb(226,232,240)`, 같은 줄 검색 입력 x1040 w288 h36·반경 8px·테두리 `border-strong`. 소스 줄(y 190) `Must-Read` x1063 w121 h32, 정렬 x1200 w128 h36. 오른쪽 열 왼쪽 끝 1040 ≠ 1063. 390: 분야 칩(y128) → 검색(y180) → 소스 칩(y232) → 별·정렬(y284, 왼쪽 194px 빔). 768 도 입력 36 ≠ 칩 32.
  2. 메인의 첫 방향(입력·정렬을 칩 높이·알약 모양·칩 테두리로 맞춤)은 사용자 재지시로 바뀌었다. 사용자 원문: "모바일 태블릿 pc 다 이상함. 정렬은 목록 영역에 있어야 하는데 전체소식 전체가 있는 영역에 있고, 검색도 영역이 따로 분리되어야함." → 모든 폭에서 검색 영역·필터 영역·목록 머리줄로 나눈다 (G1, R42). 첫 방향을 버린 까닭과 남는 차이는 우려 37.
  3. 메인이 47단계 스크린샷 24장(`docs/features/ui-redesign/audit/`, `d732326`)을 화면 구성 기준으로 다시 보고 결함 6건(H1~H6)을 더했다. spec 작성자는 각 원인을 아래 코드 줄로 확인했다 (줄은 HEAD `bcec1f5` 작업 트리 기준).

| 번호 | 화면·폭 | 결함 | 원인 (코드) | 요구 |
|---|---|---|---|---|
| G1 | 피드 전 폭 | 검색 입력이 분야 칩 줄 안(768 이상 오른쪽, 768 미만 칩 두 줄 사이)에 있고, 정렬이 소스 칩 줄 안에 있다. 같은 줄의 입력·정렬(36px, 반경 8px, `border-strong`)이 칩(32px, 알약, `border`)과 높이·모양이 다르고 오른쪽 열 왼쪽 끝이 23px 어긋난다. 390 은 별·정렬이 혼자 한 줄 | `FeedToolbar.tsx:241-250` 줄 A `[카테고리][검색]`, 줄 B `[소스][Must-Read][정렬]`. 검색 `formClassName="w-full md:w-48 md:shrink-0 xl:w-72"`(`:160`), 정렬 `containerClassName="w-28 shrink-0 xl:w-32"`(`:230`). 입력 모양은 `TextField.tsx:5-11,130`·`Select.tsx:54`(`h-11 md:h-9`, `rounded-lg`, `border-border-strong`), 칩은 `Chip.tsx:45`(`h-11 md:h-8`, `rounded-full`, `border-border`). 768 미만 줄 B 줄바꿈은 41단계(R35) `max-md:flex-wrap`(`:246`)·`max-md:basis-full`(`:173`)·`max-md:ml-auto`(`:214`) | R42, R35·R33·R34·R20 고침 |
| H1 | 챗 전 폭 | 헤더 왼쪽이 `대화 기록 아이콘 → ← 피드 → AI 챗` 순이다 | `ChatHeader.tsx:100-119`: `대화 기록 보기` `IconButton` 이 `피드로 돌아가기` `Link` 앞. `ChatWorkspace.tsx:672` 가 `onToggleHistoryDrawer` 를 모든 폭에 넘겨 버튼이 늘 보인다 | R43 |
| H2 | 챗 전 폭, 상세, 브리핑 | 빈 상태 추천 카드 💡🔄📊⚡, 모델 선택 🎯⚡🧠, 상세 빠른 질문 💡🛠️⚖️🔒, 브리핑 분야 머리글 🎯🔌🤖💡·`💡 시사점:` 이 이모지다. 나머지 UI 는 lucide | 프론트: `ChatMessageList.tsx:21-26`(질문 글자에 이모지가 들어 있어 누르면 이모지째 보냄, `:72`), `ModelTierBadge.tsx:22,32,42,74`(`TIER_META.icon` 문자열, `ChatModelSelector.tsx:114,168` 이 그림), `AskAiPanel.tsx:51-66`(라벨에 이모지, 옆의 lucide `icon` 은 그리지 않음 `:127`), `DailyBriefingModal.tsx:358`(`💡 시사점:`), `NewsDetailModal.tsx:200`(`⚠️ AI 응답 생성 실패`). backend: 브리핑 분야 아이콘 `briefing_service.py:17,24,31,38`(`categories[].icon`, `DailyBriefingModal.tsx:324` 가 그림), 마크다운 전문의 이모지(`:163-187`), 챗 단계 라벨(SSE `label`). `types/chat.ts:154-226` 의 `withIcon` 이모지는 컴포넌트가 쓰지 않는다(`rg withIcon frontend/src/components` 0줄) | R44, 우려 39 |
| H3 | 상세·카드 | 상세 탭 `AI 요약 & 시사점` / `Ask AI 질의응답`, 카드 `챗에서 분석`(접근 이름 `전용 챗에서 분석`)과 상세 배너 `전용 AI 챗으로 이동` 이 같은 동작을 다르게 부른다 | `NewsDetailModal.tsx:280,283`, `HandoverCtaButton.tsx:61-62,79-80,84`. 목적지 이름은 헤더 내비·챗 제목 `AI 챗`(`ChatHeader.tsx:121`). 용어 규칙은 R38(메인 지시의 'R39 용어 규칙' 은 R38 을 가리키는 것으로 읽었다. R39 는 모델 선택 위치다) | R45 |
| H4 | 브리핑 전 폭 | 설정 진입이 위 톱니 버튼과 바닥 `연동 설정 관리` 두 곳이다 (768 미만은 `브리핑 작업` 메뉴 `연동 설정` + 바닥). 헤드라인이 제목 아래와 `오늘의 핵심 요약` 안에 두 번 나온다. 헤드라인이 `…persistent p...` 처럼 단어 중간에서 잘린다 | 설정: `DailyBriefingModal.tsx:117-119,172-180,192-196`. 헤드라인 두 번: `:213`(`Dialog description`)과 `:297`. 잘림: backend `briefing_service.py:101-102` `title[:40] + "..."`(글자 수로 자름). 프론트는 헤드라인을 자르지 않는다(`Dialog.tsx:234` 에 `line-clamp`·`truncate` 없음). 같은 방식으로 분야 요약도 `:86,88` 에서 45자·90자로 자른다 | R46, 우려 39 |
| H5 | 브리핑·카드·상세 | 브리핑 분야 이름 `MCP & 도구·스킬 생태계`·`최신 AI 소식 & 프론티어 모델`·`에이전트 아키텍처 & 런타임` 이 피드 칩 `MCP & 생태계`·`최신 AI 동향`·`에이전트 아키텍처` 와 다르다. 카드 머리줄 `에이전트` 와 상세 배지 `에이전트 아키텍처` 도 다르다 | 브리핑: backend `briefing_service.py:16,23,30,37`(`CATEGORY_DEFS[].name`)을 `DailyBriefingModal.tsx:325`(`cat.name`)와 개요 정규식 `:301,307`(`**이름**`)이 그대로 그린다. 응답에 `categories[].id` 가 함께 온다(`:139`). 카드·상세: R19 의 짧은 라벨(카드 머리줄)·긴 라벨(상세 배지·필터 칩) 설계(`lib/labels.ts`) | R47, 우려 40 |
| H6 | 피드 1024 | 3열에서만 카드 바닥 `챗에서 분석` 글자가 사라지고 아이콘만 남는다. 768·1440 은 글자가 있다 | `NewsCard.tsx:217` `compactBetweenLgXl` → `HandoverCtaButton.tsx:82,84` `lg:max-xl:px-2`·`lg:max-xl:sr-only`. 바닥 줄은 줄바꿈하지 않는 한 줄(`NewsCard.tsx:178`)이라 통계가 긴 GitHub 카드에서 자리가 모자란다 (아래 폭 계산) | R48 |

- 설계 G1 (R42, R35·R33·R34·R20 고침):
  - 영역과 폭별 배치. 세 영역은 `main` 의 flex 열(`page.tsx:164`, `gap-3 md:gap-4`)의 형제이고 사이 간격은 main `gap` 하나다 (R20):

    | 폭 | 검색 영역 `[data-feed-search]` | 필터 영역 `[data-feed-toolbar]` | 목록 머리줄 `[data-feed-list-header]` |
    |---|---|---|---|
    | ≥768 | 콘텐츠 전체 폭 입력 36px. sticky 아님 | 줄 1 카테고리 칩(`flex-1 min-w-0`, `xl` 미만 아이콘 숨김 그대로) 32px / 줄 2 소스 칩(`flex-1 min-w-0`) + `Must-Read`(별 + 글자) 32px, 줄 간격 8px. `md:sticky md:top-14` 그대로 | 왼쪽 상태(`총 N건`·배지, 오른쪽 끝 `페이지 p / T`) + 오른쪽 정렬 `w-28 xl:w-32` 36px |
    | <768 | 전체 폭 입력 44px | 줄 1 카테고리 칩(화면 좌우 끝까지, `bleed`) 44px / 줄 2 소스 칩(왼쪽 화면 끝까지, `bleed="start"`) + `Must-Read`(별만 44×44) 44px, 줄 간격 8px. sticky 아님(그대로) | 같은 구성, 정렬 `w-28` 44px |

  - `FeedToolbar` (`components/feed/FeedToolbar.tsx`): 두 형제를 Fragment 로 그린다. ① `<div data-feed-search="" className="scroll-mt-20">{searchField}</div>` — `searchField` 의 `formClassName` 은 `w-full` 하나(`md:w-48 md:shrink-0 xl:w-72` 삭제). `SearchField`·`TextField` 부품은 바꾸지 않는다 (입력 토큰 그대로, 우려 37). ② 지금의 툴바 `div[data-feed-toolbar]`(클래스 그대로: `-my-2 py-2` 상쇄, `md:sticky`, 배경). 안의 줄 A 는 카테고리만(`max-md:flex-col max-md:items-stretch` 삭제), 줄 B 는 `[소스][Must-Read]`(`max-md:flex-wrap` 삭제, 소스 `className` 에서 `max-md:basis-full` 삭제, `bleed` 를 `true` 에서 `'start'` 로, 토글 `className` 에서 `max-md:ml-auto` 삭제). 정렬 `Select`·`SORT_OPTIONS`·`sort`·`onSortChange` prop 을 `FeedToolbar` 에서 뺀다. `data-toolbar-row`·`data-must-read-toggle`·`data-source-chip`·`selectedSelector` 는 그대로. 토글은 줄 B 의 마지막 자식이라 오른쪽 끝이 콘텐츠 오른쪽 끝이다 (`ToolbarRow` 가 콘텐츠 폭을 다 쓴다).
  - `FeedStatusBar` (`components/feed/FeedStatusBar.tsx`)가 목록 머리줄이 된다. 새 prop `sort: string`, `onSortChange: (sort: string) => void`, `onPageChange: (page: number) => void`. 구조:
    `<div data-feed-list-header="" className="flex items-start gap-3">` 안에 ① 지금의 상태 `div`(`ref`, `data-feed-status`, `tabIndex={-1}`, `role="status"`, `aria-live="polite"`, `scroll-mt-44 md:scroll-mt-48` 그대로)에 `min-w-0 flex-1 min-h-11 md:min-h-9` 를 더한다. (정정, verifier 편차·메인 결정, 구현 `a7b2d95`) 머리줄은 `items-center` 가 아니라 `items-start` 다: 상태가 여러 줄로 감기면 `items-center` 는 정렬을 머리줄 세로 가운데로 내린다(360 필터 상태에서 정렬 top − 머리줄 top = 14 실측). 상태 최소 높이를 정렬 높이(768 미만 44px, 이상 36px)와 같게 두어, 상태가 한 줄이면 상태 안 `items-center` 로 글자 중심이 정렬 중심과 맞는다(차 −0.5px). Chrome 실측: 360·390·1440 기본·필터 6상태 모두 정렬 top − 머리줄 top = 0. 안쪽은 지금처럼 `flex flex-wrap items-center justify-between gap-x-3 gap-y-1` 로 [건수·배지] [페이지]. ② 그 뒤 형제 `Select label="정렬" hideLabel options={SORT_OPTIONS} containerClassName="w-28 shrink-0 xl:w-32"`, `onChange` 는 지금 `FeedToolbar.tsx:226-229` 와 같이 `onSortChange(value)` 뒤 `onPageChange(1)`. `SORT_OPTIONS` 는 이 파일로 옮겨 내보낸다.
    - 정렬을 live 영역 밖에 두는 이유: `role="status"` 안의 조작 요소는 값이 바뀔 때마다 상태 문장으로 다시 읽히고, 페이지 이동 뒤 상태 줄로 옮기는 포커스(`FeedPagination` `statusRef`)가 정렬 글자까지 읽는다. 상태 영역은 지금 내용(건수·배지·페이지) 그대로 두어 알림 동작을 바꾸지 않는다.
  - `page.tsx`: `FeedToolbar` 에 `sort`·`onSortChange` 를 넘기지 않고 `FeedStatusBar` 에 `sort={sort} onSortChange={setSort} onPageChange={setPage}` 를 넘긴다. `/` 단축키(`:145`)는 `input.focus({ preventScroll: true })` 뒤 `input.closest('[data-feed-search]')?.scrollIntoView({ block: 'nearest', behavior: 'auto' })` 로 바꾼다. 검색 영역의 `scroll-mt-20`(80px = 헤더 56 + 24)이 `scrollIntoView` 에 적용돼 스크롤한 화면에서도 입력이 sticky 헤더(56px) 아래에 다 보인다. 768 이상에서 검색 영역이 sticky 가 아니게 되어 생기는 변화다 (우려 36).
  - DOM·Tab 순서: `검색 → 카테고리 줄(이전 버튼, 칩, 다음 버튼·표시) → 소스 줄 → Must-Read → 상태 → 정렬 → 카드`. 화면 순서와 같다 (R33). `order`·`*-reverse` 를 쓰지 않는다.
  - 폭 계산 (계산값, ui-audit 로 확인. 콘텐츠 폭 = `main` 안쪽: 1440 1216px(x 112~1328), 1024 960px, 768 720px, 390 358px, 360 328px):
    - 검색 입력: 콘텐츠 전체 폭. 자리표시 `키워드 검색` 은 360 에서도 안쪽 글자 폭(328 − `pl-9` 36 − `pr-3` 12 = 280px, 값이 있으면 지우기 버튼 자리 `pr-12` 48 → 244px)에 들어간다 (R16 `placeholder`).
    - 카테고리 줄(검색이 빠져 한 줄을 다 씀): 1440 857px ≤ 1216, 1024 아이콘 뺀 약 747px ≤ 960 (보정 8 까지 약 955/960), 768 약 747 > 720 → R15 스크롤 버튼 (보이는 칩 3개 → 4개 남짓, 우려 29).
    - 소스 줄: 1440 1216 − 16 − 114 = 1086 ≥ 약 869 (넘치지 않음), 1024 960 − 130 = 830, 768 720 − 130 = 590 (넘치면 R15). 360: 감싸개 16~(344 − 8 − 44) = 16~292, 왼쪽 `bleed` 로 줄은 x 0 부터. 넘치면 오른쪽 표시 자리 16px(14.3 보정 3-4 의 `bleed` 없는 쪽)를 빼 줄 상자 0~276, 보이는 폭 276px (390: 306px). 칩: 왼쪽 패딩 16 뒤 `전체 4734`(약 87px) 16~103, `국내 테크 459`(약 100px) 111~211 ≤ 276 − 흐림 24 = 252 → 흐림 밖에 다 보이는 칩 2개 (390 도 2개, 셋째 칩은 약 304 에서 끝나 282 를 넘음). 보정 7(R35 전체 폭)의 360 약 344px·칩 2개보다 보이는 폭은 68px 좁지만 칩 수는 같다 (우려 35).
    - 목록 머리줄 360 (필터 없는 처음 상태, `text-sm` 14px·`text-xs` 12px, 한글 한 자 ≈ 글자 크기, 숫자 ≈ 0.6em 가정): `총 4734건` ≈ 14 + 4 + 34 + 14 = 66px, `페이지 1 / 263` ≈ 36 + 3 + 7 + 11 + 20 = 77px, 상태 안 간격 12 → 155px. 상태 칸 = 328 − 12 − 112 = 204px ≥ 155 (여유 49px). 건수 5자리·페이지 4자리여도 약 170px 로 한 줄. 필터가 걸리면 `(전체 4734건)` 약 93px 와 배지가 붙어 상태 안쪽이 줄바꿈되고 머리줄이 높아진다. 정렬은 첫 줄 오른쪽에 남는다: 머리줄이 `items-start` 라 정렬 top = 머리줄 top 이다 (정정, 위 `FeedStatusBar` 항목). 넘치지 않으므로 가로 스크롤·잘림은 없다 (우려 38).
    - 첫 화면(R5): 768 이상 검색 영역 위쪽부터 카드 위까지 보정 8 의 80(줄 A 36 + 8 + 줄 B 36) + 16 + 상태 20 + 16 = 132px → 36 + 16 + 72(32 + 8 + 32) + 16 + 36 + 16 = 192px (+60). 2026-11-07 `report.json` 1440 첫 줄 아래 끝 559 → 약 619 (H6 바닥 줄바꿈이 첫 줄 GitHub 카드에 생기면 +약 36 → 약 655) < 900. 768 미만은 200(줄 A 96 + 8 + 줄 B 96) + 12 + 20 + 12 = 244 → 44 + 12 + 96 + 12 + 44 + 12 = 220px (−24). 390 첫 제목 아래 끝 493 → 약 469 < 844. sticky 띠(768 이상): 헤더 56 + 필터 영역 88(72 + `py-2` 16) = 144px (보정 8 의 152px 보다 작다).
  - 모양 결정: 검색 입력과 정렬은 입력 토큰(`h-11 md:h-9`, `rounded-lg`, `border-border-strong`, hover `border-fg-subtle`, 포커스 링)을 그대로 쓴다. 칩과 같은 줄에 있지 않으므로 높이·모서리를 칩에 맞출 이유가 없고, 입력 경계는 WCAG 2.2 SC 1.4.11 의 3:1 을 넘어야 한다: 라이트 테마 흰 바탕에서 `border-strong` `rgb(123,135,152)` 약 3.6:1, 칩 테두리 `rgb(226,232,240)` 약 1.2:1 (계산값, 우려 37).
  - 검색 너비 결정: 모든 폭에서 콘텐츠 전체 폭. 이유 ① 세 영역의 왼쪽·오른쪽 끝이 같아진다(사용자 보고의 '끝이 안 맞음' 을 없앤다) ② 폭마다 같은 규칙(단일 디자인시스템) ③ 새 최대 폭 상수를 만들지 않는다. 1440 에서 입력이 1216px 로 길어지는 것은 받아들인다: 근거 없음(가정), 대안은 우려 37.
- 설계 H1 (R43): `ChatHeader.tsx` 에서 `Link`(`:111-119`)를 기록 `IconButton`(`:100-109`) 앞으로 옮긴다. 클래스·`aria-*` 는 그대로. 결과 순서 `[← 피드] [기록] AI 챗 … [새 대화] [팔레트] [더보기]`.
- 설계 H2 (R44):
  - `ChatMessageList.tsx:21-26` → `{ icon, text }` 배열. 글자에서 이모지를 빼고(`FastMCP로 파이썬 기반 경량 MCP 서버 구축하는 방법` 등), 카드 앞에 lucide 아이콘(`aria-hidden`, `size-4`, `text-accent`)을 둔다. 아이콘은 설치된 `lucide-react` 에 있는 이름으로 implementer 가 고른다 (예: `Server`, `GitBranch`, `ChartColumn`, `TrendingUp`). `onSelectPromptSuggestion(text)` 는 이모지 없는 글자를 보낸다.
  - `ModelTierBadge.tsx` `TIER_META.icon` 을 lucide 컴포넌트로: `haiku` `Zap`, `sonnet` `Target`, `opus` `Brain`. Claude 밖 티어: gemini `Sparkles`, gpt `Bot`, 그 밖 `Target`. 그릴 때 `<Icon aria-hidden="true" data-tier-icon={tier} className="size-3.5" />`. `ChatModelSelector.tsx:114,168` 도 같은 컴포넌트를 그린다. 이름·비용·지연 표시는 그대로.
  - `AskAiPanel.tsx:51-66` 라벨에서 이모지를 빼고(`핵심 원리 및 구조`, `실무 프로젝트 도입`, `차별점 및 한계`, `보안 및 샌드박스`), 이미 있는 `icon` 을 버튼 글자 앞에 그린다(`aria-hidden`, `size-4`). 질문 문장(`query`)은 그대로.
  - `DailyBriefingModal.tsx:358` `💡 시사점:` → lucide `Lightbulb`(`aria-hidden`, `size-4`) + `시사점:`. 분야 머리글 아이콘은 H5 설계.
  - `NewsDetailModal.tsx:200` `⚠️ AI 응답 생성 실패: …` → `AI 응답 생성 실패: …`.
  - 정적 검사 `frontend/src/tests/ui/IconGuard.test.ts`(새 파일): `frontend/src/components/**/*.{ts,tsx}`·`frontend/src/app/**/*.{ts,tsx}` 파일 글자에서 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/u`(전역 플래그로 세기) 가 0개. (정정) 처음 적은 `/\p{Extended_Pictographic}/u` 는 너무 넓다: 텍스트 표현 기호인 `app/page.tsx:265` 바닥글 `©`(U+00A9)와 `ui/Toast.tsx:34,185` 주석 `↔`(U+2194)도 `Extended_Pictographic` 이라 걸려, 54단계를 고친 뒤에도 실패한다 (planner 확인). 텍스트 표현 기호(`©`·`®`·`↔` 등)는 기본이 글자 모양으로 그려지는 기호이지 그림 이모지가 아니므로, 기본이 이모지 표현인 글자(`Emoji_Presentation`)와 U+FE0F 로 이모지 표현을 고른 그림 문자만 센다 (메인 결정, planner 선택지 ①). 메인이 node 로 센 결과: 이 식은 대상 다섯 파일의 16글자만 걸고 `©`·`↔` 는 걸지 않는다. `ModelChangeDivider.tsx:40` 의 `➔`(U+2794)·`WorkflowStepTracker.tsx:125` 의 `✓`(U+2713)도 걸리지 않고 바꾸지 않는다.
- 설계 H3 (R45): `NewsDetailModal.tsx:283` 탭 라벨 `AI 질의응답`. `HandoverCtaButton.tsx`: `modal-banner` 제목 `AI 챗에서 분석`, 보조 문구 `이 기사를 단일 기사 모드로 열어 질의응답`. `card-compact` 의 `aria-label` 을 지워 접근 이름 = 보이는 글자 `AI 챗에서 분석` 으로 하고(WCAG 2.5.3 을 더 단순하게 만족), `title` 은 `AI 챗에서 이 기사를 단일 기사 모드로 분석`. `compactBetweenLgXl` prop 과 그 클래스는 H6 에서 지운다. ui-audit `ENTRY_POINTS` `card-chat` 이름(`ui-audit.mjs:1463`)을 `/^AI 챗에서 분석/`, `DIALOGS` 뉴스 상세 탭 이름(`:1565`)을 `/^AI 질의응답/` 로 고친다 (R9 진입점 판정 유지).
- 설계 H4 (R46): `DailyBriefingModal.tsx` 의 위 작업 줄 `연동 설정` `IconButton`(`:172-180`)과 `mobileMenuItems` 의 `연동 설정` 항목(`:117-119`)을 지운다. 바닥 버튼(`:192-196`)의 글자를 `연동 설정` 으로 줄인다(대화상자의 다른 이름 `연동 설정` 과 같게). 실패 알림 안의 `Notion 설정 열기`·`이메일 설정 열기`(`:252-256,267-271`)는 둔다. `오늘의 핵심 요약` 칸의 헤드라인 `<p>`(`:297`)를 지우고 개요만 둔다. 헤드라인은 `Dialog` 설명(`:213`, `aria-describedby`)으로 두 탭 모두에서 보인다. 개요(`briefing.overview`)가 없으면 `오늘의 핵심 요약` 칸을 그리지 않는다.
  - 헤드라인의 단어 중간 잘림은 backend 가 만든 문자열이다(`briefing_service.py:101-102`). 프론트는 받은 글자를 그대로 그린다. 범위 밖으로 두고 별도 intent 로 넘긴다 (우려 39).
- 설계 H5 (R47): `DailyBriefingModal` 분야 머리글은 `categoryLabel(cat.id)`(긴 라벨)을 쓰고, `cat.id` 가 `labels.ts` 표에 없으면 `cat.name`. 머리글 아이콘은 `cat.icon`(backend 이모지) 대신 피드 카테고리 칩과 같은 lucide 아이콘(`harness` `ShieldCheck`, `mcp_plugins_skills` `Cpu`, `agent_tech` `Bot`, `ai_news` `Sparkles`, `FeedToolbar.tsx:13-19` 의 표를 한 곳에서 같이 쓴다. 표에 없는 id 는 아이콘 없음). 개요 줄의 `**이름**:`(`:301,307`)은 이름이 `briefing.categories` 의 어떤 `name` 과 같으면 그 `id` 의 긴 라벨로 바꿔 그린다. 마크다운 전문 탭은 backend 문서 그대로다 (우려 39). 카드 머리줄의 짧은 라벨(R19)은 둔다: 1024 카드 머리줄 안쪽 약 226px(카드 안쪽 266 − 북마크 32 − 간격 8)에 긴 라벨 `에이전트 아키텍처`(약 99px) + 소스 + 시간을 넣으면 `Global Blogs` 같은 긴 소스에서 시간이 말줄임으로 사라진다(계산값). 대신 카테고리 `span`(`NewsCard.tsx:117`)에 `title={categoryLabel(item.category)}` 를 단다. 짧은 라벨은 모두 긴 라벨의 일부다(`에이전트` ⊂ `에이전트 아키텍처`, `AI 동향` ⊂ `최신 AI 동향`) (우려 40).
- 설계 H6 (R48): `NewsCard.tsx` 바닥 줄(`:178`)을 `flex flex-wrap items-center justify-between gap-x-2 gap-y-1` 로, 통계 묶음(`:179`)에서 `min-w-0` 을 빼고, 버튼 묶음(`:213`)에 `ml-auto` 를 더한다. 그래서 한 줄에 다 들지 않으면 버튼 묶음이 다음 줄 오른쪽 끝으로 내려간다. `compactBetweenLgXl`(`:217`, `HandoverCtaButton.tsx:20,29,82,84`)을 지운다.
  - 폭 계산 (계산값): 버튼 묶음 = `AI 챗에서 분석` 버튼(`px-2.5` 20 + 아이콘 16 + `gap-2` 8 + 글자 약 95 = 약 139) + 4 + `원문` 링크(약 58) = 약 201px. 카드 안쪽: 1440 3열 352px, 1024 3열 약 266px, 768 2열 312px, 390 1열 326px, 360 1열 296px — 모두 201 이상이라 버튼 묶음은 어느 폭에서도 한 줄에 다 든다. 통계가 가장 긴 GitHub 카드(`☆ 19,848 · 포크 2646 · 🔥 100` 약 165px): 165 + 8 + 201 = 374 > 352 라 모든 폭에서 두 줄, 통계가 없거나 짧은 RSS 카드는 한 줄. 보정 8 까지 1440 은 `챗에서 분석` 으로 약 351 ≤ 352 였다(여유 1px).
  - 같은 줄 카드는 grid `items-stretch` 와 `h-full` 로 높이가 같고 바닥 줄은 `mt-auto` 로 아래에 붙으므로 R17·`rowAlign`(제목 top·카드 높이)은 그대로다. 두 줄 바닥과 한 줄 바닥이 같은 줄에 섞일 수 있다 (우려 41).
- ui-audit (`frontend/scripts/ui-audit.mjs`). 새 검사 5개를 `R9_CHECKS` 로 더하고(`R7_CHECKS` 와 같은 방식, `ALL_CHECKS` 에 포함), 기존 검사 3개의 판정을 바꾼다. 기준 상수(입력 높이 44/36, 칩 높이 44/32, 허용 1px·0.5px, 긴 라벨 목록, 금지 용어)는 스크립트 상단에 둔다. 콘텐츠 상자 = `[data-feed-toolbar]` 의 부모(프로덕션은 `main`)의 rect 에서 `padding-left/right` 를 뺀 범위.

  | 검사 | 대상 | 판정 (실패 조건) | 고치기 전 (예상) | 고친 뒤 |
  |---|---|---|---|---|
  | `feedAreas` (새) | `/` 처음 상태, 5폭 × 2테마 | ① `[data-feed-search]`·`[data-feed-list-header]` 가 정확히 1개가 아님, 검색 입력(이름 `키워드 검색`)이 `[data-feed-search]` 밖, `[data-feed-toolbar]` 안에 `input[type="search"]`·`select` 가 있음, 정렬(`select`, 이름 `정렬`)이 `[data-feed-list-header]` 밖 ② 순서: 검색 영역 bottom > 필터 영역 첫 칩 줄 top + 1, 또는 마지막 칩 줄 bottom > 목록 머리줄 top + 1 ③ 겹침: 검색 입력의 세로 범위가 필터 영역의 어느 칩 그룹(`[role="group"]`) 세로 범위와 1px 넘게 겹침 ④ 높이: 검색 입력·정렬 높이 ≠ 44(768 미만)/36(이상) ±0.5, `Must-Read` 토글 높이 ≠ 같은 줄 소스 칩 높이 ±0.5 ⑤ 끝 맞춤(±1px): 검색 입력 왼쪽·오른쪽 끝 = 콘텐츠 상자 끝, 목록 머리줄 왼쪽 끝 = 콘텐츠 왼쪽, 정렬 오른쪽 끝 = 토글 오른쪽 끝 = 콘텐츠 오른쪽. 768 이상은 카테고리 그룹 왼쪽 끝 = 콘텐츠 왼쪽도 ⑥ 한 줄: 목록 머리줄 높이 > 정렬 높이 + 1. 기록: `checks.feedAreas.layout = { viewport, content, search, sort, toggle, header }` (rect) | 모든 폭 ①(`[data-feed-search]`·`[data-feed-list-header]` 없음, 툴바 안 검색·정렬). 768 이상 ③(1440 검색 y 146 이 분야 칩 줄과 같은 줄)·⑤(검색 왼쪽 1040 ≠ 112), 768 미만 ②(검색이 칩 두 줄 사이) | 모든 조합 실패 0 |
  | `toolbarLayout` (판정 바꿈, R35) | `/` 처음 상태, `innerWidth < 768` (768 이상은 기록만, 지금과 같음) | 소스 줄 보이는 폭 < `innerWidth − pagePadding(16) − 8 − touchMin(44) − 16 − 1`; 흐림 밖에 다 보이는 소스 칩 < 2; 토글 세로 가운데가 소스 줄 top~bottom 밖(다른 줄); 토글 오른쪽 끝 ≠ 콘텐츠 오른쪽 ±1; `[data-feed-toolbar]` 안에 `select`·`input[type="search"]` 가 있음. 보정 7 의 '보이는 폭 ≥ innerWidth − 33'·'토글·정렬 top ≥ 소스 줄 bottom' 은 지운다. 기록 `checks.toolbarLayout.source` 에서 `sortTop` 을 빼고 `toggleRight`·`contentRight` 를 더한다 | 360·390: 토글이 소스 줄 아래 줄, 툴바 안 정렬·검색 | 실패 0 (360 보이는 폭 276 ≥ 275) |
  | `vRhythm` (판정 바꿈, R20) | `/` | 요약 바 → `[data-feed-search]`, `[data-feed-search]` → 필터 영역 첫 `[data-toolbar-row]`, 마지막 `[data-toolbar-row]` → `[data-feed-list-header]` 세 간격이 12~16px 밖. 대상이 없으면 '대상 없음' 실패 (지금의 `[data-feed-status]` 대상은 `[data-feed-list-header]` 로 바뀐다) | '대상 없음: `[data-feed-search]`, `[data-feed-list-header]`' | 실패 0 |
  | `chatHeader` (새, R43) | `/chat` 기본, 5폭 × 2테마 | 첫 `header` 안 보이는 `a[href]`·`button` 중 DOM 첫 요소가 이름 `피드로 돌아가기` 링크가 아님, 또는 그 링크 왼쪽 끝이 다른 보이는 조작 요소 왼쪽 끝보다 1px 넘게 오른쪽 | 모든 폭 (기록 버튼이 먼저) | 실패 0 |
  | `pictograph` (새, R44) | `/chat` 기본, 챗 포커스 필터 열림, 뉴스 상세 두 탭, 일일 브리핑 | 보이는 `button`, `a`, `[role="tab"]`, `[role="menuitem"]`, `[role="radio"]`, `label`, `h1`~`h3` 의 다듬은 글자가 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/u` 에 걸림 (정정: `IconGuard` 와 같은 식. 텍스트 표현 기호 `©`·`↔` 등은 걸지 않는다). `.markdown-viewer` 안, `a[target="_blank"]` 안(외부 기사 제목), `title` 이 글자와 같은 요소(사용자 글)는 뺀다 | `/chat` 기본: 추천 카드 4개·모델 칩 `🎯`. 뉴스 상세 `AI 질의응답` 탭: 빠른 질문 4개 (정정: 고치기 전 커밋에서는 이 탭을 열지 못해 프로덕션 측정으로는 나오지 않는다, 아래 회귀 증명). 일일 브리핑: 분야 머리글 `h3`(backend 아이콘) | 실패 0 |
  | `terms` (판정 넓힘, R45) | 지금 대상(`/chat` 측정 상태) + `/` 처음 상태 + 뉴스 상세 두 탭 | 지금 판정에 더해: 보이는 조작 요소(`button`, `a`, `[role="tab"]`)의 접근 이름이나 보이는 글자에 `Ask AI`·`전용 챗`·`전용 AI 챗` 이 있음 | `/` 카드마다 `전용 챗에서 분석`, 상세 탭 `Ask AI 질의응답`·배너 `전용 AI 챗으로 이동` | 실패 0 |
  | `briefing` (새, R46·R47) | 일일 브리핑 상태(측정 폭) | ① 대화상자 안 보이는 `button` 중 접근 이름에 `설정` 이 있고 `[role="alert"]`·`[role="status"]` 밖인 것이 1개가 아님 ② 대화상자 설명(`aria-describedby` 대상)의 글자와 같은 글자를 가진 다른 보이는 요소가 있음 ③ `카테고리별 요약` 탭 패널의 분야 머리글(`h3`, `오늘의 핵심 요약` 제외) 글자가 긴 라벨 4개(스크립트 상수) 밖 | ① 768 이상 2개(톱니·바닥) ② 헤드라인 두 번 ③ `MCP & 도구·스킬 생태계` 등 | 실패 0 |
  | `cardFooter` (새, R48) | `/` 처음 상태의 보이는 `[data-feed-card]`, 5폭 × 2테마 | 카드 안 접근 이름이 `/챗에서 분석/` 인 버튼에 보이는 글자 `AI 챗에서 분석`(rect 폭·높이 > 1, `sr-only` 아님)이 없음; 버튼 묶음(그 버튼의 부모) rect 가 카드 안쪽 상자(카드 rect − padding) 밖으로 1px 넘게 나감; 통계 묶음(`[data-card-stat]` 의 부모)과 버튼 묶음 rect 가 1px 넘게 겹침 | 모든 폭(보이는 글자가 `챗에서 분석`), 1024 는 글자가 `sr-only` | 실패 0 |

  - `--self-test` fixture (`defects.html` 은 `data-expect` 로 실패해야 함, `clean.html` 은 통과해야 함. 768 미만 판정은 지금처럼 `[data-self-test-narrow]` 영역을 360 폭으로 연다):

    | fixture | `defects.html` | `clean.html` |
    |---|---|---|
    | 칩 줄 안 검색·정렬 (`feedAreas`, 1440) | 보정 8 구조: `[data-feed-toolbar]` 줄 A `[카테고리 그룹][검색 288px 36px]`, 줄 B `[소스 그룹][토글 32px][select 128px 36px]`, 그 아래 `[data-feed-status]` | 콘텐츠 상자 안 `[data-feed-search]`(전체 폭 36px 입력) → `[data-feed-toolbar]`(카테고리 줄, 소스 줄 + 토글 32px) → `[data-feed-list-header]`(상태 + 128px 36px select, 오른쪽 끝 맞춤) |
    | 칩 줄 사이 검색 (`feedAreas`, 360) | 보정 7 구조: 카테고리 줄 / 검색 / 소스 줄 / 토글 + select 줄 | 위 구조의 44px 판 |
    | 아래 줄 토글 (`toolbarLayout`, 360) | 지금 '좁은 소스 줄' clean 구조(줄 B `flex-wrap`, 소스 `flex-basis:100%`, 토글 `margin-left:auto`, select 포함) | 소스 줄 + 44px 토글 한 줄, select 없음 |
    | 기록 버튼이 앞 (`chatHeader`) | `header` 안 `[기록 버튼][피드로 돌아가기 링크]` | `[링크][기록 버튼]` |
    | 이모지 (`pictograph`) | 버튼 `💡 FastMCP…`, `h3` `🔌 MCP & 생태계` | 버튼 `svg` + 글자, `.markdown-viewer` 안 `💡`, `a[target="_blank"]` 안 `🚀` 제목(둘 다 면제 확인), `h2` `AgentLens © 2026 ↔ 피드`(텍스트 표현 기호는 걸리지 않음 확인, 정정) |
    | 영어·전용 용어 (`terms`) | 탭 `Ask AI 질의응답`, 버튼 `aria-label="전용 챗에서 분석"` | 탭 `AI 질의응답`, 버튼 `AI 챗에서 분석` |
    | 브리핑 중복 (`briefing`) | `role="dialog"` 에 설정 버튼 2개, 설명과 본문에 같은 헤드라인, `h3` `MCP & 도구·스킬 생태계` | 설정 버튼 1개 + `role="alert"` 안 `이메일 설정 열기`(면제 확인), 헤드라인 1번, `h3` `MCP & 생태계` |
    | 아이콘만 남은 바닥 줄 (`cardFooter`) | 안쪽 266px 카드에 이관 버튼 글자 `sr-only`, 또 하나는 줄바꿈 없이 버튼 묶음이 카드 밖으로 넘침 | 같은 카드, 바닥 줄 `flex-wrap`·버튼 묶음 `margin-left:auto` 로 다음 줄, 글자 보임 |
  - 기존 fixture 중 `[data-feed-toolbar]` 를 가진 clean 블록(보정 5 '숨은 Must-Read' clean, 보정 7 '좁은 소스 줄' clean)과 `vRhythm` 대상 블록은 새 세 영역 구조(검색 영역·필터 영역·목록 머리줄)로 고친다. 그대로 두면 새 판정에서 clean 이 실패한다. defects 블록에 생기는 덤 실패는 `data-expect` 판정을 가리지 않게 `data-expect-reason` 으로 이유를 지정한다.
  - 회귀 증명 (R30 ② 와 같은 방법): verify 단계에서 보정 9 구현 전 커밋(이 spec 승인 커밋)을 `git worktree add <scratchpad> <커밋>` 으로 프로덕션 빌드해 띄우고 보정 9 의 ui-audit(현재 브랜치 파일)를 같은 백엔드 데이터로 돌린다. 위 표 '고치기 전' 열의 실패가 보고되어야 하고, 고친 뒤 같은 명령으로 전 조합 실패 0 이어야 한다. 일일 브리핑이 없으면 `briefing`·`pictograph`(브리핑 상태)는 skipped 이고 fixture 로만 증명했다고 적는다. (정정, 메인 결정: plan 의 대안 채택) 보정 9 의 ui-audit 는 뉴스 상세 둘째 탭을 새 이름 `/^AI 질의응답/`(`DIALOGS`)로 찾으므로, 고치기 전 커밋 `adf8581`(탭 이름 `Ask AI 질의응답`)에서는 그 탭을 열지 못한다. 그래서 그 탭 상태의 `pictograph` 실패(빠른 질문 이모지 4개)와 `terms` 의 탭 이름 실패는 프로덕션 회귀 측정으로 증명하지 않고, ① `--self-test` fixture(`pictograph`·`terms` 행) ② 단위 테스트(`AskAiPanel.test.tsx`·`modals/NewsDetailModal.test.tsx` 의 바뀐 단언과 빠른 질문 `svg` 새 단언) ③ `IconGuard` 정적 검사(고치기 전 `AskAiPanel.tsx:51-66` 에서 실패)로 증명한다. 고치기 전 실행에서 그 탭 상태가 열리지 않은 것은 실패나 통과가 아니라 '측정 못 함' 으로 verify.md 에 적는다. 고친 뒤 실행에서는 그 탭 상태가 열려 실패 0 이어야 한다. verify.md 에 두 실행의 명령·요약과 360·390·768·1024·1440 라이트 `feed-*`, 1440·390 `chat-*`, `detail-*`, `briefing-*` 스크린샷 육안 확인을 남긴다.
- 바뀌는 기존 단언 (요구가 바뀐 경우, 우려 34). 줄은 2026-11-07 작업 트리(HEAD `bcec1f5`) 기준:

  | 파일:줄 | 지금 단언 | 바뀐 단언 | 이유 |
  |---|---|---|---|
  | `feed/FeedToolbar.test.tsx:11,18`(`setup`), `:325,332`(`baseProps`) | fixture 에 `sort`, `onSortChange` | 두 키를 지운다 (`FeedToolbarProps` 에서 빠짐). 단언 아님 | R42: 정렬이 `FeedToolbar` 밖 |
  | `feed/FeedToolbar.test.tsx:50` (제목), `:57-61` | 정렬을 찾아 `Must-Read` 가 소스 그룹 뒤·정렬 앞 | 제목 `shows the Must-Read toggle outside the source group at the end of the source row, and toggles it`. `queryByRole('combobox', { name: '정렬' })` 가 null, `mustRead` 가 소스 그룹과 같은 `data-toolbar-row` 의 `lastElementChild`, 소스 그룹 뒤(DOM). :62-67 은 그대로 | R42·R34: 토글은 소스 줄 오른쪽 끝, 정렬은 목록 머리줄 |
  | `feed/FeedToolbar.test.tsx:80-93` | `FeedToolbar` 의 정렬 4옵션·콜백 | 새 `feed/FeedStatusBar.test.tsx` 로 옮긴다: 같은 옵션 4개(값·글자), `latest` 선택 → `onSortChange('latest')`, `onPageChange(1)` | R42. 단언 세기는 옮긴 곳에서 같다 |
  | `feed/FeedToolbar.test.tsx:145` (제목), `:148`, `:150-152`, `:154-158` | `bleed` 양쪽(`max-md:-mx-4`·`max-md:px-4`), 줄 B `max-md:flex-wrap`, 소스 감싸개 `max-md:basis-full`, 토글 `max-md:ml-auto`, 정렬이 줄 B 안 | 제목 `bleeds the source row to the left edge only and keeps Must-Read on the same row below 768px (R35 보정 9)`. :148 `toHaveClass('max-md:-ml-4', 'max-md:pl-4', 'scroll-px-6')` 와 `not.toHaveClass('max-md:-mx-4')`·`not.toHaveClass('max-md:-mr-4')`. :150-152 줄 B 가 `max-md:flex-wrap` 아님, 감싸개가 `max-md:basis-full` 아님, 토글이 `max-md:ml-auto` 아님. :154-158 `[data-feed-toolbar]` 안에 `combobox` 가 없음 | R35 보정 9: 41단계 줄바꿈을 되돌림. 보정 6 의 `bleed` 단언과 같은 세기 |
  | `feed/FeedToolbar.test.tsx:225` (제목), `:230-231`, `:237` | 표시가 정렬 앞, 줄이 정렬을 담음 | 제목 `… outside the group and before the Must-Read toggle`. `sort` 대신 `toggle = getByRole('button', { name: 'Must-Read' })`: 줄이 토글을 담고, 표시가 토글 앞 | 정렬이 줄 B 에 없다. 같은 순서 단언을 토글로 |
  | `feed/FeedToolbar.test.tsx:241` (제목), `:264`, `:278`, `:279-281` | `end` 표시가 정렬 앞, `end` 가 `max-md:-mr-4` | 제목 `… (start before the group, end before the Must-Read toggle)`. `end` 가 토글 앞. 주석 '오른쪽 표시는 토글 앞이라 화면 끝 여백을 쓰지 않는다 (보정 6 과 같음)', `expect(end).not.toHaveClass('max-md:-mr-4')`. :280 `start` 는 그대로 | `bleed="start"` 로 돌아가 오른쪽 표시는 `bleed` 없는 쪽 (14.3 보정 3-4) |
  | `feed/FeedToolbar.test.tsx:341-347` (`controls()`), `:422` | `controls()` 가 정렬을 찾고 ② 가 정렬 노드 유지 단언 | `controls()` 에서 `sort` 를 뺀다. :422 를 지우고 같은 단언(폭 목 360 → 1440 으로 다시 그려도 정렬이 같은 노드)을 `feed/FeedStatusBar.test.tsx` 에 둔다 | R42·R33. 세기는 옮긴 곳에서 같다 |
  | `feed/FeedToolbar.test.tsx:426-433` (③) | 제목 `③ orders controls 카테고리 → 검색 → 소스 → 정렬`, `precedes(category, search)`, `precedes(search, source)`, `precedes(source, sort)` | 제목 `③ orders controls 검색 → 카테고리 → 소스 → Must-Read in the DOM at %ipx`. `precedes(search, category)`, `precedes(category, source)`, `precedes(source, toggle)` | R42·R33: 검색이 필터 영역 위 |
  | `feed/FeedToolbar.test.tsx:435-454` (⑤) | `precedes(toggle, sort)` | 토글이 소스 그룹과 같은 `data-toolbar-row` 의 `lastElementChild`. 나머지(:442, :444-452)는 그대로 | R34 보정 9 |
  | `feed/FeedToolbar.test.tsx:468-479` (④) | 제목 `④ puts 카테고리+검색 and 소스+정렬 in the same toolbar rows`, 검색은 줄 A, 정렬은 줄 B | 제목 `④ puts search in its own area above the filter rows and Must-Read in the source row at %ipx`. 검색의 `closest('[data-toolbar-row]')` 가 null, `closest('[data-feed-search]')` 가 있고 그 영역이 `[data-feed-toolbar]` 밖·앞(DOM). 토글의 `data-toolbar-row` = 줄 B. :474-476 은 그대로 | R42 |
  | `chat/ChatModelSelector.test.tsx:22` | `toHaveTextContent('🎯')` | 트리거 안 `[data-tier-icon="sonnet"]` `svg` 가 있고 `aria-hidden="true"`, 트리거 글자에 그림 문자 없음 | R44: 티어 아이콘이 lucide |
  | `chat/ChatModelSelector.test.tsx:181`, `:189` | `getByText('⚡')`, `getByText('🎯')` | `[data-tier-icon="haiku"]`, `[data-tier-icon="sonnet"]` 가 있음 | R44 |
  | `chat/ChatModelSelector.test.tsx:202` | `queryByText('🧠')` 가 null | `[data-tier-icon]` 이 null | R44. `showIcon={false}` 단언 세기 같음 |
  | `AskAiPanel.test.tsx:47`, `:67` | `getAllByText('💡 핵심 원리 및 구조')` | `getAllByText('핵심 원리 및 구조')` | R44 |
  | `modals/NewsDetailModal.test.tsx:98`, `:213` | 버튼 이름 `'💡 핵심 원리 및 구조'` | `'핵심 원리 및 구조'` | R44 |
  | `modals/NewsDetailModal.test.tsx:81,97,102,130,166,177,188,212` | 탭 이름 `/Ask AI 질의응답/` | `/^AI 질의응답/` (:102 의 건수 배지 `1` 단언은 그대로) | R45 |
  | `modals/NewsDetailModal.test.tsx:76` | 버튼 `/전용 AI 챗으로 이동/` 1개 | 버튼 `/^AI 챗에서 분석/` 1개 | R45 |
  | `NewsCard.test.tsx:236-241` | 제목 `shows the handover button as icon-only between lg and xl while keeping its accessible name`, 이름 `전용 챗에서 분석`, 글자 `챗에서 분석` 의 클래스에 `lg:max-xl:sr-only` | 제목 `keeps the handover label visible at every width (R48)`. 이름 `AI 챗에서 분석` 버튼 안 글자 `AI 챗에서 분석` 의 클래스에 `sr-only` 가 들어 있지 않음. 바닥 줄이 `flex-wrap`, 버튼 묶음이 `ml-auto` | R48·R45: 아이콘만 모드를 없앰. 클래스 단언 세기 같음 |
  | `chat/HandoverIntegration.test.tsx:69`, `:104` | `/전용 챗에서 분석\|Ask AI/i` | `{ name: 'AI 챗에서 분석' }` (정확 일치) | R45 |
  | `chat/HandoverIntegration.test.tsx:85`, `:122` | `/전용 AI 챗으로 이동\|전용 챗에서 분석/i` | `/^AI 챗에서 분석/` (배너 이름에 보조 문구가 이어짐) | R45 |

  위 밖의 기존 단언은 그대로 통과해야 한다. 확인한 것: `FeedToolbar.test.tsx:95-111`(검색 제출·지우기)·`:115-118`(자리표시)·`:120-133`(필터 영역에 줄 2개 이상, 카테고리·소스 다른 줄)·`:135-141`·`:161-173`(접두 없는 `flex-wrap`·`basis-full`·`ml-auto` 없음 — 되돌린 뒤에도 성립)·`:387-403`(①)·`:456-466`(⑤ 노드 유지)은 성립한다. `modals/NewsDetailModal.test.tsx:65,88,137` 의 `'AI 요약 & 시사점'` 은 바뀌지 않는다. `chat/ChatMessageList.test.tsx:28` 의 `/FastMCP|LangGraph|SWE-bench|동향/i` 는 이모지를 뺀 글자에도 맞는다. `ui/FormControls.test.tsx:143,151` 의 `정렬` 은 `Select` 단위 fixture 라 바뀌지 않는다. `modals/DailyBriefingModal.test.tsx:8-27` 의 `이메일 발송` 단언은 그대로다. 구현 중 이 표 밖 단언이 깨지면 단언을 고치지 않고 멈춰 보고한다.
- 새 단언:
  - `feed/FeedStatusBar.test.tsx` (새 파일, R42): 옮긴 정렬 단언(위 표), 정렬이 `[data-feed-list-header]` 안·`role="status"` 밖이고 상태 뒤(DOM), 상태가 `aria-live="polite"`·`페이지 p / T` 를 그대로 담음, 머리줄 `flex items-start` 이고 `flex-wrap` 아님(정정: `items-center` 아님), 상태가 `min-w-0 flex-1 min-h-11 md:min-h-9`, 정렬 감싸개 `w-28 shrink-0 xl:w-32`, 폭 목 360 → 1440 다시 그려도 같은 정렬 노드.
  - `feed/FeedToolbar.test.tsx` (R42): `[data-feed-search]` 가 `scroll-mt-20` 이고 검색 폼이 `w-full` 이며 `md:w-48`·`xl:w-72` 가 없음, `[data-feed-toolbar]` 안에 `searchbox`·`combobox` 가 없음.
  - `chat/ChatHeader.test.tsx` (R43): `피드로 돌아가기` 링크가 `대화 기록 보기` 버튼보다 DOM 앞, 헤더 안 첫 조작 요소가 그 링크.
  - `chat/ChatMessageList.test.tsx` (R44): 첫 추천 카드를 누르면 `onSelectPromptSuggestion` 이 `'FastMCP로 파이썬 기반 경량 MCP 서버 구축하는 방법'`(이모지 없음)으로 불림, 카드마다 `svg[aria-hidden="true"]` 하나.
  - `ui/IconGuard.test.ts` (새 파일, R44): 위 정적 검사.
  - `AskAiPanel.test.tsx` (R44): 빠른 질문 버튼마다 `svg[aria-hidden="true"]`.
  - `modals/DailyBriefingModal.test.tsx` (R46·R47, MSW 브리핑): `onOpenSettings` 를 주면 이름에 `연동 설정` 이 있는 버튼이 정확히 1개, `브리핑 작업` 메뉴를 열면 `연동 설정` 항목이 없음, 헤드라인 글자가 정확히 1번(`getAllByText(headline)` 길이 1), 분야 머리글이 `MCP & 생태계`·`에이전트 아키텍처` 이고 `MCP & 플러그인 생태계` 글자가 `카테고리별 요약` 패널에 없음, 시사점 줄에 `svg[aria-hidden="true"]` 와 `시사점:`.
  - `NewsCard.test.tsx` (R47): 머리줄 카테고리 `span` 의 `title` 이 `categoryLabel(item.category)`.
- 바뀌는 파일 (예상, plan 이 확정): `frontend/src/components/feed/FeedToolbar.tsx`, `feed/FeedStatusBar.tsx`, `frontend/src/app/page.tsx`, `components/chat/ChatHeader.tsx`, `chat/ChatMessageList.tsx`, `chat/ModelTierBadge.tsx`, `chat/ChatModelSelector.tsx`, `chat/HandoverCtaButton.tsx`, `news-detail/AskAiPanel.tsx`, `NewsDetailModal.tsx`, `DailyBriefingModal.tsx`, `NewsCard.tsx`(카테고리 아이콘 표를 함께 쓰려고 새 모듈을 둘 수 있다), `frontend/scripts/ui-audit.mjs`, `frontend/scripts/ui-audit-fixtures/defects.html`·`clean.html`, 테스트 `feed/FeedToolbar.test.tsx`, `feed/FeedStatusBar.test.tsx`(새), `chat/ChatHeader.test.tsx`, `chat/ChatMessageList.test.tsx`, `chat/ChatModelSelector.test.tsx`, `chat/HandoverIntegration.test.tsx`, `AskAiPanel.test.tsx`, `modals/NewsDetailModal.test.tsx`, `modals/DailyBriefingModal.test.tsx`, `NewsCard.test.tsx`, `ui/IconGuard.test.ts`(새). `ui/SearchField.tsx`·`ui/TextField.tsx`·`ui/Select.tsx`·`ui/Chip.tsx`·`ui/ScrollRow.tsx`·`lib/labels.ts` 는 바뀌지 않을 것으로 본다.
- 바뀌지 않는 것: R32 그대로 (backend, `types/**`, `mocks/**`, `lib/api.ts`, `package.json`·lock, localStorage 키). 계약 변경 없음: 브리핑 응답의 `categories[].name`·`icon`·`headline` 필드는 그대로 오고 화면에서 쓰지 않거나(`icon`) 표에 없을 때만 쓴다(`name`). 정렬 값·검색 동작·`/` 단축키 키는 그대로. 새 토큰·새 의존성 없음 (새 아이콘은 이미 의존하는 `lucide-react`).
- 범위 밖 (backend 문자열, 우려 39): 브리핑 헤드라인·분야 요약을 글자 수로 자름(`briefing_service.py:86,88,101-102`), 분야 이름·이모지 아이콘(`:16-38`), 마크다운 전문의 이모지·이름(`:163-187`), Notion·이메일 본문의 `📌`(`notion_service.py:79`, `email_service.py:120`), 챗 단계 라벨의 이모지(SSE). 별도 intent(`/triage-signal` 또는 `/write-intent`)로 넘긴다: 단어 경계에서 자르기 또는 자르지 않기, `CATEGORY_DEFS` 이름을 `labels.ts` 긴 라벨과 맞추기, 이모지 제거.
- `docs/product.md`: 범위·사용자·원칙·기능 목록이 바뀌지 않아 고치지 않는다. `docs/tech-spec.md`: '변경 이력' 의 `ui-redesign` 행에 보정 9 한 줄 (구현 뒤 `/implement-plan`).
- 문서 (`/implement-plan` 이 구현 마지막에 고친다):
  - `docs/ui-spec.md`: 피드 와이어프레임(`:43-90` 의 폭별 툴바 그림을 검색 영역·필터 영역·목록 머리줄로), 영역 표 상태 줄 행(`:106`, 정렬 포함), 세로 간격 문장(`:112`), 카드 바닥 줄(줄바꿈, 이관 글자), 상세 탭 이름·이관 배너 문구, 챗 헤더 순서, 추천 카드·모델 티어 아이콘, 브리핑 대화상자(설정 하나, 헤드라인 한 번, 분야 머리글 라벨·아이콘).
  - `docs/functional-spec/01-news-feed.md`: NEWS-02~06(검색 영역, 정렬 위치, Must-Read 위치, `/` 포커스 스크롤), NEWS-08(바닥 줄, `AI 챗에서 분석`, 머리줄 `title`), 상세 탭 이름, 상태 줄. `02-ai-chat.md`: 헤더 순서, 추천 질문 아이콘·보내는 글자, 모델 티어 아이콘. `04-briefing-and-sharing.md`: 브리핑 대화상자 설정 진입·헤드라인·분야 이름. `07-ui-common.md`: 그림 문자 금지·lucide 규칙이 있으면 그 절.
  - `docs/design-system.md`: 아이콘 규칙(그림 문자 금지, `IconGuard`), 입력과 칩의 쓰임 구분(입력은 별도 영역, 칩 줄에 섞지 않음), `ModelTierBadge` 아이콘, 9 검사 방법(새 검사 5개·바뀐 판정 3개·fixture).
  - `docs/known-issues.md`: 새 행(적절한 절) — 브리핑 헤드라인·분야 요약을 글자 수로 잘라 단어 중간에서 끊김(`briefing_service.py:86,88,101-102`), 브리핑 backend 분야 이름·이모지가 `labels.ts` 와 다름(화면은 R47 로 가리고 마크다운 전문·Notion·이메일에는 남음), 챗 단계 라벨의 이모지(SSE).
  - `docs/test-cases.md`: 위 바뀐 단언과 새 단언. `docs/test-strategy.md`: `IconGuard` 정적 검사, ui-audit 새 검사.
- 단계 (planner 에게 넘기는 제안, plan 의 마지막 단계 뒤):
  1. **ui-audit 새 검사·바뀐 판정과 회귀 증명 준비** — `feedAreas`·`chatHeader`·`pictograph`·`briefing`·`cardFooter`, `toolbarLayout`·`vRhythm`·`terms` 판정, fixture, `--self-test` 통과. 앱 코드를 고치기 전에 프로덕션에 돌려 '고치기 전' 실패를 기록한다.
  2. **피드 영역** — `FeedToolbar`·`FeedStatusBar`·`page.tsx` 와 테스트(`FeedToolbar.test.tsx`, `FeedStatusBar.test.tsx`).
  3. **카드·이관 용어** (2 와 파일이 겹치지 않아 병렬 가능) — `NewsCard`·`HandoverCtaButton`·`NewsDetailModal` 탭 라벨·`AskAiPanel` 과 테스트.
  4. **챗** (병렬 가능) — `ChatHeader`·`ChatMessageList`·`ModelTierBadge`·`ChatModelSelector` 와 테스트.
  5. **브리핑** (병렬 가능, 카테고리 아이콘 표를 2 와 함께 쓰면 2 뒤) — `DailyBriefingModal` 과 테스트.
  6. **정적 검사** (3·4·5 뒤) — `ui/IconGuard.test.ts`.
  7. **전체 측정·문서** (1~6 뒤) — 프로덕션 ui-audit 전 조합 실패 0, 스크린샷 24장 육안 확인, Chrome 확인(`/` 포커스 스크롤), 위 문서.

## 우려 사항
| 우려 | 관련 정책 | 정책 소유자 | 해결 |
|---|---|---|---|
| 1. 색 이름을 단언하는 테스트가 토큰 전환으로 깨진다: `ChatSidebar.test.tsx:240-241`(`border-l-indigo-600`, `bg-indigo-50`), `ChatMessageItem.test.tsx:188`·`CitationBadge.test.tsx:100`·`ChatWorkspace.test.tsx:261`(`emerald`), `ChatMessageItem.test.tsx:266`(`bg-slate-100`). R1(팔레트 클래스 0개)과 함께 지킬 수 없다 | `CLAUDE.md` "테스트를 고쳐 통과시키지 않는다" | 코드 오너 (본인) | 제안: 단언 대상을 '색 이름' 에서 '같은 의미의 표시' 로 바꾼다. 활성 세션은 `data-active="true"` + `bg-accent-soft` + `border-accent`, 보충 출처는 `data-tone="supplementary"` + `text-success`, 인라인 코드는 `bg-surface-muted`. 단언을 지우거나 느슨하게 하지 않고 같은 동작(강조 표시, 보충 출처 구분)을 계속 검사한다. plan 에 파일·줄·이유를 적는다. 이 spec 을 승인하면 이 다섯 단언 변경을 승인한 것으로 본다. 미승인 시 대안: 해당 세 곳만 팔레트 클래스를 예외로 남기고 R1 정규식에 허용 목록을 둔다 (비권장) |
| 2. `MobileViewport.test.tsx:18-19` 가 `maximumScale: 1`, `userScalable: false` 를 단언한다. intent 기준 8(확대 허용)과 정면으로 충돌한다 | `CLAUDE.md` "테스트를 고쳐 통과시키지 않는다" | 코드 오너 (본인) | 요구사항이 바뀐 경우다. 단언을 새 요구사항으로 바꾼다: `viewport.maximumScale` 이 없고 `viewport.userScalable` 이 `false` 가 아니다. 같은 파일의 나머지 단언(`text-base`, `sm:text-sm`, `overflow-x-hidden`, `max-w-full`)은 그대로 둔다 |
| 3. eslint 기준선 오류 54개는 이번 디자인 변경 전부터 있다. 기준 10 을 위해 디자인과 무관한 파일(`lib/api.ts`, 테스트)까지 고쳐야 해 범위가 넓어진다 | intent 제약 "한 번에 바꾸는 범위가 크다. 화면 단위로 나눈다" | 제품 오너 (본인) | 11.1 의 0단계로 분리해 먼저 끝내고 단계마다 `make check` 를 통과시킨다 |
| 4. lint 오류가 있는 `types/chat.ts`, `mocks/handlers.ts`, `mocks/handlers/chat.ts` 를 고쳐야 한다. intent 제약은 `types/**`·`mocks/**` 의 스키마·응답 형태를 바꾸지 말라고 하고, contracts.md 는 이 경로를 고치면 세 쪽 동기화를 요구한다 | intent 제약, `.claude/rules/contracts.md` | 제품 오너 (본인) / 코드 오너 (본인) | 타입 표기만 고친다 (설계 12). zod 스키마 객체·내보낸 타입 이름·필드·MSW 응답 본문을 바꾸지 않으므로 계약 변경이 아니고 backend 쪽은 건드리지 않는다. 확인: `ContractAndMsw.test.ts` 단언 변경 없이 통과, reviewer 가 diff 에서 스키마·응답 불변을 확인 |
| 5. lint 오류가 있는 테스트 파일 `ContractAndMsw.test.ts`, `ThemeSystem.test.tsx` 를 고쳐야 한다 | `CLAUDE.md` "테스트를 고쳐 통과시키지 않는다" | 코드 오너 (본인) | 실패하는 테스트를 통과시키려는 수정이 아니라 `any` 타입 표기만 바꾼다. 단언·입력값은 그대로 둔다. plan 에 줄 단위로 적는다 |
| 6. 대비 값은 손 계산이다. 실제 렌더(불투명도·배경 겹침)에서 다를 수 있다 | 제품 원칙 WCAG 2.2 AA | 제품 오너 (본인) | `TokenContrast.test.ts` 로 토큰 조합을 자동 확인하고, `ui-audit` 스크린샷을 verify 에서 사람이 본다. 불투명도 수정자로 만든 글자 배경은 쓰지 않는다 (1.3 규칙) |
| 7. 폭별 측정(R3~R6)은 단위 테스트(jsdom)로 증명할 수 없고, `ui-audit` 는 실행 중인 앱·로컬 Chrome 이 있어야 해 `make check` 에 들어가지 않는다 | `CLAUDE.md` 작업 완료 보고에 `make check` 출력 | 코드 오너 (본인) | verify 단계에서 `ui-audit` 결과(`audit/report.json`)를 증거로 붙인다. Chrome 이 없으면 verify.md 에 미검증으로 적는다 |
| 8. 기본 팔레트 네임스페이스를 지우지 않아 Tailwind 빌드 차원의 강제가 없다 | intent 기준 1 | 코드 오너 (본인) | `TokenGuard.test.ts` 가 `make check` 에서 막는다. `--color-*: initial` 적용은 `bg-transparent` 등이 남는지 확인한 뒤 후속으로 둔다 |
| 9. 인라인 테마 스크립트는 나중에 CSP(`'unsafe-inline'` 금지)를 도입하면 nonce 가 필요하다 | 보안 정책 없음 | — | 지금은 CSP 가 없다. design-system.md 에 적어 둔다 |
| 10. (2차) R19 카테고리 라벨 통일과 C-3 칩 원값 수정은 라벨 문구를 고정한 단언 6줄과 충돌한다: `NewsCard.test.tsx:51`(`Harness`), `ui/FormControls.test.tsx:332-335`(`categoryLabel` 영문 4개), `chat/ActiveSourceChip.test.tsx:19`(원값 `mcp_plugins_skills`) | `CLAUDE.md` "테스트를 고쳐 통과시키지 않는다", R13(한국어 문구) | 코드 오너 (본인) | 요구사항이 바뀐 경우다 (영문·원값 표시가 R13 과 known-issues 에서 결함으로 기록됨). 단언 대상을 새 라벨로 바꾼다: `하네스`(카드 짧은 라벨), `categoryLabel` 의 긴 라벨 4개, 칩의 `MCP`. 단언을 지우거나 느슨하게 하지 않는다. plan 에 파일·줄·이유를 적는다. 이 spec 을 승인하면 이 6줄 변경을 승인한 것으로 본다. 미승인 시 대안: `labels.ts` 영문을 두고 `ActiveSourceChip` 만 `categoryLabel` 을 쓴다 (`ActiveSourceChip.test.tsx:19` 한 줄 변경은 여전히 필요, 카드 영문 라벨과 필터 한국어 라벨 불일치는 known-issues 에 남김) |
| 11. (2차) 반복 시사점(F5)은 backend 데이터 문제다. `llm_processor.py:84-89,703-709` 가 LLM 평가가 시사점을 주지 않으면 카테고리별 고정 문장을 저장한다. R18 은 카드에서 반복을 감추는 완화일 뿐이고 상세 대화상자·챗 출처에는 같은 문장이 그대로 보인다 | intent 제약 "backend 는 바뀌지 않는다", 지시 E | 서비스 오너 (본인) | 범위 밖. 별도 intent 로 넘긴다 (`/triage-signal` 또는 `/write-intent`: 시사점이 없으면 빈 값 저장 또는 재생성). known-issues 에 행을 추가한다 (14.10) |
| 12. (2차) 첫 화면 카드가 모두 `Hot 100`·별점 180·`18일 전` 이다. 점수 포화나 수집 데이터 편향일 수 있으나 확인하지 않았다 | intent 제약 (backend 불변) | 서비스 오너 (본인) | 범위 밖. R17 이 `Hot` 을 바닥 통계로 내려 화면 영향만 줄인다. 원인 조사는 별도 신호로 |
| 13. (2차) 강화한 ui-audit 도 Chrome·실행 중인 프로덕션 앱이 필요해 `make check` 에 들어가지 않는다. 휴리스틱(5점 hit test, 끝 40자 키, 1px 허용)은 오탐·미탐이 있을 수 있다 | `CLAUDE.md` 작업 완료 보고에 `make check` 출력, 우려 7 | 코드 오너 (본인) | R30 의 자체 검증(고정 결함 페이지)과 수정 전 코드 회귀 증명으로 판정을 검증하고, 대표 스크린샷 24장을 verify 에서 사람이 본다. Chrome 이 없으면 verify.md 에 미검증으로 적고 통과로 보고하지 않는다 |
| 14. (2차) 1차 plan.md·verify.md 가 승인 상태인데 화면 결함·알려진 문제가 남아 있었다. 2차는 승인된 산출물 위에 범위를 다시 연다 | `CLAUDE.md` SDLC (승인된 plan 의 '변경 파일' 밖 편집 금지) | 엔지니어 / 코드 오너 (본인) | 이 spec 승인 뒤 planner 가 plan.md 에 19~24단계와 '변경 파일'(14.0)을 더하고 재승인받는다. verify.md 는 2차 증명(11.5)으로 다시 쓴다. verify 는 "남은 위험" 이 있으면 통과로 요약하지 않는다 |
| 15. (2차) R26 은 Escape 규칙에 예외를 만든다: Ask AI 입력창 안의 Escape 는 어떤 레이어도 닫지 않는다. 설계 2.1-2·7 과 design-system 7.1 은 'Escape 는 입력창 안에서도 맨 위 레이어를 닫는다' 였다 | intent 기준 7 (Escape 는 맨 위 하나만 닫는다) | 제품 오너 (본인) | 기준 7 은 '하나보다 많이 닫지 않는다' 를 요구하므로 위반이 아니다. 예외 범위를 Ask AI 질문 입력 하나로 좁히고 design-system 7.1 에 적는다. 다른 입력창(팔레트 검색 등)은 지금 규칙 |
| 16. (2차) R27 은 backend 의 `collector_manager.is_running` 에 기댄다. 이 값은 프로세스 메모리에만 있어 MCP 서버가 돌린 수집은 알 수 없다 (known-issues '테스트·운영' 5행) | intent 제약 (backend 불변) | 서비스 오너 (본인) | 범위 밖. 웹 서버가 돌린 수집(스케줄·즉시 수집·초기화)만 복원한다 |
| 17. (2차) `make check` 가 backend live LLM 테스트 2개(`test_anthropic_provider.py::test_anti_gemini_isolation_*`) 실패로 종료 0 이 되지 않는다 | `CLAUDE.md` 작업 완료 보고에 `make check` 출력 | 코드 오너 (본인) | 범위 밖 (지시 E, known-issues '테스트·운영'). R32 대로 frontend 세 명령의 종료 0 과 `make check` 출력 전체를 함께 붙인다 |
| 18. (2차) 챗 포커스 시트의 카테고리 라벨(`하네스·평가`, `MCP·도구`, `에이전트 기술`, `AI 뉴스`)은 `FocusBottomSheet.test.tsx:41-42,90`, `ChatWorkspace.test.tsx:142` 가 고정해 R19 에서 뺀다. 포커스 시트만 다른 이름이 남는다 | R13, `CLAUDE.md` "테스트를 고쳐 통과시키지 않는다" | 제품 오너 (본인) | **닫음 (보정 7, 2026-11-07): 메인 세션 지시로 R40 이 포커스 시트 라벨을 `labels.ts` 긴 라벨로 통일하고 네 단언을 바꾼다 (14.15 표, 우려 27). known-issues 행은 14.15 '문서' 대로 지운다.** 아래는 2차 당시 기록이다. 이번에는 그대로 두고 known-issues 'UI·접근성' 에 행을 남긴다. 바꾸려면 별도 결정으로 네 단언을 함께 바꾼다 |
| 19. (2차) R18 은 서로 다른 기사가 정말 같은 시사점을 가진 경우에도 카드에서 시사점을 감춘다 | 제품 원칙 없음 | 제품 오너 (본인) | 받아들인다. 상세 대화상자에는 시사점이 그대로 보이고, 반복 문장은 사용자에게 정보가 없다 |
| 20. (리뷰 후속) R33 은 툴바 배치를 바꾼다: 768 미만은 검색이 맨 위에서 카테고리 아래로, 768~1279 는 '카테고리+정렬 / 검색+소스' 에서 '카테고리+검색 / 소스+정렬' 로. 1차 설계 4.2·`docs/ui-spec.md` 의 '모바일 검색 맨 위' 와 다르고, 1024 줄 A 는 계산 여유가 약 5px 라 카테고리가 넘쳐 스크롤 버튼이 나올 수 있다 | 제품 원칙(폭별 기능 동등, WCAG 2.2 AA 1.3.2·2.4.3) | 제품 오너 (본인) | 한 트리로 DOM·Tab·화면 순서를 맞추려면 세 폭이 같은 순서를 가져야 한다. 1440 배치(2차 측정 150/150 통과)를 기준으로 삼아 나머지 폭을 맞췄다. 기능·줄 수·R5 첫 화면 높이는 같다. 1024 에서 넘치면 R15 규칙(스크롤 버튼·흐림)으로 닿는다. 검색은 `/` 단축키(설계 7)로 어느 폭에서든 바로 간다. 이 spec 을 승인하면 배치 변경을 승인한 것으로 본다. 미승인 시 대안: 검색을 모든 폭에서 줄 A 의 첫 항목으로 둔다(`[검색][카테고리]`, 1440 에서 검색이 왼쪽) — 역시 한 트리이고 모바일 검색 맨 위가 유지된다. 기존 테스트 단언 변경은 없다(`FeedToolbar.test.tsx` 의 줄 단언은 카테고리·소스가 다른 줄인지만 본다) |
| 21. (리뷰 후속) R15 스크롤 버튼 포커스 유지는 jsdom 에서 '포커스 요소가 빠지면 `activeElement` 가 `body`' 인 동작으로만 시험된다. 실제 Chrome 의 포커스 정리 시점, 요소 제거 때 `blur` 발생 여부는 브라우저마다 다르고 ui-audit 은 키보드 포커스를 측정하지 않는다 | 제품 원칙 WCAG 2.2 AA (2.4.3), `CLAUDE.md` 증명 규칙 | 코드 오너 (본인) | 설계를 `blur` 발생 여부와 상관없게 정했다 (14.3, ref + 마이크로태스크 + `useLayoutEffect`). verify 에서 프로덕션 빌드 1024 피드의 `카테고리 다음 항목 보기` 를 키보드로 끝까지 눌러 포커스가 `이전` 버튼에 남는지 Chrome 에서 확인하고 결과를 적는다. 확인하지 못하면 verify.md 에 미검증으로 적고 통과로 보고하지 않는다. 늘 렌더 + `aria-disabled` 방식은 기존 단언 3곳(`ui/ChipGroup.test.tsx:176,188`, `ui/Tabs.test.tsx:249`)을 바꿔야 해 택하지 않았다 |
| 22. (리뷰 후속) `clip` 판정 ④ 를 더하면 지금 프로덕션 화면에서 새 실패가 나올 수 있다 (2차 측정 150/150 은 ④ 없이 낸 값). 그러면 plan '변경 파일' 밖 화면 파일을 고쳐야 한다. plan.md·verify.md 는 승인 상태다 | `CLAUDE.md` SDLC (승인된 plan 의 '변경 파일' 밖 편집 금지), 우려 14 | 엔지니어 / 코드 오너 (본인) | 이 spec 승인 뒤 planner 가 plan.md 에 14.12 단계와 '변경 파일' 을 더하고 재승인받는다. 30단계에서 ④ 를 먼저 프로덕션에 돌려 새 실패 목록을 얻고, 고칠 파일이 늘면 plan 을 다시 고친다. verify.md 는 리뷰 후속 증명을 더해 다시 쓴다 |
| 23. (보정 3) 360·390 피드 첫 화면에서 `Must-Read` 토글은 여전히 보이지 않는다. 소스 줄 보이는 상자(204·234px)에 `Must-Read` 와 선택 칩 `전체`(건수 포함)가 함께 들어가지 않아, R15 의 '선택 칩 전체가 보이게' 를 지키면 `Must-Read` 가 왼쪽 밖으로 밀린다 (`36-prod-audit-3.md:248,276-279`). 보정 3 은 왼쪽 `‹` 표시로 단서만 준다 | 제품 원칙 '폭별 기능 동등'(R9), R15 | 제품 오너 (본인) | **닫음 (보정 5, 2026-11-07): 제품 오너가 대안 ① 을 골랐다. R34 로 `Must-Read` 를 정렬 옆 고정 토글로 옮겨 모든 폭 첫 화면에 보인다 (14.2 보정 5, 14.14). known-issues 행은 14.10 보정 5 대로 지운다.** 아래는 보정 3 당시 기록이다. 이번 보정은 단서(왼쪽 표시)까지만 한다: `Must-Read` 는 한 번 밀어 닿을 수 있고 팔레트·데스크톱과 기능은 같아 R9(닿을 수 있음)는 지킨다. 첫 화면에서 바로 보이게 하려면 별도 결정이 필요하다. 대안: ① `Must-Read` 를 소스 스크롤 줄 밖, 정렬 선택창 옆 고정 토글로 옮긴다 (`FeedToolbar.test.tsx:50-57` 'Must-Read 가 소스 그룹 첫 칩' 단언, spec 14.2 '그대로' 목록과 충돌 → 단언 변경 필요). ② 처음 상태에서는 `scrollLeft 0` 을 우선하고 선택 칩이 다 보이지 않으면 오른쪽 흐림에 일부 겹쳐도 둔다 (R15 '선택 칩 전체가 보이게' 를 처음 상태에만 완화). 둘 다 이 spec 에 넣지 않았다 |
| 24. (보정 3) 보정 3 은 기존 단언 5곳(`ui/ChipGroup.test.tsx:287,328,368,388-396`, `feed/FeedToolbar.test.tsx:142`)을 바꾼다 | `CLAUDE.md` "테스트를 고쳐 통과시키지 않는다" | 코드 오너 (본인) | 요구사항이 바뀐 경우다 (768 미만 표시가 오른쪽에만 있던 규칙과 16px 스냅 여백이 결함의 원인으로 기록됨, 14.13). 단언을 지우거나 느슨하게 하지 않고 새 규칙을 같은 세기로 단언한다 (14.13 표). 이 spec 을 승인하면 이 5곳 변경을 승인한 것으로 본다. plan 에 파일·줄·이유를 적는다. 미승인 시 대안: 오른쪽 표시만 두고 왼쪽 흐림을 키워(예: 40px) 단서로 쓴다 — 단언 :368·:396 은 유지되지만 흐림은 칩을 가리고 표시보다 약한 단서다 |
| 25. (보정 5) 보정 5 는 기존 단언을 바꾼다: `feed/FeedToolbar.test.tsx:50`(제목), `:52-55`, `:57`, `:59`, `ui/ChipGroup.test.tsx:619`. 보정 6 은 `ui/ChipGroup.test.tsx:619`·`:950` 의 휠 입력을 가로 휠(`{ deltaX: 40 }`)로 바꾼다 (단언 값은 그대로, 14.14 보정 6 표) | `CLAUDE.md` "테스트를 고쳐 통과시키지 않는다" | 코드 오너 (본인) | 요구사항이 바뀐 경우다: Must-Read 위치는 제품 오너 결정(R34), 사용자 스크롤 정의는 reviewer 가 결함으로 기록(14.3 보정 5). 단언을 지우거나 느슨하게 하지 않고 같은 동작(토글의 접근 이름·`aria-pressed`·콜백, 사용자가 민 위치 유지)을 같은 세기로 단언한다 (14.14 표). 이 spec 을 승인하면 이 변경을 승인한 것으로 본다. plan 에 파일·줄·이유를 적는다 |
| 26. (보정 5) 새 '사용자 스크롤' 정의는 시간 값(입력 뒤 1,000ms, `scrollend` 없을 때 150ms)에 기댄다. 관성 스크롤이 `scrollend` 없이 150ms 넘게 멈췄다 다시 움직이거나, 입력 없이 다른 코드가 줄을 움직이면 판정이 어긋날 수 있다. 또 입력 없이 `setScrollLeft` 로 넘침 상태를 만드는 기존 테스트 12곳에서 다시 보이기가 `scrollLeft` 를 조정할 수 있다 (jsdom 은 코드로 둔 `scrollLeft` 에 `scroll` 을 내지 않아 `data-overflow`·클래스 단언은 영향이 없을 것으로 보지만 실행으로 확인하지 않았다) | R15, `CLAUDE.md` "테스트를 고쳐 통과시키지 않는다" | 코드 오너 (본인) | 시간 값은 근거 없음(가정, E34). Chrome 의 `scrollend` 지원에 기대고 verify 에서 터치 에뮬레이션·휠로 확인한다 (14.14 측정). 구현 중 14.14 표 밖의 단언이 깨지면 단언을 고치지 않고 멈춰 보고한다 (spec 보정이 필요한지 판단) |
| 27. (보정 7) 보정 7 은 기존 단언을 바꾼다: `feed/FeedToolbar.test.tsx:145,148,149-150,263-265`, `chat/ChatHeader.test.tsx:71-90,92-105`(입력창 테스트로 옮김), `chat/ChatWorkspace.test.tsx:55,142,295-321`, `chat/FocusBottomSheet.test.tsx:41-42,90`, `chat/FocusCapsule.test.tsx:140`, `chat/ChatSidebar.test.tsx:256` | `CLAUDE.md` "테스트를 고쳐 통과시키지 않는다" | 코드 오너 (본인) | 요구사항이 바뀐 경우다: 결함 7건이 프로덕션 스크린샷으로 확정됐고(14.15), 바뀌는 단언은 결함인 동작(768 미만 한 줄 B, 헤더·입력창 두 모델 선택, 영어·서로 다른 용어, 포커스 시트 다른 라벨)을 고정하고 있다. 단언을 지우거나 느슨하게 하지 않고 같은 동작을 같은 세기로 단언한다 (헤더 모델 선택 단언은 입력창 테스트로 옮김, 14.15 표). 이 spec 을 승인하면 이 변경을 승인한 것으로 본다. plan 에 파일·줄·이유를 적는다 |
| 28. (보정 7) 점수 원인은 backend 에 남는다: RSS·arXiv·HuggingFace 의 합성 `raw_score`(`rss.py:75`, `arxiv.py:48`, `huggingface.py:33`), GitHub 폴백 `stars_hint`(`github.py:61-69`, 기본 5000 — 프론트는 실제 스타와 구별할 수 없어 R36 뒤에도 `스타` 로 보인다), `calculate_hotness` 포화(`categorizer.py:147`, 4734건 중 1034건이 100). R36 은 카드의 합성 `raw_score` 만 숨긴다. 인기 점수 `🔥100` 은 계속 많은 카드에 같게 보이고, `추천순`·`인기순` 정렬은 합성 값에 좌우된다 | intent 제약 (backend 불변), R32, 메인 지시 (backend 점수 알고리즘은 범위 밖) | 서비스 오너 (본인) | 범위 밖. known-issues '데이터·동작 오류' 행을 확인된 원인으로 고친다 (14.15 '문서'). 별도 intent(`/triage-signal` 또는 `/write-intent`)로 넘긴다: 수집기가 원천 지표가 없으면 `raw_score` 0 저장, 인기 점수 정규화. 인기 점수 표시(`hotness_score > 25`)를 카드에서 숨길지는 제품 오너가 정한다 (이 보정은 바꾸지 않는다). (보정 8, 2026-11-07) 메인 결정으로 R41 이 지표 없는 소스의 카드 인기 점수를 숨긴다 (14.16). 남는 것: `인기순`·`추천순` 정렬이 합성 값에 좌우됨, 지표 소스에서도 인기 점수 포화(예: 스타가 많은 GitHub 카드 `🔥 100`), 폴백 `stars_hint`·합성 포크 수 |
| 29. (보정 7) F2(768·1024 칩 줄 끝 단어 잘림)는 줄 구성을 바꾸지 않는다. 768 에서는 카테고리 칩이 3개만 보인다 | 제품 원칙(폭별 기능 동등), R15 | 제품 오너 (본인) | 근거는 14.15 F2: 1024 카테고리는 이미 다 들어가고, 768 에서 검색을 별도 줄로 내려도 카테고리 약 752px > 720px 라 잘림이 남으며, sticky 툴바가 약 40px 늘어난다. 잘린 끝 칩은 흐림·스크롤 버튼과 함께 설계한 넘침 신호이고 `scrollRow` 가 판정한다. 대안(제품 오너가 고르면 별도 보정): ① 768~1023 에서 줄 A 를 768 미만처럼 세로로 쌓아 검색을 별도 줄로(`md:max-lg:flex-col`, DOM 순서 그대로) — 카테고리 보이는 칩 3 → 4개 남짓, 툴바 +40px. ② 768~1023 에서 칩 건수를 숨겨 칩 폭을 줄임 — 건수 정보를 잃는다. (보정 9, 2026-11-07) R42 로 검색이 별도 영역이 되어 카테고리 줄이 콘텐츠 폭을 다 쓴다: 1024 는 약 747 ≤ 960 으로 넘치지 않고, 768 은 약 747 > 720 이라 여전히 넘치지만 보이는 칩이 3개 → 4개 남짓 (계산값, 14.17 G1). 소스 줄도 넓어진다(1024 702 → 830, 768 462 → 590). 대안 ① 의 효과를 sticky 높이 증가 없이 얻는다 (검색 영역은 sticky 가 아님) |
| 30. (보정 7) 메인 지시는 HuggingFace `raw_score` 를 좋아요로 보았으나 코드는 `numComments + 40`(`huggingface.py:33`)이다. R36 은 HuggingFace 를 합성 점수 소스로 보고 숨긴다 (댓글 수는 `comments_count` 로 계속 보인다) | 메인 지시 (원천이 실제 지표를 주는 소스만 표시) | 제품 오너 (본인) | 지시의 원칙(실제 지표만)을 따랐다. HuggingFace 좋아요를 보이려면 수집기가 `upvotes` 를 받아야 하므로 우려 28 의 backend intent 에 함께 넘긴다. 같은 이유로 지시에 없던 `arxiv`(120 고정)도 숨기고, 실제 추천 점수인 `reddit` 은 보인다 |
| 31. (보정 7) ui-audit 에 새 측정 상태 '챗 포커스 필터 열림'(10조합)을 더하면 14.8 상태별 검사가 지금 프로덕션에서 새 실패를 낼 수 있다 (36 재측정 6 의 150/150 은 이 상태 없이 낸 값). 그러면 14.15 '바뀌는 파일' 밖 화면 파일을 고쳐야 한다. plan.md·verify.md 는 승인 상태다 | `CLAUDE.md` SDLC (승인된 plan 의 '변경 파일' 밖 편집 금지), 우려 22 | 엔지니어 / 코드 오너 (본인) | 이 spec 승인 뒤 planner 가 plan.md 에 보정 7 단계와 '변경 파일' 을 더하고 재승인받는다. 14.15 단계 1 에서 새 상태를 먼저 돌려 새 실패 목록을 얻고, 고칠 파일이 늘면 plan 을 다시 고친다 |
| 32. (보정 7) R35 는 768 미만 첫 화면을 약 52px 줄인다 (계산값). R5(390×844 첫 화면 카드 제목 1개 이상)는 여유가 있어 보이나(360×780 첫 제목 아래 끝 약 y 440 → 약 492) 측정하지 않았다. R38 의 캡슐 앞말 `포커스:` 는 외래어이고 다른 후보(`범위:`)는 맥락 줄의 `검색 스코프` 와 겹쳐 고르지 않았다 | intent 기준 5, R13 | 제품 오너 (본인) | R5 는 ui-audit 로 확인하고, 실패하면 단언을 바꾸지 않고 멈춰 보고한다. `포커스` 는 이미 접근 이름(`지식 검색 포커스 필터 설정 열기`)과 대화상자 제목(`… 포커스 필터`)이 쓰는 말이라 맞췄다: 근거 없음(가정) |
| 33. (보정 8) 보정 8 은 보정 7 에서 넣은 단언 2곳을 바꾼다: `NewsCard.test.tsx:328-329`(합성 소스의 인기 점수가 보임 → 없음), `:404-405`(인기 마크업 테스트의 소스 `rss_kr` → `github`) | `CLAUDE.md` "테스트를 고쳐 통과시키지 않는다" | 코드 오너 (본인) | 요구사항이 바뀐 경우다: 인기 점수가 `raw_score` 에서 계산된다는 원인이 확인되어(14.16) 합성 소스의 인기 점수 표시가 결함으로 기록됐다. 단언을 지우거나 느슨하게 하지 않는다: 첫 곳은 '보임' 을 '없음' 으로 같은 세기로 뒤집고, 둘째 곳은 같은 마크업 단언을 지표 소스에서 한다 (14.16 표). 이 spec 을 승인하면 이 변경을 승인한 것으로 본다. plan 에 파일·줄·이유를 적는다 |
| 34. (보정 9) 보정 9 는 기존 단언을 바꾼다: `feed/FeedToolbar.test.tsx:50,57-61,80-93(FeedStatusBar 로 옮김),145,148,150-152,154-158,225,230-231,237,241,264,278-281,341-347,422(옮김),426-433,435-454,468-479`(fixture 키 `:11,18,325,332` 삭제 포함), `chat/ChatModelSelector.test.tsx:22,181,189,202`, `AskAiPanel.test.tsx:47,67`, `modals/NewsDetailModal.test.tsx:76,81,97,98,102,130,166,177,188,212,213`, `NewsCard.test.tsx:236-241`, `chat/HandoverIntegration.test.tsx:69,85,104,122` | `CLAUDE.md` "테스트를 고쳐 통과시키지 않는다", R13 (테스트가 찾는 라벨 유지) | 코드 오너 (본인) | 요구사항이 바뀐 경우다: 영역 분리는 사용자 결정(R42), 나머지는 스크린샷으로 확정한 결함(H1~H6)이고, 바뀌는 단언은 결함인 배치·라벨(칩 줄 안 검색·정렬, 이모지 라벨, `Ask AI`·`전용 챗`, 1024 아이콘만)을 고정하고 있다. 단언을 지우거나 느슨하게 하지 않는다: 정렬 단언은 `FeedStatusBar.test.tsx` 로 같은 세기로 옮기고, 순서·클래스 단언은 새 배치를 같은 세기로 단언한다 (14.17 표). R13 의 라벨 중 `키워드 검색`·`정렬`·`카테고리`·`소스`·`Must-Read`·`검색 스코프 모드` 는 그대로다. 이 spec 을 승인하면 이 변경을 승인한 것으로 본다. plan 에 파일·줄·이유를 적는다 |
| 35. (보정 9) R35 를 바꿔 41단계(보정 7 F1)의 768 미만 줄 B 줄바꿈을 되돌린다. 360 소스 줄 보이는 폭이 보정 7 의 약 344px(전체 폭)에서 276px 로 줄어든다 (390 306px, 계산값) | R35(보정 7), 제품 원칙 '폭별 기능 동등' | 제품 오너 (본인) | 정렬이 목록 머리줄로 빠지면 줄바꿈의 이유(소스 줄이 토글·정렬 156px 와 폭을 나눔)가 줄어 토글 44px 만 남는다. 줄바꿈을 두면 토글 혼자 한 줄(44px)을 쓰고 왼쪽이 빈다 (사용자 첫 보고의 390 '왼쪽 194px 빔' 과 같은 모양). F1 의 결함(보이는 칩 1.5개)은 흐림 밖 칩 2개로 계속 막는다 (`toolbarLayout`). 이 spec 을 승인하면 R35 변경을 승인한 것으로 본다. 대안: 768 미만에서만 토글을 소스 줄 아래 줄 오른쪽에 두는 보정 7 배치 유지 — 툴바 높이 +52px, 빈 줄 |
| 36. (보정 9) 768 이상에서 검색 입력과 정렬이 sticky 띠에서 빠진다. 스크롤한 화면에서 정렬을 바꾸려면 위로 올라가야 하고, 검색은 `/` 로 가면 화면이 검색 영역까지 스크롤된다 | 제품 원칙(폭별 기능 동등), R5 | 제품 오너 (본인) | 받아들인다: sticky 띠를 필터 영역(88px)만으로 두어 1024×768 같은 낮은 화면에서 띠가 152px → 144px 로 줄고, 검색까지 sticky 에 넣으면 약 188px 가 된다. 정렬은 목록 머리줄에 있어야 한다는 사용자 지시를 따른다. `/` 의 스크롤은 `scrollIntoView` + `scroll-mt-20` 에 기대므로 verify 에서 Chrome 으로 확인한다(R42 측정). 확인하지 못하면 verify.md 에 미검증으로 적는다. 근거 없음(가정): 정렬을 스크롤 중에 바꾸는 빈도는 조사하지 않았다 |
| 37. (보정 9) 메인의 첫 방향(입력·정렬 높이 32px, 알약 모양, 비선택 칩 테두리)을 따르지 않았다. 검색 입력은 1440 에서 1216px 로 길다 | 메인 지시(첫 방향), 제품 원칙 WCAG 2.2 AA(SC 1.4.11), 단일 디자인시스템 | 제품 오너 (본인) | 사용자 재지시로 검색·정렬이 칩 줄 밖으로 나가 높이·모서리를 칩에 맞출 이유가 없어졌다. 칩 테두리 `rgb(226,232,240)` 는 흰 바탕에서 약 1.2:1 이라 입력 경계에 쓰면 SC 1.4.11(3:1)을 어긴다. `border-strong` 은 약 3.6:1 (라이트 테마 계산값, 다크는 `TokenContrast.test.ts` 기준 그대로). 입력·선택창은 입력 토큰, 필터는 칩 토큰으로 역할이 다르다. 전체 폭 검색은 세 영역 끝 맞춤과 폭별 같은 규칙을 위해 골랐다: 근거 없음(가정). 대안: 768 이상 `md:max-w-xl`(576px) 왼쪽 정렬 — 오른쪽 끝이 목록 머리줄과 맞지 않아 `feedAreas` ⑤ 의 검색 오른쪽 판정을 빼야 한다 |
| 38. (보정 9) R5 여유: 768 이상 첫 카드가 약 60px 내려간다(1440 첫 줄 아래 끝 559 → 약 619, GitHub 카드 바닥 줄바꿈이 겹치면 약 655). 360 목록 머리줄은 필터가 걸리면 상태가 여러 줄로 감긴다 | intent 기준 5, R16 | 제품 오너 (본인) | 1440×900 에서 여유가 약 245px 남는다(계산값). ui-audit R5 로 확인하고 실패하면 단언을 바꾸지 않고 멈춰 보고한다. 머리줄은 처음 상태 한 줄을 `feedAreas` ⑥ 으로 판정하고, 필터가 걸린 상태는 줄바꿈으로 넘치지 않음만 지킨다(`clip`). 필터 상태의 머리줄 높이는 측정 상태가 아니라 판정하지 않는다 |
| 39. (보정 9) backend 가 만든 문자열의 결함은 고치지 않는다: 브리핑 헤드라인·분야 요약의 글자 수 자르기(`briefing_service.py:86,88,101-102`, `…persistent p...`), backend 분야 이름·이모지(`:16-38`), 마크다운 전문·Notion·이메일 본문의 이모지와 이름, 챗 단계 라벨의 이모지(SSE `label`). `types/chat.ts` 의 `withIcon` 이모지도 남는다 | intent 제약 (backend 불변), R32, 메인 지시 (backend 문자열이면 UI 범위 밖) | 서비스 오너 (본인) | 범위 밖. 화면에서는 R47(분야 이름·아이콘을 `id` 로 바꿔 그림)과 R44(프론트 글자)만 고친다. 헤드라인 잘림은 프론트가 되살릴 수 없어 그대로 보인다. known-issues 에 행을 더하고(14.17 '문서') 별도 intent 로 넘긴다. `withIcon` 은 컴포넌트가 쓰지 않아 화면에 나오지 않는다 (`types/**` 는 R32 로 바꾸지 않는다) |
| 40. (보정 9) 카드 머리줄의 짧은 분야 라벨(`에이전트` 등)과 상세·필터의 긴 라벨이 다르게 남는다 | R19, 메인 지시 (분야 이름 통일) | 제품 오너 (본인) | R19 의 두 단계 라벨을 유지한다: 1024 카드 머리줄 약 226px 에 긴 라벨을 넣으면 긴 소스 이름에서 시간이 말줄임으로 사라진다(계산값). 짧은 라벨은 모두 긴 라벨의 일부이고, 머리줄에 `title` 로 긴 라벨을 단다(R47). 대안: 카드도 긴 라벨 — 시간 정보가 일부 카드에서 잘림 |
| 41. (보정 9) R48 바닥 줄 줄바꿈으로 같은 줄 카드 사이에 바닥 줄이 한 줄인 카드와 두 줄인 카드가 섞인다 (통계가 긴 GitHub 카드는 모든 폭에서 두 줄, 계산값) | R17(카드 고정 틀), R16 | 제품 오너 (본인) | 카드 높이·제목 위치는 grid 늘이기로 같아 `rowAlign` 은 그대로다. 버튼을 늘 다음 줄에 두는 방식(모든 카드 두 줄)은 통계가 없는 RSS 카드에 빈 줄을 만들어 택하지 않았다: 근거 없음(가정). 대안: 1024~1279 에서 통계 중 인기 점수만 숨김 — 그래도 GitHub 카드 약 324px(115 + 8 + 201) > 266 이라 넘침 |
| 42. (보정 9) 새 검사 5개와 넓힌 판정(`terms` 의 `/`·상세 상태, `pictograph` 의 브리핑 상태)이 지금 프로덕션에서 14.17 '바뀌는 파일' 밖의 실패를 낼 수 있다. plan.md·verify.md 는 승인 상태다 | `CLAUDE.md` SDLC (승인된 plan 의 '변경 파일' 밖 편집 금지), 우려 22·31 | 엔지니어 / 코드 오너 (본인) | 이 spec 승인 뒤 planner 가 plan.md 에 보정 9 단계와 '변경 파일' 을 더하고 재승인받는다. 14.17 단계 1 에서 새 검사를 먼저 돌려 실패 목록을 얻고, 고칠 파일이 늘면 plan 을 다시 고친다 |

## 근거
- E1. `@custom-variant dark (&:where(.dark, .dark *))` 로 `dark:` 를 클래스에 묶는다 — Tailwind CSS 문서 'Dark mode › Toggling dark mode manually' (https://tailwindcss.com/docs/dark-mode, 2026-11-06 조회)
- E2. 토큰 변수를 `@theme inline` 으로 연결, `--color-*: initial` 은 `transparent`·`current` 유지 여부를 문서에서 확인하지 못해 보류 — Tailwind CSS 문서 'Theme variables' (https://tailwindcss.com/docs/theme, 2026-11-06 조회)
- E3. `<head>` 인라인 스크립트로 첫 그리기 전 테마 적용, 개발 모드 재마운트 대비 `useLayoutEffect` 재적용 — Next.js 16 로컬 문서 `frontend/node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md` '테마', 'Re-applying attributes in development'
- E4. viewport 의 `maximumScale`·`userScalable` 제거, `themeColor`·`colorScheme` 설정 — Next.js 16 로컬 문서 `…/03-api-reference/04-functions/generate-viewport.md`, intent 기준 8
- E5. 시스템 글꼴 사용(Geist 제거) — intent 제약 "외부 폰트·CDN 에 런타임 의존하지 않는다", ui-spec 알려진 위험 10 (Geist 를 읽지만 쓰지 않음). 한국어 글꼴 우선순위는 근거 없음(가정)
- E6. 컴포넌트 킷 없이 자체 부품, 네이티브 `<dialog>` 대신 `div role="dialog"` + 자체 포커스 트랩 — intent 제약(무거운 UI 라이브러리 금지). jsdom 의 `showModal` 지원 여부는 확인하지 않았다: 근거 없음(가정)
- E7. 중립 회색 + 단일 파랑 강조, 다크 배경 `#0e1013` 계열 — 근거 없음(가정). 지금 라이트 테마의 slate·blue 와 이어지고, 대비는 1.3 표 계산값
- E8. 모바일 터치 영역 44px, 데스크톱 36px — intent 기준 6 (44px). 데스크톱 36px 는 근거 없음(가정), WCAG 2.5.8 최소 24px 은 넘는다
- E9. 헤더 버튼을 더보기 메뉴로 묶고 하단 내비 없음 — intent 문제 절(1440px 에서도 두 줄, 390px 헤더 약 170px), 목적지 2개. 메뉴 묶음 선택은 근거 없음(가정)
- E10. 피드 첫 화면 구성(요약 바 통합, 개요 카드 제거, md 이상 sticky 툴바, 정렬 Select) — intent 문제 절(첫 카드 y≈625, 390px 첫 화면 기사 0개, 정렬 글자 깨짐)과 4.2 의 높이 계산. 카드 높이 240~280px 는 지금 화면 기준 추정: 근거 없음(가정), `ui-audit` 로 확인
- E11. 모바일 대화상자 전체 화면, 확인 창·필터는 바텀시트 — 근거 없음(가정). 지금 `FocusBottomSheet` 가 바텀시트를 쓰고 있어 패턴을 넓힌다
- E12. 태블릿 챗 기록은 드로어 — 768−288=480px 메시지 열 계산. 근거 없음(가정)
- E13. 대비 기준 4.5:1(글자)·3:1(UI 경계·포커스), 포커스 표시, 키보드 조작 — `docs/product.md` 제품 원칙(WCAG 2.2 AA), WCAG 2.2 SC 1.4.3, 1.4.11, 2.1.1, 2.4.7, 2.5.3, 2.5.8
- E14. 단축키를 `e.code` 로도 판정 — 근거 없음(가정). 한글 입력 상태에서 `e.key` 가 `ㅓ` 등이 되는 점에 기댄다
- E15. 오버레이 스택 리스너를 `window` 에 단다 — 기존 `CommandPalette.test.tsx:114` 가 `window` 에 Escape 를 보낸다
- E16. 버전 배지는 `next.config.ts` 의 `env.NEXT_PUBLIC_APP_VERSION` 으로 버전 문자열만 넘기고, 값이 없으면 배지를 숨긴다 — reviewer 가 빌드 산출물에서 `Header.tsx:19` 의 `import pkg from '../../package.json'` 때문에 `package.json` 전체(devDependencies 포함)가 클라이언트 번들에 들어간 것을 확인했다(2026-11-06 리뷰). `env` 값은 빌드 때 문자열로 박힌다는 Next.js `next.config` `env` 옵션 동작에 기댄다(이번에 로컬 문서로 다시 확인하지 않았다). 테스트 환경에서 숨김을 택한 것은 근거 없음(가정): 거짓 버전을 보이지 않는 쪽을 골랐다
- 외부 조사(researcher·benchmarker)는 부르지 않았다. 갈리는 기술 선택이 없고, 필요한 기술 사실은 위 문서로 확인했다.
- E17. (2차) 화면 결함 F1~F16 — `docs/features/ui-redesign/audit/*.png` 8장을 2026-11-06 에 직접 열어 본 값(좌표는 픽셀 실측)과 14.1 에 적은 코드 줄. 768·1024 의 폭은 1440 실측 칩 너비와 Tailwind 클래스로 계산한 값이라 오차가 있다: ui-audit 로 확인
- E18. (2차) 390 칩 줄을 가로 스크롤로 정함 — 카테고리 5칩 약 857px(1440 실측)를 358px 에 줄바꿈하면 3줄이 되어 R5 예산(1차 실측 첫 제목 bottom 461/844)을 크게 줄인다. 스크롤 가능 표시 방식(한쪽 흐림, 가장자리까지 늘인 줄, 768 이상 스크롤 버튼)은 근거 없음(가정), 외부 사례 조사를 하지 않았다
- E19. (2차) 카드 고정 틀·배지 줄 한 줄·인기 점수 바닥 이동 — 근거 없음(가정). F4·F6 의 관찰과 `rowAlign` 측정으로 확인한다
- E20. (2차) 반복 시사점을 데이터 문제로 판정 — backend `app/services/llm_processor.py:84-89`(`CATEGORY_INSIGHTS`), `:703-709`(대체 규칙), 프론트 `NewsCard.tsx:138-142`(그대로 그림). 끝 40자 키는 접두 변형(`{기술} 기반 구현에서 `)을 묶기 위한 값으로 근거 없음(가정)
- E21. (2차) 수집 상태 복원을 frontend 만으로 — backend `app/api/schedule.py:37`(`is_running`), `:51-58`(즉시 수집 `already_running`), `:72-77`(초기화 `already_running`)
- E22. (2차) Ask AI 입력의 Escape 를 `preventDefault` 로 막음 — `overlay-stack.ts:37` 이 `defaultPrevented` 를 무시한다. React 이벤트 위임(루트에서 처리)이 `window` 리스너보다 먼저 돈다는 점은 이번에 문서로 다시 확인하지 않았다: 근거 없음(가정), `NewsDetailModal.test.tsx` 로 확인
- E23. (2차) 겹친 대화상자 순서를 렌더 순서 번호로 정함 — design-system.md 10.2(자식 effect 가 먼저 돈다). StrictMode 이중 렌더에서도 번호가 단조 증가해 부모 < 자식이 유지된다는 점은 근거 없음(가정), `OverlayStack.test.tsx` 로 확인
- E24. (2차) `aria-controls` 는 문서에 있는 요소를 가리켜야 한다 — WAI-ARIA 1.2 `aria-controls`(ID 참조 목록) 정의. 이번에 원문을 다시 조회하지 않았다
- E25. (2차) 한국어 어절 줄바꿈에 `word-break: keep-all` — CSS Text Module Level 3 `word-break` 정의와 1차 설계 1.5(`break-keep`). 이번에 원문을 다시 조회하지 않았다
- E26. (2차) ui-audit 검출 방법(`elementFromPoint`, `Range.getClientRects`, canvas `measureText`, `scrollWidth`/`clientWidth`) — 브라우저 표준 DOM API. 오탐률은 근거 없음(가정): `--self-test` 와 회귀 증명(R30)으로 확인
- E27. (2차) 프로덕션 빌드에서 측정 — verify.md '남은 위험'(next dev 기준 측정), F16(개발 표시기가 요소를 가림)
- (2차) 외부 조사(researcher·benchmarker)는 부르지 않았다. 갈리는 기술 선택이 없고(새 의존성 없음), 판단에 쓴 사실은 저장소 코드·스크린샷에서 확인했다.
- E28. (리뷰 후속) 툴바를 한 트리 + CSS 배치로, 순서 바꾸기 금지 — reviewer 2·3차 리뷰 Nit 1, `FeedToolbar.tsx:70-74` 주석(서버·첫 렌더는 `xl` 트리, 768~1279 는 하이드레이션 뒤 옮김)과 `:236-268`(폭마다 다른 트리). CSS `order`·`*-reverse` 는 화면 순서만 바꾸고 Tab 순서는 DOM 순서를 따른다는 점과 WCAG 2.2 SC 1.3.2·2.4.3 — 이번에 원문을 다시 조회하지 않았다. 768 미만에서 줄 A 를 세로로 쌓는 방식은 2차 구현이 하이드레이션 전 배치에 이미 쓰고 있다(`FeedToolbar.tsx:259` `max-md:flex-col-reverse max-md:items-stretch`, 순서만 뒤집혀 있었다). 1440 배치를 기준으로 삼은 것은 근거 없음(가정): 2차 측정에서 통과한 배치를 바꾸지 않으려는 선택
- E29. (리뷰 후속) 사라지는 스크롤 버튼의 포커스를 옮김 — reviewer 리뷰 Important 1, `ScrollRow.tsx:141-173`(조건부 렌더). 포커스된 요소가 문서에서 빠지면 포커스가 `body` 로 간다는 HTML '포커스 정리' 동작은 이번에 원문을 다시 조회하지 않았다. 늘 렌더 방식을 버린 이유는 기존 단언 `ui/ChipGroup.test.tsx:176,188`, `ui/Tabs.test.tsx:249`
- E30. (리뷰 후속) 기술 배지를 줄이며 말줄임 — reviewer 리뷰 Important 3 의 측정(1024 3열 안쪽 약 266px, 약 20px 잘림), `Badge.tsx:24`, `lib/cn.ts:4-8`. flex 항목의 자동 최소 폭이 내용 폭이라 `min-width` 를 명시해야 줄어든다는 CSS Flexbox 규칙은 이번에 원문을 다시 조회하지 않았다: `--self-test` 배지 줄 fixture 로 확인. 최소 48px·Must-Read 약 92px 는 근거 없음(가정), ui-audit `clip` 으로 확인. '들어가지 않는 배지를 그리지 않음' 대신 줄이기를 고른 것은 근거 없음(가정): 기술 이름 앞부분이라도 카드에서 보이는 쪽을 골랐다
- E31. (리뷰 후속) 알림을 처음 그린 영역에서만 live 속성 — reviewer 리뷰 Nit 3, `Toast.tsx:184-205`. live 속성을 가진 요소가 새로 들어오면 스크린리더가 읽는다는 동작은 스크린리더마다 다르고 이번에 확인하지 않았다: 근거 없음(가정)
- E32. (리뷰 후속) 상태 응답을 요청 번호로 거름 — reviewer 리뷰 Nit 2, `useCollector.ts:93-103`(응답이 `progressTimer === null` 이면 폴링 시작), `:118-123`(완료 처리), `:148`(30초 상태 요청)
- E33. (리뷰 후속) `clip` ④ 와 알파 판정 — reviewer 리뷰 Important 2·Nit 5, `ui-audit.mjs:708-742`, `:1014`. Chrome 이 계산된 색을 `color(srgb … / a)`, `oklab(… / a)` 같은 표기로 내놓을 수 있다는 점(Tailwind 4 의 `color-mix` 결과)은 이번에 원문을 다시 조회하지 않았다: `clean.html` 알파 0 fixture 로 확인
- E34. (보정 5) Must-Read 고정 토글 — 제품 오너 결정(2026-11-07, 우려 23 대안 ①), `36-prod-audit-3.md:248,276-279`(360·390 소스 줄 처음 상태). 토글 폭 약 114px·`전체` 칩 약 87px 는 계산값이라 ui-audit 로 확인. 사용자 스크롤을 입력 신호로 정함 — reviewer 재리뷰 Nit 2, `ScrollRow.tsx:225-228`. `scrollend` 이벤트의 브라우저 지원과 시간 값 150ms·1,000ms 는 이번에 원문을 다시 조회하지 않았다: 근거 없음(가정), Chrome 확인으로 넘김
- (리뷰 후속) 외부 조사(researcher·benchmarker)는 부르지 않았다. 새 의존성·갈리는 기술 선택이 없고, 판단에 쓴 사실은 리뷰 기록과 저장소 코드에서 확인했으며 브라우저 동작은 fixture·단위 테스트·verify 확인으로 넘겼다.
- E35. (보정 7) 결함 7건 — 메인 세션의 프로덕션 스크린샷 육안 확인(`audit/*.png` 24장)과 spec 작성자의 재확인(14.15 첫 항목의 5장). 좌표·폭(360 소스 줄 약 172px, 1024 카테고리 줄 약 752px, 360 첫 제목 아래 끝 약 y 440)은 스크린샷 픽셀과 14.2 계산값이라 오차가 있다: ui-audit 로 확인
- E36. (보정 7) 768 미만 줄 B 줄바꿈(R35) — CSS 만으로 배치하고 DOM 순서를 지키는 규칙은 R33·E28 과 같다. 토글·정렬을 다음 줄 오른쪽 끝에 둔 것은 768 이상에서 정렬이 줄 B 오른쪽 끝에 있는 배치와 같은 자리를 고른 것으로 근거 없음(가정)
- E37. (보정 7) 카드 원천 지표(R36) — 수집기 코드 `rss.py:75`, `arxiv.py:48`, `huggingface.py:33`, `github.py:44-45,61-70`, `hackernews.py:39-40`, `reddit.py:36-37`, `categorizer.py:139-147`, 표시 코드 `NewsCard.tsx:163-186`. source 별 값 분포는 메인 세션의 `backend/agentlens.db` 조회(2026-11-07)이고 spec 작성자는 다시 조회하지 않았다. 지표 아이콘(`Star`, `ArrowBigUp`, `GitFork`, `MessageSquare`) 선택은 근거 없음(가정)
- E38. (보정 7) 챗 용어(R38) — R13(한국어 문구), 기존 접근 이름 `전체 소식 모드`(`SessionItemCard.tsx:82`)와 피드 `전체 소식` 칩(`FeedToolbar.tsx:22`)이 이미 쓰는 말을 기준으로 골랐다. `단일 기사` 는 지금 탭 라벨의 한국어 부분. 사용자 조사는 하지 않았다: 근거 없음(가정)
- E39. (보정 7) 모델 선택 한 곳(R39) — 360·390 의 지금 배치(`ChatHeader.tsx:130` `hidden md:inline-flex`, `ChatPromptInput.tsx:102-109`)와 제품 원칙(폭별 기능 동등, 단일 디자인시스템). 다른 챗 제품의 모델 선택 위치는 조사하지 않았다: 근거 없음(가정)
- E40. (보정 7) 360 탭 폭 계산(R37) — `SegmentedControl.tsx:35,49` 클래스(`p-0.5`, `gap-0.5`, `px-3`, `gap-1.5`, 아이콘 `size-4`, `text-sm`)와 한글 한 자 약 13~14px 가정. 계산값이라 `chatScope` 로 확인
- (보정 7) 외부 조사(researcher·benchmarker)는 부르지 않았다. 새 의존성·갈리는 기술 선택이 없고, 판단에 쓴 사실은 스크린샷·저장소 코드·메인 세션의 DB 조회에서 확인했다.
- E41. (보정 8) 인기 점수를 지표 소스만 표시(R41) — `categorizer.py:139-147`(인기 = `raw_score`·`comments` 의 함수, 100 에서 자름), 표시 코드 `NewsCard.tsx:89,91,203-209`, 스크린샷 `audit/feed-light-1440x900.png`(spec 작성자 재확인), DB 분포는 메인 세션 조회(2026-11-07, 다시 조회하지 않음). 외부 조사는 부르지 않았다 (갈리는 기술 선택 없음)
- E42. (보정 9) 피드 세 영역 분리(R42) — 사용자 지시 원문(14.17 경위 2), 메인의 HEAD `bcec1f5` 프로덕션 측정값(경위 1), 코드 `FeedToolbar.tsx:144-250`, `FeedStatusBar.tsx:28-50`, `page.tsx:145,164-205`, `TextField.tsx:5-11,130`, `Select.tsx:54`, `Chip.tsx:45`. R5 기준값은 `audit/report.json`(1440 첫 줄 아래 끝 559, 390 첫 제목 아래 끝 493). 폭·높이 계산은 Tailwind 클래스와 글자 폭 가정(한글 한 자 ≈ 글자 크기, 숫자 ≈ 0.6em)이라 오차가 있다: ui-audit 로 확인. 정렬을 live 영역 밖에 두는 판단은 WAI-ARIA `status` 역할(내용 변경 알림)에 기댄 것으로 이번에 원문을 다시 조회하지 않았다. 검색 전체 폭·sticky 범위 선택은 근거 없음(가정), 외부 사례 조사를 하지 않았다
- E43. (보정 9) 입력 경계 대비 — WCAG 2.2 SC 1.4.11(비텍스트 대비 3:1). 값은 sRGB 상대 휘도 공식으로 계산한 라이트 테마 값(`rgb(123,135,152)` 약 3.6:1, `rgb(226,232,240)` 약 1.2:1, 흰 바탕 가정)
- E44. (보정 9) 챗 헤더 순서(R43) — `ChatHeader.tsx:100-121`, `ChatWorkspace.tsx:672`. 뒤로 가기를 맨 왼쪽에 두는 관례는 메인 지시를 따랐고 외부 근거를 조사하지 않았다
- E45. (보정 9) 그림 문자 금지(R44) — `rg` 로 찾은 프론트 이모지 위치(14.17 H2), 단일 디자인시스템 원칙(`docs/product.md`), 아이콘 킷 `lucide-react`(이미 의존). 판정식 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/u` (정정) — 처음 식 `/\p{Extended_Pictographic}/u` 가 텍스트 표현 기호 `©`(U+00A9, `app/page.tsx:265`)·`↔`(U+2194, `ui/Toast.tsx:34,185`)까지 거는 것을 planner 가 확인했고, 메인이 node 로 센 결과 새 식은 대상 다섯 파일의 16글자만 건다. 속성 정의(Emoji_Presentation, Extended_Pictographic, U+FE0F 이모지 표현 선택자)는 Unicode `emoji-data.txt`·UTS #51 에 기댄 것으로 이번에 원문을 다시 조회하지 않았다: `IconGuard` 테스트 실행으로 확인
- E46. (보정 9) 이관·탭 용어(R45) — R38 용어 규칙, 목적지 이름 `AI 챗`(`ChatHeader.tsx:121`, 헤더 내비), 이관이 `sourceId` 로 단일 기사 모드를 연다는 점(`HandoverCtaButton.tsx:38`). 문구 선택은 근거 없음(가정), 사용자 조사를 하지 않았다
- E47. (보정 9) 브리핑 중복·분야 이름(R46·R47) — 프론트 `DailyBriefingModal.tsx:117-119,172-180,192-196,213,297,301-325,358`, backend `briefing_service.py:13-42,86-104,138-144`(응답에 `categories[].id` 가 있음). 헤드라인 잘림이 backend 라는 판단은 `Dialog.tsx:233-235`(자르기 클래스 없음)와 `briefing_service.py:101-102` 로 확인했다. 실제 프로덕션 응답 글자는 다시 조회하지 않았다 (스크린샷 `briefing-*.png` 는 메인 보고)
- E48. (보정 9) 카드 바닥 줄(R48) — `NewsCard.tsx:178-231`, `HandoverCtaButton.tsx:73-85`, `Button.tsx:8-9,20`, `Card.tsx:9`(`p-4 md:p-5`). 폭은 계산값: ui-audit `cardFooter` 로 확인. 버튼 묶음을 줄바꿈으로 내리는 선택은 근거 없음(가정)
- (보정 9) 외부 조사(researcher·benchmarker)는 부르지 않았다. 새 의존성·갈리는 기술 선택이 없고, 판단에 쓴 사실은 사용자·메인 지시, 저장소 코드, `report.json` 에서 확인했다. UX 선택(검색 전체 폭, sticky 범위, 문구)은 가정으로 표시했다.

## 넘겨받은 열린 질문
- 브랜드 색과 전체 인상: 중립 회색(slate 계열) + 단일 강조색 파랑으로 간다. GitHub 다크 hex 를 버리고 다크는 중립 어두운 회색(`#0e1013`/`#16191d`)이다. 의미 색은 성공·주의·위험 셋 (설계 1.1, 1.3, 근거 E7).
- 헤더 정보 구조: 헤더에 브랜드, `피드`·`AI 챗`, 수집 상태, 즉시 수집, 팔레트, 테마, 더보기를 남긴다. 소스·공유·MCP·RSS·초기화는 더보기 메뉴와 팔레트로 옮긴다. 모바일은 브랜드 + `AI 챗`·팔레트·더보기 세 버튼. 모바일 하단 내비게이션은 두지 않는다 (설계 3, E9).
- 피드 첫 화면: 브리핑 배너·개요 카드·Tech Radar 를 48px 요약 바 하나로 합치고(개요 카드 제거, 레이더는 펼침 패널), 필터는 md 이상에서 sticky 툴바, 모바일은 고정하지 않는 세 줄 툴바로 둔다 (설계 4, E10).
- 모달의 모바일 표현: 내용 대화상자는 전체 화면 시트, 확인 창·포커스 필터는 바텀시트, 팔레트는 전체 화면 (설계 2.1-8, 5, E11).
- 태블릿 챗 사이드바: 드로어로 둔다. 고정 사이드바는 1024px 이상 (설계 6, E12).
- lint 기준선 54개 중 `types/**`·`mocks/**`·`lib/**`: 타입 표기만 고치고 스키마·응답은 그대로 둔다. 계약 변경 없음 (설계 12, 우려 사항 4).
- 바뀐 화면 검증: 단위 테스트(오버레이·단축키·헤더·토큰 정적 검사·대비 계산) + `frontend/scripts/ui-audit.mjs` 로 5개 폭 × 2테마 × 두 경로(+대화상자 7종) 측정값과 스크린샷을 `docs/features/ui-redesign/audit/` 에 남기고 verify.md 가 인용한다 (설계 11.3, 11.4, 우려 사항 7). 2차: 이 측정이 잘림·가림·정렬 결함을 놓쳤으므로 판정을 강화하고(14.8), 판정 자체를 고정 결함 페이지와 수정 전 코드로 검증하며(R30), 프로덕션 빌드에서 돌린다(R31).
- (2차) 390 칩 줄: 줄바꿈 대신 가로 스크롤로 두고 스크롤 가능함을 보인다 (14.0 결정 1, 14.3, E18).
- (2차) 첫 화면 정보 위계: 필터 칩 줄은 폭마다 독립 줄로 잘림 없이, 카드 배지는 머리줄 0개·배지 줄 최대 4개 한 줄, 카드는 고정 틀 (14.0 결정 2, 14.2, 14.4).
