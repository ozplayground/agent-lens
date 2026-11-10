import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import CitationBadge from '@/components/chat/CitationBadge';
import CitationPopover from '@/components/chat/CitationPopover';
import DeleteConfirmPopover from '@/components/chat/DeleteConfirmPopover';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatModelSelector from '@/components/chat/ChatModelSelector';
import ModelTierBadge from '@/components/chat/ModelTierBadge';
import HandoverCtaButton from '@/components/chat/HandoverCtaButton';
import ChatWorkspace from '@/components/chat/ChatWorkspace';
import type { SourceReference } from '@/types/chat';
import type { NewsItem } from '@/types/news';

/**
 * FE-08(챗 몫): 화면에 연결되지 않은 prop·변형을 지운다. 지운 prop 은 타입이 받지 않음을
 * `@ts-expect-error` 로 단언한다 (`tsc --noEmit` 이 확인).
 * FE-25(ModelTierBadge 몫): 측정하지 않은 지연 수치를 보이지 않고, 비용은 '상대 비용' 으로만 보인다.
 */

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const source: SourceReference = {
  index: 1,
  type: 'primary',
  id: 101,
  title: '인용 기사',
  url: 'https://example.com/a',
  source: 'Example',
  snippet: '요약',
};

describe('연결되지 않은 prop 삭제 (FE-08)', () => {
  it('인용 팝오버에 어디로도 연결되지 않은 기사 상세 버튼이 없다', () => {
    render(<CitationBadge index={1} source={source} />);
    fireEvent.click(screen.getByRole('button', { name: /출처 1번/ }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: /기사 상세/ })).toBeNull();
    expect(within(dialog).getByRole('link', { name: /원문 보기/ })).toBeInTheDocument();
  });

  it('지운 prop 은 타입이 받지 않는다', () => {
    const noop = () => {};
    const anchorRef = { current: null };
    const props = [
      // @ts-expect-error onOpenSourceDetail 은 워크스페이스가 넘기지 않아 지웠다
      <CitationBadge key="a" index={1} source={source} onOpenSourceDetail={noop} />,
      // @ts-expect-error anchorRect 는 선언만 있었다
      <CitationPopover key="b" source={source} isOpen onClose={noop} anchorRef={anchorRef} anchorRect={null} />,
      // @ts-expect-error anchorRect 는 선언만 있었다
      <DeleteConfirmPopover key="c" isOpen onConfirm={noop} onCancel={noop} anchorRect={null} />,
      // @ts-expect-error onOpenSourceDetail 은 워크스페이스가 넘기지 않아 지웠다
      <ChatMessageList key="d" messages={[]} isStreaming={false} onSelectPromptSuggestion={noop} onRetryMessage={noop} onOpenSourceDetail={noop} />,
      // @ts-expect-error ChatPage 가 넘기지 않는다 (URL 의 sourceId 를 쓴다)
      <ChatWorkspace key="e" initialSourceId={1} />,
      // @ts-expect-error ChatPage 가 넘기지 않는다 (URL 의 q 를 쓴다)
      <ChatWorkspace key="f" initialQuestion="q" />,
      // @ts-expect-error modal-icon 변형은 화면 어디에도 없다
      <HandoverCtaButton key="g" item={{ id: 1 } as NewsItem} variant="modal-icon" />,
      // @ts-expect-error 배지 변형은 하나뿐이라 variant prop 을 지웠다
      <ModelTierBadge key="h" tier="haiku" variant="chip" />,
    ];
    expect(props).toHaveLength(8);
  });
});

describe('모델 표기의 근거 없는 수치 (FE-25)', () => {
  it('모델 선택 목록은 측정하지 않은 지연 수치(~0.6s 등)를 보이지 않는다', () => {
    render(<ChatModelSelector selectedTier="sonnet" onSelectTier={vi.fn()} isStreaming={false} forceOpen />);

    const group = screen.getByRole('radiogroup');
    expect(group.textContent ?? '').not.toMatch(/~\s*\d+(\.\d+)?\s*s/);
  });

  it('비용 기호는 상대 비용이라고 함께 알린다', () => {
    render(<ChatModelSelector selectedTier="sonnet" onSelectTier={vi.fn()} isStreaming={false} forceOpen />);

    const sonnet = screen.getByRole('radio', { name: /Sonnet 5\.5/ });
    expect(sonnet.textContent ?? '').toMatch(/상대 비용\s*\$\$(?!\$)/);
    expect(screen.getByRole('button', { name: /Claude 모델 선택/ })).toHaveAttribute(
      'title',
      'Sonnet 5.5 · 상대 비용 $$'
    );
  });

  it('Claude 가 아닌 모델 배지에는 지어낸 비용을 보이지 않는다', () => {
    render(<ModelTierBadge tier="gemini-2.0-flash" showCost />);

    expect(screen.getByText('gemini-2.0-flash')).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).toBeNull();
  });
});
