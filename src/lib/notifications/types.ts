import type { CallSummary } from "@/lib/ai/types";

export type NotificationChannel = "email" | "sms" | "whatsapp";

export interface CallNotification {
  companyName: string;
  /** Numero appelant, tel que transmis par Twilio (E.164). */
  callerNumber: string;
  summary: CallSummary;
}

export interface NotificationRecipient {
  channel: NotificationChannel;
  /** Email ou numero de telephone selon le canal. */
  destination: string;
}

export interface NotificationSender {
  channel: NotificationChannel;
  send(recipient: string, notification: CallNotification): Promise<void>;
}
