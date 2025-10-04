// lib/ragGraph.ts
import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "./vectorstore"; // <--- your embeddings/vector store setup
import { ChatOpenAI } from "@langchain/openai";

// Initialize the graph components
let promptTemplate: ChatPromptTemplate;
let llm: ChatOpenAI;

async function initializeGraph() {
  // 1. Load and split web content
  const pTagSelector = "p";
  const cheerioLoader = new CheerioWebBaseLoader(
    // "https://lilianweng.github.io/posts/2023-06-23-agent/",
    "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4136787/",
    { selector: pTagSelector }
  );

  const docs = await cheerioLoader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const allSplits = await splitter.splitDocuments(docs);

  // 2. Index chunks
  await vectorStore.addDocuments(allSplits);

  // 3. Define prompt and LLM
  promptTemplate = await pull<ChatPromptTemplate>("rlm/rag-prompt");
  llm = new ChatOpenAI({ 
    model: "gpt-4o-mini",
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

// 4. Define state
const InputStateAnnotation = Annotation.Root({
  question: Annotation<string>,
});

const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  context: Annotation<Document[]>,
  answer: Annotation<string>,
});

// 5. Define steps
const retrieve = async (state: typeof InputStateAnnotation.State) => {
  const retrievedDocs = await vectorStore.similaritySearch(state.question);
  return { context: retrievedDocs };
};

const generate = async (state: typeof StateAnnotation.State) => {
  const docsContent = state.context.map(doc => doc.pageContent).join("\n");
  const messages = await promptTemplate.invoke({
    question: state.question,
    context: docsContent,
  });
  const response = await llm.invoke(messages);
  return { answer: response.content };
};

// 6. Build the graph
let graph: any;

async function createGraph() {
  await initializeGraph();
  graph = new StateGraph(StateAnnotation)
    .addNode("retrieve", retrieve)
    .addNode("generate", generate)
    .addEdge("__start__", "retrieve")
    .addEdge("retrieve", "generate")
    .addEdge("generate", "__end__")
    .compile();
  return graph;
}

// Export a promise that resolves to the graph
export const graphPromise = createGraph();
