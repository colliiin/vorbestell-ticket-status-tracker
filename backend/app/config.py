from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://preorder:change-me@localhost:5432/preorder"
    session_secret: str = "dev-change-me-dev-change-me-dev-change-me"
    session_max_age: int = 60 * 60 * 8
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    allowed_origins: str = "http://localhost,http://127.0.0.1"
    domain: str = "localhost"
    csrf_cookie_name: str = "staff_csrf"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("session_secret")
    @classmethod
    def production_secret_must_be_strong(cls, value: str, info):
        app_env = info.data.get("app_env", "development")
        if app_env == "production" and (len(value) < 32 or value.startswith("dev-")):
            raise ValueError("SESSION_SECRET must be a strong non-default value in production")
        return value

    @field_validator("cookie_secure")
    @classmethod
    def production_cookie_secure(cls, value: bool, info):
        if info.data.get("app_env") == "production" and not value:
            raise ValueError("COOKIE_SECURE must be true in production")
        return value

    @field_validator("database_url")
    @classmethod
    def production_database_password(cls, value: str, info):
        if info.data.get("app_env") == "production" and "change-me" in value:
            raise ValueError("DATABASE_URL must not use the default password in production")
        return value

    @field_validator("allowed_origins")
    @classmethod
    def production_origins(cls, value: str, info):
        if info.data.get("app_env") == "production" and (not value or "localhost" in value or "*" in value):
            raise ValueError("ALLOWED_ORIGINS must be explicit production origins")
        return value

    @field_validator("domain")
    @classmethod
    def production_domain(cls, value: str, info):
        if info.data.get("app_env") == "production" and value == "localhost":
            raise ValueError("DOMAIN must be a real domain in production")
        return value

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()