"""
tracker.py — SQLite-backed file tracker for the Knowledge Base.

Pinecone stores vectors but doesn't expose a simple "list files" API.
We use a local SQLite DB to keep a manifest of uploaded documents,
including the filename and chunk count so we can display it in the UI.
"""

import sqlite3
from pathlib import Path

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
