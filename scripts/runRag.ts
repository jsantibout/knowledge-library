// scripts/runRag.ts
import "dotenv/config";
import { graphPromise } from "../lib/ragGraph";

async function runRag() {
  const graph = await graphPromise;
  const result = await graph.invoke({ question: "How did training and selection of mice occur?" });
  // const result = await graph.invoke({ question: "What are AI agents?" });
  console.log(result);
}

runRag().catch(console.error);
