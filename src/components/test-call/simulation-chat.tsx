"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Sparkles, Send, PhoneOff, Phone } from "lucide-react";

import { CALL_SCENARIOS, type ScenarioId } from "@/lib/ai/scenarios";
import type { ConversationMessage } from "@/lib/ai/types";
import { estimateCollectedFields } from "@/lib/simulation/progress";
import {
  startSimulationAction,
  sendSimulationMessageAction,
  endSimulationAction,
} from "@/lib/actions/simulation";
import type { SimulationSummary } from "@/lib/simulation/engine";
import { formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConversationThread } from "@/components/test-call/conversation-thread";
import { CollectionProgress } from "@/components/test-call/collection-progress";
import { CallResultCard } from "@/components/test-call/call-result-card";
import { CustomerCreatedCard } from "@/components/test-call/customer-created-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const startedAtRef = useRef<number | null>(null);

  const scenario = CALL_SCENARIOS.find((s) => s.id === scenarioId) ?? CALL_SCENARIOS[0];
  const questionsAsked = Math.max(0, conversation.filter((t) => t.role === "assistant").length - 1);
  const collectedFields = estimateCollectedFields(conversation);

  useEffect(() => {
    if (phase !== "running") return;

    const interval = setInterval(() => {
      if (startedAtRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

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
      startedAtRef.current = Date.now();
      setElapsedSeconds(0);
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
    setElapsedSeconds(0);
    startedAtRef.current = null;
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

        {phase === "running" && (
          <CardContent className="space-y-4 border-t pt-6 pb-6">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              <span className="text-sm font-medium">Appel en cours...</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Duree</p>
                <p className="font-medium">{formatDuration(elapsedSeconds)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Questions posees</p>
                <p className="font-medium">{questionsAsked}</p>
              </div>
            </div>
            <CollectionProgress collected={collectedFields} />
          </CardContent>
        )}

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

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>
                {phase === "idle"
                  ? "Lancez une simulation pour voir l'assistant repondre comme lors d'un vrai appel."
                  : `Scenario : ${scenario.label}`}
              </CardDescription>
            </div>
            {phase === "running" && (
              <Badge variant="secondary" className="gap-1">
                <Phone className="size-3" />
                En cours
              </Badge>
            )}
            {phase === "done" && <Badge variant="success">Termine</Badge>}
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <ConversationThread
              conversation={conversation}
              isAssistantTyping={isPending && phase === "running"}
            />
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

        {phase === "done" && summary && (
          <>
            <CallResultCard summary={summary} />
            {callId && <CustomerCreatedCard summary={summary} callId={callId} />}
          </>
        )}
      </div>
    </div>
  );
}
