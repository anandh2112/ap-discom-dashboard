import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

export default function ConsumerList() {
  const [consumers, setConsumers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  const CACHE_KEY = "consumerDataCache"
  const CACHE_TIMESTAMP_KEY = "consumerDataTimestamp"
  const CACHE_VALIDITY_HOURS = 12 // you can adjust this

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

  useEffect(() => {
    const fetchConsumers = async () => {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY)
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
        const isCacheValid =
          cachedData &&
          cachedTimestamp &&
          Date.now() - parseInt(cachedTimestamp, 10) < CACHE_VALIDITY_HOURS * 3600 * 1000

        // Use cached data immediately if available
        if (cachedData) {
          const parsed = JSON.parse(cachedData)
          setConsumers(parsed)
          setLoading(false)
        }

        // If offline and cache exists, skip network call
        if (!navigator.onLine && cachedData) {
          console.log("Offline mode: showing cached consumer data")
          return
        }

        // Otherwise, fetch from network
        const res = await fetch("/api/fetchAllParUniqueMSN", { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
        const data = await res.json()

        if (!Array.isArray(data)) throw new Error("Unexpected API response format")

        const formatted = data.map((item, index) => ({
          sno: index + 1,
          serviceNo: item.scno || "N/A",
          name: item.short_name || "N/A",
          category: item.category || "N/A",
          contractedDemand: item.load ? `${parseInt(item.load)} kVA` : "N/A",
          htIncomer: item.actual_voltage ? parseInt(item.actual_voltage) : "N/A",
        }))

        // Update cache & state
        localStorage.setItem(CACHE_KEY, JSON.stringify(formatted))
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
        setConsumers(formatted)
      } catch (err) {
        console.error("Error fetching consumers:", err)
        if (!consumers.length) setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchConsumers()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Consumer List</h1>

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

      {!loading && !error && consumers.length === 0 && (
        <p className="text-gray-600">No consumer data available.</p>
      )}

      {!loading && consumers.length > 0 && (
        <table className="min-w-full bg-white shadow-lg overflow-hidden border border-gray-200">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-2 px-4">S.No</th>
              <th className="py-2 px-4">Service No</th>
              <th className="py-2 px-4">Consumer Name</th>
              <th className="py-2 px-4">Category</th>
              <th className="py-2 px-4">Contracted Demand</th>
              <th className="py-2 px-4">HT Incomer</th>
            </tr>
          </thead>
          <tbody>
            {consumers.map((c) => (
              <tr key={c.sno} className="text-center border-b hover:bg-slate-100">
                <td className="py-2">{c.sno}</td>
                <td className="py-2">{c.serviceNo}</td>
                <td className="py-2 text-blue-600 font-semibold">
                  <Link
                    to={`/consumer/${c.serviceNo}`}
                    state={{
                      scno: c.serviceNo,
                      short_name: c.name,
                    }}
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="py-2">{c.category}</td>
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
