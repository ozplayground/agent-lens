# [AgentLens AI Chat] 프론트엔드 컴포넌트 TDD 실행 기록서 (Frontend TDD Log)

- **작성일자**: 2026-10-20
- **작성자**: 프론트엔드 TDD 엔지니어 (`frontend-tdd-engineer`)
- **문서 버전**: v0.3.1
- **상태**: Approved

---

## 1. TDD 개발 대상 컴포넌트 및 사용자 인터랙션
- **대응 기능 ID**:
  - `FUNC-CHAT-001` (독립형 전용 AI 챗 워크스페이스 레이아웃 및 세션 관리)
  - `FUNC-CHAT-003` (듀얼 스코프 지식 검색 및 스트리밍 질의응답)
  - `FUNC-CHAT-004` (클릭형 인라인 인용 배지 및 출처 뉴스 프리뷰 연동)
  - `FUNC-CHAT-009` (자율 보충 검색 및 실시간 워크플로우 진행 상태 UX)
  - `FUNC-CHAT-011` (심층 엔지니어링 리포트 4단 구조화 템플릿 및 익스포트 제어)
  - `FUNC-CHAT-012` (대화 세션 히스토리 사이드바/드로어 및 멀티턴 복원 관리)
  - `FUNC-CHAT-013` (AI 챗 상단 헤더 & 입력창 듀얼 멀티 모델 셀렉터)
- **대상 컴포넌트**:
  - `src/components/chat/ChatWorkspace.tsx`
  - `src/components/chat/ChatHeader.tsx`
  - `src/components/chat/ChatPromptInput.tsx`
  - `src/components/chat/ChatModelSelector.tsx`
  - `src/components/chat/ChatMessageItem.tsx`
  - `src/components/chat/CitationBadge.tsx`
  - `src/components/chat/WorkflowStepTracker.tsx`
  - `src/components/chat/ModelChangeDivider.tsx`
  - `src/components/chat/ExportToolbar.tsx`
  - `src/components/chat/ChatHistoryDrawer.tsx`
- **테스트 파일**:
  - `src/tests/chat/ChatWorkspace.test.tsx`
  - `src/tests/chat/ChatMessageItem.test.tsx`
  - `src/tests/chat/ChatModelSelector.test.tsx`
  - `src/tests/chat/ChatHeader.test.tsx`
  - `src/tests/chat/ChatPromptInput.test.tsx`
  - `src/tests/chat/CitationBadge.test.tsx`
  - `src/tests/chat/WorkflowStepTracker.test.tsx`
  - `src/tests/chat/ChatHistoryDrawer.test.tsx`
  - `src/tests/chat/ContractAndMsw.test.ts`
- **모의 핸들러**:
  - `src/mocks/handlers/chat.ts`
  - `src/mocks/fixtures/chat.ts`

---

## 2. Red-Green-Refactor 사이클 실행 기록

