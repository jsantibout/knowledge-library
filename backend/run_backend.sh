#!bin/bash -e

python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

python harvest.py
python embed_local.py

uvicorn rag_service:app --reload

# Commands to test backend
#curl -s http://127.0.0.1:8000/health | jq .

#curl -s -X POST http://127.0.0.1:8000/ask \
#  -H "Content-Type: application/json" \
#  -d '{"question":"How does spaceflight impact immune response in astronauts?"}' | jq .

#curl -s -X POST http://127.0.0.1:8000/ask \
#  -H "Content-Type: application/json" \
#  -d '{"question":"What are the main effects of microgravity on cardiovascular remodeling?"}' | jq .



