import { RefreshCw } from "lucide-react";

import { getCurrentUserCompany } from "@/lib/data/company";
import { runAllDiagnostics } from "@/lib/diagnostics/checks";
import { Topbar } from "@/components/layout/topbar";
import { DiagnosticCard } from "@/components/diagnostics/diagnostic-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DiagnosticsPage() {
  const company = await getCurrentUserCompany();

  if (!company) {
    return (
      <>
        <Topbar title="Diagnostic" />
        <main className="flex-1 p-6 text-sm text-muted-foreground">
          Aucune entreprise rattachee a ce compte.
        </main>
      </>
    );
  }

  if (company.role === "member") {
    return (
      <>
        <Topbar title="Diagnostic" subtitle={company.name} />
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acces reserve</CardTitle>
              <CardDescription>
                Cette page expose des informations d&apos;infrastructure
                sensibles (URLs de webhooks, statut des cles API). Seuls
                les proprietaires et administrateurs y ont acces.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </>
    );
  }

  const checks = await runAllDiagnostics(company.id);
  const summary = {
    ok: checks.filter((c) => c.status === "ok").length,
    warning: checks.filter((c) => c.status === "warning").length,
    error: checks.filter((c) => c.status === "error").length,
  };

  return (
    <>
      <Topbar title="Diagnostic" subtitle={company.name} />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Etat du systeme</CardTitle>
              <CardDescription>
                {summary.error > 0
                  ? `${summary.error} probleme(s) bloquant(s) detecte(s).`
                  : summary.warning > 0
                    ? `${summary.warning} avertissement(s) a verifier.`
                    : "Tout est operationnel."}
              </CardDescription>
            </div>
            <form>
              <Button type="submit" variant="outline" size="sm">
                <RefreshCw className="size-4" />
                Actualiser
              </Button>
            </form>
          </CardHeader>
          <CardContent className="pb-6 text-sm text-muted-foreground">
            Ces verifications appellent reellement Supabase, Twilio, Claude
            et ElevenLabs a chaque chargement de cette page (lectures
            seules, cout negligeable).
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {checks.map((check) => (
            <DiagnosticCard key={check.id} check={check} />
          ))}
        </div>
      </main>
    </>
  );
}
