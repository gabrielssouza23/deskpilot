from enum import StrEnum

from fastapi import APIRouter
from sqlalchemy import func, select

from app.deps import CurrentUser, DbSession
from app.enums import Sentiment, TicketCategory, TicketPriority, TicketStatus
from app.models import Ticket
from app.schemas import Stats

router = APIRouter(prefix="/api/stats", tags=["stats"])


def _count_by(db: DbSession, column, enum_cls: type[StrEnum]) -> dict:
    rows = db.execute(select(column, func.count()).group_by(column)).all()
    counts = {member: 0 for member in enum_cls}  # zero-fill so charts never miss a bucket
    counts.update({value: count for value, count in rows})
    return counts


@router.get("", response_model=Stats)
def get_stats(db: DbSession, _: CurrentUser):
    by_status = _count_by(db, Ticket.status, TicketStatus)
    unassigned_open = db.scalar(
        select(func.count())
        .select_from(Ticket)
        .where(Ticket.status == TicketStatus.OPEN, Ticket.assignee_id.is_(None))
    )
    return Stats(
        total=sum(by_status.values()),
        unassigned_open=unassigned_open or 0,
        by_status=by_status,
        by_priority=_count_by(db, Ticket.priority, TicketPriority),
        by_category=_count_by(db, Ticket.category, TicketCategory),
        by_sentiment=_count_by(db, Ticket.sentiment, Sentiment),
    )
