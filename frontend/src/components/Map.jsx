import { useEffect, useState } from "react";
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

      map.invalidateSize({ animate: false, pan: false });
      map.setView(center, 14, { animate: false });
    }, 100);

    const t2 = setTimeout(() => {
      if (!map._mapPane) return;
      map.invalidateSize({ animate: false, pan: false });
    }, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [center, map]);

  return null;
}

function SelectedPoiPopup({ selectedPoi }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedPoi || !selectedPoi.coords) return;

    map.flyTo(selectedPoi.coords, Math.max(map.getZoom(), 15), {
      animate: true,
      duration: 0.6,
    });
  }, [selectedPoi, map]);

  if (!selectedPoi) return null;

  return (
    <Popup position={selectedPoi.coords}>
      <strong>
        {selectedPoi.icon} {selectedPoi.name}
      </strong>

      <br />
      <small>{selectedPoi.type}</small>

      {selectedPoi.sportart && (
        <>
          <br />
          <small><strong>Sportart:</strong> {selectedPoi.sportart}</small>
        </>
      )}

      {selectedPoi.address && (
        <>
          <br />
          <small>📍 {selectedPoi.address}</small>
        </>
      )}
    </Popup>
  );
}

function getPoiColor(type) {
  if (type === "Bahnhof") return "#2463eb";
  if (type === "Wohnheim") return "#289951";
  if (type === "Sportanlage") return "#ff5858";
  return "#6b7280";
}

const PROVIDER_COLORS = {
  regioRadStuttgart: "#230a51",
  "kvv.nextbike": "#A855F7",
  vrnnextbike: "#D8B4FE",
  lime: "#8C2D04",
  bolt: "#D94801",
  voi: "#F97316",
  dott: "#FBBF24",
};

function getIsochroneStyle(vehicleType, reachabilityType = "real", provider) {
  const isReal = reachabilityType === "real";
  const fallbackColor = vehicleType === "bike" ? "#038554" : "#7f00b2";
  const color = PROVIDER_COLORS[provider] || fallbackColor;

  return {
    color,
    fillColor: color,
    fillOpacity: isReal ? 0.18 : 0.08,
    weight: isReal ? 3 : 2,
    dashArray: isReal ? undefined : "8 8",
  };
}

function normalizeVehicleType(vehicleType) {
  if (vehicleType === "e-scooter") return "scooter";
  return vehicleType;
}

function normalizeProviderName(provider) {
  return String(provider || "").trim().toLowerCase();
}

function providerHasAvailableVehicle(provider, vehicleType, stationsInRadius) {
  const normalizedProvider = normalizeProviderName(provider);
  const normalizedVehicle = normalizeVehicleType(vehicleType);

  return stationsInRadius.some((station) => {
    return (
      normalizeProviderName(station.provider) === normalizedProvider &&
      normalizeVehicleType(station.vehicle) === normalizedVehicle &&
      (station.availability?.current ?? 0) > 0
    );
  });
}

