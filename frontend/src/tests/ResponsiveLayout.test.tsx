import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatMessageItem from '@/components/chat/ChatMessageItem';
import MarkdownViewer from '@/components/MarkdownViewer';
import { ChatMessage } from '@/types/chat';

describe('Horizontal Scroll Defense (0px) & Responsive Layout (Cycle 6 - TDD)', () => {
  const ultraLongUnbrokenToken = 'A'.repeat(500);
  const ultraLongUrl = 'https://example.com/' + 'very-long-path-segment-without-spaces-'.repeat(25);

  const assistantMessageWithLongContent: ChatMessage = {
    id: 'msg-overflow-test',
    role: 'assistant',
    content: `Here is an unbroken string:\n${ultraLongUnbrokenToken}\nAnd a very long URL:\n${ultraLongUrl}\n\n| Col 1 | Col 2 | Col 3 | Col 4 | Col 5 |\n|---|---|---|---|---|\n| Very long table cell data 1 | Long data 2 | Long data 3 | Long data 4 | Long data 5 |\n\n\`\`\`typescript\nconst codeBlock = "${'B'.repeat(300)}";\n\`\`\``,
    timestamp: '2026-10-16T12:00:00Z',
    scope: 'global',
    status: 'completed',
  };

  it('enforces min-w-0 and max-w-full flex constraints on ChatMessageItem container', () => {
    const { container } = render(<ChatMessageItem message={assistantMessageWithLongContent} />);

    // Top-level flex item container must have min-w-0
    const flexContainers = container.querySelectorAll('.min-w-0');
    expect(flexContainers.length).toBeGreaterThan(0);

    // Bubble container must have break-words and overflow-wrap anywhere
    const bubble = container.querySelector('.markdown-content');
    expect(bubble).toBeInTheDocument();
    expect(bubble?.className).toContain('min-w-0');
    expect(bubble?.className).toContain('max-w-full');
    expect(bubble?.className).toContain('break-words');
    expect(bubble?.className).toContain('[overflow-wrap:anywhere]');
  });

  it('isolates code block horizontal scrolling with overscroll-x-contain and local overflow-x-auto', () => {
    const { container } = render(<ChatMessageItem message={assistantMessageWithLongContent} />);

    const codeWrapper = container.querySelector('.code-block-wrapper');
    expect(codeWrapper).toBeInTheDocument();
    expect(codeWrapper?.className).toContain('min-w-0');
    expect(codeWrapper?.className).toContain('max-w-full');
    expect(codeWrapper?.className).toContain('overflow-hidden');

    const pre = container.querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(pre?.className).toContain('overflow-x-auto');
    expect(pre?.className).toContain('overscroll-x-contain');
  });

  it('isolates markdown table scrolling within div.table-wrapper with overscroll-x-contain', () => {
    const { container } = render(<ChatMessageItem message={assistantMessageWithLongContent} />);

    const tableWrapper = container.querySelector('.table-wrapper');
    expect(tableWrapper).toBeInTheDocument();
    expect(tableWrapper?.className).toContain('overflow-x-auto');
    expect(tableWrapper?.className).toContain('overscroll-x-contain');
  });

  it('ensures MarkdownViewer standalone component enforces 0px overflow classes', () => {
    const { container } = render(
      <MarkdownViewer
        content={`# Title\n${ultraLongUnbrokenToken}\n| Header A | Header B |\n|---|---|\n| Cell A | Cell B |`}
      />
    );

    const viewer = container.querySelector('.markdown-viewer');
    expect(viewer).toBeInTheDocument();
    expect(viewer?.className).toContain('min-w-0');
    expect(viewer?.className).toContain('max-w-full');
    expect(viewer?.className).toContain('break-words');
    expect(viewer?.className).toContain('[overflow-wrap:anywhere]');

    const tableWrapper = container.querySelector('.table-wrapper');
    expect(tableWrapper).toBeInTheDocument();
    expect(tableWrapper?.className).toContain('overscroll-x-contain');
  });
});
