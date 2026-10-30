import { generateSystemPrompt } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import spec from "../generated/spec.json";
import { buildGenUISystemPrompt, CHANNEL_RULES } from "./server";

describe("buildGenUISystemPrompt", () => {
  it("appends every channel rule to the library prompt", () => {
    const { promptOptions, ...library } = spec;
    const prompt = buildGenUISystemPrompt(spec);
    expect(prompt.startsWith(generateSystemPrompt({ library, promptOptions }))).toBe(true);
    for (const rule of CHANNEL_RULES) expect(prompt).toContain(rule);
  });

  it("lists data tools in the prompt", () => {
    const tool = { name: "list_widgets", description: "List widgets", inputSchema: { type: "object" }, outputSchema: { type: "object" } };
    expect(buildGenUISystemPrompt(spec)).not.toContain("list_widgets");
    expect(buildGenUISystemPrompt(spec, { tools: [tool] })).toContain("list_widgets");
  });
});
