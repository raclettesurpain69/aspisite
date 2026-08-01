"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateGreetingAction } from "@/lib/actions/assistant-settings";
import { renderGreeting } from "@/lib/ai/greeting";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function GreetingTab({
  greetingMessage: initialGreetingMessage,
  companyName,
}: {
  greetingMessage: string;
  companyName: string;
}) {
  const [greetingMessage, setGreetingMessage] = useState(initialGreetingMessage);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateGreetingAction({ greetingMessage });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Message d'accueil enregistre.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message d&apos;accueil</CardTitle>
        <CardDescription>
          Utilisez <code className="rounded bg-muted px-1">{"{{entreprise}}"}</code> pour inserer le
          nom de l&apos;entreprise.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        <div className="space-y-1.5">
          <Label htmlFor="greeting-message">Modele du message</Label>
          <Textarea
            id="greeting-message"
            rows={4}
            value={greetingMessage}
            onChange={(event) => setGreetingMessage(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Apercu en temps reel</Label>
          <div className="rounded-md border bg-muted/50 p-4 text-sm italic">
            &laquo; {renderGreeting(greetingMessage, companyName || "l'entreprise")} &raquo;
          </div>
        </div>

        <Button onClick={handleSave} disabled={isPending}>
          Enregistrer
        </Button>
      </CardContent>
    </Card>
  );
}
