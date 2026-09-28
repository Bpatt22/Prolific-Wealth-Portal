import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { listNotes, listAppointments, listTasks } from "@/lib/ghl/contacts";
import { GhlApiError } from "@/lib/ghl/client";
import { backupContactActivity, markContactAndActivityDeleted } from "@/lib/ghlBackup";
import { serializeError } from "@/lib/serializeError";

// Backs up notes/tasks/appointments — GHL only exposes these per-contact
// (no bulk list endpoint), so backing up all ~500+ contacts' activity in one
// request would blow past both GHL rate limits and the function's time
// limit. Instead this processes a small batch each time it's called, tracks
// where it left off in ghl_backup_sweep_state, and wraps around to the start
// once it reaches the end — so a full sweep completes over many cron ticks
// rather than one. Call with:
// POST /api/backup/activity-sweep?secret=<ADMIN_BACKFILL_SECRET>
export const maxDuration = 60;

const BATCH_SIZE = 20;
const CONCURRENCY = 5;

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.ADMIN_BACKFILL_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { data: state, error: stateError } = await supabaseAdmin
      .from("ghl_backup_sweep_state")
      .select("cursor_index")
      .eq("id", 1)
      .single();
    if (stateError) throw stateError;

    const { data: page, error: pageError } = await supabaseAdmin
      .from("ghl_backup_contacts")
      .select("ghl_contact_id")
      .is("deleted_at", null)
      .order("ghl_contact_id")
      .range(state.cursor_index, state.cursor_index + BATCH_SIZE - 1);
    if (pageError) throw pageError;

    // Reached the end — wrap around to the start for the next tick.
    if (!page || page.length === 0) {
      await supabaseAdmin.from("ghl_backup_sweep_state").update({ cursor_index: 0, updated_at: new Date().toISOString() }).eq("id", 1);
      return NextResponse.json({ ok: true, wrapped: true, processed: 0 });
    }

    const contactIds = page.map((c) => c.ghl_contact_id);
    let processed = 0;
    let deleted = 0;

    for (let i = 0; i < contactIds.length; i += CONCURRENCY) {
      const chunk = contactIds.slice(i, i + CONCURRENCY);
      await Promise.all(
        chunk.map(async (contactId) => {
          try {
            const [notes, tasks, appointments] = await Promise.all([
              listNotes(contactId),
              listTasks(contactId),
              listAppointments(contactId),
            ]);
            await backupContactActivity(contactId, { notes, tasks, appointments });
            processed++;
          } catch (err) {
            if (err instanceof GhlApiError && err.status === 404) {
              await markContactAndActivityDeleted(contactId);
              deleted++;
            } else {
              console.error(`activity sweep failed for contact ${contactId}`, err);
            }
          }
        })
      );
    }

    const nextCursor = state.cursor_index + page.length;
    await supabaseAdmin.from("ghl_backup_sweep_state").update({ cursor_index: nextCursor, updated_at: new Date().toISOString() }).eq("id", 1);

    return NextResponse.json({ ok: true, processed, deleted, nextCursor });
  } catch (err) {
    console.error("activity sweep failed", err);
    return NextResponse.json({ error: serializeError(err) }, { status: 500 });
  }
}
