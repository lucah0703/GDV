import { useMemo, useState } from "react";
import Map from "./Map";

function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;

  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function getAvailabilityStatus(station, timeSlot) {
  const available = station.availability[timeSlot];
  const ratio = available / station.capacity;

  if (ratio >= 0.5) return "green";
  if (ratio >= 0.2) return "yellow";
  return "red";
}

function getTrafficEmoji(status) {
  if (status === "green") return "🟢";
  if (status === "yellow") return "🟡";
  return "🔴";
}

export default function Verfuegbarkeit({ city, school, stations }) {
  const [timeSlot, setTimeSlot] = useState("morning");

  const stationsInRadius = useMemo(() => {
    return stations.filter(
      (station) => distanceKm(school.coords, station.coords) <= 10
    );
  }, [stations, school]);

  const stationSummary = useMemo(() => {
    return stationsInRadius.reduce(
      (acc, station) => {
        const status = getAvailabilityStatus(station, timeSlot);
        acc[status] += 1;
        return acc;
      },
      { green: 0, yellow: 0, red: 0 }
    );
  }, [stationsInRadius, timeSlot]);

  return (
    <main className="layout availability-view">
      <aside className="panel">
        <h3>Verfügbarkeit</h3>

        <h4>Zeitpunkt</h4>

        <div className="time-buttons">
          <button
            className={timeSlot === "morning" ? "active" : ""}
            onClick={() => setTimeSlot("morning")}
          >
            Morgen
          </button>

          <button
            className={timeSlot === "midday" ? "active" : ""}
            onClick={() => setTimeSlot("midday")}
          >
            Mittag
          </button>

          <button
            className={timeSlot === "evening" ? "active" : ""}
            onClick={() => setTimeSlot("evening")}
          >
            Abend
          </button>
        </div>

        <h4>Radius</h4>
        <div className="analysis-mode">10 km um Startpunkt</div>

        <div className="hint">
          Die Karte zeigt Stationen und Pick-up-Punkte im Umkreis.
          Die Ampelfarbe hängt von der Verfügbarkeit zur gewählten Tageszeit ab.
        </div>
      </aside>

      <section className="map">
        <Map
          center={school.coords}
          label={school.name}
          markerCoords={school.coords}
          availability={true}
          timeSlot={timeSlot}
          stationsInRadius={stationsInRadius}
        />
      </section>

      <aside className="panel">
        <h3>Stationen im 10-km-Radius</h3>

        <div className="poi-summary-card">
          <strong>{stationsInRadius.length} Stationen</strong>
          <span>Rund um {school.name}</span>
          <p>
            🟢 {stationSummary.green} gut · 🟡 {stationSummary.yellow} mittel · 🔴{" "}
            {stationSummary.red} kritisch
          </p>
        </div>

        {stationsInRadius.map((station) => {
          const status = getAvailabilityStatus(station, timeSlot);

          return (
            <div key={station.name} className={`station-card ${status}`}>
              <div>
                <strong>{station.name}</strong>
                <small>
                  {station.provider} · {station.type}
                </small>
                <small>
                  {station.availability[timeSlot]} von {station.capacity} Fahrzeugen verfügbar
                </small>
              </div>

              <div className="traffic-light">{getTrafficEmoji(status)}</div>
            </div>
          );
        })}
      </aside>
    </main>
  );
}