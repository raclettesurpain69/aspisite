"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { updateQuestionsAction } from "@/lib/actions/assistant-settings";
import type { AssistantQuestion } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function makeQuestionId() {
  return `question-${Math.random().toString(36).slice(2, 10)}`;
}

export function QuestionsTab({ questions: initialQuestions }: { questions: AssistantQuestion[] }) {
  const [questions, setQuestions] = useState<AssistantQuestion[]>(initialQuestions);
  const [newLabel, setNewLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateQuestion(id: string, patch: Partial<AssistantQuestion>) {
    setQuestions((current) => current.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function removeQuestion(id: string) {
    setQuestions((current) => current.filter((q) => q.id !== id));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    setQuestions((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = current.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addQuestion() {
    const label = newLabel.trim();
    if (!label) return;
    setQuestions((current) => [
      ...current,
      { id: makeQuestionId(), label, required: false, enabled: true },
    ]);
    setNewLabel("");
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateQuestionsAction({ questions });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Questions enregistrees.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Questions obligatoires</CardTitle>
        <CardDescription>
          Ajoutez, retirez, reordonnez et activez/desactivez les questions posees par
          l&apos;assistant. L&apos;ordre de la liste est l&apos;ordre utilise pendant l&apos;appel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        <div className="space-y-3">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="flex flex-wrap items-center gap-3 rounded-md border p-3"
            >
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={index === 0}
                  onClick={() => moveQuestion(index, -1)}
                  aria-label="Monter"
                >
                  <ArrowUp className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={index === questions.length - 1}
                  onClick={() => moveQuestion(index, 1)}
                  aria-label="Descendre"
                >
                  <ArrowDown className="size-3" />
                </Button>
              </div>

              <Input
                value={question.label}
                onChange={(event) => updateQuestion(question.id, { label: event.target.value })}
                className="min-w-40 flex-1"
              />

              <div className="flex items-center gap-2">
                <Switch
                  id={`${question.id}-required`}
                  checked={question.required}
                  onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
                />
                <Label htmlFor={`${question.id}-required`} className="text-sm text-muted-foreground">
                  Obligatoire
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id={`${question.id}-enabled`}
                  checked={question.enabled}
                  onCheckedChange={(checked) => updateQuestion(question.id, { enabled: checked })}
                />
                <Label htmlFor={`${question.id}-enabled`} className="text-sm text-muted-foreground">
                  Activee
                </Label>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeQuestion(question.id)}
                aria-label="Supprimer"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {questions.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune question configuree.</p>
          )}
        </div>

        <div className="flex items-end gap-2 border-t pt-4">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="new-question">Nouvelle question</Label>
            <Input
              id="new-question"
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder="Ex: Budget"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addQuestion();
                }
              }}
            />
          </div>
          <Button variant="secondary" onClick={addQuestion}>
            Ajouter
          </Button>
        </div>

        <Button onClick={handleSave} disabled={isPending}>
          Enregistrer
        </Button>
      </CardContent>
    </Card>
  );
}
