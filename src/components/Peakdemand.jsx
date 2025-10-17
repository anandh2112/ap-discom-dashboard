import { useEffect, useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { AiOutlineInfoCircle } from 'react-icons/ai'

export default function PeakDemand({ scno, selectedDate, viewMode }) {
  const [data, setData] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [activeDayType, setActiveDayType] = useState('Mon-Fri')
  const [monthlyData, setMonthlyData] = useState(null)
  const [yearlyData, setYearlyData] = useState(null)
  const [yearEnabled, setYearEnabled] = useState(false)

  // Helper: cache key
  const getCacheKey = (mode, date, sc) =>
    `peakDemand_${mode}_${date}_${sc}`

  const saveToCache = (key, data) => {
    try {
      const payload = { data, timestamp: new Date().toISOString() }
      localStorage.setItem(key, JSON.stringify(payload))
    } catch (err) {
      console.warn('Failed to save cache:', err)
    }
  }

  const loadFromCache = (key) => {
    try {
      const cached = localStorage.getItem(key)
      if (!cached) return null
      const { data, timestamp } = JSON.parse(cached)
      const ageMinutes = (Date.now() - new Date(timestamp).getTime()) / 60000
      if (ageMinutes < 60) return data
      return null
    } catch {
      return null
    }
  }

  const fetchPeakDemand = async () => {
    if (!scno || !selectedDate) return
    setLoading(true)
    setOffline(false)

    const modeKey = yearEnabled ? 'Year' : viewMode
    const dateKey = yearEnabled
      ? new Date(selectedDate).getFullYear()
      : selectedDate
    const cacheKey = getCacheKey(modeKey, dateKey, scno)

    // Try cache first
    const cachedData = loadFromCache(cacheKey)
    if (cachedData) {
      if (yearEnabled) {
        setYearlyData(cachedData)
        updateDataFromDayType(cachedData, activeDayType)
      } else if (viewMode === 'Month') {
        setMonthlyData(cachedData)
        updateDataFromDayType(cachedData, activeDayType)
      } else {
        const hours = cachedData.map((item) =>
          item.hour.includes(':')
            ? item.hour.split(':')[0].padStart(2, '0')
            : item.hour
        )
        const values = cachedData.map((item) =>
          parseFloat(item.avgPeakDemand.toFixed(2))
        )
        setCategories(hours)
        setData(values)
        setMonthlyData(null)
      }
      setLoading(false)
    }

    try {
      if (yearEnabled) {
        const year = new Date(selectedDate).getFullYear()
        const response = await fetch(
          `/api/fetchYearlyHourlyAvgPeakDemand?scno=${scno}&year=${year}`
        )
        const res = await response.json()
        setYearlyData(res)
        saveToCache(cacheKey, res)
        updateDataFromDayType(res, activeDayType)
      } else if (viewMode === 'Month') {
        const monthString = selectedDate.slice(0, 7)
        const response = await fetch(
          `/api/fetchMonthlyHourlyAvgPeakDemand?scno=${scno}&month=${monthString}`
        )
        const res = await response.json()
        setMonthlyData(res)
        saveToCache(cacheKey, res)
        updateDataFromDayType(res, activeDayType)
      } else {
        const response = await fetch(
          `/api/fetchDailyHourlyAvgPeakDemand?scno=${scno}&date=${selectedDate}`
        )
        const res = await response.json()
        saveToCache(cacheKey, res)
        const hours = res.map((item) =>
          item.hour.includes(':')
            ? item.hour.split(':')[0].padStart(2, '0')
            : item.hour
        )
        const values = res.map((item) =>
          parseFloat(item.avgPeakDemand.toFixed(2))
        )
        setCategories(hours)
        setData(values)
        setMonthlyData(null)
      }
    } catch (error) {
      console.warn('Network unavailable, using cached data if available')
      setOffline(true)
      if (!cachedData) {
        setCategories([])
        setData([])
        setMonthlyData(null)
        setYearlyData(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const updateDataFromDayType = (dataset, dayType) => {
    const hours = Object.keys(dataset[dayType] || {})
    const values = Object.values(dataset[dayType] || {}).map((v) =>
      parseFloat(v.toFixed(2))
    )
    setCategories(hours.map((h) => h.split(':')[0].padStart(2, '0')))
    setData(values)
  }

  // Fetch data whenever relevant dependencies change
  useEffect(() => {
    fetchPeakDemand()
  }, [scno, selectedDate, viewMode, yearEnabled, activeDayType])

  const options = {
    chart: { type: 'area', height: 400 },
    title: { text: null },
    xAxis: {
      categories,
      title: { text: 'Hour of Day' },
      labels: { style: { fontSize: '11px' } },
    },
    yAxis: {
      title: { text: 'Average Peak Demand (kW)' },
      labels: { style: { fontSize: '11px' } },
      gridLineColor: '#f0f0f0',
    },
    series: [
      {
        name: 'Average Peak Demand',
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
        return `<b>${this.x}:00</b><br/>Average Peak Demand: <b>${this.y} kW</b>`
      },
    },
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* Header Row */}
      <div className="flex justify-center items-center mb-3 relative">
        {/* Centered Title */}
        <h2 className="text-base font-semibold text-gray-800 text-center w-full">
          Average Peak Demand
        </h2>

        {/* Top-right buttons */}
        <div className="absolute right-0 flex items-center gap-2">
          {/* Day toggles only for Month or Year */}
          {(viewMode === 'Month' || yearEnabled) &&
            ['Mon-Fri', 'Sat', 'Sun'].map((dayType) => (
              <button
                key={dayType}
                onClick={() => setActiveDayType(dayType)}
                className={`px-3 py-1 text-sm rounded-md transition-all hover:cursor-pointer ${
                  activeDayType === dayType
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dayType}
              </button>
            ))}

          {/* Year toggle */}
          <button
            onClick={() => setYearEnabled(!yearEnabled)}
            className={`px-3 py-1 text-sm rounded-md transition-all hover:cursor-pointer ${
              yearEnabled
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Year
          </button>

          {/* Info icon */}
          <div className="relative group">
            <AiOutlineInfoCircle className="ml-1 text-gray-500 cursor-pointer" size={18} />
            <div className="absolute right-0 bottom-full mb-1 w-64 bg-gray-800 text-white text-xs rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Viewmode "Week" doesn't apply to this component Average Peak Demand
            </div>
          </div>
        </div>
      </div>

      {/* Offline Notice */}
      {offline && (
        <div className="text-center text-yellow-600 text-sm mb-2">
          ⚠️ Offline mode: showing last cached data
        </div>
      )}

      {/* Chart / Loading / Empty States */}
      {loading ? (
        <p className="text-gray-500 text-sm text-center">
          Loading peak demand data...
        </p>
      ) : data.length === 0 ? (
        <p className="text-gray-500 text-sm text-center">
          No data available. Please check your connection.
        </p>
      ) : (
        <HighchartsReact highcharts={Highcharts} options={options} />
      )}
    </div>
  )
}
