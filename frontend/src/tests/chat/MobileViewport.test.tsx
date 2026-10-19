import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChatPromptInput from '@/components/chat/ChatPromptInput';
import ChatWorkspace from '@/components/chat/ChatWorkspace';
import { viewport } from '@/app/layout';

describe('Mobile Viewport & Virtual Keyboard Optimization (TDD)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('verifies layout viewport metadata prevents auto-zoom and enables interactiveWidget resize', () => {
    expect(viewport).toBeDefined();
    expect(viewport.width).toBe('device-width');
    expect(viewport.initialScale).toBe(1);
    expect(viewport.maximumScale).toBe(1);
    expect(viewport.userScalable).toBe(false);
    expect(viewport.interactiveWidget).toBe('resizes-content');
  });

  it('ensures ChatPromptInput textarea has text-base (16px) to block iOS auto-zoom and horizontal scroll', () => {
    render(
      <ChatPromptInput
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onStopGenerating={vi.fn()}
        isStreaming={false}
        scopeMode="global"
      />
    );

    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    expect(textarea.className).toContain('text-base');
    expect(textarea.className).toMatch(/sm:text-sm|md:text-sm/);
  });

  it('ensures ChatPromptInput calls scrollIntoView on focus so keyboard does not obscure input', () => {
    vi.useFakeTimers();
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    render(
      <ChatPromptInput
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onStopGenerating={vi.fn()}
        isStreaming={false}
        scopeMode="global"
      />
    );

    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    fireEvent.focus(textarea);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(scrollIntoViewMock).toHaveBeenCalledWith(
      expect.objectContaining({ block: 'end' })
    );

    vi.useRealTimers();
  });

  it('ensures ChatWorkspace has overflow-x-hidden and max-w-full to prevent horizontal scrollbars', () => {
    const { container } = render(<ChatWorkspace />);
    const workspaceRoot = container.firstChild as HTMLElement;

    expect(workspaceRoot.className).toContain('overflow-x-hidden');
    expect(workspaceRoot.className).toContain('max-w-full');
  });

  it('dynamically adapts ChatWorkspace height when visualViewport resizes due to virtual keyboard', () => {
    // Mock visualViewport
    let resizeCallback: (() => void) | null = null;
    const mockVisualViewport = {
      height: 800,
      width: 375,
      offsetTop: 0,
      addEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'resize') resizeCallback = cb;
      }),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(window, 'visualViewport', {
      value: mockVisualViewport,
      writable: true,
      configurable: true,
    });

    const { container } = render(<ChatWorkspace />);
    const workspaceRoot = container.firstChild as HTMLElement;

    // Initially uses visualViewport height (800px)
    expect(workspaceRoot.style.height).toBe('800px');

    // Simulate virtual keyboard popup: visualViewport shrinks to 450px
    mockVisualViewport.height = 450;
    act(() => {
      if (resizeCallback) resizeCallback();
    });

    expect(workspaceRoot.style.height).toBe('450px');
  });
});
