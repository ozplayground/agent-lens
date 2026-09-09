import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import httpx
from app.config import settings

logger = logging.getLogger("agentlens.llm")

# Tech stack dictionary for high-precision entity extraction
KNOWN_TECH_STACK = {
    # Models
    "claude 3.7": "Claude 3.7",
    "claude 3.5": "Claude 3.5",
    "gpt-4.5": "GPT-4.5",
    "gpt-4o": "GPT-4o",
    "o1": "OpenAI o1",
    "o3": "OpenAI o3",
    "deepseek-r1": "DeepSeek-R1",
    "deepseek-v3": "DeepSeek-V3",
    "deepseek": "DeepSeek",
    "gemini 2.0": "Gemini 2.0",
    "gemini 1.5": "Gemini 1.5",
    "llama 3.3": "Llama 3.3",
    "llama 3": "Llama 3",
    "mistral": "Mistral",
    "qwen": "Qwen",
    # Harness & Benchmark
    "swe-bench": "SWE-bench",
    "gaia": "GAIA",
    "webarena": "WebArena",
    "agentbench": "AgentBench",
    "sandbox": "Docker Sandbox",
    "evals": "Eval Harness",
    # Frameworks & Tooling
    "mcp": "Model Context Protocol",
    "fastmcp": "FastMCP",
    "langgraph": "LangGraph",
    "crewai": "CrewAI",
    "autogen": "AutoGen",
    "langchain": "LangChain",
    "llamaindex": "LlamaIndex",
    "browser-use": "Browser-Use",
    "vllm": "vLLM",
    "ollama": "Ollama",
    "docker": "Docker",
    "fastapi": "FastAPI",
    "python": "Python",
    "typescript": "TypeScript"
}

CATEGORY_INSIGHTS = {
    "harness": "에이전트의 실제 코드 수정 및 툴 사용 역량을 객관적으로 평가할 수 있는 표준 벤치마크 및 회귀 테스트 하네스 기준을 제공합니다.",
    "mcp_plugins_skills": "에이전트와 외부 툴·데이터베이스 간의 연결 프로토콜을 표준화하여 플러그인 확장성과 보안 격리를 대폭 개선합니다.",
    "agent_tech": "단일 프롬프트를 넘어 복합 멀티에이전트 협업, 상태 영속성, 자율 브라우징 워크플로우를 구축하는 실전 아키텍처를 제시합니다.",
    "ai_news": "프론티어 추론 모델과 오픈소스 LLM의 성능 혁신을 통해 자율 에이전트의 기반 추론 능력(Reasoning)이 한 단계 도약함을 시사합니다."
}

