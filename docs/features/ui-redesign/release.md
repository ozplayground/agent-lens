# Release: 디자인시스템과 반응형 UI/UX 재설계

Verify: ./verify.md
Status: approved
Approved-by: 자동 승인 (Claude) (2026-11-09)
Version: 0.4.0
PR: main (`94fdf8e` 와 릴리스 커밋)

## 리뷰 (REVIEW.md)
- `Important: 0, Nit: 3` (v0.4.0 릴리스 전 리뷰 `316965b..4935dd9` 중 이 기능 몫) · 처리: 모두 수용, 후속 작업 후보.
  - `NEXT_PUBLIC_APP_VERSION` 이 `frontend/src/lib/env.ts` zod 스키마에 없다. ui-redesign plan 이 `env.ts` 를 '바꾸지 않는 것' 에 두어 REVIEW.md '설정' 항목과 어긋난다. `docs/tech-spec.md` '설정' 문장도 frontend 변수를 두 개만 적는다.
  - `useBookmarks` 저장값이 배열이 아니면(`"null"`, `"{}"`) 피드 렌더 중 TypeError (`frontend/src/hooks/useBookmarks.ts:47,70`).
  - 초기화 요청이 이미 진행 중이거나 구독 세대가 바뀌어 실제로 실행되지 않아도 확인 창이 성공처럼 닫힌다 (`frontend/src/hooks/useCollector.ts:230,235`, `frontend/src/components/ResetConfirmDialog.tsx:34-37`).
- 리뷰가 확인한 것: 계약(`backend/app/schemas/` 무변경, frontend 타입 좁히기만), plan 밖 `frontend/src/**` 변경 없음, ui-audit 산출물에 비밀값 없음.

## 통합·회귀 검증
- `make check` → 종료 0. `217 passed in 12.50s`, `Test Files  52 passed (52)`, `Tests  649 passed (649)`, eslint `0 errors, 41 warnings`, tsc 통과.
- `make docker-build`·`make docker-up` → 종료 0, 두 컨테이너 healthy. frontend `/api/health` → `{"status":"healthy","service":"agentlens-frontend","version":"0.4.0",…}`. `make docker-down` 종료 0.

## 버전 bump
- 바꾼 파일: `docs/features/make-targets/release.md` '버전 bump' 와 같다 (같은 릴리스 v0.4.0).
- 로컬 태그: `git tag -a v0.4.0 -m "Release v0.4.0: …"` → 릴리스 커밋에 만든다.

## 배포
- 원격 태그 push: `git push origin v0.4.0` (사용자가 지시하면 실행)
- 되돌리기: `git tag -d v0.4.0` · push 뒤라면 `git push origin :refs/tags/v0.4.0`

## 통합 문서 반영
- tech-spec.md: 반영됨 ('변경 이력' 2026-11-06~07 ui-redesign 행 6개, '기술 선택과 근거' 4행)
- test-strategy.md: 해당 없음 (검사 명령 그대로. frontend 테스트는 기존 vitest 안에서 늘었다)
