import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

export default function ScooterHeatmap({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const heatLayer = L.heatLayer(
      points.map((p) => [
        p[0],
        p[1],
        1,
      ]),
      {
        radius: 30,
        blur: 20,
        maxZoom: 18,

        gradient: {
          0.2: "#60a5fa",
          0.4: "#22c55e",
          0.6: "#eab308",
          0.8: "#f97316",
          1.0: "#dc2626",
        },
      }
    );

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}