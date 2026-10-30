"use client";
import "@openuidev/react-ui/styles/index.css";

import { UseAIChat, UseAIProvider, useAI } from "@meetsmore-oss/use-ai-client";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { demoToolProvider } from "@/demo/fieldservice/toolProvider";
import { createGenUI, RENDER_UI_TOOL } from "@/genui";

const { renderUITool, GenUIMessage } = createGenUI({ library: openuiLibrary, toolProvider: demoToolProvider });

function Chat() {
  useAI({ tools: { [RENDER_UI_TOOL]: renderUITool } });
  return <UseAIChat components={{ Message: GenUIMessage }} />;
}

export default function GenUIChat() {
  return (
    <UseAIProvider serverUrl={process.env.NEXT_PUBLIC_USE_AI_URL ?? "ws://localhost:8081"} renderChat={false}>
      <Chat />
    </UseAIProvider>
  );
}
