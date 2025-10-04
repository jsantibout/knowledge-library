// lib/embeddings.ts
import { OpenAIEmbeddings } from "@langchain/openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    "OPENAI_API_KEY environment variable is required. Please set it in your environment or create a .env.local file with OPENAI_API_KEY=your_key_here"
  );
}

export const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
  openAIApiKey: apiKey,
});