class LLMProcessor:
    """
    Intelligent LLM processor supporting:
    - Quality scoring and noise filtering
    - 3-bullet technical TL;DR generation
    - 'Why It Matters' developer implications
    - Automated tech stack and model entity extraction
    - Interactive Q&A for articles
    """

    def __init__(self):
        self.gemini_key = getattr(settings, "GEMINI_API_KEY", "")
        self.openai_key = getattr(settings, "OPENAI_API_KEY", "")
        self.ollama_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")

    async def _call_gemini(self, prompt: str) -> Optional[str]:
        key = getattr(settings, "GEMINI_API_KEY", "") or self.gemini_key
        if not key:
            return None
        configured_model = getattr(settings, "GEMINI_MODEL", "gemini-flash-latest")
        candidates = []
        if configured_model:
            candidates.append(configured_model)
        for m in ["gemini-flash-latest", "gemini-3.6-flash", "gemini-2.5-flash"]:
            if m not in candidates:
                candidates.append(m)

        for model in candidates:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1000}
            }
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates_list = data.get("candidates", [])
                        if candidates_list:
                            parts = candidates_list[0].get("content", {}).get("parts", [])
                            if parts and "text" in parts[0]:
                                logger.info(f"Gemini generation succeeded with model {model}")
                                return parts[0]["text"].strip()
                    else:
                        logger.warning(f"Gemini API ({model}) returned {res.status_code}: {res.text[:120]}")
            except Exception as e:
                logger.warning(f"Gemini API call ({model}) failed: {e}")
        return None

    async def _call_openai(self, prompt: str) -> Optional[str]:
        key = getattr(settings, "OPENAI_API_KEY", "") or self.openai_key
        if not key:
            return None
        model = getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 1000
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.warning(f"OpenAI API call failed: {e}")
        return None

    async def _call_ollama(self, prompt: str) -> Optional[str]:
        base_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434") or self.ollama_url
        if not base_url:
            return None
        model = getattr(settings, "OLLAMA_MODEL", "llama3.2:latest")
        url = f"{base_url.rstrip('/')}/api/generate"
        payload = {"model": model, "prompt": prompt, "stream": False}
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("response", "").strip()
        except Exception as e:
            logger.debug(f"Ollama call failed or not running: {e}")
        return None

    async def _generate_live_answer(self, prompt: str) -> Optional[str]:
        provider = getattr(settings, "LLM_PROVIDER", "auto").lower()
        if provider == "gemini":
            ans = await self._call_gemini(prompt)
            if ans: return ans
        elif provider == "openai":
            ans = await self._call_openai(prompt)
            if ans: return ans
        elif provider == "ollama":
            ans = await self._call_ollama(prompt)
            if ans: return ans
        else: # auto
            if getattr(settings, "GEMINI_API_KEY", ""):
                ans = await self._call_gemini(prompt)
                if ans: return ans
            if getattr(settings, "OPENAI_API_KEY", ""):
                ans = await self._call_openai(prompt)
                if ans: return ans
        return None

    def extract_tech_stack(self, text: str) -> List[str]:
        t_lower = text.lower()
        found = set()
        for pattern, label in KNOWN_TECH_STACK.items():
            if re.search(r'\b' + re.escape(pattern) + r'\b', t_lower):
                found.add(label)
        return sorted(list(found))

    def evaluate_quality_and_signal(self, title: str, summary: str, source: str) -> Dict[str, Any]:
        text = f"{title} {summary}".lower()
        score = 6.0  # Base quality

        # Tech depth signals
        high_signals = [
            "benchmark", "swe-bench", "protocol", "architecture", "evaluation", "sandbox",
            "multi-agent", "reasoning", "open-source", "하네스", "벤치마크", "평가",
            "아키텍처", "프로토콜", "mcp", "langgraph", "fastmcp", "agent", "에이전트",
            "모델", "도구", "스킬", "framework"
        ]
        matched_signals = 0
        for kw in high_signals:
            if kw in text:
                matched_signals += 1

        score += min(2.0, matched_signals * 0.4)

        # Source credibility weight
        if source in ["github", "arxiv", "huggingface", "rss"]:
            score += 0.8
        elif source == "rss_kr":
            score += 0.8

        # Spam / noise penalties
        low_signals = ["sale", "discount", "crypto price", "airdrop", "coupon", "광고", "특가", "할인"]
        for kw in low_signals:
            if kw in text:
                score -= 3.0

        if len(title.strip()) < 10:
            score -= 1.5

        score = max(1.0, min(10.0, round(score, 1)))
        cutoff = getattr(settings, "QUALITY_CUTOFF_SCORE", 5.0)
        high_thresh = getattr(settings, "HIGH_SIGNAL_THRESHOLD", 7.0)
        is_worthwhile = score >= cutoff
        is_high_signal = score >= high_thresh

        return {
            "quality_score": score,
            "is_worthwhile": is_worthwhile,
            "is_high_signal": is_high_signal
        }

    def generate_synthesis(self, title: str, summary: str, category: str) -> Dict[str, Any]:
        """Generates 3-bullet TL;DR and 'Why it matters' developer insight."""
        tech_entities = self.extract_tech_stack(f"{title} {summary}")
        clean_sum = (summary or "").strip()

        # Generate 3 crisp TL;DR bullets
        bullets = []
        bullets.append(f"핵심 주제: {title}")

        if tech_entities:
            bullets.append(f"관련 기술/모델: {', '.join(tech_entities[:4])} 적용 및 생태계 연계")
        else:
            bullets.append("AI 에이전트 및 하네스 최신 개발 워크플로우 분석")

        if clean_sum:
            # take first 1-2 clean sentences
            sentences = [s.strip() for s in re.split(r'[.!?]\s+', clean_sum) if len(s.strip()) > 15]
            if sentences:
                bullets.append(f"주요 내용: {sentences[0]}")
            else:
                bullets.append(f"주요 내용: {clean_sum[:120]}...")
        else:
            bullets.append("공식 레포지토리 및 기술 문서 릴리즈")

        # Developer insight
        base_insight = CATEGORY_INSIGHTS.get(category, CATEGORY_INSIGHTS["ai_news"])
        if tech_entities:
            why_it_matters = f"{tech_entities[0]} 기반 구현에서 {base_insight}"
        else:
            why_it_matters = base_insight

        return {
            "tldr_bullets": bullets[:3],
            "why_it_matters": why_it_matters,
            "tech_stack": tech_entities
        }

    async def answer_question(self, item_title: str, item_summary: str, category: str, tech_stack: List[str], question: str) -> str:
        """Interactive Ask AI answer generator with live LLM and heuristic fallback."""
        prompt = (
            f"당신은 AI 에이전트 및 하네스 엔지니어링 전문가입니다.\n"
            f"다음 기술 소식을 바탕으로 사용자의 질문에 한국어로 명확하고 실질적인 기술 답변을 마크다운으로 작성해주세요.\n\n"
            f"[기사 정보]\n"
            f"- 제목: {item_title}\n"
            f"- 요약: {item_summary}\n"
            f"- 카테고리: {category}\n"
            f"- 관련 기술스택: {', '.join(tech_stack) if tech_stack else 'AI / Agent'}\n\n"
            f"[사용자 질문]\n"
            f"{question}"
        )
        live_ans = await self._generate_live_answer(prompt)
        if live_ans:
            return live_ans

        q_lower = question.lower()
        context = f"제목: {item_title}\n요약: {item_summary}\n카테고리: {category}\n기술스택: {', '.join(tech_stack)}"

        # If question asks about application
        if any(k in q_lower for k in ["적용", "도입", "사용", "how", "apply"]):
            return (
                f"**[적용 방안 가이드]**\n"
                f"'{item_title}' 소식은 주로 **{category.upper()}** 영역의 워크플로우 개선과 관련이 있습니다.\n\n"
                f"1. **연동 검토**: {', '.join(tech_stack) if tech_stack else '해당 기술'}의 공식 인터페이스 및 문서를 확인하세요.\n"
                f"2. **하네스 격리**: 신규 에이전트 또는 MCP 도구를 붙이기 전 샌드박스 환경에서 회귀 테스트를 먼저 수행하는 것을 권장합니다.\n"
                f"3. **기대 효과**: {CATEGORY_INSIGHTS.get(category, '에이전트 개발 효율성이 향상됩니다.')}"
            )
        elif any(k in q_lower for k in ["차이", "비교", "장점", "difference", "vs"]):
            return (
                f"**[비교 및 차별점 분석]**\n"
                f"기존 방식 대비 '{item_title}'의 주요 차별점은 표준화 및 자동화 수준입니다.\n\n"
                f"- **주요 특징**: {item_summary[:180] if item_summary else '표준 스펙 준수'}\n"
                f"- **기술 스택**: {', '.join(tech_stack) if tech_stack else '표준 에이전트 도구'}\n"
                f"- **핵심 가치**: 수동 설정 없이 재사용 가능한 하네스 및 프로토콜 규격을 제공합니다."
            )
        else:
            return (
                f"**[AI 요약 답변]**\n"
                f"질문하신 내용에 대한 분석 결과입니다:\n\n"
                f"- **핵심 요점**: {item_title}\n"
                f"- **기술 맥락**: {item_summary[:200] if item_summary else '최신 AI 기술 동향'}\n"
                f"- **개발자 시사점**: {CATEGORY_INSIGHTS.get(category, '최신 AI 동향')}"
            )

llm_processor = LLMProcessor()
