'use client';

import React, { useEffect } from 'react';

export interface HotkeyMapping {
  /** 대상 키 (소문자 표기: 'j', 'k', '/', 'b', 'c', 't', 'escape') */
  key: string;
  /** 조합키 요구사항 */
  modifiers?: {
    metaOrCtrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  /** 입력 필드 내부에서도 실행을 허용할지 여부 (기본값: false, Cmd+K/Escape는 true) */
  allowInInputs?: boolean;
  /** 단축키 발동 시 실행할 콜백 */
  handler: (e: KeyboardEvent) => void;
  /** 단축키 설명 */
  description: string;
}

export interface HotkeyListenerProps {
  /** 메인 피드 포커스 카드 이동 콜백 (j: +1, k: -1) */
  onNavigateFeed?: (delta: 1 | -1) => void;
  /** 포커스된 카드 상세 모달 열기 (Enter/Space) */
  onOpenDetailModal?: () => void;
  /** 포커스된 카드 Scoped 챗 핸드오버 (c) */
  onHandoverChat?: () => void;
  /** 포커스된 카드 북마크 토글 (b) */
  onToggleBookmark?: () => void;
  /** 상단 검색바 포커스 (/) */
  onFocusSearch?: () => void;
  /** 테마 순환 토글 (t) */
  onToggleTheme?: () => void;
  /** 열린 모달/팔레트 닫기 (Escape) */
  onCloseOverlays?: () => void;
  /** 전역 커맨드 팔레트 토글 (Cmd+K / Ctrl+K) */
  onToggleCommandPalette?: () => void;
  /** 추가 커스텀 핫키 매핑 */
  customHotkeys?: HotkeyMapping[];
  /** 단축키 활성화 여부 (기본값: true) */
  enabled?: boolean;
}

export default function HotkeyListener({
  onNavigateFeed,
  onOpenDetailModal,
  onHandoverChat,
  onToggleBookmark,
  onFocusSearch,
  onToggleTheme,
  onCloseOverlays,
  onToggleCommandPalette,
  customHotkeys = [],
  enabled = true,
}: HotkeyListenerProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. IME 조합 중인 경우 무시 (한글 등 중복 입력 방지)
      if (e.isComposing) {
        return;
      }

      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // 2. Cmd+K / Ctrl+K 커맨드 팔레트 토글 (입력창 내부에서도 허용)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onToggleCommandPalette?.();
        return;
      }

      // 3. Escape 키 모달/오버레이 닫기 (입력창 내부에서도 허용)
      if (e.key === 'Escape') {
        onCloseOverlays?.();
        return;
      }

      // 4. Input Isolation Rule: 사용자가 텍스트 입력 중일 때는 단일 키 핫키 무시
      if (isInput) {
        return;
      }

      // 조합키가 눌린 경우 다른 단일 키는 무시
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      // 5. 커스텀 핫키 처리
      for (const mapping of customHotkeys) {
        if (mapping.key.toLowerCase() === e.key.toLowerCase()) {
          mapping.handler(e);
          return;
        }
      }

      // 6. 표준 단일 키 핫키 매핑
      switch (e.key) {
        case 'j':
        case 'J':
          e.preventDefault();
          onNavigateFeed?.(1);
          break;
        case 'k':
        case 'K':
          e.preventDefault();
          onNavigateFeed?.(-1);
          break;
        case '/':
          e.preventDefault();
          onFocusSearch?.();
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          onToggleBookmark?.();
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          onHandoverChat?.();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          onToggleTheme?.();
          break;
        case 'Enter':
        case ' ':
          // 카드 선택 등 상호작용
          if (onOpenDetailModal) {
            e.preventDefault();
            onOpenDetailModal();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    onNavigateFeed,
    onOpenDetailModal,
    onHandoverChat,
    onToggleBookmark,
    onFocusSearch,
    onToggleTheme,
    onCloseOverlays,
    onToggleCommandPalette,
    customHotkeys,
  ]);

  return null;
}
