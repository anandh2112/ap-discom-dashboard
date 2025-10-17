import { Routes, Route } from "react-router-dom"
import Sidebar from "./components/Sidebar"
import Navbar from "./components/Navbar"
import Overview from "./components/Overview"
import ConsumerList from "./components/Consumerlist"
import ConsumerDetail from "./components/Consumerdetail"
import EnergyBills from "./components/Energybills"
import { useState, useEffect } from "react"
import HelpModal from "./components/Helpmodal"

export default function App() {
  const [showHelp, setShowHelp] = useState(false)

  // ---- ConsumerDetail Controls ----
  const [viewMode, setViewMode] = useState('Day')

  // Load last selected date from localStorage or default to MAX_DATE
  const MAX_DATE = '2025-10-08'
  const MIN_DATE = '2025-02-22'
  const [selectedDate, setSelectedDate] = useState(() => {
    const saved = localStorage.getItem('consumer_detail_date')
    return saved ? saved : MAX_DATE
  })

  // Persist selectedDate in localStorage whenever it changes
  useEffect(() => {
    if (selectedDate >= MIN_DATE && selectedDate <= MAX_DATE) {
      localStorage.setItem('consumer_detail_date', selectedDate)
    }
  }, [selectedDate])

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar
          onHelp={() => setShowHelp(true)}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-2">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/consumers" element={<ConsumerList />} />
            <Route
              path="/consumer/:id"
              element={
                <ConsumerDetail
                  viewMode={viewMode}
                  selectedDate={selectedDate}
                />
              }
            />
            <Route path="/bills" element={<EnergyBills />} />
          </Routes>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}
