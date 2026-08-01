import Link from "next/link";
import { UserPlus } from "lucide-react";

import type { SimulationSummary } from "@/lib/simulation/engine";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CustomerCreatedCard({
  summary,
  callId,
}: {
  summary: SimulationSummary;
  callId: string;
}) {
  if (!summary.customerId) {
    return null;
  }

  const customerName = [summary.firstName, summary.lastName].filter(Boolean).join(" ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="size-5 text-primary" />
          {summary.isNewCustomer ? "Nouveau client ajoute" : "Client existant mis a jour"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-6">
        <div className="flex items-center gap-2">
          <Badge variant={summary.isNewCustomer ? "success" : "secondary"}>
            {summary.isNewCustomer ? "Nouveau client" : "Client existant"}
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Coordonnees</p>
            <p className="font-medium">{customerName || "Non communique"}</p>
            <p className="text-sm">{summary.phoneNumber}</p>
            {summary.email && <p className="text-sm">{summary.email}</p>}
            {(summary.address || summary.city) && (
              <p className="text-sm">
                {[summary.address, summary.city].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Historique des appels</p>
            <p className="font-medium">
              {summary.callHistoryCount} appel{summary.callHistoryCount > 1 ? "s" : ""} au total
            </p>
            <Link href={`/calls/${callId}`} className="text-sm text-primary hover:underline">
              Voir cet appel dans l&apos;historique
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
