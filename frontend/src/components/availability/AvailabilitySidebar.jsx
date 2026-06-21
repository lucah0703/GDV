import StationHistory from "./StationHistory";
import {
  getTrafficColor,
  getEmoji,
} from "../../utils/availabilityHelpers";
import StationHistoryChart from "./StationHistoryChart";

export default function AvailabilitySidebar({
  stations,
  summary,
  timeSlot,
  selectedStation,
}) {
  return (
    <aside className="panel">

      {/* CHART */}
      <StationHistoryChart station={selectedStation} />

      <hr />

      <h3>Stationen im 10 km Radius</h3>

      <p>
        🟢 {summary.green} · 🟡 {summary.yellow} · 🔴 {summary.red}
      </p>

      {stations.map((s) => {
        const val = s.segments?.[timeSlot] ?? 0;
        const ratio = val / (s.capacity || 1);

        const color = getTrafficColor(ratio);

        return (
          <div key={s.id} className={`station-card ${color}`}>
            <strong>{s.name}</strong>
            <small>
              {getEmoji(color)} {val}/{s.capacity}
            </small>
          </div>
        );
      })}
    </aside>
  );
}