import axios, { AxiosError } from 'axios'
import type {
  Customer,
  CustomerListParams,
  CustomerSearchParams,
  PaginatedResponse,
} from '@/types/customer'

const http = axios.create({
  baseURL: '/api',
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
