import { Routes, Route, useLocation } from "react-router-dom"
import Sidebar from "./components/Sidebar"
import Navbar from "./components/Navbar"
import Overview from "./components/Overview"
import ConsumerList from "./components/Consumerlist"
import ConsumerDetail from "./components/Consumerdetail"
import VarianceInsights from "./components/Varianceinsights"
import TODInsights from "./components/TODinsights"
import TypeInsights from "./components/Typeinsights"
import RankingInsights from "./components/Rankinginsights"
import { useState, useEffect } from "react"
import HelpModal from "./components/Helpmodal"

export default function App() {
  const location = useLocation();

  const [showHelp, setShowHelp] = useState(false);

  const [viewMode, setViewMode] = useState("Day");
  const [subViewMode, setSubViewMode] = useState("M-F");

  const MAX_DATE = "2025-10-08";
  const MIN_DATE = "2025-02-22";

  const [selectedDate, setSelectedDate] = useState(() => {
    const saved = localStorage.getItem("consumer_detail_date");
    return saved ? saved : MAX_DATE;
  });

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (selectedDate >= MIN_DATE && selectedDate <= MAX_DATE) {
      localStorage.setItem("consumer_detail_date", selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (location.pathname === "/insights/variance") {
      if (viewMode === "Day") {
        setViewMode("Month");
      }
    }
  }, [location.pathname]);

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
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <div className="flex-1 overflow-y-auto p-2">
          <Routes>
            <Route path="/" element={<Overview />} />

            <Route
              path="/consumers"
              element={<ConsumerList searchQuery={searchQuery} />}
            />

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
            <Route path="/insights/type" element={<TypeInsights />} />
            <Route path="/insights/ranking" element={<RankingInsights />} />
          </Routes>
        </div>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}