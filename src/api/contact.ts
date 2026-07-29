import type { Contact, ContactAvailability, ContactChannel } from '../data/contact'
import { apiRequest } from './client'

/**
 * What the teacher submits when editing contact details. Same shape as
 * {@link Contact}; a blank field is a removal the API drops. An empty-string
 * `preferred` clears the preference.
 */
export type ContactInput = {
    email?: string
    phone?: string
    availability?: ContactAvailability
    preferred?: ContactChannel | ''
}

/** GET /contact — public: the details shown on the Contact page. */
export const fetchContact = (): Promise<Contact> =>
    apiRequest<Contact>('/contact')

/** PUT /contact — teacher: update the details; the saved record comes back. */
export const updateContact = (input: ContactInput): Promise<Contact> =>
    apiRequest<Contact>('/contact', { method: 'PUT', body: input })
