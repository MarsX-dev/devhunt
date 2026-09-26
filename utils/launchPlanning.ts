import { FREE_WEEK_CAPACITY, type WeekCount, findNearestAvailableDate, weekKey } from '@/utils/launchWeeks';

export type SubmitType = 'free' | 'normal' | 'paid';

export interface PlannedWeek {
  week: number;
  startDate: string;
  endDate: string;
}

export type LaunchPlan =
  | { ok: true; launch: PlannedWeek; paidWeek: PlannedWeek | null }
  | { ok: false; error: string };

const toPlanned = (w: WeekCount): PlannedWeek => ({
  week: w.week,
  startDate: new Date(w.startDate).toISOString(),
  endDate: new Date(w.endDate).toISOString(),
});

// Decides where a newly submitted tool launches. `weeks` are upcoming weeks with their tool counts.
// - normal: the chosen week if it still has a free slot, otherwise falls back to the free queue.
// - free:   the nearest week with a free slot.
// - paid:   parked in the nearest free slot until payment; the chosen week is kept as paidWeek and
//           applied by the payment activation.
export function planLaunch(weeks: WeekCount[], selectedWeekKey: string | undefined, submitType: SubmitType, now = new Date()): LaunchPlan {
  const selected = selectedWeekKey ? weeks.find(w => weekKey(w.startDate) === selectedWeekKey) : undefined;
  const nearestFree = findNearestAvailableDate(weeks.filter(w => new Date(w.startDate) > now), now);

  if (submitType === 'paid') {
    if (!selected || new Date(selected.startDate) <= now) return { ok: false, error: 'Please pick an upcoming launch week.' };
    return { ok: true, launch: toPlanned(nearestFree ?? selected), paidWeek: toPlanned(selected) };
  }

  if (submitType === 'normal' && selected && selected.count < FREE_WEEK_CAPACITY && new Date(selected.startDate) > now) {
    return { ok: true, launch: toPlanned(selected), paidWeek: null };
  }

  if (!nearestFree) return { ok: false, error: 'No free launch weeks are available right now. Please choose a paid launch.' };
  return { ok: true, launch: toPlanned(nearestFree), paidWeek: null };
}

// The week a paid launch goes live in: the paid-for week if it hasn't started yet, otherwise the next week.
export function resolvePaidWeek(paidWeek: PlannedWeek | null, upcomingWeeks: WeekCount[], now = new Date()): PlannedWeek | null {
  if (paidWeek && new Date(paidWeek.startDate) > now) return paidWeek;
  const next = upcomingWeeks.filter(w => new Date(w.startDate) > now).sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate))[0];
  return next ? toPlanned(next) : null;
}

// Stripe marks a $0 checkout (100% promo code) as 'no_payment_required'; both count as paid.
export const isCheckoutPaid = (session: { status?: string | null; payment_status?: string | null }) =>
  session.status === 'complete' && (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');
