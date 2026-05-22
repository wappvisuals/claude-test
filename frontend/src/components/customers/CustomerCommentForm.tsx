import { useState } from 'react'
import { Button } from '@/components/ui/button'

const BRANDS = ['All', 'Dentel', 'Grace Wellness', 'Zuave', 'Sinfrid'] as const

interface CustomerCommentFormProps {
  mode: 'add' | 'edit'
  initialText?: string
  initialScope?: string
  saving: boolean
  onSubmit: (text: string, author: string, scope: string) => void
  onCancel: () => void
}

export function CustomerCommentForm({
  mode,
  initialText = '',
  initialScope = BRANDS[0],
  saving,
  onSubmit,
  onCancel,
}: CustomerCommentFormProps) {
  const [text, setText] = useState(initialText)
  const [scope, setScope] = useState(
    // keep existing scope if it matches a brand, otherwise default to first brand
    BRANDS.includes(initialScope as typeof BRANDS[number]) ? initialScope : BRANDS[0]
  )
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedText = text.trim()
    if (!trimmedText) { setError('Comment text is required.'); return }
    if (trimmedText.includes('\n')) { setError('Comment must be a single line.'); return }
    if (trimmedText.length > 1000) { setError('Max 1000 characters.'); return }

    setError(null)
    onSubmit(trimmedText, 'user', scope)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setError(null) }}
        placeholder="Write a comment..."
        rows={3}
        disabled={saving}
        className="w-full px-4 py-3 text-[13px] bg-[#FAFBFF] border border-[#EBEBF5] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#00C48C]/20 focus:border-[#00C48C] placeholder:text-gray-400 disabled:opacity-50"
      />

      <div className="flex items-center gap-2">
        <span className="text-[12px] text-gray-400 flex-shrink-0">Brand</span>
        <select
          value={scope}
          onChange={e => { setScope(e.target.value); setError(null) }}
          disabled={saving}
          className="text-[13px] border border-[#EBEBF5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#00C48C]/20 focus:border-[#00C48C] text-[#1A1A2E] disabled:opacity-50"
        >
          {BRANDS.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-[12px] text-red-500">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving…' : mode === 'add' ? 'Add comment' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
