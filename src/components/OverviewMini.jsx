import { useEffect, useState } from "react"

export default function OverviewMini() {
  const [cards, setCards] = useState([
    { title: "Active Consumers", value: "..." },
    { title: "Total Consumption", value: "..." },
    { title: "Peak Demand", value: "..." },
    { title: "Carbon Footprint", value: "..." },
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const CACHE_KEY = "overviewMiniCache"
  const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000 // 12 hours

  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const parsed = JSON.parse(cached)
      const now = new Date().getTime()
      if (now - parsed.timestamp < CACHE_EXPIRY_MS) {
        return parsed.data
      } else {
        localStorage.removeItem(CACHE_KEY)
        return null
      }
    } catch {
      return null
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      // Try cache first
      const cachedData = loadFromCache()
      if (cachedData) {
        setCards(cachedData)
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          "https://ee.elementsenergies.com/api/fetchOverviewMiniCard"
        )
        if (!response.ok) {
          throw new Error("Network response was not ok")
        }
        const data = await response.json()

        const formattedCards = [
          { title: "Active Consumers", value: data.ActiveConsumers.toLocaleString() },
          {
            title: "Total Consumption",
            value: `${data.TotalConsumption_mWh.toLocaleString()} MWh`,
          },
          { title: "Peak Demand", value: `-` },
          {
            title: "Carbon Footprint",
            value: `${(data.TotalConsumption_mWh * 0.82).toFixed(2)} tons CO₂`,
          },
        ]

        // Save to cache
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: formattedCards, timestamp: new Date().getTime() })
        )

        setCards(formattedCards)
      } catch (err) {
        console.error(err)
        // If offline, try cache
        const cachedOffline = loadFromCache()
        if (cachedOffline) {
          setCards(cachedOffline)
        } else {
          setError("Failed to fetch data and no cached data available")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <p>Loading overview...</p>
  if (error) return <p>{error}</p>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-white shadow-md rounded-2xl p-1 flex items-center justify-center gap-5"
        >
          <p className="text-gray-500 text-xs">{card.title}</p>
          <h2 className="text-sm font-semibold">{card.value}</h2>
        </div>
      ))}
    </div>
  )
}