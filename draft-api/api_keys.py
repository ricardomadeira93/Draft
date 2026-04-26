"""
api_keys.py — API key management for Draft.

Keys are stored as SHA-256 hashes. The plaintext is only returned once at creation.
Keys follow the format: dk_live_{random_32_hex}
"""

import os
import hashlib
import secrets
from datetime import datetime, timezone
from tracker import _get_conn, _PLACEHOLDER


def _hash_key(plaintext: str) -> str:
    return hashlib.sha256(plaintext.encode()).hexdigest()


def generate_api_key(org_id: str, name: str) -> dict:
    """
    Create a new API key for an org.
    Returns the plaintext key (shown once) and the stored record.
    """
    key_id = secrets.token_hex(8)
    plaintext = f"dk_live_{secrets.token_hex(32)}"
    key_hash = _hash_key(plaintext)
    p = _PLACEHOLDER

    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            f"""
            INSERT INTO api_keys (id, org_id, name, key_hash)
            VALUES ({p}, {p}, {p}, {p})
            """,
            (key_id, org_id, name, key_hash)
        )

    return {
        "id": key_id,
        "name": name,
        "key": plaintext,  # plaintext — shown only here, never again
        "created_at": datetime.now(timezone.utc).isoformat()
    }


def list_api_keys(org_id: str) -> list[dict]:
    """List all API keys for an org (masked, no plaintext)."""
    p = _PLACEHOLDER
    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, created_at, last_used_at FROM api_keys WHERE org_id = {p} ORDER BY created_at DESC",
            (org_id,)
        )
        return [dict(r) for r in cur.fetchall()]


def revoke_api_key(org_id: str, key_id: str) -> bool:
    """Delete an API key. Returns True if it existed."""
    p = _PLACEHOLDER
    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            f"DELETE FROM api_keys WHERE id = {p} AND org_id = {p}",
            (key_id, org_id)
        )
        return cur.rowcount > 0


def verify_api_key(plaintext: str) -> dict | None:
    """
    Verify a plaintext API key and return its org_id if valid.
    Also updates last_used_at.
    Returns None if the key is not found.
    """
    key_hash = _hash_key(plaintext)
    p = _PLACEHOLDER

    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, org_id FROM api_keys WHERE key_hash = {p}",
            (key_hash,)
        )
        row = cur.fetchone()
        if not row:
            return None

        # Update last_used_at
        now = datetime.now(timezone.utc).isoformat()
        cur.execute(
            f"UPDATE api_keys SET last_used_at = {p} WHERE id = {p}",
            (now, row["id"])
        )

    return {"org_id": row["org_id"]}
