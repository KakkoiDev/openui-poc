import type { ToolSpec } from "@openuidev/lang-core";
import { z } from "zod";

export const JOB_STATUSES = ["inquiry", "estimated", "scheduled", "in_progress", "completed", "invoiced"] as const;

const month = z.string().regex(/^\d{4}-\d{2}$/).describe("YYYY-MM");
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("YYYY-MM-DD");
const status = z.enum(JOB_STATUSES);

const jobRow = {
  type: "object",
  properties: {
    id: { type: "string" }, title: { type: "string" }, status: { type: "string" }, assignee: { type: "string" },
    scheduledAt: { type: "string" }, amountJpy: { type: "number" }, customerId: { type: "string" }, customerName: { type: "string" },
  },
};

type Descriptor = {
  description: string;
  input: z.ZodObject;
  output: Record<string, unknown>;
  mutation?: true;
};

export const DEMO_TOOLS = {
  list_jobs: {
    description: "List demo field-service jobs, optionally filtered by status, scheduled month and assignee.",
    input: z.object({ status: status.optional(), month: month.optional(), assignee: z.string().optional() }),
    output: { type: "array", items: jobRow },
  },
  sales_summary: {
    description: "Total job amounts (JPY) between two months inclusive, grouped by month, assignee or status. Chart-ready.",
    input: z.object({ from: month, to: month, groupBy: z.enum(["month", "assignee", "status"]) }),
    output: { type: "object", properties: { labels: { type: "array", items: { type: "string" } }, amountsJpy: { type: "array", items: { type: "number" } } } },
  },
  list_invoices: {
    description: "List demo invoices, optionally filtered by paid state and issue month, with job title and customer name.",
    input: z.object({ paid: z.boolean().optional(), month: month.optional() }),
    output: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" }, jobId: { type: "string" }, issuedAt: { type: "string" }, amountJpy: { type: "number" },
          taxJpy: { type: "number" }, paid: { type: "boolean" }, jobTitle: { type: "string" }, customerName: { type: "string" },
        },
      },
    },
  },
  create_followup_task: {
    description: "Create a follow-up task on a job. Mutation: only behind a button.",
    input: z.object({ jobId: z.string(), title: z.string().min(1), due: day }),
    output: { type: "object", properties: { id: { type: "string" }, jobId: { type: "string" }, title: { type: "string" }, due: { type: "string" }, done: { type: "boolean" } } },
    mutation: true,
  },
  update_job_status: {
    description: "Change a job's status. Mutation: only behind a button.",
    input: z.object({ jobId: z.string(), status }),
    output: jobRow,
    mutation: true,
  },
} satisfies Record<string, Descriptor>;

export type DemoToolName = keyof typeof DEMO_TOOLS;

export function demoToolSpecs(): ToolSpec[] {
  return Object.entries(DEMO_TOOLS).map(([name, d]: [string, Descriptor]) => ({
    name,
    description: d.description,
    inputSchema: z.toJSONSchema(d.input),
    outputSchema: d.output,
    annotations: d.mutation ? { destructiveHint: true } : { readOnlyHint: true },
  }));
}
