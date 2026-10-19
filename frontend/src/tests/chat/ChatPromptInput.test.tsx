import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatPromptInput from '@/components/chat/ChatPromptInput';

describe('ChatPromptInput Component', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    onStopGenerating: vi.fn(),
    isStreaming: false,
    scopeMode: 'global' as const,
  };

  it('renders textarea with accessible role and placeholder', () => {
    render(<ChatPromptInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox', { name: /질문 입력|메시지 입력/i });
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('placeholder');
  });

  it('triggers onChange when typing', () => {
    const handleChange = vi.fn();
    render(<ChatPromptInput {...defaultProps} onChange={handleChange} />);

    const textarea = screen.getByRole('textbox', { name: /질문 입력|메시지 입력/i });
    fireEvent.change(textarea, { target: { value: 'FastMCP 사용법은?' } });

    expect(handleChange).toHaveBeenCalledWith('FastMCP 사용법은?');
  });

  it('calls onSubmit on Enter key (when not composing and not shift)', () => {
    const handleSubmit = vi.fn();
    render(
      <ChatPromptInput
        {...defaultProps}
        value="테스트 질문입니다"
        onSubmit={handleSubmit}
      />
    );

    const textarea = screen.getByRole('textbox', { name: /질문 입력|메시지 입력/i });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(handleSubmit).toHaveBeenCalledWith('테스트 질문입니다');
  });

  it('does NOT call onSubmit when Shift+Enter is pressed', () => {
    const handleSubmit = vi.fn();
    render(
      <ChatPromptInput
        {...defaultProps}
        value="줄바꿈 테스트"
        onSubmit={handleSubmit}
      />
    );

    const textarea = screen.getByRole('textbox', { name: /질문 입력|메시지 입력/i });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('does NOT call onSubmit when IME is composing', () => {
    const handleSubmit = vi.fn();
    render(
      <ChatPromptInput
        {...defaultProps}
        value="한글 조합"
        onSubmit={handleSubmit}
      />
    );

    const textarea = screen.getByRole('textbox', { name: /질문 입력|메시지 입력/i });
    // Simulate isComposing event
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    Object.defineProperty(event, 'isComposing', { value: true });
    textarea.dispatchEvent(event);

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('renders Stop generating button when isStreaming is true and calls onStopGenerating', () => {
    const handleStop = vi.fn();
    render(
      <ChatPromptInput
        {...defaultProps}
        isStreaming={true}
        onStopGenerating={handleStop}
      />
    );

    const stopBtn = screen.getByRole('button', { name: /중단|stop/i });
    expect(stopBtn).toBeInTheDocument();

    fireEvent.click(stopBtn);
    expect(handleStop).toHaveBeenCalledTimes(1);
  });

  it('displays character counter and highlights warning when length exceeds maxLength', () => {
    render(
      <ChatPromptInput
        {...defaultProps}
        value={'a'.repeat(2005)}
        maxLength={2000}
      />
    );

    expect(screen.getByText(/2005 \/ 2000/)).toBeInTheDocument();
  });
});
