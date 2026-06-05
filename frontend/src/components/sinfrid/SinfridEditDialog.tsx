import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateSinfridAccount, getErrorMessage } from '@/lib/api'
import type { SinfridAccount } from '@/types/sinfrid'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: SinfridAccount
  onSaved: () => void
}

export function SinfridEditDialog({ open, onOpenChange, account, onSaved }: Props) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', city: '', street: '', zipcode: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setForm({
      first_name: account.first_name ?? '',
      last_name: account.last_name ?? '',
      email: account.email ?? '',
      phone: account.phone ?? '',
      city: account.city ?? '',
      street: account.street ?? '',
      zipcode: account.zipcode ?? '',
    })
  }, [open, account])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await updateSinfridAccount(account.id, {
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        email: form.email || null,
        phone: form.phone || null,
        city: form.city || null,
        street: form.street || null,
        zipcode: form.zipcode || null,
      })
      onSaved()
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const field = (key: keyof typeof form, label: string, type = 'text') => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={key} className="text-sm font-medium text-gray-700">{label}</label>
      <Input id={key} type={type} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent onClose={() => !submitting && onOpenChange(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Sinfrid account</DialogTitle>
            <DialogDescription>Update the account holder’s contact details.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {field('first_name', 'First name')}
            {field('last_name', 'Last name')}
            {field('email', 'Email', 'email')}
            {field('phone', 'Phone')}
            {field('street', 'Street')}
            {field('city', 'City')}
            {field('zipcode', 'Zip code')}
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
