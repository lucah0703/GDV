const API_BASE = "http://localhost:8000";

export async function getStations(city) {
    const res = await fetch(`${API_BASE}/station/${city}`);
    return res.json();
}

export async function getCurrentAvailability(city, uni) {
    const res = await fetch(
        `${API_BASE}/availability/current/${city}/${uni}`
    );
    return res.json();
}

export async function getHistorySegments(city) {
    const res = await fetch(
        `${API_BASE}/availability/history/segments/${city}`
    );
    return res.json();
}

export async function getHistory(city) {
    const res = await fetch(
        `${API_BASE}/availability/history/${city}`
    );
    return res.json();
}