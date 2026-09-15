'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Terminal, CheckCircle2, Cpu, Rss, Bell, Trash2, AlertTriangle, Globe, Send } from 'lucide-react';
import { ScheduleStatus } from '@/types/news';
import { fetchScheduleStatus, triggerManualCollect, fetchCrawlProgress, resetAndRecollect } from '@/lib/api';

interface HeaderProps {
  onRefresh: () => void;
  onOpenSchedule: () => void;
  onOpenMcp: () => void;
  onOpenWebhook?: () => void;
  onOpenSources?: () => void;
}

export default function Header({ onRefresh, onOpenSchedule, onOpenMcp, onOpenWebhook, onOpenSources }: HeaderProps) {
  const [status, setStatus] = useState<ScheduleStatus | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const load = async () => {
    try {
      const data = await fetchScheduleStatus();
      setStatus(data);
    } catch {}
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const pollProgress = (initialMsg?: string) => {
    setIsCollecting(true);
    if (initialMsg) setMsg(initialMsg);

    let lastSaved = 0;
    const pollInterval = setInterval(async () => {
      try {
        const prog = await fetchCrawlProgress();
        if (prog.step_message) {
          setMsg(prog.step_message);
        }
        if (prog.items_saved > lastSaved) {
          lastSaved = prog.items_saved;
          onRefresh();
        }

        if (!prog.is_running) {
          clearInterval(pollInterval);
          setIsCollecting(false);
          setMsg(`수집 완료 (+${prog.items_saved}건 신규 반영)`);
          onRefresh();
          load();
          setTimeout(() => setMsg(null), 4000);
        }
      } catch {
        clearInterval(pollInterval);
        setIsCollecting(false);
        setMsg(null);
      }
    }, 1200);
  };

  const handleCollect = async () => {
    if (isCollecting) return;
    try {
      await triggerManualCollect();
      pollProgress('실시간 소식 수집 중...');
    } catch {
      setMsg('수집 요청 실패');
      setIsCollecting(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      const res = await resetAndRecollect();
      setShowResetModal(false);
      setIsResetting(false);
      onRefresh();
      pollProgress(`기존 ${res.deleted_count}건 삭제 완료. 신규 수집 중...`);
    } catch (e: any) {
      alert(e.message || '초기화 실패');
      setIsResetting(false);
    }
  };

  const minutesLeft = status?.minutes_until_next_run ?? 0;
  const hoursLeft = Math.floor(minutesLeft / 60);
  const minsRemaining = Math.round(minutesLeft % 60);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 text-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">AgentLens</h1>
            <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              v1.5.0
            </span>
            <span className="hidden sm:flex items-center gap-1 text-xs text-slate-600 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
          <span className="hidden lg:inline text-xs text-slate-500 border-l border-slate-200 pl-3">
            AI Agent · 하네스(Harness) · MCP 기술 큐레이션
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center flex-wrap gap-2">

          {onOpenSources && (
            <button
              onClick={onOpenSources}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors shadow-xs cursor-pointer"
              title="스크래핑 대상 소스 관리 및 AI 리서처"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>소스 & 리서처</span>
            </button>
          )}

          <button
            onClick={onOpenMcp}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors shadow-xs cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span>MCP</span>
          </button>

          <a
            href="/api/news/feed/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors shadow-xs cursor-pointer"
          >
            <Rss className="w-3.5 h-3.5 text-amber-600" />
            <span>RSS</span>
          </a>

          {onOpenWebhook && (
            <button
              onClick={onOpenWebhook}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors shadow-xs cursor-pointer"
              title="Notion / 이메일 / 웹훅 브리핑 연동 설정"
            >
              <Send className="w-3.5 h-3.5 text-blue-600" />
              <span>공유 & 알림</span>
            </button>
          )}

          <button
            onClick={onOpenSchedule}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-600 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>다음 수집 {hoursLeft > 0 ? `${hoursLeft}h ` : ''}{minsRemaining}m 후</span>
          </button>

          {/* Reset & Recollect button (Danger action) */}
          <button
            onClick={() => setShowResetModal(true)}
            disabled={isCollecting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="데이터 전체 삭제 및 클린 재수집"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>초기화 & 재수집</span>
          </button>

          {/* Collect button */}
          <button
            onClick={handleCollect}
            disabled={isCollecting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer shadow-xs ${
              isCollecting
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCollecting ? 'animate-spin' : ''}`} />
            <span>{isCollecting ? '수집 중...' : '즉시 수집'}</span>
          </button>
        </div>
      </div>

      {/* Progress Status Bar */}
      {msg && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-6 lg:px-8 py-1.5 text-xs flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-2 font-mono">
              {isCollecting ? (
                <RefreshCw className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              )}
              <span className="text-slate-800 font-medium">{msg}</span>
            </span>
            {isCollecting && (
              <span className="text-[11px] hidden sm:inline font-mono text-slate-500">
                스트리밍 파이프라인: 피드 실시간 반영 중
              </span>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Reset */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="text-sm font-bold text-slate-900">수집 데이터 전체 삭제 및 재수집</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              현재 데이터베이스에 저장된 <strong className="text-slate-900">모든 뉴스 소식 및 수집 로그가 영구 삭제</strong>되며, 최신 크롤러 기준에 따라 처음부터 깨끗하게 실시간 재수집을 시작합니다. 계속하시겠습니까?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isResetting && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>{isResetting ? '초기화 중...' : '전체 삭제 후 다시 수집'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
