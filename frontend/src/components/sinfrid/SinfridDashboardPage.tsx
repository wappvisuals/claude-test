import { useParams } from 'react-router-dom'
import { CustomerPageHeader } from '@/components/customers/CustomerPageHeader'
import { CustomerProfileTabs } from '@/components/customers/CustomerProfileTabs'
import { InsurancePoliciesCard } from '@/components/insurance/InsurancePoliciesCard'
import { SinfridAccountCard } from './SinfridAccountCard'

/**
 * Dedicated Sinfrid dashboard for a customer — its own screen within the
 * profile (reached via the profile sub-nav), separate from the overview.
 */
export function SinfridDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const customerId = Number(id)

  return (
    <div className="flex flex-col">
      <CustomerPageHeader title="Sinfrid Account" />
      <CustomerProfileTabs id={customerId} />
      <div className="grid grid-cols-1 items-start gap-4 p-6 lg:grid-cols-2">
        <SinfridAccountCard customerId={customerId} />
        <InsurancePoliciesCard customerId={customerId} />
      </div>
    </div>
  )
}
