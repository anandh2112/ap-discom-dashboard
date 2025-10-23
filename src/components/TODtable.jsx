export default function TODTable() {
  const data = [
    {
      consumer: "Consumer A",
      serviceNo: "S12345",
      peak1: { percent: 20, value: 400 },
      peak2: { percent: 15, value: 300 },
      normal: { percent: 35, value: 700 },
      offPeak: { percent: 30, value: 600 },
    },
    {
      consumer: "Consumer B",
      serviceNo: "S67890",
      peak1: { percent: 25, value: 500 },
      peak2: { percent: 20, value: 400 },
      normal: { percent: 30, value: 600 },
      offPeak: { percent: 25, value: 500 },
    },
  ]

  const getDominant = (row) => {
    const types = ["peak1", "peak2", "normal", "offPeak"]
    let dominant = types[0]
    types.forEach((type) => {
      if (row[type].value > row[dominant].value) dominant = type
    })
    const labelMap = {
      peak1: "Peak-1",
      peak2: "Peak-2",
      normal: "Normal",
      offPeak: "Off-Peak",
    }
    return labelMap[dominant]
  }

  return (
    <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md">
      <table className="w-full border border-gray-300 text-sm text-center">
        <thead>
          <tr className="bg-gray-100">
            <th rowSpan={2} className="border px-3 py-2">S.No</th>
            <th rowSpan={2} className="border px-3 py-2">Consumer</th>
            <th rowSpan={2} className="border px-3 py-2">Service No.</th>
            <th colSpan={2} className="border px-3 py-2">Peak-1</th>
            <th colSpan={2} className="border px-3 py-2">Peak-2</th>
            <th colSpan={2} className="border px-3 py-2">Normal</th>
            <th colSpan={2} className="border px-3 py-2">Off-Peak</th>
            <th rowSpan={2} className="border px-3 py-2">Dominant</th>
          </tr>
          <tr className="bg-gray-100">
            {["Peak-1", "Peak-2", "Normal", "Off-Peak"].map((_, i) => (
              <>
                <th key={`percent-${i}`} className="border px-3 py-2">%</th>
                <th key={`value-${i}`} className="border px-3 py-2">Value (wh)</th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              <td className="border px-3 py-2">{idx + 1}</td>
              <td className="border px-3 py-2">{row.consumer}</td>
              <td className="border px-3 py-2">{row.serviceNo}</td>
              <td className="border px-3 py-2">{row.peak1.percent}%</td>
              <td className="border px-3 py-2">{row.peak1.value}</td>
              <td className="border px-3 py-2">{row.peak2.percent}%</td>
              <td className="border px-3 py-2">{row.peak2.value}</td>
              <td className="border px-3 py-2">{row.normal.percent}%</td>
              <td className="border px-3 py-2">{row.normal.value}</td>
              <td className="border px-3 py-2">{row.offPeak.percent}%</td>
              <td className="border px-3 py-2">{row.offPeak.value}</td>
              <td className="border px-3 py-2 font-semibold">{getDominant(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
