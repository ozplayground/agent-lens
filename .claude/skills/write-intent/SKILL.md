---
name: write-intent
description: 새 작업의 의도를 기능별 intent.md 로 기록한다. 아이디어, 티켓, 장애/알림에서 새 작업을 시작할 때 쓴다. "새 기능 아이디어가 있어", "이 티켓 작업 시작하자", "intent 작성해줘".
argument-hint: "[기능-id] [아이디어 또는 티켓]"
---

# write-intent — 의도를 원작성자의 말로 한 번 기록한다

1. 기능 id 를 kebab-case 로 정한다. `$ARGUMENTS` 에 있으면 그것을 쓴다.
2. `docs/features/<id>/intent.md` 가 이미 있으면 새로 만들지 않고 그 파일을 고친다.
3. `docs/product.md` 를 읽는다. 이 작업이 제품 범위 밖이거나 원칙과 부딪히면 '제약' 이나 '열린 질문' 에 적는다.
4. 원작성자에게 분석가처럼 묻는다. 범위, 사용자, 제약, 성공 기준. 한 번에 질문 1~3개.
5. [템플릿](template.md) 의 절을 모두 채운다. 원작성자의 표현을 바꾸지 않는다.
   - 열린 질문 중 시장·경쟁 제품·사용자처럼 외부 사실로만 답할 수 있는 것이 있으면 `/research-product <id>` 를 실행하고, 결과의 '시사점' 을 열린 질문에 연결한다. 원작성자가 조사를 원하지 않으면 건너뛴다.
6. `Status: draft` 로 둔다. 승인 상태(accepted)로 바꾸지 않는다.
7. 끝나면 검토자(제품 오너)에게 할 일을 한 줄로 알린다:
   `! python3 "$(git rev-parse --show-toplevel)/.claude/hooks/sdlc_hook.py" approve docs/features/<id>/intent.md`

## 하지 않는 것
- 해결책 설계. 설계는 spec.md 에서 한다
- product.md 수정. intent 가 accepted 된 뒤 `/write-spec` 이 반영한다
- 코드 편집
