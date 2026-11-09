'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, ExternalLink, Eye, EyeOff, FileText, Mail, ShieldCheck } from 'lucide-react';
import {
  fetchBriefingSettings,
  updateBriefingSettings,
  testNotionConnection,
  testEmailConnection,
  testWebhook,
  type BriefingSettingsUpdate
} from '@/lib/api';
import type { BriefingSettings } from '@/types/news';
import { Dialog } from '@/components/ui/Dialog';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { TextField, type TextFieldProps } from '@/components/ui/TextField';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Spinner } from '@/components/ui/Spinner';

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

type SettingsTab = 'notion' | 'email' | 'webhook';

const TABS: { id: SettingsTab; label: React.ReactNode }[] = [
  {
    id: 'notion',
    label: (
      <>
        <FileText aria-hidden="true" className="size-4" />
        Notion 연동
      </>
    ),
  },
  {
    id: 'email',
    label: (
      <>
        <Mail aria-hidden="true" className="size-4" />
        이메일 (SMTP)
      </>
    ),
  },
  {
    id: 'webhook',
    label: (
      <>
        <Bell aria-hidden="true" className="size-4" />
        웹훅 (Slack/Discord)
      </>
    ),
  },
];

const TAB_ID_PREFIX = 'briefing-settings';

interface SecretFieldProps extends Omit<TextFieldProps, 'type' | 'trailing'> {
  /** 보기 토글 버튼 이름에 쓰는 대상 이름 (예: `토큰`). */
  secretName: string;
}

