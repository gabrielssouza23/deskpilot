from enum import StrEnum


class TicketStatus(StrEnum):
    OPEN = "open"
    PENDING = "pending"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TicketCategory(StrEnum):
    BILLING = "billing"
    TECHNICAL = "technical"
    ACCOUNT = "account"
    FEATURE_REQUEST = "feature_request"
    GENERAL = "general"


class Sentiment(StrEnum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class TriageStatus(StrEnum):
    PENDING = "pending"
    DONE = "done"
    FAILED = "failed"
