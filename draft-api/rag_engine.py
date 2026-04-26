from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_pinecone import PineconeVectorStore

from llm_router import get_llm, get_embedding_model
from database import INDEX_NAME

_vectorstore = None
_retriever = None


def _get_vectorstore():
    """Lazy singleton — only connects to Pinecone/Ollama on first call."""
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = PineconeVectorStore.from_existing_index(
            index_name=INDEX_NAME,
            embedding=get_embedding_model(),
        )
    return _vectorstore


def _get_retriever():
    global _retriever
    if _retriever is None:
        _retriever = _get_vectorstore().as_retriever(search_kwargs={"k": 3})
    return _retriever

template = """You are a professional B2B RFP (Request for Proposal) assistant.
Use the following pieces of retrieved context to answer the question.
If the answer is not in the context, say "I do not have enough information to answer this based on the company knowledge base."
Do not make up facts. Keep the answer concise and highly professional.

Context:
{context}

Question: {question}

Answer: """

prompt = PromptTemplate.from_template(template)


def format_docs(docs: list) -> str:
    """Combine retrieved chunks into a single context string."""
    return "\n\n".join(doc.page_content for doc in docs)


def extract_sources(docs: list) -> list[dict]:
    """
    Extract source attribution from retrieved documents.
    Returns a list with the source filename and a snippet of the chunk text.
    """
    sources = []
    for doc in docs:
        sources.append({
            "source": doc.metadata.get("source", "Unknown"),
            "snippet": doc.page_content[:200].replace("\n", " ").strip() + "...",
        })
    return sources


def _build_rag_chain():
    """Build the LCEL chain on demand using the lazy retriever."""
    return (
        {"context": _get_retriever() | format_docs, "question": RunnablePassthrough()}
        | prompt
        | get_llm()
        | StrOutputParser()
    )


async def answer_question(question: str) -> str:
    """Takes a single question and returns the AI-generated answer."""
    return await _build_rag_chain().ainvoke(question)


async def answer_question_with_sources(question: str) -> dict:
    """
    Returns the AI answer plus the source chunks used to generate it.
    Used by the workspace data table and the evaluation dashboard.
    """
    docs = await _get_retriever().ainvoke(question)
    context = format_docs(docs)
    sources = extract_sources(docs)

    filled_prompt = prompt.format(context=context, question=question)
    answer = await get_llm().ainvoke(filled_prompt)
    answer_text = answer.content if hasattr(answer, "content") else str(answer)

    return {
        "answer": answer_text.strip(),
        "sources": sources,
    }
