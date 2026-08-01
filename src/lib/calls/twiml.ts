import twilio from "twilio";
import { NextResponse } from "next/server";

function xmlResponse(twiml: InstanceType<typeof twilio.twiml.VoiceResponse>) {
  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}

/** TwiML minimal a renvoyer quand une erreur imprevue survient : jamais de
 * page d'erreur brute, toujours une reponse vocale coherente pour
 * l'appelant avant de raccrocher. */
export function errorTwiml(message = "Une erreur est survenue. Merci de rappeler ulterieurement.") {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say({ language: "fr-FR" }, message);
  twiml.hangup();
  return xmlResponse(twiml);
}

export { xmlResponse };
