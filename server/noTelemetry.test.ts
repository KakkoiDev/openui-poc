// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

describe("noTelemetry", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("clears tracing keys and opts out of OpenUI and Next telemetry", async () => {
    vi.stubEnv("LANGFUSE_PUBLIC_KEY", "pk");
    vi.stubEnv("LANGFUSE_SECRET_KEY", "sk");
    vi.stubEnv("LANGFUSE_BASE_URL", "https://example.invalid");
    vi.stubEnv("OPENUI_RUNTIME_TELEMETRY_ENABLED", "1");
    await import("./noTelemetry");
    expect(Object.keys(process.env).filter((k) => k.startsWith("LANGFUSE_"))).toEqual([]);
    expect(process.env.OPENUI_RUNTIME_TELEMETRY_ENABLED).toBeUndefined();
    expect(process.env.OPENUI_TELEMETRY_DISABLED).toBe("1");
    expect(process.env.NEXT_TELEMETRY_DISABLED).toBe("1");
  });
});
