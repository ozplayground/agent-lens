import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RouteError from '@/app/error';

/**
 * 라우트 오류 경계 (리뷰 FE-05). 렌더 중 예외가 나도 화면 전체가 지워지지 않고
 * 오류 안내와 다시 시도 버튼을 보인다. 예외 원문은 사용자에게 그대로 보이지 않는다.
 */
describe('app/error.tsx (FE-05)', () => {
  it('오류 안내와 다시 시도를 보이고, 다시 시도는 reset 을 부른다', () => {
    const reset = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<RouteError error={new Error('bookmarkedItems.map is not a function')} reset={reset} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('화면을 그리지 못했습니다');
    expect(alert).not.toHaveTextContent('bookmarkedItems.map');

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
