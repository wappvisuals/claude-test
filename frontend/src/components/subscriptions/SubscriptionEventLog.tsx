import { Activity } from 'lucide-react'
import { useSubscriptionEventLog } from '@/hooks/useSubscriptionEventLog'

export function SubscriptionEventLog({ subscriptionId }: { subscriptionId: number }) {
  const { data, loading, error } = useSubscriptionEventLog(subscriptionId)
  const events = data?.data ?? []

  return (
    <div className="rounded-xl border border-[#EBEBF5] bg-white p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
        <Activity size={16} className="text-gray-500" /> Event log
        {data && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">{events.length}</span>}
      </h2>
      {loading ? (
        <p className="py-4 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : events.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">No events.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-4 border-b border-[#F5F6FA] pb-2 last:border-0 text-[13px]">
              <div className="min-w-0">
                <p className="font-medium text-gray-800">{e.ref || e.type || 'Event'}</p>
                {e.data && <p className="truncate text-xs text-gray-400">{e.data}</p>}
              </div>
              <span className="shrink-0 text-xs text-gray-400">{e.date ?? '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
