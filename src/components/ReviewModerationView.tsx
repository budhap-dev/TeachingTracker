import { useState } from 'react'
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Rating,
} from '@mui/material'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import type { Testimonial } from '../data/students'

type ReviewModerationViewProps = {
    pending: Testimonial[]
    /** Approved reviews currently live on the public page. */
    published: Testimonial[]
    onApprove: (id: number) => void
    onReject: (id: number) => void
    onDelete: (id: number) => void
}

/** "Parent · Mathematics · Year 10", dropping absent optional parts. */
const attribution = (testimonial: Testimonial): string =>
    [
        testimonial.role,
        testimonial.subject,
        testimonial.year ? `Year ${testimonial.year}` : undefined,
    ]
        .filter(Boolean)
        .join(' · ')

/**
 * Teacher-only moderation queue (REQ-027): pending reviews to approve/reject and
 * the published ones. Deleting is permanent, so it asks first — cancelling keeps
 * the review, to approve later.
 */
export const ReviewModerationView = ({
    pending,
    published,
    onApprove,
    onReject,
    onDelete,
}: ReviewModerationViewProps) => {
    // The review a delete has been requested for, held until confirmed.
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
                            <FactCheckOutlinedIcon fontSize="small" />
                            Review moderation
                        </h3>
                        <p className="section-subtitle">
                            Reviews families have submitted. Approve to publish
                            them on the public Reviews page.
                        </p>
                    </div>
                </div>

                {pending.length === 0 ? (
                    <p className="section-subtitle">
                        No reviews waiting. New submissions appear here for you
                        to approve.
                    </p>
                ) : (
                    <div className="testimonial-grid">
                        {pending.map((testimonial) => (
                            <figure
                                key={testimonial.id}
                                className={`testimonial-card moderation${testimonial.flagged ? ' flagged' : ''}`}
                            >
                                {testimonial.flagged && (
                                    <p className="testimonial-flag" role="note">
                                        <WarningAmberRoundedIcon fontSize="small" />
                                        Flagged — check for offensive language
                                    </p>
                                )}
                                <Rating
                                    value={testimonial.rating ?? 0}
                                    readOnly
                                    size="small"
                                />
                                <blockquote>{testimonial.quote}</blockquote>
                                <figcaption>
                                    <strong>{testimonial.authorName}</strong>
                                    <span>{attribution(testimonial)}</span>
                                    <small>
                                        Submitted {testimonial.submittedOn}
                                    </small>
                                </figcaption>
                                <div className="moderation-actions">
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() =>
                                            onApprove(testimonial.id)
                                        }
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => onReject(testimonial.id)}
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        size="small"
                                        color="error"
                                        onClick={() =>
                                            setPendingDeleteId(testimonial.id)
                                        }
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </figure>
                        ))}
                    </div>
                )}
            </div>

            <div className="card">
                <div className="section-header">
                    <div>
                        <h4 className="offerings-heading">Published reviews</h4>
                        <p className="section-subtitle">
                            Live on the public Reviews page. Deleting one takes
                            it down and removes it for good.
                        </p>
                    </div>
                </div>

                {published.length === 0 ? (
                    <p className="section-subtitle">
                        No published reviews yet. Approved ones appear here.
                    </p>
                ) : (
                    <div className="testimonial-grid">
                        {published.map((testimonial) => (
                            <figure
                                key={testimonial.id}
                                className="testimonial-card moderation"
                            >
                                <Rating
                                    value={testimonial.rating ?? 0}
                                    readOnly
                                    size="small"
                                />
                                <blockquote>{testimonial.quote}</blockquote>
                                <figcaption>
                                    <strong>{testimonial.authorName}</strong>
                                    <span>{attribution(testimonial)}</span>
                                </figcaption>
                                <div className="moderation-actions">
                                    <Button
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        onClick={() =>
                                            setPendingDeleteId(testimonial.id)
                                        }
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </figure>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={pendingDeleteId !== null} onClose={closeDialog}>
                <DialogTitle>Delete this review?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This removes the review permanently and can&apos;t be
                        undone. To keep it for now — you can approve it later —
                        cancel instead.
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
