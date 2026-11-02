---
name: review-change
description: 현재 브랜치 변경을 REVIEW.md 기준으로 리뷰한다. Deploy 단계의 PR 리뷰. "리뷰해줘", "PR 리뷰", "머지 전에 봐줘".
context: fork
agent: reviewer
argument-hint: "[작업-id 또는 PR 번호]"
---

# review-change — 버그, 보안, 준수를 나눠 본다

1. 저장소 루트의 REVIEW.md 를 읽는다.
2. 기준 브랜치 대비 diff 를 본다: `git diff $(git merge-base HEAD origin/HEAD 2>/dev/null || echo HEAD~1)...HEAD`
3. 관련 기능의 `docs/features/<id>/spec.md`, `plan.md` 와 대조한다.
4. 버그 → 보안 → 준수 순서로 본다.
5. 결과를 Important / Nit 로 나눈다. Nit 는 최대 5개.
6. 마지막에 심각도 집계를 한 줄로 쓴다: `Important: N, Nit: M`

## 하지 않는 것
- 파일 수정
- 승인/차단 선언. 머지 승인은 코드 오너가 한다

결과는 호출한 쪽이 `/prepare-release` 에서 기능별 release.md 의 '리뷰' 절에 옮긴다.
