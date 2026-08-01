import { Resend } from "resend";

import { formatCallSummaryText } from "@/lib/notifications/format";
import type {
  CallNotification,
  NotificationSender,
} from "@/lib/notifications/types";

export class EmailNotificationSender implements NotificationSender {
  readonly channel = "email" as const;
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly fromAddress: string
  ) {
    this.resend = new Resend(apiKey);
  }

  async send(recipient: string, notification: CallNotification): Promise<void> {
    const text = formatCallSummaryText(notification);

    await this.resend.emails.send({
      from: this.fromAddress,
      to: recipient,
      subject: `Nouvel appel client - ${notification.companyName}`,
      text,
    });
  }
}
