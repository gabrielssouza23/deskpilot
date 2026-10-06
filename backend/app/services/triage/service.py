import logging
from dataclasses import dataclass

from app.config import Settings, get_settings
from app.database import SessionLocal
from app.enums import TriageStatus
from app.models import Ticket
from app.services.triage.base import TriageError, TriageInput, TriageProvider, TriageResult
from app.services.triage.claude import ClaudeTriageProvider
from app.services.triage.rules import RuleBasedTriageProvider

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class TriageOutcome:
    result: TriageResult
    provider: str


class TriageService:
    """Runs the configured provider and falls back to keyword rules if it fails."""

    def __init__(self, primary: TriageProvider, fallback: TriageProvider | None = None) -> None:
        self.primary = primary
        self.fallback = fallback or RuleBasedTriageProvider()

    def triage(self, ticket: TriageInput) -> TriageOutcome:
        try:
            return TriageOutcome(self.primary.triage(ticket), self.primary.name)
        except Exception as exc:
            if self.primary.name == self.fallback.name:
                raise
            # Expected failures (rate limits, refusals) get one line; bugs get a traceback.
            log = logger.warning if isinstance(exc, TriageError) else logger.exception
            log(
                "%s triage failed (%s); falling back to %s",
                self.primary.name,
                exc,
                self.fallback.name,
            )
            return TriageOutcome(self.fallback.triage(ticket), self.fallback.name)


def build_triage_service(settings: Settings) -> TriageService:
    if settings.ai_provider == "rules":
        return TriageService(RuleBasedTriageProvider())
    if settings.anthropic_api_key:
        return TriageService(
            ClaudeTriageProvider(model=settings.claude_model, api_key=settings.anthropic_api_key)
        )
    if settings.ai_provider == "claude":
        raise RuntimeError("AI_PROVIDER=claude requires ANTHROPIC_API_KEY to be set")
    return TriageService(RuleBasedTriageProvider())


_service: TriageService | None = None


def get_triage_service() -> TriageService:
    """FastAPI dependency; tests override it with a fake provider."""
    global _service
    if _service is None:
        _service = build_triage_service(get_settings())
    return _service


def apply_triage(ticket: Ticket, outcome: TriageOutcome) -> None:
    result = outcome.result
    ticket.category = result.category
    ticket.priority = result.priority
    ticket.sentiment = result.sentiment
    ticket.language = result.language[:8]
    ticket.summary = result.summary
    ticket.suggested_reply = result.suggested_reply
    ticket.triage_provider = outcome.provider
    ticket.triage_status = TriageStatus.DONE


def run_triage(ticket_id: int, service: TriageService) -> None:
    """Background task: triage a ticket after the HTTP response has been sent.

    It opens its own DB session because the request's session is already closed.
    """
    with SessionLocal() as db:
        ticket = db.get(Ticket, ticket_id)
        if ticket is None:
            return
        try:
            outcome = service.triage(
                TriageInput(ticket.customer_name, ticket.subject, ticket.message)
            )
            apply_triage(ticket, outcome)
        except Exception:
            logger.exception("Triage failed for ticket %s", ticket_id)
            ticket.triage_status = TriageStatus.FAILED
        db.commit()
