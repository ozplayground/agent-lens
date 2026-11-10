import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatWorkspace from '@/components/chat/ChatWorkspace';
import { ChatMessage } from '@/types/chat';

/**
 * 스트리밍 중 다시 그리기·스크린 리더 안내 (FE-10, FE-14).
 * 마크다운 렌더 횟수는 react-markdown 을 감싼 대역으로 센다.
 */

const markdownRenders: string[] = [];

vi.mock('react-markdown', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-markdown')>();
  const Real = actual.default;
  function CountingMarkdown(props: React.ComponentProps<typeof Real>) {
    markdownRenders.push(String(props.children));
    return <Real {...props} />;
  }
  return { ...actual, default: CountingMarkdown };
});

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const noop = () => {};
const listProps = { onSelectPromptSuggestion: noop, onRetryMessage: noop, onCopyMessage: noop };

const previousTurn: ChatMessage[] = [
  { id: 'u1', role: 'user', content: '이전 질문', timestamp: '2026-11-10T00:00:00Z', scope: 'global', status: 'completed' },
  { id: 'a1', role: 'assistant', content: '이전 답변', timestamp: '2026-11-10T00:00:01Z', scope: 'global', status: 'completed' },
];
const streamingTurn = (content: string): ChatMessage[] => [
  { id: 'u2', role: 'user', content: '새 질문', timestamp: '2026-11-10T00:01:00Z', scope: 'global', status: 'sent' },
  { id: 'a2', role: 'assistant', content, timestamp: '2026-11-10T00:01:01Z', scope: 'global', status: 'streaming' },
];

function sse(chunks: string[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, 5));
      }
      controller.close();
    },
  });
  return new HttpResponse(stream, { headers: { 'Content-Type': 'text/event-stream' } });
}

function ask(question: string) {
  fireEvent.change(screen.getByRole('textbox', { name: /질문 입력/i }), { target: { value: question } });
  fireEvent.click(screen.getByRole('button', { name: /질문 전송/i }));
}

describe('스트리밍 다시 그리기 (FE-10)', () => {
  beforeEach(() => {
    markdownRenders.length = 0;
    localStorage.clear();
  });

  it('새 토큰이 와도 이미 끝난 답변의 마크다운은 다시 그리지 않는다', () => {
    const { rerender } = render(
      <ChatMessageList {...listProps} isStreaming streamingMessageId="a2" messages={[...previousTurn, ...streamingTurn('토')]} />
    );
    rerender(
      <ChatMessageList {...listProps} isStreaming streamingMessageId="a2" messages={[...previousTurn, ...streamingTurn('토큰')]} />
    );
    rerender(
      <ChatMessageList {...listProps} isStreaming streamingMessageId="a2" messages={[...previousTurn, ...streamingTurn('토큰들')]} />
    );

    expect(markdownRenders.filter((c) => c === '이전 답변')).toHaveLength(1);
    expect(screen.getByText('토큰들')).toBeInTheDocument();
  });

  it('챗 화면에서 두 번째 질문을 스트리밍하는 동안 첫 답변의 마크다운을 다시 그리지 않는다', async () => {
    let call = 0;
    server.use(
      http.post('*/api/chat/stream', () => {
        call += 1;
        if (call === 1) {
          return sse(['event: token\ndata: {"token":"첫 답변"}\n\n', 'event: done\ndata: {}\n\n']);
        }
        return sse([
          'event: token\ndata: {"token":"둘"}\n\n',
          'event: token\ndata: {"token":"째"}\n\n',
          'event: token\ndata: {"token":" 답변"}\n\n',
          'event: done\ndata: {}\n\n',
        ]);
      })
    );
    render(<ChatWorkspace />);

    ask('첫 질문');
    await waitFor(() => expect(screen.getByRole('button', { name: /질문 전송/i })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('첫 답변')).toBeInTheDocument());
    const before = markdownRenders.filter((c) => c === '첫 답변').length;

    ask('둘째 질문');
    await waitFor(() => expect(screen.getByText('둘째 답변')).toBeInTheDocument());

    // 두 번째 턴의 토큰 3개·상태 변화가 첫 답변을 다시 그리지 않는다
    expect(markdownRenders.filter((c) => c === '첫 답변').length).toBe(before);
  });
});

describe('챗 로그 스크린 리더 안내 (FE-14)', () => {
  it('스트리밍 중에는 로그가 바쁨 상태이고 글자 변경이 아닌 추가만 읽는다', () => {
    render(<ChatMessageList {...listProps} isStreaming streamingMessageId="a2" messages={streamingTurn('토큰')} />);

    const log = screen.getByRole('log');
    expect(log).toHaveAttribute('aria-busy', 'true');
    expect(log).toHaveAttribute('aria-relevant', 'additions');
    expect(screen.queryByText('답변이 완료되었습니다.')).not.toBeInTheDocument();
  });

  it('답이 끝나면 바쁨 상태를 풀고 완료를 한 번 알린다', () => {
    const { rerender } = render(
      <ChatMessageList {...listProps} isStreaming streamingMessageId="a2" messages={streamingTurn('토큰')} />
    );
    const done = streamingTurn('토큰 끝');
    done[1] = { ...done[1], status: 'completed' };
    rerender(<ChatMessageList {...listProps} isStreaming={false} messages={done} />);

    expect(screen.getByRole('log')).toHaveAttribute('aria-busy', 'false');
    const notice = screen.getByText('답변이 완료되었습니다.');
    expect(notice.closest('[role="status"]')).not.toBeNull();
  });
});
