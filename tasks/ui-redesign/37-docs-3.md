# Task 37: 통합·상세 문서 반영 (리뷰 후속)

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 37 (리뷰 후속)
Status: done
Session: main
Agent: a4fa594a1ed6d196a (문서 작성 서브에이전트, 메인이 검토)
Updated: 2026-11-06

## 한 일
- 문서 작성 서브에이전트에 맡기고 메인이 검토했다: design-system(Badge shrink, ChipGroup selectedSelector, ScrollRow 양쪽 표시·자리·scroll-px-6·선택 칩 보이기·포커스 유지, ToastRegion 한 번만 알림, useCollector 오래된 응답, 검사 방법), ui-spec, functional-spec 01·07, test-cases(50 파일 589 테스트), test-strategy, tech-spec 변경 이력, known-issues.

## 바꾼 파일
- docs/design-system.md, docs/ui-spec.md, docs/functional-spec/01-news-feed.md, docs/functional-spec/07-ui-common.md, docs/test-cases.md, docs/test-strategy.md, docs/tech-spec.md, docs/known-issues.md

## 검사 결과
- plan 37 끝 기준 grep 두 개 → 출력 없음 (옛 서술 7줄 모두 바뀜).
- 8개 문서에 `우려|보정|docs/features|tasks/|/write-|/implement-plan|승인` 0건. 남은 R3(report.json 키), test-cases 의 테스트 이름 인용 2건은 예외.
- test-cases 수 = `pnpm test` 실제 값 (50 파일, 589 테스트).

## 결정
- plan 범위 밖: `docs/known-issues.md` 는 plan 리뷰 후속 '변경 파일' 문서 목록 밖이다 (hook 게이트 대상은 아님). 첫 화면 Must-Read 미노출(spec 우려 23)을 남은 문제로 기록하려고 메인 판단으로 행을 더했다. verifier 확인 대상.
- 문서는 코드 기준: 진행 폴링 실패 때는 상태를 다시 읽지 않음(UI-02), clip ① 스크롤바 판정 변경, fixture 8짝 모두 기재, 낡은 줄 번호 정정.
- 코드 주석 `FeedToolbar.tsx:162` 가 낡음 → 34 후속 2 로 implementer E 에 맡김.

## 막힌 점
## 다음
- verify-change (verifier): 리뷰 후속 증명 항목과 Chrome 키보드 확인 6항목.

## 후속 2 (보정 5, 2026-11-07)
- Agent: a80f2bf195e1f3a7d (문서 작성 서브에이전트, 메인이 검토)
- 한 일: Must-Read 고정 토글(정렬 옆, 768 미만 별 아이콘 44×44, Tab 순서 소스 → Must-Read → 정렬), 사용자 스크롤 = 입력 신호 뒤 scroll, ui-audit `toolbar.mustReadVisible`·clip ① 768 이상 면제를 문서에 반영. known-issues 'UI·접근성' 의 360·390 Must-Read 행 삭제(해결).
- 바꾼 파일: docs/known-issues.md, docs/ui-spec.md, docs/functional-spec/01-news-feed.md, docs/functional-spec/07-ui-common.md, docs/design-system.md, docs/test-cases.md(50 파일 597 테스트), docs/test-strategy.md
- 검사 결과: plan 보정 5 끝 기준 grep 14줄 → 0줄. known-issues 'UI·접근성' 의 Must-Read 0건. docs 의 `sourceRow` 0건. 금지 표현은 report.json 키 R3 과 테스트 이름 인용(R34)뿐.
- 결정: tech-spec 은 고치지 않음 (리뷰 후속 변경 이력 행이 이미 있고 37 후속 2 목록 밖). 낡은 FeedToolbar 줄 번호를 지금 코드에 맞춤. 07 알려진 위험에 '사용자 스크롤 판정이 근거 없는 시간 값(150ms·1,000ms)에 기댐' 추가.

## 후속 3 (보정 6, 2026-11-07)
- Agent: a546dba86ad1665b9 (문서 작성 서브에이전트, 메인이 검토)
- 한 일: 사용자 스크롤 입력 신호에서 `wheel` 을 가로 의도(`Math.abs(deltaX) > Math.abs(deltaY) || shiftKey`)로 한정하고 세로 휠은 신호가 아님을 반영. clip ① 768 이상 면제는 design-system 이 이미 맞아 그대로.
- 바꾼 파일: docs/design-system.md(5.1 ScrollRow), docs/functional-spec/07-ui-common.md(사용자 스크롤 정의, 273행 '가로 휠'), docs/test-cases.md(599 테스트, vitest list 536, ChipGroup 42, 가로 휠 행, 새 ⑤⑥ 행, UI 공통 범위)
- 검사 결과: 옛 '`pointerdown`·`wheel`·' 표기 0건, 금지 표현 0건 (새 줄 기준).
