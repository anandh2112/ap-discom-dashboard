import { useState } from "react"
import { useLocation } from "react-router-dom"
import { User } from "lucide-react"

export default function Navbar({ onHelp, viewMode, setViewMode, selectedDate, setSelectedDate }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Show controls only on ConsumerDetail page
  const isConsumerDetail = location.pathname.includes("/consumer/")

  const MIN_DATE = "2025-02-22"
  const MAX_DATE = "2025-10-08"

  return (
    <div className="flex justify-end items-center bg-white shadow px-4 sm:px-6 py-2 border-b border-gray-300 min-h-[50px]">
      {/* Left Section: Page Controls */}
      <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
        {/* Keep space reserved even when controls are hidden */}
        <div className="flex items-center gap-2 sm:gap-4 min-h-[36px]">
          {isConsumerDetail ? (
            <>
              {/* Day/Week/Month Toggle */}
              <div className="flex items-center gap-1 sm:gap-2">
                {["Day", "Week", "Month"].map((mode) => (
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

              {/* Date Picker */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const newDate = e.target.value
                  if (newDate <= MAX_DATE && newDate >= MIN_DATE) {
                    setSelectedDate(newDate)
                  }
                }}
                min={MIN_DATE}
                max={MAX_DATE}
                className="border border-gray-300 bg-white rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm focus:ring-1 focus:outline-none hover:cursor-pointer"
              />
            </>
          ) : (
            // Placeholder to keep height consistent
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
