import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

const CACHE_KEY_BASE = "varianceTableCache"
const CACHE_EXPIRY_HOURS = 12

// Map subViewMode to the subcat parameter values
const SUBKEY_MAP = {
  "All": "All",
  "M-F": "MF",
  "Mon-Fri": "MF",
  "Sat": "Sat",
  "Sun": "Sun",
}

export default function VarianceTable({ viewMode, subViewMode, selectedDate }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // Filter / sort state (these are local to the table and different from parent viewMode)
  const viewOptions = ["Average", "Average Peak", "Average Low"]
  const categoryOptions = ["any", "very_low", "low", "medium", "high", "very_high"]

  const [view, setView] = useState(viewOptions[0]) // Average | Average Peak | Average Low

  // Average filters
  const [avgMin, setAvgMin] = useState("")
  const [avgMax, setAvgMax] = useState("")

  // Peak/Low filters
  const [hourMin, setHourMin] = useState("") // hours 00-23
  const [hourMax, setHourMax] = useState("")
  const [valMin, setValMin] = useState("")
  const [valMax, setValMax] = useState("")
  const [pctMin, setPctMin] = useState("")
  const [pctMax, setPctMax] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("any")

  // Sorting
  const [sortMetric, setSortMetric] = useState("average")
  const [sortOrder, setSortOrder] = useState(null) // 'asc' | 'desc' | null

  const clearAll = () => {
    setView(viewOptions[0])
    setAvgMin("")
    setAvgMax("")
    setHourMin("")
    setHourMax("")
    setValMin("")
    setValMax("")
    setPctMin("")
    setPctMax("")
    setCategoryFilter("any")
    setSortMetric("average")
    setSortOrder(null)
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build the correct endpoint URL based on parent viewMode and selectedDate
  function buildUrlAndCacheKey() {
    const now = new Date()
    const defaultDate = now.toISOString().slice(0, 10) // YYYY-MM-DD
    const sel = selectedDate || defaultDate

    let category = "all"
    let dateParam = ""
    const baseUrl = "https://ee.elementsenergies.com/api/fetchHighLowAvgMFSTSD"

    if (String(viewMode).toLowerCase() === "year") {
      category = "year"
      const year = String(sel).split("-")[0] || String(now.getFullYear())
      dateParam = `&date=${encodeURIComponent(year)}`
    } else if (String(viewMode).toLowerCase() === "month") {
      category = "month"
      const parts = String(sel).split("-")
      const month = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : now.toISOString().slice(0, 7)
      dateParam = `&date=${encodeURIComponent(month)}`
    }

    const subcat = SUBKEY_MAP[subViewMode] ?? "All"
    const url = `${baseUrl}?category=${category}&subcat=${subcat}${dateParam}`
    const cacheKey = `${CACHE_KEY_BASE}:${url}`

    return { url, cacheKey }
  }

  // Helper: sort array of formatted rows by serviceNo (numeric if possible, otherwise string)
  const sortByServiceNo = (arr) => {
    if (!Array.isArray(arr)) return arr
    return arr.slice().sort((a, b) => {
      const aRaw = a?.serviceNo ?? a?.SCNO ?? ""
      const bRaw = b?.serviceNo ?? b?.SCNO ?? ""

      const aNum = Number(aRaw)
      const bNum = Number(bRaw)

      const aNumValid = !Number.isNaN(aNum)
      const bNumValid = !Number.isNaN(bNum)

      if (aNumValid && bNumValid) {
        return aNum - bNum
      }

      return String(aRaw).localeCompare(String(bRaw))
    })
  }

  // Fetch data with caching (based on endpoint built above)
  async function fetchData() {
    setLoading(true)
    setError(null)

    const { url, cacheKey } = buildUrlAndCacheKey()

    try {
      const cachedRaw = localStorage.getItem(cacheKey)
      if (cachedRaw) {
        try {
          const parsed = JSON.parse(cachedRaw)
          const now = Date.now()
          if (now - parsed.timestamp < CACHE_EXPIRY_HOURS * 3600 * 1000) {
            // Ensure cached data is sorted by serviceNo before showing
            setData(sortByServiceNo(parsed.data))
            setLoading(false)
            return
          }
        } catch (err) {
          // ignore and refetch
        }
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch data (${res.status})`)
      const result = await res.json()

      const formatted = (result || []).map((row) => ({
        consumer: row.Consumer ?? "-",
        serviceNo: row.SCNO ?? "-",
        subcategory: row.Subcategory ?? "-",
        // Store the data object directly
        data: row.Data ?? {},
      }))

      // Sort by serviceNo before setting state and caching so default view is ordered
      const sorted = sortByServiceNo(formatted)

      setData(sorted)
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: sorted }))
      } catch (e) {
        // ignore localStorage write failures (e.g., storage full)
      }
    } catch (err) {
      setError(err.message ?? String(err))
      // Try to fallback to cache if available (any cache for this URL)
      const cached = localStorage.getItem(buildUrlAndCacheKey().cacheKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          setData(sortByServiceNo(parsed.data))
        } catch (e) {
          // ignore
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and refetch when the parent timescale or selectedDate changes
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedDate, subViewMode])

  // Update sortMetric defaults when local "view" (Average / Average Peak / Low) changes
  useEffect(() => {
    if (view === "Average") {
      setSortMetric("average")
    } else {
      // only set to "value" if current metric is "average" or invalid for Peak/Low
      setSortMetric((prev) => {
        const peakLowAllowed = ["hour", "value", "percent", "category"]
        if (prev === "average" || !peakLowAllowed.includes(prev)) {
          return "value"
        }
        return prev
      })
    }
  }, [view])

  // Helper to convert hour strings like "00","1","01:00" into number 0-23 or null
  function normalizeHour(h) {
    if (h === null || h === undefined) return null
    const s = String(h).trim()
    const parts = s.split(":")
    const raw = parts[0]
    const asNum = Number(raw)
    if (!Number.isFinite(asNum) || asNum < 0 || asNum > 23) return null
    return Math.floor(asNum)
  }

  // Numeric guard
  function toNumberSafe(v) {
    if (v === null || v === undefined || v === "") return null
    if (typeof v === "number") {
      return Number.isFinite(v) ? v : null
    }
    const cleaned = String(v).trim()
    if (cleaned.includes(":")) {
      const parts = cleaned.split(":")
      const raw = parts[0]
      const asNum = Number(raw)
      return Number.isFinite(asNum) ? Math.floor(asNum) : null
    }
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : null
  }

  const categoryRank = {
    very_low: 0,
    low: 1,
    medium: 2,
    high: 3,
    very_high: 4,
  }

  // Given a formatted row, extract and normalize the structure used by filtering/sorting/rendering
  function normalizeRow(row) {
    const dataObj = row.data ?? {}
    const high = dataObj?.high ?? {}
    const low = dataObj?.low ?? {}
    const avg = dataObj?.average ?? {}

    return {
      consumer: row.consumer,
      serviceNo: row.serviceNo,
      average: avg?.consumption ?? null,
      peak: {
        hour: normalizeHour(high?.hour ?? null) ?? (high?.hour ?? null),
        value: high?.avg_consumption ?? null,
        percentValue:
          high?.percent_increase_from_avg != null
            ? high.percent_increase_from_avg
            : null,
        percent:
          high?.percent_increase_from_avg != null
            ? `${high.percent_increase_from_avg.toFixed(2)}%`
            : null,
        category: (high?.category ?? "-").toString().toLowerCase(),
      },
      low: {
        hour: normalizeHour(low?.hour ?? null) ?? (low?.hour ?? null),
        value: low?.avg_consumption ?? null,
        percentValue:
          low?.percent_decrease_from_avg != null
            ? low.percent_decrease_from_avg
            : null,
        percent:
          low?.percent_decrease_from_avg != null
            ? `-${low.percent_decrease_from_avg.toFixed(2)}%`
            : null,
        category: (low?.category ?? "-").toString().toLowerCase(),
      },
    }
  }

  // Filtering and sorting
  const filteredAndSortedData = useMemo(() => {
    if (!Array.isArray(data)) return []

    const avgMinN = toNumberSafe(avgMin)
    const avgMaxN = toNumberSafe(avgMax)

    const hMin = toNumberSafe(hourMin)
    const hMax = toNumberSafe(hourMax)

    const vMin = toNumberSafe(valMin)
    const vMax = toNumberSafe(valMax)

    const pMin = toNumberSafe(pctMin)
    const pMax = toNumberSafe(pctMax)

    const categorySel = categoryFilter === "any" ? null : categoryFilter

    const passesFilters = (rawRow) => {
      const row = normalizeRow(rawRow)

      if (view === "Average") {
        if (avgMinN !== null) {
          if (row.average === null || row.average === undefined || Number(row.average) < avgMinN) return false
        }
        if (avgMaxN !== null) {
          if (row.average === null || row.average === undefined || Number(row.average) > avgMaxN) return false
        }
        return true
      } else {
        const side = view === "Average Peak" ? "peak" : "low"

        // Hour
        const hourVal = toNumberSafe(row[side]?.hour)
        if (hMin !== null) {
          if (hourVal === null || hourVal < hMin) return false
        }
        if (hMax !== null) {
          if (hourVal === null || hourVal > hMax) return false
        }

        // Value
        const valueVal = toNumberSafe(row[side]?.value)
        if (vMin !== null) {
          if (valueVal === null || valueVal < vMin) return false
        }
        if (vMax !== null) {
          if (valueVal === null || valueVal > vMax) return false
        }

        // Percent (note: peak.percentValue is positive increase, low.percentValue is decrease number)
        const percentVal = toNumberSafe(row[side]?.percentValue)
        if (pMin !== null) {
          if (percentVal === null || percentVal < pMin) return false
        }
        if (pMax !== null) {
          if (percentVal === null || percentVal > pMax) return false
        }

        // Category
        if (categorySel) {
          const cat = (row[side]?.category ?? "").toString().toLowerCase()
          if (cat !== categorySel) return false
        }

        return true
      }
    }

    let result = data.filter(passesFilters).map((r) => normalizeRow(r))

    // Sorting
    if (sortOrder && sortMetric) {
      const metric = sortMetric
      result = result.slice().sort((a, b) => {
        let aVal, bVal

        if (view === "Average") {
          aVal = toNumberSafe(a.average)
          bVal = toNumberSafe(b.average)
        } else {
          const side = view === "Average Peak" ? "peak" : "low"
          if (metric === "hour") {
            aVal = toNumberSafe(a[side]?.hour)
            bVal = toNumberSafe(b[side]?.hour)
          } else if (metric === "value") {
            aVal = toNumberSafe(a[side]?.value)
            bVal = toNumberSafe(b[side]?.value)
          } else if (metric === "percent") {
            aVal = toNumberSafe(a[side]?.percentValue)
            bVal = toNumberSafe(b[side]?.percentValue)
          } else if (metric === "category") {
            const aCat = (a[side]?.category ?? "").toString().toLowerCase()
            const bCat = (b[side]?.category ?? "").toString().toLowerCase()
            const aRank = categoryRank[aCat] ?? 999
            const bRank = categoryRank[bCat] ?? 999
            aVal = aRank
            bVal = bRank
          } else {
            aVal = null
            bVal = null
          }
        }

        const aIsNull = aVal === null || aVal === undefined || Number.isNaN(aVal)
        const bIsNull = bVal === null || bVal === undefined || Number.isNaN(bVal)

        if (aIsNull && bIsNull) return 0
        if (aIsNull) return 1
        if (bIsNull) return -1

        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [
    data,
    view,
    avgMin,
    avgMax,
    hourMin,
    hourMax,
    valMin,
    valMax,
    pctMin,
    pctMax,
    categoryFilter,
    sortMetric,
    sortOrder,
  ])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-gray-500">Loading data...</p>
      </div>
    )
  }

  if (error && filteredAndSortedData.length === 0) {
    return (
      <div className="text-center text-red-600 p-4 bg-red-50 rounded-md shadow-sm">
        {error}
      </div>
    )
  }

  return (
    <div className=" bg-white p-3 rounded-lg shadow-md">
      {isOffline && (
        <div className="bg-yellow-200 text-yellow-900 p-2 rounded mb-4 text-center">
          You are offline. Showing cached data if available.
        </div>
      )}

      {/* Filters & Sort (single row, same style) */}
      <div className="flex flex-nowrap items-center justify-around mb-6">
        {/* View select */}
        <label className="flex items-center gap-2 text-sm">
          <span className="text-xs text-gray-600">Col.</span>
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="px-1 py-1 border rounded text-xs"
          >
            {viewOptions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>

        {/* Average filters (visible when Average is selected) */}
        {view === "Average" && (
          <>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600">Average (kWh)</span>
              <input
                type="number"
                step="any"
                placeholder="min"
                value={avgMin}
                onChange={(e) => setAvgMin(e.target.value)}
                className="w-20 px-1 py-1 border rounded text-xs"
              />
              <span className="text-xs">-</span>
              <input
                type="number"
                step="any"
                placeholder="max"
                value={avgMax}
                onChange={(e) => setAvgMax(e.target.value)}
                className="w-20 px-1 py-1 border rounded text-xs"
              />
            </div>

            {/* Sort for Average */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600">Sort by</span>
              <select
                value={sortMetric}
                onChange={(e) => setSortMetric(e.target.value)}
                className="px-1 py-1 border rounded text-xs"
              >
                <option value="average">Average</option>
              </select>
            </div>

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
          </>
        )}

        {/* Peak/Low filters (visible when Average Peak or Average Low is selected) */}
        {(view === "Average Peak" || view === "Average Low") && (
          <>
            {/* Hour range */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600">Hour</span>
              <input
                type="number"
                min={0}
                max={23}
                placeholder="min"
                value={hourMin}
                onChange={(e) => setHourMin(e.target.value)}
                className="w-[3vw] px-1 py-1 border rounded text-xs"
              />
              <span className="text-xs">-</span>
              <input
                type="number"
                min={0}
                max={23}
                placeholder="max"
                value={hourMax}
                onChange={(e) => setHourMax(e.target.value)}
                className="w-[3vw] px-1 py-1 border rounded text-xs"
              />
            </div>

            {/* Value range */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600">Value</span>
              <input
                type="number"
                step="any"
                placeholder="min"
                value={valMin}
                onChange={(e) => setValMin(e.target.value)}
                className="w-[4vw] px-1 py-1 border rounded text-xs"
              />
              <span className="text-xs">-</span>
              <input
                type="number"
                step="any"
                placeholder="max"
                value={valMax}
                onChange={(e) => setValMax(e.target.value)}
                className="w-[4vw] px-1 py-1 border rounded text-xs"
              />
            </div>

            {/* Percent range */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600">%</span>
              <input
                type="number"
                step="any"
                placeholder="min"
                value={pctMin}
                onChange={(e) => setPctMin(e.target.value)}
                className="w-[3vw] px-1 py-1 border rounded text-xs"
              />
              <span className="text-xs">-</span>
              <input
                type="number"
                step="any"
                placeholder="max"
                value={pctMax}
                onChange={(e) => setPctMax(e.target.value)}
                className="w-[3vw] px-1 py-1 border rounded text-xs"
              />
            </div>

            {/* Category dropdown */}
            <label className="flex items-center gap-1 text-xs">
              <span className="text-xs text-gray-600">Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-1 py-1 border rounded text-xs"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c.replace("_", " ")}</option>
                ))}
              </select>
            </label>

            {/* Sort controls for Peak/Low */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Sort by</span>
              <select
                value={sortMetric}
                onChange={(e) => setSortMetric(e.target.value)}
                className="px-1 py-1 border rounded text-xs"
              >
                <option value="hour">Hour</option>
                <option value="value">Value</option>
                <option value="percent">%</option>
                <option value="category">Category</option>
              </select>
            </div>

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
          </>
        )}

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
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-sm text-center">
          <thead>
            <tr className="bg-gray-100">
              <th rowSpan={2} className="border px-3 py-2 align-middle">S.No</th>
              <th rowSpan={2} className="border px-3 py-2 align-middle">Consumer</th>
              <th rowSpan={2} className="border px-3 py-2 align-middle">
                Average <br />(kWh)
              </th>
              <th colSpan={4} className="border px-3 py-2">Average Peak <span className="text-green-600">▲</span></th>
              <th colSpan={4} className="border px-3 py-2">Average Low <span className="text-red-600">▼</span></th>
            </tr>
            <tr className="bg-gray-100">
              {["Peak", "Low"].map((type) => (
                <React.Fragment key={type}>
                  <th className="border px-3 py-2">Hour</th>
                  <th className="border px-3 py-2">Value <br />(kWh)</th>
                  <th className="border px-3 py-2">% </th>
                  <th className="border px-3 py-2">Category</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-6 text-gray-500">No rows match the current filters.</td>
              </tr>
            ) : (
              filteredAndSortedData.map((row, i) => {
                const peakVal = row.peak.percentValue ?? 0
                const lowVal = row.low.percentValue ?? 0
                const highlightPeak = peakVal > lowVal
                const highlightLow = lowVal > peakVal

                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{i + 1}</td>
                    <td className="border px-3 py-2 font-medium">
                      <Link
                        to={`/consumer/${row.serviceNo}`}
                        state={{ scno: row.serviceNo, short_name: row.consumer }}
                        className="text-blue-600 font-semibold"
                      >
                        {row.consumer} <span className="text-gray-500 text-xs">({row.serviceNo})</span>
                      </Link>
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}