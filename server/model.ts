import { createDeepSeek } from "@ai-sdk/deepseek";
import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import { type LanguageModel, simulateReadableStream } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import { RENDER_UI_TOOL } from "../src/genui/server";

export const MOCK_PROGRAM = [
  "root = Stack([title, chart, tbl, addBtn])",
  'title = TextContent("Monthly sales and scheduled jobs (demo data)")',
  'sales = Query("sales_summary", {from: "2026-05", to: "2026-10", groupBy: "month"}, {labels: [], amountsJpy: []})',
  'chart = BarChart(sales.labels, [Series("Sales (JPY)", sales.amountsJpy)])',
  'jobs = Query("list_jobs", {status: "scheduled"}, [])',
  'tbl = Table([Col("Job", jobs.title), Col("Customer", jobs.customerName), Col("Date", jobs.scheduledAt), Col("Amount (JPY)", jobs.amountJpy, "number")])',
  'task = Mutation("create_followup_task", {jobId: "J002", title: "Call the customer", due: "2026-11-20"})',
  'addBtn = Button("Add follow-up task to J002", Action([@Run(task)]))',
].join("\n");

const usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

function chunks(text: string, size: number) {
  return Array.from({ length: Math.ceil(text.length / size) }, (_, i) => text.slice(i * size, (i + 1) * size));
}

function textParts(id: string, text: string): LanguageModelV3StreamPart[] {
  return [{ type: "text-start", id }, ...chunks(text, 12).map((delta) => ({ type: "text-delta" as const, id, delta })), { type: "text-end", id }];
}

function mockTurn(afterToolResult: boolean): LanguageModelV3StreamPart[] {
  if (afterToolResult) {
    return [...textParts("t2", "That is the mock dashboard over the demo data."), { type: "finish", usage, finishReason: "stop" }];
  }
  const input = JSON.stringify({ program: MOCK_PROGRAM });
  return [
    ...textParts("t1", "Here is a mock sales dashboard."),
    { type: "tool-input-start", id: "mock-call", toolName: RENDER_UI_TOOL },
    ...chunks(input, 40).map((delta) => ({ type: "tool-input-delta" as const, id: "mock-call", delta })),
    { type: "tool-input-end", id: "mock-call" },
    { type: "tool-call", toolCallId: "mock-call", toolName: RENDER_UI_TOOL, input },
    { type: "finish", usage, finishReason: "tool-calls" },
  ];
}

export function createModel(env: Record<string, string | undefined>): LanguageModel {
  if (env.DEMO_MOCK_MODEL === "1") {
    return new MockLanguageModelV3({
      provider: "mock",
      modelId: "mock-genui",
      doStream: async ({ prompt }) => ({
        stream: simulateReadableStream({ chunks: mockTurn(prompt.at(-1)?.role === "tool"), chunkDelayInMs: 30 }),
      }),
    });
  }
  if (!env.DEEPSEEK_API_KEY) throw new Error("Set DEEPSEEK_API_KEY in the shell, or DEMO_MOCK_MODEL=1 for the offline mock.");
  return createDeepSeek({ apiKey: env.DEEPSEEK_API_KEY })(env.DEEPSEEK_MODEL ?? "deepseek-chat");
}
