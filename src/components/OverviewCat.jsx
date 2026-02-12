import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"

export default function OverviewCat() {
  // Actual data from the image
  const tableData = [
    { category: "Agri", ph1: 390, ph3wc: 865, ph34ct: 1707, ht: 210, total: 3172 },
    { category: "Commercial", ph1: 290832, ph3wc: 25939, ph34ct: 2966, ht: 1541, total: 321278 },
    { category: "Domestic", ph1: 33565, ph3wc: 10203, ph34ct: 133, ht: 39, total: 43940 },
    { category: "Industry", ph1: 1087, ph3wc: 2775, ph34ct: 1097, ht: 1554, total: 6513 },
    { category: "Institute", ph1: 94677, ph3wc: 11627, ph34ct: 809, ht: 209, total: 107322 },
  ]

  // Chart setup based on actual totals
  const categoryOptions = {
    chart: { type: "bar", height: 300 },
    title: {
      text: "Consumer Category Breakdown",
      style: { fontSize: "16px", fontWeight: "500" },
    },
    xAxis: {
      categories: tableData.map((row) => row.category),
      title: { text: null },
    },
    yAxis: {
      min: 0,
      title: { text: "Number of Consumers" },
      labels: { formatter: function () { return this.value.toLocaleString() } },
    },
    legend: { reversed: false },
    plotOptions: {
      series: {
        stacking: "normal",
        dataLabels: {
          enabled: true,
          formatter: function () {
            return this.y.toLocaleString()
          },
        },
      },
    },
    series: [
      { name: "1 PH", data: tableData.map((r) => r.ph1), color: "#6BCB77" },
      { name: "3 PH WC", data: tableData.map((r) => r.ph3wc), color: "#FFD93D" },
      { name: "3 PH 4CT", data: tableData.map((r) => r.ph34ct), color: "#4D96FF" },
      { name: "HT", data: tableData.map((r) => r.ht), color: "#FF6B6B" },
    ],
    credits: { enabled: false },
  }

  // Add grand total row
  const grandTotal = {
    category: "Grand Total",
    ph1: 420551,
    ph3wc: 51409,
    ph34ct: 6712,
    ht: 3553,
    total: 482225,
  }

  return (
    <div className="bg-white shadow-md rounded-2xl p-2 pt-3 flex justify-between w-full">
      {/* Chart Section */}
      <div className="w-[35%]">
        <HighchartsReact highcharts={Highcharts} options={categoryOptions} />
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto w-[63%]">
        <table className="min-w-full border border-gray-300 text-sm text-center">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-100">Category</th>
              <th className="border p-2 bg-gray-100">1 PH</th>
              <th className="border p-2 bg-gray-100">3 PH WC</th>
              <th className="border p-2 bg-gray-100">3 PH 4CT</th>
              <th className="border p-2 bg-gray-100">HT</th>
              <th className="border p-2 bg-gray-100">Total</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border p-2">{row.category}</td>
                <td className="border p-2">{row.ph1.toLocaleString()}</td>
                <td className="border p-2">{row.ph3wc.toLocaleString()}</td>
                <td className="border p-2">{row.ph34ct.toLocaleString()}</td>
                <td className="border p-2">{row.ht.toLocaleString()}</td>
                <td className="border p-2 font-medium">{row.total.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-blue-50 font-semibold">
              <td className="border p-2">{grandTotal.category}</td>
              <td className="border p-2">{grandTotal.ph1.toLocaleString()}</td>
              <td className="border p-2">{grandTotal.ph3wc.toLocaleString()}</td>
              <td className="border p-2">{grandTotal.ph34ct.toLocaleString()}</td>
              <td className="border p-2">{grandTotal.ht.toLocaleString()}</td>
              <td className="border p-2">{grandTotal.total.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
