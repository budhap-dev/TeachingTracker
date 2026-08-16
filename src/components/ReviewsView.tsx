import { useEffect, useRef, useState } from 'react'
import { recommendationRoles } from '../data/students'
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

/** What the API accepts (testimonialService): 600 for a review, 80 a name. */
const MAX_QUOTE = 600
const MAX_NAME = 80

/**
 * How many reviews the wall shows before "Show more" (REQ-061). Twelve
 * reviews put the submit form four screens down on a phone; six puts it at
 * two and a half, and the page stops growing as reviews are approved.
 */
const FIRST_PAGE = 6

/** `#review-7` from REQ-059's "Read this review" links. */
const anchoredReviewId = (): number | null => {
    const match = /^#review-(\d+)$/.exec(window.location.hash)
    return match ? Number(match[1]) : null
}
import { requiredFieldProps } from '../utils/formValidation'
import { paths } from '../paths'

type ReviewsViewProps = {
    testimonials: Testimonial[]
    saving: boolean
    /** The published subjects drive the picker (owner report,
        2026-08-10 — the hardcoded list offered subjects not taught);
        empty falls back to the bundled defaults. */
    subjectChoices?: string[]
    onSubmit: (input: TestimonialInput) => void
    /** Rises when a submission lands, so the form clears only then. */
    sent?: number
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
    sent = 0,
    subjectChoices = subjectOptions,
}: ReviewsViewProps) => {
    const [authorName, setAuthorName] = useState('')
    const [role, setRole] = useState<TestimonialRole>('Parent')
    const [subjects, setSubjects] = useState<string[]>([])
    const [year, setYear] = useState('')
    const [rating, setRating] = useState(0)
    const [quote, setQuote] = useState('')
    // Counted the way the SERVER counts — JavaScript string length, so an
    // emoji is 2 and a family emoji is 8. A "friendlier" count would tell
    // someone they had room left and then the API would still say no.
    const quoteLeft = MAX_QUOTE - quote.length
    // Honeypot: hidden from people, tempting to bots. Left blank normally.
    const [website, setWebsite] = useState('')
    const [error, setError] = useState<string | null>(null)
    // The way to the form from the top of the page (REQ-060). With twelve
    // approved reviews the first field sits four screens down on a phone, and
    // nothing above the wall said writing one was even possible.
    const formRef = useRef<HTMLDivElement>(null)
    const nameRef = useRef<HTMLInputElement>(null)
    // The wall shows six until asked for the rest (REQ-061).
    const [showAll, setShowAll] = useState(false)
    // Errors show only after a submit is attempted (REQ-029). Each required
    // field then marks itself inline; `error` stays as the one-line summary.
    const [submitted, setSubmitted] = useState(false)

    const familyReviews = testimonials.filter(
        (testimonial) => !recommendationRoles.includes(testimonial.role)
    )
    const shownReviews = showAll
        ? familyReviews
        : familyReviews.slice(0, FIRST_PAGE)
    const hiddenCount = familyReviews.length - shownReviews.length
    const recommendations = testimonials.filter((testimonial) =>
        recommendationRoles.includes(testimonial.role)
    )

    // The API's own caps (testimonialService). Kept here so the form refuses
    // what the server would refuse, rather than letting someone write a
    // paragraph and lose it to a 400 (owner report, 2026-08-15).
    const nameMissing = !authorName.trim()
    // A recommendation (Professional/Personal) carries no star rating.
    const isRecommendation = recommendationRoles.includes(role)
    const ratingMissing = !isRecommendation && rating < 1
    const quoteMissing = !quote.trim()

    /**
     * Takes the visitor to the form and puts the cursor in it. Both halves
     * matter: the scroll alone leaves a keyboard user where they were, and
     * focus alone jumps the page without showing what happened. The scroll
     * respects reduced-motion the way the home page's notice does, and focus
     * gives up its own scrolling so the two do not fight.
     */
    const goToForm = () => {
        const behavior = (window.matchMedia?.('(prefers-reduced-motion: reduce)')
            .matches ?? true)
            ? ('auto' as const)
            : ('smooth' as const)
        formRef.current?.scrollIntoView?.({ behavior, block: 'start' })
        nameRef.current?.focus?.({ preventScroll: true })
    }

    /**
     * A "Read this review" link from Home (REQ-059) names one review, and it
     * may be behind the "Show more" button — where the browser cannot find it
     * to scroll to, and would silently leave the visitor at the top of the
     * page instead. So the wall opens first, and only then do we go there.
     *
     * `handledAnchor` keeps it to once: the effect re-runs when the review
     * list arrives, and a visitor who has since scrolled away should not be
     * yanked back.
     */
    const handledAnchor = useRef(false)
    useEffect(() => {
        const id = anchoredReviewId()
        if (id === null || handledAnchor.current || familyReviews.length === 0) {
            return
        }
        const index = familyReviews.findIndex((review) => review.id === id)
        if (index === -1) {
            // Rejected, deleted, or a recommendation — nothing to go to.
            handledAnchor.current = true
            return
        }
        if (index >= FIRST_PAGE && !showAll) {
            setShowAll(true)
            // Re-runs once the rest of the wall is on the page.
            return
        }
        handledAnchor.current = true
        const behavior = (window.matchMedia?.('(prefers-reduced-motion: reduce)')
            .matches ?? true)
            ? ('auto' as const)
            : ('smooth' as const)
        document
            .getElementById(`review-${id}`)
            ?.scrollIntoView?.({ behavior, block: 'start' })
    }, [familyReviews, showAll])

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        setSubmitted(true)
        if (nameMissing || quoteMissing || ratingMissing) {
            setError(
                isRecommendation
                    ? 'Please add your name and a few words.'
                    : 'Please add your name, a rating, and a few words.'
            )
            return
        }
        onSubmit({
            authorName: authorName.trim(),
            role,
            // Several subjects join into one string, like the class planner.
            subject: subjects.join(', ') || undefined,
            year: year.trim() || undefined,
            ...(isRecommendation ? {} : { rating }),
            quote: quote.trim(),
            website,
        })
        setError(null)
        // The fields are NOT cleared here. They used to be, which meant a
        // rejected review took the visitor's words with it (owner report,
        // 2026-08-15) — someone wrote a paragraph and watched it vanish
        // behind an error. They are cleared when the save actually lands.
        setSubmitted(false)
    }

    // Cleared on success, and only then: `sent` flips when the store
    // records the submission.
    useEffect(() => {
        if (sent > 0) {
            setAuthorName('')
            setRole('Parent')
            setSubjects([])
            setYear('')
            setRating(0)
            setQuote('')
            setWebsite('')
        }
    }, [sent])

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
                            What families say about tutoring with AbhiTutor.
                        </p>
                    </div>
                    <Button
                        className="write-review-button"
                        variant="contained"
                        onClick={goToForm}
                    >
                        Write a review
                    </Button>
                </div>

                {familyReviews.length === 0 ? (
                    <p className="section-subtitle">
                        No reviews yet — be the first to share your experience
                        below.
                    </p>
                ) : (
                    <div className="testimonial-grid">
                        {shownReviews.map((testimonial) => (
                            <figure
                                key={testimonial.id}
                                // Home's clamped quotes link straight to the
                                // whole of a review (REQ-059).
                                id={`review-${testimonial.id}`}
                                className="testimonial-card review"
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
                            </figure>
                        ))}
                    </div>
                )}

                {/* The rest of the wall, on request (REQ-061). A page that
                    grows with every approval is a page whose submit form
                    drifts further away every month. */}
                {hiddenCount > 0 && (
                    <>
                        <div className="reviews-more">
                            <Button
                                variant="outlined"
                                onClick={() => setShowAll(true)}
                            >
                                Show {hiddenCount} more{' '}
                                {hiddenCount === 1 ? 'review' : 'reviews'}
                            </Button>
                        </div>
                        <p className="section-subtitle reviews-count">
                            Showing {shownReviews.length} of{' '}
                            {familyReviews.length}
                        </p>
                    </>
                )}
            </div>

            {/* Endorsements from colleagues and referees — no star rating,
                their standing is the signal (owner ask, 2026-08-05). */}
            {recommendations.length > 0 && (
                <div className="card">
                    <div className="section-header">
                        <div>
                            <h4 className="offerings-heading">
                                Professional &amp; personal recommendations
                            </h4>
                            <p className="section-subtitle">
                                From colleagues, school staff and people who
                                know the teacher well.
                            </p>
                        </div>
                    </div>
                    <div className="testimonial-grid">
                        {recommendations.map((testimonial) => (
                            <figure
                                key={testimonial.id}
                                className="testimonial-card review recommendation"
                            >
                                <blockquote>{testimonial.quote}</blockquote>
                                <figcaption>
                                    <strong>{testimonial.authorName}</strong>
                                    <span>{attribution(testimonial)}</span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            )}

            <div className="card review-form-card" ref={formRef}>
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
                        inputRef={nameRef}
                        onChange={(event) => setAuthorName(event.target.value)}
                        slotProps={{ htmlInput: { maxLength: MAX_NAME } }}
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
                        onChange={(event) => {
                            const next = event.target
                                .value as TestimonialRole
                            setRole(next)
                            if (recommendationRoles.includes(next)) {
                                setRating(0)
                            }
                        }}
                        fullWidth
                    >
                        <MenuItem value="Parent">Parent</MenuItem>
                        <MenuItem value="Student">Student</MenuItem>
                        <MenuItem value="Professional">
                            Professional — colleague, school staff
                        </MenuItem>
                        <MenuItem value="Personal">
                            Personal recommendation
                        </MenuItem>
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
                        {subjectChoices.map((option) => (
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
                    {!isRecommendation && (
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
                    )}
                    <TextField
                        label="Your review"
                        size="small"
                        className="review-quote"
                        value={quote}
                        onChange={(event) => setQuote(event.target.value)}
                        slotProps={{ htmlInput: { maxLength: MAX_QUOTE } }}
                        {...requiredFieldProps(
                            submitted && quoteMissing,
                            'Please add a few words'
                        )}
                        multiline
                        minRows={3}
                        fullWidth
                    />
                    {/* The count comes down as they write, and turns urgent
                        near the end — so nobody meets the limit for the first
                        time by having their review refused. */}
                    <p
                        className={`review-remaining ${quoteLeft <= 50 ? 'low' : ''}`}
                        aria-live="polite"
                    >
                        {quoteLeft} character{quoteLeft === 1 ? '' : 's'} left
                    </p>
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
                        published review to be removed at any time — see my{' '}
                        <a href={paths.privacy}>privacy policy</a>.
                    </p>
                </Box>
            </div>
        </section>
    )
}
