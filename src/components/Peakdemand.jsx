import { useState, useMemo, useEffect } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { AiOutlineInfoCircle } from 'react-icons/ai'

// Disable Highcharts watermark globally
if (Highcharts?.Chart?.prototype?.credits) {
  Highcharts.Chart.prototype.credits = function () {}
}

export default function PeakDemand({ scno, selectedDate, viewMode }) {
  const [localViewMode, setLocalViewMode] = useState(viewMode)

  // Keep localViewMode in sync with parent prop
  useEffect(() => {
    setLocalViewMode(viewMode)
  }, [viewMode])

  // --- Derived date parts ---
  const dateObj = new Date(selectedDate)
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const formattedMonth = `${year}-${month}`
  const formattedYear = `${year}`

  // --- Mock Data ---
  const [data, setData] = useState([])
  const [categories, setCategories] = useState([])

  // --- Dynamic X-axis labels ---
  useMemo(() => {
    if (localViewMode === 'Month') {
      const daysInMonth = new Date(year, dateObj.getMonth() + 1, 0).getDate()
      setCategories(Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`))
      setData(Array.from({ length: daysInMonth }, () => Math.floor(Math.random() * 500 + 200)))
    } else if (localViewMode === 'Year') {
      setCategories(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
      setData(Array.from({ length: 12 }, () => Math.floor(Math.random() * 800 + 400)))
    } else {
      setCategories([])
      setData([])
    }
  }, [localViewMode, selectedDate])

  // --- Chart Options ---
  const options = {
    chart: { type: 'area', height: 350 },
    title: { text: null },
    xAxis: {
      categories,
      title: {
        text: localViewMode === 'Month' ? 'Day of Month' : localViewMode === 'Year' ? 'Month' : '',
      },
      labels: { style: { fontSize: '11px' } },
    },
    yAxis: {
      title: { text: 'Peak Demand (kVA)' },
      labels: { style: { fontSize: '11px' } },
      gridLineColor: '#f0f0f0',
    },
    series: [
      {
        name: 'Peak Demand',
        data,
        color: '#007bff',
        fillColor: 'rgba(0,123,255,0.2)',
        lineWidth: 2,
        marker: { enabled: false },
      },
    ],
    legend: { enabled: false },
    credits: { enabled: false },
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#ccc',
      style: { fontSize: '12px' },
      formatter: function () {
        const label = localViewMode === 'Month' ? `Day ${this.x}` : this.x
        return `<b>${label}</b><br/>Peak Demand: <b>${this.y} kVA</b>`
      },
    },
  }

  const notApplicable = localViewMode === 'Day' || localViewMode === 'Week'

  return (
    <div className="relative bg-white p-4 rounded-lg shadow-md">
      {/* Heading */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-center flex-1">Peak Demand</h2>

        {/* Right controls */}
        <div className="flex items-center space-x-2 relative">
          {/* Year toggle */}
          <button
            onClick={() => setLocalViewMode('Year')}
            className={`px-3 py-1 text-sm rounded-md ${
              localViewMode === 'Year'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Year
          </button>

          {/* Info icon tooltip */}
          <div className="relative group">
            <AiOutlineInfoCircle
              className="ml-1 text-gray-500 cursor-pointer"
              size={18}
            />
            <div className="absolute right-0 bottom-full mb-1 w-64 bg-gray-800 text-white text-xs rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Viewmode "Day" and "Week" doesn't apply to this component. Peak Demand is available for Day, Month, and Year only.
            </div>
          </div>
        </div>
      </div>

      {/* Chart or message */}
      {notApplicable ? (
        <p className="text-gray-500 text-sm text-center">
          View mode "{localViewMode}" not applicable for Peak Demand.
        </p>
      ) : data.length === 0 ? (
        <p className="text-gray-500 text-sm text-center">No data available yet.</p>
      ) : (
        <HighchartsReact highcharts={Highcharts} options={options} />
      )}
    </div>
  )
}