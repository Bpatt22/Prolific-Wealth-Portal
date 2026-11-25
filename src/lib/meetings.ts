// Parsing and display for iClosed strategy-call bookings, which n8n writes to
// the GHL custom fields Strategy Call Time / Lead Timezone and the portal
// mirrors into contacts.custom_fields.
//
// Strategy Call Time arrives in two formats:
//   - "MM-DD-YYYY hh:mm AM/PM" with no offset: the LEAD'S local wall-clock
//     time, interpreted in Lead Timezone (an IANA name such as America/New_York).
//   - "2026-10-16T01:30:00.000Z": an ISO UTC instant (older rows).
// No external date/timezone package: Intl.DateTimeFormat does the zone maths.

export type Meeting = {
  id: string;
  name: string;
  /** Instant used for sorting and the Upcoming/Past split. */
  startsAt: Date;
  /** e.g. "Tue, Nov 3, 3:30 PM EST", or "Tue, Nov 3, 3:30 PM" when the zone is unknown. */
  when: string;
  /** IANA zone shown under the time, or "timezone unknown". */
  zoneLabel: string;
  status: string;
  closer: string;
};

const WALL_CLOCK = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T/;

function validZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// How far the zone is ahead of UTC at the given instant, in ms.
function zoneOffsetMs(instantMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(instantMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(instantMs / 1000) * 1000;
}

// Converts a wall-clock time in `tz` to the real instant. Two passes handle
// offsets that differ between the guess and the result (DST edges).
function wallClockToInstant(y: number, mo: number, d: number, h: number, mi: number, tz: string): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let t = guess - zoneOffsetMs(guess, tz);
  const second = zoneOffsetMs(t, tz);
  t = guess - second;
  return new Date(t);
}

type Parsed = { instant: Date; zoneKnown: boolean; tz: string | null; wallClockOnly: boolean } | null;

function parseStrategyCallTime(raw: string, tzRaw: string): Parsed {
  const tz = tzRaw && validZone(tzRaw) ? tzRaw : null;

  const wc = WALL_CLOCK.exec(raw.trim());
  if (wc) {
    const mo = Number(wc[1]);
    const d = Number(wc[2]);
    const y = Number(wc[3]);
    let h = Number(wc[4]);
    const mi = Number(wc[5]);
    if (mo < 1 || mo > 12 || h < 1 || h > 12 || mi > 59) return null;
    h = (h % 12) + (wc[6].toUpperCase() === "PM" ? 12 : 0);
    const check = new Date(Date.UTC(y, mo - 1, d));
    if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
    if (tz) return { instant: wallClockToInstant(y, mo, d, h, mi, tz), zoneKnown: true, tz, wallClockOnly: false };
    // Zone unknown: we do not guess it. The wall-clock fields are kept as-is
    // for display; the UTC reading below is used only to order and bucket the row.
    return { instant: new Date(Date.UTC(y, mo - 1, d, h, mi)), zoneKnown: false, tz: null, wallClockOnly: true };
  }

  if (ISO_INSTANT.test(raw.trim())) {
    const instant = new Date(raw.trim());
    if (Number.isNaN(instant.getTime())) return null;
    // An ISO instant is unambiguous, so it can always be shown; without a lead
    // zone it is shown in UTC and labelled as such.
    return { instant, zoneKnown: tz !== null, tz, wallClockOnly: false };
  }

  return null;
}

function formatWhen(p: NonNullable<Parsed>): { when: string; zoneLabel: string } {
  const base: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  if (p.wallClockOnly) {
    // Fields were stored as UTC components purely to carry them; format them back as UTC with no zone name.
    return { when: new Intl.DateTimeFormat("en-US", { ...base, timeZone: "UTC" }).format(p.instant), zoneLabel: "timezone unknown" };
  }
  const timeZone = p.tz ?? "UTC";
  return {
    when: new Intl.DateTimeFormat("en-US", { ...base, timeZone, timeZoneName: "short" }).format(p.instant),
    zoneLabel: p.tz ?? "UTC",
  };
}

type ContactLike = {
  ghl_contact_id: string;
  first_name: string | null;
  last_name: string | null;
  custom_fields: Record<string, unknown> | null;
};

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// Builds the owner's Upcoming / Past lists from the contacts mirror. Contacts
// with no Strategy Call Time are skipped; contacts whose value can't be read
// are counted in `unreadable` rather than silently dropped.
export function buildMeetings(contacts: ContactLike[], now: Date = new Date()) {
  const upcoming: Meeting[] = [];
  const past: Meeting[] = [];
  let unreadable = 0;

  for (const c of contacts) {
    const raw = text(c.custom_fields?.strategyCallTime);
    if (!raw) continue;
    const parsed = parseStrategyCallTime(raw, text(c.custom_fields?.leadTimezone));
    if (!parsed) {
      unreadable += 1;
      continue;
    }
    const { when, zoneLabel } = formatWhen(parsed);
    const meeting: Meeting = {
      id: c.ghl_contact_id,
      name: [c.first_name, c.last_name].filter(Boolean).join(" ") || "Contact",
      startsAt: parsed.instant,
      when,
      zoneLabel,
      status: text(c.custom_fields?.bookingStatus),
      closer: text(c.custom_fields?.assignedCloser) || "Unassigned",
    };
    (parsed.instant.getTime() >= now.getTime() ? upcoming : past).push(meeting);
  }

  upcoming.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()); // soonest first
  past.sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime()); // most recent first
  return { upcoming, past, unreadable };
}
