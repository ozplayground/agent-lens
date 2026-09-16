'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Bell, CheckCircle, AlertCircle, Loader2, Link2 } from 'lucide-react';
import { testWebhook, sendBriefingToWebhook } from '@/lib/api';

interface WebhookSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebhookSettingsModal: React.FC<WebhookSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingBriefing, setIsSendingBriefing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agentlens_webhook_url');
      if (saved) setWebhookUrl(saved);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveUrl = (url: string) => {
    setWebhookUrl(url);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agentlens_webhook_url', url);
    }
  };

  const getProvider = (url: string) => {
    const l = url.toLowerCase();
    if (l.includes('slack.com')) return 'Slack';
    if (l.includes('discord.com') || l.includes('discordapp.com')) return 'Discord';
    if (url.startsWith('http')) return 'Generic Webhook';
    return null;
  };

  const provider = getProvider(webhookUrl);

  const handleTest = async () => {
    if (!webhookUrl.trim().startsWith('http')) {
      setFeedback({ type: 'error', message: '올바른 HTTP/HTTPS 웹훅 URL을 입력해주세요.' });
      return;
    }

    setIsTesting(true);
    setFeedback(null);
    try {
      const res = await testWebhook(webhookUrl.trim());
      setFeedback({ type: 'success', message: res.message });
      handleSaveUrl(webhookUrl.trim());
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || '테스트 발송에 실패했습니다.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendBriefing = async () => {
    if (!webhookUrl.trim().startsWith('http')) {
      setFeedback({ type: 'error', message: '올바른 HTTP/HTTPS 웹훅 URL을 입력해주세요.' });
      return;
    }

    setIsSendingBriefing(true);
    setFeedback(null);
    try {
      const res = await sendBriefingToWebhook(webhookUrl.trim());
      setFeedback({ type: 'success', message: res.message });
      handleSaveUrl(webhookUrl.trim());
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || '브리핑 전송에 실패했습니다.' });
    } finally {
      setIsSendingBriefing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">웹훅 알림 설정</h3>
              <p className="text-xs text-slate-400">Slack / Discord 채널로 브리핑 및 특종을 자동 전송합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Webhook Endpoint URL</span>
              {provider && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {provider} 감지됨
                </span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => handleSaveUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/... 또는 Discord Webhook URL"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleTest}
              disabled={isTesting || !webhookUrl.trim()}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-blue-400" />}
              <span>테스트 발송</span>
            </button>
            <button
              onClick={handleSendBriefing}
              disabled={isSendingBriefing || !webhookUrl.trim()}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingBriefing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              <span>오늘의 브리핑 즉시 전송</span>
            </button>
          </div>

          {/* Guide Tips */}
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">💡 웹훅 URL 생성 방법:</p>
            <p>• <strong>Slack</strong>: Slack App 생성 &gt; Incoming Webhooks 활성화 &gt; 채널 지정 후 웹훅 URL 복사</p>
            <p>• <strong>Discord</strong>: 채널 설정 &gt; 연동 &gt; 웹후크 생성 &gt; 웹후크 URL 복사</p>
            <p className="text-slate-500 pt-1">
              * 입력하신 URL은 로컬 브라우저에 안전하게 저장되며, 정기 크론 수집 시에도 백엔드 환경변수(`SLACK_WEBHOOK_URL`)로 등록하여 자동 발송할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-850/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
