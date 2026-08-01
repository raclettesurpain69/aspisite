import { PlayCircle } from "lucide-react";

/**
 * Placeholder visuel pour les appels simules (pas de vrai enregistrement
 * audio, voir /test-call). Prepare la place pour le futur enregistrement
 * reel (Twilio -> Supabase Storage, voir call_recordings) sans dupliquer
 * la mise en page du lecteur audio reel.
 */
export function FakeAudioPlayer() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
      <PlayCircle className="size-5 shrink-0 opacity-50" />
      <span>
        Appel simule : aucun enregistrement audio (pas de vrai appel telephonique).
      </span>
    </div>
  );
}
