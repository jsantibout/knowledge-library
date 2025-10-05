from http.server import BaseHTTPRequestHandler
import json
import os
from shared import cors_headers

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            response_data = {
                "ok": True, 
                "index_dir": os.getenv("INDEX_DIR", "backend/index-chroma"), 
                "collection": os.getenv("COLLECTION_NAME", "spacebio"),
                "embed_model": os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2"),
                "openai_model": os.getenv("OPENAI_MODEL", "gpt-4o-mini") if os.getenv("OPENAI_API_KEY") else None,
                "llm_enabled": bool(os.getenv("OPENAI_API_KEY")),
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
            self.wfile.write(json.dumps({"error": "Internal server error"}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        for key, value in cors_headers().items():
            self.send_header(key, value)
        self.end_headers()
