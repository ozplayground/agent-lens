import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ChatWorkspace from '@/components/chat/ChatWorkspace';

// Mock next/navigation
const mockGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('ChatWorkspace Container', () => {
  beforeEach(() => {
    mockGet.mockReturnValue(null);
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders initial empty workspace with welcome view when no search params', () => {
    render(<ChatWorkspace />);

    expect(screen.getByText(/AgentLens AI 챗 워크스페이스/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /질문 입력/i })).toBeInTheDocument();
  });

  it('fetches source metadata and switches to scoped mode when sourceId is present in searchParams', async () => {
    mockGet.mockImplementation((param: string) => {
      if (param === 'sourceId') return '101';
      return null;
    });

    render(<ChatWorkspace />);

    // FastMCP source chip should appear
    await waitFor(() => {
      expect(screen.getByText(/FastMCP/i)).toBeInTheDocument();
    });
  });

  it('handles 404 for invalid sourceId by showing warning and falling back to global mode', async () => {
    mockGet.mockImplementation((param: string) => {
      if (param === 'sourceId') return '99999'; // Non-existent
      return null;
    });

    render(<ChatWorkspace />);

    await waitFor(() => {
      expect(screen.getByText(/요청하신 기사를 찾을 수 없어 전체 뉴스 모드로 시작합니다/i)).toBeInTheDocument();
    });
  });

  it('sends question, streams response via MSW, and renders assistant answer', async () => {
    render(<ChatWorkspace />);

    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    const sendButton = screen.getByRole('button', { name: /질문 전송/i });

    fireEvent.change(textarea, { target: { value: 'FastMCP의 장점은?' } });
    fireEvent.click(sendButton);

    // User message is rendered immediately
    expect(screen.getByText('FastMCP의 장점은?')).toBeInTheDocument();

    // Assistant response streaming completes
    await waitFor(
      () => {
        expect(screen.getByText(/Model Context Protocol/i)).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });

  it('allows user to stop streaming and preserves partial answer', async () => {
    render(<ChatWorkspace />);

    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    const sendButton = screen.getByRole('button', { name: /질문 전송/i });

    fireEvent.change(textarea, { target: { value: '최신 AI 동향 분석' } });
    fireEvent.click(sendButton);

    // Wait for Stop button to appear
    const stopBtn = await screen.findByRole('button', { name: /중단/i });
    fireEvent.click(stopBtn);

    // Stop button disappears, send button returns
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /질문 전송/i })).toBeInTheDocument();
    });
  });

  it('resets conversation when 새 대화 button is clicked', async () => {
    render(<ChatWorkspace />);

    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    const sendButton = screen.getByRole('button', { name: /질문 전송/i });

    fireEvent.change(textarea, { target: { value: '안녕' } });
    fireEvent.click(sendButton);

    expect(screen.getByText('안녕')).toBeInTheDocument();

    // Stop streaming first so 새 대화 button is enabled
    const stopBtn = await screen.findByRole('button', { name: /중단/i });
    fireEvent.click(stopBtn);

    const newChatBtn = screen.getByRole('button', { name: /새 대화/i });
    fireEvent.click(newChatBtn);

    // Returns to welcome view
    expect(screen.getByText(/AgentLens AI 챗 워크스페이스/i)).toBeInTheDocument();
    expect(screen.queryByText('안녕')).not.toBeInTheDocument();
  });

  it('renders FocusCapsule and opens FocusBottomSheet when clicked', async () => {
    render(<ChatWorkspace />);

    // FocusCapsule button is rendered in the workspace
    const capsule = screen.getByRole('button', { name: /지식 검색 포커스 필터/i });
    expect(capsule).toBeInTheDocument();

    fireEvent.click(capsule);

    // FocusBottomSheet drawer dialog opens
    expect(await screen.findByRole('dialog', { name: /수집 소식 타깃팅 포커스 필터/i })).toBeInTheDocument();
  });

  it('sends filters payload and displays auto-relaxation banner when is_relaxed is true', async () => {
    render(<ChatWorkspace />);

    // 1. Open FocusBottomSheet and set category: harness, timeRange: 24h
    const capsule = screen.getByRole('button', { name: /지식 검색 포커스 필터/i });
    fireEvent.click(capsule);

    const harnessBtn = await screen.findByRole('button', { name: /하네스·평가/i });
    fireEvent.click(harnessBtn);

    const dialog = screen.getByRole('dialog', { name: /수집 소식 타깃팅 포커스 필터/i });
    const dayBtn = within(dialog).getByRole('button', { name: /^24시간$/ });
    fireEvent.click(dayBtn);

    const applyBtn = screen.getByRole('button', { name: /적용하기/i });
    fireEvent.click(applyBtn);

    // 2. Submit question
    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    const sendButton = screen.getByRole('button', { name: /질문 전송/i });

    fireEvent.change(textarea, { target: { value: '하네스 벤치마크 분석' } });
    fireEvent.click(sendButton);

    // 3. Verify auto-relaxation banner is rendered
    await waitFor(
      () => {
        expect(
          screen.getByText(/선택 조건에 부합하는 소식이 없어 전체 기간으로 확장 검색했습니다/i)
        ).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });

  it('displays clear error card and retry button on LLM 502 failure, and clicking retry re-sends question', async () => {
    render(<ChatWorkspace />);

    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    const sendButton = screen.getByRole('button', { name: /질문 전송/i });

    fireEvent.change(textarea, { target: { value: '최신 동향 [TRIGGER_502]' } });
    fireEvent.click(sendButton);

    // Wait for error card to appear
    await waitFor(() => {
      expect(screen.getByText(/외부 LLM 업스트림 통신에 실패했습니다/i)).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /다시 시도|재시도/i });
    expect(retryBtn).toBeInTheDocument();

    // Clicking retry will re-send the question
    fireEvent.click(retryBtn);

    // Verify it re-attempts (the user message is re-sent)
    await waitFor(() => {
      expect(screen.getByText('최신 동향 [TRIGGER_502]')).toBeInTheDocument();
    });
  });

  it('displays clear error card and retry button on LLM 503 provider unavailable', async () => {
    render(<ChatWorkspace />);

    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    const sendButton = screen.getByRole('button', { name: /질문 전송/i });

    fireEvent.change(textarea, { target: { value: '엔진 미설정 테스트 [TRIGGER_503]' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText(/가용한 LLM 프로바이더 엔진이 설정되지 않았습니다/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /다시 시도|재시도/i })).toBeInTheDocument();
  });

  it('displays error card and retry button when mid-stream SSE error occurs', async () => {
    render(<ChatWorkspace />);

    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    const sendButton = screen.getByRole('button', { name: /질문 전송/i });

    fireEvent.change(textarea, { target: { value: '중간 끊김 테스트 [TRIGGER_STREAM_ERROR]' } });
    fireEvent.click(sendButton);

    await waitFor(
      () => {
        expect(
          screen.getByText(/외부 LLM 스트리밍 중 통신 연결이 단절되었습니다/i)
        ).toBeInTheDocument();
      },
      { timeout: 4000 }
    );

    expect(screen.getByRole('button', { name: /다시 시도|재시도/i })).toBeInTheDocument();
  });

  it('receives SSE status events, renders WorkflowStepTracker and dual citations upon completion', async () => {
    render(<ChatWorkspace />);

    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    const sendButton = screen.getByRole('button', { name: /질문 전송/i });

    fireEvent.change(textarea, { target: { value: 'FastMCP와 Model Context Protocol 아키텍처는?' } });
    fireEvent.click(sendButton);

    // 1. Wait for completion and check 28px slim accordion button appears upon completion
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /심층 분석 과정.*단계 완료/i })).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // 2. Check 4-stage engineering report markdown is rendered
    expect(screen.getByText(/1\. 핵심 아키텍처 및 동작 원리/i)).toBeInTheDocument();

    // 3. Check dual citations: Primary [1] and Supplementary [S1] are rendered as buttons
    const primaryCitations = screen.getAllByRole('button', { name: /출처 1번/i });
    expect(primaryCitations.length).toBeGreaterThan(0);

    const suppCitations = screen.getAllByRole('button', { name: /보충.*출처.*S1/i });
    expect(suppCitations.length).toBeGreaterThan(0);
    expect(suppCitations[0].className).toContain('emerald');
  });

  it('switches Claude model mid-session and renders ModelChangeDivider in timeline', async () => {
    render(<ChatWorkspace />);

    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    const sendButton = screen.getByRole('button', { name: /질문 전송/i });

    // Send first message with default Sonnet tier
    fireEvent.change(textarea, { target: { value: 'Claude 기본 모델 테스트' } });
    fireEvent.click(sendButton);

    // Wait for completion
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /심층 분석 과정.*단계 완료/i })).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Switch model to Haiku
    const modelSelectorTriggers = screen.getAllByRole('button', { name: /Claude 모델 선택/i });
    fireEvent.click(modelSelectorTriggers[0]);

    const haikuRadio = screen.getByRole('radio', { name: /Haiku 5.5/i });
    fireEvent.click(haikuRadio);

    // Verify ModelChangeDivider is rendered in timeline
    const divider = await screen.findByRole('separator');
    expect(divider).toBeInTheDocument();
    expect(divider).toHaveTextContent(/Claude Haiku 5.5로 모델 변경됨/i);
  });

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

  it('correctly sends scope: scoped and source_id when article is focused, and renders customized response', async () => {
    mockGet.mockImplementation((param: string) => {
      if (param === 'sourceId') return '102';
      return null;
    });

    render(<ChatWorkspace />);

    // ActiveSource chip should appear
    await waitFor(() => {
      expect(screen.getAllByText(/LangGraph/i).length).toBeGreaterThan(0);
    });

    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    const sendButton = screen.getByRole('button', { name: /질문 전송/i });

    fireEvent.change(textarea, { target: { value: 'LangGraph v0.2의 장점은?' } });
    fireEvent.click(sendButton);

    // User message is rendered
    expect(screen.getByText('LangGraph v0.2의 장점은?')).toBeInTheDocument();

    // Assistant response streams and contains LangGraph-specific custom response
    await waitFor(
      () => {
        expect(screen.getByText(/time-travel debugging/i)).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });

  it('dynamically displays question-specific sources chip and inline citations for global mode questions (v0.2.2)', async () => {
    render(<ChatWorkspace />);

    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    const sendButton = screen.getByRole('button', { name: /질문 전송/i });

    // Ask about LangGraph in global mode (no sourceId in searchParams)
    fireEvent.change(textarea, { target: { value: 'LangGraph v0.2 시간 여행 디버깅 원리' } });
    fireEvent.click(sendButton);

    // Wait for stream to complete
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /심층 분석 과정.*단계 완료/i })).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Source chip at the message header should show "원문 1건" (not fixed 5건)
    expect(screen.getByText('원문 1건')).toBeInTheDocument();

    // Inline citation [1] should reference LangGraph
    const citations1 = screen.getAllByRole('button', { name: /출처 1번:.*LangGraph/i });
    expect(citations1.length).toBeGreaterThan(0);

    // Markdown content should contain LangGraph-specific content
    expect(screen.getAllByText(/LangGraph v0.2/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/durable state persistence/i)).toBeInTheDocument();
  });

  it('does not display fake hardcoded 5-count badge upon entering chat, and reflects true backend sources', async () => {
    render(<ChatWorkspace />);

    // 1. Initial entrance: Open FocusBottomSheet
    const capsule = screen.getByRole('button', { name: /지식 검색 포커스 필터/i });
    fireEvent.click(capsule);

    // Verify dialog opened
    const dialog = await screen.findByRole('dialog', { name: /수집 소식 타깃팅 포커스 필터/i });
    expect(dialog).toBeInTheDocument();

    // Verify fake "5건 매칭" badge is completely absent in initial state
    expect(within(dialog).queryByText(/5건 매칭/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/매칭 소식/i)).not.toBeInTheDocument();

    // Close bottom sheet
    const closeBtn = within(dialog).getByRole('button', { name: /필터 닫기/i });
    fireEvent.click(closeBtn);

    // 2. Submit question that retrieves FastMCP and check real source count is reflected
    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    const sendButton = screen.getByRole('button', { name: /질문 전송/i });

    fireEvent.change(textarea, { target: { value: 'FastMCP의 장점은?' } });
    fireEvent.click(sendButton);

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /심층 분석 과정.*단계 완료/i })).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Check message header source chip has honest backend counts (not hardcoded 5)
    expect(screen.getByText(/원문 1건/i)).toBeInTheDocument();
    expect(screen.queryByText('원문 5건')).not.toBeInTheDocument();
  });
});


