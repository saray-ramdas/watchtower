from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    is_super_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class SetupStatusResponse(BaseModel):
    needs_setup: bool


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=2000)


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    owner_id: int
    is_paused: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectUpdate(BaseModel):
    is_paused: Optional[bool] = None
    owner_id: Optional[int] = None


class ProviderKeyUpdate(BaseModel):
    key: str = Field(min_length=1, max_length=512)


class MaskRequest(BaseModel):
    text: str = Field(min_length=1, max_length=8000)
    endpoint_id: Optional[int] = None


class Detection(BaseModel):
    type: str
    value: str
    token: str
    start: int
    end: int


class BlockedReason(BaseModel):
    reason: str
    message: str
    restricted_response: str


class MaskResponse(BaseModel):
    masked: str
    token_map: dict
    detections: list[Detection]
    blocked: Optional[BlockedReason] = None


class ProjectStatsResponse(BaseModel):
    total_requests: int
    total_blocked: int
    total_entities_masked: int
    total_tokens: int


class ProxyEventResponse(BaseModel):
    id: int
    project_id: int
    endpoint_id: Optional[int] = None
    endpoint_name: Optional[str] = None
    perimeter_id: Optional[str] = None
    event_type: str
    status_code: Optional[int] = None
    blocked: bool
    upstream_provider: Optional[str] = None
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    entities_masked: int
    prompt_preview: Optional[str] = None
    block_reason: Optional[str] = None
    block_message: Optional[str] = None
    raw_input: Optional[str] = None
    masked_input: Optional[str] = None
    raw_output: Optional[str] = None
    final_output: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EventFinalizeRequest(BaseModel):
    final_output: str = Field(min_length=0, max_length=20000)


class EndpointCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    perimeter_id: str = Field(min_length=1, max_length=120)
    config: dict = Field(default_factory=dict)


class EndpointResponse(BaseModel):
    id: int
    project_id: int
    name: str
    perimeter_id: str
    config: dict
    is_paused: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class EndpointUpdate(BaseModel):
    is_paused: Optional[bool] = None
