import axios, { AxiosError } from 'axios'
import type {
  Customer,
  CustomerListParams,
  CustomerSearchParams,
  CustomerUpdatePayload,
  PaginatedResponse,
} from '@/types/customer'
import type { Organization } from '@/types/organization'
import type { BlockedSsn, BlockedSsnList, BlockedSsnListParams, BlockSsnPayload } from '@/types/blockedSsn'
import type {
  GdprCustomer,
  GdprCustomerList,
  GdprListParams,
  GdprExclusionOption,
  GdprExclusionType,
  GdprStatus,
  GdprBulkActionPayload,
} from '@/types/gdpr'
import type { CustomerChangeList, CustomerChangeListParams } from '@/types/customerChange'
import type { InsurancePolicy, InsurancePolicyList } from '@/types/insurancePolicy'
import type { Subscription, SubscriptionGroupList, CustomerSubscriptionParams } from '@/types/subscription'
import type { Order, OrderList, OrderGroupList, OrderAdjustment, CustomerOrderParams } from '@/types/order'
import type { CustomerStoreStats } from '@/types/storeStats'
import type {
  SinfridAccount,
  SinfridAlarmList,
  SinfridActivity,
  SinfridMember,
  SinfridMemberPayload,
  SinfridPlan,
} from '@/types/sinfrid'

// In production there is no Vite dev-proxy, so we use the full external URL.
// In development the proxy intercepts /api/* — VITE_BACKEND_URL is still read
// by vite.config.ts so the proxy forwards to the right backend automatically.
const BASE_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : '/api'

const http = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

/**
 * Converts a params object to URLSearchParams.
 * Arrays (e.g. status[]) become repeated keys: status[]=active&status[]=blocked
 * Undefined, null, and empty strings are omitted.
 */
function buildParams(params: Record<string, unknown>): URLSearchParams {
  const qs = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue

    if (Array.isArray(value)) {
      value.forEach((item) => qs.append(`${key}[]`, String(item)))
    } else {
      qs.set(key, String(value))
    }
  }

  return qs
}

// ─── Customer List ────────────────────────────────────────────────────────────

export async function fetchCustomers(
  params: CustomerListParams = {}
): Promise<PaginatedResponse<Customer>> {
  const response = await http.get<PaginatedResponse<Customer>>('/customers', {
    params: buildParams(params as Record<string, unknown>),
  })
  return response.data
}

// ─── Customer Search ──────────────────────────────────────────────────────────

export async function searchCustomers(
  params: CustomerSearchParams
): Promise<PaginatedResponse<Customer>> {
  const response = await http.get<PaginatedResponse<Customer>>('/customers/search', {
    params: buildParams(params as Record<string, unknown>),
  })
  return response.data
}

// ─── Customer Detail ──────────────────────────────────────────────────────────

// The show endpoint returns { data: Customer } (single-resource envelope)
export async function fetchCustomer(id: number): Promise<Customer> {
  const response = await http.get<{ data: Customer }>(`/customers/${id}`)
  return response.data.data
}

// ─── Customer Update ──────────────────────────────────────────────────────────

export async function updateCustomer(id: number, payload: CustomerUpdatePayload): Promise<Customer> {
  const response = await http.patch<{ data: Customer }>(`/customers/${id}`, payload)
  return response.data.data
}

// ─── Organizations ────────────────────────────────────────────────────────────

export async function searchOrganizations(q: string, perPage = 15): Promise<PaginatedResponse<Organization>> {
  const response = await http.get<PaginatedResponse<Organization>>('/organizations', {
    params: buildParams({ q, per_page: perPage }),
  })
  return response.data
}

export async function upsertOrganization(
  customerId: number,
  payload: { organization_id: string; name?: string | null }
): Promise<Customer> {
  const response = await http.put<{ data: Customer }>(`/customers/${customerId}/organization`, payload)
  return response.data.data
}

// ─── Blocked SSN ──────────────────────────────────────────────────────────────

export async function fetchBlockedSsns(params: BlockedSsnListParams = {}): Promise<BlockedSsnList> {
  const response = await http.get<BlockedSsnList>('/blocked-ssn', {
    params: buildParams(params as Record<string, unknown>),
  })
  return response.data
}

export async function blockSsn(payload: BlockSsnPayload): Promise<BlockedSsn> {
  const response = await http.post<{ data: BlockedSsn }>('/blocked-ssn', payload)
  return response.data.data
}

export async function unblockSsn(id: number): Promise<void> {
  await http.delete(`/blocked-ssn/${id}`)
}

/** Remove a block by the SSN value itself (used from the customer profile). */
export async function unblockSsnByValue(ssn: string): Promise<void> {
  await http.delete(`/blocked-ssn/by-ssn/${encodeURIComponent(ssn)}`)
}

