import os
import jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_current_org(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Extracts the user_id and org_id from the Clerk JWT.
    Note: For a true production environment, you must verify the JWT signature 
    against Clerk's JWKS endpoint using pyjwt or the Clerk SDK.
    """
    token = credentials.credentials
    try:
        # Decode without verification for the prototype.
        # In production: jwt.decode(token, key=jwks_key, algorithms=["RS256"], audience="...")
        payload = jwt.decode(token, options={"verify_signature": False})
        
        print(f"Decoded JWT Payload: {payload}")
        
        user_id = payload.get("sub")
        org_id = payload.get("org_id")
        
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
