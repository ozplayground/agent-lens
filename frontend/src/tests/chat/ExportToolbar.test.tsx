import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ExportToolbar from '@/components/chat/ExportToolbar';

describe('ExportToolbar Component (Cycle 4 - TDD)', () => {
  const defaultProps = {
    markdownContent: '## 1. 핵심 아키텍처\n내용입니다.\n## 2. 코드 예시\n```ts\nconst a = 1;\n```',
    sourceTitle: 'AgentLens MCP Architecture',
    isStreaming: false,
    onCopySuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders copy markdown and download .md buttons only (FE-22: no fake Notion sync)', () => {
    render(<ExportToolbar {...defaultProps} />);

    const toolbar = screen.getByRole('group', { name: '리포트 익스포트 툴바' });
    expect(within(toolbar).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      '마크다운 복사',
      '.md 다운로드',
    ]);
    expect(screen.queryByRole('button', { name: /Notion/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Notion 연동/)).not.toBeInTheDocument();
  });

  it('copies markdown content to clipboard and shows feedback', async () => {
    render(<ExportToolbar {...defaultProps} />);

    const copyBtn = screen.getByRole('button', { name: /마크다운 복사/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultProps.markdownContent);
    expect(await screen.findByText(/복사됨/i)).toBeInTheDocument();
    expect(defaultProps.onCopySuccess).toHaveBeenCalled();
  });

  it('triggers .md file download with blob', () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    render(<ExportToolbar {...defaultProps} />);

    const downloadBtn = screen.getByRole('button', { name: /\.md 다운로드/i });
    fireEvent.click(downloadBtn);

    expect(createObjectURLMock).toHaveBeenCalled();
  });

  it('disables buttons when isStreaming is true', () => {
    render(<ExportToolbar {...defaultProps} isStreaming={true} />);

    const copyBtn = screen.getByRole('button', { name: /마크다운 복사/i });
    const downloadBtn = screen.getByRole('button', { name: /\.md 다운로드/i });

    expect(copyBtn).toBeDisabled();
    expect(downloadBtn).toBeDisabled();
  });
});
