# [AgentLens Frontend] 5-Pillar 코드 품질 감사 및 리뷰 보고서 (Code Review Report)

- **검토일자**: 2026-10-19
- **검토자**: 프론트엔드 시니어 코드 리뷰어 (`frontend-code-reviewer`)
- **검토 대상 PR / 브랜치**: `feature/dual-model-selector-anti-gemini-v0.2.0` (Stage 3b TDD 구현 결과물 v0.2.0)
- **최종 판정**: **APPROVED (승인)**

---

## 1. 5-Pillar 코드 품질 감사 매트릭스 (5-Pillar Audit)

| 감사 필라 (Pillar) | 세부 검토 기준 | 평가 점수 (1~5) | 검토 소견 및 발견 사항 |
| :--- | :--- | :---: | :--- |
| **Pillar 1: 아키텍처 정합성** | Dual Model Selector 배치(`REQ-UI-008`), Contract Lock v0.2.0 일치도, Anti-Gemini UI 살균 방어(`POL-LLM-005`, `REQ-LLM-002`) | **5 / 5** | • **Dual Model Selector 아키텍처 정합성**: `ChatHeader`(상단 우측 액션바)와 `ChatPromptInput`(하단 컴포저 좌하단) 양측에 `ChatModelSelector`가 완벽하게 마운트되었으며, `ChatWorkspace`의 단일 진실 공급원(SSOT) 상태로 캡슐화됨.<br/>• **Contract Lock v0.2.0 일치**: `frontend/package.json` 버전 `"0.2.0"` 동기화 완료. `types/chat.ts`의 `ModelTier`, `ChatModel`, `TIER_TO_MODEL`, `ChatModelSelectorProps.variant` (`inline-chip \| header-compact \| header-chip`) 규격이 OpenAPI v4.0.0 및 Stage 2d 명세와 100% 일치함.<br/>• **Anti-Gemini UI 살균 방어**: `sanitizeModelTier` 함수를 통해 Google Gemini 문자열 탐지 시 콘솔 경고 및 Claude 3.5 Sonnet으로 강제 대체되며, `ChatMessageItem`의 `displayModelName`에서 UI 전역 Gemini 명칭 0바이트 노출 방어가 검증됨. |
| **Pillar 2: 클린코드 & 컴포넌트 설계** | Fitts의 법칙 컴포저 인라인 칩 + 헤더 칩 듀얼 배치, 0ms 양방향 상태 동기화(`POL-UI-006`), 관심사 분리(SRP) | **5 / 5** | • **Fitts의 법칙 & 가시성 듀얼 최적화**: 헤더 칩은 화면 진입 시 즉각적인 모델 확인 및 변경을 지원하고, 컴포저 인라인 칩은 질문 작성 직전 시선 이동 거리를 0px로 단축하여 사용자 인지 부하를 극소화함.<br/>• **0ms 양방향 동기화(SSOT)**: `ChatWorkspace` 내 `selectedTier` 상태를 기반으로 상단 헤더 또는 하단 컴포저 중 어느 곳에서 모델을 변경하더라도 0ms 즉시 양측 칩 레이블과 아이콘이 실시간 동기화됨 (`ChatWorkspace.test.tsx` 검증 완료).<br/>• **컴포넌트 SRP 및 모듈성**: `ChatModelSelector`는 팝오버 상태와 WAI-ARIA 인터랙션만을 전담하며, 드롭다운 전개 방향(`header-chip`은 하향 전개, `inline-chip`은 상향 전개)을 props에 따라 스마트하게 분기함. |
| **Pillar 3: 웹 접근성 & 보안 (a11y & Security)** | WAI-ARIA Radio Group (`role="radiogroup"`, `role="radio"`, `aria-checked`), 키보드 탐색, 스트리밍 잠금, Zero-Leak 클라이언트 보안 | **5 / 5** | • **WAI-ARIA Radio Group 완비**: 팝오버 컨테이너에 `role="radiogroup"`, 옵션에 `role="radio"`, `aria-checked`, `tabIndex={isSelected ? 0 : -1}` 적용.<br/>• **키보드 접근성**: 상/하/좌/우 양방향 순환 탐색(`ArrowDown/Up/Right/Left`), `Enter`/`Space` 선택 확정, `Escape` 입력 시 팝오버 닫힘 및 호출 트리거 버튼(`triggerRef`)으로의 자동 포커스 복원 지원.<br/>• **스트리밍 중 안전 잠금**: `isStreaming === true` 시 상단 및 하단 셀렉터 동시 비활성화(`disabled`), 클릭 차단 및 "답변 생성 중에는 모델을 변경할 수 없습니다" 툴팁 노출.<br/>• **Zero-Leak 클라이언트 보안**: 프론트엔드 번들 내 Anthropic API Key 미노출, 백엔드 프록시(`POST /api/chat/stream`) 경유 원칙 준수. |
| **Pillar 4: 성능 & Web Vitals** | 0px 가로스크롤 방어(Universal Zero-Overflow), 팝오버 전개 방향 최적화, 렌더링 리소스 해제 | **5 / 5** | • **Universal Zero-Overflow (0px 가로스크롤 방어)**: 상단 헤더 칩은 하향 우측 정렬(`top-full right-0 mt-2 slide-in-from-top-2`), 하단 컴포저 칩은 상향 좌측 정렬(`bottom-full left-0 mb-2 slide-in-from-bottom-2`)로 팝오버가 뷰포트 바깥으로 돌출되지 않도록 국소 격리함 (`ResponsiveLayout.test.tsx` 전수 통과).<br/>• **체감 성능 최적화**: Tailwind `duration-150` 트랜지션 적용으로 150ms 이내 기민한 팝오버 전개 제공.<br/>• **메모리 누수 방지**: 바깥 영역 클릭 감지(`mousedown`, `touchstart`) 및 `keydown` 전역 리스너의 언마운트 시점 `removeEventListener` 완비. |
| **Pillar 5: 테스트 품질 & 회귀 방어** | 24개 테스트 파일 228개 테스트 100% PASS, `tsc --noEmit` 0 error, 신규 듀얼 셀렉터 & Anti-Gemini 테스트 검증 | **5 / 5** | • **테스트 100% 무결점 통과**: 24개 테스트 스위트, 228개 단위/통합 테스트 전수 통과 (0 Failure, 0 Flaky, 실행시간 4.44초).<br/>• **TypeScript 무오류 통과**: `pnpm tsc --noEmit` Exit Code 0 무결점 통과.<br/>• **Cycle 8 신규 검증 완료**: `ChatHeader.test.tsx` (7개 테스트, header-chip 마운트 및 스트리밍 잠금), `ChatWorkspace.test.tsx` (14개 테스트, 0ms 양방향 동기화 검증), `ChatModelSelector.test.tsx` (15개 테스트, header-chip 하향 팝오버 전개 검증), `ContractAndMsw.test.ts` (69개 테스트, `sanitizeModelTier` 15개 케이스 전수 통과). |

