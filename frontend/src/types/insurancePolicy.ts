import type { PaginatedResponse } from './customer'

export interface InsurancePolicy {
  id: string
  request_id: string | null
  external_customer_id: string | null
  product: string | null
  start_date: string | null
  end_date: string | null
  partner_reference: string | null
  relationship: string | null
  status: string | null
  status_message: string | null
  source: string | null
  metadata: Record<string, unknown> | null
  created_at: string | null
  updated_at: string | null
}

export type InsurancePolicyList = PaginatedResponse<InsurancePolicy>
