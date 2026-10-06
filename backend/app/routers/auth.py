from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.config import Settings
from app.deps import AppSettings, CurrentUser, DbSession
from app.models import User
from app.schemas import LoginRequest, TokenResponse, UserCreate, UserOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _issue_token(user: User, response: Response, settings: Settings) -> TokenResponse:
    token = create_access_token(user.id, settings)
    # httpOnly: JavaScript can't read the token, which limits the damage of an XSS bug.
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        max_age=settings.jwt_expire_minutes * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, response: Response, db: DbSession, settings: AppSettings):
    email = payload.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")

    user = User(
        email=email,
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    return _issue_token(user, response, settings)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, db: DbSession, settings: AppSettings):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not verify_password(payload.password, user.hashed_password if user else None):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    return _issue_token(user, response, settings)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response, settings: AppSettings) -> None:
    response.delete_cookie(settings.cookie_name)


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user
