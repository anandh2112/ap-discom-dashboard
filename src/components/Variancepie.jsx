import { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function VariancePie() {
  const [peakData, setPeakData] = useState([]);
  const [lowData, setLowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Cache key and expiry duration
  const CACHE_KEY = "varianceChartData";
  const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

  // Function to map fetched data into Highcharts format with custom labels
  const mapDataWithLabels = (dataObj, labels) => {
    const keys = Object.keys(dataObj);
    return keys.map((key, index) => ({
      name: labels[index] || key,
      y: dataObj[key],
    }));
  };

  // Listen for online/offline events
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
    const fetchVarianceData = async () => {
      try {
        // Check cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { timestamp, data } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            // Cache still valid
            setPeakData(data.peakData);
            setLowData(data.lowData);
            setLoading(false);
            return;
          }
        }

        // If offline and no valid cache, show error
        if (!navigator.onLine) {
          if (cached) {
            const { data } = JSON.parse(cached);
            setPeakData(data.peakData);
            setLowData(data.lowData);
            setLoading(false);
            return;
          } else {
            throw new Error("Offline and no cached data available");
          }
        }

        // Fetch from API
        const response = await fetch(
          "https://ee.elementsenergies.com/api/fetchAllHighLowAvgChart"
        );
        const jsonData = await response.json();

        const increaseData = jsonData.percent_increase_from_avg || {};
        const decreaseData = jsonData.percent_decrease_from_avg || {};

        const labels = ["Very Low", "Low", "Medium", "High", "Very High"];

        const peak = mapDataWithLabels(increaseData, labels);
        const low = mapDataWithLabels(decreaseData, labels);

        setPeakData(peak);
        setLowData(low);

        // Store in cache
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            data: { peakData: peak, lowData: low },
          })
        );

        setLoading(false);
      } catch (err) {
        console.error("Error fetching variance data:", err);
        setError("Failed to load chart data");
        setLoading(false);
      }
    };

    fetchVarianceData();
  }, []);

  const createOptions = (title, data) => ({
    chart: { type: "pie" },
    title: { text: title, style: { fontSize: "14px" } },
    tooltip: {
      pointFormat: "<b>{point.y}</b> counts ({point.percentage:.1f}%)",
      backgroundColor: "rgba(255,255,255,0.95)",
      borderColor: "#ccc",
      style: { color: "#333", fontSize: "12px" },
    },
    series: [
      {
        name: "Variance %",
        data,
      },
    ],
    credits: { enabled: false },
    legend: { enabled: false },
    plotOptions: {
      pie: {
        dataLabels: { enabled: false },
        showInLegend: false,
        connectorWidth: 0,
      },
    },
  });

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-6">Loading charts...</div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-6">{error}</div>;
  }

  return (
    <div className="w-full flex flex-col gap-4 relative">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-yellow-200 text-yellow-800 text-center py-2 text-sm font-medium rounded-md shadow-sm">
          ⚠️ You are offline — showing cached data (if available)
        </div>
      )}

      {/* Row of Pie Charts */}
      <div className="flex flex-col md:flex-row gap-4 mt-2">
        <div className="w-full md:w-1/2 bg-white p-4 rounded-lg shadow-md">
          <HighchartsReact
            highcharts={Highcharts}
            options={createOptions("Upward Variance", peakData)}
          />
        </div>
        <div className="w-full md:w-1/2 bg-white p-4 rounded-lg shadow-md">
          <HighchartsReact
            highcharts={Highcharts}
            options={createOptions("Downward Variance", lowData)}
          />
        </div>
      </div>

      {/* Summary Table Below Charts */}
      {/* <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-center font-semibold text-gray-700 mb-3 text-sm">
          Variance Summary
        </h3>
        <table className="w-full text-sm text-center border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Average Consumption</th>
              <th className="border px-2 py-1">Highest Variance</th>
              <th className="border px-2 py-1">Lowest Variance</th>
              <th className="border px-2 py-1">Median</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-1 font-medium">Average Peak</td>
              <td className="border px-2 py-1">70%</td>
              <td className="border px-2 py-1">30%</td>
              <td className="border px-2 py-1">55%</td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-medium">Average Low</td>
              <td className="border px-2 py-1">65%</td>
              <td className="border px-2 py-1">35%</td>
              <td className="border px-2 py-1">50%</td>
            </tr>
          </tbody>
        </table>
      </div> */}
    </div>
  );
}
