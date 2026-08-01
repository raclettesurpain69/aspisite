import { createClient } from "@/lib/supabase/server";

export type RecentCall = {
  id: string;
  fromNumber: string;
  customerName: string | null;
  reason: string | null;
  urgency: string;
  durationSeconds: number | null;
  createdAt: string;
};

export type DashboardStats = {
  callsToday: number;
  newCustomersToday: number;
  urgentToday: number;
  averageDurationSeconds: number;
  recentCalls: RecentCall[];
};

function startOfTodayIso() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay.toISOString();
}

export async function getDashboardStats(companyId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const since = startOfTodayIso();

  const [callsTodayResult, urgentTodayResult, newCustomersResult, durationsResult, recentCallsResult] =
    await Promise.all([
      supabase
        .from("calls")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_simulated", false)
        .gte("created_at", since),
      supabase
        .from("calls")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_simulated", false)
        .in("urgency", ["high", "critical"])
        .gte("created_at", since),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .not("phone_number", "ilike", "Simulation%")
        .gte("created_at", since),
      supabase
        .from("calls")
        .select("duration_seconds")
        .eq("company_id", companyId)
        .eq("is_simulated", false)
        .gte("created_at", since)
        .not("duration_seconds", "is", null),
      supabase
        .from("calls")
        .select("id, from_number, customer_id, reason, urgency, duration_seconds, created_at")
        .eq("company_id", companyId)
        .eq("is_simulated", false)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const durations = (durationsResult.data ?? [])
    .map((row) => row.duration_seconds)
    .filter((value): value is number => value !== null);
  const averageDurationSeconds = durations.length
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
    : 0;

  const recentCallsRaw = recentCallsResult.data ?? [];
  const customerIds = recentCallsRaw
    .map((call) => call.customer_id)
    .filter((id): id is string => id !== null);

  const customerNamesById = new Map<string, string>();
  if (customerIds.length > 0) {
    const { data: customers } = await supabase
      .from("customers")
      .select("id, first_name, last_name")
      .in("id", customerIds);

    for (const customer of customers ?? []) {
      const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ");
      if (name) customerNamesById.set(customer.id, name);
    }
  }

  const recentCalls: RecentCall[] = recentCallsRaw.map((call) => ({
    id: call.id,
    fromNumber: call.from_number,
    customerName: call.customer_id ? (customerNamesById.get(call.customer_id) ?? null) : null,
    reason: call.reason,
    urgency: call.urgency,
    durationSeconds: call.duration_seconds,
    createdAt: call.created_at,
  }));

  return {
    callsToday: callsTodayResult.count ?? 0,
    newCustomersToday: newCustomersResult.count ?? 0,
    urgentToday: urgentTodayResult.count ?? 0,
    averageDurationSeconds,
    recentCalls,
  };
}

export type AICallsSummary = {
  realCalls: number;
  simulatedCalls: number;
  estimatedMinutesSaved: number;
};

/**
 * Estimation illustrative, pas une mesure : on suppose qu'un appel pris en
 * charge par l'IA aurait sinon demande ce temps a l'entreprise (decrocher,
 * qualifier, noter les coordonnees). A ajuster si besoin, ce n'est pas une
 * donnee mesuree.
 */
const ESTIMATED_MINUTES_SAVED_PER_CALL = 5;

export async function getAICallsSummary(companyId: string): Promise<AICallsSummary> {
  const supabase = await createClient();

  const [{ count: realCalls }, { count: simulatedCalls }] = await Promise.all([
    supabase
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("is_simulated", false),
    supabase
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("is_simulated", true),
  ]);

  return {
    realCalls: realCalls ?? 0,
    simulatedCalls: simulatedCalls ?? 0,
    estimatedMinutesSaved: (realCalls ?? 0) * ESTIMATED_MINUTES_SAVED_PER_CALL,
  };
}
