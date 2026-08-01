import { PhoneCall, UserPlus, AlertTriangle, Timer } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stats = [
  { label: "Appels IA aujourd'hui", value: "—", icon: PhoneCall },
  { label: "Nouveaux clients", value: "—", icon: UserPlus },
  { label: "Urgences", value: "—", icon: AlertTriangle },
  { label: "Duree moyenne", value: "—", icon: Timer },
];

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Tableau de bord" />
      <main className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
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
            <CardTitle>Derniers appels</CardTitle>
            <CardDescription>
              Les statistiques et l&apos;historique des appels seront
              alimentes des l&apos;etape 2 (base de donnees) et l&apos;etape 3
              (integration Twilio).
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6 text-sm text-muted-foreground">
            Aucun appel pour le moment.
          </CardContent>
        </Card>
      </main>
    </>
  );
}
