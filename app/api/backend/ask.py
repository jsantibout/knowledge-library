from http.server import BaseHTTPRequestHandler
import json
from shared import get_retriever, get_rag_chain, prioritize_sections, cors_headers, DEFAULT_K

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            question = body.get('question', '')
            k = body.get('k', DEFAULT_K)
            
            def _retrieval_only_answer(prefix: str):
                retriever = get_retriever()
                docs = retriever.invoke(question) or []
                docs = prioritize_sections(docs)[:k]
                bullets = []
                for i, d in enumerate(docs, 1):
                    sec = (d.metadata.get("section") or "fulltext")
                    text = (d.page_content or "").strip()[:350]
                    bullets.append(f"[{i}] ({sec}) {text}")
                return {
                    "query": question,
                    "k": k,
                    "answer": (
                        f"{prefix}\n\n" +
                        ("\n\n".join(bullets) if bullets else "No matching passages found.")
                    ),
                    "sources": [
                        {
                            "label": f"[{i+1}]",
                            "title": d.metadata.get("title"), 
                            "url": d.metadata.get("url"),
                            "section": d.metadata.get("section", "fulltext"),
                        }
                        for i, d in enumerate(docs)
                    ],
                }

            # Try LLM path first
            rag_chain = get_rag_chain()
            if rag_chain:
                try:
                    result = rag_chain.invoke({"input": question}) or {}
                    
                    # Extract answer text
                    answer_text = (
                        result.get("answer")
                        or result.get("output_text")
                        or result.get("result")
                        or ""
                    )

                    # Extract context docs
                    ctx_docs = result.get("context") or result.get("source_documents") or []
                    if not isinstance(ctx_docs, list):
                        ctx_docs = []
                    
                    ctx_docs = prioritize_sections(ctx_docs)[:k]

                    if not answer_text.strip():
                        return _retrieval_only_answer("LLM returned no text. Showing retrieval-only synthesis:")

                    sources = [
                        {
                            "label": f"[{i+1}]",
                            "title": d.metadata.get("title"),
                            "url": d.metadata.get("url"),
                            "section": d.metadata.get("section", "fulltext"),
                        }
                        for i, d in enumerate(ctx_docs)
                    ]

                    response_data = {"query": question, "k": k, "answer": answer_text, "sources": sources}
                    
                except Exception as e:
                    response_data = _retrieval_only_answer("LLM unavailable (quota/error). Showing retrieval-only synthesis:")
            else:
                response_data = _retrieval_only_answer("Preliminary synthesis (retrieval-only; set OPENAI_API_KEY to enable LLM):")
            
            self.send_response(200)
            for key, value in cors_headers().items():
                self.send_header(key, value)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            self.send_response(500)
            for key, value in cors_headers().items():
                self.send_header(key, value)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Ask failed"}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        for key, value in cors_headers().items():
            self.send_header(key, value)
        self.end_headers()
