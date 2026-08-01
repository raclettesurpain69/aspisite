"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, Send, PhoneOff } from "lucide-react";

import { CALL_SCENARIOS, type ScenarioId } from "@/lib/ai/scenarios";
import type { ConversationMessage } from "@/lib/ai/types";
import {
  startSimulationAction,
  sendSimulationMessageAction,
  endSimulationAction,
} from "@/lib/actions/simulation";
import type { SimulationSummary } from "@/lib/simulation/engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const URGENCY_LABELS: Record<string, string> = {
  low: "Faible",
  normal: "Normale",
  high: "Elevee",
  critical: "Critique",
};

type Phase = "idle" | "running" | "done";

export function SimulationChat() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>(CALL_SCENARIOS[0].id);
  const [phase, setPhase] = useState<Phase>("idle");
  const [callId, setCallId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [summary, setSummary] = useState<SimulationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const scenario = CALL_SCENARIOS.find((s) => s.id === scenarioId) ?? CALL_SCENARIOS[0];

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const result = await startSimulationAction(scenarioId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setCallId(result.callId);
      setConversation(result.conversation);
      setInputValue(scenario.suggestedOpeningMessage);
      setPhase("running");
    });
  }

  function handleSend() {
    if (!callId || !inputValue.trim()) return;
    const customerMessage = inputValue.trim();
    setError(null);
    setConversation((prev) => [...prev, { role: "customer", content: customerMessage }]);
    setInputValue("");

    startTransition(async () => {
      const result = await sendSimulationMessageAction(callId, scenarioId, customerMessage);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setConversation((prev) => [...prev, { role: "assistant", content: result.assistantMessage }]);
      if (result.done) {
        setSummary(result.summary);
        setPhase("done");
      }
    });
  }

  function handleEndCall() {
    if (!callId) return;
    setError(null);
    startTransition(async () => {
      const result = await endSimulationAction(callId, scenarioId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSummary(result);
      setPhase("done");
    });
  }

  function handleReset() {
    setPhase("idle");
    setCallId(null);
    setConversation([]);
    setInputValue("");
    setSummary(null);
    setError(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Scenario</CardTitle>
          <CardDescription>
            Choisissez le contexte de l&apos;appel simule.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pb-6">
          {CALL_SCENARIOS.map((s) => (
            <Button
              key={s.id}
              type="button"
              variant={s.id === scenarioId ? "default" : "outline"}
              className="justify-start"
              disabled={phase !== "idle"}
              onClick={() => setScenarioId(s.id)}
            >
              {s.label}
            </Button>
          ))}
          <p className="pt-2 text-sm text-muted-foreground">{scenario.description}</p>
        </CardContent>
        {phase === "idle" && (
          <CardFooter>
            <Button className="w-full" onClick={handleStart} disabled={isPending}>
              <Sparkles />
              {isPending ? "Demarrage..." : "Tester un appel IA"}
            </Button>
          </CardFooter>
        )}
        {phase !== "idle" && (
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={handleReset}>
              Nouvelle simulation
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          <CardDescription>
            {phase === "idle"
              ? "Lancez une simulation pour voir l'assistant repondre comme lors d'un vrai appel."
              : `Scenario : ${scenario.label}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          {conversation.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune conversation pour le moment.</p>
          ) : (
            <ul className="space-y-3">
              {conversation.map((turn, index) => (
                <li
                  key={index}
                  className={turn.role === "assistant" ? "flex justify-start" : "flex justify-end"}
                >
                  <div
                    className={
                      turn.role === "assistant"
                        ? "max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm"
                        : "max-w-[80%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                    }
                  >
                    <p className="mb-1 text-xs font-medium opacity-70">
                      {turn.role === "assistant" ? "Assistant IA" : "Client (vous)"}
                    </p>
                    {turn.content}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {phase === "done" && summary && (
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Resume de l&apos;appel</p>
                <Badge
                  variant={
                    summary.urgency === "critical" || summary.urgency === "high"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {URGENCY_LABELS[summary.urgency] ?? summary.urgency}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{summary.reason ?? "Motif non precise"}</p>
              <p className="text-sm whitespace-pre-wrap">{summary.summaryText}</p>
              {summary.recommendedAction && (
                <p className="text-sm">
                  <span className="font-medium">Action recommandee : </span>
                  {summary.recommendedAction}
                </p>
              )}
              {callId && (
                <Link href={`/calls/${callId}`} className="text-sm text-primary hover:underline">
                  Voir la fiche complete dans l&apos;historique des appels
                </Link>
              )}
            </div>
          )}
        </CardContent>
        {phase === "running" && (
          <CardFooter className="flex-col gap-2 border-t pt-6">
            <div className="flex w-full gap-2">
              <Input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Reponse du client..."
                disabled={isPending}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button onClick={handleSend} disabled={isPending || !inputValue.trim()}>
                <Send />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="self-end text-muted-foreground"
              onClick={handleEndCall}
              disabled={isPending}
            >
              <PhoneOff />
              Terminer l&apos;appel
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
