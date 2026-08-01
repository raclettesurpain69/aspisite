import { type NextRequest, NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import type { ConversationMessage } from "@/lib/ai/types";
import { getCompanyById } from "@/lib/calls/company-lookup";
import { getCompanyAIContext, isTestModeEnabled } from "@/lib/calls/context";
import { finalizeCall } from "@/lib/calls/finalize";
import { logCallEvent } from "@/lib/calls/log";
import { verifyTwilioRequest } from "@/lib/calls/verify-request";

const FAILURE_STATUSES = new Set(["busy", "failed", "no-answer", "canceled"]);
const FINALIZED_STATUSES = new Set(["completed", "voicemail", "failed"]);

/**
 * Webhook Twilio "Call Status Changes" (a configurer sur le numero Twilio
 * cote console/API : Voice > Call Status Changes). C'est le seul signal
 * fiable pour les raccrochages abrupts survenus avant que notre propre
 * boucle de conversation (/api/voice/gather) n'ait eu l'occasion de
 * finaliser l'appel.
 */
export async function POST(request: NextRequest) {
  const { valid, params } = await verifyTwilioRequest(request);
  if (!valid) {
    await logCallEvent({
      level: "error",
      eventType: "webhook.invalid_signature",
      message: "Signature Twilio invalide sur /api/voice/status",
    });
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const callSid = params.CallSid;
  const callStatus = params.CallStatus;
  const durationSeconds = params.CallDuration ? Number.parseInt(params.CallDuration, 10) : null;

  const supabase = createServiceRoleClient();
  const { data: call } = await supabase
    .from("calls")
    .select("id, company_id, from_number, status, conversation")
    .eq("twilio_call_sid", callSid)
    .maybeSingle();

  if (!call) {
    return NextResponse.json({ received: true });
  }

  await logCallEvent({
    companyId: call.company_id,
    callId: call.id,
    eventType: "webhook.status",
    message: `Callback statut Twilio recu : ${callStatus}`,
  });

  if (callStatus === "completed") {
    if (FINALIZED_STATUSES.has(call.status)) {
      await supabase
        .from("calls")
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq("id", call.id);
    } else {
      // Le client a raccroche avant que /api/voice/gather ne finalise
      // l'appel (silence total, coupure reseau...) : on finalise ici avec
      // la conversation telle qu'elle etait au moment du raccroche.
      const company = await getCompanyById(call.company_id);
      const conversation = (call.conversation as ConversationMessage[] | null) ?? [];
      const hasCustomerSpeech = conversation.some((turn) => turn.role === "customer");

      if (company) {
        const testMode = await isTestModeEnabled(company.id);
        const context = await getCompanyAIContext(company.id);
        await finalizeCall({
          callId: call.id,
          companyId: call.company_id,
          fromNumber: call.from_number,
          conversation,
          context,
          testMode,
          status: hasCustomerSpeech ? "completed" : "voicemail",
        });
        await supabase
          .from("calls")
          .update({ duration_seconds: durationSeconds })
          .eq("id", call.id);
      }
    }
  } else if (FAILURE_STATUSES.has(callStatus) && !FINALIZED_STATUSES.has(call.status)) {
    await supabase
      .from("calls")
      .update({
        status: "failed",
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds ?? 0,
      })
      .eq("id", call.id);
    await logCallEvent({
      companyId: call.company_id,
      callId: call.id,
      level: "warn",
      eventType: "call.twilio_failure_status",
      message: `Statut Twilio : ${callStatus}`,
    });
  }

  return NextResponse.json({ received: true });
}
