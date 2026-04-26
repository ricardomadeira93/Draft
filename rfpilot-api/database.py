"""
database.py — Lazy Pinecone client initialization.

Previously, the Pinecone connection was made at module import time,
which caused the server to hang if the network was slow or the API key
wasn't loaded yet. Now the client is built on first access.
"""

import os
from pinecone import Pinecone, ServerlessSpec
from config import PINECONE_API_KEY

INDEX_NAME = "draft-kb"

_pc = None
_index = None


def _get_client() -> Pinecone:
    global _pc
    if _pc is None:
        _pc = Pinecone(api_key=PINECONE_API_KEY)
    return _pc


def get_index():
    """Return the Pinecone index handle, creating it if it doesn't exist."""
    global _index
    if _index is None:
        pc = _get_client()
        if INDEX_NAME not in pc.list_indexes().names():
            print(f"Creating Pinecone index: {INDEX_NAME}...")
            # If using Groq (Pinecone embeddings), we need 1024 dims. Else 768 for Nomic.
            dim = 1024 if os.getenv("GROQ_API_KEY") else 768
            pc.create_index(
                name=INDEX_NAME,
                dimension=dim,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
        _index = pc.Index(INDEX_NAME)
        print(f"Connected to Pinecone index: {INDEX_NAME}")
    return _index


# Thin shim so existing code that does `from database import index` still works.
# The actual network call is deferred to first use.
class _LazyIndex:
    """Proxy that forwards all attribute access to the real Pinecone index."""
    def __getattr__(self, name):
        return getattr(get_index(), name)


index = _LazyIndex()
