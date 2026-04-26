import os
import io
import csv
import ssl
import certifi

# Bypass macOS Python SSL certificate issues locally
os.environ["SSL_CERT_FILE"] = certifi.where()
ssl._create_default_https_context = ssl._create_unverified_context
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore

from database import index, INDEX_NAME
from llm_router import get_embedding_model
from rag_engine import answer_question_with_sources, _get_retriever, extract_sources
from tracker import init_db, record_upload, list_uploads, delete_upload

app = FastAPI(title="Draft API", description="RAG-powered RFP automation backend")

init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"status": "success", "message": "Draft API is running."}


# ─── Knowledge Base ───────────────────────────────────────────────────────────

@app.post("/upload-kb")
async def upload_knowledge_base(file: UploadFile = File(...)):
    """
    Chunk a document, embed it, and push to Pinecone.
    Injects source filename as vector metadata for targeted deletion.
    """
    content = await file.read()
    text = content.decode("utf-8")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )
    chunks = text_splitter.split_text(text)
    metadatas = [{"source": file.filename} for _ in chunks]

    embeddings = get_embedding_model()
    PineconeVectorStore.from_texts(
        texts=chunks,
        embedding=embeddings,
        index_name=INDEX_NAME,
        metadatas=metadatas,
    )

    record_upload(file.filename, len(chunks))

    return {
        "status": "success",
        "message": f"Successfully indexed '{file.filename}' into {len(chunks)} vectors.",
    }


@app.get("/kb/files")
def get_kb_files():
    """List all documents tracked in the Knowledge Base."""
    return {"files": list_uploads()}


@app.delete("/kb/files/{filename}")
def delete_kb_file(filename: str):
    """Purge a document's vectors from Pinecone and remove it from the tracker."""
    try:
        index.delete(filter={"source": {"$eq": filename}})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pinecone deletion failed: {e}")

    if not delete_upload(filename):
        raise HTTPException(status_code=404, detail=f"'{filename}' not found in tracker.")

    return {"status": "success", "message": f"Deleted '{filename}' from Knowledge Base."}


# ─── RFP Processing ───────────────────────────────────────────────────────────

@app.post("/process-csv")
async def process_csv(file: UploadFile = File(...), language: str = Form("English")):
    """
    Process a CSV with a 'Question' column.
    Returns JSON with answers AND source attribution per row.
    """
    content = await file.read()
    csv_reader = csv.DictReader(io.StringIO(content.decode("utf-8")))

    results = []
    for row in csv_reader:
        question = row.get("Question", "").strip()
        if not question:
            continue
        result = await answer_question_with_sources(question, language)
        results.append({
            "Question": question,
            "Answer": result["answer"],
            "Sources": result["sources"],
        })

    return {"results": results}


# ─── Evaluation Dashboard ─────────────────────────────────────────────────────

class EvaluateRequest(BaseModel):
    question: str
    language: str = "English"


@app.post("/evaluate")
async def evaluate(body: EvaluateRequest):
    """
    Single-question evaluation endpoint.
    Returns the answer, the raw retrieved chunks, and source attribution.
    Used by the Evaluation Dashboard to make the RAG pipeline transparent.
    """
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question cannot be empty.")

    docs = await _get_retriever().ainvoke(question)
    result = await answer_question_with_sources(question, body.language)

    chunks = [
        {
            "source": doc.metadata.get("source", "Unknown"),
            "text": doc.page_content,
            "rank": i + 1,
        }
        for i, doc in enumerate(docs)
    ]

    return {
        "question": question,
        "answer": result["answer"],
        "sources": result["sources"],
        "retrieved_chunks": chunks,
    }