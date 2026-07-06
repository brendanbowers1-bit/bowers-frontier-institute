"""OpenAI Responses API client for hedge memo explanations."""

from __future__ import annotations

import os

import requests
from dotenv import load_dotenv

from currency_hedge_llm.llm.base import LLMClient


class OpenAIResponsesClient(LLMClient):
    """Generate text with OpenAI's Responses API."""

    def __init__(
        self,
        model: str,
        url: str = "https://api.openai.com/v1/responses",
        temperature: float = 0.2,
        timeout_seconds: int = 120,
    ) -> None:
        load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY is required when using --llm-provider openai."
            )
        self.api_key = api_key
        self.model = model
        self.url = url
        self.temperature = temperature
        self.timeout_seconds = timeout_seconds

    def generate(self, prompt: str) -> str:
        """Call the OpenAI Responses API and return response text."""

        response = requests.post(
            self.url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "input": prompt,
                "temperature": self.temperature,
            },
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
        return _extract_response_text(payload)


def _extract_response_text(payload: dict) -> str:
    if payload.get("output_text"):
        return str(payload["output_text"]).strip()

    pieces: list[str] = []
    for output_item in payload.get("output", []):
        for content_item in output_item.get("content", []):
            text = content_item.get("text")
            if text:
                pieces.append(str(text))
    return "\n".join(pieces).strip()
