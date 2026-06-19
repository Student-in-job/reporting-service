from uuid import UUID

from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserBrief"


class UserBrief(BaseModel):
    id: UUID
    username: str
    role: str

    model_config = {"from_attributes": True}
