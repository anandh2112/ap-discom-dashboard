import { useState, useMemo, useEffect, useRef } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

// Disable Highcharts watermark globally
if (Highcharts?.Chart?.prototype?.credits) {
  Highcharts.Chart.prototype.credits = function () {}
}

const CACHE_PREFIX = 'peakDemandCache'
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours in ms

export default function PeakDemand({ scno, selectedDate, viewMode }) {
  const [localViewMode, setLocalViewMode] = useState(viewMode)
  const lastNonYearMode = useRef(viewMode)
  const [data, setData] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    setLocalViewMode(viewMode)
    if (viewMode !== 'Year') lastNonYearMode.current = viewMode
  }, [viewMode])

  // --- Offline detection ---
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const dateObj = new Date(selectedDate)
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const formattedMonth = `${year}-${month}`
  const formattedYear = `${year}`

  const getCacheKey = (mode, scno, dateKey) => `${CACHE_PREFIX}_${mode}_${scno}_${dateKey}`

  const saveCache = (key, payload) => {
    const cacheData = {
      timestamp: Date.now(),
      payload,
    }
    localStorage.setItem(key, JSON.stringify(cacheData))
  }

  const loadCache = (key) => {
    try {
      const cached = JSON.parse(localStorage.getItem(key))
      if (!cached) return null
      if (Date.now() - cached.timestamp > CACHE_TTL) {
        localStorage.removeItem(key)
        return null
      }
      return cached.payload
    } catch {
      return null
    }
  }

  // --- Fetch data with offline & cache fallback ---
  useEffect(() => {
    const fetchData = async () => {
      setError(null)

      const dateKey = localViewMode === 'Year' ? formattedYear : formattedMonth
      const cacheKey = getCacheKey(localViewMode, scno, dateKey)

      // Try loading from cache first
      const cachedData = loadCache(cacheKey)
      if (cachedData) {
        setCategories(cachedData.categories)
        setData(cachedData.data)
        setLoading(false)
        return
      }

      // If offline and no cached data
      if (isOffline) {
        setError('No cached data available while offline.')
        setCategories([])
        setData([])
        setLoading(false)
        return
      }

      // Only show loading if no previous data
      if (data.length === 0) setLoading(true)

      try {
        let fetchedCategories = []
        let fetchedData = []

        if (localViewMode === 'Month') {
          const res = await fetch(
            `https://ee.elementsenergies.com/api/fetchMonthWiseHVAIMP?scno=${scno}&month=${formattedMonth}`
          )
          const json = await res.json()
          const dailyData = json?.DailyHighestVA || {}

          const days = Object.keys(dailyData)
            .map((d) => parseInt(d.split('-')[2], 10))
            .filter((d) => !isNaN(d))
            .sort((a, b) => a - b)

          const values = days.map(
            (day) => dailyData[`${formattedMonth}-${String(day).padStart(2, '0')}`]
          )

          fetchedCategories = days.map(String) // convert to string for consistent X-axis
          fetchedData = values
        } else if (localViewMode === 'Year') {
          const res = await fetch(
            `https://ee.elementsenergies.com/api/fetchYearWiseHVAIMP?scno=${scno}&year=${formattedYear}`
          )
          const json = await res.json()
          const monthlyData = json?.MonthlyHighestVA || {}

          const monthsMap = {
            '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May',
            '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct',
            '11': 'Nov', '12': 'Dec',
          }

          const months = Object.keys(monthlyData)
            .map((m) => m.split('-')[1])
            .filter((m) => monthsMap[m])
            .sort((a, b) => parseInt(a) - parseInt(b))

          const values = months.map((m) => monthlyData[`${formattedYear}-${m}`])
          fetchedCategories = months.map((m) => monthsMap[m])
          fetchedData = values
        }

        setCategories(fetchedCategories)
        setData(fetchedData)
        saveCache(cacheKey, { categories: fetchedCategories, data: fetchedData })
      } catch (err) {
        console.error(err)
        setError('Failed to load data.')
        setCategories([])
        setData([])
      } finally {
        setLoading(false)
      }
    }

    if (localViewMode !== 'Day' && localViewMode !== 'Week') {
      fetchData()
    }
  }, [localViewMode, selectedDate, scno, isOffline, formattedMonth, formattedYear])

  const notApplicable = localViewMode === 'Day' || localViewMode === 'Week'

  // --- Chart options ---
  const options = useMemo(() => {
    const chartColor = notApplicable ? '#aed5ff' : '#007bff'

    return {
      chart: { type: 'area', height: 250 },
      title: { text: null },
      xAxis: {
        categories, // always use categories for consistent X-axis
        lineColor: '#00000000',
        tickLength: 0,
        gridLineWidth: 0,
        title: { text: localViewMode === 'Year' ? 'Month' : 'Day of Month' },
        labels: { style: { fontSize: '11px' } },
      },
      yAxis: {
        title: { text: 'Peak Demand (Va)' },
        labels: { style: { fontSize: '11px' } },
        gridLineColor: '#f0f0f0',
      },
      series: [
        {
          name: 'Peak Demand',
          data: data.map((v) => v || 0), // just values, categories handle X-axis
          color: chartColor,
          fillColor: chartColor + '33',
          lineWidth: 2,
          marker: { enabled: true, radius: 2 },
        },
      ],
      legend: { enabled: false },
      credits: { enabled: false },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#ccc',
        style: { fontSize: '12px' },
        formatter: function () {
          const label = categories[this.point.index]
          return `<b>${label}</b><br/>Peak Demand: <b>${this.y?.toLocaleString()} Va</b>`
        },
      },
    }
  }, [categories, data, localViewMode, notApplicable])

  const handleYearToggle = () => {
    if (localViewMode === 'Year') {
      setLocalViewMode(lastNonYearMode.current || viewMode)
    } else {
      if (localViewMode !== 'Year') lastNonYearMode.current = localViewMode
      setLocalViewMode('Year')
    }
  }

  return (
    <div className="relative bg-white p-3 rounded-lg shadow-md overflow-hidden">
      {isOffline && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-200 text-yellow-900 text-center py-1 text-sm z-10">
          You are currently offline. Showing cached data if available.
        </div>
      )}

      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-center flex-1">Peak Demand</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleYearToggle}
            className={`px-3 py-1 text-sm rounded-md hover:cursor-pointer ${
              localViewMode === 'Year'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-red-500 text-sm text-center">{error}</p>
      ) : data.length === 0 && !notApplicable ? (
        <p className="text-gray-500 text-sm text-center">No data available yet.</p>
      ) : (
        <div className="relative">
          <HighchartsReact highcharts={Highcharts} options={options} />

          {notApplicable && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg">
              <div className="bg-white px-4 py-2 rounded-md shadow-md text-sm text-gray-800 text-center">
                View mode "<b>{localViewMode}</b>" not applicable for Peak Demand.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
