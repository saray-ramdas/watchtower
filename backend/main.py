import secrets
from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

import models
from auth import create_access_token, get_current_user, hash_password, verify_password
from database import Base, engine, get_db
from schemas import (
    EndpointCreate,
    EndpointResponse,
    EndpointUpdate,
    LoginRequest,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    ProviderKeyUpdate,
    SetupStatusResponse,
    SignupRequest,
    TokenResponse,
    UserResponse,
)

Base.metadata.create_all(bind=engine)

# Idempotent column additions for tables already created in earlier sessions.
with engine.begin() as _conn:
    _conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_paused BOOLEAN NOT NULL DEFAULT FALSE"))
    _conn.execute(text("ALTER TABLE endpoints ADD COLUMN IF NOT EXISTS is_paused BOOLEAN NOT NULL DEFAULT FALSE"))

app = FastAPI(title="Bilvantis WatchTower API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Bilvantis WatchTower API"}


@app.get("/api/setup/status", response_model=SetupStatusResponse)
def setup_status(db: Session = Depends(get_db)):
    has_users = db.query(models.User).first() is not None
    return SetupStatusResponse(needs_setup=not has_users)


@app.post("/api/auth/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    has_users = db.query(models.User).first() is not None
    if has_users:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin already exists. Signup is disabled.",
        )

    user = models.User(
        email=payload.email.lower(),
        name=payload.name.strip(),
        hashed_password=hash_password(payload.password),
        is_super_admin=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.email)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(subject=user.email)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@app.get("/api/auth/me", response_model=UserResponse)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.get("/api/users", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.User).order_by(models.User.created_at.asc()).all()


@app.get("/api/projects", response_model=list[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Project)
        .order_by(models.Project.created_at.desc())
        .all()
    )


@app.post("/api/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = models.Project(
        name=payload.name.strip(),
        description=(payload.description or "").strip() or None,
        owner_id=current_user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@app.delete("/api/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    db.delete(project)
    db.commit()
    return None


@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@app.patch("/api/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if payload.is_paused is not None:
        project.is_paused = payload.is_paused
    if payload.owner_id is not None:
        new_owner = db.query(models.User).filter(models.User.id == payload.owner_id).first()
        if not new_owner:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner user not found")
        project.owner_id = payload.owner_id
    db.commit()
    db.refresh(project)
    return project


@app.patch(
    "/api/projects/{project_id}/endpoints/{endpoint_id}",
    response_model=EndpointResponse,
)
def update_endpoint(
    project_id: int,
    endpoint_id: int,
    payload: EndpointUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    endpoint = (
        db.query(models.Endpoint)
        .filter(models.Endpoint.id == endpoint_id, models.Endpoint.project_id == project_id)
        .first()
    )
    if not endpoint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endpoint not found")
    if payload.is_paused is not None:
        endpoint.is_paused = payload.is_paused
    db.commit()
    db.refresh(endpoint)
    return endpoint


@app.put(
    "/api/projects/{project_id}/endpoints/{endpoint_id}/providers/{provider_id}",
    response_model=EndpointResponse,
)
def update_provider_key(
    project_id: int,
    endpoint_id: int,
    provider_id: str,
    payload: ProviderKeyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    endpoint = (
        db.query(models.Endpoint)
        .filter(models.Endpoint.id == endpoint_id, models.Endpoint.project_id == project_id)
        .first()
    )
    if not endpoint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endpoint not found")

    config = dict(endpoint.config or {})
    providers = list(config.get("providers") or [])
    found = False
    for i, p in enumerate(providers):
        if p.get("provider") == provider_id:
            # Never persist plaintext — store a reference fingerprint instead.
            tail = payload.key.strip()[-4:]
            providers[i] = {
                **p,
                "key": f"••• stored as reference · …{tail}",
                "rotated_at": datetime.utcnow().isoformat() + "Z",
            }
            found = True
            break
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not in endpoint")

    config["providers"] = providers
    endpoint.config = config
    # SQLAlchemy needs an explicit flag for in-place JSON updates
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(endpoint, "config")
    db.commit()
    db.refresh(endpoint)
    return endpoint


@app.get("/api/projects/{project_id}/endpoints", response_model=list[EndpointResponse])
def list_endpoints(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return (
        db.query(models.Endpoint)
        .filter(models.Endpoint.project_id == project_id)
        .order_by(models.Endpoint.created_at.desc())
        .all()
    )


@app.post(
    "/api/projects/{project_id}/endpoints",
    response_model=EndpointResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_endpoint(
    project_id: int,
    payload: EndpointCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    perimeter = payload.perimeter_id.strip()
    config = dict(payload.config or {})
    config["base_url"] = f"https://gateway.watchtower.bilvantis.io/v1/{perimeter}"
    config["api_key"] = f"wt_live_{secrets.token_urlsafe(24).replace('-', '').replace('_', '')[:28]}"

    endpoint = models.Endpoint(
        project_id=project.id,
        name=payload.name.strip(),
        perimeter_id=perimeter,
        config=config,
    )
    db.add(endpoint)
    db.commit()
    db.refresh(endpoint)
    return endpoint
