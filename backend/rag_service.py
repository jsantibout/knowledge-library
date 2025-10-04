import os
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma



INDEX_DIR   = os.getenv("INDEX_DIR", "index-chroma")
MODEL_NAME  = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
COLLECTION  = os.getenv("COLLECTION_NAME", "spacebio")  # must match embed_local.py
DEFAULT_K   = int(os.getenv("DEFAULT_K", "4"))
FETCH_K     = int(os.getenv("FETCH_K", "16"))
PREFERRED_SECTIONS = {"results", "discussion", "conclusion", "abstract"}

# -------- APP & CORS --------
app = FastAPI(title="SpaceBio RAG API", version="0.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- VECTOR STORE / RETRIEVER --------
emb = HuggingFaceEmbeddings(model_name=MODEL_NAME)
vs = Chroma(
    persist_directory=INDEX_DIR,
    embedding_function=emb,
    collection_name=COLLECTION,
)
retriever = vs.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": DEFAULT_K,
        "fetch_k": FETCH_K,
        "filter": {"section": {"$in": list(PREFERRED_SECTIONS)}},  
    },
)

# --- Schemas ---
class SearchRequest(BaseModel):
    question: str
    k: Optional[int] = None  

class AskRequest(BaseModel):
    question: str
    k: Optional[int] = None  

def prioritize_sections(docs):
    def score(d):
        sec = (d.metadata.get("section") or "").lower()
        return 1 if sec in PREFERRED_SECTIONS else 0

    return sorted(docs, key=score, reverse=True)


@app.get("/health")
def health():
    return {"ok": True, "index_dir": INDEX_DIR, "collection": COLLECTION}

@app.post("/search")
def search(body: SearchRequest):
    k = body.k or DEFAULT_K

    docs = retriever.invoke(body.question)
    docs = prioritize_sections(docs)[:k]

    results = []
    for d in docs:
        results.append({
            "title":   d.metadata.get("title"),
            "url":     d.metadata.get("url"),
            "section": d.metadata.get("section", "fulltext"),
            "snippet": d.page_content[:500]
        })
    return {"query": body.question, "k": k, "results": results}

@app.post("/ask")
def ask(body: AskRequest):
    k = body.k or DEFAULT_K
    docs = retriever.invoke(body.question)
    docs = prioritize_sections(docs)[:k]

    # Simple retrieval-only synthesis (no LLM required)
    bullets = []
    for i, d in enumerate(docs, 1):
        sec = d.metadata.get("section", "fulltext")
        bullets.append(f"[{i}] ({sec}) {d.page_content.strip()[:350]}")

    answer = (
        "Preliminary synthesis from the most relevant sections:\n\n" +
        "\n\n".join(bullets) +
        "\n\n(Replace this with LLM-generated text when API keys are available.)"
    )
    sources = [{
        "label":   f"[{i+1}]",
        "title":   d.metadata.get("title"),
        "url":     d.metadata.get("url"),
        "section": d.metadata.get("section", "fulltext")
    } for i, d in enumerate(docs)]

    return {"query": body.question, "k": k, "answer": answer, "sources": sources}
