---
name: implement-plan
description: 승인된 plan.md 대로 구현하고, 단계마다 tasks 폴더에 진행 기록을 남긴다. 멈춘 작업을 이어서 할 때도 쓴다. "구현 시작", "plan 대로 만들어", "코딩 들어가자", "이어서 해". plan 이 승인되지 않았으면 쓰지 않는다.
argument-hint: "[기능-id] [단계 번호]"
---

# implement-plan — plan.md 를 따르고, 단계마다 진행 기록을 남긴다

## 시작
1. `docs/features/<id>/plan.md` 의 Status 가 approved 인지 확인한다.
2. `tasks/<id>/` 가 없으면 '작업 순서' 단계마다 [task.md](task.md) 로 `NN-<slug>.md` 를 만든다 (`Status: todo`). 있으면 읽는다.
3. 이 세션이 맡을 단계를 고른다: 인자로 받은 단계, 아니면 이 세션 담당 중 `doing` → `todo` 순서로 첫 단계. `done` 은 건너뛴다.

## 이어서 하기
- 고른 단계가 `doing` 이고 `Agent:` 에 서브에이전트 agent ID 가 있으면, 새 서브에이전트를 띄우지 않고 그 ID 로 `SendMessage` 를 보내 이어서 시킨다. 서브에이전트는 이전 대화 전체를 가진 채 멈춘 지점부터 계속한다.
- Claude Code 를 다시 시작했다면 먼저 `claude --resume <세션 이름>` 으로 같은 세션을 열어야 그 서브에이전트를 이어 부를 수 있다.

## 단계마다
1. 시작할 때 task 파일을 `Status: doing`, `Session`, `Agent`, `Updated` 로 고친다. 서브에이전트에 맡기면 넘기는 프롬프트에 task 파일 경로를 넣고, 띄우자마자 받은 agent ID 를 `Agent:` 에 적는다. implementer 는 `background: true` 라서 띄우는 즉시 ID 가 돌아온다.
2. 단계를 구현하고 `make check` 를 돌린다.
3. 끝나면 task 파일에 한 일, 바꾼 파일, 검사 결과(명령과 마지막 출력), 결정, 다음을 적고 `Status: done`.
4. 진행할 수 없으면 '막힌 점' 에 이유를 적고 `Status: blocked` 로 두고 멈춘다.

## 규칙
- 계획에 없는 파일을 고쳐야 하면 멈추고 plan.md 의 '변경 파일' 과 '작업 순서' 를 고친 뒤 재승인을 요청한다. task 파일은 `blocked`.
- 버그 수정이면 먼저 실패하는 테스트를 쓰고, 예상한 이유로 실패하는지 확인하고 커밋한 뒤 코드를 고친다. 테스트를 고쳐 통과시키지 않는다.
- 통합 문서 반영 단계: `docs/tech-spec.md` 를 spec 의 설계와 실제 구현대로 고치고 '변경 이력' 에 행을 추가한다. 검사 명령이나 테스트 종류가 바뀌었으면 `docs/test-strategy.md` 도 고친다.
- 모든 단계가 `done` 이면 `/verify-change <id>` 로 넘긴다.

## 완료 보고
- `make check` 의 실제 출력을 붙인다. 출력 없이 완료라고 하지 않는다.
