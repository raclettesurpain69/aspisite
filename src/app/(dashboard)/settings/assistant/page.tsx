import { getCurrentUserCompany } from "@/lib/data/company";
import { getAssistantSettings } from "@/lib/data/assistant-settings";
import { Topbar } from "@/components/layout/topbar";
import { AssistantSettingsTabs } from "@/components/settings/assistant/assistant-settings-tabs";

export default async function AssistantSettingsPage() {
  const company = await getCurrentUserCompany();

  if (!company) {
    return (
      <>
        <Topbar title="Assistant IA" />
        <main className="flex-1 p-6 text-sm text-muted-foreground">
          Aucune entreprise rattachee a ce compte.
        </main>
      </>
    );
  }

  const data = await getAssistantSettings(company.id);

  return (
    <>
      <Topbar title="Assistant IA" subtitle={company.name} />
      <main className="flex-1 p-6">
        <AssistantSettingsTabs data={data} />
      </main>
    </>
  );
}
