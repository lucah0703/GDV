export function getTrafficColor(ratio) {
    if (ratio >= 0.5) return "green";
    if (ratio >= 0.2) return "yellow";
    return "red";
}

export function getEmoji(color) {
    if (color === "green") return "🟢";
    if (color === "yellow") return "🟡";
    return "🔴";
}