export default function StationHistory({ station }) {
  if (!station) {
    return (
      <div className="station-history">
        <h4>Wochenverlauf</h4>
        <p>Bitte eine Station auf der Karte auswählen.</p>
      </div>
    );
  }

  return (
    <div className="station-history">
      <h4>Wochenverlauf</h4>

      <p>
        <strong>{station.name}</strong>
      </p>

      <ul>
        <li>🌅 Morgens: {station.availability?.morning ?? 0}</li>
        <li>☀️ Mittags: {station.availability?.midday ?? 0}</li>
        <li>🌙 Abends: {station.availability?.evening ?? 0}</li>
      </ul>
    </div>
  );
}