'use client';

import { ModalFrame, type DialogProps } from './Dialog';

export interface DrawerProps extends Omit<DialogProps, 'size' | 'mobile' | 'placement'> {
  /** 붙는 쪽. 지금은 왼쪽만 쓴다. */
  side?: 'left';
}

/**
 * 옆에서 나오는 모달 드로어. `Dialog` 와 같은 규칙(포털·스택·포커스·스크롤 잠금·배경막)이고
 * 너비는 `min(320px, 85vw)`, 높이는 화면 전체다.
 */
export function Drawer({ side = 'left', ...rest }: DrawerProps) {
  return <ModalFrame {...rest} layout={{ type: 'drawer', side }} />;
}

export default Drawer;
