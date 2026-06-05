import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addSinfridFamilyMember, updateSinfridFamilyMember, getErrorMessage } from '@/lib/api'
import type { SinfridMember } from '@/types/sinfrid'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  /** When set, the dialog edits this member instead of creating one. */
  member?: SinfridMember | null
  onSaved: () => void
}

export function SinfridFamilyMemberDialog({ open, onOpenChange, accountId, member, onSaved }: Props) {
  const editing = !!member
  const [form, setForm] = useState({ ssn: '', first_name: '', last_name: '', email: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setForm({
      ssn: member?.ssn ?? '',
      first_name: member?.first_name ?? '',
      last_name: member?.last_name ?? '',
      email: member?.email ?? '',
      phone: member?.phone ?? '',
    })
  }, [open, member])

  const valid = editing || form.ssn.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      if (editing && member) {
        await updateSinfridFamilyMember(accountId, member.id, {
          first_name: form.first_name || null,
          last_name: form.last_name || null,
          email: form.email || null,
          phone: form.phone || null,
        })
      } else {
        await addSinfridFamilyMember(accountId, {
          ssn: form.ssn.trim(),
          first_name: form.first_name || null,
          last_name: form.last_name || null,
          email: form.email || null,
          phone: form.phone || null,
        })
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const field = (key: keyof typeof form, label: string, type = 'text', readOnly = false) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={key} className="text-sm font-medium text-gray-700">{label}</label>
      <Input
        id={key}
        type={type}
        value={form[key]}
        readOnly={readOnly}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className={readOnly ? 'bg-gray-100' : ''}
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent onClose={() => !submitting && onOpenChange(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit family member' : 'Add family member'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update this dependent’s contact details.' : 'Add a dependent to this Sinfrid account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">{field('ssn', 'SSN' + (editing ? '' : ' *'), 'text', editing)}</div>
            {field('first_name', 'First name')}
            {field('last_name', 'Last name')}
            {field('email', 'Email', 'email')}
            {field('phone', 'Phone')}
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={!valid || submitting}>
              {submitting ? 'Saving…' : editing ? 'Save' : 'Add member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
