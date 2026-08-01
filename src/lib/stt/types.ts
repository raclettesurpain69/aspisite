export interface STTProvider {
  /** Transcrit un segment audio (WAV/MP3) en texte. */
  transcribe(audio: Buffer, filename?: string): Promise<string>;
}
