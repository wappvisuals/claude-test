import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { fetchSinfridPlans, changeSinfridPlan, getErrorMessage } from '@/lib/api'
import type { SinfridPlan } from '@/types/sinfrid'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  currentPlanId: number | null
  onChanged: () => void
}

export function SinfridPlanChangeDialog({ open, onOpenChange, accountId, currentPlanId, onChanged }: Props) {
  const [plans, setPlans] = useState<SinfridPlan[]>([])
  const [selected, setSelected] = useState<number | null>(currentPlanId)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelected(currentPlanId)
    setError(null)
    fetchSinfridPlans().then(setPlans).catch((err) => setError(getErrorMessage(err)))
  }, [open, currentPlanId])

  async function handleSubmit() {
    if (selected == null || selected === currentPlanId || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await changeSinfridPlan(accountId, selected)
      onChanged()
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent onClose={() => !submitting && onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Change account plan</DialogTitle>
          <DialogDescription>Select a new plan for this Sinfrid account.</DialogDescription>
        </DialogHeader>
        <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
          {plans.map((p) => (
            <label
              key={p.id}
              className={[
                'flex cursor-pointer items-center justify-between rounded-md border p-3 transition-colors',
                selected === p.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <input type="radio" name="plan" checked={selected === p.id} onChange={() => setSelected(p.id)} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.label}</p>
                  <p className="text-xs text-gray-400">{p.category} · up to {p.max_members ?? '—'} members</p>
                </div>
              </div>
              {p.id === currentPlanId && <span className="text-[11px] font-medium text-gray-400">Current</span>}
            </label>
          ))}
          {plans.length === 0 && !error && <p className="text-sm text-gray-400">Loading plans…</p>}
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={selected == null || selected === currentPlanId || submitting}>
            {submitting ? 'Changing…' : 'Change plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
