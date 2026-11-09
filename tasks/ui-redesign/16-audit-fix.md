# Task 16: ui-audit 실행과 폭별 결함 수정

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 16
Status: done
Session: implementer A
Agent: af6e0d326aef729b0
Updated: 2026-11-06

## 한 일
- 환경: 메인이 띄운 앱을 그대로 썼다 (frontend `http://localhost:3001` next dev, backend `http://127.0.0.1:8000` 개발 DB 복사본). 서버를 끄거나 다시 띄우지 않았다. `curl /health`·`/api/health` 정상, 피드 기사 4355건 (R5 측정 가능). Chrome: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
- 1차 실행 (`--screenshots none`, 스크래치 경로): 조합 110 중 통과 0, 실패 항목 122. 원인별 정리:
  1. **R7 전 대화상자 실패 (90건) — 스크립트 결함.** `inPageEscapeResult` 가 Escape 뒤 DOM 에 남은 표시 요소로 맨 위 번호를 셌다. 닫힌 대화상자는 언마운트되므로 단일 대화상자는 `maxIndex=-1` → `othersKept=false` 가 되었고, 겹친 경우(브리핑+연동 설정)는 `topClosed=false` 가 되었다. 실제 앱은 맞게 동작했다 (remaining 0 / 1).
  2. **R9 `category-chips`·`source-chips`·`scope` 그룹 missing (모바일) — 스크립트 결함.** `accessibility.snapshot({ interestingOnly: true })` 가 포커스 불가인 이름 있는 `group` 을 뺀다. DOM 에는 `role="group" aria-label` 이 있었다.
  3. **R9 `collect-status` missing (데스크톱)** — 스크립트 기대 `/^(다음 수집|수집 중)/` 이 구현 이름 `수집 스케줄 · 다음 수집 …`(spec 3 표의 aria-label, 보이는 글자를 포함)과 어긋났다.
  4. **R6 (모바일 360·390)** — 앱 결함:
     - 헤더 브랜드 링크 `AgentLens` 높이 28px.
     - `즉시 수집` 버튼이 모바일에 보였다 (36×44). `Button` 기본 `inline-flex` 와 덧붙인 `hidden` 이 겹쳐 `inline-flex` 가 이겼다. 같은 이유로 버전 `Badge` 의 `hidden lg:inline-flex` 도 숨겨지지 않았다.
  5. **R6 (모바일, 공유 & 알림 설정 대화상자)** — `Notion 개발자 포털` 문장 속 링크 22.8px.
- 고친 것:
  - `scripts/ui-audit.mjs`:
    - (1) Escape 결과는 측정 때 센 `openCount - 1` 을 맨 위 번호로 받는다.
    - (2) AX 스냅샷을 `interestingOnly: false` 로 본다.
    - (3) 데스크톱 `collect-status` 기대를 `/다음 수집|수집 중/` 으로 바꿨다 (태블릿 `/^수집 스케줄/` 은 그대로).
    - 측정 기준(44px, 64px, 대화상자 속성)은 바꾸지 않았다.
  - `Header.tsx`:
    - 브랜드 링크 `h-11`.
    - 즉시 수집 `Button` 과 버전 `Badge` 는 바깥 `<span className="hidden md:inline-flex">`/`hidden lg:inline-flex` 로 감싸 숨긴다.
    - `ThemeMenu` 의 쓸모없는 `max-md:hidden` 을 뺐다 (모바일에서는 렌더하지 않음).
  - `BriefingSettingsModal.tsx`: `Notion 개발자 포털` 링크에 `min-h-11 md:min-h-0` (모바일 44px).
  - `McpModal.tsx:54` (15단계 관찰): 제목 안 `<code>` 에 `rounded border border-border bg-surface-muted px-1 py-0.5 font-normal break-all` (MarkdownViewer 인라인 코드와 같은 모양).
