# 🧠 SpaceBio Knowledge Library

## Description

The **SpaceBio Knowledge Library** is an AI-powered educational research interface that connects to a **Retrieval-Augmented Generation (RAG)** backend.  
It enables users to explore NASA bioscience data, ask intelligent questions, and generate educational visuals such as **manga-style panels** or **coloring book pages** to inspire scientific curiosity.

---

## ✨ Features

- **RAG Search & Query** – Retrieve and summarize scientific literature with AI.
- **Ask AI Anything** – Get contextual responses sourced from real NASA bioscience documents.
- **Visual Generation Mode** – Generate manga or coloring-style educational illustrations.
- **Dark / Light Mode** – Optimized for classrooms and research environments.
- **Health Check Monitor** – Instantly verify backend connectivity and model availability.
- **Tabbed Interface** – Switch between *Search*, *Ask*, and *Visualize* effortlessly.
- **Responsive Design** – Clean, professional interface across desktop and mobile devices.

---

## 🧩 Tech Stack

**Frontend**
- Next.js (App Router)
- TypeScript
- Tailwind CSS

**Backend (RAG Service)**
- FastAPI (Python)
- OpenAI API (GPT + Embeddings)
- Local Retrieval & Vector Storage

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/spacebio-knowledge-library.git
cd spacebio-knowledge-library
```

---

### 2️⃣ Install Frontend Dependencies

```bash
npm install
```

---

### 3️⃣ Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then open the `.env` file and fill in your credentials:

```env
OPENAI_API_KEY=
OPENAI_EMBED_MODEL=text-embedding-3-large
OPENAI_CHAT_MODEL=gpt-4o-mini
BACKEND_URL=http://127.0.0.1:8000
GEMINI_API_KEY=
VERCEL_URL=
```

---

### 4️⃣ Start the Development Server

```bash
npm run dev
```

Your app will be available at:  
👉 [http://localhost:3000](http://localhost:3000)

---

## 🧠 Backend Setup (RAG Service)

### 1️⃣ Navigate to the Backend Folder

```bash
cd backend
```

---

### 2️⃣ Create and Activate a Virtual Environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

---

### 3️⃣ Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

### 4️⃣ Configure Backend Environment Variables

Create a `.env` file in `/backend` and add:

```env
OPENAI_API_KEY=
OPENAI_EMBED_MODEL=text-embedding-3-large
OPENAI_CHAT_MODEL=gpt-4o-mini
```

---

### 5️⃣ Run the Data Embedding Pipeline

```bash
python harvest.py
python embed_local.py
```

---

### 6️⃣ Launch the RAG Service

```bash
uvicorn rag_service:app --reload
```

---

## 🧪 Testing & Example Commands

### ✅ Health Check

```bash
curl -s http://127.0.0.1:8000/health | jq .
```

---

### 💬 Example Query

```bash
curl -s -X POST http://127.0.0.1:8000/ask   -H "Content-Type: application/json"   -d '{"question":"How does spaceflight impact immune response in astronauts?"}' | jq .
```

---

### 🧬 Another Example Query

```bash
curl -s -X POST http://127.0.0.1:8000/ask   -H "Content-Type: application/json"   -d '{"question":"What are the main effects of microgravity on cardiovascular remodeling?"}' | jq .
```

---

## 📁 Project Structure

```
spacebio-knowledge-library/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
├── backend/
│   ├── rag_service.py
│   ├── harvest.py
│   ├── embed_local.py
│   ├── query_local.py
│   └── requirements.txt
├── public/
├── .env.example
└── README.md
```

---

## 🔭 Example Workflow

1. Enter a query such as  
   **“How does microgravity affect bone density in astronauts?”**  
2. Use **Ask AI** for an intelligent, source-based explanation.  
3. Switch to **Visualize Mode** to generate an educational illustration.  
4. Download or share your AI-generated educational manga panels.

---

## 👥 Contributors & Credits

Developed by **Vincent Truong** and team.  
Powered by **NASA Open Data**, **FastAPI**, and **OpenAI GPT Models**.

---

## 📜 License

This project is released under the **MIT License**.  
Feel free to use, modify, and contribute for educational and research purposes.

---

> “Science is the poetry of reality.” — Richard Dawkins
