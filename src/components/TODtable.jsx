export default function TODTable() {
  const data = [
    {
      consumer: "Consumer A",
      serviceNo: "S12345",
      peak1: { percent: 20, value: 400 },
      peak2: { percent: 15, value: 300 },
      normal: { percent: 35, value: 700 },
      offPeak: { percent: 30, value: 600 },
      savings: { amount: 1200, percent: 12 },
    },
    {
      consumer: "Consumer B",
      serviceNo: "S67890",
      peak1: { percent: 25, value: 500 },
      peak2: { percent: 20, value: 400 },
      normal: { percent: 30, value: 600 },
      offPeak: { percent: 25, value: 500 },
      savings: { amount: 950, percent: 9.5 },
    },
  ]

  return (
    <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md">
      <table className="w-full border border-gray-300 text-sm text-center">
        <thead>
          <tr className="bg-gray-100">
            <th rowSpan={2} className="border px-3 py-2">S.No</th>
            <th rowSpan={2} className="border px-3 py-2">Consumer</th>
            <th colSpan={2} className="border px-3 py-2">Peak-1</th>
            <th colSpan={2} className="border px-3 py-2">Peak-2</th>
            <th colSpan={2} className="border px-3 py-2">Normal</th>
            <th colSpan={2} className="border px-3 py-2">Off-Peak</th>
            <th rowSpan={2} className="border px-3 py-2">Max Savings (₹)</th>
          </tr>
          <tr className="bg-gray-100">
            {["Peak-1", "Peak-2", "Normal", "Off-Peak"].map((_, i) => (
              <>
                <th key={`percent-${i}`} className="border px-3 py-2">%</th>
                <th key={`value-${i}`} className="border px-3 py-2">Value (Wh)</th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              <td className="border px-3 py-2">{idx + 1}</td>
              <td className="border px-3 py-2 font-medium">
                {row.consumer} <span className="text-gray-500 text-xs">({row.serviceNo})</span>
              </td>
              <td className="border px-3 py-2">{row.peak1.percent}%</td>
              <td className="border px-3 py-2">{row.peak1.value}</td>
              <td className="border px-3 py-2">{row.peak2.percent}%</td>
              <td className="border px-3 py-2">{row.peak2.value}</td>
              <td className="border px-3 py-2">{row.normal.percent}%</td>
              <td className="border px-3 py-2">{row.normal.value}</td>
              <td className="border px-3 py-2">{row.offPeak.percent}%</td>
              <td className="border px-3 py-2">{row.offPeak.value}</td>
              <td className="border px-3 py-2 font-semibold">{row.savings.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
