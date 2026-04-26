import os

from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_groq import ChatGroq
from langchain_pinecone import PineconeEmbeddings

def get_embedding_model():
    """
    Turns our text (PDF, CSVs) into arrays of numbers (vectors).
    If GROQ_API_KEY is present, we assume cloud mode and use Pinecone's serverless embeddings.
    """
    if os.getenv("GROQ_API_KEY"):
        return PineconeEmbeddings(model="multilingual-e5-large")
    else:
        return OllamaEmbeddings(model="nomic-embed-text")
    
def get_llm():
    """
    The "Brain" that will read the client's question and write the final answer.
    If GROQ_API_KEY is present, we use Groq's insanely fast cloud API.
    """
    if os.getenv("GROQ_API_KEY"):
        return ChatGroq(model="llama3-8b-8192")
    else:
        return ChatOllama(model="llama3")
