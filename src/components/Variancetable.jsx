import React, { useEffect, useState } from "react"

const CACHE_KEY = "varianceTableCache"
const CACHE_EXPIRY_HOURS = 12

export default function VarianceTable() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // Detect offline/online changes
  useEffect(() => {
    function handleOnline() {
      setIsOffline(false)
      fetchData()
    }
    function handleOffline() {
      setIsOffline(true)
    }
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Fetch data with caching
  async function fetchData() {
    setLoading(true)
    setError(null)

    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        const now = new Date().getTime()
        if (now - parsed.timestamp < CACHE_EXPIRY_HOURS * 3600 * 1000) {
          setData(parsed.data)
          setLoading(false)
          return
        }
      }

      const res = await fetch("https://ee.elementsenergies.com/api/fetchAllHighLowAvg")
      if (!res.ok) throw new Error("Failed to fetch data")
      const result = await res.json()

      // Transform API data safely (handle nulls)
      const formatted = result.map((row) => ({
        consumer: row.Consumer ?? "-",
        serviceNo: row.SCNO ?? "-",
        average: row.average?.consumption ?? null,
        peak: {
          hour: row.high?.hour ?? null,
          value: row.high?.avg_consumption ?? null,
          percentValue:
            row.high?.percent_increase_from_avg != null
              ? row.high.percent_increase_from_avg
              : null,
          percent:
            row.high?.percent_increase_from_avg != null
              ? `${row.high.percent_increase_from_avg.toFixed(2)}%`
              : null,
          category: row.high?.category ?? "-",
        },
        low: {
          hour: row.low?.hour ?? null,
          value: row.low?.avg_consumption ?? null,
          percentValue:
            row.low?.percent_decrease_from_avg != null
              ? row.low.percent_decrease_from_avg
              : null,
          percent:
            row.low?.percent_decrease_from_avg != null
              ? `-${row.low.percent_decrease_from_avg.toFixed(2)}%`
              : null,
          category: row.low?.category ?? "-",
        },
      }))

      setData(formatted)
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: new Date().getTime(), data: formatted })
      )
    } catch (err) {
      setError(err.message)
      // Try to fallback to cache if available
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        setData(parsed.data)
      }
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div>
      {isOffline && (
        <div className="bg-yellow-200 text-yellow-900 p-2 rounded mb-4 text-center">
          You are offline. Showing cached data if available.
        </div>
      )}
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : error && data.length === 0 ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md">
          <table className="w-full border border-gray-300 text-sm text-center">
            <thead>
              <tr className="bg-gray-100">
                <th rowSpan={2} className="border px-3 py-2 align-middle">S.No</th>
                <th rowSpan={2} className="border px-3 py-2 align-middle">Consumer</th>
                <th rowSpan={2} className="border px-3 py-2 align-middle">
                  Average <br />(kWh)
                </th>
                <th colSpan={4} className="border px-3 py-2">Average Peak</th>
                <th colSpan={4} className="border px-3 py-2">Average Low</th>
              </tr>
              <tr className="bg-gray-100">
                {["Peak", "Low"].map((type) => (
                  <React.Fragment key={type}>
                    <th className="border px-3 py-2">Hour</th>
                    <th className="border px-3 py-2">Value <br />(kWh)</th>
                    <th className="border px-3 py-2">
                      % {type === "Peak" ? (
                        <span className="text-green-600">▲</span>
                      ) : (
                        <span className="text-red-600">▼</span>
                      )}
                    </th>
                    <th className="border px-3 py-2">Category</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const peakVal = row.peak.percentValue ?? 0
                const lowVal = row.low.percentValue ?? 0
                const highlightPeak = peakVal > lowVal
                const highlightLow = lowVal > peakVal

                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{i + 1}</td>
                    <td className="border px-3 py-2 font-medium">
                      {row.consumer}{" "}
                      <span className="text-gray-500 text-xs">({row.serviceNo})</span>
                    </td>
                    <td className="border px-3 py-2">{row.average ?? "-"}</td>

                    {/* Peak */}
                    <td className="border px-3 py-2">{row.peak.hour ?? "-"}</td>
                    <td className="border px-3 py-2">{row.peak.value ?? "-"}</td>
                    <td
                      className={`border px-3 py-2 font-medium ${
                        highlightPeak ? "bg-green-100 text-green-700 font-semibold" : ""
                      }`}
                    >
                      {row.peak.percent ?? "-"}
                    </td>
                    <td className="border px-3 py-2 capitalize">{row.peak.category ?? "-"}</td>

                    {/* Low */}
                    <td className="border px-3 py-2">{row.low.hour ?? "-"}</td>
                    <td className="border px-3 py-2">{row.low.value ?? "-"}</td>
                    <td
                      className={`border px-3 py-2 font-medium ${
                        highlightLow ? "bg-red-100 text-red-700 font-semibold" : ""
                      }`}
                    >
                      {row.low.percent ?? "-"}
                    </td>
                    <td className="border px-3 py-2 capitalize">{row.low.category ?? "-"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
