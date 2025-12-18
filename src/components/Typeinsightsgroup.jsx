import { useState, useEffect } from "react"
import { Link } from "react-router-dom"

export default function GroupInsights() {
  const [groupType, setGroupType] = useState("Flat")
  const [consumers, setConsumers] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // 🔁 Updated group options (Day + Night → Shift)
  const groupOptions = ["Flat", "Shift", "Random"]

  // 🔁 Updated type map
  const typeMap = {
    Flat: "flat",
    Shift: "shift",
    Random: "random",
  }

  const CACHE_KEY = "groupInsightsCache"

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
    const fetchConsumers = async () => {
      setLoading(true)

      const cache = localStorage.getItem(CACHE_KEY)
      let cachedData = null
      if (cache) cachedData = JSON.parse(cache)

      const now = Date.now()

      if (isOffline) {
        if (cachedData && cachedData[groupType]) {
          setConsumers(cachedData[groupType].data)
        }
        setLoading(false)
        return
      }

      if (
        cachedData &&
        cachedData[groupType] &&
        now - cachedData[groupType].timestamp < 12 * 60 * 60 * 1000
      ) {
        setConsumers(cachedData[groupType].data)
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `https://ee.elementsenergies.com/api/fetchCategoryWiseNormalData/?type=${typeMap[groupType]}`
        )
        const data = await response.json()

        const formattedData = data.map((item, index) => ({
          sno: index + 1,
          name: item.Consumer,
          scno: item.SCNO,
          percentage: item.Percentage,
          values: Array(24).fill(0),
        }))

        setConsumers(formattedData)

        const newCache = cachedData || {}
        newCache[groupType] = {
          timestamp: now,
          data: formattedData,
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(newCache))
      } catch (error) {
        console.error("Error fetching consumer data:", error)
        setConsumers([])
      }

      setLoading(false)
    }

    fetchConsumers()
  }, [groupType, isOffline])

  useEffect(() => {
    const fetchHeatmapForConsumer = async (scno, index) => {
      if (isOffline) return

      try {
        const response = await fetch(
          `https://ee.elementsenergies.com/api/fetchNormalHM?scno=${scno}`
        )
        const data = await response.json()
        const heatmapValues = data.map((item) => item.normal_value)

        setConsumers((prev) => {
          const updated = [...prev]
          updated[index].values = heatmapValues
          return updated
        })
      } catch (error) {
        console.error(`Error fetching heatmap for ${scno}:`, error)
      }
    }

    consumers.forEach((consumer, idx) => {
      fetchHeatmapForConsumer(consumer.scno, idx)
    })
  }, [consumers.length, isOffline])

  return (
    <div className="relative p-2 font-poppins bg-white shadow-md rounded-lg">

      {/* OFFLINE BANNER */}
      {isOffline && (
        <div className="mb-3 bg-yellow-500 text-white text-center py-2 rounded-lg shadow">
          You are offline — showing cached data (if available)
        </div>
      )}

      <div className="flex items-center justify-between mb-4">

        {/* Toggle Buttons */}
        <div className="flex items-center gap-1">
          {groupOptions.map((mode) => (
            <button
              key={mode}
              onClick={() => setGroupType(mode)}
              className={`px-3 py-1 text-sm font-semibold rounded-lg border transition-colors hover:cursor-pointer ${
                groupType === mode
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : consumers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No variance data available
          </div>
        ) : (
          <table className="w-full border border-gray-300 text-sm text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 w-12">S.No</th>
                <th className="border px-3 py-2 w-64">Consumer</th>
                <th className="border px-3 py-2 w-24">%</th>
                <th className="border px-3 py-2">Normalised Consumption</th>
              </tr>
            </thead>

            <tbody>
              {consumers.map((c) => (
                <tr key={c.sno} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{c.sno}</td>

                  <td className="border px-3 py-2 font-medium text-left">
                    <Link
                      to={`/consumer/${c.scno}`}
                      state={{ scno: c.scno, short_name: c.name }}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      {c.name}
                    </Link>
                    <span className="text-gray-500 text-xs">
                      ({c.scno})
                    </span>
                  </td>

                  <td className="border px-3 py-2">{c.percentage}%</td>

                  <td className="border px-3 py-2">
                    <div className="flex gap-[2px] w-full">
                      {c.values.map((v, idx) => (
                        <div
                          key={idx}
                          className="h-4 flex-1 rounded-sm relative group"
                          style={{
                            backgroundColor: `rgba(0, 120, 255, ${v})`,
                          }}
                        >
                          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-700 text-white text-xs rounded px-1 py-[1px] whitespace-nowrap">
                            {`${idx.toString().padStart(2, "0")}:00 - ${v.toFixed(2)}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}