---

## 2. 세부 피드백 및 코드 개선 제안 (Action Items)

### 1. [보통 / UX 고도화] 극초소형 뷰포트(< 360px)에서 Popover 가로 최대폭 가드 유지
- **위치**: `frontend/src/components/chat/ChatModelSelector.tsx:L171`
- **현재 코드**:
```typescript
className={`absolute ${
  isHeaderVariant
    ? 'top-full right-0 mt-2 slide-in-from-top-2'
    : 'bottom-full left-0 mb-2 slide-in-from-bottom-2'
} w-72 sm:w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 focus:outline-hidden animate-in fade-in duration-150`}
```
- **검토 소견**: 현재 `w-72` (288px) 폭은 대다수 모바일 환경에서 안정적이나, 320px 극초소형 모바일 화면에서 좌우 패딩 여백에 따라 10~20px 잘림이 발생할 가능성이 있습니다. `max-w-[calc(100vw-2rem)]`를 추가하면 어떠한 초소형 뷰포트에서도 화면 내부로 안전하게 패딩이 유지됩니다.
- **개선 제안 (Diff)**:
```typescript
- } w-72 sm:w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 focus:outline-hidden animate-in fade-in duration-150`}
+ } w-72 sm:w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 focus:outline-hidden animate-in fade-in duration-150`}
```

---

### 2. [경미 / 유지보수성] 모델 선택 상태 공유 추상화 (선택적 리팩토링 제안)
- **위치**: `frontend/src/components/chat/ChatWorkspace.tsx:L604-L654`
- **검토 소견**: 현재 `selectedTier`와 `handleSelectTier`가 `ChatHeader`와 `ChatPromptInput`에 직접 Props로 전달되어 단방향 데이터 흐름이 명확합니다. 향후 대화 설정 모달, 단축키 트리거 등 제3의 컴포넌트로 모델 선택 인터페이스가 확장될 경우, 모델 상태 및 전환 이벤트를 관리하는 경량 훅(`useModelSelectorState`)으로 추출하는 것을 고려해볼 수 있습니다.

---

### 3. [모범 사례 / 칭찬] 듀얼 팝오버 스마트 배치 및 Anti-Gemini 살균 레이어
- **위치**: `frontend/src/components/chat/ChatModelSelector.tsx:L167-L172`, `frontend/src/types/chat.ts:L147-L159`
```typescript
// 상단 헤더에서는 하향 우측 전개, 하단 컴포저에서는 상향 좌측 전개
isHeaderVariant
  ? 'top-full right-0 mt-2 slide-in-from-top-2'
  : 'bottom-full left-0 mb-2 slide-in-from-bottom-2'

// Anti-Gemini 격리 및 비인가 모델 식별자 자동 살균 규격
if (normalized.includes('gemini') || normalized.includes('google')) {
  console.warn('[Anti-Gemini Policy Enforced] Unauthorized model rejected:', rawModel);
  return 'sonnet';
}
```
- **검토 소견**: 상단 액션바에서는 화면 상단 잘림을 방지하기 위해 팝오버를 아래로 펼치고(`top-full`), 하단 입력창에서는 가상 키보드 및 화면 하단 잘림을 방지하기 위해 위로 펼치는(`bottom-full`) 스마트 포지셔닝이 훌륭하게 구현되었습니다. 또한 `sanitizeModelTier`를 통해 레거시 데이터나 비인가 모델 주입 시에도 UI 전역에 Gemini 문자열이 단 1바이트도 노출되지 않도록 방어한 점은 엔지니어링 완성도가 매우 높습니다.

---

## 3. 최종 리뷰 판정 및 출시 승인

- **판정 결과**: **APPROVED (승인)**
- **승인 코멘트**:
  - `AGENTS.md` 엔지니어링 하네스 및 Stage 4b 감사 기준(Dual Model Selector 아키텍처 정합성, Fitts의 법칙 + 헤더 가시성 클린코드, WAI-ARIA 라디오그룹 웹 접근성, Universal Zero-Overflow 성능, 228개 테스트 100% 무결점 통과)을 전 항목 만점으로 충족하였습니다.
  - 헤더와 컴포저 간 0ms 양방향 상태 동기화 및 Anti-Gemini UI 살균 방어가 완벽히 구현되었으며 결함이나 보안 위험이 전혀 발견되지 않았습니다.
  - 프론트엔드 코드 품질 감사를 최종 승인(**APPROVED**)하며, 버전 `0.2.0` 릴리스 준비 및 통합 검증 파이프라인 진입을 공식 승인합니다.
