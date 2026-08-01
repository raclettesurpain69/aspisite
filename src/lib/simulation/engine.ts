import { randomUUID } from "node:crypto";

import { getAIProvider } from "@/lib/ai";
import type { CompanyAIContext, ConversationMessage } from "@/lib/ai/types";
import { getScenarioById, type ScenarioId } from "@/lib/ai/scenarios";
import { getCompanyById } from "@/lib/calls/company-lookup";
import { getCompanyAIContext, isTestModeEnabled } from "@/lib/calls/context";
import { MAX_CUSTOMER_TURNS } from "@/lib/calls/constants";
import { finalizeCall } from "@/lib/calls/finalize";
import { logCallEvent } from "@/lib/calls/log";
import { conversationToJson } from "@/lib/calls/transcript";
import { withTiming } from "@/lib/calls/timing";
import { createServiceRoleClient } from "@/lib/supabase/server";

const CLOSING_MESSAGE =
  "Merci pour ces informations. L'entreprise revient vers vous rapidement. Bonne journee !";
const TECHNICAL_ISSUE_MESSAGE =
  "Je rencontre une difficulte technique. L'entreprise vous rappellera des que possible.";
const ACTIVE_STATUSES = new Set(["incoming", "answered"]);

/**
 * Reutilise le meme AIProvider/CompanyAIContext que le pipeline Twilio
 * reel, en ajoutant simplement l'instruction du scenario aux "questions
 * specifiques au metier" deja prevues par l'architecture (voir
 * ai/claude.ts) : aucune modification de AIProvider n'est necessaire pour
 * brancher un jour une vraie conversation Twilio a la place.
 */
async function buildContext(companyId: string, scenarioId: ScenarioId): Promise<CompanyAIContext> {
  const company = await getCompanyById(companyId);
  if (!company) {
    throw new Error("Entreprise introuvable.");
  }

  const baseContext = await getCompanyAIContext(companyId, company.name, company.businessType);
  const scenario = getScenarioById(scenarioId);

  if (!scenario) {
    return baseContext;
  }

  return {
    ...baseContext,
    customQuestions: [...baseContext.customQuestions, scenario.aiInstruction],
  };
}

export type SimulationSummary = {
  status: string;
  urgency: string;
  reason: string | null;
  summaryText: string | null;
  recommendedAction: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  qualificationScore: number | null;
  qualificationReason: string | null;
  customerId: string | null;
  isNewCustomer: boolean;
  callHistoryCount: number;
};

async function finalizeSimulation(params: {
  callId: string;
  companyId: string;
  fromNumber: string;
  conversation: ConversationMessage[];
  context: CompanyAIContext;
  testMode: boolean;
}): Promise<SimulationSummary> {
  const { callId, companyId, fromNumber, conversation, context, testMode } = params;

  const hasCustomerSpeech = conversation.some((turn) => turn.role === "customer");
  const status = hasCustomerSpeech ? "completed" : "voicemail";

  const result = await finalizeCall({
    callId,
    companyId,
    fromNumber,
    conversation,
    context,
    status,
    testMode,
  });

  await logCallEvent({
    companyId,
    callId,
    eventType: "simulation.completed",
    message: "Simulation terminee, resume genere.",
  });

  let callHistoryCount = 0;
  if (result.customerId) {
    const supabase = createServiceRoleClient();
    const { count } = await supabase
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", result.customerId);
    callHistoryCount = count ?? 0;
  }

  const summary = result.summary;

  return {
    status,
    urgency: summary?.urgency ?? "normal",
    reason: summary?.reason ?? null,
    summaryText: summary?.summaryText ?? null,
    recommendedAction: summary?.recommendedAction ?? null,
    firstName: summary?.firstName ?? null,
    lastName: summary?.lastName ?? null,
    phoneNumber: summary?.phoneNumber ?? null,
    email: summary?.email ?? null,
    address: summary?.address ?? null,
    city: summary?.city ?? null,
    qualificationScore: summary?.qualificationScore ?? null,
    qualificationReason: summary?.qualificationReason ?? null,
    customerId: result.customerId,
    isNewCustomer: result.isNewCustomer,
    callHistoryCount,
  };
}

