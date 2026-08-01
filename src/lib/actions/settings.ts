"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Active/desactive le Mode Test pour l'entreprise de l'utilisateur
 * connecte. Passe par le client "utilisateur" (pas service_role) : la
 * policy RLS `settings_all_own_company` autorise deja tout membre de
 * l'entreprise a modifier ses parametres.
 */
export async function setTestModeAction(enabled: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifie." };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return { error: "Aucune entreprise associee a ce compte." };
  }

  const { error } = await supabase
    .from("settings")
    .update({ test_mode: enabled })
    .eq("company_id", profile.company_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return {};
}
