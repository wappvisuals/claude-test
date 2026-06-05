import type { PaginatedResponse } from './customer'

export interface CustomerChangeUser {
  id: number
  username: string | null
}

export interface CustomerChange {
  change_id: number
  change_batch_id: number
  change_action: string
  change_field: string
  change_old_value: string | null
  change_new_value: string | null
  change_date: string | null
  user: CustomerChangeUser | null
}

/** One batch groups all field changes made in a single edit. */
export interface CustomerChangeBatch {
  batch_id: number
  action: string
  date: string | null
  user: CustomerChangeUser | null
  changes: CustomerChange[]
}

export interface CustomerChangeListParams {
  page?: number
  per_page?: number
}

export type CustomerChangeList = PaginatedResponse<CustomerChange>
