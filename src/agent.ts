import { generateSystemPrompt } from "@openuidev/lang-core";
import { createAgent } from "langchain";
import { ClaudeCodeChatModel } from "./claude-code-model";
import librarySpec from "./generated/spec.json";

const { promptOptions, ...library } = librarySpec;

export function createChatAgent() {
  const model = new ClaudeCodeChatModel(process.env.CLAUDE_CODE_MODEL || "haiku");
  return createAgent({
    model,
    tools: [],
    systemPrompt: generateSystemPrompt({ library, promptOptions }) +
      "\nKeep responses concise. Use UI components for comparisons, charts, tables, and forms when useful. Label illustrative data as sample data. You have no live data or external action tools; do not claim to fetch current information or submit forms to external services.",
  });
}
