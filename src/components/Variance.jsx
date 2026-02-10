import { useEffect, useState } from 'react'

export default function Variance({ viewMode, scno, selectedDate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  const CACHE_EXPIRY = 60 * 60 * 1000 // 60 minutes

  // Listen for online/offline changes
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

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        let url = ''
        if (viewMode === 'Day') {
          url = `https://ee.elementsenergies.com/api/fetchDaywiseHighLowAvg1?scno=${scno}&date=${selectedDate}`
        } else if (viewMode === 'Week') {
          url = `https://ee.elementsenergies.com/api/fetchWeeklyHighLowAvg1?scno=${scno}&date=${selectedDate}`
        } else if (viewMode === 'Month') {
          url = `https://ee.elementsenergies.com/api/fetchMonthlyHighLowAvg1?scno=${scno}&date=${selectedDate}`
        } else {
          throw new Error('Invalid viewMode')
        }

        const cacheKey = `${url}_cache`
        const cached = localStorage.getItem(cacheKey)

        if (cached) {
          const parsed = JSON.parse(cached)
          const isExpired = Date.now() - parsed.timestamp > CACHE_EXPIRY
          if (!isExpired) {
            console.log('Loaded variance data from cache')
            setData(parsed.data)
            setLoading(false)
            if (isOffline) return
          }
        }

        if (!isOffline) {
          const resp = await fetch(url)
          if (!resp.ok) throw new Error(`HTTP Error: ${resp.status}`)
          const json = await resp.json()
          setData(json)
          localStorage.setItem(cacheKey, JSON.stringify({ data: json, timestamp: Date.now() }))
        } else if (!cached) {
          throw new Error('No cached data available and offline')
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setError('Failed to fetch variance data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [viewMode, scno, selectedDate, isOffline])

  if (loading)
    return <p className="text-gray-500 text-sm mt-2">Loading variance data...</p>
  if (error)
    return <p className="text-red-500 text-sm mt-2">{error}</p>
  if (!data)
    return <p className="text-gray-500 text-sm mt-2">No variance data available.</p>

  const avgConsumption = data.average?.consumption || 0
  const peakConsumption = data.high?.consumption || 0
  const peakPercentage = data.high?.percent_increase_from_avg || 0
  const peakHour = data.high?.hour || ''
  const lowConsumption = data.low?.consumption || 0
  const lowPercentage = data.low?.percent_decrease_from_avg || 0
  const lowHour = data.low?.hour || ''

  return (
    <div className="overflow-x-auto mt-4 relative">
      {/* ⚠️ Offline Banner */}
      {isOffline && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-md shadow-sm">
          ⚠️ Offline mode — showing cached data
        </div>
      )}

      <table className="min-w-full border border-gray-300 text-sm text-center">
        <thead className="bg-gray-100">
          <tr>
            <th rowSpan="2" className="border px-2 py-1">
              Average <br />Consumption (kWh)
            </th>
            <th colSpan="2" className="border px-2 py-1">
              Peak ({peakHour})
            </th>
            <th colSpan="2" className="border px-2 py-1">
              Low ({lowHour})
            </th>
          </tr>
          <tr>
            <th className="border px-2 py-1">Value (kWh)</th>
            <th className="border px-2 py-1">Variance (%)</th>
            <th className="border px-2 py-1">Value (kWh)</th>
            <th className="border px-2 py-1">Variance (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">{avgConsumption.toFixed(2)}</td>
            <td className="border px-2 py-1">{peakConsumption.toFixed(2)}</td>
            <td className="border px-2 py-1">
              {peakPercentage.toFixed(2)} <span className="text-green-600">▲</span>
            </td>
            <td className="border px-2 py-1">{lowConsumption.toFixed(2)}</td>
            <td className="border px-2 py-1">
              {lowPercentage.toFixed(2)} <span className="text-red-600">▼</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
