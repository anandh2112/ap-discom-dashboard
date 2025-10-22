export default function VarianceTable() {
  const dummyData = [
    {
      consumer: "Consumer A",
      average: 420,
      peak: { hour: "14:00", value: 520, percent: "+5%" },
      low: { hour: "03:00", value: 300, percent: "-8%" },
    },
    {
      consumer: "Consumer B",
      average: 380,
      peak: { hour: "16:30", value: 480, percent: "+4%" },
      low: { hour: "05:30", value: 290, percent: "-6%" },
    },
    {
      consumer: "Consumer C",
      average: 450,
      peak: { hour: "13:15", value: 540, percent: "+7%" },
      low: { hour: "02:45", value: 310, percent: "-9%" },
    },
  ]

  return (
    <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md">
      <table className="min-w-full border border-gray-300 rounded-lg text-sm text-center">
        <thead className="bg-gray-200">
          <tr>
            <th rowSpan="2" className="border px-3 py-2 align-middle">
              S No
            </th>
            <th rowSpan="2" className="border px-3 py-2 align-middle">
              Consumer
            </th>
            <th rowSpan="2" className="border px-3 py-2 align-middle">
              Average
            </th>
            <th colSpan="3" className="border px-3 py-2">
              Peak
            </th>
            <th colSpan="3" className="border px-3 py-2">
              Low
            </th>
          </tr>
          <tr>
            <th className="border px-3 py-2">Hour</th>
            <th className="border px-3 py-2">Value</th>
            <th className="border px-3 py-2">% <span className="text-green-600">▲</span></th>
            <th className="border px-3 py-2">Hour</th>
            <th className="border px-3 py-2">Value</th>
            <th className="border px-3 py-2">% <span className="text-red-600">▼</span></th>
          </tr>
        </thead>
        <tbody>
          {dummyData.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="border px-3 py-2">{i + 1}</td>
              <td className="border px-3 py-2">{row.consumer}</td>
              <td className="border px-3 py-2">{row.average}</td>

              {/* Peak Columns */}
              <td className="border px-3 py-2">{row.peak.hour}</td>
              <td className="border px-3 py-2">{row.peak.value}</td>
              <td className="border px-3 py-2">{row.peak.percent}</td>

              {/* Low Columns */}
              <td className="border px-3 py-2">{row.low.hour}</td>
              <td className="border px-3 py-2">{row.low.value}</td>
              <td className="border px-3 py-2">{row.low.percent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
