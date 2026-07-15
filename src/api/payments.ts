import type {
    MonthlyPaymentGroup,
    PaymentRecord,
    PaymentStatus,
} from '../data/students'
import { apiRequest } from './client'

/** Optional filters for listing payments. */
export interface PaymentQuery {
    studentId?: number
    month?: string
    status?: PaymentStatus
}

/**
 * Payload for recording a payment, identified by (studentId, month).
 * Omit `amountPaid` to settle the month in full.
 */
export interface PaymentInput {
    studentId: number
    month: string
    amountPaid?: number
    notes?: string
}

const buildQuery = (query: PaymentQuery): string => {
    const params = new URLSearchParams()
    if (query.studentId !== undefined) {
        params.set('studentId', String(query.studentId))
    }
    if (query.month !== undefined) {
        params.set('month', query.month)
    }
    if (query.status !== undefined) {
        params.set('status', query.status)
    }
    const qs = params.toString()
    return qs ? `?${qs}` : ''
}

/** GET /payments — payment records, optionally filtered. */
export const fetchPayments = (
    query: PaymentQuery = {}
): Promise<PaymentRecord[]> =>
    apiRequest<PaymentRecord[]>(`/payments${buildQuery(query)}`)

/** GET /payments/by-month — payments grouped by month with server-side totals. */
export const fetchPaymentsByMonth = (
    query: PaymentQuery = {}
): Promise<MonthlyPaymentGroup[]> =>
    apiRequest<MonthlyPaymentGroup[]>(`/payments/by-month${buildQuery(query)}`)

/** POST /payments — records a payment; omit amountPaid to settle in full. */
export const savePayments = (
    payments: PaymentInput | PaymentInput[]
): Promise<PaymentRecord[]> =>
    apiRequest<PaymentRecord[]>('/payments', { method: 'POST', body: payments })
