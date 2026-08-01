import Anthropic from "@anthropic-ai/sdk";

import { buildSystemPrompt } from "@/lib/ai/prompt-builder";
import type {
  AIProvider,
  CallSummary,
  CompanyAIContext,
  ConversationMessage,
} from "@/lib/ai/types";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

const SUMMARY_TOOL = {
  name: "record_call_summary",
  description: "Enregistre le resume structure d'un appel client.",
  input_schema: {
    type: "object" as const,
    properties: {
      firstName: { type: ["string", "null"] },
      lastName: { type: ["string", "null"] },
      phoneNumber: { type: ["string", "null"] },
      email: { type: ["string", "null"] },
      address: { type: ["string", "null"] },
      city: { type: ["string", "null"] },
      reason: { type: ["string", "null"] },
      problemDescription: { type: ["string", "null"] },
      urgency: { type: "string", enum: ["low", "normal", "high", "critical"] },
      availability: { type: ["string", "null"] },
      additionalInfo: { type: ["string", "null"] },
      extraFields: { type: "object", additionalProperties: { type: "string" } },
      recommendedAction: { type: "string" },
      summaryText: { type: "string" },
      qualificationScore: { type: "integer", minimum: 0, maximum: 100 },
      qualificationReason: { type: "string" },
    },
    required: [
      "urgency",
      "recommendedAction",
      "summaryText",
      "extraFields",
      "qualificationScore",
      "qualificationReason",
    ],
  },
};

function toAnthropicMessages(history: ConversationMessage[]) {
  return history.map((message) => ({
    role: message.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: message.content,
  }));
}

export class ClaudeProvider implements AIProvider {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateResponse(
    history: ConversationMessage[],
    context: CompanyAIContext
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 300,
      system: buildSystemPrompt(context),
      messages: toAnthropicMessages(history),
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock?.type === "text" ? textBlock.text : "";
  }

  async summarizeCall(
    history: ConversationMessage[],
    context: CompanyAIContext
  ): Promise<CallSummary> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: `${buildSystemPrompt(context)}\n\nL'appel est termine. Extrait toutes les informations recueillies via l'outil record_call_summary.
Attribue egalement un score de qualification du prospect entre 0 et 100 (qualificationScore), base sur :
- l'urgence du besoin (un besoin urgent qualifie mieux) ;
- la completude des informations recueillies (nom, telephone, adresse, motif) ;
- l'intention d'achat percue (demande precise et concrete vs simple curiosite) ;
- la disponibilite communiquee par le client.
Justifie ce score en une phrase courte (qualificationReason).`,
      messages: [
        ...toAnthropicMessages(history),
        { role: "user", content: "Enregistre le resume de cet appel maintenant." },
      ],
      tools: [SUMMARY_TOOL],
      tool_choice: { type: "tool", name: SUMMARY_TOOL.name },
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (toolUse?.type !== "tool_use") {
      throw new Error("Claude n'a pas retourne de resume structure.");
    }

    return toolUse.input as CallSummary;
  }
}
