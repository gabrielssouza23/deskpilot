from typing import Annotated, Literal

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import Select, case, func, or_, select
from sqlalchemy.orm import selectinload

from app.deps import CurrentUser, DbSession
from app.enums import TicketCategory, TicketPriority, TicketStatus, TriageStatus
from app.models import Reply, Ticket, User
from app.schemas import (
    ReplyCreate,
    TicketCreate,
    TicketCreated,
    TicketDetail,
    TicketPage,
    TicketUpdate,
)
from app.services.triage import TriageService, get_triage_service, run_triage

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

Triage = Annotated[TriageService, Depends(get_triage_service)]

PRIORITY_RANK = case(
    {
        TicketPriority.URGENT.value: 0,
        TicketPriority.HIGH.value: 1,
        TicketPriority.MEDIUM.value: 2,
        TicketPriority.LOW.value: 3,
    },
    value=Ticket.priority,
)


def _get_ticket_or_404(db: DbSession, ticket_id: int) -> Ticket:
    ticket = db.scalar(
        select(Ticket)
        .where(Ticket.id == ticket_id)
        .options(
            selectinload(Ticket.assignee),
            selectinload(Ticket.replies).selectinload(Reply.author),
        )
        # Reload relationships from the DB: after a PATCH the cached `assignee`
        # would otherwise still point at the previous user.
        .execution_options(populate_existing=True)
    )
    if ticket is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    return ticket


@router.post("", response_model=TicketCreated, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate, db: DbSession, triage: Triage, background_tasks: BackgroundTasks
):
    """Public endpoint used by the customer contact form.

    The ticket is saved right away and AI triage runs in the background, so the
    customer never waits on the LLM call.
    """
    ticket = Ticket(
        customer_name=payload.customer_name.strip(),
        customer_email=payload.customer_email.lower(),
        subject=payload.subject.strip(),
        message=payload.message.strip(),
    )
    db.add(ticket)
    db.commit()
    background_tasks.add_task(run_triage, ticket.id, triage)
    return ticket


@router.get("", response_model=TicketPage)
def list_tickets(
    db: DbSession,
    _: CurrentUser,
    status_: Annotated[TicketStatus | None, Query(alias="status")] = None,
    priority: TicketPriority | None = None,
    category: TicketCategory | None = None,
    assignee_id: int | None = None,
    q: Annotated[str | None, Query(max_length=100)] = None,
    sort: Literal["newest", "oldest", "priority"] = "newest",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
):
    query: Select = select(Ticket)
    if status_:
        query = query.where(Ticket.status == status_)
    if priority:
        query = query.where(Ticket.priority == priority)
    if category:
        query = query.where(Ticket.category == category)
    if assignee_id is not None:
        query = query.where(Ticket.assignee_id == assignee_id)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.where(
            or_(
                Ticket.subject.ilike(term),
                Ticket.message.ilike(term),
                Ticket.customer_name.ilike(term),
                Ticket.customer_email.ilike(term),
            )
        )

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0

    order_by = {
        "newest": (Ticket.created_at.desc(), Ticket.id.desc()),
        "oldest": (Ticket.created_at.asc(), Ticket.id.asc()),
        "priority": (PRIORITY_RANK, Ticket.created_at.desc()),
    }[sort]
    items = db.scalars(
        query.options(selectinload(Ticket.assignee))
        .order_by(*order_by)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return TicketPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/{ticket_id}", response_model=TicketDetail)
def get_ticket(ticket_id: int, db: DbSession, _: CurrentUser):
    return _get_ticket_or_404(db, ticket_id)


@router.patch("/{ticket_id}", response_model=TicketDetail)
def update_ticket(ticket_id: int, payload: TicketUpdate, db: DbSession, _: CurrentUser):
    ticket = _get_ticket_or_404(db, ticket_id)
    changes = payload.model_dump(exclude_unset=True)

    for field in ("status", "priority", "category"):
        if changes.get(field) is not None:
            setattr(ticket, field, changes[field])

    # assignee_id is the only field where an explicit null is meaningful (unassign).
    if "assignee_id" in changes:
        assignee_id = changes["assignee_id"]
        if assignee_id is not None and db.get(User, assignee_id) is None:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Assignee does not exist")
        ticket.assignee_id = assignee_id

    db.commit()
    return _get_ticket_or_404(db, ticket_id)


@router.post("/{ticket_id}/replies", response_model=TicketDetail, status_code=201)
def add_reply(ticket_id: int, payload: ReplyCreate, db: DbSession, user: CurrentUser):
    ticket = _get_ticket_or_404(db, ticket_id)
    ticket.replies.append(Reply(body=payload.body.strip(), author_id=user.id))
    if payload.status:
        ticket.status = payload.status
    if ticket.assignee_id is None:
        ticket.assignee_id = user.id
    db.commit()
    return _get_ticket_or_404(db, ticket_id)


@router.post("/{ticket_id}/triage", response_model=TicketDetail, status_code=202)
def retriage_ticket(
    ticket_id: int,
    db: DbSession,
    _: CurrentUser,
    triage: Triage,
    background_tasks: BackgroundTasks,
):
    ticket = _get_ticket_or_404(db, ticket_id)
    ticket.triage_status = TriageStatus.PENDING
    db.commit()
    background_tasks.add_task(run_triage, ticket.id, triage)
    return ticket
