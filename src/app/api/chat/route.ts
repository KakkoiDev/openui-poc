import { createChatAgent } from "@/agent";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Send a valid JSON request." }, { status: 400 });
  }
  if (!Array.isArray(payload?.messages) || !payload.messages.length ||
      payload.messages.some((message: { type?: string; content?: unknown } | null) =>
        !message || !["human", "ai"].includes(message.type ?? "") || typeof message.content !== "string")) {
    return Response.json({ error: "Send a non-empty messages array with human or ai text messages." }, { status: 400 });
  }
  try {
    const stream = await createChatAgent().stream(
      { messages: payload.messages },
      { streamMode: "messages", encoding: "text/event-stream", signal: request.signal },
    );
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch {
    return Response.json({ error: "Could not start Claude. Check that the Claude Code CLI is logged in." }, { status: 502 });
  }
}
