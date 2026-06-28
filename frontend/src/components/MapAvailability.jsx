import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import RecenterMap from "./map/RecenterMap";
import ScooterHeatmap from "./map/ScooterHeatmap";

import {
  createStartpointIcon,
  createStationIcon,
  getAvailabilityStatus,
  getAvailable,
  getTrafficEmoji,
  MapClickHandler,
} from "./map/mapUtils";

export default function MapAvailability({
  center,
  label,
  markerCoords,

  timeSlot = "current",

  stationsInRadius = [],

  scooterCoords = [],
  showScooterHeatmap = false,

  selectedStation = null,
  onStationClick = () => {},
}) {
  const startpointIcon = createStartpointIcon();

  return (
    <MapContainer
      center={center}
      zoom={14}
      className="leaflet-map"
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap &copy; CARTO"
        subdomains="abcd"
      />

      <RecenterMap center={center} />

      <MapClickHandler
        onMapClick={() => onStationClick(null)}
      />

      {showScooterHeatmap && scooterCoords.length > 0 && (
        <ScooterHeatmap points={scooterCoords} />
      )}

      {markerCoords && (
        <Marker position={markerCoords} icon={startpointIcon}>
          <Popup>{label}</Popup>
        </Marker>
      )}

      {!showScooterHeatmap &&
        stationsInRadius.map((station) => {
          const status = getAvailabilityStatus(station, timeSlot);
          const available = getAvailable(station, timeSlot);

          const isSelected =
            selectedStation?.id === station.id;

          return (
            <Marker
              key={`${station.vehicle}-${station.id || station.name}`}
              position={station.coords}
              icon={createStationIcon(
                status,
                station.vehicle,
                isSelected
              )}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => onStationClick(station),
              }}
            >
              <Popup>
                {getTrafficEmoji(status)}{" "}
                <strong>{station.name}</strong>

                <br />

                {station.provider} · {station.type}

                <br />

                {available} von {station.capacity} verfügbar
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}