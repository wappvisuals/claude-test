import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchSinfridPlans, createPolicy, getErrorMessage } from '@/lib/api'
import type { SinfridPlan } from '@/types/sinfrid'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: number
  onCreated: () => void
}

export function InsuranceAddDialog({ open, onOpenChange, customerId, onCreated }: Props) {
  const [products, setProducts] = useState<SinfridPlan[]>([])
  const [product, setProduct] = useState('')
  const [startDate, setStartDate] = useState('')
  const [relationship, setRelationship] = useState('self')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setProduct('')
    setStartDate(new Date().toISOString().slice(0, 10))
    setRelationship('self')
    setError(null)
    fetchSinfridPlans().then(setProducts).catch(() => setProducts([]))
  }, [open])

  const valid = product.trim().length > 0 && startDate.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await createPolicy(customerId, { product, start_date: startDate, relationship: relationship || null })
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
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add insurance policy</DialogTitle>
            <DialogDescription>Create a manual insurance policy for this customer.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="product" className="text-sm font-medium text-gray-700">Product <span className="text-red-500">*</span></label>
              <select
                id="product"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="h-10 rounded-md border border-[#EBEBF5] bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#00C48C]"
              >
                <option value="" disabled>Select a product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.plan}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="start-date" className="text-sm font-medium text-gray-700">Start date <span className="text-red-500">*</span></label>
                <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="relationship" className="text-sm font-medium text-gray-700">Relationship</label>
                <Input id="relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="self" />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={!valid || submitting}>{submitting ? 'Creating…' : 'Create policy'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
