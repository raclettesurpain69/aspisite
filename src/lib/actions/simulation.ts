"use server";

import { revalidatePath } from "next/cache";

import type { ConversationMessage } from "@/lib/ai/types";
import type { ScenarioId } from "@/lib/ai/scenarios";
import { getCurrentUserCompany } from "@/lib/data/company";
import {
  startSimulation,
  continueSimulation,
  endSimulationNow,
  type SimulationSummary,
} from "@/lib/simulation/engine";

type ActionResult<T> = T | { error: string };

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function startSimulationAction(
  scenarioId: ScenarioId
): Promise<ActionResult<{ callId: string; conversation: ConversationMessage[] }>> {
  const company = await getCurrentUserCompany();
  if (!company) {
    return { error: "Aucune entreprise associee a ce compte." };
  }

  try {
    return await startSimulation(company.id, scenarioId);
  } catch (error) {
    return { error: toErrorMessage(error) };
  }
}

export async function sendSimulationMessageAction(
  callId: string,
  scenarioId: ScenarioId,
  customerMessage: string
): Promise<ActionResult<{ assistantMessage: string; done: boolean; summary: SimulationSummary | null }>> {
  const company = await getCurrentUserCompany();
  if (!company) {
    return { error: "Aucune entreprise associee a ce compte." };
  }

  const trimmed = customerMessage.trim();
  if (!trimmed) {
    return { error: "Le message ne peut pas etre vide." };
  }

  try {
    const result = await continueSimulation({
      callId,
      companyId: company.id,
      scenarioId,
      customerMessage: trimmed,
    });
    if (result.done) {
      revalidatePath("/calls");
    }
    return result;
  } catch (error) {
    return { error: toErrorMessage(error) };
  }
}

export async function endSimulationAction(
  callId: string,
  scenarioId: ScenarioId
): Promise<ActionResult<SimulationSummary>> {
  const company = await getCurrentUserCompany();
  if (!company) {
    return { error: "Aucune entreprise associee a ce compte." };
  }

  try {
    const summary = await endSimulationNow({ callId, companyId: company.id, scenarioId });
    revalidatePath("/calls");
    return summary;
  } catch (error) {
    return { error: toErrorMessage(error) };
  }
}
