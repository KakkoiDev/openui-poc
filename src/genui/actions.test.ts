import { BuiltinActionType } from "@openuidev/lang-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createActionHandler } from "./actions";

const submit = {
  type: BuiltinActionType.ContinueConversation,
  params: {},
  humanFriendlyMessage: "Plan it",
  formName: "offsite",
  formState: { budget: 5000, headcount: 12 },
};

describe("createActionHandler", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends the label with the form values as hidden text", () => {
    const send = vi.fn().mockResolvedValue(undefined);
    createActionHandler(send, false)(submit);
    expect(send).toHaveBeenCalledWith("Plan it", {
      hiddenText: JSON.stringify({ form: "offsite", values: { budget: 5000, headcount: 12 } }),
    });
  });

  it("ignores a submit while its UI is still streaming", () => {
    const send = vi.fn().mockResolvedValue(undefined);
    createActionHandler(send, true)(submit);
    expect(send).not.toHaveBeenCalled();
  });

  it("opens no window and sends nothing for open_url", () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    createActionHandler(send, false)({ type: BuiltinActionType.OpenUrl, params: { url: "javascript:alert(1)" }, humanFriendlyMessage: "Open" });
    expect(open).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
});
