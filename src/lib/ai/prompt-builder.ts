import type { AssistantTone, CallGoal, CompanyAIContext } from "@/lib/ai/types";

/**
 * Transforme la configuration d'une entreprise (Parametres > Assistant IA)
 * en prompt systeme. C'est le seul endroit ou "ton", "objectifs", etc.
 * deviennent du texte pour le modele : l'utilisateur ne redige jamais ce
 * prompt lui-meme (il configure des options, voir CompanyAIContext).
 * Independant du fournisseur IA (voir src/lib/ai/claude.ts) pour rester
 * reutilisable si un autre AIProvider est ajoute un jour.
 */
const TONE_DESCRIPTIONS: Record<AssistantTone, string> = {
  professionnel: "Adopte un ton professionnel, courtois et efficace.",
  chaleureux:
    "Adopte un ton chaleureux et empathique, comme un proche qui rassure et aide sincerement.",
  premium:
    "Adopte un ton premium et soigne, valorisant, comme un service haut de gamme.",
  direct: "Adopte un ton direct et concis, va droit au but sans formules superflues.",
};

const CALL_GOAL_DESCRIPTIONS: Record<CallGoal, string> = {
  rendez_vous: "Proposer et confirmer un rendez-vous si la situation s'y prete.",
  qualification: "Qualifier serieusement le besoin (urgence, ampleur, delai souhaite).",
  devis: "Recueillir les elements necessaires a l'etablissement d'un devis.",
  transfert_urgence:
    "Detecter une urgence reelle et le signaler clairement dans le resume final pour une prise en charge prioritaire.",
  prise_message: "Prendre un message clair et complet pour que l'entreprise puisse rappeler.",
};

export function buildSystemPrompt(context: CompanyAIContext): string {
  const enabledQuestions = context.questions.filter((question) => question.enabled);
  const questionsList = enabledQuestions
    .map((question) => `- ${question.label}${question.required ? " (obligatoire)" : " (facultatif)"}`)
    .join("\n");

  const goals = context.callGoals.length > 0 ? context.callGoals : (["prise_message"] as CallGoal[]);
  const goalsList = goals.map((goal) => `- ${CALL_GOAL_DESCRIPTIONS[goal]}`).join("\n");

  const faqSection =
    context.faq.length > 0
      ? `\n\nQuestions frequentes de cette entreprise (utilise ces reponses si le client pose une question similaire, n'invente jamais une reponse a la place) :\n${context.faq
          .map((entry) => `Q : ${entry.question}\nR : ${entry.answer}`)
          .join("\n\n")}`
      : "";

  const availabilitySection = context.isCurrentlyOpen
    ? ""
    : `\n\nL'entreprise est actuellement fermee${
        context.vacationMessage ? ` (${context.vacationMessage})` : " (en dehors des horaires d'ouverture)"
      }. Informe le client avec tact des le debut de l'appel, precise que son message sera transmis des la reouverture, et ne propose pas de rendez-vous immediat.`;

  const languageSection =
    context.language && context.language !== "fr"
      ? `\n\nMene toute la conversation en ${context.language}.`
      : "";

  const extraSection =
    context.extraInstructions.length > 0
      ? `\n\n${context.extraInstructions.map((instruction) => `- ${instruction}`).join("\n")}`
      : "";

  return `Tu es l'assistant telephonique de ${context.companyName} (secteur : ${context.businessType}).
Tu recueilles les informations d'un client qui n'a pas pu joindre l'entreprise, afin qu'elle puisse le rappeler rapidement.
${TONE_DESCRIPTIONS[context.tone]}${languageSection}

Objectifs de cet appel :
${goalsList}

Informations a obtenir au fil de la conversation (adapte tes questions au contexte, ne recite jamais une liste) :
${questionsList}${faqSection}${availabilitySection}${extraSection}

Consignes :
- Sois naturel, ne recite jamais un questionnaire rigide.
- Reste concis : c'est une conversation telephonique, pas un ecrit.
- Ne termine la conversation que lorsque tu as recueilli l'essentiel ou que le client n'a plus rien a ajouter.`;
}
