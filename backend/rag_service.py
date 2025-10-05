import os
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain

from dotenv import load_dotenv
load_dotenv()

# -------- CONFIG --------
INDEX_DIR   = os.getenv("INDEX_DIR", "index-chroma")
MODEL_NAME  = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
COLLECTION  = os.getenv("COLLECTION_NAME", "spacebio")  # must match embed_local.py
DEFAULT_K   = int(os.getenv("DEFAULT_K", "4"))
FETCH_K     = int(os.getenv("FETCH_K", "16"))
PREFERRED_SECTIONS = {"results", "discussion", "conclusion", "abstract"}
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL   = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# -------- APP & CORS --------
app = FastAPI(title="SpaceBio RAG API", version="0.2")
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

# -------- LLM RAG CHAIN (created on startup if API key present) --------
rag_chain = None
if OPENAI_API_KEY:
    llm = ChatOpenAI(model=OPENAI_MODEL, temperature=0.2, api_key=OPENAI_API_KEY)
    # Prompt tuned for NASA bioscience summarization + citations
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
    rag_chain = create_retrieval_chain(retriever, qa_chain)


@app.get("/health")
def health():
    return {
        "ok": True, 
        "index_dir": INDEX_DIR, 
        "collection": COLLECTION,
        "embed_model": MODEL_NAME,
        "openai_model": OPENAI_MODEL if OPENAI_API_KEY else None,
        "llm_enabled": bool(OPENAI_API_KEY),
        }

@app.post("/search")
def search(body: SearchRequest):
    k = body.k or DEFAULT_K
    docs = retriever.invoke(body.question)
    docs = prioritize_sections(docs)[:k]

    return {
        "query": body.question,
        "k": k,
        "results": [
            {
                "title":   d.metadata.get("title"),
                "url":     d.metadata.get("url"),
                "section": d.metadata.get("section", "fulltext"),
                "snippet": d.page_content[:500],
            }
            for d in docs
        ],
    }



@app.post("/ask")
def ask(body: AskRequest):
    if not rag_chain:
        k = body.k or DEFAULT_K
        docs = retriever.invoke(body.question)
        docs = prioritize_sections(docs)[:k]
        bullets = []
        for i, d in enumerate(docs, 1):
            sec = d.metadata.get("section", "fulltext")
            bullets.append(f"[{i}] ({sec}) {d.page_content.strip()[:350]}")
        answer = (
            "Preliminary synthesis (retrieval-only; add OPENAI_API_KEY for LLM summary):\n\n"
            + "\n\n".join(bullets)
        )
        sources = [
            {
                "label":   f"[{i+1}]",
                "title":   d.metadata.get("title"),
                "url":     d.metadata.get("url"),
                "section": d.metadata.get("section", "fulltext"),
            }
            for i, d in enumerate(docs)
        ]
        return {"query": body.question, "k": k, "answer": answer, "sources": sources}

    # LLM-enabled RAG path
    result = rag_chain.invoke({"input": body.question})
    # result contains "answer" and "context" (list of Documents)
    answer_text = result.get("answer") or result.get("output_text") or ""
    ctx_docs = result.get("context", [])

    # consistent citations ordering
    ctx_docs = prioritize_sections(ctx_docs)

    sources = [
        {
            "label":   f"[{i+1}]",
            "title":   d.metadata.get("title"),
            "url":     d.metadata.get("url"),
            "section": d.metadata.get("section", "fulltext"),
        }
        for i, d in enumerate(ctx_docs[: body.k or DEFAULT_K])
    ]
