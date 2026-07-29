/**
 * Public contact details shown on the Contact page (REQ-006/008). Both fields
 * are optional: an absent one means the teacher has removed that method, and
 * the page omits its row entirely.
 */

/** The three ways a family can get in touch. Call and WhatsApp share the one
    public phone number; they are separate channels because their availability
    differs (e.g. "call evenings only" vs "WhatsApp any time"). */
export type ContactChannel = 'email' | 'call' | 'whatsapp'

/** A short availability note per channel — prose, not a timetable. */
export type ContactAvailability = Partial<Record<ContactChannel, string>>

export type Contact = {
    email?: string
    phone?: string
    /** When to use each channel; the API keeps entries only for channels
        that are actually offered. */
    availability?: ContactAvailability
    /** The channel the teacher would rather be reached on, if any. */
    preferred?: ContactChannel
}
