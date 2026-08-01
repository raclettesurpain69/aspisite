import { env } from "@/lib/env";
import { getTelephonyProvider } from "@/lib/telephony";
import { EmailNotificationSender } from "@/lib/notifications/email";
import {
  SmsNotificationSender,
  WhatsAppNotificationSender,
} from "@/lib/notifications/sms";
import type {
  CallNotification,
  NotificationRecipient,
  NotificationSender,
} from "@/lib/notifications/types";

export type {
  CallNotification,
  NotificationChannel,
  NotificationRecipient,
} from "@/lib/notifications/types";

function getSenders(): Record<string, NotificationSender> {
  const telephony = getTelephonyProvider();

  return {
    email: new EmailNotificationSender(
      env.RESEND_API_KEY,
      env.NOTIFICATION_EMAIL_FROM
    ),
    sms: new SmsNotificationSender(telephony),
    whatsapp: new WhatsAppNotificationSender(telephony),
  };
}

/**
 * Envoie le resume d'appel sur chaque canal choisi par l'entreprise
 * (parametres, table `settings`, etape 2). Email actif par defaut pour
 * limiter les couts ; SMS et WhatsApp sont optionnels.
 */
export async function dispatchCallNotification(
  recipients: NotificationRecipient[],
  notification: CallNotification
): Promise<void> {
  const senders = getSenders();

  await Promise.all(
    recipients.map((recipient) => {
      const sender = senders[recipient.channel];
      if (!sender) {
        throw new Error(`Canal de notification inconnu: ${recipient.channel}`);
      }
      return sender.send(recipient.destination, notification);
    })
  );
}
