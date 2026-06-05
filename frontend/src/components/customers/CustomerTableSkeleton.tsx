import { Skeleton } from '@/components/ui/skeleton'
import { ListRow, ListCell } from '@/components/ui/ListView'

const ROWS = 8
const COLS = 8

export function CustomerTableSkeleton() {
  return (
    <>
      {Array.from({ length: ROWS }).map((_, i) => (
        <ListRow key={i}>
          {Array.from({ length: COLS }).map((_, j) => (
            <ListCell key={j}><Skeleton className="h-4 w-full" /></ListCell>
          ))}
        </ListRow>
      ))}
    </>
  )
}
