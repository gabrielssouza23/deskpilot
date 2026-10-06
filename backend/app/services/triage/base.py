from dataclasses import dataclass
from typing import Protocol

from pydantic import BaseModel, Field

from app.enums import Sentiment, TicketCategory, TicketPriority


@dataclass(frozen=True)
class TriageInput:
    customer_name: str
    subject: str
    message: str


class TriageResult(BaseModel):
    category: TicketCategory
    priority: TicketPriority
    sentiment: Sentiment
    language: str = Field(description="ISO 639-1 code of the language the customer wrote in")
    summary: str = Field(description="One sentence an agent can scan in two seconds")
    suggested_reply: str = Field(
        description="A ready-to-send first reply, written in the customer's language"
    )


class TriageError(Exception):
    """Raised when a provider can't produce a usable triage result."""


class TriageProvider(Protocol):
    name: str

    def triage(self, ticket: TriageInput) -> TriageResult: ...
