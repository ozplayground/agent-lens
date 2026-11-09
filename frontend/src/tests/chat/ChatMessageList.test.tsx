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
