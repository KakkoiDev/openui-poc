"use client";
import { type ChatMessageSlotProps, useAIContext } from "@meetsmore-oss/use-ai-client";
import { type Library, Renderer } from "@openuidev/react-lang";
import { Allow, parse } from "partial-json";
import type { ComponentProps, ComponentType } from "react";
import { createActionHandler } from "./actions";
import { RENDER_UI_TOOL } from "./server";

type ToolProvider = ComponentProps<typeof Renderer>["toolProvider"];

export type RenderCall = { key: string; program: string | null; isStreaming: boolean };

function readProgram(args: string): string | null {
  try {
    const program = parse(args, Allow.ALL)?.program;
    return typeof program === "string" && program ? program : null;
  } catch {
    return null;
  }
}

export function extractRenderCalls(
  props: Pick<ChatMessageSlotProps, "message" | "streaming" | "streamingParts" | "sourceMessages">,
): RenderCall[] {
  if (props.message.role !== "assistant") return [];
  const args = props.streaming
    ? props.streamingParts.flatMap((p) => (p.kind === "tool_call" && p.name === RENDER_UI_TOOL ? [p.args] : []))
    : props.sourceMessages.flatMap((m) =>
        (m.toolCalls ?? []).filter((c) => c.function.name === RENDER_UI_TOOL).map((c) => c.function.arguments));
  return args.map((a, i) => ({
    key: `genui-${i}`,
    program: readProgram(a),
    isStreaming: props.streaming && i === args.length - 1,
  }));
}

export function createGenUIMessage(library: Library, toolProvider?: ToolProvider): ComponentType<ChatMessageSlotProps> {
  return function GenUIMessage(props) {
    const { chat } = useAIContext();
    const calls = extractRenderCalls(props);
    return (
      <>
        {props.children}
        {calls.map((call) => call.program && (
          <section key={call.key} aria-label="AI-generated UI" className="genui-frame">
            <div className="genui-label">AI-generated UI</div>
            <Renderer
              response={call.program}
              library={library}
              isStreaming={call.isStreaming}
              onAction={createActionHandler(chat.sendMessage, call.isStreaming)}
              toolProvider={toolProvider}
              onError={(errors) => errors.length > 0 && console.warn("genui: render errors", errors)}
            />
          </section>
        ))}
      </>
    );
  };
}
