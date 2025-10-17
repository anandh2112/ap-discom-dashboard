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

  useEffect(() => {
    if (!scno || !selectedDate) return

    const fetchTODData = async () => {
      setLoading(true)
      setError(null)

      try {
        let url = ''

        // For now, only "Day" viewMode is supported
        if (viewMode === 'Day') {
          url = `/api/fetchDailyTariffBasedConsumption?scno=${scno}&date=${selectedDate}`
        } else {
          console.warn(`Unsupported viewMode: ${viewMode}`)
          setData([])
          setLoading(false)
          return
        }

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const result = await response.json()

        // Transform API result into Highcharts-compatible format
        const formattedData = Object.entries(result).map(([name, value]) => ({
          name,
          y: Number(value),
        }))

        setData(formattedData)
      } catch (err) {
        console.error('Failed to fetch TOD data:', err)
        setError('Failed to load TOD data.')
      } finally {
        setLoading(false)
      }
    }

    fetchTODData()
  }, [scno, selectedDate, viewMode])

  const todOptions = {
    chart: { type: 'pie', height: 350, backgroundColor: 'transparent' },
    title: {
      text: 'Consumer TOD',
      style: { fontSize: '16px', fontWeight: '600' },
    },
    tooltip: { pointFormat: '<b>{point.percentage:.1f}%</b> ({point.y:.2f} kWh)' },
    accessibility: { point: { valueSuffix: '%' } },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: { enabled: false },
        showInLegend: true,
        center: ['40%', '50%'], // shift pie slightly left to make room for legend
      },
    },
    legend: {
      align: 'right',
      verticalAlign: 'middle',
      layout: 'vertical',
      itemMarginTop: 10,
      itemMarginBottom: 10,
      itemStyle: {
        fontSize: '12px',
        fontWeight: '400',
      },
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
    <div className="bg-white p-4 rounded-lg shadow-md h-full">
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
