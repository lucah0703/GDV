import { useEffect, useMemo, useState, useRef } from "react";
import Map from "./Map";

const API_BASE = "http://localhost:8000";

function getBackendCity(city) {
  return city.toLowerCase();
}

function getBackendUni(schoolName) {
  const name = schoolName.toLowerCase();

  if (name.includes("universität mannheim")) return "uni";
  if (name.includes("technische hochschule")) return "hochschule";
  if (name.includes("dhbw")) return "dhbw";

  if (name.includes("kit")) return "kit";
  if (name.includes("hochschule karlsruhe")) return "hochschule";
  if (name.includes("pädagogische")) return "paedagogischeHochschule";

  if (name.includes("hohenheim")) return "uniHohenheim";
  if (name.includes("universität stuttgart")) return "uni";

  return "uni";
}

function getFrontendPoiType(category) {
  if (category === "bahnhoefe") return "Bahnhof";
  if (category === "wohnheime") return "Wohnheim";
  if (category === "sporteinrichtungen") return "Sportanlage";
  return "POI";
}

function getPoiIcon(type) {
  if (type === "Bahnhof") return "🚉";
  if (type === "Wohnheim") return "🏠";
  if (type === "Sportanlage") return "⚽";
  return "📍";
}

function geoJsonPoisToFrontend(geojson) {
  if (!geojson?.features) return [];

  return geojson.features
    .map((feature, index) => {
      const props = feature.properties || {};
      const coords = feature.geometry?.coordinates;

      if (!coords || coords.length < 2) return null;

      const [lon, lat] = coords;
      const type = getFrontendPoiType(props.category);

      return {
        id: props.id
          ? `${props.category}-${props.id}`
          : `${props.category}-${props.name || "poi"}-${index}`,
        name: props.name || type,
        type,
        icon: getPoiIcon(type),
        coords: [lat, lon],
        sportart: props.sport || props.sportart || props.sports || "",
        address: props.address || props.adress || props.adresse || "",
        category: props.category,
      };
    })
    .filter(Boolean);
}

function normalizeGeofencingData(data) {
  return data?.providers || [];
}

function pointInPolygon(point, polygon) {
  const [lat, lon] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1];
    const yi = polygon[i][0];
    const xj = polygon[j][1];
    const yj = polygon[j][0];

    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function pointInGeometry(point, geometry) {
  if (!geometry) return false;

  if (geometry.type === "Polygon") {
    return geometry.coordinates.some((ring) => {
      const polygon = ring.map(([lon, lat]) => [lat, lon]);
      return pointInPolygon(point, polygon);
    });
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygonGroup) =>
      polygonGroup.some((ring) => {
        const polygon = ring.map(([lon, lat]) => [lat, lon]);
        return pointInPolygon(point, polygon);
      })
    );
  }

  return false;
}
function normalizeProviderName(provider) {
  return String(provider || "").trim().toLowerCase();
}

function getIsochroneOffers(pricingIsochroneData, activeVehicles) {
  const offers = [];

  if (activeVehicles.includes("scooter")) {
    offers.push(
      ...(pricingIsochroneData?.results?.["e-scooter"] || []).map((offer) => ({
        ...offer,
        vehicle: "scooter",
      }))
    );
  }

  if (activeVehicles.includes("bike")) {
    offers.push(
      ...(pricingIsochroneData?.results?.bike || []).map((offer) => ({
        ...offer,
        vehicle: "bike",
      }))
    );
  }

  return offers;
}

function isPoiInProviderGeofence(poi, provider, geofencingZones) {
  const normalizedProvider = normalizeProviderName(provider);

  const providerData = geofencingZones.find(
    (item) => normalizeProviderName(item.provider) === normalizedProvider
  );

  if (!providerData) return false;

  return providerData.geofencing_zones.some((zone) =>
    pointInGeometry(poi.coords, zone.geometry)
  );
}

