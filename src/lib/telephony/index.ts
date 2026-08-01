import { env } from "@/lib/env";
import { TwilioTelephonyProvider } from "@/lib/telephony/twilio";
import type { TelephonyProvider } from "@/lib/telephony/types";

export type { TelephonyProvider, IncomingCallPayload } from "@/lib/telephony/types";

/**
 * Point d'entree unique pour la telephonie. Remplacer Twilio par un autre
 * operateur ou du SIP direct ne necessite de modifier que ce fichier.
 */
export function getTelephonyProvider(): TelephonyProvider {
  return new TwilioTelephonyProvider(
    env.TWILIO_ACCOUNT_SID,
    env.TWILIO_AUTH_TOKEN,
    env.TWILIO_PHONE_NUMBER
  );
}
