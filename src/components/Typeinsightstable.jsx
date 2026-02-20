import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";

export default function TypeInsightsTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const hasLoadedRef = useRef(false);
  const CACHE_KEY = "typeInsightsData";
  const CACHE_TIMESTAMP_KEY = "typeInsightsDataTimestamp";
  const CACHE_EXPIRY_HOURS = 12;
  const ITEMS_PER_PAGE = 100;
  const TABLE_MAX_HEIGHT = "475px";

  // Filter & Sort State
  const [filterColumn, setFilterColumn] = useState("Days");
  const [daysMin, setDaysMin] = useState("");
  const [daysMax, setDaysMax] = useState("");
  // New sub-columns based on updated API: Flat, Shift (count), Random
  const typeSubColumns = ["Flat", "Shift", "Random"];
  const [typeMin, setTypeMin] = useState({ Flat: "", Shift: "", Random: "" });
  const [typeMax, setTypeMax] = useState({ Flat: "", Shift: "", Random: "" });
  const [sortColumn, setSortColumn] = useState("Days");
  const [sortOrder, setSortOrder] = useState(null);

  const isCacheValid = () => {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;
    const age = (Date.now() - parseInt(timestamp, 10)) / (1000 * 60 * 60);
    return age < CACHE_EXPIRY_HOURS;
  };

  const loadCachedData = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      return JSON.parse(cached);
    } catch {
      return null;
    }
  };

  // Helper: sort an array of rows by serviceNo (numeric if possible, otherwise string)
  const sortByServiceNo = (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.slice().sort((a, b) => {
      const aRaw = a?.serviceNo;
      const bRaw = b?.serviceNo;

      const aNum = Number(aRaw);
      const bNum = Number(bRaw);

      const aNumValid = !isNaN(aNum);
      const bNumValid = !isNaN(bNum);

      if (aNumValid && bNumValid) {
        return aNum - bNum;
      }

      return String(aRaw ?? "").localeCompare(String(bRaw ?? ""));
    });
  };

  const fetchAndUpdateCache = async () => {
    const res = await fetch("https://ee.elementsenergies.com/api/fetchAllConsumerConsumptionType");

    if (!res.ok) throw new Error(`Network error: ${res.status} ${res.statusText}`);

    let jsonData;
    try {
      jsonData = await res.json();
    } catch (err) {
      const text = await res.text();
      console.error("Failed to parse JSON:", text);
      throw new Error("Failed to parse API response as JSON");
    }

    // Map API shape to the component's expected shape.
    const formattedData = jsonData.map((item) => ({
      consumer: item.Consumer,
      serviceNo: item.SCNO,
      days: item.DaysOfData,
      // Use the 'shift' count for Shift Count and 'ShiftWindow' for the window string
      type: {
        Flat: item.PatternCounts?.flat ?? 0,
        Shift: item.PatternCounts?.shift ?? 0,
        Random: item.PatternCounts?.random ?? 0,
      },
      shiftWindow: item.ShiftWindow ?? "",
    }));

    // Sort by serviceNo before storing and setting state so default view is ordered
    const sorted = sortByServiceNo(formattedData);

    localStorage.setItem(CACHE_KEY, JSON.stringify(sorted));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    setData(sorted);
  };

  const fetchData = async () => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const cachedData = loadCachedData();
      if (cachedData && isCacheValid()) {
        // Ensure cached data is sorted by serviceNo before showing
        setData(sortByServiceNo(cachedData));
        setLoading(false);
        if (navigator.onLine) fetchAndUpdateCache().catch((err) => console.warn("Background update failed:", err));
        return;
      }
      await fetchAndUpdateCache();
    } catch (err) {
      console.warn("⚠️ Fetch failed:", err.message);
      const cachedData = loadCachedData();
      if (cachedData) {
        setData(sortByServiceNo(cachedData));
      } else {
        setError("Unable to fetch data. Please connect to the internet or try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const clearAll = () => {
    setFilterColumn("Days");
    setDaysMin("");
    setDaysMax("");
    setTypeMin({ Flat: "", Shift: "", Random: "" });
    setTypeMax({ Flat: "", Shift: "", Random: "" });
    setSortColumn("Days");
    setSortOrder(null);
    setCurrentPage(1);
  };

  const filteredAndSortedData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    let filtered = data.filter((row) => {
      if (filterColumn === "Days") {
        const min = daysMin !== "" ? Number(daysMin) : null;
        const max = daysMax !== "" ? Number(daysMax) : null;
        if (min !== null && row.days < min) return false;
        if (max !== null && row.days > max) return false;
      } else if (filterColumn === "Type") {
        // For Shift we filter by its count (number). ShiftWindow is text and not filterable here.
        for (let sub of typeSubColumns) {
          const min = typeMin[sub] !== "" ? Number(typeMin[sub]) : null;
          const max = typeMax[sub] !== "" ? Number(typeMax[sub]) : null;
          const val = row.type[sub];
          if (min !== null && val < min) return false;
          if (max !== null && val > max) return false;
        }
      }
      return true;
    });

    if (sortOrder) {
      filtered = filtered.slice().sort((a, b) => {
        let aVal, bVal;
        if (sortColumn === "Days") {
          aVal = a.days;
          bVal = b.days;
        } else {
          // sortColumn corresponds to a type subcolumn name (Flat | Shift | Random)
          aVal = a.type[sortColumn] ?? 0;
          bVal = b.type[sortColumn] ?? 0;
        }
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, filterColumn, daysMin, daysMax, typeMin, typeMax, sortColumn, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterColumn, daysMin, daysMax, typeMin, typeMax, sortColumn, sortOrder]);

  const getPagination = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "ellipsis", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(
          1,
          "ellipsis",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "ellipsis",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "ellipsis",
          totalPages
        );
      }
    }

    return pages;
  };

  const paginationItems = getPagination();

  if (loading) return <div className="flex justify-center items-center h-40 text-gray-500 font-poppins">Loading data...</div>;
  if (error && filteredAndSortedData.length === 0) return <div className="text-center text-red-600 p-4 bg-red-50 rounded-md shadow-sm font-poppins">{error}</div>;

  return (
    <div>
      <div className="relative bg-white p-3 rounded-lg shadow-md font-poppins">
        {isOffline && (
          <div className="bg-yellow-200 text-yellow-900 p-2 rounded mb-4 text-center">
            You are offline. Showing cached data if available.
          </div>
        )}

        {/* Filters & Sorting */}
        <div className="flex flex-wrap gap-2 mb-4 items-center justify-around">
          <label className="flex items-center gap-1 text-sm flex-shrink-0">
            Column:
            <select value={filterColumn} onChange={(e) => setFilterColumn(e.target.value)} className="border px-1 py-1 rounded text-xs">
              <option value="Days">Days</option>
              <option value="Type">Type</option>
            </select>
          </label>

          {filterColumn === "Days" && (
            <>
              <div className="flex items-center gap-1 text-sm flex-shrink-0">
                <span>Range:</span>
                <input type="number" placeholder="min" value={daysMin} onChange={(e) => setDaysMin(e.target.value)} className="w-16 border px-1 py-1 rounded text-xs" />
                <span>-</span>
                <input type="number" placeholder="max" value={daysMax} onChange={(e) => setDaysMax(e.target.value)} className="w-16 border px-1 py-1 rounded text-xs" />
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    setSortColumn("Days");
                    setSortOrder(sortOrder === "asc" ? null : "asc");
                  }}
                  className={`px-2 py-1 rounded text-sm ${sortOrder === "asc" && sortColumn === "Days" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                >
                  ▲
                </button>
                <button
                  onClick={() => {
                    setSortColumn("Days");
                    setSortOrder(sortOrder === "desc" ? null : "desc");
                  }}
                  className={`px-2 py-1 rounded text-sm ${sortOrder === "desc" && sortColumn === "Days" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                >
                  ▼
                </button>
              </div>
            </>
          )}

          {filterColumn === "Type" && (
            <>
              {typeSubColumns.map((sub) => (
                <div key={sub} className="flex items-center gap-1 text-sm flex-shrink-0">
                  <span>{sub}:</span>
                  <input
                    type="number"
                    placeholder="min"
                    value={typeMin[sub]}
                    onChange={(e) => setTypeMin({ ...typeMin, [sub]: e.target.value })}
                    className="w-16 border px-1 py-1 rounded text-xs"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="max"
                    value={typeMax[sub]}
                    onChange={(e) => setTypeMax({ ...typeMax, [sub]: e.target.value })}
                    className="w-16 border px-1 py-1 rounded text-xs"
                  />
                </div>
              ))}

              <label className="flex items-center gap-1 text-sm flex-shrink-0">
                Sort by:
                <select value={sortColumn} onChange={(e) => setSortColumn(e.target.value)} className="border px-1 py-1 rounded text-xs">
                  <option value="Days">Days</option>
                  {typeSubColumns.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setSortOrder(sortOrder === "asc" ? null : "asc")} className={`px-2 py-1 rounded text-sm ${sortOrder === "asc" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
                  ▲
                </button>
                <button onClick={() => setSortOrder(sortOrder === "desc" ? null : "desc")} className={`px-2 py-1 rounded text-sm ${sortOrder === "desc" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
                  ▼
                </button>
              </div>
            </>
          )}

          <button onClick={clearAll} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm flex-shrink-0">
            ↻
          </button>
        </div>

        {/* Table with fixed header and scrollable body */}
        {paginatedData.length > 0 && (
          <div className="bg-white shadow-lg rounded-md border overflow-hidden">
            {/* Fixed height scroll container */}
            <div style={{ maxHeight: TABLE_MAX_HEIGHT }} className="overflow-y-auto overflow-x-auto">
              <table className="w-full border-collapse text-sm text-center">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th rowSpan={2} className="border px-3 py-2 align-middle">
                      S No
                    </th>
                    <th rowSpan={2} className="border px-3 py-2 align-middle">
                      Consumer
                    </th>
                    <th rowSpan={2} className="border px-3 py-2 align-middle">
                      Days
                    </th>

                    {/* Flat stays as a single column */}
                    <th rowSpan={2} className="border px-3 py-2 align-middle">
                      Flat
                    </th>

                    {/* Shift parent header with two subheaders: Count and Window */}
                    <th colSpan={2} className="border px-3 py-2">
                      Shift
                    </th>

                    {/* Random as single column */}
                    <th rowSpan={2} className="border px-3 py-2 align-middle">
                      Random
                    </th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="border px-3 py-2">Count</th>
                    <th className="border px-3 py-2">Window</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 border-b">
                      <td className="border px-3 py-2">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>

                      <td className="border px-3 py-2 font-medium">
                        <Link
                          to={`/consumer/${row.serviceNo}`}
                          state={{
                            scno: row.serviceNo,
                            short_name: row.consumer,
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                        >
                          {row.consumer}
                        </Link>{" "}
                        <span className="text-gray-500 text-xs">({row.serviceNo})</span>
                      </td>

                      <td className="border px-3 py-2">{row.days}</td>

                      {/* Flat */}
                      <td className="border px-3 py-2">{row.type.Flat}</td>

                      {/* Shift Count */}
                      <td className="border px-3 py-2">{row.type.Shift}</td>

                      {/* Shift Window */}
                      <td className="border px-3 py-2">{row.shiftWindow || "-"}</td>

                      {/* Random */}
                      <td className="border px-3 py-2">{row.type.Random}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {paginatedData.length === 0 && !loading && (
          <div className="py-6 text-gray-500 text-center">No rows match the current filters.</div>
        )}
      </div>

      {/* Pagination outside the container */}
      {paginatedData.length > 0 && (
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
      )}
    </div>
  );
}