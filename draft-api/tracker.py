"""
tracker.py — SQLite-backed file tracker for the Knowledge Base.

Pinecone stores vectors but doesn't expose a simple "list files" API.
We use a local SQLite DB to keep a manifest of uploaded documents,
including the filename and chunk count so we can display it in the UI.
"""

import sqlite3
import json
from pathlib import Path
from datetime import datetime, timezone

DB_PATH = Path(__file__).parent / "kb_tracker.db"


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create the uploads table if it doesn't exist. Called at app startup."""
    with _get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS uploads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL UNIQUE,
                chunk_count INTEGER NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS share_sessions (
                id TEXT PRIMARY KEY,
                token TEXT UNIQUE NOT NULL,
                answers JSON NOT NULL,
                status TEXT DEFAULT 'pending',
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()


def record_upload(filename: str, chunk_count: int) -> None:
    """Insert or replace a file record after a successful upload."""
    with _get_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO uploads (filename, chunk_count) VALUES (?, ?)",
            (filename, chunk_count),
        )
        conn.commit()


def list_uploads() -> list[dict]:
    """Return all tracked uploads ordered by most recent."""
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT filename, chunk_count, uploaded_at FROM uploads ORDER BY uploaded_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]


def delete_upload(filename: str) -> bool:
    """
    Remove a file from the tracker manifest.
    Returns True if a row was deleted, False if the filename wasn't found.
    """
    with _get_conn() as conn:
        cursor = conn.execute(
            "DELETE FROM uploads WHERE filename = ?", (filename,)
        )
        conn.commit()
    return cursor.rowcount > 0

# ─── Share Sessions ───────────────────────────────────────────────────────────

def create_share_session(session_id: str, token: str, answers: list, expires_at: datetime) -> None:
    """Insert a new share session into the database."""
    with _get_conn() as conn:
        conn.execute(
            """
            INSERT INTO share_sessions (id, token, answers, expires_at)
            VALUES (?, ?, ?, ?)
            """,
            (session_id, token, json.dumps(answers), expires_at.isoformat())
        )
        conn.commit()

def get_share_session(token: str) -> dict | None:
    """Retrieve a share session by token. Returns None if not found or expired."""
    with _get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM share_sessions WHERE token = ?", (token,)
        ).fetchone()
        
    if not row:
        return None
        
    session = dict(row)
    
    # Check expiry
    if session['expires_at']:
        try:
            expires_at = datetime.fromisoformat(session['expires_at'])
            # Compare with aware UTC now if the stored format is aware, else naive
            now = datetime.now(timezone.utc) if expires_at.tzinfo else datetime.now()
            if now > expires_at:
                return None
        except ValueError:
            pass # Invalid timestamp format, let it slide or handle error

    # Parse JSON
    if isinstance(session.get('answers'), str):
        session['answers'] = json.loads(session['answers'])
        
    return session

def update_share_answer(token: str, answer_idx: int, status: str, comment: str) -> bool:
    """Update a specific answer's review status within a share session."""
    session = get_share_session(token)
    if not session:
        return False
        
    answers = session['answers']
    if answer_idx < 0 or answer_idx >= len(answers):
        return False
        
    # Update the specific answer object
    if 'review' not in answers[answer_idx]:
        answers[answer_idx]['review'] = {}
        
    answers[answer_idx]['review']['status'] = status
    answers[answer_idx]['review']['comment'] = comment
    
    # Determine overall session status based on answers
    # If any are flagged, it's 'flagged'. If all are approved, it's 'approved'. Else 'pending'.
    all_approved = True
    any_flagged = False
    
    for ans in answers:
        rev_status = ans.get('review', {}).get('status', 'pending')
        if rev_status == 'flagged':
            any_flagged = True
        if rev_status != 'approved':
            all_approved = False
            
    overall_status = 'flagged' if any_flagged else ('approved' if all_approved else 'in-review')

    with _get_conn() as conn:
        cursor = conn.execute(
            "UPDATE share_sessions SET answers = ?, status = ? WHERE token = ?",
            (json.dumps(answers), overall_status, token)
        )
        conn.commit()
        return cursor.rowcount > 0
