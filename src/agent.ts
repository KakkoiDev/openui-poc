import { ChatOpenAI } from "@langchain/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { createAgent } from "langchain";
import librarySpec from "./generated/spec.json";

const { promptOptions, ...library } = librarySpec;

// Construct on request so the app can build and open before a key is added.
export function createChatAgent() {
  const model = new ChatOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
    streaming: true,
    useResponsesApi: false,
    configuration: { baseURL: "https://api.deepseek.com" },
    modelKwargs: { thinking: { type: "disabled" } },
  });
  return createAgent({
    model,
    tools: [],
    systemPrompt: generateSystemPrompt({ library, promptOptions }) +
      "\nKeep responses concise. Use UI components for comparisons, charts, tables, and forms when useful. Label illustrative data as sample data. You have no live data or external action tools; do not claim to fetch current information or submit forms to external services.",
  });
}
