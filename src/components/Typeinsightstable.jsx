import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";

export default function TypeInsightsTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [error, setError] = useState(null);

  const hasLoadedRef = useRef(false);
  const CACHE_KEY = "typeInsightsData";
  const CACHE_TIMESTAMP_KEY = "typeInsightsDataTimestamp";
  const CACHE_EXPIRY_HOURS = 12;

  // Filter & Sort State
  const [filterColumn, setFilterColumn] = useState("Days");
  const [daysMin, setDaysMin] = useState("");
  const [daysMax, setDaysMax] = useState("");
  const typeSubColumns = ["Flat", "Morning", "Night", "Others"];
  const [typeMin, setTypeMin] = useState({ Flat: "", Morning: "", Night: "", Others: "" });
  const [typeMax, setTypeMax] = useState({ Flat: "", Morning: "", Night: "", Others: "" });
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

    const formattedData = jsonData.map((item) => ({
      consumer: item.Consumer,
      serviceNo: item.SCNO,
      days: item.DaysOfData,
      type: {
        Flat: item.PatternCounts.flat,
        Morning: item.PatternCounts.day,
        Night: item.PatternCounts.night,
        Others: item.PatternCounts.random,
      },
    }));

    localStorage.setItem(CACHE_KEY, JSON.stringify(formattedData));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    setData(formattedData);
  };

  const fetchData = async () => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const cachedData = loadCachedData();
      if (cachedData && isCacheValid()) {
        setData(cachedData);
        setLoading(false);
        if (navigator.onLine) fetchAndUpdateCache().catch(err => console.warn("Background update failed:", err));
        return;
      }
      await fetchAndUpdateCache();
    } catch (err) {
      console.warn("⚠️ Fetch failed:", err.message);
      const cachedData = loadCachedData();
      if (cachedData) {
        setData(cachedData);
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
    setTypeMin({ Flat: "", Morning: "", Night: "", Others: "" });
    setTypeMax({ Flat: "", Morning: "", Night: "", Others: "" });
    setSortColumn("Days");
    setSortOrder(null);
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
          aVal = a.type[sortColumn];
          bVal = b.type[sortColumn];
        }
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, filterColumn, daysMin, daysMax, typeMin, typeMax, sortColumn, sortOrder]);

  if (loading) return <div className="flex justify-center items-center h-40 text-gray-500 font-poppins">Loading data...</div>;
  if (error) return <div className="text-center text-red-600 p-4 bg-red-50 rounded-md shadow-sm font-poppins">{error}</div>;

  return (
    <div className="relative bg-white p-3 rounded-lg shadow-md font-poppins">

      {/* Filters & Sorting */}
      <div className="flex flex-wrap gap-2 mb-4 items-center justify-around">
        <label className="flex items-center gap-1 text-sm">
          Column:
          <select value={filterColumn} onChange={(e) => setFilterColumn(e.target.value)} className="border px-1 py-1 rounded text-xs">
            <option value="Days">Days</option>
            <option value="Type">Type</option>
          </select>
        </label>

        {filterColumn === "Days" && (
          <>
            <div className="flex items-center gap-1 text-sm">
              <span>Range:</span>
              <input type="number" placeholder="min" value={daysMin} onChange={(e) => setDaysMin(e.target.value)} className="w-16 border px-1 py-1 rounded text-xs" />
              <span>-</span>
              <input type="number" placeholder="max" value={daysMax} onChange={(e) => setDaysMax(e.target.value)} className="w-16 border px-1 py-1 rounded text-xs" />
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setSortColumn("Days"); setSortOrder(sortOrder === "asc" ? null : "asc"); }} className={`px-2 py-1 rounded text-sm ${sortOrder === "asc" && sortColumn === "Days" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>▲</button>
              <button onClick={() => { setSortColumn("Days"); setSortOrder(sortOrder === "desc" ? null : "desc"); }} className={`px-2 py-1 rounded text-sm ${sortOrder === "desc" && sortColumn === "Days" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>▼</button>
            </div>
          </>
        )}

        {filterColumn === "Type" && (
          <>
            {typeSubColumns.map((sub) => (
              <div key={sub} className="flex items-center gap-1 text-sm">
                <span>{sub}:</span>
                <input type="number" placeholder="min" value={typeMin[sub]} onChange={(e) => setTypeMin({...typeMin, [sub]: e.target.value})} className="w-16 border px-1 py-1 rounded text-xs" />
                <span>-</span>
                <input type="number" placeholder="max" value={typeMax[sub]} onChange={(e) => setTypeMax({...typeMax, [sub]: e.target.value})} className="w-16 border px-1 py-1 rounded text-xs" />
              </div>
            ))}

            <label className="flex items-center gap-1 text-sm">
              Sort by:
              <select value={sortColumn} onChange={(e) => setSortColumn(e.target.value)} className="border px-1 py-1 rounded text-xs">
                {typeSubColumns.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </label>

            <div className="flex gap-1">
              <button onClick={() => setSortOrder(sortOrder === "asc" ? null : "asc")} className={`px-2 py-1 rounded text-sm ${sortOrder === "asc" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>▲</button>
              <button onClick={() => setSortOrder(sortOrder === "desc" ? null : "desc")} className={`px-2 py-1 rounded text-sm ${sortOrder === "desc" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>▼</button>
            </div>
          </>
        )}

        <button onClick={clearAll} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm">↻</button>
      </div>

      {isOffline && (
        <div className="bg-yellow-200 text-yellow-900 text-center py-2 text-sm font-medium rounded-t-md">
          ⚠️ You are offline — showing cached data
        </div>
      )}

      <table className="w-full border border-gray-300 text-sm text-center mt-2">
        <thead>
          <tr className="bg-gray-100">
            <th rowSpan={2} className="border px-3 py-2">S No</th>
            <th rowSpan={2} className="border px-3 py-2">Consumer</th>
            <th rowSpan={2} className="border px-3 py-2">Days</th>
            <th colSpan={4} className="border px-3 py-2">Type</th>
          </tr>
          <tr className="bg-gray-100">
            {typeSubColumns.map((sub) => <th key={sub} className="border px-3 py-2">{sub}</th>)}
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedData.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-6 text-gray-500">No data available.</td>
            </tr>
          ) : (
            filteredAndSortedData.map((row, idx) => (
              <tr key={idx}>
                <td className="border px-3 py-2">{idx + 1}</td>

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
                  </Link>
                  {" "}
                  <span className="text-gray-500 text-xs">({row.serviceNo})</span>
                </td>

                <td className="border px-3 py-2">{row.days}</td>
                {typeSubColumns.map((sub) => (
                  <td key={sub} className="border px-3 py-2">{row.type[sub]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}