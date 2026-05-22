import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useCustomer } from '@/hooks/useCustomer'
import { useUpdateCustomer } from '@/hooks/useUpdateCustomer'
import { CustomerPageHeader } from './CustomerPageHeader'
import { CustomerProfileHeader } from './CustomerProfileHeader'
import { CustomerProfileStats } from './CustomerProfileStats'
import { CustomerProfileCenter } from './CustomerProfileCenter'
import { CustomerEditForm } from './CustomerEditForm'
import { CustomerRemindersCard } from './CustomerRemindersCard'
import type { Customer, CustomerUpdatePayload } from '@/types/customer'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { customer: fetchedCustomer, loading, error } = useCustomer(Number(id))
  const { update, saving, error: saveError, fieldErrors } = useUpdateCustomer()
  const [localCustomer, setLocalCustomer] = useState<Customer | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setLocalCustomer(null)
    setIsEditing(false)
  }, [id])

  const customer = localCustomer ?? fetchedCustomer

  async function handleSave(payload: CustomerUpdatePayload) {
    const updated = await update(Number(id), payload)
    if (updated) {
      setLocalCustomer(updated)
      setIsEditing(false)
    }
  }

  async function handleSaveNotes(payload: CustomerUpdatePayload) {
    const updated = await update(Number(id), payload)
    if (updated) setLocalCustomer(updated)
  }

  if (loading) return <CustomerDetailSkeleton />
  if (error) return (
    <div className="p-6">
      <p className="text-sm text-destructive">{error}</p>
    </div>
  )
  if (!customer) return null

  if (isEditing) {
    return (
      <div className="flex flex-col">
        <CustomerPageHeader customer={customer} onEdit={() => setIsEditing(false)} />
        <div className="p-6 max-w-3xl">
          <CustomerEditForm
            customer={customer}
            saving={saving}
            error={saveError}
            fieldErrors={fieldErrors}
            onSubmit={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <CustomerPageHeader customer={customer} onEdit={() => setIsEditing(true)} />
      <div className="flex flex-col gap-4 p-6">
        <CustomerRemindersCard
          customer={customer}
          saving={saving}
          onSave={handleSaveNotes}
        />
        <CustomerProfileHeader
          customer={customer}
          onOrgSave={(updated) => setLocalCustomer(updated)}
          onEdit={() => setIsEditing(true)}
        />
        <CustomerProfileStats customer={customer} />
        <CustomerProfileCenter
          customer={customer}
          onSave={handleSaveNotes}
          saving={saving}
        />
      </div>
    </div>
  )
}

function CustomerDetailSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="bg-white border-b border-[#EBEBF5] px-6 py-3.5 flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <div className="flex gap-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-36" />
        </div>
      </div>
      <div className="flex flex-col gap-4 p-6">
        <div className="bg-white border border-[#EBEBF5] rounded-xl p-6">
          <div className="flex items-start gap-5 mb-5">
            <Skeleton className="w-[72px] h-[72px] rounded-full flex-shrink-0" />
            <div className="flex flex-col gap-3 flex-1">
              <Skeleton className="h-7 w-48" />
              <div className="flex gap-8">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-44" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  )
}
