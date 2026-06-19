from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.core.security import verify_password, create_access_token
from app.config import settings
from app.schemas.auth import LoginRequest, TokenResponse, UserBrief
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == body.username, User.is_active.is_(True)))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        expires_in=settings.jwt_expire_hours * 3600,
        user=UserBrief.model_validate(user),
    )


@router.get("/me", response_model=UserBrief)
async def me(user: User = Depends(get_current_user)):
    return UserBrief.model_validate(user)
