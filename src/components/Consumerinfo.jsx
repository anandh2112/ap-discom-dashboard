import { useEffect, useState } from 'react'

export default function ConsumerInfo({ consumerName, scno, selectedDate, viewMode }) {
  const [data, setData] = useState({ Consumption: null, Cost: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch data only if Day, Week, or Month view is selected
    if ((viewMode === 'Day' || viewMode === 'Week' || viewMode === 'Month') && selectedDate) {
      const fetchData = async () => {
        setLoading(true)
        setError(null)

        const cacheKey = `${scno}_${viewMode}_${selectedDate}`
        const cachedItem = localStorage.getItem(cacheKey)

        // Check if valid cache exists (not older than 12 hours)
        if (cachedItem) {
          const parsed = JSON.parse(cachedItem)
          const isExpired = Date.now() - parsed.timestamp > 12 * 60 * 60 * 1000 // 12 hours
          if (!isExpired) {
            setData(parsed.data)
            setLoading(false)
            return
          } else {
            localStorage.removeItem(cacheKey)
          }
        }

        // Choose API endpoint based on view mode
        const endpoint =
          viewMode === 'Day'
            ? 'https://ee.elementsenergies.com/api/fetchDaywiseTotalConsCost'
            : viewMode === 'Week'
            ? 'https://ee.elementsenergies.com/api/fetchWeekwiseTotalConsCost'
            : 'https://ee.elementsenergies.com/api/fetchMonthwiseTotalConsCost'

        // If offline, try using cached data
        if (!navigator.onLine) {
          if (cachedItem) {
            const parsed = JSON.parse(cachedItem)
            setData(parsed.data)
            setError('Offline: showing cached data')
          } else {
            setError('Offline: no cached data available')
          }
          setLoading(false)
          return
        }

        // Fetch fresh data if online
        try {
          const response = await fetch(`${endpoint}?scno=${scno}&date=${selectedDate}`)
          if (!response.ok) throw new Error('Failed to fetch data')
          const result = await response.json()

          const newData = { Consumption: result.Consumption, Cost: result.Cost }
          setData(newData)

          // Save to cache with timestamp
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ data: newData, timestamp: Date.now() })
          )
        } catch (err) {
          console.error(err)
          setError('Error fetching data')
        } finally {
          setLoading(false)
        }
      }

      fetchData()
    }
  }, [scno, selectedDate, viewMode])

  const infoCards = [
    {
      title: 'Consumer',
      value: (
        <div className="flex flex-col">
          <span className="text-gray-900 text-sm font-semibold">
            {consumerName} ({scno})
          </span>
        </div>
      ),
    },
    {
      title: 'Consumption (kWh)',
      value:
        viewMode === 'Day' || viewMode === 'Week' || viewMode === 'Month'
          ? loading
            ? 'Loading...'
            : error
            ? error
            : data.Consumption?.toLocaleString() || '-'
          : '420',
    },
    {
      title: 'Cost (₹)',
      value:
        viewMode === 'Day' || viewMode === 'Week' || viewMode === 'Month'
          ? loading
            ? 'Loading...'
            : error
            ? error
            : data.Cost?.toLocaleString() || '-'
          : '12,500',
    },
    {
      title: 'Carbon Footprint (kg CO₂)',
      value:
        viewMode === 'Day' || viewMode === 'Week' || viewMode === 'Month'
          ? loading
            ? 'Calculating...'
            : error
            ? error
            : data.Consumption
            ? (data.Consumption * 0.82).toLocaleString(undefined, { maximumFractionDigits: 2 })
            : '-'
          : '35 kg',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {infoCards.map((card, index) => (
        <div
          key={index}
          className="bg-white shadow-md rounded-xl p-2 border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-lg transition-all"
        >
          <h3 className="text-gray-500 text-xs font-medium">{card.title}</h3>
          <div className="mt-1 font-semibold">{card.value}</div>
        </div>
      ))}
    </div>
  )
}