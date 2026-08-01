import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

export type CallLogEntry = {
  id: string;
  level: Database["public"]["Enums"]["log_level"];
  eventType: string;
  message: string;
  metadata: Json;
  callId: string | null;
  createdAt: string;
};

export async function listCallLogs(companyId: string, limit = 200): Promise<CallLogEntry[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("call_logs")
    .select("id, level, event_type, message, metadata, call_id, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    level: row.level,
    eventType: row.event_type,
    message: row.message,
    metadata: row.metadata,
    callId: row.call_id,
    createdAt: row.created_at,
  }));
}
