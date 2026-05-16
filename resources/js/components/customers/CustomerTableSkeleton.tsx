const ROWS = 8

export function CustomerTableSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: ROWS }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
          <div className="h-3.5 w-12 flex-shrink-0 rounded bg-gray-200" />
          <div className="h-3.5 w-32 flex-shrink-0 rounded bg-gray-200" />
          <div className="h-3 w-24 flex-shrink-0 rounded bg-gray-200" />
          <div className="h-3.5 flex-1 rounded bg-gray-200" />
          <div className="h-3.5 w-28 flex-shrink-0 rounded bg-gray-200" />
          <div className="h-3.5 w-36 flex-shrink-0 rounded bg-gray-200" />
          <div className="h-3 w-20 flex-shrink-0 rounded bg-gray-200" />
          <div className="h-4 w-4 flex-shrink-0 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  )
}
