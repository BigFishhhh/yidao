# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

易道 (Yidao) — a RAG-based AI Q&A system for I Ching (周易) studies. Combines classical Chinese philosophy texts with DeepSeek LLM for intelligent divination, hexagram interpretation, and classical text learning.

## Development Commands

### Frontend (Next.js 16 + React 19 + TypeScript)

```bash
cd frontend
npm install
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
```

### Backend (Python + FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload   # API at http://localhost:8000, docs at /docs
```

### Knowledge Base Ingestion

Place `.txt/.md` files in `backend/data/books/`, then:

```bash
cd backend
python -m scripts.ingest
```

## Architecture

### Frontend (`frontend/src/`)

- **App Router** (`app/`): Three main routes — `/chat` (Q&A), `/divination` (hexagram casting), `/study` (64 hexagrams browser)
- **SSE streaming** (`lib/api.ts`): `fetchSSE()` utility handles all backend communication via Server-Sent Events with real-time token streaming
- **Markdown rendering** (`components/Markdown.tsx`): Custom renderer with classical Chinese ink-wash styling
- **Styling**: Tailwind CSS 4 with a classical Chinese ink-and-paper theme defined in `globals.css` (CSS variables for colors, custom animations like `ink-spread`, `brush-stroke`)

### Backend (`backend/app/`)

- **Routers** (`routers/`): FastAPI endpoints — `chat.py`, `divination.py`, `study.py`. All LLM responses use `StreamingResponse` with SSE.
- **Services** (`services/`):
  - `rag.py` — ChromaDB vector search using `shibing624/text2vec-base-chinese` embeddings. Singleton `RAGService` with `search()` method returns relevant classical text chunks.
  - `llm.py` — DeepSeek API integration via OpenAI SDK compatibility layer. `stream_chat()` yields SSE-formatted tokens.
  - `divination.py` — I Ching hexagram logic: 8 trigrams (八卦), 64 hexagrams (六十四卦) with full classical data, three-number casting method (三数起卦).
- **Config** (`config.py`): Reads from `.env` — `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `CHROMA_DB_PATH`.
- **Data pipeline** (`scripts/ingest.py`): Chunks text files by paragraphs (max 500 chars), embeds with sentence-transformers, stores in ChromaDB.

### Data Flow

1. User query → Frontend sends request to FastAPI endpoint
2. Backend retrieves relevant classical text chunks from ChromaDB (RAG)
3. Chunks + user query assembled into a system prompt with classical context
4. DeepSeek LLM streams response back via SSE
5. Frontend renders streaming markdown in real-time

## Key Conventions

- All UI text, LLM system prompts, and content are in Chinese
- Backend uses Pydantic models for request/response validation (`models/schemas.py`)
- CORS is configured to allow `localhost:3000` in development (`main.py`)
- Vector DB persists to `backend/chroma_db/` directory
- Environment config via `backend/.env` (see `.env.example`)
