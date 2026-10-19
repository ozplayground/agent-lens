import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatHistoryDrawer from '@/components/chat/ChatHistoryDrawer';
import SessionItemCard from '@/components/chat/SessionItemCard';
import DeleteConfirmPopover from '@/components/chat/DeleteConfirmPopover';
import SessionList from '@/components/chat/SessionList';
import { ChatSessionMeta } from '@/types/chat';

const mockSessions: ChatSessionMeta[] = [
  {
    id: 'session-1',
    title: 'LangGraph v0.2 아키텍처 분석 및 구현 방안',
    createdAt: '2026-09-28T08:00:00Z',
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    messageCount: 4,
    scopeMode: 'scoped',
    activeSourceId: 101,
    activeSourceTitle: 'FastMCP Production Deployment',
    lastMessagePreview: 'FastMCP 서버 배포는 Docker 컨테이너를...',
  },
  {
    id: 'session-2',
    title: '글로벌 AI 트렌드 종합 리포트 질문',
    createdAt: '2026-09-27T10:00:00Z',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    messageCount: 2,
    scopeMode: 'global',
    lastMessagePreview: '최신 AI 트렌드 4대 핵심 축은 다음과 같습니다.',
  },
  {
    id: 'session-3',
    title: '어제 진행한 대화 세션',
    createdAt: '2026-09-26T10:00:00Z',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), // 25 hours ago (yesterday)
    messageCount: 1,
    scopeMode: 'global',
    lastMessagePreview: '안녕하세요.',
  },
];

