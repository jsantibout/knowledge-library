# from langchain_community.vectorstores import Chroma
# from langchain.embeddings import HuggingFaceEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

INDEX_DIR = "index-chroma"
MODEL = "sentence-transformers/all-MiniLM-L6-v2"
COLLECTION = "spacebio"

def main():
    # db = Chroma(persist_directory=INDEX_DIR, embedding_function=HuggingFaceEmbeddings(model_name=MODEL))
    emb = HuggingFaceEmbeddings(model_name=MODEL)
    db = Chroma(
        persist_directory=INDEX_DIR,
        embedding_function=emb,
        collection_name=COLLECTION,
    )

    while True:
        q = input("\nAsk> ").strip()
        if not q: break
        docs = db.similarity_search(q, k=4)

        for i, d in enumerate(docs, 1):
            title = d.metadata.get("title", "Untitled")
            url = d.metadata.get("url", "N/A")
            print(f"\n[{i}] {title} ({url})")
            print(d.page_content[:500], "…")

if __name__ == "__main__":
    main()