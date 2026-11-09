# Task 55: 프로덕션 재측정 9·스크린샷

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 55 (보정 9)
Status: done
Session: main
Agent: aa16eed435b46be0f (implementer A)
Updated: 2026-11-07 (재측정)

## 한 일
- 관문 G22 뒤 단독. 측정 HEAD 는 `707e1a0`(49~54 커밋 포함). 실행 환경은 47 과 같다:
  - HEAD·1ec8a9b 를 각각 `git worktree add --detach <scratchpad>/al55-{head,base}` → `pnpm install --frozen-lockfile` → `NEXT_PUBLIC_API_URL=http://localhost:8102 INTERNAL_API_URL=http://127.0.0.1:8102 pnpm build` (둘 다 성공).
  - standalone 으로 HEAD 3101, 1ec8a9b 3102. backend 는 DB 복사본(`audit-agentlens.db`)으로 127.0.0.1:8102.
- 순서: ① `--self-test` → ② HEAD 전체 측정(기본 `--out`, `--screenshots key`, `--commit 707e1a0…`) → ③ 1ec8a9b 기준선(`--out …/baseline-1ec8a9b --screenshots none --commit 1ec8a9b`) → ⑥ Chrome 확인 → ⑦ PNG 육안 → 서버·worktree 정리 → `make build`·`make check`·frontend 세 명령.
- 판정 오탐: 없음 (49 의 연장 수정 없음, `frontend/scripts` 그대로).

