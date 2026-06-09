import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, CircleCheck } from 'lucide-react'
import { SearchBar } from '@/components/ui/SearchBar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ListView, ListViewHeader, ListViewToolbar, ListTable, ListThead, ListTh,
  ListRow, ListCell, ListEmpty, ListFooter,
} from '@/components/ui/ListView'
import { useOrders } from '@/hooks/useOrders'

const PER_PAGE = 25
const fmtDate = (v: string | null) => (v ? v.slice(0, 10) : '—')
const money = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const selectCls = 'h-9 rounded-md border border-[#EBEBF5] bg-white px-2.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#00C48C]'

export function OrderListPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('approved')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const { data, loading, error } = useOrders({
    status,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    q: query || undefined,
    per_page: PER_PAGE,
    page,
  })

  const rows = data?.data ?? []
  const reset = () => setPage(1)

  return (
    <div className="flex flex-col gap-5 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <ShoppingCart size={24} className="text-gray-700" />
          Orders
        </h1>
        <p className="mt-1 text-sm text-gray-500">All customer orders. Click a row to view the order.</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <ListView>
        <ListViewHeader title="Orders" icon={<ShoppingCart size={15} />} count={data?.meta.total} />

        <ListViewToolbar>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-gray-400">Status</span>
            <select value={status} onChange={(e) => { setStatus(e.target.value); reset() }} className={selectCls}>
              <option value="approved">Approved</option>
              <option value="cancelled">Cancelled</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-gray-400">From</span>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); reset() }} className={selectCls} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-gray-400">To</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); reset() }} className={selectCls} />
          </div>
          <SearchBar onSearch={(q) => { setQuery(q.trim()); reset() }} placeholder="Search ref or order id…" />
        </ListViewToolbar>

        <ListTable>
          <ListThead>
            <ListTh className="w-24">Order ID</ListTh>
            <ListTh>Customer</ListTh>
            <ListTh>Product</ListTh>
            <ListTh className="w-32">Date</ListTh>
            <ListTh className="w-28 text-right">Total</ListTh>
            <ListTh className="w-20 text-center">Paid</ListTh>
            <ListTh className="w-20 text-center">Shipped</ListTh>
            <ListTh className="w-28">Status</ListTh>
          </ListThead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <ListRow key={i}><ListCell colSpan={8}><Skeleton className="h-5 w-full" /></ListCell></ListRow>
              ))
            ) : rows.length === 0 ? (
              <ListEmpty colSpan={8} message="No orders found." />
            ) : (
              rows.map((o) => (
                <ListRow key={o.id} onClick={() => navigate(`/orders/${o.id}`)}>
                  <ListCell className="font-mono">{o.id}</ListCell>
                  <ListCell className="text-gray-600">
                    {o.customer ? `${o.customer.first_name} ${o.customer.last_name}` : o.by_user}
                  </ListCell>
                  <ListCell className="text-gray-600">{o.product_name ?? o.prod_id}</ListCell>
                  <ListCell className="text-gray-500">{fmtDate(o.date_added)}</ListCell>
                  <ListCell className="text-right">{money(o.total)}</ListCell>
                  <ListCell className="text-center">{o.is_paid ? 'Yes' : <span className="text-gray-300">No</span>}</ListCell>
                  <ListCell className="text-center">
                    {o.is_shipped ? <CircleCheck size={16} className="mx-auto text-[#00C48C]" /> : <span className="text-gray-300">—</span>}
                  </ListCell>
                  <ListCell>
                    {o.is_cancelled
                      ? <span className="rounded-full bg-[#FDECEC] px-2 py-0.5 text-[11px] font-semibold text-[#E5484D]">Cancelled</span>
                      : <span className="rounded-full bg-[#E8FBF5] px-2 py-0.5 text-[11px] font-semibold text-[#00A876]">Approved</span>}
                  </ListCell>
                </ListRow>
              ))
            )}
          </tbody>
        </ListTable>

        {data && (
          <ListFooter
            from={data.meta.from}
            to={data.meta.to}
            total={data.meta.total}
            currentPage={data.meta.current_page}
            lastPage={data.meta.last_page}
            noun="orders"
            onPageChange={setPage}
          />
        )}
      </ListView>
    </div>
  )
}
