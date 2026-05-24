import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login    from './pages/Login'
import Register from './pages/Register'

// ── Student ──────────────────────────────────────────────
import StudentLayout      from './pages/student/Layout'
import StudentDashboard   from './pages/student/Dashboard'
import StudentApplication from './pages/student/Application'
import StudentPlacement   from './pages/student/Placement'
import StudentDTR         from './pages/student/DTR'
import StudentWeekly      from './pages/student/WeeklyReports'
import StudentGrades      from './pages/student/Grades'
import StudentPortfolio   from './pages/student/Portfolio'

// ── Coordinator ───────────────────────────────────────────
import CoordinatorLayout        from './pages/coordinator/Layout'
import CoordinatorDashboard     from './pages/coordinator/Dashboard'
import Companies                from './pages/coordinator/Companies'
import Students                 from './pages/coordinator/Students'
import CoordinatorApplications  from './pages/coordinator/Applications'
import Placements               from './pages/coordinator/Placements'
import MOATracker               from './pages/coordinator/MOA'
import CoordinatorMonitoring    from './pages/coordinator/Monitoring'
import CoordinatorWeeklyReports from './pages/coordinator/WeeklyReports'
import CoordinatorEvaluations   from './pages/coordinator/Evaluations'
import CoordinatorReports       from './pages/coordinator/Reports'

// ── Supervisor ────────────────────────────────────────────
import SupervisorLayout      from './pages/supervisor/Layout'
import SupervisorDashboard   from './pages/supervisor/Dashboard'
import SupervisorEvaluations from './pages/supervisor/Evaluations'
import SupervisorDTR         from './pages/supervisor/DTR'

// ── Admin ─────────────────────────────────────────────────
import AdminLayout    from './pages/admin/Layout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers     from './pages/admin/Users'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={
          <div className="min-h-screen flex items-center justify-center text-gray-500">
            403 — Access Denied
          </div>
        } />

        {/* ── Student ── */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route element={<StudentLayout />}>
            <Route path="/student"                element={<StudentDashboard />} />
            <Route path="/student/application"    element={<StudentApplication />} />
            <Route path="/student/placement"      element={<StudentPlacement />} />
            <Route path="/student/dtr"            element={<StudentDTR />} />
            <Route path="/student/weekly-reports" element={<StudentWeekly />} />
            <Route path="/student/grades"         element={<StudentGrades />} />
            <Route path="/student/portfolio"      element={<StudentPortfolio />} />
          </Route>
        </Route>

        {/* ── Coordinator / Admin ── */}
        <Route element={<ProtectedRoute allowedRoles={['coordinator', 'admin']} />}>
          <Route element={<CoordinatorLayout />}>
            <Route path="/coordinator"                element={<CoordinatorDashboard />} />
            <Route path="/coordinator/companies"      element={<Companies />} />
            <Route path="/coordinator/students"       element={<Students />} />
            <Route path="/coordinator/applications"   element={<CoordinatorApplications />} />
            <Route path="/coordinator/placements"     element={<Placements />} />
            <Route path="/coordinator/moa"            element={<MOATracker />} />
            <Route path="/coordinator/monitoring"     element={<CoordinatorMonitoring />} />
            <Route path="/coordinator/weekly-reports" element={<CoordinatorWeeklyReports />} />
            <Route path="/coordinator/evaluations"    element={<CoordinatorEvaluations />} />
            <Route path="/coordinator/reports"        element={<CoordinatorReports />} />
          </Route>
        </Route>

        {/* ── Supervisor ── */}
        <Route element={<ProtectedRoute allowedRoles={['supervisor']} />}>
          <Route element={<SupervisorLayout />}>
            <Route path="/supervisor"             element={<SupervisorDashboard />} />
            <Route path="/supervisor/evaluations" element={<SupervisorEvaluations />} />
            <Route path="/supervisor/dtr"         element={<SupervisorDTR />} />
          </Route>
        </Route>

        {/* ── Admin ── */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin"       element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}
