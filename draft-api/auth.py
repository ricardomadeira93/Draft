import os
import jwt
from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_current_org(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_org_id: str = Header(None, alias="X-Org-Id")
) -> dict:
    """
    Extracts the user_id and org_id. Falls back to X-Org-Id header if JWT is missing it.
    """
    token = credentials.credentials
    try:
        # Decode without verification for the prototype.
        # In production: jwt.decode(token, key=jwks_key, algorithms=["RS256"], audience="...")
        payload = jwt.decode(token, options={"verify_signature": False})
        
        user_id = payload.get("sub")
        
        # In newer Clerk versions, org_id might require a custom JWT template.
        # As a fallback for this prototype, we accept it via a custom header.
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
