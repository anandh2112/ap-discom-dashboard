import React, { useState, useEffect, useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// Disable Highcharts watermark globally
if (Highcharts?.Chart?.prototype?.credits) {
  Highcharts.Chart.prototype.credits = function () {};
}

export default function Consumption({ scno = 'ELR027', selectedDate = '2025-11-05' }) {
  const [yearlyData, setYearlyData] = useState({});
  const [weeklyData, setWeeklyData] = useState({});
  const [loadingYear, setLoadingYear] = useState(true);
  const [loadingWeek, setLoadingWeek] = useState(false);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Stack colors
  const PEAK_COLOR = '#F77B72';
  const NORMAL_COLOR = '#FFB74C';
  const OFFPEAK_COLOR = '#81C784';

  const year = useMemo(() => new Date(selectedDate).getFullYear(), [selectedDate]);
  const monthIndex = useMemo(() => new Date(selectedDate).getMonth(), [selectedDate]); // 0-based month

  // Helper to round to 2 decimals
  const round2 = (num) => (isNaN(num) ? 0 : parseFloat(num.toFixed(2)));

  // Fetch Yearly Data
  useEffect(() => {
    const fetchYearly = async () => {
      setLoadingYear(true);
      try {
        const res = await fetch(
          `https://ee.elementsenergies.com/api/fetchConsumerWiseYearWiseMonthlyTariffBasedConsumption1?scno=${scno}&year=${year}`
        );
        const data = await res.json();
        setYearlyData(data);
      } catch (err) {
        console.error('Error fetching yearly data:', err);
      } finally {
        setLoadingYear(false);
      }
    };
    fetchYearly();
  }, [scno, year]);

  // Fetch Weekly Data for the month from selectedDate
  useEffect(() => {
    const fetchWeekly = async () => {
      if (!months[monthIndex]) return;
      setLoadingWeek(true);
      try {
        const monthNum = String(monthIndex + 1).padStart(2, '0');
        const res = await fetch(
          `https://ee.elementsenergies.com/api/fetchConsumerWiseMonthWiseWeeklyTariffBasedConsumption1?scno=${scno}&month=${year}-${monthNum}`
        );
        const data = await res.json();
        setWeeklyData(data);
      } catch (err) {
        console.error('Error fetching weekly data:', err);
      } finally {
        setLoadingWeek(false);
      }
    };
    fetchWeekly();
  }, [monthIndex, scno, year]);

  // Yearly chart options
  const yearOptions = useMemo(() => {
    const categories = months;
    const peaks = categories.map((m) => round2(yearlyData[m]?.['Peak'] || 0));
    const normals = categories.map((m) => round2(yearlyData[m]?.['Normal'] || 0));
    const offpeaks = categories.map((m) => round2(yearlyData[m]?.['Off-Peak'] || 0));

    return {
      chart: { type: 'column', height: 250, backgroundColor: '#fff' },
      title: { text: null },
      xAxis: { categories, title: { text: null } },
      yAxis: {
        min: 0,
        title: { text: 'Consumption (MWh)' },
        stackLabels: { enabled: false },
      },
      tooltip: {
        shared: true,
        formatter: function () {
          const monthName = months[this.points[0].point.x];
          let total = 0;
          this.points.forEach((p) => (total += p.y));
          return `
            <b>${monthName}</b><br/>
            <span style="color:${PEAK_COLOR}">●</span> Peak: <b>${round2(this.points[0].y)} MWh</b><br/>
            <span style="color:${NORMAL_COLOR}">●</span> Normal: <b>${round2(this.points[1].y)} MWh</b><br/>
            <span style="color:${OFFPEAK_COLOR}">●</span> Off-Peak: <b>${round2(this.points[2].y)} MWh</b><br/>
            <hr style="margin:4px 0"/>Total: <b>${round2(total)} MWh</b>
          `;
        },
        useHTML: true,
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          borderRadius: 2,
        },
      },
      series: [
        { name: 'Peak', data: peaks, color: PEAK_COLOR },
        { name: 'Normal', data: normals, color: NORMAL_COLOR },
        { name: 'Off-Peak', data: offpeaks, color: OFFPEAK_COLOR },
      ],
      credits: { enabled: false },
      legend: { align: 'center', verticalAlign: 'bottom' },
    };
  }, [yearlyData]);

  // Weekly chart options
  const weekOptions = useMemo(() => {
    const weekKeys = Object.keys(weeklyData || {});
    const peaks = weekKeys.map((w) => round2(weeklyData[w]?.['Peak'] || 0));
    const normals = weekKeys.map((w) => round2(weeklyData[w]?.['Normal'] || 0));
    const offpeaks = weekKeys.map((w) => round2(weeklyData[w]?.['Off-Peak'] || 0));

    return {
      chart: { type: 'column', height: 250, backgroundColor: '#fff' },
      title: { text: null },
      xAxis: { categories: weekKeys, title: { text: null } },
      yAxis: {
        min: 0,
        title: { text: 'Consumption (kWh)' },
        stackLabels: { enabled: false },
      },
      tooltip: {
        shared: true,
        formatter: function () {
          const weekLabel = weekKeys[this.points[0].point.x];
          let total = 0;
          this.points.forEach((p) => (total += p.y));
          return `
            <b>${months[monthIndex]} - ${weekLabel}</b><br/>
            <span style="color:${PEAK_COLOR}">●</span> Peak: <b>${round2(this.points[0].y)} kWh</b><br/>
            <span style="color:${NORMAL_COLOR}">●</span> Normal: <b>${round2(this.points[1].y)} kWh</b><br/>
            <span style="color:${OFFPEAK_COLOR}">●</span> Off-Peak: <b>${round2(this.points[2].y)} kWh</b><br/>
            <hr style="margin:4px 0"/>Total: <b>${round2(total)} kWh</b>
          `;
        },
        useHTML: true,
      },
      plotOptions: {
        column: { stacking: 'normal', borderRadius: 2 },
      },
      series: [
        { name: 'Peak', data: peaks, color: PEAK_COLOR },
        { name: 'Normal', data: normals, color: NORMAL_COLOR },
        { name: 'Off-Peak', data: offpeaks, color: OFFPEAK_COLOR },
      ],
      credits: { enabled: false },
      legend: { align: 'center', verticalAlign: 'bottom' },
    };
  }, [weeklyData, monthIndex]);

  return (
    <div className="grid grid-cols-1 md:flex gap-4 rounded-lg">
      {/* Yearly Chart */}
      <div className="bg-white rounded-lg shadow-md p-3 md:flex-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">
          {loadingYear ? 'Loading Yearly Consumption...' : 'Yearly Consumption'}
        </h2>
        {!loadingYear && <HighchartsReact highcharts={Highcharts} options={yearOptions} />}
      </div>

      {/* Weekly Chart */}
      <div className="bg-white rounded-lg shadow-md p-3 md:flex-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">
          {loadingWeek
            ? `Loading ${months[monthIndex]} Data...`
            : `${months[monthIndex]} - Weekly Consumption`}
        </h2>
        {!loadingWeek && Object.keys(weeklyData).length > 0 && (
          <HighchartsReact highcharts={Highcharts} options={weekOptions} />
        )}
      </div>
    </div>
  );
}