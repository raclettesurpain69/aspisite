import { NextResponse } from "next/server";
import twilio from "twilio";

/**
 * Webhook Twilio "Voice URL" appele quand un appel est transfere vers
 * l'assistant IA (no answer / busy / horaires fermes). La conversation IA
 * complete (Claude + TTS/STT) est branchee a l'etape 3.
 */
export async function POST() {
  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say(
    { language: "fr-FR" },
    "Bonjour, l'assistant telephonique n'est pas encore configure. Merci de rappeler ulterieurement."
  );

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
