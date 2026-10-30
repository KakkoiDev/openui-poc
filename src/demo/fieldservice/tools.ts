import type { z } from "zod";
import type { DemoData, DemoDb, Job } from "./db";
import { DEMO_TOOLS, type DemoToolName } from "./descriptors";

export type ToolResponse = { status: 200; body: unknown } | { status: 400 | 404; body: { error: string } };

type Args<N extends DemoToolName> = z.infer<(typeof DEMO_TOOLS)[N]["input"]>;

const notFound = (error: string): ToolResponse => ({ status: 404, body: { error } });

function withCustomer(data: DemoData, job: Job) {
  return { ...job, customerName: data.customers.find((c) => c.id === job.customerId)?.name ?? "" };
}

const handlers: { [N in DemoToolName]: (db: DemoDb, args: Args<N>) => Promise<ToolResponse> } = {
  async list_jobs(db, { status, month, assignee }) {
    const data = await db.read();
    const rows = data.jobs
      .filter((j) => (!status || j.status === status) && (!month || j.scheduledAt.startsWith(month)) && (!assignee || j.assignee === assignee))
      .map((j) => withCustomer(data, j));
    return { status: 200, body: rows };
  },

  async sales_summary(db, { from, to, groupBy }) {
    const totals = new Map<string, number>();
    for (const j of (await db.read()).jobs) {
      const m = j.scheduledAt.slice(0, 7);
      if (m < from || m > to) continue;
      const key = groupBy === "month" ? m : j[groupBy];
      totals.set(key, (totals.get(key) ?? 0) + j.amountJpy);
    }
    const labels = [...totals.keys()].sort();
    return { status: 200, body: { labels, amountsJpy: labels.map((l) => totals.get(l)!) } };
  },

  async list_invoices(db, { paid, month }) {
    const data = await db.read();
    const rows = data.invoices
      .filter((i) => (paid === undefined || i.paid === paid) && (!month || i.issuedAt.startsWith(month)))
      .map((i) => {
        const job = data.jobs.find((j) => j.id === i.jobId);
        return { ...i, jobTitle: job?.title ?? "", customerName: job ? withCustomer(data, job).customerName : "" };
      });
    return { status: 200, body: rows };
  },

  create_followup_task: (db, { jobId, title, due }) => db.update((data): ToolResponse => {
    if (!data.jobs.some((j) => j.id === jobId)) return notFound(`unknown job ${jobId}`);
    const next = Math.max(0, ...data.tasks.map((t) => Number(t.id.slice(1)))) + 1;
    const task = { id: `T${String(next).padStart(3, "0")}`, jobId, title, due, done: false };
    data.tasks.push(task);
    return { status: 200, body: task };
  }),

  update_job_status: (db, { jobId, status }) => db.update((data): ToolResponse => {
    const job = data.jobs.find((j) => j.id === jobId);
    if (!job) return notFound(`unknown job ${jobId}`);
    job.status = status;
    return { status: 200, body: withCustomer(data, job) };
  }),
};

export async function runDemoTool(db: DemoDb, name: string, rawArgs: unknown): Promise<ToolResponse> {
  if (!Object.hasOwn(DEMO_TOOLS, name)) return notFound(`unknown tool ${name}`);
  const tool = name as DemoToolName;
  const parsed = DEMO_TOOLS[tool].input.safeParse(rawArgs ?? {});
  if (!parsed.success) return { status: 400, body: { error: parsed.error.message } };
  return (handlers[tool] as (db: DemoDb, args: unknown) => Promise<ToolResponse>)(db, parsed.data);
}
