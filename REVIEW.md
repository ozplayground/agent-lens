# REVIEW.md

PR 리뷰 기준. 리뷰는 세 번 나눠 본다.

## 1. 버그
정확성, 경계값, 동시성, 오류 처리.

## 2. 보안
입력 검증, 인증/인가, 비밀 정보 노출, 의존성.

## 3. 준수
- 변경이 `docs/features/<기능>/spec.md` 와 `plan.md` 를 따르는가
- 시스템 구조나 인터페이스가 바뀌었으면 `docs/tech-spec.md` 도 같은 PR 에서 고쳤는가
- plan.md 의 '변경 파일' 밖을 고쳤으면 plan.md 도 같은 커밋에서 고쳤는가
- 계약: `backend/app/schemas/` 를 바꿨으면 `frontend/src/types/` 의 zod 스키마, `frontend/src/mocks/` 의 핸들러·fixture, `frontend/src/tests/chat/ContractAndMsw.test.ts` 를 같은 PR 에서 맞췄는가 (`.claude/rules/contracts.md`)
- 설정: 새 backend 설정은 `backend/app/config.py`(pydantic-settings)와 `.env.example`·`backend/.env.example` 에, 새 프론트 환경변수는 `frontend/src/lib/env.ts` 의 zod 스키마에 함께 추가했는가
- 버전: 버전을 바꿨으면 `docs/releases.md` 의 '버전 문자열 위치' 를 모두 같은 값으로 바꿨는가

## 심각도
- Important: 머지 전에 고쳐야 한다
- Nit: 고치면 좋다. 한 리뷰에 최대 5개

## 보지 않는 것
- 생성된 코드: 코드 생성 도구는 없다. lockfile `frontend/pnpm-lock.yaml` 은 보지 않는다
- CI 가 이미 강제하는 것: CI 는 없다. `make check`(pytest, vitest, eslint, `tsc --noEmit`)가 잡는 린트·타입 오류는 다시 지적하지 않는다

리뷰 결과는 승인이나 차단을 대신하지 않는다. 머지 승인은 코드 오너가 한다.
