import os
from fastapi import HTTPException, Header

DEFAULT_ORG_ID = os.getenv("DRAFT_DEFAULT_ORG_ID", "default-workspace")


def get_current_org(
    draft_api_key: str = Header(None, alias="Draft-API-Key"),
) -> dict:
    """
    Resolves the caller's workspace.
    Accepts either:
    1. Draft-API-Key for programmatic / MCP access
    2. No credentials, which maps to the default shared workspace
    """

    if draft_api_key:
        from api_keys import verify_api_key
        result = verify_api_key(draft_api_key)
        if not result:
            raise HTTPException(status_code=401, detail="Invalid or revoked API key.")
        return {"user_id": "api_key", "org_id": result["org_id"]}

    # Authorization headers are ignored for browser traffic now that the app
    # uses a single shared workspace by default.
    return {"user_id": "anonymous", "org_id": DEFAULT_ORG_ID}
