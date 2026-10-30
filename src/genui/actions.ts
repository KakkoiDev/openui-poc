import type { SendMessageOptions } from "@meetsmore-oss/use-ai-client";
import { type ActionEvent, BuiltinActionType } from "@openuidev/lang-core";

type SendMessage = (message: string, options?: SendMessageOptions) => Promise<void>;

export function createActionHandler(sendMessage: SendMessage, isStreaming: boolean) {
  return (event: ActionEvent) => {
    if (event.type === BuiltinActionType.ContinueConversation) {
      if (isStreaming) return;
      void sendMessage(event.humanFriendlyMessage, {
        hiddenText: JSON.stringify({ form: event.formName, values: event.formState }),
      });
      return;
    }
    // open_url is dropped: the POC opens no model-supplied links.
    console.warn("genui: ignored action", event.type);
  };
}
