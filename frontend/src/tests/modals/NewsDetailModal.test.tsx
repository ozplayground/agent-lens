import { describe, it, expect, vi, afterEach, onTestFinished } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import NewsDetailModal from '@/components/NewsDetailModal';
import { mockNewsItems } from '@/mocks/handlers';
import type { NewsItem } from '@/types/news';

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
    expect(within(panel).getByRole('heading', { name: '핵심 요약 3줄' })).toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: '기술 스택' })).toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: '상세 본문 요약' })).toBeInTheDocument();
    expect(screen.queryByText('3-Bullet Executive TL;DR')).not.toBeInTheDocument();

    // 핸드오버 버튼은 하나
    expect(within(dialog).getAllByRole('button', { name: /^AI 챗에서 분석/ })).toHaveLength(1);
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
