import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { evaluationService, dtrService } from '../../services'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Clock } from 'lucide-react'

export default function SupervisorDTR() {
  const [selected, setSelected] = useState(null)

  const { data: interns = [], isLoading: internsLoading } = useQuery({
    queryKey: ['my-interns'],
    queryFn: () => evaluationService.getMyInterns().then(r => r.data),
  })

  const { data: dtrData, isLoading: dtrLoading } = useQuery({
    queryKey: ['supervisor-dtr', selected?.id],
    queryFn: () => dtrService.getLogs(selected.id).then(r => r.data),
    enabled: !!selected?.id,
  })

  const logs = dtrData?.logs || []
  const summary = dtrData?.summary || { total_rendered: 0, required: 0, remaining: 0, percentage: 0 }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Intern DTR Monitoring</h1>
        </div>

        <div className="card">
          <label className="label">Select Intern</label>
          {internsLoading ? (
            <LoadingSpinner />
          ) : (
            <select className="input" value={selected?.id || ''} onChange={e => {
              const id = e.target.value
              const p = interns.find(i => i.id === id) || null
              setSelected(p)
            }}>
              <option value="">-- Choose an intern --</option>
              {interns.map(p => (
                <option key={p.id} value={p.id}>
                  {p.students?.users?.full_name} — {p.students?.student_number} · {p.companies?.name}
                </option>
              ))}
            </select>
          )}

          {!selected && (
            <div className="text-center text-gray-400 py-8">
              <Clock size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Select an intern to view DTR logs and summary</p>
            </div>
          )}

          {selected && (
            <div className="mt-4 space-y-4">
              {dtrLoading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="card text-center">
                      <p className="text-sm text-gray-500">Rendered</p>
                      <p className="text-2xl font-bold text-indigo-600">{summary.total_rendered}h</p>
                    </div>
                    <div className="card text-center">
                      <p className="text-sm text-gray-500">Required</p>
                      <p className="text-2xl font-bold text-gray-800">{summary.required}h</p>
                    </div>
                    <div className="card text-center">
                      <p className="text-sm text-gray-500">Remaining</p>
                      <p className="text-2xl font-bold text-orange-500">{summary.remaining}h</p>
                      <p className="text-xs text-gray-400 mt-1">{summary.percentage}% complete</p>
                    </div>
                  </div>

                  {logs.length === 0 ? (
                    <div className="card text-center text-gray-400 py-8">
                      <Clock size={32} className="mx-auto mb-2 opacity-30" />
                      <p>No DTR entries yet for this intern.</p>
                    </div>
                  ) : (
                    <div className="card overflow-x-auto p-0">
                      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800">DTR History — {selected.students?.users?.full_name}</h2>
                        <span className="text-xs text-gray-400">{logs.length} entries</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                            <tr>
                              {['Date', 'Time In', 'Time Out', 'Hours', 'Type', 'Verified', 'Remarks'].map(h => (
                                <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {logs.map(log => (
                              <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium whitespace-nowrap">{log.log_date}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{log.time_in?.slice(0,5) || '—'}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{log.time_out?.slice(0,5) || '—'}</td>
                                <td className="px-4 py-3 font-semibold text-indigo-600 whitespace-nowrap">{log.hours_rendered}h</td>
                                <td className="px-4 py-3 capitalize whitespace-nowrap">{log.dtr_type?.replace('_',' ')}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{log.verified ? 'Yes' : 'No'}</td>
                                <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{log.remarks || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
