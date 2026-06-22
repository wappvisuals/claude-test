import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useOrderInvoices } from '@/hooks/useOrderInvoices'

const money = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const tone = (status: string | null) =>
  status === 'deleted' ? 'bg-gray-100 text-gray-500' : 'bg-[#E8FBF5] text-[#00A876]'

export function InvoicesPanel({ orderId }: { orderId: number }) {
  const navigate = useNavigate()
  const { data, loading, error } = useOrderInvoices(orderId)
  const invoices = data?.data ?? []

  return (
    <div className="rounded-xl border border-[#EBEBF5] bg-white p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
        <FileText size={16} className="text-gray-500" /> Invoices
        {data && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">{invoices.length}</span>}
      </h2>
      {loading ? (
        <p className="py-4 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : invoices.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">No invoices for this order.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {invoices.map((inv) => (
            <button
              key={inv.id}
              onClick={() => navigate(`/invoices/${inv.id}`)}
              className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 px-4 py-3 text-left transition-colors hover:bg-[#FAFBFF]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[#00A876]">#{inv.invoice_id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone(inv.status)}`}>{inv.status ?? '—'}</span>
                  {inv.provider && <span className="text-[11px] text-gray-400">{inv.provider}</span>}
                </div>
                <p className="mt-0.5 text-xs text-gray-400">Due {inv.due_date ?? '—'} · Balance {money(inv.balance)}</p>
              </div>
              <span className="text-[13px] font-medium text-[#1A1A2E]">{money(inv.total)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
