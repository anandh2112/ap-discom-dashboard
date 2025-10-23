import { useEffect, useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

// Disable Highcharts watermark globally
if (Highcharts?.Chart?.prototype?.credits) {
  Highcharts.Chart.prototype.credits = function () {}
}

export default function Loadshift() {
  const [loading, setLoading] = useState(true)
  const [consumptionData, setConsumptionData] = useState([])
  const [shiftPercent, setShiftPercent] = useState(10) // Default changed to 10%

  useEffect(() => {
    // Simulate smooth hourly data (linear)
    setTimeout(() => {
      const dummyConsumption = [
        40, 45, 50, 55, 60, 70, 80, 90, 100, 110, 115, 120,
        115, 110, 100, 90, 95, 110, 120, 130, 125, 110, 80, 60,
      ].map((val, hour) => ({
        hour: hour.toString().padStart(2, '0'),
        consumption: val,
      }))
      setConsumptionData(dummyConsumption)
      setLoading(false)
    }, 600)
  }, [])

  if (loading)
    return <p className="text-gray-500 text-sm">Loading Load Shift data...</p>

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))

  // Actual load
  const actualSeries = hours.map((h) => {
    const entry = consumptionData.find((d) => d.hour === h)
    return entry ? entry.consumption : 0
  })

  // Shifted load (simulate demand shift)
  const shiftedSeries = actualSeries.map((val, idx) => {
    if ((idx >= 6 && idx <= 10) || (idx >= 18 && idx <= 22)) {
      return val * (1 - shiftPercent / 100)
    } else if ((idx >= 0 && idx <= 5) || (idx >= 11 && idx <= 15)) {
      return val * (1 + shiftPercent / 200)
    }
    return val
  })

  const options = {
    chart: {
      type: 'area',
      height: 400,
      backgroundColor: 'transparent',
      animations: {
        enabled: true,
        easing: 'easeInOut',
        speed: 800,
      },
    },
    title: {
      text: null, // Removed internal chart title
    },
    xAxis: {
      categories: hours,
      title: { text: 'Hour of Day' },
      gridLineWidth: 0,
      plotBands: [
        {
          from: 6,
          to: 10,
          color: 'rgba(255, 99, 71, 0.15)',
          label: {
            text: 'Morning Peak',
            style: { color: '#555', fontSize: '11px' },
            y: -1,
          },
        },
        {
          from: 18,
          to: 22,
          color: 'rgba(255, 99, 71, 0.15)',
          label: {
            text: 'Evening Peak',
            style: { color: '#555', fontSize: '11px' },
            y: -1,
          },
        },
      ],
    },
    yAxis: {
      title: { text: 'Consumption (Wh)' },
      gridLineDashStyle: 'Dash',
    },
    tooltip: {
      shared: true,
      formatter: function () {
        const hour = this.x
        const actual = actualSeries[parseInt(hour)] || 0
        const shifted = shiftedSeries[parseInt(hour)] || 0
        const diff = actual - shifted
        return `<b>${hour}:00</b><br/>
          Actual Load: <b>${actual.toFixed(2)} Wh</b><br/>
          Shifted Load: <b>${shifted.toFixed(2)} Wh</b><br/>
          Reduction: <b>${diff.toFixed(2)} Wh</b>`
      },
    },
    plotOptions: {
      area: {
        marker: { enabled: false },
        fillOpacity: 0.7,
        lineWidth: 3,
        states: {
          hover: {
            lineWidth: 4,
            fillOpacity: 0.9,
          },
        },
      },
      series: {
        marker: { enabled: false },
        lineWidth: 3,
        states: {
          hover: {
            lineWidth: 4,
          },
        },
      },
    },
    series: [
      {
        name: 'Actual Load',
        data: actualSeries,
        color: '#6A42B2',
        zIndex: 2,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(106, 66, 178, 0.8)'],
            [0.3, 'rgba(106, 66, 178, 0.5)'],
            [0.6, 'rgba(106, 66, 178, 0.2)'],
            [0.8, 'rgba(106, 66, 178, 0.1)'],
            [1, 'rgba(255, 255, 255, 0)'],
          ],
        },
      },
      {
        name: `Shifted Load (${shiftPercent}%)`,
        data: shiftedSeries,
        color: '#13C4A9',
        zIndex: 1,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(19, 196, 169, 0.8)'],
            [0.3, 'rgba(19, 196, 169, 0.5)'],
            [0.6, 'rgba(19, 196, 169, 0.2)'],
            [0.8, 'rgba(19, 196, 169, 0.1)'],
            [1, 'rgba(19, 196, 169, 0.1)'],
          ],
        },
      },
    ],
    credits: { enabled: false },
    legend: { enabled: true },
  }

  const summaryData = [
    { percent: 10, before: 320, after: 290, costBefore: 14500, costAfter: 13200, savings: 1200, emission: 8.4 },
    { percent: 25, before: 340, after: 270, costBefore: 15200, costAfter: 12600, savings: 2800, emission: 18.5 },
    { percent: 50, before: 360, after: 240, costBefore: 16000, costAfter: 11800, savings: 5600, emission: 34.2 },
  ]

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* Header row: Title (left) + Toggle (right) */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-center">
          Load Shift ({shiftPercent}% Shift)
        </h2>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Shift %:</span>
          <div className="flex bg-gray-100 rounded-lg border overflow-hidden">
            {[10, 25, 50].map((val) => (
              <button
                key={val}
                onClick={() => setShiftPercent(val)}
                className={`px-3 py-0 text-sm font-medium transition hover:cursor-pointer ${
                  shiftPercent === val
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Area Chart */}
      <HighchartsReact highcharts={Highcharts} options={options} />

      {/* Summary Table */}
      <div className="mt-0 overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded-lg text-sm text-center">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border px-4 py-2 align-center" rowSpan={2}>
                Shift (%)
              </th>
              <th className="border px-4 py-2" colSpan={2}>
                Peak Hour Consumption (Wh)
              </th>
              <th className="border px-4 py-2" colSpan={2}>
                Cost (₹)
              </th>
              <th className="border px-4 py-2 align-center" rowSpan={2}>
                Savings (₹)
              </th>
              <th className="border px-4 py-2 align-center" rowSpan={2}>
                Emission <br /> Reduction (kg CO₂)
              </th>
            </tr>
            <tr className="bg-gray-100 text-gray-600">
              <th className="border px-4 py-1">Before</th>
              <th className="border px-4 py-1">After</th>
              <th className="border px-4 py-1">Before</th>
              <th className="border px-4 py-1">After</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.map((row) => (
              <tr
                key={row.percent}
                className={`transition ${
                  shiftPercent === row.percent
                    ? 'bg-blue-100 font-semibold'
                    : 'hover:bg-gray-50'
                }`}
              >
                <td className="border px-4 py-2">{row.percent}%</td>
                <td className="border px-4 py-2">{row.before}</td>
                <td className="border px-4 py-2">{row.after}</td>
                <td className="border px-4 py-2">₹{row.costBefore.toLocaleString()}</td>
                <td className="border px-4 py-2">₹{row.costAfter.toLocaleString()}</td>
                <td className="border px-4 py-2">
                  ₹{row.savings.toLocaleString()}
                </td>
                <td className="border px-4 py-2">{row.emission}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
