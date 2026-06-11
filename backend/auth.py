import os
import time
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwk, jwt
from jose.utils import base64url_decode
from sqlalchemy.orm import Session

from database import get_db
from models import User

SECRET_KEY = "watchtower-dev-secret-change-me-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
CLERK_ISSUER = os.getenv("CLERK_ISSUER", "").strip().rstrip("/")
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "").strip()
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "").strip()
CLERK_ALLOWED_EMAIL_DOMAINS = [
    d.strip().lower()
    for d in os.getenv("CLERK_ALLOWED_EMAIL_DOMAINS", "").split(",")
    if d.strip()
]
_CLERK_JWKS_CACHE: dict = {"fetched_at": 0, "keys": []}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)


def _truncate(password: str) -> bytes:
    # bcrypt operates on at most 72 bytes
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_truncate(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_truncate(plain), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _clerk_jwks_url() -> str:
    if CLERK_JWKS_URL:
        return CLERK_JWKS_URL
    if CLERK_ISSUER:
        return f"{CLERK_ISSUER}/.well-known/jwks.json"
    return ""


def _get_clerk_jwks() -> list[dict]:
    now = time.time()
    if _CLERK_JWKS_CACHE["keys"] and now - _CLERK_JWKS_CACHE["fetched_at"] < 3600:
        return _CLERK_JWKS_CACHE["keys"]

    url = _clerk_jwks_url()
    if not url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Clerk is not configured on the backend.",
        )

    try:
        response = httpx.get(url, timeout=5.0)
        response.raise_for_status()
        keys = response.json().get("keys", [])
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not fetch Clerk public keys: {exc}",
        )

    _CLERK_JWKS_CACHE.update({"fetched_at": now, "keys": keys})
    return keys


def verify_clerk_session_token(token: str) -> dict:
    try:
        header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Clerk token.")

    kid = header.get("kid")
    key_data = next((key for key in _get_clerk_jwks() if key.get("kid") == kid), None)
    if not key_data:
        _CLERK_JWKS_CACHE.update({"fetched_at": 0, "keys": []})
        key_data = next((key for key in _get_clerk_jwks() if key.get("kid") == kid), None)
    if not key_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown Clerk signing key.")

    try:
        public_key = jwk.construct(key_data)
        message, encoded_sig = token.rsplit(".", 1)
        decoded_sig = base64url_decode(encoded_sig.encode("utf-8"))
        if not public_key.verify(message.encode("utf-8"), decoded_sig):
            raise JWTError("Invalid signature")

        claims = jwt.get_unverified_claims(token)
        if claims.get("exp") and int(claims["exp"]) < int(time.time()):
            raise JWTError("Token expired")
        if CLERK_ISSUER and claims.get("iss") != CLERK_ISSUER:
            raise JWTError(f"Invalid issuer. Token issuer is {claims.get('iss')!r}.")
        return claims
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not verify Clerk token: {exc}",
        )


async def get_clerk_user_email(clerk_user_id: str, claims: dict) -> Optional[str]:
    email = claims.get("email") or claims.get("email_address")
    if isinstance(email, str) and email:
        return email.lower()

    if not CLERK_SECRET_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"https://api.clerk.com/v1/users/{clerk_user_id}",
                headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
            )
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not fetch Clerk user profile: {exc}",
        )

    primary_id = data.get("primary_email_address_id")
    emails = data.get("email_addresses") or []
    primary = next((e for e in emails if e.get("id") == primary_id), None) or (emails[0] if emails else None)
    address = primary.get("email_address") if primary else None
    return address.lower() if isinstance(address, str) and address else None


def email_domain_allowed(email: str) -> bool:
    if not CLERK_ALLOWED_EMAIL_DOMAINS:
        return True
    domain = email.rsplit("@", 1)[-1].lower()
    return domain in CLERK_ALLOWED_EMAIL_DOMAINS


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise credentials_exception
    return user
