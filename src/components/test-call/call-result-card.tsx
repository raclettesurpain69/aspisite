import { CheckCircle2 } from "lucide-react";

import type { SimulationSummary } from "@/lib/simulation/engine";
import { Badge } from "@/components/ui/badge";
import { QualificationScore } from "@/components/calls/qualification-score";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const URGENCY_LABELS: Record<string, string> = {
  low: "Faible",
  normal: "Normale",
  high: "Elevee",
  critical: "Critique",
};

export function CallResultCard({ summary }: { summary: SimulationSummary }) {
  const customerName = [summary.firstName, summary.lastName].filter(Boolean).join(" ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-success" />
          Appel termine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="font-medium">{customerName || "Non communique"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Telephone</p>
            <p className="font-medium">{summary.phoneNumber || "Non communique"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{summary.email || "Non communique"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Motif</p>
            <p className="font-medium">{summary.reason || "Non precise"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Urgence</p>
            <Badge
              variant={
                summary.urgency === "critical" || summary.urgency === "high"
                  ? "destructive"
                  : "secondary"
              }
            >
              {URGENCY_LABELS[summary.urgency] ?? summary.urgency}
            </Badge>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Resume</p>
          <p className="text-sm whitespace-pre-wrap">{summary.summaryText || "—"}</p>
        </div>

        {summary.recommendedAction && (
          <div>
            <p className="text-sm text-muted-foreground">Action recommandee</p>
            <p className="text-sm font-medium">{summary.recommendedAction}</p>
          </div>
        )}

        <div className="border-t pt-4">
          <p className="mb-2 text-sm text-muted-foreground">Score de qualification prospect</p>
          <QualificationScore
            score={summary.qualificationScore}
            reason={summary.qualificationReason}
          />
        </div>
      </CardContent>
    </Card>
  );
}
