import twilio from "twilio";

import type { TelephonyProvider } from "@/lib/telephony/types";

/**
 * Implementation Twilio Voice de TelephonyProvider. L'architecture reste
 * compatible SIP/autres operateurs: tout code appelant doit passer par
 * l'interface TelephonyProvider (src/lib/telephony/index.ts), jamais par
 * cette classe directement.
 */
export class TwilioTelephonyProvider implements TelephonyProvider {
  private readonly authToken: string;
  private readonly client: twilio.Twilio;
  private readonly fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.authToken = authToken;
    this.client = twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
  }

  verifyWebhookSignature(params: {
    signature: string;
    url: string;
    body: Record<string, string>;
  }): boolean {
    return twilio.validateRequest(
      this.authToken,
      params.signature,
      params.url,
      params.body
    );
  }

  async sendSms(to: string, body: string): Promise<void> {
    await this.client.messages.create({ to, from: this.fromNumber, body });
  }

  async sendWhatsApp(to: string, body: string): Promise<void> {
    await this.client.messages.create({
      to: `whatsapp:${to}`,
      from: `whatsapp:${this.fromNumber}`,
      body,
    });
  }

  async startCallRecording(callSid: string, statusCallbackUrl: string): Promise<void> {
    await this.client.calls(callSid).recordings.create({
      recordingStatusCallback: statusCallbackUrl,
      recordingStatusCallbackEvent: ["completed"],
      recordingChannels: "mono",
    });
  }
}
