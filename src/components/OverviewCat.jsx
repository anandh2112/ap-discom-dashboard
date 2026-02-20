import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"

export default function OverviewCat() {
  const tableData = [
    { category: "AQUA CULTURE & ANIMAL HUSBANDRY-HT", count: 29 },
    { category: "COMMERCIAL-HT", count: 1503 },
    { category: "ELECTRIC VEHICLES/CHARGING STATIONS - HT", count: 12 },
    { category: "FUNCTION HALLS/ AUDITORIA-HT", count: 231 },
    { category: "GENERAL PURPOSE-HT", count: 82 },
    { category: "GOVERNMENT/PRIVATE LIFT IRRIGATION SCHEMES-HT", count: 53 },
    { category: "INDUSTRY (GENERAL)-HT", count: 1296 },
    { category: "RELIGIOUS PLACES-HT", count: 12 },
    { category: "SEASONAL INDUSTRIES (OFF-SEASON)-HT", count: 93 },
    { category: "TOWNSHIPS, COLONIES, GATED COMMUNITIES & VILLAS-HT", count: 42 },
    { category: "Utilities-HT", count: 111 },
  ]

  const grandTotal = tableData.reduce((sum, row) => sum + row.count, 0)

  const colors = [
    "#4D96FF",
    "#FF6B6B",
    "#6BCB77",
    "#FFD93D",
    "#9D4EDD",
    "#00C2A8",
    "#FF924C",
    "#3A86FF",
    "#F72585",
    "#43AA8B",
    "#577590",
  ]

  const categoryOptions = {
    chart: { type: "bar", height: 450 },
    title: {
      text: "HT Consumer Category Breakdown",
      style: { fontSize: "16px", fontWeight: "500" },
    },
    xAxis: {
      categories: tableData.map((row) => row.category),
    },
    yAxis: {
      min: 0,
      title: { text: "Number of Consumers" },
      labels: {
        formatter: function () {
          return this.value.toLocaleString()
        },
      },
    },
    plotOptions: {
      series: {
        colorByPoint: true,
        dataLabels: {
          enabled: true,
          formatter: function () {
            return this.y.toLocaleString()
          },
        },
      },
    },
    series: [
      {
        name: "Consumers",
        data: tableData.map((row, index) => ({
          y: row.count,
          color: colors[index % colors.length],
        })),
      },
    ],
    credits: { enabled: false },
  }

  return (
    <div className="bg-white shadow-md rounded-2xl p-2 pt-3 flex justify-between w-full">
      <div className="w-[45%]">
        <HighchartsReact highcharts={Highcharts} options={categoryOptions} />
      </div>

      <div className="overflow-x-auto w-[53%]">
        <table className="min-w-full border border-gray-300 text-sm text-center">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-100">Category Description</th>
              <th className="border p-2 bg-gray-100">No. of Consumers</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border p-2 text-left">{row.category}</td>
                <td className="border p-2">
                  {row.count.toLocaleString()}
                </td>
              </tr>
            ))}
            <tr className="bg-blue-50 font-semibold">
              <td className="border p-2 text-left">Grand Total</td>
              <td className="border p-2">
                {grandTotal.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
