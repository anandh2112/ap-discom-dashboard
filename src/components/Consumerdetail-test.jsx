import { useParams, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

// Disable Highcharts watermark
if (Highcharts?.Chart?.prototype?.credits) {
  Highcharts.Chart.prototype.credits = function () {}
}

export default function ConsumerDetail() {
  const { id } = useParams()
  const location = useLocation()
  const consumerName = location.state?.name || "Unknown Consumer"

  const [viewMode, setViewMode] = useState('Day')
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [shiftPercent, setShiftPercent] = useState(25)

  // Mock data
  const actualData = Array.from({ length: 24 }, () => Math.floor(Math.random() * 100) + 200)
  const shiftedData = actualData.map((v) => v - Math.floor(Math.random() * 20))
  const costData = Array.from({ length: 24 }, () => Math.floor(Math.random() * 5) + 10)

  // Define TOD category for each hour
  const getTODLabel = (hour) => {
    if ([6, 7, 8, 9, 18, 19, 20, 21].includes(hour)) return 'Peak'
    if ([0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 14].includes(hour)) return 'Off-Peak'
    return 'Normal'
  }

  // Define time-based bar colors
  const getBarColor = (hour) => {
    if ((hour >= 6 && hour < 10) || (hour >= 18 && hour < 22)) return '#F9A29A' // Peak
    if ((hour >= 10 && hour < 15) || (hour >= 0 && hour < 6)) return '#A8E6A3' // Off-Peak
    return '#FFD68A' // Normal
  }

  const coloredCostData = costData.map((val, i) => ({
    y: val,
    color: getBarColor(i),
  }))

  // Calculate downward shift data based on shiftPercent
  const getDownwardShiftData = () => {
    const peakHours = [6, 7, 8, 9, 18, 19, 20, 21]
    return costData.map((cost, hour) => {
      if (peakHours.includes(hour)) {
        // Calculate downward value based on shift percentage
        const downwardValue = -(cost * shiftPercent / 100)
        return {
          y: downwardValue,
          color: '#FF6B6B', // Red color for downward bars
        }
      }
      return null
    })
  }

  const downwardShiftData = getDownwardShiftData()

  // Mock summary data
  const summaryData = [
    { percent: 10, before: 320, after: 290, savings: 1200, emission: 8.4 },
    { percent: 25, before: 340, after: 270, savings: 2800, emission: 18.5 },
    { percent: 50, before: 360, after: 240, savings: 5600, emission: 34.2 },
  ]

  const options = {
    chart: {
      zoomType: 'xy',
      height: 400,
      backgroundColor: 'transparent',
    },
    title: {
      text: `${consumerName} (${id}) - Consumption & Cost Analysis`,
    },
    credits: { enabled: false },
    legend: {
      labelFormatter: function () {
        if (this.name === 'Cost') return null
        return this.name
      },
    },
    xAxis: {
      categories: Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')),
      title: { text: 'Hour of Day' },
    },
    yAxis: [
      { 
        title: { text: 'Consumption (kWh)' }, 
        opposite: false,
        min: -Math.max(...costData) * 0.6, // Ensure downward bars stay below 0
      },
      { 
        title: { text: 'Cost (₹)' }, 
        opposite: true,
      },
    ],
    tooltip: {
      shared: true,
      formatter: function () {
        const hour = parseInt(this.x)
        const tod = getTODLabel(hour)
        let s = `${this.x}:00 <b>(${tod})</b><br/>`
        this.points.forEach((point) => {
          if (point.series.name !== 'Cost' && point.series.name !== 'Shift Potential') {
            s += `${point.series.name}: <b>${point.y}</b><br/>`
          }
        })
        const costPoint = this.points.find((p) => p.series.name === 'Cost')
        if (costPoint) s += `Cost: <b>₹${costPoint.y}<b><br/>`
        
        const shiftPoint = this.points.find((p) => p.series.name === 'Shift Potential')
        if (shiftPoint && shiftPoint.y < 0) {
          s += `Shift Potential: ₹<b>${Math.abs(shiftPoint.y).toFixed(1)}</b>`
        }
        return s
      },
    },
    plotOptions: {
      column: { 
        pointPadding: 0.2, 
        borderWidth: 0, 
        groupPadding: 0.1,
        grouping: false,
      },
      series: { marker: { enabled: false } },
    },
    series: [
      { 
        name: 'Cost', 
        type: 'column', 
        data: coloredCostData, 
        yAxis: 1, 
        zIndex: 1, 
        showInLegend: false 
      },
      { 
        name: 'Shift Potential', 
        type: 'column', 
        data: downwardShiftData, 
        yAxis: 1, 
        zIndex: 2,
        showInLegend: true,
        color: '#FF6B6B',
        dataLabels: {
          enabled: true,
          formatter: function() {
            if (this.y < 0) {
              return `${Math.abs(this.y).toFixed(1)}`
            }
            return null
          },
          style: {
            color: '#FF6B6B',
            fontWeight: 'bold',
            textOutline: 'none' // Remove black outline
          }
        }
      },
      { 
        name: 'Actual', 
        type: 'line', 
        data: actualData, 
        yAxis: 0, 
        color: '#007bff', 
        zIndex: 3 
      },
      { 
        name: 'Shifted', 
        type: 'line', 
        data: shiftedData, 
        dashStyle: 'Dash', 
        yAxis: 0, 
        color: '#ff7f00', 
        zIndex: 3 
      },
    ],
  }

  return (
    <div>
      {/* Top Controls */}
      <div className="flex justify-between items-center mb-4 flex-wrap">
        {/* Center buttons + date picker */}
        <div className="flex-1 flex justify-start items-center gap-3">
          {['Day', 'Week', 'Month'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg border text-sm font-semibold transition ${
                viewMode === mode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
              }`}
            >
              {mode}
            </button>
          ))}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border rounded-lg px-2 py-2 text-sm"
          />
        </div>

        {/* Right-side toggle buttons for shift % */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Shift %:</span>
          <div className="flex bg-gray-100 rounded-lg border overflow-hidden">
            {[10, 25, 50].map((val) => (
              <button
                key={val}
                onClick={() => setShiftPercent(val)}
                className={`px-3 py-1 text-sm font-medium transition ${
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

      {/* Summary Table */}
      <div className="mt-4 overflow-x-auto">
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