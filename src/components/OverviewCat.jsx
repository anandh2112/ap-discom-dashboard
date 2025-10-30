import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"

export default function OverviewCat() {
  const categoryOptions = {
    chart: { type: "bar", height: 300 },
    title: { text: "Consumer Category Breakdown", style: { fontSize: "16px" } },
    xAxis: {
      categories: ["Agricultural", "Commercial", "Domestic", "Industry", "Institute"],
      title: { text: null },
    },
    yAxis: {
      min: 0,
      max: 100,
      tickInterval: 25,
      title: { text: "Percentage (%)" },
    },
    legend: { reversed: true },
    plotOptions: {
      series: {
        stacking: "percent",
        dataLabels: { enabled: true, format: "{point.y}%" },
      },
    },
    series: [
      { name: "1 PH", data: [20, 25, 15, 10, 30], color: "#6BCB77" },
      { name: "3 PH WC", data: [30, 20, 25, 20, 25], color: "#FFD93D" },
      { name: "3 PH 4CT", data: [25, 30, 35, 40, 25], color: "#4D96FF" },
      { name: "HT", data: [25, 25, 25, 30, 20], color: "#FF6B6B" },
    ],
    credits: { enabled: false },
  }

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 flex justify-between w-full">
      {/* Chart Section */}
      <div className="w-[35%]">
        <HighchartsReact highcharts={Highcharts} options={categoryOptions} />
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto w-[63%]">
        <table className="min-w-full border border-gray-300 text-sm text-left">
          <thead>
            <tr>
              <th rowSpan="2" className="border p-2 bg-gray-100 text-center">
                Category
              </th>
              <th colSpan="2" className="border p-2 bg-gray-100 text-center">
                1 PH
              </th>
              <th colSpan="2" className="border p-2 bg-gray-100 text-center">
                3 PH WC
              </th>
              <th colSpan="2" className="border p-2 bg-gray-100 text-center">
                3 PH 4CT
              </th>
              <th colSpan="2" className="border p-2 bg-gray-100 text-center">
                HT
              </th>
              <th rowSpan="2" className="border p-2 bg-gray-100 text-center">
                Total
              </th>
            </tr>
            <tr>
              {Array(4)
                .fill(["Total", "Covered"])
                .flat()
                .map((label, i) => (
                  <th key={i} className="border p-2 bg-gray-50 text-center">
                    {label}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {["Agri", "Commercial", "Domestic", "Industry", "Institute", "Total"].map(
              (cat, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border p-2">{cat}</td>
                  {Array(9)
                    .fill(0)
                    .map((_, j) => (
                      <td key={j} className="border p-2 text-center">
                        {Math.floor(Math.random() * 100)}
                      </td>
                    ))}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}