export async function startSimulation(
  companyId: string,
  scenarioId: ScenarioId
): Promise<{ callId: string; conversation: ConversationMessage[] }> {
  const context = await buildContext(companyId, scenarioId);
  const conversation: ConversationMessage[] = [{ role: "assistant", content: context.greeting }];

  const supabase = createServiceRoleClient();

  const { data: primaryNumber } = await supabase
    .from("company_phone_numbers")
    .select("phone_number")
    .eq("company_id", companyId)
    .eq("is_primary", true)
    .maybeSingle();

  // Identifiant unique par session : si le client simule ne communique pas
  // de numero pendant la conversation, chaque simulation cree malgre tout
  // un client distinct (plutot que de reutiliser toujours la meme fiche
  // "Simulation"), pour une demo repetable et credible.
  const simulatedFromNumber = `Simulation-${randomUUID().slice(0, 8)}`;

  const { data: call, error } = await supabase
    .from("calls")
    .insert({
      company_id: companyId,
      from_number: simulatedFromNumber,
      to_number: primaryNumber?.phone_number ?? "Simulation",
      status: "answered",
      is_simulated: true,
      conversation: conversationToJson(conversation),
    })
    .select("id")
    .single();

  if (error || !call) {
    throw new Error(error?.message ?? "Impossible de creer la simulation.");
  }

  await logCallEvent({
    companyId,
    callId: call.id,
    eventType: "simulation.started",
    message: `Simulation demarree (scenario : ${getScenarioById(scenarioId)?.label ?? scenarioId})`,
    metadata: { scenarioId },
  });

  return { callId: call.id, conversation };
}

export async function continueSimulation(params: {
  callId: string;
  companyId: string;
  scenarioId: ScenarioId;
  customerMessage: string;
}): Promise<{ assistantMessage: string; done: boolean; summary: SimulationSummary | null }> {
  const { callId, companyId, scenarioId, customerMessage } = params;
  const supabase = createServiceRoleClient();

  const { data: call } = await supabase
    .from("calls")
    .select("id, company_id, from_number, conversation, is_simulated, status")
    .eq("id", callId)
    .maybeSingle();

  if (!call || call.company_id !== companyId || !call.is_simulated) {
    throw new Error("Simulation introuvable.");
  }
  if (!ACTIVE_STATUSES.has(call.status)) {
    throw new Error("Cette simulation est deja terminee.");
  }

  const testMode = await isTestModeEnabled(companyId);
  const context = await buildContext(companyId, scenarioId);
  const conversation = ((call.conversation as ConversationMessage[] | null) ?? []).slice();
  conversation.push({ role: "customer", content: customerMessage });

  await logCallEvent({
    companyId,
    callId,
    eventType: "simulation.message",
    message: `Message client (simulation) : "${customerMessage}"`,
    metadata: { role: "customer" },
  });

  const customerTurns = conversation.filter((turn) => turn.role === "customer").length;

  if (customerTurns >= MAX_CUSTOMER_TURNS) {
    conversation.push({ role: "assistant", content: CLOSING_MESSAGE });
    await supabase.from("calls").update({ conversation: conversationToJson(conversation) }).eq("id", callId);
    const summary = await finalizeSimulation({
      callId,
      companyId,
      fromNumber: call.from_number,
      conversation,
      context,
      testMode,
    });
    return { assistantMessage: CLOSING_MESSAGE, done: true, summary };
  }

  try {
    const nextLine = await withTiming(
      { testMode, companyId, callId, provider: "Claude", action: "generate_response" },
      () => getAIProvider().generateResponse(conversation, context)
    );
    conversation.push({ role: "assistant", content: nextLine });
    await supabase.from("calls").update({ conversation: conversationToJson(conversation) }).eq("id", callId);
    await logCallEvent({
      companyId,
      callId,
      eventType: "simulation.message",
      message: "Reponse IA (simulation) generee.",
      metadata: { role: "assistant" },
    });
    return { assistantMessage: nextLine, done: false, summary: null };
  } catch (error) {
    await logCallEvent({
      companyId,
      callId,
      level: "error",
      eventType: "ai.generate_response_failed",
      message: error instanceof Error ? error.message : String(error),
    });
    conversation.push({ role: "assistant", content: TECHNICAL_ISSUE_MESSAGE });
    await supabase.from("calls").update({ conversation: conversationToJson(conversation) }).eq("id", callId);
    const summary = await finalizeSimulation({
      callId,
      companyId,
      fromNumber: call.from_number,
      conversation,
      context,
      testMode,
    });
    return { assistantMessage: TECHNICAL_ISSUE_MESSAGE, done: true, summary };
  }
}

export async function endSimulationNow(params: {
  callId: string;
  companyId: string;
  scenarioId: ScenarioId;
}): Promise<SimulationSummary> {
  const { callId, companyId, scenarioId } = params;
  const supabase = createServiceRoleClient();

  const { data: call } = await supabase
    .from("calls")
    .select("id, company_id, from_number, conversation, is_simulated, status")
    .eq("id", callId)
    .maybeSingle();

  if (!call || call.company_id !== companyId || !call.is_simulated) {
    throw new Error("Simulation introuvable.");
  }
  if (!ACTIVE_STATUSES.has(call.status)) {
    throw new Error("Cette simulation est deja terminee.");
  }

  const testMode = await isTestModeEnabled(companyId);
  const context = await buildContext(companyId, scenarioId);
  const conversation = (call.conversation as ConversationMessage[] | null) ?? [];

  return finalizeSimulation({
    callId,
    companyId,
    fromNumber: call.from_number,
    conversation,
    context,
    testMode,
  });
}
