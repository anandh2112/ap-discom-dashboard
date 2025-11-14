import { useEffect, useState } from "react";

export default function VarianceInsightsChartTable({ viewMode, subViewMode, selectedDate }) {
  const [fetchedData, setFetchedData] = useState(null); // store full API response
  const [tableData, setTableData] = useState(null); // store data for current subViewMode
  const [loading, setLoading] = useState(false);

  // Map subViewMode to API keys
  const subViewMap = {
    All: "All",
    "M-F": "Mon-Fri",
    Sat: "Sat",
    Sun: "Sun",
  };

  // Get API URL based on viewMode and selectedDate
  const getApiUrl = () => {
    if (viewMode === "All") {
      return "https://ee.elementsenergies.com/api/fetchAllHighLowAvgChartTableMFSTSD";
    }
    if (viewMode === "Year") {
      const year = selectedDate ? new Date(selectedDate).getFullYear() : new Date().getFullYear();
      return `https://ee.elementsenergies.com/api/fetchYearlyHighLowAvgChartTableMFSTSD?year=${year}`;
    }
    if (viewMode === "Month") {
      const month = selectedDate ? new Date(selectedDate).toISOString().slice(0, 7) : new Date().toISOString().slice(0, 7);
      return `https://ee.elementsenergies.com/api/fetchMonthlyHighLowAvgChartTableMFSTSD?month=${month}`;
    }
    return null;
  };

  // Fetch data whenever viewMode or selectedDate changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = getApiUrl();
        if (!url) return;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch data");

        const data = await res.json();
        setFetchedData(data);

        // Immediately set tableData for current subViewMode
        const key = subViewMap[subViewMode] || "All";
        setTableData(data[key]);
      } catch (err) {
        console.error("Table fetch error:", err);
        setFetchedData(null);
        setTableData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [viewMode, selectedDate]);

  // Update tableData whenever subViewMode changes
  useEffect(() => {
    if (!fetchedData) return;
    const key = subViewMap[subViewMode] || "All";
    setTableData(fetchedData[key]);
  }, [subViewMode, fetchedData]);

  const increase = tableData?.percentIncreaseStats || {};
  const decrease = tableData?.percentDecreaseStats || {};

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {loading ? (
        <div className="p-4">Loading...</div>
      ) : (
        <table className="w-full text-sm text-center border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Average Consumption</th>
              <th className="border px-2 py-1">Highest Variance</th>
              <th className="border px-2 py-1">Lowest Variance</th>
              <th className="border px-2 py-1">Average</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="border px-2 py-1 font-medium">Average Upward Variance</td>
              <td className="border px-2 py-1">{increase.highest ?? "-" }%</td>
              <td className="border px-2 py-1">{increase.lowest ?? "-" }%</td>
              <td className="border px-2 py-1">{increase.average ?? "-" }%</td>
            </tr>

            <tr>
              <td className="border px-2 py-1 font-medium">Average Downward Variance</td>
              <td className="border px-2 py-1">{decrease.highest ?? "-" }%</td>
              <td className="border px-2 py-1">{decrease.lowest ?? "-" }%</td>
              <td className="border px-2 py-1">{decrease.average ?? "-" }%</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}