function createStartpointIcon() {
  return L.divIcon({
    className: "startpoint-pulse-icon",
    html: `
      <div class="startpoint-pulse">
        <div class="startpoint-dot">🎓</div>
      </div
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -18],
  });
}

function ScalablePoiMarker({ poi, isSelected, setSelectedPoi, isochroneData }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const updateZoom = () => {
      setZoom(map.getZoom());
    };

    map.on("zoomend", updateZoom);
    map.on("zoom", updateZoom);

    return () => {
      map.off("zoomend", updateZoom);
      map.off("zoom", updateZoom);
    };
  }, [map]);

  const baseRadius = Math.max(2.5, Math.min(8, 3 + (zoom - 11) * 0.7));

  // Nicht erreichbare POIs etwas kleiner darstellen
  const scaledRadius = poi.theoreticalReachable
    ? baseRadius
    : Math.max(2, baseRadius - 1.5);

  const radius = isSelected ? scaledRadius + 4 : scaledRadius;

  const dimPoi = isochroneData && !poi.theoreticalReachable;
  return (
    <CircleMarker
      center={poi.coords}
      radius={radius}
      pathOptions={{
        color: isSelected
          ? "#111827"
          : dimPoi
            ? "#4b5563"
            : "#ffffff",

        weight: isSelected ? 3 : 1,

        fillColor: dimPoi
          ? "#6b7280"
          : getPoiColor(poi.type),

        fillOpacity: dimPoi
          ? 0.45
          : (isSelected ? 1 : 0.85),
      }}
      eventHandlers={{
        click: () => setSelectedPoi(poi),
      }}
    />
  );
}

export default function Map({
  center,
  label,
  markerCoords,
  pois = [],
  isochronePois = pois,
  activeVehicles = ["bike", "scooter"],
  stationsInRadius = [],
  selectedPoi = null,
  setSelectedPoi = () => { },
  availability = false,
  realRadius = 0,
  theoreticalRadius = 0,
  isochroneData = null,
  geofencingZones = [],
  showGeofencingZones = false,
}) {
  const startpointIcon = createStartpointIcon();

  function isVehicleTypeActive(vehicleType) {
    if (vehicleType === "bike") return activeVehicles.includes("bike");
    if (vehicleType === "e-scooter") return activeVehicles.includes("scooter");
    return false;
  }

  const isochroneLegendItems = isochroneData?.results
    ? Object.entries(isochroneData.results)
      .filter(([vehicleType]) => isVehicleTypeActive(vehicleType))
      .flatMap(([vehicleType, offers]) =>
        offers.map((offer) => ({
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
        attribution="&copy; OpenStreetMap &copy; CARTO"
        subdomains="abcd"
      />

      <RecenterMap center={center} />
      <SelectedPoiPopup selectedPoi={selectedPoi} />

      {showGeofencingZones &&
        geofencingZones.flatMap((provider) =>
          provider.geofencing_zones.map((zone, index) => (
            <GeoJSON
              key={`geofence-${provider.provider}-${index}`}
              data={{
                type: "Feature",
                geometry: zone.geometry,
                properties: {},
              }}
              interactive={false}
              style={{
                color: "#7a7a7a",
                fillColor: "#7a7a7a",
                fillOpacity: 0.15,
                weight: 2,
                dashArray: "6 6",
              }}
            />
          ))
        )}

      {!availability &&
        isochroneData?.results &&
        Object.entries(isochroneData.results)
          .filter(([vehicleType]) => isVehicleTypeActive(vehicleType))
          .map(([vehicleType, offers]) =>
            offers.map((offer, index) => {
              const isRealIsochrone = providerHasAvailableVehicle(
                offer.provider,
                vehicleType,
                stationsInRadius
              );

              return offer.geometry ? (
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
                  interactive={false}
                  style={getIsochroneStyle(
                    vehicleType,
                    isRealIsochrone ? "real" : "theoretical",
                    offer.provider
                  )}
                />
              ) : null;
            })
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

      {markerCoords && (
        <Marker position={markerCoords} icon={startpointIcon}>
          <Popup>{label}</Popup>
        </Marker>
      )}

      {!availability &&
        pois.map((poi) => (
          <ScalablePoiMarker
            key={poi.id}
            poi={poi}
            isSelected={selectedPoi?.id === poi.id}
            setSelectedPoi={setSelectedPoi}
            isochroneData={isochroneData}
          />
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

              <h4>Erreichbarkeit / Isochronen</h4>

              <div className="legend-status-row">
                <div className="legend-item">
                  <span className="legend-status-line solid"></span>
                  Erreichbar
                </div>

                <div className="legend-item">
                  <span className="legend-status-line dashed"></span>
                  Aktuell nicht erreichbar
                </div>
              </div>

              <div className="legend-divider small"></div>

              <div className="legend-provider-grid">
                {isochroneLegendItems.map((item) => (
                  <div className="legend-provider-item" key={item.provider}>
                    <span
                      className="legend-isochrone-shape"
                      style={{
                        backgroundColor: item.color,
                        borderColor: item.color,
                      }}
                    ></span>

                    <span className="legend-provider-name">
                      {item.provider}
                      <small>
                        {item.vehicleType === "bike" ? " Bike" : " E-Scooter"}
                      </small>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </MapContainer>
  );
}