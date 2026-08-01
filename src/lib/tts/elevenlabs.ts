import type { TTSProvider } from "@/lib/tts/types";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // "Rachel", voix FR/EN naturelle
const API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export class ElevenLabsTTSProvider implements TTSProvider {
  constructor(
    private readonly apiKey: string,
    private readonly voiceId: string = DEFAULT_VOICE_ID
  ) {}

  async synthesize(text: string): Promise<Buffer> {
    const response = await fetch(`${API_URL}/${this.voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": this.apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Echec de la synthese vocale ElevenLabs (${response.status}): ${await response.text()}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
