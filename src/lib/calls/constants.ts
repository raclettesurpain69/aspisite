/**
 * Nombre maximum de tours de parole client avant de clore la conversation
 * et de generer le resume, meme si l'IA n'a pas explicitement conclu.
 * Filet de securite simple pour garantir qu'un appel se termine toujours
 * (a affiner plus tard avec une detection de fin de conversation plus
 * fine, ex: intention detectee par Claude).
 */
export const MAX_CUSTOMER_TURNS = 6;
