import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"

export default function TODPie() {
  const data = [
    { name: "Peak 1", y: 20, count: 200 },
    { name: "Peak 2", y: 25, count: 250 },
    { name: "Normal", y: 30, count: 300 },
    { name: "Off-peak", y: 25, count: 250 },
  ]

  const options = {
    chart: { type: "pie", height: 300, backgroundColor: "transparent" },
    title: { text: "" },
    tooltip: {
      pointFormat: "<b>{point.percentage:.1f}%</b> ({point.count})",
    },
    accessibility: { point: { valueSuffix: "%" } },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: { enabled: false },
        showInLegend: true,
        center: ["50%", "45%"],
      },
    },
    legend: {
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
      itemMarginTop: 0,
      itemMarginBottom: 0,
      itemStyle: { fontSize: "12px", fontWeight: "400" },
    },
    series: [
      {
        name: "TOD Split",
        colorByPoint: true,
        data: data,
        colors: ["#FF8042", "#FF0000", "#00C49F", "#0088FE"],
      },
    ],
    credits: { enabled: false },
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-full flex flex-col md:flex-row gap-4">
      {/* Chart */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-4 text-center">TOD Consumption</h3>
        <HighchartsReact highcharts={Highcharts} options={options} />
      </div>

      {/* Table */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-4 text-center">Details</h3>
        <table className="w-full text-left border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2">TOD</th>
              <th className="border px-3 py-2">Percentage</th>
              <th className="border px-3 py-2">Count</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border px-3 py-2">{item.name}</td>
                <td className="border px-3 py-2">{item.y}%</td>
                <td className="border px-3 py-2">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
