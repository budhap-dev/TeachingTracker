import { useState } from 'react'
import type { FormEvent } from 'react'
import {
    Box,
    Button,
    Checkbox,
    ListItemText,
    MenuItem,
    TextField,
} from '@mui/material'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import type { Lead } from '../data/students'
import type { LeadInput } from '../api/leads'
import { subjectOptions, yearOptions } from '../utils/constants'

/** What the API accepts (leadService): a longer goal than a public review,
    because this one is a private message to the teacher. */
const MAX_GOAL = 1000
const MAX_NAME = 80
const MAX_CONTACT = 254
import {
    isValidEmail,
    isValidPhone,
    requiredFieldProps,
} from '../utils/formValidation'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { paths } from '../paths'

type EnquireViewProps = {
    /** An enquiry is on its way to the API. */
    saving: boolean
    /** True once this visit's enquiry has been accepted — shows the thanks. */
    submitted: boolean
    /** The published subjects drive the picker (owner report,
        2026-08-10 — the hardcoded list offered subjects not taught);
        empty falls back to the bundled defaults. */
    subjectChoices?: string[]
    onSubmit: (input: LeadInput) => void
}

const modeOptions: Lead['mode'][] = ['Online', 'Face to Face', 'Either']

/**
 * Public enquiry form (REQ-018): how a family starts, without composing a
 * cold email. Submissions land as New in the teacher's Leads inbox
 * (REQ-019). Validation follows the REQ-029 conventions — required markers
 * up front, red border + message on a missed field after a submit attempt.
 */
