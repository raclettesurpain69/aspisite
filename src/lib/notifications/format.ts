import type { CallNotification } from "@/lib/notifications/types";

const URGENCY_LABELS: Record<string, string> = {
  low: "Faible",
  normal: "Normale",
  high: "Elevee",
  critical: "Critique",
};

/**
 * Formate le resume d'appel selon le gabarit texte demande par le produit.
 * Reutilise tel quel pour l'email et le SMS (texte brut).
 */
export function formatCallSummaryText(notification: CallNotification): string {
  const { summary, callerNumber } = notification;
  const fullName = [summary.firstName, summary.lastName].filter(Boolean).join(" ");

  const lines = [
    "NOUVEL APPEL CLIENT",
    "",
    `Nom : ${fullName || "Non communique"}`,
    `Telephone : ${summary.phoneNumber || callerNumber}`,
    `Adresse : ${[summary.address, summary.city].filter(Boolean).join(", ") || "Non communiquee"}`,
    "",
    `Motif : ${summary.reason || "Non precise"}`,
    `Urgence : ${URGENCY_LABELS[summary.urgency] ?? summary.urgency}`,
    "",
    "Resume :",
    summary.summaryText,
    "",
    "Action recommandee :",
    summary.recommendedAction,
  ];

  return lines.join("\n");
}
