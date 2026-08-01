/**
 * Scenarios pre-definis pour le mode simulation (src/lib/simulation/) :
 * permettent de demontrer le produit sans dependre d'un vrai appel
 * Twilio. Chaque scenario ajoute une instruction au contexte IA (voir
 * buildScenarioContext) et suggere un premier message client pour
 * demarrer rapidement la conversation.
 */
export type ScenarioId =
  | "devis"
  | "rendez_vous"
  | "information"
  | "urgence"
  | "client_mecontent";

export interface CallScenario {
  id: ScenarioId;
  label: string;
  description: string;
  aiInstruction: string;
  suggestedOpeningMessage: string;
}

export const CALL_SCENARIOS: CallScenario[] = [
  {
    id: "devis",
    label: "Demande de devis",
    description: "Le client souhaite un devis pour des travaux a venir.",
    aiInstruction:
      "Le client appelle pour demander un devis. Cherche a comprendre la nature des travaux, leur ampleur et le delai souhaite.",
    suggestedOpeningMessage:
      "Bonjour, j'aimerais un devis pour la renovation de ma salle de bain.",
  },
  {
    id: "rendez_vous",
    label: "Prise de rendez-vous",
    description: "Le client veut planifier une intervention.",
    aiInstruction:
      "Le client appelle pour prendre rendez-vous. Cherche a connaitre le motif de l'intervention et ses disponibilites precises.",
    suggestedOpeningMessage:
      "Bonjour, je voudrais prendre rendez-vous pour un entretien de ma chaudiere.",
  },
  {
    id: "information",
    label: "Demande d'information",
    description: "Le client se renseigne avant de se decider.",
    aiInstruction:
      "Le client pose des questions generales sur les services de l'entreprise avant de s'engager. Reponds a ses questions et propose de le recontacter pour aller plus loin.",
    suggestedOpeningMessage:
      "Bonjour, j'aurais quelques questions sur vos services avant de me decider.",
  },
  {
    id: "urgence",
    label: "Urgence",
    description: "Le client a un probleme urgent a resoudre rapidement.",
    aiInstruction:
      "Le client a une urgence. Identifie rapidement la nature du danger ou du degat, et considere un niveau d'urgence eleve ou critique.",
    suggestedOpeningMessage:
      "Bonjour, j'ai une fuite d'eau importante qui inonde ma cuisine, j'ai besoin de quelqu'un rapidement !",
  },
  {
    id: "client_mecontent",
    label: "Client mecontent",
    description: "Le client se plaint d'une prestation recente.",
    aiInstruction:
      "Le client n'est pas satisfait d'une prestation recente. Reste calme et professionnel, ecoute sa reclamation, et note precisement le probleme pour que l'entreprise puisse le traiter.",
    suggestedOpeningMessage:
      "Bonjour, je vous appelle car je ne suis pas du tout satisfait de l'intervention de la semaine derniere.",
  },
];

export function getScenarioById(id: string): CallScenario | undefined {
  return CALL_SCENARIOS.find((scenario) => scenario.id === id);
}
