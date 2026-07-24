import { useState } from 'react'
import type { FormEvent } from 'react'
import { Box, Button, TextField } from '@mui/material'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import type { Contact } from '../data/contact'
import type { ContactInput } from '../api/contact'
import { toTelHref, toWhatsAppHref } from '../data/siteContent'
import { isValidEmail, isValidPhone } from '../utils/formValidation'

type ContactViewProps = {
    contact: Contact
    /** True for the signed-in teacher: shows the edit affordance. */
    canEdit: boolean
    /** An update is in flight. */
    saving: boolean
    onSave: (input: ContactInput) => void
}

/**
 * Public page: how to get in touch. Shows no student data. The details are
 * teacher-editable (REQ-006/008) — a signed-in teacher gets an inline form;
 * a removed field simply drops its row for everyone else.
 */
export const ContactView = ({
    contact,
    canEdit,
    saving,
    onSave,
}: ContactViewProps) => {
    const [editing, setEditing] = useState(false)
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    // Errors appear only once a save has been attempted — the shared REQ-029
    // convention (see formValidation.ts). Both fields are optional (blank
    // removes the row), so only a *malformed* value blocks the save.
    const [submitted, setSubmitted] = useState(false)

    const emailInvalid = email.trim() !== '' && !isValidEmail(email.trim())
    const phoneInvalid = phone.trim() !== '' && !isValidPhone(phone.trim())

    const startEditing = () => {
        setEmail(contact.email ?? '')
        setPhone(contact.phone ?? '')
        setSubmitted(false)
        setEditing(true)
    }

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        setSubmitted(true)
        if (emailInvalid || phoneInvalid) {
            return
        }
        onSave({ email: email.trim(), phone: phone.trim() })
        setEditing(false)
    }

    const hasAnyDetail = Boolean(contact.email || contact.phone)

    return (
        <section className="content-stack">
            <div className="card">
                <div className="section-header">
                    <div>
                        <h3 className="page-heading">
                            <MailOutlineRoundedIcon fontSize="small" />
                            Contact us
                        </h3>
                        <p className="section-subtitle">
                            Questions about tutoring, availability, or a
                            particular subject? Get in touch and we&apos;ll come
                            back to you.
                        </p>
                    </div>
                    {canEdit && !editing && (
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditOutlinedIcon fontSize="small" />}
                            onClick={startEditing}
                        >
                            Edit details
                        </Button>
                    )}
                </div>

                {editing ? (
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        className="contact-form"
                        noValidate
                    >
                        <TextField
                            label="Email"
                            type="email"
                            size="small"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            error={submitted && emailInvalid}
                            helperText={
                                submitted && emailInvalid
                                    ? 'Enter a valid email address, like name@example.com.'
                                    : 'Leave blank to remove it from the page.'
                            }
                            fullWidth
                        />
                        <TextField
                            label="Phone"
                            size="small"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            error={submitted && phoneInvalid}
                            helperText={
                                submitted && phoneInvalid
                                    ? 'Enter a valid phone number with at least 7 digits.'
                                    : 'Used for the call and WhatsApp links. Leave blank to remove.'
                            }
                            fullWidth
                        />
                        <div className="contact-form-actions">
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={saving}
                            >
                                {saving ? 'Saving…' : 'Save details'}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setEditing(false)}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Box>
                ) : hasAnyDetail ? (
                    <ul className="contact-list">
                        {contact.email && (
                            <li className="contact-item">
                                <span className="contact-label">Email</span>
                                <a
                                    className="contact-value"
                                    href={`mailto:${contact.email}`}
                                >
                                    {contact.email}
                                </a>
                            </li>
                        )}
                        {contact.phone && (
                            <li className="contact-item">
                                <span className="contact-label">Phone</span>
                                <span className="contact-value contact-phone">
                                    <span className="contact-number">
                                        {contact.phone}
                                    </span>
                                    <a
                                        className="contact-icon"
                                        href={toTelHref(contact.phone)}
                                        aria-label={`Call ${contact.phone}`}
                                    >
                                        <PhoneRoundedIcon fontSize="small" />
                                    </a>
                                    <a
                                        className="contact-icon whatsapp"
                                        href={toWhatsAppHref(contact.phone)}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={`WhatsApp ${contact.phone}`}
                                    >
                                        <WhatsAppIcon fontSize="small" />
                                    </a>
                                </span>
                            </li>
                        )}
                    </ul>
                ) : (
                    <p className="section-subtitle">
                        Contact details will be available here soon.
                    </p>
                )}

                {!editing && (
                    <p className="contact-note">
                        We usually reply within a day. Lessons run in person or
                        online.
                    </p>
                )}
            </div>
        </section>
    )
}
