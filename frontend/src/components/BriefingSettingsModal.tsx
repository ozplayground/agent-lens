'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Bell,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Mail,
  ExternalLink,
  ShieldCheck,
  Save,
  HelpCircle
} from 'lucide-react';
import {
  fetchBriefingSettings,
  updateBriefingSettings,
  testNotionConnection,
  testEmailConnection,
  testWebhook
} from '@/lib/api';

interface BriefingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'notion' | 'email' | 'webhook';
}

export const BriefingSettingsModal: React.FC<BriefingSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'notion'
}) => {
  const [activeTab, setActiveTab] = useState<'notion' | 'email' | 'webhook'>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Notion form state
  const [notionApiKey, setNotionApiKey] = useState('');
  const [notionPageId, setNotionPageId] = useState('');
  const [notionAutoExport, setNotionAutoExport] = useState(false);
  const [hasNotionKey, setHasNotionKey] = useState(false);

  // Email form state
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [smtpTo, setSmtpTo] = useState('');
  const [smtpUseTls, setSmtpUseTls] = useState(true);
  const [emailAutoSend, setEmailAutoSend] = useState(false);
  const [hasSmtpPassword, setHasSmtpPassword] = useState(false);

  // Webhook form state
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    } else {
      setFeedback(null);
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await fetchBriefingSettings();
      if (data.notion) {
        setNotionPageId(data.notion.page_id || '');
        setNotionAutoExport(!!data.notion.auto_export);
        setHasNotionKey(!!data.notion.has_api_key);
        setNotionApiKey(data.notion.has_api_key ? '***' : '');
      }
      if (data.email) {
        setSmtpHost(data.email.smtp_host || '');
        setSmtpPort(data.email.smtp_port || 587);
        setSmtpUser(data.email.smtp_user || '');
        setSmtpFrom(data.email.smtp_from || '');
        setSmtpTo(data.email.smtp_to || '');
        setSmtpUseTls(data.email.use_tls !== false);
        setEmailAutoSend(!!data.email.auto_send);
        setHasSmtpPassword(!!data.email.has_password);
        setSmtpPassword(data.email.has_password ? '***' : '');
      }
      if (data.webhooks) {
        setSlackWebhookUrl(data.webhooks.slack_webhook_url || '');
        setDiscordWebhookUrl(data.webhooks.discord_webhook_url || '');
        setWebhookUrl(data.webhooks.slack_webhook_url || data.webhooks.discord_webhook_url || '');
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || '설정을 불러오지 못했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const payload: any = {
        notion_page_id: notionPageId,
        notion_auto_export: notionAutoExport,
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort),
        smtp_user: smtpUser,
        smtp_from: smtpFrom,
        smtp_to: smtpTo,
        smtp_use_tls: smtpUseTls,
        email_auto_send: emailAutoSend,
        slack_webhook_url: slackWebhookUrl || (webhookUrl.includes('slack.com') ? webhookUrl : ''),
        discord_webhook_url: discordWebhookUrl || (webhookUrl.includes('discord') ? webhookUrl : '')
      };

      if (notionApiKey && notionApiKey !== '***') {
        payload.notion_api_key = notionApiKey;
      }
      if (smtpPassword && smtpPassword !== '***') {
        payload.smtp_password = smtpPassword;
      }

      const res = await updateBriefingSettings(payload);
      setFeedback({ type: 'success', message: res.message || '설정이 안전하게 저장되었습니다.' });
      loadSettings();
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || '설정 저장에 실패했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotion = async () => {
    setIsTesting(true);
    setFeedback(null);
    try {
      const apiKeyToSend = notionApiKey === '***' ? undefined : notionApiKey;
      const res = await testNotionConnection(apiKeyToSend, notionPageId);
      setFeedback({ type: 'success', message: res.message });
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Notion 연결 테스트 실패' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    setFeedback(null);
    try {
      const pwToSend = smtpPassword === '***' ? undefined : smtpPassword;
      const res = await testEmailConnection({
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort),
        smtp_user: smtpUser,
        smtp_password: pwToSend,
        use_tls: smtpUseTls,
        to_email: smtpTo
      });
      setFeedback({ type: 'success', message: res.message });
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || '이메일 발송 테스트 실패' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestWebhook = async () => {
    const target = webhookUrl.trim() || slackWebhookUrl.trim() || discordWebhookUrl.trim();
    if (!target.startsWith('http')) {
      setFeedback({ type: 'error', message: '올바른 웹훅 URL을 입력해주세요.' });
      return;
    }
    setIsTesting(true);
    setFeedback(null);
    try {
      const res = await testWebhook(target);
      setFeedback({ type: 'success', message: res.message || '웹훅 테스트 전송 완료' });
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || '웹훅 테스트 실패' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl relative text-[#c9d1d9] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between bg-[#161b22] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#58a6ff]">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#f0f6fc]">
                브리핑 공유 및 연동 설정
              </h3>
              <p className="text-xs text-[#8b949e]">
                Notion 페이지 발행, 이메일(SMTP), Slack/Discord 알림을 설정합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#30363d] bg-[#0d1117] px-4 pt-2 gap-2 text-xs font-medium shrink-0">
          <button
            onClick={() => { setActiveTab('notion'); setFeedback(null); }}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'notion'
                ? 'border-[#58a6ff] text-[#58a6ff] font-semibold'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notion 연동</span>
          </button>
          <button
            onClick={() => { setActiveTab('email'); setFeedback(null); }}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'email'
                ? 'border-[#58a6ff] text-[#58a6ff] font-semibold'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>이메일 (SMTP)</span>
          </button>
          <button
            onClick={() => { setActiveTab('webhook'); setFeedback(null); }}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'webhook'
                ? 'border-[#58a6ff] text-[#58a6ff] font-semibold'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>웹훅 (Slack/Discord)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-[#8b949e] gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>설정을 불러오는 중...</span>
            </div>
          ) : (
            <>
              {/* Feedback Banner */}
              {feedback && (
                <div
                  className={`p-3 rounded-md flex items-start gap-2.5 text-xs ${
                    feedback.type === 'success'
                      ? 'bg-[#238636]/15 border border-[#238636]/40 text-[#3fb950]'
                      : 'bg-[#da3633]/15 border border-[#da3633]/40 text-[#f85149]'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 leading-relaxed">{feedback.message}</div>
                </div>
              )}

              {/* Tab 1: Notion */}
              {activeTab === 'notion' && (
                <div className="space-y-3.5">
                  <div className="bg-[#0d1117] p-3 rounded-md border border-[#30363d] text-xs text-[#8b949e] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[#58a6ff] font-medium">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Notion 연동 가이드</span>
                    </div>
                    <p>
                      1. <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" className="text-[#58a6ff] underline inline-flex items-center gap-0.5">Notion 개발자 포털 <ExternalLink className="w-2.5 h-2.5" /></a>에서 '새 API 통합'을 생성하고 시크릿 토큰을 발급받으세요.
                    </p>
                    <p>
                      2. 브리핑이 저장될 노션 페이지의 우측 상단 <strong>'...' &gt; '연결(Connections)'</strong>에서 생성한 통합을 추가하세요.
                    </p>
                    <p>
                      3. 해당 노션 페이지의 URL 또는 32자리 Page ID를 아래에 입력하세요.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#f0f6fc] mb-1">
                      Notion API 시크릿 토큰 (Internal Integration Token)
                    </label>
                    <input
                      type="password"
                      value={notionApiKey}
                      onChange={(e) => setNotionApiKey(e.target.value)}
                      placeholder={hasNotionKey ? '토큰 등록됨 (변경 시 새로 입력)' : 'secret_...'}
                      className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] focus:outline-none text-xs font-mono text-[#f0f6fc]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#f0f6fc] mb-1">
                      Notion 부모 페이지 ID 또는 전체 URL
                    </label>
                    <input
                      type="text"
                      value={notionPageId}
                      onChange={(e) => setNotionPageId(e.target.value)}
                      placeholder="https://notion.so/workspace/PageName-1234567890abcdef... 또는 32자리 UUID"
                      className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] focus:outline-none text-xs font-mono text-[#f0f6fc]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="notionAutoExport"
                      checked={notionAutoExport}
                      onChange={(e) => setNotionAutoExport(e.target.checked)}
                      className="rounded border-[#30363d] bg-[#0d1117] text-[#58a6ff] focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="notionAutoExport" className="text-xs text-[#c9d1d9] cursor-pointer">
                      정기 브리핑 발행 시 자동으로 Notion 페이지 생성
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleTestNotion}
                      disabled={isTesting || (!notionApiKey && !hasNotionKey)}
                      className="px-3 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#c9d1d9] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-[#58a6ff]" />}
                      <span>연결 테스트</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-3.5 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>설정 저장</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Email */}
              {activeTab === 'email' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#f0f6fc] mb-1">
                        SMTP 서버 호스트
                      </label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp.gmail.com / smtp.naver.com"
                        className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] focus:outline-none text-xs font-mono text-[#f0f6fc]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#f0f6fc] mb-1">
                        포트
                      </label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value))}
                        placeholder="587"
                        className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] focus:outline-none text-xs font-mono text-[#f0f6fc]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#f0f6fc] mb-1">
                        SMTP 계정 (아이디/이메일)
                      </label>
                      <input
                        type="text"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="myaccount@gmail.com"
                        className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] focus:outline-none text-xs text-[#f0f6fc]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#f0f6fc] mb-1">
                        SMTP 비밀번호 (또는 앱 비밀번호)
                      </label>
                      <input
                        type="password"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        placeholder={hasSmtpPassword ? '비밀번호 등록됨 (변경 시 새로 입력)' : '16자리 앱 비밀번호'}
                        className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] focus:outline-none text-xs font-mono text-[#f0f6fc]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#f0f6fc] mb-1">
                        발신자 주소 (From)
                      </label>
                      <input
                        type="text"
                        value={smtpFrom}
                        onChange={(e) => setSmtpFrom(e.target.value)}
                        placeholder="AgentLens <noreply@mydomain.com>"
                        className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] focus:outline-none text-xs text-[#f0f6fc]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#f0f6fc] mb-1">
                        기본 수신자 목록 (To, 쉼표 구분)
                      </label>
                      <input
                        type="text"
                        value={smtpTo}
                        onChange={(e) => setSmtpTo(e.target.value)}
                        placeholder="user1@company.com, team@company.com"
                        className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] focus:outline-none text-xs text-[#f0f6fc]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 text-xs text-[#c9d1d9]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smtpUseTls}
                        onChange={(e) => setSmtpUseTls(e.target.checked)}
                        className="rounded border-[#30363d] bg-[#0d1117] text-[#58a6ff] focus:ring-0"
                      />
                      <span>STARTTLS 암호화 사용</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailAutoSend}
                        onChange={(e) => setEmailAutoSend(e.target.checked)}
                        className="rounded border-[#30363d] bg-[#0d1117] text-[#58a6ff] focus:ring-0"
                      />
                      <span>정기 브리핑 시 수신자 목록으로 자동 발송</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleTestEmail}
                      disabled={isTesting || !smtpHost || (!smtpUser && !smtpTo)}
                      className="px-3 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#c9d1d9] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 text-[#58a6ff]" />}
                      <span>테스트 메일 발송</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-3.5 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>설정 저장</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Webhook */}
              {activeTab === 'webhook' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#f0f6fc] mb-1">
                      Slack / Discord 웹훅 URL
                    </label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://hooks.slack.com/services/... 또는 https://discord.com/api/webhooks/..."
                      className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] focus:outline-none text-xs font-mono text-[#f0f6fc]"
                    />
                    <p className="text-[11px] text-[#8b949e] mt-1">
                      URL에 따라 Slack Block Kit 또는 Discord Embed 서식으로 자동 최적화 전송됩니다.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleTestWebhook}
                      disabled={isTesting || !webhookUrl}
                      className="px-3 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#c9d1d9] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5 text-[#58a6ff]" />}
                      <span>웹훅 테스트 전송</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-3.5 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>설정 저장</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between text-xs text-[#8b949e] shrink-0">
          <span>모든 토큰과 비밀번호는 config.json에 로컬 저장됩니다.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#c9d1d9] cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
