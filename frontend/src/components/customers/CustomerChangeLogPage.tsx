import { useParams } from 'react-router-dom'
import { CustomerPageHeader } from './CustomerPageHeader'
import { CustomerProfileTabs } from './CustomerProfileTabs'
import { CustomerChangeLogContent } from './CustomerChangeLog'

export function CustomerChangeLogPage() {
  const { id } = useParams<{ id: string }>()
  const customerId = Number(id)

  return (
    <div className="flex flex-col">
      <CustomerPageHeader title="Change Logs" />
      <CustomerProfileTabs id={customerId} />
      <div className="p-6">
        <div className="rounded-xl border border-[#EBEBF5] bg-white p-5">
          <CustomerChangeLogContent customerId={customerId} />
        </div>
      </div>
    </div>
  )
}
