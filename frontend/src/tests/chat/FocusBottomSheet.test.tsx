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
    expect(screen.getByRole('button', { name: /하네스 & 벤치마크/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /MCP & 생태계/ })).toBeInTheDocument();

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
    const mcpBtn = screen.getByRole('button', { name: /MCP & 생태계/ });
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

  it('does not display matching count badge or alert when targetCount is undefined (initial clean state)', () => {
    render(
      <FocusBottomSheet
        isOpen={true}
        onClose={vi.fn()}
        filters={DEFAULT_FOCUS_FILTERS}
        onApplyFilters={vi.fn()}
        onResetFilters={vi.fn()}
      />
    );

    expect(screen.queryByText(/매칭 소식/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/선택 조건의 소식이 없습니다/i)).not.toBeInTheDocument();
  });
  it('labels the category chips with 전체 소식 and the long category labels, in order (R40)', () => {
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

    const expected = ['전체 소식', '하네스 & 벤치마크', 'MCP & 생태계', '에이전트 아키텍처', '최신 AI 동향'];
    const chipTexts = screen
      .getAllByRole('button')
      .map((button) => button.textContent?.trim() ?? '')
      .filter((text) => expected.includes(text));
    expect(chipTexts).toEqual(expected);
    expect(screen.queryByRole('button', { name: /하네스·평가|MCP·도구|에이전트 기술|AI 뉴스/ })).toBeNull();
  });
});

describe('FocusBottomSheet — 고신호 라벨 (spec-writer 지적, D-25 원칙)', () => {
  it('고신호 판정 기준 숫자를 라벨에 박지 않는다 (판정은 backend is_high_signal)', () => {
    render(
      <FocusBottomSheet
        isOpen
        onClose={vi.fn()}
        filters={DEFAULT_FOCUS_FILTERS}
        onApplyFilters={vi.fn()}
        onResetFilters={vi.fn()}
        targetCount={5}
      />
    );
    expect(screen.getByText('Must-Read 고신호만')).toBeInTheDocument();
    expect(screen.queryByText(/품질 \d/)).not.toBeInTheDocument();
  });
});
