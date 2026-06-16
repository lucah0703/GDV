import { useMemo, useState } from "react";
import Map from "./Map";

const tariffs = {
  bike: {
    name: "Bike / E-Bike",
    unlock: 0,
    pricePerMinute: 0.1,
    speedKmh: 15,
  },
  scooter: {
    name: "E-Scooter",
    unlock: 1,
    pricePerMinute: 0.25,
    speedKmh: 15,
  },
};

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

function calculateRadiusMeters(budget, vehicle) {
  const tariff = tariffs[vehicle];
  const usableBudget = budget - tariff.unlock;
  if (usableBudget <= 0) return 0;

  const minutes = usableBudget / tariff.pricePerMinute;
  const km = (minutes / 60) * tariff.speedKmh;
  return km * 1000;
}

function calculateCost(start, destination, vehicle) {
  const km = distanceKm(start, destination);
  const tariff = tariffs[vehicle];
  const minutes = (km / tariff.speedKmh) * 60;
  const price = tariff.unlock + minutes * tariff.pricePerMinute;

  return { km, minutes, price };
}

export default function Reichweite({ city, school, pois }) {
  const [budget, setBudget] = useState(5);
  const [selectedPoiType, setSelectedPoiType] = useState("Bahnhof");
  const [selectedPoi, setSelectedPoi] = useState(null);

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

  return (
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
          center={school.coords}
          label={school.name}
          markerCoords={school.coords}
          pois={poisWithCosts}
          selectedPoi={selectedPoi}
          setSelectedPoi={setSelectedPoi}
          budget={budget}
          availability={false}
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
            <button className="back-button" onClick={() => setSelectedPoi(null)}>
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
  );
}