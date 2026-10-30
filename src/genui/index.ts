import type { Library } from "@openuidev/react-lang";
import type { ComponentProps } from "react";
import type { Renderer } from "@openuidev/react-lang";
import { createGenUIMessage } from "./GenUIMessage";
import { createRenderUITool } from "./renderUITool";

export { RENDER_UI_TOOL } from "./server";

export function createGenUI({ library, toolProvider }: {
  library: Library;
  toolProvider?: ComponentProps<typeof Renderer>["toolProvider"];
}) {
  return {
    renderUITool: createRenderUITool(library),
    GenUIMessage: createGenUIMessage(library, toolProvider),
  };
}
