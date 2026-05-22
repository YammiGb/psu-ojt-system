import clsx from 'clsx'

// MOA step keys that mean "in review"
const MOA_STEP_KEYS = new Set([
  'campus_coordinator','ced','lingayen','legal','ojt_director','vp','bordsec','president'
])

const statusMap = {
  // OJT status
  active: 'badge-green',
  completed: 'badge-blue',
  not_completed: 'badge-red',
  transferred: 'badge-yellow',
  withdrawn: 'badge-gray',
  // Application
  pending: 'badge-yellow',
  under_review: 'badge-blue',
  approved: 'badge-green',
  rejected: 'badge-red',
  // MOA finals
  signed: 'badge-green',
  draft: 'badge-gray',
  // Enrollment
  enrolled: 'badge-green',
  not_enrolled: 'badge-red',
  irregular: 'badge-yellow',
  loa: 'badge-gray',
  // Generic
  submitted: 'badge-blue',
  acknowledged: 'badge-green',
  returned: 'badge-yellow',
  scheduled: 'badge-blue',
  cancelled: 'badge-red',
  rescheduled: 'badge-yellow',
}

const MOA_STEP_LABELS = {
  campus_coordinator: 'Campus Coordinator',
  ced: 'CED',
  lingayen: 'Lingayen',
  legal: 'Legal Office',
  ojt_director: 'OJT Director',
  vp: 'VP',
  bordsec: 'BORDSEC',
  president: 'President',
}

export default function StatusBadge({ status }) {
  if (!status) return null

  if (MOA_STEP_KEYS.has(status)) {
    return (
      <span className="badge-blue">
        Pending: {MOA_STEP_LABELS[status] || status}
      </span>
    )
  }

  const cls = statusMap[status] || 'badge-gray'
  return (
    <span className={cls}>
      {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  )
}
