---
name: verify-change
description: 구현 결과를 사람이 보기 전에 검증하고 기능별 verify.md 로 남긴다. Test 단계. "검증해줘", "테스트 돌려", "완료 전에 확인". 판정은 verifier 서브에이전트가 고치지 않고 보고만 한다.
argument-hint: "[기능-id]"
---

# verify-change — 코드를 고치고, 테스트를 고치지 않는다

1. `docs/test-strategy.md` 의 통과 기준과 고위험 영역 추가 검사를 확인한다.
2. `make check` 를 실행하고 출력을 그대로 기록한다.
3. 실패하면 코드를 고치고 다시 돌린다. 테스트를 약하게 만들지 않는다.
4. 통과하면 `verifier` 서브에이전트를 부른다. 넘길 것: 기능 id, plan.md 경로, 변경된 파일 목록, 적용할 추가 검사. 돌려받을 것: plan.md 의 '증명' 항목별 통과/실패와 근거.
5. verifier 가 실패를 보고하면 3 으로 돌아간다.
6. UI 작업이면 목업과 스크린샷을 2~3회 비교한다.
7. [템플릿](template.md) 대로 `docs/features/<id>/verify.md` 를 쓴다. 검사 출력과 verifier 판정을 바꾸지 않고 옮긴다.
8. `Status: draft` 로 두고 코드 오너에게 승인 명령을 알린다:
   `! python3 "$(git rev-parse --show-toplevel)/.claude/hooks/sdlc_hook.py" approve docs/features/<id>/verify.md`

## 완료 판정
- '증명' 의 모든 항목에 실행 출력 근거가 있다
