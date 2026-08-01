import { type NextRequest, NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { getTTSProvider } from "@/lib/tts";
import { logCallEvent } from "@/lib/calls/log";
import type { ConversationMessage } from "@/lib/ai/types";

/**
 * Synthese vocale a la demande : Twilio fetch cette URL via <Play> pour
 * obtenir l'audio du dernier message de l'assistant. Genere l'audio a
 * chaque appel plutot que de le pre-calculer et le stocker : evite tout
 * stockage transitoire (Supabase Storage ne sert qu'aux enregistrements
 * d'appel finaux, voir /api/voice/recording-status).
 */
export async function GET(request: NextRequest) {
  const callId = request.nextUrl.searchParams.get("call");
  if (!callId) {
    return new NextResponse(null, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: call } = await supabase
    .from("calls")
    .select("id, company_id, conversation")
    .eq("id", callId)
    .maybeSingle();

  if (!call) {
    return new NextResponse(null, { status: 404 });
  }

  const conversation = (call.conversation as ConversationMessage[] | null) ?? [];
  const lastTurn = conversation.at(-1);

  if (!lastTurn || lastTurn.role !== "assistant") {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const audio = await getTTSProvider().synthesize(lastTurn.content);
    return new NextResponse(new Uint8Array(audio), {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (error) {
    await logCallEvent({
      companyId: call.company_id,
      callId: call.id,
      level: "error",
      eventType: "tts.synthesize_failed",
      message: error instanceof Error ? error.message : String(error),
    });
    // Twilio ignore silencieusement un <Play> qui echoue et poursuit le
    // <Gather> englobant : le client n'entend pas l'invite mais l'appel
    // continue plutot que d'echouer completement.
    return new NextResponse(null, { status: 500 });
  }
}
