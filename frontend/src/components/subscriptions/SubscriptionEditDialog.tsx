import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateSubscription, getErrorMessage } from '@/lib/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscriptionId: number
  currentNextShipment: string | null
  onSaved: () => void
}

export function SubscriptionEditDialog({ open, onOpenChange, subscriptionId, currentNextShipment, onSaved }: Props) {
  const [nextShipment, setNextShipment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setNextShipment(currentNextShipment ?? new Date().toISOString().slice(0, 10))
      setError(null)
    }
  }, [open, currentNextShipment])

  const valid = nextShipment.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await updateSubscription(subscriptionId, nextShipment)
      onSaved()
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-md" onClose={() => !submitting && onOpenChange(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit subscription #{subscriptionId}</DialogTitle>
            <DialogDescription>Change the next shipment date.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="next-shipment" className="text-sm font-medium text-gray-700">Next shipment <span className="text-red-500">*</span></label>
            <Input id="next-shipment" type="date" value={nextShipment} onChange={(e) => setNextShipment(e.target.value)} />
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={!valid || submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
