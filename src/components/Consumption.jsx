import React, { useState, useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// Disable Highcharts watermark globally
if (Highcharts?.Chart?.prototype?.credits) {
  Highcharts.Chart.prototype.credits = function () {};
}

export default function Consumption() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // default current month (0 = Jan)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Base color for all months (e.g., blue tone)
  const baseColor = '#1f77b4';

  // Dummy year-wise consumption data
  const yearData = useMemo(() => months.map(() => Math.floor(Math.random() * 1000) + 200), []);

  // Function to get dummy week-wise data based on month
  const getWeeklyData = (monthIndex) => {
    const weeks = Math.ceil(28 + Math.random() * 4); // random number of days 28–31
    const numWeeks = Math.ceil(weeks / 7);
    return Array.from({ length: numWeeks }, () => Math.floor(Math.random() * 200) + 50);
  };

  const weeklyData = useMemo(() => getWeeklyData(selectedMonth), [selectedMonth]);

  // Determine brightness relative to median week (3rd highest)
  const weeklyColors = useMemo(() => {
    const sorted = [...weeklyData].sort((a, b) => b - a); // descending
    const medianVal = sorted[Math.min(2, sorted.length - 1)]; // 3rd highest or last available

    return weeklyData.map(val => {
      // Positive => darker, Negative => lighter relative to median
      const diffRatio = (val - medianVal) / medianVal;
      const brightness = diffRatio > 0 ? -0.3 * diffRatio : 0.3 * Math.abs(diffRatio);
      return Highcharts.color(baseColor).brighten(brightness).get();
    });
  }, [weeklyData]);

  // Yearly Chart Config (single consistent color)
  const yearOptions = {
    chart: {
      type: 'column',
      height: 280,
      backgroundColor: '#fff',
    },
    title: { text: null },
    xAxis: { categories: months, title: { text: null } },
    yAxis: { title: { text: 'Consumption (kWh)' } },
    tooltip: { pointFormat: 'Consumption: <b>{point.y} kWh</b>' },
    plotOptions: {
      column: {
        borderRadius: 4,
        cursor: 'pointer',
        point: {
          events: {
            click: function () {
              setSelectedMonth(this.x);
            },
          },
        },
      },
    },
    credits: { enabled: false },
    series: [
      {
        name: 'Consumption',
        data: yearData.map((y) => ({ y, color: baseColor })),
      },
    ],
    legend: { enabled: false },
  };

  // Weekly Chart Config (shades of same base color)
  const weekOptions = {
    chart: { type: 'column', height: 280, backgroundColor: '#fff' },
    title: { text: null },
    xAxis: { categories: weeklyData.map((_, i) => `Week ${i + 1}`), title: { text: null } },
    yAxis: { title: { text: 'Consumption (kWh)' } },
    tooltip: { pointFormat: 'Consumption: <b>{point.y} kWh</b>' },
    plotOptions: {
      column: { borderRadius: 4 },
      series: { colorByPoint: true },
    },
    credits: { enabled: false },
    series: [
      {
        name: 'Weekly Consumption',
        data: weeklyData.map((y, i) => ({ y, color: weeklyColors[i] })),
      },
    ],
    legend: { enabled: false },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg">
      {/* Yearly Chart */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">
          Yearly Consumption
        </h2>
        <HighchartsReact highcharts={Highcharts} options={yearOptions} />
      </div>

      {/* Weekly Chart */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">
          {months[selectedMonth]} - Weekly Consumption
        </h2>
        <HighchartsReact highcharts={Highcharts} options={weekOptions} />
      </div>
    </div>
  );
} 