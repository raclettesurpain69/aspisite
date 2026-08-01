"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateCallGoalsAction } from "@/lib/actions/assistant-settings";
import { CALL_GOALS } from "@/lib/ai/assistant-options";
import type { CallGoal } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function GoalsTab({ callGoals: initialCallGoals }: { callGoals: CallGoal[] }) {
  const [selected, setSelected] = useState<Set<CallGoal>>(new Set(initialCallGoals));
  const [isPending, startTransition] = useTransition();

  function toggle(goal: CallGoal, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(goal);
      } else {
        next.delete(goal);
      }
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateCallGoalsAction({ callGoals: Array.from(selected) });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Objectifs d'appel enregistres.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Objectifs de l&apos;appel</CardTitle>
        <CardDescription>
          Que doit accomplir l&apos;assistant pendant l&apos;appel ? Plusieurs objectifs peuvent
          etre selectionnes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        <div className="space-y-3">
          {CALL_GOALS.map((option) => (
            <div key={option.value} className="flex items-center gap-3">
              <Switch
                id={`goal-${option.value}`}
                checked={selected.has(option.value)}
                onCheckedChange={(checked) => toggle(option.value, checked)}
              />
              <Label htmlFor={`goal-${option.value}`} className="cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={isPending}>
          Enregistrer
        </Button>
      </CardContent>
    </Card>
  );
}
