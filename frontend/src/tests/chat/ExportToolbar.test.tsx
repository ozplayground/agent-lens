import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExportToolbar from '@/components/chat/ExportToolbar';

describe('ExportToolbar Component (Cycle 4 - TDD)', () => {
  const defaultProps = {
    messageId: 'msg-123',
    markdownContent: '## 1. 핵심 아키텍처\n내용입니다.\n## 2. 코드 예시\n```ts\nconst a = 1;\n```',
    sourceTitle: 'AgentLens MCP Architecture',
    isStreaming: false,
    onCopySuccess: vi.fn(),
    onNotionSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders copy markdown, download .md, and notion sync buttons', () => {
    render(<ExportToolbar {...defaultProps} />);

    expect(screen.getByRole('button', { name: /마크다운 복사/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\.md 다운로드/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Notion/i })).toBeInTheDocument();
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
    const notionBtn = screen.getByRole('button', { name: /Notion/i });

    expect(copyBtn).toBeDisabled();
    expect(downloadBtn).toBeDisabled();
    expect(notionBtn).toBeDisabled();
  });

  it('handles Notion sync and triggers callback', async () => {
    render(<ExportToolbar {...defaultProps} />);

    const notionBtn = screen.getByRole('button', { name: /Notion/i });
    fireEvent.click(notionBtn);

    await waitFor(() => {
      expect(defaultProps.onNotionSuccess).toHaveBeenCalled();
    });
  });
});
