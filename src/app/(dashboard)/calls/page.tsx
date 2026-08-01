import { Topbar } from "@/components/layout/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CallsPage() {
  return (
    <>
      <Topbar title="Historique des appels" />
      <main className="flex-1 space-y-6 p-6">
        <Input
          placeholder="Rechercher un client, un telephone, un sujet..."
          className="max-w-sm"
        />

        <Card>
          <CardHeader>
            <CardTitle>Appels</CardTitle>
            <CardDescription>
              Le tableau (recherche, filtres, tri) sera branche a la table
              `calls` a l&apos;etape 5.
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
