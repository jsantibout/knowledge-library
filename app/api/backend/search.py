from http.server import BaseHTTPRequestHandler
import json
from shared import get_retriever, prioritize_sections, cors_headers, DEFAULT_K

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            question = body.get('question', '')
            k = body.get('k', DEFAULT_K)
            
            retriever = get_retriever()
            docs = retriever.invoke(question)
            docs = prioritize_sections(docs)[:k]

            response_data = {
                "query": question,
                "k": k,
                "results": [
                    {
                        "title": d.metadata.get("title"),
                        "url": d.metadata.get("url"),
                        "section": d.metadata.get("section", "fulltext"),
                        "snippet": d.page_content[:500],
                    }
                    for d in docs
                ],
            }
            
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
            self.wfile.write(json.dumps({"error": "Search failed"}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        for key, value in cors_headers().items():
            self.send_header(key, value)
        self.end_headers()
