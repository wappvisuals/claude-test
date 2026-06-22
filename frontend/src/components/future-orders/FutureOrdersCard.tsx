import { useState } from 'react'
import { CalendarClock, Plus, CalendarCog, SkipForward, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useFutureOrders } from '@/hooks/useFutureOrders'
import { generateFutureOrders, rescheduleFutureOrder, skipFutureOrder, cancelFutureOrder, getErrorMessage } from '@/lib/api'
import type { FutureOrderJob } from '@/types/futureOrder'

const tone: Record<string, string> = {
  queued: 'bg-[#E8FBF5] text-[#00A876]',
  done: 'bg-blue-50 text-blue-600',
  failed: 'bg-red-50 text-red-600',
  skipped: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export function FutureOrdersCard({ subscriptionId }: { subscriptionId: number }) {
  const { data, loading, error, refetch } = useFutureOrders(subscriptionId)
  const jobs = data?.data ?? []
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reschedule, setReschedule] = useState<FutureOrderJob | null>(null)
  const [rescheduleAt, setRescheduleAt] = useState('')
  const [toSkip, setToSkip] = useState<FutureOrderJob | null>(null)
  const [toCancel, setToCancel] = useState<FutureOrderJob | null>(null)

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setActionError(null)
    try { await fn(); refetch() } catch (err) { setActionError(getErrorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <div className="rounded-xl border border-[#EBEBF5] bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <CalendarClock size={16} className="text-gray-500" /> Future orders
          {data && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">{jobs.length}</span>}
        </h2>
        <Button size="sm" disabled={busy} onClick={() => run(() => generateFutureOrders(subscriptionId))}>
          <Plus size={14} /> Generate
        </Button>
      </div>

      {actionError && <p className="mb-3 text-sm text-red-500">{actionError}</p>}

      {loading ? (
        <p className="py-4 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : jobs.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">No queued future orders.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map((j) => {
            const active = j.status === 'queued'
            return (
              <div key={j.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone[j.status] ?? 'bg-gray-100 text-gray-500'}`}>{j.status}</span>
                  <div className="text-[13px]">
                    <span className="text-gray-700">Cycle {j.cycle ?? '—'}</span>
                    <span className="ml-2 text-gray-400">{j.execute_at ? j.execute_at.slice(0, 10) : '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button disabled={!active || busy} onClick={() => { setRescheduleAt(j.execute_at?.slice(0, 10) ?? ''); setReschedule(j) }} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#00A876] disabled:opacity-30" title="Reschedule"><CalendarCog size={15} /></button>
                  <button disabled={!active || busy} onClick={() => setToSkip(j)} className="rounded p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-30" title="Skip"><SkipForward size={15} /></button>
                  <button disabled={!active || busy} onClick={() => setToCancel(j)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30" title="Cancel"><Ban size={15} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reschedule dialog */}
      <Dialog open={reschedule !== null} onOpenChange={(o) => !o && setReschedule(null)}>
        <DialogContent className="max-w-md" onClose={() => setReschedule(null)}>
          <DialogHeader>
            <DialogTitle>Reschedule future order</DialogTitle>
            <DialogDescription>Pick a new execution date for cycle {reschedule?.cycle ?? ''}.</DialogDescription>
          </DialogHeader>
          <Input type="date" value={rescheduleAt} onChange={(e) => setRescheduleAt(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReschedule(null)}>Cancel</Button>
            <Button
              disabled={!rescheduleAt || busy}
              onClick={async () => { if (reschedule) { await run(() => rescheduleFutureOrder(reschedule.id, `${rescheduleAt} 00:00:00`)); setReschedule(null) } }}
            >
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toSkip !== null}
        onOpenChange={(o) => !o && setToSkip(null)}
        title="Skip this future order?"
        description="The queued cycle will be marked skipped."
        confirmLabel="Skip"
        onConfirm={async () => { if (toSkip) await run(() => skipFutureOrder(toSkip.id)) }}
      />
      <ConfirmDialog
        open={toCancel !== null}
        onOpenChange={(o) => !o && setToCancel(null)}
        title="Cancel this future order?"
        description="The queued cycle will be cancelled."
        confirmLabel="Cancel order"
        destructive
        onConfirm={async () => { if (toCancel) await run(() => cancelFutureOrder(toCancel.id)) }}
      />
    </div>
  )
}
