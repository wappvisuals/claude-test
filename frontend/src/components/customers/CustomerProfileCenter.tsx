import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw, ShoppingCart, Filter, SlidersHorizontal, Plus, CircleCheck,
  ChevronDown, ChevronRight,
} from 'lucide-react'
import { useCustomerSubscriptions } from '@/hooks/useCustomerSubscriptions'
import { useCustomerOrders } from '@/hooks/useCustomerOrders'
import type { SubscriptionGroupItem } from '@/types/subscription'

type CenterTab = 'subscriptions' | 'orders'

const dash = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v))
const fmtDate = (v: string | null) => (v ? v.slice(0, 10) : '—')
const fmtMoney = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const cell = 'px-4 py-3 text-[13px] text-[#1A1A2E] whitespace-nowrap'

// Brand filter options (products.brand enum) — "All" clears the filter.
const BRANDS = ['All', 'grace', 'sinfrid', 'dentle', 'zuave']
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Small circular brand badge shown on each product group header.
function BrandAvatar({ brand }: { brand: string | null }) {
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-[#EBEBF5] bg-white text-[12px] font-semibold text-[#00A876] flex-shrink-0">
      {(brand ?? '?').charAt(0).toUpperCase()}
    </span>
  )
}

// Left accent + indent that visually nests grouped member rows under their header.
const groupedRow = 'bg-[#FBFEFC] hover:bg-[#F1F9F5]'
const nestCell = 'py-3 pr-4 pl-10 text-[13px] text-[#1A1A2E] whitespace-nowrap border-l-[3px] border-[#00C48C]/30'

