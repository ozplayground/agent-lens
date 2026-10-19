import asyncio
import re
from typing import AsyncGenerator, Tuple, Optional
from app.services.llm_providers.base import BaseLLMProvider

MOCK_4SECTION_REPORT = (
    "## 1. 핵심 아키텍처 및 동작 원리 (Core Architecture & Mechanics)\n"
    "AgentLens Mock Fallback Engine 분석 보고서입니다. 본 아키텍처는 자율 에이전트(Autonomous Agents), "
    "하네스(Harness) 벤치마크 평가 규격 및 FastMCP 도구 연동을 완벽히 지원하며, "
    "외부 LLM API 키 부재나 일시적 업스트림 네트워크 장애 시에도 시스템 다운타임(HTTP 503)을 원천 차단(Zero 503)합니다.\n\n"
    "## 2. 주요 기능 및 코드 구현 예시 (Features & Code Snippets)\n"
    "실무 에이전틱 워크플로우에 연동 가능한 Python 핵심 구현 예시입니다:\n\n"
    "```python\n"
    "# AgentLens Mock Resiliency Stream\n"
    "from app.services.llm_providers.mock_provider import MockLLMProvider\n\n"
    "provider = MockLLMProvider()\n"
    "async for token, model in provider.stream_chat(prompt):\n"
    "    print(f'[{model}] {token}', end='', flush=True)\n"
    "```\n\n"
    "## 3. 기존 기술 대비 차별점 및 벤치마크 (Comparison & Benchmarks)\n"
    "기존 방식(Direct Fail-Fast)과 Mock Fallback Chain 간의 정량적 비교입니다:\n\n"
    "| 평가지표 (Metric) | 기존 방식 (Direct Fail-Fast) | Mock LLM Fallback Chain |\n"
    "| :--- | :--- | :--- |\n"
    "| 서비스 가용성 (Zero 503) | 503 Service Unavailable 에러 발생 | 100% 200 OK 무중단 스트림 공급 |\n"
    "| CI/CD 자동화 테스트 통과율 | 외부 API 키 미등록 시 테스트 중단 | 100% Green 안정적 테스트 통과 |\n"
    "| 최초 응답 지연 (TTFSE) | 네트워크 타임아웃 대기 (3~5초) | 인메모리 청크 방출 (< 20ms) |\n\n"
    "## 4. 실무 도입 시 고려사항 및 트레이드오프 (Production Considerations & Trade-offs)\n"
    "1. **테스트 및 로컬 개발 환경**: `TESTING=True` 또는 `ALLOW_MOCK_FALLBACK=True` 설정을 통해 외부 결제 크레딧 소진 없이 "
    "모든 프론트엔드/백엔드 연동 흐름을 안전하게 검증합니다.\n"
    "2. **엄격한 프로덕션 게이트**: 실제 운영 환경에서는 `ALLOW_MOCK_FALLBACK=False`로 전환하여 외부 API 키 미등록 시 "
    "503 Service Unavailable 및 관리자 설정 안내 카드를 즉각 반환하도록 격리합니다."
)

class MockLLMProvider(BaseLLMProvider):
    """
    Mock LLM Provider implementing BaseLLMProvider.
    Guarantees Zero 503 in test, CI, and keyless local development environments.
    Complies 100% with ADR-008 and ADR-010 4-section report protocol.
    """

    def __init__(self, model_name: str = "MockLLMProvider (Fallback)"):
        self._model_name = model_name

    @property
    def provider_name(self) -> str:
        return "mock"

    def is_available(self) -> bool:
        return True

    async def generate_text(self, prompt: str, **kwargs) -> Tuple[str, str]:
        """Returns 4-section structured markdown and model name."""
        return MOCK_4SECTION_REPORT, self._model_name

    async def stream_chat(
        self, prompt: str, **kwargs
    ) -> AsyncGenerator[Tuple[str, str], None]:
        """Streams 4-section structured markdown tokens asynchronously."""
        # Split into small chunks of words/sentences for realistic token streaming
        chunks = re.split(r'(\s+)', MOCK_4SECTION_REPORT)
        chunk_group_size = 4
        for i in range(0, len(chunks), chunk_group_size):
            chunk = "".join(chunks[i:i + chunk_group_size])
            if chunk:
                yield (chunk, self._model_name)
                await asyncio.sleep(0.002)
