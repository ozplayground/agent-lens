# Task 08: ui-audit 스크립트 작성

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 8
Status: done
Session: implementer D
Agent: a8cccceeeb8d0557d
Updated: 2026-11-06

## 한 일
- `frontend/scripts/ui-audit.mjs` 작성 (spec 설계 11.4, plan 작업 순서 8). `puppeteer-core` 만 쓰고, `--help`·인자 오류는 puppeteer 를 불러오지 않고 처리한다 (동적 import).
- 인자: `--base`(기본 `http://localhost:3001`), `--out`(기본 `<저장소>/docs/features/ui-redesign/audit`, 직접 주면 cwd 기준), `--screenshots key|all|none`(기본 key). 보조로 `--routes`, `--themes`, `--viewports`, `--skip-dialogs`, `--timeout`, `--headful`, `-h/--help`. Chrome 은 `CHROME_PATH`, 없으면 흔한 설치 경로를 찾는다.
- 조합: `/`, `/chat` × light, dark (`localStorage.agentlens_theme` 를 넣은 뒤 다시 불러옴, `prefers-color-scheme` 도 맞춤, `prefers-reduced-motion: reduce`) × 360×780, 390×844, 768×1024, 1024×768, 1440×900. `/` 에서는 폭·테마마다 대화상자 8종을 하나씩 연다: 뉴스 상세, 일일 브리핑, 공유 & 알림, 스케줄, MCP, 소스 & 리서처, 커맨드 팔레트, 초기화 확인 창. 여기에 겹침 경우(일일 브리핑 → `연동 설정 관리`)를 더한다. 진입은 헤더 버튼, 더보기 메뉴, 카드 제목 순서로 찾는다.
- 측정:
  - R3: `scrollWidth <= innerWidth`. 대화상자가 열린 상태도 잰다.
  - R4: 대화상자 밖 첫 `<header>` 높이가 64 이하이고, 직계 자식이 한 줄이다.
  - R5: 390×844 에서 첫 `[data-feed-card] h3` 이 화면 안에 있고, 1440×900 에서 첫 줄 카드 전체가 화면 안에 있다.
  - R6: 768 미만에서 spec 1.9 주요 조작 요소 선택자, 열린 대화상자 안의 조작 요소, 더보기 메뉴 항목이 모두 44×44 이상이다. `.markdown-viewer a` 와 sr-only 요소는 뺀다.
  - R7: 맨 위 대화상자의 `role`(초기화 확인 창은 `alertdialog`), `aria-modal="true"`, `aria-labelledby` 가 가리키는 글자 또는 `aria-label` 을 본다. Escape 한 번에 맨 위만 닫히고 아래 대화상자는 남아야 한다. `#app-shell` 의 `inert` 는 참고값으로만 남긴다.
  - R8: viewport 메타에 `user-scalable=no|0` 과 `maximum-scale` 이 없다.
  - R9: 접근성 트리(`page.accessibility.snapshot`)에서 spec 설계 3·6·9 의 진입점을 폭(desktop/tablet/mobile)별 역할과 접근 이름으로 찾는다. 더보기 메뉴를 열어야 하는 항목도 포함한다.
  - 테마 적용(R2 참고): `<html>` 클래스와 `data-theme` 이 고른 테마와 같은지 본다.
- 출력: `report.json` 에 조합별 `checks`, `pass`, `failures[]`, `skipped[]`, `summary` 를 남긴다. PNG 는 key 모드에서 8장(`feed|chat-<theme>-390x844|1440x900.png`), all 모드에서 대화상자 상태까지 모든 조합을 찍는다. 실패가 하나라도 있으면 종료 코드 1, 사용법·환경 오류는 2 다.
- 초기화 확인 창은 Escape 로만 닫고 확인 버튼은 누르지 않는다 (파괴적 동작 방지).

## 바꾼 파일
- frontend/scripts/ui-audit.mjs (새 파일)

## 검사 결과
- `cd frontend && node --check scripts/ui-audit.mjs` → `check ok`
- `pnpm exec eslint scripts/ui-audit.mjs` → 출력 없음, 종료 코드 0
- `node scripts/ui-audit.mjs --help` → 사용법 출력, 종료 코드 0
- 인자 오류 확인 (모두 종료 코드 2):
  - `--screenshots bogus` → `--screenshots 는 key, all, none 중 하나다: bogus`
  - `--viewports 390` → `--viewports 형식이 잘못됐다: 390 (예: 390x844)`
  - `--nope` → `Unknown option '--nope'`
  - `CHROME_PATH=/nonexistent` → `CHROME_PATH 가 가리키는 파일이 없다: /nonexistent`
- `parseCliArgs(['--routes','chat','--themes','dark','--viewports','390x844','--out','tmp-audit','--skip-dialogs'])` 의 결과: routes `[chat]`, themes `[dark]`, viewports `[390x844]`, out 은 cwd 기준 절대 경로, skipDialogs `true`.
- 실제 브라우저 실행은 하지 않았다. 지시대로 16단계에서 한다. 스텁 HTML 을 로컬 http 서버로 띄우는 연기 테스트도 해 보려 했지만 권한 분류기가 막아서 하지 않았다.

## 결정
- R4 의 "한 줄" 은 `offsetTop` 이 모두 같은지가 아니라, 직계 자식들의 세로 구간이 한 점에서 겹치는지로 판정한다 (`max(top) < min(bottom)`). 이유: `items-center` 행에서 높이가 다른 자식(44px 버튼과 20px 글자)은 한 줄이어도 `offsetTop` 이 다르다. `offsetTops` 값은 report 에 함께 남긴다. 자식이 하나뿐인 감싸개(`max-w-* mx-auto flex`)는 안으로 내려가서 판정한다.
- R6 의 기준은 서브픽셀 반올림 때문에 0.5px 를 허용한다 (43.5 이상이면 통과).
- 기사·브리핑·레이더 데이터가 없어서 잴 수 없는 항목(R5, 뉴스 상세, 일일 브리핑, 카드 진입점, 브리핑·트렌드 버튼)은 `skipped` 에 넣고 실패로 치지 않는다. spec 4.1 에 따라 데이터가 없으면 그리지 않는 요소들이고, plan '위험' 의 ui-audit 전제와도 맞다. verify 단계에서 `skipped` 는 미검증으로 본다.
- spec 이 접근 이름을 정하지 않은 요소(데스크톱 챗 사이드바 접기 버튼, 챗 헤더 모델 칩)는 R9 대상에서 뺐다. 챗 커맨드 팔레트 버튼은 이름이 정해지지 않아 `/커맨드 팔레트/` 로 찾는다.
- 대화상자를 하나 잴 때마다 Escape 로 닫고, 닫히지 않거나 열기에 실패하면 페이지를 다시 불러온다.

## 막힌 점
- 없음. 실행 중인 앱이 없어 실측은 16단계로 넘긴다.

## 다음
- 16단계: `make docker-up` 뒤 `cd frontend && CHROME_PATH=... node scripts/ui-audit.mjs` 를 실행한다. 진입점 이름이 09~14 구현과 다르면, 스크립트를 고치기 전에 spec 이름과 대조한다.
