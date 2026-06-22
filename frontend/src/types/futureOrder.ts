export interface FutureOrderJob {
  id: number
  subscription_id: number
  batch: string | null
  status: 'queued' | 'done' | 'failed' | 'skipped' | 'cancelled'
  cycle: number | null
  prod_id: number | string | null
  execute_at: string | null
  created_at: string | null
}

export type FutureOrderJobList = { data: FutureOrderJob[] }
