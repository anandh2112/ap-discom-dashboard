import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"

export default function OverviewVar() {
  const varianceOptions = {
    chart: { type: "column", height: 250 },
    title: { text: "Consumers - Variance", style: { fontSize: "16px" } },
    xAxis: { categories: ["High", "Average", "Low"] },
    yAxis: { title: { text: "Metric" } },
    series: [
      {
        name: "Variance",
        data: [120, 80, 45],
        colorByPoint: true,
        colors: ["#FF6B6B", "#FFD93D", "#6BCB77"],
      },
    ],
    legend: { enabled: false },
    credits: { enabled: false },
  }

  return (
    <div className="bg-white shadow-md rounded-2xl p-3">
      <HighchartsReact highcharts={Highcharts} options={varianceOptions} />
    </div>
  )
}