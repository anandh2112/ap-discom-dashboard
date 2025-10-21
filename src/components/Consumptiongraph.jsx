import { useEffect, useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import Variance from './Variance' // ✅ New import

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
  const [graphType, setGraphType] = useState('consumption') // 'consumption' or 'cost'

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
          const url = `https://ee.elementsenergies.com/api/fetchWeeklySumHourlyConsumptionCost?scno=${scno}&date=${selectedDate}`
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
          const url = `https://ee.elementsenergies.com/api/fetchMonthlySumHourlyConsumptionCost?scno=${scno}&date=${selectedDate}`
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
          const consUrl = `https://ee.elementsenergies.com/api/fetchHourlyConsumption?scno=${scno}&date=${selectedDate}`
          const costUrl = `https://ee.elementsenergies.com/api/fetchHourlyConsCost?scno=${scno}&date=${selectedDate}`

          const [consResp, costResp] = await Promise.all([fetch(consUrl), fetch(costUrl)])
          if (!consResp.ok || !costResp.ok) throw new Error('HTTP Error fetching daily data')

          const [consJson, costJson] = await Promise.all([consResp.json(), costResp.json()])
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
    if ((hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 21)) return '#F77B72' // Peak
    if ((hour >= 10 && hour <= 14) || (hour >= 0 && hour <= 5)) return '#81C784' // Off-Peak
    return '#FFB74C' // Normal
  }

  const getTimeSlot = (hour) => {
    if ((hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 21)) return 'Peak'
    if ((hour >= 10 && hour <= 14) || (hour >= 0 && hour <= 5)) return 'Off-Peak'
    return 'Normal'
  }

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))

  const consumptionSeries = hours.map((h) => {
    const entry = consumptionData.find((d) => d.hour?.startsWith(h))
    return entry ? entry.consumption : 0
  })

  const costSeries = hours.map((h) => {
    const entry = costData.find((d) => d.hour?.startsWith(h))
    return entry ? entry.cost : 0
  })

  const barColors = hours.map((h) => getBarColor(parseInt(h)))

  const options = {
    chart: { type: 'column', height: 350, backgroundColor: 'transparent' },
    title: { text: '' },
    xAxis: { categories: hours, title: { text: 'Hour of Day' } },
    yAxis: { title: { text: graphType === 'consumption' ? 'Consumption (Wh)' : 'Cost (₹)' } },
    tooltip: {
      formatter: function () {
        const hour = this.x
        const val = graphType === 'consumption' ? consumptionSeries[hour] : costSeries[hour]
        const slot = getTimeSlot(parseInt(hour))
        return `<b>${hour}:00</b> (${slot})<br/><b>${
          graphType === 'consumption' ? 'Consumption' : 'Cost'
        }:</b> ${graphType === 'consumption' ? val.toFixed(2) + ' Wh' : '₹' + val.toFixed(2)}`
      },
    },
    series: [
      {
        name: graphType === 'consumption' ? 'Consumption (Wh)' : 'Cost (₹)',
        data: (graphType === 'consumption' ? consumptionSeries : costSeries).map((val, idx) => ({
          y: val,
          color: barColors[idx],
        })),
      },
    ],
    credits: { enabled: false },
    legend: { enabled: false },
  }

  if (loading) return <p className="text-gray-500 text-sm">Loading data...</p>
  if (error && !usingCache) return <p className="text-red-500 text-sm">{error}</p>
  if (consumptionData.length === 0 && costData.length === 0)
    return <p className="text-gray-500 text-sm">No data available for this date.</p>

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* Header with Toggle */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Hourly Consumption</h2>
        <div className="flex items-center gap-1 sm:gap-2">
          {['consumption', 'cost'].map((type) => (
            <button
              key={type}
              onClick={() => setGraphType(type)}
              className={`px-3 sm:px-4 py-1 rounded-lg border text-xs sm:text-sm font-semibold transition hover:cursor-pointer ${
                graphType === type
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
              }`}
            >
              {type === 'consumption' ? 'Wh' : '₹'}
            </button>
          ))}
        </div>
      </div>

      {/* Highcharts Graph */}
      <HighchartsReact highcharts={Highcharts} options={options} />

      {/* Dynamic Legend */}
      <div className="flex items-center justify-center mt-3 space-x-4">
        <div className="flex items-center space-x-1">
          <span className="w-4 h-4 bg-[#F77B72] inline-block"></span>
          <span className="text-sm text-gray-700">Peak Hours</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-4 h-4 bg-[#FFB74C] inline-block"></span>
          <span className="text-sm text-gray-700">Normal Hours</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-4 h-4 bg-[#81C784] inline-block"></span>
          <span className="text-sm text-gray-700">Off-Peak Hours</span>
        </div>
      </div>

      {/* ✅ New Variance Component */}
      <Variance
        viewMode={viewMode}
        scno={scno}
        selectedDate={selectedDate}
      />
    </div>
  )
}
