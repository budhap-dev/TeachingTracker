import { Button, Rating } from '@mui/material'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import type { Testimonial } from '../data/students'

type ReviewModerationViewProps = {
    pending: Testimonial[]
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
 * Teacher-only moderation queue (REQ-027): each pending review with its full
 * content and Approve / Reject / Delete actions. Approving publishes it to the
 * public Reviews page; rejecting and deleting keep it off.
 */
export const ReviewModerationView = ({
    pending,
    onApprove,
    onReject,
    onDelete,
}: ReviewModerationViewProps) => (
    <section className="content-stack">
        <div className="card">
            <div className="section-header">
                <div>
                    <h3 className="page-heading">
                        <FactCheckOutlinedIcon fontSize="small" />
                        Review moderation
                    </h3>
                    <p className="section-subtitle">
                        Reviews families have submitted. Approve to publish them
                        on the public Reviews page.
                    </p>
                </div>
            </div>

            {pending.length === 0 ? (
                <p className="section-subtitle">
                    No reviews waiting. New submissions appear here for you to
                    approve.
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
                                value={testimonial.rating}
                                readOnly
                                size="small"
                            />
                            <blockquote>{testimonial.quote}</blockquote>
                            <figcaption>
                                <strong>{testimonial.authorName}</strong>
                                <span>{attribution(testimonial)}</span>
                                <small>Submitted {testimonial.submittedOn}</small>
                            </figcaption>
                            <div className="moderation-actions">
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => onApprove(testimonial.id)}
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
                                    onClick={() => onDelete(testimonial.id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </figure>
                    ))}
                </div>
            )}
        </div>
    </section>
)
