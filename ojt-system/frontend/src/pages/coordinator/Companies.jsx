import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companyService } from '../../services'
import toast from 'react-hot-toast'

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
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => companyService.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['companies']) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Cannot delete'),
  })

  const accreditMut = useMutation({
    mutationFn: ({ id, notes }) => companyService.accredit(id, notes),
    onSuccess: () => {
      toast.success('Company accredited!')
      qc.invalidateQueries(['companies'])
      setAccreditId(null)
      setAccreditNotes('')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const revokeMut = useMutation({
    mutationFn: (id) => companyService.revoke(id),
    onSuccess: () => { toast.success('Accreditation revoked'); qc.invalidateQueries(['companies']) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
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
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Companies</h1>
        <button
          onClick={() => { closeForm(); setShowForm(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Add Company
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[['', 'All'], ['true', 'Accredited'], ['false', 'Not Accredited']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filter === val
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">{editId ? 'Edit Company' : 'New Company'}</h2>
          <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(form) }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name} onChange={set('name')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.industry} onChange={set('industry')} placeholder="e.g. IT / Software" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slot Capacity</label>
              <input type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.slot_capacity} onChange={e => setForm({ ...form, slot_capacity: parseInt(e.target.value) || 0 })} />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.address} onChange={set('address')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.contact_person} onChange={set('contact_person')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.contact_position} onChange={set('contact_position')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.contact_email} onChange={set('contact_email')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.contact_phone} onChange={set('contact_phone')} />
            </div>

            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={saveMut.isPending}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                {saveMut.isPending ? 'Saving…' : editId ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={closeForm}
                className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-10">Loading…</div>
      ) : companies.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-lg">No companies yet.</p>
          <p className="text-sm mt-1">Click "Add Company" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {companies.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">

              {/* Name + badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{c.name}</h3>
                  {c.industry && <p className="text-sm text-gray-500">{c.industry}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                  c.is_accredited
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {c.is_accredited ? 'Accredited' : 'Not Accredited'}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1 text-sm text-gray-600">
                {c.address       && <p>📍 {c.address}</p>}
                {c.contact_person && <p>👤 {c.contact_person}{c.contact_position ? ` — ${c.contact_position}` : ''}</p>}
                {c.contact_email  && <p>✉️ {c.contact_email}</p>}
                {c.contact_phone  && <p>📞 {c.contact_phone}</p>}
                <p>🎯 Slots: <strong>{c.slot_capacity}</strong></p>
                {c.accreditation_date && <p className="text-xs text-gray-400">Accredited: {c.accreditation_date}</p>}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 flex-wrap">
                <button onClick={() => openEdit(c)}
                  className="text-xs border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-700">
                  Edit
                </button>

                {c.is_accredited ? (
                  <button onClick={() => { if (window.confirm('Revoke accreditation?')) revokeMut.mutate(c.id) }}
                    className="text-xs border border-orange-300 px-3 py-1.5 rounded-lg hover:bg-orange-50 text-orange-700">
                    Revoke
                  </button>
                ) : (
                  <button onClick={() => setAccreditId(c.id)}
                    className="text-xs border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-50 text-green-700">
                    Accredit
                  </button>
                )}

                <button onClick={() => { if (window.confirm('Delete this company?')) deleteMut.mutate(c.id) }}
                  className="text-xs border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 text-red-600 ml-auto">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accredit modal */}
      {accreditId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-1">Accredit Company</h3>
            <p className="text-sm text-gray-500 mb-4">Confirm this company can provide the required IT competencies.</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={accreditNotes} onChange={e => setAccreditNotes(e.target.value)}
              placeholder="Assessment notes, conditions, etc." />
            <div className="flex gap-3 mt-4">
              <button onClick={() => accreditMut.mutate({ id: accreditId, notes: accreditNotes })}
                disabled={accreditMut.isPending}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
                {accreditMut.isPending ? 'Processing…' : 'Confirm Accreditation'}
              </button>
              <button onClick={() => { setAccreditId(null); setAccreditNotes('') }}
                className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
