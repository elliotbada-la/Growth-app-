/** Local-time date helpers. Dates are stored as YYYY-MM-DD in the user's own timezone. */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function today(): string {
  return toISODate(new Date());
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** The last `n` dates ending today, oldest first. */
export function lastNDays(n: number, endDate = today()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(endDate, -i));
  return out;
}

export function shortDayLabel(iso: string): string {
  return fromISODate(iso).toLocaleDateString(undefined, { weekday: 'short' });
}

export function shortDateLabel(iso: string): string {
  return fromISODate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function friendlyDate(iso: string): string {
  if (iso === today()) return 'Today';
  if (iso === addDays(today(), -1)) return 'Yesterday';
  return fromISODate(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

/** Hours between a bedtime and wake time (HH:MM strings), handling the midnight wrap. */
export function hoursBetween(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  if ([bh, bm, wh, wm].some((v) => Number.isNaN(v))) return 0;
  let minutes = wh * 60 + wm - (bh * 60 + bm);
  if (minutes <= 0) minutes += 24 * 60;
  return Math.round((minutes / 60) * 100) / 100;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
