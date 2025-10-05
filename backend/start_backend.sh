#!/bin/bash -e

# Check if virtual environment exists, create if not
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install dependencies if requirements.txt is newer than .venv
if [ requirements.txt -nt .venv/pip-installed ] || [ ! -f .venv/pip-installed ]; then
    echo "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    touch .venv/pip-installed
fi

# Start the FastAPI server
echo "Starting FastAPI server on http://127.0.0.1:8000"
uvicorn rag_service:app --reload --host 127.0.0.1 --port 8000
