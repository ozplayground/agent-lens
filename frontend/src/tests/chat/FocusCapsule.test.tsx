import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FocusCapsule from '@/components/chat/FocusCapsule';
import { FocusFilters, DEFAULT_FOCUS_FILTERS } from '@/types/chat';

describe('FocusCapsule Component', () => {
  it('renders default capsule [🎯 Focus: 전체 소식 ▾] with 30px minimal height and a11y attributes', () => {
    const handleClick = vi.fn();
    const handleReset = vi.fn();

    render(
      <FocusCapsule
        filters={DEFAULT_FOCUS_FILTERS}
        onClick={handleClick}
        onReset={handleReset}
        isOpen={false}
      />
    );

    const capsule = screen.getByRole('button', { name: /지식 검색 포커스 필터/i });
    expect(capsule).toBeInTheDocument();
    expect(capsule).toHaveAttribute('aria-expanded', 'false');
    expect(capsule).toHaveAttribute('aria-haspopup', 'dialog');
    expect(screen.getByText(/전체 소식/i)).toBeInTheDocument();
  });

  it('triggers onClick when default capsule is clicked', () => {
    const handleClick = vi.fn();
    const handleReset = vi.fn();

    render(
      <FocusCapsule
        filters={DEFAULT_FOCUS_FILTERS}
        onClick={handleClick}
        onReset={handleReset}
        isOpen={false}
      />
    );

    const capsule = screen.getByRole('button', { name: /지식 검색 포커스 필터/i });
    fireEvent.click(capsule);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleReset).not.toHaveBeenCalled();
  });

  it('renders filtered capsule [🎯 Focus: MCP · 최근 7일 ✕] when filters are active', () => {
    const handleClick = vi.fn();
    const handleReset = vi.fn();
    const activeFilters: FocusFilters = {
      category: 'mcp_plugins_skills',
      timeRange: '7d',
      sort: 'hot',
      highSignalOnly: false,
    };

    render(
      <FocusCapsule
        filters={activeFilters}
        onClick={handleClick}
        onReset={handleReset}
        isOpen={false}
      />
    );

    expect(screen.getByText(/MCP/i)).toBeInTheDocument();
    expect(screen.getByText(/최근 7일/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /포커스 필터 초기화/i })).toBeInTheDocument();
  });

  it('triggers onReset and stops propagation when reset button ✕ is clicked', () => {
    const handleClick = vi.fn();
    const handleReset = vi.fn();
    const activeFilters: FocusFilters = {
      category: 'mcp_plugins_skills',
      timeRange: '7d',
      sort: 'hot',
      highSignalOnly: false,
    };

    render(
      <FocusCapsule
        filters={activeFilters}
        onClick={handleClick}
        onReset={handleReset}
        isOpen={false}
      />
    );

    const resetBtn = screen.getByRole('button', { name: /포커스 필터 초기화/i });
    fireEvent.click(resetBtn);

    expect(handleReset).toHaveBeenCalledTimes(1);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('adapts to scoped mode when scopedSource is provided', () => {
    const handleClick = vi.fn();
    const handleReset = vi.fn();

    render(
      <FocusCapsule
        filters={DEFAULT_FOCUS_FILTERS}
        scopedSource={{
          id: 101,
          title: 'FastMCP Framework',
          url: 'https://github.com',
          source: 'github',
          category: 'mcp_plugins_skills',
          quality_score: 9.3,
          published_at: '2026-09-15T08:00:00Z',
          summary: 'FastMCP summary',
          tldr_bullets: [],
          why_it_matters: '',
          tech_stack: [],
          tags: [],
          is_high_signal: true,
          hotness_score: 90,
        }}
        onClick={handleClick}
        onReset={handleReset}
        isOpen={false}
      />
    );

    expect(screen.getByText(/FastMCP Framework/i)).toBeInTheDocument();
  });
});
