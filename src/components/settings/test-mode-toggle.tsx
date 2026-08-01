"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setTestModeAction } from "@/lib/actions/settings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function TestModeToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    setEnabled(checked);
    startTransition(async () => {
      const result = await setTestModeAction(checked);
      if (result.error) {
        setEnabled(!checked);
        toast.error(result.error);
      } else {
        toast.success(checked ? "Mode test active" : "Mode test desactive");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Switch
        id="test-mode"
        checked={enabled}
        onCheckedChange={handleChange}
        disabled={isPending}
      />
      <Label htmlFor="test-mode" className="cursor-pointer">
        {enabled ? "Active" : "Desactive"}
      </Label>
    </div>
  );
}
