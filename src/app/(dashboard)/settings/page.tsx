import { getCurrentUserCompany } from "@/lib/data/company";
import { getCompanySettings } from "@/lib/data/settings";
import { formatDuration } from "@/lib/utils";
import Link from "next/link";

import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TestModeToggle } from "@/components/settings/test-mode-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PLAN_LABELS: Record<string, string> = {
  trial: "Essai gratuit",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

export default async function SettingsPage() {
  const company = await getCurrentUserCompany();

  if (!company) {
    return (
      <>
        <Topbar title="Parametres" />
        <main className="flex-1 p-6 text-sm text-muted-foreground">
          Aucune entreprise rattachee a ce compte.
        </main>
      </>
    );
  }

  const data = await getCompanySettings(company.id);

  return (
    <>
      <Topbar title="Parametres" subtitle={company.name} />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations entreprise</CardTitle>
            <CardDescription>Nom, secteur, adresse.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pb-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Nom</p>
              <p>{data.company.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Secteur</p>
              <p>{data.company.businessType ?? "Non renseigne"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Adresse</p>
              <p>
                {[data.company.address, data.company.city].filter(Boolean).join(", ") ||
                  "Non renseignee"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assistant IA</CardTitle>
            <CardDescription>
              Ton, message d&apos;accueil, questions, objectifs d&apos;appel, horaires et FAQ de
              l&apos;assistant telephonique.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4 pb-6">
            <p className="text-sm text-muted-foreground">
              Personnalisez entierement l&apos;assistant de votre entreprise, sans ecrire de prompt.
            </p>
            <Button asChild>
              <Link href="/settings/assistant">Configurer l&apos;assistant IA</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Canaux utilises pour recevoir les resumes d&apos;appel.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 pb-6">
            {data.settings.notificationChannels.map((channel) => (
              <Badge key={channel} variant="secondary">
                {CHANNEL_LABELS[channel] ?? channel}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Abonnement</CardTitle>
            <CardDescription>Plan actuel et usage du mois en cours.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pb-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p>
                {data.plan ? (PLAN_LABELS[data.plan.code] ?? data.plan.code) : "—"}
                {data.plan && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({data.plan.subscriptionStatus})
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Appels ce mois-ci</p>
              <p>
                {data.usage.callsThisPeriod}
                {data.plan && ` / ${data.plan.maxCallsPerMonth}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duree cumulee ce mois-ci</p>
              <p>{formatDuration(data.usage.totalDurationSeconds)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duree max. par appel</p>
              <p>{data.plan ? formatDuration(data.plan.maxCallDurationSeconds) : "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mode Test</CardTitle>
            <CardDescription>
              Quand actif, chaque etape d&apos;un appel (Twilio, Claude,
              ElevenLabs, Supabase) journalise son temps d&apos;execution
              dans le Journal systeme. A activer avant un appel de test,
              a desactiver ensuite pour eviter des logs superflus.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <TestModeToggle initialEnabled={data.settings.testMode} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
