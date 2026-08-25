import OpportunitiesBoard from "./board";
import NewLeadButton from "../new-lead-button";

export default function OpportunitiesPage() {
  return (
    <section>
      <div className="filter-bar">
        <div className="section-head" style={{ margin: 0 }}>
          <h2>Client Pipeline</h2>
          <p>Drag a card to move it to a different stage — this updates GoHighLevel immediately.</p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <NewLeadButton className="btn btn-primary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add lead
          </NewLeadButton>
        </div>
      </div>
      <OpportunitiesBoard />
    </section>
  );
}
