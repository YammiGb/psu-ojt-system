import { useAuth } from '../../context/AuthContext'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Briefcase, Clock, BookOpen,
  GraduationCap, FolderOpen, LogOut
} from 'lucide-react'

// Import logo
import psuLogo from '../../../img/psu_logo.png'

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
    <div className="h-screen bg-gray-50/50 flex font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 h-full bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950 flex flex-col flex-shrink-0 shadow-2xl border-r border-blue-800/40">
        {/* Header */}
        <div className="px-6 py-7 border-b border-blue-800/60 flex items-center gap-3.5">
          <div className="p-1.5 bg-white rounded-full shadow-inner flex-shrink-0">
            <img src={psuLogo} alt="PSU" className="w-11 h-11 object-contain" />
          </div>
          <div>
            <p className="text-white font-black text-base lg:text-[18px] tracking-wider uppercase leading-none">PSU OJT Portal</p>
            <p className="text-amber-400 text-xs lg:text-[13px] font-extrabold tracking-widest uppercase mt-1">Student Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = location.pathname === href
            return (
              <Link key={href} to={href}
                className={`flex items-center gap-3 pl-6 pr-4.5 py-3.5 rounded-xl text-sm lg:text-[16px] font-bold transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 border-l-4 border-amber-400 shadow-md shadow-black/10'
                    : 'text-blue-200 hover:bg-white/5 hover:text-white hover:translate-x-1'
                }`}>
                <Icon size={20} className={active ? 'text-amber-400' : 'text-blue-300'} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User profile footer */}
        <div className="px-6 py-6 border-t border-blue-800/60 bg-blue-950/40">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-11 h-11 rounded-full bg-amber-400 flex items-center justify-center text-blue-950 font-black text-lg shadow-md">
              {user?.full_name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-base lg:text-[18px] font-extrabold truncate">{user?.full_name}</p>
              <p className="text-blue-300 text-sm truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black bg-blue-900/60 hover:bg-red-950/30 text-blue-200 hover:text-red-300 border border-blue-800/40 hover:border-red-900/30 transition-all duration-200 cursor-pointer"
          >
            <LogOut size={16} /> 
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content body */}
      <main className="flex-1 min-h-0 relative">
        <div className="h-full overflow-y-auto p-10 lg:p-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
