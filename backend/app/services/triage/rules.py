"""Keyword-based triage.

Runs when no Anthropic API key is configured and as a safety net when the
Claude call fails, so a ticket is never left without a category or priority.
"""

import re
from functools import lru_cache

from app.enums import Sentiment, TicketCategory, TicketPriority
from app.services.triage.base import TriageInput, TriageResult

CATEGORY_KEYWORDS: dict[TicketCategory, tuple[str, ...]] = {
    TicketCategory.BILLING: (
        "invoice",
        "charge",
        "charged",
        "refund",
        "payment",
        "billing",
        "card",
        "subscription",
        "price",
        "plan",
        "receipt",
        "fatura",
        "cobrança",
        "reembolso",
    ),
    TicketCategory.TECHNICAL: (
        "error",
        "bug",
        "crash",
        "broken",
        "not working",
        "doesn't work",
        "does not work",
        "fails",
        "failed",
        "slow",
        "timeout",
        "api",
        "500",
        "404",
        "erro",
        "integration",
    ),
    TicketCategory.ACCOUNT: (
        "password",
        "log in",
        "login",
        "sign in",
        "account",
        "2fa",
        "two-factor",
        "locked",
        "email address",
        "username",
        "senha",
        "conta",
    ),
    TicketCategory.FEATURE_REQUEST: (
        "feature",
        "would be great",
        "would love",
        "suggestion",
        "could you add",
        "please add",
        "wish",
        "roadmap",
        "dark mode",
        "export",
    ),
}

URGENT_KEYWORDS = (
    "urgent",
    "asap",
    "immediately",
    "outage",
    "down",
    "production",
    "data loss",
    "security",
    "hacked",
    "breach",
    "can't access",
    "cannot access",
    "urgente",
)
HIGH_KEYWORDS = (
    "charged twice",
    "double charge",
    "not working",
    "error",
    "failed",
    "locked out",
    "refund",
    "blocked",
    "cancel",
)

NEGATIVE_WORDS = (
    "angry",
    "frustrated",
    "frustrating",
    "terrible",
    "awful",
    "unacceptable",
    "disappointed",
    "worst",
    "annoyed",
    "ridiculous",
    "useless",
    "still",
    "again",
)
# "Thanks" alone is just politeness ("can you refund me? thanks"), so it doesn't count.
POSITIVE_WORDS = (
    "great",
    "love",
    "awesome",
    "appreciate",
    "amazing",
    "excellent",
)

LANGUAGE_HINTS = {
    "pt": ("não", "você", "obrigado", "olá", "minha", "está", "para", "estou"),
    "es": ("usted", "gracias", "hola", "necesito", "está", "cuenta", "por favor", "estoy"),
}

REPLY_BODIES: dict[TicketCategory, str] = {
    TicketCategory.BILLING: (
        "I'm sorry for the trouble with your billing. I'm checking your account and recent "
        "charges now, and I'll get back to you with a clear answer as soon as possible."
    ),
    TicketCategory.TECHNICAL: (
        "Sorry you ran into this. Could you share the steps that led to the problem, the time it "
        "happened and a screenshot of any error message? That will help our engineers reproduce it."
    ),
    TicketCategory.ACCOUNT: (
        "I can help you get back into your account. For your security, please confirm the email "
        "address on the account and I'll guide you through the next steps."
    ),
    TicketCategory.FEATURE_REQUEST: (
        "Thanks for the suggestion! I've shared it with our product team. We can't promise a "
        "date yet, but feedback like this directly shapes our roadmap."
    ),
    TicketCategory.GENERAL: (
        "Thanks for reaching out. I'm looking into your message and will follow up shortly with "
        "more details."
    ),
}


@lru_cache
def _pattern(keyword: str) -> re.Pattern[str]:
    # Whole-word match, so "down" doesn't fire on "download" or "api" on "rapid".
    return re.compile(rf"(?<!\w){re.escape(keyword)}(?!\w)")


def _contains_any(text: str, keywords: tuple[str, ...]) -> int:
    return sum(1 for keyword in keywords if _pattern(keyword).search(text))


def _classify_category(text: str) -> TicketCategory:
    scores = {category: _contains_any(text, words) for category, words in CATEGORY_KEYWORDS.items()}
    best, score = max(scores.items(), key=lambda item: item[1])
    return best if score > 0 else TicketCategory.GENERAL


def _classify_priority(text: str, category: TicketCategory) -> TicketPriority:
    if _contains_any(text, URGENT_KEYWORDS):
        return TicketPriority.URGENT
    if _contains_any(text, HIGH_KEYWORDS):
        return TicketPriority.HIGH
    if category in (TicketCategory.FEATURE_REQUEST, TicketCategory.GENERAL):
        return TicketPriority.LOW
    return TicketPriority.MEDIUM


def _classify_sentiment(text: str) -> Sentiment:
    score = _contains_any(text, POSITIVE_WORDS) - _contains_any(text, NEGATIVE_WORDS)
    if text.count("!") >= 3:
        score -= 1
    if score > 0:
        return Sentiment.POSITIVE
    if score < 0:
        return Sentiment.NEGATIVE
    return Sentiment.NEUTRAL


def _detect_language(text: str) -> str:
    scores = {lang: _contains_any(text, hints) for lang, hints in LANGUAGE_HINTS.items()}
    lang, score = max(scores.items(), key=lambda item: item[1])
    return lang if score >= 2 else "en"


# "Hi!", "Hello team,", "Dear support team," - a greeting plus at most two words and punctuation
GREETING = re.compile(r"^(hi|hello|hey|dear|olá|ola|oi|hola)(\s+\w+){0,2}\s*[,.!]\s*", re.I)


def _summarize(subject: str, message: str) -> str:
    """First sentence that says something (skipping "Hi team!"), capped at 180 chars."""
    sentences = re.split(r"(?<=[.!?])\s+", message.strip())
    for sentence in sentences:
        sentence = GREETING.sub("", sentence).strip()
        if len(sentence.split()) >= 4:
            break
    else:
        sentence = subject.strip()
    sentence = sentence[0].upper() + sentence[1:]
    return sentence if len(sentence) <= 180 else sentence[:177].rstrip() + "..."


class RuleBasedTriageProvider:
    name = "rules"

    def triage(self, ticket: TriageInput) -> TriageResult:
        text = f"{ticket.subject}\n{ticket.message}".lower()
        category = _classify_category(text)
        first_name = ticket.customer_name.split()[0] if ticket.customer_name.strip() else "there"
        return TriageResult(
            category=category,
            priority=_classify_priority(text, category),
            sentiment=_classify_sentiment(text),
            language=_detect_language(text),
            summary=_summarize(ticket.subject, ticket.message),
            suggested_reply=(
                f"Hi {first_name},\n\n{REPLY_BODIES[category]}\n\nBest regards,\nDeskPilot Support"
            ),
        )
