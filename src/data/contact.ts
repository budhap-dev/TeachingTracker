/**
 * Public contact details shown on the Contact page (REQ-006/008). Both fields
 * are optional: an absent one means the teacher has removed that method, and
 * the page omits its row entirely.
 */
export type Contact = {
    email?: string
    phone?: string
}
