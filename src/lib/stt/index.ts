import { env } from "@/lib/env";
import { WhisperSTTProvider } from "@/lib/stt/whisper";
import type { STTProvider } from "@/lib/stt/types";

export type { STTProvider } from "@/lib/stt/types";

/**
 * Point d'entree unique pour la transcription (STT). Changer de
 * fournisseur ne necessite de modifier que ce fichier.
 */
export function getSTTProvider(): STTProvider {
  return new WhisperSTTProvider(env.OPENAI_API_KEY);
}
