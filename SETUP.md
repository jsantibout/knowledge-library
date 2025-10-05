# SpaceBio Knowledge Library - Setup Guide

This project integrates a Python FastAPI backend with a Next.js frontend for searching and querying NASA bioscience research documents.

## Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   Create a `.env` file in the `backend` directory:
   ```bash
   # Optional: OpenAI API key for LLM features
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Optional: Custom model settings
   OPENAI_MODEL=gpt-4o-mini
   EMBED_MODEL=sentence-transformers/all-MiniLM-L6-v2
   INDEX_DIR=index-chroma
   COLLECTION_NAME=spacebio
   DEFAULT_K=4
   FETCH_K=16
   ```

3. **Start the backend server:**
   ```bash
   cd backend
   uvicorn rag_service:app --reload --host 0.0.0.0 --port 8000
   ```

## Frontend Setup

1. **Install Node.js dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```bash
   # Backend API URL
   BACKEND_URL=http://localhost:8000
   ```

3. **Start the Next.js development server:**
   ```bash
   pnpm run dev
   ```

## Usage

1. **Start both services:**
   - Backend: `cd backend && uvicorn rag_service:app --reload --port 8000`
   - Frontend: `pnpm run dev`

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Backend docs: http://localhost:8000/docs

## Features

- **Search Documents**: Find relevant research papers and documents
- **Ask AI**: Get AI-powered answers based on the document collection
- **Health Monitoring**: Real-time backend connection status
- **Responsive Design**: Works on desktop and mobile devices

## API Endpoints

The Next.js app provides these API routes that proxy to the Python backend:

- `GET /api/health` - Check backend health
- `POST /api/search` - Search documents
- `POST /api/ask` - Ask AI questions

## Troubleshooting

1. **Backend not connecting**: Ensure the Python backend is running on port 8000
2. **No search results**: Check if the vector database is properly indexed
3. **AI not working**: Verify OpenAI API key is set in backend `.env` file
