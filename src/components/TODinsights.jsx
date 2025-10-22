import { useState } from "react"
import TODTable from "./TODtable"
import TODPie from "./TODpie"

export default function TODInsights() {
  const [viewMode, setViewMode] = useState("table")

  return (
    <div className="p-4 font-poppins">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">TOD Insights</h1>

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
        {viewMode === "table" ? <TODTable /> : <TODPie />}
      </div>
    </div>
  )
}
