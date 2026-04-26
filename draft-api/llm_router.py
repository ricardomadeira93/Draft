import os

from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_groq import ChatGroq
from langchain_pinecone import PineconeEmbeddings

def get_embedding_model():
    """
    Returns the appropriate embedding model based on environment configuration.
    Defaults to Pinecone serverless embeddings if GROQ_API_KEY is present,
    otherwise uses local Ollama embeddings.
    """
    if os.getenv("GROQ_API_KEY"):
        return PineconeEmbeddings(model="multilingual-e5-large")
    else:
        return OllamaEmbeddings(model="nomic-embed-text")
    
def get_llm():
    """
    Returns the appropriate LLM instance based on environment configuration.
    Defaults to Groq if GROQ_API_KEY is present, otherwise uses local Ollama.
    """
    if os.getenv("GROQ_API_KEY"):
        return ChatGroq(model="llama3-8b-8192")
    else:
        return ChatOllama(model="llama3")
