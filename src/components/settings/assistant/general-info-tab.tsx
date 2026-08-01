"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateGeneralInfoAction } from "@/lib/actions/assistant-settings";
import { ASSISTANT_TONES, BUSINESS_TYPES } from "@/lib/ai/assistant-options";
import type { AssistantTone } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function GeneralInfoTab({
  companyName: initialCompanyName,
  businessType: initialBusinessType,
  tone: initialTone,
  language: initialLanguage,
  onCompanyNameChange,
}: {
  companyName: string;
  businessType: string;
  tone: AssistantTone;
  language: string;
  onCompanyNameChange?: (name: string) => void;
}) {
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [businessType, setBusinessType] = useState(initialBusinessType);
  const [tone, setTone] = useState<AssistantTone>(initialTone);
  const [language, setLanguage] = useState(initialLanguage);
  const [isPending, startTransition] = useTransition();

  function handleCompanyNameChange(value: string) {
    setCompanyName(value);
    onCompanyNameChange?.(value);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateGeneralInfoAction({ companyName, businessType, tone, language });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Informations generales enregistrees.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations generales</CardTitle>
        <CardDescription>
          Identite de l&apos;entreprise et style de l&apos;assistant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        <div className="space-y-1.5">
          <Label htmlFor="company-name">Nom de l&apos;entreprise</Label>
          <Input
            id="company-name"
            value={companyName}
            onChange={(event) => handleCompanyNameChange(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Secteur d&apos;activite</Label>
          <Select value={businessType} onValueChange={setBusinessType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Ton de l&apos;assistant</Label>
          <Select value={tone} onValueChange={(value) => setTone(value as AssistantTone)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSISTANT_TONES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="language">Langue principale</Label>
          <Input
            id="language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            placeholder="fr"
            className="max-w-32"
          />
        </div>

        <Button onClick={handleSave} disabled={isPending}>
          Enregistrer
        </Button>
      </CardContent>
    </Card>
  );
}
