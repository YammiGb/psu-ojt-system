import { useAuth } from '../../context/AuthContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { studentService } from '../../services'
import PortalVerifyWidget from '../../components/PortalVerifyWidget'
import { GraduationCap, Hash, Bookmark, Calendar, Clock, CheckCircle2, User, HelpCircle } from 'lucide-react'

// Import school background
import psuBg from '../../../img/psuSchool_bg.jpg'

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
    <div className="w-full max-w-7xl mx-auto space-y-6">

      {/* Branded Banner Header */}
      <div 
        className="relative rounded-3xl overflow-hidden shadow-xl min-h-[200px] flex items-center p-6 sm:p-10 text-white bg-cover bg-center"
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
            <p className="text-blue-100 text-sm sm:text-base mt-2 font-medium max-w-2xl leading-relaxed">
              Manage your requirements, log daily hours, and track evaluations for your On-the-Job Training.
            </p>
          </div>
          

        </div>
      </div>

      {/* Academic Profile Summary Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/40 p-6 sm:p-8">
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl lg:text-2xl font-black text-blue-950">Academic Profile Summary</h2>
          <p className="text-gray-400 text-xs lg:text-sm mt-0.5">Official student credentials and tracking parameters</p>
        </div>
        {/* Profile Card cells */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Item */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-gray-50/50 border border-gray-100/60 shadow-sm hover:shadow-md hover:bg-gray-50/80 transition-all duration-200">
              <div>
                <p className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider">Student Number</p>
                <p className="font-black text-gray-900 text-base lg:text-[17px] mt-0.5 tracking-tight">{profile.student_number || '—'}</p>
              </div>
            </div>

            {/* Item */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-gray-50/50 border border-gray-100/60 shadow-sm hover:shadow-md hover:bg-gray-50/80 transition-all duration-200">
              <div>
                <p className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider">Academic Program</p>
                <p className="font-black text-gray-900 text-base lg:text-[17px] mt-0.5 tracking-tight">{profile.program || '—'}</p>
              </div>
            </div>

            {/* Item */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-gray-50/50 border border-gray-100/60 shadow-sm hover:shadow-md hover:bg-gray-50/80 transition-all duration-200">
              <div>
                <p className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider">Current Section</p>
                <p className="font-black text-gray-900 text-base lg:text-[17px] mt-0.5 tracking-tight">{profile.section || '—'}</p>
              </div>
            </div>

            {/* Item */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-gray-50/50 border border-gray-100/60 shadow-sm hover:shadow-md hover:bg-gray-50/80 transition-all duration-200">
              <div>
                <p className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider">Year Level</p>
                <p className="font-black text-gray-900 text-base lg:text-[17px] mt-0.5 tracking-tight">{profile.year_level || '—'}</p>
              </div>
            </div>

            {/* Item */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-gray-50/50 border border-gray-100/60 shadow-sm hover:shadow-md hover:bg-gray-50/80 transition-all duration-200">
              <div>
                <p className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider">Required Hours</p>
                <p className="font-black text-gray-900 text-base lg:text-[17px] mt-0.5 tracking-tight">{profile.required_hours} Hours</p>
              </div>
            </div>

            {/* Item */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-gray-50/50 border border-gray-100/60 shadow-sm hover:shadow-md hover:bg-gray-50/80 transition-all duration-200">
              <div>
                <p className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider">Enrollment Status</p>
                <p className="font-black text-green-600 text-base lg:text-[17px] mt-0.5 tracking-tight uppercase">{profile.enrollment_status}</p>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center text-gray-400 py-12 flex flex-col items-center justify-center gap-3">
            <HelpCircle className="w-10 h-10 text-gray-300" />
            <span className="text-sm font-semibold">Could not load profile. Please verify your registration status.</span>
          </div>
        )}
      </div>

      {/* Verification / Widget area (Stacked below the summary, full width) */}
      {!isLoading && profile && (
        <PortalVerifyWidget student={profile} onVerified={onVerified} />
      )}
    </div>
  )
}
