import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../services'
import clsx from 'clsx'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: countData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => notificationService.unreadCount().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.list().then(r => r.data),
    enabled: open,
  })

  const markAllMut = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => qc.invalidateQueries(['notifications', 'notif-count']),
  })

  const count = countData?.count || 0

  const typeColor = {
    info: 'border-l-blue-400',
    warning: 'border-l-yellow-400',
    alert: 'border-l-red-400',
    success: 'border-l-green-400',
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            {count > 0 && (
              <button
                onClick={() => markAllMut.mutate()}
                className="text-xs text-primary-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {(!notifs || notifs.length === 0) && (
              <p className="text-center text-gray-400 py-8 text-sm">No notifications</p>
            )}
            {notifs?.map((n) => (
              <div
                key={n.id}
                className={clsx(
                  'px-4 py-3 border-l-4 text-sm',
                  typeColor[n.type] || 'border-l-gray-200',
                  !n.is_read && 'bg-blue-50'
                )}
              >
                <p className="font-medium text-gray-800">{n.title}</p>
                <p className="text-gray-600 mt-0.5">{n.message}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(n.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
