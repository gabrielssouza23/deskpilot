from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.enums import Sentiment, TicketCategory, TicketPriority, TicketStatus, TriageStatus


def utcnow() -> datetime:
    return datetime.now(UTC)


def enum_column(enum_cls: type[StrEnum]) -> Enum:
    # Store the lowercase values ("open") instead of member names ("OPEN"),
    # and use VARCHAR so adding a new value never needs a Postgres ALTER TYPE.
    return Enum(
        enum_cls,
        native_enum=False,
        length=20,
        values_callable=lambda members: [member.value for member in members],
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_name: Mapped[str] = mapped_column(String(120))
    customer_email: Mapped[str] = mapped_column(String(255), index=True)
    subject: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)

    status: Mapped[TicketStatus] = mapped_column(
        enum_column(TicketStatus), default=TicketStatus.OPEN, index=True
    )
    priority: Mapped[TicketPriority] = mapped_column(
        enum_column(TicketPriority), default=TicketPriority.MEDIUM, index=True
    )
    category: Mapped[TicketCategory] = mapped_column(
        enum_column(TicketCategory), default=TicketCategory.GENERAL, index=True
    )
    sentiment: Mapped[Sentiment] = mapped_column(enum_column(Sentiment), default=Sentiment.NEUTRAL)
    language: Mapped[str] = mapped_column(String(8), default="en")

    # Filled in by the AI triage step
    summary: Mapped[str | None] = mapped_column(Text)
    suggested_reply: Mapped[str | None] = mapped_column(Text)
    triage_status: Mapped[TriageStatus] = mapped_column(
        enum_column(TriageStatus), default=TriageStatus.PENDING
    )
    triage_provider: Mapped[str | None] = mapped_column(String(20))

    assignee_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    assignee: Mapped[User | None] = relationship()

    replies: Mapped[list["Reply"]] = relationship(
        back_populates="ticket", cascade="all, delete-orphan", order_by="Reply.created_at"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class Reply(Base):
    __tablename__ = "replies"

    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("tickets.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    ticket: Mapped[Ticket] = relationship(back_populates="replies")
    author: Mapped[User | None] = relationship()
