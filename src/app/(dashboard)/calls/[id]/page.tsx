import { notFound } from "next/navigation";

import { getCallDetail } from "@/lib/data/calls";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/utils";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { FakeAudioPlayer } from "@/components/calls/fake-audio-player";
import { QualificationScore } from "@/components/calls/qualification-score";
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

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const call = await getCallDetail(id);

  if (!call) {
    notFound();
  }

  let recordingUrl: string | null = null;
  if (call.recording) {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from(call.recording.storage_bucket)
      .createSignedUrl(call.recording.storage_path, 60 * 10);
    recordingUrl = data?.signedUrl ?? null;
  }

  const customerName = call.customer
    ? [call.customer.first_name, call.customer.last_name].filter(Boolean).join(" ")
    : null;

  return (
    <>
      <Topbar title="Fiche appel" />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>{customerName ?? call.from_number}</CardTitle>
                {call.is_simulated && <Badge variant="outline">Simulation</Badge>}
              </div>
              <CardDescription>
                {new Date(call.created_at).toLocaleString("fr-FR")}
                {call.duration_seconds !== null &&
                  ` · ${formatDuration(call.duration_seconds)}`}
              </CardDescription>
            </div>
            <Badge
              variant={
                call.urgency === "critical" || call.urgency === "high"
                  ? "destructive"
                  : "secondary"
              }
            >
              {URGENCY_LABELS[call.urgency] ?? call.urgency}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 pb-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Telephone</p>
              <p>{call.customer?.phone_number ?? call.from_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p>{call.customer?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Adresse</p>
              <p>
                {call.customer
                  ? [call.customer.address, call.customer.city].filter(Boolean).join(", ") || "—"
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Motif</p>
              <p>{call.reason ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <p className="capitalize">{call.status.replace("_", " ")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enregistrement audio</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            {call.is_simulated ? (
              <FakeAudioPlayer />
            ) : recordingUrl ? (
              <audio controls src={recordingUrl} className="w-full" />
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun enregistrement disponible.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transcription</CardTitle>
          </CardHeader>
          <CardContent className="pb-6 text-sm whitespace-pre-wrap text-muted-foreground">
            {call.transcription?.full_text ?? "Aucune transcription disponible."}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resume IA</CardTitle>
          </CardHeader>
          <CardContent className="pb-6 text-sm whitespace-pre-wrap text-muted-foreground">
            {call.summary_text ?? "Aucun resume disponible."}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score de qualification prospect</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <QualificationScore
              score={call.qualification_score}
              reason={call.qualification_reason}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
