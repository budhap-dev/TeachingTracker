import { useState } from 'react'
import type { FormEvent } from 'react'
import {
    Box,
    Button,
    Checkbox,
    ListItemText,
    MenuItem,
    Rating,
    TextField,
} from '@mui/material'
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined'
import type { Testimonial, TestimonialRole } from '../data/students'
import type { TestimonialInput } from '../api/reviews'
import { subjectOptions, yearOptions } from '../utils/constants'
import { requiredFieldProps } from '../utils/formValidation'
import { paths } from '../paths'

type ReviewsViewProps = {
    testimonials: Testimonial[]
    saving: boolean
    onSubmit: (input: TestimonialInput) => void
}

/** "Parent · Mathematics · Year 10", dropping whichever optional parts are absent. */
const attribution = (testimonial: Testimonial): string =>
    [
        testimonial.role,
        testimonial.subject,
        testimonial.year ? `Year ${testimonial.year}` : undefined,
    ]
        .filter(Boolean)
        .join(' · ')

/** Public page: approved reviews as cards, plus a form to submit a new one. */
export const ReviewsView = ({
    testimonials,
    saving,
    onSubmit,
}: ReviewsViewProps) => {
    const [authorName, setAuthorName] = useState('')
    const [role, setRole] = useState<TestimonialRole>('Parent')
    const [subjects, setSubjects] = useState<string[]>([])
    const [year, setYear] = useState('')
    const [rating, setRating] = useState(0)
    const [quote, setQuote] = useState('')
    // Honeypot: hidden from people, tempting to bots. Left blank normally.
    const [website, setWebsite] = useState('')
    const [error, setError] = useState<string | null>(null)
    // Errors show only after a submit is attempted (REQ-029). Each required
    // field then marks itself inline; `error` stays as the one-line summary.
    const [submitted, setSubmitted] = useState(false)

    const nameMissing = !authorName.trim()
    const ratingMissing = rating < 1
    const quoteMissing = !quote.trim()

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        setSubmitted(true)
        if (nameMissing || quoteMissing || ratingMissing) {
            setError('Please add your name, a rating, and a few words.')
            return
        }
        onSubmit({
            authorName: authorName.trim(),
            role,
            // Several subjects join into one string, like the class planner.
            subject: subjects.join(', ') || undefined,
            year: year.trim() || undefined,
            rating,
            quote: quote.trim(),
            website,
        })
        setAuthorName('')
        setRole('Parent')
        setSubjects([])
        setYear('')
        setRating(0)
        setQuote('')
        setWebsite('')
        setError(null)
        setSubmitted(false)
    }

    return (
        <section className="content-stack">
            <div className="card">
                <div className="section-header">
                    <div>
                        <h3 className="page-heading">
                            <RateReviewOutlinedIcon fontSize="small" />
                            Reviews
                        </h3>
                        <p className="section-subtitle">
                            What families say about tutoring with Springboard.
                        </p>
                    </div>
                </div>

                {testimonials.length === 0 ? (
                    <p className="section-subtitle">
                        No reviews yet — be the first to share your experience
                        below.
                    </p>
                ) : (
                    <div className="testimonial-grid">
                        {testimonials.map((testimonial) => (
                            <figure
                                key={testimonial.id}
                                className="testimonial-card review"
                            >
                                <Rating
                                    value={testimonial.rating}
                                    readOnly
                                    size="small"
                                />
                                <blockquote>{testimonial.quote}</blockquote>
                                <figcaption>
                                    <strong>{testimonial.authorName}</strong>
                                    <span>{attribution(testimonial)}</span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                )}
            </div>

            <div className="card">
                <div className="section-header">
                    <div>
                        <h4 className="offerings-heading">
                            Share your experience
                        </h4>
                        <p className="section-subtitle">
                            Reviews are checked before they appear on the site.
                        </p>
                    </div>
                </div>

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    className="review-form"
                    noValidate
                >
                    <TextField
                        label="Your name"
                        size="small"
                        value={authorName}
                        onChange={(event) => setAuthorName(event.target.value)}
                        {...requiredFieldProps(
                            submitted && nameMissing,
                            'Your name is required'
                        )}
                        fullWidth
                    />
                    <TextField
                        select
                        label="You are a"
                        size="small"
                        value={role}
                        onChange={(event) =>
                            setRole(event.target.value as TestimonialRole)
                        }
                        fullWidth
                    >
                        <MenuItem value="Parent">Parent</MenuItem>
                        <MenuItem value="Student">Student</MenuItem>
                    </TextField>
                    <TextField
                        select
                        label="Subject (optional)"
                        size="small"
                        value={subjects}
                        slotProps={{
                            select: {
                                multiple: true,
                                renderValue: (selected) =>
                                    (selected as string[]).join(', '),
                                displayEmpty: true,
                            },
                            inputLabel: { shrink: true },
                        }}
                        onChange={(event) =>
                            setSubjects(
                                event.target.value as unknown as string[]
                            )
                        }
                        fullWidth
                    >
                        {subjectOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                <Checkbox
                                    checked={subjects.includes(option)}
                                />
                                <ListItemText primary={option} />
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        label="Year (optional)"
                        size="small"
                        value={year}
                        onChange={(event) => setYear(event.target.value)}
                        fullWidth
                    >
                        <MenuItem value="">Any year</MenuItem>
                        {yearOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                Year {option}
                            </MenuItem>
                        ))}
                    </TextField>
                    <div
                        className={`review-rating ${
                            submitted && ratingMissing ? 'has-error' : ''
                        }`}
                        role="radiogroup"
                        aria-labelledby="review-rating-label"
                        aria-required="true"
                        aria-invalid={submitted && ratingMissing}
                        aria-describedby={
                            submitted && ratingMissing
                                ? 'review-rating-error'
                                : undefined
                        }
                    >
                        <span id="review-rating-label">
                            Your rating{' '}
                            <span aria-hidden="true" className="required-mark">
                                *
                            </span>
                        </span>
                        <div className="star-buttons">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    type="button"
                                    key={value}
                                    className={`star ${value <= rating ? 'on' : ''}`}
                                    aria-label={`${value} Star${value === 1 ? '' : 's'}`}
                                    aria-pressed={value === rating}
                                    onClick={() => setRating(value)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        {submitted && ratingMissing && (
                            <span
                                id="review-rating-error"
                                className="review-field-error"
                            >
                                A rating is required
                            </span>
                        )}
                    </div>
                    <TextField
                        label="Your review"
                        size="small"
                        className="review-quote"
                        value={quote}
                        onChange={(event) => setQuote(event.target.value)}
                        {...requiredFieldProps(
                            submitted && quoteMissing,
                            'Please add a few words'
                        )}
                        multiline
                        minRows={3}
                        fullWidth
                    />
                    {/* Honeypot: off-screen, not announced. Bots fill it; the API
                        silently drops anything that arrives with it set. */}
                    <input
                        type="text"
                        className="review-website"
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                        value={website}
                        onChange={(event) => setWebsite(event.target.value)}
                    />
                    {error && (
                        <p className="review-error" role="alert">
                            {error}
                        </p>
                    )}
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        className="review-submit"
                    >
                        {saving ? 'Sending…' : 'Submit review'}
                    </Button>
                    <p className="review-consent">
                        By submitting, you agree your words and name may be
                        shown on this site once approved. You can ask for a
                        published review to be removed at any time — see our{' '}
                        <a href={paths.privacy}>privacy policy</a>.
                    </p>
                </Box>
            </div>
        </section>
    )
}
