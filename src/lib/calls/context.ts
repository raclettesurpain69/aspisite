import { createServiceRoleClient } from "@/lib/supabase/server";
import { DEFAULT_GREETING_TEMPLATE, renderGreeting } from "@/lib/ai/greeting";
import { evaluateBusinessHours, resolveBusinessHours } from "@/lib/calls/business-hours";
import type {
  AssistantQuestion,
  AssistantTone,
  CallGoal,
  CompanyAIContext,
  FAQEntry,
} from "@/lib/ai/types";

const DEFAULT_QUESTIONS: AssistantQuestion[] = [
  { id: "name", label: "Nom", required: true, enabled: true },
  { id: "phone", label: "Telephone", required: true, enabled: true },
  { id: "address", label: "Adresse", required: false, enabled: true },
  { id: "email", label: "Email", required: false, enabled: true },
  { id: "reason", label: "Motif de la demande", required: true, enabled: true },
  { id: "availability", label: "Disponibilites", required: false, enabled: true },
];

/**
 * Assemble la configuration complete de l'assistant IA d'une entreprise
 * (identite, ton, langue, questions, objectifs, horaires, FAQ) en un seul
 * appel. C'est cette fonction qui permet a deux entreprises d'avoir deux
 * assistants completement differents : tout ce que consomme
 * src/lib/ai/prompt-builder.ts vient d'ici, jamais d'un prompt ecrit a la
 * main. Utilise le service role car appelee depuis des webhooks Twilio
 * sans session utilisateur (et depuis le mode simulation, cote serveur).
 */
export async function getCompanyAIContext(companyId: string): Promise<CompanyAIContext> {
  const supabase = createServiceRoleClient();

  const [{ data: company }, { data: settings }, { data: faqRows }] = await Promise.all([
    supabase
      .from("companies")
      .select("name, business_type, business_hours, timezone")
      .eq("id", companyId)
      .maybeSingle(),
    supabase
      .from("settings")
      .select("greeting_message, tone, language, assistant_questions, call_goals")
      .eq("company_id", companyId)
      .maybeSingle(),
    supabase
      .from("faq_entries")
      .select("question, answer")
      .eq("company_id", companyId)
      .eq("is_enabled", true)
      .order("display_order"),
  ]);

  const companyName = company?.name ?? "l'entreprise";
  const businessHours = resolveBusinessHours(company?.business_hours);
  const timezone = company?.timezone ?? "Europe/Paris";
  const { isOpen, vacationMessage } = evaluateBusinessHours(businessHours, timezone);

  const greetingTemplate = settings?.greeting_message?.trim() || DEFAULT_GREETING_TEMPLATE;

  return {
    companyName,
    businessType: company?.business_type ?? "generaliste",
    greeting: renderGreeting(greetingTemplate, companyName),
    tone: (settings?.tone as AssistantTone) ?? "professionnel",
    language: settings?.language ?? "fr",
    questions: (settings?.assistant_questions as AssistantQuestion[] | null) ?? DEFAULT_QUESTIONS,
    callGoals: (settings?.call_goals as CallGoal[] | null) ?? ["prise_message"],
    faq: (faqRows as FAQEntry[] | null) ?? [],
    isCurrentlyOpen: isOpen,
    vacationMessage,
    extraInstructions: [],
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
