import type { PaginatedResponse } from './customer'

export interface BlockedSsnUser {
  id: number
  username: string | null
}

export interface BlockedSsn {
  id: number
  ssn: string
  reason: string | null
  added_by: BlockedSsnUser | null
  created_at: string | null
}

export interface BlockedSsnListParams {
  q?: string
  page?: number
  per_page?: number
}

export interface BlockSsnPayload {
  ssn: string
  reason?: string | null
}

export type BlockedSsnList = PaginatedResponse<BlockedSsn>
