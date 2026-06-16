import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Popup,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    map.setView(center, 14);
    setTimeout(() => map.invalidateSize(true), 100);
    setTimeout(() => map.invalidateSize(true), 500);
  }, [center, map]);

  return null;
}

function getTrafficEmoji(status) {
  if (status === "green") return "🟢";
  if (status === "yellow") return "🟡";
  return "🔴";
}

function getAvailabilityStatus(station, timeSlot) {
  const available = station.availability[timeSlot];
  const ratio = available / station.capacity;

  if (ratio >= 0.5) return "green";
  if (ratio >= 0.2) return "yellow";
  return "red";
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

function createStartpointIcon() {
  return L.divIcon({
    html: `<div style="
      width: 32px;
      height: 40px;
      background: #ff4d4d;
      border: 3px solid #fff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    ">
      <div style="transform: rotate(45deg);">📍</div>
    </div>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
    className: "custom-pin-icon",
  });
}

function calculateRadiusMeters(budget, vehicle) {
  const tariffs = {
    bike: { unlock: 0, pricePerMinute: 0.1, speedKmh: 15 },
    scooter: { unlock: 1, pricePerMinute: 0.25, speedKmh: 15 },
  };

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

export default function Map({
  center,
  label,
  markerCoords,
  pois = [],
  selectedPoi = null,
  setSelectedPoi = () => {},
  budget = 5,
  availability = false,
  timeSlot = "morning",
  stationsInRadius = [],
}) {
  const startpointIcon = createStartpointIcon();

  const bikeRadius = calculateRadiusMeters(budget, "bike");
  const scooterRadius = calculateRadiusMeters(budget, "scooter");

  return (
    <MapContainer
      center={center}
      zoom={14}
      className="leaflet-map"
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <RecenterMap center={center} />

      {!availability && (
        <>
          <Circle
            center={center}
            radius={bikeRadius}
            pathOptions={{
              color: "#047857",
              fillColor: "#047857",
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "8 8",
            }}
          />

          <Circle
            center={center}
            radius={scooterRadius}
            pathOptions={{
              color: "#7c3aed",
              fillColor: "#7c3aed",
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "5 8",
            }}
          />
        </>
      )}

      {!availability && selectedPoi && (
        <Circle
          center={center}
          radius={distanceKm(center, selectedPoi.coords) * 1000}
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
          center={center}
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

      {markerCoords && (
        <Marker position={markerCoords} icon={startpointIcon}>
          <Popup>{label}</Popup>
        </Marker>
      )}

      {!availability &&
        pois.map((poi) => (
          <Marker
            key={poi.name}
            position={poi.coords}
            eventHandlers={{
              click: () => setSelectedPoi(poi),
            }}
          >
            <Popup>
              {poi.icon} <strong>{poi.name}</strong>
              <br />
              {poi.type}
            </Popup>
          </Marker>
        ))}

      {availability &&
        stationsInRadius.map((station) => {
          const status = getAvailabilityStatus(station, timeSlot);

          return (
            <Marker
              key={station.name}
              position={station.coords}
              icon={createStationIcon(status)}
            >
              <Popup>
                {getTrafficEmoji(status)} <strong>{station.name}</strong>
                <br />
                {station.provider} · {station.type}
                <br />
                {station.availability[timeSlot]} von {station.capacity} verfügbar
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}