import twilio from "twilio";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getTelephonyProvider } from "@/lib/telephony";
import { getCompanyByPhoneNumber } from "@/lib/calls/company-lookup";
import { getCompanyAIContext, isTestModeEnabled } from "@/lib/calls/context";
import { hasReachedMonthlyCallLimit } from "@/lib/calls/limits";
import { logCallEvent } from "@/lib/calls/log";
import { conversationToJson } from "@/lib/calls/transcript";
import { withTiming } from "@/lib/calls/timing";
import { errorTwiml, xmlResponse } from "@/lib/calls/twiml";
import { verifyTwilioRequest } from "@/lib/calls/verify-request";
import type { ConversationMessage } from "@/lib/ai/types";

/**
 * Webhook Twilio "Voice URL" appele quand un appel de l'entreprise est
 * transfere vers l'assistant IA (no answer / busy / horaires fermes).
 * Identifie l'entreprise via le numero appele, cree la ligne `calls`,
 * demarre l'enregistrement audio en arriere-plan, puis lance le premier
 * tour de la conversation (message d'accueil + ecoute).
 */
export async function POST(request: NextRequest) {
  try {
    const { valid, params } = await verifyTwilioRequest(request);
    if (!valid) {
      await logCallEvent({
        level: "error",
        eventType: "webhook.invalid_signature",
        message: "Signature Twilio invalide sur /api/voice/incoming",
        metadata: { callSid: params.CallSid },
      });
      return new NextResponse("Invalid signature", { status: 403 });
    }

    const callSid = params.CallSid;
    const fromNumber = params.From;
    const toNumber = params.To;

    const company = await getCompanyByPhoneNumber(toNumber);
    if (!company) {
      await logCallEvent({
        level: "warn",
        eventType: "call.unknown_number",
        message: `Aucune entreprise associee au numero ${toNumber}`,
        metadata: { callSid, toNumber, fromNumber },
      });
      return errorTwiml("Ce numero n'est pas configure. Merci de contacter l'entreprise directement.");
    }

    const testMode = await isTestModeEnabled(company.id);

    await logCallEvent({
      companyId: company.id,
      eventType: "webhook.incoming",
      message: `Webhook Twilio /incoming recu (de ${fromNumber} vers ${toNumber})`,
      metadata: { callSid },
    });

    const supabase = createServiceRoleClient();

    if (await hasReachedMonthlyCallLimit(company.id)) {
      await supabase.from("calls").upsert(
        {
          company_id: company.id,
          from_number: fromNumber,
          to_number: toNumber,
          twilio_call_sid: callSid,
          status: "failed",
          ended_at: new Date().toISOString(),
          duration_seconds: 0,
          extra_fields: { rejection_reason: "plan_limit_reached" },
        },
        { onConflict: "twilio_call_sid" }
      );
      await logCallEvent({
        companyId: company.id,
        level: "warn",
        eventType: "call.plan_limit_reached",
        message: "Appel refuse : quota mensuel du plan atteint",
        metadata: { callSid },
      });
      return errorTwiml(
        "Nous ne pouvons pas traiter votre appel pour le moment. Merci de contacter l'entreprise directement."
      );
    }

    const { data: call, error: insertError } = await withTiming(
      { testMode, companyId: company.id, callId: null, provider: "Supabase", action: "create_call_row" },
      () =>
        supabase
          .from("calls")
          .upsert(
            {
              company_id: company.id,
              from_number: fromNumber,
              to_number: toNumber,
              twilio_call_sid: callSid,
              status: "incoming",
            },
            { onConflict: "twilio_call_sid" }
          )
          .select("id")
          .single()
    );

    if (insertError || !call) {
      await logCallEvent({
        companyId: company.id,
        level: "error",
        eventType: "call.create_failed",
        message: insertError?.message ?? "Echec de creation de la ligne calls",
        metadata: { callSid },
      });
      return errorTwiml();
    }

    await logCallEvent({
      companyId: company.id,
      callId: call.id,
      eventType: "call.received",
      message: `Nouvel appel entrant enregistre (de ${fromNumber})`,
    });

    try {
      await withTiming(
        { testMode, companyId: company.id, callId: call.id, provider: "Twilio", action: "start_recording" },
        () =>
          getTelephonyProvider().startCallRecording(
            callSid,
            `${env.NEXT_PUBLIC_APP_URL}/api/voice/recording-status`
          )
      );
    } catch (error) {
      await logCallEvent({
        companyId: company.id,
        callId: call.id,
        level: "error",
        eventType: "recording.start_failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }

    const context = await getCompanyAIContext(company.id, company.name, company.businessType);
    const conversation: ConversationMessage[] = [{ role: "assistant", content: context.greeting }];

    await supabase
      .from("calls")
      .update({ status: "answered", conversation: conversationToJson(conversation) })
      .eq("id", call.id);

    const twiml = new twilio.twiml.VoiceResponse();
    const gather = twiml.gather({
      input: ["speech"],
      action: `${env.NEXT_PUBLIC_APP_URL}/api/voice/gather?call=${call.id}`,
      method: "POST",
      language: "fr-FR",
      speechTimeout: "auto",
    });
    gather.play(`${env.NEXT_PUBLIC_APP_URL}/api/voice/say?call=${call.id}`);
    twiml.say({ language: "fr-FR" }, "Nous n'avons pas pu recueillir votre reponse. Au revoir.");
    twiml.hangup();

    return xmlResponse(twiml);
  } catch (error) {
    await logCallEvent({
      level: "error",
      eventType: "call.incoming_unhandled_error",
      message: error instanceof Error ? error.message : String(error),
    });
    return errorTwiml();
  }
}
