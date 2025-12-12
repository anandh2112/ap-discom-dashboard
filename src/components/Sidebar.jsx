import { Link, useLocation } from "react-router-dom"
import {
  Home,
  Users,
  BarChart3,
  ChevronDown,
  LineChart,
  PieChart,
  Layers,
  Grid3x3, // ✅ NEW ICON
} from "lucide-react"
import { useState } from "react"

export default function Sidebar() {
  const location = useLocation()
  const [openInsights, setOpenInsights] = useState(true)

  const links = [
    { to: "/", label: "Overview", icon: <Home size={15} /> },
    { to: "/consumers", label: "Consumer List", icon: <Users size={15} /> },
  ]

  const insightsSubmenu = [
    { to: "/insights/variance", label: "Variance", icon: <LineChart size={14} /> },
    { to: "/insights/tod", label: "TOD", icon: <PieChart size={14} /> },
    { to: "/insights/type", label: "Type", icon: <Layers size={14} /> },
    { to: "/insights/ranking", label: "Ranking", icon: <Grid3x3 size={14} /> }, // New tab
  ]

  return (
    <div className="w-[11vw] bg-slate-900 text-white flex flex-col">
      <div className="text-center py-4 text-md font-bold">Elements</div>

      <nav className="flex-1 mt-4 text-sm">
        {links.map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center px-5 py-3 hover:bg-slate-700 ${
              location.pathname === to ? "bg-slate-700" : ""
            }`}
          >
            {icon}
            <span className="ml-2">{label}</span>
          </Link>
        ))}

        <div>
          <button
            onClick={() => setOpenInsights(!openInsights)}
            className={`flex items-center justify-between w-full px-5 py-3 hover:bg-slate-700 hover:cursor-pointer ${
              location.pathname.startsWith("/insights") ? "bg-slate-700" : ""
            }`}
          >
            <div className="flex items-center">
              <BarChart3 size={15} />
              <span className="ml-2">Insights</span>
            </div>
            <ChevronDown
              size={14}
              className={`transition-transform ${
                openInsights ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {openInsights && (
            <div className="ml-4">
              {insightsSubmenu.map(({ to, label, icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center px-4 py-2 hover:bg-slate-700 ${
                    location.pathname === to ? "bg-slate-700" : ""
                  }`}
                >
                  {icon}
                  <span className="ml-2">{label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </div>
  )
}