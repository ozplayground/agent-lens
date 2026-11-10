import { describe, it, expect, vi, afterEach, onTestFinished } from 'vitest';
import { useState } from 'react';
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import NewsDetailModal from '@/components/NewsDetailModal';
import { mockNewsItems } from '@/mocks/handlers';
import type { NewsItem } from '@/types/news';
import { http, HttpResponse, delay } from 'msw';
import { ASK_STREAM_FIRST_BYTE_TIMEOUT_MS } from '@/lib/api';
import { server } from '@/mocks/server';

function deferred() {
  let release: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn(() => null) }),
  usePathname: () => '',
}));

const baseItem = mockNewsItems[0];
const item: NewsItem = {
  ...baseItem,
  why_it_matters: baseItem.why_it_matters || '개발자에게 중요한 이유',
  tldr_bullets: baseItem.tldr_bullets?.length ? baseItem.tldr_bullets : ['첫째 요점'],
  tech_stack: baseItem.tech_stack?.length ? baseItem.tech_stack : ['Python'],
  summary: baseItem.summary || '상세 요약 본문',
};

afterEach(() => {
  vi.restoreAllMocks();
  document.body.style.overflow = '';
});

function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        다시 열기
      </button>
      <NewsDetailModal
        item={item}
        isOpen={open}
        onClose={() => {
          setOpen(false);
          onClose();
        }}
        isBookmarked={false}
        onToggleBookmark={vi.fn()}
      />
    </>
  );
}

