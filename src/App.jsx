import { Routes, Route } from "react-router-dom"
import Sidebar from "./components/Sidebar"
import Navbar from "./components/Navbar"
import Overview from "./components/Overview"
import ConsumerList from "./components/Consumerlist"
import ConsumerDetail from "./components/Consumerdetail"
import VarianceInsights from "./components/Varianceinsights"
import TODInsights from "./components/TODinsights"
import { useState, useEffect } from "react"
import HelpModal from "./components/Helpmodal"

export default function App() {
  const [showHelp, setShowHelp] = useState(false)

  // View toggles
  const [viewMode, setViewMode] = useState("Day")
  const [subViewMode, setSubViewMode] = useState("M-F") // For variance insights

  const MAX_DATE = "2025-10-08"
  const MIN_DATE = "2025-02-22"
  const [selectedDate, setSelectedDate] = useState(() => {
    const saved = localStorage.getItem("consumer_detail_date")
    return saved ? saved : MAX_DATE
  })

  useEffect(() => {
    if (selectedDate >= MIN_DATE && selectedDate <= MAX_DATE) {
      localStorage.setItem("consumer_detail_date", selectedDate)
    }
  }, [selectedDate])

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar
          onHelp={() => setShowHelp(true)}
          viewMode={viewMode}
          setViewMode={setViewMode}
          subViewMode={subViewMode}
          setSubViewMode={setSubViewMode}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

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
            <Route
              path="/insights/variance"
              element={
                <VarianceInsights
                  viewMode={viewMode}
                  subViewMode={subViewMode}
                  selectedDate={selectedDate}
                />
              }
            />
            <Route path="/insights/tod" element={<TODInsights />} />
          </Routes>
        </div>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}
