import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { monitoringService } from '../../services'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Users, Briefcase, FileCheck, AlertTriangle, Clock, CheckCircle, FileText, TrendingUp, GraduationCap } from 'lucide-react'

// Import school background
import psuBg from '../../../img/psuSchool_bg.jpg'

const StatCard = ({ icon: Icon, label, value, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-50/60 to-blue-50/20 border-blue-100 text-blue-900 shadow-blue-900/5',
    green: 'bg-gradient-to-br from-green-50/60 to-green-50/20 border-green-100 text-green-900 shadow-green-950/5',
    amber: 'bg-gradient-to-br from-amber-50/60 to-amber-50/20 border-amber-100 text-amber-900 shadow-amber-955/5',
    red: 'bg-gradient-to-br from-red-50/60 to-red-50/20 border-red-100 text-red-900 shadow-red-955/5',
    purple: 'bg-gradient-to-br from-purple-50/60 to-purple-50/20 border-purple-100 text-purple-900 shadow-purple-950/5',
  }

  const iconColors = {
    blue: 'bg-white text-slate-400 shadow-blue-500/5',
    green: 'bg-white text-slate-400 shadow-green-500/5',
    amber: 'bg-white text-slate-400 shadow-amber-500/5',
    red: 'bg-white text-slate-400 shadow-red-500/5',
    purple: 'bg-white text-slate-400 shadow-purple-500/5',
  }
  
  return (
    <div className={`rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-3.5 bg-white ${colorClasses[color]}`}>
      <div className={`p-2.5 rounded-xl shadow-inner flex-shrink-0 flex items-center justify-center ${iconColors[color]}`}>
        <Icon size={20} className="stroke-[2.5]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 truncate" title={label}>{label}</p>
        <p className="text-xl lg:text-2xl font-black text-gray-900 mt-0.5 tracking-tight">{value}</p>
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
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Branded Banner Header */}
      <div 
        className="relative rounded-3xl overflow-hidden shadow-xl min-h-[180px] flex items-center p-6 sm:p-10 text-white bg-cover bg-center"
        style={{ backgroundImage: `url(${psuBg})` }}
      >
        {/* Navy to Gold brand overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-900/85 to-amber-950/50 z-0" />
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl z-0" />

        <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/25 border border-amber-400/30 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-3 shadow-sm">
              <GraduationCap className="w-3.5 h-3.5" />
              Pangasinan State University
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">{user?.full_name}</span>!
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-2 font-medium max-w-2xl leading-relaxed">
              Overview of all active placements, students status tracks, pending approvals, and OJT program parameters.
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/40 p-6 sm:p-8">
        <h2 className="text-xl font-black text-blue-950 mb-5 pb-3 border-b border-gray-100">Quick Portal Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/coordinator/applications" className="p-4.5 rounded-2xl bg-gradient-to-br from-blue-50/60 to-blue-50/20 border border-blue-100 hover:border-blue-300 hover:shadow-md transition text-center flex flex-col justify-center items-center">
            <FileCheck size={20} className="mx-auto mb-2 text-slate-400" />
            <p className="text-[10px] font-black text-blue-955 uppercase tracking-wider">Review Applications</p>
          </Link>
          <Link to="/coordinator/placements" className="p-4.5 rounded-2xl bg-gradient-to-br from-green-50/60 to-green-50/20 border border-green-100 hover:border-green-300 hover:shadow-md transition text-center flex flex-col justify-center items-center">
            <Briefcase size={20} className="mx-auto mb-2 text-slate-400" />
            <p className="text-[10px] font-black text-green-955 uppercase tracking-wider">Manage Placements</p>
          </Link>
          <Link to="/coordinator/moa" className="p-4.5 rounded-2xl bg-gradient-to-br from-amber-50/60 to-amber-50/20 border border-amber-100 hover:border-amber-300 hover:shadow-md transition text-center flex flex-col justify-center items-center">
            <FileText size={20} className="mx-auto mb-2 text-slate-400" />
            <p className="text-[10px] font-black text-amber-955 uppercase tracking-wider">MOA Workflow</p>
          </Link>
          <Link to="/coordinator/evaluations" className="p-4.5 rounded-2xl bg-gradient-to-br from-purple-50/60 to-purple-50/20 border border-purple-100 hover:border-purple-300 hover:shadow-md transition text-center flex flex-col justify-center items-center">
            <CheckCircle size={20} className="mx-auto mb-2 text-slate-400" />
            <p className="text-[10px] font-black text-purple-955 uppercase tracking-wider">View Evaluations</p>
          </Link>
        </div>
      </div>

      {/* Priority Alerts */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/40 p-6 sm:p-8">
        <h2 className="text-xl font-black text-blue-950 mb-5 pb-3 border-b border-gray-100">Priority Program Alerts</h2>
        <div className="space-y-3">
          {stats?.pending_applications > 0 && (
            <div className="flex items-start gap-4 p-4 bg-amber-50/50 border border-amber-200 rounded-2xl shadow-sm">
              <AlertTriangle size={20} className="text-amber-600 mt-0.5 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-xs font-black text-amber-905 uppercase tracking-wider">{stats.pending_applications} Pending applications awaiting review</p>
                <p className="text-[11px] text-amber-700 font-semibold mt-0.5">Please review, endorse, and process pending student OJT applications.</p>
              </div>
            </div>
          )}
          
          {stats?.pending_moa_approvals > 0 && (
            <div className="flex items-start gap-4 p-4 bg-amber-50/50 border border-amber-200 rounded-2xl shadow-sm">
              <AlertTriangle size={20} className="text-amber-600 mt-0.5 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-xs font-black text-amber-905 uppercase tracking-wider">{stats.pending_moa_approvals} MOA approvals pending</p>
                <p className="text-[11px] text-amber-700 font-semibold mt-0.5">Process new company MOA requests currently in the verification workflow.</p>
              </div>
            </div>
          )}
          
          {stats?.low_progress_students > 0 && (
            <div className="flex items-start gap-4 p-4 bg-red-50/50 border border-red-200 rounded-2xl shadow-sm">
              <AlertTriangle size={20} className="text-red-650 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-black text-red-900 uppercase tracking-wider">{stats.low_progress_students} students flagged with low progress</p>
                <p className="text-[11px] text-red-700 font-semibold mt-0.5">Identify potential blockers and organize supervisor intervention protocols.</p>
              </div>
            </div>
          )}
          
          {stats?.pending_weekly_reports > 0 && (
            <div className="flex items-start gap-4 p-4 bg-purple-50/50 border border-purple-200 rounded-2xl shadow-sm">
              <AlertTriangle size={20} className="text-purple-650 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-black text-purple-900 uppercase tracking-wider">{stats.pending_weekly_reports} Weekly accomplishment reports pending</p>
                <p className="text-[11px] text-purple-700 font-semibold mt-0.5">Review and acknowledge weekly student accomplishment logs.</p>
              </div>
            </div>
          )}
          
          {!stats?.pending_applications && !stats?.pending_moa_approvals && !stats?.low_progress_students && !stats?.pending_weekly_reports && (
            <div className="flex items-start gap-4 p-4 bg-green-50/50 border border-green-200 rounded-2xl shadow-sm">
              <CheckCircle size={20} className="text-green-650 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-black text-green-900 uppercase tracking-wider">All systems nominal</p>
                <p className="text-[11px] text-green-700 font-semibold mt-0.5">No active alerts, pending company credentials, or critical student interventions.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
