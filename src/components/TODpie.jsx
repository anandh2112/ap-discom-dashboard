import { useEffect, useState } from "react"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"

const CACHE_KEY = "todPieCache"
const CACHE_EXPIRY_HOURS = 12

export default function TODPie() {
  const [data, setData] = useState([])
  const [tableData, setTableData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    // ✅ Monitor online/offline status
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // ✅ Cleanup listeners
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        // Check for cached data
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          const now = Date.now()
          if (now - parsed.timestamp < CACHE_EXPIRY_HOURS * 60 * 60 * 1000) {
            console.log("Loaded TOD data from cache")
            setData(parsed.data)
            setTableData(parsed.tableData)
            setLoading(false)
            // Fetch fresh data in background if online
            if (navigator.onLine) refreshData()
            return
          }
        }

        // No cache or expired → fetch fresh
        if (navigator.onLine) {
          await refreshData()
        } else {
          throw new Error("Offline and no cached data available")
        }
      } catch (err) {
        console.error("Error fetching TOD data:", err)
        setError(err.message || "Failed to load data")
        setLoading(false)
      }
    }

    // Fetch or load from cache
    fetchData()
  }, [])

  // 🔁 Helper: fetch & cache latest data
  async function refreshData() {
    try {
      const res = await fetch("https://ee.elementsenergies.com/api/fetchAllConsumersTariffHighCount")
      const json = await res.json()

      const counts = json.HighConsumptionTariffCounts
      const percentages = json.HighConsumptionTariffPercentages

      // Prepare chart data
      const chartData = [
        { name: "Peak 1", y: parseFloat(percentages["Peak-1"]), count: counts["Peak-1"] },
        { name: "Peak 2", y: parseFloat(percentages["Peak-2"]), count: counts["Peak-2"] },
        { name: "Normal", y: parseFloat(percentages["Normal"]), count: counts["Normal"] },
        { name: "Off-peak", y: parseFloat(percentages["Off-Peak"]), count: counts["Off-Peak"] },
      ]

      // Prepare table data
      const tableFormatted = Object.keys(counts).map((key) => ({
        name:
          key === "Peak-1"
            ? "Peak 1"
            : key === "Peak-2"
            ? "Peak 2"
            : key === "Off-Peak"
            ? "Off-peak"
            : key,
        percentage: percentages[key],
        count: counts[key],
      }))

      setData(chartData)
      setTableData(tableFormatted)
      setLoading(false)

      // ✅ Cache data with timestamp
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: chartData,
          tableData: tableFormatted,
          timestamp: Date.now(),
        })
      )
    } catch (err) {
      console.error("Error refreshing TOD data:", err)
      setError("Failed to fetch data from server")
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md text-center">
        <p>Loading TOD data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md text-center text-red-500">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-full flex flex-col md:flex-row gap-4 relative">
      {/* ✅ Offline Banner */}
      {isOffline && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-100 text-yellow-800 text-sm py-2 text-center font-medium rounded-t-lg">
          You are offline — showing cached data
        </div>
      )}

      {/* Chart */}
      <div className="flex-1 mt-6 md:mt-0">
        <h3 className="text-lg font-semibold mb-4 text-center">TOD Consumption</h3>
        <HighchartsReact highcharts={Highcharts} options={options} />
      </div>

      {/* Table */}
      <div className="flex-1 mt-6 md:mt-0">
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
            {tableData.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border px-3 py-2">{item.name}</td>
                <td className="border px-3 py-2">{item.percentage}</td>
                <td className="border px-3 py-2">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