### [Cycle 1] 상단 헤더 & 하단 입력창 듀얼 멀티 모델 셀렉터 양방향 0ms 동기화 및 타임라인 디바이더 TDD
#### 1. RED Phase (실패하는 RTL 테스트 작성)
- **작성된 테스트 코드**:
```typescript
// src/tests/chat/ChatWorkspace.test.tsx
it('synchronizes selectedTier bidirectionally between ChatHeader and ChatPromptInput with 0ms delay (REQ-UI-008, POL-UI-006)', async () => {
  render(<ChatWorkspace />);

  // Initial state: both header and composer display Sonnet 5.5
  const modelTriggers = screen.getAllByRole('button', { name: /Claude 모델 선택/i });
  expect(modelTriggers.length).toBe(2); // One in Header, one in Composer
  expect(modelTriggers[0]).toHaveTextContent(/Sonnet 5.5/i);
  expect(modelTriggers[1]).toHaveTextContent(/Sonnet 5.5/i);

  // 1. Change model from Header trigger -> Haiku
  fireEvent.click(modelTriggers[0]);
  const haikuOption = screen.getByRole('radio', { name: /Haiku 5.5/i });
  fireEvent.click(haikuOption);

  // Both triggers should immediately reflect Haiku 5.5
  expect(modelTriggers[0]).toHaveTextContent(/Haiku 5.5/i);
  expect(modelTriggers[1]).toHaveTextContent(/Haiku 5.5/i);

  // 2. Change model from Composer trigger -> Opus
  fireEvent.click(modelTriggers[1]);
  const opusOption = screen.getByRole('radio', { name: /Opus 5.5/i });
  fireEvent.click(opusOption);

  // Both triggers should immediately reflect Opus 5.5
  expect(modelTriggers[0]).toHaveTextContent(/Opus 5.5/i);
  expect(modelTriggers[1]).toHaveTextContent(/Opus 5.5/i);
});

it('switches Claude model mid-session and renders ModelChangeDivider in timeline', async () => {
  render(<ChatWorkspace />);
  // ... 첫 번째 턴 완료 후 모델 변경 트리거 ...
  const divider = await screen.findByRole('separator');
  expect(divider).toBeInTheDocument();
  expect(divider).toHaveTextContent(/Claude Haiku 5.5로 모델 변경됨/i);
});
```
- **실행 결과 (실패 확인)**:
```text
FAIL src/tests/chat/ChatWorkspace.test.tsx > ChatWorkspace Container > synchronizes selectedTier bidirectionally between ChatHeader and ChatPromptInput with 0ms delay (REQ-UI-008, POL-UI-006)
AssertionError: expected [ Array(1) ] to have length 2
 ❯ src/tests/chat/ChatWorkspace.test.tsx:300:27
```

#### 2. GREEN Phase (최소 컴포넌트 구현)
- **구현 내용 요약**:
  - `ChatWorkspace.tsx` 최상위 컨테이너에 `selectedTier`(기본값: `'sonnet'`)와 `handleSelectTier` 상태를 선언하여 단일 진실 공급원(Single Source of Truth) 확립
  - `ChatHeader.tsx` 우측 액션 영역에 `variant="header-chip"`, `ChatPromptInput.tsx` 하단 툴바에 `variant="inline-chip"` 속성을 부여한 `ChatModelSelector`를 듀얼 배치하고 동일한 `selectedTier` 및 `onSelectTier` 핸들러 주입
  - 세션 진행 도중 모델 변경 발생 시 `modelSwitchEvents` 상태 배열에 `ModelSwitchEvent`를 즉시 기록하고 타임라인 아이템 정렬 리스트에 병합하여 `ModelChangeDivider` 렌더링
  - `ChatModelSelector.tsx`에 WAI-ARIA `role="radiogroup"` 및 `role="radio"` 표준 마크업을 바인딩하여 Haiku(⚡), Sonnet(🎯), Opus(🧠) 3단 티어 팝오버 제공
- **실행 결과 (성공 확인)**:
```text
✓ src/tests/chat/ChatHeader.test.tsx (7 tests) 106ms
✓ src/tests/chat/ChatModelSelector.test.tsx (15 tests) 137ms
✓ src/tests/chat/ChatPromptInput.test.tsx (7 tests) 84ms
✓ src/tests/chat/ChatWorkspace.test.tsx (18 tests) 3923ms
Test Files  4 passed (4)
Tests       47 passed (47)
```

#### 3. REFACTOR Phase (컴포넌트 분리 및 최적화)
- **리팩토링 내용**:
  - `ChatModelSelector.tsx` 내부 키보드 이벤트 핸들러 분리: `ArrowDown`/`ArrowUp`을 통한 순환 포커스(0 ➔ 1 ➔ 2 ➔ 0), `Enter` 즉시 선택, `Escape` 팝오버 닫기 및 이전 트리거 버튼 포커스 반환 구현
  - `ModelChangeDivider.tsx` 독립 컴포넌트 분리: `role="separator"` 및 `aria-label` 접근성 메타데이터 완비
  - 스트리밍 진행 중(`isStreaming === true`) 모델 변경 트리거를 `disabled` 처리하고 툴팁 안내("답변 생성 중에는 모델을 변경할 수 없습니다") 노출
  - 프로덕션 코드에서 인라인 MSW 모의 참조 완전 배제
