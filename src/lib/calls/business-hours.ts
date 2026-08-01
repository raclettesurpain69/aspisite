/**
 * Horaires d'ouverture d'une entreprise, stockes dans `companies.business_hours`
 * (jsonb). Logique volontairement independante de tout SDK cote serveur
 * (Intl.DateTimeFormat suffit) pour rester utilisable aussi bien dans
 * getCompanyAIContext() (serveur) que dans l'editeur d'horaires (client).
 */
export interface DaySchedule {
  enabled: boolean;
  open?: string; // "HH:mm"
  close?: string; // "HH:mm"
}

export interface VacationMode {
  enabled: boolean;
  until?: string; // "YYYY-MM-DD"
  message?: string;
}

export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
  /** Dates ISO ("YYYY-MM-DD") fermees meme un jour normalement ouvert. */
  holidays: string[];
  vacationMode: VacationMode;
}

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { enabled: true, open: "08:00", close: "18:00" },
  tuesday: { enabled: true, open: "08:00", close: "18:00" },
  wednesday: { enabled: true, open: "08:00", close: "18:00" },
  thursday: { enabled: true, open: "08:00", close: "18:00" },
  friday: { enabled: true, open: "08:00", close: "18:00" },
  saturday: { enabled: false },
  sunday: { enabled: false },
  holidays: [],
  vacationMode: { enabled: false },
};

export const DAY_ORDER: Array<keyof Omit<BusinessHours, "holidays" | "vacationMode">> = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const DAY_LABELS: Record<(typeof DAY_ORDER)[number], string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

/**
 * `companies.business_hours` vaut `{}` tant que l'entreprise n'a jamais
 * ouvert l'onglet Horaires : on distingue "pas encore configure" (defauts
 * raisonnables) de "configure et ferme ce jour-la" via la presence de la
 * cle `monday`.
 */
export function resolveBusinessHours(raw: unknown): BusinessHours {
  if (raw && typeof raw === "object" && "monday" in raw) {
    return raw as BusinessHours;
  }
  return DEFAULT_BUSINESS_HOURS;
}

function getPartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    weekday: get("weekday").toLowerCase() as (typeof DAY_ORDER)[number],
    time: `${get("hour")}:${get("minute")}`,
    isoDate: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

/**
 * Determine si l'entreprise est actuellement ouverte, en tenant compte du
 * mode vacances et des jours feries en priorite sur les horaires
 * hebdomadaires.
 */
export function evaluateBusinessHours(
  hours: BusinessHours,
  timezone: string,
  now: Date = new Date()
): { isOpen: boolean; vacationMessage: string | null } {
  if (hours.vacationMode?.enabled) {
    return { isOpen: false, vacationMessage: hours.vacationMode.message ?? null };
  }

  const { weekday, time, isoDate } = getPartsInTimeZone(now, timezone);

  if (hours.holidays?.includes(isoDate)) {
    return { isOpen: false, vacationMessage: null };
  }

  const daySchedule = hours[weekday];
  if (!daySchedule?.enabled || !daySchedule.open || !daySchedule.close) {
    return { isOpen: false, vacationMessage: null };
  }

  const isOpen = time >= daySchedule.open && time <= daySchedule.close;
  return { isOpen, vacationMessage: null };
}
