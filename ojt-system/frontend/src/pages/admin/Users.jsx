import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../../services'
import toast from 'react-hot-toast'
import { Plus, Users, Shield, ShieldCheck, Trash2, X } from 'lucide-react'

const ROLE_COLORS = {
  admin:       'bg-red-100 text-red-700',
  coordinator: 'bg-indigo-100 text-indigo-700',
  supervisor:  'bg-teal-100 text-teal-700',
  student:     'bg-blue-100 text-blue-700',
}

const EMPTY_FORM = { email: '', password: '', full_name: '', role: 'coordinator' }

export default function AdminUsers() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => authService.listUsers().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (data) => authService.adminCreateUser(data),
    onSuccess: (res) => {
      toast.success(`${res.data.user.role} account created for ${res.data.user.email}`)
      qc.invalidateQueries(['admin-users'])
      setShowForm(false)
      setForm(EMPTY_FORM)
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to create user'),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => authService.toggleUser(id, is_active),
    onSuccess: () => {
      toast.success('Account updated')
      qc.invalidateQueries(['admin-users'])
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed'),
  })

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = !filterRole || u.role === filterRole
    return matchSearch && matchRole
  })

  const counts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Users size={22} /> User Accounts
        </h1>
        <button onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Create Account
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {['admin','coordinator','supervisor','student'].map(role => (
          <div key={role} className="card text-center py-3">
            <p className="text-2xl font-bold text-gray-800">{counts[role] || 0}</p>
            <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${ROLE_COLORS[role]}`}>
              {role}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          className="input flex-1"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-44" value={filterRole}
          onChange={e => setFilterRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="coordinator">Coordinator</option>
          <option value="supervisor">Supervisor</option>
          <option value="student">Student</option>
        </select>
      </div>

      {/* User table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>
            )}
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{u.full_name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${u.is_active ? 'text-green-600' : 'text-red-500'}`}>
                    {u.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleMut.mutate({ id: u.id, is_active: !u.is_active })}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      u.is_active
                        ? 'border-red-200 text-red-500 hover:bg-red-50'
                        : 'border-green-200 text-green-600 hover:bg-green-50'
                    }`}>
                    {u.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Account Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <ShieldCheck size={18} className="text-indigo-600" />
                Create Staff Account
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {['coordinator', 'admin'].map(r => (
                    <label key={r} className={`border rounded-lg px-4 py-2.5 cursor-pointer text-sm font-medium text-center transition-colors ${
                      form.role === r
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                      <input type="radio" className="sr-only" value={r}
                        checked={form.role === r}
                        onChange={() => setForm({ ...form, role: r })} />
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Full Name</label>
                <input className="input" type="text" required
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>

              <div>
                <label className="label">Email</label>
                <input className="input" type="email" required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>

              <div>
                <label className="label">Password</label>
                <input className="input" type="password" required minLength={6}
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => createMut.mutate(form)}
                  className="btn-primary flex-1"
                  disabled={!form.email || !form.password || !form.full_name || createMut.isPending}>
                  {createMut.isPending ? 'Creating…' : `Create ${form.role} Account`}
                </button>
                <button className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
