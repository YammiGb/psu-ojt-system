import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { evaluationService } from '../../services'
import { Users, ClipboardList, Building2, GraduationCap } from 'lucide-react'

// Import school background
import psuBg from '../../../img/psuSchool_bg.jpg'

export default function SupervisorDashboard() {
  const { user } = useAuth()

  const { data: interns = [], isLoading } = useQuery({
    queryKey: ['my-interns'],
    queryFn: () => evaluationService.getMyInterns().then(r => r.data),
  })

  const companyName = user?.company?.name || 'Partner Host Establishment'
  
  // Count evaluations
  const evaluationsSubmitted = interns.filter(p => {
    return p.supervisor_eval_submitted || false
  }).length

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Branded Banner Header */}
      <div 
        className="relative rounded-3xl overflow-hidden shadow-xl min-h-[180px] flex items-center p-6 sm:p-10 text-white bg-cover bg-center"
        style={{ backgroundImage: `url(${psuBg})` }}
      >
        {/* Navy to Gold overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-900/85 to-amber-950/50 z-0" />
        
        {/* Subtle decorative blur */}
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
              Monitor intern timesheets, evaluate competency performance, and coordinate your active placement cohorts.
            </p>
          </div>
          
          <div className="flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
            <Building2 size={16} className="text-amber-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider">{companyName}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Total Interns */}
        <div className="bg-gradient-to-br from-blue-50/40 via-white to-white border border-blue-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4">
          <div className="p-3 bg-slate-50 text-slate-400 rounded-xl shadow-inner border border-slate-100">
            <Users size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Assigned Interns</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5 tracking-tight">{interns.length}</p>
          </div>
        </div>

        {/* Evaluations Submitted */}
        <div className="bg-gradient-to-br from-indigo-50/40 via-white to-white border border-indigo-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4">
          <div className="p-3 bg-slate-50 text-slate-400 rounded-xl shadow-inner border border-slate-100">
            <ClipboardList size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Evaluations Completed</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5 tracking-tight">{evaluationsSubmitted}</p>
          </div>
        </div>
      </div>

      {/* Your Interns Grid Section */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-black text-blue-950 tracking-tight">Active Intern Cohort</h2>
          <span className="text-[10px] bg-blue-50 text-blue-800 font-extrabold px-3 py-1 rounded-full border border-blue-100 uppercase tracking-wider shadow-sm">
            {interns.length} Active
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
          </div>
        ) : interns.length === 0 ? (
          <div className="text-center text-gray-400 py-12 bg-gray-50/20 rounded-2xl border border-dashed border-gray-255">
            <Users size={40} className="mx-auto mb-3 opacity-20 text-blue-950" />
            <p className="text-sm font-extrabold text-gray-700">No active interns found</p>
            <p className="text-xs text-gray-400 mt-1">There are currently no active student placements assigned to your company registry.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interns.map(p => {
              const studentName = p.students?.users?.full_name || 'Unknown Student'
              const studentNumber = p.students?.student_number || '-'
              const program = p.students?.program || 'Unknown'
              const section = p.students?.section || '-'
              
              return (
                <div key={p.id} className="bg-gradient-to-br from-gray-50/40 via-white to-white border border-gray-150 rounded-2xl p-5 transition-all duration-300 hover:shadow-md hover:border-gray-200/80 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-black text-blue-950 text-base tracking-tight truncate">{studentName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate">
                      Student #: {studentNumber}
                    </p>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5 truncate">
                      {program} (Sec {section})
                    </p>
                  </div>
                  
                  <span className="inline-block px-3 py-1 bg-green-50 text-green-700 border border-green-200/50 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm flex-shrink-0">
                    {p.ojt_status === 'active' ? 'Active' : p.ojt_status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

