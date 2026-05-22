import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCustomer } from '@/hooks/useCustomer'
import { CustomerDetailHeader } from './CustomerDetailHeader'
import { CustomerDetailCard } from './CustomerDetailCard'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { customer, loading, error } = useCustomer(Number(id))

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        className="self-start -ml-2 text-muted-foreground"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} className="mr-1" />
        Back
      </Button>

      {loading && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!loading && customer && (
        <>
          <CustomerDetailHeader customer={customer} />
          <CustomerDetailCard customer={customer} />
        </>
      )}
    </div>
  )
}