describe('NewsDetailModal', () => {
  it('is a modal dialog labelled by the article title', () => {
    render(<Harness />);
    const dialog = screen.getByRole('dialog', { name: item.title });
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    const heading = document.getElementById(labelId as string);
    expect(heading?.tagName).toBe('H2');
    expect(heading).toHaveTextContent(item.title);
  });

  it('shows the summary tab first with Korean section headings', () => {
    render(<Harness />);
    const dialog = screen.getByRole('dialog', { name: item.title });
    const summaryTab = within(dialog).getByRole('tab', { name: 'AI 요약 & 시사점' });
    expect(summaryTab).toHaveAttribute('aria-selected', 'true');

    const panel = within(dialog).getByRole('tabpanel');
    expect(within(panel).getByRole('heading', { name: '개발자 시사점' })).toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: '핵심 정리 (규칙 기반 자동 추출)' })).toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: '기술 스택' })).toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: '상세 본문 요약' })).toBeInTheDocument();
    expect(screen.queryByText('3-Bullet Executive TL;DR')).not.toBeInTheDocument();

    // 핸드오버 버튼은 하나
    expect(within(dialog).getAllByRole('button', { name: /^AI 챗에서 분석/ })).toHaveLength(1);
  });

  it('질문 직후 meta 를 받기 전에는 엔진 이름을 지어내지 않고, meta 를 받으면 그 엔진을 보인다 (FE-25, D-25)', async () => {
    const gate = deferred();
    server.use(
      http.post('*/api/news/:news_id/ask/stream', async () => {
        await gate.promise;
        const body = [
          `data: ${JSON.stringify({ event: 'meta', model: 'AgentLens Heuristic Engine' })}\n\n`,
          `data: ${JSON.stringify({ event: 'token', text: '규칙 기반 답변' })}\n\n`,
          `data: ${JSON.stringify({ event: 'done', total_text: '규칙 기반 답변' })}\n\n`,
        ].join('');
        return new HttpResponse(body, { headers: { 'Content-Type': 'text/event-stream' } });
      })
    );
    render(<Harness />);
    fireEvent.click(screen.getByRole('tab', { name: /^AI 질의응답/ }));
    fireEvent.click(screen.getByRole('button', { name: '핵심 원리 및 구조' }));

    expect(await screen.findByText(/핵심 동작 원리와 아키텍처 구조/)).toBeInTheDocument();
    expect(screen.queryByText(/Gemini/)).not.toBeInTheDocument();

    gate.release();
    expect(await screen.findByText('응답 엔진: AgentLens Heuristic Engine')).toBeInTheDocument();
    expect(await screen.findByText('규칙 기반 답변')).toBeInTheDocument();
    expect(screen.queryByText(/Gemini/)).not.toBeInTheDocument();
  });

  it.each([
    [
      'error 이벤트',
      { event: 'error', error_code: 'ERR_LLM_STREAM_FAILED', message: '답변 생성이 중간에 끊겼습니다. 다시 시도해 주세요.', retryable: true },
    ],
    ['done 없이 끝남', null],
  ])('스트림이 끊기면(%s) 부분 답을 완료로 보이지 않고 오류와 다시 시도를 보이며, 다시 시도하면 같은 질문을 새로 보낸다', async (_label, last) => {
    let calls = 0;
    server.use(
      http.post('*/api/news/:news_id/ask/stream', () => {
        calls += 1;
        const events: unknown[] =
          calls === 1
            ? [{ event: 'meta', model: 'claude-sonnet-5-5' }, { event: 'token', text: '받은 부분 답' }, ...(last ? [last] : [])]
            : [{ event: 'meta', model: 'claude-sonnet-5-5' }, { event: 'token', text: '완성된 답' }, { event: 'done', total_text: '완성된 답' }];
        const body = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('');
        return new HttpResponse(body, { headers: { 'Content-Type': 'text/event-stream' } });
      })
    );
    render(<Harness />);
    fireEvent.click(screen.getByRole('tab', { name: /^AI 질의응답/ }));
    fireEvent.click(screen.getByRole('button', { name: '핵심 원리 및 구조' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('답변 생성이 중간에 끊겼습니다. 다시 시도해 주세요.');
    expect(screen.getByText('받은 부분 답')).toBeInTheDocument();
    expect(screen.getByTitle('답변 복사')).toBeDisabled();

    fireEvent.click(within(alert).getByRole('button', { name: '답변 다시 시도' }));
    expect(await screen.findByText('완성된 답')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('받은 부분 답')).not.toBeInTheDocument();
    expect(screen.getAllByText(/핵심 동작 원리와 아키텍처 구조/)).toHaveLength(1);
    expect(calls).toBe(2);
  });

  it('FE-43: 첫 응답 전에 시간 초과로 실패하면 스피너 대신 시간 초과 문구의 오류 알림과 답변 다시 시도를 보인다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    onTestFinished(() => {
      vi.useRealTimers();
    });
    server.use(
      http.post('*/api/news/:news_id/ask/stream', async () => {
        await delay('infinite');
        return new HttpResponse('');
      })
    );
    render(<Harness />);
    fireEvent.click(screen.getByRole('tab', { name: /^AI 질의응답/ }));
    fireEvent.click(screen.getByRole('button', { name: '핵심 원리 및 구조' }));
    expect(await screen.findByText(/AI가 실시간 스트리밍 답변을 생성하는 중/)).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(ASK_STREAM_FIRST_BYTE_TIMEOUT_MS + 10));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('응답이 늦어 요청을 멈췄습니다. 다시 시도해 주세요.');
    expect(within(alert).getByRole('button', { name: '답변 다시 시도' })).toBeInTheDocument();
    expect(screen.queryByText(/AI가 실시간 스트리밍 답변을 생성하는 중/)).not.toBeInTheDocument();
  });

  it('FE-43: 답이 하나도 오지 않은 채 연결이 실패해도 빈 본문 대신 오류 알림과 답변 다시 시도를 보이고, 다시 시도로 답을 받는다', async () => {
    let calls = 0;
    server.use(
      http.post('*/api/news/:news_id/ask/stream', () => {
        calls += 1;
        if (calls === 1) return HttpResponse.error();
        const events = [{ event: 'meta', model: 'claude-sonnet-5-5' }, { event: 'token', text: '다시 받은 답' }, { event: 'done', total_text: '다시 받은 답' }];
        return new HttpResponse(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(''), {
          headers: { 'Content-Type': 'text/event-stream' },
        });
      })
    );
    render(<Harness />);
    fireEvent.click(screen.getByRole('tab', { name: /^AI 질의응답/ }));
    fireEvent.click(screen.getByRole('button', { name: '핵심 원리 및 구조' }));

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByRole('button', { name: '답변 다시 시도' })).toBeInTheDocument();
    expect(screen.queryByText(/AI가 실시간 스트리밍 답변을 생성하는 중/)).not.toBeInTheDocument();

    fireEvent.click(within(alert).getByRole('button', { name: '답변 다시 시도' }));
    expect(await screen.findByText('다시 받은 답')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('스트림 연결 자체가 실패하면 브라우저 원문(Failed to fetch) 대신 정한 문구와 다시 시도를 보인다', async () => {
    server.use(http.post('*/api/news/:news_id/ask/stream', () => HttpResponse.error()));
    render(<Harness />);
    fireEvent.click(screen.getByRole('tab', { name: /^AI 질의응답/ }));
    fireEvent.click(screen.getByRole('button', { name: '핵심 원리 및 구조' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('서버에 연결하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.');
    expect(alert).not.toHaveTextContent(/failed to fetch/i);
    expect(within(alert).getByRole('button', { name: '답변 다시 시도' })).toBeInTheDocument();
  });

  it('switches tabs with click and arrow keys', () => {
    render(<Harness />);
    const askTab = screen.getByRole('tab', { name: /^AI 질의응답/ });
    fireEvent.click(askTab);
    expect(askTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('이 소식에 대해 무엇이든 질문해보세요');
    expect(screen.getByRole('textbox', { name: '질문 입력' })).toBeInTheDocument();

    fireEvent.keyDown(askTab, { key: 'ArrowLeft' });
    const summaryTab = screen.getByRole('tab', { name: 'AI 요약 & 시사점' });
    expect(summaryTab).toHaveAttribute('aria-selected', 'true');
    expect(summaryTab).toHaveFocus();
  });

  it('opens a ConfirmDialog for 대화 초기화 without window.confirm, and clears on confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    render(<Harness />);

    fireEvent.click(screen.getByRole('tab', { name: /^AI 질의응답/ }));
    fireEvent.click(screen.getByRole('button', { name: '핵심 원리 및 구조' }));

    // 질문이 대화에 추가되고 탭 배지가 1 이 된다
    expect(await screen.findByText(/핵심 동작 원리와 아키텍처 구조/)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^AI 질의응답/ })).toHaveTextContent('1');

    fireEvent.click(await screen.findByRole('button', { name: '대화 초기화' }));
    const alert = screen.getByRole('alertdialog', { name: '대화 초기화' });
    expect(alert).toHaveAttribute('aria-modal', 'true');
    expect(within(alert).getByRole('button', { name: '취소' })).toHaveFocus();
    expect(confirmSpy).not.toHaveBeenCalled();

    // Escape 는 확인 창만 닫는다
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: item.title })).toBeInTheDocument();
    expect(screen.getByText(/핵심 동작 원리와 아키텍처 구조/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '대화 초기화' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '초기화' }));

    await waitFor(() => {
      expect(screen.queryByText(/핵심 동작 원리와 아키텍처 구조/)).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByText('이 소식에 대해 무엇이든 질문해보세요')).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('closes with Escape and resets to the summary tab when reopened', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.click(screen.getByRole('tab', { name: /^AI 질의응답/ }));

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다시 열기' }));
    expect(screen.getByRole('tab', { name: 'AI 요약 & 시사점' })).toHaveAttribute('aria-selected', 'true');
  });

  it('closes with the 닫기 button and the backdrop', () => {
    const onClose = vi.fn();
    const { rerender } = render(<Harness onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<Harness onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: '다시 열기' }));
    const backdrop = document.querySelector('.bg-scrim');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('shows the source label and the original link in the footer', () => {
    render(<Harness />);
    const link = screen.getByRole('link', { name: '원문 링크 방문' });
    expect(link).toHaveAttribute('href', item.url);
    expect(link).toHaveAttribute('target', '_blank');
  });
});