function normalizeAvailabilityToStations(data) {
  const stations = [];

  const bikeItems = Array.isArray(data?.bike_200m)
    ? data.bike_200m
    : Array.isArray(data?.bike)
      ? data.bike
      : [];
  const scooterItems = Array.isArray(data?.["e-scooter"])
    ? data["e-scooter"]
    : [];

  bikeItems.forEach((item, index) => {
    const lat =
      item.lat ??
      item.latitude ??
      item.station_lat ??
      item.y ??
      item.coords?.[0];

    const lon =
      item.lon ??
      item.lng ??
      item.longitude ??
      item.station_lon ??
      item.x ??
      item.coords?.[1];

    if (lat == null || lon == null) return;

    stations.push({
      id: item.station_id || item.id || `bike-${index}`,
      name: item.name || item.station_name || `Bike-Station ${index + 1}`,
      provider: item.provider || "bike",
      type: "Bike-Station",
      vehicle: "bike",
      coords: [Number(lat), Number(lon)],
      capacity: Number(
        item.capacity || item.num_docks_available || item.num_docks || 1
      ),
      availability: {
        current: Number(
          item.num_bikes_available ??
          item.num_bicycles_available ??
          item.bikes_available ??
          item.available ??
          item.current ??
          0
        ),
      },
    });
  });

  scooterItems.forEach((item, index) => {
    const lat = item.lat ?? item.latitude ?? item.y ?? item.coords?.[0];
    const lon =
      item.lon ?? item.lng ?? item.longitude ?? item.x ?? item.coords?.[1];

    if (lat == null || lon == null) return;

    stations.push({
      id: item.bike_id || item.vehicle_id || item.id || `scooter-${index}`,
      name: item.name || item.provider || `Scooter ${index + 1}`,
      provider: item.provider || "scooter",
      type: "Scooter-Pick-up",
      vehicle: "scooter",
      coords: [Number(lat), Number(lon)],
      capacity: 1,
      availability: { current: 1 },
    });
  });

  return stations;
}

function getCurrentAvailability(station) {
  return station.availability?.current ?? 0;
}
function normalizeVehicle(vehicle) {
  if (vehicle === "e-scooter") return "scooter";
  return vehicle;
}

function providerHasAvailableVehicle(provider, vehicle, stationsNearStart) {
  const normalizedProvider = normalizeProviderName(provider);

  return stationsNearStart.some((station) => {
    return (
      normalizeProviderName(station.provider) === normalizedProvider &&
      station.vehicle === vehicle &&
      getCurrentAvailability(station) > 0
    );
  });
}

