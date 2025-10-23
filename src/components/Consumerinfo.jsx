import { useEffect, useState } from 'react'

export default function ConsumerInfo({ consumerName, scno, selectedDate, viewMode }) {
  const [data, setData] = useState({ Consumption: null, Cost: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch data only if Day or Week view is selected
    if ((viewMode === 'Day' || viewMode === 'Week') && selectedDate) {
      const fetchData = async () => {
        setLoading(true)
        setError(null)

        // Choose API endpoint based on view mode
        const endpoint =
          viewMode === 'Day'
            ? 'https://ee.elementsenergies.com/api/fetchDaywiseTotalConsCost'
            : 'https://ee.elementsenergies.com/api/fetchWeekwiseTotalConsCost'

        try {
          const response = await fetch(`${endpoint}?scno=${scno}&date=${selectedDate}`)
          if (!response.ok) throw new Error('Failed to fetch data')
          const result = await response.json()
          setData({ Consumption: result.Consumption, Cost: result.Cost })
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
      title: 'Consumption (Wh)',
      value:
        viewMode === 'Day' || viewMode === 'Week'
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
        viewMode === 'Day' || viewMode === 'Week'
          ? loading
            ? 'Loading...'
            : error
            ? error
            : data.Cost?.toLocaleString() || '-'
          : '12,500',
    },
    { title: 'CO₂ Emissions', value: '35 kg' },
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
