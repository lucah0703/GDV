import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function RecenterMap({ center }) {
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