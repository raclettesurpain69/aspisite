import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

type LogLevel = Database["public"]["Enums"]["log_level"];

/**
 * Journalise un evenement technique lie a un appel (echec Twilio, timeout
 * IA, erreur de synthese vocale...) dans `call_logs`, exploitable depuis
 * le dashboard sans acces aux logs d'infrastructure. Ne doit jamais faire
 * echouer l'appelant : les erreurs de logging sont avalees silencieusement.
 */
export async function logCallEvent(params: {
  companyId?: string | null;
  callId?: string | null;
  level?: LogLevel;
  eventType: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = createServiceRoleClient();
    await supabase.from("call_logs").insert({
      company_id: params.companyId ?? null,
      call_id: params.callId ?? null,
      level: params.level ?? "info",
      event_type: params.eventType,
      message: params.message,
      metadata: (params.metadata ?? {}) as Json,
    });
  } catch (error) {
    console.error("[call_logs] echec de journalisation", error);
  }
}
