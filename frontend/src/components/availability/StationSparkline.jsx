import ReactECharts from "echarts-for-react";

export default function StationSparkline({ station }) {
  const values = station.history?.y_data ?? [];

  const option = {
    animation: false,
    grid: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    xAxis: {
      type: "category",
      show: false,
      data: values.map((_, i) => i),
    },
    yAxis: {
      type: "value",
      show: false,
    },
    series: [
      {
        type: "line",
        data: values,
        smooth: true,
        symbol: "none",
        lineStyle: {
          width: 2,
          color: "#3b82f6",
        },
        areaStyle: {
          color: "rgba(59,130,246,0.12)",
        },
      },
    ],
  };

  return (
    <div style={{ width: 80, height: 30 }}>
      <ReactECharts option={option} style={{ height: 30 }} />
    </div>
  );
}