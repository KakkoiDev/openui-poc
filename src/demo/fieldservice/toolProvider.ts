import { DEMO_TOOLS } from "./descriptors";

async function callDemoTool(name: string, args: unknown) {
  const res = await fetch(`/api/demo/${name}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args ?? {}),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${name}: ${body.error ?? res.status}`);
  return body;
}

export const demoToolProvider = Object.fromEntries(
  Object.keys(DEMO_TOOLS).map((name) => [name, (args: Record<string, unknown>) => callDemoTool(name, args)]),
);
