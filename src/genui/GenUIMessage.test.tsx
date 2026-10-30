import type { ChatMessageSlotProps, ChatStreamingPart, PersistedMessage } from "@meetsmore-oss/use-ai-client";
import { describe, expect, it } from "vitest";
import { extractRenderCalls } from "./GenUIMessage";

const assistant = { id: "m1", role: "assistant", content: "", createdAt: new Date() } as PersistedMessage;
const program = 'root = Stack([t])\nt = TextContent("hi")';

function streamingProps(parts: ChatStreamingPart[]): Parameters<typeof extractRenderCalls>[0] {
  return { message: assistant, streaming: true, streamingParts: parts, sourceMessages: [] };
}

function toolCall(args: string, name = "render_ui", toolCallId = "c1"): ChatStreamingPart {
  return { kind: "tool_call", toolCallId, name, args };
}

describe("extractRenderCalls", () => {
  it("reads complete, cut-off, empty and unparsable args", () => {
    const full = JSON.stringify({ program });
    const calls = extractRenderCalls(streamingProps([
      toolCall(full, "render_ui", "a"),
      toolCall(full.slice(0, 30), "render_ui", "b"),
      toolCall("{}", "render_ui", "c"),
      toolCall("not json{", "render_ui", "d"),
    ]));
    expect(full.slice(0, 30)).toBe('{"program":"root = Stack([t])\\');
    expect(calls.map((c) => c.program)).toEqual([program, "root = Stack([t])", null, null]);
  });

  it("ignores other tools", () => {
    expect(extractRenderCalls(streamingProps([toolCall(JSON.stringify({ program }), "search")]))).toEqual([]);
  });

  it("renders nothing for a user message", () => {
    const user = { ...assistant, role: "user" } as PersistedMessage;
    expect(extractRenderCalls({ ...streamingProps([toolCall(JSON.stringify({ program }))]), message: user })).toEqual([]);
  });

  it("keys calls by position and marks only the last streaming call", () => {
    const args = JSON.stringify({ program });
    const streaming = extractRenderCalls(streamingProps([toolCall(args), { kind: "text", text: "ok" }, toolCall(args, "render_ui", "c2")]));
    const saved = extractRenderCalls({
      message: assistant,
      streaming: false,
      streamingParts: [],
      sourceMessages: [
        { ...assistant, toolCalls: [{ id: "c1", type: "function", function: { name: "render_ui", arguments: args } }] },
        { ...assistant, id: "m2", toolCalls: [{ id: "c2", type: "function", function: { name: "render_ui", arguments: args } }] },
      ],
    } satisfies Pick<ChatMessageSlotProps, "message" | "streaming" | "streamingParts" | "sourceMessages">);
    expect(streaming.map((c) => [c.key, c.isStreaming])).toEqual([["genui-0", false], ["genui-1", true]]);
    expect(saved.map((c) => [c.key, c.isStreaming])).toEqual([["genui-0", false], ["genui-1", false]]);
  });
});
