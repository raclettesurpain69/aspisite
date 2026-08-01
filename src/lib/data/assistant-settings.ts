import { createClient } from "@/lib/supabase/server";
import { DEFAULT_BUSINESS_HOURS, resolveBusinessHours, type BusinessHours } from "@/lib/calls/business-hours";
import { DEFAULT_GREETING_TEMPLATE } from "@/lib/ai/greeting";
import type { AssistantQuestion, AssistantTone, CallGoal } from "@/lib/ai/types";

const DEFAULT_QUESTIONS: AssistantQuestion[] = [
  { id: "name", label: "Nom", required: true, enabled: true },
  { id: "phone", label: "Telephone", required: true, enabled: true },
  { id: "address", label: "Adresse", required: false, enabled: true },
  { id: "email", label: "Email", required: false, enabled: true },
  { id: "reason", label: "Nature de la panne", required: true, enabled: true },
  { id: "availability", label: "Disponibilites", required: false, enabled: true },
];

export type AssistantFaqEntry = {
  id: string;
  question: string;
  answer: string;
  isEnabled: boolean;
  displayOrder: number;
};

export type AssistantSettingsData = {
  companyName: string;
  businessType: string;
  tone: AssistantTone;
  language: string;
  greetingMessage: string;
  questions: AssistantQuestion[];
  callGoals: CallGoal[];
  businessHours: BusinessHours;
  timezone: string;
  faq: AssistantFaqEntry[];
};

/**
 * Toutes les donnees necessaires a la page Parametres > Assistant IA, pour
 * les 6 onglets. Contrairement a getCompanyAIContext() (qui ne renvoie que
 * ce qui sert au prompt, deja rendu/resolu), ici on renvoie les valeurs
 * brutes editables (template d'accueil non rendu, entrees FAQ avec id...).
 * Passe par le client RLS (session utilisateur), pas le service role.
 */
export async function getAssistantSettings(companyId: string): Promise<AssistantSettingsData> {
  const supabase = await createClient();

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
      .select("id, question, answer, is_enabled, display_order")
      .eq("company_id", companyId)
      .order("display_order"),
  ]);

  return {
    companyName: company?.name ?? "",
    businessType: company?.business_type ?? "Autre",
    tone: (settings?.tone as AssistantTone) ?? "professionnel",
    language: settings?.language ?? "fr",
    greetingMessage: settings?.greeting_message?.trim() || DEFAULT_GREETING_TEMPLATE,
    questions: (settings?.assistant_questions as AssistantQuestion[] | null) ?? DEFAULT_QUESTIONS,
    callGoals: (settings?.call_goals as CallGoal[] | null) ?? ["prise_message"],
    businessHours: resolveBusinessHours(company?.business_hours) ?? DEFAULT_BUSINESS_HOURS,
    timezone: company?.timezone ?? "Europe/Paris",
    faq: (faqRows ?? []).map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      isEnabled: row.is_enabled,
      displayOrder: row.display_order,
    })),
  };
}
