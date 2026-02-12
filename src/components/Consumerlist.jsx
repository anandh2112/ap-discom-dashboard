import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

export default function ConsumerList({ searchQuery }) {
  const [consumers, setConsumers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [categoryFilter, setCategoryFilter] = useState("All")

  const CACHE_KEY = "consumerDataCache"
  const CACHE_TIMESTAMP_KEY = "consumerDataTimestamp"
  const CACHE_VALIDITY_HOURS = 12

  /* ------------------ ONLINE / OFFLINE ------------------ */
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

  /* ------------------ FETCH DATA ------------------ */
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

  /* ------------------ FILTER LOGIC ------------------ */
  const filteredConsumers = consumers
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

  /* ------------------ UI ------------------ */
  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Consumer List</h1>

        <select
          className="border px-2 py-1 rounded-md bg-white"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Industry">Industry</option>
          <option value="Commercial">Commercial</option>
        </select>
      </div>

      {isOffline && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md mb-4">
          ⚠️ You’re offline — showing cached data
        </div>
      )}

      {loading && <p className="text-gray-600">Loading consumer data...</p>}

      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded-md mb-4">
          Failed to load data: {error}
        </div>
      )}

      {!loading && filteredConsumers.length === 0 && (
        <p className="text-gray-600">No consumer data available.</p>
      )}

      {!loading && filteredConsumers.length > 0 && (
        <table className="min-w-full bg-white shadow-lg rounded-md border">
          <thead className="bg-blue-600 text-white">
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
            {filteredConsumers.map((c) => (
              <tr key={c.sno} className="text-center border-b hover:bg-slate-100">
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
      )}
    </div>
  )
}