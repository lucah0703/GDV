import { useMapEvents } from "react-leaflet";


export function getTrafficEmoji(status) {
    if (status === "green") return "🟢";
    if (status === "yellow") return "🟡";
    return "🔴";
}

export function getAvailable(station, timeSlot) {
    return timeSlot === "current"
        ? station.availability?.current ?? 0
        : station.segments?.[timeSlot] ?? 0;
}

// function getAvailable(station, timeSlot) {
//   return (
//     station.availability?.[timeSlot] ??
//     station.availability?.current ??
//     station.availability?.morning ??
//     0
//   );
// }


export function getAvailabilityStatus(station, timeSlot) {
    const available = getAvailable(station, timeSlot);
    const capacity = Math.max(station.capacity || 1, 1);
    const ratio = available / capacity;

    if (ratio >= 0.5) return "green";
    if (ratio >= 0.2) return "yellow";
    return "red";
}

// export function createStationIcon(status, vehicle, isSelected = false) {
//   const symbol = vehicle === "bike" ? "🚲" : "🛴";

//   return L.divIcon({
//     className: "station-map-marker",
//     html: `<div class="station-map-marker-inner">${getTrafficEmoji(
//       status
//     )}${symbol}</div>`,
//     iconSize: [44, 34],
//     iconAnchor: [22, 17],
//     popupAnchor: [0, -16],
//   });
// }
export function createStationIcon(status, vehicle, isSelected = false) {
  const symbol = vehicle === "bike" ? "🚲" : "🛴";

  const baseColor =
    vehicle === "scooter"
      ? "#3b82f6" // 🔵 always blue
      : status === "red"
      ? "#ef4444"
      : status === "yellow"
      ? "#f59e0b"
      : "#22c55e";

  const color = baseColor;
  const stroke = isSelected ? "#3b82f6" : "#ffffff";

  const size = isSelected ? 48 : 40;

  const glow = isSelected
    ? `filter="drop-shadow(0px 0px 10px #3b82f6)"`
    : "";

  return L.divIcon({
    className: "",
    html: `
      <div style="
  width: ${size}px;
  height: ${size}px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
">

        <svg width="${size}" height="${size}" viewBox="0 0 24 24" ${glow} >
          
          <!-- PIN SHAPE -->
          <path
            d="M12 2C7.5 2 4 5.5 4 10c0 6 8 12 8 12s8-6 8-12c0-4.5-3.5-8-8-8z"
            fill="${color}"
            stroke="${stroke}"
            stroke-width="1.5"
          />

          <!-- TOP HALF OVERLAY (leicht heller für “fill effect”) -->
          <path
            d="M12 2C7.5 2 4 5.5 4 10c0 6 8 12 8 12V2z"
            fill="rgba(255,255,255,0.12)"
          />

          <!-- ICON BADGE -->
          <circle
            cx="12"
            cy="11"
            r="5.5"
            fill="white"
            opacity="0.95"
          />

          <!-- ICON -->
          <text
            x="12"
            y="11"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="9"
            fill="#111827"
            style="font-weight: 600;"
          >
            ${symbol}
          </text>

        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}


export function createStartpointIcon() {
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


export function getIsochroneStyle(vehicleType, reachabilityType = "real") {
  const isBike = vehicleType === "bike";
  const isReal = reachabilityType === "real";

  const color = isBike ? "#047857" : "#7c3aed";

  return {
    color,
    fillColor: color,
    fillOpacity: isReal ? 0.16 : 0.06,
    weight: isReal ? 3 : 2,
    dashArray: isReal ? undefined : "8 8",
  };
}


export function getPoiColor(type) {
  if (type === "Bahnhof") return "#2563eb";
  if (type === "Wohnheim") return "#22c55e";
  if (type === "Sportanlage") return "#f59e0b";
  return "#6b7280";
}

export function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click() {
      onMapClick?.();
    },
  });

  return null;
}