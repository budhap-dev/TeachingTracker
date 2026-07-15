import type { PaymentRecord, PaymentStatus } from '../data/students'
import { apiRequest } from './client'

/** Optional filters for listing payments. */
export interface PaymentQuery {
    studentId?: number
    month?: string
    status?: PaymentStatus
}

/** Payload for saving a payment. `id` or (studentId, month) identifies the record. */
export interface PaymentInput {
    id?: number
    studentId: number
    month: string
    monthlyFee?: number
    amountPaid?: number
    status?: PaymentStatus
    notes?: string
    studentName?: string
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

/** POST /payments — create/update one payment or an array of them (upsert). */
export const savePayments = (
    payments: PaymentInput | PaymentInput[]
): Promise<PaymentRecord[]> =>
    apiRequest<PaymentRecord[]>('/payments', { method: 'POST', body: payments })
