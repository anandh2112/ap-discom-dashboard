import { useEffect, useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

export default function PeakDemand({ scno, selectedDate, viewMode }) {
  const [data, setData] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [activeDayType, setActiveDayType] = useState('Mon-Fri')
  const [monthlyData, setMonthlyData] = useState(null)

  // Helper: cache key
  const getCacheKey = (mode, date, sc) => `peakDemand_${mode}_${date}_${sc}`

  // Save data to localStorage cache
  const saveToCache = (key, data) => {
    try {
      const payload = {
        data,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem(key, JSON.stringify(payload))
    } catch (err) {
      console.warn('Failed to save cache:', err)
    }
  }

  // Load data from localStorage cache
  const loadFromCache = (key) => {
    try {
      const cached = localStorage.getItem(key)
      if (!cached) return null
      const { data, timestamp } = JSON.parse(cached)
      const ageMinutes = (Date.now() - new Date(timestamp).getTime()) / 60000
      // Use cache if data < 60 mins old
      if (ageMinutes < 60) return data
      return null
    } catch {
      return null
    }
  }

  // Fetch data (daily or monthly)
  useEffect(() => {
    if (!scno || !selectedDate) return
    const cacheKey = getCacheKey(viewMode, selectedDate, scno)

    const fetchPeakDemand = async () => {
      setLoading(true)
      setOffline(false)

      // Try cache first
      const cachedData = loadFromCache(cacheKey)
      if (cachedData) {
        if (viewMode === 'Month') {
          setMonthlyData(cachedData)
          const hours = Object.keys(cachedData['Mon-Fri'] || {})
          const values = Object.values(cachedData['Mon-Fri'] || {}).map((v) =>
            parseFloat(v.toFixed(2))
          )
          setCategories(hours.map((h) => h.split(':')[0].padStart(2, '0')))
          setData(values)
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
        }
        setLoading(false)
      }

      try {
        if (viewMode === 'Month') {
          const monthString = selectedDate.slice(0, 7)
          const response = await fetch(
            `/api/fetchMonthlyHourlyAvgPeakDemand?scno=${scno}&month=${monthString}`
          )
          const res = await response.json()
          setMonthlyData(res)
          saveToCache(cacheKey, res)

          const hours = Object.keys(res['Mon-Fri'] || {})
          const values = Object.values(res['Mon-Fri'] || {}).map((v) =>
            parseFloat(v.toFixed(2))
          )
          setCategories(hours.map((h) => h.split(':')[0].padStart(2, '0')))
          setData(values)
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
        // If cache exists, data is already displayed
        if (!cachedData) {
          setCategories([])
          setData([])
          setMonthlyData(null)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPeakDemand()
  }, [scno, selectedDate, viewMode])

  // Update data when toggling Mon-Fri / Sat / Sun in Month mode
  useEffect(() => {
    if (viewMode !== 'Month' || !monthlyData) return
    const hours = Object.keys(monthlyData[activeDayType] || {})
    const values = Object.values(monthlyData[activeDayType] || {}).map((v) =>
      parseFloat(v.toFixed(2))
    )
    setCategories(hours.map((h) => h.split(':')[0].padStart(2, '0')))
    setData(values)
  }, [activeDayType, monthlyData, viewMode])

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

        {/* Right-aligned Toggle Buttons (for Month view) */}
        {viewMode === 'Month' && (
          <div className="absolute right-0 flex gap-2">
            {['Mon-Fri', 'Sat', 'Sun'].map((dayType) => (
              <button
                key={dayType}
                onClick={() => setActiveDayType(dayType)}
                className={`px-3 py-1 text-sm rounded-md transition-all ${
                  activeDayType === dayType
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dayType}
              </button>
            ))}
          </div>
        )}
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
