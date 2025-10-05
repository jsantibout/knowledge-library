import os
import json
from typing import List, Optional, Dict, Any
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain

# Configuration
INDEX_DIR = os.getenv("INDEX_DIR", "backend/index-chroma")
MODEL_NAME = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
COLLECTION = os.getenv("COLLECTION_NAME", "spacebio")
DEFAULT_K = int(os.getenv("DEFAULT_K", "4"))
FETCH_K = int(os.getenv("FETCH_K", "16"))
PREFERRED_SECTIONS = {"results", "discussion", "conclusion", "abstract"}
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Global variables for caching
_emb = None
_vs = None
_retriever = None
_rag_chain = None

def get_embeddings():
    global _emb
    if _emb is None:
        _emb = HuggingFaceEmbeddings(model_name=MODEL_NAME)
    return _emb

def get_vector_store():
    global _vs
    if _vs is None:
        emb = get_embeddings()
        _vs = Chroma(
            persist_directory=INDEX_DIR,
            embedding_function=emb,
            collection_name=COLLECTION,
        )
    return _vs

def get_retriever():
    global _retriever
    if _retriever is None:
        vs = get_vector_store()
        _retriever = vs.as_retriever(
            search_type="mmr",
            search_kwargs={
                "k": DEFAULT_K,
                "fetch_k": FETCH_K,
                "filter": {"section": {"$in": list(PREFERRED_SECTIONS)}},  
            },
        )
    return _retriever

def get_rag_chain():
    global _rag_chain
    if _rag_chain is None and OPENAI_API_KEY:
        llm = ChatOpenAI(model=OPENAI_MODEL, temperature=0.2, api_key=OPENAI_API_KEY)
        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are a concise NASA bioscience research assistant. "
             "Answer only using the provided context from peer-reviewed publications. "
             "Prefer Results/Discussion/Conclusion. If uncertain, say you don't know. "
             "Return a short, clear answer followed by a bullet list of key findings."),
            ("human",
             "Question: {input}\n\n"
             "Context (citations included below):\n{context}")
        ])
        qa_chain = create_stuff_documents_chain(llm, prompt)
        retriever = get_retriever()
        _rag_chain = create_retrieval_chain(retriever, qa_chain)
    return _rag_chain

def prioritize_sections(docs):
    def score(d):
        sec = (d.metadata.get("section") or "").lower()
        return 1 if sec in PREFERRED_SECTIONS else 0
    return sorted(docs, key=score, reverse=True)

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
