import { env } from "@/lib/env";
import { ElevenLabsTTSProvider } from "@/lib/tts/elevenlabs";
import type { TTSProvider } from "@/lib/tts/types";

export type { TTSProvider } from "@/lib/tts/types";

/**
 * Point d'entree unique pour la synthese vocale (TTS). Changer de
 * fournisseur (Azure, Google, OpenAI TTS...) ne necessite de modifier que
 * ce fichier.
 */
export function getTTSProvider(): TTSProvider {
  return new ElevenLabsTTSProvider(env.ELEVENLABS_API_KEY);
}
