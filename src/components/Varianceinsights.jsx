import { useState, useEffect } from "react"
import VarianceTable from "./Variancetable"
import VarianceChart from "./Varianceinsightschart"

export default function VarianceInsights({ viewMode, subViewMode, selectedDate }) {
  const [displayMode, setDisplayMode] = useState(() => {
    // Default to "table" if nothing in localStorage
    const saved = localStorage.getItem("varianceDisplayMode")
    return saved === "chart" ? "chart" : "table"
  })

  // Store the displayMode whenever it changes
  useEffect(() => {
    localStorage.setItem("varianceDisplayMode", displayMode)
  }, [displayMode])

  return (
    <div className="p-2 font-poppins">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Variance Insights</h1>

        {/* Toggle Buttons for Table / Chart View */}
        <div className="flex items-center gap-1">
          {["table", "chart"].map((mode) => (
            <button
              key={mode}
              onClick={() => setDisplayMode(mode)}
              className={`px-3 py-1 text-sm font-semibold rounded-lg border transition-colors hover:cursor-pointer ${
                displayMode === mode
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
              }`}
            >
              {mode === "table" ? "Table" : "Chart"}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional Rendering */}
      <div className="mt-4">
        {displayMode === "table" ? (
          <VarianceTable
            viewMode={viewMode}
            subViewMode={subViewMode}
            selectedDate={selectedDate}
          />
        ) : (
          <VarianceChart
            viewMode={viewMode}
            subViewMode={subViewMode}
            selectedDate={selectedDate}
          />
        )}
      </div>
    </div>
  )
}