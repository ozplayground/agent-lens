# Release: {{제목}}

Verify: ./verify.md
Status: draft
Version: {{버전}}
PR: {{PR 링크 또는 브랜치}}

## 리뷰 (REVIEW.md)
- `Important: {{N}}, Nit: {{M}}` · 처리: {{고친 커밋 | 수용 사유}}

## 통합·회귀 검증
- `{{명령}}` → {{결과}}

## 버전 bump
- 바꾼 파일: {{docs/releases.md '버전 문자열 위치' 대조 결과}}
- 로컬 태그: `git tag -a v{{버전}} -m "..."` → {{결과}}

## 배포
- 원격 태그 push: `git push origin v{{버전}}` (RELEASE_APPROVAL 이 있는 세션에서 릴리스 관리자가 실행)
- 되돌리기: `git tag -d v{{버전}}` · push 뒤라면 `git push origin :refs/tags/v{{버전}}`

## 통합 문서 반영
- tech-spec.md: {{반영됨 | 누락 이유}}
- test-strategy.md: {{반영됨 | 해당 없음}}
