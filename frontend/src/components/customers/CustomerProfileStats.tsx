import { RefreshCw, ShoppingCart, FileText, Clock } from 'lucide-react'
import type { Customer } from '@/types/customer'

interface Props {
  customer: Customer
}

interface StatCardProps {
  icon: React.ReactNode
  iconBg: string
  title: string
  leftLabel: string
  leftValue: string
  rightLabel: string
  rightValue: string
}

function StatCard({ icon, iconBg, title, leftLabel, leftValue, rightLabel, rightValue }: StatCardProps) {
  return (
    <div className="bg-white border border-[#EBEBF5] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-[12px] font-medium text-gray-400 uppercase tracking-wide">{title}</span>
      </div>

      <div className="flex items-end gap-6">
        <div>
          <p className="text-[22px] font-bold text-[#1A1A2E] leading-none">{leftValue}</p>
          <p className="text-[10px] text-[#00C48C] font-semibold mt-1 uppercase tracking-wide">{leftLabel}</p>
        </div>
        <div>
          <p className="text-[22px] font-bold text-[#1A1A2E] leading-none">{rightValue}</p>
          <p className="text-[10px] text-orange-400 font-semibold mt-1 uppercase tracking-wide">{rightLabel}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[#F5F6FA]">
        <span className="text-[11px] text-gray-400">↑ Updated recently</span>
        <button className="text-[11px] text-[#00C48C] font-medium hover:underline">View more</button>
      </div>
    </div>
  )
}

function HighlightCard({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col justify-between"
      style={{ background: 'linear-gradient(135deg, #00C48C 0%, #00A876 100%)' }}
    >
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-white/80" />
        <span className="text-[12px] font-medium text-white/80 uppercase tracking-wide">Last order</span>
      </div>

      <div>
        <p className="text-[26px] font-bold text-white leading-none mt-4">{value}</p>
        <p className="text-[11px] text-white/70 mt-1 uppercase tracking-wide">{label}</p>
      </div>

      <button className="mt-4 text-[12px] font-semibold text-white/90 border border-white/30 rounded-lg py-2 hover:bg-white/10 transition-colors">
        View Details
      </button>
    </div>
  )
}

export function CustomerProfileStats({ customer }: Props) {
  const ledgerCount = Array.isArray(customer.ledgers) ? customer.ledgers.length : 0
  const lastOrder = customer.last_order ?? 'No orders'

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        icon={<RefreshCw size={15} className="text-yellow-600" />}
        iconBg="bg-yellow-50"
        title="Subscriptions"
        leftLabel="Active"
        leftValue="0"
        rightLabel="Cancelled"
        rightValue="0"
      />
      <StatCard
        icon={<ShoppingCart size={15} className="text-blue-500" />}
        iconBg="bg-blue-50"
        title="Orders"
        leftLabel="Approved"
        leftValue="0"
        rightLabel="Pending"
        rightValue="0"
      />
      <StatCard
        icon={<FileText size={15} className="text-rose-500" />}
        iconBg="bg-rose-50"
        title="Invoices"
        leftLabel="Records"
        leftValue={String(ledgerCount)}
        rightLabel="Region"
        rightValue={customer.region_code ?? '—'}
      />
      <HighlightCard
        value={lastOrder}
        label={customer.last_order ? 'Last order date' : 'No orders yet'}
      />
    </div>
  )
}
