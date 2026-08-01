"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { replaceFaqEntriesAction } from "@/lib/actions/assistant-settings";
import type { AssistantFaqEntry } from "@/lib/data/assistant-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DraftEntry = {
  key: string;
  question: string;
  answer: string;
  isEnabled: boolean;
};

function toDraft(entry: AssistantFaqEntry): DraftEntry {
  return { key: entry.id, question: entry.question, answer: entry.answer, isEnabled: entry.isEnabled };
}

function makeKey() {
  return `faq-${Math.random().toString(36).slice(2, 10)}`;
}

export function FaqTab({ faq: initialFaq }: { faq: AssistantFaqEntry[] }) {
  const [entries, setEntries] = useState<DraftEntry[]>(() => initialFaq.map(toDraft));
  const [isPending, startTransition] = useTransition();

  function updateEntry(key: string, patch: Partial<DraftEntry>) {
    setEntries((current) => current.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)));
  }

  function removeEntry(key: string) {
    setEntries((current) => current.filter((entry) => entry.key !== key));
  }

  function addEntry() {
    setEntries((current) => [
      ...current,
      { key: makeKey(), question: "", answer: "", isEnabled: true },
    ]);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await replaceFaqEntriesAction({
        entries: entries.map(({ question, answer, isEnabled }) => ({ question, answer, isEnabled })),
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("FAQ enregistree.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>FAQ</CardTitle>
        <CardDescription>
          Questions/reponses frequentes que l&apos;assistant pourra utiliser pendant l&apos;appel
          (ex: &laquo; Combien coute un deplacement ? &raquo;).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div key={entry.key} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Entree {index + 1}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`${entry.key}-enabled`}
                      checked={entry.isEnabled}
                      onCheckedChange={(checked) => updateEntry(entry.key, { isEnabled: checked })}
                    />
                    <Label htmlFor={`${entry.key}-enabled`} className="text-sm text-muted-foreground">
                      Activee
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEntry(entry.key)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${entry.key}-question`}>Question</Label>
                <Input
                  id={`${entry.key}-question`}
                  value={entry.question}
                  onChange={(event) => updateEntry(entry.key, { question: event.target.value })}
                  placeholder="Ex: Intervenez-vous le dimanche ?"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${entry.key}-answer`}>Reponse</Label>
                <Textarea
                  id={`${entry.key}-answer`}
                  value={entry.answer}
                  onChange={(event) => updateEntry(entry.key, { answer: event.target.value })}
                />
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune entree FAQ pour le moment.</p>
          )}
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={addEntry}>
            Ajouter une entree
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
