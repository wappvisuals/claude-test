import { CustomerTableRow } from './CustomerTableRow'
import { CustomerTableSkeleton } from './CustomerTableSkeleton'
import { ListTable, ListThead, ListTh, ListEmpty } from '@/components/ui/ListView'
import type { Customer, PaginatedResponse } from '@/types/customer'

interface CustomerTableProps {
  data: PaginatedResponse<Customer> | null
  loading: boolean
  searchTokens: string[]
}

export function CustomerTable({ data, loading, searchTokens }: CustomerTableProps) {
  const rows = data?.data ?? []

  return (
    <ListTable>
      <ListThead>
        <ListTh className="w-16">ID</ListTh>
        <ListTh>Name</ListTh>
        <ListTh className="w-32">SSN</ListTh>
        <ListTh>Address</ListTh>
        <ListTh className="w-36">Phone</ListTh>
        <ListTh className="w-48">Email</ListTh>
        <ListTh className="w-28 text-right">Last Order</ListTh>
        <ListTh className="w-10" />
      </ListThead>
      <tbody>
        {loading ? (
          <CustomerTableSkeleton />
        ) : rows.length === 0 ? (
          <ListEmpty colSpan={8} message="No customers found." />
        ) : (
          rows.map((customer) => (
            <CustomerTableRow key={customer.id} customer={customer} searchTokens={searchTokens} />
          ))
        )}
      </tbody>
    </ListTable>
  )
}
