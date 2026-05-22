import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { monitoringService } from '../../services'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Users, Briefcase, FileCheck, AlertTriangle, Clock, CheckCircle, FileText, TrendingUp } from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  }
  
  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {trend && <p className="text-xs mt-1 opacity-60">{trend}</p>}
        </div>
        <Icon size={24} className="opacity-40" />
      </div>
    </div>
  )
}

export default function CoordinatorDashboard() {
  const { user } = useAuth()
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => monitoringService.getDashboardStats().then(r => r.data),
    enabled: !!user,
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Overview of all OJT monitoring activities</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Welcome back,</p>
            <p className="text-lg font-semibold text-gray-800">{user?.full_name}</p>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={stats?.total_students || 0}
          color="blue"
        />
        <StatCard
          icon={Briefcase}
          label="Active Placements"
          value={stats?.active_placements || 0}
          color="green"
        />
        <StatCard
          icon={FileCheck}
          label="Pending Applications"
          value={stats?.pending_applications || 0}
          color="amber"
        />
        <StatCard
          icon={Clock}
          label="Pending Weekly Reports"
          value={stats?.pending_weekly_reports || 0}
          color="purple"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle}
          label="Completed Evaluations"
          value={stats?.completed_evaluations || 0}
          color="green"
        />
        <StatCard
          icon={FileText}
          label="Pending MOA Approvals"
          value={stats?.pending_moa_approvals || 0}
          color="amber"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Progress Students"
          value={stats?.low_progress_students || 0}
          color="red"
        />
        <StatCard
          icon={TrendingUp}
          label="Upcoming Site Visits"
          value={stats?.upcoming_site_visits || 0}
          color="blue"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a href="/coordinator/applications" className="p-3 rounded-lg bg-blue-50 border border-blue-200 hover:border-blue-300 transition text-center">
            <FileCheck size={20} className="mx-auto mb-1 text-blue-600" />
            <p className="text-xs font-medium text-blue-700">Review Applications</p>
          </a>
          <a href="/coordinator/placements" className="p-3 rounded-lg bg-green-50 border border-green-200 hover:border-green-300 transition text-center">
            <Briefcase size={20} className="mx-auto mb-1 text-green-600" />
            <p className="text-xs font-medium text-green-700">Manage Placements</p>
          </a>
          <a href="/coordinator/moa" className="p-3 rounded-lg bg-amber-50 border border-amber-200 hover:border-amber-300 transition text-center">
            <FileText size={20} className="mx-auto mb-1 text-amber-600" />
            <p className="text-xs font-medium text-amber-700">MOA Workflow</p>
          </a>
          <a href="/coordinator/evaluations" className="p-3 rounded-lg bg-purple-50 border border-purple-200 hover:border-purple-300 transition text-center">
            <CheckCircle size={20} className="mx-auto mb-1 text-purple-600" />
            <p className="text-xs font-medium text-purple-700">View Evaluations</p>
          </a>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Priority Alerts</h2>
        <div className="space-y-2">
          {stats?.pending_applications > 0 && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-amber-900">{stats.pending_applications} pending applications</p>
                <p className="text-amber-700">Review and approve student applications</p>
              </div>
            </div>
          )}
          
          {stats?.pending_moa_approvals > 0 && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-amber-900">{stats.pending_moa_approvals} pending MOA approvals</p>
                <p className="text-amber-700">Process MOA requests in the workflow</p>
              </div>
            </div>
          )}
          
          {stats?.low_progress_students > 0 && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-red-900">{stats.low_progress_students} students with low progress</p>
                <p className="text-red-700">Monitor and possibly schedule interventions</p>
              </div>
            </div>
          )}
          
          {stats?.pending_weekly_reports > 0 && (
            <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <AlertTriangle size={18} className="text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-purple-900">{stats.pending_weekly_reports} pending weekly reports</p>
                <p className="text-purple-700">Review and acknowledge student submissions</p>
              </div>
            </div>
          )}
          
          {!stats?.pending_applications && !stats?.pending_moa_approvals && !stats?.low_progress_students && !stats?.pending_weekly_reports && (
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-green-900">All systems nominal</p>
                <p className="text-green-700">No active alerts or pending approvals</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
