// lib/vectorstore.ts
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { embeddings } from "./embeddings";

export const vectorStore = new MemoryVectorStore(embeddings);
