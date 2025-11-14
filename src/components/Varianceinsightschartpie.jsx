import { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function VarianceInsightsChartPie({
  viewMode,
  subViewMode,
  selectedDate,
}) {
  const [peakData, setPeakData] = useState([]);
  const [lowData, setLowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState(null); // store API response

  // Label mapping
  const increaseLabels = ["Very Low", "Low", "Medium", "High", "Very High"];
  const decreaseLabels = ["Very Low", "Low", "Medium", "High", "Very High"];

  // Fetch correct URL based on viewMode
  const getApiUrl = () => {
    if (viewMode === "All") {
      return `https://ee.elementsenergies.com/api/fetchAllHighLowAvgChartMFSTSD`;
    }
    if (viewMode === "Year") {
      const year = selectedDate?.split("-")[0];
      return `https://ee.elementsenergies.com/api/fetchYearlyHighLowAvgChartMFSTSD?year=${year}`;
    }
    if (viewMode === "Month") {
      const month = selectedDate?.slice(0, 7);
      return `https://ee.elementsenergies.com/api/fetchMonthlyHighLowAvgChartMFSTSD?month=${month}`;
    }
    return null;
  };

  // Map API data to chart format
  const mapData = (obj, labels) =>
    Object.keys(obj).map((key, i) => ({
      name: labels[i],
      y: obj[key],
    }));

  // Fetch data only when viewMode or selectedDate changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = getApiUrl();
        const res = await fetch(url);
        const json = await res.json();
        setFetchedData(json); // save full response
      } catch (e) {
        console.error("Pie fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [viewMode, selectedDate]);

  // Update chart data whenever subViewMode or fetchedData changes
  useEffect(() => {
    if (!fetchedData) return;

    const viewKey = subViewMode === "M-F" ? "Mon-Fri" : subViewMode;
    const selectedData = fetchedData[viewKey] || {};

    const inc = selectedData.percent_increase_from_avg || {};
    const dec = selectedData.percent_decrease_from_avg || {};

    setPeakData(mapData(inc, increaseLabels));
    setLowData(mapData(dec, decreaseLabels));
  }, [subViewMode, fetchedData]);

  const createOptions = (title, data) => ({
    chart: { type: "pie" },
    title: { text: title, style: { fontSize: "14px" } },
    tooltip: {
      pointFormat: "<b>{point.y}</b> counts ({point.percentage:.1f}%)",
      backgroundColor: "rgba(255,255,255,0.95)",
      borderColor: "#ccc",
      style: { color: "#333", fontSize: "12px" },
    },
    series: [{ name: "Variance %", data }],
    credits: { enabled: false },
    legend: { enabled: false },
    plotOptions: {
      pie: { dataLabels: { enabled: false }, showInLegend: false },
    },
  });

  return (
    <div className="w-full flex flex-col md:flex-row gap-4 mt-2">
      <div className="w-full md:w-1/2 bg-white p-4 rounded-lg shadow-md">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <HighchartsReact
            highcharts={Highcharts}
            options={createOptions("Upward Variance", peakData)}
          />
        )}
      </div>

      <div className="w-full md:w-1/2 bg-white p-4 rounded-lg shadow-md">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <HighchartsReact
            highcharts={Highcharts}
            options={createOptions("Downward Variance", lowData)}
          />
        )}
      </div>
    </div>
  );
}