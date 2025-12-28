from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    groq_api_key: str = ""
    llm_provider: str = "groq"
    llm_model: str = "llama-3.1-8b-instant"
    llm_api_base: str = ""
    llm_api_key: str = ""
    temperature: float = 0.2
    max_tokens: int = 1200


settings = Settings()
