import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companyService } from '../../services'
import toast from 'react-hot-toast'
import { Building, Plus, MapPin, User, Mail, Phone, Target, Briefcase, RefreshCw, Trash2, Edit2, ShieldCheck, AlertCircle, X } from 'lucide-react'

const EMPTY = {
  name: '', industry: '', address: '',
  contact_person: '', contact_position: '',
  contact_email: '', contact_phone: '', slot_capacity: 0,
}

export default function Companies() {
  const qc = useQueryClient()
  const [showForm, setShowForm]   = useState(false)
  const [editId, setEditId]       = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [filter, setFilter]       = useState('')       // '' | 'true' | 'false'
  const [accreditId, setAccreditId] = useState(null)
  const [accreditNotes, setAccreditNotes] = useState('')

  const params = filter !== '' ? { is_accredited: filter === 'true' } : {}

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies', filter],
    queryFn: () => companyService.list(params).then(r => r.data),
  })

  const saveMut = useMutation({
    mutationFn: (d) => editId ? companyService.update(editId, d) : companyService.create(d),
    onSuccess: () => {
      toast.success(editId ? 'Company updated!' : 'Company created!')
      qc.invalidateQueries(['companies'])
      closeForm()
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to save company information'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => companyService.delete(id),
    onSuccess: () => { toast.success('Company deleted successfully'); qc.invalidateQueries(['companies']) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Cannot delete company'),
  })

  const accreditMut = useMutation({
    mutationFn: ({ id, notes }) => companyService.accredit(id, notes),
    onSuccess: () => {
      toast.success('Company accredited!')
      qc.invalidateQueries(['companies'])
      setAccreditId(null)
      setAccreditNotes('')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Accreditation failed'),
  })

  const revokeMut = useMutation({
    mutationFn: (id) => companyService.revoke(id),
    onSuccess: () => { toast.success('Accreditation revoked'); qc.invalidateQueries(['companies']) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Revocation failed'),
  })

  const openEdit = (c) => {
    setForm({
      name: c.name, industry: c.industry || '', address: c.address || '',
      contact_person: c.contact_person || '', contact_position: c.contact_position || '',
      contact_email: c.contact_email || '', contact_phone: c.contact_phone || '',
      slot_capacity: c.slot_capacity,
    })
    setEditId(c.id)
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY) }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">
            Accredited OJT Companies
          </h1>
          <p className="text-gray-400 font-medium text-xs lg:text-sm mt-1.5">
            Manage accredited host training establishments, edit contact persons, check slots allocation, and issue accreditations.
          </p>
        </div>
        <button
          onClick={() => { closeForm(); setShowForm(true) }}
          className="bg-blue-800 text-white hover:bg-blue-950 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md hover:shadow-blue-800/10 active:scale-95 flex items-center gap-2 self-start sm:self-center"
        >
          <Plus size={16} /> Add Company
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white/40 p-1.5 rounded-2xl border border-gray-100 max-w-max">
        {[
          ['', 'All'],
          ['true', 'Accredited'],
          ['false', 'Not Accredited']
        ].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-[13px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              filter === val
                ? 'bg-blue-950 text-white shadow-md shadow-blue-950/15'
                : 'text-gray-500 hover:text-blue-950 hover:bg-gray-100/50'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Form Container Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 px-6 py-5 flex items-center justify-between text-white border-b border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Building className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    {editId ? 'Edit Partner Company Details' : 'Register New Partner Company'}
                  </h2>
                  <p className="text-blue-200 text-[10px] sm:text-xs font-medium mt-0.5">
                    {editId ? 'Modify credentials and contact configurations' : 'Add a new host training establishment'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={closeForm}
                className="p-2 hover:bg-white/10 rounded-xl text-blue-200 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(form) }}
              className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Company Name *</label>
                    <input required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white"
                      value={form.name} onChange={set('name')} placeholder="e.g. Acme Corporation" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Industry Sector</label>
                    <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white"
                      value={form.industry} onChange={set('industry')} placeholder="e.g. IT / Software Development" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">OJT Slot Capacity</label>
                    <input type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white"
                      value={form.slot_capacity} onChange={e => setForm({ ...form, slot_capacity: parseInt(e.target.value) || 0 })} />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Official Address</label>
                    <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white"
                      value={form.address} onChange={set('address')} placeholder="e.g. Urdaneta City, Pangasinan" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Primary Contact Person</label>
                    <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white"
                      value={form.contact_person} onChange={set('contact_person')} placeholder="e.g. Juan Dela Cruz" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Designation Position</label>
                    <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white"
                      value={form.contact_position} onChange={set('contact_position')} placeholder="e.g. HR Manager" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Contact Email Address</label>
                    <input type="email" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white"
                      value={form.contact_email} onChange={set('contact_email')} placeholder="e.g. hr@acme.com" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone Number</label>
                    <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white"
                      value={form.contact_phone} onChange={set('contact_phone')} placeholder="e.g. 09171234567" />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
                <button type="button" onClick={closeForm}
                  className="border border-gray-300 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-all duration-200">
                  Cancel
                </button>
                <button type="submit" disabled={saveMut.isPending}
                  className="bg-blue-900 text-white hover:bg-blue-950 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-blue-900/10 active:scale-95 disabled:opacity-50">
                  {saveMut.isPending ? 'Saving…' : editId ? 'Update Partner' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-3xl border border-gray-150 shadow-md">
          <Building size={48} className="mx-auto mb-3 opacity-20 text-blue-950" />
          <p className="text-base font-bold text-gray-700">No partner companies recorded yet</p>
          <p className="text-sm mt-1 text-gray-400">Click "+ Add Company" above to register your first partner training establishment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {companies.map(c => (
            <div key={c.id} className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:border-gray-200/80 transition-all duration-300 flex flex-col justify-between min-h-[320px]">
              
              <div>
                {/* Header Name + Badge */}
                <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                  <div className="min-w-0">
                    <h3 className="font-black text-blue-950 text-base lg:text-[17px] tracking-tight truncate" title={c.name}>{c.name}</h3>
                    {c.industry && <p className="text-xs text-gray-400 font-semibold mt-0.5 tracking-wide truncate" title={c.industry}>{c.industry}</p>}
                  </div>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest flex-shrink-0 shadow-sm ${
                    c.is_accredited
                      ? 'bg-green-50 text-green-700 border border-green-200/50'
                      : 'bg-yellow-50 text-yellow-800 border border-yellow-200/50'
                  }`}>
                    {c.is_accredited ? 'Accredited' : 'Not Accredited'}
                  </span>
                </div>

                {/* Details layout with Lucide icons */}
                <div className="space-y-3 text-xs font-bold text-gray-650">
                  {c.address && (
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <MapPin size={14} className="stroke-[2.5]" />
                      </div>
                      <span className="truncate" title={c.address}>{c.address}</span>
                    </div>
                  )}
                  {c.contact_person && (
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <User size={14} className="stroke-[2.5]" />
                      </div>
                      <span className="truncate text-gray-700 font-extrabold" title={`${c.contact_person}${c.contact_position ? ` — ${c.contact_position}` : ''}`}>
                        {c.contact_person}
                        {c.contact_position ? ` — ${c.contact_position}` : ''}
                      </span>
                    </div>
                  )}
                  {c.contact_email && (
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <Mail size={14} className="stroke-[2.5]" />
                      </div>
                      <span className="truncate text-gray-600" title={c.contact_email}>{c.contact_email}</span>
                    </div>
                  )}
                  {c.contact_phone && (
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <Phone size={14} className="stroke-[2.5]" />
                      </div>
                      <span className="truncate" title={c.contact_phone}>{c.contact_phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <Target size={14} className="stroke-[2.5]" />
                    </div>
                    <span>OJT Slots Capacity: <strong className="font-black text-gray-900">{c.slot_capacity} Slots</strong></span>
                  </div>
                  {c.accreditation_date && (
                    <div className="pt-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Accredited: {new Date(c.accreditation_date || c.accreditation_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100 flex-wrap">
                <button onClick={() => openEdit(c)}
                  className="text-[10px] font-black uppercase tracking-wider border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 text-gray-700 cursor-pointer flex items-center gap-1">
                  <Edit2 size={10} className="text-slate-400" /> Edit
                </button>

                {c.is_accredited ? (
                  <button onClick={() => { if (window.confirm('Revoke company accreditation?')) revokeMut.mutate(c.id) }}
                    className="text-[10px] font-black uppercase tracking-wider border border-amber-300 px-3 py-1.5 rounded-xl hover:bg-amber-50 text-amber-700 cursor-pointer flex items-center gap-1">
                    <AlertCircle size={10} className="text-slate-400" /> Revoke
                  </button>
                ) : (
                  <button onClick={() => setAccreditId(c.id)}
                    className="text-[10px] font-black uppercase tracking-wider border border-green-300 px-3 py-1.5 rounded-xl hover:bg-green-50 text-green-700 cursor-pointer flex items-center gap-1">
                    <ShieldCheck size={10} className="text-slate-400" /> Accredit
                  </button>
                )}

                <button onClick={() => { if (window.confirm('Permanently delete this company?')) deleteMut.mutate(c.id) }}
                  className="text-[10px] font-black uppercase tracking-wider border border-red-300 px-3 py-1.5 rounded-xl hover:bg-red-50 text-red-600 ml-auto cursor-pointer flex items-center gap-1">
                  <Trash2 size={10} className="text-slate-400" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accredit modal */}
      {accreditId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-gray-100">
            <h3 className="text-lg font-black text-blue-950 mb-1.5">Accredit Company</h3>
            <p className="text-xs font-semibold text-gray-500 mb-4">Confirm this company can provide the required OJT competencies.</p>
            
            <label className="block text-xs font-bold text-gray-750 mb-1">Accreditation Notes (optional)</label>
            <textarea rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
              value={accreditNotes} onChange={e => setAccreditNotes(e.target.value)}
              placeholder="e.g. Assessment details, specific competencies, constraints..." />
            
            <div className="flex gap-3 mt-5 pt-1">
              <button onClick={() => accreditMut.mutate({ id: accreditId, notes: accreditNotes })}
                disabled={accreditMut.isPending}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">
                {accreditMut.isPending ? 'Processing…' : 'Confirm Accreditation'}
              </button>
              <button onClick={() => { setAccreditId(null); setAccreditNotes('') }}
                className="border border-gray-300 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-50 cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
