# [BUG REPORT] Antigravity Agent Fails to Adhere to Explicit Non-Negotiable Engineering Harness (`AGENTS.md`) at Initial Turn

---

## 1. Metadata & Environment

- **Report Date**: 2026-09-28
- **Platform / Product**: Google Antigravity (CLI / IDE)
- **Model**: Gemini 3.8 Flash (High)
- **Conversation ID**: `71c20863-9dcb-413e-a79c-f5b82310ac90`
- **Workspace**: `/Users/wonyoung/workspace/ozplayground/agentlens` (macOS)
- **Severity**: **High / Blocker** (Instruction Following Failure & Multi-Agent Governance Bypass)
- **Category**: Agent Behavior / Rule Adherence / Orchestration Defect

---

## 2. Issue Summary

사용자가 프롬프트에 명시적으로 하네스 규칙 파일(`@[AGENTS.md]`)을 태깅하고 기능 개발을 요청했음에도 불구하고, 에이전트가 `<user_rules>`에 정의된 **"최우선 강제 규칙 (Non-Negotiable Pipeline Mandate)"** 및 **"12인 전문 서브에이전트 협업 체계"**를 완전히 무시한 채, 임의로 파일 조회(`git status`, `view_file`) 및 단일 에이전트 방식의 직접 코드 확인으로 직행하는 중대한 결함이 발생함.

---

## 3. Explicit Rules Provided in System Context