// ─── GDPR Management ──────────────────────────────────────────────────────────

export async function fetchGdprCustomers(params: GdprListParams = {}): Promise<GdprCustomerList> {
  const response = await http.get<GdprCustomerList>('/gdpr/customers', {
    params: buildParams(params as Record<string, unknown>),
  })
  return response.data
}

export async function fetchGdprExclusionTypes(): Promise<GdprExclusionOption[]> {
  const response = await http.get<{ data: GdprExclusionOption[] }>('/gdpr/exclusion-types')
  return response.data.data
}

export async function gdprBulkAction(payload: GdprBulkActionPayload): Promise<void> {
  await http.post('/gdpr/bulk-action', payload)
}

export async function gdprFlag(customerId: number, exclusionType: GdprExclusionType): Promise<GdprCustomer> {
  const response = await http.put<{ data: GdprCustomer }>(`/customers/${customerId}/gdpr/flag`, {
    exclusion_type: exclusionType,
  })
  return response.data.data
}

export async function gdprUnflag(customerId: number): Promise<void> {
  await http.delete(`/customers/${customerId}/gdpr/flag`)
}

export async function gdprUpdateStatus(customerId: number, status: GdprStatus): Promise<GdprCustomer> {
  const response = await http.put<{ data: GdprCustomer }>(`/customers/${customerId}/gdpr/status`, { status })
  return response.data.data
}

export async function gdprAnonymize(customerId: number): Promise<GdprCustomer> {
  const response = await http.post<{ data: GdprCustomer }>(`/customers/${customerId}/gdpr/anonymize`)
  return response.data.data
}

export async function gdprDeanonymize(customerId: number): Promise<GdprCustomer> {
  const response = await http.post<{ data: GdprCustomer }>(`/customers/${customerId}/gdpr/deanonymize`)
  return response.data.data
}

// ─── Customer Change Log ──────────────────────────────────────────────────────

export async function fetchCustomerChanges(
  customerId: number,
  params: CustomerChangeListParams = {}
): Promise<CustomerChangeList> {
  const response = await http.get<CustomerChangeList>(`/customers/${customerId}/changes`, {
    params: buildParams(params as Record<string, unknown>),
  })
  return response.data
}

// ─── Insurance Policies ───────────────────────────────────────────────────────

export async function fetchCustomerPolicies(customerId: number): Promise<InsurancePolicyList> {
  const response = await http.get<InsurancePolicyList>(`/customers/${customerId}/policies`)
  return response.data
}

export async function createPolicy(
  customerId: number,
  payload: { product: string; start_date: string; relationship?: string | null }
): Promise<InsurancePolicy> {
  const response = await http.post<{ data: InsurancePolicy }>(`/customers/${customerId}/policies`, payload)
  return response.data.data
}

export async function cancelPolicy(id: string, endDate: string, reason: string): Promise<InsurancePolicy> {
  const response = await http.post<{ data: InsurancePolicy }>(`/policies/${id}/cancel`, { endDate, reason })
  return response.data.data
}

export async function syncPolicyStatus(id: string): Promise<InsurancePolicy> {
  const response = await http.post<{ data: InsurancePolicy }>(`/policies/${id}/sync-status`)
  return response.data.data
}

