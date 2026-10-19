import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ChatWorkspace from '@/components/chat/ChatWorkspace';
import { resetMockSessionStore } from '@/mocks/handlers/chat';

// Mock next/navigation
const mockGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('ChatSessionWorkflow Integration (FUNC-CHAT-012 TDD)', () => {
  beforeEach(() => {
    mockGet.mockReturnValue(null);
    localStorage.clear();
    resetMockSessionStore();
    vi.clearAllMocks();
  });

  it('renders initial clean slate and generates new session UUID without auto-loading past session', async () => {
    render(<ChatWorkspace />);

    // Must show empty welcome view
    expect(screen.getByText(/AgentLens AI 챗 워크스페이스/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /질문 입력/i })).toBeInTheDocument();

    // Past sessions should be loaded in the sidebar
    await waitFor(() => {
      expect(screen.getByText(/LangGraph v0.2 아키텍처 분석/i)).toBeInTheDocument();
    });
  });

  it('hydrates full 4-pillar context (messages, scopeMode, activeSource) when selecting a past session', async () => {
    render(<ChatWorkspace />);

    // Wait for sidebar sessions to load
    const sessionCard = await screen.findByRole('button', {
      name: /대화:.*LangGraph v0.2 아키텍처 분석/i,
    });
    expect(sessionCard).toBeInTheDocument();

    // Click on the past session card
    fireEvent.click(sessionCard);

    // 1. Messages are hydrated
    await waitFor(() => {
      expect(screen.getByText(/LangGraph v0.2의 핵심 아키텍처/i)).toBeInTheDocument();
    });

    // 2. Scoped mode is restored
    const scopedBtn = screen.getByRole('button', { name: /단일 기사|Scoped/i });
    expect(scopedBtn).toHaveAttribute('aria-pressed', 'true');

    // 3. Active source chip is restored (Article 102: LangGraph v0.2 Production Multi-Agent)
    await waitFor(() => {
      expect(screen.getByText(/Production Multi-A/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /기사 컨텍스트 해제/i })).toBeInTheDocument();
    });
  });

  it('allows continuous multi-turn chat after session hydration', async () => {
    render(<ChatWorkspace />);

    // Select LangGraph session
    const sessionCard = await screen.findByRole('button', {
      name: /대화:.*LangGraph v0.2 아키텍처 분석/i,
    });
    fireEvent.click(sessionCard);

    await waitFor(() => {
      expect(screen.getByText(/LangGraph v0.2의 핵심 아키텍처/i)).toBeInTheDocument();
    });

    // Send a follow-up question
    const textarea = screen.getByRole('textbox', { name: /질문 입력/i });
    const sendButton = screen.getByRole('button', { name: /질문 전송/i });

    fireEvent.change(textarea, { target: { value: '후속 질문: 상태 그래프 컴파일 방식은?' } });
    fireEvent.click(sendButton);

    // Verify user follow-up is added
    expect(screen.getByText('후속 질문: 상태 그래프 컴파일 방식은?')).toBeInTheDocument();

    // Verify streaming answer completes
    await waitFor(
      () => {
        expect(screen.getByText(/Model Context Protocol/i)).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });

  it('resets to new session and empty state when "+ 새 대화" is clicked', async () => {
    render(<ChatWorkspace />);

    // Select a past session first
    const sessionCard = await screen.findByRole('button', {
      name: /대화:.*LangGraph v0.2 아키텍처 분석/i,
    });
    fireEvent.click(sessionCard);

    await waitFor(() => {
      expect(screen.getByText(/LangGraph v0.2의 핵심 아키텍처/i)).toBeInTheDocument();
    });

    // Click "+ 새 대화" button in sidebar or header
    const newChatBtns = screen.getAllByRole('button', { name: /새 대화/i });
    fireEvent.click(newChatBtns[0]);

    // Verifies it returns to welcome state
    expect(screen.getByText(/AgentLens AI 챗 워크스페이스/i)).toBeInTheDocument();
    expect(screen.queryByText(/LangGraph v0.2의 핵심 아키텍처/i)).not.toBeInTheDocument();
  });

  it('deletes a session via DELETE API and resets active conversation if deleted session was active', async () => {
    render(<ChatWorkspace />);

    // Select the session
    const sessionCard = await screen.findByRole('button', {
      name: /대화:.*LangGraph v0.2 아키텍처 분석/i,
    });
    fireEvent.click(sessionCard);

    await waitFor(() => {
      expect(screen.getByText(/LangGraph v0.2의 핵심 아키텍처/i)).toBeInTheDocument();
    });

    // Find delete button within this card
    const deleteBtn = within(sessionCard).getByRole('button', { name: /삭제/i });
    fireEvent.click(deleteBtn);

    // Confirm deletion in popover
    const confirmBtn = await screen.findByRole('button', { name: /^삭제$|삭제 확정/i });
    fireEvent.click(confirmBtn);

    // Wait for deletion from store and UI reset
    await waitFor(() => {
      expect(screen.queryByText(/LangGraph v0.2의 핵심 아키텍처/i)).not.toBeInTheDocument();
    });

    // Returns to welcome view
    expect(screen.getByText(/AgentLens AI 챗 워크스페이스/i)).toBeInTheDocument();
  });
});
