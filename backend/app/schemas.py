from datetime import UTC, datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field

from app.enums import Sentiment, TicketCategory, TicketPriority, TicketStatus, TriageStatus


def _as_utc(value: datetime) -> datetime:
    # SQLite drops timezone info; every timestamp we store is UTC.
    return value if value.tzinfo else value.replace(tzinfo=UTC)


UTCDatetime = Annotated[datetime, AfterValidator(_as_utc)]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Auth -------------------------------------------------------------------


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(ORMModel):
    id: int
    email: EmailStr
    full_name: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# --- Tickets ----------------------------------------------------------------


class TicketCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=120)
    customer_email: EmailStr
    subject: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=10, max_length=5000)


class TicketCreated(ORMModel):
    id: int
    subject: str
    status: TicketStatus
    created_at: UTCDatetime


class TicketUpdate(BaseModel):
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    category: TicketCategory | None = None
    assignee_id: int | None = None


class ReplyCreate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)
    # Optionally move the ticket to a new status in the same request
    # (e.g. "pending" while waiting on the customer).
    status: TicketStatus | None = None


class ReplyOut(ORMModel):
    id: int
    body: str
    author: UserOut | None
    created_at: UTCDatetime


class TicketSummary(ORMModel):
    id: int
    subject: str
    customer_name: str
    customer_email: EmailStr
    status: TicketStatus
    priority: TicketPriority
    category: TicketCategory
    sentiment: Sentiment
    summary: str | None
    triage_status: TriageStatus
    assignee: UserOut | None
    created_at: UTCDatetime
    updated_at: UTCDatetime


class TicketDetail(TicketSummary):
    message: str
    language: str
    suggested_reply: str | None
    triage_provider: str | None
    replies: list[ReplyOut]


class TicketPage(BaseModel):
    items: list[TicketSummary]
    total: int
    page: int
    page_size: int


class Stats(BaseModel):
    total: int
    unassigned_open: int
    by_status: dict[TicketStatus, int]
    by_priority: dict[TicketPriority, int]
    by_category: dict[TicketCategory, int]
    by_sentiment: dict[Sentiment, int]
