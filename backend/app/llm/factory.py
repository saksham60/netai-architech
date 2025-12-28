from app.config import settings
from app.llm.adapters import GroqAdapter, LLMAdapter, OpenAICompatibleAdapter


def get_llm_adapter() -> LLMAdapter:
    provider = settings.llm_provider.lower().strip()
    if provider == "groq":
        return GroqAdapter(
            api_key=settings.groq_api_key,
            model=settings.llm_model,
            temperature=settings.temperature,
            max_tokens=settings.max_tokens,
        )
    if provider in {"openai_compatible", "openai-compatible", "openai"}:
        return OpenAICompatibleAdapter(
            api_base=settings.llm_api_base,
            api_key=settings.llm_api_key,
            model=settings.llm_model,
            temperature=settings.temperature,
            max_tokens=settings.max_tokens,
        )

    raise ValueError(f"Unsupported LLM provider: {settings.llm_provider}")
