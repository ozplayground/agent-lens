import os
import re
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional, Tuple, AsyncGenerator
from datetime import datetime, timezone
import httpx
from app.config import settings, load_json_config
from app.collectors.categorizer import is_strictly_ai_related, classify_and_tag

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
        self._qa_cache: Dict[str, Tuple[str, str]] = {}
        self._eval_cache: Dict[str, Dict[str, Any]] = {}

    async def _call_gemini(self, prompt: str) -> Tuple[Optional[str], Optional[str]]:
        json_cfg = load_json_config()
        key = (
            getattr(settings, "GEMINI_API_KEY", "")
            or json_cfg.get("llm", {}).get("gemini_api_key", "")
            or os.environ.get("GEMINI_API_KEY", "")
            or self.gemini_key
        )
        if not key:
            return None, None
        configured_model = (
            getattr(settings, "GEMINI_MODEL", "")
            or json_cfg.get("llm", {}).get("gemini_model", "")
            or "gemini-3.5-flash"
        )
        candidates = []
        if configured_model and configured_model not in ["gemini-2.0-flash", "gemini-flash-latest"]:
            candidates.append(configured_model)
        for m in ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.6-flash"]:
            if m not in candidates:
                candidates.append(m)

        for model in candidates:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2048}
            }
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates_list = data.get("candidates", [])
                        if candidates_list:
                            parts = candidates_list[0].get("content", {}).get("parts", [])
                            # Extract all non-thought text parts
                            ans_parts = [
                                p["text"].strip() for p in parts
                                if not p.get("thought") and "text" in p and p["text"].strip()
                            ]
                            if ans_parts:
                                ans_text = "\n\n".join(ans_parts).strip()
                                logger.info(f"Gemini generation succeeded with model {model}")
                                return ans_text, f"Google {model}"
                            elif parts and "text" in parts[0]:
                                return parts[0]["text"].strip(), f"Google {model}"
                    elif res.status_code == 429:
                        logger.warning(f"Gemini API ({model}) rate limited (429), will fallback gracefully")
                    else:
                        logger.warning(f"Gemini API ({model}) returned {res.status_code}: {res.text[:120]}")
            except Exception as e:
                logger.warning(f"Gemini API call ({model}) failed: {e}")
        return None, None

    async def _call_openai(self, prompt: str) -> Tuple[Optional[str], Optional[str]]:
        json_cfg = load_json_config()
        key = (
            getattr(settings, "OPENAI_API_KEY", "")
            or json_cfg.get("llm", {}).get("openai_api_key", "")
            or os.environ.get("OPENAI_API_KEY", "")
            or self.openai_key
        )
        if not key:
            return None, None
        model = (
            getattr(settings, "OPENAI_MODEL", "")
            or json_cfg.get("llm", {}).get("openai_model", "")
            or "gpt-4o-mini"
        )
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 1500
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"].strip(), f"OpenAI {model}"
        except Exception as e:
            logger.warning(f"OpenAI API call failed: {e}")
        return None, None

    async def _call_ollama(self, prompt: str) -> Tuple[Optional[str], Optional[str]]:
        base_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434") or self.ollama_url
        if not base_url:
            return None, None
        model = getattr(settings, "OLLAMA_MODEL", "llama3.2:latest")
        url = f"{base_url.rstrip('/')}/api/generate"
        payload = {"model": model, "prompt": prompt, "stream": False}
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("response", "").strip(), f"Ollama {model}"
        except Exception as e:
            logger.debug(f"Ollama call failed or not running: {e}")
        return None, None

    async def _generate_live_answer(self, prompt: str) -> Tuple[Optional[str], Optional[str]]:
        provider = getattr(settings, "LLM_PROVIDER", "auto").lower()
        if provider == "gemini":
            ans, model = await self._call_gemini(prompt)
            if ans: return ans, model
        elif provider == "openai":
            ans, model = await self._call_openai(prompt)
            if ans: return ans, model
        elif provider == "ollama":
            ans, model = await self._call_ollama(prompt)
            if ans: return ans, model
        else: # auto
            if getattr(settings, "GEMINI_API_KEY", ""):
                ans, model = await self._call_gemini(prompt)
                if ans: return ans, model
            if getattr(settings, "OPENAI_API_KEY", ""):
                ans, model = await self._call_openai(prompt)
                if ans: return ans, model
        return None, None

    def extract_tech_stack(self, text: str) -> List[str]:
        t_lower = text.lower()
        found = set()
        for pattern, label in KNOWN_TECH_STACK.items():
            if re.search(r'\b' + re.escape(pattern) + r'\b', t_lower):
                found.add(label)
        return sorted(list(found))

    def evaluate_quality_and_signal(self, title: str, summary: str, source: str) -> Dict[str, Any]:
        text = f"{title} {summary}".lower()

        # Strict domain gate for mixed/general feeds (GeekNews, general RSS, HackerNews)
        is_mixed_source = source in ["rss_kr", "rss", "hackernews", "web"]
        is_ai_domain = is_strictly_ai_related(title, summary)
        if is_mixed_source and not is_ai_domain:
            return {
                "quality_score": 1.0,
                "is_worthwhile": False,
                "is_high_signal": False,
                "rejection_reason": "Non-AI domain topic in mixed feed"
            }

        # Base quality: mixed feeds start lower (3.5), dedicated AI feeds start at 6.0
        score = 3.5 if is_mixed_source else 6.0

        # Tech depth signals
        high_signals = [
            "benchmark", "swe-bench", "protocol", "architecture", "evaluation", "sandbox",
            "multi-agent", "reasoning", "open-source", "하네스", "벤치마크", "평가 프레임워크",
            "아키텍처", "프로토콜", "mcp", "langgraph", "fastmcp", "agent", "에이전트",
            "모델", "도구 호출", "스킬", "framework", "coding agent", "추론 모델"
        ]
        matched_signals = 0
        for kw in high_signals:
            if kw in text:
                matched_signals += 1

        score += min(2.5, matched_signals * 0.5)

        # Source credibility weight
        if source in ["github", "arxiv", "huggingface"]:
            score += 1.0
        elif source in ["rss", "rss_kr"] and is_ai_domain:
            score += 0.5

        # Spam / noise penalties
        low_signals = [
            "sale", "discount", "crypto price", "airdrop", "coupon", "광고", "특가", "할인",
            "해고 통보", "취업", "연봉", "부동산", "사고방식", "파푸아뉴기니", "전자책", "줄무늬"
        ]
        for kw in low_signals:
            if kw in text:
                score -= 3.5

        if len(title.strip()) < 10:
            score -= 2.0

        score = max(1.0, min(10.0, round(score, 1)))
        cutoff = getattr(settings, "QUALITY_CUTOFF_SCORE", 5.0)
        high_thresh = getattr(settings, "HIGH_SIGNAL_THRESHOLD", 7.0)

        is_worthwhile = score >= cutoff
        if is_mixed_source and not is_ai_domain:
            is_worthwhile = False

        is_high_signal = score >= high_thresh and is_worthwhile

        return {
            "quality_score": score,
            "is_worthwhile": is_worthwhile,
            "is_high_signal": is_high_signal
        }

    async def evaluate_content_with_llm(
        self,
        title: str,
        summary: str,
        source: str,
        category_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Deep LLM-grade relevance and quality evaluation.
        1. Fast heuristic pre-filter to instantly reject obvious non-AI noise without LLM latency.
        2. Live LLM evaluation (Gemini/OpenAI) for genuine semantic relevance and deep quality scoring.
        3. Strict heuristic fallback if LLM is unreachable or rate limited.
        """
        cache_key = f"{title.strip().lower()}::{source}"
        if cache_key in self._eval_cache:
            return self._eval_cache[cache_key]

        is_mixed_source = source in ["rss_kr", "rss", "hackernews", "web"]
        is_ai_domain = is_strictly_ai_related(title, summary)

        # 1. Fast Pre-Filter: If from general tech feed and has zero AI relevance, reject immediately
        if is_mixed_source and not is_ai_domain:
            result = {
                "quality_score": 1.0,
                "relevance_score": 0.0,
                "is_worthwhile": False,
                "is_high_signal": False,
                "category": "unrelated",
                "rejection_reason": "Pre-filter: No AI/Agent/MCP domain relevance found in mixed feed",
                "why_it_matters": None,
                "evaluated_by": "pre_filter_gate"
            }
            self._eval_cache[cache_key] = result
            return result

        # 2. Live LLM Evaluation
        has_gemini = bool(getattr(settings, "GEMINI_API_KEY", "") or os.environ.get("GEMINI_API_KEY", ""))
        has_openai = bool(getattr(settings, "OPENAI_API_KEY", "") or os.environ.get("OPENAI_API_KEY", ""))

        if has_gemini or has_openai:
            prompt = (
                f"You are a strict, world-class AI & Autonomous Agent Curator for AgentLens.\n"
                f"AgentLens ONLY indexes topics that are directly and deeply relevant to:\n"
                f"1. Agent Harnesses, Benchmarks, Evals, Sandboxes (SWE-bench, GAIA, agent testing, regression harnesses)\n"
                f"2. Model Context Protocol (MCP), Agent Tools, Skills & Plugins (tool calling, FastMCP, MCP servers)\n"
                f"3. Autonomous Agent Frameworks, Multi-Agent Systems, Coding Agents (LangGraph, CrewAI, AutoGen, browser-use)\n"
                f"4. Frontier AI Models, LLMs & Reasoning (OpenAI, Anthropic, DeepSeek, Gemini, prompt engineering, RLVR)\n\n"
                f"CRITICAL REJECTION CRITERIA:\n"
                f"- General programming (e.g., SQLite single-file apps, CSS frameworks, Java/Rust releases, generic OS/Linux, hardware, terminal fonts) MUST BE REJECTED (is_worthwhile: false).\n"
                f"- General business, personal career essays, company layoffs, or non-AI software MUST BE REJECTED.\n"
                f"- Only approve articles that provide genuine engineering value to AI and Agent developers.\n\n"
                f"[Candidate Article]\n"
                f"- Title: {title}\n"
                f"- Summary: {summary}\n"
                f"- Source: {source}\n\n"
                f"Respond with JSON ONLY (do not include markdown code block backticks if possible, just the raw JSON object):\n"
                f"{{\n"
                f'  "is_relevant_to_ai_agent": true,\n'
                f'  "category": "harness" | "mcp_plugins_skills" | "agent_tech" | "ai_news" | "irrelevant",\n'
                f'  "relevance_score": 8.5,\n'
                f'  "quality_score": 7.5,\n'
                f'  "is_worthwhile": true,\n'
                f'  "is_high_signal": true,\n'
                f'  "rejection_reason": null,\n'
                f'  "why_it_matters": "1-2 concise Korean sentences explaining developer architectural significance"\n'
                f"}}"
            )

            try:
                live_ans, model_name = await self._generate_live_answer(prompt)
                if live_ans:
                    cleaned = re.sub(r'^```(?:json)?\s*', '', live_ans.strip(), flags=re.IGNORECASE)
                    cleaned = re.sub(r'\s*```$', '', cleaned.strip())
                    m = re.search(r'\{.*\}', cleaned, re.DOTALL)
                    if m:
                        data = json.loads(m.group(0))
                        is_rel = bool(data.get("is_relevant_to_ai_agent"))
                        cat = str(data.get("category", "unrelated")).lower()
                        rel_score = float(data.get("relevance_score", 0.0))
                        q_score = float(data.get("quality_score", 5.0))
                        cutoff = getattr(settings, "QUALITY_CUTOFF_SCORE", 5.0)
                        high_thresh = getattr(settings, "HIGH_SIGNAL_THRESHOLD", 7.0)

                        is_worthwhile = bool(data.get("is_worthwhile")) and is_rel and (cat != "irrelevant") and (rel_score >= 5.0) and (q_score >= cutoff)
                        is_high_signal = is_worthwhile and (q_score >= high_thresh or bool(data.get("is_high_signal")))

                        result = {
                            "quality_score": round(q_score, 1),
                            "relevance_score": round(rel_score, 1),
                            "is_worthwhile": is_worthwhile,
                            "is_high_signal": is_high_signal,
                            "category": cat if (is_worthwhile and cat in CATEGORY_INSIGHTS) else "unrelated",
                            "rejection_reason": data.get("rejection_reason") if not is_worthwhile else None,
                            "why_it_matters": data.get("why_it_matters"),
                            "evaluated_by": model_name
                        }
                        self._eval_cache[cache_key] = result
                        return result
            except Exception as e:
                logger.warning(f"Live LLM evaluation error: {e}, falling back to strict heuristic gate")

        # 3. Strict Heuristic Fallback
        base_eval = self.evaluate_quality_and_signal(title, summary, source)
        cat, _, _ = classify_and_tag(title, summary)

        if not base_eval["is_worthwhile"] or cat == "unrelated":
            result = {
                "quality_score": base_eval["quality_score"],
                "relevance_score": 0.0,
                "is_worthwhile": False,
                "is_high_signal": False,
                "category": "unrelated",
                "rejection_reason": base_eval.get("rejection_reason") or "Strict heuristic rejection: Low signal or unrelated",
                "why_it_matters": None,
                "evaluated_by": "heuristic_fallback"
            }
        else:
            result = {
                "quality_score": base_eval["quality_score"],
                "relevance_score": 7.0,
                "is_worthwhile": True,
                "is_high_signal": base_eval["is_high_signal"],
                "category": cat,
                "rejection_reason": None,
                "why_it_matters": None,
                "evaluated_by": "heuristic_fallback"
            }

        self._eval_cache[cache_key] = result
        return result

    def generate_synthesis(
        self,
        title: str,
        summary: str,
        category: str,
        why_it_matters_override: Optional[str] = None
    ) -> Dict[str, Any]:
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

        # Developer insight: Use override from LLM evaluation if available
        base_insight = CATEGORY_INSIGHTS.get(category, CATEGORY_INSIGHTS["ai_news"])
        if why_it_matters_override and len(why_it_matters_override.strip()) > 10:
            why_it_matters = why_it_matters_override.strip()
        elif tech_entities:
            why_it_matters = f"{tech_entities[0]} 기반 구현에서 {base_insight}"
        else:
            why_it_matters = base_insight

        return {
            "tldr_bullets": bullets[:3],
            "why_it_matters": why_it_matters,
            "tech_stack": tech_entities
        }

    async def answer_question_with_meta(
        self,
        item_title: str,
        item_summary: str,
        category: str,
        tech_stack: List[str],
        question: str
    ) -> Tuple[str, str]:
        """Interactive Ask AI answer generator returning (answer_text, model_used)."""
        cache_key = f"{item_title.strip()}:{question.strip().lower()}"
        if cache_key in self._qa_cache:
            logger.info(f"Returning cached answer for key: {cache_key[:60]}...")
            return self._qa_cache[cache_key]

        prompt = (
            f"당신은 최신 AI 기술, 자율 에이전트(Autonomous Agents), 하네스(Harness) 벤치마크 및 MCP(Model Context Protocol) 생태계 전문 수석 아키텍트입니다.\n"
            f"제공된 기술 기사 정보를 바탕으로 사용자의 질문에 대해 실무 아키텍처 및 엔지니어링 관점에서 구체적이고 깊이 있는 기술 답변을 한국어 마크다운(Markdown)으로 작성해주세요.\n\n"
            f"[분석 대상 소식]\n"
            f"- 제목: {item_title}\n"
            f"- 내용 및 맥락: {item_summary}\n"
            f"- 기술 분류: {category}\n"
            f"- 연관 기술 스택: {', '.join(tech_stack) if tech_stack else 'AI / Agent Framework'}\n\n"
            f"[사용자 질문]\n"
            f"{question}\n\n"
            f"[작성 가이드라인]\n"
            f"1. 기사 제목이나 요약을 단순 나열하거나 앵무새처럼 복사하지 마세요.\n"
            f"2. 질문자의 의도를 정확히 파악하여 기술적 메커니즘, 실제 프로젝트에 도입/연동하는 구체적 방법, 실무 아키텍처 관점의 장단점 및 트레이드오프를 체계적으로 설명하세요.\n"
            f"3. 가독성을 위해 마크다운 헤딩(###), 불릿 포인트(-), 볼드체, 인라인 코드(`...`)를 적극 활용하세요.\n"
            f"4. 실무 개발팀이 바로 실행해볼 수 있는 구체적인 액션 아이템이나 주의점(Caution)을 1~2개 제시해주세요."
        )

        live_ans, model_name = await self._generate_live_answer(prompt)
        if live_ans and model_name:
            self._qa_cache[cache_key] = (live_ans, model_name)
            return live_ans, model_name

        return self._generate_heuristic_answer(item_title, item_summary, category, tech_stack, question)

    def _generate_heuristic_answer(
        self,
        item_title: str,
        item_summary: str,
        category: str,
        tech_stack: List[str],
        question: str
    ) -> Tuple[str, str]:
        q_lower = question.lower()
        tech_display = ', '.join(tech_stack) if tech_stack else 'AI 에이전트 인프라'
        category_insight = CATEGORY_INSIGHTS.get(category, '최신 AI 기술 생태계의 표준화와 워크플로우를 개선합니다.')

        if any(k in q_lower for k in ["적용", "도입", "사용", "구현", "어떻게", "how", "apply", "build"]):
            answer = (
                f"### 🛠️ 실무 적용 및 도입 가이드\n\n"
                f"**{item_title}** 기술을 실무 프로젝트 및 에이전트 워크플로우에 연동하기 위한 핵심 절차입니다:\n\n"
                f"1. **인터페이스 연동 및 환경 구성**\n"
                f"   - 주요 기술 스택인 `{tech_display}`의 공식 규격 및 레퍼런스를 검토하고 표준 프로토콜 인터페이스를 선언하세요.\n\n"
                f"2. **하네스 기반 샌드박스 격리**\n"
                f"   - 자율 에이전트 환경에 직접 연동하기 전, Docker/가상 샌드박스 환경에서 회귀 테스트 및 도구 실행 권한을 엄격히 제한하세요.\n\n"
                f"3. **관측성(Observability) 및 로깅 체계**\n"
                f"   - 에이전트의 도구 호출 입출력과 상태 변경을 실시간 추적할 수 있도록 트레이싱 로깅을 구축하세요.\n\n"
                f"> 💡 **기대 효과**: {category_insight}"
            )
        elif any(k in q_lower for k in ["차이", "비교", "장점", "단점", "한계", "vs", "difference", "compare"]):
            answer = (
                f"### ⚖️ 기술 비교 및 차별점 분석\n\n"
                f"기존 방식과 비교했을 때 **{item_title}**의 주요 특징과 트레이드오프는 다음과 같습니다:\n\n"
                f"- **핵심 차별점**: 표준화된 규격을 통해 파편화된 구현을 통합하고, 재사용성과 확장성을 극대화합니다.\n"
                f"- **기술 스택 생태계**: `{tech_display}` 기반의 모듈화 아키텍처를 채택하여 기존 파이프라인과의 결합도를 낮춥니다.\n"
                f"- **도입 시 고려사항 (Trade-off)**: 초기 연동 및 보안 하네스 구성 비용이 발생할 수 있으나 장기적 유지보수성과 평가 신뢰도를 확보할 수 있습니다.\n\n"
                f"> 📌 **시사점**: {category_insight}"
            )
        elif any(k in q_lower for k in ["원리", "구조", "아키텍처", "동작", "왜", "why", "architecture"]):
            answer = (
                f"### 💡 핵심 원리 및 아키텍처 분석\n\n"
                f"**{item_title}**의 내부 동작 구조와 설계 원리입니다:\n\n"
                f"- **프로토콜 및 인터페이스 레이어**: 클라이언트와 에이전트 간 비동기 메시지 교환 및 도구 실행을 표준화된 방식으로 오케스트레이션합니다.\n"
                f"- **연관 기술 맥락**: `{tech_display}` 생태계와 결합하여 상태 관리와 런타임 신뢰성을 보장합니다.\n"
                f"- **설계 목표**: 복합적인 도구 호출 및 멀티에이전트 환경에서 예외 처리와 회귀 검증을 체계화하는 데 목적이 있습니다.\n\n"
                f"> 🎯 **핵심 요약**: {category_insight}"
            )
        elif any(k in q_lower for k in ["보안", "격리", "안전", "안정", "security", "sandbox", "safety"]):
            answer = (
                f"### 🔒 보안 및 격리 환경 검토 사항\n\n"
                f"**{item_title}** 도입 시 필수적으로 고려해야 할 보안 가이드라인입니다:\n\n"
                f"1. **최소 권한 원칙 (Principle of Least Privilege)**: 에이전트 도구 실행 권한을 읽기 전용 또는 명시적 승인 기반으로 제한하세요.\n"
                f"2. **런타임 샌드박스**: 컨테이너 격리를 통해 로컬 호스트 자원 및 네트워크로의 무단 탈출을 차단하세요.\n"
                f"3. **민감정보 마스킹**: API 키 및 환경변수가 프롬프트나 로그에 누출되지 않도록 전처리 필터를 적용하세요."
            )
        else:
            answer = (
                f"### 🤖 기술 맥락 및 실무 분석\n\n"
                f"**{item_title}**에 대한 기술적 분석 결과입니다:\n\n"
                f"- **기술적 배경**: `{tech_display}` 기반의 최신 워크플로우로, {item_summary[:220] if item_summary else 'AI 에이전트 생태계의 주요 발전 소식입니다.'}\n"
                f"- **엔지니어링 가치**: {category_insight}\n"
                f"- **추천 액션**: 실무 프로젝트와의 접점을 탐색하기 위해 공식 문서의 인터페이스 스펙 및 예제 코드를 선행 검토하는 것을 권장합니다."
            )

        return answer, "AgentLens Heuristic Engine"

    async def stream_question_answer(
        self,
        item_title: str,
        item_summary: str,
        category: str,
        tech_stack: List[str],
        question: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Real-time streaming answer generator yielding SSE event payloads."""
        cache_key = f"{item_title.strip()}:{question.strip().lower()}"
        if cache_key in self._qa_cache:
            ans, model = self._qa_cache[cache_key]
            yield {"event": "meta", "model": f"{model} (캐시됨)"}
            words = ans.split(" ")
            chunk_size = 4
            for i in range(0, len(words), chunk_size):
                chunk = " ".join(words[i:i+chunk_size])
                if i + chunk_size < len(words):
                    chunk += " "
                yield {"event": "token", "text": chunk}
                await asyncio.sleep(0.01)
            yield {"event": "done", "total_text": ans}
            return

        prompt = (
            f"당신은 최신 AI 기술, 자율 에이전트(Autonomous Agents), 하네스(Harness) 벤치마크 및 MCP(Model Context Protocol) 생태계 전문 수석 아키텍트입니다.\n"
            f"제공된 기술 기사 정보를 바탕으로 사용자의 질문에 대해 실무 아키텍처 및 엔지니어링 관점에서 구체적이고 깊이 있는 기술 답변을 한국어 마크다운(Markdown)으로 작성해주세요.\n\n"
            f"[분석 대상 소식]\n"
            f"- 제목: {item_title}\n"
            f"- 내용 및 맥락: {item_summary}\n"
            f"- 기술 분류: {category}\n"
            f"- 연관 기술 스택: {', '.join(tech_stack) if tech_stack else 'AI / Agent Framework'}\n\n"
            f"[사용자 질문]\n"
            f"{question}\n\n"
            f"[작성 가이드라인]\n"
            f"1. 기사 제목이나 요약을 단순 나열하거나 앵무새처럼 복사하지 마세요.\n"
            f"2. 질문자의 의도를 정확히 파악하여 기술적 메커니즘, 실제 프로젝트에 도입/연동하는 구체적 방법, 실무 아키텍처 관점의 장단점 및 트레이드오프를 체계적으로 설명하세요.\n"
            f"3. 가독성을 위해 마크다운 헤딩(###), 불릿 포인트(-), 볼드체, 인라인 코드(`...`), 코드 블록(```)을 적극 활용하세요.\n"
            f"4. 실무 개발팀이 바로 실행해볼 수 있는 구체적인 액션 아이템이나 주의점(Caution)을 1~2개 제시해주세요."
        )

        json_cfg = load_json_config()
        gemini_key = (
            getattr(settings, "GEMINI_API_KEY", "")
            or json_cfg.get("llm", {}).get("gemini_api_key", "")
            or os.environ.get("GEMINI_API_KEY", "")
            or self.gemini_key
        )
        configured_gemini_model = (
            getattr(settings, "GEMINI_MODEL", "")
            or json_cfg.get("llm", {}).get("gemini_model", "")
            or "gemini-3.5-flash-lite"
        )
        gemini_candidates = []
        if configured_gemini_model and configured_gemini_model not in ["gemini-2.0-flash", "gemini-flash-latest"]:
            gemini_candidates.append(configured_gemini_model)
        for m in ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash"]:
            if m not in gemini_candidates:
                gemini_candidates.append(m)

        stream_succeeded = False
        full_text = ""
        model_used = ""

        # 1. Try Google GenAI Official SDK streaming
        if gemini_key:
            try:
                from google import genai
                from google.genai import types
                client = genai.Client(
                    api_key=gemini_key,
                    http_options=types.HttpOptions(
                        retry_options=types.HttpRetryOptions(attempts=1)
                    )
                )
                for g_model in gemini_candidates:
                    try:
                        chat = client.aio.chats.create(
                            model=g_model,
                            config=types.GenerateContentConfig(
                                temperature=0.3,
                                max_output_tokens=2048
                            )
                        )
                        stream = await chat.send_message_stream(prompt)
                        first_chunk = True
                        async for chunk in stream:
                            if chunk.text:
                                if first_chunk:
                                    yield {"event": "meta", "model": f"Google {g_model}"}
                                    model_used = f"Google {g_model}"
                                    first_chunk = False
                                full_text += chunk.text
                                yield {"event": "token", "text": chunk.text}
                        if full_text.strip():
                            stream_succeeded = True
                            break
                    except Exception as e:
                        logger.warning(f"Google GenAI SDK stream failed for {g_model}: {e}")
                        continue
            except Exception as e:
                logger.warning(f"Google GenAI SDK client creation failed: {e}")

        # 2. Try OpenAI Official SDK streaming if Gemini wasn't used or failed
        if not stream_succeeded:
            openai_key = (
                getattr(settings, "OPENAI_API_KEY", "")
                or json_cfg.get("llm", {}).get("openai_api_key", "")
                or os.environ.get("OPENAI_API_KEY", "")
                or self.openai_key
            )
            if openai_key:
                try:
                    import openai
                    openai_client = openai.AsyncOpenAI(api_key=openai_key)
                    o_model = getattr(settings, "OPENAI_MODEL", "") or json_cfg.get("llm", {}).get("openai_model", "") or "gpt-4o-mini"
                    stream = await openai_client.chat.completions.create(
                        model=o_model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.3,
                        max_tokens=2048,
                        stream=True
                    )
                    yield {"event": "meta", "model": f"OpenAI {o_model}"}
                    model_used = f"OpenAI {o_model}"
                    async for chunk in stream:
                        if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                            txt = chunk.choices[0].delta.content
                            full_text += txt
                            yield {"event": "token", "text": txt}
                    if full_text.strip():
                        stream_succeeded = True
                except Exception as e:
                    logger.warning(f"OpenAI SDK stream failed: {e}")

        # 3. Fallback Heuristic Engine with smooth chunk streaming
        if not stream_succeeded or not full_text.strip():
            fallback_ans, fallback_model = self._generate_heuristic_answer(
                item_title=item_title,
                item_summary=item_summary,
                category=category,
                tech_stack=tech_stack,
                question=question
            )
            yield {"event": "meta", "model": fallback_model}
            model_used = fallback_model
            full_text = fallback_ans
            words = fallback_ans.split(" ")
            chunk_size = 4
            for i in range(0, len(words), chunk_size):
                chunk = " ".join(words[i:i+chunk_size])
                if i + chunk_size < len(words):
                    chunk += " "
                yield {"event": "token", "text": chunk}
                await asyncio.sleep(0.015)

        if full_text:
            self._qa_cache[cache_key] = (full_text, model_used)
            yield {"event": "done", "total_text": full_text}

    async def answer_question(self, item_title: str, item_summary: str, category: str, tech_stack: List[str], question: str) -> str:
        """Backwards-compatible wrapper returning only answer string."""
        ans, _ = await self.answer_question_with_meta(item_title, item_summary, category, tech_stack, question)
        return ans

llm_processor = LLMProcessor()
