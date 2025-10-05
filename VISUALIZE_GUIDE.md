# Visualize Guide

The visualize feature generates educational illustrations (manga-style or coloring book-style) based on scientific questions using Google's Gemini AI.

## 🎯 What It Does

1. **Takes a scientific question** (e.g., "How does microgravity affect bone density?")
2. **Gets an answer** from your RAG knowledge base
3. **Generates educational images** in two styles:
   - **Manga**: Black-and-white panels with speech bubbles and labels
   - **Coloring Book**: Line art for coloring with educational labels

## 🚀 How to Run

### 1. Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
# Required for image generation
GEMINI_API_KEY=your_gemini_api_key_here

# Optional - for development (defaults to localhost:8000)
RAG_BACKEND_URL=http://localhost:8000
```

**Get a Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy it to your `.env.local` file

### 2. Start the Application

```bash
# Install dependencies (if not already done)
pnpm install

# Start both frontend and backend
pnpm run dev:full
```

This will start:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

### 3. Test the Visualize Endpoint

#### Option A: Use the Test Script
```bash
node test-visualize.js
```

#### Option B: Manual API Testing

**Manga Style (Single Image):**
```bash
curl -X POST http://localhost:3000/api/visualize \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How does microgravity affect bone density in astronauts?",
    "mode": "manga",
    "imageCount": 1
  }'
```

**Coloring Book Style (Multiple Images):**
```bash
curl -X POST http://localhost:3000/api/visualize \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the main components of the cardiovascular system?",
    "mode": "coloring",
    "imageCount": 2
  }'
```

#### Option C: Use a Frontend Interface

Create a simple HTML page to test:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Visualize Test</title>
</head>
<body>
    <h1>Visualize Test</h1>
    <form id="visualizeForm">
        <div>
            <label>Question:</label>
            <input type="text" id="question" placeholder="Ask a scientific question..." style="width: 400px;">
        </div>
        <div>
            <label>Mode:</label>
            <select id="mode">
                <option value="manga">Manga</option>
                <option value="coloring">Coloring Book</option>
            </select>
        </div>
        <div>
            <label>Image Count:</label>
            <input type="number" id="imageCount" value="1" min="1" max="5">
        </div>
        <button type="submit">Generate Images</button>
    </form>
    
    <div id="results"></div>

    <script>
        document.getElementById('visualizeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const question = document.getElementById('question').value;
            const mode = document.getElementById('mode').value;
            const imageCount = parseInt(document.getElementById('imageCount').value);
            
            try {
                const response = await fetch('/api/visualize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question, mode, imageCount })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    document.getElementById('results').innerHTML = `
                        <h3>Results:</h3>
                        <p><strong>Answer:</strong> ${result.answer}</p>
                        <p><strong>Sources:</strong> ${result.sources.length} found</p>
                        <div>
                            ${result.images.map((img, i) => 
                                `<img src="data:image/png;base64,${img}" alt="Generated image ${i+1}" style="max-width: 300px; margin: 10px;">`
                            ).join('')}
                        </div>
                    `;
                } else {
                    document.getElementById('results').innerHTML = `<p style="color: red;">Error: ${result.error}</p>`;
                }
            } catch (error) {
                document.getElementById('results').innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }
        });
    </script>
</body>
</html>
```

## 📋 API Reference

### Endpoint: `POST /api/visualize`

**Request Body:**
```json
{
  "question": "Your scientific question here",
  "mode": "manga" | "coloring",
  "imageCount": 1-20
}
```

**Response:**
```json
{
  "success": true,
  "mode": "manga",
  "imageCount": 1,
  "answer": "Scientific answer from RAG...",
  "sources": [
    {
      "label": "[1]",
      "title": "Paper Title",
      "url": "https://...",
      "section": "results"
    }
  ],
  "images": ["base64_encoded_image_data..."]
}
```

## 🔧 Troubleshooting

### Common Issues:

1. **"API key not configured"**
   - Set `GEMINI_API_KEY` in your environment variables

2. **"RAG /ask failed"**
   - Make sure your backend is running (`npm run dev:full`)
   - Check that your data is processed (run `python harvest.py` and `python embed_local.py`)

3. **"No image data in Gemini response"**
   - Check your Gemini API key is valid
   - Ensure you have sufficient API quota

4. **Slow responses**
   - First request may be slow due to model loading
   - Consider reducing `imageCount` for faster results

### Debug Steps:

1. **Check environment variables:**
   ```bash
   echo $GEMINI_API_KEY
   ```

2. **Test RAG backend separately:**
   ```bash
   curl -X POST http://localhost:8000/ask \
     -H "Content-Type: application/json" \
     -d '{"question": "test question"}'
   ```

3. **Check logs:**
   - Look at your terminal output for error messages
   - Check browser developer tools for network errors

## 🎨 Example Questions

Try these scientific questions:

- "How does microgravity affect bone density in astronauts?"
- "What are the main components of the cardiovascular system?"
- "How does space radiation impact cellular DNA?"
- "What happens to muscle mass in zero gravity?"
- "How do plants grow in space environments?"
