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
  const [costData, setCostData] = useState([])
  const [shiftPercent, setShiftPercent] = useState(25)

  useEffect(() => {
    // Simulate loading and dummy hourly data
    setTimeout(() => {
      const dummyConsumption = [
        { hour: '00', consumption: 40 },
        { hour: '02', consumption: 55 },
        { hour: '04', consumption: 60 },
        { hour: '06', consumption: 75 },
        { hour: '08', consumption: 90 },
        { hour: '10', consumption: 110 },
        { hour: '12', consumption: 105 },
        { hour: '14', consumption: 95 },
        { hour: '16', consumption: 85 },
        { hour: '18', consumption: 120 },
        { hour: '20', consumption: 130 },
        { hour: '22', consumption: 90 },
      ]

      const dummyCost = dummyConsumption.map((d) => ({
        hour: d.hour,
        cost: d.consumption * 0.5 + Math.random() * 10, // simulate variation
      }))

      setConsumptionData(dummyConsumption)
      setCostData(dummyCost)
      setLoading(false)
    }, 800)
  }, [])

  if (loading) return <p className="text-gray-500 text-sm">Loading Load Shift data...</p>

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))

  const getBarColor = (hour) => {
    if ((hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 21)) return '#F99B97' // Peak
    if ((hour >= 10 && hour <= 14) || (hour >= 0 && hour <= 5)) return '#A5D6A7' // Off-Peak
    return '#FFD08C' // Normal
  }

  const getTimeSlot = (hour) => {
    if ((hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 21)) return 'Peak'
    if ((hour >= 10 && hour <= 14) || (hour >= 0 && hour <= 5)) return 'Off-Peak'
    return 'Normal'
  }

  const consumptionSeries = hours.map((h) => {
    const entry = consumptionData.find((d) => d.hour === h)
    return entry ? entry.consumption : 0
  })

  const costSeries = hours.map((h) => {
    const entry = costData.find((d) => d.hour === h)
    return entry ? entry.cost : 0
  })

  const barColors = hours.map((h) => getBarColor(parseInt(h)))

  const options = {
    chart: { height: 400, backgroundColor: 'transparent' },
    title: { text: 'Load Shift (Dummy Data)', style: { fontSize: '16px' } },
    xAxis: { categories: hours, title: { text: 'Hour of Day' } },
    yAxis: [
      { title: { text: 'Load (kW)' }, opposite: false },
      { title: { text: 'Cost (₹)' }, opposite: true },
    ],
    tooltip: {
      shared: true,
      formatter: function () {
        const hour = this.x
        const cons = consumptionSeries[hour] || 0
        const cost = costSeries[hour] || 0
        const slot = getTimeSlot(parseInt(hour))
        return `<b>${hour}:00</b> (${slot})<br/>Load: <b>${cons.toFixed(
          2
        )} kW</b><br/>Cost: <b>₹${cost.toFixed(2)}</b>`
      },
    },
    series: [
      {
        type: 'line',
        name: 'Load (kW)',
        data: consumptionSeries,
        color: '#007bff',
        yAxis: 0,
        zIndex: 1,
        marker: { enabled: false },
      },
      {
        type: 'column',
        name: 'Cost (₹)',
        data: costSeries.map((val, idx) => ({
          y: val,
          color: barColors[idx],
        })),
        yAxis: 1,
        zIndex: 0,
      },
    ],
    credits: { enabled: false },
    legend: { enabled: false },
  }

  // Dummy summary data
  const summaryData = [
    { percent: 10, before: 320, after: 290, savings: 1200, emission: 8.4 },
    { percent: 25, before: 340, after: 270, savings: 2800, emission: 18.5 },
    { percent: 50, before: 360, after: 240, savings: 5600, emission: 34.2 },
  ]

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* Header with toggle buttons */}
      <div className="flex justify-end items-center mb-1">
        {/* Right-side toggle buttons for shift % */}
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

      {/* Chart */}
      <HighchartsReact highcharts={Highcharts} options={options} />

      {/* Custom Legend */}
      <div className="flex items-center justify-center mt-1 space-x-4">
        <div className="flex items-center space-x-1">
          <span className="w-4 h-4 bg-blue-500 inline-block"></span>
          <span className="text-sm text-gray-700">Load (kW)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-4 h-4 bg-[#F99B97] inline-block"></span>
          <span className="text-sm text-gray-700">Cost Peak (₹)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-4 h-4 bg-[#FFD08C] inline-block"></span>
          <span className="text-sm text-gray-700">Cost Normal (₹)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-4 h-4 bg-[#A5D6A7] inline-block"></span>
          <span className="text-sm text-gray-700">Cost Off-Peak (₹)</span>
        </div>
      </div>

      {/* Summary Table */}
      <div className="mt-2 overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded-lg text-sm text-center">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border px-4 py-2 align-center" rowSpan={2}>Savings (%)</th>
              <th className="border px-4 py-2" colSpan={2}>Peak Hour Consumption (kVA)</th>
              <th className="border px-4 py-2 align-center" rowSpan={2}>Savings (₹)</th>
              <th className="border px-4 py-2 align-center" rowSpan={2}>Emission Reduction (kg CO₂)</th>
            </tr>
            <tr className="bg-gray-50 text-gray-600">
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
                <td className="border px-4 py-2">₹{row.savings.toLocaleString()}</td>
                <td className="border px-4 py-2">{row.emission}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
