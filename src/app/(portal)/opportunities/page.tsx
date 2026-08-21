import OpportunitiesBoard from "./board";

export default function OpportunitiesPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-zinc-900">Opportunities</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Drag a card to move it to a different stage — this updates GoHighLevel immediately.
      </p>
      <div className="mt-6">
        <OpportunitiesBoard />
      </div>
    </div>
  );
}