export const EnquireView = ({
    saving,
    submitted,
    onSubmit,
    subjectChoices = subjectOptions,
}: EnquireViewProps) => {
    useDocumentMeta(
        'Enquire about tutoring — AbhiTutor',
        'Tell me the subject, year and what your child wants from tutoring, and I will reply or contact you as soon as possible.'
    )
    const [parentName, setParentName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [year, setYear] = useState('')
    const [subjects, setSubjects] = useState<string[]>([])
    const [goal, setGoal] = useState('')
    const [mode, setMode] = useState<Lead['mode']>('Either')
    // Honeypot: hidden from people, tempting to bots. Left blank normally.
    const [website, setWebsite] = useState('')
    const [attempted, setAttempted] = useState(false)

    const nameMissing = !parentName.trim()
    // One contact method is enough, but a typed one must be well-formed.
    const emailTyped = email.trim() !== ''
    const phoneTyped = phone.trim() !== ''
    const contactMissing = !emailTyped && !phoneTyped
    const emailInvalid = emailTyped && !isValidEmail(email.trim())
    const phoneInvalid = phoneTyped && !isValidPhone(phone.trim())
    const yearMissing = !year
    const subjectsMissing = subjects.length === 0
    const goalMissing = !goal.trim()

    const blocked =
        nameMissing ||
        contactMissing ||
        emailInvalid ||
        phoneInvalid ||
        yearMissing ||
        subjectsMissing ||
        goalMissing

    // Counted the way the SERVER counts — JavaScript string length, so an
    // emoji is 2. A friendlier count would promise room the API refuses.
    const goalLeft = MAX_GOAL - goal.length

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        setAttempted(true)
        if (blocked) {
            return
        }
        onSubmit({
            parentName: parentName.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            year,
            subjects,
            goal: goal.trim(),
            mode,
            website,
        })
    }

    if (submitted) {
        return (
            <section className="content-stack">
                <div className="card enquire-thanks">
                    <CheckCircleOutlineRoundedIcon
                        className="enquire-thanks-icon"
                        fontSize="large"
                    />
                    <h3>Thank you — your enquiry is in.</h3>
                    <p>
                        I will reply or contact you as soon as possible —
                        the first step is a free, no-obligation assessment
                        session.
                    </p>
                </div>
            </section>
        )
    }

    return (
        <section className="content-stack">
            <div className="card">
                <div className="section-header">
                    <div>
                        <h3 className="page-heading">
                            <SendOutlinedIcon fontSize="small" />
                            Enquire about tutoring
                        </h3>
                        <p className="section-subtitle">
                            Tell me a little about your child and what you
                            are looking for — I will reply or contact you as
                            soon as possible.
                        </p>
                    </div>
                </div>

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    className="enquire-form"
                    noValidate
                >
                    <TextField
                        label="Your name"
                        size="small"
                        value={parentName}
                        slotProps={{ htmlInput: { maxLength: MAX_NAME } }}
                        onChange={(event) => setParentName(event.target.value)}
                        {...requiredFieldProps(
                            attempted && nameMissing,
                            'Your name is required'
                        )}
                        fullWidth
                    />
                    <TextField
                        select
                        label="Preferred lessons"
                        size="small"
                        value={mode}
                        onChange={(event) =>
                            setMode(event.target.value as Lead['mode'])
                        }
                        fullWidth
                    >
                        {modeOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        label="Email"
                        type="email"
                        size="small"
                        value={email}
                        slotProps={{ htmlInput: { maxLength: MAX_CONTACT } }}
                        onChange={(event) => setEmail(event.target.value)}
                        error={
                            attempted && (contactMissing || Boolean(emailInvalid))
                        }
                        helperText={
                            attempted && contactMissing
                                ? 'Give me an email or a phone number.'
                                : attempted && emailInvalid
                                  ? 'Enter a valid email address, like name@example.com.'
                                  : 'Either email or phone is fine.'
                        }
                        fullWidth
                    />
                    <TextField
                        label="Phone"
                        size="small"
                        value={phone}
                        slotProps={{ htmlInput: { maxLength: MAX_CONTACT } }}
                        onChange={(event) => setPhone(event.target.value)}
                        error={
                            attempted && (contactMissing || Boolean(phoneInvalid))
                        }
                        helperText={
                            attempted && phoneInvalid
                                ? 'Enter a valid phone number with at least 7 digits.'
                                : undefined
                        }
                        fullWidth
                    />
                    <TextField
                        select
                        label="Child's year"
                        size="small"
                        value={year}
                        onChange={(event) => setYear(event.target.value)}
                        {...requiredFieldProps(
                            attempted && yearMissing,
                            "The child's year is required"
                        )}
                        fullWidth
                    >
                        {yearOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                Year {option}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        label="Subject(s)"
                        size="small"
                        value={subjects}
                        slotProps={{
                            select: {
                                multiple: true,
                                renderValue: (selected) =>
                                    (selected as string[]).join(', '),
                            },
                        }}
                        onChange={(event) =>
                            setSubjects(
                                event.target.value as unknown as string[]
                            )
                        }
                        {...requiredFieldProps(
                            attempted && subjectsMissing,
                            'Pick at least one subject'
                        )}
                        fullWidth
                    >
                        {subjectChoices.map((option) => (
                            <MenuItem key={option} value={option}>
                                <Checkbox checked={subjects.includes(option)} />
                                <ListItemText primary={option} />
                            </MenuItem>
                        ))}
                    </TextField>
                    {/* The helper steers sensitive detail (health, SEN) away
                        from the stored free text — data minimisation
                        (REQ-031). The required error, when shown, wins. */}
                    <TextField
                        label="What would you like tutoring to achieve?"
                        size="small"
                        className="enquire-goal"
                        value={goal}
                        onChange={(event) => setGoal(event.target.value)}
                        slotProps={{ htmlInput: { maxLength: MAX_GOAL } }}
                        multiline
                        minRows={3}
                        {...requiredFieldProps(
                            attempted && goalMissing,
                            'A sentence or two about the goal is required'
                        )}
                        helperText={
                            attempted && goalMissing
                                ? 'A sentence or two about the goal is required'
                                : 'No need for health or special-educational-needs details here — anything sensitive is better discussed directly.'
                        }
                        fullWidth
                    />
                    {/* The count comes down as they write, and turns urgent
                        near the end — so nobody meets the limit for the first
                        time by having their enquiry refused. */}
                    <p
                        className={`enquire-remaining ${goalLeft <= 100 ? 'low' : ''}`}
                        aria-live="polite"
                    >
                        {goalLeft} character{goalLeft === 1 ? '' : 's'} left
                    </p>
                    {/* Honeypot: off-screen, not announced. Bots fill it; the
                        API silently drops anything that arrives with it set. */}
                    <input
                        type="text"
                        className="enquire-website"
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                        value={website}
                        onChange={(event) => setWebsite(event.target.value)}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        className="enquire-submit"
                    >
                        {saving ? 'Sending…' : 'Send enquiry'}
                    </Button>
                    <p className="enquire-consent">
                        I only use these details to reply about tutoring —
                        nothing else, and never shared. See my{' '}
                        <a href={paths.privacy}>privacy policy</a> for what I
                        keep and for how long.
                    </p>
                </Box>
            </div>
        </section>
    )
}
