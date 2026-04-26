import os
import jwt
from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

security = HTTPBearer(auto_error=False)


def get_current_org(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_org_id: str = Header(None, alias="X-Org-Id"),
    draft_api_key: str = Header(None, alias="Draft-API-Key"),
) -> dict:
    """
    Resolves the caller's identity. Accepts two methods:
    1. Clerk JWT in Authorization header (standard browser flow)
    2. Draft-API-Key header (for programmatic / MCP access)
    """

    # ── Method 1: Draft API Key ───────────────────────────────────────────────
    if draft_api_key:
        from api_keys import verify_api_key
        result = verify_api_key(draft_api_key)
        if not result:
            raise HTTPException(status_code=401, detail="Invalid or revoked API key.")
        return {"user_id": "api_key", "org_id": result["org_id"]}

    # ── Method 2: Clerk JWT ───────────────────────────────────────────────────
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authentication credentials.")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, options={"verify_signature": False})

        user_id = payload.get("sub")
        org_id = payload.get("org_id") or x_org_id

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing subject (user_id)")

        if not org_id:
            raise HTTPException(
                status_code=403,
                detail="You must select an active organization in Clerk to use this API."
            )

        return {"user_id": user_id, "org_id": org_id}

    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception as e:
        print(f"JWT Verification Error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid authentication token: {str(e)}")
