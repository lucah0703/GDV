import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function RecenterMap({ center }) {
    const map = useMap();

    useEffect(() => {
        if (!center) return;

        map.setView(center, 14);

        setTimeout(() => map.invalidateSize(true), 100);
        setTimeout(() => map.invalidateSize(true), 500);
    }, [center, map]);

    return null;
}