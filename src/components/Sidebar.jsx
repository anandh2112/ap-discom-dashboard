import { Link, useLocation } from "react-router-dom"
import { Home, Users, FileText } from "lucide-react"

export default function Sidebar() {
  const location = useLocation()
  const links = [
    { to: "/", label: "Overview", icon: <Home size={15} /> },
    { to: "/consumers", label: "Consumer List", icon: <Users size={15} /> },
    { to: "/bills", label: "Energy Bills", icon: <FileText size={15} /> },
  ]

  return (
    <div className="w-[11vw] bg-slate-900 text-white flex flex-col">
      <div className="text-center py-4 text-md font-bold ">
        Elements
      </div>
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
      </nav>
    </div>
  )
}
