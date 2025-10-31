import { useState, useEffect } from "react"
import VarianceTable from "./Variancetable"
import VariancePie from "./Variancepie"

export default function VarianceInsights() {
  const [viewMode, setViewMode] = useState(() => {
    // Default to "table" if nothing in localStorage
    const saved = localStorage.getItem("varianceViewMode")
    return saved === "chart" ? "chart" : "table"
  })

  // Store the viewMode whenever it changes
  useEffect(() => {
    localStorage.setItem("varianceViewMode", viewMode)
  }, [viewMode])

  return (
    <div className="p-2 font-poppins">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Variance</h1>

        {/* Toggle Buttons (Navbar style) */}
        <div className="flex items-center gap-1">
          {["table", "chart"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-sm font-semibold rounded-lg border transition-colors hover:cursor-pointer ${
                viewMode === mode
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
        {viewMode === "table" ? <VarianceTable /> : <VariancePie />}
      </div>
    </div>
  )
}