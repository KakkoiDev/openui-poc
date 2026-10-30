// @vitest-environment node
import type { LanguageModelV3, LanguageModelV3Prompt, LanguageModelV3StreamPart } from "@ai-sdk/provider";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { convertReadableStreamToArray } from "ai/test";
import { describe, expect, it } from "vitest";
import { validateProgram } from "../src/genui/renderUITool";
import { RENDER_UI_TOOL } from "../src/genui/server";
import { createModel, MOCK_PROGRAM } from "./model";

async function stream(model: LanguageModelV3, prompt: LanguageModelV3Prompt) {
  const { stream } = await model.doStream({ prompt });
  return convertReadableStreamToArray(stream) as Promise<LanguageModelV3StreamPart[]>;
}

const user: LanguageModelV3Prompt = [{ role: "user", content: [{ type: "text", text: "show sales" }] }];

describe("createModel", () => {
  it("uses DeepSeek with the default model id", () => {
    const model = createModel({ DEEPSEEK_API_KEY: "test" }) as LanguageModelV3;
    expect([model.provider, model.modelId]).toEqual(["deepseek.chat", "deepseek-chat"]);
  });

  it("honours DEEPSEEK_MODEL", () => {
    const model = createModel({ DEEPSEEK_API_KEY: "test", DEEPSEEK_MODEL: "deepseek-reasoner" }) as LanguageModelV3;
    expect(model.modelId).toBe("deepseek-reasoner");
  });

  it("refuses to start without a key or mock mode", () => {
    expect(() => createModel({})).toThrow(/DEEPSEEK_API_KEY/);
  });

  it("mock program is valid OpenUI Lang using the demo data tools", () => {
    expect(validateProgram(openuiLibrary, MOCK_PROGRAM).success).toBe(true);
    expect(MOCK_PROGRAM).toContain('Query("sales_summary"');
    expect(MOCK_PROGRAM).toContain('Mutation("create_followup_task"');
  });

  it("mock model calls render_ui, then closes with text after the tool result", async () => {
    const model = createModel({ DEMO_MOCK_MODEL: "1" }) as LanguageModelV3;
    const first = await stream(model, user);
    const call = first.find((p) => p.type === "tool-call");
    expect(first.some((p) => p.type === "text-delta")).toBe(true);
    expect(call).toMatchObject({ toolName: RENDER_UI_TOOL });
    expect(JSON.parse((call as { input: string }).input)).toEqual({ program: MOCK_PROGRAM });
    expect(first.filter((p) => p.type === "tool-input-delta").length).toBeGreaterThan(1);
    expect(first.at(-1)).toMatchObject({ type: "finish", finishReason: "tool-calls" });

    const second = await stream(model, [...user, {
      role: "tool",
      content: [{ type: "tool-result", toolCallId: "c1", toolName: RENDER_UI_TOOL, output: { type: "json", value: { success: true } } }],
    }]);
    expect(second.some((p) => p.type === "tool-call")).toBe(false);
    expect(second.some((p) => p.type === "text-delta")).toBe(true);
    expect(second.at(-1)).toMatchObject({ type: "finish", finishReason: "stop" });
  });
});
