import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"

export default function OverviewTOD() {
  const todOptions = {
    chart: { type: "pie", height: 250 },
    title: { text: "Consumption - TOD", style: { fontSize: "16px" } },
    tooltip: { pointFormat: "<b>{point.percentage:.1f}%</b> ({point.y})" },
    accessibility: { point: { valueSuffix: "%" } },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: { enabled: false },
        showInLegend: true,
      },
    },
    legend: {
      align: "right",
      verticalAlign: "middle",
      layout: "vertical",
      itemMarginTop: 10,
      itemMarginBottom: 5,
      y: 15,
      x: -10,
    },
    series: [
      {
        name: "TOD Split",
        colorByPoint: true,
        data: [
          { name: "Peak Slot 1", y: 35 },
          { name: "Peak Slot 2", y: 25 },
          { name: "Regular", y: 30 },
          { name: "Normal", y: 10 },
        ],
      },
    ],
    credits: { enabled: false },
  }

  return (
    <div className="bg-white shadow-md rounded-2xl p-3 flex justify-center items-center">
      <HighchartsReact highcharts={Highcharts} options={todOptions} />
    </div>
  )
}