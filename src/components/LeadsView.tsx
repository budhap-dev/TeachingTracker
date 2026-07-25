import { Button } from '@mui/material'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import type { Lead, LeadStatus } from '../data/students'

type LeadsViewProps = {
    /** The inbox, newest first (the API orders it). */
    leads: Lead[]
    onSetStatus: (id: number, status: LeadStatus) => void
    /** Opens the add-student form pre-filled from the lead (REQ-019). */
    onConvert: (lead: Lead) => void
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
 */
export const LeadsView = ({ leads, onSetStatus, onConvert }: LeadsViewProps) => (
    <section className="content-stack">
        <div className="card">
            <div className="section-header">
                <div>
                    <h3 className="page-heading">
                        <InboxOutlinedIcon fontSize="small" />
                        Leads
                    </h3>
                    <p className="section-subtitle">
                        Enquiries from the public site, newest first. Mark them
                        as you work them; convert the good ones into students.
                    </p>
                </div>
            </div>

            {leads.length === 0 ? (
                <p className="section-subtitle">
                    No enquiries yet. New ones from the Enquire page land here.
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
                                            onSetStatus(lead.id, 'Contacted')
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
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    </section>
)
