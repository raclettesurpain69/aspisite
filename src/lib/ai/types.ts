export type ConversationRole = "assistant" | "customer";

export interface ConversationMessage {
  role: ConversationRole;
  content: string;
}

export type UrgencyLevel = "low" | "normal" | "high" | "critical";

/**
 * Champs collectes pendant l'appel. `extraFields` porte les questions
 * specifiques au metier (fuite ? tableau electrique ? marque du materiel ?
 * ...), configurees par entreprise (table `settings`, etape 2).
 */
export interface CallSummary {
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  reason: string | null;
  problemDescription: string | null;
  urgency: UrgencyLevel;
  availability: string | null;
  additionalInfo: string | null;
  extraFields: Record<string, string>;
  recommendedAction: string;
  summaryText: string;
}

/**
 * Configuration IA propre a une entreprise (table `settings`, etape 2):
 * message d'accueil, secteur d'activite, questions personnalisees.
 */
export interface CompanyAIContext {
  companyName: string;
  businessType: string;
  greeting: string;
  customQuestions: string[];
}

export interface AIProvider {
  /** Genere la prochaine reponse de l'assistant dans la conversation en cours. */
  generateResponse(
    history: ConversationMessage[],
    context: CompanyAIContext
  ): Promise<string>;

  /** Analyse la conversation complete et produit le resume structure. */
  summarizeCall(
    history: ConversationMessage[],
    context: CompanyAIContext
  ): Promise<CallSummary>;
}
