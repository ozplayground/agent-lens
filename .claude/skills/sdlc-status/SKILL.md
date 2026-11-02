---
name: sdlc-status
description: 기능별 현재 SDLC 스테이지, tasks 진행률, 다음 할 일을 보여준다. "지금 어느 단계야", "진행 상황", "sdlc 상태", "어디까지 했어".
allowed-tools: Bash(python3 ${CLAUDE_SKILL_DIR}/../../hooks/sdlc_hook.py status)
---

# sdlc-status — 스테이지 표와 다음 행동을 보여준다

현재 상태:

!`python3 ${CLAUDE_SKILL_DIR}/../../hooks/sdlc_hook.py status`

위 표의 기능마다 다음 행동 하나를 적는다. tasks 에 `doing` 이나 `blocked` 가 있으면 그 단계 파일(`tasks/<id>/`)의 '막힌 점' 과 '다음' 을 함께 보여준다.

| 상태 | 다음 행동 |
|---|---|
| Research (선택 스테이지) | 조사를 마치고 `/write-intent <id>` |
| Plan 검토 대기 | 제품 오너가 intent.md 승인 |
| Design 단계 | `/write-spec <id>` (기술 근거가 필요하면 먼저 `/research-tech <id>`) |
| Design 검토 대기 | 제품 오너(고위험이면 기술 리드)가 spec.md 승인 |
| Build 계획 작성 단계 | `/write-plan <id>` |
| Build 계획 검토 대기 | 엔지니어(고위험이면 기술 리드)가 plan.md 승인 |
| Build (plan 승인됨) | `/implement-plan <id>` (tasks 가 모두 done 이면 `/verify-change <id>`) |
| Test 검토 대기 | 코드 오너가 verify.md 승인 |
| Deploy 단계 | `/review-change` → `/prepare-release <버전> <id>` |
| Deploy 검토 대기 | 릴리스 관리자가 release.md 승인 후 원격 태그 push (RELEASE_APPROVAL) |
| 완료 (릴리스 승인됨) | 없음. 운영 신호는 `/triage-signal` |
