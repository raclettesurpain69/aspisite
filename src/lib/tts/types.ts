export interface TTSProvider {
  /** Synthetise un texte en audio (MP3) pret a etre joue lors de l'appel. */
  synthesize(text: string): Promise<Buffer>;
}
