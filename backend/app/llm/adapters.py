from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass
class LLMResponse:
    content: str


class LLMAdapter(Protocol):
    def generate(self, system_prompt: str, user_prompt: str) -> LLMResponse:
        raise NotImplementedError


class GroqAdapter:
    def __init__(self, api_key: str, model: str, temperature: float, max_tokens: int) -> None:
        try:
            from groq import Groq
        except ImportError as exc:  # pragma: no cover - handled by runtime env
            raise RuntimeError(
                "groq is not installed. Add it to requirements.txt and install dependencies."
            ) from exc

        if not api_key:
            raise ValueError("GROQ_API_KEY is required for the Groq adapter.")

        self._client = Groq(api_key=api_key)
        self._model = model
        self._temperature = temperature
        self._max_tokens = max_tokens

    def generate(self, system_prompt: str, user_prompt: str) -> LLMResponse:
        response = self._client.chat.completions.create(
            model=self._model,
            temperature=self._temperature,
            max_tokens=self._max_tokens,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        content = response.choices[0].message.content or ""
        return LLMResponse(content=content.strip())


class OpenAICompatibleAdapter:
    def __init__(
        self,
        api_base: str,
        api_key: str,
        model: str,
        temperature: float,
        max_tokens: int,
    ) -> None:
        try:
            import httpx
        except ImportError as exc:  # pragma: no cover - handled by runtime env
            raise RuntimeError(
                "httpx is required for the OpenAI-compatible adapter."
            ) from exc

        if not api_base:
            raise ValueError("LLM_API_BASE is required for the OpenAI-compatible adapter.")
        if not api_key:
            raise ValueError("LLM_API_KEY is required for the OpenAI-compatible adapter.")

        self._client = httpx.Client(base_url=api_base, timeout=60.0)
        self._api_key = api_key
        self._model = model
        self._temperature = temperature
        self._max_tokens = max_tokens

    def generate(self, system_prompt: str, user_prompt: str) -> LLMResponse:
        payload = {
            "model": self._model,
            "temperature": self._temperature,
            "max_tokens": self._max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        response = self._client.post(
            "/v1/chat/completions",
            headers={"Authorization": f"Bearer {self._api_key}"},
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return LLMResponse(content=content.strip())
