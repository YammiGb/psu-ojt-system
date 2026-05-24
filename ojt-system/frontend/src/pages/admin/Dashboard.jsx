import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { Users, Shield } from 'lucide-react'

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Welcome, {user?.full_name}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link to="/admin/users"
          className="card hover:border-gray-300 transition-colors cursor-pointer group">
          <Users size={28} className="text-indigo-500 mb-3" />
          <p className="font-semibold text-gray-800 group-hover:text-indigo-600">User Accounts</p>
          <p className="text-sm text-gray-400 mt-1">Create and manage coordinator and admin accounts</p>
        </Link>

        <div className="card opacity-60 cursor-not-allowed">
          <Shield size={28} className="text-gray-400 mb-3" />
          <p className="font-semibold text-gray-600">More coming soon</p>
          <p className="text-sm text-gray-400 mt-1">Analytics and system settings</p>
        </div>
      </div>
    </div>
  )
}