## 바꾼 파일
- docs/features/ui-redesign/audit/report.json
- docs/features/ui-redesign/audit/*.png — 24장 모두 바이트가 바뀜 (feed 10, chat 10, detail 2, briefing 2. 보정 9 화면 변경과 헤더 시각)
- docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json

## 검사 결과
### ① self-test
- `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` → 종료 0, `SELF-TEST PASS: defects.html 결함 모두 검출, clean.html 검사 21개 통과, dev-indicator.html 환경 오류 판정`.

### ② HEAD 707e1a0 (종료 0)
```
PASS: 조합 160, 통과 160, 실패 0, 건너뜀 0, 실패 항목 0
  clip·placeholder·occluded·scrollRow·ariaControls·keepAll  상태 160, 실패 0
  vRhythm 10 · toolbarLayout 10 · cardMetric 10 · feedAreas 10 · cardFooter 10 · briefing 10 · modelPicker 10 · chatHeader 10 · focusLabels 10 · toast 10  실패 0
  terms 70 · pictograph 50 · chatScope 30 · rowAlign 6 · chatAlign 4  실패 0
```
- `environment`: `devIndicator: false`, `commit: 707e1a0197d74154700b38e922d1c70639cd9ff0`, Chrome 157.0.8103.38. PNG 24장.
- 뉴스 상세 `AI 질의응답` 탭: 10 조합 모두 열렸고 `pass: true` (오류 0). 그 탭 상태의 `pictograph`·`terms` 실패 0 (예: 1440 light `pictograph` 대상 10, `terms` 대상 29).
- 새 검사가 해당 상태의 `checks` 에 있음: `/` 10 조합 `feedAreas`·`cardFooter`·`terms`, `/chat` 10 조합 `chatHeader`·`pictograph`, 포커스 필터 10 `pictograph`, 뉴스 상세 두 탭 20 `pictograph`·`terms`, 일일 브리핑 10 `pictograph`·`briefing` (브리핑이 있어 skipped 없음).

### ③ 1ec8a9b 기준선 (종료 1)
```
FAIL: 조합 160, 통과 20, 실패 140, 건너뜀 0, 실패 항목 456
```
- `environment.commit` `1ec8a9b`. 47 때 394 → 456.
  - 새 검사 몫 +60: `R9`(card-chat) 10, `feedAreas` 10, `cardFooter` 10, `pictograph` 20, `briefing` 10, `chatHeader` 10.
  - `terms` 30 → 50 (넓힌 판정: `/` 카드·상세 첫 탭).
  - `open` 10: 1ec8a9b 의 상세 둘째 탭(`Ask AI 질의응답`)을 새 이름 `/^AI 질의응답/` 로 열지 못함 (결정 2 와 같은 이유).
  - 그래서 상태별 검사가 160 → 150 상태로 줄어 `clip` 42→38, `placeholder` 22→18, `scrollRow` 30→20, `ariaControls` 78→68, `keepAll` 128→118 상태 (그 탭 상태 10 개 몫이 빠짐).
- F1~F4 그대로 잡힘: F1 1440 소스 줄 `scrollRow` 4·`clip` 3, F2 390 카테고리 줄 `scrollRow` 3, F3 1440·390 `placeholder` 각 1, F4 `rowAlign` 768 6·1440 7.

### ⑤ 기록
`feedAreas.layout` (light, px, 차이 = rect − 콘텐츠 끝. 다크도 같다):

| 폭 | 콘텐츠 | 검색 l/r/h | 정렬 r/h | 토글 r/h | 머리줄 l/top/h | 끝 차이 (검색 l·r, 머리줄 l, 정렬 r, 토글 r) |
|---|---|---|---|---|---|---|
| 360 | 16~344 | 16/344/44 | 344/44 | 344/44 | 16/292/44 | 0·0·0·0·0 |
| 390 | 16~374 | 16/374/44 | 374/44 | 374/44 | 16/292/44 | 0·0·0·0·0 |
| 768 | 24~744 | 24/744/36 | 744/36 | 744/32 | 24/284/36 | 0·0·0·0·0 |
| 1024 | 32~992 | 32/992/36 | 992/36 | 992/32 | 32/284/36 | 0·0·0·0·0 |
| 1440 | 112~1328 | 112/1328/36 | 1328/36 | 1328/32 | 112/284/36 | 0·0·0·0·0 |

`toolbarLayout.source` (우려 35, light·dark 같음):

| 폭 | 보이는 폭 (기준) | 흐림 밖 칩 | 토글 top / 소스 줄 | toggleRight / contentRight | `mustReadVisible` |
|---|---|---|---|---|---|
| 360 | 276 (≥ 275) | 2 | 236 / 232~284 (같은 줄) | 344 / 344 | true |
| 390 | 306 (≥ 305) | 2 | 236 / 232~284 (같은 줄) | 374 / 374 | true |

`vRhythm` 세 간격 (요약 바 → 검색, 검색 → 첫 칩 줄, 마지막 칩 줄 → 머리줄): 360·390 12·12·12, 768·1024·1440 16·16·16.

R5 (우려 38 의 첫 화면): 1440×900 첫 줄 아래 끝 619 (top 336, 3장) < 900 — spec 계산값 약 619 와 같다. 390×844 첫 제목 아래 끝 469 < 844 — spec 계산 약 469 와 같다. 다크도 같다.

`/` 10 조합: `cardFooter` 실패 0 (각 대상 18 카드), `rowAlign` 실패 0 (768·1024·1440 각 18 카드, 우려 41), R9 통과. `chatHeader`·`pictograph`·`terms`·`briefing` 실패 0. `briefing.categoryHeadings` = `하네스 & 벤치마크`, `MCP & 생태계`, `에이전트 아키텍처`, `최신 AI 동향`.

### ⑥ Chrome 확인 (프로덕션 3101, puppeteer-core 로 실제 Chrome 157 headless, 스크립트 `<scratchpad>/chrome55.mjs`)
- 우려 36 — `/` 단축키:

| 폭 | 방법 | 결과 |
|---|---|---|
| 1024×768 | `window.scrollTo(0, 1500)` 뒤 `/` | `activeElement` = `input[type=search]` `키워드 검색`, scrollY 1500 → 64, 입력 top 80 ≥ 56, bottom 116 ≤ 768, 가운데 점이 입력 (헤더·띠에 가리지 않음). 통과 |
| 390×844 | 같음 | 같은 입력, scrollY 1500 → 48, top 80 ≥ 56, bottom 124 ≤ 844, 가운데 점이 입력. 통과 |

  - 1024 스크롤 상태 sticky 띠: 헤더 bottom 56 + `[data-feed-toolbar]` 높이 88 (top 56, bottom 144, `position: sticky`) = 144 — spec 계산값(약 88, 합 약 144)과 같다. 390 은 `static`(sticky 아님, 그대로).
- 우려 38 — 360×780 카테고리 칩 `하네스 & 벤치마크` + `Must-Read` 켬:
  - `scrollWidth` 360 ≤ `innerWidth` 360 (가로 스크롤 없음). 정렬 오른쪽 끝 344 = 머리줄 오른쪽 끝 344.
  - 머리줄 높이: 처음 44 → 필터 뒤 72 (상태 글자 `총 1071건 (전체 4734건)` / `Must-Read` 배지 / `페이지 1 / 60` 이 세 줄). 정렬 높이 44.
  - **정렬 top − 머리줄 top = 14 (plan 기대 ≤ 1 과 다름)**. 머리줄이 `flex items-center`(spec 14.17 설계 그대로)라 정렬이 72px 머리줄의 세로 가운데에 놓인다. spec 문장 '정렬은 첫 줄 오른쪽에 남는다'(우려 38)와 spec 의 클래스 설계가 서로 맞지 않는다. 가로 넘침·잘림은 없다. 증거 `<scratchpad>/chrome55-360-filtered-header.png`. 50 담당 파일(`FeedStatusBar.tsx`)이고 spec 이 판정하지 않는 '기록만' 항목이라 고치지 않고 메인 세션에 알린다.

### ⑦ 육안 확인
- `feed-light-1440x900.png`: 요약 바 → 전체 폭 검색 → 카테고리 줄 → 소스 줄 + 오른쪽 끝 `Must-Read` → `총 4734건 … 페이지 1 / 263 [인기순]`. 검색·토글·정렬 오른쪽 끝이 1328 로 맞음. 카드 바닥 `AI 챗에서 분석`·`원문`. 둘째 줄 GitHub 카드는 통계 `19,848 · 2646 · 100` 아래로 버튼 묶음이 내려감(우려 41: 같은 줄 RSS 카드는 한 줄 바닥, 카드 높이·제목 위치는 같음).
- `feed-light-1024x768.png`: 같은 순서, 3열 카드 바닥에 `AI 챗에서 분석` 글자 보임 (H6 해소).
- `feed-light-768x1024.png`: 카테고리·소스 줄이 넘쳐 `>` 버튼, 토글이 소스 줄 오른쪽 끝. 2열 카드 바닥 글자 보임.
- `feed-light-390x844.png`·`feed-light-360x780.png`: 44px 검색 전체 폭, 카테고리 줄 양쪽 bleed, 소스 줄 + 별 토글이 한 줄, `총 4734건 페이지 1 / 263 [인기순]` 한 줄.
- `chat-light-1440x900.png`·`chat-light-390x844.png`: 헤더 맨 왼쪽 `← 피드`(390 은 화살표만) 다음 기록 아이콘, `AI 챗`. 추천 카드 4개에 lucide 아이콘(이모지 없음), 모델 칩 `Sonnet 5.5` 앞 아이콘.
- `detail-light-1440x900.png`·`detail-light-390x844.png`: 탭 `AI 요약 & 시사점` / `AI 질의응답`, 배너 `AI 챗에서 분석` + `이 기사를 단일 기사 모드로 열어 질의응답`.
- `briefing-light-1440x900.png`·`briefing-light-390x844.png`: 헤드라인은 제목 아래 설명에 한 번, `오늘의 핵심 요약` 안은 개요만(분야 이름 `하네스 & 벤치마크`·`MCP & 생태계`·`에이전트 아키텍처`·`최신 AI 동향`), 분야 머리글 `하네스 & 벤치마크` + 방패 아이콘, 설정은 바닥 `연동 설정` 하나(위 톱니 없음, 390 은 `…` 메뉴와 바닥).

### ⑧ make build·make check
- `make build` 종료 0.
- `make check` 종료 2 — backend 의 알려진 2개만 실패:
```
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
================== 2 failed, 158 passed in 110.18s (0:01:50) ===================
make: *** [check] Error 1
```
- make 가 backend 에서 멈춰 frontend 세 명령을 따로 돌렸다: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0 — `Test Files 52 passed (52)`, `Tests 648 passed (648)`, `✖ 41 problems (0 errors, 41 warnings)`, tsc 출력 없음.
- make check 가 바꾼 `sources.json`·`backend/app/config/sources.json` 을 `git checkout --` 로 되돌렸고, 되돌린 뒤 세 파일(`config.json` 포함) `git status` 출력 없음.
- 서버 3101·3102·8102 를 껐고(`lsof` 포트 비었음), worktree 두 개를 지웠다.

## 재측정 (50 연장 a7b2d95 뒤, HEAD 4f7935f)
- 이유: 첫 측정의 우려 38 기록(360 필터 상태 정렬 top − 머리줄 top 14)으로 50 이 목록 머리줄을 `items-start` 로, 상태 최소 높이를 select 높이(`min-h-11 md:min-h-9`)로 바꿨다 (`a7b2d95`).
- 환경은 위와 같다: `git worktree add --detach` 로 HEAD `4f7935f`·`1ec8a9b` 를 프로덕션 빌드(둘 다 성공), standalone 3101·3102, backend DB 복사본 8102.
- HEAD 4f7935f 측정 (기본 `--out`, `--screenshots key`, 종료 0):
```
PASS: 조합 160, 통과 160, 실패 0, 건너뜀 0, 실패 항목 0
  clip·placeholder·occluded·scrollRow·ariaControls·keepAll 상태 160 실패 0
  vRhythm·toolbarLayout·cardMetric·feedAreas·cardFooter·briefing·modelPicker·chatHeader·focusLabels·toast 각 10 실패 0
  terms 70 · pictograph 50 · chatScope 30 · rowAlign 6 · chatAlign 4 실패 0
```
  - `environment`: `devIndicator: false`, `commit: 4f7935f4f9a6d2501b2e5b0293b097c9f0673df6`. 뉴스 상세 `AI 질의응답` 탭 10 조합 모두 `pass: true`.
  - ⑤ 기록은 첫 측정과 같다: `feedAreas` 5폭 끝 차이 모두 0, 360·390 `toolbarLayout.source` 보이는 폭 276·306 / 칩 2 / 토글 같은 줄 / `toggleRight` = `contentRight`, `vRhythm` 12·12·12 (768 미만)·16·16·16, R5 1440 619·390 469, `/` 10 조합 `cardFooter`·`rowAlign` 실패 0.
- 1ec8a9b 기준선 (종료 1): `FAIL: 조합 160, 통과 20, 실패 140, 건너뜀 0, 실패 항목 456`. `commit 1ec8a9b`. 검사별 건수가 `c586909` 의 기준선과 모두 같다. F1 1440 소스 줄 `scrollRow` 4·`clip` 3, F2 390 카테고리 `scrollRow` 3, F3 `placeholder` 1440·390 각 1, F4 `rowAlign` 768 6·1440 7.
- PNG 24장을 다시 만들었고 바이트가 바뀐 것은 8장이다: `feed-{light,dark}-{768x1024,1024x768,1440x900}.png` 6장, `briefing-light-1440x900.png`, `detail-light-1440x900.png`. 768 이상 헤더의 '다음 수집' 시각(4h 27m → 4h 15m)이 바뀐 것이고, 목록 머리줄은 한 줄 상태라 모양이 같다 (`feed-light-768x1024.png` 확인).
- Chrome 확인 (프로덕션 3101, puppeteer-core·Chrome 157 headless, 스크립트 `<scratchpad>/chrome55r.mjs`). 카테고리 칩 `하네스 & 벤치마크` + `Must-Read` 를 켠 상태와 필터 없는 기본 상태. '상태 글자 첫 줄 중심' = `[data-feed-status]` 안 보이는 글자 노드(sr-only 제외)의 Range rect 중 가장 위 줄(top 이 최소 top + 4 안)의 top~bottom 가운데. 차 = 첫 줄 중심 − 정렬 중심.

  | 폭 | 상태 | 머리줄 높이 | 정렬 높이 | 정렬 top − 머리줄 top | 첫 줄 중심 − 정렬 중심 | 가로 넘침 | 정렬 오른쪽 − 머리줄 오른쪽 |
  |---|---|---|---|---|---|---|---|
  | 360×780 | 기본 (`총 4734건` · `페이지 1 / 263` 한 줄) | 44 | 44 | 0 | −0.5 | 없음 | 0 |
  | 360×780 | 카테고리+Must-Read (`총 1071건 (전체 4734건)` / `Must-Read` / `페이지 1 / 60` 세 줄) | 72 | 44 | **0** | −12.5 | 없음 | 0 |
  | 390×844 | 기본 | 44 | 44 | 0 | −0.5 | 없음 | 0 |
  | 390×844 | 카테고리+Must-Read (세 줄) | 72 | 44 | **0** | −12.5 | 없음 | 0 |
  | 1440×900 | 기본 | 36 | 36 | 0 | −0.5 | 없음 | 0 |
  | 1440×900 | 카테고리+Must-Read (한 줄) | 36 | 36 | **0** | −0.5 | 없음 | 0 |

  - 정렬 top − 머리줄 top 은 모든 경우 0 (기대 0). 한 줄 상태에서는 글자 중심과 정렬 중심 차가 −0.5px (서브픽셀). 세 줄이 된 360·390 필터 상태에서는 정렬이 첫 줄 오른쪽 위에 붙고, 첫 줄 글자(20px 줄) 중심이 정렬(44px) 중심보다 12.5px 위다 — 첫 줄이 상태 칸 맨 위에서 시작하고 정렬은 44px 높이라서다. 기록만 한다 (판정 없음).
  - 스크린샷 (scratchpad, 커밋하지 않음): `<scratchpad>/chrome55r/header-{360x780,390x844,1440x900}-{default,filtered}.png`, `<scratchpad>/chrome55r/page-{360x780,390x844,1440x900}-filtered.png`.
- `make build` 종료 0. `make check` 종료 2 — backend 알려진 2개만 실패:
```
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
================== 2 failed, 158 passed in 105.00s (0:01:45) ===================
make: *** [check] Error 1
```
  frontend 따로 `pnpm test && pnpm lint && pnpm exec tsc --noEmit` 종료 0: `Test Files 52 passed (52)`, `Tests 649 passed (649)`, `✖ 41 problems (0 errors, 41 warnings)`, tsc 출력 없음.
- make check 가 바꾼 `sources.json`·`backend/app/config/sources.json` 을 `git checkout --` 로 되돌렸고, 세 파일(`config.json` 포함) `git status` 출력 없음. 서버 3101·3102·8102 를 껐고(포트 비었음) worktree 두 개를 지웠다.
- 판정 오탐: 없음 (`frontend/scripts` 그대로).

## 결정
- 기준선 실패 항목이 394 → 456 으로 는 것은 보정 9 판정(새 검사 5개·`terms` 넓힘·`card-chat` 이름)과 1ec8a9b 에서 상세 둘째 탭을 새 이름으로 열지 못하는 `open` 10 때문이다. 기준 상수는 바꾸지 않았다.

## 막힌 점
- 없음. 첫 측정의 우려 38 차이(정렬 top − 머리줄 top 14)는 50 연장 `a7b2d95` 로 고쳐졌고 재측정에서 0 이다.

## 다음
- 없음.
