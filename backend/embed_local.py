from pathlib import Path
import json
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from typing import Iterator, List, Dict
import chromadb
import os


IN = Path("data/harvested.jsonl")
INDEX_DIR = os.getenv("INDEX_DIR", "index-chroma")
COLL = os.getenv("COLLECTION_NAME", "spacebio")
MODEL = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1600"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "120"))


KEEP_SECTIONS = set(
    os.getenv("KEEP_SECTIONS", "abstract,introduction,results,discussion,conclusion").split(",")
)

MAX_RECORDS = int(os.getenv("MAX_RECORDS", "0"))  # 0 = no limit
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "3000"))

def load_jsonl(path: Path) -> Iterator[Dict]:
    with open(path, encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            if line.strip():
                rec = json.loads(line)
                # Section gate
                sec = (rec.get("section") or "fulltext").lower()
                if sec not in KEEP_SECTIONS:
                    continue
                yield rec
            if MAX_RECORDS and i >= MAX_RECORDS:
                break

def main():
    splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)

    emb = HuggingFaceEmbeddings(model_name=MODEL)
    client = chromadb.PersistentClient(path=INDEX_DIR)

    # create or get the collection once
    db = Chroma(
        client=client,
        collection_name=COLL,
        embedding_function=emb,
    )

    texts: List[str] = []
    metas: List[Dict] = []
    total_chunks = 0

    def flush():
        nonlocal texts, metas, total_chunks
        if not texts:
            return
        db.add_texts(texts=texts, metadatas=metas)
        total_chunks += len(texts)
        print(f"✅ Added batch of {len(texts)} chunks (total={total_chunks})")
        texts, metas = [], []

    seen_ids = set()  # avoid duplicates across reruns if your JSONL accumulates
    for rec in load_jsonl(IN):
        uid = f"{rec['url']}::{rec.get('section','fulltext')}"
        if uid in seen_ids:
            continue
        seen_ids.add(uid)

        for ch in splitter.split_text(rec["text"]):
            texts.append(ch)
            metas.append({
                "title": rec["title"],
                "url": rec["url"],
                "section": rec.get("section", "fulltext"),
            })
            if len(texts) >= BATCH_SIZE:
                flush()

    flush()
    print(f"🎯 Finished building index '{COLL}' at {INDEX_DIR}")

if __name__ == "__main__":
    main()
