import OpportunitiesBoard from "./board";

export default function OpportunitiesPage() {
  return (
    <section>
      <div className="section-head">
        <h2>Client Pipeline</h2>
        <p>Drag a card to move it to a different stage — this updates GoHighLevel immediately.</p>
      </div>
      <OpportunitiesBoard />
    </section>
  );
}
