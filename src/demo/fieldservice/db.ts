import { copyFile, readFile, rename, writeFile } from "node:fs/promises";

export type Customer = { id: string; name: string; prefecture: string; city: string; phone: string };
export type Job = { id: string; customerId: string; title: string; status: string; assignee: string; scheduledAt: string; amountJpy: number };
export type Invoice = { id: string; jobId: string; issuedAt: string; amountJpy: number; taxJpy: number; paid: boolean };
export type Task = { id: string; jobId: string; title: string; due: string; done: boolean };
export type DemoData = { customers: Customer[]; jobs: Job[]; invoices: Invoice[]; tasks: Task[] };

export type DemoDb = ReturnType<typeof openDb>;

export function openDb(file: string, seedFile: string) {
  let queue: Promise<unknown> = Promise.resolve();

  async function load(): Promise<DemoData> {
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      await copyFile(seedFile, file);
      return JSON.parse(await readFile(file, "utf8"));
    }
  }

  function serialize<T>(fn: () => Promise<T>): Promise<T> {
    const run = queue.then(fn);
    queue = run.catch(() => {});
    return run;
  }

  return {
    read: () => serialize(load),
    update: <T>(fn: (data: DemoData) => T) => serialize(async () => {
      const data = await load();
      const result = fn(data);
      const tmp = `${file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(data, null, 2) + "\n");
      await rename(tmp, file);
      return result;
    }),
  };
}
