from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_super_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_paused = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="projects")
    endpoints = relationship("Endpoint", back_populates="project", cascade="all, delete-orphan")


class Endpoint(Base):
    __tablename__ = "endpoints"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(120), nullable=False)
    perimeter_id = Column(String(120), nullable=False, index=True)
    config = Column(JSON, nullable=False, default=dict)
    is_paused = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="endpoints")
    secrets = relationship("ProviderSecret", back_populates="endpoint", cascade="all, delete-orphan")


class ProviderSecret(Base):
    """Real upstream provider API keys. Read only at proxy call-time; never returned by the management API."""
    __tablename__ = "provider_secrets"

    id = Column(Integer, primary_key=True, index=True)
    endpoint_id = Column(Integer, ForeignKey("endpoints.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(64), nullable=False)
    api_key = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    endpoint = relationship("Endpoint", back_populates="secrets")


class ProxyEvent(Base):
    """One row per proxy invocation (and per masking call). Powers the dashboard counters AND the audit log."""
    __tablename__ = "proxy_events"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    endpoint_id = Column(Integer, ForeignKey("endpoints.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(16), nullable=False, index=True)   # 'proxy' or 'mask'
    status_code = Column(Integer, nullable=True)
    blocked = Column(Boolean, default=False, nullable=False)
    upstream_provider = Column(String(64), nullable=True)
    prompt_tokens = Column(Integer, default=0, nullable=False)
    completion_tokens = Column(Integer, default=0, nullable=False)
    total_tokens = Column(Integer, default=0, nullable=False)
    entities_masked = Column(Integer, default=0, nullable=False)
    # Audit-trail fields
    prompt_preview = Column(Text, nullable=True)        # legacy: masked for safe, raw for blocked
    block_reason = Column(String(64), nullable=True)    # PROMPT_INJECTION, BULK_EXFILTRATION, etc.
    block_message = Column(Text, nullable=True)         # one-line classifier explanation
    # Full lifecycle (populated as each stage runs)
    raw_input = Column(Text, nullable=True)             # what the user originally typed (PII intact)
    masked_input = Column(Text, nullable=True)          # what was sent to the upstream LLM
    raw_output = Column(Text, nullable=True)            # what the LLM returned (may contain tokens)
    final_output = Column(Text, nullable=True)          # what was shown to the user after re-identification
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
