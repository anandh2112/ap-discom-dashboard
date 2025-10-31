import { useEffect, useState } from "react"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"

export default function OverviewVar() {
  const [varianceData, setVarianceData] = useState({ high: [], low: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState("peak")
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  const CACHE_KEY = "varianceDataCache"
  const CACHE_TIME_KEY = "varianceDataCacheTime"
  const VIEW_MODE_KEY = "varianceViewMode"
  const CACHE_DURATION = 12 * 60 * 60 * 1000 // 12 hours

  // Detect online/offline
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

  // Load last selected view mode
  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_MODE_KEY)
    if (savedView) setViewMode(savedView)
  }, [])

  const fetchData = async () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY)
      const now = Date.now()

      if (cached && cachedTime && now - cachedTime < CACHE_DURATION) {
        setVarianceData(JSON.parse(cached))
        setLoading(false)
        return
      }

      if (isOffline) {
        if (cached) {
          setVarianceData(JSON.parse(cached))
        } else {
          setError("Offline and no cached data available.")
        }
        setLoading(false)
        return
      }

      const res = await fetch("https://ee.elementsenergies.com/api/fetchAllConsumersVariance")
      if (!res.ok) throw new Error("Failed to fetch data")
      const data = await res.json()

      const highData = [
        data.high_category.very_low,
        data.high_category.low,
        data.high_category.medium,
        data.high_category.high,
        data.high_category.very_high,
      ]
      const lowData = [
        data.low_category.very_low,
        data.low_category.low,
        data.low_category.medium,
        data.low_category.high,
        data.low_category.very_high,
      ]

      const formattedData = { high: highData, low: lowData }

      setVarianceData(formattedData)
      localStorage.setItem(CACHE_KEY, JSON.stringify(formattedData))
      localStorage.setItem(CACHE_TIME_KEY, now.toString())
    } catch (err) {
      setError("Error fetching variance data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [isOffline])

  const categories = ["Very Low", "Low", "Medium", "High", "Very High"]

  // Important fix: always create a *new* object for options so Highcharts updates
  const varianceOptions = {
    chart: { type: "column", height: 200 },
    title: { text: null },
    xAxis: { categories },
    yAxis: { title: { text: "Consumers" } },
    series: [
      {
        name: viewMode === "peak" ? "Peak Variance" : "Low Variance",
        data:
          viewMode === "peak"
            ? varianceData.high || [0, 0, 0, 0, 0]
            : varianceData.low || [0, 0, 0, 0, 0],
        colorByPoint: true,
        colors: ["#6BCB77", "#FFD93D", "#FFB84C", "#FF6B6B", "#C70039"],
      },
    ],
    legend: { enabled: false },
    credits: { enabled: false },
  }

  const handleModeChange = (mode) => {
    if (mode !== viewMode) {
      setViewMode(mode)
      localStorage.setItem(VIEW_MODE_KEY, mode)
    }
  }

  if (loading)
    return (
      <div className="bg-white shadow-md rounded-2xl p-3 text-center font-poppins">
        Loading...
      </div>
    )

  if (error)
    return (
      <div className="bg-white shadow-md rounded-2xl p-3 text-center text-red-500 font-poppins">
        {error}
      </div>
    )

  return (
    <div className="bg-white shadow-md rounded-2xl p-3 font-poppins relative">
      {isOffline && (
        <div className="bg-yellow-100 text-yellow-800 text-xs p-2 rounded-md mb-2 text-center">
          You are offline. Showing cached data if available.
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        {/* Header centered using flex-grow and text-center */}
        <div className="flex-1 text-center">
          <h1 className="text-md font-semibold">Consumers - Variance</h1>
        </div>

        {/* Buttons on right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleModeChange("peak")}
            title="Peak"
            className={`px-2 py-1 rounded-lg border transition-all ${
              viewMode === "peak"
                ? "bg-green-100 border-green-500 text-green-600"
                : "border-gray-300 text-gray-500 hover:bg-gray-100"
            }`}
          >
            <span className="text-green-600">▲</span>
          </button>
          <button
            onClick={() => handleModeChange("low")}
            title="Low"
            className={`px-2 py-1 rounded-lg border transition-all ${
              viewMode === "low"
                ? "bg-red-100 border-red-500 text-red-600"
                : "border-gray-300 text-gray-500 hover:bg-gray-100"
            }`}
          >
            <span className="text-red-600">▼</span>
          </button>
        </div>
      </div>

      <HighchartsReact
        highcharts={Highcharts}
        options={varianceOptions}
        key={viewMode} // ✅ Force re-render on mode change
      />
    </div>
  )
}