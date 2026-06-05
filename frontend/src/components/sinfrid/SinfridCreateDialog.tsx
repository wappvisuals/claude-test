import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchSinfridPlans, createSinfridAccount, getErrorMessage } from '@/lib/api'
import type { SinfridPlan } from '@/types/sinfrid'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: number
  onCreated: () => void
}

export function SinfridCreateDialog({ open, onOpenChange, customerId, onCreated }: Props) {
  const [plans, setPlans] = useState<SinfridPlan[]>([])
  const [planId, setPlanId] = useState<number | null>(null)
  const [activationDate, setActivationDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setPlanId(null)
    setActivationDate(new Date().toISOString().slice(0, 10))
    setError(null)
    fetchSinfridPlans().then(setPlans).catch((err) => setError(getErrorMessage(err)))
  }, [open])

  async function handleSubmit() {
    if (planId == null || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await createSinfridAccount(customerId, { plan_id: planId, activation_date: activationDate || null })
      onCreated()
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
          <DialogTitle>Create Sinfrid account</DialogTitle>
          <DialogDescription>Contact details are taken from the customer profile.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">Plan <span className="text-red-500">*</span></span>
            <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
              {plans.map((p) => (
                <label
                  key={p.id}
                  className={[
                    'flex cursor-pointer items-center justify-between rounded-md border p-2.5 transition-colors',
                    planId === p.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3">
                    <input type="radio" name="create-plan" checked={planId === p.id} onChange={() => setPlanId(p.id)} />
                    <span className="text-sm font-medium text-gray-900">{p.label}</span>
                  </div>
                  <span className="text-xs text-gray-400">{p.category} · up to {p.max_members ?? '—'}</span>
                </label>
              ))}
              {plans.length === 0 && !error && <p className="text-sm text-gray-400">Loading plans…</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="activation-date" className="text-sm font-medium text-gray-700">Activation date</label>
            <Input id="activation-date" type="date" value={activationDate} onChange={(e) => setActivationDate(e.target.value)} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={planId == null || submitting}>
            {submitting ? 'Creating…' : 'Create account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
