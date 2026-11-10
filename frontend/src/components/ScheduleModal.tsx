'use client';

import React, { useState } from 'react';
import { Calendar, Clock, RefreshCw, Trash2 } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useCollector } from '@/hooks/useCollector';
import ResetConfirmDialog from '@/components/ResetConfirmDialog';
import { InlineAlert } from '@/components/ui/InlineAlert';

const pad2 = (n: number) => String(n).padStart(2, '0');
/** `[0, 6]` → `00:00 · 06:00` */
const formatHours = (hours: number[], sep: string) => hours.map((h) => `${pad2(h)}:00`).join(sep);

/**
 * 자동 수집 스케줄 대화상자 (spec 설계 5). 수집 주기·다음 예정, 바닥 `즉시 수집`,
 * '위험 영역' 의 `초기화 & 재수집…` → 확인 창(스택 위에 쌓인다).
 */
export default function ScheduleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { status, statusError, isCollecting, collect, reloadStatus } = useCollector();
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
        description="정해진 시각마다 전세계 소식을 자동 수집합니다."
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
        {/* 상태를 한 번도 받지 못하고 요청이 실패하면 기다림 대신 오류와 다시 시도 (FE-39). */}
        {!status && statusError ? (
          <InlineAlert
            tone="danger"
            action={
              <Button variant="secondary" size="sm" leadingIcon={<RefreshCw />} onClick={reloadStatus}>
                다시 시도
              </Button>
            }
          >
            스케줄 정보를 불러오지 못했습니다. 백엔드 서버 연결 상태를 확인해주세요.
          </InlineAlert>
        ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface-muted p-4">
            <h3 className="mb-1 flex items-center gap-1.5 text-xs font-medium text-fg-muted">
              <Calendar aria-hidden="true" className="size-4 text-accent" /> 수집 주기
              {status ? ` (${status.timezone})` : ''}
            </h3>
            {/* 시각은 backend 스케줄 응답으로 그린다 (FE-25). KST 환산은 UTC 일 때만 보인다. */}
            <p className="text-sm font-semibold text-fg">
              {!status
                ? '불러오는 중...'
                : status.schedule_hours.length > 0
                  ? formatHours(status.schedule_hours, ' · ')
                  : '정해진 수집 시각이 없습니다'}
            </p>
            {status?.timezone === 'UTC' && status.schedule_hours.length > 0 ? (
              <p className="mt-1 text-xs text-fg-muted">
                (KST: {formatHours(status.schedule_hours.map((h) => (h + 9) % 24), ', ')})
              </p>
            ) : null}
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
        )}

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
