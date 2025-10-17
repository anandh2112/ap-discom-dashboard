import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

export default function Overview() {
  // --- Chart Options ---

  // 1. Consumers - Variance (Bar Chart)
  const varianceOptions = {
    chart: { type: 'column', height: 250 },
    title: { text: 'Consumers - Variance', style: { fontSize: '16px' } },
    xAxis: { categories: ['High', 'Average', 'Low'] },
    yAxis: { title: { text: 'Metric' } },
    series: [
      {
        name: 'Variance',
        data: [120, 80, 45],
        colorByPoint: true,
        colors: ['#FF6B6B', '#FFD93D', '#6BCB77'],
      },
    ],
    legend: { enabled: false },
    credits: { enabled: false },
  }

  // 2. Consumers - TOD (Pie Chart with legend centered vertically)
  const todOptions = {
    chart: { type: 'pie', height: 250 },
    title: { text: 'Consumption - TOD', style: { fontSize: '16px' } },
    tooltip: { pointFormat: '<b>{point.percentage:.1f}%</b> ({point.y})' },
    accessibility: { point: { valueSuffix: '%' } },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: { enabled: false }, // removes lines
        showInLegend: true, // enable legend
      },
    },
    legend: {
      align: 'right',
      verticalAlign: 'middle',
      layout: 'vertical',
      itemMarginTop: 10,
      itemMarginBottom: 5,
      y: 15,
      x: -10,
    },
    series: [
      {
        name: 'TOD Split',
        colorByPoint: true,
        data: [
          { name: 'Peak Slot 1', y: 35 },
          { name: 'Peak Slot 2', y: 25 },
          { name: 'Regular', y: 30 },
          { name: 'Normal', y: 10 },
        ],
      },
    ],
    credits: { enabled: false },
  }

  // 3. Consumers - Tariff (Stacked Bar Chart)
  const tariffOptions = {
    chart: { type: 'bar', height: 250 },
    title: { text: 'Consumers - Tariff', style: { fontSize: '16px' } },
    xAxis: { categories: ['Tariff Category'] },
    yAxis: {
      min: 0,
      title: { text: 'Total (%)' },
      labels: { format: '{value}%' },
    },
    legend: { reversed: true },
    plotOptions: {
      series: { stacking: 'percent' },
    },
    series: [
      { name: 'High', data: [45], color: '#FF6B6B' },
      { name: 'Regular', data: [35], color: '#FFD93D' },
      { name: 'Low', data: [20], color: '#6BCB77' },
    ],
    credits: { enabled: false },
  }

  // 4. Consumer Category Breakdown (Horizontal Stacked Bars)
  const categoryOptions = {
    chart: { type: 'bar', height: 300 },
    title: { text: 'Consumer Category Breakdown', style: { fontSize: '16px' } },
    xAxis: {
      categories: ['Agricultural', 'Commercial', 'Domestic', 'Industry', 'Institute'],
      title: { text: null },
    },
    yAxis: {
      min: 0,
      max: 100,
      tickInterval: 25,
      title: { text: 'Percentage (%)' },
    },
    legend: { reversed: true },
    plotOptions: {
      series: {
        stacking: 'percent',
        dataLabels: { enabled: true, format: '{point.y}%' },
      },
    },
    series: [
      { name: '1 PH', data: [20, 25, 15, 10, 30], color: '#6BCB77' },
      { name: '3 PH WC', data: [30, 20, 25, 20, 25], color: '#FFD93D' },
      { name: '3 PH 4CT', data: [25, 30, 35, 40, 25], color: '#4D96FF' },
      { name: 'HT', data: [25, 25, 25, 30, 20], color: '#FF6B6B' },
    ],
    credits: { enabled: false },
  }

  // --- Render ---
  return (
    <div className="p-1 space-y-4">
      {/* Mini cards (Top row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {['Active Consumers', 'Total Consumption', 'Peak Demand', 'Energy Savings'].map(
          (title, i) => (
            <div
              key={i}
              className="bg-white shadow-md rounded-2xl p-1 flex items-center justify-center gap-5"
            >
              <p className="text-gray-500 text-xs">{title}</p>
              <h2 className="text-sm font-semibold">
                {i === 0 ? '1,240' : i === 1 ? '8,650 kWh' : i === 2 ? '430 kW' : '12.5%'}
              </h2>
            </div>
          )
        )}
      </div>

      {/* Graphs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Variance Bar */}
        <div className="bg-white shadow-md rounded-2xl p-3">
          <HighchartsReact highcharts={Highcharts} options={varianceOptions} />
        </div>

        {/* TOD Pie (legend vertically centered) */}
        <div className="bg-white shadow-md rounded-2xl p-3 flex justify-center items-center">
          <HighchartsReact highcharts={Highcharts} options={todOptions} />
        </div>

        {/* Tariff Stacked Bar */}
        <div className="bg-white shadow-md rounded-2xl p-3">
          <HighchartsReact highcharts={Highcharts} options={tariffOptions} />
        </div>
      </div>

      {/* New Card - Category Breakdown and Table */}
      <div className="bg-white shadow-md rounded-2xl p-4 flex justify-between w-[100%]">
        {/* Left: Horizontal Stacked Bar */}
        <div className="w-[35%]">
          <HighchartsReact highcharts={Highcharts} options={categoryOptions} />
        </div>

        {/* Right: Table */}
        <div className="overflow-x-auto w-[63%]">
          <table className="min-w-full border border-gray-300 text-sm text-left">
            <thead>
              <tr>
                <th rowSpan="2" className="border p-2 bg-gray-100 text-center">
                  Category
                </th>
                <th colSpan="2" className="border p-2 bg-gray-100 text-center">
                  1 PH
                </th>
                <th colSpan="2" className="border p-2 bg-gray-100 text-center">
                  3 PH WC
                </th>
                <th colSpan="2" className="border p-2 bg-gray-100 text-center">
                  3 PH 4CT
                </th>
                <th colSpan="2" className="border p-2 bg-gray-100 text-center">
                  HT
                </th>
                <th rowSpan="2" className="border p-2 bg-gray-100 text-center">
                  Total
                </th>
              </tr>
              <tr>
                {Array(4)
                  .fill(['Total', 'Covered'])
                  .flat()
                  .map((label, i) => (
                    <th key={i} className="border p-2 bg-gray-50 text-center">
                      {label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {['Agri', 'Commercial', 'Domestic', 'Industry', 'Institute', 'Total'].map(
                (cat, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border p-2">{cat}</td>
                    {Array(9)
                      .fill(0)
                      .map((_, j) => (
                        <td key={j} className="border p-2 text-center">
                          {Math.floor(Math.random() * 100)}
                        </td>
                      ))}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
