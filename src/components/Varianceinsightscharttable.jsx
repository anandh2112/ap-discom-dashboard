import { useEffect, useState } from "react";

export default function VarianceInsightsChartTable({ viewMode, subViewMode, selectedDate }) {
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Map subViewMode to API subcat values
  const subViewMap = {
    All: "all",
    "M-F": "mf",
    Sat: "sat",
    Sun: "sun",
  };

  // Build API URL dynamically
  const getApiUrl = () => {
    const baseUrl = "https://ee.elementsenergies.com/api/fetchHighLowAvgChartTable";

    const categoryMap = {
      All: "all",
      Year: "year",
      Month: "month",
    };

    const category = categoryMap[viewMode];
    const subcat = subViewMap[subViewMode] || "all";

    if (!category) return null;

    let url = `${baseUrl}?category=${category}&subcat=${subcat}`;

    if (viewMode === "Year") {
      const year = selectedDate
        ? new Date(selectedDate).getFullYear()
        : new Date().getFullYear();
      url += `&date=${year}`;
    }

    if (viewMode === "Month") {
      const month = selectedDate
        ? new Date(selectedDate).toISOString().slice(0, 7)
        : new Date().toISOString().slice(0, 7);
      url += `&date=${month}`;
    }

    return url;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = getApiUrl();
        if (!url) return;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch data");

        const data = await res.json();
        setTableData(data);
      } catch (err) {
        console.error("Table fetch error:", err);
        setTableData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [viewMode, subViewMode, selectedDate]);

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
              <td className="border px-2 py-1 font-medium">
                Average Upward Variance
              </td>
              <td className="border px-2 py-1">
                {increase.highest !== undefined ? `${increase.highest}%` : "-"}
              </td>
              <td className="border px-2 py-1">
                {increase.lowest !== undefined ? `${increase.lowest}%` : "-"}
              </td>
              <td className="border px-2 py-1">
                {increase.average !== undefined ? `${increase.average}%` : "-"}
              </td>
            </tr>

            <tr>
              <td className="border px-2 py-1 font-medium">
                Average Downward Variance
              </td>
              <td className="border px-2 py-1">
                {decrease.highest !== undefined ? `${decrease.highest}%` : "-"}
              </td>
              <td className="border px-2 py-1">
                {decrease.lowest !== undefined ? `${decrease.lowest}%` : "-"}
              </td>
              <td className="border px-2 py-1">
                {decrease.average !== undefined ? `${decrease.average}%` : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}