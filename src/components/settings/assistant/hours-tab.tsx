"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { updateBusinessHoursAction } from "@/lib/actions/assistant-settings";
import { DAY_LABELS, DAY_ORDER, type BusinessHours } from "@/lib/calls/business-hours";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function HoursTab({
  businessHours: initialBusinessHours,
  timezone: initialTimezone,
}: {
  businessHours: BusinessHours;
  timezone: string;
}) {
  const [hours, setHours] = useState<BusinessHours>(initialBusinessHours);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [newHoliday, setNewHoliday] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateDay(day: (typeof DAY_ORDER)[number], patch: Partial<BusinessHours[typeof day]>) {
    setHours((current) => ({ ...current, [day]: { ...current[day], ...patch } }));
  }

  function addHoliday() {
    if (!newHoliday || hours.holidays.includes(newHoliday)) return;
    setHours((current) => ({ ...current, holidays: [...current.holidays, newHoliday].sort() }));
    setNewHoliday("");
  }

  function removeHoliday(date: string) {
    setHours((current) => ({ ...current, holidays: current.holidays.filter((d) => d !== date) }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateBusinessHoursAction({ businessHours: hours, timezone });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Horaires enregistres.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horaires</CardTitle>
        <CardDescription>
          En dehors des horaires, l&apos;IA adapte automatiquement son discours (elle informe le
          client au lieu de proposer un rendez-vous immediat).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pb-6">
        <div className="space-y-1.5 max-w-64">
          <Label htmlFor="timezone">Fuseau horaire</Label>
          <Input id="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} />
        </div>

        <div className="space-y-3">
          <Label>Jours d&apos;ouverture</Label>
          {DAY_ORDER.map((day) => (
            <div key={day} className="flex flex-wrap items-center gap-3">
              <Switch
                id={`day-${day}`}
                checked={hours[day].enabled}
                onCheckedChange={(checked) => updateDay(day, { enabled: checked })}
              />
              <Label htmlFor={`day-${day}`} className="w-24 cursor-pointer">
                {DAY_LABELS[day]}
              </Label>
              <Input
                type="time"
                value={hours[day].open ?? ""}
                disabled={!hours[day].enabled}
                onChange={(event) => updateDay(day, { open: event.target.value })}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">a</span>
              <Input
                type="time"
                value={hours[day].close ?? ""}
                disabled={!hours[day].enabled}
                onChange={(event) => updateDay(day, { close: event.target.value })}
                className="w-32"
              />
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Jours feries / fermetures exceptionnelles</Label>
          <div className="flex items-end gap-2">
            <Input
              type="date"
              value={newHoliday}
              onChange={(event) => setNewHoliday(event.target.value)}
              className="w-48"
            />
            <Button variant="secondary" onClick={addHoliday}>
              Ajouter
            </Button>
          </div>
          {hours.holidays.length > 0 ? (
            <ul className="space-y-1">
              {hours.holidays.map((date) => (
                <li key={date} className="flex items-center gap-2 text-sm">
                  {date}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => removeHoliday(date)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun jour ferie enregistre.</p>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch
              id="vacation-mode"
              checked={hours.vacationMode.enabled}
              onCheckedChange={(checked) =>
                setHours((current) => ({
                  ...current,
                  vacationMode: { ...current.vacationMode, enabled: checked },
                }))
              }
            />
            <Label htmlFor="vacation-mode" className="cursor-pointer">
              Mode vacances
            </Label>
          </div>
          {hours.vacationMode.enabled && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vacation-until">Retour prevu le</Label>
                <Input
                  id="vacation-until"
                  type="date"
                  value={hours.vacationMode.until ?? ""}
                  onChange={(event) =>
                    setHours((current) => ({
                      ...current,
                      vacationMode: { ...current.vacationMode, until: event.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="vacation-message">Message pendant les vacances</Label>
                <Textarea
                  id="vacation-message"
                  value={hours.vacationMode.message ?? ""}
                  onChange={(event) =>
                    setHours((current) => ({
                      ...current,
                      vacationMode: { ...current.vacationMode, message: event.target.value },
                    }))
                  }
                />
              </div>
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={isPending}>
          Enregistrer
        </Button>
      </CardContent>
    </Card>
  );
}