// A collapsible product/remote-id group header spanning the whole table width.
function GroupHeader({
  label, brand, count, colSpan, collapsed, onToggle,
}: {
  label: string | null
  brand: string | null
  count: number
  colSpan: number
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0 border-y border-[#DCE7F0]">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left bg-[#EEF6F2] hover:bg-[#E2F2EA] border-l-[3px] border-[#00C48C] transition-colors"
        >
          {collapsed
            ? <ChevronRight size={15} className="text-[#00A876]" />
            : <ChevronDown size={15} className="text-[#00A876]" />}
          <BrandAvatar brand={brand} />
          <span className="text-[13px] font-semibold text-[#1A1A2E]">{label ?? '—'}</span>
          <span className="text-[11px] font-medium text-[#00A876] bg-white border border-[#CDE8DC] rounded-full px-2 py-0.5">
            {count}
          </span>
        </button>
      </td>
    </tr>
  )
}

// Commitment progress: "order_count / commitment" with a thin progress bar.
function CommitmentProgress({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0
  return (
    <div className="min-w-[88px]">
      <div className="text-[12px] text-[#1A1A2E] mb-1">{count} / {total}</div>
      <div className="h-1.5 bg-[#EBEBF5] rounded-full overflow-hidden">
        <div className="h-full bg-[#00C48C] rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// Status pill (+ cancel detail) for a subscription row.
function SubStatusCell({ s }: { s: SubscriptionGroupItem }) {
  if (s.active) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full bg-[#E8FBF5] text-[#00A876] text-[11px] font-semibold">
        Active
      </span>
    )
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex w-fit px-2 py-0.5 rounded-full bg-[#FDECEC] text-[#E5484D] text-[11px] font-semibold">
        Inactive
      </span>
      {s.cancel_method && <span className="text-[11px] text-gray-500">{cap(s.cancel_method)}</span>}
      {s.date_churned && <span className="text-[11px] text-gray-400">Churn: {s.date_churned}</span>}
    </div>
  )
}

// Renders loading / error / empty states inside an existing <table>, matching
// the static EmptyRow styling, or the provided rows when data is present.
function TableBody({
  loading, error, count, colSpan, emptyMessage, children,
}: {
  loading: boolean
  error: string | null
  count: number
  colSpan: number
  emptyMessage: string
  children: React.ReactNode
}) {
  if (loading || error || count === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={colSpan} className="text-center py-12 text-[13px] text-gray-400 italic">
            {loading ? 'Loading…' : error ? error : emptyMessage}
          </td>
        </tr>
      </tbody>
    )
  }
  return <tbody>{children}</tbody>
}

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

// Controlled brand filter dropdown (wired to the API `brand` param).
function BrandSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[12px] text-gray-400 whitespace-nowrap">Brand</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-[12px] border border-[#EBEBF5] rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#00C48C] text-[#1A1A2E]"
      >
        {BRANDS.map(b => <option key={b} value={b}>{b === 'All' ? 'All' : cap(b)}</option>)}
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
  'Date Churned', 'Next Shipment', 'Prod ID', 'Reference', 'Action',
]

function SubscriptionsContent({ customerId }: { customerId: number }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('Approved')
  const [brand, setBrand] = useState('All')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggle = (key: string) => setCollapsed(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })
  const { data, loading, error } = useCustomerSubscriptions(customerId, { brand })
  const groups = data?.data ?? []
  const itemCount = groups.reduce((n, g) => n + g.items.length, 0)

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
        <BrandSelect value={brand} onChange={setBrand} />
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
          <TableBody
            loading={loading}
            error={error}
            count={itemCount}
            colSpan={SUB_COLUMNS.length}
            emptyMessage="No subscription found."
          >
            {groups.flatMap(group => {
              const trs = []
              const isCollapsed = collapsed.has(group.group_key)
              if (group.is_group) {
                trs.push(
                  <GroupHeader
                    key={`h-${group.group_key}`}
                    label={group.label}
                    brand={group.brand}
                    count={group.items.length}
                    colSpan={SUB_COLUMNS.length}
                    collapsed={isCollapsed}
                    onToggle={() => toggle(group.group_key)}
                  />
                )
                if (isCollapsed) return trs
              }
              group.items.forEach(s => {
                trs.push(
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/subscriptions/${s.id}`)}
                    className={`border-b border-[#F0F1F7] cursor-pointer ${group.is_group ? groupedRow : 'hover:bg-[#FAFBFF]'}`}
                  >
                    <td className={group.is_group ? nestCell : cell}>
                      <div className="flex items-center gap-2">
                        {s.sequence != null && (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-[#1A1A2E] text-white text-[10px] font-semibold">
                            {s.sequence}
                          </span>
                        )}
                        <span>{s.id}</span>
                      </div>
                    </td>
                    <td className={cell}><CommitmentProgress count={s.order_count} total={s.commitment} /></td>
                    <td className={cell}><SubStatusCell s={s} /></td>
                    <td className={cell}>
                      {s.date_cancelled ? s.date_cancelled : <span className="text-gray-300 italic">empty</span>}
                    </td>
                    <td className={cell}>{fmtDate(s.date_churned)}</td>
                    <td className={cell}>{fmtDate(s.next_shipment)}</td>
                    <td className={cell}>{dash(s.prod_id)}</td>
                    <td className={cell}>{dash(s.reference)}</td>
                    <td className={cell}>
                      {s.active
                        ? <span className="text-[#E5484D] font-medium">Cancel</span>
                        : <span className="text-[#00C48C] font-medium">Restart</span>}
                    </td>
                  </tr>
                )
              })
              return trs
            })}
          </TableBody>
        </table>
      </div>

      {/* Show more */}
      {data && data.meta.returned < data.meta.total && (
        <div className="px-5 py-3 border-t border-dashed border-[#EBEBF5]">
          <button className="w-full text-[12px] text-[#00C48C] hover:text-[#00A876] border border-dashed border-[#00C48C]/30 rounded-lg py-2 transition-colors font-medium">
            Show more (+{data.meta.total - data.meta.returned})
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Orders section ────────────────────────────────────────────────────────────

const ORDER_COLUMNS = [
  '#', 'Order', 'Date', 'Order ID', 'Total', 'Shipped', 'Ref', 'Ref1', 'Return', 'Action',
]

function OrdersContent({ customerId }: { customerId: number }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('Approved')
  const [brand, setBrand] = useState('All')
  const [status, setStatus] = useState<'approved' | 'cancelled' | 'all'>('approved')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggle = (key: string) => setCollapsed(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })
  const { data, loading, error } = useCustomerOrders(customerId, { brand, status })
  const groups = data?.data ?? []
  const itemCount = groups.reduce((n, g) => n + g.items.length, 0)

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
          <BrandSelect value={brand} onChange={setBrand} />
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-gray-400 whitespace-nowrap">Status</span>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as 'approved' | 'cancelled' | 'all')}
              className="text-[12px] border border-[#EBEBF5] rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#00C48C] text-[#1A1A2E]"
            >
              <option value="approved">Approved</option>
              <option value="cancelled">Cancelled</option>
              <option value="all">All</option>
            </select>
          </div>
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
          <TableBody
            loading={loading}
            error={error}
            count={itemCount}
            colSpan={ORDER_COLUMNS.length}
            emptyMessage="No order found"
          >
            {groups.flatMap(group => {
              const isCollapsed = collapsed.has(group.group_key)
              const trs = [
                <GroupHeader
                  key={`h-${group.group_key}`}
                  label={group.label}
                  brand={group.brand}
                  count={group.items.length}
                  colSpan={ORDER_COLUMNS.length}
                  collapsed={isCollapsed}
                  onToggle={() => toggle(group.group_key)}
                />,
              ]
              if (isCollapsed) return trs
              group.items.forEach(o => {
                trs.push(
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/orders/${o.id}`)}
                    className={`border-b border-[#F0F1F7] cursor-pointer ${groupedRow}`}
                  >
                    <td className={nestCell}>{dash(o.prod_id)}</td>
                    <td className={cell}>{dash(o.product_name)}</td>
                    <td className={cell}>{fmtDate(o.date_added)}</td>
                    <td className={cell}>{o.id}</td>
                    <td className={cell}>{fmtMoney(o.total)}</td>
                    <td className={cell}>
                      {o.is_shipped
                        ? <CircleCheck size={16} className="text-[#00C48C]" />
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className={cell}>{dash(o.ref)}</td>
                    <td className={cell}>{dash(o.ref1)}</td>
                    <td className={cell}>{o.is_cancelled ? 'Cancelled' : '—'}</td>
                    <td className={cell}>—</td>
                  </tr>
                )
              })
              return trs
            })}
          </TableBody>
        </table>
      </div>
    </div>
  )
}


// ─── Main component ────────────────────────────────────────────────────────────

const TABS: { id: CenterTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { id: 'orders',        label: 'Orders',        icon: ShoppingCart },
]

export function CustomerProfileCenter({ customerId }: { customerId: number }) {
  const [activeTab, setActiveTab] = useState<CenterTab>('subscriptions')

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
      {activeTab === 'subscriptions' && <SubscriptionsContent customerId={customerId} />}
      {activeTab === 'orders' && <OrdersContent customerId={customerId} />}
    </div>
  )
}
