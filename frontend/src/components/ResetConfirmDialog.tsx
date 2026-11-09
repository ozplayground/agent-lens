'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useCollector } from '@/hooks/useCollector';

export interface ResetConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  /** 초기화 요청이 성공한 뒤 부른다 (창은 스스로 닫힌다). */
  onDone?: () => void;
}

/**
 * 수집 데이터 전체 삭제 및 재수집 확인 창 (헤더 더보기 메뉴·스케줄 대화상자·커맨드 팔레트 공용).
 * 진행 중에는 `busy` 라 Escape·배경막·취소가 무시된다. 실패하면 창 안 `InlineAlert` 로 알린다.
 */
export default function ResetConfirmDialog({ open, onClose, onDone }: ResetConfirmDialogProps) {
  const { reset } = useCollector();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = () => {
    if (busy) return;
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await reset();
      setBusy(false);
      onClose();
      onDone?.();
    } catch (e) {
      setBusy(false);
      setError((e instanceof Error && e.message) || '초기화 실패');
    }
  };

  return (
    <ConfirmDialog
      open={open}
      tone="danger"
      title="수집 데이터 전체 삭제 및 재수집"
      description={
        <>
          현재 데이터베이스에 저장된 <strong className="font-semibold text-fg">모든 뉴스 소식 및 수집 로그가 영구 삭제</strong>되며, 최신 크롤러 기준에 따라 처음부터 깨끗하게 실시간 재수집을 시작합니다. 계속하시겠습니까?
        </>
      }
      cancelLabel="취소"
      confirmLabel={busy ? '초기화 중...' : '전체 삭제 후 다시 수집'}
      busy={busy}
      error={error}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}
