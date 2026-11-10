import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DeepResearcherTab from '@/components/sources/DeepResearcherTab';

// ui-redesign 29 (R16): 지표 카드 값이 360 에서 말줄임으로 사라지지 않고 줄을 바꾼다.
// jsdom 은 폭을 잴 수 없어 값 상자의 클래스로 확인한다. 실제 폭 확인은 프로덕션 ui-audit 재측정.
const noop = () => {};

function renderTab() {
  render(
    <DeepResearcherTab researchStatus={null} auditLogs={[]} loading={false} onRefresh={noop} showToast={noop} />
  );
}

/** 지표 라벨(`<p>`)의 다음 형제가 값 상자다. */
function valueBoxOf(label: string): HTMLElement {
  const labelEl = screen.getByText(label, { selector: 'p' });
  const box = labelEl.nextElementSibling;
  expect(box).toBeInstanceOf(HTMLElement);
  return box as HTMLElement;
}

function expectWraps(box: HTMLElement) {
  expect(box).not.toHaveClass('truncate');
  expect(box).not.toHaveClass('whitespace-nowrap');
  expect(box).not.toHaveClass('text-ellipsis');
  expect(box).toHaveClass('break-words');
}

describe('DeepResearcherTab — 지표 값 줄바꿈 (ui-redesign 29, R16)', () => {
  it('정기 스케줄 값 상자가 말줄임 없이 줄을 바꾼다', () => {
    renderTab();
    const box = valueBoxOf('정기 스케줄');
    expect(box).toHaveTextContent('매일 03:00, 15:00 UTC');
    expectWraps(box);
  });

  it.each(['자동 채택된 소스', '자동 채택 기준', '최근 리서치 일시', '정기 스케줄'])(
    '%s 값 상자가 말줄임 없이 줄을 바꾼다',
    (label) => {
      renderTab();
      expectWraps(valueBoxOf(label));
    }
  );
});

describe('DeepResearcherTab — 평가 방식 문구 (리뷰 FE-25, QA D-25)', () => {
  it('적합도 평가가 LLM 이 아니라 키워드 규칙 기반임을 밝힌다', () => {
    renderTab();
    expect(screen.getByText(/키워드 규칙 기반 적합도 점수/)).toBeInTheDocument();
    expect(screen.queryByText(/LLM/)).not.toBeInTheDocument();
  });
});

describe('DeepResearcherTab — 판정 사유 라벨 (D-25 원칙)', () => {
  it('키워드 규칙이 만든 사유를 AI 판정이라고 부르지 않는다', () => {
    render(
      <DeepResearcherTab
        researchStatus={null}
        auditLogs={[
          {
            id: 1,
            source_name: 'Example Blog',
            site_url: 'https://example.com',
            feed_url: 'https://example.com/feed',
            category: 'harness',
            relevance_score: 8.5,
            verdict: 'AUTO_ADOPTED',
            verdict_reason: '하네스 키워드 3건 일치',
            analyzed_articles_count: 5,
            created_at: '2026-11-10T00:00:00+00:00',
          },
        ]}
        loading={false}
        onRefresh={noop}
        showToast={noop}
      />
    );
    expect(screen.getByText('판정 사유:')).toBeInTheDocument();
    expect(screen.queryByText(/AI 판정/)).not.toBeInTheDocument();
  });
});
