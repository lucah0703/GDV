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

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!center || !map) return;

    const t1 = setTimeout(() => {
      if (!map._mapPane) return;

      map.invalidateSize({
        animate: false,
        pan: false,
      });

      map.setView(center, 14, {
        animate: false,
      });
    }, 100);

    const t2 = setTimeout(() => {
      if (!map._mapPane) return;

      map.invalidateSize({
        animate: false,
        pan: false,
      });
    }, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [center, map]);

  return null;
}

function getTrafficEmoji(status) {
  if (status === "green") return "🟢";
  if (status === "yellow") return "🟡";
  return "🔴";
}

function getAvailable(station, timeSlot) {
  return (
    station.availability?.[timeSlot] ??
    station.availability?.current ??
    station.availability?.morning ??
    0
  );
}

function getAvailabilityStatus(station, timeSlot) {
  const available = getAvailable(station, timeSlot);
  const capacity = Math.max(station.capacity || 1, 1);
  const ratio = available / capacity;

  if (ratio >= 0.5) return "green";
  if (ratio >= 0.2) return "yellow";
  return "red";
}

const PROVIDER_COLORS = {
  lime: "#1b004b",
  bolt: "#4c007d",
  voi: "#7f00b2",
  dott: "#bc4ed8",

  regioRadStuttgart: "#005227",
  dbCallABike: "#038554",
  "kvv.nextbike": "#03bb85",
  vrnnextbike: "#68ddbd",
};

function getIsochroneStyle(vehicleType, reachabilityType = "real", provider) {
  const isReal = reachabilityType === "real";

  const fallbackColor =
    vehicleType === "bike" ? "#038554" : "#7f00b2";

  const color = PROVIDER_COLORS[provider] || fallbackColor;

  return {
    color,
    fillColor: color,
    fillOpacity: isReal ? 0.18 : 0.08,
    weight: isReal ? 3 : 2,
    dashArray: isReal ? undefined : "8 8",
  };
}

function getPoiColor(type) {
  if (type === "Bahnhof") return "#2563eb";
  if (type === "Wohnheim") return "#22c55e";
  if (type === "Sportanlage") return "#f59e0b";
  return "#6b7280";
}

function createStationIcon(status, vehicle) {
  const symbol = vehicle === "bike" ? "🚲" : "🛴";

  return L.divIcon({
    className: "station-map-marker",
    html: `<div class="station-map-marker-inner">${getTrafficEmoji(
      status
    )}${symbol}</div>`,
    iconSize: [44, 34],
    iconAnchor: [22, 17],
    popupAnchor: [0, -16],
  });
}

function createStartpointIcon() {
  return L.divIcon({
    className: "startpoint-pulse-icon",
    html: `
      <div class="startpoint-pulse">
        <div class="startpoint-dot">\u{1F393}</div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -18],
  });
}

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
}) {
  const startpointIcon = createStartpointIcon();
  const isochroneLegendItems = isochroneData?.results
    ? Object.entries(isochroneData.results)
      .flatMap(([vehicleType, offers]) =>
        offers
          .filter((offer) => offer.provider)
          .map((offer) => ({
            provider: offer.provider,
            vehicleType,
            color:
              PROVIDER_COLORS[offer.provider] ||
              (vehicleType === "bike" ? "#038554" : "#7f00b2"),
          }))
      )
      .filter(
        (item, index, array) =>
          array.findIndex((x) => x.provider === item.provider) === index
      )
    : [];
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
                  offer.reachabilityType || offer.type || "real",
                  offer.provider
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

          {isochroneLegendItems.length > 0 && (
            <>
              <div className="legend-divider"></div>

              <h4>Erreichbarkeit</h4>

              {isochroneLegendItems.map((item) => (
                <div className="legend-item" key={item.provider}>
                  <span
                    className="legend-line"
                    style={{ backgroundColor: item.color }}
                  ></span>

                  <span>
                    {item.provider}
                    <small>
                      {item.vehicleType === "bike" ? " Bike" : " E-Scooter"}
                    </small>
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </MapContainer>
  );
}