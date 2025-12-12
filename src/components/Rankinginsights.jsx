import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Ranking() {
  // Added "All" option
  const groupOptions = ["All", "Random", "Day", "Night", "Flat"];

  // Default = random
  const [groupType, setGroupType] = useState("all");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // ----------- API URL LOGIC ------------
        const url =
          groupType === "all"
            ? `https://ee.elementsenergies.com/api/fetchRank`
            : `https://ee.elementsenergies.com/api/fetchRank/?type=${groupType}`;

        const response = await fetch(url);
        const result = await response.json();

        const transformed = result.map((item) => ({
          rank: item.rank,
          consumer: item.short_name,
          serviceNo: item.scno,
          metricScore: Number(item.metric_score.toFixed(4)),
          type: item.type, // include type only for All
        }));

        setData(transformed);
      } catch (error) {
        console.error("Error fetching ranking data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupType]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40 text-gray-500 font-poppins">
        Loading data...
      </div>
    );

  return (
    <div className="font-poppins p-2">
      {/* Header with Toggle */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Ranking Insights</h1>

        <div className="flex items-center gap-1">
          {groupOptions.map((mode) => {
            const lower = mode.toLowerCase();

            return (
              <button
                key={mode}
                onClick={() => setGroupType(lower)}
                className={`px-3 py-1 text-sm font-semibold rounded-lg border transition-colors hover:cursor-pointer ${
                  groupType === lower
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg shadow-md">
        <table className="w-full border border-gray-300 text-sm text-center mt-2">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2">Rank</th>
              <th className="border px-3 py-2">Consumer</th>
              <th className="border px-3 py-2">Metric Score</th>

              {/* Only show "Type" column when All is selected */}
              {groupType === "all" && (
                <th className="border px-3 py-2">Type</th>
              )}
            </tr>
          </thead>

          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td className="border px-3 py-2">{row.rank}</td>

                <td className="border px-3 py-2 font-medium">
                  <Link
                    to={`/consumer/${row.serviceNo}`}
                    state={{ scno: row.serviceNo, short_name: row.consumer }}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                  >
                    {row.consumer}
                  </Link>
                  <span className="text-gray-500 text-xs"> ({row.serviceNo})</span>
                </td>

                <td className="border px-3 py-2">{row.metricScore}</td>

                {/* Show type only for All */}
                {groupType === "all" && (
                  <td className="border px-3 py-2 capitalize">{row.type}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}