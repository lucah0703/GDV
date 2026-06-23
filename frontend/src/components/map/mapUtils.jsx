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

export function createStationIcon(status, vehicle) {
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