/** Sous-ensemble des champs envoyes par Twilio sur le webhook Voice. */
export interface IncomingCallPayload {
  callSid: string;
  from: string;
  to: string;
  callStatus: string;
}

export interface TelephonyProvider {
  /** Verifie qu'une requete webhook provient bien du fournisseur telephonique. */
  verifyWebhookSignature(params: {
    signature: string;
    url: string;
    body: Record<string, string>;
  }): boolean;

  /** Envoie un SMS (ex: notification a l'entreprise). */
  sendSms(to: string, body: string): Promise<void>;

  /** Envoie un message WhatsApp. Architecture prete, desactivable dans le MVP. */
  sendWhatsApp(to: string, body: string): Promise<void>;
}
