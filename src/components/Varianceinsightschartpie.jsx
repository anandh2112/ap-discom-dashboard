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

  // Label mapping (fixed order)
  const increaseLabels = ["Very Low", "Low", "Medium", "High", "Very High"];
  const decreaseLabels = ["Very Low", "Low", "Medium", "High", "Very High"];

  // Map subViewMode to API subcat values
  const getSubcat = () => {
    if (subViewMode === "M-F") return "mf";
    if (subViewMode === "Sat") return "sat";
    if (subViewMode === "Sun") return "sun";
    if (subViewMode === "All") return "all";
    return "all";
  };

  // Build single endpoint URL
  const getApiUrl = () => {
    const base =
      "https://ee.elementsenergies.com/api/fetchHighLowAvgChartMFSTSD";

    const subcat = getSubcat();

    if (viewMode === "All") {
      return `${base}?category=all&subcat=${subcat}`;
    }

    if (viewMode === "Year") {
      const year = selectedDate?.split("-")[0];
      return `${base}?category=year&subcat=${subcat}&date=${year}`;
    }

    if (viewMode === "Month") {
      const month = selectedDate?.slice(0, 7);
      return `${base}?category=month&subcat=${subcat}&date=${month}`;
    }

    return `${base}?category=all&subcat=${subcat}`;
  };

  // Map API object to chart format (preserving backend order)
  const mapData = (obj, labels) => {
    const values = Object.values(obj || {});
    return values.map((value, i) => ({
      name: labels[i] || `Range ${i + 1}`,
      y: value,
    }));
  };

  // Fetch data when dependencies change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = getApiUrl();
        const res = await fetch(url);
        const json = await res.json();

        const inc = json.percent_increase_from_avg || {};
        const dec = json.percent_decrease_from_avg || {};

        setPeakData(mapData(inc, increaseLabels));
        setLowData(mapData(dec, decreaseLabels));
      } catch (e) {
        console.error("Pie fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [viewMode, subViewMode, selectedDate]);

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