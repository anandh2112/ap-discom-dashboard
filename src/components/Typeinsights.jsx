// TypeInsights.jsx
import React, { useState } from "react";
import TypeInsightsTable from "./Typeinsightstable";
import TypeInsightsGroup from "./Typeinsightsgroup";

export default function TypeInsights() {
  const [view, setView] = useState("table");

  return (
    <div className="p-2 font-poppins">

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Type Insights</h1>

        <div className="flex items-center gap-1">
          {["table", "group"].map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`px-3 py-1 text-sm font-semibold rounded-lg border transition-colors hover:cursor-pointer ${
                view === mode
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
              }`}
            >
              {mode === "table" ? "Table" : "Group"}
            </button>
          ))}
        </div>
      </div>

      {view === "table" ? <TypeInsightsTable /> : <TypeInsightsGroup />}
    </div>
  );
}