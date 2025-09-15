import os
from pydantic_settings import BaseSettings, SettingsConfigDict

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env"))

class Settings(BaseSettings):
    OPENAI_API_KEY: str
    DATABASE_URL: str

    model_config = SettingsConfigDict(env_file=env_path, env_file_encoding="utf-8")

settings = Settings()
