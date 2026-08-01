import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Affiche le score de qualification prospect (CallSummary.qualificationScore,
 * 0-100) genere par l'IA a la fin de l'appel. Partage entre le mode
 * simulation et la fiche appel reelle : la meme colonne DB
 * (calls.qualification_score) alimente les deux.
 */
export function QualificationScore({
  score,
  reason,
}: {
  score: number | null;
  reason?: string | null;
}) {
  if (score === null) {
    return <p className="text-sm text-muted-foreground">Score non disponible.</p>;
  }

  const filledStars = Math.round(score / 20);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={cn(
                "size-4",
                index < filledStars ? "fill-warning text-warning" : "text-muted-foreground"
              )}
            />
          ))}
        </div>
        <span className="text-sm font-semibold">{score}/100</span>
      </div>
      {reason && <p className="text-sm text-muted-foreground">{reason}</p>}
    </div>
  );
}
