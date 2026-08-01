import { createServiceRoleClient } from "@/lib/supabase/server";
import type { CompanyAIContext } from "@/lib/ai/types";

const DEFAULT_GREETING =
  "Bonjour, je suis l'assistant telephonique de l'entreprise. Je vais recueillir quelques informations afin qu'ils puissent vous rappeler rapidement.";

/**
 * Contexte IA d'une entreprise (message d'accueil, questions specifiques
 * au metier) utilise pour personnaliser la conversation. Lu via le
 * service role car ce contexte est recupere depuis un webhook Twilio, sans
 * session utilisateur.
 */
export async function getCompanyAIContext(
  companyId: string,
  companyName: string,
  businessType: string | null
): Promise<CompanyAIContext> {
  const supabase = createServiceRoleClient();

  const { data: settings } = await supabase
    .from("settings")
    .select("greeting_message, custom_questions")
    .eq("company_id", companyId)
    .maybeSingle();

  return {
    companyName,
    businessType: businessType ?? "generaliste",
    greeting: settings?.greeting_message?.trim() || `Bonjour, vous etes bien chez ${companyName}. ${DEFAULT_GREETING}`,
    customQuestions: (settings?.custom_questions as string[] | null) ?? [],
  };
}

/**
 * Indique si le Mode Test est actif pour cette entreprise (parametres).
 * Requete separee et volontairement minimaliste (une seule colonne) pour
 * ne pas coupler CompanyAIContext, partage avec AIProvider, a une
 * preoccupation d'observabilite.
 */
export async function isTestModeEnabled(companyId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { data } = await supabase
    .from("settings")
    .select("test_mode")
    .eq("company_id", companyId)
    .maybeSingle();

  return data?.test_mode ?? false;
}
