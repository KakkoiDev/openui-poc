// @vitest-environment node
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { openDb } from "./db";
import { DEMO_TOOLS, demoToolSpecs } from "./descriptors";
import { runDemoTool } from "./tools";

const seed = path.join(__dirname, "../../../data/demo-seed.json");

function freshDb() {
  const file = path.join(mkdtempSync(path.join(tmpdir(), "demo-db-")), "db.json");
  return { file, db: openDb(file, seed) };
}

describe("demo field-service tools", () => {
  it("describes every tool to the prompt with JSON schemas", () => {
    const specs = demoToolSpecs();
    expect(specs.map((s) => s.name)).toEqual(Object.keys(DEMO_TOOLS));
    expect(specs.find((s) => s.name === "list_jobs")?.inputSchema).toMatchObject({ type: "object", properties: { status: {}, month: {}, assignee: {} } });
    expect(specs.find((s) => s.name === "update_job_status")?.annotations).toEqual({ destructiveHint: true });
  });

  it.each([
    ["list_jobs", { status: "done" }],
    ["list_jobs", { month: "2026/10" }],
    ["sales_summary", { from: "2026-05", to: "2026-10", groupBy: "customer" }],
    ["list_invoices", { paid: "yes" }],
    ["create_followup_task", { jobId: "J001", title: "", due: "2026-11-01" }],
    ["update_job_status", { jobId: "J001" }],
  ])("%s rejects bad args %j", async (name, args) => {
    const res = await runDemoTool(freshDb().db, name, args);
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown tool", async () => {
    expect((await runDemoTool(freshDb().db, "drop_tables", {})).status).toBe(404);
  });

  it("list_jobs filters and joins the customer name", async () => {
    const res = await runDemoTool(freshDb().db, "list_jobs", { status: "invoiced", month: "2026-05" });
    const rows = res.body as { status: string; scheduledAt: string; customerName: string; amountJpy: number }[];
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.status).toBe("invoiced");
      expect(r.scheduledAt.startsWith("2026-05")).toBe(true);
      expect(r.customerName).toEqual(expect.any(String));
      expect(r.amountJpy).toEqual(expect.any(Number));
    }
  });

  it("sales_summary returns chart-ready labels and totals", async () => {
    const { db } = freshDb();
    const res = await runDemoTool(db, "sales_summary", { from: "2026-05", to: "2026-10", groupBy: "month" });
    const body = res.body as { labels: string[]; amountsJpy: number[] };
    expect(body.labels).toEqual(["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
    const jobs = (await runDemoTool(db, "list_jobs", {})).body as { amountJpy: number }[];
    expect(body.amountsJpy.reduce((a, b) => a + b, 0)).toBe(jobs.reduce((a, j) => a + j.amountJpy, 0));
  });

  it("list_invoices filters by paid and joins job and customer", async () => {
    const rows = (await runDemoTool(freshDb().db, "list_invoices", { paid: false })).body as { paid: boolean; jobTitle: string; customerName: string }[];
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(r).toMatchObject({ paid: false, jobTitle: expect.any(String), customerName: expect.any(String) });
  });

  it("mutations persist across a fresh db load", async () => {
    const { db, file } = freshDb();
    const task = (await runDemoTool(db, "create_followup_task", { jobId: "J002", title: "再訪問", due: "2026-11-20" })).body as { id: string };
    await runDemoTool(db, "update_job_status", { jobId: "J002", status: "completed" });
    const reloaded = openDb(file, seed);
    const data = await reloaded.read();
    expect(data.tasks.find((t) => t.id === task.id)).toMatchObject({ jobId: "J002", title: "再訪問", done: false });
    expect(data.jobs.find((j) => j.id === "J002")?.status).toBe("completed");
  });

  it("mutations on an unknown job return 404 and write nothing", async () => {
    const { db } = freshDb();
    expect((await runDemoTool(db, "update_job_status", { jobId: "J999", status: "completed" })).status).toBe(404);
    expect((await runDemoTool(db, "create_followup_task", { jobId: "J999", title: "x", due: "2026-11-20" })).status).toBe(404);
    expect((await db.read()).tasks).toHaveLength(5);
  });

  it("serializes concurrent writes", async () => {
    const { db, file } = freshDb();
    await Promise.all(Array.from({ length: 10 }, (_, i) =>
      runDemoTool(db, "create_followup_task", { jobId: "J003", title: `t${i}`, due: "2026-11-20" })));
    expect((await openDb(file, seed).read()).tasks).toHaveLength(15);
  });
});
