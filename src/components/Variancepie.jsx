import { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function VariancePie({ viewMode, subViewMode, selectedDate }) {
  const [peakData, setPeakData] = useState([]);
  const [lowData, setLowData] = useState([]);
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Cache keys based on viewMode and selectedDate
  const getCacheKey = (type) => `variance${type}_${viewMode}_${selectedDate || 'all'}`;
  const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

  const mapDataWithLabels = (dataObj) => {
    const keys = Object.keys(dataObj);
    const labels = ["Very Low", "Low", "Medium", "High", "Very High"];
    return keys.map((key, index) => ({
      name: labels[index] || key,
      y: dataObj[key],
    }));
  };

  const getSubViewModeKey = () => {
    switch (subViewMode) {
      case 'M-F': return 'Mon-Fri';
      case 'Sat': return 'Sat';
      case 'Sun': return 'Sun';
      default: return 'All';
    }
  };

  const getEndpoints = () => {
    const baseURL = "https://ee.elementsenergies.com/api";
    
    switch (viewMode) {
      case 'Month':
        return {
          chart: `${baseURL}/fetchMonthlyAllHighLowAvgChartMFSTSD?month=${selectedDate}`,
          table: `${baseURL}/fetchMonthlyAllHighLowAvgChartTableMFSTSD?month=${selectedDate}`
        };
      case 'Year':
        // Extract year from selectedDate (e.g., "2025" from "2025" or "2025-09")
        const year = selectedDate ? selectedDate.split('-')[0] : new Date().getFullYear();
        return {
          chart: `${baseURL}/fetchYearlyAllHighLowAvgChartMFSTSD?year=${year}`,
          table: `${baseURL}/fetchYearlyAllHighLowAvgChartTableMFSTSD?year=${year}`
        };
      case 'All':
      default:
        return {
          chart: `${baseURL}/fetchAllHighLowAvgChartMFSTSD`,
          table: `${baseURL}/fetchAllHighLowAvgChartTableMFSTSD`
        };
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
    const fetchVarianceData = async () => {
      try {
        const chartCacheKey = getCacheKey('Chart');
        const tableCacheKey = getCacheKey('Table');
        
        const cachedChart = localStorage.getItem(chartCacheKey);
        const cachedTable = localStorage.getItem(tableCacheKey);

        // Check if we have valid cached data
        if (cachedChart && cachedTable) {
          const { timestamp: chartTimestamp, data: chartData } = JSON.parse(cachedChart);
          const { timestamp: tableTimestamp, data: tableData } = JSON.parse(cachedTable);
          
          if (Date.now() - chartTimestamp < CACHE_DURATION && 
              Date.now() - tableTimestamp < CACHE_DURATION) {
            updateDataFromCache(chartData, tableData);
            setLoading(false);
            return;
          }
        }

        if (!navigator.onLine) {
          if (cachedChart && cachedTable) {
            const { data: chartData } = JSON.parse(cachedChart);
            const { data: tableData } = JSON.parse(cachedTable);
            updateDataFromCache(chartData, tableData);
            setLoading(false);
            return;
          } else {
            throw new Error("Offline and no cached data available");
          }
        }

        const endpoints = getEndpoints();
        
        // Fetch chart data
        const chartRes = await fetch(endpoints.chart);
        if (!chartRes.ok) {
          throw new Error(`Failed to fetch chart data: ${chartRes.status}`);
        }
        const chartJson = await chartRes.json();

        // Fetch table data
        const tableRes = await fetch(endpoints.table);
        if (!tableRes.ok) {
          throw new Error(`Failed to fetch table data: ${tableRes.status}`);
        }
        const tableJson = await tableRes.json();

        // Cache both
        localStorage.setItem(
          chartCacheKey,
          JSON.stringify({
            timestamp: Date.now(),
            data: chartJson,
          })
        );

        localStorage.setItem(
          tableCacheKey,
          JSON.stringify({
            timestamp: Date.now(),
            data: tableJson,
          })
        );

        updateDataFromResponse(chartJson, tableJson);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching variance data:', err);
        setError(`Failed to load chart data: ${err.message}`);
        setLoading(false);
      }
    };

    const updateDataFromCache = (chartData, tableData) => {
      const subViewKey = getSubViewModeKey();
      const chartSubData = chartData[subViewKey] || chartData;
      const tableSubData = tableData[subViewKey] || tableData;

      const peak = mapDataWithLabels(chartSubData.percent_increase_from_avg || {});
      const low = mapDataWithLabels(chartSubData.percent_decrease_from_avg || {});

      setPeakData(peak);
      setLowData(low);
      setTableData(tableSubData);
    };

    const updateDataFromResponse = (chartJson, tableJson) => {
      const subViewKey = getSubViewModeKey();
      const chartSubData = chartJson[subViewKey] || chartJson;
      const tableSubData = tableJson[subViewKey] || tableJson;

      const peak = mapDataWithLabels(chartSubData.percent_increase_from_avg || {});
      const low = mapDataWithLabels(chartSubData.percent_decrease_from_avg || {});

      setPeakData(peak);
      setLowData(low);
      setTableData(tableSubData);
    };

    fetchVarianceData();
  }, [viewMode, selectedDate]); // Only refetch when viewMode or selectedDate changes

  // Update data when subViewMode changes (using cached data)
  useEffect(() => {
    if (!loading && !error) {
      const chartCacheKey = getCacheKey('Chart');
      const tableCacheKey = getCacheKey('Table');
      
      const cachedChart = localStorage.getItem(chartCacheKey);
      const cachedTable = localStorage.getItem(tableCacheKey);

      if (cachedChart && cachedTable) {
        const { data: chartData } = JSON.parse(cachedChart);
        const { data: tableData } = JSON.parse(cachedTable);

        const subViewKey = getSubViewModeKey();
        const chartSubData = chartData[subViewKey] || chartData;
        const tableSubData = tableData[subViewKey] || tableData;

        const peak = mapDataWithLabels(chartSubData.percent_increase_from_avg || {});
        const low = mapDataWithLabels(chartSubData.percent_decrease_from_avg || {});

        setPeakData(peak);
        setLowData(low);
        setTableData(tableSubData);
      }
    }
  }, [subViewMode]); // Only update display when subViewMode changes

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