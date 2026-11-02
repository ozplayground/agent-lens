---
name: prepare-release
description: 릴리스를 준비한다. 기능별 release.md 와 릴리스 이력을 쓰고, 버전을 올리고 로컬 태그를 만든 뒤 원격 태그 push 직전까지만 진행한다. 프로덕션 배포는 없다.
disable-model-invocation: true
argument-hint: "[버전] [기능-id ...]"
---

# prepare-release — 원격 태그 push 앞에서 멈춘다

이 프로젝트의 릴리스는 버전 bump, 주석 태그 `v<버전>`, `docs/releases.md` 기록이다. 프로덕션 배포는 없다. 원격 태그 push 가 프로덕션 반영이고 hook 이 막는다.

1. 포함할 기능마다 `docs/features/<id>/verify.md` 가 approved 인지 확인한다. 아니면 그 기능을 빼고 이유를 적는다.
2. `docs/test-strategy.md` 의 '릴리스 전 통합·회귀 검증' 을 실행하고 출력을 기록한다. 실패하면 멈춘다.
3. 기능마다 [템플릿](template.md) 대로 `docs/features/<id>/release.md` 를 쓴다. 리뷰 결과(`/review-change` 의 Important/Nit 집계와 처리)를 옮긴다.
4. 통합 문서가 반영됐는지 확인한다: tech-spec.md 의 '변경 이력' 에 기능 행이 있는가. 없으면 release.md 의 '통합 문서 반영' 에 적는다.
5. 버전을 올린다. `docs/releases.md` 의 '버전 문자열 위치' 표의 파일을 모두 새 버전으로 바꾸고, `git grep -n '<이전 버전>'` 으로 남은 곳이 없는지 확인한다 (lockfile 제외). 표에 없는 곳이 나오면 표에 추가한다.
   - `backend/app/config.py`, `frontend/src/app/api/health/route.ts` 는 게이트 경로다. 포함 기능의 승인된 plan.md '변경 파일' 에 없으면 hook 이 막는다. 그때는 멈추고 plan.md 에 넣어 재승인받으라고 알린다.
6. `docs/releases.md` 맨 위 '이력' 표에 이번 릴리스를 추가한다. 버전 bump 와 문서를 커밋한 뒤 로컬 주석 태그를 만든다: `git tag -a v<버전> -m "Release v<버전>: <요약>"`
7. 원격 태그 push 는 hook 이 막는다. 릴리스 관리자에게 넘길 내용을 한 블록으로 정리한다: 버전, 변경 요약, 검증 결과, push 명령(`git push origin v<버전>`), 되돌리기(`git tag -d v<버전>`, push 뒤라면 `git push origin :refs/tags/v<버전>`), 승인 명령:
   `! python3 "$(git rev-parse --show-toplevel)/.claude/hooks/sdlc_hook.py" approve docs/features/<id>/release.md`
