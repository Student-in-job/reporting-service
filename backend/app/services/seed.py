from sqlalchemy import select

from app.database import async_session
from app.models.user import User
from app.core.security import hash_password
from app.config import settings


async def seed_admin():
    async with async_session() as db:
        result = await db.execute(select(User).where(User.username == settings.admin_username))
        admin = result.scalar_one_or_none()
        if admin is None:
            admin = User(
                username=settings.admin_username,
                password_hash=hash_password(settings.admin_password),
                role="admin",
            )
            db.add(admin)
        else:
            admin.password_hash = hash_password(settings.admin_password)
        await db.commit()
