"""
KAVACH Configuration Management.

Centralized, typed configuration loaded from environment variables / .env file.
Uses Pydantic BaseSettings for validation and type coercion.
Fails fast on startup if critical configuration is missing.
"""

from __future__ import annotations

import os
import platform
from enum import Enum
from pathlib import Path
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class LogLevel(str, Enum):
    """Supported log levels."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class QueueType(str, Enum):
    """Supported message queue backends."""
    MEMORY = "memory"
    REDIS = "redis"


class AIProvider(str, Enum):
    """Supported AI/LLM providers."""
    GEMINI = "gemini"
    OPENAI = "openai"
    OLLAMA = "ollama"


# ---------------------------------------------------------------------------
# Resolve project root (backend/)
# ---------------------------------------------------------------------------
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_PROJECT_ROOT = _BACKEND_DIR


class DatabaseSettings(BaseSettings):
    """Database configuration."""
    model_config = SettingsConfigDict(env_prefix="DB_", env_file=".env", extra="ignore")

    url: str = Field(
        default=f"sqlite+aiosqlite:///{_PROJECT_ROOT / 'kavach.db'}",
        description="Async database URL (SQLite default)",
    )
    echo: bool = Field(default=False, description="Echo SQL statements")
    pool_size: int = Field(default=5, description="Connection pool size")


class RedisSettings(BaseSettings):
    """Redis configuration (used when QUEUE_TYPE=redis)."""
    model_config = SettingsConfigDict(env_prefix="REDIS_", env_file=".env", extra="ignore")

    url: str = Field(default="redis://localhost:6379/0", description="Redis connection URL")
    max_connections: int = Field(default=20, description="Max Redis connections")


class AISettings(BaseSettings):
    """AI / LLM provider configuration."""
    model_config = SettingsConfigDict(env_prefix="AI_", env_file=".env", extra="ignore")

    provider: AIProvider = Field(default=AIProvider.GEMINI, description="Default AI provider")
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY", description="Google Gemini API key")
    gemini_model: str = Field(default="gemini-2.0-flash", description="Gemini model name")
    gemini_rpm: int = Field(default=5, description="Gemini requests per minute limit")
    gemini_tpm: int = Field(default=250_000, description="Gemini tokens per minute limit")
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY", description="OpenAI API key")
    openai_model: str = Field(default="gpt-4o-mini", description="OpenAI model name")
    ollama_url: str = Field(default="http://localhost:11434", alias="OLLAMA_URL", description="Ollama URL")
    ollama_model: str = Field(default="llama3", description="Ollama model name")
    temperature: float = Field(default=0.3, description="LLM temperature")
    max_tokens: int = Field(default=4096, description="Max response tokens")


class ThreatIntelSettings(BaseSettings):
    """Threat intelligence API configuration."""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    virustotal_api_key: str = Field(default="", alias="VIRUSTOTAL_API_KEY")
    abuseipdb_api_key: str = Field(default="", alias="ABUSEIPDB_API_KEY")
    otx_api_key: str = Field(default="", alias="OTX_API_KEY")
    geoip_db_path: str = Field(default="", alias="GEOIP_DB_PATH")
    ti_cache_ttl: int = Field(default=3600, description="Threat intel cache TTL in seconds")


class SecuritySettings(BaseSettings):
    """Security and authentication configuration."""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    secret_key: str = Field(default="CHANGE-ME-IN-PRODUCTION-USE-LONG-RANDOM-STRING", alias="SECRET_KEY")
    jwt_secret: str = Field(default="CHANGE-ME-JWT-SECRET-KEY-256-BIT", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", description="JWT signing algorithm")
    jwt_expiry_minutes: int = Field(default=480, description="JWT token expiry in minutes")
    bcrypt_rounds: int = Field(default=12, description="Bcrypt hashing rounds")


class CollectorSettings(BaseSettings):
    """Collector configuration."""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    simulation_mode: bool = Field(
        default=not platform.system().lower().startswith("win"),
        alias="SIMULATION_MODE",
        description="Enable simulation mode on non-Windows platforms",
    )
    enabled: bool = Field(default=True, alias="COLLECTORS_ENABLED", description="Start telemetry collectors with the API")
    collection_interval: int = Field(default=30, description="Collection interval in seconds")
    fim_directories: str = Field(
        default="",
        alias="FIM_DIRECTORY",
        description="Comma-separated directories to monitor for file integrity",
    )
    canary_directory: str = Field(default="", alias="CANARY_DIRECTORY")
    quarantine_directory: str = Field(default="", alias="QUARANTINE_DIRECTORY")

    @field_validator("fim_directories", mode="before")
    @classmethod
    def _parse_fim_dirs(cls, v: str) -> str:  # noqa: N805
        return v or ""

    @property
    def fim_directory_list(self) -> list[str]:
        """Return FIM directories as a list."""
        if not self.fim_directories:
            return []
        return [d.strip() for d in self.fim_directories.split(",") if d.strip()]


class NotificationSettings(BaseSettings):
    """Notification / email configuration."""
    model_config = SettingsConfigDict(env_prefix="SMTP_", env_file=".env", extra="ignore")

    server: str = Field(default="", description="SMTP server")
    port: int = Field(default=587, description="SMTP port")
    username: str = Field(default="", description="SMTP username")
    password: str = Field(default="", description="SMTP password")
    use_tls: bool = Field(default=True, description="Use TLS")
    soc_email: str = Field(default="", alias="SOC_EMAIL")
    soc_phone: str = Field(default="", alias="SOC_PHONE")


class PathSettings(BaseSettings):
    """File system path configuration."""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    base_dir: Path = Field(default=_PROJECT_ROOT)
    log_dir: Path = Field(default=_PROJECT_ROOT / "logs")
    json_log_dir: Path = Field(default=_PROJECT_ROOT / "logs" / "json_logs")
    processed_log_dir: Path = Field(default=_PROJECT_ROOT / "logs" / "processed_logs")
    archive_dir: Path = Field(default=_PROJECT_ROOT / "logs" / "archive")
    quarantine_dir: Path = Field(default=_PROJECT_ROOT / "quarantine")
    rollback_dir: Path = Field(default=_PROJECT_ROOT / "rollback")
    rule_path: Path = Field(default=_PROJECT_ROOT / "rules" / "definitions", alias="RULE_PATH")
    mitre_db: Path = Field(default=_PROJECT_ROOT / "mitre" / "enterprise-attack.json", alias="MITRE_DB")
    model_path: Path = Field(default=_PROJECT_ROOT / "ml" / "models", alias="MODEL_PATH")
    reports_dir: Path = Field(default=_PROJECT_ROOT / "reports")

    # Log subdirectories
    @property
    def log_subdirs(self) -> dict[str, Path]:
        """Return all log subdirectory paths."""
        base = self.json_log_dir
        return {
            "raw": base / "raw",
            "processed": base / "processed",
            "detections": base / "detections",
            "alerts": base / "alerts",
            "mitre": base / "mitre",
            "dns": base / "dns",
            "network": base / "network",
            "sysmon": base / "sysmon",
            "eventlog": base / "eventlog",
            "fim": base / "fim",
            "process": base / "process",
            "powershell": base / "powershell",
            "defender": base / "defender",
            "usb": base / "usb",
        }

    def ensure_directories(self) -> None:
        """Create all required directories if they don't exist."""
        dirs_to_create = [
            self.log_dir,
            self.json_log_dir,
            self.processed_log_dir,
            self.archive_dir,
            self.quarantine_dir,
            self.rollback_dir,
            self.rule_path,
            self.model_path,
            self.reports_dir,
        ]
        for subdir in self.log_subdirs.values():
            dirs_to_create.append(subdir)

        for d in dirs_to_create:
            d.mkdir(parents=True, exist_ok=True)


