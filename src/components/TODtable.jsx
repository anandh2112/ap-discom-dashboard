import { useEffect, useState, useRef } from "react"

export default function TODTable() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [error, setError] = useState(null)

  const hasLoadedRef = useRef(false) // Prevents re-fetch on remount

  const CACHE_KEY = "todTableData"
  const CACHE_TIMESTAMP_KEY = "todTableDataTimestamp"
  const CACHE_EXPIRY_HOURS = 12

  // --- Helper: Check cache validity ---
  const isCacheValid = () => {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    if (!timestamp) return false
    const age = (Date.now() - parseInt(timestamp, 10)) / (1000 * 60 * 60)
    return age < CACHE_EXPIRY_HOURS
  }

  // --- Helper: Load cached data ---
  const loadCachedData = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null
      return JSON.parse(cached)
    } catch {
      return null
    }
  }

  // --- Fetch data (only if necessary) ---
  const fetchData = async () => {
    if (hasLoadedRef.current) return // Prevent re-fetch on remount
    hasLoadedRef.current = true

    setLoading(true)
    setError(null)

    try {
      // Try using cache first if valid
      const cachedData = loadCachedData()
      if (cachedData && isCacheValid()) {
        setData(cachedData)
        setLoading(false)

        // Still fetch in background (to refresh cache if online)
        if (navigator.onLine) {
          fetchAndUpdateCache()
        }
        return
      }

      // Otherwise fetch new data
      await fetchAndUpdateCache()
    } catch (err) {
      console.warn("⚠️ Fetch failed:", err.message)

      const cachedData = loadCachedData()
      if (cachedData) {
        setData(cachedData)
      } else {
        setError("Unable to fetch data. Please connect to the internet.")
      }
    } finally {
      setLoading(false)
    }
  }

  // --- Actual network fetch + cache update ---
  const fetchAndUpdateCache = async () => {
    const response = await fetch("https://ee.elementsenergies.com/api/fetchAllConsumerwiseTariffBasedConsumption")
    if (!response.ok) throw new Error("Network error")
    const jsonData = await response.json()

    localStorage.setItem(CACHE_KEY, JSON.stringify(jsonData))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())

    setData(jsonData)
  }

  // --- Detect online/offline status ---
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

  // --- Initial data load (runs once) ---
  useEffect(() => {
    fetchData()
  }, [])

  // --- UI States ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-gray-500">Loading data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4 bg-red-50 rounded-md shadow-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Offline banner */}
      {isOffline && (
        <div className="bg-yellow-200 text-yellow-900 text-center py-2 text-sm font-medium rounded-t-md">
          ⚠️ You are offline — showing cached data
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto bg-white p-4 rounded-b-lg shadow-md">
        <table className="w-full border border-gray-300 text-sm text-center">
          <thead>
            <tr className="bg-gray-100">
              <th rowSpan={2} className="border px-3 py-2">S.No</th>
              <th rowSpan={2} className="border px-3 py-2">Consumer</th>
              <th colSpan={2} className="border px-3 py-2">Peak-1</th>
              <th colSpan={2} className="border px-3 py-2">Peak-2</th>
              <th colSpan={2} className="border px-3 py-2">Normal</th>
              <th colSpan={2} className="border px-3 py-2">Off-Peak</th>
              <th rowSpan={2} className="border px-3 py-2">Max Savings (₹)</th>
            </tr>
            <tr className="bg-gray-100">
              {["Peak-1", "Peak-2", "Normal", "Off-Peak"].map((_, i) => (
                <>
                  <th key={`percent-${i}`} className="border px-3 py-2">%</th>
                  <th key={`value-${i}`} className="border px-3 py-2">Value (kWh)</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td className="border px-3 py-2">{idx + 1}</td>
                <td className="border px-3 py-2 font-medium">
                  {row.Consumer}{" "}
                  <span className="text-gray-500 text-xs">({row.SCNO})</span>
                </td>

                {/* Peak-1 */}
                <td className="border px-3 py-2">
                  {row.TariffWisePercentage?.["Peak-1"]?.toFixed(2) ?? "-"}%
                </td>
                <td className="border px-3 py-2">
                  {row.TariffWiseConsumption_kWh?.["Peak-1"]?.toLocaleString() ?? "-"}
                </td>

                {/* Peak-2 */}
                <td className="border px-3 py-2">
                  {row.TariffWisePercentage?.["Peak-2"]?.toFixed(2) ?? "-"}%
                </td>
                <td className="border px-3 py-2">
                  {row.TariffWiseConsumption_kWh?.["Peak-2"]?.toLocaleString() ?? "-"}
                </td>

                {/* Normal */}
                <td className="border px-3 py-2">
                  {row.TariffWisePercentage?.["Normal"]?.toFixed(2) ?? "-"}%
                </td>
                <td className="border px-3 py-2">
                  {row.TariffWiseConsumption_kWh?.["Normal"]?.toLocaleString() ?? "-"}
                </td>

                {/* Off-Peak */}
                <td className="border px-3 py-2">
                  {row.TariffWisePercentage?.["Off-Peak"]?.toFixed(2) ?? "-"}%
                </td>
                <td className="border px-3 py-2">
                  {row.TariffWiseConsumption_kWh?.["Off-Peak"]?.toLocaleString() ?? "-"}
                </td>

                {/* Max Savings */}
                <td className="border px-3 py-2 font-semibold">
                  ₹{row.CostSavings?.toLocaleString() ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
