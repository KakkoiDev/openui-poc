// Imported first by server/index.ts. use-ai-server enables Langfuse tracing (prompts included)
// when LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY are both set; OpenUI runtime telemetry is opt-in.
for (const key of Object.keys(process.env)) {
  if (key.startsWith("LANGFUSE_")) delete process.env[key];
}
delete process.env.OPENUI_RUNTIME_TELEMETRY_ENABLED;
process.env.OPENUI_TELEMETRY_DISABLED = "1";
process.env.NEXT_TELEMETRY_DISABLED = "1";
export {};
