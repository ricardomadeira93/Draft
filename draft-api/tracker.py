"""
tracker.py — PostgreSQL-backed tracker for the Knowledge Base and Document History.

Uses Neon (or any PostgreSQL provider) via psycopg2.
Connection string is read from the DATABASE_URL environment variable.

Falls back to a local SQLite file if DATABASE_URL is not set, so local
development works without a Neon account.
"""

import os
import json
import sqlite3
from pathlib import Path
from datetime import datetime, timezone
from contextlib import contextmanager

DATABASE_URL = os.getenv("DATABASE_URL")

# ─── Connection Abstraction ───────────────────────────────────────────────────

if DATABASE_URL:
    import psycopg2
    import psycopg2.extras

    @contextmanager
    def _get_conn():
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    # PostgreSQL SQL dialect
    _PLACEHOLDER = "%s"
    _AUTOINCREMENT = "SERIAL"
    _INSERT_OR_REPLACE_UPLOADS = """
        INSERT INTO uploads (org_id, filename, chunk_count)
        VALUES (%s, %s, %s)
        ON CONFLICT (org_id, filename) DO UPDATE
            SET chunk_count = EXCLUDED.chunk_count,
                uploaded_at = NOW()
    """

else:
    # SQLite fallback for local dev without DATABASE_URL
    _DB_PATH = Path(__file__).parent / "kb_tracker.db"

    @contextmanager
    def _get_conn():
        conn = sqlite3.connect(_DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    _PLACEHOLDER = "?"
    _AUTOINCREMENT = "INTEGER"
    _INSERT_OR_REPLACE_UPLOADS = """
        INSERT OR REPLACE INTO uploads (org_id, filename, chunk_count)
        VALUES (?, ?, ?)
    """


# ─── Schema Init ──────────────────────────────────────────────────────────────

def init_db() -> None:
    """Create all tables if they do not exist. Called at app startup."""
    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS organizations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS memberships (
                user_id TEXT NOT NULL,
                org_id TEXT NOT NULL,
                role TEXT DEFAULT 'member',
                PRIMARY KEY (user_id, org_id)
            )
        """)
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS uploads (
                id {_AUTOINCREMENT} PRIMARY KEY,
                org_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                chunk_count INTEGER NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(org_id, filename)
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS share_sessions (
                id TEXT PRIMARY KEY,
                org_id TEXT NOT NULL,
                token TEXT UNIQUE NOT NULL,
                answers TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS document_history (
                id TEXT PRIMARY KEY,
                org_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                question_count INTEGER NOT NULL,
                answers TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS api_keys (
                id TEXT PRIMARY KEY,
                org_id TEXT NOT NULL,
                name TEXT NOT NULL,
                key_hash TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used_at TIMESTAMP
            )
        """)


# ─── Uploads ─────────────────────────────────────────────────────────────────

def record_upload(org_id: str, filename: str, chunk_count: int) -> None:
    """Insert or replace a file record after a successful upload."""
    with _get_conn() as conn:
        conn.cursor().execute(_INSERT_OR_REPLACE_UPLOADS, (org_id, filename, chunk_count))


def list_uploads(org_id: str) -> list[dict]:
    """Return all tracked uploads ordered by most recent for a specific org."""
    p = _PLACEHOLDER
    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            f"SELECT filename, chunk_count, uploaded_at FROM uploads WHERE org_id = {p} ORDER BY uploaded_at DESC",
            (org_id,)
        )
        return [dict(r) for r in cur.fetchall()]


def delete_upload(org_id: str, filename: str) -> bool:
    """
    Remove a file from the tracker manifest for a specific org.
    Returns True if a row was deleted, False if the filename wasn't found.
    """
    p = _PLACEHOLDER
    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            f"DELETE FROM uploads WHERE org_id = {p} AND filename = {p}", (org_id, filename)
        )
        return cur.rowcount > 0


# ─── Share Sessions ───────────────────────────────────────────────────────────

def create_share_session(session_id: str, org_id: str, token: str, answers: list, expires_at: datetime) -> None:
    """Insert a new share session into the database."""
    p = _PLACEHOLDER
    with _get_conn() as conn:
        conn.cursor().execute(
            f"INSERT INTO share_sessions (id, org_id, token, answers, expires_at) VALUES ({p},{p},{p},{p},{p})",
            (session_id, org_id, token, json.dumps(answers), expires_at.isoformat())
        )


def get_share_session(token: str) -> dict | None:
    """Retrieve a share session by token. Returns None if not found or expired."""
    p = _PLACEHOLDER
    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM share_sessions WHERE token = {p}", (token,))
        row = cur.fetchone()

    if not row:
        return None

    session = dict(row)

    # Check expiry
    if session.get("expires_at"):
        try:
            expires_at = session["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            # Make aware if naive
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > expires_at:
                return None
        except ValueError:
            pass

    # Parse answers JSON if stored as string
    if isinstance(session.get("answers"), str):
        session["answers"] = json.loads(session["answers"])

    return session


def update_share_answer(token: str, answer_idx: int, status: str, comment: str) -> bool:
    """Update a specific answer's review status within a share session."""
    session = get_share_session(token)
    if not session:
        return False

    answers = session["answers"]
    if answer_idx < 0 or answer_idx >= len(answers):
        return False

    if "review" not in answers[answer_idx]:
        answers[answer_idx]["review"] = {}

    answers[answer_idx]["review"]["status"] = status
    answers[answer_idx]["review"]["comment"] = comment

    all_approved = True
    any_flagged = False
    for ans in answers:
        rev_status = ans.get("review", {}).get("status", "pending")
        if rev_status == "flagged":
            any_flagged = True
        if rev_status != "approved":
            all_approved = False

    overall_status = "flagged" if any_flagged else ("approved" if all_approved else "in-review")

    p = _PLACEHOLDER
    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            f"UPDATE share_sessions SET answers = {p}, status = {p} WHERE token = {p}",
            (json.dumps(answers), overall_status, token)
        )
        return cur.rowcount > 0


# ─── Document History ────────────────────────────────────────────────────────

def save_document_history(session_id: str, org_id: str, filename: str, question_count: int, answers: list) -> None:
    """Save a processed document run to history."""
    p = _PLACEHOLDER
    with _get_conn() as conn:
        conn.cursor().execute(
            f"INSERT INTO document_history (id, org_id, filename, question_count, answers) VALUES ({p},{p},{p},{p},{p})",
            (session_id, org_id, filename, question_count, json.dumps(answers))
        )


def list_document_history(org_id: str) -> list[dict]:
    """Retrieve history of processed documents for an organization."""
    p = _PLACEHOLDER
    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, filename, question_count, created_at FROM document_history WHERE org_id = {p} ORDER BY created_at DESC",
            (org_id,)
        )
        return [dict(r) for r in cur.fetchall()]


def get_document_history_answers(org_id: str, session_id: str) -> list | None:
    """Retrieve the full answers JSON for a specific history session."""
    p = _PLACEHOLDER
    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            f"SELECT answers FROM document_history WHERE org_id = {p} AND id = {p}",
            (org_id, session_id)
        )
        row = cur.fetchone()

    if not row:
        return None

    answers = row["answers"]
    return json.loads(answers) if isinstance(answers, str) else answers
