'use client';

import React, { useState } from 'react';
import { X, Send, Bell, CheckCircle, AlertCircle, Loader2, Link2 } from 'lucide-react';
import { testWebhook, sendBriefingToWebhook } from '@/lib/api';

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

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

  // 열릴 때 한 번 저장된 URL 을 읽는다 (렌더 중 이전 값 비교, 키·형식 그대로).
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('agentlens_webhook_url');
      if (saved) setWebhookUrl(saved);
    }
  }

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
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: errorMessage(err, '테스트 발송에 실패했습니다.') });
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
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: errorMessage(err, '브리핑 전송에 실패했습니다.') });
    } finally {
      setIsSendingBriefing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim motion-safe:animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="webhook-settings-title"
        className="bg-surface text-fg border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-overlay"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-accent-soft border border-border flex items-center justify-center text-accent-soft-fg">
              <Bell className="size-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="webhook-settings-title" className="font-semibold text-fg text-base">웹훅 알림 설정</h2>
              <p className="text-xs text-fg-muted">Slack / Discord 채널로 브리핑 및 특종을 자동 전송합니다.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            title="닫기"
            className="inline-flex size-11 md:size-9 items-center justify-center rounded-lg text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="webhook-settings-url" className="mb-1.5 flex items-center justify-between text-sm font-medium text-fg">
              <span>Webhook Endpoint URL</span>
              {provider && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent-soft-fg">
                  {provider} 감지됨
                </span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-fg-subtle">
                <Link2 className="size-4" aria-hidden="true" />
              </div>
              <input
                id="webhook-settings-url"
                type="url"
                value={webhookUrl}
                onChange={(e) => handleSaveUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/... 또는 Discord Webhook URL"
                className="w-full h-11 md:h-9 pl-9 pr-3 bg-surface border border-border-strong rounded-lg text-base md:text-sm font-mono text-fg placeholder:text-fg-subtle transition-colors"
              />
            </div>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div
              role={feedback.type === 'error' ? 'alert' : 'status'}
              className={`p-3 rounded-lg border border-border flex items-start gap-2.5 text-sm ${
                feedback.type === 'success' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
              ) : (
                <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !webhookUrl.trim()}
              className="flex h-11 md:h-9 items-center justify-center gap-2 px-4 rounded-lg border border-border-strong bg-surface hover:bg-surface-muted text-fg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
              <span>테스트 발송</span>
            </button>
            <button
              type="button"
              onClick={handleSendBriefing}
              disabled={isSendingBriefing || !webhookUrl.trim()}
              className="flex h-11 md:h-9 items-center justify-center gap-2 px-4 rounded-lg bg-accent-solid hover:bg-accent-solid-hover text-on-accent text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingBriefing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Bell className="size-4" aria-hidden="true" />}
              <span>오늘의 브리핑 즉시 전송</span>
            </button>
          </div>

          {/* Guide Tips */}
          <div className="bg-surface-muted border border-border rounded-lg p-3 text-xs text-fg-muted space-y-1">
            <p className="font-medium text-fg">웹훅 URL 생성 방법</p>
            <p>• <strong className="font-medium text-fg">Slack</strong>: Slack App 생성 &gt; Incoming Webhooks 활성화 &gt; 채널 지정 후 웹훅 URL 복사</p>
            <p>• <strong className="font-medium text-fg">Discord</strong>: 채널 설정 &gt; 연동 &gt; 웹후크 생성 &gt; 웹후크 URL 복사</p>
            <p className="text-fg-subtle pt-1">
              * 입력하신 URL은 로컬 브라우저에 안전하게 저장되며, 정기 크론 수집 시에도 백엔드 환경변수(`SLACK_WEBHOOK_URL`)로 등록하여 자동 발송할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 md:h-9 px-4 rounded-lg text-sm font-medium text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
