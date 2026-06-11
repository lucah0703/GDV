import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "./App.css";

const cities = {
  Mannheim: [
    { name: "Universität Mannheim", students: "ca. 10.800", coords: [49.4831, 8.4632] },
    { name: "DHBW Mannheim", students: "ca. 5.900", coords: [49.4734, 8.5256] },
    { name: "Technische Hochschule Mannheim", students: "ca. 5.200", coords: [49.4691, 8.4823] },
  ],
  Karlsruhe: [
    { name: "KIT", students: "ca. 24.000", coords: [49.0095, 8.4116] },
    { name: "Hochschule Karlsruhe", students: "ca. 8.300", coords: [49.0158, 8.3916] },
    { name: "Pädagogische Hochschule Karlsruhe", students: "ca. 3.300", coords: [49.0135, 8.3965] },
  ],
  Stuttgart: [
    { name: "Universität Stuttgart", students: "ca. 20.500", coords: [48.7812, 9.1735] },
    { name: "Universität Hohenheim", students: "ca. 9.200", coords: [48.7112, 9.2132] },
    { name: "DHBW Stuttgart", students: "ca. 8.300", coords: [48.7744, 9.1685] },
  ],
};

const poisByCity = {
  Mannheim: [
    { name: "Mannheim Hbf", type: "Bahnhof", icon: "🚉", coords: [49.479, 8.469], address: "Willy-Brandt-Platz 17, 68161 Mannheim" },
    { name: "Wohnheim Innenstadt", type: "Wohnheim", icon: "🏠", coords: [49.489, 8.462], address: "Innenstadt, 68159 Mannheim" },
    { name: "Hochschulsport Mannheim", type: "Sportanlage", icon: "⚽", coords: [49.492, 8.475], address: "Nähe Universität Mannheim" },
  ],
  Karlsruhe: [
    { name: "Karlsruhe Hbf", type: "Bahnhof", icon: "🚉", coords: [48.9937, 8.4005], address: "Bahnhofplatz 1a, 76137 Karlsruhe" },
    { name: "Wohnheim Waldhornstraße", type: "Wohnheim", icon: "🏠", coords: [49.0107, 8.4146], address: "Waldhornstraße, Karlsruhe" },
    { name: "Hochschulsport KIT", type: "Sportanlage", icon: "⚽", coords: [49.012, 8.423], address: "KIT Campus Süd, Karlsruhe" },
  ],
  Stuttgart: [
    { name: "Stuttgart Hbf", type: "Bahnhof", icon: "🚉", coords: [48.7834, 9.1816], address: "Arnulf-Klett-Platz 2, 70173 Stuttgart" },
    { name: "Wohnheim Stuttgart-Mitte", type: "Wohnheim", icon: "🏠", coords: [48.776, 9.172], address: "Stuttgart-Mitte" },
    { name: "Hochschulsport Stuttgart", type: "Sportanlage", icon: "⚽", coords: [48.781, 9.188], address: "Nähe Universität Stuttgart" },
  ],
};

const mobilityStationsByCity = {
  Mannheim: [
    {
      name: "Nextbike Universität Mannheim",
      provider: "Nextbike",
      type: "Bike-Station",
      coords: [49.4835, 8.464],
      capacity: 18,
      availability: { morning: 12, midday: 8, evening: 3 },
    },
    {
      name: "Nextbike Mannheim Hbf",
      provider: "Nextbike",
      type: "Bike-Station",
      coords: [49.479, 8.469],
      capacity: 15,
      availability: { morning: 4, midday: 7, evening: 1 },
    },
    {
      name: "Bolt Paradeplatz",
      provider: "Bolt",
      type: "Scooter-Pick-up",
      coords: [49.4875, 8.466],
      capacity: 10,
      availability: { morning: 6, midday: 3, evening: 8 },
    },
  ],
  Karlsruhe: [
    {
      name: "Nextbike KIT Campus Süd",
      provider: "Nextbike",
      type: "Bike-Station",
      coords: [49.0095, 8.4116],
      capacity: 20,
      availability: { morning: 14, midday: 9, evening: 4 },
    },
    {
      name: "Bolt Karlsruhe Hbf",
      provider: "Bolt",
      type: "Scooter-Pick-up",
      coords: [48.9937, 8.4005],
      capacity: 12,
      availability: { morning: 3, midday: 6, evening: 9 },
    },
    {
      name: "Nextbike Waldhornstraße",
      provider: "Nextbike",
      type: "Bike-Station",
      coords: [49.0107, 8.4146],
      capacity: 16,
      availability: { morning: 2, midday: 5, evening: 10 },
    },
  ],
  Stuttgart: [
    {
      name: "Nextbike Universität Stuttgart",
      provider: "Nextbike",
      type: "Bike-Station",
      coords: [48.7812, 9.1735],
      capacity: 18,
      availability: { morning: 10, midday: 6, evening: 3 },
    },
    {
      name: "Bolt Stuttgart Hbf",
      provider: "Bolt",
      type: "Scooter-Pick-up",
      coords: [48.7834, 9.1816],
      capacity: 14,
      availability: { morning: 5, midday: 8, evening: 11 },
    },
    {
      name: "Nextbike Stuttgart-Mitte",
      provider: "Nextbike",
      type: "Bike-Station",
      coords: [48.776, 9.172],
      capacity: 12,
      availability: { morning: 1, midday: 4, evening: 7 },
    },
  ],
};

