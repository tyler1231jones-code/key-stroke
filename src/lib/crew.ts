// Whether a crew unit is running right now. One function decides it, so a real
// status source can replace the schedule later.

export interface ScheduledUnit {
  unit: string;
  start: string; // "02:00"
  end: string; // "03:10"
  runDays: number[]; // 0 = Sunday
  demo?: boolean;
}

function zoneClock(zone: string, now: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: zone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * False while the unit is demo: the running mark is never shown for demo data.
 * Otherwise true when the time in the site zone is inside the window of the
 * unit on one of its run days.
 */
export function isRunning(unit: ScheduledUnit, zone = 'Australia/Brisbane', now: Date = new Date()): boolean {
  if (unit.demo) return false;
  const { day, minutes } = zoneClock(zone, now);
  if (!unit.runDays.includes(day)) return false;
  return minutes >= toMinutes(unit.start) && minutes < toMinutes(unit.end);
}
