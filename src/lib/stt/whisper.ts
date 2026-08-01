import type { STTProvider } from "@/lib/stt/types";

const API_URL = "https://api.openai.com/v1/audio/transcriptions";

export class WhisperSTTProvider implements STTProvider {
  constructor(private readonly apiKey: string) {}

  async transcribe(audio: Buffer, filename = "audio.wav"): Promise<string> {
    const formData = new FormData();
    formData.append("file", new Blob([new Uint8Array(audio)]), filename);
    formData.append("model", "whisper-1");
    formData.append("language", "fr");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `Echec de la transcription Whisper (${response.status}): ${await response.text()}`
      );
    }

    const data = (await response.json()) as { text: string };
    return data.text;
  }
}
