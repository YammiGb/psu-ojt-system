import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { evaluationService, dtrService } from '../../services'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupervisorDTR() {
  const qc = useQueryClient()
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

  const verifyMut = useMutation({
    mutationFn: (dtrId) => dtrService.verify(dtrId),
    onSuccess: () => {
      toast.success('DTR entry successfully verified!')
      qc.invalidateQueries(['supervisor-dtr', selected?.id])
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to verify DTR')
    }
  })

  const handleVerify = (dtrId) => {
    verifyMut.mutate(dtrId)
  }

  const logs = dtrData?.logs || []
  const summary = dtrData?.summary || { total_rendered: 0, required: 0, remaining: 0, percentage: 0 }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">
            Intern Daily Time Record (DTR) Logs
          </h1>
          <p className="text-gray-400 font-medium text-xs lg:text-sm mt-1.5">
            Monitor and audit daily rendering records, check hours summary compliance, and view clock-in/out registers.
          </p>
        </div>
      </div>

      {/* Intern Selector Grid */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
        <label className="block text-xs font-black text-blue-900 uppercase tracking-wider mb-4">Assigned Student Cohort</label>
        {internsLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-900" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {interns.map(p => {
              const active = selected?.id === p.id
              return (
                <button key={p.id} onClick={() => setSelected(p)}
                  className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    active 
                      ? 'bg-blue-900 border-blue-900 text-white shadow-md shadow-blue-900/10 scale-[1.02]' 
                      : 'bg-white border-gray-250 text-gray-700 hover:bg-gray-100/50 hover:border-gray-300 hover:text-gray-900'
                  }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                    active ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-900 shadow-inner'
                  }`}>
                    {p.students?.users?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black leading-tight">{p.students?.users?.full_name}</p>
                    <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 leading-none ${active ? 'text-blue-200' : 'text-gray-400'}`}>
                      {p.students?.student_number} · {p.students?.program}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {!selected && (
        <div className="text-center text-gray-400 py-16 bg-white rounded-3xl border border-gray-150 shadow-sm animate-in fade-in duration-200">
          <Clock size={48} className="mx-auto mb-3 opacity-20 text-blue-950 animate-pulse" style={{ animationDuration: '4s' }} />
          <p className="text-sm font-extrabold text-gray-700">Select an intern to view records</p>
          <p className="text-xs text-gray-400 mt-1">Please select an assigned student candidate from the cohort grid above to display their comprehensive DTR logs.</p>
        </div>
      )}

      {selected && (
        <div className="space-y-6 animate-fadeIn">
          {dtrLoading ? (
            <div className="flex justify-center items-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
            </div>
          ) : (
            <>
              {/* Standalone Metric Cards (Breathing Room, Not crammed inside, large paddings) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Hours Rendered Card */}
                <div className="bg-gradient-to-br from-blue-50/40 via-white to-white border border-blue-100 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Hours Rendered</p>
                    <p className="text-3xl font-black text-blue-900 tracking-tight">{summary.total_rendered} hrs</p>
                  </div>
                </div>

                {/* Target Required Card */}
                <div className="bg-gradient-to-br from-gray-50/40 via-white to-white border border-gray-150 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Target Required</p>
                    <p className="text-3xl font-black text-gray-800 tracking-tight">{summary.required} hrs</p>
                  </div>
                </div>

                {/* Remaining Balance Card */}
                <div className="bg-gradient-to-br from-amber-50/40 via-white to-white border border-amber-100 rounded-3xl p-6 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Remaining Balance</p>
                      <p className="text-3xl font-black text-amber-700 tracking-tight">{summary.remaining} hrs</p>
                    </div>
                    <span className="text-[10px] font-black bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-100 uppercase tracking-widest shadow-sm">
                      {summary.percentage}% Done
                    </span>
                  </div>
                </div>
              </div>

              {/* Ledger Table Card */}
              {logs.length === 0 ? (
                <div className="text-center text-gray-400 py-16 bg-white rounded-3xl border border-gray-150 shadow-sm">
                  <Clock size={40} className="mx-auto mb-3 opacity-20 text-blue-950" />
                  <p className="text-sm font-extrabold text-gray-700">No time record logs logged</p>
                  <p className="text-xs text-gray-400 mt-1">This student placement does not contain any recorded daily log entries.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-sm animate-in fade-in duration-300">
                  <div className="px-6 py-4.5 bg-gray-50/30 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-black text-blue-950 text-xs sm:text-sm uppercase tracking-widest">Attendance Ledger — {selected.students?.users?.full_name}</h2>
                    <span className="text-[10px] font-black bg-blue-50 text-blue-800 px-3.5 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest shadow-sm">{logs.length} Entries</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead className="bg-blue-950 text-white text-[10px] uppercase font-black tracking-widest border-b border-blue-900">
                        <tr>
                          <th className="px-5 py-4 font-black tracking-wider text-left">Log Date</th>
                          <th className="px-5 py-4 font-black tracking-wider text-left">Clock In</th>
                          <th className="px-5 py-4 font-black tracking-wider text-left">Clock Out</th>
                          <th className="px-5 py-4 font-black tracking-wider text-center">Rendered</th>
                          <th className="px-5 py-4 font-black tracking-wider text-left">Log Type</th>
                          <th className="px-5 py-4 font-black tracking-wider text-center">Verified</th>
                          <th className="px-5 py-4 font-black tracking-wider text-left">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {logs.map(log => (
                          <tr key={log.id} className="hover:bg-blue-50/30 transition-colors duration-200">
                            <td className="px-5 py-4 font-extrabold text-blue-950 text-xs sm:text-sm tracking-tight whitespace-nowrap">{log.log_date}</td>
                            <td className="px-5 py-4 font-bold text-gray-600 text-xs tracking-wider whitespace-nowrap font-mono">{log.time_in?.slice(0,5) || '—'}</td>
                            <td className="px-5 py-4 font-bold text-gray-600 text-xs tracking-wider whitespace-nowrap font-mono">{log.time_out?.slice(0,5) || '—'}</td>
                            <td className="px-5 py-4 text-center whitespace-nowrap">
                              <span className="bg-blue-50/80 border border-blue-100 text-blue-800 px-2.5 py-1 rounded-lg text-[11px] font-extrabold">
                                {log.hours_rendered} hrs
                              </span>
                            </td>
                            <td className="px-5 py-4 font-extrabold text-gray-700 text-xs tracking-wider capitalize whitespace-nowrap">{log.dtr_type?.replace('_',' ')}</td>
                            <td className="px-5 py-4 text-center whitespace-nowrap">
                              {log.verified ? (
                                <span className="text-[10px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-wider shadow-sm border bg-green-50 text-green-700 border-green-200/50">
                                  Verified
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleVerify(log.id)}
                                  disabled={verifyMut.isPending}
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 hover:text-amber-900 border border-amber-200/50 hover:border-amber-300 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm flex items-center gap-1 mx-auto">
                                  Verify Log
                                </button>
                              )}
                            </td>
                            <td className="px-5 py-4 text-gray-400 font-semibold text-xs truncate max-w-xs" title={log.remarks || ''}>{log.remarks || '—'}</td>
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
  )
}

