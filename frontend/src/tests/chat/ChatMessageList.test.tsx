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
});
