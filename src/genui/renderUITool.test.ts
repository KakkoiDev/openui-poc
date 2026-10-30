import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { describe, expect, it } from "vitest";
import { validateProgram } from "./renderUITool";

describe("validateProgram", () => {
  it("accepts a valid program", () => {
    const result = validateProgram(openuiLibrary, 'root = Stack([t])\nt = TextContent("hi")');
    expect(result).toEqual({ success: true, message: expect.any(String) });
  });

  it("rejects an unknown component", () => {
    const result = validateProgram(openuiLibrary, 'root = Stack([f])\nf = Foo("x")');
    expect(result.success).toBe(false);
    expect(!result.success && result.errors.join()).toContain("Foo");
  });

  it("rejects a missing required prop", () => {
    const result = validateProgram(openuiLibrary, "root = Stack([t])\nt = TextContent()");
    expect(result.success).toBe(false);
    expect(!result.success && result.errors.join()).toContain("TextContent");
  });

  it("rejects an unresolved reference", () => {
    const result = validateProgram(openuiLibrary, 'root = Stack([t, missing])\nt = TextContent("hi")');
    expect(result.success).toBe(false);
    expect(!result.success && result.errors.join()).toContain("missing");
  });

  it("rejects text with no program", () => {
    expect(validateProgram(openuiLibrary, "hello there").success).toBe(false);
  });
});
