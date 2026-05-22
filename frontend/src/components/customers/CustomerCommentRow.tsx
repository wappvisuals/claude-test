import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { CustomerCommentForm } from './CustomerCommentForm'
import type { Comment } from '@/lib/comments'

interface CustomerCommentRowProps {
  comment: Comment
  isEditing: boolean
  saving: boolean
  onEditStart: () => void
  onEditSubmit: (text: string, scope: string) => void
  onEditCancel: () => void
  onDelete: () => void
}

export function CustomerCommentRow({
  comment,
  isEditing,
  saving,
  onEditStart,
  onEditSubmit,
  onEditCancel,
  onDelete,
}: CustomerCommentRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isEditing) {
    return (
      <div className="px-5 py-4 border-b border-[#F0F1F7] bg-[#FAFBFF]">
        <CustomerCommentForm
          mode="edit"
          initialText={comment.text}
          initialScope={comment.scope}
          saving={saving}
          onSubmit={(text, _author, scope) => onEditSubmit(text, scope)}
          onCancel={() => { setConfirmDelete(false); onEditCancel() }}
        />
      </div>
    )
  }

  return (
    <div className="group px-5 py-4 border-b border-[#F0F1F7] last:border-0 hover:bg-gray-50/50 transition-colors">
      <p className="text-[13px] text-[#1A1A2E] whitespace-pre-wrap leading-relaxed">
        {comment.parseable ? comment.text : comment.raw}
      </p>

      {comment.parseable && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] text-gray-400">
            <span className="font-medium">{comment.author}</span>
            {' · '}
            {comment.date} {comment.time}
            {' · '}
            <span>@{comment.scope}</span>
          </p>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {confirmDelete ? (
              <>
                <button
                  onClick={onDelete}
                  disabled={saving}
                  className="text-[11px] text-red-500 hover:text-red-700 font-medium px-2 py-1 disabled:opacity-50"
                >
                  Confirm delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] text-gray-400 hover:text-gray-600 px-2 py-1"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onEditStart}
                  disabled={saving}
                  className="p-1.5 text-gray-400 hover:text-[#00C48C] rounded-lg hover:bg-[#E8FBF5] transition-colors disabled:opacity-50"
                  title="Edit comment"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Delete comment"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
