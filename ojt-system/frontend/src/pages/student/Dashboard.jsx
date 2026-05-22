import { useAuth } from '../../context/AuthContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { studentService } from '../../services'
import PortalVerifyWidget from '../../components/PortalVerifyWidget'

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const qc = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => studentService.me().then(r => r.data),
    enabled: !!user,
  })

  const onVerified = () => {
    qc.invalidateQueries(['my-profile'])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Student Dashboard</h1>
              <p className="text-gray-500 text-sm mt-0.5">{user?.full_name} · {user?.email}</p>
            </div>
            <button onClick={logout} className="text-sm text-red-500 hover:underline">Sign Out</button>
          </div>
        </div>

        {/* Profile summary */}
        {!isLoading && profile && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-700 mb-3">My Profile</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Student Number</p>
                <p className="font-medium text-gray-800">{profile.student_number || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Program</p>
                <p className="font-medium text-gray-800">{profile.program || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Section</p>
                <p className="font-medium text-gray-800">{profile.section || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Year Level</p>
                <p className="font-medium text-gray-800">{profile.year_level || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Required Hours</p>
                <p className="font-medium text-gray-800">{profile.required_hours}h</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Enrollment</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  profile.enrollment_status === 'enrolled'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {profile.enrollment_status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Portal verify widget */}
        {!isLoading && profile && (
          <PortalVerifyWidget student={profile} onVerified={onVerified} />
        )}

        {isLoading && (
          <div className="text-center text-gray-400 py-10">Loading profile…</div>
        )}
      </div>
    </div>
  )
}
