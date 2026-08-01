import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Verifie si une entreprise a atteint son quota d'appels du mois en cours
 * (subscription_plans.max_calls_per_month). Appele avant de repondre a un
 * nouvel appel entrant : au-dela du quota, l'appel est poliment refuse
 * plutot que de laisser l'IA repondre indefiniment sans limite de cout.
 */
export async function hasReachedMonthlyCallLimit(companyId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const [{ data: usage }, { data: limits }] = await Promise.all([
    supabase.rpc("get_company_usage", { p_company_id: companyId }).maybeSingle(),
    supabase
      .from("company_plan_limits")
      .select("max_calls_per_month")
      .eq("company_id", companyId)
      .maybeSingle(),
  ]);

  if (!usage || !limits || limits.max_calls_per_month === null) return false;

  return usage.calls_this_period >= limits.max_calls_per_month;
}
