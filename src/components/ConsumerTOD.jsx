import { useEffect, useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

// Disable Highcharts watermark globally
if (Highcharts?.Chart?.prototype?.credits) {
  Highcharts.Chart.prototype.credits = function () {}
}

export default function ConsumerTOD({ scno, selectedDate, viewMode }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  const CACHE_EXPIRY = 60 * 60 * 1000 // 60 minutes

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

  useEffect(() => {
    if (!scno || !selectedDate) return

    const fetchTODData = async () => {
      setLoading(true)
      setError(null)

      try {
        let url = ''
        if (viewMode === 'Day') {
          url = `https://ee.elementsenergies.com/api/fetchDailyTariffBasedConsumption?scno=${scno}&date=${selectedDate}`
        } else if (viewMode === 'Week') {
          url = `https://ee.elementsenergies.com/api/fetchWeeklyTariffBasedConsumption?scno=${scno}&date=${selectedDate}`
        } else if (viewMode === 'Month') {
          url = `https://ee.elementsenergies.com/api/fetchMonthlyTariffBasedConsumption?scno=${scno}&date=${selectedDate}`
        } else {
          console.warn(`Unsupported viewMode: ${viewMode}`)
          setData([])
          setLoading(false)
          return
        }

        const cacheKey = `${url}_cache`
        const cached = localStorage.getItem(cacheKey)

        if (cached) {
          const parsed = JSON.parse(cached)
          const isExpired = Date.now() - parsed.timestamp > CACHE_EXPIRY
          if (!isExpired) {
            console.log('Loaded TOD data from cache')
            setData(parsed.data)
            setLoading(false)
            if (isOffline) return
          }
        }

        if (!isOffline) {
          const response = await fetch(url)
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
          const result = await response.json()

          const formattedData = Object.entries(result).map(([name, value]) => ({
            name,
            y: Number(value),
          }))

          setData(formattedData)
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ data: formattedData, timestamp: Date.now() })
          )
        } else if (!cached) {
          throw new Error('No cached data available and offline')
        }
      } catch (err) {
        console.error('Failed to fetch TOD data:', err)
        setError('Failed to load TOD data.')
      } finally {
        setLoading(false)
      }
    }

    fetchTODData()
  }, [scno, selectedDate, viewMode, isOffline])

  const todOptions = {
    chart: { type: 'pie', height: 300, backgroundColor: 'transparent' },
    title: { text: '' }, // ❌ Remove chart title
    tooltip: { pointFormat: '<b>{point.percentage:.1f}%</b> ({point.y:.2f} Wh)' },
    accessibility: { point: { valueSuffix: '%' } },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: { enabled: false },
        showInLegend: true,
        center: ['40%', '50%'],
      },
    },
    legend: {
      align: 'right',
      verticalAlign: 'middle',
      layout: 'vertical',
      itemMarginTop: 10,
      itemMarginBottom: 10,
      itemStyle: { fontSize: '12px', fontWeight: '400' },
    },
    series: [
      {
        name: 'TOD Split',
        colorByPoint: true,
        data: data,
        colors: ['#FF8042', '#0088FE', '#00C49F', '#FFBB28'],
      },
    ],
    credits: { enabled: false },
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-full relative">
      {/* ⚠️ Offline Banner */}
      {isOffline && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-md shadow-sm">
          ⚠️ Offline mode — showing cached data
        </div>
      )}

      {/* 📌 Separate Header */}
      <h3 className="text-lg font-semibold mb-8 text-center">Consumer TOD</h3>

      {loading ? (
        <div className="text-center text-gray-500 text-sm py-10">
          Loading TOD data...
        </div>
      ) : error ? (
        <div className="text-center text-red-500 text-sm py-10">{error}</div>
      ) : data.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-10">
          No TOD data available.
        </div>
      ) : (
        <HighchartsReact highcharts={Highcharts} options={todOptions} />
      )}
    </div>
  )
}