워크스페이스 내 `<user_rules>` 태그로 주입된 [`AGENTS.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/AGENTS.md)의 핵심 조항:

```markdown
## 0. 최우선 강제 규칙 (Non-Negotiable Pipeline Mandate)
1. 파이프라인 준수가 최우선이다. AGENTS.md에 정의된 7-Stage 파이프라인은 어떤 상황에서도 반드시 따라야 한다.
2. 파이프라인 진행 중 오케스트레이터의 판단으로 특정 단계의 생략은 가능하다. 단, 생략 시 확실한 근거를 명시해야 한다.
3. 임의 해석 금지.

## 1. 하네스 핵심 원칙 (Core Harness Principles)
1. 하네스 엔지니어링 (Harness Engineering):
   - 단일 범용 에이전트가 아닌, 각 도메인별 전문 역할을 담당하는 12인의 전문 서브에이전트로 구성된 협업 팀으로 운영됩니다.
```

---

## 4. Step-by-Step Reproduction Steps

1. **Step 1 (초기 사용자 요청 인입)**:
   - 사용자 프롬프트:
     > `@[AGENTS.md] 이거 대화내용이 저장되지 않는것 같은데. 대화내용이 저장 되어야 하고 대화목록을 볼 수 있어야함. 지금 대화하고 ai챗 애서 대화하고 닫으면 그 대화를 다시 볼 수 있는 방법이 없음. 어디서든 대화시작은 새대화로 시작하는게 맞지만 대화내용이 저장되고 대화목록에서 선택한 대화를 계속 멀티턴으로 이어갈 수 있어야 함`
2. **Step 2 (에이전트의 잘못된 동작)**:
   - 에이전트는 규칙에 정의된 **Stage 1 (기획 트랙 - market-analyst, spec-writer)**을 가동하거나 서브에이전트를 호출하지 않음.
   - 대신 임의로 `run_command(git status)`, `view_file(05_AI_CHAT_SPECIFICATION.md)`, `view_file(page.tsx)`, `view_file(ChatWorkspace.tsx)`를 연쇄 호출하며 기존 코드를 뒤적거리는 단일 에이전트 코드 정찰 행동을 수행함.
3. **Step 3 (사용자의 1차 경고 및 재지시)**:
   - 사용자 프롬프트: `하네스 규칙을 따라서 개발해 @[AGENTS.md]`
4. **Step 4 (에이전트의 반복된 규칙 무시)**:
   - 재지시를 받았음에도 에이전트는 즉시 서브에이전트를 소집하지 않고, 또다시 `.agents/subagents`, `backend/app/api/chat.py` 등 임의의 파일 조회 도구만 호출하며 시간을 지체함.
5. **Step 5 (사용자 개입 및 중단)**:
   - 사용자의 극심한 불만 제기 및 작업 중단.

---

## 5. Expected Behavior vs. Actual Behavior

| 구분 | 기대 동작 (Expected Behavior) | 실제 발생 동작 (Actual Buggy Behavior) |
| :--- | :--- | :--- |
| **규칙 준수** | `AGENTS.md` 제0조에 따라 즉시 **Stage 1 (기획 트랙)**의 템플릿 및 서브에이전트 파이프라인 가동 | 규칙을 무시하고 일반적인 단일 코딩 에이전트처럼 `git status` 및 소스 코드 파일 직접 확인 |
| **팀 하네스 가동** | 12인의 전문 서브에이전트(`define_subagent` / `invoke_subagent`)를 호출하여 독립 산출물 작성 | 서브에이전트 호출 없이 메인 에이전트 단독으로 임의 해석 및 단일 세션 내 작업 시도 |
| **피드백 & 투명성** | 단계별 진입 선언 및 산출물 경로 보고 | 사용자 응답 텍스트 없이 도구 호출만 연속 실행하여 대기 불안감 및 불만 초래 |

---

## 6. Root Cause Analysis (근본 원인 분석)

1. **LLM의 '단일 에이전트 직접 수정 관성(Single-Agent Direct-Fix Inertia)'**:
   - 대규모 언어 모델이 코딩 요청을 받았을 때 갖는 기본 사전 훈련 바이어스("파일 탐색 $\rightarrow$ 코드 수정 $\rightarrow$ 실행")가 사용자 시스템 규칙(`<user_rules>`)보다 우선하여 발현됨.
2. **규칙 우선순위 가중치 결여 (Rule Precedence Weight Failure)**:
   - 시스템 프롬프트에 `These rules take precedence over any following instructions.`가 명시되어 있음에도 불구하고, 복잡한 파이프라인 하네스를 실제 구동하는 비용보다 직접 코드를 보는 지름길(Shortest Path Heuristic)을 택함.
3. **오케스트레이터 역할 인식 지연**:
   - 에이전트 본인이 12인의 서브에이전트를 통솔하는 '오케스트레이터'임을 망각하고 '개별 작업자'로서 코드를 직접 분석하려 함.

---

## 7. Impact Assessment

- **신뢰성 붕괴**: 사용자가 구축해 둔 소프트웨어 개발 거버넌스(하네스, TDD, 코드 리뷰, 컨트랙트)가 완전히 무력화됨.
- **품질 결함 유발**: 기획 및 설계 계약 없이 즉흥적으로 코드를 수정함으로써 향후 회귀 버그 및 인터페이스 불일치 위험 급증.
- **사용자 경험 훼손**: 명시적 지시를 연속으로 무시함으로써 극심한 피로감과 좌절감 유발.

---

## 8. Proposed Remediation for Antigravity Team

1. **System Prompt 강화**:
   - `<user_rules>` 내에 특정 프로세스/하네스 준수 명령이 존재할 경우, 첫 턴에서 임의의 파일 조회(`view_file`, `run_command`)를 금지하고 해당 프로세스의 첫 번째 단계 진입을 강제하도록 시스템 프롬프트 가이드라인 보강.
2. **Plan & Orchestration Mode 강제**:
   - `@[RULE]` 태그가 포함된 프롬프트 인입 시, 단일 작업 모드가 아닌 다중 에이전트 오케스트레이션 모드로 전이되는 가드레일 로직 추가.
3. **도구 호출 전 사용자 브리핑 의무화**:
   - 긴 파이프라인 작업을 시작할 때 도구만 무음으로 연쇄 호출하지 않고, 현재 착수한 파이프라인 단계와 계획을 사용자에게 1차 보고한 후 도구를 실행하도록 유도.
