---
name: triage-signal
description: 알림, 장애, 실패한 빌드, 보안 발견을 진단해 새 intent.md 로 만든다. Maintain 단계. "장애 분석", "이 알림 봐줘", "빌드 실패 원인", "운영 이슈 정리".
argument-hint: "[알림/장애/빌드 ID]"
---

# triage-signal — 진단 결과는 intent.md 로 다시 루프에 넣는다

1. 읽기 전용으로 진단한다: 로그, 지표, 최근 배포, 관련 커밋.
2. 작은 수정이 확실하면 수정안을 PR 로 제안한다. 그 외는 `docs/features/<새 기능-id>/intent.md` 를 쓴다.
3. intent.md 의 Source 에 알림/장애 ID 를, '문제' 에 증거를 적는다.
4. 담당자(서비스 오너/온콜)에게 선택지를 알린다: 지금 고침, 일정 잡음, 기각(사유).
5. 수정이 배포되면 같은 문제를 잡는 회귀 테스트나 eval 을 추가하도록 plan.md '증명' 에 넣는다.
