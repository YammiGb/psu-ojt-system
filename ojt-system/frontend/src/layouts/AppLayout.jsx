import { useState } from 'react'
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Building2, FileText, ClipboardList,
  BarChart3, LogOut, Menu, X, BookOpen, Clock,
  GraduationCap, Shield, FolderOpen
} from 'lucide-react'
import clsx from 'clsx'
import NotificationBell from '../components/NotificationBell'

const navByRole = {
  student: [
    { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { label: 'My Application', href: '/student/application', icon: FileText },
    { label: 'DTR / Hours', href: '/student/dtr', icon: Clock },
    { label: 'Weekly Reports', href: '/student/weekly-reports', icon: BookOpen },
    { label: 'My Grades', href: '/student/grades', icon: GraduationCap },
    { label: 'Portfolio', href: '/student/portfolio', icon: FolderOpen },
  ],
  coordinator: [
    { label: 'Dashboard', href: '/coordinator', icon: LayoutDashboard },
    { label: 'Students', href: '/coordinator/students', icon: Users },
    { label: 'Companies', href: '/coordinator/companies', icon: Building2 },
    { label: 'Applications', href: '/coordinator/applications', icon: FileText },
    { label: 'Placements', href: '/coordinator/placements', icon: ClipboardList },
    { label: 'MOA Tracker', href: '/coordinator/moa', icon: Shield },
    { label: 'Monitoring', href: '/coordinator/monitoring', icon: Clock },
    { label: 'Evaluations', href: '/coordinator/evaluations', icon: GraduationCap },
    { label: 'Reports', href: '/coordinator/reports', icon: BarChart3 },
  ],
  supervisor: [
    { label: 'Dashboard', href: '/supervisor', icon: LayoutDashboard },
    { label: 'Evaluations', href: '/supervisor/evaluations', icon: GraduationCap },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Companies', href: '/admin/companies', icon: Building2 },
    { label: 'MOA Tracker', href: '/admin/moa', icon: Shield },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Archives', href: '/admin/archives', icon: FolderOpen },
  ],
}

const roleColors = {
  student: 'bg-blue-700',
  coordinator: 'bg-indigo-800',
  supervisor: 'bg-teal-700',
  admin: 'bg-gray-900',
}

const roleLabels = {
  student: 'Student Portal',
  coordinator: 'OJT Coordinator',
  supervisor: 'Company Supervisor',
  admin: 'Administrator',
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navItems = navByRole[user?.role] || []
  const sidebarColor = roleColors[user?.role] || 'bg-gray-800'

  const handleLogout = () => { logout(); navigate('/login') }

  const isActive = (href) => {
    const roots = ['/student', '/coordinator', '/supervisor', '/admin']
    if (roots.includes(href)) return location.pathname === href
    return location.pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={clsx('flex flex-col transition-all duration-200 flex-shrink-0 z-30', sidebarColor, sidebarOpen ? 'w-60' : 'w-16')}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {sidebarOpen && <span className="text-white font-bold text-base tracking-tight">OJT System</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/70 hover:text-white p-1 ml-auto">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {sidebarOpen && (
          <div className="px-4 py-1.5 bg-black/20">
            <span className="text-white/50 text-xs uppercase tracking-widest">{roleLabels[user?.role]}</span>
          </div>
        )}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link key={href} to={href} title={!sidebarOpen ? label : undefined}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(href) ? 'bg-white/20 text-white' : 'text-white/65 hover:bg-white/10 hover:text-white'
              )}>
              <Icon size={17} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          {sidebarOpen ? (
            <div>
              <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-white/50 text-xs truncate">{user?.email}</p>
              <button onClick={handleLogout} className="mt-2 flex items-center gap-1.5 text-white/60 hover:text-white text-xs">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="text-white/60 hover:text-white w-full flex justify-center" title="Sign Out">
              <LogOut size={17} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-gray-700 font-semibold text-base capitalize">
            {location.pathname.split('/').filter(Boolean).slice(1).join(' › ').replace(/-/g, ' ') || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
