import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DiagnosticCheck } from "@/lib/diagnostics/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_CONFIG = {
  ok: { icon: CheckCircle2, label: "OK", className: "text-success" },
  warning: { icon: AlertTriangle, label: "Avertissement", className: "text-warning" },
  error: { icon: XCircle, label: "Erreur", className: "text-destructive" },
} as const;

export function DiagnosticCard({ check }: { check: DiagnosticCheck }) {
  const { icon: Icon, label, className } = STATUS_CONFIG[check.status];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-base">{check.label}</CardTitle>
        <span className={cn("flex items-center gap-1.5 text-sm font-medium", className)}>
          <Icon className="size-4" />
          {label}
        </span>
      </CardHeader>
      <CardContent className="space-y-2 pb-6">
        <p className="text-sm text-muted-foreground">{check.message}</p>
        {check.details && (
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap text-muted-foreground">
            {check.details}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
