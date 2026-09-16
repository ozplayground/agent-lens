'use client';

import React, { useEffect, useState } from 'react';
import { X, Clock, CheckCircle, Calendar, RefreshCw } from 'lucide-react';
import { ScheduleStatus } from '@/types/news';
import { fetchScheduleStatus } from '@/lib/api';

export default function ScheduleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<ScheduleStatus | null>(null);

  const load = async () => {
    try { setStatus(await fetchScheduleStatus()); } catch {}
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-zinc-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">자동 글로벌 수집 스케줄러</h3>
            <p className="text-xs text-zinc-400">매일 4회(0, 6, 12, 18시 UTC) 전세계 소식을 자동 수집합니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> 수집 주기 (UTC)
            </div>
            <div className="text-sm font-semibold text-white">00:00 · 06:00 · 12:00 · 18:00</div>
            <div className="text-[11px] text-zinc-500 mt-1">(KST: 09:00, 15:00, 21:00, 03:00)</div>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> 다음 예정 수집
            </div>
            <div className="text-sm font-semibold text-emerald-400">
              {status ? `${Math.round(status.minutes_until_next_run)}분 후` : '계산 중...'}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 truncate">
              {status ? new Date(status.next_run).toLocaleString('ko-KR') : ''}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-zinc-800">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
