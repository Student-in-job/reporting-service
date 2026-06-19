from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # Own DB
    database_url: str = "postgresql+asyncpg://report:report@localhost:5432/report_service"

    # JWT
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24

    # Seed admin
    admin_username: str = "admin"
    admin_password: str = "admin"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
