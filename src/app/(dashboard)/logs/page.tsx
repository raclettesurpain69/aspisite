import Link from "next/link";

import { getCurrentUserCompany } from "@/lib/data/company";
import { listCallLogs } from "@/lib/data/logs";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LEVEL_CONFIG: Record<string, { label: string; variant: "secondary" | "warning" | "destructive" | "outline" }> = {
  debug: { label: "Debug", variant: "outline" },
  info: { label: "Info", variant: "secondary" },
  warn: { label: "Avertissement", variant: "warning" },
  error: { label: "Erreur", variant: "destructive" },
};

function formatMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Object.keys(metadata).length === 0) {
    return null;
  }
  return JSON.stringify(metadata, null, 2);
}

export default async function LogsPage() {
  const company = await getCurrentUserCompany();

  if (!company) {
    return (
      <>
        <Topbar title="Journal systeme" />
        <main className="flex-1 p-6 text-sm text-muted-foreground">
          Aucune entreprise rattachee a ce compte.
        </main>
      </>
    );
  }

  const logs = await listCallLogs(company.id);

  return (
    <>
      <Topbar title="Journal systeme" subtitle={company.name} />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Evenements techniques</CardTitle>
            <CardDescription>
              Appels recus, tours de conversation, erreurs, enregistrements
              et notifications, dans l&apos;ordre chronologique (les plus
              recents en premier). Utile pour comprendre pourquoi un appel a
              echoue.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun evenement pour le moment.
              </p>
            ) : (
              <ul className="divide-y">
                {logs.map((log) => {
                  const levelConfig = LEVEL_CONFIG[log.level] ?? LEVEL_CONFIG.info;
                  const metadataText = formatMetadata(log.metadata);

                  return (
                    <li key={log.id} className="space-y-2 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={levelConfig.variant}>{levelConfig.label}</Badge>
                        <span className="font-mono text-xs text-muted-foreground">{log.eventType}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("fr-FR")}
                        </span>
                      </div>
                      <p className="text-sm">{log.message}</p>
                      {log.callId && (
                        <Link
                          href={`/calls/${log.callId}`}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          Voir l&apos;appel concerne
                        </Link>
                      )}
                      {metadataText && (
                        <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs text-muted-foreground">
                          {metadataText}
                        </pre>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
