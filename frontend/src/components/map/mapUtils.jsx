export function getTrafficEmoji(status) {
    if (status === "green") return "🟢";
    if (status === "yellow") return "🟡";
    return "🔴";
}

export function getAvailable(station, timeSlot) {
    return (
        station.availability?.[timeSlot] ??
        station.availability?.current ??
        station.availability?.morning ??
        0
    );
}

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
        html: `<div class="station-map-marker-inner">${getTrafficEmoji(status)}${symbol}</div>`,
        iconSize: [44, 34],
        iconAnchor: [22, 17],
        popupAnchor: [0, -16],
    });
}

export function createStartpointIcon() {
    return L.divIcon({
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
        className: "custom-pin-icon",
    });
}