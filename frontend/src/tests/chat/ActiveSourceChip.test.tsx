import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActiveSourceChip from '@/components/chat/ActiveSourceChip';
import { mockArticles } from '@/mocks/fixtures/chat';

describe('ActiveSourceChip Component', () => {
  const sampleArticle = mockArticles[101];

  it('renders category and title accurately', () => {
    render(
      <ActiveSourceChip
        source={sampleArticle}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText(/FastMCP/i)).toBeInTheDocument();
    expect(screen.getByText('mcp_plugins_skills')).toBeInTheDocument();
  });

  it('calls onRemove when the remove button is clicked', () => {
    const handleRemove = vi.fn();
    render(
      <ActiveSourceChip
        source={sampleArticle}
        onRemove={handleRemove}
      />
    );

    const removeBtn = screen.getByRole('button', { name: /기사 컨텍스트 해제|삭제|제거|닫기/i });
    fireEvent.click(removeBtn);

    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('does not trigger onRemove when disabled', () => {
    const handleRemove = vi.fn();
    render(
      <ActiveSourceChip
        source={sampleArticle}
        onRemove={handleRemove}
        disabled={true}
      />
    );

    const removeBtn = screen.getByRole('button', { name: /기사 컨텍스트 해제|삭제|제거|닫기/i });
    fireEvent.click(removeBtn);

    expect(handleRemove).not.toHaveBeenCalled();
    expect(removeBtn).toBeDisabled();
  });

  it('calls onPreviewClick when title or preview button is clicked', () => {
    const handlePreview = vi.fn();
    render(
      <ActiveSourceChip
        source={sampleArticle}
        onRemove={vi.fn()}
        onPreviewClick={handlePreview}
      />
    );

    const titleElem = screen.getByText(/FastMCP/i);
    fireEvent.click(titleElem);

    expect(handlePreview).toHaveBeenCalledTimes(1);
    expect(handlePreview).toHaveBeenCalledWith(sampleArticle);
  });
});
