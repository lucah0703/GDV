import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Popup,
  Circle,
  CircleMarker,
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
  getIsochroneStyle,
  getPoiColor
} from "./map/mapUtils";

import ScooterHeatmap from "./map/ScooterHeatmap";


export default function Map({
  center,
  label,
  markerCoords,
  pois = [],
  setSelectedPoi = () => { },
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
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
        subdomains="abcd"
      />

      <RecenterMap center={center} />

      {showScooterHeatmap && scooterCoords.length > 0 && (
        <ScooterHeatmap points={scooterCoords} />
      )}

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
                style={getIsochroneStyle(
                  vehicleType,
                  offer.reachabilityType || offer.type || "real"
                )}
              />
            ) : null
          )
        )}

      {!availability && !isochroneData && theoreticalRadius > 0 && (
        <Circle
          center={center}
          radius={theoreticalRadius}
          pathOptions={getIsochroneStyle("scooter", "theoretical")}
        />
      )}

      {!availability && !isochroneData && realRadius > 0 && (
        <Circle
          center={center}
          radius={realRadius}
          pathOptions={getIsochroneStyle("bike", "real")}
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
          <CircleMarker
            key={poi.id}
            center={poi.coords}
            radius={6}
            pathOptions={{
              color: "#ffffff",
              weight: 1,
              fillColor: getPoiColor(poi.type),
              fillOpacity: 0.85,
            }}
            eventHandlers={{
              click: () => setSelectedPoi(poi),
            }}
          >
            <Popup>
              <strong>{poi.name}</strong>
              <br />
              {poi.type}
            </Popup>
          </CircleMarker>
        ))}
      {!availability && (
        <div className="map-legend">
          <h4>POIs</h4>

          <div className="legend-item">
            <span className="legend-dot blue"></span>
            Bahnhof
          </div>

          <div className="legend-item">
            <span className="legend-dot green"></span>
            Wohnheim
          </div>

          <div className="legend-item">
            <span className="legend-dot orange"></span>
            Sportanlage
          </div>

        </div>
      )}
      

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