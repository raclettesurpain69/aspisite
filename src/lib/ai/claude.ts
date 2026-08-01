import Anthropic from "@anthropic-ai/sdk";

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
    },
    required: ["urgency", "recommendedAction", "summaryText", "extraFields"],
  },
};

function buildSystemPrompt(context: CompanyAIContext) {
  const questions =
    context.customQuestions.length > 0
      ? `\nQuestions specifiques a ce metier (${context.businessType}) a poser si pertinent:\n${context.customQuestions
          .map((q) => `- ${q}`)
          .join("\n")}`
      : "";

  return `Tu es l'assistant telephonique de ${context.companyName}.
Tu recueillis les informations d'un client qui n'a pas pu joindre l'entreprise, afin qu'elle puisse le rappeler rapidement.

Consignes:
- Sois naturel et chaleureux, ne recite jamais un questionnaire rigide.
- Adapte tes questions au contexte de ce que le client raconte.
- Informations a obtenir au fil de la conversation: nom, prenom, numero de telephone, email (si le client le propose spontanement, ne l'exige jamais), adresse, ville, motif de l'appel, description du probleme, niveau d'urgence, disponibilites, informations complementaires.${questions}
- Reste concis: c'est une conversation telephonique, pas un ecrit.
- Ne termine la conversation que lorsque tu as recueilli l'essentiel ou que le client n'a plus rien a ajouter.`;
}

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
      system: `${buildSystemPrompt(context)}\n\nL'appel est termine. Extrait toutes les informations recueillies via l'outil record_call_summary.`,
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
