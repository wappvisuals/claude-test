import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { addOrderAdjustment, getErrorMessage } from '@/lib/api'

interface LineTarget {
  rowid: string | null
  prod_id: number | string | null
  name: string | null
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: number
  /** When set, the adjustment is attached to this cart line. */
  line?: LineTarget | null
  onAdded: () => void
}

export function OrderAdjustmentDialog({ open, onOpenChange, orderId, line, onAdded }: Props) {
  const [type, setType] = useState<'fee' | 'discount'>('fee')
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setType('fee'); setAmount(''); setComment(''); setError(null) }
  }, [open])

  const valid = amount !== '' && Number(amount) >= 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await addOrderAdjustment(orderId, {
        type,
        amount: Number(amount),
        comment: comment.trim() || undefined,
        rowid: line?.rowid ?? undefined,
        prod_id: line?.prod_id ?? undefined,
        product_name: line?.name ?? undefined,
      })
      onAdded()
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
            <DialogTitle>Add adjustment</DialogTitle>
            <DialogDescription>
              {line?.name ? <>For <span className="font-medium text-gray-700">{line.name}</span> on order #{orderId}.</> : <>Add a fee or discount to order #{orderId}.</>}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <div className="flex gap-2">
                {(['fee', 'discount'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                      type === t
                        ? 'border-[#00C48C] bg-[#E8FBF5] text-[#00A876]'
                        : 'border-[#EBEBF5] text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {type === 'discount' ? 'Stored as a negative total.' : 'Stored as a positive total.'}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="adj-amount" className="text-sm font-medium text-gray-700">Amount <span className="text-red-500">*</span></label>
              <Input id="adj-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="adj-comment" className="text-sm font-medium text-gray-700">Comment</label>
              <Textarea id="adj-comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional note…" />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={!valid || submitting}>{submitting ? 'Saving…' : 'Add adjustment'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
