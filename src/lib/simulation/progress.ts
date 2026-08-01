import type { ConversationMessage } from "@/lib/ai/types";

export type CollectedFieldId =
  | "name"
  | "phone"
  | "email"
  | "address"
  | "reason"
  | "urgency"
  | "availability";

export const COLLECTED_FIELD_LABELS: Record<CollectedFieldId, string> = {
  name: "Nom",
  phone: "Telephone",
  email: "Email",
  address: "Adresse",
  reason: "Motif",
  urgency: "Urgence",
  availability: "Disponibilite",
};

const PATTERNS: Record<CollectedFieldId, RegExp> = {
  name: /\b(je m'appelle|mon nom est|c'est)\s+[A-ZÀ-Ý][a-zà-ÿ]+/i,
  phone: /(\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/,
  email: /[\w.+-]+@[\w-]+\.[a-z]{2,}/i,
  address: /\b(rue|avenue|boulevard|impasse|chemin|route|place|allee)\b/i,
  reason: /\b(fuite|panne|devis|rendez-vous|installation|entretien|reparation|probleme|urgence)\b/i,
  urgency: /\b(urgent|urgence|rapidement|vite|immediat|des que possible|maintenant|tout de suite)\b/i,
  availability: /\b(demain|aujourd'hui|matin|apres-midi|soir|semaine|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|disponible)\b/i,
};

/**
 * Estimation heuristique (mots-cles), affichee en temps reel pendant la
 * simulation pour visualiser la progression de la collecte. Purement
 * indicative : l'extraction faisant foi reste celle de Claude a la
 * finalisation (CallSummary), plus fiable mais disponible seulement en
 * fin d'appel.
 */
export function estimateCollectedFields(
  conversation: ConversationMessage[]
): Record<CollectedFieldId, boolean> {
  const customerText = conversation
    .filter((turn) => turn.role === "customer")
    .map((turn) => turn.content)
    .join(" ");

  const result = {} as Record<CollectedFieldId, boolean>;
  for (const field of Object.keys(PATTERNS) as CollectedFieldId[]) {
    result[field] = PATTERNS[field].test(customerText);
  }
  return result;
}
