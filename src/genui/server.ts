import { generateSystemPrompt, type LibrarySpec, type PromptOptions, type ToolSpec } from "@openuidev/lang-core";

export const RENDER_UI_TOOL = "render_ui";

export const CHANNEL_RULES = [
  `To show UI, call \`${RENDER_UI_TOOL}\` with the OpenUI Lang program in \`program\`. Never write OpenUI Lang in plain text.`,
  `Before calling \`${RENDER_UI_TOOL}\`, write one short sentence saying what you are about to show.`,
  `After \`${RENDER_UI_TOOL}\` returns, always write one short closing sentence. Never end your answer with a tool call.`,
  `If \`${RENDER_UI_TOOL}\` returns \`success: false\`, fix the listed errors and call it once more. Do not retry more than once.`,
  "For the demo field-service data (jobs, customers, invoices, tasks), use `Query` with the listed data tools. Use `Mutation` only behind a button (`@Run`), never on render. For other topics, put data inline in the program and label it as sample data.",
  "Do not use image components unless the user gave the image URL.",
];

type Spec = LibrarySpec & { promptOptions?: PromptOptions };

export function buildGenUISystemPrompt(spec: Spec, opts: { tools?: ToolSpec[] } = {}) {
  const { promptOptions, ...library } = spec;
  return generateSystemPrompt({ library, promptOptions: { ...promptOptions, tools: opts.tools } }) +
    "\n\n" + CHANNEL_RULES.join("\n");
}
