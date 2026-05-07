"""문서 요약 모듈.

Summarizer 추상에만 의존하도록 분리하여(DIP) 호출부(BlogSession)는
구체 구현(KoBART, mock 등)을 알 필요가 없다. 새 백엔드(예: 외부 API)는
기존 코드를 변경하지 않고 추가로 구현해 SUMMARIZER 환경변수로 교체할
수 있다(OCP). 무거운 모델 로드는 프로세스 단위로 한 번만 수행한다.
"""

from __future__ import annotations

import os
from abc import ABC, abstractmethod
from threading import Lock
from typing import Optional


class Summarizer(ABC):
    @abstractmethod
    def summarize(self, text: str) -> str:
        ...


class MockSummarizer(Summarizer):
    """디버그/단위 검증용. 본문의 앞부분을 잘라 반환한다."""

    def __init__(self, max_chars: int = 200) -> None:
        self._max_chars = max_chars

    def summarize(self, text: str) -> str:
        if not text:
            return ""
        return text.replace("\n", " ").strip()[: self._max_chars]


class KoBARTSummarizer(Summarizer):
    """HuggingFace transformers 기반의 KoBART 요약기 (CPU)."""

    def __init__(
        self,
        model_name: str = "gogamza/kobart-summarization",
        max_input_tokens: int = 1024,
        max_output_tokens: int = 128,
        num_beams: int = 4,
    ) -> None:
        import torch
        from transformers import (
            BartForConditionalGeneration,
            PreTrainedTokenizerFast,
        )

        self._torch = torch
        self._tokenizer = PreTrainedTokenizerFast.from_pretrained(model_name)
        self._model = BartForConditionalGeneration.from_pretrained(model_name)
        self._model.eval()

        self._max_input_tokens = max_input_tokens
        self._max_output_tokens = max_output_tokens
        self._num_beams = num_beams

    def summarize(self, text: str) -> str:
        if not text or not text.strip():
            return ""

        cleaned = text.replace("\n", " ").strip()

        with self._torch.no_grad():
            input_ids = self._tokenizer.encode(
                cleaned,
                return_tensors="pt",
                max_length=self._max_input_tokens,
                truncation=True,
            )
            output_ids = self._model.generate(
                input_ids,
                max_length=self._max_output_tokens,
                num_beams=self._num_beams,
                eos_token_id=self._tokenizer.eos_token_id,
                early_stopping=True,
            )

        return self._tokenizer.decode(
            output_ids.squeeze().tolist(),
            skip_special_tokens=True,
        ).strip()


class _Provider:
    _instance: Optional[Summarizer] = None
    _lock = Lock()

    @classmethod
    def get(cls) -> Summarizer:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls._build()
        return cls._instance

    @staticmethod
    def _build() -> Summarizer:
        backend = os.environ.get("SUMMARIZER", "kobart").strip().lower()
        if backend == "mock":
            return MockSummarizer()
        if backend == "kobart":
            return KoBARTSummarizer()
        raise ValueError(f"Unknown SUMMARIZER backend: {backend!r}")


def get_summarizer() -> Summarizer:
    return _Provider.get()
