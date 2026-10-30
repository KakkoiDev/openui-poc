import { defineTool, z } from "@meetsmore-oss/use-ai-client";
import { createParser, type Library } from "@openuidev/lang-core";

export type RenderResult = { success: true; message: string } | { success: false; errors: string[] };

export function validateProgram(library: Library, program: string): RenderResult {
  const result = createParser(library.toJSONSchema(), library.root).parse(program);
  const errors = [
    ...result.meta.errors.map((e) => `${e.component}: ${e.message}`),
    ...result.meta.unresolved.map((ref) => `${ref}: referenced but never defined`),
  ];
  if (!result.root && !errors.length) errors.push("root: no root statement found");
  if (errors.length) return { success: false, errors };
  return { success: true, message: "Rendered. Now write one short closing sentence for the user." };
}

export function createRenderUITool(library: Library) {
  return defineTool(
    "Render generated UI. `program` is an OpenUI Lang program. Follow the system prompt rules.",
    z.object({ program: z.string() }),
    ({ program }) => validateProgram(library, program),
  );
}