describe('ChatSidebar & Session UI Components (FUNC-CHAT-012 TDD)', () => {
  describe('ChatSidebar (Desktop Panel)', () => {
    it('renders desktop navigation panel with header, + 새 대화 button, search input, and session items', () => {
      const handleNewChat = vi.fn();
      const handleSearchChange = vi.fn();
      const handleSelectSession = vi.fn();
      const handleDeleteSession = vi.fn().mockResolvedValue(undefined);
      const handleToggleCollapse = vi.fn();

      render(
        <ChatSidebar
          sessions={mockSessions}
          activeSessionId="session-1"
          isOpen={true}
          searchQuery=""
          onSearchChange={handleSearchChange}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onToggleCollapse={handleToggleCollapse}
        />
      );

      // 1. Navigation Landmark
      const nav = screen.getByRole('navigation', { name: /대화 기록 목록/i });
      expect(nav).toBeInTheDocument();

      // 2. Header with + 새 대화 button
      const newChatBtn = screen.getByRole('button', { name: /\+ 새 대화|새 대화/i });
      expect(newChatBtn).toBeInTheDocument();
      fireEvent.click(newChatBtn);
      expect(handleNewChat).toHaveBeenCalledTimes(1);

      // 3. Search input
      const searchInput = screen.getByRole('textbox', { name: /대화 검색|세션 검색/i });
      expect(searchInput).toBeInTheDocument();
      fireEvent.change(searchInput, { target: { value: 'LangGraph' } });
      expect(handleSearchChange).toHaveBeenCalledWith('LangGraph');

      // 4. Session Items rendered
      expect(screen.getByText(/LangGraph v0.2 아키텍처/i)).toBeInTheDocument();
      expect(screen.getByText(/글로벌 AI 트렌드/i)).toBeInTheDocument();
    });

    it('filters session items based on searchQuery', () => {
      render(
        <ChatSidebar
          sessions={mockSessions}
          activeSessionId={null}
          isOpen={true}
          searchQuery="LangGraph"
          onSearchChange={vi.fn()}
          onSelectSession={vi.fn()}
          onNewChat={vi.fn()}
          onDeleteSession={vi.fn().mockResolvedValue(undefined)}
          onToggleCollapse={vi.fn()}
        />
      );

      expect(screen.getByText(/LangGraph v0.2 아키텍처/i)).toBeInTheDocument();
      expect(screen.queryByText(/글로벌 AI 트렌드/i)).not.toBeInTheDocument();
    });

    it('renders skeleton loading state when isLoading is true', () => {
      render(
        <ChatSidebar
          sessions={[]}
          activeSessionId={null}
          isOpen={true}
          isLoading={true}
          searchQuery=""
          onSearchChange={vi.fn()}
          onSelectSession={vi.fn()}
          onNewChat={vi.fn()}
          onDeleteSession={vi.fn().mockResolvedValue(undefined)}
          onToggleCollapse={vi.fn()}
        />
      );

      expect(screen.getByTestId('session-list-skeleton')).toBeInTheDocument();
    });

    it('renders error state and triggers retry when load fails', () => {
      const handleRetry = vi.fn();
      render(
        <ChatSidebar
          sessions={[]}
          activeSessionId={null}
          isOpen={true}
          error="세션 목록을 불러오지 못했습니다."
          onRetryLoad={handleRetry}
          searchQuery=""
          onSearchChange={vi.fn()}
          onSelectSession={vi.fn()}
          onNewChat={vi.fn()}
          onDeleteSession={vi.fn().mockResolvedValue(undefined)}
          onToggleCollapse={vi.fn()}
        />
      );

      expect(screen.getByText(/세션 목록을 불러오지 못했습니다/i)).toBeInTheDocument();
      const retryBtn = screen.getByRole('button', { name: /다시 시도|재시도/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('renders empty state when there are no saved sessions', () => {
      render(
        <ChatSidebar
          sessions={[]}
          activeSessionId={null}
          isOpen={true}
          searchQuery=""
          onSearchChange={vi.fn()}
          onSelectSession={vi.fn()}
          onNewChat={vi.fn()}
          onDeleteSession={vi.fn().mockResolvedValue(undefined)}
          onToggleCollapse={vi.fn()}
        />
      );

      expect(screen.getByText(/저장된 대화 기록이 없습니다|대화 기록이 없습니다/i)).toBeInTheDocument();
    });
  });

  describe('ChatHistoryDrawer (Mobile Slide-over)', () => {
    it('renders mobile slide-over drawer with backdrop and close button when isOpen is true', () => {
      const handleClose = vi.fn();
      render(
        <ChatHistoryDrawer
          isOpen={true}
          onClose={handleClose}
          sessions={mockSessions}
          activeSessionId="session-1"
          searchQuery=""
          onSearchChange={vi.fn()}
          onSelectSession={vi.fn()}
          onNewChat={vi.fn()}
          onDeleteSession={vi.fn().mockResolvedValue(undefined)}
        />
      );

      // Backdrop exists
      const backdrop = screen.getByTestId('drawer-backdrop');
      expect(backdrop).toBeInTheDocument();

      // Close button exists and works
      const closeBtn = screen.getByRole('button', { name: /대화 기록 드로어 닫기|드로어 닫기|닫기/i });
      expect(closeBtn).toBeInTheDocument();
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Sessions are rendered inside drawer
      expect(screen.getByText(/LangGraph v0.2 아키텍처/i)).toBeInTheDocument();
    });

    it('calls onClose when backdrop is clicked or Escape key is pressed', () => {
      const handleClose = vi.fn();
      render(
        <ChatHistoryDrawer
          isOpen={true}
          onClose={handleClose}
          sessions={mockSessions}
          activeSessionId="session-1"
          searchQuery=""
          onSearchChange={vi.fn()}
          onSelectSession={vi.fn()}
          onNewChat={vi.fn()}
          onDeleteSession={vi.fn().mockResolvedValue(undefined)}
        />
      );

      const backdrop = screen.getByTestId('drawer-backdrop');
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('SessionItemCard & DeleteConfirmPopover', () => {
    it('renders active session highlight with border-l-indigo-600 and bg-indigo-50', () => {
      const handleSelect = vi.fn();
      const handleDelete = vi.fn().mockResolvedValue(undefined);

      render(
        <SessionItemCard
          session={mockSessions[0]}
          isActive={true}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      );

      const card = screen.getByRole('button', { name: /대화:.*LangGraph/i });
      expect(card).toHaveAttribute('aria-current', 'true');
      expect(card.className).toContain('border-l-indigo-600');
      expect(card.className).toContain('bg-indigo-50');
    });

    it('renders truncated title, relative time, and scope badge', () => {
      render(
        <SessionItemCard
          session={mockSessions[0]} // Scoped session
          isActive={false}
          onSelect={vi.fn()}
          onDelete={vi.fn().mockResolvedValue(undefined)}
        />
      );

      // Scope badge
      expect(screen.getByText(/Scoped/i)).toBeInTheDocument();
      // Relative time (5 minutes ago -> "5분 전")
      expect(screen.getByText(/5분 전/i)).toBeInTheDocument();
      // Title
      expect(screen.getByText(/LangGraph v0.2 아키텍처/i)).toBeInTheDocument();
    });

    it('opens delete confirmation popover on delete click, cancels on 취소, and executes onDelete on 삭제', async () => {
      const handleDelete = vi.fn().mockResolvedValue(undefined);

      render(
        <SessionItemCard
          session={mockSessions[0]}
          isActive={false}
          onSelect={vi.fn()}
          onDelete={handleDelete}
        />
      );

      // Click delete button
      const deleteBtn = screen.getByRole('button', { name: /삭제/i });
      fireEvent.click(deleteBtn);

      // Popover should appear
      const popover = await screen.findByRole('dialog', { name: /대화 삭제|이 대화를 삭제하시겠습니까/i });
      expect(popover).toBeInTheDocument();

      // Test 취소 button
      const cancelBtn = screen.getByRole('button', { name: /취소/i });
      fireEvent.click(cancelBtn);
      expect(handleDelete).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog', { name: /대화 삭제|이 대화를 삭제하시겠습니까/i })).not.toBeInTheDocument();

      // Open popover again and click confirm
      fireEvent.click(deleteBtn);
      const confirmDeleteBtn = await screen.findByRole('button', { name: /^삭제$|삭제 확정/i });
      fireEvent.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(handleDelete).toHaveBeenCalledWith('session-1');
      });
    });
  });
});
