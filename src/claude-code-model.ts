import type { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, AIMessageChunk, type BaseMessage } from "@langchain/core/messages";
import { ChatGenerationChunk, type ChatResult } from "@langchain/core/outputs";
import { type ModelMessage, streamText } from "ai";
import { claudeCode } from "ai-sdk-provider-claude-code";

// Local-test shim: runs each turn through the logged-in Claude Code CLI with its
// built-in tools, MCP servers, settings files, and session persistence turned off.
export class ClaudeCodeChatModel extends BaseChatModel {
  constructor(private readonly modelId: string) {
    super({});
  }

  _llmType() {
    return "claude-code";
  }

  bindTools(tools: unknown[]) {
    if (tools.length) throw new Error("ClaudeCodeChatModel does not support app tools.");
    return this;
  }

  async *_streamResponseChunks(
    messages: BaseMessage[],
    options: this["ParsedCallOptions"],
    runManager?: CallbackManagerForLLMRun,
  ): AsyncGenerator<ChatGenerationChunk> {
    const system = messages.filter((m) => m.type === "system").map((m) => m.text).join("\n");
    const history: ModelMessage[] = messages
      .filter((m) => m.type === "human" || m.type === "ai")
      .map((m) => ({ role: m.type === "human" ? "user" : "assistant", content: m.text }));
    const result = streamText({
      model: claudeCode(this.modelId, {
        tools: [],
        mcpServers: {},
        strictMcpConfig: true,
        settingSources: [],
        persistSession: false,
        permissionPrompts: "none",
        verbatimPrompts: true,
        includePartialMessages: true,
        thinking: { type: "disabled" },
        // An API key in the server env would take precedence over the CLI login.
        env: { ANTHROPIC_API_KEY: undefined },
      }),
      system,
      messages: history,
      abortSignal: options.signal,
    });
    for await (const part of result.stream) {
      if (part.type === "error") throw part.error;
      if (part.type !== "text-delta") continue;
      const chunk = new ChatGenerationChunk({ text: part.text, message: new AIMessageChunk({ content: part.text }) });
      yield chunk;
      await runManager?.handleLLMNewToken(part.text, undefined, undefined, undefined, undefined, { chunk });
    }
  }

  async _generate(messages: BaseMessage[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): Promise<ChatResult> {
    let text = "";
    for await (const chunk of this._streamResponseChunks(messages, options, runManager)) text += chunk.text;
    return { generations: [{ text, message: new AIMessage(text) }] };
  }
}
