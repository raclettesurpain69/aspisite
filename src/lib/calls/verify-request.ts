import type { NextRequest } from "next/server";

import { getTelephonyProvider } from "@/lib/telephony";

/**
 * Verifie la signature Twilio d'une requete webhook et retourne les
 * champs postes (form-urlencoded) sous forme d'objet. Toute route Voice
 * doit passer par cette fonction avant de faire confiance au contenu de
 * la requete : sans cela, n'importe qui pourrait forger un appel entrant.
 */
export async function verifyTwilioRequest(
  request: NextRequest
): Promise<{ valid: boolean; params: Record<string, string> }> {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = value.toString();
  }

  const signature = request.headers.get("x-twilio-signature") ?? "";
  const valid = getTelephonyProvider().verifyWebhookSignature({
    signature,
    url: request.url,
    body: params,
  });

  return { valid, params };
}
