import { env } from "@/lib/env";
import { ClaudeProvider } from "@/lib/ai/claude";
import type { AIProvider } from "@/lib/ai/types";

export type { AIProvider, CallSummary, CompanyAIContext, ConversationMessage } from "@/lib/ai/types";

/**
 * Point d'entree unique pour l'IA conversationnelle. Le reste de
 * l'application ne doit jamais importer ClaudeProvider directement: cela
 * permet de changer de fournisseur (ex: un autre modele) en ne modifiant
 * que ce fichier.
 */
export function getAIProvider(): AIProvider {
  return new ClaudeProvider(env.ANTHROPIC_API_KEY);
}
