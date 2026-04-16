/** AvailabilitySlot as returned by API (startTime/endTime may be "08:00" or "08:00:00") */
export interface AvailabilitySlot {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
  member?: { id: number; fullName?: string };
}

/** POST/PUT body - matches backend AvailabilityCreateDto */
export interface AvailabilityCreateDto {
  memberId: number;
  dayOfWeek: number;
  startTime: string;  // "08:00" or "08:00:00"
  endTime: string;
  active: boolean;
}

/** 1=Lundi ... 7=Dimanche */
export const DAYS_OF_WEEK: { value: number; label: string }[] = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

export function dayLabel(dayOfWeek: number): string {
  return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label ?? String(dayOfWeek);
}

/** Normalize "08:00:00" -> "08:00" for time input value */
export function toTimeInputValue(t: string | undefined): string {
  if (!t) return '';
  return t.slice(0, 5);
}
