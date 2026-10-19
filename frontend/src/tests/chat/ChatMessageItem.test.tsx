import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChatMessageItem from '@/components/chat/ChatMessageItem';
import { ChatMessage } from '@/types/chat';

describe('ChatMessageItem Component', () => {
  const userMessage: ChatMessage = {
    id: 'msg-user-1',
    role: 'user',
    content: 'FastMCP와 LangGraph의 차이점은 무엇인가요?',
    timestamp: '2026-09-16T10:00:00Z',
    scope: 'global',
    status: 'sent',
  };

  const assistantMessage: ChatMessage = {
    id: 'msg-assistant-1',
    role: 'assistant',
    content: 'FastMCP[1]는 파이썬 데코레이터 기반 MCP 프레임워크이며, LangGraph[2]는 그래프 기반 멀티에이전트 제어 프레임워크입니다.',
    timestamp: '2026-09-16T10:00:05Z',
    scope: 'global',
    status: 'completed',
    model_used: 'gemini-2.5-flash',
    sources: [
      {
        index: 1,
        type: 'primary',
        id: 101,
        title: 'FastMCP: High-performance Python MCP Framework',
        url: 'https://github.com/jlowin/fastmcp',
        source: 'github',
        category: 'mcp_plugins_skills',
        quality_score: 9.3,
        snippet: 'FastMCP provides a decorator-based syntax for creating MCP servers.',
      },
      {
        index: 2,
        type: 'primary',
        id: 102,
        title: 'LangGraph v0.2: Production Multi-Agent Workflows',
        url: 'https://github.com/langchain-ai/langgraph',
        source: 'github',
        category: 'agent_tech',
        quality_score: 9.1,
        snippet: 'LangGraph v0.2 introduces durable state persistence.',
      },
    ],
  };

  const errorMessage: ChatMessage = {
    id: 'msg-err-1',
    role: 'assistant',
    content: '',
    timestamp: '2026-09-16T10:00:10Z',
    scope: 'global',
    status: 'error',
    errorMessage: '네트워크 지연으로 응답이 중단되었습니다.',
  };

  it('renders user message bubble cleanly', () => {
    render(<ChatMessageItem message={userMessage} />);

    expect(screen.getByText('FastMCP와 LangGraph의 차이점은 무엇인가요?')).toBeInTheDocument();
  });

  it('faithfully preserves and renders legacy gemini model_used without distortion', () => {
    render(<ChatMessageItem message={assistantMessage} />);

    expect(screen.getByText('Gemini 2.5 Flash')).toBeInTheDocument();
    // Inline citations [1] and [2] are rendered as buttons
    const badge1 = screen.getByRole('button', { name: /출처 1번/i });
    const badge2 = screen.getByRole('button', { name: /출처 2번/i });

    expect(badge1).toBeInTheDocument();
    expect(badge2).toBeInTheDocument();
  });

  it('formats Haiku and Opus model names without exposing raw model IDs', () => {
    const haikuMsg: ChatMessage = {
      ...assistantMessage,
      id: 'msg-haiku-1',
      model_tier: 'haiku',
      model_used: 'claude-haiku-5-5',
    };
    const { unmount } = render(<ChatMessageItem message={haikuMsg} />);
    expect(screen.getByText('Claude Haiku 5.5')).toBeInTheDocument();
    expect(screen.queryByText(/claude-haiku-5-5/i)).not.toBeInTheDocument();
    unmount();

    const opusMsg: ChatMessage = {
      ...assistantMessage,
      id: 'msg-opus-1',
      model_tier: 'opus',
      model_used: 'claude-opus-5-5',
    };
    render(<ChatMessageItem message={opusMsg} />);
    expect(screen.getByText('Claude Opus 5.5')).toBeInTheDocument();
    expect(screen.queryByText(/claude-opus-5-5/i)).not.toBeInTheDocument();
  });

  it('handles copy action when copy button is clicked', async () => {
    const handleCopy = vi.fn();
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<ChatMessageItem message={assistantMessage} onCopy={handleCopy} />);

    const copyBtn = screen.getByRole('button', { name: '답변 복사' });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(assistantMessage.content);
    expect(handleCopy).toHaveBeenCalledWith(assistantMessage.content);
    expect(screen.getByText('복사됨')).toBeInTheDocument();
  });

  it('renders ExportToolbar with 4-step report actions for completed assistant message', () => {
    render(<ChatMessageItem message={assistantMessage} />);

    expect(screen.getByRole('button', { name: '마크다운 복사' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '.md 다운로드' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notion 동기화' })).toBeInTheDocument();
  });

  it('renders error state with retry button and calls onRetry', () => {
    const handleRetry = vi.fn();
    render(<ChatMessageItem message={errorMessage} onRetry={handleRetry} />);

    expect(screen.getByText(/네트워크 지연으로 응답이 중단되었습니다/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /다시 시도|재시도/i });
    fireEvent.click(retryBtn);

    expect(handleRetry).toHaveBeenCalledWith('msg-err-1');
  });

  it('renders auto-relaxation guidance badge when is_relaxed is true', () => {
    const relaxedMessage: ChatMessage = {
      ...assistantMessage,
      id: 'msg-relaxed-1',
      is_relaxed: true,
    };

    render(<ChatMessageItem message={relaxedMessage} />);

    expect(
      screen.getByText(/선택 조건에 부합하는 소식이 없어 전체 기간으로 확장 검색했습니다/i)
    ).toBeInTheDocument();
  });

  it('renders dual citations [1] and [S1] appropriately in assistant message', () => {
    const dualCitationMessage: ChatMessage = {
      ...assistantMessage,
      content: 'FastMCP[1]는 초경량 서버이며, MCP 사양[S1]을 준수합니다.',
      sources: [
        {
          index: 1,
          type: 'primary',
          id: 101,
          title: 'FastMCP Framework',
          url: 'https://github.com/fastmcp',
          source: 'github',
        },
        {
          index: 'S1',
          type: 'supplementary',
          title: 'Model Context Protocol Spec',
          url: 'https://modelcontextprotocol.io',
          source: 'web_search',
          domain: 'modelcontextprotocol.io',
        },
      ],
    };

    render(<ChatMessageItem message={dualCitationMessage} />);

    const primaryBadge = screen.getByRole('button', { name: /출처 1번/i });
    const suppBadge = screen.getByRole('button', { name: /보충.*출처.*S1/i });

    expect(primaryBadge).toBeInTheDocument();
    expect(suppBadge).toBeInTheDocument();
    expect(suppBadge.className).toContain('emerald');
  });

  it('renders WorkflowStepTracker in assistant message when step_history or current_status is present', () => {
    const stepMessage: ChatMessage = {
      ...assistantMessage,
      status: 'streaming',
      current_status: {
        step: 'extracting_source',
        label: '🌐 원본 소스 본문 추출 중...',
        timestamp: '2026-09-16T18:00:00Z',
        progress: 20,
      },
      step_history: [
        {
          step: 'extracting_source',
          label: '🌐 원본 소스 본문 추출 중...',
          timestamp: '2026-09-16T18:00:00Z',
          progress: 20,
        },
      ],
    };

    render(<ChatMessageItem message={stepMessage} isStreaming={true} />);

    expect(screen.getByText(/원본 소스 본문 추출 중/i)).toBeInTheDocument();
  });

  it('renders ultra-long unspaced text with break-words, [overflow-wrap:anywhere], and flex-1 min-w-0 max-w-full bubble', () => {
    const longHash = 'a'.repeat(120);
    const unspacedUrl = `https://agentlens.internal.ai/deep-analysis/report-hash/${longHash}`;
    const unspacedMessage: ChatMessage = {
      ...assistantMessage,
      id: 'msg-unspaced-1',
      content: `다음은 긴 URL입니다: ${unspacedUrl}`,
    };

    const { container } = render(<ChatMessageItem message={unspacedMessage} />);

    // 1. Message bubble flex child has flex-1 min-w-0 max-w-full
    const bubble = container.querySelector('.rounded-2xl.p-4');
    expect(bubble).not.toBeNull();
    expect(bubble?.className).toContain('flex-1');
    expect(bubble?.className).toContain('min-w-0');
    expect(bubble?.className).toContain('max-w-full');

    // 2. Markdown root container has w-full max-w-full min-w-0 break-words [overflow-wrap:anywhere] [word-break:break-word]
    const markdownRoot = container.querySelector('.markdown-content');
    expect(markdownRoot).not.toBeNull();
    expect(markdownRoot?.className).toContain('w-full');
    expect(markdownRoot?.className).toContain('max-w-full');
    expect(markdownRoot?.className).toContain('min-w-0');
    expect(markdownRoot?.className).toContain('break-words');
    expect(markdownRoot?.className).toContain('[overflow-wrap:anywhere]');
    expect(markdownRoot?.className).toContain('[word-break:break-word]');

    // 3. Paragraph has break-words [overflow-wrap:anywhere] [word-break:break-word]
    const p = markdownRoot?.querySelector('p');
    expect(p).not.toBeNull();
    expect(p?.className).toContain('break-words');
    expect(p?.className).toContain('[overflow-wrap:anywhere]');
    expect(p?.className).toContain('[word-break:break-word]');
  });

  it('renders long inline code with break-all, font-mono, and border styling', () => {
    const inlineCodeMessage: ChatMessage = {
      ...assistantMessage,
      id: 'msg-inline-code-1',
      content: '환경 변수 설정: `VERY_LONG_ENVIRONMENT_VARIABLE_NAME_WITHOUT_SPACES_FOR_TESTING_PURPOSES` 입니다.',
    };

    const { container } = render(<ChatMessageItem message={inlineCodeMessage} />);

    const codeEl = container.querySelector('code');
    expect(codeEl).not.toBeNull();
    expect(codeEl?.className).toContain('break-all');
    expect(codeEl?.className).toContain('font-mono');
    expect(codeEl?.className).toContain('text-[12px]');
    expect(codeEl?.className).toContain('bg-slate-100');
  });

  it('renders markdown table wrapped in an isolated horizontal scroll wrapper', () => {
    const tableMessage: ChatMessage = {
      ...assistantMessage,
      id: 'msg-table-1',
      content: `
| Framework | Architecture | Persistence |
| :--- | :--- | :--- |
| FastMCP | Python Decorator | In-memory |
| LangGraph | StateGraph | SQLite / Postgres |
`,
    };

    const { container } = render(<ChatMessageItem message={tableMessage} />);

    const tableWrapper = container.querySelector('.table-wrapper');
    expect(tableWrapper).not.toBeNull();
    expect(tableWrapper?.className).toContain('w-full');
    expect(tableWrapper?.className).toContain('max-w-full');
    expect(tableWrapper?.className).toContain('min-w-0');
    expect(tableWrapper?.className).toContain('overflow-x-auto');
    expect(tableWrapper?.className).toContain('overscroll-x-contain');

    const tableEl = tableWrapper?.querySelector('table');
    expect(tableEl).not.toBeNull();
    expect(tableEl?.className).toContain('w-full');
    expect(tableEl?.className).toContain('min-w-[320px]');
    expect(tableEl?.className).toContain('border-collapse');
  });

  it('renders headings h1-h3, li, and blockquote with [overflow-wrap:anywhere] and break-words', () => {
    const complexDocMessage: ChatMessage = {
      ...assistantMessage,
      id: 'msg-complex-1',
      content: `
# 1. 핵심 아키텍처_VERY_LONG_STRING_WITHOUT_SPACES_FOR_TESTING
- 항목 1: 상세 내용 설명_VERY_LONG_LIST_ITEM_WITHOUT_SPACES_FOR_TESTING
> 중요한 아키텍처 인용구_VERY_LONG_BLOCKQUOTE_WITHOUT_SPACES_FOR_TESTING
`,
    };

    const { container } = render(<ChatMessageItem message={complexDocMessage} />);

    const h2 = container.querySelector('h2');
    expect(h2).not.toBeNull();
    expect(h2?.className).toContain('break-words');
    expect(h2?.className).toContain('[overflow-wrap:anywhere]');

    const li = container.querySelector('li');
    expect(li).not.toBeNull();
    expect(li?.className).toContain('break-words');
    expect(li?.className).toContain('[overflow-wrap:anywhere]');

    const bq = container.querySelector('blockquote');
    expect(bq).not.toBeNull();
    expect(bq?.className).toContain('break-words');
    expect(bq?.className).toContain('[overflow-wrap:anywhere]');
  });
});
