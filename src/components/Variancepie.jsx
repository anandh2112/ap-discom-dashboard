import { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function VariancePie() {
  const [peakData, setPeakData] = useState([]);
  const [lowData, setLowData] = useState([]);
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const CACHE_KEY = "varianceChartData";
  const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

  const mapDataWithLabels = (dataObj, labels) => {
    const keys = Object.keys(dataObj);
    return keys.map((key, index) => ({
      name: labels[index] || key,
      y: dataObj[key],
    }));
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
    const fetchVarianceData = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { timestamp, data } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setPeakData(data.peakData);
            setLowData(data.lowData);
            setTableData(data.tableData);
            setLoading(false);
            return;
          }
        }

        if (!navigator.onLine) {
          if (cached) {
            const { data } = JSON.parse(cached);
            setPeakData(data.peakData);
            setLowData(data.lowData);
            setTableData(data.tableData);
            setLoading(false);
            return;
          } else {
            throw new Error("Offline and no cached data available");
          }
        }

        // Fetch chart data
        const chartRes = await fetch(
          "https://ee.elementsenergies.com/api/fetchAllHighLowAvgChart"
        );
        const chartJson = await chartRes.json();

        const increaseData = chartJson.percent_increase_from_avg || {};
        const decreaseData = chartJson.percent_decrease_from_avg || {};

        const labels = ["Very Low", "Low", "Medium", "High", "Very High"];

        const peak = mapDataWithLabels(increaseData, labels);
        const low = mapDataWithLabels(decreaseData, labels);

        setPeakData(peak);
        setLowData(low);

        // Fetch table data
        const tableRes = await fetch(
          "https://ee.elementsenergies.com/api/fetchAllHighLowAvgChartTable"
        );
        const tableJson = await tableRes.json();
        setTableData(tableJson);

        // Cache both
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            data: { peakData: peak, lowData: low, tableData: tableJson },
          })
        );

        setLoading(false);
      } catch (err) {
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

  const increase = tableData?.percentIncreaseStats || {};
  const decrease = tableData?.percentDecreaseStats || {};

  return (
    <div className="w-full flex flex-col gap-4 relative">
      {isOffline && (
        <div className="bg-yellow-200 text-yellow-800 text-center py-2 text-sm font-medium rounded-md shadow-sm">
          ⚠️ You are offline — showing cached data (if available)
        </div>
      )}

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

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-center font-semibold text-gray-700 mb-3 text-sm">
          Variance Summary
        </h3>
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
                {increase.highest?.toFixed(2) ?? "-"}%
              </td>
              <td className="border px-2 py-1">
                {increase.lowest?.toFixed(2) ?? "-"}%
              </td>
              <td className="border px-2 py-1">
                {increase.average?.toFixed(2) ?? "-"}%
              </td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-medium">
                Average Downward Variance
              </td>
              <td className="border px-2 py-1">
                {decrease.highest?.toFixed(2) ?? "-"}%
              </td>
              <td className="border px-2 py-1">
                {decrease.lowest?.toFixed(2) ?? "-"}%
              </td>
              <td className="border px-2 py-1">
                {decrease.average?.toFixed(2) ?? "-"}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
