import "./noTelemetry";
import { AISDKAgent, UseAIServer } from "@meetsmore-oss/use-ai-server";
import { demoToolSpecs } from "../src/demo/fieldservice/descriptors";
import spec from "../src/generated/spec.json";
import { buildGenUISystemPrompt } from "../src/genui/server";
import { createModel } from "./model";

const model = createModel(process.env);
const systemPrompt = buildGenUISystemPrompt(spec, { tools: demoToolSpecs() });

const agent = new AISDKAgent({
  hooks: { loadConfig: () => ({ model, systemPrompt, maxOutputTokens: 8192 }) },
});

const port = Number(process.env.USE_AI_PORT ?? 8081);
new UseAIServer({
  port,
  agents: { genui: agent },
  defaultAgent: "genui",
  cors: { origin: "http://localhost:3000", credentials: true },
});

console.log(`use-ai server on ws://localhost:${port} (model: ${typeof model === "string" ? model : model.modelId})`);
