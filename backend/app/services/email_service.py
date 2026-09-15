import smtplib
import asyncio
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Tuple, Optional, List
from app.config import settings

logger = logging.getLogger("agentlens.email")

class EmailService:
    def _parse_recipients(self, to: str) -> List[str]:
        if not to:
            return []
        parts = [p.strip() for p in to.replace(";", ",").split(",")]
        return [p for p in parts if "@" in p and "." in p]

    def _build_html(self, briefing: Dict[str, Any]) -> str:
        date_str = briefing.get("date", "")
        headline = briefing.get("headline", "오늘의 AI 핵심 동향")
        overview = briefing.get("overview", "")
        categories = briefing.get("categories", [])
        action_items = briefing.get("action_items", [])

        # Categories HTML
        cats_html = ""
        for cat in categories:
            cat_name = cat.get("name", "")
            cat_icon = cat.get("icon", "🎯")
            cat_summary = cat.get("summary", "")
            items = cat.get("items", [])

            items_html = ""
            for it in items:
                title = it.get("title", "소식")
                url = it.get("url") or "#"
                why = it.get("why_it_matters", "")
                summary = it.get("summary", "")
                source = it.get("source", "")

                why_block = ""
                if why:
                    why_block = f"""
                    <div style="margin-top: 5px; padding: 6px 10px; background-color: #f0f6fc; border-left: 3px solid #58a6ff; border-radius: 4px; font-size: 12px; color: #1f2328;">
                        <strong>💡 시사점:</strong> {why}
                    </div>
                    """
                elif summary:
                    why_block = f"""
                    <div style="margin-top: 5px; padding: 6px 10px; background-color: #f6f8fa; border-left: 3px solid #d0d7de; border-radius: 4px; font-size: 12px; color: #656d76;">
                        <strong>📝 요약:</strong> {summary}
                    </div>
                    """

                items_html += f"""
                <li style="margin-bottom: 14px; list-style-type: none;">
                    <div style="font-size: 14px; font-weight: 600;">
                        <a href="{url}" style="color: #0969da; text-decoration: none;" target="_blank">
                            • {title}
                        </a>
                        <span style="font-size: 11px; color: #656d76; font-weight: normal; margin-left: 6px;">[{source}]</span>
                    </div>
                    {why_block}
                </li>
                """

            cats_html += f"""
            <div style="margin-bottom: 24px; padding: 16px; background-color: #ffffff; border: 1px solid #d0d7de; border-radius: 8px;">
                <h2 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #1f2328; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">{cat_icon}</span> {cat_name}
                </h2>
                {f'<p style="margin: 0 0 12px 0; font-size: 13px; color: #57606a; font-style: italic; border-bottom: 1px dashed #e1e4e8; padding-bottom: 8px;">동향: {cat_summary}</p>' if cat_summary else ''}
                <ul style="margin: 0; padding: 0;">
                    {items_html}
                </ul>
            </div>
            """

        # Action items HTML
        actions_html = ""
        if action_items:
            list_items = "".join([f"<li style='margin-bottom: 6px; font-size: 13px; color: #1f2328;'>{act}</li>" for act in action_items])
            actions_html = f"""
            <div style="margin-bottom: 24px; padding: 16px; background-color: #dafbe1; border: 1px solid #aceebb; border-radius: 8px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #1a7f37;">
                    ✅ 오늘의 추천 Action Items
                </h3>
                <ol style="margin: 0; padding-left: 20px;">
                    {list_items}
                </ol>
            </div>
            """

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>오늘의 AI 브리핑 - {date_str}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f6f8fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2328;">
            <div style="max-width: 640px; margin: 0 auto; padding: 24px 16px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="display: inline-block; padding: 4px 12px; background-color: #0969da; color: #ffffff; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px;">
                        AgentLens Daily Briefing
                    </div>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #1f2328;">
                        🌅 오늘의 AI 브리핑
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #656d76;">
                        발행 일자: {date_str}
                    </p>
                </div>

                <!-- Callout Headline -->
                <div style="margin-bottom: 20px; padding: 16px; background-color: #ddf4ff; border: 1px solid #54aeff; border-radius: 8px;">
                    <div style="font-size: 15px; font-weight: 700; color: #0969da; margin-bottom: 6px;">
                        📌 {headline}
                    </div>
                    {f'<div style="font-size: 13px; color: #1f2328; line-height: 1.5;">{overview}</div>' if overview else ''}
                </div>

                <!-- Categories -->
                {cats_html}

                <!-- Action Items -->
                {actions_html}

                <!-- Footer -->
                <div style="text-align: center; padding-top: 16px; border-top: 1px solid #d0d7de; font-size: 12px; color: #8c959f;">
                    <p style="margin: 0 0 6px 0;">
                        AgentLens • AI & Agent 기술 큐레이션 웹 애플리케이션
                    </p>
                    <p style="margin: 0;">
                        <a href="http://localhost:3001" style="color: #0969da; text-decoration: none;">대시보드 바로가기</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        return html

    def _send_sync(
        self,
        host: str,
        port: int,
        user: str,
        password: str,
        use_tls: bool,
        from_email: str,
        recipients: List[str],
        msg: MIMEMultipart
    ) -> Tuple[bool, str]:
        """Synchronous SMTP send wrapped in asyncio.to_thread."""
        try:
            if port == 465 or (use_tls and port == 465):
                server = smtplib.SMTP_SSL(host, port, timeout=12.0)
            else:
                server = smtplib.SMTP(host, port, timeout=12.0)
                if use_tls:
                    server.starttls()

            if user and password:
                server.login(user, password)

            server.sendmail(from_email, recipients, msg.as_string())
            server.quit()
            return True, f"성공적으로 {len(recipients)}명의 수신자에게 이메일을 발송했습니다."
        except smtplib.SMTPAuthenticationError:
            return False, "SMTP 계정 인증 실패: 아이디 또는 비밀번호(앱 비밀번호)를 확인해주세요."
        except smtplib.SMTPConnectError:
            return False, f"SMTP 서버({host}:{port})에 연결할 수 없습니다. 호스트 및 포트를 확인해주세요."
        except Exception as e:
            logger.error(f"SMTP error: {e}")
            return False, f"이메일 전송 중 오류 발생: {str(e)}"

    async def test_connection(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
        use_tls: Optional[bool] = None,
        to_email: Optional[str] = None
    ) -> Tuple[bool, str]:
        """Tests SMTP connection and sends a test email if to_email is provided."""
        h = (host or settings.SMTP_HOST).strip()
        p = port or settings.SMTP_PORT
        u = (user or settings.SMTP_USER).strip()
        pw = (password or settings.SMTP_PASSWORD).strip()
        tls = settings.SMTP_USE_TLS if use_tls is None else use_tls
        target_to = (to_email or settings.SMTP_TO).strip()

        if not h:
            return False, "SMTP 호스트 서버 주소를 입력해주세요."

        recipients = self._parse_recipients(target_to) if target_to else ([u] if "@" in u else [])
        if not recipients:
            return False, "테스트를 받을 유효한 수신자 이메일 주소를 입력해주세요."

        from_addr = (settings.SMTP_FROM or u or "noreply@agentlens.local").strip()

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "[AgentLens] SMTP 이메일 연동 테스트 성공"
        msg["From"] = f"AgentLens <{from_addr}>"
        msg["To"] = ", ".join(recipients)

        text_content = "AgentLens 이메일 연동이 성공적으로 완료되었습니다.\n앞으로 오늘의 AI 브리핑을 이메일로 받아보실 수 있습니다."
        html_content = f"""
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #d0d7de; border-radius: 8px; max-width: 500px;">
            <h2 style="color: #0969da; margin-top: 0;">🎉 AgentLens 이메일 연동 성공!</h2>
            <p>축하합니다! SMTP 서버(<code>{h}:{p}</code>) 연결 및 인증이 완벽하게 확인되었습니다.</p>
            <p>이제 일일 브리핑 모달에서 원클릭으로 브리핑을 메일로 받아보거나, 설정에 따라 매일 아침 자동으로 전송받을 수 있습니다.</p>
        </div>
        """
        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        return await asyncio.to_thread(
            self._send_sync, h, p, u, pw, tls, from_addr, recipients, msg
        )

    async def send_briefing_email(
        self,
        briefing: Dict[str, Any],
        to_email: Optional[str] = None,
        custom_subject: Optional[str] = None
    ) -> Tuple[bool, str]:
        """Sends the formatted daily briefing via email."""
        h = settings.SMTP_HOST.strip()
        p = settings.SMTP_PORT
        u = settings.SMTP_USER.strip()
        pw = settings.SMTP_PASSWORD.strip()
        tls = settings.SMTP_USE_TLS
        from_addr = (settings.SMTP_FROM or u or "noreply@agentlens.local").strip()

        target_to = (to_email or settings.SMTP_TO).strip()
        recipients = self._parse_recipients(target_to)

        if not h:
            return False, "SMTP 설정이 완료되지 않았습니다. 설정창에서 SMTP 서버를 등록해주세요."
        if not recipients:
            return False, "수신자 이메일 주소가 비어있습니다. 수신자를 입력해주세요."

        date_str = briefing.get("date", "")
        subject = custom_subject or f"[AgentLens] 오늘의 AI 브리핑 - {date_str}"

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"AgentLens <{from_addr}>"
        msg["To"] = ", ".join(recipients)

        text_content = briefing.get("markdown_report", "")
        html_content = self._build_html(briefing)

        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        return await asyncio.to_thread(
            self._send_sync, h, p, u, pw, tls, from_addr, recipients, msg
        )

email_service = EmailService()
