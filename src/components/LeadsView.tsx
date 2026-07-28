import { useState } from 'react'
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
} from '@mui/material'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import type { Lead, LeadStatus } from '../data/students'
import { paths } from '../paths'

type LeadsViewProps = {
    /** The inbox, newest first (the API orders it). */
    leads: Lead[]
    onSetStatus: (id: number, status: LeadStatus) => void
    /** Opens the add-student form pre-filled from the lead (REQ-019). */
    onConvert: (lead: Lead) => void
    /** Erases the enquiry entirely (REQ-032) — spam, or a parent asking to
        be forgotten. Distinct from a status: nothing is kept. */
    onDelete: (id: number) => void
}

/** '2026-07-24' → '24 Jul 2026'. */
const formatDate = (isoDate: string) =>
    new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })

const statusClass = (status: LeadStatus) => status.toLowerCase()

/**
 * The teacher's enquiries inbox (REQ-019). Each card shows what the family
 * submitted with its status; Contacted marks progress, and Convert opens the
 * add-student form pre-filled so a good lead becomes a student without
 * retyping. Converting is one-way from here (undo by re-marking Contacted).
 * Delete erases the enquiry outright (REQ-032), behind a confirm.
 */
export const LeadsView = ({
    leads,
    onSetStatus,
    onConvert,
    onDelete,
}: LeadsViewProps) => {
    // The enquiry a delete has been requested for, held until confirmed.
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

    const closeDialog = () => setPendingDeleteId(null)

    const confirmDelete = () => {
        onDelete(pendingDeleteId as number)
        closeDialog()
    }

    return (
        <section className="content-stack">
            <div className="card">
                <div className="section-header">
                    <div>
                        <h3 className="page-heading">
                            <InboxOutlinedIcon fontSize="small" />
                            Leads
                        </h3>
                        <p className="section-subtitle">
                            Enquiries from the public site, newest first. Mark
                            them as you work them; convert the good ones into
                            students.
                        </p>
                        {/* The privacy notice must reach families the teacher
                            enrols — converting is exactly that moment
                            (REQ-031). A nudge, never a blocker. */}
                        <p className="lead-privacy-reminder">
                            Converting an enquiry? Share the{' '}
                            <a href={paths.privacy}>privacy policy</a> with the
                            family as part of onboarding.
                        </p>
                    </div>
                </div>

                {leads.length === 0 ? (
                    <p className="section-subtitle">
                        No enquiries yet. New ones from the Enquire page land
                        here.
                    </p>
                ) : (
                    <ul className="lead-list">
                        {leads.map((lead) => (
                            <li
                                key={lead.id}
                                className={`lead-card ${statusClass(lead.status)}`}
                            >
                                <div className="lead-card-header">
                                    <strong>{lead.parentName}</strong>
                                    <span
                                        className={`lead-status-pill ${statusClass(lead.status)}`}
                                    >
                                        {lead.status}
                                    </span>
                                </div>
                                <p className="lead-meta">
                                    Year {lead.year} ·{' '}
                                    {lead.subjects.join(', ')} · {lead.mode}
                                    {' · '}
                                    {formatDate(lead.submittedOn)}
                                </p>
                                <blockquote className="lead-goal">
                                    {lead.goal}
                                </blockquote>
                                <p className="lead-contact">
                                    {lead.email && (
                                        <a href={`mailto:${lead.email}`}>
                                            {lead.email}
                                        </a>
                                    )}
                                    {lead.email && lead.phone && ' · '}
                                    {lead.phone && (
                                        <a
                                            href={`tel:${lead.phone.replace(/[^+\d]/g, '')}`}
                                        >
                                            {lead.phone}
                                        </a>
                                    )}
                                </p>
                                <div className="lead-actions">
                                    {lead.status === 'New' && (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() =>
                                                onSetStatus(
                                                    lead.id,
                                                    'Contacted'
                                                )
                                            }
                                        >
                                            Mark contacted
                                        </Button>
                                    )}
                                    {lead.status === 'Contacted' && (
                                        <Button
                                            size="small"
                                            variant="text"
                                            onClick={() =>
                                                onSetStatus(lead.id, 'New')
                                            }
                                        >
                                            Back to new
                                        </Button>
                                    )}
                                    {lead.status !== 'Converted' && (
                                        <Button
                                            size="small"
                                            variant="contained"
                                            startIcon={
                                                <PersonAddAltOutlinedIcon fontSize="small" />
                                            }
                                            onClick={() => onConvert(lead)}
                                        >
                                            Convert to student
                                        </Button>
                                    )}
                                    <IconButton
                                        size="small"
                                        className="lead-delete"
                                        aria-label={`Delete enquiry from ${lead.parentName}`}
                                        onClick={() =>
                                            setPendingDeleteId(lead.id)
                                        }
                                    >
                                        <DeleteOutlineRoundedIcon fontSize="small" />
                                    </IconButton>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Dialog open={pendingDeleteId !== null} onClose={closeDialog}>
                <DialogTitle>Delete this enquiry?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This erases the enquiry permanently — the family&apos;s
                        name, contact details and message — and can&apos;t be
                        undone. Use it for spam, or when a parent asks for
                        their details to be removed. To keep the record,
                        cancel and set a status instead.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Cancel</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={confirmDelete}
                    >
                        Delete permanently
                    </Button>
                </DialogActions>
            </Dialog>
        </section>
    )
}
