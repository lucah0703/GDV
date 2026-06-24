import { useEffect, useMemo, useState } from "react";
import Map from "./Map";
import AvailabilitySidebar from "./availability/AvailabilitySidebar";
import {
  getStations,
  getCurrentAvailability,
  getHistorySegments,
  getHistory,
} from "../services/api";

import { getTrafficColor } from "../utils/availabilityHelpers";

const API_BASE = "http://localhost:8000";

/* -----------------------------
   Helpers
----------------------------- */

function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;

  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/* -----------------------------
   Uni mapping (wie in deinem Backend)
----------------------------- */

function getBackendUni(name) {
  const n = name.toLowerCase();

  if (n.includes("universität mannheim")) return "uni";
  if (n.includes("dhbw")) return "dhbw";
  if (n.includes("technische hochschule")) return "hochschule";

  if (n.includes("kit")) return "kit";
  if (n.includes("hochschule karlsruhe")) return "hochschule";

  if (n.includes("hohenheim")) return "uniHohenheim";
  if (n.includes("universität stuttgart")) return "uni";

  return "uni";
}

/* -----------------------------
   Component
----------------------------- */

export default function Verfuegbarkeit({ city, school }) {
  const [timeSlot, setTimeSlot] = useState("current");

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedStation, setSelectedStation] = useState(null);

  const [scooterCoords, setScooterCoords] = useState([]);

  /* -----------------------------
     Backend Load
  ----------------------------- */

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const backendCity = city.toLowerCase();
        const backendUni = getBackendUni(school.name);

        const [stationData, currentData, historyDataSegments, historyData] = await Promise.all([
          getStations(backendCity),
          getCurrentAvailability(backendCity, backendUni),
          getHistorySegments(backendCity),
          getHistory(backendCity),
        ]);


  console.log("Scooter API:", historyDataSegments);
  setScooterCoords(historyDataSegments?.scooter ?? []);
        /* -----------------------------
           Bike mapping (station + availability)
        ----------------------------- */

const bikeStations = stationData.map((s) => {
  const current = currentData?.bike?.find(
    (b) => String(b.station_id) === String(s.station_id)
  );

  const segments = historyDataSegments?.bike?.find(
    (h) => String(h.station_id) === String(s.station_id)
  );

  const history = historyData?.find(
    (d) => String(d.station_id) === String(s.station_id)
  );


  return {
    id: s.station_id,
    name: s.name,
    provider: "Nextbike",
    type: "Bike-Station",
    vehicle: "bike",
    coords: [s.lat, s.lon],

    capacity: 20,

    // LIVE
    availability: {
      current: current?.num_bikes_available ?? 0,
    },

    // MAP / 3 ZEITPUNKTE
    segments: {
      morning: segments?.y_data?.[0] ?? 0,
      midday: segments?.y_data?.[1] ?? 0,
      evening: segments?.y_data?.[2] ?? 0,
    },

    // DIAGRAMM / 24h
    history: {
      x_data: history?.x_data ?? Array.from({ length: 24 }, (_, i) => i),
      y_data: history?.y_data ?? Array(24).fill(0),
    },
  };
});

        /* -----------------------------
           Scooter mapping
        ----------------------------- */

        const scooterStations = (currentData?.["e-scooter"] || []).map(
          (s, i) => ({
            id: s.bike_id || i,
            name: s.provider + " Scooter",
            provider: s.provider,
            type: "Scooter",
            vehicle: "scooter",
            coords: [s.lat, s.lon],
            capacity: 1,

            availability: {
              current: 1,
              morning: 1,
              midday: 1,
              evening: 1,
            },
          })
        );

        setStations([...bikeStations, ...scooterStations]);
      } catch (e) {
        console.error(e);
        setStations([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [city, school]);

  /* -----------------------------
     Filter
  ----------------------------- */

  const stationsInRadius = useMemo(() => {
    return stations.filter(
      (s) => distanceKm(school.coords, s.coords) <= 10
    );
  }, [stations, school]);

  const summary = useMemo(() => {
    return stationsInRadius.reduce(
      (acc, s) => {
        const val = s.availability[timeSlot] ?? 0;
        const ratio = val / (s.capacity || 1);

        const color = getTrafficColor(ratio);
        acc[color]++;
        return acc;
      },
      { green: 0, yellow: 0, red: 0 }
    );
  }, [stationsInRadius, timeSlot]);

  /* -----------------------------
     UI
  ----------------------------- */

  return (
    <div className="availability-layout">

<section className="availability-topbar">

  <div className="availability-toolbar">

    {/* Live */}
    <div className="availability-section">
      <span className="availability-title">
        Live-Verfügbarkeit
      </span>

      <button
        className={`time-button ${timeSlot === "current" ? "active" : ""}`}
        onClick={() => setTimeSlot("current")}
      >
        Aktuell
      </button>
    </div>

    <div className="availability-divider" />

    {/* Prognosen */}
    <div className="availability-section">
      <span className="availability-title">
        Fahrrad-Prognosen
      </span>

      <div className="time-buttons">
        {["morning", "midday", "evening"].map((t) => (
          <button
            key={t}
            className={`time-button ${timeSlot === t ? "active" : ""}`}
            onClick={() => setTimeSlot(t)}
          >
            {t === "morning" && "Morgen"}
            {t === "midday" && "Mittag"}
            {t === "evening" && "Abend"}
          </button>
        ))}
      </div>
    </div>

    <div className="availability-divider" />

    {/* Heatmap */}
    <div className="availability-section">
      <span className="availability-title">
        Scooter-Verteilung
      </span>

      <button
        className={`time-button ${timeSlot === "heatmap" ? "active" : ""}`}
        onClick={() => setTimeSlot("heatmap")}
      >
        Heatmap
      </button>
    </div>

  </div>

</section>

  <div className="map-workspace availability-workspace">
      <AvailabilitySidebar
        stations={stationsInRadius}
        summary={summary}
        timeSlot={timeSlot}
        selectedStation={selectedStation}
      />

    <section className="map-wrapper availability-map">
      <Map
        center={school.coords}
        label={school.name}
        markerCoords={school.coords}
        stationsInRadius={stationsInRadius}
        availability={timeSlot !== "heatmap"}
        timeSlot={timeSlot}
        showStationsInBudgetView={timeSlot !== "heatmap"}
        onStationClick={setSelectedStation}
        scooterCoords={scooterCoords}
        showScooterHeatmap={timeSlot === "heatmap"}
      />
    </section>

  </div>
</div>
  );
}