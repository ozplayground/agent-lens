import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FocusBottomSheet from '@/components/chat/FocusBottomSheet';
import { DEFAULT_FOCUS_FILTERS } from '@/types/chat';

describe('FocusBottomSheet Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <FocusBottomSheet
        isOpen={false}
        onClose={vi.fn()}
        filters={DEFAULT_FOCUS_FILTERS}
        onApplyFilters={vi.fn()}
        onResetFilters={vi.fn()}
        targetCount={5}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal dialog with controls and a11y role when isOpen is true', () => {
    render(
      <FocusBottomSheet
        isOpen={true}
        onClose={vi.fn()}
        filters={DEFAULT_FOCUS_FILTERS}
        onApplyFilters={vi.fn()}
        onResetFilters={vi.fn()}
        targetCount={5}
      />
    );

    const dialog = screen.getByRole('dialog', { name: /수집 소식 타깃팅 포커스 필터/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Category chips
    expect(screen.getByRole('button', { name: /전체 소식/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /하네스·평가/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /MCP·도구/i })).toBeInTheDocument();

    // Time ranges
    expect(screen.getByRole('button', { name: /24시간/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /최근 7일/i })).toBeInTheDocument();

    // Sort options
    expect(screen.getByRole('button', { name: /화제순/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /최신순/i })).toBeInTheDocument();

    // High signal toggle
    expect(screen.getByRole('switch', { name: /Must-Read 고신호 전용 토글/i })).toBeInTheDocument();

    // Real-time prediction count
    expect(screen.getByText(/5건 매칭/i)).toBeInTheDocument();
  });

  it('displays guidance alert when targetCount is 0', () => {
    render(
      <FocusBottomSheet
        isOpen={true}
        onClose={vi.fn()}
        filters={DEFAULT_FOCUS_FILTERS}
        onApplyFilters={vi.fn()}
        onResetFilters={vi.fn()}
        targetCount={0}
      />
    );

    expect(screen.getByText(/선택 조건의 소식이 없습니다/i)).toBeInTheDocument();
  });

  it('allows manipulating filters and calls onApplyFilters with updated values', () => {
    const handleApply = vi.fn();
    const handleClose = vi.fn();

    render(
      <FocusBottomSheet
        isOpen={true}
        onClose={handleClose}
        filters={DEFAULT_FOCUS_FILTERS}
        onApplyFilters={handleApply}
        onResetFilters={vi.fn()}
        targetCount={3}
      />
    );

    // Select category MCP
    const mcpBtn = screen.getByRole('button', { name: /MCP·도구/i });
    fireEvent.click(mcpBtn);

    // Select time range 7d
    const sevenDaysBtn = screen.getByRole('button', { name: /최근 7일/i });
    fireEvent.click(sevenDaysBtn);

    // Toggle high signal
    const switchBtn = screen.getByRole('switch', { name: /Must-Read 고신호 전용 토글/i });
    fireEvent.click(switchBtn);

    // Click Apply
    const applyBtn = screen.getByRole('button', { name: /적용하기/i });
    fireEvent.click(applyBtn);

    expect(handleApply).toHaveBeenCalledWith({
      category: 'mcp_plugins_skills',
      timeRange: '7d',
      sort: 'hot',
      highSignalOnly: true,
    });
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls onResetFilters when 초기화 button is clicked', () => {
    const handleReset = vi.fn();

    render(
      <FocusBottomSheet
        isOpen={true}
        onClose={vi.fn()}
        filters={{
          category: 'mcp_plugins_skills',
          timeRange: '7d',
          sort: 'latest',
          highSignalOnly: true,
        }}
        onApplyFilters={vi.fn()}
        onResetFilters={handleReset}
        targetCount={2}
      />
    );

    const resetBtn = screen.getByRole('button', { name: /초기화/i });
    fireEvent.click(resetBtn);

    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click and Escape key press', () => {
    const handleClose = vi.fn();

    render(
      <FocusBottomSheet
        isOpen={true}
        onClose={handleClose}
        filters={DEFAULT_FOCUS_FILTERS}
        onApplyFilters={vi.fn()}
        onResetFilters={vi.fn()}
        targetCount={5}
      />
    );

    // Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Backdrop click
    const backdrop = screen.getByTestId('bottom-sheet-backdrop');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('detects 100px swipe-down gesture and triggers onClose', () => {
    const handleClose = vi.fn();

    render(
      <FocusBottomSheet
        isOpen={true}
        onClose={handleClose}
        filters={DEFAULT_FOCUS_FILTERS}
        onApplyFilters={vi.fn()}
        onResetFilters={vi.fn()}
        targetCount={5}
      />
    );

    const drawer = screen.getByRole('dialog');

    // Simulate touch drag down 120px
    fireEvent.touchStart(drawer, {
      touches: [{ clientY: 200 }],
    });
    fireEvent.touchEnd(drawer, {
      changedTouches: [{ clientY: 320 }],
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
