import { useAuth } from '../../context/AuthContext'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, LogOut } from 'lucide-react'

const NAV = [
  { label: 'Dashboard',  href: '/admin',       icon: LayoutDashboard },
  { label: 'User Accounts', href: '/admin/users', icon: Users },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-gray-900 flex flex-col flex-shrink-0">
        <div className="px-4 py-5 border-b border-gray-700">
          <p className="text-white font-bold text-base">OJT System</p>
          <p className="text-gray-400 text-xs mt-0.5">Administrator</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV.map(({ label, href, icon: Icon }) => (
            <Link key={href} to={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === href
                  ? 'bg-white/20 text-white'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}>
              <Icon size={15} /> {label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
          <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          <button onClick={logout} className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-white">
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-h-0 relative">
        <div className="h-full overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
