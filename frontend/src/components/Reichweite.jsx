import { useEffect, useMemo, useState } from "react";
import Map from "./Map";

const API_BASE = "http://localhost:8000";

const SPEED_KMH = {
    bike: 15,
    scooter: 15,
};

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
                address: props.address || "",
                category: props.category,
            };
        })
        .filter(Boolean);
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

function calculateTravel(start, destination, vehicle) {
    const km = distanceKm(start, destination);
    const minutes = (km / SPEED_KMH[vehicle]) * 60;

    return { km, minutes };
}

function getCheapestOffer(pricingIsochroneData, vehicle, requiredMinutes) {
    const backendKey = vehicle === "scooter" ? "e-scooter" : "bike";
    const offers = pricingIsochroneData?.results?.[backendKey] || [];

    return (
        offers
            .filter((offer) => offer.max_minutes >= requiredMinutes)
            .sort((a, b) => a.price - b.price)[0] || null
    );
}

function normalizeAvailabilityToStations(data) {
    const stations = [];

    const bikeItems = Array.isArray(data?.bike) ? data.bike : [];
    const scooterItems = Array.isArray(data?.["e-scooter"]) ? data["e-scooter"] : [];

    bikeItems.forEach((item, index) => {
        const lat = item.lat ?? item.latitude ?? item.station_lat ?? item.y ?? item.coords?.[0];
        const lon = item.lon ?? item.lng ?? item.longitude ?? item.station_lon ?? item.x ?? item.coords?.[1];

        if (lat == null || lon == null) return;

        stations.push({
            id: item.station_id || item.id || `bike-${index}`,
            name: item.name || item.station_name || `Bike-Station ${index + 1}`,
            provider: item.provider || "bike",
            type: "Bike-Station",
            vehicle: "bike",
            coords: [Number(lat), Number(lon)],
            capacity: Number(item.capacity || item.num_docks_available || item.num_docks || 1),
            availability: {
                current: Number(
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
        const lon = item.lon ?? item.lng ?? item.longitude ?? item.x ?? item.coords?.[1];

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

function getAvailabilityStatus(station) {
    const available = getCurrentAvailability(station);
    const ratio = available / Math.max(station.capacity || 1, 1);

    if (ratio >= 0.5) return "green";
    if (ratio >= 0.2) return "yellow";
    return "red";
}

function getTrafficEmoji(status) {
    if (status === "green") return "🟢";
    if (status === "yellow") return "🟡";
    return "🔴";
}

function getBestIsochroneOffer(pricingIsochroneData, vehicle) {
    const backendKey = vehicle === "scooter" ? "e-scooter" : "bike";
    const offers = pricingIsochroneData?.results?.[backendKey] || [];

    return [...offers].sort((a, b) => b.max_minutes - a.max_minutes)[0] || null;
}

export default function Reichweite({ city, school }) {
    const [budget, setBudget] = useState(5);
    const [debouncedBudget, setDebouncedBudget] = useState(5);

    const [selectedPoiType, setSelectedPoiType] = useState("Alle");
    const [selectedPoi, setSelectedPoi] = useState(null);
    const [showBikes, setShowBikes] = useState(true);
    const [showScooters, setShowScooters] = useState(true);

    const [backendPois, setBackendPois] = useState([]);
    const [backendStations, setBackendStations] = useState([]);
    const [pricingIsochroneData, setPricingIsochroneData] = useState(null);
    const [loadingBackend, setLoadingBackend] = useState(false);
    const [backendError, setBackendError] = useState("");

    const currentAvailabilityKey = "current";

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedBudget(budget);
        }, 500);

        return () => clearTimeout(timer);
    }, [budget]);

    useEffect(() => {
        async function loadBackendData() {
            try {
                setLoadingBackend(true);
                setBackendError("");

                const backendCity = getBackendCity(city);
                const backendUni = getBackendUni(school.name);

                const poisUrl = new URL(`${API_BASE}/pois/${backendCity}`);
                poisUrl.searchParams.set("uni", backendUni);

                const pricingIsochroneUrl =
                    `${API_BASE}/pricingisochrone/${backendCity}/${backendUni}/${debouncedBudget}`;

                const availabilityUrl =
                    `${API_BASE}/availability/current/${backendCity}/${backendUni}`;

                const [poisResult, pricingIsochroneResult, availabilityResult] =
                    await Promise.allSettled([
                        fetch(poisUrl),
                        fetch(pricingIsochroneUrl),
                        fetch(availabilityUrl),
                    ]);

                const poisResponse =
                    poisResult.status === "fulfilled" ? poisResult.value : null;

                const pricingIsochroneResponse =
                    pricingIsochroneResult.status === "fulfilled"
                        ? pricingIsochroneResult.value
                        : null;

                const availabilityResponse =
                    availabilityResult.status === "fulfilled"
                        ? availabilityResult.value
                        : null;

                if (poisResponse?.ok) {
                    const poisJson = await poisResponse.json();
                    setBackendPois(geoJsonPoisToFrontend(poisJson));
                } else {
                    setBackendPois([]);
                }

                if (pricingIsochroneResponse?.ok) {
                    const pricingIsochroneJson = await pricingIsochroneResponse.json();
                    setPricingIsochroneData(pricingIsochroneJson);
                } else {
                    setPricingIsochroneData(null);
                    setBackendError("Preis-/Isochrone-Daten konnten nicht geladen werden.");
                }

                if (availabilityResponse?.ok) {
                    const availabilityJson = await availabilityResponse.json();
                    setBackendStations(normalizeAvailabilityToStations(availabilityJson));
                } else {
                    setBackendStations([]);
                }
            } catch (error) {
                console.error("Backend konnte nicht geladen werden:", error);
                setBackendPois([]);
                setBackendStations([]);
                setPricingIsochroneData(null);
                setBackendError("Backend nicht erreichbar oder Route liefert Fehler.");
            } finally {
                setLoadingBackend(false);
            }
        }

        loadBackendData();
    }, [city, school, debouncedBudget]);

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
            const isNear = distanceKm(school.coords, station.coords) <= 0.2;
            const vehicleActive = activeVehicles.includes(station.vehicle);
            return isNear && vehicleActive;
        });
    }, [backendStations, school, activeVehicles]);

    const poisWithReachability = useMemo(() => {
        function getBestRouteToPoi(poi, onlyAvailable) {
            const options = stationsNearStart
                .filter((station) => {
                    if (!onlyAvailable) return true;
                    return getCurrentAvailability(station) > 0;
                })
                .map((station) => {
                    const vehicle = station.vehicle;
                    const travel = calculateTravel(station.coords, poi.coords, vehicle);
                    const offer = getCheapestOffer(
                        pricingIsochroneData,
                        vehicle,
                        travel.minutes
                    );

                    if (!offer) return null;

                    return {
                        station,
                        vehicle,
                        travel,
                        offer,
                        status: getAvailabilityStatus(station),
                        available: getCurrentAvailability(station) > 0,
                        price: offer.price,
                    };
                })
                .filter(Boolean)
                .sort((a, b) => a.price - b.price);

            return options[0] || null;
        }

        return filteredBackendPois.map((poi) => {
            const theoreticalRoute = getBestRouteToPoi(poi, false);
            const realRoute = getBestRouteToPoi(poi, true);

            return {
                ...poi,
                theoreticalRoute,
                realRoute,
                theoreticalReachable: Boolean(theoreticalRoute),
                realReachable: Boolean(realRoute),
            };
        });
    }, [filteredBackendPois, stationsNearStart, pricingIsochroneData]);

    const realReachablePois = poisWithReachability.filter((poi) => poi.realReachable);
    const theoreticalReachablePois = poisWithReachability.filter(
        (poi) => !poi.realReachable && poi.theoreticalReachable
    );
    const notReachablePois = poisWithReachability.filter(
        (poi) => !poi.theoreticalReachable
    );

    const maxTheoreticalRadius = useMemo(() => {
        if (activeVehicles.length === 0) return 0;

        const radii = activeVehicles.map((vehicle) => {
            const offer = getBestIsochroneOffer(pricingIsochroneData, vehicle);
            if (!offer) return 0;
            return (offer.max_minutes / 60) * SPEED_KMH[vehicle] * 1000;
        });

        return Math.max(...radii);
    }, [activeVehicles, pricingIsochroneData]);

    const maxRealRadius = useMemo(() => {
        const availableStations = stationsNearStart.filter(
            (station) => getCurrentAvailability(station) > 0
        );

        if (availableStations.length === 0) return 0;

        const radii = availableStations.map((station) => {
            const offer = getBestIsochroneOffer(pricingIsochroneData, station.vehicle);
            if (!offer) return 0;
            return (offer.max_minutes / 60) * SPEED_KMH[station.vehicle] * 1000;
        });

        return Math.max(...radii);
    }, [stationsNearStart, pricingIsochroneData]);

    return (
        <main className="layout main-view">
            <aside className="panel">
                <h3>Filter</h3>

                <h4>Analysemodus</h4>
                <div className="analysis-mode">Budget + Live-Verfügbarkeit</div>

                <h4>Verkehrsmittel</h4>

                <label>
                    <input
                        type="checkbox"
                        checked={showBikes}
                        onChange={(e) => setShowBikes(e.target.checked)}
                    />
                    Bike / E-Bike
                </label>

                <label>
                    <input
                        type="checkbox"
                        checked={showScooters}
                        onChange={(e) => setShowScooters(e.target.checked)}
                    />
                    E-Scooter
                </label>

                <h4>POI-Typen</h4>

                <label>
                    <input
                        type="radio"
                        name="poiType"
                        checked={selectedPoiType === "Alle"}
                        onChange={() => {
                            setSelectedPoiType("Alle");
                            setSelectedPoi(null);
                        }}
                    />
                    Alle anzeigen
                </label>

                <label>
                    <input
                        type="radio"
                        name="poiType"
                        checked={selectedPoiType === "Bahnhof"}
                        onChange={() => {
                            setSelectedPoiType("Bahnhof");
                            setSelectedPoi(null);
                        }}
                    />
                    Bahnhöfe
                </label>

                <label>
                    <input
                        type="radio"
                        name="poiType"
                        checked={selectedPoiType === "Wohnheim"}
                        onChange={() => {
                            setSelectedPoiType("Wohnheim");
                            setSelectedPoi(null);
                        }}
                    />
                    Wohnheime
                </label>

                <label>
                    <input
                        type="radio"
                        name="poiType"
                        checked={selectedPoiType === "Sportanlage"}
                        onChange={() => {
                            setSelectedPoiType("Sportanlage");
                            setSelectedPoi(null);
                        }}
                    />
                    Sportanlagen
                </label>

                <h4>Budget</h4>
                <p className="muted">Preis festlegen</p>

                <input
                    className="budget-input"
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                />

                <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                />

                <div className="budget-value">{budget.toFixed(2)} €</div>

                {budget !== debouncedBudget && (
                    <div className="hint">Budget wird übernommen...</div>
                )}

                <div className="budget-card">
                    <strong>Reichweite</strong>
                    <p>Real: {(maxRealRadius / 1000).toFixed(1)} km</p>
                    <p>Theoretisch: {(maxTheoreticalRadius / 1000).toFixed(1)} km</p>
                </div>

                <div className="budget-card">
                    <strong>Stationen/Fahrzeuge im 200m-Umkreis</strong>

                    {stationsNearStart.length === 0 ? (
                        <p>Keine Station oder kein Fahrzeug im Umkreis gefunden.</p>
                    ) : (
                        stationsNearStart.slice(0, 8).map((station) => {
                            const status = getAvailabilityStatus(station);
                            const availableNow = getCurrentAvailability(station);

                            return (
                                <p key={station.id || station.name}>
                                    {getTrafficEmoji(status)} {station.provider} ·{" "}
                                    {station.vehicle === "bike" ? "Bike" : "Scooter"} ·{" "}
                                    {availableNow}/{station.capacity}
                                </p>
                            );
                        })
                    )}
                </div>

                {loadingBackend && <div className="hint">Backend-Daten werden geladen...</div>}
                {backendError && <div className="hint">{backendError}</div>}
            </aside>

            <Map
                key={selectedPoiType}
                center={school.coords}
                label={school.name}
                markerCoords={school.coords}
                pois={poisWithReachability}
                selectedPoi={selectedPoi}
                setSelectedPoi={setSelectedPoi}
                availability={false}
                stationsInRadius={stationsNearStart}
                showStationsInBudgetView={true}
                timeSlot={currentAvailabilityKey}
                realRadius={maxRealRadius}
                theoreticalRadius={maxTheoreticalRadius}
                isochroneData={pricingIsochroneData}
            />

            <aside className="panel">
                <h3>Auswertung</h3>

                <div className="school-card">
                    <span>Startpunkt</span>
                    <strong>{school.name}</strong>
                    <small>{school.students} Studierende</small>
                </div>

                <div className="poi-summary-card">
                    <span>{selectedPoiType === "Alle" ? "Alle POIs" : selectedPoiType}</span>
                    <strong>{poisWithReachability.length} insgesamt</strong>
                    <p>
                        🟢 {realReachablePois.length} real · 🟡{" "}
                        {theoreticalReachablePois.length} theoretisch · 🔴{" "}
                        {notReachablePois.length} nicht erreichbar
                    </p>
                </div>

                {selectedPoi && (
                    <>
                        <button className="back-button" onClick={() => setSelectedPoi(null)}>
                            ← Auswahl zurücksetzen
                        </button>

                        <div className="poi-title">
                            <span>{selectedPoi.icon}</span>
                            <div>
                                <strong>{selectedPoi.name}</strong>
                                <small>{selectedPoi.address}</small>
                            </div>
                        </div>
                    </>
                )}

                <h4>Real erreichbar</h4>

                {realReachablePois.length === 0 ? (
                    <div className="hint">Aktuell ist kein POI real erreichbar.</div>
                ) : (
                    realReachablePois.map((poi) => (
                        <button
                            key={`real-${poi.id}`}
                            className="poi-list-card real"
                            onClick={() => setSelectedPoi(poi)}
                        >
                            <div>
                                <strong>
                                    {poi.icon} {poi.name}
                                </strong>
                                <small>
                                    {poi.realRoute.station.provider} ·{" "}
                                    {poi.realRoute.vehicle === "bike" ? "Bike" : "Scooter"} ·{" "}
                                    {poi.realRoute.travel.minutes.toFixed(0)} Min
                                </small>
                                <small>
                                    {poi.realRoute.offer.label ||
                                        poi.realRoute.offer.provider ||
                                        "Preisplan"}
                                </small>
                            </div>
                            <span>{poi.realRoute.price.toFixed(2)} €</span>
                        </button>
                    ))
                )}

                <h4>Theoretisch erreichbar</h4>

                {theoreticalReachablePois.length === 0 ? (
                    <div className="hint">Keine theoretisch erreichbaren POIs.</div>
                ) : (
                    theoreticalReachablePois.map((poi) => (
                        <button
                            key={`theoretical-${poi.id}`}
                            className="poi-list-card theoretical"
                            onClick={() => setSelectedPoi(poi)}
                        >
                            <div>
                                <strong>
                                    {poi.icon} {poi.name}
                                </strong>
                                <small>
                                    {poi.theoreticalRoute.station.provider} · aktuell keine Verfügbarkeit
                                </small>
                                <small>
                                    {poi.theoreticalRoute.offer.label ||
                                        poi.theoreticalRoute.offer.provider ||
                                        "Preisplan"}
                                </small>
                            </div>
                            <span>{poi.theoreticalRoute.price.toFixed(2)} €</span>
                        </button>
                    ))
                )}

                <h4>Nicht erreichbar</h4>

                {notReachablePois.map((poi) => (
                    <button
                        key={`not-${poi.id}`}
                        className="poi-list-card not-reachable"
                        onClick={() => setSelectedPoi(poi)}
                    >
                        <div>
                            <strong>
                                {poi.icon} {poi.name}
                            </strong>
                            <small>Außerhalb des Budgets oder kein passender Preisplan</small>
                        </div>
                        <span>—</span>
                    </button>
                ))}
            </aside>
        </main>
    );
}