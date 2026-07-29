import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Box, Button, MenuItem, TextField } from '@mui/material'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import type { Contact, ContactChannel } from '../data/contact'
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

/** Display order when nothing is preferred; a preferred channel goes first. */
const channelOrder: ContactChannel[] = ['email', 'call', 'whatsapp']

/**
 * Public page: how to get in touch. Shows no student data. The details are
 * teacher-editable (REQ-006/008) — a signed-in teacher gets an inline form;
 * a removed field simply drops its row for everyone else. Each channel can
 * carry an availability note ("Evenings and weekends only"), and one channel
 * can be marked preferred — it wears a pill and sorts first.
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
    const [notes, setNotes] = useState<Record<ContactChannel, string>>({
        email: '',
        call: '',
        whatsapp: '',
    })
    const [preferred, setPreferred] = useState<ContactChannel | ''>('')
    // Errors appear only once a save has been attempted — the shared REQ-029
    // convention (see formValidation.ts). Both fields are optional (blank
    // removes the row), so only a *malformed* value blocks the save.
    const [submitted, setSubmitted] = useState(false)

    const emailInvalid = email.trim() !== '' && !isValidEmail(email.trim())
    const phoneInvalid = phone.trim() !== '' && !isValidPhone(phone.trim())

    const startEditing = () => {
        setEmail(contact.email ?? '')
        setPhone(contact.phone ?? '')
        setNotes({
            email: contact.availability?.email ?? '',
            call: contact.availability?.call ?? '',
            whatsapp: contact.availability?.whatsapp ?? '',
        })
        setPreferred(contact.preferred ?? '')
        setSubmitted(false)
        setEditing(true)
    }

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        setSubmitted(true)
        if (emailInvalid || phoneInvalid) {
            return
        }
        onSave({
            email: email.trim(),
            phone: phone.trim(),
            availability: {
                email: notes.email.trim(),
                call: notes.call.trim(),
                whatsapp: notes.whatsapp.trim(),
            },
            preferred,
        })
        setEditing(false)
    }

    const hasAnyDetail = Boolean(contact.email || contact.phone)

    /** The rows on offer, preferred first. */
    const rows: {
        channel: ContactChannel
        label: string
        value: ReactNode
    }[] = []
    if (contact.email) {
        rows.push({
            channel: 'email',
            label: 'Email',
            value: (
                <a className="contact-value" href={`mailto:${contact.email}`}>
                    {contact.email}
                </a>
            ),
        })
    }
    if (contact.phone) {
        rows.push({
            channel: 'call',
            label: 'Call',
            value: (
                <span className="contact-value contact-phone">
                    <span className="contact-number">{contact.phone}</span>
                    <a
                        className="contact-icon"
                        href={toTelHref(contact.phone)}
                        aria-label={`Call ${contact.phone}`}
                    >
                        <PhoneRoundedIcon fontSize="small" />
                    </a>
                </span>
            ),
        })
        rows.push({
            channel: 'whatsapp',
            label: 'WhatsApp',
            value: (
                <span className="contact-value contact-phone">
                    <span className="contact-number">{contact.phone}</span>
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
            ),
        })
    }
    rows.sort(
        (left, right) =>
            (left.channel === contact.preferred ? -1 : 0) -
                (right.channel === contact.preferred ? -1 : 0) ||
            channelOrder.indexOf(left.channel) -
                channelOrder.indexOf(right.channel)
    )

    /** The channels the teacher can pick as preferred while editing. */
    const preferredOptions: { value: ContactChannel | ''; label: string }[] = [
        { value: '', label: 'No preference' },
        { value: 'email', label: 'Email' },
        { value: 'call', label: 'Call' },
        { value: 'whatsapp', label: 'WhatsApp' },
    ]

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
                        {/* Availability notes: prose, one line per channel.
                            A note only publishes while its channel is offered
                            — the API drops the rest. */}
                        <TextField
                            label="Email availability"
                            size="small"
                            placeholder="e.g. Anytime — we reply within a day"
                            value={notes.email}
                            onChange={(event) =>
                                setNotes((current) => ({
                                    ...current,
                                    email: event.target.value,
                                }))
                            }
                            fullWidth
                        />
                        <TextField
                            label="Call availability"
                            size="small"
                            placeholder="e.g. Evenings and weekends only"
                            value={notes.call}
                            onChange={(event) =>
                                setNotes((current) => ({
                                    ...current,
                                    call: event.target.value,
                                }))
                            }
                            fullWidth
                        />
                        <TextField
                            label="WhatsApp availability"
                            size="small"
                            placeholder="e.g. As per availability"
                            value={notes.whatsapp}
                            onChange={(event) =>
                                setNotes((current) => ({
                                    ...current,
                                    whatsapp: event.target.value,
                                }))
                            }
                            fullWidth
                        />
                        <TextField
                            select
                            label="Preferred contact method"
                            size="small"
                            value={preferred}
                            onChange={(event) =>
                                setPreferred(
                                    event.target.value as ContactChannel | ''
                                )
                            }
                            helperText="Shown with a badge, listed first."
                            fullWidth
                        >
                            {preferredOptions.map((option) => (
                                <MenuItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
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
                        {rows.map((row) => (
                            <li key={row.channel} className="contact-item">
                                <span className="contact-label">
                                    {row.label}
                                    {contact.preferred === row.channel && (
                                        <span className="contact-preferred-pill">
                                            Preferred
                                        </span>
                                    )}
                                </span>
                                <span className="contact-item-body">
                                    {row.value}
                                    {contact.availability?.[row.channel] && (
                                        <span className="contact-availability">
                                            {
                                                contact.availability[
                                                    row.channel
                                                ]
                                            }
                                        </span>
                                    )}
                                </span>
                            </li>
                        ))}
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
