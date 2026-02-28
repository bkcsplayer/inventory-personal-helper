from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Nexus EAM"
    DATABASE_URL: str = "postgresql+asyncpg://nexus:password@localhost:5432/nexus_eam"
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    CORS_ORIGINS: str = "http://localhost:5173"
    DEFAULT_LANGUAGE: str = "zh"
    TIMEZONE: str = "America/Denver"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
