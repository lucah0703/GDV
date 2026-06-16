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

function createStationIcon(status, vehicle) {
  const symbol = vehicle === "bike" ? "🚲" : "🛴";

  return L.divIcon({
    className: "station-map-marker",
    html: `<div class="station-map-marker-inner">${getTrafficEmoji(status)}${symbol}</div>`,
    iconSize: [44, 34],
    iconAnchor: [22, 17],
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

export default function Map({
  center,
  label,
  markerCoords,
  pois = [],
  selectedPoi = null,
  setSelectedPoi = () => {},
  availability = false,
  timeSlot = "morning",
  stationsInRadius = [],
  showStationsInBudgetView = false,
  realRadius = 0,
  theoreticalRadius = 0,
}) {
  const startpointIcon = createStartpointIcon();

  return (
    <MapContainer
      center={center}
      zoom={14}
      className="leaflet-map"
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <RecenterMap center={center} />

      {!availability && theoreticalRadius > 0 && (
        <Circle
          center={center}
          radius={theoreticalRadius}
          pathOptions={{
            color: "#a855f7",
            fillColor: "#a855f7",
            fillOpacity: 0.07,
            weight: 2,
            dashArray: "8 8",
          }}
        />
      )}

      {!availability && realRadius > 0 && (
        <Circle
          center={center}
          radius={realRadius}
          pathOptions={{
            color: "#047857",
            fillColor: "#047857",
            fillOpacity: 0.08,
            weight: 3,
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
              {poi.realReachable
                ? "🟢 real erreichbar"
                : poi.theoreticalReachable
                ? "🟡 theoretisch erreichbar"
                : "🔴 nicht erreichbar"}
            </Popup>
          </Marker>
        ))}

      {showStationsInBudgetView &&
        stationsInRadius.map((station) => {
          const status = getAvailabilityStatus(station, timeSlot);

          return (
            <Marker
              key={station.name}
              position={station.coords}
              icon={createStationIcon(status, station.vehicle)}
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

      {availability &&
        stationsInRadius.map((station) => {
          const status = getAvailabilityStatus(station, timeSlot);

          return (
            <Marker
              key={station.name}
              position={station.coords}
              icon={createStationIcon(status, station.vehicle)}
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