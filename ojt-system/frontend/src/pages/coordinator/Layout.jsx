import { useAuth } from '../../context/AuthContext'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, FileText, Briefcase,
  ScrollText, Activity, BookOpen, GraduationCap, BarChart2, LogOut
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',       href: '/coordinator',                      icon: LayoutDashboard },
  { label: 'Companies',       href: '/coordinator/companies',            icon: Building2 },
  { label: 'Students',        href: '/coordinator/students',             icon: Users },
  { label: 'Applications',    href: '/coordinator/applications',         icon: FileText },
  { label: 'Placements',      href: '/coordinator/placements',           icon: Briefcase },
  { label: 'MOA',             href: '/coordinator/moa',                  icon: ScrollText },
  { label: 'Monitoring',      href: '/coordinator/monitoring',           icon: Activity },
  { label: 'Weekly Reports',  href: '/coordinator/weekly-reports',       icon: BookOpen },
  { label: 'Evaluations',     href: '/coordinator/evaluations',          icon: GraduationCap },
  { label: 'Reports',         href: '/coordinator/reports',              icon: BarChart2 },
]

export default function CoordinatorLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-indigo-800 flex flex-col flex-shrink-0">
        <div className="px-4 py-5 border-b border-indigo-700">
          <p className="text-white font-bold text-base">OJT System</p>
          <p className="text-indigo-300 text-xs mt-0.5">Coordinator</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ label, href, icon: Icon }) => (
            <Link key={href} to={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === href
                  ? 'bg-white/20 text-white'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              }`}>
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-indigo-700">
          <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
          <p className="text-indigo-300 text-xs truncate">{user?.email}</p>
          <button onClick={logout} className="mt-2 flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white">
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