- 2차 실행 (스크래치): 조합 110 / 통과 110 / 실패 0 / 건너뜀 0. 대표 확인값:
  - 360 R3 `scrollWidth 360 = innerWidth`, R4 높이 56 한 줄
  - 390×844 R5 첫 제목 top 417·bottom 461 < 844, 1440×900 R5 첫 줄 3장 maxBottom 536.5 < 900
  - 브리핑+연동 설정 Escape `remaining 1, topClosed, othersKept`
  - R8 viewport `width=device-width, initial-scale=1, interactive-widget=resizes-content`
  - R9 의 missing·absent 없음
- 최종 실행 (기본 `--out`, `--screenshots key`): `docs/features/ui-redesign/audit/report.json` 과 PNG 8장 (`feed`·`chat` × `390x844`·`1440x900` × `light`·`dark`). `--screenshots all` 은 돌리지 않았다 (커밋 대상 아님).

## 바꾼 파일
- frontend/scripts/ui-audit.mjs
- frontend/src/components/Header.tsx
- frontend/src/components/BriefingSettingsModal.tsx
- frontend/src/components/McpModal.tsx
- docs/features/ui-redesign/audit/report.json (새)
- docs/features/ui-redesign/audit/{feed,chat}-{light,dark}-{390x844,1440x900}.png (새, 8장)

## 검사 결과
- `cd frontend && CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/ui-audit.mjs` → 종료 코드 0
  ```
  PASS: 조합 110, 통과 110, 실패 0, 건너뜀 0, 실패 항목 0
  report: /Users/wonyoung/workspace/ozplayground/agentlens/docs/features/ui-redesign/audit/report.json
  ```
- `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` — 세 명령 모두 종료 코드 0
  ```
   Test Files  42 passed (42)
        Tests  450 passed (450)
  ✖ 41 problems (0 errors, 41 warnings)
  tsc exit 0
  ```
- `pnpm exec eslint scripts/ui-audit.mjs` → 종료 코드 0
- `make build` → 종료 코드 0 (라우트 `/`, `/_not-found`, `/api/health`, `/chat`). 빌드 뒤에도 dev 서버 정상 (`/api/health` healthy, `/` 200). Next 16 의 dev 는 `.next/dev` 를 따로 쓴다.

## 결정
- 1차 실패의 대부분(R7 90건, R9 그룹)은 측정 스크립트의 결함이라 스크립트를 고쳤다. 화면 규칙의 기준값은 바꾸지 않았다. 코디네이터 지시("진입점 이름이 구현과 다르면 스크립트를 고친다")에 따라 `collect-status` 기대도 고쳤다. 태블릿·데스크톱이 같은 요소라 이름은 spec 3 의 aria-label(`수집 스케줄 · 다음 수집 … 후`)이고, 보이는 글자를 포함한다.
- 문장 속 링크(`Notion 개발자 포털`)는 WCAG 2.5.8 인라인 예외에 들 수 있다. 하지만 스크립트는 마크다운 본문만 예외로 둔다 (spec 1.9). 그래서 스크립트를 넓히지 않고 링크를 모바일 44px 로 키웠다.
- 공통 부품(`components/ui/**`)은 고치지 않았다. `hidden` 충돌은 부품 결함이 아니라 쓰는 쪽에서 기본 display 를 덮어쓴 문제라 감싸는 요소로 풀었다. design-system.md 에 "부품의 `className` 으로 `hidden` 을 주지 말고 감싸는 요소에 준다" 를 적으면 좋다 (17 메인).
- plan 의 준비 단계(`docker compose up -d --build`)와 끝 기준의 전체 `make check` 는 코디네이터 지시에 따라 대신했다: 띄워 둔 dev 서버를 쓰고, frontend 검사와 `make build` 를 돌렸다. `make check` 를 돌리지 않았으므로 `config.json`·`sources.json` 변경도 없다 (`git status` 확인).

## 막힌 점
- 없음.

## 다음
- 없음. 17(문서 반영)은 메인 세션. verify 단계가 `audit/report.json` 과 PNG 8장을 인용한다.
