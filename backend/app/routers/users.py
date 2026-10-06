from fastapi import APIRouter
from sqlalchemy import select

from app.deps import CurrentUser, DbSession
from app.models import User
from app.schemas import UserOut

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_agents(db: DbSession, _: CurrentUser):
    """Support agents a ticket can be assigned to."""
    return db.scalars(select(User).order_by(User.full_name)).all()
