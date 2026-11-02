---
name: write-plan
description: 승인된 spec.md 로 구현 계획 plan.md 를 만든다. Build 단계의 시작. "계획 세워줘", "구현 계획", "plan 작성". spec 이 승인되지 않았으면 쓰지 않는다. 코드를 고치지 않는다.
argument-hint: "[기능-id]"
---

# write-plan — 승인된 계획 없이 구현하지 않는다

1. `docs/features/<id>/intent.md` 와 `spec.md` 를 읽는다. spec 의 Status 가 approved 가 아니면 멈춘다.
2. 코드베이스와 `docs/test-strategy.md` 를 읽고 바꿀 파일, 작업 순서, 증명할 테스트를 정한다. 넓은 탐색은 서브에이전트에 맡긴다.
3. 계획을 스스로 따져 본다: 무엇이 깨질 수 있나, 가장 위험한 단계는, 버린 대안은.
4. [템플릿](template.md) 대로 `plan.md` 를 쓴다.
   - '변경 파일' 의 각 줄에는 경로나 글롭을 백틱으로 적는다. 이 목록 밖의 게이트 경로는 hook 이 편집을 막는다.
   - '작업 순서' 의 단계 하나가 진행 기록 파일 하나가 된다. 한 세션이 한 번에 끝낼 수 있는 크기로 나누고, 마지막 단계는 통합 문서 반영이다.
   - `.claude/` 아래 설정 파일(hook 설정, settings.json)을 바꾸는 단계는 Claude Code 가 민감 파일로 보고 권한을 묻는다. 그 단계에 "사람 승인 필요" 를 적는다.
5. 대화를 본 적 없는 엔지니어가 plan.md 만으로 구현할 수 있을 때까지 고친다.
6. `Status: draft` 로 두고 승인 명령을 알린다:
   `! python3 "$(git rev-parse --show-toplevel)/.claude/hooks/sdlc_hook.py" approve docs/features/<id>/plan.md`

## 병렬 작업 나누기
- 서로 다른 파일을 건드리는 작업만 병렬로 나눈다. 같은 파일을 건드리면 한 세션에서 순서대로 한다.
- 나눈 작업마다 '작업 순서' 에 담당 세션 또는 팀원 이름을 적는다.
