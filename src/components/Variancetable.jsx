import React, { useEffect, useState } from "react"

export default function VarianceTable() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("https://ee.elementsenergies.com/api/fetchAllHighLowAvg")
        if (!res.ok) throw new Error("Failed to fetch data")
        const json = await res.json()

        // Transform API data into desired table format
        const formatted = Object.entries(json).map(([scno, item]) => ({
          consumer: item.name,
          serviceNo: scno,
          average: item.average?.consumption?.toFixed(2) || 0,
          peak: {
            hour: item.high?.hour || "-",
            value: item.high?.consumption?.toFixed(2) || 0,
            percent: item.high?.percent_increase_from_avg
              ? `+${item.high.percent_increase_from_avg.toFixed(2)}%`
              : "-",
          },
          low: {
            hour: item.low?.hour || "-",
            value: item.low?.consumption?.toFixed(2) || 0,
            percent: item.low?.percent_decrease_from_avg
              ? `-${item.low.percent_decrease_from_avg.toFixed(2)}%`
              : "-",
          },
        }))

        setData(formatted)
        setLoading(false)
      } catch (err) {
        console.error(err)
        setError("Failed to load data")
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading)
    return <div className="text-center py-4 text-gray-600">Loading...</div>

  if (error)
    return <div className="text-center py-4 text-red-600">{error}</div>

  return (
    <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md">
      <table className="w-full border border-gray-300 text-sm text-center">
        <thead>
          <tr className="bg-gray-100">
            <th rowSpan={2} className="border px-3 py-2 align-middle">
              S.No
            </th>
            <th rowSpan={2} className="border px-3 py-2 align-middle">
              Consumer
            </th>
            <th rowSpan={2} className="border px-3 py-2 align-middle">
              Average
            </th>
            <th colSpan={3} className="border px-3 py-2">
              Peak
            </th>
            <th colSpan={3} className="border px-3 py-2">
              Low
            </th>
          </tr>
          <tr className="bg-gray-100">
            {["Peak", "Low"].map((type) => (
              <React.Fragment key={type}>
                <th className="border px-3 py-2">Hour</th>
                <th className="border px-3 py-2">Value</th>
                <th className="border px-3 py-2">
                  %{" "}
                  {type === "Peak" ? (
                    <span className="text-green-600">▲</span>
                  ) : (
                    <span className="text-red-600">▼</span>
                  )}
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="border px-3 py-2">{i + 1}</td>
              <td className="border px-3 py-2 font-medium">
                {row.consumer}{" "}
                <span className="text-gray-500 text-xs">
                  ({row.serviceNo})
                </span>
              </td>
              <td className="border px-3 py-2">{row.average}</td>

              {/* Peak Columns */}
              <td className="border px-3 py-2">{row.peak.hour}</td>
              <td className="border px-3 py-2">{row.peak.value}</td>
              <td className="border px-3 py-2 font-medium">
                {row.peak.percent}
              </td>

              {/* Low Columns */}
              <td className="border px-3 py-2">{row.low.hour}</td>
              <td className="border px-3 py-2">{row.low.value}</td>
              <td className="border px-3 py-2 font-medium">
                {row.low.percent}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
