python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

python harvest.py
python embed_local.py
python query_local.py


or for the rag file:
python harvest.py
python embed_local.py

uvicorn rag_service:app --reload

curl -X POST localhost:8000/search -H "Content-Type: application/json"      -d '{"question":"How does microgravity affect gene expression in plants?"}' | jq .
 or 
curl -X POST localhost:8000/search -H "Content-Type: application/json"      -d '{"question":"How does microgravity affect gene expression in plants?"}' 