import { useEffect } from 'react'
import { Button, Rating } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
    fetchOutcomesRequested,
    fetchSiteContentRequested,
    fetchTestimonialsRequested,
} from '../store/store'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { signIn } from '../auth/msal'

import { paths } from '../paths'
import type { Testimonial } from '../data/students'

import type { SiteContent } from '../data/siteContent'
import type { Outcomes } from '../data/outcomes'

type HomeViewProps = {
    /** Approved reviews for the proof strip; the view shows up to three. */
    testimonials: Testimonial[]
    /** The teacher-published document (REQ-008) feeding the hero + journey. */
    content: SiteContent
    /** Live outcome tallies (REQ-020); null (not yet loaded / API away)
        simply leaves the strip out. */
    outcomes: Outcomes | null
}

/** A friendly glyph for each journey step, in order (mirrors Offerings). */
const journeyIcons = ['💬', '📝', '🎯', '📅']

/**
 * The public Home landing (REQ-024): what a signed-out visitor sees at the
 * site root — the pitch, proof, and a route onward — instead of a bare
 * sign-in wall. The teacher's dashboard stays behind sign-in at the same
 * path; teacher sign-in is a quiet afterline here, not the headline.
 */
export const HomeView = ({ testimonials, content, outcomes }: HomeViewProps) => {
    useDocumentMeta(
        'Springboard Tutoring — one-to-one tutoring that builds confidence',
        'Personal tutoring in maths and the sciences for Years 7–13, online or in person. Matched to your exam board, planned around the school week.'
    )
    const { hero, journey } = content
    const proof = testimonials.slice(0, 3)
    const experienceYears = hero.experienceYears ?? 0

    return (
        <section className="content-stack home-view">
            <div className="card offerings-hero home-hero">
                <p className="eyebrow">{content.siteName}</p>
                <h3 className="offerings-hero-headline">{hero.headline}</h3>
                <p className="offerings-hero-subhead">{hero.subhead}</p>
                {hero.availability && (
                    <p className="offerings-availability">
                        {hero.availability}
                    </p>
                )}
                <div className="home-hero-actions">
                    <Button
                        variant="contained"
                        component={Link}
                        to={paths.contact}
                    >
                        Request a free assessment
                    </Button>
                    <Button
                        variant="outlined"
                        component={Link}
                        to={paths.offerings}
                    >
                        See what we offer
                    </Button>
                </div>
            </div>

            {/* The outcomes strip (REQ-020): real numbers only — the
                teacher-stated experience (site content) leads, and the live
                tallies follow. Hidden entirely until there is something to
                show, so a brand-new site never brags about zero. */}
            {(experienceYears > 0 ||
                (outcomes && outcomes.studentsTaught > 0)) && (
                <ul
                    className="card outcomes-strip"
                    aria-label="Teaching record so far"
                >
                    {experienceYears > 0 && (
                        <li>
                            <strong>{experienceYears}+</strong>
                            <span>years of tutoring experience</span>
                        </li>
                    )}
                    {outcomes && outcomes.studentsTaught > 0 && (
                        <>
                            <li>
                                <strong>{outcomes.studentsTaught}</strong>
                                <span>students taught</span>
                            </li>
                            {outcomes.sessionsDelivered > 0 && (
                                <li>
                                    <strong>
                                        {outcomes.sessionsDelivered}
                                    </strong>
                                    <span>classes delivered</span>
                                </li>
                            )}
                            {outcomes.hoursDelivered > 0 && (
                                <li>
                                    <strong>{outcomes.hoursDelivered}</strong>
                                    <span>hours of teaching</span>
                                </li>
                            )}
                            {outcomes.reviewCount > 0 && (
                                <li>
                                    <strong>
                                        {outcomes.averageRating}
                                        <span aria-hidden>★</span>
                                    </strong>
                                    <span>
                                        from {outcomes.reviewCount} family{' '}
                                        {outcomes.reviewCount === 1
                                            ? 'review'
                                            : 'reviews'}
                                    </span>
                                </li>
                            )}
                        </>
                    )}
                </ul>
            )}

            {proof.length > 0 && (
                <div className="card">
                    <div className="section-header">
                        <div>
                            <h4 className="offerings-heading">
                                What families say
                            </h4>
                        </div>
                        <Button
                            variant="text"
                            component={Link}
                            to={paths.reviews}
                        >
                            Read all reviews
                        </Button>
                    </div>
                    <div className="testimonial-grid">
                        {proof.map((testimonial) => (
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
                                    <span>{testimonial.role}</span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            )}

            <div className="card">
                <div className="section-header">
                    <div>
                        <h4 className="offerings-heading">How it works</h4>
                    </div>
                </div>
                <ol className="offerings-journey">
                    {journey.map((step, index) => (
                        <li key={step.title} className="offerings-step">
                            <span className="offerings-step-icon" aria-hidden>
                                {journeyIcons[index % journeyIcons.length]}
                            </span>
                            <div>
                                <strong>{step.title}</strong>
                                <p>{step.detail}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>

            <p className="home-teacher-line">
                Are you the teacher?{' '}
                <Button
                    size="small"
                    variant="text"
                    onClick={() => void signIn()}
                >
                    Sign in with Microsoft
                </Button>
            </p>
        </section>
    )
}

/**
 * The connected Home: loads the approved reviews itself — a visitor's first
 * request lands here, before any teacher boot fetches — and never blocks on
 * them (the hero renders at once; proof fills in).
 */
export const HomeLanding = () => {
    const dispatch = useAppDispatch()
    const testimonials = useAppSelector(
        (state) => state.students.testimonials
    )
    const content = useAppSelector((state) => state.students.siteContent)
    const outcomes = useAppSelector((state) => state.students.outcomes)
    useEffect(() => {
        dispatch(fetchTestimonialsRequested())
        dispatch(fetchSiteContentRequested())
        dispatch(fetchOutcomesRequested())
    }, [dispatch])
    return (
        <HomeView
            testimonials={testimonials}
            content={content}
            outcomes={outcomes}
        />
    )
}
