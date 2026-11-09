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
