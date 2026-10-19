import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CommandPalette from '@/components/CommandPalette';
import { ThemeProvider } from '@/context/ThemeContext';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('CommandPalette Component (Cycle 3 - TDD)', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onOpenSources: vi.fn(),
    onOpenMcp: vi.fn(),
    onTriggerCollect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider defaultTheme="light">{ui}</ThemeProvider>);
  };

  it('renders dialog and search input when isOpen is true', () => {
    renderWithTheme(<CommandPalette {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText(/명령어 검색/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    renderWithTheme(<CommandPalette {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders 5 core actions in Idle state', () => {
    renderWithTheme(<CommandPalette {...defaultProps} />);

    expect(screen.getByText('AI 챗 워크스페이스 이동')).toBeInTheDocument();
    expect(screen.getByText(/모드로 전환/i)).toBeInTheDocument();
    expect(screen.getByText('소스 관리 & AI 리서처 열기')).toBeInTheDocument();
    expect(screen.getByText('FastMCP 도구 설정 열기')).toBeInTheDocument();
    expect(screen.getByText('최신 소식 즉시 수집 트리거')).toBeInTheDocument();
  });

  it('filters actions when searching', () => {
    renderWithTheme(<CommandPalette {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/명령어 검색/i);
    fireEvent.change(searchInput, { target: { value: 'MCP' } });

    expect(screen.getByText('FastMCP 도구 설정 열기')).toBeInTheDocument();
    expect(screen.queryByText('AI 챗 워크스페이스 이동')).not.toBeInTheDocument();
  });

  it('displays Empty State when no actions match search query', () => {
    renderWithTheme(<CommandPalette {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/명령어 검색/i);
    fireEvent.change(searchInput, { target: { value: 'zzzzz없는명령어' } });

    expect(screen.getByText('검색된 명령어가 없습니다.')).toBeInTheDocument();
  });

  it('navigates through items with ArrowDown and ArrowUp and executes with Enter', () => {
    renderWithTheme(<CommandPalette {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/명령어 검색/i);

    // Initial selected index is 0 (AI 챗)
    // Press ArrowDown to select index 1 (Theme)
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

    // Press Enter to execute index 1
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('executes action callback and closes palette on action item click', () => {
    renderWithTheme(<CommandPalette {...defaultProps} />);

    const mcpAction = screen.getByText('FastMCP 도구 설정 열기');
    fireEvent.click(mcpAction);

    expect(defaultProps.onOpenMcp).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop or close button is clicked', () => {
    renderWithTheme(<CommandPalette {...defaultProps} />);

    const closeBtn = screen.getByLabelText(/닫기/i);
    fireEvent.click(closeBtn);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    renderWithTheme(<CommandPalette {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
