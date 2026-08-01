"use client";

import { useState } from "react";

import type { AssistantSettingsData } from "@/lib/data/assistant-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralInfoTab } from "@/components/settings/assistant/general-info-tab";
import { GreetingTab } from "@/components/settings/assistant/greeting-tab";
import { QuestionsTab } from "@/components/settings/assistant/questions-tab";
import { GoalsTab } from "@/components/settings/assistant/goals-tab";
import { HoursTab } from "@/components/settings/assistant/hours-tab";
import { FaqTab } from "@/components/settings/assistant/faq-tab";

export function AssistantSettingsTabs({ data }: { data: AssistantSettingsData }) {
  const [companyName, setCompanyName] = useState(data.companyName);

  return (
    <Tabs defaultValue="general">
      <TabsList className="flex-wrap">
        <TabsTrigger value="general">Informations generales</TabsTrigger>
        <TabsTrigger value="greeting">Message d&apos;accueil</TabsTrigger>
        <TabsTrigger value="questions">Questions obligatoires</TabsTrigger>
        <TabsTrigger value="goals">Objectifs de l&apos;appel</TabsTrigger>
        <TabsTrigger value="hours">Horaires</TabsTrigger>
        <TabsTrigger value="faq">FAQ</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <GeneralInfoTab
          companyName={data.companyName}
          businessType={data.businessType}
          tone={data.tone}
          language={data.language}
          onCompanyNameChange={setCompanyName}
        />
      </TabsContent>

      <TabsContent value="greeting">
        <GreetingTab greetingMessage={data.greetingMessage} companyName={companyName} />
      </TabsContent>

      <TabsContent value="questions">
        <QuestionsTab questions={data.questions} />
      </TabsContent>

      <TabsContent value="goals">
        <GoalsTab callGoals={data.callGoals} />
      </TabsContent>

      <TabsContent value="hours">
        <HoursTab businessHours={data.businessHours} timezone={data.timezone} />
      </TabsContent>

      <TabsContent value="faq">
        <FaqTab faq={data.faq} />
      </TabsContent>
    </Tabs>
  );
}