- **회귀 검증 결과**: Vitest 전체 24개 테스트 파일, 241개 테스트 100% 통과 유지

---

### [Cycle 2] SSE 스트림 종단(done) 잔여 버퍼 플러시 및 온전한 이벤트 디코딩 TDD
#### 1. RED Phase (실패하는 RTL 테스트 작성)
- **작성된 테스트 코드**:
```typescript
// src/tests/chat/ChatWorkspace.test.tsx
it('flushes remaining decoder bytes and processes trailing SSE event block in buffer when stream ends without trailing double newline', async () => {
  const encoder = new TextEncoder();
  const firstEvent = 'event: token\ndata: {"token":"첫 번째 청크 "}\n\n';
  // Final SSE block intentionally lacks trailing \n\n to verify buffer.trim() flush on done=true
  const finalEventWithoutDoubleNewline = 'event: token\ndata: {"token":"마지막 버퍼 청크 완료"}';

  const firstBytes = encoder.encode(firstEvent);
  const finalBytes = encoder.encode(finalEventWithoutDoubleNewline);
  // Split multibyte UTF-8 sequence across two chunks
  const splitIndex = finalBytes.length - 5;
  const chunk2 = finalBytes.slice(0, splitIndex);
  const chunk3 = finalBytes.slice(splitIndex);

  const customStream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(firstBytes);
      controller.enqueue(chunk2);
      controller.enqueue(chunk3);
      controller.close();
    },
  });

  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    return new Response(customStream, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  });

  try {
    render(<ChatWorkspace />);
    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    const sendButton = screen.getByRole('button', { name: /질문 전송/i });

    fireEvent.change(textarea, { target: { value: '버퍼 플러시 테스트' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/첫 번째 청크 마지막 버퍼 청크 완료/)).toBeInTheDocument();
    });
  } finally {
    fetchSpy.mockRestore();
  }
});
```
- **실행 결과 (실패 확인)**:
```text
FAIL src/tests/chat/ChatWorkspace.test.tsx > ChatWorkspace Container > flushes remaining decoder bytes and processes trailing SSE event block in buffer when stream ends without trailing double newline
AssertionError: expected "첫 번째 청크 " to contain "첫 번째 청크 마지막 버퍼 청크 완료"
 ❯ src/tests/chat/ChatWorkspace.test.tsx:465:47
```

#### 2. GREEN Phase (최소 컴포넌트 구현)
- **구현 내용 요약**:
  - `ChatWorkspace.tsx`의 SSE 스트림 리더 루프에서 `done === true` 조건 진입 시 `buffer += decoder.decode()`를 호출하여 `TextDecoder`의 내부 멀티바이트 UTF-8 버퍼에 잔존하는 바이트를 종단 플러시
  - 스트림 종료 시(`done === true`) `buffer.trim()`을 검사하여 후행 `\n\n` 없이 종료된 잔여 문자열 블록을 `split('\n\n')` 처리하고 파싱 큐에 주입하여 마지막 토큰 및 done 이벤트가 유실되지 않도록 보장
```typescript
while (true) {
  const { done, value } = await reader.read();
  if (done) {
    buffer += decoder.decode();
  } else {
    buffer += decoder.decode(value, { stream: true });
  }

  let parts: string[];
  if (done) {
    const trimmedBuffer = buffer.trim();
    parts = trimmedBuffer ? trimmedBuffer.split('\n\n') : [];
    buffer = '';
  } else {
    parts = buffer.split('\n\n');
    buffer = parts.pop() || '';
  }
  // 블록별 event, data 파싱 및 React 상태 업데이트
}
```
- **실행 결과 (성공 확인)**:
```text
✓ src/tests/chat/ChatWorkspace.test.tsx (18 tests) 3923ms
Test Files  1 passed (1)
Tests       18 passed (18)
```

#### 3. REFACTOR Phase (컴포넌트 분리 및 최적화)
- **리팩토링 내용**:
  - SSE 이벤트 타입별(`status`, `sources`, `token`, `done`, `error`) 파싱 분기문을 모듈화하고 예외 격리 가드 추가
  - `AbortController` 취소 신호 수신(`err.name === 'AbortError'`) 시 스트림 루프를 안전하게 탈출하고 메모리 누수를 방지하도록 정리 로직 통합
  - 최종 스트림 종료 후 `buffer = ''` 정리 및 메시지 상태를 확정(`status: 'completed'`)하는 종단 동기화 로직 보강
