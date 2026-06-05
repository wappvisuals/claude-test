import type { PaginatedResponse } from './customer'

export type GdprStatus = 'flagged' | 'pending_review' | 'anonymized' | 'restored' | 'rejected'

export type GdprExclusionType = '2y_after_starter' | 'subscription_end'

export interface GdprExclusionOption {
  type: GdprExclusionType
  description: string
}

export interface GdprRequester {
  id: number
  username: string | null
}

export interface GdprCustomer {
  id: string
  customer_id: number
  customer_name: string | null
  status: GdprStatus
  status_label: string
  exclusion_type: GdprExclusionType | null
  exclusion_description: string | null
  flagged_at: string | null
  anonymized_at: string | null
  restored_at: string | null
  requested_by: GdprRequester | null
  source: string | null
}

/** Bulk actions supported by POST /gdpr/bulk-action. */
export type GdprBulkAction = 'flag' | 'unflag' | 'anonymize' | 'reject' | 'restore'

export interface GdprListParams {
  status?: GdprStatus[]
  page?: number
  per_page?: number
}

export interface GdprBulkActionPayload {
  action: GdprBulkAction
  customers: number[]
}

export type GdprCustomerList = PaginatedResponse<GdprCustomer>
