import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { Customer } from '@/types/customer'

interface Props {
  customer: Customer
  onEdit: () => void
}

export function CustomerPageHeader({ customer: _customer, onEdit: _onEdit }: Props) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between bg-white border-b border-[#EBEBF5] px-6 py-3.5">
      {/* Left: back + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft size={15} />
        </button>
        <span className="text-[15px] font-semibold text-[#1A1A2E]">
          Customer details
        </span>
      </div>

      {/* Right: avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-semibold">
        A
      </div>
    </div>
  )
}
