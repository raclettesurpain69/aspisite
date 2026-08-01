import Link from "next/link";

import { getCurrentUserCompany } from "@/lib/data/company";
import { listCalls } from "@/lib/data/calls";
import { formatDuration } from "@/lib/utils";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const URGENCY_LABELS: Record<string, string> = {
  low: "Faible",
  normal: "Normale",
  high: "Elevee",
  critical: "Critique",
};

export default async function CallsPage() {
  const company = await getCurrentUserCompany();
  const calls = company ? await listCalls(company.id) : [];

  return (
    <>
      <Topbar title="Historique des appels" />
      <main className="flex-1 space-y-6 p-6">
        <Input
          placeholder="Rechercher un client, un telephone, un sujet... (etape 5)"
          className="max-w-sm"
          disabled
        />

        <Card>
          <CardHeader>
            <CardTitle>Appels</CardTitle>
            {calls.length === 0 && (
              <CardDescription>
                Recherche, filtres et tri seront actives a l&apos;etape 5.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pb-6">
            {calls.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun appel pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Date</th>
                      <th className="py-2 pr-4 font-medium">Source</th>
                      <th className="py-2 pr-4 font-medium">Client</th>
                      <th className="py-2 pr-4 font-medium">Telephone</th>
                      <th className="py-2 pr-4 font-medium">Sujet</th>
                      <th className="py-2 pr-4 font-medium">Duree</th>
                      <th className="py-2 pr-4 font-medium">Urgence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((call) => (
                      <tr key={call.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          <Link href={`/calls/${call.id}`} className="hover:underline">
                            {new Date(call.createdAt).toLocaleString("fr-FR")}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">
                          {call.isSimulated ? (
                            <Badge variant="outline">Simulation</Badge>
                          ) : (
                            <span className="text-muted-foreground">Twilio</span>
                          )}
                        </td>
                        <td className="py-2 pr-4">{call.customerName ?? "—"}</td>
                        <td className="py-2 pr-4">{call.fromNumber}</td>
                        <td className="py-2 pr-4">{call.reason ?? "—"}</td>
                        <td className="py-2 pr-4">
                          {call.durationSeconds !== null ? formatDuration(call.durationSeconds) : "—"}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge
                            variant={
                              call.urgency === "critical" || call.urgency === "high"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {URGENCY_LABELS[call.urgency] ?? call.urgency}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