/** 비밀값 입력: `type="password"` + 보기 토글 `IconButton`. */
function SecretField({ secretName, ...rest }: SecretFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...rest}
      type={visible ? 'text' : 'password'}
      autoComplete="off"
      spellCheck={false}
      trailing={
        <IconButton
          label={visible ? `${secretName} 숨기기` : `${secretName} 보기`}
          icon={visible ? <EyeOff /> : <Eye />}
          pressed={visible}
          size="sm"
          onClick={() => setVisible((v) => !v)}
        />
      }
    />
  );
}

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
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [isLoading, setIsLoading] = useState(isOpen);
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

  // initialTab 이 바뀌면 탭을 맞춘다 (렌더 중 이전 값 비교).
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    if (initialTab) setActiveTab(initialTab);
  }

  // 열릴 때 로딩 표시, 닫힐 때 피드백 초기화 (렌더 중 이전 값 비교).
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setIsLoading(true);
    } else {
      setFeedback(null);
    }
  }

  const applySettings = useCallback((data: BriefingSettings) => {
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
  }, []);

  // 설정을 받아 폼에 채운다. 로딩 표시 켜기는 호출하는 쪽이 한다.
  const fetchAndApplySettings = useCallback(
    () =>
      fetchBriefingSettings()
        .then(applySettings)
        .catch((e: unknown) => {
          setFeedback({ type: 'error', message: errorMessage(e, '설정을 불러오지 못했습니다.') });
        })
        .finally(() => {
          setIsLoading(false);
        }),
    [applySettings]
  );

  useEffect(() => {
    if (isOpen) {
      void fetchAndApplySettings();
    }
  }, [isOpen, fetchAndApplySettings]);

  const loadSettings = () => {
    setIsLoading(true);
    void fetchAndApplySettings();
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const payload: BriefingSettingsUpdate = {
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
    } catch (e: unknown) {
      setFeedback({ type: 'error', message: errorMessage(e, '설정 저장에 실패했습니다.') });
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
    } catch (e: unknown) {
      setFeedback({ type: 'error', message: errorMessage(e, 'Notion 연결 테스트 실패') });
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
    } catch (e: unknown) {
      setFeedback({ type: 'error', message: errorMessage(e, '이메일 발송 테스트 실패') });
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
    } catch (e: unknown) {
      setFeedback({ type: 'error', message: errorMessage(e, '웹훅 테스트 실패') });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setFeedback(null);
  };

  const testAction =
    activeTab === 'notion'
      ? { run: handleTestNotion, disabled: !notionApiKey && !hasNotionKey }
      : activeTab === 'email'
        ? { run: handleTestEmail, disabled: !smtpHost || (!smtpUser && !smtpTo) }
        : { run: handleTestWebhook, disabled: !webhookUrl };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      size="md"
      dismissOnScrim={false}
      title="공유 & 알림 설정"
      description="Notion 페이지 발행, 이메일(SMTP), Slack/Discord 알림을 설정합니다."
      footer={
        <>
          <p className="mr-auto basis-full text-xs text-fg-muted sm:basis-auto">
            모든 토큰과 비밀번호는 config.json에 로컬 저장됩니다.
          </p>
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
          <Button
            variant="secondary"
            leadingIcon={<ShieldCheck />}
            loading={isTesting}
            disabled={isLoading || testAction.disabled}
            onClick={() => void testAction.run()}
          >
            연결 테스트
          </Button>
          <Button variant="primary" loading={isSaving} disabled={isLoading} onClick={() => void handleSave()}>
            저장
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Tabs
          label="연동 종류"
          tabs={TABS}
          value={activeTab}
          onChange={handleTabChange}
          idPrefix={TAB_ID_PREFIX}
          className="-mx-4 px-4 md:-mx-5 md:px-5"
        />

        {feedback ? (
          <InlineAlert tone={feedback.type === 'success' ? 'success' : 'danger'}>{feedback.message}</InlineAlert>
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-fg-muted">
            <Spinner />
            <span>설정을 불러오는 중...</span>
          </div>
        ) : (
          <TabPanel id={activeTab} idPrefix={TAB_ID_PREFIX} className="flex flex-col gap-4">
            {activeTab === 'notion' ? (
              <>
                <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface-muted p-3 text-sm leading-relaxed text-fg-muted">
                  <p className="font-medium text-fg">Notion 연동 방법</p>
                  <p>
                    1.{' '}
                    <a
                      href="https://www.notion.so/my-integrations"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center gap-0.5 text-accent underline underline-offset-2 md:min-h-0"
                    >
                      Notion 개발자 포털
                      <ExternalLink aria-hidden="true" className="size-3" />
                    </a>
                    에서 &lsquo;새 API 통합&rsquo;을 생성하고 시크릿 토큰을 발급받으세요.
                  </p>
                  <p>
                    2. 브리핑이 저장될 노션 페이지의 우측 상단{' '}
                    <strong className="font-medium text-fg">&lsquo;...&rsquo; &gt; &lsquo;연결(Connections)&rsquo;</strong>
                    에서 생성한 통합을 추가하세요.
                  </p>
                  <p>3. 해당 노션 페이지의 URL 또는 32자리 Page ID를 아래에 입력하세요.</p>
                </div>

                <SecretField
                  label="Notion API 시크릿 토큰"
                  secretName="토큰"
                  description="Internal Integration Token"
                  value={notionApiKey}
                  onChange={(e) => setNotionApiKey(e.target.value)}
                  placeholder={hasNotionKey ? '토큰 등록됨 (변경 시 새로 입력)' : 'secret_...'}
                  className="font-mono"
                />

                <TextField
                  label="Notion 부모 페이지 ID 또는 전체 URL"
                  value={notionPageId}
                  onChange={(e) => setNotionPageId(e.target.value)}
                  placeholder="https://notion.so/... 또는 32자리 UUID"
                  className="font-mono"
                />

                <Switch
                  label="정기 브리핑 발행 시 자동으로 Notion 페이지 생성"
                  checked={notionAutoExport}
                  onChange={setNotionAutoExport}
                />
              </>
            ) : null}

            {activeTab === 'email' ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <TextField
                    label="SMTP 서버 호스트"
                    containerClassName="sm:col-span-2"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com / smtp.naver.com"
                    className="font-mono"
                  />
                  <TextField
                    label="포트"
                    type="number"
                    inputMode="numeric"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="587"
                    className="font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label="SMTP 계정 (아이디/이메일)"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="myaccount@gmail.com"
                    autoComplete="off"
                  />
                  <SecretField
                    label="SMTP 비밀번호 (또는 앱 비밀번호)"
                    secretName="비밀번호"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder={hasSmtpPassword ? '비밀번호 등록됨 (변경 시 새로 입력)' : '16자리 앱 비밀번호'}
                    className="font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label="발신자 주소 (From)"
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                    placeholder="AgentLens <noreply@mydomain.com>"
                  />
                  <TextField
                    label="기본 수신자 목록 (To)"
                    description="쉼표로 구분합니다."
                    value={smtpTo}
                    onChange={(e) => setSmtpTo(e.target.value)}
                    placeholder="user1@company.com, team@company.com"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Switch label="STARTTLS 암호화 사용" checked={smtpUseTls} onChange={setSmtpUseTls} />
                  <Switch
                    label="정기 브리핑 시 수신자 목록으로 자동 발송"
                    checked={emailAutoSend}
                    onChange={setEmailAutoSend}
                  />
                </div>
              </>
            ) : null}

            {activeTab === 'webhook' ? (
              <TextField
                label="Slack / Discord 웹훅 URL"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/... 또는 https://discord.com/api/webhooks/..."
                description="URL에 따라 Slack Block Kit 또는 Discord Embed 서식으로 자동 최적화 전송됩니다."
                className="font-mono"
              />
            ) : null}
          </TabPanel>
        )}
      </div>
    </Dialog>
  );
};
