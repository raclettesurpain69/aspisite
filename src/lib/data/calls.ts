import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CallListItem = {
  id: string;
  fromNumber: string;
  customerName: string | null;
  reason: string | null;
  urgency: Database["public"]["Enums"]["call_urgency"];
  durationSeconds: number | null;
  createdAt: string;
};

export async function listCalls(companyId: string): Promise<CallListItem[]> {
  const supabase = await createClient();

  const { data: calls } = await supabase
    .from("calls")
    .select("id, from_number, customer_id, reason, urgency, duration_seconds, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = calls ?? [];
  const customerIds = rows
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

  return rows.map((call) => ({
    id: call.id,
    fromNumber: call.from_number,
    customerName: call.customer_id ? (customerNamesById.get(call.customer_id) ?? null) : null,
    reason: call.reason,
    urgency: call.urgency,
    durationSeconds: call.duration_seconds,
    createdAt: call.created_at,
  }));
}

export type CallDetail = Database["public"]["Tables"]["calls"]["Row"] & {
  customer: Database["public"]["Tables"]["customers"]["Row"] | null;
  recording: Database["public"]["Tables"]["call_recordings"]["Row"] | null;
  transcription: Database["public"]["Tables"]["call_transcriptions"]["Row"] | null;
};

export async function getCallDetail(callId: string): Promise<CallDetail | null> {
  const supabase = await createClient();

  const { data: call } = await supabase.from("calls").select("*").eq("id", callId).single();
  if (!call) return null;

  const [{ data: customer }, { data: recording }, { data: transcription }] = await Promise.all([
    call.customer_id
      ? supabase.from("customers").select("*").eq("id", call.customer_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("call_recordings").select("*").eq("call_id", callId).maybeSingle(),
    supabase.from("call_transcriptions").select("*").eq("call_id", callId).maybeSingle(),
  ]);

  return {
    ...call,
    customer: customer ?? null,
    recording: recording ?? null,
    transcription: transcription ?? null,
  };
}