function getBestIsochroneOffer(pricingIsochroneData, vehicle) {
  const backendKey = vehicle === "scooter" ? "e-scooter" : "bike";
  const offers = pricingIsochroneData?.results?.[backendKey] || [];

  return [...offers].sort((a, b) => b.max_minutes - a.max_minutes)[0] || null;
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

export default function Reichweite({ city, school }) {
  const [budget, setBudget] = useState(0);
  const [calculation, setCalculation] = useState(null);

  const [selectedPoiType, setSelectedPoiType] = useState("Alle");
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({
    real: true,
    theoretical: true,
    notReachable: true,
  });

  function toggleSection(section) {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }
  const [showBikes, setShowBikes] = useState(true);
  const [showScooters, setShowScooters] = useState(true);

  const [backendPois, setBackendPois] = useState([]);
  const [backendStations, setBackendStations] = useState([]);
  const [geofencingZones, setGeofencingZones] = useState([]);
  const [showGeofencingZones, setShowGeofencingZones] = useState(false);
  const [pricingIsochroneData, setPricingIsochroneData] = useState(null);
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [backendError, setBackendError] = useState("");

  const currentAvailabilityKey = "current";

  const selectedPoiRef = useRef(null);

  useEffect(() => {
    if (!selectedPoiRef.current) return;

    setTimeout(() => {
      selectedPoiRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
  }, [selectedPoi]);

  useEffect(() => {
    setBudget(0);
    setSelectedPoi(null);
    setCalculation(null);
    setPricingIsochroneData(null);
    setBackendError("");
  }, [city, school.name, school.coords]);

  useEffect(() => {
    async function loadBackendData() {
      try {
        setLoadingBackend(true);
        setBackendError("");

        const backendCity = getBackendCity(city);
        const backendUni = getBackendUni(school.name);

        const poisUrl = new URL(`${API_BASE}/pois/${backendCity}`);
        poisUrl.searchParams.set("uni", backendUni);

        const canCalculate =
          calculation &&
          calculation.city === city &&
          calculation.schoolName === school.name &&
          calculation.lat === school.coords[0] &&
          calculation.lon === school.coords[1];

        const pricingIsochroneUrl = canCalculate
          ? `${API_BASE}/pricingisochrone/${backendCity}/${backendUni}/${calculation.budget}`
          : null;

        const availabilityUrl = `${API_BASE}/availability/current/${backendCity}/${backendUni}`;
        const geofencingUrl = `${API_BASE}/geofencingzones/${backendCity}`;

        const [
          poisResult,
          pricingIsochroneResult,
          availabilityResult,
          geofencingResult,
        ] = await Promise.allSettled([
          fetch(poisUrl),
          pricingIsochroneUrl
            ? fetch(pricingIsochroneUrl)
            : Promise.resolve(null),
          fetch(availabilityUrl),
          fetch(geofencingUrl),
        ]);

        if (poisResult.status === "fulfilled" && poisResult.value.ok) {
          const poisJson = await poisResult.value.json();
          setBackendPois(geoJsonPoisToFrontend(poisJson.pois));
        } else {
          setBackendPois([]);
        }

        if (pricingIsochroneUrl) {
          if (
            pricingIsochroneResult.status === "fulfilled" &&
            pricingIsochroneResult.value?.ok
          ) {
            const pricingIsochroneJson =
              await pricingIsochroneResult.value.json();
            console.log("ISOCHRONE", pricingIsochroneJson.results);
            setPricingIsochroneData(pricingIsochroneJson);
          } else {
            setPricingIsochroneData(null);
            setBackendError(
              "Preis-/Isochrone-Daten konnten nicht geladen werden."
            );
          }
        }

        if (
          availabilityResult.status === "fulfilled" &&
          availabilityResult.value.ok
        ) {
          const availabilityJson = await availabilityResult.value.json();
          setBackendStations(normalizeAvailabilityToStations(availabilityJson));
          console.log("STATIONS", normalizeAvailabilityToStations(availabilityJson));
        } else {
          setBackendStations([]);
        }

        if (
          geofencingResult.status === "fulfilled" &&
          geofencingResult.value.ok
        ) {
          const geofencingJson = await geofencingResult.value.json();
          setGeofencingZones(normalizeGeofencingData(geofencingJson));
        } else {
          setGeofencingZones([]);
        }
      } catch (error) {
        console.error("Backend konnte nicht geladen werden:", error);
        setBackendPois([]);
        setBackendStations([]);
        setGeofencingZones([]);
        setPricingIsochroneData(null);
        setBackendError("Backend nicht erreichbar oder Route liefert Fehler.");
      } finally {
        setLoadingBackend(false);
      }
    }

    loadBackendData();
  }, [city, school.name, school.coords, calculation]);

  const activeVehicles = useMemo(() => {
    const vehicles = [];

    if (showBikes) vehicles.push("bike");
    if (showScooters) vehicles.push("scooter");

    return vehicles;
  }, [showBikes, showScooters]);

  const filteredBackendPois = useMemo(() => {
    if (selectedPoiType === "Alle") return backendPois;
    return backendPois.filter((poi) => poi.type === selectedPoiType);
  }, [backendPois, selectedPoiType]);

  const stationsNearStart = useMemo(() => {
    return backendStations.filter((station) => {
      return distanceKm(school.coords, station.coords) <= 0.2;
    });
  }, [backendStations, school.coords]);

  const allPoisWithReachability = useMemo(() => {
    const isochroneOffers = getIsochroneOffers(
      pricingIsochroneData,
      activeVehicles

    );

    return backendPois.map((poi) => {
      const theoreticalRoutes = isochroneOffers
        .filter((offer) => offer.geometry)
        .filter((offer) => pointInGeometry(poi.coords, offer.geometry))
        .map((offer) => {
          const blockedByGeofence = isPoiInProviderGeofence(
            poi,
            offer.provider,
            geofencingZones
          );

          const vehicleAvailable = providerHasAvailableVehicle(
            offer.provider,
            offer.vehicle,
            stationsNearStart
          );

          const realReachable = vehicleAvailable && !blockedByGeofence;

          return {
            offer,
            provider: offer.provider,
            vehicle: offer.vehicle,
            price: offer.price,
            max_minutes: offer.max_minutes,
            blockedByGeofence,
            vehicleAvailable,
            realReachable,
          };
        });

      const realRoutes = theoreticalRoutes.filter((route) => route.realReachable);
      const theoreticalOnlyRoutes = theoreticalRoutes.filter(
        (route) => !route.realReachable
      );

      let theoreticalReason = "";

      if (theoreticalOnlyRoutes.length > 0) {
        const hasGeofence = theoreticalOnlyRoutes.some(
          (route) => route.blockedByGeofence
        );

        theoreticalReason = hasGeofence
          ? "Liegt in einer Verbotszone"
          : "Aktuell kein Fahrzeug verfügbar";
      }

      return {
        ...poi,
        theoreticalRoutes,
        theoreticalOnlyRoutes,
        realRoutes,
        theoreticalRoute: theoreticalRoutes[0] || null,
        realRoute: realRoutes[0] || null,
        theoreticalReason,
        theoreticalReachable: theoreticalRoutes.length > 0,
        realReachable: realRoutes.length > 0,
      };
    });
  }, [
    backendPois,
    pricingIsochroneData,
    activeVehicles,
    stationsNearStart,
    geofencingZones,
  ]);
  const poisWithReachability = useMemo(() => {
    if (selectedPoiType === "Alle") return allPoisWithReachability;

    return allPoisWithReachability.filter(
      (poi) => poi.type === selectedPoiType
    );
  }, [allPoisWithReachability, selectedPoiType]);

  const realReachablePois = poisWithReachability.filter(
    (poi) => poi.realReachable
  );

  const theoreticalReachablePois = poisWithReachability.filter(
    (poi) => poi.theoreticalOnlyRoutes.length > 0
  );

  const notReachablePois = poisWithReachability.filter(
    (poi) => !poi.theoreticalReachable
  );

  const maxTheoreticalRadius = useMemo(() => {
    if (activeVehicles.length === 0) return 0;

    const radii = activeVehicles.map((vehicle) => {
      const offer = getBestIsochroneOffer(pricingIsochroneData, vehicle);
      if (!offer) return 0;

      return (offer.max_minutes / 60) * 15 * 1000;
    });

    return Math.max(...radii);
  }, [activeVehicles, pricingIsochroneData]);

  const maxRealRadius = useMemo(() => {
    const realOffers = poisWithReachability
      .flatMap((poi) => poi.realRoutes)
      .map((route) => route.max_minutes);

    if (realOffers.length === 0) return 0;

    return (Math.max(...realOffers) / 60) * 15 * 1000;
  }, [poisWithReachability]);

  return (
    <main className="main-view new-map-layout">
      <section className="top-filter-bar">
        <div className="filter-group">
          <span className="filter-label">Analysemodus</span>
          <strong>Budget + Live-Verfügbarkeit</strong>
        </div>

        <div className="divider" />

        <div className="filter-group">
          <span className="filter-label">Karte</span>

          <label className={`filter-chip geofence-chip${showGeofencingZones ? "active" : ""}`}>
            <input
              type="checkbox"
              checked={showGeofencingZones}
              onChange={(e) => setShowGeofencingZones(e.target.checked)}
            />
            Abstellverbot Zonen
          </label>
        </div>

        <div className="divider" />

        <div className="filter-group">
          <span className="filter-label">POI-Typen</span>
          <div className="chip-row">
            {["Alle", "Bahnhof", "Wohnheim", "Sportanlage"].map((type) => (
              <button
                key={type}
                className={`filter-chip ${selectedPoiType === type ? "active" : ""
                  }`}
                onClick={() => {
                  setSelectedPoiType(type);
                  setSelectedPoi(null);
                }}
              >
                {type === "Alle" && "Alle"}
                {type === "Bahnhof" && "Bahnhöfe"}
                {type === "Wohnheim" && "Wohnheime"}
                {type === "Sportanlage" && "Sport"}
              </button>
            ))}
          </div>
        </div>

        <div className="divider" />

        <div className="filter-group budget-filter">
          <span className="filter-label">Budget</span>
          <div className="budget-slider">
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={budget}
              onChange={(e) => {
                setBudget(Number(e.target.value));
                setPricingIsochroneData(null);
                setSelectedPoi(null);
              }}
            />

            <strong>{budget.toFixed(2)} €</strong>

            <div className="calculate-row">
              <button
                className="calculate-button"
                disabled={budget <= 0}
                onClick={() =>
                  setCalculation({
                    budget,
                    city,
                    schoolName: school.name,
                    lat: school.coords[0],
                    lon: school.coords[1],
                  })
                }
              >
                Berechnen
              </button>

              <span
                className={`calculate-status ${backendError
                  ? "error"
                  : loadingBackend
                    ? "loading"
                    : calculation === null
                      ? "waiting"
                      : calculation?.budget !== budget
                        ? "changed"
                        : "success"
                  }`}
              >
                {backendError
                  ? "Fehler"
                  : loadingBackend
                    ? "Lädt..."
                    : calculation === null
                      ? "Noch nicht berechnet"
                      : calculation?.budget !== budget
                        ? "Neu berechnen"
                        : "Berechnet"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="map-workspace">
        <aside className="results-panel">
          <h3>Auswertung</h3>

          <div className="school-card">
            <span>Startpunkt</span>
            <strong>{school.name}</strong>
            <small>{school.students} Studierende</small>
          </div>

          <div className="budget-card">
            <strong>Reichweite</strong>
            <p>Erreichbar: {(maxRealRadius / 1000).toFixed(1)} km</p>
            <p>Aktuell nicht mögliche Erreichbarkeit: {(maxTheoreticalRadius / 1000).toFixed(1)} km</p>
          </div>

          <div className="poi-summary-card">
            <span>
              {selectedPoiType === "Alle" ? "Alle POIs" : selectedPoiType}
            </span>
            <strong>{poisWithReachability.length} insgesamt</strong>
            <p>
              🟢 {realReachablePois.length} erreichbar · 🟡{" "}
              {theoreticalReachablePois.length} aktuell nicht erreichbar · 🔴{" "}
              {notReachablePois.length} nicht erreichbar
            </p>
          </div>

          <button
            className="poi-section-header poi-section-header-real"
            onClick={() => toggleSection("real")}
          >
            <span className="poi-section-title">
              <span className="poi-section-arrow">
                {collapsedSections.real ? "▶" : "▼"}
              </span>
              Erreichbar ({realReachablePois.length})
            </span>
            <span className="poi-section-dot green"></span>
          </button>

          {!collapsedSections.real && (
            <div className="poi-section-content">
              {realReachablePois.length === 0 ? (
                <div className="hint">Aktuell ist kein POI erreichbar.</div>
              ) : (
                realReachablePois.map((poi) =>
                  poi.realRoutes.map((route, index) => (
                    <button
                      key={`real-${poi.id}-${route.provider}-${index}`}
                      ref={selectedPoi?.id === poi.id ? selectedPoiRef : null}
                      className={`poi-list-card real ${selectedPoi?.id === poi.id ? "selected" : ""}`}
                      onClick={() => setSelectedPoi(poi)}
                    >
                      <div>
                        <strong>
                          {poi.icon} {poi.name}
                        </strong>
                        <small>
                          {route.provider} ·{" "}
                          {route.vehicle === "bike" ? "Bike" : "Scooter"} · bis{" "}
                          {route.max_minutes} Min
                        </small>
                      </div>
                      <span>{route.price.toFixed(2)} €</span>
                    </button>
                  ))
                )
              )}
            </div>
          )}

          <button
            className="poi-section-header poi-section-header-theoretical"
            onClick={() => toggleSection("theoretical")}
          >
            <span className="poi-section-title">
              <span className="poi-section-arrow">
                {collapsedSections.theoretical ? "▶" : "▼"}
              </span>
              Aktuell nicht erreichbar ({theoreticalReachablePois.length})
            </span>
            <span className="poi-section-dot yellow"></span>
          </button>

          {!collapsedSections.theoretical && (
            <div className="poi-section-content">
              {theoreticalReachablePois.length === 0 ? (
                <div className="hint">Aktuell keine theoretischen POIs.</div>
              ) : (
                theoreticalReachablePois.map((poi) =>
                  poi.theoreticalOnlyRoutes.map((route, index) => (
                    <button
                      key={`theoretical-${poi.id}-${route.provider}-${index}`}
                      ref={selectedPoi?.id === poi.id ? selectedPoiRef : null}
                      className={`poi-list-card theoretical ${selectedPoi?.id === poi.id ? "selected" : ""}`}
                      onClick={() => setSelectedPoi(poi)}
                    >
                      <div>
                        <strong>
                          {poi.icon} {poi.name}
                        </strong>

                        <small>
                          {route.blockedByGeofence
                            ? "Liegt in einer Verbotszone"
                            : "Aktuell kein Fahrzeug verfügbar"}
                        </small>

                        <small>
                          {route.provider} ·{" "}
                          {route.vehicle === "bike" ? "Bike" : "Scooter"} · bis{" "}
                          {route.max_minutes} Min
                        </small>
                      </div>

                      <span>{route.price.toFixed(2)} €</span>
                    </button>
                  ))
                )
              )}
            </div>
          )}

          <button
            className="poi-section-header poi-section-header-not"
            onClick={() => toggleSection("notReachable")}
          >
            <span className="poi-section-title">
              <span className="poi-section-arrow">
                {collapsedSections.notReachable ? "▶" : "▼"}
              </span>
              Nicht erreichbar ({notReachablePois.length})
            </span>
            <span className="poi-section-dot red"></span>
          </button>

          {!collapsedSections.notReachable && (
            <div className="poi-section-content">
              {notReachablePois.length === 0 ? (
                <div className="hint">
                  Alle POIs sind mindestens theoretisch erreichbar.
                </div>
              ) : (
                notReachablePois.map((poi) => (
                  <button
                    key={`not-${poi.id}`}
                    ref={selectedPoi?.id === poi.id ? selectedPoiRef : null}
                    className={`poi-list-card not-reachable ${selectedPoi?.id === poi.id ? "selected" : ""}`}
                    onClick={() => setSelectedPoi(poi)}
                  >
                    <div>
                      <strong>
                        {poi.icon} {poi.name}
                      </strong>
                      <small>Liegt außerhalb deines Budgets</small>
                    </div>
                    <span>›</span>
                  </button>
                ))
              )}
            </div>
          )}
        </aside>

        <div className="map-wrapper">
          <Map
            key={`${school.name}-${school.coords[0]}-${school.coords[1]}`}
            center={school.coords}
            label={school.name}
            markerCoords={school.coords}
            pois={poisWithReachability}
            isochronePois={allPoisWithReachability}
            activeVehicles={activeVehicles}
            selectedPoi={selectedPoi}
            setSelectedPoi={setSelectedPoi}
            availability={false}
            stationsInRadius={stationsNearStart}
            showStationsInBudgetView={false}
            timeSlot={currentAvailabilityKey}
            realRadius={maxRealRadius}
            theoreticalRadius={maxTheoreticalRadius}
            isochroneData={pricingIsochroneData}
            geofencingZones={geofencingZones}
            showGeofencingZones={showGeofencingZones}

          />
        </div>
      </section>
    </main>
  );
}