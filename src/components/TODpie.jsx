import { useEffect, useState } from "react"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"

const CACHE_KEY = "todPieCache"
const CACHE_EXPIRY_HOURS = 12

export default function TODPie() {
  const [data, setData] = useState([])
  const [tableData, setTableData] = useState([])
  const [totalConsumers, setTotalConsumers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          const now = Date.now()
          if (now - parsed.timestamp < CACHE_EXPIRY_HOURS * 60 * 60 * 1000) {
            console.log("Loaded TOD data from cache")
            setData(parsed.data)
            setTableData(parsed.tableData)
            setTotalConsumers(parsed.totalConsumers)
            setLoading(false)
            if (navigator.onLine) refreshData()
            return
          }
        }

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

    fetchData()
  }, [])

  async function refreshData() {
    try {
      const res = await fetch("https://ee.elementsenergies.com/api/fetchAllConsumersTariffHighCount")
      const json = await res.json()

      const counts = json.HighConsumptionTariffCounts
      const percentages = json.HighConsumptionTariffPercentages
      const total = json.TotalConsumers || 0

      // ✅ Prepare pie data (from counts)
      const chartData = [
        { name: "Peak", y: counts["Peak"] },
        { name: "Normal", y: counts["Normal"] },
        { name: "Off-Peak", y: counts["Off-Peak"] },
      ]

      // ✅ Prepare table data
      const tableFormatted = [
        { name: "Peak", count: counts["Peak"], percentage: percentages["Peak"] },
        { name: "Normal", count: counts["Normal"], percentage: percentages["Normal"] },
        { name: "Off-Peak", count: counts["Off-Peak"], percentage: percentages["Off-Peak"] },
      ]

      setData(chartData)
      setTableData(tableFormatted)
      setTotalConsumers(total)
      setLoading(false)

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: chartData,
          tableData: tableFormatted,
          totalConsumers: total,
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
      pointFormat: "<b>{point.y}</b> consumers",
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
        colors: ["#FF8042", "#00C49F", "#0088FE"],
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
      <div className="flex-1 mt-6 md:mt-0 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-center">Details</h3>
        </div>
        <div>
          <table className="w-full text-left border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2">TOD</th>
                <th className="border px-3 py-2">Count</th>
                <th className="border px-3 py-2">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border px-3 py-2 font-medium">{item.name}</td>
                  <td className="border px-3 py-2">{item.count ?? item.value ?? "-"}</td>
                  <td className="border px-3 py-2">{item.percentage ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
