import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Popup,
  Circle,
  GeoJSON,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import RecenterMap from "./map/RecenterMap";
import {
  getTrafficEmoji,
  getAvailable,
  getAvailabilityStatus,
  createStationIcon,
  createStartpointIcon,
} from "./map/mapUtils";

import ScooterHeatmap from "./map/ScooterHeatmap";

export default function Map({
  center,
  label,
  markerCoords,
  pois = [],
  setSelectedPoi = () => {},
  availability = false,
  timeSlot = "current",
  stationsInRadius = [],
  showStationsInBudgetView = false,
  realRadius = 0,
  theoreticalRadius = 0,
  isochroneData = null,
  bikeCoords = [],
  showMobilityLayer = false,
  onStationClick = () => {},
  scooterCoords = [],
  showScooterHeatmap = false,
}) {
  const startpointIcon = createStartpointIcon();
  const normalTiles = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const grayscaleTiles =
  "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png";

  return (
    <MapContainer
      center={center}
      zoom={14}
      className="leaflet-map"
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer url={ grayscaleTiles}/>


      {showScooterHeatmap && scooterCoords.length > 0 && (
        <ScooterHeatmap points={scooterCoords} />
      )}

      {showMobilityLayer && scooterCoords.length > 0 && (
  <>
    {scooterCoords.map((pos, i) => (
      <CircleMarker
        key={`scooter-${i}`}
        center={[pos[0], pos[1]]}
        radius={3}
        pathOptions={{
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.7,
          weight: 1,
        }}
      />
    ))}
  </>
)}

{showMobilityLayer && bikeCoords.length > 0 && (
  <>
    {bikeCoords.map((pos, i) => (
      <CircleMarker
        key={`bike-${i}`}
        center={[pos[0], pos[1]]}
        radius={3}
        pathOptions={{
          color: "#16a34a",
          fillColor: "#22c55e",
          fillOpacity: 0.7,
          weight: 1,
        }}
      />
    ))}
  </>
)}

      <RecenterMap center={center} />

      {!availability &&
        isochroneData?.results &&
        Object.entries(isochroneData.results).map(([vehicleType, offers]) =>
          offers.map((offer, index) =>
            offer.geometry ? (
              <GeoJSON
                key={`${vehicleType}-${offer.provider}-${index}`}
                data={{
                  type: "Feature",
                  properties: {
                    provider: offer.provider,
                    vehicleType,
                  },
                  geometry: offer.geometry,
                }}
                style={{
                  color: vehicleType === "bike" ? "#047857" : "#7c3aed",
                  fillColor: vehicleType === "bike" ? "#047857" : "#7c3aed",
                  fillOpacity: 0.12,
                  weight: 2,
                  dashArray: vehicleType === "bike" ? undefined : "8 8",
                }}
              />
            ) : null
          )
        )}

      {!availability && !isochroneData && theoreticalRadius > 0 && (
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

      {!availability && !isochroneData && realRadius > 0 && (
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
            key={poi.id}
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

      {(availability || showStationsInBudgetView) &&
        stationsInRadius.map((station) => {
          const status = getAvailabilityStatus(station, timeSlot);
          const available = getAvailable(station, timeSlot);

          return (
            <Marker
              key={`${station.vehicle}-${station.id || station.name}`}
              position={station.coords}
              icon={createStationIcon(status, station.vehicle)}
              eventHandlers={{
                click: () => {
                  if(onStationClick) {
                    onStationClick(station);
                  }
                },
              }}
            >
              <Popup>
                {getTrafficEmoji(status)} <strong>{station.name}</strong>
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