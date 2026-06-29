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

      {selectedPoi.adress && (
        <>
          <br />
          <small>📍 {selectedPoi.adress}</small>
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

function providerHasOnlyTheoreticalPois(provider, pois) {
  return pois.some((poi) => {
    const theoreticalProvider =
      poi.theoreticalRoute?.offer?.provider ||
      poi.theoreticalRoute?.station?.provider;

    const realProvider =
      poi.realRoute?.offer?.provider ||
      poi.realRoute?.station?.provider;

    return (
      poi.theoreticalReachable &&
      !poi.realReachable &&
      theoreticalProvider === provider &&
      realProvider !== provider
    );
  });
}

function createStartpointIcon() {
  return L.divIcon({
    className: "startpoint-pulse-icon",
    html: `
      <div class="startpoint-pulse">
        <div class="startpoint-dot">🎓</div>
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
  isochronePois = pois,
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

  const isochroneLegendItems = isochroneData?.results
    ? Object.entries(isochroneData.results)
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
        Object.entries(isochroneData.results).map(([vehicleType, offers]) =>
          offers.map((offer, index) => {
            const isOnlyTheoretical = providerHasOnlyTheoreticalPois(
              offer.provider,
              isochronePois
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
                style={getIsochroneStyle(
                  vehicleType,
                  isOnlyTheoretical ? "theoretical" : "real",
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
        pois.map((poi) => {
          const isSelected = selectedPoi?.id === poi.id;

          return (
            <CircleMarker
              key={poi.id}
              center={poi.coords}
              radius={isSelected ? 11 : 6}
              pathOptions={{
                color: isSelected ? "#111827" : "#ffffff",
                weight: isSelected ? 3 : 1,
                fillColor: getPoiColor(poi.type),
                fillOpacity: isSelected ? 1 : 0.85,
              }}
              eventHandlers={{
                click: () => setSelectedPoi(poi),
              }}
            />
          );
        })}

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
                  Real erreichbar
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

                    <span
                      className="legend-isochrone-shape dashed"
                      style={{
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

              <p className="legend-hint">
                Gefüllt = real erreichbar · gestrichelt = aktuell nicht
                verfügbar
              </p>
            </>
          )}
        </div>
      )}
    </MapContainer>
  );
}