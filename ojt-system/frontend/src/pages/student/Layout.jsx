import { useAuth } from '../../context/AuthContext'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Briefcase, Clock, BookOpen,
  GraduationCap, FolderOpen, LogOut
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',      href: '/student',                 icon: LayoutDashboard },
  { label: 'Application',    href: '/student/application',     icon: FileText },
  { label: 'My Placement',   href: '/student/placement',       icon: Briefcase },
  { label: 'DTR / Hours',    href: '/student/dtr',             icon: Clock },
  { label: 'Weekly Reports', href: '/student/weekly-reports',  icon: BookOpen },
  { label: 'My Grades',      href: '/student/grades',          icon: GraduationCap },
  { label: 'Portfolio',      href: '/student/portfolio',       icon: FolderOpen },
]

export default function StudentLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-blue-800 flex flex-col flex-shrink-0">
        <div className="px-4 py-5 border-b border-blue-700">
          <p className="text-white font-bold text-base">OJT System</p>
          <p className="text-blue-300 text-xs mt-0.5">Student</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV.map(({ label, href, icon: Icon }) => (
            <Link key={href} to={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === href
                  ? 'bg-white/20 text-white'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}>
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-blue-700">
          <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
          <p className="text-blue-300 text-xs truncate">{user?.email}</p>
          <button onClick={logout} className="mt-2 flex items-center gap-1.5 text-xs text-blue-300 hover:text-white">
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
