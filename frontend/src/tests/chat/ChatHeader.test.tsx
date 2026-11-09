import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
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

  it('does not render a model selector in the header (R39: the composer is the only place)', () => {
    // 예전 모델 prop 을 넘겨도 헤더는 모델 선택을 그리지 않는다 (prop 자체가 없다).
    const legacyModelProps = { selectedTier: 'sonnet', onSelectTier: vi.fn() } as object;
    render(<ChatHeader {...defaultProps} {...legacyModelProps} />);

    expect(screen.queryByRole('button', { name: /Claude 모델 선택/ })).toBeNull();
  });

  it('names the two scope tabs exactly 단일 기사 and 전체 소식 inside the 검색 스코프 모드 group (R37·R38)', () => {
    render(<ChatHeader {...defaultProps} />);

    const group = screen.getByRole('group', { name: '검색 스코프 모드' });
    const tabs = within(group).getAllByRole('button');
    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual(['단일 기사', '전체 소식']);
    expect(within(group).getByRole('button', { name: '단일 기사' })).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: '전체 소식' })).toBeInTheDocument();
    expect(group).not.toHaveTextContent(/Scoped|Global|코퍼스/);
  });

  it('puts the 피드로 돌아가기 link before the 대화 기록 보기 button, as the first control in the header (R43)', () => {
    render(<ChatHeader {...defaultProps} onToggleHistoryDrawer={vi.fn()} />);

    const backLink = screen.getByRole('link', { name: '피드로 돌아가기' });
    const historyBtn = screen.getByRole('button', { name: '대화 기록 보기' });
    expect(backLink.compareDocumentPosition(historyBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const header = backLink.closest('header');
    expect(header).not.toBeNull();
    const firstControl = header!.querySelector('a[href], button');
    expect(firstControl).toBe(backLink);
  });

  describe('기록 버튼 aria-controls (C-1, R24)', () => {
    it('기록이 닫혀 있으면 aria-controls 를 달지 않고 aria-expanded 는 false', () => {
      render(<ChatHeader {...defaultProps} onToggleHistoryDrawer={vi.fn()} isHistoryOpen={false} />);

      const historyBtn = screen.getByRole('button', { name: '대화 기록 보기' });
      expect(historyBtn).toHaveAttribute('aria-expanded', 'false');
      expect(historyBtn).not.toHaveAttribute('aria-controls');
    });

    it('기록이 열려 있으면 aria-controls 와 aria-expanded="true" 를 단다', () => {
      render(<ChatHeader {...defaultProps} onToggleHistoryDrawer={vi.fn()} isHistoryOpen={true} />);

      const historyBtn = screen.getByRole('button', { name: '대화 기록 보기' });
      expect(historyBtn).toHaveAttribute('aria-expanded', 'true');
      expect(historyBtn).toHaveAttribute('aria-controls');
      expect(historyBtn.getAttribute('aria-controls')).toMatch(/^chat-history-(sidebar|drawer)$/);
    });
  });

  describe('새 대화 버튼 표시 조건 (!isDesktop || !isSidebarOpen)', () => {
    const originalMatchMedia = window.matchMedia;

    function mockViewportWidth(width: number) {
      window.matchMedia = ((query: string) => {
        const m = /\((min|max)-width:\s*(\d+)px\)/.exec(query);
        const matches = m ? (m[1] === 'min' ? width >= Number(m[2]) : width <= Number(m[2])) : false;
        return {
          matches,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        } as MediaQueryList;
      }) as typeof window.matchMedia;
    }

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it('shows 새 대화 below 1024px even when the sidebar is open, and calls onNewChat', () => {
      mockViewportWidth(800);
      const handleNewChat = vi.fn();
      render(<ChatHeader {...defaultProps} onNewChat={handleNewChat} isSidebarOpen={true} />);

      const newChatBtn = screen.getByRole('button', { name: /새 대화/i });
      fireEvent.click(newChatBtn);

      expect(handleNewChat).toHaveBeenCalledTimes(1);
    });

    it('hides 새 대화 at 1024px and above while the sidebar is open', () => {
      mockViewportWidth(1280);
      render(<ChatHeader {...defaultProps} isSidebarOpen={true} />);

      expect(screen.queryByRole('button', { name: /새 대화/i })).not.toBeInTheDocument();
    });
  });
});
