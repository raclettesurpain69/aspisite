"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserCompany } from "@/lib/data/company";
import type { BusinessHours } from "@/lib/calls/business-hours";
import type { AssistantQuestion, AssistantTone, CallGoal } from "@/lib/ai/types";
import type { Json } from "@/types/database";
import { ASSISTANT_TONES, BUSINESS_TYPES, CALL_GOALS } from "@/lib/ai/assistant-options";

type ActionResult = { error?: string };

const VALID_TONES = new Set<AssistantTone>(ASSISTANT_TONES.map((t) => t.value));
const VALID_GOALS = new Set<CallGoal>(CALL_GOALS.map((g) => g.value));

function revalidateAssistantSettings() {
  revalidatePath("/settings/assistant");
  revalidatePath("/settings");
}

/**
 * Onglet "Informations generales" : nom, secteur, ton, langue. Le nom et le
 * secteur vivent sur `companies` (policy `companies_update_own_admin` :
 * reserve owner/admin), le ton et la langue sur `settings` (tout membre).
 */
export async function updateGeneralInfoAction(params: {
  companyName: string;
  businessType: string;
  tone: AssistantTone;
  language: string;
}): Promise<ActionResult> {
  const company = await getCurrentUserCompany();
  if (!company) {
    return { error: "Aucune entreprise associee a ce compte." };
  }

  const companyName = params.companyName.trim();
  if (!companyName) {
    return { error: "Le nom de l'entreprise ne peut pas etre vide." };
  }
  if (!BUSINESS_TYPES.includes(params.businessType as (typeof BUSINESS_TYPES)[number])) {
    return { error: "Secteur d'activite invalide." };
  }
  if (!VALID_TONES.has(params.tone)) {
    return { error: "Ton invalide." };
  }
  const language = params.language.trim() || "fr";

  const supabase = await createClient();

  const { error: companyError } = await supabase
    .from("companies")
    .update({ name: companyName, business_type: params.businessType })
    .eq("id", company.id);
  if (companyError) {
    return { error: companyError.message };
  }

  const { error: settingsError } = await supabase
    .from("settings")
    .update({ tone: params.tone, language })
    .eq("company_id", company.id);
  if (settingsError) {
    return { error: settingsError.message };
  }

  revalidateAssistantSettings();
  return {};
}

export async function updateGreetingAction(params: { greetingMessage: string }): Promise<ActionResult> {
  const company = await getCurrentUserCompany();
  if (!company) {
    return { error: "Aucune entreprise associee a ce compte." };
  }

  const greetingMessage = params.greetingMessage.trim();
  if (!greetingMessage) {
    return { error: "Le message d'accueil ne peut pas etre vide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({ greeting_message: greetingMessage })
    .eq("company_id", company.id);
  if (error) {
    return { error: error.message };
  }

  revalidateAssistantSettings();
  return {};
}

/**
 * Remplace integralement la liste des questions (ajout/suppression/reordre/
 * activation gerees cote client, on persiste le tableau final tel quel :
 * l'ordre du tableau EST l'ordre d'utilisation, voir CompanyAIContext).
 */
export async function updateQuestionsAction(params: {
  questions: AssistantQuestion[];
}): Promise<ActionResult> {
  const company = await getCurrentUserCompany();
  if (!company) {
    return { error: "Aucune entreprise associee a ce compte." };
  }

  for (const question of params.questions) {
    if (!question.label.trim()) {
      return { error: "Une question ne peut pas avoir un intitule vide." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({ assistant_questions: params.questions as unknown as Json })
    .eq("company_id", company.id);
  if (error) {
    return { error: error.message };
  }

  revalidateAssistantSettings();
  return {};
}

export async function updateCallGoalsAction(params: { callGoals: CallGoal[] }): Promise<ActionResult> {
  const company = await getCurrentUserCompany();
  if (!company) {
    return { error: "Aucune entreprise associee a ce compte." };
  }

  if (params.callGoals.length === 0) {
    return { error: "Selectionnez au moins un objectif d'appel." };
  }
  if (!params.callGoals.every((goal) => VALID_GOALS.has(goal))) {
    return { error: "Objectif d'appel invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({ call_goals: params.callGoals })
    .eq("company_id", company.id);
  if (error) {
    return { error: error.message };
  }

  revalidateAssistantSettings();
  return {};
}

export async function updateBusinessHoursAction(params: {
  businessHours: BusinessHours;
  timezone: string;
}): Promise<ActionResult> {
  const company = await getCurrentUserCompany();
  if (!company) {
    return { error: "Aucune entreprise associee a ce compte." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({ business_hours: params.businessHours as unknown as Json, timezone: params.timezone })
    .eq("id", company.id);
  if (error) {
    return { error: error.message };
  }

  revalidateAssistantSettings();
  return {};
}

/**
 * FAQ : synchronisation complete (delete + insert) plutot que des actions
 * CRUD granulaires separees, l'onglet etant une base de connaissances
 * simple editee comme un tout (ajout/suppression/reordre/activation en une
 * seule sauvegarde cote client).
 */
export async function replaceFaqEntriesAction(params: {
  entries: { question: string; answer: string; isEnabled: boolean }[];
}): Promise<ActionResult> {
  const company = await getCurrentUserCompany();
  if (!company) {
    return { error: "Aucune entreprise associee a ce compte." };
  }

  for (const entry of params.entries) {
    if (!entry.question.trim() || !entry.answer.trim()) {
      return { error: "Chaque entree FAQ doit avoir une question et une reponse." };
    }
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("faq_entries")
    .delete()
    .eq("company_id", company.id);
  if (deleteError) {
    return { error: deleteError.message };
  }

  if (params.entries.length > 0) {
    const { error: insertError } = await supabase.from("faq_entries").insert(
      params.entries.map((entry, index) => ({
        company_id: company.id,
        question: entry.question.trim(),
        answer: entry.answer.trim(),
        is_enabled: entry.isEnabled,
        display_order: index,
      }))
    );
    if (insertError) {
      return { error: insertError.message };
    }
  }

  revalidateAssistantSettings();
  return {};
}
