import { useEffect, useState } from 'react'

export default function ConsumerInfo({ consumerName, scno, selectedDate, viewMode }) {
  const [dayData, setDayData] = useState({ Consumption: null, Cost: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch day-wise data only if viewMode is "Day"
    if (viewMode === 'Day' && selectedDate) {
      const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
          const response = await fetch(
            `https://ee.elementsenergies.com/api/fetchDaywiseTotalConsCost?scno=${scno}&date=${selectedDate}`
          )
          if (!response.ok) throw new Error('Failed to fetch data')
          const data = await response.json()
          setDayData({ Consumption: data.Consumption, Cost: data.Cost })
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

  // Prepare cards
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
        viewMode === 'Day'
          ? loading
            ? 'Loading...'
            : error
            ? error
            : dayData.Consumption?.toLocaleString() || '-'
          : '420',
    },
    {
      title: 'Cost (₹)',
      value:
        viewMode === 'Day'
          ? loading
            ? 'Loading...'
            : error
            ? error
            : dayData.Cost?.toLocaleString() || '-'
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
