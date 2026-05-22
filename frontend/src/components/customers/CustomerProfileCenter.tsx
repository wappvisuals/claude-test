import { useState } from 'react'
import {
  FileText, RefreshCw, ShoppingCart, Filter, SlidersHorizontal, Plus,
} from 'lucide-react'
import { parseComments, serializeComments, buildCommentLine } from '@/lib/comments'
import { CustomerCommentsList } from './CustomerCommentsList'
import type { Customer, CustomerUpdatePayload } from '@/types/customer'

interface Props {
  customer: Customer
  onSave: (payload: CustomerUpdatePayload) => Promise<void>
  saving: boolean
}

type CenterTab = 'subscriptions' | 'orders' | 'comments'

// ─── Shared table primitives ───────────────────────────────────────────────────

function TableHead({ columns }: { columns: string[] }) {
  return (
    <thead>
      <tr className="border-b border-[#F0F1F7]">
        {columns.map(col => (
          <th key={col} className="text-[11px] text-gray-400 font-medium text-left px-4 py-3 whitespace-nowrap uppercase tracking-wide">
            {col}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tbody>
      <tr>
        <td colSpan={colSpan} className="text-center py-12 text-[13px] text-gray-400 italic">
          {message}
        </td>
      </tr>
    </tbody>
  )
}

function FilterSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[12px] text-gray-400 whitespace-nowrap">{label}</span>
      <select className="text-[12px] border border-[#EBEBF5] rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#00C48C] text-[#1A1A2E]">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}

function SectionFilterTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[]
  active: string
  onChange: (t: string) => void
}) {
  return (
    <div className="flex gap-4">
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`text-[13px] font-medium pb-0.5 border-b-2 transition-colors ${
            active === t
              ? 'border-[#00C48C] text-[#00C48C]'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

// ─── Subscriptions section ─────────────────────────────────────────────────────

const SUB_COLUMNS = [
  '#', 'Commitment', 'Status', 'Date Cancelled',
  'Date Churned', 'Days', 'Next Shipment', 'Prod ID', 'Reference', 'Action',
]

function SubscriptionsContent() {
  const [filter, setFilter] = useState('Approved')

  return (
    <div>
      {/* Header row */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#F0F1F7]">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[#1A1A2E]">Subscriptions</span>
          <Filter size={13} className="text-gray-400" />
        </div>
        <SectionFilterTabs
          tabs={['Approved', 'Removed']}
          active={filter}
          onChange={setFilter}
        />
      </div>

      {/* Filter controls */}
      <div className="px-5 py-3 flex items-center gap-4 border-b border-[#F0F1F7] bg-[#FAFBFF] flex-wrap">
        <FilterSelect label="Group By" options={['Remote ID', 'Product', 'Status']} />
        <FilterSelect label="Sort: ID" options={['Desc', 'Asc']} />
        <FilterSelect label="Status" options={['All', 'Active', 'Cancelled']} />
        <FilterSelect label="Past Records" options={['Hide', 'Show']} />
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-gray-400">Display Limit</span>
          <input
            type="number"
            defaultValue={100}
            className="text-[12px] border border-[#EBEBF5] rounded-lg px-2.5 py-1.5 w-16 focus:outline-none focus:ring-1 focus:ring-[#00C48C]"
          />
        </div>
        <button className="px-4 py-1.5 bg-[#00C48C] text-white text-[12px] font-semibold rounded-lg hover:bg-[#00A876] transition-colors">
          Search
        </button>
        <button className="p-1.5 border border-[#EBEBF5] rounded-lg hover:bg-gray-50 transition-colors">
          <SlidersHorizontal size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <TableHead columns={SUB_COLUMNS} />
          <EmptyRow colSpan={SUB_COLUMNS.length} message="No subscription found." />
        </table>
      </div>

      {/* Show more */}
      <div className="px-5 py-3 border-t border-dashed border-[#EBEBF5]">
        <button className="w-full text-[12px] text-[#00C48C] hover:text-[#00A876] border border-dashed border-[#00C48C]/30 rounded-lg py-2 transition-colors font-medium">
          Show more (+1)
        </button>
      </div>
    </div>
  )
}

// ─── Orders section ────────────────────────────────────────────────────────────

const ORDER_COLUMNS = [
  '#', 'Order', 'Date', 'Order ID', 'Total', 'Shipped', 'Ref', 'Ref1', 'Return', 'Action',
]

function OrdersContent() {
  const [filter, setFilter] = useState('Approved')

  return (
    <div>
      {/* Header row */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#F0F1F7]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-[#1A1A2E]">Orders</span>
            <Filter size={13} className="text-gray-400" />
          </div>
          <button className="flex items-center gap-1 text-[12px] font-medium text-[#00C48C] border border-[#00C48C]/40 rounded-lg px-3 py-1.5 hover:bg-[#E8FBF5] transition-colors">
            <Plus size={12} />
            Add Order
          </button>
        </div>
        <SectionFilterTabs
          tabs={['Approved', 'Removed', 'Rejected']}
          active={filter}
          onChange={setFilter}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <TableHead columns={ORDER_COLUMNS} />
          <EmptyRow colSpan={ORDER_COLUMNS.length} message="No order found" />
        </table>
      </div>
    </div>
  )
}


// ─── Main component ────────────────────────────────────────────────────────────

const TABS: { id: CenterTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { id: 'orders',        label: 'Orders',        icon: ShoppingCart },
  { id: 'comments',      label: 'Comments',      icon: FileText },
]

export function CustomerProfileCenter({ customer, onSave, saving }: Props) {
  const [activeTab, setActiveTab] = useState<CenterTab>('subscriptions')

  const comments = parseComments(customer.comments)

  async function handleAddComment(text: string, author: string, scope: string) {
    const line = buildCommentLine(text, author, scope)
    const existing = customer.comments?.trim() ?? ''
    await onSave({ comments: existing ? `${existing}\n${line}` : line })
  }

  async function handleEditComment(index: number, text: string, scope: string) {
    const updated = comments.map((c, i) => {
      if (i !== index || !c.parseable) return c
      return {
        ...c,
        text: text.trim(),
        scope: scope || 'all',
        raw: `${text.trim()} /${c.author}, ${c.date}, ${c.time} @${scope || 'all'}`,
      }
    })
    await onSave({ comments: serializeComments(updated) || null })
  }

  async function handleDeleteComment(index: number) {
    const updated = comments.filter((_, i) => i !== index)
    await onSave({ comments: serializeComments(updated) || null })
  }

  return (
    <div className="bg-white border border-[#EBEBF5] rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-[#EBEBF5] overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === id
                ? 'border-[#00C48C] text-[#00C48C] bg-[#E8FBF5]/40'
                : 'border-transparent text-gray-400 hover:text-[#1A1A2E] hover:bg-gray-50'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'subscriptions' && <SubscriptionsContent />}
      {activeTab === 'orders' && <OrdersContent />}
      {activeTab === 'comments' && (
        <CustomerCommentsList
          comments={comments}
          saving={saving}
          onAdd={handleAddComment}
          onEdit={handleEditComment}
          onDelete={handleDeleteComment}
        />
      )}
    </div>
  )
}
