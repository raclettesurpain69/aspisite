import { PhoneCall, UserPlus, AlertTriangle, Timer, Sparkles, Clock } from "lucide-react";

import { getCurrentUserCompany } from "@/lib/data/company";
import { getDashboardStats, getAICallsSummary } from "@/lib/data/dashboard";
import { formatDuration, formatMinutes } from "@/lib/utils";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const URGENCY_LABELS: Record<string, string> = {
  low: "Faible",
  normal: "Normale",
  high: "Elevee",
  critical: "Critique",
};

export default async function DashboardPage() {
  const company = await getCurrentUserCompany();

  if (!company) {
    return (
      <>
        <Topbar title="Tableau de bord" />
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration de l&apos;entreprise incomplete</CardTitle>
              <CardDescription>
                Votre compte n&apos;est rattache a aucune entreprise. Contactez
                le support si le probleme persiste.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </>
    );
  }

  const stats = await getDashboardStats(company.id);
  const aiCallsSummary = await getAICallsSummary(company.id);

  const statCards = [
    { label: "Appels IA aujourd'hui", value: stats.callsToday, icon: PhoneCall },
    { label: "Nouveaux clients", value: stats.newCustomersToday, icon: UserPlus },
    { label: "Urgences", value: stats.urgentToday, icon: AlertTriangle },
    {
      label: "Duree moyenne",
      value: stats.averageDurationSeconds ? formatDuration(stats.averageDurationSeconds) : "—",
      icon: Timer,
    },
  ];

  return (
    <>
      <Topbar title="Tableau de bord" subtitle={company.name} />
      <main className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                  <CardDescription>{stat.label}</CardDescription>
                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4" />
              Appels IA traites
            </CardTitle>
            <CardDescription>Depuis la mise en service, appels reels et simules.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pb-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Appels reels (Twilio)</p>
              <p className="text-2xl font-semibold">{aiCallsSummary.realCalls}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Appels simules (demo)</p>
              <p className="text-2xl font-semibold">{aiCallsSummary.simulatedCalls}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="size-3.5" />
                Temps economise estime
              </p>
              <p className="text-2xl font-semibold">
                {formatMinutes(aiCallsSummary.estimatedMinutesSaved)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Derniers appels</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            {stats.recentCalls.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun appel pour le moment. Ils apparaitront ici des que votre
                assistant telephonique commencera a repondre (etape 3).
              </p>
            ) : (
              <ul className="divide-y">
                {stats.recentCalls.map((call) => (
                  <li key={call.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{call.customerName ?? call.fromNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {call.reason ?? "Motif non precise"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          call.urgency === "critical" || call.urgency === "high"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {URGENCY_LABELS[call.urgency] ?? call.urgency}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(call.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
