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

  // 12 basic colors for the months
  const monthColors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
    '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
    '#bcbd22', '#17becf', '#aec7e8', '#ffbb78'
  ];

  // Dummy year-wise consumption data
  const yearData = useMemo(() => months.map(() => Math.floor(Math.random() * 1000) + 200), []);

  // Function to get dummy week-wise data based on month
  const getWeeklyData = (monthIndex) => {
    const weeks = Math.ceil(28 + Math.random() * 4); // random number of days 28–31
    const numWeeks = Math.ceil(weeks / 7);
    return Array.from({ length: numWeeks }, () => Math.floor(Math.random() * 200) + 50);
  };

  const weeklyData = useMemo(() => getWeeklyData(selectedMonth), [selectedMonth]);

  // Create gradient colors for weekly bars based on selected month color
  const weeklyColors = useMemo(() => {
    const baseColor = monthColors[selectedMonth];
    const maxVal = Math.max(...weeklyData);
    const minVal = Math.min(...weeklyData);
    return weeklyData.map(val => {
      // calculate brightness factor 0.5–1 depending on value
      const factor = 0.5 + 0.5 * (val - minVal) / (maxVal - minVal || 1);
      return Highcharts.color(baseColor).brighten(1 - factor).get();
    });
  }, [selectedMonth, weeklyData]);

  // Yearly Chart Config
  const yearOptions = {
    chart: {
      type: 'column',
      height: 280,
      backgroundColor: '#fff',
    },
    title: { text: null }, // Removed title
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
              setSelectedMonth(this.x); // update month on click
            },
          },
        },
      },
      series: { colorByPoint: true },
    },
    credits: { enabled: false },
    series: [
      { 
        name: 'Consumption', 
        data: yearData.map((y, i) => ({ y, color: monthColors[i] })) 
      },
    ],
    legend: { enabled: false },
  };

  // Weekly Chart Config
  const weekOptions = {
    chart: { type: 'column', height: 280, backgroundColor: '#fff' },
    title: { text: null }, // Removed title
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
        data: weeklyData.map((y, i) => ({ y, color: weeklyColors[i] })) 
      },
    ],
    legend: { enabled: false },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg">
      {/* Yearly Chart Card */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">Yearly Consumption</h2>
        <HighchartsReact highcharts={Highcharts} options={yearOptions} />
      </div>

      {/* Weekly Chart Card */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">
          {months[selectedMonth]} - Weekly Consumption
        </h2>
        <HighchartsReact highcharts={Highcharts} options={weekOptions} />
      </div>
    </div>
  );
}
