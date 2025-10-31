import { useEffect, useState } from "react"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"

export default function OverviewTOD() {
  const [todData, setTodData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  const CACHE_KEY = "todDataCache"
  const CACHE_TIME_KEY = "todDataCacheTime"
  const CACHE_DURATION = 12 * 60 * 60 * 1000 // 12 hours

  // Detect online/offline changes
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
        // Try cache first
        const cached = localStorage.getItem(CACHE_KEY)
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY)
        const now = Date.now()

        if (cached && cachedTime && now - cachedTime < CACHE_DURATION) {
          setTodData(JSON.parse(cached))
          setLoading(false)
          return
        }

        if (isOffline) {
          if (cached) {
            setTodData(JSON.parse(cached))
          } else {
            setError("Offline and no cached data available.")
          }
          setLoading(false)
          return
        }

        // Fetch new data
        const response = await fetch(
          "https://ee.elementsenergies.com/api/fetchAllConsumersTariffBasedConsumption"
        )
        if (!response.ok) throw new Error("Failed to fetch data")
        const data = await response.json()

        // Convert API data to Highcharts format with colors
        const formattedData = [
          { name: "Peak-1", y: data["Peak-1"] || 0, color: "#FF6B6B" },     
          { name: "Peak-2", y: data["Peak-2"] || 0, color: "#4D96FF" },     
          { name: "Normal", y: data["Normal"] || 0, color: "#FFD93D" },     
          { name: "Off-Peak", y: data["Off-Peak"] || 0, color: "#6BCB77" }, 
        ]

        setTodData(formattedData)

        // Cache result
        localStorage.setItem(CACHE_KEY, JSON.stringify(formattedData))
        localStorage.setItem(CACHE_TIME_KEY, now.toString())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isOffline])

  const todOptions = {
    chart: { type: "pie", height: 210 },
    title: { text: null },
    tooltip: { pointFormat: "<b>{point.percentage:.1f}%</b> ({point.y:.2f} MWh)" },
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
      y: -5,
      x: -10,
    },
    series: [
      {
        name: "TOD Split",
        colorByPoint: true,
        data: todData,
      },
    ],
    credits: { enabled: false },
  }

  return (
    <div className="bg-white shadow-md rounded-2xl p-3 font-poppins relative">
      {/* Card Header */}
      <div className="flex items-center justify-center mb-2">
        <h1 className="text-md font-semibold">Consumption - TOD</h1>
      </div>

      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-yellow-100 text-yellow-800 text-xs p-2 rounded-md mb-2 text-center">
          You are offline. Showing cached data if available.
        </div>
      )}

      <div className="flex justify-center items-center">
        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : error ? (
          <p className="text-red-500 text-sm">Error: {error}</p>
        ) : (
          <HighchartsReact highcharts={Highcharts} options={todOptions} />
        )}
      </div>
    </div>
  )
}