import { useState } from 'react'
import { FileText, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { CustomerCommentRow } from './CustomerCommentRow'
import { CustomerCommentForm } from './CustomerCommentForm'
import type { Comment } from '@/lib/comments'

const BRANDS = ['All', 'Dentel', 'Grace Wellness', 'Zuave', 'Sinfrid'] as const

interface CustomerCommentsListProps {
  comments: Comment[]
  saving: boolean
  onAdd: (text: string, author: string, scope: string) => Promise<void>
  onEdit: (index: number, text: string, scope: string) => Promise<void>
  onDelete: (index: number) => Promise<void>
}

export function CustomerCommentsList({
  comments,
  saving,
  onAdd,
  onEdit,
  onDelete,
}: CustomerCommentsListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState<string>('All')

  async function handleAdd(text: string, author: string, scope: string) {
    await onAdd(text, author, scope)
    setIsAdding(false)
  }

  async function handleEdit(index: number, text: string, scope: string) {
    await onEdit(index, text, scope)
    setEditingIndex(null)
  }

  const displayed = [...comments]
    .reverse()
    .filter(c => {
      const matchesBrand = brandFilter === 'All' || c.scope?.toLowerCase() === brandFilter.toLowerCase()
      const matchesSearch = !search.trim() || (c.parseable ? c.text : c.raw).toLowerCase().includes(search.toLowerCase())
      return matchesBrand && matchesSearch
    })

  return (
    <div>
      {/* Toolbar */}
      <div className="px-5 py-3 flex items-center gap-3 border-b border-[#F0F1F7]">
        {/* Search */}
        <div className="flex items-center gap-2 border border-[#EBEBF5] rounded-lg px-3 py-1.5 bg-white focus-within:border-[#00C48C] focus-within:ring-2 focus-within:ring-[#00C48C]/10 transition-all">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search comment"
            className="text-[12px] text-[#1A1A2E] placeholder:text-gray-400 bg-transparent outline-none w-40"
          />
        </div>

        {/* Brand filter */}
        <div className="flex items-center gap-2 border border-[#EBEBF5] rounded-lg px-3 py-1.5 bg-white focus-within:border-[#00C48C] transition-all">
          <SlidersHorizontal size={13} className="text-gray-400 flex-shrink-0" />
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            className="text-[12px] text-[#1A1A2E] bg-transparent outline-none cursor-pointer"
          >
            {BRANDS.map(b => (
              <option key={b} value={b}>{b === 'All' ? 'All brands' : b}</option>
            ))}
          </select>
        </div>

        {/* Add comment — right aligned */}
        <div className="ml-auto">
          <button
            onClick={() => setIsAdding(v => !v)}
            className="flex items-center gap-1 text-[12px] font-medium text-[#00C48C] border border-[#00C48C]/40 rounded-lg px-3 py-1.5 hover:bg-[#E8FBF5] transition-colors"
          >
            <Plus size={12} />
            Add comment
          </button>
        </div>
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="px-5 py-4 border-b border-[#F0F1F7] bg-[#FAFBFF]">
          <CustomerCommentForm
            mode="add"
            saving={saving}
            onSubmit={handleAdd}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}

      {/* Comment rows */}
      {displayed.length > 0 ? (
        displayed.map(comment => (
          <CustomerCommentRow
            key={comment.index}
            comment={comment}
            isEditing={editingIndex === comment.index}
            saving={saving}
            onEditStart={() => setEditingIndex(comment.index)}
            onEditSubmit={(text, scope) => handleEdit(comment.index, text, scope)}
            onEditCancel={() => setEditingIndex(null)}
            onDelete={() => onDelete(comment.index)}
          />
        ))
      ) : (
        <div className="p-12 flex flex-col items-center text-center">
          <FileText size={32} className="text-gray-200 mb-3" />
          <p className="text-[13px] text-gray-400">
            {search || brandFilter !== 'All' ? 'No comments match your filters' : 'No comments yet'}
          </p>
        </div>
      )}
    </div>
  )
}
