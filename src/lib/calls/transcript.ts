import type { ConversationMessage } from "@/lib/ai/types";
import type { Json } from "@/types/database";

export function buildTranscriptText(conversation: ConversationMessage[]): string {
  return conversation
    .map((turn) => `${turn.role === "assistant" ? "Assistant" : "Client"} : ${turn.content}`)
    .join("\n\n");
}

/**
 * `ConversationMessage` n'a pas de signature d'index, donc TypeScript ne le
 * considere pas structurellement comme du `Json` meme si son contenu l'est
 * a l'execution. Cast centralise ici plutot que reproduit a chaque appel.
 */
export function conversationToJson(conversation: ConversationMessage[]): Json {
  return conversation as unknown as Json;
}
