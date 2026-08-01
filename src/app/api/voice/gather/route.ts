import twilio from "twilio";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import type { ConversationMessage } from "@/lib/ai/types";
import { getCompanyById } from "@/lib/calls/company-lookup";
import { getCompanyAIContext, isTestModeEnabled } from "@/lib/calls/context";
import { finalizeCall } from "@/lib/calls/finalize";
import { logCallEvent } from "@/lib/calls/log";
import { conversationToJson } from "@/lib/calls/transcript";
import { withTiming } from "@/lib/calls/timing";
import { errorTwiml, xmlResponse } from "@/lib/calls/twiml";
import { verifyTwilioRequest } from "@/lib/calls/verify-request";
import { MAX_CUSTOMER_TURNS } from "@/lib/calls/constants";

const CLOSING_MESSAGE =
  "Merci pour ces informations. L'entreprise revient vers vous rapidement. Bonne journee !";
const SILENCE_CLOSING_MESSAGE =
  "Nous n'avons pas capte de reponse. N'hesitez pas a rappeler. Au revoir.";
const TECHNICAL_ISSUE_MESSAGE =
  "Je rencontre une difficulte technique. L'entreprise vous rappellera des que possible.";

function buildPlayThenHangupTwiml(callId: string) {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.play(`${env.NEXT_PUBLIC_APP_URL}/api/voice/say?call=${callId}`);
  twiml.hangup();
  return xmlResponse(twiml);
}

function buildContinueTwiml(callId: string) {
  const twiml = new twilio.twiml.VoiceResponse();
  const gather = twiml.gather({
    input: ["speech"],
    action: `${env.NEXT_PUBLIC_APP_URL}/api/voice/gather?call=${callId}`,
    method: "POST",
    language: "fr-FR",
    speechTimeout: "auto",
  });
  gather.play(`${env.NEXT_PUBLIC_APP_URL}/api/voice/say?call=${callId}`);
  twiml.say({ language: "fr-FR" }, "Nous n'avons pas pu recueillir votre reponse. Au revoir.");
  twiml.hangup();
  return xmlResponse(twiml);
}

/**
 * Recoit le resultat d'un tour de <Gather> (transcription Twilio de la
 * parole du client). Poursuit la conversation, la cloture apres
 * MAX_CUSTOMER_TURNS, ou finalise immediatement si le client n'a rien dit
 * (silence => statut `voicemail`).
 */
export async function POST(request: NextRequest) {
  const callId = request.nextUrl.searchParams.get("call");
  if (!callId) {
    return new NextResponse("Missing call id", { status: 400 });
  }

  try {
    const { valid, params } = await verifyTwilioRequest(request);
    if (!valid) {
      await logCallEvent({
        callId,
        level: "error",
        eventType: "webhook.invalid_signature",
        message: "Signature Twilio invalide sur /api/voice/gather",
      });
      return new NextResponse("Invalid signature", { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const { data: call } = await supabase
      .from("calls")
      .select("id, company_id, from_number, conversation, twilio_call_sid")
      .eq("id", callId)
      .maybeSingle();

    if (!call) {
      return errorTwiml();
    }

    if (call.twilio_call_sid !== params.CallSid) {
      await logCallEvent({
        companyId: call.company_id,
        callId: call.id,
        level: "warn",
        eventType: "call.sid_mismatch",
        message: "CallSid du webhook different de celui enregistre pour cet appel",
      });
    }

    const company = await getCompanyById(call.company_id);
    if (!company) {
      return errorTwiml();
    }

    const testMode = await isTestModeEnabled(company.id);
    const context = await getCompanyAIContext(company.id, company.name, company.businessType);
    const conversation = ((call.conversation as ConversationMessage[] | null) ?? []).slice();
    const speechResult = params.SpeechResult?.trim();

    await logCallEvent({
      companyId: call.company_id,
      callId: call.id,
      eventType: "webhook.gather",
      message: speechResult
        ? `Parole du client recue : "${speechResult}"`
        : "Aucune parole detectee (silence).",
    });

    if (!speechResult) {
      conversation.push({ role: "assistant", content: SILENCE_CLOSING_MESSAGE });
      await supabase.from("calls").update({ conversation: conversationToJson(conversation) }).eq("id", call.id);
      await finalizeCall({
        callId: call.id,
        companyId: call.company_id,
        fromNumber: call.from_number,
        conversation,
        context,
        testMode,
        status: "voicemail",
      });
      return buildPlayThenHangupTwiml(call.id);
    }

    conversation.push({ role: "customer", content: speechResult });

    const customerTurns = conversation.filter((turn) => turn.role === "customer").length;

    if (customerTurns >= MAX_CUSTOMER_TURNS) {
      conversation.push({ role: "assistant", content: CLOSING_MESSAGE });
      await supabase.from("calls").update({ conversation: conversationToJson(conversation) }).eq("id", call.id);
      await finalizeCall({
        callId: call.id,
        companyId: call.company_id,
        fromNumber: call.from_number,
        conversation,
        context,
        testMode,
        status: "completed",
      });
      return buildPlayThenHangupTwiml(call.id);
    }

    try {
      const nextLine = await withTiming(
        { testMode, companyId: call.company_id, callId: call.id, provider: "Claude", action: "generate_response" },
        () => getAIProvider().generateResponse(conversation, context)
      );
      conversation.push({ role: "assistant", content: nextLine });
      await supabase.from("calls").update({ conversation: conversationToJson(conversation) }).eq("id", call.id);
      await logCallEvent({
        companyId: call.company_id,
        callId: call.id,
        eventType: "ai.response_generated",
        message: `Reponse IA generee (${nextLine.length} caracteres).`,
      });
      return buildContinueTwiml(call.id);
    } catch (error) {
      await logCallEvent({
        companyId: call.company_id,
        callId: call.id,
        level: "error",
        eventType: "ai.generate_response_failed",
        message: error instanceof Error ? error.message : String(error),
      });
      conversation.push({ role: "assistant", content: TECHNICAL_ISSUE_MESSAGE });
      await supabase.from("calls").update({ conversation: conversationToJson(conversation) }).eq("id", call.id);
      await finalizeCall({
        callId: call.id,
        companyId: call.company_id,
        fromNumber: call.from_number,
        conversation,
        context,
        testMode,
        status: "completed",
      });
      return buildPlayThenHangupTwiml(call.id);
    }
  } catch (error) {
    await logCallEvent({
      callId,
      level: "error",
      eventType: "call.gather_unhandled_error",
      message: error instanceof Error ? error.message : String(error),
    });
    return errorTwiml();
  }
}
