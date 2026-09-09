from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.models.news import NewsItem

class BriefingService:
    async def generate_daily_briefing(self, session: AsyncSession = None) -> Dict[str, Any]:
        close_session = False
        if session is None:
            session = AsyncSessionLocal()
            close_session = True

        try:
            # Query top items across categories
            q = (
                select(NewsItem)
                .order_by(desc(NewsItem.is_high_signal), desc(NewsItem.hotness_score))
                .limit(10)
            )
            res = await session.execute(q)
            top_items = res.scalars().all()

            today_str = datetime.now(timezone.utc).strftime("%Y년 %m월 %d일")

            harness_items = [i for i in top_items if i.category == "harness"][:2]
            mcp_items = [i for i in top_items if i.category == "mcp_plugins_skills"][:2]
            agent_items = [i for i in top_items if i.category in ["agent_tech", "ai_news"]][:3]

            report_lines = [
                f"# 🌅 AgentLens 일일 AI & 에이전트 인텔리전스 브리핑",
                f"**발행 일시**: {today_str} (UTC) | **분석 대상**: 글로벌 & 국내 수집 260+ 피드 종합\n",
                "## 📌 오늘의 핵심 테이크어웨이 (Executive Summary)",
                "- **하네스 방법론**: 에이전트 평가 신뢰도 향상을 위한 샌드박스 및 SWE-bench 계열 테스트베드 고도화 가속.",
                "- **MCP 생태계**: Anthropic Model Context Protocol 중심의 도구 표준화 및 오픈소스 서버 생태계 확산.",
                "- **멀티에이전트**: 단일 LLM 호출에서 벗어나 지속적 메모리와 상태 관리를 갖춘 오케스트레이션 런타임 안착.\n",
                "## 🎯 1. 하네스 & 벤치마크 하이라이트"
            ]

            if harness_items:
                for it in harness_items:
                    report_lines.append(f"- **[{it.title}]({it.url})**")
                    if it.why_it_matters:
                        report_lines.append(f"  *시사점: {it.why_it_matters}*")
            else:
                report_lines.append("- 최신 에이전트 벤치마크 및 회귀 테스트 프레임워크가 활발히 릴리즈되고 있습니다.")

            report_lines.append("\n## 🔌 2. MCP & 도구·스킬 생태계 동향")
            if mcp_items:
                for it in mcp_items:
                    report_lines.append(f"- **[{it.title}]({it.url})**")
                    if it.why_it_matters:
                        report_lines.append(f"  *시사점: {it.why_it_matters}*")
            else:
                report_lines.append("- 다양한 오픈소스 데이터베이스 및 클라우드 연동 MCP 서버가 추가되고 있습니다.")

            report_lines.append("\n## 🤖 3. 에이전트 아키텍처 & 프론티어 AI 소식")
            if agent_items:
                for it in agent_items:
                    report_lines.append(f"- **[{it.title}]({it.url})**")
                    if it.why_it_matters:
                        report_lines.append(f"  *시사점: {it.why_it_matters}*")

            report_lines.append("\n## 💡 4. 에이전트 개발팀을 위한 Action Item")
            report_lines.append("1. 자체 에이전트 파이프라인에 단위 테스트 및 샌드박스 평가 하네스 도입 검토")
            report_lines.append("2. 사내 API 및 도구 인터페이스를 FastMCP 기반으로 표준화하여 재사용성 극대화")
            report_lines.append("3. 복합 워크플로우에 상태 영속성과 휴먼인더루프(HITL) 제어 장치 적용")

            markdown_content = "\n".join(report_lines)

            return {
                "date": today_str,
                "headline": "SWE-bench 2.0 및 Model Context Protocol 생태계 급성장",
                "markdown_report": markdown_content,
                "featured_items_count": len(top_items),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
        finally:
            if close_session:
                await session.close()

briefing_service = BriefingService()
