import { useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { buildCommentLine } from '@/lib/comments'
import type { Customer, CustomerUpdatePayload } from '@/types/customer'

interface Props {
  customer: Customer
  saving: boolean
  onSave: (payload: CustomerUpdatePayload) => Promise<void>
}

export function CustomerRemindersCard({ customer, saving, onSave }: Props) {
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [reason, setReason] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)

  const active = customer.reminders === true

  async function handleActivate() {
    await onSave({ reminders: true })
  }

  async function handleDeactivateConfirm() {
    const trimmed = reason.trim()
    if (!trimmed) {
      setClientError('Please enter a reason.')
      return
    }
    setClientError(null)

    const line = buildCommentLine(`Reminders deactivated: ${trimmed}`, 'system', 'all')
    const existing = customer.comments?.trim() ?? ''
    const comments = existing ? `${existing}\n${line}` : line

    await onSave({ reminders: false, comments })
    setIsDeactivating(false)
    setReason('')
  }

  function handleDeactivateCancel() {
    setIsDeactivating(false)
    setReason('')
    setClientError(null)
  }

  return (
    <div className="bg-white border border-[#EBEBF5] rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${active ? 'bg-[#E8FBF5]' : 'bg-gray-100'}`}>
            {active
              ? <Bell size={16} className="text-[#00C48C]" />
              : <BellOff size={16} className="text-gray-400" />
            }
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#1A1A2E]">Reminders</p>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {active ? 'Reminders are currently active for this customer.' : 'Reminders are currently inactive.'}
            </p>
          </div>
        </div>

        {!isDeactivating && (
          <button
            onClick={active ? () => setIsDeactivating(true) : handleActivate}
            disabled={saving}
            className={`flex-shrink-0 px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-50 ${
              active
                ? 'border border-red-200 text-red-500 hover:bg-red-50'
                : 'bg-[#00C48C] text-white hover:bg-[#00A876]'
            }`}
          >
            {active ? 'Deactivate' : 'Activate'}
          </button>
        )}
      </div>

      {isDeactivating && (
        <div className="mt-4 border-t border-[#F0F1F7] pt-4 flex flex-col gap-3">
          <div>
            <label className="block text-[12px] font-medium text-[#1A1A2E] mb-1.5">
              Reason for deactivation
            </label>
            <textarea
              value={reason}
              onChange={e => { setReason(e.target.value); setClientError(null) }}
              rows={3}
              maxLength={1000}
              placeholder="Enter reason..."
              className="w-full text-[13px] border border-[#EBEBF5] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00C48C]/20 focus:border-[#00C48C] resize-none placeholder:text-gray-400"
            />
            {clientError && (
              <p className="text-[11px] text-red-500 mt-1">{clientError}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeactivateConfirm}
              disabled={saving}
              className="px-4 py-1.5 bg-red-500 text-white text-[12px] font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              Confirm deactivate
            </button>
            <button
              onClick={handleDeactivateCancel}
              disabled={saving}
              className="px-4 py-1.5 text-[12px] text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
