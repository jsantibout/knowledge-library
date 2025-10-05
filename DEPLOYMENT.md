# Vercel Deployment Guide

This guide explains how to deploy your knowledge library application to Vercel with both frontend and backend functionality.

## Architecture

The application uses a hybrid approach:
- **Frontend**: Next.js application deployed on Vercel
- **Backend**: Python FastAPI converted to Vercel serverless functions
- **Development**: Local Python backend for development
- **Production**: Serverless functions for production

## Setup for Deployment

### 1. Environment Variables

Set these environment variables in your Vercel dashboard:

```
OPENAI_API_KEY=your_openai_api_key_here
INDEX_DIR=backend/index-chroma
EMBED_MODEL=sentence-transformers/all-MiniLM-L6-v2
COLLECTION_NAME=spacebio
DEFAULT_K=4
FETCH_K=16
OPENAI_MODEL=gpt-4o-mini
```

### 2. Data Upload

You need to upload your processed data to Vercel:

1. **Upload the index directory**: The `backend/index-chroma` directory needs to be included in your deployment
2. **Ensure data is processed**: Run `python harvest.py` and `python embed_local.py` locally first
3. **Commit the index**: Make sure the `backend/index-chroma` directory is committed to your repository

### 3. Deployment Steps

1. **Connect to Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Configure Environment Variables**:
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add the environment variables listed above

3. **Deploy**:
   ```bash
   vercel --prod
   ```

## How It Works

### Development Mode
- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:8000` (using `npm run dev:full`)
- API routes proxy requests to the local backend

### Production Mode
- Frontend runs on Vercel
- Backend runs as serverless functions at `/api/backend/*`
- API routes automatically switch to use serverless functions

## API Endpoints

### Serverless Functions (Production)
- `GET /api/backend/health` - Health check
- `POST /api/backend/search` - Search documents
- `POST /api/backend/ask` - Ask questions with AI

### Proxy Routes (Development)
- `GET /api/health` - Proxies to local backend
- `POST /api/search` - Proxies to local backend
- `POST /api/ask` - Proxies to local backend

## Troubleshooting

### Common Issues

1. **Missing Dependencies**: Ensure all Python dependencies are in `app/api/backend/requirements.txt`

2. **Data Not Found**: Make sure the `backend/index-chroma` directory is committed and deployed

3. **Environment Variables**: Verify all required environment variables are set in Vercel

4. **Cold Start**: First requests may be slow due to serverless cold starts

### Debugging

Check the Vercel function logs:
1. Go to your Vercel dashboard
2. Navigate to your project
3. Click on "Functions" tab
4. View logs for each function

## Local Development

To run locally with both frontend and backend:

```bash
# Install dependencies
npm install

# Start both services
npm run dev:full
```

This will start:
- Next.js frontend on `http://localhost:3000`
- Python backend on `http://localhost:8000`
