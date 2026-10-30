import path from "node:path";
import { openDb } from "@/demo/fieldservice/db";
import { runDemoTool } from "@/demo/fieldservice/tools";

const db = openDb(path.join(process.cwd(), "data/demo-db.json"), path.join(process.cwd(), "data/demo-seed.json"));

export async function POST(req: Request, ctx: { params: Promise<{ tool: string }> }) {
  const { tool } = await ctx.params;
  let args: unknown;
  try {
    args = await req.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  const res = await runDemoTool(db, tool, args);
  return Response.json(res.body, { status: res.status });
}
