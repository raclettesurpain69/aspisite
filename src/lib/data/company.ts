import { createClient } from "@/lib/supabase/server";

export type CurrentUserCompany = {
  id: string;
  name: string;
  planCode: string;
  subscriptionStatus: string;
  role: string;
  fullName: string | null;
};

/**
 * Entreprise de l'utilisateur connecte, via RLS (aucune verification
 * manuelle de company_id necessaire : les requetes ne peuvent de toute
 * facon renvoyer que ses propres donnees). Retourne `null` si la session
 * est absente ou si l'onboarding (creation d'entreprise) n'est pas encore
 * termine.
 */
export async function getCurrentUserCompany(): Promise<CurrentUserCompany | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("company_id, role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) return null;

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, plan_code, subscription_status")
    .eq("id", profile.company_id)
    .single();

  if (!company) return null;

  return {
    id: company.id,
    name: company.name,
    planCode: company.plan_code,
    subscriptionStatus: company.subscription_status,
    role: profile.role,
    fullName: profile.full_name,
  };
}
