import { getAIProvider } from "@/lib/ai";
import type { CallSummary, CompanyAIContext, ConversationMessage } from "@/lib/ai/types";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { logCallEvent } from "@/lib/calls/log";
import { buildTranscriptText, conversationToJson } from "@/lib/calls/transcript";
import type { Database } from "@/types/database";

type FinalStatus = Extract<
  Database["public"]["Enums"]["call_status"],
  "completed" | "voicemail" | "failed"
>;

/**
 * Point de sortie unique de la conversation, quel que soit ce qui l'a
 * declenchee (fin normale, silence du client, raccrochage brutal detecte
 * par le callback de statut Twilio). Genere le resume IA, met a jour/cree
 * le client, sauvegarde la transcription et finalise la ligne `calls`.
 */
export async function finalizeCall(params: {
  callId: string;
  companyId: string;
  fromNumber: string;
  conversation: ConversationMessage[];
  context: CompanyAIContext;
  status: FinalStatus;
}): Promise<void> {
  const { callId, companyId, fromNumber, conversation, context, status } = params;
  const supabase = createServiceRoleClient();

  const hasCustomerSpeech = conversation.some((turn) => turn.role === "customer");

  let summary: CallSummary | null = null;
  if (hasCustomerSpeech && status !== "failed") {
    try {
      summary = await getAIProvider().summarizeCall(conversation, context);
    } catch (error) {
      await logCallEvent({
        companyId,
        callId,
        level: "error",
        eventType: "call.summarize_failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  let customerId: string | null = null;
  const phoneNumber = summary?.phoneNumber?.trim() || fromNumber;
  if (phoneNumber) {
    const { data: customer } = await supabase
      .from("customers")
      .upsert(
        {
          company_id: companyId,
          phone_number: phoneNumber,
          first_name: summary?.firstName ?? undefined,
          last_name: summary?.lastName ?? undefined,
          address: summary?.address ?? undefined,
          city: summary?.city ?? undefined,
        },
        { onConflict: "company_id,phone_number" }
      )
      .select("id")
      .single();
    customerId = customer?.id ?? null;
  }

  await supabase
    .from("calls")
    .update({
      status,
      ended_at: new Date().toISOString(),
      customer_id: customerId,
      reason: summary?.reason ?? null,
      problem_description: summary?.problemDescription ?? null,
      urgency: summary?.urgency ?? "normal",
      availability: summary?.availability ?? null,
      additional_info: summary?.additionalInfo ?? null,
      extra_fields: summary?.extraFields ?? {},
      recommended_action: summary?.recommendedAction ?? null,
      summary_text: summary?.summaryText ?? null,
      conversation: conversationToJson(conversation),
    })
    .eq("id", callId);

  if (conversation.length > 0) {
    await supabase
      .from("call_transcriptions")
      .upsert(
        { call_id: callId, full_text: buildTranscriptText(conversation) },
        { onConflict: "call_id" }
      );
  }

  await logCallEvent({
    companyId,
    callId,
    eventType: "call.finalized",
    message: `Appel finalise avec le statut ${status}`,
  });
}
