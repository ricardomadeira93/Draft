# Draft

A RAG (Retrieval-Augmented Generation) system for automating security questionnaires and RFPs. 

The application is built on FastAPI, Next.js, Pinecone, and LangChain. It ingests knowledge base documents, stores vector embeddings in Pinecone, and processes CSV questionnaires in batch.

## Architecture

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4
- **Backend**: FastAPI, Python 3.14
- **Vector Database**: Pinecone
- **LLM/Embeddings**: Groq (Llama 3) / Ollama

## Workflow

1. **Ingestion**: Documents are uploaded via `/upload-kb`, chunked (RecursiveCharacterTextSplitter), and embedded.
2. **Embedding Selection**: The system detects the environment. If `GROQ_API_KEY` is present, it uses Pinecone's serverless embeddings (`multilingual-e5-large`, 1024 dims). Otherwise, it defaults to Ollama (`nomic-embed-text`, 768 dims).
3. **Processing**: CSV uploads to `/process-csv` are parsed. The "Question" column is processed through a LangChain retrieval chain.
4. **Retrieval**: Top `k=3` relevant chunks are retrieved and passed to the LLM to generate an answer with source citations.

## API Routes

### Knowledge Base
- `POST /upload-kb`: Upload, chunk, embed, and index document
- `GET /kb/files`: List tracked documents
- `DELETE /kb/files/{filename}`: Delete document and purge vectors

### Questionnaire
- `POST /process-csv`: Process CSV and return generated answers and sources
- `POST /evaluate`: Single-question evaluation endpoint

## Setup

### Prerequisites
- `uv` (Python Package Manager)
- Node.js 20+
- Pinecone API Key (Dimension: 1024, Metric: Cosine, Name: `draft-kb`)
- Groq API Key

### Backend
```bash
cd rfpilot-api
uv pip install -r requirements.txt
uv run uvicorn main:app --reload
```

### Frontend
```bash
cd rfpilot-web
npm install
npm run dev
```

### Environment Variables
- **Backend** (`rfpilot-api/.env`): `PINECONE_API_KEY`, `GROQ_API_KEY`
- **Frontend** (`rfpilot-web/.env.local`): `NEXT_PUBLIC_API_URL`

## Deployment
- **Frontend**: Vercel. Set `NEXT_PUBLIC_API_URL` to the backend URL.
- **Backend**: Render.com. Use `render.yaml`. Set `GROQ_API_KEY` and `PINECONE_API_KEY`.
