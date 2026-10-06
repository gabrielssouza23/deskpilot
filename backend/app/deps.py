from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.models import User
from app.security import decode_access_token

DbSession = Annotated[Session, Depends(get_db)]
AppSettings = Annotated[Settings, Depends(get_settings)]

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    db: DbSession,
    settings: AppSettings,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    """Accept a Bearer token (API clients, Swagger UI) or the httpOnly cookie (web app)."""
    token = credentials.credentials if credentials else request.cookies.get(settings.cookie_name)
    user_id = decode_access_token(token, settings) if token else None
    user = db.get(User, user_id) if user_id is not None else None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
