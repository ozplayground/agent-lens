# [도메인명] 프론트엔드 컴포넌트 TDD 실행 기록서 (Frontend TDD Log)

- **작성일자**: YYYY-MM-DD
- **작성자**: 프론트엔드 TDD 엔지니어 (`frontend-tdd-engineer`)
- **문서 버전**: v1.0
- **상태**: Draft / Review / Approved

---

## 1. TDD 개발 대상 컴포넌트 및 사용자 인터랙션
- **대응 기능 ID**: `FUNC-도메인-001`
- **대상 컴포넌트**: `src/components/...`
- **테스트 파일**: `src/components/__tests__/....test.tsx`
- **모의 핸들러**: `src/mocks/handlers.ts`

---

## 2. Red-Green-Refactor 사이클 실행 기록

### [Cycle 1] 사용자 인터랙션 및 렌더링 TDD
#### 1. RED Phase (실패하는 RTL 테스트 작성)
- **작성된 테스트 코드**:
```typescript
it('메시지 입력 후 전송 버튼 클릭 시 화면에 사용자 메시지가 추가된다', async () => {
  render(<ChatWorkspace />);
  const input = screen.getByRole('textbox', { name: /메시지 입력/i });
  const sendButton = screen.getByRole('button', { name: /전송/i });

  await userEvent.type(input, '안녕하세요!');
  await userEvent.click(sendButton);

  expect(await screen.findByText('안녕하세요!')).toBeInTheDocument();
});
```
- **실행 결과 (실패 확인)**:
```
TestingLibraryElementError: Unable to find an accessible element with the role "textbox"
```

#### 2. GREEN Phase (최소 컴포넌트 구현)
- **구현 내용 요약**: 접근성 role을 준수하는 input과 button 렌더링 및 상태 연결
- **실행 결과 (성공 확인)**:
```
✓ ChatWorkspace > 메시지 입력 후 전송 버튼 클릭 시 화면에 사용자 메시지가 추가된다
Test Files  1 passed (1)
Tests       1 passed (1)
```

#### 3. REFACTOR Phase (컴포넌트 분리 및 최적화)
- **리팩토링 내용**: 입력 바를 `MessageComposerBar` 독립 컴포넌트로 분리, 불필요한 리렌더 방지 `useCallback` 적용
- **회귀 검증 결과**: Vitest 전체 테스트 100% 통과 유지

---

## 3. UI 5대 상태 (Loading, Error, Empty, Success, Idle) 검증표

| 상태 케이스 | 모의 네트워크 조건 (MSW) | 화면 렌더링 검증 결과 | 통과 여부 |
| :--- | :--- | :--- | :---: |
| **Empty State** | 데이터 빈 배열 반환 | "어떤 도움이 필요하신가요?" 안내 노출 확인 | PASS |
| **Loading State** | 응답 지연 시뮬레이션 (300ms) | 스켈레톤 인디케이터 렌더링 확인 | PASS |
| **Error State** | 500 서버 장애 모의 | 에러 바운더리 토스트 및 [재시도] 버튼 확인 | PASS |
| **Success State**| 201 생성 응답 | 낙관적 업데이트 ➔ 확정 메시지 렌더링 확인 | PASS |
