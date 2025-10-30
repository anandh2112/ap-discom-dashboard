import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"

export default function OverviewTar() {
  const tariffOptions = {
    chart: { type: "bar", height: 250 },
    title: { text: "Consumers - Tariff", style: { fontSize: "16px" } },
    xAxis: { categories: ["Tariff Category"] },
    yAxis: {
      min: 0,
      title: { text: "Total (%)" },
      labels: { format: "{value}%" },
    },
    legend: { reversed: true },
    plotOptions: { series: { stacking: "percent" } },
    series: [
      { name: "High", data: [45], color: "#FF6B6B" },
      { name: "Regular", data: [35], color: "#FFD93D" },
      { name: "Low", data: [20], color: "#6BCB77" },
    ],
    credits: { enabled: false },
  }

  return (
    <div className="bg-white shadow-md rounded-2xl p-3">
      <HighchartsReact highcharts={Highcharts} options={tariffOptions} />
    </div>
  )
}