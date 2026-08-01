import type { AssistantTone, CallGoal } from "@/lib/ai/types";

/**
 * Options fixes de l'onglet "Informations generales" / "Objectifs de
 * l'appel" (Parametres > Assistant IA). Fichier separe de
 * lib/data/assistant-settings.ts (qui importe le client Supabase serveur)
 * pour rester importable depuis des composants client sans tirer
 * "next/headers" dans le bundle navigateur.
 */
export const BUSINESS_TYPES = [
  "Plomberie",
  "Chauffage",
  "Climatisation",
  "Garage",
  "Serrurerie",
  "Electricite",
  "Immobilier",
  "Cabinet medical",
  "Autre",
] as const;

export const ASSISTANT_TONES: { value: AssistantTone; label: string }[] = [
  { value: "professionnel", label: "Professionnel" },
  { value: "chaleureux", label: "Chaleureux" },
  { value: "premium", label: "Premium" },
  { value: "direct", label: "Direct" },
];

export const CALL_GOALS: { value: CallGoal; label: string }[] = [
  { value: "rendez_vous", label: "Prendre un rendez-vous" },
  { value: "qualification", label: "Qualifier le prospect" },
  { value: "devis", label: "Creer un devis" },
  { value: "transfert_urgence", label: "Transferer si urgence" },
  { value: "prise_message", label: "Simple prise de message" },
];
