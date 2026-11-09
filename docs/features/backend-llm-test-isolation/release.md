# Release: backend LLM 호출 정상화와 실행 환경에 의존하지 않는 `make check`

Verify: ./verify.md
Status: approved
Approved-by: 자동 승인 (Claude) (2026-11-09)
Version: 0.4.0
PR: main (`94fdf8e` 와 릴리스 커밋)

## 리뷰 (REVIEW.md)
- `Important: 0, Nit: 0` (v0.4.0 릴리스 전 리뷰 `316965b..4935dd9` 중 이 기능 몫) · 처리: 없음.
- 리뷰가 확인한 것: spec R1~R5 를 코드와 대조 (해석 함수 4개, Ollama `/api/tags` 1회·1.0초 확인, `qwen2.5` 제거, `anthropic_provider.py` 무변경).

## 통합·회귀 검증
- `make check` → 종료 0. `217 passed in 12.50s`, `Test Files  52 passed (52)`, `Tests  649 passed (649)`. LLM 호출은 흉내로 답하고 실행 앞뒤 `git status --porcelain` 같음 (키·로컬 Ollama 상태와 무관).
- `make docker-up` 뒤 backend `/health` → `{"status":"healthy","version":"0.4.0","running":false}`.

## 버전 bump
- 바꾼 파일: `docs/features/make-targets/release.md` '버전 bump' 와 같다 (같은 릴리스 v0.4.0).
- 로컬 태그: `git tag -a v0.4.0 -m "Release v0.4.0: …"` → 릴리스 커밋에 만든다.

## 배포
- 원격 태그 push: `git push origin v0.4.0` (사용자가 지시하면 실행)
- 되돌리기: `git tag -d v0.4.0` · push 뒤라면 `git push origin :refs/tags/v0.4.0`

## 통합 문서 반영
- tech-spec.md: 반영됨 ('변경 이력' 2026-11-08 backend-llm-test-isolation 행)
- test-strategy.md: 반영됨 (pytest 의 LLM 흉내와 설정 파일 임시 사본)
