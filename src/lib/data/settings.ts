import { createClient } from "@/lib/supabase/server";

export type CompanySettingsData = {
  company: {
    name: string;
    businessType: string | null;
    address: string | null;
    city: string | null;
  };
  settings: {
    greetingMessage: string;
    customQuestions: string[];
    notificationChannels: string[];
    testMode: boolean;
  };
  plan: {
    code: string;
    subscriptionStatus: string;
    maxCallsPerMonth: number;
    maxCallDurationSeconds: number;
    maxUsers: number;
  } | null;
  usage: {
    callsThisPeriod: number;
    totalDurationSeconds: number;
  };
};

export async function getCompanySettings(companyId: string): Promise<CompanySettingsData> {
  const supabase = await createClient();

  const [{ data: company }, { data: settings }, { data: plan }, { data: usage }] =
    await Promise.all([
      supabase
        .from("companies")
        .select("name, business_type, address, city")
        .eq("id", companyId)
        .single(),
      supabase
        .from("settings")
        .select("greeting_message, custom_questions, notification_channels, test_mode")
        .eq("company_id", companyId)
        .maybeSingle(),
      supabase
        .from("company_plan_limits")
        .select("plan_code, subscription_status, max_calls_per_month, max_call_duration_seconds, max_users")
        .eq("company_id", companyId)
        .maybeSingle(),
      supabase.rpc("get_company_usage", { p_company_id: companyId }).maybeSingle(),
    ]);

  return {
    company: {
      name: company?.name ?? "",
      businessType: company?.business_type ?? null,
      address: company?.address ?? null,
      city: company?.city ?? null,
    },
    settings: {
      greetingMessage: settings?.greeting_message ?? "",
      customQuestions: (settings?.custom_questions as string[] | null) ?? [],
      notificationChannels: settings?.notification_channels ?? ["email"],
      testMode: settings?.test_mode ?? false,
    },
    plan: plan
      ? {
          code: plan.plan_code ?? "trial",
          subscriptionStatus: plan.subscription_status ?? "trialing",
          maxCallsPerMonth: plan.max_calls_per_month ?? 0,
          maxCallDurationSeconds: plan.max_call_duration_seconds ?? 0,
          maxUsers: plan.max_users ?? 0,
        }
      : null,
    usage: {
      callsThisPeriod: usage?.calls_this_period ?? 0,
      totalDurationSeconds: usage?.total_duration_seconds ?? 0,
    },
  };
}
