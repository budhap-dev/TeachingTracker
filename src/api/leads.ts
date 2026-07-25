import type { Lead, LeadStatus } from '../data/students'
import { apiRequest } from './client'

/**
 * What a parent submits from the public /enquire form (REQ-018). `website` is
 * a honeypot — a hidden field real people leave blank; a filled one marks a
 * bot, which the API silently drops.
 */
export type LeadInput = {
    parentName: string
    email?: string
    phone?: string
    year: string
    subjects: string[]
    goal: string
    mode: Lead['mode']
    website?: string
}

/** POST /leads — public: submit an enquiry (lands as New in the inbox). */
export const submitLead = (input: LeadInput): Promise<void> =>
    apiRequest<{ ok: boolean }>('/leads', {
        method: 'POST',
        body: input,
    }).then(() => undefined)

/** GET /leads — teacher: the enquiries inbox, newest first. */
export const fetchLeads = (): Promise<Lead[]> => apiRequest<Lead[]>('/leads')

/** PUT /leads/{id} — teacher: move an enquiry through the inbox. */
export const updateLeadStatus = (
    id: number,
    status: LeadStatus
): Promise<Lead> =>
    apiRequest<Lead>(`/leads/${id}`, {
        method: 'PUT',
        body: { status },
    })
