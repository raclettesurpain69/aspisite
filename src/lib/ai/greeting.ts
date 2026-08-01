/** Jeton remplace par le nom de l'entreprise dans le message d'accueil. */
export const GREETING_COMPANY_TOKEN = "{{entreprise}}";

export const DEFAULT_GREETING_TEMPLATE = `Bonjour, vous etes bien chez ${GREETING_COMPANY_TOKEN}. Je suis l'assistant telephonique de l'entreprise. Je vais recueillir quelques informations afin qu'ils puissent vous rappeler rapidement.`;

/**
 * Remplace le jeton {{entreprise}} par le nom reel de l'entreprise.
 * Utilise a la fois par l'apercu en temps reel (Parametres > Assistant IA)
 * et par getCompanyAIContext() cote serveur : le rendu est identique.
 */
export function renderGreeting(template: string, companyName: string): string {
  return template.split(GREETING_COMPANY_TOKEN).join(companyName);
}
