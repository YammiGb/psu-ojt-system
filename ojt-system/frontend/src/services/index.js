import api from './api'

export const authService = {
  register:        (data)    => api.post('/auth/register', data),
  login:           (data)    => api.post('/auth/login', data),
  refresh:         (token)   => api.post('/auth/refresh', { refresh_token: token }),
  me:              ()        => api.get('/auth/me'),
  verifyPortal:    (data)    => api.post('/auth/verify-portal', data),
  adminCreateUser: (data)    => api.post('/auth/admin/create-user', data),
  listUsers:       ()        => api.get('/auth/admin/users'),
  toggleUser:      (id)      => api.put(`/auth/admin/users/${id}/toggle`),
}

export const companyService = {
  list:     (params)    => api.get('/companies', { params }),
  get:      (id)        => api.get(`/companies/${id}`),
  create:   (data)      => api.post('/companies', data),
  update:   (id, data)  => api.put(`/companies/${id}`, data),
  delete:   (id)        => api.delete(`/companies/${id}`),
  accredit: (id, notes) => api.post(`/companies/${id}/accredit`, { notes }),
  revoke:   (id)        => api.post(`/companies/${id}/revoke`),
  slots:    (id)        => api.get(`/companies/${id}/slots`),
}

export const studentService = {
  list:        (params)   => api.get('/students', { params }),
  me:          ()         => api.get('/students/me'),
  get:         (id)       => api.get(`/students/${id}`),
  update:      (id, data) => api.put(`/students/${id}`, data),
  eligibility: (id)       => api.get(`/students/${id}/eligibility`),
}

export const applicationService = {
  submit:   (data)     => api.post('/applications', data),
  list:     (params)   => api.get('/applications', { params }),
  get:      (id)       => api.get(`/applications/${id}`),
  review:   (id, data) => api.put(`/applications/${id}/review`, data),
  withdraw: (id)       => api.put(`/applications/${id}/withdraw`),
}

export const placementService = {
  assign:          (data)       => api.post('/placements', data),
  list:            (params)     => api.get('/placements', { params }),
  get:             (id)         => api.get(`/placements/${id}`),
  updateStatus:    (id, status) => api.put(`/placements/${id}/status`, { ojt_status: status }),
  requestTransfer: (id, data)   => api.post(`/placements/${id}/transfer`, data),
  listTransfers:   ()           => api.get('/placements/transfers/all'),
  reviewTransfer:  (id, data)   => api.put(`/placements/transfers/${id}/review`, data),
}

export const moaService = {
  list:     (params)           => api.get('/moa/', { params }),
  get:      (id)               => api.get(`/moa/${id}`),
  initiate: (company_id, document_url, document_name, semester, academic_year) =>
                                  api.post('/moa/', { company_id, document_url, document_name, semester, academic_year }),
  uploadMOAFile: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/moa/upload-file', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  advance:  (id, remarks = '') => api.post(`/moa/${id}/advance`, { remarks }),
  reject:   (id, reason)       => api.post(`/moa/${id}/reject`, { reason }),
  summary:  ()                 => api.get('/moa/report/summary'),
}

export const dtrService = {
  log:     (data)        => api.post('/dtr/', data),
  getLogs: (placementId) => api.get(`/dtr/${placementId}`),
  verify:  (dtrId)       => api.put(`/dtr/${dtrId}/verify`),
  delete:  (dtrId)       => api.delete(`/dtr/${dtrId}`),
}

export const monitoringService = {
  getDashboardStats:  ()                        => api.get('/monitoring/dashboard-stats'),
  getWeeklyReports:       (placementId) => api.get(`/weekly-reports/${placementId}`),
  submitWeeklyReport:     (data)        => api.post('/weekly-reports/', data),
  uploadWeeklyReportFile: (file)        => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/weekly-reports/upload-file', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  listAllReports:     (status)                  => api.get('/weekly-reports/', { params: status ? { status } : {} }),
  acknowledgeReport:  (id, remarks, status)     => api.put(`/weekly-reports/${id}/acknowledge`, { remarks, status }),
  // Return placements for a section/semester enriched with hours and pending report counts
  sectionView: async ({ section, semester } = {}) => {
    const res = await api.get('/placements', { params: semester ? { semester } : {} })
    const placements = (res.data || []).filter(p => {
      if (!section) return true
      return (p.students && p.students.section) ? p.students.section === section : false
    })

    // Enrich each placement with hours/required/percentage and pending weekly reports
    const enriched = await Promise.all(placements.map(async p => {
      try {
        const [dtrRes, reportsRes] = await Promise.all([
          api.get(`/dtr/${p.id}`),
          api.get(`/weekly-reports/${p.id}`),
        ])
        // DTR endpoint returns either { logs: [...], summary: {...} } or an array
        const dtrData = dtrRes.data || {}
        const dtrRows = Array.isArray(dtrData) ? dtrData : (dtrData.logs || [])
        const totalHours = dtrRows.reduce((s, r) => s + (r.hours_rendered || 0), 0)
        const required = (p.students && p.students.required_hours) || 480
        const percentage = required > 0 ? Math.round((totalHours / required) * 100) : 0
        const pending = (reportsRes.data || []).filter(r => r.status === 'submitted').length

        return {
          ...p,
          hours_rendered: totalHours,
          hours_required: required,
          hours_percentage: percentage,
          pending_weekly_reports: pending,
        }
      } catch (e) {
        // On error, return the placement with defaults to avoid breaking the UI
        return {
          ...p,
          hours_rendered: 0,
          hours_required: (p.students && p.students.required_hours) || 480,
          hours_percentage: 0,
          pending_weekly_reports: 0,
        }
      }
    }))

    return { data: enriched }
  },
}

export const evaluationService = {
  submit:          (data)        => api.post('/evaluations/', data),
  getEvaluations:  (placementId) => api.get(`/evaluations/${placementId}`),
  getGrade:        (placementId) => api.get(`/evaluations/${placementId}/grade`),
  submitPortfolio: (data)        => api.post('/evaluations/portfolio', data),
  uploadPortfolioFile: (file)    => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/evaluations/upload-file', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  logIntervention: (data)        => api.post('/evaluations/interventions', data),
  getInterventions:(placementId) => api.get(`/evaluations/interventions/${placementId}`),
  getMyInterns:    ()            => api.get('/evaluations/my-interns'),
}

export const reportService = {
  overview:         (params)      => api.get('/reports/overview', { params }),
  eligibleStudents: (params)      => api.get('/reports/eligible-for-certificate', { params }),
  exportExcel:      (params)      => api.get('/reports/excel', { params, responseType: 'blob' }),
  certificate:      (placementId) => api.get(`/reports/certificate/${placementId}`, { responseType: 'blob' }),
  archive:          (semester, academic_year) =>
                                     api.post('/reports/archive', null, { params: { semester, academic_year } }),
  archives:         ()            => api.get('/reports/archives'),
}
