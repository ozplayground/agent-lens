import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatHistoryDrawer from '@/components/chat/ChatHistoryDrawer';
import { ChatSessionMeta } from '@/types/chat';

describe('ChatHistoryDrawer Component (Cycle 5 - TDD)', () => {
  const mockSessions: ChatSessionMeta[] = [
    {
      id: 'session-1',
      title: 'FastMCP 서버 구현 가이드',
      createdAt: '2026-10-15T10:00:00Z',
      updatedAt: '2026-10-15T12:00:00Z',
      messageCount: 4,
      scopeMode: 'scoped',
      created_at: '2026-10-15T10:00:00Z',
      updated_at: '2026-10-15T12:00:00Z',
      message_count: 4,
      scope_mode: 'scoped',
      article_id: 101,
      article_title: 'FastMCP Framework',
    },
    {
      id: 'session-2',
      title: 'SWE-bench 리포트 분석',
      createdAt: '2026-10-14T08:00:00Z',
      updatedAt: '2026-10-14T09:30:00Z',
      messageCount: 6,
      scopeMode: 'global',
      created_at: '2026-10-14T08:00:00Z',
      updated_at: '2026-10-14T09:30:00Z',
      message_count: 6,
      scope_mode: 'global',
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    sessions: mockSessions,
    activeSessionId: 'session-1',
    isLoading: false,
    error: null,
    searchQuery: '',
    onSearchChange: vi.fn(),
    onSelectSession: vi.fn(),
    onNewChat: vi.fn(),
    onDeleteSession: vi.fn().mockResolvedValue(undefined),
    onRetryLoad: vi.fn(),
    isStreaming: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<ChatHistoryDrawer {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('navigation', { name: '대화 기록 목록' })).not.toBeInTheDocument();
  });

  it('renders drawer with navigation role and title when isOpen is true', () => {
    render(<ChatHistoryDrawer {...defaultProps} />);

    expect(screen.getByRole('navigation', { name: '대화 기록 목록' })).toBeInTheDocument();
    expect(screen.getByText('대화 기록')).toBeInTheDocument();
    expect(screen.getByText('FastMCP 서버 구현 가이드')).toBeInTheDocument();
    expect(screen.getByText('SWE-bench 리포트 분석')).toBeInTheDocument();
  });

  it('calls onClose when backdrop or close button is clicked', () => {
    render(<ChatHistoryDrawer {...defaultProps} />);

    const backdrop = screen.getByTestId('drawer-backdrop');
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByLabelText(/대화 기록 드로어 닫기/i);
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<ChatHistoryDrawer {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onNewChat and onClose when + 새 대화 button is clicked', () => {
    render(<ChatHistoryDrawer {...defaultProps} />);

    const newChatBtn = screen.getByRole('button', { name: /\+ 새 대화/i });
    fireEvent.click(newChatBtn);

    expect(defaultProps.onNewChat).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSelectSession and onClose when a session card is clicked', () => {
    render(<ChatHistoryDrawer {...defaultProps} />);

    const sessionCard = screen.getByText('SWE-bench 리포트 분석');
    fireEvent.click(sessionCard);

    expect(defaultProps.onSelectSession).toHaveBeenCalledWith('session-2');
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders Loading State with skeletons when isLoading is true', () => {
    render(<ChatHistoryDrawer {...defaultProps} isLoading={true} sessions={[]} />);

    expect(screen.getByTestId('session-list-skeleton')).toBeInTheDocument();
  });

  it('renders Error State with retry button when error is present', () => {
    render(
      <ChatHistoryDrawer
        {...defaultProps}
        error="세션 목록을 불러오지 못했습니다."
        sessions={[]}
      />
    );

    expect(screen.getByText('세션 목록을 불러오지 못했습니다.')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /다시 시도/i });
    fireEvent.click(retryBtn);

    expect(defaultProps.onRetryLoad).toHaveBeenCalledTimes(1);
  });

  it('renders Empty State when sessions array is empty', () => {
    render(<ChatHistoryDrawer {...defaultProps} sessions={[]} />);

    expect(screen.getByText(/저장된 대화 기록이 없습니다/i)).toBeInTheDocument();
  });

  it('triggers delete session confirmation popover and calls onDeleteSession', async () => {
    render(<ChatHistoryDrawer {...defaultProps} />);

    const deleteBtns = screen.getAllByTitle('대화 삭제');
    fireEvent.click(deleteBtns[0]);

    // Delete confirm popover appears
    expect(screen.getByText(/이 대화를 삭제하시겠습니까/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: '삭제' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(defaultProps.onDeleteSession).toHaveBeenCalledWith('session-1');
    });
  });
});
