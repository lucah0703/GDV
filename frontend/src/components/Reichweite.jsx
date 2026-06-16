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

function calculateCost(start, destination, vehicle) {
    const km = distanceKm(start, destination);
    const tariff = tariffs[vehicle];
    const minutes = (km / tariff.speedKmh) * 60;
    const price = tariff.unlock + minutes * tariff.pricePerMinute;

    return { km, minutes, price };
}

function getCurrentAvailability(station) {
    return station.availability?.current ?? station.availability?.morning ?? 0;
}

function getAvailabilityStatus(station) {
    const available = getCurrentAvailability(station);
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

export default function Reichweite({
    city,
    school,
    pois = [],
    stations = [],
}) {
    const [budget, setBudget] = useState(5);
    const [selectedPoiType, setSelectedPoiType] = useState("Alle");
    const [selectedPoi, setSelectedPoi] = useState(null);
    const [showBikes, setShowBikes] = useState(true);
    const [showScooters, setShowScooters] = useState(true);

    const currentAvailabilityKey = "current";

    const activeVehicles = useMemo(() => {
        const vehicles = [];
        if (showBikes) vehicles.push("bike");
        if (showScooters) vehicles.push("scooter");
        return vehicles;
    }, [showBikes, showScooters]);

    const stationsWithCurrentAvailability = useMemo(() => {
        return stations.map((station) => ({
            ...station,
            availability: {
                ...station.availability,
                current: getCurrentAvailability(station),
            },
        }));
    }, [stations]);

    const stationsNearStart = useMemo(() => {
        return stationsWithCurrentAvailability.filter((station) => {
            const isNear = distanceKm(school.coords, station.coords) <= 0.2;
            const vehicleActive = activeVehicles.includes(station.vehicle);
            return isNear && vehicleActive;
        });
    }, [stationsWithCurrentAvailability, school, activeVehicles]);

    const filteredPois = useMemo(() => {
        if (selectedPoiType === "Alle") return pois;
        return pois.filter((poi) => poi.type === selectedPoiType);
    }, [pois, selectedPoiType]);

    function getBestRouteToPoi(poi, onlyAvailable) {
        const options = stationsNearStart
            .filter((station) => {
                if (!onlyAvailable) return true;
                return getCurrentAvailability(station) > 0;
            })
            .map((station) => {
                const vehicle = station.vehicle;
                const cost = calculateCost(station.coords, poi.coords, vehicle);

                return {
                    station,
                    vehicle,
                    cost,
                    status: getAvailabilityStatus(station),
                    available: getCurrentAvailability(station) > 0,
                };
            })
            .sort((a, b) => a.cost.price - b.cost.price);

        return options[0] || null;
    }

    const poisWithReachability = useMemo(() => {
        return filteredPois.map((poi) => {
            const theoreticalRoute = getBestRouteToPoi(poi, false);
            const realRoute = getBestRouteToPoi(poi, true);

            const theoreticalReachable =
                theoreticalRoute && theoreticalRoute.cost.price <= budget;

            const realReachable = realRoute && realRoute.cost.price <= budget;

            return {
                ...poi,
                theoreticalRoute,
                realRoute,
                theoreticalReachable,
                realReachable,
            };
        });
    }, [filteredPois, stationsNearStart, budget]);

    const realReachablePois = poisWithReachability.filter(
        (poi) => poi.realReachable
    );

    const theoreticalReachablePois = poisWithReachability.filter(
        (poi) => !poi.realReachable && poi.theoreticalReachable
    );

    const notReachablePois = poisWithReachability.filter(
        (poi) => !poi.theoreticalReachable
    );

    const maxTheoreticalRadius = useMemo(() => {
        if (activeVehicles.length === 0) return 0;

        const radii = activeVehicles.map((vehicle) => {
            const tariff = tariffs[vehicle];
            const usableBudget = budget - tariff.unlock;
            if (usableBudget <= 0) return 0;

            const minutes = usableBudget / tariff.pricePerMinute;
            const km = (minutes / 60) * tariff.speedKmh;
            return km * 1000;
        });

        return Math.max(...radii);
    }, [budget, activeVehicles]);

    const maxRealRadius = useMemo(() => {
        const availableStations = stationsNearStart.filter(
            (station) => getCurrentAvailability(station) > 0
        );

        if (availableStations.length === 0) return 0;

        const radii = availableStations.map((station) => {
            const tariff = tariffs[station.vehicle];
            const usableBudget = budget - tariff.unlock;
            if (usableBudget <= 0) return 0;

            const minutes = usableBudget / tariff.pricePerMinute;
            const km = (minutes / 60) * tariff.speedKmh;
            return km * 1000;
        });

        return Math.max(...radii);
    }, [budget, stationsNearStart]);

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
                        onChange={() => setSelectedPoiType("Alle")}
                    />
                    Alle anzeigen
                </label>

                <label>
                    <input
                        type="radio"
                        name="poiType"
                        checked={selectedPoiType === "Bahnhof"}
                        onChange={() => setSelectedPoiType("Bahnhof")}
                    />
                    Bahnhöfe
                </label>

                <label>
                    <input
                        type="radio"
                        name="poiType"
                        checked={selectedPoiType === "Wohnheim"}
                        onChange={() => setSelectedPoiType("Wohnheim")}
                    />
                    Wohnheime
                </label>

                <label>
                    <input
                        type="radio"
                        name="poiType"
                        checked={selectedPoiType === "Sportanlage"}
                        onChange={() => setSelectedPoiType("Sportanlage")}
                    />
                    Hochschul-Sportanlagen
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
                    <strong>Reichweite</strong>
                    <p>Real: {(maxRealRadius / 1000).toFixed(1)} km</p>
                    <p>Theoretisch: {(maxTheoreticalRadius / 1000).toFixed(1)} km</p>
                </div>

                <div className="budget-card">
                    <strong>Stationen im 200m-Umkreis</strong>

                    {stationsNearStart.length === 0 ? (
                        <p>Keine Station im Umkreis gefunden.</p>
                    ) : (
                        stationsNearStart.map((station) => {
                            const status = getAvailabilityStatus(station);
                            const availableNow = getCurrentAvailability(station);

                            return (
                                <p key={station.name}>
                                    {getTrafficEmoji(status)} {station.provider} ·{" "}
                                    {station.vehicle === "bike" ? "Bike" : "Scooter"} ·{" "}
                                    {availableNow}/{station.capacity}
                                </p>
                            );
                        })
                    )}
                </div>

                <div className="hint">
                    Diese Ansicht nutzt die aktuelle Verfügbarkeit. Später kommt dieser
                    Wert direkt über die Live-API.
                </div>
            </aside>

            <section className="map">
                <Map
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
                />
            </section>

            <aside className="panel">
                <h3>Auswertung</h3>

                <div className="school-card">
                    <span>Startpunkt</span>
                    <strong>{school.name}</strong>
                    <small>{school.students} Studierende</small>
                </div>

                <div className="poi-summary-card">
                    <span>{selectedPoiType}</span>
                    <strong>{filteredPois.length} insgesamt</strong>
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

                <h4>🟢 Real erreichbar</h4>

                {realReachablePois.length === 0 ? (
                    <div className="hint">Aktuell ist kein POI real erreichbar.</div>
                ) : (
                    realReachablePois.map((poi) => (
                        <button
                            key={poi.name}
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
                                    {poi.realRoute.cost.minutes.toFixed(0)} Min
                                </small>
                            </div>
                            <span>{poi.realRoute.cost.price.toFixed(2)} €</span>
                        </button>
                    ))
                )}

                <h4>🟡 Theoretisch erreichbar</h4>

                {theoreticalReachablePois.length === 0 ? (
                    <div className="hint">Keine theoretisch erreichbaren POIs.</div>
                ) : (
                    theoreticalReachablePois.map((poi) => (
                        <button
                            key={poi.name}
                            className="poi-list-card theoretical"
                            onClick={() => setSelectedPoi(poi)}
                        >
                            <div>
                                <strong>
                                    {poi.icon} {poi.name}
                                </strong>
                                <small>
                                    {poi.theoreticalRoute.station.provider} · aktuell keine
                                    Verfügbarkeit
                                </small>
                            </div>
                            <span>{poi.theoreticalRoute.cost.price.toFixed(2)} €</span>
                        </button>
                    ))
                )}

                <h4>🔴 Nicht erreichbar</h4>

                {notReachablePois.map((poi) => (
                    <button
                        key={poi.name}
                        className="poi-list-card not-reachable"
                        onClick={() => setSelectedPoi(poi)}
                    >
                        <div>
                            <strong>
                                {poi.icon} {poi.name}
                            </strong>
                            <small>Außerhalb des Budgets</small>
                        </div>
                        <span>—</span>
                    </button>
                ))}
            </aside>
        </main>
    );
}