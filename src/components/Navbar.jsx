import { useState } from "react"
import { useLocation } from "react-router-dom"
import { User, ArrowRight, Search } from "lucide-react"

export default function Navbar({
  onHelp,
  viewMode,
  setViewMode,
  subViewMode,
  setSubViewMode,
  selectedDate,
  setSelectedDate,
  searchQuery,
  setSearchQuery,
}) {
  const [open, setOpen] = useState(false)
  const [tempDate, setTempDate] = useState(selectedDate) // temporary date for picker
  const location = useLocation()

  const isConsumerDetail = location.pathname.includes("/consumer/")
  const isVarianceInsights = location.pathname.includes("/insights/variance")
  const isConsumerList = location.pathname === "/consumers"

  const MIN_DATE = "2025-02-22"
  const MAX_DATE = "2025-10-08"

  // Toggle groups based on page
  const mainToggles = isConsumerDetail
    ? ["Day", "Week", "Month"]
    : isVarianceInsights
    ? ["Month", "Year", "All"]
    : []

  const subToggles = isVarianceInsights ? ["M-F", "Sat", "Sun", "All"] : []

  return (
    <div className="flex justify-end items-center bg-white shadow px-4 sm:px-6 py-2 border-b border-gray-300 min-h-[50px]">
      {/* Left Section: Page Controls */}
      <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
        {/* Search bar for Consumer List */}
        {isConsumerList && (
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 sm:px-3 py-1">
            <input
              type="text"
              placeholder="Service No"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm sm:text-base outline-none"
            />
            <Search size={16} className="text-gray-600" />
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-4 min-h-[36px]">
          {isConsumerDetail || isVarianceInsights ? (
            <>
              {/* Main Toggles */}
              <div className="flex items-center gap-1 sm:gap-2">
                {mainToggles.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 sm:px-4 py-1 rounded-lg border text-xs sm:text-sm font-semibold transition hover:cursor-pointer ${
                      viewMode === mode
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Sub Toggles (only for Variance Insights) */}
              {isVarianceInsights && (
                <div className="flex items-center gap-1 sm:gap-2 ml-3">
                  {subToggles.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSubViewMode(sub)}
                      className={`px-2 sm:px-3 py-1 rounded-lg border text-xs sm:text-sm font-medium transition hover:cursor-pointer ${
                        subViewMode === sub
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-emerald-50"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}

              {/* Date Picker + Apply Button */}
              <div className="flex items-center ml-3 gap-2">
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => {
                    const newDate = e.target.value
                    if (newDate <= MAX_DATE && newDate >= MIN_DATE) {
                      setTempDate(newDate)
                    }
                  }}
                  min={MIN_DATE}
                  max={MAX_DATE}
                  className="border border-gray-300 bg-white rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm focus:ring-1 focus:outline-none hover:cursor-pointer"
                />
                <button
                  onClick={() => setSelectedDate(tempDate)}
                  className="bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="h-[36px]" />
          )}
        </div>
      </div>

      {/* Right Section: User Menu */}
      <div className="relative flex-shrink-0">
        <button
          className="flex items-center px-1 py-1 rounded-full hover:bg-slate-200 transition hover:cursor-pointer ml-2"
          onClick={() => setOpen(!open)}
        >
          <User size={20} className="text-gray-700" />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 bg-white border shadow-lg rounded-lg w-28 sm:w-32 z-50">
            <button
              onClick={() => {
                onHelp()
                setOpen(false)
              }}
              className="block w-full text-sm text-center py-1.5 hover:bg-slate-100 hover:rounded-lg"
            >
              Help
            </button>
            <button className="block w-full text-sm text-center py-1.5 hover:bg-slate-100 hover:rounded-lg">
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}