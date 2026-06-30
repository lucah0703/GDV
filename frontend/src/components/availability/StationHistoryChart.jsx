import React from "react";
import ReactECharts from "echarts-for-react";

export default function StationHistoryChart({ station }) {
  if (!station) {
    return (
      <div className="station-history">
        <h4>Stundenverlauf</h4>
        <p>Bitte eine Station auswählen.</p>
      </div>
    );
  }
  if (station.vehicle === "scooter"){
    return(
      <div className="station-history">
        <h4>{station.name}</h4>
      </div>
    )
  }
  const hours = station.history?.x_data ?? [];
  const values = station.history?.y_data ?? [];

  console.log(hours);
  console.log(values);

  const option = {
    tooltip: { trigger: "axis" },

    xAxis: {
      type: "category",
      name: "h",
      data: hours.map((h) => `${h}:00`),
      boundaryGap: false,
    },

    yAxis: {
      type: "value",
      name: "Bikes",
    },

    series: [
      {
        type: "line",
        smooth: true,
        data: values,
        areaStyle: { color: "rgba(59,130,246,0.15)" },
        lineStyle: { width: 3, color: "#3b82f6" },
      },
    ],
  };

  return (
    <div className="station-history">
      <h4>{station.name}</h4>
      <ReactECharts option={option} style={{ height: 280 }} />
      <h6>Historische Bike-Verteilung (Mo-Fr)</h6>
    </div>
  );
}