import { useState } from 'react'
import { ShieldCheck, RefreshCw, XCircle, Trash2, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useInsurancePolicies } from '@/hooks/useInsurancePolicies'
import { cancelPolicy, syncPolicyStatus, deletePolicy, getErrorMessage } from '@/lib/api'
import { InsuranceAddDialog } from './InsuranceAddDialog'
import type { InsurancePolicy } from '@/types/insurancePolicy'

function statusTone(status: string | null): string {
  const s = (status ?? '').toLowerCase()
  if (s === 'active') return 'bg-green-100 text-green-800'
  if (s.includes('cancel')) return 'bg-red-100 text-red-700'
  if (s.includes('pending')) return 'bg-amber-100 text-amber-800'
  return 'bg-gray-100 text-gray-600'
}

function fmt(d: string | null): string {
  return d ?? '—'
}

export function InsurancePoliciesCard({ customerId }: { customerId: number }) {
  const { data, loading, error, refetch } = useInsurancePolicies(customerId)
  const [cancelFor, setCancelFor] = useState<InsurancePolicy | null>(null)
  const [deleteFor, setDeleteFor] = useState<InsurancePolicy | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [endDate, setEndDate] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const policies = data?.data ?? []

  async function handleSync(id: string) {
    setBusyId(id)
    setActionError(null)
    try {
      await syncPolicyStatus(id)
      refetch()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function handleCancel() {
    if (!cancelFor) return
    await cancelPolicy(cancelFor.id, endDate)
    refetch()
  }

  async function handleDelete() {
    if (!deleteFor) return
    await deletePolicy(deleteFor.id)
    refetch()
  }

  return (
    <div className="rounded-xl border border-[#EBEBF5] bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">Insurance Policies</h2>
          {data && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">{policies.length}</span>}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Add policy
        </Button>
      </div>

      {actionError && <p className="mb-3 text-sm text-red-500">{actionError}</p>}

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : policies.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No insurance policies for this customer.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {policies.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-gray-900">{p.product || 'Policy'}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone(p.status)}`}>
                    {p.status || 'unknown'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  {fmt(p.start_date)} → {fmt(p.end_date)} · {p.relationship || '—'}
                  {p.status_message ? ` · ${p.status_message}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSync(p.id)}
                  disabled={busyId === p.id}
                  className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  title="Sync status"
                >
                  <RefreshCw size={15} className={busyId === p.id ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={() => { setActionError(null); setEndDate(''); setCancelFor(p) }}
                  className="rounded p-1.5 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                  title="Cancel policy"
                >
                  <XCircle size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteFor(p)}
                  className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Delete policy"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel dialog with end-date picker */}
      <Dialog open={cancelFor !== null} onOpenChange={(o) => !o && setCancelFor(null)}>
        <DialogContent onClose={() => setCancelFor(null)}>
          <DialogHeader>
            <DialogTitle>Cancel insurance policy</DialogTitle>
            <DialogDescription>Set the end date for {cancelFor?.product || 'this policy'}.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="end-date" className="text-sm font-medium text-gray-700">End date</label>
            <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelFor(null)}>Back</Button>
            <Button
              variant="destructive"
              disabled={!endDate}
              onClick={async () => { await handleCancel(); setCancelFor(null) }}
            >
              Cancel policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InsuranceAddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        customerId={customerId}
        onCreated={refetch}
      />

      <ConfirmDialog
        open={deleteFor !== null}
        onOpenChange={(o) => !o && setDeleteFor(null)}
        title="Delete insurance policy?"
        description={<>This permanently removes the {deleteFor?.product || 'policy'} record.</>}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
