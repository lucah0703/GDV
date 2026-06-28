import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  CircleMarker,
  GeoJSON,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import RecenterMap from "./map/RecenterMap";
import {
  createStartpointIcon,
  getIsochroneStyle,
  getPoiColor,
} from "./map/mapUtils";

export default function Map({
  center,
  label,
  markerCoords,
  pois = [],
  setSelectedPoi = () => {},
  realRadius = 0,
  theoreticalRadius = 0,
  isochroneData = null,
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

      {isochroneData?.results &&
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

      {!isochroneData && theoreticalRadius > 0 && (
        <Circle
          center={center}
          radius={theoreticalRadius}
          pathOptions={getIsochroneStyle("scooter", "theoretical")}
        />
      )}

      {!isochroneData && realRadius > 0 && (
        <Circle
          center={center}
          radius={realRadius}
          pathOptions={getIsochroneStyle("bike", "real")}
        />
      )}

      {markerCoords && (
        <Marker position={markerCoords} icon={startpointIcon}>
          <Popup>{label}</Popup>
        </Marker>
      )}

      {pois.map((poi) => (
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
    </MapContainer>
  );
}