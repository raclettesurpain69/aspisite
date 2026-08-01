import { CheckCircle2, Circle } from "lucide-react";

import { COLLECTED_FIELD_LABELS, type CollectedFieldId } from "@/lib/simulation/progress";
import { cn } from "@/lib/utils";

export function CollectionProgress({
  collected,
}: {
  collected: Record<CollectedFieldId, boolean>;
}) {
  const fields = Object.keys(COLLECTED_FIELD_LABELS) as CollectedFieldId[];
  const collectedCount = fields.filter((field) => collected[field]).length;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Informations collectees ({collectedCount}/{fields.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {fields.map((field) => (
          <span
            key={field}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
              collected[field]
                ? "border-success/40 bg-success/10 text-success"
                : "text-muted-foreground"
            )}
          >
            {collected[field] ? (
              <CheckCircle2 className="size-3" />
            ) : (
              <Circle className="size-3" />
            )}
            {COLLECTED_FIELD_LABELS[field]}
          </span>
        ))}
      </div>
    </div>
  );
}
