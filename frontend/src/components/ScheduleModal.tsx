'use client';

import React, { useState } from 'react';
import { Calendar, Clock, RefreshCw, Trash2 } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useCollector } from '@/hooks/useCollector';
import ResetConfirmDialog from '@/components/ResetConfirmDialog';

/**
 * 자동 수집 스케줄 대화상자 (spec 설계 5). 수집 주기·다음 예정, 바닥 `즉시 수집`,
 * '위험 영역' 의 `초기화 & 재수집…` → 확인 창(스택 위에 쌓인다).
 */
export default function ScheduleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { status, isCollecting, collect } = useCollector();
  const [showReset, setShowReset] = useState(false);

  const handleClose = () => {
    setShowReset(false);
    onClose();
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        size="md"
        title="자동 수집 스케줄"
        description="매일 4회(0, 6, 12, 18시 UTC) 전세계 소식을 자동 수집합니다."
        footer={
          <Button
            variant="secondary"
            leadingIcon={<RefreshCw />}
            loading={isCollecting}
            onClick={() => void collect()}
          >
            {isCollecting ? '수집 중' : '즉시 수집'}
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface-muted p-4">
            <h3 className="mb-1 flex items-center gap-1.5 text-xs font-medium text-fg-muted">
              <Calendar aria-hidden="true" className="size-4 text-accent" /> 수집 주기 (UTC)
            </h3>
            <p className="text-sm font-semibold text-fg">00:00 · 06:00 · 12:00 · 18:00</p>
            <p className="mt-1 text-xs text-fg-muted">(KST: 09:00, 15:00, 21:00, 03:00)</p>
          </section>
          <section className="rounded-xl border border-border bg-surface-muted p-4">
            <h3 className="mb-1 flex items-center gap-1.5 text-xs font-medium text-fg-muted">
              <Clock aria-hidden="true" className="size-4 text-success" /> 다음 예정 수집
            </h3>
            <p className="text-sm font-semibold text-success">
              {status ? `${Math.round(status.minutes_until_next_run)}분 후` : '계산 중...'}
            </p>
            <p className="mt-1 truncate text-xs text-fg-muted">
              {status ? new Date(status.next_run).toLocaleString('ko-KR') : ''}
            </p>
          </section>
        </div>

        <section aria-labelledby="schedule-danger-zone" className="mt-6 rounded-xl border border-border p-4">
          <h3 id="schedule-danger-zone" className="text-sm font-semibold text-danger">
            위험 영역
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">
            저장된 소식과 수집 기록을 모두 지우고 처음부터 다시 수집합니다. 확인 창을 거칩니다.
          </p>
          <Button
            variant="danger"
            leadingIcon={<Trash2 />}
            onClick={() => setShowReset(true)}
            disabled={isCollecting}
            className="mt-3"
          >
            초기화 & 재수집…
          </Button>
        </section>
      </Dialog>
      <ResetConfirmDialog open={isOpen && showReset} onClose={() => setShowReset(false)} />
    </>
  );
}
