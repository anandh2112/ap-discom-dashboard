import { useEffect, useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

// Disable Highcharts watermark globally
if (Highcharts?.Chart?.prototype?.credits) {
  Highcharts.Chart.prototype.credits = function () {}
}

export default function ConsumptionGraph({ scno, selectedDate, viewMode }) {
  const [consumptionData, setConsumptionData] = useState([])
  const [costData, setCostData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usingCache, setUsingCache] = useState(false)

  // Cache key depends on view mode
  const cacheKey = `consumption_graph_${scno}_${selectedDate}_${viewMode}`

  useEffect(() => {
    const fetchData = async () => {
      if (!scno) {
        setError('SCNO not provided.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setUsingCache(false)

      try {
        // --- Check for cached data first ---
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached)
          setConsumptionData(parsed.consumptionData || [])
          setCostData(parsed.costData || [])
          setUsingCache(true)
          setLoading(false)
        }

        let newConsumption = []
        let newCost = []

        if (viewMode === 'Week') {
          const url = `/api/fetchWeeklySumHourlyConsumptionCost?scno=${scno}&date=${selectedDate}`
          console.log('Fetching weekly data:', url)

          const resp = await fetch(url)
          if (!resp.ok) throw new Error(`HTTP Error: ${resp.status}`)
          const json = await resp.json()

          if (Array.isArray(json)) {
            newConsumption = json.map((d) => ({
              hour: d.hour,
              consumption: d.totalConsumption || 0,
            }))
            newCost = json.map((d) => ({
              hour: d.hour,
              cost: d.cost || 0,
            }))
          }
        } else if (viewMode === 'Month') {
          const url = `/api/fetchMonthlySumHourlyConsumptionCost?scno=${scno}&date=${selectedDate}`
          console.log('Fetching monthly data:', url)

          const resp = await fetch(url)
          if (!resp.ok) throw new Error(`HTTP Error: ${resp.status}`)
          const json = await resp.json()

          if (Array.isArray(json)) {
            newConsumption = json.map((d) => ({
              hour: d.hour,
              consumption: d.totalConsumption || 0,
            }))
            newCost = json.map((d) => ({
              hour: d.hour,
              cost: d.cost || 0,
            }))
          }
        } else {
          const consUrl = `/api/fetchHourlyConsumption?scno=${scno}&date=${selectedDate}`
          const costUrl = `/api/fetchHourlyConsCost?scno=${scno}&date=${selectedDate}`
          console.log('Fetching daily data:', consUrl, costUrl)

          const [consResp, costResp] = await Promise.all([
            fetch(consUrl),
            fetch(costUrl),
          ])

          if (!consResp.ok || !costResp.ok) {
            throw new Error(
              `HTTP Error - Consumption: ${consResp.status}, Cost: ${costResp.status}`
            )
          }

          const [consJson, costJson] = await Promise.all([
            consResp.json(),
            costResp.json(),
          ])

          newConsumption = Array.isArray(consJson) ? consJson : []
          newCost = Array.isArray(costJson) ? costJson : []
        }

        setConsumptionData(newConsumption)
        setCostData(newCost)
        setUsingCache(false)

        localStorage.setItem(
          cacheKey,
          JSON.stringify({ consumptionData: newConsumption, costData: newCost })
        )
      } catch (err) {
        console.error('Fetch error:', err)

        if (!navigator.onLine) {
          setError('Offline mode: showing cached data (if available).')
          if (!localStorage.getItem(cacheKey)) {
            setError('You are offline and no cached data is available.')
          }
        } else {
          setError(`Failed to fetch data. ${err.message}`)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [scno, selectedDate, viewMode])

  const getBarColor = (hour) => {
    if ((hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 21)) return '#F99B97'
    if ((hour >= 10 && hour <= 14) || (hour >= 0 && hour <= 5)) return '#A5D6A7'
    return '#FFD08C'
  }

  const getTimeSlot = (hour) => {
    if ((hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 21)) return 'Peak'
    if ((hour >= 10 && hour <= 14) || (hour >= 0 && hour <= 5)) return 'Off-Peak'
    return 'Normal'
  }

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))

  const consumptionSeries = consumptionData.length
    ? hours.map((h) => {
        const entry = consumptionData.find((d) => d.hour?.startsWith(h))
        return entry ? entry.consumption : 0
      })
    : Array(24).fill(0)

  const costSeries = costData.length
    ? hours.map((h) => {
        const entry = costData.find((d) => d.hour?.startsWith(h))
        return entry ? entry.cost : 0
      })
    : Array(24).fill(0)

  const barColors = hours.map((h) => getBarColor(parseInt(h)))

  const options = {
    chart: { height: 400, backgroundColor: 'transparent' },
    title: {
      text:
        viewMode === 'Week'
          ? 'Weekly Hourly Consumption & Cost'
          : viewMode === 'Month'
          ? 'Monthly Hourly Consumption & Cost'
          : 'Daily Hourly Consumption & Cost',
      style: { fontSize: '16px' },
    },
    xAxis: { categories: hours, title: { text: 'Hour of Day' } },
    yAxis: [
      { title: { text: 'Consumption (kWh)' }, opposite: false },
      { title: { text: 'Cost (₹)' }, opposite: true },
    ],
    tooltip: {
      shared: true,
      formatter: function () {
        const hour = this.x
        const cons = consumptionSeries[hour] || 0
        const cost = costSeries[hour] || 0
        const slot = getTimeSlot(parseInt(hour))
        return `<b>${hour}:00</b> (${slot})<br/>Consumption: <b>${cons.toFixed(
          2
        )} kWh</b><br/>Cost: <b>₹${cost.toFixed(2)}</b>`
      },
    },
    series: [
      {
        type: 'line',
        name: 'Consumption (kWh)',
        data: consumptionSeries,
        color: '#007bff',
        yAxis: 0,
        zIndex: 1,
        marker: { enabled: false },
      },
      {
        type: 'column',
        name: 'Cost (₹)',
        data: costSeries.map((val, idx) => ({
          y: val,
          color: barColors[idx],
        })),
        yAxis: 1,
        zIndex: 0,
      },
    ],
    credits: { enabled: false },
    legend: { enabled: false },
  }

  // --- Table calculations ---
  const totalConsumption = consumptionSeries.reduce((a, b) => a + b, 0)
  const peakConsumption = Math.max(...consumptionSeries)
  const lowConsumption = Math.min(...consumptionSeries)
  const peakPercentage = totalConsumption ? ((peakConsumption / totalConsumption) * 100).toFixed(1) : 0
  const lowPercentage = totalConsumption ? ((lowConsumption / totalConsumption) * 100).toFixed(1) : 0
  const avgConsumption = totalConsumption / 24

  if (loading) return <p className="text-gray-500 text-sm">Loading data...</p>
  if (error && !usingCache) return <p className="text-red-500 text-sm">{error}</p>
  if (consumptionData.length === 0 && costData.length === 0)
    return <p className="text-gray-500 text-sm">No data available for this date.</p>

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <HighchartsReact highcharts={Highcharts} options={options} />

      {/* Custom Legend */}
      <div className="flex items-center justify-center mt-3 space-x-4">
        <div className="flex items-center space-x-1">
          <span className="w-4 h-4 bg-blue-500 inline-block"></span>
          <span className="text-sm text-gray-700">Consumption (kWh)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-4 h-4 bg-[#F99B97] inline-block"></span>
          <span className="text-sm text-gray-700">Cost Peak (₹)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-4 h-4 bg-[#FFD08C] inline-block"></span>
          <span className="text-sm text-gray-700">Cost Normal (₹)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-4 h-4 bg-[#A5D6A7] inline-block"></span>
          <span className="text-sm text-gray-700">Cost Off-Peak (₹)</span>
        </div>
      </div>

      {/* Summary Table */}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full border border-gray-300 text-sm text-center">
          <thead className="bg-gray-100">
            <tr>
              <th rowSpan="2" className="border px-2 py-1">Average <br />Consumption (kW)</th>
              <th colSpan="2" className="border px-2 py-1">Peak</th>
              <th colSpan="2" className="border px-2 py-1">Low</th>
            </tr>
            <tr>
              <th className="border px-2 py-1">Value (kW)</th>
              <th className="border px-2 py-1">Percentage (%)</th>
              <th className="border px-2 py-1">Value (kW)</th>
              <th className="border px-2 py-1">Percentage (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-1">{avgConsumption.toFixed(2)}</td>
              <td className="border px-2 py-1">{peakConsumption.toFixed(2)}</td>
              <td className="border px-2 py-1">{peakPercentage}</td>
              <td className="border px-2 py-1">{lowConsumption.toFixed(2)}</td>
              <td className="border px-2 py-1">{lowPercentage}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
