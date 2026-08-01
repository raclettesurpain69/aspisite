import { getCurrentUserCompany } from "@/lib/data/company";
import { Topbar } from "@/components/layout/topbar";
import { SimulationChat } from "@/components/test-call/simulation-chat";

export default async function TestCallPage() {
  const company = await getCurrentUserCompany();

  if (!company) {
    return (
      <>
        <Topbar title="Tester un appel IA" />
        <main className="flex-1 p-6 text-sm text-muted-foreground">
          Aucune entreprise rattachee a ce compte.
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar title="Tester un appel IA" subtitle={company.name} />
      <main className="flex-1 p-6">
        <SimulationChat />
      </main>
    </>
  );
}
