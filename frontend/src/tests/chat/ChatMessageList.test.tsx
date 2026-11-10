import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatMessageList from '@/components/chat/ChatMessageList';
import { ChatMessage } from '@/types/chat';

describe('ChatMessageList Component', () => {
  const defaultProps = {
    messages: [] as ChatMessage[],
    isStreaming: false,
    onSelectPromptSuggestion: vi.fn(),
    onRetryMessage: vi.fn(),
    onCopyMessage: vi.fn(),
  };

  it('renders Welcome Empty View with 4 suggestion prompt pills when messages array is empty', () => {
    const handleSelectSuggestion = vi.fn();
    render(
      <ChatMessageList
        {...defaultProps}
        messages={[]}
        onSelectPromptSuggestion={handleSelectSuggestion}
      />
    );

    expect(screen.getByText(/AgentLens AI 챗/i)).toBeInTheDocument();

    const pills = screen.getAllByRole('button', { name: /FastMCP|LangGraph|SWE-bench|동향/i });
    expect(pills.length).toBeGreaterThanOrEqual(4);

    fireEvent.click(pills[0]);
    expect(handleSelectSuggestion).toHaveBeenCalledTimes(1);
  });

  it('renders accessible message list with role log and aria-live', () => {
    const messages: ChatMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: '질문입니다',
        timestamp: '2026-09-16T10:00:00Z',
        scope: 'global',
      },
    ];

    render(<ChatMessageList {...defaultProps} messages={messages} />);

    const logContainer = screen.getByRole('log');
    expect(logContainer).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('질문입니다')).toBeInTheDocument();
  });

  it('enforces overflow-x-hidden, w-full, and max-w-full on message list container', () => {
    const messages: ChatMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: '가로 스크롤 방어 검증',
        timestamp: '2026-09-16T10:00:00Z',
        scope: 'global',
      },
    ];

    render(<ChatMessageList {...defaultProps} messages={messages} />);

    const logContainer = screen.getByRole('log');
    expect(logContainer.className).toContain('overflow-x-hidden');
    expect(logContainer.className).toContain('w-full');
    expect(logContainer.className).toContain('max-w-full');
  });

  it('추천 질문 버튼마다 text-left 를 직접 단다 (spec 14.6)', () => {
    render(<ChatMessageList {...defaultProps} messages={[]} />);

    const pills = screen.getAllByRole('button', { name: /FastMCP|LangGraph|SWE-bench|동향/i });
    expect(pills).toHaveLength(4);
    for (const pill of pills) {
      expect(pill.className.split(/\s+/)).toContain('text-left');
    }
  });

  it('sends the suggestion text without emoji and draws one decorative lucide icon per card (R44)', () => {
    const handleSelectSuggestion = vi.fn();
    render(
      <ChatMessageList {...defaultProps} messages={[]} onSelectPromptSuggestion={handleSelectSuggestion} />
    );

    const pills = screen.getAllByRole('button', { name: /FastMCP|LangGraph|SWE-bench|동향/i });
    fireEvent.click(pills[0]);
    expect(handleSelectSuggestion).toHaveBeenCalledWith('FastMCP로 파이썬 기반 경량 MCP 서버 구축하는 방법');

    for (const pill of pills) {
      // 카드 앞 아이콘 하나 (오른쪽 화살표 `ArrowRight` 는 원래 있던 장식이라 세지 않는다)
      const leadIcons = pill.querySelectorAll('svg.text-accent[aria-hidden="true"]');
      expect(leadIcons).toHaveLength(1);
      expect(pill.firstElementChild).toBe(leadIcons[0]);
      expect(pill.textContent ?? '').not.toMatch(/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/u);
    }
  });
});

describe('ChatMessageList 모바일 스크롤 (FE-36)', () => {
  const baseProps = {
    isStreaming: false,
    onSelectPromptSuggestion: vi.fn(),
    onRetryMessage: vi.fn(),
    onCopyMessage: vi.fn(),
  };
  const turn = (answer: string): ChatMessage[] => [
    { id: 'u1', role: 'user', content: '질문', timestamp: '2026-11-10T00:00:00Z', scope: 'global', status: 'sent' },
    { id: 'a1', role: 'assistant', content: answer, timestamp: '2026-11-10T00:00:01Z', scope: 'global', status: 'streaming' },
  ];

  /** jsdom 은 레이아웃을 계산하지 않으므로 스크롤 상자 크기를 직접 정한다. */
  function sizeLog(log: HTMLElement, scrollHeight: number, clientHeight: number) {
    Object.defineProperty(log, 'scrollHeight', { configurable: true, get: () => scrollHeight });
    Object.defineProperty(log, 'clientHeight', { configurable: true, get: () => clientHeight });
  }

  it('메시지 목록이 절대 위치 자손(모바일 sr-only 라벨)의 기준 상자라 바깥 열이 넘치지 않는다', () => {
    render(<ChatMessageList {...baseProps} messages={turn('답')} />);
    // 모바일에서 `max-md:sr-only` 라벨은 position:absolute 다. 목록이 기준 상자가 아니면
    // 라벨이 overflow-hidden 인 바깥 열을 넘쳐 열 전체가 스크롤되고 입력창이 위로 밀려난다.
    expect(screen.getByRole('log').className.split(/\s+/)).toContain('relative');
  });

  it('새 토큰이 오면 목록 상자만 맨 아래로 내리고 조상 상자를 스크롤하는 scrollIntoView 는 쓰지 않는다', () => {
    const spy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    const { rerender } = render(<ChatMessageList {...baseProps} isStreaming messages={turn('첫 토큰')} />);
    const log = screen.getByRole('log');
    sizeLog(log, 2000, 500);

    rerender(<ChatMessageList {...baseProps} isStreaming messages={turn('첫 토큰 두 번째 토큰')} />);

    expect(log.scrollTop).toBe(2000);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('사용자가 위로 올려 읽는 중이면 스트리밍이 이어져도 아래로 끌어내리지 않는다', () => {
    const { rerender } = render(<ChatMessageList {...baseProps} isStreaming messages={turn('첫 토큰')} />);
    const log = screen.getByRole('log');
    sizeLog(log, 2000, 500);
    log.scrollTop = 300;
    fireEvent.scroll(log);

    rerender(<ChatMessageList {...baseProps} isStreaming messages={turn('첫 토큰 두 번째 토큰')} />);

    expect(log.scrollTop).toBe(300);
  });

  it('맨 아래 근처로 다시 내려오면 자동으로 따라 내려간다', () => {
    const { rerender } = render(<ChatMessageList {...baseProps} isStreaming messages={turn('첫 토큰')} />);
    const log = screen.getByRole('log');
    sizeLog(log, 2000, 500);
    log.scrollTop = 300;
    fireEvent.scroll(log);
    log.scrollTop = 1490; // 맨 아래(1500)에서 10px 위
    fireEvent.scroll(log);

    rerender(<ChatMessageList {...baseProps} isStreaming messages={turn('첫 토큰 두 번째 토큰')} />);

    expect(log.scrollTop).toBe(2000);
  });
});
