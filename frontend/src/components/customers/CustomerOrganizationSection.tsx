import { useState } from 'react'
import { Building2, Link } from 'lucide-react'
import { useOrganizationUpsert } from '@/hooks/useOrganizationUpsert'
import { CustomerOrganizationForm } from './CustomerOrganizationForm'
import type { Customer } from '@/types/customer'

interface Props {
  customer: Customer
  saving: boolean
  onSave: (customer: Customer) => void
}

export function CustomerOrganizationSection({ customer, saving, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const { upsert, saving: upserting, error, fieldErrors } = useOrganizationUpsert()

  async function handleSubmit(orgId: string, name: string | undefined) {
    const updated = await upsert(customer.id, { organization_id: orgId, name })
    if (updated) {
      onSave(updated)
      setIsEditing(false)
    }
  }

  const hasOrg = !!customer.organization_id

  return (
    <div className="bg-white border border-[#EBEBF5] rounded-xl p-5">
      {isEditing ? (
        /* ── Edit mode: card IS the form, no redundant header above it ── */
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Building2 size={16} className="text-indigo-500" />
            </div>
            <p className="text-[13px] font-semibold text-[#1A1A2E]">
              {hasOrg ? 'Change Organization' : 'Link Organization'}
            </p>
          </div>
          <CustomerOrganizationForm
            customerId={customer.id}
            initialOrgId={customer.organization_id ?? ''}
            saving={saving || upserting}
            error={error}
            fieldErrors={fieldErrors}
            onSuccess={onSave}
            onCancel={() => setIsEditing(false)}
            onSubmit={handleSubmit}
          />
        </>
      ) : (
        /* ── View mode: show org info + Link/Change button ── */
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Building2 size={16} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#1A1A2E]">Organization</p>
              <p className="text-[12px] text-gray-400 mt-0.5">
                {hasOrg
                  ? <span className="text-[#1A1A2E] font-medium">{customer.organization_id}</span>
                  : <span>— none —</span>
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            disabled={saving || upserting}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold border border-[#EBEBF5] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Link size={12} />
            {hasOrg ? 'Change' : 'Link'}
          </button>
        </div>
      )}
    </div>
  )
}
