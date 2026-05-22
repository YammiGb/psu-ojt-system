import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { evaluationService } from '../../services'
import { Users, ClipboardList, Building2 } from 'lucide-react'

export default function SupervisorDashboard() {
  const { user } = useAuth()

  const { data: interns = [], isLoading } = useQuery({
    queryKey: ['my-interns'],
    queryFn: () => evaluationService.getMyInterns().then(r => r.data),
  })

  const companyName = user?.company?.name || 'Loading...'
  
  // Count evaluations - check if evaluation record exists for this placement
  const evaluationsSubmitted = interns.filter(p => {
    // An intern has a supervisor eval if they have evaluation data
    return p.supervisor_eval_submitted || false
  }).length

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header with Company Info */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg border border-teal-100">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.full_name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <Building2 size={18} className="text-teal-600" />
          <p className="text-lg font-semibold text-teal-700">{companyName}</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">{user?.email} · Company Supervisor</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center py-6">
          <Users size={28} className="mx-auto mb-2 text-teal-500" />
          <p className="text-3xl font-bold text-gray-800">{interns.length}</p>
          <p className="text-sm text-gray-500 mt-1">Active Interns</p>
        </div>
        <div className="card text-center py-6">
          <ClipboardList size={28} className="mx-auto mb-2 text-indigo-500" />
          <p className="text-3xl font-bold text-gray-800">{evaluationsSubmitted}</p>
          <p className="text-sm text-gray-500 mt-1">Evaluations Submitted</p>
        </div>
      </div>

      {/* Your Interns Section */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={20} className="text-teal-600" />
          Your Interns
        </h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading interns...</p>
          </div>
        ) : interns.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">No active interns assigned to your company.</p>
        ) : (
          <div className="space-y-3">
            {interns.map(p => {
              const studentName = p.students?.users?.full_name || 'Unknown Student'
              const studentNumber = p.students?.student_number || '-'
              const program = p.students?.program || 'Unknown'
              const section = p.students?.section || '-'
              
              return (
                <div key={p.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{studentName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {studentNumber} · {program} (Section {section})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                      {p.ojt_status === 'active' ? 'Active' : p.ojt_status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
