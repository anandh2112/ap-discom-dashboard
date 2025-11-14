// VarianceInsightsChart.jsx
import VarianceInsightsChartPie from "./Varianceinsightschartpie";
import VarianceInsightsChartTable from "./Varianceinsightscharttable";

export default function VarianceInsightsChart({ viewMode, subViewMode, selectedDate }) {
  return (
    <div className="w-full flex flex-col gap-4 relative">
      {/* PIE CHARTS */}
      <VarianceInsightsChartPie
        viewMode={viewMode}
        subViewMode={subViewMode}
        selectedDate={selectedDate}
      />

      {/* TABLE */}
      <VarianceInsightsChartTable
        viewMode={viewMode}
        subViewMode={subViewMode}
        selectedDate={selectedDate}
      />
    </div>
  );
}