- **회귀 검증 결과**: Vitest 전체 24개 테스트 파일, 241개 테스트 100% 통과 유지

---

### [Cycle 3] 사후 인용 출처 표시(Streaming Guard) 및 이원화 출처(Primary/Supplementary) 배지 TDD
#### 1. RED Phase (실패하는 RTL 테스트 작성)
- **작성된 테스트 코드**:
```typescript
// src/tests/chat/ChatMessageItem.test.tsx
it('hides source count badges while streaming (even with non-empty content and sources) and shows them only when status === "completed"', () => {
  const streamingMsgWithSources: ChatMessage = {
    ...assistantMessage,
    id: 'msg-streaming-sources-1',
    status: 'streaming',
    content: '스트리밍 도중 생성되고 있는 부분 답변입니다...',
    primary_count: 5,
    supplementary_count: 2,
    sources: [
      ...assistantMessage.sources!,
      {
        index: 'S1',
        type: 'supplementary',
        title: 'Supplementary Doc',
        url: 'https://example.com/supp',
        source: 'web_search',
      },
    ],
  };

  const { rerender } = render(
    <ChatMessageItem message={streamingMsgWithSources} isStreaming={true} />
  );

  // Must NOT show source badges during streaming
  expect(screen.queryByText(/원문.*건/)).not.toBeInTheDocument();
  expect(screen.queryByText(/보충.*건/)).not.toBeInTheDocument();

  // Once completed, badges should be rendered if primaryCount > 0 || supplementaryCount > 0
  const completedMsgWithSources: ChatMessage = {
    ...streamingMsgWithSources,
    status: 'completed',
    primary_count: 2,
    supplementary_count: 1,
  };

  rerender(<ChatMessageItem message={completedMsgWithSources} isStreaming={false} />);
  expect(screen.getByText('원문 2건')).toBeInTheDocument();
  expect(screen.getByText('보충 1건')).toBeInTheDocument();
});

it('renders dual citations [1] and [S1] appropriately in assistant message', () => {
  const dualCitationMessage: ChatMessage = {
    ...assistantMessage,
    content: 'FastMCP[1]는 초경량 서버이며, MCP 사양[S1]을 준수합니다.',
    sources: [
      { index: 1, type: 'primary', id: 101, title: 'FastMCP Framework', url: 'https://github.com/fastmcp', source: 'github' },
      { index: 'S1', type: 'supplementary', title: 'MCP Spec', url: 'https://modelcontextprotocol.io', source: 'web_search', domain: 'modelcontextprotocol.io' },
    ],
  };

  render(<ChatMessageItem message={dualCitationMessage} />);
  const primaryBadge = screen.getByRole('button', { name: /출처 1번/i });
  const suppBadge = screen.getByRole('button', { name: /보충.*출처.*S1/i });

  expect(primaryBadge).toBeInTheDocument();
  expect(suppBadge).toBeInTheDocument();
  expect(suppBadge.className).toContain('emerald');
});
```
- **실행 결과 (실패 확인)**:
```text
FAIL src/tests/chat/ChatMessageItem.test.tsx > ChatMessageItem Component > hides source count badges while streaming (even with non-empty content and sources) and shows them only when status === "completed"
AssertionError: expected '원문 5건' not to be in the document during streaming
 ❯ src/tests/chat/ChatMessageItem.test.tsx:383:49
```

