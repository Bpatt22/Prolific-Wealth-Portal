"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { PIPELINE_STAGES } from "@/lib/ghl/constants";

type Opportunity = {
  ghl_opportunity_id: string;
  contact_id: string | null;
  stage_id: string;
  name: string | null;
  monetary_value: number | null;
  status: string | null;
  contacts: { first_name: string | null; last_name: string | null; email: string | null; phone: string | null } | null;
};

export default function OpportunitiesBoard() {
  const [opportunities, setOpportunities] = useState<Opportunity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    fetch("/api/opportunities")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setOpportunities(d.opportunities);
      })
      .catch((e) => setError(String(e)));
  }, []);

  const byStage = useMemo(() => {
    const map = new Map<string, Opportunity[]>();
    for (const stage of PIPELINE_STAGES) map.set(stage.id, []);
    for (const opp of opportunities ?? []) {
      map.get(opp.stage_id)?.push(opp);
    }
    return map;
  }, [opportunities]);

  const activeOpp = opportunities?.find((o) => o.ghl_opportunity_id === activeId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const opportunityId = String(active.id);
    const newStageId = String(over.id);
    const current = opportunities?.find((o) => o.ghl_opportunity_id === opportunityId);
    if (!current || current.stage_id === newStageId) return;

    const previousStageId = current.stage_id;
    setOpportunities((prev) =>
      (prev ?? []).map((o) => (o.ghl_opportunity_id === opportunityId ? { ...o, stage_id: newStageId } : o))
    );

    const res = await fetch(`/api/opportunities/${opportunityId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId: newStageId }),
    });

    if (!res.ok) {
      setOpportunities((prev) =>
        (prev ?? []).map((o) => (o.ghl_opportunity_id === opportunityId ? { ...o, stage_id: previousStageId } : o))
      );
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to move opportunity");
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!opportunities) return <p className="text-sm text-zinc-500">Loading…</p>;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => (
          <StageColumn key={stage.id} id={stage.id} title={stage.name} opportunities={byStage.get(stage.id) ?? []} />
        ))}
      </div>
      <DragOverlay>{activeOpp ? <Card opp={activeOpp} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}

function StageColumn({ id, title, opportunities }: { id: string; title: string; opportunities: Opportunity[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg border ${
        isOver ? "border-zinc-400 bg-zinc-100" : "border-zinc-200 bg-zinc-50"
      }`}
    >
      <div className="border-b border-zinc-200 px-3 py-2">
        <p className="text-sm font-medium text-zinc-800">{title}</p>
        <p className="text-xs text-zinc-500">{opportunities.length}</p>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2">
        {opportunities.map((opp) => (
          <DraggableCard key={opp.ghl_opportunity_id} opp={opp} />
        ))}
      </div>
    </div>
  );
}

function DraggableCard({ opp }: { opp: Opportunity }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: opp.ghl_opportunity_id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card opp={opp} />
    </div>
  );
}

function Card({ opp, dragging }: { opp: Opportunity; dragging?: boolean }) {
  const contactName =
    [opp.contacts?.first_name, opp.contacts?.last_name].filter(Boolean).join(" ") || opp.name || "Unnamed";

  return (
    <Link
      href={opp.contact_id ? `/contacts/${opp.contact_id}` : "#"}
      onClick={(e) => dragging && e.preventDefault()}
      className={`block rounded-md border border-zinc-200 bg-white p-3 text-sm shadow-sm hover:border-zinc-400 ${
        dragging ? "shadow-lg" : ""
      }`}
    >
      <p className="font-medium text-zinc-900">{contactName}</p>
      {opp.contacts?.email && <p className="mt-0.5 truncate text-xs text-zinc-500">{opp.contacts.email}</p>}
      {!!opp.monetary_value && (
        <p className="mt-1 text-xs text-zinc-600">${Number(opp.monetary_value).toLocaleString()}</p>
      )}
    </Link>
  );
}
