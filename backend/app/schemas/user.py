from enum import Enum
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel


class UserRole(str, Enum):
    ADMIN = "admin"
    VIEWER = "viewer"


class UserCreate(BaseModel):
    username: str
    password: str
    role: UserRole = UserRole.VIEWER


class UserUpdate(BaseModel):
    username: str | None = None
    password: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None


class UserOut(BaseModel):
    id: UUID
    username: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListOut(BaseModel):
    users: list[UserOut]
