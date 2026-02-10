import { useEffect, useState } from "react"

export default function Peakvariance({ scno }) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!scno) return

    setLoading(true)
    fetch(
      `https://ee.elementsenergies.com/api/fetchAvgPeakVar1?scno=${scno}`
    )
      .then((res) => res.json())
      .then((res) => {
        setData(res || {})
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching peak variance:", err)
        setLoading(false)
      })
  }, [scno])

  const morningSlots = [
    "05:00 - 06:00",
    "06:00 - 07:00",
    "07:00 - 08:00",
    "08:00 - 09:00",
    "09:00 - 10:00",
  ]

  const eveningSlots = [
    "17:00 - 18:00",
    "18:00 - 19:00",
    "19:00 - 20:00",
    "20:00 - 21:00",
    "21:00 - 22:00",
  ]

  const renderVariance = (value) => {
    if (!value) return "-"

    const isNegative = value.startsWith("-")
    const displayValue = value.replace("-", "")

    return (
      <span
        className={`font-medium ${
          isNegative ? "text-red-500" : "text-green-600"
        }`}
      >
        {displayValue}
      </span>
    )
  }

  const renderTable = (title, slots) => (
    <div className="w-full rounded-md p-2">
      <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center">
        {title}
      </h4>

      <table className="w-full text-xs border-collapse">
        <thead className="bg-gray-100 border border-black">
          <tr>
            <th className="px-2 py-1 text-sm text-center border border-black">
              Time
            </th>
            <th className="px-2 py-1 text-sm text-center border border-black">
              Variance
            </th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot}>
              <td className="px-2 py-1 text-sm text-center border border-black text-gray-700">
                {slot}
              </td>
              <td className="px-2 py-1 text-sm text-center border border-black">
                {renderVariance(data[slot])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800">
        Average Peak Variance
      </h3>

      {loading ? (
        <p className="text-xs text-gray-500 text-center">
          Loading...
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderTable("Morning Peak Variance", morningSlots)}
          {renderTable("Evening Peak Variance", eveningSlots)}
        </div>
      )}
    </div>
  )
}