describe('NewsDetailModal 2차 (R26·R28)', () => {
  it('Escape in the Ask AI question input keeps the dialog, the text and moves focus to the Ask AI panel; the next Escape closes', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.click(screen.getByRole('tab', { name: /^AI 질의응답/ }));

    const input = screen.getByRole('textbox', { name: '질문 입력' });
    input.focus();
    fireEvent.change(input, { target: { value: '도입 비용은?' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: item.title })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '질문 입력' })).toHaveValue('도입 비용은?');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', screen.getByRole('tab', { name: /^AI 질의응답/ }).id);
    expect(document.activeElement).toBe(panel);

    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Escape during IME composition in the question input does nothing', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.click(screen.getByRole('tab', { name: /^AI 질의응답/ }));
    const input = screen.getByRole('textbox', { name: '질문 입력' });
    input.focus();
    fireEvent.keyDown(input, { key: 'Escape', isComposing: true });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: item.title })).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('shows 복사 실패 on the answer for 2 seconds when copying fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const clipboardDesc = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const execDesc = Object.getOwnPropertyDescriptor(document, 'execCommand');
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    Object.defineProperty(document, 'execCommand', { value: vi.fn(() => false), configurable: true, writable: true });
    onTestFinished(() => {
      if (clipboardDesc) Object.defineProperty(navigator, 'clipboard', clipboardDesc);
      else delete (navigator as unknown as Record<string, unknown>).clipboard;
      if (execDesc) Object.defineProperty(document, 'execCommand', execDesc);
      else delete (document as unknown as Record<string, unknown>).execCommand;
    });

    render(<Harness />);
    fireEvent.click(screen.getByRole('tab', { name: /^AI 질의응답/ }));
    fireEvent.click(screen.getByRole('button', { name: '핵심 원리 및 구조' }));

    const copyButton = await screen.findByTitle('답변 복사');
    await waitFor(() => expect(copyButton).not.toBeDisabled());

    fireEvent.click(copyButton);
    await waitFor(() => expect(screen.getByTitle('답변 복사')).toHaveTextContent('복사 실패'));
    expect(writeText).toHaveBeenCalled();
    const live = Array.from(document.querySelectorAll('[aria-live="polite"]')).filter(
      (el) => el.textContent === '복사 실패'
    );
    expect(live).toHaveLength(1);

    await waitFor(() => expect(screen.getByTitle('답변 복사')).not.toHaveTextContent('복사 실패'), {
      timeout: 3000,
    });
  });
});
