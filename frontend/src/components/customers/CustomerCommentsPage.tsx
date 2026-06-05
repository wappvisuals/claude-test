import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useCustomer } from '@/hooks/useCustomer'
import { useUpdateCustomer } from '@/hooks/useUpdateCustomer'
import { parseComments, serializeComments, buildCommentLine } from '@/lib/comments'
import { CustomerPageHeader } from './CustomerPageHeader'
import { CustomerProfileTabs } from './CustomerProfileTabs'
import { CustomerCommentsList } from './CustomerCommentsList'
import type { Customer } from '@/types/customer'

export function CustomerCommentsPage() {
  const { id } = useParams<{ id: string }>()
  const customerId = Number(id)
  const { customer: fetched, loading, error } = useCustomer(customerId)
  const { update, saving } = useUpdateCustomer()
  const [local, setLocal] = useState<Customer | null>(null)

  useEffect(() => { setLocal(null) }, [id])

  const customer = local ?? fetched
  const comments = parseComments(customer?.comments ?? null)

  async function save(value: string | null) {
    const updated = await update(customerId, { comments: value })
    if (updated) setLocal(updated)
  }

  async function handleAdd(text: string, author: string, scope: string) {
    const line = buildCommentLine(text, author, scope)
    const existing = customer?.comments?.trim() ?? ''
    await save(existing ? `${existing}\n${line}` : line)
  }

  async function handleEdit(index: number, text: string, scope: string) {
    const updated = comments.map((c, i) => {
      if (i !== index || !c.parseable) return c
      return {
        ...c,
        text: text.trim(),
        scope: scope || 'all',
        raw: `${text.trim()} /${c.author}, ${c.date}, ${c.time} @${scope || 'all'}`,
      }
    })
    await save(serializeComments(updated) || null)
  }

  async function handleDelete(index: number) {
    const updated = comments.filter((_, i) => i !== index)
    await save(serializeComments(updated) || null)
  }

  return (
    <div className="flex flex-col">
      <CustomerPageHeader title="Comments" />
      <CustomerProfileTabs id={customerId} />
      <div className="p-6">
        {loading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#EBEBF5] bg-white">
            <CustomerCommentsList
              comments={comments}
              saving={saving}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>
    </div>
  )
}
