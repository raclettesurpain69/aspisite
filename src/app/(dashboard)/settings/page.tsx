import { getCurrentUserCompany } from "@/lib/data/company";
import { getCompanySettings } from "@/lib/data/settings";
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
            <CardTitle>Configuration IA</CardTitle>
            <CardDescription>
              Message d&apos;accueil et questions personnalisees par metier.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <div>
              <p className="text-sm text-muted-foreground">Message d&apos;accueil</p>
              <p>{data.settings.greetingMessage}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Questions personnalisees</p>
              {data.settings.customQuestions.length > 0 ? (
                <ul className="list-inside list-disc">
                  {data.settings.customQuestions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              ) : (
                <p>Aucune question personnalisee.</p>
              )}
            </div>
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
      </main>
    </>
  );
}