export async function deletePolicy(id: string): Promise<void> {
  await http.delete(`/policies/${id}`)
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function fetchCustomerSubscriptions(
  customerId: number,
  params: CustomerSubscriptionParams = {}
): Promise<SubscriptionGroupList> {
  const response = await http.get<SubscriptionGroupList>(`/customers/${customerId}/subscriptions`, {
    params: buildParams(params as Record<string, unknown>),
  })
  return response.data
}

export async function fetchSubscription(id: number): Promise<Subscription> {
  const response = await http.get<{ data: Subscription }>(`/subscriptions/${id}`)
  return response.data.data
}

export async function updateSubscription(id: number, nextShipment: string): Promise<Subscription> {
  const response = await http.patch<{ data: Subscription }>(`/subscriptions/${id}`, { next_shipment: nextShipment })
  return response.data.data
}

export async function deactivateSubscription(
  id: number,
  payload: { reason_id?: number; method?: string }
): Promise<Subscription> {
  const response = await http.post<{ data: Subscription }>(`/subscriptions/${id}/deactivate`, payload)
  return response.data.data
}

// ─── Store stats (profile cards) ───────────────────────────────────────────────

export async function fetchCustomerStoreStats(customerId: number): Promise<CustomerStoreStats> {
  const response = await http.get<{ data: CustomerStoreStats }>(`/customers/${customerId}/store-stats`)
  return response.data.data
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function fetchCustomerOrders(
  customerId: number,
  params: CustomerOrderParams = {}
): Promise<OrderGroupList> {
  const response = await http.get<OrderGroupList>(`/customers/${customerId}/orders`, {
    params: buildParams(params as Record<string, unknown>),
  })
  return response.data
}

export async function fetchOrders(params: Record<string, unknown> = {}): Promise<OrderList> {
  const response = await http.get<OrderList>('/orders', { params: buildParams(params) })
  return response.data
}

export async function fetchOrder(id: number): Promise<Order> {
  const response = await http.get<{ data: Order }>(`/orders/${id}`)
  return response.data.data
}

export async function cancelOrder(id: number, reason: string): Promise<Order> {
  const response = await http.post<{ data: Order }>(`/orders/${id}/cancel`, { reason })
  return response.data.data
}

export async function addOrderAdjustment(
  id: number,
  payload: {
    old_price: number
    new_price: number
    comment?: string
    rowid?: string | null
    prod_id?: number | string | null
    product_name?: string | null
  }
): Promise<OrderAdjustment> {
  const response = await http.post<{ data: OrderAdjustment }>(`/orders/${id}/adjustments`, payload)
  return response.data.data
}

export async function deleteOrderAdjustment(orderId: number, adjustmentId: number): Promise<void> {
  await http.delete(`/orders/${orderId}/adjustments/${adjustmentId}`)
}

// ─── Sinfrid Account ──────────────────────────────────────────────────────────

export async function fetchSinfridAccount(customerId: number): Promise<SinfridAccount> {
  const response = await http.get<{ data: SinfridAccount }>(`/customers/${customerId}/sinfrid-account`)
  return response.data.data
}

export async function createSinfridAccount(
  customerId: number,
  payload: { plan_id: number; activation_date?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null }
): Promise<SinfridAccount> {
  const response = await http.post<{ data: SinfridAccount }>(`/customers/${customerId}/sinfrid-account`, payload)
  return response.data.data
}

export async function updateSinfridAccount(
  accountId: string,
  payload: Partial<{ first_name: string | null; last_name: string | null; email: string | null; phone: string | null; city: string | null; street: string | null; zipcode: string | null }>
): Promise<SinfridAccount> {
  const response = await http.patch<{ data: SinfridAccount }>(`/sinfrid-account/${accountId}`, payload)
  return response.data.data
}

export async function fetchSinfridAlarms(customerId: number): Promise<SinfridAlarmList> {
  const response = await http.get<SinfridAlarmList>(`/customers/${customerId}/sinfrid-account/alarms`)
  return response.data
}

export async function fetchSinfridActivities(customerId: number): Promise<SinfridActivity[]> {
  const response = await http.get<{ data: SinfridActivity[] }>(`/customers/${customerId}/sinfrid-account/activities`)
  return response.data.data
}

export async function fetchSinfridPlans(): Promise<SinfridPlan[]> {
  const response = await http.get<{ data: SinfridPlan[] }>('/sinfrid-account/plans')
  return response.data.data
}

export async function addSinfridFamilyMember(accountId: string, payload: SinfridMemberPayload): Promise<SinfridMember> {
  const response = await http.post<{ data: SinfridMember }>(`/sinfrid-account/${accountId}/family-members`, payload)
  return response.data.data
}

export async function updateSinfridFamilyMember(
  accountId: string,
  memberId: string,
  payload: Partial<SinfridMemberPayload>
): Promise<SinfridMember> {
  const response = await http.patch<{ data: SinfridMember }>(
    `/sinfrid-account/${accountId}/family-members/${memberId}`,
    payload
  )
  return response.data.data
}

export async function removeSinfridFamilyMember(accountId: string, memberId: string): Promise<void> {
  await http.delete(`/sinfrid-account/${accountId}/family-members/${memberId}`)
}

export async function changeSinfridPlan(accountId: string, planId: number): Promise<SinfridAccount> {
  const response = await http.post<{ data: SinfridAccount }>(`/sinfrid-account/${accountId}/change-plan/${planId}`)
  return response.data.data
}

export async function setSinfridStatus(accountId: string, action: 'activate' | 'deactivate'): Promise<SinfridAccount> {
  const response = await http.patch<{ data: SinfridAccount }>(`/sinfrid-account/${accountId}/${action}`)
  return response.data.data
}

export async function deleteSinfridAccount(accountId: string): Promise<void> {
  await http.delete(`/sinfrid-account/${accountId}`)
}

// ─── Error helpers ────────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const serverMessage = error.response?.data?.message
    if (typeof serverMessage === 'string') return serverMessage
    if (error.response?.status === 404) return 'Not found.'
    if (error.response?.status === 422) return 'Invalid request parameters.'
    if (error.response?.status && error.response.status >= 500) return 'Server error. Please try again.'
  }
  return 'An unexpected error occurred.'
}
