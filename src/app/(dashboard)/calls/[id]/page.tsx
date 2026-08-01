import { Topbar } from "@/components/layout/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <Topbar title="Fiche appel" />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Appel {id}</CardTitle>
            <CardDescription>
              Informations client, audio, transcription et resume IA seront
              charges depuis Supabase a l&apos;etape 5.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6 text-sm text-muted-foreground">
            Cette fiche n&apos;est pas encore disponible.
          </CardContent>
        </Card>
      </main>
    </>
  );
}
