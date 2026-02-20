import { Link } from "react-router-dom"
import { useEffect, useState, useMemo } from "react"

export default function ConsumerList({ searchQuery }) {
  const [consumers, setConsumers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)

  const CACHE_KEY = "consumerDataCache"
  const CACHE_TIMESTAMP_KEY = "consumerDataTimestamp"
  const CACHE_VALIDITY_HOURS = 12
  const ITEMS_PER_PAGE = 100

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
      try {
        const cachedData = localStorage.getItem(CACHE_KEY)
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)

        if (
          cachedData &&
          cachedTimestamp &&
          Date.now() - Number(cachedTimestamp) <
            CACHE_VALIDITY_HOURS * 3600 * 1000
        ) {
          setConsumers(JSON.parse(cachedData))
          setLoading(false)
        }

        if (!navigator.onLine && cachedData) return

        const res = await fetch(
          "https://ee.elementsenergies.com/api/fetchAllParUniqueMSN",
          { cache: "no-store" }
        )

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        if (!Array.isArray(data)) throw new Error("Invalid API response")

        const formatted = data.map((item) => ({
          serviceNo: item.scno || "N/A",
          name: item.short_name || "N/A",
          category_desc: item.category_desc || "",
          contractedDemand: item.load ? `${parseInt(item.load)} kVA` : "N/A",
          htIncomer: item.actual_voltage ? parseInt(item.actual_voltage) : "N/A",
        }))

        localStorage.setItem(CACHE_KEY, JSON.stringify(formatted))
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
        setConsumers(formatted)
      } catch (err) {
        if (!consumers.length) setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchConsumers()
  }, [])

  const filteredConsumers = useMemo(() => {
    return consumers
      .filter((c) => {
        const matchesSearch = c.serviceNo
          .toLowerCase()
          .includes(searchQuery.toLowerCase())

        const category = c.category_desc.toUpperCase()

        const matchesCategory =
          categoryFilter === "All" ||
          (categoryFilter === "Industry" && category.includes("INDUSTRY")) ||
          (categoryFilter === "Commercial" && category.includes("COMMERCIAL"))

        return matchesSearch && matchesCategory
      })
      .map((c, index) => ({ ...c, sno: index + 1 }))
  }, [consumers, searchQuery, categoryFilter])

  const totalPages = Math.ceil(filteredConsumers.length / ITEMS_PER_PAGE)

  const paginatedConsumers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredConsumers.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    )
  }, [filteredConsumers, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, categoryFilter])

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
    <div className="p-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Consumer List</h1>

        <select
          className="border px-2 py-1 rounded-md bg-white cursor-pointer"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Industry">Industry</option>
          <option value="Commercial">Commercial</option>
        </select>
      </div>

      {!loading && paginatedConsumers.length > 0 && (
        <>
          <div className="bg-white shadow-lg rounded-md border overflow-hidden">

            {/* Fixed height scroll container */}
            <div className="max-h-[500px] overflow-y-auto">

              <table className="min-w-full border-collapse">
                <thead className="bg-blue-600 text-white sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-3">S.No</th>
                    <th className="py-2 px-3">Service No</th>
                    <th className="py-2 px-3">Consumer Name</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Contracted Demand</th>
                    <th className="py-2 px-3">HT Incomer</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedConsumers.map((c) => (
                    <tr
                      key={c.sno}
                      className="text-center border-b hover:bg-slate-100"
                    >
                      <td className="py-2">{c.sno}</td>
                      <td className="py-2">{c.serviceNo}</td>
                      <td className="py-2 text-blue-600 font-semibold">
                        <Link
                          to={`/consumer/${c.serviceNo}`}
                          state={{ scno: c.serviceNo, short_name: c.name }}
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-2">{c.category_desc}</td>
                      <td className="py-2">{c.contractedDemand}</td>
                      <td className="py-2">{c.htIncomer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-3 bg-white border-1 border-black px-4 py-2 rounded-full shadow-sm min-w-[420px] justify-center">
              
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
                    className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition
                      ${
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
        </>
      )}
    </div>
  )
}