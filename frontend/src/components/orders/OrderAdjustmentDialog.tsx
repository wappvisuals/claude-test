import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { addOrderAdjustment, getErrorMessage } from '@/lib/api'
import type { OrderAdjustment } from '@/types/order'

interface LineTarget {
  rowid: string | null
  prod_id: number | string | null
  name: string | null
  /** Original (cart) price of the line — the "from" value. */
  price: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: number
  line: LineTarget | null
  /** Existing adjustment for this line (edit mode), if any. */
  adjustment?: OrderAdjustment | null
  onSaved: () => void
}

export function OrderAdjustmentDialog({ open, onOpenChange, orderId, line, adjustment, onSaved }: Props) {
  const [newPrice, setNewPrice] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !line) return
    setNewPrice(String(adjustment?.new_price ?? line.price))
    setComment(adjustment?.comment ?? '')
    setError(null)
  }, [open, line, adjustment])

  const oldPrice = line?.price ?? 0
  const parsed = Number(newPrice)
  const valid = newPrice !== '' && !Number.isNaN(parsed) && parsed >= 0
  const delta = valid ? Math.round((parsed - oldPrice) * 100) / 100 : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || submitting || !line) return
    setSubmitting(true)
    setError(null)
    try {
      await addOrderAdjustment(orderId, {
        old_price: oldPrice,
        new_price: parsed,
        comment: comment.trim() || undefined,
        rowid: line.rowid ?? undefined,
        prod_id: line.prod_id ?? undefined,
        product_name: line.name ?? undefined,
      })
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
            <DialogTitle>{adjustment ? 'Edit adjustment' : 'Adjust price'}</DialogTitle>
            <DialogDescription>
              {line?.name ? <>For <span className="font-medium text-gray-700">{line.name}</span> on order #{orderId}.</> : <>Adjust the line price on order #{orderId}.</>}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Original price</label>
                <div className="flex h-10 items-center rounded-md border border-[#EBEBF5] bg-gray-50 px-3 text-sm text-gray-500">{oldPrice}</div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-price" className="text-sm font-medium text-gray-700">New price <span className="text-red-500">*</span></label>
                <Input id="new-price" type="number" min="0" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" />
              </div>
            </div>

            {valid && delta !== 0 && (
              <p className="text-xs text-gray-500">
                {delta < 0 ? 'Discount' : 'Surcharge'} of{' '}
                <span className={delta < 0 ? 'font-medium text-[#E5484D]' : 'font-medium text-[#00A876]'}>
                  {delta > 0 ? '+' : ''}{delta}
                </span>{' '}— price adjusted from {oldPrice} to {parsed}.
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="adj-comment" className="text-sm font-medium text-gray-700">Comment</label>
              <Textarea id="adj-comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional note…" />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={!valid || submitting}>{submitting ? 'Saving…' : adjustment ? 'Update' : 'Adjust price'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
