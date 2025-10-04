python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

python harvest.py
python embed_local.py
python query_local.py