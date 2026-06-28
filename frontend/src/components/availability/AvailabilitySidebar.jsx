import StationHistory from "./StationHistory";
import {
  getTrafficColor,
  getEmoji,
} from "../../utils/availabilityHelpers";
import StationHistoryChart from "./StationHistoryChart";
import StationSparkline from "./StationSparkline";

export default function AvailabilitySidebar({
  stations,
  summary,
  timeSlot,
  selectedStation,
}) {
  return (
    <aside className="results-panel availability-sidebar">

{timeSlot === "heatmap" ? (
  <>
    <div className="heatmap-info heatmap-card">
  <strong>Historische Scooter-Verteilung</strong>

  <p>
    Die Heatmap zeigt Orte, an denen sich E-Scooter
    besonders häufig befinden.
  </p>

  <div className="heatmap-gradient" />

  <div className="heatmap-labels">
    <span>geringe Dichte</span>
    <span>mittlere Dichte</span>
    <span>Hotspot</span>
  </div>
</div>
  </>
) : (
  <>

  {selectedStation  ? (
    <>
      <StationHistoryChart station={selectedStation} />
  <hr />
  </>
  ) : (
    <>
    </>
  )}

    <h3>Stationen im 10 km Radius</h3>

    <div className="availability-summary">
      🟢 {summary.green}
      ·
      🟡 {summary.yellow}
      ·
      🔴 {summary.red}
    </div>

    <div className="availability-stations-list">
  {stations.map((s) => {
    const val = s.availability?.[timeSlot] ?? 0;
    const ratio = val / (s.capacity || 1);

    const color = getTrafficColor(ratio);

    return (
      <div
        key={s.id}
        className={`station-card ${color}`}
        onClick={() => window.dispatchEvent(
          new CustomEvent("selectStation", { detail: s })
        )}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <div>
          <strong>{s.name}</strong>
          <small>
            {getEmoji(color)} {val}/{s.capacity}
          </small>
        </div>

        <StationSparkline station={s} />
      </div>
    );
  })}
</div>
  </>
)}
    </aside>
  );
}