class APISettings(BaseSettings):
    """API server configuration."""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    host: str = Field(default="0.0.0.0", alias="API_HOST")
    port: int = Field(default=8000, alias="API_PORT")
    base_url: str = Field(default="http://localhost:8000", alias="API_BASE_URL")
    workers: int = Field(default=1, description="Uvicorn workers")
    cors_origins: str = Field(default="*", description="Comma-separated CORS origins")
    rate_limit_per_minute: int = Field(default=60, description="API rate limit per minute")
    api_version: str = Field(default="v1", description="API version prefix")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


# ---------------------------------------------------------------------------
# Master configuration singleton
# ---------------------------------------------------------------------------

class KavachSettings(BaseSettings):
    """
    Master KAVACH configuration.

    Aggregates all sub-configurations into a single settings object.
    """
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Application metadata
    app_name: str = "KAVACH"
    app_version: str = "1.0.0"
    environment: str = Field(default="development", description="development | staging | production")
    log_level: LogLevel = Field(default=LogLevel.INFO, alias="LOG_LEVEL")
    queue_type: QueueType = Field(default=QueueType.MEMORY, alias="QUEUE_TYPE")

    # Sub-configurations
    db: DatabaseSettings = Field(default_factory=DatabaseSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    ai: AISettings = Field(default_factory=AISettings)
    threat_intel: ThreatIntelSettings = Field(default_factory=ThreatIntelSettings)
    security: SecuritySettings = Field(default_factory=SecuritySettings)
    collector: CollectorSettings = Field(default_factory=CollectorSettings)
    notification: NotificationSettings = Field(default_factory=NotificationSettings)
    paths: PathSettings = Field(default_factory=PathSettings)
    api: APISettings = Field(default_factory=APISettings)

    @property
    def api_base_url(self) -> str:
        """Return base URL for API/web application."""
        return self.api.base_url


# Module-level singleton — import this everywhere
_settings: Optional[KavachSettings] = None


def get_settings() -> KavachSettings:
    """Return the global settings singleton, creating it on first access."""
    global _settings
    if _settings is None:
        _settings = KavachSettings()
        _settings.paths.ensure_directories()
    return _settings


def reload_settings() -> KavachSettings:
    """Force-reload settings (useful for testing)."""
    global _settings
    _settings = None
    return get_settings()
