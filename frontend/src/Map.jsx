import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    map.setView(center, 13);
  }, [center, map]);

  return null;
}

function Map({ center, label, markerCoords }) {
  const startpointIcon = L.divIcon({
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
    className: "custom-pin-icon"
  });

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <RecenterMap center={center} />
      {markerCoords && (
        <Marker
          position={markerCoords}
          icon={startpointIcon}
        >
          <Popup>{label}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

export default Map;