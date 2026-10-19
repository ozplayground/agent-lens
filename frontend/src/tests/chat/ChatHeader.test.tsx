import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatHeader from '@/components/chat/ChatHeader';
import { mockArticles } from '@/mocks/fixtures/chat';

describe('ChatHeader Component', () => {
  const defaultProps = {
    scopeMode: 'global' as const,
    onScopeChange: vi.fn(),
    activeSource: null,
    onRemoveSource: vi.fn(),
    onNewChat: vi.fn(),
    isStreaming: false,
  };

  it('renders navigation back link to feed and brand title', () => {
    render(<ChatHeader {...defaultProps} />);

    const backLink = screen.getByRole('link', { name: /피드|돌아가기/i });
    expect(backLink).toHaveAttribute('href', '/');
    expect(screen.getByText('AI 챗')).toBeInTheDocument();
  });

  it('renders scope segmented controls and calls onScopeChange', () => {
    const handleScopeChange = vi.fn();
    render(
      <ChatHeader
        {...defaultProps}
        scopeMode="global"
        onScopeChange={handleScopeChange}
      />
    );

    const scopedBtn = screen.getByRole('button', { name: /단일 기사|Scoped/i });
    fireEvent.click(scopedBtn);

    expect(handleScopeChange).toHaveBeenCalledWith('scoped');
  });

  it('renders ActiveSourceChip when activeSource is provided', () => {
    render(
      <ChatHeader
        {...defaultProps}
        scopeMode="scoped"
        activeSource={mockArticles[101]}
      />
    );

    expect(screen.getByText(/FastMCP/i)).toBeInTheDocument();
  });

  it('calls onNewChat when 새 대화 button is clicked', () => {
    const handleNewChat = vi.fn();
    render(<ChatHeader {...defaultProps} onNewChat={handleNewChat} />);

    const newChatBtn = screen.getByRole('button', { name: /새 대화/i });
    fireEvent.click(newChatBtn);

    expect(handleNewChat).toHaveBeenCalledTimes(1);
  });

  it('disables new chat button when streaming', () => {
    const handleNewChat = vi.fn();
    render(<ChatHeader {...defaultProps} onNewChat={handleNewChat} isStreaming={true} />);

    const newChatBtn = screen.getByRole('button', { name: /새 대화/i });
    expect(newChatBtn).toBeDisabled();
  });

  it('renders ChatModelSelector in header when selectedTier and onSelectTier are provided', () => {
    const handleSelectTier = vi.fn();
    render(
      <ChatHeader
        {...defaultProps}
        selectedTier="sonnet"
        onSelectTier={handleSelectTier}
      />
    );

    const modelTrigger = screen.getByRole('button', { name: /Claude 모델 선택|Sonnet/i });
    expect(modelTrigger).toBeInTheDocument();
    expect(modelTrigger).toHaveTextContent(/Sonnet 5.5/i);

    fireEvent.click(modelTrigger);
    const haikuOption = screen.getByRole('radio', { name: /Haiku 5.5/i });
    fireEvent.click(haikuOption);

    expect(handleSelectTier).toHaveBeenCalledWith('haiku');
  });

  it('disables ChatModelSelector in header when isStreaming is true', () => {
    const handleSelectTier = vi.fn();
    render(
      <ChatHeader
        {...defaultProps}
        selectedTier="sonnet"
        onSelectTier={handleSelectTier}
        isStreaming={true}
      />
    );

    const modelTrigger = screen.getByRole('button', { name: /Claude 모델 선택|Sonnet/i });
    expect(modelTrigger).toBeDisabled();
  });
});
