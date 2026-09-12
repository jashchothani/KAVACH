"""
KAVACH Configuration Management.

Centralized Pydantic Settings for KAVACH backend.
Loads from environment variables and .env file.
"""

from __future__ import annotations

import os
import platform
from enum import Enum
from pathlib import Path
from typing import Optional, Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class AIProviderType(str, Enum):
    NVIDIA_NIM = "nvidia_nim"
    LOCAL_FALLBACK = "local_fallback"
    GEMINI = "gemini"


# Base directory resolution
# backend/app/core/config.py -> backend/app/core -> backend/app -> backend -> KAVACH root
_CORE_DIR = Path(__file__).resolve().parent
_APP_DIR = _CORE_DIR.parent
_BACKEND_DIR = _APP_DIR.parent
_ROOT_DIR = _BACKEND_DIR.parent


class PathSettings(BaseSettings):
    """File and directory paths."""
    root_dir: Path = _ROOT_DIR
    backend_dir: Path = _BACKEND_DIR
    data_dir: Path = _ROOT_DIR / "data"
    db_dir: Path = _ROOT_DIR / "data" / "database"
    log_dir: Path = _ROOT_DIR / "data" / "logs"
    model_dir: Path = _ROOT_DIR / "data" / "models"
    export_dir: Path = _ROOT_DIR / "data" / "exports"
    demo_dir: Path = _ROOT_DIR / "data" / "demo"

    def ensure_directories(self) -> None:
        """Create essential data directories if not present."""
        for d in [self.data_dir, self.db_dir, self.log_dir, self.model_dir, self.export_dir, self.demo_dir]:
            d.mkdir(parents=True, exist_ok=True)


class DatabaseSettings(BaseSettings):
    """Database configuration (SQLite default, PostgreSQL production-capable)."""
    model_config = SettingsConfigDict(env_prefix="DB_", env_file=".env", extra="ignore")

    url: str = Field(
        default=f"sqlite+aiosqlite:///{_ROOT_DIR / 'data' / 'database' / 'kavach.db'}",
        description="Async SQLAlchemy database connection string",
    )
    echo: bool = Field(default=False, description="Echo SQL statements to stdout")
    pool_size: int = Field(default=5, description="Connection pool size")


class MLSettings(BaseSettings):
    """Machine Learning & Isolation Forest Settings."""
    model_config = SettingsConfigDict(env_prefix="ML_", env_file=".env", extra="ignore")

    enabled: bool = Field(default=True, description="Enable ML anomaly detector")
    contamination: float = Field(default=0.05, description="Expected proportion of anomalies (5%)")
    min_train_samples: int = Field(default=50, description="Minimum clean events needed to train model")
    model_path: str = Field(
        default=str(_ROOT_DIR / "data" / "models" / "isolation_forest.joblib"),
        description="Path to serialized scikit-learn model",
    )
    meta_path: str = Field(
        default=str(_ROOT_DIR / "data" / "models" / "model_meta.json"),
        description="Path to model version metadata",
    )
    auto_retrain: bool = Field(default=True, description="Enable adaptive background retraining")


class NvidiaNimSettings(BaseSettings):
    """NVIDIA NIM LLM configuration for Raksha AI."""
    model_config = SettingsConfigDict(env_prefix="NVIDIA_NIM_", env_file=".env", extra="ignore")

    api_key: str = Field(default="", description="NVIDIA NIM API key")
    base_url: str = Field(
        default="https://integrate.api.nvidia.com/v1",
        description="NVIDIA NIM endpoint base URL",
    )
    model: str = Field(
        default="meta/llama-3.1-70b-instruct",
        description="NVIDIA NIM model identifier",
    )
    timeout: float = Field(default=30.0, description="API request timeout in seconds")
    max_tokens: int = Field(default=1024, description="Max response tokens")
    temperature: float = Field(default=0.2, description="Sampling temperature for deterministic security guidance")


class CollectorSettings(BaseSettings):
    """Telemetry collector configurations."""
    model_config = SettingsConfigDict(env_prefix="COLLECTOR_", env_file=".env", extra="ignore")

    enabled: bool = Field(default=True, description="Enable telemetry collectors")
    simulation_mode: bool = Field(
        default=platform.system() != "Windows",
        description="Run safe simulated data if non-Windows OS",
    )
    poll_interval: float = Field(default=5.0, description="Default collector polling interval in seconds")
    batch_size: int = Field(default=100, description="Collector event batch size")


class Settings(BaseSettings):
    """Master Application Settings for KAVACH."""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Application identity
    app_name: str = "KAVACH"
    app_version: str = "1.0.0"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Server binding
    backend_host: str = Field(default="127.0.0.1", alias="KAVACH_BACKEND_HOST")
    backend_port: int = Field(default=8000, alias="KAVACH_BACKEND_PORT")
    frontend_host: str = Field(default="127.0.0.1", alias="KAVACH_FRONTEND_HOST")
    frontend_port: int = Field(default=5173, alias="KAVACH_FRONTEND_PORT")

    # Security & Auth
    jwt_secret: str = Field(
        default="kavach-sec-key-production-change-in-env-94812398471294871298471",
        alias="JWT_SECRET",
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    cors_origins: list[str] | str = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "chrome-extension://*",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            if not v.startswith("["):
                return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Logging
    log_level: LogLevel = LogLevel.INFO

    # Sub-settings
    paths: PathSettings = Field(default_factory=PathSettings)
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    ml: MLSettings = Field(default_factory=MLSettings)
    nim: NvidiaNimSettings = Field(default_factory=NvidiaNimSettings)
    collector: CollectorSettings = Field(default_factory=CollectorSettings)


_settings: Settings | None = None


def get_settings() -> Settings:
    """Singleton getter for application settings."""
    global _settings
    if _settings is None:
        _settings = Settings()
        _settings.paths.ensure_directories()
    return _settings
