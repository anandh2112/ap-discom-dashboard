import { useEffect, useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

// Disable Highcharts watermark globally
if (Highcharts?.Chart?.prototype?.credits) {
  Highcharts.Chart.prototype.credits = function () {}
}

export default function ConsumerTOD() {
  const [data, setData] = useState([])

  useEffect(() => {
    // Dummy consumption values
    setTimeout(() => {
      setData([
        { name: 'Peak Slot 1', y: 35 },
        { name: 'Peak Slot 2', y: 25 },
        { name: 'Regular', y: 30 },
        { name: 'Normal', y: 10 },
      ])
    }, 300)
  }, [])

  const todOptions = {
    chart: { type: 'pie', height: 400, backgroundColor: 'transparent' },
    title: { text: 'Consumer TOD', style: { fontSize: '16px', fontWeight: '600' } },
    tooltip: { pointFormat: '<b>{point.percentage:.1f}%</b> ({point.y} kW)' },
    accessibility: { point: { valueSuffix: '%' } },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: { enabled: false },
        showInLegend: true,
      },
    },
    legend: {
      align: 'center',
      verticalAlign: 'bottom',
      layout: 'horizontal',
      itemMarginTop: 5,
      itemMarginBottom: 5,
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
      <HighchartsReact highcharts={Highcharts} options={todOptions} />
    </div>
  )
}