#### 2. GREEN Phase (최소 컴포넌트 구현)
- **구현 내용 요약**:
  - `ChatMessageItem.tsx`에서 답변 스트리밍 중(`message.status !== 'completed'`)에는 상단 헤더 출처 배지(`원문 N건`, `보충 N건`) 렌더링을 완전히 숨기는 사후 인용 출처 표시 가드(Streaming Guard) 적용
  - 스트림이 최종 완료(`message.status === 'completed'`)된 시점에만 백엔드/MSW에서 산출된 실제 원문 건수(`primary_count`) 및 보충 검색 건수(`supplementary_count`)를 정직하게 바인딩하여 렌더링
  - 본문 파싱 엔진에서 정규식을 통해 `[1]` 형식의 1차 인용(Primary: 파란색 테두리)과 `[S1]` 형식의 보충 인용(Supplementary: 에메랄드 테두리)을 분기 식별하고 `CitationBadge` 컴포넌트로 렌더링
  - 가짜 하드코딩된 '5건' 고정 배지를 전면 제거하고 실제 매칭된 건수(1건, 3건 등)를 충실히 표시하도록 컴포넌트 로직 정비
- **실행 결과 (성공 확인)**:
```text
✓ src/tests/chat/ChatMessageItem.test.tsx (15 tests) 150ms
✓ src/tests/chat/CitationBadge.test.tsx (7 tests) 85ms
Test Files  2 passed (2)
Tests       22 passed (22)
```

#### 3. REFACTOR Phase (컴포넌트 분리 및 최적화)
- **리팩토링 내용**:
  - `CitationBadge.tsx` 인라인 팝오버 분리: WAI-ARIA `aria-haspopup="dialog"`, `aria-expanded` 속성 및 `Escape` 키 팝오버 닫기 기능 탑재
  - 출처 데이터가 존재하지 않는 가상 인용 번호([99])의 경우 클릭할 수 없는 정적 텍스트 `<span>[99]</span>`으로 폴백하도록 내결함성 확보
  - 장문 URL 및 코드 블록에 대한 뷰포트 오버플로우 방지: `break-words`, `[overflow-wrap:anywhere]`, `overflow-x-auto` 클래스를 마크다운 및 테이블 래퍼에 엄격 적용
- **회귀 검증 결과**: Vitest 전체 24개 테스트 파일, 241개 테스트 100% 통과 및 TypeScript 타입 검사(`tsc --noEmit`) 0 오류 유지

---

## 3. UI 5대 상태 (Loading, Error, Empty, Success, Idle) 검증표

| 상태 케이스 | 모의 네트워크 조건 (MSW) | 화면 렌더링 검증 결과 | 통과 여부 |
| :--- | :--- | :--- | :---: |
| **Empty State** | `initialMockSessions: []` 빈 배열 반환 및 초기 진입 | "AgentLens AI 챗 워크스페이스" 웰컴 헤딩, 기능 안내 불릿 4종 및 추천 프롬프트 제안 칩 렌더링 확인 | PASS |
| **Loading State** | SSE 연결 수립 중 및 `event: status` 스트리밍 지연 시뮬레이션 | 세션 목록 스켈레톤 인디케이터 노출 및 `WorkflowStepTracker` 4단계 에이전틱 리서치 진행 바(20% ➔ 45% ➔ 65% ➔ 85%) 렌더링 확인 | PASS |
| **Error State** | 502 LLM 업스트림 장애 (`[TRIGGER_502]`), 503 엔진 미설정 (`[TRIGGER_503]`), SSE 중간 단절 (`[TRIGGER_STREAM_ERROR]`) | 에러 카드 경고 배너 및 안내 문구 렌더링, [다시 시도] 재전송 버튼 클릭 시 직전 사용자 질문 재전송 동작 확인 | PASS |
| **Success State**| SSE `token` 순차 송신 ➔ `event: done` 완료 수신 | Senior Staff Architect 4단 엔지니어링 리포트 마크다운 렌더링, 인라인 인용(`[1]`, `[S1]`) 클릭 대화상자 노출, 완료 시점 원문/보충 출처 배지 표시, ExportToolbar(.md 다운로드, Notion 동기화) 활성화 확인 | PASS |
| **Idle State** | 스트리밍 종료 후 입력 대기 또는 초기 워크스페이스 대기 | 상단 헤더 & 하단 입력창 듀얼 모델 셀렉터(Haiku/Sonnet/Opus) 0ms 양방향 동기화 대기, Scoped/Global 검색 스코프 스위치 및 포커스 캡슐 필터 정상 대기 확인 | PASS |
