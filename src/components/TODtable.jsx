import { useEffect, useState, useRef, useMemo } from "react"
import { Link } from "react-router-dom"

export default function TODTable() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [error, setError] = useState(null)

  const hasLoadedRef = useRef(false)

  const CACHE_KEY = "todTableData"
  const CACHE_TIMESTAMP_KEY = "todTableDataTimestamp"
  const CACHE_EXPIRY_HOURS = 12

  const categories = ["Peak-1", "Peak-2", "Normal", "Off-Peak"]

  const isCacheValid = () => {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    if (!timestamp) return false
    const age = (Date.now() - parseInt(timestamp, 10)) / (1000 * 60 * 60)
    return age < CACHE_EXPIRY_HOURS
  }

  const loadCachedData = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null
      return JSON.parse(cached)
    } catch {
      return null
    }
  }

  // Helper: sort an array of rows by SCNO (numeric if possible, otherwise string)
  const sortBySCNO = (arr) => {
    if (!Array.isArray(arr)) return arr
    return arr.slice().sort((a, b) => {
      const aRaw = a?.SCNO
      const bRaw = b?.SCNO

      const aNum = Number(aRaw)
      const bNum = Number(bRaw)

      const aNumValid = !isNaN(aNum)
      const bNumValid = !isNaN(bNum)

      if (aNumValid && bNumValid) {
        return aNum - bNum
      }

      // Fallback to string compare
      return String(aRaw ?? "").localeCompare(String(bRaw ?? ""))
    })
  }

  const fetchData = async () => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    setLoading(true)
    setError(null)

    try {
      const cachedData = loadCachedData()
      if (cachedData && isCacheValid()) {
        // Ensure cached data is sorted by SCNO before showing
        setData(sortBySCNO(cachedData))
        setLoading(false)
        if (navigator.onLine) fetchAndUpdateCache()
        return
      }
      await fetchAndUpdateCache()
    } catch (err) {
      console.warn("⚠️ Fetch failed:", err?.message ?? err)
      const cachedData = loadCachedData()
      if (cachedData) {
        setData(sortBySCNO(cachedData))
      } else {
        setError("Unable to fetch data. Please connect to the internet.")
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchAndUpdateCache = async () => {
    const response = await fetch("https://ee.elementsenergies.com/api/fetchAllConsumerwiseTariffBasedConsumption1")
    if (!response.ok) throw new Error("Network error")
    const jsonData = await response.json()

    // Sort by SCNO before storing and setting state so default view is ordered
    const sorted = sortBySCNO(jsonData)

    localStorage.setItem(CACHE_KEY, JSON.stringify(sorted))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())

    setData(sorted)
  }

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
    fetchData()
  }, [])

  // Single-row filter & sort state
  const [selectedCategory, setSelectedCategory] = useState(categories[0]) // default Peak-1
  const [percentMin, setPercentMin] = useState("")
  const [percentMax, setPercentMax] = useState("")
  const [valueMin, setValueMin] = useState("")
  const [valueMax, setValueMax] = useState("")
  const [sortMetric, setSortMetric] = useState("percent") // 'percent' or 'value'
  const [sortOrder, setSortOrder] = useState(null) // 'asc' | 'desc' | null

  const clearAll = () => {
    setSelectedCategory(categories[0])
    setPercentMin("")
    setPercentMax("")
    setValueMin("")
    setValueMax("")
    setSortMetric("percent")
    setSortOrder(null)
  }

  // Compute filtered and sorted data based on single selected category filters
  const filteredAndSortedData = useMemo(() => {
    if (!Array.isArray(data)) return []

    const pMin = percentMin !== "" ? Number(percentMin) : null
    const pMax = percentMax !== "" ? Number(percentMax) : null
    const vMin = valueMin !== "" ? Number(valueMin) : null
    const vMax = valueMax !== "" ? Number(valueMax) : null

    const passesFilters = (row) => {
      const percentRaw = row?.TariffWisePercentage?.[selectedCategory]
      const valueRaw = row?.TariffWiseConsumption_MWh?.[selectedCategory]

      const percentVal = typeof percentRaw === "number" ? percentRaw : (percentRaw ? Number(percentRaw) : NaN)
      const valueVal = typeof valueRaw === "number" ? valueRaw : (valueRaw ? Number(valueRaw) : NaN)

      if (pMin !== null) {
        if (isNaN(percentVal) || percentVal < pMin) return false
      }
      if (pMax !== null) {
        if (isNaN(percentVal) || percentVal > pMax) return false
      }
      if (vMin !== null) {
        if (isNaN(valueVal) || valueVal < vMin) return false
      }
      if (vMax !== null) {
        if (isNaN(valueVal) || valueVal > vMax) return false
      }
      return true
    }

    let result = data.filter(passesFilters)

    // If no explicit UI sort order is set, preserve the order from `data` (which is sorted by SCNO by default).
    if (sortOrder && sortMetric) {
      const cat = selectedCategory
      const metric = sortMetric
      result = result.slice().sort((a, b) => {
        const aRaw = metric === "percent" ? a?.TariffWisePercentage?.[cat] : a?.TariffWiseConsumption_MWh?.[cat]
        const bRaw = metric === "percent" ? b?.TariffWisePercentage?.[cat] : b?.TariffWiseConsumption_MWh?.[cat]

        const aVal = typeof aRaw === "number" ? aRaw : (aRaw ? Number(aRaw) : NaN)
        const bVal = typeof bRaw === "number" ? bRaw : (bRaw ? Number(bRaw) : NaN)

        const aIsNaN = isNaN(aVal)
        const bIsNaN = isNaN(bVal)
        if (aIsNaN && bIsNaN) return 0
        if (aIsNaN) return 1
        if (bIsNaN) return -1

        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, selectedCategory, percentMin, percentMax, valueMin, valueMax, sortMetric, sortOrder])

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
    <div className="relative bg-white p-3 rounded-lg shadow-md">
      {isOffline && (
        <div className="bg-yellow-200 text-yellow-900 text-center py-2 text-sm font-medium rounded-t-md">
          ⚠️ You are offline — showing cached data
        </div>
      )}

      {/* Single-row Filters & Sort UI */}
      <div className="flex flex-wrap items-center justify-around gap-2 mb-6">
        {/* Category select */}
        <label className="flex items-center gap-2 text-sm">
          <span className="text-xs text-gray-600">Column</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-1 py-1 border rounded text-xs"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        {/* Percent range */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600">Percent</span>
          <input
            type="number"
            step="any"
            placeholder="min"
            value={percentMin}
            onChange={(e) => setPercentMin(e.target.value)}
            className="w-[3vw] px-1 py-1 border rounded text-xs"
          />
          <span className="text-xs">-</span>
          <input
            type="number"
            step="any"
            placeholder="max"
            value={percentMax}
            onChange={(e) => setPercentMax(e.target.value)}
            className="w-[3vw] px-1 py-1 border rounded text-xs"
          />
        </div>

        {/* Value range */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600">Value (MWh)</span>
          <input
            type="number"
            step="any"
            placeholder="min"
            value={valueMin}
            onChange={(e) => setValueMin(e.target.value)}
            className="w-[4vw] px-1 py-1 border rounded text-xs"
          />
          <span className="text-xs">-</span>
          <input
            type="number"
            step="any"
            placeholder="max"
            value={valueMax}
            onChange={(e) => setValueMax(e.target.value)}
            className="w-[4vw] px-1 py-1 border rounded text-xs"
          />
        </div>

        <div className="flex gap-4">
          {/* Sort metric */}
          <div className="flex items-center gap-2 ml-1">
            <span className="text-xs text-gray-600">Sort by</span>
            <select
              value={sortMetric}
              onChange={(e) => setSortMetric(e.target.value)}
              className="px-1 py-1 border rounded text-xs"
            >
              <option value="percent">Percent</option>
              <option value="value">Value</option>
            </select>
          </div>

          {/* Sort order buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSortOrder((prev) => (prev === "asc" ? null : "asc"))}
              title="Ascending"
              className={`px-2 py-1 rounded text-sm ${sortOrder === "asc" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              ▲
            </button>
            <button
              onClick={() => setSortOrder((prev) => (prev === "desc" ? null : "desc"))}
              title="Descending"
              className={`px-2 py-1 rounded text-sm ${sortOrder === "desc" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              ▼
            </button>
          </div>
        </div>    
        {/* Refresh / clear button */}
        <div>
          <button
            onClick={clearAll}
            title="Clear filters & sorting"
            className="px-2 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Table */}
      <div>
        <table className="w-full border border-gray-300 text-sm text-center">
          <thead>
            <tr className="bg-gray-100">
              <th rowSpan={2} className="border px-3 py-2">S.No</th>
              <th rowSpan={2} className="border px-3 py-2">Consumer</th>
              <th colSpan={2} className="border px-3 py-2">Peak-1 <br /><span className="text-xs text-gray-600">(6 am - 10 am)</span></th>
              <th colSpan={2} className="border px-3 py-2">Peak-2 <br /><span className="text-xs text-gray-600">(6 pm - 10 pm)</span></th>
              <th colSpan={2} className="border px-3 py-2">Normal <br /><span className="text-xs text-gray-600">(3 pm - 6 pm) &<br />(10 pm - 12 pm)</span></th>
              <th colSpan={2} className="border px-3 py-2">Off-Peak <br /><span className="text-xs text-gray-600">(12 am - 6 am) &<br />(10 am - 3 pm)</span></th>
              <th rowSpan={2} className="border px-3 py-2">Entries (days)</th>
              <th rowSpan={2} className="border px-3 py-2">Max Savings (₹)</th>
            </tr>
            <tr className="bg-gray-100">
              {["Peak-1", "Peak-2", "Normal", "Off-Peak"].map((_, i) => (
                <FragmentHeaders key={i} />
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-6 text-gray-500">No rows match the current filters.</td>
              </tr>
            ) : (
              filteredAndSortedData.map((row, idx) => (
                <tr key={idx}>
                  <td className="border px-3 py-2">{idx + 1}</td>
                  <td className="border px-3 py-2 font-medium">
                    <Link
                      to={`/consumer/${row.SCNO}`}
                      state={{
                        scno: row.SCNO,
                        short_name: row.Consumer,
                      }}
                      className="text-blue-600 font-semibold"
                    >
                      {row.Consumer} <span className="text-gray-500 text-xs">({row.SCNO})</span>
                    </Link>
                  </td>

                  {/* Peak-1 */}
                  <td className="border px-3 py-2">
                    {isNumber(row?.TariffWisePercentage?.["Peak-1"]) ? Number(row.TariffWisePercentage["Peak-1"]).toFixed(2) : "-"}%
                  </td>
                  <td className="border px-3 py-2">
                    {isNumber(row?.TariffWiseConsumption_MWh?.["Peak-1"]) ? Number(row.TariffWiseConsumption_MWh["Peak-1"]).toLocaleString() : "-"}
                  </td>

                  {/* Peak-2 */}
                  <td className="border px-3 py-2">
                    {isNumber(row?.TariffWisePercentage?.["Peak-2"]) ? Number(row.TariffWisePercentage["Peak-2"]).toFixed(2) : "-"}%
                  </td>
                  <td className="border px-3 py-2">
                    {isNumber(row?.TariffWiseConsumption_MWh?.["Peak-2"]) ? Number(row.TariffWiseConsumption_MWh["Peak-2"]).toLocaleString() : "-"}
                  </td>

                  {/* Normal */}
                  <td className="border px-3 py-2">
                    {isNumber(row?.TariffWisePercentage?.["Normal"]) ? Number(row.TariffWisePercentage["Normal"]).toFixed(2) : "-"}%
                  </td>
                  <td className="border px-3 py-2">
                    {isNumber(row?.TariffWiseConsumption_MWh?.["Normal"]) ? Number(row.TariffWiseConsumption_MWh["Normal"]).toLocaleString() : "-"}
                  </td>

                  {/* Off-Peak */}
                  <td className="border px-3 py-2">
                    {isNumber(row?.TariffWisePercentage?.["Off-Peak"]) ? Number(row.TariffWisePercentage["Off-Peak"]).toFixed(2) : "-"}%
                  </td>
                  <td className="border px-3 py-2">
                    {isNumber(row?.TariffWiseConsumption_MWh?.["Off-Peak"]) ? Number(row.TariffWiseConsumption_MWh["Off-Peak"]).toLocaleString() : "-"}
                  </td>

                  {/* Entries (Days) */}
                  <td className="border px-3 py-2">
                    {row.DaysOfData ? Number(row.DaysOfData).toFixed(0) : "-"}
                  </td>

                  {/* Max Savings */}
                  <td className="border px-3 py-2 font-semibold">
                    ₹{isNumber(row?.CostSavings) ? Number(row.CostSavings).toLocaleString() : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* Helper components & functions below */

// Small helper to render the repeated two headers for percent and value
function FragmentHeaders() {
  return (
    <>
      <th className="border px-3 py-2">%</th>
      <th className="border px-3 py-2">Value (MWh)</th>
    </>
  )
}

// Numeric guard
function isNumber(v) {
  return typeof v === "number" || (!isNaN(v) && v !== null && v !== undefined && v !== "")
}