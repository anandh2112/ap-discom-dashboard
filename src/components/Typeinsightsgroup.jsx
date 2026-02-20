import { useState, useEffect, useMemo, useRef } from "react"
import { Link } from "react-router-dom"

const ITEMS_PER_PAGE = 100
const TABLE_MAX_HEIGHT = "475px"

export default function GroupInsights() {
  const [groupType, setGroupType] = useState("Flat")
  const [consumers, setConsumers] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [currentPage, setCurrentPage] = useState(1)

  // Prevent duplicate heatmap fetches
  const fetchedHeatmaps = useRef(new Set())

  const groupOptions = ["Flat", "Shift", "Random"]

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

  // Fetch category list
  useEffect(() => {
    const fetchConsumers = async () => {
      setLoading(true)
      fetchedHeatmaps.current.clear()

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

  // Reset page when group changes
  useEffect(() => {
    setCurrentPage(1)
  }, [groupType])

  const totalPages = Math.ceil(consumers.length / ITEMS_PER_PAGE)

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return consumers.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [consumers, currentPage])

  // 🔥 Fetch heatmaps ONLY for current page
  useEffect(() => {
    if (isOffline) return

    const fetchHeatmapForConsumer = async (scno, globalIndex) => {
      if (fetchedHeatmaps.current.has(scno)) return

      try {
        const response = await fetch(
          `https://ee.elementsenergies.com/api/fetchNormalHM?scno=${scno}`
        )
        const data = await response.json()
        const heatmapValues = data.map((item) => item.normal_value)

        setConsumers((prev) => {
          const updated = [...prev]
          updated[globalIndex].values = heatmapValues
          return updated
        })

        fetchedHeatmaps.current.add(scno)
      } catch (error) {
        console.error(`Error fetching heatmap for ${scno}:`, error)
      }
    }

    paginatedData.forEach((consumer) => {
      const globalIndex = consumers.findIndex((c) => c.scno === consumer.scno)
      if (globalIndex !== -1) {
        fetchHeatmapForConsumer(consumer.scno, globalIndex)
      }
    })
  }, [paginatedData, isOffline, consumers])

  const getPagination = () => {
    const pages = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "ellipsis", totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(
          1,
          "ellipsis",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        )
      } else {
        pages.push(
          1,
          "ellipsis",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "ellipsis",
          totalPages
        )
      }
    }

    return pages
  }

  const paginationItems = getPagination()

  return (
    <div className="relative p-2 font-poppins bg-white shadow-md rounded-lg">
      {isOffline && (
        <div className="mb-3 bg-yellow-500 text-white text-center py-2 rounded-lg shadow">
          You are offline — showing cached data (if available)
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
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

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : consumers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No variance data available
        </div>
      ) : (
        <>
          <div className="bg-white shadow-lg rounded-md border overflow-hidden">
            <div
              style={{ maxHeight: TABLE_MAX_HEIGHT }}
              className="overflow-y-auto overflow-x-auto"
            >
              <table className="w-full border-collapse text-sm text-center">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="border px-3 py-2 w-12">S.No</th>
                    <th className="border px-3 py-2 w-64">Consumer</th>
                    <th className="border px-3 py-2 w-24">%</th>
                    <th className="border px-3 py-2">
                      Normalised Consumption
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((c) => (
                    <tr key={c.sno} className="hover:bg-gray-50 border-b">
                      <td className="border px-3 py-2">{c.sno}</td>

                      <td className="border px-3 py-2 font-medium text-left">
                        <Link
                          to={`/consumer/${c.scno}`}
                          state={{ scno: c.scno, short_name: c.name }}
                          className="text-blue-600 font-semibold hover:underline"
                        >
                          {c.name}
                        </Link>
                        <span className="text-gray-500 text-xs ml-1">
                          ({c.scno})
                        </span>
                      </td>

                      <td className="border px-3 py-2">
                        {c.percentage}%
                      </td>

                      <td className="border px-3 py-2">
                        <div className="flex gap-[2px] w-full min-w-[300px]">
                          {c.values.map((v, idx) => (
                            <div
                              key={idx}
                              className="h-4 flex-1 rounded-sm relative group"
                              style={{
                                backgroundColor: `rgba(0, 120, 255, ${v})`,
                              }}
                            >
                              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-700 text-white text-xs rounded px-1 py-[1px] whitespace-nowrap z-20">
                                {`${idx
                                  .toString()
                                  .padStart(2, "0")}:00 - ${v.toFixed(2)}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {consumers.length > 0 && (
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-3 bg-white border border-black px-4 py-1 rounded-full shadow-sm min-w-[420px] justify-center">
                <button
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  disabled={currentPage === 1}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-30 cursor-pointer text-lg"
                >
                  ‹
                </button>

                {paginationItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span key={index} className="text-blue-400 w-8 text-center">
                      ...
                    </span>
                  ) : (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(item)}
                      className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition ${
                        currentPage === item
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={currentPage === totalPages}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-30 cursor-pointer text-lg"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}