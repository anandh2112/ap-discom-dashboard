import OverviewMini from "./OverviewMini"
import OverviewVar from "./OverviewVar"
import OverviewTOD from "./OverviewTOD"
import OverviewTar from "./OverviewTar"
import OverviewCat from "./OverviewCat"

export default function Overview() {
  return (
    <div className="space-y-3">
      {/* Mini Cards */}
      <OverviewMini />

      {/* Graphs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <OverviewVar />
        <OverviewTOD />
        <OverviewTar />
      </div>

      {/* Category Breakdown & Table */}
      <OverviewCat />
    </div>
  )
}