const tariffs = {
  bike: {
    name: "Bike / E-Bike",
    unlock: 0,
    pricePerMinute: 0.1,
    speedKmh: 15,
    color: "#047857",
  },
  scooter: {
    name: "E-Scooter",
    unlock: 1,
    pricePerMinute: 0.25,
    speedKmh: 15,
    color: "#7c3aed",
  },
};

function calculateRadiusMeters(budget, vehicle) {
  const tariff = tariffs[vehicle];
  const usableBudget = budget - tariff.unlock;
  if (usableBudget <= 0) return 0;

  const minutes = usableBudget / tariff.pricePerMinute;
  const km = (minutes / 60) * tariff.speedKmh;
  return km * 1000;
}

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

function calculateCost(start, destination, vehicle) {
  const km = distanceKm(start, destination);
  const tariff = tariffs[vehicle];
  const minutes = (km / tariff.speedKmh) * 60;
  const price = tariff.unlock + minutes * tariff.pricePerMinute;

  return { km, minutes, price };
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

function createStationIcon(status) {
  return L.divIcon({
    className: "station-map-marker",
    html: `<div class="station-map-marker-inner">${getTrafficEmoji(status)}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });
}

export default function App() {
  const [city, setCity] = useState("Mannheim");
  const [school, setSchool] = useState(cities.Mannheim[0]);
  const [mode] = useState("poi");
  const [showAvailability, setShowAvailability] = useState(false);
  const [budget, setBudget] = useState(5);
  const [selectedPoiType, setSelectedPoiType] = useState("Bahnhof");
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [timeSlot, setTimeSlot] = useState("morning");

  const pois = poisByCity[city];

  const bikeRadius = calculateRadiusMeters(budget, "bike");
  const scooterRadius = calculateRadiusMeters(budget, "scooter");

  const filteredPois = useMemo(() => {
    return pois.filter((poi) => poi.type === selectedPoiType);
  }, [pois, selectedPoiType]);

  const poisWithCosts = useMemo(() => {
    return filteredPois.map((poi) => {
      const bike = calculateCost(school.coords, poi.coords, "bike");
      const scooter = calculateCost(school.coords, poi.coords, "scooter");

      return {
        ...poi,
        costs: { bike, scooter },
        reachable: bike.price <= budget || scooter.price <= budget,
      };
    });
  }, [filteredPois, school, budget]);

  const reachablePois = poisWithCosts.filter((poi) => poi.reachable);

  const stationsInRadius = useMemo(() => {
    return mobilityStationsByCity[city].filter(
      (station) => distanceKm(school.coords, station.coords) <= 10
    );
  }, [city, school]);

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

  function changeCity(value) {
    setCity(value);
    setSchool(cities[value][0]);
    setSelectedPoi(null);
    setSelectedPoiType("Bahnhof");
  }

  function changeSchool(value) {
    const newSchool = cities[city].find((s) => s.name === value);
    setSchool(newSchool);
    setSelectedPoi(null);
  }

  function handleMarkerClick(poi) {
    const poiWithCosts = poisWithCosts.find((p) => p.name === poi.name);

    if (poiWithCosts) {
      setSelectedPoi(poiWithCosts);
      setSelectedPoiType(poiWithCosts.type);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Mikromobilität für Studierende</h1>
          <p>POI-Erreichbarkeit, Budget-Reichweite und Verfügbarkeit</p>
        </div>

        <div className="selectors">
          <label>
            Stadt
            <select value={city} onChange={(e) => changeCity(e.target.value)}>
              {Object.keys(cities).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          <label>
            Hochschule
            <select
              value={school.name}
              onChange={(e) => changeSchool(e.target.value)}
            >
              {cities[city].map((s) => (
                <option key={s.name}>{s.name}</option>
              ))}
            </select>
          </label>

          <button onClick={() => setShowAvailability(!showAvailability)}>
            {showAvailability ? "Zur Hauptansicht" : "Verfügbarkeiten anzeigen"}
          </button>
        </div>
      </header>

      {!showAvailability ? (
        <main className="layout main-view">
          <aside className="panel">
            <h3>Filter</h3>

            <h4>Analysemodus</h4>
            <div className="analysis-mode">Budget-Modus</div>

            <h4>Verkehrsmittel</h4>
            <label>
              <input type="checkbox" defaultChecked /> Bike / E-Bike
            </label>
            <label>
              <input type="checkbox" defaultChecked /> E-Scooter
            </label>

            <h4>POI-Typen</h4>
            <label>
              <input type="checkbox" defaultChecked /> Wohnheime
            </label>
            <label>
              <input type="checkbox" defaultChecked /> Bahnhöfe
            </label>
            <label>
              <input type="checkbox" defaultChecked /> Sportanlagen
            </label>

            <h4>Budget</h4>
            <p className="muted">Preis festlegen</p>

            <input
              className="budget-input"
              type="number"
              min="1"
              max="20"
              step="0.5"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />

            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />

            <div className="budget-value">{budget.toFixed(2)} €</div>

            <div className="budget-card">
              <strong>Geschätzte Reichweite</strong>
              <p>Bike / E-Bike: {(bikeRadius / 1000).toFixed(1)} km</p>
              <p>E-Scooter: {(scooterRadius / 1000).toFixed(1)} km</p>
            </div>
          </aside>

          <section className="map">
            <Map
              city={city}
              school={school}
              pois={poisWithCosts}
              mode={mode}
              budget={budget}
              selectedPoi={selectedPoi}
              setSelectedPoi={handleMarkerClick}
              availability={false}
              timeSlot={timeSlot}
              stationsInRadius={stationsInRadius}
            />
          </section>

          <aside className="panel">
            <h3>Auswertung</h3>

            <div className="school-card">
              <span>Startpunkt</span>
              <strong>{school.name}</strong>
              <small>{school.students} Studierende</small>
            </div>

            <h4>POI-Typ auswählen</h4>

            <select
              value={selectedPoiType}
              onChange={(e) => {
                setSelectedPoiType(e.target.value);
                setSelectedPoi(null);
              }}
            >
              <option value="Bahnhof">Bahnhöfe</option>
              <option value="Wohnheim">Wohnheime</option>
              <option value="Sportanlage">Sportanlagen</option>
            </select>

            {!selectedPoi ? (
              <>
                <div className="poi-summary-card">
                  <span>{selectedPoiType}</span>
                  <strong>{filteredPois.length} insgesamt</strong>
                  <p>{reachablePois.length} mit deinem Budget erreichbar</p>
                </div>

                <h4>Erreichbare POIs</h4>

                {reachablePois.length === 0 ? (
                  <div className="hint">
                    Mit dem aktuellen Budget ist kein POI dieses Typs erreichbar.
                  </div>
                ) : (
                  reachablePois.map((poi) => (
                    <button
                      key={poi.name}
                      className="poi-list-card"
                      onClick={() => setSelectedPoi(poi)}
                    >
                      <div>
                        <strong>
                          {poi.icon} {poi.name}
                        </strong>
                        <small>{poi.costs.bike.km.toFixed(1)} km entfernt</small>
                      </div>

                      <span>{poi.costs.bike.price.toFixed(2)} €</span>
                    </button>
                  ))
                )}
              </>
            ) : (
              <>
                <button
                  className="back-button"
                  onClick={() => setSelectedPoi(null)}
                >
                  ← Zur Übersicht
                </button>

                <div className="poi-title">
                  <span>{selectedPoi.icon}</span>
                  <div>
                    <strong>{selectedPoi.name}</strong>
                    <small>{selectedPoi.type}</small>
                  </div>
                </div>

                <div className="poi-detail-card">
                  <span>Adresse</span>
                  <strong>{selectedPoi.address}</strong>
                </div>

                <div className="cost-card bike">
                  <span>Bike / E-Bike</span>
                  <strong>{selectedPoi.costs.bike.price.toFixed(2)} €</strong>
                  <small>
                    {selectedPoi.costs.bike.minutes.toFixed(0)} Min ·{" "}
                    {selectedPoi.costs.bike.km.toFixed(1)} km
                  </small>
                </div>

                <div className="cost-card scooter">
                  <span>E-Scooter</span>
                  <strong>{selectedPoi.costs.scooter.price.toFixed(2)} €</strong>
                  <small>
                    {selectedPoi.costs.scooter.minutes.toFixed(0)} Min ·{" "}
                    {selectedPoi.costs.scooter.km.toFixed(1)} km
                  </small>
                </div>
              </>
            )}
          </aside>
        </main>
      ) : (
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
              city={city}
              school={school}
              pois={poisWithCosts}
              mode={mode}
              budget={budget}
              selectedPoi={selectedPoi}
              setSelectedPoi={handleMarkerClick}
              availability
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
      )}
    </div>
  );
}

function Map({
  city,
  school,
  pois,
  mode,
  budget,
  selectedPoi,
  setSelectedPoi,
  availability,
  timeSlot,
  stationsInRadius,
}) {
  const bikeRadius = calculateRadiusMeters(budget, "bike");
  const scooterRadius = calculateRadiusMeters(budget, "scooter");

  return (
    <MapContainer center={school.coords} zoom={14} className="leaflet-map">
      <ResizeMap center={school.coords} />

      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {!availability && mode === "budget" && (
        <>
          <Circle
            center={school.coords}
            radius={bikeRadius}
            pathOptions={{
              color: tariffs.bike.color,
              fillColor: tariffs.bike.color,
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "8 8",
            }}
          />

          <Circle
            center={school.coords}
            radius={scooterRadius}
            pathOptions={{
              color: tariffs.scooter.color,
              fillColor: tariffs.scooter.color,
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "5 8",
            }}
          />
        </>
      )}

      {!availability && mode === "poi" && selectedPoi && (
        <Circle
          center={school.coords}
          radius={distanceKm(school.coords, selectedPoi.coords) * 1000}
          pathOptions={{
            color: "#0f766e",
            fillColor: "#0f766e",
            fillOpacity: 0.06,
            weight: 2,
          }}
        />
      )}

      {availability && (
        <Circle
          center={school.coords}
          radius={10000}
          pathOptions={{
            color: "#047857",
            fillColor: "#047857",
            fillOpacity: 0.03,
            weight: 2,
            dashArray: "8 8",
          }}
        />
      )}

      <Marker position={school.coords}>
        <Popup>
          <strong>{school.name}</strong>
          <br />
          {school.students} Studierende
        </Popup>
      </Marker>

      {!availability &&
        pois.map((p) => (
          <Marker
            key={`${city}-${p.name}`}
            position={p.coords}
            eventHandlers={{
              click: () => setSelectedPoi(p),
            }}
          >
            <Popup>
              {p.icon} <strong>{p.name}</strong>
              <br />
              {p.type}
            </Popup>
          </Marker>
        ))}

      {availability &&
        stationsInRadius.map((station) => {
          const status = getAvailabilityStatus(station, timeSlot);

          return (
            <Marker
              key={`${city}-${station.name}`}
              position={station.coords}
              icon={createStationIcon(status)}
            >
              <Popup>
                {getTrafficEmoji(status)} <strong>{station.name}</strong>
                <br />
                {station.provider} · {station.type}
                <br />
                {station.availability[timeSlot]} von {station.capacity} Fahrzeugen verfügbar
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}

function ResizeMap({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 14);
    setTimeout(() => map.invalidateSize(true), 100);
    setTimeout(() => map.invalidateSize(true), 500);
  }, [center, map]);

  return null;
}