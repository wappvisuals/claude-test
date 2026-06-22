import { useState } from 'react'
import { StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addOrderNote, getErrorMessage } from '@/lib/api'
import type { Order } from '@/types/order'

export function OrderNotesPanel({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const notes = order.notes ?? []

  async function add() {
    if (!text.trim() || submitting) return
    setSubmitting(true); setError(null)
    try {
      await addOrderNote(order.id, text.trim())
      setText('')
      onChanged()
    } catch (err) { setError(getErrorMessage(err)) } finally { setSubmitting(false) }
  }

  return (
    <div className="rounded-xl border border-[#EBEBF5] bg-white p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
        <StickyNote size={16} className="text-gray-500" /> Internal notes
        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">{notes.length}</span>
      </h2>

      {notes.length > 0 && (
        <ul className="mb-4 flex flex-col gap-2">
          {notes.slice().reverse().map((n, i) => (
            <li key={i} className="rounded-lg border border-gray-100 px-3 py-2 text-[13px]">
              <p className="text-gray-700">{n.text}</p>
              <p className="mt-0.5 text-[11px] text-gray-400">{n.created_at?.slice(0, 19).replace('T', ' ') ?? '—'}</p>
            </li>
          ))}
        </ul>
      )}

      <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add an internal note…" />
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-2 flex justify-end">
        <Button size="sm" onClick={add} disabled={!text.trim() || submitting}>{submitting ? 'Saving…' : 'Add note'}</Button>
      </div>
    </div>
  )
}
