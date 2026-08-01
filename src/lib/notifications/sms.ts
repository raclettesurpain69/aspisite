import { formatCallSummaryText } from "@/lib/notifications/format";
import type { TelephonyProvider } from "@/lib/telephony/types";
import type {
  CallNotification,
  NotificationSender,
} from "@/lib/notifications/types";

export class SmsNotificationSender implements NotificationSender {
  readonly channel = "sms" as const;

  constructor(private readonly telephony: TelephonyProvider) {}

  async send(recipient: string, notification: CallNotification): Promise<void> {
    await this.telephony.sendSms(recipient, formatCallSummaryText(notification));
  }
}

export class WhatsAppNotificationSender implements NotificationSender {
  readonly channel = "whatsapp" as const;

  constructor(private readonly telephony: TelephonyProvider) {}

  async send(recipient: string, notification: CallNotification): Promise<void> {
    await this.telephony.sendWhatsApp(
      recipient,
      formatCallSummaryText(notification)
    );
  }
}
